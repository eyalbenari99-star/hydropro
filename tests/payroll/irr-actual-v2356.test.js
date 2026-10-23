/* Irrigation package P1 (Eyal, 20-23 Oct 2026): "Actually added". Under each recommendation box of the Pool Monitor round (Water Added, A, B, C) a
   second, separate, OPTIONAL box for what was really poured. Water: a cm box and an L box side by side - type either one and Nexi works out the
   other with the pool-area formula of the dose (litres = L x W x cm / 1000, whole litres like the dose; L and W from the pool size). A, B, C: litres.
   A chip shows done vs recommended in % (amber above 15 %); "not confirmed" (soft) when a recommendation exists and nothing was typed; saving is
   never blocked. New fields INSIDE the reading record: actWaterCm, actWaterL, actA, actB, actC (numbers; who and when from the existing field
   stamps and Checked By). The cloud merge carries them; two computers editing one round keep both computers' boxes. The 📒 Readings Report (and its
   CSV) and the Pool Monitor 📊 Export get five columns APPENDED at the end; a record without the new fields shows and exports as before. The blocks
   use only free space in the card (Eyal's v22.46 limits, tested in irr-v2246, are unchanged). Dose rules never change.
   Page clock: pinned (default Sat 10 Oct 2026 10:00 Manila, see PIN below). Pools (default setup): Pool 1 = 238 x 85 cm = 20 230 cm2 = 20.23 L per cm;
   Pool 7 = 150 x 143 cm = 21 450 cm2 = 21.45 L per cm; daily target 60 cm (Pool 7: 100 cm).
   Seed (written once per browser, so a reload keeps what the test typed):
     Pool 1 08:00 = level 32 cm, EC 1.7 -> Nexi: 28 cm to add = 566 L water, A 2.8 L, B 2.8 L, C 0.14 L (the same numbers as before this change)
     Pool 2 / 4 08:00 = typed recommendation 6 L water, A 3, B 3, C 0.2    Pool 3 08:00 = 20 L, A 10, B 10, C 1
   The "renders as before" hashes were taken from the page BEFORE this change (the boxes' HTML without the new block; " iv-off" - the motion-off
   class the app sets by itself on a slow computer - is left out of the hash). */
const T='2026-10-10';
/* NO WALL-CLOCK DEPENDENCE (the 23 Oct CI bomb): the page clock is pinned (Sat 10 Oct 2026 10:00 Manila, ticking on from there) and the browser
   time zone is Manila, whatever hour / zone the runner has. IRR_ACT_PIN / IRR_ACT_TZ exist only to PROVE that the cases do not care about the hour
   (e.g. IRR_ACT_PIN=2026-10-10T12:30:00Z = 20:30 Manila, IRR_ACT_PIN=2026-10-09T19:00:00Z = 03:00 Manila, IRR_ACT_TZ=UTC): the report rows are
   picked by their date + round, never "the first row", and nothing counts the rounds that happen to be due. */
const PIN=process.env.IRR_ACT_PIN||'2026-10-10T02:00:00Z', TZ=process.env.IRR_ACT_TZ||'Asia/Manila';
const STORE_JS=`{'${T}':{
  P01:{'08:00':{water:'32',EC:'1.7',manualEC:'1.7',pH:'6.2',manualPH:'6.2',waterTemp:'24.5',airPump:'working',ozoneSec:'55',source:'pure',checkedBy:'Reven',finishTime:'08:20',_fieldTimes:{water:'08:05',EC:'08:06'},updatedAt:1000,updatedBy:'reven'}},
  P02:{'08:00':{waterAdded:'6',A:'3',B:'3',C:'0.2',_autoFilled:{waterAdded:false,A:false,B:false,C:false},updatedAt:1000}},
  P03:{'08:00':{waterAdded:'20',A:'10',B:'10',C:'1',_autoFilled:{waterAdded:false,A:false,B:false,C:false},updatedAt:1000}},
  P04:{'08:00':{waterAdded:'6',A:'3',B:'3',C:'0.2',_autoFilled:{waterAdded:false,A:false,B:false,C:false},updatedAt:1000}}}}`;
/* the clock is replaced on EVERY page load (also after a reload); the store is written once per browser */
const SEED=new Function(`const RD=Date;const off=RD.parse('${PIN}')-RD.now();
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;
  window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');
  if(!localStorage.getItem('hnx_t_act2356')){localStorage.setItem('hnx_t_act2356','1');localStorage.setItem('hydroPro_irr_pool',JSON.stringify(${STORE_JS}));}`);
