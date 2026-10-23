/* Wave 1 fixes (22 Oct 2026, Eyal: "All, straight to stable").
   #76  STORAGE JANITOR — the stable page deleted every manual backup and rescue snapshot older than 7 days 4 s after EVERY start
        (hnxJanitor) and again every 6 h, the 10-minute pruner kept only the newest of each family (and the backup INDEX itself),
        and the v55 clean-up removed every manual backup 2 s after start. The trial copy (v22.17) MOVES them to the device database
        and leaves a small pointer; 💾 Backups reads the pointer back. Now the stable page does the same.
   #77  ESCALATION BULK BAR vs the cloud-sync banner at 400 px — two timers re-sized the banner between two heights while the
        bulk-action bar was placed once, so the bar overlapped the banner in about 1 run of 7-15. */
/* ---------- #76 : fixtures (all synthetic, dated relative to today — no date bombs) ---------- */
const SEED_BACKUPS=function(){
  localStorage.setItem('hnx_v285_cleanup_done','1'); /* the one-time v2.85 clean-up every real computer ran long ago */
  var d=new Date(Date.now()-10*86400000).toISOString().slice(0,10), pad=new Array(30000).join('e');
  var wrap=function(id,reason){ return {meta:{id:id,reason:reason,label:reason+' backup',createdAt:new Date(Date.now()-10*86400000).toISOString(),size:30000,keyCount:1},
    data:{hydroPro_employees:JSON.stringify([{id:'QA',name:'Qa Tester',pad:pad}])}}; };
  var man=wrap('manual_'+d+'T08','manual');
  localStorage.setItem('hydroPro_backup_manual_'+d+'T08',JSON.stringify(man));
  localStorage.setItem('hydroPro_backup_index',JSON.stringify([man.meta]));
  localStorage.setItem('hydroPro_rescue_'+d+'T01',JSON.stringify({hydroPro_employees:pad}));
  sessionStorage.setItem('t_d10',d);
  /* who removes a backup key (the code that did it is named in the failure) */
  window.__who=[];try{var __R=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){ if(/^hydroPro_backup_/.test(String(k))) window.__who.push(String(k).slice(16,44)+' @'+(performance.now()|0)+'ms: '+(new Error().stack||'').split('\n').slice(2,6).map(function(x){return x.trim().slice(0,90);}).join(' < ')); return __R.call(this,k); };}catch(e){}
};
const SEED_AUTO=function(){
  localStorage.setItem('hnx_v285_cleanup_done','1');
  var d1=new Date(Date.now()-10*86400000).toISOString().slice(0,10), d2=new Date(Date.now()-12*86400000).toISOString().slice(0,10), pad=new Array(30000).join('a');
  [d1,d2].forEach(function(d){ localStorage.setItem('hydroPro_backup_'+d,JSON.stringify({exportedAt:Date.now()-10*86400000,source:'automatic',data:{hydroPro_employees:JSON.stringify([{id:'QA',pad:pad}])}})); });
  sessionStorage.setItem('t_d1',d1);sessionStorage.setItem('t_d2',d2);
};
/* ---------- #77 : in-page helpers + the seed of the sibling bulk-bar case (2 escalated rows per source, admin session) ---------- */
const ESCT=require('./escalation-actions-v2302.test.js');
const BULK=ESCT.find(t=>t&&/The bulk bar is on the page body/.test(t.name));
if(!BULK)throw new Error('wave1-fixes: the bulk-bar case of escalation-actions-v2302.test.js (its seed) was not found');
const REQ77="typeof window.hnxEscSave==='function'&&typeof window.hnxPhoneLayout==='function'";
const PRE77=`
  const vis77=e=>{if(!e)return null;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return null;const r=e.getBoundingClientRect();return r.height>0?r:null;};
  const probe77=()=>{const b=vis77(document.getElementById('hnxEscBulk')),n=vis77(document.getElementById('hnxCloudBanner')),t=vis77(document.getElementById('hnxPhoneTray'));
    let ov=0;[n,t].forEach(r=>{if(r&&b&&r.top<innerHeight)ov=Math.max(ov,Math.max(0,b.bottom-r.top));});
    return {bar:!!b,banner:!!n,tray:!!t,h:n?Math.round(n.height):0,overlap:Math.round(ov)};};
  const open77=async()=>{sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));switchView('task_escalation');await sleep(500);hnxEscRender();await sleep(150);
    [...document.querySelectorAll('#taskEscalationBody .hnx-esc-chk')].slice(0,3).forEach(c=>c.click());await sleep(300);};
`;

