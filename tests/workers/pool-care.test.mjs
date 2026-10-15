// 🧽 Pool care — the nexi@ Apps Script part (workers/nexi-pool-care.gs v1.1, Nexi v23.48). Run: node tests/workers/pool-care.test.mjs
// The .gs file runs in node:vm NEXT TO THE REAL workers/nexi-morning-brief.gs v4.0 (one Apps Script project, released in Nexi
// v23.30), with stubbed Apps Script services and a stubbed cloud / CallMeBot / Gmail — no network. The plan is the one Nexi makes on Wed 14 Oct 2026 from Eder's
// history: Thu 15 Oct GH1 + GH2 cleaning, GH3 + GH4 water · Fri 16 GH5 + GH6 · Sat 17 GH7 + GH8 · Mon 19 GH9 + GH10 (all cleanings).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const here = dirname(fileURLToPath(import.meta.url));
const CODE = readFileSync(join(here, '../../workers/nexi-pool-care.gs'), 'utf8');
let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 700))); if (!ok) fails++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* the REAL nexi-morning-brief.gs v4.0 (as released in Nexi v23.30) shares the Apps Script project — both files run in one vm context */
const V4 = readFileSync(join(here, '../../workers/nexi-morning-brief.gs'), 'utf8');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const p2 = n => String(n).padStart(2, '0');
function fmtGs(d, tz, f) { const x = new Date(d.getTime() + 8 * 3600e3);
  return f.replace(/yyyy|MMM|MM|dd|d|EEE|HH|mm|ss|u/g, t => ({ yyyy: x.getUTCFullYear(), MMM: MONS[x.getUTCMonth()], MM: p2(x.getUTCMonth() + 1), dd: p2(x.getUTCDate()), d: x.getUTCDate(),
    EEE: DAYS[x.getUTCDay()], HH: p2(x.getUTCHours()), mm: p2(x.getUTCMinutes()), ss: p2(x.getUTCSeconds()), u: x.getUTCDay() || 7 }[t])); }
const USERS = [
  { username: 'eyal', fullname: 'Eyal Ben Ari', role: 'admin', active: true },
  { username: 'amy', fullname: 'Dra Amy Patdu', role: 'admin_secondary', active: true },
  { username: 'ederlynt', fullname: 'Ederlyn Torzar', role: 'supervisor', department: 'PROD_TRAINEES', active: true, email: 'ederlynt@abapardes.com.ph' },
  { username: 'pedro', fullname: 'Pedro Cruz', role: 'operator', active: true },
  { username: 'jomel', fullname: 'Jomel Galvo', role: 'supervisor', active: true, email: 'jomel@gmail.com' }];
/* the 10 open jobs Nexi makes on 14 Oct (catch-up), GH3's person is pedro, the others are answered by the supervisor (proxy) */
const J = (u, cyc, plan, work, wd, cd, lw, lc) => ({ id: 'PJ_' + u + '_' + cyc.replace(/-/g, ''), rec: 'job', unit: u, pools: ['P' + String(u.slice(2)).padStart(2, '0')], work, cycleDue: cyc,
  waterDue: wd, cleanDue: cd, lastWater: lw, lastClean: lc, plan, planOrig: plan, catchup: true, nohist: false, status: 'planned', replans: [],
  who: { sup: 'ederlynt', supNote: '', ghpUser: u === 'GH3' ? 'pedro' : '', ghpName: u === 'GH3' ? 'Pedro Cruz' : '', proxy: u !== 'GH3', esc: ['amy', 'eyal'], maint: 'jomel' },
  taskId: 'TSK_POOL_' + u + '_' + cyc.replace(/-/g, ''), priority: 'normal' });
const JOBS = () => [
  J('GH1', '2026-09-17', '2026-10-15', 'clean', '2026-10-10', '2026-09-17', '2026-09-26', '2026-08-17'),
  J('GH2', '2026-09-17', '2026-10-15', 'clean', '2026-10-10', '2026-09-17', '2026-09-26', '2026-08-17'),
  J('GH3', '2026-10-10', '2026-10-15', 'water', '2026-10-10', '2026-10-24', '2026-09-26', '2026-09-24'),
  J('GH4', '2026-10-10', '2026-10-15', 'water', '2026-10-10', '2026-10-24', '2026-09-26', '2026-09-24'),
  J('GH5', '2026-09-24', '2026-10-16', 'clean', '2026-10-12', '2026-09-24', '2026-09-28', '2026-08-24'),
  J('GH6', '2026-09-24', '2026-10-16', 'clean', '2026-09-29', '2026-09-24', '2026-09-15', '2026-08-24'),
  J('GH7', '2026-09-25', '2026-10-17', 'clean', '2026-09-25', '2026-10-11', '2026-09-11', '2026-09-11'),
  J('GH8', '2026-09-25', '2026-10-17', 'clean', '2026-09-25', '2026-10-11', '2026-09-11', '2026-09-11'),
  J('GH9', '2026-09-30', '2026-10-19', 'clean', '2026-09-30', '2026-10-16', '2026-09-16', '2026-09-16'),
  J('GH10', '2026-10-06', '2026-10-19', 'clean', '2026-10-06', '2026-10-18', '2026-09-22', '2026-09-18')];
