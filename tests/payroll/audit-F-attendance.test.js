/* Audit batch F-attendance: attendance → pay. Every case names the numbers the owner's rule gives.
   The week used is Thu 10 – Wed 16 Sep 2026 (labour) and the office cut-off 26 Aug – 10 Sep 2026
   (31 Aug National Heroes Day, regular: ÷11, ₱16,000/month = ₱727.27/day) — both wholly in the past. */
module.exports=[
{ name:"NGTeco Timecard re-upload keeps a Reconcile 'sent home' day: 15 Sep stays absent, week = 5 days ₱3,290 (not 6 days ₱3,948)",
  run:async()=>{const e=labour('JO','JO');setE([e]);const a={};
    a['2026-09-08']={JO:rec('present','07:00','17:00')};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-16'].forEach(d=>{a[d]={JO:rec('present','07:00','17:00')};});
    /* Reconcile ▸ 'sent home': absent + reason, the source stays 'fingerprint' */
    a['2026-09-15']={JO:{status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'fingerprint',reason:'Late — sent home (not allowed to enter)'}};setA(a);
    const rows=[['Person Name','Date','Clock In','Clock Out']];
    [['09/10/2026','07:00','17:00'],['09/11/2026','07:00','17:00'],['09/12/2026','07:00','17:00'],['09/14/2026','07:00','17:00'],['09/15/2026','08:30','17:00'],['09/16/2026','07:00','17:00']].forEach(r=>rows.push(['JO',r[0],r[1],r[2]]));
    const realX=window.XLSX;window.XLSX={utils:{sheet_to_json:ws=>ws.__rows}};
    let res;try{res=window.hnxImportNgTimecard({SheetNames:['S'],Sheets:{S:{__rows:rows}}},'tc.xlsx');}finally{window.XLSX=realX;}
    const r15=JSON.parse(localStorage.getItem('hydroPro_attendance'))['2026-09-15'].JO;
    const l=L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));
    return {kept:res.keptManual,st15:r15.status,src15:r15.source,days:l.days,absU:l.absU,basic:l.basic,latePending:l.latePending};},
  expect:{kept:1,st15:'absent',src15:'fingerprint',days:5,absU:1,basic:3290,latePending:0} },

{ name:"NGTeco Timecard row with blank Clock In/Out is not a paid day: blank Mon 14 & Sun 13 pay ₱0 — week 5 days ₱3,290; a stored blank 'present' is refused (noProof)",
  run:async()=>{const e=labour('JO','JO');setE([e]);setA({'2026-09-08':{JO:rec('present','07:00','17:00')}});
    const rows=[['Person Name','Date','Clock In','Clock Out']];
    [['09/10/2026','07:00','17:00'],['09/11/2026','07:00','17:00'],['09/12/2026','07:00','17:00'],['09/13/2026','',''],['09/14/2026','',''],['09/15/2026','07:00','17:00'],['09/16/2026','07:00','17:00']].forEach(r=>rows.push(['JO',r[0],r[1],r[2]]));
    const realX=window.XLSX;window.XLSX={utils:{sheet_to_json:ws=>ws.__rows}};
    try{window.hnxImportNgTimecard({SheetNames:['S'],Sheets:{S:{__rows:rows}}},'tc.xlsx');}finally{window.XLSX=realX;}
    const A=JSON.parse(localStorage.getItem('hydroPro_attendance'));
    const w14=!!(A['2026-09-14']&&A['2026-09-14'].JO),w13=!!(A['2026-09-13']&&A['2026-09-13'].JO);
    const imp=L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));
    /* data written by the old importer before this fix: blank present rows on Sun 13 and Mon 14 */
    A['2026-09-13']={JO:{status:'present',timeIn:'',timeOut:'',lateMinutes:0,source:'timecard-bridge'}};
    A['2026-09-14']={JO:{status:'present',timeIn:'',timeOut:'',lateMinutes:0,source:'timecard-bridge'}};setA(A);
    const old=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    return {w14,w13,impDays:imp.days,impBasic:imp.basic,impGap:imp.gap,
      oldDays:old.daysWorked,oldBasic:old.basicPay,noProof:(old.dayAudit||{}).noProof,oldGap:old.daysGap};},
  expect:{w14:false,w13:false,impDays:5,impBasic:3290,impGap:0,oldDays:5,oldBasic:3290,noProof:2,oldGap:0} },

