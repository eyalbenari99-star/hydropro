/* Locked (approved, paid) payroll runs: money dated inside a run that is already approved, attendance that
   changes after the lock, and what Reopen / Recalculate do to the paid figures. Payroll audit batch D. */
module.exports=[
{ name:'one-time ₱850 fare dated Tue 8 Sep, entered after the 3–9 Sep week was approved, is carried into 10–16 Sep: ₱850 paid there, ₱0 in 3–9, and Cancel saves nothing (audit D allowances-05)',
  run:async()=>{
    const e=labour('L1','JO SANTOS');setE([e]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',lines:[{empId:'L1',name:'JO SANTOS',dailyRate:658,daysWorked:6,netPay:3948}],totals:{}}]));
    localStorage.setItem('hydroPro_onetime_allow_v1','[]');
    const add=(amt)=>{hnxAllowMan('L1');document.getElementById('hnxAM_olabel').value='fare';document.getElementById('hnxAM_odate').value='2026-09-08';document.getElementById('hnxAM_oamt').value=String(amt);hnxAllowOneAdd('L1');};
    window.confirm=()=>true;add(850);
    const ots=JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1'));
    window.confirm=()=>false;add(999);
    const after=JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1'));
    const nxt=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly'),own=calcEmployeePayroll(e,'2026-09-03','2026-09-09','weekly');
    const m=document.getElementById('hnxAllowMan');if(m)m.remove();
    return {date:ots[0].date,payDate:ots[0].payDate,from:ots[0].carriedFrom,next:(nxt.onetimeList||[]).map(x=>x.amount),own:(own.onetimeList||[]).map(x=>x.amount),count:after.length};},
  expect:{date:'2026-09-08',payDate:'2026-09-10',from:'ops_2026-09-03_2026-09-09',next:[850],own:[],count:1} },

{ name:'contractor ₱500 step bonus dated 8 Sep, added after the 3–9 Sep week was approved, lands in 10–16 Sep (bonus ₱500 on the line) and not in 3–9 (₱0) (audit D rates-master-other-08 / deductions-loans-11)',
  run:async()=>{
    const e=labour('C1','ERIC CONTRA',{employmentType:'Contractor',contractorProject:'15'});setE([e]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',lines:[{empId:'C1',name:'ERIC CONTRA',dailyRate:658,daysWorked:6,netPay:3948}],totals:{}}]));
    localStorage.setItem('hydroPro_contr_adjust_v1','[]');
    const mk=(id,v)=>{let x=document.getElementById(id);if(!x){x=document.createElement(id==='hnxCaKind'?'select':'input');x.id=id;document.body.appendChild(x);
      if(id==='hnxCaKind')['bonus','penalty'].forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;x.appendChild(o);});}x.value=v;};
    mk('hnxCaDate','2026-09-08');mk('hnxCaKind','bonus');mk('hnxCaAmt','500');mk('hnxCaWhy','step 3 done');
    window.confirm=()=>true;hnxContrAdjAdd('C1');
    const st=JSON.parse(localStorage.getItem('hydroPro_contr_adjust_v1'));
    const nx=hnxContrAdjFor('C1','2026-09-10','2026-09-16'),own=hnxContrAdjFor('C1','2026-09-03','2026-09-09');
    const line=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    ['hnxCaDate','hnxCaKind','hnxCaAmt','hnxCaWhy'].forEach(id=>{const x=document.getElementById(id);if(x)x.remove();});
    return {date:st[0].date,payDate:st[0].payDate,next:nx.b,own:own.b,lineBonus:line.contrBonus};},
  expect:{date:'2026-09-08',payDate:'2026-09-10',next:500,own:0,lineBonus:500} },

{ name:'delivery day Tue 8 Sep (driver ₱400 / helper ₱150) final-approved after the 3–9 Sep week was approved is carried into 10–16 Sep: paid ₱400 / ₱150 there and ₱0 in 3–9; the lock counts it as 1 day still waiting (audit D rates-master-other-08)',
  seed:()=>{const A=[{id:'alabang',name:'ALABANG AREA',d1:0,h1:0,d2:100,h2:50,dbl:false},{id:'manila',name:'MANILA',d1:0,h1:0,d2:200,h2:75,dbl:false}];
    localStorage.setItem('hydroPro_trip_rates_v1',JSON.stringify({draft:{areas:A},live:{areas:A},draftDirty:false,airportSeeded:true,specialSeeded:true}));},
  run:async()=>{
    const d=labour('D1','DRIVER ONE',{salaryCategory:'drivers',employmentType:'Probationary'}),h=labour('H1','HELPER ONE',{salaryCategory:'helpers',employmentType:'Probationary'});setE([d,h]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',lines:[{empId:'D1',name:'DRIVER ONE',dailyRate:658,daysWorked:6},{empId:'H1',name:'HELPER ONE',dailyRate:658,daysWorked:6}],totals:{}}]));
    const LK='hydroPro_trip_log_v1';
    localStorage.setItem(LK,JSON.stringify([{id:'t8',date:'2026-09-08',driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','manila','manila'],status:'checked',createdAt:1}]));
    const waiting=window.hnxPendingTripDays(JSON.parse(localStorage.getItem('hydroPro_payroll_runs'))[0]);
    window.confirm=()=>true;window.alert=()=>{};
    try{hnxTripLogApprove('t8');}catch(e){}
    await sleep(300);
    const tl=JSON.parse(localStorage.getItem(LK))[0];
    const dn=calcEmployeePayroll(d,'2026-09-10','2026-09-16','weekly'),hn=calcEmployeePayroll(h,'2026-09-10','2026-09-16','weekly'),dow=calcEmployeePayroll(d,'2026-09-03','2026-09-09','weekly');
    return {waiting,status:tl.status,payDate:tl.payDate,priced:[tl.pricedD,tl.pricedH],next:[dn.tripIncentive,hn.tripIncentive],own:dow.tripIncentive};},
  expect:{waiting:1,status:'approved',payDate:'2026-09-10',priced:[400,150],next:[400,150],own:0} },

{ name:'HR memo −₱1,500 dated 20 Sep, final-approved after the 11–25 Sep office cut-off was approved, is deducted once in 26 Sep–10 Oct (₱1,500) and ₱0 in 11–25 Sep (audit D deductions-loans-11)',
  run:async()=>{
    const o=office('O1','ANN OFFICE',{monthlyBasic:16000});setE([o]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-09-11_2026-09-25',type:'semi_monthly',periodStart:'2026-09-11',periodEnd:'2026-09-25',status:'approved',approvedAt:Date.now()-5000,approvedBy:'eyal',lines:[{empId:'O1',name:'ANN OFFICE',dailyRate:727.27,daysWorked:11,netPay:8000}],totals:{}}]));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M1',category:'hr',type:'bad',empId:'O1',date:'2026-09-20',status:'pending',totalAmount:1500,title:'Damage charge',signatures:{}}]));
    window.confirm=()=>true;hnxMemoApproveDo('M1','final');await sleep(200);
    const m=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    const nx=calcEmployeePayroll(o,'2026-09-26','2026-10-10','semi_monthly'),own=calcEmployeePayroll(o,'2026-09-11','2026-09-25','semi_monthly');
    return {status:m.status,payDate:m.payDate,from:m.carriedFrom,next:nx.memoDed,own:own.memoDed};},
  expect:{status:'signed',payDate:'2026-09-26',from:'office_2026-09-11_2026-09-25',next:1500,own:0} },

{ name:'production memo ₱100 a worker dated 8 Sep, fully signed after the 3–9 Sep week was approved, is taken in 10–16 Sep from the 2 workers present on 8 Sep (₱100 each), not from the absent one, and ₱0 in 3–9 (audit D runs-snapshots-postlock-memo-dropped)',
  run:async()=>{
    const w=id=>labour(id,'WORKER '+id,{ghAssigned:['GH15']});const E=[w('W1'),w('W2'),w('W3')];setE(E);
    setA({'2026-09-08':{W1:rec('present','07:00','17:00'),W2:rec('present','07:00','17:00')}});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',lines:E.map(e=>({empId:e.id,name:e.name,dailyRate:658,daysWorked:6})),totals:{}}]));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'P1',category:'production',type:'bad',gh:'GH15',date:'2026-09-08',status:'pending',totalAmount:200,title:'Spoiled batch',signatures:{supervisor:{name:'Sup',username:'sup',signedAt:'2026-09-14T08:00:00Z'}}}]));
    loadMemos();window._viewingMemoId='P1';window.confirm=()=>true;
    try{memoSign('hrManager');}catch(e){}
    await sleep(200);
    const m=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    const n=E.map(e=>calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly').memoDed);
    const own=calcEmployeePayroll(E[0],'2026-09-03','2026-09-09','weekly').memoDed;
    return {status:m.status,payDate:m.payDate,next:n,own};},
  expect:{status:'signed',payDate:'2026-09-10',next:[100,100,0],own:0} },

{ name:'office Sunday inside a LOCKED cut-off: a ✓ is refused (0 saved), "Approve all scanned" skips it (0 approved), the chip reads 🔒 IN LOCKED RUN instead of WILL BE PAID and the banner offers no Approve-all (audit D ot-holiday-03)',
  run:async()=>{
    const base=new Date(today+'T00:00:00');base.setDate(base.getDate()-24);
    const p=getSemiMonthPeriod(ymd(base));
    let sun=null;for(const d=new Date(p.start+'T00:00:00');ymd(d)<=p.end;d.setDate(d.getDate()+1)){if(d.getDay()===0){sun=ymd(d);break;}}
    const o=office('O1','ANN OFFICE',{monthlyBasic:16000});setE([o]);
    const a={};a[sun]={O1:rec('present','08:00','17:00')};setA(a);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:payOfficeRunId(p),type:'semi_monthly',periodStart:p.start,periodEnd:p.end,status:'approved',approvedAt:Date.now()-5000,approvedBy:'eyal',lines:[{empId:'O1',name:'ANN OFFICE',daysWorked:11,netPay:8000}],totals:{}}]));
    localStorage.setItem('hydroPro_weekend_approvals_v1','{}');
    window.alert=()=>{};window.confirm=()=>true;
    const key='O1|'+sun;
    hnxWkSet(key,'final','ok');hnxWkSave();
    hnxWkBulk('okScan');hnxWkSave();
    hnxWkApproveAll(p.start,p.end);
    const st=JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}');
    let host=document.getElementById('hrWeekendBody');if(!host){host=document.createElement('div');host.id='hrWeekendBody';document.body.appendChild(host);}
    window._hnxWkRender();
    const txt=host.textContent||'';
    const ban=hnxWkPendBanner(p.start,p.end);
    host.remove();
    return {sun:!!sun,saved:Object.keys(st).length,lockedChip:/IN LOCKED RUN/.test(txt),willBePaid:/WILL BE PAID/.test(txt),bannerLocked:/🔒/.test(ban),bannerButton:/hnxWkApproveAll/.test(ban)};},
  expect:{sun:true,saved:0,lockedChip:true,willBePaid:false,bannerLocked:true,bannerButton:false} },

