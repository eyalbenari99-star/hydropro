/* Re-audit of the v20.99 audit fixes: locked-run drift, office final-pay contributions, legacy employer-share
   fallbacks, trip frozen pricing (engine, trip-log row, Trip doctor) and the new-asset QB package. */
const TRIP_SEED=()=>{localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'Dante',active:true}]));localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'H1',name:'Nico',active:true}]));};
module.exports=[
{ name:'🔒 office ₱16,000: 16 Sep booked as authorised leave in the approved 11–25 Sep run, later turned Present → paid days unchanged, drift carries ₱0.00 (was ₱727.27 paid twice); a manual absent turned Present still carries +1 × ₱727.27 = ₱727.27 (re-audit locked-inputs-01)',
  run:async()=>{
    const o=office('O1','ANN OFFICE',{monthlyBasic:16000,employmentType:'Probationary'});setE([o]);
    const mk=(st,l)=>({id:'office_2026-09-11_2026-09-25',type:'semi_monthly',status:'approved',periodStart:'2026-09-11',periodEnd:'2026-09-25',approvedAt:1,approvedBy:'eyal',totals:{},
      lines:[Object.assign({empId:'O1',name:'ANN OFFICE'},l)],attSig:{O1:'stale-'+st}});
    setA({'2026-09-16':{O1:rec('authorized','','','manual',{editedBy:'jinky'})}});
    const lA=calcEmployeePayroll(o,'2026-09-11','2026-09-25','semi_monthly');
    setA({'2026-09-16':{O1:rec('present','08:00','17:00','manual',{editedBy:'jinky'})}});
    const dA=hnxLockedDrift(mk('a',lA),true);
    setA({'2026-09-16':{O1:rec('absent','','','manual',{editedBy:'jinky'})}});
    const lB=calcEmployeePayroll(o,'2026-09-11','2026-09-25','semi_monthly');
    setA({'2026-09-16':{O1:rec('present','08:00','17:00','manual',{editedBy:'jinky'})}});
    const dB=hnxLockedDrift(mk('b',lB),true);
    return {leave:[lA.daysAbsentAuth,lA.basicPay],leaveRows:dA.rows.length,leaveUnpaid:dA.unpaid,absRows:dB.rows.map(x=>[x.dDays,x.remBasic]),absUnpaid:dB.unpaid};},
  expect:{leave:[1,7272.73],leaveRows:0,leaveUnpaid:0,absRows:[[1,727.27]],absUnpaid:727.27} },

{ name:'🔒 office ₱16,000: a wrong 240-minute late scan deducted ₱363.64 in the approved 11–25 Sep run; HR fixes the Time In after the lock → the drift lists ₱363.64 unpaid with 0 days changed and ➕ Carry books ₱363.64 once into 26 Sep–10 Oct (re-audit locked-inputs-02)',
  run:async()=>{
    const o=office('O1','ANN OFFICE',{monthlyBasic:16000,employmentType:'Probationary'});setE([o]);
    setA({});
    const l=calcEmployeePayroll(o,'2026-09-11','2026-09-25','semi_monthly');
    const line=Object.assign({empId:'O1',name:'ANN OFFICE'},l,{tardyDeduction:363.64});
    const RID='office_2026-09-11_2026-09-25';
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:RID,type:'semi_monthly',status:'approved',periodStart:'2026-09-11',periodEnd:'2026-09-25',approvedAt:1,approvedBy:'eyal',totals:{},lines:[line],attSig:{O1:'stale'}}]));
    localStorage.setItem('hydroPro_onetime_allow_v1','[]');
    const run=()=>JSON.parse(localStorage.getItem('hydroPro_payroll_runs')).find(x=>x.id===RID);
    const d=hnxLockedDrift(run(),true);
    window.confirm=()=>true;window.alert=()=>{};
    const n=hnxLockedDriftCarry(RID);
    const ots=JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1'));
    const d2=hnxLockedDrift(run(),true);const again=hnxLockedDriftCarry(RID);
    return {tardyNow:l.tardyDeduction,rows:d.rows.map(x=>[x.dDays,x.money,x.remAmount]),unpaid:d.unpaid,carried:n,items:ots.map(x=>[x.date,x.amount,x.taxable]),left:d2.unpaid,again};},
  expect:{tardyNow:0,rows:[[0,363.64,363.64]],unpaid:363.64,carried:1,items:[['2026-09-26',363.64,true]],left:0,again:0} },