const KEYS = { WA_EDERLYNT: '639170000001|k-eder', WA_EYAL: '639170000002|k-eyal', WA_AMY: '639170000003|k-amy' };
const MS = (day, hm) => Date.parse(day + 'T' + hm + ':00+08:00');
const DOW = d => new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))).getUTCDay();
const clock = (day, hm) => ({ day, hm, dow: DOW(day), label: day, ms: MS(day, hm) });

/* a fresh Apps Script project: Script properties, the engine's own User properties, the fetches, the mails, the triggers */
function world(o) {
  o = o || {};
  const SP = Object.assign({ POOL_CARE: 'on', HNX_USER: 'nexi', HNX_PASS: 'pw' }, KEYS, o.props || {}), UP = {}, fetches = [], mails = [], triggers = [], pushes = [];
  if (o.props && o.props.POOL_CARE === undefined && 'POOL_CARE' in o.props) delete SP.POOL_CARE;
  const data = { hydroPro_users: JSON.stringify(o.users || USERS), hydroPro_pool_jobs_v1: JSON.stringify(o.jobs || JOBS()),
    hydroPro_notify_outbox_v1: JSON.stringify(o.outbox || []), hydroPro_pool_care_cfg_v1: o.cfg ? JSON.stringify(o.cfg) : null, hydroPro_ph_holidays: JSON.stringify(o.holidays || {}) };
  const resp = (c, b) => ({ getResponseCode: () => c, getContentText: () => (typeof b === 'string' ? b : JSON.stringify(b)) });
  const props = S => ({ getProperty: k => (k in S ? S[k] : null), setProperty: (k, v) => { S[k] = String(v); }, deleteProperty: k => { delete S[k]; },
    getProperties: () => Object.assign({}, S), getKeys: () => Object.keys(S) });
  const ctx = {
    PropertiesService: { getScriptProperties: () => props(SP), getUserProperties: () => props(UP) },
    UrlFetchApp: { fetch: (url, opt) => {
      fetches.push(url);
      if (/\/auth\/login$/.test(url)) return resp(200, { token: 't' });
      if (/\/sync\/pull/.test(url)) { const m = /[?&]keys=([^&]*)/.exec(url), d = {}; decodeURIComponent(m[1]).split(',').forEach(k => { if (k in data && data[k] != null) d[k] = data[k]; }); return resp(200, { data: d }); }
      if (/\/sync\/push$/.test(url)) { pushes.push(JSON.parse(opt.payload)); return resp(200, { ok: true }); }
      if (/callmebot/.test(url)) { const code = typeof o.http === 'function' ? o.http(url) : 200; return resp(code, code === 200 ? 'Message queued. You will receive it in a few seconds.' : 'error'); }
      throw new Error('unexpected fetch ' + url); } },
    GmailApp: { sendEmail: (to, subject, body, opts) => mails.push({ to, subject, body }), search: () => [] },
    LockService: { getScriptLock: () => ({ tryLock: () => o.busy !== true, releaseLock: () => {} }) },
    ScriptApp: { getProjectTriggers: () => triggers.slice(), deleteTrigger: t => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
      newTrigger: fn => ({ timeBased: () => ({ everyMinutes: m => ({ create: () => { const t = { fn, m, getHandlerFunction: () => fn }; triggers.push(t); return t; } }) }) }) },
    Utilities: { sleep: () => {}, formatDate: fmtGs }, Logger: { log() {} }, console: { warn: () => {}, log: () => {} },
    JSON, Date, Math, Number, String, Object, Array, RegExp, Error, isFinite, isNaN, encodeURIComponent, decodeURIComponent, parseInt, parseFloat };
  vm.createContext(ctx);
  if (!o.noV4) vm.runInContext(V4, ctx);
  vm.runInContext(CODE, ctx);
  ctx.__PUSH = { filter: f => pushes.map(p => ({ path: '/sync/push', body: p })).filter(f) };
  const run = (day, hm) => ctx.pcRun_({ M: clock(day, hm) });
  const wa = () => fetches.filter(u => /callmebot/.test(u)).map(u => ({ phone: /phone=(\d+)/.exec(u)[1], text: decodeURIComponent(/&text=(.*)$/.exec(u)[1]) }));
  const log = () => { const p = pushes.filter(x => x.data && x.data.nexipool_log_v1).slice(-1)[0]; return p ? JSON.parse(p.data.nexipool_log_v1) : null; };
  return { ctx, SP, UP, fetches, mails, triggers, data, run, wa, log, pushes };
}
const PH = { '639170000001': 'ederlynt', '639170000002': 'eyal', '639170000003': 'amy' };

