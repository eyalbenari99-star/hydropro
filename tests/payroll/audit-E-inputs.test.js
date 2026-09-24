/* Audit batch E (inputs): the places where a typed figure reaches pay. Each case names the pesos.
   seed/run are stringified separately, so each carries its own fixtures. */
module.exports=[
{ name:'allowances: office ₱100/day × 11 days = ₱1,100.00, ₱2,000/month = ₱1,000.00, labour ₱2,000/month × 6 days = ₱461.54; the save preview agrees, a ₱2,000 PER DAY row (= ₱22,000.00) needs a second OK and a unit switch clears the amount (allowances-01)',
  run:async()=>{
    const o=office('O1','DOE, ANN',{monthlyBasic:16000,allowances:[{type:'meal',perDay:100}]});
    const o2=office('O2','DOE, BEN',{monthlyBasic:16000,allowances:[{type:'transport',monthly:2000}]});
    const w=labour('W1','DOE, WIL',{allowances:[{type:'transport',monthly:2000}]});
    setE([o,o2,w]);
    const a={};
    ['2026-08-11','2026-08-12','2026-08-13','2026-08-14','2026-08-17','2026-08-18','2026-08-19','2026-08-20','2026-08-21','2026-08-24','2026-08-25'].forEach(d=>{a[d]={O1:rec('present','07:00','17:30'),O2:rec('present','07:00','17:30')};});
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]=Object.assign(a[d]||{},{W1:rec('present','07:00','17:00')});});
    setA(a);
    const perDay=calcEmployeePayroll(o,'2026-08-11','2026-08-25','semi_monthly').recurringAllowance;
    const slip=calcEmployeePayroll(Object.assign({},o2,{allowances:[{type:'transport',perDay:2000}]}),'2026-08-11','2026-08-25','semi_monthly').recurringAllowance;
    const monthly=calcEmployeePayroll(o2,'2026-08-11','2026-08-25','semi_monthly').recurringAllowance;
    const weekly=calcEmployeePayroll(w,'2026-09-10','2026-09-16','weekly').recurringAllowance;
    const preview=[hnxAllowPreview(o,o.allowances).total,hnxAllowPreview(o2,o2.allowances).total,hnxAllowPreview(w,w.allowances).total];
    let asked='';const oc=window.confirm;window.confirm=m=>{asked=m;return false;};
    const slipSaves=hnxAllowGuard(o2,[{type:'transport',monthly:2000}],[{type:'transport',perDay:2000}]);
    const slipAsk=/22,000\.00/.test(asked)&&/MONTHLY figure/.test(asked);
    asked='';const okSaves=hnxAllowGuard(o,[],[{type:'meal',perDay:100}]);const okAsked=asked!=='';
    window.confirm=oc;
    window._empAllowDraft=[{type:'transport',monthly:2000}];_empAllowSet(0,'mode','day');
    const switched=window._empAllowDraft[0];
    /* the approve-time check now names the allowance itself */
    const prev=i=>({id:'office_p'+i,type:'semi_monthly',periodStart:'2026-0'+(5+i)+'-11',periodEnd:'2026-0'+(5+i)+'-25',status:'approved',lines:[{empId:'O2',name:'DOE, BEN',netPay:9000,recurringAllowance:1000,basicPay:8000,daysWorked:11}]});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([prev(0),prev(1),prev(2)]));
    const an=hnxPayAnomalies({id:'office_2026-08-11_2026-08-25',type:'semi_monthly',periodStart:'2026-08-11',periodEnd:'2026-08-25',lines:[{empId:'O2',name:'DOE, BEN',netPay:30000,recurringAllowance:22000,basicPay:8000,daysWorked:11,employmentType:'Regular',sss:400}]});
    return {perDay,slip,monthly,weekly,preview,slipSaves,slipAsk,okSaves,okAsked,switched:[switched.mode,switched.perDay,'monthly' in switched],
      anomalyNamesAllowance:an.some(x=>/allowance ₱22,000\.00 is 2100% ABOVE/.test(x)),anomalyHalfBasic:an.some(x=>/more than half the basic pay/.test(x))};},
  expect:{perDay:1100,slip:22000,monthly:1000,weekly:461.54,preview:[1100,1000,461.54],slipSaves:false,slipAsk:true,okSaves:true,okAsked:false,switched:['day',0,false],anomalyNamesAllowance:true,anomalyHalfBasic:true} },

{ name:'📜 Contracts vault: changing transport ₱2,000 → ₱2,500 keeps the ₱100/day meal row, so the office cut-off pays ₱1,100 + ₱1,250 = ₱2,350.00 (was ₱1,250.00 with the meal row silently deleted) (allowances-02)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));},
  run:async()=>{
    const o=office('O1','DOE, ANN',{monthlyBasic:16000,allowances:[{type:'meal',perDay:100,taxable:false},{type:'transport',monthly:2000,taxable:false}]});
    setE([o]);const a={};
    ['2026-08-11','2026-08-12','2026-08-13','2026-08-14','2026-08-17','2026-08-18','2026-08-19','2026-08-20','2026-08-21','2026-08-24','2026-08-25'].forEach(d=>{a[d]={O1:rec('present','07:00','17:30')};});setA(a);
    const before=calcEmployeePayroll(o,'2026-08-11','2026-08-25','semi_monthly').recurringAllowance;
    hnxContracts();await sleep(200);
    const vaultShowsDay=/₱100\.00\/day/.test((document.getElementById('hnxContractsOverlay')||{}).innerText||'');
    _hnxCtAllow('O1');await sleep(100);
    _ctA(1,'monthly','2500');_ctASave();await sleep(100);
    const e=JSON.parse(localStorage.getItem('hydroPro_employees'))[0];
    const after=calcEmployeePayroll(e,'2026-08-11','2026-08-25','semi_monthly').recurringAllowance;
    return {before,vaultShowsDay,rows:e.allowances.map(x=>[x.type,x.perDay||0,x.monthly||0]),legacyMonthly:e.monthlyAllowance,after};},
  expect:{before:2100,vaultShowsDay:true,rows:[['meal',100,0],['transport',0,2500]],legacyMonthly:2500,after:2350} },

