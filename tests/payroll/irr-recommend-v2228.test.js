/* v22.28 (Eyal 10 Oct, on the 4x-daily pool table: "where is Nexi's recommendation — what to fill and how much each?"): before this
   round's level is typed, the fill and the A/B/C dose are worked out from the pool's LAST reading — shown, never saved. */
const fn=body=>new Function('return (async()=>{'+body+'})();');
module.exports=[
{ name:'💡 Pool 1 (GH1) read 54 cm, EC 1 at 08:00; the 11:00 round is still empty → "📋 From the last reading (… 08:00 · 54 cm · EC 1): Add 121 L pure water · A 2100 cc · B 2100 cc · C 30 cc — enter this round\'s level", Water Added shows ≈121 L, A ≈2.1 L, B ≈2.1 L — and nothing is saved at 11:00 (v22.28)',
  requires:"!!(window.hnxIrrViz&&window.hnxIrrViz.derive&&window.hnxIrrViz.derive.lastKnown)",
  run:fn(`window.__hnxPulledOk=true;window.showToast=()=>{};window.confirm=()=>true;switchView('irr_nutrients');await sleep(900);
    window.irrSetPoolTime('08:00');irrSavePool('P01','water','54');irrSavePool('P01','EC','1');await sleep(2300); /* the gauges' look-back reads the pool store at most every 2 s */
    window.irrSetPoolTime('11:00');renderIrrPoolMonitor();await sleep(400);
    const body=document.getElementById('stubIrrNutrientsBody');const txt=body.innerText;
    const row=[...body.querySelectorAll('tbody tr:not(.irr-nexi-row)')].find(tr=>/Pool 1\\b/.test(tr.innerText))||body.querySelector('tbody tr:not(.irr-nexi-row)');
    const ph=[...row.querySelectorAll('input')].map(i=>i.placeholder);
    const rec11=((loadIrrPool()[_irrDate]||{}).P01||{})['11:00']||{};
    return {says:/📋 From the last reading \\([^)]*08:00 · 54 cm · EC 1\\): Add 121 L pure water · A 2100 cc · B 2100 cc · C 30 cc — enter this round's level to confirm/.test(txt),
      water:ph.includes('≈121 L'),a:ph.includes('≈2.1 L'),saved:[rec11.waterAdded||'',rec11.A||'',rec11.B||'',rec11.water||'']};`),
  expect:{says:true,water:true,a:true,saved:['','','','']} }
];
