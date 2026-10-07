/* v21.96: an edit pulls only the edited keys (?keys=), never the whole ~15 MB store; slow line → full pull backs off; no t10 backup copies */
const SEED=function(){
  localStorage.setItem('hnx_cloud_token','t');localStorage.setItem('hnx_t10_calls_bak_v1','[1]');window.__pullUrls=[];window.__pushes=[];window.__slow=0;
  const cloud={'hydroPro_crm_leads':'[{"id":"L1","company":"Cloud Co","stage":"new","updatedAt":1}]'};
  const of=window.fetch;window.fetch=function(u,o){u=String(u);
    if(u.indexOf('/sync/pull')>=0){window.__pullUrls.push(u.split('/sync/pull')[1]||'');const r=JSON.stringify({ok:true,data:cloud});return new Promise(res=>setTimeout(()=>res(new Response(r,{status:200})),window.__slow));}
    if(u.indexOf('/sync/push')>=0){try{const d=JSON.parse(o.body).data;window.__pushes.push(Object.keys(d));Object.keys(d).forEach(k=>cloud[k]=d[k]);}catch(e){}return Promise.resolve(new Response('{"ok":true}',{status:200}));}
    if(u.indexOf('hnx-sync')>=0)return Promise.resolve(new Response('{"ok":true,"data":{}}',{status:200}));
    return of.apply(this,arguments);};
};
module.exports=[
{ name:'⚡ Sync v21.96: an edit triggers no full-store pull of its own (at most the regular 20 s background pull runs in 15 s) and the edit is uploaded; the t10 calls backup copy is gone from the browser (v21.96)',
  seed:SEED,
  run:async()=>{
    for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}await sleep(12000);
    const n0=__pullUrls.length,p0=__pushes.length;
    localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'EVT_S',module:'hr',title:'speed',date:'2026-10-07',updatedAt:Date.now()}]));
    await sleep(15000);
    const after=__pullUrls.slice(n0);window.__dbgAfter=after;
    return {noFullPull:after.filter(u=>!/keys=/.test(u)).length<=1,pushed:__pushes.slice(p0).some(p=>p.indexOf('hydroPro_cal_events_v2')>=0),bakGone:localStorage.getItem('hnx_t10_calls_bak_v1')===null};},
  expect:{noFullPull:true,pushed:true,bakGone:true} },
{ name:'⚡ Sync v21.96: on a slow line (a full pull taking 3 s) the background full pull waits ~30 s instead of running every 20 s — at most 2 full pulls in 45 s (v21.96)',
  seed:SEED,
  run:async()=>{
    for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}window.__slow=3000;await sleep(25000);
    const n0=__pullUrls.filter(u=>!/keys=/.test(u)).length;await sleep(45000);
    const fulls=__pullUrls.filter(u=>!/keys=/.test(u)).length-n0;
    return {few:fulls<=2,stats:window.__hnxPullStats.lastMs>=2500};},
  expect:{few:true,stats:true} },
{ name:'⚡ Sync v21.97: the first cloud download (60 stores, ~6 MB) is merged in slices — a 50 ms heartbeat timer never waits more than 1 s while it merges, and all 60 stores arrive (v21.97)',
  seed:function(){localStorage.setItem('hnx_cloud_token','t');const big={};for(let k=0;k<60;k++)big['hydroPro_slice_'+k]=JSON.stringify(Array.from({length:400},(_,i)=>({id:k+'_'+i,v:'y'.repeat(200),updatedAt:1})));
    window.__gap=0;let last=performance.now();setInterval(()=>{const n=performance.now();if(n-last>window.__gap)window.__gap=n-last;last=n;},50);
    const of=window.fetch;window.fetch=function(u,o){u=String(u);if(u.indexOf('/sync/pull')>=0)return new Promise(r=>setTimeout(()=>{window.__gap=0;r(new Response(JSON.stringify({ok:true,data:big}),{status:200}));},6000));
      if(u.indexOf('hnx-sync')>=0)return Promise.resolve(new Response('{"ok":true,"data":{}}',{status:200}));return of.apply(this,arguments);};},
  run:async()=>{for(let i=0;i<80;i++){if(window.__hnxPulledOk)break;await sleep(250);}await sleep(500);
    let n=0;for(let k=0;k<60;k++)if((localStorage.getItem('hydroPro_slice_'+k)||'').length>1000)n++;
    return {all:n===60,smooth:window.__gap<1000};},
  expect:{all:true,smooth:true} },
{ name:'⚡ Storage v21.98: a 60 KB save is written as-is (no compression on the save itself); the background pass compresses it later and it still reads back identical; hydroPro_calls lives in the device database (v21.98)',
  run:async()=>{await sleep(3000);const v=JSON.stringify(Array.from({length:600},(_,i)=>({id:'X'+i,t:'row '+i+' '+'q'.repeat(60)})));
    localStorage.setItem('hydroPro_lazy_test',v);const raw1=Storage.prototype.getItem.call(localStorage,'hydroPro_lazy_test')||'';
    window.__hnxLzCompact();const raw2=Storage.prototype.getItem.call(localStorage,'hydroPro_lazy_test')||'';
    return {rawFirst:raw1===v,compressedLater:raw2.indexOf('\u0001LZ\u0001')===0&&raw2.length<v.length/2,same:localStorage.getItem('hydroPro_lazy_test')===v,calls:__hnxAUTOVAULT.isVault('hydroPro_calls')};},
  expect:{rawFirst:true,compressedLater:true,same:true,calls:true} },
];
