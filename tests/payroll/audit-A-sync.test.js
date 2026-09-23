/* audit batch A-sync: cloud-sync merges that silently undid payroll decisions.
   ot-holiday-01                           - holiday % / dates / overrides reverted by the pull merge
   runs-snapshots-tombstone-kills-approved - a Recalculate tombstone deleted an APPROVED run everywhere
   The pull merge is window.__hnxMergeGeneric(key, localRaw, remoteRaw): it returns the merged text,
   or null for "keep the local copy". Two PCs are simulated by merging their two copies both ways. */
module.exports=[
{ name:'holiday % corrected 200 → 100 on one PC stays 100 after a sync either way: office ₱16,000/month working 31 Aug 2026 gets holidayPay ₱727.27, not ₱1,454.55 (audit A-sync ot-holiday-01)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));
    localStorage.setItem('hydroPro_pay_holiday_policy_v1',JSON.stringify({regular:{unworked:100,worked:200}}));},
  run:async()=>{const PK='hydroPro_pay_holiday_policy_v1',G=window.__hnxMergeGeneric;window.confirm=()=>true;
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);setA({'2026-08-31':{ANN:rec('present','07:00','17:00')}});
    const pay=()=>calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly').holidayPay;
    const jinky=localStorage.getItem(PK);                /* the other PC: the wrong 200, saved before this fix (no stamp) */
    const wrongPay=pay();
    hnxHolidays();await sleep(300);_hnxHolPol('regular','worked','100');   /* Eyal corrects it on this PC */
    const eyal=localStorage.getItem(PK);
    const pick=(local,remote)=>{const m=G(PK,local,remote);return JSON.parse(m==null?local:m);};
    const onJinky=pick(jinky,eyal),onEyal=pick(eyal,jinky);
    /* the other PC after its pull, and then the pull on this PC of what that PC pushes back */
    localStorage.setItem(PK,JSON.stringify(onJinky));const jinkyPay=pay();
    const back=pick(eyal,JSON.stringify(onJinky));
    /* ↺ Government defaults is a dated snapshot too: the other PC's 200 cannot re-fill it */
    _hnxHolPolReset();const reset=localStorage.getItem(PK);const afterReset=pick(reset,jinky);
    localStorage.setItem(PK,JSON.stringify(afterReset));const resetPay=pay();
    const ov=document.getElementById('hnxHolidayOverlay');if(ov)ov.remove();
    return {wrongPay,onJinky:onJinky.regular.worked,onEyal:onEyal.regular.worked,back:back.regular.worked,jinkyPay,
            resetHasNoRegular:!afterReset.regular,resetPay};},
  expect:{wrongPay:1454.55,onJinky:100,onEyal:100,back:100,jinkyPay:727.27,resetHasNoRegular:true,resetPay:727.27} },