{ name:'🏷 deleting the "Others" category while BOB\'s ₱1,500 entry sits in an open cut-off is refused, and an entry whose category is gone counts as taxable: ₱5,000 + ₱1,500 = ₱6,500.00, not ₱5,000.00 (allowances-10)',
  run:async()=>{
    setE([office('BOB','DOE, BOB',{monthlyBasic:16000})]);loadEmployees();
    const pk='office_2026-08-26_2026-09-10';
    localStorage.setItem('hydroPro_employee_allowances_v1',JSON.stringify({[pk]:{BOB:[{id:'a1',catId:'house_rental',amount:5000},{id:'a2',catId:'others',amount:1500}]}}));
    let alerted='';const oa=window.alert;window.alert=m=>{alerted=m;};
    _payAllowCatDelete('others');window.alert=oa;
    const kept=loadAllowanceCats().some(c=>c.id==='others');
    /* an orphan (category deleted before this fix, or by another device) */
    localStorage.setItem('hydroPro_employee_allowances_v1',JSON.stringify({[pk]:{BOB:[{id:'a1',catId:'house_rental',amount:5000},{id:'a2',catId:'gone_cat',amount:1500}]}}));
    const tx=taxableAllowanceFor(pk,'BOB'),ntx=nontaxableAllowanceFor(pk,'BOB'),tot=totalAllowanceFor(pk,'BOB');
    return {kept,refusedNamesBob:/DOE, BOB/.test(alerted)&&/1500\.00/.test(alerted),inUse:(window.__hnxAllowCatInUse||[]).length,paid:tx+ntx,tot,tx};},
  expect:{kept:true,refusedNamesBob:true,inUse:1,paid:6500,tot:6500,tx:6500} },

{ name:'⚖ holiday %: 1000 is refused (0-300 only); typing 200 in "extra when worked" asks first — day + 200% = 300% of the day (₱1,500.00 at ₱500/day) — and Cancel keeps the DOLE 100 (ot-holiday-02)',
  run:async()=>{
    const PK='hydroPro_pay_holiday_policy_v1';
    hnxHolidays();await sleep(200);
    const pol=()=>{try{const c=JSON.parse(localStorage.getItem(PK)||'null')||{};return (c.regular&&c.regular.worked!=null)?c.regular.worked:100;}catch(e){return 'err';}};
    const oc=window.confirm;let asked='';window.confirm=m=>{asked=m;return false;};
    _hnxHolPol('regular','worked','1000');const after1000=pol();const askedFor1000=asked!=='';
    _hnxHolPol('regular','worked','200');const afterCancel=pol();
    const says300=/= 300% of the day/.test(asked)&&/₱1,500\.00 at ₱500\/day/.test(asked);
    window.confirm=()=>true;_hnxHolPol('regular','worked','200');const afterOk=pol();
    window.confirm=()=>false;
    const hk='hydroPro_ph_holidays';const h=JSON.parse(localStorage.getItem(hk)||'{}');h['2026-08-31']={name:'National Heroes Day',kind:'regular'};localStorage.setItem(hk,JSON.stringify(h));
    _hnxHolPct('2026-08-31','unworkedPct','1000');const perDay=(JSON.parse(localStorage.getItem(hk))['2026-08-31']||{}).unworkedPct;
    window.confirm=oc;
    const txt=(document.getElementById('hnxHolidayOverlay')||{}).innerText||'';
    return {after1000,askedFor1000,afterCancel,says300,afterOk,perDay:perDay===undefined?'unset':perDay,showsTotal:/\(= 100% off · 300% worked\)/.test(txt)};},
  expect:{after1000:100,askedFor1000:false,afterCancel:100,says300:true,afterOk:200,perDay:'unset',showsTotal:true} },

{ name:'📝 GH3 BAD memo, worker rate ₱200: 8 workers × ₱200 + 2 connected supervisors × ₱100 = −₱1,800.00 on the memo, on the FINAL approval and in payroll; a later rate change leaves it at ₱1,800; a typed ₱0 worker rate pays ₱0; an HR memo of −₱5,000 against a ₱3,948 week is flagged (deductions-loans-03)',
  run:async()=>{
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:200,supervisor:100}));
    const E=[];for(let i=1;i<=8;i++)E.push(labour('W'+i,'WORKER, '+i,{ghAssigned:['GH3']}));
    E.push(labour('S1','SUP, ONE',{ghAssigned:[],supervisorGHs:'all',tier:'supervisor'}));E.push(labour('S2','SUP, TWO',{ghAssigned:['GH1'],supervisorGHs:'all',tier:'supervisor'}));
    setE(E);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={};E.forEach(e=>{a[d][e.id]=rec('present','07:00','17:00');});});setA(a);
    const m={id:'M1',category:'production',type:'bad',gh:'GH3',date:'2026-09-15',status:'pending',title:'GH3 bad',reasons:[],signatures:{supervisor:null,hrManager:null}};
    localStorage.setItem('hydroPro_memos',JSON.stringify([m]));loadMemos();
    const memoTotal=calcMemoImpact(m).total;
    let asked='';const oc=window.confirm;window.confirm=x=>{asked=x;return true;};
    hnxMemoApproveDo('M1','final');window.confirm=oc;
    const stored=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    const payroll=()=>E.reduce((s,e)=>s+(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly').memoDed||0),0);
    const paid=payroll();
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:300,supervisor:100}));
    const paidAfterRateEdit=payroll();
    /* a typed ₱0 through the rate editor is honoured; an old table holding 0 keeps its old meaning */
    hnxMemoRates();await sleep(100);document.getElementById('hnxMR_worker').value='0';document.getElementById('hnxMR_teamLeader').value='150';document.getElementById('hnxMR_supervisor').value='100';
    hnxMemoRatesSave();
    const zeroWorker=calcMemoAmountForEmp({},E[0]);
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:0,supervisor:100}));
    const legacyZero=calcMemoAmountForEmp({},E[0]);
    /* HR memo sanity */
    const f=hnxMemoFreeze({category:'hr',type:'bad',empId:'W1',totalAmount:-5000},true);
    return {memoTotal,approveShowsPesos:/1,800\.00/.test(asked)&&/WORKER, 1 \(Worker\): −₱200\.00/.test(asked),storedTotal:stored.totalAmount,frozenWorker:stored.ratesAtSign&&stored.ratesAtSign.worker,paid,paidAfterRateEdit,zeroWorker,legacyZero,
      hrWarn:f.warn.some(x=>/MORE than one labour week/.test(x)&&/3,948\.00/.test(x))};},
  expect:{memoTotal:-1800,approveShowsPesos:true,storedTotal:-1800,frozenWorker:200,paid:1800,paidAfterRateEdit:1800,zeroWorker:0,legacyZero:100,hrWarn:true} },

