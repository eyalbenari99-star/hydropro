/* Nexi Cold-room Receiver (nexi-cold) v22.96 — cold-room temperatures for Maintenance → ❄ Cold storage (Eyal, 13 Oct 2026, with a photo
   of the new cold-room control box and new.i-elitech.com: "I need to connect the cold storage to set up online temp which should be in
   maintenance check list to check daily and if below 4 degrees or above 8 degrees should warm if bellow 2 degrees or above 12 degrees
   critical warning maintenance").

   Rooms: CS1 "Cold storage 1" (CCTV CAM-055), CS2 "Cold storage 2" (CAM-081) — ids CS1 … CS999, the room list lives in Nexi.
   Three ways in, one store:
     1. The Elitech iCold cloud (the Wi-Fi controller's account) — pollElitech below. The iCold API exists only after an order (the
        "Access API document"); until it arrives this records "not configured" / "waiting for the Elitech Access API document" and
        NEVER guesses an address. No cron trigger until then.
     2. POST /cold/push from the Elitech ALARM-MAIL BRIDGE (workers/elitech-alarm-bridge.gs, node "elitech-mail"): the alarm e-mails the
        iCold cloud sends to nexi@abapardes.com.ph carry the device name and the temperature. Alarm moments only — a room inside its
        alarm limits sends nothing. A reading may name the room, or the device name; COLD_MAP turns a device name into a room.
     3. POST /cold/push from our own probe / a future Elitech Wi-Fi logger. Each node has its own token and writes only its own rooms.
   Nexi (one feeder computer) pulls GET /cold/latest every 3 minutes with COLD_TOKEN; the cards draw the last 24 h from
   GET /cold/history. GET /cold/health (no token) says whether the worker is alive and which nodes report — nothing secret in it.

   DEPLOY (Cloudflare dashboard or wrangler) — see workers/README.md "nexi-cold (cold-room temperature) — v22.96":
     wrangler.toml:
       name = "nexi-cold"
       main = "nexi-cold.js"
       compatibility_date = "2026-01-01"
       [[r2_buckets]]
       binding = "R2"
       bucket_name = "<SAME BUCKET AS nexi-bio>"
       # no [triggers] yet — add crons = ["0,5,10,15,20,25,30,35,40,45,50,55 * * * *"] (every 5 minutes) only when pollElitech is wired to the Access API document
     secrets (set by the owner in Cloudflare, never pasted in chat):
       COLD_TOKEN    long random string; Nexi → ❄ Cold storage → ⚙ Settings keeps it on ONE computer only
       NODE_TOKENS   JSON {"elitech-mail":{"token":"<long random>","rooms":["CS1","CS2"]}, …}
     optional:
       ROOMS         var "CS1,CS2" — an allowlist; a reading for another room is refused
       COLD_MAP      JSON {"<device name as in the iCold app>":"CS1", …} — keys compared lower-cased and trimmed
       ELITECH_KEY_ID / ELITECH_KEY_SECRET   only when the Access API document arrives

   Storage (R2 prefix cold/, small objects, nothing overwritten by an older reading):
     cold/latest/<room>.json                        the newest reading of a room
     cold/recent/<room>.json                        v23.22: every reading RECEIVED in the last 48 h (max 120) — /cold/latest returns
                                                    the last 24 h of it as "recent", so an alarm followed by the "recovered" mail in
                                                    ONE bridge run (or one 15-minute slot) still reaches Nexi
     cold/fault/<room>.json                         v23.22: the newest Elitech fault event of a room ({fault:"offline"|"online"|
                                                    "unread"}) — the bridge posts "device offline" and alarm mails it cannot read
     cold/day/<YYYY-MM-DD>/<room>/<ts>-<node>.json  every reading, Manila day (a repeat of the same ts + node is stored once)
     cold/hist/<YYYY-MM-DD>/<room>.json             a finished day folded to the LAST and the WORST reading per 15 minutes; deleted
                                                    again when a late reading lands in that day (v23.22)
     cold/node/<node>.json                          last seen, readings taken, rooms
     cold/elitech.json                              the cloud poll's last state
   v23.22 (review of v22.96): a temperature must be a number or a numeric string (" ", false, [] were stored as 0 °C → a CRITICAL
   LOW alarm in Nexi); OK_BAND (optional var, default "4,8") says which reading of a 15-minute slot is the worst.
*/