{ name:'👋 office final pay ₱16,000 Regular, last approved cut-off ends 10 Sep, last day Sat 12 Sep: the 11–25 Sep window covers 2 of its 15 days → contributions ₱93.33 (2/15 of the ₱700.00 half-month), not ₱700.00 (re-audit finalpay-overlap-01)',
  run:async()=>{
    const ann=office('ANN','ANN',{monthlyBasic:16000,status:'Resigned',lastWorkingDay:'2026-09-12'});setE([ann]);setA({});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-08-26_2026-09-10',type:'semi_monthly',status:'approved',periodStart:'2026-08-26',periodEnd:'2026-09-10',lines:[{empId:'ANN',name:'ANN',basicPay:8000,employmentType:'Regular'}]}]));
    localStorage.setItem('hnxFinalPaySettled','[]');
    const r=hnxFinalPayCompute('ANN',{lastDay:'2026-09-12',unpaidFrom:'2026-09-11'});
    const full=statutoryForPeriod(ann,'semi_monthly','2026-09-12');
    const want=+((full.sss+full.phic+full.hdmf)*2/15).toFixed(2);
    return {gov:r.govDed,fullHalf:+(full.sss+full.phic+full.hdmf).toFixed(2),close:Math.abs(r.govDed-want)<=0.03};},
  expect:{gov:93.33,fullHalf:700,close:true} },

{ name:'🧾 EE/ER report, legacy line with no stored employer shares in a 3-day bridging week 14–16 Sep: the SSS employer share is ₱135.00 (3 days), not ₱315.00 (7 days) (re-audit finalpay-overlap-03)',
  run:async()=>{
    const e=labour('L1','JO SANTOS',{employmentType:'Regular',dailyRate:610});setE([e]);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-14_2026-09-16',type:'weekly',periodStart:'2026-09-14',periodEnd:'2026-09-16',status:'approved',totals:{},
      lines:[{empId:'L1',name:'JO SANTOS',dailyRate:610,daysWorked:3,sss:50,phic:20,hdmf:10}]}]));
    window._payOpsCurrentPeriod={start:'2026-09-14',end:'2026-09-16',payday:'2026-09-18',label:'14–16 Sep'};
    const s3=statutoryForPeriod(e,'weekly','2026-09-16','2026-09-14'),s7=statutoryForPeriod(e,'weekly','2026-09-16');
    hnxEeEr('ops');await sleep(300);
    const t=(document.getElementById('hnxEeEr')||{}).textContent||'';
    const fmt=v=>Number(v).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
    const m=document.getElementById('hnxEeEr');if(m)m.remove();
    return {er3:s3.sssER,er7:s7.sssER,shows3:t.indexOf(fmt(s3.sssER))>=0,shows7:t.indexOf(fmt(s7.sssER))>=0};},
  expect:{er3:135,er7:315,shows3:true,shows7:false} },

{ name:'🚚 an approved day priced driver ₱1,700 / helper ₱650 still pays ₱1,700 / ₱650 while the live rate table is EMPTY (was ₱0) (re-audit trips-engine-frozen-needs-live-table)',
  seed:()=>{localStorage.setItem('hydroPro_trip_rates_v1',JSON.stringify({draft:{areas:[]},live:{areas:[]},draftDirty:false,airportSeeded:true,specialSeeded:true}));},
  run:async()=>{
    const d=labour('D1','DRIVER ONE',{salaryCategory:'drivers'}),h=labour('H1','HELPER ONE',{salaryCategory:'helpers'});setE([d,h]);
    const r=JSON.parse(localStorage.getItem('hydroPro_trip_rates_v1'));r.live={areas:[]};localStorage.setItem('hydroPro_trip_rates_v1',JSON.stringify(r));
    localStorage.setItem('hydroPro_trip_log_v1',JSON.stringify([{id:'t1',date:'2026-09-11',driverId:'D1',helperId:'H1',truck:'V1',trips:['manila','manila'],status:'approved',pricedD:1700,pricedH:650,createdAt:1}]));
    return {pay:[calcEmployeePayroll(d,'2026-09-10','2026-09-16','weekly').tripIncentive,calcEmployeePayroll(h,'2026-09-10','2026-09-16','weekly').tripIncentive]};},
  expect:{pay:[1700,650]} },