{ name:"office ₱16,000/month, Date Hired blank: a first-ever manual absent on Thu 3 Sep is not a start date — 10 of 11 days = ₱7,272.73 (was 5 days ₱3,636.36); a first-ever SCAN still is (6 days ₱4,363.64)",
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const o=office('ACC','ACCOUNTANT',{monthlyBasic:16000,dailyRate:undefined,dateHired:'',hireDate:''});setE([o]);
    setA({'2026-09-03':{ACC:{status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'manual',editedBy:'jinky',reason:'absent'}}});
    const abs=calcEmployeePayroll(o,'2026-08-26','2026-09-10','semi_monthly');
    setA({'2026-09-03':{ACC:rec('present','07:00','17:30')}});
    const scan=calcEmployeePayroll(o,'2026-08-26','2026-09-10','semi_monthly');
    return {absImplied:abs.impliedStart,absDays:abs.daysWorked,absU:abs.daysAbsentUnauth,absBasic:abs.basicPay,scanImplied:scan.impliedStart,scanBasic:scan.basicPay};},
  expect:{absImplied:'',absDays:10,absU:1,absBasic:7272.73,scanImplied:'2026-09-03',scanBasic:4363.64} },

{ name:"late: a signed 300-min deduct after HR corrects Time In to 07:30 takes 30/480 × ₱658 = ₱41.13 (not ₱411.25) and asks for a re-decision; a record that grew 60→120 min still takes only the signed ₱82.25",
  run:async()=>{const e=labour('T1','TEST LATE');setE([e]);const a={};
    a['2026-09-08']={T1:rec('present','07:00','17:00')};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-16'].forEach(d=>{a[d]={T1:rec('present','07:00','17:00')};});
    a['2026-09-15']={T1:rec('late','12:00','17:00','fingerprint',{lateMinutes:300})};setA(a);
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-09-15|T1':{date:'2026-09-15',empId:'T1',decision:'deduct',lateMinutes:300,by:'Eyal',at:Date.now()}}));
    const signed=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    a['2026-09-15']={T1:rec('late','07:30','17:00','fingerprint',{lateMinutes:30,editedBy:'hr'})};setA(a);
    const fixed=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    const q=window.hnxLate.scan('2026-09-15','2026-09-15','T1')[0]||{};
    const pend=window.hnxLate.pendingCount('2026-09-15','2026-09-15');
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({'2026-09-15|T1':{date:'2026-09-15',empId:'T1',decision:'deduct',lateMinutes:60,by:'Eyal',at:Date.now()}}));
    a['2026-09-15']={T1:rec('late','09:00','17:00','fingerprint',{lateMinutes:120})};setA(a);
    const grew=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    return {signed:signed.tardyDeduction,fixed:fixed.tardyDeduction,fixedMins:fixed.lateDecidedMins,reDecide:fixed.lateReDecide,
      qReDecide:q.reDecide,qCharged:q.chargedMins,pend,grew:grew.tardyDeduction,grewReDecide:grew.lateReDecide};},
  expect:{signed:411.25,fixed:41.13,fixedMins:30,reDecide:1,qReDecide:true,qCharged:30,pend:1,grew:82.25,grewReDecide:1} },

{ name:"Late approvals quotes the rate payroll uses: HR-card labourer (rate 658, no dailyRate) 240 min late = deduct ₱329.00 (was ₱0.00); stale dailyRate 600 + override 700, 120 min = ₱175.00 (was ₱150.00)",
  run:async()=>{const a=labour('HC','HRCARD',{dailyRate:undefined,rate:658,rateOverride:658});const b=labour('ST','STALE',{dailyRate:600,rateOverride:700});setE([a,b]);
    const A={};A['2026-09-08']={HC:rec('present','07:00','17:00'),ST:rec('present','07:00','17:00')};
    A['2026-09-15']={HC:rec('late','11:00','17:00','fingerprint',{lateMinutes:240}),ST:rec('late','09:00','17:00','fingerprint',{lateMinutes:120})};setA(A);
    try{if(typeof loadEmployees==='function')loadEmployees();}catch(e){}
    window.renderHrLateView();window.hnxLateSet('from','2026-09-15');window.hnxLateSet('to','2026-09-15');await sleep(300);
    const v=document.getElementById('view-hr_late');const rows=[...v.querySelectorAll('tr')];
    const btn=nm=>{const tr=rows.find(r=>(r.textContent||'').indexOf(nm)>=0);const b=tr&&[...tr.querySelectorAll('button')].find(x=>/deduct/.test(x.textContent||''));return b?b.textContent.trim():null;};
    const qa=btn('HRCARD'),qb=btn('STALE');
    window.hnxLate.decide('2026-09-15','HC','deduct',0,'','HRCARD',240);window.hnxLate.decide('2026-09-15','ST','deduct',0,'','STALE',120);
    const pa=calcEmployeePayroll(a,'2026-09-15','2026-09-15','weekly').tardyDeduction,pb=calcEmployeePayroll(b,'2026-09-15','2026-09-15','weekly').tardyDeduction;
    return {qa,qb,pa,pb};},
  expect:{qa:'deduct ₱329.00',qb:'deduct ₱175.00',pa:329,pb:175} },