module.exports=[
{ name:'🗄 Janitor #76: a manual backup and a rescue snapshot dated 10 days ago are NOT deleted by the start-up cleaners (janitor 4 s, pruner 4 s, v55 clean-up 2 s) — the backup is still restorable whole through 💾 Backups (getBackupAsync) and the snapshot is still in the browser store or the device database (30 K each); no backup key is removed by any script',
  seed:SEED_BACKUPS,
  run:async()=>{
    for(let i=0;i<30;i++){ if(Object.keys(localStorage).some(k=>k.indexOf('hydroPro_rescue_20')===0)===false) break; await sleep(500); } /* the snapshot keeper moves old snapshots at 20 s — wait for it */
    await sleep(3000);
    const d=sessionStorage.getItem('t_d10'), id='manual_'+d+'T08', key='hydroPro_backup_manual_'+d+'T08', rkey='hydroPro_rescue_'+d+'T01';
    const w=await (typeof window.getBackupAsync==='function'?window.getBackupAsync(id):Promise.resolve(getBackup(id)));
    const whole=!!(w&&w.data&&w.data.hydroPro_employees&&w.data.hydroPro_employees.length>29000);
    let inDb=null;try{ inDb=await window.HNXIDB.get(key); }catch(e){}
    const rLocal=(localStorage.getItem(rkey)||'').length;let rDb=null;try{ rDb=await window.HNXIDB.get('rescue:'+rkey); }catch(e){}
    const rDb2=(await window.HNXIDB.get(rkey).catch(()=>null));
    const ptr=(localStorage.getItem(key)||'');
    return {manualRestorable:whole, rescueKept:rLocal>29000||(typeof rDb==='string'&&rDb.length>29000)||(typeof rDb2==='string'&&rDb2.length>29000),
      indexKept:JSON.parse(localStorage.getItem('hydroPro_backup_index')||'[]').length===1,
      removedBy:window.__who,
      diag:{manualLocalLen:ptr.length,manualInDb:!!(inDb&&inDb.data),rescueLocal:rLocal,rescueDb:rDb?rDb.length:null}};},
  expect:{manualRestorable:true,rescueKept:true,indexKept:true,removedBy:[]} },
{ name:'🗄 Janitor #76: two automatic backups dated 10 and 12 days ago (30 K each, the ordinary stale-copy pruning) leave the browser store as pointers under 1 K and the whole copy is in the device database — the same as on the trial copy (v22.17); the live data is untouched',
  seed:SEED_AUTO,
  run:async()=>{
    await sleep(6000);
    const d1=sessionStorage.getItem('t_d1'), d2=sessionStorage.getItem('t_d2'), out={};
    for(const [n,d] of [['a',d1],['b',d2]]){
      const k='hydroPro_backup_'+d; let p='',db=null;
      for(let i=0;i<30;i++){ p=(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k)||''; if(p.length>0&&p.length<1000&&p.indexOf('"idb":1')>=0) break; await sleep(500); }
      try{ db=await window.HNXIDB.get(k); }catch(e){}
      out[n+'Pointer']=p.length>0&&p.length<1000&&p.indexOf('"idb":1')>=0;
      out[n+'Whole']=!!(db&&db.data&&db.data.hydroPro_employees&&db.data.hydroPro_employees.length>29000);
    }
    return out;},
  expect:{aPointer:true,aWhole:true,bPointer:true,bWhole:true} },
{ name:'🗄 Janitor #76: on a computer WITHOUT a device database (IndexedDB blocked) the ordinary stale-copy pruning is unchanged — an automatic backup dated 10 days ago is removed by the start-up clean-up (it cannot be moved), exactly as on the trial copy (v22.17)',
  seed:function(){ localStorage.setItem('hnx_v285_cleanup_done','1');
    try{Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});}catch(e){}
    var d=new Date(Date.now()-10*86400000).toISOString().slice(0,10);sessionStorage.setItem('t_d1',d);
    localStorage.setItem('hydroPro_backup_'+d,JSON.stringify({exportedAt:Date.now()-10*86400000,source:'automatic',data:{hydroPro_employees:JSON.stringify([{id:'QA',pad:new Array(30000).join('a')}])}})); },
  run:async()=>{
    await sleep(4000);
    const k='hydroPro_backup_'+sessionStorage.getItem('t_d1');
    return {noDb:!(window.HNXIDB&&window.HNXIDB.available),removed:localStorage.getItem(k)===null};},
  expect:{noDb:true,removed:true} },

