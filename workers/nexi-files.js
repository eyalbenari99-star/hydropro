/* ============================================================================
   nexi-files — Nexi's file service on DROPBOX (v21.08)
   Eyal: "all ... should be in Dropbox as we are used to — organised and friendly".
   Compliance (CEA) documents, drawings and receipts are stored in the company Dropbox,
   one folder per company / case / category, instead of as base64 inside the browser.

   Routes (all need  Authorization: Bearer <FILES_TOKEN>):
     GET  /files/health                     -> { ok, root, account? }
     POST /files/upload?path=/CEA/...        body = the raw file bytes
                                             -> { ok, path, id, rev, size, content_hash, name }
     GET  /files/link?path=/CEA/...          -> { ok, link }   (Dropbox temporary link, ~4 h)
     GET  /files/list?path=/CEA/...          -> { ok, entries:[{name,path,id,size,folder,modified}] }
   Paths are always inside ROOT (default "/Nexi"); ".." and absolute escapes are refused.

   Secrets (wrangler secret put ...):
     DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN  — a Dropbox app with
       files.content.write + files.content.read (+ sharing not needed); refresh token from the
       OAuth "offline" flow.
     FILES_TOKEN — the shared token the app sends (typed once in CEA ▸ Building ▸ ⚙ File service).
   Vars: ROOT (optional, default /Nexi), APP_ORIGIN (CORS, default *).
   ============================================================================ */
let _tok = null, _tokExp = 0;

async function accessToken(env) {
  if (_tok && Date.now() < _tokExp - 60e3) return _tok;
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.DROPBOX_REFRESH_TOKEN || '' });
  const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa((env.DROPBOX_APP_KEY || '') + ':' + (env.DROPBOX_APP_SECRET || '')),
               'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('dropbox auth failed: ' + (j.error_description || j.error || r.status));
  _tok = j.access_token; _tokExp = Date.now() + (Number(j.expires_in) || 14400) * 1000;
  return _tok;
}

function root(env) { return String(env.ROOT || '/Nexi').replace(/\/+$/, ''); }
function safePath(env, p) {
  p = String(p || '').replace(/\\/g, '/');
  if (!p.startsWith('/')) p = '/' + p;
  if (/(^|\/)\.\.(\/|$)/.test(p)) return null;
  p = p.replace(/\/{2,}/g, '/').replace(/[<>:"|?*\u0000-\u001f]/g, '_');
  if (p.length > 900) return null;
  return root(env) + p;
}

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.APP_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-File-Name',
    };
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    if (!env.FILES_TOKEN || req.headers.get('Authorization') !== 'Bearer ' + env.FILES_TOKEN) return json({ error: 'unauthorized' }, 401);
    try {
      if (url.pathname === '/files/health') {
        const t = await accessToken(env);
        const r = await fetch('https://api.dropboxapi.com/2/users/get_current_account', { method: 'POST', headers: { Authorization: 'Bearer ' + t } });
        const a = await r.json().catch(() => ({}));
        return json({ ok: r.ok, root: root(env), account: a && a.name ? a.name.display_name : undefined });
      }
      if (url.pathname === '/files/upload' && req.method === 'POST') {
        const path = safePath(env, url.searchParams.get('path'));
        if (!path) return json({ error: 'bad path' }, 400);
        const bytes = await req.arrayBuffer();
        if (!bytes.byteLength) return json({ error: 'empty file' }, 400);
        if (bytes.byteLength > 140 * 1024 * 1024) return json({ error: 'file too large (140 MB max per upload)' }, 413);
        const t = await accessToken(env);
        const r = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/octet-stream',
                     'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true, mute: true }).replace(/[\u007f-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) },
          body: bytes,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return json({ error: 'dropbox upload failed', detail: j.error_summary || r.status }, 502);
        const rl = String(j.path_display || '');
        return json({ ok: true, path: rl, rel: rl.toLowerCase().startsWith(root(env).toLowerCase()) ? rl.slice(root(env).length) : rl, id: j.id, rev: j.rev, size: j.size, content_hash: j.content_hash, name: j.name });
      }
      if (url.pathname === '/files/link') {
        const path = safePath(env, url.searchParams.get('path'));
        if (!path) return json({ error: 'bad path' }, 400);
        const t = await accessToken(env);
        const r = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
          method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return json({ error: 'not found in Dropbox', detail: j.error_summary || r.status }, 404);
        return json({ ok: true, link: j.link });
      }
      if (url.pathname === '/files/list') {
        const path = safePath(env, url.searchParams.get('path') || '/');
        if (!path) return json({ error: 'bad path' }, 400);
        const t = await accessToken(env);
        const r = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ path, limit: 500 }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return json({ ok: true, entries: [] });
        return json({ ok: true, entries: (j.entries || []).map(e => ({ name: e.name, path: e.path_display, id: e.id, size: e.size || 0, folder: e['.tag'] === 'folder', modified: e.server_modified || '' })) });
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};
