/** Nexi ☀️ Morning Brief — Google Apps Script (v2, one brief per person)
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
var BRIEF_HOUR = 6;                     // 06:00 Asia/Manila
var TZ         = 'Asia/Manila';

/* One brief per person, each with their own calendar and their own sections.
   sections: calendar | attendance | checklist | calls | requests (waiting for
   approval — for approvers) | release_queue (approved, waiting to be handed
   out — for the warehouse) | my_calls (open calls assigned to this person,
   matched by the `match` pattern against assignee names).
   To add a person: add a row and share their calendar with nexi once. */
var RECIPIENTS = [
  { name: 'Eyal', to: 'eyalbenari99@gmail.com', cc: 'eyal@abapardes.com.ph',
    calendars: ['eyal@abapardes.com.ph', 'nexi@abapardes.com.ph'],
    sections: ['calendar', 'attendance', 'checklist', 'calls', 'requests'] },
  { name: 'Chen', to: 'cheriet@abapardes.com.ph',
    calendars: ['cheriet@abapardes.com.ph'],
    match: /chen|cheriet/i,
    sections: ['calendar', 'release_queue', 'my_calls', 'checklist'] }
];

/* ---------------- install / self-heal ---------------- */

function installMorningBrief() {
  ensureTrigger_();
  nexiMorningBrief();                   // send one now so setup is verifiable
}

function ensureTrigger_() {
  var have = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'nexiMorningBrief';
  });
  if (!have) {
    ScriptApp.newTrigger('nexiMorningBrief')
      .timeBased().everyDays(1).atHour(BRIEF_HOUR).inTimezone(TZ).create();
  }
}

/* ---------------- the brief ---------------- */

function nexiMorningBrief() {
  ensureTrigger_();
  var data = null, pullErr = null;
  try { data = pullCloud_(); } catch (e) { pullErr = e; }
  var today = Utilities.formatDate(new Date(), TZ, 'EEE d MMM yyyy');
  RECIPIENTS.forEach(function (rc) {
    try {
      if (pullErr) throw pullErr;
      GmailApp.sendEmail(rc.to, '☀️ Nexi Morning Brief — ' + today,
        'Open this e-mail in an HTML mail client.',
        { htmlBody: buildBrief_(data, rc), cc: rc.cc || '', name: 'Nexi · HydroNexis-AI' });
    } catch (e) {
      GmailApp.sendEmail(RECIPIENTS[0].to, '⚠ Nexi Morning Brief failed for ' + rc.name,
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

function buildBrief_(data, rc) {
  var mk = {
    calendar:      function () { return calendarSection_(rc.calendars || []); },
    attendance:    function () { return attendanceSection_(data); },
    checklist:     function () { return checklistSection_(data); },
    calls:         function () { return callsSection_(data); },
    requests:      function () { return requestsSection_(data); },
    release_queue: function () { return releaseQueueSection_(data); },
    my_calls:      function () { return myCallsSection_(data, rc); }
  };
  var s = (rc.sections || []).map(function (k) { return mk[k] ? mk[k]() : ''; });
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
function esc_(x) {
  return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* 📅 today's events from both calendars; a calendar that cannot be read says so */
function calendarSection_(calIds) {
  var out = [h_('📅', "Today's calendar")];
  var start = new Date(); start.setHours(0, 0, 0, 0);
  var end = new Date(start.getTime() + 86400000);
  var any = false;
  (calIds || []).forEach(function (id) {
    try {
      var cal = CalendarApp.getCalendarById(id);
      if (!cal) { out.push('<div style="color:#c62828;">' + esc_(id) + ' — not shared with nexi yet (share it once in Google Calendar settings)</div>'); return; }
      var evs = cal.getEvents(start, end);
      if (!evs.length) return;
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
  if (!any) out.push('<div style="color:#777;">No events today.</div>');
  return out.join('');
}

/* ⏰ punches so far this morning + who has nothing yet */
function attendanceSection_(data) {
  var att = store_(data, 'hydroPro_attendance', {});
  var emps = store_(data, 'hydroPro_employees', []);
  var today = att[day_(0)] || {};
  var active = emps.filter(function (e) { return e && e.status !== 'inactive' && !e.separated; });
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
