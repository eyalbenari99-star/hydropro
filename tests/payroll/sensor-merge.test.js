/* v22.17 (Dr Amy's Mac, 8 Oct 2026): "What changed my data?" was full of lines like
   "hydroPro_sensor_inventory_v1 (duplicate id) /PH_P11A" - Was {..."lastCalibrated":"2026-0...} / Became {..."2026-09-28"...}.
   Root cause: no edit to a sensor record was ever dated (no updatedAt), so two computers holding different calibration dates
   for the same sensor were the same age to the cloud merge. On a tie the merge keeps THIS computer's copy, so each computer
   kept its own date, every upload flipped the cloud copy, and every pull wrote a "(duplicate id)" line that showed the OTHER
   computer's copy as "Was" and this computer's own, untouched copy as "Became" - nothing on her computer had been replaced.
   These cases pin the fix: edits are dated, the later calibration wins on every computer, seeds never win, the seeder never
   touches a stored record, and the panel lists a sensor only when this computer's own copy changed.
   Review round 2: undated copies merge FIELD BY FIELD (the later calibration date, a filled-in value over an empty one, else
   this computer's value); a stamped copy wins only the fields its _fts lists; every other category keeps the v20.32
   "(duplicate id)" trace, labelled with what was kept and what was set aside. */
const K='hydroPro_sensor_inventory_v1';
/* in-page helper, installed by the seed: window.__tCloud.pull(data, firstPull) - the REAL pull (HNX_Cloud.pull) with the
   worker answered by a stub (same approach as audit-A-sync) */
const CLOUD=function(){
  window.__tCloud={
    async pull(data,first){
      const C=window.HNX_Cloud,f0=window.fetch;
      localStorage.setItem('hnx_cloud_token','test-token');
      C.state.online=true;C.state.syncing=false;C.state.error=null;
      window.__hnxPulledOk=!first;
      window.fetch=function(u,o){u=String(u);
        if(u.indexOf('/sync/keys')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({keys:[]})});
        if(u.indexOf('/sync/pull')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({data:data||{}})});
        if(u.indexOf('/sync/push')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({ok:true})});
        return f0.apply(this,arguments);};
      try{await C.pull();}finally{window.fetch=f0;localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=true;}
      return C.state.error||null;
    }
  };
};
const withCloud=seed=>new Function('('+CLOUD.toString()+')();'+(seed?'('+seed.toString()+')();':''));
module.exports=[
{ name:'🔬 Sensor merge: two copies of PH_P11A differing only by lastCalibrated — 2026-09-21 vs 2026-09-28 stamped updatedAt newer — give 2026-09-28 on BOTH computers (whichever is local) with 0 "(duplicate id)" lines (a dated edit is ordinary sync); the same pair undated (saved before v22.17) also gives 2026-09-28 on both and writes exactly 1 line — on the computer that held 2026-09-21, Was {"lastCalibrated":"2026-09-21"} Became {"lastCalibrated":"2026-09-28"} — and 0 on the one that kept its 2026-09-28 (the old merge kept 2026-09-21 on one computer and wrote 2 lines) (v22.17)',
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1';
    localStorage.setItem('hnx_merge_journal_v1','[]');
    const base={id:'PH_P11A',type:'pH',poolId:'P11A',poolLabel:'PRJ11-A',roomId:'PRJ11',gh:'PRJ11',model:'',serial:'',installedAt:'',lastCalibrated:'',calFreqDays:30,note:''};
    const r=o=>Object.assign({},base,o);
    const pick=(loc,cl)=>{const m=window.__hnxMergeGeneric(K,JSON.stringify(loc),JSON.stringify(cl));return (m==null?loc:JSON.parse(m)).find(s=>s.id==='PH_P11A').lastCalibrated;};
    const older=[r({lastCalibrated:'2026-09-21',updatedAt:1758400000000,_fts:{lastCalibrated:1758400000000}})];
    const newer=[r({lastCalibrated:'2026-09-28',updatedAt:1759000000000,_fts:{lastCalibrated:1759000000000}})];
    const dup=()=>JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]').filter(e=>/duplicate id/.test(e.key));
    const stampedHere=pick(older,newer),stampedThere=pick(newer,older);
    const stampedLines=dup().length;
    const undatedHere=pick([r({lastCalibrated:'2026-09-21'})],[r({lastCalibrated:'2026-09-28'})]);
    const hereLines=dup().length-stampedLines;
    const undatedThere=pick([r({lastCalibrated:'2026-09-28'})],[r({lastCalibrated:'2026-09-21'})]);
    const all=dup(),thereLines=all.length-stampedLines-hereLines,ln=all[all.length-1]||{};
    return {stampedHere,stampedThere,undatedHere,undatedThere,stampedLines,hereLines,thereLines,
      line:[ln.key,ln.path,ln.from,ln.to]};},
  expect:{stampedHere:'2026-09-28',stampedThere:'2026-09-28',undatedHere:'2026-09-28',undatedThere:'2026-09-28',stampedLines:0,hereLines:1,thereLines:0,
    line:["hydroPro_sensor_inventory_v1 (duplicate id \u2014 this computer's copy updated from the cloud copy)",'/PH_P11A','{"lastCalibrated":"2026-09-21"}','{"lastCalibrated":"2026-09-28"}']} },

