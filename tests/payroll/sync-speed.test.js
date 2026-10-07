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
];
