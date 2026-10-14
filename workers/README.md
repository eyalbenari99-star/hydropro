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
   - v2.2 (5 Oct 2026): CORS added — the worker answers the browser preflight for `APP_ORIGIN` (and localhost). Before this every call from Nexi failed with "worker not reachable". `APP_ORIGIN` must be exactly `https://aba-pardes-monitoring.netlify.app` (no trailing slash).
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

## nexi-irr (pool meters) — v22.78, Eyal 13 Oct 2026 ("connect all meters from BeHive-I to Nexi each pool")

The BeHive-I (Pro-Leaf "BeLeaf") units measure each pool's EC, pH, water temperature and water level. `workers/nexi-irr.js` receives
the readings (R2) and Nexi (Irrigation → 🏊 Pool Monitor / 🔌 Meters) pulls them every 3 minutes. What the OWNER does, once:

1. **Cloudflare → Workers → create `nexi-irr`** — paste `workers/nexi-irr.js`.
   - Bind R2: binding name `R2` → the **nexi-bio bucket** (small JSON objects: `irr/latest/<pool>.json`, `irr/day/…`, `irr/hist/…`, `irr/node/…`).
   - Trigger: cron every 5 minutes (`0,5,10,15,20,25,30,35,40,45,50,55 * * * *`).
   - Secrets (names only here — generate long random strings yourself, never paste them in chat):
     - `IRR_TOKEN` — what Nexi uses to read (`/irr/latest`, `/irr/history`); pasted on ONE computer in 🔌 Meters → ⚙ Feed settings.
     - `NODE_TOKENS` — JSON, one entry per source that may push: `{"proleaf-mail":{"token":"…","pools":["P01","P02","P03","P04","P05","P06","P07","P08","P09","P10","P11A","P11B"]}}` (add `"tap-room1-2":{"token":"…","pools":["P01","P02"]}` per RS485 node later).
     - optional `PROLEAF_MAP` — `{"BHIDA17102B:tank1":"P07", …}` which BeHive-I device + tank is which pool (the bridge can hold the same map).
     - optional `PROLEAF_USER` / `PROLEAF_PASS` — only when the Pro-Leaf cloud poll is wired (today it records "not configured").
   - Check: `https://nexi-irr.eyalbenari99.workers.dev/irr/health` answers `{"ok":true,"version":"22.78",…}` (no token needed, nothing secret in it).
