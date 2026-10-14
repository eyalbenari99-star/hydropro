// nexi-cold (cold-room temperature, Eyal 13 Oct 2026: "connect the cold storage … online temp … warn below 4 / above 8 … critical below 2 /
// above 12"). Run: node tests/workers/nexi-cold.test.mjs — mock R2, no network.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'cold-'));
const file = join(dir, 'cold.mjs');
writeFileSync(file, readFileSync(join(here, '../../workers/nexi-cold.js'), 'utf8'));
const mod = await import(pathToFileURL(file).href);
const worker = mod.default;
let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 500))); if (!ok) fails++; };

/* a mock R2 bucket: get/put/head/list over a Map */
const mkR2 = () => { const m = new Map(); return { m,
  async get(k) { return m.has(k) ? { text: async () => m.get(k) } : null; },
  async put(k, v) { m.set(k, typeof v === 'string' ? v : String(v)); },
  async head(k) { return m.has(k) ? {} : null; },
  async delete(k) { m.delete(k); },
  async list({ prefix }) { return { objects: [...m.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })), truncated: false }; } }; };
const mkEnv = extra => ({ R2: mkR2(), COLD_TOKEN: 'app-cold-token-123',
  NODE_TOKENS: JSON.stringify({ 'elitech-mail': { token: 'node-token-mail', rooms: ['CS1', 'CS2'] }, 'probe-cs1': { token: 'node-token-probe', rooms: ['CS1'] } }),
  COLD_MAP: JSON.stringify({ 'Cold storage 1': 'CS1', ' Cold Storage 2 ': 'CS2' }), ...(extra || {}) });
let env = mkEnv();
const call = async (path, { method = 'GET', token, body, raw, e } = {}) => {
  const r = await worker.fetch(new Request('https://cold.test' + path, { method, headers: token ? { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } : {}, body: raw !== undefined ? raw : (body ? JSON.stringify(body) : undefined) }), e || env, {});
  return { status: r.status, body: await r.json() };
};
const now = Date.now(), iso = ms => new Date(ms).toISOString();

// 1. tokens
{ const a = await call('/cold/latest'), b = await call('/cold/latest', { token: 'node-token-mail' }), c = await call('/cold/push', { method: 'POST', token: 'app-cold-token-123', body: { readings: [] } }),
    d = await call('/cold/history?room=CS1&hours=24', { token: 'wrong' });
  check('401 matrix: no token on /cold/latest, a node token reading /cold/latest, COLD_TOKEN pushing /cold/push, a wrong token on /cold/history → all 401',
    a.status === 401 && b.status === 401 && c.status === 401 && d.status === 401, [a.status, b.status, c.status, d.status]); }

// 2. the bridge pushes CS1 5.64 → 5.6 on /cold/latest, node elitech-mail, lastSeen set
{ const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [{ room: 'cs1', ts: iso(now - 60e3), t: 5.64, src: 'elitech-mail', alarm: 'High temperature', msgId: '18f3a' }] } });
  const l = await call('/cold/latest', { token: 'app-cold-token-123' });
  const p = l.body.rooms && l.body.rooms.CS1;
  check('elitech-mail pushes CS1 5.64 °C → stored 1; /cold/latest CS1 t 5.6, node elitech-mail, src/alarm/msgId kept, received set; nodes["elitech-mail"].lastSeen > 0',
    r.status === 200 && r.body.stored === 1 && p && p.t === 5.6 && p.node === 'elitech-mail' && p.src === 'elitech-mail' && p.alarm === 'High temperature' && p.msgId === '18f3a' && p.received > 0
    && l.body.nodes['elitech-mail'] && l.body.nodes['elitech-mail'].lastSeen > 0, { r: r.body, p }); }

// 3. temperature limits: −1.5 accepted; −45 and 65 refused; no t → "no temperature"; temp / temperature aliases
{ const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [
    { room: 'CS2', ts: iso(now - 50e3), t: -1.5 },
    { room: 'CS2', ts: iso(now - 40e3), t: -45 },
    { room: 'CS2', ts: iso(now - 30e3), t: 65 },
    { room: 'CS2', ts: iso(now - 20e3) },
    { room: 'CS2', ts: iso(now - 10e3), temperature: 3.95 } ] } });
  const errs = (r.body.refused || []).map(x => x.error);
  const l = await call('/cold/latest', { token: 'app-cold-token-123' });
  check('CS2 −1.5 stored; −45 and 65 refused "t out of range"; a reading without t → "no temperature"; {temperature: 3.95} stored as 4.0 (rounded to 0.1, newest)',
    r.body.stored === 2 && errs.length === 3 && errs[0] === 't out of range: -45' && errs[1] === 't out of range: 65' && errs[2] === 'no temperature' && l.body.rooms.CS2.t === 4, { r: r.body, cs2: l.body.rooms.CS2 }); }

