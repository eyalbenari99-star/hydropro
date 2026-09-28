/* v21.20 (Eyal): Sales & Order Intelligence — every figure digs down to the QuickBooks documents behind it */
const SEED=function(){
  localStorage.setItem('hydroPro_qbw_cfg_v1',JSON.stringify({url:'https://nexi-qb.test',token:'t'}));
  const L=function(date,type,docId,no,cid,cust,itemId,item,qty,net){return {date,type,docId,docNum:no,line:1,customerId:cid,customer:cust,itemId,item,desc:'',classId:'',qty,unitPrice:net/qty/100,net,disc:0,currency:'PHP',rate:1,baseNet:net,taxMode:''};};
  const M={'2026-09':{at:Date.now(),docs:3,lines:[L('2026-09-03','Invoice','I1','1001','C1','Marriott Cebu','P1','Romaine',50,1250000),L('2026-09-03','Invoice','I1','1001','C1','Marriott Cebu','P2','Arugula',4,160000),L('2026-09-15','SalesReceipt','S1','2001','C2','Seda Ayala','P1','Romaine',10,250000),L('2026-09-20','CreditMemo','K1','3001','C1','Marriott Cebu','P1','Romaine',-2,-50000)]},
           '2026-08':{at:Date.now(),docs:1,lines:[L('2026-08-20','Invoice','I0','0900','C2','Seda Ayala','P2','Arugula',5,200000)]}};
  const of=window.fetch;window.fetch=function(u){u=String(u);if(/nexi-qb\.test\/qb\/sales/.test(u)){const m=(u.match(/month=(\d{4}-\d{2})/)||[])[1];return Promise.resolve(new Response(JSON.stringify(M[m]||{at:Date.now(),docs:0,lines:[]}),{status:200}));}
    if(/nexi-qb\.test\/qb\/customers/.test(u))return Promise.resolve(new Response(JSON.stringify({customers:[{id:'C1',name:'Marriott Cebu'},{id:'C2',name:'Seda Ayala'}]}),{status:200}));
    if(/nexi-qb\.test/.test(u))return Promise.resolve(new Response('{}',{status:200}));return of.apply(this,arguments);};
};
module.exports=[
{ name:'📈 Drill-down: September bar → 3 documents (2 invoices/receipts + 1 credit memo) net ₱13,610; a document opens its lines; narrowing to Marriott inside the panel leaves 2 documents; the item view lists Romaine with its customers; CSV export has one row per line (v21.20)',
  seed:SEED,
  run:async()=>{
    await sleep(6000);CRMSI.set('year',2026);switchView('crm_sales_intel');await sleep(2500);
    for(let i=0;i<30;i++){if(CRMSI.agg().docs>=4)break;await sleep(500);}
    CRMSI.drill({month:'2026-09'});await sleep(300);let p=document.querySelector('.hnx-si-dr');const t1=p?p.innerText:'';
    const docs=CRMSI.drillDocs({month:'2026-09'});const net=docs.reduce((a,d)=>a+d.net,0);
    CRMSI.drillToggle(docs.find(d=>d.no==='1001').key);await sleep(200);p=document.querySelector('.hnx-si-dr');const linesShown=/Arugula/.test(p.innerText)&&/Romaine/.test(p.innerText);
    CRMSI.drill({customerId:'C1'},true);await sleep(200);const narrowed=CRMSI.drillDocs({month:'2026-09',customerId:'C1'}).length;const title=document.querySelector('.hnx-si-dr').innerText;
    CRMSI.drillClose();await sleep(200);const closed=!document.querySelector('.hnx-si-dr');
    CRMSI.set('tab','items');await sleep(400);const iv=document.getElementById('view-crm_sales_intel').innerText;
    let csv='';const oc=URL.createObjectURL;URL.createObjectURL=function(b){b.text().then(x=>{window.__csv=x;});return oc.call(URL,b);};CRMSI.drill({month:'2026-09'});CRMSI.drillCsv();await sleep(500);URL.createObjectURL=oc;csv=window.__csv||'';CRMSI.drillClose();
    CRMSI.set('tab','overview');await sleep(300);
    const barClick=/CRMSI\.drill\(\{month:'2026-09'\}\)/.test(document.getElementById('view-crm_sales_intel').innerHTML)||/CRMSI\.drill\(\{month:&#39;2026-09&#39;\}\)/.test(document.getElementById('view-crm_sales_intel').innerHTML);
    return {panel:!!t1,docs:docs.length,net,credit:docs.some(d=>d.type==='CreditMemo'),linesShown,narrowed,titleHasMarriott:/Marriott/.test(title),closed,itemsView:/Romaine/.test(iv)&&/Arugula/.test(iv),csvRows:csv.split('\n').filter(l=>/^2026-09/.test(l)).length,barClick};},
  expect:{panel:true,docs:3,net:1610000,credit:true,linesShown:true,narrowed:2,titleHasMarriott:true,closed:true,itemsView:true,csvRows:4,barClick:true} },
];
