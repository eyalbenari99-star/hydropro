/* audit batch A-sync: cloud-sync merges that silently undid payroll decisions.
   ot-holiday-01                           - holiday % / dates / overrides reverted by the pull merge
   runs-snapshots-tombstone-kills-approved - a Recalculate tombstone deleted an APPROVED run everywhere
   Round 2: every sync case goes through the REAL pull (window.HNX_Cloud.pull - the same pullAll the
   20-second auto-sync runs) with /sync/pull answered by a stub, so the cases cover the dirty-key skip,
   the "tombstones merge first" order and the first-pull path. HNX_Cloud.pull exists on builds from
   before the fix too, so there the cases fail on the bug amounts, not on a missing test hook.
   Two PCs are simulated in one page: localStorage is set to that PC's copy, a stubbed upload clears the
   "not yet uploaded" flags (as a completed push does), then one pull brings the other PC's copy. */
/* in-page helper, installed by the seed: window.__tCloud.pull(data, firstPull) / .push() */
const CLOUD=function(){
  window.__tCloud={
    async call(fn,data,first){
      const C=window.HNX_Cloud,f0=window.fetch;
      localStorage.setItem('hnx_cloud_token','test-token');
      C.state.online=true;C.state.syncing=false;C.state.error=null;
      window.__hnxPulledOk=!first;
      window.fetch=function(u,o){u=String(u);
        if(u.indexOf('/sync/pull')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({data:data||{}})});
        if(u.indexOf('/sync/push')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({ok:true})});
        return f0.apply(this,arguments);};
      try{await C[fn]();}finally{window.fetch=f0;localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=true;}
      return C.state.error||null;
    },
    pull(data,first){return this.call('pull',data,first);},
    push(){return this.call('push',{});}
  };
};
const withCloud=seed=>new Function('('+CLOUD.toString()+')();'+(seed?'('+seed.toString()+')();':''));
module.exports=[
{ name:'holiday % corrected 200 → 100 on one PC stays 100 through real pulls (before upload, after upload, on the other PC) and ↺ Government defaults is not re-filled by the other PC\'s 200: office ₱16,000/month working 31 Aug 2026 gets holidayPay ₱727.27, not ₱1,454.55 (audit A-sync ot-holiday-01)',
  seed:withCloud(()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));
    localStorage.setItem('hydroPro_pay_holiday_policy_v1',JSON.stringify({regular:{unworked:100,worked:200}}));}),
  run:async()=>{const PK='hydroPro_pay_holiday_policy_v1',C=window.__tCloud;window.confirm=()=>true;
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);setA({'2026-08-31':{ANN:rec('present','07:00','17:00')}});
    const pay=()=>calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly').holidayPay;
    const wk=()=>{const r=(JSON.parse(localStorage.getItem(PK)||'{}')||{}).regular;return r?r.worked:'default';};
    const close=()=>{const ov=document.getElementById('hnxHolidayOverlay');if(ov)ov.remove();};
    const jinky=localStorage.getItem(PK);                /* the other PC: the wrong 200, saved before this fix (no stamp) */
    const wrongPay=pay();
    hnxHolidays();await sleep(300);_hnxHolPol('regular','worked','100');close();   /* Eyal corrects it on this PC */
    const eyal=localStorage.getItem(PK);
    await C.pull({[PK]:jinky});const unsent=wk();         /* the other PC's copy arrives before this edit is uploaded */
    await C.push();await C.pull({[PK]:jinky});           /* uploaded; the other PC pushes its stale 200 again */
    const onEyal=wk(),eyalPay=pay();
    localStorage.setItem(PK,jinky);await C.push();       /* now be the other PC, holding the stale 200 */
    await C.pull({[PK]:eyal});const onJinky=wk(),jinkyPay=pay();
    localStorage.setItem(PK,eyal);await C.push();        /* back on this PC: ↺ Government defaults */
    hnxHolidays();await sleep(300);_hnxHolPolReset();close();
    await C.push();await C.pull({[PK]:jinky});const afterReset=wk(),resetPay=pay();
    return {wrongPay,unsent,onEyal,eyalPay,onJinky,jinkyPay,afterReset,resetPay};},
  expect:{wrongPay:1454.55,unsent:100,onEyal:100,eyalPay:727.27,onJinky:100,jinkyPay:727.27,afterReset:'default',resetPay:727.27} },

