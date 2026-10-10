/* v22.32 (Eyal, 10 Oct 2026): "Irrigation matrix for pure water should be each 10cm 1 liter AB GH1,2,3&4,5,6,7&8,10 · GH9 should be
   each 10cm 2 AB pure water · If over tank (no way unless saying other wise) should be double AB" — and "this recommendation should be
   with graphics images colored motion as well showing exactly how much to fill so we can follow up the proportions".
   Pools (IRR_POOLS_DEFAULT): P01 238×85 cm (≈202 L per 10 cm), daily 60; P02 same; P03 197×115, daily 60; P07 150×143, daily 100;
   P09 236×142, daily 50. The project pools (P11A …) were not named and keep the EC matrix (irr-dose.test.js case 1). */
const NEW="typeof window.hnxIrrRecipe==='function'&&typeof window.irrAbPer10==='function'";
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const rec=id=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[_irrDate]||{})[id]||{})['08:00']||{};};
  const P=id=>IRR_POOLS.find(p=>p.id===id);
  const D=id=>{const r=rec(id),d=r._dose||{};return {gap:d.gap,water:d.waterL,a:d.aCC,b:d.bCC,A:r.A,B:r.B,W:r.waterAdded,per10:d.per10L,x:d.srcMult,v:d.v};};
  const RX=id=>document.querySelector('#stubIrrNutrientsBody .irr-rx[data-rxpool="'+id+'"]');`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
module.exports=[
{ name:'🧪 GH1 Pool 1 at 29.9 cm, pure water (Eyal’s screenshot): gap 30 cm → 607 L, A 3 L (3000 cc) and B 3 L — 1 L per 10 cm (was 6.98 L from the EC matrix); "Nexi says" Add 607 L pure water · A 3000 cc · B 3000 cc; the drawing shows 3 A jugs, 3 B jugs, "+607 L", 29.9 → 60 cm and "every 10 cm (≈ 202 L of water) → 1 L A + 1 L B"',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','29.9');irrSavePool('P01','EC','1.7');await sleep(300);renderIrrPoolMonitor();await sleep(400);
    const rx=RX('P01');const steps=rx?[...rx.querySelectorAll('.irr-rx-step')]:[];
    return {d:D('P01'),instr:irrInstruction(P('P01'),rec('P01')),rx:!!rx,jugsA:steps[1]?steps[1].querySelectorAll('svg').length:0,jugsB:steps[2]?steps[2].querySelectorAll('svg').length:0,
      water:steps[0]?steps[0].querySelector('b').textContent:'',levels:steps[0]?steps[0].querySelector('small').textContent:'',
      ratio:rx?(rx.querySelector('.irr-rx-ratio')||{}).textContent:''};`),
  expect:{d:{gap:30,water:607,a:3000,b:3000,A:3,B:3,W:607,per10:1,x:1,v:'22.32'},instr:'Add 607 L pure water · A 3000 cc · B 3000 cc · C 150 cc',rx:true,jugsA:3,jugsB:3,
    water:'+607 L',levels:'29.9 → 60 cm · pure',ratio:'Proportion: every 10 cm (≈ 202 L of water) → 1 L A + 1 L B · 30 cm here = 3 L each'} },

