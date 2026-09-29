/* v21.19 (Syra): the printed Daily GPS Report names the driver and helper and shows Kind + Reason per stop */
module.exports=[
{ name:'🖨 Daily GPS Report print: Driver and Helper of the day are printed under the truck; every stop has Kind and Reason columns (an unplanned stop shows NOT IN PLAN + its reason); the viewer header shows the helper too (v21.19)',
  seed:function(){
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E1',name:'GARCIA, ANTONIO',status:'Active',position:'Driver',payType:'weekly',dailyRate:658},{id:'E2',name:'JAMISOLA, ANTONIO',status:'Active',position:'Helper',payType:'weekly',dailyRate:658},{id:'E3',name:'TABIOS, SHERNAN',status:'Active',position:'Greenhouse Worker',dept:'Construction',payType:'weekly',dailyRate:658}]));
    localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([{id:'V1',name:'ISUZU TRUCK NEQ 4101',plate:'NEQ-4101',active:true}]));
    const d=new Date();const y=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');window.__gpsDay=y;
    localStorage.setItem('hydroPro_gps_reports',JSON.stringify({[y+'::V1']:{date:y,vehicleId:'V1',driverId:'E1',helperId:'E2',odoOut:120755,odoIn:120830,fillUpLiters:9.074,perLiter:102.6,dashCam:'WORKING',kmMode:'odo',
      stops:[{location:'APAC',timeOut:'08:04',kind:'base'},{location:'CHUNGDAM BGC',timeIn:'08:54',timeOut:'09:13',km:38.3,kind:'customer'},{location:'EDI TEKELI',timeIn:'10:18',timeOut:'11:14',km:45.9,kind:'unplanned',reason:'buyer asked for an extra drop',note:'RECEIVING STARTS AT 11:00 AM'}]}}));
    window.__printed='';window.open=function(){return {document:{write:function(h){window.__printed+=h;},close:function(){}}};};
  },
  run:async()=>{
    await sleep(4000);
    printGpsDaily(window.__gpsDay);await sleep(300);const h=window.__printed;
    let viewer='';try{switchView('fleet_daily_report');await sleep(1200);viewer=document.getElementById('view-fleet_daily_report')?document.getElementById('view-fleet_daily_report').innerText:'';}catch(e){}
    return {driver:/Driver:<\/strong> GARCIA, ANTONIO/.test(h),helper:/Helper:<\/strong> JAMISOLA, ANTONIO/.test(h),kindCol:/<th>Kind<\/th><th>Reason \(if not in plan\)<\/th>/.test(h),unplanned:/NOT IN PLAN<\/td>\s*<td>buyer asked for an extra drop/.test(h),customer:/<td>Customer<\/td>/.test(h),viewerHelper:viewer?/JAMISOLA/.test(viewer):null};},
  expect:{driver:true,helper:true,kindCol:true,unplanned:true,customer:true} },

