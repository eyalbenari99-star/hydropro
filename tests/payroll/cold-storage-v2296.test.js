/* v22.96 (Eyal, 13 Oct 2026, with a photo of the new cold-room control box and new.i-elitech.com: "I need to connect the cold storage
   to set up online temp which should be in maintenance check list to check daily and if below 4 degrees or above 8 degrees should warm
   if bellow 2 degrees or above 12 degrees critical warning maintenance"): ❄ COLD STORAGE.
   Two rooms (CS1 "Cold storage 1", CS2 "Cold storage 2"); bands 4.0–8.0 OK · below 4.0 / above 8.0 WARNING · below 2.0 / above 12.0
   CRITICAL; the daily check on ✅ Maintenance Monitoring Checklist (due 10:00); online readings from the nexi-cold worker (one feeder
   computer, a 10-minute lease); a critical opens ONE issue / call / task per room + day (fixed ids), notices to the head of
   Maintenance (jomel) and the owner (eyal), escalated after 60 min, closed after two readings back inside 4–8 °C.
   The page clock starts Tue 13 Oct 2026 07:40 Manila; at('hh:mm') moves it. window.fetch is stubbed inside the cases — no network. */
const NEW="typeof window.hnxColdRooms==='object'&&window.hnxColdRooms.v===2296";
const CLOCK=`const RD=Date;let off=RD.parse('2026-10-12T23:40:00Z')-RD.now();
  window.__tAt=function(iso){off=RD.parse(iso)-RD.now();};
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;`;
const SEED=new Function(CLOCK+`
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'reven',fullname:'Reven Estonio',passwordHash:'x',role:'operator',active:true,department:'maintenance'},
    {username:'jomel',fullname:'Jomel Galvo',passwordHash:'x',role:'supervisor',active:true,department:'maintenance'}]));
  localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'jomel'}));
  sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));
  /* TODAY's Maintenance checklist as a pre-v22.96 computer stored it (3 subjects, 16 items) */
  const its=(n,p)=>Array.from({length:n},(_,i)=>p+' '+(i+1));
  localStorage.setItem('hydroPro_maintenance_checklist_config',JSON.stringify({pm:{icon:'🔧',label:'Preventive Maintenance',items:its(5,'PM')},
    equipment:{icon:'⚙️',label:'Equipment Health',items:its(5,'EQ')},workorders:{icon:'🛠️',label:'Work Orders',items:its(6,'WO')}}));
  localStorage.setItem('hydroPro_maintenance_checklist',JSON.stringify({'pm::0':{status:'ok',lastChecked:'2026-10-13',updatedBy:'reven',updatedAt:Date.now()}}));`);
