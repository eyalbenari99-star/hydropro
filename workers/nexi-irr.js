/* Nexi Irrigation Receiver (nexi-irr) — pool sensor readings for the Pool Monitor: EC, pH, water temperature and water level
   for GH1–GH10 (P01–P10) and PRJ11 (P11A, P11B). Eyal, 12 Oct 2026: "I need guidelines how to connect Nexi to EC PH water level
   pool asap" — the guide is the doc "Connecting the pool sensors (EC, pH, water level) to Nexi".

   Two ways in, one store:
     1. The Pro-Leaf (BeLeaf) cloud that the BeHive-I units report to — polled every 5 minutes by the cron below once the web
        version's calls are known (pollProLeaf; until then it records "not configured" and does nothing).
     2. POST /irr/push from a node we own: a listen-only RS485 tap on a BeHive-I sensor cable, or our own probes. Each node has
        its own token and may only write its own pools.
   Nexi (Pool Monitor) pulls GET /irr/latest every 3 minutes with IRR_TOKEN and fills the controller boxes of the round.

   DEPLOY (Cloudflare dashboard or wrangler):
     wrangler.toml:
       name = "nexi-irr"
       main = "nexi-irr.js"
       compatibility_date = "2026-01-01"
       [[r2_buckets]]
       binding = "R2"
       bucket_name = "<SAME BUCKET AS nexi-bio>"
       [triggers]
       crons = ["0,5,10,15,20,25,30,35,40,45,50,55 * * * *"]   # every 5 minutes
     secrets (set by the owner in Cloudflare, never pasted in chat):
       IRR_TOKEN     long random string; Nexi → Pool Monitor → 📡 Sensor feed keeps it on each computer only
       NODE_TOKENS   JSON {"tap-room1-2":{"token":"<long random>","pools":["P01","P02"]}, …} — one entry per node
       PROLEAF_USER, PROLEAF_PASS   the Pro-Leaf account (it@abapardes.com.ph) — only when way 1 is wired
       PROLEAF_MAP   JSON {"<BeHive id>:<reservoir>":"P01", …} — which reservoir is which pool

   Storage (R2, small objects, nothing overwritten by an older reading):
     irr/latest/<pool>.json            the newest reading of a pool
     irr/day/<YYYY-MM-DD>/<pool>/<ts>-<node>.json   every reading, Manila day (a repeat of the same ts + node is stored once)
     irr/node/<node>.json              last seen, readings taken, pools
     irr/proleaf.json                  the cloud poll's last state
*/

const POOLS = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11A', 'P11B'];
/* plausible ranges — a value outside is a probe out of the water, a wiring fault or a typo, never a reading */
const LIMITS = { ec: [0, 10], ph: [0, 14], wt: [0, 60], level_cm: [0, 400] };
const MAX_AHEAD_MS = 2 * 60e3, MAX_AGE_MS = 7 * 864e5, MAX_READINGS = 200;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