/* review round (23 Oct): the guide must not promise more than the code keeps. With the browser store 85 % full (device database or not) the
   v27 deep clean, the v28 start-up clean-up, the v38 force-clean and the v55 clean-up still remove backup keys (v27/v28 also the backup
   list), a save that no longer fits frees the oldest backup, the cloud archiver moves a whole backup out of the browser, and two buttons
   remove backups on purpose - all identical on the trial copy. The stable guide therefore names those cases (four short paragraphs) and
   makes neither the false 'deleted only on a computer whose browser has no device database' nor the false 'list ... never deleted' claim. */
{ name:'📖 Guide #76: “Storage — automatic clean-up” → “Old backups and snapshots are moved, not deleted” names the 4 cases where a backup can still be removed (① no device database, older than 7 days; ② store 85% full or a save no longer fits — copy or pointer, and the list in 📂 Backups; ③ cloud archive, a manual backup after 2 days; ④ 🔥 Deep clean / 🧹 Clear old backups) and does not claim “deleted only on a computer whose browser has no device database” or “the list of backups is never deleted” (stable guide; the trial guide has no such section, so the case is skipped there)',
  requires:"typeof HNX_HELP_GUIDES!=='undefined'&&HNX_HELP_GUIDES.some(g=>g.id==='storage_autoclean'&&JSON.stringify(g).indexOf('moved, not deleted')>=0)",
  run:async()=>{
    const g=HNX_HELP_GUIDES.find(x=>x.id==='storage_autoclean'), sec=(g.sections||[]).find(s=>/moved, not deleted/.test(s.h))||{};
    const txt=(sec.p||[]).join(' | '), note=((sec.note&&sec.note.t)||'');
    return {found:!!sec.h, noOnlyClaim:!/deleted only on a computer/i.test(txt), noNeverClaim:!/never deleted/i.test(txt),
      moveNeedsDb:/on a computer that has a device database, Nexi MOVES/.test(txt),
      case1:/no device database/.test(txt)&&/older than 7 days/.test(txt),
      case2:/85% or more/.test(txt)&&/no longer fits/.test(txt)&&/list in 📂 Backups/.test(txt)&&/no longer find that backup/.test(txt),
      case3:/company cloud/.test(txt)&&/a manual backup after 2 days/.test(txt),
      case4:/Deep clean/.test(txt)&&/Clear old backups/.test(txt),
      noteFull:/85% or more/.test(note), noteKeepFile:/press ⬇/.test(note)};},
  expect:{found:true,noOnlyClaim:true,noNeverClaim:true,moveNeedsDb:true,case1:true,case2:true,case3:true,case4:true,noteFull:true,noteKeepFile:true} },

