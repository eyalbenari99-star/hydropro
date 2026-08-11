# Nexi SMS + Email Reminders — Setup Guide (one time, ~30 min)

Goal: every morning 7:00 AM, until memos are approved —
- SMS to Sir Eyal (final approver) and Dr. Amy (first approver) through the
  office Android phone with the unlimited eSIM plan (₱0 per SMS)
- Email to the HR and Accounting groups from **nexi@abapardes.com.ph**

No passwords or keys are ever stored in the Nexi app itself — they all live
in the company Cloudflare account.

---

## PART 1 — The office phone (Meajean, ~10 min)

1. Take the spare Android phone. Install the eSIM with the unli allnet
   text promo (GOMO / Globe / Smart). Keep the phone plugged in and on WiFi,
   in the office.
2. Install **httpSMS** from the Google Play Store (by NdoleStudio).
3. Open the app → sign in with a Google account (can be the nexi Gmail) →
   allow SMS permission → in the app, note the phone's number.
4. Go to **httpsms.com** on a computer, log in with the same account →
   Settings → copy the **API Key**. Send the API key + the phone's number
   to whoever does Part 3.

## PART 2 — The company Gmail (Sir Eyal, ~10 min)

1. Create **nexi@abapardes.com.ph** in the Google admin like any staff email.
2. Log in as that account, open **script.google.com** → New project.
3. Delete everything in the editor and paste:

```javascript
function doPost(e) {
  var KEY = 'PASTE-A-LONG-RANDOM-SECRET-HERE';
  var d = JSON.parse(e.postData.contents);
  if (d.key !== KEY) return ContentService.createTextOutput('unauthorized');
  MailApp.sendEmail({ to: d.to, subject: d.subject, body: d.text,
    name: 'Nexi — HydroNexis' });
  return ContentService.createTextOutput('ok');
}
```

4. Replace the secret with a long random string (keep a copy).
5. **Deploy → New deployment → Web app** → Execute as **Me**, access
   **Anyone** → Deploy → copy the web app URL (ends in `/exec`).
   Send the URL + the secret to whoever does Part 3.

## PART 3 — The Cloudflare worker (IT / Claude-guided, ~10 min)

In the same Cloudflare account as the existing `hnx-sync` worker:

1. Create a worker named **nexi-notify** with the code from
   `workers/notify-worker.js` (this repo).
2. Bind the SAME R2 bucket the sync worker uses, binding name `R2`.
3. Add secrets:
   - `NOTIFY_TOKEN` — any long random string (also pasted into the app)
   - `HTTPSMS_API_KEY` — from Part 1
   - `HTTPSMS_FROM` — the office phone's number, format `+639xxxxxxxxx`
   - `GMAIL_SCRIPT_URL` — from Part 2
   - `GMAIL_SCRIPT_KEY` — the secret from Part 2
4. Add a **Cron Trigger**: `0 23 * * *` (23:00 UTC = 7:00 AM Philippines).

## PART 4 — Inside Nexi (Sir Eyal, 2 min)

Memos screen → **📱 SMS & Alerts** (Admin only):
- Enter your mobile and Dr. Amy's mobile (09xx format is fine)
- Paste the worker URL (`https://nexi-notify.<account>.workers.dev`) and
  the `NOTIFY_TOKEN`
- Press **✉ Send test SMS to me** — a text should arrive within seconds
- HR / Accounting group emails are set in **🏛 Approvers**

Done. From then on it is automatic: any memo not approved gets a daily
7:00 AM SMS to the approvers and an email to HR + Accounting from
nexi@abapardes.com.ph, until approved. **🚀 Run today's reminders now**
in the setup screen triggers a round on demand.
