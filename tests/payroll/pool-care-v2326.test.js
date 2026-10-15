/* v23.48 (Eyal + Eder, 14 Oct 2026; built as v23.26, renumbered after main v23.30): 🧽 POOL CARE — water every 14 days and pool cleaning monthly (with the water change) per GH / PRJ.
   Eder's history (*POOL CLEANING* GH1&2 - August 17 … *WATER CHANGING* … September 28 - GH5) is in Nexi as 12 fixed-id rows; each
   unit has ONE open job (PJ_<unit>_<cycle due>) mirrored as ONE Tasks task (TSK_POOL_…) → My Day, the Production calendar, 🚨
   Escalation; on the day Nexi asks the Production supervisor and the GH person; the checklist, the Supervisor reports, Indoor
   Projects and the QC screens ask the same question; ❌ Not done → an outbox message (WhatsApp + in-app) to Dr Amy and Eyal.
   The page clock starts Wed 14 Oct 2026 09:00 Manila; at(day,'hh:mm') moves it. Automatic ticks are off (__hnxPoolNoTick):
   every case ticks by hand. Fixtures: eyal (admin) · amy "Dra Amy Patdu" (admin_secondary) · ederlynt "Ederlyn Torzar" (supervisor,
   PROD_TRAINEES) · jomel (maintenance head) · pedro (operator, linked to the GH3 team-leader employee EMP_P "CRUZ, PEDRO") · qc1. */
const NEW="typeof window.HNXPOOL==='object'&&window.HNXPOOL.v===2326";
const CLOCK=`const RD=Date;let off=RD.parse('2026-10-14T09:00:00+08:00')-RD.now();
  window.__tAt=function(iso){off=RD.parse(iso)-RD.now();};
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;`;
const PEOPLE=`window.__hnxPoolNoTick=true;
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'amy',fullname:'Dra Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'ederlynt',fullname:'Ederlyn Torzar',passwordHash:'x',role:'supervisor',department:'PROD_TRAINEES',active:true,email:'ederlynt@abapardes.com.ph'},
    {username:'jomel',fullname:'Jomel Galvo',passwordHash:'x',role:'supervisor',department:'maintenance',active:true},
    {username:'pedro',fullname:'Pedro Cruz',passwordHash:'x',role:'operator',department:'PROD_TRAINEES',active:true,empId:'EMP_P'},
    {username:'qc1',fullname:'QC One',passwordHash:'x',role:'operator',department:'quality',active:true}]));
  localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'EMP_P',name:'CRUZ, PEDRO',status:'Active',role:'Team Leader',dept:'PROD_TRAINEES',ghAssigned:['GH3'],dailyRate:600,payType:'weekly',employmentType:'Regular',salaryCategory:'Regular',dateHired:'2025-01-01'}]));
  localStorage.setItem('hydroPro_gh_leaders_v1',JSON.stringify({GH3:'EMP_P'}));
  localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'jomel',_lww:true,updatedAt:1}));`;