{ name:'reopened week: A was paid 6 × ₱600 = ₱3,600 and his card now says ₱650 — re-approval lists ₱3,600.00 → ₱3,900.00 (+₱300.00) with the rate change; Cancel keeps it a draft, OK locks it and records the +₱300 difference (audit D runs-snapshots-reopen-reprices-all / allowances-04)',
  run:async()=>{
    const A=labour('A','A WORKER',{employmentType:'Probationary',rateOverride:650,dailyRate:650});setE([A]);if(typeof loadEmployees==='function')loadEmployees();
    const a={};['2026-09-03','2026-09-04','2026-09-05','2026-09-07','2026-09-08','2026-09-09'].forEach(d=>{a[d]={A:rec('present','07:00','17:00')};});setA(a);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',
      lines:[{empId:'A',name:'A WORKER',dailyRate:600,daysWorked:6,basicPay:3600,grossPay:3600,grossEarnings:3600,netPay:3600,recurringAllowance:0}],totals:{netPay:3600}}]));
    window._payOpsCurrentPeriod={start:'2026-09-03',end:'2026-09-09',payday:'2026-09-11',label:'3–9 Sep'};
    let reopenMsg='';window.confirm=m=>{reopenMsg=String(m);return true;};window.alert=()=>{};
    window.hnxPayReopen('ops');await sleep(800);
    const RID='ops_2026-09-03_2026-09-09',get=()=>JSON.parse(localStorage.getItem('hydroPro_payroll_runs')).find(x=>x.id===RID);
    const r0=get();const snap=(r0.approvalHistory[r0.approvalHistory.length-1]||{}).paidLines||[];
    renderPayrollOps();await sleep(800);
    const asked=[];window.confirm=m=>{asked.push(String(m));return !/was paid → now/.test(String(m));};
    const approve=async()=>{payOpsApprove();await sleep(400);const ov=document.getElementById('hnxAnomOv');if(ov&&window.__hnxAnomGo){ov.remove();window.__hnxAnomGo();}await sleep(600);};
    await approve();
    const r1=get();const diffMsg=asked.find(m=>/was paid → now/.test(m))||'';
    window.confirm=()=>true;await approve();
    const r2=get();
    return {reopenSaysRates:/re-priced from TODAY/.test(reopenMsg),snapNet:snap[0]&&snap[0].netPay,newNet:r1.lines[0]&&r1.lines[0].netPay,
      line:/A WORKER: ₱3,600\.00 → ₱3,900\.00 \(\+₱300\.00\)/.test(diffMsg),rate:/rate ₱600\.00 → ₱650\.00/.test(diffMsg),afterCancel:r1.status,afterOk:r2.status,total:r2.reapproveDiff&&r2.reapproveDiff.total};},
  expect:{reopenSaysRates:true,snapNet:3600,newNet:3900,line:true,rate:true,afterCancel:'draft',afterOk:'approved',total:300} },

