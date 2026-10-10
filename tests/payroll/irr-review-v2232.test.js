/* v22.32 review fixes (independent review of the 10 Oct dose rule + the drawn recommendation, every finding reproduced first):
   a past day is never rewritten by opening it, a Pool & Drum Setup change (daily target, L, W) recomputes today's round, Smart Dosing
   shows a past day's own dose and cannot write into it, the paired rooms GH3_4 / GH7_8 follow 1 L per 10 cm, exact halves round up,
   and the drawing prints the dose's own cc, its exact multiplier, "enter EC first" for a matrix pool, staggers the jugs, rests when
   nothing changed, stops off screen and on paper, and sits under "Nexi says" on a phone. */
const NEW="typeof window.hnxIrrRecipe==='function'&&typeof window.irrAbPer10==='function'&&/_overtank/.test(String(window.autoFillRecommendations))";
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const rec=(id,day)=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[day||_irrDate]||{})[id]||{})['08:00']||{};};
  const P=id=>IRR_POOLS.find(p=>p.id===id);
  const D=id=>{const r=rec(id),d=r._dose||{};return {gap:d.gap,water:d.waterL,a:d.aCC,A:r.A,W:r.waterAdded,x:d.srcMult,v:d.v};};
  const RX=id=>document.querySelector('#stubIrrNutrientsBody .irr-rx[data-rxpool="'+id+'"]');`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
/* the page clock on 10 Oct 2026 10:00 Manila, so "yesterday" is 9 Oct */
const CLOCK=`const RD=Date;const off=RD.parse('2026-10-10T02:00:00Z')-RD.now();
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;`;
module.exports=[
{ name:'🗓 Opening a PAST day never rewrites it, also when a box is empty: 9 Oct Pool 1 (54 cm, no EC, old engine: A/B empty, "enter the EC first") and Pool 2 (level at target, Water Added empty) → after opening 9 Oct and recomputing the round both records are byte-identical (the review saw A 0.6 L and a 22.32 dose written into 9 Oct)',
  requires:NEW, tz:'Asia/Manila',
  seed:new Function(CLOCK+`
    const o1={v:'22.20',gap:6,waterL:121,ec:'',ph:'',row:'',factor:1,aCC:0,bCC:0,cCC:30,ecHigh:false,calibrate:'',note:'',target:60,mode:'matrix'};
    const o2={v:'22.20',gap:0,waterL:0,ec:1.8,ph:'',row:'1.80',factor:1,aCC:0,bCC:0,cCC:0,ecHigh:false,calibrate:'',note:'',target:60,mode:'matrix'};
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify({'2026-10-09':{P01:{'08:00':{water:'54',waterAdded:121,A:'',B:'',C:0.03,_autoFilled:{waterAdded:true,C:true},_dose:o1,updatedAt:1}},
      P02:{'08:00':{water:'60',EC:'1.8',waterAdded:'',A:'',B:'',C:'',_autoFilled:{},_dose:o2,updatedAt:1}}}}));`),
  run:fn(`const before=JSON.stringify(loadIrrPool()['2026-10-09']);
    _irrDate='2026-10-09';renderIrrPoolMonitor();await sleep(500);irrRecomputeRound();await sleep(200);renderIrrPoolMonitor();await sleep(300);
    try{delete window._perfCache._irrPool;}catch(e){}const after=JSON.stringify(loadIrrPool()['2026-10-09']);
    const says=/A\\/B: enter the EC reading first/.test(document.getElementById('stubIrrNutrientsBody').innerText);
    _irrDate=hnxLocalToday();
    return {same:before===after,says};`),
  expect:{same:true,says:true} },

{ name:'⚙ Changing the DAILY TARGET in Pool & Drum Setup recomputes today at once: Pool 1 at 40 cm, EC 1.7 (target 60) → gap 20, 405 L, A 2 L; daily target 70 → gap 30, 607 L, A 3 L, the drawing’s target line says 70 (it kept 20 cm / 2 L before)',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(300);const b=D('P01');
    updatePoolDim('P01','dailyTarget','70');await sleep(300);renderIrrPoolMonitor();await sleep(300);const a=D('P01');
    const tgt=RX('P01')?[...RX('P01').querySelectorAll('svg text')].map(t=>t.textContent).join(','):'';
    return {before:{gap:b.gap,W:b.W,A:b.A},after:{gap:a.gap,W:a.W,A:a.A,a:a.a},line70:tgt==='70'};`),
  expect:{before:{gap:20,W:405,A:2},after:{gap:30,W:607,A:3,a:3000},line70:true} },

