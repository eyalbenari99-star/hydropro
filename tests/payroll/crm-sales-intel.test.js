/* v21.13: CRM ▸ Sales & Order Intelligence (phase 1) and the QuickBooks key moved out of the page */
const SEED=function(){
  localStorage.setItem('hydroPro_qbw_cfg_v1',JSON.stringify({url:'https://nexi-qb.test',token:'t'}));
  const L=(date,cust,cname,item,qty,net,type)=>({date,type:type||'Invoice',customerId:cust,customer:cname,itemId:item,item:'Item '+item,qty,net,baseNet:net,currency:'PHP',rate:1});
  const MONTHS={
    '2026-01':[L('2026-01-05','10','Hotel Alpha','1',10,400000),L('2026-01-09','21','Chain Branch A','2',5,150000),L('2026-01-20','20','Chain Mother','1',2,80000)],
    '2026-02':[L('2026-02-03','10','Hotel Alpha','2',3,90000),L('2026-02-11','22','Chain Branch B','1',4,160000),L('2026-02-12','10','Hotel Alpha','1',-1,-40000,'CreditMemo')],
    '2026-03':[L('2026-03-15','30','Private Buyer','1',1,5000)]};
  const CUSTS=[{id:'10',name:'Hotel Alpha',active:true},{id:'20',name:'Chain Mother',active:true},{id:'21',name:'Chain Branch A',parentId:'20',active:true},
    {id:'22',name:'Chain Branch B',parentId:'20',active:true},{id:'30',name:'Private Buyer',active:true},{id:'40',name:'Sleeping Supermarket',active:true}];
  window.__siCalls=[];
  const of=window.fetch;
  window.fetch=function(u,o){
    u=String(u);
    if(u.indexOf('https://nexi-qb.test/')===0){
      window.__siCalls.push(u);
      const q=new URL(u);let body;
      if(q.pathname==='/qb/customers')body={ok:true,customers:CUSTS};
      else if(q.pathname==='/qb/sales'){const m=q.searchParams.get('month');
        if(m==='2026-04')return Promise.resolve(new Response(JSON.stringify({error:'qbo 503'}),{status:502}));
        const lines=MONTHS[m]||[];let net=0;lines.forEach(l=>net+=l.baseNet);
        body={ok:true,month:m,at:Date.parse('2026-09-27T02:00:00+08:00'),closed:true,docs:lines.length,count:lines.length,lines,totals:{net,byType:{Invoice:net}}};}
      return Promise.resolve(new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}}));
    }
    return of.apply(this,arguments);
  };
};
module.exports=[
{ name:'📈 Sales & Order Intelligence: registered under CRM after Sales Analytics; APAC 2026 Jan–Mar = ₱6,450.00 net (credit memo −₱400.00 counted once); 5 buying customers of 6; April unreadable → named in amber, not zero; APAC never mixed with APTI (v21.13)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);
    const vs=MODULES.crm.views.map(v=>v.id);
    switchView('crm_sales_intel');
    CRMSI._test.ST.year=2026;CRMSI.render();
    for(let i=0;i<40;i++){await sleep(250);const D=CRMSI._test.DATA['apac|2026'];if(D&&!D.loading&&CRMSI._test.CUST.apac&&CRMSI._test.CUST.apac.list)break;}
    const A=CRMSI.agg();
    const html=document.getElementById('view-crm_sales_intel').innerHTML;
    const realms=[...new Set(__siCalls.filter(u=>/\/qb\/sales/.test(u)).map(u=>new URL(u).searchParams.get('realm')))];
    return {after:vs.indexOf('crm_sales_intel')===vs.indexOf('crm_sales')+1,total:A.total,credits:A.credits,buying:A.buying,all:A.customersAll,
      aprilNamed:/could not be read[\s\S]*2026-04/.test(html),realms};},
  expect:{after:true,total:845000,credits:-40000,buying:5,all:6,aprilNamed:true,realms:['193514687079844']} },

