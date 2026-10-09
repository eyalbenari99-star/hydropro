/* v22.24 (Eyal, 9 Oct 2026 — screenshots "Nexi was blocked 3806 s" after the laptop slept, "blocked 13 s" with a yes/no box open,
   "blocked 12 s" for a 1–2 s click on the Irrigation menu): the red box is for real freezes only. A sleep (wall clock jumps while the
   page clock stands still), a page the browser froze and resumed, or any heartbeat gap over 5 minutes is a pause, never a stall —
   even when work ran right after waking; a freeze under 3 s is still kept as a stall but shows no box and files no inbox report. */
const H=`const BB=window.__hnxBB;
  const block=ms=>{const t=Date.now();while(Date.now()-t<ms){}};
  const waitQuiet=async()=>{for(let i=0;i<60;i++){const n=Date.now();if(BB.busyMs(n-14000,n)<500)return true;await sleep(1000);}return false;};
  const inb=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze').length;`;
const fn=body=>new Function(`return (async()=>{${H}${body}})();`);
const jinky=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));};
const REQ="window.__hnxBB&&window.__hnxBB.boxMinMs===3000";
module.exports=[
{ requires:REQ,
  name:'🧯 Stall box v22.24: a 2 s freeze in a 9 s gap is kept as a STALL (≥ 1500 ms busy, marked small) with NO red box and NO inbox report; a 3.5 s freeze shows the box "blocked 3-4 s" and files 1 report per person (v22.24)',
  seed:jinky,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const quiet=await waitQuiet();const s0=BB.stalls.length,i0=inb();
    BB.mark('short.block','A');block(2000);BB.checkGap(9000);await sleep(1600);
    const a=BB.stalls[BB.stalls.length-1]||{};
    const A={stall:BB.stalls.length===s0+1&&a.op==='short.block',busy:a.busyMs>=1500,small:a.small===true,noBox:!document.getElementById('hnxStallBox'),noReport:inb()===i0};
    const quiet2=await waitQuiet();BB.lastFiled=0;const s1=BB.stalls.length,i1=inb();
    BB.mark('long.block','B');block(3500);BB.checkGap(9000);await sleep(1600);
    const b=BB.stalls[BB.stalls.length-1]||{};const box=document.getElementById('hnxStallBox');
    const B={stall:BB.stalls.length===s1+1&&b.op==='long.block',notSmall:!b.small,box:!!box&&/blocked [34] s/.test(box.textContent)&&/long\\.block/.test(box.textContent),reported:inb()>i1};
    return {quiet,quiet2,A,B,nums:[a.busyMs,b.busyMs]};`),
  expect:{quiet:true,quiet2:true,'A.stall':true,'A.busy':true,'A.small':true,'A.noBox':true,'A.noReport':true,'B.stall':true,'B.notSmall':true,'B.box':true,'B.reported':true} },
{ requires:REQ,
  name:'🧯 Stall box v22.24: the 3806 s laptop-sleep case — a 3806 s heartbeat gap in which the page clock moved 3 s, with a 3.5 s burst of work right after waking, is a pause "computer asleep (the clock jumped 3803 s)" with no stall, no box, no report; a 400 s gap is a pause "away or asleep 7 min"; a page the browser froze and resumed inside a 20 s gap is a pause (v22.24)',
  seed:jinky,
  run:fn(`await sleep(4000);try{window.HNX_LITE.set(true,true);}catch(e){}
    const quiet=await waitQuiet();const s0=BB.stalls.length,i0=inb();
    BB.mark('wake.burst','A');block(3500);BB.checkGap(3806000,3000);await sleep(1600);
    const p1=BB.pauses[BB.pauses.length-1]||{};
    const sleepGap={pause:!!p1.paused&&/computer asleep \\(the clock jumped 3803 s\\)/.test(p1.why||''),noStall:BB.stalls.length===s0,noBox:!document.getElementById('hnxStallBox'),noReport:inb()===i0};
    await waitQuiet();
    BB.mark('away.burst','B');block(3500);BB.checkGap(400000);await sleep(1600);
    const p2=BB.pauses[BB.pauses.length-1]||{};
    const away={pause:/away or asleep 7 min/.test(p2.why||''),noStall:BB.stalls.length===s0,noBox:!document.getElementById('hnxStallBox')};
    await waitQuiet();
    window.dispatchEvent(Object.assign(new Event('pageshow'),{persisted:true}));try{document.dispatchEvent(new Event('resume'));}catch(e){}
    BB.mark('resume.burst','C');block(3500);BB.checkGap(20000);await sleep(1600);
    const p3=BB.pauses[BB.pauses.length-1]||{};
    const resumed={pause:/froze the page and resumed/.test(p3.why||''),noStall:BB.stalls.length===s0,noBox:!document.getElementById('hnxStallBox')};
    return {quiet,sleepGap,away,resumed,why:[p1.why,p2.why,p3.why]};`),
  expect:{quiet:true,'sleepGap.pause':true,'sleepGap.noStall':true,'sleepGap.noBox':true,'sleepGap.noReport':true,'away.pause':true,'away.noStall':true,'away.noBox':true,'resumed.pause':true,'resumed.noStall':true,'resumed.noBox':true} }
];
