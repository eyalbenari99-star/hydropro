/** Nexi ⇄ Pro-Leaf ALARM-MAIL bridge — Google Apps Script (v22.78, Eyal 13 Oct 2026: "connect all meters from BeHive-I to Nexi")
 *
 *  ⚠ STOPGAP. The Pro-Leaf (BeLeaf) cloud has no API we know of. Until it exposes one (or until our own RS485 nodes are in),
 *  the ONLY data that leaves the BeHive-I units is the ALARM e-mail the cloud sends to it@abapardes.com.ph when a value trips
 *  a band: "GH7 & GH8 (BHIDA17102B)[tank1][2.07] High EC Alarm". This script reads those mails and posts the value in them to the
 *  nexi-irr worker (POST /irr/push, node "proleaf-mail"). It delivers ALARM MOMENTS ONLY — no pH (the units mail no pH alarm), no
 *  reading while a pool is fine. A silent pool is NOT a fine pool. Every daily mail this script sends says so.
 *
 *  Runs under nexi@abapardes.com.ph. PREREQUISITE: nexi@abapardes.com.ph must be a member of the Google Group "IT group"
 *  (it@abapardes.com.ph) so the alarm mails land in its inbox — or the script runs under an account that receives the alarms.
 *
 *  How it works (patterns of gmail-bio-bridge.gs):
 *   1. Every 15 minutes (self-healing trigger) it searches `from:support@pro-leaf.com subject:Alarm newer_than:2d` and once a day
 *      the last 3 days again; it looks at every MESSAGE of every thread (42 alarms share one thread) and skips the ids already done.
 *   2. The first non-empty line of the plain body is parsed:
 *        <farm>-<controller name> (<BHI id>) [<channel>][<value> <unit>] <alarm type>
 *      The controller NAME is never parsed (its case and spaces vary: "Gh1 & Gh2 ", "GH7 & GH8"); the DEVICE ID and the channel word
 *      (tank1 … tank4) are the key. The alarm type must equal the subject or the mail is skipped and logged.
 *   3. Type → reading: High/Low EC Alarm → ec · High/Low Water Temp Alarm → wt · High/Low Water Level Alarm → level_m (metres,
 *      the worker turns them into cm). "Water Replenishment Timeout Alarm" (tank4, always 0.00 m) and "Offline Alarm" are NOT
 *      readings: they are counted per device for the daily mail. "Registration verification code" and anything else is ignored.
 *      Sanity: ec ≤ 0.10 or level 0.00 = a dry probe → a fault, counted, not posted.
 *   4. Pool = PROLEAF_MAP["<id>:<tank>"]; an unknown key is posted as {device, tank} without a pool (the worker's own PROLEAF_MAP may
 *      map it) and listed in the daily mail if the worker refused it.
 *   5. Time = the mail's date (cross-checked with the 13-digit ms segment of the Message-ID when within 5 minutes); the worker
 *      clamps a future time and refuses anything older than 7 days (the 2024 backlog is ignored by design).
 *   6. Posts at most 200 readings per push with src:'alarm', alarm:<subject>, msgId:<id>; an id is marked done only on HTTP 200;
 *      a heartbeat {readings:[]} goes on every run; one warning mail a day when no Pro-Leaf mail has come for 24 h while enabled,
 *      listing offline devices, refill timeouts, dry probes and unmapped keys.
 *
 *  SETUP (one time, at script.google.com under the nexi account):
 *   1. Paste this file over Code.gs and Save.
 *   2. Project Settings → Script Properties (NEVER in the code):
 *        IRR_URL          https://nexi-irr.eyalbenari99.workers.dev        (default if empty)
 *        IRR_NODE_TOKEN   the token of the node "proleaf-mail" in the worker's NODE_TOKENS
 *        PROLEAF_MAP      {"BHI9B0F6BDD:tank1":"P05","BHI2E039BFE:tank1":"P06","BHIA08FB2F7:tank1":"P09","BHI361A3A9E:tank1":"P10"}
 *                         (the paired units BHIB841A7D1 (GH1&GH2), BHIA8B53B70 (GH3&GH4), BHIDA17102B (GH7&GH8) are added once the
 *                         walk confirms which pool holds their tank1 probe)
 *        ALERT_TO         eyalbenari99@gmail.com, nexi@abapardes.com.ph
 *   3. Run  installBridge  once → grant permissions. It creates the trigger and heals it from then on.
 */

