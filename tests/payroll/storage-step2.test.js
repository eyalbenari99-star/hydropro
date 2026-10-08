/* v22.17 — Step 2.0 "stop deleting and losing": nothing is cut or skipped silently any more */
const VSEED=function(){ localStorage.setItem('hnx_v285_cleanup_done','1');
  var STUB='\u0001VAULT\u0001';
  var D={hydroPro_attendance:JSON.stringify({'2026-09-01':{QA:{status:'present',timeIn:'07:00',timeOut:'17:00',pad:new Array(300000).join('a')}}}),
    hydroPro_payroll_runs:JSON.stringify([{id:'RUN_Q1',status:'approved',pad:new Array(200000).join('b')}]),
    hydroPro_hr_201_docs:JSON.stringify([{id:'DOC_Q1',name:'contract.pdf',data:'data:application/pdf;base64,'+new Array(400000).join('P')}]),
    hydroPro_acct_qb_v1:JSON.stringify({cache:new Array(300000).join('q')})};
  Object.keys(D).forEach(function(k){localStorage.setItem(k,STUB);});
  window.__seedVault=D;
  var r=indexedDB.open('hnx_backups',1);r.onupgradeneeded=function(e){var db=e.target.result;if(!db.objectStoreNames.contains('b'))db.createObjectStore('b');};
  r.onsuccess=function(e){var db=e.target.result,tx=db.transaction('b','readwrite'),st=tx.objectStore('b');Object.keys(D).forEach(function(k){st.put(D[k],'vault:'+k);});};
  localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'QA',name:'Qa Tester',status:'Active'}]));
};
module.exports=[
{ name:'🔀 Merge v22.17: a list keyed by plateNo (no id) — this computer ABC1 km 1 + ABC2, the cloud ABC1 km 5 (newer) + ABC3 — merges to 3 vehicles with ABC1 at km 5 (it merged to [] and wiped both copies); an empId list with repeated empIds keeps this computer’s 2 rows (was []) (v22.17)',
  run:async()=>{await sleep(1000);const M=window.__hnxMergeGeneric;
    const a=JSON.parse(M('hydroPro_q_vehicles',JSON.stringify([{plateNo:'ABC1',km:1,updatedAt:1000},{plateNo:'ABC2',km:2,updatedAt:1000}]),JSON.stringify([{plateNo:'ABC1',km:5,updatedAt:2000},{plateNo:'ABC3',km:3,updatedAt:1000}]))||'null')||[];
    const b=JSON.parse(M('hydroPro_q_leave_rows',JSON.stringify([{empId:'E1',d:'2026-09-01'},{empId:'E1',d:'2026-09-02'}]),JSON.stringify([{empId:'E1',d:'2026-09-01'}]))||'null');
    const c=JSON.parse(M('hydroPro_q_ids',JSON.stringify([{id:'A',v:1,updatedAt:1},{v:'no id here'}]),JSON.stringify([{id:'A',v:2,updatedAt:2}]))||'null')||[];
    return {vehicles:a.map(x=>x.plateNo).sort().join(','),abc1:(a.find(x=>x.plateNo==='ABC1')||{}).km,leaveRows:b==null?'kept local':b.length,idless:c.some(x=>x.v==='no id here'),idA:(c.find(x=>x.id==='A')||{}).v};},
  expect:{vehicles:'ABC1,ABC2,ABC3',abc1:5,leaveRows:2,idless:true,idA:2} },
{ name:'🗄 Clean-up v22.17: on a computer that is not full, the v55 clean-up no longer deletes the manual backup, a _bak_v2 copy, an _old_ copy or a v33 store 2 s after start and every 5 minutes (it ran on every computer whatever the storage level) (v22.17)',
  seed:function(){ localStorage.setItem('hnx_v285_cleanup_done','1'); window.__who=[];try{var __R=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){ if(/^hydroPro_backup_/.test(String(k))) window.__who.push(String(k).slice(16,40)+' @'+(performance.now()|0)+'ms: '+(new Error().stack||'').split('\n').slice(2,6).map(function(x){return x.trim().slice(0,90);}).join(' < ')); return __R.call(this,k); };}catch(e){}
    localStorage.setItem('hydroPro_backup_manual_2026-10-08',JSON.stringify({keep:new Array(3000).join('k')}));
    localStorage.setItem('hydroPro_issues_bak_v2','[{"id":"B1"}]');localStorage.setItem('hydroPro_matrix_old_1','{"x":1}');localStorage.setItem('hydroPro_v33_notes','["n1"]'); },
  run:async()=>{await sleep(4000);const nat=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k);
    return {manual:(localStorage.getItem('hydroPro_backup_manual_2026-10-08')||'').length>1000, /* decoded: the idle compressor may have compressed it */bak:nat('hydroPro_issues_bak_v2')!=null,old:nat('hydroPro_matrix_old_1')!=null,v33:nat('hydroPro_v33_notes')!=null,deletedBy:window.__who};}, /* deletedBy names the code that removed a backup key (it happened only on the CI runners) */
  expect:{manual:true,bak:true,old:true,v33:true,deletedBy:[]} },

