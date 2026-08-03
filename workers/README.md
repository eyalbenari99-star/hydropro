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

## Boundaries kept (per the handoffs)
- Calendar scopes are read-only; no external calendar mutation route exists.
- No email-send route; email intelligence (v13.46) is a separate later deployment.
- SMS goes only to the two server-stored recipients; STOP suppresses instantly.
- Tokens AES-GCM-encrypted in KV; nothing sensitive returns to the browser.
