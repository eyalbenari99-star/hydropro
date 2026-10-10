/* v22.30 Irrigation Matrix inline edit (Eyal, 10 Oct 2026: "No save bottom" — screenshot of the matrix with the storage-rescue text
   over it). The matrix editor has a visible 💾 Save, a round picker on the round of the CLOCK, and saves through irrSavePool.
   Clock: the seed replaces window.Date BEFORE the app loads with a clock shifted to a fixed instant (same trick as SHIFT_DATE in
   irr-pool-hotfix.test.js) and the page runs in Asia/Manila (t.tz). */
const CLOCK_AND_STORE=(isoUtc,store,extra)=>new Function(
  `const RD=Date;const off=RD.parse(${JSON.stringify(isoUtc)})-RD.now();
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();
    return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;
  window.__hnxPulledOk=true;
  localStorage.setItem('hydroPro_irr_pool',${JSON.stringify(JSON.stringify(store))});${extra||''}`);
const D='2026-10-10';
const NEW='typeof window.irrSaveStateText==="function"';
const DOSE_54_EC1={v:'22.20',gap:6,waterL:121,ec:1,ph:'',row:'1.50',factor:1,aCC:2100,bCC:2100,cCC:30,ecHigh:false,calibrate:'',note:'',target:60,mode:'matrix'};
const STORE={[D]:{
  P01:{'08:00':{water:'50',EC:'1.7',updatedAt:1},
       '11:00':{water:'54',EC:'1',waterAdded:121,A:2.1,B:2.1,C:0.03,_autoFilled:{waterAdded:true,A:true,B:true,C:true},_dose:DOSE_54_EC1,updatedAt:2}},
  P02:{'08:00':{water:'45',EC:'1.7',updatedAt:1},'11:00':{water:'47',EC:'1.75',updatedAt:2}}}};
/* page helpers: open the matrix, click a cell, type, then 💾 / Enter / click away */
const H=`window.showToast=(m)=>{(window.__toasts=window.__toasts||[]).push(String(m));};window.confirm=()=>true;
  const openMatrix=async()=>{switchView('irr_matrix');for(let i=0;i<30&&!document.querySelector('#irrMatrixBody td[data-edit-pool]');i++)await sleep(200);};
  const cellOf=(pid,f,root)=>document.querySelector((root||'#irrMatrixBody')+' td[data-edit-pool="'+pid+'"][data-edit-field="'+f+'"]');
  const typeIn=(td,val)=>{const inp=td&&td.querySelector('.irr-mx-ed input');if(!inp)return null;inp.value=String(val);inp.dispatchEvent(new Event('input',{bubbles:true}));return inp;};
  const editCell=async(pid,f,val,how,root)=>{const td=cellOf(pid,f,root);if(!td)return 'no cell';td.click();
    const inp=typeIn(td,val);if(!inp)return 'no input';
    if(how==='away'){inp.blur();await sleep(150);}
    else if(how==='enter')inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    else td.querySelector('.irr-mx-save').click();
    await sleep(120);return 'ok';};
  const pool=pid=>{try{delete window._perfCache._irrPool;}catch(e){}return (loadIrrPool()['${D}']||{})[pid]||{};};
  const pick=r=>r?{water:r.water===undefined?null:r.water,EC:r.EC===undefined?null:r.EC}:null;`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
