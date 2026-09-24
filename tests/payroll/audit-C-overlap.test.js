/* Audit batch C-overlap (v20.97): a labour close-day change, a labour <-> office category move and an
   office cut-off change must never pay a day twice, deduct a day's statutory share twice, take a memo
   twice, or leave a day in no run. Grid cases use fixed dates (the week grid is a pure function of the
   cut-off setting); engine cases use dates relative to the real today so they are always in the past. */
module.exports=[
{ name:'labour close day Wed→Sat (saved 23 Sep, effective 26 Sep, Thu 17–Wed 23 Sep approved): old week 24–30 Sep finishes, ONE bridging week Thu 1–Sat 3 Oct (3 days), then Sun 4–Sat 10 Oct; Mon 28 Sep opens 17–23 Sep (not 20–26); ▶ Next from 24–30 Sep = 1–3 Oct, no day in two weeks or none (v20.97)',
  seed:()=>{localStorage.removeItem('hydroPro_payroll_cutoff_v1');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-17_2026-09-23',type:'weekly',periodStart:'2026-09-17',periodEnd:'2026-09-23',status:'approved',lines:[{empId:'L1',name:'JO',daysWorked:6,netPay:3000}],totals:{netPay:3000}}]));},
  run:async()=>{
    hnxPayCutSettings();await sleep(300);
    document.getElementById('pcDow').value='6';document.getElementById('pcFrom').value='2026-09-26';
    hnxPayCutPrev();await sleep(100);
    const sw=(document.getElementById('pcSwitch')||{}).textContent||'';
    hnxPayCutSave();await sleep(300);
    const c=JSON.parse(localStorage.getItem('hydroPro_payroll_cutoff_v1')||'{}');
    const W=d=>{const w=HNX_containingWeek(d);return w.start+'_'+w.end;};
    const P=d=>{const w=getWeekPeriod(d);return w.start+'_'+w.end;};
    /* walk the grid: every week starts the day after the previous one ends */
    let p=HNX_containingWeek('2026-09-03'),chain=[],gaps=0;
    for(let i=0;i<8;i++){chain.push(p.start+'_'+p.end);const n=HNX_containingWeek(payShiftYMD(p.end,1));if(n.start!==payShiftYMD(p.end,1))gaps++;p=n;}
    window._payOpsCurrentPeriod=HNX_containingWeek('2026-09-30');
    payOpsShiftWeek(1);const n1=window._payOpsCurrentPeriod.start+'_'+window._payOpsCurrentPeriod.end;
    payOpsShiftWeek(1);const n2=window._payOpsCurrentPeriod.start+'_'+window._payOpsCurrentPeriod.end;
    payOpsShiftWeek(-1);const b1=window._payOpsCurrentPeriod.start+'_'+window._payOpsCurrentPeriod.end;
    payOpsShiftWeek(-1);const b2=window._payOpsCurrentPeriod.start+'_'+window._payOpsCurrentPeriod.end;
    return {laborFrom:(c.history&&c.history[0]&&c.history[0].laborFrom)||null,
      w0925:W('2026-09-25'),w1002:W('2026-10-02'),w1004:W('2026-10-04'),
      open0928:P('2026-09-28'),open1001:P('2026-10-01'),open1005:P('2026-10-05'),
      payday:HNX_containingWeek('2026-10-02').payday,
      chain,gaps,n1,n2,b1,b2,previewSaysBridge:/bridging week/.test(sw)&&/Oct 1, 2026 → Oct 3, 2026/.test(sw)};},
  expect:{laborFrom:'2026-10-01',w0925:'2026-09-24_2026-09-30',w1002:'2026-10-01_2026-10-03',w1004:'2026-10-04_2026-10-10',
    open0928:'2026-09-17_2026-09-23',open1001:'2026-09-24_2026-09-30',open1005:'2026-10-01_2026-10-03',payday:'2026-10-05',
    chain:['2026-09-03_2026-09-09','2026-09-10_2026-09-16','2026-09-17_2026-09-23','2026-09-24_2026-09-30','2026-10-01_2026-10-03','2026-10-04_2026-10-10','2026-10-11_2026-10-17','2026-10-18_2026-10-24'],
    gaps:0,n1:'2026-10-01_2026-10-03',n2:'2026-10-04_2026-10-10',b1:'2026-10-01_2026-10-03',b2:'2026-09-24_2026-09-30',previewSaysBridge:true} },

{ name:'labour close day Wed→Fri effective 1 Oct (the old "safe date"), 24–30 Sep approved: 1 Oct opens 24–30 Sep (not 19–25), 3 Oct opens the 2-day bridging week 1–2 Oct (not 26 Sep–2 Oct); a change saved while weekly payroll is approved to 14 Oct starts the new weeks on 15 Oct (v20.97)',
  seed:()=>{
    /* a change saved BEFORE v20.97 carries no laborFrom: the natural boundary applies */
    localStorage.setItem('hydroPro_payroll_cutoff_v1',JSON.stringify({office:{d1:10,d2:25},labor:{closeDow:5,paydayOffset:2},effectiveFrom:'2026-10-01',
      history:[{office:{d1:10,d2:25},labor:{closeDow:3,paydayOffset:2},until:'2026-10-01'}],previous:{office:{d1:10,d2:25},labor:{closeDow:3,paydayOffset:2}}}));},
  run:async()=>{
    const P=d=>{const w=getWeekPeriod(d);return w.start+'_'+w.end;};
    const W=d=>{const w=HNX_containingWeek(d);return w.start+'_'+w.end;};
    const legacy={open1001:P('2026-10-01'),open1003:P('2026-10-03'),w1005:W('2026-10-05'),w0930:W('2026-09-30')};
    /* now save a Wed→Fri change effective 1 Oct while weekly payroll is APPROVED up to Wed 14 Oct */
    localStorage.removeItem('hydroPro_payroll_cutoff_v1');
    const run=(s,e)=>({id:'ops_'+s+'_'+e,type:'weekly',periodStart:s,periodEnd:e,status:'approved',lines:[{empId:'L1',name:'JO'}]});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([run('2026-09-24','2026-09-30'),run('2026-10-01','2026-10-07'),run('2026-10-08','2026-10-14')]));
    hnxPayCutSettings();await sleep(300);
    document.getElementById('pcDow').value='5';document.getElementById('pcFrom').value='2026-10-01';
    hnxPayCutSave();await sleep(300);
    const c=JSON.parse(localStorage.getItem('hydroPro_payroll_cutoff_v1')||'{}');
    return Object.assign(legacy,{laborFrom:c.history&&c.history[0]&&c.history[0].laborFrom,w1009:W('2026-10-09'),w1015:W('2026-10-15'),w1017:W('2026-10-17')});},
  expect:{open1001:'2026-09-24_2026-09-30',open1003:'2026-10-01_2026-10-02',w1005:'2026-10-03_2026-10-09',w0930:'2026-09-24_2026-09-30',
    laborFrom:'2026-10-15',w1009:'2026-10-08_2026-10-14',w1015:'2026-10-15_2026-10-16',w1017:'2026-10-17_2026-10-23'} },

{ name:'overlapping labour week (Sun–Sat over an approved Thu–Wed week) pays only its 3 new days: 3 × ₱610 = ₱1,830 (not 6 × 610), the ₱500 memo of the approved week is not taken again (₱0), statutory only for the 3 new days (= the 3-day bridging week, 3/days-in-month of ₱1,210.50), not 7 (v20.97)',
  run:async()=>{
    const t=new Date(today+'T12:00:00');t.setDate(t.getDate()-14);while(t.getDay()!==3)t.setDate(t.getDate()-1);
    const W0=ymd(t),D=n=>{const x=new Date(W0+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x);};
    const done={};[+D(-6).slice(0,4),+D(3).slice(0,4)].forEach(y=>Object.keys(hnxPhHolidayRules(y)).forEach(k=>done[k]=1));
    localStorage.setItem('hydroPro_ph_holidays_seeded_v2',JSON.stringify(done));localStorage.setItem('hydroPro_ph_holidays','{}');
    const e=labour('L1','JO',{dailyRate:610});setE([e]);
    const a={};for(let i=-6;i<=3;i++){if(i!==-3)a[D(i)]={L1:rec('present','07:00','17:00')};}setA(a); /* D(-3) is the Sunday rest day */
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M1',category:'hr',type:'bad',empId:'L1',date:D(-1),status:'signed',totalAmount:500,reasonLabel:'damage'}]));
    localStorage.setItem('hydroPro_payroll_runs','[]');
    const A=calcEmployeePayroll(e,D(-6),D(0),'weekly');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_'+D(-6)+'_'+D(0),type:'weekly',periodStart:D(-6),periodEnd:D(0),status:'approved',lines:[A],totals:{netPay:A.netPay}}]));
    await sleep(20);
    const B=calcEmployeePayroll(e,D(-3),D(3),'weekly');     /* the week a close-day change used to lay over the paid one */
    const C=calcEmployeePayroll(e,D(1),D(3),'weekly');      /* the bridging week */
    const Aagain=calcEmployeePayroll(e,D(-6),D(0),'weekly'); /* the approved run itself is never "elsewhere" */
    const g=l=>Math.round((l.sss+l.phic+l.hdmf)*100)/100;
    let f=0;for(let i=1;i<=3;i++){const x=new Date(D(i)+'T12:00:00');f+=1/new Date(x.getFullYear(),x.getMonth()+1,0).getDate();}
    const exp3=1210.5*f; /* 675 SSS + 335.50 PhilHealth + 200 Pag-IBIG a month, per day of the week's own days */
    return {aMemo:A.memoDed,aDays:A.daysWorked,bDays:B.daysWorked,bBasic:B.basicPay,bMemo:B.memoDed,bElse:(B.paidElsewhere||[]).length,bAbs:B.daysAbsentUnauth,bGap:B.daysGap,
      bGovEqualsBridge:g(B)===g(C),cGovIs3Days:Math.abs(g(C)-exp3)<0.03,cUnder7:g(C)<g(A),cDays:C.daysWorked,cBasic:C.basicPay,
      againElse:(Aagain.paidElsewhere||[]).length,againMemo:Aagain.memoDed};},
  expect:{aMemo:500,aDays:6,bDays:3,bBasic:1830,bMemo:0,bElse:4,bAbs:0,bGap:0,bGovEqualsBridge:true,cGovIs3Days:true,cUnder7:true,cDays:3,cBasic:1830,againElse:0,againMemo:500} },

{ name:'Approve & Lock refuses a weekly run that pays days of an APPROVED week (stale draft over 4 paid days → stays draft, alert names the run); after Recalculate the same run locks paying 3 × ₱610 = ₱1,830 (v20.97)',
  run:async()=>{
    const t=new Date(today+'T12:00:00');t.setDate(t.getDate()-14);while(t.getDay()!==3)t.setDate(t.getDate()-1);
    const W0=ymd(t),D=n=>{const x=new Date(W0+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x);};
    const done={};[+D(-6).slice(0,4),+D(3).slice(0,4)].forEach(y=>Object.keys(hnxPhHolidayRules(y)).forEach(k=>done[k]=1));
    localStorage.setItem('hydroPro_ph_holidays_seeded_v2',JSON.stringify(done));localStorage.setItem('hydroPro_ph_holidays','{}');
    const e=labour('L1','JO',{dailyRate:610});setE([e]);if(typeof loadEmployees==='function')loadEmployees();
    const a={};for(let i=-6;i<=3;i++){if(i!==-3)a[D(i)]={L1:rec('present','07:00','17:00')};}setA(a); /* D(-3) is the Sunday rest day */
    localStorage.setItem('hydroPro_payroll_runs','[]');
    const stale=calcEmployeePayroll(e,D(-3),D(3),'weekly');   /* computed before the other week was approved */
    const A=calcEmployeePayroll(e,D(-6),D(0),'weekly');
    const bid='ops_'+D(-3)+'_'+D(3),aid='ops_'+D(-6)+'_'+D(0);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:aid,type:'weekly',periodStart:D(-6),periodEnd:D(0),status:'approved',lines:[A],totals:{netPay:A.netPay}},
      {id:bid,type:'weekly',periodStart:D(-3),periodEnd:D(3),status:'draft',lines:[stale],totals:{netPay:stale.netPay}}]));
    const alerts=[];const _al=window.alert;window.alert=m=>{alerts.push(String(m));};
    const approve=async()=>{window._payOpsCurrentPeriod={start:D(-3),end:D(3),payday:D(5),label:D(-3)+' — '+D(3)};
      payOpsApprove();await sleep(300);if(document.getElementById('hnxAnomOv')&&window.__hnxAnomGo){document.getElementById('hnxAnomOv').remove();window.__hnxAnomGo();}await sleep(300);};
    await approve();
    const st1=(getPayrollRun(bid)||{}).status,al1=alerts.join('|');
    window._payOpsCurrentPeriod={start:D(-3),end:D(3),payday:D(5),label:D(-3)+' — '+D(3)};
    renderPayrollOps();await sleep(300);
    await approve();
    window.alert=_al;
    const r=getPayrollRun(bid)||{},l=(r.lines||[]).filter(x=>x.empId==='L1')[0]||{};
    return {firstStatus:st1,blockedNamesRun:al1.indexOf('NOT APPROVED')>=0&&al1.indexOf(aid)>=0,finalStatus:r.status,days:l.daysWorked,basic:l.basicPay,paidElsewhere:(l.paidElsewhere||[]).length,approvedA:(getPayrollRun(aid)||{}).status};},
  expect:{firstStatus:'draft',blockedNamesRun:true,finalStatus:'approved',days:3,basic:1830,paidElsewhere:4,approvedA:'approved'} },

