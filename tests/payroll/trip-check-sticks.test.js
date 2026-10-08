/* v22.18 (hotfix of v22.16; v22.19 on the trial) — a logistics check (and a final approval) sticks.
   Jinky, 8 Oct 2026, the night before payday: "I'm unable to approve them because the system shows that the logistics
   check is still pending. In reality, Syra has already checked."
   The Deliveries→Trips bridge runs on every open Nexi. It re-opened checked AND approved days whenever the computer it
   ran on worked the trips out differently - its own GPS trace of the truck, its roster, its rate table - and the
   re-opened copy won on every computer. These cases play two computers on one page: "Syra's computer" holds the GPS
   trace of truck NIF-6891 (it splits the day into 2 rounds), "the other computer" holds none (1 round). Switching
   computers = swapping the GPS store and moving the clock 61 s on (the bridge caches its GPS rounds for 60 s).
   Rates: MANILA d1/h1 ₱0 (1st trip is in the daily rate), d2/h2 ₱200 / ₱75; CLARK d2/h2 ₱500 / ₱200. */
const SEED_BODY=`
  localStorage.setItem('hnx_first_boot','2026-01-01');
  var pad=function(n){return (n<10?'0':'')+n;};
  var ymd=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
  var back=function(n){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);return ymd(d);};
  var DAY=back(1),DAY2=back(2),DAY3=back(3);
  localStorage.setItem('hnxTest_days',JSON.stringify([DAY,DAY2,DAY3]));
  var lab=function(id,name,pos){return {id:id,name:name,position:pos,status:'Active',salaryCategory:'Regular',dept:'Logistics',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'};};
  localStorage.setItem('hydroPro_employees',JSON.stringify([lab('E1','OLAZO, ARCADIO JR','Driver'),lab('E2','MANALO, LIMUEL','Helper')]));
  var areas=[{id:'manila',name:'MANILA, PASAY, BGC, MAKATI, MANDALUYONG',d1:0,h1:0,d2:200,h2:75},{id:'clark',name:'CLARK CITY',d1:0,h1:0,d2:500,h2:200}];
  localStorage.setItem('hydroPro_trip_rates_v1',JSON.stringify({draft:{areas:JSON.parse(JSON.stringify(areas))},live:{areas:JSON.parse(JSON.stringify(areas))},liveApprovedBy:'Jinky',liveApprovedAt:1790000000000,draftDirty:false,airportSeeded:true,updatedAt:1790000000000}));
  localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([{id:'V1',name:'NIF-6891',plate:'NIF-6891'}]));
  var row=function(id,date,hhmm,extra){var t=Date.parse(date+'T'+hhmm+':00');var r={id:id,date:date,destination:'Makati '+id,customer:'Cust '+id,vehicleId:'V1',driverId:'E1',helperId:'E2',areaId:'manila',areaAuto:false,status:'delivered',createdAt:t,updatedAt:t};for(var k in (extra||{}))r[k]=extra[k];return r;};
  var rows=[row('dl2',DAY,'07:01'),row('dl1',DAY,'07:00')];
  if(window.__hnxTestRows)rows=window.__hnxTestRows(row,DAY,DAY2,DAY3);
  localStorage.setItem('hydroPro_log_deliveries',JSON.stringify(rows));
  localStorage.setItem('hydroPro_trip_log_v1',JSON.stringify(window.__hnxTestLog?window.__hnxTestLog(DAY,DAY2,DAY3):[]));
  /* the truck's GPS trace: farm → drop → farm → drop → farm = 2 rounds, on each test date */
  var farm={lat:14.6,lng:121.0},X={lat:14.65,lng:121.05},Y={lat:14.55,lng:121.02},pts=[];
  var trace=function(date){var at=function(h){return Date.parse(date+'T'+h+':00');};
    var dwell=function(p,s,min){for(var i=0;i<=min;i++)pts.push({ts:s+i*60000,lat:p.lat,lng:p.lng,speed:0});};
    var drive=function(a,b,s,n){for(var i=1;i<n;i++)pts.push({ts:s+i*60000,lat:a.lat+(b.lat-a.lat)*i/n,lng:a.lng+(b.lng-a.lng)*i/n,speed:40});};
    dwell(farm,at('06:00'),10);drive(farm,X,at('06:10'),30);dwell(X,at('06:40'),15);drive(X,farm,at('06:55'),30);
    dwell(farm,at('07:25'),15);drive(farm,Y,at('07:40'),30);dwell(Y,at('08:10'),15);drive(Y,farm,at('08:25'),30);dwell(farm,at('08:55'),15);};
  trace(DAY3);trace(DAY2);trace(DAY);
  var gps=JSON.stringify({V1:pts});
  localStorage.setItem('hnxTest_gps',gps);
  localStorage.setItem('hydroPro_fleet_gps_positions',window.__hnxTestStartNoGps?'{}':gps); /* the page starts as Syra's computer unless a case says otherwise */
  localStorage.setItem('hydroPro_fleet_gps_config',JSON.stringify({source:'gps18_manual',stopThresholdMin:5,geofences:[{name:'Farm (Pardes)',lat:farm.lat,lng:farm.lng,radius:200}]}));
`;
const seedWith=(extra)=>new Function((extra||'')+SEED_BODY);
/* page-side helpers (kept as text: each run() is stringified into the page) */
const H=`
  const DAYS=JSON.parse(localStorage.getItem('hnxTest_days'));const DAY=DAYS[0],DAY2=DAYS[1],DAY3=DAYS[2];
  const GPS=localStorage.getItem('hnxTest_gps');
  const LK='hydroPro_trip_log_v1',DK='hydroPro_log_deliveries';
  const idOf=d=>'dlvday_'+d+'_e1';
  const day=id=>JSON.parse(localStorage.getItem(LK)||'[]').filter(d=>d&&d.id===id)[0]||{};
  const realNow=Date.now.bind(Date);let skew=0;Date.now=()=>realNow()+skew;
  /* run the bridge as "a computer" holding this GPS store (61 s later, past the bridge's 60 s GPS cache) */
  const pc=gps=>{localStorage.setItem('hydroPro_fleet_gps_positions',gps);skew+=61000;return hnxTripBridge.sync({force:true})||{};};
  const SYRA=()=>pc(GPS),OTHER=()=>pc('{}');
  const weekOf=d=>{const t=new Date(d+'T12:00:00');t.setDate(t.getDate()-6);const p=n=>(n<10?'0':'')+n;return t.getFullYear()+'-'+p(t.getMonth()+1)+'-'+p(t.getDate());};
  const pay=d=>{const o={};JSON.parse(localStorage.getItem('hydroPro_employees')).filter(e=>e&&(e.id==='E1'||e.id==='E2')).forEach(e=>{try{o[e.id]=calcEmployeePayroll(e,weekOf(d),d,'weekly').tripIncentive||0;}catch(x){o[e.id]='threw '+x.message;}});return o;};
  const cell=async d=>{switchView('pay_trips');await sleep(1800);try{if(window.hnxTripTab)window.hnxTripTab('log');}catch(e){}await sleep(600);
    const v=document.getElementById('view-pay_trips');const tr=[...v.querySelectorAll('tr')].filter(t=>(t.innerText||'').indexOf(d)>=0&&/MANILA|CLARK|earlier/.test(t.innerText||''))[0];
    return tr?tr.innerText.replace(/\\s+/g,' '):'(no row)';};
`;
const H2=`
  const getL=()=>JSON.parse(localStorage.getItem(LK)||'[]'),setL=v=>localStorage.setItem(LK,JSON.stringify(v));
  /* the cloud merge of the trip log: per day, the copy with the newer updatedAt wins (a tie keeps the local copy) */
  const mergeL=(local,remote)=>{const m={},o=[];local.forEach(d=>{m[d.id]=d;o.push(d.id);});remote.forEach(d=>{const c=m[d.id];if(!c){m[d.id]=d;o.push(d.id);}else if((+d.updatedAt||0)>(+c.updatedAt||0))m[d.id]=d;});return o.map(k=>m[k]);};
  const addRow=(r)=>{const D=JSON.parse(localStorage.getItem(DK));D.unshift(r);localStorage.setItem(DK,JSON.stringify(D));};
  const editRow=(id,patch)=>{const D=JSON.parse(localStorage.getItem(DK));D.forEach(r=>{if(r&&r.id===id)Object.assign(r,patch);});localStorage.setItem(DK,JSON.stringify(D));};
  const clark=(id,trip,t)=>({id:id,date:DAY,destination:'Clark '+id,customer:'Cust '+id,vehicleId:'V1',driverId:'E1',helperId:'E2',areaId:'clark',areaAuto:false,trip:trip,status:'delivered',createdAt:t,updatedAt:t});
`;
const run=fn=>new Function('return (async()=>{'+H+H2+' try{ return await ('+fn.toString()+')(); } finally { Date.now=realNow; } })();');
/* two computers, each with its OWN trip log, deliveries store, rate table and GPS store; merge() = the cloud merge of
   both stores (per record, the newer updatedAt wins, a tie keeps the local copy). A = Syra's computer (truck GPS, full
   rate table), B = the other computer (no GPS; noClark() takes the CLARK zone out of its rate table). */
