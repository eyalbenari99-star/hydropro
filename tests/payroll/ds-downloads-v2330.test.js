/* v23.32 = the port onto v23.22 of the 11 Oct fix (built then as "v22.52", never shipped).
   v23.32 (Eyal, 11 Oct 2026, screenshot "🛡 Data Safety: 3 big downloads can be undone — click to review": "again why again I need to
   do it from cloud for all computers and not auto?") — a DOWNLOAD was counted as raw JSON text on each computer, so other people's
   normal work (Syra's trip checks, Nexi's alarm clean-up, a computer catching up after being off, the trip journal re-stamping its own
   `at`) raised "big download" notices, kept per computer and cleared per computer. Now a download is sorted record by record:
   · EXPECTED (quiet: undo copy 7 days, no banner, no inbox alert): every changed record arrives NEWER (its stamp or every differing
     field's stamp strictly later, at most 10 min in the future, status not moved back) and every removed record has a delete mark;
     key order, the trip `src`, the journal's `at` are no change;
   · SUSPICIOUS (still applied — never blocked; banner + ONE inbox alert per store per day to the primary admin; undo copy 14 days):
     removed with no delete mark / older, undated or re-opened copies pass the old thresholds (removed >= max(4, 30%) or
     removed + changed >= max(8, 50%)), or employees / payroll runs / trip log lose >= max(10, 50%) even with delete marks;
   · reviewed ONCE for all computers (synced hydroPro_ds_review_v1); ☁ Take the cloud copy on EVERY computer also clears download
     notices where no hold was released; a notice closes by itself when the removed records come back. */
/* v23.32 review 2 (cases 24-31): stamps written with the monotonic clock (employees, asset audit, _lww tables) are "from the future" only
   10 min past this computer's own mark; the boot download uses the clock offset the guard measured last time (hnxlocal_clock_skew_v1);
   ↩ Undo restamps by each store's own merge (asset audit per entry + delete marks, none for the cold-room days, checklist cold rows left);
   employees / payroll runs / trip log ask at max(4, 30%) removed even with delete marks; a different download after the owner's review
   alerts again (id per download signature); the memo-chain and cold-room inbox writers and the storage rescue keep 800 like the rest. */
const H=`
  const BK='hnx_bigmerge_v1',RV='hydroPro_ds_review_v1',IK='hydroPro_pa_inbox_v1',TB='hydroPro_optomb',HK='hnxlocal_push_held_v1';
  const LK='hydroPro_trip_log_v1',JK='hydroPro_trip_journal_v1',TL='hydroPro_test_list_v1',TL2='hydroPro_test_list2_v1',EK='hydroPro_employees';
  const PK='hydroPro_ds_owner_policy_v1',AK='hnxlocal_ds_policy_applied_v1';
  const T0=1790000000000,T1=T0+3600e3;
  const dt=i=>new Date(Date.UTC(2026,7,1+i,12)).toISOString().slice(0,10);
  /* source 'manual' keeps the Deliveries→Trips bridge away from these fixture days */
  const tday=(i,t,x)=>Object.assign({id:'dlvday_'+dt(i)+'_e1',date:dt(i),driverId:'E1',driverName:'OLAZO, ARCADIO JR',helperId:'E2',truck:'NIF-6891',trips:['manila','manila'],status:'pending',source:'manual',createdAt:T0,updatedAt:t},x||{});
  const check=(i,t)=>tday(i,t,{status:'checked',checkedBy:'Syra',checkedAt:t});
  const appr=(i,t)=>tday(i,t,{status:'approved',checkedBy:'Syra',checkedAt:t,approvedBy:'Jinky',approvedAt:t});
  const arr=(n,f,from)=>JSON.stringify(Array.from({length:n},(_,i)=>f(i+(from||0))));
  const item=i=>({id:'TL'+i,name:'Item '+i,qty:i,updatedAt:T0});
  const emp=i=>({id:'DSE'+i,name:'EMP '+i,status:'Active',dept:'APTI_ACCOUNTING',dailyRate:600,updatedAt:T0,_fts:{name:T0,dept:T0,dailyRate:T0}});
  const ids=(p,a,b)=>Array.from({length:b-a},(_,i)=>p+(a+i));
  const ents=k=>(JSON.parse(localStorage.getItem(BK)||'[]')||[]).filter(e=>e&&(!k||e.key===k));
  const tomb=(k,list,t)=>{const o=JSON.parse(localStorage.getItem(TB)||'{}')||{};o[k]=o[k]||{};list.forEach(id=>o[k][id]=t);localStorage.setItem(TB,JSON.stringify(o));};
  const untomb=()=>{try{const o=JSON.parse(localStorage.getItem(TB)||'{}')||{};[TL,TL2,EK,'hydroPro_maint_tasks','hydroPro_esc_actions_v1'].forEach(k=>delete o[k]);localStorage.setItem(TB,JSON.stringify(o));}catch(e){}};
  const reset=()=>{const h=HNXDS.held();Object.keys(h).forEach(k=>delete h[k]);localStorage.setItem(HK,'{}');localStorage.setItem(BK,'[]');localStorage.removeItem(RV);
    localStorage.setItem(IK,'[]');localStorage.removeItem('hnxlocal_ds_held_alerted_v1');untomb();const b=document.getElementById('hnxDsBanner');if(b)b.remove();};
  const bannerTxt=()=>{HNXDS.banner();const b=document.getElementById('hnxDsBanner');return b?b.textContent:'';};
  const alerts=u=>(JSON.parse(localStorage.getItem(IK)||'[]')||[]).filter(x=>x&&/^DSD_/.test(String(x.id))&&(!u||x.user===u));
  const kept=async e=>{try{if(e&&e.inIdb&&window.HNXIDB&&HNXIDB.available){const p=await HNXIDB.get(e.id);return p&&p.raw;}}catch(x){}return e?localStorage.getItem(e.id):null;};
  /* v23.32: the asset audit's own value hash and stamp ("<ms>:<hash>"), as the Assets module and the sync merge write them */
  const arH=v=>{let s;try{s=JSON.stringify(v);}catch(e){s=String(v);}s=String(s==null?'':s);let h=2166136261|0;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619);}return (h>>>0).toString(36);};
  const arSt=(t,v)=>t+':'+arH(v);
  const unseen=list=>JSON.stringify(list.map(e=>{const c=Object.assign({},e);delete c.seen;return c;}));
`;
/* v23.32 review 2: every write of the shared inbox (hydroPro_pa_inbox_v1, or a variable holding that key) and the size it keeps —
   `<setter>(KEY, JSON.stringify(x.slice(0,N)))`, `<setter>(KEY, x.slice(0,N))`, or `<setter>(KEY, x)` after `x = x.slice(0,N)`; plus the
   storage rescue's TRIM size. A write with no cut keeps everything (n = null). */
