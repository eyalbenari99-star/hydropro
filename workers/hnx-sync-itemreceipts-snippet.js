/* hnx-sync worker — /sos/item-receipts route (for 🌾 Harvest in Packaging and Production, v21.37)
 *
 * Add this route to the hnx-sync Cloudflare worker next to the existing /sos/sales-orders,
 * /sos/purchase-orders and /sos/items handlers. Same pattern: authenticated app request in,
 * SOS Inventory REST API v2 out, with the OAuth2 bearer token the worker already holds (the
 * APAC account — the harvest is a purchase order received into APAC CENTER COLD STORAGE;
 * each receipt line carries the greenhouse in its Class, e.g. "Aba Pardes Harvesting per GH:APAC GH4").
 * READ-ONLY — GET only, nothing is written to SOS.
 *
 * The app calls:  GET /sos/item-receipts?from=YYYY-MM-DD&to=YYYY-MM-DD&start=1&maxresults=200
 * SOS endpoint:   GET https://api.sosinventory.com/api/v2/itemreceipt
 */
if (url.pathname === '/sos/item-receipts' && request.method === 'GET') {
  const auth = await requireAppAuth(request, env);        // same guard the other /sos/* routes use
  if (auth instanceof Response) return auth;
  const sosToken = await getSosAccessToken(env);          // existing helper (refreshes OAuth token from KV)
  if (!sosToken) return json({ error: 'SOS not connected' }, 409);
  const q = url.searchParams;
  const start = q.get('start') || '1';
  const max = Math.min(parseInt(q.get('maxresults') || '200', 10) || 200, 200);
  const sosUrl = 'https://api.sosinventory.com/api/v2/itemreceipt?start=' + encodeURIComponent(start)
    + '&maxresults=' + max
    + (q.get('from') ? '&fromDate=' + encodeURIComponent(q.get('from')) : '')
    + (q.get('to') ? '&toDate=' + encodeURIComponent(q.get('to')) : '');
  const r = await fetch(sosUrl, { headers: { Authorization: 'Bearer ' + sosToken, Accept: 'application/json' } });
  if (!r.ok) return json({ error: 'SOS ' + r.status, detail: (await r.text()).slice(0, 300) }, 502);
  const body = await r.json();
  return json({ itemreceipts: body.data || body.itemreceipts || body });
}
