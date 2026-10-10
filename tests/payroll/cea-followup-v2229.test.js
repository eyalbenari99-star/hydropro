/* v22.29 trial (CEA Follow-up Desk, rebuilt after the reset): escalation in WORKING days with one inbox note per person per item per
   level, snooze never past the official deadline, every follow-up date change has a reason and a log, and the agent's settings. */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},{username:'amy',fullname:'Dr Amy Patdu',role:'admin',active:true},
    {username:'edelyn',fullname:'Edelyn Cruz',role:'staff',active:true},{username:'rea',fullname:'Rea Santos',role:'staff',active:true}]));
  localStorage.setItem('hydroPro_cea_cases_v1','[]');localStorage.setItem('hydroPro_cea_reg_v1','[]');localStorage.setItem('hydroPro_cea_reqs_v1','[]');
  localStorage.setItem('hydroPro_cea_reminders_v1','{}');localStorage.setItem('hydroPro_cea_esc_sent_v1','{}');localStorage.setItem('hydroPro_cea_agent_cfg_v1','{}');localStorage.setItem('hydroPro_pa_inbox_v1','[]');
};
module.exports=[
{ name:'🏛 CEA escalation in working days: ECC renewal due Fri 2 Oct → Mon 5 Oct 1 working day = no level, Tue 6 Oct = manager, Fri 9 Oct = executive; a task with no owner since Tue 6 Oct = management on Thu 8 Oct; on Fri 9 Oct 3 inbox notes go out (Eyal, Dr Amy, Edelyn) once — a second run adds none (v22.29)',
  requires:"!!(window.CEAFU&&CEAFU.escalation&&CEAFU.escalateNow)",
  seed:SEED,
  run:async()=>{
    window.showToast=()=>{};const g=window.getCurrentUser;window.getCurrentUser=()=>({username:'edelyn',fullname:'Edelyn Cruz',role:'staff',active:true});
    localStorage.setItem('hydroPro_cea_tasks_v1',JSON.stringify([{id:'t1',title:'File the ECC renewal',status:'open',owner:'rea',due:'2026-10-02',createdAt:'2026-09-20'},
      {id:'t2',title:'Pick up the BFAR certificate',status:'open',owner:'',due:'2026-10-30',createdAt:'2026-10-06'}]));
    const I=CEAFU.items();const t1=I.find(i=>i.id==='t1'),t2=I.find(i=>i.id==='t2');
    const lv=d=>CEAFU.escalation(t1,d).level||'none';
    const a=[lv('2026-10-05'),lv('2026-10-06'),lv('2026-10-09'),CEAFU.escalation(t1,'2026-10-06').wd];
    const b=CEAFU.escalation(t2,'2026-10-08').level;
    const n1=CEAFU.escalateNow('2026-10-09'),n2=CEAFU.escalateNow('2026-10-09');
    const to=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')).map(x=>x.user).sort();
    window.getCurrentUser=g;
    return {a,b,n1,n2,to};},
  expect:{a:['none','manager','executive',2],b:'management',n1:3,n2:0,to:['amy','edelyn','eyal']} },

{ name:'🏛 Snooze: a permit renewal whose official deadline was yesterday cannot be snoozed (later / next workday / a date all refused); one due in 10 days snoozes to the next workday, and a review date after its deadline is refused (v22.29)',
  requires:"!!(window.CEAFU&&CEAFU.snooze)",
  seed:SEED,
  run:async()=>{
    window.showToast=()=>{};const g=window.getCurrentUser;window.getCurrentUser=()=>({username:'rea',fullname:'Rea Santos',role:'staff',active:true});
    const T=new Date();const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const y=new Date(T.getTime()-864e5),p10=new Date(T.getTime()+10*864e5),p20=new Date(T.getTime()+20*864e5);
    localStorage.setItem('hydroPro_cea_tasks_v1',JSON.stringify([{id:'s1',title:'Renew the water permit',status:'open',owner:'rea',due:ymd(y)},{id:'s2',title:'Submit the SMR',status:'open',owner:'rea',due:ymd(p10)}]));
    const past=[CEAFU.snooze('task:s1','later'),CEAFU.snooze('task:s1','next'),CEAFU.snooze('task:s1','date',ymd(p10))];
    const late=CEAFU.snooze('task:s2','date',ymd(p20)),next=CEAFU.snooze('task:s2','next');
    const R=JSON.parse(localStorage.getItem('hydroPro_cea_reminders_v1'));
    window.getCurrentUser=g;
    return {past,late,next,s1:!!(R['task:s1']&&R['task:s1'].snooze),s2:!!(R['task:s2']&&R['task:s2'].snooze&&R['task:s2'].snooze<=ymd(p10))};},
  expect:{past:[false,false,false],late:false,next:true,s1:false,s2:true} },

{ name:'🏛 Follow-up dates: a change without a reason is refused; 20 Oct "waiting on BFAR" then 22 Oct "agency moved the inspection" → both kept in the log with who, old and new date (v22.29)',
  requires:"!!(window.CEAFU&&CEAFU.setFollow)",
  seed:SEED,
  run:async()=>{
    window.showToast=()=>{};const g=window.getCurrentUser;window.getCurrentUser=()=>({username:'edelyn',fullname:'Edelyn Cruz',role:'staff',active:true});
    localStorage.setItem('hydroPro_cea_tasks_v1',JSON.stringify([{id:'f1',title:'BFAR inspection',status:'open',owner:'rea',due:'2026-10-31'}]));
    const r0=CEAFU.setFollow('task:f1','2026-10-20','');
    const r1=CEAFU.setFollow('task:f1','2026-10-20','waiting on BFAR'),r2=CEAFU.setFollow('task:f1','2026-10-22','agency moved the inspection');
    const L=(JSON.parse(localStorage.getItem('hydroPro_cea_reminders_v1'))['task:f1']||{}).log||[];
    window.getCurrentUser=g;
    return {r:[r0,r1,r2],log:L.map(x=>[x.by,x.old,x.new,x.why])};},
  expect:{r:[false,true,true],log:[['edelyn','','2026-10-20','waiting on BFAR'],['edelyn','2026-10-20','2026-10-22','agency moved the inspection']]} },

{ name:'🏛 Agent settings: Edelyn saves manager after 3 working days and reads it back; Paused sends no escalation note; Rea (not a supervisor) cannot save (v22.29)',
  requires:"!!(window.CEAFU&&CEAFU.saveCfg&&CEAFU.cfg)",
  seed:SEED,
  run:async()=>{
    window.showToast=()=>{};const g=window.getCurrentUser;
    localStorage.setItem('hydroPro_cea_tasks_v1',JSON.stringify([{id:'p1',title:'File the ECC renewal',status:'open',owner:'rea',due:'2026-10-01',createdAt:'2026-09-20'}]));
    window.getCurrentUser=()=>({username:'edelyn',fullname:'Edelyn Cruz',role:'staff',active:true});
    const ok=CEAFU.saveCfg({managerAfter:3,paused:true});const back=[CEAFU.cfg().managerAfter,CEAFU.cfg().paused];
    const sentPaused=CEAFU.escalateNow('2026-10-10');
    window.getCurrentUser=()=>({username:'rea',fullname:'Rea Santos',role:'staff',active:true});
    const rea=CEAFU.saveCfg({paused:false});
    window.getCurrentUser=g;
    return {ok,back,sentPaused,rea,still:CEAFU.cfg().paused};},
  expect:{ok:true,back:[3,true],sentPaused:0,rea:false,still:true} }
];