{ name:'🗄 Daily backup v22.17: attendance (300 K) and payroll runs (200 K) kept in the device database ARE in the daily backup, read through the vault (not the 7-char placeholder); HR scans (400 K PDF) and the QuickBooks cache are still left out (v21.19 dropped all four) (v22.17)',
  seed:VSEED,
  run:async()=>{for(let i=0;i<60;i++){if(window.__hnxAUTOVAULT&&__hnxAUTOVAULT.ready())break;await sleep(500);}await sleep(1000);const d=window.hnxCollectBackupData();const cur={att:localStorage.getItem('hydroPro_attendance'),runs:localStorage.getItem('hydroPro_payroll_runs')};
    return {att:d.hydroPro_attendance===cur.att&&/QA/.test(cur.att)&&cur.att.length>290000,runs:d.hydroPro_payroll_runs===cur.runs&&/RUN_Q1/.test(cur.runs),
      noScans:!('hydroPro_hr_201_docs' in d),noQb:!('hydroPro_acct_qb_v1' in d),noStub:Object.keys(d).every(k=>d[k]!=='\u0001VAULT\u0001'),emp:!!d.hydroPro_employees};},
  expect:{att:true,runs:true,noScans:true,noQb:true,noStub:true,emp:true} },

{ name:'🗄 Safety backup v22.17: on a FULL browser store, the backup taken before “Wipe Attendance” still succeeds — it goes to the device database (the browser keeps a pointer under 1 K), no older backup is deleted to make room, and it reads back whole from the device database (Dr Amy: it failed silently and the wipe ran anyway) (v22.17)',
  seed:VSEED,
  run:async()=>{for(let i=0;i<60;i++){if(window.__hnxAUTOVAULT&&__hnxAUTOVAULT.ready())break;await sleep(500);}await sleep(1000);
    const old=createBackup('manual',{label:'older manual'});await sleep(800);
    const ns=(k,v)=>window.__hnxNS.call(localStorage,k,v);const chunk=new Array(250000).join('f');try{for(let i=0;i<40;i++)ns('zz_fill_'+i,chunk);}catch(e){}const small=new Array(20000).join('g');try{for(let j=0;j<200;j++)ns('zz_fillsmall_'+j,small);}catch(e){}
    const attNow=localStorage.getItem('hydroPro_attendance');const meta=backupBeforeAction('Wipe Attendance');
    for(let j=0;j<40;j++)localStorage.removeItem('zz_fill_'+j);for(let j=0;j<200;j++)localStorage.removeItem('zz_fillsmall_'+j);
    await sleep(1500);const nat=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k)||'';
    const ptr=meta?nat('hydroPro_backup_'+meta.id):'';window._bkMem={}; /* forget this session's copy: read it from the device database */
    const w=meta?await getBackupAsync(meta.id):null;const wOld=old?await getBackupAsync(old.id):null;
    return {made:!!meta,pointerSmall:ptr.length>0&&ptr.length<1000&&ptr.indexOf('"idb":1')>=0,fromDb:!!(w&&w.data),att:!!(w&&w.data&&w.data.hydroPro_attendance===attNow&&attNow.length>290000),
      olderKept:!!(wOld&&wOld.data),inIndex:loadBackupIndex().some(b=>meta&&b.id===meta.id)};},
  expect:{made:true,pointerSmall:true,fromDb:true,att:true,olderKept:true,inIndex:true} },

