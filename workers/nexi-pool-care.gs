/** Nexi 🧽 Pool care — WhatsApp / e-mail reminders and alerts (v1.1 · Nexi v23.48 · 14 Oct 2026)
 *
 * Eyal, 14 Oct 2026: "… when there is reports from check list or super visor or quality control Nexi should ask if that
 * was done or not if not must WhatsApp to Dr Amy (production manager) and to me also reminder fir super visor day before in
 * WhatsApp and in same day to clean pill and which one when time come".
 *
 * WHAT THIS FILE IS: a SECOND script file in the SAME nexi@ Apps Script project as nexi-morning-brief.gs v4 (the per-user
 * briefs). It has no sender of its own: it reuses that file's cloud login, pull / push, Manila clock, CallMeBot sender and
 * money guard by name (ubFetch_, ubPull_, manila_, ymdAdd_, dayDiff_, waPropName_, callMeBot_, moneyGuard_, ubGet_, ubSet_,
 * scrubWhy_, ubParse_, LEGACY_USERS, RECIPIENTS, leaderOwn_, COMPANY_RX — v4.0 as released in Nexi v23.30). Without v4 in the
 * project it logs "needs nexi-morning-brief.gs v4 in the same project" and sends nothing.
 *
 * v1.1 (review of Nexi v23.48): the evening reminder is for the NEXT WORKING DAY (Saturday 17:00 for Monday; Sundays and the
 * app's PH holidays skipped); the 06:30 "today" reminder also lists a job still open from an earlier day; a "no answer" says
 * when Nexi asks again (never "today" on a Sunday) and is not sent once the job was answered or done; a text the v4 money guard
 * would drop is sent as its reason-free copy (text2) instead of being lost; the leaders' older keys (WA_EYAL / WA_AMY) are used
 * for the usernames v4 knows (LEGACY_USERS: eyal, amy, dramy, amyp …) or a leader's own mailbox — never a name pattern.
 *
 * Every 15 minutes (trigger nexiPoolCareTick) it reads from the cloud store:
 *   hydroPro_pool_jobs_v1      the plan (one open job per GH / PRJ: PJ_<unit>_<cycle due>) + the answers (PA_<job>_<day>)
 *   hydroPro_notify_outbox_v1  the "not done" / "no answer" messages the app queued (kind 'pool')
 *   hydroPro_pool_care_cfg_v1  the rules (ask times, WhatsApp switches) — defaults when nobody saved them
 *   hydroPro_users             who is who (full names, e-mail)
 *   hydroPro_ph_holidays       the PH holidays Nexi plans around (no job and no "tomorrow" reminder on them)
 * and sends, Asia/Manila:
 *   17:00–21:00  "Pool care tomorrow (…)"  to the Production supervisor + the GH person of every job planned on the NEXT WORKING
 *                DAY (on Saturday: Monday, called "next working day (Mon …)")
 *   06:30–10:30  "Pool care today (…)"     the same for the jobs planned TODAY + any job still open from an earlier day
 *   08:00–20:00  "NO ANSWER" to Dr Amy + Eyal for a job planned on an earlier day (≤ 7 days) that nobody answered —
 *                the same id as the app's own outbox record (pool_<unit>_<day>_noanswer), so it goes out once
 *   06:00–21:00  every outbox record of the last 36 h (❌ not done → Dr Amy + Eyal)
 *   21:00–06:00  nothing.
 * Channel per person: WhatsApp when Script property WA_<USERNAME> (or, for v4's leader usernames, the older WA_EYAL / WA_AMY) holds 63XXXXXXXXXX|key,
 * otherwise e-mail to a @abapardes.com.ph address, otherwise logged "no-key". These alerts were ordered by the owner, so the
 * 🧭 Assistant-card WhatsApp tick is not needed (OD4). No message carries money, a phone number or a key.
 *
 * Switch — Script property POOL_CARE:  dry (default when absent: logs "would send", sends nothing) · on · off.
 * Each message id + person is sent once (UserProperties pc|<id>|<user>, cleaned after 10 days); a failure is retried twice.
 * Delivery status goes to the cloud key nexipool_log_v1 (the app never writes it): Nexi shows it in 🧽 Pool care ▸ 📨 Messages.
 *
 * OWNER STEPS (script.google.com, signed in as nexi@abapardes.com.ph):
 *   1. Open the project that holds nexi-morning-brief.gs v4 → ➕ (Files) → Script → name it nexi-pool-care → paste this file → 💾.
 *   2. Choose installPoolCare in the function list → ▶ Run once. It adds the 15-minute trigger and mails eyal@ a setup check
 *      (who would get what, which WA_ property is missing). Nothing is sent to staff while POOL_CARE is absent (dry).
 *   3. Add WA_<USERNAME> for the Production supervisor (the setup mail names the property), after that person sent
 *      "I allow callmebot to send me messages" to CallMeBot. Dr Amy / Eyal: WA_AMY / WA_EYAL work when their Nexi username is one
 *      v4 knows (eyal · amy · dramy · amyp); any other username needs its own WA_<USERNAME> — the setup mail says which.
 *   4. After one day in dry, check 🧽 Pool care ▸ 📨 Messages, then Script property POOL_CARE = on.   To stop: POOL_CARE = off.
 */