{ name:'↻ RECALCULATE on a paid week says it goes back to DRAFT (not "Status stays approved"), keeps B — paid ₱3,948 though his card has moved to office since — on the run, and 🔄 Recalculate keeps the paid ₱3,948 on record (audit D rates-master-other-02)',
  run:async()=>{
    const B=labour('B','B MOVED',{salaryCategory:'accounting',dept:'Accounting',employmentType:'Probationary'}),K=labour('K','K STAYS',{employmentType:'Probationary'});setE([B,K]);if(typeof loadEmployees==='function')loadEmployees();
    const a={};['2026-09-03','2026-09-04','2026-09-05','2026-09-07','2026-09-08','2026-09-09'].forEach(d=>{a[d]={B:rec('present','07:00','17:00'),K:rec('present','07:00','17:00')};});setA(a);
    const L=(id,n)=>({empId:id,name:n,dailyRate:658,daysWorked:6,basicPay:3948,grossPay:3948,grossEarnings:3948,netPay:3948});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',lines:[L('B','B MOVED'),L('K','K STAYS')],totals:{netPay:7896}}]));
    window._payOpsCurrentPeriod={start:'2026-09-03',end:'2026-09-09',payday:'2026-09-11',label:'3–9 Sep'};
    const RID='ops_2026-09-03_2026-09-09',get=()=>JSON.parse(localStorage.getItem('hydroPro_payroll_runs')).find(x=>x.id===RID);
    const asked=[];window.confirm=m=>{asked.push(String(m));return true;};window.alert=()=>{};
    window.hnxPayRecalc('ops');await sleep(800);
    renderPayrollOps();await sleep(800);
    const r1=get();
    payOpsRecalc();await sleep(800);
    const r2=get();const last=(r2.approvalHistory||[]).slice(-1)[0]||{};
    return {msgDraft:asked.some(m=>/goes back to DRAFT/.test(m)),msgStays:asked.some(m=>/Status stays/.test(m)),bIn:(r1.lines||[]).some(l=>l.empId==='B'),
      bInAfter:(r2.lines||[]).some(l=>l.empId==='B'),paidB:((last.paidLines||[]).find(p=>p.empId==='B')||{}).netPay,status:r2.status};},
  expect:{msgDraft:true,msgStays:false,bIn:true,bInAfter:true,paidB:3948,status:'draft'} },