{ name:'holiday dates: a removed bogus regular holiday (labourer ₱500/day unworked = ₱500 free) stays removed, a cleared +%wk override (200 → type default: office ₱1,454.55 → ₱727.27) stays cleared, special → regular sticks, and a fresh PC\'s seeded calendar never wipes a user-added date (audit A-sync ot-holiday-01)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({
      '2026-08-21':{name:'Ninoy Aquino Day',kind:'special'},
      '2026-08-31':{name:'National Heroes Day',kind:'regular',workedPct:200},
      '2026-09-14':{name:'Bogus holiday',kind:'regular'}}));},
  run:async()=>{const K='hydroPro_ph_holidays',G=window.__hnxMergeGeneric;window.confirm=()=>true;
    const other=localStorage.getItem(K);                  /* the other PC still holds the old calendar */
    hnxHolidays();await sleep(300);
    _hnxHolPct('2026-08-31','workedPct','');             /* clear the override: back to the type default */
    _hnxHolDel('2026-09-14');                             /* remove the bogus date */
    document.getElementById('holD').value='2026-08-21';document.getElementById('holN').value='Ninoy Aquino Day';document.getElementById('holK').value='regular';
    _hnxHolAdd();                                         /* re-add 21 Aug as REGULAR over the special one */
    const ov=document.getElementById('hnxHolidayOverlay');if(ov)ov.remove();
    const mine=localStorage.getItem(K);
    const pick=(local,remote)=>{const m=G(K,local,remote);return JSON.parse(m==null?local:m);};
    const onOther=pick(other,mine),onMine=pick(mine,other);
    const tomb=!!((JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}').hydroPro_ph_holidays||{})['2026-09-14']);
    /* money on the other PC, before and after its pull */
    const ann=office('ANN','ANN',{monthlyBasic:16000});const lab=labour('L5','LABOURER',{dailyRate:500});setE([ann,lab]);
    const a={};['2026-08-31'].forEach(d=>{a[d]={ANN:rec('present','07:00','17:00')};});
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-15','2026-09-16'].forEach(d=>{a[d]=Object.assign(a[d]||{},{L5:rec('present','07:00','17:00')});});setA(a);
    const money=store=>{localStorage.setItem(K,JSON.stringify(store));
      return {office:calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly').holidayPay,labour:calcEmployeePayroll(lab,'2026-09-10','2026-09-16','weekly').holidayPay};};
    const before=money(JSON.parse(other)),after=money(onOther);
    /* a fresh PC: only the rule-seeded calendar (no stamps) against the cloud copy holding a user-added date */
    const seeded=JSON.stringify(window.hnxPhHolidayRules(2026));
    const cloud=JSON.stringify(Object.assign(JSON.parse(seeded),{'2026-10-15':{name:'Company day',kind:'special',updatedAt:Date.now()}}));
    const fresh=pick(seeded,cloud);
    return {tomb,
      otherHas14:!!onOther['2026-09-14'],mineHas14:!!onMine['2026-09-14'],
      otherPct31:onOther['2026-08-31'].workedPct===undefined?'cleared':onOther['2026-08-31'].workedPct,
      minePct31:onMine['2026-08-31'].workedPct===undefined?'cleared':onMine['2026-08-31'].workedPct,
      otherKind21:onOther['2026-08-21'].kind,mineKind21:onMine['2026-08-21'].kind,
      beforeOffice:before.office,beforeLabour:before.labour,afterOffice:after.office,afterLabour:after.labour,
      freshKeeps1015:!!fresh['2026-10-15']};},
  expect:{tomb:true,otherHas14:false,mineHas14:false,otherPct31:'cleared',minePct31:'cleared',otherKind21:'regular',mineKind21:'regular',
          beforeOffice:1454.55,beforeLabour:500,afterOffice:727.27,afterLabour:0,freshKeeps1015:true} },

{ name:'an APPROVED run (net ₱182,400) hit by a Recalculate tombstone from a PC that had not synced stays APPROVED on both PCs, approvedBy kept; a tombstone still removes a DRAFT (audit A-sync runs-snapshots-tombstone-kills-approved)',
  run:async()=>{const K='hydroPro_payroll_runs',G=window.__hnxMergeGeneric;
    const id='ops_2026-09-10_2026-09-16',T1=Date.now()-60000;
    const approved={id,type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'approved',approvedAt:T1,approvedBy:'Eyal',updatedAt:T1,createdAt:T1-5000,lines:[{empId:'L1',netPay:182400}],totals:{netPay:182400}};
    const draftB={id,type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'draft',updatedAt:T1+20000,createdAt:T1+20000,lines:[{empId:'L1',netPay:182400}],totals:{netPay:182400}};
    const ghost={id:'office_2026-09-10_2026-09-24',type:'semi_monthly',periodStart:'2026-09-10',periodEnd:'2026-09-24',status:'draft',updatedAt:T1,lines:[],totals:{netPay:0}};
    /* the tombstone the old Recalculate wrote on PC-B at T1+10 s (back-dated 1 ms), and one for a ghost DRAFT */
    localStorage.setItem('hydroPro_optomb',JSON.stringify({hydroPro_payroll_runs:{[id]:T1+9999,[ghost.id]:T1+5}}));
    const pick=(local,remote)=>{const m=G(K,JSON.stringify(local),JSON.stringify(remote));return m==null?local:JSON.parse(m);};
    const onB=pick([draftB],[approved]),onA=pick([approved],[draftB]);
    const f=L0=>{const r=L0.find(x=>x.id===id)||{};return {n:L0.filter(x=>x.id===id).length,status:r.status,by:r.approvedBy,net:(r.totals||{}).netPay};};
    const ghostLeft=pick([ghost,approved],[approved]).some(x=>x.id===ghost.id);
    return {onB:f(onB),onA:f(onA),ghostLeft};},
  expect:{'onB.n':1,'onB.status':'approved','onB.by':'Eyal','onB.net':182400,'onA.n':1,'onA.status':'approved','onA.by':'Eyal','onA.net':182400,ghostLeft:false} },

{ name:'🔄 Recalculate writes no tombstone and still reprices the weekly draft: 5 → 6 days at ₱658 = ₱3,290 → ₱3,948, createdAt kept (audit A-sync runs-snapshots-tombstone-kills-approved)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'L1',name:'SANTOS, JO',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'}]));
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15'].forEach(d=>{a[d]={L1:{status:'present',timeIn:'07:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'}};});
    localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{window.confirm=()=>true;const id='ops_2026-09-10_2026-09-16';
    const run=()=>(JSON.parse(localStorage.getItem('hydroPro_payroll_runs')||'[]')||[]).find(x=>x.id===id)||{};
    window._payOpsCurrentPeriod={start:'2026-09-10',end:'2026-09-16',payday:'2026-09-18',label:'w'};renderPayrollOps();await sleep(800);
    const r0=run();const basic0=r0.lines&&r0.lines[0].basicPay,created0=r0.createdAt;
    const a=JSON.parse(localStorage.getItem('hydroPro_attendance'));a['2026-09-16']={L1:rec('present','07:00','17:00')};setA(a);
    payOpsRecalc();await sleep(800);
    const r1=run();const tomb=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');
    return {basic0,basic1:r1.lines&&r1.lines[0].basicPay,status:r1.status,createdKept:r1.createdAt===created0,
            tomb:!!((tomb.hydroPro_payroll_runs||{})[id])};},
  expect:{basic0:3290,basic1:3948,status:'draft',createdKept:true,tomb:false} },

