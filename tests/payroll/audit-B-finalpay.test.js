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

{ name:'13th month, ONE rule: labourer ₱658/day (dailyRate only), 3 approved weeks of ₱3,948 = ₱987.00 in the accrual, the payroll calculator and the HR 📋 Final Pay (a stored DRAFT week is not counted; no more ₱0.00); Consultant ₱12,500/cut-off = ₱0 in the calculator and T-46; Contractual ₱12,000 = ₱1,000.00 — OWNER DECISION PENDING (Option A kept, as the accrual report marks it): the final pay says so on screen',
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
    const ctCalc=hnxFinalPayCompute('CT',{lastDay:'2026-09-10',unpaidFrom:'2026-08-11'});
    return {lbAcc,lbCalc,lbHr:m?m[1]:t.slice(0,120),cs:csAcc.amount,csExcl:csAcc.excluded,csCalc,csT46,ct:ctAcc,ctNote:/owner/i.test(String(ctCalc&&ctCalc.note13||''))};
  },
  expect:{lbAcc:987,lbCalc:987,lbHr:'987.00',cs:0,csExcl:true,csCalc:0,csT46:0,ct:1000,ctNote:true} },

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
  expect:{warned:true,recorded:0} },
/* ---- round 2 (the reviewer's problems with the v20.97 batch) ---- */
{ name:'T-46, daily-rated office card (₱700/day, no monthly base): last day Fri 24 Jul 2026 = 10 of 10 days of 11–25 Jul = ₱7,000.00 at ₱700 — the engine\'s ₱7,000.00, not 10 × ₱770 = ₱7,700.00; 13th ₱583.33; last day Tue 10 Feb 2026 = 12 days = ₱8,400.00 (not 12 × ₱641.67 = ₱7,700.00)',
  run:async()=>{
    const dr=office('DR','DAILY',{dailyRate:700,activeOverride:'inactive',activeOverrideAt:'2026-07-24T10:00:00.000Z',lastWorkingDay:'2026-07-24'});
    const dj=office('DJ','FEB',{dailyRate:700,activeOverride:'inactive',activeOverrideAt:'2026-02-10T10:00:00.000Z',lastWorkingDay:'2026-02-10'});
    setE([dr,dj]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    const d=hnxFinalPayDefaults('DR');const c=hnxComputeFinalPay(d);
    const eng=calcEmployeePayroll(dr,'2026-07-11','2026-07-25','semi_monthly');
    const d2=hnxFinalPayDefaults('DJ');const c2=hnxComputeFinalPay(d2);
    /* the Offboarding form path: the card shows "Daily rate" and Prepare keeps it */
    localStorage.setItem('hydroPro_offboarding_v1',JSON.stringify({DR:{empId:'DR',startedAt:'2026-07-01T01:00:00.000Z',holdPay:false}}));
    hnxOpenFinalPay('DR');await sleep(200);
    const formRate=+((document.getElementById('hnxFp_rate')||{}).value||0);
    hnxFpPrepareFromForm('DR');hnxCloseFinalPay();
    const pr=hnxFinalPayFor('DR');
    return {from:d.unpaidFrom,days:d.daysWorked,rate:c.dailyRate,wages:c.baseWagesLastPeriod,engine:eng.basicPay,t13:c.prorated13thMonth,jFrom:d2.unpaidFrom,jDays:d2.daysWorked,jWages:c2.baseWagesLastPeriod,
      formRate,formWages:pr&&pr.calc.baseWagesLastPeriod};
  },
  expect:{from:'2026-07-11',days:10,rate:700,wages:7000,engine:7000,t13:583.33,jFrom:'2026-01-26',jDays:12,jWages:8400,formRate:700,formWages:7000} },

{ name:'last working day AFTER today (office ₱16,000, last day = end of the current cut-off): T-46 release is REFUSED — status stays approved, nothing settled (a day after today, ₱727.27, would otherwise be paid by nobody) — and the calculator\'s Record as PAID is refused too',
  run:async()=>{
    const add=(d,n)=>{const t=new Date(d+'T00:00:00');t.setDate(t.getDate()+n);return ymd(t);};
    const per=hnxPayPeriodOf(true,today);const last=per.end>today?per.end:add(today,1);
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:today+'T01:00:00.000Z',lastWorkingDay:last});
    setE([ana]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    const d=hnxFinalPayDefaults('ANA');
    hnxPrepareFinalPay('ANA',d);hnxApproveFinalPay('ANA');
    const msgs=[];const oa=window.alert;window.alert=m=>{msgs.push(String(m));};
    hnxReleaseFinalPay('ANA',{method:'Bank transfer',ref:'F1'});
    const rec=hnxFinalPayFor('ANA');
    const st1=JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length;
    hnxFinalPay('ANA');await sleep(300);
    const ov=document.getElementById('hnxFinalPayOverlay');
    const set=(id,v)=>{const el=ov.querySelector('#'+id);el.value=v;el.onchange();};
    set('fpLast',last);set('fpFrom',d.unpaidFrom);
    hnxFinalPayRecordPaid();await sleep(100);
    window.alert=oa;ov.remove();
    return {status:rec.status,settledT46:st1,settledCalc:JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length,said:msgs.filter(m=>/after today/i.test(m)).length};
  },
  expect:{status:'approved',settledT46:0,settledCalc:0,said:2} },