{ name:'🧪 Over-tank doubles A and B: Pool 2 at 29 cm, Source over-tank → gap 31 → 3.1 L × 2 = 6.2 L each (6200 cc); mix 50% → × 1.5 = 4.7 L (4650 cc rounded to 0.1 L); back to pure → 3.1 L; the drawing says "over-tank water ×2"',
  requires:NEW,
  run:fn(`irrSavePool('P02','water','29');irrSavePool('P02','EC','1.6');irrSavePool('P02','source','overtank');await sleep(300);const ot=D('P02');
    renderIrrPoolMonitor();await sleep(300);const ratio=(RX('P02')&&RX('P02').querySelector('.irr-rx-ratio')||{}).textContent||'';
    irrSavePool('P02','source','mix');irrSavePool('P02','mixPct','50');await sleep(300);const mix=D('P02');
    irrSavePool('P02','source','pure');await sleep(300);const pure=D('P02');
    return {ot:{a:ot.a,A:ot.A,x:ot.x},mix:{a:mix.a,A:mix.A,x:mix.x},pure:{a:pure.a,A:pure.A,x:pure.x},ratio:/over-tank water ×2/.test(ratio),instr:/^Add 627 L pure water · A 3100 cc · B 3100 cc/.test(irrInstruction(P('P02'),rec('P02')))};`),
  expect:{ot:{a:6200,A:6.2,x:2},mix:{a:4700,A:4.7,x:1.5},pure:{a:3100,A:3.1,x:1},ratio:true,instr:true} },

{ name:'🧪 GH9 is 2 L per 10 cm: Pool 9 at 31 cm (daily 50) → gap 19 → 3.8 L A and 3.8 L B (was ×1.5 of the matrix); GH7 Pool 7 at 85 cm (daily 100) → gap 15 → 1.5 L each (was 0.67 × matrix); Pool & Drum Setup "L per 10 cm" 1.5 on Pool 5 at 40 cm → gap 20 → 3 L each',
  requires:NEW,
  run:fn(`irrSavePool('P09','water','31');irrSavePool('P09','EC','1.75');irrSavePool('P07','water','85');irrSavePool('P07','EC','1.75');await sleep(300);
    const g9=D('P09'),g7=D('P07');
    {const ps=loadIrrPools();ps.find(p=>p.id==='P05').abPer10='1.5';saveIrrPools(ps);IRR_POOLS=loadIrrPools();}
    irrSavePool('P05','water','40');irrSavePool('P05','EC','1.7');await sleep(300);const g5=D('P05');
    return {g9:{gap:g9.gap,a:g9.a,A:g9.A,per10:g9.per10},g7:{gap:g7.gap,a:g7.a,A:g7.A},g5:{gap:g5.gap,a:g5.a,A:g5.A,per10:g5.per10}};`),
  expect:{g9:{gap:19,a:3800,A:3.8,per10:2},g7:{gap:15,a:1500,A:1.5},g5:{gap:20,a:3000,A:3,per10:1.5}} },

{ name:'🧪 Guards stay: Pool 1 EC 2.36 → water only (A/B 0, "EC 2.36 too high"), the drawing crosses out A/B; two meters 1.70 / 1.80 apart → CALIBRATE, no dose and no drawing; Pool 1 level 60 (= daily target) → nothing to add, no drawing',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','2.36');await sleep(300);renderIrrPoolMonitor();await sleep(300);
    const hi={a:rec('P01')._dose.aCC,instr:/^EC 2.36 too high — add 405 L water only, no A\\/B/.test(irrInstruction(P('P01'),rec('P01'))),x:!!(RX('P01')&&RX('P01').querySelector('.irr-rx-x'))};
    irrSavePool('P01','EC','1.70');irrSavePool('P01','manualEC','1.80');await sleep(300);renderIrrPoolMonitor();await sleep(300);
    const cal={a:rec('P01')._dose.aCC,rx:!!RX('P01')};
    irrSavePool('P01','manualEC','1.70');irrSavePool('P01','water','60');await sleep(300);renderIrrPoolMonitor();await sleep(300);
    return {hi,cal,full:{gap:rec('P01')._dose.gap,rx:!!RX('P01')}};`),
  expect:{hi:{a:0,instr:true,x:true},cal:{a:0,rx:false},full:{gap:0,rx:false}} },

{ name:'🧪 Before this round is entered the drawing is the dashed preview from the last reading: Pool 1 read 40 cm at 08:00, the 11:00 round empty → 11:00 shows "from the last reading" with A 2 L (gap 20) and saves nothing at 11:00',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(2300); /* the gauges' look-back reads the pool store at most every 2 s */
    window.irrSetPoolTime('11:00');renderIrrPoolMonitor();await sleep(400);
    const rx=RX('P01');const r11=((loadIrrPool()[_irrDate]||{}).P01||{})['11:00']||{};
    return {prev:!!(rx&&rx.classList.contains('prev')),head:rx?/from the last reading/.test(rx.querySelector('.irr-rx-h').textContent):false,a:rx?[...rx.querySelectorAll('.irr-rx-step b')].map(b=>b.textContent)[1]:'',saved:[r11.A||'',r11.water||'']};`),
  expect:{prev:true,head:true,a:'A 2 L',saved:['','']} },

