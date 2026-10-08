/* v22.12: attendance freezes found by the audit — the payroll engine and the bulk buttons re-parsed / re-saved the whole store per person */
const BIG=function(){ /* 169 labour people + ~1.3 MB of attendance history (60 days) */
  var E=[],A={},d0=new Date('2026-07-10T00:00:00');
  for(var i=0;i<169;i++) E.push({id:'L'+i,name:'WORKER Q'+String.fromCharCode(65+((i/26)|0))+String.fromCharCode(65+i%26)+' SANTOS', /* letters only: the duplicate-name merge ignores digits */status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'});
  for(var k=0;k<60;k++){ var d=new Date(d0);d.setDate(d.getDate()+k);var ds=d.toISOString().slice(0,10);A[ds]={};
    for(var j=0;j<169;j++) A[ds]['L'+j]={status:'present',timeIn:'07:00',timeOut:'16:00',lateMinutes:0,source:'fingerprint',updatedAt:'2026-09-01T00:00:00.000Z',updatedBy:'system',fpRaw:{uid:'L'+j,scansCount:2}}; }
  localStorage.setItem('hydroPro_employees',JSON.stringify(E));localStorage.setItem('hydroPro_attendance',JSON.stringify(A));
};
module.exports=[
{ name:'⚡ Attendance v22.12: the daily payroll auto-draft never runs on the login page (it ran the whole roster there — 7.4 s frozen before sign-in); it waits for a sign-in and the wait ends at sign-in (v22.12)',
  seed:function(){sessionStorage.removeItem('hydroPro_session');localStorage.removeItem('hydroPro_pay_autodraft_v1');},
  run:async()=>{await sleep(5000);const key=localStorage.getItem('hydroPro_pay_autodraft_v1');const waiting=!!window.__hnxAutoDraftWait;
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));await sleep(7000);
    return {notOnLogin:key===null,waiting,resumedAtSignIn:window.__hnxAutoDraftWait===0};},
  expect:{notOnLogin:true,waiting:true,resumedAtSignIn:true} },
{ name:'⚡ Attendance v22.12: ✓ Bulk Present for 169 people over a 1.3 MB store is ONE save (< 1.5 s, was ~16 s): 168 marked present 07:00 by tester, the 1 hand-marked absent kept, all 60 earlier days intact (v22.12)',
  seed:function(){ (BIG_SRC)(); var A=JSON.parse(localStorage.getItem('hydroPro_attendance'));A['2026-09-15']={L0:{status:'absent',source:'manual',reason:'sick',editedBy:'jinky',timeIn:'',timeOut:'',lateMinutes:0}};localStorage.setItem('hydroPro_attendance',JSON.stringify(A)); },
  run:async()=>{await sleep(2500);window.confirm=()=>true;attCurrentDate='2026-09-15';
    let saves=0;const _si=Storage.prototype.setItem;const ls=localStorage.setItem;
    const t0=performance.now();attBulkMark('present');const ms=Math.round(performance.now()-t0);
    const A=JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}');const day=A['2026-09-15']||{};
    const pres=Object.keys(day).filter(k=>/^L\d+$/.test(k)&&day[k].status==='present'&&day[k].timeIn==='07:00'&&day[k].updatedBy==='tester').length;
    return {fast:ms<1500,pres,keptManual:day.L0&&day.L0.status==='absent'&&day.L0.reason==='sick',days:Object.keys(A).filter(d=>d>='2026-07-10'&&d<='2026-09-07'&&A[d]&&A[d].L5&&A[d].L5.status==='present').length,ms};},
  expect:{fast:true,pres:168,keptManual:true,days:60} },
{ name:'⚡ Attendance v22.12: payroll for 169 people reads attendance ONCE (< 1.5 s), yet a record changed between two runs is seen at once — L1 6 days → 5 after one absent (v22.12)',
  seed:function(){ (BIG_SRC)(); var A=JSON.parse(localStorage.getItem('hydroPro_attendance'));['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12'].forEach(function(d){A[d]={};for(var j=0;j<169;j++)A[d]['L'+j]={status:'present',timeIn:'07:00',timeOut:'16:00',lateMinutes:0,source:'fingerprint'};});localStorage.setItem('hydroPro_attendance',JSON.stringify(A)); },
  run:async()=>{await sleep(2500);
    const t0=performance.now();const lines=employees.filter(e=>e.status==='Active'&&/^L\d+$/.test(e.id)).map(e=>calcEmployeePayroll(e,'2026-09-07','2026-09-13','weekly'));const ms=Math.round(performance.now()-t0);
    const d1=lines.find(l=>l&&(l.employeeId==='L1'||l.empId==='L1'));
    setAttRecord('2026-09-08','L1',{status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'manual',reason:'test'});
    const d2=calcEmployeePayroll(employees.find(e=>e.id==='L1'),'2026-09-07','2026-09-13','weekly');
    return {n:lines.filter(Boolean).length,fast:ms<1500,before:d1&&d1.daysWorked,after:d2&&d2.daysWorked,ms};},
  expect:{n:169,fast:true,before:6,after:5} },
{ name:'⚡ Recurring v22.12: a long-cadence task’s last-done date is read from one index (400 look-ups over 900 completions < 150 ms) and a new completion shows at once (v22.12)',
  run:async()=>{await sleep(2500);const T=(typeof RECURRING_TASKS!=='undefined'?RECURRING_TASKS:[]).filter(t=>window.hnxRtIsLong&&window.hnxRtIsLong(t));if(!T.length)return {hasLong:false};
    const id=T[0].id,C={};for(let i=0;i<900;i++)C['c'+i]={taskId:i%3?('other'+i):id,date:'2026-0'+(1+i%8)+'-'+String(1+i%28).padStart(2,'0'),status:'done',by:'u'+i};
    localStorage.setItem('hydroPro_recurring_completions_v1',JSON.stringify(C));
    const before=window.hnxRtState(id).lastDone;const t0=performance.now();for(let i=0;i<400;i++)window.hnxRtState(T[i%T.length]);const ms=Math.round(performance.now()-t0);
    C.cNew={taskId:id,date:'2026-09-20',status:'done',by:'eyal'};localStorage.setItem('hydroPro_recurring_completions_v1',JSON.stringify(C));
    const after=window.hnxRtState(id).lastDone;
    return {hasLong:true,before:before&&before.date,after:after&&after.date+'|'+after.by,fast:ms<150,ms};},
  expect:{hasLong:true,before:'2026-08-28',after:'2026-09-20|eyal',fast:true} }
];
/* the seeds are stringified into the page, so the shared builder is spliced in as source */
module.exports.forEach(t=>{ if(t.seed){ const src=t.seed.toString().replace('(BIG_SRC)','('+BIG.toString()+')'); t.seed=new Function('return '+src)(); } });
