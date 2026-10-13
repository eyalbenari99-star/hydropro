// v23.10 (review of v23.04): a follow-up made on Overview ▸ 🚨 Escalation is reminded inside Nexi only — the CRM customer-task
// e-mail (workers/nexi-crm-brief.gs, nexiCustomerTasks) must leave it out. Run: node tests/workers/crm-brief-escalation.test.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../workers/nexi-crm-brief.gs'), 'utf8');
const m = /function isCustomerTask_\(t\) \{[\s\S]*?\n\}/.exec(src);
let fails = 0;
const check = (name, ok, got) => { console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  got: ' + JSON.stringify(got))); if (!ok) fails++; };
check('isCustomerTask_ is in nexi-crm-brief.gs', !!m, null);
const ctx = {}; vm.createContext(ctx); vm.runInContext((m ? m[0] : 'function isCustomerTask_(){return null;}') + '\nthis.f=isCustomerTask_;', ctx);
const f = ctx.f;
const esc = { id: 'TSK_1', module: 'crm', due: '2026-10-15', status: 'todo', links: [{ type: 'escalation', id: 'ESC_crm_TP_E2', label: '🚨 Escalation · Follow-up visit' }] };
check('a CRM follow-up task from 🚨 Escalation (link {type:escalation}) → not a customer task (not e-mailed)', f(esc) === false, f(esc));
check('a plain CRM task → still a customer task', f({ id: 'TSK_2', module: 'crm', links: [] }) === true, f({ id: 'TSK_2', module: 'crm', links: [] }));
check('a task linked as "customer:C-0412" → still a customer task', f({ id: 'TSK_3', module: 'general', links: ['customer:C-0412'] }) === true, null);
check('a general task with no customer link → not a customer task', f({ id: 'TSK_4', module: 'general', links: [] }) === false, null);
console.log(fails ? fails + ' failed' : '5/5 passed');
process.exit(fails ? 1 : 0);
