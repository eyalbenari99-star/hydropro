/* v22.18 part 2 — 🛡 Data Safety holds what OVERWRITES newer work, not ordinary work.
   Jinky, 8 Oct 2026 (payday 9 Oct): every trip-incentive day showed "⏳ pending logistics check" although Syra had checked them.
   Syra's "✔ Logistics: check all pending in list" rewrote dozens of trip days at once (stamped now). The upload gate
   (__hnxPushGuard) counted them like a stale copy overwriting the cloud and HELD the upload on her computer; the banner is the
   primary admin's only, so nobody saw it and her checks never left her computer.
   For the TRIP STORES ONLY (trip log + trip journal) the gate now asks which copy is newer, by each day's own stamp (updatedAt /
   per-field stamps, strictly later) and a day moved backwards in status (approved / checked → pending) is never "newer work".
   A day's `src` (part 1's per-computer bookkeeping) and key order are no change. Every other store keeps the v22.16 count rule
   (data-safety.test.js v21.72 case unchanged; case (g) here: a stale roster re-stamped by the setItem wrapper is still HELD).
   A held trip store first takes in the cloud's newer days (the newest-wins merge a pull skips while the key is dirty), then is
   weighed again; the owner's "☁ Take the cloud copy on EVERY computer" always comes first.
   The fixtures: a 61-day trip log, cloud copy stamped T0, checks stamped T1 (later). Thresholds unchanged: a store of 61 is
   held at >= 19 removed, or >= 31 removed + rewritten-with-an-older-or-undated-copy. */
/* page-side helpers (stringified into each run) */
const H=`
  const LK='hydroPro_trip_log_v1',JK='hydroPro_trip_journal_v1',HK='hnxlocal_push_held_v1';
  const T0=1790000000000,T1=T0+3600e3;
  const dt=i=>new Date(Date.UTC(2026,7,1+i,12)).toISOString().slice(0,10);
  /* source 'manual' keeps the Deliveries→Trips bridge away from these fixture days */
  const tday=(i,t,x)=>Object.assign({id:'dlvday_'+dt(i)+'_e1',date:dt(i),driverId:'E1',driverName:'OLAZO, ARCADIO JR',helperId:'E2',truck:'NIF-6891',trips:['manila','manila'],status:'pending',source:'manual',createdAt:T0,updatedAt:t},x||{});
  const check=(i,t)=>tday(i,t,{status:'checked',checkedBy:'Syra',checkedAt:t});
  const src=(i,tag)=>({src:{v:1,at:T0,rows:{['dl'+i]:[T0,(tag||'h')+i]}}}); /* the v22.18 part 1 bookkeeping note: written without an updatedAt bump, different per computer */
  const log=(n,f,from)=>JSON.stringify(Array.from({length:n},(_,i)=>f(i+(from||0))));
  const fnv=s=>{s=String(s||'');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
  const lines=[];const _au=window.audit;window.audit=function(a,d){lines.push(String(d||''));try{return _au.apply(this,arguments);}catch(e){}};
  const reset=()=>{const h=HNXDS.held();Object.keys(h).forEach(k=>delete h[k]);localStorage.setItem(HK,'{}');};
  const PK='hydroPro_ds_owner_policy_v1',AK='hnxlocal_ds_policy_applied_v1';
`;
const run=fn=>new Function('return (async()=>{'+H+' try{ return await ('+fn.toString()+')(); } finally { window.audit=_au; } })();');

module.exports=[
{ name:'🛡 (a) Syra\'s ✔ Check all uploads: a 61-day trip log where 25 days were checked here (newer stamps) and the other 36 only gained the part 1 src note is NOT held — v22.16 HELD it (0 removed, 61 changed of 61); the src note is no change (25 changed, 25 forward); 40 of 61 checked here is not held either (v22.16 HELD 40 of 61; 40 changed, 40 forward)',
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>tday(i,T0));
    const syra=log(61,i=>i<25?Object.assign(check(i,T1),src(i)):Object.assign(tday(i,T0),src(i)));
    const forty=log(61,i=>i<40?check(i,T1):tday(i,T0));
    window.__hnxCloudRaw[LK]=cloud;
    const o1=window.__hnxPushGuard({[LK]:syra});const h1=!!HNXDS.held()[LK];
    reset();
    const o2=window.__hnxPushGuard({[LK]:forty});const h2=!!HNXDS.held()[LK];
    const s1=window.__hnxDsStats(cloud,syra,LK,true)||{},s2=window.__hnxDsStats(cloud,forty,LK,true)||{};
    reset();
    return {up25:LK in o1,held25:h1,up40:LK in o2,held40:h2,fwd:[s1.fwd,s2.fwd],changed:[s1.changed,s2.changed]};}),
  expect:{up25:true,held25:false,up40:true,held40:false,fwd:[25,40],changed:[25,40]} },

