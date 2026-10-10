/* v22.32 (Eyal, 10 Oct 2026, 🛡 Data Safety screen: "why its happened all the time should be auto") — calls and issues uploads were
   HELD several times a day ("issues: 0 removed · 225 changed · 0 added of 300"; "Upload anyway" pressed at 8:56, 9:38, 9:38, 13:43):
   · the daily approval reminder rewrote EVERY resolved issue once a day, also the pool alarms Nexi resolved by itself, with no stamp;
   · the pool alarm auto-resolve closed hundreds of issues in one save, with no stamp;
   · two computers never converged (a tie keeps the local copy), so each one's copy differed from the cloud in 225 of 300 records.
   Now those writers stamp updatedAt and, for calls and issues, the gate counts a record changed here with a NEWER stamp (one the
   merge itself would take, never more than 10 min in the future) that does not move it BACK (re-open, un-approve) as ordinary work.
   Stale copies, re-opens, un-approvals and removals are held exactly as before. The daily approval reminder is kept on each
   computer (hnxlocal_issue_reminders_v1) and never writes the synced issue, so it can no longer undo an approval. Also: stable now keeps a store the cloud
   did not take (the deployed worker drops anything over 5 MB) as unsent, instead of treating it as sent. */
const H=`
  const IK='hydroPro_issues_v2',CK='hydroPro_calls',HK='hnxlocal_push_held_v1';
  const T0=1790000000000,T1=T0+3600e3;
  const iss=(i,x)=>Object.assign({id:'ISS-'+i,module:'irrigation',title:'EC out of range in Pool P0'+(1+i%9)+' at 08:00',status:'open',priority:'critical',createdAt:T0,history:[]},x||{});
  const resolvedBySystem=(i,t)=>iss(i,{status:'resolved',resolvedAt:t,updatedAt:t,autoResolved:true,history:[{action:'resolved',by:'system',at:t}]});
  const call=(i,x)=>Object.assign({id:'CALL-'+i,subject:'Pool alarm '+i,status:'new',priority:'urgent',raisedAt:T0,automatic:true,updates:[]},x||{});
  const closed=(i,t)=>call(i,{status:'closed_fixed',closedAt:t,updatedAt:t,autoResolved:true});
  const arr=(n,f)=>JSON.stringify(Array.from({length:n},(_,i)=>f(i)));
  const reset=()=>{const h=HNXDS.held();Object.keys(h).forEach(k=>delete h[k]);localStorage.setItem(HK,'{}');};
`;
const run=fn=>new Function('return (async()=>{'+H+' return await ('+fn.toString()+')(); })();');
const NEW="typeof window.__hnxPushGuard==='function'&&/hydroPro_issues_v2/.test(String(window.__hnxPushGuard))===false&&!!window.HNXDS";
module.exports=[
{ name:'🛡 v22.32 issues: 225 of 300 issues resolved HERE by Nexi with newer stamps (the pool alarm clean-up) upload by themselves — 225 changed, 225 newer here, NOT held (v22.30 held "0 removed · 225 changed of 300"); calls: 250 of 400 pool-alarm calls closed here by the janitor (newer stamps) are not held either',
  requires:"typeof window.__hnxDsStats==='function'",
  run:run(async()=>{await sleep(3000);reset();
    const cloudI=arr(300,i=>iss(i)),hereI=arr(300,i=>i<225?resolvedBySystem(i,T1):iss(i));
    window.__hnxCloudRaw[IK]=cloudI;const o1=window.__hnxPushGuard({[IK]:hereI});const h1=!!HNXDS.held()[IK];const s1=window.__hnxDsStats(cloudI,hereI,IK,true)||{};reset();
    const cloudC=arr(400,i=>call(i)),hereC=arr(400,i=>i<250?closed(i,T1):call(i));
    window.__hnxCloudRaw[CK]=cloudC;const o2=window.__hnxPushGuard({[CK]:hereC});const h2=!!HNXDS.held()[CK];const s2=window.__hnxDsStats(cloudC,hereC,CK,true)||{};reset();
    return {issues:{up:IK in o1,held:h1,changed:s1.changed,fwd:s1.fwd},calls:{up:CK in o2,held:h2,changed:s2.changed,fwd:s2.fwd}};}),
  expect:{issues:{up:true,held:false,changed:225,fwd:225},calls:{up:true,held:false,changed:250,fwd:250}} },

{ name:'🛡 v22.32 a STALE copy is still held: the cloud has 225 issues resolved at T1, this computer still has them open from T0 (no stamp) → HELD (225 changed, 0 newer here); a bulk RE-OPEN of 225 resolved issues with fresh stamps → HELD (0 newer here); 150 calls of 400 REMOVED → HELD; 250 calls re-opened (closed in the cloud) → HELD',
  requires:"typeof window.__hnxDsStats==='function'",
  run:run(async()=>{await sleep(3000);reset();
    const cloudI=arr(300,i=>i<225?resolvedBySystem(i,T1):iss(i)),stale=arr(300,i=>iss(i));
    window.__hnxCloudRaw[IK]=cloudI;const o1=window.__hnxPushGuard({[IK]:stale});const e1=HNXDS.held()[IK]||{};reset();
    const reopen=arr(300,i=>i<225?iss(i,{updatedAt:T1+60e3}):iss(i));
    const o2=window.__hnxPushGuard({[IK]:reopen});const e2=HNXDS.held()[IK]||{};reset();
    const cloudC=arr(400,i=>call(i)),fewer=JSON.stringify(JSON.parse(cloudC).slice(150));
    window.__hnxCloudRaw[CK]=cloudC;const o3=window.__hnxPushGuard({[CK]:fewer});const e3=HNXDS.held()[CK]||{};reset();
    const cloudCl=arr(400,i=>i<250?closed(i,T0):call(i)),reop=arr(400,i=>i<250?call(i,{updatedAt:T1}):call(i));
    window.__hnxCloudRaw[CK]=cloudCl;const o4=window.__hnxPushGuard({[CK]:reop});const e4=HNXDS.held()[CK]||{};reset();
    return {stale:{up:IK in o1,held:!!e1.at,fwd:(e1.stats||{}).fwd},reopen:{up:IK in o2,held:!!e2.at,fwd:(e2.stats||{}).fwd},removed:{up:CK in o3,held:!!e3.at,removed:(e3.stats||{}).removed},reopenCalls:{up:CK in o4,held:!!e4.at,fwd:(e4.stats||{}).fwd}};}),
  expect:{stale:{up:false,held:true,fwd:0},reopen:{up:false,held:true,fwd:0},removed:{up:false,held:true,removed:150},reopenCalls:{up:false,held:true,fwd:0}} },

{ name:'🛡 v22.32 key order alone is no change for calls and issues: 40 calls with the same values written with their fields in another order → 0 changed, uploads (v22.30 counted 40 of 40 changed)',
  requires:"typeof window.__hnxDsStats==='function'",
  run:run(async()=>{await sleep(3000);reset();
    const a=Array.from({length:40},(_,i)=>call(i)),cloud=JSON.stringify(a),here=JSON.stringify(a.map(r=>{const o={};Object.keys(r).reverse().forEach(k=>o[k]=r[k]);return o;}));
    window.__hnxCloudRaw[CK]=cloud;const o=window.__hnxPushGuard({[CK]:here});const st=window.__hnxDsStats(cloud,here,CK,true)||{};const held=!!HNXDS.held()[CK];reset();
    return {up:CK in o,held,changed:st.changed};}),
  expect:{up:true,held:false,changed:0} },

{ name:'⏰ v22.32 the daily approval reminder never writes the synced issue: 300 issues = 225 resolved by Nexi (autoResolved) + 2 resolved by "system" with no flag (older builds) + 3 resolved by a person 2 days ago (1 with no awaiting_approval_since) + 70 open → 3 reminded (was 228), all 300 records byte-identical, the reminders kept on this computer (hnxlocal_issue_reminders_v1, an issue with 9 old entries keeps the last 7); a second check the same day → 0',
  requires:"/hnxlocal_issue_reminders_v1/.test(String(window.hnxCheckDailyReminders))",
  run:run(async()=>{await sleep(3000);
    const now=Date.now(),D2=now-2*864e5,RK='hnxlocal_issue_reminders_v1';
    const person=(i,x)=>iss(i,Object.assign({status:'resolved',resolvedAt:D2,awaiting_approval_since:D2,history:[{action:'resolved',by:'Jomel',at:D2}]},x||{}));
    const list=Array.from({length:300},(_,i)=>i<225?resolvedBySystem(i,T1):i<227?iss(i,{status:'resolved',resolvedAt:D2,history:[{action:'resolved',by:'system',at:D2}]}):i<229?person(i):i===229?person(i,{awaiting_approval_since:null}):iss(i));
    const raw=JSON.stringify(list);localStorage.setItem(IK,raw);
    localStorage.setItem(RK,JSON.stringify({'ISS-227':Array.from({length:9},(_,k)=>D2-(9-k)*864e5)}));
    const n=window.hnxCheckDailyReminders();const same=localStorage.getItem(IK)===raw;
    const rem=JSON.parse(localStorage.getItem(RK)||'{}');const n2=window.hnxCheckDailyReminders();
    return {n,same,ids:Object.keys(rem).sort(),kept:rem['ISS-227'].length,last:rem['ISS-227'][6]>=now,n2};}),
  expect:{n:3,same:true,ids:['ISS-227','ISS-228','ISS-229'],kept:7,last:true,n2:0} },

{ name:'✅ v22.32 an approval given on another computer survives this computer\'s reminder: 3 issues resolved here 2 days ago, approved in the cloud 1 h later → reminder runs here (3 reminded, record untouched) → the merge keeps APPROVED for all 3 (v22.32 first cut stamped the reminder as newer and undid the approval)',
  requires:"typeof window.__hnxMergeGeneric==='function'&&/hnxlocal_issue_reminders_v1/.test(String(window.hnxCheckDailyReminders))",
  run:run(async()=>{await sleep(3000);localStorage.removeItem('hnxlocal_issue_reminders_v1');
    const now=Date.now(),D2=now-2*864e5;
    const here=[0,1,2].map(i=>iss(i,{status:'resolved',resolvedAt:D2,updatedAt:D2,awaiting_approval_since:D2,history:[{action:'resolved',by:'Jomel',at:D2}]}));
    const cloud=here.map(r=>Object.assign({},r,{status:'approved',approvedAt:D2+3600e3,updatedAt:D2+3600e3}));
    localStorage.setItem(IK,JSON.stringify(here));const n=window.hnxCheckDailyReminders();
    const m=JSON.parse(window.__hnxMergeGeneric(IK,localStorage.getItem(IK),JSON.stringify(cloud))||'[]');
    return {n,approved:m.filter(r=>r.status==='approved').length};}),
  expect:{n:3,approved:3} },

{ name:'🛡 v22.32 moving records BACK is held even with newer stamps: 225 of 300 issues APPROVED in the cloud, "resolved" here with a newer stamp (a bulk un-approve) → HELD, 0 newer here; 225 issues resolved here stamped 2 h in the FUTURE (a clock running ahead) → HELD, 0 newer here',
  requires:"typeof window.__hnxDsStats==='function'",
  run:run(async()=>{await sleep(3000);reset();
    const now=Date.now();
    const cloudA=arr(300,i=>i<225?iss(i,{status:'approved',updatedAt:T1}):iss(i)),unap=arr(300,i=>i<225?iss(i,{status:'resolved',updatedAt:T1+60e3}):iss(i));
    window.__hnxCloudRaw[IK]=cloudA;const o1=window.__hnxPushGuard({[IK]:unap});const e1=HNXDS.held()[IK]||{};reset();
    const cloudI=arr(300,i=>iss(i)),ahead=arr(300,i=>i<225?resolvedBySystem(i,now+2*3600e3):iss(i));
    window.__hnxCloudRaw[IK]=cloudI;const o2=window.__hnxPushGuard({[IK]:ahead});const e2=HNXDS.held()[IK]||{};reset();
    return {unapprove:{up:IK in o1,held:!!e1.at,fwd:(e1.stats||{}).fwd},clockAhead:{up:IK in o2,held:!!e2.at,fwd:(e2.stats||{}).fwd}};}),
  expect:{unapprove:{up:false,held:true,fwd:0},clockAhead:{up:false,held:true,fwd:0}} },

{ name:'🛡 v22.32 reminder lines older builds wrote into 225 issues (daily_reminder_last_sent, reminder_sent history) are no change: 225 of 300 differ only there → 0 changed, uploads',
  requires:"typeof window.__hnxDsStats==='function'",
  run:run(async()=>{await sleep(3000);reset();
    const base=i=>iss(i,{status:'resolved',resolvedAt:T0,awaiting_approval_since:T0,approval_history:[{type:'resolved',at:T0}]});
    const cloud=arr(300,base),here=arr(300,i=>i<225?Object.assign(base(i),{daily_reminder_last_sent:T1,approval_history:[{type:'resolved',at:T0},{type:'reminder_sent',at:T1}]}):base(i));
    window.__hnxCloudRaw[IK]=cloud;const o=window.__hnxPushGuard({[IK]:here});const st=window.__hnxDsStats(cloud,here,IK,true)||{};const held=!!HNXDS.held()[IK];reset();
    return {up:IK in o,held,changed:st.changed};}),
  expect:{up:true,held:false,changed:0} },

{ name:'💧 v22.32 an EC/pH issue that Nexi resolves when the reading is back in range is stamped (updatedAt, autoResolved): Pool 1 EC 1.0 (critical) at 08:00 → 1 open issue; EC 1.8 → resolved with updatedAt and autoResolved',
  requires:"/autoResolved=true/.test(String(window.irrSavePool||''))||true",
  run:run(async()=>{await sleep(3000);window.showToast=()=>{};window.confirm=()=>true;window.__hnxPulledOk=true;
    switchView('irr_nutrients');await sleep(800);window.irrSetPoolTime('08:00');
    irrSavePool('P01','water','50');irrSavePool('P01','EC','1.0');await sleep(300);
    const open=(loadIssues()||[]).filter(i=>/^EC out of range in Pool P01 at 08:00$/.test(i.title)&&i.status!=='resolved').length;
    irrSavePool('P01','EC','1.8');await sleep(300);
    const r=(loadIssues()||[]).filter(i=>/^EC out of range in Pool P01 at 08:00$/.test(i.title));
    return {open,resolved:r.filter(i=>i.status==='resolved').length,stamped:r.every(i=>i.status!=='resolved'||(i.updatedAt>0&&i.autoResolved===true))};}),
  expect:{open:1,resolved:1,stamped:true} },

{ name:'☁ v22.32 a store the cloud did not take stays unsent (the deployed worker drops any store over 5 MB — calls): of 2 uploaded stores the worker stores 1 → the dropped one stays marked unsent on this computer and the sync line says "not stored by the cloud (too big): … — kept on this computer"; the stored one is cleared',
  requires:"/not stored by the cloud \\(too big\\)/.test(String(window.HNX_Cloud&&window.HNX_Cloud.push))",
  run:run(async()=>{await sleep(4000);
    const BK='hydroPro_zz_bigstore_v1',MK='hydroPro_zz_small_v1'; /* plain stores: a device-database store (calls) is not pushed before this session's first download */
    localStorage.setItem('hnx_cloud_token','t');window.__hnxPulledOk=true;window.__hnxStaleApp=null;const C=window.HNX_Cloud;C.state.online=true;C.state.syncing=false;C.state.error=null;
    const of=window.fetch;let sent=[];
    window.fetch=function(u,o){u=String(u);
      if(u.indexOf('/sync/push')>=0){let d={};try{d=JSON.parse(o.body).data||{};}catch(e){}sent=Object.keys(d);const keys=sent.filter(k=>k!==BK);return Promise.resolve(new Response(JSON.stringify({ok:true,written:keys.length,keys}),{status:200}));}
      if(u.indexOf('/sync/pull')>=0)return Promise.resolve(new Response(JSON.stringify({ok:true,data:{}}),{status:200}));
      return of.apply(this,arguments);};
    try{
      localStorage.setItem(BK,arr(5,i=>call(i,{updatedAt:Date.now()})));localStorage.setItem(MK,JSON.stringify([{id:'m1',title:'stored'}]));
      window.__hnxMarkDirtyKey(BK);window.__hnxMarkDirtyKey(MK);
      await window.HNX_Cloud.push();const error=String(C.state.error||'');await sleep(900); /* read at once: a background download that ends later clears the line */
      const dirty=JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}');
      return {sentCalls:sent.includes(BK),callsDirty:!!dirty[BK],memosDirty:!!dirty[MK],skipped:(window.__hnxPushSkipped||[]).map(x=>x.k),error};
    }finally{window.fetch=of;localStorage.removeItem('hnx_cloud_token');}}),
  expect:{sentCalls:true,callsDirty:true,memosDirty:false,skipped:['hydroPro_zz_bigstore_v1'],error:'not stored by the cloud (too big): zz_bigstore_v1 — kept on this computer'} },

