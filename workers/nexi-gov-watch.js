/* nexi-gov-watch — Cloudflare Worker: government-source change monitor for the Nexi Compliance module
 * (Deep Well / Groundwater Permit workflow, v19.41), PLUS (v20.91) the Compliance Watchdog renewal
 * scan — a separate concern living in the same file/deploy to avoid a second auth/CORS setup for what
 * is still "watch government-facing compliance state and tell someone before it lapses."
 *
 * ── /gov/check — page-change watch (v19.41, unchanged) ──────────────────────────────────────────
 * The app cannot read government pages from the browser (cross-origin), so it asks this worker:
 *   GET /gov/check?url=<registered government URL>
 * The worker fetches the page (GET, follows redirects, 20 s budget), and returns JSON:
 *   { ok, status, lastModified, etag, contentType, length, hash, fetchedAt }
 * where hash = SHA-256 of the body (PDFs) or of the visible text with scripts/styles/whitespace stripped
 * (HTML), so a cosmetic re-render of a page does not count as a change. The app compares the hash with
 * the one recorded at verification time and, when different, marks the source CHANGED and opens a
 * "Re-verify fees / regulations" task for the Compliance Officer.
 * Only URLs on the allowlisted government hosts are fetched (no open proxy). Nothing about THIS part
 * is stored server-side — the app keeps the recorded hash itself.
 *
 * ── /gov/renewals — Compliance Watchdog (v20.91, new) ────────────────────────────────────────────
 * A separate concern from /gov/check: this reads Nexi's OWN synced CEA Regulatory Register and CEA
 * cases (via the existing hnx-sync worker, same bearer-token login the app itself uses) and flags
 * licenses approaching their file-by-renewal date, and CEA cases stuck on the same status for 14+
 * days (the exact "Edelyn pressed it 3x over 4 days" trap v20.84 stopped happening silently — this
 * catches it from the outside instead of waiting for someone to notice).
 *   GET  /gov/renewals              — run the scan now and return { findings[], generatedAt }
 *   POST /gov/renewals/run          — same scan, plus stores the result to RENEWALS_KV for the
 *                                      weekly cron and for /gov/renewals/latest to read back fast
 *   GET  /gov/renewals/latest       — last stored result (falls back to running fresh if none yet)
 * A license with no expiry (v20.82 — SEC/BIR Certificate of Registration etc.) is skipped, same rule
 * as the register screen itself. The renewal window is each item's OWN leadDays field (the same "Lead
 * days" the register screen already saves per license, ceaRgLd) — not a separate config table — so
 * changing it in Nexi's UI changes what this worker flags on its very next run, no redeploy needed.
 *
 * Deploy (wrangler):
 *   name = "nexi-gov"  main = "nexi-gov-watch.js"  compatibility_date = "2026-08-01"
 *   [vars] APP_ORIGIN = "https://aba-pardes-monitoring.netlify.app"   (CORS; comma-separate several)
 *   [triggers] crons = ["0 22 * * 6"]   (22:00 UTC Saturday = 06:00 Asia/Manila Sunday)
 *   kv_namespaces = [{ binding = "RENEWALS_KV", id = "<wrangler kv:namespace create RENEWALS_KV>" }]
 *   optional secret GOV_TOKEN: when set, /gov/check requests must carry Authorization: Bearer <GOV_TOKEN>
 *   secrets for /gov/renewals (reads Nexi's own data, same pattern as workers/nexi-night-audit.js):
 *     HNX_SYNC_USER, HNX_SYNC_PASS_HASH  - a Nexi service-account login (read access is enough)
 * Then put the worker URL in Nexi → Compliance → Water / Deep Well → Gov. Sources → Gov-watch worker URL
 * (for /gov/check) — /gov/renewals needs no separate URL field, same worker URL serves both.
 */
const HNX_SYNC_BASE = 'https://hnx-sync.eyalbenari99.workers.dev';
const RENEWALS_KV_PREFIX = 'renewals:';
const DEFAULT_WINDOW_DAYS = 60; // used only when a register item has no leadDays of its own
const STUCK_DAYS = 14;
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

