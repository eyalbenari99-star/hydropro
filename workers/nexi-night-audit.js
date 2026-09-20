/* nexi-night-audit — Cloudflare Worker: nightly anomaly scan (v20.90, phase 1 of the Night Auditor
 * work plan). Runs once a night (Cloudflare Cron Trigger), pulls the same synced data the app itself
 * reads, checks it against the rules below, and stores the findings so the app can show them at
 * 06:00 before anyone opens a screen.
 *
 * Rule 1 (this ship): GPS-vs-odometer gap. This is a straight, deliberate port of window._gpsOdoGap()
 * in index.html (added v20.88) — SAME thresholds (>25% danger, >15% warn), so a finding here always
 * matches what the GPS Daily Report screen itself would show for that vehicle/day. If _gpsOdoGap()'s
 * thresholds ever change, this copy must change with it (there is no way for a Worker to import code
 * from index.html, so the two are kept in lockstep by hand — see tests/payroll's GPS fixture, which
 * both this file and index.html are checked against).
 * Rules 2-4 (weird hours, unlikely absence, draft-run-hits-open-finding) are a later phase.
 *
 * Data source: this worker has no direct access to Nexi's cloud store — it authenticates to the
 * existing hnx-sync worker (https://hnx-sync.eyalbenari99.workers.dev) exactly the way the app itself
 * does: POST /auth/app-login with a service account's username+password-hash to get a bearer token,
 * then GET /sync/pull with that token. hnx-sync's own source is not in this repo (deployed separately);
 * this worker only ever calls its existing read endpoints, never writes.
 *
 * Deploy (wrangler):
 *   name = "nexi-night-audit"  main = "nexi-night-audit.js"  compatibility_date = "2026-08-01"
 *   [vars] APP_ORIGIN = "https://aba-pardes-monitoring.netlify.app"   (CORS; comma-separate several)
 *   [triggers] crons = ["0 18 * * *"]   (18:00 UTC = 02:00 Asia/Manila)
 *   kv_namespaces = [{ binding = "AUDIT_KV", id = "<create with: wrangler kv:namespace create AUDIT_KV>" }]
 *   secrets:
 *     HNX_SYNC_USER      - a Nexi username with read access (service account, not a real person's login)
 *     HNX_SYNC_PASS_HASH - that user's stored passwordHash (same hashing as hydroPro_users.passwordHash)
 *     NIGHT_AUDIT_TOKEN  - optional; when set, GET /audit/latest and POST /audit/run require
 *                          Authorization: Bearer <NIGHT_AUDIT_TOKEN>
 *
 * Then put this worker's URL in Nexi → Administration → (a later phase adds the settings field);
 * for now the app reads GET /audit/latest directly against the URL configured at deploy time.
 */

const HNX_SYNC_BASE = 'https://hnx-sync.eyalbenari99.workers.dev';
const KV_PREFIX = 'audit:';
const KV_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

function cors(env, req) {
  const origins = String(env.APP_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);
  const o = req.headers.get('Origin') || '';
  const allow = origins.includes('*') ? '*' : (origins.includes(o) ? o : origins[0]);
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
}
function json(obj, status, hdr) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, hdr || {}) }); }
function todayManila() {
  // Asia/Manila is UTC+8 with no DST — a fixed 8h offset is exact, not an approximation.
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
function lastNDaysManila(n) {
  const out = [];
  const base = new Date(Date.now() + 8 * 60 * 60 * 1000);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base); d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/* Exact port of index.html's window._gpsOdoGap (v20.88) — keep thresholds identical. */
function _gpsOdoGap(odoKm, totalDist) {
  if (odoKm == null || isNaN(odoKm) || odoKm <= 0 || totalDist == null || isNaN(totalDist)) return null;
  const gapKm = Math.round((totalDist - odoKm) * 100) / 100;
  const gapPct = Math.round((gapKm / odoKm) * 1000) / 10;
  const flag = Math.abs(gapPct) > 25 ? 'danger' : (Math.abs(gapPct) > 15 ? 'warn' : 'ok');
  return { gapKm, gapPct, flag };
}

/* Mirrors _computeGpsStops()'s totalDist definition closely enough for the audit's purpose: sum of
 * consecutive stop-to-stop leg distances recorded on the report (the 'km' field on each stop), which
 * is exactly what totalDist means to _gpsOdoGap. A report with fewer than 2 stops has no legs to sum. */
function totalDistFromStops(stops) {
  if (!Array.isArray(stops) || stops.length < 2) return null;
  let sum = 0, any = false;
  for (let i = 1; i < stops.length; i++) {
    const a = +stops[i - 1].km, b = +stops[i].km;
    if (isNaN(a) || isNaN(b)) continue;
    sum += Math.abs(b - a); any = true;
  }
  return any ? sum : null;
}

async function hnxSyncToken(env) {
  const r = await fetch(HNX_SYNC_BASE + '/auth/app-login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: String(env.HNX_SYNC_USER || '').toLowerCase(), hash: env.HNX_SYNC_PASS_HASH })
  });
  if (!r.ok) throw new Error('hnx-sync login failed: ' + r.status);
  const d = await r.json();
  if (!d || !d.token) throw new Error('hnx-sync login returned no token');
  return d.token;
}

