/* v22.78 (Eyal, 13 Oct 2026, URGENT: "still pending to connect all meters from BeHive-I to Nexi each pool"): 🔌 POOL METERS.
   The BeHive-I pool sensors reach the nexi-irr worker; ONE computer (the feeder, a 10-min lease) pulls GET <url>/irr/latest every
   3 minutes and fills the CURRENT round of TODAY on the Pool Monitor through irrSavePool — on a LIVE pool the meter boxes (EC, pH,
   level, temp) are read-only ("📡 live 08:15") and the team types the hand meters; a value typed before the sensor went live stays
   ("⌨ typed"); one reading per round; only fresh readings (≤ max age 20 min, today, ≥ 15 min before the round); never a value the
   Pool Monitor calls impossible. Issues get FIXED ids (one per pool + round + field, never twice from two computers); the temperature
   raises alarms like EC and pH; a per-pool 📡 Sensor tolerance; the 🔌 Meters screen; 📡 in the Readings Report; 🩺 Nexi Health.
   The page clock is Tue 13 Oct 2026, Manila; __tAt() moves it (08:20, 11:05). window.fetch is stubbed inside the cases — no network.
   Pool 1 (IRR_POOLS_DEFAULT): 238 × 85 cm, daily target 60. Level 40 → 20 cm → water round(238 × 85 × 20 / 1000) = 405 L; v22.56 EC 1.62 is
   0.08 under 1.70 → 1 + 0.8 = 1.8 L per 10 cm → A = B = 20 × 1.8 = 36 → 3600 cc = 3.6 L; C = 20 cm × 5 cc × (1 + 6.1 − 6.2) = 90 cc = 0.09 L.
   11:00 round, level 52 → 8 cm → 162 L; EC 1.66 → 1.4 L per 10 cm → 8 × 1.4 = 11.2 → 1100 cc = 1.1 L. */
const NEW="typeof window.hnxIrrMeters==='object'&&window.hnxIrrMeters.v===2278";
const CLOCK=`const RD=Date;let off=RD.parse('2026-10-13T00:20:00Z')-RD.now();
  window.__tAt=function(iso){off=RD.parse(iso)-RD.now();};
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;`;
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  __tAt('2026-10-13T00:20:00Z');
  switchView('irr_nutrients');await sleep(900);_irrDate=hnxLocalToday();window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const T='2026-10-13',Y='2026-10-12';
  const M=(day,hm)=>Date.parse(day+'T'+hm+':00+08:00');
  const rec=(id,round,day)=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[day||T]||{})[id]||{})[round||'08:00']||{};};
  const R=(pool,hm,o,day,node)=>Object.assign({pool,ts:M(day||T,hm),node:node||'tap-room1-2',received:M(day||T,hm)+5000},o);
  const reply=list=>{const o={};list.forEach(p=>{o[p.pool]=p;});return {ok:true,now:Date.now(),pools:o,nodes:{'tap-room1-2':{lastSeen:Date.now(),pools:['P01','P02']}},proleaf:{state:'not configured',at:Date.now()}};};
  const at=(day,round,pool,f,v)=>{const d0=_irrDate,t0=_irrCurrentPoolTime;try{_irrDate=day;window.irrSetPoolTime(round);irrSavePool(pool,f,v);}finally{_irrDate=d0;window.irrSetPoolTime(t0);}};
  const inp=(id,f)=>document.querySelector('#stubIrrNutrientsBody input[onchange*="irrSavePool(\\''+id+'\\',\\''+f+'\\'"]');
  const tag=(id,f)=>{const i=inp(id,f),t=i&&i.nextElementSibling;return (t&&t.classList.contains('hnx-mt-tag'))?t.textContent:'';};
  const chip=id=>{const i=inp(id,'EC'),tr=i&&i.closest('tr'),c=tr&&tr.querySelector('.hnx-mt-chip');return c?c.textContent:'';};
  const line=()=>((document.querySelector('#stubIrrNutrientsBody .hnx-isf-btn')||{}).textContent)||'';
  const deco=async()=>{await sleep(400);hnxIrrMeters.decorate();await sleep(50);};
  const stubFetch=(list,mode)=>{const calls=[];const f0=window.fetch;window.fetch=function(u,o){if(String(u).indexOf('/irr/latest')<0)return f0.apply(this,arguments);
      const h=(o&&o.headers)||{};calls.push({u:String(u),auth:h.Authorization||h.authorization||'',method:(o&&o.method)||'GET'});
      if(mode==='401')return Promise.resolve(new Response('{"error":"unauthorized"}',{status:401,headers:{'Content-Type':'application/json'}}));
      return Promise.resolve(new Response(JSON.stringify(reply(list)),{status:200,headers:{'Content-Type':'application/json'}}));};return calls;};
  const feed=async list=>{hnxIrrMeters.saveCfg({url:'https://nexi-irr.test.workers.dev',on:true});hnxIrrMeters.setToken('tok-SECRET-7f3a9c2b');const calls=stubFetch(list);await hnxIrrMeters.pullNow();await sleep(600);return calls;};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
