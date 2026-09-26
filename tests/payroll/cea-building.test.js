/* v21.08: CEA ▸ Building & Structures, Follow-up Desk, Dropbox file service, dropdown menus */
module.exports=[
{ name:'🏗 Create PRJ12 + tank-roof cases: kind building_permit, BLD- ids, owner edelyn, one line each in the compliance lines (no duplicate CEA-case line), cockpit subject, view registered; creating PRJ12 again opens the existing one (v21.08)',
  run:async()=>{
    await sleep(2500);
    CEABLD.seed();await sleep(300);CEABLD.create('PRJ12_PRODUCTION');await sleep(300);
    const L=CEABLD.cases();
    const lines=hnxComplianceLines().filter(l=>/BLD/.test(String(l.id)));
    return {n:L.length,ids:L.map(c=>/^BLD-/.test(c.id)),owners:L.map(c=>c.owner),kinds:[...new Set(L.map(c=>c.kind))],
      lineSources:[...new Set(lines.map(l=>l.source))],caseLines:lines.filter(l=>l.source==='CEA case').length,
      subject:(window.HNX_CEA_EXTRA_SUBJECTS||[]).some(x=>x.go==='cea_building'),
      views:['cea_building','cea_followup'].map(v=>MODULES.cea.views.some(x=>x.id===v))};},
  expect:{n:2,ids:[true,true],owners:['edelyn','edelyn'],kinds:['building_permit'],lineSources:['Building permit'],caseLines:0,subject:true,views:[true,true]} },

{ name:'🏗 Gates: tank roof needs 36 filing documents (30 + 6 roof) and PRJ12 30; the 9 closeout documents wait for the occupancy/use gate; construction stays closed without a VERIFIED government check even after an internal sign-off; a document state "Verified for submission" is refused until a file is attached (v21.08)',
  run:async()=>{
    await sleep(2500);window.confirm=()=>true;window.prompt=()=>'0';
    CEABLD.seed();await sleep(300);
    const [a,b]=CEABLD.cases();const prj=a.extra.bld.structureType==='PRJ12_PRODUCTION'?a:b,roof=prj===a?b:a;
    const docsMiss=c=>CEABLD.gates(c).filter(g=>g.id==='filing')[0].miss.filter(m=>/^BP08 · (DOC|ROOF)/.test(m)).length;
    const closeInUse=c=>CEABLD.gates(c).filter(g=>g.id==='use')[0].miss.filter(m=>/^BP08 · CLOSE/.test(m)).length;
    CEABLD.signoff(roof.id);await sleep(200);
    const cons=CEABLD.gates(CEABLD.cases().filter(c=>c.id===roof.id)[0]).filter(g=>g.id==='construction')[0];
    CEABLD.reqSet(roof.id,'DOC-01','Verified for submission');await sleep(200);
    const st=((CEABLD.cases().filter(c=>c.id===roof.id)[0].extra.bld.req||{})['DOC-01']||{}).status||'Missing';
    return {roofDocs:docsMiss(roof),prjDocs:docsMiss(prj),close:closeInUse(roof),consOpen:cons.ok,needsVerified:cons.miss.some(m=>/VERIFIED government check/.test(m)),canStart:CEABLD.canWorkStart(roof),doc01:st};},
  expect:{roofDocs:36,prjDocs:30,close:9,consOpen:false,needsVerified:true,canStart:false,doc01:'Missing'} },

{ name:'🏗 Fees: PAID without OR number and amount is refused; VERIFIED needs the reconciled OR file; the same OR on another row is a duplicate; a complete PAID row passes (v21.08)',
  run:async()=>{
    await sleep(2500);CEABLD.seed();await sleep(300);const c=CEABLD.cases()[0];
    CEABLD.mutate(c.id,(x,b)=>{b.rows.BP12=[{_id:'F1',fee_type:'OBO filing / building',state:'PAID',or_number:'OR-778',amount:'2500'}];},'test');
    return {noOr:CEABLD.feeCheck({_id:'F2',state:'PAID',amount:'100'}),verified:CEABLD.feeCheck({_id:'F2',state:'VERIFIED',or_number:'OR-9',amount:'100'}),
      dup:/^OR or-778 is already recorded on BLD-/.test(CEABLD.feeCheck({_id:'F3',state:'PAID',or_number:'or-778',amount:'5'})),ok:CEABLD.feeCheck({_id:'F4',state:'PAID',or_number:'OR-1',amount:'250.50'})};},
  expect:{noOr:'PAID needs the OR number and the amount',verified:'VERIFIED needs the reconciled OR (OR file + verifier)',dup:true,ok:''} },

{ name:'🏗 PD1096 §305: permit issued 320 days ago with no start date → "start work" event due in 45 days, one task created (a second tick adds none); a suspension 100 days ago → 120-day lapse event (v21.08)',
  run:async()=>{
    await sleep(2500);CEABLD.seed();await sleep(300);const c=CEABLD.cases()[0];
    const back=n=>{const t=new Date(today+'T00:00:00');t.setDate(t.getDate()-n);return ymd(t);};
    CEABLD.mutate(c.id,(x,b)=>{b.f.BP13={issue:back(320),suspend:back(100)};},'test');
    CEABLD.tickValidity();CEABLD.tickValidity();
    const ev=CEABLD.validity(CEABLD.cases().filter(x=>x.id===c.id)[0]);
    const tasks=JSON.parse(localStorage.getItem('hydroPro_cea_tasks_v1')||'[]').filter(t=>t.caseId===c.id&&/PD1096|lapses/.test(t.title));
    const d=e=>Math.round((new Date(e.due+'T00:00:00')-new Date(today+'T00:00:00'))/864e5);
    return {keys:ev.map(e=>e.key),days:ev.map(d),tasks:tasks.length};},
  expect:{keys:['commence','suspend'],days:[45,20],tasks:2} },

{ name:'🏗 The workspace renders: header, case picker, Case / Export / Settings dropdown menus, all 22 screens reachable, "Can work start? No" (v21.08)',
  run:async()=>{
    await sleep(2500);CEABLD.seed();await sleep(300);
    switchView('cea_building');await sleep(1500);
    const c=CEABLD.cases()[0];CEABLD.open(c.id);await sleep(500);
    const txt=()=>((document.getElementById('body-cea_building')||{}).textContent||'');
    const menus=[...document.querySelectorAll('#body-cea_building details.hnxdd>summary')].map(s=>s.textContent.trim());
    let bad=[];for(const s of CEABLD.SCREENS){if(s.id==='BP00')continue;CEABLD.tab(s.id);await sleep(30);if(txt().indexOf(s.id+' · '+s.title)<0)bad.push(s.id);}
    return {head:/Building & Structures/.test(txt()),menus:['Case ▾','Export ▾','⚙ Settings ▾','Actions ▾'].every(m=>menus.includes(m)),bad,cannot:/Canworkstart\?No/.test(txt().replace(/\s+/g,''))};},
  expect:{head:true,menus:true,bad:[],cannot:true} },

{ name:'📅 Follow-up desk: an open task shows under Today when due today; Acknowledge keeps it open; an internal follow-up date never changes the task due date; reassign moves it to another owner (v21.08)',
  run:async()=>{
    await sleep(2500);
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',role:'admin',active:true},{username:'edelyn',fullname:'Edelyn Nicolas',role:'compliance',active:true}]));
    localStorage.setItem('hydroPro_cea_tasks_v1',JSON.stringify([{id:'TSK-1',caseId:'',title:'File renewal',owner:'tester',due:today,priority:'high',status:'open'}]));
    switchView('cea_followup');await sleep(1200);
    const inToday=CEAFU.items().filter(i=>i.key==='task:TSK-1').length;
    CEAFU.ack('task:TSK-1');
    let q=['2099-01-01','waiting on OBO'];window.prompt=()=>q.shift();CEAFU.follow('task:TSK-1');
    window.prompt=()=>'2';CEAFU.reassign('TSK-1');
    const t=JSON.parse(localStorage.getItem('hydroPro_cea_tasks_v1'))[0];const R=JSON.parse(localStorage.getItem('hydroPro_cea_reminders_v1'))['task:TSK-1'];
    const txt=document.getElementById('body-cea_followup').textContent;
    return {inToday,status:t.status,due:t.due===today,owner:t.owner,ack:!!R.ack,follow:R.follow,notDeployed:/not connected on this device/.test(txt)};},
  expect:{inToday:1,status:'open',due:true,owner:'edelyn',ack:true,follow:'2099-01-01',notDeployed:true} },

{ name:'📦 Dropbox file service: put() uploads to /CEA/<company>/<case>/<category>/<file> with a SHA-256 and keeps only the reference; a failure returns an error (nothing claimed); a document with a Dropbox reference opens through the file service (v21.08)',
  run:async()=>{
    await sleep(2500);
    localStorage.setItem('hydroPro_files_cfg_v1',JSON.stringify({url:'https://files.test',token:'t'}));
    let asked='';window.fetch=async(u,o)=>{asked=String(u);return {ok:true,status:200,json:async()=>({ok:true,path:'/Nexi/CEA/APTI/BLD-1 PRJ12/Drawings/roof.pdf',rel:'/CEA/APTI/BLD-1 PRJ12/Drawings/roof.pdf',id:'id:1',rev:'r1',size:3,content_hash:'x',name:'roof.pdf',link:'https://dl.test/roof.pdf'})};};
    const f=new File([new Uint8Array([1,2,3])],'roof.pdf',{type:'application/pdf'});
    const r=await HNXFILES.put(f,{area:'CEA',company:'APTI',caseId:'BLD-1',caseTitle:'PRJ12',category:'Drawings'});
    window.fetch=async()=>({ok:false,status:502,json:async()=>({error:'dropbox upload failed'})});
    const bad=await HNXFILES.put(f,{caseId:'X'});
    let opened='';HNXFILES.open=async ref=>{opened=ref.path;};
    localStorage.setItem('hydroPro_cea_docs_v1',JSON.stringify([{id:'DOC-9',caseId:'BLD-1',name:'roof.pdf',fileRef:r.ref}]));
    ceaDocView('DOC-9');await sleep(100);
    return {path:decodeURIComponent(asked.split('path=')[1]||''),sha:(r.ref||{}).sha256,noBytes:!('data' in (r.ref||{})),failed:bad.ok,err:/failed/.test(bad.error||''),opened};},
  expect:{path:'/CEA/APTI/BLD-1 PRJ12/Drawings/roof.pdf',sha:'039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81',noBytes:true,failed:false,err:true,opened:'/Nexi/CEA/APTI/BLD-1 PRJ12/Drawings/roof.pdf'} },

{ name:'🧭 Legacy LICENSES screens open the real CEA screens (Registry/Expiring → Regulatory, Dashboard/Compliance → Command Center); CEA button rows become a "➕ New ▾" / "Actions ▾" menu whose buttons still work; the Help centre has the Building and Follow-up guides (v21.08)',
  run:async()=>{
    await sleep(2500);
    const to={};for(const v of ['lic_registry','lic_expiring','lic_dash','lic_compliance']){switchView(v);await sleep(900);to[v]=window.currentView;}
    switchView('cea_command');await sleep(1800);if(window.hnxCeaCollapseNow)hnxCeaCollapseNow();await sleep(200);
    const menus=[...document.querySelectorAll('.view.active details.hnxcea>summary')].map(x=>x.textContent.trim());
    const inside=[...document.querySelectorAll('.view.active details.hnxcea .hnxdd-m>button.btn')].map(b=>b.textContent.trim());
    let opened=false;const b=[...document.querySelectorAll('.view.active details.hnxcea .hnxdd-m>button.btn')].find(x=>/Regulatory/.test(x.textContent));
    window.prompt=()=>null;window.confirm=()=>false;if(b){b.click();await sleep(400);opened=!!document.querySelector('#ceaDrawer, .cea-drawer, [id^=cea]');}
    const g=HNX_HELP_GUIDES.map(x=>x.id);
    return {to,menu:menus.some(m=>/New|Actions/.test(m)),inside:inside.length>=2,clickWorks:opened,guides:['cea_building','cea_followup'].every(x=>g.includes(x))};},
  expect:{to:{lic_registry:'cea_regulatory',lic_expiring:'cea_regulatory',lic_dash:'cea_command',lic_compliance:'cea_command'},menu:true,inside:true,clickWorks:true,guides:true} },

{ name:'🤖 Daily agent card: with the gov-watch link set, the desk reads GET /gov/agent/latest and shows "Your digest: due today 2", the supervisor line, and a MISSING warning when today\'s 08:00 run did not happen (v21.09)',
  run:async()=>{
    await sleep(2500);
    localStorage.setItem('hydroPro_dw_govwatch_v1',JSON.stringify({workerUrl:'https://gw.test',token:'t'}));
    let asked='',auth='';window.fetch=async(u,o)=>{asked=String(u);auth=((o||{}).headers||{}).Authorization||'';return {ok:true,json:async()=>({ok:true,generatedAt:'2026-09-26T00:00:03Z',stale:true,missed:true,checked:{cases:4,tasks:9,register:3},
      digest:{tester:{today:[{},{}],next7:[{}],renewals:[],waiting:[],blocked:[]}},supervisor:{noOwner:1,overdue2:2,stalled:0,noNextAction:0,renewalsCrit:0,blocking:1}})};};
    switchView('cea_followup');await sleep(1500);CEAFU.render();await sleep(300);
    const t=document.getElementById('body-cea_followup').textContent.replace(/\s+/g,' ');
    return {url:asked,auth,mine:/Your digest: due today 2 · next 7 days 1/.test(t),sup:/no owner 1 · 2\+ days overdue 2/.test(t),missed:/08:00 run is MISSING/.test(t)};},
  expect:{url:'https://gw.test/gov/agent/latest',auth:'Bearer t',mine:true,sup:true,missed:true} },
{ name:'📅 Compliance on the shared calendar: a dated CEA task appears in 📅 Calendar events as a Compliance item with a stable id; saving other calendar events never stores the projection (no duplicates) (v21.09)',
  run:async()=>{
    await sleep(2500);
    localStorage.setItem('hydroPro_cea_tasks_v1',JSON.stringify([{id:'TSK-7',caseId:'',title:'Renew FPA licence',owner:'tester',due:'2026-10-05',priority:'high',status:'open'}]));
    const ev=loadCalEvents().filter(e=>e.module==='compliance');
    addCalEvent({title:'Team lunch',date:'2026-10-06',module:'general'});
    const stored=JSON.parse(localStorage.getItem(CAL_EVENTS_KEY)||'[]');
    const again=loadCalEvents().filter(e=>e.module==='compliance').length;
    return {n:ev.length,id:ev[0]&&ev[0].id,date:ev[0]&&ev[0].date,storedProj:stored.filter(e=>e._proj||e.module==='compliance').length,lunch:stored.some(e=>e.title==='Team lunch'),again};},
  expect:{n:1,id:'CEA_task:TSK-7_2026-10-05',date:'2026-10-05',storedProj:0,lunch:true,again:1} },

{ name:'🤖 Ask Nexi on a fresh PRJ12 case: held at the Definition gate, lists the first missing items with BP screen links, and says an internal sign-off is not evidence only when construction/use is the blocker (v21.09)',
  run:async()=>{await sleep(2500);CEABLD.seed();await sleep(300);const c=CEABLD.cases().find(x=>x.extra.bld.structureType==='PRJ12_PRODUCTION');
    const r=CEABLD.explain(c.id);await sleep(200);const d=document.getElementById('ceaDrawer');const t=d?d.textContent:'';
    return {hold:r.hold,items:r.first.length>0&&r.first.every(m=>/^BP\d\d/.test(m)),links:d?d.querySelectorAll('a').length>0:false,noVerifyNote:!/Only a government check/.test(t)};},
  expect:{hold:'definition',items:true,links:true,noVerifyNote:true} },
];
