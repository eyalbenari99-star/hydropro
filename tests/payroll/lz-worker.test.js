/* v22.02: big stores are compressed in a Web Worker, never on the main thread */
module.exports=[
{ name:'🧵 Worker v22.02: a 1.5 MB raw store left from the previous session is compressed by the background worker within 40 s of load (stats.worker ≥ 1, stored value LZ-marked, reads unchanged) and no single task on the screen thread exceeds 600 ms while that happens (v22.02)',
  seed:function(){localStorage.setItem('hydroPro_wk_test',JSON.stringify(Array.from({length:3000},(_,i)=>({id:'W'+i,v:'w'.repeat(450)+i}))));
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'admin',fullname:'A',passwordHash:'x',role:'admin',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'admin',loginAt:Date.now()}));},
  run:async()=>{const nat=k=>Storage.prototype.getItem.call(localStorage,k)||'';let maxLT=0;try{new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(e.duration>maxLT)maxLT=e.duration;})).observe({type:'longtask'});}catch(e){}
    const before=localStorage.getItem('hydroPro_wk_test');let done=false;for(let i=0;i<80;i++){if(nat('hydroPro_wk_test').indexOf('\u0001LZ\u0001')===0){done=true;break;}await sleep(500);}
    const after=localStorage.getItem('hydroPro_wk_test');
    return {done,worker:window.__hnxLzStats.worker>=1,same:before===after&&after.length>1000000,smooth:maxLT<600,maxLT:Math.round(maxLT),pending:window.__hnxLzPending().length};},
  expect:{done:true,worker:true,same:true,smooth:true,pending:0} }
];