{ name:'referral ₱1,500 paid in 3–9 Sep, run reopened while 10–16 Sep is open: 3–9 still carries ₱1,500, 10–16 carries ₱0 and cannot mark it paid — paid once; re-approving 3–9 marks it there (audit D rates-master-other-14; the HR bonus loader is wired in here because this build never exposes it to payroll)',
  seed:()=>{localStorage.setItem('hydroPro_hr_payroll_bonuses',JSON.stringify([{id:'B1',employeeId:'R1',type:'referral',amount:1500,paidInPayroll:true,payrollRunId:'ops_2026-09-03_2026-09-09',addedAt:Date.parse('2026-09-05T10:00:00')}]));},
  run:async()=>{
    /* _loadPayrollBonuses lives inside a nested scope, so payroll's typeof check never sees it and no referral
       reaches any run today. Wire the same store in, so the reopen / approve rules are exercised as written. */
    if(typeof window._loadPayrollBonuses!=='function'){window._loadPayrollBonuses=()=>{try{return JSON.parse(localStorage.getItem('hydroPro_hr_payroll_bonuses')||'[]');}catch(e){return [];}};
      window._savePayrollBonuses=a=>localStorage.setItem('hydroPro_hr_payroll_bonuses',JSON.stringify(a||[]));}
    const R=labour('R1','REF ONE',{employmentType:'Probationary'});setE([R]);if(typeof loadEmployees==='function')loadEmployees();
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',
      lines:[{empId:'R1',name:'REF ONE',dailyRate:658,daysWorked:6,referralBonus:1500,referralList:[{id:'B1',amt:1500}],netPay:5448}],totals:{}}]));
    window._payOpsCurrentPeriod={start:'2026-09-03',end:'2026-09-09',payday:'2026-09-11',label:'3–9 Sep'};window.confirm=()=>true;window.alert=()=>{};
    window.hnxPayReopen('ops');await sleep(600);
    const B=()=>JSON.parse(localStorage.getItem('hydroPro_hr_payroll_bonuses'))[0];
    const b0=B();
    const next=calcEmployeePayroll(R,'2026-09-10','2026-09-16','weekly').referralBonus,own=calcEmployeePayroll(R,'2026-09-03','2026-09-09','weekly').referralBonus;
    /* a 10–16 draft computed BEFORE the reopen still carries the bonus: approval strips it and does not mark it */
    const stale={id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',totals:{},
      lines:[{empId:'R1',employmentType:'Probationary',referralList:[{id:'B1',amt:1500}],referralBonus:1500,grossPay:1500,grossEarnings:1500,totalGovDed:0,withholdingTax:0,netPay:1500}]};
    const stripped=_reverifyReferralBonusesForRun(stale);
    _markReferralBonusesPaidInPayroll({id:'ops_2026-09-10_2026-09-16',lines:[{empId:'R1',referralList:[{id:'B1',amt:1500}]}]});
    const b1=B();
    _markReferralBonusesPaidInPayroll({id:'ops_2026-09-03_2026-09-09',lines:[{empId:'R1',referralList:[{id:'B1',amt:1500}]}]});
    const b2=B();
    return {held:b0.heldForRun,paid0:b0.paidInPayroll,next,own,stripped,staleBonus:stale.lines[0].referralBonus,otherMarked:b1.paidInPayroll,finalRun:b2.payrollRunId,finalPaid:b2.paidInPayroll,holdLeft:b2.heldForRun||null};},
  expect:{held:'ops_2026-09-03_2026-09-09',paid0:false,next:0,own:1500,stripped:true,staleBonus:0,otherMarked:false,finalRun:'ops_2026-09-03_2026-09-09',finalPaid:true,holdLeft:null} },