{ name:'🔬 A seeded default never beats a calibrated record: the seeder builds 2 sensors per pool, all createdBy "seed" with no updatedAt; seed PH_P11A (never calibrated) against a calibrated PH_P11A (2026-09-28, undated or stamped) keeps 2026-09-28 in all 4 merges (seed local or cloud) with 0 journal lines; a calibration saved through the morning workflow is stamped updatedAt + _fts.lastCalibrated (v22.17)',
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1';
    localStorage.setItem('hnx_merge_journal_v1','[]');
    localStorage.removeItem(K);
    const seed=loadSensorInventory(),pools=loadIrrPools();
    const storedBySeeder=localStorage.getItem(K);
    const allSeed=seed.length>0&&seed.every(s=>s.createdBy==='seed'&&!s.updatedAt&&!s._fts);
    const sd=seed.find(s=>s.id==='PH_P11A');
    const calU=Object.assign({},sd,{lastCalibrated:'2026-09-28'});delete calU.createdBy;           /* calibrated before v22.17: undated */
    const calS=Object.assign({},sd,{lastCalibrated:'2026-09-28',updatedAt:1759000000000,_fts:{lastCalibrated:1759000000000}}); /* a seed calibrated now: stamped, so real */
    const lc=(loc,cl)=>{const m=window.__hnxMergeGeneric(K,JSON.stringify(loc),JSON.stringify(cl));return (m==null?loc:JSON.parse(m)).find(s=>s.id==='PH_P11A').lastCalibrated;};
    const m=[lc([sd],[calU]),lc([calU],[sd]),lc([sd],[calS]),lc([calS],[sd])];
    /* the morning workflow on this computer: After value typed for 2026-09-28 */
    localStorage.setItem(K,JSON.stringify(seed));
    _irrDate='2026-09-28';try{_morningSet('PH_P11A','afterValue','7.01');}catch(e){}
    const rec=JSON.parse(localStorage.getItem(K)).find(s=>s.id==='PH_P11A');
    const lines=JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]').length;
    return {perPool:seed.length===pools.length*2,storedBySeeder,allSeed,m,lines,
      calDate:rec.lastCalibrated,calStamped:!!(rec.updatedAt&&rec._fts&&rec._fts.lastCalibrated)};},
  expect:{perPool:true,storedBySeeder:null,allSeed:true,m:['2026-09-28','2026-09-28','2026-09-28','2026-09-28'],lines:0,calDate:'2026-09-28',calStamped:true} },

