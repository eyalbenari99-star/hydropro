/* hnx-sync worker — /sos/customers and /sos/invoices routes (for the CRM ↔ SOS
 * reconciliation in Compliance → Customer relations → 📦 SOS recon, v19.59)
 *
 * Add these two routes to the hnx-sync Cloudflare worker next to the existing
 * /sos/items, /sos/shipments, /sos/purchase-orders and /sos/sales-orders
 * handlers. Same pattern: authenticated app request in, SOS Inventory REST API
 * out, using the OAuth2 bearer token already stored in the worker KV.
 * READ-ONLY — GET only, nothing is written to SOS.
 *
 * The app calls:  GET /sos/customers?start=1&maxresults=200
 *                 GET /sos/invoices?open=true&start=1&maxresults=200
 * SOS endpoints:  GET https://api.sosinventory.com/api/v2/customer
 *                 GET https://api.sosinventory.com/api/v2/invoice
 * The app pages until a call returns fewer than maxresults rows.
 */

// Inside the worker's fetch router, alongside the other /sos/* routes:
if ((url.pathname === '/sos/customers' || url.pathname === '/sos/invoices') && request.method === 'GET') {
  const auth = await requireAppAuth(request, env);        // same guard the other /sos/* routes use
  if (auth instanceof Response) return auth;
  const sosToken = await getSosAccessToken(env);          // existing helper (refreshes OAuth token from KV)
  if (!sosToken) return json({ error: 'SOS not connected' }, 409);

  const q = url.searchParams;
  const start = q.get('start') || '1';
  const max = Math.min(parseInt(q.get('maxresults') || '200', 10) || 200, 200);
  const isCust = url.pathname === '/sos/customers';
  const sosUrl = 'https://api.sosinventory.com/api/v2/' + (isCust ? 'customer' : 'invoice')
    + '?start=' + encodeURIComponent(start) + '&maxresults=' + max
    + (!isCust && q.get('open') ? '&status=open' : '');

  const r = await fetch(sosUrl, {
    headers: { Authorization: 'Bearer ' + sosToken, Accept: 'application/json' }
  });
  if (!r.ok) return json({ error: 'SOS ' + r.status, detail: (await r.text()).slice(0, 300) }, 502);
  const body = await r.json();
  // Pass through as { customers: [...] } / { invoices: [...] } — the app normalizes defensively.
  return json(isCust ? { customers: body.data || body.customers || body }
                     : { invoices:  body.data || body.invoices  || body });
}