const VERSION = '23.22';
const ROOM_RE = /^CS\d{1,3}$/;
/* plausible range — a cold room, a freezer or a dead probe; outside it is a wiring fault or a typo, never a reading */
const LIMITS = { t: [-40, 60] };
const MAX_AHEAD_MS = 2 * 60e3, MAX_AGE_MS = 7 * 864e5, MAX_READINGS = 200, MAX_BODY = 65536, BUCKET_MS = 15 * 60e3, HIST_MAX_H = 168;
const RECENT_KEEP_MS = 48 * 3600e3, RECENT_MAX = 120, RECENT_SHOW_MS = 24 * 3600e3, FAULTS = ['offline', 'online', 'unread'];

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
  for (const [name, n] of Object.entries(nodes(env))) if (n && same(token, n.token)) return { name, rooms: Array.isArray(n.rooms) ? n.rooms.map(r => String(r).toUpperCase()) : [] };
  return null;
}
/* ROOMS: "CS1,CS2" — an allowlist when set */
export function roomsAllow(env) {
  const s = String(env.ROOMS || '').trim();
  if (!s) return null;
  return s.split(/[\s,;]+/).map(x => x.trim().toUpperCase()).filter(x => ROOM_RE.test(x));
}
/* COLD_MAP: {"<device name>":"CS1"} — keys lower-cased and trimmed */
export function coldMap(env) {
  const out = {};
  try { const o = JSON.parse(env.COLD_MAP || '{}'); if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { const r = String(v || '').trim().toUpperCase(); if (ROOM_RE.test(r)) out[String(k).trim().toLowerCase()] = r; } } catch (e) {}
  return out;
}
const manilaDay = ms => new Date(ms + 8 * 3600e3).toISOString().slice(0, 10);
/* a temperature is a number or a numeric string — never a blank, a boolean or an array (Number(" ") === 0) */
function tempOf(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && /^\s*[-+]?(\d+(\.\d*)?|\.\d+)\s*$/.test(raw)) return Number(raw);
  return NaN;
}
/* the OK band (for "the worst reading of a 15-minute slot"); OK_BAND "4,8" */
export function okBand(env) { const m = String((env && env.OK_BAND) || '4,8').split(',').map(Number); return (m.length === 2 && m.every(isFinite) && m[0] < m[1]) ? m : [4, 8]; }
/* per 15-minute slot the LAST reading and the WORST one (farthest outside the OK band), oldest first */
export function foldSlots(list, ok) {
  const d = t => t < ok[0] ? ok[0] - t : (t > ok[1] ? t - ok[1] : 0), m = new Map();
  for (const r of list) { if (!r) continue; const k = Math.floor(r.ts / BUCKET_MS), e = m.get(k) || { last: null, worst: null };
    if (!e.last || r.ts >= e.last.ts) e.last = r;
    if (d(r.t) > 0 && (!e.worst || d(r.t) > d(e.worst.t))) e.worst = r;
    m.set(k, e); }
  const out = []; for (const e of m.values()) { out.push(e.last); if (e.worst && e.worst.ts !== e.last.ts) out.push(e.worst); }
  return out.sort((a, b) => a.ts - b.ts);
}
const round1 = v => Math.round(v * 10) / 10;
const str = (v, n) => (v === null || v === undefined) ? '' : String(v).trim().slice(0, n);