const SEED=new Function(CLOCK+PEOPLE);
const SEED_NOLINK=new Function(CLOCK+PEOPLE+`localStorage.setItem('hydroPro_users',JSON.stringify(JSON.parse(localStorage.getItem('hydroPro_users')).filter(u=>u.username!=='pedro')));`);
const SEED_SAFE=new Function(CLOCK+PEOPLE+`sessionStorage.setItem('hnx_safe','1');`);
const OPEN=`window.__hnxPulledOk=true;const toasts=[];window.showToast=function(m){toasts.push(String(m));};window.confirm=()=>true;
  const P=window.HNXPOOL,M=(d,hm)=>Date.parse(d+'T'+hm+':00+08:00'),at=(d,hm)=>__tAt(new Date(M(d,hm)).toISOString());
  const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  const recs=()=>P.jobs(),jobs=()=>recs().filter(x=>x.rec==='job'),job=id=>recs().find(x=>x.id===id)||null,openJobs=()=>jobs().filter(j=>j.status==='planned');
  const tasks=()=>JSON.parse(localStorage.getItem('hydroPro_tasks_v1')||'[]').filter(t=>/^TSK_POOL_/.test(t.id)),task=id=>tasks().find(t=>t.id===id)||null;
  const hist=()=>(JSON.parse(localStorage.getItem('hydroPro_pool_care_v1')||'{}').log||[]),row=id=>hist().find(r=>r.id===id)||null;
  const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x&&x.itemId==='pool');
  const outb=()=>JSON.parse(localStorage.getItem('hydroPro_notify_outbox_v1')||'[]');
  const T=o=>P.tick(Object.assign({force:true,quiet:true},o||{}));
  const plan=day=>openJobs().filter(j=>j.plan===day).sort((a,b)=>(+a.unit.replace(/\\D/g,''))-(+b.unit.replace(/\\D/g,''))).map(j=>j.unit+' '+(j.work==='clean'?'C':'W'));
  const ask=()=>document.getElementById('hnxPoolAskOv');const txt=el=>el?el.textContent.replace(/\\s+/g,' ').trim():'';
  const until=async(fn,ms)=>{const t0=performance.now();while(performance.now()-t0<(ms||8000)){let v=null;try{v=fn();}catch(e){v=null;}if(v)return v;await sleep(200);}return null;};
  const view=async id=>{switchView(id);return until(()=>{const a=document.querySelector('.view.active');return a&&a.id==='view-'+id;});};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
const BASE={requires:NEW,tz:'Asia/Manila',seed:SEED};
const C=(name,body,expect,extra)=>Object.assign({name},BASE,{run:fn(body),expect},extra||{});
module.exports=[

C('🧽 Eder import → 12 rows pc_e1410_* (6 cleaning + 6 water lines), each created 14 Oct 08:00 by "Eder (message 14 Oct 2026, forwarded by Eyal)"; 2nd run adds 0; seed0–8 untouched (21 rows total); a voided Eder row is not written again (still void, 21 rows)',
  `const n1=P.importEder(),n2=P.importEder(),L=hist(),E=L.filter(x=>/^pc_e1410_/.test(x.id));
   const d=JSON.parse(localStorage.getItem('hydroPro_pool_care_v1'));d.log.find(x=>x.id==='pc_e1410_water_20260926_1-2-3-4').void=true;localStorage.setItem('hydroPro_pool_care_v1',JSON.stringify(d));
   const n3=P.importEder(),L2=hist();
   return {n1,n2,n3,total:L.length,total2:L2.length,seeds:L.filter(x=>/^seed\\d$/.test(x.id)).length,clean:E.filter(x=>x.type==='clean').length,water:E.filter(x=>x.type==='water').length,
     ids:E.map(x=>x.id),ts:E.every(x=>x.createdAt===M('2026-10-14','08:00')),by:E.every(x=>x.by==='Eder (message 14 Oct 2026, forwarded by Eyal)'&&x.src==='eder-1410'),
     units:E.find(x=>x.id==='pc_e1410_water_20260915_1-2-3-4-5-6').units.join(','),pools:E.find(x=>x.id==='pc_e1410_clean_20260817_1-2').pools.join(','),
     stillVoid:L2.find(x=>x.id==='pc_e1410_water_20260926_1-2-3-4').void===true};`,
  {n1:12,n2:0,n3:0,total:21,total2:21,seeds:9,clean:6,water:6,ts:true,by:true,units:'GH1,GH2,GH3,GH4,GH5,GH6',pools:'P01,P02',stillVoid:true,
   ids:['pc_e1410_clean_20260817_1-2','pc_e1410_clean_20260924_3-4','pc_e1410_clean_20260824_5-6','pc_e1410_clean_20260911_7-8','pc_e1410_clean_20260916_9','pc_e1410_clean_20260918_10',
        'pc_e1410_water_20260824_2-3-4-9-10','pc_e1410_water_20260915_1-2-3-4-5-6','pc_e1410_water_20260922_10','pc_e1410_water_20260924_2','pc_e1410_water_20260926_1-2-3-4','pc_e1410_water_20260928_5']}),

C('📏 Rules on Wed 14 Oct: GH1 cleaned 17 Aug + water 26 Sep → water due 10 Oct = 4 days late, cleaning due 17 Sep = 27 late · GH3 cleaned 24 Sep + water 26 Sep → water 10 Oct (4 late), cleaning 24 Oct (in 10) · GH6 water 15 Sep → 29 Sep = 15 late, cleaning 24 Aug → 24 Sep = 20 late · GH7 cleaning 11 Sep counts as water → water due 25 Sep = 19 late, water age 33, cleaning rule Sun 11 Oct → working day Mon 12 Oct, 3 late · GH10 cleaning due Sun 18 Oct → Mon 19 Oct',
  `P.importEder();const r=u=>P.rules(u,{today:'2026-10-14'});const g1=r('GH1'),g3=r('GH3'),g6=r('GH6'),g7=r('GH7'),g10=r('GH10');
   return {g1:[g1.waterDue,g1.waterLate,g1.cleanDue,g1.cleanLate],g3:[g3.waterDue,g3.waterLate,g3.cleanDue,g3.cleanLate],g6:[g6.waterDue,g6.waterLate,g6.cleanDue,g6.cleanLate],
     g7:[g7.lastWater,g7.waterDue,g7.waterLate,g7.waterAge,g7.cleanDue,g7.cleanDueWd,g7.cleanLate],g10:[g10.cleanDue,g10.cleanDueWd]};`,
  {g1:['2026-10-10',4,'2026-09-17',27],g3:['2026-10-10',4,'2026-10-24',-10],g6:['2026-09-29',15,'2026-09-24',20],g7:['2026-09-11','2026-09-25',19,33,'2026-10-11','2026-10-12',3],g10:['2026-10-18','2026-10-19']}),

C('📏 Month clamp + fold: cleaned 31 Jan 2027 → cleaning due 28 Feb 2027, 31 Jan 2028 → 29 Feb 2028; water due Thu 12 Nov + cleaning due Sun 15 Nov → ONE 🧽 job Thu 12 Nov (fold 3), 💧 12 Nov with fold 0; GH9 water 30 Sep late, cleaning 16 Oct, planned Mon 19 Oct → 🧽 (16 Oct ≤ 22 Oct)',
  `P.importEder();const log=[{id:'a',date:'2026-10-15',ghs:[1],type:'clean'},{id:'b',date:'2026-10-29',ghs:[1],type:'water'}];
   const p3=P.plan({log,today:'2026-11-01',holidays:{}}).find(R=>R.unit==='GH1'),p0=P.plan({log,today:'2026-11-01',holidays:{},cfg:{foldDays:0}}).find(R=>R.unit==='GH1');
   const g9=P.plan({today:'2026-10-14',holidays:{}}).find(R=>R.unit==='GH9');
   return {c27:P.addMonth('2027-01-31'),c28:P.addMonth('2028-01-31'),fold3:[p3.waterDue,p3.cleanDue,p3.plan,p3.work],fold0:[p0.plan,p0.work],g9:[g9.waterDue,g9.cleanDue,g9.plan,g9.work,g9.jobId,g9.state]};`,
  {c27:'2027-02-28',c28:'2028-02-29',fold3:['2026-11-12','2026-11-15','2026-11-12','clean'],fold0:['2026-11-12','water'],g9:['2026-09-30','2026-10-16','2026-10-19','clean','PJ_GH9_20260930','catchup']}),

C('📅 Catch-up on Wed 14 Oct (2 cleanings + 2 water changes a day, most late first): Thu 15 GH1 C · GH2 C · GH3 W · GH4 W · Fri 16 GH5 C · GH6 C · Sat 17 GH7 C · GH8 C · Mon 19 GH9 C · GH10 C · nothing on Wed 14 or Sun 18; PRJ11 + PRJ12 no history, GH15 + GH16 paused → 10 jobs PJ_GH1_20260917 … PJ_GH10_20261006 + 10 tasks TSK_POOL_*',
  `const r=T();const st={};P.state().forEach(R=>{st[R.unit]=R.state;});
   return {d14:plan('2026-10-14'),d15:plan('2026-10-15'),d16:plan('2026-10-16'),d17:plan('2026-10-17'),d18:plan('2026-10-18'),d19:plan('2026-10-19'),
     ids:openJobs().map(j=>j.id).sort(),tasks:tasks().map(t=>t.id).sort(),prj:[st.PRJ11,st.PRJ12,st.GH15,st.GH16],err:r.err||null,catchup:openJobs().every(j=>j.catchup)};`,
  {d14:[],d15:['GH1 C','GH2 C','GH3 W','GH4 W'],d16:['GH5 C','GH6 C'],d17:['GH7 C','GH8 C'],d18:[],d19:['GH9 C','GH10 C'],prj:['nohist','nohist','paused','paused'],err:null,catchup:true,
   ids:['PJ_GH10_20261006','PJ_GH1_20260917','PJ_GH2_20260917','PJ_GH3_20261010','PJ_GH4_20261010','PJ_GH5_20260924','PJ_GH6_20260924','PJ_GH7_20260925','PJ_GH8_20260925','PJ_GH9_20260930'],
   tasks:['TSK_POOL_GH10_20261006','TSK_POOL_GH1_20260917','TSK_POOL_GH2_20260917','TSK_POOL_GH3_20261010','TSK_POOL_GH4_20261010','TSK_POOL_GH5_20260924','TSK_POOL_GH6_20260924','TSK_POOL_GH7_20260925','TSK_POOL_GH8_20260925','TSK_POOL_GH9_20260930']}),

C('🔁 Steady state GH1: 🧽 15 Oct → 💧 29 Oct → 🧽 12 Nov → 💧 26 Nov (a 28-day rhythm on Thursdays); holiday Mon 30 Nov in hydroPro_ph_holidays → GH9 water (rule Mon 30 Nov) planned Tue 1 Dec',
  `T();const f=P.forecast('GH1',{today:'2026-10-14',weeks:7}).map(x=>x.date+' '+x.work);
   const log=[{id:'g9',date:'2026-11-16',ghs:[9],type:'clean'}];const R9=P.plan({log,today:'2026-11-20',holidays:{'2026-11-30':{name:'Bonifacio Day'}}}).find(R=>R.unit==='GH9');
   return {open:job('PJ_GH1_20260917').plan+' '+job('PJ_GH1_20260917').work,f,g9:[R9.waterDue,R9.plan,R9.work]};`,
  {open:'2026-10-15 clean',f:['2026-10-29 water','2026-11-12 clean','2026-11-26 water'],g9:['2026-11-30','2026-12-01','water']}),

C('🧾 Task TSK_POOL_GH3_20261010: module production, origin module:production, type follow-up, due 2026-10-15 at 11:00 (dueOriginal 2026-10-15), owner pedro (the GH3 team leader’s user), createdBy ederlynt (the Production supervisor), visibility users, shared ederlynt + amy + eyal, rule simple, priority high (review: an overdue job — water 4 days late — starts high, not normal), link pool:PJ_GH3_20261010; a cleaning task (GH1) also shares jomel (maintenance)',
  `T();const t=task('TSK_POOL_GH3_20261010'),t1=task('TSK_POOL_GH1_20260917'),j=job('PJ_GH3_20261010');
   return {f:[t.module,t.origin,t.type,t.due,t.dueTime,t.dueOriginal,t.owner,t.createdBy,t.visibility,t.rule,t.priority,t.status],sh:t.sharedWith,link:t.links[0].type+':'+t.links[0].id,title:t.title,
     who:[j.who.sup,j.who.ghpUser,j.who.proxy,j.who.esc.join('+')],g1:[t1.owner,t1.sharedWith.join('+'),t1.title]};`,
  {f:['production','module:production','follow-up','2026-10-15','11:00','2026-10-15','pedro','ederlynt','users','simple','high','todo'],sh:['ederlynt','amy','eyal'],link:'pool:PJ_GH3_20261010',
   title:'🧽 GH3 · pool water change (P03)',who:['ederlynt','pedro',false,'amy+eyal'],g1:['ederlynt','amy+eyal+jomel','🧽 GH1 · pool cleaning + water change (P01)']}),

Object.assign(C('👤 GH3 team leader Pedro Cruz has NO Nexi user → task owner ederlynt, proxy, and the ask says "team leader Pedro Cruz (no Nexi user) — Ederlyn Torzar answers for GH3"',
  `T();const t=task('TSK_POOL_GH3_20261010'),j=job('PJ_GH3_20261010');at('2026-10-15','11:05');T();const a=inbox().filter(x=>/^POOLASK_PJ_GH3_20261010_20261015_/.test(x.id));
   return {owner:t.owner,proxy:j.who.proxy,name:j.who.ghpName,ids:a.map(x=>x.id),txt:/\\[team leader Pedro Cruz \\(no Nexi user\\) — Ederlyn Torzar answers for GH3\\]/.test((a[0]||{}).text||'')};`,
  {owner:'ederlynt',proxy:true,name:'CRUZ, PEDRO',ids:['POOLASK_PJ_GH3_20261010_20261015_ederlynt_1'],txt:true}),{seed:SEED_NOLINK}),

C('💻💻 A second computer: the cloud copy on a computer with nothing of its own → 0 new rows / jobs / tasks, the same bytes; two computers that both made the jobs before syncing → the real merge gives 12 Eder rows and 10 open jobs (one per GH, same ids)',
  `T();const H=localStorage.getItem('hydroPro_pool_care_v1'),Jb=localStorage.getItem('hydroPro_pool_jobs_v1'),Tk=localStorage.getItem('hydroPro_tasks_v1');
   const before=[hist().length,openJobs().length,tasks().length];T();const again=[hist().length,openJobs().length,tasks().length,localStorage.getItem('hydroPro_pool_care_v1')===H];
   ['hydroPro_pool_care_v1','hydroPro_pool_jobs_v1'].forEach(k=>localStorage.removeItem(k));localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(JSON.parse(Tk).filter(t=>!/^TSK_POOL_/.test(t.id))));
   at('2026-10-14','09:20');T();const H2=localStorage.getItem('hydroPro_pool_care_v1'),J2=localStorage.getItem('hydroPro_pool_jobs_v1');
   const sameHist=JSON.stringify(JSON.parse(H2).log.map(r=>r.id))===JSON.stringify(JSON.parse(H).log.map(r=>r.id))&&H2===H;
   const mh=window.__hnxMergeGeneric('hydroPro_pool_care_v1',H2,H)||H2,mj=window.__hnxMergeGeneric('hydroPro_pool_jobs_v1',J2,Jb)||J2;
   const MJ=JSON.parse(mj).filter(x=>x.rec==='job'&&x.status==='planned');
   return {before,again,sameHist,eder:JSON.parse(mh).log.filter(r=>/^pc_e1410_/.test(r.id)).length,rows:JSON.parse(mh).log.length,jobs:MJ.length,units:MJ.map(j=>j.unit).filter((u,i,a)=>a.indexOf(u)===i).length,
     idsSame:JSON.stringify(MJ.map(j=>j.id).sort())===JSON.stringify(JSON.parse(Jb).filter(x=>x.rec==='job').map(j=>j.id).sort())};`,
  {before:[21,10,10],again:[21,10,10,true],sameHist:true,eder:12,rows:21,jobs:10,units:10,idsSame:true}),

C('🗑 A deleted (tombstoned) task TSK_POOL_GH5_20260924 is never made again — the job PJ_GH5_20260924 stays open and is still asked on its day (Fri 16 Oct: the checklist strip for GH5 asks)',
  `T();const tb=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');tb.hydroPro_tasks_v1=Object.assign(tb.hydroPro_tasks_v1||{},{TSK_POOL_GH5_20260924:Date.now()});localStorage.setItem('hydroPro_optomb',JSON.stringify(tb));
   localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(JSON.parse(localStorage.getItem('hydroPro_tasks_v1')||'[]').filter(t=>t.id!=='TSK_POOL_GH5_20260924')));
   at('2026-10-16','09:00');T();T();
   await view('checklist');await sleep(300);const s=document.getElementById('facSelect');if(s){s.value='GH5';renderCL();}
   const strip=await until(()=>{P.enhance();return document.querySelector('#clBody > .hnx-pool-ask');});
   return {task:!!task('TSK_POOL_GH5_20260924'),job:job('PJ_GH5_20260924').status,others:tasks().length,asks:/Pool P05 \\(GH5\\) — was the pool cleaned and the water replaced today\\?/.test(txt(strip))};`,
  {task:false,job:'planned',others:9,asks:true}),

C('✅ Task marked done IN TASKS on Thu 15 Oct 11:42 → answer PA_PJ_GH3_20261010_20261015 yes (src task, by ederlynt), history row pc_PJ_GH3_20261010_20261015 (one line per answer) water 15 Oct, job done, next job PJ_GH3_20261024 🧽 Sat 24 Oct with task TSK_POOL_GH3_20261024',
  `T();at('2026-10-15','11:42');as('ederlynt');const ok=HNXTASKS.setStatus('TSK_POOL_GH3_20261010','done');as('tester');T();
   const a=job('PA_PJ_GH3_20261010_20261015')||{},r=row('pc_PJ_GH3_20261010_20261015')||{},n=job('PJ_GH3_20261024')||{};
   return {ok,a:[a.a,a.src,a.by,a.doneKind],r:[r.date,r.type,r.src,r.units&&r.units.join()],done:job('PJ_GH3_20261010').status,next:[n.plan,n.work,n.status],nt:!!task('TSK_POOL_GH3_20261024')};`,
  {ok:true,a:['yes','task','ederlynt','water'],r:['2026-10-15','water','task','GH3'],done:'done',next:['2026-10-24','clean','planned'],nt:true}),

C('➕ "Add a past date" GH3 water change 28 Sep → the open job PJ_GH3_20261010 (no answers) is cancelled, supersededBy PJ_GH3_20261012 (water due 12 Oct, still catch-up Thu 15 Oct 💧); its task is cancelled; the new task TSK_POOL_GH3_20261012 is made',
  `T();const r=P.addPast('GH3',{date:'2026-09-28',type:'water'});const o=job('PJ_GH3_20261010'),n=job('PJ_GH3_20261012')||{},ot=task('TSK_POOL_GH3_20261010');
   return {ok:r.ok,id:r.id,old:[o.status,o.supersededBy],t:[ot.status,/^\\[pool\\]/.test(ot.cancelReason)],n:[n.status,n.plan,n.work,n.cycleDue],nt:!!task('TSK_POOL_GH3_20261012')};`,
  {ok:true,id:'pc_m_GH3_water_20260928',old:['cancelled','PJ_GH3_20261012'],t:['cancelled',true],n:['planned','2026-10-15','water','2026-10-12'],nt:true}),

C('🛡 Data Safety weighs hydroPro_pool_jobs_v1 like calls / issues: 40 records in the cloud (10 jobs + 30 answers), all 40 re-planned / re-answered here with NEWER stamps → uploaded, not held (40 changed, 40 newer here); the same 40 changes with OLDER stamps → held; 15 of 40 records REMOVED → held; hydroPro_notify_outbox_v1 is weighed too (REC)',
  `T();await sleep(2500);const K='hydroPro_pool_jobs_v1',HK='hnxlocal_push_held_v1',reset=()=>{const h=HNXDS.held();Object.keys(h).forEach(k=>delete h[k]);localStorage.setItem(HK,'{}');};reset();
   const base=JSON.parse(localStorage.getItem(K)).filter(x=>x.rec==='job').slice(0,10).map(j=>Object.assign({},j,{updatedAt:M('2026-10-14','08:00')}));
   const ans=[...Array(30)].map((_,i)=>({id:'PA_PJ_GH3_20261010_202610'+String(10+i).padStart(2,'0'),rec:'answer',jobId:'PJ_GH3_20261010',unit:'GH3',day:'2026-10-'+String(10+(i%5)).padStart(2,'0'),a:'yes',updatedAt:M('2026-10-14','08:00')}));
   const cloud=base.concat(ans),ch=st=>cloud.map(r=>Object.assign({},r,r.rec==='job'?{plan:'2026-10-20'}:{a:'no'},{updatedAt:st}));
   const later=ch(M('2026-10-14','09:05')),older=ch(M('2026-10-14','07:00'));
   window.__hnxCloudRaw=window.__hnxCloudRaw||{};window.__hnxCloudRaw[K]=JSON.stringify(cloud);
   const o1=window.__hnxPushGuard({[K]:JSON.stringify(later)});const h1=!!HNXDS.held()[K];const s1=window.__hnxDsStats(JSON.stringify(cloud),JSON.stringify(later),K,true)||{};reset();
   const o3=window.__hnxPushGuard({[K]:JSON.stringify(older)});const h3=!!HNXDS.held()[K];reset();
   const o2=window.__hnxPushGuard({[K]:JSON.stringify(cloud.slice(15))});const h2=!!HNXDS.held()[K];reset();
   return {up:K in o1,held:h1,changed:s1.changed,fwd:s1.fwd,olderHeld:h3,up3:K in o3,removedHeld:h2,up2:K in o2,rec:/hydroPro_notify_outbox_v1':'outbox'/.test(document.getElementById('hnx-data-safety-v2128').textContent)};`,
  {up:true,held:false,changed:40,fwd:40,olderHeld:true,up3:false,removedHeld:true,up2:false,rec:true},{requires:NEW+"&&typeof window.__hnxDsStats==='function'"}),