var P_URL = 'IRR_URL', P_TOKEN = 'IRR_NODE_TOKEN', P_MAP = 'PROLEAF_MAP', P_TO = 'ALERT_TO';
var P_DONE = 'irr_done_msg_ids', P_RESCAN = 'irr_last_rescan', P_ALERT = 'irr_last_alert', P_SEEN = 'irr_last_alarm_at';
var DEFAULT_URL = 'https://nexi-irr.eyalbenari99.workers.dev';
var SEARCH = 'from:support@pro-leaf.com subject:Alarm newer_than:2d';
var SEARCH_RESCAN = 'from:support@pro-leaf.com subject:Alarm newer_than:3d';
var EVERY_MIN = 15, ALERT_AFTER_H = 24, DONE_MAX = 400, MAX_PER_PUSH = 200;
/* "<farm>-<name> (<id>) [<chan>][<val> <unit>] <type>" — UTF-8; ℃ is U+2103 */
var LINE_RE = /^(?<farm>[^-]+)-(?<name>.+?)\s*\((?<id>BHI[0-9A-F]{8})\)\s*\[(?<chan>[^\]]*)\](?:\[(?<val>-?\d+(?:\.\d+)?)\s*(?<unit>℃|°C|m)?\])?\s*(?<type>.+?)\s*$/;

function cfg() {
  var p = PropertiesService.getScriptProperties();
  var map = {};
  try { var o = JSON.parse(p.getProperty(P_MAP) || '{}'); Object.keys(o).forEach(function (k) { var m = /^([^:]+):?(.*)$/.exec(k); if (m) map[m[1].trim().toUpperCase() + ':' + ((m[2] || '').trim().toLowerCase() || 'tank1')] = String(o[k] || '').trim().toUpperCase(); }); } catch (e) { Logger.log('PROLEAF_MAP is not JSON: ' + e); }
  return { url: (p.getProperty(P_URL) || DEFAULT_URL).replace(/\/+$/, ''), token: p.getProperty(P_TOKEN) || '', map: map, to: p.getProperty(P_TO) || '' };
}

/* ---------- one-time setup + self-healing trigger ---------- */
function installBridge() {
  ensureTrigger();
  runBridge();
  Logger.log('Pro-Leaf alarm bridge installed. Trigger runs every ' + EVERY_MIN + ' minutes. STOPGAP: alarm mails only, no pH.');
}
function ensureTrigger() {
  try {
    var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'runBridge'; });
    if (!has) { ScriptApp.newTrigger('runBridge').timeBased().everyMinutes(EVERY_MIN).create(); Logger.log('trigger was missing — re-created'); }
  } catch (e) { Logger.log('ensureTrigger: ' + e); }
}