// 4. node / room checks: probe-cs1 pushing CS2; a bad room id; ROOMS allowlist
{ const r = await call('/cold/push', { method: 'POST', token: 'node-token-probe', body: { readings: [{ room: 'CS2', t: 5 }, { room: 'cold room!', t: 5 }] } });
  const errs = (r.body.refused || []).map(x => x.error);
  const e2 = mkEnv({ ROOMS: 'CS1,CS2', NODE_TOKENS: JSON.stringify({ 'elitech-mail': { token: 'node-token-mail', rooms: ['CS1', 'CS2', 'CS3'] } }) });
  const r2 = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [{ room: 'CS3', t: 5 }, { room: 'CS1', t: 5 }] }, e: e2 });
  check('probe-cs1 pushing CS2 → "room CS2 is not this node\'s"; "cold room!" → "bad room id"; with ROOMS="CS1,CS2" a CS3 reading → "unknown room CS3" and CS1 stored',
    r.body.stored === 0 && errs[0] === 'room CS2 is not this node\'s' && errs[1] === 'bad room id' && r2.body.stored === 1 && r2.body.refused[0].error === 'unknown room CS3', { r: r.body, r2: r2.body }); }

// 5. COLD_MAP: device name → room; an unmapped device is refused; the device name is not stored
{ const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [{ device: 'Cold storage 2', t: 7.2, ts: iso(now - 5e3) }, { device: 'Cold Storage 9', t: 7.2 }] } });
  const l = await call('/cold/latest', { token: 'app-cold-token-123' });
  const p = l.body.rooms.CS2;
  check('{device:"Cold storage 2", t:7.2} with COLD_MAP (keys lower-cased, trimmed) → CS2 7.2, no device field stored; "Cold Storage 9" → "unmapped device cold storage 9"',
    r.body.stored === 1 && r.body.refused.length === 1 && r.body.refused[0].error === 'unmapped device cold storage 9' && p.t === 7.2 && !('device' in p), { r: r.body, p }); }

// 6. clock: 10 min in the future → clamped to now; 8 days old → refused
{ const a = mod.normalize({ room: 'CS1', t: 5, ts: now + 10 * 60e3 }, now, {}, null), b = mod.normalize({ room: 'CS1', t: 5, ts: now - 8 * 864e5 }, now, {}, null);
  check('a reading 10 min in the future is dated now (clamped); 8 days old → "older than 7 days"', a.reading && a.reading.ts === now && b.error === 'older than 7 days', { a, b }); }

// 7. duplicates, and an older reading never replaces the latest
{ const e3 = mkEnv(); const ts = now - 120e3, older = now - 600e3;
  const r1 = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [{ room: 'CS1', ts, t: 6.1 }, { room: 'CS1', ts, t: 6.1 }] }, e: e3 });
  const r2 = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [{ room: 'CS1', ts: older, t: 9.9 }] }, e: e3 });
  const l = await call('/cold/latest', { token: 'app-cold-token-123', e: e3 });
  check('the same ts + node twice → stored 1, duplicates 1; an OLDER reading (9.9) stored but /cold/latest keeps 6.1',
    r1.body.stored === 1 && r1.body.duplicates === 1 && r2.body.stored === 1 && l.body.rooms.CS1.t === 6.1, { r1: r1.body, r2: r2.body, l: l.body.rooms.CS1 }); }

// 8. heartbeat
{ const e4 = mkEnv(); const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: { readings: [] }, e: e4 });
  const node = JSON.parse(e4.R2.m.get('cold/node/elitech-mail.json') || '{}');
  check('heartbeat {readings:[]} → stored 0, cold/node/elitech-mail.json lastSeen set', r.status === 200 && r.body.stored === 0 && node.lastSeen > 0, { r: r.body, node }); }

// 9. history: 3 readings in one 15-min bucket → 1 point (the last), oldest first; hours=0 and a missing room → 400
{ const e5 = mkEnv(); const B = 15 * 60e3, base = Math.floor((now - 3600e3) / B) * B + 1000;
  await call('/cold/push', { method: 'POST', token: 'node-token-mail', e: e5, body: { readings: [
    { room: 'CS1', ts: base, t: 5.0 }, { room: 'CS1', ts: base + 60e3, t: 5.2 }, { room: 'CS1', ts: base + 120e3, t: 5.4 }, { room: 'CS1', ts: base - 3 * 3600e3, t: 4.4 } ] } });
  const h = await call('/cold/history?room=CS1&hours=24', { token: 'app-cold-token-123', e: e5 });
  const bad1 = await call('/cold/history?room=CS1&hours=0', { token: 'app-cold-token-123', e: e5 }), bad2 = await call('/cold/history?hours=24', { token: 'app-cold-token-123', e: e5 });
  const pts = (h.body && h.body.points) || [];
  check('/cold/history CS1 24 h: 3 readings in one 15-min bucket → 1 point (the last, 5.4) + the one 3 h earlier (4.4) → [4.4, 5.4] oldest first, each {ts, node, t}; hours=0 and no room → 400',
    h.status === 200 && pts.length === 2 && pts[0].t === 4.4 && pts[1].t === 5.4 && pts[1].ts === base + 120e3 && pts[1].node === 'elitech-mail' && bad1.status === 400 && bad2.status === 400, { pts, bad: [bad1.status, bad2.status] }); }

