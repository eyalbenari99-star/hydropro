/* v22.56 audit (12 Oct 2026) — the fixes found by the release audit of the EC dose rule: the pool setup pulled from another
   computer reaches the dose engine (two computers no longer flip today's round between the old and the new EC step); a result
   worked out by a NEWER engine is never rewritten by an older copy; a cleared reading re-works the dose on a past day too and a
   cleared level empties Nexi's own boxes; an A box a person emptied stays empty; an EC under 1.00 is held before rounding; an A/B
   amount that rounds to 0 cc is said as "water only"; a refused setup entry keeps the stored value. */
const NEW="typeof window.irrAbRate==='function'&&typeof window.irrDoseVerOk==='function'&&typeof window.__hnxIrrSetupPulled==='function'";
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const rec=(id,day)=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[day||_irrDate]||{})[id]||{})['08:00']||{};};
  const D=id=>{const r=rec(id),d=r._dose||{};return {gap:d.gap,a:d.aCC,b:d.bCC,A:r.A,B:r.B,per10:d.per10L,v:d.v};};
  const says=id=>{const h=document.getElementById('stubIrrNutrientsBody');const tr=[...h.querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));return tr?((tr.querySelector('.irr-nexi-says')||{}).textContent||''):'';};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
module.exports=[
{ name:'🔁 (audit) the setup from another computer reaches the dose engine: Pool 1 at 30 cm, EC 1.60 → A 6 L (2 L per 10 cm); the EC step 2 arrives in storage only (this computer\'s IRR_POOLS still the old one) → the next render gives A 9 L (3 L per 10 cm) instead of re-working it back to 6, two renders leave the round alone (updatedAt steady), and the pull hook alone redraws to 9 L with the step 2 in memory',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');irrSavePool('P01','EC','1.60');await sleep(400);renderIrrPoolMonitor();await sleep(400);const a=D('P01');
    const stale=JSON.parse(JSON.stringify(IRR_POOLS));updatePoolField('P01','ecStepL','2');await sleep(400);
    /* computer B: the setup arrived in storage (the pull), its memory is still the old one */
    IRR_POOLS=stale;renderIrrPoolMonitor();await sleep(600);const b=D('P01');const u1=rec('P01').updatedAt;
    renderIrrPoolMonitor();await sleep(600);const u2=rec('P01').updatedAt;
    IRR_POOLS=stale;window.__hnxIrrSetupPulled('hydroPro_pool_dimensions');await sleep(1200);const c=D('P01');
    return {a:a.A,per10a:a.per10,b:b.A,per10b:b.per10,steady:u1===u2,hook:c.A,inMem:String((IRR_POOLS.find(p=>p.id==='P01')||{}).ecStepL)};`),
  expect:{a:6,per10a:2,b:9,per10b:3,steady:true,hook:9,inMem:'2'} },

{ name:'🛡 (audit) a result worked out by a NEWER engine is never rewritten back: today Pool 1 (30 cm, EC 1.50) stored with _dose.v 99.99 and A 1 L (auto) → after the render A stays 1 and v 99.99; Pool 2, the same record dated by the OLDER engine 22.32 → worked out again: A 9 L, v 22.56',
  requires:NEW,
  run:fn(`const T=hnxLocalToday();const mk=v=>({water:'30',EC:'1.50',A:1,B:1,waterAdded:607,_autoFilled:{A:true,B:true,waterAdded:true},_dose:{v:v,gap:30,waterL:607,aCC:1000,bCC:1000,cCC:0,mode:'per10',per10L:0.333,srcMult:1,target:60,ec:1.5},updatedAt:1});
    const st={};st[T]={P01:{'08:00':mk('99.99')},P02:{'08:00':mk('22.32')}};localStorage.setItem('hydroPro_irr_pool',JSON.stringify(st));try{delete window._perfCache._irrPool;}catch(e){}
    renderIrrPoolMonitor();await sleep(700);const a=D('P01'),b=D('P02');return {newA:a.A,newV:a.v,oldA:b.A,oldV:b.v,ok:window.irrDoseVerOk('99.99')&&!window.irrDoseVerOk('22.32')};`),
  expect:{newA:1,newV:'99.99',oldA:9,oldV:'22.56',ok:true} },

{ name:'🧹 (audit) clearing a reading re-works the dose on a PAST day too: yesterday Pool 1 30 cm, EC 1.50 → A 9 L; EC cleared → A 3 L with "no EC reading"; Pool 2 level cleared → Nexi\'s B and water boxes empty and no stored dose, while its TYPED A 5 L stays',
  requires:NEW,
  run:fn(`const Y=(d=>{d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);})(new Date(hnxLocalToday()+'T12:00:00'));_irrDate=Y;
    irrSavePool('P01','water','30');irrSavePool('P01','EC','1.50');await sleep(300);const a=D('P01');
    irrSavePool('P01','EC','');await sleep(300);const b=D('P01'),noEc=!!(rec('P01')._dose||{}).ecNone;
    irrSavePool('P02','water','30');irrSavePool('P02','EC','1.50');irrSavePool('P02','A','5');await sleep(300);irrSavePool('P02','water','');await sleep(300);const r2=rec('P02');
    _irrDate=hnxLocalToday();return {a:a.A,b:b.A,noEc,wA:r2.A,wB:r2.B===''||r2.B==null,wW:r2.waterAdded===''||r2.waterAdded==null,dose:!r2._dose};`),
  expect:{a:9,b:3,noEc:true,wA:'5',wB:true,wW:true,dose:true} },

{ name:'✋ (audit) an A box a person empties stays empty: today Pool 1 30 cm, EC 1.60 → A 6 L ⚡; A cleared → still empty after the half-second redraw and another full render, B stays 6 ⚡ and the flag records a person\'s clear',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','30');irrSavePool('P01','EC','1.60');await sleep(300);const a=D('P01');irrSavePool('P01','A','');await sleep(700);irrPoolRerender();await sleep(700);const b=D('P01');renderIrrPoolMonitor();await sleep(600);const c=rec('P01');
    return {a:a.A,b:b.A===''||b.A==null,c:c.A===''||c.A==null,B:c.B,af:c._autoFilled.A};`),
  expect:{a:6,b:true,c:true,B:6,af:false} },

