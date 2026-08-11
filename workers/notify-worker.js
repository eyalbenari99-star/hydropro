/* Nexi Notify — Cloudflare Worker: daily SMS + email reminders for
   unapproved memos, using an office Android phone with an unlimited
   eSIM plan running the httpSMS app (httpsms.com) as the SMS engine.

   HOW IT WORKS
   · The Nexi app (v14.88+) uploads a small snapshot of "memos waiting
     approval" + the approver mobile numbers to the existing sync
     bucket at key  notify/pending.json  every time the list changes.
   · This worker runs on a daily schedule (7:00 AM Philippines),
     reads that snapshot, and:
       - texts the FINAL approver (Eyal) and the FIRST approver
         (Dr Amy, only if she hasn't approved yet) through the
         office phone via the httpSMS API — repeats every day
         until the memos are approved;
       - emails the HR and Accounting groups the full list
         (via Resend, optional).
   · POST /notify/test lets the app send a test SMS on demand.

   DEPLOY (one time, ~15 min)
     wrangler.toml:
       name = "nexi-notify"
       main = "notify-worker.js"
       compatibility_date = "2026-01-01"
       [triggers]
       crons = ["0 23 * * *"]        # 23:00 UTC = 7:00 AM Philippines
       [[r2_buckets]]
       binding = "R2"
       bucket_name = "<SAME BUCKET AS hnx-sync>"
     secrets (wrangler secret put ...):
       NOTIFY_TOKEN       # long random string; paste into Nexi's SMS setup
       HTTPSMS_API_KEY    # from httpsms.com dashboard (office phone)
       HTTPSMS_FROM       # the office phone's own number, e.g. +639171234567
       GMAIL_SCRIPT_URL   # option A (recommended): Google Apps Script web-app
                          #   URL created under nexi@abapardes.com.ph — emails
                          #   go out FROM the real company Gmail (see
                          #   docs/sms-email-setup-guide.md for the 10-line script)
       GMAIL_SCRIPT_KEY   # shared secret checked by that script
       RESEND_API_KEY     # option B (alternative): Resend API instead of Gmail
       MAIL_FROM          # option B only — verified sender in Resend
*/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!authed(req, env)) return json({ error: 'unauthorized' }, 401);
    if (req.method === 'POST' && url.pathname === '/notify/test') {
      const body = await req.json().catch(() => ({}));
      const to = normPH(body.to || '');
      if (!to) return json({ error: 'missing "to" number' }, 400);
      const r = await sendSMS(env, to, body.message || 'Nexi test: SMS reminders are working. 🌱');
      return json({ ok: r.ok, detail: r.detail });
    }
    if (req.method === 'POST' && url.pathname === '/notify/run') {
      const out = await runReminders(env);
      return json(out);
    }
    return json({ error: 'not found' }, 404);
  },
  async scheduled(_ev, env, ctx) {
    ctx.waitUntil(runReminders(env));
  },
};

function authed(req, env) {
  const h = req.headers.get('Authorization') || '';
  return env.NOTIFY_TOKEN && h === 'Bearer ' + env.NOTIFY_TOKEN;
}
function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function normPH(n) {
  n = String(n || '').replace(/[^\d+]/g, '');
  if (/^09\d{9}$/.test(n)) return '+63' + n.slice(1);
  if (/^639\d{9}$/.test(n)) return '+' + n;
  if (/^\+639\d{9}$/.test(n)) return n;
  return '';
}

async function sendSMS(env, to, content) {
  try {
    const r = await fetch('https://api.httpsms.com/v1/messages/send', {
      method: 'POST',
      headers: { 'x-api-key': env.HTTPSMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.HTTPSMS_FROM, to, content }),
    });
    return { ok: r.ok, detail: r.ok ? 'sent' : await r.text() };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

async function sendMail(env, to, subject, text) {
  if (!to.length) return { ok: false, detail: 'no recipients' };
  // Option A: company Gmail (nexi@abapardes.com.ph) via Google Apps Script
  if (env.GMAIL_SCRIPT_URL) {
    try {
      const r = await fetch(env.GMAIL_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: env.GMAIL_SCRIPT_KEY || '', to: to.join(','), subject, text }),
      });
      return { ok: r.ok, detail: r.ok ? 'sent via company Gmail' : await r.text() };
    } catch (e) {
      return { ok: false, detail: String(e) };
    }
  }
  // Option B: Resend
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return { ok: false, detail: 'email not configured' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }),
    });
    return { ok: r.ok, detail: r.ok ? 'sent' : await r.text() };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

async function runReminders(env) {
  const obj = await env.R2.get('notify/pending.json');
  if (!obj) return { ok: true, sent: 0, note: 'no snapshot yet' };
  let snap;
  try { snap = await obj.json(); } catch { return { ok: false, note: 'bad snapshot' }; }
  const pending = Array.isArray(snap.pending) ? snap.pending : [];
  // Snapshot older than 4 days → app hasn't synced; don't nag on stale data.
  const ageDays = (Date.now() - (Date.parse(snap.updatedAt || '') || 0)) / 86400000;
  if (!pending.length || ageDays > 4) return { ok: true, sent: 0, note: pending.length ? 'stale snapshot' : 'nothing pending' };

  const lines = pending.slice(0, 10).map(m =>
    `• ${m.title || m.id} (${m.date || ''}${m.gh ? ', ' + m.gh : ''})`).join('\n');
  const more = pending.length > 10 ? `\n…and ${pending.length - 10} more` : '';
  const results = [];

  const finalTo = normPH((snap.numbers || {}).final);
  if (finalTo) {
    results.push(await sendSMS(env, finalTo,
      `NEXI: ${pending.length} memo(s) still waiting YOUR final approval:\n${lines}${more}\nDaily reminder until approved.`));
  }
  const firstTo = normPH((snap.numbers || {}).first);
  const forFirst = pending.filter(m => !m.firstApproved);
  if (firstTo && forFirst.length) {
    results.push(await sendSMS(env, firstTo,
      `NEXI: ${forFirst.length} memo(s) waiting your approval (Dr. Amy):\n` +
      forFirst.slice(0, 10).map(m => `• ${m.title || m.id} (${m.date || ''})`).join('\n') +
      `\nDaily reminder until approved.`));
  }

  const emails = []
    .concat(String((snap.emails || {}).hr || '').split(','))
    .concat(String((snap.emails || {}).acct || '').split(','))
    .map(s => s.trim()).filter(Boolean);
  let mail = null;
  if (emails.length) {
    mail = await sendMail(env, emails,
      `ABA PARDES — ${pending.length} memo(s) NOT approved yet`,
      `Hello HR & Accounting,\n\nThe following memos are still waiting approval:\n\n` +
      pending.map(m => `- ${m.title || m.id} · ${m.date || ''} · ${m.gh || 'individual'} · ` +
        `${m.amount ? 'PHP ' + m.amount : (m.noMoney ? 'warning-only' : '—')} · waiting: ${m.waitingFor || ''}`).join('\n') +
      `\n\nPlease follow up until approved.\n— HydroNexis (Nexi)`);
  }
  return { ok: true, sms: results, email: mail, pending: pending.length };
}
