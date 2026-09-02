/* hnx-sync worker — /sos/sales-orders route (for the 📦 Supply Plan screen, v18.09)
 *
 * Add this route to the hnx-sync Cloudflare worker next to the existing
 * /sos/items, /sos/shipments and /sos/purchase-orders handlers. It is the
 * same pattern: authenticated app request in, SOS Inventory REST API v8
 * out, using the OAuth2 bearer token already stored in the worker KV.
 * READ-ONLY — GET only, nothing is written to SOS.
 *
 * The app calls:  GET /sos/sales-orders?open=true&start=1&maxresults=200
 * SOS endpoint:   GET https://api.sosinventory.com/api/v2/salesorder
 *                 (list; each order carries lines[] with item, quantity,
 *                  shipped — the app computes open = quantity - shipped)
 */

// Inside the worker's fetch router, alongside the other /sos/* routes:
if (url.pathname === '/sos/sales-orders' && request.method === 'GET') {
  const auth = await requireAppAuth(request, env);        // same guard the other /sos/* routes use
  if (auth instanceof Response) return auth;
  const sosToken = await getSosAccessToken(env);          // existing helper (refreshes OAuth token from KV)
  if (!sosToken) return json({ error: 'SOS not connected' }, 409);

  const q = url.searchParams;
  const start = q.get('start') || '1';
  const max = Math.min(parseInt(q.get('maxresults') || '200', 10) || 200, 200);
  // SOS v2 list endpoint; the app filters open lines itself, but asking for
  // open orders keeps the payload small when the account supports it.
  const sosUrl = 'https://api.sosinventory.com/api/v2/salesorder?start=' + encodeURIComponent(start)
    + '&maxresults=' + max + (q.get('open') ? '&status=open' : '');

  const r = await fetch(sosUrl, {
    headers: { Authorization: 'Bearer ' + sosToken, Accept: 'application/json' }
  });
  if (!r.ok) return json({ error: 'SOS ' + r.status, detail: (await r.text()).slice(0, 300) }, 502);
  const body = await r.json();
  // Pass through as { salesorders: [...] } — the app normalizes defensively.
  return json({ salesorders: body.data || body.salesorders || body });
}
