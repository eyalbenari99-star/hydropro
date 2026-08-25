/* nexi-qb — NEXI's READ-ONLY QuickBooks Online reader (Cloudflare Worker)
 *
 * WHY THIS EXISTS
 * The claude.ai QuickBooks connector is an interactive session login: its
 * token lapses and QuickBooks "disconnects" every few days. This worker
 * holds the Intuit refresh token itself and rolls it forward on every call,
 * so once each company is authorized ONE time, Nexi can read QuickBooks
 * for ~100 days without anybody logging in again. That is the fix for the
 * repeated "QB disconnected".
 *
 * READ-ONLY BY CONSTRUCTION — not by policy
 * Every request this worker sends to Intuit is a GET (see qbo(), which takes
 * no method and no body). There is no code path in this file that can create,
 * update, void or delete anything in QuickBooks. Nexi can see 100% of the
 * books and cannot change one peso.
 *   - /qb/query only accepts a statement starting with SELECT.
 *   - /qb/report only accepts report names on the REPORTS whitelist.
 *   - The Intuit API's write operations are POSTs; this worker never POSTs
 *     to the API host (the only POSTs are to Intuit's token endpoint).
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
 * NOTE ON THE INTUIT LOGIN USED IN STEP 4
 * Intuit only lets a company ADMIN authorize an app, so step 4 is done with
 * an admin login — but the grant is scoped to this worker, and this worker
 * can only read. A QuickBooks "Reports only" user cannot authorize apps, so
 * it is not an alternative here; the read-only guarantee comes from the code
 * above, which is stronger than a user role you can later widen by accident.
 *
 * ROUTES (all GET; every data route needs  Authorization: Bearer QB_TOKEN)
 *   /qb/health                              → { ok, connectedRealms }   (no auth)
 *   /qb/connect                             → Intuit OAuth (no auth — Intuit login IS the auth)
 *   /qb/callback                            → OAuth landing (Intuit calls it)
 *   /qb/snapshot?realm=                     → the every-few-minutes copy of the books,
 *                                             answered from R2 with no call to Intuit:
 *                                             { at, ageSeconds, data:{accounts, balanceSheet,
 *                                               profitAndLoss, trialBalance, agedPayables,
 *                                               agedReceivables} }
 *   /qb/sync?realm=                         → run one sync right now, don't wait for the tick
 *   /qb/company?realm=                      → company name, address, fiscal year
 *   /qb/accounts?realm=                     → [{id,name,acctNum,type,subType,parent,balance,active}]
 *   /qb/gl?realm=&account=&start=&end=      → {rows:[{date,type,num,name,memo,amount}]}
 *   /qb/report?realm=&name=X&<params>       → {rows:[{depth,label,values[]}], raw}
 *                                             any extra query param is passed to
 *                                             Intuit (start_date, end_date,
 *                                             accounting_method, summarize_column_by…)
 *   /qb/query?realm=&q=SELECT+...           → {entities:[…]}  SELECT statements only
 *   /qb/entity?realm=&type=Bill&id=123      → the full record, every field
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
const SNAP_KEY = (realm) => 'qb/snap/' + realm + '.json';

/* What the every-few-minutes sync pulls for each company. Keep this short:
 * the whole point is that it finishes well inside one cron tick. Anything not
 * on this list is still readable live through /qb/report and /qb/query. */
const SYNC = [
  { key: 'accounts', kind: 'accounts' },
  { key: 'balanceSheet', kind: 'report', name: 'BalanceSheet', params: { accounting_method: 'Accrual' } },
  { key: 'profitAndLoss', kind: 'report', name: 'ProfitAndLoss', params: { accounting_method: 'Accrual', date_macro: 'This Fiscal Year-to-date' } },
  { key: 'trialBalance', kind: 'report', name: 'TrialBalance', params: { accounting_method: 'Accrual' } },
  { key: 'agedPayables', kind: 'report', name: 'AgedPayables', params: {} },
  { key: 'agedReceivables', kind: 'report', name: 'AgedReceivables', params: {} },
];

/* Every report QuickBooks Online publishes. Nexi may read all of them and
 * write none of them. Adding a name here can never grant write access —
 * /reports/* is a read-only family in the Intuit API. */
