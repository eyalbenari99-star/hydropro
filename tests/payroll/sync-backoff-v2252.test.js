/* v22.52 (Eyal, 11 Oct 2026: "Sync · no connection" on every load): when the cloud fails, every computer backs off instead of
   hammering it — no bare /sync/pull fallback, 2 download batches at a time, 20 s → 40 s → 80 s … 5 min + 0-15 s jitter, the pill
   says "· retrying" for the first two failures, 🧪 Test connection never downloads the store, and the merge takes a value sent as
   raw JSON text as well as one sent as parsed JSON (worker 3.7.3 sends the stored text as-is). */
/* One mock cloud for every case, configured through window.__mockCfg (it can be changed while a case runs):
   cloud: {key: raw JSON text}, parsed: {key: value sent parsed}, down: every hnx-sync call fails ('Failed to fetch'),
   healthDown: /health fails too, keysDown: /sync/keys fails, failKey: a keyed /sync/pull asking for that store fails, pullMs: pull delay,
   noToken: start signed out (no cloud token). window.__net.log = every hnx-sync request {t, path}. */
function mockSeed(cfgSrc){
  return new Function(`
    var C=window.__mockCfg=(${cfgSrc});
    if(!C.noToken) localStorage.setItem('hnx_cloud_token','t');
    var N=window.__net={log:[],inflight:0,maxInflight:0,pullNo:0};
    var of=window.fetch;
    window.fetch=function(u,o){ u=String(u);
      if(u.indexOf('hnx-sync')<0) return of.apply(this,arguments);
      var path=u.split('workers.dev')[1]||u; N.log.push({t:Date.now(),path:path});
      var fail=function(){ return Promise.reject(new TypeError('Failed to fetch')); };
      var reply=function(obj,ms,status){ return new Promise(function(res){ setTimeout(function(){ res(new Response(JSON.stringify(obj),{status:status||200})); },ms||0); }); };
      if(path.indexOf('/health')===0) return C.healthDown?fail():reply({status:'ok',version:'3.7.3-nexi'});
      if(path.indexOf('/auth/app-login')===0) return reply({error:'Not Found'},0,404);
      if(C.down) return fail();
      var all=Object.assign({},C.cloud||{}); Object.keys(C.parsed||{}).forEach(function(k){ all[k]=C.parsed[k]; });
      if(path.indexOf('/sync/keys')===0) return C.keysDown?fail():reply({keys:Object.keys(all),count:Object.keys(all).length});
      if(path.indexOf('/sync/pull')===0){
        var q=decodeURIComponent(path.split('?')[1]||''), m=/keys=([^&]*)/.exec(q);
        if(m){ N.pullNo++; if(C.failKey&&m[1].split(',').indexOf(C.failKey)>=0) return fail(); }
        var want=m?m[1].split(','):Object.keys(all), d={};
        want.forEach(function(k){ if(k in all) d[k]=all[k]; });
        N.inflight++; N.maxInflight=Math.max(N.maxInflight,N.inflight);
        return reply({data:d,count:Object.keys(d).length},C.pullMs||0).then(function(r){ N.inflight--; return r; });
      }
      if(path.indexOf('/sync/push')===0){ var ks=[]; try{ ks=Object.keys(JSON.parse(o.body).data||{}); }catch(e){} return reply({ok:true,written:ks.length,keys:ks,skipped:[]}); }
      return reply({ok:true,data:{}});
    };`);
}
const REQ="typeof window.__hnxSyncBackoff==='function'";
const many=(n,prefix)=>`(function(){var c={};for(var i=0;i<${n};i++)c['${prefix}'+String(i).padStart(3,'0')]='[{"id":"'+i+'","t":"\\u20b1 '+i+'"}]';return c;})()`;
module.exports=[
{ name:'☁ v22.52: a download batch that fails is NOT followed by the bare /sync/pull (the ~27 MB "everything" request) — the pull fails, the back-off starts (1st failure → next try in 20–35 s); a failing key list does not fall back either',
  requires:REQ,
  seed:mockSeed(`{cloud:${many(120,'hydroPro_bo_')},failKey:'hydroPro_bo_040'}`), /* batch 2 of 3 always fails */
  run:async()=>{
    for(let i=0;i<40;i++){ if(window.__hnxSyncBackoff().n>=1) break; await sleep(250); }
    const bare=()=>__net.log.filter(x=>/^\/sync\/pull(\?|$)/.test(x.path)&&!/keys=/.test(decodeURIComponent(x.path))).length;
    const b1=window.__hnxSyncBackoff(), keyed=__net.log.filter(x=>/^\/sync\/pull\?/.test(x.path)).length;
    window.__mockCfg.keysDown=true;
    window.__hnxSyncBackoff.expire(); window.__hnxPullStats.lastAt=0; const n0=window.__hnxSyncBackoff().n; window.__hnxTryAutoSync();
    for(let i=0;i<40;i++){ if(window.__hnxSyncBackoff().n>n0) break; await sleep(100); }
    return {bareAfterBatch:bare()===0, keyedTried:keyed>=2, failedOnce:b1.n>=1, firstWaitOk:b1.n!==1||(b1.waitMs>0&&b1.waitMs<=35000), notPulled:!window.__hnxPulledOk,
      err:/Failed to fetch/.test(String(HNX_Cloud.state.error)), keysFailCounted:window.__hnxSyncBackoff().n===n0+1, bareAfterKeys:bare()===0};},
  expect:{bareAfterBatch:true,keyedTried:true,failedOnce:true,firstWaitOk:true,notPulled:true,err:true,keysFailCounted:true,bareAfterKeys:true} },

{ name:'☁ v22.52: the full download runs its 40-key batches 2 at a time (200 stores = 5 batches, never more than 2 in flight) and every store still arrives',
  requires:REQ,
  seed:mockSeed(`{cloud:${many(200,'hydroPro_lane_')},pullMs:400}`),
  run:async()=>{
    for(let i=0;i<80;i++){ if(window.__hnxPulledOk) break; await sleep(250); }
    let n=0; for(let i=0;i<200;i++){ const v=localStorage.getItem('hydroPro_lane_'+String(i).padStart(3,'0')); if(v&&JSON.parse(v)[0].t==='₱ '+i) n++; }
    const firstFull=__net.log.filter(x=>/^\/sync\/pull\?/.test(x.path)).slice(0,5);
    return {pulled:!!window.__hnxPulledOk, maxInFlight:__net.maxInflight, batches:firstFull.length, stores:n};},
  expect:{pulled:true,maxInFlight:2,batches:5,stores:200} },

{ name:'☁ v22.52: back-off after failed sync cycles — 20 s, 40 s, 80 s (+0–15 s jitter each), 5 min cap; nothing is sent while it waits; the pill says "Sync · retrying" (amber) after failures 1 and 2 and "Sync · no connection" from the 3rd; the hover names the cause ("Cloud unreachable — Cloudflare …")',
  requires:REQ,
  seed:mockSeed(`{cloud:{'hydroPro_crm_leads':'[{"id":"L1","company":"Cloud Co","stage":"new","updatedAt":1}]'}}`),
  run:async()=>{
    const pillText=()=>{ const b=document.getElementById('hnx-syncdiag-btn'), s=b&&b.querySelectorAll('span')[1]; return s?s.textContent.trim():'(no pill)'; }; /* the Sync pill label */
    const pillWhen=async(ok,ms)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ if(ok(pillText())) break; await sleep(250); } return pillText(); }; /* it refreshes on a 4 s timer (later while the page is busy) */
    for(let i=0;i<80;i++){ if(window.__hnxPulledOk) break; await sleep(250); }
    /* let any sync already on the wire finish (it was answered before the cloud "went down"), then take the cloud down */
    for(let q=0,i=0;i<80&&q<5;i++){ q=HNX_Cloud.state.syncing?0:q+1; await sleep(200); }
    const bo=window.__hnxSyncBackoff, out={startN:bo().n, steps:[], quiet:null};
    window.__mockCfg.down=true; window.__mockCfg.healthDown=true;
    const base=n=>Math.min(300000,20000*Math.pow(2,n-1));
    for(let k=0;k<5&&bo().n<3;k++){
      bo.expire(); window.__hnxPullStats.lastAt=0; const n0=bo().n; window.__hnxTryAutoSync();
      for(let i=0;i<60;i++){ if(bo().n>n0) break; await sleep(50); }
      const n=bo().n, w=bo().waitMs;
      if(out.quiet===null){ const before=__net.log.length; window.__hnxTryAutoSync(); await sleep(800); out.quiet=(__net.log.length===before); }
      const want=n<3?'Sync · retrying':'Sync · no connection', pill=await pillWhen(p=>p===want,15000), b=document.getElementById('hnx-syncdiag-btn');
      out.steps.push((w>=base(n)-1500&&w<=base(n)+15000&&pill===want)?'ok':{n,w,pill});
      if(n<3&&pill==='Sync · retrying'){ out.sawRetrying=true; out.amber=(b.style.background==='rgb(239, 108, 0)'||b.style.background==='#ef6c00'); }
      if(n>=3){ out.sawNoConn=(pill==='Sync · no connection'); out.cause=/Cloud unreachable — Cloudflare/.test(b.title)&&/Failed to fetch/.test(b.title); }
    }
    out.allOk=out.steps.length>=1&&out.steps.every(s=>s==='ok'); out.reached3=bo().n>=3;
    const d=bo.delay, within=(n,lo,hi)=>{ let a=1e9,z=0; for(let i=0;i<300;i++){ const x=d(n); a=Math.min(a,x); z=Math.max(z,x); } return a>=lo&&z<=hi&&z-a>5000; };
    out.delays=[within(1,20000,35000),within(2,40000,55000),within(3,80000,95000),within(4,160000,175000),within(5,300000,315000),within(9,300000,315000)];
    const steps=out.steps; delete out.steps; out.firstSteps=steps.slice(0,3); return out;},
  expect:{startN:0,quiet:true,allOk:true,reached3:true,sawRetrying:true,amber:true,sawNoConn:true,cause:true,delays:[true,true,true,true,true,true],firstSteps:['ok','ok','ok']} },