{ name:'☁ v22.32 a store the cloud refused is not re-sent unchanged for 30 min: push 1 sends the 5-call store (refused) → push 2 with the same store sends NOTHING (still unsent, still in the sync line) → one call changed → push 3 sends it again',
  requires:"/__hnxSkHash/.test(String(window.HNX_Cloud&&window.HNX_Cloud.push))",
  run:run(async()=>{await sleep(4000);
    const BK='hydroPro_zz_bigstore_v1';
    localStorage.setItem('hnx_cloud_token','t');window.__hnxPulledOk=true;window.__hnxStaleApp=null;const C=window.HNX_Cloud;C.state.online=true;C.state.syncing=false;C.state.error=null;
    window.__hnxPushSkipped=[];localStorage.removeItem('hnxlocal_push_skipped_v1');
    const of=window.fetch;const sent=[];
    window.fetch=function(u,o){u=String(u);
      if(u.indexOf('/sync/push')>=0){let d={};try{d=JSON.parse(o.body).data||{};}catch(e){}const ks=Object.keys(d);sent.push(ks.includes(BK));const keys=ks.filter(k=>k!==BK);return Promise.resolve(new Response(JSON.stringify({ok:true,written:keys.length,keys}),{status:200}));}
      if(u.indexOf('/sync/pull')>=0)return Promise.resolve(new Response(JSON.stringify({ok:true,data:{}}),{status:200}));
      return of.apply(this,arguments);};
    const push=async()=>{C.state.syncing=false;window.__hnxMarkDirtyKey(BK);window.__hnxMarkDirtyKey('hydroPro_zz_small_v1');localStorage.setItem('hydroPro_zz_small_v1',JSON.stringify([{id:'m'+Math.random(),t:1}]));const i0=sent.length;await window.HNX_Cloud.push();const r={e:String(C.state.error||''),bk:sent.slice(i0).some(Boolean)};await sleep(500);return r;}; /* judged by its own request (an auto-upload may run in between) */
    try{
      localStorage.setItem(BK,arr(5,i=>call(i,{updatedAt:T1})));
      const p1=await push(),p2=await push();
      const d2=!!JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}')[BK];
      localStorage.setItem(BK,arr(5,i=>call(i,{updatedAt:T1+(i===0?60e3:0),status:i===0?'closed_fixed':'new'})));const p3=await push();
      return {sent:[p1.bk,p2.bk,p3.bk],stillUnsent:d2,line:/zz_bigstore_v1/.test(p1.e)&&/zz_bigstore_v1/.test(p2.e)};
    }finally{window.fetch=of;localStorage.removeItem('hnx_cloud_token');}}),
  expect:{sent:[true,false,true],stillUnsent:true,line:true} },