{ name:'🗄 Restore v22.17: restoring a safety backup puts attendance back and KEEPS the HR scans that live only in the device database (the old restore removed every store the backup did not hold — the 201 file PDFs included) (v22.17)',
  seed:VSEED,
  run:async()=>{for(let i=0;i<60;i++){if(window.__hnxAUTOVAULT&&__hnxAUTOVAULT.ready())break;await sleep(500);}await sleep(1000);
    const attNow=localStorage.getItem('hydroPro_attendance');const meta=createBackup('manual',{label:'restore probe'});await sleep(800);
    localStorage.setItem('hydroPro_attendance',JSON.stringify({'2026-09-02':{QA:{status:'absent'}}}));
    const w=await getBackupAsync(meta.id);const r=restoreBackup(meta.id,{wrapper:w,skipPreRestore:true});await sleep(500);
    return {ok:!!r.ok,attBack:localStorage.getItem('hydroPro_attendance')===attNow&&attNow.length>290000,scansKept:localStorage.getItem('hydroPro_hr_201_docs')===window.__seedVault.hydroPro_hr_201_docs};},
  expect:{ok:true,attBack:true,scansKept:true} },

{ name:'☁ Upload v22.17: when the cloud stores every key but one (too big), that one stays “unsent” on this computer and the sync line names it; the keys the cloud stored are cleared as before (the old code cleared all, so the next download replaced the only full copy) (v22.17)',
  seed:function(){ localStorage.setItem('hnx_cloud_token','t');window.__pushes=[];
    const cloud={'hydroPro_memos':'[]'};const of=window.fetch;
    window.fetch=function(u,o){u=String(u);
      if(u.indexOf('/sync/pull')>=0)return Promise.resolve(new Response(JSON.stringify({ok:true,data:cloud}),{status:200}));
      if(u.indexOf('/sync/push')>=0){let keys=[],skipped=[];try{const d=JSON.parse(o.body).data;window.__pushes.push(Object.keys(d));Object.keys(d).forEach(k=>{if(k==='hydroPro_qbig_store')skipped.push({key:k,size:String(d[k]).length,why:'too-big'});else{keys.push(k);cloud[k]=d[k];}});}catch(e){}
        return Promise.resolve(new Response(JSON.stringify({ok:true,written:keys.length,keys:keys,skipped:skipped}),{status:200}));}
      if(u.indexOf('hnx-sync')>=0)return Promise.resolve(new Response('{"ok":true,"data":{}}',{status:200}));
      return of.apply(this,arguments);}; },
  run:async()=>{for(let i=0;i<60;i++){if(window.__hnxPulledOk)break;await sleep(500);}for(let i=0;i<40;i++){if(__pushes.length)break;await sleep(500);}await sleep(10000);
    localStorage.setItem('hydroPro_qbig_store',JSON.stringify([{id:'Q1',updatedAt:Date.now()}]));localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'EVT_Q',module:'hr',title:'q',date:'2026-10-01',updatedAt:Date.now()}]));
    let seen=false;for(let i=0;i<60;i++){if(__pushes.slice(1).some(p=>p.indexOf('hydroPro_qbig_store')>=0)){seen=true;break;}await sleep(500);}await sleep(1500);
    const dirty=JSON.parse((window.__hnxNG||Storage.prototype.getItem).call(localStorage,'hnxlocal_dirty_v1')||'{}');const st=(window.HNX_Cloud&&HNX_Cloud.state)||{};
    return {pushed:seen,bigUnsent:!!dirty.hydroPro_qbig_store,otherCleared:!dirty.hydroPro_cal_events_v2,named:/qbig_store/.test(String(st.error||'')),skippedList:(window.__hnxPushSkipped||[]).map(x=>x.k)};},
  expect:{pushed:true,bigUnsent:true,otherCleared:true,named:true,skippedList:['hydroPro_qbig_store']} },