module.exports=[
{ name:'📋 Matrix edit at 14:30 Manila: Pool 1 has 08:00 (50 cm) and 11:00 (54 cm) → the editor opens on the 14:00 round; 40 + 💾 Save files 40 cm in 14:00, 11:00 stays 54, 08:00 stays 50, Pool 2 untouched; the message names the 14:00 round and the cell shows ✓ saved',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-10T06:30:00Z',STORE),
  run:fn(`await openMatrix();const clock={local:hnxLocalToday(),hh:new Date().getHours(),matrixDate:(document.getElementById('irrMatrixDateInput')||{}).value};
    const td0=cellOf('P01','water');td0.click();const sel=td0.querySelector('.irr-mx-ed select');const opened={round:sel&&sel.value,prefill:(td0.querySelector('.irr-mx-ed input')||{}).value,save:!!td0.querySelector('.irr-mx-save')};
    typeIn(td0,'40');td0.querySelector('.irr-mx-save').click();await sleep(900);
    const p1=pool('P01'),p2=pool('P02');const td=cellOf('P01','water');
    return {clock,opened,rounds:Object.keys(p1).filter(t=>String((p1[t]||{}).water)==='40'),r08:pick(p1['08:00']),r11:pick(p1['11:00']),r14:pick(p1['14:00']),
      p2:{r08:pick(p2['08:00']),r11:pick(p2['11:00']),r14:p2['14:00']||null},toast:(window.__toasts||[]).find(m=>/saved in the/.test(m))||'',
      editorLeft:!!document.querySelector('.irr-mx-ed'),badge:td?((td.querySelector('.irr-mx-saved')||{}).textContent||'').replace(/\\d\\d:\\d\\d ·/,'hh:mm ·'):'no cell',
      state:((document.querySelector('#irrMatrixBody .irr-save-state')||{}).textContent||'').replace(/Saved \\d\\d:\\d\\d by \\S+/,'Saved hh:mm by X')};`),
  expect:{clock:{local:D,hh:14,matrixDate:D},opened:{round:'14:00',prefill:'',save:true},rounds:['14:00'],r08:{water:'50',EC:'1.7'},r11:{water:'54',EC:'1'},r14:{water:'40',EC:null},
    p2:{r08:{water:'45',EC:'1.7'},r11:{water:'47',EC:'1.75'},r14:null},toast:'✓ Pool 1 · Water level 40 cm saved in the 14:00 round',
    editorLeft:false,badge:'✓ saved hh:mm · 14:00',state:'✓ Saved hh:mm by X — Pool 1 · Water level 40 cm (14:00 round)'} },

{ name:'💧 Matrix water edit recomputes the dose like the Pool Monitor: 12:30 (round 11:00), Pool 1 11:00 54 cm / EC 1 (gap 6 → 121 L, A 2.1 L) → matrix water 40 + click away → 11:00 water 40, dose gap 20 → 405 L, A/B 6300 cc (6.3 L), C 100 cc (0.1 L), Water Added 405; "Nexi says" Add 405 L pure water · A 6300 cc · B 6300 cc · C 100 cc',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',STORE),
  run:fn(`await openMatrix();const how=await editCell('P01','water','40','away');await sleep(400);const r=pool('P01')['11:00']||{};const d=r._dose||{};
    const P=IRR_POOLS.find(p=>p.id==='P01');
    return {how,water:r.water,dose:{v:d.v,gap:d.gap,waterL:d.waterL,aCC:d.aCC,bCC:d.bCC,cCC:d.cCC},fill:{W:r.waterAdded,A:r.A,B:r.B,C:r.C},instr:irrInstruction(P,r),
      by:r.updatedBy,fieldTime:!!(r._fieldTimes&&r._fieldTimes.water)};`),
  expect:{how:'ok',water:'40',dose:{v:'22.20',gap:20,waterL:405,aCC:6300,bCC:6300,cCC:100},fill:{W:405,A:6.3,B:6.3,C:0.1},
    instr:'Add 405 L pure water · A 6300 cc · B 6300 cc · C 100 cc',by:'tester',fieldTime:true} },

{ name:'🔢 Matrix refuses "1,8" for Pool 2 EC (12:30, 11:00 holds 1.75): nothing saved, the box stays open with "Use a dot, not a comma: 1.8"; then 1.8 + Enter saves 1.8 in 11:00',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',STORE),
  run:fn(`await openMatrix();const td=cellOf('P02','EC');td.click();const prefill=(td.querySelector('.irr-mx-ed input')||{}).value;typeIn(td,'1,8');td.querySelector('.irr-mx-save').click();await sleep(300);
    const after1={EC:pool('P02')['11:00'].EC,open:!!td.querySelector('.irr-mx-ed'),msg:(td.querySelector('.irr-mx-msg')||{}).textContent};
    const inp=typeIn(td,'1.8');inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await sleep(700);
    return {prefill,after1,EC:pool('P02')['11:00'].EC,open:!!document.querySelector('.irr-mx-ed')};`),
  expect:{prefill:'1.75',after1:{EC:'1.75',open:true,msg:'Use a dot, not a comma: 1.8'},EC:'1.8',open:false} },

{ name:'🗓 A past day in the matrix is read-only: on 2026-10-09 no cell is editable and a forced edit opens nothing; store unchanged',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',Object.assign({'2026-10-09':{P01:{'16:00':{water:'58',EC:'1.8',updatedAt:1}}}},STORE)),
  run:fn(`await openMatrix();setIrrMatrixViewDate('2026-10-09');await sleep(400);const editable=document.querySelectorAll('#irrMatrixBody td[data-edit-pool]').length;
    const fake=document.createElement('td');fake.setAttribute('data-edit-pool','P01');fake.setAttribute('data-edit-field','water');document.body.appendChild(fake);_irrMatrixEditCell(fake);
    const opened=!!fake.querySelector('.irr-mx-ed');fake.remove();try{delete window._perfCache._irrPool;}catch(e){}
    return {date:(document.getElementById('irrMatrixDateInput')||{}).value,editable,opened,y:((loadIrrPool()['2026-10-09']||{}).P01||{})['16:00'].water,toast:(window.__toasts||[]).some(m=>/read-only/.test(m))};`),
  expect:{date:'2026-10-09',editable:0,opened:false,y:'58',toast:true} },

{ name:'🌅 Matrix before 08:00 Manila (07:40 = 23:40 UTC the day before): the matrix opens on the LOCAL day 2026-10-10, the editor is on 08:00, and Pool 1 water 52 lands under 2026-10-10 08:00, nothing under 2026-10-09',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-09T23:40:00Z',{}),
  run:fn(`await openMatrix();const date=(document.getElementById('irrMatrixDateInput')||{}).value;const td=cellOf('P01','water');td.click();const round=(td.querySelector('.irr-mx-ed select')||{}).value;
    typeIn(td,'52');td.querySelector('.irr-mx-save').click();await sleep(300);
    try{delete window._perfCache._irrPool;}catch(e){}const all=loadIrrPool();
    return {local:hnxLocalToday(),date,round,keys:Object.keys(all).sort(),rounds:Object.keys((all['${D}']||{}).P01||{}),water:(((all['${D}']||{}).P01||{})['08:00']||{}).water};`),
  expect:{local:D,date:D,round:'08:00',keys:[D],rounds:['08:00'],water:'52'} },

{ name:'🧩 Matrix under the Pool Monitor: Pool 2 water 46 + Enter saves 46 in 11:00 (12:30) and the cell shows 46cm again; a SECOND edit there (Pool 2 EC 1.8) saves too — it used to leave a dead input that ignored every further edit',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',STORE),
  run:fn(`switchView('irr_nutrients');for(let i=0;i<30&&!document.querySelector('#irrMatrixEmbed td[data-edit-pool]');i++)await sleep(200);
    const how=await editCell('P02','water','46','enter','#irrMatrixEmbed');await sleep(900);const td=cellOf('P02','water','#irrMatrixEmbed');
    const first={saved:(pool('P02')['11:00']||{}).water,inputLeft:!!document.querySelector('#irrMatrixEmbed .irr-mx-ed'),shows:td?/46cm/.test(td.innerText):false};
    const how2=await editCell('P02','EC','1.8','button','#irrMatrixEmbed');await sleep(900);
    return {how,first,how2,EC:(pool('P02')['11:00']||{}).EC,inputLeft:!!document.querySelector('#irrMatrixEmbed .irr-mx-ed')};`),
  expect:{how:'ok',first:{saved:'46',inputLeft:false,shows:true},how2:'ok',EC:'1.8',inputLeft:false} },

{ name:'↔ Moving from cell to cell keeps both: Pool 1 water 41, then a click on Pool 2 water saves 41 AND leaves Pool 2 open (not wiped by the redraw); 44 + 💾 saves Pool 2 — both in 11:00 at 12:30',
  tz:'Asia/Manila', requires:NEW, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',STORE),
  run:fn(`await openMatrix();const a=cellOf('P01','water');a.click();typeIn(a,'41');const b=cellOf('P02','water');b.click();await sleep(800);
    const b2=cellOf('P02','water');const stillOpen=!!(b2&&b2.querySelector('.irr-mx-ed'));const p1=(pool('P01')['11:00']||{}).water;
    if(b2)typeIn(b2,'44');if(b2&&b2.querySelector('.irr-mx-save'))b2.querySelector('.irr-mx-save').click();await sleep(800);
    return {p1,stillOpen,p2:(pool('P02')['11:00']||{}).water,open:document.querySelectorAll('.irr-mx-ed').length};`),
  expect:{p1:'41',stillOpen:true,p2:'44',open:0} },

{ name:'🚑 An automatic storage rescue puts nothing on screen (quota / deferred / timer) and writes the owner inbox (2 notes) at most once a day; 🚑 Clean this computer now shows "🧹 This computer was cleaned"; a message stays its full duration (6 s) and is at most one card wide',
  tz:'Asia/Manila', requires:NEW,
  run:fn(`const T=[];window.showToast=(m)=>T.push(String(m));const inbox=()=>(JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]')||[]).filter(x=>x.itemId==='storage').length;
    const i0=inbox();const r1=window.__hnxStorageRescue('quota');const i1=inbox();const auto=T.length;
    const r2=window.hnxStorageRescue();const i2=inbox();const manual=T.slice(auto).join('|');
    delete window.showToast;const t=document.getElementById('toast');showToast('long message','ok',6000);await sleep(3500);const at35=t.classList.contains('show');await sleep(3000);const at65=t.classList.contains('show');
    return {ran:!!(r1&&!r1.skipped),auto,inbox1:i1-i0,inbox2:i2-i1,manual:/^🧹 This computer was cleaned — storage \\d+% → \\d+%$/.test(manual),at35,at65,maxW:getComputedStyle(t).maxWidth!=='none'};`),
  expect:{ran:true,auto:0,inbox1:2,inbox2:0,manual:true,at35:true,at65:false,maxW:true} }
];
module.exports.push(
{ name:'⌨ Real mouse + keyboard at 1366×768: click Pool 2 water level, type 44 over the selected 47, click 💾 Save with the mouse → 44 stored in the current round (11:00 at 12:30), the cell shows 44cm and ✓ saved',
  tz:'Asia/Manila', requires:NEW, viewport:{width:1366,height:768}, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',STORE),
  drive:async pg=>{
    await pg.evaluate(()=>{window.showToast=()=>{};switchView('irr_matrix');});
    const sel='#irrMatrixBody td[data-edit-pool="P02"][data-edit-field="water"]';
    await pg.waitForSelector(sel,{timeout:10000});
    let clickErr='';try{await pg.locator(sel).click({timeout:5000});}catch(e){clickErr=String(e.message).split('\n')[0].slice(0,160);}
    const focused=await pg.evaluate(()=>!!(document.activeElement&&document.activeElement.tagName==='INPUT'&&document.activeElement.closest('.irr-mx-ed')));
    await pg.keyboard.type('44');
    let saveErr='';try{await pg.locator(sel+' .irr-mx-save').click({timeout:5000});}catch(e){saveErr=String(e.message).split('\n')[0].slice(0,160);}
    await pg.waitForTimeout(900);
    return pg.evaluate(()=>{try{delete window._perfCache._irrPool;}catch(e){}const r=((loadIrrPool()['2026-10-10']||{}).P02||{});
      const td=document.querySelector('#irrMatrixBody td[data-edit-pool="P02"][data-edit-field="water"]');
      return {r11:(r['11:00']||{}).water,shows:td?/44cm/.test(td.innerText):false,badge:!!(td&&td.querySelector('.irr-mx-saved'))};}).then(o=>Object.assign(o,{clickErr,saveErr,focused}));
  },
  expect:{'drive.clickErr':'','drive.saveErr':'','drive.focused':true,'drive.r11':'44','drive.shows':true,'drive.badge':true} },
{ name:'🏊 Pool Monitor 💾 Save (real mouse): type Pool 1 EC 1.82 in the 08:00 round and click 💾 Save without pressing Tab → 1.82 saved, the message and the "✓ Saved" line name Pool 1 · EC 1.82 (08:00 round)',
  tz:'Asia/Manila', requires:NEW, viewport:{width:1366,height:768}, seed:CLOCK_AND_STORE('2026-10-10T04:30:00Z',STORE),
  drive:async pg=>{
    await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));window.__toasts=[];window.showToast=(m)=>window.__toasts.push(String(m));
      switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);});
    const inp='#stubIrrNutrientsBody input[onchange^="irrSavePool(\'P01\',\'EC\'"]';
    let err='';try{await pg.locator(inp).click({timeout:5000});await pg.keyboard.press('Control+A');await pg.keyboard.type('1.82');
      await pg.locator('#stubIrrNutrientsBody button:has-text("💾 Save")').click({timeout:5000});}catch(e){err=String(e.message).split('\n')[0].slice(0,160);}
    await pg.waitForTimeout(700);
    return pg.evaluate(()=>{try{delete window._perfCache._irrPool;}catch(e){}const r=(((loadIrrPool()['2026-10-10']||{}).P01||{})['08:00'])||{};
      const line=(document.querySelector('#stubIrrNutrientsBody .irr-save-state')||{}).textContent||'';
      return {EC:r.EC,toast:(window.__toasts||[]).filter(m=>/Saved/.test(m)).map(m=>m.replace(/Saved \d\d:\d\d by \S+/,'Saved hh:mm by X')).pop()||'',
        line:line.replace(/Saved \d\d:\d\d by \S+/,'Saved hh:mm by X')};}).then(o=>Object.assign(o,{err}));
  },
  expect:{'drive.err':'','drive.EC':'1.82','drive.toast':'✓ Saved hh:mm by X — Pool 1 · EC 1.82 (08:00 round)','drive.line':'✓ Saved hh:mm by X — Pool 1 · EC 1.82 (08:00 round)'} });
