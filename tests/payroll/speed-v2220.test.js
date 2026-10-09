/* v22.20 (speed): the red stall box on a browser WITHOUT long-task / long-frame timing (Safari on Dr Amy's Mac, Firefox).
   The v22.17 draft filed every gap over 60 s there as "computer asleep?" — even a real freeze that Nexi's own job log
   (BB.longs: slow timers, jobs, observers) had recorded. Now that log is the evidence: 1.5 s or more of Nexi-logged,
   visible, dialog-free work in the gap is a STALL (box + inbox), checked before the "hidden" / "asleep" guesses.
   Entry types are simulated as unsupported in the seed (supportedEntryTypes without longtask / long-animation-frame). */
const H=`const BB=window.__hnxBB;
  const block=ms=>{const t=Date.now();while(Date.now()-t<ms){}};
  const nexiBusy=(from,to)=>{let t=0;(BB.longs||[]).forEach(e=>{t+=Math.max(0,Math.min(e.at+e.d,to)-Math.max(e.at,from));});return t;};`;
const fn=body=>new Function(`return (async()=>{${H}${body}})();`);
const noTiming=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));
  try{Object.defineProperty(PerformanceObserver,'supportedEntryTypes',{configurable:true,get:function(){return ['mark','measure','navigation','resource','paint'];}});}catch(e){}};
const REQ='window.hnxStallNexiBusyV2220===true';
module.exports=[
{ requires:REQ,
  name:'🧯 Stall v22.20: no long-task timing (Safari/Firefox) + a 3.5 s block inside a Nexi timer (v22.24: the box needs ≥ 3 s; was 2 s) + a 70 s heartbeat gap → a STALL (v22.17 draft: pause "computer asleep?") with 3400-4100 ms Nexi-logged busy, box "blocked 3-4 s", op "nexi.hog", culprit "cannot attribute · Nexi’s own jobs: … nexiHogForTest"; a 70 s gap with no Nexi work is still a pause "computer asleep?" with no box (v22.20)',
  seed:noTiming,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const flags={loaf:BB.loafOk,lt:BB.ltOk};
    /* no work: wait (≤ 120 s) until Nexi logged < 1.5 s of work in the last 71 s, then a 70 s gap must stay a pause */
    let quiet=false;for(let i=0;i<120;i++){const n=Date.now();if(nexiBusy(n-71000,n+400)<1500){quiet=true;break;}await sleep(1000);}
    const s0=BB.stalls.length;BB.mark('asleep.test','x');BB.checkGap(70000);await sleep(1600);
    const p=BB.pauses[BB.pauses.length-1]||{};
    const asleep={pause:BB.stalls.length===s0&&/asleep/.test(p.why||''),noBox:!document.getElementById('hnxStallBox'),nexiUnder:p.nexiBusyMs!=null&&p.nexiBusyMs<1500};
    /* a Nexi timer blocks 2 s (the speed doctor logs it in BB.longs), then the heartbeat reports a 70 s gap */
    BB.mark('nexi.hog','H');setTimeout(function nexiHogForTest(){block(3500);},0);await sleep(3900);
    const s1=BB.stalls.length;BB.checkGap(70000);await sleep(1600);
    const ev=BB.stalls[BB.stalls.length-1]||{};const box=document.getElementById('hnxStallBox');const cl=document.getElementById('hnxStallCulprit');
    return {flags,quiet,asleep,stall:BB.stalls.length===s1+1&&!ev.paused&&ev.unknownBusy===true,nexiMs:ev.nexiBusyMs>=3400&&ev.nexiBusyMs<=4100,nexiBusyMs:ev.nexiBusyMs,
      op:ev.op,blocked2:!!box&&/blocked [34] s/.test(box.textContent),cannot:!!cl&&/cannot attribute/.test(cl.textContent)&&/nexiHogForTest/.test(cl.textContent)};`),
  expect:{'flags.loaf':false,'flags.lt':false,quiet:true,'asleep.pause':true,'asleep.noBox':true,'asleep.nexiUnder':true,stall:true,nexiMs:true,op:'nexi.hog',blocked2:true,cannot:true} },
{ requires:REQ,
  name:'🧯 Stall v22.20: no long-task timing (Safari/Firefox) + a REAL 65 s freeze inside a Nexi timer (the real 3 s heartbeat, no checkGap) → a STALL with ≥ 60000 ms Nexi-logged busy, box "blocked 6x s" naming nexiFreezeForTest, 1 inbox report (v22.17 draft: pause "computer asleep? (this browser cannot tell)", no box, no report) (v22.20)',
  seed:noTiming,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const inb=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze'&&x.user==='eyal').length;
    BB.lastFiled=0;const i0=inb(),s0=BB.stalls.length,p0=BB.pauses.length;
    BB.mark('nexi.freeze','F');setTimeout(function nexiFreezeForTest(){block(65000);},0);await sleep(65500);
    for(let i=0;i<20&&BB.stalls.length===s0&&BB.pauses.length===p0;i++)await sleep(500);
    await sleep(1500);
    const ev=BB.stalls.slice(s0).find(e=>(e.nexiBusyMs||0)>=60000)||{};const pz=BB.pauses.slice(p0).find(e=>e.gapMs>=60000);
    const box=document.getElementById('hnxStallBox');const cl=document.getElementById('hnxStallCulprit');
    return {stall:!!ev.at&&ev.unknownBusy===true,nexi60:(ev.nexiBusyMs||0)>=60000,noAsleepPause:!pz,pauseWhy:pz?pz.why:'',
      blocked6x:!!box&&/blocked 6\\d s/.test(box.textContent),named:!!cl&&/nexiFreezeForTest/.test(cl.textContent),inbox:inb()-i0};`),
  expect:{stall:true,nexi60:true,noAsleepPause:true,pauseWhy:'',blocked6x:true,named:true,inbox:1} }
];