{ name:'holiday dates through real pulls: a removed bogus regular holiday (₱500/day labourer who did not work it: ₱500 → ₱0) stays removed even when its tombstone arrives in the same pull listed AFTER the calendar; a cleared +%wk override (office ₱1,454.55 → ₱727.27) stays cleared; special → regular sticks; a fresh PC\'s rule-seeded calendar takes the re-typed 21 Aug as REGULAR (labourer who did not work it: ₱0 → ₱500) (audit A-sync ot-holiday-01)',
  seed:withCloud(()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({
      '2026-08-21':{name:'Ninoy Aquino Day',kind:'special'},
      '2026-08-31':{name:'National Heroes Day',kind:'regular',workedPct:200},
      '2026-09-14':{name:'Bogus holiday',kind:'regular'}}));}),
  run:async()=>{const K='hydroPro_ph_holidays',T='hydroPro_optomb',C=window.__tCloud;window.confirm=()=>true;
    const other=localStorage.getItem(K),otherTomb=localStorage.getItem(T)||'{}';   /* the other PC still holds the old calendar */
    hnxHolidays();await sleep(300);
    _hnxHolPct('2026-08-31','workedPct','');             /* clear the override: back to the type default */
    _hnxHolDel('2026-09-14');                             /* remove the bogus date */
    document.getElementById('holD').value='2026-08-21';document.getElementById('holN').value='Ninoy Aquino Day';document.getElementById('holK').value='regular';
    _hnxHolAdd();                                         /* re-add 21 Aug as REGULAR over the special one */
    const ov=document.getElementById('hnxHolidayOverlay');if(ov)ov.remove();
    const mine=localStorage.getItem(K),mineTomb=localStorage.getItem(T)||'{}';
    const tomb=!!((JSON.parse(mineTomb).hydroPro_ph_holidays||{})['2026-09-14']);
    const snap=()=>{const h=JSON.parse(localStorage.getItem(K)||'{}')||{};const d31=h['2026-08-31']||{};
      return {has14:!!h['2026-09-14'],pct31:d31.workedPct===undefined?'cleared':d31.workedPct,kind21:(h['2026-08-21']||{}).kind};};
    const ann=office('ANN','ANN',{monthlyBasic:16000});const lab=labour('L5','LABOURER',{dailyRate:500});setE([ann,lab]);
    const a={'2026-08-31':{ANN:rec('present','07:00','17:00')}};
    ['2026-08-20','2026-08-22','2026-08-24','2026-08-25','2026-08-26','2026-09-10','2026-09-11','2026-09-12','2026-09-15','2026-09-16'].forEach(d=>{a[d]=Object.assign(a[d]||{},{L5:rec('present','07:00','17:00')});});setA(a);
    const money=()=>({office:calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly').holidayPay,
      labour:calcEmployeePayroll(lab,'2026-09-10','2026-09-16','weekly').holidayPay,
      labour21:calcEmployeePayroll(lab,'2026-08-20','2026-08-26','weekly').holidayPay});
    /* 1. this PC: uploaded, then the other PC's old calendar arrives */
    await C.push();await C.pull({[K]:other});const onMine=snap();
    /* 2. the other PC: old calendar, no tombstone. ONE pull brings this PC's calendar and, listed after it, the tombstone */
    localStorage.setItem(T,otherTomb);localStorage.setItem(K,other);await C.push();const before=money();
    await C.pull({[K]:mine,[T]:mineTomb});const onOther=snap(),after=money();
    /* 3. a fresh PC's FIRST pull: only the rule-seeded calendar (no stamps, no tombstones) against the cloud copy */
    localStorage.setItem(T,'{}');localStorage.setItem(K,JSON.stringify(window.hnxPhHolidayRules(2026)));
    const seededLabour21=money().labour21;
    await C.pull({[K]:mine,[T]:mineTomb},true);const onFresh=snap(),fresh=money();
    return {tomb,onMine,onOther,onFresh,beforeOffice:before.office,beforeLabour:before.labour,afterOffice:after.office,afterLabour:after.labour,
      seededLabour21,freshLabour21:fresh.labour21};},
  expect:{tomb:true,
          'onMine.has14':false,'onMine.pct31':'cleared','onMine.kind21':'regular',
          'onOther.has14':false,'onOther.pct31':'cleared','onOther.kind21':'regular',
          'onFresh.has14':false,'onFresh.pct31':'cleared','onFresh.kind21':'regular',
          beforeOffice:1454.55,beforeLabour:500,afterOffice:727.27,afterLabour:0,seededLabour21:0,freshLabour21:500} },

