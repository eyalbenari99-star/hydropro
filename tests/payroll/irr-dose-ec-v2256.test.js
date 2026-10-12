/* v22.56 (Eyal, 12 Oct 2026): "In irrigation 3x day Nexi add AB each 10cm which ok but its just if 1.7 EC if les any 0.1 its 1 more AB
   (gh9 1.5 gh7&8 0.75 liter each 0.1 if less then 1.7 if above 1.8 then same but minus for 10cm water adding each pool) to add to matrix".
   The litres of A (and of B) per 10 cm follow the EC: 1.70–1.80 → as set (1 L, GH9 2 L); under 1.70 → + the step for every 0.1 under;
   over 1.80 → − the step for every 0.1 over, never below 0 (then water only). Step GH1–GH6, GH10 1 L · GH7 & GH8 0.75 L · GH9 1.5 L ·
   PRJ11 none until set. Proportional between the 0.1s (to 0.01 of EC). Pools (IRR_POOLS_DEFAULT): P01 238×85 (≈202 L per 10 cm), daily 60;
   P02 same; P04 197×115, daily 60; P05 198×120, daily 60; P07/P08 150×143, daily 100; P09 236×142, daily 50; PRJ11-A 110×123, daily 100. */
const NEW="typeof window.irrAbRate==='function'&&typeof window._renderAbEcPanel==='function'";
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const rec=id=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[_irrDate]||{})[id]||{})['08:00']||{};};
  const P=id=>IRR_POOLS.find(p=>p.id===id);
  const D=id=>{const r=rec(id),d=r._dose||{};return {gap:d.gap,a:d.aCC,b:d.bCC,A:r.A,B:r.B,per10:d.per10L,v:d.v};};
  const SAYS=id=>irrInstruction(P(id),rec(id));
  const RX=id=>document.querySelector('#stubIrrNutrientsBody .irr-rx[data-rxpool="'+id+'"]');
  const setEc=async(id,ec)=>{irrSavePool(id,'EC',ec);await sleep(250);};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
module.exports=[
{ name:'🧪 EC under 1.70 adds 1 L per 10 cm for every 0.1: GH1 Pool 1 at 30 cm, EC 1.50 → 1 + 2 = 3 L per 10 cm → A 9 L and B 9 L (9000 cc); Nexi says "Add 607 L pure water · A 9000 cc · B 9000 cc · C 150 cc · EC under 1.70 → 3 L per 10 cm (1 + 2)"; the drawing has 9 A jugs and "every 10 cm (≈ 202 L of water) → 3 L A + 3 L B · EC 1.5: 1 + 2 L · 30 cm here = 9 L each"; the A box says "30 cm ÷ 10 × 3 L (1 L + 2 L for EC 1.5)"',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');await setEc('P01','1.50');renderIrrPoolMonitor();await sleep(400);
    const rx=RX('P01');const steps=rx?[...rx.querySelectorAll('.irr-rx-step')]:[];
    const inp=document.querySelector('#stubIrrNutrientsBody input[onchange*="irrSavePool(\\'P01\\',\\'A\\'"]');
    return {d:D('P01'),says:SAYS('P01'),jugsA:steps[1]?steps[1].querySelectorAll('svg').length:0,ratio:rx?(rx.querySelector('.irr-rx-ratio')||{}).textContent:'',
      title:inp?/30 cm ÷ 10 × 3 L \\(1 L \\+ 2 L for EC 1\\.5\\) \\(pure water\\) = 9000 cc per drum/.test(inp.title):'no A box'};`),
  expect:{d:{gap:30,a:9000,b:9000,A:9,B:9,per10:3,v:'22.56'},says:'Add 607 L pure water · A 9000 cc · B 9000 cc · C 150 cc · EC under 1.70 → 3 L per 10 cm (1 + 2)',jugsA:9,
    ratio:'Proportion: every 10 cm (≈ 202 L of water) → 3 L A + 3 L B · EC 1.5: 1 + 2 L · 30 cm here = 9 L each',title:true} },

{ name:'🧪 Between the 0.1s it is proportional (to 0.01 of EC): Pool 1 at 30 cm, EC 1.66 → 0.4 of a step → 1.4 L per 10 cm → A 4.2 L (4200 cc); two meters 1.65 / 1.68 → used 1.67 → 1.3 L per 10 cm → A 3.9 L (3900 cc); EC 1.695 → 1.70 → 1 L per 10 cm → A 3 L',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');await setEc('P01','1.66');const one=D('P01');
    irrSavePool('P01','EC','1.65');irrSavePool('P01','manualEC','1.68');await sleep(250);const two=D('P01');
    irrSavePool('P01','manualEC','');await setEc('P01','1.695');const edge=D('P01');
    return {one:{a:one.a,A:one.A,per10:one.per10},two:{a:two.a,A:two.A,per10:two.per10},edge:{a:edge.a,per10:edge.per10}};`),
  expect:{one:{a:4200,A:4.2,per10:1.4},two:{a:3900,A:3.9,per10:1.3},edge:{a:3000,per10:1}} },