{ name:'T-46 edited "Unpaid from": approved run to 10 Sep, last day Fri 18 Sep, FROM moved to 15 Sep in the form → release REFUSED naming 2026-09-11 → 2026-09-14 (11 and 14 Sep, ₱1,454.55 nobody would pay); FROM moved back to 1 Sep across two cut-offs → 14 days are not silently capped to 11 (₱10,181.82 shown, not ₱8,000.00) and release is REFUSED',
  run:async()=>{
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    const ben=office('BEN','BEN',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    setE([ana,ben]);loadEmployees();setA({});
    localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    localStorage.setItem('hydroPro_offboarding_v1',JSON.stringify({ANA:{empId:'ANA',startedAt:'2026-09-01T01:00:00.000Z',holdPay:false},BEN:{empId:'BEN',startedAt:'2026-09-01T01:00:00.000Z',holdPay:false}}));
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-08-26_2026-09-10',type:'semi_monthly',status:'approved',periodStart:'2026-08-26',periodEnd:'2026-09-10',lines:[{empId:'ANA',name:'ANA',basicPay:8000,sundayPremium:0,employmentType:'Regular'}]}]));
    const msgs=[];const oa=window.alert;window.alert=m=>{msgs.push(String(m));};
    hnxOpenFinalPay('ANA');await sleep(200);
    const defFrom=document.getElementById('hnxFp_from').value;
    document.getElementById('hnxFp_from').value='2026-09-15';hnxFpRefreshDays('ANA');
    const dw=+document.getElementById('hnxFp_dw').value;
    hnxFpPrepareFromForm('ANA');hnxApproveFinalPay('ANA');hnxReleaseFinalPay('ANA',{method:'Cash',ref:'U1'});
    hnxCloseFinalPay();
    const a1=hnxFinalPayFor('ANA').status;
    const w=hnxFinalPayWindow('BEN','2026-09-01','2026-09-18');
    const bi=Object.assign({},hnxFinalPayDefaults('BEN'),{unpaidFrom:'2026-09-01',daysWorked:w.basicDays});
    hnxPrepareFinalPay('BEN',bi);hnxApproveFinalPay('BEN');hnxReleaseFinalPay('BEN',{method:'Cash',ref:'U2'});
    window.alert=oa;
    const b=hnxFinalPayFor('BEN');
    return {defFrom,dw,aStatus:a1,named:msgs.some(m=>/2026-09-11 → 2026-09-14/.test(m)),bDays:w.basicDays,bWages:b.calc.baseWagesLastPeriod,bStatus:b.status,
      settled:JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length};
  },
  expect:{defFrom:'2026-09-11',dw:4,aStatus:'approved',named:true,bDays:14,bWages:10181.82,bStatus:'approved',settled:0} },

{ name:'T-46 release re-reads payroll: prepared with 6 days (₱4,363.64, last day 18 Sep), then 14 Sep is marked absent → payroll now pays 5 days (₱3,636.36) → release REFUSED until re-prepared, nothing settled',
  run:async()=>{
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    setE([ana]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    const d=hnxFinalPayDefaults('ANA');hnxPrepareFinalPay('ANA',d);hnxApproveFinalPay('ANA');
    setA({'2026-09-14':{ANA:rec('absent','','','manual',{editedBy:'hr'})}});
    const now=hnxFinalPayWindow('ANA','2026-09-11','2026-09-18');
    const msgs=[];const oa=window.alert;window.alert=m=>{msgs.push(String(m));};
    hnxReleaseFinalPay('ANA',{method:'Cash',ref:'S1'});window.alert=oa;
    const r=hnxFinalPayFor('ANA');
    return {prepDays:r.inputs.daysWorked,prepWages:r.calc.baseWagesLastPeriod,nowDays:now.basicDays,nowBasic:now.weekdayPay,status:r.status,
      settled:JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length,said:msgs.some(m=>/re-prepare/i.test(m))};
  },
  expect:{prepDays:6,prepWages:4363.64,nowDays:5,nowBasic:3636.36,status:'approved',settled:0,said:true} },

{ name:'final pay calculator FROM skips only APPROVED runs: labourer, approved 27 Aug–2 Sep and 3–9 Sep (₱3,948 each), a DRAFT 10–16 Sep, last day 18 Sep → FROM prefilled 10 Sep (not 17 Sep), 8 days ₱5,264.00, 13th = (7,896 + 3,948 + 1,316) ÷ 12 = ₱1,096.67 (not ₱767.67)',
  run:async()=>{
    const lb=labour('LB','LABOURER',{status:'Resigned',lastWorkingDay:'2026-09-18'});setE([lb]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18'].forEach(d=>{a[d]={LB:rec('present','07:00','17:00')};});setA(a);
    localStorage.setItem('hnxFinalPaySettled','[]');
    const wk=(s,e,st)=>({id:'ops_'+s+'_'+e,type:'weekly',status:st,periodStart:s,periodEnd:e,lines:[{empId:'LB',name:'LABOURER',basicPay:3948,sundayPremium:0,employmentType:'Regular'}]});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([wk('2026-08-27','2026-09-02','approved'),wk('2026-09-03','2026-09-09','approved'),wk('2026-09-10','2026-09-16','draft')]));
    hnxFinalPay('LB');await sleep(300);
    const ov=document.getElementById('hnxFinalPayOverlay');const from=ov.querySelector('#fpFrom').value;ov.remove();
    const r=hnxFinalPayCompute('LB',{lastDay:'2026-09-18',unpaidFrom:from});
    return {from,days:r.days,basic:r.weekdayPay,t13:r.thirteenth};
  },
  expect:{from:'2026-09-10',days:8,basic:5264,t13:1096.67} },

{ name:'final pay carries the office PER-PERIOD allowance entries: last day Tue 28 Jul 2026 (2 of 11 days of 26 Jul–10 Aug), a ₱1,500 entry typed for that cut-off is paid in full + a carried ₱1,000 transportation × 2/11 = ₱181.82 → ₱1,681.82 (gross ₱3,257.58, was ₱1,575.76); once RECORDED a run still holding the card pays ₱0 of the ₱1,500 and ₱818.18 carried (9 of 11 days) — every peso once',
  run:async()=>{
    const of=office('OF','OFFICE',{monthlyBasic:16000,status:'Resigned',lastWorkingDay:'2026-07-28'});setE([of]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    const K='office_2026-07-26_2026-08-10';
    localStorage.setItem('hydroPro_employee_allowances_v1',JSON.stringify({[K]:{OF:[{id:'AL_typed',catId:'others',amount:1500,note:'site'},{id:'AL_car',catId:'transportation',amount:1000,carriedFrom:'office_2026-07-11_2026-07-25'}]}}));
    const f=hnxFinalPayCompute('OF',{lastDay:'2026-07-28',unpaidFrom:'2026-07-26'});
    hnxFinalPay('OF');await sleep(300);
    const ov=document.getElementById('hnxFinalPayOverlay');
    const set=(id,v)=>{const el=ov.querySelector('#'+id);el.value=v;el.onchange();};
    set('fpLast','2026-07-28');set('fpFrom','2026-07-26');
    hnxFinalPayRecordPaid();await sleep(200);ov.remove();
    const act=Object.assign({},of,{status:'Active',lastWorkingDay:''});
    const l=hnxApplyPeriodAllowances(calcEmployeePayroll(act,'2026-07-26','2026-08-10','semi_monthly'),K);
    return {allow:f.allowPay,basic:f.unpaidSalary,t13:f.thirteenth,gross:f.gross,settled:JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]').length,
      runAllow:l.allowanceTotal,runTyped:(l.allowanceEntries||[]).some(a=>a&&a.id==='AL_typed')};
  },
  expect:{allow:1681.82,basic:1454.55,t13:121.21,gross:3257.58,settled:1,runAllow:818.18,runTyped:false} },

{ name:'final pay carries a ₱400 one-time payment dated Wed 5 Aug, AFTER the last day Tue 28 Jul but inside the same cut-off, and an unpaid ₱1,500 referral bonus the engine carries (gross ₱3,475.76, was ₱1,575.76); once RECORDED the bonus is marked paid by the final pay and a run still holding the card pays neither again. (The HR referral ledger loaders are not global in this build, so the engine never sees a staged bonus — the case exposes them the way the engine looks them up.)',
  run:async()=>{
    window._loadPayrollBonuses=()=>{try{return JSON.parse(localStorage.getItem('hydroPro_hr_payroll_bonuses')||'[]');}catch(e){return [];}};
    window._savePayrollBonuses=a=>localStorage.setItem('hydroPro_hr_payroll_bonuses',JSON.stringify(a||[]));
    const rf=office('RF','REFERRER',{monthlyBasic:16000,status:'Resigned',lastWorkingDay:'2026-07-28'});setE([rf]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');
    localStorage.setItem('hydroPro_hr_payroll_bonuses',JSON.stringify([{id:'rb1',employeeId:'RF',type:'referral',amount:1500,paidInPayroll:false,awardedAt:new Date('2026-07-20T02:00:00Z').getTime(),description:'Referral'}]));
    localStorage.setItem('hydroPro_onetime_allow_v1',JSON.stringify([{id:'ot1',empId:'RF',date:'2026-08-05',amount:400,label:'Uniform refund',taxable:false}]));
    const f=hnxFinalPayCompute('RF',{lastDay:'2026-07-28',unpaidFrom:'2026-07-26'});
    hnxFinalPay('RF');await sleep(300);
    const ov=document.getElementById('hnxFinalPayOverlay');
    const set=(id,v)=>{const el=ov.querySelector('#'+id);el.value=v;el.onchange();};
    set('fpLast','2026-07-28');set('fpFrom','2026-07-26');
    hnxFinalPayRecordPaid();await sleep(200);ov.remove();
    const b=JSON.parse(localStorage.getItem('hydroPro_hr_payroll_bonuses')||'[]')[0]||{};
    const l=calcEmployeePayroll(Object.assign({},rf,{status:'Active',lastWorkingDay:''}),'2026-07-26','2026-08-10','semi_monthly');
    return {ref:f.referral,allow:f.allowPay,gross:f.gross,paid:!!b.paidInPayroll,by:/^finalpay_RF_/.test(String(b.payrollRunId||'')),
      runRef:l.referralBonus,runOne:(l.onetimeList||[]).length};
  },
  expect:{ref:1500,allow:400,gross:3475.76,paid:true,by:true,runRef:0,runOne:0} },

{ name:'T-46: moving "Unpaid from" re-reads Other deductions too — a signed ₱500 deduction memo dated 11 Sep leaves the window when FROM moves to 14 Sep: 6 → 5 days, Other deductions ₱500.00 → ₱0.00, and ₱0.00 is what gets prepared',
  run:async()=>{
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    setE([ana]);loadEmployees();setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hnxFinalPaySettled','[]');localStorage.setItem('hydroPro_final_pay_v1','{}');
    localStorage.setItem('hydroPro_offboarding_v1',JSON.stringify({ANA:{empId:'ANA',startedAt:'2026-09-01T01:00:00.000Z',holdPay:false}}));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'md1',category:'hr',type:'bad',empId:'ANA',date:'2026-09-11',totalAmount:500,status:'signed'}]));
    hnxOpenFinalPay('ANA');await sleep(200);
    const g=id=>document.getElementById(id).value;
    const before=+g('hnxFp_other'),dw0=+g('hnxFp_dw');
    document.getElementById('hnxFp_from').value='2026-09-14';hnxFpRefreshDays('ANA');
    const after=+g('hnxFp_other'),dw1=+g('hnxFp_dw');
    hnxFpPrepareFromForm('ANA');hnxCloseFinalPay();
    return {before,dw0,dw1,after,prepared:+hnxFinalPayFor('ANA').inputs.otherDeductions};
  },
  expect:{before:500,dw0:6,dw1:5,after:0,prepared:0} },

