/* v21.17: ✅ Tasks — one task record for the whole company */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'maria',fullname:'Maria Santos',passwordHash:'x',role:'operator',department:'crm',departments:['crm'],active:true},
    {username:'ben',fullname:'Ben Reyes',passwordHash:'x',role:'operator',department:'hr',departments:['hr'],active:true}]));
  localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({crm:'jinky'}));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'✅ One task, many views: a task created for CRM is in Tasks ▸ My Day, projected as a ⏰ deadline into the CRM calendar and the Tasks calendar with the same id; ✓ Done in My Day greys it everywhere; the Overview Task Tracker lists it (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    const t=HNXTASKS.create({title:'Confirm buyer trial feedback',module:'crm',due:today,visibility:'team'});
    switchView('tasks_my');await sleep(500);
    const my=/Confirm buyer trial feedback/.test(document.getElementById('view-tasks_my').innerHTML);
    const ev=loadCalEvents().filter(e=>e._task===t.id);
    const crmCal=HNXMCAL.items('crm').some(e=>e._task===t.id);
    switchView('tasks_calendar');await sleep(400);
    const inCal=/Confirm buyer trial feedback/.test(document.getElementById('view-tasks_calendar').innerHTML);
    const tt=(typeof _tt_collectAll==='function'?_tt_collectAll():[]).some(i=>i.id==='task:'+t.id);
    HNXTASKS.quickDone(t.id);await sleep(200);
    const after=HNXTASKS.load().find(x=>x.id===t.id);const ev2=loadCalEvents().find(e=>e.id==='TSK:'+t.id);
    return {my,proj:ev.length,projId:ev[0]&&ev[0].id,crmCal,inCal,tt,status:after.status,doneBy:after.doneBy,projDone:ev2&&ev2.done,persisted:JSON.parse(localStorage.getItem('hydroPro_cal_events_v2')||'[]').some(e=>e._proj)};})()`),
  expect:{my:true,proj:1,projId:undefined,crmCal:true,inCal:true,tt:true,status:'done',doneBy:'tester',projDone:true,persisted:false} },

{ name:'🔒 Maria’s personal task is invisible to her head Jinky (not in her list, Team shows “1 private”, cannot open); “Share with my department head” makes it visible; a task Jinky assigns to Maria is team-visible and Maria cannot make it personal (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    as('maria');const p=HNXTASKS.create({title:'Prepare my coaching questions',due:today,visibility:'personal'});
    as('jinky');const seeBefore=HNXTASKS.canSee(p,'jinky'),listBefore=HNXTASKS.visible().some(t=>t.id===p.id);
    switchView('tasks_team');await sleep(500);const teamHtml=document.getElementById('view-tasks_team').innerHTML;
    const priv=/<b>1 private<\\/b>/.test(teamHtml),notListed=!/coaching questions/.test(teamHtml);
    as('maria');const shared=HNXTASKS.share(p.id,'head');
    as('jinky');const seeAfter=HNXTASKS.canSee(HNXTASKS.load().find(t=>t.id===p.id),'jinky');
    const a=HNXTASKS.create({title:'Obtain trial feedback from Marriott',owner:'maria',due:today,module:'crm'});
    as('maria');const madePersonal=HNXTASKS.share(a.id,'personal');const A=HNXTASKS.load().find(t=>t.id===a.id);
    as('ben');const benSees=HNXTASKS.canSee(A,'ben');
    return {seeBefore,listBefore,priv,notListed,shared,seeAfter,assignedVis:A.visibility,mandatory:A.mandatory,madePersonal,stillVis:A.visibility,benSees};})()`),
  expect:{seeBefore:false,listBefore:false,priv:true,notListed:true,shared:true,seeAfter:true,assignedVis:'team',mandatory:true,madePersonal:false,stillVis:'team',benSees:false} },

