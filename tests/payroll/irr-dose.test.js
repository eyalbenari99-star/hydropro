/* v21.70: two meters must agree; water source; Nexi says; Export for Reven. PRJ11-A (no fill rule) = 110 × 123 cm, target 100 cm, keeps the EC matrix. */
module.exports=[
{ name:'🏊 PRJ11-A (matrix pool), level 79 cm (gap 21 = 284 L): controller EC 1.85 + handheld 1.87 → used 1.86 → matrix row 1.85 × 21 cm = 2,750 cc A and B (2.75 L); handheld 1.95 (Δ 0.10, critical drift) → CALIBRATE, A/B cleared, red instruction; C = 21 cm × 5 cc × pH factor 1 (pH 6.2) = 105 cc; over-tank water (EC 1.0) → factor 0.474 → 1,303 cc (exact factor, v22.20); mix 50 % → 2,026 cc; "Nexi says" line under the pool; Export for Reven writes 24 rows (v21.70, v22.20)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));localStorage.removeItem('hydroPro_irr_pool');localStorage.removeItem('hydroProIrrSettings');},
  run:new Function(`return (async()=>{await sleep(4000);window.showToast=()=>{};
    switchView('irr_nutrients');await sleep(800);_irrDate='2026-10-05';window.irrSetPoolTime('08:00');
    const rec=()=>((loadIrrPool()['2026-10-05']||{})['P11A']||{})['08:00']||{};
    irrSavePool('P11A','water','79');irrSavePool('P11A','EC','1.85');irrSavePool('P11A','manualEC','1.87');irrSavePool('P11A','pH','6.2');irrSavePool('P11A','manualPH','6.2');await sleep(300);
    let r=rec();const a1={gap:r._dose.gap,water:r.waterAdded,ec:r._dose.ec,aCC:r._dose.aCC,A:r.A,B:r.B,cal:r._calibrate||''};
    renderIrrPoolMonitor();await sleep(400);const txt=document.getElementById('view-irr_nutrients').innerText;const says=/Add 284 L pure water · A 2750 cc · B 2750 cc · C 105 cc/.test(txt);
    irrSavePool('P11A','manualEC','1.95');await sleep(300);r=rec();const a2={cal:/CALIBRATE EC meters/.test(r._calibrate||''),A:r.A,instr:irrInstruction(IRR_POOLS.find(p=>p.id==='P11A'),r).slice(0,1)};
    irrSavePool('P11A','manualEC','1.87');irrSavePool('P11A','source','overtank');await sleep(300);r=rec();const a3={factor:r._dose.factor,aCC:r._dose.aCC};
    irrSavePool('P11A','source','mix');irrSavePool('P11A','mixPct','50');await sleep(300);r=rec();const a4={factor:r._dose.factor,aCC:r._dose.aCC};
    let wbRows=null;window.XLSX=window.XLSX||{};const X=window.XLSX;X.utils=X.utils||{};X.utils.book_new=()=>({});X.utils.aoa_to_sheet=a=>a;X.utils.book_append_sheet=(wb,sh)=>{wbRows=sh;};X.writeFile=()=>{};
    irrExportReven();const exp={rows:wbRows?wbRows.length-4:0,p1:wbRows?wbRows[4][0]:'',instr:wbRows?/^Add 284 L mix \\(50% over-tank\\) water · A 2026 cc · B 2026 cc · C 105 cc/.test(wbRows[14][23]):false};
    return {a1,says,a2,a3,a4,exp};})();`),
  expect:{a1:{gap:21,water:284,ec:1.86,aCC:2750,A:2.75,B:2.75,cal:''},says:true,a2:{cal:true,A:'',instr:'⚠'},a3:{factor:0.474,aCC:1303},a4:{factor:0.737,aCC:2026},exp:{rows:24,p1:'Pool 1',instr:true}} }
,
{ name:'🌱 Fill rules (v21.71) only for pools switched to 🌱 Fill rule (v22.20; a pool without it uses the v22.32 rule, 1 L per 10 cm: Pool 2 level 40, EC 1.7 → "Add 405 L pure water · A 2000 cc"): GH1 at 08:00 level 40 → "Morning fill to 60 cm": 405 L, A 2 L, B 2 L; at 11:00 level 45 → no fill; at 11:00 level 25 → under 30 → fill to 60: gap 35 → A 4 L (whole liters); GH7 level 60 → no fill (≥ 50); level 40 → fill to 100: 1,287 L, A 6 L (1 L per 10 cm since v22.32, was per 12 cm); GH9 level 30 → fill to 50: A 4 L (2 L per 10 cm); GH10 level 40 (fill to its daily 60 cm, gap 20) EC 1.6 → A 2 L + "add 1 L more … until ≈ 1.7"; water 30 °C flagged hot; EC ok band 1.7–1.9, pH 5.8–6.5 (Eyal 9 Oct)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));localStorage.removeItem('hydroPro_irr_pool');localStorage.removeItem('hydroProIrrSettings');},
  run:new Function(`return (async()=>{await sleep(4000);window.showToast=()=>{};switchView('irr_nutrients');await sleep(800);_irrDate='2026-10-05';window.confirm=()=>true;
    {const ps=loadIrrPools();ps.forEach(p=>{if(['P01','P07','P09','P10'].includes(p.id))p.dosingMode='rule';});saveIrrPools(ps);IRR_POOLS=loadIrrPools();}
    const rec=(id)=>((loadIrrPool()['2026-10-05']||{})[id]||{})[_irrCurrentPoolTime]||{};const P=id=>IRR_POOLS.find(p=>p.id===id);const I=id=>irrInstruction(P(id),rec(id));
    window.irrSetPoolTime('08:00');irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(250);const g1={water:rec('P01').waterAdded,A:rec('P01').A,B:rec('P01').B,instr:I('P01')};
    window.irrSetPoolTime('11:00');irrSavePool('P01','water','45');irrSavePool('P01','EC','1.7');await sleep(250);const g2={A:rec('P01').A||'',instr:I('P01')};
    irrSavePool('P01','water','25');await sleep(250);const g3={A:rec('P01').A,gap:rec('P01')._dose.gap};
    window.irrSetPoolTime('08:00');irrSavePool('P07','water','60');irrSavePool('P07','EC','1.7');await sleep(250);const g4={A:rec('P07').A||'',instr:I('P07')};
    irrSavePool('P07','water','40');await sleep(250);const g5={water:rec('P07').waterAdded,A:rec('P07').A};
    irrSavePool('P09','water','30');irrSavePool('P09','EC','1.7');await sleep(250);const g6={A:rec('P09').A,gap:rec('P09')._dose.gap};
    irrSavePool('P02','water','40');irrSavePool('P02','EC','1.7');await sleep(250);const m2=/^Add 405 L pure water · A 2000 cc/.test(I('P02'));
    irrSavePool('P10','water','40');irrSavePool('P10','EC','1.6');irrSavePool('P10','waterTemp','30');await sleep(250);const g7={A:rec('P10').A,instr:I('P10')};
    return {g1:{water:g1.water,A:g1.A,B:g1.B,morning:/^Morning fill to 60 cm: add 405 L pure water · A 2 L · B 2 L/.test(g1.instr)},g2:{A:g2.A,noFill:/no fill this round/.test(g2.instr)},g3,g4:{A:g4.A,noFill:/≥ 50 cm — no fill/.test(g4.instr)},g5,g6,g7:{A:g7.A,topUp:/add 1 L more A and B after mixing, re-check, until ≈ 1.7/.test(g7.instr),hot:/water hot \\(30 °C\\)/.test(g7.instr)},m2,ec:IRR_RANGES.EC.min+'-'+IRR_RANGES.EC.max,ph:IRR_RANGES.pH.min+'-'+IRR_RANGES.pH.max};})();`),
  expect:{g1:{water:405,A:2,B:2,morning:true},g2:{A:'',noFill:true},g3:{A:4,gap:35},g4:{A:'',noFill:true},g5:{water:1287,A:6},g6:{A:4,gap:20},g7:{A:2,topUp:true,hot:true},m2:true,ec:'1.7-1.9',ph:'5.8-6.5'} }
];