{ name:'🏛 office SSS cell clicked without typing stores NO override; a real ₱500 override is retired when the salary goes ₱18,000 → ₱25,000 and the cut-off deducts the engine\'s ₱625.00 again; ₱4,500 asks first (deductions-loans-04)',
  run:async()=>{
    const o=office('O1','DOE, ANN',{monthlyBasic:18000});setE([o]);loadEmployees();
    const a={};['2026-08-26','2026-08-27','2026-08-28','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-07','2026-09-08','2026-09-09','2026-09-10'].forEach(d=>{a[d]={O1:rec('present','07:00','17:30')};});setA(a);
    const P={start:'2026-08-26',end:'2026-09-10',half:'second',label:'t'};
    switchView('payroll_office');await sleep(2500);window._payOfficeCurrentPeriod=P;
    const rid=payOfficeRunId(P);
    const line=()=>{window._payOfficeCurrentPeriod=P;renderPayrollOffice();const r=getPayrollRun(rid);return ((r&&r.lines)||[]).find(l=>l.empId==='O1')||{};};
    const OV='hydroPro_office_gov_overrides';const ov=()=>JSON.parse(localStorage.getItem(OV)||'{}');
    const l0=line();
    payOfficeEditGovDed(rid,'O1','sss',(l0.sss||0).toFixed(2),l0.sss);
    const afterBlur=Object.keys(ov()).length;
    payOfficeEditGovDed(rid,'O1','sss','500',l0.sss);
    const l1=line();const basis=(ov().O1||{}).basis;
    const e=JSON.parse(localStorage.getItem('hydroPro_employees'));e[0].monthlyBasic=25000;localStorage.setItem('hydroPro_employees',JSON.stringify(e));loadEmployees();
    const l2=line();
    const oc=window.confirm;let asked='';window.confirm=m=>{asked=m;return false;};
    payOfficeEditGovDed(rid,'O1','sss','4500',l2.sss);window.confirm=oc;
    return {sss18k:l0.sss,afterBlur,sssOverride:l1.sss,basis,sss25k:l2.sss,phic25k:l2.phic,retired:!ov().O1,bigAsked:/above the legal employee share/.test(asked),bigStored:!!ov().O1};},
  expect:{sss18k:450,afterBlur:0,sssOverride:500,basis:18000,sss25k:625,phic25k:312.5,retired:true,bigAsked:true,bigStored:false} },

{ name:'👷 contractor ₱610 × 5 days = ₱3,050 with a ₱5,000 penalty: ₱3,050 taken, the ₱1,950 balance is carried into the next week once the run is approved (next week nets ₱3,050 − ₱1,950 = ₱1,100.00), and the payslip says taken/carried (deductions-loans-07, rates-master-other-15)',
  run:async()=>{
    const e=labour('C1','CON, TRA',{employmentType:'Contractor',salaryCategory:'production',contractorProject:'15',dailyRate:610});setE([e]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-17','2026-09-18','2026-09-19','2026-09-21','2026-09-22'].forEach(d=>{a[d]={C1:rec('present','07:00','17:00')};});setA(a);
    const AK='hydroPro_contr_adjust_v1';
    localStorage.setItem(AK,JSON.stringify([{id:'P1',empId:'C1',date:'2026-09-11',kind:'penalty',amount:5000,reason:'damage'}]));
    const w1=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    const run={id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'approved',approvedAt:Date.now()+1000,lines:[Object.assign({name:'CON, TRA'},w1)],totals:{}};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([run]));
    const made=hnxContrCarrySweep(),again=hnxContrCarrySweep();
    const carry=JSON.parse(localStorage.getItem(AK)).filter(x=>x.carriedFrom===run.id).map(x=>[x.date,x.amount]);
    const w2=calcEmployeePayroll(e,'2026-09-17','2026-09-23','weekly');
    let slip='';try{payShowPayslip(run.id,'C1');await sleep(300);slip=(document.getElementById('payslipBody')||{}).innerText||'';}catch(x){slip='ERR '+x.message;}
    /* the entry itself: the peso amount and the week it lands in are confirmed first */
    ['hnxCaDate','hnxCaKind','hnxCaAmt','hnxCaWhy'].forEach(id=>{const el=document.createElement(id==='hnxCaKind'?'select':'input');el.id=id;if(id==='hnxCaKind'){el.innerHTML='<option value="penalty">p</option>';}document.body.appendChild(el);});
    document.getElementById('hnxCaDate').value='2026-09-18';document.getElementById('hnxCaAmt').value='5000';document.getElementById('hnxCaWhy').value='typo test';
    let asked='';const oc=window.confirm;window.confirm=m=>{asked=m;return false;};hnxContrAdjAdd('C1');window.confirm=oc;
    const recorded=JSON.parse(localStorage.getItem(AK)).length;
    return {w1:[w1.basicPay,w1.contrPenaltyTaken,w1.contrPenaltyCarry,w1.netPay],made,again,carry,w2:[w2.basicPay,w2.contrPenalty,w2.contrPenaltyTaken,w2.netPay],
      slipTaken:/Penalty taken this week/.test(slip)&&/3,050\.00/.test(slip),slipCarried:/Carried forward to next week/.test(slip)&&/1,950\.00/.test(slip),
      asked:/PENALTY −₱5,000\.00/.test(asked)&&/2026-09-17 → 2026-09-23/.test(asked)&&/MORE than a full week/.test(asked),recorded};},
  expect:{w1:[3050,3050,1950,0],made:1,again:0,carry:[['2026-09-17',1950]],w2:[3050,1950,1950,1100],slipTaken:true,slipCarried:true,asked:true,recorded:2} },