const OPEN=`const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  window.__hnxPulledOk=true;const toasts=[];window.showToast=m=>{toasts.push(String(m));};window.confirm=()=>true;
  const C=window.hnxColdRooms,T='2026-10-13',M=hm=>Date.parse(T+'T'+hm+':00+08:00'),at=hm=>__tAt(new Date(M(hm)).toISOString());
  const URL0='https://nexi-cold.test.workers.dev',TOK='tok-SECRET-cold-9f2';
  const R=(room,t,hm,src)=>({room,t,ts:M(hm),node:'elitech-mail',src:src||'elitech-mail',alarm:'',received:M(hm)+5000});
  const reply=rooms=>({ok:true,now:Date.now(),rooms,nodes:{'elitech-mail':{lastSeen:Date.now(),rooms:['CS1','CS2']}},elitech:{state:'not configured',at:Date.now()}});
  const stubFetch=fn=>{const calls=[];const f0=window.fetch;window.fetch=function(u,o){const s=String(u);if(s.indexOf('/cold/')<0)return f0.apply(this,arguments);
      const h=(o&&o.headers)||{};calls.push({u:s,auth:h.Authorization||h.authorization||'',method:(o&&o.method)||'GET'});const r=fn(s)||{body:{ok:true,points:[]}};
      return Promise.resolve(new Response(JSON.stringify(r.body),{status:r.status||200,headers:{'Content-Type':'application/json'}}));};return calls;};
  const calls=()=>{try{delete window._perfCache._calls;}catch(e){}return (loadCalls()||[]).filter(c=>c&&c.sourceModule==='maint_cold');};
  const issues=()=>loadIssues().filter(i=>i&&/^ISS_cold_/.test(i.id||''));
  const tasks=()=>loadMaintTasks().filter(t=>t&&/^TSK_cold_/.test(t.id||''));
  const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x&&x.itemId==='cold').map(x=>x.id).sort();
  const clst=()=>JSON.parse(localStorage.getItem('hydroPro_maintenance_checklist')||'{}');
  const ccfg=()=>JSON.parse(localStorage.getItem('hydroPro_maintenance_checklist_config')||'{}');
  const box=(mod,name)=>(HNX_COCKPIT_SUBJECTS[mod].find(x=>x.name===name)||{compute:()=>({})}).compute();
  const card=id=>document.querySelector('.hnx-cr-card[data-room="'+id+'"]');
  const cardTxt=(id,k)=>{const c=card(id),e=c&&c.querySelector('[data-k="'+k+'"]');return e?e.textContent:null;};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
module.exports=[
{ name:'❄ Bands (Eyal 13 Oct): 5.0 ok · 4.0 ok · 8.0 ok · 3.9 warn · 8.1 warn · 2.0 warn · 12.0 warn · 1.9 critical · 12.1 critical; −45 and 75 invalid (no alarm); sides 3.9 low, 8.1 high, 1.9 low, 12.1 high; "5,6" (comma) ok and 8.04 rounds to 8.0 → ok',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`return {bands:[5.0,4.0,8.0,3.9,8.1,2.0,12.0,1.9,12.1,-45,75].map(v=>C.band(v)),sides:[3.9,8.1,1.9,12.1].map(v=>C.bandOf(v).side),comma:C.band('5,6'),r:C.bandOf(8.04).band,text:C.band('abc')};`),
  expect:{bands:['ok','ok','ok','warn','warn','warn','warn','crit','crit','invalid','invalid'],sides:['low','high','low','high'],comma:'ok',r:'ok',text:'invalid'} },

{ name:'❄ Daily typed 07:52, no feed: CS1 5.0 → ✓ OK, CS2 3.9 → ⚠ WARNING + notice COLD_warn_CS2_2026-10-13_jomel, no call/issue; checklist subject cold_storage appended after pm/equipment/workorders (pm::0 kept), cold_storage::0 ok "5.0 °C 07:52 (✍ typed)" · ::1 warning; _modChecklistSet on cold_storage refused (toast), on pm still works',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('07:52');const a=C.saveDaily('CS1','5.0'),b=C.saveDaily('CS2','3.9');
    const keys=Object.keys(ccfg()),st=clst();
    const r=window._modChecklistSet('maintenance','cold_storage',0,'status','critical');
    window._modChecklistSet('maintenance','pm',1,'status','ok');const st2=clst();
    return {a,b,inbox:inbox(),calls:calls().length,issues:issues().length,keys,items:(ccfg().cold_storage||{}).items,pm0:st['pm::0'].status,
      c0:[st['cold_storage::0'].status,st['cold_storage::0'].notes,st['cold_storage::0'].checkedBy],c1:[st['cold_storage::1'].status,st['cold_storage::1'].notes],
      refused:r===false&&st2['cold_storage::0'].status==='ok',lockToast:toasts.filter(t=>/These rows are filled from the ❄ Daily box above/.test(t)).length,pm1:(st2['pm::1']||{}).status};`),
  expect:{a:{ok:true,band:'ok',side:''},b:{ok:true,band:'warn',side:'low'},inbox:['COLD_warn_CS2_2026-10-13_jomel'],calls:0,issues:0,keys:['pm','equipment','workorders','cold_storage'],
    items:['Cold storage temperature (°C) — Cold storage 1','Cold storage temperature (°C) — Cold storage 2'],pm0:'ok',c0:['ok','5.0 °C 07:52 (✍ typed)','Eyal Ben Ari'],c1:['warning','3.9 °C 07:52 (✍ typed)'],
    refused:true,lockToast:1,pm1:'ok'} },

{ name:'❄ 1.9 °C typed on CS1 at 07:52 → ONE issue ISS_cold_2026-10-13_CS1 (critical, maintenance) + ONE call CALL_cold_2026-10-13_CS1 (urgent, new_call, maint_cold, maintenance, maintTaskId TSK_cold_2026-10-13_CS1) + task (urgent, auto_cold_temp); notices COLD_crit_CS1_2026-10-13_1_jomel / _eyal; act() twice more and 12.4 at 07:55 → still 1 / 1 / 1, the call has 2 update lines (the 2nd "🤖 Latest reading 12.4 °C (07:55, ✍ hand) — still CRITICAL (HIGH)")',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('07:52');C.saveDaily('CS1','1.9');
    const c=calls()[0]||{},i=issues()[0]||{},t=tasks()[0]||{};
    const first={calls:calls().map(x=>x.id),status:c.status,pri:c.priority,src:c.sourceModule,dept:c.department,task:c.maintTaskId,room:c.coldRoom,subject:c.subject,
      issue:[i.id,i.priority,i.module,i.status,i.title],tsk:[t.id,t.priority,t.category,t.status],desc:/^Cold storage temperature is CRITICAL: 1\\.9 °C at 07:52 \\(✍ typed by Eyal Ben Ari\\)\\.\\n• Room: Cold storage 1 \\(COLD STORAGE\\)\\n• OK 4\\.0–8\\.0 °C/.test(c.description||'')};
    const n0=inbox();C.act('CS1');C.act('CS1');
    at('07:55');C.addReading('CS1','12.4');
    const c2=calls()[0]||{};
    return {first,n0,counts:[calls().length,issues().length,tasks().length],lines:(c2.updates||[]).length,last:((c2.updates||[]).slice(-1)[0]||{}).note,coldTs:c2.coldTs>=M('07:55')&&c2.coldTs<M('07:55')+5000};`),
  expect:{first:{calls:['CALL_cold_2026-10-13_CS1'],status:'new_call',pri:'urgent',src:'maint_cold',dept:'maintenance',task:'TSK_cold_2026-10-13_CS1',room:'CS1',subject:'❄ Cold storage 1 · temperature CRITICAL LOW (1.9 °C)',
      issue:['ISS_cold_2026-10-13_CS1','critical','maintenance','open','Cold storage 1 temperature CRITICAL (1.9 °C)'],tsk:['TSK_cold_2026-10-13_CS1','urgent','auto_cold_temp','not_started'],desc:true},
    n0:['COLD_crit_CS1_2026-10-13_1_eyal','COLD_crit_CS1_2026-10-13_1_jomel'],counts:[1,1,1],lines:2,last:'🤖 Latest reading 12.4 °C (07:55, ✍ hand) — still CRITICAL (HIGH)',coldTs:true} },

{ name:'❄ Two computers raise 12.1 °C: copy B without the call raises CALL_cold_2026-10-13_CS1 too (same id, ISS / TSK too); after __hnxMergeGeneric of hydroPro_calls / hydroPro_issues_v2 / hydroPro_maint_tasks → exactly 1 call, 1 issue, 1 task',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('07:52');C.saveDaily('CS1','12.1');
    const K=['hydroPro_calls','hydroPro_issues_v2','hydroPro_maint_tasks'],A={};K.forEach(k=>A[k]=localStorage.getItem(k));
    K.forEach(k=>{const a=JSON.parse(localStorage.getItem(k)||'[]').filter(x=>!/_cold_/.test(String(x&&x.id||'')));localStorage.setItem(k,JSON.stringify(a));});
    try{delete window._perfCache._calls;}catch(e){}try{window.__hnxMaintIndexDrop();}catch(e){}
    at('07:53');C.act('CS1');
    const B={};K.forEach(k=>B[k]=localStorage.getItem(k));
    const bIds=K.map(k=>JSON.parse(B[k]).filter(x=>/_cold_/.test(String(x&&x.id||''))).map(x=>x.id)[0]);
    const n=K.map(k=>{const m=__hnxMergeGeneric(k,B[k],A[k]);const out=JSON.parse(m==null?B[k]:m);return out.filter(x=>/_cold_/.test(String(x&&x.id||''))).length;});
    const n2=K.map(k=>{const m=__hnxMergeGeneric(k,A[k],B[k]);const out=JSON.parse(m==null?A[k]:m);return out.filter(x=>/_cold_/.test(String(x&&x.id||''))).length;});
    return {bIds,n,n2};`),
  expect:{bIds:['CALL_cold_2026-10-13_CS1','ISS_cold_2026-10-13_CS1','TSK_cold_2026-10-13_CS1'],n:[1,1,1],n2:[1,1,1]} },