{ name:'T-46 13th month: clearing the "13th-month base" field on a new-style record means ₱0 of earlier basic — 6 of 11 days on ₱16,000 = ₱4,363.64 ÷ 12 = ₱363.64, never the old 16,000 × 9 ÷ 12 = ₱12,000.00 (a legacy record keeps its formula)',
  run:async()=>{
    const n=hnxComputeFinalPay({payType:'semi_monthly',baseSalary:16000,daysWorked:6,daysInPeriod:11,ytdBasic13:'',monthsWorkedThisYear:9});
    const lg=hnxComputeFinalPay({baseSalary:16000,daysWorked:15,daysInPeriod:15,monthsWorkedThisYear:9});
    return {t13:n.prorated13thMonth,legacy:lg.prorated13thMonth};
  },
  expect:{t13:363.64,legacy:12000} },

{ name:'a T-46 final pay RELEASED before v20.97 (no settlement row) is closed to payroll once: last day 18 Sep → 2026-09-11 → 2026-09-18 settled (src T-46-legacy) and the 11–25 Sep run no longer re-admits her (it would have paid ₱4,363.64 a second time); one whose days an approved run already paid gets no row; a second pass adds nothing',
  run:async()=>{
    const ana=office('ANA','ANA',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-18T10:00:00.000Z',lastWorkingDay:'2026-09-18'});
    const bo=office('BO','BO',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-10T10:00:00.000Z',lastWorkingDay:'2026-09-10'});
    setE([ana,bo]);loadEmployees();setA({});localStorage.setItem('hnxFinalPaySettled','[]');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-08-26_2026-09-10',type:'semi_monthly',status:'approved',periodStart:'2026-08-26',periodEnd:'2026-09-10',lines:[{empId:'BO',name:'BO',basicPay:8000,sundayPremium:0}]}]));
    const legacy=(id,last)=>({status:'released',empId:id,inputs:{baseSalary:16000,daysWorked:15,daysInPeriod:15,monthsWorkedThisYear:9,lastWorkingDay:last},calc:{baseWagesLastPeriod:16000,netFinalPay:28000},lastWorkingDay:last,releasedAt:'2026-09-19T01:00:00.000Z'});
    localStorage.setItem('hydroPro_final_pay_v1',JSON.stringify({ANA:legacy('ANA','2026-09-18'),BO:legacy('BO','2026-09-10')}));
    const runBefore=calcEmployeePayroll(ana,'2026-09-11','2026-09-25','semi_monthly').basicPay;
    const before=_payStillOwed(ana,{start:'2026-09-11',end:'2026-09-25'});
    const n=hnxFinalPayMigrateLegacy();const n2=hnxFinalPayMigrateLegacy();
    const st=JSON.parse(localStorage.getItem('hnxFinalPaySettled')||'[]');
    return {runBefore,before,n,n2,settled:st.map(x=>x.empId+':'+x.from+'>'+x.to+':'+x.src).join(','),owed:_payStillOwed(ana,{start:'2026-09-11',end:'2026-09-25'}),
      runAfter:calcEmployeePayroll(ana,'2026-09-11','2026-09-25','semi_monthly').basicPay};
  },
  expect:{runBefore:4363.64,before:true,n:1,n2:0,settled:'ANA:2026-09-11>2026-09-18:T-46-legacy',owed:false,runAfter:0} }
];