{ name:'📈 Mother accounts: Chain Mother ₱800.00 direct + Branch A ₱1,500.00 + Branch B ₱1,600.00 = ₱3,900.00 from QuickBooks sub-customers; grand total unchanged by grouping; marking Branch B standalone moves ₱1,600.00 out (v21.13)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);switchView('crm_sales_intel');CRMSI._test.ST.year=2026;CRMSI.render();
    for(let i=0;i<40;i++){await sleep(250);const D=CRMSI._test.DATA['apac|2026'];if(D&&!D.loading&&CRMSI._test.CUST.apac&&CRMSI._test.CUST.apac.list)break;}
    const grp=()=>{const g={};CRMSI.agg().rows.forEach(r=>{g[r.mother]=(g[r.mother]||0)+r.net;});return g;};
    const g1=grp(),t1=Object.values(g1).reduce((a,b)=>a+b,0);
    CRMSI.par('22','-');await sleep(200);
    const g2=grp();
    return {chain:g1['20'],sum:t1,total:CRMSI.agg().total,chainAfter:g2['20'],b22:g2['22']};},
  expect:{chain:390000,sum:845000,total:845000,chainAfter:230000,b22:160000} },

{ name:'📈 Categories are explicit: unset = Unclassified; a card suggestion (Company Type Hotel, same name) is offered, not applied; setting Hotels is saved per company + customer with who/when; the category filter narrows to it (v21.13)',
  seed:new Function('('+SEED.toString()+')();localStorage.setItem(\'hydroPro_crm_customer_master\',JSON.stringify([{legalName:\'Hotel Alpha\',type:\'Hotel\'}]));'),
  run:async()=>{
    await sleep(2500);switchView('crm_sales_intel');CRMSI._test.ST.year=2026;CRMSI.render();
    for(let i=0;i<40;i++){await sleep(250);const D=CRMSI._test.DATA['apac|2026'];if(D&&!D.loading&&CRMSI._test.CUST.apac&&CRMSI._test.CUST.apac.list)break;}
    const before=CRMSI._test.catOf('10'),sug=CRMSI._test.suggestion('Hotel Alpha');
    CRMSI.cat('10','Hotels');await sleep(200);
    const saved=(JSON.parse(localStorage.getItem('hydroPro_crm_sales_class_v1'))||{}).apac['10'];
    CRMSI.set('cat','Hotels');await sleep(100);
    const rows=CRMSI.agg().rows.map(r=>r.name);
    return {before,sug,cat:saved.cat,by:saved.by,stamped:!!saved.at,rows};},
  expect:{before:'',sug:'Hotels',cat:'Hotels',by:'tester',stamped:true,rows:['Hotel Alpha']} },

{ name:'📈 “include customers with no sales” adds Sleeping Supermarket at ₱0.00 without changing the total (v21.13)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);switchView('crm_sales_intel');CRMSI._test.ST.year=2026;CRMSI.render();
    for(let i=0;i<40;i++){await sleep(250);const D=CRMSI._test.DATA['apac|2026'];if(D&&!D.loading&&CRMSI._test.CUST.apac&&CRMSI._test.CUST.apac.list)break;}
    const n1=CRMSI.agg().rows.length;CRMSI.set('zero',true);await sleep(100);const A=CRMSI.agg();
    const z=A.rows.filter(r=>r.id==='40')[0];
    return {n1,n2:A.rows.length,zeroNet:z&&z.net,total:A.total};},
  expect:{n1:5,n2:6,zeroNet:0,total:845000} },

{ name:'🔑 The QuickBooks (qb-api) key is not in the page any more; QB_API_KEY reads the synced setting hydroPro_qb_legacy_key_v1 (v21.13)',
  run:async()=>{
    await sleep(1500);
    const src=document.documentElement.outerHTML;
    const inPage=/hnxai_[0-9a-f]{20,}/.test(src);
    const empty=QB_API_KEY;
    localStorage.setItem('hydroPro_qb_legacy_key_v1',JSON.stringify({key:'k-test-123'}));
    return {inPage,empty,after:QB_API_KEY,fn:hnxQbKey()};},
  expect:{inPage:false,empty:'',after:'k-test-123',fn:'k-test-123'} },
];
