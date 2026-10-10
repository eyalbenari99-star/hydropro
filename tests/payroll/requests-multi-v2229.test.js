/* v22.29 trial (Eyal 9 Oct, rebuilt after the reset): one Item Request carries many items; an item NOT IN SOS is a red critical line
   that raises ONE urgent Purchasing call, which closes by itself once the item is in SOS; Purchasing turns every line into the PR. */
module.exports=[
{ name:'📦 Item request with 2 items: Nitrile gloves L 5 box (SOS SKU1) + "Mystery bolt" 4 pc (NOT IN SOS) → one request, 2 lines, first line kept in the old fields; 1 urgent Purchasing call "NOT IN SOS"; SOS gets "Mystery bolt" (MB1) → the line turns ordinary and the call closes by itself; From Inventory makes a PR with both lines (v22.29)',
  requires:"!!(window.__hnxInvReq&&window.__hnxInvReq.addLine&&window.__hnxInvReq.sweepNotInSos)",
  run:async()=>{
    window.showToast=()=>{};window.alert=()=>{};window.confirm=()=>true;
    const gs=window.__hnxSos;window.__hnxSos={getItems:()=>[{name:'Nitrile gloves L',sku:'SKU1'}]};
    localStorage.setItem('hydroPro_inv_requests_v1','[]');window.saveCalls([]);
    const R=window.__hnxInvReq;R.reset();
    const set=(k,v)=>R.set(k,v,false);
    set('type','purchase');set('itemSource','existing');set('itemSku','SKU1');set('itemName','Nitrile gloves L');set('qty',5);set('unit','box');set('unitCost',100);
    R.addLine();
    set('itemSource','new');set('itemName','Mystery bolt');set('qty',4);set('unit','pc');set('unitCost',5);
    set('reason','Repair of the GH1 frame');set('fulfillType','location');set('toLoc','GH1');
    R.submit();await sleep(50);
    const rq=JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1'))[0]||{};
    const lines=(rq.lines||[]).map(l=>[l.itemName,l.qty,l.notInSos]);
    const legacy=[rq.itemName,rq.qty,rq.itemSku];
    let calls=window.loadCalls().filter(c=>c.id==='call_nis_'+rq.id);
    const call=calls.map(c=>[c.priority,c.sourceModule,/NOT IN SOS/.test(c.subject),c.status]);
    window.__hnxSos={getItems:()=>[{name:'Nitrile gloves L',sku:'SKU1'},{name:'Mystery bolt',sku:'MB1'}]};
    const swept=R.sweepNotInSos();await sleep(30);
    const rq2=JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1'))[0]||{};
    const after=[rq2.lines[1].notInSos,rq2.lines[1].itemSku];
    const closed=(window.loadCalls().find(c=>c.id==='call_nis_'+rq.id)||{}).status;
    window.__PURPRO.fromInv('req',rq.id);await sleep(50);
    const pr=JSON.parse(localStorage.getItem('hydroPro_purch_prs')||'[]').find(p=>p.source&&p.source.id===rq.id)||JSON.parse(localStorage.getItem('hydroPro_purch_prs')||'[]').slice(-1)[0]||{};
    window.__hnxSos=gs;
    return {lines,legacy,call,swept,after,closed,pr:(pr.items||[]).map(i=>[i.desc,i.qty])};},
  expect:{lines:[['Nitrile gloves L',5,false],['Mystery bolt',4,true]],legacy:['Nitrile gloves L',5,'SKU1'],call:[['urgent','purchasing',true,'open']],swept:1,after:[false,'MB1'],closed:'closed_fixed',
    pr:[['Nitrile gloves L',5],['Mystery bolt',4]]} }
];
