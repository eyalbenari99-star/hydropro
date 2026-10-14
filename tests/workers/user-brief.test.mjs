// v4.0 of workers/nexi-morning-brief.gs — each user's own morning brief by e-mail + WhatsApp (v23.30, Eyal 13 Oct 2026:
// "users still not getting WhatsApp morning brief also not emails brief after review there emails").
// Run: node tests/workers/user-brief.test.mjs — the .gs runs in node:vm with stubbed Apps Script services and a fake
// clock; the cloud (hnx-sync), Gmail, CallMeBot and Calendar are all stubs. Nothing leaves this machine.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const here = dirname(fileURLToPath(import.meta.url));
const CODE = readFileSync(join(here, '../../workers/nexi-morning-brief.gs'), 'utf8');
let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 900))); if (!ok) fails++; };
const J = x => JSON.parse(JSON.stringify(x));

/* ---------- a fresh Apps Script world with a fake clock (Manila = UTC+8) ---------- */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DAYSL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const p2 = n => String(n).padStart(2, '0');
function fmt(d, tz, f) {
  const x = new Date(d.getTime() + 8 * 3600e3);
  return f.replace(/yyyy|MMMM|MMM|MM|dd|d|EEEE|EEE|HH|mm|ss|u/g, t => ({
    yyyy: x.getUTCFullYear(), MMMM: MONL[x.getUTCMonth()], MMM: MON[x.getUTCMonth()], MM: p2(x.getUTCMonth() + 1), dd: p2(x.getUTCDate()), d: x.getUTCDate(),
    EEEE: DAYSL[x.getUTCDay()], EEE: DAYS[x.getUTCDay()], HH: p2(x.getUTCHours()), mm: p2(x.getUTCMinutes()), ss: p2(x.getUTCSeconds()), u: x.getUTCDay() || 7 }[t]));
}
const at = (day, hm) => Date.parse(day + 'T' + hm + ':00+08:00');