/* one reading in → a clean reading out, or the reason it was refused. `map` = COLD_MAP, `allow` = ROOMS */
export function normalize(r, now, map, allow) {
  if (!r || typeof r !== 'object') return { error: 'not a reading' };
  let room = str(r.room, 12).toUpperCase();
  const device = str(r.device, 60);
  if (!room && device) {
    room = (map && map[device.toLowerCase()]) || '';
    if (!room) return { error: 'unmapped device ' + device.toLowerCase() };
  }
  if (!ROOM_RE.test(room)) return { error: 'bad room id' };
  if (allow && !allow.includes(room)) return { error: 'unknown room ' + room };
  let ts = typeof r.ts === 'number' ? r.ts : Date.parse(r.ts || '');
  if (!isFinite(ts)) ts = now;
  if (ts > now + MAX_AHEAD_MS) ts = now;                 /* a node with a wrong clock never writes into the future */
  /* v23.22: an Elitech fault event (the bridge: "device offline" / back "online" / an alarm mail whose value it cannot read) */
  const fault = str(r.fault, 20).toLowerCase();
  if (fault) {
    if (!FAULTS.includes(fault)) return { error: 'bad fault ' + fault };
    if (ts < now - MAX_AGE_MS) return { error: 'older than 7 days' };
    const f = { room, ts, fault };
    const fs = str(r.src, 20); if (fs) f.src = fs;
    const fa = str(r.alarm, 60); if (fa) f.alarm = fa;
    const fm = str(r.msgId, 40); if (fm) f.msgId = fm;
    return { fault: f };
  }
  const raw = r.t ?? r.temp ?? r.temperature;
  if (raw === null || raw === undefined || raw === '') return { error: 'no temperature' };
  const t = tempOf(raw);
  if (!isFinite(t)) return { error: 'no temperature' };
  if (t < LIMITS.t[0] || t > LIMITS.t[1]) return { error: 't out of range: ' + raw };
  if (ts < now - MAX_AGE_MS) return { error: 'older than 7 days' };
  const out = { room, ts, t: round1(t) };
  const src = str(r.src, 20); if (src) out.src = src;
  const alarm = str(r.alarm, 60); if (alarm) out.alarm = alarm;
  const msgId = str(r.msgId, 40); if (msgId) out.msgId = msgId;
  return { reading: out };                                /* the device name is not stored */
}

async function getJson(env, key) { const o = await env.R2.get(key); if (!o) return null; try { return JSON.parse(await o.text()); } catch (e) { return null; } }
async function putJson(env, key, v) { await env.R2.put(key, JSON.stringify(v), { httpMetadata: { contentType: 'application/json' } }); }
async function listAll(env, prefix, max) {
  const keys = []; let cursor;
  do { const l = await env.R2.list({ prefix, cursor }); for (const o of (l.objects || [])) { keys.push(o.key); if (keys.length >= max) return keys; } cursor = l.truncated ? l.cursor : undefined; } while (cursor);
  return keys;
}

/* store readings from one node; returns {stored, duplicates, faults, refused:[{i, error}]} */
export async function store(env, node, allowedRooms, readings, now) {
  const res = { stored: 0, duplicates: 0, faults: 0, refused: [] };
  const recentAdd = new Map(), today = manilaDay(now);
  const list = Array.isArray(readings) ? readings.slice(0, MAX_READINGS) : [];
  if (Array.isArray(readings) && readings.length > MAX_READINGS) res.refused.push({ i: MAX_READINGS, error: 'more than ' + MAX_READINGS + ' readings in one push' });
  const map = coldMap(env), allow = roomsAllow(env);
  const rooms = new Set();
  for (let i = 0; i < list.length; i++) {
    const n = normalize(list[i], now, map, allow);
    if (n.error) { res.refused.push({ i, error: n.error }); continue; }
    if (n.fault) {
      const f = n.fault;
      if (allowedRooms && !allowedRooms.includes(f.room)) { res.refused.push({ i, error: 'room ' + f.room + ' is not this node\'s' }); continue; }
      const fk = `cold/fault/${f.room}.json`, cur = await getJson(env, fk);
      if (cur && cur.ts >= f.ts) { res.duplicates++; continue; }   /* the newest fault event of a room only */
      await putJson(env, fk, { ...f, node, received: now });
      res.faults++; rooms.add(f.room);
      continue;
    }
    const r = n.reading;
    if (allowedRooms && !allowedRooms.includes(r.room)) { res.refused.push({ i, error: 'room ' + r.room + ' is not this node\'s' }); continue; }
    const day = manilaDay(r.ts), key = `cold/day/${day}/${r.room}/${r.ts}-${node}.json`;
    if (await env.R2.head(key)) { res.duplicates++; continue; }
    const rec = { ...r, node, received: now };
    await putJson(env, key, rec);
    const latest = await getJson(env, `cold/latest/${r.room}.json`);
    if (!latest || !(latest.ts > r.ts)) await putJson(env, `cold/latest/${r.room}.json`, rec); /* an older reading never replaces a newer one */
    if (day < today && typeof env.R2.delete === 'function') await env.R2.delete(`cold/hist/${day}/${r.room}.json`); /* v23.22: a late reading re-opens a folded day */
    if (!recentAdd.has(r.room)) recentAdd.set(r.room, []);
    recentAdd.get(r.room).push({ ts: r.ts, t: r.t, received: now });
    res.stored++; rooms.add(r.room);
  }
  for (const [room, add] of recentAdd) {   /* v23.22: every reading received, not only the newest */
    const rk = `cold/recent/${room}.json`, cur = (await getJson(env, rk)) || { room, pts: [] }, m = new Map();
    for (const p of (Array.isArray(cur.pts) ? cur.pts : []).concat(add)) if (p && p.received >= now - RECENT_KEEP_MS) m.set(p.ts, p);
    await putJson(env, rk, { room, pts: [...m.values()].sort((a, b) => a.ts - b.ts).slice(-RECENT_MAX) });
  }
  const prev = (await getJson(env, `cold/node/${node}.json`)) || { count: 0, rooms: [] };
  await putJson(env, `cold/node/${node}.json`, { node, lastSeen: now, count: (prev.count || 0) + res.stored, rooms: [...new Set([...(prev.rooms || []), ...rooms])].sort() });
  return res;
}

