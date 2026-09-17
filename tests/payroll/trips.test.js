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
];
