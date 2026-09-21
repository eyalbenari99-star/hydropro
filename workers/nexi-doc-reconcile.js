/* nexi-doc-reconcile — Cloudflare Worker (v20.92, phase 1): compares SOS Inventory (APAC) open sales
 * orders against QuickBooks (APAC realm) open invoices, customer by customer, and flags a gap. Never
 * writes anywhere — read-only against both sources, same as the workers it calls.
 *
 * SCOPE CORRECTION vs the original work plan: the plan also asked for "SOS vs Nexi inventory"
 * reconciliation. Digging into how Nexi's own inventory screen is built (hnx-sos-inventory-bridge-v1936,
 * index.html) found that Nexi's displayed stock figure IS DERIVED FROM SOS itself (merged with a small
 * manual overlay for corrections) — it is not an independent count. Comparing "Nexi's number" against
 * "SOS's number" for on-hand quantity would just be comparing SOS to a mostly-verbatim copy of SOS,
 * which finds nothing real and only adds false confidence. The one comparison with two genuinely
 * independent sources is SOS (sales orders, the sell side) against QuickBooks (invoices, the accounting
 * side) — that is what this worker does. A later phase can add a real Nexi-vs-SOS check if a genuinely
 * independent Nexi-side count (e.g. a physical stock take) exists to compare against.
 *
 * Level of comparison: CUSTOMER TOTALS, not document-by-document. There is no confirmed shared key
 * (PO number / doc number) between a SOS sales order and its QuickBooks invoice in what's been read so
 * far, so matching line-by-line would be guessing at a join that might not hold. Comparing each
 * customer's total OPEN sales-order value (SOS) against their total OPEN invoice balance (QuickBooks)
 * is a real, defensible check that doesn't require that guess: a large gap means either an order that
 * was invoiced but never marked fulfilled in SOS, an invoice that was never raised for a fulfilled
 * order, or a customer-name mismatch between the two systems — all worth a human look either way.
 *
 * Data sources (both existing, both read-only, called exactly the way index.html itself calls them):
 *   - SOS: GET hnx-sync.../sos/sales-orders?open=true  (hnx-sync service-account login, same pattern
 *     as workers/nexi-night-audit.js). NOTE: as of this worker's first ship, this route is written
 *     (workers/hnx-sync-salesorders-snippet.js) but NOT YET DEPLOYED on the live hnx-sync worker — see
 *     index.html's 📦 Supply Plan screen, which shows the same "no sales-orders route yet" message.
 *     Until it's deployed, this worker's /recon/latest will report a single 'source_unavailable'
 *     finding instead of silently returning zero real findings, so that gap is visible, not hidden.
 *   - QuickBooks: GET nexi-qb.../qb/query?realm=193514687079844&q=SELECT ... FROM Invoice WHERE
 *     Balance > '0' — the nexi-qb worker's own bearer-token scheme (QB_TOKEN, a pre-shared secret
 *     distinct from hnx-sync's login flow — see nexi-qb's own header comment for how it's issued).
 *
 * Deploy (wrangler):
 *   name = "nexi-doc-reconcile"  main = "nexi-doc-reconcile.js"  compatibility_date = "2026-08-01"
 *   [vars] APP_ORIGIN = "https://aba-pardes-monitoring.netlify.app"
 *   [triggers] crons = ["0 20 * * *"]   (20:00 UTC = 04:00 Asia/Manila)
 *   kv_namespaces = [{ binding = "RECON_KV", id = "<wrangler kv:namespace create RECON_KV>" }]
 *   secrets:
 *     HNX_SYNC_USER, HNX_SYNC_PASS_HASH  - same service account as nexi-night-audit.js (read access)
 *     QB_WORKER_URL   - e.g. https://nexi-qb.eyalbenari99.workers.dev
 *     QB_TOKEN        - the SAME bearer secret already configured on the nexi-qb worker
 *     GAP_THRESHOLD_PCT (optional, default 10) - % divergence per customer before it's a finding
 */

const HNX_SYNC_BASE = 'https://hnx-sync.eyalbenari99.workers.dev';
const APAC_REALM = '193514687079844';
const RECON_KV_PREFIX = 'recon:';
const DEFAULT_GAP_PCT = 10;
const MIN_ABS_GAP = 500; // pesos; ignores tiny rounding-level gaps even if the % looks large on a small order

function cors(env, req) {
  const origins = String(env.APP_ORIGIN || '*').split(',').map(s => s.trim()).filter(Boolean);
  const o = req.headers.get('Origin') || '';
  const allow = origins.includes('*') ? '*' : (origins.includes(o) ? o : origins[0]);
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
}
function json(obj, status, hdr) { return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, hdr || {}) }); }

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

async function pullSosOpenOrders(env) {
  const token = await hnxSyncToken(env);
  const r = await fetch(HNX_SYNC_BASE + '/sos/sales-orders?open=true&start=1&maxresults=200', { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 404) return { available: false, orders: [] }; // route not deployed yet, see header comment
  if (!r.ok) throw new Error('hnx-sync sales-orders pull failed: ' + r.status);
  const d = await r.json();
  return { available: true, orders: (d && (d.salesOrders || d.data || d.items)) || [] };
}

async function pullQbOpenInvoices(env) {
  if (!env.QB_WORKER_URL || !env.QB_TOKEN) return { available: false, invoices: [] };
  const q = encodeURIComponent("select * from Invoice where Balance > '0' maxresults 500");
  const url = env.QB_WORKER_URL.replace(/\/+$/, '') + '/qb/query?realm=' + APAC_REALM + '&q=' + q;
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + env.QB_TOKEN } });
  if (!r.ok) throw new Error('nexi-qb query failed: ' + r.status);
  const d = await r.json();
  const rows = (d && d.QueryResponse && d.QueryResponse.Invoice) || (d && d.Invoice) || [];
  return { available: true, invoices: rows };
}

