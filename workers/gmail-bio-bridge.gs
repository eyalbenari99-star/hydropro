/** Nexi ⇄ NGTeco bridge — Google Apps Script (v16.15 "once and for all")
 *
 * Runs under nexi@abapardes.com.ph. The NGTeco clock e-mails its scheduled
 * attendance report here; this script parses it and posts the punches to the
 * nexi-bio Cloudflare worker, which fills attendance in HydroNexis.
 *
 * Everything that broke this chain before is now handled here:
 *
 *  1. LATE OUT-SCANS. A report produced before closing time contains arrivals
 *     only. The worker de-duplicates punches by user+timestamp, so re-sending
 *     a report is free — this script therefore RE-IMPORTS the newest report on
 *     every run and every report of the last RESCAN_DAYS days once a day. When
 *     a later report carries the out-scans, they simply appear.
 *  2. THREADED REPORTS. NGTeco groups every report under one subject, so Gmail
 *     files them in one thread. Nothing is keyed on threads or labels: each
 *     MESSAGE is handled on its own.
 *  3. SILENT DEATH. Every run posts a heartbeat, so the app can tell
 *     "the bridge is dead" apart from "the clock stopped sending".
 *  4. NO REPORT ARRIVING. If the newest report is older than ALERT_AFTER_H
 *     hours, the script e-mails a warning once a day — nobody has to notice
 *     by accident days later.
 *  5. LOST TRIGGER. Every run makes sure the 15-minute trigger still exists
 *     and re-creates it if it does not.
 *
 * SETUP (one time, at script.google.com under the nexi account):
 *   1. Paste this file over Code.gs and Save.
 *   2. Services (+) → add "Drive API" (advanced service).
 *   3. Run  installBridge  once → grant permissions. It creates the trigger.
 *      (Nothing else to do: it heals itself from then on.)
 */

var BIO_URL   = 'https://nexi-bio.eyalbenari99.workers.dev';
var BIO_TOKEN = 'PASTE-BIO_TOKEN-HERE';           // ← the worker's BIO_TOKEN
var ALERT_TO  = 'eyalbenari99@gmail.com, nexi@abapardes.com.ph';

var SEARCH        = 'has:attachment (from:ngteco.com OR from:zkteco.in OR from:zkteco.com OR subject:attendance OR subject:timecard OR subject:report OR subject:export) newer_than:7d';
var RESCAN_DAYS   = 3;      // reports this recent are re-imported once a day
var ALERT_AFTER_H = 20;     // no report for this long → warning e-mail
var EVERY_MIN     = 15;     // trigger interval

var P_DONE   = 'nexi_done_msg_ids';
var P_RESCAN = 'nexi_last_rescan';
var P_ALERT  = 'nexi_last_alert';
var P_SEEN   = 'nexi_last_report_at';
var DONE_MAX = 400;

/* ---------- one-time setup + self-healing trigger ---------- */
function installBridge() {
  ensureTrigger();
  runBridge();
  Logger.log('Bridge installed. Trigger runs every ' + EVERY_MIN + ' minutes.');
}
function ensureTrigger() {
  try {
    var has = ScriptApp.getProjectTriggers().some(function (t) {
      return t.getHandlerFunction() === 'runBridge';
    });
    if (!has) {
      ScriptApp.newTrigger('runBridge').timeBased().everyMinutes(EVERY_MIN).create();
      Logger.log('trigger was missing — re-created');
    }
  } catch (e) { Logger.log('ensureTrigger: ' + e); }
}