const REPORTS = [
  'BalanceSheet', 'BalanceSheetDetail', 'ProfitAndLoss', 'ProfitAndLossDetail',
  'TrialBalance', 'GeneralLedger', 'GeneralLedgerDetail', 'CashFlow', 'JournalReport',
  'AccountList', 'TransactionList', 'TransactionListByCustomer', 'TransactionListByVendor',
  'AgedReceivables', 'AgedReceivableDetail', 'AgedPayables', 'AgedPayableDetail',
  'CustomerBalance', 'CustomerBalanceDetail', 'VendorBalance', 'VendorBalanceDetail',
  'CustomerIncome', 'CustomerSales', 'VendorExpenses',
  'SalesByCustomer', 'SalesByCustomerSummary', 'SalesByProduct', 'SalesByProductSummary',
  'ItemSales', 'InventoryValuationSummary', 'InventoryValuationDetail',
  'ClassSalesSummary', 'DepartmentSalesSummary', 'ProfitAndLossByClass',
  'PurchaseByVendorDetail', 'ExpensesByVendorSummary', 'TaxSummary',
];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const self = url.origin;

    if (p === '/qb/health') {
      const t = await loadTokens(env);
      const realms = Object.keys(t);
      const synced = {};
      for (const rid of realms) {
        const snap = await loadSnap(env, rid);
        synced[rid] = snap ? { at: snap.at, ageSeconds: Math.round((Date.now() - snap.at) / 1000), ok: !!snap.ok, error: snap.error || '' } : null;
      }
      return json({ ok: true, connectedRealms: realms, hasClient: !!(env.INTUIT_CLIENT_ID && env.INTUIT_CLIENT_SECRET), lastSync: synced });
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
    /* the every-few-minutes copy — answers instantly, never calls Intuit */
    if (p === '/qb/snapshot') {
      if (!realm) return json({ error: 'need realm' }, 400);
      const snap = await loadSnap(env, realm);
      if (!snap) return json({ error: 'no snapshot yet — the sync has not run for this company. Check /qb/health.' }, 503);
      return json({ ...snap, ageSeconds: Math.round((Date.now() - snap.at) / 1000) });
    }
    /* force one sync now instead of waiting for the next tick */
    if (p === '/qb/sync') {
      if (!realm) return json({ error: 'need realm' }, 400);
      const snap = await syncRealm(env, realm);
      return json({ ok: snap.ok, at: snap.at, error: snap.error || '', keys: Object.keys(snap.data || {}) });
    }

    const DATA = ['/qb/accounts', '/qb/gl', '/qb/company', '/qb/report', '/qb/query', '/qb/entity'];
    if (DATA.indexOf(p) >= 0) {
      if (!realm) return json({ error: 'need realm' }, 400);
      const access = await accessToken(env, realm);
      if (!access) return json({ error: 'realm not connected — open /qb/connect in a browser and authorize this company' }, 503);

      /* who are we looking at — so the app can label the numbers it shows */
      if (p === '/qb/company') {
        const r = await qbo(access, realm, '/companyinfo/' + realm + '?minorversion=75');
        if (r.error) return json(r, 502);
        const c = r.CompanyInfo || {};
        return json({
          ok: true, realm,
          name: c.CompanyName || '', legalName: c.LegalName || '',
          country: c.Country || '', fiscalYearStart: c.FiscalYearStartMonth || '',
          address: ((c.CompanyAddr || {}).Line1 || '') + ' ' + ((c.CompanyAddr || {}).City || ''),
        });
      }

      /* any QuickBooks report, by name — this is how Nexi sees 100% of the books */
      if (p === '/qb/report') {
        const name = url.searchParams.get('name') || '';
        if (REPORTS.indexOf(name) < 0)
          return json({ error: 'unknown report: ' + name, allowed: REPORTS }, 400);
        const qp = new URLSearchParams();
        url.searchParams.forEach((v, k) => { if (k !== 'realm' && k !== 'name') qp.set(k, v); });
        if (!qp.has('minorversion')) qp.set('minorversion', '75');
        const r = await qbo(access, realm, '/reports/' + name + '?' + qp.toString());
        if (r.error) return json(r, 502);
        return json({ ok: true, report: name, rows: flatten(r), header: r.Header || {}, columns: colNames(r) });
      }

      /* read any list of records. SELECT only — nothing else is accepted. */
      if (p === '/qb/query') {
        const q = (url.searchParams.get('q') || '').trim();
        if (!/^select\s/i.test(q)) return json({ error: 'only SELECT statements are allowed' }, 400);
        if (q.indexOf(';') >= 0) return json({ error: 'one SELECT statement only' }, 400);
        const r = await qbo(access, realm, '/query?minorversion=75&query=' + encodeURIComponent(q));
        if (r.error) return json(r, 502);
        const qr = r.QueryResponse || {};
        const key = Object.keys(qr).filter((k) => Array.isArray(qr[k]))[0] || '';
        return json({ ok: true, type: key, count: (qr[key] || []).length, entities: qr[key] || [], total: qr.totalCount });
      }

      /* one record, every field — for drilling into a bill, JE, invoice… */
      if (p === '/qb/entity') {
        const type = (url.searchParams.get('type') || '').replace(/[^a-z]/gi, '').toLowerCase();
        const id = (url.searchParams.get('id') || '').replace(/[^0-9]/g, '');
        if (!type || !id) return json({ error: 'need type and id' }, 400);
        const r = await qbo(access, realm, '/' + type + '/' + id + '?minorversion=75');
        if (r.error) return json(r, 502);
        return json({ ok: true, type, id, record: r });
      }

      if (p === '/qb/accounts') {
        const q = encodeURIComponent("select * from Account where Active in (true,false) maxresults 1000");
        const r = await qbo(access, realm, '/query?minorversion=75&query=' + q);
        if (r.error) return json(r, 502);
        const list = (((r.QueryResponse || {}).Account) || []).map(a => ({
          id: a.Id, name: a.Name, acctNum: a.AcctNum || '', type: a.AccountType || '',
          subType: a.AccountSubType || '',
          parent: (a.ParentRef && a.ParentRef.value) || '',
          fullName: a.FullyQualifiedName || a.Name,
          balance: typeof a.CurrentBalance === 'number' ? a.CurrentBalance : null,
          active: a.Active !== false,
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

  /* Cloudflare cron. Set the schedule in the dashboard under
   * Settings -> Triggers -> Cron Triggers. Use the expression
   *     star-slash-5 space star space star space star space star
   * (written normally it would end this comment) for every five minutes. Every connected company is refreshed on every tick, so the app
   * reads QuickBooks numbers that are minutes old without ever waiting for
   * Intuit and without anybody logging in. */
  async scheduled(event, env, ctx) {
    const toks = await loadTokens(env);
    for (const realm of Object.keys(toks)) {
      ctx.waitUntil(syncRealm(env, realm));
    }
  },
};

/* Pull the SYNC list for one company and store it. On failure the previous
 * snapshot is kept and the error is recorded on it, so a bad tick never
 * blanks the app's numbers — it just makes them visibly older. */
async function syncRealm(env, realm) {
  const prev = (await loadSnap(env, realm)) || {};
  const access = await accessToken(env, realm);
  if (!access) {
    const snap = { ...prev, realm, ok: false, error: 'realm not connected — open /qb/connect', at: prev.at || Date.now() };
    await env.R2.put(SNAP_KEY(realm), JSON.stringify(snap));
    return snap;
  }
  const data = {};
  let error = '';
  for (const job of SYNC) {
    try {
      if (job.kind === 'accounts') {
        const q = encodeURIComponent('select * from Account where Active in (true,false) maxresults 1000');
        const r = await qbo(access, realm, '/query?minorversion=75&query=' + q);
        if (r.error) throw new Error(r.error);
        data.accounts = (((r.QueryResponse || {}).Account) || []).map((a) => ({
          id: a.Id, name: a.Name, acctNum: a.AcctNum || '', type: a.AccountType || '',
          subType: a.AccountSubType || '', parent: (a.ParentRef && a.ParentRef.value) || '',
          fullName: a.FullyQualifiedName || a.Name,
          balance: typeof a.CurrentBalance === 'number' ? a.CurrentBalance : null,
          active: a.Active !== false,
        }));
      } else {
        const qp = new URLSearchParams({ ...(job.params || {}), minorversion: '75' });
        const r = await qbo(access, realm, '/reports/' + job.name + '?' + qp.toString());
        if (r.error) throw new Error(r.error);
        data[job.key] = { rows: flatten(r), columns: colNames(r), header: r.Header || {} };
      }
    } catch (e) {
      /* one report failing must not lose the other five — keep the old copy */
      error += (error ? '; ' : '') + job.key + ': ' + String(e && e.message ? e.message : e);
      if (prev.data && prev.data[job.key]) data[job.key] = prev.data[job.key];
    }
  }
  const snap = { realm, ok: !error, error, at: Date.now(), data };
  await env.R2.put(SNAP_KEY(realm), JSON.stringify(snap));
  return snap;
}
async function loadSnap(env, realm) {
  try { const o = await env.R2.get(SNAP_KEY(realm)); return o ? await o.json() : null; } catch { return null; }
}

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
/* QuickBooks reports come back as nested Rows/Row. Flatten to one line per
 * row, keeping depth so the app can redraw the indentation of the real report. */
function flatten(r) {
  const out = [];
  (function walk(node, depth) {
    if (!node) return;
    if (node.Rows) walk(node.Rows, depth);
    if (Array.isArray(node.Row)) node.Row.forEach((row) => {
      const cells = (row.ColData || row.Header && row.Header.ColData || []).map((c) => (c && c.value) || '');
      if (cells.length) out.push({
        depth,
        label: cells[0] || '',
        values: cells.slice(1),
        type: row.type || '',
        id: (row.ColData && row.ColData[0] && row.ColData[0].id) || '',
      });
      if (row.Rows) walk(row.Rows, depth + 1);
      if (row.Summary && row.Summary.ColData) {
        const c = row.Summary.ColData.map((x) => (x && x.value) || '');
        out.push({ depth, label: c[0] || '', values: c.slice(1), type: 'Summary', id: '' });
      }
    });
  })(r, 0);
  return out;
}
function colNames(r) {
  return (((r.Columns || {}).Column) || []).map((c) => (c && c.ColTitle) || '');
}
function text(s) { return new Response(s, { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS } }); }
function json(o, status = 200) { return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } }); }