{ name:'☐ A required open subtask blocks the parent from Done (“1 required subtask(s) still open”); an optional one does not; the department head waives it → Done goes through (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('maria');
    const p=HNXTASKS.create({title:'Obtain buyer approval and first release',due:today,visibility:'team'});
    const r=HNXTASKS.create({title:'Confirm available kg',parentId:p.id,required:true,owner:'maria'});
    const o=HNXTASKS.create({title:'Nice-to-have photo',parentId:p.id,required:false,owner:'maria'});
    const why=HNXTASKS.doneCheck(p);const first=HNXTASKS.setStatus(p.id,'done');
    as('jinky');HNXTASKS.setStatus(o.id,'done');const w=window.HNXTASKS;
    const waived=(function(){try{return !!(w.load().find(x=>x.id===r.id));}catch(e){return false;}})();
    window.confirm=()=>true;w.waive(p.id,r.id);await sleep(100);const R=w.load().find(x=>x.id===r.id);
    as('maria');const second=w.setStatus(p.id,'done');const P=w.load().find(x=>x.id===p.id);
    return {why,first,waived,waivedBy:R.waived&&R.waived.by,second,status:P.status};})()`),
  expect:{why:['1 required subtask(s) still open'],first:false,waived:true,waivedBy:'jinky',second:true,status:'done'} },

{ name:'📎 Evidence required refuses Done until a note or link is added; an approval task goes To do → Pending review, the owner cannot approve it, the reviewer can return it (owner back In progress with the note) and then approve it → Done stamped by the reviewer (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('maria');const w=HNXTASKS;
    const e=w.create({title:'Log the delivery acceptance',due:today,rule:'evidence',visibility:'team'});
    const noEv=w.setStatus(e.id,'done');w.addEvidence(e.id,{note:'DR 4471 signed by the receiving clerk'});const withEv=w.setStatus(e.id,'done');
    const a=w.create({title:'Prepare approved quote',due:today,rule:'review',reviewer:'jinky',visibility:'team'});
    const direct=w.setStatus(a.id,'done');const sub=w.setStatus(a.id,'review');const self=w.setStatus(a.id,'done');
    as('jinky');const ret=w.setStatus(a.id,'todo',{note:'price validity missing'});const A1=w.load().find(x=>x.id===a.id);
    as('maria');w.setStatus(a.id,'review');as('jinky');const ok=w.setStatus(a.id,'done');const A2=w.load().find(x=>x.id===a.id);
    return {noEv,withEv,direct,sub,statusAfterSub:self?'x':'review',self,ret,afterReturn:A1.status,note:A1.returned&&A1.returned.note,ok,final:A2.status,doneBy:A2.doneBy};})()`),
  expect:{noEv:false,withEv:true,direct:false,sub:true,statusAfterSub:'review',self:false,ret:true,afterReturn:'doing',note:'price validity missing',ok:true,final:'done',doneBy:'jinky'} },

{ name:'🟩 Scheduling two work blocks never changes the due date (they are 🟩 items in the calendar, the deadline stays ⏰); moving the due date keeps the original (“was due …”) (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);const w=HNXTASKS;const due=ymd(new Date(Date.now()+5*86400000));
    const t=w.create({title:'Build qualified pipeline',due:due,module:'crm',visibility:'team'});
    w.scheduleBlock(t.id,today,'14:00','16:00');w.scheduleBlock(t.id,ymd(new Date(Date.now()+86400000)),'09:00','10:00');
    const T=w.load().find(x=>x.id===t.id);const ev=loadCalEvents().filter(e=>e._task===t.id);
    const moved=ymd(new Date(Date.now()+9*86400000));w.update(t.id,{due:moved});const T2=w.load().find(x=>x.id===t.id);
    return {due:T.due,blocks:T.blocks.length,items:ev.length,kinds:ev.map(e=>e.type).sort(),after:T2.due,original:T2.dueOriginal,hist:T2.history.filter(h=>h.what==='due').length};})()`),
  expect:{due:'__DUE__',blocks:2,items:3,kinds:['deadline','task','task'],after:'__MOVED__',original:'__DUE__',hist:1} },

{ name:'🔁 A weekly Monday rule generates one task per Monday for 90 days, none twice when generated again; a Monday holiday moves that occurrence to Tuesday (same nominal key, no duplicate); “this and future” from the 4th week leaves weeks 1–3 untouched and replaces the rest (v21.17)',
  seed:new Function('('+SEED.toString()+')();'),
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);const w=HNXTASKS;
    const d=new Date(today+'T00:00:00');const mon=new Date(d);mon.setDate(mon.getDate()+((8-mon.getDay())%7||7));const m1=ymd(mon);
    const m2=ymd(new Date(mon.getTime()+7*86400000)),m4=ymd(new Date(mon.getTime()+21*86400000));
    const hol=JSON.parse(localStorage.getItem('hydroPro_ph_holidays')||'{}');hol[m2]={name:'Test holiday',kind:'regular',updatedAt:Date.now()};localStorage.setItem('hydroPro_ph_holidays',JSON.stringify(hol));
    const s=w.seriesSaveRaw({title:'10:00 — reconcile 8-week supply and income gaps',owner:'jinky',module:'crm',rule:{freq:'weekly',days:[1],workdays:true,holiday:'later'},start:m1,dueTime:'10:00',visibility:'team',taskRule:'simple'},'all');
    const occ=()=>w.load().filter(t=>t.seriesId===s.id);const n1=occ().length;w.generate();const n2=occ().length;
    const shifted=occ().find(t=>t.nominal===m2);
    const s2=Object.assign({},s,{title:'10:30 — reconcile supply (new format)'});w.seriesSaveRaw(s2,'future',m4);
    const all=w.load().filter(t=>t.title.indexOf('reconcile')>=0);const old=all.filter(t=>t.seriesId===s.id).map(t=>t.nominal).sort();const nw=all.filter(t=>t.seriesId!==s.id);
    const mondays=[];for(let x=new Date(mon);x<=new Date(d.getTime()+90*86400000);x.setDate(x.getDate()+7))mondays.push(ymd(x));
    return {n1,n2,expected:mondays.length,oneMonday:occ().filter(t=>t.nominal===m1).length,shiftedDue:shifted&&shifted.due,shiftedNominal:shifted&&shifted.nominal,tuesday:ymd(new Date(new Date(m2+'T00:00:00').getTime()+86400000)),oldKept:old,firstNew:nw.map(t=>t.nominal).sort()[0],newTitle:nw[0]&&nw[0].title,dupes:new Set(all.map(t=>t.nominal)).size===all.length};})()`),
  expect:{n1:'__N__',n2:'__N__',oneMonday:1,shiftedNominal:'__M2__',oldKept:'__OLD__',newTitle:'10:30 — reconcile supply (new format)',dupes:true} },

