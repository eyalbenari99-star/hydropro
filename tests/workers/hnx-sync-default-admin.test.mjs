// worker v3.7.2 (security): the app's default admin (admin / admin123) can never sign in to the cloud, and
// /sync/push never stores the UNUSED default admin (bootstrap:true + admin123). A record with a real password is
// never refused or removed, whatever its flags. Normal users still sign in.
// Run: node tests/workers/hnx-sync-default-admin.test.mjs   (no network; a mock KV stands in for TOKENS)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../workers/hnx-sync-worker.js'), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'hnxw-'));
const file = join(dir, 'worker.mjs');
writeFileSync(file, src);
const worker = (await import(pathToFileURL(file).href)).default;

// The app's own hashPassword, read from index.html — the worker's constants must match what the app stores.
const app = readFileSync(join(here, '../../index.html'), 'utf8');
const salt = (app.match(/async function hashPassword\(pw\)\{\s*const salt='([^']+)'/) || [])[1];
const fbSrc = (app.match(/function fallbackHash\(s\)\{[\s\S]*?\n\}/) || [])[0];
const fallbackHash = new Function(fbSrc + '\nreturn fallbackHash;')();
const shaHex = pw => createHash('sha256').update(pw + ':' + salt).digest('hex');
const appHash = pw => 'sha256:' + shaHex(pw);
const appHashFb = pw => 'fb1:' + fallbackHash(pw + ':' + salt);

function mockKV(seed) {
  const m = new Map(Object.entries(seed));
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) { return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).sort().map(name => ({ name })), list_complete: true }; },
  };
}
const EYAL = { username: 'eyal', fullname: 'Eyal', role: 'admin', active: true, passwordHash: appHash('real-pass-1') };
const MARIA = { username: 'maria', fullname: 'Maria', role: 'supervisor', active: true, passwordHash: appHashFb('maria-pw') };
const BOOT = { username: 'admin', fullname: 'System Admin', role: 'admin', active: true, mustChangePassword: true, bootstrap: true, passwordHash: appHash('admin123'), updatedAt: 1 };
const makeEnv = roster => ({ TOKENS: mockKV({ 'data:eyal:hydroPro_users': JSON.stringify(roster) }), UPLOADS: { put: async () => {} } });
const post = async (env, path, body, token) => {
  const r = await worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: JSON.stringify(body) }), env, { waitUntil() {} });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
const login = (env, u, h) => post(env, '/auth/app-login', { username: u, hash: h });

let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 300))); if (!ok) fails++; };
const refused = r => r.status === 403 && /default admin is disabled/.test(r.data.error || '') && !r.data.token;

check('the app salt and fallback hash were read from index.html', !!salt && typeof fallbackHash === 'function', { salt });
check('the worker\'s admin123 constants match the app\'s hashPassword (3 forms)', src.includes(appHash('admin123')) && src.includes(shaHex('admin123')) && src.includes(appHashFb('admin123')), {});

// 1. the default admin is refused — flagged, unflagged, every hash form, upper-case hex, and with no admin in the roster
check('app-login: admin + admin123, roster record bootstrap:true → 403', refused(await login(makeEnv([EYAL, MARIA, BOOT]), 'admin', appHash('admin123'))), {});
for (const [label, h] of [['sha256:', appHash('admin123')], ['bare hex', shaHex('admin123')], ['fb1:', appHashFb('admin123')], ['upper-case hex', 'sha256:' + shaHex('admin123').toUpperCase()]]) {
  const env = makeEnv([EYAL, MARIA, { username: 'admin', role: 'admin', active: true, passwordHash: h }]);
  check('app-login: "ADMIN" + admin123 (' + label + '), not flagged → 403', refused(await login(env, 'ADMIN', h)), {});
}
check('app-login: admin + admin123 when the roster has no admin → 403 (not 401)', refused(await login(makeEnv([EYAL, MARIA]), 'admin', appHash('admin123'))), {});
const bootOther = { username: 'setup', role: 'admin', active: true, bootstrap: true, passwordHash: appHash('admin123') };
check('app-login: a bootstrap:true record under another name still on admin123 → 403', refused(await login(makeEnv([EYAL, bootOther]), 'setup', appHash('admin123'))), {});