{ name:'labourer paid 5 days (₱3,290) in the approved 10–16 Sep run; the Wed 16 Sep scan arrives after the lock → +1 day × ₱658 = ₱658 listed and carried ONCE into 17–23 Sep; a manual absent after the lock is listed as overpaid ₱658 and never auto-deducted (audit D attendance-to-pay-corrections-inside-paid-run-never-paid)',
  run:async()=>{
    const e=labour('L1','JO SANTOS',{employmentType:'Probationary'});setE([e]);if(typeof loadEmployees==='function')loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15'].forEach(d=>{a[d]={L1:rec('present','07:00','17:00')};});setA(a);
    localStorage.setItem('hydroPro_payroll_runs','[]');localStorage.setItem('hydroPro_onetime_allow_v1','[]');
    window._payOpsCurrentPeriod={start:'2026-09-10',end:'2026-09-16',payday:'2026-09-18',label:'10–16 Sep'};
    renderPayrollOps();await sleep(800);
    window.confirm=()=>true;window.alert=()=>{};
    payOpsApprove();await sleep(400);const ov=document.getElementById('hnxAnomOv');if(ov&&window.__hnxAnomGo){ov.remove();window.__hnxAnomGo();}await sleep(600);
    const RID='ops_2026-09-10_2026-09-16',run=()=>JSON.parse(localStorage.getItem('hydroPro_payroll_runs')).find(x=>x.id===RID);
    const r0=run();
    /* a manual absent entered after the lock: listed as overpaid, never carried */
    const a2=JSON.parse(JSON.stringify(a));a2['2026-09-14'].L1=rec('absent','','','manual',{editedBy:'jinky'});setA(a2);
    const over=hnxLockedDrift(run(),true);const overCarry=hnxLockedDriftCarry(RID);
    /* the late clock report for Wed 16 Sep */
    const a3=JSON.parse(JSON.stringify(a));a3['2026-09-16']={L1:rec('present','07:00','17:00')};setA(a3);
    const d1=hnxLockedDrift(run(),true);
    window._payOpsCurrentPeriod={start:'2026-09-17',end:'2026-09-23',payday:'2026-09-25',label:'17–23 Sep'};renderPayrollOps();await sleep(800);
    const banner=/Attendance changed after an earlier run was approved/.test(document.getElementById('payrollOpsBody').textContent||'');
    const n=hnxLockedDriftCarry(RID);
    const ots=JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1'));
    const nx=calcEmployeePayroll(e,'2026-09-17','2026-09-23','weekly');
    const d2=hnxLockedDrift(run(),true);const again=hnxLockedDriftCarry(RID);
    return {paidDays:r0.lines[0].daysWorked,paidNet:r0.lines[0].netPay,sig:!!r0.attSig,over:over.over,overUnpaid:over.unpaid,overCarry,drift:[d1.rows[0]&&d1.rows[0].dDays,d1.unpaid],banner,carried:n,
      item:[ots[0]&&ots[0].date,ots[0]&&ots[0].amount,ots[0]&&ots[0].carriedFrom],next:(nx.onetimeList||[]).map(x=>x.amount),left:d2.unpaid,again,frozen:run().lines[0].netPay};},
  expect:{paidDays:5,paidNet:3290,sig:true,over:658,overUnpaid:0,overCarry:0,drift:[1,658],banner:true,carried:1,item:['2026-09-17',658,'ops_2026-09-10_2026-09-16'],next:[658],left:0,again:0,frozen:3290} },

