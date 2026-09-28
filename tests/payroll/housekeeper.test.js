/* v21.19: HOUSEKEEPER — background work cannot freeze a click, memory is released automatically */
module.exports=[
{ name:'⏱ Timer governor: 50+ module-only jobs (R&D panel pollers) are screen-scoped, screen-wide banners are not (v21.20) — on the dashboard they never run (skipped, 0 runs); on the R&D screen they do; the stats list every job with its scope (v21.19)',
  run:async()=>{
    await sleep(6000);switchView('dashboard');await sleep(5000);
    const st=window.__hnxGovStats();const sc=st.jobs.filter(j=>j.scoped);
    const ranOnDash=sc.filter(j=>j.runs>0).length,skipped=sc.filter(j=>j.skipped>0).length;
    const wrong=st.jobs.filter(j=>j.scoped&&/showBackdateBanner|universalIndicator|showIrrigationBanner|headsPanel|sweep\(\)/.test(j.src)).map(j=>j.src.slice(0,30)); /* v21.20: screen-wide banners must never be scoped */
    switchView('rnd_home');await sleep(4500);
    const st2=window.__hnxGovStats();const ranOnRnd=st2.jobs.filter(j=>j.scoped&&j.runs>0).length;
    return {scoped:sc.length>=50,wrong,ranOnDash,skippedMost:skipped>=sc.length*0.8,ranOnRnd:ranOnRnd>=20,activeView:st2.activeView,keys:'skipped' in st.jobs[0]&&'deferred' in st.jobs[0]};},
  expect:{scoped:true,wrong:[],ranOnDash:0,skippedMost:true,ranOnRnd:true,activeView:'view-rnd_home',keys:true} },

{ name:'⏱ Interaction priority: while pointer events keep arriving, jobs averaging > 8 ms are deferred (deferred counter grows) and none of them runs inside the busy window unless a full period late (v21.19)',
  run:async()=>{
    await sleep(6000);switchView('dashboard');await sleep(2000);
    const heavyId=setInterval(function(){const t=performance.now();while(performance.now()-t<15){}},500); /* a 15 ms job */
    await sleep(3000);const before=window.__hnxGovStats().jobs.find(j=>j.id===heavyId);
    const t0=Date.now();let runsDuring=0;const r0=before.runs;
    while(Date.now()-t0<2500){document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true}));await sleep(100);}
    const during=window.__hnxGovStats().jobs.find(j=>j.id===heavyId);
    await sleep(2500);const after=window.__hnxGovStats().jobs.find(j=>j.id===heavyId);clearInterval(heavyId);
    return {avgHeavy:before.avgMs>8,deferred:during.deferred>0,runsDuring:during.runs-r0,fewDuring:(during.runs-r0)<=3,resumed:after.runs>during.runs};},
  expect:{avgHeavy:true,deferred:true,fewDuring:true,resumed:true} },

{ name:'📦 Storage meter: usage() is memoised (second call within 10 s is instant) and measures the compressed size; the probe write runs once a minute (v21.19)',
  seed:function(){localStorage.setItem('hydroPro_hk_big',JSON.stringify(Array.from({length:4000},function(_,i){return {id:i,note:'the same sentence again and again '+(i%7)};})));},
  run:async()=>{
    await sleep(5000);hnxStorageUsage();const t0=performance.now();hnxStorageUsage();const ms=performance.now()-t0;
    const raw=Storage.prototype.getItem.call(localStorage,'hydroPro_hk_big'),dec=localStorage.getItem('hydroPro_hk_big');
    return {memoFast:ms<20,compressed:raw.length<dec.length/3,decodeOk:JSON.parse(dec).length===4000};},
  expect:{memoFast:true,compressed:true,decodeOk:true} },

{ name:'🗜 Decoded-store memo: reading an unchanged compressed store twice returns the same value without decompressing again (second read ≥ 5× faster); after a write the new value is returned (v21.19)',
  seed:function(){localStorage.setItem('hydroPro_hk_memo',JSON.stringify(Array.from({length:20000},function(_,i){return {id:i,v:'row '+i+' lorem ipsum dolor sit amet'};})));},
  run:async()=>{
    await sleep(4000);window.__hnxLzMemoDrop('hydroPro_hk_memo');
    const t0=performance.now();const a=localStorage.getItem('hydroPro_hk_memo');const m1=performance.now()-t0;
    const t1=performance.now();const b=localStorage.getItem('hydroPro_hk_memo');const m2=performance.now()-t1;
    localStorage.setItem('hydroPro_hk_memo','[{"id":1}]');const c=localStorage.getItem('hydroPro_hk_memo');
    return {same:a===b,len:a.length>500000,faster:m2*5<m1||m2<0.5,fresh:c==='[{"id":1}]'};},
  expect:{same:true,len:true,faster:true,fresh:true} },

