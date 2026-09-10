/* nexi-gov-watch — Cloudflare Worker: government-source change monitor for the Nexi Compliance module
 * (Deep Well / Groundwater Permit workflow, v19.41).
 *
 * The app cannot read government pages from the browser (cross-origin), so it asks this worker:
 *   GET /gov/check?url=<registered government URL>
 * The worker fetches the page (GET, follows redirects, 20 s budget), and returns JSON:
 *   { ok, status, lastModified, etag, contentType, length, hash, fetchedAt }
 * where hash = SHA-256 of the body (PDFs) or of the visible text with scripts/styles/whitespace stripped
 * (HTML), so a cosmetic re-render of a page does not count as a change. The app compares the hash with
 * the one recorded at verification time and, when different, marks the source CHANGED and opens a
 * "Re-verify fees / regulations" task for the Compliance Officer.
 *
 * Only URLs on the allowlisted government hosts are fetched (no open proxy). Nothing is stored.
 *
 * Deploy (wrangler):
 *   name = "nexi-gov"  main = "nexi-gov-watch.js"  compatibility_date = "2026-08-01"
 *   [vars] APP_ORIGIN = "https://aba-pardes-monitoring.netlify.app"   (CORS; comma-separate several)
 *   optional secret GOV_TOKEN: when set, requests must carry  Authorization: Bearer <GOV_TOKEN>
 * Then put the worker URL in Nexi → Compliance → Water / Deep Well → Gov. Sources → Gov-watch worker URL.
 */
const ALLOW_HOSTS = ['muntinlupacity.gov.ph','www.muntinlupacity.gov.ph','eia.emb.gov.ph','emb.gov.ph','www.emb.gov.ph','cshp.dole.gov.ph','dole.gov.ph','www.dole.gov.ph','r7.denr.gov.ph','denr.gov.ph','www.denr.gov.ph','nwrb.gov.ph','www.nwrb.gov.ph','bfp.gov.ph','www.bfp.gov.ph'];

function cors(env, req) {
  const origins = String(env.APP_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);
  const o = req.headers.get('Origin') || '';
  const allow = origins.includes('*') ? '*' : (origins.includes(o) ? o : origins[0]);
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin' };
}
function json(obj, status, hdr) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, hdr || {}) }); }
async function sha256(buf) { const d = await crypto.subtle.digest('SHA-256', buf); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function visibleText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (url.pathname === '/gov/health') return json({ ok: true, service: 'nexi-gov-watch', hosts: ALLOW_HOSTS.length }, 200, h);
    if (url.pathname !== '/gov/check' || req.method !== 'GET') return json({ ok: false, error: 'not found' }, 404, h);
    if (env.GOV_TOKEN) {
      const a = req.headers.get('Authorization') || '';
      if (a !== 'Bearer ' + env.GOV_TOKEN) return json({ ok: false, error: 'unauthorized' }, 401, h);
    }
    let target;
    try { target = new URL(url.searchParams.get('url') || ''); } catch (e) { return json({ ok: false, error: 'bad url' }, 400, h); }
    if (target.protocol !== 'https:' || !ALLOW_HOSTS.includes(target.hostname)) return json({ ok: false, error: 'host not allowlisted', host: target.hostname }, 403, h);
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(target.toString(), { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NexiGovWatch/1.0; +https://aba-pardes-monitoring.netlify.app)', 'Accept': 'text/html,application/pdf,*/*' }, cf: { cacheTtl: 0 } });
      const ct = r.headers.get('content-type') || '';
      const buf = await r.arrayBuffer();
      let hash, length = buf.byteLength;
      if (/html|xml|text/i.test(ct)) { const txt = visibleText(new TextDecoder('utf-8', { fatal: false }).decode(buf)); hash = await sha256(new TextEncoder().encode(txt)); length = txt.length; }
      else hash = await sha256(buf);
      return json({ ok: r.ok, status: r.status, finalUrl: r.url, lastModified: r.headers.get('last-modified') || '', etag: r.headers.get('etag') || '', contentType: ct, length, hash, fetchedAt: new Date().toISOString() }, 200, h);
    } catch (e) {
      return json({ ok: false, status: 0, error: String(e && e.message || e), fetchedAt: new Date().toISOString() }, 200, h);
    } finally { clearTimeout(t); }
  }
};