{ name:'🔬 Re-running the seeder 3 times leaves a stored record byte-identical (PH_P11A calibrated 2026-09-28, serial SN-77) and adds 0 seeds; the old per-FR clean-up drops 1 legacy EC_FR1_2 and keeps the 1 per-pool sensor instead of wiping the store; a back-dated morning log (2026-09-21) leaves Last Cal. at 2026-09-28 unstamped; 2026-10-05 moves it forward stamped; a serial edit is stamped _fts.serial (v22.17)',
  seed:function(){
    localStorage.removeItem('_v2_46_113_sensor_pool_migration_done');
    localStorage.setItem('hydroPro_sensor_inventory_v1',JSON.stringify([
      {id:'EC_FR1_2',type:'EC',roomId:'FR1_2',model:'',serial:'',installedAt:'',lastCalibrated:'',calFreqDays:30,note:''},
      {id:'PH_P11A',type:'pH',poolId:'P11A',poolLabel:'PRJ11-A',roomId:'PRJ11',gh:'PRJ11',model:'',serial:'SN-77',installedAt:'',lastCalibrated:'2026-09-28',calFreqDays:30,note:''}]));
  },
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1';
    const raw0=localStorage.getItem(K);const ids=JSON.parse(raw0||'[]').map(s=>s.id);
    for(let i=0;i<3;i++)loadSensorInventory();
    const raw1=localStorage.getItem(K);
    const get=()=>JSON.parse(localStorage.getItem(K)).find(s=>s.id==='PH_P11A');
    _irrDate='2026-09-21';try{_morningSet('PH_P11A','afterValue','7.02');}catch(e){}
    const back=get();
    _irrDate='2026-10-05';try{_morningSet('PH_P11A','afterValue','7.01');}catch(e){}
    const fwd=get();
    try{_invSet('PH_P11A','serial','SN-78');}catch(e){}
    const ser=get();
    return {ids,unchanged:raw1===raw0,count:JSON.parse(raw1).length,serial:JSON.parse(raw1)[0].serial,
      backDate:back.lastCalibrated,backStamped:!!back.updatedAt,fwdDate:fwd.lastCalibrated,
      fwdStamped:!!(fwd.updatedAt&&fwd._fts&&fwd._fts.lastCalibrated),serStamped:!!(ser._fts&&ser._fts.serial&&ser.serial==='SN-78')};},
  expect:{ids:['PH_P11A'],unchanged:true,count:1,serial:'SN-77',backDate:'2026-09-28',backStamped:false,fwdDate:'2026-10-05',fwdStamped:true,serStamped:true} },