const seed=new Function(CLOCK);
module.exports=[
{ name:'📡 Pool meters at 08:20 Manila: Pool 1’s reading of 08:15 (EC 1.62, pH 6.1, 24.5 °C, level 40 cm, node tap-room1-2) fills the 08:00 round — EC 1.62, pH 6.1, water temp 24.5, level 40 — and the dose engine works it out as for a person: 20 cm → water 405 L; EC 1.62 → 1.8 L per 10 cm → A 3.6 L and B 3.6 L (3600 cc, ⚡ auto); C 0.09 L; _sensor.EC.node "tap-room1-2" at 08:15; the EC box is READ-ONLY (irr-sensor-live, teal irr-sensor ring) tagged "📡 live 08:15", the hand-meter box stays typeable, _autoFilled.EC = true, the pool chip says "📡 live 08:15"; the finish time stays empty and the record says "📡 sensor"',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const res=hnxIrrSensorApply(reply([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40})]),Date.now());
    await deco();await sleep(500);hnxIrrMeters.decorate();
    const r=rec('P01'),e=inp('P01','EC'),w=inp('P01','water'),m=inp('P01','manualEC'),s=r._sensor||{};
    return {round:res.round,filled:res.filled,skipped:res.skipped,
      EC:r.EC,pH:r.pH,wt:r.waterTemp,water:r.water,waterAdded:r.waterAdded,A:r.A,B:r.B,C:r.C,aCC:(r._dose||{}).aCC,cCC:(r._dose||{}).cCC,per10:(r._dose||{}).per10L,autoA:(r._autoFilled||{}).A,autoEC:(r._autoFilled||{}).EC,
      node:(s.EC||{}).node,ts:(s.EC||{}).ts===M(T,'08:15'),stamped:Object.keys(s).sort(),finish:r.finishTime||'',by:r.updatedBy,
      ro:e.readOnly,live:e.classList.contains('irr-sensor-live'),cls:e.classList.contains('irr-sensor'),lvl:!!(w&&w.classList.contains('irr-sensor')),handRo:m.readOnly,hand:m.classList.contains('irr-sensor'),
      tag:tag('P01','EC'),chip:chip('P01'),title:/^📡 live from the pool sensor \\(tap-room1-2\\) at 08:15 — type the hand meter in the H box/.test(e.title),state:hnxIrrMeters.state('P01'),locked:hnxIrrMeters.isLocked('P01','EC',T,'08:00')};`),
  expect:{round:'08:00',filled:[{pool:'P01',field:'EC',value:'1.62'},{pool:'P01',field:'pH',value:'6.1'},{pool:'P01',field:'waterTemp',value:'24.5'},{pool:'P01',field:'water',value:'40'}],skipped:[],
    EC:'1.62',pH:'6.1',wt:'24.5',water:'40',waterAdded:405,A:3.6,B:3.6,C:0.09,aCC:3600,cCC:90,per10:1.8,autoA:true,autoEC:true,
    node:'tap-room1-2',ts:true,stamped:['EC','pH','water','waterTemp'],finish:'',by:'📡 sensor',ro:true,live:true,cls:true,lvl:true,handRo:false,hand:false,
    tag:'📡 live 08:15',chip:'📡 live 08:15',title:true,state:'live',locked:true} },

{ name:'📡 Typed before live wins, live locks: Pool 2’s EC typed 1.70 at 08:00 before the feed → the sensor’s EC 1.55 is skipped "typed" and its pH 6.2 filled; the EC box stays typeable tagged "⌨ typed", the pH box is read-only "📡 live 08:16"; typing EC 1.80 on Pool 1 (live) is REFUSED with the toast "📡 EC of this pool comes from the pool sensor — type the hand meter in the H box" (value stays 1.62); setPoolOff(P01) → the EC box is typeable again, the chip says "no meter" and the next pull skips P01 "off"',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`at(T,'08:00','P02','EC','1.70');renderIrrPoolMonitor();await sleep(300);
    const res=hnxIrrSensorApply(reply([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40}),R('P02','08:16',{ec:1.55,ph:6.2})]),Date.now());
    await deco();await sleep(400);hnxIrrMeters.decorate();
    const r=rec('P02');const toasts=[];window.showToast=m=>{toasts.push(String(m));};
    const p2={EC:r.EC,pH:r.pH,stamped:Object.keys(r._sensor||{}),ecRo:inp('P02','EC').readOnly,ecTag:tag('P02','EC').slice(0,7),ecOutline:inp('P02','EC').classList.contains('irr-sensor'),phRo:inp('P02','pH').readOnly,phTag:tag('P02','pH'),phOutline:inp('P02','pH').classList.contains('irr-sensor')};
    const ref0=window.__irrLastRefuse||0;at(T,'08:00','P01','EC','1.80');await sleep(300);
    const refused={EC:rec('P01').EC,toast:toasts.filter(t=>/📡 EC of this pool comes from the pool sensor — type the hand meter in the H box/.test(t)).length,marked:(window.__irrLastRefuse||0)>ref0};
    window.showToast=()=>{};hnxIrrMeters.setPoolOff('P01',true);await deco();await sleep(300);hnxIrrMeters.decorate();
    const off={ro:inp('P01','EC').readOnly,chip:chip('P01'),state:hnxIrrMeters.state('P01'),tag:tag('P01','EC')};
    const res2=hnxIrrSensorApply(reply([R('P01','08:19',{ec:1.65})]),Date.now());
    return {filled:res.filled,skipped:res.skipped,p2,refused,off,res2:res2.skipped};`),
  expect:{filled:[{pool:'P01',field:'EC',value:'1.62'},{pool:'P01',field:'pH',value:'6.1'},{pool:'P01',field:'waterTemp',value:'24.5'},{pool:'P01',field:'water',value:'40'},{pool:'P02',field:'pH',value:'6.2'}],skipped:[{pool:'P02',field:'EC',why:'typed'}],
    p2:{EC:'1.70',pH:'6.2',stamped:['pH'],ecRo:false,ecTag:'⌨ typed',ecOutline:false,phRo:true,phTag:'📡 live 08:16',phOutline:true},
    refused:{EC:'1.62',toast:1,marked:true},off:{ro:false,chip:'no meter',state:'off',tag:'no meter'},res2:[{pool:'P01',field:'*',why:'off'}]} },

{ name:'📡 Only fresh, today, known and possible readings count (08:20, max age 20 min): Pool 3’s reading of 07:55 (25 min old) → "stale"; Pool 4’s of yesterday 15:00 → "not today"; P99 → "unknown pool"; Pool 5’s EC 0.1 → "implausible" (EC < 0.3); Pool 6’s pH 9.5 → "implausible" (pH > 9) while its EC 1.75 is filled — nothing else is written (Pools 3, 4 and 5 have no 08:00 record, no P99 anywhere); Pool 3 reads "stale" on every computer, Pool 4 "never"',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const res=hnxIrrSensorApply(reply([R('P03','07:55',{ec:1.7,ph:6}),R('P04','15:00',{ec:1.7},Y),R('P99','08:15',{ec:1.7}),R('P05','08:15',{ec:0.1}),R('P06','08:15',{ec:1.75,ph:9.5})]),Date.now());
    await sleep(600);const day=(()=>{try{delete window._perfCache._irrPool;}catch(e){}return loadIrrPool()[T]||{};})();
    return {round:res.round,filled:res.filled,skipped:res.skipped,none:['P03','P04','P05'].map(id=>JSON.stringify(rec(id))),p99:'P99' in day,p6:{EC:rec('P06').EC,pH:rec('P06').pH||''},st3:hnxIrrMeters.state('P03'),st4:hnxIrrMeters.state('P04'),st6:hnxIrrMeters.state('P06')};`),
  expect:{round:'08:00',filled:[{pool:'P06',field:'EC',value:'1.75'}],
    skipped:[{pool:'P03',field:'*',why:'stale'},{pool:'P04',field:'*',why:'not today'},{pool:'P99',field:'*',why:'unknown pool'},{pool:'P05',field:'EC',why:'implausible'},{pool:'P06',field:'pH',why:'implausible'}],
    none:['{}','{}','{}'],p99:false,p6:{EC:'1.75',pH:''},st3:'stale',st4:'stale',st6:'live'} },

