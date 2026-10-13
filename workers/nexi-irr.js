/* Nexi Irrigation Receiver (nexi-irr) v22.78 — pool sensor readings for the Pool Monitor: EC, pH, water temperature and water
   level for GH1–GH10 (P01–P10) and PRJ11 (P11A, P11B). Eyal, 12 Oct 2026: "I need guidelines how to connect Nexi to EC PH water
   level pool asap"; 13 Oct 2026 (URGENT): "still pending to connect all meters from BeHive-I to Nexi each pool".

   Three ways in, one store:
     1. The Pro-Leaf (BeLeaf) cloud that the BeHive-I units report to — polled every 5 minutes by the cron below once the web
        version's calls are known (pollProLeaf; until then it records "not configured" and does nothing).
     2. POST /irr/push from the Pro-Leaf ALARM-MAIL BRIDGE (workers/proleaf-alarm-bridge.gs, node "proleaf-mail"): every alarm
        e-mail the Pro-Leaf cloud sends to it@abapardes.com.ph carries the device id, the tank and the value that tripped the alarm.
        A stopgap — alarm moments only, no pH — until way 1 or 3 is wired. A reading may name the pool, or the BeHive-I device id +
        tank word; PROLEAF_MAP (secret) turns "<device>:<tank>" into a pool.
     3. POST /irr/push from a node we own: a listen-only RS485 tap on a BeHive-I sensor cable, or our own probes. Each node has
        its own token and may only write its own pools.
   Nexi (Pool Monitor / 🔌 Meters) pulls GET /irr/latest every 3 minutes with IRR_TOKEN and fills the controller boxes of the round;
   🔌 Meters draws the last 24 h from GET /irr/history. GET /irr/health (no token) says whether the worker is alive and which nodes
   report — nothing secret in it.

   DEPLOY (Cloudflare dashboard or wrangler) — see workers/README.md "nexi-irr (pool meters)":
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
       IRR_TOKEN     long random string; Nexi → 🔌 Meters → ⚙ Feed settings keeps it on each computer only
       NODE_TOKENS   JSON {"proleaf-mail":{"token":"<long random>","pools":["P01",…,"P11B"]},"tap-room1-2":{"token":"…","pools":["P01","P02"]}, …}
       PROLEAF_MAP   JSON {"BHIDA17102B:tank1":"P07", …} — which BeHive-I device + tank is which pool (optional; the bridge may map too)
       PROLEAF_USER, PROLEAF_PASS   the Pro-Leaf account (it@abapardes.com.ph) — only when way 1 is wired

   Storage (R2, small objects, nothing overwritten by an older reading):
     irr/latest/<pool>.json            the newest reading of a pool
     irr/day/<YYYY-MM-DD>/<pool>/<ts>-<node>.json   every reading, Manila day (a repeat of the same ts + node is stored once)
     irr/hist/<YYYY-MM-DD>/<pool>.json  a finished day folded to one point per 15 minutes (written once, read by /irr/history)
     irr/node/<node>.json              last seen, readings taken, pools
     irr/proleaf.json                  the cloud poll's last state
*/

const VERSION = '22.78';
const POOLS = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11A', 'P11B'];
/* plausible ranges — a value outside is a probe out of the water, a wiring fault or a typo, never a reading */
const LIMITS = { ec: [0, 10], ph: [0, 14], wt: [0, 60], level_cm: [0, 400] };
const MAX_AHEAD_MS = 2 * 60e3, MAX_AGE_MS = 7 * 864e5, MAX_READINGS = 200, MAX_BODY = 65536;
const ROUNDS = ['08:00', '11:00', '14:00', '16:00'];
const BUCKET_MS = 15 * 60e3, HIST_MAX_H = 168;

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
/* PROLEAF_MAP: {"<device>:<tank>":"P07"} — keys upper-cased device, lower-cased tank */
export function proleafMap(env) {
  const out = {};
  try { const o = JSON.parse(env.PROLEAF_MAP || '{}'); if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { const p = String(v || '').trim().toUpperCase(); if (POOLS.includes(p)) out[mapKey(k)] = p; } } catch (e) {}
  return out;
}
const mapKey = k => { const m = /^([^:]+):?(.*)$/.exec(String(k || '').trim()); return (m ? m[1].trim().toUpperCase() : '') + ':' + ((m && m[2].trim().toLowerCase()) || 'tank1'); };
const manilaDay = ms => new Date(ms + 8 * 3600e3).toISOString().slice(0, 10);
const manilaHM = ms => new Date(ms + 8 * 3600e3).toISOString().slice(11, 16);
/* the Pool Monitor round a reading belongs to: the latest Manila slot ≤ ts; null before 08:00 */
export function roundOf(ts) { const hm = manilaHM(ts); let r = null; for (const s of ROUNDS) if (s <= hm) r = s; return r; }
const round = (v, d) => Math.round(v * 10 ** d + 1e-9) / 10 ** d;
const str = (v, n) => (v === null || v === undefined) ? '' : String(v).trim().slice(0, n);