{ name:'allowance ₱2,000/month added to the card AFTER the run was approved: the approved run shows no "press Recalculate" banner; one already on the card at the lock is named with a one-time-payment hint; a draft still says Recalculate (audit D allowances-04)',
  run:async()=>{
    const T=Date.now()-3600000;
    /* two people, because the employee store keeps the newer updatedAt of a record on a rewrite */
    const al={allowances:[{type:'transportation',monthly:2000,taxable:false}]};
    setE([labour('J','JOMEL',Object.assign({updatedAt:Date.now()},al)),labour('R','REVEN',Object.assign({updatedAt:T-3600000},al))]);
    const Lj=[{empId:'J',name:'JOMEL',recurringAllowance:0,daysWorked:6}],Lr=[{empId:'R',name:'REVEN',recurringAllowance:0,daysWorked:6}];
    const after=hnxAllowStaleBanner(Lj,{status:'approved',approvedAt:T});
    const before=hnxAllowStaleBanner(Lr,{status:'approved',approvedAt:T});
    const draft=hnxAllowStaleBanner(Lj,{status:'draft'});
    return {after,beforeNamed:/REVEN/.test(before)&&/one-time payment/.test(before)&&!/Press <b>🔄 Recalculate/.test(before),draft:/Recalculate/.test(draft)};},
  expect:{after:'',beforeNamed:true,draft:true} },
{ name:'memo −₱1,500 the locked 11–25 Sep run already deducted (it is in its memo list): Apply to payroll after the lock does NOT carry it — ₱0 in 26 Sep–10 Oct, never taken twice (audit D deductions-loans-11)',
  run:async()=>{
    const o=office('O1','ANN OFFICE',{monthlyBasic:16000});setE([o]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-09-11_2026-09-25',type:'semi_monthly',periodStart:'2026-09-11',periodEnd:'2026-09-25',status:'approved',approvedAt:Date.now()-5000,approvedBy:'eyal',
      lines:[{empId:'O1',name:'ANN OFFICE',dailyRate:727.27,daysWorked:11,memoDed:1500,memoList:[{id:'M2',kind:'bad',amt:1500}],netPay:6500}],totals:{}}]));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M2',category:'hr',type:'bad',empId:'O1',date:'2026-09-20',status:'signed',totalAmount:1500,impact:[{empId:'O1'}],title:'Damage charge',signatures:{}}]));
    loadMemos();const asked=[];window.confirm=m=>{asked.push(String(m));return true;};
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));
    try{memoApply('M2');}catch(e){}
    await sleep(200);
    const m=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    const nx=calcEmployeePayroll(o,'2026-09-26','2026-10-10','semi_monthly');
    return {status:m.status,payDate:m.payDate||null,carryAsked:asked.some(x=>/carry it into the next OPEN cut-off/.test(x)),next:nx.memoDed};},
  expect:{status:'applied',payDate:null,carryAsked:false,next:0} },