{ name:'🔬 (audit) an EC under 1.00 is held BEFORE rounding: Pool 1 at 50 cm (10 cm to add), EC 0.995 → A 1000 cc "looks wrong — re-measure" (it rounded to 1.00 and gave 7 steps = 8000 cc); EC 0.999 → 1000 cc; EC 1.00 → 8000 cc',
  requires:NEW,
  run:fn(`const go=async ec=>{irrSavePool('P01','water','50');irrSavePool('P01','EC',ec);await sleep(250);const d=rec('P01')._dose||{};return {a:d.aCC,held:!!d.ecHeld};};
    const a=await go('0.995'),b=await go('0.999'),c=await go('1.00');return {a:a.a,ah:a.held,b:b.a,c:c.a,ch:c.held};`),
  expect:{a:1000,ah:true,b:1000,c:8000,ch:false} },

{ name:'💧 (audit) an A/B amount that rounds to 0 cc is "water only", not "A 0 cc": Pool 7 at 90 cm (10 cm to add), EC 1.93 → 0.025 L per 10 cm → "EC 1.93 is over 1.80 — add 215 L water only, no A/B (1 L − 0.975 L per 10 cm rounds to 0)", A and B empty; EC 1.87 → 0.475 L per 10 cm → A 500 cc',
  requires:NEW,
  run:fn(`irrSavePool('P07','water','90');irrSavePool('P07','EC','1.93');await sleep(900);const r=rec('P07'),d=r._dose||{},s=says('P07');
    irrSavePool('P07','EC','1.87');await sleep(400);const d2=rec('P07')._dose||{};
    return {a:d.aCC,high:!!d.ecHigh,r0:!!d.ecRound0,A:r.A===''||r.A==null,says:/EC 1\\.93 is over 1\\.80 — add 215 L water only, no A\\/B \\(1 L − 0\\.975 L per 10 cm rounds to 0\\)/.test(s),a2:d2.aCC,per10b:d2.per10L};`),
  expect:{a:0,high:true,r0:true,A:true,says:true,a2:500,per10b:0.475} },

{ name:'⚙ (audit) a negative "EC step" is refused and the box shows the kept value: Pool 1 step 2, then −1 typed → the box reads 2 again, the stored step stays 2 and a toast says "EC step must be 0 or more"',
  requires:NEW,
  run:fn(`const toasts=[];window.showToast=m=>toasts.push(String(m));updatePoolField('P01','ecStepL','2');await sleep(200);
    switchView('pool_setup');await sleep(1200);
    const inp=(document.getElementById('view-pool_setup')||document).querySelector('input[onchange*="\\'P01\\',\\'ecStepL\\'"]');if(!inp)return {noInput:true};
    inp.value='-1';inp.dispatchEvent(new Event('change'));await sleep(250);
    return {box:inp.value,stored:String((loadIrrPools().find(p=>p.id==='P01')||{}).ecStepL),toast:toasts.some(t=>/0 or more/.test(t))};`),
  expect:{box:'2',stored:'2',toast:true} }
];