function world(o) {
  o = o || {};
  const clock = { now: o.now };
  /* the engine sends only in the account installUserBriefs confirmed — a world is "installed as nexi@" unless o.noOwner */
  const SP = Object.assign({ HNX_USER: 'nexi', HNX_PASS: 'pw' }, o.props || {}), UP = o.noOwner ? {} : { ub_owner: JSON.stringify('nexi@abapardes.com.ph') };
  Object.assign(UP, o.up || {});
  const drafts = [];
  const cloud = J(o.cloud || {});
  const mails = [], cmb = [], pulls = [], pushes = [], logins = [], triggers = [], searches = [];
  class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(clock.now); } static now() { return clock.now; } }
  const props = S => ({ getProperty: k => (k in S ? S[k] : null), setProperty: (k, v) => { S[k] = String(v); }, deleteProperty: k => { delete S[k]; },
    getProperties: () => Object.assign({}, S), getKeys: () => Object.keys(S) });
  const resp = (code, body) => ({ getResponseCode: () => code, getContentText: () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  const builder = fn => { const t = { fn }; const b = { timeBased: () => b, everyDays: n => (t.everyDays = n, b), atHour: h => (t.atHour = h, b), nearMinute: m => (t.nearMinute = m, b),
    inTimezone: z => (t.tz = z, b), everyMinutes: n => (t.everyMinutes = n, b), create: () => { triggers.push(t); return t; } }; return b; };
  const ctx = {
    PropertiesService: { getScriptProperties: () => props(SP), getUserProperties: () => props(UP) },
    UrlFetchApp: { fetch: (url, opt) => {
      if (String(url).length > 2000) throw new Error('Limit Exceeded: URLFetch URL Length');
      if (/\/auth\/login$/.test(url)) { logins.push(JSON.parse(opt.payload).username); return resp(200, { token: 'tok-' + logins.length }); }
      if (/\/sync\/pull/.test(url)) {
        const m = /[?&]keys=([^&]*)/.exec(url), data = {};
        pulls.push({ url, keys: m ? decodeURIComponent(m[1]).split(',') : null });
        if (m) decodeURIComponent(m[1]).split(',').forEach(k => { if (k in cloud) data[k] = J(cloud[k]); });
        else Object.keys(cloud).forEach(k => { data[k] = J(cloud[k]); });
        return resp(200, { data, count: Object.keys(data).length });
      }
      if (/\/sync\/push$/.test(url)) { const d = JSON.parse(opt.payload).data; pushes.push(d); Object.keys(d).forEach(k => { cloud[k] = JSON.parse(d[k]); }); return resp(200, { ok: true, written: Object.keys(d).length }); }
      if (/api\.callmebot\.com/.test(url)) {
        const q = new URL(url).searchParams; cmb.push({ url, bytes: Buffer.byteLength(url), phone: q.get('phone'), key: q.get('apikey'), text: q.get('text') });
        if (o.cmbCost) clock.now += o.cmbCost;
        const r = o.cmb ? o.cmb(cmb.length) : { code: 200, body: 'Message queued. You will receive it in a few seconds.' };
        if (r.throw) throw new Error(r.throw);
        return resp(r.code, r.body);
      }
      throw new Error('unexpected fetch ' + url);
    } },
    GmailApp: {
      sendEmail: (to, subject, body, opt) => {
        if (o.mailThrow && o.mailThrow(to)) throw new Error('Exception: Invalid email: ' + to);
        mails.push({ to, subject, body, html: (opt || {}).htmlBody || '', cc: (opt || {}).cc || '' });
        if (o.mailCost) clock.now += o.mailCost;
      },
      search: (q, s, n) => { searches.push(q); return (o.bounces || []).map(th => ({ getMessages: () => th.map(m => ({ getId: () => m.id, getPlainBody: () => m.body })) })); },
      createDraft: (to, subject, body) => { const d = { to, subject, deleted: false }; drafts.push(d);
        return { getMessage: () => ({ getFrom: () => o.from || 'Nexi <nexi@abapardes.com.ph>' }), deleteDraft: () => { d.deleted = true; } }; }
    },
    CalendarApp: { getCalendarById: id => (o.calendars && o.calendars[id]) || null, getCalendarsByName: () => [] },
    ScriptApp: { getProjectTriggers: () => triggers.map(t => ({ getHandlerFunction: () => t.fn })), newTrigger: builder, deleteTrigger: t => {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    Utilities: { formatDate: fmt, sleep: ms => { clock.now += ms; } },
    Logger: { log: () => {} }, console,
    Date: FakeDate, JSON, Math, Number, String, Object, Array, RegExp, isFinite, parseInt, encodeURIComponent, decodeURIComponent, Error
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  const W = { ctx, SP, UP, cloud, mails, cmb, pulls, pushes, logins, triggers, searches, clock, drafts,
    set: (day, hm) => { clock.now = at(day, hm); return W; },
    tick: (day, hm) => { if (day) W.set(day, hm); return ctx.nexiUserBriefTick(); },
    log: () => cloud.nexibrief_log_v1 || null,
    rec: (day, u) => { const v = UP['ub|' + day + '|' + u]; return v ? JSON.parse(v) : null; } };
  return W;
}

/* ---------- the fixture: Wed 14 Oct 2026 (Manila) ---------- */
const D = '2026-10-14', Y = '2026-10-13', T = '2026-10-15';
const USERS = () => [
  { username: 'eyal', fullname: 'Eyal Ben Ari', role: 'admin', active: true, email: 'eyal@abapardes.com.ph', passwordHash: 'h1' },
  { username: 'amy', fullname: 'Dr Amy Patdu', role: 'admin_secondary', active: true, email: 'dramypatdu@gmail.com', passwordHash: 'h2' },
  { username: 'cheriet', fullname: 'Chen Cheriet', role: 'supervisor', active: true, email: 'cheriet@abapardes.com.ph', passwordHash: 'h3' },
  { username: 'jinky', fullname: 'Jinky Pagtama', role: 'accounting', department: 'accounting', active: true, email: '', passwordHash: 'h4',
    assistant: { workEmail: 'jinkyp@abapardes.com.ph', mobile: '+639171234567', prefs: { briefTime: '06:30', channel: 'mail' },
                 authority: { autoTasks: true, sendMail: true, sendWhatsApp: true }, assigned: { greenhouses: [] } } },
  { username: 'ederlyn', fullname: 'Ederlyn Santos', role: 'supervisor', department: 'production', active: true, email: 'ederlyn@abapardes.com.ph', passwordHash: 'h5',
    assistant: { assigned: { greenhouses: ['GH4'] } } },
  { username: 'jean', fullname: 'Jean Operator', role: 'operator', department: 'logistics', active: true, email: 'jean@gmail.com', passwordHash: 'h6' },
  { username: 'joshane', fullname: 'Joshane Estrada', role: 'accounting', active: true, email: 'joshanee@abapardes.com.ph', passwordHash: 'h7',
    assistant: { authority: { sendMail: false } } },
  { username: 'syram', fullname: 'Syra Mae Montesa', role: 'operator', active: true, email: 'syram@abapardes.com.ph', passwordHash: 'h8' },
  { username: 'mea', fullname: 'Meajean Magracia', role: 'supervisor', active: false, email: 'mea@abapardes.com.ph', passwordHash: 'h9' },
  { username: 'admin', fullname: 'System Admin', role: 'admin', active: true, email: 'admin@abapardes.com.ph', passwordHash: 'h10' }];
const SCOPE = (ageH) => ({ v: 1, at: new Date(at(D, '07:00') - (ageH || 1) * 3600e3).toISOString(), by: 'eyal', app: '23.30', users: {
  jinky: { m: ['overview', 'tasks', 'assistant', 'accounting', 'hr', 'payroll'], pay: true },
  ederlyn: { m: ['overview', 'tasks', 'assistant', 'production'], pay: false },
  jean: { m: ['overview', 'tasks', 'assistant', 'logistics'], pay: false },
  joshane: { m: ['overview', 'tasks', 'assistant', 'accounting'], pay: false },
  syram: { m: ['overview', 'tasks', 'assistant', 'logistics'], pay: false } } });
const ms = (day, hm) => at(day, hm);
const CLOUD = (extra) => Object.assign({
  hydroPro_users: USERS(),
  hydroPro_pa_profiles_v1: { syram: { pausedAll: true } },
  nexibrief_scope_v1: SCOPE(1),
  hydroPro_tasks_v1: [
    { id: 'T1', title: 'Send BIR 2316', owner: 'jinky', status: 'todo', due: '2026-10-12', visibility: 'personal' },
    { id: 'T2', title: 'Close September AP', owner: 'jinky', status: 'doing', due: Y, visibility: 'personal' },
    { id: 'T3', title: 'Pay Meralco bill', owner: 'jinky', status: 'todo', due: D, visibility: 'personal' },
    { id: 'T4', title: 'Prepare holiday list', owner: 'jinky', status: 'todo', due: T, visibility: 'personal' },
    { id: 'T5', title: 'Old reconciliation', owner: 'jinky', status: 'done', due: '2026-10-01', visibility: 'personal' },
    { id: 'T6', title: '🚨 Accounting · Unpaid supplier — call them', owner: 'jinky', status: 'todo', due: D, visibility: 'team', links: [{ type: 'escalation', id: 'ESC_accounting_X1', label: '🚨 Escalation · Unpaid supplier' }] },
    { id: 'T7', title: 'Fix GH4 pump', owner: 'ederlyn', status: 'todo', due: D, visibility: 'personal' }],
  hydroPro_memos: [
    { id: 'M1', status: 'pending', createdBy: 'mea', chain: { v: 2294, round: 1, submittedBy: 'mea', acct: null, final: null } },
    { id: 'M2', status: 'pending', createdBy: 'mea', chain: { v: 2294, round: 1, submittedBy: 'mea', acct: { by: 'jinky', round: 1 }, final: null } },
    { id: 'M3', status: 'pending', createdBy: 'jinky', chain: { v: 2294, round: 1, submittedBy: 'jinky', acct: null, final: null } },
    { id: 'M4', status: 'pending', createdBy: 'ederlyn', chain: { v: 2294, round: 2, submittedBy: 'ederlyn', acct: { by: 'jinky', round: 1 }, final: null } },
    { id: 'M5', status: 'rejected', createdBy: 'mea', chain: { v: 2294, round: 1, acct: null } },
    { id: 'M6', status: 'pending', createdBy: 'mea' }],
  hydroPro_memo_approvers_v1: {},
  hydroPro_pa_inbox_v1: [
    { id: 'I1', user: 'jinky', at: ms(D, '06:00') - 3600e3, itemId: 'memo:M1', title: '① Memo waiting: Mea — late', read: false },
    { id: 'I2', user: 'jinky', at: ms(D, '06:00') - 20 * 3600e3, itemId: 'escalation:ESC_accounting_X1', title: '🚨 Assigned to you: Unpaid supplier', read: false },
    { id: 'I3', user: 'jinky', at: ms(D, '06:00') - 2 * 3600e3, itemId: 'memo:M9', title: 'Read notice', read: true },
    { id: 'I4', user: 'jinky', at: ms(D, '07:00') - 73 * 3600e3, itemId: 'memo:M8', title: 'Too old notice', read: false },
    { id: 'I5', user: 'jinky', at: ms(D, '06:00') - 3600e3, itemId: 'SUP_abc', title: 'Morning briefing', read: false },
    { id: 'I6', user: 'ederlyn', at: ms(D, '06:00') - 3600e3, itemId: 'roleos', title: 'Duty: GH walk', read: false }],
  hydroPro_calls: [
    { id: 'C1', subject: 'Supplier statement mismatch', dept: 'accounting', status: 'new_call', priority: 'urgent', assignedTo: 'jinky' },
    { id: 'C2', subject: 'Closed one', dept: 'accounting', status: 'closed', priority: 'urgent', assignedTo: 'jinky' }],
  hydroPro_meetings_v1: [
    { id: 'MTG1', title: 'Weekly accounting', date: D, start: '09:00', chair: 'jinky', createdBy: 'jinky', attendees: [], archived: false, minutes: { actions: [] } },
    { id: 'MTG2', title: 'Someone else\'s meeting', date: D, start: '08:00', chair: 'eyal', createdBy: 'eyal', attendees: [{ kind: 'user', id: 'ederlyn' }], archived: false, minutes: { actions: [] } }],
  hydroPro_cal_events_v2: [
    { id: 'E1', title: 'Holiday prep', module: 'general', date: D, time: '10:00' },
    { id: 'E2', title: 'GH9 harvest', module: 'production', date: D, time: '11:00' },
    { id: 'E3', title: 'Tomorrow thing', module: 'general', date: T, time: '10:00' }],
  hydroPro_dept_heads_v1: {},
  hydroPro_issues_v2: [],
  ['hydroPro_' + Y]: { GH4: { statuses: { a: 'danger', b: 'danger', c: 'warn', d: 'ok' } }, GH9: { statuses: { a: 'danger', b: 'danger', c: 'danger' } } }
}, extra || {});
const WAKEYS = { WA_JINKY: '639171234567|1234567' };
const usr = (W, name) => W.ctx.candidates_(W.ctx.ubPull_(W.ctx.UB_LIGHT_KEYS), W.ctx.manila_(new W.ctx.Date())).filter(u => u.username === name)[0];

/* 1 */
{ const W = world({ cloud: CLOUD(), props: WAKEYS }); W.tick(D, '07:31');
  const L = W.log(), d = (L && L.days[D]) || {}, s = (L && L.setup) || {};
  check('dry (USER_BRIEF unset) tick 07:31 → 0 e-mails, 0 CallMeBot calls, log days[2026-10-14]: jinky e=dry w=dry, ederlyn e=dry; setup jean=no-company-email, joshane=card-off, syram=paused, eyal/amy/cheriet=leader; mea/admin absent',
    W.mails.length === 0 && W.cmb.length === 0 && L && L.engine.mode === 'dry' && d.jinky.e.s === 'dry' && d.jinky.w.s === 'dry' && d.ederlyn.e.s === 'dry' && !d.ederlyn.w
    && s.jean.mail === 'no-company-email' && s.joshane.mail === 'card-off' && s.syram.mail === 'paused' && s.eyal.mail === 'leader' && s.amy.mail === 'leader' && s.cheriet.mail === 'leader'
    && !('mea' in s) && !('admin' in s) && s.jinky.waProp === 'WA_JINKY' && s.jinky.wa === 'ok' && s.ederlyn.wa === 'no-key',
    { mails: W.mails.length, cmb: W.cmb.length, d, s }); }

/* 2 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  W.tick(D, '06:40'); const a = { m: W.mails.map(m => m.to), w: W.cmb.length };
  W.tick(D, '06:55'); const b = { m: W.mails.length, w: W.cmb.length };
  W.tick(D, '07:01'); const c = { m: W.mails.map(m => m.to), w: W.cmb.length };
  check('on, tick 06:40 → 1 e-mail (jinkyp@abapardes.com.ph) + 1 WhatsApp (jinky); tick 06:55 → 0 (idempotent); tick 07:01 → 1 e-mail (ederlyn@); total 2 e-mails, 0 to gmail.com',
    JSON.stringify(a.m) === '["jinkyp@abapardes.com.ph"]' && a.w === 1 && W.cmb[0].phone === '639171234567' && b.m === 1 && b.w === 1
    && JSON.stringify(c.m) === '["jinkyp@abapardes.com.ph","ederlyn@abapardes.com.ph"]' && c.w === 1 && !W.mails.some(m => /gmail\.com/.test(m.to))
    && /^☀️ Your Nexi brief — Wed 14 Oct · 2 overdue$/.test(W.mails[0].subject) && W.rec(D, 'jinky').e.s === 'sent' && W.rec(D, 'jinky').w.s === 'sent',
    { a, b, c, subj: W.mails.map(m => m.subject), rec: W.rec(D, 'jinky') }); }

/* 3 */
{ const cl = CLOUD({ hydroPro_pa_profiles_v1: { syram: { pausedAll: true }, jinky: { briefTime: '05:30', quietFrom: '21:00', quietTo: '06:00' } } });
  const W = world({ cloud: cl, props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  W.tick(D, '05:46'); const a = W.mails.length + W.cmb.length;
  W.tick(D, '06:01'); const b = W.mails.filter(m => m.to === 'jinkyp@abapardes.com.ph').length;
  check('quiet hours 21:00–06:00, briefTime 05:30 → nothing at 05:46, sent at 06:01', a === 0 && b === 1 && W.log().setup.jinky.eff === '06:00', { a, b, setup: W.log().setup.jinky }); }

/* 4 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  W.tick('2026-10-18', '08:00'); const d = (W.log().days || {})['2026-10-18'] || {};
  check('Sunday 18 Oct → 0 sends, log \'not a work day\'', W.mails.length === 0 && W.cmb.length === 0 && d.jinky && d.jinky.skip === 'not a work day' && d.ederlyn.skip === 'not a work day',
    { mails: W.mails.length, d }); }

/* 5 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS), up: { ub_on_since: JSON.stringify(at(Y, '12:00')) } });
  W.tick(D, '11:05'); const d = W.log().days[D] || {}, staff = W.mails.filter(m => m.to !== 'eyal@abapardes.com.ph'), sum = W.mails.filter(m => m.to === 'eyal@abapardes.com.ph');
  check('USER_BRIEF on since yesterday, no tick ran this morning, first tick 11:05 with unsent eligible users → state missed, not sent (0 staff e-mails, 0 WhatsApp; the one ⚠ summary to eyal@ says 3 not delivered, plain text with no 4-byte emoji)',
    staff.length === 0 && W.cmb.length === 0 && d.jinky.e.s === 'missed' && d.jinky.w.s === 'missed' && d.ederlyn.e.s === 'missed' && !d.jean
    && sum.length === 1 && /3 not delivered/.test(sum[0].subject) && /missed/.test(sum[0].body) && !/[\uD800-\uDBFF]/.test(sum[0].body),
    { mails: W.mails.map(m => [m.to, m.subject]), d }); }

/* 6 */
{ const W = world({ cloud: CLOUD(), props: WAKEYS }); W.set(D, '06:40');
  const j = usr(W, 'jinky'), M = W.ctx.manila_(new W.ctx.Date());
  const B = W.ctx.buildUserBrief_(J(W.cloud), j, M, { events: [], note: '' });
  const wa = W.ctx.renderWa_(B);
  check('jinky brief: 2 overdue · 1 today · 1 tomorrow, 1 escalation, 2 memos for ① (her own memo excluded, the final-stage memo excluded), 2 unread notices (read / 73 h old / SUP excluded), 1 call (1 urgent), 2 events today (meeting 09:00 + general 10:00; the production-module event excluded)',
    B.tasks.overdue.length === 2 && B.tasks.today.length === 1 && B.tasks.tomorrow.length === 1 && B.esc.length === 1 && B.memos === 2 && B.notices.length === 2
    && B.calls.length === 1 && B.calls[0].urgent && B.events.length === 2 && B.events[0].time === '09:00' && B.events[1].title === 'Holiday prep' && B.prod === null
    && /📋 2 overdue · 1 today · 1 tomorrow/.test(wa) && /Send BIR 2316 \(late 2d\)/.test(wa) && /🚨 1 escalation due today/.test(wa) && /✅ 2 memos for your ① check · 2 notices/.test(wa)
    && /📞 1 call \(1 urgent\)/.test(wa) && /📅 09:00 Weekly accounting · 10:00 Holiday prep/.test(wa) && /Full brief in your e-mail$/.test(wa),
    { B: { o: B.tasks.overdue.length, t: B.tasks.today.length, tm: B.tasks.tomorrow.length, esc: B.esc.length, memos: B.memos, n: B.notices.map(x => x.title), calls: B.calls, ev: B.events }, wa }); }

/* 7 */
{ const W = world({ cloud: CLOUD(), props: WAKEYS }); W.set(D, '07:05');
  const M = W.ctx.manila_(new W.ctx.Date()), data = J(W.cloud);
  const Be = W.ctx.buildUserBrief_(data, usr(W, 'ederlyn'), M, { events: [], note: '' }), Bj = W.ctx.buildUserBrief_(data, usr(W, 'jinky'), M, { events: [], note: '' });
  const html = W.ctx.renderHtml_(Be);
  check('ederlyn production: GH4 2 critical · 1 warning shown, GH9 3 critical NOT shown; jinky (no production scope) gets no 🌱 section',
    Be.prod && Be.prod.rows.length === 1 && Be.prod.rows[0].gh === 'GH4' && Be.prod.rows[0].crit === 2 && Be.prod.rows[0].warn === 1 && /<b>GH4<\/b>/.test(html) && !/<b>GH9<\/b>/.test(html)
    && Bj.prod === null && !/🌱/.test(W.ctx.renderWa_(Bj)) && /🌱 yesterday: 2 critical · 1 warning/.test(W.ctx.renderWa_(Be)),
    { prod: Be.prod, jprod: Bj.prod }); }

/* 8 */
{ const W = world({ cloud: CLOUD({ nexibrief_scope_v1: SCOPE(4 * 24) }), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  W.tick(D, '07:05'); const m = W.mails.filter(x => x.to === 'ederlyn@abapardes.com.ph')[0] || {};
  const B = W.ctx.buildUserBrief_(J(W.cloud), usr(W, 'ederlyn'), W.ctx.manila_(new W.ctx.Date()), { events: [], note: '' });
  check('scope snapshot 4 days old → no 🌱 section and no module events for ederlyn, footer "permissions snapshot is 4 days old"',
    B.prod === null && !B.events.some(e => e.src === 'production') && /permissions snapshot is 4 days old/.test(m.body || '') && /permissions snapshot is 4 days old/.test(m.html || '') && !/Production/.test(m.body || ''),
    { prod: B.prod, body: (m.body || '').slice(-400) }); }

/* 9 */
{ const cl = CLOUD(); cl.hydroPro_pa_inbox_v1.push({ id: 'I7', user: 'jinky', at: ms(D, '05:00'), itemId: 'memo:M2', title: 'Memo approved ₱1,250.00 deduction', read: false },
    { id: 'I8', user: 'ederlyn', at: ms(D, '05:00'), itemId: 'memo:M2', title: 'Memo approved ₱1,250.00 deduction', read: false });
  const W = world({ cloud: cl, props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  W.tick(D, '07:05');
  const mj = W.mails.filter(x => x.to === 'jinkyp@abapardes.com.ph')[0] || {}, me = W.mails.filter(x => x.to === 'ederlyn@abapardes.com.ph')[0] || {}, wj = (W.cmb[0] || {}).text || '';
  check('money: notice "Memo approved ₱1,250.00 deduction" → in jinky\'s e-mail (pay:true), absent from her WhatsApp text (no ₱, no 1,250, no memo title: "2 memo / pay notices — details in Nexi"), dropped from a pay:false user\'s e-mail',
    /Memo approved/.test(mj.html) && /1,250/.test(mj.body) && wj && !/₱/.test(wj) && !/1,250/.test(wj) && !/Memo approved|Memo waiting/.test(wj) && /2 memo \/ pay notices — details in Nexi/.test(wj)
    && !/1,250|₱/.test(me.html) && !/1,250|₱/.test(me.body) && /with amounts — open Nexi/.test(me.body),
    { wj, me: me.body }); }

/* 10 */
{ let mode = 'queued';
  const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS),
    cmb: () => mode === 'queued' ? { code: 200, body: 'Message queued. You will receive it in a few seconds.' } : mode === 'invalid' ? { code: 200, body: '<p>APIKey is invalid. 639171234567 / 1234567</p>' } : { code: 500, body: 'oops' } });
  W.tick(D, '06:40'); const r1 = W.rec(D, 'jinky').w;
  const c2 = W.ctx.callMeBot_('639171234567', '1234567', 'hello'); mode = 'invalid'; const c3 = W.ctx.callMeBot_('639171234567', '1234567', 'hello');
  /* a fresh world: HTTP 500 */
  mode = 'e500'; const W2 = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS), cmb: () => ({ code: 500, body: 'oops' }) });
  W2.tick(D, '06:40'); const f1 = W2.rec(D, 'jinky').w, m1 = W2.mails.length;
  W2.tick(D, '06:55'); const f2 = W2.rec(D, 'jinky').w, m2 = W2.mails.length;
  W2.tick(D, '07:10'); const f3 = W2.rec(D, 'jinky').w, calls = W2.cmb.length;
  check('CallMeBot \'Message queued\' → w=sent parts=1; 200 \'APIKey is invalid\' → unconfirmed; HTTP 500 → failed n=1, retried next tick → failed n=2, never a 3rd try; e-mail not re-sent',
    r1.s === 'sent' && r1.parts === 1 && c2.s === 'sent' && c3.s === 'unconfirmed' && !/1234567|639171234567|apikey/i.test(c3.why)
    && f1.s === 'failed' && f1.n === 1 && f2.s === 'failed' && f2.n === 2 && f3.n === 2 && calls === 2 && m1 === 1 && m2 === 1 && W2.mails.filter(m => m.to === 'jinkyp@abapardes.com.ph').length === 1,
    { r1, c2, c3, f1, f2, f3, calls, m1, m2 }); }

/* 11 */
{ const W = world({ now: at(D, '07:00') });
  const lines = []; for (let i = 0; i < 80; i++) lines.push('🌱 GH' + (i % 12 + 1) + ' — line ' + i + ' with ✅ checks and a long tail of words ' + 'x'.repeat(i % 7));
  const text = lines.join('\n').slice(0, 4000), oneLong = '📅'.repeat(400) + 'é'.repeat(300);
  const parts = W.ctx.waParts_('639171234567', '1234567', text), urls = parts.map(p => W.ctx.waUrl_('639171234567', '1234567', p));
  const ch = W.ctx.waChunks_(text, 1900 - W.ctx.waUrl_('639171234567', '1234567', '').length - 12), back = ch.map(c => c.t + (c.nl ? '\n' : '')).join('');
  const ch2 = W.ctx.waChunks_(oneLong, 900), back2 = ch2.map(c => c.t + (c.nl ? '\n' : '')).join('');
  let decOk = true; for (const u of urls) { try { decodeURIComponent(new URL(u).searchParams.get('text')); } catch (e) { decOk = false; } }
  const okSur = ch2.every(c => !/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(c.t));
  check('split: a 4,000-character text → N parts, each URL ≤ 1,900 bytes, parts joined === input, no broken %XX or surrogate',
    text.length === 4000 && parts.length >= 3 && urls.every(u => Buffer.byteLength(u) <= 1900) && back === text && back2 === oneLong && ch2.length > 1 && decOk && okSur
    && parts.slice(1).every((p, i) => p.indexOf('(' + (i + 2) + '/' + parts.length + ') ') === 0),
    { n: parts.length, bytes: urls.map(u => Buffer.byteLength(u)), back: back === text, back2: back2 === oneLong, decOk, okSur }); }

/* 12 */
{ const req = (u, by, id, hm) => ({ id, user: u, by, at: new Date(at(D, hm)).toISOString() });
  const cl = CLOUD({ nexibrief_req_ederlyn: req('ederlyn', 'ederlyn', 'BRQ_1', '07:30') });
  const W = world({ cloud: cl, props: WAKEYS });
  W.tick(D, '06:10'); const t1 = W.mails.filter(m => /^TEST · /.test(m.subject)).map(m => m.to);
  W.tick(D, '06:15'); const t2 = W.mails.length;
  W.cloud.nexibrief_req_ederlyn = req('ederlyn', 'ederlyn', 'BRQ_2', '06:20'); W.tick(D, '06:20'); const r3 = J(W.log().tests.ederlyn);
  W.cloud.nexibrief_req_ederlyn = req('ederlyn', 'jinky', 'BRQ_3', '06:41'); W.tick(D, '06:55'); const r4 = J(W.log().tests.ederlyn);
  const sent = []; ['07:15', '07:50', '08:25'].forEach((hm, i) => { W.cloud.nexibrief_req_ederlyn = req('ederlyn', 'ederlyn', 'BRQ_V' + i, hm); W.tick(D, hm); sent.push(W.log().tests.ederlyn.s); });
  W.cloud.nexibrief_req_ederlyn = req('ederlyn', 'ederlyn', 'BRQ_5', '09:00'); W.tick(D, '09:00'); const r5 = J(W.log().tests.ederlyn);
  W.cloud.nexibrief_req_jean = req('jean', 'jean', 'BRQ_J', '09:10'); W.tick(D, '09:15'); const rj = J(W.log().tests.jean);
  const tests = W.mails.filter(m => /^TEST · /.test(m.subject));
  check('test request nexibrief_req_ederlyn {by:\'ederlyn\'} in dry mode → 1 TEST e-mail to ederlyn@ within the tick; same id again → 0; new id 10 min later → refused "wait 30 minutes between tests"; {by:\'jinky\'} on ederlyn\'s key → refused "own user only"; 5th valid request in a day → refused "4 tests today already"; request on jean\'s key (no company e-mail, no WA) → refused "not set up: no-company-email"',
    JSON.stringify(t1) === '["ederlyn@abapardes.com.ph"]' && t2 === 1 && r3.s === 'refused' && r3.why === 'wait 30 minutes between tests' && r4.why === 'own user only'
    && JSON.stringify(sent) === '["done","done","done"]' && r5.s === 'refused' && r5.why === '4 tests today already' && rj.why === 'not set up: no-company-email'
    && tests.length === 4 && tests.every(m => m.to === 'ederlyn@abapardes.com.ph') && W.cmb.length === 0 && !W.mails.some(m => !/^TEST/.test(m.subject))
    && !Object.keys(W.pushes.reduce((a, p) => Object.assign(a, p), {})).some(k => /^nexibrief_req_/.test(k)),
    { t1, t2, r3, r4, sent, r5, rj, n: tests.length }); }

/* 13 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS), mailThrow: to => to === 'ederlyn@abapardes.com.ph' });
  W.tick(D, '07:31'); const a = W.mails.map(m => m.to);
  W.tick(D, '07:46'); const sums1 = W.mails.filter(m => /^⚠ Nexi user briefs — /.test(m.subject));
  W.tick(D, '08:01'); const sums2 = W.mails.filter(m => /^⚠ Nexi user briefs — /.test(m.subject));
  const s = sums1[0] || {};
  check('failure isolation: GmailApp throws for ederlyn → jinky still sent; summary mail to eyal@abapardes.com.ph lists ederlyn once; a second tick sends no 2nd summary',
    a.indexOf('jinkyp@abapardes.com.ph') >= 0 && W.rec(D, 'ederlyn').e.s === 'failed' && W.rec(D, 'ederlyn').e.n === 2 && sums1.length === 1 && s.to === 'eyal@abapardes.com.ph'
    && (s.body.match(/Ederlyn Santos/g) || []).length === 1 && /1 not delivered/.test(s.subject) && sums2.length === 1 && !/ederlyn@/.test(W.rec(D, 'ederlyn').e.why),
    { a, sums: sums2.map(m => [m.to, m.subject, m.body.slice(0, 300)]), rec: W.rec(D, 'ederlyn') }); }

/* 14 */
{ const many = []; for (let i = 1; i <= 20; i++) many.push({ username: 'staff' + i, fullname: 'Staff ' + i, active: true, email: 'staff' + i + '@abapardes.com.ph' });
  const W = world({ cloud: CLOUD({ hydroPro_users: many, nexibrief_scope_v1: null }), props: { USER_BRIEF: 'on' }, mailCost: 15000 });
  W.tick(D, '07:31'); const n1 = W.mails.length;
  W.tick(D, '07:46'); const n2 = W.mails.length - n1;
  const to = W.mails.map(m => m.to);
  check('time budget: 20 users, each send advancing the clock 15 s → tick 1 sends 18, tick 2 sends 2, nobody twice',
    n1 === 18 && n2 === 2 && new Set(to).size === 20, { n1, n2, uniq: new Set(to).size }); }

/* 15 */
{ const many = []; for (let i = 1; i <= 70; i++) many.push({ username: 'staffmember' + String(i).padStart(2, '0'), fullname: 'S ' + i, active: true, email: 's' + i + '@abapardes.com.ph' });
  const W = world({ cloud: CLOUD({ hydroPro_users: many }), props: {} });
  W.tick(D, '06:00');
  const reqPulls = W.pulls.filter(p => p.keys && p.keys.every(k => /^nexibrief_req_/.test(k)));
  const keys = [].concat(...reqPulls.map(p => p.keys)), bad = W.ctx.UB_DATA_KEYS.concat(W.ctx.UB_LIGHT_KEYS).filter(k => /payroll|loyalty|invoice|attendance|employees|salar/i.test(k));
  check('pull: 70 users → req keys fetched in 2 GETs each ≤ 1,900 chars; DATA_KEYS never match /payroll|loyalty|invoice|attendance|employees|salar/',
    reqPulls.length === 2 && reqPulls.every(p => p.url.length <= 1900) && keys.length === 70 && new Set(keys).size === 70 && bad.length === 0 && W.pulls.every(p => p.keys),
    { n: reqPulls.length, lens: reqPulls.map(p => p.url.length), keys: keys.length, bad }); }

/* 16 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  W.tick(D, '06:40'); const p1 = W.pushes.length, keys = W.pushes.map(p => Object.keys(p).join(','));
  const raw = W.pushes[0] ? W.pushes[0].nexibrief_log_v1 : '';
  W.tick(D, '06:45'); const p2c = W.pushes.length;
  W.tick(D, '07:00'); const p3c = W.pushes.length;
  check('log push: one /sync/push with only nexibrief_log_v1; its JSON has no \'apikey\', no /63\\d{9}/, no task titles, no e-mail addresses; an unchanged log is not pushed again 5 min later (06:45), but is re-sent as a heartbeat at the next 15-min tick (07:00, LOG_BEAT_MIN_DAY 10)',
    p1 === 1 && keys[0] === 'nexibrief_log_v1' && raw && !/apikey/i.test(raw) && !/63\d{9}/.test(raw) && !/Send BIR|Close September|Weekly accounting/.test(raw) && !/@/.test(raw) && !/1234567/.test(raw) && p2c === 1 && p3c === 2,
    { p1, keys, p2c, p3c, raw: String(raw).slice(0, 500) }); }

/* 17 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS),
    bounces: [[{ id: 'B1', body: 'Address not found\n\nYour message wasn\'t delivered to ederlyn@abapardes.com.ph because the address couldn\'t be found.' }]] });
  W.tick(D, '07:05'); const r1 = W.rec(D, 'ederlyn').e.s;
  W.tick(D, '07:20'); const r = W.rec(D, 'ederlyn').e, L = W.log().days[D].ederlyn.e;
  check('bounce: a mailer-daemon mail "Address not found … ederlyn@abapardes.com.ph" → ederlyn e=bounced',
    (r1 === 'bounced' || r1 === 'sent') && r.s === 'bounced' && r.why === 'Address not found' && L.s === 'bounced' && W.rec(D, 'jinky').e.s === 'sent' && W.searches.length >= 1,
    { r1, r, L }); }

/* 18 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) }); W.set(D, '06:05');
  W.ctx.sendRound_('morning');
  const m = W.mails.map(x => [x.to, x.cc, x.subject]);
  const trg = W.triggers.map(t => t.fn + ':' + (t.atHour != null ? t.atHour + ':' + t.nearMinute + ':' + t.tz : 'every' + t.everyMinutes));
  const W2 = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  ['06:05', '06:20', '06:35', '06:50', '07:05', '07:20', '07:35', '09:00', '10:30'].forEach(hm => W2.tick(D, hm));
  check('legacy unchanged: sendRound_(\'morning\') → 3 e-mails to eyalbenari99@gmail.com (cc eyal@abapardes.com.ph), dramypatdu@gmail.com, cheriet@abapardes.com.ph, same subjects as v3.7; the tick never e-mails these three; ensureTrigger_ keeps nexiMorningBrief 06:00 + nexiAttendanceReport 07:15 and adds nexiUserBriefTick every 15 min',
    m.length === 3 && m[0][0] === 'eyalbenari99@gmail.com' && m[0][1] === 'eyal@abapardes.com.ph' && m[1][0] === 'dramypatdu@gmail.com' && m[2][0] === 'cheriet@abapardes.com.ph'
    && m.every(x => x[2] === '☀️ Nexi Morning Brief — Wed 14 Oct 2026')
    && JSON.stringify(trg) === JSON.stringify(['nexiMorningBrief:6:0:Asia/Manila', 'nexiAttendanceReport:7:15:Asia/Manila', 'nexiUserBriefTick:every15'])
    && !W2.mails.some(x => /eyal|dramypatdu|cheriet/.test(x.to)) && W2.mails.length === 2 && W.rec(D, 'eyal').k === 'leader' && W.rec(D, 'eyal').e.s === 'sent',
    { m, trg, w2: W2.mails.map(x => x.to), eyal: W.rec(D, 'eyal') }); }

/* 19 */
{ const base = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent('639171234567') + '&apikey=' + encodeURIComponent('1234567') + '&text=';
  const ev = n => Array.from({ length: n }, (_, i) => '  • ' + String(8 + i).padStart(2, '0') + ':00 Meeting with supplier about GH' + (i + 1) + ' pool cleaning');
  const morning = ['☀ Nexi Brief · Tue 14 Oct', '⚠ I can only see 5 of 8 calendars — your day may look emptier than it is.',
    '  not shared with nexi (or shared as free/busy only): eyalbenari99@gmail.com, fcbr0bbhpo6uv4c75csesba3vc@group.calendar.google.com, 3ggu0pqlmrod4brbhqujt3lhk8@group.calendar.google.com',
    '📅 today Tue 14:', ...ev(8), '  … +3 more', '📅 tomorrow Wed 15:', ...ev(6), '🌱 yesterday: 2 critical, 14 warnings',
    '📞 23 open calls · 3 CRITICAL', '  • Pump GH4 not starting after power interruption this morni', '  • Leak in main irrigation line near GH9 valve box', '  • Cold room temperature alarm 9.1 C', '🛒 4 requests waiting for approval', 'Full brief in your e-mail 📧'].join('\n');
  const W = world({ cloud: CLOUD(), props: { WA_EYAL: '639171234567|1234567' } }); W.set(D, '06:05');
  const r = W.ctx.callMeBot_('639171234567', '1234567', morning);
  const n1 = W.cmb.length, bytes = W.cmb.map(c => c.bytes);
  W.ctx.callMeBot_('639171234567', '1234567', 'Brief\n💰 Deposit ₱5,000 due today\nok');
  const last = W.cmb[W.cmb.length - 1].text;
  /* the real legacy path: sendWhatsApp_ for Eyal records the result for Nexi */
  W.ctx.sendWhatsApp_(W.ctx.RECIPIENTS[0], J(W.cloud), 'morning'); const rec = W.rec(D, 'eyal');
  check('legacy WhatsApp: a 1,401-character busy-morning text → 2 parts each ≤ 1,900 bytes (was one 2,295-byte URL that threw); a line with ₱ is dropped',
    morning.length === 1401 && Buffer.byteLength(base + encodeURIComponent(morning)) === 2295 && r.s === 'sent' && r.parts === 2 && n1 === 2 && bytes.every(b => b <= 1900)
    && !/₱|5,000/.test(last) && /with amounts — open Nexi/.test(last) && rec && rec.k === 'leader' && rec.w.s === 'sent',
    { r, n1, bytes, last, rec }); }

/* 20 */
check('no MailApp: the .gs source does not contain "MailApp" (no new OAuth scope)', !/MailApp/.test(CODE) && !/Session\.get/.test(CODE) && !/DriveApp|SpreadsheetApp|DocumentApp/.test(CODE), null);

/* ---------- review fixes (v23.30 review: privacy + delivery) ---------- */

/* 21 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  const money = ['Cash advance P5000', 'OT pay Php500', 'Late deduction 727.27', 'Deduction 500php', 'Allowance 1500', 'Rice subsidy P 2000', 'Bonus PHP1500', '13th month 25000',
    'Pay Meralco P12,450 today', 'PHP12,450 to Globe', 'Php5,000 cash advance Lito', 'Deposit 15000 to BDO', 'Nets budget 25k', 'Refund P 850.00 to Mang Ben', 'Collect P8,500 from Hyatt'];
  const keep = ['Send BIR 2316', 'Pool P1 top-up', 'GH10 pump', 'PRJ15 MX1012 shipment', 'Order 3 bags', 'Pay Meralco bill', 'Check P10 EC'];
  W.cloud.hydroPro_tasks_v1 = money.concat(keep).map((t, i) => ({ id: 'X' + i, title: t, owner: 'jinky', status: 'todo', due: D }));
  W.cloud.hydroPro_cal_events_v2 = [{ id: 'EV1', title: 'Collect P8,500 from Hyatt', module: 'general', date: D, time: '10:00' }, { id: 'EV2', title: 'Team huddle', module: 'general', date: D, time: '09:30' }];
  W.tick(D, '06:40');
  const wa = W.cmb.map(c => c.text).join('\n'), leaked = money.filter(t => wa.indexOf(t) >= 0 || W.ctx.isMoneyWa_(t) === false);
  const kept = keep.filter(t => !W.ctx.isMoneyWa_(t)), B = W.ctx.buildUserBrief_(J(W.cloud), usr(W, 'jinky'), W.ctx.manila_(new W.ctx.Date()), { events: [], note: '' });
  const waAll = W.ctx.renderWa_(Object.assign(B, { tasks: Object.assign(B.tasks, { overdue: [], today: keep.map(t => ({ title: t, due: D })) }) }));
  check('money on WhatsApp: 15 spellings (P5000 · Php500 · 727.27 · 500php · Allowance 1500 · P 2000 · PHP1500 · 13th month 25000 · P12,450 · PHP12,450 · Php5,000 · 15000 · 25k · P 850.00 · P8,500) → 0 in the CallMeBot text, "+16 items with amounts" (15 tasks + 1 event); 7 plain titles (BIR 2316, Pool P1, GH10, PRJ15 MX1012, Order 3 bags, Pay Meralco bill, P10 EC) kept',
    W.cmb.length >= 1 && leaked.length === 0 && !/P5000|Php500|727\.27|500php|1500|P 2000|25000|12,450|5,000|15000|25k|850\.00|8,500/.test(wa) && /\(\+16 items with amounts — open Nexi\)/.test(wa)
    && kept.length === 7 && /Team huddle/.test(wa),
    { leaked, kept, wa: wa.slice(0, 600), waAll: waAll.slice(0, 300) }); }

/* 22 */
{ const us = USERS().concat([{ username: 'rex', fullname: 'Rex Dizon', role: 'operator', active: true, email: '', assistant: { authority: { sendWhatsApp: true } } },
    { username: 'lou', fullname: 'Lou Cruz', role: 'operator', active: true, email: '' }]);
  const sc = SCOPE(1); sc.users.rex = { m: ['overview', 'tasks', 'assistant'], pay: false, mail: 'amyp@abapardes.com.ph', mailFrom: 'hr' };
  sc.users.lou = { m: ['overview', 'tasks', 'assistant'], pay: false, mail: 'syram@abapardes.com.ph', mailFrom: 'hr' };
  const calRead = [];
  const cal = id => ({ getEvents: () => { calRead.push(id); return [{ isAllDayEvent: () => false, getStartTime: () => new Date(at(D, '15:00')), getTitle: () => 'Board: sale of GH9 to Newport' }]; } });
  const W = world({ cloud: CLOUD({ hydroPro_users: us, nexibrief_scope_v1: sc }), props: Object.assign({ USER_BRIEF: 'on', WA_REX: '639170000009|999' }, WAKEYS),
    calendars: { 'amyp@abapardes.com.ph': cal('amyp@abapardes.com.ph'), 'jinkyp@abapardes.com.ph': cal('jinkyp@abapardes.com.ph') } });
  W.tick(D, '07:05'); const s = W.log().setup;
  const rexWa = (W.cmb.filter(c => c.phone === '639170000009')[0] || {}).text || '', jinkyWa = (W.cmb.filter(c => c.phone === '639171234567')[0] || {}).text || '';
  const jinkyMail = W.mails.filter(m => m.to === 'jinkyp@abapardes.com.ph')[0] || {};
  check('calendar privacy: rex\'s HR e-mail amyp@ (a leadership calendar) and lou\'s HR e-mail syram@ (another user\'s) are NOT used → setup mail "shared-email", 0 e-mails to amyp@ / to syram@ for lou, amyp@ calendar never read; jinky\'s own Google Calendar title "Board: sale of GH9 to Newport" is in her e-mail but NOT on her WhatsApp ("+1 in your Google Calendar (e-mail)")',
    s.rex.mail === 'shared-email' && s.lou.mail === 'shared-email' && !W.mails.some(m => m.to === 'amyp@abapardes.com.ph') && W.mails.filter(m => m.to === 'syram@abapardes.com.ph').length === 0
    && calRead.indexOf('amyp@abapardes.com.ph') < 0 && !/Board/.test(rexWa) && rexWa.length > 0 && /Board: sale of GH9/.test(jinkyMail.html || '') && !/Board/.test(jinkyWa)
    && /\+1 in your Google Calendar \(e-mail\)/.test(jinkyWa),
    { rex: s.rex, lou: s.lou, calRead, rexWa, jinkyWa, mails: W.mails.map(m => m.to) }); }

/* 23 */
{ const us = USERS().concat([{ username: 'iris', fullname: 'Iris Ben Ari', role: 'operator', active: true, email: 'iris@abapardes.com.ph', assistant: { authority: { sendWhatsApp: true } } },
    { username: 'amy.s', fullname: 'Amy Santos', role: 'operator', active: true, email: 'amys@abapardes.com.ph', assistant: { authority: { sendWhatsApp: true } } }]);
  const req = (u, id) => JSON.stringify({ id, user: u, by: u, at: new Date(at(D, '08:55')).toISOString() });
  const W = world({ cloud: CLOUD({ hydroPro_users: us, nexibrief_req_iris: req('iris', 'BRQ_I'), 'nexibrief_req_amy.s': req('amy.s', 'BRQ_A') }),
    props: Object.assign({ USER_BRIEF: 'on', WA_EYAL: '639170000001|111', WA_AMY: '639170000002|222' }, WAKEYS) });
  W.tick(D, '09:00'); const s = W.log().setup;
  const toLeaders = W.cmb.filter(c => c.phone === '639170000001' || c.phone === '639170000002');
  check('leaders by username only: Iris Ben Ari / Amy Santos → not leader (mail ok, wa no-key), waProp WA_IRIS / WA_AMY_S, 0 CallMeBot calls to WA_EYAL / WA_AMY phones; their tests go to their own e-mail; eyal / amy / cheriet stay leader with WA_EYAL / WA_AMY / WA_CHEN',
    s.iris.mail === 'ok' && s.iris.wa === 'no-key' && s.iris.waProp === 'WA_IRIS' && s['amy.s'].mail === 'ok' && s['amy.s'].waProp === 'WA_AMY_S' && toLeaders.length === 0
    && W.mails.some(m => m.to === 'iris@abapardes.com.ph' && /^TEST · /.test(m.subject)) && W.mails.some(m => m.to === 'amys@abapardes.com.ph' && /^TEST · /.test(m.subject))
    && s.eyal.mail === 'leader' && s.eyal.waProp === 'WA_EYAL' && s.amy.waProp === 'WA_AMY' && s.cheriet.mail === 'leader' && s.cheriet.waProp === 'WA_CHEN',
    { iris: s.iris, amys: s['amy.s'], toLeaders: toLeaders.map(c => c.phone), mails: W.mails.map(m => [m.to, m.subject]) }); }

/* 24 */
{ const sc = SCOPE(1); sc.users.ederlyn = { m: ['overview', 'tasks', 'assistant', 'production', 'payroll', 'hr'], pay: true };
  const cl = CLOUD({ nexibrief_scope_v1: sc }); cl.hydroPro_pa_inbox_v1.push({ id: 'I9', user: 'ederlyn', at: ms(D, '05:00'), itemId: 'x:1', title: 'Deduction ₱1,250.00 for late', read: false });
  cl.hydroPro_cal_events_v2.push({ id: 'E9', title: 'Payroll cut-off review', module: 'payroll', date: D, time: '15:00' });
  const W = world({ cloud: cl, props: { USER_BRIEF: 'on' } }); W.tick(D, '07:05');
  const m = W.mails.filter(x => x.to === 'ederlyn@abapardes.com.ph')[0] || {};
  const sc2 = SCOPE(1); sc2.by = 'ederlyn';
  const W2 = world({ cloud: CLOUD({ nexibrief_scope_v1: sc2 }), props: { USER_BRIEF: 'on' } }); W2.tick(D, '07:05');
  const m2 = W2.mails.filter(x => x.to === 'ederlyn@abapardes.com.ph')[0] || {};
  check('forged snapshot: pay:true for ederlyn (not on the app\'s pay list) → 0 money lines in her e-mail (the ₱1,250.00 notice and the "Payroll cut-off" event → "+2 items with amounts"); a snapshot whose "by" is not an active administrator (ederlyn) is ignored → no 🌱 section, footer "not published by an administrator"',
    !/1,250|₱|Payroll cut-off/.test(m.body) && !/1,250|₱|Payroll cut-off/.test(m.html) && /\+2 items with amounts/.test(m.body) && !/PRODUCTION/.test(m2.body || '') && /not published by an administrator/.test(m2.body || ''),
    { body: (m.body || '').slice(0, 500), b2: (m2.body || '').slice(-300) }); }

/* 25 */
{ const many = []; for (let i = 1; i <= 16; i++) many.push({ username: 'tst' + i, fullname: 'Tester ' + i, active: true, email: 'tst' + i + '@abapardes.com.ph' });
  const cl = CLOUD({ hydroPro_users: many, nexibrief_scope_v1: null });
  many.forEach(u => { cl['nexibrief_req_' + u.username] = JSON.stringify({ id: 'BRQ_' + u.username, user: u.username, by: u.username, at: new Date(at(D, '09:00')).toISOString() }); });
  const W = world({ cloud: cl, props: {} }); W.tick(D, '09:05');
  const tests = W.mails.filter(m => /^TEST · /.test(m.subject)), refused = Object.keys(W.log().tests).filter(k => W.log().tests[k].s === 'refused');
  const W2 = world({ cloud: cl, props: { USER_BRIEF_MAX_TESTS: '3' } }); W2.tick(D, '09:05');
  check('global test cap: 16 forged test requests (16 users, 1 each) in a day → 15 TEST e-mails sent, 1 refused "daily test limit (15 for everyone)"; Script property USER_BRIEF_MAX_TESTS = 3 → 3 sent',
    tests.length === 15 && refused.length === 1 && /daily test limit \(15 for everyone\)/.test(W.log().tests[refused[0]].why) && W2.mails.filter(m => /^TEST · /.test(m.subject)).length === 3,
    { tests: tests.length, refused, why: refused[0] && W.log().tests[refused[0]].why }); }

/* 26 */
{ const us = USERS().concat([{ username: 'mark.d', fullname: 'Mark Dela', active: true, email: 'markd@abapardes.com.ph', assistant: { authority: { sendWhatsApp: true } } },
    { username: 'mark_d', fullname: 'Mark Dino', active: true, email: 'markdino@abapardes.com.ph', assistant: { authority: { sendWhatsApp: true } } }]);
  const W = world({ cloud: CLOUD({ hydroPro_users: us }), props: Object.assign({ USER_BRIEF: 'on', WA_MARK_D: '639170000005|555' }, WAKEYS) });
  W.tick(D, '07:05'); const s = W.log().setup;
  check('key-name clash: mark.d + mark_d (both → WA_MARK_D) → wa "key-name-clash" for both, 0 CallMeBot calls to that phone, both still e-mailed',
    s['mark.d'].wa === 'key-name-clash' && s.mark_d.wa === 'key-name-clash' && W.cmb.filter(c => c.phone === '639170000005').length === 0
    && W.mails.some(m => m.to === 'markd@abapardes.com.ph') && W.mails.some(m => m.to === 'markdino@abapardes.com.ph'),
    { a: s['mark.d'], b: s.mark_d, cmb: W.cmb.map(c => c.phone) }); }

/* 27 */
{ const W = world({ cloud: CLOUD(), props: WAKEYS });
  W.tick(D, '13:00'); const dry = J(W.log().days[D] || {});
  W.SP.USER_BRIEF = 'on'; W.tick(D, '13:15'); const d1 = J(W.log().days[D] || {});
  const sum1 = W.mails.filter(m => /^⚠ Nexi user briefs — /.test(m.subject)).length;
  const W2 = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS), up: { ub_on_since: JSON.stringify(at(Y, '12:00')) } });
  ['06:40', '06:55', '07:10', '07:25'].forEach(hm => W2.tick(D, hm));
  W2.SP.WA_EDERLYN = '639170000007|777'; W2.cloud.hydroPro_users = W2.cloud.hydroPro_users.map(u => u.username === 'ederlyn' ? Object.assign({}, u, { assistant: Object.assign({}, u.assistant, { authority: { sendWhatsApp: true } }) }) : u);
  W2.tick(D, '14:00'); const e = W2.rec(D, 'ederlyn');
  const sum2 = W2.mails.filter(m => /^⚠ Nexi user briefs — /.test(m.subject)).length;
  check('no false "missed": dry tick at 13:00 then USER_BRIEF=on at 13:15 → 0 missed, 0 ⚠ summary; a healthy morning + ederlyn\'s WhatsApp key added at 14:00 → her w stays empty (first WhatsApp tomorrow), 0 ⚠ summary',
    !(dry.jinky && dry.jinky.e && dry.jinky.e.s === 'missed') && !(d1.jinky && d1.jinky.e && d1.jinky.e.s === 'missed') && sum1 === 0 && e.e.s === 'sent' && !e.w && sum2 === 0,
    { dry: dry.jinky, d1: d1.jinky, sum1, e, sum2 }); }

/* 28 */
{ let seen = null; const heb = 'משימה ארוכה מאוד עם הרבה מילים בעברית כדי לפצל את ההודעה לשניים';
  const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS),
    cmb: n => { if (n === 1) seen = W.UP['ub|' + D + '|jinky'] || null; return n === 2 ? { code: 500, body: 'busy' } : { code: 200, body: 'Message queued.' }; } });
  W.cloud.hydroPro_tasks_v1 = [1, 2, 3].map(k => ({ id: 'H' + k, title: heb + ' ' + k, owner: 'jinky', status: 'todo', due: Y }))
    .concat([1, 2, 3].map(k => ({ id: 'N' + k, title: heb, owner: 'jinky', status: 'todo', due: D })));
  W.cloud.hydroPro_pa_inbox_v1 = [1, 2, 3].map(k => ({ id: 'I' + k, user: 'jinky', at: at(D, '05:00'), itemId: 'x', title: heb + ' notice ' + k, read: false }));
  W.tick(D, '06:40'); const r1 = W.rec(D, 'jinky').w, n1 = W.cmb.length;
  W.tick(D, '06:55'); const n2 = W.cmb.length;
  const st = seen ? JSON.parse(seen) : {};
  /* the deadline: a slow CallMeBot (310 s per call) → the second WhatsApp part is not started after 5 min */
  const W3 = world({ cloud: J(W.cloud), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS), cmbCost: 310000 });
  W3.tick(D, '06:40'); const r3 = W3.rec(D, 'jinky').w;
  check('WhatsApp robustness: when CallMeBot is called the e-mail is already saved as sent and w = "sending"; a 2-part message whose part 2 fails → w unconfirmed "part 2 of 2 failed … part 1 arrived", next tick sends 0 more parts (2 calls in total); CallMeBot at 310 s per call → part 2 not started (unconfirmed "stopped after part 1 of 2 (time limit)")',
    st.e && st.e.s === 'sent' && st.w && st.w.s === 'sending' && r1.s === 'unconfirmed' && /^part 2 of 2 failed/.test(r1.why) && /part 1 arrived/.test(r1.why) && n1 === 2 && n2 === 2
    && r3.s === 'unconfirmed' && /stopped after part 1 of 2 \(time limit\)/.test(r3.why) && W3.cmb.length === 1,
    { st, r1, n1, n2, r3, c3: W3.cmb.length }); }

