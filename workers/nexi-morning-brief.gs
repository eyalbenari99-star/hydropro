/** Nexi ☀️ Morning Brief — Google Apps Script (v4.0: EACH USER's morning brief by e-mail + WhatsApp, from the 🧭 Assistant cards; v3.7: 06:00 calendar brief for TODAY + TOMORROW, 07:15 attendance report; Eyal, Dr Amy, Chen; WhatsApp + e-mail)
 *
 * v4.0 (14 Oct 2026 — Eyal, 13 Oct: "users still not getting WhatsApp morning brief also not emails brief after
 * review there emails"). Until v4 nothing could send a brief to anyone but Eyal, Dr Amy and Chen: the e-mails the owner
 * reviewed in Nexi (Administration ▸ 👥 Users ▸ 🧭 Assistant ▸ Work e-mail) were read by no server, and the app's own
 * e-mail / WhatsApp senders (nexi-notify, nexi-wa) were never deployed. v4 adds a per-user loop to THIS script:
 *   · every 15 minutes (trigger nexiUserBriefTick) it reads the user list, the 🧭 Assistant cards and the briefing
 *     times from the cloud store, and sends each person whose briefing time has come THEIR OWN brief —
 *     tasks, escalations, team overdue, memos / notices waiting, calls, today's meetings, production (only what
 *     that person may see in Nexi; never a pay figure on WhatsApp);
 *   · e-mail only to a @abapardes.com.ph address (GmailApp, from nexi@); WhatsApp through CallMeBot when the
 *     person's key is in Script properties as WA_<USERNAME> (e.g. WA_JINKY = 639171234567|1234567);
 *   · it writes a delivery log (no addresses, no numbers, no keys) that Nexi shows in 📣 Briefings & Voice and
 *     in Administration ▸ 👥 Users ▸ 📨 Brief delivery, and mails eyal@ once a day when something was not delivered.
 *   The 06:00 / 07:15 leadership briefs below are unchanged (their WhatsApp is now split under the 2 KB URL
 *   limit and checked, and both sends are recorded in the same log).
 *
 * OWNER STEPS FOR v4 (about 10 minutes, at script.google.com signed in as nexi@abapardes.com.ph):
 *   1. Open THIS project (its ⏰ Triggers list nexiMorningBrief). Select all the code, paste this file over it, 💾 Save.
 *   2. ⚙ Project Settings: the time zone must read (GMT+08:00) Manila.
 *   3. Editor: choose installUserBriefs in the function list → ▶ Run (Review permissions → nexi@ → Allow if asked).
 *      It adds the 15-minute timer, keeps the 06:00 / 07:15 timers and sends NOTHING to staff: you get
 *      "⚙ Nexi user briefs — setup check (v4.0)" at eyal@abapardes.com.ph listing every user.
 *      It must run as nexi@: from any other account it installs nothing and the log shows "STOPPED — this account is …"
 *      (the 15-minute timer only sends in the account installUserBriefs confirmed, so no brief ever goes out twice).
 *   4. Fix the rows marked ⚠ in Nexi (Administration ▸ 👥 Users ▸ 📨 Brief delivery ▸ 🧭 Assistant ▸ Work e-mail).
 *   5. ⚙ Project Settings ▸ Script properties ▸ Add: USER_BRIEF = on → Save. (Absent or "dry" = trial run that
 *      only writes the log; "off" = stop all staff briefs; the leadership briefs never depend on it.)
 *   6. WhatsApp per person: when someone sends you their mobile number and CallMeBot key, add the Script property
 *      named exactly as the 📨 Brief delivery table shows (WA_<USERNAME>), value 63XXXXXXXXXX|key, and tick
 *      "send WhatsApp messages" on their 🧭 Assistant card. Never type a key into Nexi.
 *   Optional: USER_BRIEF_MAX_MAILS = a number caps the staff e-mails per day (default 400);
 *             USER_BRIEF_MAX_TESTS = a number caps the "📨 Send me a test brief" sends for everyone together (default 15 a day).
 *
 * v4.0 review fixes (14 Oct): WhatsApp never carries an amount in any spelling (P5000, Php500, 727.27, 15000, 25k …),
 * a memo / pay notice title or a Google Calendar title; leaders are known by username (eyal, amy / dramy / amyp, chen / cheriet) or their
 * own mailboxes, never a name pattern; an HR e-mail that belongs to another user or a leadership mailbox is never
 * used; the permissions snapshot only counts when an administrator published it and can never widen pay; a WhatsApp is
 * never sent twice (state kept before sending, part 2 failures are "not confirmed", nothing new after 5 minutes);
 * "missed" only when the engine really did not run before 11:00; a failing log push and a failing timer are reported.
 *
 * Every morning at BRIEF_HOUR (Asia/Manila) this script mails Eyal one
 * e-mail with the day in it:
 *
 *   📅 Today's calendar — eyal@abapardes.com.ph and nexi@abapardes.com.ph
 *   ⏰ Attendance — who has punched so far this morning, who hasn't
 *   🌱 Yesterday's checklist — warnings and criticals per greenhouse
 *   📞 Open calls — everything still open, criticals listed by name
 *   🛒 Item requests waiting for approval (Prj 15 / 16 and inventory)
 *
 * The farm data comes from the same cloud store every device syncs to
 * (hnx-sync worker, /sync/pull) — the same numbers the app shows, not a
 * copy. The calendar comes straight from Google Calendar.
 *
 * SETUP (one time, at script.google.com signed in as nexi@abapardes.com.ph):
 *   1. New project → paste this file → File ▸ Project settings ▸
 *      set the time zone to Asia/Manila.
 *   2. Project Settings ▸ Script properties → add:
 *        HNX_USER  = the cloud-sync username (e.g. nexi or eyal)
 *        HNX_PASS  = that account's cloud-sync password
 *      (Properties, not code — so no password ever sits in a file.)
 *   3. Run installMorningBrief once → grant permissions.
 *      It creates the daily trigger and sends a first brief immediately
 *      so you can see it works without waiting for tomorrow.
 *   4. For Eyal's calendar to appear, eyal@abapardes.com.ph must share his
 *      calendar with nexi@abapardes.com.ph (Google Calendar ▸ Settings ▸
 *      Share with specific people ▸ "See all event details"). Same-domain
 *      accounts usually already see busy/details; if a calendar cannot be
 *      read the brief says so on that line instead of failing.
 *
 * Like the bio bridge, it heals itself: every run re-creates the trigger
 * if it has been lost, and a run that fails e-mails the error instead of
 * dying silently.
 */

var SYNC_URL   = 'https://hnx-sync.eyalbenari99.workers.dev';
/* v3 (Eyal, 4 Sep 2026): TWO sends a day, WhatsApp + e-mail each —
     06:00  ☀ Morning brief   — calendars review, yesterday's checklist, open calls, requests
     07:15  ⏰ Attendance report — who punched in, who is late, who is missing (people punch until 7) */
/* v3.5: people who are NOT on the biometric clock by policy — shareholders and
   management are paid whether they punch or not, so they must never appear in
   "no punch yet". Matched by NAME (the three named here) and by DEPARTMENT
   (the app files them under MANAGEMENT). The report prints who it skipped so
   a wrong exclusion is visible, not silent. The v3.2 filter only covered ONE
   of the three attendance paths; this one is applied in all of them. */
var NO_CLOCK_NAMES = /ben\s*ari|kshepitsk|patdu|dra\.?\s*amy|amy\s*patdu|iris\s*ben/i;
var NO_CLOCK_DEPTS = /^(MANAGEMENT|SHAREHOLDER|SHAREHOLDERS|OWNER|BOARD)$/i;
function onClock_(e) {
  if (!e) return false;
  if (e.noBio || e.bioExempt || e.exemptBio || e.noClock) return false;      /* app-side flag, if ever set */
  if (NO_CLOCK_NAMES.test(String(e.name || e.fullname || ''))) return false;
  if (NO_CLOCK_DEPTS.test(String(e.dept || e.department || '').trim())) return false;
  return true;
}
function offClockNames_(emps) {
  return (emps || []).filter(function (e) { return e && e.id && e.name && !onClock_(e)
      && !/inactive|terminat|resign|separated/i.test(String(e.status || '')) && !e.separated; })
    .map(function (e) { return String(e.name).slice(0, 30); }).sort();
}

var BRIEF_HOUR = 6,  BRIEF_MIN = 0;     // morning brief (calendar review)
var ATT_HOUR   = 7,  ATT_MIN   = 15;    // attendance report
var TZ         = 'Asia/Manila';

/* One brief per person, each with their own calendar and their own sections.
   sections: calendar | attendance | checklist | calls | requests (waiting for
   approval — for approvers) | release_queue (approved, waiting to be handed
   out — for the warehouse) | my_calls (open calls assigned to this person,
   matched by the `match` pattern against assignee names).
   To add a person: add a row and share their calendar with nexi once. */
var RECIPIENTS = [
  { name: 'Eyal', to: 'eyalbenari99@gmail.com', cc: 'eyal@abapardes.com.ph',
    /* v3.3: the brief said "no events" on a day full of flights and pool cleaning because
       it never looked at the calendar those events are actually on. Eyal's real day lives on
       his PERSONAL calendar (eyalbenari99@gmail.com) plus the two AteretPaz management
       calendars; the work calendar was readable but empty. Each of these still has to be
       shared with nexi@abapardes.com.ph once — the brief now says loudly which ones are not. */
    calendars: ['eyalbenari99@gmail.com',
                'fcbr0bbhpo6uv4c75csesba3vc@group.calendar.google.com',   /* AteretPaz Managment */
                '3ggu0pqlmrod4brbhqujt3lhk8@group.calendar.google.com',   /* AterePaz Technologies Managment */
                'eyal@abapardes.com.ph', 'nexi@abapardes.com.ph',
                'ABA PARDES - ADMIN', 'ABA PARDES - MAINTANENCE', 'ABA PARDES - PRODUCTION'],
    sections: ['calendar', 'tasks', 'attendance', 'checklist', 'calls', 'requests'],
    waKeyProp: 'WA_EYAL' },
  { name: 'Dr Amy', to: 'dramypatdu@gmail.com',
    /* v3.6/3.7: her working calendars are on the Gurlavi and ABA Pardes company accounts, shared with nexi (Eyal, 6 Sep) */
    calendars: ['amyp@gurlaviholdings.com.ph', 'amyp@abapardes.com.ph', 'dramypatdu@gmail.com', 'nexi@abapardes.com.ph',
                'ABA PARDES - ADMIN', 'ABA PARDES - MAINTANENCE', 'ABA PARDES - PRODUCTION'],
    sections: ['calendar', 'attendance', 'checklist', 'calls', 'requests'],
    waKeyProp: 'WA_AMY' },                 /* WA_AMY = 639778572208|apikey once she activates CallMeBot */
  { name: 'Chen', to: 'cheriet@abapardes.com.ph',
    calendars: ['cheriet@abapardes.com.ph'],
    match: /chen|cheriet/i,
    sections: ['calendar', 'release_queue', 'my_calls', 'checklist'],
    waKeyProp: 'WA_CHEN' }
];

/* WHATSAPP DELIVERY (optional, per person) — via CallMeBot, a relay that
   sends TO your own WhatsApp from ITS number: the ABA Pardes company SIM
   (+63 977 857 2214) is never used, registered, or touched.
   One-time activation, per person, on their own phone:
     1. Open callmebot.com (free WhatsApp API page) and save the number shown THERE as a contact
        "CallMeBot" (v4.0: the bot's number changes — always take it from the page, never from this file).
     2. Send it the WhatsApp message:  I allow callmebot to send me messages
     3. It replies with your personal apikey within a minute or two.
   Then in Project Settings → Script properties add one property per person:
     WA_EYAL = 63XXXXXXXXXX|apikey     (phone with country code, |, the key)
     WA_CHEN = 63XXXXXXXXXX|apikey
   From the next run, a compact text version of the brief lands in WhatsApp
   alongside the e-mail. No property = no WhatsApp for that person, no error. */

/* ---------------- install / self-heal ---------------- */

function installMorningBrief() {
  /* re-running install moves the schedule: old triggers are removed so both
     sends fire at the CURRENT hours, not the old ones */
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'nexiMorningBrief' || f === 'nexiAttendanceReport') ScriptApp.deleteTrigger(t);
  });
  ensureTrigger_();
  nexiMorningBrief();                   // send one now so setup is verifiable
  nexiAttendanceReport();               // and one attendance report
}

function ensureTrigger_() {
  var have = {};
  ScriptApp.getProjectTriggers().forEach(function (t) { have[t.getHandlerFunction()] = 1; });
  if (!have.nexiMorningBrief)
    ScriptApp.newTrigger('nexiMorningBrief')
      .timeBased().everyDays(1).atHour(BRIEF_HOUR).nearMinute(BRIEF_MIN).inTimezone(TZ).create();
  if (!have.nexiAttendanceReport)
    ScriptApp.newTrigger('nexiAttendanceReport')
      .timeBased().everyDays(1).atHour(ATT_HOUR).nearMinute(ATT_MIN).inTimezone(TZ).create();
  /* v4.0: each user's own brief — checks every 15 minutes who is due (the legacy triggers above are untouched).
     Re-created here only for the account installUserBriefs confirmed (nexi@), and a failure here (e.g. "too many triggers")
     never stops the 06:00 / 07:15 leadership sends that call this first. */
  if (!have.nexiUserBriefTick && ubGet_('ub_owner')) {
    try { ScriptApp.newTrigger('nexiUserBriefTick').timeBased().everyMinutes(15).create(); } catch (e) {}
  }
}

/* ---------------- the brief ---------------- */

function nexiMorningBrief()     { sendRound_('morning'); }
function nexiAttendanceReport() { sendRound_('attendance'); }

/* one round = one e-mail + one WhatsApp per recipient.
   'morning'    = the person's own sections MINUS attendance (nobody has punched at 06:00)
   'attendance' = the attendance report (+ a one-line calendar reminder) */
function sendRound_(mode) {
  ensureTrigger_();
  var data = null, pullErr = null;
  try { data = pullCloud_(); } catch (e) { pullErr = e; }
  var today = Utilities.formatDate(new Date(), TZ, 'EEE d MMM yyyy');
  RECIPIENTS.forEach(function (rc) {
    try {
      if (pullErr) throw pullErr;
      var subj = mode === 'attendance' ? '⏰ Nexi Attendance — ' + today : '☀️ Nexi Morning Brief — ' + today;
      /* GmailApp garbles 4-byte emoji (📅 📋 📞) into ������ while
         2-byte ones (⏰ ☀) survive - so every wide character is sent as an
         HTML numeric entity, which no mail client can misread. */
      GmailApp.sendEmail(rc.to, subj,
        'Open this e-mail in an HTML mail client.',
        { htmlBody: entify_(buildBrief_(data, rc, mode)), cc: rc.cc || '', name: 'Nexi · HydroNexis-AI' });
      ubRecordLeader_(rc, data, 'e', { s: 'sent', round: mode });   /* v4.0: shown in Nexi's 📨 Brief delivery (never throws) */
      try { sendWhatsApp_(rc, data, mode); } catch (e) {}   /* WhatsApp never blocks the e-mail */
    } catch (e) {
      ubRecordLeader_(rc, data, 'e', { s: 'failed', why: String(e).slice(0, 120), round: mode });
      GmailApp.sendEmail(RECIPIENTS[0].to, '⚠ Nexi ' + mode + ' brief failed for ' + rc.name,
        'The brief for ' + rc.name + ' could not be produced:\n\n' + e + '\n\n' +
        'Most often this is the HNX_USER / HNX_PASS script property or the sync worker being unreachable.');
    }
  });
}

/* ---------------- cloud data ---------------- */

function pullCloud_() {
  var props = PropertiesService.getScriptProperties();
  var user = props.getProperty('HNX_USER'), pass = props.getProperty('HNX_PASS');
  if (!user || !pass) throw new Error('Set HNX_USER and HNX_PASS in Script properties.');
  var login = JSON.parse(UrlFetchApp.fetch(SYNC_URL + '/auth/login', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ username: user, password: pass }),
    muteHttpExceptions: true
  }).getContentText());
  if (!login.token) throw new Error('Cloud login failed: ' + (login.error || 'no token'));
  var res = JSON.parse(UrlFetchApp.fetch(SYNC_URL + '/sync/pull', {
    headers: { Authorization: 'Bearer ' + login.token },
    muteHttpExceptions: true
  }).getContentText());
  return res.data || {};
}

/* ---------------- WhatsApp (CallMeBot relay — company SIM untouched) ---------------- */