/* ---------- the parser (pure; testable from the editor with testParse) ---------- */
function parseAlarm(subject, body, msgDate, msgId) {
  var line = String(body || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l; })[0] || '';
  var m = LINE_RE.exec(line);
  if (!m) return { skip: 'no alarm line', line: line.slice(0, 120) };
  var g = m.groups, type = g.type.trim(), subj = String(subject || '').trim();
  if (type !== subj) return { skip: 'type "' + type + '" differs from the subject "' + subj + '"', line: line.slice(0, 120) };
  var id = g.id.toUpperCase(), chan = (g.chan || '').trim().split(/\s+/)[0].toLowerCase() || 'tank1', val = g.val != null ? Number(g.val) : null;
  var out = { device: id, tank: chan, type: type, value: val, unit: g.unit || '', ts: tsOf(msgDate, msgId), msgId: msgId };
  if (/^(High|Low) EC Alarm$/.test(type)) { out.metric = 'ec'; }
  else if (/^(High|Low) Water Temp Alarm$/.test(type)) { out.metric = 'wt'; }
  else if (/^(High|Low) Water Level Alarm$/.test(type)) { out.metric = 'level_m'; }
  else if (/^Water Replenishment Timeout Alarm$/.test(type)) { out.fault = 'refill timeout'; return out; }
  else if (/^Offline Alarm$/.test(type)) { out.fault = 'offline'; return out; }
  else return { skip: 'not a reading: ' + type };
  if (val === null || !isFinite(val)) return { skip: 'no value in ' + type };
  if ((out.metric === 'ec' && val <= 0.10) || (out.metric === 'level_m' && val === 0)) { out.fault = 'dry probe (' + out.metric + ' ' + val + ')'; return out; }
  return out;
}
/* the mail's date; the Message-ID's 13-digit ms segment is used when it agrees within 5 minutes */
function tsOf(msgDate, msgId) {
  var t = msgDate ? new Date(msgDate).getTime() : Date.now();
  var m = /\.(\d{13})@/.exec(String(msgId || ''));
  if (m) { var t2 = Number(m[1]); if (isFinite(t2) && Math.abs(t2 - t) <= 5 * 60e3) t = t2; }
  return new Date(t).toISOString();
}
function testParse() {
  var r = parseAlarm('High EC Alarm', 'ABA Pardes-GH7 & GH8 (BHIDA17102B)[tank1][2.07] High EC Alarm\n\nsent by Pro-Leaf', new Date(), '<x.1760300000000@pro-leaf.com>');
  Logger.log(JSON.stringify(r));
  Logger.log(JSON.stringify(parseAlarm('High Water Temp Alarm', 'ABA Pardes-Gh1 & Gh2  (BHIB841A7D1)[tank1][30.6℃] High Water Temp Alarm', new Date(), '')));
  Logger.log(JSON.stringify(parseAlarm('Water Replenishment Timeout Alarm', 'ABA Pardes-GH9 (BHIA08FB2F7)[tank4][0.00m] Water Replenishment Timeout Alarm', new Date(), '')));
}

/* ---------- main ---------- */
function runBridge() {
  ensureTrigger();
  var C = cfg(), props = PropertiesService.getScriptProperties();
  if (!C.token) { Logger.log('IRR_NODE_TOKEN is not set (Script Properties) — nothing posted'); return; }
  var done = _doneIds(), doneSet = {};
  done.forEach(function (id) { doneSet[id] = 1; });
  var today = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  var rescan = props.getProperty(P_RESCAN) !== today;
  if (rescan) props.setProperty(P_RESCAN, today);

  var msgs = [];
  GmailApp.search(rescan ? SEARCH_RESCAN : SEARCH, 0, 50).forEach(function (thread) {
    thread.getMessages().forEach(function (m) { msgs.push(m); });
  });
  var readings = [], faults = {}, unmapped = {}, newest = 0, seen = 0, ids = [];
  msgs.forEach(function (m) {
    var id = m.getId();
    seen++;
    var t = m.getDate() ? m.getDate().getTime() : 0; if (t > newest) newest = t;
    if (doneSet[id]) return;
    var r = parseAlarm(m.getSubject(), m.getPlainBody(), m.getDate(), id);
    if (r.skip) { Logger.log('skip ' + id + ': ' + r.skip + (r.line ? ' | ' + r.line : '')); ids.push(id); return; }
    if (r.fault) { var k = r.device + ' ' + r.fault; faults[k] = (faults[k] || 0) + 1; ids.push(id); return; }
    var key = r.device + ':' + r.tank, pool = C.map[key] || '';
    var reading = { device: r.device, tank: r.tank, ts: r.ts, src: 'alarm', alarm: r.type, msgId: id };
    if (pool) reading.pool = pool; else unmapped[key] = (unmapped[key] || 0) + 1;
    reading[r.metric] = r.value;
    readings.push({ id: id, key: key, body: reading });
  });
  if (newest) props.setProperty(P_SEEN, String(newest));

  /* post in slices of 200; an id is done only when its push answered 200 */
  var refused = {};
  for (var i = 0; i < readings.length; i += MAX_PER_PUSH) {
    var slice = readings.slice(i, i + MAX_PER_PUSH);
    var res = _post(C, { readings: slice.map(function (x) { return x.body; }) });
    if (res && res.ok) {
      (res.refused || []).forEach(function (f) { var x = slice[f.i]; if (x) refused[x.key + ' — ' + f.error] = (refused[x.key + ' — ' + f.error] || 0) + 1; });
      slice.forEach(function (x) { ids.push(x.id); });
      Logger.log('pushed ' + slice.length + ': stored ' + res.stored + ', duplicates ' + res.duplicates + ', refused ' + (res.refused || []).length);
    } else Logger.log('push failed — ' + (res && res.error ? res.error : 'no answer') + ' (the ids stay for the next run)');
  }
  if (!readings.length) _post(C, { readings: [] }); /* heartbeat: the bridge is alive even when no alarm came */
  if (ids.length) _markDone(done, ids);
  _warnIfSilent(C, props, newest, faults, unmapped, refused);
}

