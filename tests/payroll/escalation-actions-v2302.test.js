/* v23.04, built as v23.02 (Eyal, 13 Oct 2026: "most of them not relavant this is why i ask for each one an option what to do drop box with options
   and other as free txt then to follow up and to remind user responsable"): Overview ▸ 🚨 Escalation gives every escalated item ONE
   decision — ACTION · RESPONSIBLE · FOLLOW-UP · NOTE — stored in hydroPro_esc_actions_v1. Not relevant / Already done take the item out
   of every escalation count (the collector and _tt_needsEscalation) on every computer, with a 10-second Undo; other actions create ONE
   linked Tasks task, one inbox note on assignment and one digest a day while overdue.
   Runs on index.html and next.html (NEXI_PAGE=next.html). Never calls renderTaskTracker / switchView('task_tracker') (the Task Matrix
   `enc` page error, reported separately): the Task Tracker count is read as _tt_collectAll().filter(_tt_needsEscalation). */
const REQ="typeof window.hnxEscSave==='function'";
const BOOT_MS=+(process.env.BOOT_MS||23000);
/* the seed runs before the app boots, on every load (a reload keeps the data: the stores are written once per tab).
   Users: eyal admin, edelyn.n supervisor + production head, maria operator, acct accounting. 2 escalated items per source
   (crm:TP_E1 warning, crm:TP_E2 critical, iss:ISS_E1 critical, iss:ISS_E2 warning, maint:MT_E1 critical, maint:MT_E2 warning,
   task:TSK_E1 critical, task:TSK_E2 warning) + 3 control rows that are not escalated (ISS_C1 0 days, MT_C1 done, TSK_C1 info 1 day).
   The Tablo order-start seeding (+45 s) is neutralised (its lead, touchpoint and a tombstone exist) so it cannot add old tasks mid-case. */
function seed(extra){
  return new Function(`
  window.__hnxEscNoTick=true;
  const D=864e5,now=Date.now(),ago=(d,h)=>now-d*D-(h||0)*36e5;
  const pad=n=>String(n).padStart(2,'0'),ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
  const today=ymd(now),yday=ymd(ago(1));
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true,department:'admin'},
    {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'production',active:true},
    {username:'maria',fullname:'Maria Santos',passwordHash:'x',role:'operator',department:'production',active:true},
    {username:'acct',fullname:'Acct Person',passwordHash:'x',role:'accounting',department:'accounting',departments:['accounting','production'],active:true}]));
  localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({production:'edelyn.n'}));
  sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:now}));
  if(sessionStorage.getItem('escSeeded'))return;sessionStorage.setItem('escSeeded','1');
  const I=(id,module,title,priority,days,x)=>Object.assign({id,module,title,description:'',priority,status:'open',siteId:'site1',facilityId:null,
    createdBy:'system',createdByName:'system',createdAt:ago(days,2),assignedTo:null,assignedToName:null,history:[]},x||{});
  const ISS=[
    I('ISS_E1','production','Leaking end cups on tables 3–5 (GH4)','critical',3,{facilityId:'GH4',createdBy:'edelyn.n',createdByName:'Edelyn Rose Nicolas',assignedTo:'edelyn.n',assignedToName:'Edelyn Rose Nicolas'}),
    I('ISS_E2','packaging','Label printer smudging the batch codes','warning',4,{status:'in_progress',createdBy:'maria',createdByName:'Maria Santos',assignedTo:'maria',assignedToName:'Maria Santos'}),
    I('ISS_C1','production','Seedlings not moved (GH8)','warning',0,{createdBy:'edelyn.n',createdByName:'Edelyn Rose Nicolas'}),
    I('ISS_C2','production','Leak GH1 fixed','critical',8,{status:'resolved',resolvedAt:ago(1)})];
  const MT=(id,title,priority,days,status)=>({id,title,priority,status:status||'not_started',team:'Maintenance',createdBy:'eyal',createdAt:ago(days),location:'GH3',remarks:'',history:[],gantt:[]});
  const MTS=[MT('MT_E1','Flange gasket leak at the GH3 overhead tank','urgent',3),MT('MT_E2','Replace the torn side plastic GH9','priority',5,'ongoing'),MT('MT_C1','Fix the door hinge','need',20,'done')];
  let LEADS=[{id:'L_E1',name:'Cafe Uno',company:'Cafe Uno',stage:'contacted',owner:'maria',createdAt:ago(20)},
    {id:'L_E2',name:'Resto Grill',company:'Resto Grill',stage:'new',owner:'edelyn.n',createdAt:ago(30)},
    {id:'L_TABLO',name:'Tablo Group',company:'Tablo Group',stage:'won',owner:'edelyn.n',createdAt:ago(30)}];
  let TOUCH=[{id:'TP_E1',leadId:'L_E1',type:'call',direction:'out',date:ymd(ago(10)),by:'maria',subject:'Intro call',nextAction:'Send the price list and samples',nextDue:ymd(ago(3))},
    {id:'TP_E2',leadId:'L_E2',type:'visit',direction:'out',date:ymd(ago(20)),by:'edelyn.n',subject:'Walk-in',nextAction:'Follow-up visit with the chef',nextDue:ymd(ago(10))},
    {id:'TP_TABLO2610_PLAN',leadId:'L_TABLO',type:'note',direction:'out',date:ymd(ago(7)),by:'edelyn.n',subject:'plan',nextAction:'GO / NO-GO',nextDue:ymd(ago(5)),nextActionDone:true}];
  const TK=(id,title,priority,owner,days,x)=>Object.assign({id,title,outcome:'',module:'production',type:'other',priority,owner,createdBy:'eyal',createdAt:ago(days),updatedAt:ago(days),
    status:'todo',start:'',due:yday,dueTime:'',dueOriginal:yday,parentId:null,required:true,rule:'simple',reviewer:'',visibility:'team',sharedWith:[],links:[],blocks:[],evidence:[],history:[],seriesId:null,nominal:null,effort:'',mandatory:true,edited:false},x||{});
  const TASKS=[TK('TSK_E1','Re-label the cold room shelves','critical','maria',3,{criticalReason:'Wrong labels on the cold room shelves'}),
    TK('TSK_E2','Update the GH7 seedling plan','high','edelyn.n',4,{status:'doing'}),
    TK('TSK_C1','Order gloves for the packing team','normal','maria',1,{due:ymd(ago(-3)),dueOriginal:ymd(ago(-3))})];
  let ESC=[];
  localStorage.setItem('hydroPro_optomb',JSON.stringify({hydroPro_tasks_v1:{TP_TABLO2610_PLAN:now}}));
  ${extra||''}
  localStorage.setItem('hydroPro_issues_v2',JSON.stringify(ISS));
  localStorage.setItem('hydroPro_maint_tasks',JSON.stringify(MTS));
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify(LEADS));
  localStorage.setItem('hydroPro_crm_touchpoints',JSON.stringify(TOUCH));
  localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(TASKS));
  if(ESC.length)localStorage.setItem('hydroPro_esc_actions_v1',JSON.stringify(ESC));
  `);
}
/* in-page helpers (each case) */
const AS=`const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  const TOASTS=[];window.showToast=(m)=>{TOASTS.push(String(m));};window.confirm=()=>true;
  const ttCount=()=>_tt_collectAll().filter(i=>_tt_needsEscalation(i)).length;
  const H=()=>document.getElementById('taskEscalationBody');
  const chips=()=>{const o={};[...H().querySelectorAll('#hnxEscChips button')].forEach(b=>o[b.getAttribute('data-f')]=+b.querySelector('b').textContent);return o;};
  const kpi=()=>{const o={};[...H().querySelectorAll('#hnxEscKpi .pay-stat')].forEach(b=>o[b.getAttribute('data-k')]=+b.querySelector('.pay-stat-val').textContent);return o;};
  const rows=()=>[...H().querySelectorAll('.hnx-esc-row')];
  const row=id=>H().querySelector('.hnx-esc-row[data-id="'+id+'"]');
  const pad2=n=>String(n).padStart(2,'0'),ymd2=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
  const day=n=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()+n);return ymd2(d);};
  const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmt=s=>{const d=new Date(s+'T00:00:00');return DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()];};
  const item=id=>_tt_collectAll().find(i=>i.id===id);
  const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
  const escTasks=()=>HNXTASKS.load().filter(t=>(t.links||[]).some(l=>l.type==='escalation'));
  const csTile=()=>{renderCriticalSummary();const t=[...document.querySelectorAll('#criticalSummaryBody .pay-stat')].find(x=>/Escalated/.test(x.textContent));return t?+t.querySelector('.pay-stat-val').textContent:null;};
  const open=async()=>{switchView('task_escalation');await sleep(500);hnxEscRender();await sleep(80);};
  await sleep(500);`;
const C3=`['iss:ISS_E2','maint:MT_E2','crm:TP_E1']`;
const NR_NOTE=`'Checked on site — not relevant any more'`;
/* v23.14: + sup2, a supervisor in packaging who is nobody's department head (passes the escalation screen's supervisor rule, has no Tasks
   rights over a task Eyal gave Maria) */
const SUP2=`localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true,department:'admin'},
    {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'production',active:true},
    {username:'maria',fullname:'Maria Santos',passwordHash:'x',role:'operator',department:'production',active:true},
    {username:'sup2',fullname:'Sam Supervisor',passwordHash:'x',role:'supervisor',department:'packaging',active:true},
    {username:'acct',fullname:'Acct Person',passwordHash:'x',role:'accounting',department:'accounting',departments:['accounting','production'],active:true}]));`;