{ name:'🎯 Smart Dosing on a PAST day shows that day’s own dose and cannot write into it: 9 Oct Pool 1 stored 2100 cc → its A shows 2.1 (not today’s 0.6), no apply button for Pool 1, "🔒 past day"; today → apply buttons back',
  requires:NEW, tz:'Asia/Manila',
  seed:new Function(CLOCK+`
    const old={v:'22.20',gap:6,waterL:121,ec:1,ph:'',row:'1.50',factor:1,aCC:2100,bCC:2100,cCC:30,ecHigh:false,calibrate:'',note:'',target:60,mode:'matrix'};
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify({'2026-10-09':{P01:{'08:00':{water:'54',EC:'1',waterAdded:121,A:2.1,B:2.1,C:0.03,_autoFilled:{waterAdded:true,A:true,B:true,C:true},_dose:old,updatedAt:1}}}}));`),
  run:fn(`let host=document.getElementById('stubIrrSmartDoseBody');if(!host){host=document.createElement('div');host.id='stubIrrSmartDoseBody';document.body.appendChild(host);}
    _irrDate='2026-10-09';renderIrrSmartDose();const h1=host.innerHTML;
    const past={a21:/>2\\.1<\\/span>/.test(h1),buttons:(h1.match(/irrSavePool\\('P01'/g)||[]).length,lock:h1.indexOf('🔒 past day')>=0};
    _irrDate=hnxLocalToday();irrSavePool('P01','water','54');await sleep(200);renderIrrSmartDose();const h2=host.innerHTML;
    return {past,todayButtons:(h2.match(/irrSavePool\\('P01'/g)||[]).length>0,todayLock:h2.indexOf('🔒 past day')>=0};`),
  expect:{past:{a21:true,buttons:0,lock:true},todayButtons:true,todayLock:false} },

{ name:'🏠 The paired rooms follow 1 L per 10 cm: a wizard pool in GH7_8 → 1, in GH3_4 → 1, GH9 → 2, GH11 → none (EC matrix), a project pool PRJ11 → none',
  requires:NEW,
  run:fn(`const f=g=>irrAbPer10({id:'P_X_'+g+'_1',greenhouse:g});
    return {gh78:f('GH7_8'),gh34:f('GH3_4'),gh9:f('GH9'),gh11:f('GH11'),prj:f('PRJ11')};`),
  expect:{gh78:1,gh34:1,gh9:2,gh11:null,prj:null} },