C('📅 Production calendar on Wed 14 Oct: the task TSK:TSK_POOL_GH1_20260917 on Thu 15 Oct and the forecast POOLF_GH1_20261029 (💧, never stored); saveCalEvents keeps the stored events and drops every POOLF_; clicking a forecast opens 🧽 Pool care',
  `T();const items=HNXMCAL.items('production');const t=items.find(e=>e.id==='TSK:TSK_POOL_GH1_20260917')||{},f=items.find(e=>e.id==='POOLF_GH1_20261029')||{};
   const all=loadCalEvents();saveCalEvents(all);const raw=JSON.parse(localStorage.getItem('hydroPro_cal_events_v2')||'[]');
   HNXMCAL.open('production','POOLF_GH1_20261029');await until(()=>{const a=document.querySelector('.view.active');return a&&a.id==='view-prod_pool_care';});
   return {t:[t.date,t.module],f:[f.date,f.module,f.title,!!f._proj],stored:raw.filter(e=>/^POOLF_/.test(String(e.id))).length,view:(document.querySelector('.view.active')||{}).id};`,
  {t:['2026-10-15','production'],f:['2026-10-29','production','🧽 GH1 · pool water change (forecast)',true],stored:0,view:'view-prod_pool_care'}),

C('✅ Yes for GH3 on Thu 15 Oct with EC 2.2 · pH 6.0 · level 120 → task done with evidence "EC 2.2 · pH 6.0 · level 120 cm", history row pc_PJ_GH3_20261010_20261015 ec 2.2, the Pool Monitor P03 card shows "🆕 Fresh water today (water change 11:42) … 120 cm"; hnxPoolFresh(P03, 15 Oct) = water',
  `T();at('2026-10-15','11:42');as('ederlynt');const r=P.answer('PJ_GH3_20261010',{a:'yes',ec:'2.2',ph:'6.0',levelCm:'120',src:'ask'});as('tester');
   const t=task('TSK_POOL_GH3_20261010'),h=row('pc_PJ_GH3_20261010_20261015');
   try{_irrDate='2026-10-15';}catch(e){}await view('irr_nutrients');const b=await until(()=>{P.enhance();return document.querySelector('.hnx-pc-badges[data-pc-pool="P03"]');},12000);
   return {ok:r.ok,status:t.status,ev:(t.evidence[0]||{}).note,ec:h.ec,fresh:(window.hnxPoolFresh('P03','2026-10-15')||{}).kind,
     banner:/🆕 Fresh water today \\(water change 11:42\\) — balance to EC 2\\.2 \\/ pH 6\\.0 \\(SOP F\\); level at the cleaning mark 120 cm/.test(txt(b))};`,
  {ok:true,status:'done',ev:'EC 2.2 · pH 6.0 · level 120 cm',ec:2.2,fresh:'water',banner:true}),