/* one reading in → a clean reading out, or the reason it was refused. `map` = PROLEAF_MAP for readings that name a device + tank */
export function normalize(r, now, map) {
  if (!r || typeof r !== 'object') return { error: 'not a reading' };
  let pool = String(r.pool || '').trim().toUpperCase();
  const device = str(r.device, 24).toUpperCase(), tank = (str(r.tank, 12).toLowerCase() || 'tank1');
  if (!pool && device) {
    const k = device + ':' + tank;
    pool = (map && map[k]) || '';
    if (!pool) return { error: 'unmapped device ' + k };
  }
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
  if (device) out.device = device;
  if (device || r.tank) out.tank = tank;
  const src = str(r.src, 20); if (src) out.src = src;
  const alarm = str(r.alarm, 60); if (alarm) out.alarm = alarm;
  const msgId = str(r.msgId, 40); if (msgId) out.msgId = msgId;
  out.round = roundOf(ts);
  return { reading: out };
}

async function getJson(env, key) { const o = await env.R2.get(key); if (!o) return null; try { return JSON.parse(await o.text()); } catch (e) { return null; } }
async function putJson(env, key, v) { await env.R2.put(key, JSON.stringify(v), { httpMetadata: { contentType: 'application/json' } }); }
async function listAll(env, prefix, max) {
  const keys = []; let cursor;
  do { const l = await env.R2.list({ prefix, cursor }); for (const o of (l.objects || [])) { keys.push(o.key); if (keys.length >= max) return keys; } cursor = l.truncated ? l.cursor : undefined; } while (cursor);
  return keys;
}

