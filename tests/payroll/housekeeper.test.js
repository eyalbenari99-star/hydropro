/* v21.19: HOUSEKEEPER — background work cannot freeze a click, memory is released automatically */
module.exports=[
{ name:'⏱ Timer governor: 60+ module-only jobs (R&D panel pollers) are screen-scoped — on the dashboard they never run (skipped, 0 runs); on the R&D screen they do; the stats list every job with its scope (v21.19)',
  run:async()=>{
    await sleep(6000);switchView('dashboard');await sleep(5000);
    const st=window.__hnxGovStats();const sc=st.jobs.filter(j=>j.scoped);
    const ranOnDash=sc.filter(j=>j.runs>0).length,skipped=sc.filter(j=>j.skipped>0).length;
    switchView('rnd_home');await sleep(4500);
    const st2=window.__hnxGovStats();const ranOnRnd=st2.jobs.filter(j=>j.scoped&&j.runs>0).length;
    return {scoped:sc.length>=60,ranOnDash,skippedMost:skipped>=sc.length*0.8,ranOnRnd:ranOnRnd>=20,activeView:st2.activeView,keys:'skipped' in st.jobs[0]&&'deferred' in st.jobs[0]};},
  expect:{scoped:true,ranOnDash:0,skippedMost:true,ranOnRnd:true,activeView:'view-rnd_home',keys:true} },

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