{ name:'🩺 Trip doctor = payroll: approved Clark day frozen at driver ₱1,000 / helper ₱400 (table now ₱500 / ₱200): a stray PENDING record of the same driver and date keeps ₱1,000 / ₱400; a second APPROVED record for the helper on another truck makes the helper the live ₱200 while the driver stays ₱1,000 (re-audit trips-doctor-frozen-mismatch)',
  seed:TRIP_SEED,
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;a.special=false;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const A={id:'c7',date:today,driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400,createdAt:1};
    const P={id:'p1',date:today,driverId:'D1',helperId:'',truck:'V9',trips:['clark'],status:'pending',createdAt:2};
    localStorage.setItem(LK,JSON.stringify([A,P]));
    const v1=window.__hnxTripDoc.verdict(A);
    const B={id:'c9',date:today,driverId:'X9',helperId:'H1',truck:'V2',trips:['alabang','clark'],status:'approved',createdAt:3};
    localStorage.setItem(LK,JSON.stringify([A,B]));
    const v2=window.__hnxTripDoc.verdict(A);
    return {pending:[v1.A.d,v1.A.h],pendingWarn:v1.probs.some(p=>/SEPARATE records/.test(p)),helperDup:[v2.A.d,v2.A.h]};},
  expect:{pending:[1000,400],pendingWarn:false,helperDup:[1000,200]} },

{ name:'🚚 trip-log row: a day carried to the next pay week (payDate +7, frozen ₱1,000.00) beside an approved same-date record paid in its own week still shows the frozen ₱1,000.00 (table now ₱500.00), as payroll pays it (re-audit trips-row-alone-ignores-paydate)',
  seed:TRIP_SEED,
  run:async()=>{const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');
    r.draft.areas.forEach(a=>{if(a.id==='clark'){a.d2=250;a.h2=100;a.dbl=true;a.special=false;}});
    r.live=JSON.parse(JSON.stringify(r.draft));r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    const nx=new Date(today+'T00:00:00');nx.setDate(nx.getDate()+7);
    const A={id:'c7',date:today,payDate:ymd(nx),driverId:'D1',helperId:'H1',truck:'V1',trips:['alabang','clark'],status:'approved',pricedD:1000,pricedH:400,createdAt:1};
    const B={id:'c8',date:today,driverId:'D1',helperId:'',truck:'V2',trips:['clark'],status:'approved',pricedD:0,createdAt:2};
    localStorage.setItem(LK,JSON.stringify([A,B]));
    hnxTripTab('log');await sleep(800);
    const row=[...document.querySelectorAll('#view-pay_trips tr')].map(x=>x.innerText.replace(/\s+/g,' ')).find(x=>/V1/.test(x)&&/approved/.test(x))||'';
    const v=window.__hnxTripDoc.verdict(A);
    return {rowFrozen:/1,000\.00 table now 500\.00/.test(row),doctor:v.A.d};},
  expect:{rowFrozen:true,doctor:1000} },