{ name:'🧮 Exact halves round UP: Pool 1 at 10 cm, mix 15% over-tank → gap 50 × 1.15 = 57.5 → 5.8 L each (5800 cc; 5.7 L before — 57.4999… in floating point); the drawing says "×1.15" (it printed ×1.2)',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','10');irrSavePool('P01','EC','1.7');irrSavePool('P01','source','mix');irrSavePool('P01','mixPct','15');await sleep(300);renderIrrPoolMonitor();await sleep(300);
    const d=D('P01');const ratio=(RX('P01')&&RX('P01').querySelector('.irr-rx-ratio')||{}).textContent||'';
    return {gap:d.gap,a:d.a,A:d.A,x115:/water ×1\\.15 ·/.test(ratio),each:/50 cm here = 5\\.8 L each/.test(ratio)};`),
  expect:{gap:50,a:5800,A:5.8,x115:true,each:true} },

{ name:'🧪 The drawing prints the dose’s own amounts: a matrix dose of 825 cc → "A 0.83 L" and "825 cc" (as "Nexi says" and the box; it drew 0.8 L · 800 cc); a matrix pool with no EC → "A / B: enter EC first", never two empty "A 0 L" jugs',
  requires:NEW,
  run:fn(`const p={id:'PRJ_T',label:'Test pool',dim:{L:200,W:100}};const r={water:'40'};
    const h1=hnxIrrRecipe(p,r,{gap:20,target:60,waterL:400,aCC:825,bCC:825,cCC:100,ec:1.7,mode:'matrix'});
    const h2=hnxIrrRecipe(p,r,{gap:20,target:60,waterL:400,aCC:0,bCC:0,cCC:100,ec:'',mode:'matrix'});
    return {a083:h1.indexOf('A 0.83 L')>=0,cc825:h1.indexOf('825 cc')>=0,no800:h1.indexOf('800 cc')<0,ecFirst:h2.indexOf('A / B: enter EC first')>=0,noZero:h2.indexOf('A 0 L')<0};`),
  expect:{a083:true,cc825:true,no800:true,ecFirst:true,noZero:true} },

{ name:'🎞 Motion details: in "always" the 2nd jug starts 0.35 s after the 1st; a drawing out of view (iv-off) stands still; in "after a change" a drawing unchanged for one burst RESTS on the next re-render while a changed pool moves (also when the screen re-renders twice quickly); every drawing is watched for leaving the screen',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');irrSavePool('P01','EC','1.7');await sleep(300);hnxIrrViz.setMotion('always');renderIrrPoolMonitor();await sleep(400);
    const rx=()=>RX('P01');const fills=()=>[...rx().querySelectorAll('.fill')];
    const inView=async()=>{try{rx().scrollIntoView({block:'center'});}catch(e){}await sleep(250);}; /* a drawing out of view stops moving (iv-off) */
    await inView();
    const delay=getComputedStyle(fills()[1]).animationDelay;
    rx().classList.add('iv-off');const off=getComputedStyle(fills()[0]).animationName;rx().classList.remove('iv-off');
    const watched=rx().getAttribute('data-rxw')==='1';
    window.__hnxRxRestMs=0; /* rest after one unchanged re-render (normally ≈10 s, one burst) */
    hnxIrrViz.setMotion('settle');renderIrrPoolMonitor();await sleep(200);renderIrrPoolMonitor();await sleep(200);
    await inView();const rest=rx().classList.contains('rest'),restAnim=getComputedStyle(fills()[0]).animationName;
    window.__hnxRxRestMs=60000;irrSavePool('P01','water','25');await sleep(300);renderIrrPoolMonitor();await sleep(200);
    await inView();const moved=!rx().classList.contains('rest')&&getComputedStyle(fills()[0]).animationName==='irrRxFill';
    hnxIrrViz.setMotion('always');delete window.__hnxRxRestMs;
    return {delay,off,watched,rest,restAnim,moved};`),
  expect:{delay:'0.35s',off:'none',watched:true,rest:true,restAnim:'none',moved:true} },

{ name:'🖨 On paper the drawing is still (full jugs): print media with Motion "always" → no animation on the jugs',
  requires:NEW,
  drive:async pg=>{
    const r=await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.__hnxPulledOk=true;
      switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');irrSavePool('P01','water','30');irrSavePool('P01','EC','1.7');await sleep(300);hnxIrrViz.setMotion('always');renderIrrPoolMonitor();await sleep(400);return !!document.querySelector('.irr-rx[data-rxpool="P01"] .fill');});
    await pg.emulateMedia({media:'print'});
    const a=await pg.evaluate(()=>{const el=document.querySelector('.irr-rx[data-rxpool="P01"] .fill');return el?getComputedStyle(el).animationName:'no drawing';});
    await pg.emulateMedia({media:'screen'});
    const b=await pg.evaluate(()=>{const el=document.querySelector('.irr-rx[data-rxpool="P01"] .fill');return el?getComputedStyle(el).animationName:'no drawing';});
    return {drawn:r,print:a,screen:b};},
  expect:{'drive':{drawn:true,print:'none',screen:'irrRxFill'}} },

