/* hnx-sync worker — VERSION HISTORY + daily snapshot (v21.28, Data Safety)
 *
 * Why: every data-loss incident in Nexi was one computer uploading a stale, seeded or restored copy that the
 * clients then treated as the newest. The app now blocks that at the source (v21.27 / v21.28); this snippet
 * adds the safety net UNDER it: the worker keeps the previous value of every key on each push, so any store
 * can be put back from the cloud without hunting for a browser backup.
 *
 * Paste into the hnx-sync worker next to the /sync/push and /sync/pull handlers. Needs the same KV binding the
 * sync data lives in (SYNC_KV below — rename to your binding) and, for the daily snapshot, an R2 bucket binding
 * SNAP_R2 plus a cron trigger ("0 20 * * *" = 04:00 Manila). Both parts are optional and independent.
 *
 * Routes added:
 *   GET /sync/versions?key=<storeKey>          → { versions:[{ts,size}] } newest first (max 30 kept per key)
 *   GET /sync/version?key=<storeKey>&ts=<ts>   → { key, ts, value }  (value = the raw string that was stored)
 * Storage: KV "ver:<key>:<ts>" (value), "verlist:<key>" (JSON array of {ts,size}); each version expires after 45 days.
 */

const VER_KEEP = 30, VER_TTL = 45 * 86400;

/* 1) in the /sync/push handler, BEFORE the new values are written — `incoming` is the {key: rawString} map from the body */
async function keepVersions(env, incoming) {
  const now = Date.now();
  for (const key of Object.keys(incoming)) {
    try {
      const prev = await env.SYNC_KV.get('data:' + key);          // ← whatever prefix the worker uses for stored keys
      if (prev == null || prev === incoming[key]) continue;        // nothing stored yet / unchanged → nothing to keep
      let list = [];
      try { list = JSON.parse(await env.SYNC_KV.get('verlist:' + key) || '[]') || []; } catch (e) {}
      await env.SYNC_KV.put('ver:' + key + ':' + now, prev, { expirationTtl: VER_TTL });
      list.unshift({ ts: now, size: prev.length });
      for (const old of list.slice(VER_KEEP)) { try { await env.SYNC_KV.delete('ver:' + key + ':' + old.ts); } catch (e) {} }
      await env.SYNC_KV.put('verlist:' + key, JSON.stringify(list.slice(0, VER_KEEP)));
    } catch (e) { /* never fail a push because history could not be written */ }
  }
}
// usage inside the push handler:   await keepVersions(env, incoming);   // then write incoming as before

/* 2) routes — next to the other /sync/* routes (same auth guard as /sync/pull) */
if (url.pathname === '/sync/versions' && request.method === 'GET') {
  const auth = await requireAppAuth(request, env); if (auth instanceof Response) return auth;
  const key = url.searchParams.get('key') || '';
  let list = []; try { list = JSON.parse(await env.SYNC_KV.get('verlist:' + key) || '[]') || []; } catch (e) {}
  return json({ key, versions: list });
}
if (url.pathname === '/sync/version' && request.method === 'GET') {
  const auth = await requireAppAuth(request, env); if (auth instanceof Response) return auth;
  const key = url.searchParams.get('key') || '', ts = url.searchParams.get('ts') || '';
  const value = await env.SYNC_KV.get('ver:' + key + ':' + ts);
  if (value == null) return json({ error: 'no such version' }, 404);
  return json({ key, ts: +ts, value });
}

/* 3) optional daily snapshot of EVERYTHING to R2 (keeps 60 days) — add a `scheduled` handler and the cron trigger */
export async function scheduled(event, env, ctx) {
  try {
    const list = await env.SYNC_KV.list({ prefix: 'data:' });
    const snap = {};
    for (const k of list.keys) snap[k.name.slice(5)] = await env.SYNC_KV.get(k.name);
    const day = new Date().toISOString().slice(0, 10);
    await env.SNAP_R2.put('snap/' + day + '.json', JSON.stringify({ exportedAt: Date.now(), app: 'HydroNexis-AI', data: snap }));
    const old = await env.SNAP_R2.list({ prefix: 'snap/' });
    const cutoff = new Date(Date.now() - 60 * 86400e3).toISOString().slice(0, 10);
    for (const o of old.objects) if (o.key.slice(5, 15) < cutoff) await env.SNAP_R2.delete(o.key);
  } catch (e) { console.error('snapshot failed', e && e.message); }
}
// The snapshot file has the same shape as the app's "⬇ Download backup" file, so 📂 Backups → Restore from file accepts it.