/* 37 */ { const W = world(); const r = W.run('2026-10-14', '17:05'); const w = W.wa();
  const exp = 'Nexi · Pool care tomorrow (Thu 15 Oct): GH1 + GH2 pool cleaning with water change (P01, P02) · GH3 + GH4 water change (P03, P04). Prepare cleaning materials today (SOP A, 4:45 PM). Nexi will ask after each job.';
  const lg = W.log(), pe = lg && lg.sent['poolrem_2026-10-15_eve_pedro'];
  check('Wed 14 Oct 17:05 → 1 WhatsApp to ederlynt: "' + exp + '"; pedro (GH3 person, no WA key, no company e-mail) → no-key; log poolrem_2026-10-15_eve_ederlynt sent',
    w.length === 1 && PH[w[0].phone] === 'ederlynt' && w[0].text === exp && pe && pe.s === 'no-key' && lg.sent['poolrem_2026-10-15_eve_ederlynt'].s === 'sent' && r.sends === 1, { w, r, lg }); }
/* 37b */ { const W = world({ users: USERS.map(u => u.username === 'pedro' ? Object.assign({}, u, { email: 'pedro@abapardes.com.ph' }) : u) }); W.run('2026-10-14', '17:05');
  check('the GH person gets only his own GH: pedro (company e-mail, no WA key) → 1 e-mail "Nexi · Pool care tomorrow (Thu 15 Oct): GH3 water change (P03). Nexi will ask after each job."',
    W.mails.length === 1 && W.mails[0].to === 'pedro@abapardes.com.ph' && W.mails[0].body.indexOf('Nexi · Pool care tomorrow (Thu 15 Oct): GH3 water change (P03). Nexi will ask after each job.') === 0, W.mails); }
/* 38 */ { const W = world(); W.run('2026-10-15', '06:35'); const a = W.wa(); W.run('2026-10-15', '06:50'); const b = W.wa();
  const exp = 'Nexi · Pool care today (Thu 15 Oct): GH1 + GH2 pool cleaning with water change · GH3 + GH4 water change. Refill to the cleaning mark, bring EC to 2.2 / pH to 6.0 (SOP F). Answer in Nexi when done — it asks at 11:00.';
  check('Thu 15 Oct 06:35 → the "today" WhatsApp to ederlynt ("' + exp + '"); re-run 06:50 → 0 more sends', a.length === 1 && a[0].text === exp && b.length === 1, { a, b }); }
/* 38b */ { const W = world(); W.run('2026-10-15', '06:20'); W.run('2026-10-15', '10:31'); W.run('2026-10-14', '16:59'); W.run('2026-10-14', '21:00');
  check('outside the windows (06:20, 10:31, 16:59, 21:00) → 0 reminders', W.wa().length === 0 && W.mails.length === 0, W.wa()); }
/* 39 */ { const ob = [{ id: 'pool_GH3_2026-10-15_notdone', kind: 'pool', ev: 'notdone', unit: 'GH3', jobId: 'PJ_GH3_20261010', day: '2026-10-15', to: ['amy', 'eyal'], channel: ['wa', 'mail', 'app'],
    text: '⚠ Nexi · GH3 pool water NOT replaced today (planned Thu 15 Oct). Reason: No fresh water / pump problem — pump repair. New date: Sat 17 Oct. Water is 19 days old (rule 14). Answered by Ederlyn Torzar 11:42.',
    status: 'queued', createdAt: MS('2026-10-15', '11:42'), updatedAt: MS('2026-10-15', '11:42') }];
  const W = world({ outbox: ob }); W.run('2026-10-15', '11:50'); const a = W.wa(), lg = W.log(); W.run('2026-10-15', '12:05');
  const e = lg.sent['pool_GH3_2026-10-15_notdone'];
  check('outbox ❌ not done GH3 (15 Oct) → 2 WhatsApps: amy through the older WA_AMY, eyal through WA_EYAL, the app’s text unchanged; log sent to {amy, eyal}; the next tick sends 0',
    a.length === 2 && same(a.map(x => PH[x.phone]).sort(), ['amy', 'eyal']) && a[0].text === ob[0].text && e.s === 'sent' && same(e.to, { amy: 'sent', eyal: 'sent' }) && same(e.ch, ['wa']) && W.wa().length === 2, { a, e }); }
