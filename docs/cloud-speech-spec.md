# Nexi Cloud Speech — Developer Spec (v1)

## Why
Chrome's built-in speech recognition (Web Speech API) mangles accented English
("the label screen", "hey next C"). Routing audio through a server-side
Whisper model gives far better transcription for Filipino- and Israeli-accented
English, and works identically on every browser and on the Rokid glasses.

## Architecture (one new Worker route, zero app redeploys)
```
Browser / glasses                Cloudflare Worker                 Model
┌────────────────┐   POST audio  ┌──────────────────┐   binding   ┌─────────┐
│ MediaRecorder  │ ─────────────▶│ /speech/transcribe│ ──────────▶│ Whisper │
│ (webm/opus 6s) │ ◀───────────── │  auth = Bearer    │ ◀────────── │         │
└────────────────┘  {text:"..."} └──────────────────┘             └─────────┘
```

## Route contract (the app already speaks this)
- `POST /speech/transcribe`
- Headers: `Authorization: Bearer <token>` (same token scheme as /sync),
  `Content-Type: audio/webm` (also accept `audio/ogg`, `audio/mp4`, `audio/wav`)
- Body: raw audio bytes, ≤ 25 s / ≤ 1 MB (reject larger with 413)
- Response 200: `{"text":"open payroll","lang":"en"}`
- Errors: 401 bad token · 413 too large · 502 model failure `{"error":"..."}`
- CORS: allow the app origin, `POST, OPTIONS`, `Authorization, Content-Type`

## Model options (pick ONE)
1. **Cloudflare Workers AI — `@cf/openai/whisper`** (recommended)
   - Same account as the existing worker; no external key; add binding
     `[ai] binding = "AI"` in wrangler.toml. Free tier covers thousands of
     10-second clips per day.
2. Groq API `whisper-large-v3` — fastest and most accurate, needs GROQ_API_KEY
   secret; use if CF quota is hit.

Reference implementation for option 1 is committed at
`workers/speech-worker.js` — deployable standalone (`wrangler deploy`) or
paste the route handler into the existing sync worker.

## App side (already shipped in index.html v14.17)
- `IT → Voice Status` has a **Cloud speech** box: paste the worker URL
  (e.g. `https://<worker>.workers.dev`) + optional token, then
  **🎙 Cloud dictation test** records 5 s, sends, and shows the transcript.
- `window.hnxCloudSTT(blob)` / `window.hnxCloudDictate(sec, cb)` are the
  public hooks; when a URL is configured the Nexi panel prefers cloud
  transcription for dictated commands. Endpoint + token are stored in
  `hydroPro_speech_url` / `hydroPro_speech_token` (synced, so one paste
  configures every device).

## Acceptance test
1. Deploy worker; `curl -X POST <url>/speech/transcribe -H "Authorization: Bearer <t>" \
   -H "Content-Type: audio/wav" --data-binary @sample.wav` → `{"text":...}`.
2. In the app: Voice Status → paste URL → Cloud dictation test → speak
   "open payroll for the second cutoff" → transcript must be verbatim.
3. Accent check: the phrase "show me greenhouse seven seedling plan" spoken
   by Eyal and by Jinky both transcribe correctly.