/* the same length-independent compare for every token */
function same(a, b) {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0 && a.length > 0;
}
const bearer = req => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
function nodes(env) { try { const o = JSON.parse(env.NODE_TOKENS || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
function nodeFor(env, token) {
  for (const [name, n] of Object.entries(nodes(env))) if (n && same(token, n.token)) return { name, pools: Array.isArray(n.pools) ? n.pools : [] };
  return null;
}
const manilaDay = ms => new Date(ms + 8 * 3600e3).toISOString().slice(0, 10);
const round = (v, d) => Math.round(v * 10 ** d + 1e-9) / 10 ** d;

/* one reading in → a clean reading out, or the reason it was refused */
export function normalize(r, now) {
  if (!r || typeof r !== 'object') return { error: 'not a reading' };
  const pool = String(r.pool || '').trim().toUpperCase();
  if (!POOLS.includes(pool)) return { error: 'unknown pool ' + (pool || '(none)') };
  let ts = typeof r.ts === 'number' ? r.ts : Date.parse(r.ts || '');
  if (!isFinite(ts)) ts = now;
  if (ts > now + MAX_AHEAD_MS) ts = now;                 /* a node with a wrong clock never writes into the future */
  if (ts < now - MAX_AGE_MS) return { error: 'older than 7 days' };
  const out = { pool, ts };
  const num = v => (v === null || v === undefined || v === '') ? null : Number(v);
  const lvl = r.level_cm != null ? num(r.level_cm) : (r.level_m != null ? num(r.level_m) * 100 : null); /* BeLeaf reports metres */
  const vals = { ec: num(r.ec), ph: num(r.ph), wt: num(r.wt), level_cm: lvl };
  let any = false;
  for (const [k, v] of Object.entries(vals)) {
    if (v === null) continue;
    if (!isFinite(v) || v < LIMITS[k][0] || v > LIMITS[k][1]) return { error: k + ' out of range: ' + v };
    out[k] = round(v, k === 'wt' || k === 'level_cm' ? 1 : 2); any = true;
  }
  if (!any) return { error: 'no values' };
  return { reading: out };
}

async function getJson(env, key) { const o = await env.R2.get(key); if (!o) return null; try { return JSON.parse(await o.text()); } catch (e) { return null; } }
async function putJson(env, key, v) { await env.R2.put(key, JSON.stringify(v), { httpMetadata: { contentType: 'application/json' } }); }

/* store readings from one node; returns {stored, duplicates, refused:[{i, error}]} */
export async function store(env, node, allowed, readings, now) {
  const res = { stored: 0, duplicates: 0, refused: [] };
  const list = Array.isArray(readings) ? readings.slice(0, MAX_READINGS) : [];
  if (Array.isArray(readings) && readings.length > MAX_READINGS) res.refused.push({ i: MAX_READINGS, error: 'more than ' + MAX_READINGS + ' readings in one push' });
  const pools = new Set();
  for (let i = 0; i < list.length; i++) {
    const n = normalize(list[i], now);
    if (n.error) { res.refused.push({ i, error: n.error }); continue; }
    const r = n.reading;
    if (allowed && !allowed.includes(r.pool)) { res.refused.push({ i, error: 'pool ' + r.pool + ' is not this node\'s' }); continue; }
    const key = `irr/day/${manilaDay(r.ts)}/${r.pool}/${r.ts}-${node}.json`;
    if (await env.R2.head(key)) { res.duplicates++; continue; }
    const rec = { ...r, node, received: now };
    await putJson(env, key, rec);
    const latest = await getJson(env, `irr/latest/${r.pool}.json`);
    if (!latest || !(latest.ts > r.ts)) await putJson(env, `irr/latest/${r.pool}.json`, rec); /* an older reading never replaces a newer one */
    res.stored++; pools.add(r.pool);
  }
  const prev = (await getJson(env, `irr/node/${node}.json`)) || { count: 0, pools: [] };
  await putJson(env, `irr/node/${node}.json`, { node, lastSeen: now, count: (prev.count || 0) + res.stored, pools: [...new Set([...(prev.pools || []), ...pools])].sort() });
  return res;
}

/* Way 1 — the Pro-Leaf cloud. Wired once a sanitized capture of the web version (guardian.pro-leaf.com) shows its calls.
   Until then it only says why it did nothing; it never logs in with a guessed address. */
export async function pollProLeaf(env, now) {
  if (!env.PROLEAF_USER || !env.PROLEAF_PASS) return { state: 'not configured', at: now, readings: [] };
  return { state: 'waiting for the Pro-Leaf web calls (send the sanitized HAR)', at: now, readings: [] };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, now = Date.now();
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!env.R2) return json({ error: 'R2 binding missing' }, 500);

    if (p === '/irr/push' && req.method === 'POST') {
      const node = nodeFor(env, bearer(req));
      if (!node) return json({ error: 'unauthorized' }, 401);
      let body; try { body = await req.json(); } catch (e) { return json({ error: 'body is not JSON' }, 400); }
      const res = await store(env, node.name, node.pools, body && body.readings, now);
      return json({ ok: true, node: node.name, ...res });
    }

    if (!env.IRR_TOKEN || !same(bearer(req), env.IRR_TOKEN)) return json({ error: 'unauthorized' }, 401);

    if (p === '/irr/latest') {
      const pools = {};
      for (const id of POOLS) { const r = await getJson(env, `irr/latest/${id}.json`); if (r) pools[id] = r; }
      const st = {};
      const l = await env.R2.list({ prefix: 'irr/node/' });
      for (const o of (l.objects || [])) { const n = await getJson(env, o.key); if (n) st[n.node] = { lastSeen: n.lastSeen, pools: n.pools }; }
      return json({ ok: true, now, pools, nodes: st, proleaf: await getJson(env, 'irr/proleaf.json') });
    }

    if (p === '/irr/readings') {
      const pool = String(url.searchParams.get('pool') || '').toUpperCase(), day = String(url.searchParams.get('day') || manilaDay(now));
      if (!POOLS.includes(pool) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: 'pool and day=YYYY-MM-DD' }, 400);
      const out = [];
      let cursor;
      do {
        const l = await env.R2.list({ prefix: `irr/day/${day}/${pool}/`, cursor });
        for (const o of (l.objects || [])) { if (out.length >= 600) break; const r = await getJson(env, o.key); if (r) out.push(r); }
        cursor = l.truncated && out.length < 600 ? l.cursor : undefined;
      } while (cursor);
      out.sort((a, b) => a.ts - b.ts);
      return json({ ok: true, pool, day, readings: out });
    }

    return json({ error: 'not found' }, 404);
  },

  async scheduled(event, env, ctx) {
    if (!env.R2) return;
    const now = Date.now();
    const r = await pollProLeaf(env, now);
    const res = r.readings.length ? await store(env, 'proleaf', null, r.readings, now) : null;
    await putJson(env, 'irr/proleaf.json', { state: r.state, at: now, stored: res ? res.stored : 0, refused: res ? res.refused.length : 0 });
  },
};