function sendWhatsApp_(rc, data, mode) {
  if (!rc.waKeyProp) return;
  var cfg = PropertiesService.getScriptProperties().getProperty(rc.waKeyProp);
  if (!cfg || cfg.indexOf('|') < 0) return;             /* not activated for this person */
  var phone = cfg.split('|')[0].trim(), key = cfg.split('|')[1].trim();
  var text = mode === 'attendance' ? waAttendanceText_(rc, data) : waText_(rc, data);
  /* v4.0: the whole text used to travel in ONE GET — a busy morning made a 2,295-byte URL, over UrlFetchApp's
     2 KB limit, and the error was swallowed; CallMeBot's answer was never read either. callMeBot_ drops any
     line with an amount, splits the text into parts under the limit, reads "queued" back, and the result is
     recorded for Nexi's 📨 Brief delivery. */
  var res = callMeBot_(phone, key, text);
  ubRecordLeader_(rc, data, 'w', { s: res.s, why: res.why, parts: res.parts, round: mode });
}

/* a compact plain-text brief that reads well in a chat bubble */
function waText_(rc, data) {
  var L = ['☀ Nexi Brief · ' + Utilities.formatDate(new Date(), TZ, 'EEE d MMM')];
  try {
    /* 📅 today's calendar — same calendars the e-mail uses, compact */
    if ((rc.sections || []).indexOf('calendar') >= 0 && rc.calendars && rc.calendars.length) {
      var cs = new Date(); cs.setHours(0, 0, 0, 0);
      var unread = [];
      var dayLines = function (from, to) {
        var evLines = [];
        rc.calendars.forEach(function (id) {
          try {
            var cal = CalendarApp.getCalendarById(id);
            if (!cal) { var byName = CalendarApp.getCalendarsByName(id); if (byName && byName.length) cal = byName[0]; }
            if (!cal) { if (unread.indexOf(id) < 0) unread.push(id); return; }
            /* v3.4: opens but is mute — counts as blind, not as an empty day */
            if (calMute_(id, cal)) { if (unread.indexOf(id) < 0) unread.push(id); return; }
            cal.getEvents(from, to).forEach(function (ev) {
              var when = ev.isAllDayEvent() ? 'all day' : Utilities.formatDate(ev.getStartTime(), TZ, 'HH:mm');
              evLines.push([ev.isAllDayEvent() ? '' : when, when + ' ' + String(ev.getTitle() || '').slice(0, 48), String(ev.getTitle() || '')]);
            });
          } catch (e) {}
        });
        evLines.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
        /* v3.3: the same flight arrives from the airline mail, the booking site and a manual
           entry — three lines for one trip. Collapse by start time + flight code when there is
           one, otherwise by start time + the squashed title. */
        var seen = {};
        return evLines.filter(function (x) {
          var k = dedupeKey_(x[0], x[2]);
          if (seen[k]) return false; seen[k] = 1; return true;
        }).map(function (x) { return x[1]; });
      };
      /* v3: always TODAY and TOMORROW */
      var d1 = new Date(cs.getTime() + 86400000), d2 = new Date(cs.getTime() + 2 * 86400000);
      var today = dayLines(cs, d1), tmrw = dayLines(d1, d2);
      /* v3.3: "no events" is only true when every calendar was actually READ. If any could
         not be opened, say that instead — the old wording hid a blind brief for weeks. */
      var blind = unread.length, seen = rc.calendars.length - blind;
      if (blind) {
        L.push('⚠ I can only see ' + seen + ' of ' + rc.calendars.length + ' calendars — your day may look emptier than it is.');
        L.push('  not shared with nexi (or shared as free/busy only): ' + unread.join(', '));
      }
      var noneTxt = blind ? ': nothing on the calendars I can see' : ': no events';
      L.push('📅 today ' + Utilities.formatDate(cs, TZ, 'EEE d') + (today.length ? ':' : noneTxt));
      today.slice(0, 8).forEach(function (x) { L.push('  • ' + x); });
      if (today.length > 8) L.push('  … +' + (today.length - 8) + ' more');
      L.push('📅 tomorrow ' + Utilities.formatDate(d1, TZ, 'EEE d') + (tmrw.length ? ':' : noneTxt));
      tmrw.slice(0, 6).forEach(function (x) { L.push('  • ' + x); });
      if (tmrw.length > 6) L.push('  … +' + (tmrw.length - 6) + ' more');
    }
    if (false) { /* v3: attendance moved to the 07:15 report — at 06:00 it always read 0 punched in */
      var att = store_(data, 'hydroPro_attendance', {}), emps = store_(data, 'hydroPro_employees', []);
      var t = att[day_(0)] || {}, act = emps.filter(function (e) { return e && e.status !== 'inactive' && !e.separated; });
      var inC = 0; act.forEach(function (e) { var r = t[e.id]; if (r && (r.status === 'present' || r.status === 'late')) inC++; });
      L.push('⏰ ' + inC + '/' + act.length + ' punched in');
    }
    var st = store_(data, 'hydroPro_' + day_(-1), {}), w = 0, c = 0;
    Object.keys(st).forEach(function (gh) { var g = st[gh]; if (!g || !g.statuses) return;
      Object.keys(g.statuses).forEach(function (k) { if (g.statuses[k] === 'warn') w++; if (g.statuses[k] === 'danger') c++; }); });
    L.push('🌱 yesterday: ' + (c ? c + ' critical, ' : '') + w + ' warnings');
    var iss = store_(data, 'hydroPro_issues_v2', []);
    var open = (Array.isArray(iss) ? iss : []).filter(function (i) {
      return i && !/closed|resolved|done|cancelled|approved/i.test(String(i.status || '')); });
    var crit = open.filter(function (i) { return /crit|urgent|high/i.test(String(i.severity || i.priority || '')); });
    L.push('📞 ' + open.length + ' open calls' + (crit.length ? ' · ' + crit.length + ' CRITICAL' : ''));
    crit.slice(0, 3).forEach(function (i) { L.push('  • ' + String(i.title || i.subject || i.issue || '').slice(0, 60)); });
    if ((rc.sections || []).indexOf('release_queue') >= 0) {
      var q = 0;
      ['hydroPro_prj15_reqs_v1', 'hydroPro_prj16_reqs_v1', 'hydroPro_inv_requests_v1'].forEach(function (k) {
        var arr = store_(data, k, []);
        (Array.isArray(arr) ? arr : []).forEach(function (r) { if (r && /^APPROVED$/i.test(String(r.status || ''))) q++; }); });
      L.push('📦 ' + q + ' approved waiting for release');
    }
    if ((rc.sections || []).indexOf('requests') >= 0) {
      var wtg = 0;
      ['hydroPro_prj15_reqs_v1', 'hydroPro_prj16_reqs_v1', 'hydroPro_inv_requests_v1'].forEach(function (k) {
        var arr = store_(data, k, []);
        (Array.isArray(arr) ? arr : []).forEach(function (r) { if (r && /SUBMITTED|PENDING/i.test(String(r.status || ''))) wtg++; }); });
      L.push('🛒 ' + wtg + ' requests waiting for approval');
    }
  } catch (e) {}
  L.push('Full brief in your e-mail 📧');
  return L.join('\n');
}

/* ⏰ 07:15 attendance report for WhatsApp: in / late / missing, by name */
function waAttendanceText_(rc, data) {
  var L = ['⏰ Nexi Attendance · ' + Utilities.formatDate(new Date(), TZ, 'EEE d MMM HH:mm')];
  try {
    var a = attendanceStats_(data);
    L.push('✅ ' + a.inCount + '/' + a.total + ' punched in' + (a.late.length ? ' · ' + a.late.length + ' late' : ''));
    if (a.late.length) { L.push('⏱ late:'); a.late.slice(0, 10).forEach(function (x) { L.push('  • ' + x); }); if (a.late.length > 10) L.push('  … +' + (a.late.length - 10) + ' more'); }
    if (a.leave.length) L.push('🌴 on leave: ' + a.leave.length);
    L.push('❌ no punch yet: ' + a.missing.length);
    a.missing.slice(0, 12).forEach(function (x) { L.push('  • ' + x); });
    if (a.missing.length > 12) L.push('  … +' + (a.missing.length - 12) + ' more (e-mail has all)');
    if (a.offClock && a.offClock.length) L.push('👔 not on the clock by policy: ' + a.offClock.length + ' (' + a.offClock.map(function (n) { return n.split(',')[0]; }).join(', ') + ')');
    /* one-line calendar reminder for the next event today */
    if (rc.calendars && rc.calendars.length) {
      var now = new Date(), ce = new Date(now); ce.setHours(23, 59, 59, 0), nxt = null;
      rc.calendars.forEach(function (id) { try { var cal = CalendarApp.getCalendarById(id); if (!cal) { var bn = CalendarApp.getCalendarsByName(id); if (bn && bn.length) cal = bn[0]; } if (!cal) return;
        cal.getEvents(now, ce).forEach(function (ev) { if (ev.isAllDayEvent()) return; if (!nxt || ev.getStartTime() < nxt.getStartTime()) nxt = ev; }); } catch (e) {} });
      if (nxt) L.push('📅 next: ' + Utilities.formatDate(nxt.getStartTime(), TZ, 'HH:mm') + ' ' + String(nxt.getTitle() || '').slice(0, 48));
    }
  } catch (e) { L.push('⚠ ' + e); }
  L.push('Full list in your e-mail 📧');
  return L.join('\n');
}

/* who is in / late / on leave / missing right now (today's attendance store) */
function attendanceStats_(data) {
  var att = store_(data, 'hydroPro_attendance', {}), emps = store_(data, 'hydroPro_employees', []);
  var t = att[day_(0)] || {};
  /* v3.5: shareholders / management are not on the biometric clock — never listed, and the report says who it skipped */
  var act = emps.filter(function (e) { return e && e.id && e.name && onClock_(e) && !/inactive|terminat|resign|separated/i.test(String(e.status || '')) && !e.separated; });
  var out = { total: act.length, inCount: 0, late: [], leave: [], missing: [], offClock: offClockNames_(emps) };
  var nm = function (e) { return String(e.name || e.id).slice(0, 30) + (e.dept ? ' (' + String(e.dept).slice(0, 12) + ')' : ''); };
  act.forEach(function (e) {
    var r = t[e.id];
    if (r && (r.status === 'present' || r.status === 'late')) {
      out.inCount++;
      if (r.status === 'late' || (Number(r.lateMinutes) || 0) > 0) out.late.push(nm(e) + (r.lateMinutes ? ' L' + r.lateMinutes : '') + (r.timeIn ? ' · in ' + r.timeIn : ''));
    } else if (r && /authorized|leave/i.test(String(r.status || ''))) out.leave.push(nm(e));
    else out.missing.push(nm(e));
  });
  out.late.sort(); out.missing.sort();
  return out;
}

function store_(data, key, fallback) {
  var v = data[key];
  if (v == null) return fallback;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return fallback; } }
  return v == null ? fallback : v;
}

function day_(offset) {
  return Utilities.formatDate(new Date(Date.now() + offset * 86400000), TZ, 'yyyy-MM-dd');
}

/* ---------------- sections ---------------- */

function buildBrief_(data, rc, mode) {
  if (mode === 'attendance') {
    var a = attendanceStats_(data);
    var list = function (arr, color) { return arr.length ? '<ul style="margin:4px 0;columns:2;">' + arr.map(function (x) { return '<li style="color:' + color + ';">' + esc_(x) + '</li>'; }).join('') + '</ul>' : '<div style="color:#777;">none</div>'; };
    return '<meta charset="UTF-8"><div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;">'
      + '<h2 style="margin:0 0 2px 0;">⏰ Attendance report — ' + esc_(rc.name) + '</h2>'
      + '<div style="color:#777;margin-bottom:14px;">' + Utilities.formatDate(new Date(), TZ, 'EEEE, d MMMM yyyy · HH:mm') + ' · Nexi</div>'
      + '<div style="font-size:18px;font-weight:bold;">' + a.inCount + ' / ' + a.total + ' punched in</div>'
      + h_('⏱', 'Late (' + a.late.length + ')') + list(a.late, '#e65100')
      + h_('🌴', 'On approved leave (' + a.leave.length + ')') + list(a.leave, '#2e7d32')
      + h_('❌', 'No punch yet (' + a.missing.length + ')') + list(a.missing, '#c62828')
      + (a.offClock && a.offClock.length ? '<div style="color:#777;font-size:12px;margin-top:8px;">👔 Not on the biometric clock by policy (' + a.offClock.length + '): ' + esc_(a.offClock.join(', ')) + '</div>' : '')
      + (rc.calendars && rc.calendars.length ? calendarSection_(rc.calendars) : '')
      + '<div style="color:#999;font-size:11px;margin-top:18px;">Punches come from the biometric clock through the cloud store. A person on the list who is on site should scan again; a person marked by hand in the app shows as punched.</div></div>';
  }
  var mk = {
    calendar:      function () { return calendarSection_(rc.calendars || []); },
    attendance:    function () { return attendanceSection_(data); },
    checklist:     function () { return checklistSection_(data); },
    calls:         function () { return callsSection_(data); },
    requests:      function () { return requestsSection_(data); },
    tasks:         function () { return tasksSection_(data); },
    release_queue: function () { return releaseQueueSection_(data); },
    my_calls:      function () { return myCallsSection_(data, rc); }
  };
  var s = (rc.sections || []).filter(function (k) { return mode !== 'morning' || k !== 'attendance'; }).map(function (k) { return mk[k] ? mk[k]() : ''; });
  /* Apple Mail renders the emoji as ������ without an explicit charset */
  return '<meta charset="UTF-8"><div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;">'
    + '<h2 style="margin:0 0 2px 0;">☀️ Good morning, ' + esc_(rc.name) + '</h2>'
    + '<div style="color:#777;margin-bottom:14px;">'
    + Utilities.formatDate(new Date(), TZ, 'EEEE, d MMMM yyyy · HH:mm') + ' · Nexi</div>'
    + s.join('')
    + '<div style="color:#999;font-size:11px;margin-top:18px;">Numbers come live from the cloud store every device syncs to. '
    + 'Open the app for detail: https://aba-pardes-monitoring.netlify.app</div></div>';
}