{ name:'🛡 (b) a STALE trip log is still HELD, then HEALED, never uploaded as it is: a computer that missed 40 of Syra\'s checks (its 40 days 1 h older than the cloud\'s) → HELD (40 changed, 0 forward); a v22.16 hold of that same stale copy is weighed again at load: it first takes in the cloud\'s 40 newer days (the merge a pull skips while the key is dirty) → 1 released, 40 checked here, and what then goes up carries the 40 checks and 0 older days',
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>i<40?Object.assign(check(i,T1),src(i)):Object.assign(tday(i,T0),src(i)));
    const stale=log(61,i=>tday(i,T0));
    window.__hnxCloudRaw[LK]=cloud;
    const o=window.__hnxPushGuard({[LK]:stale});const e=HNXDS.held()[LK]||{},st=e.stats||{};
    /* the same pair, held by v22.16 (no rule mark) → re-weighed by the load-time sweep */
    reset();const h=HNXDS.held();h[LK]={at:Date.now()-3600e3,stats:{removed:0,changed:61,added:0,before:61,after:61},hash:fnv(stale),cloudHash:fnv(cloud),logged:1};
    localStorage.setItem(HK,JSON.stringify(h));localStorage.setItem(LK,stale);
    lines.length=0;
    const n=HNXDS.releaseOld();const e2=HNXDS.held()[LK];
    const here=JSON.parse(localStorage.getItem(LK)||'[]');
    const out=window.__hnxPushGuard({[LK]:localStorage.getItem(LK)});const up=out[LK]?JSON.parse(out[LK]):[];
    const cl=JSON.parse(cloud),byId={};cl.forEach(d=>byId[d.id]=d);
    reset();
    return {held:!(LK in o)&&!!e.at,changed:st.changed,fwd:st.fwd,released:n,stays:!!e2,hereChecked:here.filter(d=>d.status==='checked').length,
      upChecked:up.filter(d=>d.status==='checked').length,upOlder:up.filter(d=>byId[d.id]&&d.updatedAt<byId[d.id].updatedAt).length,audit:lines.filter(l=>/RELEASED/.test(l)).length};}),
  expect:{held:true,changed:40,fwd:0,released:1,stays:false,hereChecked:40,upChecked:40,upOlder:0,audit:1} },

{ name:'🛡 (c) removing 20 of 61 trip days is still HELD even when the other 30 changes are newer checks made here: the hold reads "20 removed · 30 changed (30 newer here) · 0 added of 61"',
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>tday(i,T0));
    const local=log(41,i=>i<50?check(i,T1):tday(i,T0),20); /* days 0-19 gone, 20-49 checked here, 50-60 as they were */
    window.__hnxCloudRaw[LK]=cloud;
    const o=window.__hnxPushGuard({[LK]:local});const st=(HNXDS.held()[LK]||{}).stats||{};
    switchView('admin_datasafety');await sleep(600);const txt=(document.getElementById('view-admin_datasafety')||{}).innerText||'';
    reset();
    return {held:!(LK in o),removed:st.removed,changed:st.changed,fwd:st.fwd,screen:/20 removed · 30 changed \(30 newer here\) · 0 added of 61/.test(txt)};}),
  expect:{held:true,removed:20,changed:30,fwd:30,screen:true} },