/* ── Compliance Watchdog (v20.91) ── */
async function hnxSyncToken(env) {
  const r = await fetch(HNX_SYNC_BASE + '/auth/app-login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: String(env.HNX_SYNC_USER || '').toLowerCase(), hash: env.HNX_SYNC_PASS_HASH })
  });
  if (!r.ok) throw new Error('hnx-sync login failed: ' + r.status);
  const d = await r.json();
  if (!d || !d.token) throw new Error('hnx-sync login returned no token');
  return d.token;
}
async function pullSyncedData(env) {
  const token = await hnxSyncToken(env);
  const r = await fetch(HNX_SYNC_BASE + '/sync/pull', { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('hnx-sync pull failed: ' + r.status);
  return r.json();
}
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
/* Real schema (matches tests/payroll's v20.82/v20.83 CEA fixtures exactly):
 *   hydroPro_cea_reg_v1   : Array<{id, name, company, agency, expiry, leadDays, owner, status}>
 *   hydroPro_cea_cases_v1 : Array<{id, title, status, owner, extra:{regItemId}, updatedAt, approvedAt?, ...}>
 * A register item with expiry:'' never expires (v20.82) and is always skipped. leadDays lives ON the
 * item itself (edited per-license in the register screen) — there is no separate config table to read. */
function runRenewalScan(data) {
  const register = (data && data.hydroPro_cea_reg_v1) || [];
  const cases = (data && data.hydroPro_cea_cases_v1) || [];
  const now = new Date().toISOString().slice(0, 10);
  const findings = [];
  const openCaseByRegister = {}; // regItemId -> caseId, for any case not yet APPROVED/REJECTED/CLOSED
  cases.forEach(function (c) {
    if (c && c.extra && c.extra.regItemId && c.status && !/^(APPROVED|REJECTED|CLOSED)$/i.test(c.status)) {
      openCaseByRegister[c.extra.regItemId] = c.id;
    }
  });
  register.forEach(function (item) {
    if (!item || !item.expiry) return; // v20.82: no-expiry licenses (SEC/BIR COR) are never flagged
    const daysLeft = daysBetween(now, item.expiry);
    const windowDays = (+item.leadDays > 0) ? +item.leadDays : DEFAULT_WINDOW_DAYS;
    if (daysLeft > windowDays) return;
    if (openCaseByRegister[item.id]) {
      findings.push({ rule: 'renewal_window', severity: 'info', entity: item.id, name: item.name || item.id, detail: `Within ${windowDays}d renewal window, already in progress (case ${openCaseByRegister[item.id]})`, daysLeft, link: 'cea_register' });
    } else {
      findings.push({ rule: 'renewal_window', severity: daysLeft <= 0 ? 'danger' : (daysLeft <= Math.floor(windowDays / 3) ? 'danger' : 'warn'), entity: item.id, name: item.name || item.id, detail: `Expires in ${daysLeft}d, no renewal case open yet (window ${windowDays}d)`, daysLeft, link: 'cea_register' });
    }
  });
  cases.forEach(function (c) {
    if (!c || !c.status || /^(APPROVED|REJECTED|CLOSED)$/i.test(c.status)) return;
    const changedAt = c.updatedAt;
    if (!changedAt) return;
    const stuckDays = daysBetween(new Date(+changedAt || changedAt).toISOString(), now);
    if (stuckDays >= STUCK_DAYS) {
      findings.push({ rule: 'case_stuck', severity: 'warn', entity: c.id, name: c.title || c.id, detail: `Status "${c.status}" unchanged for ${stuckDays} days`, stuckDays, link: 'cea_case' });
    }
  });
  return { generatedAt: new Date().toISOString(), findings };
}
async function runRenewalsAndStore(env) {
  const data = await pullSyncedData(env);
  const result = runRenewalScan(data);
  if (env.RENEWALS_KV) await env.RENEWALS_KV.put(RENEWALS_KV_PREFIX + result.generatedAt.slice(0, 10), JSON.stringify(result), { expirationTtl: 120 * 24 * 60 * 60 });
  return result;
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (url.pathname === '/gov/health') return json({ ok: true, service: 'nexi-gov-watch', hosts: ALLOW_HOSTS.length }, 200, h);
    if (url.pathname === '/gov/renewals' && req.method === 'GET') {
      try { return json(runRenewalScan(await pullSyncedData(env)), 200, h); }
      catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 200, h); }
    }
    if (url.pathname === '/gov/renewals/run' && req.method === 'POST') {
      try { return json(await runRenewalsAndStore(env), 200, h); }
      catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 200, h); }
    }
    if (url.pathname === '/gov/renewals/latest' && req.method === 'GET') {
      if (!env.RENEWALS_KV) return json({ ok: false, error: 'RENEWALS_KV not bound' }, 500, h);
      const today = new Date().toISOString().slice(0, 10);
      let stored = await env.RENEWALS_KV.get(RENEWALS_KV_PREFIX + today);
      if (!stored) {
        try { return json(await runRenewalsAndStore(env), 200, h); }
        catch (e) { return json({ generatedAt: null, findings: [], error: String(e && e.message || e) }, 200, h); }
      }
      return json(JSON.parse(stored), 200, h);
    }
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
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runRenewalsAndStore(env).catch(() => {}));
  }
};
