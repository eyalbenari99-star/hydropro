/* v21.19: 🚚 Deliveries — picking a vehicle / driver / helper must not freeze the screen */
const SEED=function(){
  const E=[];for(let i=1;i<=130;i++){const isD=i<=20,isH=i>20&&i<=45;E.push({id:'E'+i,name:(isD?'DRIVER ':isH?'HELPER ':'WORKER ')+i,status:'Active',payType:'weekly',dept:isD||isH?'Logistics':'Construction',position:isD?'Driver':isH?'Helper':'Greenhouse Worker',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'});}
  localStorage.setItem('hydroPro_employees',JSON.stringify(E));
  localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([{id:'V1',name:'ISUZU',plate:'ABC 123',active:true},{id:'V2',name:'L300',plate:'XYZ 789',active:true}]));
  const D=[];const d0=new Date();for(let i=0;i<60;i++){const d=new Date(d0);d.setDate(d.getDate()-(i%14));const y=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    D.push({id:'DLV'+i,date:y,destination:i%2?'PASAY':'MAKATI',customer:i%2?'MARRIOTT, CONRAD':'SEDA',vehicleId:'V1',driverId:'E'+(1+i%20),helperId:'E'+(21+i%25),items:'lettuce',status:'scheduled',createdAt:Date.now()-i*1000,updatedAt:Date.now()-i*1000});}
  localStorage.setItem('hydroPro_log_deliveries',JSON.stringify(D));
};
module.exports=[
{ name:'🚚 Status pick on a row: the table stays in place, the row keeps its value and the Pending / Delivered counters update in place (v21.19)',
  seed:SEED,
  run:async()=>{
    await sleep(4000);switchView('log_deliveries');await sleep(2500);
    const v=document.getElementById('view-log_deliveries');const table=v.querySelector('table.fleet-table');
    const pend0=+document.getElementById('dlvKpiPending').textContent,del0=+document.getElementById('dlvKpiDelivered').textContent;
    const t0=performance.now();_dlvUpd('DLV5','status','delivered');const ms=performance.now()-t0;await sleep(400);
    return {fast:ms<300,sameTable:v.querySelector('table.fleet-table')===table,pend:+document.getElementById('dlvKpiPending').textContent===pend0-1,del:+document.getElementById('dlvKpiDelivered').textContent===del0+1,stored:JSON.parse(localStorage.getItem('hydroPro_log_deliveries')).find(x=>x.id==='DLV5').status};},
  expect:{fast:true,sameTable:true,pend:true,del:true,stored:'delivered'} },

{ name:'🚚 Deliveries with 60 rows and 130 employees: changing the Helper on a row saves it (id and name), keeps the table in place (no full repaint) and takes well under half a second; the background enhancer leaves the table alone while a dropdown has focus (v21.19)',
  seed:SEED,
  run:async()=>{
    await sleep(4000);switchView('log_deliveries');await sleep(2500);
    const v=document.getElementById('view-log_deliveries');const table=v.querySelector('table.fleet-table');
    for(let i=0;i<40;i++){if(v.querySelector('tr[data-hnx-bridge]'))break;await sleep(250);}
    const rows=v.querySelectorAll('tr[data-hnx-bridge]').length;
    const helperSel=v.querySelector('td.hnx-br-helper select');const opts=helperSel?helperSel.options.length:0;
    const pick=Array.from(helperSel.options).find(o=>o.value&&o.value!==helperSel.value);const pickName=pick.text.split(' — ')[0];
    const t0=performance.now();_dlvUpd('DLV3','helperId',pick.value);const ms=performance.now()-t0;await sleep(300);
    const stored=JSON.parse(localStorage.getItem('hydroPro_log_deliveries')).find(x=>x.id==='DLV3');
    const sameTable=v.querySelector('table.fleet-table')===table;
    const sel2=v.querySelector('td.hnx-br-helper select');sel2.focus();const before=sel2.parentNode.innerHTML;
    if(typeof enhanceDeliveries==='function')enhanceDeliveries();await sleep(900);
    const untouched=sel2.parentNode.innerHTML===before&&document.activeElement===sel2;
    return {rows:rows>=50,opts:opts>10,ms:Math.round(ms),fast:ms<450,helperOk:stored.helperId===pick.value,nameOk:stored.helperName===pickName,sameTable,untouched};},
  expect:{rows:true,opts:true,fast:true,helperOk:true,nameOk:true,sameTable:true,untouched:true} },
];