C('❌ No for GH3 on Thu 15 Oct ("No fresh water / pump problem — pump repair", new date Sat 17 Oct) → plan 17 Oct, still 💧 (cleaning 24 Oct > 17 + 3), task due 17 Oct with dueOriginal 15 Oct and priority high, ONE outbox pool_GH3_2026-10-15_notdone to amy + eyal ("⚠ Nexi · GH3 pool water NOT replaced today (planned Thu 15 Oct) …"), inbox POOLNO to amy + eyal; a 2nd No the same day (crew, Mon 19 Oct) updates the answer and the plan only → still 1 outbox, 1 answer',
  `T();at('2026-10-15','11:42');as('ederlynt');const r=P.answer('PJ_GH3_20261010',{a:'no',reasonCode:'water',reason:'pump repair',newDate:'2026-10-17',src:'ask'});
   const j1=job('PJ_GH3_20261010'),t1=task('TSK_POOL_GH3_20261010'),first=[j1.plan,j1.work,j1.priority,t1.due,t1.dueOriginal,t1.priority];
   const r2=P.answer('PJ_GH3_20261010',{a:'no',reasonCode:'crew',reason:'',newDate:'2026-10-19',src:'report:checklist'});as('tester');
   const j=job('PJ_GH3_20261010'),t=task('TSK_POOL_GH3_20261010'),o=outb().filter(x=>/^pool_GH3_/.test(x.id));
   return {first,ok:[r.ok,r.alert,r2.ok,r2.alert],j:[j.plan,j.work,j.priority],t:[t.due,t.dueOriginal,t.priority],o:o.map(x=>x.id+' '+x.to.join('+')+' '+x.channel.join('+')),
     text:(o[0]||{}).text,pa:recs().filter(x=>x.rec==='answer').length,no:inbox().filter(x=>/^POOLNO_/.test(x.id)).map(x=>x.id).sort()};`,
  {first:['2026-10-17','water','high','2026-10-17','2026-10-15','high'],ok:[true,true,true,false],j:['2026-10-19','water','high'],t:['2026-10-19','2026-10-15','high'],o:['pool_GH3_2026-10-15_notdone amy+eyal wa+mail+app'],pa:1,
   text:'⚠ Nexi · GH3 pool water NOT replaced today (planned Thu 15 Oct). Reason: No fresh water / pump problem — pump repair. New date: Sat 17 Oct. Water is 19 days old (rule 14). Answered by Ederlyn Torzar 11:42.',
   no:['POOLNO_PJ_GH3_20261010_20261015_amy','POOLNO_PJ_GH3_20261010_20261015_eyal']}),

C('❌ No for GH3 on 15 Oct with new date Thu 22 Oct → the job becomes 🧽 cleaning + water change (cleaning due 24 Oct ≤ 22 + 3) and its task title says so',
  `T();at('2026-10-15','12:00');const r=P.answer('PJ_GH3_20261010',{a:'no',reasonCode:'harvest',newDate:'2026-10-22',src:'screen'});
   return {ok:r.ok,work:job('PJ_GH3_20261010').work,plan:job('PJ_GH3_20261010').plan,title:task('TSK_POOL_GH3_20261010').title};`,
  {ok:true,work:'clean',plan:'2026-10-22',title:'🧽 GH3 · pool cleaning + water change (P03)'}),

C('⏰ The day’s asks (Thu 15 Oct): 06:45 one "today" note per person (POOLDAY_20261015_ederlynt, _pedro); ticks at 11:00 ×5 on two tabs → ONE POOLASK_…_1 per person per job; 15:00 → _2 only for the unanswered ones; 17:05 → POOLEOD to ederlynt + the "tomorrow" notes POOLEVE_20261016',
  `T();at('2026-10-15','06:45');T();const day=inbox().filter(x=>/^POOLDAY_/.test(x.id)).map(x=>x.id).sort();
   at('2026-10-15','11:00');for(let i=0;i<5;i++){T();localStorage.removeItem('hnxlocal_pool_seen_v1');}
   const a1=inbox().filter(x=>/^POOLASK_.*_1$/.test(x.id)).map(x=>x.id).sort();
   P.answer('PJ_GH1_20260917',{a:'yes',src:'screen'});P.answer('PJ_GH2_20260917',{a:'yes',src:'screen'});P.answer('PJ_GH4_20261010',{a:'yes',src:'screen'});
   at('2026-10-15','15:00');T();T();const a2=inbox().filter(x=>/^POOLASK_.*_2$/.test(x.id)).map(x=>x.id).sort();
   at('2026-10-15','17:05');T();const eod=inbox().filter(x=>/^POOLEOD_/.test(x.id)).map(x=>x.id),eve=inbox().filter(x=>/^POOLEVE_/.test(x.id)).map(x=>x.id).sort();
   return {day,a1,a2,eod,eve,dayTxt:(inbox().find(x=>x.id==='POOLDAY_20261015_ederlynt')||{}).text};`,
  {day:['POOLDAY_20261015_ederlynt','POOLDAY_20261015_pedro'],
   a1:['POOLASK_PJ_GH1_20260917_20261015_ederlynt_1','POOLASK_PJ_GH2_20260917_20261015_ederlynt_1','POOLASK_PJ_GH3_20261010_20261015_ederlynt_1','POOLASK_PJ_GH3_20261010_20261015_pedro_1','POOLASK_PJ_GH4_20261010_20261015_ederlynt_1'],
   a2:['POOLASK_PJ_GH3_20261010_20261015_ederlynt_2','POOLASK_PJ_GH3_20261010_20261015_pedro_2'],eod:['POOLEOD_20261015_ederlynt'],
   eve:['POOLEVE_20261016_ederlynt','POOLEVE_20261016_jomel'],
   dayTxt:'Today: GH1 pool cleaning with water change (P01) · GH2 pool cleaning with water change (P02) · GH3 water change (P03) · GH4 water change (P04). Refill to the cleaning mark, bring EC to 2.2 / pH to 6.0 (SOP F). Nexi asks at 11:00.'}),

C('⏳ No answer for GH3 on Thu 15 Oct → the tick at Fri 16 Oct 08:00: answer PA_PJ_GH3_20261010_20261015 none (src auto, by Nexi), plan carried to Fri 16 Oct, ONE outbox pool_GH3_2026-10-15_noanswer to amy + eyal, POOLNA notes to amy + eyal + ederlynt, task priority high and the task is in 🚨 Escalation (_tt_collectAll + _tt_needsEscalation); 07:59 does nothing',
  `T();at('2026-10-16','07:59');T();const before=job('PA_PJ_GH3_20261010_20261015');at('2026-10-16','08:00');T();T();
   const a=job('PA_PJ_GH3_20261010_20261015')||{},j=job('PJ_GH3_20261010'),o=outb().filter(x=>/noanswer/.test(x.id)&&/GH3/.test(x.id));
   const esc=(window._tt_collectAll()||[]).filter(i=>window._tt_needsEscalation(i)).some(i=>String(i.id||'').indexOf('TSK_POOL_GH3_20261010')>=0);
   return {before:!!before,a:[a.a,a.src,a.by],plan:j.plan,o:o.map(x=>x.id+' '+x.to.join('+')),na:inbox().filter(x=>/^POOLNA_PJ_GH3_/.test(x.id)).map(x=>x.id.split('_').pop()).sort(),pri:task('TSK_POOL_GH3_20261010').priority,esc,
     text:/^⚠ Nexi · GH3 pool water change planned Thu 15 Oct — NO ANSWER from Pedro Cruz and Ederlyn Torzar|^⚠ Nexi · GH3 pool water change planned Thu 15 Oct — NO ANSWER from Ederlyn Torzar and Pedro Cruz/.test((o[0]||{}).text||'')};`,
  {before:false,a:['none','auto','Nexi'],plan:'2026-10-16',o:['pool_GH3_2026-10-15_noanswer amy+eyal'],na:['amy','ederlynt','eyal'],pri:'high',esc:true,text:true}),

C('🔴 GH7 planned Sat 17 Oct and not answered → at Mon 19 Oct 08:05 (water 38 days old, rule 14 → 28 or more is critical) the carried job and its task are priority critical; GH3 (water 23 days) is high',
  `T();at('2026-10-15','08:30');T();at('2026-10-19','08:05');T();
   return {g7:[job('PJ_GH7_20260925').priority,task('TSK_POOL_GH7_20260925').priority,job('PJ_GH7_20260925').plan],g3:job('PJ_GH3_20261010').priority};`,
  {g7:['critical','critical','2026-10-19'],g3:'high'}),

C('📝 ✅ Checklist GH3 on Thu 15 Oct shows "🧽 Pool P03 (GH3) — was the water replaced today?"; ✅ Yes there → the 📋 Supervisor Daily Report shows "✅ GH3 water replaced — Tester … (checklist)" and no GH3 question; a QC inspection for GH3 opens no window; the GH3 card on Supervisor has the same line',
  `T();at('2026-10-15','09:30');T();await view('checklist');await sleep(300);const s=document.getElementById('facSelect');s.value='GH3';renderCL();
   const st=await until(()=>{P.enhance();return document.querySelector('#clBody > .hnx-pool-ask');}),q=/🧽 Pool P03 \\(GH3\\) — was the water replaced today\\?/.test(txt(st));
   st.querySelector('button.hpc-yes').click();const form=!!(await until(()=>document.getElementById('hpaSaveYes')));document.getElementById('hpaSaveYes').click();await until(()=>!ask());
   const a=job('PA_PJ_GH3_20261010_20261015')||{};
   await view('prod_supervisor_matrix');const sm=await until(()=>{P.enhance();return document.querySelector('#view-prod_supervisor_matrix > .hnx-pool-ask');});
   const qc=P.formModal('GH3','report:qc_inspection');await view('supervisor');
   const card=await until(()=>{P.enhance();const c=[...document.querySelectorAll('#supGrid .sup-card')].find(c=>/(^|[^0-9A-Z])GH3\\b/.test(txt(c.querySelector('.sup-fac-name'))));return c&&c.querySelector('.hnx-pool-ask')?c:null;});
   return {q,form,a:[a.a,a.src],sm:/✅ GH3 water replaced — Tester \\d\\d:\\d\\d \\(checklist\\)/.test(txt(sm)),noQ:!/GH3\\) — was the water/.test(txt(sm)),qc,win:!!ask(),card:/✅ GH3 water replaced/.test(txt(card&&card.querySelector('.hnx-pool-ask')))};`,
  {q:true,form:true,a:['yes','report:checklist'],sm:true,noQ:true,qc:false,win:false,card:true}),

