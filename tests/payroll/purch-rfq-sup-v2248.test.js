/* v22.48 (Jinky, 11 Oct 2026, screenshot of RFQ-2026-000002 for PR-2026-000002 "Cement pipes RCP to connect gh15 drainage"): "How
   can I change the selected suppliers? The ones I canvassed with an RCP are not on the list." — an open RFQ takes more suppliers
   and a supplier can be taken off it with a reason (ported to stable from the v22.29 trial). */
module.exports=[
{ name:'📨 RFQ-2026-000002 (5 suppliers from Nexi, none quoted): Jinky adds "Rizal RCP Pipes" she canvassed by phone (0917 555 0101) → 6 suppliers, not sent yet, marked added late; adds "Wilcon Depot" from the supplier cards → its email comes from the card; adding Wilcon again is refused; takes "Triox Enterprise OPC" off ("no RCP stock") → 6 left, Triox kept in the record with its reason; an offer can be logged for the new supplier; a closed RFQ takes nobody and the last supplier cannot be taken off',
  requires:"!!(window.__PURPRO&&window.__PURPRO.rfqAddSupplier&&window.__PURPRO.rfqRemoveSupplier)",
  run:async()=>{
    const U={jinky:{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',department:'Purchasing',active:true}}; /* Purchasing EDIT: the RFQ steps need it (canEditPurch) */
    localStorage.setItem('hydroPro_users',JSON.stringify(Object.values(U)));
    const g=window.getCurrentUser;window.getCurrentUser=()=>U.jinky;
    const toasts=[],al=[];const st=window.showToast;window.showToast=(m)=>toasts.push(String(m));window.alert=m=>al.push(String(m));window.confirm=()=>true;window.prompt=()=>'no RCP stock';
    localStorage.setItem('hydroPro_acct_vendors',JSON.stringify([{id:'v1',name:'Wilcon Depot',email:'sales@wilcon.ph',phone:''}]));
    const box=document.createElement('div');box.style.display='none';
    ['ppAddSupN','ppAddSupE','ppAddSupP'].forEach(id=>{const o=document.getElementById(id);if(o)o.remove();const i=document.createElement('input');i.id=id;box.appendChild(i);});
    document.body.appendChild(box);const v=(id,x)=>{document.getElementById(id).value=x;};
    const five=['Famous Lumber & Construction Supply','San Yin Hardware and Construction Supply','Sharecon Concrete Products Trading','SWCC Hardware & Construction Supplies','Triox Enterprise OPC'];
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([{id:'pr2',number:'PR-2026-000002',title:'Cement pipes RCP to connect gh15 drainage to road draiange',dept:'Construction',needBy:'2026-10-05',
      items:[{desc:'RCP renforce cocrete pipes 12" by 1m',qty:25,unit:'pc'}],status:'RFQ',rfqId:'r2',createdBy:'jinky',createdAt:1,workflow:[],overrides:[]}]));
    localStorage.setItem('hydroPro_purch_rfqs',JSON.stringify([{id:'r2',number:'RFQ-2026-000002',prId:'pr2',status:'Open',closingDate:'2026-10-12',
      suppliers:five.map(n=>({name:n,email:'',phone:'',sentAt:null,channel:null,quote:null}))}]));
    const RF=()=>JSON.parse(localStorage.getItem('hydroPro_purch_rfqs'))[0];
    v('ppAddSupN','Rizal RCP Pipes');v('ppAddSupE','');v('ppAddSupP','0917 555 0101');__PURPRO.rfqAddSupplier('r2');await sleep(30);
    const r1=RF(),nw=r1.suppliers[5]||{};
    v('ppAddSupN','Wilcon Depot');v('ppAddSupE','');v('ppAddSupP','');__PURPRO.rfqAddSupplier('r2');await sleep(30);
    const wil=(RF().suppliers.find(s=>s.name==='Wilcon Depot')||{}).email;
    toasts.length=0;v('ppAddSupN','wilcon depot');__PURPRO.rfqAddSupplier('r2');await sleep(30);const dup=RF().suppliers.length===7&&toasts.some(t=>/already on RFQ-2026-000002/.test(t));
    __PURPRO.rfqRemoveSupplier('r2',4);await sleep(30);const r3=RF();
    const names=r3.suppliers.map(s=>s.name),rem=(r3.removed||[]).map(r=>[r.name,r.removeReason,r.removedBy]);
    /* the new supplier can be quoted like the others */
    const idx=r3.suppliers.findIndex(s=>s.name==='Rizal RCP Pipes');
    const closed=JSON.parse(localStorage.getItem('hydroPro_purch_rfqs'));closed[0].status='Closed';localStorage.setItem('hydroPro_purch_rfqs',JSON.stringify(closed));
    toasts.length=0;v('ppAddSupN','Late Supplier');__PURPRO.rfqAddSupplier('r2');await sleep(30);const closedRefused=!RF().suppliers.some(s=>s.name==='Late Supplier')&&toasts.some(t=>/closed/.test(t));
    const one=JSON.parse(localStorage.getItem('hydroPro_purch_rfqs'));one[0].status='Open';one[0].suppliers=one[0].suppliers.slice(0,1);localStorage.setItem('hydroPro_purch_rfqs',JSON.stringify(one));
    al.length=0;__PURPRO.rfqRemoveSupplier('r2',0);await sleep(30);const lastKept=RF().suppliers.length===1&&al.some(m=>/at least one supplier/.test(m));
    window.getCurrentUser=g;window.showToast=st;box.remove();
    return {n6:r1.suppliers.length,nw:[nw.name,nw.phone,nw.sentAt,nw.quote,!!nw.addedLate,nw.addedBy],wil,dup,names,rem,idx,closedRefused,lastKept};},
  expect:{n6:6,nw:['Rizal RCP Pipes','0917 555 0101',null,null,true,'jinky'],wil:'sales@wilcon.ph',dup:true,
    names:['Famous Lumber & Construction Supply','San Yin Hardware and Construction Supply','Sharecon Concrete Products Trading','SWCC Hardware & Construction Supplies','Rizal RCP Pipes','Wilcon Depot'],
    rem:[['Triox Enterprise OPC','no RCP stock','jinky']],idx:4,closedRefused:true,lastKept:true} }
];
