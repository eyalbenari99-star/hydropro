/* Audit batch B-finalpay (v20.97): the leaver's final pay is priced by the payroll engine, pays each
   day exactly once (Offboarding T-46 and the payroll-screen calculator both close the days they pay),
   carries the allowances / trips / memos of those days, deducts statutory only for its own window,
   and the 13th month follows ONE rule everywhere. Fixed dates are all before the suite's first run
   (Sep 2026) and the 2026 PH holiday calendar the app seeds itself: 21 Aug special, 31 Aug regular. */
module.exports=[
{ name:'T-46 final pay: office ₱16,000/month, last day Fri 18 Sep 2026 = 6 of 11 days = ₱4,363.64 (a full 11 of 11 = ₱8,000.00, not a whole ₱16,000 month), 13th ₱363.64 (not 16,000×9/12 = ₱12,000); released once, then the 11–25 Sep run pays ₱0 basic and drops her',
  run:async()=>{
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    setE([ana]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    const d=hnxFinalPayDefaults('ANA');
    const c=hnxComputeFinalPay(d);
    const before=calcEmployeePayroll(ana,'2026-09-11','2026-09-25','semi_monthly');
    hnxPrepareFinalPay('ANA',d);hnxApproveFinalPay('ANA');hnxReleaseFinalPay('ANA',{method:'Bank transfer',ref:'X1'});
    const rec=hnxFinalPayFor('ANA');const st=JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]');
    const after=calcEmployeePayroll(ana,'2026-09-11','2026-09-25','semi_monthly');
    return {from:d.unpaidFrom,days:d.daysWorked,div:d.daysInPeriod,wages:c.baseWagesLastPeriod,t13:c.prorated13thMonth,net:c.netFinalPay,
      runBefore:before.basicPay,status:rec&&rec.status,settled:st.map(x=>x.from+'>'+x.to+':'+x.src).join(','),runAfter:after.basicPay,
      owed:_payStillOwed(ana,{start:'2026-09-11',end:'2026-09-25'}),
      full:hnxComputeFinalPay({payType:'semi_monthly',baseSalary:16000,daysWorked:11,daysInPeriod:11,ytdBasic13:0}).baseWagesLastPeriod};
  },
  expect:{full:8000,from:'2026-09-11',days:6,div:11,wages:4363.64,t13:363.64,net:4727.27,runBefore:4363.64,status:'released',
    settled:'2026-09-11>2026-09-18:T-46',runAfter:0,owed:false} },

{ name:'T-46 final pay: release is REFUSED when the APPROVED 11–25 Sep run already paid ANA ₱4,363.64 — status stays approved, nothing is recorded; the default FROM moves past that run (26 Sep, 0 days) and the 13th-month base is that run\'s ₱4,363.64',
  run:async()=>{
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    setE([ana]);loadEmployees();setA({});
    localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    const line=calcEmployeePayroll(ana,'2026-09-11','2026-09-25','semi_monthly');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-09-11',type:'semi_monthly',status:'approved',periodStart:'2026-09-11',periodEnd:'2026-09-25',lines:[line]}]));
    const d=hnxFinalPayDefaults('ANA');
    const forced=Object.assign({},d,{unpaidFrom:'2026-09-11',daysWorked:6,daysInPeriod:11});
    hnxPrepareFinalPay('ANA',forced);hnxApproveFinalPay('ANA');hnxReleaseFinalPay('ANA',{method:'Bank transfer',ref:'X2'});
    const rec=hnxFinalPayFor('ANA');
    return {defFrom:d.unpaidFrom,defDays:d.daysWorked,defT13base:d.ytdBasic13,wages:rec.calc.baseWagesLastPeriod,status:rec.status,
      settled:JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length};
  },
  expect:{defFrom:'2026-09-26',defDays:0,defT13base:4363.64,wages:4363.64,status:'approved',settled:0} },

{ name:'final pay calculator = the engine: office ₱16,000, 11–25 Aug 2026 (21 Aug special, no records) pays ₱8,000.00 (11 days) not ₱7,272.70; 26 Aug–10 Sep with a REJECTED Sunday 6 Sep pays ₱8,000.00 at ₱727.27/day, not ₱8,866.71 at ₱666.67',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-21':{name:'Ninoy Aquino Day',kind:'special'},'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{
    const ann=office('ANN','ANN',{monthlyBasic:16000,status:'Resigned',lastWorkingDay:'2026-09-10'});setE([ann]);setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    const a=hnxFinalPayCompute('ANN',{lastDay:'2026-08-25',unpaidFrom:'2026-08-11'});
    setA({'2026-09-06':{ANN:rec('present','07:00','17:00')}});
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify({'ANN|2026-09-06':{acct:'ok',final:'no',finalBy:'Dr Amy'}}));
    const b=hnxFinalPayCompute('ANN',{lastDay:'2026-09-10',unpaidFrom:'2026-08-26'});
    return {aDays:a.days,aUnpaid:a.unpaidSalary,aRate:a.dailyRate,bRate:b.dailyRate,bUnpaid:b.unpaidSalary,bSun:b.sunPay};
  },
  expect:{aDays:11,aUnpaid:8000,aRate:727.27,bRate:727.27,bUnpaid:8000,bSun:0} },