function _post(C, body) {
  try {
    var r = UrlFetchApp.fetch(C.url + '/irr/push', { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + C.token }, payload: JSON.stringify(body), muteHttpExceptions: true });
    var code = r.getResponseCode(), txt = r.getContentText();
    if (code !== 200) { Logger.log('nexi-irr answered ' + code + ': ' + txt.slice(0, 200)); return { ok: false, error: 'HTTP ' + code }; }
    return JSON.parse(txt);
  } catch (e) { Logger.log('nexi-irr unreachable: ' + e); return { ok: false, error: String(e) }; }
}
function _doneIds() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(P_DONE) || '[]'); } catch (e) { return []; } }
function _markDone(done, ids) {
  var all = done.concat(ids); if (all.length > DONE_MAX) all = all.slice(all.length - DONE_MAX);
  PropertiesService.getScriptProperties().setProperty(P_DONE, JSON.stringify(all));
}
/* one warning a day when no Pro-Leaf mail has arrived for 24 h — with what else the bridge saw */
function _warnIfSilent(C, props, newest, faults, unmapped, refused) {
  var last = Number(props.getProperty(P_SEEN) || newest || 0), hours = last ? Math.round((Date.now() - last) / 3600e3) : null;
  var lines = [];
  var fk = Object.keys(faults); if (fk.length) lines.push('Faults seen (not posted): ' + fk.map(function (k) { return k + ' ×' + faults[k]; }).join('; '));
  var uk = Object.keys(unmapped); if (uk.length) lines.push('Unmapped device:tank keys (add to PROLEAF_MAP): ' + uk.map(function (k) { return k + ' ×' + unmapped[k]; }).join('; '));
  var rk = Object.keys(refused); if (rk.length) lines.push('Refused by nexi-irr: ' + rk.map(function (k) { return k + ' ×' + refused[k]; }).join('; '));
  var silent = hours === null || hours >= ALERT_AFTER_H;
  if (!silent && !lines.length) return;
  var today = Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  if (props.getProperty(P_ALERT) === today) return;
  if (!C.to) { Logger.log('ALERT_TO not set — would mail: ' + lines.join(' | ')); return; }
  props.setProperty(P_ALERT, today);
  var subject = silent ? ('⚠ Pro-Leaf alarm mails have not arrived for ' + (hours === null ? '?' : hours) + ' hours (alarm-only stopgap)') : '📡 Pro-Leaf alarm bridge — things to check (alarm-only stopgap)';
  var body = (silent ? 'No alarm e-mail from support@pro-leaf.com has reached ' + Session.getEffectiveUser().getEmail() + ' for ' + (hours === null ? 'as long as this bridge runs' : hours + ' hours') + '.\n\n'
    + 'This bridge is a STOPGAP: it forwards ALARM mails only (out-of-band moments, no pH). A silent pool is not a fine pool — check: are the BeHive-I units powered and on Wi-Fi, is the Pro-Leaf account alive, is nexi@abapardes.com.ph in the Google Group "IT group" (it@abapardes.com.ph)?\n\n' : '')
    + (lines.length ? lines.join('\n') + '\n\n' : '')
    + 'Nexi → Irrigation → 🔌 Meters shows per pool whether a reading reached the worker.\n— Nexi Pro-Leaf alarm bridge (workers/proleaf-alarm-bridge.gs)';
  try { MailApp.sendEmail({ to: C.to, subject: subject, body: body }); Logger.log('warning mailed: ' + subject); } catch (e) { Logger.log('mail failed: ' + e); }
}