function h_(icon, title) {
  return '<h3 style="margin:16px 0 6px 0;border-bottom:1px solid #ddd;padding-bottom:3px;">' + icon + ' ' + title + '</h3>';
}
function entify_(html) {
  return String(html).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (m) {
    return '&#' + m.codePointAt(0) + ';';
  });
}
function esc_(x) {
  return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* v3.4: a calendar shared as "See only free/busy (hide details)", or shared but never
   accepted on the nexi account, still OPENS — getCalendarById returns it — and then hands
   back an empty event list. That is indistinguishable from a genuinely quiet day, so the
   brief printed "No events." for weeks while Eyal's personal calendar was full. A calendar
   that has nothing at all across a 60-day window is not quiet, it is mute: say so.
   The probe is cached per run — it costs one extra getEvents per calendar, not per day. */
var muteProbe_ = {};
function calMute_(id, cal) {
  if (muteProbe_.hasOwnProperty(id)) return muteProbe_[id];
  var mute = false;
  try {
    var now = new Date();
    var from = new Date(now.getTime() - 30 * 86400000), to = new Date(now.getTime() + 30 * 86400000);
    mute = cal.getEvents(from, to).length === 0;
  } catch (e) { mute = true; }
  muteProbe_[id] = mute;
  return mute;
}
var MUTE_MSG = ' \u2014 nexi can open this calendar but sees nothing in it. Set the share to '
             + '"See all event details" (not free/busy) and accept the share on the nexi account.';

/* 📅 TODAY and TOMORROW from every calendar (v3: the brief always shows both days); a calendar that cannot be read says so */
function calendarSection_(calIds) {
  var start = new Date(); start.setHours(0, 0, 0, 0);
  var mid = new Date(start.getTime() + 86400000), end = new Date(start.getTime() + 2 * 86400000);
  return calendarDay_(calIds, "Today's calendar · " + Utilities.formatDate(start, TZ, 'EEE d MMM'), start, mid)
       + calendarDay_(calIds, "Tomorrow · " + Utilities.formatDate(mid, TZ, 'EEE d MMM'), mid, end);
}
var unreadable_ = false;
function calendarDay_(calIds, title, start, end) {
  var out = [h_('📅', title)];
  var any = false;
  unreadable_ = false;
  (calIds || []).forEach(function (id) {
    try {
      /* an entry can be a calendar ID (an e-mail) or a calendar NAME
         (e.g. 'ABA PARDES - ADMIN') — named calendars are found among the
         calendars the nexi account has accepted */
      var cal = CalendarApp.getCalendarById(id);
      if (!cal) { var byName = CalendarApp.getCalendarsByName(id); if (byName && byName.length) cal = byName[0]; }
      if (!cal) { unreadable_ = true; out.push('<div style="color:#c62828;">' + esc_(id) + ' — not visible to nexi yet (share it with nexi@abapardes.com.ph, and accept the share on the nexi account)</div>'); return; }
      var evs = cal.getEvents(start, end);
      if (!evs.length) {
        if (calMute_(id, cal)) { unreadable_ = true; out.push('<div style="color:#c62828;">' + esc_(id) + esc_(MUTE_MSG) + '</div>'); }
        return;
      }
      any = true;
      out.push('<div style="font-weight:bold;margin-top:4px;">' + esc_(id) + '</div><ul style="margin:4px 0;">');
      evs.forEach(function (ev) {
        var when = ev.isAllDayEvent() ? 'all day'
          : Utilities.formatDate(ev.getStartTime(), TZ, 'HH:mm') + '–' + Utilities.formatDate(ev.getEndTime(), TZ, 'HH:mm');
        out.push('<li><b>' + when + '</b> ' + esc_(ev.getTitle())
          + (ev.getLocation() ? ' <span style="color:#777;">· ' + esc_(ev.getLocation()) + '</span>' : '') + '</li>');
      });
      out.push('</ul>');
    } catch (e) {
      out.push('<div style="color:#c62828;">' + esc_(id) + ' — could not be read: ' + esc_(e.message) + '</div>');
    }
  });
  if (!any) out.push('<div style="color:#777;">' + (unreadable_ ? 'Nothing on the calendars nexi can read — the ones marked in red above are invisible to it.' : 'No events.') + '</div>');
  return out.join('');
}
/* one key per real-world event: 09:00 + "CX901" collapses the flight however it was imported */
function dedupeKey_(when, title) {
  var t = String(title || '');
  var f = t.toUpperCase().match(/\b([A-Z]{2})\s?(\d{2,4})\b/);
  if (f) return when + '|' + f[1] + f[2];
  return when + '|' + t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
}

/* ⏰ punches so far this morning + who has nothing yet */
function attendanceSection_(data) {
  var att = store_(data, 'hydroPro_attendance', {});
  var emps = store_(data, 'hydroPro_employees', []);
  var today = att[day_(0)] || {};
  /* v3.5: same exclusion as the 07:15 report — this section used to list management too */
  var active = emps.filter(function (e) { return e && onClock_(e) && e.status !== 'inactive' && !e.separated; });
  var inCount = 0, late = 0, none = [];
  active.forEach(function (e) {
    var r = today[e.id];
    if (r && (r.status === 'present' || r.status === 'late')) { inCount++; if (r.status === 'late') late++; }
    else if (!r || r.status === 'pending') none.push(e.name || e.fullname || e.id);
  });
  var out = [h_('⏰', 'Attendance this morning')];
  out.push('<div><b>' + inCount + '</b> of ' + active.length + ' punched in so far'
    + (late ? ' · <span style="color:#e65100;">' + late + ' late</span>' : '') + '</div>');
  if (none.length) {
    out.push('<div style="color:#777;margin-top:3px;">No punch yet: '
      + none.slice(0, 15).map(esc_).join(', ') + (none.length > 15 ? ' +' + (none.length - 15) + ' more' : '') + '</div>');
  }
  out.push('<div style="color:#999;font-size:11px;">Punches reach Nexi through the clock report e-mail, so this can lag the door by a while.</div>');
  return out.join('');
}

/* 🌱 yesterday's checklist warnings/criticals per GH, from the day key */
function checklistSection_(data) {
  var st = store_(data, 'hydroPro_' + day_(-1), {});
  var rows = [];
  Object.keys(st).forEach(function (gh) {
    var g = st[gh]; if (!g || !g.statuses) return;
    var warn = 0, crit = 0;
    Object.keys(g.statuses).forEach(function (k) {
      if (g.statuses[k] === 'warn') warn++;
      if (g.statuses[k] === 'danger') crit++;
    });
    if (warn || crit) rows.push({ gh: gh, warn: warn, crit: crit });
  });
  var out = [h_('🌱', "Yesterday's checklist (" + day_(-1) + ')')];
  if (!rows.length) { out.push('<div style="color:#2e7d32;">No warnings or criticals flagged.</div>'); return out.join(''); }
  rows.sort(function (a, b) { return (b.crit * 10 + b.warn) - (a.crit * 10 + a.warn); });
  out.push('<ul style="margin:4px 0;">');
  rows.forEach(function (r) {
    out.push('<li><b>' + esc_(r.gh) + '</b>: '
      + (r.crit ? '<span style="color:#c62828;">' + r.crit + ' critical</span> ' : '')
      + (r.warn ? '<span style="color:#e65100;">' + r.warn + ' warning' + (r.warn > 1 ? 's' : '') + '</span>' : '') + '</li>');
  });
  out.push('</ul>');
  return out.join('');
}

/* 📞 open calls, criticals by name */
function callsSection_(data) {
  var iss = store_(data, 'hydroPro_issues_v2', []);
  var open = (Array.isArray(iss) ? iss : []).filter(function (i) {
    return i && !/closed|resolved|done|cancelled|approved/i.test(String(i.status || ''));
  });
  var crit = open.filter(function (i) { return /crit|urgent|high/i.test(String(i.severity || i.priority || '')); });
  var out = [h_('📞', 'Open calls')];
  out.push('<div><b>' + open.length + '</b> open'
    + (crit.length ? ' · <span style="color:#c62828;">' + crit.length + ' critical</span>' : '') + '</div>');
  crit.slice(0, 8).forEach(function (i) {
    out.push('<div style="color:#c62828;">• ' + esc_(i.title || i.subject || i.desc || i.issue || '(untitled)')
      + (i.gh || i.location ? ' <span style="color:#777;">· ' + esc_(i.gh || i.location) + '</span>' : '') + '</div>');
  });
  return out.join('');
}

/* 🛒 item requests waiting for someone to act */
function requestsSection_(data) {
  var out = [h_('🛒', 'Item requests waiting')];
  var waiting = [];
  ['hydroPro_prj15_reqs_v1', 'hydroPro_prj16_reqs_v1', 'hydroPro_inv_requests_v1'].forEach(function (k) {
    var arr = store_(data, k, []);
    (Array.isArray(arr) ? arr : []).forEach(function (r) {
      if (r && /SUBMITTED|PENDING/i.test(String(r.status || ''))) {
        waiting.push((r.no || r.id || '?') + (r.purpose ? ' — ' + r.purpose : ''));
      }
    });
  });
  if (!waiting.length) { out.push('<div style="color:#2e7d32;">Nothing waiting for approval.</div>'); }
  else {
    out.push('<ul style="margin:4px 0;">');
    waiting.slice(0, 10).forEach(function (w) { out.push('<li>' + esc_(w) + '</li>'); });
    out.push('</ul>');
    if (waiting.length > 10) out.push('<div style="color:#777;">+' + (waiting.length - 10) + ' more</div>');
  }
  return out.join('');
}

/* 📦 approved requests waiting for the warehouse to release */
function releaseQueueSection_(data) {
  var out = [h_('📦', 'Approved — waiting for release')];
  var q = [];
  ['hydroPro_prj15_reqs_v1', 'hydroPro_prj16_reqs_v1', 'hydroPro_inv_requests_v1'].forEach(function (k) {
    var arr = store_(data, k, []);
    (Array.isArray(arr) ? arr : []).forEach(function (r) {
      if (r && /^APPROVED$/i.test(String(r.status || ''))) {
        q.push((r.no || r.id || '?')
          + (r.gh ? ' → ' + r.gh : '')
          + (r.purpose ? ' — ' + r.purpose : ''));
      }
    });
  });
  if (!q.length) { out.push('<div style="color:#2e7d32;">Nothing approved is waiting — the queue is clear.</div>'); }
  else {
    out.push('<ul style="margin:4px 0;">');
    q.slice(0, 12).forEach(function (w) { out.push('<li>' + esc_(w) + '</li>'); });
    out.push('</ul>');
    if (q.length > 12) out.push('<div style="color:#777;">+' + (q.length - 12) + ' more</div>');
  }
  return out.join('');
}

/* 📋 open calls assigned to this person */
function myCallsSection_(data, rc) {
  var out = [h_('📋', 'Your open calls')];
  if (!rc.match) { out.push('<div style="color:#777;">No name pattern configured.</div>'); return out.join(''); }
  var iss = store_(data, 'hydroPro_issues_v2', []);
  var mine = (Array.isArray(iss) ? iss : []).filter(function (i) {
    if (!i || /closed|resolved|done|cancelled|approved/i.test(String(i.status || ''))) return false;
    var who = [i.assignee, i.assignedTo].concat(Array.isArray(i.assignees) ? i.assignees : []).join(' ');
    return rc.match.test(who);
  });
  if (!mine.length) { out.push('<div style="color:#2e7d32;">Nothing assigned to you is open.</div>'); }
  else {
    out.push('<ul style="margin:4px 0;">');
    mine.slice(0, 10).forEach(function (i) {
      out.push('<li>' + esc_(i.title || i.subject || i.desc || i.issue || '(untitled)')
        + (i.gh || i.location ? ' <span style="color:#777;">· ' + esc_(i.gh || i.location) + '</span>' : '') + '</li>');
    });
    out.push('</ul>');
  }
  return out.join('');
}

/* 📋 tasks, commitments and Nexi-diary events from the EA desk */
function tasksSection_(data) {
  var out = [h_('📋', 'Your tasks & commitments')];
  var today = day_(0), soon = day_(7), any = false;

  /* EA delegated tasks: open ones, overdue first */
  var tasks = store_(data, 'hydroPro_ea_tasks_v1', []);
  var openT = (Array.isArray(tasks) ? tasks : []).filter(function (k) {
    return k && k.status !== 'done' && k.status !== 'completed' && k.status !== 'cancelled';
  });
  openT.sort(function (a, b) { return String(a.due || '9999') < String(b.due || '9999') ? -1 : 1; });
  if (openT.length) {
    any = true;
    out.push('<ul style="margin:4px 0;">');
    openT.slice(0, 10).forEach(function (k) {
      var due = k.due ? String(k.due).slice(0, 10) : '';
      var overdue = due && due < today;
      out.push('<li>' + (overdue ? '<span style="color:#c62828;font-weight:bold;">OVERDUE</span> ' : '')
        + esc_(k.title || k.name || k.text || k.task || '(untitled)')
        + (due ? ' <span style="color:#777;">- due ' + esc_(due) + '</span>' : '') + '</li>');
    });
    out.push('</ul>');
    if (openT.length > 10) out.push('<div style="color:#777;">+' + (openT.length - 10) + ' more open tasks</div>');
  }

  /* commitments falling due in the next 7 days */
  var cms = store_(data, 'hydroPro_ea_commitments_v1', []);
  var dueCms = (Array.isArray(cms) ? cms : []).filter(function (c) {
    return c && c.status === 'open' && c.due && String(c.due).slice(0, 10) <= soon;
  });
  dueCms.sort(function (a, b) { return String(a.due) < String(b.due) ? -1 : 1; });
  if (dueCms.length) {
    any = true;
    out.push('<div style="font-weight:bold;margin-top:6px;">Commitments due this week</div><ul style="margin:4px 0;">');
    dueCms.slice(0, 8).forEach(function (c) {
      var due = String(c.due).slice(0, 10);
      out.push('<li>' + (due < today ? '<span style="color:#c62828;font-weight:bold;">OVERDUE</span> ' : '')
        + esc_(c.title || c.what || c.text || '(untitled)')
        + (c.who ? ' <span style="color:#777;">- ' + esc_(c.who) + '</span>' : '')
        + ' <span style="color:#777;">- ' + esc_(due) + '</span></li>');
    });
    out.push('</ul>');
  }

  /* events written in Nexi's own diary for today (works even before the
     Google calendar is shared) */
  var evs = store_(data, 'hydroPro_ea_events_v1', []);
  var todayEv = (Array.isArray(evs) ? evs : []).filter(function (ev) {
    return ev && ev.start && String(ev.start).slice(0, 10) === today;
  });
  if (todayEv.length) {
    any = true;
    out.push('<div style="font-weight:bold;margin-top:6px;">In Nexi\u2019s diary today</div><ul style="margin:4px 0;">');
    todayEv.forEach(function (ev) {
      var tm = String(ev.start).length > 10 ? String(ev.start).slice(11, 16) : '';
      out.push('<li>' + (tm ? '<b>' + esc_(tm) + '</b> ' : '') + esc_(ev.title || ev.name || '(untitled)') + '</li>');
    });
    out.push('</ul>');
  }

  if (!any) out.push('<div style="color:#777;">No open tasks, due commitments or diary events yet - '
    + 'this reads from the Executive Assistant desk in Nexi, so anything logged there appears here.</div>');
  return out.join('');
}

/* =====================================================================================================
   v4.0 — EACH USER'S MORNING BRIEF, by e-mail and WhatsApp, from the 🧭 Assistant cards (14 Oct 2026)
   -----------------------------------------------------------------------------------------------------
   Every 15 minutes nexiUserBriefTick:
     1. reads the user list, the Nexi Assistant profiles and the permissions snapshot the app publishes
        (a light pull: three stores + one small "test request" key per person);
     2. finds who is due — their own briefing time (📣 Briefings & Voice, after quiet hours) has come, it is one
        of their work days, it is before 11:00, and they have not had today's brief yet;
     3. only then downloads the stores a brief needs (tasks, calls, issues, meetings, calendar, notices, heads,
        memos for the accountant's ① count — never payroll, loyalty, invoices, attendance or employees), builds
        each person's own brief and sends it: e-mail to the @abapardes.com.ph work address, WhatsApp through
        CallMeBot when WA_<USERNAME> is set in Script properties and the card allows WhatsApp;
     4. writes the delivery log Nexi shows (nexibrief_log_v1: states and times only — no addresses, no
        numbers, no keys, no task titles) and mails eyal@ once a day when something was not delivered.
   Owner switch: Script property USER_BRIEF = on (send) · dry or absent (trial: log "would send", send
   nothing) · off (stop). The leadership briefs above never depend on it.
   The tick never sends a leadership brief, never sends the per-user brief to Eyal, Dr Amy or Chen (they
   get the 06:00 / 07:15 briefs), and a person's brief holds only what that person may see in Nexi: the
   module list and the pay permission come from the snapshot an administrator's Nexi publishes
   (nexibrief_scope_v1), so this script never re-implements the app's permission rules.
   ===================================================================================================== */

var UB_VERSION = '4.0';
var APP_URL = 'https://aba-pardes-monitoring.netlify.app/';
var CUTOFF = '11:00';                 /* a daily brief not sent by 11:00 Manila is logged 'missed' and not sent that day */
var TIME_BUDGET_MS = 270000;          /* no new person after 4.5 min (Apps Script stops a run at 6); the next tick resumes */
var MAX_MAILS_PER_DAY = 400;          /* this script's own cap (USER_BRIEF_MAX_MAILS overrides); the Workspace quota is 1,500 */
var WA_URL_MAX = 1900;                /* bytes of one whole CallMeBot URL (UrlFetchApp refuses a URL over 2 KB) */
var WA_PART_SLEEP = 2000, WA_USER_SLEEP = 1000;
var TEST_GAP_MIN = 30, TEST_MAX_PER_DAY = 4, TEST_MAX_AGE_H = 24;
/* review fix: "own user only" for a test request is enforced by the APP (any signed-in session can write any request key),
   so the server also caps ALL test briefs together per day — e-mail and WhatsApp (USER_BRIEF_MAX_TESTS overrides) */
var TEST_MAX_ALL_PER_DAY = 15;
var WA_DEADLINE_MS = 300000;          /* no WhatsApp (or WhatsApp part) is started after 5 min — the next tick sends it */
/* review fix: 2 days (was 3) — and an administrator's Nexi now republishes the snapshot within seconds of an access change */
var LOG_DAYS = 7, SCOPE_MAX_AGE_D = 2;
var PULL_URL_MAX = 1900;              /* every /sync/pull?keys= URL stays under the same 2 KB limit */
/* review fix: 10 (was 25) — every 15-minute tick from 05:00 to 12:00 writes the log, so one late tick never shows
   "engine not running" in Nexi (the app allows 50 minutes in the morning, 230 the rest of the day) */
var LOG_BEAT_MIN_DAY = 10, LOG_BEAT_MIN_NIGHT = 170;
var FAIL_TO = 'eyal@abapardes.com.ph';
var ENGINE_OWNER = 'nexi@abapardes.com.ph';   /* the only account whose 15-minute timer may send (installUserBriefs checks it) */
var COMPANY_RX = /^[^@\s]+@abapardes\.com\.ph$/i;
var SKIP_USER_RX = /^(admin|system|test.*|demo.*)$/i;
/* review fix: the three leaders are known by USERNAME only (or by their own leadership mailbox, RECIPIENTS to / cc) — never
   by a pattern on a full name: "Iris Ben Ari" or "Amy Santos" are staff, get their own brief and never Eyal's / Dr Amy's key */
var LEGACY_USERS = { eyal: 'Eyal', amy: 'Dr Amy', dramy: 'Dr Amy', amyp: 'Dr Amy', chen: 'Chen', cheriet: 'Chen' };
/* a leader's own mailboxes: RECIPIENTS to / cc and the personal calendars in their row (never nexi@ or a shared calendar) */
function leaderOwn_(rc) {
  return [rc.to, rc.cc].concat(rc.calendars || []).map(lc_).filter(function (a) {
    return a.indexOf('@') > 0 && a !== ENGINE_OWNER && !/calendar\.google\.com$/.test(a);
  });
}
/* the app's hnxPaySensitiveAllowed name list — the permissions snapshot can only NARROW pay, never widen it beyond this */
var PAY_NAMES_RX = /jinky|pagtama|\beyal\b|benari|ben[ ._-]?ari|\bamy\b|patdu/i;
/* an amount, in any spelling seen in Nexi: ₱, PHP / Php (alone or glued: PHP1500, Php500, 500php), P5000 / P 2000 (3+ digits,
   so pools P1–P10 stay), comma thousands (1,250 · P12,450), two decimals (727.27 · 850.00), 25k, pesos, $ / USD / EUR,
   and the words salary / payroll / loyalty. Used for the e-mail of a person without the pay permission AND for WhatsApp. */
var MONEY_RX = /₱|\bPHP\b|\bPHP\s?\d|\bP\s?\d{3,}|\d\s?(php|pesos?)\b|\bpesos?\b|\bsalar(y|ies)\b|\bpayroll\b|\bloyalty\b|\d{1,3}(,\d{3})+(\.\d{1,2})?|\b\d+\.\d{2}\b|\b\d+(\.\d+)?\s?k\b|\$\s?\d|\b(usd|eur)\s?\d|\d\s?(usd|eur)\b/i;
/* WhatsApp is stricter still: also any 5-digit figure (15000 · 13th month 25000), and a 3-digit figure on a line that speaks
   about money (Allowance 1500 · Advance 800). "Send BIR 2316", "Order 3 bags", "GH10", "PRJ15 MX1012", "09:00" stay. */
var MONEY_WORD_RX = /\b(pay|paid|payment|deposit|collect(ion)?|refund|advance|budget|cost|price|amount|balance|bill|loan|cash|allowance|deduct(ion|ed)?s?|bonus|subsidy|wages?|fees?|fine|penalty|incentive|commission|reimburs\w*|ot|overtime|13th)\b/i;
function isMoney_(s) { return MONEY_RX.test(String(s == null ? '' : s)); }
function isMoneyWa_(s) {
  s = String(s == null ? '' : s);
  return MONEY_RX.test(s) || /\b\d{5,}\b/.test(s) || (MONEY_WORD_RX.test(s) && /\b\d{3,}\b/.test(s));
}
/* a notice made from a memo, payroll or loyalty step never shows its title on WhatsApp (a memo title is free text) */
var WA_COUNT_ONLY_RX = /^memo:|payroll|loyal/i;
var UB_LOG_KEY = 'nexibrief_log_v1', UB_SCOPE_KEY = 'nexibrief_scope_v1', UB_REQ_PREFIX = 'nexibrief_req_';
var UB_LIGHT_KEYS = ['hydroPro_users', 'hydroPro_pa_profiles_v1', UB_SCOPE_KEY];
var UB_DATA_KEYS = ['hydroPro_tasks_v1', 'hydroPro_calls', 'hydroPro_issues_v2', 'hydroPro_meetings_v1', 'hydroPro_cal_events_v2',
                    'hydroPro_pa_inbox_v1', 'hydroPro_dept_heads_v1', 'hydroPro_memos', 'hydroPro_memo_approvers_v1'];
var UB_BASE_MODS = ['overview', 'tasks', 'assistant'];      /* what everybody has in Nexi */
var UB_FROM_NAME = 'Nexi · HydroNexis-AI';

/* ---------------- entry points ---------------- */

/** Run ONCE after pasting v4 (▶ Run), signed in as nexi@abapardes.com.ph. Adds the 15-minute timer, sends nothing to
    staff, mails eyal@ the setup check. Run from any other account it installs nothing and says so (review fix: the
    engine's "already sent today" memory is per account, so a second account's timer would send every brief twice). */
function installUserBriefs() {
  var who = '';
  try { who = ubWhoAmI_(); } catch (e) { who = ''; }
  if (who && who !== ENGINE_OWNER) {
    ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'nexiUserBriefTick') ScriptApp.deleteTrigger(t); });
    ubUP_().deleteProperty('ub_owner');
    return 'STOPPED — this account is ' + who + '. Nothing was installed or sent. Sign in to script.google.com as '
      + ENGINE_OWNER + ', open this project and run installUserBriefs again.';
  }
  ubSet_('ub_owner', who || ENGINE_OWNER);
  ensureTrigger_();
  var lock = LockService.getScriptLock(), got = false;
  try { got = lock.tryLock(30000); } catch (e) {}
  var r;
  try { r = ubRun_({ setupCheck: true }); }
  catch (e) { r = { mode: ubMode_(), users: [], err: scrubWhy_(e, '', '', 200) }; }
  finally { if (got) { try { lock.releaseLock(); } catch (e) {} } }
  ubSetupMail_(r);
  return 'setup check sent to ' + FAIL_TO + ' · ' + (r.users || []).length + ' users · mode ' + r.mode + (r.err ? ' · ERROR ' + r.err : '');
}

