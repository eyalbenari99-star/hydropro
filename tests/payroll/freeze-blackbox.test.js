/* v22.00: freeze black box — a previous session that died inside an operation is reported at the next start */
module.exports=[
{ name:'🧯 Freeze v22.00: when the last session died inside «sync.merge hydroPro_calls» (mark newer than the last heartbeat), the next start files a 🧯 Freeze report in the inbox for eyal, admin and amy naming that operation; with two freezes in the same op, safe start skips it (v22.00)',
  seed:function(){localStorage.setItem('hnxlocal_bb_v1','sync.merge|'+(Date.now()-60000)+'|hydroPro_calls');localStorage.setItem('hnxlocal_bb_end_v1',String(Date.now()-90000));localStorage.setItem('hnxlocal_bb_hist_v1',JSON.stringify([{op:'sync.merge',at:Date.now()-900000}]));
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'meajean',fullname:'Mea',passwordHash:'x',role:'supervisor',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'meajean',loginAt:Date.now()}));},
  run:async()=>{await sleep(10000);const ib=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze');
    const end=+localStorage.getItem('hnxlocal_bb_end_v1');
    return {users:ib.map(x=>x.user).sort().join(','),names:ib.every(x=>/sync\.merge/.test(x.body)&&/hydroPro_calls/.test(x.body)),skip:window.__hnxBB.skipping('sync.merge'),froze:window.__hnxBB.froze.op,heartbeat:Date.now()-end<5000};},
  expect:{users:'admin,amy,eyal',names:true,skip:true,froze:'sync.merge',heartbeat:true} }
];