const OPEN=`const T='${T}';window.__toasts=[];window.showToast=(m)=>{window.__toasts.push(String(m));};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(1000);
  const host=()=>document.getElementById('stubIrrNutrientsBody');
  const row=id=>[...host().querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));
  const rec=(id,r)=>{try{delete window._perfCache._irrPool;}catch(e){}return (((loadIrrPool()[T]||{})[id])||{})[r||'08:00']||{};};
  const redraw=async()=>{renderIrrPoolMonitor();await sleep(700);};
  const chips=id=>[...row(id).querySelectorAll('.irr-act')].map(a=>{const c=a.querySelector('.irr-act-chip');return c?c.textContent+'|'+(c.classList.contains('warn')?'warn':c.classList.contains('ok')?'ok':'soft'):'-';});
  const actOf=r=>({cm:r.actWaterCm,L:r.actWaterL,A:r.actA,B:r.actB,C:r.actC});
  const units=id=>[...row(id).querySelectorAll('.irr-act-u')].map(x=>x.textContent);
  const recOf=r=>({W:r.waterAdded,A:r.A,B:r.B,C:r.C});
  const put=(id,o)=>Object.keys(o).forEach(f=>irrSavePool(id,f,o[f]));
  const sha=async s=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,16);};
  const tiles=async(id,idx)=>{const o={};for(const i of idx){const c=row(id).children[i-1].cloneNode(true);c.querySelectorAll('.irr-act').forEach(x=>x.remove());o[i]=await sha(c.innerHTML.replace(/ iv-off/g,''));}return o;};
  const inside=(a,b)=>{const r=a.getBoundingClientRect(),c=b.getBoundingClientRect();return r.left>=c.left-1&&r.right<=c.right+1&&r.top>=c.top-1&&r.bottom<=c.bottom+1;};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
const MINUS='\u2212';
const OLD_P2='Pool 2,Room 1&2,GH2,2026-10-10,08:00,entered,,,,,,,,,,pure,6,3,3,0.2,,,,,';
module.exports=[
{ name:'✅ "Actually added" boxes: every pool card has a second box under Water Added (a cm box and an L box side by side), A, B and C — 4 blocks, 5 inputs, in tiles 12–15 — and typing them changes NONE of Nexi\'s numbers: Pool 1 (32 cm, EC 1.7) keeps 566 L, A 2.8, B 2.8, C 0.14 with the auto flags; typed 28 cm (the L box fills itself: 28 cm = 566 L), A 2.5, B 2.8, C 0.14 are stored as numbers; chips 0.0 % / −10.7 % / 0.0 % / 0.0 % (the water chip is flanked by "cm" and "L" once something is typed); at 40 cm the recommendation moves to 405 L, A 2, B 2, C 0.1 and the typed amounts stay (chips +39.8 % / +25.0 % / +40.0 % / +40.0 %, amber); clearing the level clears Nexi\'s boxes and keeps the typed ones; who and when = the existing mechanism: the save is stamped by "tester" and each box says "Typed at hh:mm - round checked by Reven"',
  tz:TZ, seed:SEED,
  run:fn(`const R=row('P01');
    const before={blocks:R.querySelectorAll('.irr-act').length,tiles:[...R.children].map((td,i)=>td.querySelector('.irr-act')?i+1:0).filter(Boolean),
      inputs:[...R.querySelectorAll('.irr-act input')].map(i=>i.getAttribute('data-actf')+':'+i.placeholder),
      rec:recOf(rec('P01')),af:rec('P01')._autoFilled,act:Object.keys(rec('P01')).filter(k=>/^act/.test(k)),units:units('P01')};
    const type=async(f,v)=>{const i=row('P01').querySelector('input[data-actf="'+f+'"]');i.value=String(v);i.dispatchEvent(new Event('change',{bubbles:true}));await sleep(500);};
    await type('actWaterCm',28);await type('actA',2.5);await type('actB',2.8);await type('actC',0.14);await redraw();
    const r1=rec('P01');
    const typed={rec:recOf(r1),af:r1._autoFilled,act:actOf(r1),num:[r1.actWaterCm,r1.actWaterL,r1.actA,r1.actB,r1.actC].map(v=>typeof v),dose:r1._dose&&r1._dose.waterL,
      boxes:[...row('P01').querySelectorAll('.irr-act input')].map(i=>i.value),chips:chips('P01'),units:units('P01'),stamp:typeof r1._fieldTimestamps.actA,by:r1.updatedBy,
      tip:/Typed at \\d\\d:\\d\\d - round checked by Reven\\./.test(row('P01').querySelector('input[data-actf="actA"]').title)};
    irrSavePool('P01','water','40');await redraw();const r2=rec('P01');
    const lvl40={rec:recOf(r2),act:actOf(r2),chips:chips('P01'),dose:r2._dose&&{gap:r2._dose.gap,waterL:r2._dose.waterL,aCC:r2._dose.aCC,cCC:r2._dose.cCC}};
    irrSavePool('P01','water','');await redraw();const r3=rec('P01');
    const cleared={rec:recOf(r3),act:actOf(r3),chips:chips('P01'),units:units('P01'),dose:r3._dose===undefined};
    return {before,typed,lvl40,cleared};`),
  expect:{'before.blocks':4,'before.tiles':[12,13,14,15],'before.inputs':['actWaterCm:done cm','actWaterL:done L','actA:done L','actB:done L','actC:done L'],
    'before.rec':{W:566,A:2.8,B:2.8,C:0.14},'before.act':[],'before.units':[],
    'typed.rec':{W:566,A:2.8,B:2.8,C:0.14},'typed.act':{cm:28,L:566,A:2.5,B:2.8,C:0.14},
    'typed.num':['number','number','number','number','number'],'typed.dose':566,'typed.boxes':['28','566','2.5','2.8','0.14'],
    'typed.chips':['0.0 %|ok',MINUS+'10.7 %|ok','0.0 %|ok','0.0 %|ok'],'typed.units':['cm','L'],'typed.stamp':'number','typed.by':'tester','typed.tip':true,
    'lvl40.rec':{W:405,A:2,B:2,C:0.1},'lvl40.act':{cm:28,L:566,A:2.5,B:2.8,C:0.14},'lvl40.chips':['+39.8 %|warn','+25.0 %|warn','+40.0 %|warn','+40.0 %|warn'],
    'lvl40.dose':{gap:20,waterL:405,aCC:2000,cCC:100},
    'cleared.rec':{W:'',A:'',B:'',C:''},'cleared.act':{cm:28,L:566,A:2.5,B:2.8,C:0.14},'cleared.chips':['no rec.|soft','no rec.|soft','no rec.|soft','no rec.|soft'],'cleared.units':['cm','L'],'cleared.dose':true} },

{ name:'💧 cm ↔ litres = the pool-area formula of the dose (L × W × cm ÷ 1000): Pool 1 (238 × 85 cm → 20.23 L per cm) 28 cm → 566 L (whole litres, like the dose) — and Nexi\'s own dose for a 28 cm gap says 566 L; 566 L → 27.98 cm; Pool 7 (150 × 143 cm → 21.45 L per cm) 10 cm → 214.5 → 215 L (rounded like Nexi\'s Math.round), 429 L → 20 cm; emptying one box empties the other; "-1" is refused ("cannot be negative") and "abc" too; a pool with no size converts nothing',
  tz:TZ, seed:SEED,
  run:fn(`const at=(round,id,f,v)=>{window.irrSetPoolTime(round);irrSavePool(id,f,v);};
    at('08:00','P01','actWaterCm','28');at('11:00','P01','actWaterL','566');at('08:00','P07','actWaterCm','10');at('11:00','P07','actWaterL','429');
    const p1=rec('P01'),p1b=rec('P01','11:00'),p7=rec('P07'),p7b=rec('P07','11:00');
    const lpc={P01:hnxIrrAct.litresPerCm('P01'),P07:hnxIrrAct.litresPerCm('P07')};
    const API={cm:hnxIrrAct.conv('P01',{cm:28}),L:hnxIrrAct.conv('P01',{L:566}),nosize:hnxIrrAct.conv({id:'X',dim:{}},{cm:3}),both:hnxIrrAct.conv('P07',{cm:10,L:1})};
    window.irrSetPoolTime('08:00');window.__toasts=[];
    irrSavePool('P01','actA','-1');irrSavePool('P01','actA','abc');const refused={A:rec('P01').actA,toasts:window.__toasts.filter(m=>/negative|Not a number/.test(m))};
    const sameStamp=p1._fieldTimestamps.actWaterCm===p1._fieldTimestamps.actWaterL;
    irrSavePool('P01','actWaterCm','');const emptied={cm:rec('P01').actWaterCm,L:rec('P01').actWaterL};
    return {lpc,nexi:{dose:p1._dose&&p1._dose.waterL,round:Math.round(p1.actWaterL)},p1:[p1.actWaterCm,p1.actWaterL],p1b:[p1b.actWaterCm,p1b.actWaterL],p7:[p7.actWaterCm,p7.actWaterL],p7b:[p7b.actWaterCm,p7b.actWaterL],API,refused,emptied,sameStamp};`),
  expect:{'lpc.P01':20.23,'lpc.P07':21.45,'nexi.dose':566,'nexi.round':566,'p1':[28,566],'p1b':[27.98,566],'p7':[10,215],'p7b':[20,429],
    'API.cm':{cm:28,L:566},'API.L':{cm:27.98,L:566},'API.nosize':null,'API.both':{cm:10,L:215},
    'refused.A':undefined,'refused.toasts':['Actually added cannot be negative - please re-type it','Not a number - please re-type it'],emptied:{cm:'',L:''},sameStamp:true} },

{ name:'🟢🟠 Chip = done vs recommended in %: recommended 6 L / done 7 L → +16.7 % amber; A 3 / 3 → 0.0 % green; B 3 / 2.5 → −16.7 % amber; C 0.2 / 0.2 → 0.0 %; exactly 15 % is still green (20 → 23 L = +15.0 %, B 10 → 8.5 = −15.0 %), 16 % is amber (A 10 → 11.6), nothing added (C 1 → 0) = −100.0 % amber; recommendation but nothing typed = "not confirmed" (soft) ×4 on Pool 4 and typing the Checked By name there still saves; no recommendation = no chip, an amount typed anyway = "no rec."; 2800 typed for 2800 cc (A 2.8 L) is capped to "+999+ %" (the title keeps +99900.0 %); title "Done 7 L, recommended 6 L: +16.7 % - more than 15 % off"',
  tz:TZ, seed:SEED,
  run:fn(`put('P02',{actWaterL:'7',actA:'3',actB:'2.5',actC:'0.2'});put('P03',{actWaterL:'23',actA:'11.6',actB:'8.5',actC:'0'});put('P06',{actA:'2'});
    await redraw();const p4=chips('P04');
    irrSavePool('P04','checkedBy','Joy');await redraw();
    const title=row('P02').querySelector('.irr-act-chip').getAttribute('title'),title4=row('P04').querySelector('.irr-act-chip').getAttribute('title');
    const V=hnxIrrAct.variance;
    return {p2:chips('P02'),p2units:units('P02'),p3:chips('P03'),p4,p4units:units('P04'),p4after:chips('P04'),joy:rec('P04').checkedBy,p5:chips('P05'),p5blocks:row('P05').querySelectorAll('.irr-act').length,p6:chips('P06'),title,title4,
      pure:{cmonly:[V({actWaterCm:3},'water').state,V({actWaterCm:3},'water').text],unconf:V({A:3},'A').state,zeroRec:V({A:0},'A').state,none:V({},'water').state,amber16:V({A:10,actA:11.6},'A').amber,amber15:V({A:10,actA:11.5},'A').amber,big:[V({A:2.8,actA:2800},'A').text,V({A:2.8,actA:2800},'A').title]}};`),
  expect:{p2:['+16.7 %|warn','0.0 %|ok',MINUS+'16.7 %|warn','0.0 %|ok'],p2units:['cm','L'],p4units:[],p3:['+15.0 %|ok','+16.0 %|warn',MINUS+'15.0 %|ok',MINUS+'100.0 %|warn'],
    p4:['not confirmed|soft','not confirmed|soft','not confirmed|soft','not confirmed|soft'],p4after:['not confirmed|soft','not confirmed|soft','not confirmed|soft','not confirmed|soft'],joy:'Joy',
    p5:['-','-','-','-'],p5blocks:4,p6:['-','no rec.|soft','-','-'],
    title:'Done 7 L, recommended 6 L: +16.7 % - more than 15 % off',title4:'Nexi recommends 6 L - nobody has typed what was actually added. Optional: saving is never blocked.',
    pure:{cmonly:['cmonly','size not set'],unconf:'unconfirmed',zeroRec:'',none:'',amber16:true,amber15:false,big:['+999+ %','Done 2800 L, recommended 2.8 L: +99900.0 % - more than 15 % off']}} },

{ name:'💾 A round with actuals survives a real page reload: Pool 1 08:00 typed in the boxes with the keyboard (28 cm, A 2.5, B 2.8) + Tab → after reloading the page the store holds actWaterCm 28, actWaterL 566 (filled by Nexi from the pool area), actA 2.5, actB 2.8 (numbers), both water stamps equal and by "tester", the boxes show 28 / 566 / 2.5 / 2.8, and the chips are back (water 0.0 %, A −10.7 %, B 0.0 %, C: "not confirmed"); Nexi\'s 566 L / A 2.8 are untouched',
  tz:TZ, seed:SEED,
  drive:async pg=>{
    await pg.evaluate(new Function('return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));window.confirm=()=>true;switchView("irr_nutrients");await sleep(900);window.irrSetPoolTime("08:00");renderIrrPoolMonitor();await sleep(1200);})()'));
    for(const [f,v] of [['actWaterCm','28'],['actA','2.5'],['actB','2.8']]){
      const sel='input[onchange*="irrSavePool(\'P01\',\''+f+'\'"]';
      await pg.fill(sel,v);await pg.press(sel,'Tab');await pg.waitForTimeout(900);}
    const saved=await pg.evaluate(()=>{const r=((JSON.parse(localStorage.getItem('hydroPro_irr_pool')||'{}')['2026-10-10']||{}).P01||{})['08:00']||{};return [r.actWaterCm,r.actWaterL,r.actA,r.actB];});
    await pg.reload({waitUntil:'domcontentloaded',timeout:180000});
    await pg.waitForTimeout(23000);
    return {saved};},
  run:fn(`const r=rec('P01'),R=row('P01');
    return {act:[r.actWaterCm,r.actWaterL,r.actA,r.actB,r.actC],num:[r.actWaterCm,r.actWaterL,r.actA,r.actB].map(v=>typeof v),
      stamps:[r._fieldTimestamps.actWaterCm===r._fieldTimestamps.actWaterL,r._fieldTimestamps.actWaterCm>1e12,/^\\d\\d:\\d\\d$/.test(r._fieldTimes.actWaterL),r._fieldTimes.actWaterCm===r._fieldTimes.actWaterL],by:r.updatedBy,
      boxes:[...R.querySelectorAll('.irr-act input')].map(i=>i.value),chips:chips('P01'),nexi:recOf(r)};`),
  expect:{'drive.saved':[28,566,2.5,2.8],act:[28,566,2.5,2.8,null],num:['number','number','number','number'],stamps:[true,true,true,true],by:'tester',
    boxes:['28','566','2.5','2.8',''],chips:['0.0 %|ok',MINUS+'10.7 %|ok','0.0 %|ok','not confirmed|soft'],nexi:{W:566,A:2.8,B:2.8,C:0.14}} },

{ name:'☁ Cloud merge carries the actuals, field by field on their own stamps (both argument orders): a round with actuals + an older cloud copy without → kept and "ahead" (uploads); the other way round → taken; two computers on ONE round — A: 0.35 cm / 7 L / A 3.2 (t 2000), B: B 2.9 / C 0.1 (t 2500) and A 3.5 (t 3000) → 0.35 / 7 / 3.5 / 2.9 / 0.1 with every stamp; a stamped clear of the water boxes (t 4000) beats the older 7 L / 0.35 cm; merging the result again changes nothing',
  tz:TZ, seed:SEED,
  run:fn(`const MI=window.__hnxMergeIrrPool,MG=window.__hnxMergeGeneric,D='${T}';
    const R=(o)=>({[D]:{P01:{'08:00':o}}});const j=JSON.stringify;
    const recA={water:'50',EC:'1.7',actWaterCm:0.35,actWaterL:7,actA:3.2,_fieldTimes:{actWaterL:'09:00'},_fieldTimestamps:{water:1000,EC:1000,actWaterCm:2000,actWaterL:2000,actA:2000},updatedAt:2000,updatedBy:'a'};
    const recB={water:'50',EC:'1.7',actA:3.5,actB:2.9,actC:0.1,_fieldTimestamps:{water:1000,EC:1000,actA:3000,actB:2500,actC:2500},updatedAt:3000,updatedBy:'b'};
    const old={water:'50',EC:'1.7',_fieldTimestamps:{water:1000,EC:1000},updatedAt:1000};
    const pick=raw=>{const r=JSON.parse(raw)[D].P01['08:00'];return {a:[r.actWaterCm,r.actWaterL,r.actA,r.actB,r.actC],st:[r._fieldTimestamps.actWaterL,r._fieldTimestamps.actA,r._fieldTimestamps.actB,r._fieldTimestamps.actC],ft:r._fieldTimes&&r._fieldTimes.actWaterL};};
    /* out = null means "the merged copy is the local copy" - then the local copy is the result */
    const merge=(l,r)=>{const m=MI(j(R(l)),j(R(r)));return {raw:m.out||j(R(l)),ahead:m.localAhead,same:m.out===null};};
    const kept=merge(recA,old);const taken=MG('hydroPro_irr_pool',j(R(old)),j(R(recA)));
    const ab=merge(recA,recB),ba=merge(recB,recA);
    const clearB=Object.assign({},recB,{actWaterCm:'',actWaterL:'',_fieldTimestamps:Object.assign({},recB._fieldTimestamps,{actWaterCm:4000,actWaterL:4000}),updatedAt:4000});
    const c1=merge(recA,clearB),c2=merge(clearB,recA);
    const again=MI(ab.raw,ab.raw);
    return {keptAhead:kept.ahead,kept:pick(kept.raw).a,taken:pick(taken||j(R(recA))).a,
      ab:pick(ab.raw),ba:pick(ba.raw),abAhead:ab.ahead,
      cleared:[pick(c1.raw).a,pick(c2.raw).a],again:{out:again.out,ahead:again.localAhead}};`),
  expect:{keptAhead:true,kept:[0.35,7,3.2,null,null],taken:[0.35,7,3.2,null,null],
    ab:{a:[0.35,7,3.5,2.9,0.1],st:[2000,3000,2500,2500],ft:'09:00'},ba:{a:[0.35,7,3.5,2.9,0.1],st:[2000,3000,2500,2500],ft:'09:00'},abAhead:true,
    cleared:[['','',3.5,2.9,0.1],['','',3.5,2.9,0.1]],again:{out:null,ahead:false}} },

{ name:'🧱 A record WITHOUT actuals renders exactly as before: the HTML of the four boxes (Water Added, A, B, C) of Pool 1 (32 cm, EC 1.7, old rich record, + its "Nexi says" / drawing cell) and of Pool 2 (typed recommendation 6 / 3 / 3 / 0.2), minus the new "Actually added" block, hashes to the values taken from the page before this change — and is identical with the block switched off; rendering writes none of the five new fields; "Nexi says" still reads "Add 566 L pure water · A 2800 cc · B 2800 cc · C 140 cc"',
  tz:TZ, seed:SEED,
  run:fn(`const mk=async()=>({p1:await tiles('P01',[12,13,14,15,17]),p2:await tiles('P02',[12,13,14,15])});
    const withBox=await mk();
    const acts=[row('P01').querySelectorAll('.irr-act').length,row('P02').querySelectorAll('.irr-act').length];
    const written=[rec('P01'),rec('P02')].map(r=>Object.keys(r).filter(k=>/^act/.test(k)).length);
    const says=(row('P01').querySelector('.irr-nexi-says')||{}).textContent;
    const keep=window.hnxIrrActBox;window.hnxIrrActBox=()=>'';await redraw();const without=await mk();const offActs=row('P01').querySelectorAll('.irr-act').length;window.hnxIrrActBox=keep;
    return {p1:withBox.p1,p2:withBox.p2,acts,written,says,sameAsOff:JSON.stringify(withBox)===JSON.stringify(without),offActs};`),
  expect:{p1:{12:'79a49793814d6cae',13:'0e3f5249ef9ff8cd',14:'16c472e71c7fbf3f',15:'d20902ed6c72b414',17:'cc23caa1fef00d35'},p2:{12:'91169eaacabff413',13:'230ff814591fd4a5',14:'7ed3dda94213ae88',15:'9d8814ba1d0d4bcb'},
    acts:[4,4],written:[0,0],says:'💡 Nexi says: Add 566 L pure water · A 2800 cc · B 2800 cc · C 140 cc',sameAsOff:true,offActs:0} },

{ name:'📤 Exports carry the new columns LAST: 📒 Readings Report CSV = the old 25 columns (…, Saved at, Saved by, Out of range, Worked out by Nexi) + "Actually added water cm / water L / A L / B L / C L" — Pool 1 (28 cm = 566 L, A 3.5, B 2.8, C 0.14) ends 28,566,3.5,2.8,0.14 with the first 21 values unchanged, Pool 2 (no actuals) is exactly its old line + 5 empty columns; the report screen has the same 5 columns after "Saved at" (A 3.5 vs 2.8 = +25.0 % orange with its title, B plain), a not-entered round spans 21 columns, a round with ONLY an amount typed (Pool 9, A 1.5) counts as entered; the Pool Monitor 📊 Export ends …,"Remarks","Actually added water (cm)",…,"Actually added C (L)" with Pool 1 "28","566","3.5","2.8","0.14" and Pool 2 five ""',
  tz:TZ, seed:SEED,
  run:fn(`put('P01',{actWaterCm:'28',actA:'3.5',actB:'2.8',actC:'0.14'});put('P09',{actA:'1.5'});await sleep(400);
    const csv=t=>t.split('\\n').map(l=>{const o=[];let cur='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}else if(ch==='"')q=true;else if(ch===','){o.push(cur);cur='';}else cur+=ch;}o.push(cur);return o;});
    const raw=hnxIrrReadingsCsv({from:T,to:T,pools:['P01','P02']}),rows=csv(raw),rawLines=raw.split('\\n');
    const p1=rows.find(r=>r[0]==='Pool 1'&&r[3]===T&&r[4]==='08:00'),p2=rows.find(r=>r[0]==='Pool 2'&&r[3]===T&&r[4]==='08:00');
    let blob=null;const oc=URL.createObjectURL,oa=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{blob=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};
    try{irrExportPoolMonitor();}finally{URL.createObjectURL=oc;HTMLAnchorElement.prototype.click=oa;}
    const pm=csv(blob?await blob.text():''),pmP1=pm.find(r=>r[1]==='Pool 1'&&r[2]==='08:00'),pmP2=pm.find(r=>r[1]==='Pool 2'&&r[2]==='08:00');
    switchView('irr_readings');await sleep(900);hnxIrrReadings.setPeriod('today');await sleep(300);
    const sec=id=>document.querySelector('#irrReadingsBody .hnx-rr-sec[data-pool="'+id+'"]');
    const r08=s=>s.querySelector('tbody tr[data-date="'+T+'"][data-round="08:00"]');
    const s1=sec('P01'),tr1=r08(s1),cell=(tr,f)=>tr.querySelector('td[data-f="'+f+'"]');
    const s9=sec('P09'),tr9=r08(s9);
    const chip9=s9.querySelector('.hnx-rr-chip[data-k="rounds"]').textContent.replace(/ of \\d+$/,' of N');
    hnxIrrReadings.setPeriod('yesterday');await sleep(300); /* every round of a past day is due, at any hour: a not-entered row always exists there */
    const miss=sec('P05').querySelector('tbody tr.hnx-rr-missing td.hnx-rr-miss');
    return {head:rows[0].slice(20),n:rows[0].length,p1first:p1.slice(0,21),p1by:p1.slice(22,25),p1act:p1.slice(25),p2line:rawLines.find(l=>l.indexOf('Pool 2,Room 1&2,GH2,'+T+',08:00,')===0),
      pmHead:pm[0].slice(12),pmP1:pmP1.slice(11),pmP2:pmP2.slice(11),
      ths:[...s1.querySelectorAll('thead th')].slice(-6).map(x=>x.textContent),tdOrder:[...tr1.children].slice(-6).map(x=>x.getAttribute('data-f')),
      tds:['actWaterCm','actWaterL','actA','actB','actC'].map(f=>cell(tr1,f).textContent),warn:['actWaterL','actA','actB'].map(f=>cell(tr1,f).classList.contains('rr-warn')),
      warnTitle:cell(tr1,'actA').getAttribute('title'),colspan:miss&&miss.getAttribute('colspan'),
      p9:{entered:!tr9.classList.contains('hnx-rr-missing'),a:cell(tr9,'actA').textContent,chip:chip9}};`),
  expect:{head:['Checked by','Saved at','Saved by','Out of range','Worked out by Nexi','Actually added water cm','Actually added water L','Actually added A L','Actually added B L','Actually added C L'],n:30,
    p1first:['Pool 1','Room 1&2','GH1','2026-10-10','08:00','entered','08:20','1.7','1.7','6.2','6.2','32','24.5','working','55','pure','566','2.8','2.8','0.14','Reven'],
    p1by:['tester','','water added, A, B, C'],p1act:['28','566','3.5','2.8','0.14'],p2line:OLD_P2+',,,,,',
    pmHead:['Remarks','Actually added water (cm)','Actually added water (L)','Actually added A (L)','Actually added B (L)','Actually added C (L)'],
    pmP1:['Reven','','28','566','3.5','2.8','0.14'],pmP2:['','','','','','',''],
    ths:['Saved at','Actually added water cm','Actually added water L','Actually added A L','Actually added B L','Actually added C L'],
    tdOrder:['saved','actWaterCm','actWaterL','actA','actB','actC'],tds:['28','566','3.5','2.8','0.14'],warn:[false,true,false],
    warnTitle:'Done 3.5 L, recommended 2.8 L: +25.0 % - more than 15 % off',colspan:'21',p9:{entered:true,a:'1.5',chip:'Rounds entered 1 of N'}} },

{ name:'▦ The boxes fit the card layout at 1512×982 WITHOUT making it taller (Eyal 10 Oct: "so much empty space which I don\'t want" — the v22.46 limits of the card are not touched): Pool 1 with actuals and Pool 2 with only recommendations — the card and every one of its 17 tiles are exactly as tall as with the "Actually added" blocks switched off (±1 px), the 4 blocks, their 5 inputs and the chips are visible and inside their tile, every tile inside the card, no sideways scroll; the soft "not confirmed" chip steps aside while the box has the cursor; "☰ Table" keeps the same 4 blocks in the same cells and "▦ One card per pool" brings the cards back',
  tz:TZ, viewport:{width:1512,height:982}, seed:SEED,
  run:fn(`put('P01',{actWaterCm:'28',actA:'2.5',actB:'2.8',actC:'0.14'});await redraw();
    const geo=()=>{const c=row('P01'),bl=[...c.querySelectorAll('.irr-act')],w=host().querySelector('.irr-pool-table-wrap');
      return {cards:w.classList.contains('irr-pc'),n:bl.length,visible:bl.every(b=>b.offsetParent!==null),inTile:bl.every(b=>inside(b,b.closest('td'))),tilesIn:[...c.children].every(td=>inside(td,c)),
        inputs:[...c.querySelectorAll('.irr-act input')].filter(i=>i.offsetParent!==null&&i.getBoundingClientRect().width>=24).length,chips:[...c.querySelectorAll('.irr-act-chip')].filter(x=>x.offsetParent!==null).length,
        cells:[...c.children].map((td,i)=>td.querySelector('.irr-act')?i+1:0).filter(Boolean),extra:Math.max(0,w.scrollWidth-w.clientWidth),page:Math.max(0,document.documentElement.scrollWidth-innerWidth)<=1};};
    const sizes=()=>['P01','P02'].map(id=>{const c=row(id);return [c.getBoundingClientRect().height].concat([...c.children].map(td=>td.getBoundingClientRect().height));});
    const cards=geo(),withBox=sizes();
    const c4=row('P02').querySelector('.irr-act[data-act="C"]'),chip=c4.querySelector('.irr-act-chip'),inp=c4.querySelector('input');
    const idle=getComputedStyle(chip).opacity;inp.focus();await sleep(100);const focused=getComputedStyle(chip).opacity;inp.blur();await sleep(100);const after=getComputedStyle(chip).opacity;
    const keep=window.hnxIrrActBox;window.hnxIrrActBox=()=>'';await redraw();const off=sizes();const offActs=row('P01').querySelectorAll('.irr-act').length;window.hnxIrrActBox=keep;await redraw();
    hnxIrrLayout('table');await sleep(700);const table=geo();hnxIrrLayout('cards');await sleep(700);const back=geo();
    const diff=Math.max.apply(null,[].concat.apply([],withBox.map((r,i)=>r.map((h,j)=>Math.abs(h-off[i][j])))));
    return {cards:{cards:cards.cards,n:cards.n,visible:cards.visible,inTile:cards.inTile,tilesIn:cards.tilesIn,inputs:cards.inputs,chips:cards.chips,cells:cards.cells,extra:cards.extra,page:cards.page},
      table:{cards:table.cards,n:table.n,cells:table.cells},back:{cards:back.cards,n:back.n},tiles:[withBox[0].length,withBox[1].length],sameSize:diff<=1,offActs,chipOpacity:[idle,focused,after]};`),
  expect:{cards:{cards:true,n:4,visible:true,inTile:true,tilesIn:true,inputs:5,chips:4,cells:[12,13,14,15],extra:0,page:true},table:{cards:false,n:4,cells:[12,13,14,15]},back:{cards:true,n:4},tiles:[18,18],sameSize:true,offActs:0,chipOpacity:['1','0','1']} },

{ name:'📱 The boxes fit a 390 px phone: 0 px sideways scroll (frame and page), Pool 1 with actuals — every tile inside its card, every block inside its tile, the 5 inputs wide enough to type in (≥ 24 px)',
  tz:TZ, viewport:{width:390,height:844}, seed:SEED,
  run:fn(`put('P01',{actWaterCm:'28',actA:'2.5',actB:'2.8',actC:'0.14'});await redraw();
    const c=row('P01'),bl=[...c.querySelectorAll('.irr-act')],w=host().querySelector('.irr-pool-table-wrap');
    return {extra:Math.max(0,w.scrollWidth-w.clientWidth),page:Math.max(0,document.documentElement.scrollWidth-innerWidth)<=1,n:bl.length,inTile:bl.every(b=>inside(b,b.closest('td'))),tilesIn:[...c.children].every(td=>inside(td,c)),
      inputs:[...c.querySelectorAll('.irr-act input')].filter(i=>i.offsetParent!==null&&i.getBoundingClientRect().width>=24).length};`),
  expect:{extra:0,page:true,n:4,inTile:true,tilesIn:true,inputs:5} },

{ name:'📝 The "✓ Saved …" line names the new boxes ("Pool 1 · A actually added 2.5 L (08:00 round)"); the Help centre guide Irrigation has the new section "Actually added — what was really poured" (cm or litres, the 15 % chip, "not confirmed", the five last columns) and its Readings Report paragraph mentions the five columns; the guide stays read-only (no download link, copy still blocked)',
  tz:TZ, seed:SEED,
  run:fn(`irrSavePool('P01','actA','2.5');
    const state=irrSaveStateText().replace(/Saved \\d\\d:\\d\\d/,'Saved hh:mm');
    const g=HNX_HELP_GUIDES.find(x=>x.id==='m_irrigation'),sec=g.sections.find(s=>/Actually added/.test(s.h)),rr=g.sections.find(s=>/Readings Report/.test(s.h));
    HNX_HELP.open('m_irrigation');await sleep(600);
    const ov=document.getElementById('hnxhOv'),txt=ov.textContent;
    const out={state,sec:!!sec,secText:!!sec&&/centimetres OR the litres/.test(sec.p[1])&&/more than 15 %/.test(sec.p[2])&&/not confirmed/.test(sec.p[2])&&/very end/.test(sec.p[4]),rr:/five columns with what was actually added/.test(rr.p[0]),
      shown:/Actually added — what was really poured/.test(txt),dl:ov.querySelectorAll('a[download]').length,
      copyBlocked:(()=>{const b=ov.querySelector('.hnxh-body');const ev=new Event('copy',{bubbles:true,cancelable:true});b.dispatchEvent(ev);return ev.defaultPrevented;})()};
    HNX_HELP.close();return out;`),
  expect:{state:'✓ Saved hh:mm by tester — Pool 1 · A actually added 2.5 L (08:00 round)',sec:true,secText:true,rr:true,shown:true,dl:0,copyBlocked:true} },
];