{ name:'🧪 A level alone sets A/B for GH1–GH10 (no EC reading needed): Pool 4 at 45 cm, no EC → gap 15 → A 1.5 L, B 1.5 L, "Add … · A 1500 cc"; a pool added later in GH9 (id P_GH9_x) → 2 L per 10 cm: at 40 cm (daily 50) → A 2 L',
  requires:NEW,
  run:fn(`irrSavePool('P04','water','45');await sleep(300);const g4=D('P04');
    {const ps=loadIrrPools();const src=ps.find(p=>p.id==='P09');const np=Object.assign(JSON.parse(JSON.stringify(src)),{id:'P_GH9_x',label:'Pool 9b'});ps.push(np);saveIrrPools(ps);IRR_POOLS=loadIrrPools();}
    irrSavePool('P_GH9_x','water','40');await sleep(300);const n9=D('P_GH9_x');
    return {g4:{gap:g4.gap,a:g4.a,A:g4.A,instr:/^Add \\d+ L pure water · A 1500 cc · B 1500 cc/.test(irrInstruction(P('P04'),rec('P04')))},n9:{gap:n9.gap,a:n9.a,per10:n9.per10}};`),
  expect:{g4:{gap:15,a:1500,A:1.5,instr:true},n9:{gap:10,a:2000,per10:2}} },