{ name:'labour → office move: the office cut-off pays only the 5 weekdays no approved weekly run paid (5 × ₱600 = ₱3,000, not ₱6,000), the ₱300 memo once (₱0 here), statutory 5/12 of the ₱590 half-month share (₱135.42 + ₱68.75 + ₱41.67); the approve check names the move and the paid days (v20.97)',
  run:async()=>{
    const t=new Date(today+'T12:00:00');t.setDate(t.getDate()-21);while(t.getDay()!==1)t.setDate(t.getDate()-1);
    const S=ymd(t),D=n=>{const x=new Date(S+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x);};
    const done={};[+D(-7).slice(0,4),+D(18).slice(0,4)].forEach(y=>Object.keys(hnxPhHolidayRules(y)).forEach(k=>done[k]=1));
    localStorage.setItem('hydroPro_ph_holidays_seeded_v2',JSON.stringify(done));localStorage.setItem('hydroPro_ph_holidays','{}');
    const juan=labour('JUAN','JUAN',{dailyRate:600});setE([juan]);
    const a={};for(let i=0;i<=5;i++)a[D(i)]={JUAN:rec('present','07:00','17:00')};setA(a);
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M2',category:'hr',type:'good',empId:'JUAN',date:D(2),status:'signed',totalAmount:300,reasonLabel:'bonus'}]));
    localStorage.setItem('hydroPro_payroll_runs','[]');
    const wl=calcEmployeePayroll(juan,D(0),D(6),'weekly');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_'+D(0)+'_'+D(6),type:'weekly',periodStart:D(0),periodEnd:D(6),status:'approved',lines:[wl],totals:{netPay:wl.netPay}}]));
    /* HR moves him to an office group */
    const moved=Object.assign({},juan,{salaryCategory:'logistic',dept:'APAC_LOGISTIC'});setE([moved]);if(typeof loadEmployees==='function')loadEmployees();
    await sleep(20);
    const o=calcEmployeePayroll(moved,D(0),D(11),'semi_monthly');
    /* the approve check */
    const per={start:D(0),end:D(11),label:D(0)+' — '+D(11)};window._payOfficeCurrentPeriod=per;
    const rid=payOfficeRunId(per);
    const runs=JSON.parse(localStorage.getItem('hydroPro_payroll_runs'));runs.push({id:rid,type:'semi_monthly',periodStart:D(0),periodEnd:D(11),status:'draft',lines:[o],totals:{netPay:o.netPay}});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify(runs));
    payOfficeApprove();await sleep(300);
    const ov=document.getElementById('hnxAnomOv');const txt=ov?ov.innerText:'';if(ov)ov.remove();
    return {wDays:wl.daysWorked,wMemo:wl.memoAdd,days:o.daysWorked,basic:o.basicPay,memo:o.memoAdd,paidElsewhere:(o.paidElsewhere||[]).length,sss:o.sss,phic:o.phic,hdmf:o.hdmf,gap:o.daysGap,
      saysMoved:/🔀 JUAN: MOVED from the weekly labour payroll/.test(txt),saysPaid:/🔁 JUAN: 7 day\(s\)/.test(txt),status:(getPayrollRun(rid)||{}).status};},
  expect:{wDays:6,wMemo:300,days:5,basic:3000,memo:0,paidElsewhere:7,sss:135.42,phic:68.75,hdmf:41.67,gap:0,saysMoved:true,saysPaid:true,status:'draft'} },