/* 39b */ { const ob = [{ id: 'pool_GH1_2026-10-15_notdone', kind: 'pool', ev: 'notdone', unit: 'GH1', day: '2026-10-15', to: ['amy', 'eyal'], channel: ['app'], text: 'x', createdAt: MS('2026-10-15', '10:00') }];
  const W = world({ outbox: ob }); W.run('2026-10-15', '10:05');
  check('an outbox record for the app only (WhatsApp "not done" switched off in ⚙ Rules) → 0 sends of it (the 06:30 "today" reminder is another message)', !W.wa().some(x => x.text === 'x') && !W.mails.some(x => /^x/.test(x.body)) && !(W.log().sent['pool_GH1_2026-10-15_notdone']), W.wa()); }
/* 40 */ { const W = world({ props: { POOL_CARE: undefined } }); const r = W.run('2026-10-14', '17:05'); const lg = W.log();
  W.SP.POOL_CARE = 'on'; W.run('2026-10-14', '17:20');
  check('POOL_CARE absent → mode dry: 0 calls to CallMeBot, log "dry" (engine mode dry); switched on in the same window → the reminder goes once',
    r.mode === 'dry' && r.dry === 1 && lg.engine.mode === 'dry' && lg.sent['poolrem_2026-10-15_eve_ederlynt'].s === 'dry' && W.wa().length === 1, { r, lg, wa: W.wa() }); }
/* 40b */ { const W = world({ props: { POOL_CARE: 'off' } }); const r = W.run('2026-10-14', '17:05'); const lg = W.log();
  check('POOL_CARE = off → nothing read or sent, the log says mode off', r.mode === 'off' && W.wa().length === 0 && W.mails.length === 0 && lg.engine.mode === 'off' && !Object.keys(lg.sent).length, { r, lg }); }
/* 41 */ { const W = world({ props: { WA_EDERLYNT: '' } }); W.run('2026-10-14', '17:05');
  const W2 = world({ props: { WA_EDERLYNT: '' }, users: USERS.map(u => u.username === 'ederlynt' ? Object.assign({}, u, { email: 'eder@gmail.com' }) : u) }); W2.run('2026-10-14', '17:05'); const lg2 = W2.log();
  check('no WhatsApp key but a company e-mail → 1 GmailApp mail to ederlynt@abapardes.com.ph (subject "🧽 Nexi pool care — tomorrow (Thu 15 Oct)"); a gmail.com address and no key → "no-key", nothing sent',
    W.mails.length === 1 && W.mails[0].to === 'ederlynt@abapardes.com.ph' && W.mails[0].subject === '🧽 Nexi pool care — tomorrow (Thu 15 Oct)' && W.wa().length === 0
    && W2.mails.length === 0 && W2.wa().length === 0 && lg2.sent['poolrem_2026-10-15_eve_ederlynt'].s === 'no-key', { m: W.mails, s: lg2 && lg2.sent }); }
/* 42 */ { const old = { id: 'pool_GH5_2026-10-12_notdone', kind: 'pool', ev: 'notdone', unit: 'GH5', day: '2026-10-12', to: ['amy'], channel: ['wa', 'app'], text: 'old', createdAt: MS('2026-10-13', '20:00') };
  const fresh = { id: 'pool_GH6_2026-10-14_notdone', kind: 'pool', ev: 'notdone', unit: 'GH6', day: '2026-10-14', to: ['amy'], channel: ['wa', 'app'], text: 'fresh', createdAt: MS('2026-10-14', '21:30') };
  const W = world({ outbox: [old, fresh] }); W.run('2026-10-14', '22:00'); const night = W.wa().length; W.run('2026-10-15', '09:00');
  check('22:00 → 0 sends (quiet 21:00–06:00); next morning 09:00: the record of 14 Oct 21:30 goes, the one of 13 Oct 20:00 (37 h old) is skipped',
    night === 0 && same(W.wa().filter(x => !/^Nexi · Pool care/.test(x.text)).map(x => x.text), ['fresh']), W.wa()); }
/* 43 */ { const ob = [{ id: 'pool_GH3_2026-10-15_notdone', kind: 'pool', ev: 'notdone', unit: 'GH3', day: '2026-10-15', to: ['amy'], channel: ['wa', 'app'], text: '⚠ GH3 pool refilled with 2,630 L', createdAt: MS('2026-10-15', '11:00') }];
  const W = world({ outbox: ob }); W.run('2026-10-15', '11:10'); const lg = W.log();
  check('a text with "2,630 L" → blocked by the money guard: not sent, logged "blocked"', W.wa().length === 0 && lg.sent['pool_GH3_2026-10-15_notdone'].s === 'blocked', lg.sent); }
