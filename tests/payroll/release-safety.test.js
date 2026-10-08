/* v22.16: release ring (trial computers), rollback and safe mode — so a bad version can never block the whole company again */
const ADMIN=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',fullname:'Eyal',passwordHash:'x',role:'admin',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));};
const splice=(fn,map)=>{let src=fn.toString();for(const k in map)src=src.replace(k,'('+map[k].toString()+')');return new Function('return '+src)();};
module.exports=[
{ name:'🚦 Release v22.16: the router at the top decides which copy a computer opens — a 🚦 trial computer with a newer trial on the server → next.html; a rollback by the owner → prev.html for everyone (even trial computers); otherwise → index.html (v22.16)',
  seed:function(){localStorage.setItem('hnx_router_test','1');localStorage.setItem('hnx_router_dry','1');localStorage.setItem('hnx_release_ring','trial');localStorage.setItem('hnx_trial_target','next');},
  run:async()=>{await sleep(1500);const atLoad=window.__HNX_ROUTE_WANT;
    localStorage.setItem('hydroPro_release_ctl_v1',JSON.stringify({rollback:true,to:'22.15'}));const rb=window.__hnxRouteWant();
    localStorage.setItem('hydroPro_release_ctl_v1',JSON.stringify({rollback:false}));localStorage.removeItem('hnx_release_ring');const plain=window.__hnxRouteWant();
    return {atLoad,rb,plain,page:window.__HNX_PAGE===(/next\.html$/.test(location.pathname)?'next':'index')};}, /* v22.17: the suite also runs on the trial copy (NEXI_PAGE=next.html) */
  expect:{atLoad:'next',rb:'prev',plain:'index',page:true} },
{ name:'🚦 Release v22.16: a trial computer is sent to the trial only while the server’s next.html is NEWER than index.html (22.17 > 22.16 → next; same build or no next.html → stays on stable) (v22.16)',
  seed:splice(function(){ (ADMIN)(); localStorage.setItem('hnx_release_ring','trial'); },{'(ADMIN)':ADMIN}),
  run:async()=>{await sleep(2500);const of=window.fetch;const mk=v=>Promise.resolve(new Response('<!DOCTYPE html><html><head><!--NEXI_BUILD:'+v+'-->',{status:206}));
    let NEXT='22.17';window.fetch=function(u){u=String(u);if(/next\.html/.test(u))return NEXT?mk(NEXT):Promise.resolve(new Response('nf',{status:404}));if(/prev\.html/.test(u))return mk('22.15');if(/index\.html/.test(u))return mk('22.16');return of.apply(this,arguments);};
    await window.hnxRelease.checkTrial();const newer=localStorage.getItem('hnx_trial_target');
    NEXT='22.16';await window.hnxRelease.checkTrial();const same=localStorage.getItem('hnx_trial_target');
    NEXT=null;await window.hnxRelease.checkTrial();const none=localStorage.getItem('hnx_trial_target');window.fetch=of;
    return {newer,same,none};},
  expect:{newer:'next',same:null,none:null} },
{ name:'⏪ Release v22.16: the owner’s rollback is refused when the server has no previous version, otherwise it sets the synced flag; a computer on stable then shows “moving to the PREVIOUS version” with Switch now; Cancel rollback clears the bar; 🚦 Release control lists the three versions (v22.16)',
  seed:splice(function(){ (ADMIN)(); localStorage.setItem('hnx_router_test','1'); localStorage.setItem('hnx_router_dry','1');
    /* v22.17: when the suite drives the trial copy, this computer is a trial computer (so it is on the page it should be on) */
    if(/next\.html$/.test(location.pathname)){ localStorage.setItem('hnx_release_ring','trial'); localStorage.setItem('hnx_trial_target','next'); } },{'(ADMIN)':ADMIN}),
  run:async()=>{await sleep(2500);const of=window.fetch;let PREV=null;const mk=v=>Promise.resolve(new Response('<!--NEXI_BUILD:'+v+'-->',{status:206}));
    window.fetch=function(u){u=String(u);if(/prev\.html/.test(u))return PREV?mk(PREV):Promise.resolve(new Response('nf',{status:404}));if(/next\.html/.test(u))return Promise.resolve(new Response('nf',{status:404}));if(/index\.html/.test(u))return mk('22.16');return of.apply(this,arguments);};
    const r1=await window.hnxRelease.rollback();const flag1=!!(window.hnxRelease.ctl().rollback);
    PREV='22.15';const r2=await window.hnxRelease.rollback();const flag2=window.hnxRelease.ctl();const bar=document.getElementById('hnxReleaseBar');
    const barTxt=bar?bar.textContent:'';window.hnxRelease.cancelRollback();const barGone=!document.getElementById('hnxReleaseBar');
    window.hnxReleasePanel();await sleep(400);const p=document.getElementById('hnxReleasePanel');const ptxt=p?p.textContent:'';window.fetch=of;
    return {refused:r1.ok===false&&!flag1,set:r2.ok===true&&flag2.rollback===true&&flag2.to==='22.15',bar:/PREVIOUS/.test(barTxt)&&/Switch now/.test(barTxt),barGone,panel:/Stable/.test(ptxt)&&/v22\.16/.test(ptxt)&&/Previous: v22\.15/.test(ptxt)};},
  expect:{refused:true,set:true,bar:true,barGone:true,panel:true} },
{ name:'🛟 Safe mode v22.16: started with ?safe=1, Nexi runs Lite with background helpers off (a decorator interval never runs, cloud sync keeps its pace), shows the SAFE MODE badge, and Labor Payroll still opens (v22.16)',
  seed:splice(function(){ (ADMIN)(); sessionStorage.setItem('hnx_safe','1'); },{'(ADMIN)':ADMIN}),
  run:async()=>{await sleep(3000);let deco=0,sync=0;setInterval(function decoForTest(){deco++;},300);setInterval(function(){/* tryAutoSync */sync++;},300);await sleep(6000); /* v22.17: 6 s window (2.5 s right after boot was too short on a busy CI runner) */
    let opened=false;try{switchView('payroll_ops');const v=document.getElementById('view-payroll_ops');opened=!!(v&&v.textContent.length>200);}catch(e){}
    return {safe:window.__HNX_SAFE===true,skipped:(window.__hnxSafeSkipped||0)>20,decoNever:deco===0,syncRuns:sync>=3,sync,lite:document.documentElement.classList.contains('hnx-lite'),badge:!!document.getElementById('hnxSafeBadge'),opened};},
  expect:{safe:true,skipped:true,decoNever:true,syncRuns:true,lite:true,badge:true,opened:true} }
];