{ name:'🎚 Level Rates ▸ Apply to All leaves a ₱658 Pay-Basis daily rate alone (week stays 6 × 658 = ₱3,948.00, not ₱2,100.00), moves only the listed level-rate person (₱300 → ₱450) and logs it; the HR chip shows what payroll pays (rates-master-other-04)',
  run:async()=>{
    const A=labour('A1','PB, ANN',{dailyRate:658});const B=labour('B1','LV, BEN',{dailyRate:0,rate:300});const C=labour('C1','OV, CAT',{dailyRate:0,rateOverride:700,rate:700});
    setE([A,B,C]);loadEmployees();
    localStorage.setItem('hydroPro_training_certs',JSON.stringify({A1:{level:1,tasks:{},levelHistory:[]},B1:{level:2,tasks:{},levelHistory:[]},C1:{level:3,tasks:{},levelHistory:[]}}));
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={A1:rec('present','07:00','17:00')};});setA(a);
    let asked='';const oc=window.confirm,oa=window.alert;window.confirm=m=>{asked=m;return true;};window.alert=()=>{};
    HNX_applyLevelRatesToEmployees();window.confirm=oc;window.alert=oa;
    const S=JSON.parse(localStorage.getItem('hydroPro_employees'));const g=id=>S.find(x=>x.id===id);
    const weekA=calcEmployeePayroll(g('A1'),'2026-09-10','2026-09-16','weekly').basicPay;
    const log=(typeof loadAuditLog==='function'?loadAuditLog():[])||[];
    const audited=log.some(x=>x&&x.a==='salary_change'&&/LV, BEN — rate 300 → 450/.test(x.d||''));
    const chip=getEmployeeRate({id:'Z9',rate:450,dailyRate:0});
    return {plan:window.__hnxLevelApplyPlan,listed:/LV, BEN \(L2\): ₱300\.00 → ₱450\.00/.test(asked)&&/1 with a rate set in 🩺 Pay Basis Check/.test(asked),
      A:[g('A1').rate||0,g('A1').dailyRate],B:g('B1').rate,C:g('C1').rate,weekA,audited,chip};},
  expect:{plan:[{id:'B1',old:300,nw:450,lvl:2}],listed:true,A:[0,658],B:450,C:700,weekA:3948,audited:true,chip:450} },

{ name:'🩺 Pay Basis Check: correcting a ₱6,580 override to 658 reaches payroll — the week pays 6 × 658 = ₱3,948.00 instead of ₱39,480.00, with a second OK and an old → new salary log (rates-master-other-06)',
  run:async()=>{
    const e=labour('L1','DOE, JO',{dailyRate:0,rateOverride:6580,rate:6580});setE([e]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={L1:rec('present','07:00','17:00')};});setA(a);
    const before=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly').basicPay;
    let asked='';const oc=window.confirm;window.confirm=m=>{asked=m;return true;};
    hnxPBSet('L1','dailyRate','658');window.confirm=oc;
    const s=JSON.parse(localStorage.getItem('hydroPro_employees'))[0];
    const after=calcEmployeePayroll(s,'2026-09-10','2026-09-16','weekly').basicPay;
    const log=(typeof loadAuditLog==='function'?loadAuditLog():[])||[];
    return {before,after,fields:[s.rateOverride,s.rate,s.dailyRate],asked:/₱6,580\.00 → ₱658\.00/.test(asked)&&/₱39,480\.00 → ₱3,948\.00/.test(asked),
      audited:log.some(x=>x&&x.a==='salary_change'&&/daily rate 6580 → 658/.test(x.d||''))};},
  expect:{before:39480,after:3948,fields:[658,658,658],asked:true,audited:true} },

{ name:'👤 HR card: a Daily Rate typed 6580 is NOT auto-saved (payroll keeps ₱658) and Cancel discards it; the explicit Save asks first — a 6-day week ₱3,948.00 → ₱39,480.00 — and Cancel there saves nothing (rates-master-other-17)',
  run:async()=>{
    const e=labour('L1','DOE, JOHN',{dailyRate:0,rateOverride:658,rate:658,title:'Worker',role:'Worker',dept:'OTHER',type:'Regular'});setE([e]);loadEmployees();
    const st=()=>JSON.parse(localStorage.getItem('hydroPro_employees')).find(x=>x.id==='L1');
    openEmployeeModal('L1');await sleep(600);
    const r=document.getElementById('empRate');r.value='6580';
    r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new Event('change',{bubbles:true}));await sleep(400);
    const afterType=st().rateOverride;const note=!!document.getElementById('hnxPayDirtyNote');
    let asked='';const oc=window.confirm;window.confirm=m=>{asked=m;return /Name should be/.test(m);};
    saveEmployee();await sleep(400);
    const afterCancel=st().rateOverride;window.confirm=oc;
    return {afterType,note,afterCancel,asked:/Daily rate ₱658\.00 → ₱6,580\.00/.test(asked)&&/₱3,948\.00 → ₱39,480\.00/.test(asked)};},
  expect:{afterType:658,note:true,afterCancel:658,asked:true} },

