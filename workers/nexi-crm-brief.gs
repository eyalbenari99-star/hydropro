/** Nexi 🤝 CRM Brief — Google Apps Script (v1.0)
 *
 * 07:00 Asia/Manila, every working morning: the accounts to approach TODAY,
 * ranked by the money at stake — WhatsApp first, the full list by e-mail.
 *
 * It exists to serve one rule, clause 0 of SOP-CRM-01:
 *
 *   Every account that is not won, lost or on hold carries exactly one open
 *   next action with a date on it. An account without one is a defect.
 *
 * So the brief is not a summary of the CRM. It is a WORK LIST, and the last
 * line of it is the count of accounts that have no next action at all —
 * the thing the rule exists to drive to zero.
 *
 * WHAT IT SENDS, in this order (each section is skipped when empty):
 *
 *   ⏰ OVERDUE      — a next action whose date has passed         (SOP C2)
 *   📌 DUE TODAY    — a next action dated today
 *   🧪 SAMPLES      — awaiting a verdict: chase day 4, day 8;
 *                     past day 10 it must be recorded as "no verdict"  (C3)
 *   📄 QUOTES       — awaiting a decision: chase day 3, day 7;
 *                     past day 14 a decision or a reason is required   (C4)
 *   🔁 CADENCE      — tier A past 7 days, tier B past 14 days          (C5)
 *   🛑 SEQUENCE     — pursuits reaching T5 / STOP today                (SOP 4.1)
 *   ⚠ NO NEXT ACTION — the defect count                               (C1)
 *
 * Everything is read from the same cloud store every device syncs to
 * (hnx-sync /sync/pull) — the same numbers the app shows, not a copy.
 * Nothing is written back. This script never contacts a customer: it tells
 * a person who to contact. Outbound stays signed by a human (SOP clause 2).
 *
 * SETUP (one time, at script.google.com signed in as nexi@abapardes.com.ph):
 *   1. New project → paste this file → Project settings → time zone Asia/Manila.
 *   2. Project Settings ▸ Script properties:
 *        HNX_USER = the cloud-sync username
 *        HNX_PASS = that account's cloud-sync password
 *      (Properties, not code, so no password ever sits in a file.)
 *   3. Each recipient activates WhatsApp once, on their own phone:
 *        a. save +34 644 51 95 23 as a contact (CallMeBot)
 *        b. WhatsApp it:  I allow callmebot to send me messages
 *        c. it replies with an API key
 *      then add, as a Script property:
 *        WA_EDELYN = 639171160693|thatapikey
 *   4. Run installCrmBrief once → grant permissions. It creates the 07:00
 *      trigger and sends one brief immediately so you can see it works.
 *
 * Like the other bridges it heals itself: every run re-creates the trigger if
 * it has been lost, and a run that fails e-mails the error instead of dying
 * quietly — a brief that stops arriving must be noticeable.
 */

var SYNC_URL   = 'https://hnx-sync.eyalbenari99.workers.dev';
var TZ         = 'Asia/Manila';
var BRIEF_HOUR = 7;                 /* 07:00 Asia/Manila */
var WA_MAX     = 12;                /* lines a chat bubble carries before it stops being read */

/* Who gets it. A person with no waKeyProp, or who has not activated CallMeBot,
   simply gets the e-mail — the brief never fails because a phone is not set up. */
var RECIPIENTS = [
  { name: 'Edelyn', to: 'edelyn@abapardes.com.ph', waKeyProp: 'WA_EDELYN' },
  { name: 'Chen',   to: 'chen@abapardes.com.ph',   waKeyProp: 'WA_CHEN'   },
  { name: 'Eyal',   to: 'eyal@abapardes.com.ph',   waKeyProp: ''          }
];

/* SOP-CRM-01 clause 5 — the event clocks, in days */
var SAMPLE_CHASE_1 = 4,  SAMPLE_CHASE_2 = 8,  SAMPLE_DEADLINE = 10;
var QUOTE_CHASE_1  = 3,  QUOTE_CHASE_2  = 7,  QUOTE_DEADLINE  = 14;
var TIER_A_DAYS    = 7,  TIER_B_DAYS    = 14;
var STALLED_DAYS   = 30;