module.exports=[
{ name:'🚨 8 seeded escalated items (4 critical, 4 warning, 2 per source) → chips All open 8 · Needs action 8 · Planned 0 · Overdue 0 · Closed 0; tiles 8/4/4/0; 8 rows each with ACTION, RESPONSIBLE, FOLLOW-UP, NOTE, Save; 0 \'By undefined\'; By responsible = Maria Santos 3 · Edelyn Rose Nicolas 3 · Maintenance 2 (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const k=kpi(),rs=rows();
    const full=rs.filter(r=>r.querySelector('select.hnx-esc-act')&&r.querySelector('select.hnx-esc-who')&&r.querySelector('input.hnx-esc-fu')&&r.querySelector('input.hnx-esc-note')&&r.querySelector('button.hnx-esc-save')).length;
    const who=[...H().querySelectorAll('#hnxEscByWho .hnx-esc-prow')].map(r=>r.querySelector('.who').textContent+' '+r.querySelector('b').textContent).sort();
    const title=(H().querySelector('.section-title')||{}).textContent;
    return {tt:ttCount(),chips:chips(),tiles:[k.total,k.crit,k.warn,k.info],rows:rs.length,full,undef:(H().innerHTML.match(/undefined/g)||[]).length,who,title,
      ids:rs.map(r=>r.getAttribute('data-id')).sort()};})()`),
  expect:{tt:8,chips:{open:8,needs:8,planned:0,overdue:0,closed:0},tiles:[8,4,4,0],rows:8,full:8,undef:0,who:['Edelyn Rose Nicolas 3','Maintenance 2','Maria Santos 3'],
    title:'🚨 Escalation — one decision on every item',ids:['crm:TP_E1','crm:TP_E2','iss:ISS_E1','iss:ISS_E2','maint:MT_E1','maint:MT_E2','task:TSK_E1','task:TSK_E2']} },

{ name:'📋 Options fit the source: every list starts \'Not relevant — close\', \'Already done — close\', has Reassign + Postpone, ends \'Other… (write it)\', ≥ 8 options; ISS_E1 has \'Call technician\'; pool issue ISS_irr_2026-10-13_0700_P6_EC has \'Correct the dose (A / B / acid) and re-measure\'; MT_E1 \'Repair it\'; TP_E1 \'Send the quotation\'; TSK_E1 \'Start it now\'; ISS_E1 responsible list starts with the \'Production head\' group = Edelyn Rose Nicolas, values user: only; defaults 13 Oct 09:00 critical → 2026-10-14, warning → 2026-10-16, info → 2026-10-16, Sat 17 Oct critical → 2026-10-18 (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');
    const L=id=>hnxEscOptions(typeof id==='string'?item(id):id).map(o=>o.label);
    const ids=['iss:ISS_E1','iss:ISS_E2','maint:MT_E1','maint:MT_E2','crm:TP_E1','crm:TP_E2','task:TSK_E1','task:TSK_E2'];
    const all=ids.map(L);
    const shape=all.every(l=>/Not relevant — close/.test(l[0])&&/Already done — close/.test(l[1])&&l.some(x=>/Reassign to…/.test(x))&&l.some(x=>/Postpone to…/.test(x))&&/Other… \\(write it\\)/.test(l[l.length-1]));
    const minN=Math.min.apply(null,all.map(l=>l.length));
    const pool={id:'iss:ISS_irr_2026-10-13_0700_P6_EC',source:'issue',sourceId:'ISS_irr_2026-10-13_0700_P6_EC',module:'irrigation',title:'💧 EC out of range: GH6 (Pool 6)',priority:'warning'};
    const sel=document.createElement('select');sel.innerHTML=hnxEscWhoOptions(item('iss:ISS_E1'));
    const g0=sel.querySelector('optgroup');
    const D=(sev,s)=>hnxEscDefaults(sev,new Date(s)).followUp;
    return {shape,min8:minN>=8,iss1:L('iss:ISS_E1').includes('Call technician'),pool:L(pool).includes('Correct the dose (A / B / acid) and re-measure'),
      mt1:L('maint:MT_E1').includes('Repair it'),tp1:L('crm:TP_E1').includes('Send the quotation'),tsk1:L('task:TSK_E1').includes('Start it now'),
      firstGroup:g0&&g0.label,firstNames:g0?[...g0.querySelectorAll('option')].map(o=>o.textContent.replace(/ \\(.*\\)$/,'')):[],selected:sel.value,
      userOnly:[...sel.options].every(o=>/^user:/.test(o.value)),
      d:[D('critical','2026-10-13T09:00:00'),D('warning','2026-10-13T09:00:00'),D('info','2026-10-13T09:00:00'),D('critical','2026-10-17T09:00:00')]};})()`),
  expect:{shape:true,min8:true,iss1:true,pool:true,mt1:true,tp1:true,tsk1:true,firstGroup:'Production head',firstNames:['Edelyn Rose Nicolas'],selected:'user:edelyn.n',userOnly:true,
    d:['2026-10-14','2026-10-16','2026-10-16','2026-10-18']} },

{ name:'🚫 8 escalated → close 3 as not relevant (ISS_E2, MT_E2, TP_E1) → list 5, Escalated tile 5, Critical 4 / Warning 1, Closed 3; Task Tracker count 5 (was 8); Critical Summary 🚨 Escalated tile 1 (was 2); the CEO import list drops them (3 → 0); after 11 s ISS_E2 still in_progress, MT_E2 still ongoing, TP_E1 not done (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const three=${C3};const ceo=()=>_tt_getTrackedIssues().filter(i=>three.includes(i.id)).length;
    const before={tt:ttCount(),cs:csTile(),ceo:ceo()};
    const r=hnxEscClose(three,'not_relevant',${NR_NOTE});hnxEscRender();
    const k=kpi();
    const after={closed:r.closed,list:rows().length,tile:k.total,crit:k.crit,warn:k.warn,chipClosed:chips().closed,tt:ttCount(),cs:csTile(),ceo:ceo()};
    await sleep(11000);
    const src={iss:loadIssues().find(i=>i.id==='ISS_E2').status,mt:loadMaintTasks().find(t=>t.id==='MT_E2').status,tpDone:!!(_crmLoadTouch().find(t=>t.id==='TP_E1')||{}).nextActionDone};
    return {before,after,src,recs:hnxEscLoad().filter(x=>x.kind==='close'&&x.state==='closed').length};})()`),
  expect:{before:{tt:8,cs:2,ceo:3},after:{closed:3,list:5,tile:5,crit:4,warn:1,chipClosed:3,tt:5,cs:1,ceo:0},src:{iss:'in_progress',mt:'ongoing',tpDone:false},recs:3} },

{ name:'🔁 Still 5 after a reload (drive: close 3 → pg.reload → wait BOOT_MS) and on a second computer: merging A\'s store into an empty B with __hnxMergeGeneric → B lists 5; a Reopen made later on B beats A\'s older close after merging both ways → 6 on both (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  drive:async pg=>{
    const r=await pg.evaluate(`(()=>{sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));return hnxEscClose(${C3},'not_relevant',${NR_NOTE}).closed;})()`);
    await pg.waitForTimeout(800);
    await pg.reload({waitUntil:'domcontentloaded',timeout:180000});
    await pg.waitForTimeout(BOOT_MS);
    return {closedBeforeReload:r};
  },
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const afterReload={list:rows().length,tt:ttCount(),closed:chips().closed};
    const KEY=HNX_ESC_KEY,A=localStorage.getItem(KEY);
    const B=__hnxMergeGeneric(KEY,'',A);localStorage.setItem(KEY,B);hnxEscRender();const bList=rows().length;
    await sleep(60);const re=hnxEscReopen('iss:ISS_E2','The printer smudges again — back on the list');const B2=localStorage.getItem(KEY);
    const A2=__hnxMergeGeneric(KEY,A,B2)||A,B3=__hnxMergeGeneric(KEY,B2,A)||B2;
    localStorage.setItem(KEY,A2);hnxEscRender();const aN=rows().length,aTT=ttCount();
    localStorage.setItem(KEY,B3);hnxEscRender();const bN=rows().length,bTT=ttCount();
    return {afterReload,bList,re,a:[aN,aTT],b:[bN,bTT],state:JSON.parse(A2).find(x=>x.id==='ESCX_iss_ISS_E2').state};})()`),
  expect:{afterReload:{list:5,tt:5,closed:3},bList:5,re:true,a:[6,6],b:[6,6],state:'reopened',drive:{closedBeforeReload:3}} },

{ name:'↩ Undo: close 1 → 7; Undo at +2 s → 8, the record\'s state \'reopened\'; at +12 s the source is unchanged and there is no device-only queue (v23.14: the synced record is the queue); the Undo bar is gone after 10 s (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const r=hnxEscClose(['maint:MT_E2'],'not_relevant','Duplicate of the GH9 plastic job');hnxEscRender();const n1=rows().length;
    const bar=document.getElementById('hnxEscUndo'),barText=bar?bar.textContent:'',barBtn=!!(bar&&bar.querySelector('.hnx-esc-undo-btn'));
    await sleep(2000);
    document.querySelector('#hnxEscUndo .hnx-esc-undo-btn').click();await sleep(150);hnxEscRender();const n2=rows().length;
    const undone=(document.getElementById('hnxEscUndo')||{}).textContent||'';
    const state=hnxEscLoad().find(x=>x.id==='ESCX_maint_MT_E2').state;
    await sleep(10000);
    return {n1,barText:/🚫 1 closed as not relevant\\./.test(barText),barBtn,n2,undone:/Undone — back on the list/.test(undone),state,
      mt:loadMaintTasks().find(t=>t.id==='MT_E2').status,pending:localStorage.getItem('hnxlocal_esc_pending_v1'),barGone:!document.getElementById('hnxEscUndo'),tt:ttCount()};})()`),
  expect:{n1:7,barText:true,barBtn:true,n2:8,undone:true,state:'reopened',mt:'ongoing',pending:null,barGone:true,tt:8} },

{ name:'✅ Already done is deferred 10 s: MT_E1 (critical) as eyal with \'Replaced the flange gasket, no leak\' → 7 at once, MT_E1 not_started at +1 s, done (doneBy eyal) at +11 s, srcState \'applied\'; as maria, ISS_E2 (her own warning) with \'Reprinted the labels with a new ribbon\' → resolved at +11 s; Already done then Undo at +2 s on MT_E2 → still ongoing at +12 s (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const r1=hnxEscClose(['maint:MT_E1'],'done','Replaced the flange gasket, no leak');hnxEscRender();const n1=rows().length;
    await sleep(1000);const s1=loadMaintTasks().find(t=>t.id==='MT_E1').status;
    await sleep(10500);const mt=loadMaintTasks().find(t=>t.id==='MT_E1'),rec=hnxEscLoad().find(x=>x.id==='ESCX_maint_MT_E1');
    as('maria');const r2=hnxEscClose(['iss:ISS_E2'],'done','Reprinted the labels with a new ribbon');
    await sleep(11000);const iss=loadIssues().find(i=>i.id==='ISS_E2');
    as('eyal');const r3=hnxEscClose(['maint:MT_E2'],'done','Plastic replaced on the whole run');await sleep(2000);const u=hnxEscUndo(r3.token);
    await sleep(10500);
    return {c1:r1.closed,n1,s1,s2:mt.status,doneBy:mt.doneBy,src:rec.srcState,state:rec.state,c2:r2.closed,iss:iss.status,c3:r3.closed,u,mt2:loadMaintTasks().find(t=>t.id==='MT_E2').status};})()`),
  expect:{c1:1,n1:7,s1:'not_started',s2:'done',doneBy:'eyal',src:'applied',state:'closed',c2:1,iss:'resolved',c3:1,u:1,mt2:'ongoing'} },