var PC_VERSION = '1.1';
var PC_LOG_KEY = 'nexipool_log_v1';
var PC_KEYS = ['hydroPro_users', 'hydroPro_pool_jobs_v1', 'hydroPro_notify_outbox_v1', 'hydroPro_pool_care_cfg_v1', 'hydroPro_ph_holidays'];
var PC_NEEDS = ['ubFetch_', 'ubPull_', 'manila_', 'ymdAdd_', 'dayDiff_', 'waPropName_', 'callMeBot_', 'moneyGuard_', 'ubGet_', 'ubSet_', 'scrubWhy_', 'ubParse_'];
var PC_TIMES = { day: '06:30', eod: '17:00', esc: '08:00' };
var PC_END = { eve: '21:00', day: '10:30', noanswer: '20:00', outboxFrom: '06:00', outboxTo: '21:00' };
var PC_OUTBOX_MAX_H = 36, PC_NOANSWER_MAX_D = 7, PC_KEEP_D = 10, PC_LOG_D = 7, PC_MAX_TRIES = 3, PC_BEAT_MIN = 60;
var PC_WA_RX = /^\s*\+?([\d\s-]{8,20})\s*\|\s*(\S+)\s*$/;
var PC_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], PC_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ---------------- install ---------------- */

function installPoolCare() {
  var miss = pcMissing_();
  if (miss.length) throw new Error('needs nexi-morning-brief.gs v4 in the same project (missing: ' + miss.join(', ') + ')');
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'nexiPoolCareTick') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('nexiPoolCareTick').timeBased().everyMinutes(15).create();
  var M = manila_(new Date()), data = ubPull_(PC_KEYS), rows = pcSetupRows_(data);
  var to = (typeof FAIL_TO === 'string' && FAIL_TO) ? FAIL_TO : 'eyal@abapardes.com.ph';
  var L = ['Nexi 🧽 pool care — setup check (nexi-pool-care.gs v' + PC_VERSION + ', ' + M.day + ' ' + M.hm + ' Manila)', '',
    'Mode: ' + pcMode_() + ' (Script property POOL_CARE: dry = log only · on = send · off = stop).', '',
    'Who the pool messages go to and how:'];
  rows.forEach(function (r) { L.push('· ' + r.name + ' (' + r.user + ') — ' + r.roles.join(', ') + ': ' + r.how); });
  if (!rows.length) L.push('· nobody yet — open Nexi once so the pool jobs are made (Irrigation ▸ 🧽 Pool care).');
  L.push('', 'A WhatsApp key is the Script property named above, value 63XXXXXXXXXX|key (after the person sent',
    '"I allow callmebot to send me messages" to CallMeBot). Never type a key into Nexi.');
  GmailApp.sendEmail(to, '⚙ Nexi pool care — setup check (v' + PC_VERSION + ')', L.join('\n'), { name: 'Nexi · Pool care' });
  return { trigger: 'nexiPoolCareTick every 15 min', mode: pcMode_(), rows: rows };
}

/* ---------------- the 15-minute tick ---------------- */

function nexiPoolCareTick() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { skipped: 'another run is busy' };
  try { return pcRun_({}); }
  finally { try { lock.releaseLock(); } catch (e) {} }
}

