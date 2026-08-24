/* nexi-ai — NEXI's language brain (Cloudflare Worker)
 *
 * Gives Nexi real open-ended answers WITHOUT a key on any device: the app
 * sends the question plus a snapshot of its own live numbers, this worker
 * asks Claude, and only the answer comes back. The Anthropic key lives here
 * as a Cloudflare secret — it is never in index.html, never synced, never on
 * a laptop in the field.
 *
 * Written as plain fetch() on purpose: every nexi worker is pasted straight
 * into the Cloudflare dashboard with no build step, so no npm SDK import.
 *
 * DEPLOY (Cloudflare dashboard → Workers & Pages → Create → paste this):
 *   name: nexi-ai
 *   Secrets (Settings → Variables and Secrets):
 *     ANTHROPIC_API_KEY — from console.anthropic.com → API keys
 *     AI_TOKEN          — bearer the app uses to call THIS worker (invent one,
 *                         e.g. nxai_ + 40 random chars; paste the same string
 *                         into Nexi Settings → AI brain)
 *   Optional plain variables:
 *     AI_MODEL   — defaults to claude-opus-5
 *     AI_EFFORT  — low | medium | high | xhigh | max (default low: short farm
 *                  answers come back fast; raise it for harder reasoning)
 *
 * ROUTES
 *   GET  /ai/health → { ok, configured, model }            (no auth)
 *   POST /ai/ask    → { answer } | { error }               (Bearer AI_TOKEN)
 *        body: { q, context?, history?: [{role,text}] }
 *
 * COST CONTROL: answers are capped and the app only calls this worker for
 * questions its own on-device brain could not answer.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-opus-5';

const PERSONA = [
  'You are NEXI, the assistant inside HydroNexis-AI — the operations app of ABA Pardes,',
  'a hydroponic lettuce farm in the Philippines (greenhouses GH1-GH16, plus packaging,',
  'irrigation, maintenance, HR, payroll, accounting and logistics).',
  '',
  'HOW TO ANSWER',
  '- Be brief and concrete. Two or three sentences unless asked for detail.',
  '- Speak plainly to farm and office staff, not in jargon. Peso amounts as ₱.',
  '- NEVER invent numbers, names, dates or statuses. The LIVE DATA block below is the',
  '  only factual source you have. If the answer is not in it, say so honestly and name',
  '  the screen where the person can look — do not guess and do not fill gaps.',
  '- If the live data shows a problem, say what it is and what to do next.',
  '- You cannot change data from here. To create something, tell the person to ask',
  '  "raise a call for ..." which the app itself handles with a confirmation.',
].join('\n');

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (url.pathname === '/ai/health') {
      return json({
        ok: true,
        configured: !!(env.ANTHROPIC_API_KEY && env.AI_TOKEN),
        model: env.AI_MODEL || DEFAULT_MODEL,
      });
    }

    if (url.pathname !== '/ai/ask' || req.method !== 'POST')
      return json({ error: 'not found' }, 404);

    const auth = req.headers.get('Authorization') || '';
    if (!env.AI_TOKEN || auth !== 'Bearer ' + env.AI_TOKEN)
      return json({ error: 'unauthorized' }, 401);
    if (!env.ANTHROPIC_API_KEY)
      return json({ error: 'worker not configured — set the ANTHROPIC_API_KEY secret' }, 503);

    const body = await req.json().catch(() => ({}));
    const q = String(body.q || '').trim().slice(0, 2000);
    if (!q) return json({ error: 'need { q }' }, 400);

    /* the app's own live numbers — the only facts Claude is allowed to use */
    const context = String(body.context || '').slice(0, 12000);

    /* short conversation memory, so follow-ups make sense */
    const messages = [];
    (Array.isArray(body.history) ? body.history.slice(-6) : []).forEach((m) => {
      const role = m && m.role === 'assistant' ? 'assistant' : 'user';
      const text = String((m && m.text) || '').slice(0, 1500);
      if (text) messages.push({ role, content: text });
    });
    if (!messages.length || messages[0].role !== 'user')
      messages.unshift({ role: 'user', content: 'Hello' });
    messages.push({ role: 'user', content: q });

    const system = PERSONA + (context ? '\n\nLIVE DATA FROM THE APP (right now):\n' + context : '\n\n(No live data was sent with this question.)');

    let r;
    try {
      r = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'server-side-fallback-2026-07-01',
        },
        body: JSON.stringify({
          model: env.AI_MODEL || DEFAULT_MODEL,
          max_tokens: 8000,
          output_config: { effort: env.AI_EFFORT || 'low' },
          fallbacks: 'default',
          system,
          messages,
        }),
      });
    } catch (e) {
      return json({ error: 'could not reach the model: ' + String(e) }, 502);
    }

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (d && d.error && d.error.message) || 'model error ' + r.status;
      return json({ error: msg }, 502);
    }
    /* a policy decline comes back as HTTP 200 — check before reading content */
    if (d.stop_reason === 'refusal')
      return json({ error: 'The model declined to answer that one. Try asking it a different way.' }, 200);

    const answer = (Array.isArray(d.content) ? d.content : [])
      .filter((b) => b && b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!answer) return json({ error: 'empty answer from the model' }, 502);
    return json({
      answer,
      model: d.model || '',
      usage: d.usage ? { in: d.usage.input_tokens, out: d.usage.output_tokens } : undefined,
    });
  },
};

function json(o, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