{ name:'📌 Plan on TP_E2 (critical) → Maria, follow-up tomorrow → Planned 1 · Needs action 7 · total 8; ONE task (owner maria, due tomorrow, priority critical, rule evidence, module crm, link escalation:ESC_crm_TP_E2); the task is not an escalated item (task: items stay 2); ONE inbox note ESCA_ESC_crm_TP_E2_maria_<assignedAt> with text (v23.14: one note per assignment); the row reads Maria Santos + the date + Eyal Ben Ari; save again with a new note → 1 task, 1 note; reassign to edelyn.n → the same task\'s owner is edelyn.n, 2 notes (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const fu=day(1);
    const r=hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:fu,note:'Call the chef before Friday'});hnxEscRender();
    const c=chips(),T1=escTasks(),t=T1[0]||{};
    const taskItems=_tt_collectAll().filter(i=>/^task:/.test(i.id)&&_tt_needsEscalation(i)).length,inCollector=_tt_collectAll().some(i=>i.id==='task:'+t.id);
    const ib=inbox().filter(x=>/^ESCA_/.test(x.id)),n0=ib[0]||{};
    const line=(row('crm:TP_E2').querySelector('.hnx-esc-plan')||{}).textContent||'';
    hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:fu,note:'The chef is back on Thursday'});
    const tasks2=escTasks().length,ib2=inbox().filter(x=>/^ESCA_/.test(x.id)).length,note2=hnxEscLoad().find(x=>x.id==='ESC_crm_TP_E2').note;
    const r3=hnxEscSave('crm:TP_E2',{action:'reassign',who:'user:edelyn.n',followUp:fu});
    const T3=escTasks();
    return {saved:r&&r.id,planned:c.planned,needs:c.needs,open:c.open,tasks:T1.length,owner:t.owner,due:t.due===fu,prio:t.priority,rule:t.rule,module:t.module,
      link:(t.links||[]).map(l=>l.type+':'+l.id).join(','),inCollector,taskItems,ib:ib.length,ibId:/^ESCA_ESC_crm_TP_E2_maria_\\d+$/.test(n0.id||''),ibUser:n0.user,ibText:/Call \\/ visit the customer · follow-up /.test(n0.text||'')&&/Eyal Ben Ari/.test(n0.text||''),
      line:/Maria Santos/.test(line)&&line.includes(fmt(fu))&&/Eyal Ben Ari/.test(line),tasks2,ib2,note2,reassigned:!!r3,tasks3:T3.length,owner3:(T3[0]||{}).owner,sameTask:(T3[0]||{}).id===t.id,
      ib3:inbox().filter(x=>/^ESCA_/.test(x.id)).length,action3:hnxEscLoad().find(x=>x.id==='ESC_crm_TP_E2').actionText};})()`),
  expect:{saved:'ESC_crm_TP_E2',planned:1,needs:7,open:8,tasks:1,owner:'maria',due:true,prio:'critical',rule:'evidence',module:'crm',link:'escalation:ESC_crm_TP_E2',inCollector:false,taskItems:2,
    ib:1,ibId:true,ibUser:'maria',ibText:true,line:true,tasks2:1,ib2:1,note2:'The chef is back on Thursday',reassigned:true,tasks3:1,owner3:'edelyn.n',sameTask:true,ib3:2,action3:'Call / visit the customer'} },

{ name:'✅ Task items change the task itself: Postpone TSK_E2 to today+5 → due today+5, dueOriginal kept (yesterday), still 3 tasks in the store, taskOwn true; Reassign TSK_E1 maria → edelyn.n as eyal → owner edelyn.n; as maria (not the creator) Reassign is refused (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const n0=HNXTASKS.load().length;
    const r=hnxEscSave('task:TSK_E2',{action:'postpone',who:'user:edelyn.n',followUp:day(5),note:'Waiting for the seed delivery'});
    const t2=HNXTASKS.load().find(t=>t.id==='TSK_E2');
    as('maria');const m=hnxEscSave('task:TSK_E1',{action:'reassign',who:'user:edelyn.n',followUp:day(1)});const ownerAfterMaria=HNXTASKS.load().find(t=>t.id==='TSK_E1').owner;
    as('eyal');const e=hnxEscSave('task:TSK_E1',{action:'reassign',who:'user:edelyn.n',followUp:day(1),note:'Edelyn takes it over'});
    const t1=HNXTASKS.load().find(t=>t.id==='TSK_E1');
    return {n0,saved:!!r,due:t2.due===day(5),dueOriginal:t2.dueOriginal===day(-1),n1:HNXTASKS.load().length,taskOwn:r&&r.taskOwn,taskId:r&&r.taskId,
      maria:m,ownerAfterMaria,eyal:!!e,owner:t1.owner,n2:HNXTASKS.load().length,escTasks:escTasks().length};})()`),
  expect:{n0:3,saved:true,due:true,dueOriginal:true,n1:3,taskOwn:true,taskId:'TSK_E2',maria:false,ownerAfterMaria:'maria',eyal:true,owner:'edelyn.n',n2:3,escTasks:0} },

{ name:'⏰ Overdue + reminders. Seed: a plan on ISS_E2, follow-up 2 days ago, task TSK_F1 owned by maria with link escalation. → Overdue 1, row \'OVERDUE 2 days\'; as maria hnxEscRemind(today 09:00) → 1 digest ESCD_maria_<today> listing ISS_E2, toast 1; again → 1 digest, toast 0; at 06:30 → 0; tomorrow 09:00 → 2 digests; as eyal → 0 for maria; two computers\' inboxes merged → 1 note for the day; TSK_F1 done → the day after tomorrow still 2 and the row back to Needs action with \'follow-up done by Maria Santos\' (v23.04)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`const F=ymd(ago(2));
    TASKS.push(TK('TSK_F1','🚨 Packaging · Label printer smudging the batch codes — Fix now on site','high','maria',3,{module:'packaging',type:'follow-up',due:F,dueOriginal:F,
      links:[{type:'escalation',id:'ESC_iss_ISS_E2',label:'🚨 Escalation · Label printer smudging the batch codes'}]}));
    ESC.push({id:'ESC_iss_ISS_E2',kind:'plan',itemId:'iss:ISS_E2',source:'issue',sourceId:'ISS_E2',module:'packaging',dept:'packaging',severity:'warning',
      title:'Label printer smudging the batch codes',fp:'issue|packaging|label printer smudging the batch codes',action:'fix_now',actionText:'Fix now on site',
      whoUser:'maria',whoName:'Maria Santos',followUp:F,note:'New ribbon first',taskId:'TSK_F1',taskOwn:false,assignedBy:'eyal',assignedAt:ago(3),log:[],
      createdBy:'eyal',createdAt:ago(3),updatedBy:'eyal',updatedAt:ago(3),_fts:{}});`),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const c=chips(),line=(row('iss:ISS_E2').querySelector('.hnx-esc-plan')||{}).textContent||'';
    const at=(d,hm)=>new Date(d+'T'+hm+':00');const dg=()=>inbox().filter(x=>/^ESCD_maria_/.test(x.id));
    as('maria');
    const r1=hnxEscRemind(at(today,'09:00'));const d1=dg(),first=d1[0]||{};
    const r2=hnxEscRemind(at(today,'09:00'));const d2=dg().length;
    const r3=hnxEscRemind(at(day(1),'06:30'));
    const r4=hnxEscRemind(at(day(1),'09:00'));const d4=dg().length;
    as('eyal');const r5=hnxEscRemind(at(day(1),'10:00'),'maria');
    const A=localStorage.getItem('hydroPro_pa_inbox_v1'),mine=JSON.parse(A).find(x=>x.id==='ESCD_maria_'+today);
    const Bx=JSON.stringify([Object.assign({},mine,{at:mine.at+5000})]);const M=__hnxMergeGeneric('hydroPro_pa_inbox_v1',A,Bx)||A;
    const merged=JSON.parse(M).filter(x=>x.id==='ESCD_maria_'+today).length;
    as('maria');const done=HNXTASKS.setStatus('TSK_F1','done');
    const r6=hnxEscRemind(at(day(2),'09:00'));const d6=dg().length;
    as('eyal');hnxEscRender();const line2=(row('iss:ISS_E2').querySelector('.hnx-esc-plan')||{}).textContent||'';
    return {overdue:c.overdue,row:/OVERDUE 2 days/.test(line),r1,d1:d1.length,firstId:first.id==='ESCD_maria_'+today,lists:/Label printer smudging the batch codes — Fix now on site · follow-up .* \\(2 days late\\)/.test(first.text||''),
      title:first.title,r2,d2,r3,r4,d4,r5,merged,done,r6,d6,back:/Follow-up done by Maria Santos/i.test(line2),state:hnxEscState('iss:ISS_E2').code};})()`),
  expect:{overdue:1,row:true,r1:{digests:1,toast:1},d1:1,firstId:true,lists:true,title:'⏰ 1 escalated follow-up overdue',r2:{digests:0,toast:0},d2:1,r3:{digests:0,toast:0},
    r4:{digests:1,toast:1},d4:2,r5:{digests:0,toast:0},merged:1,done:true,r6:{digests:0,toast:0},d6:2,back:true,state:'needs'} },

