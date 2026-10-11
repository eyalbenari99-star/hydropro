/* v22.46 (Eyal, 11 Oct 2026): "irrigation prj11 should be each 10cm 500ml only AB" — PRJ11-A and PRJ11-B (110 × 123 cm, daily
   target 100 cm) take 500 ml of A and 500 ml of B per 10 cm of water added, like GH1–GH10 (with or without an EC reading, over-tank
   water × 2, 0.1 L steps); C is unchanged. The other project pools (PRJ12 …) keep the EC matrix. */
const NEW="typeof window.irrAbPer10==='function'&&window.irrAbPer10({id:'P11A',roomId:'PRJ11',greenhouse:'PRJ11'})===0.5";
const H=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');
  const rec=id=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[_irrDate]||{})[id]||{})['08:00']||{};};
  const P=id=>(IRR_POOLS||[]).find(x=>x.id===id);`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
module.exports=[
{ name:'🧪 PRJ11 = 500 ml of A and B per 10 cm (Eyal 11 Oct): PRJ11-A at 80 cm, no EC typed → 20 cm = 271 L, A 1 L, B 1 L (1000 cc), "Nexi says … A 1000 cc · B 1000 cc"; at 79 cm → 21 cm → 1.1 L (0.1 L steps); over-tank at 21 cm → 2.1 L (× 2); PRJ11-B at 90 cm → 0.5 L; the rule reads 0.5 for both pools and for a pool added to room PRJ11, PRJ12-A keeps the EC matrix',
  requires:NEW,
  run:fn(`irrSavePool('P11A','water','80');await sleep(300);const r1=rec('P11A');const says1=irrInstruction(P('P11A'),r1);
    irrSavePool('P11A','water','79');await sleep(300);const r2=rec('P11A');
    irrSavePool('P11A','source','overtank');await sleep(300);const r3=rec('P11A');
    irrSavePool('P11B','water','90');await sleep(300);const rb=rec('P11B');
    return {gap:r1._dose.gap,water:r1._dose.waterL,mode:r1._dose.mode,per10:r1._dose.per10L,A:r1.A,B:r1.B,aCC:r1._dose.aCC,says:/A 1000 cc · B 1000 cc/.test(says1),
      A21:r2.A,overtank:r3.A,mult:r3._dose.srcMult,b90:rb.A,
      rule:[irrAbPer10(P('P11A')),irrAbPer10(P('P11B')),irrAbPer10({id:'P11C',roomId:'PRJ11',greenhouse:'PRJ11'}),irrAbPer10(P('P12A'))]};`),
  expect:{gap:20,water:271,mode:'per10',per10:0.5,A:1,B:1,aCC:1000,says:true,A21:1.1,overtank:2.1,mult:2,b90:0.5,rule:[0.5,0.5,0.5,null]} },

{ name:'🧪 On the PRJ11-A card the boxes and pictures follow: 80 cm → ② A box 1 L with ONE full jug "A 1 L = 1 jug", the proportion picture "Every 10 cm of water (≈ 135 L) takes 0.5 L of A and 0.5 L of B", and Nexi\'s proportion line "every 10 cm (≈ 135 L of water) → 0.5 L A + 0.5 L B"',
  requires:NEW,
  run:fn(`irrSavePool('P11A','water','80');await sleep(300);renderIrrPoolMonitor();await sleep(600);
    const host=document.getElementById('stubIrrNutrientsBody');const c=[...host.querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\'P11A\\'"]'));
    const lab=e=>e?(e.getAttribute('aria-label')||''):'';const pic=td=>td?td.querySelector('.irr-cv'):null;
    const rx=host.querySelector('.irr-rx[data-rxpool="P11A"]');
    return {aBox:(c.children[12].querySelector('input')||{}).value,aPic:lab(pic(c.children[12])),says:lab(pic(c.children[16])),ratio:rx?/every 10 cm \\(≈ 135 L of water\\) → 0.5 L A \\+ 0.5 L B/.test(rx.textContent):false};`),
  expect:{aBox:'1',aPic:'A 1 L = 1 jug',says:'Every 10 cm of water (≈ 135 L) takes 0.5 L of A and 0.5 L of B',ratio:true} }
];