function customerNameOf(x) {
  // SOS shape and QuickBooks shape name the customer differently; normalize both to a plain lowercase string.
  const raw = x.customer || x.customerName || (x.CustomerRef && x.CustomerRef.name) || x.name || '';
  return String(raw).trim().toLowerCase();
}

/* Pure, testable core: given already-fetched SOS orders and QB invoices, compute per-customer totals
 * and flag customers whose SOS-open-total and QB-open-balance-total diverge beyond the threshold. */
function reconcileTotals(sosOrders, qbInvoices, gapPct) {
  const bySos = {}, byQb = {};
  sosOrders.forEach(function (o) {
    const name = customerNameOf(o); if (!name) return;
    const amt = +(o.total != null ? o.total : o.amount) || 0;
    bySos[name] = (bySos[name] || 0) + amt;
  });
  qbInvoices.forEach(function (inv) {
    const name = customerNameOf(inv); if (!name) return;
    const bal = +(inv.Balance != null ? inv.Balance : inv.TotalAmt) || 0;
    byQb[name] = (byQb[name] || 0) + bal;
  });
  const names = Object.keys(Object.assign({}, bySos, byQb));
  const findings = [];
  names.forEach(function (name) {
    const sos = bySos[name] || 0, qb = byQb[name] || 0;
    const gap = Math.round((sos - qb) * 100) / 100;
    const base = Math.max(sos, qb);
    const gapPctActual = base > 0 ? Math.abs(gap) / base * 100 : (Math.abs(gap) > 0 ? 100 : 0);
    if (Math.abs(gap) < MIN_ABS_GAP) return;
    if (gapPctActual < gapPct) return;
    findings.push({
      rule: 'sos_qb_customer_gap', severity: gapPctActual >= 40 ? 'danger' : 'warn',
      entity: name, sosOpenTotal: Math.round(sos * 100) / 100, qbOpenBalance: Math.round(qb * 100) / 100,
      gap, gapPct: Math.round(gapPctActual * 10) / 10,
      detail: `SOS open orders ₱${sos.toFixed(2)} vs QuickBooks open invoices ₱${qb.toFixed(2)} (${gapPctActual.toFixed(1)}% gap)`
    });
  });
  findings.sort(function (a, b) { return Math.abs(b.gap) - Math.abs(a.gap); });
  return findings;
}

async function runReconcile(env) {
  const [sos, qb] = await Promise.all([pullSosOpenOrders(env), pullQbOpenInvoices(env)]);
  const findings = [];
  if (!sos.available) {
    findings.push({ rule: 'source_unavailable', severity: 'info', entity: 'hnx-sync', detail: 'hnx-sync /sos/sales-orders is not deployed yet (workers/hnx-sync-salesorders-snippet.js needs pasting into the live hnx-sync worker) — SOS-side reconciliation is skipped until then.' });
  }
  if (!qb.available) {
    findings.push({ rule: 'source_unavailable', severity: 'info', entity: 'nexi-qb', detail: 'QB_WORKER_URL/QB_TOKEN not configured on this worker — QuickBooks-side reconciliation is skipped until then.' });
  }
  if (sos.available && qb.available) {
    findings.push.apply(findings, reconcileTotals(sos.orders, qb.invoices, +env.GAP_THRESHOLD_PCT || DEFAULT_GAP_PCT));
  }
  const result = { generatedAt: new Date().toISOString(), date: new Date().toISOString().slice(0, 10), findings, coverage: { sosAvailable: sos.available, qbAvailable: qb.available } };
  if (env.RECON_KV) await env.RECON_KV.put(RECON_KV_PREFIX + result.date, JSON.stringify(result), { expirationTtl: 90 * 24 * 60 * 60 });
  return result;
}

function checkAuth(env, req) {
  if (!env.RECON_TOKEN) return true;
  const a = req.headers.get('Authorization') || '';
  return a === 'Bearer ' + env.RECON_TOKEN;
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (url.pathname === '/recon/health') return json({ ok: true, service: 'nexi-doc-reconcile' }, 200, h);
    if (!checkAuth(env, req)) return json({ ok: false, error: 'unauthorized' }, 401, h);
    if (url.pathname === '/recon/run' && req.method === 'POST') {
      try { return json(await runReconcile(env), 200, h); }
      catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 200, h); }
    }
    if (url.pathname === '/recon/latest' && req.method === 'GET') {
      if (!env.RECON_KV) return json({ ok: false, error: 'RECON_KV not bound' }, 500, h);
      const today = new Date().toISOString().slice(0, 10);
      const stored = await env.RECON_KV.get(RECON_KV_PREFIX + today);
      if (!stored) {
        try { return json(await runReconcile(env), 200, h); }
        catch (e) { return json({ generatedAt: null, findings: [], error: String(e && e.message || e) }, 200, h); }
      }
      return json(JSON.parse(stored), 200, h);
    }
    return json({ ok: false, error: 'not found' }, 404, h);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReconcile(env).catch(() => {}));
  }
};