C('🔬 QC Product Inspection saved for GH1 on its cleaning day (Thu 15 Oct, unanswered) → the question window opens ("🧽 Pool P01 (GH1) — was the pool cleaned and the water replaced today?"); ❌ No (crew busy, new date Sat 17 Oct) → outbox pool_GH1_2026-10-15_notdone; saving another inspection opens nothing',
  `T();at('2026-10-15','10:00');T();qcOpenAddInspection();await sleep(200);document.getElementById('qcInsp_facility').value='GH1';qcSaveInspection();await until(()=>ask());
   const head=txt(ask()&&ask().querySelector('h3'));document.getElementById('hpaNo').click();await until(()=>document.getElementById('hpaR'));document.getElementById('hpaR').value='crew';document.getElementById('hpaND').value='2026-10-17';document.getElementById('hpaSaveNo').click();await sleep(300);
   const a=job('PA_PJ_GH1_20260917_20261015')||{};qcOpenAddInspection();await sleep(200);document.getElementById('qcInsp_facility').value='GH1';qcSaveInspection();await sleep(500);
   return {head,a:[a.a,a.src,a.reason,a.newDate],o:outb().filter(x=>/^pool_GH1_/.test(x.id)).map(x=>x.id),again:!!ask()};`,
  {head:'🧽 Pool P01 (GH1) — was the pool cleaned and the water replaced today?',a:['no','report:qc_inspection','Crew busy / short-staffed','2026-10-17'],o:['pool_GH1_2026-10-15_notdone'],again:false}),

C('🏭 Indoor Projects: PRJ11 submitted with no pool history → the window "🧽 PRJ11 has no pool history"; Enter dates (cleaning Thu 1 Oct) → history row pc_m_PRJ11_clean_20261001, job PJ_PRJ11_20261015 (water due 15 Oct) planned Fri 16 Oct as 💧 (review: Thu 15 Oct already holds 2 water changes, GH3 + GH4 — the daily cap holds for every job), its task TSK_POOL_PRJ11_20261015 (pools P11A + P11B)',
  `T();switchView('indoor_projects');await sleep(800);try{_indoorProj='PRJ11';}catch(e){}P.enhance();const strip=txt(document.querySelector('#indoorProjectsBody > .hnx-pool-ask'));
   try{indoorSubmit();}catch(e){}await until(()=>ask());const head=txt(ask()&&ask().querySelector('h3'));
   document.getElementById('hpnC').value='2026-10-01';HNXPOOL._nohist('PRJ11','dates');await sleep(200);const j=job('PJ_PRJ11_20261015')||{};
   return {strip:/PRJ11 has no pool history/.test(strip),head,row:!!row('pc_m_PRJ11_clean_20261001'),j:[j.status,j.plan,j.work,(j.pools||[]).join('+')],t:(task('TSK_POOL_PRJ11_20261015')||{}).title};`,
  {strip:true,head:'🧽 PRJ11 has no pool history',row:true,j:['planned','2026-10-16','water','P11A+P11B'],t:'🧽 PRJ11 · pool water change (P11A + P11B)'}),

C('▶ Start the cycle for PRJ12 (no history) → ONE job PJ_PRJ12_20261020 "first recorded pool cleaning (no history)" on the first day with a free cleaning slot (Thu 15, Fri 16, Sat 17 and Mon 19 Oct already hold 2 cleanings each) → Tue 20 Oct; ⏸ Not running on PRJ12 → that job is cancelled and PRJ12 shows paused',
  `T();const r=P.startCycle('PRJ12');const j=job(r.id)||{};const t=task(j.taskId)||{};const p=P.pause('PRJ12','not built yet');
   return {ok:r.ok,id:r.id,plan:r.plan,j:[j.work,j.nohist],title:t.title,paused:p.ok,after:job(r.id).status,st:P.state().find(R=>R.unit==='PRJ12').state};`,
  {ok:true,id:'PJ_PRJ12_20261020',plan:'2026-10-20',j:['clean',true],title:'🧽 PRJ12 · first recorded pool cleaning (no history) (P12A + P12B + P12C + P12D + P12E + P12F)',paused:true,after:'cancelled',st:'paused'}),

C('🧽 Old pool-cleaning SOP pop-up saved "done" for GH1&2 on Thu 15 Oct → the ✅ Yes form opens pre-filled 🧽 "cleaned + water replaced" for GH1, then GH2 (1 of 2 · 2 of 2); saving both closes both jobs (src sop)',
  `T();at('2026-10-15','09:10');T();markRecurringDone('clean_pool_gutter','GH1&2',{status:'done',note:'SOP 30/30'});await until(()=>document.getElementById('hpaSaveYes'));
   const s1=txt(ask()&&ask().querySelector('.hpa-sub')),k1=(document.querySelector('input[name="hpaK"]:checked')||{}).value;document.getElementById('hpaSaveYes').click();await sleep(300);
   const s2=txt(ask()&&ask().querySelector('.hpa-sub'));document.getElementById('hpaSaveYes').click();await sleep(300);
   return {s1,k1,s2,g1:[job('PJ_GH1_20260917').status,(job('PA_PJ_GH1_20260917_20261015')||{}).src,(job('PA_PJ_GH1_20260917_20261015')||{}).doneKind],g2:job('PJ_GH2_20260917').status,closed:!ask()};`,
  {s1:'1 of 2 · pool SOP',k1:'clean',s2:'2 of 2 · pool SOP',g1:['done','sop','clean'],g2:'done',closed:true}),

Object.assign(C('🛑 Safe mode (?safe=1) → no pool tick: nothing imported, no job, no task',
  `const r=P.tick({});const r2=P.tick({force:true});return {r:r.skipped,r2:r2.skipped,jobs:jobs().length,tasks:tasks().length,rows:hist().length};`,
  {r:'safe mode',r2:'safe mode',jobs:0,tasks:0,rows:0}),{seed:SEED_SAFE}),

C('📈 The dose learner skips a drain + refill day: analyzePoolHistory("P03",14) has samples on 14 Oct and 15 Oct; after ✅ water change GH3 on 15 Oct it has none dated 15 Oct (14 Oct stays) — no formula changed',
  `const R=(e,a,ph,c)=>({EC:e,A:a,B:a,pH:ph,C:c,water:50});const d={};['2026-10-14','2026-10-15'].forEach(x=>{d[x]={P03:{'08:00':R('1.5','2','6.4','1'),'11:00':R('1.7','0','6.2','0')}};});
   localStorage.setItem('hydroPro_irr_pool',JSON.stringify(d));try{if(typeof window.irrPoolCacheClear==='function')window.irrPoolCacheClear();}catch(e){}await sleep(700);
   T();at('2026-10-15','11:00');const before=analyzePoolHistory('P03',14).map(s=>s.date);P.answer('PJ_GH3_20261010',{a:'yes',src:'screen'});await sleep(3100);
   const after=analyzePoolHistory('P03',14).map(s=>s.date);return {before,after};`,
  {before:['2026-10-14','2026-10-15'],after:['2026-10-14']}),

C('🖥 Irrigation → 🧽 Pool care: 14 cards (GH1–GH10 catch-up, PRJ11 + PRJ12 no history, GH15 + GH16 not running), "10 of 10 GHs overdue on water · 6 overdue on cleaning · catch-up until Mon 19 Oct", Production supervisor Ederlyn Torzar, the 8-week plan; the old 🏊 Pool Care link opens it; Production → 🧽 Pool care is the same screen; at 400 px no page scroll',
  `T();switchView('pool_care');await until(()=>{const x=document.getElementById('view-pool_care2');return x&&x.querySelectorAll('.hpc-card').length>=14;});const v=document.getElementById('view-pool_care2'),a=(document.querySelector('.view.active')||{}).id;
   const st=[...v.querySelectorAll('.hpc-card')].map(c=>c.getAttribute('data-unit')+':'+c.className.replace(/.*st-/,''));const sum=txt(v.querySelector('.hpc-sum'));
   const menu=MODULES.irrigation.views.some(x=>x.id==='pool_care'),m2=MODULES.irrigation.views.some(x=>x.id==='pool_care2'),pr=MODULES.production.views.some(x=>x.id==='prod_pool_care');
   return {a,st,sum:/^10 of 10 GHs overdue on water · 6 overdue on cleaning · catch-up until Mon 19 Oct/.test(sum),sup:/Production supervisor: Ederlyn Torzar/.test(sum),plan:!!v.querySelector('.hpc-plan table'),menu,m2,pr};`,
  {a:'view-pool_care2',st:['GH1:catchup','GH2:catchup','GH3:catchup','GH4:catchup','GH5:catchup','GH6:catchup','GH7:catchup','GH8:catchup','GH9:catchup','GH10:catchup','PRJ11:nohist','PRJ12:nohist','GH15:paused','GH16:paused'],
   sum:true,sup:true,plan:true,menu:false,m2:true,pr:true}),

Object.assign(C('📱 Pool care at 400 px: the cards stack, the 8-week plan stays a TABLE (review: a GH row is under 40 px high, display table-row — the phone rule folded it into a 706 px column) and scrolls inside its own box, the page itself never scrolls sideways; the "🧽 4 pool jobs to confirm" pill of ederlynt on Thu 15 Oct 07:00 is inside the screen (review: it sat at x 628–805)',
  `T();switchView('pool_care2');await until(()=>{const x=document.getElementById('view-pool_care2');return x&&x.querySelector('.hpc-plan');});const v=document.getElementById('view-pool_care2'),pl=v.querySelector('.hpc-plan');
   const tr=v.querySelector('.hpc-plan tr:nth-child(2)'),rowH=tr?tr.getBoundingClientRect().height:999,disp=tr?getComputedStyle(tr).display:'';
   const out={wide:document.documentElement.scrollWidth>window.innerWidth+1,inner:pl.scrollWidth>pl.clientWidth,cards:v.querySelectorAll('.hpc-card').length,small:rowH<40,disp};
   at('2026-10-15','07:00');as('ederlynt');P.tick({force:true});const b=await until(()=>document.getElementById('hnxPoolPill'),5000);const r=b?b.getBoundingClientRect():{left:-1,right:9999,width:0};as('tester');
   out.pill=b?b.textContent:'';out.inside=r.width>0&&r.left>=0&&r.right<=window.innerWidth;return out;`,
  {wide:false,inner:true,cards:14,small:true,disp:'table-row',pill:'🧽 4 pool jobs to confirm',inside:true}),{viewport:{width:400,height:820}}),