const H3=`
  const RK='hydroPro_trip_rates_v1',FULL=localStorage.getItem(RK);
  const r0=JSON.parse(FULL);[r0.live,r0.draft].forEach(o=>{o.areas=o.areas.filter(a=>a.id!=='clark');});const NOCLARK=JSON.stringify(r0);
  const getD=()=>JSON.parse(localStorage.getItem(DK)||'[]'),setD=v=>localStorage.setItem(DK,JSON.stringify(v));
  const W={A:{L:getL(),D:getD(),rates:FULL,gps:GPS},B:{L:getL(),D:getD(),rates:FULL,gps:'{}'}};
  const noClark=k=>{W[k].rates=NOCLARK;};
  const on=(k,fn)=>{const w=W[k];setL(w.L);setD(w.D);localStorage.setItem(RK,w.rates);localStorage.setItem('hydroPro_fleet_gps_positions',w.gps);skew+=61000;
    const r=fn?fn():(hnxTripBridge.sync({force:true})||{});w.L=getL();w.D=getD();return r||{};};
  const merge=()=>{const a=W.A,b=W.B;const LA=mergeL(a.L,b.L),LB=mergeL(b.L,a.L),DA=mergeL(a.D,b.D),DB=mergeL(b.D,a.D);a.L=LA;b.L=LB;a.D=DA;b.D=DB;};
  const pick=(k,id)=>W[k].L.filter(d=>d&&d.id===id)[0]||{};
  /* n rounds of: A's pass, B's pass, merge - returns the writes per round and both copies' updatedAt */
  const settle=(id,n)=>{const out=[];for(let i=0;i<n;i++){const ra=on('A'),rb=on('B');merge();
    out.push({w:(ra.updated||0)+(rb.updated||0)+(ra.built||0)+(rb.built||0)+(ra.reopened||0)+(rb.reopened||0)+(ra.removed||0)+(rb.removed||0),a:pick('A',id).updatedAt,b:pick('B',id).updatedAt});}return out;};
  const quiet=R=>R.every(x=>x.w===0&&x.a===x.b&&x.a===R[0].a);
  const payOn=(k,d)=>{setL(W[k].L);setD(W[k].D);localStorage.setItem(RK,FULL);return pay(d);};
`;
const run3=fn=>new Function('return (async()=>{'+H+H2+H3+' try{ return await ('+fn.toString()+')(); } finally { Date.now=realNow; } })();');
/* a 3-round trace on DAY (the seed trace + farm 09:10 → X 09:40 → farm 10:25) and a blank-trip drop */
const H4=`
  const G3=(()=>{const G=JSON.parse(GPS);const farm={lat:14.6,lng:121.0},X={lat:14.65,lng:121.05};const at=h=>Date.parse(DAY+'T'+h+':00');
    const pts=G.V1;const dwell=(p,s,min)=>{for(let i=0;i<=min;i++)pts.push({ts:s+i*60000,lat:p.lat,lng:p.lng,speed:0});};
    const drive=(a,b,s,n)=>{for(let i=1;i<n;i++)pts.push({ts:s+i*60000,lat:a.lat+(b.lat-a.lat)*i/n,lng:a.lng+(b.lng-a.lng)*i/n,speed:40});};
    drive(farm,X,at('09:10'),30);dwell(X,at('09:40'),15);drive(X,farm,at('09:55'),30);dwell(farm,at('10:25'),15);
    pts.sort((a,b)=>a.ts-b.ts);return JSON.stringify(G);})();
  const blank=(id,area,t,extra)=>Object.assign({id:id,date:DAY,destination:(area==='clark'?'Clark ':'Pasay ')+id,customer:'Cust '+id,vehicleId:'V1',driverId:'E1',helperId:'E2',areaId:area,areaAuto:false,status:'delivered',createdAt:t,updatedAt:t},extra||{});
  const sum=d=>(d.status||'-')+'/'+(d.trips||[]).join(',');
`;
const run4=fn=>new Function('return (async()=>{'+H+H2+H3+H4+' try{ return await ('+fn.toString()+')(); } finally { Date.now=realNow; } })();');
const THREE=`window.__hnxTestRows=function(row,DAY){return [row('dl3',DAY,'07:02',{areaId:'clark',trip:3,destination:'Clark'}),row('dl2',DAY,'07:01'),row('dl1',DAY,'07:00')];};`;

