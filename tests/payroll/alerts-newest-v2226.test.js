/* v22.26 (Eyal, 10 Oct 2026, screenshot "3517 open calls from this module" full of "Pool Pool 5 · pH HIGH (6.70)" and
   "AUTO-ESCALATED: Priority call has been NEW for over 1 day"; and "Nexi was blocked 11 s — 10,615 ms in checkEscalations"):
   "there is no open call by this info if the next day the data changed — meaning it was fixed or some action changed it — unless it
   is still not OK". An automatic alert stays open ONLY while the newest data still shows the problem, and then as ONE call. */
const LOCAL_TODAY='const __d=new Date();const T=__d.getFullYear()+"-"+String(__d.getMonth()+1).padStart(2,"0")+"-"+String(__d.getDate()).padStart(2,"0");'
  +'const day=n=>{const x=new Date(__d.getTime()-n*864e5);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};';
const PULLED='window.__hnxPulledOk=true;';
const fn=body=>new Function('return (async()=>{const CLOSED=c=>{try{return window.__hnxCallStatus.closed(c);}catch(e){}return /^closed/.test(String(c&&c.status||""));};'
  +'const waitFor=async(f,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(f())return true;await sleep(300);}return f();};'+body+'})();');
/* 120 automatic pool calls of the last 3 days (40 per pool, every 4th one escalated priority→urgent), each with its task, the old
   per-DAY ledger keys, and one call a person raised — today's 08:00 readings: Pool 5 pH 6.30 (OK), Pool 6 pH 7.10 (critical),
   Pool 9 pH 6.70 (warning band) */
const FLOOD=LOCAL_TODAY+PULLED+`
  localStorage.setItem('hydroPro_irr_pool',JSON.stringify({[T]:{P05:{'08:00':{pH:'6.3'}},P06:{'08:00':{pH:'7.1'}},P09:{'08:00':{pH:'6.7'}}}}));
  const now=Date.now();const tasks=[],calls=[],auto={};
  [['P05','Pool 5','6.70'],['P06','Pool 6','7.10'],['P09','Pool 9','6.70']].forEach(([pid,lbl,v])=>{
    for(let i=0;i<40;i++){const d=1+(i%3);const at=now-d*864e5-i*60000;const tid='T_'+pid+'_'+i,cid='C_'+pid+'_'+i;
      const subj='💧 Pool '+lbl+' · pH HIGH ('+v+')';const esc=i%4===0;
      tasks.push({id:tid,title:subj,description:'x',status:'not_started',priority:esc?'urgent':'priority',createdAt:at,createdBy:'system',category:'auto_pool_sensor',sourceModule:'irr_pools',scheduledDate:day(d),durationDays:1,gantt:[],materials:[]});
      calls.push({id:cid,subject:subj,description:'x',priority:esc?'urgent':'priority',status:'new_call',group:'operations',department:'irrigation',areaText:lbl,sourceModule:'irr_pools',
        raisedBy:'system',raisedAt:at,createdAt:at,updatedAt:at,maintTaskId:tid,automatic:true,escalated:esc,
        updates:esc?[{ts:at,by:'system',note:'🚨 AUTO-ESCALATED: Priority call has been NEW for over 1 day · priority bumped from PRIORITY to URGENT'}]:[]});
      if(i<3)auto[day(d)+'::pool::'+pid+'::pH']={maintTaskId:tid,callId:cid,status:'oor',createdAt:at};}});
  calls.push({id:'C_HAND',subject:'Pool 6 pump noisy',description:'x',priority:'priority',status:'new_call',group:'operations',department:'irrigation',areaText:'Pool 6',sourceModule:'irr_pools',raisedBy:'tester',raisedAt:now-3*864e5,createdAt:now-3*864e5});
  localStorage.setItem('hydroPro_maint_tasks',JSON.stringify(tasks));localStorage.setItem('hydroPro_calls',JSON.stringify(calls));localStorage.setItem('hydroPro_it_auto_tasks',JSON.stringify(auto));`;