function inboxScan(src){
  const al=new Set();let m;const re1=/\b([A-Za-z_$][\w$]*)\s*[:=]\s*['"]hydroPro_pa_inbox_v1['"]/g;while((m=re1.exec(src)))al.add(m[1]);
  const names=["'hydroPro_pa_inbox_v1'",'"hydroPro_pa_inbox_v1"'].concat([...al]).map(x=>x.replace(/[$'"]/g,c=>'\\'+c));
  const re2=new RegExp('\\b(?!J\\(|getItem|removeItem|load)[\\w$]+\\(\\s*('+names.join('|')+')\\s*,\\s*','g'),writes=[];
  while((m=re2.exec(src))){const at=m.index,rest=src.slice(re2.lastIndex,re2.lastIndex+220);let n=null,v=null,mm;
    if((mm=/^JSON\.stringify\(\s*\(?\s*([\w$.]+?)\s*(?:\.slice\(\s*0\s*,\s*(\d+)\s*\))?\s*\)?\s*\)/.exec(rest))){v=mm[1];n=mm[2]?+mm[2]:null;}
    else if((mm=/^([\w$]+)\s*(?:\.slice\(\s*0\s*,\s*(\d+)\s*\))?\s*\)/.exec(rest))){v=mm[1];n=mm[2]?+mm[2]:null;}
    if(n==null&&v){const q=v.replace(/[$.]/g,'\\$&'),r3=new RegExp('\\b'+q+'\\s*=\\s*'+q+'\\.slice\\(\\s*0\\s*,\\s*(\\d+)\\s*\\)','g'),back=src.slice(Math.max(0,at-500),at);let k;while((k=r3.exec(back)))n=+k[1];}
    writes.push({line:src.slice(0,at).split('\n').length,n,txt:src.slice(at,at+70).replace(/\s+/g,' ')});}
  const tm=/'hydroPro_pa_inbox_v1'\s*:\s*(\d+)/.exec(src);
  return {writes,trim:tm?+tm[1]:null};}
const run=fn=>new Function('return (async()=>{'+H+' return await ('+fn.toString()+')(); })();');
const REQ="!!window.HNXDS&&typeof window.HNXDS.isSuspect==='function'";
module.exports=[
{ name:'🛡 v23.32 (1) the trip journal re-stamped by its own watcher (at: now) on 40 of 40 days arriving from the cloud → 0 changed, 0 download entries, no banner (v23.22 counted 40 changed of 40 → "1 big download can be undone")',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const rec=(i,at,day)=>({id:day.id,at:at,day:day});
    const J=f=>JSON.stringify(Array.from({length:40},(_,i)=>f(i)));
    const before=J(i=>rec(i,T0+i,i<25?check(i,T1):tday(i,T0))),after=J(i=>rec(i,Date.now(),i<25?check(i,T1):tday(i,T0)));
    const st=window.__hnxDsStats(before,after,JK,'down')||{},old=window.__hnxDsStats(before,after)||{};
    window.__hnxMergeWatch(JK,before,after,'pull');await sleep(200);
    const out={changed:st.changed,oldCount:old.changed,entries:ents(JK).length,banner:!!bannerTxt()};reset();return out;}),
  expect:{changed:0,oldCount:40,entries:0,banner:false} },

{ name:'🛡 v23.32 (2) Syra\'s ✔ Check all arriving: a 61-day trip log where 40 days were checked on another computer 1 h newer → 40 changed, 40 newer from other computers, 1 QUIET entry (seen), no banner, 0 inbox alerts, and the previous copy is still kept for ↩ Undo',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const before=arr(61,i=>tday(i,T0)),after=arr(61,i=>i<40?check(i,T1):tday(i,T0));
    window.__hnxMergeWatch(LK,before,after,'pull');await sleep(600);
    const e=ents(LK)[0]||{},st=e.stats||{};const copy=await kept(e);
    const out={entries:ents(LK).length,changed:st.changed,fwd:st.fwd,cls:e.cls,seen:e.seen,banner:!!bannerTxt(),inbox:alerts().length,copyKept:copy===before};reset();return out;}),
  expect:{entries:1,changed:40,fwd:40,cls:'quiet',seen:1,banner:false,inbox:0,copyKept:true} },

{ name:'🛡 v23.32 (3) a computer that was off catches up on its FIRST PULL: maint tasks, 180 of 300 closed by Nexi\'s alarm clean-up on other computers with newer stamps → 180 changed, 180 newer, quiet, no banner, 0 inbox alerts',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const MK='hydroPro_maint_tasks';
    const task=(i,x)=>Object.assign({id:'MT-DS'+i,title:'Pool alarm '+i,status:'open',priority:'high',createdAt:T0,updatedAt:T0},x||{});
    const before=arr(300,i=>task(i)),after=arr(300,i=>i<180?task(i,{status:'closed',closedAt:T1,closedBy:'Nexi',updatedAt:T1}):task(i));
    window.__hnxMergeWatch(MK,before,after,'first pull');await sleep(300);
    const e=ents(MK)[0]||{},st=e.stats||{};
    const out={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};reset();return out;}),
  expect:{changed:180,fwd:180,cls:'quiet',banner:false,inbox:0} },

{ name:'🛡 v23.32 (4) records deleted on purpose: a 20-record store loses 8 that all carry a delete mark (tombstone at or after their stamp) → 8 removed, 8 deleted on purpose, quiet, no banner, 0 inbox alerts',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    tomb(TL,ids('TL',0,8),T1);
    const before=arr(20,item),after=arr(12,item,8);
    window.__hnxMergeWatch(TL,before,after,'pull');await sleep(300);
    const e=ents(TL)[0]||{},st=e.stats||{};
    const out={removed:st.removed,tomb:st.tomb,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};reset();return out;}),
  expect:{removed:8,tomb:8,cls:'quiet',banner:false,inbox:0} },

{ name:'🛡 v23.32 (5) records removed with NO delete behind them: the same 8 of 20 without delete marks → needs a look, 8 ids kept for the self-close; banner "🛡 Data Safety: 1 download needs a look — test list: 8 records removed with no delete behind them — click to review (once for all computers)"; 1 inbox alert to the primary admin, still 1 after a second such download the same day',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const before=arr(20,item),after=arr(12,item,8);
    window.__hnxMergeWatch(TL,before,after,'pull');await sleep(300);
    const e=ents(TL)[0]||{},st=e.stats||{};const t1=bannerTxt();const a1=alerts('tester').length;
    window.__hnxMergeWatch(TL,before,after,'pull');await sleep(300);const a2=alerts('tester').length;
    const al=alerts('tester')[0]||{};
    const out={cls:e.cls,removed:st.removed,tomb:st.tomb,ids:(e.ids||[]).length,banner:t1,alerts:[a1,a2],named:/test list/.test(al.title||'')&&/nothing was blocked/.test(al.body||'')};reset();return out;}),
  expect:{cls:'suspect',removed:8,tomb:0,ids:8,banner:'🛡 Data Safety: 1 download needs a look — test list: 8 records removed with no delete behind them — click to review (once for all computers)',alerts:[1,1],named:true} },

{ name:'🛡 v23.32 (6) the v21.28 Undo case: an object store whose 10 of 10 records change with the SAME stamp (an undated change) → 10 changed, 0 newer, needs a look; ↩ Undo still puts the old copy back stamped newer than the cloud copy',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const K='hydroPro_test_store_v1';
    const mk=(n,v)=>{const o={};for(let i=0;i<n;i++)o['r'+i]={val:v,updatedAt:1700000000000};return JSON.stringify(o);};
    const before=mk(10,'good'),after=mk(10,'bad');
    localStorage.setItem(K,after);
    window.__hnxMergeWatch(K,before,after,'pull');await sleep(400);
    const e=ents(K)[0]||{},st=e.stats||{};
    window.confirm=()=>true;HNXDS.undo(e.id);await sleep(800);
    const now=JSON.parse(localStorage.getItem(K)||'{}');
    const out={changed:st.changed,fwd:st.fwd,cls:e.cls,restored:!!now.r0&&now.r0.val==='good',newer:!!now.r0&&now.r0.updatedAt>1700000000000};reset();return out;}),
  expect:{changed:10,fwd:0,cls:'suspect',restored:true,newer:true} },

{ name:'🛡 v23.32 (7) a bulk RE-OPEN arriving: 12 of 20 approved trip days come back as pending with NEWER stamps → 12 changed, 0 newer (a re-open is never ordinary work), needs a look: "trip log: 12 records replaced by an older, undated or re-opened copy"',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const before=arr(20,i=>appr(i,T0)),after=arr(20,i=>i<12?tday(i,T1):appr(i,T0));
    window.__hnxMergeWatch(LK,before,after,'pull');await sleep(300);
    const e=ents(LK)[0]||{},st=e.stats||{};
    const out={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:/1 download needs a look — trip log: 12 records replaced by an older, undated or re-opened copy/.test(bannerTxt())};reset();return out;}),
  expect:{changed:12,fwd:0,cls:'suspect',banner:true} },