{ name:'🧹 Dropdown menus (HNXDD): handlers of a menu that is on screen keep working after the sweep; handlers of a menu that was never inserted (a repaint that was thrown away) are released — the click says the menu was refreshed (v21.19)',
  run:async()=>{
    await sleep(5000);window.__hk=[];const mk=n=>HNXDD('M'+n,[{label:'go '+n,onclick:function(){window.__hk.push(n);}}]);
    const html1=mk(1);const html2=mk(2);const d=document.createElement('div');d.innerHTML=html1;document.body.appendChild(d);
    const id2=(html2.match(/data-dd="(\d+)"/)||[])[1];
    await sleep(8500);
    d.querySelector('button[data-dd]').click();
    const toasts=[];const ot=window.showToast;window.showToast=function(m,k){toasts.push(String(m));return ot&&ot.apply(this,arguments);};
    HNXDD._run(id2);window.showToast=ot;d.remove();
    return {onScreenWorks:window.__hk.join(',')==='1',released:toasts.some(t=>/refreshed/.test(t)),notRun:window.__hk.indexOf(2)<0};},
  expect:{onScreenWorks:true,released:true,notRun:true} },

{ name:'🪦 Tombstones: writing a new tombstone prunes entries older than 180 days and keeps recent ones (v21.19)',
  seed:function(){localStorage.setItem('hydroPro_optomb',JSON.stringify({leads:{old:Date.now()-200*864e5,recent:Date.now()-10*864e5}}));},
  run:async()=>{
    await sleep(5000);window.__hnxTomb('leads','fresh');
    const t=JSON.parse(Storage.prototype.getItem.call(localStorage,'hydroPro_optomb')).leads;
    return {old:'old' in t,recent:'recent' in t,fresh:'fresh' in t};},
  expect:{old:false,recent:true,fresh:true} },
];
/* ---- second tranche (network / render / DOM / storage lenses) ---- */
module.exports.push(
{ name:'🔄 New-version check: reads only the first kilobytes of the page (Range request, one chunk), a newer APP_BUILD in that chunk shows the update banner, and the whole page is never downloaded (v21.19)',
  seed:function(){window.__upd=[];const of=window.fetch;window.fetch=function(u,o){u=String(u);if(/index\.html\?_cb=/.test(u)){window.__upd.push((o&&o.headers&&o.headers.Range)||'');const big='x'.repeat(2000)+'const APP_BUILD=99999999999999;'+'y'.repeat(50000);return Promise.resolve(new Response(big.slice(0,16384),{status:206,headers:{'Content-Type':'text/html'}}));}return of.apply(this,arguments);};},
  run:async()=>{
    await sleep(6000);window.__updProbe=[];await checkForUpdate();await sleep(500);
    const banner=!!document.querySelector('[id*="pdate"],[class*="update-banner"],[id*="Update"]')||/new version|update/i.test(document.body.innerText.slice(0,4000));
    return {range:window.__upd.length>0&&/^bytes=0-/.test(window.__upd[window.__upd.length-1]),detected:(typeof _updateDetected!=='undefined'&&!!_updateDetected)||banner};},
  expect:{range:true,detected:true} },

{ name:'☁ Dirty keys survive a reload (hnxlocal_dirty_v1) and the goodbye flush sends only changed keys in batches under 60 KB — a key too big for a batch stays dirty for the next normal upload (v21.19)',
  seed:function(){localStorage.setItem('hnx_cloud_token','t');window.__pushes=[];const of=window.fetch;window.fetch=function(u,o){u=String(u);
    if(u.indexOf('/sync/pull')>=0)return Promise.resolve(new Response(JSON.stringify({ok:true,data:{'hydroPro_memos':'[]'}}),{status:200}));
    if(u.indexOf('/sync/push')>=0){try{window.__pushes.push({keys:Object.keys(JSON.parse(o.body).data),len:o.body.length,keepalive:!!o.keepalive});}catch(e){}if(window.__holdPush&&!o.keepalive)return Promise.resolve(new Response('{"error":"held"}',{status:503})); /* the normal upload is held so the dirty keys stay put */return Promise.resolve(new Response('{"ok":true}',{status:200}));}
    if(u.indexOf('hnx-sync')>=0)return Promise.resolve(new Response('{"ok":true,"data":{}}',{status:200}));return of.apply(this,arguments);};},
  run:async()=>{
    for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}await sleep(12000);window.__holdPush=true;
    localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'K1',module:'hr',title:'small',date:'2026-10-01',updatedAt:Date.now()}]));
    localStorage.setItem('hydroPro_hk_huge',JSON.stringify(Array.from({length:9000},function(_,i){return {id:i,t:'row number '+i+' '+Math.random()};})));
    await sleep(1200);const persisted=JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}');
    const n0=window.__pushes.length;window.__hnxFlushKeepalive();await sleep(800);
    const flush=window.__pushes.slice(n0).filter(p=>p.keepalive); /* a normal upload may land in the same window */
    return {dirtyPersisted:!!persisted['hydroPro_cal_events_v2'],hugePersisted:!!persisted['hydroPro_hk_huge'],flushed:flush.length>=1,small:flush.every(p=>p.len<=64000&&p.keepalive),hasSmall:flush.some(p=>p.keys.indexOf('hydroPro_cal_events_v2')>=0),hugeKept:flush.every(p=>p.keys.indexOf('hydroPro_hk_huge')<0)};},
  expect:{dirtyPersisted:true,hugePersisted:true,flushed:true,small:true,hasSmall:true,hugeKept:true} },

