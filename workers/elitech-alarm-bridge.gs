/** Nexi ⇄ Elitech ALARM-MAIL bridge — Google Apps Script (v22.96, Eyal 13 Oct 2026: "I need to connect the cold storage to set up
 *  online temp which should be in maintenance check list to check daily …")
 *
 *  ⚠ STOPGAP — and it starts in DRY RUN. The new cold-room box has an Elitech Wi-Fi controller on the Elitech iCold cloud
 *  (app "Elitech iCold", web new.i-elitech.com). iCold has an API only after an order (the "Access API document"); until it arrives
 *  the ONLY data that leaves the controller is the ALARM e-mail iCold sends when a room goes outside its alarm limits (and when it
 *  recovers / goes offline). This script reads those mails in the nexi@abapardes.com.ph inbox and posts the temperature in them to
 *  the nexi-cold worker (POST /cold/push, node "elitech-mail"). It delivers ALARM MOMENTS ONLY — a room inside its limits sends
 *  nothing. A silent room is NOT a fine room. The technician's typed daily check (Nexi ✅ Monitoring Checklist) stays the daily reading.
 *
 *  The mail format is NOT documented and no real alarm mail has been seen yet: the parser below is written from synthetic samples.
 *  Therefore DRY_RUN defaults to '1' — the script parses, LOGS "would post CS1 13.4 °C (high) msg …", posts only a heartbeat, and lists
 *  what it would have posted in its daily mail. Set DRY_RUN to 0 only after one real alarm mail was checked (owner checklist step 12),
 *  and forward that mail to the developer so the parser test uses the real format.
 *
 *  Runs under nexi@abapardes.com.ph (the alarm e-mails of the iCold account go there).
 *
 *  How it works (patterns of proleaf-alarm-bridge.gs / gmail-bio-bridge.gs):
 *   1. Every 15 minutes (self-healing trigger) it searches ELITECH_SEARCH (default below) and once a day the last 3 days again; it looks
 *      at every MESSAGE of every thread and skips the ids already done (cold_done_msg_ids, the last 400).
 *   2. parseElitechMail(subject, body, date, id, COLD_MAP) — pure:
 *        room   = the LONGEST COLD_MAP device name found in the text (case-insensitive) — "Cold storage 10" is not "Cold storage 1";
 *        fault  = offline / disconnected → counted for the daily mail, nothing posted;
 *        kind   = recovered · high · low · alarm;
 *        value  = the °C figure on the "current / temperature / reading" line; a figure on a "limit / upper / lower / threshold /
 *                 setpoint / range" line is never taken; if no line says which, it is taken only when exactly one figure is left;
 *        −40 … 60 °C only.
 *   3. Time = the mail's date; the worker clamps a future time and refuses anything older than 7 days.
 *   4. DRY_RUN '0': posts at most 200 readings per push {room, ts, t, src:'elitech-mail', alarm, msgId}; an id is marked done only on
 *      HTTP 200; a heartbeat {readings:[]} goes on runs with nothing to post. DRY_RUN '1': only the heartbeat; parsed ids are marked
 *      done so the log does not repeat.
 *   5. At most one mail a day: when no Elitech mail came for 24 h ("a silent room is not a fine room") and/or what was "would post /
 *      unmapped / ambiguous / faults / refused".
 *
 *  SETUP (one time, at script.google.com under the nexi account) — the owner / IT checklist steps 11–12:
 *   1. New project → paste this file over Code.gs → Save.
 *   2. Project Settings → Script Properties (NEVER in the code):
 *        COLD_URL         https://nexi-cold.eyalbenari99.workers.dev        (default if empty)
 *        COLD_NODE_TOKEN  the token of the node "elitech-mail" in the worker's NODE_TOKENS
 *        COLD_MAP         {"Cold storage 1":"CS1","Cold storage 2":"CS2"}   (device names exactly as in the iCold app)
 *        ALERT_TO         company addresses (comma-separated)
 *        ELITECH_SEARCH   optional Gmail search; default below
 *        DRY_RUN          1   (0 only after one real alarm mail was checked)
 *   3. Run  installBridge  once → grant permissions. It creates the trigger and heals it from then on.
 */