/* 44 */ { const W = world(); W.run('2026-10-16', '08:15'); const a = W.wa(), lg = W.log();
  const exp = '⚠ Nexi · GH3 pool water change planned Thu 15 Oct — NO ANSWER from Ederlyn Torzar and Pedro Cruz (asked 11:00 and 15:00). Nexi asks again today. Water is 20 days old (rule 14).';
  const t3 = a.filter(x => /NO ANSWER/.test(x.text) && /GH3/.test(x.text));
  const ob = [{ id: 'pool_GH3_2026-10-15_noanswer', kind: 'pool', ev: 'noanswer', unit: 'GH3', day: '2026-10-15', to: ['amy', 'eyal'], channel: ['wa', 'mail', 'app'], text: 'app text', createdAt: MS('2026-10-16', '08:20') }];
  W.data.hydroPro_notify_outbox_v1 = JSON.stringify(ob); W.run('2026-10-16', '08:30');
  const dayMsg = a.filter(x => /^Nexi · Pool care today/.test(x.text)).map(x => x.text)[0];
  check('Fri 16 Oct 08:15, GH1–GH4 still open from Thu 15 Oct → the "today" WhatsApp to ederlynt names them: "Nexi · Pool care today (Fri 16 Oct): GH5 + GH6 pool cleaning with water change · still open from Thu 15 Oct: GH1 + GH2 pool cleaning with water change, GH3 + GH4 water change. …"',
    dayMsg === 'Nexi · Pool care today (Fri 16 Oct): GH5 + GH6 pool cleaning with water change · still open from Thu 15 Oct: GH1 + GH2 pool cleaning with water change, GH3 + GH4 water change. Refill to the cleaning mark, bring EC to 2.2 / pH to 6.0 (SOP F). Answer in Nexi when done — it asks at 11:00.', dayMsg);
  check('Fri 16 Oct 08:15, GH3 planned Thu 15 Oct, no answer, no computer open → "no answer" WhatsApp to amy + eyal, id pool_GH3_2026-10-15_noanswer ("' + exp + '"); the app’s outbox record with the same id later → 0 more',
    t3.length === 2 && t3[0].text === exp && same(lg.sent['pool_GH3_2026-10-15_noanswer'].to, { amy: 'sent', eyal: 'sent' }) && W.wa().filter(x => (/NO ANSWER/.test(x.text) && /GH3/.test(x.text)) || x.text === 'app text').length === 2, { t3, sent: lg.sent }); }
/* 44b */ { const jobs = JOBS(); jobs.push({ id: 'PA_PJ_GH3_20261010_20261015', rec: 'answer', jobId: 'PJ_GH3_20261010', unit: 'GH3', day: '2026-10-15', a: 'none', by: 'Nexi', src: 'auto' });
  const W = world({ jobs }); W.run('2026-10-16', '08:15');
  check('an answer record PA_PJ_GH3_20261010_20261015 exists (the app swept it) → the script builds no "no answer" of its own for GH3', !W.wa().some(x => /GH3/.test(x.text)), W.wa()); }
/* 45 */ { const W = world(); const d = W.ctx.pcJobsForDay_(JSON.stringify(JOBS()), '2026-10-15');
  check('pcJobsForDay_(jobs, "2026-10-15") → 4 jobs: GH1 clean (28 days late), GH2 clean (28), GH3 water (5), GH4 water (5); GH3’s person pedro — the same shape as the app’s hnxPoolDay()',
    same(d.map(x => x.unit + ' ' + x.work + ' ' + x.lateDays), ['GH1 clean 28', 'GH2 clean 28', 'GH3 water 5', 'GH4 water 5']) && d[2].who.ghpUser === 'pedro' && d[0].answer === null && d[0].workLabel === 'pool cleaning + water change', d); }
/* 46 */ { const W = world({ http: () => 500 }); W.run('2026-10-14', '17:05'); W.run('2026-10-14', '17:20'); W.run('2026-10-14', '17:35'); W.run('2026-10-14', '17:50');
  const lg = W.log(), e = lg.sent['poolrem_2026-10-15_eve_ederlynt'];
  check('CallMeBot answers HTTP 500 → tried 3 times (17:05, 17:20, 17:35), then left as failed (n 3, "CallMeBot HTTP 500")', W.wa().length === 3 && e.s === 'failed' && e.n === 3 && /HTTP 500/.test(e.why), { n: W.wa().length, e }); }
/* 47 */ { const W = world({ cfg: { v: 1, wa: { eve: false, day: true, notdone: true, noanswer: true }, times: { eod: '18:00' }, _lww: true } }); W.run('2026-10-14', '17:05'); W.run('2026-10-14', '18:05');
  const W2 = world({ cfg: { v: 1, times: { eod: '18:00' } } }); W2.run('2026-10-14', '17:05'); const before = W2.wa().length; W2.run('2026-10-14', '18:05');
  check('⚙ Rules: WhatsApp "evening before" off → no evening reminder; end of day moved to 18:00 → nothing at 17:05, the reminder at 18:05', W.wa().length === 0 && before === 0 && W2.wa().length === 1, { a: W.wa(), b: W2.wa() }); }