// 10. /cold/readings of a Manila day
{ const day = new Date(now + 8 * 3600e3).toISOString().slice(0, 10);
  const r = await call('/cold/readings?room=CS2&day=' + day, { token: 'app-cold-token-123' });
  check('/cold/readings CS2 today (Manila) → the stored readings, oldest first', r.status === 200 && r.body.readings.length === 3 && r.body.readings[0].ts <= r.body.readings[2].ts, r.body); }

// 11. health: no token, version 23.22, nothing secret
{ const h = await call('/cold/health'); const body = JSON.stringify(h.body);
  check('/cold/health without a token → 200, version "23.22", nodes elitech-mail, rooms CS1/CS2 with ts, no token or map value in the JSON',
    h.status === 200 && h.body.ok === true && h.body.version === '23.22' && h.body.nodes['elitech-mail'] > 0 && h.body.rooms.CS1 > 0 && h.body.elitech === 'never ran'
    && body.indexOf('token') < 0 && body.indexOf('app-cold') < 0 && body.indexOf('Cold storage 1') < 0, h.body); }

// 12. scheduled(): no keys → "not configured"; with keys → "waiting for … (no address is guessed)"; 0 fetch calls either way
{ let calls = 0; const real = globalThis.fetch; globalThis.fetch = async () => { calls++; return new Response('{}'); };
  const e6 = mkEnv(); await worker.scheduled({}, e6, {}); const s1 = JSON.parse(e6.R2.m.get('cold/elitech.json'));
  const e7 = mkEnv({ ELITECH_KEY_ID: 'kid', ELITECH_KEY_SECRET: 'ksecret' }); await worker.scheduled({}, e7, {}); const s2 = JSON.parse(e7.R2.m.get('cold/elitech.json'));
  globalThis.fetch = real;
  check('scheduled(): no ELITECH_KEY_ID → cold/elitech.json "not configured"; with ID + SECRET → "waiting for the Elitech Access API document (no address is guessed)"; 0 fetch calls',
    s1.state === 'not configured' && s2.state === 'waiting for the Elitech Access API document (no address is guessed)' && calls === 0, { s1, s2, calls }); }

