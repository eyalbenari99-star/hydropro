/* v22.03: a stall the page survives is reported on screen */
/* v22.17: deterministic. The black box names "the last operation that started BEFORE the block", and it places the block's start
   at most 3.5 s after the last 3-s heartbeat (cut = now − gap + 3.5 s). The old setup marked, blocked 2 s, then reported a 9.5 s gap —
   a gap that began 7.5 s BEFORE the mark, so the mark was never "before the block" and the case only passed when the 8-entry ring
   happened to hold nothing older than 6 s (the fallback = latest mark). On a quieter machine (GitHub CI) an older timer/job mark was
   named instead: box false, stall false. Now the block is real AND consistent with the reported gap: start right after a heartbeat,
   mark, block 6 s, report 9.5 s (cut = now − 6 s ≥ the mark), so the real heartbeat sees only ~6 s and adds no second stall. */
module.exports=[
{ name:'🧯 Stall v22.03: a 9.5 s gap whose 6 s block starts right after a mark (lined up with the 3 s heartbeat) shows the red stall box naming that operation and files a 🧯 Stall inbox item for eyal (v22.03; v22.17 deterministic)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'meajean',fullname:'Mea',passwordHash:'x',role:'supervisor',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'meajean',loginAt:Date.now()}));},
  run:async()=>{await sleep(4000);const BB=window.__hnxBB;
    /* wait for Nexi's own 3-s heartbeat (it stamps hnxlocal_bb_end_v1) so the block begins right after it, as a real stall would */
    const beat=()=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,'hnxlocal_bb_end_v1');const b0=beat();for(let i=0;i<160&&beat()===b0;i++)await sleep(25);
    BB.mark('test.block','hydroPro_demo');{const t=Date.now();while(Date.now()-t<6000){}} /* v22.14: a real block — a gap the browser saw no work in is a pause, not a stall */
    const p0=BB.pauses.length;BB.checkGap(9500);
    for(let i=0;i<60&&!BB.stalls.length&&BB.pauses.length===p0;i++)await sleep(100); /* the verdict comes 1.2 s later, once the browser's timing entries are in */
    const box=document.getElementById('hnxStallBox');const ib=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze'&&/Stall/.test(x.title));
    return {box:!!box&&/test\.block/.test(box.textContent)&&/hydroPro_demo/.test(box.textContent),stall:window.__hnxBB.stalls.length>=1&&window.__hnxBB.stalls[0].op==='test.block',inbox:ib.some(x=>x.user==='eyal'&&/test\.block/.test(x.body))};},
  expect:{box:true,stall:true,inbox:true} }
];
