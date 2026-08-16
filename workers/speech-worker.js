/* Nexi Cloud Speech — Cloudflare Worker (Workers AI Whisper)
   Deploy standalone:
     wrangler.toml:
       name = "nexi-speech"
       main = "speech-worker.js"
       compatibility_date = "2026-01-01"
       [ai]
       binding = "AI"
     secrets:
       wrangler secret put SPEECH_TOKEN     # any long random string; paste the
                                            # same value into the app's Voice
                                            # Status → Cloud speech token field
   …or copy handleTranscribe() into the existing sync worker and route
   POST /speech/transcribe to it (reusing that worker's auth if preferred). */

const CORS = {
  'Access-Control-Allow-Origin': '*', // tighten to the app origin in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method === 'POST' && url.pathname === '/speech/transcribe')
      return handleTranscribe(req, env);
    return json({ error: 'not found' }, 404);
  },
};

async function handleTranscribe(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.SPEECH_TOKEN || auth !== env.SPEECH_TOKEN)
    return json({ error: 'unauthorized' }, 401);

  const buf = await req.arrayBuffer();
  if (!buf.byteLength) return json({ error: 'empty body' }, 400);
  if (buf.byteLength > 1_000_000) return json({ error: 'audio too large (max 1MB / ~25s)' }, 413);

  try {
    const out = await env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(buf)],
    });
    const text = String((out && out.text) || '').trim();
    return json({ text, lang: 'en' });
  } catch (e) {
    return json({ error: 'transcription failed: ' + (e && e.message) }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