{ name:'🛡 v23.32 (8) key order alone is no change on a download: employees, 30 records arriving with the same values in another field order → 0 changed, 0 entries (v23.22 counted 30 of 30 changed)',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const flip=o=>{const r={};Object.keys(o).reverse().forEach(k=>r[k]=o[k]);return r;};
    const L=Array.from({length:30},(_,i)=>emp(i)),before=JSON.stringify(L),after=JSON.stringify(L.map(flip));
    const st=window.__hnxDsStats(before,after,EK,'down')||{},old=window.__hnxDsStats(before,after)||{};
    window.__hnxMergeWatch(EK,before,after,'pull');await sleep(300);
    const out={changed:st.changed,oldCount:old.changed,entries:ents(EK).length,banner:!!bannerTxt()};reset();return out;}),
  expect:{changed:0,oldCount:30,entries:0,banner:false} },

{ name:'🛡 v23.32 (9) a sensitive store: employees, 40 records — 25 removed WITH delete marks → needs a look (≥ max(10, 50%) = 20 of employees, "employees: 25 of 40 records deleted at once"); 6 removed with delete marks → not big, 0 entries, no banner',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    tomb(EK,ids('DSE',0,25),T1);
    const before=arr(40,emp);
    window.__hnxMergeWatch(EK,before,arr(15,emp,25),'pull');await sleep(300);
    const e=ents(EK)[0]||{},st=e.stats||{};const t1=bannerTxt();
    localStorage.setItem(BK,'[]');
    window.__hnxMergeWatch(EK,before,arr(34,emp,6),'pull');await sleep(300);
    const out={removed:st.removed,tomb:st.tomb,cls:e.cls,why:/employees: 25 of 40 records deleted at once/.test(t1),entries6:ents(EK).length,banner6:!!bannerTxt()};reset();return out;}),
  expect:{removed:25,tomb:25,cls:'suspect',why:true,entries6:0,banner6:false} },

{ name:'🛡 v23.32 (10) a clock running ahead: 10 of 10 records arriving stamped now + 1 h → 0 newer, needs a look; the same 10 stamped now → 10 newer, quiet',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const r=(i,t,v)=>({id:'TL'+i,val:v,updatedAt:t});const before=arr(10,i=>r(i,T0,'a'));
    window.__hnxMergeWatch(TL,before,arr(10,i=>r(i,Date.now()+3600e3,'b')),'pull');
    window.__hnxMergeWatch(TL,before,arr(10,i=>r(i,Date.now(),'b')),'pull');await sleep(300);
    const out={checks:ents(TL).map(e=>[e.cls,e.stats.changed,e.stats.fwd])};reset();return out;}),
  expect:{checks:[['suspect',10,0],['quiet',10,10]]} },

{ name:'🛡 v23.32 (11) reviewed ONCE for all computers: 2 downloads need a look → the owner opens Data Safety → hydroPro_ds_review_v1 reviewedAt ≥ both, by Tester, banner gone; a second computer with the same 2 notices unseen and that synced key → no banner, also for the same downloads recorded there AFTER the review (same signature); a NEW download that needs a look → the banner is back with 1',
  requires:REQ,
  run:run(async()=>{await sleep(4000);reset();
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');
    const r=(i,v)=>({id:'SO'+i,val:v,updatedAt:T0});window.__hnxMergeWatch(TL2,arr(10,i=>r(i,'a')),arr(10,i=>r(i,'b')),'pull');
    await sleep(300);const two=bannerTxt();
    switchView('admin_datasafety');await sleep(900);
    const rv=JSON.parse(localStorage.getItem(RV)||'{}'),es=ents();
    const covers=es.length===2&&es.every(e=>+rv.reviewedAt>=e.at),gone=!document.getElementById('hnxDsBanner');
    const screen=((document.getElementById('view-admin_datasafety')||{}).innerText||'');
    localStorage.setItem(BK,unseen(es));const second=bannerTxt();
    localStorage.setItem(BK,unseen(es.map((e,i)=>Object.assign({},e,{at:Date.now()+1000+i,id:e.id+'.late'}))));const late=bannerTxt();
    window.__hnxMergeWatch(TL,arr(20,item),arr(10,item,10),'pull');await sleep(200);const fresh=bannerTxt();
    const out={two:/^🛡 Data Safety: 2 downloads need a look — /.test(two),covers,by:rv.by,gone,check:/⚠ needs a look/.test(screen),second,late,fresh:/^🛡 Data Safety: 1 download needs a look — test list: 10 records removed with no delete behind them/.test(fresh)};reset();return out;}),
  expect:{two:true,covers:true,by:'Tester',gone:true,check:true,second:'',late:'',fresh:true} },

{ name:'🛡 v23.32 (12) the owner\'s ☁ Take the cloud copy on EVERY computer with 0 holds and 1 download that needs a look → the banner goes and the review is written (v23.22 cleared download notices only where a hold was released); another computer with no hold gets the decision → applied 0, its unseen notice is marked seen, no banner',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');await sleep(200);
    const b1=!!bannerTxt();
    window.confirm=()=>true;HNXDS.ownerTakeAll();await sleep(300);
    const b2=!!bannerTxt(),rv=JSON.parse(localStorage.getItem(RV)||'{}'),pol=HNXDS.policy().takeCloudAll||{};
    /* the other computer: the decision has synced in but is not applied there yet, no review key, its own notice unseen */
    localStorage.removeItem(RV);localStorage.setItem(AK,'0');localStorage.setItem(BK,unseen(ents()));
    const b3=!!bannerTxt();
    const r=HNXDS.applyPolicy()||{};
    const out={before:b1,after:b2,reviewed:+rv.reviewedAt>=+pol.at,otherBefore:b3,applied:r.applied,seen:ents().every(e=>e.seen===1),otherAfter:!!bannerTxt()};
    localStorage.removeItem(PK);localStorage.removeItem(AK);reset();return out;}),
  expect:{before:true,after:false,reviewed:true,otherBefore:true,applied:0,seen:true,otherAfter:false} },

{ name:'🛡 v23.32 (13) a notice closes by itself when the records come back: 8 of 20 removed with no delete (needs a look, banner) → the next download brings the 8 back → healed, banner gone, still 1 entry; the same through the 60-second check (records back here without a download) → healed, no banner',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const full=arr(20,item),part=arr(12,item,8);
    window.__hnxMergeWatch(TL,full,part,'pull');await sleep(200);const b1=!!bannerTxt();
    window.__hnxMergeWatch(TL,part,full,'pull');await sleep(200);
    const e=ents(TL)[0]||{};const b2=!!bannerTxt(),n=ents(TL).length;
    reset();
    window.__hnxMergeWatch(TL,full,part,'pull');await sleep(200);const b3=!!bannerTxt();
    localStorage.setItem(TL,full);HNXDS.releaseOld();await sleep(200);
    const e2=ents(TL)[0]||{};const b4=!!bannerTxt();
    localStorage.removeItem(TL);
    const out={bannerBefore:b1,healed:!!e.healed,bannerAfter:b2,entries:n,loopBefore:b3,loopHealed:!!e2.healed,loopBanner:b4};reset();return out;}),
  expect:{bannerBefore:true,healed:true,bannerAfter:false,entries:1,loopBefore:true,loopHealed:true,loopBanner:false} },

{ name:'🛡 v23.32 (14) still the owner\'s only: with 1 download that needs a look, Admin-2 (Dr Amy) sees NO banner and the primary admin does (v21.49 rule unchanged)',
  requires:REQ,
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'amy',fullname:'Dr Amy',passwordHash:'x',role:'admin_secondary',active:true}]));},
  run:run(async()=>{await sleep(3000);reset();
    const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');await sleep(200);
    const el=()=>document.getElementById('hnxDsBanner');if(el())el().remove();
    as('amy');HNXDS.banner();await sleep(100);const amy=!!el();if(el())el().remove();
    as('tester');HNXDS.banner();await sleep(100);const owner=!!el();
    const out={amy,owner,amyAlerts:alerts('amy').length};reset();return out;}),
  expect:{amy:false,owner:true,amyAlerts:0} },