{ name:'☁ v22.52: when the cloud answers /health but the download fails, the pill hover and the top banner say "Cloud server overloaded on download"; one good sync clears the back-off and the pill turns green',
  requires:REQ,
  seed:mockSeed(`{cloud:{'hydroPro_crm_leads':'[{"id":"L1"}]'},down:true}`),
  run:async()=>{
    const pillText=()=>{ const b=document.getElementById('hnx-syncdiag-btn'), s=b&&b.querySelectorAll('span')[1]; return s?s.textContent.trim():'(no pill)'; }; /* the Sync pill label */
    const pillWhen=async(ok,ms)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ if(ok(pillText())) break; await sleep(250); } return pillText(); }; /* it refreshes on a 4 s timer (later while the page is busy) */
    for(let i=0;i<60;i++){ if(window.__hnxSyncBackoff().n>=1&&HNX_Cloud.state.reason) break; await sleep(250); }
    await pillWhen(()=>/overloaded on download/.test((document.getElementById('hnx-syncdiag-btn')||{}).title||''),15000);
    const b=document.getElementById('hnx-syncdiag-btn'), ban=document.getElementById('hnx-cloud-fix-banner');
    const out={reason:/overloaded on download/.test(String(HNX_Cloud.state.reason)), hover:!!b&&/overloaded on download/.test(b.title),
      banner:!!ban&&/overloaded on download/.test(ban.textContent)};
    window.__mockCfg.down=false; window.__hnxSyncBackoff.expire(); window.__hnxTryAutoSync();
    for(let i=0;i<60;i++){ if(window.__hnxPulledOk&&window.__hnxSyncBackoff().n===0) break; await sleep(250); }
    out.cleared=window.__hnxSyncBackoff().n===0&&window.__hnxSyncBackoff().waitMs===0&&!HNX_Cloud.state.reason;
    out.pill=await pillWhen(p=>p==='Sync',30000); /* the pill refreshes itself every 4 s (later while the page is busy merging) */
    return out;},
  expect:{reason:true,hover:true,banner:true,cleared:true,pill:'Sync'} },