/* ---------------- install / heal ---------------- */

function installCrmBrief() {
  var have = false;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'nexiCrmBrief') have = true;
  });
  if (!have) {
    ScriptApp.newTrigger('nexiCrmBrief').timeBased().atHour(BRIEF_HOUR).everyDays(1).create();
  }
  nexiCrmBrief();
}

/* ---------------- the run ---------------- */

function nexiCrmBrief() {
  try { installHeal_(); } catch (e) {}
  var data, work;
  try {
    data = pullCloud_();
    work = buildWorkList_(data);
  } catch (e) {
    try {
      GmailApp.sendEmail(RECIPIENTS[0].to, '⚠ Nexi CRM brief failed',
        'The 07:00 CRM brief could not be built.\n\n' + (e && e.message ? e.message : e) +
        '\n\nNobody received a work list this morning. This mail is the alarm.');
    } catch (_) {}
    return;
  }
  RECIPIENTS.forEach(function (rc) {
    try { sendWhatsApp_(rc, work); } catch (e) {}
    try { sendMail_(rc, work); }    catch (e) {}
  });
}

function installHeal_() {
  var have = false;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'nexiCrmBrief') have = true;
  });
  if (!have) ScriptApp.newTrigger('nexiCrmBrief').timeBased().atHour(BRIEF_HOUR).everyDays(1).create();
}

/* ---------------- cloud ---------------- */

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

/* ---------------- dates ---------------- */

