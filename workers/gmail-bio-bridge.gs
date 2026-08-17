/** Nexi ⇄ NGTeco Office bridge — Google Apps Script
 *
 * Runs under nexi@abapardes.com.ph. NGTeco Office is set to email its
 * scheduled attendance/timecard report (Excel or CSV) to that inbox daily.
 * This script (time-driven trigger, every 30 min):
 *   1. finds unprocessed NGTeco report emails,
 *   2. converts the Excel attachment to a Google Sheet and reads it,
 *   3. extracts (person ID, date, clock times) with tolerant parsing,
 *   4. POSTs the punches to the nexi-bio Cloudflare worker /bio/import,
 *   5. labels the email "nexi-done" so it is never processed twice.
 * From there the existing pipeline takes over: Nexi IT → Biometric Sync
 * maps person IDs to employees and fills attendance automatically.
 *
 * SETUP (one time, in script.google.com under the nexi account):
 *   1. Paste this file. Fill in BIO_URL + BIO_TOKEN below.
 *   2. Services (left sidebar “+”) → add “Drive API” (Advanced service).
 *   3. Triggers (clock icon) → Add Trigger → runBridge → time-driven →
 *      minutes timer → every 30 minutes.
 *   4. Run runBridge once manually to grant permissions.
 */

var BIO_URL = 'https://nexi-bio.YOUR-ACCOUNT.workers.dev'; // ← fill in
var BIO_TOKEN = 'PASTE-BIO_TOKEN-HERE';                    // ← fill in
/* v15.82: NGTeco/ZKTeco groups every report under one subject ("Timecard
   Export"), so Gmail puts them in ONE THREAD. The old query excluded whole
   threads carrying the nexi-done label — once the first report was processed,
   every later report in that thread was skipped forever. Now: no label
   exclusion, and each MESSAGE is remembered by id so nothing repeats.
   Sender widened too: the mail actually comes from @zkteco.in. */
var SEARCH = 'has:attachment (from:ngteco.com OR from:zkteco.in OR from:zkteco.com OR subject:attendance OR subject:timecard OR subject:report OR subject:export) newer_than:14d';
var DONE_PROP = 'nexi_done_msg_ids';
var DONE_MAX = 400;

function _doneIds() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(DONE_PROP);
    var a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
function _markDone(ids) {
  try {
    var a = _doneIds().concat(ids);
    if (a.length > DONE_MAX) a = a.slice(a.length - DONE_MAX);
    PropertiesService.getScriptProperties().setProperty(DONE_PROP, JSON.stringify(a));
  } catch (e) {}
}

function runBridge() {
  var label = GmailApp.getUserLabelByName('nexi-done') || GmailApp.createLabel('nexi-done');
  var done = _doneIds(), doneSet = {};
  done.forEach(function (id) { doneSet[id] = 1; });
  var threads = GmailApp.search(SEARCH, 0, 30);
  var justDone = [];
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (msg) {
      var mid = msg.getId();
      if (doneSet[mid]) return;                 /* this exact report already imported */
      var punches = [];
      msg.getAttachments().forEach(function (att) {
        var name = String(att.getName() || '').toLowerCase();
        try {
          if (/\.xlsx?$/.test(name)) punches = punches.concat(parseExcel(att));
          else if (/\.csv$/.test(name)) punches = punches.concat(parseCsvAtt(att));
        }
        catch (e) { Logger.log('parse fail ' + name + ': ' + e); }
      });
      if (!punches.length) {                    /* nothing to send (e.g. empty report) */
        justDone.push(mid);
        Logger.log('no punches in message ' + mid + ' (' + msg.getSubject() + ')');
        return;
      }
      var res = UrlFetchApp.fetch(BIO_URL + '/bio/import', {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + BIO_TOKEN },
        payload: JSON.stringify({ punches: punches, sn: 'NGTECO-OFFICE' }),
        muteHttpExceptions: true,
      });
      Logger.log('imported ' + punches.length + ' \u2192 ' + res.getResponseCode() + ' ' + res.getContentText());
      if (res.getResponseCode() === 200) justDone.push(mid);   /* retry next run if not 200 */
    });
    try { thread.addLabel(label); } catch (e) {}               /* label = visual marker only */
  });
  if (justDone.length) _markDone(justDone);
}

/* CSV attachment → rows (the NGTeco clock's automatic email format) */
function parseCsvAtt(att) {
  var txt = att.getDataAsString('UTF-8');
  var rows = Utilities.parseCsv(txt);
  return parseRows(rows.map(function (r) { return r.map(String); }));
}

/* Excel attachment → rows, via Drive convert-to-Sheet.
   v15.57: works with the Drive advanced service in BOTH v2 and v3 —
   v2 has Drive.Files.insert, v3 renamed it to Drive.Files.create. */
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

/* Tolerant parser: find the header row, then per data row take the person
   ID, the date, and EVERY HH:MM time in the row as punches of that day. */
function parseRows(rows) {
  var punches = [];
  var idCol = -1, dateCol = -1, header = -1;
  for (var r = 0; r < Math.min(rows.length, 12); r++) {
    for (var c = 0; c < rows[r].length; c++) {
      var v = String(rows[r][c]).toLowerCase().replace(/\s+/g, ' ').trim();
      if (idCol < 0 && /(person|employee|user)?\s*id\b|emp no|no\./.test(v) && v.length < 20) { idCol = c; header = r; }
      if (dateCol < 0 && /^date\b|att.*date|work date/.test(v)) { dateCol = c; header = r; }
    }
    if (idCol >= 0) break;
  }
  if (header < 0) return punches;
  var lastId = '', lastDate = '';
  for (var r2 = header + 1; r2 < rows.length; r2++) {
    var row = rows[r2];
    var id = idCol >= 0 ? String(row[idCol]).trim() : '';
    /* v15.57: IDs are alphanumeric (OFFICE001, PROD002), not only digits */
    if (id && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) lastId = id;
    var date = '';
    if (dateCol >= 0) date = normDate(row[dateCol]);
    if (!date) { // hunt any cell that looks like a date
      for (var c2 = 0; c2 < row.length; c2++) { date = normDate(row[c2]); if (date) break; }
    }
    if (date) lastDate = date;
    if (!lastId || !lastDate) continue;
    var seen = {};
    for (var c3 = 0; c3 < row.length; c3++) {
      /* v15.57: NGTeco reports use 12-hour times (06:43:29 AM / 02:30 PM) —
         capture optional seconds + AM/PM and normalize to 24-hour */
      var re = /\b(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\s*([AaPp])\.?\s*[Mm]?\.?\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/g, m;
      var cell = String(row[c3]);
      while ((m = re.exec(cell))) {
        var hh, mm;
        if (m[3] !== undefined && m[1] !== undefined) { // 12-hour with AM/PM
          hh = Number(m[1]) % 12; mm = m[2];
          if (/p/i.test(m[3])) hh += 12;
        } else { hh = Number(m[4]); mm = m[5]; } // plain 24-hour
        if (hh > 23) continue;
        var t = ('0' + hh).slice(-2) + ':' + mm;
        if (seen[t]) continue; seen[t] = 1;
        punches.push({ userId: lastId, ts: lastDate + ' ' + t + ':00' });
      }
    }
  }
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