{ name:'a ZERO line settles nothing: an office person wrongly left on an approved weekly run (absent all week, ₱0) is still paid those weekdays by the office cut-off (10 × ₱600 = ₱6,000, paidElsewhere 0) (v20.97)',
  run:async()=>{
    const t=new Date(today+'T12:00:00');t.setDate(t.getDate()-21);while(t.getDay()!==1)t.setDate(t.getDate()-1);
    const S=ymd(t),D=n=>{const x=new Date(S+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x);};
    const done={};[+D(-7).slice(0,4),+D(18).slice(0,4)].forEach(y=>Object.keys(hnxPhHolidayRules(y)).forEach(k=>done[k]=1));
    localStorage.setItem('hydroPro_ph_holidays_seeded_v2',JSON.stringify(done));localStorage.setItem('hydroPro_ph_holidays','{}');
    const ana=labour('ANA','ANA',{dailyRate:600});setE([ana]);setA({});localStorage.setItem('hydroPro_payroll_runs','[]');
    const wl=calcEmployeePayroll(ana,D(0),D(6),'weekly');   /* no scans: absent all week, pays nothing */
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_'+D(0)+'_'+D(6),type:'weekly',periodStart:D(0),periodEnd:D(6),status:'approved',lines:[wl],totals:{netPay:wl.netPay}}]));
    const moved=Object.assign({},ana,{salaryCategory:'accounting',dept:'APTI_ACCOUNTING'});setE([moved]);
    await sleep(20);
    const o=calcEmployeePayroll(moved,D(0),D(11),'semi_monthly');
    return {wDays:wl.daysWorked,wBasic:wl.basicPay,days:o.daysWorked,basic:o.basicPay,paidElsewhere:(o.paidElsewhere||[]).length};},
  expect:{wDays:0,wBasic:0,days:10,basic:6000,paidElsewhere:0} },