{ name:'🚚 trip rate guard: Clark 250 ×2 → 500 ×2 (₱500 → ₱1,000 per extra trip, exactly 2×) raises BIG JUMP, and a 1st-trip-only change (ALABANG driver 1st trip ₱0 → ₱1,700) is listed and flagged (rates-master-other-10)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;a.special=false;}});
    r.live=JSON.parse(JSON.stringify(r.draft));
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=500;a.h2=200;}});
    r.draftDirty=true;localStorage.setItem(RK,JSON.stringify(r));
    /* say yes to the '₱0 additional rate' question, stop at 'APPROVE this rate table?' - nothing is written */
    const oc=window.confirm;window.confirm=m=>/₱0 ADDITIONAL/.test(m);
    hnxTripRateApprove();const clark=(window.__hnxTripRateBigList||[]).slice();
    const r2=JSON.parse(localStorage.getItem(RK));r2.draft=JSON.parse(JSON.stringify(r2.live));
    r2.draft.areas.forEach(a=>{if(a.id==='alabang'){a.d1=1700;}});localStorage.setItem(RK,JSON.stringify(r2));
    hnxTripRateApprove();const alab=(window.__hnxTripRateBigList||[]).slice();
    window.confirm=oc;
    return {clarkBig:clark.some(x=>/CLARK/i.test(x)&&/₱500 → ₱1000/.test(x)&&/₱200 → ₱400/.test(x)),alabBig:alab.some(x=>/ALABANG/i.test(x)&&/1st trip: driver ₱0 → ₱1700/.test(x)),alabOnly:alab.length};},
  expect:{clarkBig:true,alabBig:true,alabOnly:1} },

{ name:'🚚 trip re-price: a Clark day on Thu 10 Sep inside the APPROVED office cut-off 26 Aug–10 Sep but in the DRAFT labour week re-prices D ₱1,000 → ₱500; the same day inside an approved WEEKLY run that holds only the driver: driver stays ₱1,000, the helper (not on that run) still re-prices ₱400 → ₱200 (rates-master-other-11 · v20.97 per-role)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'H1',name:'Nico',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;a.special=false;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const day=()=>[{id:'c9',date:'2026-09-10',driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400}];
    const oc=window.confirm,oa=window.alert;window.confirm=()=>true;window.alert=()=>{};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-08-26_2026-09-10',type:'semi_monthly',status:'approved',periodStart:'2026-08-26',periodEnd:'2026-09-10',lines:[{empId:'O1'}]}]));
    localStorage.setItem(LK,JSON.stringify(day()));
    const nOffice=hnxTripRepriceApproved(false);const dOffice=JSON.parse(localStorage.getItem(LK))[0].pricedD;
    const drv=(window.hnxTripEmp&&window.hnxTripEmp('D1'))||{id:'D1'};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10_2026-09-16',type:'weekly',status:'approved',periodStart:'2026-09-10',periodEnd:'2026-09-16',lines:[{empId:drv.id||'D1'}]}]));
    localStorage.setItem(LK,JSON.stringify(day()));
    const nWeekly=hnxTripRepriceApproved(false);const _w=JSON.parse(localStorage.getItem(LK))[0];const dWeekly=_w.pricedD,hWeekly=_w.pricedH;
    window.confirm=oc;window.alert=oa;
    return {nOffice,dOffice,nWeekly,dWeekly,hWeekly,paidStale:window.__hnxTripPaidStale};},
  expect:{nOffice:1,dOffice:500,nWeekly:1,dWeekly:1000,hWeekly:200,paidStale:1} },

{ name:'🚚 the trip log row and the Trip doctor show the ₱1,000.00 an approved Clark day is actually paid (frozen), with "table now ₱500.00" (rates-master-other-16)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'H1',name:'Nico',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;a.special=false;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const tl={id:'c7',date:today,driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400};
    localStorage.setItem(LK,JSON.stringify([tl]));
    hnxTripTab('log');await sleep(800);
    const row=[...document.querySelectorAll('#view-pay_trips tr')].map(x=>x.innerText.replace(/\s+/g,' ')).find(x=>/V1/.test(x)&&/approved/.test(x))||'';
    const v=window.__hnxTripDoc.verdict(tl);
    return {rowPaid:/1,000\.00 table now 500\.00/.test(row),rowHelper:/400\.00 table now 200\.00/.test(row),doctor:[v.A.d,v.A.liveD,v.A.h],doctorSays:v.probs.some(p=>/approved at driver ₱1,000\.00/.test(p))};},
  expect:{rowPaid:true,rowHelper:true,doctor:[1000,500,400],doctorSays:true} },

/* ---------- round 2 (reviewer findings on the batch above) ---------- */
{ name:'👷 r2: a carried contractor balance can be WAIVED — ₱5,000 penalty on a ₱3,050 week carries ₱1,950; the admin waives it, the 15-second sweep does not bring it back, and the next week nets ₱3,050.00 (not ₱1,100.00); removing the original penalty after approval offers the same waiver (deductions-loans-07 r2)',
  run:async()=>{
    const e=labour('C1','CON, TRA',{employmentType:'Contractor',salaryCategory:'production',contractorProject:'15',dailyRate:610});setE([e]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-17','2026-09-18','2026-09-19','2026-09-21','2026-09-22'].forEach(d=>{a[d]={C1:rec('present','07:00','17:00')};});setA(a);
    const AK='hydroPro_contr_adjust_v1',adj=()=>JSON.parse(localStorage.getItem(AK)||'[]');
    const approveWeek1=()=>{const w1=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
      localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'approved',approvedAt:Date.now()+1000,lines:[Object.assign({name:'CON, TRA'},w1)],totals:{}}]));};
    const cid='CADJ-CARRY-ops_2026-09-10_2026-09-16-C1';
    const oc=window.confirm;window.confirm=()=>true;
    /* A: waive the carry entry itself */
    localStorage.setItem(AK,JSON.stringify([{id:'P1',empId:'C1',date:'2026-09-11',kind:'penalty',amount:5000,reason:'damage'}]));
    approveWeek1();
    const made=hnxContrCarrySweep();
    hnxContrAdjDel(cid);
    const again=hnxContrCarrySweep();
    const row=adj().find(x=>x.id===cid)||{};
    const w2=calcEmployeePayroll(e,'2026-09-17','2026-09-23','weekly');
    /* B: remove the ORIGINAL penalty after the week was approved - the carried balance is offered for waiver too */
    localStorage.setItem(AK,JSON.stringify([{id:'P1',empId:'C1',date:'2026-09-11',kind:'penalty',amount:5000,reason:'damage'}]));
    approveWeek1();
    hnxContrAdjDel('P1');
    const againB=hnxContrCarrySweep();
    const rowB=adj().find(x=>x.id===cid)||{};
    const w2B=calcEmployeePayroll(e,'2026-09-17','2026-09-23','weekly');
    window.confirm=oc;
    const log=(typeof loadAuditLog==='function'?loadAuditLog():[])||[];
    return {made,again,waived:[row.waived,row.amount,row.waivedAmount],w2:[w2.contrPenalty||0,w2.netPay],
      againB,waivedB:[rowB.waived,rowB.amount,rowB.waivedAmount],originalGone:!adj().some(x=>x.id==='P1'),w2B:[w2B.contrPenalty||0,w2B.netPay],
      audited:log.some(x=>x&&x.a==='contractor_adj'&&/WAIVED/.test(x.d||''))};},
  expect:{made:1,again:0,waived:[true,0,1950],w2:[0,3050],againB:0,waivedB:[true,0,1950],originalGone:true,w2B:[0,3050],audited:true} },

