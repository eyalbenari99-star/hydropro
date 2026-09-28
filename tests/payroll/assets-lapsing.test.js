/* v21.22 (Eyal): Accounting → Assets — the 2026 lapsing schedule built in, dedupe on re-import, QB recording status and the JE per asset */
module.exports=[
{ name:'🏗 2026 lapsing recon: one click registers the 34 assets of the 28-Sep-2026 schedule (₱10,117,246.22); loading again adds 0 and updates 34; 2 containers are NOT IN QB, the Lenovo Legion is booked as INVENTORY (JE 1 credits 1016-300-014), a Water Tank sits in the fixed-asset account (JE 1 optional); the recon card totals each case (v21.22)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);try{hnxArTab('new');}catch(e){}await sleep(500);
    const r1=hnxArLoadLapsing2026();await sleep(400);const r2=hnxArLoadLapsing2026();await sleep(400);
    const st=JSON.parse(localStorage.getItem('hydroPro_asset_recon_v1'));const NA=(st.newAssets||st.data&&st.data.newAssets||[]);
    const rows=NA.filter(n=>String(n.acq||'').slice(0,4)==='2026');const cost=Math.round(rows.reduce((a,n)=>a+(+n.price||0),0)*100)/100;
    const stat=n=>hnxArQbRecStatus({qbFrom:n.qbFrom,notes:n.notes}).k;
    const notqb=rows.filter(n=>stat(n)==='notqb').map(n=>n.desc.slice(0,22));
    const len=rows.find(n=>/Lenovo Legion/.test(n.desc));const plan=hnxArNewAssetPlan(len.ref,'2026-09-29');
    const tank=rows.find(n=>/Water Tank/.test(n.desc));const ptank=hnxArNewAssetPlan(tank.ref,'2026-09-29');
    const v=document.getElementById('view-acct_assets');const txt=v.innerText;
    /* make sure the New Asset tab is showing the card */
    return {added:r1.added,updated:r1.updated,again:r2.added,againUpd:r2.updated,n:rows.length,cost,notqb:notqb.sort(),lenStatus:stat(len),lenPo:len.po,lenCredit:plan.je1.rows[1].acct.slice(0,12),tankStatus:stat(tank),tankOptional:!!ptank.je1.optional,card:/2026 lapsing recon/i.test(txt),fileMon:len.fileMon,rockDep:rows.find(n=>/Rockwool 80/.test(n.desc)).fileDep};},
  expect:{added:34,updated:0,again:0,againUpd:34,n:34,cost:10117246.22,notqb:['2nd Hand Container DRY','2nd Hand Container WHL'],lenStatus:'inv',lenPo:'2026-21-PO0907-03',lenCredit:'1016-300-014',tankStatus:'fa',tankOptional:true,card:true,fileMon:788.88,rockDep:135190.22} },
];