/* 29 */
{ const W = world({ cloud: CLOUD(), props: WAKEYS, noOwner: true, from: 'Eyal Ben Ari <eyal@abapardes.com.ph>' }); W.set(D, '09:00');
  const r = W.ctx.installUserBriefs(), t1 = W.ctx.nexiUserBriefTick();
  W.ctx.sendRound_('morning'); const trg = W.triggers.map(t => t.fn);
  const W2 = world({ cloud: CLOUD(), props: WAKEYS, noOwner: true }); W2.set(D, '09:00');
  const r2 = W2.ctx.installUserBriefs(), setup = W2.mails.filter(m => /setup check/.test(m.subject));
  check('installer account check: run as eyal@ → "STOPPED — this account is eyal@abapardes.com.ph", 0 e-mails, no nexiUserBriefTick trigger (also not after a 06:00 leadership round), the tick is skipped; run as nexi@ → 1 setup-check mail to eyal@abapardes.com.ph, nexiUserBriefTick every 15 min, the probe draft deleted',
    /^STOPPED — this account is eyal@abapardes\.com\.ph/.test(r) && !W.UP.ub_owner && t1 && /run installUserBriefs/.test(t1.skipped) && trg.indexOf('nexiUserBriefTick') < 0
    && W.mails.filter(m => /setup check/.test(m.subject)).length === 0
    && setup.length === 1 && setup[0].to === 'eyal@abapardes.com.ph' && W2.triggers.some(t => t.fn === 'nexiUserBriefTick' && t.everyMinutes === 15) && W2.drafts.length === 1 && W2.drafts[0].deleted
    && JSON.parse(W2.UP.ub_owner) === 'nexi@abapardes.com.ph',
    { r, t1, trg, r2, setup: setup.length, drafts: W2.drafts }); }