{ name:'🏛 r2: an OLD office override (saved before overrides recorded the salary) is checked against the engine — SSS 450 / PHIC 225 on a ₱25,000 basic (calculated 625.00 / 312.50) is flagged on the cell, by the name and in the pre-approval check, and "use calculated" deducts 625.00 / 312.50; an old override EQUAL to the engine is dropped as a blur-pin; Keep stamps the ₱25,000 basic (deductions-loans-04 r2)',
  run:async()=>{
    const o=office('O1','DOE, ANN',{monthlyBasic:25000}),o2=office('O2','DOE, BEN',{monthlyBasic:25000});setE([o,o2]);loadEmployees();
    const a={};['2026-08-26','2026-08-27','2026-08-28','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-07','2026-09-08','2026-09-09','2026-09-10'].forEach(d=>{a[d]={O1:rec('present','07:00','17:30'),O2:rec('present','07:00','17:30')};});setA(a);
    const P={start:'2026-08-26',end:'2026-09-10',half:'second',label:'t'};
    switchView('payroll_office');await sleep(2500);window._payOfficeCurrentPeriod=P;
    const rid=payOfficeRunId(P);
    const OV='hydroPro_office_gov_overrides';const ov=()=>JSON.parse(localStorage.getItem(OV)||'{}');
    const lines=()=>{window._payOfficeCurrentPeriod=P;renderPayrollOffice();const r=getPayrollRun(rid);return (r&&r.lines)||[];};
    const eng=lines().find(l=>l.empId==='O2')||{};
    localStorage.setItem(OV,JSON.stringify({O1:{sss:450,phic:225,updatedAt:1},O2:{sss:eng.sss,phic:eng.phic,updatedAt:1}}));
    const L1=lines(),a1=L1.find(l=>l.empId==='O1')||{},b1=L1.find(l=>l.empId==='O2')||{};
    const an=hnxPayAnomalies(getPayrollRun(rid))||[];
    const badge=!!document.querySelector('tr[data-emp="O1"] .hnxGovLegacyBadge');
    payOfficeGovLegacyReset('O1',true);
    const a2=lines().find(l=>l.empId==='O1')||{};const resetGone=!ov().O1;
    /* Keep: the figure stays and is stamped with the current basic (a later raise retires it) */
    localStorage.setItem(OV,JSON.stringify({O1:{sss:450,updatedAt:1}}));lines();
    payOfficeGovLegacyKeep('O1',true);
    const a3=lines().find(l=>l.empId==='O1')||{};const k=ov().O1||{};
    return {engine:[eng.sss,eng.phic],kept:[a1.sss,a1.phic],legacy:a1.govOverrideLegacy,phantom:[b1.sss,b1.phic,!ov().O2],
      anomaly:an.some(x=>/DOE, ANN: SSS override ₱450\.00 vs ₱625\.00 calculated/.test(x))&&an.some(x=>/PHIC override ₱225\.00 vs ₱312\.50/.test(x)),badge,
      reset:[a2.sss,a2.phic,resetGone],keep:[a3.sss,!!a3.govOverrideLegacy,k.basis,k.legacy===undefined]};},
  expect:{engine:[625,312.5],kept:[450,225],legacy:{sss:{ov:450,calc:625},phic:{ov:225,calc:312.5}},phantom:[625,312.5,true],anomaly:true,badge:true,
    reset:[625,312.5,true],keep:[450,false,25000,true]} },