/* which account runs this script — read from a draft that is deleted at once (the Gmail permission the script already
   has; asking the Session service would need a new one). Nothing is sent. */
function ubWhoAmI_() {
  var d = null;
  try {
    d = GmailApp.createDraft(FAIL_TO, 'Nexi setup check (draft — deleted at once)', 'Deleted at once.');
    var f = String(d.getMessage().getFrom() || ''), m = /[^\s<>"'(),;:]+@[^\s<>"'(),;:]+/.exec(f);
    return m ? lc_(m[0]) : '';
  } finally { if (d) { try { d.deleteDraft(); } catch (e) {} } }
}

/** The 15-minute trigger. It sends only in the account installUserBriefs confirmed (nexi@). */
function nexiUserBriefTick() {
  if (!ubGet_('ub_owner')) return { skipped: 'run installUserBriefs as ' + ENGINE_OWNER + ' first' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { skipped: 'another run is busy' };
  try { return ubRun_({}); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function ubRun_(opts) {
  opts = opts || {};
  var t0 = Date.now(), M = manila_(new Date()), mode = ubMode_(), setup = !!opts.setupCheck;
  var res = { mode: mode, setupCheck: setup, day: M.day, hm: M.hm, users: [], due: [], sentTo: [], mails: 0, was: 0,
              tests: 0, missed: 0, bounced: 0, summary: false, pushed: false, err: '' };
  var L, users = [], R = {}, data = null, scopeAgeD = null, deadline = t0 + WA_DEADLINE_MS;
  try {
    ubCleanup_(M);
    /* review fix: remember since when USER_BRIEF is on — a channel is only 'missed' when the engine was on before 11:00 */
    if (!setup) {
      if (mode === 'on') { if (!ubGet_('ub_on_since')) ubSet_('ub_on_since', M.ms); }
      else ubUP_().deleteProperty('ub_on_since');
    }
    if (mode === 'off' && !setup) {                     /* switched off: only say so in Nexi */
      res.pushed = pushLog_(buildLog_([], M, mode, {}), M, false);
      ubSet_('ub_err', 0);
      return res;
    }
    L = ubPull_(UB_LIGHT_KEYS);
    users = candidates_(L, M);
    res.users = users;
    var sc = ubScope_(L, M);
    scopeAgeD = sc.ageD == null ? null : Math.round(sc.ageD * 10) / 10;
    if (!setup) R = ubPull_(users.map(function (u) { return UB_REQ_PREFIX + keyUser_(u.username); }));
  } catch (e) {
    ubEngineFail_(e, M); res.err = scrubWhy_(e, '', '', 200);
    if (setup) throw e;
    return res;
  }
  if (setup) {                                          /* the setup check: a dry look, no sends, no day states */
    try { res.pushed = pushLog_(buildLog_(users, M, mode, { scopeAgeD: scopeAgeD }), M, true); }
    catch (e) { res.err = 'log: ' + scrubWhy_(e, '', '', 160); }
    return res;
  }
  var due = users.filter(function (u) { return !u.legacy && u.sendable && dueNow_(u, M) && !doneToday_(u, M.day, mode); });
  var tests = [];
  try { tests = ubTests_(R, users, M); } catch (e) { tests = []; }
  res.due = due.map(function (u) { return u.username; });
  if (due.length || tests.length) {
    try {
      data = ubPull_(UB_DATA_KEYS.concat(['hydroPro_' + ymdAdd_(M.day, -1)]));
      data.hydroPro_users = L.hydroPro_users;
    } catch (e) { ubEngineFail_(e, M); res.err = scrubWhy_(e, '', '', 200); return res; }
  }
  /* test requests first — they are what a person is waiting for, with Nexi open. The request is recorded as handled
     BEFORE it is sent (review fix), so a run that Apps Script stops half-way never sends the same test twice. */
  tests.forEach(function (t) {
    if (Date.now() - t0 >= TIME_BUDGET_MS) return;
    var H = t.H, now = new Date().toISOString(), id = String(t.req.id);
    H.ids = arr_(H.ids).concat([id]).slice(-20);
    H.at = arr_(H.at).concat([now]).slice(-10);
    H.last = { id: id, at: now, s: 'sending' };
    ubSet_('ubt|' + t.u.username, H);
    var out = sendOne_(t.u, data, M, { test: true, mode: mode, deadline: deadline });
    H.last = { id: id, at: now, s: 'done', e: chOut_(out.e), w: chOut_(out.w) };
    ubSet_('ubt|' + t.u.username, H);
    res.tests++;
  });
  due.forEach(function (u) {
    if (Date.now() - t0 >= TIME_BUDGET_MS) return;        /* the next tick carries on */
    var out = sendOne_(u, data, M, { mode: mode, deadline: deadline });
    if (out.e && out.e.s === 'sent') res.mails++;
    if (out.w && (out.w.s === 'sent' || out.w.s === 'unconfirmed')) res.was++;
    res.sentTo.push(u.username);
  });
  /* the engine did its morning work today: it ran, switched on, at or after the first person's brief time and before 11:00 */
  var firstEff = users.filter(function (u) { return !u.legacy && u.sendable && u.days.indexOf(M.dow) >= 0; })
    .map(function (u) { return u.eff; }).sort()[0] || '05:00';
  if (mode === 'on' && M.hm < CUTOFF && M.hm >= firstEff) ubSet_('ub_am|' + M.day, 1);
  /* review fix: 'missed' only when the engine really failed this morning — USER_BRIEF was on before 11:00 and no tick
     ran before 11:00. Switching on, or setting a person up, after 11:00 is not a miss: their first brief is tomorrow. */
  var onSince = Number(ubGet_('ub_on_since', 0)) || 0, cutMs = Date.parse(M.day + 'T' + CUTOFF + ':00+08:00');
  if (M.hm >= CUTOFF && mode === 'on' && onSince && onSince < cutMs && !ubGet_('ub_am|' + M.day)) {
    var at = new Date().toISOString();
    users.forEach(function (u) {
      if (u.legacy || !u.sendable || u.days.indexOf(M.dow) < 0) return;
      var k = 'ub|' + M.day + '|' + u.username, r = ubGet_(k) || {}, ch = false;
      if (u.mail.ok && (!r.e || r.e.s === 'dry')) { r.e = { s: 'missed', at: at, why: 'not sent before ' + CUTOFF }; ch = true; }
      if (u.wa.ok && (!r.w || r.w.s === 'dry')) { r.w = { s: 'missed', at: at, why: 'not sent before ' + CUTOFF }; ch = true; }
      if (ch) { r.k = 'brief'; ubSet_(k, r); res.missed++; }
    });
  }
  try { res.bounced = checkBounces_(M); } catch (e) {}
  try { res.summary = summary_(M, users, mode); } catch (e) {}
  try { res.pushed = pushLog_(buildLog_(users, M, mode, { scopeAgeD: scopeAgeD }), M, false); }
  catch (e) { res.err = 'log: ' + scrubWhy_(e, '', '', 160); ubEngineFail_(new Error(res.err), M); }   /* review fix: told after 3 */
  if (!res.err) { ubSet_('ub_err', 0); ubSet_('ub_lastok', new Date().toISOString()); }
  return res;
}

/* ---------------- who gets it: the same reading of the card and profile as the app ---------------- */

function candidates_(L, M) {
  var users = arr_(ubParse_(L.hydroPro_users, [])), profs = ubParse_(L.hydroPro_pa_profiles_v1, {}), SP = ubSP_();
  var sc = ubScope_(L, M), out = [];
  if (!profs || typeof profs !== 'object' || Array.isArray(profs)) profs = {};
  var live = users.filter(function (u) { return !!u && !!u.username && u.active !== false && u.disabled !== true; });
  var cardOf = function (u) { return (u.assistant && typeof u.assistant === 'object') ? u.assistant : {}; };
  /* review fix: who already "owns" an address — every active user's 🧭 card / Users e-mail, and every leadership mailbox
     or calendar (RECIPIENTS). An HR / snapshot e-mail that belongs to someone else is never used: that person would read
     this person's brief, and nexi@ would read THEIR calendar for it. */
  var claimed = {};
  var claim = function (a, who) { a = lc_(a); if (a.indexOf('@') > 0) { claimed[a] = claimed[a] || {}; claimed[a][who] = 1; } };
  live.forEach(function (u) { var c = cardOf(u); claim(c.workEmail, lc_(u.username)); claim(u.email, lc_(u.username)); });
  RECIPIENTS.forEach(function (rc) { [rc.to, rc.cc].concat(rc.calendars || []).forEach(function (a) { claim(a, '#leader'); }); });
  var byOther = function (a, un) { var c = claimed[lc_(a)]; if (!c) return false; for (var k in c) if (c.hasOwnProperty(k) && k !== un) return true; return false; };
  live.forEach(function (u) {
    var un = lc_(u.username);
    if (SKIP_USER_RX.test(un)) return;
    var c = cardOf(u);
    var A = (c.authority && typeof c.authority === 'object') ? c.authority : {}, pf = (c.prefs && typeof c.prefs === 'object') ? c.prefs : {};
    var pr = (profs[un] && typeof profs[un] === 'object') ? profs[un] : {};
    var has = function (k) { return Object.prototype.hasOwnProperty.call(pr, k); };
    var sU = (sc.users[un] && typeof sc.users[un] === 'object') ? sc.users[un] : null;
    /* the work e-mail: the FIRST @abapardes.com.ph address of the 🧭 card, the Users e-mail and the HR employee e-mail the app
       resolved (review fix: a personal address in Users no longer hides the company one on the HR record). Nothing else is used. */
    var cand = [[String(c.workEmail || '').trim(), 'card'], [String(u.email || '').trim(), 'user'], [String((sU && sU.mail) || '').trim(), 'hr']];
    var addr = '', from = '', hrTaken = false;
    for (var i = 0; i < cand.length && !addr; i++) {
      if (!COMPANY_RX.test(cand[i][0])) continue;
      if (cand[i][1] === 'hr' && byOther(cand[i][0], un)) { hrTaken = true; continue; }
      addr = cand[i][0]; from = cand[i][1];
    }
    if (!addr) for (var j = 0; j < 2 && !addr; j++) if (cand[j][0]) { addr = cand[j][0]; from = cand[j][1]; }   /* shown red in Nexi, never used */
    /* profile() in the app: card prefs with defaults, then every key the person saved overrides */
    var paused = (has('pausedAll') ? pr.pausedAll : false) === true;
    var t = hmNorm_(has('briefTime') ? pr.briefTime : (pf.briefTime || '07:00')) || '07:00';
    var qf = hmNorm_(has('quietFrom') ? pr.quietFrom : (pf.quietFrom || '21:00'));
    var qt = hmNorm_(has('quietTo') ? pr.quietTo : (pf.quietTo || '06:00'));
    var wd = has('workDays') ? pr.workDays : pf.workDays, days = [];
    if (Array.isArray(wd)) wd.forEach(function (d) { d = Number(d); if (d >= 0 && d <= 6 && days.indexOf(d) < 0) days.push(d); });
    if (!days.length) days = [1, 2, 3, 4, 5, 6];
    var eff = inQuiet_(qf, qt, t) ? (qt || t) : t;
    if (eff < '05:00') eff = '05:00';
    if (eff > '10:00') eff = '10:00';
    var fullName = String(u.fullname || u.fullName || u.name || un);
    /* a leader: by username (eyal / amy / dramy / amyp / chen / cheriet), or by one of their own mailboxes on this person's card or
       Users record. Only the username match borrows the leadership WhatsApp key (WA_EYAL / WA_AMY / WA_CHEN) — never a name pattern. */
    var legacy = LEGACY_USERS.hasOwnProperty(un) ? LEGACY_USERS[un] : '', legacyProp = '';
    if (legacy) RECIPIENTS.forEach(function (rc) { if (rc.name === legacy) legacyProp = rc.waKeyProp || ''; });
    else [c.workEmail, u.email].forEach(function (a) {
      a = lc_(a); if (!a || legacy) return;
      RECIPIENTS.forEach(function (rc) { if (!legacy && leaderOwn_(rc).indexOf(a) >= 0) legacy = rc.name; });
    });
    var mail = { addr: addr, from: from, ok: false, why: '' };
    if (!COMPANY_RX.test(addr)) mail.why = hrTaken ? 'shared-email' : 'no-company-email';
    else if (A.sendMail === false) mail.why = 'card-off';
    else if (paused) mail.why = 'paused';
    else mail.ok = true;
    var prop = waPropName_(un), raw = String(SP.getProperty(prop) || '');
    if (!raw && legacyProp) { raw = String(SP.getProperty(legacyProp) || ''); if (raw) prop = legacyProp; }
    var mm = /^\s*\+?([\d\s-]{8,20})\s*\|\s*(\S+)\s*$/.exec(raw);
    var wa = { prop: waPropName_(un), keyProp: prop, ok: false, why: '' };
    if (!mm) wa.why = 'no-key';
    else if (A.sendWhatsApp !== true) wa.why = 'card-off';
    else if (paused) wa.why = 'paused';
    else { wa.ok = true; wa.phone = mm[1].replace(/\D/g, ''); wa.key = mm[2]; }
    /* review fix: the snapshot can only NARROW — pay only for the names the app itself allows (hnxPaySensitiveAllowed) */
    var full = !!(sc.fresh && sU);
    var scope = full ? { full: true, mods: arr_(sU.m).map(String), pay: sU.pay === true && PAY_NAMES_RX.test(un + ' ' + fullName), note: '' }
      : { full: false, mods: UB_BASE_MODS.slice(), pay: false,
          note: 'Module alerts are off until an administrator opens Nexi (' + (sc.ageD == null ? 'no permissions snapshot yet'
            : !sc.byOk ? 'the permissions snapshot was not published by an administrator'
            : (!sU ? 'you are not in the permissions snapshot yet' : 'permissions snapshot is ' + Math.floor(sc.ageD) + ' days old')) + ').' };
    var words = fullName.split(/\s+/).filter(Boolean), first = words[0] || un;
    if (/^(dr|dra|mr|mrs|ms|engr|atty)\.?$/i.test(first) && words[1]) first = words[1];
    out.push({ username: un, name: fullName, first: first, legacy: legacy, legacyProp: legacyProp, mail: mail, wa: wa,
               sendable: mail.ok || wa.ok, t: t, eff: eff, days: days, paused: paused, scope: scope,
               card: c, assigned: (c.assigned && typeof c.assigned === 'object') ? c.assigned : {} });
  });
  /* review fix: two usernames that give the same Script property name (mark.d / mark_d → WA_MARK_D) would send one
     person's brief to the other's phone — neither gets WhatsApp until one is renamed */
  var n = {};
  out.forEach(function (x) { n[x.wa.prop] = (n[x.wa.prop] || 0) + 1; });
  out.forEach(function (x) {
    if (n[x.wa.prop] > 1) { x.wa = { prop: x.wa.prop, keyProp: x.wa.prop, ok: false, why: 'key-name-clash' }; x.sendable = x.mail.ok; }
  });
  return out;
}

function inQuiet_(f, q, t) { if (!f || !q || f === q) return false; return f < q ? (t >= f && t < q) : (t >= f || t < q); }
function dueNow_(u, M) { return u.days.indexOf(M.dow) >= 0 && M.hm >= u.eff && M.hm < CUTOFF; }
/* a channel is finished for the day when it was sent, answered, bounced, skipped or missed; a dry entry only while
   the switch stays on dry (switching on the same morning still sends); a failure is retried once; 'sending' = a run
   stopped in the middle of the WhatsApp call — never re-sent (it may have arrived), shown as not confirmed */
function chDone_(st, mode) {
  if (!st || !st.s) return false;
  if (st.s === 'dry') return mode !== 'on';
  if (st.s === 'failed') return (st.n || 1) >= 2;
  return true;
}
function doneToday_(u, day, mode) {
  var r = ubGet_('ub|' + day + '|' + u.username) || {};
  return (!u.mail.ok || chDone_(r.e, mode)) && (!u.wa.ok || chDone_(r.w, mode));
}

/* review fix: the snapshot counts only when its writer ("by") is an active administrator on the roster */
function ubScope_(L, M) {
  var s = ubParse_(L[UB_SCOPE_KEY], null), at = s && s.at ? Date.parse(s.at) : NaN;
  var ageD = isFinite(at) ? Math.max(0, (M.ms - at) / 86400000) : null, by = lc_(s && s.by);
  var byOk = !!by && arr_(ubParse_(L.hydroPro_users, [])).some(function (u) {
    return !!u && lc_(u.username) === by && u.active !== false && u.disabled !== true && (u.role === 'admin' || u.role === 'admin_secondary');
  });
  return { users: (byOk && s.users && typeof s.users === 'object') ? s.users : {}, ageD: ageD, byOk: byOk,
           fresh: byOk && ageD != null && ageD <= SCOPE_MAX_AGE_D };
}

/* ---------------- "📨 Send me a test brief" requests (written by the app, read here, never written here) ---------------- */

function ubTestCap_() { var n = parseInt(ubSP_().getProperty('USER_BRIEF_MAX_TESTS'), 10); return n > 0 ? n : TEST_MAX_ALL_PER_DAY; }
function ubTests_(R, users, M) {
  var byKey = {}, valid = [], allKey = 'ubt_all|' + M.day, all = Number(ubGet_(allKey, 0)) || 0, cap = ubTestCap_();
  users.forEach(function (u) { byKey[keyUser_(u.username)] = u; });
  Object.keys(R || {}).sort().forEach(function (k) {
    if (k.indexOf(UB_REQ_PREFIX) !== 0) return;
    var ku = k.slice(UB_REQ_PREFIX.length), req = ubParse_(R[k], null), u = byKey[ku];
    if (!u || !req || typeof req !== 'object' || !req.id) return;
    var H = ubGet_('ubt|' + u.username) || {}, id = String(req.id).slice(0, 60);
    H.ids = arr_(H.ids); H.at = arr_(H.at);
    if (H.ids.indexOf(id) >= 0) return;                 /* already handled */
    var refuse = function (why) {
      H.ids = H.ids.concat([id]).slice(-20);
      H.last = { id: id, at: new Date().toISOString(), s: 'refused', why: why };
      ubSet_('ubt|' + u.username, H);
    };
    /* NOTE: "own user only" is really enforced by the app (only the signed-in person's key is written); every session may
       write any key, so this check is a plausibility check and the daily cap below bounds what a forged request can do */
    if (keyUser_(req.user) !== ku || keyUser_(req.by) !== ku) return refuse('own user only');
    var at = Date.parse(req.at);
    if (!isFinite(at) || M.ms - at > TEST_MAX_AGE_H * 3600000) return refuse('request expired (over 24 h old)');
    if (!u.sendable) return refuse('not set up: ' + (u.mail.why || u.wa.why));
    var times = H.at.map(function (a) { return Date.parse(a); }).filter(function (x) { return isFinite(x); });
    var last = times.length ? Math.max.apply(null, times) : 0;
    if (last && M.ms - last < TEST_GAP_MIN * 60000) return refuse('wait 30 minutes between tests');
    var today = times.filter(function (x) { return Utilities.formatDate(new Date(x), TZ, 'yyyy-MM-dd') === M.day; }).length;
    if (today >= TEST_MAX_PER_DAY) return refuse('4 tests today already');
    if (all >= cap) return refuse('daily test limit (' + cap + ' for everyone) reached — try tomorrow');
    all++; ubSet_(allKey, all);
    valid.push({ u: u, req: { id: id }, H: H });
  });
  return valid;
}

/* ---------------- one person: build, send, record — a failure here never stops the others ---------------- */

function sendOne_(u, data, M, o) {
  o = o || {};
  var test = !!o.test, dry = !test && o.mode !== 'on', at = new Date().toISOString(), deadline = o.deadline || 0;
  var k = 'ub|' + M.day + '|' + u.username, rec = test ? {} : (ubGet_(k) || {}), out = {};
  var wantE = u.mail.ok && (test || !chDone_(rec.e, o.mode)), wantW = u.wa.ok && (test || !chDone_(rec.w, o.mode));
  if (!wantE && !wantW) return out;
  var save = function () { if (test) return; if (out.e) rec.e = out.e; if (out.w) rec.w = out.w; rec.k = 'brief'; ubSet_(k, rec); };
  var B = null, berr = '';
  try {
    /* review fix: a Google Calendar is read only for an address on the person's own 🧭 card or Users record — never for
       an HR-record address, which may be a supervisor's mailbox */
    var calAddr = (u.mail.ok && u.mail.from !== 'hr') ? u.mail.addr : '';
    B = buildUserBrief_(data || {}, u, M, dry ? { events: [], note: '' } : readCalendar_(calAddr, M));
    B.test = test;
  } catch (e) { berr = 'the brief could not be built: ' + scrubWhy_(e, '', '', 100); }
  if (wantE) {
    var nE = (rec.e && rec.e.s === 'failed' ? (rec.e.n || 1) : 0) + 1;
    try {
      if (berr) throw new Error(berr);
      if (dry) out.e = { s: 'dry', at: at };
      else if (ubMailCount_(M.day) >= ubMailCap_()) out.e = { s: 'skip', at: at, why: 'daily mail cap' };
      else {
        GmailApp.sendEmail(u.mail.addr, ubSubject_(B), renderText_(B), { htmlBody: entify_(renderHtml_(B)), name: UB_FROM_NAME });
        ubMailInc_(M.day);
        out.e = { s: 'sent', at: at, to: lc_(u.mail.addr) };
      }
    } catch (e) { out.e = { s: 'failed', at: at, why: scrubWhy_(e, '', '', 120), n: nE }; }
    save();                                             /* review fix: the e-mail's state is kept before WhatsApp starts */
  }
  if (wantW && !(deadline && Date.now() > deadline)) {  /* review fix: past the deadline the next tick sends the WhatsApp */
    var nW = (rec.w && rec.w.s === 'failed' ? (rec.w.n || 1) : 0) + 1;
    try {
      if (berr) throw new Error(berr);
      if (dry) out.w = { s: 'dry', at: at };
      else {
        if (!test) { rec.w = { s: 'sending', at: at }; rec.k = 'brief'; ubSet_(k, rec); }   /* a stopped run never re-sends it */
        var r = callMeBot_(u.wa.phone, u.wa.key, renderWa_(B), deadline);
        out.w = { s: r.s, at: at, why: r.why || '', parts: r.parts };
        if (r.s === 'failed') out.w.n = nW;
        Utilities.sleep(WA_USER_SLEEP);
      }
    } catch (e) { out.w = { s: 'failed', at: at, why: scrubWhy_(e, u.wa.phone, u.wa.key, 120), n: nW }; }
    save();
  }
  return out;
}
function chOut_(c) { if (!c) return undefined; var o = { s: c.s, at: c.at || '', why: c.why || '' }; if (c.parts) o.parts = c.parts; return o; }

/* ---------------- what the brief holds: only what this person sees in Nexi ---------------- */

function buildUserBrief_(data, u, M, cal) {
  var un = u.username, D = M.day, T = ymdAdd_(D, 1), Y = ymdAdd_(D, -1);
  var mods = arr_(u.scope && u.scope.mods), full = !!(u.scope && u.scope.full);
  var hasMod = function (m) { return mods.indexOf(m) >= 0; };
  var allUsers = arr_(store_(data, 'hydroPro_users', []));
  var heads = store_(data, 'hydroPro_dept_heads_v1', {});
  if (!heads || typeof heads !== 'object' || Array.isArray(heads)) heads = {};
  var nameOf = function (n) { n = lc_(n); for (var i = 0; i < allUsers.length; i++) { var x = allUsers[i]; if (x && lc_(x.username) === n) return String(x.fullname || x.fullName || x.username); } return n || '—'; };
  var openT = function (t) { return !!t && t.status !== 'done' && t.status !== 'cancelled'; };
  var B = { user: un, name: u.name, first: u.first, D: D, label: M.label, pay: !!(u.scope && u.scope.pay),
            tasks: { overdue: [], today: [], tomorrow: [], review: [] }, esc: [], team: [], memos: null, notices: [], calls: [],
            events: [], actions: [], prod: null, notes: [], mailOk: !!u.mail.ok, waOk: !!u.wa.ok, waWhy: u.wa.why || '', test: false };
  var tasks = arr_(store_(data, 'hydroPro_tasks_v1', [])), tStat = {};
  tasks.forEach(function (t) { if (t && t.id) tStat[t.id] = t.status; });
  /* A · your tasks, B · escalations you answer for, C · your team's overdue work (heads only, never personal tasks) */
  tasks.forEach(function (t) {
    if (!openT(t)) return;
    var own = lc_(t.owner) === un, due = String(t.due || '').slice(0, 10), title = clip_(t.title || '(untitled)', 140);
    if (own) {
      if (isEscTask_(t)) { if (due && due <= D) B.esc.push({ title: title, due: due, late: dayDiff_(D, due) }); }
      else if (due && due < D) B.tasks.overdue.push({ title: title, due: due, late: dayDiff_(D, due) });
      else if (due === D) B.tasks.today.push({ title: title, due: due });
      else if (due === T) B.tasks.tomorrow.push({ title: title, due: due });
    } else if (due && due < D && (t.visibility === 'head' || t.visibility === 'team') && isHeadOf_(un, lc_(t.owner), allUsers, heads)) {
      B.team.push({ title: title, due: due, owner: nameOf(t.owner), late: dayDiff_(D, due) });
    }
    if (lc_(t.reviewer) === un && t.rule === 'review' && t.status === 'review') B.tasks.review.push({ title: title, due: due });
  });
  var byDue = function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : 0; };
  B.tasks.overdue.sort(byDue); B.esc.sort(byDue); B.team.sort(byDue);
  /* D1 · memos waiting for the accountant's ① (counts only — a memo's amount is never read into a brief) */
  if (ubAcct_(allUsers, store_(data, 'hydroPro_memo_approvers_v1', {})) === un) {
    var n = 0;
    arr_(store_(data, 'hydroPro_memos', [])).forEach(function (m) {
      if (!m || !m.chain || typeof m.chain !== 'object' || m.deleted) return;
      if (/^(rejected|draft|returned)$/.test(String(m.status || '')) || m.source === 'late_approval') return;
      var c = m.chain;
      if ([lc_(m.createdBy), lc_(c.submittedBy)].indexOf(un) >= 0) return;   /* nobody approves their own memo */
      var cur = !!c.acct && (c.acct.round == null || c.acct.round === (c.round || 0));
      if (!cur) n++;
    });
    B.memos = n;
  }
  /* D2 · notices delivered to you in Nexi in the last 72 h and not read (memo steps, purchasing, escalations, duties) */
  arr_(store_(data, 'hydroPro_pa_inbox_v1', [])).forEach(function (x) {
    if (!x || lc_(x.user) !== un || x.read === true || /^SUP/.test(String(x.itemId || ''))) return;
    var at = typeof x.at === 'number' ? x.at : Date.parse(x.at);
    if (!isFinite(at) || M.ms - at > 72 * 3600000) return;
    B.notices.push({ title: clip_(x.title || '(notice)', 140), at: at, itemId: String(x.itemId || '') });
  });
  B.notices.sort(function (a, b) { return b.at - a.at; });
  /* E · open calls assigned to you (and, for a head, new calls in a department you head and may see) */
  var myName = lc_(u.name), hd = headDepts_(un, heads), seen = {};
  arr_(store_(data, 'hydroPro_calls', [])).forEach(function (c, i) {
    if (!c || /done|closed|resolved|cancel/i.test(String(c.status || ''))) return;
    var who = [].concat(c.assignedTo || [], c.acceptedBy || []).map(lc_);
    var mine = who.indexOf(un) >= 0 || (!!myName && who.indexOf(myName) >= 0);
    var dept = lc_(c.dept || c.department || c.module);
    var fresh = !mine && full && c.status === 'new_call' && !!dept && hd.indexOf(dept) >= 0 && hasMod(dept);
    if (!mine && !fresh) return;
    var id = String(c.id || ('#' + i));
    if (seen[id]) return; seen[id] = 1;
    B.calls.push({ title: clip_(c.subject || c.title || 'call', 140), urgent: /urgent|critical|high/i.test(String(c.priority || '')), dept: dept, fresh: fresh });
  });
  /* F · today: your Google Calendar, your Nexi meetings, Nexi calendar items you may see, meeting actions due */
  ((cal && cal.events) || []).forEach(function (e) { B.events.push({ time: e.time || '', title: clip_(e.title, 120), src: 'calendar' }); });
  if (cal && cal.note) B.notes.push(cal.note);
  arr_(store_(data, 'hydroPro_meetings_v1', [])).forEach(function (m) {
    if (!m || m.archived) return;
    var mine = lc_(m.chair) === un || lc_(m.createdBy) === un
      || arr_(m.attendees).some(function (a) { return !!a && a.kind === 'user' && lc_(a.id) === un; });
    if (mine && String(m.date || '').slice(0, 10) === D) B.events.push({ time: hmNorm_(m.start), title: clip_(m.title || 'Meeting', 120), src: 'meeting' });
    arr_(m.minutes && m.minutes.actions).forEach(function (a) {
      if (!a || lc_(a.owner) !== un || a.done === true || a.status === 'done') return;
      var due = String(a.due || '').slice(0, 10);
      if (!due || due > D) return;
      if (a.taskId && (tStat[a.taskId] === 'done' || tStat[a.taskId] === 'cancelled')) return;
      B.actions.push({ title: clip_(a.what || 'action', 120), due: due, meeting: clip_(m.title || 'meeting', 60) });
    });
  });
  arr_(store_(data, 'hydroPro_cal_events_v2', [])).forEach(function (e) {
    if (!e || String(e.date || '').slice(0, 10) !== D) return;
    var m = String(e.module || 'general');
    if (m !== 'general' && !(full && hasMod(m))) return;
    B.events.push({ time: hmNorm_(e.time), title: clip_(e.title || 'event', 120), src: m });
  });
  var tk = function (e) { return e.time === 'all day' ? '00:00' : (e.time || '99:99'); };
  B.events.sort(function (a, b) { return tk(a) < tk(b) ? -1 : tk(a) > tk(b) ? 1 : 0; });
  /* G · production (only for people who hold Production): yesterday's checklist + open critical issues, own greenhouses */
  if (full && hasMod('production')) {
    var ghs = arr_(u.assigned && u.assigned.greenhouses).map(ghNorm_).filter(Boolean);
    var okGh = function (s) {
      if (!ghs.length) return true;
      var nn = ghNorm_(s);
      return ghs.some(function (g) { return nn === g || new RegExp('(^|[^A-Z0-9])' + g.replace(/[^A-Z0-9]/g, '') + '(?![0-9])').test(nn); });
    };
    var st = store_(data, 'hydroPro_' + Y, {}), rows = [];
    if (st && typeof st === 'object') Object.keys(st).forEach(function (gh) {
      var g = st[gh]; if (!g || !g.statuses || !okGh(gh)) return;
      var w = 0, cr = 0;
      Object.keys(g.statuses).forEach(function (k) { if (g.statuses[k] === 'warn') w++; if (g.statuses[k] === 'danger') cr++; });
      if (w || cr) rows.push({ gh: gh, crit: cr, warn: w });
    });
    rows.sort(function (a, b) { return (b.crit * 10 + b.warn) - (a.crit * 10 + a.warn); });
    var iss = arr_(store_(data, 'hydroPro_issues_v2', [])).filter(function (i) {
      return !!i && !/closed|resolved|done|cancel/i.test(String(i.status || '')) && /crit|urgent|high/i.test(String(i.severity || i.priority || ''))
        && okGh(i.facility || i.gh || i.location || '');
    }).map(function (i) { return { title: clip_(i.title || i.issue || i.category || 'issue', 120), gh: String(i.facility || i.gh || i.location || '') }; });
    B.prod = { day: Y, rows: rows, issues: iss };
  }
  if (!full && u.scope && u.scope.note) B.notes.push(u.scope.note);
  return B;
}

function isEscTask_(t) {
  return arr_(t && t.links).some(function (l) {
    if (typeof l === 'string') return /^escalation:/i.test(l);
    return !!l && (l.type === 'escalation' || /^escalation:/i.test(String(l.id || l.url || '')));
  });
}
function ubDepts_(o, heads) {
  if (!o) return [];
  if (o.allDepts) return Object.keys(heads).filter(function (d) { return d !== '_lww' && d !== 'updatedAt'; });
  var out = Array.isArray(o.departments) ? o.departments.slice() : [], d = o.department || o.dept;
  if (d && out.indexOf(d) < 0) out.push(d);
  return out.map(function (x) { return x === 'qc' ? 'quality' : x; }).filter(Boolean);
}
/* the app's HNXTASKS.isHeadOf: the viewer is the head of one of the owner's departments (and not the owner) */
function isHeadOf_(viewer, owner, users, heads) {
  if (!viewer || !owner || viewer === owner) return false;
  var o = null;
  for (var i = 0; i < users.length; i++) if (users[i] && lc_(users[i].username) === owner) { o = users[i]; break; }
  return ubDepts_(o, heads).some(function (d) { var h = lc_(heads[d]); return !!h && h === viewer && h !== owner; });
}
function headDepts_(viewer, heads) {
  return Object.keys(heads).filter(function (d) { return d !== '_lww' && d !== 'updatedAt' && lc_(heads[d]) === viewer; }).map(lc_);
}
/* the app's hnxMemoPeople().acct: 🏛 Approvers acctUser (if active), else Pagtama, else Jinky */
function ubAcct_(users, ap) {
  var U = users.filter(function (u) { return !!u && !!u.username && u.active !== false && u.disabled !== true; });
  var find = function (rx) {
    for (var i = 0; i < U.length; i++) { var u = U[i]; if (rx.test([u.username, u.fullname, u.fullName, u.name, u.email].filter(Boolean).join(' '))) return lc_(u.username); }
    return '';
  };
  ap = (ap && typeof ap === 'object') ? ap : {};
  if (ap.acctUser && U.some(function (u) { return lc_(u.username) === lc_(ap.acctUser); })) return lc_(ap.acctUser);
  return find(/pagtama/i) || find(/jinky/i);
}
function ghNorm_(s) { return String(s || '').toUpperCase().replace(/GREEN\s*HOUSE/g, 'GH').replace(/\s+/g, ''); }

function readCalendar_(email, M) {
  var out = { events: [], note: '' };
  if (!email) return out;
  try {
    var cal = CalendarApp.getCalendarById(email);
    if (!cal) {
      out.note = 'Your Google Calendar is not shared with nexi@abapardes.com.ph — share it ("See all event details") to see your meetings here.';
      return out;
    }
    var p = M.day.split('-'), start = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) - 8 * 3600000), end = new Date(start.getTime() + 86400000);
    cal.getEvents(start, end).forEach(function (ev) {
      out.events.push({ time: ev.isAllDayEvent() ? 'all day' : Utilities.formatDate(ev.getStartTime(), TZ, 'HH:mm'),
                        title: String(ev.getTitle() || '').trim() || '(busy)' });
    });
  } catch (e) { out.note = 'Your Google Calendar could not be read today — Nexi shows only its own meetings.'; }
  return out;
}

/* ---------------- the three renderings ---------------- */

function ubSubject_(B) {
  var od = B.tasks.overdue.length + B.esc.filter(function (e) { return e.due < B.D; }).length;
  return (B.test ? 'TEST · ' : '') + '☀️ Your Nexi brief — ' + B.label + (od ? ' · ' + od + ' overdue' : '');
}
function ubPending_(B) {
  var t = B.tasks;
  return !!(t.overdue.length || t.today.length || t.tomorrow.length || t.review.length || B.esc.length || B.team.length
    || B.memos || B.notices.length || B.calls.length || B.actions.length || (B.prod && (B.prod.rows.length || B.prod.issues.length)));
}
function plural_(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

/* WhatsApp: short, counts + a few titles, NEVER an amount (every line with one is dropped and counted), never the title
   of a memo / payroll / loyalty notice (counted only), never a Google Calendar title (those go only to the mailbox that
   owns the calendar — the e-mail) */
function renderWa_(B) {
  var L = [(B.test ? '🧪 TEST · ' : '') + '☀ Nexi · ' + B.label + ' · ' + B.first], hidden = 0;
  var pick = function (list, max, fmt) {
    var k = 0;
    for (var i = 0; i < list.length && k < max; i++) {
      if (isMoneyWa_(list[i].title)) { hidden++; continue; }
      L.push('  • ' + fmt(list[i])); k++;
    }
  };
  var short = function (s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  var t = B.tasks, n1 = t.overdue.length, n2 = t.today.length, n3 = t.tomorrow.length;
  if (n1 + n2 + n3) {
    L.push('📋 ' + [n1 ? n1 + ' overdue' : '', n2 ? n2 + ' today' : '', n3 ? n3 + ' tomorrow' : ''].filter(Boolean).join(' · '));
    pick(t.overdue.concat(t.today), 3, function (x) { return short(x.title, 60) + (x.late ? ' (late ' + x.late + 'd)' : ' (today)'); });
  }
  if (t.review.length) L.push('📤 ' + plural_(t.review.length, 'task') + ' to review');
  if (B.esc.length) {
    var od = B.esc.filter(function (e) { return e.due < B.D; }).length;
    L.push('🚨 ' + plural_(B.esc.length, 'escalation') + (od ? ' to follow up (' + od + ' overdue)' : ' due today'));
    pick(B.esc, 2, function (x) { return short(x.title.replace(/^🚨\s*/, ''), 60); });
  }
  if (B.team.length) L.push('👥 ' + B.team.length + ' overdue in your team');
  var w = [];
  if (B.memos) w.push(B.memos + ' memo' + (B.memos === 1 ? '' : 's') + ' for your ① check');
  if (B.notices.length) w.push(plural_(B.notices.length, 'notice'));
  if (w.length) {
    L.push('✅ ' + w.join(' · '));
    var countOnly = B.notices.filter(function (x) { return WA_COUNT_ONLY_RX.test(x.itemId || ''); }).length;
    pick(B.notices.filter(function (x) { return !WA_COUNT_ONLY_RX.test(x.itemId || ''); }), 3, function (x) { return short(x.title, 60); });
    if (countOnly) L.push('  • ' + plural_(countOnly, 'memo / pay notice') + ' — details in Nexi');
  }
  if (B.calls.length) {
    var ur = B.calls.filter(function (c) { return c.urgent; }).length;
    L.push('📞 ' + plural_(B.calls.length, 'call') + (ur ? ' (' + ur + ' urgent)' : ''));
  }
  if (B.actions.length) L.push('📝 ' + plural_(B.actions.length, 'meeting action') + ' due');
  if (B.prod && (B.prod.rows.length || B.prod.issues.length)) {
    var cr = 0, wn = 0;
    B.prod.rows.forEach(function (r) { cr += r.crit; wn += r.warn; });
    L.push('🌱 yesterday: ' + (cr ? cr + ' critical · ' : '') + plural_(wn, 'warning') + (B.prod.issues.length ? ' · ' + plural_(B.prod.issues.length, 'open critical issue') : ''));
  }
  if (!ubPending_(B)) L.splice(1, 0, '✅ Nothing overdue or waiting for you today.');
  var nexiEv = B.events.filter(function (e) { return e.src !== 'calendar'; }), gcal = B.events.length - nexiEv.length;
  if (nexiEv.length || gcal) {
    var ev = [];
    nexiEv.slice(0, 4).forEach(function (e) { if (isMoneyWa_(e.title)) { hidden++; return; } ev.push((e.time ? e.time + ' ' : '') + short(e.title, 40)); });
    var more = (nexiEv.length > 4 ? ' · +' + (nexiEv.length - 4) + ' more' : '') + (gcal ? ' · +' + gcal + ' in your Google Calendar (e-mail)' : '');
    if (ev.length || more) L.push('📅 ' + (ev.length ? ev.join(' · ') : 'today') + more);
  }
  if (hidden) L.push('(+' + plural_(hidden, 'item') + ' with amounts — open Nexi)');
  L.push(B.mailOk ? 'Full brief in your e-mail' : 'Details: open Nexi ▸ 🧭 My Day');
  return L.join('\n');
}

/* the e-mail: the same sections in full; a person without the pay permission never sees a line with an amount */
function ubMailModel_(B) {
  var hidden = 0, keep = function (list) { return list.filter(function (x) { if (!B.pay && isMoney_(x.title)) { hidden++; return false; } return true; }); };
  var m = { overdue: keep(B.tasks.overdue), today: keep(B.tasks.today), tomorrow: keep(B.tasks.tomorrow), review: keep(B.tasks.review),
            esc: keep(B.esc), team: keep(B.team), notices: keep(B.notices), calls: keep(B.calls), events: keep(B.events), actions: keep(B.actions),
            prodIssues: B.prod ? keep(B.prod.issues) : [] };
  m.hidden = hidden;
  return m;
}
function ubFooter_(B) {
  var f = [];
  if (B.test) f.push('This is the TEST brief you asked for in Nexi (📣 Briefings & Voice) — it was sent only to you.');
  f.push('Why you get this: your 🧭 Assistant card (Administration) allows e-mail briefings. Stop: ⏸ Pause all in 👔 Nexi Assistant ▸ 📋 Support Plan, or ask Administration.');
  f.push('WhatsApp: ' + (B.waOk ? 'on (CallMeBot, to your own phone).' : B.waWhy === 'card-off' ? 'your key is on the server, but "send WhatsApp messages" is not ticked on your 🧭 card — ask Administration.'
    : B.waWhy === 'paused' ? 'paused.' : 'not set up — see 📣 Briefings & Voice (5 steps).'));
  return f.concat(B.notes);
}
function renderHtml_(B) {
  var m = ubMailModel_(B), out = [], red = '#c62828', amber = '#e65100', grey = '#777';
  var list = function (arr, cap, fmt) {
    if (!arr.length) return '';
    var h = '<ul style="margin:4px 0;">' + arr.slice(0, cap).map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ul>';
    return h + (arr.length > cap ? '<div style="color:' + grey + ';">+' + (arr.length - cap) + ' more — open Nexi</div>' : '');
  };
  out.push('<meta charset="UTF-8"><div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;">');
  if (B.test) out.push('<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:6px 10px;margin-bottom:10px;">🧪 <b>TEST</b> — you asked for this from Nexi.</div>');
  out.push('<h2 style="margin:0 0 2px 0;">☀️ Good morning, ' + esc_(B.first) + '</h2>');
  out.push('<div style="color:' + grey + ';margin-bottom:12px;">' + Utilities.formatDate(new Date(), TZ, 'EEEE, d MMMM yyyy · HH:mm') + ' · your own Nexi brief</div>');
  if (!ubPending_(B)) out.push('<div style="color:#2e7d32;font-weight:bold;">✅ Nothing overdue or waiting for you today.</div>');
  var nT = m.overdue.length + m.today.length + m.tomorrow.length + m.review.length;
  if (nT) {
    out.push(h_('📋', 'Your tasks'));
    if (m.overdue.length) out.push('<div style="color:' + red + ';font-weight:bold;">Overdue (' + m.overdue.length + ')</div>' + list(m.overdue, 10, function (x) { return esc_(x.title) + ' <span style="color:' + grey + ';">· due ' + esc_(x.due) + ' (late ' + x.late + 'd)</span>'; }));
    if (m.today.length) out.push('<div style="font-weight:bold;">Due today (' + m.today.length + ')</div>' + list(m.today, 10, function (x) { return esc_(x.title); }));
    if (m.tomorrow.length) out.push('<div style="font-weight:bold;">Due tomorrow (' + m.tomorrow.length + ')</div>' + list(m.tomorrow, 10, function (x) { return esc_(x.title); }));
    if (m.review.length) out.push('<div style="font-weight:bold;">Waiting for your review (' + m.review.length + ')</div>' + list(m.review, 10, function (x) { return esc_(x.title); }));
  }
  if (m.esc.length) out.push(h_('🚨', 'Escalations you are responsible for (' + m.esc.length + ')') + list(m.esc, 10, function (x) { return esc_(x.title) + ' <span style="color:' + (x.due < B.D ? red : grey) + ';">· follow-up ' + esc_(x.due) + '</span>'; }));
  if (m.team.length) out.push(h_('👥', 'Your team — overdue (' + m.team.length + ')') + list(m.team, 10, function (x) { return esc_(x.title) + ' <span style="color:' + grey + ';">· ' + esc_(x.owner) + ' · due ' + esc_(x.due) + '</span>'; }));
  if (B.memos || m.notices.length) {
    out.push(h_('✅', 'Waiting for you'));
    if (B.memos) out.push('<div><b>' + plural_(B.memos, 'memo') + '</b> wait for your ① check — Nexi ▸ HR — Memos (good/bad) ▸ Memo approvals.</div>');
    if (m.notices.length) out.push('<div style="margin-top:4px;">Notices delivered to you in Nexi (' + m.notices.length + '):</div>' + list(m.notices, 8, function (x) { return esc_(x.title); }));
  }
  if (m.calls.length) out.push(h_('📞', 'Calls (' + m.calls.length + ')') + list(m.calls, 10, function (x) { return (x.urgent ? '<b style="color:' + red + ';">URGENT</b> ' : '') + esc_(x.title) + (x.fresh ? ' <span style="color:' + grey + ';">· new in ' + esc_(x.dept) + '</span>' : ''); }));
  if (m.events.length || m.actions.length) {
    out.push(h_('📅', 'Today'));
    out.push(list(m.events, 12, function (x) { return (x.time ? '<b>' + esc_(x.time) + '</b> ' : '') + esc_(x.title); }));
    if (m.actions.length) out.push('<div style="font-weight:bold;margin-top:4px;">Meeting actions due (' + m.actions.length + ')</div>' + list(m.actions, 8, function (x) { return esc_(x.title) + ' <span style="color:' + grey + ';">· ' + esc_(x.meeting) + ' · due ' + esc_(x.due) + '</span>'; }));
  }
  if (B.prod && (B.prod.rows.length || m.prodIssues.length)) {
    out.push(h_('🌱', 'Production — yesterday’s checklist (' + B.prod.day + ')'));
    out.push(list(B.prod.rows, 8, function (r) { return '<b>' + esc_(r.gh) + '</b>: ' + (r.crit ? '<span style="color:' + red + ';">' + r.crit + ' critical</span> ' : '') + (r.warn ? '<span style="color:' + amber + ';">' + plural_(r.warn, 'warning') + '</span>' : ''); }));
    if (m.prodIssues.length) out.push('<div style="font-weight:bold;margin-top:4px;">Open critical issues (' + m.prodIssues.length + ')</div>' + list(m.prodIssues, 8, function (x) { return esc_(x.title) + (x.gh ? ' <span style="color:' + grey + ';">· ' + esc_(x.gh) + '</span>' : ''); }));
  }
  if (m.hidden) out.push('<div style="color:' + grey + ';margin-top:8px;">+' + plural_(m.hidden, 'item') + ' with amounts — open Nexi.</div>');
  out.push('<div style="margin-top:16px;"><a href="' + APP_URL + '" style="background:#0d47a1;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;">Open Nexi</a></div>');
  out.push('<div style="color:#999;font-size:11px;margin-top:18px;">' + ubFooter_(B).map(esc_).join('<br>') + '</div></div>');
  return out.join('');
}
/* the plain-text part (what the phone's mail notification shows): no 4-byte emoji, GmailApp would garble them */
function renderText_(B) {
  var m = ubMailModel_(B), L = [];
  var sec = function (title, arr, cap, fmt) { if (!arr.length) return; L.push(''); L.push(title); arr.slice(0, cap).forEach(function (x) { L.push('  - ' + fmt(x)); }); if (arr.length > cap) L.push('  +' + (arr.length - cap) + ' more'); };
  if (B.test) L.push('TEST — you asked for this from Nexi.');
  L.push('Good morning, ' + B.first + ' — ' + B.label + ' · your own Nexi brief');
  if (!ubPending_(B)) L.push('Nothing overdue or waiting for you today.');
  sec('YOUR TASKS — overdue (' + m.overdue.length + ')', m.overdue, 10, function (x) { return x.title + ' (due ' + x.due + ', late ' + x.late + 'd)'; });
  sec('YOUR TASKS — due today (' + m.today.length + ')', m.today, 10, function (x) { return x.title; });
  sec('YOUR TASKS — due tomorrow (' + m.tomorrow.length + ')', m.tomorrow, 10, function (x) { return x.title; });
  sec('WAITING FOR YOUR REVIEW (' + m.review.length + ')', m.review, 10, function (x) { return x.title; });
  sec('ESCALATIONS YOU ARE RESPONSIBLE FOR (' + m.esc.length + ')', m.esc, 10, function (x) { return x.title + ' (follow-up ' + x.due + ')'; });
  sec('YOUR TEAM — OVERDUE (' + m.team.length + ')', m.team, 10, function (x) { return x.title + ' (' + x.owner + ', due ' + x.due + ')'; });
  if (B.memos) { L.push(''); L.push('WAITING FOR YOU: ' + plural_(B.memos, 'memo') + ' for your ① check (Nexi ▸ HR — Memos (good/bad) ▸ Memo approvals)'); }
  sec('NOTICES IN NEXI (' + m.notices.length + ')', m.notices, 8, function (x) { return x.title; });
  sec('CALLS (' + m.calls.length + ')', m.calls, 10, function (x) { return (x.urgent ? 'URGENT ' : '') + x.title; });
  sec('TODAY', m.events, 12, function (x) { return (x.time ? x.time + ' ' : '') + x.title; });
  sec('MEETING ACTIONS DUE (' + m.actions.length + ')', m.actions, 8, function (x) { return x.title + ' (' + x.meeting + ', due ' + x.due + ')'; });
  if (B.prod) {
    sec('PRODUCTION — yesterday’s checklist (' + B.prod.day + ')', B.prod.rows, 8, function (r) { return r.gh + ': ' + (r.crit ? r.crit + ' critical ' : '') + (r.warn ? plural_(r.warn, 'warning') : ''); });
    sec('OPEN CRITICAL ISSUES (' + m.prodIssues.length + ')', m.prodIssues, 8, function (x) { return x.title + (x.gh ? ' · ' + x.gh : ''); });
  }
  if (m.hidden) { L.push(''); L.push('+' + plural_(m.hidden, 'item') + ' with amounts — open Nexi.'); }
  L.push(''); L.push('Open Nexi: ' + APP_URL);
  L.push('--'); ubFooter_(B).forEach(function (x) { L.push(x); });
  return L.join('\n').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]\s?/g, '');
}

/* ---------------- WhatsApp through CallMeBot (shared by the leadership and the per-user sends) ---------------- */

function moneyGuard_(text) {
  var kept = [], dropped = 0;
  String(text || '').split('\n').forEach(function (l) { if (isMoneyWa_(l)) dropped++; else kept.push(l); });
  if (dropped) kept.push('(+' + plural_(dropped, 'item') + ' with amounts — open Nexi)');
  return { text: kept.join('\n'), dropped: dropped };
}
function waUrl_(phone, key, text) {
  return 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone) + '&apikey=' + encodeURIComponent(key) + '&text=' + encodeURIComponent(text);
}
/* a lone surrogate cannot be URL-encoded — replace it (never happens with Nexi's own text, but never throw) */
function wellFormed_(s) {
  var o = '';
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) { var d = i + 1 < s.length ? s.charCodeAt(i + 1) : 0; if (d >= 0xDC00 && d <= 0xDFFF) { o += s.charAt(i) + s.charAt(i + 1); i++; } else o += '�'; }
    else if (c >= 0xDC00 && c <= 0xDFFF) o += '�';
    else o += s.charAt(i);
  }
  return o;
}
/* splits a text into parts whose ENCODED length is at most `budget`: by lines first; a line longer than a part is cut
   between two characters (never inside an emoji, never inside a %XX). nl = a line break followed this part. */