/* ---------- main ---------- */
function runBridge() {
  ensureTrigger();
  var props = PropertiesService.getScriptProperties();
  var done = _doneIds(), doneSet = {};
  done.forEach(function (id) { doneSet[id] = 1; });

  /* once a day, forget the last few days so late out-scans are re-imported */
  var today = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  var rescan = props.getProperty(P_RESCAN) !== today;
  if (rescan) props.setProperty(P_RESCAN, today);

  var msgs = [];
  GmailApp.search(SEARCH, 0, 30).forEach(function (thread) {
    thread.getMessages().forEach(function (m) { msgs.push(m); });
  });
  msgs.sort(function (a, b) { return a.getDate() - b.getDate(); });

  var cutoff = new Date(Date.now() - RESCAN_DAYS * 86400000);
  var newest = msgs.length ? msgs[msgs.length - 1] : null;
  var newestId = newest ? newest.getId() : '';

  var justDone = [], imported = 0, posted = 0;
  msgs.forEach(function (msg) {
    var mid = msg.getId();
    var fresh = !doneSet[mid];
    var replay = (rescan && msg.getDate() >= cutoff) || mid === newestId;
    if (!fresh && !replay) return;              /* already imported, nothing new to gain */

    var punches = [];
    msg.getAttachments().forEach(function (att) {
      var name = String(att.getName() || '').toLowerCase();
      try {
        if (/\.xlsx?$/.test(name)) punches = punches.concat(parseExcel(att));
        else if (/\.csv$/.test(name)) punches = punches.concat(parseCsvAtt(att));
      } catch (e) { Logger.log('parse fail ' + name + ': ' + e); }
    });
    if (!punches.length) {
      if (fresh) justDone.push(mid);
      Logger.log('no punches in ' + mid + ' (' + msg.getSubject() + ')');
      return;
    }
    var res = post('/bio/import', { punches: punches, sn: 'NGTECO-OFFICE' });
    Logger.log((fresh ? 'imported ' : 'RE-imported ') + punches.length + ' from ' +
               Utilities.formatDate(msg.getDate(), 'Asia/Manila', 'yyyy-MM-dd HH:mm') +
               ' → ' + res);
    if (res === 200) {
      posted++; imported += punches.length;
      if (fresh) justDone.push(mid);
      props.setProperty(P_SEEN, String(msg.getDate().getTime()));
    }
  });
  if (justDone.length) _markDone(justDone);

  /* heartbeat: proves the bridge itself is alive even when no report came */
  post('/bio/import', { punches: [], sn: 'GMAIL-BRIDGE' });

  watchdog(props, newest);
  Logger.log('run complete — ' + posted + ' report(s) posted, ' + imported + ' punch(es)');
}

/* ---------- warn when reports stop arriving ---------- */
function watchdog(props, newest) {
  try {
    var lastAt = newest ? newest.getDate().getTime() : Number(props.getProperty(P_SEEN) || 0);
    if (!lastAt) return;
    var ageH = (Date.now() - lastAt) / 3600000;
    if (ageH < ALERT_AFTER_H) return;
    var today = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
    if (props.getProperty(P_ALERT) === today) return;   /* one warning a day */
    props.setProperty(P_ALERT, today);
    MailApp.sendEmail(ALERT_TO,
      '⚠ NGTeco attendance report has not arrived for ' + Math.round(ageH) + ' hours',
      'The Nexi bridge is running normally, but no timecard report has reached ' +
      'nexi@abapardes.com.ph since ' +
      Utilities.formatDate(new Date(lastAt), 'Asia/Manila', 'yyyy-MM-dd HH:mm') + '.\n\n' +
      'Attendance in HydroNexis cannot fill past that date until a report arrives.\n\n' +
      'Check, in this order:\n' +
      '  1. The clock is powered and on Wi-Fi.\n' +
      '  2. NGTeco Office → the scheduled report is still enabled and addressed to ' +
      'nexi@abapardes.com.ph.\n' +
      '  3. The report is scheduled AFTER closing time (23:30) — a report made earlier ' +
      'can never contain that day\'s time-out scans.\n\n' +
      'This message is sent once a day while the reports are missing.');
    Logger.log('watchdog alert sent (' + Math.round(ageH) + 'h)');
  } catch (e) { Logger.log('watchdog: ' + e); }
}

function post(path, payload) {
  try {
    var res = UrlFetchApp.fetch(BIO_URL + path, {
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + BIO_TOKEN },
      payload: JSON.stringify(payload), muteHttpExceptions: true,
    });
    return res.getResponseCode();
  } catch (e) { Logger.log('post ' + path + ': ' + e); return 0; }
}

function _doneIds() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(P_DONE);
    var a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function _markDone(ids) {
  try {
    var a = _doneIds().concat(ids);
    if (a.length > DONE_MAX) a = a.slice(a.length - DONE_MAX);
    PropertiesService.getScriptProperties().setProperty(P_DONE, JSON.stringify(a));
  } catch (e) {}
}

/* ---------- attachments → rows ---------- */
function parseCsvAtt(att) {
  var rows = Utilities.parseCsv(att.getDataAsString('UTF-8'));
  return parseRows(rows.map(function (r) { return r.map(String); }));
}