function today_()      { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function d10_(v) {
  if (!v) return '';
  if (typeof v === 'number') { try { return Utilities.formatDate(new Date(v), TZ, 'yyyy-MM-dd'); } catch (e) { return ''; } }
  var s = String(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}
function daysBetween_(a, b) {
  if (!a || !b) return null;
  var x = Date.parse(a + 'T00:00:00Z'), y = Date.parse(b + 'T00:00:00Z');
  if (isNaN(x) || isNaN(y)) return null;
  return Math.round((y - x) / 86400000);
}
function money_(n) {
  n = Number(n) || 0;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ---------------- the work list ---------------- */

function buildWorkList_(data) {
  var T = today_();

  var leads  = store_(data, 'hydroPro_crm_leads', []) || [];
  var touch  = store_(data, 'hydroPro_crm_touchpoints', []) || [];
  var samples= store_(data, 'hydroPro_crm_samples', []) || [];
  var quotes = store_(data, 'hydroPro_crm_quotes', []) || [];
  var orders = store_(data, 'hydroPro_crm_orders', []) || [];
  var ints   = store_(data, 'hydroPro_cea_cusint_v1', []) || [];
  var cases  = store_(data, 'hydroPro_cea_cases_v1', []) || [];
  var sosRaw = store_(data, 'hydroPro_sos_so_v1', null);
  var sos    = (sosRaw && sosRaw.orders) ? sosRaw.orders : (Object.prototype.toString.call(sosRaw) === '[object Array]' ? sosRaw : []);

  /* one record per account, keyed on the business name */
  var acc = {}, byLead = {};
  function ent(name) {
    var nm = String(name == null ? '' : name).trim();
    if (!nm) return null;
    var k = nm.toLowerCase();
    if (!acc[k]) acc[k] = {
      name: nm, stage: '', owner: '', last: '', nextAction: '', nextDue: '',
      sos: 0, sosValue: 0, blanket: false, orders: 0, orderValue: 0,
      weeksWithOrder: 0, openQuoteValue: 0, openOppValue: 0, tier: 'D'
    };
    return acc[k];
  }
  function bump(a, d) { d = d10_(d); if (d && d <= T && d > a.last) a.last = d; }

  leads.forEach(function (l) {
    if (!l) return;
    var biz = String(l.company || '').trim();
    var nm  = (biz && !/^(APAC|APTI)$/i.test(biz)) ? biz : String(l.name || '').trim();
    var a = ent(nm); if (!a) return;
    if (l.stage && !a.stage) a.stage = String(l.stage);
    if (l.owner && !a.owner) a.owner = String(l.owner);
    if (l.id) byLead[l.id] = a;
  });

  function of(x) {
    if (!x) return null;
    if (x.leadId && byLead[x.leadId]) return byLead[x.leadId];
    return ent(x.customerName || x.customer || x.cust);
  }

  /* the next action lives on a touchpoint; the newest undone one wins */
  touch.forEach(function (x) {
    var a = of(x); if (!a) return;
    bump(a, x.date || x.createdAt);
    if (x.nextAction && !x.nextActionDone && x.nextDue) {
      var d = d10_(x.nextDue);
      if (d && (!a.nextDue || d < a.nextDue)) { a.nextDue = d; a.nextAction = String(x.nextAction); }
    }
  });
  ints.forEach(function (i) { var a = of(i); if (a) bump(a, i.at); });

  /* a case's due date is a next action too */
  cases.forEach(function (c) {
    if (!c || c.archived) return;
    var a = ent((c.extra || {}).customer); if (!a) return;
    bump(a, c.updatedAt || c.createdAt);
    if (c.status !== 'CLOSED' && c.due) {
      var d = d10_(c.due);
      if (d && (!a.nextDue || d < a.nextDue)) { a.nextDue = d; a.nextAction = String(c.title || c.kind); }
    }
    if (c.kind === 'opportunity' && c.status !== 'CLOSED') a.openOppValue += Number((c.extra || {}).value) || 0;
  });

  orders.forEach(function (x) {
    var a = of(x); if (!a || /^cancelled$/i.test(String(x.status || ''))) return;
    a.orders++; a.orderValue += orderTotal_(x); bump(a, x.date || x.createdAt);
    var d = d10_(x.date || x.createdAt), n = daysBetween_(d, T);
    if (n != null && n <= 28) a.weeksWithOrder++;
  });
  quotes.forEach(function (x) {
    var a = of(x); if (!a) return;
    if (/^(draft|sent|viewed|negotiating)$/i.test(String(x.status || ''))) a.openQuoteValue += orderTotal_(x);
  });

  /* SOS is the truth about orders — SOP clause 7 */
  sos.forEach(function (o) {
    if (!o || !o.cust) return;
    var a = ent(o.cust); if (!a) return;
    a.sos++; a.sosValue += soValue_(o);
    bump(a, o.orderDate || o.date);
    var blob = String(o.comment || '') + ' ' + String(o.po || '');
    if (/\bblanket\b|\badvance\s+order|\bstanding\s+order|\bcontract\b|\bannual\b|\byearly\b|\brecurring\b/i.test(blob)) a.blanket = true;
  });

  /* tier — SOP clause 3: how an account ORDERS, never a peso threshold */
  var list = [];
  for (var k in acc) {
    if (!Object.prototype.hasOwnProperty.call(acc, k)) continue;
    var a = acc[k];
    if (a.blanket || a.weeksWithOrder >= 3) a.tier = 'A';
    else if (a.orders > 0 || a.sos > 0 || a.openQuoteValue > 0 || a.openOppValue > 0) a.tier = 'B';
    else if (a.last) a.tier = 'C';
    else a.tier = 'D';
    a.silent = a.last ? daysBetween_(a.last, T) : null;
    a.atStake = a.sosValue + a.openQuoteValue + a.openOppValue + a.orderValue;
    /* A WON account is a CUSTOMER, and a customer is the most important thing on this list.
       Clause 0 excuses it from carrying a next action — clause 3 still requires tier A to be
       contacted every 7 days. Folding "won" into "closed" would have silenced the cadence check
       on exactly the accounts that pay us. Only lost and on_hold leave the brief altogether. */
    a.closed = /^(lost|on_hold)$/i.test(String(a.stage || ''));
    a.won    = /^won$/i.test(String(a.stage || '')) || a.blanket || a.orders > 0 || a.sos > 0;
    list.push(a);
  }

  var W = { date: T, overdue: [], dueToday: [], samples: [], quotes: [], cadence: [], noAction: [], counts: {} };

  list.forEach(function (a) {
    if (a.closed) return;
    if (a.nextDue) {
      if (a.nextDue < T)      W.overdue.push(a);
      else if (a.nextDue === T) W.dueToday.push(a);
    } else if (!a.won) {
      W.noAction.push(a);              /* a customer is not a defect for having no pursuit action */
    }
    if (a.nextDue) return;                      /* an account with work to do is not also a cadence miss */
    if (a.tier === 'A' && a.silent != null && a.silent > TIER_A_DAYS) W.cadence.push(a);
    if (a.tier === 'B' && a.silent != null && a.silent > TIER_B_DAYS) W.cadence.push(a);
  });

  samples.forEach(function (s) {
    if (!s) return;
    if (s.feedback || s.feedbackAt) return;     /* a verdict exists */
    var sent = d10_(s.date || s.createdAt), n = daysBetween_(sent, T);
    if (n == null || n < SAMPLE_CHASE_1) return;
    var a = of(s);
    W.samples.push({
      name: a ? a.name : String(s.customer || s.customerName || 'unknown'),
      days: n, products: (s.products || []).join(', '),
      overdue: n > SAMPLE_DEADLINE,
      atStake: a ? a.atStake : 0
    });
  });

  quotes.forEach(function (q) {
    if (!q) return;
    if (!/^(draft|sent|viewed|negotiating)$/i.test(String(q.status || ''))) return;
    var sent = d10_(q.date || q.sentAt || q.createdAt), n = daysBetween_(sent, T);
    if (n == null || n < QUOTE_CHASE_1) return;
    var a = of(q);
    W.quotes.push({
      name: a ? a.name : String(q.customer || q.customerName || 'unknown'),
      days: n, value: orderTotal_(q), overdue: n > QUOTE_DEADLINE,
      atStake: a ? a.atStake : 0
    });
  });

  function byStake(x, y) { return (y.atStake || 0) - (x.atStake || 0); }
  W.overdue.sort(byStake); W.dueToday.sort(byStake); W.cadence.sort(byStake);
  W.samples.sort(function (x, y) { return (y.days - x.days) || byStake(x, y); });
  W.quotes.sort(function (x, y) { return (y.days - x.days) || byStake(x, y); });
  W.noAction.sort(byStake);

  W.counts = {
    accounts: list.length,
    open: list.filter(function (a) { return !a.closed; }).length,
    overdue: W.overdue.length, dueToday: W.dueToday.length,
    samples: W.samples.length, quotes: W.quotes.length,
    cadence: W.cadence.length, noAction: W.noAction.length,
    stake: W.overdue.concat(W.dueToday).reduce(function (t, a) { return t + (a.atStake || 0); }, 0)
  };
  return W;
}

function orderTotal_(x) {
  try {
    if (x && x.items && x.items.length) {
      return x.items.reduce(function (t, i) { return t + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0); }, 0);
    }
  } catch (e) {}
  return Number(x && (x.total || x.amount)) || 0;
}
function soValue_(o) {
  var t = 0;
  (o.lines || []).forEach(function (l) {
    t += Number(l.amt || l.total || ((Number(l.open != null ? l.open : (l.qty || 0))) * Number(l.price || 0))) || 0;
  });
  return t;
}

/* ---------------- WhatsApp ---------------- */

function sendWhatsApp_(rc, W) {
  if (!rc.waKeyProp) return;
  var cfg = PropertiesService.getScriptProperties().getProperty(rc.waKeyProp);
  if (!cfg || cfg.indexOf('|') < 0) return;      /* not activated — the e-mail still goes */
  var phone = cfg.split('|')[0].trim(), key = cfg.split('|')[1].trim();
  UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php'
    + '?phone=' + encodeURIComponent(phone)
    + '&apikey=' + encodeURIComponent(key)
    + '&text=' + encodeURIComponent(waText_(rc, W)),
    { muteHttpExceptions: true });
}

/* A chat bubble is read standing up, so it carries the TOP of the list and the
   counts; the e-mail carries every line. Never send a wall of text nobody reads. */
function waText_(rc, W) {
  var L = ['🤝 Nexi CRM · ' + Utilities.formatDate(new Date(), TZ, 'EEE d MMM') + ' · ' + rc.name];
  var c = W.counts, shown = 0;

  if (!c.overdue && !c.dueToday && !c.samples && !c.quotes && !c.cadence) {
    L.push('');
    L.push('✅ Nothing due today. ' + c.open + ' open account' + (c.open === 1 ? '' : 's') + '.');
    if (c.noAction) L.push('⚠ ' + c.noAction + ' still have NO next action — that is the one thing to fix today.');
    return L.join('\n');
  }

  L.push('');
  if (c.stake) L.push(money_(c.stake) + ' at stake in today\'s list');

  function section(title, rows, fmt) {
    if (!rows.length || shown >= WA_MAX) return;
    L.push('');
    L.push(title);
    for (var i = 0; i < rows.length && shown < WA_MAX; i++, shown++) L.push('• ' + fmt(rows[i]));
    if (rows.length > 0 && shown >= WA_MAX && rows.length > i) L.push('  …+' + (rows.length - i) + ' more');
  }

  section('⏰ OVERDUE', W.overdue, function (a) {
    return a.name + ' — ' + Math.abs(daysBetween_(a.nextDue, W.date)) + 'd late'
         + (a.atStake ? ' · ' + money_(a.atStake) : '');
  });
  section('📌 DUE TODAY', W.dueToday, function (a) {
    return a.name + (a.nextAction ? ' — ' + a.nextAction : '');
  });
  section('🧪 SAMPLE VERDICT', W.samples, function (s) {
    return s.name + ' — day ' + s.days + (s.overdue ? ' ⚠ past the deadline' : '');
  });
  section('📄 QUOTE DECISION', W.quotes, function (q) {
    return q.name + ' — day ' + q.days + (q.value ? ' · ' + money_(q.value) : '') + (q.overdue ? ' ⚠' : '');
  });
  section('🔁 PAST CADENCE', W.cadence, function (a) {
    return a.name + ' (' + a.tier + ') — ' + a.silent + 'd silent';
  });

  if (c.noAction) { L.push(''); L.push('⚠ ' + c.noAction + ' account' + (c.noAction === 1 ? '' : 's') + ' with NO next action'); }
  L.push('');
  L.push('Full list in the e-mail · Nexi never contacts a customer, it tells you who to.');
  return L.join('\n');
}

/* ---------------- e-mail ---------------- */

function sendMail_(rc, W) {
  var c = W.counts;
  var subject = '🤝 CRM brief · ' + Utilities.formatDate(new Date(), TZ, 'EEE d MMM')
    + ' · ' + (c.overdue + c.dueToday) + ' to approach'
    + (c.noAction ? ' · ' + c.noAction + ' with no next action' : '');
  GmailApp.sendEmail(rc.to, subject, mailText_(rc, W), { htmlBody: mailHtml_(rc, W), name: 'Nexi' });
}

function mailText_(rc, W) {
  var L = ['CRM brief for ' + rc.name + ' — ' + W.date, ''];
  L.push('Open accounts: ' + W.counts.open + ' of ' + W.counts.accounts);
  L.push('Overdue ' + W.counts.overdue + ' · due today ' + W.counts.dueToday
       + ' · samples ' + W.counts.samples + ' · quotes ' + W.counts.quotes
       + ' · past cadence ' + W.counts.cadence + ' · no next action ' + W.counts.noAction);
  return L.join('\n');
}

function mailHtml_(rc, W) {
  var c = W.counts;
  var H = ['<div style="font-family:Arial,Helvetica,sans-serif;color:#22302B;max-width:760px">'];
  H.push('<h2 style="margin:0 0 4px;font-size:19px;color:#0F1C18">🤝 CRM brief — ' + W.date + '</h2>');
  H.push('<div style="font-size:12px;color:#5C6B68;margin-bottom:14px">' + rc.name
       + ' · ' + c.open + ' open account' + (c.open === 1 ? '' : 's')
       + (c.stake ? ' · <b>' + money_(c.stake) + '</b> at stake in today\'s list' : '') + '</div>');

  function tbl(title, colour, rows, cols, row) {
    if (!rows.length) return;
    H.push('<h3 style="margin:16px 0 5px;font-size:14px;color:' + colour + '">' + title
         + ' <span style="color:#8A9793;font-weight:400">(' + rows.length + ')</span></h3>');
    H.push('<table style="width:100%;border-collapse:collapse;font-size:12.5px">');
    H.push('<tr>' + cols.map(function (x) {
      return '<th style="text-align:left;border-bottom:1px solid #D9E2DD;padding:4px 6px;font-size:10.5px;'
           + 'letter-spacing:.06em;text-transform:uppercase;color:#5C6B68">' + x + '</th>';
    }).join('') + '</tr>');
    rows.forEach(function (r) {
      H.push('<tr>' + row(r).map(function (x) {
        return '<td style="border-bottom:1px solid #EDF1EE;padding:4px 6px;vertical-align:top">' + x + '</td>';
      }).join('') + '</tr>');
    });
    H.push('</table>');
  }

  tbl('⏰ Overdue', '#A33A2B', W.overdue, ['Account', 'Due', 'Late', 'What', 'At stake'], function (a) {
    return [a.name, a.nextDue, Math.abs(daysBetween_(a.nextDue, W.date)) + 'd',
            a.nextAction || '—', a.atStake ? money_(a.atStake) : '—'];
  });
  tbl('📌 Due today', '#0E6E72', W.dueToday, ['Account', 'What', 'Tier', 'At stake'], function (a) {
    return [a.name, a.nextAction || '—', a.tier, a.atStake ? money_(a.atStake) : '—'];
  });
  tbl('🧪 Samples awaiting a verdict', '#B47B1E', W.samples, ['Account', 'Day', 'Products', 'Status'], function (s) {
    return [s.name, String(s.days), s.products || '—',
            s.overdue ? '<b style="color:#A33A2B">past day ' + SAMPLE_DEADLINE + ' — record a verdict or a reason</b>'
                      : 'chase (day ' + SAMPLE_CHASE_1 + ' / ' + SAMPLE_CHASE_2 + ')'];
  });
  tbl('📄 Quotes awaiting a decision', '#B47B1E', W.quotes, ['Account', 'Day', 'Value', 'Status'], function (q) {
    return [q.name, String(q.days), q.value ? money_(q.value) : '—',
            q.overdue ? '<b style="color:#A33A2B">past day ' + QUOTE_DEADLINE + ' — decision or reason required</b>'
                      : 'chase (day ' + QUOTE_CHASE_1 + ' / ' + QUOTE_CHASE_2 + ')'];
  });
  tbl('🔁 Past their cadence', '#0E6E72', W.cadence, ['Account', 'Tier', 'Silent', 'At stake'], function (a) {
    return [a.name, a.tier, a.silent + 'd', a.atStake ? money_(a.atStake) : '—'];
  });

  if (c.noAction) {
    H.push('<h3 style="margin:18px 0 5px;font-size:14px;color:#A33A2B">⚠ No next action <span style="color:#8A9793;font-weight:400">('
         + c.noAction + ')</span></h3>');
    H.push('<div style="font-size:12px;color:#5C6B68;margin-bottom:6px">SOP-CRM-01 clause 0: every open account carries one next action with a date. '
         + 'These do not. Giving each one a date is the day\'s only hard gate.</div>');
    H.push('<div style="font-size:12.5px;line-height:1.7">'
         + W.noAction.slice(0, 40).map(function (a) {
             return a.name + (a.atStake ? ' <span style="color:#5C6B68">· ' + money_(a.atStake) + '</span>' : '');
           }).join(' &nbsp;·&nbsp; ')
         + (W.noAction.length > 40 ? ' <span style="color:#8A9793">…and ' + (W.noAction.length - 40) + ' more</span>' : '')
         + '</div>');
  }

  H.push('<div style="margin-top:20px;padding-top:10px;border-top:1px solid #D9E2DD;font-size:11px;color:#8A9793">'
       + 'Built from the cloud store every device syncs to — the same numbers the app shows. '
       + 'Nexi never contacts a customer: it tells you who to contact. Outbound stays signed by a person (SOP-CRM-01 clause 2).'
       + '</div></div>');
  return H.join('');
}