{ name:'📡 One reading per round: after the 08:15 reading filled Pool 1’s 08:00 round (EC 1.62), a second pull with EC 1.65 / pH 6.3 keeps 1.62 / 6.1 (skipped "sensor"); clearing the live EC box is refused (the box is locked — 1.62 stays); at 11:05 a fresh 11:03 reading (EC 1.66, pH 6.2, 25 °C, level 52) fills the 11:00 round — 8 cm → water 162 L, A 1.1 L (1.4 L per 10 cm) — and the 08:00 round is unchanged; with max age 30 a reading of 10:40 (25 min old) is "before round" (before 10:45); before 08:00 nothing is filled',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`hnxIrrSensorApply(reply([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40})]),Date.now());await sleep(300);
    const snap=r=>({EC:r.EC,pH:r.pH,water:r.water,wt:r.waterTemp,A:r.A,sensorTs:((r._sensor||{}).EC||{}).ts});
    const r08=snap(rec('P01','08:00'));
    const res2=hnxIrrSensorApply(reply([R('P01','08:19',{ec:1.65,ph:6.3})]),Date.now());
    const ref0=window.__irrLastRefuse||0;at(T,'08:00','P01','EC','');const cleared=rec('P01','08:00').EC,refusedClear=(window.__irrLastRefuse||0)>ref0;
    const res2b=hnxIrrSensorApply(reply([R('P01','08:19',{ec:1.65})]),Date.now());
    const r08a=snap(rec('P01','08:00'));
    __tAt('2026-10-13T03:05:00Z');await sleep(50);
    const res3=hnxIrrSensorApply(reply([R('P01','11:03',{ec:1.66,ph:6.2,wt:25,level_cm:52})]),Date.now());await sleep(400);
    const r11=rec('P01','11:00'),r08b=snap(rec('P01','08:00'));
    hnxIrrSensor.saveCfg({maxAgeMin:30});
    const res4=hnxIrrSensorApply(reply([R('P02','10:40',{ec:1.7})]),Date.now());
    __tAt('2026-10-13T07:30:00Z');const early=hnxIrrSensorApply(reply([R('P03','15:29',{ec:1.7})]),Date.now());
    __tAt('2026-10-12T23:50:00Z');const before=hnxIrrSensorApply(reply([R('P03','07:49',{ec:1.7})]),Date.now());
    return {res2:{filled:res2.filled,skipped:res2.skipped},cleared,refusedClear,res2b:res2b.skipped,same:JSON.stringify(r08a)===JSON.stringify(r08),
      res3:{round:res3.round,n:res3.filled.length},r11:{EC:r11.EC,water:r11.water,waterAdded:r11.waterAdded,A:r11.A,node:((r11._sensor||{}).water||{}).node},
      unchanged:JSON.stringify(r08b)===JSON.stringify(r08),res4:res4.skipped,early:early.round,before:{round:before.round,filled:before.filled.length,skipped:before.skipped.length}};`),
  expect:{res2:{filled:[],skipped:[{pool:'P01',field:'EC',why:'sensor'},{pool:'P01',field:'pH',why:'sensor'}]},cleared:'1.62',refusedClear:true,res2b:[{pool:'P01',field:'EC',why:'sensor'}],same:true,
    res3:{round:'11:00',n:4},r11:{EC:'1.66',water:'52',waterAdded:162,A:1.1,node:'tap-room1-2'},unchanged:true,
    res4:[{pool:'P02',field:'*',why:'before round'}],early:'14:00',before:{round:null,filled:0,skipped:0}} },

