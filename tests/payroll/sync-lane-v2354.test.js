/* v23.54 CRITICAL LANE (Eyal, 23 Oct 2026, URGENT, second time this month): two memos that Dr Amy had already approved
   (① Jinky 22 Oct → ② Dr Amy 23 Oct 04:03) never reached the accountant's computer and blocked the labour payroll for hours.
   Cause on the APP side: pushAll uploads nothing until ONE full cloud download has finished this session (__hnxPulledOk) — and
   that download (~15 MB) is exactly the request Cloudflare ends when the cloud is overloaded; a failed FULL upload (wantFull) is
   retried as a full upload for ever, so a small, already-decided change never went out as a delta either. The fix is a lane for a
   handful of tiny decision stores (CRITICAL_KEYS): own small requests, key pull → merge → push, only while the full cycle fails.
   Every case below drives REAL computers (Chromium pages of the real index.html / next.html) against a STUB cloud in this file
   (Playwright routes — no real cloud, no credentials): the cloud answers small requests and ends heavy ones, like the real one did.
     · a keyed /sync/pull whose stores add up to more than cfg.maxPull characters → HTTP 500 ("Worker exceeded memory limit")
     · a /sync/push whose body is bigger than cfg.maxPush characters → HTTP 500
     · a bare /sync/pull (no ?keys=) → always HTTP 500
   The first cases FAIL on a page without the lane (that is the defect, reproduced); the others pin the safety rules. Run with
   BOOT_MS=3000 (the cases boot their own computers). cfg.by[who] overrides the cloud's limits for one computer.
   Owner's extra rule (23 Oct, binding): every unsent change keeps retrying by itself, EACH ONE ON ITS OWN, until it is in the cloud —
   a critical store every 45–90 s (3 min after 10 failures in a row, never stops, survives a reload); one failing / oversize store never
   blocks another; the other stores go one by one (smallest first) after a failed batch; the status is shown per store in plain words.
   cfg.failPullKey: a keyed download that asks for that store fails · cfg.failPushKey: an upload that carries that store fails ·
   cfg.pullNoData: a SMALL keyed download (<= 6 stores: the lane's) that asks for that store is answered HTTP 200 with NO "data" member (review hardening;
   the 40-store batches of the full download are left alone so that download keeps failing on the heavy store, as in the incident). */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* the runner’s own page (the real app, signed out) is parked on a blank 404 of the local server: about:blank would make the runner’s init script throw a SecurityError that the runner counts as a page error */