/* ---- v23.32 review fixes ---- */
{ name:'🛡 v23.32 review (15) the same value written again on another computer: employees, 40 records, 30 arriving with the SAME photo value and only a newer per-field stamp (the 201-file photo backfill) → 30 changed, 30 newer, quiet, no banner, 0 inbox alerts (before the fix: 30 "replaced by an older, undated or re-opened copy", needs a look + inbox alert)',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    const ph=(i,t)=>Object.assign(emp(i),{photo:'r2img:p'+i,_fts:{name:T0,dept:T0,dailyRate:T0,photo:t}});
    const before=arr(40,i=>i<30?ph(i,T0):emp(i)),after=arr(40,i=>i<30?ph(i,T1):emp(i));
    window.__hnxMergeWatch(EK,before,after,'pull');await sleep(300);
    const e=ents(EK)[0]||{},st=e.stats||{};
    const out={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};reset();return out;}),
  expect:{changed:30,fwd:30,cls:'quiet',banner:false,inbox:0} },

{ name:'🛡 v23.32 review (16) one review does not cover the NEXT mass deletion: employees 25 of 40 deleted with delete marks → needs a look → the owner reviews → a different deletion, 30 of 60 with delete marks → another signature, 1 open, banner "employees: 30 of 60 records deleted at once"; the first download recorded on a computer that was off → covered by its signature reviewed 1 day ago, NOT by one reviewed 15 days ago (before the fix both deletions had the signature of "no ids" and the second stayed hidden)',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    tomb(EK,ids('DSE',0,25),T1);
    window.__hnxMergeWatch(EK,arr(40,emp),arr(15,emp,25),'pull');await sleep(200);
    const e1=ents(EK)[0]||{};HNXDS.markReviewed();const open0=HNXDS.openSus().length;
    tomb(EK,ids('DSE',100,130),T1);
    window.__hnxMergeWatch(EK,arr(60,emp,100),arr(30,emp,130),'pull');await sleep(200);
    const e2=ents(EK)[1]||{};const open1=HNXDS.openSus().length,b=bannerTxt();
    const off=(t)=>{localStorage.setItem(BK,JSON.stringify([Object.assign({},e1,{seen:undefined,at:Date.now(),id:e1.id+'.off'})]));
      localStorage.setItem(RV,JSON.stringify({reviewedAt:Date.now()-20*864e5,by:'Tester',sigs:{[e1.sig]:t}}));return HNXDS.openSus().length;};
    const day1=off(Date.now()-864e5),day15=off(Date.now()-15*864e5);
    const out={first:e1.cls,afterReview:open0,second:e2.cls,otherSig:!!e1.sig&&!!e2.sig&&e1.sig!==e2.sig,open:open1,banner:/1 download needs a look — employees: 30 of 60 records deleted at once/.test(b),day1,day15};reset();return out;}),
  expect:{first:'suspect',afterReview:0,second:'suspect',otherSig:true,open:1,banner:true,day1:0,day15:1} },

{ name:'🛡 v23.32 review (17) clocks are compared on the clock-guard-corrected time: this computer 15 min SLOW, 10 of 10 records arriving stamped real time (= its now + 15 min) → 10 newer, quiet (before the fix: needs a look); a review stamped 30 min ahead (a reviewer\'s fast clock) hides no new notice → banner; a reviewer 30 min fast whose clock the guard measured writes the real time (within 5 s)',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const sk=window.__hnxClockSkewMs;
    const r=(i,t,v)=>({id:'TL'+i,val:v,updatedAt:t});
    window.__hnxClockSkewMs=-15*60e3;window.__hnxMergeWatch(TL,arr(10,i=>r(i,T0,'a')),arr(10,i=>r(i,Date.now()+15*60e3,'b')),'pull');window.__hnxClockSkewMs=sk;
    const e=ents(TL)[0]||{},st=e.stats||{};const slow=[e.cls,st.changed,st.fwd];
    localStorage.setItem(BK,'[]');localStorage.setItem(RV,JSON.stringify({reviewedAt:Date.now()+30*60e3,by:'Tester',sigs:{}}));
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');await sleep(200);const fast=bannerTxt();
    localStorage.removeItem(RV);const RD=Date.now;Date.now=()=>RD()+30*60e3;window.__hnxClockSkewMs=30*60e3;
    try{HNXDS.markReviewed();}finally{Date.now=RD;window.__hnxClockSkewMs=sk;}
    const rv=JSON.parse(localStorage.getItem(RV)||'{}');
    const out={slow,fastReviewHides:!/1 download needs a look — test list/.test(fast),measured:Math.abs((+rv.reviewedAt||0)-Date.now())<5000};reset();return out;}),
  expect:{slow:['quiet',10,10],fastReviewHides:false,measured:true} },

{ name:'🛡 v23.32 review (18) no inbox alert for a download the owner already reviewed: 8 of 20 removed with no delete → needs a look, 1 alert → reviewed → a computer that was off records the SAME download later (own list, inbox and alert memory empty) → 0 alerts, no banner; a DIFFERENT download there → 1 alert, banner',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');await sleep(200);const a1=alerts('tester').length;
    HNXDS.markReviewed();
    localStorage.setItem(BK,'[]');localStorage.setItem(IK,'[]');localStorage.removeItem('hnxlocal_ds_held_alerted_v1');await sleep(20);
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');await sleep(200);const a2=alerts('tester').length,b2=!!bannerTxt();
    window.__hnxMergeWatch(TL,arr(20,item),arr(10,item,10),'pull');await sleep(200);const a3=alerts('tester').length,b3=!!bannerTxt();
    const out={first:a1,sameLater:a2,bannerSame:b2,different:a3,bannerDifferent:b3};reset();return out;}),
  expect:{first:1,sameLater:0,bannerSame:false,different:1,bannerDifferent:true} },

/* ---- v23.32: the port onto v23.22 — stores main merges with its own rules since v22.60–v23.22 ---- */
{ name:'🛡 v23.32 (19) the asset audit (v22.62 entry-by-entry merge) is weighed per ENTRY by its own stamps: 70 entries (40 answers, 10 eba, 10 move fields, 10 lockNos), a catch-up bringing 40 newer marks from another computer and 5 removals with the audit\'s own delete marks → 40 changed, 40 newer, 5 removed, 5 deleted on purpose, QUIET, no banner, 0 inbox alerts; all 40 answers arriving with stamps 1 h OLDER than here → 40 changed, 0 newer, needs a look',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const K='hydroPro_asset_recon_v1';
    const mk=(o)=>{const s={answers:{},eba:{},moves:{},lockNos:{},_ts:{},_tomb:{}};
      for(let i=0;i<40;i++){const v=(o.ans&&i<o.ans.n)?o.ans.v:'ok',t=(o.ans&&i<o.ans.n)?o.ans.t:o.t0;s.answers['A'+i]=v;s._ts['answers.A'+i]=arSt(t,v);}
      for(let i=0;i<10;i++){const c=o.eba&&i<o.eba,v={status:c?'untagged':'tagged'};s.eba['E'+i]=v;s._ts['eba.E'+i]=arSt(c?T1:o.t0,v);}
      for(let i=0;i<5;i++){const c=o.mv,to=c?'GH2':'GH1';s.moves['R'+i]={to:to,by:'jinky'};s._ts['moves.R'+i+'.to']=arSt(c?T1:o.t0,to);s._ts['moves.R'+i+'.by']=arSt(o.t0,'jinky');}
      for(let i=0;i<10;i++){if(o.lock&&i<o.lock){s._tomb['lockNos.L'+i]=T1;continue;}s.lockNos['L'+i]=true;s._ts['lockNos.L'+i]=arSt(o.t0,true);}
      return JSON.stringify(s);};
    const before=mk({t0:T0}),after=mk({t0:T0,ans:{n:30,v:'missing',t:T1},eba:5,mv:true,lock:5});
    window.__hnxMergeWatch(K,before,after,'first pull');await sleep(300);
    const e=ents(K)[0]||{},st=e.stats||{};const q={before:st.before,changed:st.changed,fwd:st.fwd,removed:st.removed,tomb:st.tomb,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};
    reset();
    const b2=mk({t0:T0,ans:{n:40,v:'ok',t:T1}}),a2=mk({t0:T0,ans:{n:40,v:'stale',t:T0-3600e3}});
    window.__hnxMergeWatch(K,b2,a2,'pull');await sleep(300);
    const e2=ents(K)[0]||{},s2=e2.stats||{};
    const out={quiet:q,older:[s2.changed,s2.fwd,e2.cls]};reset();return out;}),
  expect:{quiet:{before:70,changed:40,fwd:40,removed:5,tomb:5,cls:'quiet',banner:false,inbox:0},older:[40,0,'suspect']} },