var P_URL = 'COLD_URL', P_TOKEN = 'COLD_NODE_TOKEN', P_MAP = 'COLD_MAP', P_TO = 'ALERT_TO', P_SEARCH = 'ELITECH_SEARCH', P_DRY = 'DRY_RUN';
var P_DONE = 'cold_done_msg_ids', P_RESCAN = 'cold_last_rescan', P_ALERT = 'cold_last_alert', P_SEEN = 'cold_last_mail_at';
var DEFAULT_URL = 'https://nexi-cold.eyalbenari99.workers.dev';
var DEFAULT_SEARCH = 'from:(elitech OR i-elitech OR e-elitech OR elitechus OR icold OR icoldcloud) newer_than:2d';
var EVERY_MIN = 15, ALERT_AFTER_H = 24, DONE_MAX = 400, MAX_PER_PUSH = 200;

function cfg() {
  var p = PropertiesService.getScriptProperties();
  var map = {};
  try { var o = JSON.parse(p.getProperty(P_MAP) || '{}'); Object.keys(o).forEach(function (k) { var r = String(o[k] || '').trim().toUpperCase(); if (/^CS\d{1,3}$/.test(r) && String(k).trim()) map[String(k).trim()] = r; }); } catch (e) { Logger.log('COLD_MAP is not JSON: ' + e); }
  var search = String(p.getProperty(P_SEARCH) || '').trim() || DEFAULT_SEARCH;
  var dry = String(p.getProperty(P_DRY) == null ? '1' : p.getProperty(P_DRY)).trim() !== '0';
  return { url: (p.getProperty(P_URL) || DEFAULT_URL).replace(/\/+$/, ''), token: p.getProperty(P_TOKEN) || '', map: map, to: p.getProperty(P_TO) || '', search: search, dry: dry };
}

/* ---------- one-time setup + self-healing trigger ---------- */
function installBridge() {
  ensureTrigger();
  runBridge();
  Logger.log('Elitech alarm bridge installed. Trigger runs every ' + EVERY_MIN + ' minutes. ' + (cfg().dry ? 'DRY RUN — nothing is posted until DRY_RUN = 0.' : 'LIVE — readings are posted.'));
}
function ensureTrigger() {
  try {
    var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'runBridge'; });
    if (!has) { ScriptApp.newTrigger('runBridge').timeBased().everyMinutes(EVERY_MIN).create(); Logger.log('trigger was missing — re-created'); }
  } catch (e) { Logger.log('ensureTrigger: ' + e); }
}

/* ---------- the parser (pure; node tests it from tests/workers/elitech-bridge.test.mjs) ---------- */
var LIMIT_RE = /limit|upper|lower|threshold|set ?point|setting|range|上限|下限|阈值|设定/i;
var CURRENT_RE = /current|temp(erature)?|reading|value|实时|当前|温度/i;
function parseElitechMail(subject, body, msgDate, msgId, map) {
  var text = (String(subject || '') + '\n' + String(body || '')).replace(/：/g, ':').replace(/℃/g, '°C').replace(/－/g, '-').replace(/\r/g, '');
  var low = text.toLowerCase(), room = '', best = -1;
  Object.keys(map || {}).forEach(function (k) {
    var key = String(k).trim().toLowerCase(); if (!key) return;
    var i = low.indexOf(key);
    while (i >= 0) {
      var after = low.charAt(i + key.length);
      if (!/[0-9]/.test(after) || /[0-9]$/.test(key) === false) { if (key.length > best) { best = key.length; room = map[k]; } break; }
      i = low.indexOf(key, i + 1);
    }
  });
  if (!room) return { skip: 'unmapped device' };
  if (/offline|disconnect|离线|掉线/i.test(text)) return { fault: 'offline', room: room, msgId: msgId };
  var kind = /recover|normal|restor|恢复/i.test(text) ? 'recovered' : /high|over|upper|超上限|高温/i.test(text) ? 'high' : /low|under|lower|超下限|低温/i.test(text) ? 'low' : 'alarm';
  var lines = text.split('\n'), cands = [];
  lines.forEach(function (ln) {
    var re = /(-?\d+(?:\.\d+)?)\s*°\s*C/g, m;
    while ((m = re.exec(ln))) {
      var before = ln.slice(Math.max(0, m.index - 12), m.index);
      cands.push({ v: Number(m[1]), line: ln, limit: LIMIT_RE.test(before) || LIMIT_RE.test(segmentOf(ln, m.index)), current: CURRENT_RE.test(segmentOf(ln, m.index)) });
    }
  });
  var left = cands.filter(function (c) { return !c.limit; });
  var cur = left.filter(function (c) { return c.current; });
  var pick = null;
  if (cur.length === 1) pick = cur[0];
  else if (cur.length > 1) { var vs = cur.map(function (c) { return c.v; }); pick = vs.every(function (v) { return v === vs[0]; }) ? cur[0] : null; }
  else if (left.length === 1) pick = left[0];
  if (!pick) return { skip: 'ambiguous value', room: room };
  if (!(pick.v >= -40 && pick.v <= 60)) return { skip: 'out of range', room: room };
  var ts = msgDate ? new Date(msgDate).toISOString() : new Date().toISOString();
  return { room: room, t: Math.round(pick.v * 10) / 10, ts: ts, alarm: kind, msgId: msgId };
}
/* the part of a line around a figure that belongs to it: from the previous separator ("/", "|", ";", ",", "，", "；") to the figure */
function segmentOf(line, idx) {
  var head = line.slice(0, idx), cut = Math.max(head.lastIndexOf('/'), head.lastIndexOf('|'), head.lastIndexOf(';'), head.lastIndexOf('，'), head.lastIndexOf('；'), head.lastIndexOf('°C'));
  return cut >= 0 ? head.slice(cut + 1) : head;
}
function testParse() {
  var map = { 'Cold storage 1': 'CS1', 'Cold storage 2': 'CS2' };
  Logger.log(JSON.stringify(parseElitechMail('Elitech alarm', 'Current temperature: 13.4℃ / Upper limit: 8.0℃ / Cold storage 1', new Date(), 'synthetic-1', map)));
  Logger.log(JSON.stringify(parseElitechMail('设备报警', '设备：Cold storage 2 当前温度：1.5℃ 下限：4.0℃ 低温报警', new Date(), 'synthetic-2', map)));
  Logger.log(JSON.stringify(parseElitechMail('Elitech', 'Cold storage 1 device offline', new Date(), 'synthetic-3', map)));
}