{ name:'🔬 "What changed my data?" after 3 pulls of the same cloud copy: this computer holds 12 undated sensors — 10 calibrated 2026-09-28 (EC/PH for P07–P11A) and 2 on 2026-09-21 (EC/PH P06) — the cloud holds the other computer\'s undated copy (the 10 on 2026-09-21, the 2 on 2026-10-02, fields in another order) → 10 stay 2026-09-28 with 0 lines (this computer kept its own copy), 2 become 2026-10-02 with exactly 2 lines (one per real replacement, written on the first pull only), each Was {"lastCalibrated":"2026-09-21"} Became {"lastCalibrated":"2026-10-02"}; the 4 old-format sensor lines from before v22.17 are taken off and the 1 attendance line is kept → panel shows 2 sensor rows + 1 attendance row (v22.17)',
  seed:withCloud(()=>{
    const ids=['P07','P08','P09','P10','P11A'],recs=[];
    ids.forEach(p=>['EC','PH'].forEach(t=>recs.push({id:t+'_'+p,type:t==='PH'?'pH':'EC',poolId:p,poolLabel:p,roomId:'R',gh:'G',model:'',serial:'',installedAt:'',lastCalibrated:'2026-09-28',calFreqDays:30,note:''})));
    ['EC','PH'].forEach(t=>recs.push({id:t+'_P06',type:t==='PH'?'pH':'EC',poolId:'P06',poolLabel:'Pool 6',roomId:'FR5_6',gh:'GH6',model:'',serial:'',installedAt:'',lastCalibrated:'2026-09-21',calFreqDays:30,note:''}));
    localStorage.setItem('hydroPro_sensor_inventory_v1',JSON.stringify(recs));
    const old=id=>({t:'2026-10-08T06:12:00.000Z',key:'hydroPro_sensor_inventory_v1 (duplicate id)',path:'/'+id,
      from:'{"id":"'+id+'","type":"pH","poolId":"P11A","poolLabel":"PRJ11-A","roomId":"PRJ11","gh":"PRJ11","model":"","serial":"","installedAt":"","lastCalibrated":"2026-0',
      to:'{"id":"'+id+'","type":"pH","poolId":"P11A","poolLabel":"PRJ11-A","roomId":"PRJ11","gh":"PRJ11","model":"","serial":"","installedAt":"","lastCalibrated":"2026-0'});
    localStorage.setItem('hnx_merge_journal_v1',JSON.stringify([old('PH_P11A'),old('EC_P11A'),
      {t:'2026-10-07T01:00:00.000Z',key:'hydroPro_attendance',path:'/2026-10-07/E1/timeIn',from:'"07:00"',to:'"07:05"'},old('PH_P10'),old('EC_P10')]));
  }),
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1',C=window.__tCloud;
    const J=()=>JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]');
    const afterBoot=J().length;
    /* the other computer's copy: same sensors, undated, every record's fields written in reverse order */
    const cloud=JSON.parse(localStorage.getItem(K)).map(s=>{const o={};Object.keys(s).reverse().forEach(k=>o[k]=s[k]);
      o.lastCalibrated=/_P06$/.test(s.id)?'2026-10-02':'2026-09-21';return o;});
    const cloudRaw=JSON.stringify(cloud),errs=[];
    for(let i=0;i<3;i++){window.__hnxCloudRaw={};errs.push(await C.pull({[K]:cloudRaw},true));await sleep(300);}
    const inv=JSON.parse(localStorage.getItem(K));
    const kept=inv.filter(s=>!/_P06$/.test(s.id)&&s.lastCalibrated==='2026-09-28').length;
    const taken=inv.filter(s=>/_P06$/.test(s.id)&&s.lastCalibrated==='2026-10-02').length;
    const sl=J().filter(e=>/sensor_inventory/.test(e.key)),sensorLines=sl.length;
    const sensorPaths=sl.map(e=>e.path).sort(),sensorWas=[...new Set(sl.map(e=>e.from))],sensorBecame=[...new Set(sl.map(e=>e.to))];
    window.hnxShowDataJournal();await sleep(200);
    const ov=document.getElementById('hnxDataJournalOv');
    const rows=ov?[...ov.querySelectorAll('tr')].map(tr=>tr.textContent):[];
    const panelSensorRows=rows.filter(t=>/sensor_inventory/.test(t)).length,panelAttRows=rows.filter(t=>/hydroPro_attendance/.test(t)).length;
    if(ov)ov.remove();
    return {afterBoot,errs,count:inv.length,kept,taken,sensorLines,sensorPaths,sensorWas,sensorBecame,journal:J().length,panelSensorRows,panelAttRows};},
  expect:{afterBoot:1,errs:[null,null,null],count:12,kept:10,taken:2,sensorLines:2,sensorPaths:['/EC_P06','/PH_P06'],
    sensorWas:['{"lastCalibrated":"2026-09-21"}'],sensorBecame:['{"lastCalibrated":"2026-10-02"}'],journal:3,panelSensorRows:2,panelAttRows:1} },