function waChunks_(text, budget) {
  var lines = wellFormed_(String(text || '')).split('\n'), out = [], cur = null, curLen = 0, NL = 3; /* %0A */
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i], el = encodeURIComponent(ln).length;
    if (cur !== null && curLen + NL + el <= budget) { cur += '\n' + ln; curLen += NL + el; continue; }
    if (cur !== null) { out.push({ t: cur, nl: true }); cur = null; }
    if (el <= budget) { cur = ln; curLen = el; continue; }
    var piece = '', pl = 0;
    for (var j = 0; j < ln.length; j++) {
      var ch = ln.charAt(j), c = ln.charCodeAt(j);
      if (c >= 0xD800 && c <= 0xDBFF && j + 1 < ln.length) { ch = ln.substr(j, 2); j++; }
      var cl = encodeURIComponent(ch).length;
      if (pl + cl > budget && piece) { out.push({ t: piece, nl: false }); piece = ''; pl = 0; }
      piece += ch; pl += cl;
    }
    cur = piece; curLen = pl;
  }
  if (cur !== null) out.push({ t: cur, nl: false });
  return out;
}
function waParts_(phone, key, text) {
  var budget = WA_URL_MAX - waUrl_(phone, key, '').length - encodeURIComponent('(99/99) ').length;
  var ch = waChunks_(text, budget), n = ch.length;
  return ch.map(function (c, i) { return (n > 1 && i > 0 ? '(' + (i + 1) + '/' + n + ') ' : '') + c.t; });
}
/* OK only when CallMeBot answers 200 AND "queued"; 200 without it = unconfirmed; anything else = failed.
   The phone number and the key never reach a log, a reason or a mail.
   Review fix: once part 1 went out, a later part that fails (or is not started because the run's deadline passed) is
   'unconfirmed', not 'failed' — a retry would send part 1 a second time. */