/* the readings of one room over the last `hours` — per 15-minute slot the LAST and the WORST reading (v23.22: an alarm followed by
   an in-band reading in the same slot is no longer folded away), oldest first; finished days are folded into
   cold/hist/<day>/<room>.json and read from there, until a late reading for that day deletes the fold (store) */
export async function history(env, room, hours, now) {
  const from = now - hours * 3600e3, today = manilaDay(now), ok = okBand(env);
  const days = []; for (let t = from; manilaDay(t) <= today; t += 864e5) days.push(manilaDay(t)); if (!days.includes(today)) days.push(today);
  const all = [];
  const take = r => { if (!r || !(r.ts >= from) || r.ts > now + MAX_AHEAD_MS) return; all.push(r); };
  for (const day of [...new Set(days)]) {
    const hk = `cold/hist/${day}/${room}.json`;
    const folded = day < today ? await getJson(env, hk) : null;
    if (folded && Array.isArray(folded.points)) { folded.points.forEach(take); continue; }
    const pts = [];
    for (const key of await listAll(env, `cold/day/${day}/${room}/`, 2000)) { const r = await getJson(env, key); if (r) pts.push(r); }
    const points = foldSlots(pts, ok).map(slim);
    if (day < today) await putJson(env, hk, { room, day, points, foldedAt: now });
    points.forEach(take);
  }
  return foldSlots(all, ok).map(slim);
}
const slim = r => ({ ts: r.ts, node: r.node, t: r.t });

/* Way 1 — the Elitech iCold cloud. Wired once the "Access API document" arrives (ELITECH_KEY_ID / ELITECH_KEY_SECRET).
   Until then it only says why it did nothing; it never calls an address it would have to guess. */
export async function pollElitech(env, now) {
  if (!env.ELITECH_KEY_ID || !env.ELITECH_KEY_SECRET) return { state: 'not configured', at: now, readings: [] };
  return { state: 'waiting for the Elitech Access API document (no address is guessed)', at: now, readings: [] };
}