{ name:'office cut-off 11–25/26–10 → 1–15/16–end from Oct 2026: the 20-day switch-over cut-off 26 Sep–15 Oct pays 16,000 × 12 ÷ 365 × 20 = ₱10,520.55 (₱751.4677 × 14 days), not a flat ₱8,000; 11–25 Sep and 16–31 Oct stay ₱8,000 (÷11); the reverse change makes a 10-day 1–10 Oct cut-off paying ₱5,260.27, not ₱8,000 (v20.97)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays','{}');
    localStorage.setItem('hydroPro_payroll_cutoff_v1',JSON.stringify({office:{d1:15,d2:'end'},labor:{closeDow:3,paydayOffset:2},effectiveFrom:'2026-10-01',
      history:[{office:{d1:10,d2:25},labor:{closeDow:3,paydayOffset:2},until:'2026-10-01'}]}));},
  run:async()=>{
    const emp={id:'O1',name:'OFFICE',monthlyBasic:16000};const H={};
    const R=(s,e)=>{const r=HNXPeriod.rateFor(emp,s,e,{holidays:H});return {rate:r.rate,div:r.divisor,total:Math.round(r.rate*r.divisor*100)/100};};
    const p=getSemiMonthPeriod('2026-09-28');
    const fwd={period:p.start+'_'+p.end,sw:R(p.start,p.end),sep:R('2026-09-11','2026-09-25'),oct:R('2026-10-16','2026-10-31')};
    localStorage.setItem('hydroPro_payroll_cutoff_v1',JSON.stringify({office:{d1:10,d2:25},labor:{closeDow:3,paydayOffset:2},effectiveFrom:'2026-10-01',
      history:[{office:{d1:15,d2:'end'},labor:{closeDow:3,paydayOffset:2},until:'2026-10-01'}]}));
    const q=getSemiMonthPeriod('2026-10-05');
    return Object.assign(fwd,{revPeriod:q.start+'_'+q.end,rev:R(q.start,q.end),revSep:R('2026-09-16','2026-09-30').total});},
  expect:{period:'2026-09-26_2026-10-15','sw.rate':751.4677,'sw.div':14,'sw.total':10520.55,'sep.total':8000,'oct.total':8000,
    revPeriod:'2026-10-01_2026-10-10','rev.total':5260.27,revSep:8000} },