{ name:'📡 The token stays on this computer: Pool Monitor line "📡 Sensor feed off" → click → URL + On + token typed in the settings box → 💾 Save: hydroPro_irr_sensor_v1 = {url, on, max age 20, 4 fields, _lww} with no token, the token only in hnxlocal_irr_sensor_token_v1 (no other key, toast or console line holds it), the box then says "set on this computer · ✕ clear"; the stub received GET …/irr/latest with "Authorization: Bearer <token>" and Pool 1 was filled → "📡 Sensors · feeder · 1 pool filled in the 08:00 round · 1 of 12 live · last pull 08:2x · Pro-Leaf: not configured"; ✕ clear → Pull now makes no request and says "no token on this computer"; a wrong token → HTTP 401 → "worker not reached (HTTP 401)" and nothing is written',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const TOK='tok-SECRET-7f3a9c2b';const toasts=[];window.showToast=m=>{toasts.push(String(m));};
    const logs=[];['log','info','warn','error','debug'].forEach(k=>{const o=console[k];console[k]=function(){try{logs.push([].map.call(arguments,a=>{try{return typeof a==='string'?a:JSON.stringify(a);}catch(e){return String(a);}}).join(' '));}catch(e){}return o.apply(console,arguments);};});
    const calls=[];let mode='ok';const f0=window.fetch;
    window.fetch=function(u,o){if(String(u).indexOf('/irr/')<0)return f0.apply(this,arguments);if(String(u).indexOf('/irr/latest')<0)return Promise.resolve(new Response('{"ok":true,"points":[]}',{status:200}));
      const h=(o&&o.headers)||{};calls.push({u:String(u),auth:h.Authorization||h.authorization||'',method:(o&&o.method)||'GET'});
      if(mode==='401')return Promise.resolve(new Response('{"error":"unauthorized"}',{status:401,headers:{'Content-Type':'application/json'}}));
      return Promise.resolve(new Response(JSON.stringify(reply([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40})])),{status:200,headers:{'Content-Type':'application/json'}}));};
    const line0=line();
    document.querySelector('#stubIrrNutrientsBody .hnx-isf-btn').click();await sleep(200);
    const box=document.getElementById('hnxIrrSensorBox');const opened=!!box;
    box.querySelector('#hnxIsfUrl').value='https://nexi-irr.test.workers.dev/';box.querySelector('#hnxIsfOn').checked=true;box.querySelector('#hnxIsfTok').value='  '+TOK+'  ';
    box.querySelector('[data-act="save"]').click();await sleep(1500);
    const cfgRaw=localStorage.getItem('hydroPro_irr_sensor_v1'),cfg=JSON.parse(cfgRaw||'{}'),tok=localStorage.getItem('hnxlocal_irr_sensor_token_v1');
    const tokset=!!document.querySelector('#hnxIrrSensorBox [data-k="tokset"]')&&/set on this computer · ✕ clear/.test(document.querySelector('#hnxIrrSensorBox [data-k="tokset"]').textContent)&&!document.getElementById('hnxIsfTok');
    const first=calls[0]||{};const r=rec('P01');const line1=line();
    document.querySelector('#hnxIrrSensorBox [data-act="cleartok"]').click();await sleep(100);
    const n1=calls.length;await hnxIrrSensor.pullNow();const noTokCalls=calls.length-n1,line2=line(),noTokKey=localStorage.getItem('hnxlocal_irr_sensor_token_v1');
    hnxIrrSensor.setToken('wrong-'+TOK);mode='401';
    try{delete window._perfCache._irrPool;}catch(e){}const before=JSON.stringify(loadIrrPool()[T]||{});
    const st=await hnxIrrSensor.pullNow();await sleep(300);
    try{delete window._perfCache._irrPool;}catch(e){}const after=JSON.stringify(loadIrrPool()[T]||{});
    const leaks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k==='hnxlocal_irr_sensor_token_v1')continue;if(String(localStorage.getItem(k)).indexOf(TOK)>=0)leaks.push(k);}
    return {line0,opened,cfg:{url:cfg.url,on:cfg.on,maxAgeMin:cfg.maxAgeMin,fields:cfg.fields,lww:cfg._lww,by:cfg.by},cfgHasTok:String(cfgRaw).indexOf(TOK)>=0,tok,tokset,
      first:{u:first.u,auth:first.auth,method:first.method},EC:r.EC,line1:/^📡 Sensors · feeder · 1 pool filled in the 08:00 round · 1 of 12 live · last pull 08:2\\d · Pro-Leaf: not configured$/.test(line1),line1txt:line1,
      noTokCalls,line2,noTokKey,http:st.http,err:st.err,line3:line(),unchanged:before===after,calls401:calls.length-n1,
      leaks,toastLeak:toasts.filter(t=>t.indexOf(TOK)>=0).length,logLeak:logs.filter(t=>t.indexOf(TOK)>=0).length,statusLeak:JSON.stringify(hnxIrrSensor.status()).indexOf(TOK)>=0,health:hnxIrrMeters.health()};`),
  expect:{line0:'📡 Sensor feed off',opened:true,cfg:{url:'https://nexi-irr.test.workers.dev',on:true,maxAgeMin:20,fields:{EC:true,pH:true,waterTemp:true,water:true},lww:true,by:'tester'},cfgHasTok:false,
    tok:'tok-SECRET-7f3a9c2b',tokset:true,first:{u:'https://nexi-irr.test.workers.dev/irr/latest',auth:'Bearer tok-SECRET-7f3a9c2b',method:'GET'},EC:'1.62',line1:true,
    noTokCalls:0,line2:'📡 Sensor feed: no token on this computer',noTokKey:null,http:401,err:'HTTP 401',line3:'📡 Sensor feed: worker not reached (HTTP 401)',unchanged:true,calls401:1,
    leaks:[],toastLeak:0,logLeak:0,statusLeak:false,health:'feeder · no reply 0 min (HTTP 401)'} },

{ name:'📡 No confirm() can block the background fill: Pool 6’s 08:00 EC typed 1.70, then at 11:05 the sensor’s EC 1.0 (a jump over 0.5) fills the 11:00 round with 0 confirm calls and EC "1" saved; a person typing the same jump on Pool 7 is asked once (Cancel → not saved)',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`__tAt('2026-10-13T03:05:00Z');await sleep(50);
    at(T,'08:00','P06','EC','1.70');at(T,'08:00','P07','EC','1.70');
    let asked=0;window.confirm=()=>{asked++;return false;};
    const res=hnxIrrSensorApply(reply([R('P06','11:03',{ec:1.0})]),Date.now());const sensorAsked=asked;
    at(T,'11:00','P07','EC','1.0');await sleep(300);
    return {round:res.round,filled:res.filled,sensorAsked,ec11:rec('P06','11:00').EC,flag:window._autoFillInProgress===true,personAsked:asked-sensorAsked,p7:rec('P07','11:00').EC||''};`),
  expect:{round:'11:00',filled:[{pool:'P06',field:'EC',value:'1'}],sensorAsked:0,ec11:'1',flag:false,personAsked:1,p7:''} },

{ name:'📡 Only an admin or a Pool & Drum Setup editor changes the feed, the token or the meters map: without the right the settings box has Save, the URL, On and the token disabled and says who may change it; saveCfg / setToken / Save / saveMap refuse (hydroPro_irr_sensor_v1, hnxlocal_irr_sensor_token_v1 and hydroPro_irr_meters_map_v1 stay empty); with the right Save is enabled and saveCfg / saveMap work',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const line0=line();const oA=window.isAdmin,oC=window.can;const r={line0};
    try{window.isAdmin=()=>false;window.can=p=>p==='viewIrrigation';
      hnxIrrSensor.open();await sleep(100);const box=document.getElementById('hnxIrrSensorBox');
      r.canEdit=hnxIrrSensor.canEdit();r.saveDisabled=box.querySelector('[data-act="save"]').disabled;r.urlDisabled=box.querySelector('#hnxIsfUrl').disabled;
      r.onDisabled=box.querySelector('#hnxIsfOn').disabled;r.tokDisabled=box.querySelector('#hnxIsfTok').disabled;
      r.who=/Only an admin or someone who can edit ⚙️ Pool & Drum Setup changes the sensor feed/.test(box.textContent);
      r.saved=hnxIrrSensor.saveCfg({url:'https://nexi-irr.test.workers.dev',on:true});r.tok=hnxIrrSensor.setToken('tok-SECRET-7f3a9c2b');r.map=hnxIrrMeters.saveMap({pools:{P01:{off:true}}});r.off=hnxIrrMeters.setPoolOff('P02',true);
      const u=box.querySelector('#hnxIsfUrl');u.disabled=false;u.value='https://elsewhere.example';r.save=hnxIrrSensor.save();
      r.cfg=localStorage.getItem('hydroPro_irr_sensor_v1');r.local=localStorage.getItem('hnxlocal_irr_sensor_token_v1');r.mapKey=localStorage.getItem('hydroPro_irr_meters_map_v1');}
    finally{window.isAdmin=oA;window.can=oC;}
    hnxIrrSensor.close();hnxIrrSensor.open();await sleep(100);
    r.adminEnabled=!document.querySelector('#hnxIrrSensorBox [data-act="save"]').disabled;r.adminSaved=hnxIrrSensor.saveCfg({url:'https://nexi-irr.test.workers.dev',on:false});
    r.adminMap=hnxIrrMeters.saveMap({pools:{P02:{dev:'bhi12345678',tank:'tank2'}}});const mp=hnxIrrMeters.map().pools;r.p02={dev:mp.P02.dev,tank:mp.P02.tank,off:mp.P02.off};r.p01=mp.P01.dev;
    r.after=JSON.parse(localStorage.getItem('hydroPro_irr_sensor_v1')||'{}').url;hnxIrrSensor.close();
    return r;`),
  expect:{line0:'📡 Sensor feed off',canEdit:false,saveDisabled:true,urlDisabled:true,onDisabled:true,tokDisabled:true,who:true,saved:false,tok:false,map:false,off:false,save:false,cfg:null,local:null,mapKey:null,
    adminEnabled:true,adminSaved:true,adminMap:true,p02:{dev:'BHI12345678',tank:'tank2',off:false},p01:'BHIB841A7D1',after:'https://nexi-irr.test.workers.dev'} },

