/* v21.54 (Eyal): Purchasing sourcing — only suppliers that fit the item, Nexi's web suggestions, add supplier, no [object Object] */
module.exports=[
{ name:'🛒 Sourcing for "RCP reinforced concrete pipes 12\\"": Dali Everyday Grocery and Amazon (unrelated history) are folded under "Other known suppliers"; Hardware Depot (category Construction materials) and Culvert King (sold us "concrete culvert" before) are in the fit list; Nexi suggests Allied Concrete / DAP Pipes / Tosang as WEB · VERIFY; an SOS vendor object no longer prints [object Object]; ➕ save to suppliers writes DAP Pipes into the vendors master with its category; a typed supplier is saved too (v21.54)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_acct_vendors',JSON.stringify([{id:'v1',name:'Amazon'},{id:'v2',name:'Dali Everyday Grocery'},{id:'v3',name:'Hardware Depot',category:'Construction materials',phone:'0917'}]));
    localStorage.setItem('hydroPro_acct_purch_history',JSON.stringify([{id:'h1',date:'2026-08-01',product:'concrete culvert 24in',supplier:'Culvert King',qty:4,unitCost:3000},{id:'h2',date:'2026-08-02',product:'coffee',supplier:'Dali Everyday Grocery',qty:2,unitCost:100}]));
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([{id:'pr1',number:'PR-2026-000002',title:'Cement pipes RCP to connect gh15 drainage to road drainage',dept:'Construction',needBy:'2026-10-05',priority:'High',justification:'x',items:[{desc:'RCP reinforced concrete pipes 12" by 1m',qty:25,unit:'pc'}],status:'Supplier Sourcing',createdBy:'tester',createdAt:Date.now(),revision:1,workflow:[],overrides:[]}]));},
  run:new Function(`return (async()=>{await sleep(4000);window.__hnxSos={getItems:()=>[{name:'x',vendor:{name:'SOS Vendor Obj'}}]};
    switchView('acct_purch_pro');await sleep(600);__PURPRO.tab('prs');await sleep(150);__PURPRO.openPR?__PURPRO.openPR('pr1'):(__PURPRO.open?__PURPRO.open('pr1'):null);await sleep(400);
    const v=document.getElementById('view-acct_purch_pro');const html=v.innerHTML,txt=v.innerText;
    const fitSec=txt.split('Nexi')[0];[...v.querySelectorAll('details')].forEach(d=>d.open=true);const txt2=v.innerText;const other=(txt2.split('Other known suppliers')[1]||'');
    const list=__PURPRO._src?__PURPRO._src():null;
    const dapIdx=[...v.querySelectorAll('.ppSrcPick')].map(b=>Number(b.dataset.i)).find(i=>/DAP Pipes/.test((v.querySelectorAll('.ppSrcPick')[i]||{}).closest?.('tr')?.innerText||''));
    const trs=[...v.querySelectorAll('tr')];const dapTr=trs.find(t=>/DAP Pipes/.test(t.innerText));const idx=dapTr?Number(dapTr.querySelector('.ppSrcPick').dataset.i):-1;
    __PURPRO.srcAdopt(idx);await sleep(200);
    document.getElementById('ppSrcN').value='Carmona Precast';document.getElementById('ppSrcP').value='0918';document.getElementById('ppSrcC').value='Construction materials';__PURPRO.srcAddNew('pr1');await sleep(200);
    const V=JSON.parse(localStorage.getItem('hydroPro_acct_vendors'));
    return {fitHasDepot:/Hardware Depot/.test(fitSec),fitHasCulvert:/Culvert King/.test(fitSec),groceryFolded:/Dali Everyday Grocery/.test(other)&&!/Dali Everyday Grocery/.test(fitSec),amazonFolded:/Amazon/.test(other),sug:/Allied Concrete/.test(txt)&&/DAP Pipes/.test(txt)&&/Tosang/.test(txt),verify:/WEB · VERIFY/.test(txt),noObj:txt.indexOf('[object Object]')<0,sosName:/SOS Vendor Obj/.test(txt2),dap:!!V.find(x=>x.name==='DAP Pipes Manufacturing'&&/concrete/.test(x.category)),typed:!!V.find(x=>x.name==='Carmona Precast'&&x.phone==='0918')};})();`),
  expect:{fitHasDepot:true,fitHasCulvert:true,groceryFolded:true,amazonFolded:true,sug:true,verify:true,noObj:true,sosName:true,dap:true,typed:true} },
];