{ name:'🔒 Permissions: maria (operator) cannot plan ISS_E1 (false) and cannot close her own ISS_E2 as not relevant (0 closed); maria can close ISS_E2 as Already done (1); edelyn.n (supervisor, head) cannot close critical ISS_E1 with a 9-character note, and can with \'Duplicate of ISS_E9, handled there\'; acct (accounting) sees 8 read-only rows with 🔒 (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}
    as('acct');await open();const ar=rows();const acctRows=ar.length,acctLocked=ar.filter(r=>r.querySelector('.hnx-esc-lock')&&/🔒/.test(r.querySelector('.hnx-esc-lock').textContent)&&!r.querySelector('.hnx-esc-save')).length;
    as('maria');const p1=hnxEscSave('iss:ISS_E1',{action:'call_tech',who:'user:maria',followUp:day(1)});
    const c1=hnxEscClose(['iss:ISS_E2'],'not_relevant','Not my printer, wrong area').closed;
    const c2=hnxEscClose(['iss:ISS_E2'],'done','Reprinted the labels with a new ribbon').closed;
    as('edelyn.n');const c3=hnxEscClose(['iss:ISS_E1'],'not_relevant','duplicate');
    const c4=hnxEscClose(['iss:ISS_E1'],'not_relevant','Duplicate of ISS_E9, handled there').closed;
    await sleep(11000);
    return {acctRows,acctLocked,p1,c1,c2,c3:c3.closed,c3why:(c3.skipped[0]||{}).why,c4,tt:ttCount()};})()`),
  expect:{acctRows:8,acctLocked:8,p1:false,c1:0,c2:1,c3:0,c3why:'⛔ A critical needs at least 15 characters: why it is not relevant',c4:1,tt:6} },

{ name:'🧹 Bulk: +20 info issues 6 days old → 28 (4/4/20); select the 20 info → Not relevant \'old auto alerts\' → 8 left, Closed 20, one Undo → 28, again → 8; ↩ Reopen the 20 → 28; bulk plan 3 rows to maria → 3 tasks, 1 note ESCA_B…_maria listing 3; bulk Already done on 22 rows → 20 closed, 2 skipped (max 20) (v23.04)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`for(let i=1;i<=20;i++)ISS.push(I('ISS_B'+pad(i),'hr','Memo 2026-0'+(40+i)+' not signed by the team','info',6));`),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const k0=kpi(),start=[k0.total,k0.crit,k0.warn,k0.info];
    const info=_tt_collectAll().filter(i=>_tt_needsEscalation(i)&&i.priority==='info').map(i=>i.id);
    info.forEach(id=>{const c=row(id)&&row(id).querySelector('.hnx-esc-chk');if(c)c.click();});
    const bar=document.getElementById('hnxEscBulk'),barShown=bar&&bar.style.display!=='none',barN=bar&&bar.querySelector('.hnx-esc-bn').textContent;
    const ba=bar.querySelector('.hnx-esc-bact');ba.value='not_relevant';ba.dispatchEvent(new Event('change',{bubbles:true}));
    bar.querySelector('.hnx-esc-bnote').value='old auto alerts';bar.querySelector('.hnx-esc-bapply').click();await sleep(150);
    const left1=rows().length,closed1=chips().closed;
    document.querySelector('#hnxEscUndo .hnx-esc-undo-btn').click();await sleep(150);hnxEscRender();const back=rows().length;
    const again=hnxEscBulk(info,{action:'not_relevant',note:'old auto alerts'});hnxEscRender();const left2=rows().length;
    info.forEach(id=>hnxEscReopen(id,'test: back on the list'));hnxEscRender();const reopened=rows().length;
    const pl=hnxEscBulk(info.slice(0,3),{action:'g_monitor',who:'user:maria',followUp:day(3)});
    const notes=inbox().filter(x=>/^ESCA_B\\d+_maria$/.test(x.id)),nt=notes[0]||{};
    const dn=hnxEscBulk(info.concat(['iss:ISS_E2','maint:MT_E2']),{action:'already_done',note:'Signed on the board'});
    return {start,info:info.length,barShown,barN,left1,closed1,back,again:again.ok,left2,reopened,planned:pl.ok,tasks:escTasks().length,taskOwners:escTasks().map(t=>t.owner).join(','),
      notes:notes.length,lines:(String(nt.text||'').match(/^• /gm)||[]).length,noteTitle:nt.title,doneOk:dn.ok,doneSkipped:dn.skipped.length,why:(dn.skipped[0]||{}).why};})()`),
  expect:{start:[28,4,4,20],info:20,barShown:true,barN:'20',left1:8,closed1:20,back:28,again:20,left2:8,reopened:28,planned:3,tasks:3,taskOwners:'maria,maria,maria',
    notes:1,lines:3,noteTitle:'🚨 3 escalated items assigned to you',doneOk:20,doneSkipped:2,why:'Already done works on up to 20 rows at a time'} },

{ name:'↺ Repeat: yesterday\'s pool alarm ISS_irr_<yday>_0700_P6_EC closed as not relevant → today\'s ISS_irr_<today>_0700_P6_EC stays on the list (not hidden), with \'↺ Repeat\' and the action pre-set to not_relevant (v23.04)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`ISS.push(I('ISS_irr_'+yday+'_0700_P6_EC','irrigation','💧 EC out of range: GH6 (Pool 6)','warning',3));ISS.push(I('ISS_irr_'+today+'_0700_P6_EC','irrigation','💧 EC out of range: GH6 (Pool 6)','warning',3));`),
  run:new Function(`return (async()=>{${AS}as('eyal');
    const y='iss:ISS_irr_'+day(-1)+'_0700_P6_EC',t='iss:ISS_irr_'+today+'_0700_P6_EC';
    const before=ttCount();
    const r=hnxEscClose([y],'not_relevant','Probe was out of the water — reading wrong');await open();
    const rw=row(t),st=hnxEscState(t);
    return {before,closed:r.closed,after:ttCount(),onList:!!rw,yGone:!row(y),rep:!!rw&&/↺ Repeat/.test(rw.textContent),act:rw&&rw.querySelector('.hnx-esc-act').value,
      repeatOf:!!st.repeatOf&&st.repeatOf.itemId===y,line:!!rw&&/closed as not relevant on .* by Eyal Ben Ari/.test(rw.querySelector('.hnx-esc-plan').textContent)};})()`),
  expect:{before:10,closed:1,after:9,onList:true,yGone:true,rep:true,act:'not_relevant',repeatOf:true,line:true} },

{ name:'⚡ 300 info issues → paints in ≤ 1500 ms, 50 rows drawn, \'Show 50 more (250 left)\', no page error (v23.04)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`ISS.length=0;MTS.length=0;TASKS.length=0;TOUCH=TOUCH.filter(t=>t.id==='TP_TABLO2610_PLAN');
    for(let i=1;i<=300;i++)ISS.push(I('ISS_P'+String(i).padStart(3,'0'),['hr','security','inventory','quality','production','it'][i%6],'Old reminder number '+i+' from the auto checks','info',6+(i%20)));`),
  run:new Function(`return (async()=>{${AS}as('eyal');switchView('task_escalation');await sleep(500);
    const t0=performance.now();hnxEscRender();const ms=Math.round(performance.now()-t0);
    const more=(H().querySelector('.hnx-esc-more')||{}).textContent;
    return {fast:ms<=1500,ms:ms<=1500?'ok':ms,rows:rows().length,more,chips:chips()};})()`),
  expect:{fast:true,ms:'ok',rows:50,more:'Show 50 more (250 left)',chips:{open:300,needs:300,planned:0,overdue:0,closed:0}} },

{ name:'🔗 HNXTASKS.go(\'escalation:ESC_crm_TP_E2\') opens the task_escalation view and outlines the TP_E2 row (v23.04)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');
    const r=hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:day(1)});const link=(escTasks()[0].links||[])[0];
    switchView('dashboard');await sleep(400);
    HNXTASKS.go(link.type+':'+link.id);await sleep(400);
    const active=(document.querySelector('.view.active')||{}).id,rw=row('crm:TP_E2');
    const outlined=!!rw&&rw.classList.contains('hnx-esc-focus');
    await sleep(1800);
    return {saved:!!r,link:link.type+':'+link.id,active,outlined,cleared:!!rw&&!rw.classList.contains('hnx-esc-focus')};})()`),
  expect:{saved:true,link:'escalation:ESC_crm_TP_E2',active:'view-task_escalation',outlined:true,cleared:true} },

