// nexi-irr (pool sensor feed, Eyal 12 Oct 2026: "connect Nexi to EC PH water level pool"). Run: node tests/workers/nexi-irr.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'irr-'));
const file = join(dir, 'irr.mjs');
writeFileSync(file, readFileSync(join(here, '../../workers/nexi-irr.js'), 'utf8'));
const mod = await import(pathToFileURL(file).href);
const worker = mod.default;
let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 400))); if (!ok) fails++; };

/* a mock R2 bucket: get/put/head/list over a Map */
const mkR2 = () => { const m = new Map(); return { m,
  async get(k) { return m.has(k) ? { text: async () => m.get(k) } : null; },
  async put(k, v) { m.set(k, typeof v === 'string' ? v : String(v)); },
  async head(k) { return m.has(k) ? {} : null; },
  async list({ prefix }) { return { objects: [...m.keys()].filter(k => k.startsWith(prefix)).sort().map(key => ({ key })), truncated: false }; } }; };
const env = { R2: mkR2(), IRR_TOKEN: 'app-token-123',
  NODE_TOKENS: JSON.stringify({ 'tap-room1-2': { token: 'node-token-abc', pools: ['P01', 'P02'] }, 'tap-room9': { token: 'node-token-xyz', pools: ['P09'] } }) };
const call = async (path, { method = 'GET', token, body } = {}) => {
  const r = await worker.fetch(new Request('https://irr.test' + path, { method, headers: token ? { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }), env, {});
  return { status: r.status, body: await r.json() };
};
const now = Date.now(), iso = ms => new Date(ms).toISOString();

// 1. tokens
{ const a = await call('/irr/latest'), b = await call('/irr/latest', { token: 'node-token-abc' }), c = await call('/irr/push', { method: 'POST', token: 'app-token-123', body: { readings: [] } });
  check('no token → 401 on /irr/latest; a node token cannot read (401); the app token cannot push (401)', a.status === 401 && b.status === 401 && c.status === 401, [a.status, b.status, c.status]); }

// 2. a node pushes P01: level 0.42 m → 42 cm, values rounded, latest returns it
{ const r = await call('/irr/push', { method: 'POST', token: 'node-token-abc', body: { readings: [{ pool: 'p01', ts: iso(now - 60e3), ec: 1.6649, ph: 6.21, wt: 27.34, level_m: 0.42 }] } });
  const l = await call('/irr/latest', { token: 'app-token-123' });
  const p = l.body.pools && l.body.pools.P01;
  check('Room 1&2 tap pushes P01 EC 1.6649, pH 6.21, 27.34 °C, level 0.42 m → stored 1; /irr/latest P01 = EC 1.66, pH 6.21, 27.3 °C, 42 cm, node tap-room1-2, lastSeen set',
    r.status === 200 && r.body.stored === 1 && p && p.ec === 1.66 && p.ph === 6.21 && p.wt === 27.3 && p.level_cm === 42 && p.node === 'tap-room1-2' && l.body.nodes['tap-room1-2'] && l.body.nodes['tap-room1-2'].lastSeen > 0, { r: r.body, p }); }

// 3. pools that are not the node's, unknown pools, impossible values → refused, the rest stored
{ const r = await call('/irr/push', { method: 'POST', token: 'node-token-abc', body: { readings: [
    { pool: 'P09', ts: iso(now), ec: 1.7 },            // not this node's
    { pool: 'GH1', ts: iso(now), ec: 1.7 },            // not a Nexi pool id
    { pool: 'P02', ts: iso(now), ec: 25 },             // EC 25 = probe fault
    { pool: 'P02', ts: iso(now) },                      // nothing measured
    { pool: 'P02', ts: iso(now - 30e3), ph: 5.9, level_cm: 55 } ] } });
  const errs = (r.body.refused || []).map(x => x.error);
  check('of 5 readings: P09 (not the node\'s), GH1 (unknown), P02 EC 25 (out of range) and P02 with no values are refused, P02 pH 5.9 / 55 cm is stored',
    r.body.stored === 1 && errs.length === 4 && /not this node/.test(errs[0]) && /unknown pool GH1/.test(errs[1]) && /ec out of range/.test(errs[2]) && /no values/.test(errs[3]), r.body); }

// 4. a wrong clock in the future is clamped to the receive time; the same reading twice is stored once
{ const fut = now + 3 * 3600e3;
  const r1 = await call('/irr/push', { method: 'POST', token: 'node-token-xyz', body: { readings: [{ pool: 'P09', ts: fut, ec: 1.8 }] } });
  const l = await call('/irr/latest', { token: 'app-token-123' });
  const t = l.body.pools.P09.ts;
  const same = { pool: 'P09', ts: iso(now - 120e3), ec: 1.75 };
  const r2 = await call('/irr/push', { method: 'POST', token: 'node-token-xyz', body: { readings: [same, same] } });
  check('GH9 node with its clock 3 h ahead: the reading is dated by the worker (not the future); the same reading sent twice → stored 1, duplicates 1',
    r1.body.stored === 1 && t <= Date.now() && t >= now && r2.body.stored === 1 && r2.body.duplicates === 1, { t, now, r2: r2.body }); }

// 5. an older reading never replaces a newer latest
{ const l = await call('/irr/latest', { token: 'app-token-123' });
  check('P09 latest stays the newest reading (EC 1.8 at receive time), not the older EC 1.75 pushed after it', l.body.pools.P09.ec === 1.8, l.body.pools.P09); }

// 6. history by Manila day, oldest first
{ const day = new Date(now + 8 * 3600e3).toISOString().slice(0, 10);
  const h = await call('/irr/readings?pool=P09&day=' + day, { token: 'app-token-123' });
  check('/irr/readings P09 for today (Manila) → 2 readings, oldest first (EC 1.75 then 1.8)', h.body.readings && h.body.readings.length === 2 && h.body.readings[0].ec === 1.75 && h.body.readings[1].ec === 1.8, h.body); }

// 7. the cron without Pro-Leaf credentials does nothing and says so; 0 outside calls
{ let calls = 0; const real = globalThis.fetch; globalThis.fetch = async () => { calls++; return new Response('{}'); };
  await worker.scheduled({}, env, {});
  globalThis.fetch = real;
  const l = await call('/irr/latest', { token: 'app-token-123' });
  check('the 5-minute cron with no Pro-Leaf account set → state "not configured", 0 outside calls', l.body.proleaf && l.body.proleaf.state === 'not configured' && calls === 0, { proleaf: l.body.proleaf, calls }); }

// 8. normalize on its own: a reading older than 7 days is refused
{ const n = mod.normalize({ pool: 'P01', ts: now - 8 * 864e5, ec: 1.7 }, now);
  check('a reading 8 days old is refused ("older than 7 days")', n.error === 'older than 7 days', n); }

console.log(fails ? fails + ' failed' : total + '/' + total + ' passed');
process.exit(fails ? 1 : 0);