{ name:'❄ Closes after two readings back inside 4–8: 13.0 (08:00) open → 6.0 (08:10) open, okRun 1 → 9.0 (08:20) open, okRun 0 → 6.0 (08:30) → 6.1 (08:40) call closed_fixed by system, task done, issue resolved autoResolved, all with updatedAt ≥ 08:40, note "6.0 °C 08:30 and 6.1 °C 08:40"',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('08:00');C.addReading('CS1','13.0');const raised=calls().length;
    at('08:10');C.addReading('CS1','6.0');const e1=C.excursion('CS1'),s1=calls()[0].status;
    at('08:20');C.addReading('CS1','9.0');const e2=C.excursion('CS1');
    at('08:30');C.addReading('CS1','6.0');const s3=__hnxCallStatus.status(calls()[0]);
    at('08:40');C.addReading('CS1','6.1');
    const c=calls()[0],t=tasks()[0],i=issues()[0],t0=M('08:40');
    return {raised,e1:[e1.open,e1.okRun,e1.worst],s1,e2:[e2.open,e2.okRun],s3,call:[c.status,c.closedBy,__hnxCallStatus.closed(c)],task:t.status,issue:[i.status,i.autoResolved],
      stamps:[c.updatedAt>=t0,t.updatedAt>=t0,i.updatedAt>=t0],note:/two readings back inside 4–8 °C: 6\\.0 °C 08:30 and 6\\.1 °C 08:40/.test(c.closeNote||''),ex:C.excursion('CS1').open};`),
  expect:{raised:1,e1:[true,1,'crit'],s1:'new_call',e2:[true,0],s3:'new_call',call:['closed_fixed','system',true],task:'done',issue:['resolved',true],stamps:[true,true,true],note:true,ex:false} },

{ name:'❄ Re-critical the same day: after the 08:40 close, 12.6 at 09:00 re-opens the SAME call CALL_cold_2026-10-13_CS1 (new_call, autoResolved false, coldOpenCount 2, "🤖 Re-opened: 12.6 °C at 09:00 — CRITICAL again (HIGH)"), issue history created,resolved,reopened, task not_started, notices …_2_jomel / _eyal — still 1 call, and the alert janitor leaves it open',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`[['08:00','13.0'],['08:10','6.0'],['08:20','9.0'],['08:30','6.0'],['08:40','6.1']].forEach(x=>{at(x[0]);C.addReading('CS1',x[1]);});
    const closed=calls()[0].status;
    at('09:00');C.addReading('CS1','12.6');
    let c=calls();const i=issues()[0],t=tasks()[0];
    try{window.hnxAlertJanitor.run();}catch(e){}
    const after=calls()[0];
    return {closed,n:c.length,id:c[0].id,status:c[0].status,auto:c[0].autoResolved,count:c[0].coldOpenCount,line:((c[0].updates||[]).slice(-1)[0]||{}).note,
      hist:(i.history||[]).map(h=>h.action).join(','),issue:i.status,task:t.status,inbox:inbox().filter(x=>/^COLD_crit_CS1_2026-10-13_2_/.test(x)),janitor:__hnxCallStatus.closed(after)};`),
  expect:{closed:'closed_fixed',n:1,id:'CALL_cold_2026-10-13_CS1',status:'new_call',auto:false,count:2,line:'🤖 Re-opened: 12.6 °C at 09:00 — CRITICAL again (HIGH)',
    hist:'created,resolved,reopened',issue:'open',task:'not_started',inbox:['COLD_crit_CS1_2026-10-13_2_eyal','COLD_crit_CS1_2026-10-13_2_jomel'],janitor:false} },

{ name:'❄ Prefill: a 5.6 °C online reading 10 min old (07:30 at 07:40) shows read-only "📡 online 07:30" + "✓ Confirm 5.6 °C"; one tap → check {v:5.6, src:"online", onlineTs 07:30} by eyal; a CS2 reading at 07:30 seen at 08:01 (31 min) is ⏳ stale → input enabled, no confirm button, tag "⏳ stale · 📡 07:30"',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`const r=C.apply(reply({CS1:R('CS1',5.6,'07:30')}),Date.now());
    switchView('maint_checklist');await sleep(900);
    const row=id=>document.querySelector('#hnxColdDaily .hnx-cd-row[data-room="'+id+'"]');
    const r1=row('CS1'),inp=r1&&r1.querySelector('.hnx-cd-in'),btn=r1&&r1.querySelector('[data-cold-act="confirm"]'),tag=r1&&r1.querySelector('.hnx-cd-tag');
    const before={ro:!!(inp&&inp.readOnly),v:inp&&inp.value,tag:tag&&tag.textContent,btn:btn&&btn.textContent,pre:C.prefill('CS1').mode};
    btn.click();await sleep(300);
    const chk=(C.daily('CS1')||{}).check||{};
    __tAt('2026-10-13T00:01:00Z');
    C.apply(reply({CS2:R('CS2',5.2,'07:30')}),Date.now());C.decorateChecklist();await sleep(300);
    const r2=row('CS2'),i2=r2&&r2.querySelector('.hnx-cd-in'),t2=r2&&r2.querySelector('.hnx-cd-tag');
    return {applied:r.applied,before,chk:{v:chk.v,src:chk.src,by:chk.by,onlineTs:chk.onlineTs===M('07:30')},cs2:{pre:C.prefill('CS2').mode,ro:!!(i2&&i2.readOnly),dis:!!(i2&&i2.disabled),confirm:!!(r2&&r2.querySelector('[data-cold-act="confirm"]')),tag:t2&&t2.textContent},
      done:!!(row('CS1')&&row('CS1').querySelector('.hnx-cd-chip'))};`),
  expect:{applied:['CS1'],before:{ro:true,v:'5.6',tag:'📡 online 07:30',btn:'✓ Confirm 5.6 °C',pre:'online'},chk:{v:5.6,src:'online',by:'eyal',onlineTs:true},
    cs2:{pre:'typed',ro:false,dis:false,confirm:false,tag:'⏳ stale · 📡 07:30'},done:true} },

{ name:'❄ Overdue: 09:59 → "○ due by 10:00" (mirror pending, notes "due by 10:00"); 10:00 → "⏰ OVERDUE" (mirror warning, notes "OVERDUE — not checked by 10:00"), cockpit Cold storage warn 2 "2 overdue"; 5.0 typed 10:05 → CS1 OK, warn 1',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('09:59');C.mirror();switchView('maint_cold');await sleep(700);
    const a={due:cardTxt('CS1','daily'),od:C.overdue('CS1'),m:[clst()['cold_storage::0'].status,clst()['cold_storage::0'].notes]};
    at('10:00');C.mirror();C.render('maint_cold');
    const k=box('maintenance','Cold storage');
    const b={due:cardTxt('CS1','daily'),od:C.overdue('CS1'),m:[clst()['cold_storage::0'].status,clst()['cold_storage::0'].notes,clst()['cold_storage::1'].status],warn:k.warn,crit:k.crit,text:k.text};
    at('10:05');C.saveDaily('CS1','5.0');const k2=box('maintenance','Cold storage');
    return {a,b,c:{m:clst()['cold_storage::0'].status,warn:k2.warn,done:k2.done,od:C.overdue('CS1')}};`),
  expect:{a:{due:'Daily check: ○ due by 10:00',od:false,m:['pending','due by 10:00']},
    b:{due:'Daily check: ⏰ OVERDUE — not checked by 10:00',od:true,m:['warning','OVERDUE — not checked by 10:00','warning'],warn:2,crit:0,text:'2 overdue'},c:{m:'ok',warn:1,done:1,od:false}} },

