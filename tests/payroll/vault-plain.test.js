/* v22.01: the device database never serves a compressed copy; boot never compresses raw stores on the main thread */
module.exports=[
{ name:'🧊 Vault v22.01: 30 reads of a 1.5 MB calls store cost under 400 ms in total; raw stores are queued at boot (bootQueued ≥ 1) and NOT compressed on the main thread at boot (bootCompressedMs = 0) but __hnxLzCompact compresses it on demand (v22.01)',
  seed:function(){const calls=JSON.stringify(Array.from({length:2500},(_,i)=>({id:'C'+i,title:'call '+i,department:'production',status:i%7?'closed':'open',priority:'normal',raisedAt:'2026-10-01T07:00:00Z',updatedAt:1,notes:'n'.repeat(500)})));
    localStorage.setItem('hydroPro_calls',calls);localStorage.setItem('hydroPro_lazy_boot',JSON.stringify(Array.from({length:3000},(_,i)=>({id:'L'+i,v:'y'.repeat(450)}))));
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'admin',fullname:'A',passwordHash:'x',role:'admin',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'admin',loginAt:Date.now()}));},
  run:async()=>{await sleep(5000);
    const nat=k=>Storage.prototype.getItem.call(localStorage,k)||'';
    const st=window.__hnxLzStats;
    let t=performance.now(),n=0;for(let i=0;i<30;i++){n+=(localStorage.getItem('hydroPro_calls')||'').length;}const ms=performance.now()-t;
    const rawAtBoot=st.bootQueued>=1&&st.bootCompressedMs===0;
    window.__hnxLzCompact();const compressed=nat('hydroPro_lazy_boot').indexOf('\u0001LZ\u0001')===0;
    return {fast:ms<400,ms:Math.round(ms),len:n>1000000,rawAtBoot,compressed,vaultOk:!__hnxAUTOVAULT.broken()};},
  expect:{fast:true,len:true,rawAtBoot:true,compressed:true,vaultOk:true} }
];