function pcRun_(opts) {
  opts = opts || {};
  var res = { mode: '', sends: 0, dry: 0, failed: 0, noKey: 0, blocked: 0, pushed: false, err: '' };
  var miss = pcMissing_();
  if (miss.length) { res.err = 'needs nexi-morning-brief.gs v4 in the same project (missing: ' + miss.join(', ') + ')'; try { console.warn(res.err); } catch (e) {} return res; }
  var M = opts.M || manila_(new Date()), mode = pcMode_(), at = new Date().toISOString();
  res.mode = mode;
  var eng = { script: 'nexi-pool-care.gs v' + PC_VERSION, mode: mode, lastRun: at, lastErr: '' };
  try {
    pcCleanup_(M);
    if (mode !== 'off') {
      var data = ubPull_(PC_KEYS);
      var plan = pcBuildSends_(data, M, pcDoneMap_(), mode);
      plan.forEach(function (s) {
        var st = pcSendOne_(s, data, M, mode);
        pcDoneSet_(s, st, M);
        if (st.s === 'sent' || st.s === 'unconfirmed') res.sends++;
        else if (st.s === 'dry') res.dry++;
        else if (st.s === 'failed') res.failed++;
        else if (st.s === 'no-key') res.noKey++;
        else if (st.s === 'blocked') res.blocked++;
      });
    }
  } catch (e) { eng.lastErr = scrubWhy_(e, '', '', 160); res.err = eng.lastErr; }
  var log = pcBuildLog_(pcDoneMap_(), M, eng);
  res.log = log;
  try { res.pushed = pcPushLog_(log); } catch (e) { res.err = res.err || ('log: ' + scrubWhy_(e, '', '', 120)); }
  return res;
}

/* ---------------- what to send now (pure: data + clock + what was already sent → the list) ---------------- */

