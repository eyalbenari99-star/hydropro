// Elitech alarm-mail bridge (workers/elitech-alarm-bridge.gs, v22.96). Run: node tests/workers/elitech-bridge.test.mjs
// The .gs file runs in node:vm with stubbed Apps Script services — no network. ALL SAMPLES ARE SYNTHETIC until the owner forwards one
// real Elitech alarm mail (owner / IT checklist step 12); then that mail becomes a case here.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const here = dirname(fileURLToPath(import.meta.url));
const CODE = readFileSync(join(here, '../../workers/elitech-alarm-bridge.gs'), 'utf8');
let fails = 0, total = 0;
const check = (name, ok, got) => { total++; console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got).slice(0, 600))); if (!ok) fails++; };

/* a fresh Apps Script world: properties, one inbox, the fetches made, the log, the mails sent */
function world(props, mails, http) {
  const P = Object.assign({}, props || {}), logs = [], posts = [], sent = [];
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in P ? P[k] : null), setProperty: (k, v) => { P[k] = String(v); } }) },
    GmailApp: { search: () => [{ getMessages: () => (mails || []).map(m => ({ getId: () => m.id, getDate: () => new Date(m.date), getSubject: () => m.subject || '', getPlainBody: () => m.body || '' })) }] },
    UrlFetchApp: { fetch: (url, o) => { const body = JSON.parse(o.payload); posts.push({ url, auth: o.headers.Authorization, body }); const code = typeof http === 'function' ? http(posts.length) : (http || 200);
      return { getResponseCode: () => code, getContentText: () => JSON.stringify(code === 200 ? { ok: true, stored: body.readings.length, duplicates: 0, refused: [] } : { error: 'x' }) }; } },
    Utilities: { formatDate: (d, tz, f) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 10) },
    Logger: { log: s => logs.push(String(s)) },
    MailApp: { sendEmail: o => sent.push(o) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create: () => ({}) }) }) }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'nexi@abapardes.com.ph' }) },
    JSON, Date, Math, Number, String, Object, Array, RegExp, isFinite,
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  return { ctx, P, logs, posts, sent };
}
const MAP = { 'Cold storage 1': 'CS1', 'Cold storage 2': 'CS2' };
const W = world();
const parse = (s, b, map) => W.ctx.parseElitechMail(s, b, '2026-10-13T00:15:00Z', 'm1', map || MAP);
const pick = r => r && (r.skip ? { skip: r.skip } : r.fault ? { fault: r.fault, room: r.room } : { room: r.room, t: r.t, alarm: r.alarm });

{ const r = pick(parse('Elitech alarm', 'Current temperature: 13.4℃ / Upper limit: 8.0℃ / Cold storage 1'));
  check('"Current temperature: 13.4℃ / Upper limit: 8.0℃ / Cold storage 1" → CS1 13.4 high (never the 8.0 limit)', JSON.stringify(r) === JSON.stringify({ room: 'CS1', t: 13.4, alarm: 'high' }), r); }
{ const r = pick(parse('', '设备：Cold storage 2 当前温度：1.5℃ 下限：4.0℃ 低温报警'));
  check('"设备：Cold storage 2 当前温度：1.5℃ 下限：4.0℃ 低温报警" → CS2 1.5 low (full-width colon, 下限 = a limit)', JSON.stringify(r) === JSON.stringify({ room: 'CS2', t: 1.5, alarm: 'low' }), r); }
{ const r = pick(parse('', 'Cold storage 1 temperature returned to normal 6.2°C'));
  check('"Cold storage 1 temperature returned to normal 6.2°C" → CS1 6.2 recovered', JSON.stringify(r) === JSON.stringify({ room: 'CS1', t: 6.2, alarm: 'recovered' }), r); }
{ const r = pick(parse('', 'Cold storage 1 device offline'));
  check('"Cold storage 1 device offline" → fault offline (nothing posted)', JSON.stringify(r) === JSON.stringify({ fault: 'offline', room: 'CS1' }), r); }
{ const r = pick(parse('', 'Cold storage 1 9.1°C 8.0°C'));
  check('"Cold storage 1 9.1°C 8.0°C" → skip "ambiguous value"', JSON.stringify(r) === JSON.stringify({ skip: 'ambiguous value' }), r); }
{ const r = pick(parse('', 'Freezer 3 current temperature 3.0℃'));
  check('"Freezer 3 current temperature 3.0℃" → skip "unmapped device"', JSON.stringify(r) === JSON.stringify({ skip: 'unmapped device' }), r); }
{ const r = pick(parse('', 'Cold storage 2 current temperature 85.0℃'));
  check('85.0℃ → skip "out of range"', JSON.stringify(r) === JSON.stringify({ skip: 'out of range' }), r); }
{ const r = pick(parse('', 'Cold storage 10 current temperature 5.0℃', { 'Cold storage 1': 'CS1', 'Cold storage 10': 'CS10' })), r2 = pick(parse('', 'Cold storage 10 current temperature 5.0℃', { 'Cold storage 1': 'CS1' }));
  check('map {Cold storage 1: CS1, Cold storage 10: CS10}, text "Cold storage 10" → CS10 (the longest name); with only "Cold storage 1" mapped → "unmapped device" (never CS1)',
    r.room === 'CS10' && r.t === 5 && r2.skip === 'unmapped device', { r, r2 }); }
{ const r = parse('Elitech alarm', 'Current temperature: 13.4℃ / Upper limit: 8.0℃ / Cold storage 1');
  check('the reading carries the mail date (ISO) and the message id', r.ts === '2026-10-13T00:15:00.000Z' && r.msgId === 'm1', r); }