{ name:'☁ v22.52: 🧪 Test connection asks /health and /sync/keys only — no /sync/pull (the heaviest request there is) — and reports the worker version and the store count',
  requires:REQ,
  seed:mockSeed(`{noToken:true,cloud:{'hydroPro_a':'[1]','hydroPro_b':'[2]','hydroPro_c':'[3]'}}`),
  run:async()=>{
    await sleep(1000); window.__hnxSyncDiagOpen(); await sleep(300);
    const n0=__net.log.length; document.getElementById('hnx-sd-test').click(); await sleep(2500);
    const paths=__net.log.slice(n0).map(x=>x.path.split('?')[0]);
    const log=(document.getElementById('hnx-sd-log')||{}).textContent||'';
    return {health:paths.indexOf('/health')>=0, keys:paths.indexOf('/sync/keys')>=0, noPull:paths.indexOf('/sync/pull')<0,
      ok:/Test OK — sign-in valid, 3 stores in the cloud/.test(log), ver:/worker v3\.7\.3-nexi/.test(log)};},
  expect:{health:true,keys:true,noPull:true,ok:true,ver:true} },

{ name:'☁ v22.52: the download is merged whether the worker sends a store as raw JSON text (3.7.3 keeps it as stored, ₱ included) or as parsed JSON (3.7.0) — both land in this computer exactly',
  requires:REQ,
  seed:mockSeed(`{cloud:{'hydroPro_test_raw_v1':'[{"id":"R1","t":"₱ raw text"}]','hydroPro_test_rawobj_v1':'{"a":{"b":[1,2]},"p":"₱ 1,234.50"}'},parsed:{'hydroPro_test_parsed_v1':[{id:'P1',t:'₱ parsed'}],'hydroPro_test_pobj_v1':{x:1,y:'₱'}}}`),
  run:async()=>{
    for(let i=0;i<80;i++){ if(window.__hnxPulledOk) break; await sleep(250); }
    await sleep(500);
    const g=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return '(bad) '+localStorage.getItem(k); } };
    return {raw:g('hydroPro_test_raw_v1'), rawObj:g('hydroPro_test_rawobj_v1'), parsed:g('hydroPro_test_parsed_v1'), pobj:g('hydroPro_test_pobj_v1'),
      rawExact:localStorage.getItem('hydroPro_test_raw_v1')==='[{"id":"R1","t":"₱ raw text"}]'};},
  expect:{raw:[{id:'R1',t:'₱ raw text'}],rawObj:{a:{b:[1,2]},p:'₱ 1,234.50'},parsed:[{id:'P1',t:'₱ parsed'}],pobj:{x:1,y:'₱'},rawExact:true} },
];