function pcBuildSends_(data, M, done, mode) {
  done = done || {};
  var jobsArr = pcArr_(ubParse_(data.hydroPro_pool_jobs_v1, [])), ob = pcArr_(ubParse_(data.hydroPro_notify_outbox_v1, []));
  var cfg = pcCfg_(ubParse_(data.hydroPro_pool_care_cfg_v1, null)), users = pcUsers_(data), hol = pcHol_(data.hydroPro_ph_holidays);
  var out = [], recs = {}, hm = M.hm, day = M.day, tm = pcNextWork_(ymdAdd_(day, 1), hol);
  jobsArr.forEach(function (r) { if (r && r.id) recs[r.id] = r; });
  var jobs = jobsArr.filter(function (j) { return j && j.rec === 'job'; });
  var open = jobs.filter(function (j) { return j.status === 'planned'; });
  var want = function (key) { var d = done[key]; if (!d || !d.s) return true; if (d.s === 'dry') return mode === 'on'; if (d.s === 'failed') return (d.n || 1) < PC_MAX_TRIES; return false; };
  var add = function (o) { if (want(o.key) && !out.some(function (x) { return x.key === o.key; })) out.push(o); };
  /* 1. the evening before and the morning of the day — built here from the plan, so they go with no computer open */
  var aidOf = function (j, d) { return 'PA_' + j.id + '_' + String(d).replace(/-/g, ''); };
  /* a job still open from an earlier day (≤ 7 days, nobody answered on its day) — the morning list names it too (review) */
  var held = open.filter(function (j) { return j.plan < day && dayDiff_(day, j.plan) <= PC_NOANSWER_MAX_D && !recs[aidOf(j, j.plan)]; });
  var rem = function (kind, D, label) {
    var per = {};
    open.filter(function (j) { return j.plan === D; }).concat(kind === 'day' ? held : []).forEach(function (j) {
      var w = j.who || {};
      [w.sup, w.ghpUser].forEach(function (u) { u = pcLc_(u); if (!u) return; (per[u] = per[u] || []); if (per[u].indexOf(j) < 0) per[u].push(j); });
    });
    Object.keys(per).sort().forEach(function (u) {
      var id = 'poolrem_' + D + '_' + kind + '_' + u, js = per[u].sort(function (a, b) { return pcNum_(a.unit) - pcNum_(b.unit); });
      add({ key: id + '|' + u, id: id, user: u, ev: kind, kind: 'pool', day: D, channel: ['wa', 'mail'], text: pcRemText_(kind, D, js, label), subject: '🧽 Nexi pool care — ' + label + ' (' + pcFmt_(D) + ')' });
    });
  };
  if (cfg.wa.eve !== false && hm >= cfg.times.eod && hm < PC_END.eve) rem('eve', tm, tm === ymdAdd_(day, 1) ? 'tomorrow' : 'next working day');
  if (cfg.wa.day !== false && hm >= cfg.times.day && hm < PC_END.day) rem('day', day, 'today');
  /* 2. the app's outbox (❌ not done / ⏳ no answer), the last 36 hours */
  var obIds = {};
  if (hm >= PC_END.outboxFrom && hm < PC_END.outboxTo) {
    ob.forEach(function (r) {
      if (!r || !r.id || r.kind !== 'pool') return;
      obIds[r.id] = 1;
      var ca = +r.createdAt || 0;
      if (!ca || M.ms - ca > PC_OUTBOX_MAX_H * 3600000 || ca > M.ms + 600000) return;
      var ch = pcArr_(r.channel).filter(function (c) { return c === 'wa' || c === 'mail'; });
      if (!ch.length) return;                                   /* in-app only — the app already did it */
      if (r.ev === 'noanswer' && r.jobId) {                     /* review: answered or done meanwhile (another computer) → no "no answer" */
        var pa = recs['PA_' + r.jobId + '_' + String(r.day || '').replace(/-/g, '')], jb = recs[r.jobId];
        if ((pa && (pa.a === 'yes' || pa.a === 'no')) || (jb && jb.status === 'done')) return;
      }
      pcArr_(r.to).forEach(function (u) {
        u = pcLc_(u); if (!u) return;
        add({ key: r.id + '|' + u, id: r.id, user: u, ev: r.ev || '', kind: 'pool', day: r.day || '', channel: ch, text: String(r.text || ''), text2: r.text2 ? String(r.text2) : '',
              subject: (r.ev === 'noanswer' ? '⏳ Nexi pool care — no answer: ' : '⚠ Nexi pool care — not done: ') + (r.unit || '') + ' (' + pcFmt_(r.day) + ')' });
      });
    });
  }
  /* 3. no answer by the next morning and no computer open to say so: the same id as the app's, so it is sent once */
  if (cfg.wa.noanswer !== false && hm >= cfg.times.esc && hm < PC_END.noanswer) {
    open.forEach(function (j) {
      if (!(j.plan < day) || dayDiff_(day, j.plan) > PC_NOANSWER_MAX_D) return;
      if (recs['PA_' + j.id + '_' + String(j.plan).replace(/-/g, '')]) return;
      var id = 'pool_' + j.unit + '_' + j.plan + '_noanswer';
      if (obIds[id]) return;                                    /* the app queued it — sent from the outbox above */
      var esc = pcArr_((j.who || {}).esc);
      if (!esc.length) esc = pcBoss_(users);
      esc.forEach(function (u) {
        u = pcLc_(u); if (!u) return;
        add({ key: id + '|' + u, id: id, user: u, ev: 'noanswer', kind: 'pool', day: j.plan, channel: ['wa', 'mail'], text: pcNoAnswerText_(j, cfg, users, day, hol),
              subject: '⏳ Nexi pool care — no answer: ' + j.unit + ' (' + pcFmt_(j.plan) + ')' });
      });
    });
  }
  return out;
}

/* the day's pool jobs in the shape of the app's window.hnxPoolDay(day) — for the per-user brief (add 'hydroPro_pool_jobs_v1'
   to UB_DATA_KEYS and call pcJobsForDay_(data.hydroPro_pool_jobs_v1, day) when typeof pcJobsForDay_ === 'function') */
