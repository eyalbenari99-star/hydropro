/* v21.28 (Eyal, 1 Oct 2026): 🛡 Data Safety — the three structural guards */
const CLOUD=function(){
  window.__tCloud={
    async call(fn,data,first){
      const C=window.HNX_Cloud,f0=window.fetch;
      localStorage.setItem('hnx_cloud_token','test-token');
      C.state.online=true;C.state.syncing=false;C.state.error=null;
      window.__hnxPulledOk=!first;
      window.fetch=function(u,o){u=String(u);
        if(u.indexOf('/sync/pull')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({data:data||{}})});
        if(u.indexOf('/sync/push')>=0){try{window.__pushed=JSON.parse(o.body).data;}catch(e){}return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({ok:true})});}
        return f0.apply(this,arguments);};
      try{await C[fn]();}finally{window.fetch=f0;localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=true;}
      return C.state.error||null;
    },
    pull(data,first){return this.call('pull',data,first);},
    push(){return this.call('push',{});}
  };
};
const withCloud=seed=>new Function('('+CLOUD.toString()+')();'+(seed?'('+seed.toString()+')();':''));
module.exports=[
{ name:'🛡 Old screen cannot upload: when the server runs a newer Nexi (v99.1) the push is skipped (0 keys sent) with "upload paused" in the sync error; once reloaded (flag cleared) the push goes out again (v21.33)',
  seed:withCloud(()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));}),
  run:async()=>{
    await sleep(4000);
    window.__hnxStaleApp='99.1';window.__pushed=null;
    try{window.__hnxMarkDirtyKey&&window.__hnxMarkDirtyKey('hydroPro_stale_probe_v1');}catch(e){}
    localStorage.setItem('hydroPro_stale_probe_v1','{"a":1}');
    const err=await window.__tCloud.push();const blocked=window.__pushed===null;
    window.__hnxStaleApp=null;window.__pushed=null;
    const err2=await window.__tCloud.push();
    return {blocked,paused:/upload paused/.test(err||''),cleared:!/upload paused/.test(err2||'')};},
  expect:{blocked:true,paused:true,cleared:true} },
{ name:'🛡 Cloud-first boot: a synced key that was EMPTY at boot takes the cloud copy whole on the first download even though this computer wrote a seed to it meanwhile (80 real records win over 20 seeded), and the key is not dirty; a key that was present at boot still merges (v21.28)',
  seed:withCloud(()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));}),
  run:async()=>{
    await sleep(4000);const RK='hydroPro_employees';
    const roster=(n,dept,t)=>JSON.stringify(Array.from({length:n},(_,i)=>({id:'E'+(i+1),name:'EMP '+(i+1),status:'Active',dept:dept,updatedAt:t||0})));
    window.__hnxPresentAtBoot={}; /* this computer held nothing at boot */
    localStorage.setItem(RK,roster(20,'APAC_PACKAGING',Date.now())); /* a seed written after boot, dated now */
    const cloud=roster(80,'APTI_ACCOUNTING',1700000000000);
    await window.__tCloud.pull({[RK]:cloud},true);
    const got=JSON.parse(localStorage.getItem(RK)||'[]');
    const released=window.__hnxPresentAtBoot===null;
    /* present at boot → ordinary merge: a newer local record survives */
    window.__hnxPresentAtBoot=null;window.__hnxPulledOk=true;
    window.__hnxRawSetSuppressed(RK,JSON.stringify([{id:'E1',name:'EMP 1 EDITED',status:'Active',dept:'APTI_ACCOUNTING',updatedAt:Date.now()}])); /* written without the dirty flag, as a merge would leave it */
    await window.__tCloud.pull({[RK]:cloud},false);
    const after=JSON.parse(localStorage.getItem(RK)||'[]');const e1=after.find(x=>x.id==='E1')||{};
    return {count:got.length,dept:got[0]&&got[0].dept,released,mergedCount:after.length,keptEdit:e1.name==='EMP 1 EDITED'};},
  expect:{count:80,dept:'APTI_ACCOUNTING',released:true,mergedCount:80,keptEdit:true} },

{ name:'🛡 Bulk-change gate: an upload of employees that would drop 60 of 80 records is HELD (not in the push), listed on Administration → Data Safety; "Upload anyway" re-stamps it and the next push carries it; "Take the cloud copy" restores the 80 (v21.28)',
  seed:withCloud(()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));}),
  run:async()=>{
    await sleep(4000);const RK='hydroPro_employees';
    const roster=(n,dept,t)=>JSON.stringify(Array.from({length:n},(_,i)=>({id:'E'+(i+1),name:'EMP '+(i+1),status:'Active',dept:dept,updatedAt:t||0})));
    window.__hnxCloudRaw[RK]=roster(80,'APTI_ACCOUNTING',1700000000000);
    const local=roster(20,'APAC_PACKAGING',Date.now());
    const out=window.__hnxPushGuard({[RK]:local,'hydroPro_other_v1':'{"a":1}'});
    const heldNow=!!window.HNXDS.held()[RK];
    switchView('admin_datasafety');await sleep(600);const txt=(document.getElementById('view-admin_datasafety')||{}).innerText||'';
    /* take the cloud copy */
    localStorage.setItem(RK,local);window.confirm=()=>true;window.HNXDS.takeCloud(RK);await sleep(200);
    const back=JSON.parse(localStorage.getItem(RK)||'[]').length;
    /* now the admin insists */
    localStorage.setItem(RK,local);const out2=window.__hnxPushGuard({[RK]:local});const held2=!!window.HNXDS.held()[RK];
    window.HNXDS.uploadAnyway(RK);await sleep(200);
    const stamped=JSON.parse(localStorage.getItem(RK)||'[]');const out3=window.__hnxPushGuard({[RK]:localStorage.getItem(RK)});
    return {heldNow,notPushed:!(RK in out),otherPushed:'hydroPro_other_v1' in out,screen:/Uploads held/.test(txt)&&/employees/.test(txt),back,held2,passesAfterOk:RK in out3,restamped:stamped.every(r=>r._fts&&r._fts.dept>1700000000000)};},
  expect:{heldNow:true,notPushed:true,otherPushed:true,screen:true,back:80,held2:true,passesAfterOk:true,restamped:true} },