{ name:'🛡 (d) an OLD hold made only of forward edits is released at load: Syra\'s v22.16 hold of the trip log (25 checked + 36 src notes, "0 removed, 61 changed of 61") → the load-time sweep releases 1 hold with 1 audit line, marks the key for upload, and the next sync\'s gate passes the trip log with its 25 checked days',
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>tday(i,T0));
    const syra=log(61,i=>i<25?Object.assign(check(i,T1),src(i)):Object.assign(tday(i,T0),src(i)));
    window.__hnxCloudRaw[LK]=cloud;localStorage.setItem(LK,syra);
    const h=HNXDS.held();h[LK]={at:Date.now()-6*3600e3,stats:{removed:0,changed:61,added:0,before:61,after:61},hash:fnv(syra),cloudHash:fnv(cloud),logged:1};
    localStorage.setItem(HK,JSON.stringify(h));
    lines.length=0;
    const n=HNXDS.releaseOld?HNXDS.releaseOld():null;
    const heldAfter=!!HNXDS.held()[LK],stored=LK in (JSON.parse(localStorage.getItem(HK)||'{}')||{});
    const audits=lines.filter(l=>/RELEASED/.test(l)&&/trip log/.test(l)).length;
    /* marked for upload (the dirty map is saved on a short debounce), and the next sync's gate lets it through */
    const dirtyNow=()=>{try{return LK in (JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}')||{});}catch(e){return false;}};
    for(let i=0;i<25&&!dirtyNow();i++)await sleep(200);
    const out=window.__hnxPushGuard({[LK]:localStorage.getItem(LK)});
    const up=out[LK];const checked=up?JSON.parse(up).filter(d=>d.status==='checked').length:0;
    reset();
    return {released:n,heldAfter,stored,audits,dirty:dirtyNow(),pushed:!!up,checked};}),
  expect:{released:1,heldAfter:false,stored:false,audits:1,dirty:true,pushed:true,checked:25} },

{ name:'🛡 (e) a non-admin computer is told, the owner is alerted: Syra (logistics, not primary admin) whose trip-log upload is HELD (20 of 61 removed) sees "🛡 Your changes to trip log are waiting for the owner\'s OK before they reach other computers" and no admin banner; the primary admin (eyal) gets exactly 1 inbox alert naming Syra and the trip log, still 1 after three more sync cycles; on the owner\'s session the notice goes and the banner shows',
  seed:(()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',fullname:'Eyal Ben-Ari',passwordHash:'x',role:'admin',active:true},{username:'syra',fullname:'Syra',passwordHash:'x',role:'user',department:'Logistics',active:true}]));
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'syra',loginAt:Date.now()}));
    localStorage.setItem('hydroPro_pa_inbox_v1','[]');}),
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>tday(i,T0));const local=log(41,i=>tday(i,T0),20);
    window.__hnxCloudRaw[LK]=cloud;
    const o=window.__hnxPushGuard({[LK]:local});await sleep(300);
    for(let i=0;i<3;i++){window.__hnxPushGuard({[LK]:local});HNXDS.banner();await sleep(100);}
    const note=document.getElementById('hnxDsHeldNote'),txt=note?note.innerText:'';
    const banner=!!document.getElementById('hnxDsBanner');
    const box=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x&&x.itemId==='datasafety');
    const mine=box.filter(x=>x.user==='eyal');
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));HNXDS.banner();await sleep(100);
    const ownerNote=!!document.getElementById('hnxDsHeldNote'),ownerBanner=!!document.getElementById('hnxDsBanner');
    reset();HNXDS.banner();
    return {held:!(LK in o),note:/Your changes to trip log are waiting for the owner's OK before they reach other computers/.test(txt),banner,
      eyalAlerts:mine.length,syraAlerts:box.filter(x=>x.user==='syra').length,names:!!mine[0]&&/Syra/.test(mine[0].title)&&/trip log/.test(mine[0].title),ownerNote,ownerBanner};}),
  expect:{held:true,note:true,banner:false,eyalAlerts:1,syraAlerts:0,names:true,ownerNote:false,ownerBanner:true} },

{ name:'🛡 (f) the trip journal is no longer held on every boot: 40 of 40 journal records re-stamped (at: now) by the watcher with the same days → 0 changed, uploads (v22.16 HELD 40 of 40); 25 of 40 days newer by their own updatedAt → uploads; 25 of 40 days OLDER than the cloud\'s (re-stamped at: now all the same) → HELD — the journal is not exempt, it is dated by its days',
  run:run(async()=>{await sleep(3000);reset();
    const rec=(i,at,day)=>({id:day.id,at:at,day:day});
    const J=(f)=>JSON.stringify(Array.from({length:40},(_,i)=>f(i)));
    const cloud=J(i=>rec(i,T0+i,i<25?check(i,T1):tday(i,T0)));
    const now=Date.now();
    const restamped=J(i=>rec(i,now,i<25?check(i,T1):tday(i,T0)));
    window.__hnxCloudRaw[JK]=cloud;
    const o1=window.__hnxPushGuard({[JK]:restamped});const s1=window.__hnxDsStats(cloud,restamped,JK,true)||{};const h1=!!HNXDS.held()[JK];reset();
    const cloud2=J(i=>rec(i,T0+i,tday(i,T0)));const newer=J(i=>rec(i,now,i<25?check(i,T1):tday(i,T0)));
    window.__hnxCloudRaw[JK]=cloud2;
    const o2=window.__hnxPushGuard({[JK]:newer});const h2=!!HNXDS.held()[JK];reset();
    const older=J(i=>rec(i,now,tday(i,T0)));
    window.__hnxCloudRaw[JK]=cloud;
    const o3=window.__hnxPushGuard({[JK]:older});const h3=!!HNXDS.held()[JK];reset();
    return {restampUp:JK in o1,restampHeld:h1,restampChanged:s1.changed,newerUp:JK in o2,newerHeld:h2,olderHeld:h3&&!(JK in o3)};}),
  expect:{restampUp:true,restampHeld:false,restampChanged:0,newerUp:true,newerHeld:false,olderHeld:true} },

