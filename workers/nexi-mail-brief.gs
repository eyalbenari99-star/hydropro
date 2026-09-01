/** Nexi 📬 Mail Brief — Google Apps Script (one copy per mailbox)
 *
 * Runs UNDER THE MAILBOX OWNER'S OWN ACCOUNT (Google only lets a script
 * read the inbox it runs as), once every morning. It reads the last day's
 * mail, sorts what matters from what doesn't, and sends one e-mail:
 *
 *   ✉️ Needs your reply — real people writing to you, newest first,
 *      each with a two-line summary and, when the AI brain is connected,
 *      a suggested reply ALREADY SAVED AS A DRAFT on that thread.
 *      Nothing is ever sent by itself — you open the draft, edit, send.
 *   👀 Worth a look — updates and FYIs addressed to you.
 *   A one-line count of everything else (newsletters, promos, machines).
 *
 * INSTALL (5 minutes, once per mailbox — do it under eyal@abapardes.com.ph
 * and again under eyalbenari99@gmail.com):
 *   1. script.google.com signed in as THAT account → New project → paste
 *      this file → Project settings → time zone Asia/Manila.
 *   2. (Optional, for suggested replies) Script properties → add:
 *        AI_TOKEN = the nexi-ai worker's bearer token
 *                   (Nexi → Settings → AI brain shows it)
 *      Without it the brief still arrives — just without drafted replies.
 *   3. Run installMailBrief once → grant permissions. It creates the daily
 *      trigger and sends a first brief immediately.
 *
 * The AI suggestions go through Nexi's own nexi-ai worker (the same brain
 * the app uses); the e-mail text sent there is capped and used only to
 * draft the reply. Like the other Nexi scripts it heals itself: the
 * trigger re-creates itself if lost, and a failed run e-mails the error.
 */

var MAIL_BRIEF_HOUR = 6;                // 06:00 Asia/Manila (after the farm brief)
var MAIL_TZ         = 'Asia/Manila';
var AI_URL          = 'https://nexi-ai.eyalbenari99.workers.dev';
var MAX_REPLY_DRAFTS = 5;               // AI drafts per morning, newest threads first
var LOOKBACK_HOURS   = 26;              // a little more than a day, so nothing slips

/* ---------------- install / self-heal ---------------- */

function installMailBrief() {
  ensureMailTrigger_();
  nexiMailBrief();                      // send one now so setup is verifiable
}

function ensureMailTrigger_() {
  var have = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'nexiMailBrief';
  });
  if (!have) {
    ScriptApp.newTrigger('nexiMailBrief')
      .timeBased().everyDays(1).atHour(MAIL_BRIEF_HOUR).inTimezone(MAIL_TZ).create();
  }
}

/* ---------------- the brief ---------------- */

function nexiMailBrief() {
  ensureMailTrigger_();
  var me = Session.getActiveUser().getEmail();
  try {
    var picked = collectMail_(me);
    var html = renderMailBrief_(me, picked);
    var today = Utilities.formatDate(new Date(), MAIL_TZ, 'EEE d MMM yyyy');
    /* subject lines cannot carry HTML entities, so use a 2-byte symbol there */
    GmailApp.sendEmail(me, '✉ Nexi Mail Brief — ' + today,
      'Open this e-mail in an HTML mail client.',
      { htmlBody: entifyM_(html), name: 'Nexi · Mail' });
  } catch (e) {
    GmailApp.sendEmail(me, '⚠ Nexi Mail Brief failed',
      'The mail brief could not be produced:\n\n' + e);
  }
}

/* ---------------- reading the inbox ---------------- */

function collectMail_(me) {
  var since = Math.floor((Date.now() - LOOKBACK_HOURS * 3600000) / 1000);
  var threads = GmailApp.search('in:inbox after:' + since + ' -category:promotions -category:social', 0, 60);
  var needsReply = [], worthALook = [], restCount = 0;
  threads.forEach(function (th) {
    try {
      var msgs = th.getMessages();
      var last = msgs[msgs.length - 1];
      var from = String(last.getFrom() || '');
      var fromMe = from.indexOf(me) >= 0;
      var toMe = (String(last.getTo() || '') + ' ' + String(last.getCc() || '')).indexOf(me) >= 0;
      var isAuto = /no-?reply|noreply|notification|mailer-daemon|do-?not-?reply|@google\.com|@netlify|@github\.com|calendar-notification/i.test(from);
      var rec = {
        subject: th.getFirstMessageSubject() || '(no subject)',
        from: from.replace(/<.*>/, '').trim() || from,
        when: Utilities.formatDate(last.getDate(), MAIL_TZ, 'EEE HH:mm'),
        unread: th.isUnread(),
        thread: th, last: last
      };
      if (!fromMe && toMe && !isAuto && th.isUnread()) needsReply.push(rec);
      else if (!fromMe && th.isUnread() && !isAuto) worthALook.push(rec);
      else restCount++;
    } catch (e) { restCount++; }
  });
  needsReply.sort(function (a, b) { return b.last.getDate() - a.last.getDate(); });
  return { needsReply: needsReply, worthALook: worthALook.slice(0, 10), restCount: restCount };
}