const blank=pg=>pg.goto('http://127.0.0.1:'+(process.env.PORT||'8799')+'/__lane_blank__',{waitUntil:'domcontentloaded'}).catch(()=>{});
const HOST='hnx-sync.eyalbenari99.workers.dev';
const CRIT=['hydroPro_memos','hydroPro_memo_approvers_v1','hydroPro_weekend_approvals_v1','hydroPro_late_approvals_v1','hydroPro_payroll_runs'];
const SUPPORT='hydroPro_optomb';
const HEAVY='hydroPro_heavy_v1';
const iso=min=>new Date(Date.UTC(2026,9,23,4,0,0)+min*60000).toISOString(); /* 23 Oct 2026 04:00Z + min minutes */
const memo=(id,extra)=>Object.assign({id,category:'hr',type:'good',empId:'W1',amount:-100,totalAmount:-100,date:'2026-10-21',title:'Late deduction '+id,reasons:['test'],status:'pending',createdBy:'mea',createdAt:'2026-10-21T01:00:00.000Z',updatedAt:iso(-3000),signatures:{},chain:{round:1,submittedBy:'mea',submittedAt:'2026-10-21T01:05:00.000Z'}},extra||{});
/* stage 'acct' = waiting for ① · 'final' = ① Jinky done, waiting for ② · 'approved' = ① and ② done; at = minutes after 04:00Z of the last decision */
function mk(id,stage,at){
  const m=memo(id,{updatedAt:iso(at)});
  if(stage==='final'||stage==='approved') m.chain.acct={by:'jinky',name:'Jinky Pagtama',at:iso(at-(stage==='approved'?3:0))};
  if(stage==='approved'){ m.chain.final={by:'dramy',name:'Dr Amy Patdu',at:iso(at),side:'amy'}; m.status='approved'; }
  return m;
}
const heavy=()=>JSON.stringify(Array.from({length:1300},(_,i)=>({id:'H'+i,t:'x'.repeat(900),updatedAt:1}))); /* ~1.3 MB: the store the cloud cannot send in one request */
/* a cloud with exactly 120 stores (3 download batches of 40 — so no download batch looks like a lane request) */
function seedCloud(extra){
  const s={}; s[HEAVY]=heavy(); Object.assign(s,extra||{});
  for(let i=0;Object.keys(s).length<120;i++) s['hydroPro_fill_'+String(i).padStart(3,'0')]='[{"id":"f'+i+'","t":'+i+'}]';
  return s;
}
function makeCloud(store,cfg){
  const c={store:Object.assign({},store),cfg:Object.assign({maxPull:300000,maxPush:300000,by:{}},cfg||{}),log:[],t0:Date.now()};
  const CORS={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,OPTIONS'};
  c.of=who=>Object.assign({},c.cfg,c.cfg.by[who]||{});
  c.handle=async(who,route,req)=>{
    const u=new URL(req.url()),cfg=c.of(who),path=u.pathname,rec={who,t:Date.now()-c.t0,m:req.method(),path,keys:null,bytes:0,status:200,body:null};
    c.log.push(rec);
    const J=(o,s)=>{rec.status=s||200;return route.fulfill({status:s||200,contentType:'application/json',headers:CORS,body:JSON.stringify(o)});};
    if(req.method()==='OPTIONS'){rec.status=204;return route.fulfill({status:204,headers:CORS});}
    if(path==='/health')return J({status:'ok',version:'3.7.3-nexi'});
    if(path==='/auth/app-login')return J({error:'Not Found'},404);
    if(cfg.down){rec.status=0;return route.abort('failed');}
    if(path==='/sync/keys'){if(cfg.keysDown)return J({error:'keys unavailable'},500);return J({keys:Object.keys(c.store),count:Object.keys(c.store).length});}
    if(path==='/sync/pull'){
      const ks=u.searchParams.get('keys');
      if(!ks)return J({error:'Worker exceeded resource limits (bare pull)'},500);
      const want=ks.split(',');rec.keys=want;
      if(cfg.failPullKey&&want.indexOf(cfg.failPullKey)>=0)return J({error:'Worker exceeded memory limit'},500);
      if(cfg.pullNoData&&want.length<=6&&want.indexOf(cfg.pullNoData)>=0)return J({ok:true,note:'200 without a data field'}); /* HTTP 200 whose body has no "data" member (a proxy page / a truncated reply) */
      const data={};let n=0;
      want.forEach(k=>{if(k in c.store){data[k]=cfg.parsed?(()=>{try{return JSON.parse(c.store[k]);}catch(e){return c.store[k];}})():c.store[k];n+=String(c.store[k]).length;}});
      rec.bytes=n;
      if(n>cfg.maxPull)return J({error:'Worker exceeded memory limit'},500);
      return J({data,count:Object.keys(data).length});
    }
    if(path==='/sync/push'){
      const body=req.postData()||'';rec.bytes=body.length;let d={};try{d=JSON.parse(body).data||{};}catch(e){}
      const ks=Object.keys(d);rec.keys=ks;rec.body=d;
      if(body.length>cfg.maxPush)return J({error:'Worker exceeded memory limit'},500);
      if(cfg.failPush)return J({error:'Worker exceeded CPU limit'},500);
      if(cfg.failPushKey&&ks.indexOf(cfg.failPushKey)>=0)return J({error:'Worker exceeded CPU limit (one store)'},500);
      ks.forEach(k=>{c.store[k]=typeof d[k]==='string'?d[k]:JSON.stringify(d[k]);});
      return J({ok:true,written:ks.length,unchanged:0,keys:cfg.pushNamesNothing?[]:ks,skipped:[]});
    }
    return J({ok:true,data:{}});
  };
  /* who's requests, by kind. A "lane-shaped" pull asks for critical stores only (≤ 6 keys, all critical or the tombstone map) */
  c.by=(who,f)=>c.log.filter(r=>(!who||r.who===who)&&(!f||f(r)));
  c.pulls=who=>c.by(who,r=>r.path==='/sync/pull'&&r.keys);
  c.small=who=>c.by(who,r=>r.path==='/sync/pull'&&r.keys&&r.keys.length<=6&&r.keys.every(k=>CRIT.indexOf(k)>=0||k===SUPPORT));
  c.pushes=who=>c.by(who,r=>r.path==='/sync/push'&&r.status===200);
  c.pushAttempts=who=>c.by(who,r=>r.path==='/sync/push');
  c.memo=id=>{try{return JSON.parse(c.store.hydroPro_memos).find(m=>m.id===id)||null;}catch(e){return null;}};
  return c;
}
/* one computer = one Chromium context with its own localStorage; every https request goes to the stub cloud, nothing else leaves */
async function computer(pg,cloud,who,user,o){
  o=o||{};
  const browser=pg.context().browser();
  const ctx=await browser.newContext({viewport:{width:1500,height:950},serviceWorkers:'block'});
  await ctx.route(/^https:/,(route,req)=>{const u=new URL(req.url());if(u.host!==HOST)return route.abort();return cloud.handle(who,route,req);});
  const USERS=[{username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true,updatedAt:1},{username:'dramy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true,updatedAt:1},{username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'accounting',active:true,updatedAt:1},{username:'mea',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',active:true,updatedAt:1}];
  await ctx.addInitScript(({user,USERS,ls,clock})=>{
    if(clock){window.__clk=0;const n=Date.now.bind(Date);Date.now=function(){return n()+window.__clk;};
      window.__reqLog=[];const of=window.fetch.bind(window);window.fetch=function(u,o){try{window.__reqLog.push({u:String(u),t:Date.now()});}catch(e){}return of(u,o);};} /* every request with its SIMULATED time */
    if(localStorage.getItem('__sim_seeded'))return;localStorage.setItem('__sim_seeded','1');
    localStorage.setItem('hnx_test_harness','1');localStorage.setItem('hydroPro_users',JSON.stringify(USERS));localStorage.setItem('hnx_first_boot','2026-01-01');
    localStorage.setItem('hnx_memo_final_from','2026-10-10');
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:user,loginAt:Date.now()}));
    localStorage.setItem('hnx_cloud_token','t');
    Object.keys(ls||{}).forEach(k=>localStorage.setItem(k,ls[k]));
  },{user,USERS,ls:o.ls||{},clock:!!o.clock});
  const p=await ctx.newPage();p.on('dialog',d=>d.accept());
  const errs=[];p.on('pageerror',e=>{const s=String(e);if(!/NotSupportedError/.test(s))errs.push(s.slice(0,160));});
  await p.goto('http://127.0.0.1:'+(process.env.PORT||'8799')+'/'+(process.env.NEXI_PAGE||'index.html')+'?cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
  const c={who,ctx,pg:p,errs};
  c.ev=(fn,arg)=>p.evaluate(fn,arg);
  c.pulled=()=>p.evaluate(()=>!!window.__hnxPulledOk).catch(()=>false);
  c.boN=()=>p.evaluate(()=>window.__hnxSyncBackoff?window.__hnxSyncBackoff().n:-1).catch(()=>-1);
  c.ls=k=>p.evaluate(k=>localStorage.getItem(k),k);
  c.memos=async()=>{try{return JSON.parse(await c.ls('hydroPro_memos'))||[];}catch(e){return null;}};
  c.memo=async id=>((await c.memos())||[]).find(m=>m.id===id)||null;
  /* the LIVE unsent set (the persisted copy lags by a 500 ms debounce, longer on a loaded machine); the persisted copy is the fallback */
  c.dirty=()=>p.evaluate(()=>{try{if(window.HNX_Cloud&&window.HNX_Cloud.unsent)return window.HNX_Cloud.unsent().all;return Object.keys(JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}'));}catch(e){return null;}});
  c.dirtyPersisted=()=>p.evaluate(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}'));}catch(e){return null;}});
  c.dirtyLive=()=>p.evaluate(()=>window.__hnxSyncMode?window.__hnxSyncMode().dirty:-1);
  c.set=(k,v)=>p.evaluate(([k,v])=>localStorage.setItem(k,v),[k,v]); /* through the app's hooked setItem: marks the store unsent, like a user's save */
  c.pill=()=>p.evaluate(()=>{const b=document.getElementById('hnx-syncdiag-btn'),s=b&&b.querySelectorAll('span')[1];return s?s.textContent.trim():'(no pill)';}).catch(()=>'(no pill)');
  c.pillBg=()=>p.evaluate(()=>{const b=document.getElementById('hnx-syncdiag-btn');return b?b.style.background:'';}).catch(()=>'');
  return c;
}
async function until(pred,ms,step){const t0=Date.now();step=step||500;for(;;){let v=false;try{v=await pred();}catch(e){v=false;}if(v)return v;if(Date.now()-t0>=ms)return false;await sleep(step);}}
/* a computer whose full download is cut off from its first request: nothing was ever downloaded this session */
const NODL={maxPull:300000,maxPush:300000};
/* a computer that downloaded fine but whose full upload is cut off (the cloud ends the heavy upload) */
const DLOK={maxPull:1e12,maxPush:300000};
const DEBUG=!!process.env.LANE_DEBUG;
const done=out=>{if(DEBUG)console.log('      [debug] '+JSON.stringify(out).slice(0,1800));return out;};
const dirtyOf=keys=>JSON.stringify(keys.reduce((o,k)=>{o[k]=1;return o;},{}));
const lanes=c=>c.ev(()=>window.HNX_Cloud&&window.HNX_Cloud.lane&&window.HNX_Cloud.lane.state?window.HNX_Cloud.lane.state():null);
const pushedKeys=(cloud,who)=>{const s={};cloud.pushes(who).forEach(r=>(r.keys||[]).forEach(k=>{s[k]=1;}));return Object.keys(s).sort();};
module.exports=[
/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 INCIDENT (part 1): the accountant’s computer cannot finish the cloud download (the heavy batch is cut off) — her own ① approval of a memo, decided on this computer, still reaches the cloud within 100 s through the critical lane, and only the critical store is uploaded (the old page: "upload held — the cloud download has not finished yet this session", nothing leaves, for ever)',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','acct',-600),mk('M2','acct',-590)])}),{by:{jinky:NODL}});
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','final',-30),mk('M2','acct',-590)]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    const reached=await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.acct&&m.chain.acct.by==='jinky';},100000,1000);
    const bo=await J.boN(), pulled=await J.pulled();
    const keys=pushedKeys(cloud,'jinky');
    const out={reached:!!reached,neverDownloaded:!pulled,fullCycleFailing:bo>=1,onlyCriticalPushed:keys.length>0&&keys.every(k=>CRIT.indexOf(k)>=0),
      noHeavyPush:!cloud.by('jinky',r=>r.path==='/sync/push'&&(r.keys||[]).indexOf(HEAVY)>=0).length,
      otherMemoKept:!!(cloud.memo('M2')&&cloud.memo('M2').chain&&!cloud.memo('M2').chain.acct),
      noBarePull:!cloud.by('jinky',r=>r.path==='/sync/pull'&&!r.keys).length,
      pageErrors:J.errs.length};
    await J.ctx.close();return done(out);},
  expect:{'drive.reached':true,'drive.neverDownloaded':true,'drive.fullCycleFailing':true,'drive.onlyCriticalPushed':true,'drive.noHeavyPush':true,'drive.otherMemoKept':true,'drive.noBarePull':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 INCIDENT (part 2, the replay): Dr Amy’s computer downloaded fine but her FULL upload is cut off (wantFull retries the full upload for ever) — her ② approval of Garcia’s memo reaches the cloud within 100 s as a small upload; the accountant’s computer (full download cut off) then receives it within 140 s, so the memo shows approved there and the payroll is unblocked',
  drive:async pg=>{
    await blank(pg);
    const base=JSON.stringify([mk('M1','final',-600),mk('M2','approved',-590)]);
    const cloud=makeCloud(seedCloud({hydroPro_memos:base}),{by:{dramy:DLOK,jinky:NODL}});
    const A=await computer(pg,cloud,'dramy','dramy',{ls:{hydroPro_memos:base}});
    const B=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:base}});
    const ready=await until(async()=>(await A.pulled())&&(await B.boN())>=1,150000,1000); /* A downloaded; B’s download failed at least once */
    await sleep(6000);
    await A.ev(()=>{window.__hnxLastFullPush=0;}); /* 30 minutes since the last full upload: the next upload is a FULL one */
    const t0=cloud.log.length;
    await A.set('hydroPro_memos',JSON.stringify([mk('M1','approved',1),mk('M2','approved',-590)])); /* Dr Amy gives ② */
    const reachedCloud=await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final&&m.chain.final.by==='dramy';},100000,1000);
    const aPushed=cloud.by('dramy',r=>r.path==='/sync/push').slice(0);
    const fullAttemptsFailed=aPushed.filter(r=>r.status===500&&r.bytes>300000).length;
    const bReceived=await until(async()=>{const m=await B.memo('M1');return m&&m.chain&&m.chain.final&&m.chain.final.by==='dramy';},140000,1000);
    const bm=await B.memo('M1');
    const out={ready:!!ready,reachedCloud:!!reachedCloud,fullUploadWasFailing:fullAttemptsFailed>=1,smallUploadsOk:cloud.pushes('dramy').length>=1&&cloud.pushes('dramy').every(r=>r.bytes<300000),
      bReceived:!!bReceived,bStillNotDownloaded:!(await B.pulled()),bMemoApproved:!!(bm&&bm.status==='approved'),bOtherMemoIntact:!!(await B.memo('M2')),
      pageErrors:A.errs.length+B.errs.length};
    await A.ctx.close();await B.ctx.close();return done(out);},
  expect:{'drive.ready':true,'drive.reachedCloud':true,'drive.fullUploadWasFailing':true,'drive.smallUploadsOk':true,'drive.bReceived':true,'drive.bStillNotDownloaded':true,'drive.bMemoApproved':true,'drive.bOtherMemoIntact':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 merge before push: the cloud copy is downloaded and MERGED into the local copy in the same attempt, so a memo another computer saved meanwhile is kept, never overwritten — M1 ② (here, newer) wins, M2 (only in the cloud, approved elsewhere) is added here and kept in the cloud, M3 (only here) is added, M4 keeps ① from the cloud and ② from here, and M9 (deleted elsewhere: tombstone) is not brought back to the cloud',
  drive:async pg=>{
    await blank(pg);
    const tomb={hydroPro_memos:{M9:Date.parse(iso(10))}};
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600),mk('M2','approved',50),mk('M4','final',500)]),[SUPPORT]:JSON.stringify(tomb)}),{by:{dramy:NODL},parsed:true});
    const local=[mk('M1','approved',100),mk('M3','acct',-100),mk('M9','acct',-700)];
    const m4=mk('M4','approved',600);local.push(m4);
    const X=await computer(pg,cloud,'dramy','dramy',{ls:{hydroPro_memos:JSON.stringify(local),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    const reached=await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},100000,1000);
    await sleep(1500);
    const cm=id=>cloud.memo(id),lm=await X.memos();
    const out={reached:!!reached,
      m1Final:!!(cm('M1')&&cm('M1').chain.final&&cm('M1').chain.final.by==='dramy'),
      m2KeptInCloud:!!(cm('M2')&&cm('M2').chain.final),
      m3AddedToCloud:!!cm('M3'),
      m4BothSteps:!!(cm('M4')&&cm('M4').chain.acct&&cm('M4').chain.acct.by==='jinky'&&cm('M4').chain.final&&cm('M4').chain.final.by==='dramy'),
      m9NotRevived:!cm('M9'),
      localHasM2:!!(lm&&lm.some(m=>m.id==='M2'&&m.chain.final)),localLostM9:!!(lm&&!lm.some(m=>m.id==='M9')),
      cloudCount:JSON.parse(cloud.store.hydroPro_memos).length,
      keyPullBeforePush:(()=>{const i=cloud.log.findIndex(r=>r.who==='dramy'&&r.path==='/sync/push'&&r.status===200&&(r.keys||[]).indexOf('hydroPro_memos')>=0);
        return i>0&&cloud.log.slice(0,i).some(r=>r.who==='dramy'&&r.path==='/sync/pull'&&r.keys&&r.keys.indexOf('hydroPro_memos')>=0&&r.status===200);})(),
      pageErrors:X.errs.length};
    await X.ctx.close();return done(out);},
  expect:{'drive.reached':true,'drive.m1Final':true,'drive.m2KeptInCloud':true,'drive.m3AddedToCloud':true,'drive.m4BothSteps':true,'drive.m9NotRevived':true,'drive.localHasM2':true,'drive.localLostM9':true,'drive.cloudCount':4,'drive.keyPullBeforePush':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 never overwrite a cloud copy that was not just merged: (A) the key download of memos fails → memos are NOT uploaded and stay unsent, while the weekend approvals beside them (their own download works) are merged and go out; (B) the cloud copy of memos is not valid JSON → memos are still NOT uploaded (a new weekend row beside them is); (C) an empty local store is never uploaded',
  drive:async pg=>{
    await blank(pg);
    const WK0='{"2026-10-18|E1":{"acct":"ok","acctAt":1},"2026-10-20|E9":{"acct":"ok","acctAt":5}}'; /* the cloud holds E1 and a row E9 this computer has not seen */
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)]),hydroPro_weekend_approvals_v1:WK0}),{by:{jinky:NODL},failPullKey:'hydroPro_memos'});
    const WK='{"2026-10-18|E1":{"acct":"ok","acctAt":1},"2026-10-25|E2":{"final":"ok","finalAt":99}}';
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hydroPro_weekend_approvals_v1:WK,hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos','hydroPro_weekend_approvals_v1'])}});
    const out={};
    const memoPushes=()=>cloud.pushAttempts('jinky').filter(r=>(r.keys||[]).indexOf('hydroPro_memos')>=0).length;
    /* A: every keyed download that asks for memos fails */
    out.A_weekendGoes=!!(await until(()=>/2026-10-25\|E2/.test(cloud.store.hydroPro_weekend_approvals_v1),100000,1000));
    await sleep(45000);
    out.A_pullsTried=cloud.small('jinky').filter(r=>r.keys.indexOf('hydroPro_memos')>=0).length>=1; /* the lane did try … */
    out.A_memoPushes=memoPushes(); /* … and uploaded nothing for memos */
    out.A_cloudMemoUntouched=JSON.stringify(cloud.memo('M1').chain)===JSON.stringify(mk('M1','final',-600).chain);
    out.A_weekendMerged=/2026-10-20\|E9/.test(cloud.store.hydroPro_weekend_approvals_v1)&&/2026-10-25\|E2/.test(cloud.store.hydroPro_weekend_approvals_v1)&&/2026-10-18\|E1/.test(cloud.store.hydroPro_weekend_approvals_v1); /* the cloud’s own row E9 survived: merged, not overwritten */
    out.A_localHasE9=/2026-10-20\|E9/.test(await J.ls('hydroPro_weekend_approvals_v1'));
    out.A_stillUnsent=((await J.dirty())||[]).indexOf('hydroPro_memos')>=0;
    /* B: the download works, but the cloud copy of memos is garbage */
    cloud.cfg.failPullKey=null;cloud.store.hydroPro_memos='{"oops": [ not json';
    await J.set('hydroPro_weekend_approvals_v1',WK.replace('}}','},"2026-11-01|E3":{"acct":"ok","acctAt":7}}')); /* a new row, unsent */
    await J.ev(()=>{if(window.HNX_Cloud&&window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();});
    out.B_weekendPushed=await until(()=>/2026-11-01\|E3/.test(cloud.store.hydroPro_weekend_approvals_v1),90000,1000);
    await sleep(3000);
    out.B_memosNotPushed=memoPushes()===0;
    out.B_cloudMemoUntouched=cloud.store.hydroPro_memos==='{"oops": [ not json';
    out.B_localMemoKept=!!(await J.memo('M1'))&&(await J.memo('M1')).chain.final&&(await J.memo('M1')).chain.final.by==='dramy';
    out.B_memosStillUnsent=((await J.dirty())||[]).indexOf('hydroPro_memos')>=0;
    out.B_status=(await lanes(J)).keys.hydroPro_memos.state; /* shown to the person as waiting, with the reason */
    /* C: no push body ever carried an empty value */
    out.C_noEmptyValue=cloud.pushAttempts('jinky').every(r=>Object.keys(r.body||{}).every(k=>{const t=String(r.body[k]).replace(/\s/g,'');return t!==''&&t!=='[]'&&t!=='{}'&&t!=='null';}));
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.A_weekendGoes':true,'drive.A_pullsTried':true,'drive.A_memoPushes':0,'drive.A_cloudMemoUntouched':true,'drive.A_weekendMerged':true,'drive.A_localHasE9':true,'drive.A_stillUnsent':true,'drive.B_weekendPushed':true,'drive.B_memosNotPushed':true,'drive.B_cloudMemoUntouched':true,'drive.B_localMemoKept':true,'drive.B_memosStillUnsent':true,'drive.B_status':'waiting','drive.C_noEmptyValue':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 hard size cap: a critical store bigger than 700 KB on this computer is not lane-eligible (no key download, no upload for it) while the small memo store beside it goes out; the same store shrunk below the cap is eligible. Sizes measured with the seeded data (300 memos, one 60-line payroll run, a year of 52 runs) are in the result',
  drive:async pg=>{
    await blank(pg);
    const run=i=>({id:'RUN'+i,periodStart:'2026-01-'+String(i%28+1).padStart(2,'0'),status:'approved',updatedAt:1000+i,lines:Array.from({length:60},(_,j)=>({empId:'E'+j,name:'Worker '+j,basic:658*6,ot:j*3,sss:581.3,phic:300,hdmf:100,net:3500+j,note:'x'.repeat(500)}))});
    const small=[run(1)],big=Array.from({length:30},(_,i)=>run(i));
    const sizes={memos300:JSON.stringify(Array.from({length:300},(_,i)=>mk('S'+i,'approved',i))).length,oneRun:JSON.stringify(small).length,year52:JSON.stringify(Array.from({length:52},(_,i)=>run(i))).length,big:JSON.stringify(big).length};
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)])}),{by:{jinky:NODL}});
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hydroPro_payroll_runs:JSON.stringify(big),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos','hydroPro_payroll_runs'])}});
    const out={sizes:{memos300KB:Math.round(sizes.memos300/1024),oneRunKB:Math.round(sizes.oneRun/1024),year52KB:Math.round(sizes.year52/1024),bigKB:Math.round(sizes.big/1024)}};
    out.memoReached=!!(await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},100000,1000));
    /* measured with the REAL engine: the size of one payroll line (what a frozen run is made of) → what a run / a year weigh in the store */
    out.engineLineBytes=await J.ev(()=>{try{const e={id:'L1',name:'JO SANTOS',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'};
      return JSON.stringify(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly')).length;}catch(x){return -1;}});
    out.sizes.engineRun60KB=Math.round(out.engineLineBytes*60/1024); out.sizes.engineWeeklyYear60KB=Math.round(out.engineLineBytes*60*52/1024);
    await sleep(4000);
    const asks=k=>cloud.by('jinky',r=>(r.path==='/sync/pull'&&r.keys&&r.keys.indexOf(k)>=0)||(r.path==='/sync/push'&&(r.keys||[]).indexOf(k)>=0)).length;
    out.bigNotRequested=asks('hydroPro_payroll_runs')===0;
    out.bigNotInCloud=!cloud.store.hydroPro_payroll_runs;
    out.bigStillUnsent=((await J.dirty())||[]).indexOf('hydroPro_payroll_runs')>=0;
    await J.set('hydroPro_payroll_runs',JSON.stringify(small)); /* shrunk below the cap → eligible */
    await J.ev(()=>{if(window.HNX_Cloud&&window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();});
    out.smallReached=await until(()=>cloud.store.hydroPro_payroll_runs&&JSON.parse(cloud.store.hydroPro_payroll_runs).length===1,90000,1000);
    out.capKB=await J.ev(()=>window.HNX_Cloud&&window.HNX_Cloud.lane?Math.round(window.HNX_Cloud.lane.maxChars/1024):null);
    out.pageErrors=J.errs.length;
    await J.ctx.close();
    out.sizes.sizeOk=sizes.memos300<716800&&sizes.oneRun<716800&&sizes.year52>716800&&sizes.big>716800;
    out.engineLineOk=out.engineLineBytes>200; /* the engine produced a real line (informational: the numbers above are what justifies the cap) */
    return done(out);},
  expect:{'drive.memoReached':true,'drive.bigNotRequested':true,'drive.bigNotInCloud':true,'drive.bigStillUnsent':true,'drive.smallReached':true,'drive.capKB':700,'drive.sizes.sizeOk':true,'drive.engineLineOk':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 a healthy cloud adds ZERO requests: with the cloud answering everything, an approval is uploaded by the normal cycle exactly as before — no lane-shaped download, no tombstone download, no back-off, lane counters 0 (the same case on the page without the lane gives the same request list; LANE_DEBUG=1 prints it)',
  drive:async pg=>{
    await blank(pg);
    const base=JSON.stringify([mk('M1','final',-600)]);
    const cloud=makeCloud(seedCloud({hydroPro_memos:base}),{maxPull:1e12,maxPush:1e12});
    const A=await computer(pg,cloud,'dramy','dramy',{ls:{hydroPro_memos:base}});
    const ready=await until(async()=>(await A.pulled()),150000,1000);
    await sleep(25000); /* the boot seeders’ own uploads and the first cycles settle */
    const n0=cloud.log.length;
    await A.set('hydroPro_memos',JSON.stringify([mk('M1','approved',1)]));
    const reached=await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},60000,500);
    await sleep(50000); /* two more 20-second cycles */
    const w=cloud.log.slice(n0).filter(r=>r.who==='dramy'&&r.path!=='/health');
    const bo=await A.boN(), ln=await lanes(A);
    const out={ready:!!ready,reached:!!reached,failures:w.filter(r=>r.status>=400).length,
      laneShapedPulls:w.filter(r=>r.path==='/sync/pull'&&r.keys&&r.keys.length>=2&&r.keys.length<=6&&r.keys.every(k=>CRIT.indexOf(k)>=0||k===SUPPORT)).length,
      tombstonePulls:w.filter(r=>r.path==='/sync/pull'&&r.keys&&r.keys.length<=6&&r.keys.indexOf(SUPPORT)>=0).length,
      memoUploads:w.filter(r=>r.path==='/sync/push'&&(r.keys||[]).indexOf('hydroPro_memos')>=0).length,
      memoUploadsSane:(()=>{const n=w.filter(r=>r.path==='/sync/push'&&(r.keys||[]).indexOf('hydroPro_memos')>=0).length;return n>=1&&n<=2;})(),
      keyedMemoPulls:w.filter(r=>r.path==='/sync/pull'&&r.keys&&r.keys.length===1&&r.keys[0]==='hydroPro_memos').length,
      backoff:bo,laneAttempts:ln?ln.attempts:0,pageErrors:A.errs.length};
    if(DEBUG)out.requests=w.map(r=>r.m+' '+r.path+(r.keys?'?keys='+(r.keys.length>3?r.keys.length+' keys':r.keys.join(',')):'')+' '+r.status).slice(0,40);
    await A.ctx.close();return done(out);},
  expect:{'drive.ready':true,'drive.reached':true,'drive.failures':0,'drive.laneShapedPulls':0,'drive.tombstonePulls':0,'drive.memoUploadsSane':true,'drive.backoff':0,'drive.laneAttempts':0,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 retry cadence in simulated time (owner’s rule): an unsent critical store retries every 45–90 s while the cloud keeps failing (never two attempts inside 45 s, 3–7 in the first 5 simulated minutes), after 10 failed attempts in a row every 3 minutes — and it never stops (12+ attempts in 30 simulated minutes); the receive-only download of the other critical stores happens at most once a minute',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)])}),{by:{jinky:NODL},failPullKey:'hydroPro_memos'}); /* every download that asks for memos fails: the lane’s own request keeps failing */
    const J=await computer(pg,cloud,'jinky','jinky',{clock:true,ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    const tries=async()=>{const l=await lanes(J);return l&&l.keys&&l.keys.hydroPro_memos?l.keys.hydroPro_memos.tries:0;};
    await until(async()=>(await tries())>=1,90000,500); /* the first attempt happens in real time soon after the first failed full cycle */
    for(let i=1;i<=130;i++){ /* 130 × 15 s = 32.5 simulated minutes; the page logs every request with its simulated time */
      await J.ev(()=>{window.__clk+=15000;window.HNX_Cloud.lane.tick();});
      await sleep(330);
    }
    await sleep(1500);
    const st0=await lanes(J); /* the lane’s own pass log (simulated time): other screens of the app also ask the cloud for stores now and then — those are not lane passes */
    const memoT=st0.log.filter(x=>!x.recv&&x.keys.indexOf('hydroPro_memos')>=0).map(x=>x.t), recvT=st0.log.filter(x=>x.recv).map(x=>x.t);
    const sec=a=>a.map(t=>Math.round((t-a[0])/1000)), gaps=a=>a.slice(1).map((t,i)=>Math.round((t-a[i])/1000));
    const g=gaps(memoT), gr=gaps(recvT);
    const out={memoAttemptsAtSec:sec(memoT),memoGaps:g,recvGaps:gr};
    out.first5min=memoT.filter(t=>t-memoT[0]<=300000).length;
    out.first5minOk=out.first5min>=3&&out.first5min<=7;
    out.first9GapsOk=g.length>=9&&g.slice(0,9).every(x=>x>=45&&x<=110); /* 45–90 s (+ one 15 s step of the test clock) */
    out.after10GapsOk=g.slice(9).length>=1&&g.slice(9).every(x=>x>=180&&x<=235); /* 3 min (+ jitter ≤ 30 s, + one step) */
    out.neverStops=memoT.length>=12;
    out.recvAtMostPerMinute=gr.length>=3&&gr.every(x=>x>=60);
    out.stillUnsent=((await J.dirty())||[]).indexOf('hydroPro_memos')>=0;
    out.noPushWithoutMerge=cloud.pushAttempts('jinky').every(r=>(r.keys||[]).indexOf('hydroPro_memos')<0);
    const st=await lanes(J);
    out.failsCounted=!!(st&&st.keys.hydroPro_memos&&st.keys.hydroPro_memos.fails>=10);
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.first5minOk':true,'drive.first9GapsOk':true,'drive.after10GapsOk':true,'drive.neverStops':true,'drive.recvAtMostPerMinute':true,'drive.stillUnsent':true,'drive.noPushWithoutMerge':true,'drive.failsCounted':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 stops retrying once it is stored: when the cloud answers again the unsent critical store goes out on its next attempt, its unsent flag clears, and from then on there is NO further upload for it (only the quiet receive-only downloads) — the retry timer is not a loop',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)])}),{by:{jinky:NODL},failPullKey:'hydroPro_memos'});
    const J=await computer(pg,cloud,'jinky','jinky',{clock:true,ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    for(let i=0;i<14;i++){ const l=await lanes(J); if(l&&l.keys.hydroPro_memos&&l.keys.hydroPro_memos.tries>=2)break; await J.ev(()=>{window.__clk+=60000;window.HNX_Cloud.lane.tick();}); await sleep(900); }
    cloud.cfg.failPullKey=null; /* the cloud answers again */
    for(let i=1;i<=12&&!(cloud.memo('M1')&&cloud.memo('M1').chain.final);i++){ await J.ev(()=>{window.__clk+=15000;window.HNX_Cloud.lane.tick();}); await sleep(500); }
    const out={reached:!!(cloud.memo('M1')&&cloud.memo('M1').chain.final)};
    await sleep(1500);
    out.flagCleared=((await J.dirty())||[]).indexOf('hydroPro_memos')<0;
    const n0=cloud.pushAttempts('jinky').length, p0=cloud.log.filter(r=>r.who==='jinky'&&r.path==='/sync/pull'&&r.keys&&r.keys.indexOf('hydroPro_memos')>=0).length;
    for(let i=1;i<=24;i++){ await J.ev(()=>{window.__clk+=15000;window.HNX_Cloud.lane.tick();}); await sleep(300); } /* 6 more simulated minutes */
    out.noMoreUploads=cloud.pushAttempts('jinky').length===n0;
    out.noMoreUnsentPulls=cloud.log.filter(r=>r.who==='jinky'&&r.path==='/sync/pull'&&r.keys&&r.keys.indexOf('hydroPro_memos')>=0).length-p0<=7; /* receive-only: at most one a minute */
    out.status=(await J.ev(()=>window.HNX_Cloud.keyStatus()));
    out.statusSaved=/Memos: saved/.test(out.status);
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.reached':true,'drive.flagCleared':true,'drive.noMoreUploads':true,'drive.noMoreUnsentPulls':true,'drive.statusSaved':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 the retry survives a page reload: the unsent set and the "unsent since" time are persisted, the reloaded page restarts the lane’s timer by itself and the approval goes out with no click — and the banner clock did not restart',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)])}),{by:{jinky:NODL},failPullKey:'hydroPro_memos'});
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    await until(async()=>{const l=await lanes(J);return l&&l.keys.hydroPro_memos&&l.keys.hydroPro_memos.tries>=1;},90000,500);
    await J.ev(()=>{window.__hnxDirtySince.hydroPro_memos=Date.now()-25*60000;}); /* it has been unsent for 25 minutes */
    const since0=await J.ev(()=>window.__hnxDirtySince.hydroPro_memos);
    await J.set('hydroPro_calls','[{"id":"C9","t":"touch"}]'); /* any save persists both maps (debounce 500 ms) */
    /* wait until the persisted maps really carry the 25-minute-old time (the save is debounced 500 ms, slower on a loaded machine) */
    await until(async()=>{try{const m=JSON.parse(await J.ls('hnxlocal_dirty_since_v1')||'{}');return Math.abs((m.hydroPro_memos||0)-since0)<2000;}catch(e){return false;}},30000,500);
    const out={persistedSince:!!(await J.ls('hnxlocal_dirty_since_v1'))};
    await J.pg.reload({waitUntil:'domcontentloaded',timeout:120000});
    await sleep(4000);
    out.dirtyAfterReload=((await J.dirty())||[]).indexOf('hydroPro_memos')>=0;
    const since1=await J.ev(()=>window.__hnxDirtySince?window.__hnxDirtySince.hydroPro_memos:0);
    out.sinceKept=Math.abs(since1-since0)<2000;
    cloud.cfg.failPullKey=null; /* the cloud copy can be downloaded again — nobody clicks anything */
    out.reachedAfterReload=!!(await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final&&m.chain.final.by==='dramy';},120000,1000));
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.persistedSince':true,'drive.dirtyAfterReload':true,'drive.sinceKept':true,'drive.reachedAfterReload':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 each critical store on its own: a memo store whose download keeps failing, a payroll-run store whose CLOUD copy is too big for the cloud to send, and a healthy weekend-approval store are all unsent at once — the weekend approvals go out within 100 s and the memos/payroll stay unsent with their own attempt counters; no upload ever carries the failing ones',
  drive:async pg=>{
    await blank(pg);
    const bigRuns=JSON.stringify(Array.from({length:700},(_,i)=>({id:'R'+i,periodStart:'2025-01-01',status:'approved',updatedAt:1000+i,note:'x'.repeat(1000)}))); /* ~700 KB in the cloud … */
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)]),hydroPro_weekend_approvals_v1:'{"2026-10-18|E1":{"acct":"ok","acctAt":1}}',hydroPro_payroll_runs:bigRuns}),{by:{jinky:{maxPull:300000,maxPush:300000}},failPullKey:'hydroPro_memos'});
    cloud.cfg.maxPull=300000; /* … more than the cloud can send in one request: the keyed download of payroll runs fails by itself */
    const WK='{"2026-10-18|E1":{"acct":"ok","acctAt":1},"2026-10-25|E2":{"final":"ok","finalAt":99}}';
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hydroPro_weekend_approvals_v1:WK,hydroPro_payroll_runs:JSON.stringify([{id:'R_local',periodStart:'2026-10-19',status:'approved',updatedAt:5}]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos','hydroPro_weekend_approvals_v1','hydroPro_payroll_runs'])}});
    const out={};
    out.weekendWent=!!(await until(()=>/2026-10-25\|E2/.test(cloud.store.hydroPro_weekend_approvals_v1),100000,1000));
    await until(async()=>{const l=await lanes(J);return l&&l.keys.hydroPro_memos&&l.keys.hydroPro_memos.tries>=1&&l.keys.hydroPro_payroll_runs&&l.keys.hydroPro_payroll_runs.tries>=1;},60000,500);
    await sleep(2000);
    const l=await lanes(J), d=(await J.dirty())||[];
    out.memosKeepTrying=!!(l.keys.hydroPro_memos&&l.keys.hydroPro_memos.tries>=1&&l.keys.hydroPro_memos.state!=='saved');
    out.payrollKeepsTrying=!!(l.keys.hydroPro_payroll_runs&&l.keys.hydroPro_payroll_runs.tries>=1&&l.keys.hydroPro_payroll_runs.state!=='saved');
    out.weekendSaved=!!(l.keys.hydroPro_weekend_approvals_v1&&l.keys.hydroPro_weekend_approvals_v1.state==='saved');
    out.stillUnsent=d.indexOf('hydroPro_memos')>=0&&d.indexOf('hydroPro_payroll_runs')>=0; /* (the weekend screen re-saves its merged rows → it may be unsent AGAIN; its state above is what counts) */
    out.neverUploadedFailing=cloud.pushAttempts('jinky').every(r=>(r.keys||[]).indexOf('hydroPro_memos')<0&&(r.keys||[]).indexOf('hydroPro_payroll_runs')<0);
    out.cloudMemoUntouched=!(cloud.memo('M1').chain.final);
    out.statusLine=await J.ev(()=>window.HNX_Cloud.keyStatus());
    out.dbg={dirty:d,keys:l.keys};
    out.statusSaysAll=/Memos: sending… attempt \d+/.test(out.statusLine)&&/Payroll runs: sending… attempt \d+/.test(out.statusLine)&&out.weekendSaved;
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.weekendWent':true,'drive.memosKeepTrying':true,'drive.payrollKeepsTrying':true,'drive.weekendSaved':true,'drive.stillUnsent':true,'drive.neverUploadedFailing':true,'drive.cloudMemoUntouched':true,'drive.statusSaysAll':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 every other store goes one by one after a failed batch (smallest first, each with its own bookkeeping): a batch of three unsent stores fails because one of them is poison → the next pass uploads the two good ones as single uploads (smallest first) while the poison one keeps its own attempt counter; once the poison clears it goes out too and nothing more is sent',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({}),{maxPull:1e12,maxPush:1e12,failPushKey:'hydroPro_xpoison_v1'});
    const A=await computer(pg,cloud,'dramy','dramy',{ls:{}});
    await until(async()=>(await A.pulled()),150000,1000);
    await sleep(25000); /* boot seeders settle */
    const t0=cloud.log.length;
    const XA='[{"id":"a1","t":1}]', XB=JSON.stringify([{id:'b1',t:'x'.repeat(1500)}]), XP=JSON.stringify([{id:'p1',t:'y'.repeat(600)}]);
    await A.set('hydroPro_xpoison_v1',XP); await A.set('hydroPro_xb_v1',XB); await A.set('hydroPro_xa_v1',XA);
    await until(()=>cloud.log.slice(t0).some(r=>r.who==='dramy'&&r.path==='/sync/push'&&r.status===500),60000,500); /* the batch fails */
    const out={batchFailed:cloud.log.slice(t0).some(r=>r.who==='dramy'&&r.path==='/sync/push'&&r.status===500&&(r.keys||[]).length>=3)};
    const kick=()=>A.ev(()=>{window.__hnxSyncBackoff.expire();window.__hnxTryAutoSync();});
    for(let i=0;i<8&&!(cloud.store.hydroPro_xa_v1&&cloud.store.hydroPro_xb_v1);i++){ await kick(); await sleep(6000); }
    out.goodOnesWent=!!(cloud.store.hydroPro_xa_v1&&cloud.store.hydroPro_xb_v1);
    out.poisonNotInCloud=!cloud.store.hydroPro_xpoison_v1;
    const singles=cloud.log.slice(t0).filter(r=>r.who==='dramy'&&r.path==='/sync/push'&&r.status===200&&((r.keys||[]).indexOf('hydroPro_xa_v1')>=0||(r.keys||[]).indexOf('hydroPro_xb_v1')>=0));
    out.sentOneByOne=singles.length>=2&&singles.every(r=>r.keys.length===1);
    out.smallestFirst=(()=>{const ia=singles.findIndex(r=>r.keys[0]==='hydroPro_xa_v1'),ib=singles.findIndex(r=>r.keys[0]==='hydroPro_xb_v1');return ia>=0&&ib>=0&&ia<ib;})();
    const st=await lanes(A), d=(await A.dirty())||[];
    out.poisonOwnCounter=!!(st.keys.hydroPro_xpoison_v1&&st.keys.hydroPro_xpoison_v1.tries>=1&&st.keys.hydroPro_xpoison_v1.state==='retry');
    out.goodOnesSaved=d.indexOf('hydroPro_xa_v1')<0&&d.indexOf('hydroPro_xb_v1')<0&&d.indexOf('hydroPro_xpoison_v1')>=0;
    out.statusLine=await A.ev(()=>window.HNX_Cloud.keyStatus());
    out.statusSays=/Xpoison: sending… attempt \d+/.test(out.statusLine)&&st.keys.hydroPro_xa_v1&&st.keys.hydroPro_xa_v1.state==='saved';
    cloud.cfg.failPushKey=null; /* the poison clears */
    for(let i=0;i<8&&!cloud.store.hydroPro_xpoison_v1;i++){ await A.ev(()=>{window.HNX_Cloud.lane.expire();window.__hnxSyncBackoff.expire();window.__hnxTryAutoSync();}); await sleep(6000); }
    out.poisonWentToo=!!cloud.store.hydroPro_xpoison_v1;
    await sleep(2500);
    const n1=cloud.log.length;
    for(let i=0;i<3;i++){ await kick(); await sleep(4000); }
    out.stopsWhenStored=cloud.log.slice(n1).filter(r=>r.who==='dramy'&&r.path==='/sync/push'&&Object.keys(r.body||{}).some(k=>/hydroPro_x(a|b|poison)_v1/.test(k))).length===0;
    out.pageErrors=A.errs.length;
    await A.ctx.close();return done(out);},
  expect:{'drive.batchFailed':true,'drive.goodOnesWent':true,'drive.poisonNotInCloud':true,'drive.sentOneByOne':true,'drive.smallestFirst':true,'drive.poisonOwnCounter':true,'drive.goodOnesSaved':true,'drive.statusSays':true,'drive.poisonWentToo':true,'drive.stopsWhenStored':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 visibility: while the lane is the only thing working the pill says "Sync · partial — approvals & memos are saving, full sync retrying" (amber); changes unsent for 20 minutes raise ONE non-blocking banner "⚠ N change(s) on this computer have not reached the cloud since HH:MM — other computers cannot see them" naming them in plain words (not at 19 minutes; not for what the lane already sent; dismissed once → stays away; gone after a good push), and the Cloud Sync Diagnostic shows the same line',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)])}),{by:{jinky:NODL}});
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hydroPro_phone_calls_v1:'[{"id":"C1","t":"call"}]',hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos','hydroPro_phone_calls_v1'])}});
    const out={};
    out.memoSent=!!(await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},100000,1000));
    out.pillPartial=!!(await until(async()=>(await J.pill())==='Sync · partial — approvals & memos are saving, full sync retrying',60000,1000));
    out.pillText=await J.pill();out.pillAmber=/239, ?108, ?0|#ef6c00/.test(await J.pillBg());
    out.pillHover=await J.ev(()=>{const b=document.getElementById('hnx-syncdiag-btn');return /Partial sync/.test(b.title)&&/Sync error/.test(b.title);});
    const bn=()=>J.ev(()=>{const e=document.getElementById('hnx-unsent-banner');return e?e.textContent:null;});
    /* only the calls store is made "min minutes old"; everything else the app wrote at boot counts as unsent just now */
    const ageIt=min=>J.ev(m=>{const s=window.__hnxDirtySince;Object.keys(s).forEach(k=>{s[k]=Date.now();});s.hydroPro_phone_calls_v1=Date.now()-m*60000;if(window.HNX_Cloud&&window.HNX_Cloud.unsentCheck)window.HNX_Cloud.unsentCheck();},min);
    const unsentNow=await J.dirty();
    out.callsUnsent=(unsentNow||[]).indexOf('hydroPro_phone_calls_v1')>=0; /* the memos went out (above); this one cannot — the full upload is cut off. (the memo screen may re-save its merged rows, so memos can be unsent AGAIN — that is not what is judged here) */
    await ageIt(19);await sleep(800);out.none19=(await bn())===null;
    await ageIt(21);await sleep(800);
    const text=await bn();out.banner21=!!text;out.bannerText=text;
    const parts=await J.ev(()=>{const e=document.getElementById('hnx-unsent-banner');return e?{t:e.querySelector('.u-t').textContent,d:e.querySelector('.u-d').textContent,s:e.querySelector('.u-s').textContent}:null;});
    out.bannerSays=!!text&&/⚠ 1 change on this computer has not reached the cloud since \d\d:\d\d — other computers cannot see it\./.test(text.replace(/\s+/g,' '))&&/calls/i.test(text)&&!!parts&&!/memos/i.test(parts.t+' '+parts.d)&&/Open ☁ Sync/.test(text);
    out.bannerStatus=!!parts&&/Memos: saved/.test(parts.s); /* the per-store status line: the memo store was sent */
    out.bannerBox=await J.ev(()=>{const e=document.getElementById('hnx-unsent-banner');if(!e)return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);const z=r.width/(e.offsetWidth||1); /* the app may zoom the page: the box is judged in CSS pixels */ return {pos:cs.position,w:Math.round(r.width),h:Math.round(r.height),zoom:Math.round(z*100)/100,cssH:Math.round(r.height/z),iw:window.innerWidth,maxH:cs.maxHeight};});
    out.bannerNotBlocking=!!out.bannerBox&&out.bannerBox.pos==='fixed'&&out.bannerBox.w<=out.bannerBox.iw&&out.bannerBox.cssH<=151;
    out.bannerOnce=await J.ev(()=>document.querySelectorAll('#hnx-unsent-banner').length);
    await J.ev(()=>window.__hnxSyncDiagOpen());await sleep(500);
    out.panelLine=await J.ev(()=>{const p=document.getElementById('hnx-syncdiag-panel');return p?p.textContent.replace(/\s+/g,' '):'';});
    out.panelSame=/ha(s|ve) not reached the cloud since \d\d:\d\d — other computers cannot see (it|them)/.test(out.panelLine)&&/calls/i.test(out.panelLine);
    await J.ev(()=>{const p=document.getElementById('hnx-syncdiag-panel');if(p)p.remove();});
    await J.ev(()=>{const e=document.querySelector('#hnx-unsent-banner button[aria-label="Dismiss"]');if(e)e.click();});await sleep(300);
    await ageIt(25);await sleep(800);out.dismissedStays=(await bn())===null;
    /* the cloud recovers: one good full cycle sends everything → banner gone, pill green */
    cloud.cfg.by.jinky={maxPull:1e12,maxPush:1e12};
    await J.ev(()=>{window.__hnxSyncBackoff.expire();if(window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();window.__hnxTryAutoSync();});
    out.fullSyncBack=!!(await until(async()=>(await J.pulled())&&(await J.boN())===0,120000,1000));
    out.callsSent=!!(await until(()=>!!cloud.store.hydroPro_phone_calls_v1&&/C1/.test(cloud.store.hydroPro_phone_calls_v1),90000,1000));
    await J.ev(()=>{if(window.HNX_Cloud.unsentCheck)window.HNX_Cloud.unsentCheck();});
    out.bannerGone=(await bn())===null;
    out.pillGreen=!!(await until(async()=>(await J.pill())==='Sync',30000,1000));
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.memoSent':true,'drive.pillPartial':true,'drive.pillAmber':true,'drive.pillHover':true,'drive.callsUnsent':true,'drive.none19':true,'drive.banner21':true,'drive.bannerSays':true,'drive.bannerStatus':true,'drive.bannerNotBlocking':true,'drive.bannerOnce':1,'drive.panelSame':true,'drive.dismissedStays':true,'drive.fullSyncBack':true,'drive.callsSent':true,'drive.bannerGone':true,'drive.pillGreen':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 no false alarm on a HEALTHY cloud: a store that holds nothing ([] / {} / null) is never uploaded (SAFETY p50) so it can never be "sent" — it must not count as a "change that has not reached the cloud" (no banner 25 minutes later, not in the unsent list, no "Not in the cloud yet" row in the ☁ Sync panel, pill green); a real unsent change beside them (the cloud refuses uploads) still raises the banner and is the only one named; it is gone once that change is stored',
  drive:async pg=>{
    await blank(pg);
    const base=JSON.stringify([mk('M1','final',-600)]);
    const cloud=makeCloud(seedCloud({hydroPro_memos:base}),{maxPull:1e12,maxPush:1e12});
    const SEEDED=['hydroPro_zz_empty_v1','hydroPro_zz_obj_v1','hydroPro_zz_null_v1'];
    const A=await computer(pg,cloud,'dramy','dramy',{ls:{hydroPro_memos:base,hydroPro_zz_empty_v1:'[]',hydroPro_zz_obj_v1:'{}',hydroPro_zz_null_v1:'null',hnxlocal_dirty_v1:dirtyOf(SEEDED)}});
    const out={};
    out.ready=!!(await until(async()=>(await A.pulled()),150000,1000));
    await A.set('hydroPro_zz_late_v1','[]'); /* a user empties a store through the app's hooked setItem → it is marked unsent, exactly like the app's own empty stores (notif seen, ticket comments, alerts …) */
    const EMPTYNOW=()=>A.ev(()=>{const e=k=>{const t=(localStorage.getItem(k)||'').replace(/\s/g,'');return t===''||t==='[]'||t==='{}'||t==='null';};return Object.keys(JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}')).filter(e);});
    const nonEmptyUnsent=async()=>{const all=(await A.dirty())||[];return A.ev(all=>all.filter(k=>{const t=(localStorage.getItem(k)||'').replace(/\s/g,'');return !(t===''||t==='[]'||t==='{}'||t==='null');}),all);};
    out.settled=!!(await until(async()=>(await nonEmptyUnsent()).length===0,100000,1000)); /* the cycles have sent every real change; only stores that hold nothing are still marked */
    await sleep(1500);
    const persisted=(await A.dirtyPersisted())||[];
    out.premiseEmptiesAreMarked=SEEDED.concat(['hydroPro_zz_late_v1']).every(k=>persisted.indexOf(k)>=0)&&(await EMPTYNOW()).length>=4; /* the stores are really in the unsent set (else this case proves nothing) */
    out.emptiesNeverUploaded=cloud.pushAttempts('dramy').every(r=>Object.keys(r.body||{}).every(k=>!/^hydroPro_zz_(empty|obj|null|late)_v1$/.test(k)));
    /* every store that holds nothing became "unsent 25 minutes ago"; everything else is fresh (so only the defect can raise the banner) */
    const age=(realKey,realMin)=>A.ev(([rk,rm])=>{const s=window.__hnxDirtySince;Object.keys(s).forEach(k=>{s[k]=Date.now();});
      Object.keys(s).forEach(k=>{const t=(localStorage.getItem(k)||'').replace(/\s/g,'');if(t===''||t==='[]'||t==='{}'||t==='null')s[k]=Date.now()-25*60000;});
      if(rk&&s[rk]!==undefined)s[rk]=Date.now()-rm*60000;
      if(window.HNX_Cloud&&window.HNX_Cloud.unsentCheck)window.HNX_Cloud.unsentCheck();},[realKey||null,realMin||0]);
    const bn=()=>A.ev(()=>{const e=document.getElementById('hnx-unsent-banner');return e?e.textContent.replace(/\s+/g,' '):null;});
    await age();await sleep(900);
    out.bannerText=await bn();out.noBanner=out.bannerText===null;
    const u=await A.ev(()=>{const x=window.HNX_Cloud.unsent();return {n:x.n,all:x.all};});
    out.unsentOld=u.n;
    out.noEmptyListed=SEEDED.concat(['hydroPro_zz_late_v1']).every(k=>u.all.indexOf(k)<0);
    await A.ev(()=>window.__hnxSyncDiagOpen());await sleep(600);
    out.panelClean=await A.ev(()=>{const p=document.getElementById('hnx-syncdiag-panel');const t=p?p.textContent.replace(/\s+/g,' '):'';return !!p&&!/Not in the cloud yet/.test(t)&&!/have not reached the cloud since/.test(t)&&!/zz (empty|obj|null|late)/i.test(t);});
    await A.ev(()=>{const p=document.getElementById('hnx-syncdiag-panel');if(p)p.remove();});
    out.pillGreen=!!(await until(async()=>(await A.pill())==='Sync',30000,1000));
    /* a REAL unsent change (the cloud refuses uploads) beside the empty stores: the banner comes, naming only it */
    cloud.cfg.failPush=true;
    await A.set('hydroPro_zz_real_v1','[{"id":"R1","t":"a real change"}]');
    out.realRefused=!!(await until(()=>cloud.pushAttempts('dramy').some(r=>r.status>=400&&(r.keys||[]).indexOf('hydroPro_zz_real_v1')>=0),100000,1000));
    await age('hydroPro_zz_real_v1',21);await sleep(900);
    const b2=await bn();out.realBannerText=b2;
    out.realBanner=!!b2&&/⚠ 1 change on this computer has not reached the cloud since \d\d:\d\d — other computers cannot see it\./.test(b2)&&/zz real/i.test(b2)&&!/zz (empty|obj|null|late)/i.test(b2);
    /* the cloud recovers: the change is stored, the banner goes, the empty stores never come back as "unsent" */
    cloud.cfg.failPush=false;
    await A.ev(()=>{window.__hnxSyncBackoff.expire();if(window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();window.__hnxTryAutoSync();});
    out.realStored=!!(await until(()=>/a real change/.test(cloud.store.hydroPro_zz_real_v1||''),120000,1000));
    await age();await sleep(900);
    out.bannerGone=(await bn())===null;
    out.emptiesStillOut=await A.ev(()=>{const x=window.HNX_Cloud.unsent();return x.all.every(k=>!/^hydroPro_zz_(empty|obj|null|late)_v1$/.test(k));});
    out.pageErrors=A.errs.length;
    await A.ctx.close();return done(out);},
  expect:{'drive.ready':true,'drive.settled':true,'drive.premiseEmptiesAreMarked':true,'drive.emptiesNeverUploaded':true,'drive.noBanner':true,'drive.unsentOld':0,'drive.noEmptyListed':true,'drive.panelClean':true,'drive.pillGreen':true,'drive.realRefused':true,'drive.realBanner':true,'drive.realStored':true,'drive.bannerGone':true,'drive.emptiesStillOut':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 hardening: a keyed download the cloud answers with HTTP 200 but WITHOUT a data field is a FAILED download, not "the cloud holds nothing" — memos are not uploaded over a cloud-only memo (M2 stays in the cloud, M1 untouched there, memos stay unsent); when the cloud answers properly the store is merged and goes out with both',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600),mk('M2','final',-500)])}),{by:{jinky:NODL},pullNoData:'hydroPro_memos'});
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    const out={};
    const memoPushes=()=>cloud.pushAttempts('jinky').filter(r=>(r.keys||[]).indexOf('hydroPro_memos')>=0).length;
    out.laneTried=!!(await until(()=>cloud.small('jinky').filter(r=>r.keys.indexOf('hydroPro_memos')>=0).length>=1,120000,1000));
    await sleep(8000);
    out.noMemoPush=memoPushes()===0;
    out.cloudKeepsM2=!!cloud.memo('M2')&&JSON.parse(cloud.store.hydroPro_memos).length===2;
    out.cloudM1Untouched=!!cloud.memo('M1')&&!cloud.memo('M1').chain.final;
    out.memosStillUnsent=((await J.dirty())||[]).indexOf('hydroPro_memos')>=0;
    out.statusWaiting=(await lanes(J)).keys.hydroPro_memos.state!=='saved';
    cloud.cfg.pullNoData=null; /* the cloud answers properly again */
    await J.ev(()=>{if(window.HNX_Cloud&&window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();});
    out.reached=!!(await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},100000,1000));
    out.bothInCloud=!!cloud.memo('M2')&&JSON.parse(cloud.store.hydroPro_memos).length===2;
    out.localHasM2=!!(await J.memo('M2'));
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.laneTried':true,'drive.noMemoPush':true,'drive.cloudKeepsM2':true,'drive.cloudM1Untouched':true,'drive.memosStillUnsent':true,'drive.statusWaiting':true,'drive.reached':true,'drive.bothInCloud':true,'drive.localHasM2':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 the lane obeys the stale-app pause: a screen that runs an old Nexi (window.__hnxStaleApp) neither downloads nor uploads through the lane; when it is reloaded (flag cleared) the approval goes out',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)])}),{by:{jinky:NODL}});
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos'])}});
    await J.ev(()=>{window.__hnxStaleApp='99.99';}); /* set at once: before the first failed cycle ends */
    await until(async()=>(await J.boN())>=1,90000,500);
    const n0=cloud.log.length;
    await sleep(40000);
    const out={};
    out.noLaneRequests=cloud.log.slice(n0).filter(r=>r.who==='jinky'&&(r.path==='/sync/push'||(r.path==='/sync/pull'&&r.keys&&r.keys.length<=6))).length===0;
    out.cloudUntouched=!(cloud.memo('M1').chain.final);
    out.stillUnsent=((await J.dirty())||[]).indexOf('hydroPro_memos')>=0;
    await J.ev(()=>{window.__hnxStaleApp=null;if(window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();});
    out.sentAfterReload=!!(await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},90000,1000));
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.noLaneRequests':true,'drive.cloudUntouched':true,'drive.stillUnsent':true,'drive.sentAfterReload':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 the lane asks the Data Safety push guard about every upload: a store the guard holds (a bulk change waiting for the owner) is not uploaded and stays unsent, the other critical store goes; dirty flags are cleared only for stores the reply names in keys[] (a cloud that names nothing leaves both unsent)',
  drive:async pg=>{
    await blank(pg);
    const cloud=makeCloud(seedCloud({hydroPro_memos:JSON.stringify([mk('M1','final',-600)]),hydroPro_weekend_approvals_v1:'{"2026-10-18|E1":{"acct":"ok","acctAt":1}}'}),{by:{jinky:NODL},pushNamesNothing:true});
    const WK='{"2026-10-18|E1":{"acct":"ok","acctAt":1},"2026-10-25|E2":{"final":"ok","finalAt":99}}';
    const J=await computer(pg,cloud,'jinky','jinky',{ls:{hydroPro_memos:JSON.stringify([mk('M1','approved',100)]),hydroPro_weekend_approvals_v1:WK,hnxlocal_dirty_v1:dirtyOf(['hydroPro_memos','hydroPro_weekend_approvals_v1'])}});
    const out={};
    /* the guard holds memos */
    await J.ev(()=>{window.__realGuard=window.__hnxPushGuard;window.__hnxPushGuard=function(d){const o=Object.assign({},d);delete o.hydroPro_memos;return o;};});
    out.weekendUploaded=!!(await until(()=>/2026-10-25\|E2/.test(cloud.store.hydroPro_weekend_approvals_v1),100000,1000));
    await sleep(1500);
    out.memosHeld=cloud.pushAttempts('jinky').every(r=>(r.keys||[]).indexOf('hydroPro_memos')<0)&&!(cloud.memo('M1').chain.final);
    /* the cloud stored it but names nothing in keys[] → still unsent here */
    const d1=(await J.dirty())||[];
    out.noNamesStillUnsent=d1.indexOf('hydroPro_weekend_approvals_v1')>=0&&d1.indexOf('hydroPro_memos')>=0;
    /* now the cloud names its keys and the guard lets everything through */
    cloud.cfg.pushNamesNothing=false;
    await J.ev(()=>{window.__hnxPushGuard=window.__realGuard;if(window.HNX_Cloud.lane)window.HNX_Cloud.lane.expire();});
    out.memosThenSent=!!(await until(()=>{const m=cloud.memo('M1');return m&&m.chain&&m.chain.final;},100000,1000));
    out.clearedAfterNamed=!!(await until(async()=>{const d=(await J.dirty())||[];return d.indexOf('hydroPro_memos')<0&&d.indexOf('hydroPro_weekend_approvals_v1')<0;},30000,500));
    out.pageErrors=J.errs.length;
    await J.ctx.close();return done(out);},
  expect:{'drive.weekendUploaded':true,'drive.memosHeld':true,'drive.noNamesStillUnsent':true,'drive.memosThenSent':true,'drive.clearedAfterNamed':true,'drive.pageErrors':0} },

/* ---------------------------------------------------------------------------------------------------------------- */
{ name:'☁ v23.54 user guide: the Help centre’s Sync entry explains the quick lane, the new amber pill text, the 20-minute banner, the retry of each store on its own and the cloud worker 3.7.3 (and stays read-only: no download / export / print path was added)',
  requires:"window.HNX_HELP_GUIDES",
  run:async()=>{
    const g=JSON.stringify(window.HNX_HELP_GUIDES).split('Sync · retrying / no connection (v22.52)')[1]||'';
    return {entry:g.length>0, lane:/quick lane of their own/.test(g), pill:/Sync · partial — approvals & memos are saving, full sync retrying/.test(g),
      banner:/have not reached the cloud since HH:MM — other computers cannot see them/.test(g), each:/each one on its own/.test(g), worker:/cloud worker 3\.7\.3/.test(g)};},
  expect:{entry:true,lane:true,pill:true,banner:true,each:true,worker:true} },
];
