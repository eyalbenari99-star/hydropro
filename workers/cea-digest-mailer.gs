/* ============================================================================
   CEA DAILY DIGEST MAILER (v21.10) — Google Apps Script, runs as nexi@abapardes.com.ph
   Eyal chose e-mail via nexi@. Every morning, after the gov-watch worker's 08:00 Manila agent run, this
   script reads GET /gov/agent/latest and e-mails:
     • each person their OWN digest (Due today · Next 7 days · Renewals to prepare · Waiting for your
       update · Blocked) — only if it has something in it;
     • Edelyn (supervisor) the portfolio line: no owner, 2+ days overdue, stalled, no next action,
       renewals ≤ 14 days, blocking requests — plus Eyal on copy if SUPERVISOR_CC is set.
   It sends nothing when the run is stale or missing — it e-mails the supervisor a "no run" warning instead,
   never an "all clear". Each person gets at most one e-mail per day (PropertiesService guard).
   Restricted immigration items arrive already masked as "Restricted item".

   SETUP (5 minutes, signed in as nexi@abapardes.com.ph):
     1. script.google.com → New project → paste this file → Save as "CEA Digest Mailer".
     2. Project Settings → Script properties:
          GOV_WATCH_URL   https://nexi-gov-watch.<account>.workers.dev
          GOV_TOKEN       (the worker's GOV_TOKEN, if it has one)
          SUPERVISOR_CC   eyalbenari99@gmail.com        (optional)
          APP_URL         https://aba-pardes-monitoring.netlify.app
     3. Run sendDigests once → authorise (Gmail + external requests).
     4. Triggers → Add → sendDigests · Time-driven · Day timer · 8am to 9am (Asia/Manila project timezone).
   To test without e-mailing staff: set DRY_RUN = true → everything goes to SUPERVISOR_CC only.
   ============================================================================ */
var SECTIONS = [['today', 'Due today'], ['next7', 'Next 7 days'], ['renewals', 'Renewals to prepare'], ['waiting', 'Waiting for your update'], ['blocked', 'Blocked — needs help']];

function props_() { return PropertiesService.getScriptProperties(); }

function fetchLatest_() {
  var p = props_();
  var url = String(p.getProperty('GOV_WATCH_URL') || '').replace(/\/+$/, '');
  if (!url) throw new Error('Script property GOV_WATCH_URL is not set');
  var tok = p.getProperty('GOV_TOKEN') || '';
  var r = UrlFetchApp.fetch(url + '/gov/agent/latest', { headers: tok ? { Authorization: 'Bearer ' + tok } : {}, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('gov-watch returned HTTP ' + r.getResponseCode());
  return JSON.parse(r.getContentText());
}

function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function personHtml_(name, D, app) {
  var h = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1d2a24;max-width:640px">'
    + '<p>Good morning ' + esc_(name) + ' — your compliance items for today:</p>';
  SECTIONS.forEach(function (s) {
    var L = (D[s[0]] || []);
    if (!L.length) return;
    h += '<h3 style="font-size:15px;margin:16px 0 6px;color:#1f6fd0">' + s[1] + ' (' + L.length + ')</h3><ul style="margin:0 0 0 18px;padding:0">';
    L.slice(0, 25).forEach(function (i) {
      h += '<li style="margin:3px 0">' + esc_(i.title) + (i.caseId ? ' <span style="color:#6b7a73">· ' + esc_(i.caseId) + '</span>' : '')
        + (i.due ? ' — <b>' + esc_(i.due) + '</b>' + (i.days != null ? ' (' + (i.days < 0 ? (-i.days) + ' days late' : i.days + ' days') + ')' : '') : '') + '</li>';
    });
    h += '</ul>';
  });
  return h + '<p style="margin-top:16px"><a href="' + esc_(app) + '">Open Nexi</a> → 🏛 CEA → 📅 Follow-up Desk. Acknowledging an item does not close it; official deadlines never move.</p>'
    + '<p style="color:#6b7a73;font-size:12px">Sent by Nexi (nexi@abapardes.com.ph). Questions: Edelyn.</p></div>';
}

function sendDigests() {
  var p = props_(), app = p.getProperty('APP_URL') || 'https://aba-pardes-monitoring.netlify.app';
  var cc = p.getProperty('SUPERVISOR_CC') || '';
  var DRY = String(p.getProperty('DRY_RUN') || '').toLowerCase() === 'true';
  var day = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  var A;
  try { A = fetchLatest_(); } catch (e) {
    if (cc) MailApp.sendEmail(cc, '⚠ Nexi compliance digest — could not read today\'s run', 'The CEA digest mailer could not read the gov-watch agent: ' + e + '\nNo staff e-mails were sent. Check the worker in Cloudflare.');
    return;
  }
  var sup = A.supervisorEmail || '';
  if (!A.ok || A.stale) {
    var who = [sup, cc].filter(String).join(',');
    if (who) MailApp.sendEmail(who, '⚠ Nexi compliance digest — today\'s 08:00 run is missing', 'The daily compliance agent has no run for ' + day + (A.missed ? ' (missed)' : '') + '.\nNo digests were sent — this is NOT an all-clear. Check the gov-watch worker (Cloudflare → nexi-gov-watch → cron).');
    return;
  }
  var sent = 0, skipped = [];
  Object.keys(A.digest || {}).forEach(function (owner) {
    var D = A.digest[owner] || {}, n = SECTIONS.reduce(function (x, s) { return x + (D[s[0]] || []).length; }, 0);
    if (!n) return;
    var to = (A.emails || {})[owner];
    if (!to) { skipped.push(owner); return; }
    var key = 'sent:' + day + ':' + owner;
    if (p.getProperty(key)) return;
    MailApp.sendEmail({ to: DRY ? cc : to, subject: '📅 Your compliance items — ' + day + ((D.today || []).length ? (' · ' + D.today.length + ' due today') : ''),
      htmlBody: personHtml_(owner, D, app), name: 'Nexi' });
    p.setProperty(key, '1'); sent++;
  });
  var S = A.supervisor || {};
  var line = 'No owner: ' + (S.noOwner || 0) + ' · 2+ days overdue: ' + (S.overdue2 || 0) + ' · stalled 14+ days: ' + (S.stalled || 0) + ' · no next action: ' + (S.noNextAction || 0)
    + ' · renewals ≤ 14 days: ' + (S.renewalsCrit || 0) + ' · blocking requests: ' + (S.blocking || 0);
  var supTo = DRY ? cc : sup;
  if (supTo && !p.getProperty('sent:' + day + ':__supervisor')) {
    MailApp.sendEmail({ to: supTo, cc: DRY ? '' : cc, subject: '🧭 Compliance portfolio — ' + day, name: 'Nexi',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px"><p><b>' + esc_(line) + '</b></p><p>' + sent + ' personal digest(s) sent.'
        + (skipped.length ? ' <b>No e-mail on file for:</b> ' + esc_(skipped.join(', ')) + ' — add it to their Nexi user record.' : '') + '</p>'
        + '<p><a href="' + esc_(app) + '">Open Nexi → 🏛 CEA → 📅 Follow-up Desk</a></p></div>' });
    p.setProperty('sent:' + day + ':__supervisor', '1');
  }
}