{ name:'🆘 Guide: m_overview has \'🚨 Escalation — one decision on every item (v23.04)\' and no longer says \'Nothing here is fixed from here\'; module_calendar has \'Tasks that come from 🚨 Escalation (v23.04)\' (v23.04); v23.14: \'When an item comes back, and what happens to its task (v23.14)\', the 🔁 Duplicate close and the task\'s ↗ Open on 🚨 Escalation are described',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}
    const g=HNX_HELP_GUIDES.find(x=>x.id==='m_overview'),txt=JSON.stringify(g),cal=HNX_HELP_GUIDES.find(x=>x.id==='module_calendar'),tk=JSON.stringify(HNX_HELP_GUIDES.find(x=>x.id==='tasks')||{});
    const heads=g.sections.map(s=>s.h);
    let opened=false;try{HNX_HELP.open('m_overview');await sleep(300);opened=/one decision on every item/.test((document.getElementById('hnxhOv')||{}).textContent||'');HNX_HELP.close();}catch(e){opened='threw '+e.message;}
    return {has:heads.includes('🚨 Escalation — one decision on every item (v23.04)'),closing:heads.includes('Closing what is not relevant'),plans:heads.includes('Plans, follow-ups and reminders'),
      bulk:heads.includes('Filters, counts and many rows at once'),noOld:!/Nothing here is fixed from here/.test(txt),cal:cal.sections.some(s=>s.h==='Tasks that come from 🚨 Escalation (v23.04)'),
      tasks:/Tasks created from 🚨 Escalation are not listed again as escalated items/.test(tk),opened,
      back:heads.includes('When an item comes back, and what happens to its task (v23.14)'),dup:/🔁 Duplicate of … — close/.test(txt),link:/↗ Open on 🚨 Escalation in the task/.test(JSON.stringify(cal))};})()`),
  expect:{has:true,closing:true,plans:true,bulk:true,noOld:true,cal:true,tasks:true,opened:true,back:true,dup:true,link:true} },

/* ================= v23.14 — review of v23.04: every confirmed finding has a case (expected numbers in the names) ================= */
{ name:'🛡 Data Safety (v23.14): bulk Not relevant on 40 info issues → the store at +11.5 s IS the copy the 4-second push uploaded (0 rewritten, uploaded); ↩ Reopen the 40, close again, ↩ Undo at +4.5 s → 40 changed, 40 forward, not big, uploaded; Already done on 20 → at +11.5 s 20 changed, 20 forward, not big, uploaded, 20 resolved (v23.04: 40 of 40 rewritten → HELD)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`for(let i=1;i<=40;i++)ISS.push(I('ISS_B'+pad(i),'hr','Memo 2026-0'+(40+i)+' not signed by the team','info',6));`),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const K=HNX_ESC_KEY;window.__hnxCloudRaw=window.__hnxCloudRaw||{};const keep=window.__hnxCloudRaw[K];
    const gate=(C,L)=>{const st=__hnxDsStats(C,L,K,true);window.__hnxCloudRaw[K]=C;let up=null;try{up=(K in __hnxPushGuard({[K]:L}));}catch(e){up='threw '+e.message;}return {changed:st.changed,fwd:st.fwd,removed:st.removed,big:__hnxDsIsBig(st),up};};
    const ids=_tt_collectAll().filter(i=>_tt_needsEscalation(i)&&i.priority==='info').map(i=>i.id);
    const r1=hnxEscBulk(ids,{action:'not_relevant',note:'old auto alerts'});await sleep(4500);const C1=localStorage.getItem(K);await sleep(7000);const L1=localStorage.getItem(K);
    const g1=gate(C1,L1);
    let re=0;ids.forEach(id=>{if(hnxEscReopen(id,'test: back on the list'))re++;});
    const r2=hnxEscBulk(ids,{action:'not_relevant',note:'old auto alerts again'});await sleep(4500);const C2=localStorage.getItem(K);
    const u=hnxEscUndo(r2.token);const L2=localStorage.getItem(K);const g2=gate(C2,L2);
    const r3=hnxEscBulk(ids.slice(0,20),{action:'already_done',note:'Signed on the board'});await sleep(4500);const C3=localStorage.getItem(K);await sleep(7000);const L3=localStorage.getItem(K);
    const g3=gate(C3,L3);
    window.__hnxCloudRaw[K]=keep;
    const resolved=loadIssues().filter(i=>/^ISS_B/.test(i.id)&&i.status==='resolved').length;
    return {n:ids.length,ok1:r1.ok,same1:C1===L1,up1:g1.up,re,ok2:r2.ok,u,g2,ok3:r3.ok,g3,resolved};})()`),
  expect:{n:40,ok1:40,same1:true,up1:true,re:40,ok2:40,u:40,g2:{changed:40,fwd:40,removed:0,big:false,up:true},ok3:20,g3:{changed:20,fwd:20,removed:0,big:false,up:true},resolved:20} },

{ name:'↺ Back when its module opens it again (v23.14): Already done on ISS_E2, TSK_E2, MT_E2 → resolved / done / done, Task Tracker 5; a computer whose issue copy is still the old open one (and never saw it closed) keeps it hidden (5, closed); the approver rejects ISS_E2, TSK_E2 is set back to To do, MT_E2 back to ongoing on the board → Task Tracker 8, all 3 rows back, state needs; the sweep flips the 3 closes to reopened "Reopened in Packaging / Maintenance / Production"; ✅ Closed 0',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const ISSK='hydroPro_issues_v2',SEEN='hnxlocal_esc_seen_v1',oldIss=localStorage.getItem(ISSK),K3=['iss:ISS_E2','task:TSK_E2','maint:MT_E2'];
    const c=hnxEscClose(K3,'done','Fixed on site — confirmed with photos');
    await sleep(11000);
    const src1=[loadIssues().find(i=>i.id==='ISS_E2').status,HNXTASKS.load().find(t=>t.id==='TSK_E2').status,loadMaintTasks().find(t=>t.id==='MT_E2').status];
    const tt1=ttCount();
    const cur=localStorage.getItem(ISSK),seen=localStorage.getItem(SEEN);
    localStorage.setItem(ISSK,oldIss);localStorage.removeItem(SEEN);await sleep(400);
    const lag=ttCount(),lagState=hnxEscState('iss:ISS_E2').code;
    localStorage.setItem(ISSK,cur);if(seen!=null)localStorage.setItem(SEEN,seen);await sleep(400);
    const rj=hnxRejectIssue('ISS_E2','Still smudging — not fixed','eyal');
    const st=HNXTASKS.setStatus('TSK_E2','todo',{reason:'Plan not shared yet'});
    const M=loadMaintTasks();M.find(t=>t.id==='MT_E2').status='ongoing';saveMaintTasks(M);
    await sleep(400);hnxEscRender();
    const tt2=ttCount(),onList=K3.map(k=>!!row(k)),states=K3.map(k=>hnxEscState(k).code);
    const sw=hnxEscSweep();
    const recs=hnxEscLoad().filter(r=>r.kind==='close').map(r=>[r.itemId,r.state,r.reopenWhy]).sort();
    hnxEscFilter('closed');const closedRows=rows().length;hnxEscFilter('open');
    return {closed:c.closed,src1,tt1,lag,lagState,rj:rj.ok,st,tt2,onList,states,sw:sw.reopened,recs,closedRows,tt3:ttCount()};})()`),
  expect:{closed:3,src1:['resolved','done','done'],tt1:5,lag:5,lagState:'closed',rj:true,st:true,tt2:8,onList:[true,true,true],states:['needs','needs','needs'],sw:3,
    recs:[['iss:ISS_E2','reopened','Reopened in Packaging'],['maint:MT_E2','reopened','Reopened in Maintenance'],['task:TSK_E2','reopened','Reopened in Production']],closedRows:0,tt3:8} },

{ name:'👥 A supervisor without rights over the follow-up task (v23.14): sup2 re-plans Eyal\'s TP_E2 plan (Maria) to Edelyn → refused "The follow-up task was given by Eyal Ben Ari…", plan and task stay Maria, Edelyn 0 notes; sup2 closes TP_E2 (Not relevant) and MT_E2 (Already done) → MT_E2 done, 0 "Not allowed" toasts, both tasks still To do at +11.5 s, Maria and Eyal 1 note per task (4); Eyal\'s session 3 min later → TP_E2 task Cancelled, MT_E2 task Done with "Closed on 🚨 Escalation as already done by Sam Supervisor…"',
  requires:REQ,tz:'Asia/Manila',seed:seed(SUP2),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const p1=hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:day(1),note:'Call the chef'});
    const p2=hnxEscSave('maint:MT_E2',{action:'m_repair',who:'user:maria',followUp:day(3)});
    as('sup2');
    const rp=hnxEscSave('crm:TP_E2',{action:'reassign',who:'user:edelyn.n',followUp:day(2)});const why=TOASTS[TOASTS.length-1];
    const plan=hnxEscLoad().find(r=>r.id==='ESC_crm_TP_E2'),tk=HNXTASKS.load().find(t=>t.id===p1.taskId);
    const edNotes=inbox().filter(x=>x.user==='edelyn.n'&&/^ESCA_/.test(x.id)).length;
    const c1=hnxEscClose(['crm:TP_E2'],'not_relevant','Customer closed the restaurant for good');
    const c2=hnxEscClose(['maint:MT_E2'],'done','Plastic replaced on the whole run');
    await sleep(11500);
    const t1=HNXTASKS.load().find(t=>t.id===p1.taskId),t2=HNXTASKS.load().find(t=>t.id===p2.taskId);
    const notAllowed=TOASTS.filter(t=>/Not allowed/.test(t)).length,notes=inbox().filter(x=>/^ESCN_/.test(x.id)).map(x=>x.user).sort();
    as('eyal');const sw=hnxEscSweep({now:Date.now()+180000});
    const a1=HNXTASKS.load().find(t=>t.id===p1.taskId),a2=HNXTASKS.load().find(t=>t.id===p2.taskId);
    return {rp,why:/The follow-up task was given by Eyal Ben Ari/.test(why||''),planWho:plan.whoUser,taskOwner:tk.owner,edNotes,c1:c1.closed,c2:c2.closed,mt:loadMaintTasks().find(t=>t.id==='MT_E2').status,
      before:[t1.status,t2.status],notAllowed,notes,swTasks:sw.tasks,after:[a1.status,a2.status],ev:/Closed on 🚨 Escalation as already done by Sam Supervisor/.test(JSON.stringify(a2.evidence||[]))};})()`),
  expect:{rp:false,why:true,planWho:'maria',taskOwner:'maria',edNotes:0,c1:1,c2:1,mt:'done',before:['todo','todo'],notAllowed:0,notes:['eyal','eyal','maria','maria'],swTasks:2,after:['cancelled','done'],ev:true} },

