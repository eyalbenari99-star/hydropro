/* v21.36 (Eyal, 1 Oct 2026: "why in the pc, not in the cloud"): the daily automatic backup is also uploaded to the cloud archive */
module.exports=[
{ name:'☁ Daily backup to the cloud: the auto-backup payload is uploaded once a day per device to archives/hydroPro_autobackup_<date>_<device>.json with the Bearer token; this device\'s copies older than 30 days are deleted (1 of 3 listed), other devices\' and fresh copies are kept; a second call the same day does not upload; force does (v21.36)',
  seed:function(){localStorage.setItem('hnx_cloud_token','test-token');localStorage.setItem('hnx_device_id','dev_abc123');},
  run:async()=>{
    await sleep(3000);
    const calls=[];const f0=window.fetch;
    window.fetch=(u,o)=>{u=String(u);calls.push({u,method:(o&&o.method)||'GET',auth:o&&o.headers&&o.headers.Authorization,len:o&&o.body?o.body.length:0});
      if(u.indexOf('/r2/list')>=0)return Promise.resolve(new Response(JSON.stringify({files:[{key:'archives/hydroPro_autobackup_2026-08-01_dev_abc123.json'},{key:'archives/hydroPro_autobackup_2026-08-01_dev_other.json'},{key:'archives/hydroPro_autobackup_2026-09-30_dev_abc123.json'}]}),{status:200}));
      return Promise.resolve(new Response('{"ok":true}',{status:200}));};
    const payload={exportedAt:Date.now(),source:'auto-daily',data:{'hydroPro_employees':'[{"id":"E1"}]'}};
    const r1=await window.hnxAutoBackupCloud(payload,'2026-10-01');
    const up=calls.filter(c=>c.u.indexOf('/r2/upload')>=0)[0]||{};const dels=calls.filter(c=>c.method==='DELETE').map(c=>decodeURIComponent(c.u.split('key=')[1]));
    const body=JSON.parse(JSON.stringify(payload));
    const r2=await window.hnxAutoBackupCloud(payload,'2026-10-01');
    const before=calls.length;const r3=await window.hnxAutoBackupCloud(payload,'2026-10-01',true);const after=calls.filter(c=>c.u.indexOf('/r2/upload')>=0).length;
    window.fetch=f0;
    return {ok:r1.ok,key:r1.key,removed:r1.removed,upKey:decodeURIComponent((up.u||'').split('key=')[1].split('&')[0]),auth:up.auth,bodyHasRoster:up.len>60,dels:dels.join('|'),mark:localStorage.getItem('hnxlocal_autobackup_cloud_v1'),second:r2.ok,why:r2.why,forcedUploads:after};},
  expect:{ok:true,key:'archives/hydroPro_autobackup_2026-10-01_dev_abc123.json',removed:1,upKey:'archives/hydroPro_autobackup_2026-10-01_dev_abc123.json',auth:'Bearer test-token',bodyHasRoster:true,dels:'archives/hydroPro_autobackup_2026-08-01_dev_abc123.json',mark:'2026-10-01',second:false,why:'already uploaded today',forcedUploads:2} },
];