function pcJobsForDay_(jobsArr, day) {
  var A = pcArr_(ubParse_(jobsArr, [])), recs = {};
  A.forEach(function (r) { if (r && r.id) recs[r.id] = r; });
  var aid = function (j) { return 'PA_' + j.id + '_' + String(day).replace(/-/g, ''); };
  return A.filter(function (j) { return j && j.rec === 'job' && ((j.status === 'planned' && j.plan === day) || !!recs[aid(j)]); })
    .sort(function (a, b) { return pcNum_(a.unit) - pcNum_(b.unit); })
    .map(function (j) {
      var a = recs[aid(j)], w = j.who || {}, rd = (j.work === 'clean' && j.cleanDue && j.cleanDue < j.waterDue) ? j.cleanDue : j.waterDue; /* review: the earlier rule */
      return { jobId: j.id, unit: j.unit, pools: pcArr_(j.pools).slice(), work: j.work, workLabel: j.work === 'clean' ? 'pool cleaning + water change' : 'water change',
               plan: j.plan, cycleDue: j.cycleDue, lateDays: (j.nohist || !rd) ? 0 : Math.max(0, dayDiff_(day, rd)), catchup: !!j.catchup, nohist: !!j.nohist,
               status: j.status, answer: a ? { a: a.a, by: a.by, at: a.at } : null,
               who: { sup: w.sup || '', ghpUser: w.ghpUser || '', ghpName: w.ghpName || '', proxy: !!w.proxy } };
    });
}

/* ---------------- texts (no money, no litres with a thousands comma, no phone numbers, no keys) ---------------- */

function pcRemText_(kind, D, js, label) {
  var still = js.filter(function (j) { return j.plan < D; });
  js = js.filter(function (j) { return !(j.plan < D); });
  var cl = js.filter(function (j) { return j.work === 'clean'; }), wa = js.filter(function (j) { return j.work !== 'clean'; });
  var grp = function (L, what, pools) {
    if (!L.length) return '';
    return L.map(function (j) { return j.unit; }).join(' + ') + ' ' + what + (pools ? ' (' + L.map(function (j) { return pcArr_(j.pools).join(' + '); }).join(', ') + ')' : '');
  };
  var eve = kind === 'eve', parts = [grp(cl, 'pool cleaning with water change', eve), grp(wa, 'water change', eve)].filter(Boolean);
  var byDay = {};
  still.forEach(function (j) { (byDay[j.plan] = byDay[j.plan] || []).push(j); });
  Object.keys(byDay).sort().forEach(function (d) {
    var L = byDay[d].sort(function (x, y) { return pcNum_(x.unit) - pcNum_(y.unit); });
    parts.push('still open from ' + pcFmt_(d) + ': ' + [grp(L.filter(function (j) { return j.work === 'clean'; }), 'pool cleaning with water change', false),
      grp(L.filter(function (j) { return j.work !== 'clean'; }), 'water change', false)].filter(Boolean).join(', '));
  });
  var s = 'Nexi · Pool care ' + (eve ? (label || 'tomorrow') : 'today') + ' (' + pcFmt_(D) + '): ' + parts.join(' · ') + '.';
  if (eve) s += (cl.length ? ' Prepare cleaning materials today (SOP A, 4:45 PM).' : '') + ' Nexi will ask after each job.';
  else s += ' Refill to the cleaning mark, bring EC to 2.2 / pH to 6.0 (SOP F). Answer in Nexi when done — it asks at 11:00.';
  return pcClip_(s, 600);
}
function pcNoAnswerText_(j, cfg, users, today, hol) {
  var w = j.who || {}, names = [w.sup, w.ghpUser].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).map(function (u) { return pcName_(users, u); });
  var uc = (cfg.units && cfg.units[j.unit]) || {}, rule = (+uc.waterDays > 0) ? +uc.waterDays : cfg.waterDays;
  var s = '⚠ Nexi · ' + j.unit + ' pool ' + (j.work === 'clean' ? 'cleaning' : 'water change') + ' planned ' + pcFmt_(j.plan) + ' — NO ANSWER from ' + (names.join(' and ') || 'the supervisor')
    + ' (asked ' + cfg.times.ask + ' and ' + cfg.times.reask + '). Nexi asks again ' + (pcIsWork_(today, hol) ? 'today' : pcFmt_(pcNextWork_(today, hol))) + '.';
  if (j.lastWater) s += ' Water is ' + dayDiff_(today, j.lastWater) + ' days old (rule ' + rule + ').';
  return pcClip_(s, 600);
}

/* ---------------- one message to one person ---------------- */