{ name:'❄ Not connected: each card says "📡 Not connected yet — readings are typed on the daily checklist", value "—" / NO VALUE, thermometer data-state none with no mercury, What is missing lists Not connected; after CS1 5.0 typed at 07:52 the card shows "5.0 °C" and "✍ hand · 07:52 · Eyal Ben Ari" and CS2 still shows no number',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`switchView('maint_cold');await sleep(700);
    const th=id=>card(id).querySelector('.hnx-ct');
    const before=['CS1','CS2'].map(id=>({src:cardTxt(id,'src'),val:cardTxt(id,'val'),chip:cardTxt(id,'chip'),state:th(id).getAttribute('data-state'),merc:!!th(id).querySelector('.ct-merc'),tag:th(id).querySelector('.ct-tag').textContent}));
    const miss=(document.querySelector('#coldRoomsBody .hnx-cr-missing')||{}).textContent||'';
    at('07:52');C.saveDaily('CS1','5.0');C.render('maint_cold');
    return {before,missing:/Not connected: the Elitech controller is not linked to Nexi yet/.test(miss),noDev:/Cold storage 1 has no Elitech device name/.test(miss),
      after:{v1:cardTxt('CS1','val'),s1:cardTxt('CS1','src'),st1:th('CS1').getAttribute('data-state'),v2:cardTxt('CS2','val'),s2:cardTxt('CS2','src')},state:[C.state('CS1'),C.state('CS2')]};`),
  expect:{before:[{src:'📡 Not connected yet — readings are typed on the daily checklist',val:'—',chip:'— NO READING',state:'none',merc:false,tag:'—NO VALUE'},
      {src:'📡 Not connected yet — readings are typed on the daily checklist',val:'—',chip:'— NO READING',state:'none',merc:false,tag:'—NO VALUE'}],missing:true,noDev:true,
    after:{v1:'5.0 °C',s1:'✍ hand · 07:52 · Eyal Ben Ari',st1:'ok',v2:'—',s2:'📡 Not connected yet — readings are typed on the daily checklist'},state:['notconnected','notconnected']} },