{ name:'🧑‍🔧 A replacement helper from the other labourers (Shernan, a greenhouse worker) can be picked as the helper of the day: the picker lists Helpers first, then "Other employees — temporary helper"; picking him stores E3 on the report and the print names him (v21.19)',
  seed:function(){
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E1',name:'GARCIA, ANTONIO',status:'Active',position:'Driver',payType:'weekly',dailyRate:658},{id:'E2',name:'JAMISOLA, ANTONIO',status:'Active',position:'Helper',payType:'weekly',dailyRate:658},{id:'E3',name:'TABIOS, SHERNAN',status:'Active',position:'Greenhouse Worker',dept:'Construction',payType:'weekly',dailyRate:658}]));
    localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'FH1',name:'ANTONIO JAMISOLA',active:true}])); /* the same helper again, name reversed */
    localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([{id:'V1',name:'ISUZU TRUCK NEQ 4101',plate:'NEQ-4101',active:true}]));
    const d=new Date();const y=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');window.__gpsDay=y;
    localStorage.setItem('hydroPro_gps_reports',JSON.stringify({[y+'::V1']:{date:y,vehicleId:'V1',driverId:'E1',helperId:'',odoOut:1,odoIn:2,kmMode:'odo',stops:[{location:'APAC',timeOut:'08:04',kind:'base'}]}}));
    window.__printed='';window.open=function(){return {document:{write:function(h){window.__printed+=h;},close:function(){}}};};
  },
  run:async()=>{
    await sleep(4000);const html=_gpsPersonSelect('helperId','helper',JSON.parse(localStorage.getItem('hydroPro_gps_reports'))[window.__gpsDay+'::V1'],'V1');
    const groups=(html.match(/<optgroup label="([^"]+)"/g)||[]).map(x=>x.replace(/<optgroup label="|"/g,''));
    const hasShernan=/value="E3"[^>]*>TABIOS, SHERNAN/.test(html),helperFirst=groups[0]&&/^Helpers/.test(groups[0]),tempGroup=groups.some(g=>/temporary helper/.test(g));
    window._gpsSelVehId='V1';window._gpsSelDate=window.__gpsDay;
    const R=JSON.parse(localStorage.getItem('hydroPro_gps_reports'));R[window.__gpsDay+'::V1'].helperId='E3';localStorage.setItem('hydroPro_gps_reports',JSON.stringify(R));
    printGpsDaily(window.__gpsDay);await sleep(300);
    const jam=(html.match(/JAMISOLA/gi)||[]).length;
    return {hasShernan,helperFirst,tempGroup,jamOnce:jam===1,printed:/Helper:<\/strong> TABIOS, SHERNAN/.test(window.__printed)};},
  expect:{hasShernan:true,helperFirst:true,tempGroup:true,jamOnce:true,printed:true} },
];
/* v21.23 (Syra): the cloud merge keeps the newer GPS report — another PC's stale copy cannot erase the day's stops */
module.exports.push(
{ name:'☁ GPS report merge: a stale cloud copy (older updatedAt, stops without kind/reason) does NOT replace the local report edited later; a newer cloud copy does; a report only the cloud has is added; saving a changed report stamps updatedAt (v21.23)',
  run:async()=>{
    await sleep(5000);
    const local={'2026-09-28::V1':{date:'2026-09-28',vehicleId:'V1',driverId:'E1',updatedAt:2000,stops:[{location:'APAC',timeOut:'06:12',kind:'base'},{location:'EDSA',timeIn:'07:48',kind:'unplanned',reason:'extra drop'}]},
                 '2026-09-27::V1':{date:'2026-09-27',vehicleId:'V1',updatedAt:1000,stops:[{location:'APAC'}]}};
    const cloud={'2026-09-28::V1':{date:'2026-09-28',vehicleId:'V1',driverId:'E1',updatedAt:1500,stops:[{location:'APAC',timeOut:'06:12'},{location:'EDSA',timeIn:'07:48'}]},
                 '2026-09-27::V1':{date:'2026-09-27',vehicleId:'V1',updatedAt:3000,stops:[{location:'APAC'},{location:'NEW STOP'}]},
                 '2026-09-26::V2':{date:'2026-09-26',vehicleId:'V2',updatedAt:500,stops:[]}};
    const m=JSON.parse(window.__hnxMergeGeneric('hydroPro_gps_reports',JSON.stringify(local),JSON.stringify(cloud)));
    localStorage.setItem('hydroPro_gps_reports',JSON.stringify(local));const all=loadGpsReports();all['2026-09-28::V1'].stops[1].reason='changed';saveGpsReports(all);
    const st=loadGpsReports();
    return {keptLocal:m['2026-09-28::V1'].stops[1].reason==='extra drop',tookNewerCloud:m['2026-09-27::V1'].stops.length===2,added:!!m['2026-09-26::V2'],stamped:st['2026-09-28::V1'].updatedAt>Date.now()-60000,untouchedKept:st['2026-09-27::V1'].updatedAt===1000,savedAt:!!window.__gpsSavedAt};},
  expect:{keptLocal:true,tookNewerCloud:true,added:true,stamped:true,untouchedKept:true,savedAt:true} }
);