{ name:'📦 Census v22.17: hnxStoreCensus() shows where each store lives — attendance, payroll runs and scans in the device database with their size, the browser-store total, compressed / raw counts — and 🩺 Health carries a one-line summary per computer (v22.17)',
  seed:VSEED,
  run:async()=>{for(let i=0;i<60;i++){if(window.__hnxAUTOVAULT&&__hnxAUTOVAULT.ready())break;await sleep(500);}await sleep(1500);const c=window.hnxStoreCensus();const att=c.stores.find(x=>x.k==='hydroPro_attendance')||{};
    window.__hnxGuardian.runNow();const h=JSON.parse(localStorage.getItem('hydroPro_health_v1')||'[]');const mine=h.find(r=>r.id===(window.__hnxNG||Storage.prototype.getItem).call(localStorage,'hnx_device_id'))||{};
    return {vaulted:c.vaulted>=4,attWhere:att.where,attBig:(att.k_db||0)>=290,browserNum:typeof c.browserK==='number'&&c.browserK<c.limitK,hasLimit:c.limitK>2000,health:/device db/.test(mine.census||'')};},
  expect:{vaulted:true,attWhere:'device-db',attBig:true,browserNum:true,hasLimit:true,health:true} },
{ name:'🚑 Backups v22.17: manual backups still held whole in the browser store are MOVED to the device database, not deleted — a 9-day-old one by the start-up janitor (it deleted every backup older than 7 days at every start) and today’s one by the storage rescue; the older of two pre-action backups is not deleted by the 10-minute pruner, and the backup INDEX survives (the pruner deleted it — it sorts before the pre-action keys); the browser keeps a pointer under 1 K for each and 💾 Backups reads all back whole (v22.17)',
  seed:function(){ localStorage.setItem('hnx_v285_cleanup_done','1'); window.__who=[];try{var __R=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){ if(/^hydroPro_backup_/.test(String(k))) window.__who.push(String(k).slice(16,40)+' @'+(performance.now()|0)+'ms: '+(new Error().stack||'').split('\n').slice(2,6).map(function(x){return x.trim().slice(0,90);}).join(' < ')); return __R.call(this,k); };}catch(e){}
    var td=new Date().toISOString().slice(0,10), mk=function(id){ return {meta:{id:id,reason:'manual',label:'Manual backup by admin',createdAt:new Date().toISOString()},data:{hydroPro_employees:JSON.stringify([{id:'QA',name:'Qa Tester',pad:new Array(900000).join('e')}])}}; };
    var a=mk('manual_2026-09-29T08'), b=mk('manual_'+td+'T01');
    var c=mk('pre-action_'+td+'T00-00-01'), d=mk('pre-action_'+td+'T00-00-02'); c.meta.reason=d.meta.reason='pre-action';
    localStorage.setItem('hydroPro_backup_manual_2026-09-29T08',JSON.stringify(a));localStorage.setItem('hydroPro_backup_manual_'+td+'T01',JSON.stringify(b));
    localStorage.setItem('hydroPro_backup_pre-action_'+td+'T00-00-01',JSON.stringify(c));localStorage.setItem('hydroPro_backup_pre-action_'+td+'T00-00-02',JSON.stringify(d));
    localStorage.setItem('hydroPro_backup_index',JSON.stringify([a.meta,b.meta,c.meta,d.meta])); },
  run:async()=>{await sleep(2000);const nat=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k)||'';const td=new Date().toISOString().slice(0,10);
    const r=window.hnxStorageRescue();const isPtr=(p)=>p.length>0&&p.length<1000&&p.indexOf('"idb":1')>=0;
    for(let i=0;i<40;i++){ if(isPtr(nat('hydroPro_backup_manual_'+td+'T01'))&&isPtr(nat('hydroPro_backup_manual_2026-09-29T08')))break; await sleep(500); } /* the move is device-database write → read back → pointer (async) */
    const pOld=nat('hydroPro_backup_manual_2026-09-29T08'),pNew=nat('hydroPro_backup_manual_'+td+'T01');window._bkMem={};
    const wOld=await getBackupAsync('manual_2026-09-29T08'),wNew=await getBackupAsync('manual_'+td+'T01'),wPre=await getBackupAsync('pre-action_'+td+'T00-00-01');const ok=(p)=>p.length>0&&p.length<1000&&p.indexOf('"idb":1')>=0;const whole=(w)=>!!(w&&w.data&&w.data.hydroPro_employees&&w.data.hydroPro_employees.length>899000);
    let dbHas=null;try{dbHas=!!(await window.HNXIDB.get('hydroPro_backup_manual_'+td+'T01'));}catch(e){dbHas='err';}
    const newDiag=ok(pNew)?'ok':('stored len '+pNew.length+' head '+JSON.stringify(pNew.slice(0,24))+' · decoded len '+(localStorage.getItem('hydroPro_backup_manual_'+td+'T01')||'').length+' · in device db '+dbHas+' · rescue dropped '+JSON.stringify((r&&r.dropped)||[]).slice(0,300)+' · lz pending '+JSON.stringify((window.__hnxLzPending&&__hnxLzPending())||[]));
    return {ran:!!r&&!r.skipped,oldPointer:ok(pOld),newPointer:newDiag,oldWhole:whole(wOld),newWhole:whole(wNew),preWhole:whole(wPre),index:loadBackupIndex().length,deletedBy:window.__who};},
  expect:{ran:true,oldPointer:true,newPointer:'ok',oldWhole:true,newWhole:true,preWhole:true,index:4,deletedBy:[]} },
{ name:'🗜 Compressor v22.17b: three 400 K stores queued for the background worker and replaced by 136-char values before their turn are stored as those 136 chars (not an LZ blob — a moved backup’s pointer was compressed this way); a 12-char save over a 6 M value waiting in memory is what reads return and what stays stored (the worker wrote the old 6 M back); a removed key waiting in memory stays removed (it came back)',
  run:async()=>{await sleep(1500);const nat=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k);
    const noise=n=>{let x='',r=7;while(x.length<n){r=(r*48271)%2147483647;x+=r.toString(36);}return x.slice(0,n);};
    const A=['hydroPro_zz_q1','hydroPro_zz_q2','hydroPro_zz_q3'],small=new Array(137).join('p');
    A.forEach((k,i)=>localStorage.setItem(k,noise(400000+i)));
    const queued=window.__hnxLzQueueAll?window.__hnxLzQueueAll(100000):-1;
    A.forEach(k=>localStorage.setItem(k,small)); /* same tick: the worker has not reached them yet */
    localStorage.setItem('hydroPro_zz_pb',new Array(6000001).join('x')); /* over the browser quota → waits in memory for the worker */
    const pendB=((window.__hnxLzPending&&__hnxLzPending())||[]).indexOf('hydroPro_zz_pb')>=0;
    localStorage.setItem('hydroPro_zz_pb','small-save-B');const readB=localStorage.getItem('hydroPro_zz_pb');
    localStorage.setItem('hydroPro_zz_pc',new Array(6000001).join('y'));
    const pendC=((window.__hnxLzPending&&__hnxLzPending())||[]).indexOf('hydroPro_zz_pc')>=0;
    localStorage.removeItem('hydroPro_zz_pc');const readC=localStorage.getItem('hydroPro_zz_pc');
    for(let i=0;i<60;i++){ if(!((window.__hnxLzPending&&__hnxLzPending())||[]).length) break; await sleep(500); } await sleep(3000);
    const out={queued:queued>=3,stored:A.map(k=>(nat(k)||'').length),lzBlobs:A.filter(k=>(nat(k)||'').indexOf('\u0001LZ\u0001')===0).length,
      pendB,readB,storedB:nat('hydroPro_zz_pb'),pendC,readC,storedC:nat('hydroPro_zz_pc'),readCAfter:localStorage.getItem('hydroPro_zz_pc')};
    A.concat(['hydroPro_zz_pb','hydroPro_zz_pc']).forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});
    return out;},
  expect:{queued:true,stored:[136,136,136],lzBlobs:0,pendB:true,readB:'small-save-B',storedB:'small-save-B',pendC:true,readC:null,storedC:null,readCAfter:null} },
];