function pcSendOne_(s, data, M, mode) {
  var at = new Date().toISOString(), users = pcUsers_(data), u = users[s.user] || null;
  var g = moneyGuard_(s.text), note = '';
  if (g.dropped && s.text2 && !moneyGuard_(s.text2).dropped) { s = Object.assign({}, s, { text: s.text2 }); note = 'sent without the written reason (it looked like money)'; g = { dropped: 0 }; }
  if (g.dropped) return { s: 'blocked', at: at, why: 'the text looked like money — not sent' };
  var wa = (s.channel.indexOf('wa') >= 0) ? pcWaKey_(s.user, u) : null;
  var mail = (s.channel.indexOf('mail') >= 0) ? pcMail_(u) : '';
  if (!wa && !mail) return { s: 'no-key', at: at, why: 'no ' + pcWaProp_(s.user) + ' and no company e-mail' };
  var ch = wa ? 'wa' : 'mail';
  if (mode !== 'on') return { s: 'dry', at: at, ch: [ch], why: 'POOL_CARE is ' + mode };
  if (wa) {
    try { var r = callMeBot_(wa.phone, wa.key, s.text); return { s: r.s, at: at, ch: ['wa'], why: r.why || note }; }
    catch (e) { return { s: 'failed', at: at, ch: ['wa'], why: scrubWhy_(e, wa.phone, wa.key, 120) }; }
  }
  try {
    GmailApp.sendEmail(mail, s.subject || '🧽 Nexi pool care', s.text + '\n\nOpen Nexi: ' + (typeof APP_URL === 'string' ? APP_URL : 'https://aba-pardes-monitoring.netlify.app/'), { name: 'Nexi · Pool care' });
    return note ? { s: 'sent', at: at, ch: ['mail'], why: note } : { s: 'sent', at: at, ch: ['mail'] };
  } catch (e) { return { s: 'failed', at: at, ch: ['mail'], why: scrubWhy_(e, '', '', 120) }; }
}
function pcWaProp_(u) { return waPropName_(u); }
/* WA_<USERNAME>, else the older leadership property of v3 (WA_EYAL / WA_AMY / WA_CHEN) — exactly as v4.0 decides it: the leader's
   USERNAME (LEGACY_USERS) or one of the leader's own mailboxes (leaderOwn_) on the user's card; never a pattern on a full name */
function pcLeader_(un, u) {
  if (typeof LEGACY_USERS === 'object' && LEGACY_USERS && Object.prototype.hasOwnProperty.call(LEGACY_USERS, un)) return LEGACY_USERS[un];
  if (!u || typeof leaderOwn_ !== 'function' || typeof RECIPIENTS === 'undefined') return '';
  var name = '';
  [u.assistant && u.assistant.workEmail, u.email].forEach(function (a) {
    a = pcLc_(a); if (!a || name) return;
    pcArr_(RECIPIENTS).forEach(function (rc) { if (!name && leaderOwn_(rc).indexOf(a) >= 0) name = rc.name; });
  });
  return name;
}
function pcWaKey_(un, u) {
  var SP = PropertiesService.getScriptProperties(), raw = String(SP.getProperty(waPropName_(un)) || '');
  if (!raw && typeof RECIPIENTS !== 'undefined') {
    var nm = pcLeader_(pcLc_(un), u);
    if (nm) pcArr_(RECIPIENTS).forEach(function (rc) { if (!raw && rc.name === nm && rc.waKeyProp) raw = String(SP.getProperty(rc.waKeyProp) || ''); });
  }
  var m = PC_WA_RX.exec(raw);
  return m ? { phone: m[1].replace(/\D/g, ''), key: m[2] } : null;
}
function pcMail_(u) {
  if (!u) return '';
  var a = String((u.assistant && u.assistant.workEmail) || u.email || '').trim();
  var rx = (typeof COMPANY_RX !== 'undefined' && COMPANY_RX) ? COMPANY_RX : /^[^@\s]+@abapardes\.com\.ph$/i;
  return rx.test(a) ? a : '';
}

/* ---------------- the setup check rows (names and property names only — never a number) ---------------- */

