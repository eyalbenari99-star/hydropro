/* v22.09: the browser's own attribution (Long Animation Frame) names the function that blocked the screen */
module.exports=[
{ name:'🎯 Culprit v22.09: a 3.5 s block inside a timer callback named hogNamedForTest (v22.24: the box needs ≥ 3 s; was 2.2 s) is named in the stall box line “BROWSER SAYS … hogNamedForTest (Nexi timer)” (v22.09)',
  run:async()=>{await sleep(2500);
    
    window.hogNamedForTest=function hogNamedForTest(){const t=Date.now();while(Date.now()-t<3500){}};
    setTimeout(window.hogNamedForTest,0);await sleep(3900);
    window.__hnxBB.checkGap(9000);await sleep(1600);
    const cl=document.getElementById('hnxStallCulprit');const txt=cl?cl.textContent:'';
    return {named:/hogNamedForTest/.test(txt),invoker:/timer|setTimeout/i.test(txt),saved:/hogNamedForTest/.test((localStorage.getItem('hnxlocal_longs_v1')||'')+(localStorage.getItem('hnxlocal_loaf_v1')||''))};},
  expect:{named:true,invoker:true,saved:true} }
];