function callMeBot_(phone, key, text, deadline) {
  var g = moneyGuard_(text), parts = waParts_(phone, key, g.text), rank = { sent: 0, unconfirmed: 1, failed: 2 }, worst = 'sent', why = '';
  if (!parts.length) return { s: 'failed', parts: 0, why: 'empty message' };
  for (var i = 0; i < parts.length; i++) {
    if (i > 0 && deadline && Date.now() > deadline)
      return { s: 'unconfirmed', parts: parts.length, why: 'stopped after part ' + i + ' of ' + parts.length + ' (time limit) — the rest comes with the next brief' };
    var st = 'failed', w = '';
    try {
      var r = UrlFetchApp.fetch(waUrl_(phone, key, parts[i]), { muteHttpExceptions: true });
      var code = r.getResponseCode(), body = String(r.getContentText() || '');
      if (code === 200 && /queued/i.test(body)) st = 'sent';
      else if (code === 200) { st = 'unconfirmed'; w = scrubWhy_(body, phone, key, 80) || 'no "queued" in the answer'; }
      else w = 'CallMeBot HTTP ' + code;
    } catch (e) { w = scrubWhy_(e, phone, key, 80); }
    if (st === 'failed' && i > 0)
      return { s: 'unconfirmed', parts: parts.length, why: 'part ' + (i + 1) + ' of ' + parts.length + ' failed (' + w + ') — part 1 arrived' };
    if (rank[st] > rank[worst]) { worst = st; why = w; }
    if (st === 'failed') break;                        /* the next part would fail the same way */
    if (i < parts.length - 1) Utilities.sleep(WA_PART_SLEEP);
  }
  return { s: worst, parts: parts.length, why: why };
}

