/* v22.28 (Eyal 9 Oct, rebuilt after the trial was lost): an open RFQ takes more suppliers and more items, a supplier can be taken
   off it, items are picked from SOS (NOT IN SOS is a red critical line), items added after approval are checked before the award,
   and a request can go back one step with a reason. */
module.exports=[
{ name:'📨 Open RFQ-2026-000012 for PR-2026-000050 (approved ₱3,000 = 10 × ₱300): Joshane adds Wilcon (3 suppliers), takes Bravo off ("no stock") → 2; adds Gravel 5 × ₱100 (+16.7%) → Jinky checks; adds Rebar 10 × ₱200 (₱5,500, +83%) → Eyal / Dr Amy check, the award is blocked, Jinky cannot clear it, Dr Amy can; SOS has "Cement 40kg": "cement 40kg" becomes Cement 40kg (C40), "Mystery bolt" is NOT IN SOS; back one step → Supplier Sourcing, RFQ superseded; a stale second press does nothing (v22.28)',
  requires:"!!(window.__PURPRO&&window.__PURPRO.rfqAddItem&&window.__PURPRO.backStep&&window.hnxSosItemExact)",
  run:async()=>{
    const U={joshane:{username:'joshane',fullname:'Joshane Cruz',role:'staff',department:'Purchasing',active:true},amy:{username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
      jinky:{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true}};
    localStorage.setItem('hydroPro_users',JSON.stringify(Object.values(U)));
    const g=window.getCurrentUser,gs=window.__hnxSos;const as=k=>{window.getCurrentUser=()=>U[k];};
    const al=[];window.showToast=()=>{};window.alert=m=>al.push(String(m));window.confirm=()=>true;window.prompt=()=>'no stock';
    localStorage.setItem('hydroPro_pa_inbox_v1','[]');localStorage.removeItem('hydroPro_purch_roles_v1');window.__hnxSos=undefined;
    const box=document.createElement('div');box.style.display='none';
    ['ppAddSupN','ppAddSupE','ppAddSupP','ppAddItD','ppAddItQ','ppAddItU','ppAddItC'].forEach(id=>{const o=document.getElementById(id);if(o)o.remove();const i=document.createElement('input');i.id=id;box.appendChild(i);});
    document.body.appendChild(box);const v=(id,x)=>{document.getElementById(id).value=x;};
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([{id:'pr50',number:'PR-2026-000050',title:'GH15 drainage',dept:'Construction',needBy:'2026-10-20',items:[{desc:'Cement',qty:10,unitCost:300}],
      status:'RFQ',rfqId:'r12',createdBy:'eyal',createdAt:1,approvedAt:Date.now()-86400000,approvedEstimate:3000,approvedBy:'amy',workflow:[],overrides:[]}]));
    localStorage.setItem('hydroPro_purch_rfqs',JSON.stringify([{id:'r12',number:'RFQ-2026-000012',prId:'pr50',status:'Open',closingDate:'2026-10-15',
      suppliers:[{name:'Alpha Hardware',email:'a@x.ph',sentAt:Date.now()-3600000,quote:{total:2900,at:Date.now()-3000000}},{name:'Bravo Supply',phone:'0917',sentAt:Date.now()-3600000,quote:null}]}]));
    const PR=()=>JSON.parse(localStorage.getItem('hydroPro_purch_prs'))[0],RF=()=>JSON.parse(localStorage.getItem('hydroPro_purch_rfqs'))[0];
    as('joshane');
    v('ppAddSupN','Wilcon Depot');v('ppAddSupE','sales@wilcon.ph');__PURPRO.rfqAddSupplier('r12');await sleep(20);const n3=RF().suppliers.length,late=!!RF().suppliers[2].addedLate;
    __PURPRO.rfqRemoveSupplier('r12',1);await sleep(20);const sup=RF().suppliers.map(s=>s.name),rem=(RF().removed||[]).map(r=>[r.name,r.removeReason]);
    v('ppAddItD','Gravel');v('ppAddItQ','5');v('ppAddItC','100');__PURPRO.rfqAddItem('pr50');await sleep(20);const need1=PR().addedPending&&PR().addedPending.need;
    const jinkyTold=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')).some(x=>x.user==='jinky'&&/items added after approval/.test(x.title));
    v('ppAddItD','Rebar');v('ppAddItQ','10');v('ppAddItC','200');__PURPRO.rfqAddItem('pr50');await sleep(20);const need2=PR().addedPending&&PR().addedPending.need;
    as('amy');al.length=0;__PURPRO.award('pr50','Alpha Hardware');await sleep(20);const blocked=al.some(m=>/must check them before the award/.test(m));
    as('jinky');__PURPRO.acceptAdded('pr50');await sleep(20);const stillJ=!!PR().addedPending;
    as('amy');__PURPRO.acceptAdded('pr50');await sleep(20);const cleared=[!PR().addedPending,PR().approvedEstimate];
    window.__hnxSos={getItems:()=>[{name:'Cement 40kg',sku:'C40'}]};
    as('joshane');v('ppAddItD','cement 40kg');v('ppAddItQ','2');v('ppAddItC','250');__PURPRO.rfqAddItem('pr50');await sleep(20);
    v('ppAddItD','Mystery bolt');v('ppAddItQ','4');v('ppAddItC','5');__PURPRO.rfqAddItem('pr50');await sleep(20);
    const it=PR().items.slice(-2).map(x=>[x.desc,x.code,x.notInSos]);
    __PURPRO.backStep('pr50','RFQ');await sleep(20);const back=[PR().status,RF().status];
    __PURPRO.backStep('pr50','RFQ');await sleep(20);const stale=PR().status;
    window.getCurrentUser=g;window.__hnxSos=gs;box.remove();
    return {n3,late,sup,rem,need1,jinkyTold,need2,blocked,stillJ,cleared,it,back,stale};},
  expect:{n3:3,late:true,sup:['Alpha Hardware','Wilcon Depot'],rem:[['Bravo Supply','no stock']],need1:'checker',jinkyTold:true,need2:'approver',blocked:true,stillJ:true,cleared:[true,5500],
    it:[['Cement 40kg','C40',false],['Mystery bolt','',true]],back:['Supplier Sourcing','Superseded'],stale:'Supplier Sourcing'} }
];