// 13. a body over 64 KB → 413; not JSON → 400
{ const big = { readings: [], pad: 'x'.repeat(70 * 1024) };
  const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', body: big }), r2 = await call('/cold/push', { method: 'POST', token: 'node-token-mail', raw: '{nope' });
  check('a 70 KB body → 413 "body too large"; a body that is not JSON → 400', r.status === 413 && r.body.error === 'body too large' && r2.status === 400, { s: r.status, s2: r2.status }); }

// 14. v23.22 review: an alarm (12.6 °C 08:01 Manila) and the "recovered" mail (7.4 °C 08:09) in ONE push → /cold/latest says 7.4 but its
// "recent" list carries BOTH, and /cold/history keeps the worst AND the last of that 15-minute slot
{ const e8 = mkEnv(); const B = 15 * 60e3, slot = Math.floor((now - 2 * 3600e3) / B) * B, a = slot + 60e3, b = slot + 9 * 60e3;
  const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', e: e8, body: { readings: [{ room: 'CS1', ts: a, t: 12.6, alarm: 'high' }, { room: 'CS1', ts: b, t: 7.4, alarm: 'recovered' }] } });
  const l = await call('/cold/latest', { token: 'app-cold-token-123', e: e8 });
  const h = await call('/cold/history?room=CS1&hours=24', { token: 'app-cold-token-123', e: e8 });
  const rec = (l.body.recent || {}).CS1 || [], pts = (h.body.points || []).map(p => p.t);
  check('alarm 12.6 + recovered 7.4 in one push (one 15-min slot) → latest CS1 7.4; recent CS1 = [[ts 12.6], [ts 7.4]] with received; history [12.6, 7.4] (worst + last of the slot)',
    r.body.stored === 2 && l.body.rooms.CS1.t === 7.4 && rec.length === 2 && rec[0][1] === 12.6 && rec[1][1] === 7.4 && rec[0][0] === a && rec[0][2] > 0 && JSON.stringify(pts) === '[12.6,7.4]', { r: r.body, rec, pts }); }

// 15. v23.22 review: a blank, a tab, false, true, [] and [7] are not temperatures ("no temperature"); "5.6" (a numeric string) is 5.6
{ const bad = [' ', '\t', false, true, [], [7], 'abc'].map(t => mod.normalize({ room: 'CS1', t }, now, {}, null));
  const good = mod.normalize({ room: 'CS1', t: ' 5.6 ' }, now, {}, null);
  check('normalize t " " / "\\t" / false / true / [] / [7] / "abc" → all "no temperature" (never 0 °C or 1 °C); " 5.6 " → 5.6',
    bad.every(x => x.error === 'no temperature') && good.reading && good.reading.t === 5.6, { bad, good }); }

// 16. v23.22 review: a finished Manila day is folded at the first history call; a LATE reading for that day (23:58, 1.2 °C) deletes the fold,
// so the next history shows it
{ const e9 = mkEnv(); const day0 = Date.parse(new Date(now + 8 * 3600e3).toISOString().slice(0, 10) + 'T00:00:00+08:00');
  const late1 = day0 - 10 * 60e3, late2 = day0 - 2 * 60e3;   /* 23:50 and 23:58 of yesterday (Manila) */
  await call('/cold/push', { method: 'POST', token: 'node-token-mail', e: e9, body: { readings: [{ room: 'CS1', ts: late1, t: 13.4 }] } });
  const h1 = await call('/cold/history?room=CS1&hours=48', { token: 'app-cold-token-123', e: e9 });
  const yday = new Date(late1 + 8 * 3600e3).toISOString().slice(0, 10), folded = e9.R2.m.has(`cold/hist/${yday}/CS1.json`);
  await call('/cold/push', { method: 'POST', token: 'node-token-mail', e: e9, body: { readings: [{ room: 'CS1', ts: late2, t: 1.2 }] } });
  const gone = !e9.R2.m.has(`cold/hist/${yday}/CS1.json`);
  const h2 = await call('/cold/history?room=CS1&hours=48', { token: 'app-cold-token-123', e: e9 });
  check('yesterday 23:50 13.4 → history folds the day; a late 23:58 1.2 °C push deletes cold/hist/<day>/CS1.json → history now [13.4, 1.2]',
    folded && gone && JSON.stringify((h1.body.points || []).map(p => p.t)) === '[13.4]' && JSON.stringify((h2.body.points || []).map(p => p.t)) === '[13.4,1.2]', { h1: h1.body.points, h2: h2.body.points, folded, gone }); }

// 17. v23.22 review: Elitech fault events — {room, fault:"offline"} is stored per room (newest only) and returned by /cold/latest "faults";
// a bad fault word, and a probe pushing another room's fault, are refused
{ const e10 = mkEnv();
  const r = await call('/cold/push', { method: 'POST', token: 'node-token-mail', e: e10, body: { readings: [{ room: 'CS1', fault: 'offline', ts: now - 120e3, src: 'elitech-mail', msgId: 'm-off' }, { room: 'CS2', fault: 'unread', alarm: 'high', ts: now - 60e3 }, { room: 'CS1', fault: 'melted', ts: now }] } });
  const again = await call('/cold/push', { method: 'POST', token: 'node-token-mail', e: e10, body: { readings: [{ room: 'CS1', fault: 'offline', ts: now - 120e3 }] } });
  const p = await call('/cold/push', { method: 'POST', token: 'node-token-probe', e: e10, body: { readings: [{ room: 'CS2', fault: 'offline', ts: now }] } });
  const l = await call('/cold/latest', { token: 'app-cold-token-123', e: e10 });
  const f = l.body.faults || {};
  check('faults: CS1 offline + CS2 unread (high) stored (faults 2), "melted" → "bad fault melted", the same CS1 event again → duplicate, probe-cs1 → "room CS2 is not this node\'s"; /cold/latest faults CS1 offline / CS2 unread high, no temperature stored',
    r.body.faults === 2 && r.body.stored === 0 && r.body.refused[0].error === 'bad fault melted' && again.body.duplicates === 1 && p.body.refused[0].error === 'room CS2 is not this node\'s'
    && f.CS1 && f.CS1.fault === 'offline' && f.CS2 && f.CS2.fault === 'unread' && f.CS2.alarm === 'high' && !l.body.rooms.CS1, { r: r.body, again: again.body, p: p.body, f }); }

console.log(fails ? fails + ' failed' : total + '/' + total + ' passed');
process.exit(fails ? 1 : 0);