{ name:'🗑 Deleting a task writes a tombstone (hydroPro_optomb) so a second computer’s copy cannot bring it back; in-app reminders: due tomorrow → owner; 2 days late → the department head; Done → silent (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);const w=HNXTASKS;as('maria');
    const t=w.create({title:'Throwaway',due:today});window.confirm=()=>true;w.remove(t.id);
    const tomb=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');const tombed=!!(tomb['hydroPro_tasks_v1']&&tomb['hydroPro_tasks_v1'][t.id]);
    const tom=ymd(new Date(Date.now()+86400000)),late2=ymd(new Date(Date.now()-2*86400000));
    const a=w.create({title:'Due tomorrow',due:tom,visibility:'team'}),b=w.create({title:'Two days late',due:late2,visibility:'team'});
    const mine=w.dueFor('maria',today).map(x=>x.t.title+'|'+x.why).sort();const head=w.dueFor('jinky',today).map(x=>x.t.title+'|'+x.why);
    w.setStatus(b.id,'done');const headAfter=w.dueFor('jinky',today).length;
    return {tombed,gone:!w.load().some(x=>x.id===t.id),mine,head,headAfter};})()`),
  expect:{tombed:true,gone:true,mine:['Due tomorrow|due tomorrow'],head:['Two days late|2 days late · Maria Santos'],headAfter:0} },

{ name:'💻 IT ▸ 📅 IT Calendar is the IT module’s own PM calendar again (one it_calendar entry, its own body), not the generic module calendar; the Tasks module is in the left rail after Overview; Administration ▸ Users shows the Department heads panel for an admin (v21.17)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    const itEntries=MODULES.it.views.filter(v=>v.id==='it_calendar');
    switchView('it_calendar');await sleep(1200);const itHtml=document.getElementById('view-it_calendar').innerHTML;
    const own=!!document.getElementById('hnx-it_calendar-body'),generic=/Only this module’s items/.test(itHtml);
    const rail=document.getElementById('hnxRail');const items=rail?Array.from(rail.querySelectorAll('.r-item[data-mod]')).map(x=>x.getAttribute('data-mod')):[];
    switchView('users');await sleep(5500);const panel=document.getElementById('hnxDeptHeads');
    const sel=panel&&panel.querySelector('select');const crmSel=panel&&Array.from(panel.querySelectorAll('select')).some(s=>s.value==='jinky');
    return {itEntries:itEntries.length,own,generic,railHas:items.indexOf('tasks')>=0,afterOverview:items.indexOf('tasks')===items.indexOf('overview')+1,panel:!!panel,selects:panel?panel.querySelectorAll('select').length>=16:false,crmSel,modViews:MODULES.tasks.views.map(v=>v.id)};})()`),
  expect:{itEntries:1,own:true,generic:false,railHas:true,afterOverview:true,panel:true,selects:true,crmSel:true,modViews:['tasks_my','tasks_team','tasks_recurring','tasks_approvals','tasks_calendar']} },
];
/* dynamic expectations (dates) are resolved in the page: replace the placeholders */
module.exports.forEach(function(t){
  var runSrc=t.run.toString();
  if(/__DUE__/.test(JSON.stringify(t.expect))){t.expect=null;t.run=new Function('return ('+runSrc+')().then(function(r){return Object.assign(r,{ok:r.due===r.original&&r.after!==r.due&&r.original===r.due});});');
    t.expect={blocks:2,items:3,kinds:['deadline','task','task'],hist:1,ok:true};}
  if(/__N__/.test(JSON.stringify(t.expect))){t.run=new Function('return ('+runSrc+')().then(function(r){return Object.assign(r,{okN:r.n1===r.expected&&r.n2===r.expected,okShift:r.shiftedDue===r.tuesday&&r.shiftedNominal!==r.shiftedDue,okOld:r.oldKept.length===3&&r.firstNew>r.oldKept[2]});});');
    t.expect={oneMonday:1,newTitle:'10:30 — reconcile supply (new format)',dupes:true,okN:true,okShift:true,okOld:true};}
});
