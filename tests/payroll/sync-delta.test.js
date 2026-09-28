/* v21.19: delta uploads — a push carries only the keys changed on this computer; the upload has the 4-minute deadline */
const SEED=function(){
  localStorage.setItem('hnx_cloud_token','t');window.__pushes=[];window.__pulls=0;
  const cloud={'hydroPro_crm_leads':'[{"id":"L1","company":"Cloud Co","stage":"new","updatedAt":1}]','hydroPro_memos':'[{"id":"M1","title":"cloud memo","status":"pending","updatedAt":1}]'};
  const of=window.fetch;window.fetch=function(u,o){u=String(u);
    if(u.indexOf('/sync/pull')>=0){window.__pulls++;return Promise.resolve(new Response(JSON.stringify({ok:true,data:cloud}),{status:200}));}
    if(u.indexOf('/sync/push')>=0){try{const d=JSON.parse(o.body).data;window.__pushes.push(Object.keys(d));Object.keys(d).forEach(k=>cloud[k]=d[k]);}catch(e){}return Promise.resolve(new Response('{"ok":true}',{status:200}));}
    if(u.indexOf('hnx-sync')>=0)return Promise.resolve(new Response('{"ok":true,"data":{}}',{status:200}));
    return of.apply(this,arguments);};
};
module.exports=[
{ name:'☁ A write that does not change the value (a boot seeder re-writing its default) marks nothing dirty and uploads nothing; a real change does (v21.19)',
  seed:SEED,
  run:async()=>{
    for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}await sleep(12000);
    const d0=window.__hnxSyncMode().dirty;const cur=localStorage.getItem('hydroPro_memos');localStorage.setItem('hydroPro_memos',cur);
    const d1=window.__hnxSyncMode().dirty;localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M9',title:'changed',status:'pending',updatedAt:Date.now()}]));
    const d2=window.__hnxSyncMode().dirty;
    return {sameNoDirty:d1===d0,changeDirty:d2===d0+1};},
  expect:{sameNoDirty:true,changeDirty:true} },

{ name:'☁ The first upload of a session is FULL (safety net); after it, changing one key uploads ONLY that key (delta) — not the whole 15 MB store; the upload deadline is the 4-minute one, not 25 s (v21.19)',
  seed:SEED,
  run:async()=>{
    for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}
    for(let i=0;i<40;i++){if(__pushes.length)break;await sleep(500);}
    const first=__pushes[0]||[];
    const mode=window.__hnxSyncMode();await sleep(12000); /* let the boot seeders' own writes go out first */
    localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'EVT_1',module:'hr',title:'delta test',date:'2026-10-01',updatedAt:Date.now()}]));
    let mine=null;for(let i=0;i<60;i++){mine=__pushes.slice(1).find(p=>p.indexOf('hydroPro_cal_events_v2')>=0);if(mine)break;await sleep(500);}
    const laterMax=Math.max(0,...__pushes.slice(1).map(p=>p.length));
    return {sizes:__pushes.map(p=>p.length),big:__pushes.slice(1).filter(p=>p.length>8).map(p=>p.slice(0,12)),firstFull:first.length>5,firstHasUsers:first.indexOf('hydroPro_users')>=0,mineSmall:!!mine&&mine.length<=8,pushTimeout:mode.pushTimeoutMs,unsafe:mode.unsafe};},
  expect:{firstFull:true,firstHasUsers:true,mineSmall:true,pushTimeout:240000,unsafe:false} },

{ name:'☁ Safety net: if a pull after a delta upload no longer holds a key the cloud had, Nexi switches to full uploads (hnx_delta_unsafe) (v21.19)',
  seed:new Function('('+SEED.toString()+")();"),
  run:async()=>{
    for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}
    for(let i=0;i<40;i++){if(__pushes.length)break;await sleep(500);}
    window.__hnxCloudKeys=(window.__hnxCloudKeys||[]).concat(['hydroPro_ghost_key']);window.__hnxDeltaPushed=true;
    localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'EVT_2',module:'hr',title:'x',date:'2026-10-02',updatedAt:Date.now()}]));
    for(let i=0;i<60;i++){if(localStorage.getItem('hnx_delta_unsafe')==='1')break;await sleep(500);}
    const m=window.__hnxSyncMode();
    return {unsafe:localStorage.getItem('hnx_delta_unsafe'),full:m.full};},
  expect:{unsafe:'1',full:true} },
];