/* 30 */
{ const us = USERS().concat([{ username: 'jin', fullname: 'Jin Reyes', active: true, email: 'jin@abapardes.com.ph' }, { username: 'kjin', fullname: 'K Jin', active: true, email: 'kjin@abapardes.com.ph' }]);
  const sc = SCOPE(1); sc.users.jean.mail = 'jean.op@abapardes.com.ph';
  const W = world({ cloud: CLOUD({ hydroPro_users: us, nexibrief_scope_v1: sc }), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS),
    bounces: [[{ id: 'B9', body: 'Address not found\n\nYour message wasn\'t delivered to kjin@abapardes.com.ph because the address couldn\'t be found.' }]] });
  W.tick(D, '07:05'); W.tick(D, '07:20'); const s = W.log().setup.jean;
  check('addresses: Users e-mail jean@gmail.com + HR jean.op@abapardes.com.ph → the HR company address is used (mail ok, from hr, 1 e-mail to jean.op@); a bounce for kjin@ marks kjin bounced and NOT jin@ (jin stays sent)',
    s.mail === 'ok' && s.mailFrom === 'hr' && W.mails.filter(m => m.to === 'jean.op@abapardes.com.ph').length === 1 && W.rec(D, 'jin').e.s === 'sent' && W.rec(D, 'kjin').e.s === 'bounced',
    { s, jin: W.rec(D, 'jin').e, kjin: W.rec(D, 'kjin').e }); }

