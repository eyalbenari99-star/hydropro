/* v22.28 fleet audit L26/L11 · Eyal A1-24 ("the no-cash card log is the truth — one km/L"): the same truck on the same day
   showed a different km/L on every fleet screen, because each divided its own km by its own litres. One rule now:
   km = the GPS legs (v21.23), else the odometer; litres = the chosen fuel record (no-cash card log), else the trip sheet.
   L17: the Logistics Coordinator counted every truck as due for service (v.lastServiceOdo is never written). */
function seed(){
  const T=window.hnxTruckDay.today(), d1=window.hnxTruckDay.shift(T,-1), d2=window.hnxTruckDay.shift(T,-2);
  localStorage.removeItem('hydroPro_fuel_truth_v1');
  localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([
    {id:'V1',name:'Isuzu Travis',plate:'NEQ-4101',driverId:'D1',status:'active'},
    {id:'V2',name:'Canter Two',plate:'ABC-123',status:'active'}]));
  localStorage.setItem('hydroPro_fuel_card_log_v1',JSON.stringify([{id:'c1',truck:'V1',plate:'NEQ-4101',date:d1,liters:9,actualPhp:540}]));
  localStorage.setItem('hydroPro_fleet_fuel','[]');
  const rep={};
  rep[d1+'::V1']={date:d1,vehicleId:'V1',driverId:'D1',odoOut:1000,odoIn:1080,fillUpLiters:10,perLiter:60,
    stops:[{location:'Base',km:null,timeOut:'07:00'},{location:'A',km:40,timeIn:'08:00',timeOut:'08:30'},{location:'B',km:85.5,timeIn:'10:00'}]};
  rep[d2+'::V1']={date:d2,vehicleId:'V1',driverId:'D1',odoOut:2000,odoIn:2060,fillUpLiters:12,perLiter:60,stops:[]};
  rep[d1+'::V2']={date:d1,vehicleId:'V2',odoOut:14400,odoIn:14500,stops:[]};
  localStorage.setItem('hydroPro_gps_reports',JSON.stringify(rep));
  localStorage.setItem('hydroPro_admin_fleet_daily_v1',JSON.stringify([{id:'L9',vid:'fl1',name:'Isuzu Travis',plate:'NEQ 4101',date:d2,odoOut:2000,odoIn:2060,dist:60,fuelL:15,pricePerL:60,fuelCost:900,kmPerL:4}]));
  localStorage.setItem('hydroPro_fleet_vehicle_service',JSON.stringify({V2:[{id:'s1',date:'2026-06-01',type:'PMS',mileage:5000}]}));
  window.hnxTruckDay.reset();
  return {d1,d2};
}
/* each run() is serialised into the page on its own — withSeed() puts seed() inside it */
function withSeed(fn){return eval('(async()=>{const seed='+seed.toString()+';return ('+fn.toString()+')();})');}
module.exports=[
{ name:'⛽ One truck-day, one km/L (A1-24): Travis day 1 — GPS legs 40 + 45.5 = 85.5 km (odometer says 80), card log 9 L (trip sheet typed 10 L) → 9.50 km/L from the card; day 2 — no legs, odometer 60 km, no card fill → trip sheet 12 L → 5.00 km/L, labelled "trip sheet" (v22.28)',
  requires:"typeof window.hnxTruckDay==='function'&&!!window.HNXFuelTruth",
  run:withSeed(async()=>{
    const {d1,d2}=seed();
    const a=window.hnxTruckDay(d1,'V1'), b=window.hnxTruckDay(d2,'V1');
    return {a:[a.km,a.kmSrc,a.liters,a.lSrc,a.kmL.toFixed(2),a.sheetL],
            b:[b.km,b.kmSrc,b.liters,b.lSrc,b.kmL.toFixed(2)],
            noteA:window.hnxTruckDay.note(a,true), noteB:/trip sheet/.test(window.hnxTruckDay.note(b,true))};
  }),
  expect:{a:[85.5,'gps',9,'nocash','9.50',10],b:[60,'odo',12,'sheet','5.00'],noteA:'card log 9 L · sheet 10 L',noteB:true} },

{ name:'⛽ Every screen says the same km/L (fleet audit L26/L11): Travis over the two days = 145.5 km ÷ 21 L = 6.93 km/L on Fleet-AI (driver D1) AND the Logistics Coordinator (21.0 L); the Fleet-AI daily log row for day 2 shows 5.00 km/L (was its own 4.00 from 15 L typed) and says the trip sheet 12 L was used (v22.28)',
  requires:"typeof window.hnxTruckDay==='function'&&typeof window.renderLogisticsCoordinator==='function'&&!!(window.__hnxAskCtx&&window.__hnxAskCtx.fleetai)&&!!(window.__hnxFLEET&&window.__hnxFLEET.fuelHtml)",
  run:withSeed(async()=>{
    seed();
    window.__hnxFAIPeriod='all';
    const fa=window.__hnxAskCtx.fleetai();
    const drv=(fa.drivers||[]).find(x=>x.trips===2)||{};
    window.renderLogisticsCoordinator();
    const body=document.getElementById('logisticsCoordBody');
    const row=[...body.querySelectorAll('tr')].find(tr=>/Isuzu Travis/.test(tr.textContent))||{textContent:''};
    const fl=window.__hnxFLEET.fuelHtml();
    return {fai:drv.kmPerL, coord:/21\.0L/.test(row.textContent)&&/6\.93 km\/L/.test(row.textContent),
            flRow:/>5\.00</.test(fl), flOld:/>4\.00</.test(fl), flNote:/km\/L uses trip sheet 12 L/.test(fl)};
  }),
  expect:{fai:6.93,coord:true,flRow:true,flOld:false,flNote:true} },

{ name:'🔧 Service due (fleet audit L17): Canter — service history at 5,000 km, odometer now 14,500, 100 km/day → 500 km left = 5d and counted in "Service ≤7d" (1); Travis has no service logged → "no service logged", NOT counted (was: every truck due) (v22.28)',
  requires:"typeof window.hnxTruckDay==='function'&&typeof window.renderLogisticsCoordinator==='function'",
  run:withSeed(async()=>{
    seed();
    window.renderLogisticsCoordinator();
    const body=document.getElementById('logisticsCoordBody');
    const rows=[...body.querySelectorAll('tr')];
    const can=(rows.find(tr=>/Canter Two/.test(tr.textContent))||{textContent:''}).textContent;
    const tra=(rows.find(tr=>/Isuzu Travis/.test(tr.textContent))||{textContent:''}).textContent;
    const stat=[...body.querySelectorAll('.pay-stat')].find(x=>/Service ≤7d/.test(x.textContent));
    return {can:/5d/.test(can)&&/500 km/.test(can), tra:/no service logged/.test(tra),
            due:stat?stat.querySelector('.pay-stat-val').textContent.trim():null};
  }),
  expect:{can:true,tra:true,due:'1'} }
];
