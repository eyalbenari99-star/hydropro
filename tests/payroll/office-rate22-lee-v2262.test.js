/* v22.62 — two pay rules Eyal stated on 11 Oct 2026, as numbers.
   A. Office: "For office salaries the daily rate jump higher. Should be basic divided normally by working days lets do 22 days a
      month just for safe so basic daily (on that you can add Sundays plus 30%) 727.27p" · "the pmt should be full 2 weeks working
      days for this example 8,000p Sunday's will be daily rate (basic money divided by 22) plus 30%" · "for all office only".
   B. Lee: "Also Lee coming Thursday 8am instead 7am should deduct for him 1h from daily rate each Thursday and its not done". */
const NOHOL=()=>{localStorage.setItem('hydroPro_ph_holidays','{}');};
module.exports=[
{ name:'office ₱16,000, 11–25 Jul 2026 (10 working days): day rate 16,000 ÷ 22 = 727.27 (was 800.00); full cut-off pays 8,000.00; 1 day absent 7,272.73 (was 7,200.00); 2 days absent 6,545.45',
  seed:NOHOL,
  run:async()=>{const a1=office('A1','ANA',{monthlyBasic:16000});setE([a1]);setA({});
    const full=calcEmployeePayroll(a1,'2026-07-11','2026-07-25','semi_monthly');
    setA({'2026-07-15':{A1:{status:'absent',source:'manual',editedBy:'jinky'}}});
    const one=calcEmployeePayroll(a1,'2026-07-11','2026-07-25','semi_monthly');
    setA({'2026-07-15':{A1:{status:'absent',source:'manual',editedBy:'jinky'}},'2026-07-22':{A1:{status:'absent',source:'manual',editedBy:'jinky'}}});
    const two=calcEmployeePayroll(a1,'2026-07-11','2026-07-25','semi_monthly');
    return {rate:Math.round(full.dailyRate*100)/100,periodRate:full.periodRate,basic:full.basicPay,oneBasic:Math.round(one.basicPay*100)/100,oneAbs:one.daysAbsentUnauth,twoBasic:Math.round(two.basicPay*100)/100,why:/÷ 22 = 727\.27/.test(full.rateWhy||full.rateWhyText||'')};},
  expect:{rate:727.27,periodRate:800,basic:8000,oneBasic:7272.73,oneAbs:1,twoBasic:6545.45,why:true} },

{ name:'office ₱16,000, 26 Aug–10 Sep 2026 (12 working days, no holiday set): day rate 727.27 (was 666.67); full cut-off 8,000.00; 1 day absent 7,272.73 (was 7,333.33); 2 signed Sundays add 727.27 × 1.3 × 2 = 1,890.91 (Sun OT), basic still 8,000.00',
  seed:NOHOL,
  run:async()=>{const a1=office('A1','ANA',{monthlyBasic:16000});setE([a1]);setA({});
    const full=calcEmployeePayroll(a1,'2026-08-26','2026-09-10','semi_monthly');
    setA({'2026-09-02':{A1:{status:'absent',source:'manual',editedBy:'jinky'}}});
    const one=calcEmployeePayroll(a1,'2026-08-26','2026-09-10','semi_monthly');
    setA({'2026-08-30':{A1:rec('present','07:00','17:00')},'2026-09-06':{A1:rec('present','07:00','17:00')}});
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify({'A1|2026-08-30':{acct:'ok',final:'ok',acctBy:'jinky',finalBy:'Eyal'},'A1|2026-09-06':{acct:'ok',final:'ok',acctBy:'jinky',finalBy:'Eyal'}}));
    const sun=calcEmployeePayroll(a1,'2026-08-26','2026-09-10','semi_monthly');
    return {rate:Math.round(full.dailyRate*100)/100,basic:full.basicPay,oneBasic:Math.round(one.basicPay*100)/100,sunN:sun.sundaysWorked,sunPrem:sun.sundayPremium,sunBasic:Math.round((sun.basicPay-sun.sundayPremium)*100)/100};},
  expect:{rate:727.27,basic:8000,oneBasic:7272.73,sunN:2,sunPrem:1890.91,sunBasic:8000} },

{ name:'office ₱16,000 hired Mon 20 Jul 2026 in 11–25 Jul: his 5 days pay 5 × 800 = 4,000.00 as before (never a negative); 1 of them absent costs 727.27 → 3,272.73',
  seed:NOHOL,
  run:async()=>{const a1=office('A1','ANA',{monthlyBasic:16000,dateHired:'2026-07-20',hireDate:'2026-07-20'});setE([a1]);
    setA({'2026-07-20':{A1:rec('present','07:00','17:00')}});
    const l=calcEmployeePayroll(a1,'2026-07-11','2026-07-25','semi_monthly');
    setA({'2026-07-20':{A1:rec('present','07:00','17:00')},'2026-07-22':{A1:{status:'absent',source:'manual',editedBy:'jinky'}}});
    const a=calcEmployeePayroll(a1,'2026-07-11','2026-07-25','semi_monthly');
    return {basic:Math.round(l.basicPay*100)/100,absBasic:Math.round(a.basicPay*100)/100};},
  expect:{basic:4000,absBasic:3272.73} },