const MAIL = { id: 'msg-1', date: Date.now() - 5 * 60e3, subject: 'Elitech alarm', body: 'Current temperature: 13.4℃ / Upper limit: 8.0℃ / Cold storage 1' };
const BASE = { COLD_NODE_TOKEN: 'node-token-mail', COLD_MAP: JSON.stringify(MAP), ALERT_TO: 'nexi@abapardes.com.ph' };

// runBridge, DRY_RUN not set (defaults to 1): only the heartbeat goes out, the log says what it would post, the id is done
{ const w = world(BASE, [MAIL]); w.ctx.runBridge();
  const done = JSON.parse(w.P.cold_done_msg_ids || '[]');
  check('runBridge with DRY_RUN unset (= 1): ONE POST …/cold/push with {readings:[]} (heartbeat, Bearer node token), log "would post CS1 13.4 °C (high) msg msg-1", msg-1 marked done, the daily mail lists the dry run',
    w.posts.length === 1 && w.posts[0].url === 'https://nexi-cold.eyalbenari99.workers.dev/cold/push' && w.posts[0].auth === 'Bearer node-token-mail' && JSON.stringify(w.posts[0].body) === '{"readings":[]}'
    && w.logs.some(l => l === 'would post CS1 13.4 °C (high) msg msg-1') && done.includes('msg-1') && w.sent.length === 1 && /DRY RUN — would post \(1\)/.test(w.sent[0].body), { posts: w.posts, logs: w.logs, done, sent: w.sent }); }

// runBridge, DRY_RUN = 0: the reading is posted; the id is done only after HTTP 200
{ const w = world(Object.assign({ DRY_RUN: '0' }, BASE), [MAIL], n => (n === 1 ? 500 : 200));
  w.ctx.runBridge();
  const after500 = JSON.parse(w.P.cold_done_msg_ids || '[]');
  w.ctx.runBridge();
  const after200 = JSON.parse(w.P.cold_done_msg_ids || '[]');
  const r = (w.posts[0].body.readings || [])[0] || {};
  check('runBridge with DRY_RUN = 0: POST {room:"CS1", t:13.4, src:"elitech-mail", alarm:"high", msgId:"msg-1"}; HTTP 500 → msg-1 NOT done (posted again next run); HTTP 200 → done',
    r.room === 'CS1' && r.t === 13.4 && r.src === 'elitech-mail' && r.alarm === 'high' && r.msgId === 'msg-1' && !after500.includes('msg-1') && w.posts.length === 2 && after200.includes('msg-1'), { posts: w.posts, after500, after200 }); }

// a silent inbox: heartbeat + one warning mail a day
{ const w = world(Object.assign({ DRY_RUN: '0' }, BASE), []); w.ctx.runBridge(); w.ctx.runBridge();
  check('no Elitech mail at all → a heartbeat per run and ONE mail a day "⚠ No Elitech alarm mail … a silent room is not a fine room"',
    w.posts.length === 2 && w.posts.every(p => JSON.stringify(p.body) === '{"readings":[]}') && w.sent.length === 1 && /a silent room is not a fine room/.test(w.sent[0].subject) && /check the iCold app shows the controller online/.test(w.sent[0].body), { posts: w.posts.length, sent: w.sent }); }

// no node token → nothing posted
{ const w = world({ COLD_MAP: JSON.stringify(MAP) }, [MAIL]); w.ctx.runBridge();
  check('COLD_NODE_TOKEN not set → nothing posted, the log says so', w.posts.length === 0 && w.logs.some(l => /COLD_NODE_TOKEN is not set/.test(l)), w.logs); }

console.log(fails ? fails + ' failed' : total + '/' + total + ' passed');
process.exit(fails ? 1 : 0);