{ name:'📱 On a phone (375 px) the drawing sits UNDER "Nexi says" (the Nexi row is a block, not the folded no-wrap flex row)',
  requires:NEW, viewport:{width:375,height:800},
  run:fn(`irrSavePool('P01','water','30');irrSavePool('P01','EC','1.7');await sleep(300);renderIrrPoolMonitor();await sleep(400);
    const rx=RX('P01');const td=rx?rx.closest('td'):null;const says=td?td.querySelector('.irr-nexi-says'):null;
    return {display:td?getComputedStyle(td).display:'none',under:!!(says&&rx&&rx.getBoundingClientRect().top>=says.getBoundingClientRect().bottom-1)};`),
  expect:{display:'block',under:true} },

{ name:'⚙ (review 2) A setup change made while ANOTHER day is on screen still updates TODAY: Pool 1 today at 40 cm, EC 1.7 → A 2 L; the screen on 9 Oct, daily target 70 → today gap 30, 607 L, A 3 L; the screen stays on 9 Oct',
  requires:NEW, tz:'Asia/Manila',
  seed:new Function(CLOCK),
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');await sleep(300);const b=D('P01');
    _irrDate='2026-10-09';updatePoolDim('P01','dailyTarget','70');await sleep(300);const onScreen=_irrDate;
    const t=rec('P01','2026-10-10'),d=t._dose||{};_irrDate=hnxLocalToday();
    return {before:b.A,after:{gap:d.gap,W:t.waterAdded,A:t.A},onScreen};`),
  expect:{before:2,after:{gap:30,W:607,A:3},onScreen:'2026-10-09'} },

{ name:'⚙ (review 2) The pH target and the recipe C change today’s C at once: Pool 1 at 40 cm, EC 1.7, pH 6.5 (target 6.2) → C 130 cc; pH target 6.0 → C 150 cc (0.15 L); recipe C 10 cc/cm → C 300 cc (0.3 L) — Smart Dosing shows the same',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','40');irrSavePool('P01','EC','1.7');irrSavePool('P01','pH','6.5');await sleep(300);const c0=(rec('P01')._dose||{}).cCC;
    updatePoolEcPh('P01','ph','target','6.0');await sleep(300);const r1=JSON.parse(JSON.stringify(rec('P01'))); /* a copy: the stored round object is updated in place later */
    updatePoolRecipe('P01','C','10');await sleep(300);const r2=JSON.parse(JSON.stringify(rec('P01')));
    return {c0,c1:(r1._dose||{}).cCC,C1:r1.C,c2:(r2._dose||{}).cCC,C2:r2.C};`),
  expect:{c0:130,c1:150,C1:0.15,c2:300,C2:0.3} },

{ name:'📤 (review 2) GH1–10 rounds with no dose still carry the water-source multiplier: Pool 1 over-tank at its target (60 cm) → ×2 (it showed 0.474, the project-pool factor); in CALIBRATE → ×2; a project pool keeps its factor',
  requires:NEW,
  run:fn(`const p=P('P01');const at=irrComputeDose(p,{water:'60',EC:'1.7',source:'overtank'},'08:00');const cal=irrComputeDose(p,{water:'40',EC:'1.3',manualEC:'1.4',source:'overtank'},'08:00');
    const prj=IRR_POOLS.find(x=>irrAbPer10(x)==null);const pd=prj?irrComputeDose(prj,{water:'40',EC:'1.7',source:'overtank'},'08:00'):{};
    return {at:at.srcMult,atGap:at.gap,cal:cal.srcMult,calib:!!cal.calibrate,prj:prj?(pd.srcMult==null&&pd.factor<1):true};`),
  expect:{at:2,atGap:0,cal:2,calib:true,prj:true} },