/* ---------- #77 : the Escalation bulk bar vs the cloud-sync banner at 400 px ---------- */
{ name:'📱 Bulk bar #77: at 400×800 with the cloud-sync banner showing, 3 rows ticked — 12 samples over 10.8 s: the banner keeps ONE height (it flipped between two heights because the phone layout and the banner’s own sizer both re-wrote its padding and font) and the bar’s bottom edge never overlaps the banner or the phone tray (overlap 0 px)',
  requires:REQ77,tz:'Asia/Manila',viewport:{width:400,height:800},seed:BULK.seed,
  run:new Function(`return (async()=>{${PRE77}
    await open77();
    const S=[];for(let i=0;i<12;i++){S.push(probe77());await sleep(900);}
    const hs=[...new Set(S.map(x=>x.h))].sort((a,b)=>a-b);
    return {barSeen:S.every(x=>x.bar),bannerSeen:S.every(x=>x.banner),samples:S.length,bannerHeights:hs.length,heights:hs.join('/'),maxOverlapPx:Math.max(...S.map(x=>x.overlap))};})()`),
  expect:{barSeen:true,bannerSeen:true,samples:12,bannerHeights:1,maxOverlapPx:0} },
{ name:'📱 Bulk bar #77 (forced order): the phone layout has just sized the banner and the bar is placed against it; the banner’s own sizer then runs (a window resize runs it at once, the 1.5 s timer does the same) — in the SAME synchronous turn the bar’s bottom edge is still clear of the banner (overlap 0 px) and the banner keeps its height',
  requires:REQ77,tz:'Asia/Manila',viewport:{width:400,height:800},seed:BULK.seed,
  run:new Function(`return (async()=>{${PRE77}
    await open77();
    window.hnxPhoneLayout();                                   /* banner: the phone layout’s size */
    const cs=[...document.querySelectorAll('#taskEscalationBody .hnx-esc-chk')];cs[2].click();cs[2].click(); /* untick + tick → the bar is placed against that banner */
    const before=probe77();
    window.dispatchEvent(new Event('resize'));                 /* the banner’s sizer runs now (placeBars ran just before it) */
    const after=probe77();
    return {barSeen:before.bar&&after.bar,bannerSeen:before.banner&&after.banner,beforeOverlapPx:before.overlap,afterOverlapPx:after.overlap,sameHeight:before.h===after.h,heights:before.h+'/'+after.h};})()`),
  expect:{barSeen:true,bannerSeen:true,beforeOverlapPx:0,afterOverlapPx:0,sameHeight:true} },
{ name:'📱 Bulk bar #77 (banner grows): with the bar placed, the cloud-sync banner gets 3 more lines (its text, a bigger tray, a rotated phone) — within 1.6 s the bar has moved up with it and its bottom edge is clear of the banner (overlap 0 px; the bar was only re-placed when a row was ticked or the window resized)',
  requires:REQ77,tz:'Asia/Manila',viewport:{width:400,height:800},seed:BULK.seed,
  run:new Function(`return (async()=>{${PRE77}
    await open77();
    window.hnxPhoneLayout();
    const cs=[...document.querySelectorAll('#taskEscalationBody .hnx-esc-chk')];cs[2].click();cs[2].click();
    const h0=probe77();
    const lbl=document.getElementById('hnxCloudBanner').querySelector('span');
    lbl.insertAdjacentHTML('beforeend','<br>anything entered here stays on this computer — line two<br>line three<br>line four');
    const grown=probe77();
    await sleep(1600);
    const settled=probe77();
    return {barSeen:h0.bar&&grown.bar&&settled.bar,bannerSeen:h0.banner&&settled.banner,startOverlapPx:h0.overlap,bannerGrew:settled.h-h0.h>=30,settledOverlapPx:settled.overlap,heights:h0.h+'/'+grown.h+'/'+settled.h};})()`),
  expect:{barSeen:true,bannerSeen:true,startOverlapPx:0,bannerGrew:true,settledOverlapPx:0} },
];