{ name:'☁ v22.32 a store still waiting for its merge (big store, 5-minute pace) is not uploaded until merged: owed → push sends the other store only, the owed one stays unsent; merged → it goes up',
  requires:"/__hnxMergeOwed/.test(String(window.HNX_Cloud&&window.HNX_Cloud.push))",
  run:run(async()=>{await sleep(4000);
    const OK2='hydroPro_zz_owed_v1',MK='hydroPro_zz_small_v1';
    localStorage.setItem('hnx_cloud_token','t');window.__hnxPulledOk=true;window.__hnxStaleApp=null;const C=window.HNX_Cloud;C.state.online=true;C.state.syncing=false;C.state.error=null;
    const of=window.fetch;const sent=[];
    window.fetch=function(u,o){u=String(u);
      if(u.indexOf('/sync/push')>=0){let d={};try{d=JSON.parse(o.body).data||{};}catch(e){}const ks=Object.keys(d);sent.push(ks.sort().join(','));return Promise.resolve(new Response(JSON.stringify({ok:true,written:ks.length,keys:ks}),{status:200}));}
      if(u.indexOf('/sync/pull')>=0)return Promise.resolve(new Response(JSON.stringify({ok:true,data:{}}),{status:200}));
      return of.apply(this,arguments);};
    try{
      localStorage.setItem(OK2,JSON.stringify([{id:'o1',t:1}]));localStorage.setItem(MK,JSON.stringify([{id:'m1',t:1}]));
      window.__hnxMarkDirtyKey(OK2);window.__hnxMarkDirtyKey(MK);(window.__hnxMergeOwed=window.__hnxMergeOwed||{})[OK2]=Date.now();
      let i0=sent.length;await C.push();const first=sent.slice(i0).join('|');await sleep(500);const d1=!!JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}')[OK2];
      delete window.__hnxMergeOwed[OK2];C.state.syncing=false;i0=sent.length;await C.push();const second=sent.slice(i0).join('|');await sleep(500);
      return {first,owedStillUnsent:d1,second};
    }finally{window.fetch=of;localStorage.removeItem('hnx_cloud_token');}}),
  expect:{first:'hydroPro_zz_small_v1',owedStillUnsent:true,second:'hydroPro_zz_owed_v1'} },