{ name:'🎯 (review 2) Smart Dosing judges a PAST day on the target it was dosed with: 9 Oct Pool 1 at 60 cm dosed against 60 (at target) → after the daily target becomes 45, 9 Oct does NOT say "Over target"; today at 60 cm with target 45 does say "Over target by 15cm"',
  requires:NEW, tz:'Asia/Manila',
  seed:new Function(CLOCK+`
    const old={v:'22.32',gap:0,waterL:0,ec:1.8,ph:'',row:'',factor:1,srcMult:1,aCC:0,bCC:0,cCC:0,ecHigh:false,calibrate:'',note:'',target:60,mode:'per10',per10L:1};
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify({'2026-10-09':{P01:{'08:00':{water:'60',EC:'1.8',waterAdded:'',A:'',B:'',C:'',_autoFilled:{},_dose:old,updatedAt:1}}}}));`),
  run:fn(`let host=document.getElementById('stubIrrSmartDoseBody');if(!host){host=document.createElement('div');host.id='stubIrrSmartDoseBody';document.body.appendChild(host);}
    updatePoolDim('P01','dailyTarget','45');await sleep(200);
    _irrDate='2026-10-09';renderIrrSmartDose();const past=/Over target by/.test(host.innerText);
    _irrDate=hnxLocalToday();irrSavePool('P01','water','60');irrSavePool('P01','EC','1.8');await sleep(300);renderIrrSmartDose();const today=/Over target by 15cm/.test(host.innerText);
    return {past,today};`),
  expect:{past:false,today:true} },

{ name:'🎞 (review 2) A jug waits EMPTY for its turn (no full jug that snaps empty): A 3.1 L in "always" → 150 ms after drawing, the 3rd jug is at scale 0 (a matrix, not "none"); the screen-reader label of a project pool with no EC says "A/B: enter EC first"; a fill-rule pool on 15% mix says "whole litres before ×1.15"; on a phone the Nexi row has no "Pool" card label',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','29');irrSavePool('P01','EC','1.7');await sleep(300);hnxIrrViz.setMotion('always');renderIrrPoolMonitor();
    try{RX('P01').scrollIntoView({block:'center'});}catch(e){}await sleep(150);
    const f=[...RX('P01').querySelectorAll('.irr-rx-step')[1].querySelectorAll('.fill')];const tr=f[2]?getComputedStyle(f[2]).transform:'none';
    const waits=/^matrix\\(/.test(tr)&&Math.abs(+(tr.match(/matrix\\(([^,]+),[^,]+,[^,]+,\\s*([^,]+)/)||[0,1,1])[2])<0.05;
    const h=hnxIrrRecipe({id:'PRJ_T',label:'Test pool',dim:{L:200,W:100}},{water:'40'},{gap:20,target:60,waterL:400,aCC:0,bCC:0,cCC:100,ec:'',mode:'matrix'});
    const aria=(/aria-label="([^"]*)"/.exec(h)||[])[1]||'';
    const hr=hnxIrrRecipe({id:'P07',label:'Pool 7',dim:{L:150,W:143}},{water:'69',source:'mix',mixPct:'15'},{gap:31,target:100,waterL:665,aCC:3500,bCC:3500,cCC:0,ec:1.7,mode:'rule',per10L:1,srcMult:1.15});
    return {waits,aria:aria.indexOf('A/B: enter EC first')>=0&&aria.indexOf('A 0 L')<0,ruleNote:hr.indexOf('whole litres before ×1.15')>=0};`),
  expect:{waits:true,aria:true,ruleNote:true} },

{ name:'📱 (review 2) On a phone the Nexi row shows no stray "Pool" card label above "Nexi says"',
  requires:NEW, viewport:{width:375,height:800},
  run:fn(`irrSavePool('P01','water','30');irrSavePool('P01','EC','1.7');await sleep(300);renderIrrPoolMonitor();await sleep(3000); /* the v13.88 card labeller runs every 2.5 s */
    const td=RX('P01')?RX('P01').closest('td'):null;return {label:td?getComputedStyle(td,'::before').content:'no row'};`),
  expect:{label:'none'} }
];