{ name:'🔬 Undated sensor copies merge FIELD BY FIELD, the same on both computers: this computer {serial "SN-LOCAL", Last Cal. 2026-09-21} + cloud {serial "", Last Cal. 2026-09-28} → serial "SN-LOCAL" and 2026-09-28; swapped (this computer {serial "", 2026-09-28}, cloud {"SN-LOCAL", 2026-09-21}) → the same "SN-LOCAL" and 2026-09-28; both filled in and different (model "M-HERE" here, "M-THERE" in the cloud) → each computer keeps its own model; 2 journal lines, one per computer whose copy changed, each showing only the 1 changed field: Was {"lastCalibrated":"2026-09-21"} Became {"lastCalibrated":"2026-09-28"}, and Was {"serial":""} Became {"serial":"SN-LOCAL"} (v22.17)',
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1';
    localStorage.setItem('hnx_merge_journal_v1','[]');
    const base={id:'PH_P11A',type:'pH',poolId:'P11A',poolLabel:'PRJ11-A',roomId:'PRJ11',gh:'PRJ11',model:'',serial:'',installedAt:'',lastCalibrated:'',calFreqDays:30,note:''};
    const r=o=>Object.assign({},base,o);
    const mg=(loc,cl)=>{const m=window.__hnxMergeGeneric(K,JSON.stringify(loc),JSON.stringify(cl));const x=(m==null?loc:JSON.parse(m)).find(s=>s.id==='PH_P11A');return [x.serial,x.lastCalibrated,x.model];};
    const here=mg([r({serial:'SN-LOCAL',lastCalibrated:'2026-09-21'})],[r({serial:'',lastCalibrated:'2026-09-28'})]);
    const there=mg([r({serial:'',lastCalibrated:'2026-09-28'})],[r({serial:'SN-LOCAL',lastCalibrated:'2026-09-21'})]);
    const lines1=JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]');
    const modelHere=mg([r({model:'M-HERE',lastCalibrated:'2026-09-28'})],[r({model:'M-THERE',lastCalibrated:'2026-09-28'})])[2];
    const modelThere=mg([r({model:'M-THERE',lastCalibrated:'2026-09-28'})],[r({model:'M-HERE',lastCalibrated:'2026-09-28'})])[2];
    const lines=JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]');
    return {here,there,modelHere,modelThere,lines:lines.length,modelLines:lines.length-lines1.length,
      wasBecame:lines1.map(e=>e.from+' -> '+e.to),keys:[...new Set(lines.map(e=>e.key))]};},
  expect:{here:['SN-LOCAL','2026-09-28',''],there:['SN-LOCAL','2026-09-28',''],modelHere:'M-HERE',modelThere:'M-THERE',lines:2,modelLines:0,
    wasBecame:['{"lastCalibrated":"2026-09-21"} -> {"lastCalibrated":"2026-09-28"}','{"serial":""} -> {"serial":"SN-LOCAL"}'],
    keys:["hydroPro_sensor_inventory_v1 (duplicate id — this computer's copy updated from the cloud copy)"]} },

{ name:'🔬 A stamped sensor copy wins ONLY the fields its _fts lists: this computer\'s undated PH_P11A {serial "SN-LOCAL", cycle 14 days, Last Cal. 2026-09-28} + the cloud\'s calibration stamped now {Last Cal. 2026-10-05, _fts.lastCalibrated, serial "", cycle 30 default} → serial "SN-LOCAL", cycle 14, Last Cal. 2026-10-05 (stamp kept); the old merge gave serial "" and cycle 30. On the other computer (stamped copy local) → serial "SN-LOCAL" fills its empty serial, its own cycle 30 stays, 2026-10-05; 0 journal lines (a dated edit is ordinary sync) (v22.17)',
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1';
    localStorage.setItem('hnx_merge_journal_v1','[]');
    const base={id:'PH_P11A',type:'pH',poolId:'P11A',poolLabel:'PRJ11-A',roomId:'PRJ11',gh:'PRJ11',model:'',serial:'',installedAt:'',lastCalibrated:'',calFreqDays:30,note:''};
    const r=o=>Object.assign({},base,o);
    const now=Date.now();
    const und=r({serial:'SN-LOCAL',calFreqDays:14,lastCalibrated:'2026-09-28'});
    const stp=r({lastCalibrated:'2026-10-05',updatedAt:now,_fts:{lastCalibrated:now}});
    const mg=(loc,cl)=>{const m=window.__hnxMergeGeneric(K,JSON.stringify(loc),JSON.stringify(cl));return (m==null?loc:JSON.parse(m)).find(s=>s.id==='PH_P11A');};
    const a=mg([und],[stp]),b=mg([stp],[und]);
    return {here:[a.serial,a.calFreqDays,a.lastCalibrated,a.updatedAt===now,!!(a._fts&&a._fts.lastCalibrated===now)],
      there:[b.serial,b.calFreqDays,b.lastCalibrated,b.updatedAt===now],
      lines:JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]').length};},
  expect:{here:['SN-LOCAL',14,'2026-10-05',true,true],there:['SN-LOCAL',30,'2026-10-05',true],lines:0} },

