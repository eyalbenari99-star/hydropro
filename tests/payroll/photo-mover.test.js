/* v22.13: photos really leave Nexi's data — the mover finished only ONE store per session, could not see photos inside
   compressed stores, and wrote back a copy read before the uploads (an edit made meanwhile was lost) */
module.exports=[
{ name:'📷 Photos v22.13: photos inside a COMPRESSED maintenance store and a second store all move to the cloud in one pass (3 uploads, 0 photos left), an edit saved while the uploads run is kept, and 🩺 Nexi Health counts what is still inside (by store, with the upload error) and 3 moved (v22.13)',
  seed:function(){localStorage.setItem('hnx_cloud_token','test-token');},
  run:async()=>{await sleep(2500);
    const nat=k=>Storage.prototype.getItem.call(localStorage,k)||'';
    const photo=i=>{const c=document.createElement('canvas');c.width=c.height=320;const x=c.getContext('2d');for(let y=0;y<320;y+=4)for(let z=0;z<320;z+=4){x.fillStyle='rgb('+((y*7+z*13+i*31)%255)+','+((y*z+i)%255)+','+((z*3+i*17)%255)+')';x.fillRect(z,y,4,4);}return c.toDataURL('image/jpeg',0.95);};
    const pad='n'.repeat(400000);
    localStorage.setItem('hydroPro_maint_tasks',JSON.stringify([{id:'mt1',title:'pump',status:'started',photos:[photo(1)],notes:pad},{id:'mt2',title:'valve',status:'started',photos:[photo(2)]},{id:'mt3',title:'old title',status:'started'}]));
    localStorage.setItem('hydroPro_test_photos_v1',JSON.stringify([{id:'x1',img:photo(3),notes:'m'.repeat(30000)}]));
    window.__hnxLzCompact&&window.__hnxLzCompact();
    const compressed=nat('hydroPro_maint_tasks').charCodeAt(0)===1&&nat('hydroPro_maint_tasks').indexOf('data:image/')<0;
    let uploads=0;const of=window.fetch;window.fetch=function(u,o){ if(String(u).indexOf('/r2/upload')>-1){if(/maint_tasks|test_photos/.test(decodeURIComponent(String(u))))uploads++; /* only this test's stores (the app's own R&D sample photos may move too) */return new Promise(r=>setTimeout(()=>r(new Response('{"ok":true}',{status:200,headers:{'Content-Type':'application/json'}})),400));} return of.apply(this,arguments); };
    window.__hnxAUTOVAULT.run();
    for(let i=0;i<100&&uploads<1;i++)await sleep(100);
    const ts=loadMaintTasks();ts.find(t=>t.id==='mt3').title='edited during upload';saveMaintTasks(ts);
    const L=()=>(window.hnxPhotoVault&&hnxPhotoVault.last)||{};
    for(let i=0;i<200&&!(L().hydroPro_maint_tasks&&L().hydroPro_test_photos_v1);i++)await sleep(100);
    const mt=localStorage.getItem('hydroPro_maint_tasks')||'',tp=localStorage.getItem('hydroPro_test_photos_v1')||'';
    const mtArr=JSON.parse(mt);
    window.__hnxGuardian.runNow();const H=JSON.parse(localStorage.getItem('hydroPro_health_v1')||'[]');const me=H.find(r=>r.id===localStorage.getItem('hnx_device_id'))||H[H.length-1]||{};
    const Lx=L();const leftAll=Object.keys(Lx).reduce((a,k)=>a+Math.max(0,(Lx[k].found||0)-(Lx[k].moved||0)),0);
    return {healthMatches:me.photosLeft===leftAll,ourStoresClear:!/maint_tasks|test_photos/.test(me.photoStores||''),failuresNamed:!leftAll||!!me.photoErr,compressed,uploads,leftInMaint:(mt.match(/data:image\//g)||[]).length,linksInMaint:(mt.match(/r2img:/g)||[]).length,secondStore:/r2img:/.test(tp)&&tp.indexOf('data:image/')<0,
      editKept:(mtArr.find(t=>t.id==='mt3')||{}).title,healthMoved:me.photosMoved,mover:me.photoMover};},
  expect:{healthMatches:true,ourStoresClear:true,failuresNamed:true,compressed:true,uploads:3,leftInMaint:0,linksInMaint:2,secondStore:true,editKept:'edited during upload',healthMoved:3,mover:'on'} }
];