{ name:'🔧 Fixed in its module (v23.14): plans on MT_E2 and ISS_E1 → Maria; MT_E2 marked done on the Maintenance board, ISS_E1 only lowered to info → the sweep marks 1 task Done (MT_E2: evidence "Closed in Maintenance — the escalated item is fixed", logged on the plan); ISS_E1\'s task stays To do; after 8 saves the plan log keeps 6',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const p1=hnxEscSave('maint:MT_E2',{action:'m_repair',who:'user:maria',followUp:day(1)});
    const p2=hnxEscSave('iss:ISS_E1',{action:'call_tech',who:'user:maria',followUp:day(1)});
    for(let i=0;i<7;i++)hnxEscSave('iss:ISS_E1',{action:'call_tech',who:'user:maria',followUp:day(1),note:'note '+i});
    const M=loadMaintTasks();M.find(t=>t.id==='MT_E2').status='done';saveMaintTasks(M);
    const IS=JSON.parse(localStorage.getItem('hydroPro_issues_v2'));IS.find(i=>i.id==='ISS_E1').priority='info';localStorage.setItem('hydroPro_issues_v2',JSON.stringify(IS));
    await sleep(400);
    const sw=hnxEscSweep();
    const t1=HNXTASKS.load().find(t=>t.id===p1.taskId),t2=HNXTASKS.load().find(t=>t.id===p2.taskId);
    const pl=hnxEscLoad().find(r=>r.id==='ESC_maint_MT_E2'),pl2=hnxEscLoad().find(r=>r.id==='ESC_iss_ISS_E1');
    return {tasks:sw.tasks,t1:t1.status,ev:(t1.evidence||[]).map(e=>e.note),t2:t2.status,log:/Follow-up task done — Closed in Maintenance/.test(JSON.stringify(pl.log)),logN:pl2.log.length};})()`),
  expect:{tasks:1,t1:'done',ev:['Closed in Maintenance — the escalated item is fixed'],t2:'todo',log:true,logN:6} },

{ name:'💻💻 Two computers (v23.14): B plans TP_E2 (task T → Maria) while A, not yet synced, closes TP_E2 as not relevant → merged both ways, the sweep cancels T; TP_E1 planned on two computers at once (X → Maria, then Y → Edelyn) → the merged plan keeps Y and the sweep cancels X (1 open: Edelyn); a third computer that has task Y but not the plan saves a plan → it adopts Y (still 2 linked tasks)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const K=HNX_ESC_KEY,TK='hydroPro_tasks_v1',E0=localStorage.getItem(K),T0=localStorage.getItem(TK);
    const pB=hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:day(1)});const BE=localStorage.getItem(K),BT=localStorage.getItem(TK);
    if(E0==null)localStorage.removeItem(K);else localStorage.setItem(K,E0);localStorage.setItem(TK,T0);await sleep(400);
    const cA=hnxEscClose(['crm:TP_E2'],'not_relevant','Customer closed the restaurant for good');
    await sleep(11000);
    const AE=localStorage.getItem(K),AT=localStorage.getItem(TK);
    localStorage.setItem(K,__hnxMergeGeneric(K,AE,BE)||AE);localStorage.setItem(TK,__hnxMergeGeneric(TK,AT,BT)||AT);await sleep(400);
    const sw1=hnxEscSweep();const tB=HNXTASKS.load().find(t=>t.id===pB.taskId);
    const E1=localStorage.getItem(K),T1=localStorage.getItem(TK);
    const pX=hnxEscSave('crm:TP_E1',{action:'c_call',who:'user:maria',followUp:day(3)});const XE=localStorage.getItem(K),XT=localStorage.getItem(TK);
    localStorage.setItem(K,E1);localStorage.setItem(TK,T1);await sleep(400);
    const pY=hnxEscSave('crm:TP_E1',{action:'c_quote',who:'user:edelyn.n',followUp:day(2)});const YE=localStorage.getItem(K),YT=localStorage.getItem(TK);
    localStorage.setItem(K,__hnxMergeGeneric(K,YE,XE)||YE);localStorage.setItem(TK,__hnxMergeGeneric(TK,YT,XT)||YT);await sleep(400);
    const linked=()=>HNXTASKS.load().filter(t=>(t.links||[]).some(l=>l.type==='escalation'&&l.id==='ESC_crm_TP_E1'));
    const planIs=hnxEscLoad().find(r=>r.id==='ESC_crm_TP_E1').taskId===pY.taskId?'Y':'X';
    const sw2=hnxEscSweep();
    const open1=linked().filter(t=>t.status!=='cancelled'&&t.status!=='done').map(t=>[t.id===pY.taskId?'Y':'X',t.owner]);
    const xs=HNXTASKS.load().find(t=>t.id===pX.taskId).status;
    const noPlan=JSON.parse(localStorage.getItem(K)).filter(r=>r.id!=='ESC_crm_TP_E1');localStorage.setItem(K,JSON.stringify(noPlan));await sleep(400);
    const pZ=hnxEscSave('crm:TP_E1',{action:'c_meet',who:'user:edelyn.n',followUp:day(4)});
    return {closed:cA.closed,sw1:sw1.tasks,tB:tB.status,planIs,sw2:sw2.tasks,xs,open1,adopted:pZ&&pZ.taskId===pY.taskId,linked:linked().length};})()`),
  expect:{closed:1,sw1:1,tB:'cancelled',planIs:'Y',sw2:1,xs:'cancelled',open1:[['Y','edelyn.n']],adopted:true,linked:2} },

{ name:'📦 Archive (v23.14): 120 Not relevant closes of issues resolved 40 days ago + 10 recent closes = 130 records → 3 runs move 26, 20, 16 (a fifth each — never "big" for Data Safety), the live store keeps 68, the monthly archive holds 62 in 1 store, 62 tombstones make a stale 130-record copy merge back to 68; the 10 recent stay; a 4th run the same day moves 0; Task Tracker 8',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`const old=ago(40),rec=ago(1);
    for(let i=1;i<=120;i++){const id='ISS_A'+String(i).padStart(3,'0');ISS.push(I(id,'hr','Old alert '+i,'info',50,{status:'resolved',resolvedAt:ago(39)}));
      ESC.push({id:'ESCX_iss_'+id,kind:'close',itemId:'iss:'+id,source:'issue',sourceId:id,module:'hr',dept:'hr',severity:'info',title:'Old alert '+i,closeKind:'not_relevant',reason:'old auto alert',state:'closed',
        closedBy:'eyal',closedByName:'Eyal Ben Ari',closedAt:old+i*1000,srcState:'none',createdBy:'eyal',createdAt:old,updatedBy:'eyal',updatedAt:old+i*1000,_fts:{}});}
    for(let i=1;i<=10;i++){const id='ISS_N'+String(i).padStart(2,'0');ISS.push(I(id,'hr','New alert '+i,'info',6));
      ESC.push({id:'ESCX_iss_'+id,kind:'close',itemId:'iss:'+id,source:'issue',sourceId:id,module:'hr',dept:'hr',severity:'info',title:'New alert '+i,closeKind:'not_relevant',reason:'old auto alert',state:'closed',
        closedBy:'eyal',closedByName:'Eyal Ben Ari',closedAt:rec+i*1000,srcState:'none',createdBy:'eyal',createdAt:rec,updatedBy:'eyal',updatedAt:rec+i*1000,_fts:{}});}`),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const K=HNX_ESC_KEY,orig=localStorage.getItem(K),moved=[],big=[],keys={};
    for(let r=0;r<3;r++){const b=localStorage.getItem(K);const o=hnxEscArchive({force:true});moved.push(o.moved);(o.keys||[]).forEach(k=>keys[k]=1);const a=localStorage.getItem(K);big.push(__hnxDsIsBig(__hnxDsStats(b,a,K,true)));}
    const live=JSON.parse(localStorage.getItem(K)).length,arch=hnxEscArchived().length;
    const merged=JSON.parse(__hnxMergeGeneric(K,localStorage.getItem(K),orig)||localStorage.getItem(K)).length;
    const tomb=Object.keys((JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}')[K])||{}).length;
    const fourth=hnxEscArchive({}).moved;
    const recentKept=JSON.parse(localStorage.getItem(K)).filter(r=>/ISS_N/.test(r.itemId)).length;
    return {start:JSON.parse(orig).length,moved,big,live,arch,keys:Object.keys(keys).length,merged,tomb,fourth,recentKept,tt:ttCount()};})()`),
  expect:{start:130,moved:[26,20,16],big:[false,false,false],live:68,arch:62,keys:1,merged:68,tomb:62,fourth:0,recentKept:10,tt:8} },

{ name:'📅 Postpone never earlier (v23.14): TSK_E2 due today+10 → its row offers +10 (was +3); Postpone to +3 → "⛔ Postpone needs a date after …", due stays +10; Postpone to +12 → due +12; MT_E2 planned to +12, then bulk Postpone with no date → plan and task +13 (was +3)',
  requires:REQ,tz:'Asia/Manila',seed:seed(`TASKS[1].due=ymd(ago(-10));TASKS[1].dueOriginal=ymd(ago(-10));`),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const rel=d=>{for(let i=-3;i<40;i++)if(day(i)===d)return '+'+i;return d;};
    const fuShown=row('task:TSK_E2').querySelector('.hnx-esc-fu').value;
    const a=hnxEscSave('task:TSK_E2',{action:'postpone',who:'user:edelyn.n',followUp:day(3)});const why=TOASTS[TOASTS.length-1];
    const due1=HNXTASKS.load().find(t=>t.id==='TSK_E2').due;
    const b=hnxEscSave('task:TSK_E2',{action:'postpone',who:'user:edelyn.n',followUp:day(12)});const due2=HNXTASKS.load().find(t=>t.id==='TSK_E2').due;
    hnxEscSave('maint:MT_E2',{action:'m_repair',who:'user:maria',followUp:day(12)});
    const bk=hnxEscBulk(['maint:MT_E2'],{action:'postpone'});
    const pl=hnxEscLoad().find(r=>r.id==='ESC_maint_MT_E2'),tk=HNXTASKS.load().find(t=>t.id===pl.taskId);
    return {fuShown:rel(fuShown),a,why:/Postpone needs a date after/.test(why||''),due1:rel(due1),b:!!b,due2:rel(due2),bk:bk.ok,planFu:rel(pl.followUp),taskDue:rel(tk.due)};})()`),
  expect:{fuShown:'+10',a:false,why:true,due1:'+10',b:true,due2:'+12',bk:1,planFu:'+13',taskDue:'+13'} },