{ name:'office switch-over cut-off in the engine: basic and a ₱2,000/month allowance both follow monthly × 12 ÷ 365 × the cut-off\'s days (a 21-day 26 Jul–15 Aug cut-off on ₱16,000 = ₱11,046.58 basic, ₱1,380.82 allowance), an ordinary cut-off after it = ₱8,000 + ₱1,000 (v20.97)',
  run:async()=>{
    /* old 10/25 until the 1st of LAST month, 1-15/16-end from then: the switch-over is fully in the past */
    const t=new Date(today+'T12:00:00');const eff=new Date(t.getFullYear(),t.getMonth()-1,1,12);const effY=ymd(eff);
    localStorage.setItem('hydroPro_payroll_cutoff_v1',JSON.stringify({office:{d1:15,d2:'end'},labor:{closeDow:3,paydayOffset:2},effectiveFrom:effY,
      history:[{office:{d1:10,d2:25},labor:{closeDow:3,paydayOffset:2},until:effY}]}));
    const pm=new Date(eff.getFullYear(),eff.getMonth()-1,26,12);const s=ymd(pm),e=ymd(new Date(eff.getFullYear(),eff.getMonth(),15,12));
    const e2s=ymd(new Date(eff.getFullYear(),eff.getMonth(),16,12)),e2e=ymd(new Date(eff.getFullYear(),eff.getMonth()+1,0,12));
    const done={};[eff.getFullYear()-1,eff.getFullYear()].forEach(y=>Object.keys(hnxPhHolidayRules(y)).forEach(k=>done[k]=1));
    localStorage.setItem('hydroPro_ph_holidays_seeded_v2',JSON.stringify(done));localStorage.setItem('hydroPro_ph_holidays','{}');
    const m=office('O1','OFFICE',{monthlyBasic:16000,allowances:[{type:'transport',monthly:2000,taxable:false}]});setE([m]);setA({});
    localStorage.setItem('hydroPro_payroll_runs','[]');
    const days=Math.round((new Date(e+'T12:00:00')-new Date(s+'T12:00:00'))/864e5)+1;
    const l=calcEmployeePayroll(m,s,e,'semi_monthly'),n=calcEmployeePayroll(m,e2s,e2e,'semi_monthly');
    const r2=v=>Math.round(v*100)/100;
    return {period:getSemiMonthPeriod(e).start+'_'+getSemiMonthPeriod(e).end===s+'_'+e,
      basicOk:r2(l.basicPay)===r2(16000*12/365*days),allowOk:r2(l.recurringAllowance)===r2(2000*12/365*days),
      nBasic:r2(n.basicPay),nAllow:r2(n.recurringAllowance),gap:l.daysGap};},
  expect:{period:true,basicOk:true,allowOk:true,nBasic:8000,nAllow:1000,gap:0} },

