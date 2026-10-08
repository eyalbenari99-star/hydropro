/* v22.10: login-page quiet mode */
module.exports=[
{ name:'🤫 Quiet v22.10: before sign-in a 500 ms decorator job runs its first 2 times then waits 30 s (≤ 3 runs in 6 s), a sync job (tryAutoSync) keeps its pace (≥ 8 runs in 6 s); after sign-in the decorator resumes at once (≥ 3 runs in 6 s) (v22.10)',
  seed:function(){localStorage.setItem('hnx_quiet_test','1');sessionStorage.removeItem('hydroPro_session');},
  run:async()=>{await sleep(1500);sessionStorage.removeItem('hydroPro_session');
    window.__qDeco=0;window.__qSync=0;
    setInterval(function decoForTest(){window.__qDeco++;},500);
    setInterval(function(){ /* tryAutoSync */ window.__qSync++; },500);
    await sleep(6000);const pre={deco:window.__qDeco,sync:window.__qSync,q:window.__hnxQuiet()};
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'admin',loginAt:Date.now()}));const d0=window.__qDeco;await sleep(6000);const post=window.__qDeco-d0;
    return {decoQuiet:pre.deco<=3,syncPace:pre.sync>=8,preLogin:pre.q.preLogin,afterLogin:post>=3};},
  expect:{decoQuiet:true,syncPace:true,preLogin:true,afterLogin:true} }
];