{ name:'office ₱16,000, 11–25 Jul 2026: a 60-minute late signed "deduct" costs 60/480 × 727.27 = 90.91 (was 100.00); the Weekend Approvals / Late screens quote the same 727.27 (rateFor rate 727.2727, periodRate 800)',
  seed:NOHOL,
  run:async()=>{const a1=office('A1','ANA',{monthlyBasic:16000});setE([a1]);
    setA({'2026-07-15':{A1:rec('late','08:00','17:00')}});
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-07-15|A1':{decision:'deduct',lateMinutes:60,by:'Eyal',at:Date.now()}}));
    const l=calcEmployeePayroll(a1,'2026-07-11','2026-07-25','semi_monthly');
    const r=window.HNXPeriod.rateFor(a1,'2026-07-11','2026-07-25');
    return {tardy:l.tardyDeduction,basic:l.basicPay,rate:r.rate,periodRate:r.periodRate};},
  expect:{tardy:90.91,basic:8000,rate:727.2727,periodRate:800} },

{ name:'Lee (BORRETA, LEJANE, weekly ₱658), week 5–10 Oct 2026, Thursday 8 Oct in at 08:00: not a late (not held, not queued), 1 h deducted automatically = 658 ÷ 8 = 82.25; 6 days, basic 3,948.00; label "1 × 1 h — Thursday 08:00 start"',
  seed:NOHOL,
  run:async()=>{const lee=labour('EMP1061','BORRETA, LEJANE DJ',{dept:'APTI_REGULAR'});setE([lee]);const a={};
    ['2026-10-05','2026-10-06','2026-10-07','2026-10-09','2026-10-10'].forEach(d=>{a[d]={EMP1061:rec('present','07:00','17:00')};});
    a['2026-10-08']={EMP1061:rec('late','08:00','17:00')};setA(a);
    const l=calcEmployeePayroll(lee,'2026-10-05','2026-10-10','weekly');
    const q=(window.hnxLate&&window.hnxLate.scan)?window.hnxLate.scan('2026-10-05','2026-10-10'):[];
    return {days:l.daysWorked,basic:l.basicPay,tardy:l.tardyDeduction,held:l.lateHeld,pending:l.latePending,ss:l.shortStartDays,ssAmt:l.shortStartAmt,queued:q.length,label:hnxLateDedLabel(l)};},
  expect:{days:6,basic:3948,tardy:82.25,held:0,pending:0,ss:1,ssAmt:82.25,queued:0,label:'1 × 1 h — Thursday 08:00 start'} },

{ name:'Lee, Thursday 8 Oct in at 08:20: the 20 minutes after 08:00 wait for Eyal / Dr Amy (day held 658.00) and the hour is still deducted (82.25) → Tardy 740.25; signed "deduct" 20 min → 27.42 + 82.25 = 109.67',
  seed:NOHOL,
  run:async()=>{const lee=labour('EMP1061','BORRETA, LEJANE DJ',{dept:'APTI_REGULAR'});setE([lee]);const a={};
    ['2026-10-05','2026-10-06','2026-10-07','2026-10-09','2026-10-10'].forEach(d=>{a[d]={EMP1061:rec('present','07:00','17:00')};});
    a['2026-10-08']={EMP1061:Object.assign(rec('late','08:20','17:00'),{lateMinutes:80})};setA(a);
    const held=calcEmployeePayroll(lee,'2026-10-05','2026-10-10','weekly');
    const q=window.hnxLate.scan('2026-10-05','2026-10-10');
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-10-08|EMP1061':{decision:'deduct',lateMinutes:20,by:'Eyal',at:Date.now()}}));
    const ded=calcEmployeePayroll(lee,'2026-10-05','2026-10-10','weekly');
    return {heldTardy:held.tardyDeduction,heldN:held.lateHeld,qMins:q.map(x=>x.mins).join(','),dedTardy:ded.tardyDeduction};},
  expect:{heldTardy:740.25,heldN:1,qMins:'20',dedTardy:109.67} },

{ name:'only Lee, only Thursdays from 8 Oct 2026: another labourer in at 08:00 on Thu 8 Oct is a 60-minute late (held 658.00, queued); Lee on Thu 1 Oct at 08:00 is a normal late (held 658.00); Lee absent on Thu 8 Oct: no hour deducted (5 days, 3,290.00, tardy 0)',
  seed:NOHOL,
  run:async()=>{const lee=labour('EMP1061','BORRETA, LEJANE DJ',{dept:'APTI_REGULAR'}),jo=labour('JO','JO SANTOS');setE([lee,jo]);const a={};
    ['2026-10-05','2026-10-06','2026-10-07','2026-10-09','2026-10-10'].forEach(d=>{a[d]={JO:rec('present','07:00','17:00')};});
    a['2026-10-08']={JO:rec('late','08:00','17:00')};
    ['2026-09-28','2026-09-29','2026-09-30','2026-10-02','2026-10-03'].forEach(d=>{a[d]={EMP1061:rec('present','07:00','17:00')};});
    a['2026-10-01']={EMP1061:rec('late','08:00','17:00')};
    ['2026-10-05','2026-10-06','2026-10-07','2026-10-09','2026-10-10'].forEach(d=>{a[d].EMP1061=rec('present','07:00','17:00');});
    setA(a);
    const j=calcEmployeePayroll(jo,'2026-10-05','2026-10-10','weekly');
    const q=window.hnxLate.scan('2026-10-05','2026-10-10').map(x=>x.empId).join(',');
    const old=calcEmployeePayroll(lee,'2026-09-28','2026-10-03','weekly');
    const abs=calcEmployeePayroll(lee,'2026-10-05','2026-10-10','weekly');
    return {joTardy:j.tardyDeduction,joSS:j.shortStartDays,queued:q,oldTardy:old.tardyDeduction,oldSS:old.shortStartDays,absDays:abs.daysWorked,absBasic:abs.basicPay,absTardy:abs.tardyDeduction};},
  expect:{joTardy:658,joSS:0,queued:'JO',oldTardy:658,oldSS:0,absDays:5,absBasic:3290,absTardy:0} }
];