function pcSetupRows_(data) {
  var users = pcUsers_(data), jobs = pcArr_(ubParse_(data.hydroPro_pool_jobs_v1, [])).filter(function (j) { return j && j.rec === 'job' && j.status === 'planned'; });
  var roles = {}, put = function (u, r) { u = pcLc_(u); if (!u) return; roles[u] = roles[u] || []; if (roles[u].indexOf(r) < 0) roles[u].push(r); };
  jobs.forEach(function (j) { var w = j.who || {}; put(w.sup, 'Production supervisor'); put(w.ghpUser, 'GH person (' + j.unit + ')'); pcArr_(w.esc).forEach(function (x) { put(x, 'escalation (not done / no answer)'); }); });
  var cfg = pcCfg_(ubParse_(data.hydroPro_pool_care_cfg_v1, null));
  pcArr_(cfg.esc).forEach(function (x) { put(x, 'escalation (not done / no answer)'); });
  if (!jobs.length) pcBoss_(users).forEach(function (x) { put(x, 'escalation (not done / no answer)'); });
  return Object.keys(roles).sort().map(function (un) {
    var u = users[un] || null, wa = pcWaKey_(un, u), mail = pcMail_(u);
    var how = wa ? 'WhatsApp ✓ (key found)' : mail ? ('e-mail ✓ — no WhatsApp: add Script property ' + waPropName_(un)) : ('⚠ MISSING: add Script property ' + waPropName_(un) + ' or a @abapardes.com.ph e-mail in Nexi');
    return { user: un, name: u ? String(u.fullname || u.fullName || u.name || un) : un, roles: roles[un], how: how };
  });
}

/* ---------------- state, log, small helpers ---------------- */