{ name:'🧪 Pool & Drum Setup "L per 10 cm" applies at once: Pool 1 at 40 cm (A 2 L) → set 1.5 → A 3 L and "Nexi says … A 3000 cc" WITHOUT typing a new reading; set 0 → A 0 (no A/B); cleared → back to 1 L per 10 cm (A 2 L)',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(300);const a0=D('P01').A;
    updatePoolField('P01','abPer10','1.5');await sleep(300);const a1=D('P01');const instr=/· A 3000 cc · B 3000 cc/.test(irrInstruction(P('P01'),rec('P01')));
    updatePoolField('P01','abPer10','0');await sleep(300);const a2=D('P01');
    updatePoolField('P01','abPer10','');await sleep(300);const a3=D('P01');
    return {a0,a1:{A:a1.A,a:a1.a},instr,a2:{a:a2.a},a3:{A:a3.A,a:a3.a}};`),
  expect:{a0:2,a1:{A:3,a:3000},instr:true,a2:{a:0},a3:{A:2,a:2000}} },

{ name:'🌱 A pool on the Fill rule: GH1 rule 08:00 at 40 cm (morning fill to 60, gap 20) with a 50% mix → A 3 L (2 L × 1.5) in the box AND "A 3 L" in Nexi says; over-tank → A 4 L; EC 2.40 → "EC 2.4 too high — add 405 L water only, no A/B", A/B 0',
  requires:NEW,
  run:fn(`{const ps=loadIrrPools();ps.find(p=>p.id==='P01').dosingMode='rule';saveIrrPools(ps);IRR_POOLS=loadIrrPools();}
    irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');irrSavePool('P01','source','mix');irrSavePool('P01','mixPct','50');await sleep(300);
    const mix={A:rec('P01').A,a:rec('P01')._dose.aCC,says:/· A 3 L · B 3 L/.test(irrInstruction(P('P01'),rec('P01')))};
    irrSavePool('P01','source','overtank');await sleep(300);const ot={A:rec('P01').A,a:rec('P01')._dose.aCC};
    irrSavePool('P01','EC','2.40');await sleep(300);const hi={a:rec('P01')._dose.aCC,instr:/EC 2\\.4 too high — add 405 L water only, no A\\/B/.test(irrInstruction(P('P01'),rec('P01')))};
    return {mix,ot,hi};`),
  expect:{mix:{A:3,a:3000,says:true},ot:{A:4,a:4000},hi:{a:0,instr:true}} },

{ name:'🗓 A past day keeps the recommendation Nexi gave then: 9 Oct Pool 1 08:00 stored by the v22.20 engine (54 cm, A 2.1 L auto, _dose 22.20) → opening 9 Oct leaves A 2.1 L and "Nexi says … A 2100 cc"; today the same reading is worked out with the v22.32 rule (A 0.6 L)',
  requires:NEW,
  seed:new Function(`const RD=Date;const off=RD.parse('2026-10-10T02:00:00Z')-RD.now();
    function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
    FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;
    const old={v:'22.20',gap:6,waterL:121,ec:1,ph:'',row:'1.50',factor:1,aCC:2100,bCC:2100,cCC:30,ecHigh:false,calibrate:'',note:'',target:60,mode:'matrix'};
    const r=()=>({water:'54',EC:'1',waterAdded:121,A:2.1,B:2.1,C:0.03,_autoFilled:{waterAdded:true,A:true,B:true,C:true},_dose:old,updatedAt:1});
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify({'2026-10-09':{P01:{'08:00':r()}},'2026-10-10':{P01:{'08:00':r()}}}));`),
  tz:'Asia/Manila',
  run:fn(`_irrDate='2026-10-09';renderIrrPoolMonitor();await sleep(500);try{delete window._perfCache._irrPool;}catch(e){}
    const y=((loadIrrPool()['2026-10-09']||{}).P01||{})['08:00']||{};const ysays=/Nexi says: Add 121 L pure water · A 2100 cc · B 2100 cc/.test(document.getElementById('stubIrrNutrientsBody').innerText);
    _irrDate=hnxLocalToday();renderIrrPoolMonitor();await sleep(500);try{delete window._perfCache._irrPool;}catch(e){}
    const t=((loadIrrPool()['2026-10-10']||{}).P01||{})['08:00']||{};
    return {y:{A:y.A,v:(y._dose||{}).v,says:ysays},t:{A:t.A,v:(t._dose||{}).v}};`),
  expect:{y:{A:2.1,v:'22.20',says:true},t:{A:0.6,v:'22.32'}} },

{ name:'🎞 The drawing moves with the 🎞 Motion setting: "always" → the jugs fill (animation irrRxFill, infinite); "off" → still (animation none); a computer set to reduce motion → still',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(300);renderIrrPoolMonitor();await sleep(300);
    const f=()=>{const el=RX('P01')&&RX('P01').querySelector('.fill');const cs=el?getComputedStyle(el):null;return cs?cs.animationName+'/'+cs.animationIterationCount:'none';};
    hnxIrrViz.setMotion('always');await sleep(100);const always=f();hnxIrrViz.setMotion('off');await sleep(100);const off=f();hnxIrrViz.setMotion('always');
    return {always,off};`),
  expect:{always:'irrRxFill/infinite',off:'none/1'} },
{ name:'🎞 Reduce motion (prefers-reduced-motion) keeps the drawing still even with Motion "always"',
  requires:NEW, reducedMotion:true,
  drive:async pg=>{await pg.emulateMedia({reducedMotion:'reduce'});
    return pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};
      switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(300);renderIrrPoolMonitor();await sleep(300);
      hnxIrrViz.setMotion('always');await sleep(100);const el=document.querySelector('.irr-rx[data-rxpool="P01"] .fill');return el?getComputedStyle(el).animationName:'no drawing';});},
  expect:{'drive':'none'} }
];