/* ---------------- bounces, the failure summary, engine errors ---------------- */

function checkBounces_(M) {
  if (M.hm < '06:00' || M.hm >= '13:00') return 0;
  var all = ubUP_().getProperties(), sent = {}, any = false;
  [M.day, ymdAdd_(M.day, -1)].forEach(function (d) {
    Object.keys(all).forEach(function (k) {
      if (k.indexOf('ub|' + d + '|') !== 0) return;
      var r = ubParse_(all[k], null);
      if (r && r.e && r.e.to && (r.e.s === 'sent' || r.e.s === 'unconfirmed')) { (sent[r.e.to] = sent[r.e.to] || []).push(k); any = true; }
    });
  });
  if (!any) return 0;
  var seen = arr_(ubGet_('ub_bounce_ids', [])), n = 0;
  GmailApp.search('from:(mailer-daemon OR postmaster) newer_than:2d', 0, 20).forEach(function (th) {
    th.getMessages().forEach(function (msg) {
      var id = String(msg.getId());
      if (seen.indexOf(id) >= 0) return;
      seen.push(id);
      var body = String(msg.getPlainBody() || ''), low = body.toLowerCase();
      Object.keys(sent).forEach(function (addr) {
        /* review fix: the whole address, not a part of a longer one (a bounce for kjin@ is not one for jin@) */
        if (!new RegExp('(^|[^a-z0-9._%+-])' + addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9.-])').test(low)) return;
        var why = /address not found|does not exist|no such user|user unknown|unknown user|recipient not found/i.test(body) ? 'Address not found'
          : scrubWhy_(body.split('\n').filter(function (l) { return l.trim(); })[0] || 'bounced', '', '', 80);
        sent[addr].forEach(function (k) { var r = ubGet_(k) || {}; if (r.e && r.e.s !== 'bounced') { r.e.s = 'bounced'; r.e.why = why; ubSet_(k, r); n++; } });
      });
    });
  });
  ubSet_('ub_bounce_ids', seen.slice(-200));
  return n;
}

function ubFix_(ch, s, why) {
  if (s === 'skip') return 'raise the Script property USER_BRIEF_MAX_MAILS (the daily e-mail cap was reached)';
  if (ch === 'e') return s === 'bounced' ? 'correct the Work e-mail on their Assistant card'
    : s === 'missed' ? 'check the nexiUserBriefTick trigger ran this morning (Triggers / Executions)'
    : 'Nexi retried once - see the reason; fix the address or the quota';
  if (s === 'unconfirmed' && /^part |^stopped after part|run stopped/.test(String(why || ''))) return 'CallMeBot was slow or busy - ask them if it arrived; the test button sends it again';
  return s === 'unconfirmed' ? 'ask them to redo CallMeBot step 2 and send you the new key (replace WA_<USERNAME>)'
    : s === 'missed' ? 'check the nexiUserBriefTick trigger ran this morning'
    : 'check WA_<USERNAME> = 63XXXXXXXXXX|key; CallMeBot may be busy - the test button retries';
}
function summary_(M, users, mode) {
  if (mode !== 'on' || ubGet_('ub_sum|' + M.day)) return false;
  var elig = users.filter(function (u) { return !u.legacy && u.sendable && u.days.indexOf(M.dow) >= 0; });
  var allDone = elig.every(function (u) { return doneToday_(u, M.day, mode); });
  if (!allDone && M.hm < CUTOFF) return false;
  var lines = [], bad = { failed: 1, bounced: 1, unconfirmed: 1, missed: 1, sending: 1, skip: 1 };
  elig.forEach(function (u) {
    var r = ubGet_('ub|' + M.day + '|' + u.username) || {};
    [['e', 'e-mail'], ['w', 'WhatsApp']].forEach(function (c) {
      var st = ubRecClean_({ e: r.e, w: r.w })[c[0]];
      if (st && bad[st.s]) lines.push(u.name + ' · ' + c[1] + ' · ' + st.s + ' · ' + (st.why || '-') + ' · ' + ubFix_(c[0], st.s, st.why));
    });
  });
  if (!lines.length) return false;
  var notSet = users.filter(function (u) { return !u.legacy && !u.sendable; }).length;
  var body = 'Today\'s staff briefs that did not arrive (Nexi ▸ Administration ▸ 👥 Users ▸ 📨 Brief delivery has the full table):\n\n'
    + lines.map(function (l) { return '• ' + l; }).join('\n')
    + (notSet ? '\n\n' + plural_(notSet, 'user') + ' not set up yet (no @abapardes.com.ph e-mail and no WhatsApp key) — see 📨 Brief delivery.' : '')
    + '\n\n— nexi-morning-brief.gs v' + UB_VERSION + ' (USER_BRIEF = on)';
  /* review fix: plain text only — GmailApp garbles 4-byte emoji (👥 📨 🧭), so they are taken out as in the setup mail */
  body = body.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]\s?/g, '');
  GmailApp.sendEmail(FAIL_TO, '⚠ Nexi user briefs — ' + lines.length + ' not delivered · ' + M.label, body, { name: UB_FROM_NAME });
  ubSet_('ub_sum|' + M.day, { at: new Date().toISOString(), n: lines.length });
  return true;
}
function ubEngineFail_(e, M) {
  var n = (Number(ubGet_('ub_err', 0)) || 0) + 1, msg = scrubWhy_(e, '', '', 200);
  ubSet_('ub_err', n);
  ubSet_('ub_lasterr', { msg: msg, at: new Date().toISOString() });
  if (n >= 3 && !ubGet_('ub_errmail|' + M.day)) {
    try {
      GmailApp.sendEmail(FAIL_TO, '⚠ Nexi user briefs could not run: ' + msg.slice(0, 90),
        'The 15-minute user-brief run failed ' + n + ' times in a row:\n\n' + msg + '\n\nMost often: the HNX_USER / HNX_PASS script property, or the hnx-sync worker not answering. '
        + 'The 06:00 / 07:15 leadership briefs are separate.\n\n— nexi-morning-brief.gs v' + UB_VERSION, { name: UB_FROM_NAME });
      ubSet_('ub_errmail|' + M.day, 1);
    } catch (x) {}
  }
}