{ name:'❄ Online feed: ⚙ Settings → URL + On + token → GET …/cold/latest with "Bearer tok-SECRET-cold-9f2" → CS1 5.6 at 07:35 live, card "📡 online · 07:35 · Elitech alarm mail", 24 h svg has the 4–8 band + the online line; the token is only in hnxlocal_cold_token_v1 (no hydroPro_ key, toast or console holds it); HTTP 401 → "worker not reached (HTTP 401)"; safe mode → "paused (safe mode)" and 0 fetch calls',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`const logs=[];['log','info','warn','error','debug'].forEach(k=>{const o=console[k];console[k]=function(){try{logs.push([].map.call(arguments,a=>{try{return typeof a==='string'?a:JSON.stringify(a);}catch(e){return String(a);}}).join(' '));}catch(e){}return o.apply(console,arguments);};});
    let mode='ok';const fc=stubFetch(u=>{if(mode==='401')return {status:401,body:{error:'unauthorized'}};
      if(u.indexOf('/cold/latest')>=0)return {body:reply({CS1:R('CS1',5.6,'07:35')})};
      if(u.indexOf('/cold/history?room=CS1')>=0)return {body:{ok:true,room:'CS1',points:[{ts:M('07:05'),t:5.4,node:'elitech-mail'},{ts:M('07:20'),t:5.5,node:'elitech-mail'},{ts:M('07:35'),t:5.6,node:'elitech-mail'}]}};});
    switchView('maint_cold');await sleep(700);
    const feed0=(document.querySelector('#coldRoomsBody .hnx-cr-feed')||{}).textContent;
    document.querySelector('#coldRoomsBody button[data-act="settings"].btn').click();await sleep(200);
    const bx=document.getElementById('hnxColdBox');bx.querySelector('#hnxCsxUrl').value=URL0+'/';bx.querySelector('#hnxCsxOn').checked=true;bx.querySelector('#hnxCsxTok').value='  '+TOK+'  ';
    bx.querySelector('[data-act="save"]').click();await sleep(1500);C.close();C.render('maint_cold');await sleep(100);
    const cfgRaw=localStorage.getItem('hydroPro_cold_cfg_v1'),cfg=JSON.parse(cfgRaw||'{}');
    const first=fc.filter(x=>/\\/cold\\/latest/.test(x.u))[0]||{};
    const svg=card('CS1').querySelector('svg.hnx-ct-line');
    const ok={state:C.state('CS1'),src:cardTxt('CS1','src'),band:!!(svg&&svg.querySelector('rect.ct-l-band')),line:!!(svg&&svg.querySelector('polyline')),feed:(document.querySelector('#coldRoomsBody .hnx-cr-feed')||{}).textContent,
      live:(JSON.parse(localStorage.getItem('hydroPro_cold_live_v1')||'{}').rooms||{}).CS1,hist:fc.some(x=>/\\/cold\\/history\\?room=CS1&hours=24/.test(x.u))};
    ok.live=ok.live&&{t:ok.live.t,pts:(ok.live.pts||[]).length};
    mode='401';C.clearToken();C.setToken('wrong-'+TOK);const s401=await C.pullNow();C.render('maint_cold');
    const e={http:s401.http,err:s401.err,feed:(document.querySelector('#coldRoomsBody .hnx-cr-feed')||{}).textContent,health:C.health()};
    window.__HNX_SAFE=true;const n0=fc.length;await C.pullNow();const safe={calls:fc.length-n0,health:C.health()};window.__HNX_SAFE=false;
    const leaks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k==='hnxlocal_cold_token_v1')continue;if(String(localStorage.getItem(k)).indexOf(TOK)>=0)leaks.push(k);}
    return {feed0,cfg:{url:cfg.feed&&cfg.feed.url,on:cfg.feed&&cfg.feed.on,lww:cfg._lww,by:cfg.by},cfgTok:String(cfgRaw).indexOf(TOK)>=0,first:{u:first.u,auth:first.auth},ok,e,safe,
      tokKey:/wrong-tok-SECRET/.test(localStorage.getItem('hnxlocal_cold_token_v1')||''),leaks,toastLeak:toasts.filter(t=>t.indexOf(TOK)>=0).length,logLeak:logs.filter(t=>t.indexOf(TOK)>=0).length};`),
  expect:{feed0:'📡 Not connected yet — readings are typed on the daily checklist',cfg:{url:'https://nexi-cold.test.workers.dev',on:true,lww:true,by:'eyal'},cfgTok:false,
    first:{u:'https://nexi-cold.test.workers.dev/cold/latest',auth:'Bearer tok-SECRET-cold-9f2'},
    ok:{state:'live',src:'📡 online · 07:35 · Elitech alarm mail',band:true,line:true,feed:'📡 Online · feeder (this computer) · 1 of 2 rooms live · last pull 07:40',live:{t:5.6,pts:3},hist:true},
    e:{http:401,err:'HTTP 401',feed:'📡 Online feed: worker not reached (HTTP 401)',health:'feeder · no reply 0 min (HTTP 401)'},safe:{calls:0,health:'paused (safe mode)'},
    tokKey:true,leaks:[],toastLeak:0,logLeak:0} },