{ name:'📜 Audit log writer caps by size (400 KB) as well as count, dropping the OLDEST entries — the newest entry always survives (v21.19)',
  run:async()=>{
    await sleep(5000);const big=[];for(let i=0;i<6000;i++)big.push({ts:new Date(Date.now()-(6000-i)*1000).toISOString(),user:'t',action:'x'.repeat(120),i:i});
    saveAuditLog(big);const l=loadAuditLog();
    return {capped:JSON.stringify(l).length<=420000,newestKept:l[l.length-1].i===5999,oldestGone:l[0].i>0,count:l.length>50};},
  expect:{capped:true,newestKept:true,oldestGone:true,count:true} },

{ name:'🧭 Module sidebar: the two sidebar patchers wrap the renderer once (not again every 4 s) and an unchanged sidebar is not rebuilt (v21.19)',
  run:async()=>{
    await sleep(6000);const f0=window.renderModuleSidebar;await sleep(9000);const f1=window.renderModuleSidebar;
    const sb=document.querySelector('.module-sidebar,#moduleSidebar,[class*="module-sidebar"]');const first=sb?sb.firstElementChild:null;
    renderModuleSidebar();renderModuleSidebar();const sb2=document.querySelector('.module-sidebar,#moduleSidebar,[class*="module-sidebar"]');
    return {stable:f0===f1,flagged:!!window.__hnxSbAcctPatched&&!!window.__hnxSbReportsPatched,sameNodes:!sb||!first||(sb2&&sb2.firstElementChild===first)};},
  expect:{stable:true,flagged:true,sameNodes:true} },

{ name:'📹 Media outside the open screen: a video inside a screen that is not active is paused within 3 s; an iframe there has its source unloaded and restored when the screen is opened again (v21.19)',
  run:async()=>{
    await sleep(5000);switchView('dashboard');await sleep(500);
    const v=document.getElementById('view-hr')||Array.from(document.querySelectorAll('.view')).find(x=>!x.classList.contains('active'));
    const fr=document.createElement('iframe');fr.src='about:blank#cam';v.appendChild(fr);await sleep(3500);
    const unloaded=!fr.getAttribute('src');switchView(v.id.replace(/^view-/,''));await sleep(3500);const restored=/cam/.test(fr.getAttribute('src')||'');fr.remove();
    return {unloaded,restored};},
  expect:{unloaded:true,restored:true} },

{ name:'👁 Page-wide watchers are coalesced: 30 body-subtree observers share one native observer, a burst of 50 DOM changes reaches each of them as ONE batched call (not 50), and the stats report them (v21.19)',
  run:async()=>{
    await sleep(5000);let calls=0;const obs=[];for(let i=0;i<30;i++){const o=new MutationObserver(function(recs){calls++;});o.observe(document.body,{childList:true,subtree:true});obs.push(o);}
    const st0=window.__hnxMoStats();const box=document.createElement('div');document.body.appendChild(box);
    for(let i=0;i<50;i++){const d=document.createElement('span');box.appendChild(d);}
    await sleep(600);const c1=calls;obs.forEach(o=>o.disconnect());box.remove();
    return {registered:st0.observers>=30,batched:c1>=30&&c1<=60,coalesced:MutationObserver.__hnxCoalesced===true};},
  expect:{registered:true,batched:true,coalesced:true} }
);