{ name:'👤 r2: the HR pay guard asks only when pay changes and only people who may change pay — an HR user without salary access editing Notes on a ₱610/day labourer with a ₱200/day meal row is NOT shown pesos and the note saves; an admin changing the phone number saves with no prompt; emptying a ₱658 override asks — 6-day week ₱3,948.00 → ₱2,100.00 (level table L1) — and Cancel keeps ₱658 (rates-master-other-17 r2)',
  run:async()=>{
    const e=labour('L1','DOE, JOHN',{dailyRate:0,rateOverride:610,rate:610,title:'Worker',role:'Worker',dept:'OTHER',type:'Regular',allowances:[{type:'meal',perDay:200,taxable:false}],notes:''});
    const f=labour('L2','DOE, JANE',{dailyRate:0,rateOverride:658,rate:658,title:'Worker',role:'Worker',dept:'OTHER',type:'Regular'});
    setE([e,f]);loadEmployees();
    localStorage.setItem('hydroPro_training_certs',JSON.stringify({L1:{level:1,tasks:{},levelHistory:[]},L2:{level:1,tasks:{},levelHistory:[]}}));
    const st=id=>JSON.parse(localStorage.getItem('hydroPro_employees')).find(x=>x.id===id);
    const setRole=(role,sa)=>{const U=JSON.parse(localStorage.getItem('hydroPro_users'));U.forEach(u=>{if(u.username==='tester'){u.role=role;u.salaryAccess=sa;}});localStorage.setItem('hydroPro_users',JSON.stringify(U));};
    const oc=window.confirm;let asked=[];window.confirm=m=>{asked.push(m);return false;};
    /* 1. HR user, no salary access, Notes only */
    setRole('hr',false);
    openEmployeeModal('L1');await sleep(600);
    document.getElementById('empNotes').value='new note';
    saveEmployee();await sleep(300);
    const hrAsked=asked.slice();const hrNote=st('L1').notes;const hrMeal=JSON.stringify(st('L1').allowances);
    try{document.getElementById('empModal').classList.remove('open');}catch(x){}
    /* 2. admin, phone number only */
    setRole('admin',true);asked=[];
    openEmployeeModal('L1');await sleep(600);
    document.getElementById('empPhone').value='09171234567';
    saveEmployee();await sleep(300);
    const phoneAsked=asked.slice();const phone=st('L1').phone;
    try{document.getElementById('empModal').classList.remove('open');}catch(x){}
    /* 3. admin empties the ₱658 override → level table ₱350 */
    asked=[];
    openEmployeeModal('L2');await sleep(600);
    document.getElementById('empRate').value='';
    saveEmployee();await sleep(300);
    const dropAsked=asked.join('\n');const kept=st('L2').rateOverride;
    window.confirm=oc;
    return {hrAsked:hrAsked.filter(m=>/PAY CHANGE|₱/.test(m)).length,hrNote,hrMeal,phoneAsked:phoneAsked.length,phone,
      dropAsked:/Daily rate ₱658\.00 → ₱350\.00 \(level table L1\)/.test(dropAsked)&&/₱3,948\.00 → ₱2,100\.00/.test(dropAsked),kept};},
  expect:{hrAsked:0,hrNote:'new note',hrMeal:'[{"type":"meal","perDay":200,"taxable":false}]',phoneAsked:0,phone:'09171234567',dropAsked:true,kept:658} },

{ name:'👤 r2: a Department picked in the HR card is NOT auto-saved — APTI_REGULAR → APTI_ACCOUNTING then Cancel leaves the labourer on the weekly payroll (dept and payroll category unchanged); an allowance unit switch that empties a ₱2,000/month transport row asks first ("₱461.54 per labour week (6 days) stops being paid", "NO amount") and Cancel keeps it (rates-master-other-17 r2, allowances-01 r2)',
  run:async()=>{
    const e=labour('L1','DOE, JOHN',{dailyRate:0,rateOverride:658,rate:658,title:'Worker',role:'Worker',dept:'APTI_REGULAR',salaryCategory:'production_regular',type:'Regular',ghAssigned:['GH1'],allowances:[{type:'transport',monthly:2000,taxable:false}]});
    setE([e]);loadEmployees();
    const st=()=>JSON.parse(localStorage.getItem('hydroPro_employees')).find(x=>x.id==='L1');
    const oc=window.confirm;let asked=[];window.confirm=m=>{asked.push(m);return true;};
    openEmployeeModal('L1');await sleep(600);
    const d=document.getElementById('empDept');const hasOpt=[...d.options].some(o=>o.value==='APTI_ACCOUNTING');
    d.value='APTI_ACCOUNTING';d.dispatchEvent(new Event('input',{bubbles:true}));d.dispatchEvent(new Event('change',{bubbles:true}));await sleep(500);
    try{if(typeof window._autosaveEmployee==='function')window._autosaveEmployee();}catch(x){}await sleep(300);
    const afterPick=[st().dept,st().salaryCategory];const note=!!document.getElementById('hnxPayDirtyNote');
    try{document.getElementById('empModal').classList.remove('open');}catch(x){}
    /* unit switch empties the amount, explicit Save asks, Cancel keeps the allowance */
    openEmployeeModal('L1');await sleep(600);
    _empAllowSet(0,'mode','day');
    asked=[];window.confirm=m=>{asked.push(m);return /Name should be|greenhouse/.test(m);};
    saveEmployee();await sleep(300);
    const txt=asked.join('\n');
    window.confirm=oc;
    return {hasOpt,afterPick,note,unitAsked:/₱461\.54 per labour week \(6 days\) stops being paid/.test(txt)&&/NO amount/.test(txt),allowKept:JSON.stringify(st().allowances)};},
  expect:{hasOpt:true,afterPick:['APTI_REGULAR','production_regular'],note:true,unitAsked:true,allowKept:'[{"type":"transport","monthly":2000,"taxable":false}]'} },