{ name:'❄ Lease: another computer’s 2-min-old lease (jomel on dev_other) → this one watches (live store untouched, the feed button says "📡 Online · fed by jomel"); an 11-min-old lease → this one takes it and writes CS1 5.6',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`C.saveCfg({feed:{url:URL0,on:true}});C.setToken(TOK);
    localStorage.setItem('hydroPro_cold_lease_v1',JSON.stringify({_lww:true,dev:'dev_other',user:'jomel',at:Date.now()-2*60000,updatedAt:Date.now()}));
    const r1=C.apply(reply({CS1:R('CS1',5.6,'07:35')}),Date.now());const live1=localStorage.getItem('hydroPro_cold_live_v1');
    switchView('maint_cold');await sleep(700);const feed=(document.querySelector('#coldRoomsBody .hnx-cr-feed')||{}).textContent;
    localStorage.setItem('hydroPro_cold_lease_v1',JSON.stringify({_lww:true,dev:'dev_other',user:'jomel',at:Date.now()-11*60000,updatedAt:Date.now()}));
    const r2=C.apply(reply({CS1:R('CS1',5.6,'07:35')}),Date.now());const live2=JSON.parse(localStorage.getItem('hydroPro_cold_live_v1')||'{}');
    return {w:r1.watching&&r1.watching.user,a1:r1.applied,live1,feed:/^📡 Online · fed by jomel · last reply/.test(feed),a2:r2.applied,w2:r2.watching,t:((live2.rooms||{}).CS1||{}).t,mine:C.lease().dev===localStorage.getItem('hnx_device_id')};`),
  expect:{w:'jomel',a1:[],live1:null,feed:true,a2:['CS1'],w2:null,t:5.6,mine:true} },

{ name:'❄ Rights: admin saves 2/4/8/12; 4/2/8/12 refused ("The limits must rise …"); reven (manageMaintenance, not admin) cannot save the settings or the token but saves the daily 5.0; a viewer (viewMaintenance only) cannot (why "rights", ❄ Daily inputs disabled, "Only the maintenance team records the daily reading"); ⚙ Settings disabled for non-admins',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`const oA=window.isAdmin,oC=window.can;const r={};
    r.admin=C.saveCfg({bands:{critMin:2,min:4,max:8,critMax:12}});r.bad=C.saveCfg({bands:{critMin:4,min:2,max:8,critMax:12}});
    r.badToast=toasts.some(t=>/The limits must rise: critical low < low < high < critical high \\(e\\.g\\. 2 < 4 < 8 < 12\\)/.test(t));
    try{as('reven');window.isAdmin=()=>false;window.can=p=>p==='manageMaintenance'||p==='viewMaintenance';
      r.revenCfg=C.saveCfg({freshMin:20});r.revenTok=C.setToken(TOK);r.revenDaily=C.saveDaily('CS1','5.0').ok;r.by=(C.daily('CS1')||{check:{}}).check.by;
      window.can=p=>p==='viewMaintenance';
      r.viewer=C.saveDaily('CS2','5.0');r.viewerAdd=C.addReading('CS2','5.0').why;
      switchView('maint_checklist');await sleep(900);
      const p=document.getElementById('hnxColdDaily');const ins=[...p.querySelectorAll('.hnx-cd-in')];
      r.inputsDisabled=ins.length>0&&ins.every(i=>i.disabled);r.who=/Only the maintenance team records the daily reading/.test(p.textContent);
      switchView('maint_cold');await sleep(700);r.settingsDisabled=document.querySelector('#coldRoomsBody button.btn[data-act="settings"]').disabled;
      r.cfg=JSON.parse(localStorage.getItem('hydroPro_cold_cfg_v1')||'{}').freshMin;r.tok=localStorage.getItem('hnxlocal_cold_token_v1');}
    finally{window.isAdmin=oA;window.can=oC;as('eyal');}
    return r;`),
  expect:{admin:true,bad:false,badToast:true,revenCfg:false,revenTok:false,revenDaily:true,by:'reven',viewer:{ok:false,why:'rights'},viewerAdd:'rights',inputsDisabled:true,who:true,settingsDisabled:true,cfg:30,tok:null} },

