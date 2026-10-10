/* v22.42 (Eyal, 10 Oct 2026, screenshot of v22.40): Pool 1 at 29.9 cm said "A 6.98 L" under "every 10 cm → 1 L A + 1 L B · 30 cm here" —
   a computer on an old version had merged the cloud copy field by field, keeping the larger old EC-matrix 6975 cc next to the new rule.
   Today's round is now worked out again when it disagrees with the rule (typed values and past days untouched). And "too much and
   redundant … let the right box the left … squeeze all more together … better images with motions 3d": Nexi's 3-D drawing is what to
   add, the boxes under it carry no repeated picture, the hand meters sit under their gauges — a pool is about half a screen. */
const NEW="typeof window.irrDoseStale==='function'&&typeof window.hnxIrrCvDefs==='function'";
const H=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  const rec=(id,day)=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[day||_irrDate]||{})[id]||{})['08:00']||{};};
  const host=()=>document.getElementById('stubIrrNutrientsBody');
  const card=id=>[...host().querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));
  const mixed=(o)=>Object.assign({water:'29.9',manualEC:'1.659',manualPH:'6.3',waterAdded:607,A:6.98,B:6.98,C:0.17,_autoFilled:{waterAdded:true,A:true,B:true,C:true},
    _dose:{v:'22.32',gap:30,waterL:607,ec:1.659,ph:6.3,row:'',factor:1,aCC:6975,bCC:6975,cCC:165,ecHigh:false,calibrate:'',note:'',target:60,mode:'per10',per10L:1,srcMult:1},updatedAt:1},o||{});`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
module.exports=[
{ name:'🩹 A mixed result from an old computer is corrected on TODAY\'s screen: Pool 1 at 29.9 cm (hand EC 1.659) stored "A 6.98 L / 6975 cc" under the 1 L per 10 cm rule → opening the Pool Monitor gives A 3 L, B 3 L (3000 cc), "Nexi says … A 3000 cc", the drawing "A 3 L"; Pool 2 with A TYPED 5 L keeps 5 (B auto → 3); 9 Oct\'s same mixed record is left as it was',
  requires:NEW,
  run:fn(`const T=hnxLocalToday(),Y='2026-10-09';const st={};st[T]={P01:{'08:00':mixed()},P02:{'08:00':mixed({A:5,_autoFilled:{waterAdded:true,A:false,B:true,C:true}})}};st[Y]={P01:{'08:00':mixed()}};
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify(st));try{delete window._perfCache._irrPool;}catch(e){}
    const pastBefore=JSON.stringify(st[Y]);
    switchView('irr_nutrients');await sleep(900);_irrDate=T;window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(600);
    const r1=rec('P01'),r2=rec('P02');const says=(card('P01').querySelector('.irr-nexi-says')||{}).textContent||'';
    const step=[...(card('P01').querySelectorAll('.irr-rx-step b'))].map(b=>b.textContent);
    _irrDate=Y;renderIrrPoolMonitor();await sleep(500);try{delete window._perfCache._irrPool;}catch(e){}const pastAfter=JSON.stringify(loadIrrPool()[Y]);_irrDate=T;
    return {A:r1.A,B:r1.B,aCC:r1._dose.aCC,says:/A 3000 cc · B 3000 cc/.test(says),drawA:step[1],typedA:r2.A,autoB:r2.B,past:pastBefore===pastAfter};`),
  expect:{A:3,B:3,aCC:3000,says:true,drawA:'A 3 L',typedA:5,autoB:3,past:true} },

{ name:'🗜 Squeezed card (1920×1200, text 120 %): Pool 1\'s card is under 55 % of the window (two pools a screen), the hand EC box sits UNDER the EC gauge, the water / A / B / C boxes are one row UNDER "Nexi says" — v22.46: each with its own picture, and the drawing\'s pictures are not repeated in the card — nothing scrolls sideways',
  requires:NEW, viewport:{width:1920,height:1200}, seed:new Function(`localStorage.setItem('hydroPro_ui_textscale','1.2');`),
  run:fn(`switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');
    ['P01'].forEach(id=>{irrSavePool(id,'water','29.9');irrSavePool(id,'EC','1.7');irrSavePool(id,'pH','6.3');irrSavePool(id,'waterTemp','24.5');irrSavePool(id,'airPump','working');irrSavePool(id,'ozoneSec','55');});
    await sleep(400);renderIrrPoolMonitor();await sleep(600);
    const c=card('P01'),td=i=>c.children[i-1],R=e=>e.getBoundingClientRect(),w=host().querySelector('.irr-pool-table-wrap');
    const ec=R(td(3)),hec=R(td(4)),rx=R(c.querySelector('.irr-pc-rx')),ins=[12,13,14,15].map(i=>R(td(i)));
    return {half:R(c).height<=innerHeight*0.55,handUnder:Math.abs(hec.left-ec.left)<2&&hec.top>=ec.bottom-1,
      oneRow:ins.every(b=>Math.abs(b.top-ins[0].top)<2),underDrawing:ins.every(b=>b.top>=rx.bottom-1),
      ownPics:[11,12,13,14,15].every(i=>[...td(i).querySelectorAll('.irr-cv')].some(p=>p.offsetParent!==null)),noRepeat:[...c.querySelectorAll('.irr-pc-rx .irr-rx-step')].every(p=>p.offsetParent===null),extra:Math.max(0,w.scrollWidth-w.clientWidth)};`),
  expect:{half:true,handUnder:true,oneRow:true,underDrawing:true,ownPics:true,noRepeat:true,extra:0} },

{ name:'🧊 The drawing is 3-D: Pool 1 at 32 cm → A 2.8 L as jugs 1, 2, 0.8 filled with the A gradient (url(#cva)) with a liquid surface, the tank fills with the water gradient and drips 2 drops from its valve, the C beaker uses the C gradient — the gradients exist on the page',
  requires:NEW,
  run:fn(`switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');irrSavePool('P01','water','32');irrSavePool('P01','EC','1.7');irrSavePool('P01','pH','6.5');await sleep(400);renderIrrPoolMonitor();await sleep(500);
    const rx=document.querySelector('.irr-rx[data-rxpool="P01"]');const st=[...rx.querySelectorAll('.irr-rx-step')];
    const jugFill=st[1].querySelector('.fill path');const tank=st[0];const cup=st[st.length-1];
    return {nums:[...st[1].querySelectorAll('.irr-rx-jug i')].map(i=>i.textContent).join(','),jugPaint:/url\\(#cva\\)/.test(jugFill.getAttribute('fill')),surface:!!st[1].querySelector('.fill ellipse'),
      tankPaint:[...tank.querySelectorAll('path')].some(p=>/url\\(#cvw\\)/.test(p.getAttribute('fill')||'')),drops:tank.querySelectorAll('.drop').length,
      cupPaint:/url\\(#cvc\\)/.test((cup.querySelector('.fill path')||{getAttribute:()=>''}).getAttribute('fill')),defs:!!document.querySelector('#hnxCvDefs #cva')&&!!document.querySelector('#hnxCvDefs #cvw')};`),
  expect:{nums:'1,2,0.8',jugPaint:true,surface:true,tankPaint:true,drops:2,cupPaint:true,defs:true} }
];