{ name:'🏗 new-asset JE 1: "Recorded in Quickbook" = "No" is not an account — JE 1 records the purchase ₱45,000.00 against the paying account, never "Cr No"; a real account 1013-001-001 ADVANCES is still reclassified (re-audit assets-01)',
  seed:()=>{localStorage.removeItem('hydroPro_asset_recon_v1');},
  run:async()=>{
    window.hnxArImportLapsingRows([['MOTHER ACCOUNT','CATEGORY','DEPARTMENT','Equipment Per Lapsing','QUANTITY','ESTIMATED YEARS','Acquisition Date','END DATE','Recorded in Quickbook','VENDOR','COST','MONTHLY AMORTIZATION'],
      ['1025-003-002 Furniture & Fixtures - Office Machine and Equipment','Machinery and Equipment','Corporate','Printer No','1','5','2026-01-19','2031-01-19','No','Shop','45000','750'],
      ['1025-003-002 Furniture & Fixtures - Office Machine and Equipment','Machinery and Equipment','Corporate','Printer Adv','1','5','2026-01-19','2031-01-19','1013-001-001 ADVANCES','Shop','45000','750']]);
    const s=JSON.parse(localStorage.getItem('hydroPro_asset_recon_v1'));
    const a=s.newAssets.filter(n=>/Printer No/.test(n.desc))[0],b=s.newAssets.filter(n=>/Printer Adv/.test(n.desc))[0];
    const p=window.hnxArNewAssetPlan(a.ref,'2026-09-24'),q=window.hnxArNewAssetPlan(b.ref,'2026-09-24');
    return {noSrc:p.src,noLabel:/record the purchase/.test(p.je1.label),noCredit:p.je1.rows[1].acct==='No',noAmt:p.je1.rows[1].cr,advCredit:q.je1.rows[1].acct};},
  expect:{noSrc:'',noLabel:true,noCredit:false,noAmt:45000,advCredit:'1013-001-001 ADVANCES'} },

{ name:'🏗 new asset ₱60,000 · 5y with NO acquisition or depreciation start date: no "NaN-aN" anywhere, the recurring JE asks for the start date first (₱1,000.00 a month × 60) (re-audit assets-02)',
  seed:()=>{localStorage.removeItem('hydroPro_asset_recon_v1');},
  run:async()=>{
    window.hnxArImportLapsingRows([['MOTHER ACCOUNT','CATEGORY','DEPARTMENT','Equipment Per Lapsing','QUANTITY','ESTIMATED YEARS','Acquisition Date','END DATE','Recorded in Quickbook','VENDOR','COST','MONTHLY AMORTIZATION'],
      ['1025-003-002 Furniture & Fixtures - Office Machine and Equipment','Machinery and Equipment','Corporate','Undated Printer','1','5','','','','Shop','60000','1000']]);
    const s=JSON.parse(localStorage.getItem('hydroPro_asset_recon_v1'));
    const a=s.newAssets.filter(n=>/Undated/.test(n.desc))[0];
    if(a){a.acq='';a.depStart='';localStorage.setItem('hydroPro_asset_recon_v1',JSON.stringify(s));}
    const p=a?window.hnxArNewAssetPlan(a.ref,'2026-09-24'):null;
    const txt=p?JSON.stringify(p):'';
    return {found:!!a,nan:/NaN/.test(txt),ends:p&&p.ends,asks:!!(p&&p.rec&&/start date first/.test(p.rec.label)),mon:p&&p.mon};},
  expect:{found:true,nan:false,ends:'',asks:true,mon:1000} },

{ name:'🏗 numbering under the file mother 1025-003-002 gives the new asset 1025-003-002-007; once the live QB chart holds 1025-003-002-007 (another account) it skips it and gives 1025-003-002-008 (re-audit assets-03)',
  seed:()=>{localStorage.removeItem('hydroPro_asset_recon_v1');},
  run:async()=>{
    window.hnxQBSnapshot=function(){return null;};
    window.hnxArImportLapsingRows([['MOTHER ACCOUNT','CATEGORY','DEPARTMENT','Equipment Per Lapsing','QUANTITY','ESTIMATED YEARS','Acquisition Date','END DATE','Recorded in Quickbook','VENDOR','COST','MONTHLY AMORTIZATION'],
      ['1025-003-002 Furniture & Fixtures - Office Machine and Equipment','Machinery and Equipment','Corporate','Epson Printer','1','5','2026-01-19','2031-01-19','','Shop','22361.33','372.69']]);
    const s=JSON.parse(localStorage.getItem('hydroPro_asset_recon_v1'));
    const a=s.newAssets.filter(n=>/Epson/.test(n.desc))[0];
    const before=window.hnxArNewAssetPlan(a.ref,'2026-09-24').no;
    window.hnxQBSnapshot=function(){return {at:Date.now(),data:{accounts:[{acctNum:'1025-003-002-007',name:'Some other asset',fullName:'1025-003-002-007 Some other asset'}]}};};
    const after=window.hnxArNewAssetPlan(a.ref,'2026-09-24').no;
    return {before,after};},
  expect:{before:'1025-003-002-007',after:'1025-003-002-008'} },
];
