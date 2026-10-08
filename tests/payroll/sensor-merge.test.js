/* v22.17 (Dr Amy's Mac, 8 Oct 2026): "What changed my data?" was full of lines like
   "hydroPro_sensor_inventory_v1 (duplicate id) /PH_P11A" - Was {..."lastCalibrated":"2026-0...} / Became {..."2026-09-28"...}.
   Root cause: no edit to a sensor record was ever dated (no updatedAt), so two computers holding different calibration dates
   for the same sensor were the same age to the cloud merge. On a tie the merge keeps THIS computer's copy, so each computer
   kept its own date, every upload flipped the cloud copy, and every pull wrote a "(duplicate id)" line that showed the OTHER
   computer's copy as "Was" and this computer's own, untouched copy as "Became" - nothing on her computer had been replaced.
   These cases pin the fix: edits are dated, the later calibration wins on every computer, seeds never win, the seeder never
   touches a stored record, and the panel lists only real replacements. */
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
{ name:'🔬 Sensor merge: two copies of PH_P11A differing only by lastCalibrated — 2026-09-21 vs 2026-09-28 stamped updatedAt newer — give 2026-09-28 on BOTH computers (whichever is local) with 0 "(duplicate id)" journal lines; the same pair undated (saved before v22.17) also gives 2026-09-28 on both with 0 lines (the old merge kept 2026-09-21 on one computer and wrote 2 lines) (v22.17)',
  run:async()=>{
    const K='hydroPro_sensor_inventory_v1';
    localStorage.setItem('hnx_merge_journal_v1','[]');
    const base={id:'PH_P11A',type:'pH',poolId:'P11A',poolLabel:'PRJ11-A',roomId:'PRJ11',gh:'PRJ11',model:'',serial:'',installedAt:'',lastCalibrated:'',calFreqDays:30,note:''};
    const r=o=>Object.assign({},base,o);
    const pick=(loc,cl)=>{const m=window.__hnxMergeGeneric(K,JSON.stringify(loc),JSON.stringify(cl));return (m==null?loc:JSON.parse(m)).find(s=>s.id==='PH_P11A').lastCalibrated;};
    const older=[r({lastCalibrated:'2026-09-21',updatedAt:1758400000000,_fts:{lastCalibrated:1758400000000}})];
    const newer=[r({lastCalibrated:'2026-09-28',updatedAt:1759000000000,_fts:{lastCalibrated:1759000000000}})];
    const stampedHere=pick(older,newer),stampedThere=pick(newer,older);
    const undatedHere=pick([r({lastCalibrated:'2026-09-21'})],[r({lastCalibrated:'2026-09-28'})]);
    const undatedThere=pick([r({lastCalibrated:'2026-09-28'})],[r({lastCalibrated:'2026-09-21'})]);
    const dupLines=JSON.parse(localStorage.getItem('hnx_merge_journal_v1')||'[]').filter(e=>/duplicate id/.test(e.key)).length;
    return {stampedHere,stampedThere,undatedHere,undatedThere,dupLines};},
  expect:{stampedHere:'2026-09-28',stampedThere:'2026-09-28',undatedHere:'2026-09-28',undatedThere:'2026-09-28',dupLines:0} },

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

{ name:'🔬 "What changed my data?" lists 0 sensor rows after 3 pulls of the same cloud copy: this computer holds 12 undated sensors — 10 calibrated 2026-09-28 (EC/PH for P07–P11A) and 2 on 2026-09-21 (EC/PH P06) — the cloud holds the other computer\'s undated copy (the 10 on 2026-09-21, the 2 on 2026-10-02, fields in another order) → 10 stay 2026-09-28, 2 become 2026-10-02, 0 sensor lines; the 4 old-format sensor lines from before v22.17 are taken off and the 1 attendance line is kept (v22.17)',
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
    const sensorLines=J().filter(e=>/sensor_inventory/.test(e.key)).length;
    window.hnxShowDataJournal();await sleep(200);
    const ov=document.getElementById('hnxDataJournalOv');
    const rows=ov?[...ov.querySelectorAll('tr')].map(tr=>tr.textContent):[];
    const panelSensorRows=rows.filter(t=>/sensor_inventory/.test(t)).length,panelAttRows=rows.filter(t=>/hydroPro_attendance/.test(t)).length;
    if(ov)ov.remove();
    return {afterBoot,errs,count:inv.length,kept,taken,sensorLines,journal:J().length,panelSensorRows,panelAttRows};},
  expect:{afterBoot:1,errs:[null,null,null],count:12,kept:10,taken:2,sensorLines:0,journal:1,panelSensorRows:0,panelAttRows:1} },
];