{ name:'Align / department change: moving a person between the weekly and office payrolls (or Trainee → Regular) needs payroll permission and a yes that names the move and the ≈₱1,180/month statutory it switches on (v20.97)',
  run:async()=>{
    const e={id:'T9',name:'TRAINEE NINE',status:'Active',dept:'APAC_ADMIN',salaryCategory:'production_regular',type:'Trainee',employmentType:'Trainee',dailyRate:600,dateHired:'2025-01-01'};
    setE([e]);if(typeof loadEmployees==='function')loadEmployees();
    const get=()=>(JSON.parse(localStorage.getItem('hydroPro_employees'))||[]).filter(x=>x.id==='T9')[0]||{};
    const _c=window.confirm,_can=window.can;const asked=[];
    window.can=()=>false;hnxPayAlignOne('T9');const noPerm=get().salaryCategory;window.can=_can;
    window.confirm=m=>{asked.push(String(m));return false;};hnxPayAlignOne('T9');const declined=get().salaryCategory;
    window.confirm=m=>{asked.push(String(m));return true;};hnxPayAlignOne('T9');const after=get();
    window.confirm=_c;
    const q=asked[0]||'';
    return {noPerm,declined,cat:after.salaryCategory,type:after.type,namesMove:/MOVES them from the WEEKLY labour payroll to the OFFICE \(semi-monthly\) payroll/.test(q),namesStat:/SSS \/ PhilHealth \/ Pag-IBIG \(about ₱1,180\.00 a month/.test(q)};},
  expect:{noPerm:'production_regular',declined:'production_regular',cat:'admin',type:'Regular',namesMove:true,namesStat:true} },
];