{ name:'delivery day the locked 3–9 Sep week already paid (driver ₱200) and sent back when a trip was added: re-approval keeps it in its locked week — ₱0 in 10–16 Sep, the first trips are never paid twice (audit D rates-master-other-08)',
  seed:()=>{const A=[{id:'alabang',name:'ALABANG AREA',d1:0,h1:0,d2:100,h2:50,dbl:false},{id:'manila',name:'MANILA',d1:0,h1:0,d2:200,h2:75,dbl:false}];
    localStorage.setItem('hydroPro_trip_rates_v1',JSON.stringify({draft:{areas:A},live:{areas:A},draftDirty:false,airportSeeded:true,specialSeeded:true}));},
  run:async()=>{
    const d=labour('D1','DRIVER ONE',{salaryCategory:'drivers',employmentType:'Probationary'});setE([d]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-03_2026-09-09',type:'weekly',periodStart:'2026-09-03',periodEnd:'2026-09-09',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',
      lines:[{empId:'D1',name:'DRIVER ONE',dailyRate:658,daysWorked:6,tripIncentive:200,tripList:[{date:'2026-09-08',role:'d',trips:2,amount:200}]}],totals:{}}]));
    const LK='hydroPro_trip_log_v1';
    localStorage.setItem(LK,JSON.stringify([{id:'t9',date:'2026-09-08',driverId:'D1',helperId:'',truck:'V1',trips:['alabang','manila','manila'],status:'checked',createdAt:1}]));
    const asked=[];window.confirm=m=>{asked.push(String(m));return true;};window.alert=()=>{};
    try{hnxTripLogApprove('t9');}catch(e){}
    await sleep(300);
    const tl=JSON.parse(localStorage.getItem(LK))[0];
    const dn=calcEmployeePayroll(d,'2026-09-10','2026-09-16','weekly');
    return {status:tl.status,payDate:tl.payDate||null,named:asked.some(x=>/already paid this delivery day/.test(x)&&/driver ₱200/.test(x)&&/driver ₱400/.test(x)),next:dn.tripIncentive};},
  expect:{status:'approved',payDate:null,named:true,next:0} },
];
