/* Nexi Biometric Receiver — Cloudflare Worker speaking the ZKTeco/NGTeco
   "cloud push" (ADMS / iclock) protocol. The NGTeco time clock is pointed
   at this worker once (device MENU → COMM → Cloud Server Setting) and from
   then on it pushes every fingerprint/face punch here by itself — no PC
   needed. Nexi (IT module → 🖐 Biometric Sync) pulls the punches with a
   Bearer token and fills attendance automatically.

   DEPLOY
     wrangler.toml:
       name = "nexi-bio"
       main = "biometric-worker.js"
       compatibility_date = "2026-01-01"
       [[r2_buckets]]
       binding = "R2"
       bucket_name = "<SAME BUCKET AS hnx-sync>"
     secrets:
       BIO_TOKEN    # long random string; paste into Nexi IT → Biometric Sync
       DEVICE_SNS   # optional comma list of allowed device serial numbers
                    # (shown on the device About screen); empty = accept all

   DEVICE SETUP (on the clock):
     MENU → COMM. → Cloud Server Setting:
       Server Address: nexi-bio.<account>.workers.dev
       Server Port:    443   (enable HTTPS/SSL if offered)
     Make sure the device is on WiFi/LAN with internet.
*/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    /* ---------- device-facing (iclock protocol, plain text) ---------- */
    if (p === '/iclock/cdata' || p === '/iclock/getrequest' || p === '/iclock/devicecmd' || p === '/iclock/fdata') {
      const sn = url.searchParams.get('SN') || '';
      if (env.DEVICE_SNS && env.DEVICE_SNS.trim()) {
        const ok = env.DEVICE_SNS.split(',').map(s => s.trim()).filter(Boolean).includes(sn);
        if (!ok) return text('ERROR: unknown device');
      }
      ctx.waitUntil(touchDevice(env, sn));
      if (req.method === 'GET' && p === '/iclock/cdata') {
        // handshake: tell the clock to push realtime attendance, timezone +8 (PH)
        return text(
          `GET OPTION FROM: ${sn}\nStamp=9999\nOpStamp=9999\nPhotoStamp=0\n` +
          `ErrorDelay=30\nDelay=10\nTransTimes=00:00;14:00\nTransInterval=1\n` +
          `TransFlag=TransData AttLog\tOpLog\nTimeZone=8\nRealtime=1\nEncrypt=None`);
      }
      if (req.method === 'POST' && p === '/iclock/cdata') {
        const table = url.searchParams.get('table') || '';
        const body = await req.text();
        if (table === 'ATTLOG') {
          const n = await storePunches(env, sn, body);
          return text('OK: ' + n);
        }
        return text('OK');
      }
      return text('OK'); // getrequest polling / other tables
    }

    /* ---------- Nexi-facing (JSON, Bearer token) ---------- */
    const auth = req.headers.get('Authorization') || '';
    if (!env.BIO_TOKEN || auth !== 'Bearer ' + env.BIO_TOKEN) return json({ error: 'unauthorized' }, 401);
    if (p === '/bio/punches') {
      const days = Math.min(14, Math.max(1, Number(url.searchParams.get('days')) || 2));
      const out = [];
      for (let i = 0; i < days; i++) {
        const d = phDate(-i);
        const obj = await env.R2.get('bio/punches/' + d + '.json');
        if (obj) { try { out.push({ date: d, punches: await obj.json() }); } catch {} }
      }
      return json({ ok: true, days: out });
    }
    if (p === '/bio/import' && req.method === 'POST') {
      /* NGTeco Office route: the Gmail bridge (workers/gmail-bio-bridge.gs)
         parses the scheduled NGTeco report emails and posts punches here:
         { punches: [ { userId, ts: "YYYY-MM-DD HH:MM[:SS]", sn? } ] } */
      const body = await req.json().catch(() => ({}));
      const list = Array.isArray(body.punches) ? body.punches : [];
      const lines = list
        .filter(x => x && x.userId && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(String(x.ts || '')))
        .map(x => `${String(x.userId).trim()}\t${String(x.ts).slice(0, 19)}\t\t`)
        .join('\n');
      const n = lines ? await storePunches(env, body.sn || 'NGTECO-OFFICE', lines) : 0;
      await touchDevice(env, body.sn || 'NGTECO-OFFICE');
      return json({ ok: true, imported: n });
    }
    if (p === '/bio/status') {
      const obj = await env.R2.get('bio/devices.json');
      let devices = {};
      if (obj) { try { devices = await obj.json(); } catch {} }
      return json({ ok: true, devices });
    }
    return json({ error: 'not found' }, 404);
  },
};

function text(s) { return new Response(s, { headers: { 'Content-Type': 'text/plain' } }); }
function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
/* Philippines calendar date, offset in days */
function phDate(offset) {
  const d = new Date(Date.now() + 8 * 3600e3 + offset * 86400e3);
  return d.toISOString().slice(0, 10);
}

async function touchDevice(env, sn) {
  if (!sn) return;
  let devices = {};
  const obj = await env.R2.get('bio/devices.json');
  if (obj) { try { devices = await obj.json(); } catch {} }
  devices[sn] = { lastSeen: new Date().toISOString() };
  await env.R2.put('bio/devices.json', JSON.stringify(devices));
}

/* ATTLOG body: one punch per line, tab separated:
   <deviceUserId> \t <YYYY-MM-DD HH:MM:SS> \t <state> \t <verifyMode> ... */
async function storePunches(env, sn, body) {
  const byDate = {};
  let n = 0;
  for (const line of body.split('\n')) {
    const f = line.trim().split('\t');
    if (f.length < 2) continue;
    const userId = f[0].trim();
    const ts = f[1].trim(); // device local time (PH)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(ts)) continue;
    const date = ts.slice(0, 10);
    (byDate[date] = byDate[date] || []).push({
      userId, time: ts.slice(11, 16), ts, sn,
      state: f[2] !== undefined ? f[2] : '', verify: f[3] !== undefined ? f[3] : '',
    });
    n++;
  }
  for (const date of Object.keys(byDate)) {
    const key = 'bio/punches/' + date + '.json';
    let existing = [];
    const obj = await env.R2.get(key);
    if (obj) { try { existing = await obj.json(); } catch {} }
    const seen = new Set(existing.map(p => p.userId + '|' + p.ts));
    for (const pch of byDate[date]) {
      const k = pch.userId + '|' + pch.ts;
      if (!seen.has(k)) { existing.push(pch); seen.add(k); }
    }
    await env.R2.put(key, JSON.stringify(existing));
  }
  return n;
}
