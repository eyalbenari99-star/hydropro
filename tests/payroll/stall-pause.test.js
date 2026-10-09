/* v22.14: the red stall box never blocks the screen, and a late heartbeat with no real work (window hidden / covered, computer asleep) is not a stall */
module.exports=[
{ name:'🧯 Stall v22.14: a 10 s gap the browser saw NO work in (window covered / asleep) shows no box, files no inbox item and is kept as a pause; a gap in which the window was hidden 3 s is a pause too (v22.14, v22.17)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));},
  run:async()=>{await sleep(4000);const BB=window.__hnxBB;
    /* wait for a genuinely quiet moment — the app is still busy loading ~30 s after start, and a gap with real work in it IS a stall */
    try{window.HNX_LITE.set(true,true);}catch(e){} /* as on every office PC (Lite is on by default outside the test harness): animations paused */
    let quiet=false;for(let i=0;i<60;i++){const n=Date.now();if(BB.busyMs(n-14000,n)<500){quiet=true;break;}await sleep(1000);}
    const s0=BB.stalls.length;
    const inb=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze').length;const i0=inb();
    BB.mark('quiet.test','x');BB.checkGap(10000);await sleep(1600);
    const noBox=!document.getElementById('hnxStallBox');
    /* v22.17: the window hidden for 3 s of a 10 s gap (nothing else running) is a pause labelled hidden. v22.14 also called a REAL 2 s
       block a pause just because a visibilitychange landed in the gap — that was finding 24 (now a stall, see stall-v2217.test.js) */
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));await sleep(3000);delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));BB.checkGap(10000);await sleep(1600);
    const last=BB.pauses[BB.pauses.length-1]||{};
    return {quiet,noBox,noBoxAfterHidden:!document.getElementById('hnxStallBox'),stallsUnchanged:BB.stalls.length===s0,pauses:BB.pauses.length>=2,hiddenFlag:!!last.hidden,inboxUnchanged:inb()===i0};},
  expect:{quiet:true,noBox:true,noBoxAfterHidden:true,stallsUnchanged:true,pauses:true,hiddenFlag:true,inboxUnchanged:true} },
{ name:'🧯 Stall v22.14: a REAL 3.5 s block (v22.24: the box needs ≥ 3 s; was 2.5 s) shows the box at the BOTTOM-LEFT, clicks pass through it to the screen underneath (a Payroll menu stays clickable), ✕ closes it, and a second box closes by itself after 25 s (v22.14)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin_secondary',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'jinky',loginAt:Date.now()}));},
  run:async()=>{await sleep(4000);const BB=window.__hnxBB;
    const btn=document.createElement('button');btn.id='payTestBtn';btn.textContent='Labor Payroll';btn.style.cssText='position:fixed;left:20px;bottom:20px;z-index:1000;width:300px;height:60px;z-index:2147482000';let clicked=0;btn.onclick=()=>clicked++;document.body.appendChild(btn);
    BB.mark('real.block','payroll');{const t=Date.now();while(Date.now()-t<3500){}} BB.checkGap(9000);await sleep(1600);
    const box=document.getElementById('hnxStallBox');const r=box?box.getBoundingClientRect():{left:9999,bottom:0,top:0,width:0,height:0};
    const pe=box?getComputedStyle(box).pointerEvents:'';const br=btn.getBoundingClientRect();const cx=br.left+br.width/2,cy=br.top+br.height/2;
    let overlaps=false;if(box){const mx=r.left+r.width/2,my=r.top+r.height/2;box.style.pointerEvents='auto';const hitOn=document.elementFromPoint(mx,my);const wouldCatch=!!hitOn&&(hitOn===box||box.contains(hitOn));box.style.pointerEvents='none';const hitOff=document.elementFromPoint(mx,my);overlaps=wouldCatch&&!!hitOff&&hitOff!==box&&!box.contains(hitOff);}const under=document.elementFromPoint(cx,cy);if(under)under.click();
    const corner=r.left<40&&r.bottom>innerHeight-40;const passThrough=pe==='none'&&under===btn&&clicked===1;
    const x=document.getElementById('hnxStallBoxX');if(x)x.click();const closed=!document.getElementById('hnxStallBox');
    BB.mark('real.block2','payroll');{const t=Date.now();while(Date.now()-t<3500){}} BB.checkGap(9000);await sleep(1600);const again=!!document.getElementById('hnxStallBox');
    await sleep(25500);const autoGone=!document.getElementById('hnxStallBox');
    return {overlaps:!!overlaps,pe,shown:!!box,corner,passThrough,closed,again,autoGone,notTall:r.height<=innerHeight*0.36};},
  expect:{overlaps:true,pe:'none',shown:true,corner:true,passThrough:true,closed:true,again:true,autoGone:true,notTall:true} }
];