{ name:'final pay calculator: office ₱16,000, 26 Aug → Wed 2 Sep 2026 (31 Aug regular holiday), 5 SIL days: rate ₱727.27 not ₱666.67, unpaid ₱3,636.36 not ₱4,000.02, SIL ₱3,636.35 not ₱3,333.35; a six-day card is priced ₱615.38',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{
    const ann=office('ANN','ANN',{monthlyBasic:16000,status:'Resigned',lastWorkingDay:'2026-09-02'});
    const ed=office('ED','EDERLYN',{monthlyBasic:16000,sixDayWeek:true,status:'Resigned',lastWorkingDay:'2026-09-02'});
    setE([ann,ed]);setA({});localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    const r=hnxFinalPayCompute('ANN',{lastDay:'2026-09-02',unpaidFrom:'2026-08-26',silDays:5});
    const r2=hnxFinalPayCompute('ED',{lastDay:'2026-09-02',unpaidFrom:'2026-08-26'});
    return {rate:r.dailyRate,unpaid:r.unpaidSalary,sil:r.silPay,days:r.basicDays,edRate:r2.dailyRate};
  },
  expect:{rate:727.27,unpaid:3636.36,sil:3636.35,days:5,edRate:615.38} },

{ name:'final pay carries the allowances of its days: office ₱4,000/mo, last day Mon 14 Sep 2026 = ₱363.64 (2 of 11 days); weekly ₱2,600/mo over 5 Mon–Sat days = ₱500.00 + ₱100/day × 5 = ₱500.00 (₱1,000.00) beside basic ₱3,290.00',
  run:async()=>{
    const of=office('OF','OFFICE',{monthlyBasic:16000,allowances:[{type:'transport',monthly:4000,taxable:false}],status:'Resigned',lastWorkingDay:'2026-09-14'});
    const wk=labour('WK','WORKER',{allowances:[{type:'meal',monthly:2600},{type:'site',perDay:100}],status:'Resigned',lastWorkingDay:'2026-09-15'});
    setE([of,wk]);localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15'].forEach(d=>{a[d]={WK:rec('present','07:00','17:00')};});setA(a);
    const x=hnxFinalPayCompute('OF',{lastDay:'2026-09-14',unpaidFrom:'2026-09-11'});
    const y=hnxFinalPayCompute('WK',{lastDay:'2026-09-15',unpaidFrom:'2026-09-10'});
    return {ofAllow:x.allowPay,ofDays:x.days,ofGrossHasIt:Math.round((x.gross-x.unpaidSalary-x.thirteenth)*100)/100,wkAllow:y.allowPay,wkDays:y.days,wkBasic:y.unpaidSalary};
  },
  expect:{ofAllow:363.64,ofDays:2,ofGrossHasIt:363.64,wkAllow:1000,wkDays:5,wkBasic:3290} },