{ name:'🛡 (g) only the trip stores are direction-aware: a STALE roster saved over the merged one through the real setItem stamp wrapper (110 of 110 departments reverted, each re-stamped now) is still HELD (110 changed, 0 forward); on the trip log an equal per-field stamp with another value (40 of 61 trucks) is an undated change, not a newer edit → HELD (0 forward)',
  run:run(async()=>{await sleep(3000);reset();
    const EK='hydroPro_employees';
    const emp=(dept,t)=>JSON.stringify(Array.from({length:110},(_,i)=>({id:'PGF'+(i+1),name:'EMP '+(i+1),status:'Active',dept:dept,dailyRate:600,updatedAt:t,_fts:{name:t,status:t,dept:t,dailyRate:t}})));
    const merged=emp('B',T1),stale=emp('A',T0);
    localStorage.setItem(EK,merged);localStorage.setItem(EK,stale); /* the stale in-memory roster saved over the merged copy */
    const raw=localStorage.getItem(EK),r0=JSON.parse(raw)[0]||{};
    window.__hnxCloudRaw[EK]=merged;
    const o1=window.__hnxPushGuard({[EK]:raw});const s1=window.__hnxDsStats(merged,raw,EK,true)||{};const h1=!!HNXDS.held()[EK];reset();
    const fl=(i,truck)=>Object.assign(tday(i,T0),{truck:truck,_fts:{truck:T0}});
    const c2=log(61,i=>fl(i,'NIF-6891')),l2=log(61,i=>fl(i,i<40?'ABC-1234':'NIF-6891'));
    window.__hnxCloudRaw[LK]=c2;
    const o2=window.__hnxPushGuard({[LK]:l2});const s2=window.__hnxDsStats(c2,l2,LK,true)||{};const h2=!!HNXDS.held()[LK];reset();
    return {restamped:(r0._fts||{}).dept>T1&&r0.dept==='A',empHeld:h1&&!(EK in o1),empChanged:s1.changed,empFwd:s1.fwd,tieHeld:h2&&!(LK in o2),tieChanged:s2.changed,tieFwd:s2.fwd};}),
  expect:{restamped:true,empHeld:true,empChanged:110,empFwd:0,tieHeld:true,tieChanged:40,tieFwd:0} },

{ name:'🛡 (h) a bulk RE-OPEN is never newer work: 61 approved trip days sent back to pending with fresh stamps (the v22.16 bridge storm) → HELD (61 changed, 0 forward); a v22.16 hold of it is weighed again at load, takes nothing in (this copy is newer) and STAYS held (0 released, re-weighed under rule 4 — v22.32 calls/issues, still 61 pending here)',
  run:run(async()=>{await sleep(3000);reset();
    const appr=(i,t)=>tday(i,t,{status:'approved',checkedBy:'Syra',checkedAt:t,approvedBy:'Jinky',approvedAt:t});
    const cloud=log(61,i=>appr(i,T0)),storm=log(61,i=>tday(i,T1));
    window.__hnxCloudRaw[LK]=cloud;
    const o=window.__hnxPushGuard({[LK]:storm});const st=window.__hnxDsStats(cloud,storm,LK,true)||{};const h1=!!HNXDS.held()[LK];
    reset();const h=HNXDS.held();h[LK]={at:Date.now()-3600e3,stats:{removed:0,changed:61,added:0,before:61,after:61},hash:fnv(storm),cloudHash:fnv(cloud),logged:1};
    localStorage.setItem(HK,JSON.stringify(h));localStorage.setItem(LK,storm);
    const n=HNXDS.releaseOld();const e2=HNXDS.held()[LK]||{};
    const here=JSON.parse(localStorage.getItem(LK)||'[]');
    reset();
    return {held:h1&&!(LK in o),changed:st.changed,fwd:st.fwd,released:n,stays:!!e2.at,rule:e2.rv,herePending:here.filter(d=>d.status==='pending').length};}),
  expect:{held:true,changed:61,fwd:0,released:0,stays:true,rule:4,herePending:61} },

