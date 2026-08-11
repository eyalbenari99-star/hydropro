# JOMEL — Nexi Biometric + Reminders Setup (complete, in order)

Everything below is one-time. After this, attendance flows from the
fingerprint clock into Nexi/payroll by itself, and memo reminders go out
by SMS/email daily. Total time: about 45 minutes.

Have ready: the Cloudflare login (same account as the existing hnx-sync
worker), the Google admin for @abapardes.com.ph, and the office.ngteco.com
login.

---

## PART 0 — Create the robot email (5 min) — Sir Eyal or Jomel

1. In Google Workspace admin, create a normal user:
   **nexi@abapardes.com.ph** (any strong password; save it).
2. Log in once at gmail.com with that account so it is active.

---

## PART A — Cloudflare receiver "nexi-bio" (10 min)

1. Go to **dash.cloudflare.com**, log in (same account as hnx-sync).
2. Left menu → **Workers & Pages** → **Create** → **Create Worker**.
3. Name: **nexi-bio** → press **Deploy**.
4. Press **Edit code** → select ALL the code in the editor and delete it →
   paste the ENTIRE content of the file **biometric-worker.js**
   (Sir Eyal has it as an attachment in this chat; it is also in the
   project repo under workers/) → press **Deploy** (top-right).
5. Back on the worker page → **Settings** → **Bindings** → **Add** →
   **R2 bucket**:
   - Variable name: **R2**  (exactly like that)
   - Bucket: choose the SAME bucket that the hnx-sync worker uses
     (check: open hnx-sync → Settings → Bindings → note its bucket name)
   - Save.
6. Settings → **Variables and Secrets** → **Add** → type: **Secret**
   - Name: **BIO_TOKEN**
   - Value: **nxbio_7Kp2vQ9mXr4Tz8Wf3Jd6Hs1Lc5Bn0Ye**
     (or your own long random text — write it down, it is needed twice more)
   - Save.
7. Copy the worker URL from its main page, like:
   `https://nexi-bio.XXXX.workers.dev`  → write it down.
8. TEST: open `https://nexi-bio.XXXX.workers.dev/bio/status` in a browser.
   Seeing `{"error":"unauthorized"}` means it WORKS (it refuses strangers).

---

## PART B — NGTeco Office daily report (5 min)

1. Log in to **office.ngteco.com**.
2. Go to **Attendance → Reports** (the timecard/report area).
3. Find the **automated / scheduled report** option (report sent by email).
4. Create one:
   - Report: **Timecard / attendance details** (the one that shows each
     person's clock-in and clock-out times per day)
   - Format: **Excel**
   - Frequency: **Daily**
   - Send to: **nexi@abapardes.com.ph**
5. If possible, also send one report NOW manually to the same address —
   it gives us a file to test Part C immediately.

---

## PART C — Google script that reads the reports (10 min)

1. In a browser where you are logged in as **nexi@abapardes.com.ph**,
   go to **script.google.com** → **New project**.
2. Delete the sample code. Paste the ENTIRE content of
   **gmail-bio-bridge.gs** (attachment in this chat / repo workers/).
3. At the top of the pasted code fill the two lines:
   - `BIO_URL` = the worker URL from Part A step 7
   - `BIO_TOKEN` = the secret value from Part A step 6
4. Left sidebar → **Services** ( + ) → find **Drive API** → **Add**.
5. Save (💾). Then press **Run** (▶) once, choose the function **runBridge**
   → Google asks for permissions → Advanced → allow. (This first run also
   processes the test report from Part B if it already arrived.)
6. Left sidebar → **Triggers** (clock icon) → **Add Trigger**:
   - Function: **runBridge**
   - Event source: **Time-driven** → **Minutes timer** → **Every 30 minutes**
   - Save.

---

## PART D — Connect Nexi (5 min) — with Sir Eyal (Admin login)

1. In Nexi: left menu **IT → 🖐 Biometric Sync**.
2. Bio worker URL: paste the Part A URL. Token: paste BIO_TOKEN. **Save**.
3. Press **⬇ Pull scans now**. After Part C ran at least once, the scan
   log fills and "NEEDS LINKING" shows every Person ID from the clock.
4. For each Person ID, choose the matching employee → **Link**
   (one time only; new hires appear here automatically for linking).
5. Done. From now attendance fills itself: first scan = time in
   (late after 7:00 counts automatically), last scan = time out.
   HR sees normal attendance; IT sees the raw scan log here.

---

## PART E — Memo SMS + email reminders (15 min, can be another day)

1. **Office phone**: Android + unlimited eSIM promo. Install the
   **httpSMS** app (Play Store) → sign in with the nexi Google account →
   allow SMS. On httpsms.com → Settings → copy the **API key**.
2. **Cloudflare**: create a second worker exactly like Part A, named
   **nexi-notify**, code from **notify-worker.js** (repo/attachment).
   Bindings: same R2 bucket, variable name **R2**. Secrets:
   - NOTIFY_TOKEN  = any long random text (write it down)
   - HTTPSMS_API_KEY = from step 1
   - HTTPSMS_FROM  = the office phone's number as +639XXXXXXXXX
   - GMAIL_SCRIPT_URL + GMAIL_SCRIPT_KEY = from the small mail-sender
     script (Part 2 of the main guide: 10 lines pasted in
     script.google.com under nexi@, deployed as Web app)
   Then: worker → Settings → **Triggers** → **Add Cron Trigger**:
   `0 23 * * *`  (= 7:00 AM Philippines daily).
3. **Nexi**: Memos screen → **📱 SMS & Alerts** → enter Sir Eyal's and
   Dr. Amy's mobiles + the nexi-notify URL + NOTIFY_TOKEN → Save →
   press **✉ Send test SMS to me** → a text arrives = LIVE.

---

## If something does not work

- Worker URL test shows an error page (not "unauthorized") → the code
  paste in Part A step 4 was incomplete — paste again, Deploy.
- Part C Run shows red error about Drive → Part C step 4 (Drive API
  service) was skipped.
- Nexi "Pull scans" shows nothing → check the report actually arrived in
  the nexi Gmail inbox, and that runBridge ran (script.google.com →
  Executions shows green runs).
- Scans arrive but no attendance → the Person IDs are not linked yet
  (Part D step 4).
Take a screenshot of whatever looks wrong and send it to Sir Eyal for
Claude — every step above can be checked remotely from a screenshot.
