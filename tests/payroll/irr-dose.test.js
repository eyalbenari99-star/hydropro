/* v21.70: two meters must agree; water source; Nexi says; Export for Reven. Pool 1 = 238 × 85 cm, target 130 cm. */
module.exports=[
{ name:'🏊 Pool 1, level 109 cm (gap 21 = 425 L): controller EC 1.85 + handheld 1.87 → used 1.86 → matrix row 1.85 × 21 cm = 2,750 cc A and B (2.75 L); handheld 1.95 (Δ 0.10, critical drift) → CALIBRATE, A/B cleared, red instruction; over-tank water (EC 1.0) → factor 0.474 → 1,304 cc; mix 50 % → 2,027 cc; "Nexi says" column shows the line; Export for Reven writes 24 rows (v21.70)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));localStorage.removeItem('hydroPro_irr_pool');localStorage.removeItem('hydroProIrrSettings');},
  run:new Function(`return (async()=>{await sleep(4000);window.showToast=()=>{};
    switchView('irr_nutrients');await sleep(800);_irrDate='2026-10-05';window.irrSetPoolTime('08:00');
    const rec=()=>((loadIrrPool()['2026-10-05']||{})['P01']||{})['08:00']||{};
    irrSavePool('P01','water','109');irrSavePool('P01','EC','1.85');irrSavePool('P01','manualEC','1.87');irrSavePool('P01','pH','6.2');irrSavePool('P01','manualPH','6.2');await sleep(300);
    let r=rec();const a1={gap:r._dose.gap,water:r.waterAdded,ec:r._dose.ec,aCC:r._dose.aCC,A:r.A,B:r.B,cal:r._calibrate||''};
    renderIrrPoolMonitor();await sleep(400);const txt=document.getElementById('view-irr_nutrients').innerText;const says=/Add 425 L pure water · A 2750 cc · B 2750 cc · C 0 cc/.test(txt);
    irrSavePool('P01','manualEC','1.95');await sleep(300);r=rec();const a2={cal:/CALIBRATE EC meters/.test(r._calibrate||''),A:r.A,instr:irrInstruction(IRR_POOLS.find(p=>p.id==='P01'),r).slice(0,1)};
    irrSavePool('P01','manualEC','1.87');irrSavePool('P01','source','overtank');await sleep(300);r=rec();const a3={factor:r._dose.factor,aCC:r._dose.aCC};
    irrSavePool('P01','source','mix');irrSavePool('P01','mixPct','50');await sleep(300);r=rec();const a4={factor:r._dose.factor,aCC:r._dose.aCC};
    let wbRows=null;window.XLSX=window.XLSX||{};const X=window.XLSX;X.utils=X.utils||{};X.utils.book_new=()=>({});X.utils.aoa_to_sheet=a=>a;X.utils.book_append_sheet=(wb,sh)=>{wbRows=sh;};X.writeFile=()=>{};
    irrExportReven();const exp={rows:wbRows?wbRows.length-4:0,p1:wbRows?wbRows[4][0]:'',instr:wbRows?/^Add 425 L mix \\(50% over-tank\\) water · A 2027 cc/.test(wbRows[4][23]):false};
    return {a1,says,a2,a3,a4,exp};})();`),
  expect:{a1:{gap:21,water:425,ec:1.86,aCC:2750,A:2.75,B:2.75,cal:''},says:true,a2:{cal:true,A:'',instr:'⚠'},a3:{factor:0.474,aCC:1304},a4:{factor:0.737,aCC:2027},exp:{rows:24,p1:'Pool 1',instr:true}} }
];