{ name:'🛡 (i) Syra\'s OLD hold where the cloud moved on is released: her v22.16 hold (25 days checked at T1) while another computer rewrote the other 36 days in the cloud at T2 → the load-time sweep takes in the 36 newer days first, then 25 changed / 25 forward → 1 released, marked for upload; what goes up carries her 25 checks and the 36 T2 days (v22.18 part 2 before this fix: 0 released, 61 changed / 25 forward)',
  run:run(async()=>{await sleep(3000);reset();
    const T2=T1+3600e3;
    const cloud=log(61,i=>i<25?tday(i,T0):Object.assign(tday(i,T2),{truck:'NIF-7000'}));
    const syra=log(61,i=>i<25?Object.assign(check(i,T1),src(i,'s')):tday(i,T0));
    window.__hnxCloudRaw[LK]=cloud;localStorage.setItem(LK,syra);
    const h=HNXDS.held();h[LK]={at:Date.now()-6*3600e3,stats:{removed:0,changed:61,added:0,before:61,after:61},hash:fnv(syra),cloudHash:fnv(cloud),logged:1};
    localStorage.setItem(HK,JSON.stringify(h));
    const n=HNXDS.releaseOld();const heldAfter=!!HNXDS.held()[LK];
    const dirtyNow=()=>{try{return LK in (JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}')||{});}catch(e){return false;}};
    for(let i=0;i<25&&!dirtyNow();i++)await sleep(200);
    const out=window.__hnxPushGuard({[LK]:localStorage.getItem(LK)});const up=out[LK]?JSON.parse(out[LK]):[];
    reset();
    return {released:n,heldAfter,dirty:dirtyNow(),pushed:!!out[LK],upChecked:up.filter(d=>d.status==='checked'&&d.checkedBy==='Syra').length,upT2:up.filter(d=>d.updatedAt===T2&&d.truck==='NIF-7000').length,upDays:up.length};}),
  expect:{released:1,heldAfter:false,dirty:true,pushed:true,upChecked:25,upT2:36,upDays:61} },

{ name:'🛡 (j) Jinky\'s OLD hold of the v22.16 re-open storm is released the other way: her copy has 61 days re-opened (pending, T1) and the cloud has Syra\'s ✔ Check all of 61 (T2) → the sweep takes in the 61 newer checks → 1 released, Jinky has 61 checked by Syra (v22.18 part 2 before this fix: 0 released, never merged)',
  run:run(async()=>{await sleep(3000);reset();
    const T2=T1+3600e3;
    const cloud=log(61,i=>Object.assign(check(i,T2),src(i,'s')));
    const jinky=log(61,i=>Object.assign(tday(i,T1),src(i,'j')));
    window.__hnxCloudRaw[LK]=cloud;localStorage.setItem(LK,jinky);
    const h=HNXDS.held();h[LK]={at:Date.now()-6*3600e3,stats:{removed:0,changed:61,added:0,before:61,after:61},hash:fnv(jinky),cloudHash:fnv(cloud),logged:1};
    localStorage.setItem(HK,JSON.stringify(h));
    const n=HNXDS.releaseOld();const heldAfter=!!HNXDS.held()[LK];
    const here=JSON.parse(localStorage.getItem(LK)||'[]');
    reset();
    return {released:n,heldAfter,checked:here.filter(d=>d.status==='checked'&&d.checkedBy==='Syra').length,days:here.length};}),
  expect:{released:1,heldAfter:false,checked:61,days:61} },

{ name:'🛡 (k) a trip day\'s src (each computer\'s own bookkeeping) and key order are no change: the cloud has src A on 61 days, Syra has src B on all 61 with the keys of 36 days in another order and checks 25 → uploads, NOT held, 25 changed / 25 forward (v22.18 part 2 before this fix: HELD, 61 changed / 25 forward)',
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>Object.assign(tday(i,T0),src(i,'a')));
    const flip=o=>{const r={};Object.keys(o).reverse().forEach(k=>r[k]=o[k]);return r;};
    const syra=log(61,i=>i<25?Object.assign(check(i,T1),src(i,'b')):flip(Object.assign(tday(i,T0),src(i,'b'))));
    window.__hnxCloudRaw[LK]=cloud;
    const o=window.__hnxPushGuard({[LK]:syra});const st=window.__hnxDsStats(cloud,syra,LK,true)||{};const h1=!!HNXDS.held()[LK];
    reset();
    return {pushed:LK in o,held:h1,changed:st.changed,fwd:st.fwd};}),
  expect:{pushed:true,held:false,changed:25,fwd:25} },

