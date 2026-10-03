/* v21.40 (Eyal): 🧭 Nexi Personal Assistant — per-user briefings from real stores, plain-words instructions → bounded drafts, idempotent scheduled runs with quiet hours, personal items owner-only, permission-filtered modules */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester Admin',passwordHash:'x',role:'admin',active:true,email:'tester@abapardes.com.ph',departments:['logistics']},
    {username:'syram',fullname:'Syra Mae Montesa',passwordHash:'x',role:'operator',department:'logistics',departments:['logistics'],active:true,email:'syram@gmail.com'}]));
  const td=new Date();const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const today=ymd(td), yest=ymd(new Date(td.getTime()-864e5));
  localStorage.setItem('hydroPro_tasks_v1',JSON.stringify([
    {id:'T1',title:'Send Hyatt consumption forecast',owner:'tester',status:'todo',due:yest,createdBy:'tester',visibility:'personal',module:'crm',priority:'normal',history:[],evidence:[],blocks:[],links:[]},
    {id:'T2',title:'Load Golden Phoenix boxes',owner:'syram',status:'todo',due:today,createdBy:'syram',visibility:'personal',module:'logistics',priority:'normal',history:[],evidence:[],blocks:[],links:[]}]));
  localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'E1',title:'Lunch with BPI',module:'general',type:'general',date:today,time:'11:30'}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🧭 Assistant: two users get different briefings from their own tasks (tester: overdue Hyatt forecast; syram: Golden Phoenix due today), the calendar item appears for both, saving the setup activates exactly one morning briefing, a manual run lands in the owner\'s inbox only, e-mail state is honest (nexi-notify not set up), and the team view never shows a personal item (v21.40)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(5000);as('tester');
    const bT=HNXPA.briefing('tester');const bS=HNXPA.briefing('syram');
    HNXPA.saveProfile({briefTime:'07:00',channel:'app',workDays:[1,2,3,4,5,6],setupDone:true,email:'tester@abapardes.com.ph'});
    HNXPA.open('pa_setup');await sleep(400);document.getElementById('paBT').value='07:00';document.getElementById('paCh').value='app';HNXPA.ui.saveSetup();await sleep(300);HNXPA.saveProfile({pausedAll:true});/* keep the 30-s scheduler out of this count */
    const items=HNXPA.items();const brief=items.filter(x=>x.category==='briefing');
    const r0=HNXPA.run(brief[0].id,{force:true,trigger:'manual'});const bm=HNXPA.get(brief[0].id);bm.delivery={channel:'mail'};HNXPA.save(bm);
    const r=HNXPA.run(brief[0].id,{force:true,trigger:'manual'});
    const inbT=HNXPA.inbox('tester'),inbS=HNXPA.inbox('syram');
    /* syram: a personal reminder must stay invisible to the admin's team view */
    as('syram');const p=HNXPA.interpret('Remind me tomorrow about my daughter\\'s doctor');p.text='x';HNXPA.adopt(p);HNXPA.activate(p.items[0].id);
    const sItems=HNXPA.items();
    as('tester');const tv=HNXPA.teamView();HNXPA.open('pa_day');await sleep(400);const txt=(document.getElementById('view-pa_day')||{}).innerText||'';
    return {tHas:/Hyatt/.test(bT.text),tNot:/Golden Phoenix/.test(bT.text),sHas:/Golden Phoenix/.test(bS.text),sNot:/Hyatt/.test(bS.text),cal:/Lunch with BPI/.test(bT.text)&&/Lunch with BPI/.test(bS.text),
      briefN:brief.length,active:brief[0].status,runState:r&&r.state,mail:r&&r.delivery.mail,inbT:inbT.length,inbS:inbS.length,inbOwner:inbT[0]&&inbT[0].user,
      sPersonal:sItems.filter(x=>x.scope==='personal').length,sActive:sItems[0]&&sItems[0].status,tvPersonal:tv.filter(x=>/doctor/i.test(x.title)).length,day:/Hyatt/.test(txt)};})();`),
  expect:{tHas:true,tNot:false,sHas:true,sNot:false,cal:true,briefN:1,active:'active',runState:'done',mail:'unavailable: nexi-notify not set up on this device',inbT:2,inbS:0,inbOwner:'tester',sPersonal:1,sActive:'active',tvPersonal:0,day:true} },
{ name:'🧭 Assistant: plain words are read without AI — "Brief me at 6:30 AM on weekdays" → schedule 06:30 Mon–Fri; "Follow up on my team\'s overdue work" → team follow-up; "Remind me about the dentist" with no date → draft with a question and Activate refused; "Call me for urgent production problems" → blocked (calling not connected) and Activate refused; "E-mail summaries" → blocked (no mailbox connection) (v21.40)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(5000);as('tester');
    const r=HNXPA.interpret("Brief me at 6:30 AM on weekdays. Follow up on my team's overdue work. Remind me about the dentist. Call me for urgent production problems. Send me e-mail summaries and reply drafts.");r.text='x';HNXPA.adopt(r);
    const [b,f,d,c,m]=r.items;
    const actD=HNXPA.activate(d.id),actC=HNXPA.activate(c.id),actB=HNXPA.activate(b.id);
    const D=HNXPA.get(d.id),C=HNXPA.get(c.id);
    return {n:r.items.length,bTime:b.trigger.time,bDays:b.trigger.days.join(''),bCat:b.category,fCat:f.category,fScope:f.scope,dMissing:d.missing[0],q:r.questions.length,actD,dStatus:D.status,cBlocked:/not connected/.test(c.blockedWhy),actC,cStatus:C.status,mBlocked:/mailbox|mail account/i.test(m.blockedWhy),actB};})();`),
  expect:{n:5,bTime:'06:30',bDays:'12345',bCat:'briefing',fCat:'followup',fScope:'team',dMissing:'date',q:1,actD:false,dStatus:'blocked',cBlocked:true,actC:false,cStatus:'blocked',mBlocked:true,actB:true} },
{ name:'🧭 Assistant: the scheduler is idempotent and respects quiet hours — briefing at 05:00 with quiet hours 21:00–06:00 runs at 06:00 not 05:30, a second tick the same day runs nothing, a weekday outside the working days runs nothing, Pause all stops runs, and a dated reminder runs once on its day while the briefing of that day still runs (v21.40)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(5000);as('tester');
    HNXPA.saveProfile({quietFrom:'21:00',quietTo:'06:00',briefTime:'05:00',workDays:[1,2,3,4,5],channel:'app',setupDone:true});
    const b=(function(){const r=HNXPA.interpret('Brief me at 5:00 AM on weekdays');r.text='x';HNXPA.adopt(r);return r.items[0];})();HNXPA.activate(b.id);
    const eff=HNXPA.effectiveTime(HNXPA.profile(),HNXPA.get(b.id));
    const mon=new Date('2026-10-05T05:30:00');const n1=HNXPA.tick(mon);
    const mon2=new Date('2026-10-05T06:05:00');const n2=HNXPA.tick(mon2);const n3=HNXPA.tick(new Date('2026-10-05T09:00:00'));
    const sun=new Date('2026-10-04T09:00:00');const n4=HNXPA.tick(sun);
    HNXPA.saveProfile({pausedAll:true});const n5=HNXPA.tick(new Date('2026-10-06T09:00:00'));HNXPA.saveProfile({pausedAll:false});
    const rem=(function(){const r=HNXPA.interpret('Remind me on 2026-10-07 about the BPI lunch at 10:00');r.text='x';HNXPA.adopt(r);return r.items[0];})();const act=HNXPA.activate(rem.id);
    const n6=HNXPA.tick(new Date('2026-10-07T09:00:00')),n7=HNXPA.tick(new Date('2026-10-07T10:30:00')),n8=HNXPA.tick(new Date('2026-10-07T11:00:00'));
    const runs=HNXPA.runs().filter(r=>r.user==='tester');
    return {eff,n1,n2,n3,n4,n5,remDate:rem.trigger.date,remTime:rem.trigger.time,act,n6,n7,n8,runs:runs.length,remDone:HNXPA.get(rem.id).status};})();`),
  expect:{eff:'06:00',n1:0,n2:1,n3:0,n4:0,n5:0,remDate:'2026-10-07',remTime:'10:00',act:true,n6:1,n7:1,n8:0,runs:3,remDone:'done'} },
{ name:'🧭 Assistant: modules are permission-filtered — the admin sees every module, the logistics operator sees fewer and no Administration/Payroll; the six screens register under Executive Assistant and each renders without a page error (v21.40)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(5000);as('tester');const adminMods=HNXPA.modules().map(m=>m.id);
    as('syram');const opMods=HNXPA.modules().map(m=>m.id);
    const views=(MODULES.assistant.views||[]).map(v=>v.id);const ok=[];for(const v of HNXPA.VIEWS.map(x=>x[0])){HNXPA.open(v);await sleep(250);ok.push(!!(document.getElementById('view-'+v)||{}).innerText&&window.currentView===v);}
    return {adminN:adminMods.length>=15,opFewer:opMods.length<adminMods.length,opNoAdmin:opMods.indexOf('admin')<0,opNoPayroll:opMods.indexOf('payroll')<0,opHasLog:opMods.indexOf('logistics')>=0,views:HNXPA.VIEWS.every(v=>views.indexOf(v[0])>=0),rendered:ok.every(Boolean)};})();`),
  expect:{adminN:true,opFewer:true,opNoAdmin:true,opNoPayroll:true,opHasLog:true,views:true,rendered:true} },
];