{ name:"½ Half day, then HR sets Time Out 17:00 in the day editor: the day pays in full — 6 days ₱3,948 (was 5.5 days ₱3,619)",
  run:async()=>{const e=labour('HD','HALF DAY');setE([e]);const a={};
    a['2026-09-08']={HD:rec('present','07:00','17:00')};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-16'].forEach(d=>{a[d]={HD:rec('present','07:00','17:00')};});
    a['2026-09-15']={HD:rec('present','07:00','12:00','fingerprint',{dayFraction:0.5,reason:' [Half day — no afternoon scan]'})};setA(a);
    try{if(typeof loadEmployees==='function')loadEmployees();}catch(x){}
    const before=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    attCurrentDate='2026-09-15';openAttDay('HD');await sleep(200);
    const box=document.getElementById('attHalfDay');const shown=!!(box&&box.checked);
    const to=document.getElementById('attTimeOut');to.value='17:00';to.dispatchEvent(new Event('change'));
    const unticked=!!(box&&!box.checked);
    attSaveDay();await sleep(200);
    const r=JSON.parse(localStorage.getItem('hydroPro_attendance'))['2026-09-15'].HD;
    const after=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    return {beforeDays:before.daysWorked,beforeBasic:before.basicPay,shown,unticked,frac:r.dayFraction===undefined?'gone':r.dayFraction,out:r.timeOut,days:after.daysWorked,basic:after.basicPay};},
  expect:{beforeDays:5.5,beforeBasic:3619,shown:true,unticked:true,frac:'gone',out:'17:00',days:6,basic:3948} },

{ name:"labour: a nameless HR-sheet VL Thu 10 – Wed 16 Sep pays the 5 weekdays = ₱3,290 — the Sunday is rest (was +₱658); a Sunday leave a person signed still pays (6 = ₱3,948)",
  run:async()=>{const e=labour('VL','VACATION');setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-13','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={VL:{status:'authorized',timeIn:'',timeOut:'',lateMinutes:0,source:'hrmatrix'}};});setA(a);
    const sheet=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    a['2026-09-13']={VL:{status:'authorized',timeIn:'',timeOut:'',lateMinutes:0,source:'manual',editedBy:'jinky',reason:'VL approved'}};setA(a);
    const signed=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    return {absA:sheet.daysAbsentAuth,rest:(sheet.dayAudit||{}).rest,basic:sheet.basicPay,gap:sheet.daysGap,signedAbsA:signed.daysAbsentAuth,signedBasic:signed.basicPay};},
  expect:{absA:5,rest:1,basic:3290,gap:0,signedAbsA:6,signedBasic:3948} },