/* ---------- main ---------- */
function runBridge() {
  ensureTrigger();
  var C = cfg(), props = PropertiesService.getScriptProperties();
  if (!C.token) { Logger.log('COLD_NODE_TOKEN is not set (Script Properties) — nothing posted'); return; }
  var done = _doneIds(), doneSet = {};
  done.forEach(function (id) { doneSet[id] = 1; });
  var today = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  var rescan = props.getProperty(P_RESCAN) !== today;
  if (rescan) props.setProperty(P_RESCAN, today);
  var search = rescan ? C.search.replace(/newer_than:\d+d/, 'newer_than:3d') : C.search;

  var msgs = [];
  GmailApp.search(search, 0, 50).forEach(function (thread) { thread.getMessages().forEach(function (m) { msgs.push(m); }); });
  var readings = [], faults = {}, unmapped = 0, ambiguous = 0, newest = 0, ids = [], would = [];
  msgs.forEach(function (m) {
    var id = m.getId(), t = m.getDate() ? m.getDate().getTime() : 0;
    if (t > newest) newest = t;
    if (doneSet[id]) return;
    var r = parseElitechMail(m.getSubject(), m.getPlainBody(), m.getDate(), id, C.map);
    if (r.skip) { if (r.skip === 'unmapped device') unmapped++; else if (r.skip === 'ambiguous value') ambiguous++; Logger.log('skip ' + id + ': ' + r.skip); ids.push(id); return; }
    if (r.fault) { var k = r.room + ' ' + r.fault; faults[k] = (faults[k] || 0) + 1; ids.push(id); return; }
    var line = 'would post ' + r.room + ' ' + r.t + ' °C (' + r.alarm + ') msg ' + id;
    if (C.dry) { Logger.log(line); would.push(line); ids.push(id); return; }
    readings.push({ id: id, body: { room: r.room, ts: r.ts, t: r.t, src: 'elitech-mail', alarm: r.alarm, msgId: String(id).slice(0, 40) } });
  });
  if (newest) props.setProperty(P_SEEN, String(newest));

  /* post in slices of 200; an id is done only when its push answered 200 */
  var refused = {};
  for (var i = 0; i < readings.length; i += MAX_PER_PUSH) {
    var slice = readings.slice(i, i + MAX_PER_PUSH);
    var res = _post(C, { readings: slice.map(function (x) { return x.body; }) });
    if (res && res.ok) {
      (res.refused || []).forEach(function (f) { var x = slice[f.i]; if (x) refused[x.body.room + ' — ' + f.error] = (refused[x.body.room + ' — ' + f.error] || 0) + 1; });
      slice.forEach(function (x) { ids.push(x.id); });
      Logger.log('pushed ' + slice.length + ': stored ' + res.stored + ', duplicates ' + res.duplicates + ', refused ' + (res.refused || []).length);
    } else Logger.log('push failed — ' + (res && res.error ? res.error : 'no answer') + ' (the ids stay for the next run)');
  }
  if (!readings.length) _post(C, { readings: [] }); /* heartbeat: the bridge is alive even when no alarm came (and always in DRY RUN) */
  if (ids.length) _markDone(done, ids);
  _dailyMail(C, props, newest, faults, unmapped, ambiguous, refused, would);
}

