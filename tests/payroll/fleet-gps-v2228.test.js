/* v22.28 fleet audit L22 (P1) and L30 — Syra, 29 Sep: "some of the data I entered was deleted". The 5-minute GPS generator rebuilt a
   report someone had typed into (its _auto mark was never cleared) and the cloud merge then spread the empty copy. */
const SEED=function(){const d=new Date();const T=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([{id:'V1',plate:'ABC 123',name:'Truck 1'}]));
  const t0=new Date(T+'T09:00:00').getTime();const P=[];const at=(m,lat,lng,sp)=>P.push({ts:t0+m*60000,lat,lng,speed:sp,odo:12000+m});
  for(let m=0;m<=12;m+=2)at(m,14.40,121.00,0);           /* stop 1: 09:00–09:12 */
  for(let m=14;m<=30;m+=2)at(m,14.40+(m-12)*0.002,121.00,40);
  for(let m=32;m<=44;m+=2)at(m,14.45,121.00,0);           /* stop 2: 09:32–09:44 */
  localStorage.setItem('hydroPro_fleet_gps_positions',JSON.stringify({V1:P}));
  localStorage.setItem('hnx_t_today',T);};
module.exports=[
{ name:'🚚 GPS report typed into is never rebuilt: the auto report of Truck 1 (2 stops) gets ODO OUT 12345, 40 L and a note typed → it is no longer auto (editedBy set); the generator then runs 3 times with new pings → 0 rebuilt, ODO 12345 / 40 L / the note kept; an untouched auto report of the same truck on another day is still refreshed (1) (v22.28)',
  requires:"typeof window.hnxGpsTyped==='function'",
  seed:SEED,
  run:async()=>{const T=localStorage.getItem('hnx_t_today');const k=T+'::V1';
    window.generateGpsReportsFromPositions(T);const made0=loadGpsReports()[k]&&loadGpsReports()[k].stops.length;
    const all=loadGpsReports();const r=all[k];const autoBefore=!!(r&&r._auto);
    r.odoOut=12345;r.fillUpLiters=40;r.generalNote='Delivered to Tablo';all[k]=r;saveGpsReports(all);
    const r1=loadGpsReports()[k];
    const P=JSON.parse(localStorage.getItem('hydroPro_fleet_gps_positions'));const last=P.V1[P.V1.length-1];
    let rebuilt=0;for(let i=0;i<3;i++){P.V1.push({ts:last.ts+(i+1)*600000,lat:14.5+i*0.01,lng:121,speed:0,odo:13000+i});localStorage.setItem('hydroPro_fleet_gps_positions',JSON.stringify(P));rebuilt+=window.generateGpsReportsFromPositions(T);}
    const r2=loadGpsReports()[k];
    /* another day, untouched auto report → refreshed */
    const y=new Date(new Date(T+'T12:00:00').getTime()-864e5);const Y=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    const t1=new Date(Y+'T09:00:00').getTime();P.V1=P.V1.concat([0,2,4,6,8,10,12].map(m=>({ts:t1+m*60000,lat:14.4,lng:121,speed:0,odo:11000+m})),[14,16,18].map(m=>({ts:t1+m*60000,lat:14.4+m*0.003,lng:121,speed:40})),[20,22,24,26,28,30,32].map(m=>({ts:t1+m*60000,lat:14.46,lng:121,speed:0,odo:11050+m})));
    localStorage.setItem('hydroPro_fleet_gps_positions',JSON.stringify(P));const madeY=window.generateGpsReportsFromPositions(Y);
    return {made0,autoBefore,mine:!r1._auto&&r1._typed===1&&typeof r1.editedBy==='string',rebuilt,odo:r2.odoOut,litres:r2.fillUpLiters,note:r2.generalNote,madeY};},
  expect:{made0:2,autoBefore:true,mine:true,rebuilt:0,odo:12345,litres:40,note:'Delivered to Tablo',madeY:1} },

{ name:'☁ Cloud merge: Syra\'s typed copy (stamp 10:00) against another computer\'s untouched auto copy of the same truck-day (stamp 10:02, newer) → her copy stays; the other way round (auto here newer, typed in the cloud older) → the typed copy is taken; two typed copies → the newer one, as before (v22.28)',
  requires:"typeof window.hnxGpsTyped==='function'",
  run:async()=>{const M=window.__hnxMergeGeneric;const k='2026-10-10::V1';
    const typed={vehicleId:'V1',date:'2026-10-10',stops:[{location:'Tablo',km:12}],odoOut:12345,fillUpLiters:40,_typed:1,updatedAt:1000};
    const auto={vehicleId:'V1',date:'2026-10-10',stops:[{location:'14.4,121',km:null,litersFilled:''}],odoOut:12000,fillUpLiters:null,perLiter:null,dashCam:'WORKING',generalNote:'(auto-generated from GPS)',_auto:true,updatedAt:2000};
    const a=M('hydroPro_gps_reports',JSON.stringify({[k]:typed}),JSON.stringify({[k]:auto}));
    const b=M('hydroPro_gps_reports',JSON.stringify({[k]:auto}),JSON.stringify({[k]:Object.assign({},typed,{updatedAt:500})}));
    const t2=Object.assign({},typed,{fillUpLiters:42,updatedAt:3000});
    const c=M('hydroPro_gps_reports',JSON.stringify({[k]:typed}),JSON.stringify({[k]:t2}));
    return {keep:a===null,take:b?JSON.parse(b)[k].fillUpLiters:null,newer:c?JSON.parse(c)[k].fillUpLiters:null};},
  expect:{keep:true,take:40,newer:42} },

{ name:'📋 Daily Report viewer in the Manila day: from 10 Oct ▶ → 11 Oct, ◀ ◀ → 9 Oct, Today = the computer\'s own date (v22.28)',
  requires:"typeof window._drCurDate==='function'",
  run:async()=>{window._drSetDate('2026-10-10');window._drNext();const a=window._drCurDate();window._drPrev();window._drPrev();const b=window._drCurDate();
    window._drToday();const d=new Date();const T=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    return {next:a,prev2:b,today:window._drCurDate()===T};},
  expect:{next:'2026-10-11',prev2:'2026-10-09',today:true} }
];