{ name:'📡 The sensor feed is not a safe-mode job: in safe mode (?safe=1) with On, the URL and the token set, the line says "📡 Sensor feed paused (safe mode)", 🩺 Health says "paused (safe mode)" and ↻ Pull now makes no request (0 calls), nothing is filled',
  requires:NEW, tz:'Asia/Manila', seed:new Function(CLOCK+"sessionStorage.setItem('hnx_safe','1');"),
  run:fn(`const safe=window.__HNX_SAFE===true;const calls=[];const f0=window.fetch;
    window.fetch=function(u,o){if(String(u).indexOf('/irr/latest')<0)return f0.apply(this,arguments);calls.push(String(u));return Promise.resolve(new Response(JSON.stringify(reply([R('P01','08:15',{ec:1.62})])),{status:200}));};
    hnxIrrSensor.saveCfg({url:'https://nexi-irr.test.workers.dev',on:true});hnxIrrSensor.setToken('tok-SECRET-7f3a9c2b');
    await hnxIrrSensor.pullNow();await sleep(300);const h=hnxIrrMeters.health();sessionStorage.removeItem('hnx_safe');
    return {safe,text:hnxIrrSensor.statusText(),health:h,calls:calls.length,EC:rec('P01').EC||''};`),
  expect:{safe:true,text:'📡 Sensor feed paused (safe mode)',health:'paused (safe mode)',calls:0,EC:''} },