/* store readings from one node; returns {stored, duplicates, refused:[{i, error}]} */
export async function store(env, node, allowed, readings, now) {
  const res = { stored: 0, duplicates: 0, refused: [] };
  const list = Array.isArray(readings) ? readings.slice(0, MAX_READINGS) : [];
  if (Array.isArray(readings) && readings.length > MAX_READINGS) res.refused.push({ i: MAX_READINGS, error: 'more than ' + MAX_READINGS + ' readings in one push' });
  const map = proleafMap(env);
  const pools = new Set();
  for (let i = 0; i < list.length; i++) {
    const n = normalize(list[i], now, map);
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

/* the readings of one pool over the last `hours`, the LAST reading per 15-minute bucket, oldest first; finished days are folded
   once into irr/hist/<day>/<pool>.json and read from there afterwards */
export async function history(env, pool, hours, now) {
  const from = now - hours * 3600e3, today = manilaDay(now);
  const days = []; for (let t = from; manilaDay(t) <= today; t += 864e5) days.push(manilaDay(t)); if (!days.includes(today)) days.push(today);
  const buckets = new Map();
  const take = r => { if (!r || !(r.ts >= from) || r.ts > now + MAX_AHEAD_MS) return; const b = Math.floor(r.ts / BUCKET_MS); const cur = buckets.get(b); if (!cur || r.ts >= cur.ts) buckets.set(b, r); };
  for (const day of [...new Set(days)]) {
    const hk = `irr/hist/${day}/${pool}.json`;
    const folded = day < today ? await getJson(env, hk) : null;
    if (folded && Array.isArray(folded.points)) { folded.points.forEach(take); continue; }
    const pts = [];
    for (const key of await listAll(env, `irr/day/${day}/${pool}/`, 2000)) { const r = await getJson(env, key); if (r) pts.push(r); }
    pts.sort((a, b) => a.ts - b.ts);
    const dayBuckets = new Map();
    for (const r of pts) { const b = Math.floor(r.ts / BUCKET_MS); const cur = dayBuckets.get(b); if (!cur || r.ts >= cur.ts) dayBuckets.set(b, r); }
    const points = [...dayBuckets.values()].sort((a, b) => a.ts - b.ts).map(slim);
    if (day < today) await putJson(env, hk, { pool, day, points, foldedAt: now }); /* a finished day never changes */
    points.forEach(take);
  }
  return [...buckets.values()].sort((a, b) => a.ts - b.ts).map(slim);
}
const slim = r => { const o = { ts: r.ts, node: r.node }; for (const k of ['ec', 'ph', 'wt', 'level_cm']) if (r[k] != null) o[k] = r[k]; return o; };

/* Way 1 — the Pro-Leaf cloud. Wired once a sanitized capture of the web version (guardian.pro-leaf.com) shows its calls.
   Until then it only says why it did nothing; it never logs in with a guessed address. */
export async function pollProLeaf(env, now) {
  if (!env.PROLEAF_USER || !env.PROLEAF_PASS) return { state: 'not configured', at: now, readings: [] };
  return { state: 'waiting for the Pro-Leaf web calls (send the sanitized HAR)', at: now, readings: [] };
}

async function nodeStates(env) {
  const st = {};
  const l = await env.R2.list({ prefix: 'irr/node/' });
  for (const o of (l.objects || [])) { const n = await getJson(env, o.key); if (n) st[n.node] = { lastSeen: n.lastSeen, pools: n.pools }; }
  return st;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, now = Date.now();
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!env.R2) return json({ error: 'R2 binding missing' }, 500);

    /* alive? which nodes report, when each pool last reported — no token, nothing secret */
    if (p === '/irr/health' && req.method === 'GET') {
      const st = await nodeStates(env), pools = {};
      for (const id of POOLS) { const r = await getJson(env, `irr/latest/${id}.json`); if (r) pools[id] = r.ts; }
      const pl = await getJson(env, 'irr/proleaf.json');
      const nd = {}; for (const [k, v] of Object.entries(st)) nd[k] = v.lastSeen;
      return json({ ok: true, version: VERSION, now, r2: true, nodes: nd, pools, proleaf: pl ? pl.state : 'never ran' });
    }

    if (p === '/irr/push' && req.method === 'POST') {
      const node = nodeFor(env, bearer(req));
      if (!node) return json({ error: 'unauthorized' }, 401);
      const cl = parseInt(req.headers.get('Content-Length') || '0', 10);
      if (cl > MAX_BODY) return json({ error: 'body too large' }, 413);
      let text; try { text = await req.text(); } catch (e) { return json({ error: 'body is not JSON' }, 400); }
      if (text.length > MAX_BODY) return json({ error: 'body too large' }, 413);
      let body; try { body = JSON.parse(text); } catch (e) { return json({ error: 'body is not JSON' }, 400); }
      const res = await store(env, node.name, node.pools, body && body.readings, now);
      return json({ ok: true, node: node.name, ...res });
    }

    if (!env.IRR_TOKEN || !same(bearer(req), env.IRR_TOKEN)) return json({ error: 'unauthorized' }, 401);

    if (p === '/irr/latest') {
      const pools = {};
      for (const id of POOLS) { const r = await getJson(env, `irr/latest/${id}.json`); if (r) pools[id] = r; }
      return json({ ok: true, now, pools, nodes: await nodeStates(env), proleaf: await getJson(env, 'irr/proleaf.json') });
    }

    if (p === '/irr/history') {
      const pool = String(url.searchParams.get('pool') || '').toUpperCase(), hours = parseInt(url.searchParams.get('hours') || '24', 10);
      if (!POOLS.includes(pool)) return json({ error: 'pool=P01…P11B' }, 400);
      if (!(hours >= 1 && hours <= HIST_MAX_H)) return json({ error: 'hours=1…' + HIST_MAX_H }, 400);
      const points = await history(env, pool, hours, now);
      return json({ ok: true, pool, hours, from: now - hours * 3600e3, to: now, points });
    }

    if (p === '/irr/readings') {
      const pool = String(url.searchParams.get('pool') || '').toUpperCase(), day = String(url.searchParams.get('day') || manilaDay(now));
      if (!POOLS.includes(pool) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: 'pool and day=YYYY-MM-DD' }, 400);
      const out = [];
      for (const key of await listAll(env, `irr/day/${day}/${pool}/`, 600)) { const r = await getJson(env, key); if (r) out.push(r); }
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