async function pullSyncedData(env) {
  const token = await hnxSyncToken(env);
  const r = await fetch(HNX_SYNC_BASE + '/sync/pull', { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('hnx-sync pull failed: ' + r.status);
  return r.json();
}

/* Rule 1: GPS-vs-odometer gap, last 3 Manila days. A 'warn' only becomes a finding when the SAME
 * vehicle repeats it two days running (filters ordinary one-off GPS jitter); 'danger' is always a
 * finding, the first time it happens. */
function runRule1GpsGap(data) {
  const reports = (data && data.hydroPro_gps_reports) || {};
  const days = lastNDaysManila(3);
  const byVehicleDay = {}; // vehicleId -> {date: flag}
  const findings = [];
  for (const key in reports) {
    const rep = reports[key]; if (!rep || !rep.date || !rep.vehicleId) continue;
    if (days.indexOf(rep.date) === -1) continue;
    const odoOut = +rep.odoOut, odoIn = +rep.odoIn;
    const odoKm = (!isNaN(odoOut) && !isNaN(odoIn) && odoIn > odoOut) ? (odoIn - odoOut) : null;
    const totalDist = totalDistFromStops(rep.stops);
    const gap = _gpsOdoGap(odoKm, totalDist);
    if (!gap || gap.flag === 'ok') continue;
    byVehicleDay[rep.vehicleId] = byVehicleDay[rep.vehicleId] || {};
    byVehicleDay[rep.vehicleId][rep.date] = gap;
  }
  for (const vehicleId in byVehicleDay) {
    const byDate = byVehicleDay[vehicleId];
    for (const date in byDate) {
      const gap = byDate[date];
      if (gap.flag === 'danger') {
        findings.push({ rule: 'gps_odo_gap', severity: 'danger', entity: vehicleId, date, detail: `GPS ${gap.gapKm > 0 ? '+' : ''}${gap.gapKm} km (${gap.gapPct > 0 ? '+' : ''}${gap.gapPct}%) vs odometer`, link: 'fleet_gps' });
      } else if (gap.flag === 'warn') {
        const prevIdx = days.indexOf(date) - 1;
        const prevDate = prevIdx >= 0 ? days[prevIdx] : null;
        if (prevDate && byDate[prevDate] && byDate[prevDate].flag === 'warn') {
          findings.push({ rule: 'gps_odo_gap', severity: 'warn', entity: vehicleId, date, detail: `GPS gap ${gap.gapPct > 0 ? '+' : ''}${gap.gapPct}% two days running`, link: 'fleet_gps' });
        }
      }
    }
  }
  return findings;
}

async function runAudit(env) {
  const data = await pullSyncedData(env);
  const findings = [].concat(runRule1GpsGap(data));
  const result = { generatedAt: new Date().toISOString(), date: todayManila(), findings, coverage: { rulesRun: ['gps_odo_gap'] } };
  if (env.AUDIT_KV) await env.AUDIT_KV.put(KV_PREFIX + result.date, JSON.stringify(result), { expirationTtl: KV_TTL_SECONDS });
  return result;
}

function checkAuth(env, req) {
  if (!env.NIGHT_AUDIT_TOKEN) return true;
  const a = req.headers.get('Authorization') || '';
  return a === 'Bearer ' + env.NIGHT_AUDIT_TOKEN;
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (url.pathname === '/audit/health') return json({ ok: true, service: 'nexi-night-audit' }, 200, h);
    if (!checkAuth(env, req)) return json({ ok: false, error: 'unauthorized' }, 401, h);
    if (url.pathname === '/audit/latest' && req.method === 'GET') {
      if (!env.AUDIT_KV) return json({ ok: false, error: 'AUDIT_KV not bound' }, 500, h);
      const date = url.searchParams.get('date') || todayManila();
      const stored = await env.AUDIT_KV.get(KV_PREFIX + date);
      if (!stored) {
        // fall back to yesterday's result, since /audit/latest is read before the night's run may have landed
        const prev = lastNDaysManila(2)[0];
        const prevStored = prev ? await env.AUDIT_KV.get(KV_PREFIX + prev) : null;
        if (prevStored) return json(JSON.parse(prevStored), 200, h);
        return json({ generatedAt: null, date, findings: [], coverage: { rulesRun: [] } }, 200, h);
      }
      return json(JSON.parse(stored), 200, h);
    }
    if (url.pathname === '/audit/run' && req.method === 'POST') {
      try { return json(await runAudit(env), 200, h); }
      catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 200, h); }
    }
    return json({ ok: false, error: 'not found' }, 404, h);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runAudit(env).catch(() => {}));
  }
};
