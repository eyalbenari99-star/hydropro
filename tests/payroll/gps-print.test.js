/* v21.19 (Syra): the printed Daily GPS Report names the driver and helper and shows Kind + Reason per stop */
module.exports=[
{ name:'🖨 Daily GPS Report print: Driver and Helper of the day are printed under the truck; every stop has Kind and Reason columns (an unplanned stop shows NOT IN PLAN + its reason); the viewer header shows the helper too (v21.19)',
  seed:function(){
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E1',name:'GARCIA, ANTONIO',status:'Active',position:'Driver',payType:'weekly',dailyRate:658},{id:'E2',name:'JAMISOLA, ANTONIO',status:'Active',position:'Helper',payType:'weekly',dailyRate:658}]));
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
];