/* 48 */ { const W = world(); W.run('2026-10-14', '17:05'); const pushes = W.ctx.__PUSH.filter(x => x.path === '/sync/push');
  const raw = JSON.stringify(pushes.map(p => p.body));
  check('the log goes to the cloud key nexipool_log_v1 only, with no phone number and no key in it (engine nexi-pool-care.gs v1.1)',
    pushes.length === 1 && Object.keys(pushes[0].body.data).join() === 'nexipool_log_v1' && !/63917|k-eder|k-eyal|k-amy/.test(raw) && W.log().engine.script === 'nexi-pool-care.gs v1.1', raw.slice(0, 300)); }
/* 49 */ { const W = world({ noV4: true }); const r = W.ctx.pcRun_({ M: clock('2026-10-14', '17:05') });
  check('without nexi-morning-brief.gs v4 in the project → "needs nexi-morning-brief.gs v4 in the same project", nothing sent', /needs nexi-morning-brief\.gs v4 in the same project/.test(r.err) && W.fetches.length === 0, r); }
/* 50 */ { const W = world({ busy: true }); const r = W.ctx.nexiPoolCareTick();
  check('another run holds the script lock → this tick is skipped', r.skipped === 'another run is busy' && W.fetches.length === 0, r); }
/* 51 */ { const W = world({ props: { POOL_CARE: undefined } }); W.ctx.__M = clock('2026-10-14', '15:00'); const r = W.ctx.installPoolCare(); W.ctx.installPoolCare();
  const m = W.mails[W.mails.length - 1] || { body: '' };
  check('installPoolCare → ONE 15-minute trigger nexiPoolCareTick (run twice), a setup mail to eyal@abapardes.com.ph naming WA_PEDRO as missing, WA_EDERLYNT found — no phone number or key in it',
    W.triggers.length === 1 && W.triggers[0].fn === 'nexiPoolCareTick' && W.triggers[0].m === 15 && m.to === 'eyal@abapardes.com.ph' && /WA_PEDRO/.test(m.body) && /Ederlyn Torzar \(ederlynt\).*WhatsApp ✓/.test(m.body)
    && !/63917|k-eder|k-eyal|k-amy/.test(m.body) && /Mode: dry/.test(m.body), m.body); }

/* ---------- v1.1 (review of Nexi v23.48) ---------- */
/* 52 */ { const W = world(); const rem = () => W.wa().filter(x => /^Nexi · Pool care/.test(x.text)); W.run('2026-10-17', '17:05'); const a = rem(); W.run('2026-10-18', '17:05'); const b = rem();
  const exp = 'Nexi · Pool care next working day (Mon 19 Oct): GH9 + GH10 pool cleaning with water change (P09, P10). Prepare cleaning materials today (SOP A, 4:45 PM). Nexi will ask after each job.';
  check('Sat 17 Oct 17:05 → the evening reminder for MONDAY goes on Saturday ("' + exp + '", id poolrem_2026-10-19_eve_ederlynt); Sun 18 Oct 17:05 → 0 more (the same id)',
    a.length === 1 && a[0].text === exp && b.length === 1 && W.log().sent['poolrem_2026-10-19_eve_ederlynt'].s === 'sent', { a, b }); }
/* 53 */ { const jobs = JOBS().map(j => j.unit === 'GH9' || j.unit === 'GH10' ? Object.assign({}, j, { plan: '2026-10-20' }) : j);
  const W = world({ jobs, holidays: { '2026-10-19': { name: 'test holiday', kind: 'regular' } } }); W.run('2026-10-17', '17:05'); const a = W.wa().filter(x => /^Nexi · Pool care/.test(x.text));
  check('PH holiday Mon 19 Oct in hydroPro_ph_holidays, GH9 + GH10 planned Tue 20 Oct → the Saturday 17:05 reminder is "next working day (Tue 20 Oct)"',
    a.length === 1 && /^Nexi · Pool care next working day \(Tue 20 Oct\): GH9 \+ GH10 pool cleaning/.test(a[0].text), a); }
/* 54 */ { const jobs = JOBS().filter(j => j.unit === 'GH7');
  const W = world({ jobs }); W.run('2026-10-18', '08:15'); const a = W.wa().filter(x => /NO ANSWER/.test(x.text));
  check('GH7 planned Sat 17 Oct, nobody answered, Sunday 18 Oct 08:15 → the "no answer" says "Nexi asks again Mon 19 Oct" (never "today" on a Sunday)',
    a.length === 2 && a.every(x => /Nexi asks again Mon 19 Oct\./.test(x.text)), a); }
