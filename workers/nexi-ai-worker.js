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
 *   GET  /ai/health  → { ok, configured, model }            (no auth)
 *   POST /ai/ask     → { answer } | { error }               (Bearer AI_TOKEN)
 *        body: { q, context?, history?: [{role,text}] }
 *   POST /ai/analyze → { analysis:{severity,monitoring,conclusion,recommendation,pastExperience} } | { error }
 *        (Bearer AI_TOKEN) — the app-wide "analyse this and recommend action" convention used by
 *        ~30 call sites across index.html (Inventory Diagnostics, module drill-downs, etc.).
 *        body: { context: { module, summary, question, images？:[{mediaType,data}] } }
 *        images (v20.93, optional): up to 3 photos, each { mediaType:'image/jpeg'|'image/png'|
 *        'image/webp', data: base64 (≤ 6 MB decoded) } — lets a "report a problem" photo upload
 *        (a Maintenance call attachment, an IT checklist Fail photo) get a real vision read: what's
 *        wrong in the photo and what to do about it, in the same severity/recommendation shape every
 *        other AI panel in the app already renders.
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

    /* v17.08 · POST /ai/fs — read a filed financial statement (PDF, scans
       included: the model reads images inside PDFs) and return its key
       figures so the app can reconcile FS-as-filed against QuickBooks. */
    if (url.pathname === '/ai/fs' && req.method === 'POST') {
      const auth2 = req.headers.get('Authorization') || '';
      if (!env.AI_TOKEN || auth2 !== 'Bearer ' + env.AI_TOKEN)
        return json({ error: 'unauthorized' }, 401);
      if (!env.ANTHROPIC_API_KEY)
        return json({ error: 'worker not configured — set the ANTHROPIC_API_KEY secret' }, 503);
      const body2 = await req.json().catch(() => ({}));
      const pdf = String(body2.pdf || '');
      if (!pdf || pdf.length > 11_500_000) return json({ error: 'need { pdf } (base64, ≤ 8 MB file)' }, 400);
      let r2;
      try {
        r2 = await fetch(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'server-side-fallback-2026-07-01',
          },
          body: JSON.stringify({
            model: env.AI_MODEL || DEFAULT_MODEL,
            max_tokens: 2000,
            output_config: { effort: 'medium' },
            fallbacks: 'default',
            system: 'You read Philippine audited financial statements. Extract ONLY figures printed in the document — never estimate. Respond with ONE JSON object, no prose: {"year":"YYYY","figures":{"ta":n,"tl":n,"eq":n,"rev":n,"ni":n,"fag":n,"fad":n,"fan":n}} where ta=total assets, tl=total liabilities, eq=total equity, rev=total revenue/net sales, ni=net income (negative if a loss), fag=property&equipment gross cost, fad=accumulated depreciation (positive number), fan=property&equipment net. Omit any key that is not clearly printed. Amounts in PHP as plain numbers.',
            messages: [{ role: 'user', content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } },
              { type: 'text', text: 'Extract the figures from this filed FS (' + String(body2.name || '') + ').' },
            ] }],
          }),
        });
      } catch (e) {
        return json({ error: 'could not reach the model: ' + String(e) }, 502);
      }
      const d2 = await r2.json().catch(() => ({}));
      if (!r2.ok) return json({ error: (d2 && d2.error && d2.error.message) || 'model error ' + r2.status }, 502);
      const txt = (Array.isArray(d2.content) ? d2.content : []).filter((b3) => b3.type === 'text').map((b3) => b3.text).join('');
      const m2 = txt.match(/\{[\s\S]*\}/);
      if (!m2) return json({ error: 'the model returned no figures' }, 502);
      try { const parsed = JSON.parse(m2[0]); return json({ year: parsed.year || '', figures: parsed.figures || {} }); }
      catch (e) { return json({ error: 'unreadable figures from the model' }, 502); }
    }

    /* v20.93 · POST /ai/analyze — the app-wide "analyse this, tell me what to do" convention.
       Accepts an optional images[] for vision (a photo of a broken part, a bad root system, a leak)
       alongside the usual text context, and always answers in the same fixed shape every other
       /ai/analyze panel in the app already knows how to render. */
    if (url.pathname === '/ai/analyze' && req.method === 'POST') {
      const authA = req.headers.get('Authorization') || '';
      if (!env.AI_TOKEN || authA !== 'Bearer ' + env.AI_TOKEN) return json({ error: 'unauthorized' }, 401);
      if (!env.ANTHROPIC_API_KEY) return json({ error: 'worker not configured — set the ANTHROPIC_API_KEY secret' }, 503);

      const bodyA = await req.json().catch(() => ({}));
      const ctx = (bodyA && bodyA.context) || {};
      const module = String(ctx.module || '').slice(0, 200);
      const question = String(ctx.question || '').slice(0, 2000);
      let summaryTxt = '';
      try { summaryTxt = JSON.stringify(ctx.summary != null ? ctx.summary : {}).slice(0, 12000); } catch (e) { summaryTxt = String(ctx.summary || '').slice(0, 12000); }

      const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const images = (Array.isArray(ctx.images) ? ctx.images : []).slice(0, 3).filter((im) => {
        return im && ALLOWED_IMG_TYPES.includes(im.mediaType) && typeof im.data === 'string' && im.data.length > 0 && im.data.length <= 8_000_000;
      });
      if (Array.isArray(ctx.images) && ctx.images.length && !images.length)
        return json({ error: 'images[] present but none were usable (need mediaType image/jpeg|png|webp|gif and data ≤ 6 MB decoded)' }, 400);
      if (!question && !images.length) return json({ error: 'need context.question or context.images' }, 400);

      const content = [];
      images.forEach((im) => content.push({ type: 'image', source: { type: 'base64', media_type: im.mediaType, data: im.data } }));
      content.push({ type: 'text', text: (module ? 'Module: ' + module + '\n' : '') + (summaryTxt && summaryTxt !== '{}' ? 'Data:\n' + summaryTxt + '\n' : '') + (question || 'Look at the attached photo(s) and say what is wrong and what to do about it.') });

      let rA;
      try {
        rA = await fetch(API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'server-side-fallback-2026-07-01',
          },
          body: JSON.stringify({
            model: env.AI_MODEL || DEFAULT_MODEL,
            max_tokens: 1500,
            output_config: { effort: env.AI_EFFORT || 'low' },
            fallbacks: 'default',
            system: PERSONA + '\n\nRespond with ONE JSON object, no prose outside it: {"severity":"ok"|"watch"|"warn"|"critical","monitoring":"...","conclusion":"...","recommendation":"...","pastExperience":"..."}. "monitoring" names what you actually see/read. "conclusion" is your read of what is going on. "recommendation" is the concrete next action for farm/maintenance staff — specific, not generic. "pastExperience" may be empty ("") if you have nothing relevant to add. Never invent data not shown to you.',
            messages: [{ role: 'user', content }],
          }),
        });
      } catch (e) {
        return json({ error: 'could not reach the model: ' + String(e) }, 502);
      }
      const dA = await rA.json().catch(() => ({}));
      if (!rA.ok) return json({ error: (dA && dA.error && dA.error.message) || 'model error ' + rA.status }, 502);
      if (dA.stop_reason === 'refusal') return json({ error: 'The model declined to analyse this one.' }, 200);
      const txtA = (Array.isArray(dA.content) ? dA.content : []).filter((b) => b && b.type === 'text').map((b) => b.text).join('');
      const mA = txtA.match(/\{[\s\S]*\}/);
      let analysis = null;
      if (mA) { try { analysis = JSON.parse(mA[0]); } catch (e) { analysis = null; } }
      if (!analysis) return json({ error: 'the model returned no analysis' }, 502);
      return json({ analysis, ts: Date.now(), model: dA.model || '' });
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