/* ---------------- the delivery log Nexi reads (no addresses, numbers, keys or titles) ---------------- */

function ubRecClean_(r) {
  var o = { k: r.k || 'brief' };
  if (r.skip) o.skip = r.skip;
  ['e', 'w'].forEach(function (c) {
    var x = r[c]; if (!x || !x.s) return;
    var y = { s: x.s, at: x.at || '', why: scrubWhy_(x.why || '', '', '', 120) };
    if (x.s === 'sending') { y.s = 'unconfirmed'; y.why = 'the run stopped while sending — it may have arrived'; }   /* never re-sent */
    if (x.parts) y.parts = x.parts;
    if (x.n) y.n = x.n;
    if (x.round) y.round = x.round;
    o[c] = y;
  });
  return o;
}
function buildLog_(users, M, mode, extra) {
  extra = extra || {};
  var all = ubUP_().getProperties(), now = new Date().toISOString(), le = ubParse_(all.ub_lasterr, null);
  var lastErr = (le && le.msg && Date.parse(le.at) > M.ms - 86400000) ? le.msg + ' (' + le.at + ')' : '';
  var log = { v: 1, engine: { script: UB_VERSION, mode: mode, lastRun: now, lastOk: now, lastErr: lastErr,
                              mailsToday: Number(ubParse_(all['ub_mails|' + M.day], 0)) || 0, scopeAgeD: extra.scopeAgeD == null ? null : extra.scopeAgeD },
              setup: {}, days: {}, tests: {} };
  users.forEach(function (u) {
    log.setup[u.username] = { mail: u.legacy ? 'leader' : (u.mail.ok ? 'ok' : u.mail.why), mailFrom: u.mail.from || '',
                              wa: u.legacy ? 'leader' : (u.wa.ok ? 'ok' : u.wa.why), waProp: u.legacy && u.legacyProp ? u.legacyProp : u.wa.prop,
                              t: u.t, eff: u.eff, days: u.days };
  });
  for (var i = 0; i < LOG_DAYS; i++) {
    var d = ymdAdd_(M.day, -i), row = {}, any = false;
    users.forEach(function (u) {
      var r = ubParse_(all['ub|' + d + '|' + u.username], null);
      if (r) { row[u.username] = ubRecClean_(r); any = true; }
      else if (i === 0 && !u.legacy && u.sendable && u.days.indexOf(M.dow) < 0) { row[u.username] = { k: 'brief', skip: 'not a work day' }; any = true; }
    });
    if (any) log.days[d] = row;
  }
  users.forEach(function (u) {
    var H = ubParse_(all['ubt|' + u.username], null);
    if (H && H.last) log.tests[u.username] = { id: H.last.id, at: H.last.at, s: H.last.s === 'sending' ? 'done' : H.last.s, why: H.last.why || '', e: H.last.e, w: H.last.w };
  });
  return log;
}
function pushLog_(log, M, force) {
  var copy = JSON.parse(JSON.stringify(log));
  delete copy.engine.lastRun; delete copy.engine.lastOk;
  var h = ubHash_(JSON.stringify(copy)), prev = ubGet_('ub_logh') || {};
  var beat = (M.hm >= '05:00' && M.hm < '12:00') ? LOG_BEAT_MIN_DAY : LOG_BEAT_MIN_NIGHT;
  if (!force && prev.h === h && prev.at && Date.now() - prev.at < beat * 60000) return false;
  var o = {}; o[UB_LOG_KEY] = JSON.stringify(log);
  ubFetch_('/sync/push', { method: 'post', payload: JSON.stringify({ data: o }) });
  ubSet_('ub_logh', { h: h, at: Date.now() });
  return true;
}

/* ---------------- the setup check e-mail (installUserBriefs) ---------------- */

function ubSetupMail_(r) {
  var M = manila_(new Date()), rows = (r && r.users) || [], mode = (r && r.mode) || ubMode_();
  var mailTxt = function (u) {
    if (u.legacy) return 'leader — 06:00 + 07:15 brief (unchanged)';
    return u.mail.ok ? 'ready' : u.mail.why === 'no-company-email' ? '⚠ no @abapardes.com.ph e-mail — 🧭 Assistant ▸ Work e-mail'
      : u.mail.why === 'shared-email' ? '⚠ the HR e-mail belongs to another user — 🧭 Assistant ▸ Work e-mail'
      : u.mail.why === 'card-off' ? '⚠ "send e-mail briefings" is off on the card' : '⏸ paused by the person';
  };
  var waTxt = function (u) {
    return u.wa.ok ? 'ready' : u.wa.why === 'no-key' ? 'no key yet' : u.wa.why === 'card-off' ? '⚠ key found — tick "send WhatsApp messages" on the card'
      : u.wa.why === 'key-name-clash' ? '⚠ another user has the same key name — rename one of the two usernames' : '⏸ paused';
  };
  var lead = mode === 'on' ? 'USER_BRIEF is ON — each person gets the brief at their time.'
    : mode === 'off' ? 'USER_BRIEF is OFF — no staff briefs are sent.'
    : 'Nothing was sent to staff; set USER_BRIEF = on to start (Project Settings ▸ Script properties).';
  var txt = ['Nexi user briefs — setup check (v' + UB_VERSION + ') · ' + M.label + ' ' + M.hm, lead, ''];
  var html = ['<meta charset="UTF-8"><div style="font-family:Arial,Helvetica,sans-serif;">', '<h2>⚙ Nexi user briefs — setup check (v' + UB_VERSION + ')</h2>',
              '<div style="margin-bottom:10px;"><b>' + esc_(lead) + '</b></div>'];
  if (r && r.err) {
    txt.push('⚠ ERROR: ' + r.err + ' — check HNX_USER / HNX_PASS in Script properties.');
    html.push('<div style="color:#c62828;font-weight:bold;">⚠ ' + esc_(r.err) + ' — check HNX_USER / HNX_PASS in Script properties.</div>');
  }
  html.push('<table style="border-collapse:collapse;font-size:12px;" border="1" cellpadding="4"><tr style="background:#eee;"><th>Person</th><th>Work e-mail</th><th>Brief time</th><th>E-mail</th><th>WhatsApp</th><th>Script property for WhatsApp</th></tr>');
  rows.forEach(function (u) {
    var addr = u.mail.addr ? u.mail.addr + ' (' + u.mail.from + ')' : '— none';
    txt.push(u.name + ' (' + u.username + ') · ' + addr + ' · ' + u.eff + ' · e-mail: ' + mailTxt(u) + ' · WhatsApp: ' + waTxt(u) + ' · ' + (u.legacy && u.legacyProp ? u.legacyProp : u.wa.prop));
    html.push('<tr><td>' + esc_(u.name) + '<br><span style="color:#777;">' + esc_(u.username) + '</span></td><td' + (u.mail.addr && !COMPANY_RX.test(u.mail.addr) ? ' style="color:#c62828;"' : '') + '>' + esc_(addr) + '</td><td>' + esc_(u.eff) + (u.eff !== u.t ? ' (set ' + esc_(u.t) + ')' : '') + '</td><td>' + esc_(mailTxt(u)) + '</td><td>' + esc_(waTxt(u)) + '</td><td><code>' + esc_(u.legacy && u.legacyProp ? u.legacyProp : u.wa.prop) + '</code></td></tr>');
  });
  html.push('</table><p style="color:#777;font-size:11px;">The same table is in Nexi ▸ Administration ▸ 👥 Users ▸ 📨 Brief delivery. WhatsApp: add the Script property named in the last column, value 63XXXXXXXXXX|key (the person sends you the key from CallMeBot), then tick "send WhatsApp messages" on their 🧭 Assistant card. Never type a key into Nexi.</p></div>');
  txt.push('', 'WhatsApp: add the Script property named in the last column (value 63XXXXXXXXXX|key) and tick "send WhatsApp messages" on the person\'s 🧭 Assistant card.');
  GmailApp.sendEmail(FAIL_TO, '⚙ Nexi user briefs — setup check (v' + UB_VERSION + ')', txt.join('\n').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]\s?/g, ''),
    { htmlBody: entify_(html.join('')), name: UB_FROM_NAME });
}

/* ---------------- the leadership sends, recorded for Nexi (they never depend on USER_BRIEF) ---------------- */

/* the Nexi user a leadership send is recorded on: the leader's username (LEGACY_USERS) first, else the active user whose
   own 🧭 card or Users e-mail is one of that leader's mailboxes (leaderOwn_) — never a name pattern */
function legacyUser_(rc, data) {
  if (!data) return '';
  var users = arr_(store_(data, 'hydroPro_users', [])).filter(function (u) {
    return !!u && !!u.username && u.active !== false && u.disabled !== true && !SKIP_USER_RX.test(lc_(u.username));
  });
  for (var i = 0; i < users.length; i++) if (LEGACY_USERS[lc_(users[i].username)] === rc.name) return lc_(users[i].username);
  var own = leaderOwn_(rc);
  for (var j = 0; j < users.length; j++) {
    var u = users[j], mine = [lc_(u.assistant && u.assistant.workEmail), lc_(u.email)];
    if (mine.some(function (a) { return !!a && own.indexOf(a) >= 0; })) return lc_(u.username);
  }
  return '';
}
function ubRecordLeader_(rc, data, ch, res) {
  try {
    var un = legacyUser_(rc, data);
    if (!un) return;
    var k = 'ub|' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') + '|' + un, r = ubGet_(k) || {};
    r.k = 'leader';
    var o = { s: res.s, at: new Date().toISOString(), why: scrubWhy_(res.why || '', '', '', 120), round: res.round || '' };
    if (res.parts) o.parts = res.parts;
    r[ch] = o;
    ubSet_(k, r);
  } catch (e) {}
}

/* ---------------- cloud (hnx-sync: /auth/login, /sync/pull?keys=, /sync/push — all on the deployed 3.7.0) ---------------- */

function ubToken_(force) {
  var c = ubGet_('ub_tok');
  if (!force && c && c.t && c.exp > Date.now()) return c.t;
  var props = ubSP_(), user = props.getProperty('HNX_USER'), pass = props.getProperty('HNX_PASS');
  if (!user || !pass) throw new Error('Set HNX_USER and HNX_PASS in Script properties.');
  var r = UrlFetchApp.fetch(SYNC_URL + '/auth/login', { method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ username: user, password: pass }), muteHttpExceptions: true });
  var j = {};
  try { j = JSON.parse(r.getContentText()) || {}; } catch (e) {}
  if (!j.token) throw new Error('Cloud login failed: ' + (j.error || ('HTTP ' + r.getResponseCode())));
  ubSet_('ub_tok', { t: j.token, exp: Date.now() + 20 * 3600000 });   /* the cloud session lasts 24 h — one login a day, not 96 */
  return j.token;
}
function ubFetch_(path, opt) {
  opt = opt || {};
  for (var attempt = 0; attempt < 2; attempt++) {
    var o = { method: opt.method || 'get', headers: { Authorization: 'Bearer ' + ubToken_(attempt > 0) }, muteHttpExceptions: true };
    if (opt.payload) { o.contentType = 'application/json'; o.payload = opt.payload; }
    var r = UrlFetchApp.fetch(SYNC_URL + path, o), code = r.getResponseCode();
    if (code === 401 && attempt === 0) continue;       /* the cached session expired early — log in again once */
    var j = null;
    try { j = JSON.parse(r.getContentText()); } catch (e) {}
    if (code !== 200 || !j) throw new Error(String(path).split('?')[0] + ' HTTP ' + code + (j && j.error ? ' ' + String(j.error).slice(0, 80) : ''));
    return j;
  }
  throw new Error('cloud refused the session');
}
function ubPull_(keys) {
  var out = {}, chunk = [], base = SYNC_URL + '/sync/pull?keys=';
  var flush = function () {
    if (!chunk.length) return;
    var j = ubFetch_('/sync/pull?keys=' + chunk.join(',')), d = (j && j.data) || {};
    Object.keys(d).forEach(function (k) { out[k] = d[k]; });
    chunk = [];
  };
  keys.forEach(function (k) {
    k = String(k);
    if (chunk.length && (base + chunk.join(',') + ',' + k).length > PULL_URL_MAX) flush();
    chunk.push(k);
  });
  flush();
  return out;
}

/* ---------------- small helpers ---------------- */

function ubUP_() { return PropertiesService.getUserProperties(); }      /* engine state — never in the owner's Script properties list */
function ubSP_() { return PropertiesService.getScriptProperties(); }
function ubGet_(k, fb) { var d = fb === undefined ? null : fb; try { var v = ubUP_().getProperty(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function ubSet_(k, v) { try { ubUP_().setProperty(k, JSON.stringify(v)); } catch (e) {} }
function ubMode_() { var m = String(ubSP_().getProperty('USER_BRIEF') || 'dry').trim().toLowerCase(); return m === 'on' || m === 'off' ? m : 'dry'; }
function ubMailCap_() { var n = parseInt(ubSP_().getProperty('USER_BRIEF_MAX_MAILS'), 10); return n > 0 ? n : MAX_MAILS_PER_DAY; }
function ubMailCount_(day) { return Number(ubGet_('ub_mails|' + day, 0)) || 0; }
function ubMailInc_(day) { ubSet_('ub_mails|' + day, ubMailCount_(day) + 1); }
function ubCleanup_(M) {
  if (ubGet_('ub_clean') === M.day) return;
  var UP = ubUP_(), cut = ymdAdd_(M.day, -8);
  UP.getKeys().forEach(function (k) { var m = /^(ub|ub_mails|ub_sum|ub_errmail|ub_am|ubt_all)\|(\d{4}-\d{2}-\d{2})/.exec(k); if (m && m[2] < cut) UP.deleteProperty(k); });
  ubSet_('ub_clean', M.day);
}
function manila_(d) {
  d = d || new Date();
  return { day: Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), hm: Utilities.formatDate(d, TZ, 'HH:mm'),
           dow: (parseInt(Utilities.formatDate(d, TZ, 'u'), 10) || 7) % 7,        /* 'u': 1 = Monday … 7 = Sunday → JS 0 = Sunday */
           label: Utilities.formatDate(d, TZ, 'EEE d MMM'), ms: d.getTime() };
}
function ymdAdd_(day, n) { var p = String(day).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)).toISOString().slice(0, 10); }
function dayDiff_(a, b) { var A = String(a).split('-'), B = String(b).split('-'); return Math.round((Date.UTC(+A[0], +A[1] - 1, +A[2]) - Date.UTC(+B[0], +B[1] - 1, +B[2])) / 86400000); }
function pad2_(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
function hmNorm_(t) { var m = /^(\d{1,2}):(\d{2})/.exec(String(t == null ? '' : t).trim()); if (!m || +m[1] > 23 || +m[2] > 59) return ''; return pad2_(+m[1]) + ':' + m[2]; }
function ubParse_(v, fb) { if (v == null) return fb; if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return fb; } } return v == null ? fb : v; }
function lc_(x) { return String(x == null ? '' : x).trim().toLowerCase(); }
function keyUser_(u) { return lc_(u).replace(/[^a-z0-9_.-]/g, '_'); }                  /* the same in the app */
function waPropName_(u) { return 'WA_' + String(u || '').toUpperCase().replace(/[^A-Z0-9]/g, '_'); }
function arr_(v) { return Array.isArray(v) ? v : []; }
function clip_(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function ubHash_(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0; } return h.toString(16); }
/* a reason that may be shown in Nexi: no address, no phone number, no key */
function scrubWhy_(s, phone, key, n) {
  s = (s && typeof s === 'object' && s.message) ? String(s.message) : String(s == null ? '' : s);
  s = s.replace(/<[^>]*>/g, ' ');
  if (phone) s = s.split(String(phone)).join('…');
  if (key) s = s.split(String(key)).join('…');
  s = s.replace(/[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+/g, '<address>').replace(/\+?\d[\d\s-]{6,}\d/g, '<number>').replace(/api\s?key/ig, 'key');
  return s.replace(/\s+/g, ' ').trim().slice(0, n || 120);
}
