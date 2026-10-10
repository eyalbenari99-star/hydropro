/* v22.28 fleet audit L44: trips added to a delivery day that a LOCKED run already paid were only NAMED on approval
   ("add it as a one-time payment … or it is never paid") — unless someone keyed it by hand, the driver never got them.
   Approving such a day now stages the unpaid part as a one-time payment in the next open week, once. */
const RATES=()=>{const A=[{id:'alabang',name:'ALABANG AREA',d1:0,h1:0,d2:100,h2:50,dbl:false},{id:'manila',name:'MANILA',d1:0,h1:0,d2:200,h2:75,dbl:false}];
  localStorage.setItem('hydroPro_trip_rates_v1',JSON.stringify({draft:{areas:A},live:{areas:A},draftDirty:false,airportSeeded:true,specialSeeded:true}));};
module.exports=[
{ name:'🚚 Locked 3–9 Sep week paid Tue 8 Sep at driver ₱200; a trip was added (day now ₱400) → approving stages ₱200 as a one-time payment dated 8 Sep, paid 10–16 Sep (taxable, from ops_2026-09-03_2026-09-09); approving again adds nothing; one more Manila trip (₱600) adds only the new ₱200 → 10–16 Sep pays one-time ₱200 + ₱200 = ₱400, trip incentive ₱0 (v22.28)',
  requires:"typeof window.hnxTripDiffStage==='function'&&typeof window.hnxTripLogApprove==='function'",
  seed:RATES,
  run:async()=>{
    const d=labour('D1','DRIVER ONE',{salaryCategory:'drivers',employmentType:'Probationary'});setE([d]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',
      lines:[{empId:'D1',name:'DRIVER ONE',dailyRate:658,daysWorked:6,tripIncentive:200,tripList:[{date:'2026-09-08',role:'d',trips:2,amount:200}]}],totals:{}}]));
    localStorage.setItem('hydroPro_onetime_allow_v1','[]');
    const LK='hydroPro_trip_log_v1';
    localStorage.setItem(LK,JSON.stringify([{id:'t9',date:'2026-09-08',driverId:'D1',helperId:'',truck:'V1',trips:['alabang','manila','manila'],status:'checked',createdAt:1}]));
    const asked=[];window.confirm=m=>{asked.push(String(m));return true;};window.alert=()=>{};
    const ot=()=>(JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1')||'[]')||[]).filter(o=>o&&o.tripDiffOf==='t9');
    try{hnxTripLogApprove('t9');}catch(e){}
    await sleep(300);
    const first=ot().map(o=>[o.empId,o.amount,o.date,o.payDate,o.taxable,o.carriedFrom]);
    const said=asked.some(x=>/NOT PAID by that run: driver ₱200/.test(x)&&/OK adds it as a one-time payment in the open week 2026-09-10/.test(x));
    /* sent back again with nothing new, re-approved: nothing more is staged */
    let T=JSON.parse(localStorage.getItem(LK));T[0].status='checked';localStorage.setItem(LK,JSON.stringify(T));
    try{hnxTripLogApprove('t9');}catch(e){}
    await sleep(300);
    const again=ot().length;
    /* one more Manila trip: only the new ₱200 */
    T=JSON.parse(localStorage.getItem(LK));T[0].status='checked';T[0].trips=['alabang','manila','manila','manila'];localStorage.setItem(LK,JSON.stringify(T));
    try{hnxTripLogApprove('t9');}catch(e){}
    await sleep(300);
    const third=ot().map(o=>o.amount);
    const nx=calcEmployeePayroll(d,'2026-09-10','2026-09-16','weekly');
    return {first,said,again,third,one:(nx.onetimeList||[]).map(x=>x.amount),trip:nx.tripIncentive||0};},
  expect:{first:[['D1',200,'2026-09-08','2026-09-10',true,'ops_2026-09-03_2026-09-09']],said:true,again:1,third:[200,200],one:[200,200],trip:0} }
];
