/* v22.20 irrigation pool monitor hotfix (Eyal, 9 Oct 2026: "why irrigation there is bugs can't insert input and save and Nexi didn't
   recommend what to add as i guid matrix before" + "Target cm wrong. That's when cleaning, not daily.").
   Keyboard cases type with the real keyboard (t.drive), the others call the app in the page. */
const OPEN=`window.showToast=(m)=>{(window.__toasts=window.__toasts||[]).push(String(m));};switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);`;
const fn=body=>new Function('return (async()=>{const CLOSED=c=>{try{if(typeof window.isCallClosed==="function")return window.isCallClosed(c);}catch(e){}return !!(c&&(c.closedAt||String(c.status||"").indexOf("closed")===0));};'+body+'})();');
async function openPool(pg){
  await pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    window.showToast=(m)=>{(window.__toasts=window.__toasts||[]).push(String(m));};
    switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
    window.__saves=[];const o=window.irrSavePool;window.irrSavePool=function(){window.__saves.push([].slice.call(arguments,0,3));return o.apply(this,arguments);};
    window.__renders=0;new MutationObserver(()=>{window.__renders++;}).observe(document.getElementById('stubIrrNutrientsBody'),{childList:true});
    window.__c0={iss:(loadIssues()||[]).filter(i=>i.module==='irrigation').length,tasks:(loadMaintTasks()||[]).filter(t=>t.category==='auto_pool_sensor').length,calls:(loadCalls()||[]).filter(c=>c.sourceModule==='irr_pools').length};
  });
  await pg.waitForTimeout(400);
}
const STATE=`(()=>{const r=((loadIrrPool()[_irrDate]||{})[P]||{})[_irrCurrentPoolTime]||{};const ae=document.activeElement;
  const c0=window.__c0||{iss:0,tasks:0,calls:0};
  return {EC:r.EC===undefined?null:r.EC,manualEC:r.manualEC===undefined?null:r.manualEC,
    focus:ae&&ae.getAttribute?String(ae.getAttribute('onchange')||ae.tagName):'',crit:!!(ae&&/critical/.test(String(ae.className||''))),
    issues:(loadIssues()||[]).filter(i=>i.module==='irrigation').length-c0.iss,tasks:(loadMaintTasks()||[]).filter(t=>t.category==='auto_pool_sensor').length-c0.tasks,
    calls:(loadCalls()||[]).filter(c=>c.sourceModule==='irr_pools').length-c0.calls,
    saves:(window.__saves||[]).filter(s=>s[0]===P).map(s=>s[1]+'='+s[2]),view:window.currentView};})()`;
const st=(pg,P)=>pg.evaluate('(()=>{const P='+JSON.stringify(P)+';return '+STATE+';})()');
const rowSel=i=>`#stubIrrNutrientsBody tbody tr:not(.irr-nexi-row) >> nth=${i}`;
/* seed: a Date shifted to 2026-10-08 23:40 UTC = 07:40 on 9 Oct in Manila */
const SHIFT_DATE=function(){const RD=Date;const off=RD.UTC(2026,9,8,23,40,0)-RD.now();
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;};
/* in-page mock of the hnx-sync worker (whole-key replace on push, like the real one) */
const CLOUD=function(firstDelayMs,cloudInit){
  return 'localStorage.setItem("hnx_cloud_token","t");window.__pushes=[];window.__pulls=0;window.__cloud='+JSON.stringify(cloudInit||{})+';'
   +'const of=window.fetch;window.fetch=function(u,o){u=String(u);'
   +'if(u.indexOf("/sync/pull")>=0){window.__pulls++;const snap=JSON.parse(JSON.stringify(window.__cloud));const res=()=>new Response(JSON.stringify({ok:true,data:snap}),{status:200});'
   +'if(window.__pulls===1&&'+(firstDelayMs||0)+')return new Promise(r=>setTimeout(()=>r(res()),'+(firstDelayMs||0)+'));return Promise.resolve(res());}'
   +'if(u.indexOf("/sync/push")>=0){try{const d=JSON.parse(o.body).data;window.__pushes.push(Object.keys(d));Object.keys(d).forEach(k=>window.__cloud[k]=d[k]);}catch(e){}return Promise.resolve(new Response(\'{"ok":true}\',{status:200}));}'
   +'if(u.indexOf("hnx-sync")>=0)return Promise.resolve(new Response(\'{"ok":true,"data":{}}\',{status:200}));'
   +'return of.apply(this,arguments);};';
};
const LOCAL_TODAY='const __d=new Date();const T=__d.getFullYear()+"-"+String(__d.getMonth()+1).padStart(2,"0")+"-"+String(__d.getDate()).padStart(2,"0");';