module.exports=[
{ name:'🧹 Screenshot case: 120 automatic pool calls of 3 days (Pool 5 / 6 / 9, 40 each, 30 escalated) + today 08:00 Pool 5 pH 6.30 OK, Pool 6 pH 7.10 critical, Pool 9 pH 6.70 warning → Pool 5 0 open, Pool 6 exactly 1 open, Pool 9 0 open, the hand-raised call still open; every round closes ≤ 30 calls (24 in the sweep + the live alarms; Data Safety holds at 60 of 121); every closed call says why; no call is escalated (v22.26)',
  requires:"typeof window.hnxCloseBudget==='function'",
  seed:new Function(FLOOD),
  run:fn(`window.showToast=()=>{};const C=()=>loadCalls()||[];
    const open=lbl=>C().filter(c=>c.sourceModule==='irr_pools'&&c.automatic&&c.areaText===lbl&&!CLOSED(c)).length;
    let rounds=0,maxRound=0,prev=C().filter(c=>!CLOSED(c)).length;
    for(let i=0;i<14;i++){window.__hnxCloseB={};await sleep(5600);rounds++;const now=C().filter(c=>!CLOSED(c)).length;maxRound=Math.max(maxRound,prev-now);prev=now;
      if(open('Pool 5')===0&&open('Pool 6')===1&&open('Pool 9')===0)break;}
    const closed=C().filter(c=>c.automatic&&CLOSED(c));
    const why=closed.every(c=>/Underlying issue appears resolved|duplicate|superseded|back in range|WARNING band/.test(JSON.stringify(c.updates||[])+String(c.closeNote||'')));
    const p9=C().filter(c=>c.areaText==='Pool 9'&&c.automatic&&CLOSED(c)).map(c=>String(c.closeNote||'')).filter(n=>/WARNING band/.test(n)).length;
    const tasksOpen=(loadMaintTasks()||[]).filter(t=>t.category==='auto_pool_sensor'&&t.status!=='done').length;
    const hand=C().find(c=>c.id==='C_HAND');
    return {p5:open('Pool 5'),p6:open('Pool 6'),p9:open('Pool 9'),hand:CLOSED(hand)?'closed':'open',tasksOpen,
      roundOk:maxRound<=30,why,p9warnNote:p9>=1,escalatedNow:C().filter(c=>c.automatic&&!CLOSED(c)&&c.escalatedAt&&c.escalatedAt>Date.now()-120000).length};`),
  expect:{p5:0,p6:1,p9:0,hand:'open',tasksOpen:1,roundOk:true,why:true,p9warnNote:true,escalatedNow:0} },

{ name:'⏰ Escalation: an automatic IT call NEW for 3 days stays PRIORITY and is not escalated; a hand-raised call NEW for 3 days is escalated to URGENT; 300 automatic calls make the focus check return in < 1,500 ms and it runs again only after 5 minutes (v22.26)',
  requires:"typeof window.hnxCloseBudget==='function'",
  seed:function(){const now=Date.now(),old=now-3*864e5;const calls=[];
    calls.push({id:'A1',subject:'CCTV Gate cam offline',priority:'priority',status:'new_call',group:'it',department:'it',areaText:'Gate',sourceModule:'it',raisedBy:'system',automatic:true,raisedAt:old,createdAt:old});
    calls.push({id:'H1',subject:'Door lock broken',priority:'priority',status:'new_call',group:'operations',department:'maintenance',areaText:'Office',sourceModule:'',raisedBy:'tester',raisedAt:old,createdAt:old});
    for(let i=0;i<300;i++)calls.push({id:'AX'+i,subject:'Fan '+i+' fault',priority:'priority',status:'new_call',department:'maintenance',areaText:'GH'+(i%9+1),sourceModule:'fans',raisedBy:'system',automatic:true,raisedAt:old-i,createdAt:old-i});
    localStorage.setItem('hydroPro_calls',JSON.stringify(calls));},
  run:async()=>{await sleep(9500);const C=()=>loadCalls()||[];const a=C().find(c=>c.id==='A1'),h=C().find(c=>c.id==='H1');
    const t0=performance.now();window.dispatchEvent(new Event('focus'));const ms=performance.now()-t0;
    const n0=JSON.stringify(C()).length;window.dispatchEvent(new Event('focus'));const same=JSON.stringify(C()).length===n0;
    return {auto:a.priority+'/'+(a.escalated?'esc':'-'),hand:h.priority+'/'+(h.escalated?'esc':'-'),fast:ms<1500,same};},
  expect:{auto:'priority/-',hand:'urgent/esc',fast:true,same:true} },

{ name:'🧪 Typo-scale reading: PRJ11-A EC 93.00 saved → 0 calls, 0 critical issues, the latest reading is "invalid"; Pool 2 EC 2.40 (critical) on the same round → 1 call (v22.26)',
  requires:"typeof window.hnxIrrImplausible==='function'",
  seed:new Function(LOCAL_TODAY+PULLED+`localStorage.setItem('hydroPro_irr_pool',JSON.stringify({[T]:{P11A:{'08:00':{EC:'93'}},P02:{'08:00':{EC:'2.4'}}}}));localStorage.removeItem('hydroPro_it_auto_tasks');`),
  run:fn(`window.showToast=()=>{};await waitFor(()=>(loadCalls()||[]).some(c=>c.areaText&&/2/.test(c.areaText)&&c.sourceModule==='irr_pools'),15000);await sleep(6000);
    const calls=(loadCalls()||[]).filter(c=>c.sourceModule==='irr_pools'&&!CLOSED(c));
    const L=window.irrLatestReadings();const k=Object.keys(L).find(p=>/11/.test(p));
    return {prj:calls.filter(c=>/PRJ11|P11A/.test(c.subject+c.areaText)).length,p2:calls.filter(c=>/Pool 2|P02/.test(c.subject+' '+c.areaText)).length,
      sev:k&&L[k].EC?L[k].EC.sev:'-',crit:(loadIssues()||[]).filter(i=>i.module==='irrigation'&&i.priority==='critical'&&/P11A|PRJ11/.test(i.title)).length};`),
  expect:{prj:0,p2:1,sev:'invalid',crit:0} },

{ name:'🧹 Janitor: 3 open automatic "CCTV Gate cam offline" calls (8, 9, 10 Oct) → 1 open (the newest), 2 closed "duplicate"; a hand-raised duplicate stays open; an automatic URGENT call of 20 Sep → closed once ("before 1 Oct"), a hand-raised urgent call of 20 Sep stays; a call whose task is done gets status closed_finalize (v22.26)',
  requires:"window.hnxAlertJanitor&&typeof window.hnxAlertJanitor.run==='function'",
  seed:function(){const now=Date.now(),d=n=>now-n*864e5,sep=Date.parse('2026-09-20T10:00:00+08:00');
    const c=(id,at,extra)=>Object.assign({id,subject:'CCTV Gate cam offline',priority:'priority',status:'new_call',department:'it',areaText:'Gate',sourceModule:'it',raisedBy:'system',automatic:true,raisedAt:at,createdAt:at},extra||{});
    localStorage.setItem('hydroPro_calls',JSON.stringify([c('D1',d(2)),c('D2',d(1)),c('D3',d(0)),c('DH',d(1),{raisedBy:'tester',automatic:false}),
      {id:'S1',subject:'Pump 4 pressure critical',priority:'urgent',status:'new_call',department:'maintenance',areaText:'Pump 4',sourceModule:'equip',raisedBy:'system',automatic:true,raisedAt:sep,createdAt:sep},
      {id:'S2',subject:'Roof leak GH3',priority:'urgent',status:'new_call',department:'maintenance',areaText:'GH3',sourceModule:'',raisedBy:'tester',raisedAt:sep,createdAt:sep},
      {id:'TD',subject:'Valve 2 check',priority:'need',status:'new_call',department:'maintenance',areaText:'V2',sourceModule:'',raisedBy:'tester',raisedAt:d(1),createdAt:d(1),maintTaskId:'TK_DONE'}]));
    localStorage.setItem('hydroPro_maint_tasks',JSON.stringify([{id:'TK_DONE',title:'Valve 2 check',status:'done',doneDate:'2026-10-09',createdAt:d(1)}]));},
  run:async()=>{window.__hnxPulledOk=true;window.__hnxCloseB={};const r=window.hnxAlertJanitor.run();
    const C=id=>(loadCalls()||[]).find(c=>c.id===id)||{};const cl=id=>window.__hnxCallStatus.closed(C(id))?'closed':'open';
    return {d1:cl('D1'),d2:cl('D2'),d3:cl('D3'),dh:cl('DH'),s1:cl('S1'),s2:cl('S2'),td:C('TD').status,
      dupNote:/duplicate/.test(String(C('D1').closeNote||'')),septNote:/before 1 Oct/.test(String(C('S1').closeNote||'')),closed:r&&r.closed};},
  expect:{d1:'closed',d2:'closed',d3:'open',dh:'open',s1:'closed',s2:'open',td:'closed_finalize',dupNote:true,septNote:true,closed:4} },

{ name:'💧 Instruments before the round: Pool 1 read yesterday 16:00 (54 cm, pH 6.20, EC 1.80), nothing yet at today 08:00 → the tank shows water at 54 cm marked "last … 16:00", the pH and EC meters show the blinking value line at 6.20 / 1.80 with "last …", the valve still says NO LEVEL; motion is on with Lite on (v22.26)',
  requires:"window.hnxIrrViz&&window.hnxIrrViz.__v==='1.1'",
  seed:new Function(LOCAL_TODAY+`localStorage.setItem('hydroPro_irr_pool',JSON.stringify({[day(1)]:{P01:{'16:00':{water:'54',pH:'6.2',manualPH:'6.2',EC:'1.8',manualEC:'1.8'}}}}));localStorage.setItem('hydroPro_lite_v1','1');`),
  run:fn(`window.showToast=()=>{};switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(1200);
    const tank=document.querySelector('.hnx-iv.iv-tank[data-pool="P01"]'),ph=document.querySelector('.hnx-iv.iv-ph[data-pool="P01"]'),ec=document.querySelector('.hnx-iv.iv-ec[data-pool="P01"]');
    const wat=tank&&tank.querySelector('.iv-wat');const asof=tank&&tank.querySelector('.iv-asof');
    const vl=el=>{const l=el&&el.querySelector('.iv-vline');return l?parseFloat(l.style.top)>0:false;};
    const valve=document.querySelector('.hnx-iv.iv-valve[data-pool="P01"]');
    return {water:!!wat&&parseFloat(wat.style.height)>0,big:tank?/54/.test(tank.querySelector('.iv-big').textContent):false,last:!!asof&&!asof.hidden&&/16:00/.test(asof.textContent),
      stale:!!tank&&tank.classList.contains('iv-stale'),phLine:vl(ph),ecLine:vl(ec),phLast:!!ph&&/last/.test(ph.querySelector('.iv-sub').textContent),
      valve:valve?/NO LEVEL/.test(valve.textContent):null,motion:document.documentElement.classList.contains('hnx-iv-m-always'),wave:!!(tank&&tank.querySelector('.iv-wave'))&&!tank.querySelector('.iv-wave').hidden};`),
  expect:{water:true,big:true,last:true,stale:true,phLine:true,ecLine:true,phLast:true,valve:true,motion:true,wave:true} }
];