async function nodeStates(env) {
  const st = {};
  const l = await env.R2.list({ prefix: 'cold/node/' });
  for (const o of (l.objects || [])) { const n = await getJson(env, o.key); if (n) st[n.node] = { lastSeen: n.lastSeen, rooms: n.rooms }; }
  return st;
}
async function latestAll(env) {
  const rooms = {};
  for (const key of await listAll(env, 'cold/latest/', 1000)) { const r = await getJson(env, key); if (r && ROOM_RE.test(String(r.room || ''))) rooms[r.room] = r; }
  return rooms;
}
/* v23.22: per room every reading received in the last 24 h as [ts, t, received], oldest first */
async function recentAll(env, now) {
  const out = {};
  for (const key of await listAll(env, 'cold/recent/', 1000)) { const o = await getJson(env, key); if (!o || !ROOM_RE.test(String(o.room || ''))) continue;
    out[o.room] = (Array.isArray(o.pts) ? o.pts : []).filter(p => p && p.received >= now - RECENT_SHOW_MS).map(p => [p.ts, p.t, p.received]); }
  return out;
}
/* v23.22: per room the newest Elitech fault event */
async function faultsAll(env) {
  const out = {};
  for (const key of await listAll(env, 'cold/fault/', 1000)) { const f = await getJson(env, key); if (f && ROOM_RE.test(String(f.room || ''))) out[f.room] = { fault: f.fault, ts: f.ts, alarm: f.alarm || '', node: f.node }; }
  return out;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname, now = Date.now();
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!env.R2) return json({ error: 'R2 binding missing' }, 500);

    /* alive? which nodes report, when each room last reported — no token, nothing secret */
    if (p === '/cold/health' && req.method === 'GET') {
      const st = await nodeStates(env), lt = await latestAll(env), rooms = {};
      for (const [k, v] of Object.entries(lt)) rooms[k] = v.ts;
      const el = await getJson(env, 'cold/elitech.json');
      const nd = {}; for (const [k, v] of Object.entries(st)) nd[k] = v.lastSeen;
      return json({ ok: true, version: VERSION, now, r2: true, nodes: nd, rooms, elitech: el ? el.state : 'never ran' });
    }

    if (p === '/cold/push' && req.method === 'POST') {
      const node = nodeFor(env, bearer(req));
      if (!node) return json({ error: 'unauthorized' }, 401);
      const cl = parseInt(req.headers.get('Content-Length') || '0', 10);
      if (cl > MAX_BODY) return json({ error: 'body too large' }, 413);
      let text; try { text = await req.text(); } catch (e) { return json({ error: 'body is not JSON' }, 400); }
      if (text.length > MAX_BODY) return json({ error: 'body too large' }, 413);
      let body; try { body = JSON.parse(text); } catch (e) { return json({ error: 'body is not JSON' }, 400); }
      const res = await store(env, node.name, node.rooms, body && body.readings, now);
      return json({ ok: true, node: node.name, ...res });
    }

    if (!env.COLD_TOKEN || !same(bearer(req), env.COLD_TOKEN)) return json({ error: 'unauthorized' }, 401);

    if (p === '/cold/latest') {
      return json({ ok: true, now, rooms: await latestAll(env), recent: await recentAll(env, now), faults: await faultsAll(env), nodes: await nodeStates(env), elitech: await getJson(env, 'cold/elitech.json') });
    }

    if (p === '/cold/history') {
      const room = String(url.searchParams.get('room') || '').toUpperCase(), hours = parseInt(url.searchParams.get('hours') || '24', 10);
      if (!ROOM_RE.test(room)) return json({ error: 'room=CS1…' }, 400);
      if (!(hours >= 1 && hours <= HIST_MAX_H)) return json({ error: 'hours=1…' + HIST_MAX_H }, 400);
      const points = await history(env, room, hours, now);
      return json({ ok: true, room, hours, from: now - hours * 3600e3, to: now, points });
    }

    if (p === '/cold/readings') {
      const room = String(url.searchParams.get('room') || '').toUpperCase(), day = String(url.searchParams.get('day') || manilaDay(now));
      if (!ROOM_RE.test(room) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: 'room and day=YYYY-MM-DD' }, 400);
      const out = [];
      for (const key of await listAll(env, `cold/day/${day}/${room}/`, 600)) { const r = await getJson(env, key); if (r) out.push(r); }
      out.sort((a, b) => a.ts - b.ts);
      return json({ ok: true, room, day, readings: out });
    }

    return json({ error: 'not found' }, 404);
  },

  async scheduled(event, env, ctx) {
    if (!env.R2) return;
    const now = Date.now();
    const r = await pollElitech(env, now);
    const res = r.readings.length ? await store(env, 'elitech-cloud', null, r.readings, now) : null;
    await putJson(env, 'cold/elitech.json', { state: r.state, at: now, stored: res ? res.stored : 0, refused: res ? res.refused.length : 0 });
  },
};
