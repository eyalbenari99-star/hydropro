/* v22.17: the red stall box / freeze black box is exact — real freezes are not lost as "pauses", sleep / hidden / dialog time is not a
   freeze, the box stays small and readable at 115 %, pauses leave a trace, and the browser names the job (findings 23-30). */
const H=`const BB=window.__hnxBB;
  const block=ms=>{const t=Date.now();while(Date.now()-t<ms){}};
  const waitQuiet=async()=>{for(let i=0;i<60;i++){const n=Date.now();if(BB.busyMs(n-14000,n)<500)return true;await sleep(1000);}return false;};
  const hide=()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));};
  const show=()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));};`;
const fn=body=>new Function(`return (async()=>{${H}${body}})();`);
const jinky=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));};
module.exports=[
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🧯 Stall v22.17 (finding 24): a tab switched away and back DURING a 3.5 s freeze (both events arrive after it; v22.24: the box needs ≥ 3 s, was 2.5 s) is a STALL with ≥ 3000 ms busy and a box (v22.14: a pause, no box); a 2.5 s freeze 1 s after coming back in a 12 s gap is a STALL with ~1000 ms hidden (was a pause) (v22.17)',
  seed:jinky,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const quiet=await waitQuiet();const s0=BB.stalls.length;
    BB.mark('switch.block','A');block(3500);hide();show();BB.checkGap(9000);await sleep(1600);
    const a=BB.stalls[BB.stalls.length-1]||{};const boxA=!!document.getElementById('hnxStallBox');
    const A={stall:BB.stalls.length===s0+1&&a.op==='switch.block',busy:a.busyMs>=3000,box:boxA,notPaused:!a.paused};
    const quiet2=await waitQuiet();const s1=BB.stalls.length;
    hide();await sleep(1000);BB.mark('return.block','B');show();block(2500);BB.checkGap(12000);await sleep(1600);
    const b=BB.stalls[BB.stalls.length-1]||{};
    const B={stall:BB.stalls.length===s1+1&&b.op==='return.block',busy:b.busyMs>=2000,hid:b.hiddenMs>=900&&b.hiddenMs<=2500,labelHidden:!!b.hidden};
    return {quiet,quiet2,A,B,nums:{a:[a.busyMs,a.hiddenMs],b:[b.busyMs,b.hiddenMs]}};`),
  expect:{quiet:true,quiet2:true,'A.stall':true,'A.busy':true,'A.box':true,'A.notPaused':true,'B.stall':true,'B.busy':true,'B.hid':true,'B.labelHidden':true} },
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🧯 Stall v22.17 (findings 24 + 29): 2 s of work while the window is hidden is a pause (≤ 500 ms busy while visible, ≥ 1900 ms busy in all), saved in hnxlocal_pauses_v1 and counted as 1 “busy while hidden” in the 🩺 Nexi Health record and panel (pauses left no trace before) (v22.17)',
  seed:jinky,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const quiet=await waitQuiet();const s0=BB.stalls.length,p0=BB.pauseN||0,pb0=BB.pauseBusyN||0,n0=JSON.parse(localStorage.getItem('hnxlocal_pauses_v1')||'[]').length;
    hide();await sleep(500);BB.mark('hidden.work','C');block(2000);BB.checkGap(9000);await sleep(1600);show();
    const ev=BB.pauses[BB.pauses.length-1]||{};
    const pz=JSON.parse(localStorage.getItem('hnxlocal_pauses_v1')||'[]');const lp=pz[pz.length-1]||{};
    window.__hnxGuardian.runNow();const dev=localStorage.getItem('hnx_device_id');const arr=JSON.parse(localStorage.getItem('hydroPro_health_v1')||'[]');const mine=arr.find(r=>r&&r.id===dev)||{};
    window.hnxHealthPanel();const p=document.getElementById('hnxHealthPanel');const txt=p?p.textContent:'';if(p)p.remove();
    return {quiet,noStall:BB.stalls.length===s0,pause:!!ev.paused&&/hidden/.test(ev.why||''),visBusy:ev.busyMs<=500,allBusy:ev.busyAllMs>=1900,
      counted:(BB.pauseN||0)>p0&&(BB.pauseBusyN||0)===pb0+1,saved:pz.length===Math.min(30,n0+1)&&lp.all>=1900&&/hidden/.test(lp.why||'')&&lp.op===ev.op,
      health:mine.pausesBusy>=1&&mine.pauses>=1,panel:/busy while hidden/.test(txt),nums:[ev.busyMs,ev.busyAllMs,ev.hiddenMs]};`),
  expect:{quiet:true,noStall:true,pause:true,visBusy:true,allBusy:true,counted:true,saved:true,health:true,panel:true} },
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🧯 Stall v22.17 (findings 26 + 25): a slow job is logged with its START time (±60 ms; it was the end), so a window from 1 s after a 2 s timer job counts < 300 ms busy (was 2000) and a quiet 9 s gap starting just after the job is a pause, not a box; with the wall clock 30 s ahead of the page clock a real 2.5 s freeze still counts ≥ 2000 ms busy and is a STALL (was 0 ms → pause) (v22.17)',
  seed:jinky,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const quiet=await waitQuiet();
    let t0=0;setTimeout(function startTimeJobForTest(){t0=Date.now();block(2000);},0);await sleep(2300);
    const e=BB.longs.filter(x=>/startTimeJobForTest/.test(x.src)).pop()||{};
    const atIsStart=!!e.at&&Math.abs(e.at-t0)<60;
    await sleep(1000);const after=BB.busyMs(t0+3000,Date.now());
    /* a gap that starts 0.2 s after the job ended (computer asleep / covered right after a slow job) */
    const s0=BB.stalls.length;const p0=BB.pauses.length;await sleep(Math.max(0,t0+2000+9200-Date.now()));
    BB.checkGap(9000);await sleep(1600);const sleepGap={pause:BB.stalls.length===s0&&BB.pauses.length>p0,noBox:!document.getElementById('hnxStallBox'),busy:(BB.pauses[BB.pauses.length-1]||{}).busyMs};
    /* wall clock 30 s ahead of the monotonic page clock (after sleep / a clock change) */
    const realNow=Date.now;const s1=BB.stalls.length;let drift={};
    Date.now=function(){return realNow.call(Date)+30000;};
    try{BB.mark('drift.block','D');block(2500);BB.checkGap(9000);await sleep(1600);
      const d=BB.stalls.slice(s1).find(x=>x.op==='drift.block')||{};drift={stall:!!d.op&&!d.paused,busy:d.busyMs>=2000,n:d.busyMs};}
    finally{Date.now=realNow;}
    return {quiet,atIsStart,after:after<300,afterMs:after,sleepGap,drift};`),
  expect:{quiet:true,atIsStart:true,after:true,'sleepGap.pause':true,'sleepGap.noBox':true,'drift.stall':true,'drift.busy':true} },
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🧯 Stall v22.17 (finding 27): a confirm box left open 9.5 s (the page is parked, the browser sees one long task) is a pause — no red box, no stall, no inbox report — and confirm still returns its answer (v22.14: a STALL with a box and a report) (v22.17)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));
    /* stands in for the browser's own confirm(): parked 9.5 s while the operator reads, then "OK" */
    const nc=window.confirm;window.confirm=function(m){if(m==='__hnxDlgTest'){const t=Date.now();while(Date.now()-t<9500){}return true;}return nc.apply(window,arguments);};},
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const quiet=await waitQuiet();const s0=BB.stalls.length,p0=BB.pauses.length;
    const inb=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze').length;const i0=inb();
    BB.mark('dialog.test','confirm');const ans=confirm('__hnxDlgTest');BB.checkGap(10500);await sleep(4500); /* the real 3 s heartbeat sees the gap too */
    const ev=BB.pauses.slice(p0).find(x=>x.dialogMs>=9000)||{};
    return {quiet,answer:ans,recorded:BB.dlg.some(x=>x.d>=9400),pause:!!ev.paused&&/yes\\/no/.test(ev.why||''),noStall:BB.stalls.length===s0,noBox:!document.getElementById('hnxStallBox'),inboxUnchanged:inb()===i0,nums:[ev.dialogMs,ev.busyMs,ev.gapMs]};`),
  expect:{quiet:true,answer:true,recorded:true,pause:true,noStall:true,noBox:true,inboxUnchanged:true} },
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🧯 Stall v22.17 (finding 28): with field-length content at Nexi’s default 115 % text scale the box stays ≤ 520 px wide and ≤ 200 px tall (was 598 × 387 on this 1600 × 1000 screen, 598 × 257 on a 1366 × 657 one), sits outside the zoomed page, and the 🎯 BROWSER SAYS line naming the job is the first line under the title and fully visible (it was the last line, the first one cut off) (v22.17)',
  seed:jinky,
  run:fn(`await sleep(4000);document.body.style.zoom='1.15';
    for(let i=0;i<7;i++)BB.mark('timer','I3000|function liteMediaForTest'+i+'(){ var v=document.querySelectorAll("video,iframe"); for(var i=0;i<v.length;i++){');
    try{for(let i=0;i<3;i++)window.__hnxNS.call(localStorage,'hnxtest_big_store_'+i,'x'.repeat(120000));}catch(e){}
    BB.mark('payroll.render','Labor Payroll · 2026-09-29 → 2026-10-05 · 42 employees · regenerate run ops_2026-09-29_2026-10-05');
    window.boxHogForTest=function boxHogForTestWithALongDescriptiveName(){const t=Date.now();while(Date.now()-t<3500){}}; /* v22.24: ≥ 3 s for a box (was 2.2 s) */
    setTimeout(window.boxHogForTest,0);await sleep(3900);BB.checkGap(9000);await sleep(1600);
    const box=document.getElementById('hnxStallBox');const r=box?box.getBoundingClientRect():{};const cl=document.getElementById('hnxStallCulprit');const cr=cl?cl.getBoundingClientRect():{};
    try{for(let i=0;i<3;i++)localStorage.removeItem('hnxtest_big_store_'+i);}catch(e){}
    return {zoom:document.body.style.zoom,shown:!!box,outsideZoom:!!box&&!document.body.contains(box),w:r.width<=521,h:r.height<=201,
      culpritVisible:!!cl&&cr.height>0&&cr.top>=r.top&&cr.bottom<=r.bottom+0.5,culpritFirst:!!box&&!!cl&&(k=>k.indexOf(cl)>0&&k.slice(0,k.indexOf(cl)).every(e=>e.tagName==='BUTTON'||e.tagName==='B'))([...box.children]),says:!!cl&&/BROWSER SAYS/.test(cl.textContent)&&/boxHogForTest/.test(cl.textContent),
      corner:r.left<40&&r.bottom>innerHeight-40,passThrough:!!box&&getComputedStyle(box).pointerEvents==='none',size:[Math.round(r.width),Math.round(r.height)]};`),
  expect:{zoom:'1.15',shown:true,outsideZoom:true,w:true,h:true,culpritVisible:true,culpritFirst:true,says:true,corner:true,passThrough:true} },
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🎯 Culprit v22.17 (finding 23): the governor’s 250 ms master tick writes 0 “timer I250” stall marks after a slow tick (was one every 250 ms), a 300 ms governed job is logged once as “job” and named by the culprit with its long frame (jobs and frames under 1.5 s were dropped), a 1.6 s job is logged once (was twice) so its busy time counts ≤ its length + 250 ms (was ~2×), and only frames ≥ 1.5 s are saved (v22.17)',
  run:fn(`await sleep(4000);
    const om=BB.mark;let tickMarks=0;BB.mark=function(op,ctx){if(op==='timer'&&/^I250\\|/.test(String(ctx||'')))tickMarks++;return om.apply(this,arguments);};
    let runs=0;const id=setInterval(function govJobForTest(){runs++;const ms=runs===1?300:(runs===2?1600:0);const t=performance.now();while(performance.now()-t<ms){}if(runs>=2)clearInterval(id);},1000);
    for(let i=0;i<50&&runs<2;i++)await sleep(500);
    await sleep(3000);BB.mark=om;
    const mine=BB.longs.filter(e=>/govJobForTest/.test(e.src));const tickLongs=BB.longs.filter(e=>/^I250\\|/.test(e.src));
    const big=mine.find(e=>e.d>=1500)||{};const small=mine.find(e=>e.d>=250&&e.d<1500)||{};
    const busy=big.at?BB.busyMs(big.at-100,big.at+big.d+100):-1;
    const c=small.at?BB.culprit(small.at-50,small.at+small.d+50):null;
    const saved=JSON.parse(localStorage.getItem('hnxlocal_loaf_v1')||'[]');
    return {runs,tickMarks,jobsOnce:mine.length===2&&mine.every(e=>e.kind==='job'),noTickLong:tickLongs.length===0,
      once:busy>0&&busy<=big.d+250,busy,bigD:big.d,
      named:!!c&&c.scripts.some(x=>/^job: function govJobForTest/.test(x.fn))&&c.frames>=1&&c.scr>=200,
      frame:BB.loaf.some(e=>e.d>=250&&e.d<1500&&e.scr>=200),savedOnlyBig:saved.every(e=>e.d>=1500)};`),
  expect:{runs:2,tickMarks:0,jobsOnce:true,noTickLong:true,once:true,named:true,frame:true,savedOnlyBig:true} },
{ requires:"window.__hnxBB&&typeof window.__hnxBB.hiddenMs==='function'", /* v22.20: the stable copy (no v22.17 stall-box change) skips this case */
  name:'🧯 Stall v22.17 (finding 30): on a browser without long-task / long-frame timing (Safari, Firefox — simulated) the black box knows it (loafOk/ltOk false, were true; busy unknown = null, was 0 ms), a 70 s sleep-length gap is a pause, and a 9 s gap with a 2 s block is still a STALL whose box says the browser cannot attribute (was a pause) (v22.17)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));
    try{Object.defineProperty(PerformanceObserver,'supportedEntryTypes',{configurable:true,get:function(){return ['mark','measure','navigation','resource','paint'];}});}catch(e){}},
  run:fn(`await sleep(4000);const n=Date.now();
    const flags={loaf:BB.loafOk,lt:BB.ltOk,busyNull:BB.busyMs(n-5000,n)===null};
    /* v22.20: since v22.20 Nexi's own logged work in the gap decides on such a browser — wait (≤ 120 s) until the last 71 s hold < 1.5 s of it (start-up work) */
    for(let i=0;i<120;i++){const m=Date.now();let t=0;(BB.longs||[]).forEach(e=>{t+=Math.max(0,Math.min(e.at+e.d,m+400)-Math.max(e.at,m-71000));});if(t<1500)break;await sleep(1000);}
    const s0=BB.stalls.length;BB.mark('asleep.test','x');BB.checkGap(70000);await sleep(1600);
    const p=BB.pauses[BB.pauses.length-1]||{};const asleep={pause:BB.stalls.length===s0&&p.unknownBusy===true&&/asleep/.test(p.why||''),noBox:!document.getElementById('hnxStallBox')};
    BB.mark('nolt.block','S');block(3500); /* v22.24: ≥ 3 s for a box (was 2 s) */BB.checkGap(9000);await sleep(1600);
    const cl=document.getElementById('hnxStallCulprit');
    return {flags,asleep,stall:BB.stalls.length===s0+1&&!!BB.stalls[s0].unknownBusy,cannot:/cannot attribute/.test(cl?cl.textContent:'')};`),
  expect:{'flags.loaf':false,'flags.lt':false,'flags.busyNull':true,'asleep.pause':true,'asleep.noBox':true,stall:true,cannot:true} }
];