{ name:'an APPROVED run (net ₱182,400) hit through a real pull by a Recalculate tombstone from a PC that had not synced stays APPROVED on both PCs (1 copy, approvedBy kept); the same pull\'s tombstone still removes a ghost DRAFT (audit A-sync runs-snapshots-tombstone-kills-approved)',
  seed:withCloud(null),
  run:async()=>{const K='hydroPro_payroll_runs',T='hydroPro_optomb',C=window.__tCloud;
    const id='ops_2026-09-10_2026-09-16',T1=Date.now()-60000;
    const approved={id,type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'approved',approvedAt:T1,approvedBy:'Eyal',updatedAt:T1,createdAt:T1-5000,lines:[{empId:'L1',netPay:182400}],totals:{netPay:182400}};
    const draftB={id,type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'draft',updatedAt:T1+20000,createdAt:T1+20000,lines:[{empId:'L1',netPay:182400}],totals:{netPay:182400}};
    const ghost={id:'office_2026-09-10_2026-09-24',type:'semi_monthly',periodStart:'2026-09-10',periodEnd:'2026-09-24',status:'draft',updatedAt:T1,lines:[],totals:{netPay:0}};
    /* the tombstone the old Recalculate wrote on PC-B at T1+10 s (back-dated 1 ms), and one for a ghost DRAFT */
    const tombB=JSON.stringify({hydroPro_payroll_runs:{[id]:T1+9999,[ghost.id]:T1+5}});
    const f=()=>{const L0=JSON.parse(localStorage.getItem(K)||'[]')||[];const r=L0.find(x=>x.id===id)||{};
      return {n:L0.filter(x=>x.id===id).length,status:r.status,by:r.approvedBy,net:(r.totals||{}).netPay,ghost:L0.some(x=>x.id===ghost.id)};};
    /* PC-A holds the approved run (and a ghost draft); one pull brings PC-B's draft and PC-B's tombstones */
    localStorage.setItem(T,'{}');localStorage.setItem(K,JSON.stringify([approved,ghost]));await C.push();
    await C.pull({[K]:JSON.stringify([draftB]),[T]:tombB});const onA=f();
    /* PC-B holds its own draft and its own tombstone; one pull brings the approved run */
    localStorage.setItem(T,tombB);localStorage.setItem(K,JSON.stringify([draftB]));await C.push();
    await C.pull({[K]:JSON.stringify([approved])});const onB=f();
    return {onA,onB};},
  expect:{'onA.n':1,'onA.status':'approved','onA.by':'Eyal','onA.net':182400,'onA.ghost':false,
          'onB.n':1,'onB.status':'approved','onB.by':'Eyal','onB.net':182400} },

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

{ name:'holiday permissions: a payroll clerk (not admin / accounting) cannot ↺ reset the %, remove or add a holiday - the company regular +%wk 150 stays (office ₱16,000 working 31 Aug 2026 keeps ₱1,090.91, not the ₱727.27 default), the 14 Sep regular stays (₱500/day labourer who did not work it keeps ₱500), no tombstone, no added 5 Oct, and the screen draws no ↺ / ✕ / ➕; accounting can still reset (→ ₱727.27) (audit A-sync round 2)',
  seed:()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({
      '2026-08-31':{name:'National Heroes Day',kind:'regular'},
      '2026-09-14':{name:'Company foundation day',kind:'regular',updatedAt:Date.now()-5000}}));
    localStorage.setItem('hydroPro_pay_holiday_policy_v1',JSON.stringify({regular:{unworked:100,worked:150},_lww:true,updatedAt:Date.now()-5000}));},
  run:async()=>{const PK='hydroPro_pay_holiday_policy_v1',K='hydroPro_ph_holidays';window.confirm=()=>true;
    const ann=office('ANN','ANN',{monthlyBasic:16000});const lab=labour('L5','LABOURER',{dailyRate:500});setE([ann,lab]);
    const a={'2026-08-31':{ANN:rec('present','07:00','17:00')}};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-15','2026-09-16'].forEach(d=>{a[d]=Object.assign(a[d]||{},{L5:rec('present','07:00','17:00')});});setA(a);
    const money=()=>({office:calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly').holidayPay,labour:calcEmployeePayroll(lab,'2026-09-10','2026-09-16','weekly').holidayPay});
    const q=s=>document.querySelectorAll('#hnxHolidayOverlay '+s).length;
    hnxHolidays();await sleep(300);                      /* opened by the admin: the add row is on screen */
    const realU=window.getCurrentUser;
    window.getCurrentUser=()=>({username:'clerk',fullname:'Payroll Clerk',role:'hr',department:'HR'});
    let view,h,pol,tomb,clerk;
    try{
      document.getElementById('holD').value='2026-10-05';document.getElementById('holN').value='Extra day';document.getElementById('holK').value='regular';
      _hnxHolAdd();_hnxHolDel('2026-09-14');_hnxHolPolReset();
      view={reset:q('[onclick*="_hnxHolPolReset"]'),del:q('[onclick*="_hnxHolDel"]'),add:q('#holD'),readOnly:q('#hnxHolReadOnly'),pctOpen:q('input[onchange*="_hnxHolPct"]:not([disabled])')};
      h=JSON.parse(localStorage.getItem(K)||'{}')||{};pol=((JSON.parse(localStorage.getItem(PK)||'{}')||{}).regular||{}).worked;
      tomb=!!((JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}').hydroPro_ph_holidays||{})['2026-09-14']);
      clerk=money();
      window.getCurrentUser=()=>({username:'jinky',fullname:'Jinky',role:'accounting',department:'Accounting'});
      _hnxHolPolReset();
    }finally{window.getCurrentUser=realU;}
    const acct=money();const ov=document.getElementById('hnxHolidayOverlay');if(ov)ov.remove();
    return {view,has14:!!h['2026-09-14'],has1005:!!h['2026-10-05'],pol,tomb,clerkOffice:clerk.office,clerkLabour:clerk.labour,acctOffice:acct.office};},
  expect:{'view.reset':0,'view.del':0,'view.add':0,'view.readOnly':1,'view.pctOpen':0,has14:true,has1005:false,pol:150,tomb:false,
          clerkOffice:1090.91,clerkLabour:500,acctOffice:727.27} },
];