{ name:'⏳ Closed, then another person signs in on that computer (v23.14): Maria closes ISS_E2 and TP_E1 as Already done, Eyal signs in at once → at +11.5 s ISS_E2 is still in_progress, srcState pending, Task Tracker 6; Eyal ↩ Reopens TP_E1 while it waits → 7, TP_E1 not done; Eyal\'s session 11 minutes later applies ISS_E2 (1) → resolved, applied, srcBy eyal; Task Tracker 7',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('maria');await open();
    const c=hnxEscClose(['iss:ISS_E2'],'done','Reprinted the labels with a new ribbon');
    const c2=hnxEscClose(['crm:TP_E1'],'done','Sent the price list and samples');as('eyal');
    await sleep(11500);
    const s1=loadIssues().find(i=>i.id==='ISS_E2').status,r1=hnxEscLoad().find(r=>r.id==='ESCX_iss_ISS_E2').srcState,tt1=ttCount();
    const re=hnxEscReopen('crm:TP_E1','Not sent yet — Maria sends it tomorrow');await sleep(350);const tt2=ttCount();
    const n=hnxEscApplyPending({now:Date.now()+11*60000});
    const s2=loadIssues().find(i=>i.id==='ISS_E2').status,rec=hnxEscLoad().find(r=>r.id==='ESCX_iss_ISS_E2');
    const tp=!!(_crmLoadTouch().find(t=>t.id==='TP_E1')||{}).nextActionDone;await sleep(350);
    return {c:c.closed,c2:c2.closed,s1,r1,tt1,re,tt2,n,s2,src:rec.srcState,by:rec.srcBy,tp,tt3:ttCount()};})()`),
  expect:{c:1,c2:1,s1:'in_progress',r1:'pending',tt1:6,re:true,tt2:7,n:1,s2:'resolved',src:'applied',by:'eyal',tp:false,tt3:7} },

{ name:'☑ The selection follows the screen (v23.14): By module ▸ CRM, ☐ Select all → 2 selected; By module ▸ Maintenance → 0 selected, bar hidden; ☐ Select all → 2; 🚫 Not relevant → only MT_E1 and MT_E2 closed (the 2 CRM rows untouched); the banner reads "takes it out of every count"; a planned row keeps its action (c_call) with its note as placeholder, and changing only the date saves (+5, still 1 task)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const banner=(H().querySelector('.hnx-esc-banner')||{}).textContent||'';
    const clickMod=m=>H().querySelector('#hnxEscByMod .hnx-esc-prow[data-mod="'+m+'"]').click();
    const selAll=()=>H().querySelector('.hnx-esc-all').click();
    const barN=()=>{const b=document.getElementById('hnxEscBulk');return b&&b.style.display!=='none'?+b.querySelector('.hnx-esc-bn').textContent:0;};
    clickMod('crm');await sleep(60);selAll();const n1=barN(),shown1=rows().map(r=>r.getAttribute('data-id')).sort();
    clickMod('crm');await sleep(60);clickMod('maintenance');await sleep(60);const n2=barN();
    selAll();const n3=barN();
    const bar=document.getElementById('hnxEscBulk'),ba=bar.querySelector('.hnx-esc-bact');ba.value='not_relevant';ba.dispatchEvent(new Event('change',{bubbles:true}));
    bar.querySelector('.hnx-esc-bnote').value='Old duplicate maintenance alerts';bar.querySelector('.hnx-esc-bapply').click();await sleep(150);
    const closed=hnxEscLoad().filter(r=>r.kind==='close'&&r.state==='closed').map(r=>r.itemId).sort();
    hnxEscFilter({mod:''});
    hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:day(1),note:'Call the chef before Friday'});hnxEscRender();
    const rw=row('crm:TP_E2'),act=rw.querySelector('.hnx-esc-act').value,ph=rw.querySelector('.hnx-esc-note').placeholder;
    const fu=rw.querySelector('.hnx-esc-fu');fu.value=day(5);fu.dispatchEvent(new Event('change',{bubbles:true}));
    rw.querySelector('.hnx-esc-save').click();await sleep(120);
    const pl=hnxEscLoad().find(r=>r.id==='ESC_crm_TP_E2');
    return {banner:/takes it out of every count on every computer/.test(banner),n1,shown1,n2,n3,closed,act,ph,fu:pl.followUp===day(5),note:pl.note,tasks:escTasks().length,due:escTasks()[0].due===day(5)};})()`),
  expect:{banner:true,n1:2,shown1:['crm:TP_E1','crm:TP_E2'],n2:0,n3:2,closed:['maint:MT_E1','maint:MT_E2'],act:'c_call',ph:'Note: Call the chef before Friday',fu:true,note:'Call the chef before Friday',tasks:1,due:true} },

