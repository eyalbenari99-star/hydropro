/* v21.19 (Eyal): CRM → Orders / Sales Analytics show ALL of a month's SOS sales orders and invoices, not only the open ones */
const SEED=function(){
  localStorage.setItem('hnx_cloud_token','t');window.__sosCalls=[];
  const SO=[{number:'SO-9001',customer:{name:'Marriott Cebu'},date:'2026-09-03T00:00:00',shipDate:'2026-09-04',status:'closed',total:12500,lines:[{name:'Romaine',quantity:50,unitprice:250}]},
            {number:'SO-9002',customer:{name:'Seda Ayala'},date:'2026-09-15',status:'open',total:4000,lines:[{name:'Arugula',quantity:10,unitprice:400}]},
            {number:'SO-8001',customer:{name:'Old Co'},date:'2026-08-20',status:'closed',total:999,lines:[{name:'Kale',quantity:1,unitprice:999}]}];
  const INV=[{number:'INV-501',customer:{name:'Marriott Cebu'},date:'2026-09-05',dueDate:'2026-09-20',total:12500,balance:0,status:'paid'},
             {number:'INV-502',customer:{name:'Seda Ayala'},date:'2026-09-16',dueDate:'2026-10-01',total:4000,balance:4000,status:'open'}];
  const mock=function(path){window.__sosCalls.push(String(path));return Promise.resolve(/sales-orders/.test(path)?{salesorders:SO}:{invoices:INV});};
  Object.defineProperty(window,'__hnxApi',{get:function(){return mock;},set:function(){},configurable:true}); /* the app's own definition is ignored */
};
module.exports=[
{ name:'📦 CRM → Orders: the SOS month panel loads September and lists BOTH the closed and the open sales order dated in September (2 orders, ₱16,500) and not the August one; the request asks the worker for the month window and no longer for open=true (v21.19)',
  seed:SEED,
  run:async()=>{
    await sleep(6000);switchView('crm_orders');await sleep(1500);
    HNX_SOSMONTH.setMonth('2026-09');await new Promise(r=>HNX_SOSMONTH.load(r));await sleep(600);
    const v=document.getElementById('view-crm_orders');const p=v.querySelector('.hnx-sosm');const t=p?p.innerText:'';
    const c=HNX_SOSMONTH.cached('2026-09');
    return {panel:!!p,orders:c.orders.length,total:c.orders.reduce((a,o)=>a+o.total,0),hasClosed:/SO-9001/.test(t)&&/closed/.test(t),hasOpen:/SO-9002/.test(t),noAugust:!/SO-8001/.test(t),window:window.__sosCalls.some(u=>/sales-orders\?from=2026-09-01&to=2026-09-30/.test(u)),noOpenFlag:!window.__sosCalls.some(u=>/open=true/.test(u)),kpi:/16,500/.test(t)};},
  expect:{panel:true,orders:2,total:16500,hasClosed:true,hasOpen:true,noAugust:true,window:true,noOpenFlag:true,kpi:true} },

{ name:'📊 CRM → Sales Analytics: the same month shows the invoices with paid ₱12,500 and unpaid balance ₱4,000, by customer; the panel comes back after the screen repaints (v21.19)',
  seed:SEED,
  run:async()=>{
    await sleep(6000);switchView('crm_sales');await sleep(1500);
    HNX_SOSMONTH.setMonth('2026-09');await new Promise(r=>HNX_SOSMONTH.load(r));await sleep(600);
    const v=document.getElementById('view-crm_sales');let t=v.querySelector('.hnx-sosm').innerText;
    const paid=/Paid\s*₱12,500/i.test(t),unpaid=/Unpaid balance\s*₱4,000/i.test(t),inv=/INV-501/.test(t)&&/INV-502/.test(t);
    renderCRMSales();await sleep(1200);const back=!!v.querySelector('.hnx-sosm');
    return {paid,unpaid,inv,back};},
  expect:{paid:true,unpaid:true,inv:true,back:true} },
];