// 2. nobody real is locked out
let env = makeEnv([EYAL, MARIA, BOOT]);
let r = await login(env, 'eyal', appHash('real-pass-1'));
check('app-login: real admin "eyal" with his own password → 200 + token', r.status === 200 && !!r.data.token, r);
const eyalTok = r.data.token;
r = await login(env, 'maria', appHashFb('maria-pw'));
check('app-login: supervisor "maria" (fb1 hash) → 200 + token', r.status === 200 && !!r.data.token, r);
r = await login(env, 'maria', appHash('wrong'));
check('app-login: "maria" with a wrong hash → 401', r.status === 401, r);
r = await login(makeEnv([EYAL, { username: 'admin', role: 'admin', active: true, passwordHash: appHash('S3cure-real!') }]), 'admin', appHash('S3cure-real!'));
check('app-login: a REAL "admin" (own password, no flag) → 200 + token', r.status === 200 && !!r.data.token, r);
r = await login(makeEnv([EYAL, { username: 'admin', role: 'admin', active: true, bootstrap: true, passwordHash: appHash('S3cure-real!') }]), 'admin', appHash('S3cure-real!'));
check('app-login: a REAL "admin" whose old record still carries bootstrap:true but has a real password → 200 (never locked out)', r.status === 200 && !!r.data.token, r);
r = await login(makeEnv([EYAL, { username: 'Admin', role: 'admin', active: true, bootstrap: true, passwordHash: appHash('admin123') }, { username: 'admin', role: 'admin', active: true, passwordHash: appHash('S3cure-real!') }]), 'admin', appHash('S3cure-real!'));
check('app-login: a stray default "Admin" listed BEFORE the real "admin" does not lock the real one out → 200', r.status === 200 && !!r.data.token, r);
r = await login(makeEnv([EYAL, { username: 'setup', role: 'admin', active: true, bootstrap: true, passwordHash: appHash('xyz-987') }]), 'setup', appHash('xyz-987'));
check('app-login: a bootstrap:true record with its own real password ("setup") → 200 (only the admin123 password is refused)', r.status === 200 && !!r.data.token, r);

// 3. /sync/push drops ONLY the unused default admin (bootstrap:true + admin123)
const realFlagged = { username: 'admin2', role: 'admin', active: true, bootstrap: true, passwordHash: appHash('real-2') };
const usedAdmin = { username: 'admin', role: 'admin', active: true, lastLogin: '2026-10-01T08:00:00.000Z', passwordHash: appHash('admin123') };
r = await post(env, '/sync/push', { data: { hydroPro_users: JSON.stringify([EYAL, MARIA, BOOT, realFlagged]), hydroPro_memos: '[]' } }, eyalTok);
let stored = JSON.parse(env.TOKENS.m.get('data:eyal:hydroPro_users'));
check('sync/push: the unused default admin is dropped; eyal, maria and a flagged account with a real password are kept; other keys untouched',
  r.status === 200 && stored.map(u => u.username).join() === 'eyal,maria,admin2' && env.TOKENS.m.get('data:eyal:hydroPro_memos') === '[]', stored.map(u => u.username));
r = await post(env, '/sync/push', { data: { hydroPro_users: JSON.stringify([EYAL, MARIA, usedAdmin]) } }, eyalTok);
stored = JSON.parse(env.TOKENS.m.get('data:eyal:hydroPro_users'));
check('sync/push: a used "admin" still on admin123 (no flag) is KEPT — never deleted', stored.map(u => u.username).join() === 'eyal,maria,admin', stored.map(u => u.username));
check('app-login: …but that kept "admin" cannot sign in with admin123 → 403', refused(await login(env, 'admin', appHash('admin123'))), {});
r = await post(env, '/sync/push', { data: { hydroPro_users: JSON.stringify([BOOT]) } }, eyalTok);
const after = JSON.parse(env.TOKENS.m.get('data:eyal:hydroPro_users'));
check('sync/push: a roster holding ONLY the default admin is not stored (skipped default-admin-only); the cloud keeps its real users',
  r.status === 200 && (r.data.skipped || []).some(s => s.key === 'hydroPro_users' && s.why === 'default-admin-only') && after.length === 3, { r: r.data, after: after.map(u => u.username) });
r = await post(env, '/sync/push', { data: { hydroPro_users: JSON.stringify(JSON.stringify([EYAL, BOOT])) } }, eyalTok);
let dbl = JSON.parse(JSON.parse(env.TOKENS.m.get('data:eyal:hydroPro_users')));
check('sync/push: a double-encoded roster is cleaned too and stays double-encoded', dbl.map(u => u.username).join() === 'eyal', dbl);

console.log('\n' + (total - fails) + '/' + total + ' passed');
process.exit(fails ? 1 : 0);