module.exports=[
{ name:'✔ check sticks (v22.18): a day Syra checked with 2 GPS rounds (MANILA 1st ₱0 → MANILA 2nd D ₱200 / H ₱75) stays checked by her, 2 trips, untouched, when the other computer without the GPS trace runs its bridge — and that computer never rewrites the pending day either',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();const built=day(id);                       /* Syra's computer built it: 2 rounds from its GPS */
    OTHER();const pend=day(id);                       /* the other computer, day still pending */
    SYRA();hnxTripLogCheck(id);const checked=day(id); /* Syra presses ✔ Check */
    const r=OTHER();const onOther=day(id);            /* v22.16 re-opened it here: "trips 2→1 … by <other>" */
    SYRA();const back=day(id);
    return {builtTrips:(built.trips||[]).length,pendingKept:pend.updatedAt===built.updatedAt&&(pend.trips||[]).length===2,
      checkedBy:checked.checkedBy,status:onOther.status,stillBy:onOther.checkedBy||null,trips:(onOther.trips||[]).length,reopened:r.reopened||0,
      untouched:onOther.updatedAt===checked.updatedAt,backOnSyra:back.status,noFlip:back.updatedAt===checked.updatedAt};}),
  expect:{builtTrips:2,pendingKept:true,checkedBy:'Tester',status:'checked',stillBy:'Tester',trips:2,reopened:0,untouched:true,backOnSyra:'checked',noFlip:true} },

{ name:'✅ approval sticks (v22.18): a day approved at 2 trips is frozen at driver ₱200 / helper ₱75, stays approved when the other computer without the GPS trace runs its bridge, and payroll still pays OLAZO ₱200 and MANALO ₱75 (v22.16 re-opened it and paid ₱0 / ₱0)',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();hnxTripLogApprove(id);const ap=day(id);   /* "approve anyway" (confirm accepted) */
    const before=pay(DAY);
    const r=OTHER();const d=day(id);const after=pay(DAY);
    SYRA();const d2=day(id);
    return {approved:ap.status,pricedD:ap.pricedD,pricedH:ap.pricedH,before,status:d.status,approvedBy:d.approvedBy||null,reopened:r.reopened||0,
      untouched:d.updatedAt===ap.updatedAt,after,stillApproved:d2.status};}),
  expect:{approved:'approved',pricedD:200,pricedH:75,before:{E1:200,E2:75},status:'approved',approvedBy:'Tester',reopened:0,untouched:true,after:{E1:200,E2:75},stillApproved:'approved'} },

