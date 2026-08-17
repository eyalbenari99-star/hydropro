# HydroNexis-AI (ABA Pardes) — working conventions

## Deployment (IMPORTANT)
- `index.html` on branch `main` is the single source of truth. Pushing to `main`
  auto-deploys to Netlify (site `aba-pardes-monitoring`, production URL
  https://aba-pardes-monitoring.netlify.app). Never ask the user to drag-drop
  files to Netlify — deploy by pushing to `main`.
- **Every change to `index.html` MUST bump `APP_VERSION`** (search for
  `const APP_VERSION=`) and add a short `/* vX.Y: what changed */` comment at
  the front of the version comment trail. The version shows in the app's title
  bar — it is how the user verifies a deploy reached their machines
  (hard refresh: Cmd+Shift+R).
- Verify a Netlify deploy via the Netlify MCP (`get-project`,
  site id `7e05069d-ecf2-428f-ad08-a16ca0e396d5`) — `currentDeploy.id` changes
  when the push is live. Direct fetches to netlify.app/cloudflare are blocked
  by this environment's network policy.

## Code layout
- The app is one large `index.html` (~26 MB): a base app plus many additive
  IIFE patch `<script>` blocks (versioned v13.x–v15.x). Patches are additive
  and backward-compatible; later patches often modify the DOM of earlier
  features on a timer (setInterval enhancers) — beware render races between
  enhancers (see v15.62 payroll column fix).
- `workers/` holds Cloudflare Workers: `biometric-worker.js` (nexi-bio,
  ZKTeco/NGTeco iclock receiver + /bio/* API), `gmail-bio-bridge.gs`
  (Google Apps Script: NGTeco report email → /bio/import; runs under
  nexi@abapardes.com.ph), plus sync/notify/speech/EA workers.
- After JS edits inside `index.html`, extract the touched `<script>` block and
  `node --check` it before committing.

## Attendance / payroll domain notes
- Attendance store: `hydroPro_attendance` = `{ 'YYYY-MM-DD': { empId: rec } }`.
  Labor (weekly payroll): no record = counted ABSENT. Office (semi-monthly):
  no record = PAID (only manual absent deducts).
- Allowances live on the employee record (`emp.allowances[]`, legacy
  `emp.monthlyAllowance`) and are prorated by attended days (weekly ÷26,
  office ÷22). Payroll runs are frozen snapshots — card changes require
  regenerating the run.
- Biometric chain: NGTeco clock (no ADMS cloud menu on this firmware) →
  scheduled report email → nexi inbox → gmail-bio-bridge.gs (15-min trigger) →
  nexi-bio worker /bio/import → app IT → 🖐 Biometric Sync pulls every 3 min →
  fills attendance (first scan = in, last = out; manual wins).