{ name:'🛡 v23.32 (20) the cold-room days (v23.22 merge: a later check wins, hand readings united by id): 12 days, 10 arriving with a LATER check and one more hand reading → 10 changed, 10 newer, QUIET, no banner (the record-level rule saw 0 newer and asked); 10 days whose check arrives 1 h OLDER → 0 newer, needs a look',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const K='hydroPro_cold_daily_v1';
    const day=(i,o)=>({CR1:{check:{v:o.v||5.1,at:o.at||(T0+i),by:'tech',src:'typed'},hand:[{id:'h'+i+'a',v:5,at:T0,ts:T0}].concat(o.add?[{id:'h'+i+'b',v:5.4,at:T1,ts:T1}]:[])}});
    const store=f=>{const o={};for(let i=0;i<12;i++)o[dt(i)]=f(i);return JSON.stringify(o);};
    const before=store(i=>day(i,{})),after=store(i=>i<10?day(i,{v:5.4,at:T1+i,add:true}):day(i,{}));
    const gen=window.__hnxDsStats(before,after,'hydroPro_test_cold_v1','down')||{};
    window.__hnxMergeWatch(K,before,after,'pull');await sleep(300);
    const e=ents(K)[0]||{},st=e.stats||{};const q={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length,recordRule:[gen.fwd,window.__hnxDsIsSuspect(gen,'hydroPro_test_cold_v1')]};
    reset();
    window.__hnxMergeWatch(K,before,store(i=>i<10?day(i,{v:5.4,at:T0-3600e3}):day(i,{})),'pull');await sleep(300);
    const e2=ents(K)[0]||{},s2=e2.stats||{};
    const out={quiet:q,older:[s2.changed,s2.fwd,e2.cls]};reset();return out;}),
  expect:{quiet:{changed:10,fwd:10,cls:'quiet',banner:false,inbox:0,recordRule:[0,true]},older:[10,0,'suspect']} },

{ name:'🛡 v23.32 (21) the Maintenance checklist (v23.22 merge: ❄ cold rows by [Manila day, rank, stamp]): 20 rows, 12 cold rows arriving as a technician\'s ✕ critical check (rank 2) over the system\'s pending row (rank 0) with an EARLIER stamp + 2 ordinary rows newer → 14 changed, 14 newer, QUIET (by stamps alone: 2 newer, needs a look)',
  requires:REQ+"&&typeof window.__hnxColdRowOrder==='function'",
  run:run(async()=>{await sleep(3000);reset();const K='hydroPro_maintenance_checklist';
    const D='2026-10-13',pend={status:'pending',lastChecked:'',checkedBy:'',notes:'due by 09:00',updatedAt:T0+10*3600e3,updatedBy:'system',coldDay:D,coldRank:0};
    const crit={status:'critical',lastChecked:D,checkedBy:'Tech',notes:'1.5 °C 08:00 (✍ typed)',updatedAt:T0+8*3600e3,updatedBy:'tech',coldDay:D,coldRank:2};
    const store=f=>{const o={};for(let i=0;i<14;i++)o['cold_storage::'+i]=f('c',i);for(let i=0;i<6;i++)o['pump_room::'+i]=f('p',i);return JSON.stringify(o);};
    const before=store((k,i)=>k==='c'?Object.assign({},pend,{coldRoom:'CR'+i}):{status:'ok',lastChecked:'2026-10-12',checkedBy:'Tech',notes:'',updatedAt:T0});
    const after=store((k,i)=>k==='c'?Object.assign({},i<12?crit:pend,{coldRoom:'CR'+i}):(i<2?{status:'issue',lastChecked:D,checkedBy:'Tech',notes:'leak',updatedAt:T1}:{status:'ok',lastChecked:'2026-10-12',checkedBy:'Tech',notes:'',updatedAt:T0}));
    const gen=window.__hnxDsStats(before,after,'hydroPro_test_checklist_v1','down')||{};
    window.__hnxMergeWatch(K,before,after,'pull');await sleep(300);
    const e=ents(K)[0]||{},st=e.stats||{};
    const out={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length,byStamps:[gen.fwd,window.__hnxDsIsSuspect(gen,'hydroPro_test_checklist_v1')]};reset();return out;}),
  expect:{changed:14,fwd:14,cls:'quiet',banner:false,inbox:0,byStamps:[2,true]} },

{ name:'🛡 v23.32 (22) shipment group moves (v22.64: per-field stamp on `grp` only; `prev` / `by` undated): 60 lines, 40 moved on another computer → 40 changed, 40 newer, QUIET (the undated fields go with the newer record, as the merge takes them); the same 40 with the record stamp 1 h OLDER → 0 newer, needs a look',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const K='hydroPro_prj15_ship_v1';
    const ln=(i,g,p,by,t,rt)=>({id:'MX1012-D'+String(i+1).padStart(3,'0'),code:'MX1012-D'+String(i+1).padStart(3,'0'),grp:g,prev:p,by:by,updatedAt:new Date(rt||t).toISOString(),_fts:{grp:t}});
    const before=arr(60,i=>ln(i,'G2','G1','eyal',T0));
    window.__hnxMergeWatch(K,before,arr(60,i=>i<40?ln(i,'G3','G2','amy',T1):ln(i,'G2','G1','eyal',T0)),'pull');await sleep(300);
    const e=ents(K)[0]||{},st=e.stats||{};const q={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};
    reset();
    window.__hnxMergeWatch(K,before,arr(60,i=>i<40?ln(i,'G3','G2','amy',T1,T0-3600e3):ln(i,'G2','G1','eyal',T0)),'pull');await sleep(300);
    const e2=ents(K)[0]||{},s2=e2.stats||{};
    const out={quiet:q,olderRecord:[s2.changed,s2.fwd,e2.cls]};reset();return out;}),
  expect:{quiet:{changed:40,fwd:40,cls:'quiet',banner:false,inbox:0},olderRecord:[40,0,'suspect']} },

{ name:'🛡 v23.32 (23) the 📦 sync archive (v22.60) moving 250 of 300 maintenance tasks out of the live store with delete marks → 250 removed, 250 deleted on purpose, QUIET, 0 inbox alerts; the 🚨 escalation store (v23.14) with 40 of 60 plans re-planned on another computer (newer field stamps) → 40 newer, quiet',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const MK='hydroPro_maint_tasks',XK='hydroPro_esc_actions_v1';
    const task=i=>({id:'MT-AR'+i,title:'Pool alarm '+i,status:'done',automatic:true,createdAt:T0,updatedAt:T0});
    tomb(MK,ids('MT-AR',0,250),T1);
    window.__hnxMergeWatch(MK,arr(300,task),arr(50,task,250),'pull');await sleep(300);
    const e=ents(MK)[0]||{},st=e.stats||{};const a={removed:st.removed,tomb:st.tomb,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};
    reset();
    const plan=(i,resp,t)=>({id:'ESC_issue_'+i,src:'issue',itemId:'I'+i,action:'fix',resp:resp,due:'2026-10-15',updatedAt:t,_fts:{action:T0,resp:t,due:T0}});
    window.__hnxMergeWatch(XK,arr(60,i=>plan(i,'jake',T0)),arr(60,i=>i<40?plan(i,'amy',T1):plan(i,'jake',T0)),'pull');await sleep(300);
    const e2=ents(XK)[0]||{},s2=e2.stats||{};
    const out={archive:a,escalation:[s2.changed,s2.fwd,e2.cls]};reset();return out;}),
  expect:{archive:{removed:250,tomb:250,cls:'quiet',banner:false,inbox:0},escalation:[40,40,'quiet']} },