{ name:'🎚 r2: a level change moves pay for someone paid from the level table — the HR card Pro Level L1 → L2 asks first (₱350.00 → ₱450.00, week ₱2,100.00 → ₱2,700.00) and logs a salary change; the last task sign-off auto-promotes L2 → L3 (₱450 → ₱550) and logs it too (rates-master-other-04 r2)',
  run:async()=>{
    const e=labour('L1','DOE, LEVI',{dailyRate:0,title:'Worker',role:'Worker',dept:'OTHER',type:'Regular'});delete e.rate;delete e.rateOverride;
    setE([e]);loadEmployees();
    localStorage.setItem('hydroPro_training_certs',JSON.stringify({L1:{level:1,tasks:{},levelHistory:[]}}));
    const oc=window.confirm,op=window.prompt;let asked=[];window.confirm=m=>{asked.push(m);return true;};window.prompt=()=>'';
    openEmployeeModal('L1');await sleep(600);
    const lv=document.getElementById('empLevel');lv.value='2';
    saveEmployee();await sleep(300);
    const hrAsk=asked.join('\n');
    const lvl=(JSON.parse(localStorage.getItem('hydroPro_training_certs')).L1||{}).level;
    /* auto-promotion on the last sign-off of level 2 */
    const T=tasksForLevel(2);const c=JSON.parse(localStorage.getItem('hydroPro_training_certs'));c.L1.tasks={};
    T.slice(0,-1).forEach(t=>{c.L1.tasks[t.id]={certifiedAt:new Date().toISOString(),certifiedBy:'x'};});localStorage.setItem('hydroPro_training_certs',JSON.stringify(c));
    signOffTask('L1',T[T.length-1].id);
    const lvl2=(JSON.parse(localStorage.getItem('hydroPro_training_certs')).L1||{}).level;
    window.confirm=oc;window.prompt=op;
    const log=(typeof loadAuditLog==='function'?loadAuditLog():[])||[];
    return {hrAsk:/Pro Level L1 → L2/.test(hrAsk)&&/₱350\.00 → ₱450\.00/.test(hrAsk)&&/₱2,100\.00 → ₱2,700\.00/.test(hrAsk),lvl,lvl2,
      hrLogged:log.some(x=>x&&x.a==='salary_change'&&/DOE, LEVI — level-table rate 350 → 450 \(L1 → L2\)/.test(x.d||'')),
      autoLogged:log.some(x=>x&&x.a==='salary_change'&&/DOE, LEVI — level-table rate 450 → 550 \(L2 → L3\) — auto-promoted/.test(x.d||''))};},
  expect:{hrAsk:true,lvl:2,lvl2:3,hrLogged:true,autoLogged:true} },

{ name:'📝 r2: an older-shape GH memo {type:"production", kind:"bad", ghAffected:"GH3"} with 3 workers present shows −₱300.00 on the memo and the FINAL approval, the same ₱300.00 payroll deducts (was "₱0.00 (0 lines)") (deductions-loans-03 r2)',
  run:async()=>{
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:100,supervisor:100}));
    const E=[];for(let i=1;i<=3;i++)E.push(labour('W'+i,'WORKER, '+i,{ghAssigned:['GH3']}));
    setE(E);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={};E.forEach(e=>{a[d][e.id]=rec('present','07:00','17:00');});});setA(a);
    const m={id:'M9',type:'production',kind:'bad',ghAffected:'GH3',date:'2026-09-15',status:'pending',title:'GH3 old shape',reasons:[],signatures:{supervisor:null,hrManager:null}};
    localStorage.setItem('hydroPro_memos',JSON.stringify([m]));loadMemos();
    const imp=calcMemoImpact(m);
    let asked='';const oc=window.confirm;window.confirm=x=>{asked=x;return true;};
    hnxMemoApproveDo('M9','final');window.confirm=oc;
    const stored=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    const paid=E.reduce((s,e)=>s+(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly').memoDed||0),0);
    return {memo:[imp.total,(imp.impact||[]).length],approval:/Payroll will move: −₱300\.00 \(3 lines\)/.test(asked),stored:[stored.status,stored.totalAmount],paid};},
  expect:{memo:[-300,3],approval:true,stored:['signed',-300],paid:300} },

{ name:'🚚 r2: a driver with TWO approved records on one date is paid the joined live figure, so the row shows the live ₱500.00 with no "table now"; the helper, on only one of them, still shows the frozen ₱400.00 (table now ₱200.00) (rates-master-other-16 r2)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'H1',name:'Nico',active:true}]));},
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;a.special=false;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const A={id:'c7',date:today,driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400,createdAt:1};
    const B={id:'c8',date:today,driverId:'D1',helperId:'',truck:'V2',trips:['clark'],status:'approved',pricedD:0,pricedH:null,createdAt:2};
    localStorage.setItem(LK,JSON.stringify([A,B]));
    hnxTripTab('log');await sleep(800);
    const row=[...document.querySelectorAll('#view-pay_trips tr')].map(x=>x.innerText.replace(/\s+/g,' ')).find(x=>/V1/.test(x)&&/approved/.test(x))||'';
    return {driverLive:/ 500\.00 400\.00 /.test(' '+row+' ')&&!/1,000\.00/.test(row),helperFrozen:/400\.00 table now 200\.00/.test(row),tableNowOnce:(row.match(/table now/g)||[]).length};},
  expect:{driverLive:true,helperFrozen:true,tableNowOnce:1} },

{ name:'💰 r2: the 💰 Allowances save refuses an EMPTY row — a ₱2,000/month transport switched to PER DAY (amount cleared) is kept at ₱2,000/month, not silently deleted; removing it asks first: "₱461.54 per labour week (6 days) stops being paid" (allowances-01 r2)',
  run:async()=>{
    const w=labour('W1','DOE, WIL',{allowances:[{type:'transportation',monthly:2000,taxable:false}]});setE([w]);loadEmployees();
    const st=()=>JSON.parse(localStorage.getItem('hydroPro_employees'))[0];
    hnxAllowMan('W1');await sleep(200);
    const sel=document.querySelector('#hnxAllowMan .hnxAllowRow .alMode');sel.value='day';sel.dispatchEvent(new Event('change',{bubbles:true}));
    const cleared=document.querySelector('#hnxAllowMan .hnxAllowRow .alAmt').value;
    let alerted='';const oa=window.alert;window.alert=m=>{alerted=m;};
    hnxAllowSave('W1');window.alert=oa;
    const kept=JSON.stringify(st().allowances);
    let asked='';const oc=window.confirm;window.confirm=m=>{asked=m;return false;};
    const removeOk=hnxAllowGuard(w,[{type:'transportation',monthly:2000}],[]);window.confirm=oc;
    return {cleared,refused:/NO amount/.test(alerted)&&/transportation \(PER DAY\)/.test(alerted),kept,removeOk,removeAsk:/transportation \(₱2,000\.00 per MONTH\) is REMOVED — ₱461\.54 per labour week \(6 days\) stops being paid/.test(asked)};},
  expect:{cleared:'',refused:true,kept:'[{"type":"transportation","monthly":2000,"taxable":false}]',removeOk:false,removeAsk:true} },
];