{ name:"Fill from Timecards: 'Late, Early Leave' on a worked Sat 12 Sep 07:40–15:30 stays a worked late day — 6 days ₱3,948 and the 40-min late waits for a decision (was paid-leave refused: 5 days ₱3,290)",
  run:async()=>{const e=labour('JO','JO');setE([e]);setA({});
    const rows=[['JO','2026-09-10','07:00','17:00',''],['JO','2026-09-11','07:00','17:00',''],['JO','2026-09-12','07:40','15:30','Late, Early Leave'],
      ['JO','2026-09-14','07:00','17:00',''],['JO','2026-09-15','07:00','17:00',''],['JO','2026-09-16','07:00','17:00',''],['JO','2026-09-09','','','Sick Leave']];
    localStorage.setItem('hydroPro_timecard_runs_v1',JSON.stringify([{id:'tc1',headers:['Name','Date','Time In','Time Out','Exception'],rows:rows}]));
    window.hnxTcToAttendance('2026-09-09','2026-09-16');
    const A=JSON.parse(localStorage.getItem('hydroPro_attendance'));const s=A['2026-09-12'].JO,sick=A['2026-09-09'].JO;
    const l=L(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'));
    return {st:s.status,late:s.lateMinutes,sick:sick.status,days:l.days,basic:l.basic,latePending:l.latePending,satNoProof:l.satNoProof};},
  expect:{st:'late',late:40,sick:'authorized',days:6,basic:3948,latePending:1,satNoProof:0} },

{ name:"Attendance Matrix agrees with payroll on Saturday: a fingerprint 07:00 scan and a timecard 07:02–16:58 are worked days (7 days ₱4,606 each), not 'Sat rest'",
  run:async()=>{const f=labour('FP','FINGER');const t=labour('TC','TIMECARD');setE([f,t]);const a={};
    ['2026-09-10','2026-09-11','2026-09-13','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={FP:rec('present','07:00','17:00'),TC:rec('present','07:00','17:00')};});
    a['2026-09-12']={FP:rec('present','07:00','','fingerprint',{fpRaw:{scansCount:1}}),TC:rec('present','07:02','16:58','timecard-bridge')};setA(a);
    const pf=calcEmployeePayroll(f,'2026-09-10','2026-09-16','weekly'),pt=calcEmployeePayroll(t,'2026-09-10','2026-09-16','weekly');
    window.hnxAttMatrix();await sleep(300);window.__attMxSet('from','2026-09-10');window.__attMxSet('until','2026-09-16');await sleep(400);
    const cell=nm=>{const td=[...document.querySelectorAll('#hnxAttMx td[title]')].find(x=>(x.getAttribute('title')||'').indexOf(nm+' · 2026-09-12')===0);return td?td.getAttribute('title'):null;};
    const cf=cell('FINGER'),ct=cell('TIMECARD');
    try{document.getElementById('hnxAttMx').remove();}catch(e){}
    return {payF:[pf.daysWorked,pf.basicPay],payT:[pt.daysWorked,pt.basicPay],fFound:!!cf,tFound:!!ct,fRest:/Saturday — rest day/.test(cf||''),tRest:/Saturday — rest day/.test(ct||'')};},
  expect:{payF:[7,4606],payT:[7,4606],fFound:true,tFound:true,fRest:false,tRest:false} },

{ name:"payslip day trace: office clerk with no records, 26 Aug–10 Sep — 11 days PAID (engine ₱8,000), none 'counted ABSENT'",
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const o=office('OC','OFFICE CLERK',{monthlyBasic:16000});setE([o]);
    setA({'2026-09-02':{ZZ:rec('present','07:00','17:30')}}); /* somebody else scanned: the old trace blamed name matching */
    const h=window.hnxDaysTrace('OC','2026-08-26','2026-09-10','semi_monthly');
    const l=calcEmployeePayroll(o,'2026-08-26','2026-09-10','semi_monthly');
    const m=/why Days = (\d+)/.exec(h);
    return {traceDays:m?+m[1]:null,absentWord:/counted ABSENT/.test(h),blamesMatching:/does not match their HR record/.test(h),engineDays:l.daysWorked,basic:l.basicPay};},
  expect:{traceDays:11,absentWord:false,blamesMatching:false,engineDays:11,basic:8000} },

{ name:"Weekend Approvals prices the engine's rate: basic saved as monthlySalary ₱16,000, Sun 6 Sep = 727.27 × 1.30 = ₱945.45 (was ₱0.00) and the signed run pays ₱945.45; six-day Saturdays, management and consultants need no signature",
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const o=office('MS','MONTHLY SALARY',{dailyRate:undefined,monthlySalary:16000});setE([o]);
    setA({'2026-09-06':{MS:rec('present','08:00','12:00')}});
    const q=window.hnxWkRateFor(o,'2026-09-06');
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify({'MS|2026-09-06':{acct:'ok',acctBy:'Jinky',final:'ok',finalBy:'Eyal'}}));
    const l=calcEmployeePayroll(o,'2026-08-26','2026-09-10','semi_monthly');
    const sk=[window.hnxWkSkip({sixDayWeek:true},6),window.hnxWkSkip({sixDayWeek:true},0),window.hnxWkSkip({salaryCategory:'management'},0),window.hnxWkSkip({employmentType:'Consultant'},0),window.hnxWkSkip({employmentType:'Contractual'},0)];
    return {rate:q.rate,quote:+(q.rate*1.3).toFixed(2),paid:l.sundayPremium,skips:sk};},
  expect:{rate:727.27,quote:945.45,paid:945.45,skips:['six','','mgmt','fixed','']} },

