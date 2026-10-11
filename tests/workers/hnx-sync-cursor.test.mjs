// v22.17 (Step 2.0): the hnx-sync worker follows the KV list cursor and names the stores it refuses (v3.7.3: cap 5 MB again).
// Run: node tests/workers/hnx-sync-cursor.test.mjs   (no network; a mock KV stands in for TOKENS)
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

function mockKV(seed) {
  const m = new Map(Object.entries(seed));
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '', cursor } = {}) { // KV pages at 1000 keys
      const all = [...m.keys()].filter(k => k.startsWith(prefix)).sort();
      const start = cursor ? +cursor : 0, page = all.slice(start, start + 1000), next = start + page.length;
      return { keys: page.map(name => ({ name })), list_complete: next >= all.length, cursor: next >= all.length ? undefined : String(next) };
    },
  };
}
const seed = {
  'session:tok': JSON.stringify({ username: 'qa', expires: Date.now() + 3600e3 }),
  'user:qa': JSON.stringify({ username: 'qa', dataNamespace: 'eyal' }),
};
for (let i = 0; i < 2500; i++) seed['data:eyal:hydroPro_q' + String(i).padStart(4, '0')] = '"v' + i + '"';
const env = { TOKENS: mockKV(seed), UPLOADS: { put: async () => {} } };
const H = { Authorization: 'Bearer tok', 'Content-Type': 'application/json' };
const call = async (path, init = {}) => (await worker.fetch(new Request('https://w.test' + path, { headers: H, ...init }), env, { waitUntil() {} })).json();

let fails = 0;
const check = (name, ok, got) => { console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 200))); if (!ok) fails++; };

const keys = await call('/sync/keys');
check('/sync/keys lists 2,500 of 2,500 stores (KV pages at 1,000)', keys.count === 2500, keys.count);
const pull = await call('/sync/pull');
check('/sync/pull downloads 2,500 of 2,500 stores', pull.count === 2500 && pull.data.hydroPro_q2499 === 'v2499', pull.count);
const big = 'x'.repeat(21 * 1024 * 1024);
const push = await call('/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_qsmall: '[1]', hydroPro_qbig: big } }) });
check('/sync/push stores the small store and names the 21 MB one as skipped', push.ok && push.keys.join() === 'hydroPro_qsmall' && (push.skipped||[]).length === 1 && push.skipped[0].key === 'hydroPro_qbig' && push.skipped[0].why === 'too-big', { keys: push.keys, skipped: push.skipped });
// v3.7.3: the per-store cap is back at 5 MB (3.7.1's 20 MB waits until the raw pull is live) — a 6 MB store is NAMED as skipped
const mid = await call('/sync/push', { method: 'POST', body: JSON.stringify({ data: { hydroPro_qmid: 'y'.repeat(6 * 1024 * 1024), hydroPro_qok: 'z'.repeat(4.9 * 1024 * 1024) } }) });
check('/sync/push (v3.7.3) names a 6 MB store as skipped too-big and stores a 4.9 MB one (cap 5 MB)', mid.keys && mid.keys.join() === 'hydroPro_qok' && (mid.skipped||[]).length === 1 && mid.skipped[0].key === 'hydroPro_qmid' && mid.skipped[0].why === 'too-big', { keys: mid.keys, skipped: mid.skipped });
console.log('\n' + (4 - fails) + '/4 passed');
process.exit(fails ? 1 : 0);
