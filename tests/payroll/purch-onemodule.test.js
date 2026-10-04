/* v21.65: one Purchasing module; local vs import sourcing; numbering; inventory inbox. */
module.exports=[
{ name:'🏘🌏 Local vs import: "Portland cement 40kg" is LOCAL (no Alibaba link, the Alibaba vendor is folded away); "NFT hydroponic pipes 3m" is IMPORT — 🌏 Imported before shows Alibaba Hydro Co (2 orders) and the Search Alibaba link; the override dropdown turns cement into BOTH and is remembered (v21.65)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_acct_vendors',JSON.stringify([{id:'v1',name:'Alibaba Hydro Co',category:'Import — Alibaba'},{id:'v2',name:'Silang Hardware',category:'Construction materials',phone:'0917'}]));
    localStorage.setItem('hydroPro_acct_purch_history',JSON.stringify([{id:'h1',date:'2026-05-01',product:'NFT pipe hydroponic channel 3m',supplier:'Alibaba Hydro Co',qty:100,unitCost:400,source:'alibaba'},{id:'h2',date:'2026-06-01',product:'NFT pipes 3m',supplier:'Alibaba Hydro Co',qty:50,unitCost:380,source:'alibaba'},{id:'h3',date:'2026-07-01',product:'Portland cement 40kg',supplier:'Silang Hardware',qty:100,unitCost:260}]));
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([{id:'pr1',number:'PR-2026-000001',title:'Cement for GH15 footing',dept:'Construction',needBy:'2026-10-20',priority:'High',justification:'x',items:[{desc:'Portland cement 40kg',qty:200,unit:'bag'}],status:'Supplier Sourcing',createdBy:'tester',createdAt:Date.now(),revision:1,workflow:[],overrides:[]},{id:'pr2',number:'PR-2026-000002',title:'NFT pipes for GH3',dept:'Production',needBy:'2026-11-20',priority:'Normal',justification:'x',items:[{desc:'NFT hydroponic pipes 3m',qty:300,unit:'pc'}],status:'Supplier Sourcing',createdBy:'tester',createdAt:Date.now(),revision:1,workflow:[],overrides:[]}]));},
  run:new Function(`return (async()=>{await sleep(4000);switchView('acct_purch_pro');await sleep(600);
    __PURPRO.openPR('pr1');await sleep(400);const v=document.getElementById('view-acct_purch_pro');const h1=v.innerHTML,t1=v.innerText;
    const c1=__PURPRO.sourceClass('pr1').cls;const cementAli=/alibaba\\.com\\/trade/.test(h1);const cementLocalTxt=/LOCAL — buy near the farm/.test(t1)&&/Importing makes no sense/.test(t1);
    [...v.querySelectorAll('details')].forEach(d=>d.open=true);const folded=(v.innerText.split('Other known suppliers')[1]||'').includes('Alibaba Hydro Co');
    __PURPRO.openPR('pr2');await sleep(400);const h2=v.innerHTML,t2=v.innerText;const c2=__PURPRO.sourceClass('pr2').cls;
    const impSec=(t2.split('Imported before')[1]||'').split('Local alternatives')[0];const impHas=impSec.includes('Alibaba Hydro Co')&&/2 orders/.test(impSec);const aliLink=h2.indexOf('alibaba.com/trade/search?SearchText=')>=0;const chip=/IMPORTED BEFORE/.test(t2);
    __PURPRO.srcClass('pr1','both');await sleep(300);const c1b=__PURPRO.sourceClass('pr1').cls;const saved=JSON.parse(localStorage.getItem('hydroPro_purch_source_class_v1')||'{}');
    return {c1,cementAli,cementLocalTxt,folded,c2,impHas,aliLink,chip,c1b,remembered:Object.values(saved)[0]};})();`),
  expect:{c1:'local',cementAli:false,cementLocalTxt:true,folded:true,c2:'import',impHas:true,aliLink:true,chip:true,c1b:'both',remembered:'both'} },
{ name:'🛒 One module: Quick Tools is gone from the Accounting sidebar; 🛒 Purchasing has 📥 From Inventory and 🧰 Suppliers & tools tabs; an Inventory purchase request (Rockwool cubes × 500) becomes PR-2026-000008 (max of records 000007 + 1, counter reset) in Submitted with the link both ways and updatedAt; the Suppliers & tools screen carries the same tab bar (v21.65)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_purch_counters',JSON.stringify({}));
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([{id:'pr7',number:'PR-2026-000007',title:'Old',dept:'Production',needBy:'2026-10-20',priority:'Normal',justification:'x',items:[{desc:'x',qty:1}],status:'Completed',createdBy:'tester',createdAt:1,revision:1,workflow:[],overrides:[]}]));
    localStorage.setItem('hydroPro_inv_requests_v1',JSON.stringify([{id:'r1',no:'REQ-2026-0005',type:'purchase',status:'submitted',itemName:'Rockwool cubes 2in',itemSku:'RW-2',qty:500,unit:'pc',unitCost:3,needDept:'Production',neededBy:'2026-10-30',reason:'restock GH3',createdBy:'jinky'},{id:'r2',no:'REQ-2026-0006',type:'issue',status:'submitted',itemName:'Gloves',qty:5}]));},
  run:new Function(`return (async()=>{await sleep(4000);const vis=getVisibleViews('accounting').map(v=>v.id);
    switchView('acct_purch_pro');await sleep(600);const v=document.getElementById('view-acct_purch_pro');const nav=v.querySelector('.pp-nav').innerText;
    __PURPRO.tab('inv');await sleep(300);const t=v.innerText;const listed=/Rockwool cubes 2in/.test(t)&&!/Gloves/.test(t);
    __PURPRO.fromInv('req','r1');await sleep(400);
    const prs=JSON.parse(localStorage.getItem('hydroPro_purch_prs'));const pr=prs.find(p=>p.source&&p.source.id==='r1');const req=JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1'))[0];
    switchView('acct_purchasing');await sleep(1500);const qnav=document.getElementById('ppNavQuick');
    return {hidden:!vis.includes('acct_purchasing'),pro:vis.includes('acct_purch_pro'),tabs:/From Inventory/.test(nav)&&/Suppliers & tools/.test(nav),listed,num:pr&&pr.number,status:pr&&pr.status,qty:pr&&pr.items[0].qty,back:req.prNumber,upd:!!(pr&&pr.updatedAt),qnav:!!qnav&&/Suppliers & tools/.test(qnav.innerText)};})();`),
  expect:{hidden:true,pro:true,tabs:true,listed:true,num:'PR-2026-000008',status:'Submitted',qty:500,back:'PR-2026-000008',upd:true,qnav:true} }
];
