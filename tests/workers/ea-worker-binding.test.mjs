// ea-worker v2.2.2 (Eyal, 9 Oct: "hnx-sync 404"): a worker cannot fetch another worker of the same account over *.workers.dev —
// the session check goes through the Service binding HNX_SYNC when it is bound, and a 404 without a binding says what to add.
// Run: node tests/workers/ea-worker-binding.test.mjs   (no network: mock KV, mock binding, mock global fetch)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'eaw-'));
const file = join(dir, 'ea.mjs');
writeFileSync(file, readFileSync(join(here, '../../workers/ea-worker.js'), 'utf8'));
const worker = (await import(pathToFileURL(file).href)).default;
function kv() { const m = new Map(); return { m, async get(k) { return m.has(k) ? m.get(k) : null; }, async put(k, v) { m.set(k, String(v)); }, async delete(k) { m.delete(k); }, async list() { return { keys: [] }; } }; }
let fails = 0;
const check = (name, ok, got) => { console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 300))); if (!ok) fails++; };
const req = tok => new Request('https://ea.test/ea/status', { headers: { Authorization: 'Bearer ' + tok, Origin: 'https://aba-pardes-monitoring.netlify.app' } });
const realFetch = globalThis.fetch;
let publicCalls = 0;
globalThis.fetch = async (url) => { publicCalls++; return new Response('Not found', { status: 404 }); };

// 1) bound: the call goes through env.HNX_SYNC, never the public URL → 200
{ const seen = []; const env = { EA_KV: kv(), TENANT: 'aba', HNX_SYNC: { fetch: async r => { seen.push(new URL(r.url).pathname + ' ' + r.headers.get('Authorization')); return new Response(JSON.stringify({ username: 'Eyal', isAdmin: true }), { status: 200 }); } } };
  publicCalls = 0; const r = await worker.fetch(req('cloud-token-123'), env, { waitUntil() {} });
  check('bound HNX_SYNC: /ea/status 200, /auth/me asked through the binding with the same Bearer, 0 public calls', r.status === 200 && seen[0] === '/auth/me Bearer cloud-token-123' && publicCalls === 0, { status: r.status, seen, publicCalls }); }
// 2) not bound and the public URL answers 404 → 401 that names the binding to add
{ const env = { EA_KV: kv(), TENANT: 'aba' };
  const r = await worker.fetch(req('cloud-token-456'), env, { waitUntil() {} }); const t = await r.text();
  check('no binding, workers.dev 404 → 401 "add the Service binding HNX_SYNC → hnx-sync"', r.status === 401 && /Service binding HNX_SYNC/.test(t), { status: r.status, t: t.slice(0, 200) }); }
// 3) the session is cached 10 min: a second request does not call hnx-sync again
{ let n = 0; const env = { EA_KV: kv(), TENANT: 'aba', HNX_SYNC: { fetch: async () => { n++; return new Response(JSON.stringify({ username: 'dramy' }), { status: 200 }); } } };
  await worker.fetch(req('cloud-token-789'), env, { waitUntil() {} }); const r2 = await worker.fetch(req('cloud-token-789'), env, { waitUntil() {} });
  check('the session is cached: 2 requests → 1 hnx-sync call, both 200', n === 1 && r2.status === 200, { n, status: r2.status }); }
globalThis.fetch = realFetch;
console.log(fails ? fails + ' failed' : '3/3 passed');
process.exit(fails ? 1 : 0);
