/* v22.52 (Eyal, 11 Oct 2026):
   - screenshot of v22.48's hand meters: "do it like up with more colors 3d and all but size portion looks good" — the scale beside the
     pen meter is a 3-D glass tube in the colours of the EC / pH meter above (EC blue → purple, pH red → yellow → green), filled to the
     hand reading, silver caps, a red / green band strip; same size;
   - screenshot of ① water at 47 cm, max 60: "the 13 cm to add … on top of it with maybe darker blue … move from level 47 to 60 recurring
     until they will do or the water level will show otherwise" — the water already there stands still (light blue, a small wave), the
     water still to add is a darker band on top that rises from the level to the max over and over while the pool is below its max. */
const NEW="typeof window.hnxIrrCellViz==='function'&&String(window.hnxIrrCellViz('water',{level:47,target:60})).indexOf('cv-add')>=0";
const H=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  const host=()=>document.getElementById('stubIrrNutrientsBody');
  const card=id=>[...host().querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));
  const put=(id,o)=>Object.keys(o).forEach(k=>irrSavePool(id,k,o[k]));
  const pic=el=>el?el.querySelector('.irr-cv'):null;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
module.exports=[
{ name:'🌈 Hand meters in colour (Eyal 11 Oct): Pool 2 hand EC 1.60 / pH 6.28 → the EC tube is filled with the EC colours (url #cvhec) up to y 28.8, the pH tube with the pH colours (url #cvhph) up to y 11.2, both gradients run by position (userSpaceOnUse, 41 → 3), silver caps, the OK band strip still at 26.6–28.1 for EC 1.7–1.9, a pool not read has the empty tube (no liquid)',
  requires:NEW,
  run:fn(`put('P02',{water:'32',EC:'1.62',manualEC:'1.60',pH:'6.3',manualPH:'6.28'});await sleep(400);renderIrrPoolMonitor();await sleep(700);
    const c=card('P02'),E=pic(c.children[3]),P=pic(c.children[5]),n5=pic(card('P05').children[3]);
    const liq=e=>{const r=e&&e.querySelector('rect.cv-liq');return r?[r.getAttribute('fill'),+r.getAttribute('y')]:null;};
    const g=id=>{const x=document.getElementById(id);return x?[x.getAttribute('gradientUnits'),x.getAttribute('y1'),x.getAttribute('y2'),x.querySelectorAll('stop').length]:null;};
    const caps=e=>e?[...e.querySelectorAll('rect')].filter(r=>r.getAttribute('fill')==='url(#cvs)'&&r.getAttribute('width')==='7.2').length:0;
    const band=e=>{const b=e&&e.querySelector('rect.cv-okband');return b?[+b.getAttribute('y'),+(+b.getAttribute('y')+ +b.getAttribute('height')).toFixed(1)]:null;};
    return {ec:liq(E),ph:liq(P),gEc:g('cvhec'),gPh:g('cvhph'),caps:[caps(E),caps(P)],band:band(E),notRead:liq(n5)};`),
  expect:{ec:['url(#cvhec)',28.8],ph:['url(#cvhph)',11.2],gEc:['userSpaceOnUse','41','3',3],gPh:['userSpaceOnUse','41','3',5],caps:[2,2],band:[26.6,28.1],notRead:null} },

{ name:'🌊 ① Water at 47 cm, max 60 (Eyal 11 Oct): the water already there is still (no rising animation on it) with a wave line at y 23.8, the 13 cm to add is a darker band (url #cvd) from y 16.8 to 23.8 on top that rises again and again (cvFill, infinite) — also under ⚡ Lite, stopped with 🎞 Motion off — the level "47" is written at its line, "+13 cm" sits just under the thin band, "max 60" stays; at 60 cm no band, "at max ✓"',
  requires:NEW,
  run:fn(`put('P02',{water:'47'});put('P03',{water:'60'});await sleep(400);renderIrrPoolMonitor();await sleep(700);
    const W=pic(card('P02').children[11]),W3=pic(card('P03').children[11]);
    const add=W.querySelector('g.cv-add'),bp=add?add.querySelector('path').getAttribute('d'):'';
    const still=W.querySelector('g.cv-still'),wave=W.querySelector('path.cv-wave');
    const txt=(e,s)=>e?[...e.querySelectorAll(s)].map(t=>t.textContent):[];
    W.scrollIntoView({block:'center'});await sleep(400); /* off-screen pictures are paused (iv-off) */
    const anim=()=>getComputedStyle(add).animationName+'/'+getComputedStyle(add).animationIterationCount;
    const H=document.documentElement;H.classList.add('hnx-lite');await sleep(50);const lite=anim();H.classList.remove('hnx-lite');
    H.classList.add('hnx-iv-m-off');await sleep(50);const off=getComputedStyle(add).animationName;H.classList.remove('hnx-iv-m-off');
    return {band:bp,fill:add?add.querySelector('path').getAttribute('fill'):'',still:!!still&&getComputedStyle(still).animationName==='none',
      wave:wave?wave.getAttribute('d').slice(0,9):'',lvl:txt(W,'text.cv-lvl'),gap:txt(W,'text.cv-gap'),gapY:+(W.querySelector('text.cv-gap')||{getAttribute:()=>0}).getAttribute('y'),
      lite,off,at60:[!!W3.querySelector('g.cv-add'),txt(W3,'text.cv-gap').join('')]};`),
  expect:{band:'M10 16.8V23.8h30V16.8z',fill:'url(#cvd)',still:true,wave:'M11 23.8q',lvl:['47'],gap:['+13 cm'],gapY:32.3,lite:'cvFill/infinite',off:'none',at60:[false,'at max ✓']} }
];