{ name:'🛡 (l) the owner\'s ☁ Take the cloud copy on EVERY computer comes first: an old hold (6 h) and his decision (1 h ago) not yet applied here → the next push does not upload it and keeps its date, and the load-time sweep applies the decision BEFORE weighing → cloud copy taken, 0 released, decision marked applied (v22.18 part 2 before this fix: released and the discarded copy uploaded)',
  run:run(async()=>{await sleep(3000);reset();
    const cloud=log(61,i=>tday(i,T0)),syra=log(61,i=>i<25?Object.assign(check(i,T1),src(i)):tday(i,T0));
    window.__hnxCloudRaw[LK]=cloud;localStorage.setItem(LK,syra);
    const at0=Date.now()-6*3600e3,polAt=Date.now()-3600e3;
    const h=HNXDS.held();h[LK]={at:at0,stats:{removed:0,changed:61,added:0,before:61,after:61},hash:fnv(syra),cloudHash:fnv(cloud),logged:1};
    localStorage.setItem(HK,JSON.stringify(h));
    localStorage.setItem(PK,JSON.stringify({takeCloudAll:{at:polAt,by:'Owner'}}));localStorage.setItem(AK,'0');
    const o=window.__hnxPushGuard({[LK]:syra});const e1=HNXDS.held()[LK]||{};
    const n=HNXDS.releaseOld();
    const tookCloud=localStorage.getItem(LK)===cloud,heldAfter=!!HNXDS.held()[LK],applied=Number(localStorage.getItem(AK))>=polAt;
    reset();localStorage.removeItem(PK);localStorage.removeItem(AK);
    return {uploaded:LK in o,atKept:e1.at===at0,released:n,tookCloud,heldAfter,applied};}),
  expect:{uploaded:false,atKept:true,released:0,tookCloud:true,heldAfter:false,applied:true} },

{ name:'🛡 (m) a hold that goes on keeps its first date: a bulk re-open HELD at A, the owner presses ☁ Take the cloud copy on EVERY computer after A, the cloud copy changes and a push cycle runs here BEFORE the decision arrives → the hold still dates from A, so the decision applies: 1 applied, the hold is cleared and this computer has the cloud copy (v22.18 part 2 before this fix: re-dated, 0 applied, the hold stays)',
  run:run(async()=>{await sleep(3000);reset();
    const appr=(i,t)=>tday(i,t,{status:'approved',checkedBy:'Syra',checkedAt:t,approvedBy:'Jinky',approvedAt:t});
    const cloud1=log(61,i=>appr(i,T0)),storm=log(61,i=>i<40?tday(i,T1):appr(i,T0));
    window.__hnxCloudRaw[LK]=cloud1;localStorage.setItem(LK,storm);
    const o1=window.__hnxPushGuard({[LK]:storm});const A=(HNXDS.held()[LK]||{}).at;
    const polAt=(A||Date.now())+5;
    const T2=T1+3600e3,cloud2=log(61,i=>i===60?Object.assign(appr(i,T2),{truck:'NIF-7000'}):appr(i,T0));
    window.__hnxCloudRaw[LK]=cloud2;
    const o2=window.__hnxPushGuard({[LK]:storm});const e2=HNXDS.held()[LK]||{};
    localStorage.setItem(PK,JSON.stringify({takeCloudAll:{at:polAt,by:'Owner'}}));localStorage.setItem(AK,'0');
    const r=HNXDS.applyPolicy()||{};
    const tookCloud=localStorage.getItem(LK)===cloud2,heldAfter=!!HNXDS.held()[LK];
    reset();localStorage.removeItem(PK);localStorage.removeItem(AK);
    return {held1:!!A&&!(LK in o1),held2:!(LK in o2)&&!!e2.at,atKept:e2.at===A,applied:r.applied,heldAfter,tookCloud};}),
  expect:{held1:true,held2:true,atKept:true,applied:1,heldAfter:false,tookCloud:true} },
];
