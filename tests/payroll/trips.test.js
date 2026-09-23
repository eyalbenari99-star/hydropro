/* Trip incentives: the 1st-trip rule, x2, and the flat Other-trip category. */
module.exports=[
{ name:'trips: EVIA pays 100 flat first or later, EVIA+HOUSING+RV = 300, Clark x2 = 500 (v20.52)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'H1',name:'Nico',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const t=today;const day=(id,trips)=>({id,date:t,driverId:'D1',helperId:'',truck:'V1',trips,status:'approved'});
    localStorage.setItem(LK,JSON.stringify([day('t1',['evia']),day('t2',['alabang','evia']),day('t3',['evia','housing','rv']),day('t4',['alabang','clark'])]));
    switchView('pay_dash');await sleep(500);switchView('pay_trips');await sleep(2600);
    const txt=(document.getElementById('view-pay_trips').innerText||'').split('\n').map(x=>x.replace(/\s+/g,' ').trim());
    const amt=re=>{const l=txt.find(x=>re.test(x)&&/1st /.test(x));const m=l&&l.match(/(\d[\d,]*\.\d\d)\s*[—✅]/);return m?+m[1].replace(/,/g,''):(l||'no row');};
    return {eviaFirst:amt(/^— 1st EVIA \(D ₱\d+\) /),alabangThenEvia:amt(/1st ALABANG AREA .*2nd EVIA/),three:amt(/1st EVIA .*2nd HOUSING .*3rd RV/),clark:amt(/2nd CLARK CITY/)};},
  expect:{eviaFirst:100,alabangThenEvia:100,three:300,clark:500} },
{ name:'⭐ Other trip: an EVIA run tagged ⭐ keeps its own round, so the delivery and the ₱100 both pay instead of one swallowing the other (v20.73)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',DK='hydroPro_log_deliveries';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const areas=(r.live&&r.live.areas)||[];
    const evia=areas.filter(a=>/evia/i.test(a.name))[0],alab=areas.filter(a=>/alabang/i.test(a.name))[0];
    const t=today;
    const row=(id,areaId,trip)=>Object.assign({id,date:t,driverId:'D1',areaId,status:'delivered',createdAt:Date.parse(t+'T0'+(id.slice(-1))+':00:00'),vehicleId:''},trip?{trip}:{});
    const plan=()=>{const P=hnxTripBridge.plan();const g=(P.groups||[]).filter(x=>x.date===t&&x.driverId==='D1')[0]||{};
      return {trips:(g.trips||[]).map(a=>a==='_prior'?'_prior':((areas.filter(z=>z.id===a)[0]||{}).name||a)),otherAt:g.otherAt,badges:(g.rows||[]).map(x=>{const b=P.byDelivery[String(x.r.id)]||{};return String(x.r.id)+':'+(b.other?'other':('t'+b.idx+'/'+b.n));})};};
    /* the old way: both drops tagged "2nd trip" collide into ONE round, so only one area pays */
    localStorage.setItem(DK,JSON.stringify([row('d1',alab.id,2),row('d2',evia.id,2)]));
    const collide=plan();
    /* the new way: the EVIA drop is tagged ⭐ and keeps its own round */
    localStorage.setItem(DK,JSON.stringify([row('d1',alab.id,2),row('d2',evia.id,'o')]));
    const tagged=plan();
    /* two ⭐ drops of the same run are ONE round, exactly as two drops sharing a number are */
    localStorage.setItem(DK,JSON.stringify([row('d1',alab.id,2),row('d2',evia.id,'o'),row('d3',evia.id,'o')]));
    const twoDrops=plan();
    return {collideLen:collide.trips.length,taggedTrips:tagged.trips,taggedOtherAt:tagged.otherAt,taggedBadges:tagged.badges,twoDropsLen:twoDrops.trips.length};},
  expect:{collideLen:2,taggedTrips:['_prior','ALABANG AREA','EVIA'],taggedOtherAt:2,taggedBadges:['d1:t2/3','d2:other'],twoDropsLen:3} },
{ name:'🔗 a zone added to the DRAFT tariff table is taggable at once, and can never take a round from an approved zone (v20.74)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',DK='hydroPro_log_deliveries';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.live=JSON.parse(JSON.stringify(r.draft));          /* approve what exists */
    const areas=r.live.areas||[];
    const alab=areas.filter(a=>/alabang/i.test(a.name))[0];
    /* Jinky adds a new zone. It is in the DRAFT only, and deliberately dearer than the approved one. */
    r.draft.areas=(r.draft.areas||[]).concat([{id:'zz_new',name:'NEW ZONE',d1:0,h1:0,d2:9999,h2:9999,dbl:false,night3:false,special:false}]);
    r.draftDirty=true;localStorage.setItem(RK,JSON.stringify(r));
    const t=today;
    const row=(id,areaId,trip)=>Object.assign({id,date:t,driverId:'D1',areaId,status:'delivered',createdAt:Date.parse(t+'T0'+(id.slice(-1))+':00:00')},trip?{trip}:{});
    /* one round holding an approved drop and an unapproved one */
    localStorage.setItem(DK,JSON.stringify([row('d1',alab.id,2),row('d2','zz_new',2)]));
    const P=hnxTripBridge.plan();
    const g=(P.groups||[]).filter(x=>x.date===t&&x.driverId==='D1')[0]||{};
    const b2=P.byDelivery['d2']||{};
    /* and a day whose only zone is the unapproved one */
    localStorage.setItem(DK,JSON.stringify([row('d3','zz_new',1)]));
    const P2=hnxTripBridge.plan();
    const g2=(P2.groups||[]).filter(x=>x.date===t&&x.driverId==='D1')[0]||{};
    return {draftRowAccepted:b2.reason===null||b2.reason===undefined,
            roundPricedBy:(g.trips||[]).map(a=>a==='_prior'?'_prior':((areas.filter(z=>z.id===a)[0]||{}).name||a)),
            draftOnlyDayTrips:(g2.trips||[])};},
  expect:{draftRowAccepted:true,roundPricedBy:['_prior','ALABANG AREA'],draftOnlyDayTrips:['zz_new']} },
{ name:'🚚 the trip box carries the tariff table: picking ⭐ EVIA by name tags the run and sets the area in one action, and a 5th trip is never truncated to the 1st (v20.75)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',DK='hydroPro_log_deliveries';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const areas=r.live.areas||[];
    const evia=areas.filter(a=>/evia/i.test(a.name))[0],alab=areas.filter(a=>/alabang/i.test(a.name))[0];
    const t=today;
    const row=(id,areaId,trip)=>Object.assign({id,date:t,driverId:'D1',areaId,status:'delivered',createdAt:Date.parse(t+'T0'+(id.slice(-1))+':00:00')},trip?{trip}:{});
    /* Syra picks "⭐ EVIA" by name on a row that had no area at all */
    localStorage.setItem(DK,JSON.stringify([row('d1',alab.id,2),row('d2','',null)]));
    hnxTripBridge.pickTrip('d2','o:'+evia.id);await sleep(400);
    const saved=(JSON.parse(localStorage.getItem(DK))||[]).filter(x=>x.id==='d2')[0]||{};
    const P=hnxTripBridge.plan();const g=(P.groups||[]).filter(x=>x.date===t&&x.driverId==='D1')[0]||{};
    /* a row the GPS put on the 5th round keeps the 5th */
    localStorage.setItem(DK,JSON.stringify([row('d3',alab.id,5)]));
    const P2=hnxTripBridge.plan();const g2=(P2.groups||[]).filter(x=>x.date===t&&x.driverId==='D1')[0]||{};
    return {tripTag:saved.trip,areaSet:saved.areaId===evia.id,areaAuto:saved.areaAuto,
            trips:(g.trips||[]).map(a=>a==='_prior'?'_prior':((areas.filter(z=>z.id===a)[0]||{}).name||a)),
            fifthKept:(g2.trips||[]).length,fifthBadge:(P2.byDelivery['d3']||{}).idx};},
  expect:{tripTag:'o',areaSet:true,areaAuto:false,trips:['_prior','ALABANG AREA','EVIA'],fifthKept:5,fifthBadge:5} },
{ name:'➕ Add a new zone is navigation only: the delivery row keeps the area it had (v20.76)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',DK='hydroPro_log_deliveries';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const alab=(r.live.areas||[]).filter(a=>/alabang/i.test(a.name))[0];
    const t=today;
    localStorage.setItem(DK,JSON.stringify([{id:'d1',date:t,driverId:'D1',areaId:alab.id,destination:'MUNTINLUPA',status:'delivered',createdAt:Date.parse(t+'T01:00:00')}]));
    const before=JSON.parse(localStorage.getItem(DK))[0];
    hnxTripBridge.pickArea('d1','__add');await sleep(900);
    const after=(JSON.parse(localStorage.getItem(DK))||[]).filter(x=>x.id==='d1')[0]||{};
    const nameBox=document.getElementById('hnxRaName');
    const prefilled=nameBox?nameBox.value:'(no add box)';
    try{window.hnxTripRateAddClose();}catch(e){}
    return {areaKept:after.areaId===before.areaId,untouched:after.updatedAt===before.updatedAt,prefilled};},
  expect:{areaKept:true,untouched:true,prefilled:'MUNTINLUPA'} },
{ name:'🧊 the REAL dropdown on the REAL screen shows ⭐ Other trip, and a zone ticked ⭐ appears without a reload (v20.77)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',DK='hydroPro_log_deliveries';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const areas=r.live.areas||[];const alab=areas.filter(a=>/alabang/i.test(a.name))[0];
    const t=today;
    localStorage.setItem(DK,JSON.stringify([{id:'d1',date:t,driverId:'D1',areaId:alab.id,destination:'MUNTINLUPA',status:'delivered',createdAt:Date.parse(t+'T01:00:00')}]));
    switchView('log_deliveries');await sleep(4000);
    const opts=()=>{const sels=[...document.querySelectorAll('#view-log_deliveries td.hnx-br-area select')];
      const trip=sels.filter(s=>[...s.options].some(o=>/\dst trip|\dnd trip|\drd trip|\dth trip/.test(o.textContent||'')))[0];
      return trip?[...trip.options].map(o=>(o.textContent||'').trim()):['(no trip select found)'];};
    const before=opts();
    /* Jinky ticks a brand new zone as ⭐ Other trip while the row is on screen */
    const r2=JSON.parse(localStorage.getItem(RK));
    r2.live.areas=(r2.live.areas||[]).concat([{id:'zz_star',name:'BULACAN RUN',d1:150,h1:50,d2:150,h2:50,dbl:false,night3:false,special:true}]);
    localStorage.setItem(RK,JSON.stringify(r2));
    await sleep(4000);
    const after=opts();
    return {hasOtherBefore:before.some(x=>/Other trip/.test(x)),
            newZoneBefore:before.some(x=>/BULACAN RUN/.test(x)),
            newZoneAfter:after.some(x=>/BULACAN RUN/.test(x)),
            numbered:before.filter(x=>/trip$/.test(x)).length>=4};},
  expect:{hasOtherBefore:true,newZoneBefore:false,newZoneAfter:true,numbered:true} },
{ name:'🚚 Rate Table: Clark typed 500/200 with ×2 shows "pays D ₱1,000 / H ₱400" on the row, and 2 "_prior" earlier-run legs do NOT raise the "paid ₱0 — not in the APPROVED table" banner (v20.95)',
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=500;a.h2=200;a.dbl=true;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    localStorage.setItem(LK,JSON.stringify([{id:'c1',date:today,driverId:'D1',helperId:'H1',truck:'V1',trips:['_prior','_prior','clark'],status:'approved'}]));
    hnxTripTab('rates');await sleep(800);
    const html=document.getElementById('view-pay_trips').innerHTML;
    const row=[...document.querySelectorAll('.hnxRatePays')].map(x=>x.textContent).join(' | ');
    return {hintShown:/D ₱1,000 \/ H ₱400/.test(row),priorBanner:/_prior/.test(html),zeroBanner:/paid ₱0\./.test(html)};},
  expect:{hintShown:true,priorBanner:false,zeroBanner:false} },
{ name:'🚚 Re-price: a Clark day approved at the old 500/200 ×2 table (D ₱1,000 / H ₱400) re-prices to D ₱500 / H ₱200 after the table is corrected to 250/100 ×2 (v20.96)',
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    localStorage.setItem(LK,JSON.stringify([{id:'c2',date:today,driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400}]));
    const oc=window.confirm;window.confirm=()=>true;
    const n=window.hnxTripRepriceApproved(false);window.confirm=oc;
    const tl=JSON.parse(localStorage.getItem(LK))[0];
    return {n,d:tl.pricedD,h:tl.pricedH};},
  expect:{n:1,d:500,h:200} },
{ name:'🚚 Re-price skips a day inside an APPROVED payroll run (stays D ₱1,000), the orange "priced at an OLD rate" button shows, and a ⭐ special row cannot be ticked ×2 (v20.96)',
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'R1',status:'approved',periodStart:today,periodEnd:today}]));
    localStorage.setItem(LK,JSON.stringify([{id:'c3',date:today,driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400}]));
    hnxTripTab('rates');await sleep(800);
    const btn=!!document.querySelector('.hnxStaleBtn');
    const oc=window.confirm,oa=window.alert;window.confirm=()=>true;window.alert=()=>{};
    const n=window.hnxTripRepriceApproved(false);window.confirm=oc;window.alert=oa;
    const tl=JSON.parse(localStorage.getItem(LK))[0];
    const i=r.draft.areas.findIndex(a=>a.id==='alabang');
    hnxTripRateEdit(i,'special',true);hnxTripRateEdit(i,'dbl',true);
    const sp=JSON.parse(localStorage.getItem(RK)).draft.areas[i];
    return {btn,n,paidStale:window.__hnxTripPaidStale,d:tl.pricedD,spDbl:!!sp.dbl};},
  expect:{btn:true,n:0,paidStale:1,d:1000,spDbl:false} },
];