{ name:'🧪 Inside 1.70–1.80 nothing changes: Pool 1 at 30 cm with EC 1.70, 1.75 and 1.80 → A 3 L (3000 cc) each time, 1 L per 10 cm, and "Nexi says" has no EC part',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');const out=[];
    for(const e of ['1.70','1.75','1.80']){await setEc('P01',e);out.push(D('P01').a+'/'+D('P01').per10+'/'+(/EC (under|over)/.test(SAYS('P01'))?'ec':'-'));}
    return {out};`),
  expect:{out:['3000/1/-','3000/1/-','3000/1/-']} },

{ name:'🧪 EC over 1.80 takes off the same: Pool 1 at 30 cm, EC 1.85 → 1 − 0.5 = 0.5 L per 10 cm → A 1.5 L (1500 cc), "EC over 1.80 → 0.5 L per 10 cm (1 − 0.5)"; EC 1.90 → 1 − 1 = 0 → "EC 1.9 too high — add 607 L water only, no A/B (over 1.80: 1 L − 1 L per 10 cm = 0); re-check · C 150 cc", A and B boxes emptied, the drawing crosses A/B out; EC 2.10 → still water only',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');await setEc('P01','1.85');const a=D('P01');const saysA=SAYS('P01');
    await setEc('P01','1.90');renderIrrPoolMonitor();await sleep(300);const b=D('P01');const saysB=SAYS('P01');const x=!!(RX('P01')&&RX('P01').querySelector('.irr-rx-x'));
    await setEc('P01','2.10');const c=D('P01');
    return {a:{a:a.a,A:a.A,per10:a.per10},saysA:/· EC over 1\\.80 → 0\\.5 L per 10 cm \\(1 − 0\\.5\\)$/.test(saysA),b:{a:b.a,b:b.b,A:b.A,B:b.B},saysB,x,c:{a:c.a}};`),
  expect:{a:{a:1500,A:1.5,per10:0.5},saysA:true,b:{a:0,b:0,A:'',B:''},saysB:'EC 1.9 too high — add 607 L water only, no A/B (over 1.80: 1 L − 1 L per 10 cm = 0); re-check · C 150 cc',x:true,c:{a:0}} },

{ name:'🧪 GH9 steps 1.5 L: Pool 9 at 30 cm (daily 50 → 20 cm), EC 1.50 → 2 + 3 = 5 L per 10 cm → A 10 L (10000 cc); EC 1.90 → 2 − 1.5 = 0.5 L per 10 cm → A 1 L; EC 2.00 → 2 − 3 → 0 → water only, A 0',
  requires:NEW,
  run:fn(`irrSavePool('P09','water','30');await setEc('P09','1.50');const lo=D('P09');await setEc('P09','1.90');const hi=D('P09');await setEc('P09','2.00');const z=D('P09');
    return {lo:{gap:lo.gap,a:lo.a,A:lo.A,per10:lo.per10},hi:{a:hi.a,A:hi.A,per10:hi.per10},z:{a:z.a,water:/^EC 2 too high — add 670 L water only, no A\\/B \\(over 1\\.80: 2 L − 3 L per 10 cm = 0\\)/.test(SAYS('P09'))}};`),
  expect:{lo:{gap:20,a:10000,A:10,per10:5},hi:{a:1000,A:1,per10:0.5},z:{a:0,water:true}} },

{ name:'🧪 GH7 & GH8 step 0.75 L: Pool 7 at 80 cm (daily 100 → 20 cm), EC 1.50 → 1 + 1.5 = 2.5 L per 10 cm → A 5 L; EC 1.90 → 1 − 0.75 = 0.25 L per 10 cm → A 0.5 L; Pool 8 at 90 cm (10 cm), EC 1.60 → 1.75 L per 10 cm → A 1.8 L (an exact half rounds up)',
  requires:NEW,
  run:fn(`irrSavePool('P07','water','80');await setEc('P07','1.50');const lo=D('P07');await setEc('P07','1.90');const hi=D('P07');
    irrSavePool('P08','water','90');await setEc('P08','1.60');const g8=D('P08');
    return {lo:{gap:lo.gap,a:lo.a,A:lo.A,per10:lo.per10},hi:{a:hi.a,A:hi.A,per10:hi.per10},g8:{gap:g8.gap,a:g8.a,A:g8.A,per10:g8.per10}};`),
  expect:{lo:{gap:20,a:5000,A:5,per10:2.5},hi:{a:500,A:0.5,per10:0.25},g8:{gap:10,a:1800,A:1.8,per10:1.75}} },