C('📊 Pool Monitor on Sun 18 Oct after the GH3 water change of Thu 15 Oct: P03 "💧 water changed 3 days ago · next 🧽 cleaning Sat 24 Oct"; P01 (not done, water due 10 Oct) "⚠ water 8 days overdue"; P11A "no pool history"',
  `T();at('2026-10-15','11:00');P.answer('PJ_GH3_20261010',{a:'yes',src:'screen'});at('2026-10-18','09:00');try{_irrDate='2026-10-18';}catch(e){}
   await view('irr_nutrients');await until(()=>{P.enhance();return document.querySelector('.hnx-pc-badges[data-pc-pool="P11A"]')&&document.querySelector('.hnx-pc-badges[data-pc-pool="P03"]');},12000);const b=p=>txt(document.querySelector('.hnx-pc-badges[data-pc-pool="'+p+'"]'));
   return {p3:b('P03'),p1:/⚠ water 8 days overdue/.test(b('P01')),p11:b('P11A')};`,
  {p3:'💧 water changed 3 days ago · next 🧽 cleaning Sat 24 Oct',p1:true,p11:'no pool history'}),

C('🗂 hnxPoolDay("2026-10-15") for the per-user brief → 4 jobs: GH1 clean, GH2 clean, GH3 water (late 5), GH4 water; for "pedro" → GH3 only; the Nexi answer "pool care" reads "Pool care: 10 of 10 GHs overdue on water, 6 on cleaning; catch-up Thu 15 Oct – Mon 19 Oct; next: GH1 + GH2 cleaning, GH3 + GH4 water change Thu 15 Oct …"',
  `T();const d=hnxPoolDay('2026-10-15'),p=hnxPoolDay('2026-10-15','pedro');const a=HNXPOOL.answerText('pool care');
   return {d:d.map(x=>x.unit+' '+x.work+' '+x.lateDays),p:p.map(x=>x.unit),who:d[2].who.ghpUser,a:a.indexOf('Pool care: 10 of 10 GHs overdue on water, 6 on cleaning; catch-up Thu 15 Oct – Mon 19 Oct; next: GH1 + GH2 cleaning, GH3 + GH4 water change Thu 15 Oct')===0};`,
  {d:['GH1 clean 28','GH2 clean 28','GH3 water 5','GH4 water 5'],p:['GH3'],who:'pedro',a:true}),

C('🔥 Recurring Tasks hub: the "🧽 Pool care — rolling: water every 14 days · cleaning monthly" card lists this week’s jobs (Thu 15 Oct GH1 …); the old weekly "Pool cleaning & NFT gutter flush" row says "Full pool cleaning + 14-day water change are 🧽 Pool care jobs"',
  `T();await view('prod_recurring');const c=await until(()=>{P.enhance();return document.querySelector('.hnx-pool-gutter')&&document.querySelector('.hnx-pool-hub');},12000);
   return {card:/🧽 Pool care — rolling: water every 14 days · cleaning monthly/.test(txt(c)),gh1:/Thu 15 Oct · 🧽 GH1 cleaning \\+ water/.test(txt(c)),
     note:document.querySelectorAll('.hnx-pool-gutter').length>0,noteTxt:txt(document.querySelector('.hnx-pool-gutter'))};`,
  {card:true,gh1:true,note:true,noteTxt:'Full pool cleaning + 14-day water change are 🧽 Pool care jobs'}),

C('✎ Change answer the same day (Yes → No) for GH3 on Thu 15 Oct: the history row pc_PJ_GH3_20261010_20261015 is voided, PJ_GH3_20261010 is open again (plan Sat 17 Oct), the next job PJ_GH3_20261024 is cancelled, and Dr Amy + Eyal ARE told (review): alert true, ONE outbox pool_GH3_2026-10-15_notdone; No → Yes → No again → still 1 outbox',
  `T();at('2026-10-15','11:00');P.answer('PJ_GH3_20261010',{a:'yes',src:'screen'});const n1=job('PJ_GH3_20261024').status;
   const r=P.answer('PJ_GH3_20261010',{a:'no',reasonCode:'other',reason:'answered by mistake',newDate:'2026-10-17',src:'screen'});
   const out={n1,ok:r.ok,alert:r.alert,void:row('pc_PJ_GH3_20261010_20261015').void,j:[job('PJ_GH3_20261010').status,job('PJ_GH3_20261010').plan],next:job('PJ_GH3_20261024').status,o:outb().map(x=>x.id+' '+x.to.join('+')),t:task('TSK_POOL_GH3_20261010').status};
   P.answer('PJ_GH3_20261010',{a:'yes',src:'screen'});P.answer('PJ_GH3_20261010',{a:'no',reasonCode:'crew',newDate:'2026-10-17',src:'screen'});out.o2=outb().length;return out;`,
  {n1:'planned',ok:true,alert:true,void:true,j:['planned','2026-10-17'],next:'cancelled',o:['pool_GH3_2026-10-15_notdone amy+eyal'],t:'todo',o2:1}),

C('🔒 Who may answer: qc1 (no Production / Irrigation edit, not the supervisor) cannot answer from 🧽 Pool care, but can from a QC report form; pedro (GH3 person) can answer GH3',
  `T();at('2026-10-15','10:00');as('qc1');const a=P.answer('PJ_GH4_20261010',{a:'yes',src:'screen'}),b=P.answer('PJ_GH4_20261010',{a:'yes',src:'report:qc_process'});as('pedro');const c=P.answer('PJ_GH3_20261010',{a:'yes',src:'ask'});as('tester');
   return {a:a.ok,b:b.ok,c:c.ok,by:(job('PA_PJ_GH3_20261010_20261015')||{}).by};`,
  {a:false,b:true,c:true,by:'pedro'}),

C('🆘 Help: the guide "Pool care — water every 14 days, cleaning monthly" (pool_care) is dated added + updated 2026-10-15 (v23.48 / v23.49) and links Irrigation ▸ 🧽 Pool care; m_irrigation, m_production, m_quality and tasks mention 🧽 Pool care',
  `const g=HNX_HELP_GUIDES.find(x=>x.id==='pool_care')||{};const s=id=>JSON.stringify(HNX_HELP_GUIDES.find(x=>x.id===id)||{});
   HNX_HELP.open('pool_care');await sleep(300);const links=[...document.querySelectorAll('#hnxhOv .hnxh-go')].map(b=>(b.getAttribute('onclick')||'').match(/go\\('([^']+)'/)).filter(Boolean).map(m=>m[1]);HNX_HELP.close();
   return {title:g.title,added:(g.added||{}).date,updated:(g.updated||{}).date,link:links.includes('pool_care2')||links.includes('prod_pool_care'),mods:['m_irrigation','m_production','m_quality','tasks'].filter(id=>/🧽 Pool care/.test(s(id)))};`,
  {title:'Pool care — water every 14 days, cleaning monthly',added:'2026-10-15',updated:'2026-10-15',link:true,mods:['m_irrigation','m_production','m_quality','tasks']}),
/* ---------- v23.48 review fixes (3 reviews, 33 findings) ---------- */
C('📅 Daily cap for EVERY job (review): PH holidays Thu 24 + Fri 25 + Wed 30 + Thu 31 Dec 2026 and Fri 1 Jan 2027, every job answered ✅ on its planned day from Thu 15 Oct 2026 to Sun 28 Feb 2027 → 0 days with more than 2 cleanings or 2 water changes (before the fix: Sat 26 Dec 6 water changes, Sat 9 Jan 6 cleanings, for good); the 8-week forecast of 14 Oct keeps the same cap',
  `const H=JSON.parse(localStorage.getItem('hydroPro_ph_holidays')||'{}');['2026-12-24','2026-12-25','2026-12-30','2026-12-31','2027-01-01'].forEach(d=>{H[d]={name:'holiday',kind:'regular'};});localStorage.setItem('hydroPro_ph_holidays',JSON.stringify(H));
   T();const F=P.forecastAll({weeks:8}),fc={};openJobs().forEach(j=>{const k=j.plan+'|'+j.work;fc[k]=(fc[k]||0)+1;});Object.keys(F).forEach(u=>F[u].forEach(f=>{const k=f.date+'|'+f.work;fc[k]=(fc[k]||0)+1;}));
   const fcOver=Object.keys(fc).filter(k=>fc[k]>2);
   const add=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);let d='2026-10-15',days={},err=[],n=0;
   while(d<='2027-02-28'){at(d,'12:00');T();openJobs().filter(j=>j.plan===d).forEach(j=>{const r=P.answer(j.id,{a:'yes',src:'screen'});if(!r.ok)err.push(d+' '+j.id+' '+r.why);n++;const k=d+'|'+j.work;days[k]=(days[k]||0)+1;});d=add(d,1);}
   return {over:Object.keys(days).filter(k=>days[k]>2).map(k=>k+' '+days[k]),fcOver,err:err.slice(0,3),many:n>=90,hol:Object.keys(days).filter(k=>/^(2026-12-2[45]|2026-12-3[01]|2027-01-01)\\|/.test(k))};`,
  {over:[],fcOver:[],err:[],many:true,hol:[]}),