function pcMissing_() {
  var g = (typeof globalThis !== 'undefined') ? globalThis : (function () { return this; })();
  return PC_NEEDS.filter(function (n) { return !g || typeof g[n] !== 'function'; });
}
function pcMode_() { var m = String(PropertiesService.getScriptProperties().getProperty('POOL_CARE') || 'dry').trim().toLowerCase(); return m === 'on' || m === 'off' ? m : 'dry'; }
function pcDoneMap_() {
  var all = PropertiesService.getUserProperties().getProperties(), out = {};
  Object.keys(all).forEach(function (k) { if (k.indexOf('pc|') === 0) { try { out[k.slice(3)] = JSON.parse(all[k]); } catch (e) {} } });
  return out;
}
function pcDoneSet_(s, st, M) {
  var prev = ubGet_('pc|' + s.key) || {}, n = st.s === 'failed' ? ((prev.s === 'failed' ? (prev.n || 1) : 0) + 1) : 0;
  var rec = { s: st.s, at: st.at, d: M.day, ev: s.ev || '', day: s.day || '' };
  if (st.ch) rec.ch = st.ch;
  if (st.why) rec.why = String(st.why).slice(0, 120);
  if (n) rec.n = n;
  ubSet_('pc|' + s.key, rec);
}
function pcCleanup_(M) {
  if (ubGet_('pc_clean') === M.day) return;
  var UP = PropertiesService.getUserProperties(), all = UP.getProperties(), cut = ymdAdd_(M.day, -PC_KEEP_D);
  Object.keys(all).forEach(function (k) { if (k.indexOf('pc|') !== 0) return; var r = null; try { r = JSON.parse(all[k]); } catch (e) {} if (!r || !r.d || r.d < cut) UP.deleteProperty(k); });
  ubSet_('pc_clean', M.day);
}
/* nexipool_log_v1 = {v, engine, sent:{<message id>:{s (the worst over its people), at, ch, why, n, ev, day, to:{<user>: status}}}} — 7 days */
function pcBuildLog_(done, M, eng) {
  var rank = { sent: 0, unconfirmed: 1, dry: 2, 'no-key': 3, blocked: 4, failed: 5 }, cut = ymdAdd_(M.day, -PC_LOG_D), sent = {};
  Object.keys(done || {}).sort().forEach(function (k) {
    var r = done[k], i = k.lastIndexOf('|');
    if (!r || !r.s || i < 1 || !r.d || r.d < cut) return;
    var id = k.slice(0, i), u = k.slice(i + 1), e = sent[id] || (sent[id] = { s: r.s, at: r.at, ch: [], ev: r.ev || '', day: r.day || '', to: {} });
    e.to[u] = r.s;
    if ((rank[r.s] == null ? 9 : rank[r.s]) > (rank[e.s] == null ? 9 : rank[e.s])) e.s = r.s;
    if (String(r.at || '') > String(e.at || '')) e.at = r.at;
    pcArr_(r.ch).forEach(function (c) { if (e.ch.indexOf(c) < 0) e.ch.push(c); });
    if (r.why) e.why = r.why;
    if (r.n) e.n = Math.max(e.n || 0, r.n);
  });
  return { v: 1, engine: eng, sent: sent };
}
function pcPushLog_(log) {
  var copy = JSON.parse(JSON.stringify(log));
  delete copy.engine.lastRun;
  var h = pcHash_(JSON.stringify(copy)), prev = ubGet_('pc_logh') || {};
  if (prev.h === h && prev.at && Date.now() - prev.at < PC_BEAT_MIN * 60000) return false;
  var o = {}; o[PC_LOG_KEY] = JSON.stringify(log);
  ubFetch_('/sync/push', { method: 'post', payload: JSON.stringify({ data: o }) });
  ubSet_('pc_logh', { h: h, at: Date.now() });
  return true;
}
function pcCfg_(c) {
  var o = { waterDays: 14, times: { day: PC_TIMES.day, ask: '11:00', reask: '15:00', eod: PC_TIMES.eod, esc: PC_TIMES.esc }, wa: { eve: true, day: true, notdone: true, noanswer: true }, units: {}, esc: [] };
  if (c && typeof c === 'object') {
    if (+c.waterDays > 0) o.waterDays = +c.waterDays;
    if (c.times && typeof c.times === 'object') Object.keys(o.times).forEach(function (k) { if (/^\d{2}:\d{2}$/.test(String(c.times[k] || ''))) o.times[k] = String(c.times[k]); });
    if (c.wa && typeof c.wa === 'object') Object.keys(o.wa).forEach(function (k) { if (c.wa[k] === false) o.wa[k] = false; });
    if (c.units && typeof c.units === 'object') o.units = c.units;
    if (Array.isArray(c.esc)) o.esc = c.esc.filter(Boolean);
  }
  return o;
}
function pcUsers_(data) {
  var o = {};
  pcArr_(ubParse_(data.hydroPro_users, [])).forEach(function (u) { if (u && u.username && u.active !== false && u.disabled !== true) o[pcLc_(u.username)] = u; });
  return o;
}
/* Dr Amy and Eyal when a job carries no escalation list: v4's leader usernames first, then surname first, as the app does */
function pcBoss_(users) {
  var find = function (rx) { var ks = Object.keys(users).sort(); for (var i = 0; i < ks.length; i++) { var u = users[ks[i]]; if (rx.test([u.username, u.fullname, u.fullName, u.name, u.email].join(' '))) return ks[i]; } return ''; };
  var byName = function (nm) { if (typeof LEGACY_USERS !== 'object' || !LEGACY_USERS) return ''; var ks = Object.keys(users).sort(); for (var i = 0; i < ks.length; i++) if (LEGACY_USERS[ks[i]] === nm) return ks[i]; return ''; };
  var amy = byName('Dr Amy') || find(/patdu/i) || find(/\bamy\b/i), eyal = byName('Eyal') || find(/benari|ben[ ._-]?ari/i) || find(/\beyal\b/i);
  return [amy, eyal].filter(function (x, i, a) { return x && a.indexOf(x) === i; });
}
function pcName_(users, un) { var u = users[pcLc_(un)]; return u ? String(u.fullname || u.fullName || u.name || un) : String(un || ''); }
function pcFmt_(ymd) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '')); if (!m) return String(ymd || ''); var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return PC_DOW[d.getUTCDay()] + ' ' + (+m[3]) + ' ' + PC_MON[+m[2] - 1]; }
function pcHol_(v) { var h = ubParse_(v, {}) || {}, o = {}; if (h && typeof h === 'object' && !Array.isArray(h)) Object.keys(h).forEach(function (d) { if (h[d] && !h[d].removed && /^\d{4}-\d{2}-\d{2}$/.test(d)) o[d] = 1; }); return o; }
function pcIsWork_(ymd, hol) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '')); if (!m) return true; return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay() !== 0 && !(hol || {})[ymd]; }
function pcNextWork_(ymd, hol) { var d = ymd, g = 0; while (!pcIsWork_(d, hol) && g++ < 40) d = ymdAdd_(d, 1); return d; }
function pcNum_(u) { var m = /(\d+)$/.exec(String(u || '')); return m ? +m[1] : 99; }
function pcLc_(x) { return String(x == null ? '' : x).trim().toLowerCase(); }
function pcArr_(v) { return Array.isArray(v) ? v : []; }
function pcClip_(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function pcHash_(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0; } return h.toString(16); }