{ name:'📡 Cloud merge (__hnxMergeIrrPool): a TYPED EC 1.70 (_autoFilled.EC false, stamp …000) beats a SENSOR EC 1.62 (true, stamp …500) in both directions; sensor 1.62 @…000 vs sensor 1.65 @…500 (both true) → 1.65 in both directions and the _sensor block comes from the newer _fieldTimestamps._sensor',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const mk=(ec,auto,ts,sensor)=>{const r={EC:ec,_autoFilled:{EC:auto},_fieldTimestamps:{EC:ts},updatedAt:ts};if(sensor){r._sensor={EC:{ts:sensor.ts,v:ec,node:sensor.node,at:ts}};r._fieldTimestamps._sensor=ts;}return {[T]:{P01:{'08:00':r}}};};
    const merge=(L,R)=>{const o=__hnxMergeIrrPool(JSON.stringify(L),JSON.stringify(R));const out=o.out?JSON.parse(o.out):L;return out[T].P01['08:00'];};
    const typed=mk('1.70',false,1760300000000,null),sensor=mk('1.62',true,1760300500000,{ts:M(T,'08:15'),node:'n1'});
    const a=merge(typed,sensor),b=merge(sensor,typed);
    const s1=mk('1.62',true,1760300000000,{ts:M(T,'08:10'),node:'n1'}),s2=mk('1.65',true,1760300500000,{ts:M(T,'08:19'),node:'n2'});
    const c=merge(s1,s2),d=merge(s2,s1);
    return {a:a.EC,b:b.EC,aAuto:(a._autoFilled||{}).EC,c:c.EC,d:d.EC,cSensor:(c._sensor||{}).EC&&c._sensor.EC.v+'@'+c._sensor.EC.node,dSensor:(d._sensor||{}).EC&&d._sensor.EC.v+'@'+d._sensor.EC.node,cStamp:(c._fieldTimestamps||{})._sensor};`),
  expect:{a:'1.70',b:'1.70',aAuto:false,c:'1.65',d:'1.65',cSensor:'1.65@n2',dSensor:'1.65@n2',cStamp:1760300500000} },

{ name:'📡 One issue per pool + round + field with a FIXED id: Pool 3’s sensor EC 2.30 (critical, above 2.0) at 08:15 → ONE issue "EC out of range in Pool P03 at 08:00" id ISS_irr_2026-10-13_0800_P03_EC priority critical; a second pull with the same reading → still 1; irrRaisePoolIssue(P03, EC, 2.30) called twice more → still 1; createIssue({id:"ISS_x"}) keeps ISS_x and a second createIssue with the same id adds nothing; __hnxMergeGeneric(hydroPro_issues_v2, [copy A], [copy B same id]) → 1 issue; with the pool set to "no meter", a typed 1.80 resolves it and a typed 2.40 REOPENS the same id (history "reopened") — never a second issue',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const ID='ISS_irr_2026-10-13_0800_P03_EC',TITLE='EC out of range in Pool P03 at 08:00';const mine=()=>loadIssues().filter(i=>i&&i.title===TITLE);
    hnxIrrSensorApply(reply([R('P03','08:15',{ec:2.30})]),Date.now());await sleep(300);
    const i1=mine();const first={n:i1.length,id:(i1[0]||{}).id,pri:(i1[0]||{}).priority,status:(i1[0]||{}).status};
    hnxIrrSensorApply(reply([R('P03','08:15',{ec:2.30})]),Date.now());await sleep(200);const n2=mine().length;
    irrRaisePoolIssue('P03','EC',2.30,T,'08:00','08:21');irrRaisePoolIssue('P03','EC',2.30,T,'08:00','08:22');const n3=mine().length;
    const x=createIssue({id:'ISS_x',module:'irrigation',title:'fixed id test',priority:'warning'});const x2=createIssue({id:'ISS_x',module:'irrigation',title:'fixed id test',priority:'warning'});const nx=loadIssues().filter(i=>i&&i.id==='ISS_x').length;
    const A=loadIssues().find(i=>i.id===ID),B=Object.assign({},A,{updatedAt:(A.updatedAt||A.createdAt)+5000,description:A.description+'\\n(copy B)'});
    const m=__hnxMergeGeneric('hydroPro_issues_v2',JSON.stringify([A]),JSON.stringify([B]));const merged=m?JSON.parse(m):[A];const nm=merged.filter(i=>i.id===ID).length;
    hnxIrrMeters.setPoolOff('P03',true);at(T,'08:00','P03','EC','1.80');await sleep(200);const i4=mine();const resolved={n:i4.length,status:(i4[0]||{}).status,auto:(i4[0]||{}).autoResolved};
    at(T,'08:00','P03','EC','2.40');await sleep(200);const i5=mine();const reopened={n:i5.length,id:(i5[0]||{}).id,status:(i5[0]||{}).status,hist:((i5[0]||{}).history||[]).map(h=>h.action).join(',')};
    return {first,n2,n3,xid:x.id,x2same:x2===x||x2.id==='ISS_x',nx,merged:nm,resolved,reopened};`),
  expect:{first:{n:1,id:'ISS_irr_2026-10-13_0800_P03_EC',pri:'critical',status:'open'},n2:1,n3:1,xid:'ISS_x',x2same:true,nx:1,merged:1,resolved:{n:1,status:'resolved',auto:true},reopened:{n:1,id:'ISS_irr_2026-10-13_0800_P03_EC',status:'open',hist:'created,resolved,reopened'}} },

