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
];
