/* v21.64 (Eyal: "apple to apple"): offers logged as written, compared normalised. */
module.exports=[
{ name:'🍎 Apple to apple: request 25 pc need-by 2026-10-20. A: 25 × ₱1,120 VAT incl, net 30, 3 d → ₱1,000.00/unit landed, total ₱25,000, score 92 (record 100: answered this RFQ). B: 25 × ₱950 ex-VAT + ₱2,500 delivery, COD, 5 d → ₱1,050.00 landed. C: 20 × ₱900 ex-VAT, 50% advance → cheapest ₱900 but "offers 20 of 25", score 92.5×0.8=74. Nexi recommends A; gap A vs cheapest +11.1% / ₱2,500; totals computed not typed; award pre-selects A (v21.64)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([{id:'pr1',number:'PR-2026-000009',title:'RCP pipes',dept:'Construction',needBy:'2026-10-20',priority:'High',justification:'x',items:[{desc:'RCP 12in',qty:25,unit:'pc',unitCost:1000}],status:'RFQ',rfqId:'rfq1',createdBy:'tester',createdAt:Date.now(),revision:1,workflow:[],overrides:[]}]));
    localStorage.setItem('hydroPro_purch_rfqs',JSON.stringify([{id:'rfq1',number:'RFQ-2026-000001',prId:'pr1',status:'Open',closingDate:'2026-10-10',createdAt:Date.now(),suppliers:[{name:'Supplier A',email:'a@x.com',quote:null},{name:'Supplier B',email:'b@x.com',quote:null},{name:'Supplier C',email:'',quote:null}]}]));},
  run:new Function(`return (async()=>{await sleep(4000);window.alert=()=>{};window.confirm=()=>true;
    switchView('acct_purch_pro');await sleep(600);__PURPRO.openPR('pr1');await sleep(400);
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};
    const log=async(i,q,u,vat,del,terms,lead)=>{__PURPRO.quoteToggle('rfq1:'+i);await sleep(250);set('ppQq',q);set('ppQu',u);set('ppQv',vat);set('ppQdc',del);set('ppQp',terms);set('ppQd',lead);set('ppQb','RCP 12in');set('ppQvu','2026-12-31');__PURPRO.saveQuote('rfq1',i);await sleep(300);};
    await log(0,25,1120,'incl',0,'net 30',3);await log(1,25,950,'excl',2500,'COD',5);await log(2,20,900,'excl',0,'50% advance',2);
    const rfq=JSON.parse(localStorage.getItem('hydroPro_purch_rfqs'))[0];const totals=rfq.suppliers.map(s=>s.quote.total).join(',');
    const A=__PURPRO.a2a('pr1');const r=n=>A.rows.find(x=>x.name===n);const rd=x=>Math.round(x*100)/100;
    __PURPRO.simpleAdvance('pr1','Quotes received: 3');await sleep(400);
    const txt=document.getElementById('view-acct_purch_pro').innerText;
    __PURPRO.simpleAdvance('pr1','Evaluation complete');await sleep(400);
    const sel=document.getElementById('ppAwardSel');
    return {totals,landedA:rd(r('Supplier A').landedUnit),landedB:rd(r('Supplier B').landedUnit),landedC:rd(r('Supplier C').landedUnit),normA:rd(r('Supplier A').normTotal),scoreA:r('Supplier A').score,scoreC:r('Supplier C').score,best:A.best.name,cheapest:A.cheapest.name,gapA:r('Supplier A').gapPct,gapAmtA:r('Supplier A').gapAmt,flagC:r('Supplier C').flags.join('|'),
      shows:/BEST/.test(txt)&&/CHEAPEST/.test(txt)&&/offers 20 of 25/.test(txt)&&/\\+11\\.1%/.test(txt)&&/apple to apple on 25 units/.test(txt),award:sel?sel.value:null};})();`),
  expect:{totals:'28000,26250,18000',landedA:1000,landedB:1050,landedC:900,normA:25000,scoreA:92,scoreC:74,best:'Supplier A',cheapest:'Supplier C',gapA:11.1,gapAmtA:2500,flagC:'offers 20 of 25|VAT to add on invoice',shows:true,award:'Supplier A'} }
];
