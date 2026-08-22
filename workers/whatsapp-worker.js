/* nexi-wa — NEXI's WhatsApp sender (Cloudflare Worker)
 *
 * NEXI's WhatsApp number: +63 977 857 2214 (registered on the WhatsApp
 * Business Platform under the ABA Pardes Meta Business account).
 *
 * The app (and any other worker) POSTs here; this worker holds the Meta
 * token and calls the WhatsApp Cloud API. Nothing in the browser ever sees
 * the Meta credentials.
 *
 * DEPLOY (Cloudflare dashboard → Workers & Pages → Create → paste this):
 *   name: nexi-wa
 *   Secrets (Settings → Variables and Secrets):
 *     WA_TOKEN      — bearer the app uses to call THIS worker (invent one,
 *                     e.g. nxwa_ + 40 random chars; also saved in the app)
 *     META_TOKEN    — permanent System User access token from Meta
 *                     (Business settings → System users → generate, with
 *                     whatsapp_business_messaging permission)
 *     PHONE_ID      — the Phone Number ID Meta shows for +63 977 857 2214
 *                     (WhatsApp → API Setup — NOT the phone number itself)
 *     VERIFY_TOKEN  — any string; the same one typed into the webhook setup
 *
 * ROUTES
 *   GET  /wa/health              → { ok, configured } (no auth)
 *   POST /wa/send                → { to, text }            free-form message*
 *   POST /wa/template            → { to, template, lang?, params? [] }
 *   GET  /wa/webhook             → Meta webhook verification handshake
 *   POST /wa/webhook             → incoming messages/status (logged, 200)
 *
 * * Free-form ("session") messages only reach people who wrote to NEXI's
 *   number within the last 24h — WhatsApp's rule, not ours. For NEXI-
 *   initiated messages (chases, payslip notices) use /wa/template with a
 *   Meta-approved template; templates deliver any time.
 *
 * Suggested first templates to submit in Meta (category: UTILITY):
 *   nexi_followup:  "Hi {{1}}, following up on: {{2}} — status on record:
 *                    {{3}}. Please reply with an update or mark it in Nexi."
 *   nexi_alert:     "NEXI alert: {{1}}"
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (p === '/wa/health') {
      return json({ ok: true, configured: !!(env.META_TOKEN && env.PHONE_ID), sender: '+63 977 857 2214' });
    }

    /* Meta webhook verification + inbound (no bearer — Meta calls these) */
    if (p === '/wa/webhook' && req.method === 'GET') {
      if (url.searchParams.get('hub.verify_token') === env.VERIFY_TOKEN)
        return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 });
      return new Response('forbidden', { status: 403 });
    }
    if (p === '/wa/webhook' && req.method === 'POST') {
      try { console.log('wa inbound', JSON.stringify(await req.json()).slice(0, 1500)); } catch {}
      return json({ ok: true });
    }

    /* everything below requires the app's bearer */
    const auth = req.headers.get('Authorization') || '';
    if (!env.WA_TOKEN || auth !== 'Bearer ' + env.WA_TOKEN)
      return json({ error: 'unauthorized' }, 401);
    if (!env.META_TOKEN || !env.PHONE_ID)
      return json({ error: 'worker not configured — set META_TOKEN and PHONE_ID secrets' }, 503);

    if (p === '/wa/send' && req.method === 'POST') {
      const b = await req.json().catch(() => ({}));
      const to = normalize(b.to);
      if (!to || !b.text) return json({ error: 'need { to, text }' }, 400);
      const r = await meta(env, {
        messaging_product: 'whatsapp', to,
        type: 'text', text: { body: String(b.text).slice(0, 3500) },
      });
      return json(r, r.error ? 502 : 200);
    }

    if (p === '/wa/template' && req.method === 'POST') {
      const b = await req.json().catch(() => ({}));
      const to = normalize(b.to);
      if (!to || !b.template) return json({ error: 'need { to, template }' }, 400);
      const comps = Array.isArray(b.params) && b.params.length
        ? [{ type: 'body', parameters: b.params.map(v => ({ type: 'text', text: String(v).slice(0, 500) })) }]
        : undefined;
      const r = await meta(env, {
        messaging_product: 'whatsapp', to,
        type: 'template',
        template: { name: String(b.template), language: { code: b.lang || 'en' }, ...(comps ? { components: comps } : {}) },
      });
      return json(r, r.error ? 502 : 200);
    }

    return json({ error: 'not found' }, 404);
  },
};

function normalize(v) {
  let ph = String(v || '').replace(/[^\d+]/g, '');
  if (ph.startsWith('+')) ph = ph.slice(1);
  if (ph.startsWith('0')) ph = '63' + ph.slice(1);       // 0917… → 63917…
  if (!ph.startsWith('63') && ph.length === 10) ph = '63' + ph;
  return /^63\d{10}$/.test(ph) ? ph : '';
}

async function meta(env, payload) {
  try {
    const res = await fetch('https://graph.facebook.com/v21.0/' + env.PHONE_ID + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.META_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return { error: (d.error && d.error.message) || ('meta ' + res.status), detail: d.error };
    return { ok: true, id: d.messages && d.messages[0] && d.messages[0].id };
  } catch (e) { return { error: String(e) }; }
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
