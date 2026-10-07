/* v22.08: the 6-8 s polls only work when the stored text changed */
module.exports=[
{ name:'🔎 Polls v22.08: __hnxSig of a 1.2 MB maintenance store is identical across reads (no change → the polls return early) and changes after a save (v22.08)',
  run:async()=>{await sleep(2000);localStorage.setItem('hydroPro_maint_tasks',JSON.stringify(Array.from({length:2600},(_,i)=>({id:'T'+i,t:'x'.repeat(400)}))));
    const a=window.__hnxSig('hydroPro_maint_tasks'),b=window.__hnxSig('hydroPro_maint_tasks');
    localStorage.setItem('hydroPro_maint_tasks',JSON.stringify(Array.from({length:2601},(_,i)=>({id:'T'+i,t:'x'.repeat(400)}))));
    const c=window.__hnxSig('hydroPro_maint_tasks');let t=performance.now();for(let i=0;i<200;i++)window.__hnxSig('hydroPro_maint_tasks');const ms=performance.now()-t;
    return {same:a===b&&a.length>5,changed:c!==a,fast:ms<200};},
  expect:{same:true,changed:true,fast:true} }
];