{ name:'🔬 The v20.32 "(duplicate id)" trace is NOT silenced outside sensors: calls c1 here {text "Edelyn call A"} + cloud {text "Other call B"} (both undated, a reused id) keeps "Edelyn call A" and writes exactly 1 line "hydroPro_calls (duplicate id — kept this computer\'s copy; cloud copy set aside)", Was {"text":"Other call B"} Became {"text":"Edelyn call A"}; the same for issues (1 line); the same pair with fields in another order only → 0 lines; a sensor where this computer kept its own copy → 0 lines; total 2 (v22.17)',
  run:async()=>{
    localStorage.setItem('hnx_merge_journal_v1','[]');
    const J=()=>JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]');
    const mg=(k,loc,cl)=>{const m=window.__hnxMergeGeneric(k,JSON.stringify(loc),JSON.stringify(cl));return m==null?loc:JSON.parse(m);};
    const calls=mg('hydroPro_calls',[{id:'c1',text:'Edelyn call A'}],[{id:'c1',text:'Other call B'}]);
    const callLines=J().length,cl=J()[0]||{};
    const iss=mg('hydroPro_issues_v2',[{id:'i1',title:'Pump 3 leak',gh:'GH3'}],[{id:'i1',title:'Valve 7 stuck',gh:'GH3'}]);
    const issueLines=J().length-callLines,il=J()[callLines]||{};
    mg('hydroPro_calls',[{id:'c2',text:'same',who:'E'}],[{who:'E',text:'same',id:'c2'}]);
    const orderLines=J().length-callLines-issueLines;
    const S={id:'PH_P10',type:'pH',poolId:'P10',model:'',serial:'',lastCalibrated:'2026-09-28',calFreqDays:30,note:''};
    mg('hydroPro_sensor_inventory_v1',[S],[Object.assign({},S,{lastCalibrated:'2026-09-21'})]);
    const sensorLines=J().length-callLines-issueLines-orderLines;
    return {kept:calls.map(c=>c.text),callLines,callLine:[cl.key,cl.path,cl.from,cl.to],
      issue:iss.map(c=>c.title),issueLines,issueKey:il.key,issueWas:il.from,orderLines,sensorLines,total:J().length};},
  expect:{kept:['Edelyn call A'],callLines:1,
    callLine:["hydroPro_calls (duplicate id — kept this computer's copy; cloud copy set aside)",'/c1','{"text":"Other call B"}','{"text":"Edelyn call A"}'],
    issue:['Pump 3 leak'],issueLines:1,issueKey:"hydroPro_issues_v2 (duplicate id — kept this computer's copy; cloud copy set aside)",issueWas:'{"title":"Valve 7 stuck"}',
    orderLines:0,sensorLines:0,total:2} },
];

/* v22.18: these cases test the v22.17 sensor merge, which lives in next.html (trial) until it is promoted — the stable copy skips them (lib.js requires) */
module.exports.forEach(function(t){ if(t&&!t.requires) t.requires="typeof window._sensorStamp==='function'"; });