{ name:'📞 v22.32 a call list merged in by the sync is seen at once (the 2-second read cache is dropped): read 2 calls → sync writes 3 → the next read gives 3 (was 2 for up to 2 s; an edit in that window wrote the old list back)',
  requires:"typeof window.__hnxRawSetSuppressed==='function'&&typeof window.loadCalls==='function'",
  run:run(async()=>{await sleep(3000);
    localStorage.setItem(CK,arr(2,i=>call(i)));if(window._perfCache)delete window._perfCache._calls;
    const a=window.loadCalls().length;window.__hnxRawSetSuppressed(CK,arr(3,i=>call(i)));const b=window.loadCalls().length;
    return {a,b};}),
  expect:{a:2,b:3} },

{ name:'✍ v22.32 a person\'s action is dated so the newest copy wins everywhere: accept a call → updatedAt stamped; approve 1 resolved issue and reject another → both stamped; against the cloud copy the approval counts as newer work (fwd 1), the rejection (a move back) does not (2 changed, fwd 1)',
  requires:"typeof acceptCall==='function'&&String(window.hnxApproveIssue).indexOf('v22.32: stamped')>=0",
  run:run(async()=>{await sleep(3000);window.confirm=()=>true;window.showToast=()=>{};
    const t0=Date.now();
    localStorage.setItem(CK,arr(2,i=>call(i,{status:'new_call'})));if(window._perfCache)delete window._perfCache._calls;
    acceptCall('CALL-0');const c0=(loadCalls()||[]).find(c=>c.id==='CALL-0')||{};
    const before=arr(2,i=>iss(i,{status:'resolved',resolvedAt:T0,awaiting_approval_since:T0}));localStorage.setItem(IK,before);
    window.hnxApproveIssue('ISS-0','Eyal');window.hnxRejectIssue('ISS-1','not done','Eyal');
    const after=localStorage.getItem(IK),a=JSON.parse(after);const st=window.__hnxDsStats(before,after,IK,true)||{};
    return {call:c0.status==='accepted'&&c0.updatedAt>=t0,approved:a[0].status==='approved'&&a[0].updatedAt>=t0,rejected:a[1].status==='in_progress'&&a[1].updatedAt>=t0,changed:st.changed,fwd:st.fwd};}),
  expect:{call:true,approved:true,rejected:true,changed:2,fwd:1} }
];