{ name:'❄ Nexi Health: the guardian record of this computer has cold "feeder · ok 07:4x · 1/2 live", the 🩺 panel says "❄ Cold rooms: 1 of 2 live", still 11 columns incl. "🔌 Meters" (the ❄ line sits in that cell); feed off → cold "off"',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`stubFetch(u=>u.indexOf('/cold/latest')>=0?{body:reply({CS1:R('CS1',5.6,'07:35')})}:{body:{ok:true,points:[]}});
    C.saveCfg({feed:{url:URL0,on:true}});C.setToken(TOK);await C.pullNow();await sleep(300);
    const mine=()=>{window.__hnxGuardian.runNow();const arr=JSON.parse(localStorage.getItem('hydroPro_health_v1')||'[]');return arr.find(r=>r.id===localStorage.getItem('hnx_device_id'))||{};};
    const m1=mine();
    window.hnxHealthPanel();await sleep(100);const p=document.getElementById('hnxHealthPanel');const txt=p?p.textContent:'';const ths=[...p.querySelectorAll('thead th')].map(t=>t.textContent);
    C.saveCfg({feed:{on:false}});const m2=mine();
    return {cold:/^feeder · ok 07:4\\d · 1\\/2 live$/.test(m1.cold||''),coldTxt:m1.cold,panel:/❄ Cold rooms: 1 of 2 live/.test(txt),cell:/❄ feeder · ok/.test(txt),cols:ths.length,meters:ths.indexOf('🔌 Meters')>=0,off:m2.cold};`),
  expect:{cold:true,panel:true,cell:true,cols:11,meters:true,off:'off'} },

{ name:'❄ Cockpits: CS1 1.9 °C (typed 09:00) + CS2 overdue at 10:05 → Maintenance "Cold storage" crit 1 · warn 1 · reds ["Cold storage 1 · 1.9 °C CRITICAL LOW"], text "1 critical · Cold storage 1 1.9 °C"; Packaging "Cold storage temperature" the same; pack_cold renders 2 cards in #packColdBody',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('09:00');C.saveDaily('CS1','1.9');at('10:05');
    const m=box('maintenance','Cold storage'),p=box('packaging','Cold storage temperature');
    switchView('pack_cold');await sleep(700);
    return {m:{crit:m.crit,warn:m.warn,reds:m.reds,text:m.text,total:m.total},p:{crit:p.crit,warn:p.warn,reds:p.reds},cards:document.querySelectorAll('#packColdBody .hnx-cr-card').length,active:document.getElementById('view-pack_cold').classList.contains('active')};`),
  expect:{m:{crit:1,warn:1,reds:['Cold storage 1 · 1.9 °C CRITICAL LOW'],text:'1 critical · Cold storage 1 1.9 °C',total:2},p:{crit:1,warn:1,reds:['Cold storage 1 · 1.9 °C CRITICAL LOW']},cards:2,active:true} },

{ name:'❄ Escalation: critical call at 08:00 (1.5 °C), 1.8 °C at 08:55, still critical at 09:00 → escalated, reason "Cold storage 1 still critical 60 min after the alarm", line "🚨 ESCALATED: … (1.8 °C at 08:55)", notices COLD_esc_CS1_2026-10-13_1_jomel / _eyal once (08:59 → not yet)',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('08:00');C.addReading('CS1','1.5');at('08:55');C.addReading('CS1','1.8');
    at('08:59');C.act('CS1');const not=!!calls()[0].escalated;
    at('09:00');await sleep(300);C.act('CS1');C.act('CS1');const c=calls()[0];
    return {not,esc:c.escalated,reason:c.escalationReason,line:(c.updates||[]).map(u=>u.note).filter(n=>/ESCALATED/.test(n)),inbox:inbox().filter(x=>/^COLD_esc_/.test(x))};`),
  expect:{not:false,esc:true,reason:'Cold storage 1 still critical 60 min after the alarm',line:['🚨 ESCALATED: Cold storage 1 still critical 60 min after the alarm (1.8 °C at 08:55)'],
    inbox:['COLD_esc_CS1_2026-10-13_1_eyal','COLD_esc_CS1_2026-10-13_1_jomel']} },

{ name:'❄ One red card: the critical CALL_cold_2026-10-13_CS1 pops one CRITICAL card (the 8-s alert watcher); its paired TSK_cold_2026-10-13_CS1 pops none',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`await sleep(300);
    at('07:52');C.saveDaily('CS1','1.9');window.__hnxNotifSig=null;
    const all=()=>[...document.querySelectorAll('#notifToastHost .hnx-alert-card')].map(c=>Object.assign({},c.dataset)).concat(window.__hnxHiddenAlertIds||[]);
    for(let i=0;i<30;i++){await sleep(500);if(all().some(d=>d.callId==='CALL_cold_2026-10-13_CS1'))break;}
    await sleep(1500);const cards=all();
    return {calls:cards.filter(d=>d.callId==='CALL_cold_2026-10-13_CS1').length,crit:/🚨/.test((document.querySelector('#notifToastHost .hnx-alert-card[data-call-id="CALL_cold_2026-10-13_CS1"]')||{}).textContent||''),tasks:cards.filter(d=>d.taskId==='TSK_cold_2026-10-13_CS1').length};`),
  expect:{calls:1,crit:true,tasks:0} },

