/* v22.29 trial · R11 S01 (Shared Tasks: rule and privacy fixes, no change to the look) */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'maria',fullname:'Maria Santos',passwordHash:'x',role:'operator',department:'crm',departments:['crm'],active:true},
    {username:'ben',fullname:'Ben Reyes',passwordHash:'x',role:'operator',department:'hr',departments:['hr'],active:true}]));
  localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({crm:'jinky'}));
  localStorage.setItem('hydroPro_tasks_v1','[]');localStorage.removeItem('hydroPro_task_hist_archive_v1');
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));const T=[];window.showToast=m=>T.push(String(m));";
module.exports=[
{ name:'🗓 Deleting a task\'s ⏰ deadline from the CRM calendar no longer deletes the task: task due 2026-10-14 stays (1 task, status To do, ⏰ still shown) and "Edit or cancel the task" with Open appears; deleting its work block on 12 Oct removes exactly 1 block and the due date stays 2026-10-14 (R11 S01)',
  requires:"window.__hnxTasksRules>=1",seed:SEED,
  run:new Function(`return (async()=>{${AS}as('tester');await sleep(6000);
    const t=HNXTASKS.create({title:'Call the Tablo buyer',module:'crm',due:'2026-10-14',visibility:'team'});
    HNXTASKS.scheduleBlock(t.id,'2026-10-12','09:00','10:00');
    HNXMCAL.del('crm','TSK:'+t.id);await sleep(100);
    const left=HNXTASKS.load().filter(x=>x.id===t.id);const toastEl=document.getElementById('hnxTskDelToast');
    const proj=loadCalEvents().filter(e=>e.id==='TSK:'+t.id).length;
    const bid=(HNXTASKS.load().find(x=>x.id===t.id).blocks||[])[0].id;
    HNXMCAL.del('crm','TSKB:'+t.id+':'+bid);await sleep(100);const after=HNXTASKS.load().find(x=>x.id===t.id);
    return {kept:left.length,status:left[0]&&left[0].status,proj,toast:!!toastEl&&/Edit or cancel the task/.test(toastEl.innerText)&&/Open/.test(toastEl.innerText),blocks:(after.blocks||[]).length,due:after.due};})()`),
  expect:{kept:1,status:'todo',proj:1,toast:true,blocks:0,due:'2026-10-14'} },

{ name:'🔒 Jinky (head of CRM) opens Maria\'s "Prepare Tablo proposal": subtask "Price list" shows, "Private note" (shared with Ben only) does not, "1 restricted subtask" shows, and Done still counts 2 required subtasks (R11 S01)',
  requires:"window.__hnxTasksRules>=1",seed:SEED,
  run:new Function(`return (async()=>{${AS}as('maria');await sleep(6000);
    const p=HNXTASKS.create({title:'Prepare Tablo proposal',module:'crm',due:'2026-10-20',visibility:'team'});
    const s1=HNXTASKS.create({title:'Price list',parentId:p.id,required:true,owner:'maria',module:'crm',due:'2026-10-18'});
    const s2=HNXTASKS.create({title:'Private note',parentId:p.id,required:true,owner:'maria',module:'crm',due:'2026-10-18'});
    HNXTASKS.share(s2.id,'users',['ben']);
    as('jinky');HNXTASKS.drawer(p.id);await sleep(300);const txt=document.body.innerText;
    const why=HNXTASKS.doneCheck(HNXTASKS.load().find(x=>x.id===p.id));
    try{document.querySelectorAll('[id^=hnxTk],#hnxTaskDrawer').forEach(x=>x.remove());}catch(e){}
    return {s1:/Price list/.test(txt),s2:/Private note/.test(txt),restricted:/1 restricted subtask\\b/.test(txt),req:why.some(w=>/^2 required subtask/.test(w))};})()`),
  expect:{s1:true,s2:false,restricted:true,req:true} },

{ name:'☑ 1 required subtask done + 1 optional subtask open → Done is refused with "1 optional subtask still open — close or cancel it"; once the optional one is cancelled → Done (R11 S01)',
  requires:"window.__hnxTasksRules>=1",seed:SEED,
  run:new Function(`return (async()=>{${AS}as('maria');await sleep(6000);
    const q=HNXTASKS.create({title:'Send samples',module:'crm',due:'2026-10-20',visibility:'team'});
    const a=HNXTASKS.create({title:'Pack',parentId:q.id,required:true,owner:'maria',module:'crm',due:'2026-10-19'});
    const b=HNXTASKS.create({title:'Add a thank-you card',parentId:q.id,required:false,owner:'maria',module:'crm',due:'2026-10-19'});
    const r1=HNXTASKS.setStatus(a.id,'done');T.length=0;const r2=HNXTASKS.setStatus(q.id,'done');const msg=T.join(' | ');
    const r3=HNXTASKS.setStatus(b.id,'cancelled',{reason:'not needed'});const r4=HNXTASKS.setStatus(q.id,'done');
    return {r:[r1,r2,r3,r4],msg:/1 optional subtask still open — close or cancel it/.test(msg),status:HNXTASKS.load().find(x=>x.id===q.id).status};})()`),
  expect:{r:[true,false,true,true],msg:true,status:'done'} },

{ name:'📅 Jinky (head) assigns "Visit Tablo" to Maria with no due date → refused, "Assigned work needs a due date"; Maria\'s own task with no due → created; origins: assigned, module:meetings, plan/series, and update({origin:"self"}) changes nothing (R11 S01)',
  requires:"window.__hnxTasksRules>=1",seed:SEED,
  run:new Function(`return (async()=>{${AS}as('jinky');await sleep(6000);T.length=0;
    const x=HNXTASKS.create({title:'Visit Tablo',owner:'maria',module:'crm'});const msg=T.some(m=>/Assigned work needs a due date/.test(m));
    const asg=HNXTASKS.create({title:'Visit Tablo',owner:'maria',module:'crm',due:'2026-10-21'});
    const met=HNXTASKS.create({title:'Send the minutes',module:'meetings',origin:'module:meetings',due:'2026-10-13'});
    const ser=HNXTASKS.create({title:'Weekly stock count',module:'crm',seriesId:'SER-1',nominal:'2026-10-12',due:'2026-10-12'});
    as('maria');const own=HNXTASKS.create({title:'Call back Mr Cruz',module:'crm'});
    as('jinky');HNXTASKS.update(asg.id,{origin:'self'});const after=HNXTASKS.load().find(t=>t.id===asg.id);
    return {refused:x===null,msg,own:!!own,origins:[asg.origin,met.origin,ser.origin,own&&own.origin],kept:after.origin};})()`),
  expect:{refused:true,msg:true,own:true,origins:['assigned','module:meetings','plan/series','self'],kept:'assigned'} },

{ name:'📜 250 history entries on one task (created + 249 due changes) are all readable, the first is still "created", at most 200 stay on the task and the older ones are in the archive (R11 S01)',
  requires:"window.__hnxTasksRules>=1",seed:SEED,
  run:new Function(`return (async()=>{${AS}as('maria');await sleep(6000);
    const t=HNXTASKS.create({title:'Long running follow-up',module:'crm',due:'2026-11-01'});
    for(let i=0;i<249;i++){HNXTASKS.update(t.id,{due:(i%2?'2026-11-01':'2026-11-02')});}
    const all=HNXTASKS.fullHistory(t.id),inline=(HNXTASKS.load().find(x=>x.id===t.id).history||[]).length;
    const ar=(JSON.parse(localStorage.getItem('hydroPro_task_hist_archive_v1')||'{}')[t.id]||[]).length;
    return {all:all.length,first:all[0]&&all[0].what,inline,ar};})()`),
  expect:{all:250,first:'created',inline:200,ar:50} }
];
