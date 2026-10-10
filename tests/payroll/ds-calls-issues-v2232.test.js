/* v22.32 (Eyal, 10 Oct 2026, 🛡 Data Safety screen: "why its happened all the time should be auto") — calls and issues uploads were
   HELD several times a day ("issues: 0 removed · 225 changed · 0 added of 300"; "Upload anyway" pressed at 8:56, 9:38, 9:38, 13:43):
   · the daily approval reminder rewrote EVERY resolved issue once a day, also the pool alarms Nexi resolved by itself, with no stamp;
   · the pool alarm auto-resolve closed hundreds of issues in one save, with no stamp;
   · two computers never converged (a tie keeps the local copy), so each one's copy differed from the cloud in 225 of 300 records.
   Now those writers stamp updatedAt and, for calls and issues, the gate counts a record changed here with a NEWER stamp (and no
   re-open) as ordinary work. Stale copies, re-opens and removals are held exactly as before. Also: stable now keeps a store the cloud
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

{ name:'⏰ v22.32 the daily approval reminder touches only issues a PERSON resolved: 300 issues = 225 resolved by Nexi (no awaiting_approval_since) + 3 resolved by a person 2 days ago + 72 open → 3 reminded (was 228), the 225 unchanged, the 3 stamped updatedAt; an issue already holding 9 reminder lines keeps the last 7',
  requires:"/autoResolved/.test(String(window.hnxCheckDailyReminders))",
  run:run(async()=>{await sleep(3000);
    const now=Date.now(),D2=now-2*864e5;
    const list=Array.from({length:300},(_,i)=>i<225?resolvedBySystem(i,T1):i<228?iss(i,{status:'resolved',resolvedAt:D2,awaiting_approval_since:D2,daily_reminder_last_sent:null,approval_history:i===225?Array.from({length:9},(_,k)=>({type:'reminder_sent',at:D2-k*864e5})):[]}):iss(i));
    localStorage.setItem(IK,JSON.stringify(list));const before=JSON.stringify(list.slice(0,225));
    const n=window.hnxCheckDailyReminders();const after=JSON.parse(localStorage.getItem(IK)||'[]');
    const three=after.slice(225,228);
    return {n,sysSame:JSON.stringify(after.slice(0,225))===before,stamped:three.every(x=>x.updatedAt>=now&&x.daily_reminder_last_sent>=now),lines:three[0].approval_history.filter(h=>h.type==='reminder_sent').length};}),
  expect:{n:3,sysSame:true,stamped:true,lines:7} },

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
      await window.HNX_Cloud.push();await sleep(900);
      const dirty=JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}');
      return {sentCalls:sent.includes(BK),callsDirty:!!dirty[BK],memosDirty:!!dirty[MK],skipped:(window.__hnxPushSkipped||[]).map(x=>x.k),error:String(C.state.error||'')};
    }finally{window.fetch=of;localStorage.removeItem('hnx_cloud_token');}}),
  expect:{sentCalls:true,callsDirty:true,memosDirty:false,skipped:['hydroPro_zz_bigstore_v1'],error:'not stored by the cloud (too big): zz_bigstore_v1 — kept on this computer'} }
];
