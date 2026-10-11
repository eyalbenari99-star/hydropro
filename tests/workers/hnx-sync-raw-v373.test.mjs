// worker v3.7.3 (Nexi v22.52, "Sync · no connection" on every load): less memory and fewer KV writes per sync request.
//  - /sync/pull sends each stored value AS-IS (string concatenation, no parse / re-stringify) — the app gets the same data
//  - /sync/push writes nothing (0 KV values, no history copy) for a store that did not change, and checks Content-Length first
//  - a bare /sync/pull leaves out the QuickBooks/SOS caches; per-store cap 5 MB; daily snapshot in parts, marked done first
// Run: node tests/workers/hnx-sync-raw-v373.test.mjs   (no network; a mock KV / R2 stands in for TOKENS / UPLOADS)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../workers/hnx-sync-worker.js'), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'hnxw-'));
const file = join(dir, 'worker.mjs');
writeFileSync(file, src);
const worker = (await import(pathToFileURL(file).href)).default;
// the worker's own JSON check, taken from its source (it is not exported)
const isJsonText = new Function((src.match(/\/\/ --- json-check begin[\s\S]*?\/\/ --- json-check end ---/) || [''])[0] + '\nreturn typeof isJsonText === "function" ? isJsonText : null;')();

function mockKV(seed) {
  const m = new Map(Object.entries(seed || {}));
  const kv = {
    m, puts: 0, gets: 0, failGet: null,
    async get(k) { kv.gets++; if (kv.failGet) throw kv.failGet; return m.has(k) ? m.get(k) : null; },
    async put(k, v) { kv.puts++; m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '', cursor } = {}) {
      const all = [...m.keys()].filter(k => k.startsWith(prefix)).sort();
      const start = cursor ? +cursor : 0, page = all.slice(start, start + 1000), next = start + page.length;
      return { keys: page.map(name => ({ name })), list_complete: next >= all.length, cursor: next >= all.length ? undefined : String(next) };
    },
  };
  return kv;
}
function mockR2() {
  const o = new Map();
  const r2 = {
    o, failOn: null, seenMark: [],
    async put(k, v) { if (r2.failOn && r2.failOn(k)) throw new Error('R2 put failed for ' + k); if (r2.onPut) r2.onPut(k); o.set(k, String(v)); },
    async delete(k) { o.delete(k); },
    async list({ prefix = '' } = {}) { return { objects: [...o.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })), truncated: false }; },
  };
  return r2;
}
const SESSION = {
  'session:tok': JSON.stringify({ username: 'qa', expires: Date.now() + 3600e3 }),
  'user:qa': JSON.stringify({ username: 'qa', dataNamespace: 'eyal' }),
};
const H = { Authorization: 'Bearer tok', 'Content-Type': 'application/json', Origin: 'https://aba-pardes-monitoring.netlify.app' };
const req = (env, path, init = {}) => worker.fetch(new Request('https://w.test' + path, { headers: H, ...init }), env, { waitUntil() {} });

let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 300))); if (!ok) fails++; };