/* ---------------- AI summary + reply draft (optional) ---------------- */

function aiSuggest_(rec) {
  var token = PropertiesService.getScriptProperties().getProperty('AI_TOKEN');
  if (!token) return null;
  try {
    var body = String(rec.last.getPlainBody() || '').slice(0, 4000);
    var res = JSON.parse(UrlFetchApp.fetch(AI_URL + '/ai/ask', {
      method: 'post', contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true,
      payload: JSON.stringify({
        q: 'This e-mail was sent to me (' + Session.getActiveUser().getEmail() + '). '
          + 'First give a ONE-SENTENCE summary of what they want, then on a new line after '
          + '"REPLY:" write a short, polite reply I could send, in the same language the '
          + 'e-mail uses. Do not invent facts I did not give you.\n\n'
          + 'From: ' + rec.from + '\nSubject: ' + rec.subject + '\n\n' + body
      })
    }).getContentText());
    if (!res.answer) return null;
    var parts = String(res.answer).split(/\nREPLY:\s*/i);
    return { summary: (parts[0] || '').trim(), reply: (parts[1] || '').trim() };
  } catch (e) { return null; }
}

/* ---------------- render + send ---------------- */

function renderMailBrief_(me, picked) {
  var out = ['<meta charset="UTF-8"><div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;">'
    + '<h2 style="margin:0 0 2px 0;">📬 Mail Brief</h2>'
    + '<div style="color:#777;margin-bottom:14px;">' + escM_(me) + ' · '
    + Utilities.formatDate(new Date(), MAIL_TZ, 'EEEE, d MMMM yyyy · HH:mm') + '</div>'];

  out.push('<h3 style="margin:16px 0 6px 0;border-bottom:1px solid #ddd;padding-bottom:3px;">✉️ Needs your reply ('
    + picked.needsReply.length + ')</h3>');
  if (!picked.needsReply.length) out.push('<div style="color:#2e7d32;">Nothing waiting on you.</div>');
  var drafted = 0;
  picked.needsReply.slice(0, 12).forEach(function (rec) {
    out.push('<div style="margin:8px 0;padding:8px 10px;border:1px solid #eee;border-radius:8px;">'
      + '<div><b>' + escM_(rec.from) + '</b> <span style="color:#777;">· ' + escM_(rec.when) + '</span></div>'
      + '<div>' + escM_(rec.subject) + '</div>');
    if (drafted < MAX_REPLY_DRAFTS) {
      var ai = aiSuggest_(rec);
      if (ai) {
        drafted++;
        out.push('<div style="color:#555;margin-top:4px;">' + escM_(ai.summary) + '</div>');
        if (ai.reply) {
          try {
            rec.last.createDraftReply(ai.reply);
            out.push('<div style="color:#1565c0;margin-top:2px;">✏️ Suggested reply saved to your Drafts — review and send.</div>');
          } catch (e) {
            out.push('<div style="color:#777;margin-top:2px;">Suggested reply: ' + escM_(ai.reply).slice(0, 400) + '</div>');
          }
        }
      }
    }
    out.push('</div>');
  });

  out.push('<h3 style="margin:16px 0 6px 0;border-bottom:1px solid #ddd;padding-bottom:3px;">👀 Worth a look ('
    + picked.worthALook.length + ')</h3>');
  if (!picked.worthALook.length) out.push('<div style="color:#777;">Nothing new.</div>');
  else {
    out.push('<ul style="margin:4px 0;">');
    picked.worthALook.forEach(function (rec) {
      out.push('<li><b>' + escM_(rec.from) + '</b> — ' + escM_(rec.subject)
        + ' <span style="color:#777;">· ' + escM_(rec.when) + '</span></li>');
    });
    out.push('</ul>');
  }

  out.push('<div style="color:#999;font-size:11px;margin-top:14px;">' + picked.restCount
    + ' other message(s) in the last day looked routine (notifications, machines, already answered). '
    + (PropertiesService.getScriptProperties().getProperty('AI_TOKEN')
        ? 'Reply suggestions come from Nexi’s own AI brain and are saved as drafts — nothing sends itself.'
        : 'Add the AI_TOKEN script property to get suggested replies drafted automatically.')
    + '</div></div>');
  return out.join('');
}

/* ---------------- helpers ---------------- */

function eEnt_(m) { return '&#' + m.codePointAt(0) + ';'; }
function entifyM_(html) {
  return String(html).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, eEnt_);
}
function escM_(x) {
  return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
