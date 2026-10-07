/* v22.03: automatic storage rescue */
module.exports=[
{ name:'🚑 Rescue v22.03: with a stray 800 KB QuickBooks cache, 1 MB of old backups and a 600 KB raw store filling the browser, hnxStorageRescue() deletes the regenerable copies, keeps the real store, queues it to the worker (compressed within 30 s, same content) and files a 🚑 inbox line for eyal (v22.03)',
  seed:function(){const big=n=>JSON.stringify(Array.from({length:n},(_,i)=>({id:i,v:'z'.repeat(200)+i})));
    localStorage.setItem('hydroPro_acct_qb_monthly_v1',big(3800));localStorage.setItem('hydroPro_backup_20260901',big(2400));localStorage.setItem('hydroPro_autobackup_20260902',big(2400));localStorage.setItem('hydroPro_rescue_2026-10-06T10',big(1000));
    localStorage.setItem('hydroPro_rsc_real',big(2800));localStorage.setItem('hnxlocal_photo_shrink_v1','1');
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'admin',fullname:'A',passwordHash:'x',role:'admin',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'admin',loginAt:Date.now()}));},
  run:async()=>{await sleep(3000);const nat=k=>Storage.prototype.getItem.call(localStorage,k);const before=localStorage.getItem('hydroPro_rsc_real');
    const r=window.hnxStorageRescue();let comp=false;for(let i=0;i<60;i++){const v=nat('hydroPro_rsc_real')||'';if(v.indexOf('\u0001LZ\u0001')===0){comp=true;break;}await sleep(500);}
    const ib=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='storage'&&x.user==='eyal');
    return {ran:!!r&&!r.skipped,qbGone:nat('hydroPro_acct_qb_monthly_v1')===null,backupsGone:nat('hydroPro_backup_20260901')===null&&nat('hydroPro_autobackup_20260902')===null&&nat('hydroPro_rescue_2026-10-06T10')===null,
      realKept:localStorage.getItem('hydroPro_rsc_real')===before,comp,queued:r&&r.queued>=1,inbox:ib.length>=1};},
  expect:{ran:true,qbGone:true,backupsGone:true,realKept:true,comp:true,queued:true,inbox:true} }
];