{ name:'📡 Temperature alarms like EC and pH: a typed water temp 30.5 °C on Pool 5’s 08:00 round → issue "Water temp out of range in Pool P05 at 08:00" id ISS_irr_2026-10-13_0800_P05_waterTemp critical; irrPoolAlerts(today) lists {P05, waterTemp, crit, 30.5}; syncPoolSensorsToMaintenance() raises ONE call "💧 Pool Pool 5 · Water temp HIGH (30.5 °C)" (new_call, equipment "Pool sensor (Water temp)") + a task auto_pool_sensor; typed 24.0 → the issue is resolved and the call closed_fixed',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const TITLE='Water temp out of range in Pool P05 at 08:00',SUBJ='💧 Pool Pool 5 · Water temp HIGH (30.5 °C)';
    at(T,'08:00','P05','waterTemp','30.5');await sleep(200);
    const i1=loadIssues().filter(i=>i&&i.title===TITLE);const issue={n:i1.length,id:(i1[0]||{}).id,pri:(i1[0]||{}).priority};
    const al=irrPoolAlerts(T).filter(a=>a.poolId==='P05'&&a.param==='waterTemp').map(a=>({poolId:a.poolId,param:a.param,sev:a.sev,value:a.value}));
    window.__hnxPulledOk=true;syncPoolSensorsToMaintenance();await sleep(200);
    const calls=loadCalls().filter(c=>c&&c.subject===SUBJ);const tasks=loadMaintTasks().filter(t=>t&&t.title===SUBJ);
    const raised={calls:calls.length,status:(calls[0]||{}).status,equipment:(calls[0]||{}).equipment,tasks:tasks.length,cat:(tasks[0]||{}).category};
    at(T,'08:00','P05','waterTemp','24.0');await sleep(200);syncPoolSensorsToMaintenance();await sleep(200);
    const i2=loadIssues().filter(i=>i&&i.title===TITLE);const c2=loadCalls().filter(c=>c&&c.subject===SUBJ);
    return {issue,al,raised,after:{issue:(i2[0]||{}).status,n:i2.length,call:(c2[0]||{}).status,closedBy:(c2[0]||{}).closedBy}};`),
  expect:{issue:{n:1,id:'ISS_irr_2026-10-13_0800_P05_waterTemp',pri:'critical'},al:[{poolId:'P05',param:'waterTemp',sev:'crit',value:30.5}],
    raised:{calls:1,status:'new_call',equipment:'Pool sensor (Water temp)',tasks:1,cat:'auto_pool_sensor'},after:{issue:'resolved',n:1,call:'closed_fixed',closedBy:'system'}} },

{ name:'📡 CALIBRATE and the per-pool sensor tolerance: Pool 1’s sensor EC 1.62 live, hand meter typed 1.70 → "CALIBRATE EC meters — controller 1.62 vs handheld 1.70 (Δ 0.08)", no A; poolMeterDrift → {high, 0.08, critical 0.05}; Pool & Drum Setup 📡 Sensor tolerance EC 0.10 (updatePoolDim sensorEcTol) + irrRecomputeRound → no CALIBRATE, used EC 1.66 → 1.4 L per 10 cm → A 2.8 L (2800 cc), drift {med, 0.08, critical 0.1}; the tolerance applies only while the meter box holds the sensor’s value',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`hnxIrrSensorApply(reply([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40})]),Date.now());await sleep(300);
    at(T,'08:00','P01','manualEC','1.70');await sleep(300);
    const r1=rec('P01');const p=()=>loadIrrPools().find(x=>x.id==='P01');
    const d1=poolMeterDrift(p(),'1.70','1.62','EC',r1);
    const before={cal:r1._calibrate||'',A:r1.A||'',drift:{status:d1.status,diff:d1.diff,critical:d1.critical}};
    updatePoolDim('P01','sensorEcTol',0.10);await sleep(100);irrRecomputeRound();await sleep(300);
    const r2=rec('P01');const d2=poolMeterDrift(p(),'1.70','1.62','EC',r2);const u=irrUsedReading(p(),r2);
    const typedRec=Object.assign({},r2,{EC:'1.63'});const d3=poolMeterDrift(p(),'1.70','1.63','EC',typedRec);
    return {before,after:{cal:r2._calibrate||'',ec:(r2._dose||{}).ec,per10:(r2._dose||{}).per10L,A:r2.A,aCC:(r2._dose||{}).aCC,used:u.ec,drift:{status:d2.status,diff:d2.diff,critical:d2.critical}},typedCrit:d3.critical,tol:p().dim.sensorEcTol};`),
  expect:{before:{cal:'CALIBRATE EC meters — controller 1.62 vs handheld 1.70 (Δ 0.08)',A:'',drift:{status:'high',diff:0.08,critical:0.05}},
    after:{cal:'',ec:1.66,per10:1.4,A:2.8,aCC:2800,used:1.66,drift:{status:'med',diff:0.08,critical:0.1}},typedCrit:0.05,tol:0.1} },

{ name:'🔌 Meters screen: after a reply with Pool 1 at 08:15 (node tap-room1-2) and Pool 5 at 07:30 (node proleaf-mail), Irrigation → 🔌 Meters lists 12 pools in order P01 … P10, P11A, P11B; P01 "🟢 Live 08:15" source "our node (tap-room1-2)" EC 1.62; P05 "🟠 Stale 50 min" source "BeHive-I via bridge"; P09 "⚫ Never" with its 2024 device BHIA08FB2F7 prefilled; P02 "⚪ No meter"; "What is missing" names "No meter mapped: P02, P04, P08, P11A, P11B"; P01’s device box holds BHIB841A7D1; the Pool Monitor toolbar has the 🔌 Meters button',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`const btn=!!document.querySelector('#stubIrrNutrientsBody button[onclick*="irr_meters"]');
    hnxIrrSensorApply(reply([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40}),R('P05','07:30',{ec:1.9,wt:30.1},T,'proleaf-mail')]),Date.now());await sleep(300);
    switchView('irr_meters');await sleep(600);
    const body=document.getElementById('irrMetersBody');const rows=[...body.querySelectorAll('tr[data-pool]')];
    const cell=(id,k)=>{const tr=body.querySelector('tr[data-pool="'+id+'"]');const c=tr&&tr.querySelector('td[data-k="'+k+'"]');return c?c.textContent.trim():null;};
    const dev=id=>{const i=body.querySelector('tr[data-pool="'+id+'"] input[data-k="dev"]');return i?i.value:null;};
    const miss=(body.querySelector('.hnx-mt-missing')||{}).textContent||'';
    return {btn,n:rows.length,order:rows.map(r=>r.getAttribute('data-pool')).join(','),active:document.getElementById('view-irr_meters').classList.contains('active'),
      p01:{st:cell('P01','st'),src:cell('P01','src'),ec:cell('P01','ec'),dev:dev('P01')},p05:{st:cell('P05','st'),src:cell('P05','src'),wt:cell('P05','wt')},
      p09:{st:cell('P09','st'),dev:dev('P09')},p02:{st:cell('P02','st'),dev:dev('P02')},missing:/No meter mapped: P02, P04, P08, P11A, P11B/.test(miss),never:/Mapped but never reported: P03 \\(BHIA8B53B70\\)/.test(miss),title:/🔌 Pool meters — BeHive-I and nodes → Nexi/.test(body.textContent)};`),
  expect:{btn:true,n:12,order:'P01,P02,P03,P04,P05,P06,P07,P08,P09,P10,P11A,P11B',active:true,p01:{st:'🟢 Live 08:15',src:'our node (tap-room1-2)',ec:'1.62',dev:'BHIB841A7D1'},p05:{st:'🟠 Stale 50 min',src:'BeHive-I via bridge',wt:'30.1'},
    p09:{st:'⚫ Never',dev:'BHIA08FB2F7'},p02:{st:'⚪ No meter',dev:''},missing:true,never:true,title:true} },

{ name:'📡 One feeder (the lease): after the first OK pull hydroPro_irr_meters_lease_v1.dev is this computer (hnx_device_id) and the line says "feeder"; with another computer’s lease 2 minutes old (jomel on dev_other) a pull returns "watching", fills 0 (Pool 6’s EC stays empty) and the line says "watching (feeder: jomel)", Health says "watching (jomel) · 2/12 live" (a watcher sees the worker’s readings too); with that lease 11 minutes old this computer takes over and fills Pool 6',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`await feed([R('P01','08:15',{ec:1.62})]);
    const L1=hnxIrrMeters.lease();const first={mine:L1.dev===localStorage.getItem('hnx_device_id'),user:L1.user,line:/feeder · 1 pool filled/.test(line())};
    localStorage.setItem('hydroPro_irr_meters_lease_v1',JSON.stringify({_lww:true,dev:'dev_other',user:'jomel',at:Date.now()-2*60000,updatedAt:Date.now()}));
    const res=hnxIrrSensorApply(reply([R('P06','08:17',{ec:1.6})]),Date.now());await sleep(300);hnxIrrMeters.decorate();
    const watching={w:!!res.watching&&res.watching.user,filled:res.filled.length,ec:rec('P06').EC||'',line:/watching \\(feeder: jomel\\)/.test(line()),health:hnxIrrMeters.health(),lease:hnxIrrMeters.lease().dev};
    localStorage.setItem('hydroPro_irr_meters_lease_v1',JSON.stringify({_lww:true,dev:'dev_other',user:'jomel',at:Date.now()-11*60000,updatedAt:Date.now()}));
    const res2=hnxIrrSensorApply(reply([R('P06','08:18',{ec:1.6})]),Date.now());await sleep(300);hnxIrrMeters.decorate();
    const took={w:!!res2.watching,filled:res2.filled.length,ec:rec('P06').EC,mine:hnxIrrMeters.lease().dev===localStorage.getItem('hnx_device_id'),line:/feeder/.test(line())};
    return {first,watching,took};`),
  expect:{first:{mine:true,user:'tester',line:true},watching:{w:'jomel',filled:0,ec:'',line:true,health:'watching (jomel) · 2/12 live',lease:'dev_other'},took:{w:false,filled:1,ec:'1.6',mine:true,line:true}} },

{ name:'📒 Readings Report + 🩺 Nexi Health: Pool 1’s sensor-filled 08:00 round shows 📡 on the EC cell (not ⚡), the row is "sensor only — hand meter not entered" until the hand meter is typed; the guardian record of this computer has meters "feeder · ok hh:mm · 1/12 live" and the 🩺 panel says "🔌 Pool meters: 1 of 12 live" under a "🔌 Meters" column',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`await feed([R('P01','08:15',{ec:1.62,ph:6.1,wt:24.5,level_cm:40})]);
    switchView('irr_readings');await sleep(700);hnxIrrReadings.setPeriod('today');await sleep(200);
    const row=()=>document.querySelector('#irrReadingsBody .hnx-rr-sec[data-pool="P01"] tr[data-date="'+T+'"][data-round="08:00"]');
    const r1=row();const ec=r1&&r1.querySelector('td[data-f="EC"]'),a=r1&&r1.querySelector('td[data-f="A"]');
    const before={sensor:!!(ec&&ec.querySelector('.hnx-rr-sensor')),auto:!!(ec&&ec.querySelector('.hnx-rr-auto')),aAuto:!!(a&&a.querySelector('.hnx-rr-auto')),only:r1.classList.contains('hnx-rr-sensoronly'),txt:/📡 sensor only — hand meter not entered/.test(r1.textContent),title:(ec.querySelector('.hnx-rr-sensor')||{}).title||''};
    at(T,'08:00','P01','manualEC','1.64');hnxIrrReadings.render();await sleep(300);const r2=row();
    const after={only:r2.classList.contains('hnx-rr-sensoronly'),txt:/sensor only/.test(r2.textContent),sensor:!!r2.querySelector('td[data-f="EC"] .hnx-rr-sensor')};
    const m=window.__hnxGuardian.runNow();const arr=JSON.parse(localStorage.getItem('hydroPro_health_v1')||'[]');const mine=arr.find(r=>r.id===localStorage.getItem('hnx_device_id'))||{};
    window.hnxHealthPanel();await sleep(100);const p=document.getElementById('hnxHealthPanel');const txt=p?p.textContent:'';const ths=[...p.querySelectorAll('thead th')].map(t=>t.textContent);
    return {before,after,meters:/^feeder · ok \\d\\d:\\d\\d · 1\\/12 live$/.test(mine.meters||''),metersTxt:mine.meters,amber:!!m.metersAmber,panel:/🔌 Pool meters: 1 of 12 live/.test(txt),col:ths.indexOf('🔌 Meters')>=0,cols:ths.length,cell:/feeder · ok/.test(txt)};`),
  expect:{before:{sensor:true,auto:false,aAuto:true,only:true,txt:true,title:'from the pool sensor (tap-room1-2) at 08:15'},after:{only:false,txt:false,sensor:true},meters:true,amber:false,panel:true,col:true,cols:11,cell:true} }
];