module.exports=[
{ name:'⌨ Half-typed EC: Pool 1 EC (08:00) type "1" and wait 6 s → nothing stored, the cursor is still in EC, no CRIT, 0 irrigation issues / 0 pool tasks / 0 pool calls; then ".65" + Tab → EC "1.65" saved by ONE save, still 0 issues / 0 calls, the cursor moves on to Pool 1 man EC (v13.81 save-while-typing saved "1" after a 1-s pause)',
  drive:async pg=>{
    await openPool(pg);
    await pg.locator(rowSel(0)).locator('input[placeholder="EC"]').click();
    await pg.keyboard.type('1');await pg.waitForTimeout(6000);
    const mid=await st(pg,'P01');
    await pg.keyboard.type('.65');await pg.keyboard.press('Tab');await pg.waitForTimeout(1500);
    const end=await st(pg,'P01');
    return {mid:{EC:mid.EC,inEC:/'P01','EC'/.test(mid.focus),crit:mid.crit,issues:mid.issues,tasks:mid.tasks,calls:mid.calls},
      end:{EC:end.EC,saves:end.saves,issues:end.issues,calls:end.calls,onManEC:/'P01','manualEC'/.test(end.focus)}};
  },
  expect:{'drive.mid':{EC:null,inEC:true,crit:false,issues:0,tasks:0,calls:0},'drive.end':{EC:'1.65',saves:['EC=1.65'],issues:0,calls:0,onManEC:true}} },

{ name:'⌨ Fast typing: Pool 2 EC "1.7" Tab "1.71" Tab → EC 1.7 and man EC 1.71 both stored with one save each, the cursor ends on Pool 2 pH; 🔢 a click on a blank area after the save and "1" "6" typed → the view stays irr_nutrients (digits no longer switch module on the pool screen)',
  drive:async pg=>{
    await openPool(pg);
    await pg.locator(rowSel(1)).locator('input[placeholder="EC"]').click();
    await pg.keyboard.type('1.7');await pg.keyboard.press('Tab');await pg.waitForTimeout(400);
    await pg.keyboard.type('1.71');await pg.keyboard.press('Tab');await pg.waitForTimeout(1500);
    const a=await st(pg,'P02');
    await pg.locator('#stubIrrNutrientsBody .section-title').first().click();await pg.waitForTimeout(300);
    await pg.keyboard.type('16');await pg.waitForTimeout(1200);
    const b=await pg.evaluate(()=>({view:window.currentView,active:!!(document.getElementById('view-irr_nutrients')||{classList:{contains:()=>false}}).classList.contains('active')}));
    return {EC:a.EC,man:a.manualEC,saves:a.saves,onPH:/'P02','pH'/.test(a.focus),view:b.view,active:b.active};
  },
  expect:{'drive':{EC:'1.7',man:'1.71',saves:['EC=1.7','manualEC=1.71'],onPH:true,view:'irr_nutrients',active:true}} },

{ name:'⚙ Over-tank EC typed "0", pause 1.5 s, ".8", Tab → 0.8 (never 0 while typing); cleared + Tab → stays 0.8; 🗓 Backspace in the date box (and an empty date) → the date stays today, Pool 1 level 54 stays on screen, a save afterwards writes no data[""] key',
  drive:async pg=>{
    await openPool(pg);
    const ot=pg.locator('#stubIrrNutrientsBody .irr-pool-toolbar input[type="number"]').first();
    await ot.click();await pg.keyboard.press('Control+A');await pg.keyboard.type('0');await pg.waitForTimeout(1500);
    const mid=await pg.evaluate(()=>IRR_RANGES.overTankEc);
    await pg.keyboard.type('.8');await pg.keyboard.press('Tab');await pg.waitForTimeout(800);
    const v1=await pg.evaluate(()=>IRR_RANGES.overTankEc);
    await pg.locator('#stubIrrNutrientsBody .irr-pool-toolbar input[type="number"]').first().click();
    await pg.keyboard.press('Control+A');await pg.keyboard.press('Backspace');await pg.keyboard.press('Tab');await pg.waitForTimeout(800);
    const v2=await pg.evaluate(()=>({v:IRR_RANGES.overTankEc,box:document.querySelector('#stubIrrNutrientsBody .irr-pool-toolbar input[type="number"]').value,saved:JSON.parse(localStorage.getItem('hydroProIrrSettings')||'{}').overTankEc}));
    const today=await pg.evaluate(async()=>{irrSavePool('P01','water','54');await new Promise(r=>setTimeout(r,600));return hnxLocalToday();});
    const dt=pg.locator('#stubIrrNutrientsBody .irr-pool-toolbar input[type="date"]').first();
    await dt.click();await pg.keyboard.press('Backspace');await pg.waitForTimeout(1500);
    const d1=await pg.evaluate(()=>({date:_irrDate,water:(document.querySelector('#stubIrrNutrientsBody tbody tr:not(.irr-nexi-row) input[placeholder="cm"]')||{}).value}));
    const d2=await pg.evaluate(async()=>{const i=document.querySelector('#stubIrrNutrientsBody .irr-pool-toolbar input[type="date"]');i.value='';i.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(r=>setTimeout(r,600));irrSavePool('P02','EC','1.7');await new Promise(r=>setTimeout(r,600));
      return {date:_irrDate,water:(document.querySelector('#stubIrrNutrientsBody tbody tr:not(.irr-nexi-row) input[placeholder="cm"]')||{}).value,emptyKey:Object.prototype.hasOwnProperty.call(loadIrrPool(),'')};});
    return {mid,v1,v2,d1:{today:d1.date===today,water:d1.water},d2:{today:d2.date===today,water:d2.water,emptyKey:d2.emptyKey}};
  },
  expect:{'drive.mid':1,'drive.v1':0.8,'drive.v2':{v:0.8,box:'0.8',saved:0.8},'drive.d1':{today:true,water:'54'},'drive.d2':{today:true,water:'54',emptyKey:false}} },

{ name:'🗓 Asia/Manila at 07:40 on 9 Oct 2026 (23:40 UTC on 8 Oct) → the Pool Monitor opens on 2026-10-09 (not the UTC 2026-10-08); the 08:00 EC 1.7 is saved under 2026-10-09, nothing under 2026-10-08; across midnight a date Nexi chose moves to the new day (2026-10-10), a date somebody picked (2026-10-05) stays',
  tz:'Asia/Manila', seed:SHIFT_DATE,
  run:fn(OPEN+`const d0=_irrDate;irrSavePool('P01','EC','1.7');await sleep(400);const keys=Object.keys(loadIrrPool()).sort();
    const ec=(((loadIrrPool()['2026-10-09']||{}).P01||{})['08:00']||{}).EC;
    const keep=window.hnxLocalToday;window.hnxLocalToday=()=>'2026-10-10';renderIrrPoolMonitor();const d1=_irrDate;
    _irrDate='2026-10-05';window.hnxLocalToday=()=>'2026-10-11';renderIrrPoolMonitor();const d2=_irrDate;window.hnxLocalToday=keep;
    return {d0,local:keep(),keys,ec,d1,d2};`),
  expect:{d0:'2026-10-09',local:'2026-10-09',keys:['2026-10-09'],ec:'1.7',d1:'2026-10-10',d2:'2026-10-05'} },

{ name:'🧯 Only finished readings count: "1." or a number the browser cannot read is NOT stored (toast), EC stays 1.68; partial pH "5" committed → exactly ONE "pH out of range in Pool P01 at 08:00" issue, saving 5 again adds none, 5.9 resolves it; at 11:00 EC "1" with 08:00 at 1.68 → asks "far from the last reading (1.68)": Cancel → not saved, 0 EC issues; OK → saved, 1 EC issue and after the 5-s engine exactly 1 open pool call',
  run:fn(OPEN+`const rec=t=>((loadIrrPool()[_irrDate]||{}).P01||{})[t]||{};
    const iss=f=>(loadIssues()||[]).filter(i=>i.title===f+' out of range in Pool P01 at '+_irrCurrentPoolTime);
    irrSavePool('P01','EC','1.68');irrSavePool('P01','EC','1.');irrSavePool('P01','EC',null);await sleep(300);
    const bad={EC:rec('08:00').EC,toasts:(window.__toasts||[]).filter(m=>/re-type/.test(m)).length};
    irrSavePool('P01','pH','5');await sleep(200);const p1=iss('pH').length;irrSavePool('P01','pH','5');await sleep(200);const p2=iss('pH').length;
    irrSavePool('P01','pH','5.9');await sleep(200);const p3=iss('pH').map(i=>i.status);
    window.irrSetPoolTime('11:00');const msgs=[];window.confirm=m=>{msgs.push(m);return false;};
    irrSavePool('P01','EC','1');await sleep(300);const cancel={EC:rec('11:00').EC===undefined?null:rec('11:00').EC,asked:/far from the last reading \\(1\\.68\\)/.test(msgs[0]||''),issues:iss('EC').length};
    window.confirm=m=>{msgs.push(m);return true;};irrSavePool('P01','EC','1');await sleep(7000);
    const calls=(loadCalls()||[]).filter(c=>c.sourceModule==='irr_pools'&&c.areaText==='Pool 1'&&!CLOSED(c));
    return {bad,p1,p2,p3,cancel,ok:{EC:rec('11:00').EC,issues:iss('EC').length,openCalls:calls.length,ec:calls.map(c=>/EC LOW/.test(c.subject||''))}};`),
  expect:{bad:{EC:'1.68',toasts:2},p1:1,p2:1,p3:['resolved'],cancel:{EC:null,asked:true,issues:0},ok:{EC:'1',issues:1,openCalls:1,ec:[true]}} },

{ name:'🎯 Dose = Eyal’s workbook with the DAILY target: Pool 1 (GH1) 08:00 level 54, EC 1 → daily 60, gap 6 → 121 L, A 2100 cc, B 2100 cc, C 30 cc, "Add 121 L pure water · A 2100 cc · B 2100 cc · C 30 cc", level ok (no FILL pill; 35 cm would be critical_min), same at 11:00; Pool 2 level 45, EC 1.62/1.66 → 1.64 → row 1.65, pH 6.50/6.44 → 303 L, A/B 3600 cc, C 95 cc, no CALIBRATE; Pool 7 (×0.67, daily 100) level 85, EC 1.75 → 322 L, A/B 1876 cc, C 75 cc',
  run:fn(OPEN+`window.confirm=()=>true;const rec=(id,t)=>((loadIrrPool()[_irrDate]||{})[id]||{})[t||_irrCurrentPoolTime]||{};const P=id=>IRR_POOLS.find(p=>p.id===id);
    const pick=r=>({gap:r._dose.gap,water:r._dose.waterL,a:r._dose.aCC,b:r._dose.bCC,c:r._dose.cCC,A:r.A,B:r.B,C:r.C,W:r.waterAdded});
    irrSavePool('P01','water','54');irrSavePool('P01','EC','1');await sleep(300);renderIrrPoolMonitor();await sleep(300);
    const row=document.querySelector('#stubIrrNutrientsBody tbody tr:not(.irr-nexi-row)');
    const p1={...pick(rec('P01')),instr:irrInstruction(P('P01'),rec('P01')),lvl:waterLevelStatus(P('P01'),54),lvl35:waterLevelStatus(P('P01'),35),fill:/FILL/.test(row.innerText),
      says:/Nexi says: Add 121 L pure water · A 2100 cc · B 2100 cc · C 30 cc/.test(document.getElementById('stubIrrNutrientsBody').innerText)};
    window.irrSetPoolTime('11:00');irrSavePool('P01','water','54');irrSavePool('P01','EC','1');await sleep(300);const p1b=pick(rec('P01'));
    window.irrSetPoolTime('08:00');
    irrSavePool('P02','water','45');irrSavePool('P02','EC','1.62');irrSavePool('P02','manualEC','1.66');irrSavePool('P02','pH','6.50');irrSavePool('P02','manualPH','6.44');await sleep(300);
    const r2=rec('P02');const p2={...pick(r2),ec:r2._dose.ec,row:r2._dose.row,ph:r2._dose.ph,cal:r2._calibrate||'',instr:/^Add 303 L pure water · A 3600 cc · B 3600 cc · C 95 cc/.test(irrInstruction(P('P02'),r2))};
    irrSavePool('P07','water','85');irrSavePool('P07','EC','1.75');await sleep(300);const p7=pick(rec('P07'));
    return {p1,p1b,p2,p7};`),
  expect:{p1:{gap:6,water:121,a:2100,b:2100,c:30,A:2.1,B:2.1,C:0.03,W:121,instr:'Add 121 L pure water · A 2100 cc · B 2100 cc · C 30 cc',lvl:'ok',lvl35:'critical_min',fill:false,says:true},
    p1b:{gap:6,water:121,a:2100,b:2100,c:30,A:2.1,B:2.1,C:0.03,W:121},
    p2:{gap:15,water:303,a:3600,b:3600,c:95,A:3.6,B:3.6,C:0.1,W:303,ec:1.64,row:'1.65',ph:6.47,cal:'',instr:true},
    p7:{gap:15,water:322,a:1876,b:1876,c:75,A:1.88,B:1.88,C:0.08,W:322}} },

{ name:'🎯 Two meters and edge rows: Pool 1 level 40, EC 1.30/1.38 (Δ 0.08 > 0.05) → CALIBRATE EC, A/B/C empty, water 405 L kept; Pool 2 pH 6.90/6.78 (Δ 0.12 > 0.10) → CALIBRATE pH; Pool 1 level 50, EC 2.36 → "EC 2.36 too high — add 202 L water only, no A/B", A = B = 0 (not the 2.35 row); half-cent rounding: EC 1.67/1.68 → 1.68 → row 1.70 → A 2200 cc (level 50), EC 2.02/2.03 → 2.03 → row 2.05 → A 900 cc (level 40)',
  run:fn(OPEN+`window.confirm=()=>true;const rec=(id)=>((loadIrrPool()[_irrDate]||{})[id]||{})[_irrCurrentPoolTime]||{};const P=id=>IRR_POOLS.find(p=>p.id===id);
    irrSavePool('P01','water','40');irrSavePool('P01','EC','1.30');irrSavePool('P01','manualEC','1.38');await sleep(300);let r=rec('P01');
    const cal={cal:/^CALIBRATE EC meters/.test(r._calibrate||''),A:r.A===undefined?'':r.A,B:r.B===undefined?'':r.B,C:r.C===undefined?'':r.C,W:r.waterAdded,instr:/^⚠ CALIBRATE EC meters/.test(irrInstruction(P('P01'),r))};
    irrSavePool('P02','water','40');irrSavePool('P02','EC','1.7');irrSavePool('P02','pH','6.90');irrSavePool('P02','manualPH','6.78');await sleep(300);r=rec('P02');
    const calPh={cal:/^CALIBRATE pH meters/.test(r._calibrate||''),W:r.waterAdded,a:r._dose.aCC};
    window.irrSetPoolTime('11:00');irrSavePool('P01','water','50');irrSavePool('P01','EC','2.36');await sleep(300);r=rec('P01');
    const high={a:r._dose.aCC,b:r._dose.bCC,high:r._dose.ecHigh,A:r.A===undefined?'':r.A,instr:/^EC 2\\.36 too high — add 202 L water only, no A\\/B/.test(irrInstruction(P('P01'),r))};
    window.irrSetPoolTime('14:00');irrSavePool('P01','water','50');irrSavePool('P01','EC','1.67');irrSavePool('P01','manualEC','1.68');await sleep(300);r=rec('P01');const h1={ec:r._dose.ec,row:r._dose.row,a:r._dose.aCC};
    window.irrSetPoolTime('16:00');irrSavePool('P01','water','40');irrSavePool('P01','EC','2.02');irrSavePool('P01','manualEC','2.03');await sleep(300);r=rec('P01');const h2={ec:r._dose.ec,row:r._dose.row,a:r._dose.aCC};
    return {cal,calPh,high,h1,h2};`),
  expect:{cal:{cal:true,A:'',B:'',C:'',W:405,instr:true},calPh:{cal:true,W:405,a:0},high:{a:0,b:0,high:true,A:'',instr:true},h1:{ec:1.68,row:'1.70',a:2200},h2:{ec:2.03,row:'2.05',a:900}} },

{ name:'🎯 Daily vs cleaning target: stored pool settings without a daily target → Pool 1 60, GH7 100, GH9 50, GH10 60 (not its cleaning 120), cleaning 130 kept; ⚙️ Pool & Drum Setup shows "DAILY target" 60 and "CLEANING target" 130 for Pool 1; an admin sets Pool 1 daily 70 → level 54 → gap 16 → 324 L',
  seed:()=>{localStorage.setItem('hydroPro_pool_dimensions',JSON.stringify([
    {id:'P01',label:'Pool 1',room:'Room 1&2',roomId:'FR1_2',greenhouse:'GH1',dim:{L:238,W:85,H:138,target:130}},
    {id:'P07',label:'Pool 7',room:'Room 7&8',roomId:'FR7_8',greenhouse:'GH7',dim:{L:150,W:143,H:218,target:100}},
    {id:'P09',label:'Pool 9',room:'Room 9',roomId:'FR9',greenhouse:'GH9',dim:{L:236,W:142,H:205,target:100}},
    {id:'P10',label:'Pool 10',room:'Room 10',roomId:'FR10',greenhouse:'GH10',dim:{L:180,W:118,H:165,target:120}}]));},
  run:fn(`window.showToast=()=>{};const ps=loadIrrPools();const g=id=>ps.find(p=>p.id===id);
    const raw=JSON.parse(localStorage.getItem('hydroPro_pool_dimensions'))[0].dim;
    const t={p1:irrDailyTarget(g('P01')),p7:irrDailyTarget(g('P07')),p9:irrDailyTarget(g('P09')),p10:irrDailyTarget(g('P10')),clean1:g('P01').dim.target,clean10:g('P10').dim.target,rawOk:raw.dailyTarget===undefined||raw.dailyTarget===60};
    switchView('pool_setup');await sleep(1200);const v=document.getElementById('view-pool_setup');const txt=v?v.innerText:'';
    const di=v?v.querySelector('input[onchange*="\\'P01\\',\\'dailyTarget\\'"]'):null;const ci=v?v.querySelector('input[onchange*="\\'P01\\',\\'target\\'"]'):null;
    const setup={daily:/DAILY target/.test(txt),cleaning:/CLEANING target/.test(txt),dailyVal:di?di.value:null,cleanVal:ci?ci.value:null};
    try{updatePoolDim('P01','dailyTarget','70');}catch(e){}
    switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');irrSavePool('P01','water','54');irrSavePool('P01','EC','1.7');await sleep(400);
    const r=((loadIrrPool()[_irrDate]||{}).P01||{})['08:00']||{};
    return {t,setup,after:{daily:irrDailyTarget(IRR_POOLS.find(p=>p.id==='P01')),gap:r._dose.gap,water:r._dose.waterL,stored:JSON.parse(localStorage.getItem('hydroPro_pool_dimensions'))[0].dim.dailyTarget}};`),
  expect:{t:{p1:60,p7:100,p9:50,p10:60,clean1:130,clean10:120,rawOk:true},setup:{daily:true,cleaning:true,dailyVal:'60',cleanVal:'130'},after:{daily:70,gap:16,water:324,stored:70}} },

{ name:'🎯 A round last computed by the v21.71 fill rule (A 1 L auto) is recomputed by the matrix when the screen opens → A 2.1 L, _dose.v 22.20; a manually typed A 3 L stays 3 L (B auto → 2.1 L)',
  seed:new Function(LOCAL_TODAY+`const old={gap:6,waterL:121,aCC:1000,bCC:1000,cCC:0,rule:'morning fill to 60 cm'};
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify({[T]:{P01:{'08:00':{water:'54',EC:'1',A:1,B:1,waterAdded:121,_autoFilled:{A:true,B:true,waterAdded:true},_dose:old,updatedAt:1}},
      P02:{'08:00':{water:'54',EC:'1',A:'3',B:1,waterAdded:121,_autoFilled:{A:false,B:true,waterAdded:true},_dose:old,updatedAt:1}}}}));`),
  run:fn(OPEN+`await sleep(400);const d=loadIrrPool()[_irrDate]||{};const a=(d.P01||{})['08:00']||{},b=(d.P02||{})['08:00']||{};
    return {p1:{A:a.A,B:a.B,v:(a._dose||{}).v,aCC:(a._dose||{}).aCC},p2:{A:b.A,B:b.B,v:(b._dose||{}).v}};`),
  expect:{p1:{A:2.1,B:2.1,v:'22.20',aCC:2100},p2:{A:'3',B:2.1,v:'22.20'}} },

{ name:'👁 At 1366×768 the "💡 Nexi says" line for Pool 1 is fully inside the table frame at scroll 0 (it was the 17th column, ~1100 px to the right); 🔤 placeholders EC, man EC, pH, man pH, cm, °C, opt., A (L), B (L), C (L) fit their boxes (text width ≤ box width)',
  viewport:{width:1366,height:768},
  run:fn(OPEN+`irrSavePool('P01','water','54');irrSavePool('P01','EC','1');await sleep(400);renderIrrPoolMonitor();await sleep(300);
    const w=document.querySelector('#stubIrrNutrientsBody .irr-pool-table-wrap');const s=document.querySelector('#stubIrrNutrientsBody .irr-nexi-says');
    const a=w.getBoundingClientRect(),b=s.getBoundingClientRect();
    const vis={scroll:w.scrollLeft,inside:b.left>=a.left-1&&b.right<=a.right+1,text:/^💡 Nexi says: Add 121 L/.test(s.innerText)};
    const c=document.createElement('canvas').getContext('2d');const row=[...document.querySelectorAll('#stubIrrNutrientsBody tbody tr:not(.irr-nexi-row)')][1];
    const want=['EC','man EC','pH','man pH','cm','°C','opt.','A (L)','B (L)','C (L)'];const fit={};
    [...row.querySelectorAll('input.irr-pool-input')].forEach(i=>{if(!want.includes(i.placeholder))return;const cs=getComputedStyle(i);c.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
      fit[i.placeholder]=c.measureText(i.placeholder).width<=i.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);});
    return {vis,fit};`),
  expect:{vis:{scroll:0,inside:true,text:true},fit:{'EC':true,'man EC':true,'pH':true,'man pH':true,'cm':true,'°C':true,'opt.':true,'A (L)':true,'B (L)':true,'C (L)':true}} },

{ name:'🎯 Smart Dosing shows the monitor’s numbers: Pool 1 (level 54, EC 1) → 121 L, A 2.1 L, B 2.1 L, C 0.03 L; Pool 2 EC 1.30/1.38 → CALIBRATE and no APPLY ALL; Pool 3 without a level → "Awaiting water level reading" (not "Configure pool dimensions")',
  run:fn(OPEN+`window.confirm=()=>true;irrSavePool('P01','water','54');irrSavePool('P01','EC','1');irrSavePool('P02','water','40');irrSavePool('P02','EC','1.30');irrSavePool('P02','manualEC','1.38');irrSavePool('P03','EC','1.7');await sleep(300);
    switchView('irr_smart_dose');await sleep(900);renderIrrSmartDose();await sleep(300);
    const rows=[...document.querySelectorAll('#stubIrrSmartDoseBody tbody tr')];const R=l=>rows.find(r=>(r.cells[0]||{}).innerText&&r.cells[0].innerText.split('\\n')[0].trim()===l);
    const r1=R('Pool 1'),r2=R('Pool 2'),r3=R('Pool 3');
    const btn=r=>[...r.querySelectorAll('button')].map(b=>b.innerText.trim());
    return {p1:btn(r1).slice(0,4),p2:{cal:/CALIBRATE EC meters/.test(r2.innerText),apply:/APPLY/.test(r2.innerText)},p3:{wait:/Awaiting water level reading/.test(r3.innerText),cfg:/Configure pool dimensions/.test(r3.innerText)}};`),
  expect:{p1:['121L','2.1L','2.1L','0.03L'],p2:{cal:true,apply:false},p3:{wait:true,cfg:false}} },

{ name:'🚨 Pool calls: P01 08:00 EC 1 + 11:00 EC 1.7 (rounds disagree) → 0 calls ever; P03 08:00 EC 1.7 + 11:00 EC 1 (latest out) → exactly 1 open call, key pool::P03::EC, still 1 after 30 s (it was ~1 new call per 5 s); corrected to 1.65 → task done, call closed_fixed by system; yesterday’s open P02 pH call (key <yesterday>::pool::P02::pH) + today’s pH 7.3 → still that 1 call, key folded to pool::P02::pH',
  seed:new Function(LOCAL_TODAY+`const y=new Date(__d.getTime()-864e5);const Y=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    localStorage.setItem('hydroPro_irr_pool',JSON.stringify({[T]:{P01:{'08:00':{EC:'1'},'11:00':{EC:'1.7'}},P03:{'08:00':{EC:'1.7'},'11:00':{EC:'1'}},P02:{'08:00':{pH:'7.3'}}}}));
    const now=Date.now();
    localStorage.setItem('hydroPro_maint_tasks',JSON.stringify([{id:'TASK_Y1',title:'💧 Pool Pool 2 · pH HIGH (7.30 )',status:'not_started',priority:'priority',createdAt:now-864e5,createdBy:'system',category:'auto_pool_sensor',sourceModule:'irr_pools',scheduledDate:Y,durationDays:1,gantt:[],materials:[]}]));
    localStorage.setItem('hydroPro_calls',JSON.stringify([{id:'CALL_Y1',subject:'💧 Pool Pool 2 · pH HIGH (7.30 )',description:'x',priority:'priority',status:'new_call',group:'operations',department:'irrigation',areaText:'Pool 2',sourceModule:'irr_pools',raisedBy:'system',maintTaskId:'TASK_Y1',createdAt:now-864e5,updatedAt:now-864e5,automatic:true}]));
    localStorage.setItem('hydroPro_it_auto_tasks',JSON.stringify({[Y+'::pool::P02::pH']:{maintTaskId:'TASK_Y1',callId:'CALL_Y1',status:'oor',createdAt:now-864e5}}));`),
  run:fn(`window.showToast=()=>{};await sleep(6000);const C=()=>(loadCalls()||[]).filter(c=>c.sourceModule==='irr_pools');const A=()=>JSON.parse(localStorage.getItem('hydroPro_it_auto_tasks')||'{}');
    const snap=()=>({p1:C().filter(c=>c.areaText==='Pool 1').length,p3open:C().filter(c=>c.areaText==='Pool 3'&&!CLOSED(c)).length,p3all:C().filter(c=>c.areaText==='Pool 3').length,p2open:C().filter(c=>c.areaText==='Pool 2'&&!CLOSED(c)).map(c=>c.id),
      keys:Object.keys(A()).filter(k=>/pool::/.test(k)).sort()});
    const s1=snap();await sleep(30000);const s2=snap();
    switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('11:00');irrSavePool('P03','EC','1.65');await sleep(7000);
    const c3=C().filter(c=>c.areaText==='Pool 3');const t3=(loadMaintTasks()||[]).filter(t=>t.category==='auto_pool_sensor'&&/Pool 3/.test(t.title||''));
    return {s1,s2,fixed:{calls:c3.map(c=>c.status+'/'+c.closedBy),tasks:t3.map(t=>t.status),key:Object.keys(A()).includes('pool::P03::EC')}};`),
  expect:{s1:{p1:0,p3open:1,p3all:1,p2open:['CALL_Y1'],keys:['pool::P02::pH','pool::P03::EC']},s2:{p1:0,p3open:1,p3all:1,p2open:['CALL_Y1'],keys:['pool::P02::pH','pool::P03::EC']},
    fixed:{calls:['closed_fixed/system'],tasks:['done'],key:false}} },

{ name:'☁ Pool readings merge field by field on their own stamps (both argument orders): newer EC "1.8" beats older "2.1"; newer water "10" beats "9"; a stamped clear "" beats an older "1"; P01 + P02 and two fields of one round union; unstamped legacy records merge as before ("1.7" vs "1.65" → "1.7", "" vs "50" → "50"); merging the result again changes nothing and is not "ahead"',
  run:fn(`const M=window.__hnxMergeGeneric,MI=window.__hnxMergeIrrPool;const D='2026-10-09';
    const rec=(f,v,ts)=>({[f]:v,_fieldTimestamps:{[f]:ts},updatedAt:ts});
    const L={[D]:{P01:{'08:00':Object.assign(rec('EC','1.8',2000),{water:'10',_fieldTimestamps:{EC:2000,water:2000}})},P03:{'08:00':rec('manualEC','',2000)}}};
    const R={[D]:{P01:{'08:00':Object.assign(rec('EC','2.1',1000),{water:'9',pH:'6.1',_fieldTimestamps:{EC:1000,water:1000,pH:1000}})},P02:{'08:00':rec('EC','1.7',1500)},P03:{'08:00':rec('manualEC','1',1000)}}};
    const pick=raw=>{const o=JSON.parse(raw)[D];return {ec:o.P01['08:00'].EC,water:o.P01['08:00'].water,ph:o.P01['08:00'].pH,cleared:o.P03['08:00'].manualEC,pools:Object.keys(o).sort()};};
    const a=pick(M('hydroPro_irr_pool',JSON.stringify(L),JSON.stringify(R)));const b=pick(M('hydroPro_irr_pool',JSON.stringify(R),JSON.stringify(L)));
    const LL={[D]:{P01:{'08:00':{EC:'1.7',water:''}}}},RL={[D]:{P01:{'08:00':{EC:'1.65',water:'50'}}}};
    const lg=JSON.parse(M('hydroPro_irr_pool',JSON.stringify(LL),JSON.stringify(RL)))[D].P01['08:00'];
    const once=MI(JSON.stringify(L),JSON.stringify(R));const twice=MI(once.out,once.out);const other=MI(JSON.stringify(R),once.out);
    return {a,b,legacy:{ec:lg.EC,water:lg.water},firstAhead:once.localAhead,again:{out:twice.out,ahead:twice.localAhead},otherPcAhead:other.localAhead};`),
  expect:{a:{ec:'1.8',water:'10',ph:'6.1',cleared:'',pools:['P01','P02','P03']},b:{ec:'1.8',water:'10',ph:'6.1',cleared:'',pools:['P01','P02','P03']},legacy:{ec:'1.7',water:'50'},firstAhead:true,again:{out:null,ahead:false},otherPcAhead:false} },

{ name:'☁ Cloud-first never drops readings typed while "Sync · waiting": no pool store at boot, the first download takes 45 s, P01 EC 1.6 + level 54 saved before it lands → after the pull this computer has today’s P01 {EC 1.6, level 54} AND the cloud’s 2026-10-01, and the next upload carries both',
  seed:new Function(CLOUD(45000,{hydroPro_irr_pool:JSON.stringify({'2026-10-01':{P05:{'08:00':{EC:'1.7',water:'60',updatedAt:1}}}})})),
  run:fn(`window.showToast=()=>{};const before=!!window.__hnxPulledOk;switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');const D=_irrDate;
    irrSavePool('P01','EC','1.6');irrSavePool('P01','water','54');
    for(let i=0;i<120;i++){if(window.__hnxPulledOk)break;await sleep(500);}
    await sleep(1500);const loc=JSON.parse(localStorage.getItem('hydroPro_irr_pool')||'{}');
    let cl={};for(let i=0;i<120;i++){try{cl=JSON.parse(window.__cloud.hydroPro_irr_pool||'{}');}catch(e){}if(cl[D])break;await sleep(500);}
    const r=((loc[D]||{}).P01||{})['08:00']||{},c=((cl[D]||{}).P01||{})['08:00']||{};
    return {before,local:{EC:r.EC,water:r.water,old:!!loc['2026-10-01']},cloud:{EC:c.EC,water:c.water,old:!!cl['2026-10-01']}};`),
  expect:{before:false,local:{EC:'1.6',water:'54',old:true},cloud:{EC:'1.6',water:'54',old:true}} },

{ name:'☁ Two computers: (a) a save right after a pull merge that added P02 keeps P02 (500 ms cache); (b) another computer’s P03 reading reaches the cloud after our download, we save P04 → the upload carries P03 AND P04; (c) the cloud loses our P04 (stale copy from another PC) → the next pull marks the key dirty and the upload puts P04 back; a pull of what we uploaded marks nothing',
  seed:new Function(CLOUD(0,{})),
  run:fn(`window.showToast=()=>{};for(let i=0;i<120;i++){if(window.__hnxPulledOk)break;await sleep(500);}await sleep(3000);
    switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');window.confirm=()=>true;const D=_irrDate;
    const day=()=>Object.keys((JSON.parse(localStorage.getItem('hydroPro_irr_pool')||'{}'))[D]||{}).sort();
    const ts=Date.now();const other=(id)=>({EC:'1.7',_fieldTimestamps:{EC:ts},updatedAt:ts});
    loadIrrPool();const cur=JSON.parse(localStorage.getItem('hydroPro_irr_pool')||'{}');cur[D]=cur[D]||{};cur[D].P02={'08:00':other()};window.__hnxRawSetNoSync('hydroPro_irr_pool',JSON.stringify(cur));
    irrSavePool('P01','EC','1.6');await sleep(200);const a=day();
    const cloudDay=()=>{try{return Object.keys((JSON.parse(window.__cloud.hydroPro_irr_pool||'{}'))[D]||{}).sort();}catch(e){return [];}};
    for(let i=0;i<60;i++){if(cloudDay().includes('P01'))break;await sleep(500);}
    const cc=JSON.parse(window.__cloud.hydroPro_irr_pool);cc[D].P03={'08:00':other()};window.__cloud.hydroPro_irr_pool=JSON.stringify(cc);
    irrSavePool('P04','EC','1.65');let b=[];for(let i=0;i<80;i++){b=cloudDay();if(b.includes('P04')&&b.includes('P03'))break;await sleep(500);}
    await sleep(2000);const stale=JSON.parse(window.__cloud.hydroPro_irr_pool);delete stale[D].P04;stale[D].P05={'08:00':other()};window.__cloud.hydroPro_irr_pool=JSON.stringify(stale);
    const dirtyK=()=>!!(JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}').hydroPro_irr_pool);
    let back=false;for(let i=0;i<120;i++){if(cloudDay().includes('P04')&&cloudDay().includes('P05'))break;if(!HNX_Cloud.state.syncing&&i%8===0){try{await HNX_Cloud.pull();await HNX_Cloud.push();}catch(e){}}await sleep(500);}
    back=cloudDay().includes('P04');await sleep(1500);
    for(let i=0;i<40;i++){if(!HNX_Cloud.state.syncing)break;await sleep(250);}try{await HNX_Cloud.pull();}catch(e){}await sleep(1200);
    return {a,b,back,c:cloudDay(),local:day(),dirtyAfter:dirtyK()};`),
  expect:{a:['P01','P02'],b:['P01','P02','P03','P04'],back:true,c:['P01','P02','P03','P04','P05'],local:['P01','P02','P03','P04','P05'],dirtyAfter:false} }
];