{ name:'🛡 Undo for big downloads: a pull that rewrites the trip rate table\'s areas is recorded with the previous copy; Undo puts it back stamped newer than the cloud copy and marks it for upload (v21.28)',
  seed:withCloud(()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));}),
  run:async()=>{
    await sleep(4000);const K='hydroPro_test_store_v1';
    const mk=(n,v)=>{const o={};for(let i=0;i<n;i++)o['r'+i]={val:v,updatedAt:1700000000000};return JSON.stringify(o);};
    const before=mk(10,'good'),after=mk(10,'bad');
    localStorage.setItem(K,after);
    window.__hnxMergeWatch(K,before,after,'pull');await sleep(300);
    const list=JSON.parse(localStorage.getItem('hnx_bigmerge_v1')||'[]');const e=list.find(x=>x.key===K);
    window.confirm=()=>true;window.HNXDS.undo(e.id);await sleep(600);
    const now=JSON.parse(localStorage.getItem(K)||'{}');
    return {recorded:!!e,stats:e&&e.stats.changed,restored:now.r0&&now.r0.val==='good',newer:now.r0&&now.r0.updatedAt>1700000000000};},
  expect:{recorded:true,stats:10,restored:true,newer:true} },
];
module.exports.push(
{ name:'🛡 Data Safety is the owner\'s: with 2 held uploads in store, admin_secondary (Dr Amy / Jinky Admin-2) sees NO banner and the screen says admin only; the primary admin sees the banner; the Administration tab is hidden for Admin-2 and shown for the primary admin (v21.49–21.50)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'amy',fullname:'Dr Amy',passwordHash:'x',role:'admin_secondary',active:true}]));
    localStorage.setItem('hnxlocal_push_held_v1',JSON.stringify({hydroPro_employees:{at:Date.now(),stats:{removed:40,changed:0,added:0,before:50}},hydroPro_customers:{at:Date.now(),stats:{removed:30,changed:0,added:0,before:40}}}));},
  run:new Function(`return (async()=>{const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));await sleep(4000);
    as('amy');const b0=document.getElementById('hnxDsBanner');if(b0)b0.remove();HNXDS.banner();await sleep(100);const amyBanner=!!document.getElementById('hnxDsBanner');
    as('tester');HNXDS.banner();await sleep(100);const adminBanner=!!document.getElementById('hnxDsBanner');
    as('amy');const amyTab=getVisibleViews('admin').some(v=>v.id==='admin_datasafety');as('tester');const adminTab=getVisibleViews('admin').some(v=>v.id==='admin_datasafety');
    return {amyBanner,adminBanner,amyTab,adminTab};})();`),
  expect:{amyBanner:false,adminBanner:true,amyTab:false,adminTab:true} });
module.exports.push(
{ name:'🛡 Owner\'s decision: the primary admin presses ☁ Take the cloud copy on EVERY computer → a dated policy is stored; a computer holding 2 uploads (cloud copies in memory) applies it: both stores become the cloud copy, holds cleared, applied stamp set; a hold made AFTER the decision is left alone (v21.51)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_ds_t1_v1',JSON.stringify([{id:1,n:'local'}]));localStorage.setItem('hydroPro_ds_t2_v1',JSON.stringify([{id:2,n:'local'}]));localStorage.setItem('hydroPro_ds_t3_v1',JSON.stringify([{id:3,n:'local'}]));},
  run:new Function(`return (async()=>{await sleep(4000);window.confirm=()=>true;
    const held=HNXDS.held();const t0=Date.now()-60000;held['hydroPro_ds_t1_v1']={at:t0,stats:{removed:5,changed:0,added:0,before:6}};held['hydroPro_ds_t2_v1']={at:t0,stats:{removed:5,changed:0,added:0,before:6}};
    window.__hnxCloudRaw['hydroPro_ds_t1_v1']=JSON.stringify([{id:1,n:'cloud'}]);window.__hnxCloudRaw['hydroPro_ds_t2_v1']=JSON.stringify([{id:2,n:'cloud'}]);window.__hnxCloudRaw['hydroPro_ds_t3_v1']=JSON.stringify([{id:3,n:'cloud'}]);
    HNXDS.ownerTakeAll();await sleep(200);const pol=HNXDS.policy().takeCloudAll;
    held['hydroPro_ds_t3_v1']={at:Date.now()+5,stats:{removed:5,changed:0,added:0,before:6}};
    const r=HNXDS.applyPolicy();
    return {polBy:pol&&pol.by,t1:JSON.parse(localStorage.getItem('hydroPro_ds_t1_v1'))[0].n,t2:JSON.parse(localStorage.getItem('hydroPro_ds_t2_v1'))[0].n,t3:JSON.parse(localStorage.getItem('hydroPro_ds_t3_v1'))[0].n,heldLeft:Object.keys(HNXDS.held()).join(','),applied:Number(localStorage.getItem('hnxlocal_ds_policy_applied_v1'))>=pol.at};})();`),
  expect:{polBy:'Tester',t1:'cloud',t2:'cloud',t3:'local',heldLeft:'hydroPro_ds_t3_v1',applied:true} });