{ name:'📝 Close again, hand back (v23.14): MT_E2 Not relevant "Duplicate of the GH9 plastic job" → ↩ Reopen → Already done with no note → reason "—" and the ✅ Closed row shows no old reason; TP_E2 → Maria → Edelyn → Maria again → Maria has 2 escalation notes, 1 unread, the task is hers',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    hnxEscClose(['maint:MT_E2'],'not_relevant','Duplicate of the GH9 plastic job');
    const re=hnxEscReopen('maint:MT_E2','test');
    const c=hnxEscClose(['maint:MT_E2'],'done','');
    const rec=hnxEscLoad().find(r=>r.id==='ESCX_maint_MT_E2');
    hnxEscFilter('closed');const line=(row('maint:MT_E2')||{textContent:''}).textContent;hnxEscFilter('open');
    hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:day(1)});await sleep(10);
    const ib=inbox();ib.forEach(x=>{if(x.user==='maria')x.read=true;});localStorage.setItem('hydroPro_pa_inbox_v1',JSON.stringify(ib));
    hnxEscSave('crm:TP_E2',{action:'reassign',who:'user:edelyn.n',followUp:day(2)});await sleep(10);
    hnxEscSave('crm:TP_E2',{action:'reassign',who:'user:maria',followUp:day(3),note:'Back to Maria — the chef only talks to her'});
    const mine=inbox().filter(x=>x.user==='maria'&&/^ESCA_/.test(x.id));
    return {re,c:c.closed,kind:rec.closeKind,reason:rec.reason,old:/GH9 plastic job/.test(line),notes:mine.length,unread:mine.filter(x=>!x.read).length,owner:escTasks()[0].owner};})()`),
  expect:{re:true,c:1,kind:'done',reason:'—',old:false,notes:2,unread:1,owner:'maria'} },

{ name:'🧭 Options that fit (v23.14): "🔁 Duplicate of the maintenance task — close" sits in "Close it" and closes ISS_U1 as not relevant ("Duplicate of the maintenance task — MT_E1 on the board"), 0 tasks, All open 12 → 11; "Escalate to the department head" on Maria\'s ISS_P1 puts Edelyn in RESPONSIBLE → task owner edelyn.n + her note, and is not offered on ISS_E2 (packaging) or TP_E1 (CRM: no head); packaging has no nutrient / flush / Dr Amy; a SIM renewal offers "Load / renew the SIM", no vendor repair; the CCTV task (sourceModule it) defaults to Jun under "IT head"; Reassign on an unplanned item → "Handle it — reassigned by Eyal Ben Ari", done when "the item is fixed in its module or closed on 🚨 Escalation"',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true,department:'admin'},
    {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'production',active:true},
    {username:'maria',fullname:'Maria Santos',passwordHash:'x',role:'operator',department:'production',active:true},
    {username:'jun',fullname:'Jun IT',passwordHash:'x',role:'supervisor',department:'it',active:true},
    {username:'acct',fullname:'Acct Person',passwordHash:'x',role:'accounting',department:'accounting',departments:['accounting','production'],active:true}]));
    localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({production:'edelyn.n',it:'jun'}));
    ISS.push(I('ISS_U1','production','🚨 URGENT: Flange gasket leak at the GH3 overhead tank','critical',3));
    ISS.push(I('ISS_P1','production','Broken NFT channel cover GH2 row 4','warning',4,{assignedTo:'maria',assignedToName:'Maria Santos'}));
    MTS.push(Object.assign(MT('MT_SIM','📻 RENEW SIM (EXPIRED): R5','priority',5),{category:'auto_sim_renewal',sourceModule:'it_radios'}));
    MTS.push(Object.assign(MT('MT_CAM','📷 CCTV Cam 7 — OFFLINE','urgent',3),{category:'auto_cctv',sourceModule:'it'}));`),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    const L=k=>hnxEscOptions(item(k)),grp=(k,id)=>{const o=L(k).find(x=>x.id===id);return o?o.group:null;};
    const u1=grp('iss:ISS_U1','u_dup'),g1=grp('iss:ISS_E1','g_dup'),o0=chips().open,n0=escTasks().length;
    const s1=hnxEscSave('iss:ISS_U1',{action:'u_dup',note:'MT_E1 on the board'});const x1=hnxEscLoad().find(r=>r.id==='ESCX_iss_ISS_U1');
    hnxEscRender();const o1=chips().open;
    const hasHead={p1:!!grp('iss:ISS_P1','g_head'),e2:!!grp('iss:ISS_E2','g_head'),tp1:!!grp('crm:TP_E1','g_head')};
    const rw=row('iss:ISS_P1'),a=rw.querySelector('.hnx-esc-act');a.value='g_head';a.dispatchEvent(new Event('change',{bubbles:true}));
    const whoAfterPick=rw.querySelector('.hnx-esc-who').value;
    rw.querySelector('.hnx-esc-save').click();await sleep(120);
    const hp=hnxEscLoad().find(r=>r.id==='ESC_iss_ISS_P1'),ht=HNXTASKS.load().find(t=>t.id===hp.taskId);
    const headNote=inbox().some(x=>x.user==='edelyn.n'&&/^ESCA_ESC_iss_ISS_P1_edelyn\\.n_/.test(x.id));
    const e2=L('iss:ISS_E2').map(o=>o.label),sim=L('maint:MT_SIM').map(o=>o.label);
    const cs=document.createElement('select');cs.innerHTML=hnxEscWhoOptions(item('maint:MT_CAM'));
    const ra=hnxEscSave('maint:MT_CAM',{action:'reassign',who:'user:maria',followUp:day(1)});const rt=HNXTASKS.load().find(t=>t.id===ra.taskId);
    return {u1,g1,s1:!!s1,reason:x1&&x1.reason,closeAction:x1&&x1.closeAction,n0,o0,o1,hasHead,whoAfterPick,headWho:hp.whoUser,taskOwner:ht.owner,headNote,
      e2:{nutrient:e2.some(x=>/nutrient/i.test(x)),flush:e2.some(x=>/flush/i.test(x)),amy:e2.some(x=>/Dr Amy/.test(x)),parts:e2.some(x=>/Request parts/.test(x))},
      sim:{renew:sim.includes('Load / renew the SIM'),repair:sim.includes('Send to the vendor for repair')},cam:{sel:cs.value,group:(cs.querySelector('optgroup')||{}).label},
      raTitle:/— Handle it — reassigned by Eyal Ben Ari$/.test(rt.title),raOut:/Done when: the item is fixed in its module or closed on 🚨 Escalation/.test(rt.outcome),tasksEnd:escTasks().length};})()`),
  expect:{u1:'Close it',g1:'Close it',s1:true,reason:'Duplicate of the maintenance task — MT_E1 on the board',closeAction:'u_dup',n0:0,o0:12,o1:11,hasHead:{p1:true,e2:false,tp1:false},
    whoAfterPick:'user:edelyn.n',headWho:'edelyn.n',taskOwner:'edelyn.n',headNote:true,e2:{nutrient:false,flush:false,amy:false,parts:true},sim:{renew:true,repair:false},
    cam:{sel:'user:jun',group:'IT head'},raTitle:true,raOut:true,tasksEnd:2} },

{ name:'↺ Repeat is the same alarm only (v23.14): closed B-1012, memo 2026-041, "Daily check missed 2026-10-12 07:00" and yesterday\'s pool P6 EC alarm → B-1013 and memo 042 are NOT a Repeat; the daily check of another date is a Repeat but nothing is pre-picked; today\'s pool alarm has Not relevant picked and "Same as <day>: Probe was out of the water — reading wrong" in the note, and one click on 💾 Save closes it (12 → 11)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed(`ISS.push(I('ISS_Q1','quality','Rejected lettuce batch B-1012 (tip burn)','critical',3));ISS.push(I('ISS_Q2','quality','Rejected lettuce batch B-1013 (tip burn)','critical',3));
    ISS.push(I('ISS_M1','hr','Memo 2026-041 not signed by the team','info',6));ISS.push(I('ISS_M2','hr','Memo 2026-042 not signed by the team','info',6));
    ISS.push(I('ISS_D1','hr','Daily check missed 2026-10-12 07:00','info',6));ISS.push(I('ISS_D2','hr','Daily check missed 2026-10-13 07:00','info',6));
    ISS.push(I('ISS_irr_'+yday+'_0700_P6_EC','irrigation','💧 EC out of range: GH6 (Pool 6)','warning',3));ISS.push(I('ISS_irr_'+today+'_0700_P6_EC','irrigation','💧 EC out of range: GH6 (Pool 6)','warning',3));`),
  run:new Function(`return (async()=>{${AS}as('eyal');
    const y='iss:ISS_irr_'+day(-1)+'_0700_P6_EC',t='iss:ISS_irr_'+today+'_0700_P6_EC';
    hnxEscClose(['iss:ISS_Q1'],'not_relevant','Batch already disposed — logged by QA');hnxEscClose(['iss:ISS_M1'],'not_relevant','Old memo, signed on paper');
    hnxEscClose(['iss:ISS_D1'],'not_relevant','Check was done, entered late');hnxEscClose([y],'not_relevant','Probe was out of the water — reading wrong');
    await open();
    const tag=k=>!!row(k)&&/↺ Repeat/.test(row(k).querySelector('.c-item').textContent);
    const irrNote=row(t).querySelector('.hnx-esc-note').value;
    const res={q2:tag('iss:ISS_Q2'),m2:tag('iss:ISS_M2'),d2:tag('iss:ISS_D2'),d2act:row('iss:ISS_D2').querySelector('.hnx-esc-act').value,irr:tag(t),irrAct:row(t).querySelector('.hnx-esc-act').value,
      irrNote:/^Same as \\d{1,2} [A-Z][a-z]{2}: Probe was out of the water — reading wrong$/.test(irrNote),before:ttCount()};
    row(t).querySelector('.hnx-esc-save').click();await sleep(400);
    res.after=ttCount();res.closedNow=!!(hnxEscLoad().find(r=>r.itemId===t&&r.state==='closed'));
    return res;})()`),
  expect:{q2:false,m2:false,d2:true,d2act:'',irr:true,irrAct:'not_relevant',irrNote:true,before:12,after:11,closedNow:true} },

{ name:'↗ Open opens the record (v23.14): ↗ Open on ISS_E1 opens #issueDetailModal titled with the issue, on MT_E1 the maintenance task window (🔧 Edit Task), the screen stays 🚨 Escalation; a follow-up task\'s drawer has "↗ Open on 🚨 Escalation" → the drawer closes, view-task_escalation, the TP_E2 row outlined',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('eyal');await open();
    row('iss:ISS_E1').querySelector('.hnx-esc-open').click();await sleep(250);
    const im=document.getElementById('issueDetailModal'),issOpen=!!im&&im.classList.contains('open')&&/Leaking end cups/.test((document.getElementById('issueDetailTitle')||{}).textContent||'');if(im)im.classList.remove('open');
    row('maint:MT_E1').querySelector('.hnx-esc-open').click();await sleep(250);
    const mm=document.getElementById('maintTaskModal'),mtOpen=!!mm&&mm.classList.contains('open'),mtTitle=(document.getElementById('maintTaskTitle')||{}).textContent;if(mm)mm.classList.remove('open');
    const active1=(document.querySelector('.view.active')||{}).id;
    const r=hnxEscSave('crm:TP_E2',{action:'c_call',who:'user:maria',followUp:day(1)});
    switchView('dashboard');await sleep(300);HNXTASKS.drawer(r.taskId);await sleep(200);
    const btn=document.querySelector('#hnxTaskF .hnx-esc-tlink'),btnText=btn&&btn.textContent;if(btn)btn.click();await sleep(450);
    const active2=(document.querySelector('.view.active')||{}).id,rw=row('crm:TP_E2');
    return {issOpen,mtOpen,mtTitle,active1,btnText,drawerGone:!document.getElementById('hnxTaskF'),active2,outlined:!!rw&&rw.classList.contains('hnx-esc-focus')};})()`),
  expect:{issOpen:true,mtOpen:true,mtTitle:'🔧 Edit Task',active1:'view-task_escalation',btnText:'↗ Open on 🚨 Escalation',drawerGone:true,active2:'view-task_escalation',outlined:true} },

{ name:'📱 The bulk bar is on the page body (v23.14): 3 rows ticked → at 400×800 and at 1366×768 the bar is a child of <body>, shown, ✕ Clear and 💾 Apply are the topmost element at their centre, and it ends above the phone tray and the cloud-sync banner docked at the bottom',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  drive:async pg=>{
    const probe=`(()=>{const b=document.getElementById('hnxEscBulk');if(!b)return {missing:true};const hit=s=>{const e=b.querySelector(s);const r=e.getBoundingClientRect();const x=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!x&&(x===e||e.contains(x));};
      let above=true;['hnxPhoneTray','hnxCloudBanner'].forEach(id=>{const tr=document.getElementById(id);if(!tr)return;const rr=tr.getBoundingClientRect(),cs=getComputedStyle(tr);if(cs.display!=='none'&&cs.visibility!=='hidden'&&rr.height>0&&rr.top<innerHeight)above=above&&b.getBoundingClientRect().bottom<=rr.top+1;});
      return {body:b.parentNode===document.body,shown:b.style.display!=='none',clear:hit('.hnx-esc-bclear'),apply:hit('.hnx-esc-bapply'),above};})()`;
    await pg.setViewportSize({width:400,height:800});await pg.waitForTimeout(400);
    await pg.evaluate(`(async()=>{sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));switchView('task_escalation');await new Promise(r=>setTimeout(r,500));hnxEscRender();await new Promise(r=>setTimeout(r,150));
      [...document.querySelectorAll('#taskEscalationBody .hnx-esc-chk')].slice(0,3).forEach(c=>c.click());await new Promise(r=>setTimeout(r,300));})()`);
    const a=await pg.evaluate(probe);
    await pg.setViewportSize({width:1366,height:768});await pg.waitForTimeout(500);
    await pg.evaluate(`window.dispatchEvent(new Event('resize'))`);await pg.waitForTimeout(300);
    const b=await pg.evaluate(probe);
    return {p400:a,p1366:b};
  },
  run:new Function(`return (async()=>({}))()`),
  expect:{'drive.p400':{body:true,shown:true,clear:true,apply:true,above:true},'drive.p1366':{body:true,shown:true,clear:true,apply:true,above:true}} },

];