{ name:'final pay carries trips, one-time and memos: driver ₱658/day, FROM Thu 10 → Tue 15 Sep, Manila trips 11 & 14 Sep = ₱3,400, ₱50/day meal × 5 + ₱500 one-time = ₱750, signed memo ₱300; once RECORDED the 10–16 Sep run pays none of them again (₱0 trips, 1 day left) and drops him',
  run:async()=>{
    const dr=labour('DRV','DRIVER',{allowances:[{type:'meal',perDay:50}]});setE([dr]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={DRV:rec('present','07:00','17:00')};});setA(a);
    const TR=JSON.stringify({live:{areas:[{id:'mnl',name:'MANILA',d1:1700,d2:1700,h1:650,h2:650}]}});
    const TL=JSON.stringify([{id:'t1',date:'2026-09-11',driverId:'DRV',helperId:'',truck:'V1',trips:['mnl'],status:'approved'},{id:'t2',date:'2026-09-14',driverId:'DRV',helperId:'',truck:'V1',trips:['mnl'],status:'approved'}]);
    const put=()=>{localStorage.setItem('hydroPro_trip_rates_v1',TR);localStorage.setItem('hydroPro_trip_log_v1',TL);
      localStorage.setItem('hydroPro_onetime_allow_v1',JSON.stringify([{empId:'DRV',date:'2026-09-14',amount:500,label:'Toll refund',taxable:false}]));
      localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'m1',category:'hr',type:'good',empId:'DRV',date:'2026-09-11',totalAmount:300,status:'signed'}]));};
    put();localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    const f=hnxFinalPayCompute('DRV',{lastDay:'2026-09-15',unpaidFrom:'2026-09-10'});
    const before=calcEmployeePayroll(dr,'2026-09-10','2026-09-16','weekly');
    hnxFinalPay('DRV');await sleep(300);
    const ov=document.getElementById('hnxFinalPayOverlay');
    const set=(id,v)=>{const el=ov.querySelector('#'+id);el.value=v;el.onchange();};
    set('fpLast','2026-09-15');set('fpFrom','2026-09-10');
    put();hnxFinalPayRecordPaid();await sleep(200);
    const st=JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]');
    put();const after=calcEmployeePayroll(dr,'2026-09-10','2026-09-16','weekly');
    ov.remove();
    return {trips:f.tripPay,allow:f.allowPay,memo:f.memoAddPay,days:f.days,beforeTrips:before.tripIncentive,settled:st.map(x=>x.from+'>'+x.to).join(','),
      afterTrips:after.tripIncentive,afterOnetime:(after.onetimeList||[]).length,afterMemo:after.memoAdd,afterDays:after.daysWorked,
      owed:_payStillOwed(Object.assign({},dr,{status:'Resigned',lastWorkingDay:'2026-09-15'}),{start:'2026-09-10',end:'2026-09-16'})};
  },
  expect:{trips:3400,allow:750,memo:300,days:5,beforeTrips:3400,settled:'2026-09-10>2026-09-15',afterTrips:0,afterOnetime:0,afterMemo:0,afterDays:1,owed:false} },

{ name:'final pay statutory, weekly Regular ₱610/day: last approved week 10–16 Sep, last day Fri 18 Sep, FROM 17 Sep → deducts 2/30 of ₱1,210.50 = ₱80.70 (SSS ₱45.00), not the 7 days ending 18 Sep = ₱282.45',
  run:async()=>{
    const e=labour('RG','REGULAR',{dailyRate:610,status:'Resigned',lastWorkingDay:'2026-09-18'});setE([e]);
    setA({'2026-09-17':{RG:rec('present','07:00','17:00')},'2026-09-18':{RG:rec('present','07:00','17:00')}});
    localStorage.setItem('hnxFinalPaySettled','[]');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10',type:'weekly',status:'approved',periodStart:'2026-09-10',periodEnd:'2026-09-16',lines:[{empId:'RG',name:'REGULAR',basicPay:3050,sundayPremium:0,employmentType:'Regular'}]}]));
    const r=hnxFinalPayCompute('RG',{lastDay:'2026-09-18',unpaidFrom:'2026-09-17'});
    const old=statutoryForPeriod(e,'weekly','2026-09-18');
    return {gov:r.govDed,sss:r.stat.sss,unpaid:r.unpaidSalary,oldGov:Math.round((old.sss+old.phic+old.hdmf)*100)/100};
  },
  expect:{gov:80.7,sss:45,unpaid:1220,oldGov:282.45} },