/* Excel → rows via Drive convert-to-Sheet (works with Drive API v2 and v3) */
function parseExcel(att) {
  var file = Drive.Files.insert
    ? Drive.Files.insert(
        { title: 'nexi-tmp-' + Date.now(), mimeType: MimeType.GOOGLE_SHEETS },
        att.copyBlob(), { convert: true })
    : Drive.Files.create(
        { name: 'nexi-tmp-' + Date.now(), mimeType: MimeType.GOOGLE_SHEETS },
        att.copyBlob());
  try {
    var ss = SpreadsheetApp.openById(file.id);
    var out = [];
    ss.getSheets().forEach(function (sh) {
      out = out.concat(parseRows(sh.getDataRange().getDisplayValues()));
    });
    return out;
  } finally {
    try { Drive.Files.remove(file.id); } catch (e) {}
  }
}

/* Header-aware parser. Only true punch columns are read: a report carrying a
   TIMETABLE / schedule column used to import 08:00 and 09:30 as if they were
   scans. Schedule and summary columns are ignored outright, and if a sheet has
   no punch columns nothing is imported from it — better than fake punches. */
var PUNCH_RE = /(clock|check|punch|time)\s*(in|out)|^(in|out)$|^(am|pm)\s*(in|out)$|punch\s*time|swipe/;
var SKIP_RE  = /timetable|time\s*table|schedule|shift|duty|roster|break|required|expected|standard|late|early|absent|leave|overtime|\bot\b|total|work\s*(time|hour)|duration|hours|remark|status|approve|note|department|position/;

function parseRows(rows) {
  var punches = [];
  var idCol = -1, dateCol = -1, header = -1, punchCols = [], skipCols = {};
  function norm(v) { return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim(); }
  for (var r = 0; r < Math.min(rows.length, 15); r++) {
    var lid = -1, ldate = -1, lp = [], lskip = {};
    for (var c = 0; c < rows[r].length; c++) {
      var v = norm(rows[r][c]);
      if (!v) continue;
      if (lid < 0 && (/(person|employee|user)?\s*id\b|emp no|no\./.test(v)) && v.length < 20) lid = c;
      if (ldate < 0 && /^date\b|att.*date|work date|punch date/.test(v)) ldate = c;
      if (SKIP_RE.test(v)) { lskip[c] = 1; continue; }
      if (PUNCH_RE.test(v)) lp.push(c);
    }
    if (lid >= 0) { idCol = lid; header = r; if (ldate >= 0) dateCol = ldate; punchCols = lp; skipCols = lskip; break; }
  }
  if (header < 0) { Logger.log('parseRows: no header row found'); return punches; }
  Logger.log('parseRows: idCol=' + idCol + ' dateCol=' + dateCol +
             ' punchCols=[' + punchCols.join(',') + '] skipped=[' + Object.keys(skipCols).join(',') + ']');
  if (!punchCols.length) {
    Logger.log('parseRows: NO clock-in/out columns in this sheet — skipped so schedule times are never imported as punches');
    return punches;
  }
  var lastId = '', lastDate = '';
  for (var r2 = header + 1; r2 < rows.length; r2++) {
    var row = rows[r2];
    if (!row) continue;
    var id = idCol >= 0 ? String(row[idCol] == null ? '' : row[idCol]).trim() : '';
    if (id && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) lastId = id;
    var date = '';
    if (dateCol >= 0) date = normDate(row[dateCol]);
    if (!date) {
      for (var c2 = 0; c2 < row.length; c2++) {
        if (skipCols[c2]) continue;
        date = normDate(row[c2]); if (date) break;
      }
    }
    if (date) lastDate = date;
    if (!lastId || !lastDate) continue;
    var seen = {};
    punchCols.forEach(function (c3) {
      var cell = String(row[c3] == null ? '' : row[c3]);
      if (!cell) return;
      var re = /\b(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\s*([AaPp])\.?\s*[Mm]?\.?\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/g, m;
      while ((m = re.exec(cell))) {
        var hh, mm;
        if (m[3] !== undefined && m[1] !== undefined) {
          hh = Number(m[1]) % 12; mm = m[2];
          if (/p/i.test(m[3])) hh += 12;
        } else { hh = Number(m[4]); mm = m[5]; }
        if (hh > 23) continue;
        var t = ('0' + hh).slice(-2) + ':' + mm;
        if (seen[t]) continue; seen[t] = 1;
        punches.push({ userId: lastId, ts: lastDate + ' ' + t + ':00' });
      }
    });
  }
  Logger.log('parseRows: ' + punches.length + ' punch(es) extracted');
  return punches;
}

function normDate(v) {
  v = String(v || '').trim();
  var m = v.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (m) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
  m = v.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/); // MM/DD/YYYY (NGTeco US format)
  if (m) return m[3] + '-' + pad(m[1]) + '-' + pad(m[2]);
  return '';
}
function pad(n) { return ('0' + n).slice(-2); }
