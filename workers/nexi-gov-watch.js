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
const ALLOW_HOSTS = ['muntinlupacity.gov.ph','www.muntinlupacity.gov.ph','eia.emb.gov.ph','emb.gov.ph','www.emb.gov.ph','cshp.dole.gov.ph','dole.gov.ph','www.dole.gov.ph','r7.denr.gov.ph','denr.gov.ph','www.denr.gov.ph','nwrb.gov.ph','www.nwrb.gov.ph','bfp.gov.ph','www.bfp.gov.ph',
  /* v19.48 immigration & visa paths */ 'immigration.gov.ph','www.immigration.gov.ph','e-services.immigration.gov.ph','ble.dole.gov.ph','philjobnet.gov.ph','www.philjobnet.gov.ph','pra.gov.ph','www.pra.gov.ph','boi.gov.ph','www.boi.gov.ph','peza.gov.ph','www.peza.gov.ph','doj.gov.ph','www.doj.gov.ph','dfa.gov.ph','www.dfa.gov.ph','bir.gov.ph','www.bir.gov.ph','nbi.gov.ph','www.nbi.gov.ph'];

function cors(env, req) {
  const origins = String(env.APP_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);
  const o = req.headers.get('Origin') || '';
  const allow = origins.includes('*') ? '*' : (origins.includes(o) ? o : origins[0]);
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin' };
}
function json(obj, status, hdr) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, hdr || {}) }); }
async function sha256(buf) { const d = await crypto.subtle.digest('SHA-256', buf); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
/* Several PH government portals reject a bare API-style request. These are the ordinary headers a
   browser sends for a top-level page load; nothing here defeats a login, a CAPTCHA or any access
   control — a page that needs a human still returns 401/403 and is reported as Blocked, never faked. */
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-PH,en-US;q=0.9,en;q=0.8',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'no-cache'
};
/* a status the site returns to refuse an automated caller, as opposed to being down */
function isBlocked(code) { return code === 401 || code === 403 || code === 405 || code === 429 || code === 451; }

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
      const r = await fetch(target.toString(), { redirect: 'follow', signal: ctl.signal, headers: BROWSER_HEADERS, cf: { cacheTtl: 0 } });
      const ct = r.headers.get('content-type') || '';
      const buf = await r.arrayBuffer();
      let hash, length = buf.byteLength;
      if (/html|xml|text/i.test(ct)) { const txt = visibleText(new TextDecoder('utf-8', { fatal: false }).decode(buf)); hash = await sha256(new TextEncoder().encode(txt)); length = txt.length; }
      else hash = await sha256(buf);
      return json({ ok: r.ok, status: r.status, blocked: isBlocked(r.status), finalUrl: r.url, lastModified: r.headers.get('last-modified') || '', etag: r.headers.get('etag') || '', contentType: ct, length, hash, fetchedAt: new Date().toISOString() }, 200, h);
    } catch (e) {
      return json({ ok: false, status: 0, blocked: false, error: String(e && e.message || e), fetchedAt: new Date().toISOString() }, 200, h);
    } finally { clearTimeout(t); }
  }
};