/* ---- v23.32 review 2 ---- */
{ name:'🛡 v23.32 review 2 (24) one computer 25 min fast no longer makes normal bulk work "need a look": its asset sign-off arrives → this computer\'s stamp mark moves 25 min ahead → Jinky (clock right) edits 40 of 70 employees, the roster hook stamps them ≥ that mark → the download: 40 changed, 40 newer, QUIET, no banner, 0 inbox alerts; an asset-audit 💾 Save all of 40 of 70 marks stamped 30 min ahead with the mark there → 40 newer, quiet; a computer whose own mark is at its own time still takes both for the future (0 newer, needs a look)',
  requires:REQ+"&&typeof window.__hnxMergeAssetRecon==='function'",
  run:run(async()=>{await sleep(3000);reset();const MK='hnx_mono_ts_max',AK2='hydroPro_asset_recon_v1',sk=window.__hnxClockSkewMs,m0=localStorage.getItem(MK),e0=localStorage.getItem(EK);let out={};
    try{window.__hnxClockSkewMs=0;
      /* computer X, its clock 25 min fast, signs off an asset account: the pull merge learns that stamp */
      const ahead=Date.now()+25*60e3,so={by:'x'};
      window.__hnxMergeAssetRecon(JSON.stringify({answers:{A0:'ok'},_ts:{'answers.A0':arSt(T0,'ok')}}),JSON.stringify({answers:{A0:'ok'},signoff:{ACC1:so},_ts:{'answers.A0':arSt(T0,'ok'),'signoff.ACC1':arSt(ahead,so)}}));
      const learned=(+localStorage.getItem(MK)||0)>=ahead;
      /* Jinky's computer (clock right) edits 40 of 70 employees through the real roster hook */
      localStorage.setItem(EK,JSON.stringify(Array.from({length:70},(_,i)=>emp(i))));const before=localStorage.getItem(EK);
      localStorage.setItem(EK,JSON.stringify(JSON.parse(before).map((e,i)=>i<40?Object.assign({},e,{dailyRate:650}):e)));const after=localStorage.getItem(EK);
      const stampedAhead=JSON.parse(after).slice(0,40).every(e=>(+((e._fts||{}).dailyRate)||0)>=ahead);
      window.__hnxMergeWatch(EK,before,after,'pull');await sleep(300);
      const e=ents(EK)[0]||{},st=e.stats||{};const em={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};
      /* the asset audit: 💾 Save all of 40 of 70 marks on a computer whose mark is 30 min ahead */
      reset();const ah2=Date.now()+30*60e3;window.__hnxMonoLearn(ah2+100);
      const ar=f=>{const s={answers:{},_ts:{}};for(let i=0;i<70;i++){const c=f&&i<40,v=c?'missing':'ok';s.answers['A'+i]=v;s._ts['answers.A'+i]=arSt(c?ah2+i:T0,v);}return JSON.stringify(s);};
      window.__hnxMergeWatch(AK2,ar(false),ar(true),'pull');await sleep(300);
      const e2=ents(AK2)[0]||{},s2=e2.stats||{};const as={changed:s2.changed,fwd:s2.fwd,cls:e2.cls,banner:!!bannerTxt(),inbox:alerts().length};
      /* a computer that has not seen the fast stamps: its mark is its own time */
      localStorage.setItem(MK,String(Date.now()));
      const c1=window.__hnxDsStats(before,after,EK,'down')||{},c2=window.__hnxDsStats(ar(false),ar(true),AK2,'down')||{};
      out={learned,stampedAhead,emp:em,ar:as,unseen:[c1.fwd,window.__hnxDsIsSuspect(c1,EK),c2.fwd,window.__hnxDsIsSuspect(c2,AK2)]};
    }finally{window.__hnxClockSkewMs=sk;if(m0!=null)localStorage.setItem(MK,m0);try{if(e0!=null)localStorage.setItem(EK,e0);else localStorage.removeItem(EK);}catch(x){}}
    reset();return out;}),
  expect:{learned:true,stampedAhead:true,emp:{changed:40,fwd:40,cls:'quiet',banner:false,inbox:0},ar:{changed:40,fwd:40,cls:'quiet',banner:false,inbox:0},unseen:[0,true,0,true]} },

{ name:'🛡 v23.32 review 2 (25) the boot download is judged with the clock offset the guard measured LAST time: this computer 30 min slow, the guard has not measured yet on this page, hnxlocal_clock_skew_v1 = −30 min → 40 of 61 trip days ✔ checked 5 min ago (= its clock + 25 min) arrive → 40 changed, 40 newer, QUIET, no banner, 0 inbox alerts (before: 0 newer, needs a look); nothing saved yet (the very first visit) → 0 newer, needs a look; the guard saves what it measures (within 2 min of 0 on this computer)',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const SK='hnxlocal_clock_skew_v1';
    for(let i=0;i<40&&window.__hnxClockSkewMs==null;i++)await sleep(250); /* the guard's own first check is done — it must not land in the middle */
    const sk=window.__hnxClockSkewMs,s0=localStorage.getItem(SK);
    const before=arr(61,i=>tday(i,T0)),after=arr(61,i=>i<40?check(i,Date.now()+25*60e3):tday(i,T0));
    let saved={},none=[];
    try{delete window.__hnxClockSkewMs;window.__hnxClockSkewMs=undefined;
      localStorage.setItem(SK,JSON.stringify({ms:-30*60e3,at:Date.now()}));
      window.__hnxMergeWatch(LK,before,after,'first pull');await sleep(300);
      const e=ents(LK)[0]||{},st=e.stats||{};saved={changed:st.changed,fwd:st.fwd,cls:e.cls,banner:!!bannerTxt(),inbox:alerts().length};
      reset();localStorage.removeItem(SK);
      window.__hnxMergeWatch(LK,before,after,'first pull');await sleep(300);
      const e2=ents(LK)[0]||{},s2=e2.stats||{};none=[s2.changed,s2.fwd,e2.cls];
    }finally{window.__hnxClockSkewMs=sk;}
    localStorage.removeItem(SK);try{window.__hnxClockCheck();}catch(x){}
    let got=null;for(let i=0;i<60&&!got;i++){await sleep(250);try{got=JSON.parse(localStorage.getItem(SK)||'null');}catch(x){}}
    const measured=!!got&&isFinite(+got.ms)&&Math.abs(+got.ms)<120000;
    if(s0!=null)localStorage.setItem(SK,s0);
    const out={saved,none,measured};reset();return out;}),
  expect:{saved:{changed:40,fwd:40,cls:'quiet',banner:false,inbox:0},none:[40,0,'suspect'],measured:true} },