{ name:"office 'Contractual' clerk's SIGNED Sunday 6 Sep pays 727.27 × 1.30 = ₱945.45 (was ₱0, dropped as a consultant); a Consultant's still pays ₱0; Contractual stays in the 13th-month test",
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));},
  run:async()=>{const c=office('CT','CONTRACTUAL',{monthlyBasic:16000,employmentType:'Contractual'});const k=office('CS','CONSULTANT',{monthlyBasic:16000,employmentType:'Consultant'});setE([c,k]);
    setA({'2026-09-06':{CT:rec('present','08:00','15:00'),CS:rec('present','08:00','15:00')}});
    const unsigned=calcEmployeePayroll(c,'2026-08-26','2026-09-10','semi_monthly');
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify({'CT|2026-09-06':{acct:'ok',acctBy:'Jinky',final:'ok',finalBy:'Eyal'},'CS|2026-09-06':{acct:'ok',acctBy:'Jinky',final:'ok',finalBy:'Eyal'}}));
    const lc=calcEmployeePayroll(c,'2026-08-26','2026-09-10','semi_monthly'),lk=calcEmployeePayroll(k,'2026-08-26','2026-09-10','semi_monthly');
    const ff=['Contractual','Contractor','Consultant','Advisor','Regular'].map(t=>window.hnxIsFixedFee({employmentType:t}));
    return {pendingBefore:(unsigned.pending||{}).sun,contractual:lc.sundayPremium,consultant:lk.sundayPremium,fixedFee:ff};},
  expect:{pendingBefore:{n:1,amt:945.45},contractual:945.45,consultant:0,fixedFee:[false,true,true,true,false]} },

{ name:"v20.99: the office run's default 'only with attendance' filter is unchanged — an Active clerk with NO record is not silently added (adding everyone would also start paying management; owner decision); the Approve & Lock check below names her with the ₱8,000 half-month at stake",
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'NOREC',name:'NO RECORD, CLERK',status:'Active',salaryCategory:'accounting',dept:'APTI_ACCOUNTING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'},
      {id:'SCAN1',name:'SCANS, CLERK',status:'Active',salaryCategory:'accounting',dept:'APTI_ACCOUNTING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'}]));
    localStorage.removeItem('hydroPro_pay_filter_v1');},
  run:async()=>{const p=getSemiMonthPeriod(today);const A={};A[p.start]={SCAN1:{status:'present',timeIn:'07:00',timeOut:'17:30',lateMinutes:0,source:'fingerprint'}};setA(A);
    try{loadEmployees();}catch(e){}
    window._payOfficeCurrentPeriod=p;switchView('payroll_office');await sleep(4000);
    try{renderPayrollOffice();}catch(e){}await sleep(500);
    const run=getPayrollRun(payOfficeRunId(p))||{};const ids=(run.lines||[]).map(l=>l.empId).sort();
    return {norec:ids.indexOf('NOREC')>=0,scan:ids.indexOf('SCAN1')>=0};},
  expect:{norec:false,scan:true} },

