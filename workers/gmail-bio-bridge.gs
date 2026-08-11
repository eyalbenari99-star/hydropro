/** Nexi ⇄ NGTeco Office bridge — Google Apps Script
 *
 * Runs under nexi@abapardes.com.ph. NGTeco Office is set to email its
 * scheduled attendance/timecard report (Excel) to that inbox daily.
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
var SEARCH = 'has:attachment (from:ngteco.com OR subject:attendance OR subject:timecard OR subject:report) -label:nexi-done newer_than:7d';

function runBridge() {
  var label = GmailApp.getUserLabelByName('nexi-done') || GmailApp.createLabel('nexi-done');
  var threads = GmailApp.search(SEARCH, 0, 20);
  threads.forEach(function (thread) {
    var punches = [];
    thread.getMessages().forEach(function (msg) {
      msg.getAttachments().forEach(function (att) {
        var name = String(att.getName() || '').toLowerCase();
        if (!/\.xlsx?$/.test(name)) return;
        try { punches = punches.concat(parseExcel(att)); }
        catch (e) { Logger.log('parse fail ' + name + ': ' + e); }
      });
    });
    if (punches.length) {
      var res = UrlFetchApp.fetch(BIO_URL + '/bio/import', {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + BIO_TOKEN },
        payload: JSON.stringify({ punches: punches, sn: 'NGTECO-OFFICE' }),
        muteHttpExceptions: true,
      });
      Logger.log('imported ' + punches.length + ' → ' + res.getResponseCode() + ' ' + res.getContentText());
      if (res.getResponseCode() !== 200) return; // retry next run, no label
    }
    thread.addLabel(label);
  });
}

/* Excel attachment → rows, via Drive convert-to-Sheet */
function parseExcel(att) {
  var file = Drive.Files.insert(
    { title: 'nexi-tmp-' + Date.now(), mimeType: MimeType.GOOGLE_SHEETS },
    att.copyBlob(), { convert: true });
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
    if (id && /^\d+$/.test(id)) lastId = id;
    var date = '';
    if (dateCol >= 0) date = normDate(row[dateCol]);
    if (!date) { // hunt any cell that looks like a date
      for (var c2 = 0; c2 < row.length; c2++) { date = normDate(row[c2]); if (date) break; }
    }
    if (date) lastDate = date;
    if (!lastId || !lastDate) continue;
    var seen = {};
    for (var c3 = 0; c3 < row.length; c3++) {
      var times = String(row[c3]).match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
      times.forEach(function (t) {
        if (t.length === 4) t = '0' + t;
        if (seen[t]) return; seen[t] = 1;
        punches.push({ userId: lastId, ts: lastDate + ' ' + t + ':00' });
      });
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