{ name:'🛡 v23.32 review 2 (26) ↩ Undo makes the copy the truth by each store\'s own merge rule — asset audit: 40 answers + 5 lock marks; a download changes 30 answers (newer stamps), removes the 5 lock marks (delete marks) and adds 5 answers → ↩ Undo → 45 of 45 entries stamped now, 5 delete marks for the added answers, 0 junk "updatedAt" entries (before: 4) → the other computer\'s merge holds 40 of 40 "ok", the 5 lock marks, 0 of the 5 added, and this computer\'s next pull keeps that; ❄ cold-room days: no ↩ Undo button, HNXDS.undo leaves the store unchanged; Maintenance checklist: 6 ordinary rows put back dated now (the other computer takes 6 of 6), 12 ❄ cold rows left as they are',
  requires:REQ+"&&typeof window.__hnxMergeAssetRecon==='function'&&typeof window.__hnxMergeChecklistState==='function'",
  run:run(async()=>{await sleep(3000);reset();window.confirm=()=>true;const AR='hydroPro_asset_recon_v1',CD='hydroPro_cold_daily_v1',MC='hydroPro_maintenance_checklist';
    const raw0={[AR]:localStorage.getItem(AR),[CD]:localStorage.getItem(CD),[MC]:localStorage.getItem(MC)};
    const put=(k,v)=>{try{if(window.__hnxRawSetSuppressed)window.__hnxRawSetSuppressed(k,v);else localStorage.setItem(k,v);}catch(x){localStorage.setItem(k,v);}};
    let out={};
    try{
      /* the asset audit */
      const mk=o=>{const s={answers:{},lockNos:{},_ts:{},_tomb:{}};
        for(let i=0;i<40;i++){const c=o.ch&&i<30,v=c?'missing':'ok';s.answers['A'+i]=v;s._ts['answers.A'+i]=arSt(c?T1:T0,v);}
        if(o.add)for(let i=40;i<45;i++){s.answers['A'+i]='found';s._ts['answers.A'+i]=arSt(T1,'found');}
        for(let i=0;i<5;i++){if(o.rm){s._tomb['lockNos.L'+i]=T1;continue;}s.lockNos['L'+i]=true;s._ts['lockNos.L'+i]=arSt(T0,true);}
        return JSON.stringify(s);};
      const before=mk({}),after=mk({ch:true,rm:true,add:true});
      put(AR,after);window.__hnxMergeWatch(AR,before,after,'pull');
      /* the cold-room days: 12 days, 10 with a later check */
      const day=(i,at)=>({CR1:{check:{v:5.1,at:at,by:'tech',src:'typed'},hand:[{id:'h'+i,v:5,at:T0,ts:T0}]}});
      const cstore=f=>{const o={};for(let i=0;i<12;i++)o[dt(i)]=f(i);return JSON.stringify(o);};
      const cb=cstore(i=>day(i,T0+i)),ca=cstore(i=>i<10?day(i,T1+i):day(i,T0+i));
      put(CD,ca);window.__hnxMergeWatch(CD,cb,ca,'pull');
      /* the Maintenance checklist: 12 ❄ cold rows (not the rows the cold-room mirror owns) + 6 ordinary rows */
      const D='2026-10-13',cold=(r,x)=>Object.assign({status:'pending',lastChecked:'',checkedBy:'',notes:'due by 09:00',updatedAt:T0+1,updatedBy:'system',coldRoom:'CRX'+r,coldDay:D,coldRank:0},x||{});
      const mstore=f=>{const o={};for(let i=2;i<14;i++)o['cold_storage::'+i]=f('c',i);for(let i=0;i<6;i++)o['pump_room::'+i]=f('p',i);return JSON.stringify(o);};
      const mb=mstore((k,i)=>k==='c'?cold(i):{status:'ok',lastChecked:'2026-10-12',checkedBy:'Tech',notes:'',updatedAt:T0});
      const ma=mstore((k,i)=>k==='c'?cold(i,{status:'critical',lastChecked:D,checkedBy:'Tech',notes:'1.5 °C',updatedAt:T0+8*3600e3,updatedBy:'tech',coldRank:2}):{status:'issue',lastChecked:D,checkedBy:'Tech',notes:'leak',updatedAt:T1});
      put(MC,ma);window.__hnxMergeWatch(MC,mb,ma,'pull');await sleep(400);
      const eA=ents(AR)[0]||{},eC=ents(CD)[0]||{},eM=ents(MC)[0]||{};
      switchView('admin_datasafety');await sleep(900);
      const html=(document.getElementById('view-admin_datasafety')||{}).innerHTML||'',btn=e=>!!e.id&&html.indexOf("HNXDS.undo('"+e.id+"')")>=0;
      const buttons=[btn(eA),btn(eC),btn(eM)];
      /* ↩ Undo on the asset audit */
      const t0=Date.now();HNXDS.undo(eA.id);await sleep(1200);
      const mine=localStorage.getItem(AR),R=JSON.parse(mine||'{}');
      const P=Object.keys(R.answers||{}).map(k=>['answers.'+k,R.answers[k]]).concat(Object.keys(R.lockNos||{}).map(k=>['lockNos.'+k,R.lockNos[k]]));
      const stamped=P.filter(([p,v])=>{const s=String((R._ts||{})[p]||''),i=s.indexOf(':');return i>0&&+s.slice(0,i)>=t0&&s.slice(i+1)===arH(v);}).length;
      const tombs=[40,41,42,43,44].filter(i=>+((R._tomb||{})['answers.A'+i]||0)>=t0).length;
      const junk=['answers','lockNos','_ts','_tomb'].filter(s=>R[s]&&typeof R[s]==='object'&&('updatedAt' in R[s])).length;
      const look=raw=>{const O=JSON.parse(raw);const a=O.answers||{};return {ok:Object.keys(a).filter(k=>a[k]==='ok').length,locks:Object.keys(O.lockNos||{}).length,added:[40,41,42,43,44].filter(i=>('A'+i) in a).length};};
      const other=window.__hnxMergeAssetRecon(after,mine),oRaw=other.out||after;
      const back=window.__hnxMergeAssetRecon(mine,oRaw),bRaw=back.out||mine;
      /* ↩ Undo on the cold-room days */
      const cdNow=localStorage.getItem(CD);HNXDS.undo(eC.id);await sleep(700);const cdSame=localStorage.getItem(CD)===cdNow;
      /* ↩ Undo on the Maintenance checklist */
      const t1=Date.now();HNXDS.undo(eM.id);await sleep(1200);
      const M=JSON.parse(localStorage.getItem(MC)||'{}'),MA=JSON.parse(ma);
      const ord=Object.keys(M).filter(k=>/^pump_room::/.test(k));
      const om=window.__hnxMergeChecklistState(ma,localStorage.getItem(MC)),O2=JSON.parse((om&&om.out)||ma);
      out={buttons,asset:{entries:P.length,stamped,tombs,junk},otherComputer:look(oRaw),nextPull:look(bRaw),coldSame:cdSame,
        checklist:{back:ord.filter(k=>M[k].status==='ok').length,dated:ord.filter(k=>+M[k].updatedAt>=t1).length,coldKept:Object.keys(MA).filter(k=>/^cold_storage::/.test(k)&&JSON.stringify(M[k])===JSON.stringify(MA[k])).length,otherOk:Object.keys(O2).filter(k=>/^pump_room::/.test(k)&&O2[k].status==='ok').length}};
    }finally{Object.keys(raw0).forEach(k=>{try{if(raw0[k]!=null)put(k,raw0[k]);else localStorage.removeItem(k);}catch(x){}});}
    reset();return out;}),
  expect:{buttons:[true,false,true],asset:{entries:45,stamped:45,tombs:5,junk:0},otherComputer:{ok:40,locks:5,added:0},nextPull:{ok:40,locks:5,added:0},coldSame:true,
    checklist:{back:6,dated:6,coldKept:12,otherOk:6}} },