{ name:'↺ a REAL change still re-opens (v22.18): a CLARK 3rd-trip drop added after the check sends the day back (trips 2→3), keeps who checked it, the pending cell says “was ✔ checked by logistics by Tester … why: deliveries changed after the logistics check (1 delivery row added, trips 2→3”, the other computer leaves it alone, and once approved it pays D ₱700 / H ₱275',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();hnxTripLogCheck(id);const checked=day(id);
    /* Syra adds a drop: Clark, typed as the 3rd trip of the day */
    skew+=5000; /* a few seconds after the check (in the same millisecond the check would already cover it) */
    const D=JSON.parse(localStorage.getItem(DK));const t=Date.now();
    D.unshift({id:'dl3',date:DAY,destination:'Clark',customer:'Cust C',vehicleId:'V1',driverId:'E1',helperId:'E2',areaId:'clark',areaAuto:false,trip:3,status:'delivered',createdAt:t,updatedAt:t});
    localStorage.setItem(DK,JSON.stringify(D));
    const r=SYRA();const d=day(id);
    const txt=await cell(DAY);
    const r2=OTHER();const onOther=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {reopened:r.reopened,status:d.status,prevStatus:d.prevStatus,prevCheckedBy:d.prevCheckedBy,trips:d.trips,
      reason:/^deliveries changed after the logistics check \(1 delivery row added, trips 2→3 /.test(d.reapproveReason||''),
      cellWas:/pending again — was ✔ checked by logistics by Tester/.test(txt),cellWhy:/why: deliveries changed after the logistics check/.test(txt),
      otherReopened:r2.reopened||0,otherUntouched:onOther.updatedAt===d.updatedAt,approved:ap.status,pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{reopened:1,status:'pending',prevStatus:'checked',prevCheckedBy:'Tester',trips:['manila','manila','clark'],reason:true,cellWas:true,cellWhy:true,
    otherReopened:0,otherUntouched:true,approved:'approved',pricedD:700,pricedH:275,pay:{E1:700,E2:275}} },

{ name:'🔁 one-time restore (v22.18): a day v22.16 re-opened "trips 2→1 … by Jinky" with no delivery change gets Syra’s check back once (checked by Syra, 2 trips = D ₱200 / H ₱75 to approve); a day whose delivery was edited a minute before the re-open stays pending and says why; a day re-opened from APPROVED is never approved by itself',
  seed:seedWith(`
    window.__hnxTestRows=function(row,DAY,DAY2,DAY3){
      var R2=Date.now()-2*3600000;
      return [row('dl2',DAY,'07:01'),row('dl1',DAY,'07:00'),
              row('dl5',DAY2,'07:01',{updatedAt:R2-60000}),row('dl4',DAY2,'07:00'),   /* dl5 edited 1 minute before its day was re-opened */
              row('dl7',DAY3,'07:01'),row('dl6',DAY3,'07:00')];
    };
    window.__hnxTestLog=function(DAY,DAY2,DAY3){
      var R=Date.now()-2*3600000;
      var day=function(date,ids,prev){return {id:'dlvday_'+date+'_e1',date:date,truck:'NIF-6891',trucks:['NIF-6891'],driverId:'E1',driverName:'OLAZO, ARCADIO JR',helperId:'E2',helperName:'MANALO, LIMUEL',
        trips:['manila'],rounds:[{no:1,areaId:'manila',other:false,drops:ids}],deliveryIds:ids,status:'pending',prevStatus:prev,
        reapproveReason:'deliveries changed (trips 2→1 [MANILA, PASAY, BGC, MAKATI, MANDALUYONG]) on '+DAY+' by Jinky',
        source:'deliveries',createdBy:'bridge/Syra',createdAt:R-5*3600000,updatedAt:R,bridgedAt:R};};
      /* Syra's computer: its audit log holds her check of the first day, half an hour before the re-open */
      localStorage.setItem('hydroPro_audit',JSON.stringify([{ts:new Date(R-1800000).toISOString(),u:'syra',r:'operator',a:'payroll',d:'Trip day CHECKED by logistics: '+DAY+' truck NIF-6891 by Syra',gh:''}]));
      return [day(DAY,['dl1','dl2'],'checked'),day(DAY2,['dl4','dl5'],'checked'),day(DAY3,['dl6','dl7'],'approved')];
    };`),
  run:run(async()=>{
    await sleep(1500);
    SYRA();                                            /* the bridge on Syra's computer (it already ran once at start-up) */
    const a=day(idOf(DAY)),b=day(idOf(DAY2)),c=day(idOf(DAY3));
    const r=SYRA();const a2=day(idOf(DAY));               /* once: nothing more happens */
    const r3=OTHER();const a3=day(idOf(DAY));             /* and the computer without the trace leaves it alone */
    const txt=await cell(DAY2);
    const L=JSON.parse(localStorage.getItem(LK)||'[]');
    return {restored:a.status,by:a.checkedBy,trips:(a.trips||[]).length,flag:!!a.checkRestoredAt,reasonGone:a.reapproveReason===undefined,
      once:r.restored===0&&a2.updatedAt===a.updatedAt,otherKeeps:a3.status==='checked'&&a3.updatedAt===a.updatedAt&&(r3.reopened||0)===0,
      realEdit:b.status,wasApproved:c.status,approvedNone:L.filter(d=>d&&d.status==='approved').length,
      cellWas:/pending again — was ✔ checked by logistics/.test(txt),cellWhy:/why: deliveries changed \(trips 2→1/.test(txt)};}),
  expect:{restored:'checked',by:'Syra',trips:2,flag:true,reasonGone:true,once:true,otherKeeps:true,realEdit:'pending',wasApproved:'pending',approvedNone:0,cellWas:true,cellWhy:true} },
{ name:'➕ (v22.18) a drop typed BEFORE Syra’s ✔ Check but synced to her computer AFTER it (CLARK 3rd trip, stamped 5 s before the check) still re-opens the day (trips 2→3, “1 delivery row added”), the computer without the GPS trace leaves it alone, and approved it pays D ₱700 / H ₱275 — not ₱200 / ₱75',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();const t=Date.now();skew+=5000;hnxTripLogCheck(id);const ck=day(id);   /* dl3 exists elsewhere, stamped t; Syra checks 5 s later */
    addRow(clark('dl3',3,t));                                                  /* … and it reaches her computer after the check */
    const r=SYRA();const d=day(id);
    const r2=OTHER();const o=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {checked:ck.status,reopened:r.reopened,status:d.status,prevCheckedBy:d.prevCheckedBy,trips:d.trips,ids:(d.deliveryIds||[]).slice().sort(),
      reason:/^deliveries changed after the logistics check \(1 delivery row added, trips 2→3 /.test(d.reapproveReason||''),
      otherKeeps:(r2.reopened||0)===0&&o.updatedAt===d.updatedAt,pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{checked:'checked',reopened:1,status:'pending',prevCheckedBy:'Tester',trips:['manila','manila','clark'],ids:['dl1','dl2','dl3'],reason:true,otherKeeps:true,pricedD:700,pricedH:275,pay:{E1:700,E2:275}} },

{ name:'➕ (v22.18) the same after a final approval — a CLARK 3rd-trip drop stamped before the approval but synced after it sends the approved day back for approval (“was ✅ approved by Tester”, previous ₱200 / ₱75 kept on the record), and re-approved it pays D ₱700 / H ₱275',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();const t=Date.now();skew+=5000;hnxTripLogApprove(id);const ap0=day(id);const pay0=pay(DAY);
    addRow(clark('dl3',3,t));
    const r=SYRA();const d=day(id);
    const txt=await cell(DAY);
    hnxTripLogApprove(id);const ap=day(id);
    return {approved:ap0.status,pay0,reopened:r.reopened,status:d.status,prevStatus:d.prevStatus,prevApprovedBy:d.prevApprovedBy,prevPriced:[d.prevPricedD,d.prevPricedH],trips:d.trips,
      reason:/^deliveries changed after approval \(1 delivery row added, trips 2→3 /.test(d.reapproveReason||''),cellWas:/pending again — was ✅ approved by Tester/.test(txt),
      pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{approved:'approved',pay0:{E1:200,E2:75},reopened:1,status:'pending',prevStatus:'approved',prevApprovedBy:'Tester',prevPriced:[200,75],trips:['manila','manila','clark'],reason:true,cellWas:true,pricedD:700,pricedH:275,pay:{E1:700,E2:275}} },

{ name:'🕰 (v22.18) a drop created 10 minutes BEFORE the day was built but synced later (CLARK 4th trip, an encoder on a slow line) joins the checked day by membership — trips MANILA → MANILA → earlier run → CLARK, and approved it pays D ₱700 / H ₱275',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();hnxTripLogCheck(id);
    addRow(clark('dl8',4,Date.parse(DAY+'T06:50:00')));      /* older than every row of the day */
    const r=SYRA();const d=day(id);
    const r2=OTHER();const o=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {reopened:r.reopened,status:d.status,trips:d.trips,hasDl8:(d.deliveryIds||[]).indexOf('dl8')>=0,otherKeeps:(r2.reopened||0)===0&&o.updatedAt===d.updatedAt,
      pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{reopened:1,status:'pending',trips:['manila','manila','_prior','clark'],hasDl8:true,otherKeeps:true,pricedD:700,pricedH:275,pay:{E1:700,E2:275}} },

{ name:'📥 (v22.18) a day built by v22.16 (no record of its rows) that does not hold a CLARK 3rd-trip drop already in Deliveries (stamped before that build) picks it up when adopted: checked by Syra → pending (1 delivery row added, trips 2→3), and approved it pays D ₱700 / H ₱275 — it is not frozen at ₱200 / ₱75',
  seed:seedWith(`
    window.__hnxTestRows=function(row,DAY){var R=Date.now()-10*60000;return [row('dl3',DAY,'07:02',{areaId:'clark',trip:3,destination:'Clark',updatedAt:R-5*60000}),row('dl2',DAY,'07:01'),row('dl1',DAY,'07:00')];};
    window.__hnxTestLog=function(DAY){var R=Date.now()-10*60000;
      return [{id:'dlvday_'+DAY+'_e1',date:DAY,truck:'NIF-6891',trucks:['NIF-6891'],driverId:'E1',driverName:'OLAZO, ARCADIO JR',helperId:'E2',helperName:'MANALO, LIMUEL',
        trips:['manila','manila'],rounds:[{no:1,areaId:'manila',other:false,drops:['dl1']},{no:2,areaId:'manila',other:false,drops:['dl2']}],deliveryIds:['dl1','dl2'],
        status:'checked',checkedBy:'Syra',checkedAt:R+60000,source:'deliveries',createdBy:'bridge/Syra',createdAt:R-3600000,updatedAt:R+60000,bridgedAt:R}];};`),
  run:run(async()=>{
    await sleep(1500);
    const id=idOf(DAY);
    SYRA();const d=day(id);
    const r2=OTHER();const o=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {status:d.status,prevCheckedBy:d.prevCheckedBy,trips:d.trips,hasDl3:(d.deliveryIds||[]).indexOf('dl3')>=0,
      reason:/^deliveries changed after the logistics check \(1 delivery row added, trips 2→3 /.test(d.reapproveReason||''),
      otherKeeps:(r2.reopened||0)===0&&o.updatedAt===d.updatedAt,pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{status:'pending',prevCheckedBy:'Syra',trips:['manila','manila','clark'],hasDl3:true,reason:true,otherKeeps:true,pricedD:700,pricedH:275,pay:{E1:700,E2:275}} },

{ name:'✏ (v22.18) Syra corrects the area of the 2nd-trip drop (MANILA → CLARK) on a checked day; the computer without the GPS trace runs its bridge before it has her new trip log — BOTH computers keep the drop as the 2nd trip (MANILA → CLARK), the GPS copy wins, nobody rewrites after, and approved it pays D ₱500 / H ₱200 (not CLARK as a ₱0 1st trip)',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    SYRA();hnxTripLogCheck(id);const L0=getL();
    skew+=1000;editRow('dl2',{areaId:'clark',updatedAt:Date.now()});
    OTHER();const LB=getL(),b=LB.filter(d=>d.id===id)[0];          /* the computer without the trace, from the checked copy */
    setL(L0);SYRA();const LA=getL(),a=LA.filter(d=>d.id===id)[0];   /* Syra's computer, from the same checked copy */
    const W1=mergeL(LA,LB).filter(d=>d.id===id)[0],W2=mergeL(LB,LA).filter(d=>d.id===id)[0];
    setL(mergeL(LB,LA));const w=day(id);
    const r3=OTHER();const r4=SYRA();const after=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {noGps:b.trips,gps:a.trips,status:a.status,sameWinner:W1.updatedAt===W2.updatedAt&&W1.updatedAt===a.updatedAt,winTrips:w.trips,
      settled:(r3.updated||0)===0&&(r4.updated||0)===0&&after.updatedAt===w.updatedAt,pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{noGps:['manila','clark'],gps:['manila','clark'],status:'pending',sameWinner:true,winTrips:['manila','clark'],settled:true,pricedD:500,pricedH:200,pay:{E1:500,E2:200}} },

{ name:'📡 (v22.18) rounds from the truck GPS win — the same day built separately by the computer with the trace (2 trips) and the one without (1 trip) merges to the 2-trip copy on both, and stays; a pending 1-trip day stored by the computer without the trace is renumbered ONCE by the computer with it (1→2 trips, approved D ₱200 / H ₱75) and nobody renumbers it back',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    setL([]);SYRA();const LA=getL();setL([]);OTHER();const LB=getL();
    const W1=mergeL(LA,LB).filter(d=>d.id===id)[0],W2=mergeL(LB,LA).filter(d=>d.id===id)[0];
    setL(mergeL(LB,LA));const r1=OTHER();const kept=day(id);
    /* part 2: the 1-trip copy is what is stored */
    setL(LB);const one=day(id);const r2=SYRA();const up=day(id);const r3=OTHER();const r4=SYRA();const fin=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {gpsBuilt:(LA[0]||{}).trips,noGpsBuilt:(LB[0]||{}).trips,winner:[W1.trips.length,W2.trips.length],keptOnOther:kept.trips.length===2&&(r1.updated||0)===0,
      storedOne:one.trips.length,upgraded:up.trips.length,roundsBy:up.roundsBy,upNewer:up.updatedAt>one.updatedAt,still:up.status,
      once:(r3.updated||0)===0&&(r4.updated||0)===0&&fin.updatedAt===up.updatedAt,pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{gpsBuilt:['manila','manila'],noGpsBuilt:['manila'],winner:[2,2],keptOnOther:true,storedOne:1,upgraded:2,roundsBy:'gps',upNewer:true,still:'pending',once:true,pricedD:200,pricedH:75,pay:{E1:200,E2:75}} },
{ name:'🌀 no sync storm (v22.18): two computers with different inputs — Syra’s (truck GPS, full rate table) and the other (no GPS, no CLARK zone in its rate table) — run 3 bridge passes each with a cloud merge after every pass: after the build, after ✔ Check, after a CLARK 3rd-trip drop (re-opened once, trips 2→3) and after a MANILA drop the other computer cannot fold yet (it waits, the GPS computer folds it) — one copy on both, no writes and no updatedAt change once settled, and approved it pays D ₱700 / H ₱275',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY),RK='hydroPro_trip_rates_v1',FULL=localStorage.getItem(RK);
    const r0=JSON.parse(FULL);[r0.live,r0.draft].forEach(o=>{o.areas=o.areas.filter(a=>a.id!=='clark');});const NOCLARK=JSON.stringify(r0);
    let LA=[],LB=[];
    const onA=()=>{setL(LA);localStorage.setItem(RK,FULL);const r=SYRA();LA=getL();return r;};
    const onB=()=>{setL(LB);localStorage.setItem(RK,NOCLARK);const r=OTHER();LB=getL();return r;};
    const merge=()=>{const a=LA,b=LB;LA=mergeL(a,b);LB=mergeL(b,a);};
    const pick=L=>L.filter(d=>d.id===id)[0]||{};
    /* n rounds: A's pass, B's pass, merge. Per round: the bridge writes on both computers and both copies' updatedAt */
    const settle=n=>{const out=[];for(let i=0;i<n;i++){const ra=onA(),rb=onB();merge();
      out.push({w:(ra.updated||0)+(rb.updated||0)+(ra.built||0)+(rb.built||0)+(ra.reopened||0)+(rb.reopened||0),deferB:rb.deferred||0,a:pick(LA).updatedAt,b:pick(LB).updatedAt});}return out;};
    const calm=R=>R.slice(1).every(x=>x.w===0&&x.a===x.b&&x.a===R[1].a);
    const P1=settle(3);const built=pick(LA);
    setL(LA);localStorage.setItem(RK,FULL);hnxTripLogCheck(id);LA=getL();merge();
    const P2=settle(3);const ck=pick(LB);
    skew+=5000;addRow(clark('dl3',3,Date.now()));
    const P3=settle(3);const re=pick(LB);
    skew+=5000;{const t=Date.now();addRow({id:'dl4',date:DAY,destination:'Pasay dl4',customer:'Cust dl4',vehicleId:'V1',driverId:'E1',helperId:'E2',areaId:'manila',areaAuto:false,status:'delivered',createdAt:t,updatedAt:t});}
    const P4=settle(3);const fin=pick(LB);
    setL(LA);localStorage.setItem(RK,FULL);hnxTripLogApprove(id);const ap=day(id);
    return {built:built.trips,storm:[calm(P1),P2.every(x=>x.w===0&&x.a===x.b&&x.a===P2[0].a),calm(P3),calm(P4)],
      checked:ck.status+'/'+ck.checkedBy,reopenedOnce:P3[0].w>0&&re.status==='pending'&&re.prevCheckedBy==='Tester',trips3:re.trips,
      otherWaited:P4[0].deferB,finIds:(fin.deliveryIds||[]).slice().sort(),finTrips:fin.trips,same:pick(LA).updatedAt===fin.updatedAt,
      pricedD:ap.pricedD,pricedH:ap.pricedH,pay:pay(DAY)};}),
  expect:{built:['manila','manila'],storm:[true,true,true,true],checked:'checked/Tester',reopenedOnce:true,trips3:['manila','manila','clark'],
    otherWaited:1,finIds:['dl1','dl2','dl3','dl4'],finTrips:['manila','manila','clark'],same:true,pricedD:700,pricedH:275,pay:{E1:700,E2:275}} },

{ name:'🔁 restore, tonight’s main case (v22.18): v22.16 re-opened two checked days "trips 2→1 … by Jinky"; one was put back to 2 trips by Syra’s v22.16 bridge (still pending), the other stayed at 1 trip. The computer WITHOUT the GPS trace gives Syra’s check back to the 2-trip day at once (trips untouched) and leaves the 1-trip day pending; Syra’s computer then restores that one with its 2 GPS trips; nothing is approved by itself, and approved both pay D ₱400 / H ₱150 for the week (₱200 / ₱75 a day)',
  seed:seedWith(`
    window.__hnxTestStartNoGps=true;
    window.__hnxTestRows=function(row,DAY,DAY2){return [row('dl2',DAY,'07:01'),row('dl1',DAY,'07:00'),row('dl5',DAY2,'07:01'),row('dl4',DAY2,'07:00')];};
    window.__hnxTestLog=function(DAY,DAY2){
      var R=Date.now()-2*3600000;
      var mk=function(date,ids,two,at){return {id:'dlvday_'+date+'_e1',date:date,truck:'NIF-6891',trucks:['NIF-6891'],driverId:'E1',driverName:'OLAZO, ARCADIO JR',helperId:'E2',helperName:'MANALO, LIMUEL',
        trips:two?['manila','manila']:['manila'],rounds:two?[{no:1,areaId:'manila',other:false,drops:[ids[0]]},{no:2,areaId:'manila',other:false,drops:[ids[1]]}]:[{no:1,areaId:'manila',other:false,drops:ids}],
        deliveryIds:ids,status:'pending',prevStatus:'checked',reapproveReason:'deliveries changed (trips 2→1 [MANILA, PASAY, BGC, MAKATI, MANDALUYONG]) on '+DAY+' by Jinky',
        source:'deliveries',createdBy:'bridge/Syra',createdAt:R-5*3600000,updatedAt:at,bridgedAt:at};};
      localStorage.setItem('hydroPro_audit',JSON.stringify([
        {ts:new Date(R-1800000).toISOString(),u:'syra',r:'operator',a:'payroll',d:'Trip day CHECKED by logistics: '+DAY+' truck NIF-6891 by Syra',gh:''},
        {ts:new Date(R-1700000).toISOString(),u:'syra',r:'operator',a:'payroll',d:'Trip day CHECKED by logistics: '+DAY2+' truck NIF-6891 by Syra',gh:''}]));
      return [mk(DAY,['dl1','dl2'],true,R+60000),mk(DAY2,['dl4','dl5'],false,R)];
    };`),
  run:run(async()=>{
    await sleep(1500);
    OTHER();const a=day(idOf(DAY)),b=day(idOf(DAY2));        /* the computer without the trace (it also ran at start-up) */
    SYRA();const a2=day(idOf(DAY)),b2=day(idOf(DAY2));       /* Syra's computer */
    const r3=OTHER();const b3=day(idOf(DAY2));
    const L=JSON.parse(localStorage.getItem(LK)||'[]');const approvedNone=L.filter(d=>d&&d.status==='approved').length;
    hnxTripLogApprove(idOf(DAY));hnxTripLogApprove(idOf(DAY2));
    return {noGps2trip:a.status+'/'+a.checkedBy+'/'+(a.trips||[]).length,flag:!!a.checkRestoredAt,noGps1trip:b.status+'/'+(b.trips||[]).length,
      syraKeeps:a2.updatedAt===a.updatedAt,syra1trip:b2.status+'/'+b2.checkedBy,trips:b2.trips,
      settled:b3.updatedAt===b2.updatedAt&&(r3.updated||0)===0&&(r3.reopened||0)===0,approvedNone,
      priced:[day(idOf(DAY)).pricedD,day(idOf(DAY)).pricedH,day(idOf(DAY2)).pricedD,day(idOf(DAY2)).pricedH],pay:pay(DAY)};}),
  expect:{noGps2trip:'checked/Syra/2',flag:true,noGps1trip:'pending/1',syraKeeps:true,syra1trip:'checked/Syra',trips:['manila','manila'],settled:true,approvedNone:0,
    priced:[200,75,200,75],pay:{E1:400,E2:150}} },
{ name:'🏷 (v22.18, PX1) a customer-name edit of the CLARK 3rd-trip drop on a CHECKED day (MANILA → MANILA → CLARK), while the other computer has no CLARK zone in its rate table: the day stays checked by Tester on BOTH computers, 3 trips, nobody writes and updatedAt does not move; when Syra then marks that drop failed it IS removed (trips 3→2, re-opened, “1 delivery row removed”) on both',
  seed:seedWith(THREE),
  run:run3(async()=>{
    const id=idOf(DAY);noClark('B');
    on('A');merge();const P0=settle(id,2);
    on('A',()=>{hnxTripLogCheck(id);});merge();
    const P1=settle(id,2);const ck=pick('B',id);
    skew+=5000;on('A',()=>{editRow('dl3',{customer:'Cust C - invoice 123',updatedAt:Date.now()});});merge();
    const P2=settle(id,3);const a=pick('A',id),b=pick('B',id);
    skew+=5000;on('A',()=>{editRow('dl3',{status:'failed',updatedAt:Date.now()});});merge();
    const P3=settle(id,3);const fa=pick('A',id),fb=pick('B',id);
    return {built:pick('A',id).id?ck.trips:null,checked:ck.status+'/'+ck.checkedBy,quiet:quiet(P1)&&quiet(P2)&&P2[0].a===ck.updatedAt,
      after:[a.status+'/'+a.checkedBy+'/'+(a.trips||[]).length,b.status+'/'+b.checkedBy+'/'+(b.trips||[]).length],why:b.reapproveReason||null,
      failed:[fa.status,fb.status,fa.updatedAt===fb.updatedAt],failedTrips:fb.trips,failedIds:(fb.deliveryIds||[]).slice().sort(),failedWhy:/1 delivery row removed, trips 3→2/.test(fb.reapproveReason||''),settledAfter:quiet(P3.slice(1))};}),
  expect:{built:['manila','manila','clark'],checked:'checked/Tester',quiet:true,after:['checked/Tester/3','checked/Tester/3'],why:null,
    failed:['pending','pending',true],failedTrips:['manila','manila'],failedIds:['dl1','dl2'],failedWhy:true,settledAfter:true} },

{ name:'🏷 (v22.18, PX1b) the same on an APPROVED day priced D ₱700 / H ₱275 (MANILA ₱0 → MANILA ₱200/₱75 → CLARK ₱500/₱200): a status edit of the CLARK drop (out for delivery → delivered) on Syra’s computer, the other computer without the CLARK zone — stays approved on both, updatedAt unchanged, and payroll pays OLAZO ₱700 / MANALO ₱275 on both computers (it re-opened and paid ₱0 / ₱0)',
  seed:seedWith(`window.__hnxTestRows=function(row,DAY){return [row('dl3',DAY,'07:02',{areaId:'clark',trip:3,destination:'Clark',status:'out for delivery'}),row('dl2',DAY,'07:01'),row('dl1',DAY,'07:00')];};`),
  run:run3(async()=>{
    const id=idOf(DAY);noClark('B');
    on('A');merge();settle(id,1);
    on('A',()=>{hnxTripLogApprove(id);});merge();
    const P1=settle(id,2);const ap=pick('A',id);
    skew+=5000;on('A',()=>{editRow('dl3',{status:'delivered',updatedAt:Date.now()});});merge();
    const P2=settle(id,3);const a=pick('A',id),b=pick('B',id);
    return {approved:ap.status+'/'+ap.pricedD+'/'+ap.pricedH,quiet:quiet(P1)&&quiet(P2)&&P2[0].a===ap.updatedAt,
      after:[a.status,b.status],trips:b.trips,payA:payOn('A',DAY),payB:payOn('B',DAY)};}),
  expect:{approved:'approved/700/275',quiet:true,after:['approved','approved'],trips:['manila','manila','clark'],payA:{E1:700,E2:275},payB:{E1:700,E2:275}} },

{ name:'📡 (v22.18, PX2) a day built while the truck GPS trace was still INCOMPLETE (cut at 07:35, the truck on its 1st round: MANILA only, ₱0) is renumbered once the full trace (2 rounds) is there — MANILA → MANILA, still pending — then stays put: a computer whose trace has fewer rounds and one with no trace never renumber it back; approved it pays D ₱200 / H ₱75 (v22.16 renumbered too)',
  seed:seedWith(''),
  run:run(async()=>{
    const id=idOf(DAY);
    const g=JSON.parse(GPS);const cut=Date.parse(DAY+'T07:35:00'),d0=Date.parse(DAY+'T00:00:00');
    g.V1=g.V1.filter(p=>p.ts<d0||p.ts>=d0+86400000||p.ts<cut);const PART=JSON.stringify(g);
    setL([]);pc(PART);const d1=day(id);
    const r2=SYRA();const d2=day(id);
    const r3=SYRA(),r4=pc(PART),r5=OTHER();const d5=day(id);
    hnxTripLogApprove(id);const ap=day(id);
    return {partial:d1.trips,partialBy:d1.roundsBy+'/'+d1.gpsN,full:d2.trips,fullBy:d2.roundsBy+'/'+d2.gpsN,status:d2.status,newer:d2.updatedAt>d1.updatedAt,
      upgraded:r2.gpsRounds||0,stays:[r3.updated||0,r4.updated||0,r5.updated||0].join(',')+'/'+(d5.updatedAt===d2.updatedAt),trips5:d5.trips,
      priced:[ap.pricedD,ap.pricedH],pay:pay(DAY)};}),
  expect:{partial:['manila'],partialBy:'gps/1',full:['manila','manila'],fullBy:'gps/2',status:'pending',newer:true,upgraded:1,stays:'0,0,0/true',trips5:['manila','manila'],
    priced:[200,75],pay:{E1:200,E2:75}} },
{ name:'📡➕ (v22.18, R1) a BLANK-trip MANILA drop Jinky adds on the computer WITHOUT the GPS trace after Syra checked the day (truck trace: 3 rounds) is not folded into round 1 there: that computer re-opens the day, Syra’s computer renumbers the pending day from its trace (MANILA → MANILA → MANILA) when the row and the re-opened copy reach it in the same pull, both computers agree and stay quiet, and approved it pays D ₱400 / H ₱150 (not ₱200 / ₱75)',
  seed:seedWith(''),
  run:run4(async()=>{
    const id=idOf(DAY);W.A.gps=G3;
    on('A');merge();on('B');merge();
    on('A',()=>{hnxTripLogCheck(id);});merge();const P0=settle(id,1);const ck=pick('B',id);
    skew+=60000;const rb=on('B',()=>{addRow(blank('dl3','manila',Date.now()));return hnxTripBridge.sync({force:true});});const b1=pick('B',id);
    merge();const P1=settle(id,3);const fa=pick('A',id),fb=pick('B',id);
    on('A',()=>{hnxTripLogCheck(id);hnxTripLogApprove(id);});merge();const ap=pick('A',id);
    return {checked:ck.status+'/'+ck.checkedBy+'/'+(ck.trips||[]).length,reopenedOnB:[rb.reopened||0,b1.status,b1.roundsBy,b1.prevCheckedBy],
      final:[sum(fa),sum(fb),fa.updatedAt===fb.updatedAt,fa.roundsBy],ids:(fa.deliveryIds||[]).slice().sort(),quiet:quiet(P1.slice(1)),
      priced:[ap.status,ap.pricedD,ap.pricedH],payA:payOn('A',DAY),payB:payOn('B',DAY)};}),
  expect:{checked:'checked/Tester/2',reopenedOnB:[1,'pending','none','Tester'],final:['pending/manila,manila,manila','pending/manila,manila,manila',true,'gps'],
    ids:['dl1','dl2','dl3'],quiet:true,priced:['approved',400,150],payA:{E1:400,E2:150},payB:{E1:400,E2:150}} },

{ name:'📡➕ (v22.18, R1c) the same on an APPROVED day (D ₱200 / H ₱75): the blank-trip MANILA drop added on the computer without the GPS trace sends it back for approval (“was ✅ approved by Tester”), Syra’s computer renumbers it MANILA → MANILA → MANILA, and re-approved it pays D ₱400 / H ₱150 on both computers (it stayed approved at ₱200 / ₱75)',
  seed:seedWith(''),
  run:run4(async()=>{
    const id=idOf(DAY);W.A.gps=G3;
    on('A');merge();on('B');merge();
    on('A',()=>{hnxTripLogApprove(id);});merge();settle(id,1);const ap0=pick('B',id);const pay0=payOn('B',DAY);
    skew+=60000;on('B',()=>{addRow(blank('dl3','manila',Date.now()));return hnxTripBridge.sync({force:true});});const b1=pick('B',id);
    merge();const P1=settle(id,3);const fa=pick('A',id),fb=pick('B',id);
    on('A',()=>{hnxTripLogApprove(id);});merge();const ap=pick('A',id);
    return {approved:ap0.status+'/'+ap0.pricedD+'/'+ap0.pricedH,pay0,onB:[b1.status,b1.prevStatus,b1.prevApprovedBy,/after approval/.test(b1.reapproveReason||'')],
      final:[sum(fa),sum(fb)],quiet:quiet(P1.slice(1)),priced:[ap.status,ap.pricedD,ap.pricedH],payA:payOn('A',DAY),payB:payOn('B',DAY)};}),
  expect:{approved:'approved/200/75',pay0:{E1:200,E2:75},onB:['pending','approved','Tester',true],final:['pending/manila,manila,manila','pending/manila,manila,manila'],
    quiet:true,priced:['approved',400,150],payA:{E1:400,E2:150},payB:{E1:400,E2:150}} },

{ name:'🧳 (v22.18, R6) a drop CARRIED by a computer that cannot place it keeps its trip: on a checked MANILA → MANILA → CLARK day, the other computer (no CLARK zone in its rate table) gets a MANILA drop typed 4th trip while Syra’s computer is offline; it waits 12 h, then re-opens the day as MANILA → MANILA → CLARK → MANILA (trips 3→4) with the CLARK drop still in its 3rd round; Syra’s computer comes back and agrees without a write, and approved it pays D ₱900 / H ₱350 (not ₱400 / ₱150 with the CLARK trip lost)',
  seed:seedWith(THREE),
  run:run4(async()=>{
    const id=idOf(DAY);
    on('A');merge();on('B');merge();
    on('A',()=>{hnxTripLogCheck(id);});merge();const ck=pick('A',id);
    noClark('B');
    skew+=5000;const rb0=on('B',()=>{addRow(blank('dl4','manila',Date.now(),{trip:4}));return hnxTripBridge.sync({force:true});});const b0=pick('B',id);
    skew+=13*3600000;const rb1=on('B');const b1=pick('B',id);
    merge();const P1=settle(id,3);const fa=pick('A',id),fb=pick('B',id);
    W.B.rates=FULL;const P2=settle(id,2);const fb2=pick('B',id);
    on('A',()=>{hnxTripLogCheck(id);hnxTripLogApprove(id);});merge();const ap=pick('A',id);
    return {checked:sum(ck),waited:[rb0.deferred||0,sum(b0)],carried:[rb1.reopened||0,sum(b1),/trips 3→4/.test(b1.reapproveReason||'')],
      back:[sum(fa),sum(fb),fa.updatedAt===b1.updatedAt],quiet:quiet(P1)&&quiet(P2)&&fb2.updatedAt===b1.updatedAt,ids:(fa.deliveryIds||[]).slice().sort(),
      priced:[ap.status,ap.pricedD,ap.pricedH],payA:payOn('A',DAY),payB:payOn('B',DAY)};}),
  expect:{checked:'checked/manila,manila,clark',waited:[1,'checked/manila,manila,clark'],carried:[1,'pending/manila,manila,clark,manila',true],
    back:['pending/manila,manila,clark,manila','pending/manila,manila,clark,manila',true],quiet:true,ids:['dl1','dl2','dl3','dl4'],
    priced:['approved',900,350],payA:{E1:900,E2:350},payB:{E1:900,E2:350}} },

{ name:'🧳 (v22.18, CV2) the post-12-h carry never drops a round or re-opens a checked day for a zone it lacks: the other computer (no CLARK zone) folds a MANILA drop typed 2nd trip into the checked MANILA → MANILA → CLARK day while Syra’s computer is offline — it stays checked at MANILA → MANILA → CLARK on both computers, Syra’s computer comes back without a write, the CLARK zone reaching the other computer changes nothing, and approved it pays D ₱700 / H ₱275 (the carried CLARK trip was lost: pending MANILA → MANILA, ₱200 / ₱75)',
  seed:seedWith(THREE),
  run:run4(async()=>{
    const id=idOf(DAY);
    on('A');merge();on('B');merge();
    on('A',()=>{hnxTripLogCheck(id);});merge();
    noClark('B');
    skew+=5000;const rb0=on('B',()=>{addRow(blank('dl4','manila',Date.now(),{trip:2}));return hnxTripBridge.sync({force:true});});
    skew+=12*3600000+60000;const rb1=on('B');const b1=pick('B',id);
    merge();const P1=settle(id,3);const fa=pick('A',id),fb=pick('B',id);
    W.B.rates=FULL;const P2=settle(id,2);const fb2=pick('B',id);
    on('A',()=>{hnxTripLogApprove(id);});merge();const ap=pick('A',id);
    return {waited:rb0.deferred||0,carried:[rb1.updated||0,rb1.reopened||0,b1.status+'/'+b1.checkedBy,b1.trips,(b1.deliveryIds||[]).slice().sort()],
      back:[sum(fa),sum(fb),fa.updatedAt===b1.updatedAt],quiet:quiet(P1)&&quiet(P2)&&fb2.updatedAt===b1.updatedAt,
      priced:[ap.status,ap.pricedD,ap.pricedH],payA:payOn('A',DAY),payB:payOn('B',DAY)};}),
  expect:{waited:1,carried:[1,0,'checked/Tester',['manila','manila','clark'],['dl1','dl2','dl3','dl4']],
    back:['checked/manila,manila,clark','checked/manila,manila,clark',true],quiet:true,priced:['approved',700,275],payA:{E1:700,E2:275},payB:{E1:700,E2:275}} },

{ name:'🧳 (v22.18, CV2b) both computers process the same new BLANK-trip MANILA drop 12 h later at the same moment, each from the checked MANILA → MANILA → CLARK copy: the other computer (no CLARK zone, no GPS) carries the CLARK drop in its round and re-opens, Syra’s computer (GPS) folds the drop into its 2nd round and keeps the check — her copy wins on both (checked MANILA → MANILA → CLARK, no round dropped), then quiet, and approved it pays D ₱700 / H ₱275',
  seed:seedWith(THREE),
  run:run4(async()=>{
    const id=idOf(DAY);
    on('A');merge();on('B');merge();
    on('A',()=>{hnxTripLogCheck(id);});merge();
    noClark('B');
    skew+=5000;on('B',()=>{addRow(blank('dl4','manila',Date.now()));});
    skew+=12*3600000+60000;
    W.A.D=mergeL(W.A.D,W.B.D);
    const ra=on('A'),rb=on('B');const a=pick('A',id),b=pick('B',id);
    merge();const P1=settle(id,3);const fa=pick('A',id),fb=pick('B',id);
    W.B.rates=FULL;const P2=settle(id,2);
    on('A',()=>{hnxTripLogApprove(id);});merge();const ap=pick('A',id);
    return {a:[ra.reopened||0,sum(a)],b:[rb.reopened||0,b.status,b.trips],final:[fa.status+'/'+fa.checkedBy,fa.trips,sum(fb),fa.updatedAt===fb.updatedAt],
      ids:(fb.deliveryIds||[]).slice().sort(),quiet:quiet(P1)&&quiet(P2),priced:[ap.status,ap.pricedD,ap.pricedH],payA:payOn('A',DAY),payB:payOn('B',DAY)};}),
  expect:{a:[0,'checked/manila,manila,clark'],b:[1,'pending',['manila','manila','clark']],final:['checked/Tester',['manila','manila','clark'],'checked/manila,manila,clark',true],
    ids:['dl1','dl2','dl3','dl4'],quiet:true,priced:['approved',700,275],payA:{E1:700,E2:275},payB:{E1:700,E2:275}} }
];
