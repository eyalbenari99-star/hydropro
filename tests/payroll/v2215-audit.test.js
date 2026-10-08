/* v22.15: fixes from the stall audit (8 Oct) — Labor Payroll freeze, false storage rescue, fake control-audit entries,
   false failed saves, the Brain pill loop, SVG animations in Lite, the stall box naming the real job */
const ROSTER=function(){ var E=[],A={},end=new Date(),L=function(i){return String.fromCharCode(65+((i/26)|0))+String.fromCharCode(65+i%26);};
  for(var i=0;i<170;i++) E.push({id:'L'+i,name:(i<130?'WORKER Q':'IDLE Q')+L(i)+' SANTOS',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'});
  for(var k=0;k<75;k++){ var d=new Date(end);d.setDate(d.getDate()-k);var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');A[ds]={};
    for(var j=0;j<130;j++) A[ds]['L'+j]={status:'present',timeIn:'07:00',timeOut:'16:00',lateMinutes:0,source:'fingerprint',updatedAt:'2026-09-01T00:00:00.000Z',updatedBy:'system',fpRaw:{uid:'L'+j,scansCount:2}}; }
  localStorage.setItem('hydroPro_employees',JSON.stringify(E));localStorage.setItem('hydroPro_attendance',JSON.stringify(A)); };
const splice=(fn,map)=>{let src=fn.toString();for(const k in map)src=src.replace(k,'('+map[k].toString()+')');return new Function('return '+src)();};
module.exports=[
{ name:'⚡ Payroll v22.15: opening Labor Payroll with 170 people and ~1.3 MB of attendance parses the attendance store a handful of times, not once per person (was ~130 parses, 4.7 s at office-PC speed); the roster still shows people with attendance and leaves out those without (v22.15)',
  seed:splice(function(){ (ROSTER)(); },{'(ROSTER)':ROSTER}),
  run:async()=>{await sleep(3000);const P=JSON.parse;let big=0;JSON.parse=function(s){if(typeof s==='string'&&s.length>500000)big++;return P.apply(this,arguments);};
    const t0=performance.now();try{switchView('payroll_ops');}catch(e){}const ms=Math.round(performance.now()-t0);await sleep(1500);JSON.parse=P;
    const txt=(document.getElementById('view-payroll_ops')||document.body).textContent||'';
    return {bigParses:big,few:big<=12,ms,shown:/WORKER QAA SANTOS/.test(txt),hidden:!/IDLE QFA SANTOS/.test(txt)};},
  expect:{few:true,shown:true,hidden:true} },
{ name:'🚑 Storage v22.15: a computer whose big stores already live in the device database (attendance 1.4 M, payroll runs 0.8 M, recon 0.9 M, control audit 1.2 M — only 7-char placeholders in the browser) starts WITHOUT the storage rescue or the old v28 clean-up deleting its manual backup, its daily-backup pointer or its inbox, and 🩺 Health counts the stored size, not the device-database copies (v22.15)',
  seed:function(){ localStorage.setItem('hnx_v285_cleanup_done','1'); /* one-time v2.85 clean-up every real PC ran long ago */
    var STUB='\u0001VAULT\u0001',D={hydroPro_attendance:JSON.stringify({'2026-01-01':{X:{status:'present',pad:new Array(1400000).join('a')}}}),hydroPro_payroll_runs:JSON.stringify([{id:'R',pad:new Array(800000).join('b')}]),
      hydroPro_recon_v1:JSON.stringify({pad:new Array(900000).join('c')}),hydroPro_control_audit:JSON.stringify([{id:'A1',ts:'2026-10-01T00:00:00Z',source:'manual',pad:new Array(1200000).join('d')}])};
    Object.keys(D).forEach(function(k){localStorage.setItem(k,STUB);});
    var r=indexedDB.open('hnx_backups',1);r.onupgradeneeded=function(e){var db=e.target.result;if(!db.objectStoreNames.contains('b'))db.createObjectStore('b');};
    r.onsuccess=function(e){var db=e.target.result,tx=db.transaction('b','readwrite'),st=tx.objectStore('b');Object.keys(D).forEach(function(k){st.put(D[k],'vault:'+k);});};
    localStorage.setItem('hydroPro_backup_manual_2026-10-08',JSON.stringify({keep:new Array(20000).join('k')}));localStorage.setItem('hydroPro_autobackup_2026-10-07',JSON.stringify({id:'2026-10-07',idb:true,size:123}));
    localStorage.setItem('hydroPro_pa_inbox_v1',JSON.stringify(Array.from({length:700},function(_,i){return {id:'I'+i,user:'admin',title:'t'+i,body:new Array(80).join('z'),at:i};})));},
  run:async()=>{await sleep(12000);const nat=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k)||'';
    const served=(localStorage.getItem('hydroPro_recon_v1')||'').length>800000;
    const m=window.__hnxGuardian?window.__hnxGuardian.runNow():{};const inbox=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
    return {served,backupKept:nat('hydroPro_backup_manual_2026-10-08').length>1000,pointerKept:nat('hydroPro_autobackup_2026-10-07').length>10,inboxKept:inbox.filter(x=>/^I\d+$/.test(x.id)).length===700,storeKSmall:(m.storeK||0)<2500,storeK:m.storeK,v28:JSON.stringify(window.HnxV28&&{skipped:window.HnxV28.skipped})};},
  expect:{served:true,backupKept:true,pointerKept:true,inboxKept:true,storeKSmall:true} },
{ name:'🗂 Retention v22.15: on a computer that is not full, the old automatic clean-ups no longer cut business records at start — the app audit log keeps all 300 entries (was cut to 100 every 10 min), seed studies all 80 (was 50), recurring instances older than 30 days stay, and a manual backup + daily-backup pointer stay (v22.15)',
  seed:function(){ localStorage.setItem('hnx_v285_cleanup_done','1');
    localStorage.setItem('hydroPro_audit',JSON.stringify(Array.from({length:300},function(_,i){return {id:'AU'+i,ts:new Date(Date.now()-i*3600000).toISOString(),user:'jinky',action:'edit',detail:'entry '+i};})));
    localStorage.setItem('hydroPro_seed_studies',JSON.stringify(Array.from({length:80},function(_,i){return {id:'SS'+i,ts:Date.now()-i*86400000,name:'study '+i};})));
    localStorage.setItem('hydroPro_recurring_instances',JSON.stringify(Array.from({length:60},function(_,i){return {id:'RI'+i,date:new Date(Date.now()-i*2*86400000).toISOString().slice(0,10),done:true};})));
    localStorage.setItem('hydroPro_backup_manual_2026-10-08',JSON.stringify({keep:new Array(5000).join('k')}));localStorage.setItem('hydroPro_autobackup_2026-10-07',JSON.stringify({id:'2026-10-07',idb:true}));},
  run:async()=>{await sleep(9000);const J=k=>{try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];}};const nat=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k)||'';
    return {audit:J('hydroPro_audit').filter(x=>/^AU/.test(x.id)).length,studies:J('hydroPro_seed_studies').filter(x=>/^SS/.test(x.id)).length,recurring:J('hydroPro_recurring_instances').filter(x=>/^RI/.test(x.id)).length,backup:nat('hydroPro_backup_manual_2026-10-08').length>100,pointer:nat('hydroPro_autobackup_2026-10-07').length>5};},
  expect:{audit:300,studies:80,recurring:60,backup:true,pointer:true} },
{ name:'🛡 Control audit v22.15: a real (device-database) audit log of 300 entries is not topped up with invented demo entries at start (was +42 random entries every start of every computer) (v22.15)',
  seed:function(){ localStorage.setItem('hydroPro_control_audit',JSON.stringify(Array.from({length:300},function(_,i){return {id:'REAL_'+i,ts:new Date(Date.now()-i*60000).toISOString(),source:'manual',action_type:'logged',target:'GH1-Drum1',description:'real '+i,status:'logged'};}))); },
  run:async()=>{await sleep(9000);const a=window.loadControlAudit();return {n:a.length,allReal:a.every(x=>/^REAL_/.test(x.id))};},
  expect:{n:300,allReal:true} },
{ name:'🛑 Quota v22.15: on a nearly full browser store, a 200 K store that only fits compressed is saved WITHOUT counting a failed save or painting the “ENTRIES ARE NOT BEING SAVED” banner (the raw first try is speculative) (v22.15)',
  run:async()=>{await sleep(3000);const ns=(k,v)=>window.__hnxNS.call(localStorage,k,v); /* the filler itself must not paint the banner */let i=0;const chunk=new Array(250000).join('f');
    try{for(;i<40;i++)ns('zz_fill_'+i,chunk);}catch(e){}let small=new Array(20000).join('g');try{for(let j=0;j<200;j++)ns('zz_fillsmall_'+j,small);}catch(e){}
    const h0=window.__hnxQuotaHits||0;const v=new Array(70000).join('abc');let threw=false;try{localStorage.setItem('hydroPro_quota_probe',v);}catch(e){threw=true;}
    const back=localStorage.getItem('hydroPro_quota_probe');const banner=!!document.getElementById('hnxQuotaWarn');
    const banner0=banner;for(let j=0;j<40;j++)localStorage.removeItem('zz_fill_'+j);for(let j=0;j<200;j++)localStorage.removeItem('zz_fillsmall_'+j);
    return {saved:!threw&&back===v,noFalseCount:(window.__hnxQuotaHits||0)===h0,noBanner:!banner};},
  expect:{saved:true,noFalseCount:true,noBanner:true} },
{ name:'🛑 Quota banner v22.15: after a REAL failed save the thin STORAGE FULL strip appears, clicks pass through it, and it clears by itself once saves succeed again for 20 s (Dr Amy: it stayed for the whole session after one failure) (v22.15)',
  run:async()=>{await sleep(3000);let threw=false;try{Storage.prototype.setItem.call(localStorage,'zz_huge_probe',new Array(6000000).join('h'));}catch(e){threw=true;}
    const el=document.getElementById('hnxQuotaWarn');const shown=!!el;const pe=el?getComputedStyle(el).pointerEvents:'';
    await sleep(21000);localStorage.setItem('hnx_quota_probe_ok',String(Date.now()));await sleep(200);
    return {threw,shown,clickThrough:pe==='none',cleared:!document.getElementById('hnxQuotaWarn')};},
  expect:{threw:true,shown:true,clickThrough:true,cleared:true} },
{ name:'🧠 Pill v22.15: with nothing changing, the Brain pill is not rewritten again and again (the page watchers and the pill fed each other ~2 times a second) — 0 rewrites in 12 s (v22.15)',
  run:async()=>{await sleep(6000);const pill=document.getElementById('hnBrainPill');if(!pill)return {pill:false};let n=0;const mo=new MutationObserver(r=>{n+=r.length;});mo.observe(pill,{childList:true,subtree:true,characterData:true});
    await sleep(12000);mo.disconnect();return {pill:true,rewrites:n};},
  expect:{pill:true,rewrites:0} },
{ name:'⚡ Lite v22.15: SVG animations (SMIL — not stopped by Lite’s CSS) are paused in Lite mode and resume when Lite is switched off (v22.15)',
  run:async()=>{await sleep(3000);const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','40');svg.setAttribute('height','40');
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx','20');c.setAttribute('cy','20');c.setAttribute('r','5');const an=document.createElementNS(ns,'animate');an.setAttribute('attributeName','r');an.setAttribute('values','5;15;5');an.setAttribute('dur','1s');an.setAttribute('repeatCount','indefinite');c.appendChild(an);svg.appendChild(c);document.body.appendChild(svg);
    window.HNX_LITE.set(true,true);const pausedInLite=svg.animationsPaused();window.HNX_LITE.set(false,true);const runningOff=!svg.animationsPaused();window.HNX_LITE.set(true,true);
    return {pausedInLite,runningOff};},
  expect:{pausedInLite:true,runningOff:true} },
{ name:'🎯 Stall box v22.15: a slow job behind the hidden-tab guard is recorded under ITS OWN name (all 30/60 s jobs used to share the guard’s name “function(){ if(document.hidden)return; …”) (v22.15)',
  run:async()=>{await sleep(3000);const real=function slowRealJobForTest(){const t=performance.now();while(performance.now()-t<12){}};const guard=function(){ if(document.hidden)return; try{return real.apply(this,arguments);}catch(e){} };guard.__hnxFn=real;
    setTimeout(guard,10);await sleep(200);const keys=Object.keys((window.__hnxSpeed||{}).timers||{});
    return {named:keys.some(k=>/slowRealJobForTest/.test(k)),noGuardName:!keys.some(k=>/^T10\|function\(\)\{ if\(document\.hidden\)return/.test(k))};},
  expect:{named:true,noGuardName:true} }
];