function _post(C, body) {
  try {
    var r = UrlFetchApp.fetch(C.url + '/cold/push', { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + C.token }, payload: JSON.stringify(body), muteHttpExceptions: true });
    var code = r.getResponseCode(), txt = r.getContentText();
    if (code !== 200) { Logger.log('nexi-cold answered ' + code + ': ' + String(txt).slice(0, 200)); return { ok: false, error: 'HTTP ' + code }; }
    return JSON.parse(txt);
  } catch (e) { Logger.log('nexi-cold unreachable: ' + e); return { ok: false, error: String(e) }; }
}
function _doneIds() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(P_DONE) || '[]'); } catch (e) { return []; } }
function _markDone(done, ids) {
  var all = done.concat(ids); if (all.length > DONE_MAX) all = all.slice(all.length - DONE_MAX);
  PropertiesService.getScriptProperties().setProperty(P_DONE, JSON.stringify(all));
}
/* at most one mail a day: silence for 24 h, and what the bridge saw */
function _dailyMail(C, props, newest, faults, unmapped, ambiguous, refused, would) {
  var last = Number(props.getProperty(P_SEEN) || newest || 0), hours = last ? Math.round((Date.now() - last) / 3600e3) : null;
  var lines = [];
  if (would.length) lines.push('DRY RUN — would post (' + would.length + '): ' + would.slice(0, 20).join('; '));
  if (unmapped) lines.push('Unmapped device (add it to COLD_MAP, the name exactly as in the iCold app): ' + unmapped);
  if (ambiguous) lines.push('Ambiguous value (forward one of these mails to the developer): ' + ambiguous);
  var fk = Object.keys(faults); if (fk.length) lines.push('Faults seen (not posted): ' + fk.map(function (k) { return k + ' ×' + faults[k]; }).join('; '));
  var rk = Object.keys(refused); if (rk.length) lines.push('Refused by nexi-cold: ' + rk.map(function (k) { return k + ' ×' + refused[k]; }).join('; '));
  var silent = hours === null || hours >= ALERT_AFTER_H;
  if (!silent && !lines.length) return;
  var today = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  if (props.getProperty(P_ALERT) === today) return;
  if (!C.to) { Logger.log('ALERT_TO not set — would mail: ' + lines.join(' | ')); return; }
  props.setProperty(P_ALERT, today);
  var subject = silent ? ('⚠ No Elitech alarm mail for ' + (hours === null ? '?' : hours) + ' hours — a silent room is not a fine room') : '❄ Elitech alarm bridge — things to check';
  var body = (silent ? 'No Elitech alarm e-mail has reached ' + Session.getEffectiveUser().getEmail() + ' for ' + (hours === null ? 'as long as this bridge runs' : hours + ' hours') + '.\n\n'
    + '⚠ No Elitech alarm mail for ' + (hours === null ? '?' : hours) + ' hours — a silent room is not a fine room: check the iCold app shows the controller online.\n'
    + 'This bridge forwards ALARM mails only (a room inside its limits sends nothing). The typed daily check in Nexi (✅ Monitoring Checklist → ❄ Daily) is the daily reading.\n\n' : '')
    + (lines.length ? lines.join('\n') + '\n\n' : '')
    + 'Nexi → Maintenance → ❄ Cold storage shows per room whether a reading reached the worker.\n— Nexi Elitech alarm bridge (workers/elitech-alarm-bridge.gs)' + (C.dry ? ' · DRY RUN' : '');
  try { MailApp.sendEmail({ to: C.to, subject: subject, body: body }); Logger.log('daily mail sent: ' + subject); } catch (e) { Logger.log('mail failed: ' + e); }
}