C('🧾 One history line per answer (review): GH1 ✅ "only the water" Thu 15 Oct then ✅ cleaned Fri 16 Oct → 2 lines pc_PJ_GH1_20260917_20261015 (water) + pc_PJ_GH1_20260917_20261016 (clean), GH1 last cleaning 16 Oct; GH2 ✅ "only the water" then ✎ ❌ the same day → its line voided, GH2 last water back to 26 Sep, Dr Amy + Eyal told (outbox pool_GH2_2026-10-15_notdone)',
  `T();at('2026-10-15','11:30');const a=P.answer('PJ_GH1_20260917',{a:'yes',doneKind:'water',src:'screen'});
   P.answer('PJ_GH2_20260917',{a:'yes',doneKind:'water',src:'screen'});const b=P.answer('PJ_GH2_20260917',{a:'no',reasonCode:'other',reason:'written by mistake',newDate:'2026-10-16',src:'screen'});
   at('2026-10-16','11:30');T();const c=P.answer('PJ_GH1_20260917',{a:'yes',doneKind:'clean',src:'screen'});
   const L=hist().filter(r=>/^pc_PJ_GH[12]_/.test(r.id)).map(r=>r.id+' '+r.type+' '+r.date+(r.void?' void':'')).sort();
   return {ok:[a.ok,b.ok,b.alert,c.ok],L,g1:P.rules('GH1').lastClean,g2:P.rules('GH2').lastWater,o:outb().map(x=>x.id).filter(x=>/GH[12]_/.test(x))};`,
  {ok:[true,true,true,true],L:['pc_PJ_GH1_20260917_20261015 water 2026-10-15','pc_PJ_GH1_20260917_20261016 clean 2026-10-16','pc_PJ_GH2_20260917_20261015 water 2026-10-15 void'],g1:'2026-10-16',g2:'2026-09-26',o:['pool_GH2_2026-10-15_notdone']}),

C('⚠ Honest lateness (review): Wed 14 Oct — the GH9 task says "Water change due Wed 30 Sep (14 days overdue) · cleaning due Fri 16 Oct (in 2 days)", priority critical with reason "Pool P09: water 28 days old (rule 14), last cleaning 28 days ago"; GH6–GH9 critical, GH1–GH5 + GH10 high; hnxPoolDay("2026-10-19") → GH9 19 days late, GH10 13; the GH9 ask on Mon 19 Oct says "water 19 days overdue"',
  `T();const t=task('TSK_POOL_GH9_20260930');const pr=openJobs().sort((a,b)=>(+a.unit.replace(/\\D/g,''))-(+b.unit.replace(/\\D/g,''))).map(j=>j.unit+' '+task(j.taskId).priority);
   const d=window.hnxPoolDay('2026-10-19').map(x=>x.unit+' '+x.lateDays);at('2026-10-19','11:05');T();const a=inbox().find(x=>x.id==='POOLASK_PJ_GH9_20260930_20261019_ederlynt_1');
   return {desc:/Water change due Wed 30 Sep \\(14 days overdue\\) · cleaning due Fri 16 Oct \\(in 2 days\\)/.test(t.desc),prio:t.priority,why:t.criticalReason,pr,d,ask:/water 19 days overdue/.test((a||{}).text||'')};`,
  {desc:true,prio:'critical',why:'Pool P09: water 28 days old (rule 14), last cleaning 28 days ago',pr:['GH1 high','GH2 high','GH3 high','GH4 high','GH5 high','GH6 critical','GH7 critical','GH8 critical','GH9 critical','GH10 high'],d:['GH9 19','GH10 13'],ask:true}),

C('👤 Who is asked follows ⚙ Rules and Tasks (review): Eyal sets the Production supervisor to jomel → the open jobs ask jomel (GH1 who.sup jomel and its task owner jomel; GH3 sup jomel, task still pedro — the GH person); pedro gives the GH3 task to ederlynt in Tasks → the GH3 job asks ederlynt (taskOwner + who.ghpUser ederlynt, task owner ederlynt)',
  `T();as('eyal');const r=P.saveCfg({sup:'jomel'});as('tester');T();const j1=job('PJ_GH1_20260917'),j3=job('PJ_GH3_20261010');const a=[j1.who.sup,task('TSK_POOL_GH1_20260917').owner,j3.who.sup,task('TSK_POOL_GH3_20261010').owner];
   as('pedro');const u=HNXTASKS.update('TSK_POOL_GH3_20261010',{owner:'ederlynt'});as('tester');at('2026-10-14','09:05');T();const k=job('PJ_GH3_20261010');
   return {ok:r.ok,a,u:!!u,b:[k.taskOwner,k.who.ghpUser,task('TSK_POOL_GH3_20261010').owner]};`,
  {ok:true,a:['jomel','jomel','jomel','pedro'],u:true,b:['ederlynt','ederlynt','ederlynt']}),

C('🔒 A view-only reader never answers (review): viewer1 (Production / Quality / Irrigation view only) on Thu 15 Oct — ✅ from QC Process Inspection refused ("🔒 From this report only … edit quality …"), the QC bar shows "🔒 Ederlyn Torzar answers this" and no ✅ / ❌; qc1 (Quality editor) gets ✅ / ❌ and answers GH4',
  `const U=JSON.parse(localStorage.getItem('hydroPro_users'));U.push({username:'viewer1',fullname:'Viewer One',passwordHash:'x',role:'operator',department:'hr',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
   const pm=JSON.parse(localStorage.getItem('hydroPro_user_perms')||'{}');pm.viewer1={overrides:{'module:quality':'view','module:production':'view','module:irrigation':'view'}};localStorage.setItem('hydroPro_user_perms',JSON.stringify(pm));
   T();at('2026-10-15','10:00');as('viewer1');const a=P.answer('PJ_GH4_20261010',{a:'no',reasonCode:'crew',newDate:'2026-10-16',src:'report:qc_process'});
   const h=document.createElement('div');document.body.appendChild(h);P.strip(h,{src:'report:qc_process',units:['GH4']});const v=h.innerHTML;h.innerHTML='';
   as('qc1');P.strip(h,{src:'report:qc_process',units:['GH4']});const q=h.innerHTML;const b=P.answer('PJ_GH4_20261010',{a:'yes',src:'report:qc_process'});as('tester');h.remove();
   return {a:a.ok,why:/^🔒 From this report only .*edit quality/.test(a.why||''),vLock:/🔒 Ederlyn Torzar answers this/.test(v),vBtn:/hpc-yes/.test(v),qBtn:/hpc-yes/.test(q)&&/hpc-no/.test(q),b:b.ok,o:outb().length};`,
  {a:false,why:true,vLock:true,vBtn:false,qBtn:true,b:true,o:0}),

C('📅 A date moved in Tasks (review): pedro (owner of the GH3 task) sets its due to Sun 20 Dec → refused: the job stays Thu 15 Oct and the task goes back to 15 Oct; ederlynt (supervisor) sets Sun 25 Oct → job Mon 26 Oct (Sunday → next working day), task 26 Oct; Eyal sets the GH4 task to 1 Oct (past) → refused, stays 15 Oct',
  `T();as('pedro');HNXTASKS.update('TSK_POOL_GH3_20261010',{due:'2026-12-20'});as('tester');at('2026-10-14','09:05');T();const a=[job('PJ_GH3_20261010').plan,task('TSK_POOL_GH3_20261010').due];
   as('ederlynt');HNXTASKS.update('TSK_POOL_GH3_20261010',{due:'2026-10-25'});as('tester');at('2026-10-14','09:10');T();const j=job('PJ_GH3_20261010'),b=[j.plan,task('TSK_POOL_GH3_20261010').due,(j.replans.slice(-1)[0]||{}).by];
   as('eyal');HNXTASKS.update('TSK_POOL_GH4_20261010',{due:'2026-10-01'});as('tester');at('2026-10-14','09:15');T();
   return {a,b,c:[job('PJ_GH4_20261010').plan,task('TSK_POOL_GH4_20261010').due]};`,
  {a:['2026-10-15','2026-10-15'],b:['2026-10-26','2026-10-26','ederlynt'],c:['2026-10-15','2026-10-15']}),

C('❌ A new date on a Sunday or holiday (review): ❌ for GH4 on Thu 15 Oct with new date Sun 18 Oct → planned Mon 19 Oct (newDate 2026-10-19); the reason "pump problem EC 1.75" is kept as "EC 1.7" and the outbox carries the reason-free copy text2 "… Reason: written in Nexi. …"',
  `T();at('2026-10-15','12:00');const r=P.answer('PJ_GH4_20261010',{a:'no',reasonCode:'other',reason:'pump problem EC 1.75',newDate:'2026-10-18',src:'screen'});const o=outb()[0]||{};
   return {nd:r.newDate,plan:job('PJ_GH4_20261010').plan,reason:(job('PA_PJ_GH4_20261010_20261015')||{}).reason,t2:/Reason: written in Nexi\\. New date: Mon 19 Oct/.test(o.text2||''),t1:/EC 1\\.7\\./.test(o.text||'')};`,
  {nd:'2026-10-19',plan:'2026-10-19',reason:'pump problem EC 1.7',t2:true,t1:true}),

Object.assign(C('🕰 A computer on another time zone (review): the page in UTC — the 14 Oct catch-up still starts Thu 15 Oct, and at Fri 16 Oct 07:40 Manila (Thu 15 Oct 23:40 UTC) the morning note is POOLDAY_20261016 "🧽 Today (Fri 16 Oct)" naming GH5 + GH6 and "Still open from Thu 15 Oct: GH1 …"',
  `T();const p=job('PJ_GH1_20260917').plan;at('2026-10-16','07:40');T();const n=inbox().find(x=>x.id==='POOLDAY_20261016_ederlynt')||{};
   return {p,ids:inbox().filter(x=>/^POOLDAY_/.test(x.id)).map(x=>x.id).sort(),title:n.title,txt:/^Today: GH5 pool cleaning with water change \\(P05\\) · GH6 pool cleaning with water change \\(P06\\)\\. Still open from Thu 15 Oct: GH1 /.test(n.text||'')};`,
  {p:'2026-10-15',ids:['POOLDAY_20261016_ederlynt','POOLDAY_20261016_pedro'],title:'🧽 Today (Fri 16 Oct): 6 pool jobs',txt:true}),{tz:'UTC'}),

