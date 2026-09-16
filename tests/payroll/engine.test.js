/* The payroll engine's rules, as the owner stated them, as numbers. */
module.exports=[
{ name:'contractor: a Sunday scan pays flat, 7 scans = 7 days (v20.61)',
  run:async()=>{const e=labour('ERIC','ERIC',{employmentType:'Contractor'});setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-13','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={ERIC:rec('present','07:00','17:00')};});setA(a);
    return L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));},
  expect:{days:7,sun:1,basic:4606,rest:0,gap:0} },
{ name:'labour: Sunday with no scan is a rest day, not an absence (v20.65)',
  run:async()=>{const e=labour('L1','JO');setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={L1:rec('present','07:00','17:00')};});setA(a);
    return L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));},
  expect:{days:6,absU:0,rest:1,gap:0,basic:3948} },
{ name:'labour: a single fingerprint scan at exactly 07:00 on Saturday is a worked day (v20.65)',
  run:async()=>{const e=labour('L1','JO');setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-13','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={L1:rec('present','07:00','17:00')};});
    a['2026-09-12']={L1:rec('present','07:00','','fingerprint',{fpRaw:{scansCount:1}})};setA(a);
    return L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));},
  expect:{days:7,satNoProof:0,basic:4606,gap:0} },
{ name:'labour: a fabricated 07:00 Saturday placeholder (repair-fill) is still refused and counted (v20.59)',
  run:async()=>{const e=labour('L1','JO');setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-13','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={L1:rec('present','07:00','17:00')};});
    a['2026-09-12']={L1:rec('present','07:00','','repair-fill')};setA(a);
    return L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));},
  expect:{days:6,satNoProof:1,gap:0} },
{ name:'late gate: pending = full day, approved deduct = minutes/480 x rate, excused = nothing (v20.57)',
  run:async()=>{const e=labour('T1','TEST LATE');setE([e]);const a={};
    a['2026-09-08']={T1:rec('present','07:00','17:00')}; /* an old hand: the store holds days before this period */
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach((d,i)=>{a[d]={T1:i===0?rec('late','08:00','17:00'):rec('present','07:00','17:00')};});setA(a);
    const F=()=>L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));
    const pending=F();
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-09-10|T1':{decision:'deduct',lateMinutes:60,by:'Eyal',at:Date.now()}}));const deduct=F();
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-09-10|T1':{decision:'excuse',by:'Eyal',at:Date.now()}}));const excused=F();
    return {pending:{days:pending.days,tardy:pending.tardy,latePending:pending.latePending},deduct:{days:deduct.days,tardy:deduct.tardy},excused:{tardy:excused.tardy}};},
  expect:{'pending.days':6,'pending.tardy':0,'pending.latePending':1,'deduct.days':6,'deduct.tardy':82.25,'excused.tardy':0} },
{ name:'the three pending columns: late, memo, office Sunday - and they empty once approved (v20.61)',
  run:async()=>{const jo=labour('JO','JO');setE([jo]);const a={};
    a['2026-09-08']={JO:rec('present','07:00','17:00')};
    ['2026-09-10','2026-09-11','2026-09-14','2026-09-15','2026-09-16'].forEach((d,i)=>{a[d]={JO:i===0?rec('late','08:00','17:00'):rec('present','07:00','17:00')};});setA(a);
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M1',category:'hr',type:'good',empId:'JO',date:'2026-09-14',status:'pending',totalAmount:500,reasonLabel:'bonus'}]));
    const before=L(calcEmployeePayroll(jo,'2026-09-10','2026-09-16','weekly'));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M1',category:'hr',type:'good',empId:'JO',date:'2026-09-14',status:'signed',totalAmount:500,reasonLabel:'bonus'}]));
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-09-10|JO':{decision:'deduct',lateMinutes:60,by:'Eyal',at:Date.now()}}));
    const after=L(calcEmployeePayroll(jo,'2026-09-10','2026-09-16','weekly'));
    const ann=office('ANN','ANN');setE([ann]);localStorage.setItem('hydroPro_memos','[]');localStorage.setItem('hydroPro_late_approvals_v1','{}');
    const a3={};['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-13','2026-09-14','2026-09-15'].forEach(d=>{a3[d]={ANN:rec('present','07:00','17:30')};});setA(a3);
    const sun=L(calcEmployeePayroll(ann,'2026-09-01','2026-09-15','semi_monthly'));
    return {before:before.pending,after:after.pending,afterMemo:after.memoAdd,afterTardy:after.tardy,sun:sun.pending,sunPaid:sun.sun};},
  expect:{'before.late':[1,82.25],'before.memo':[1,500],'after.late':[0,0],'after.memo':[0,0],afterMemo:500,afterTardy:82.25,'sun.sun':[1,910],sunPaid:0} },
{ name:'today with no report is not an absence; a missing past day is, and is named (v20.64)',
  run:async()=>{const e=labour('ERIC','ERIC');const o=labour('OTH','OTHER');setE([e,o]);const days=daysEnding(today,7);const a={};
    days.slice(0,6).forEach(d=>{a[d]={ERIC:rec('present','07:00','17:00'),OTH:rec('present','07:00','17:00')};});setA(a);
    const A=L(calcEmployeePayroll(e,days[0],days[6],'weekly'));
    a[days[6]]={OTH:rec('present','07:00','17:00')};setA(a);const B=L(calcEmployeePayroll(e,days[0],days[6],'weekly'));
    delete a[days[1]].ERIC;setA(a);const C=L(calcEmployeePayroll(e,days[0],days[6],'weekly'));
    return {A:{absU:A.absU,todayWait:A.todayWait,gap:A.gap},B:{absU:B.absU,dates:B.absentDates},C:{absU:C.absU,dates:C.absentDates,gap:C.gap},d1:days[1],d6:days[6]};},
  expect:{'A.absU':0,'A.todayWait':1,'A.gap':0,'B.absU':1,'C.absU':2,'C.gap':0} },
{ name:'day audit raises no false alarm on an office half day or an unworked regular holiday (v20.65)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const ann=office('ANN','ANN');setE([ann]);const a={};
    ['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-14','2026-09-15'].forEach(d=>{a[d]={ANN:rec('present','07:00','17:30')};});
    a['2026-09-09']={ANN:rec('present','07:00','12:00','manual',{dayFraction:0.5,editedBy:'jinky'})};setA(a);
    const half=L(calcEmployeePayroll(ann,'2026-09-01','2026-09-15','semi_monthly'));
    const b={};['2026-08-26','2026-08-27','2026-08-28','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-07','2026-09-08','2026-09-09','2026-09-10'].forEach(d=>{b[d]={ANN:rec('present','07:00','17:30')};});setA(b);
    const hol=L(calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly'));
    return {half:{days:half.days,gap:half.gap},hol:{absA:hol.absA,gap:hol.gap}};},
  expect:{'half.days':10.5,'half.gap':0,'hol.absA':1,'hol.gap':0} },
{ name:'enrolment day: a new hire\'s first scan (within 14 days of the hire date) is never a late (v20.09)',
  run:async()=>{const e=labour('NEW','NEW HIRE',{dateHired:'2026-09-08',hireDate:'2026-09-08'});setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-14','2026-09-15','2026-09-16'].forEach((d,i)=>{a[d]={NEW:i===0?rec('late','10:00','17:00',null,{lateMinutes:180}):rec('present','07:00','17:00')};});setA(a);
    const l=L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));return {latePending:l.latePending,days:l.days};},
  expect:{latePending:0,days:5} },
{ name:'enrolment day: a long-employed worker whose OLDER records were purged is NOT waived (v20.66)',
  run:async()=>{const e=labour('OLD','OLD HAND',{dateHired:'2025-01-01',hireDate:'2025-01-01'});setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-14','2026-09-15','2026-09-16'].forEach((d,i)=>{a[d]={OLD:i===0?rec('late','08:00','17:00'):rec('present','07:00','17:00')};});setA(a);
    const l=L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));return {latePending:l.latePending};},
  expect:{latePending:1} },
{ name:'office: a SPECIAL holiday is not inside monthly/2 - unworked 16,000 pays 8,000.00 (not 8,800), worked adds only +30% = 8,218.18 (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-21':{name:'Ninoy Aquino Day',kind:'special'}}));},
  run:async()=>{const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);setA({});
    const unworked=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    setA({'2026-08-21':{ANN:rec('present','07:00','17:30')}});
    const worked=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    const mgmt=office('EY','EYAL',{monthlyBasic:30000,salaryCategory:'management',dept:'Management'});setE([mgmt]);setA({});
    const m=calcEmployeePayroll(mgmt,'2026-08-11','2026-08-25','semi_monthly');
    return {rate:Math.round(unworked.dailyRate*100)/100,unworked:unworked.basicPay,worked:worked.basicPay,workedHol:worked.holidayPay,mgmt:m.basicPay};},
  expect:{rate:727.27,unworked:8000,worked:8000,workedHol:218.18,mgmt:15000} },
{ name:'office: an absence a PERSON marked over a scan row deducts; a machine absent is still paid (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({'2026-09-01':{ANN:{status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'fingerprint',editedBy:'jinky',reason:'sent home'}}});
    const human=L(calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly'));
    setA({'2026-09-01':{ANN:{status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'fingerprint'}}});
    const machine=L(calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly'));
    return {human:{absU:human.absU,basic:human.basic,gap:human.gap},machine:{absU:machine.absU,basic:machine.basic}};},
  expect:{'human.absU':1,'human.basic':7272.73,'human.gap':0,'machine.absU':0,'machine.basic':8000} },
{ name:'leaver flagged inactive by the override is clamped to the Last Working Day like a status Inactive (v20.68)',
  run:async()=>{const ov=office('OV','OVERRIDE',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-03T10:00:00.000Z',lastWorkingDay:'2026-09-03'});
    const st=office('ST','STATUS',{monthlyBasic:16000,status:'Inactive',lastWorkingDay:'2026-09-03'});
    const nd=office('ND','NODATE',{monthlyBasic:16000,activeOverride:'inactive',activeOverrideAt:'2026-09-03T10:00:00.000Z'});setE([ov,st,nd]);setA({});
    const F=e=>{const l=calcEmployeePayroll(e,'2026-09-01','2026-09-15','semi_monthly');return {days:l.daysWorked,basic:l.basicPay};};
    return {ov:F(ov),st:F(st),nd:F(nd)};},
  expect:{'ov.days':3,'ov.basic':2181.82,'st.days':3,'st.basic':2181.82,'nd.days':3,'nd.basic':2181.82} },
{ name:'six-day office card: Saturday is a scheduled basic day, so a full half-month pays 8,000.00 not 11/13 (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const ed=office('ED','EDERLYN',{monthlyBasic:16000,sixDayWeek:true});setE([ed]);setA({});
    const empty=calcEmployeePayroll(ed,'2026-08-26','2026-09-10','semi_monthly');
    setA({'2026-08-29':{ED:rec('present','07:00','17:00')},'2026-09-05':{ED:rec('present','07:00','17:00')}});
    const sat=calcEmployeePayroll(ed,'2026-08-26','2026-09-10','semi_monthly');
    return {rate:Math.round(empty.dailyRate*100)/100,basic:empty.basicPay,sun:empty.sundaysWorked,gap:empty.daysGap,satBasic:sat.basicPay,satSun:sat.sundaysWorked,satPrem:sat.sundayPremium};},
  expect:{rate:615.38,basic:8000,sun:0,gap:0,satBasic:8000,satSun:0,satPrem:0} },
{ name:'management: a run generated BEFORE the cut-off\'s regular holiday does not pay the holiday twice (v20.68)',
  run:async()=>{const d=daysEnding(today,1)[0];const t=new Date(d+'T00:00:00');
    /* a 15-day window that starts today, with a regular holiday on its last weekday */
    const days=[];for(let i=0;i<15;i++){const x=new Date(t);x.setDate(x.getDate()+i);days.push(ymd(x));}
    const wk=days.filter(x=>{const w=new Date(x+'T00:00:00').getDay();return w>=1&&w<=5;});const hol=wk[wk.length-1];
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({[hol]:{name:'Test holiday',kind:'regular'}}));
    const m=office('EY','EYAL',{monthlyBasic:30000,salaryCategory:'management',dept:'Management'});setE([m]);setA({});
    const l=calcEmployeePayroll(m,days[0],days[14],'semi_monthly');
    return {basic:l.basicPay,rate:l.dailyRate,divisor:wk.length-1,hol};},
  expect:{basic:15000} },
];