{ name:'❄ Thermometer: 5.6 → data-state ok, data-y 107.6, data-level 5.6; animationName of .ct-merc is "ctRise", and "none" under html.hnx-lite; 13.4 → crit; 25.0 → crit with "▲ 25.0" (off the scale)',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`switchView('maint_cold');await sleep(700);
    const th=()=>card('CS1').querySelector('.hnx-ct');
    C.addReading('CS1','5.6');await sleep(50);const t1=th(),m1=t1.querySelector('.ct-merc');
    const a={state:t1.getAttribute('data-state'),y:t1.getAttribute('data-y'),level:t1.getAttribute('data-level'),anim:getComputedStyle(m1).animationName,role:t1.getAttribute('role')};
    document.documentElement.classList.add('hnx-lite');const lite=getComputedStyle(th().querySelector('.ct-merc')).animationName;document.documentElement.classList.remove('hnx-lite');
    at('07:50');C.addReading('CS1','13.4');await sleep(50);const b=th().getAttribute('data-state');
    at('08:00');C.addReading('CS1','25.0');await sleep(50);const t3=th();
    return {a,lite,b,c:{state:t3.getAttribute('data-state'),tag:t3.querySelector('.ct-tag').textContent,y:t3.getAttribute('data-y')}};`),
  expect:{a:{state:'ok',y:'107.6',level:'5.6',anim:'ctRise',role:'img'},lite:'none',b:'crit',c:{state:'crit',tag:'▲ 25.0CRIT HIGH',y:'14'}} },

{ name:'❄ Alerts by module (trial): CALL_cold_2026-10-13_CS1 (maint_cold) → hnxAlertModule "maintenance"; jomel (maintenance) sees it in hnxMyAlerts, a guard without Maintenance does not, and its paired task is not listed twice',
  requires:"typeof window.hnxAlertForMe==='function'&&typeof window.hnxMyAlerts==='function'&&"+NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`at('07:52');C.saveDaily('CS1','1.9');const c=calls()[0];
    const g=window.getCurrentUser,ge=window.getEffectiveModuleAccess;let r={};
    try{r.mod=hnxAlertModule({src:c.sourceModule,department:c.department});
      window.getEffectiveModuleAccess=(u,m)=>u.username==='jomel'?(m==='maintenance'?'edit':'none'):(m==='security'?'edit':'none');
      window.getCurrentUser=()=>({username:'jomel',fullname:'Jomel Galvo',role:'supervisor',department:'maintenance',active:true});
      const L=hnxMyAlerts(true);r.jomel=L.filter(a=>/_cold_/.test(a.id)).map(a=>a.kind+':'+a.id+':'+a.mod);
      window.getCurrentUser=()=>({username:'guard',fullname:'Guard One',role:'staff',department:'security',active:true});
      r.guard=hnxMyAlerts(true).filter(a=>/_cold_/.test(a.id)).length;r.forGuard=hnxAlertForMe({src:'maint_cold'});}
    finally{window.getCurrentUser=g;window.getEffectiveModuleAccess=ge;}
    return r;`),
  expect:{mod:'maintenance',jomel:['call:CALL_cold_2026-10-13_CS1:maintenance'],guard:0,forGuard:false} },

{ name:'❄ Guides: m_maintenance has "❄ Cold storage — daily temperature…(v22.96" with the 3 band rows and "❄ Connecting the Elitech controller — owner / IT checklist" with 15 steps (the same 15 lines as the screen’s Owner / IT checklist), the daily routine has the "Before 10:00: ❄ Daily" step, the screen table has ❄ Cold storage; m_packaging has the ❄ Cold storage row; Help links maint_cold to the Maintenance guide',
  requires:NEW, tz:'Asia/Manila', seed:SEED,
  run:fn(`const g=HNX_HELP_GUIDES.find(x=>x.id==='m_maintenance'),S=g.sections;
    const cold=S.find(s=>/^❄ Cold storage — daily temperature/.test(s.h)),conn=S.find(s=>/^❄ Connecting the Elitech controller — owner \\/ IT checklist/.test(s.h));
    const routine=S.find(s=>s.h==='The daily routine'),rest=S.find(s=>s.h==='The rest of the module');
    const p=HNX_HELP_GUIDES.find(x=>x.id==='m_packaging');const prow=[].concat.apply([],(p.sections||[]).map(s=>(s.table&&s.table.rows)||[])).filter(r=>r[0]==='❄ Cold storage').length;
    switchView('maint_cold');await sleep(700);const li=[...document.querySelectorAll('#coldRoomsBody .hnx-cr-check li')].map(x=>x.textContent);
    return {cold:!!cold&&/\\(v22\\.96/.test(cold.h),rows:cold&&cold.table.rows.map(r=>r[1]),steps:conn&&conn.steps.length,same:!!conn&&JSON.stringify(li)===JSON.stringify(conn.steps),
      routine:routine.steps.some(x=>/^Before 10:00: ❄ Daily — Cold storage temperature \\(°C\\)/.test(x)),rest:rest.table.rows.some(r=>r[0]==='❄ Cold storage'),prow,screens:HNX_HELP.screensFor('m_maintenance').indexOf('maint_cold')>=0};`),
  expect:{cold:true,rows:['✓ OK','⚠ WARNING','✕ CRITICAL'],steps:15,same:true,routine:true,rest:true,prow:1,screens:true} }
];
