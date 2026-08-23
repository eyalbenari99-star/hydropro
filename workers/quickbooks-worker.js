/* nexi-qb — NEXI's QuickBooks Online connector (Cloudflare Worker)
 *
 * Lets the app PULL transactions straight from QuickBooks for bank/card
 * reconciliation — no more manual Excel exports. The worker holds the
 * Intuit OAuth tokens; the browser only ever talks to this worker.
 *
 * DEPLOY (Cloudflare dashboard → Workers & Pages → Create → paste this):
 *   name: nexi-qb
 *   Bindings: R2 bucket binding named  R2  → bucket hnx-uploads (same as nexi-bio)
 *   Secrets (Settings → Variables and Secrets):
 *     QB_TOKEN              — bearer the app uses to call THIS worker (invent one)
 *     INTUIT_CLIENT_ID      — from developer.intuit.com (see below)
 *     INTUIT_CLIENT_SECRET  — same app
 *
 * INTUIT SETUP (one time, ~15 min):
 *   1. developer.intuit.com → sign in with the SAME Intuit account that owns
 *      the QuickBooks companies → Dashboard → Create an app → QuickBooks
 *      Online and Payments → name: NEXI.
 *   2. In the app → Keys & credentials → PRODUCTION keys → copy Client ID +
 *      Client Secret into the worker secrets above.
 *   3. Redirect URIs → add EXACTLY:
 *        https://nexi-qb.eyalbenari99.workers.dev/qb/callback
 *   4. Connect each company once: open in a browser
 *        https://nexi-qb.eyalbenari99.workers.dev/qb/connect
 *      → Intuit login → choose the company (APTI realm 123145713380624,
 *      APAC realm 193514687079844) → "connected" page. Repeat per company.
 *      Tokens refresh themselves after that (Intuit refresh tokens last ~100
 *      days and roll forward on every use).
 *
 * ROUTES
 *   GET /qb/health                          → { ok, connectedRealms } (no auth)
 *   GET /qb/connect                         → Intuit OAuth (no auth — Intuit login IS the auth)
 *   GET /qb/callback                        → OAuth landing (Intuit calls it)
 *   GET /qb/accounts?realm=                 → [{id,name,acctNum,type}]      (Bearer QB_TOKEN)
 *   GET /qb/gl?realm=&account=&start=&end=  → {rows:[{date,type,num,name,memo,amount}]}
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const API = 'https://quickbooks.api.intuit.com/v3/company/';
const TOK_KEY = 'qb/tokens.json';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const self = url.origin;

    if (p === '/qb/health') {
      const t = await loadTokens(env);
      return json({ ok: true, connectedRealms: Object.keys(t), hasClient: !!(env.INTUIT_CLIENT_ID && env.INTUIT_CLIENT_SECRET) });
    }

    if (p === '/qb/connect') {
      if (!env.INTUIT_CLIENT_ID) return text('INTUIT_CLIENT_ID secret not set on the worker yet.');
      const q = new URLSearchParams({
        client_id: env.INTUIT_CLIENT_ID,
        response_type: 'code',
        scope: 'com.intuit.quickbooks.accounting',
        redirect_uri: self + '/qb/callback',
        state: 'nexi' + Math.random().toString(36).slice(2, 10),
      });
      return Response.redirect(AUTH_BASE + '?' + q.toString(), 302);
    }

    if (p === '/qb/callback') {
      const code = url.searchParams.get('code');
      const realmId = url.searchParams.get('realmId');
      if (!code || !realmId) return text('Missing code/realmId — start again at /qb/connect');
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(env.INTUIT_CLIENT_ID + ':' + env.INTUIT_CLIENT_SECRET),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: self + '/qb/callback' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!d.refresh_token) return text('Token exchange failed: ' + JSON.stringify(d).slice(0, 300));
      const toks = await loadTokens(env);
      toks[realmId] = { refresh_token: d.refresh_token, access_token: d.access_token, at: Date.now() };
      await env.R2.put(TOK_KEY, JSON.stringify(toks));
      return text('✅ QuickBooks company ' + realmId + ' connected to NEXI.\nYou can close this tab. Repeat /qb/connect for the other company if needed.');
    }

    /* authenticated routes */
    const auth = req.headers.get('Authorization') || '';
    if (!env.QB_TOKEN || auth !== 'Bearer ' + env.QB_TOKEN) return json({ error: 'unauthorized' }, 401);

    const realm = url.searchParams.get('realm') || '';
    if (p === '/qb/accounts' || p === '/qb/gl') {
      if (!realm) return json({ error: 'need realm' }, 400);
      const access = await accessToken(env, realm);
      if (!access) return json({ error: 'realm not connected — open /qb/connect in a browser and authorize this company' }, 503);

      if (p === '/qb/accounts') {
        const q = encodeURIComponent("select Id, Name, AcctNum, AccountType, CurrencyRef from Account where Active in (true,false) maxresults 1000");
        const r = await qbo(access, realm, '/query?query=' + q);
        if (r.error) return json(r, 502);
        const list = (((r.QueryResponse || {}).Account) || []).map(a => ({
          id: a.Id, name: a.Name, acctNum: a.AcctNum || '', type: a.AccountType || '',
          currency: (a.CurrencyRef && a.CurrencyRef.value) || '',
        }));
        return json({ ok: true, accounts: list });
      }

      /* General Ledger report for one account — the recon feed */
      const account = url.searchParams.get('account'), start = url.searchParams.get('start'), end = url.searchParams.get('end');
      if (!account || !start || !end) return json({ error: 'need account, start, end (YYYY-MM-DD)' }, 400);
      const qp = new URLSearchParams({
        start_date: start, end_date: end, account,
        columns: 'tx_date,txn_type,doc_num,name,memo,subt_nat_amount',
        accounting_method: 'Accrual', minorversion: '75',
      });
      const r = await qbo(access, realm, '/reports/GeneralLedger?' + qp.toString());
      if (r.error) return json(r, 502);
      const rows = [];
      (function walk(node) {
        if (!node) return;
        if (Array.isArray(node.Row)) node.Row.forEach(walk);
        if (node.Rows) walk(node.Rows);
        if (node.type === 'Data' && Array.isArray(node.ColData)) {
          const c = node.ColData.map(x => (x && x.value) || '');
          const amt = parseFloat(String(c[5]).replace(/,/g, ''));
          if (c[0] && !isNaN(amt) && amt !== 0)
            rows.push({ date: c[0], type: c[1], num: c[2], name: c[3], memo: c[4], amount: Math.round(amt * 100) / 100 });
        }
      })(r);
      return json({ ok: true, rows, count: rows.length });
    }

    return json({ error: 'not found' }, 404);
  },
};

async function loadTokens(env) {
  try { const o = await env.R2.get(TOK_KEY); return o ? await o.json() : {}; } catch { return {}; }
}
async function accessToken(env, realm) {
  const toks = await loadTokens(env);
  const t = toks[realm];
  if (!t || !t.refresh_token) return null;
  if (t.access_token && Date.now() - (t.at || 0) < 50 * 60e3) return t.access_token;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(env.INTUIT_CLIENT_ID + ':' + env.INTUIT_CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh_token }),
  });
  const d = await res.json().catch(() => ({}));
  if (!d.access_token) return null;
  toks[realm] = { refresh_token: d.refresh_token || t.refresh_token, access_token: d.access_token, at: Date.now() };
  await env.R2.put(TOK_KEY, JSON.stringify(toks));
  return d.access_token;
}
async function qbo(access, realm, path) {
  try {
    const res = await fetch(API + realm + path, { headers: { Authorization: 'Bearer ' + access, Accept: 'application/json' } });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return { error: 'qbo ' + res.status, detail: (d.Fault && d.Fault.Error) || d };
    return d;
  } catch (e) { return { error: String(e) }; }
}
function text(s) { return new Response(s, { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS } }); }
function json(o, status = 200) { return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } }); }