/* 31 */
{ const W = world({ cloud: CLOUD(), props: Object.assign({ USER_BRIEF: 'on' }, WAKEYS) });
  const f = W.ctx.UrlFetchApp.fetch; W.ctx.UrlFetchApp.fetch = (u, o) => { if (/\/sync\/push$/.test(u)) return { getResponseCode: () => 500, getContentText: () => '{"error":"kv down"}' }; return f(u, o); };
  ['06:40', '06:55', '07:10', '07:25'].forEach(hm => W.tick(D, hm));
  const owner = W.mails.filter(m => m.to === 'eyal@abapardes.com.ph' && /could not run/.test(m.subject));
  const W2 = world({ cloud: CLOUD(), props: WAKEYS }); W2.set(D, '06:05');
  const nt = W2.ctx.ScriptApp.newTrigger;
  W2.ctx.ScriptApp.newTrigger = fn => { const b = nt(fn); if (fn === 'nexiUserBriefTick') b.create = () => { throw new Error('This script has too many triggers.'); }; return b; };
  let err = ''; try { W2.ctx.nexiMorningBrief(); } catch (e) { err = String(e); }
  check('engine health: /sync/push failing 4 ticks in a row → exactly 1 "⚠ Nexi user briefs could not run: log: /sync/push HTTP 500" mail to eyal@abapardes.com.ph; "too many triggers" while adding nexiUserBriefTick → the 06:00 leadership round still sends its 3 e-mails',
    owner.length === 1 && /sync\/push HTTP 500/.test(owner[0].subject) && !err && W2.mails.length === 3,
    { owner: owner.map(m => m.subject), err, m2: W2.mails.length }); }

console.log(fails ? fails + ' failed' : total + '/' + total + ' passed');
process.exit(fails ? 1 : 0);