// ---------- 1. raw pull: same data as the old parse/re-stringify, stored text sent as-is ----------
{
  const pretty = '{"items": [ {"id":"A1", "price":"₱1,234.50", "note":"pool ₱ dose \\u20b1 \\"quoted\\""} ],  "n": 2 }';
  const arr = JSON.stringify([{ id: 'L1', company: 'Pardes ₱ Co', updatedAt: 1 }, { id: 'L2', tags: ['a', 'b'], ok: true, x: null, f: -1.5e3 }]);
  const seed = Object.assign({}, SESSION, {
    'data:eyal:hydroPro_pretty': pretty,
    'data:eyal:hydroPro_crm_leads': arr,
    'data:eyal:hydroPro_plain': 'plain text ₱ not json',
    'data:eyal:hydroPro_broken': '{"a":1',
    'data:eyal:hydroPro_jsonstr': JSON.stringify('2026-10-11'),
    'data:eyal:hydroPro_num': '42',
    'data:eyal:hydroPro_lone': '["x\uD800y"]',
  });
  const env = { TOKENS: mockKV(seed) };
  const keys = 'hydroPro_pretty,hydroPro_crm_leads,hydroPro_plain,hydroPro_broken,hydroPro_jsonstr,hydroPro_num,hydroPro_lone,hydroPro_missing';
  const r = await req(env, '/sync/pull?keys=' + encodeURIComponent(keys));
  const text = await r.text();
  let body = null; try { body = JSON.parse(text); } catch (e) { body = { parseError: String(e) }; }
  const d = (body && body.data) || {};
  check('raw pull: the reply is valid JSON with CORS headers and count 7 (the missing key is left out)', r.status === 200 && body.count === 7 && !('hydroPro_missing' in d) && r.headers.get('Access-Control-Allow-Origin') === 'https://aba-pardes-monitoring.netlify.app', { status: r.status, count: body.count });
  check('raw pull: the stored JSON text is in the reply byte for byte (₱ and spacing kept — nothing was parsed and re-stringified)', text.includes('"hydroPro_pretty":' + pretty) && text.includes('"hydroPro_crm_leads":' + arr), text.slice(0, 200));
  check('raw pull: the app reads the same values the old worker sent (parsed object, ₱ text intact)', JSON.stringify(d.hydroPro_pretty) === JSON.stringify(JSON.parse(pretty)) && d.hydroPro_pretty.items[0].price === '₱1,234.50' && JSON.stringify(d.hydroPro_crm_leads) === arr, d.hydroPro_pretty);
  check('raw pull: a stored value that is not JSON comes back as the same string (₱ intact); a broken one too', d.hydroPro_plain === 'plain text ₱ not json' && d.hydroPro_broken === '{"a":1', [d.hydroPro_plain, d.hydroPro_broken]);
  check('raw pull: a JSON string / number value comes back exactly as the old parse sent it', d.hydroPro_jsonstr === '2026-10-11' && d.hydroPro_num === 42, [d.hydroPro_jsonstr, d.hydroPro_num]);
  check('raw pull: a value holding a lone surrogate is sent as an escaped string (never a broken reply)', typeof d.hydroPro_lone === 'string' && d.hydroPro_lone === '["x\uD800y"]', d.hydroPro_lone);
  // push → pull roundtrip of ₱ text through the real routes
  const val = JSON.stringify({ memo: 'Bayad ₱16,000 → ₱727.27/day', at: '2026-10-11', list: [1, 2, 3] });
  const pr = await (await req(env, '/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_memo_rt: val } }) })).json();
  const back = await (await req(env, '/sync/pull?keys=hydroPro_memo_rt')).json();
  check('roundtrip: push then pull of ₱ text gives back the same value (stored text identical too)', pr.ok && env.TOKENS.m.get('data:eyal:hydroPro_memo_rt') === val && JSON.stringify(back.data.hydroPro_memo_rt) === val, back);
}

// ---------- 2. the JSON check agrees with JSON.parse (fuzz) ----------
{
  check('isJsonText was found in the worker source', typeof isJsonText === 'function', null);
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const gen = d => {
    const t = rnd();
    if (d > 4 || t < 0.25) return pick([0, -1, 1.5, -2.5e-3, 1e21, 123456789, true, false, null, '', 'a', '₱', 'x"y', 'tab\there', '\u0001', 'é ü', '🙂', '\\']);
    if (t < 0.6) { const n = Math.floor(rnd() * 4), a = []; for (let i = 0; i < n; i++) a.push(gen(d + 1)); return a; }
    const n = Math.floor(rnd() * 4), o = {}; for (let i = 0; i < n; i++) o[pick(['id', 'k', '₱', 'a b', ''])] = gen(d + 1); return o;
  };
  const chars = ['"', '\\', '{', '}', '[', ']', ',', ':', ' ', '\n', '0', '1', '-', '+', '.', 'e', 'E', 't', 'n', 'u', 'x', '\u0000', '\uD83D', '\uDE42', '₱'];
  const truth = s => { try { JSON.parse(s); } catch (_) { return false; } return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/.test(s); };
  let bad = 0, n = 0, firstBad = null;
  for (let i = 0; i < 20000; i++) {
    let s = JSON.stringify(gen(0), null, rnd() < 0.3 ? 2 : undefined);
    if (rnd() < 0.3) s = (rnd() < 0.5 ? ' \n' : '') + s + (rnd() < 0.5 ? '\t ' : '');
    const muts = rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 3);
    for (let m = 0; m < muts && s.length; m++) {
      const p = Math.floor(rnd() * s.length), op = rnd();
      s = op < 0.4 ? s.slice(0, p) + s.slice(p + 1) : op < 0.8 ? s.slice(0, p) + pick(chars) + s.slice(p) : s.slice(0, p);
    }
    n++;
    if (isJsonText(s) !== truth(s)) { bad++; if (!firstBad) firstBad = { s, mine: isJsonText(s), parse: truth(s) }; }
  }
  for (const s of ['', ' ', '01', '1.', '.5', '-', '1e', '1e+', '"\\x"', '"\\u12G4"', '[1,]', '{"a":1,}', '{a:1}', 'nul', 'true false', '"a"b', '﻿[]', '[1] ', '"\uDE42"']) { n++; if (isJsonText(s) !== truth(s)) { bad++; if (!firstBad) firstBad = { s, mine: isJsonText(s) }; } }
  for (const s of ['0', '-0', '0.5e-7', '1E+2', '"\\ud83d\\ude42"', '"🙂"', '[[[]]]', '{"":{}}', ' null ', '"\\/"']) { n++; if (!isJsonText(s)) { bad++; if (!firstBad) firstBad = { s, mine: false }; } }
  check('isJsonText agrees with JSON.parse on ' + n + ' valid, mutated and edge-case texts (0 disagreements)', bad === 0, firstBad);
  const deep = '['.repeat(5000) + ']'.repeat(5000);
  check('a 5,000-deep array is not followed past 2,000 levels (sent as a string, never a crash)', isJsonText(deep) === false, null);
}

// ---------- 3. unchanged push → 0 KV writes, no history copy ----------
{
  const env = { TOKENS: mockKV(Object.assign({}, SESSION)) };
  const v1 = JSON.stringify([{ id: 'C1', t: 'call ₱' }]);
  let r = await (await req(env, '/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_calls: v1, hydroPro_att: '{"2026-10-11":{}}' } }) })).json();
  check('first push writes both stores', r.ok && r.written === 2 && r.keys.join() === 'hydroPro_calls,hydroPro_att', r);
  const putsBefore = env.TOKENS.puts, keysBefore = env.TOKENS.m.size;
  r = await (await req(env, '/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_calls: v1, hydroPro_att: '{"2026-10-11":{}}' } }) })).json();
  check('the same push again writes 0 KV values (no data:, ver:, verlist: write) but still lists both keys as stored', env.TOKENS.puts === putsBefore && env.TOKENS.m.size === keysBefore && r.ok && r.written === 0 && r.unchanged === 2 && r.keys.join() === 'hydroPro_calls,hydroPro_att' && !(r.skipped || []).length, { puts: env.TOKENS.puts - putsBefore, r });
  const v2 = JSON.stringify([{ id: 'C1', t: 'call ₱ edited' }]);
  r = await (await req(env, '/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_calls: v2, hydroPro_att: '{"2026-10-11":{}}' } }) })).json();
  const verlist = JSON.parse(env.TOKENS.m.get('verlist:data:eyal:hydroPro_calls') || '[]');
  check('a changed store is written and its previous value kept as a version; the unchanged one is not', r.written === 1 && r.unchanged === 1 && env.TOKENS.m.get('data:eyal:hydroPro_calls') === v2 && verlist.length === 1 && env.TOKENS.m.get('ver:data:eyal:hydroPro_calls:' + verlist[0].ts) === v1 && !env.TOKENS.m.has('verlist:data:eyal:hydroPro_att'), { r, verlist });
}

// ---------- 4. bare pull leaves out the QuickBooks/SOS caches ----------
{
  const caches = ['hydroPro_acct_qb_monthly_v1', 'hydroPro_acct_qb_v1', 'hydroPro_sos_items_v1', 'hydroPro_sos_shipments_v1', 'hydroPro_sos_locations_v1', 'hydroPro_sos_lots_v1', 'hydroPro_sos_pull_v1', 'hydroPro_liveSensor_cache'];
  const seed = Object.assign({}, SESSION, { 'data:eyal:hydroPro_crm_leads': '[{"id":"L1"}]', 'data:eyal:hydroPro_sos_meta_v1': '{"connected":true}' });
  caches.forEach(k => { seed['data:eyal:' + k] = '{"big":"' + 'q'.repeat(3000) + '"}'; });
  const env = { TOKENS: mockKV(seed) };
  const r = await (await req(env, '/sync/pull')).json();
  check('bare /sync/pull: the 8 QuickBooks/SOS caches are left out; real stores (CRM leads, SOS connection flag) still come', r.count === 2 && caches.every(k => !(k in r.data)) && r.data.hydroPro_crm_leads[0].id === 'L1' && r.data.hydroPro_sos_meta_v1.connected === true, Object.keys(r.data));
  const one = await (await req(env, '/sync/pull?keys=hydroPro_acct_qb_monthly_v1')).json();
  check('…a ?keys= pull of a cache still returns it when asked by name', one.count === 1 && one.data.hydroPro_acct_qb_monthly_v1.big.length === 3000, one.count);
  const many = {}; for (let i = 0; i < 1200; i++) many['data:eyal:hydroPro_m' + String(i).padStart(4, '0')] = String(i);
  const env2 = { TOKENS: mockKV(Object.assign({}, SESSION, many, { 'data:eyal:hydroPro_sos_items_v1': '[1]' })) };
  const r2 = await (await req(env2, '/sync/pull')).json();
  check('bare /sync/pull follows the KV cursor past 1,000 keys (1,200 of 1,200) and still skips the cache', r2.count === 1200 && r2.data.hydroPro_m1199 === 1199 && !('hydroPro_sos_items_v1' in r2.data), r2.count);
}

// ---------- 5. 5 MB per-store cap + Content-Length checked before parsing ----------
{
  const env = { TOKENS: mockKV(Object.assign({}, SESSION)) };
  const r = await (await req(env, '/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_a: 'a'.repeat(5 * 1024 * 1024), hydroPro_b: 'b'.repeat(5 * 1024 * 1024 + 1) } }) })).json();
  check('per-store cap 5 MB: exactly 5 MB is stored, 5 MB + 1 is skipped too-big (named, not silent)', r.keys.join() === 'hydroPro_a' && r.skipped.length === 1 && r.skipped[0].key === 'hydroPro_b' && r.skipped[0].why === 'too-big' && !env.TOKENS.m.has('data:eyal:hydroPro_b'), { keys: r.keys, skipped: r.skipped });
  let parsed = false;
  const fake = { url: 'https://w.test/sync/push', method: 'POST', headers: new Headers({ Authorization: 'Bearer tok', 'Content-Length': String(40 * 1024 * 1024), Origin: 'https://aba-pardes-monitoring.netlify.app' }),
    json: async () => { parsed = true; return { data: {} }; }, text: async () => { parsed = true; return ''; } };
  const big = await worker.fetch(fake, env, { waitUntil() {} });
  const bj = await big.json();
  check('a 40 MB upload is refused with 413 BEFORE its body is parsed (clear error + CORS, no isolate crash)', big.status === 413 && !parsed && /too big/.test(bj.error) && big.headers.get('Access-Control-Allow-Origin') === 'https://aba-pardes-monitoring.netlify.app', { status: big.status, parsed, bj });
}

// ---------- 6. String(err) in the error replies ----------
{
  const env = { TOKENS: mockKV(Object.assign({}, SESSION)) };
  env.TOKENS.failGet = 'KV exploded'; // a thrown NON-Error
  const r = await req(env, '/sync/pull?keys=hydroPro_x');
  const j = await r.json().catch(() => ({}));
  check('a thrown non-Error becomes a readable 500 with CORS headers ("KV exploded"), not a crashed handler', r.status === 500 && j.error === 'KV exploded' && !!r.headers.get('Access-Control-Allow-Origin'), { status: r.status, j });
  const h = await (await req({ TOKENS: mockKV({}) }, '/health')).json();
  check('/health says 3.7.3-nexi, rawPull:true, pushSkipsUnchanged:true, storeMaxMB 5', h.version === '3.7.3-nexi' && h.rawPull === true && h.pushSkipsUnchanged === true && h.storeMaxMB === 5, h);
}

// ---------- 7. daily snapshot: parts of ~4 MB, marked done first, a failure is not retried every tick ----------
{
  const day = new Date().toISOString().slice(0, 10);
  const seed = {};
  for (let i = 0; i < 12; i++) seed['data:eyal:hydroPro_s' + String(i).padStart(2, '0')] = JSON.stringify({ i, t: '₱'.repeat(10) + 'x'.repeat(1024 * 1024) });
  seed['data:_shared:hydroPro_sh'] = '"shared ₱"';
  const env = { TOKENS: mockKV(seed), UPLOADS: mockR2() };
  let markAtFirstPut = null;
  env.UPLOADS.onPut = k => { if (markAtFirstPut == null) markAtFirstPut = env.TOKENS.m.get('snapdone:' + day) || ''; };
  const run = async () => { const ps = []; await worker.scheduled({ cron: '0 * * * *' }, env, { waitUntil(p) { ps.push(p); } }); await Promise.all(ps); };
  await run();
  const names = [...env.UPLOADS.o.keys()].filter(k => k.startsWith('snap/' + day + '/')).sort();
  const parts = names.filter(k => !k.endsWith('index.json'));
  const all = {}; let maxSize = 0, okParse = true;
  for (const p of parts) { const t = env.UPLOADS.o.get(p); maxSize = Math.max(maxSize, t.length); try { Object.assign(all, JSON.parse(t).data); } catch (e) { okParse = false; } }
  const idx = JSON.parse(env.UPLOADS.o.get('snap/' + day + '/index.json') || '{}');
  check('snapshot: 13 stores (~12 MB) are written as 4 parts of at most ~4 MB + index.json, each part valid JSON', parts.length === 4 && okParse && maxSize < 4.6 * 1024 * 1024 && idx.keys === 13 && idx.parts.length === 4, { parts: parts.length, maxSize, idx: idx.keys });
  check('snapshot: every stored text is in the parts exactly (₱ kept), keyed <namespace>:<store>', Object.keys(all).length === 13 && all['eyal:hydroPro_s03'] === seed['data:eyal:hydroPro_s03'] && all['_shared:hydroPro_sh'] === '"shared ₱"', Object.keys(all).length);
  check('snapshot: the day was marked BEFORE the first part was written, and says ok at the end', /^started /.test(markAtFirstPut || '') && /^ok /.test(env.TOKENS.m.get('snapdone:' + day) || ''), { markAtFirstPut, mark: env.TOKENS.m.get('snapdone:' + day) });
  const putsAfter = env.UPLOADS.o.size; await run();
  check('snapshot: a second cron tick the same day writes nothing', env.UPLOADS.o.size === putsAfter, env.UPLOADS.o.size - putsAfter);
  // failure: part 2 cannot be written
  const env2 = { TOKENS: mockKV(seed), UPLOADS: mockR2() };
  env2.UPLOADS.failOn = k => /\/002\.json$/.test(k);
  const run2 = async () => { const ps = []; await worker.scheduled({ cron: '0 * * * *' }, env2, { waitUntil(p) { ps.push(p); } }); await Promise.all(ps); };
  await run2();
  const mark = env2.TOKENS.m.get('snapdone:' + day) || '';
  const tries = () => [...env2.UPLOADS.o.keys()].length;
  const t1 = tries(); env2.UPLOADS.failOn = null; await run2();
  check('snapshot: a failed run is marked "failed …" and the next cron tick does NOT run it again', /^failed /.test(mark) && tries() === t1, { mark: mark.slice(0, 120), before: t1, after: tries() });
}

console.log('\n' + (total - fails) + '/' + total + ' passed');
process.exit(fails ? 1 : 0);