2. **Routes**: `POST /irr/push` (node token; `{readings:[{pool|device+tank, ts, ec, ph, wt, level_cm|level_m, src, alarm, msgId}]}`, ≤ 200 readings, ≤ 64 KB; `readings:[]` = heartbeat) ·
   `GET /irr/latest` (IRR_TOKEN) · `GET /irr/history?pool=P01&hours=24` (IRR_TOKEN; one point per 15 min) · `GET /irr/readings?pool=&day=` (IRR_TOKEN) · `GET /irr/health` (no token).
   Readings carry `round` (the Pool Monitor slot ≤ the reading's Manila time) and `src`. A node's clock in the future is clamped to the receive time; > 7 days old is refused.
3. **Bridge (stopgap, alarm mails only)**: add `nexi@abapardes.com.ph` to the Google Group **"IT group"** (it@abapardes.com.ph) so the Pro-Leaf alarm mails reach it; then
   script.google.com under nexi@ → paste `workers/proleaf-alarm-bridge.gs` → Project Settings → Script Properties `IRR_URL`, `IRR_NODE_TOKEN` (the `proleaf-mail` token), `PROLEAF_MAP`, `ALERT_TO` → run `installBridge` once.
   It posts the value of every alarm mail (EC, water temperature, level — the units mail no pH) with `src:'alarm'`; one warning mail a day when no Pro-Leaf mail came for 24 h.
4. **In Nexi (v22.78)**: Irrigation → 🔌 Meters → ⚙ Feed settings → worker URL + On + token on ONE computer (it becomes the feeder; a 10-minute lease, the others watch) → map each BeHive-I device id to its pool (the seven 2024 ids are prefilled).
5. Tests: `node tests/workers/nexi-irr.test.mjs` (mock R2, no network).

## nexi-cold (cold-room temperature) — v22.96, Eyal 13 Oct 2026 ("connect the cold storage … online temp … maintenance check list to check daily … warn below 4 / above 8 … critical below 2 / above 12")

The new cold-room control box (blue lid, DELIXI D32 breaker QF, contactors KM1 / KM2) has an **Elitech Wi-Fi controller** on the Elitech
**iCold** cloud (app "Elitech iCold", web new.i-elitech.com). `workers/nexi-cold.js` receives the readings (R2, prefix `cold/`) and Nexi
(Maintenance → ❄ Cold storage, also Packaging) pulls them every 3 minutes from ONE computer (the feeder). Rooms: `CS1` "Cold storage 1"
(CCTV CAM-055) and `CS2` "Cold storage 2" (CAM-081); bands 4–8 °C OK, <4 / >8 warning, <2 / >12 critical (Nexi applies them, the worker
only stores −40 … 60 °C). What the OWNER does, once:

1. **Cloudflare → Workers → create `nexi-cold`** — paste `workers/nexi-cold.js`.
   ```toml
   name = "nexi-cold"
   main = "nexi-cold.js"
   compatibility_date = "2026-01-01"
   [[r2_buckets]]
   binding = "R2"
   bucket_name = "<SAME BUCKET AS nexi-bio>"
   # no [triggers] yet — add crons = ["*/5 * * * *"] only when pollElitech is wired to the Access API document
   ```
   - Secrets (names only here — generate long random strings yourself, never paste them in chat):
     - `COLD_TOKEN` — what Nexi uses to read (`/cold/latest`, `/cold/history`, `/cold/readings`); pasted on ONE computer in ❄ Cold storage → ⚙ Settings.
     - `NODE_TOKENS` — JSON, one entry per source that may push: `{"elitech-mail":{"token":"…","rooms":["CS1","CS2"]}}` (add e.g. `"probe-cs1":{"token":"…","rooms":["CS1"]}` for our own probe later).
     - optional var `ROOMS` — `CS1,CS2` (an allowlist; a reading for another room is refused "unknown room").
     - optional `COLD_MAP` — `{"Cold storage 1":"CS1","Cold storage 2":"CS2"}` (device names as in the iCold app; the bridge holds the same map).
     - optional `ELITECH_KEY_ID` / `ELITECH_KEY_SECRET` — only when Elitech sends the "Access API document" (today `pollElitech` records "not configured" and never guesses an address).
   - optional var `OK_BAND` — `4,8` (default): which reading of a 15-minute slot is the "worst" kept next to the last one.
   - Check: `https://nexi-cold.<account>.workers.dev/cold/health` answers `{"ok":true,"version":"23.22",…}` (no token needed, nothing secret in it).
   - **v23.22 — re-deploy** (the review fixes need the new file; until then Nexi keeps working with the v22.96 worker but without the fixes below):
     paste the new `workers/nexi-cold.js` over the old one and Deploy; no new secret, no binding change.
2. **Routes**: `POST /cold/push` (node token; `{readings:[{room|device, ts, t|temp|temperature, src, alarm, msgId}]}`, ≤ 200 readings, ≤ 64 KB; `readings:[]` = heartbeat;
   v23.22: also fault events `{room, ts, fault:"offline"|"online"|"unread", alarm}` — the newest per room) ·
   `GET /cold/latest` (COLD_TOKEN; v23.22 adds `recent` = every reading received in the last 24 h per room, and `faults`) · `GET /cold/history?room=CS1&hours=24`
   (COLD_TOKEN; v23.22: the LAST and the WORST reading per 15 min, hours 1–168) · `GET /cold/readings?room=&day=` (COLD_TOKEN) · `GET /cold/health` (no token).
   A node's clock in the future is clamped to the receive time; > 7 days old is refused; an older reading never replaces the latest; the device name is not stored;
   v23.22: a temperature is a number or a numeric string (a blank / false / [] is "no temperature", never 0 °C); a late reading for a finished day deletes that day's fold.
3. **Bridge (alarm mails only, starts in DRY RUN)**: script.google.com under nexi@abapardes.com.ph → new project → paste `workers/elitech-alarm-bridge.gs` →
   Project Settings → Script Properties `COLD_URL`, `COLD_NODE_TOKEN` (the `elitech-mail` token), `COLD_MAP` `{"Cold storage 1":"CS1","Cold storage 2":"CS2"}`,
   `ALERT_TO` (company addresses), `DRY_RUN` `1` → run `installBridge` once and allow. It reads the iCold alarm e-mails every 15 minutes; in DRY RUN it only logs
   "would post CS1 x.x °C" and sends a heartbeat. **Test**: in the iCold app set the high alarm to 2.0 °C for a few minutes so an alarm mail reaches nexi@; Apps Script →
   Executions shows "would post CS1 x.x °C"; if the room and the value are right set `DRY_RUN` to `0`; forward that one real alarm mail to the developer (the parser
   test uses synthetic samples until then); set the high alarm back to 8.0. One mail a day when no Elitech mail came for 24 h ("a silent room is not a fine room").
   **v23.22 — paste the new `workers/elitech-alarm-bridge.gs` over Code.gs** (the trigger and the properties stay): "device offline" and alarm mails it cannot read are
   now POSTED to nexi-cold as faults (Nexi shows "⚠ Elitech: controller OFFLINE" / "value unread" and tells the head of Maintenance) and mailed to ALERT_TO in the same run;
   mails older than 4 days (or 6 h older than the newest one done) are skipped.
4. **In Nexi (v22.96; v23.22 review fixes)**: Maintenance → ❄ Cold storage → ⚙ Settings (admin) → worker URL + On + paste `COLD_TOKEN` on ONE computer in the maintenance office (it becomes the
   feeder; a 10-minute lease, the others watch) → set each room's Elitech device name → 💾 Save. The technician's typed daily check (✅ Monitoring Checklist → ❄ Daily, due 10:00)
   stays the daily reading. The full owner / IT checklist (electrician, probes, controller settings, Wi-Fi, iCold account, pairing, alarm limits, API request) is on the
   ❄ Cold storage screen and in the Maintenance help guide.
5. Tests: `node tests/workers/nexi-cold.test.mjs` and `node tests/workers/elitech-bridge.test.mjs` (mock R2 / stubbed Apps Script, no network).