{ name:'13th month, ONE rule: labourer ₱658/day (dailyRate only), 3 approved weeks of ₱3,948 = ₱987.00 in the accrual, the payroll calculator and the HR 📋 Final Pay (a stored DRAFT week is not counted; no more ₱0.00); Consultant ₱12,500/cut-off = ₱0 in the calculator and T-46; Contractual ₱12,000 = ₱1,000.00',
  run:async()=>{
    const lb=labour('LB','LABOURER',{status:'Resigned',lastWorkingDay:'2026-09-02'});
    const cs=office('CS','CONSULTANT',{monthlyBasic:25000,employmentType:'Consultant',status:'Resigned',lastWorkingDay:'2026-09-10'});
    const ct=office('CT','CONTRACTUAL',{monthlyBasic:24000,employmentType:'Contractual',status:'Resigned',lastWorkingDay:'2026-09-10'});
    setE([lb,cs,ct]);loadEmployees();setA({});localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    const wkRun=(s,e,st)=>({id:'ops_'+s,type:'weekly',status:st,periodStart:s,periodEnd:e,lines:[{empId:'LB',name:'LABOURER',basicPay:3948,sundayPremium:0,employmentType:'Regular'}]});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([wkRun('2026-07-30','2026-08-05','approved'),wkRun('2026-08-06','2026-08-12','approved'),wkRun('2026-08-13','2026-08-19','approved'),wkRun('2026-08-20','2026-08-26','draft'),
      {id:'office_2026-07-26',type:'semi_monthly',status:'approved',periodStart:'2026-07-26',periodEnd:'2026-08-10',lines:[
        {empId:'CS',name:'CONSULTANT',basicPay:12500,sundayPremium:0,employmentType:'Consultant',salaryCategory:'accounting'},
        {empId:'CT',name:'CONTRACTUAL',basicPay:12000,sundayPremium:0,employmentType:'Contractual',salaryCategory:'accounting'}]}]));
    const lbAcc=hnx13thFor('LB','2026').amount;
    const lbCalc=hnxFinalPayCompute('LB',{lastDay:'2026-09-02',unpaidFrom:'2026-09-03'}).thirteenth;
    payOfficeFinalPayDialog('LB');await sleep(200);
    const o=document.getElementById('payFinalPayOverlay');const t=o?o.innerText.replace(/\s+/g,' '):'';if(o)o.remove();
    const m=t.match(/13th Month Pay ₱([\d,.]+)/);
    const csAcc=hnx13thFor('CS','2026',{emp:cs});
    const csCalc=hnxFinalPayCompute('CS',{lastDay:'2026-09-10',unpaidFrom:'2026-08-11'}).thirteenth;
    const csT46=hnxComputeFinalPay(hnxFinalPayDefaults('CS')).prorated13thMonth;
    const ctAcc=hnx13thFor('CT','2026',{emp:ct}).amount;
    return {lbAcc,lbCalc,lbHr:m?m[1]:t.slice(0,120),cs:csAcc.amount,csExcl:csAcc.excluded,csCalc,csT46,ct:ctAcc};
  },
  expect:{lbAcc:987,lbCalc:987,lbHr:'987.00',cs:0,csExcl:true,csCalc:0,csT46:0,ct:1000} },

{ name:'final pay record: FROM 12 Sep inside the 10–16 Sep week, with 10–11 Sep paid by no approved run → the UNPAID DAYS CHECK names 2026-09-10 → 2026-09-11, and Cancel records nothing',
  run:async()=>{
    const g=labour('GP','GAP');setE([g]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15'].forEach(d=>{a[d]={GP:rec('present','07:00','17:00')};});setA(a);
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    hnxFinalPay('GP');await sleep(300);
    const ov=document.getElementById('hnxFinalPayOverlay');
    const set=(id,v)=>{const el=ov.querySelector('#'+id);el.value=v;el.onchange();};
    set('fpLast','2026-09-15');set('fpFrom','2026-09-12');
    const msgs=[];const oc=window.confirm;window.confirm=m=>{msgs.push(String(m));return !/UNPAID DAYS CHECK/.test(String(m));};
    hnxFinalPayRecordPaid();window.confirm=oc;ov.remove();
    return {warned:msgs.some(m=>/UNPAID DAYS CHECK/.test(m)&&/2026-09-10 → 2026-09-11/.test(m)),recorded:JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length};
  },
  expect:{warned:true,recorded:0} }
];