{ name:'🧪 Over-tank still doubles after the EC step: Pool 2 at 29 cm (31 cm), EC 1.60 → 2 L per 10 cm; over-tank → × 2 → A 12.4 L (12400 cc); a 50% mix → × 1.5 → A 9.3 L; pure → A 6.2 L',
  requires:NEW,
  run:fn(`irrSavePool('P02','water','29');irrSavePool('P02','source','overtank');await setEc('P02','1.60');const ot=D('P02');
    irrSavePool('P02','source','mix');irrSavePool('P02','mixPct','50');await sleep(250);const mix=D('P02');
    irrSavePool('P02','source','pure');await sleep(250);const pure=D('P02');
    return {ot:{a:ot.a,A:ot.A,per10:ot.per10},mix:{a:mix.a,A:mix.A},pure:{a:pure.a,A:pure.A}};`),
  expect:{ot:{a:12400,A:12.4,per10:2},mix:{a:9300,A:9.3},pure:{a:6200,A:6.2}} },

{ name:'🧪 No EC reading → the litres per 10 cm as before, and Nexi asks for it: Pool 4 at 45 cm (15 cm) → A 1.5 L, "· no EC reading — 1 L per 10 cm (enter the EC to adjust it)"; EC 1.50 typed → 3 L per 10 cm → A 4.5 L',
  requires:NEW,
  run:fn(`irrSavePool('P04','water','45');await sleep(250);const n=D('P04');const says=SAYS('P04');await setEc('P04','1.50');const e=D('P04');
    return {n:{gap:n.gap,a:n.a,A:n.A},says:/^Add \\d+ L pure water · A 1500 cc · B 1500 cc · C 75 cc · no EC reading — 1 L per 10 cm \\(enter the EC to adjust it\\)$/.test(says),e:{a:e.a,A:e.A}};`),
  expect:{n:{gap:15,a:1500,A:1.5},says:true,e:{a:4500,A:4.5}} },

{ name:'🧪 An EC under 1.00 is counted as 1.00: Pool 5 at 50 cm (10 cm), EC 0.80 → 7 steps → 1 + 7 = 8 L per 10 cm → A 8 L, and Nexi says "EC 0.8 looks wrong — re-measure (counted as 1.00) · EC under 1.70 → 8 L per 10 cm (1 + 7)"',
  requires:NEW,
  run:fn(`irrSavePool('P05','water','50');await setEc('P05','0.80');const d=D('P05');
    return {a:d.a,A:d.A,per10:d.per10,says:/ · EC 0\\.8 looks wrong — re-measure \\(counted as 1\\.00\\) · EC under 1\\.70 → 8 L per 10 cm \\(1 \\+ 7\\)$/.test(SAYS('P05'))};`),
  expect:{a:8000,A:8,per10:8,says:true} },

{ name:'🧪 PRJ11 has no EC step until one is set: PRJ11-A at 80 cm (20 cm), EC 1.50 → still 0.5 L per 10 cm → A 1 L, no EC part; Pool & Drum Setup "EC step" 0.5 → 0.5 + 1 = 1.5 L per 10 cm → A 3 L at once; cleared → A 1 L',
  requires:NEW,
  run:fn(`irrSavePool('P11A','water','80');await setEc('P11A','1.50');const a=D('P11A');const says=/EC (under|over)/.test(SAYS('P11A'));
    updatePoolField('P11A','ecStepL','0.5');await sleep(300);const b=D('P11A');
    updatePoolField('P11A','ecStepL','');await sleep(300);const c=D('P11A');
    return {a:{a:a.a,A:a.A,per10:a.per10},says,b:{a:b.a,A:b.A,per10:b.per10},c:{a:c.a,A:c.A}};`),
  expect:{a:{a:1000,A:1,per10:0.5},says:false,b:{a:3000,A:3,per10:1.5},c:{a:1000,A:1}} },