/* 55 */ { const jobs = JOBS(); jobs.push({ id: 'PA_PJ_GH1_20260917_20261015', rec: 'answer', jobId: 'PJ_GH1_20260917', unit: 'GH1', day: '2026-10-15', a: 'yes', by: 'ederlynt', src: 'screen' });
  const ob = [{ id: 'pool_GH1_2026-10-15_noanswer', kind: 'pool', ev: 'noanswer', unit: 'GH1', jobId: 'PJ_GH1_20260917', day: '2026-10-15', to: ['amy', 'eyal'], channel: ['wa', 'mail', 'app'], text: 'stale no answer GH1', createdAt: MS('2026-10-16', '08:00') }];
  const W = world({ jobs, outbox: ob }); W.run('2026-10-16', '08:20');
  check('an outbox "no answer" for GH1 (queued by a computer with a stale copy) while the cloud already has ✅ PA_PJ_GH1_20260917_20261015 → not sent', !W.wa().some(x => x.text === 'stale no answer GH1'), W.wa()); }
/* 56 */ { const ob = [{ id: 'pool_GH5_2026-10-16_notdone', kind: 'pool', ev: 'notdone', unit: 'GH5', jobId: 'PJ_GH5_20260924', day: '2026-10-16', to: ['amy', 'eyal'], channel: ['wa', 'mail', 'app'],
    text: '⚠ Nexi · GH5 pool NOT cleaned today (planned Fri 16 Oct). Reason: pump problem EC 1.75. New date: Sat 17 Oct. Answered by Ederlyn Torzar 12:00.',
    text2: '⚠ Nexi · GH5 pool NOT cleaned today (planned Fri 16 Oct). Reason: written in Nexi. New date: Sat 17 Oct. Answered by Ederlyn Torzar 12:00.', createdAt: MS('2026-10-16', '12:00') }];
  const W = world({ outbox: ob }); W.run('2026-10-16', '12:05'); const a = W.wa().filter(x => /GH5 pool NOT cleaned/.test(x.text)), e = W.log().sent['pool_GH5_2026-10-16_notdone'];
  check('a ❌ text v4\'s money guard drops ("EC 1.75" = two decimals) → its reason-free copy goes to amy + eyal ("Reason: written in Nexi"), logged sent "sent without the written reason (it looked like money)"',
    a.length === 2 && a.every(x => /Reason: written in Nexi\./.test(x.text)) && e.s === 'sent' && /without the written reason/.test(e.why), { a, e }); }
/* 57 */ { const users = USERS.map(u => u.username === 'amy' ? Object.assign({}, u, { username: 'dramy' }) : u).concat([{ username: 'iris', fullname: 'Iris Ben Ari', active: true }]);
  const jobs = JOBS().map(j => Object.assign({}, j, { who: Object.assign({}, j.who, { esc: ['dramy', 'iris'] }) }));
  const ob = [{ id: 'pool_GH3_2026-10-15_notdone', kind: 'pool', ev: 'notdone', unit: 'GH3', day: '2026-10-15', to: ['dramy', 'iris'], channel: ['wa', 'app'], text: 'GH3 not done', createdAt: MS('2026-10-15', '11:42') }];
  const W = world({ users, jobs, outbox: ob }); W.run('2026-10-15', '11:50'); const a = W.wa().filter(x => x.text === 'GH3 not done'), lg = W.log().sent['pool_GH3_2026-10-15_notdone'];
  check('v4\'s leader usernames: "dramy" (LEGACY_USERS → Dr Amy) uses WA_AMY; "Iris Ben Ari" (a name that only LOOKS like Eyal\'s) never borrows WA_EYAL → no-key',
    a.length === 1 && PH[a[0].phone] === 'amy' && lg.to.dramy === 'sent' && lg.to.iris === 'no-key', { a, lg }); }
/* 58 */ { const W = world(); const d = W.ctx.pcJobsForDay_(JSON.stringify(JOBS()), '2026-10-19');
  check('pcJobsForDay_(jobs, "2026-10-19") → GH9 cleaning job late 19 days (from its water rule 30 Sep, not the cleaning rule 16 Oct), GH10 13 days (water 6 Oct) — the same as the app',
    JSON.stringify(d.map(x => x.unit + ' ' + x.lateDays)) === JSON.stringify(['GH9 19', 'GH10 13']), d); }

