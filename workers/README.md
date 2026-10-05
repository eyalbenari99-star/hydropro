# Executive Assistant Worker — deployment guide (Phase 4b)

Implements the v13.45/v13.47 handoff contracts: calendar OAuth (read-only), 06:00/18:00 Nexi Daily notes, SMS delivery with consent + STOP handling, event reminders, 1-minute scheduler.

## 1. Prerequisites
- Cloudflare account with Workers + KV.
- Google Cloud project with the Calendar API enabled (OAuth client, scope `calendar.events.readonly`).
- Microsoft Entra app registration (delegated `Calendars.Read`, `offline_access`).
- Twilio account with a **registered Philippine sender** (required for PH delivery; see Twilio PH guidelines).

## 2. wrangler.toml
```toml
name = "hnx-ea-worker"
main = "ea-worker.js"
compatibility_date = "2026-08-01"

kv_namespaces = [
  { binding = "EA_KV", id = "<create with: wrangler kv namespace create EA_KV>" }
]

[vars]
APP_ORIGIN = "https://your-approved-app-origin"

[triggers]
crons = ["* * * * *"]
```

## 3. Secrets
```bash
wrangler secret put EA_TOKEN_KEY      # 32-byte base64: openssl rand -base64 32
wrangler secret put SESSION_SECRET    # shared with the HydroNexis session issuer
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put MS_CLIENT_ID
wrangler secret put MS_CLIENT_SECRET
wrangler secret put TWILIO_SID
wrangler secret put TWILIO_AUTH
wrangler secret put TWILIO_FROM       # registered sender, e.g. +63…
```

## 4. Provider console setup
- Google OAuth client: authorized redirect URI `https://<worker-domain>/ea/calendar/oauth/google/callback`.
- Microsoft app: redirect URI `https://<worker-domain>/ea/calendar/oauth/microsoft/callback`.
- Twilio: point the number's inbound webhook to `POST https://<worker-domain>/ea/sms/webhook`.

## 5. Session integration (one adaptation point)
`verifySession()` expects `Authorization: Bearer tenant.user.exp.hmac` signed with `SESSION_SECRET`. Replace its body with the existing HydroNexis worker-session check if different — every authenticated route flows through it.

## 6. Go-live checklist (condensed from the handoffs)
1. `wrangler deploy`, confirm `/ea/status` returns 401 without a session and `ok:true` with one.
2. Connect President calendar → provider consent screen → `?ea_oauth=connected&slot=owner`.
3. Connect Assistant calendar the same way.
4. `POST /ea/schedule/delivery/configure` with timezone, times, reminders `[60,15,0]`, both phones (E.164), `smsEnabled:true`.
5. Record real consent for both recipients (the configure route marks `opt_in` from the browser flag — replace with your evidence flow if compliance requires).
6. `POST /ea/schedule/preview` for morning + evening — verify note + SMS segments.
7. Wait for the cron at the configured local times — verify Nexi Daily note stored (KV `note:*`) and SMS received.
8. Send STOP from a phone → verify suppression; START → re-opt-in.
9. Verify idempotency: notes and reminders never send twice for the same key.
10. Inspect logs: no tokens, phone numbers, or note bodies logged.


## Per-user mailboxes (ea-worker v2.0, Oct 2026) — what Eyal must do, once
Each Nexi user connects **their own** work mailbox from Executive Assistant → 📧 Email Intelligence (🔗 Connect my Gmail). The worker keeps one encrypted token and one cadence per user, scans on the 1-minute cron, and the app pulls the redacted snapshot (metadata only; no bodies; no send route).

1. **Google Cloud → APIs & Services** (project of the abapardes.com.ph Workspace):
   - Enable the **Gmail API**.
   - OAuth consent screen: *Internal* (Workspace users only), app name "Nexi Assistant", scopes `https://www.googleapis.com/auth/gmail.readonly` **and** `https://www.googleapis.com/auth/gmail.compose` (v2.1: reply drafts in the user's own Drafts; still no send).
   - Credentials → **OAuth client ID** → Web application → authorized redirect URI `https://hnx-ea.eyalbenari99.workers.dev/ea/email/oauth/google/callback` (and `/ea/calendar/oauth/google/callback` if calendars are used). Copy the client id and secret — never paste them into chat.
2. **Cloudflare → Workers → create `hnx-ea`** from `workers/ea-worker.js`.
   - KV namespace `EA_KV` bound as `EA_KV`.
   - Variables: `APP_ORIGIN = https://aba-pardes-monitoring.netlify.app`, `SYNC_URL = https://hnx-sync.eyalbenari99.workers.dev`, `TENANT = aba`.
   - Secrets: `EA_TOKEN_KEY` (32-byte base64: `openssl rand -base64 32`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; `SESSION_SECRET` any random string (legacy HMAC path; the app uses the Nexi cloud token instead). Twilio / Microsoft secrets only if those features are used.
   - Trigger: cron `* * * * *`.
   - v2.1 (Eyal, 5 Oct 2026 — three briefings a day): also set `NOTIFY_URL = https://nexi-notify.eyalbenari99.workers.dev` + secret `NOTIFY_TOKEN` (the nexi-notify bearer) so the briefing is e-mailed to the user; and `WA_URL = https://nexi-wa.eyalbenari99.workers.dev`, secret `WA_TOKEN`, var `WA_COMPANY_PHONE` (E.164, e.g. 639171234567) for the WhatsApp reminder. Missing settings skip that step; the scan and the in-app list still work.
   - What runs: every user's connected mailbox is scanned at **06:00, 12:00 and 17:00 Manila** (default cadence `three`); the briefing (needs a reply / follow up) goes to the user's own address read from the Gmail profile; up to five reply DRAFTS per run are placed in the user's Drafts (one per message, never resent); one WhatsApp line per briefing on the company phone.
3. In Nexi (any user): Executive Assistant → 📧 Email Intelligence → tick the authorization box → **🔗 Connect my Gmail** → Google consent → back in Nexi the chip says ● connected. Pick the cadence (Daily at 07:00 / Twice a day / Every hour / Off). 📥 pulls Nexi's follow-ups now; otherwise they arrive on the cadence.

Routes (all need `Authorization: Bearer <Nexi cloud token>`, verified via hnx-sync `/auth/me` and cached 10 min):
`GET /ea/email/status` · `POST /ea/email/oauth/start {provider}` · `GET|POST /ea/email/prefs {cadence, hour, timezone, vipSenders, days}` · `POST /ea/email/scan` · `GET /ea/email/inbox` · `POST /ea/email/disconnect`.

## Email Intelligence routes (v13.46 contract — included)
- `POST /ea/email/oauth/start` (assistant slot only, `gmail.readonly` / `Mail.Read`) + provider callbacks.
- `POST /ea/email/scan` and `/ea/email/search` — normalized metadata + worker-side classification (handoff scoring), never full bodies to the browser.
- `POST /ea/email/draft/generate` — returns a grounded skeleton; plug your approved enterprise model at the marked point. **No send route exists anywhere.**
- App integration: paste the worker URL into Executive Assistant → 📧 Email Intelligence.

## Two-way SMS commands
Opted-in recipients can text back: `BRIEF` (today's summary), `NEXT` (next appointment), `STOP`/`START` (consent). Read-only commands only — nothing mutates from SMS.

## Boundaries kept (per the handoffs)
- Calendar scopes are read-only; no external calendar mutation route exists.
- No email-send route; email intelligence (v13.46) is a separate later deployment.
- SMS goes only to the two server-stored recipients; STOP suppresses instantly.
- Tokens AES-GCM-encrypted in KV; nothing sensitive returns to the browser.