C('🌆 Saturday evening (review): a job planned yesterday is asked "on Thu 15 Oct?" (Fri 16 Oct 07:00, before the 08:00 sweep), never "today?"; Sat 17 Oct 17:05 → the in-app note POOLEVE_20261019_ederlynt "🧽 Next working day (Mon 19 Oct): 2 pool jobs" (GH9 + GH10) — the same evening as the WhatsApp from nexi@',
  `T();at('2026-10-16','07:00');const h=document.createElement('div');document.body.appendChild(h);P.strip(h,{src:'report:checklist',units:['GH3']});const s=h.textContent;h.remove();
   at('2026-10-17','17:05');T();const n=inbox().find(x=>x.id==='POOLEVE_20261019_ederlynt')||{};
   return {ask:/was the water replaced on Thu 15 Oct\\?/.test(s)&&!/replaced today\\?/.test(s),title:n.title,body:/^Next working day \\(Mon 19 Oct\\): GH9 pool cleaning with water change \\(P09\\) · GH10 /.test(n.text||'')};`,
  {ask:true,title:'🧽 Next working day (Mon 19 Oct): 2 pool jobs',body:true}),

C('📜 Correcting one GH of Eder’s 15 Sep line (review): from GH3’s 📜 History the line "September 15 - GH1, 2, 3, 4, 5, 6" is corrected to 16 Sep for GH3 only → pc_m_GH3_water_20260916; GH1, GH2, GH4, GH5, GH6 keep 15 Sep (pc_k_* lines, source eder-1410); GH6 last water stays Tue 15 Sep',
  `T();const r=P.correct('pc_e1410_water_20260915_1-2-3-4-5-6',{date:'2026-09-16',why:'GH3 was the day after',unit:'GH3'});
   const L=hist().filter(x=>/^pc_[km]_GH\\d+_water_2026091[56]$/.test(x.id)).map(x=>x.id+' '+(x.src||'')).sort();
   return {ok:r.ok,L,old:!!(row('pc_e1410_water_20260915_1-2-3-4-5-6')||{}).void,g6:P.rules('GH6').lastWater};`,
  {ok:true,L:['pc_k_GH1_water_20260915 eder-1410','pc_k_GH2_water_20260915 eder-1410','pc_k_GH4_water_20260915 eder-1410','pc_k_GH5_water_20260915 eder-1410','pc_k_GH6_water_20260915 eder-1410','pc_m_GH3_water_20260916 manual'],old:true,g6:'2026-09-15'}),

C('🔗 The supervisor opens 🧽 Pool care from a task (review): as ederlynt (Production, no Irrigation) the pool link of a task (HNXTASKS.go) and HNXPOOL.open() from home both open Production ▸ 🧽 Pool care (view-prod_pool_care)',
  `T();as('ederlynt');await view('home');HNXTASKS.go({type:'pool',id:'PJ_GH3_20261010'});const a=await until(()=>{const v=document.querySelector('.view.active');return v&&v.id==='view-prod_pool_care'?v.id:null;},6000);
   await view('home');P.open();const b=await until(()=>{const v=document.querySelector('.view.active');return v&&v.id==='view-prod_pool_care'?v.id:null;},6000);as('tester');
   return {a,b};`,
  {a:'view-prod_pool_care',b:'view-prod_pool_care'}),

C('↺ A ✅ done pool task set back to To do (review): ederlynt answers GH3 ✅ on Thu 15 Oct, then sets TSK_POOL_GH3_20261010 back to To do in Tasks → the next tick puts it back to Done and tells her "… use ✎ Change in 🧽 Pool care …"; cancelling the open GH4 task in Tasks = ❌ Not done → outbox pool_GH4_2026-10-15_notdone to amy + eyal',
  `T();at('2026-10-15','11:00');as('ederlynt');P.answer('PJ_GH3_20261010',{a:'yes',src:'screen'});HNXTASKS.setStatus('TSK_POOL_GH3_20261010','todo');const mid=task('TSK_POOL_GH3_20261010').status;
   at('2026-10-15','11:02');T();const st=task('TSK_POOL_GH3_20261010').status;
   HNXTASKS.setStatus('TSK_POOL_GH4_20261010','cancelled',{reason:'no time'});at('2026-10-15','11:04');T();as('tester');
   return {mid,st,told:toasts.some(m=>/use ✎ Change in 🧽 Pool care/.test(m)),o:outb().map(x=>x.id+' '+x.to.join('+'))};`,
  {mid:'todo',st:'done',told:true,o:['pool_GH4_2026-10-15_notdone amy+eyal']}),

C('🥬 A back-filled checklist asks nothing about today (review): on Thu 15 Oct the ✅ Checklist for GH3 shows the 🧽 bar; set to back-fill Wed 14 Oct (_clEditDate) → no bar; back to today → the bar again',
  `T();at('2026-10-15','10:00');await view('checklist');const s=document.getElementById('facSelect');if(s){s.value=[...s.options].map(o=>o.value).find(v=>/^GH\\s*3$|^GH3$/i.test(v))||s.value;s.dispatchEvent(new Event('change',{bubbles:true}));}
   await sleep(400);P.enhance();const a=!!document.querySelector('#clBody > .hnx-pool-ask');window._clEditDate='2026-10-14';P.enhance();const b=!!document.querySelector('#clBody > .hnx-pool-ask');window._clEditDate=null;P.enhance();const c=!!document.querySelector('#clBody > .hnx-pool-ask');
   return {a,b,c};`,
  {a:true,b:false,c:true}),

C('🛡 Two computers make the same bytes (review, Data Safety): the 10 catch-up jobs made at 09:00 and again on a fresh store at 13:00 are byte-identical; each new job is stamped with its own base (GH1: updatedAt = createdAt = Tue 15 Sep 08:00 Manila); a computer whose last cloud download is 20 min old says no "no answer" at 08:00 (0 outbox), a fresh one does (4)',
  `T();const a=localStorage.getItem('hydroPro_pool_jobs_v1');const g1=job('PJ_GH1_20260917');localStorage.removeItem('hydroPro_pool_jobs_v1');localStorage.removeItem('hydroPro_tasks_v1');at('2026-10-14','13:00');T();const b=localStorage.getItem('hydroPro_pool_jobs_v1');
   at('2026-10-16','08:05');localStorage.setItem('hnx_cloud_token','test-token');window.__hnxLastPullAt=M('2026-10-16','07:45');const r1=T();window.__hnxLastPullAt=M('2026-10-16','08:04');const r2=T();localStorage.removeItem('hnx_cloud_token');
   return {same:a===b,st:[g1.updatedAt===M('2026-09-15','08:00'),g1.createdAt===M('2026-09-15','08:00')],stale:(r1.outbox||[]).length,fresh:(r2.outbox||[]).length};`,
  {same:true,st:[true,true],stale:0,fresh:4}),
/* ---------- v23.48 review fix 2 (15 Oct 2026): the holiday rule proven for ONE holiday over 150 days ---------- */
C('📅 One holiday (review fix 2): only Fri 25 Dec 2026 in hydroPro_ph_holidays, every job ✅ on its planned day for 150 days from Thu 15 Oct 2026 (≥ 100 answers) → 0 days after 26 Dec with more than 2 cleanings or 2 water changes, nothing on a Sunday or on 25 Dec; Christmas week: Thu 24 Dec GH1 + GH2 W · Sat 26 Dec GH5 + GH6 W · Mon 28 Dec GH7 + GH8 W · Tue 29 Dec GH9 + GH10 W · Sat 2 Jan GH3 + GH4 W · Thu 7 Jan GH1 + GH2 C · Sat 9 Jan GH5 + GH6 C · Mon 11 Jan GH7 + GH8 C · Tue 12 Jan GH9 + GH10 C',
  `localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-12-25':{name:'Christmas Day',kind:'regular'}}));T();
   const add=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10),un=u=>+String(u).replace(/\\D/g,'');let d='2026-10-15',days={},err=[],n=0;
   for(let i=0;i<150;i++){at(d,'12:00');T();openJobs().filter(j=>j.plan===d).sort((a,b)=>un(a.unit)-un(b.unit)).forEach(j=>{const r=P.answer(j.id,{a:'yes',src:'screen'});if(!r.ok)err.push(d+' '+j.id+' '+r.why);n++;(days[d]=days[d]||[]).push(j.unit+' '+(j.work==='clean'?'C':'W'));});d=add(d,1);}
   const over=Object.keys(days).filter(k=>k>'2026-12-26'&&(days[k].filter(x=>/C$/.test(x)).length>2||days[k].filter(x=>/W$/.test(x)).length>2)).map(k=>k+' '+days[k].join(','));
   const off=Object.keys(days).filter(k=>k==='2026-12-25'||new Date(k+'T00:00:00Z').getUTCDay()===0);
   const xmas=Object.keys(days).filter(k=>k>='2026-12-24'&&k<='2027-01-12').sort().map(k=>k+' '+days[k].join(','));
   return {over,off,err:err.slice(0,3),many:n>=100,xmas};`,
  {over:[],off:[],err:[],many:true,xmas:['2026-12-24 GH1 W,GH2 W','2026-12-26 GH5 W,GH6 W','2026-12-28 GH7 W,GH8 W','2026-12-29 GH9 W,GH10 W','2027-01-02 GH3 W,GH4 W','2027-01-07 GH1 C,GH2 C','2027-01-09 GH5 C,GH6 C','2027-01-11 GH7 C,GH8 C','2027-01-12 GH9 C,GH10 C']}),
];