/* ---------- fix 2 (15 Oct 2026, Nexi v23.48): the alerts proven against the LIVE v4.0 engine ---------- */
/* 59 */ { const text = '⚠ Nexi · GH3 pool water NOT replaced today (planned Thu 15 Oct). Reason: No fresh water / pump problem — the pump of P03 stopped. New date: Fri 16 Oct. Water is 19 days old (rule 14). Answered by Ederlyn Torzar 11:42.';
  const ob = [{ id: 'pool_GH3_2026-10-15_notdone', kind: 'pool', ev: 'notdone', unit: 'GH3', jobId: 'PJ_GH3_20261010', day: '2026-10-15', to: ['amy', 'eyal'], channel: ['wa', 'mail', 'app'], text, createdAt: MS('2026-10-15', '11:42') }];
  const W = world({ outbox: ob }); W.run('2026-10-15', '11:50'); const a = W.wa().filter(x => /NOT replaced/.test(x.text)), urls = W.fetches.filter(u => /callmebot/.test(u));
  check('fix 2: a ❌ GH3 water change (the app’s own text, pool P03 in the reason) → exactly 2 WhatsApps, through WA_AMY (639170000003|k-amy) and WA_EYAL (639170000002|k-eyal); both texts name GH3 and are unchanged; v4.0’s isMoneyWa_ is false and moneyGuard_ drops 0 lines; no e-mail',
    a.length === 2 && same(a.map(x => PH[x.phone]).sort(), ['amy', 'eyal']) && a.every(x => /GH3/.test(x.text) && x.text === text) && urls.some(u => /phone=639170000003&apikey=k-amy&/.test(u)) && urls.some(u => /phone=639170000002&apikey=k-eyal&/.test(u))
    && W.ctx.isMoneyWa_(text) === false && W.ctx.moneyGuard_(text).dropped === 0 && W.mails.length === 0, { a, urls: urls.map(u => u.replace(/text=.*/, '')), money: W.ctx.isMoneyWa_(text) }); }
/* 59b */ { const W = world(); const texts = ['Nexi · Pool care tomorrow (Thu 15 Oct): GH1 + GH2 pool cleaning with water change (P01, P02) · GH3 + GH4 water change (P03, P04). Prepare cleaning materials today (SOP A, 4:45 PM). Nexi will ask after each job.',
    'Nexi · Pool care today (Mon 19 Oct): GH9 + GH10 pool cleaning with water change · PRJ12 water change (P12A). Refill to the cleaning mark, bring EC to 2.2 / pH to 6.0 (SOP F). Answer in Nexi when done — it asks at 11:00.',
    '⚠ Nexi · GH10 pool cleaning planned Mon 19 Oct — NO ANSWER from Ederlyn Torzar (asked 11:00 and 15:00). Nexi asks again Tue 20 Oct. Water is 33 days old (rule 14).'];
  check('fix 2: pool names P01–P12A, GH1–GH10, PRJ12, "EC 2.2 / pH 6.0", "4:45 PM", "11:00" and "33 days old (rule 14)" are not money to v4.0’s guard (isMoneyWa_ false, 0 lines dropped, text unchanged) — the reminders and the no-answer text go out whole',
    texts.every(t => W.ctx.isMoneyWa_(t) === false && W.ctx.moneyGuard_(t).dropped === 0 && W.ctx.moneyGuard_(t).text === t), texts.map(t => [W.ctx.isMoneyWa_(t), W.ctx.moneyGuard_(t).dropped])); }
/* 60 */ { const ob = [{ id: 'pool_GH3_2026-10-15_notdone', kind: 'pool', ev: 'notdone', unit: 'GH3', jobId: 'PJ_GH3_20261010', day: '2026-10-15', to: ['amy', 'eyal'], channel: ['wa', 'mail', 'app'], text: '⚠ Nexi · GH3 pool water NOT replaced today (planned Thu 15 Oct). Reason: crew. New date: Fri 16 Oct.', createdAt: MS('2026-10-15', '11:42') }];
  const W = world({ props: { POOL_CARE: undefined }, outbox: ob }); const r = W.run('2026-10-15', '11:50'); const e = W.log().sent['pool_GH3_2026-10-15_notdone'];
  check('fix 2: dry mode (Script property POOL_CARE absent) + the same ❌ GH3 → 0 CallMeBot calls, 0 e-mails; the log says dry for amy and eyal (channel wa) — nothing reaches a phone',
    r.mode === 'dry' && W.wa().length === 0 && W.mails.length === 0 && !!e && e.s === 'dry' && same(e.to, { amy: 'dry', eyal: 'dry' }) && same(e.ch, ['wa']), { r, e, wa: W.wa() }); }
/* 61 */ { const W = world(); W.run('2026-10-14', '17:05'); const urls = W.fetches.filter(u => /callmebot/.test(u));
  check('fix 2: the day-before reminder (Wed 14 Oct 17:05 for Thu 15 Oct) goes to the supervisor’s OWN key WA_EDERLYNT (phone 639170000001, apikey k-eder) — 1 call, none to Eyal’s or Dr Amy’s numbers, no e-mail',
    urls.length === 1 && /phone=639170000001&apikey=k-eder&/.test(urls[0]) && !urls.some(u => /639170000002|639170000003/.test(u)) && W.mails.length === 0 && /Pool%20care%20tomorrow/.test(urls[0]), urls.map(u => u.replace(/text=.*/, ''))); }

console.log(`\n${total - fails}/${total} passed`);
if (fails) process.exit(1);