{ name:"the 8-second draft scrub keeps lines the roster pays: an APAC_PACKAGING office clerk and a leaver in her final cut-off (₱8,000 + ₱3,000 stay in the stored office draft)",
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'PK1',name:'PACKAGING, CLERK',status:'Active',dept:'APAC_PACKAGING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'},
      {id:'LV1',name:'LEAVER, ANN',status:'Resigned',salaryCategory:'accounting',dept:'APTI_ACCOUNTING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01',lastWorkingDay:'2026-09-03'},
      {id:'LB1',name:'LABOUR, JO',status:'Active',salaryCategory:'production',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01'}]));
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-08-26_2026-09-10',type:'semi_monthly',status:'draft',periodStart:'2026-08-26',periodEnd:'2026-09-10',
      lines:[{empId:'PK1',name:'PACKAGING, CLERK',basicPay:8000,netPay:8000},{empId:'LV1',name:'LEAVER, ANN',basicPay:3000,netPay:3000},{empId:'LB1',name:'LABOUR, JO',basicPay:3948,netPay:3948}],totals:{basicPay:14948,netPay:14948}}]));},
  run:async()=>{await sleep(9500);
    const runs=JSON.parse(localStorage.getItem('hydroPro_payroll_runs')||'[]');const r=runs.find(x=>x&&x.id==='office_2026-08-26_2026-09-10')||{};
    return {ids:(r.lines||[]).map(l=>l.empId).sort()};},
  expect:{ids:['LV1','PK1']} },
{ name:"Approve & Lock check names an inferred start (Date Hired blank: 2 working days ≈ ₱1,454.54 unpaid), a signed late the record no longer matches, and an Active office clerk missing from the run (₱8,000)",
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'IMP',name:'IMPLIED, START',status:'Active',salaryCategory:'accounting',dept:'APTI_ACCOUNTING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:''},
      {id:'LRD',name:'LATE, REDECIDE',status:'Active',salaryCategory:'accounting',dept:'APTI_ACCOUNTING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'},
      {id:'MISS',name:'MISSING, CLERK',status:'Active',salaryCategory:'accounting',dept:'APTI_ACCOUNTING',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'}]));
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-07-26_2026-08-10',type:'semi_monthly',status:'draft',periodStart:'2026-07-26',periodEnd:'2026-08-10',
      lines:[{empId:'IMP',name:'IMPLIED, START',impliedStart:'2026-07-29',dailyRate:727.27,daysWorked:8,basicPay:5818.16,netPay:5818.16},
             {empId:'LRD',name:'LATE, REDECIDE',lateReDecide:1,dailyRate:727.27,daysWorked:11,basicPay:8000,netPay:7958.33}],totals:{netPay:13776.49}}]));},
  run:async()=>{window._payOfficeCurrentPeriod={start:'2026-07-26',end:'2026-08-10',label:'test'};
    for(let i=0;i<20&&!(window.payOfficeApprove&&window.payOfficeApprove.__ai);i++)await sleep(500);
    const gated=!!(window.payOfficeApprove&&window.payOfficeApprove.__ai);
    if(gated)window.payOfficeApprove();await sleep(400);
    const ov=document.getElementById('hnxAnomOv');const t=ov?ov.textContent:'';if(ov)ov.remove();
    const run=getPayrollRun('office_2026-07-26_2026-08-10')||{};
    return {gated,implied:/IMPLIED, START: Date Hired is BLANK.*2 working day\(s\) before it are NOT paid \(about ₱1,?454\.54\)/.test(t),
      redecide:/LATE, REDECIDE: 1 signed late deduction\(s\) no longer match/.test(t),missing:/MISSING, CLERK: Active OFFICE employee NOT in this run.*₱8,?000\.00 left unpaid/.test(t),stillDraft:run.status};},
  expect:{gated:true,implied:true,redecide:true,missing:true,stillDraft:'draft'} },
{ name:"13th-month accrual keeps a Production-Contractual worker: ₱3,948 basic → ₱329.00 accrued (was left out); a Consultant and management stay out",
  run:async()=>{const yr=today.slice(0,4);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_'+yr+'-01-01_'+yr+'-01-07',type:'weekly',status:'approved',periodStart:yr+'-01-01',periodEnd:yr+'-01-07',
      lines:[{empId:'C1',name:'CONTRACTUAL, JO',salaryCategory:'production_contractual',employmentType:'Contractual',basicPay:3948,sundayPremium:0},
             {empId:'K1',name:'CONSULTANT, ED',salaryCategory:'accounting',employmentType:'Consultant',basicPay:8000,sundayPremium:0},
             {empId:'M1',name:'MANAGER, AMY',salaryCategory:'management',employmentType:'Regular',basicPay:15000,sundayPremium:0},
             {empId:'R1',name:'REGULAR, BEN',salaryCategory:'production_regular',employmentType:'Regular',basicPay:3948,sundayPremium:0}]}]));
    let html='';const real=window.open;window.open=function(){return {document:{write:h=>{html+=h;},close:()=>{}},print:()=>{}};};
    try{window.hnx13th();}finally{window.open=real;}
    const row=nm=>{const m=new RegExp(nm+'[^<]*(?:<small>[^<]*</small>)?</td><td>([^<]*)</td><td>([^<]*)</td>').exec(html);return m?[m[1],m[2]].map(x=>+String(x).replace(/[^0-9.]/g,'')):null;};
    return {contractual:row('CONTRACTUAL, JO'),regular:row('REGULAR, BEN'),consultant:row('CONSULTANT, ED'),manager:row('MANAGER, AMY'),note:/Includes 1 Contractual/.test(html)};},
  expect:{contractual:[3948,329],regular:[3948,329],consultant:null,manager:null,note:true} },
];