{ name:'🧪 Pool & Drum Setup "EC step: L per 0.1" applies at once: Pool 1 at 30 cm, EC 1.60 → 2 L per 10 cm → A 6 L; step 2 → 1 + 2 = 3 L → A 9 L; step 0 → the EC does not change it → A 3 L; cleared → A 6 L; the card shows the default 1 and "under 1.70 + 1 L for every 0.1"',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');await setEc('P01','1.60');const a=D('P01').A;
    updatePoolField('P01','ecStepL','2');await sleep(300);const b=D('P01').A;
    updatePoolField('P01','ecStepL','0');await sleep(300);const c=D('P01').A;
    updatePoolField('P01','ecStepL','');await sleep(300);const d=D('P01').A;
    switchView('pool_setup');await sleep(1200);const v=document.getElementById('view-pool_setup');
    const box=v&&v.querySelector('input[onchange*="\\'P01\\',\\'ecStepL\\'"]');
    return {a,b,c,d,ph:box?box.placeholder:null,txt:v?/under 1\\.70 \\+ 1 L for every 0\\.1, over 1\\.80 − 1 L for every 0\\.1/.test(v.innerText):false};`),
  expect:{a:6,b:9,c:3,d:6,ph:'1',txt:true} },

{ name:'📐 Pool & Drum Setup → 🧪 A/B by EC: one column per rule (GH1–GH6 & GH10 1 L · GH7 & GH8 1 L step 0.75 · GH9 2 L step 1.5 · PRJ11 0.5 L), 28 EC rows 1.00–2.35; for 10 cm at EC 1.50 → 3 / 2.5 / 5 / 0.5 L, at 1.75 → 1 / 1 / 2 / 0.5 L, at 1.85 → 0.5 / 0.6 / 1.3 / 0.5 L, at 2.00 → water only for the three GH columns; 30 cm at EC 1.50 → 9 L',
  requires:NEW,
  run:fn(`switchView('pool_setup');await sleep(1200);const btn=document.getElementById('hnxAbEcBtn');if(btn)btn.click();await sleep(500);
    const pan=document.getElementById('hnxAbEcPanel');if(!pan)return {panel:false};
    const heads=[...pan.querySelectorAll('thead th')].slice(1).map(th=>th.firstChild.textContent.trim());
    const cell=(k,ec)=>{const td=pan.querySelector('td[data-abec="'+k+'|'+ec+'"]');return td?td.textContent:null;};
    const G=['1|1','1|0.75','2|1.5','0.5|0'];const row=ec=>G.map(k=>cell(k,ec));
    const out={panel:true,heads,rows:pan.querySelectorAll('tbody tr').length,e150:row('1.50'),e175:row('1.75'),e185:row('1.85'),e200:row('2.00')};
    const cm=document.getElementById('hnxAbEcCm');cm.value='30';cm.dispatchEvent(new Event('change'));await sleep(500);
    out.cm30=(document.querySelector('#hnxAbEcPanel td[data-abec="1|1|1.50"]')||{}).textContent;
    return out;`),
  expect:{panel:true,heads:['GH1, GH2, GH3, GH4, GH5, GH6, GH10','GH7, GH8','GH9','PRJ11'],rows:28,
    e150:['3 L','2.5 L','5 L','0.5 L'],e175:['1 L','1 L','2 L','0.5 L'],e185:['0.5 L','0.6 L','1.3 L','0.5 L'],e200:['0 · water only','0 · water only','0 · water only','0.5 L'],cm30:'9 L'} },

{ name:'🩹 Today\'s round worked out by the old 1 L per 10 cm engine is worked out again: Pool 1 08:00 stored at 30 cm, EC 1.5 with A 3 L (auto, engine 22.32) → opening the Pool Monitor gives A 9 L, B 9 L (engine 22.56); Pool 2 with A and B TYPED 4 L keeps 4',
  requires:NEW,
  run:fn(`const data=loadIrrPool();data[_irrDate]=data[_irrDate]||{};
    data[_irrDate].P01={'08:00':{water:'30',EC:'1.5',waterAdded:607,A:3,B:3,C:0.15,_autoFilled:{waterAdded:true,A:true,B:true,C:true},
      _dose:{v:'22.32',gap:30,waterL:607,ec:1.5,ph:'',row:'',factor:1,aCC:3000,bCC:3000,cCC:150,ecHigh:false,calibrate:'',note:'',target:60,mode:'per10',per10L:1,srcMult:1},updatedAt:1}};
    data[_irrDate].P02={'08:00':{water:'30',EC:'1.5',A:4,B:4,_autoFilled:{},updatedAt:1}};
    saveIrrPool(data);try{delete window._perfCache._irrPool;}catch(e){}renderIrrPoolMonitor();await sleep(800);renderIrrPoolMonitor();await sleep(500);
    const a=rec('P01'),b=rec('P02');return {p1:{A:a.A,B:a.B,v:(a._dose||{}).v},p2:{A:b.A,B:b.B}};`),
  expect:{p1:{A:9,B:9,v:'22.56'},p2:{A:4,B:4}} }
];