{ name:'🛡 v23.32 review 2 (27) mass removals WITH delete marks from the sensitive stores ask again at the v21.28 count, max(4, 30%): trip log 25 of 61 days with delete marks → needs a look, banner "trip log: 25 of 61 records deleted at once" (before: quiet — 25 < max(10, 50%) = 31; v23.22 asked); payroll runs 11 of 24 with delete marks → needs a look; 6 of 61 trip days with delete marks → no entry',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();const RK='hydroPro_payroll_runs';
    const untomb2=()=>{try{const o=JSON.parse(localStorage.getItem(TB)||'{}')||{};delete o[LK];delete o[RK];localStorage.setItem(TB,JSON.stringify(o));}catch(x){}};
    const dayIds=n=>Array.from({length:n},(_,i)=>'dlvday_'+dt(i)+'_e1');
    tomb(LK,dayIds(25),T1);
    window.__hnxMergeWatch(LK,arr(61,i=>tday(i,T0)),arr(36,i=>tday(i,T0),25),'pull');await sleep(300);
    const e=ents(LK)[0]||{},st=e.stats||{};const b=bannerTxt();
    reset();untomb2();
    const prun=i=>({id:'PR-DS'+i,status:'draft',period:'2026-W'+i,createdAt:T0,updatedAt:T0});
    tomb(RK,ids('PR-DS',0,11),T1);
    window.__hnxMergeWatch(RK,arr(24,prun),arr(13,prun,11),'pull');await sleep(300);
    const e2=ents(RK)[0]||{},s2=e2.stats||{};
    reset();untomb2();
    tomb(LK,dayIds(6),T1);
    window.__hnxMergeWatch(LK,arr(61,i=>tday(i,T0)),arr(55,i=>tday(i,T0),6),'pull');await sleep(300);
    const six=ents(LK).length;
    untomb2();
    const out={trip:[st.removed,st.tomb,e.cls],tripBanner:/1 download needs a look — trip log: 25 of 61 records deleted at once/.test(b),runs:[s2.removed,s2.tomb,e2.cls],six};reset();return out;}),
  expect:{trip:[25,25,'suspect'],tripBanner:true,runs:[11,11,'suspect'],six:0} },

{ name:'🛡 v23.32 review 2 (28) a DIFFERENT download that needs a look after the owner reviewed the first alerts again the same day, the synced inbox kept: 8 of 20 removed with no delete → 1 alert → reviewed → 10 of 20 removed → 2 alerts, the new one "10 records removed with no delete behind them" (before: still 1 — the alert id was per store per day); 6 of 20 removed before he looks again → still 2; the same 10-of-20 download recorded on a second computer → still 2',
  requires:REQ,
  run:run(async()=>{await sleep(3000);reset();
    window.__hnxMergeWatch(TL,arr(20,item),arr(12,item,8),'pull');await sleep(200);const a1=alerts('tester').length;
    HNXDS.markReviewed();await sleep(40);
    window.__hnxMergeWatch(TL,arr(20,item),arr(10,item,10),'pull');await sleep(200);const al=alerts('tester'),a2=al.length;
    const newest=(al.slice().sort((x,y)=>(y.at||0)-(x.at||0))[0]||{}).body||'';
    window.__hnxMergeWatch(TL,arr(20,item),arr(14,item,6),'pull');await sleep(200);const a3=alerts('tester').length;
    localStorage.setItem(BK,'[]');localStorage.removeItem('hnxlocal_ds_held_alerted_v1');
    window.__hnxMergeWatch(TL,arr(20,item),arr(10,item,10),'pull');await sleep(200);const a4=alerts('tester').length;
    const out={first:a1,afterReview:a2,names:/10 records removed with no delete behind them/.test(newest),beforeHeLooks:a3,secondComputer:a4};reset();return out;}),
  expect:{first:1,afterReview:2,names:true,beforeHeLooks:2,secondComputer:2} },

{ name:'🛡 v23.32 review 2 (29) memo approvals no longer cut the shared inbox: 650 notes here and in the cloud, Mea submits, Jinky gives ① → 2 FINAL-approval notes (Dr Amy, Eyal) on top, 0 of the 650 removed → the inbox uploads, not held (before: cut to 400, 252 of 650 removed, held — and the final notes never left that computer)',
  requires:REQ+"&&typeof window.hnxMemoApproveDo==='function'&&typeof window.hnxMemoSubmit==='function'",
  run:run(async()=>{await sleep(3000);reset();memoUsers();window.__hnxPulledOk=true;window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>'ok';
    const ms=JSON.parse(localStorage.getItem('hydroPro_memos')||'[]');
    ms.push({id:'MDS1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad',reasons:['t'],signatures:{supervisor:null,hrManager:null},status:'draft',createdBy:'mea',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),impact:[],totalAmount:0});
    localStorage.setItem('hydroPro_memos',JSON.stringify(ms));try{loadMemos();}catch(x){}
    actAs('mea');const sub=!!(hnxMemoSubmit('MDS1')||{}).ok;
    const raw0=JSON.stringify(Array.from({length:650},(_,i)=>({id:'N'+i,user:'someone',at:1760000000000-i*60000,itemId:'x',title:'notice '+i,text:'body of notice '+i,read:true})));
    localStorage.setItem(IK,raw0);window.__hnxCloudRaw[IK]=raw0;
    actAs('jinky');const acct=!!(hnxMemoApproveDo('MDS1','acct')||{}).ok;actAsTester();
    const local=localStorage.getItem(IK),a=JSON.parse(local),st=window.__hnxDsStats(raw0,local,IK,true)||{};
    const o=window.__hnxPushGuard({[IK]:local});
    const out={sub,acct,finals:a.filter(x=>x&&/_final_/.test(String(x.id))).length,kept:a.filter(x=>x&&/^N\d+$/.test(String(x.id))).length,removed:st.removed,uploads:IK in o,held:!!HNXDS.held()[IK]};
    delete window.__hnxCloudRaw[IK];reset();return out;}),
  expect:{sub:true,acct:true,finals:2,kept:650,removed:0,uploads:true,held:false} },

{ name:'🛡 v23.32 review 2 (30) the ❄ cold-room notices no longer cut the shared inbox: 650 notes here and in the cloud, CS2 typed 3.9 °C (warning) → the cold notice on top, 0 of the 650 removed → the inbox uploads, not held (before: cut to 400, 251 of 650 removed, held)',
  requires:REQ+"&&typeof window.hnxColdRooms==='object'",tz:'Asia/Manila',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
      {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
      {username:'reven',fullname:'Reven Estonio',passwordHash:'x',role:'operator',active:true,department:'maintenance'},
      {username:'jomel',fullname:'Jomel Galvo',passwordHash:'x',role:'supervisor',active:true,department:'maintenance'}]));
    localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'jomel'}));
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'reven',loginAt:Date.now()}));},
  run:run(async()=>{await sleep(3000);reset();window.__hnxPulledOk=true;window.confirm=()=>true;
    const raw0=JSON.stringify(Array.from({length:650},(_,i)=>({id:'N'+i,user:'someone',at:1760000000000-i*60000,itemId:'x',title:'notice '+i,text:'body '+i,read:true})));
    localStorage.setItem(IK,raw0);window.__hnxCloudRaw[IK]=raw0;
    window.hnxColdRooms.saveDaily('CS2','3.9');await sleep(300);
    const local=localStorage.getItem(IK),a=JSON.parse(local),st=window.__hnxDsStats(raw0,local,IK,true)||{};
    const o=window.__hnxPushGuard({[IK]:local});
    const out={cold:a.filter(x=>x&&x.itemId==='cold').length>=1,kept:a.filter(x=>x&&/^N\d+$/.test(String(x.id))).length,removed:st.removed,uploads:IK in o,held:!!HNXDS.held()[IK]};
    delete window.__hnxCloudRaw[IK];reset();return out;}),
  expect:{cold:true,kept:650,removed:0,uploads:true,held:false} },

{ name:'🛡 v23.32 review 2 (31) every writer of the shared inbox keeps 800: index.html and next.html scanned (at least 15 writes of hydroPro_pa_inbox_v1 each) → 0 writes that cut it below 800 (were 3: memo chain ×2 and the ❄ cold-room notices at 400), and the storage rescue trims it to 800 (was 400)',
  requires:REQ,
  drive:async()=>{const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..','..'),out={};
    for(const [k,f] of [['index','index.html'],['next','next.html']]){const r=inboxScan(fs.readFileSync(path.join(root,f),'utf8'));
      out[k]={enough:r.writes.length>=15,under:r.writes.filter(w=>w.n!=null&&w.n<800).map(w=>w.line+': '+w.txt),trim:r.trim};}
    return out;},
  expect:{'drive.index':{enough:true,under:[],trim:800},'drive.next':{enough:true,under:[],trim:800}} },
];