{ name:'office: a ₱1,500 transportation allowance and an SSS override of ₱500 reach the STORED draft at once (allowanceTotal 1,500, sss 500) with no tombstone, so Approve can never lock the old figures (audit A-sync runs-snapshots-tombstone-kills-approved)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'ANN',name:'ANN',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',dailyRate:700,monthlyBasic:16000,dateHired:'2025-01-01',hireDate:'2025-01-01'}]));
    localStorage.setItem('hydroPro_attendance',JSON.stringify({'2026-09-01':{ANN:{status:'present',timeIn:'08:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'}}}));},
  run:async()=>{window.confirm=()=>true;
    window._payOfficeCurrentPeriod=getSemiMonthPeriod('2026-09-01');renderPayrollOffice();await sleep(800);
    const id=payOfficeRunId(window._payOfficeCurrentPeriod);
    const line=()=>(((JSON.parse(localStorage.getItem('hydroPro_payroll_runs')||'[]')||[]).find(x=>x.id===id)||{}).lines||[]).find(l=>l.empId==='ANN')||{};
    payOfficeManageAllowancesDialog('ANN');await sleep(200);
    document.getElementById('newAllowCat').value='transportation';document.getElementById('newAllowAmount').value='1500';
    _payAllowEntryAdd('ANN');await sleep(400);
    const allow=line().allowanceTotal;
    const ov=document.getElementById('payAllowOverlay');if(ov)ov.remove();
    payOfficeEditGovDed(id,'ANN','sss','500');await sleep(400);
    const tomb=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');
    return {allow,sss:line().sss,tomb:!!((tomb.hydroPro_payroll_runs||{})[id])};},
  expect:{allow:1500,sss:500,tomb:false} },
];
