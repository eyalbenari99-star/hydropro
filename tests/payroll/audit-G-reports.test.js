/* Audit batch G-reports: office render re-derivation (taxBase / netShortfall / special payroll),
   carried office allowances, BIR filings, remittance reports, payslip display, Rates screen,
   weekly gov refresher. Every case names the numbers it expects. */
module.exports=[
{ name:'office render: ₱16,000/month + ₱5,000 taxable House Rental (26 Aug–10 Sep) → gross 13,000.00, gov 700.00, tax 282.45 on taxBase 12,300.00 (was left at 7,300), net 12,017.55 (allowances-08)',
  seed:()=>{localStorage.setItem('hydroPro_pay_filter_v1',JSON.stringify({mode:'active',att:'all'}));}, /* the payroll screen's 'only with attendance' filter would hide a person with no record */
  run:async()=>{const bob=office('BOB','BOB OFFICE',{monthlyBasic:16000});setE([bob]);setA({});try{loadEmployees();}catch(e){}
    setEmpAllowancesForPeriod('office_2026-08-26_2026-09-10','BOB',[{id:'HR1',catId:'house_rental',amount:5000,note:'test'}]);
    switchView('payroll_office');await sleep(3000);
    window._payOfficeCurrentPeriod={start:'2026-08-26',end:'2026-09-10',half:2,label:'26 Aug – 10 Sep'};renderPayrollOffice();await sleep(800);
    const l=(getPayrollRun('office_2026-08-26_2026-09-10').lines||[]).find(x=>x.empId==='BOB')||{};
    return {grossPay:l.grossPay,gross:l.grossEarnings,gov:l.totalGovDed,tax:l.withholdingTax,taxBase:l.taxBase,net:l.netPay,short:l.netShortfall};},
  expect:{grossPay:13000,gross:13000,gov:700,tax:282.45,taxBase:12300,net:12017.55,short:0} },
{ name:'office render: absent the whole cut-off (basic 0, gov 700) + a TYPED ₱1,000 transport → net 300.00 and shortfall 0.00 (was a stale 700 "still owed") (allowances-09)',
  seed:()=>{localStorage.setItem('hydroPro_pay_filter_v1',JSON.stringify({mode:'active',att:'all'}));}, /* the payroll screen's 'only with attendance' filter would hide a person with no record */
  run:async()=>{const z=office('ZED','ZED OFFICE',{monthlyBasic:16000});setE([z]);try{loadEmployees();}catch(e){}
    const a={};for(let d=new Date('2026-07-26T00:00:00');d<=new Date('2026-08-10T00:00:00');d.setDate(d.getDate()+1)){const w=d.getDay();if(w>=1&&w<=5)a[ymd(d)]={ZED:{status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'manual',editedBy:'jinky',reason:'absent'}};}setA(a);
    const eng=calcEmployeePayroll(z,'2026-07-26','2026-08-10','semi_monthly');
    setEmpAllowancesForPeriod('office_2026-07-26_2026-08-10','ZED',[{id:'TR1',catId:'transportation',amount:1000,note:'typed'}]);
    switchView('payroll_office');await sleep(3000);
    window._payOfficeCurrentPeriod={start:'2026-07-26',end:'2026-08-10',half:2,label:'26 Jul – 10 Aug'};renderPayrollOffice();await sleep(800);
    const l=(getPayrollRun('office_2026-07-26_2026-08-10').lines||[]).find(x=>x.empId==='ZED')||{};
    return {engBasic:eng.basicPay,engShort:eng.netShortfall,gross:l.grossEarnings,gov:l.totalGovDed,net:l.netPay,short:l.netShortfall,allow:l.allowanceTotal};},
  expect:{engBasic:0,engShort:700,gross:1000,gov:700,net:300,short:0,allow:1000} },
{ name:'office carried ₱1,000 transport is prorated like the HR card: absent 11 of 11 days pays 0.00, absent 5 of 11 pays 545.45 (6/11); same id on every device; an entry deleted in the next cut-off is NOT carried again (allowances-03)',
  seed:()=>{localStorage.setItem('hydroPro_pay_filter_v1',JSON.stringify({mode:'active',att:'all'}));}, /* the payroll screen's 'only with attendance' filter would hide a person with no record */
  run:async()=>{const A=office('AAA','AAA OFFICE',{monthlyBasic:16000}),B=office('BBB','BBB OFFICE',{monthlyBasic:16000});setE([A,B]);try{loadEmployees();}catch(e){}
    localStorage.setItem('hydroPro_employee_allowances_v1',JSON.stringify({'office_2026-07-11_2026-07-25':{AAA:[{id:'SA',catId:'transportation',amount:1000,note:''}],BBB:[{id:'SB',catId:'transportation',amount:1000,note:''}]}}));
    const wd=[];for(let d=new Date('2026-07-26T00:00:00');d<=new Date('2026-08-10T00:00:00');d.setDate(d.getDate()+1)){const w=d.getDay();if(w>=1&&w<=5)wd.push(ymd(d));}
    const abs={status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'manual',editedBy:'jinky',reason:'absent'};
    const a={};wd.forEach((d,i)=>{a[d]={AAA:abs};if(i<5)a[d].BBB=abs;});setA(a);
    switchView('payroll_office');await sleep(3000);
    window._payOfficeCurrentPeriod={start:'2026-07-26',end:'2026-08-10',half:2,label:'26 Jul – 10 Aug'};renderPayrollOffice();await sleep(800);
    const r1=getPayrollRun('office_2026-07-26_2026-08-10');const la=r1.lines.find(x=>x.empId==='AAA'),lb=r1.lines.find(x=>x.empId==='BBB');
    const carried=(loadEmployeeAllowances()['office_2026-07-26_2026-08-10']||{});
    /* delete every entry in 26 Jul – 10 Aug, then open 11 – 25 Aug */
    setEmpAllowancesForPeriod('office_2026-07-26_2026-08-10','AAA',[]);setEmpAllowancesForPeriod('office_2026-07-26_2026-08-10','BBB',[]);
    window._payOfficeCurrentPeriod={start:'2026-08-11',end:'2026-08-25',half:1,label:'11 – 25 Aug'};renderPayrollOffice();await sleep(800);
    const r2=getPayrollRun('office_2026-08-11_2026-08-25');const lb2=r2.lines.find(x=>x.empId==='BBB');
    return {wd:wd.length,aAllow:la.allowanceTotal,aNet:la.netPay,bPortion:Math.round(lb.allowPortion*11),bAllow:lb.allowanceTotal,bCarriedFull:lb.allowanceCarriedFull,
      bId:((carried.BBB||[])[0]||{}).id,next:loadEmployeeAllowances()['office_2026-08-11_2026-08-25']||null,b2Allow:lb2.allowanceTotal};},
  expect:{wd:11,aAllow:0,aNet:0,bPortion:6,bAllow:545.45,bCarriedFull:1000,bId:'AL_office_2026-07-26_2026-08-10_BBB_transportation_0',next:null,b2Allow:0} },
{ name:'⭐ special payroll (annual ₱300,000 fixed, gov-exempt): a ₱500 1-Time Incentive keeps tax 312.50 (was 6,062.45), a remembered gov override stays 0.00, net 40,187.50; referral strip keeps 312.50 too (rates-master-other-13)',
  seed:()=>{localStorage.setItem('hydroPro_pay_filter_v1',JSON.stringify({mode:'active',att:'all'}));localStorage.setItem('hydroPro_pay_special_v1',JSON.stringify({SPC:{annualBasic:300000,govExempt:true}}));
    localStorage.setItem('hydroPro_office_gov_overrides',JSON.stringify({SPC:{sss:900,phic:500,hdmf:100}}));},
  run:async()=>{const s=office('SPC','SPECIAL EXEC',{monthlyBasic:80000});setE([s]);setA({});try{loadEmployees();}catch(e){}
    setEmpAllowancesForPeriod('office_2026-07-26_2026-08-10','SPC',[{id:'IN1',catId:'one_time_incentive',amount:500,note:'incentive'}]);
    switchView('payroll_office');await sleep(3000);
    window._payOfficeCurrentPeriod={start:'2026-07-26',end:'2026-08-10',half:2,label:'26 Jul – 10 Aug'};renderPayrollOffice();await sleep(800);
    const l=(getPayrollRun('office_2026-07-26_2026-08-10').lines||[]).find(x=>x.empId==='SPC')||{};
    localStorage.setItem('hydroPro_hr_payroll_bonuses',JSON.stringify([{id:'RB1',employeeId:'SPC',type:'referral',amount:2000,paidInPayroll:true,payrollRunId:'office_other'}]));
    const run={id:'office_x',type:'semi_monthly',totals:{},lines:[{empId:'SPC',employmentType:'Regular',specialTax:312.5,grossPay:42500,grossEarnings:42500,sss:0,phic:0,hdmf:0,totalGovDed:0,withholdingTax:312.5,referralBonus:2000,referralList:[{id:'RB1',amt:2000}],netPay:42187.5}]};
    /* the ledger loader lives in another script's scope, so the re-verify cannot see it on this build;
       provide it for the duration of the call to exercise the line re-derivation itself */
    const _hadL=window._loadPayrollBonuses;window._loadPayrollBonuses=()=>JSON.parse(localStorage.getItem('hydroPro_hr_payroll_bonuses')||'[]');
    _reverifyReferralBonusesForRun(run);const rl=run.lines[0];window._loadPayrollBonuses=_hadL;
    return {gov:[l.sss,l.phic,l.hdmf],tax:l.withholdingTax,gross:l.grossEarnings,net:l.netPay,refTax:rl.withholdingTax,refGross:rl.grossPay,refBase:rl.taxBase,refNet:rl.netPay};},
  expect:{gov:[0,0,0],tax:312.5,gross:40500,net:40187.5,refTax:312.5,refGross:40500,refBase:40500,refNet:40187.5} },
{ name:'weekly gov refresher uses the engine\'s rate: rateOverride ₱600 over a stale ₱450, week 10–16 Sep keeps gov 275.34 (it rewrote it to 221.20 every minute); a gov-exempt special stays 0.00 (runs-snapshots-govrefresh-raw-rate)',
  seed:()=>{localStorage.setItem('hydroPro_pay_special_v1',JSON.stringify({LX:{govExempt:true}}));},
  run:async()=>{const L1=labour('LR','RATE OVERRIDE',{rateOverride:600,dailyRate:450}),LX=labour('LX','GOV EXEMPT',{dailyRate:610});setE([L1,LX]);setA({});try{loadEmployees();}catch(e){}
    const e1=calcEmployeePayroll(L1,'2026-09-10','2026-09-16','weekly'),ex=calcEmployeePayroll(LX,'2026-09-10','2026-09-16','weekly');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'draft',lines:[e1,ex],totals:{}}]));
    const n=window.hnxGovRefresh();const st=getPayrollRun('ops_2026-09-10_2026-09-16').lines;
    const g=l=>Math.round(((l.sss||0)+(l.phic||0)+(l.hdmf||0))*100)/100;
    return {engine:g(e1),fixed:n,stored:g(st[0]),exempt:g(st[1]),net:st[0].netPay,short:st[0].netShortfall};},
  expect:{engine:275.34,fixed:0,stored:275.34,exempt:0,net:0,short:275.34} },
{ name:'BIR alphalist / 2316: approved gross 9,500 with ₱1,000 HR + ₱500 period de minimis files non-taxable 1,500.00 and taxable 7,300.00 (was 8,800); a stale-taxBase ₱5,000 House Rental line files 12,300.00; the DRAFT run is left out; alphalist taxable 19,600.00 = 1601-C (allowances-07, drafts-in-filings)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E1',name:'ONE, EMP',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,tin:'123456789',dateHired:'2025-01-01'},{id:'E2',name:'TWO, EMP',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,tin:'223456789',dateHired:'2025-01-01'}]));},
  run:async()=>{
    const L1={empId:'E1',name:'ONE, EMP',employmentType:'Regular',grossPay:8000,grossEarnings:9500,allowanceNonTaxAmt:1000,recurringAllowance:1000,allowanceNonTaxable:500,allowanceTaxable:0,allowanceTotal:500,sss:400,phic:200,hdmf:100,totalGovDed:700,taxBase:7300,withholdingTax:0,netPay:8800};
    const L2={empId:'E2',name:'TWO, EMP',employmentType:'Regular',grossPay:13000,grossEarnings:13000,allowanceNonTaxAmt:0,allowanceTaxable:5000,allowanceNonTaxable:0,allowanceTotal:5000,sss:400,phic:200,hdmf:100,totalGovDed:700,taxBase:7300,withholdingTax:282.45,netPay:12017.55};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_2026-08-11_2026-08-25',type:'semi_monthly',periodStart:'2026-08-11',periodEnd:'2026-08-25',status:'approved',approvedAt:1,lines:[L1,L2],totals:{}},
      {id:'office_2026-08-26_2026-09-10',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'draft',lines:[L1],totals:{}}]));
    const texts=[];const _c=URL.createObjectURL;URL.createObjectURL=()=>'blob:x';const _B=window.Blob;window.Blob=function(parts,o){texts.push(parts.join(''));return new _B(parts,o);};
    hnxBirExport('alphalist',2026);hnxBirExport('f2316',2026);hnxBirExport('register',2026);
    window.Blob=_B;URL.createObjectURL=_c;
    const csv=t=>t.replace(/^﻿/,'').split('\n').map(r=>r.split('","').map(c=>c.replace(/^"|"$/g,'')));
    const al=csv(texts[0]),f2=csv(texts[1]),rg=csv(texts[2]);const H=al[0],c=n=>H.indexOf(n);
    const e1=al.find(r=>r[c('Employee ID')]==='E1'),e2=al.find(r=>r[c('Employee ID')]==='E2');
    const F=f2[0],fe1=f2.find(r=>r[0]==='E1');
    let tA=0;al.slice(1).forEach(r=>{tA+=+r[c('Taxable Compensation')]||0;});
    const M=window.__hnxACC.payroll1601(2026);let t1601=0;for(let i=1;i<=12;i++)t1601+=(M&&M[i]&&M[i].taxable)||0;
    hnxBirPreviewFull(2026);await sleep(300);
    const tr=[...document.querySelectorAll('#hnxAlphaFull tr')].find(t=>/ONE, EMP/.test(t.textContent||''));const tds=tr?[...tr.querySelectorAll('td')].map(t=>(t.textContent||'').trim()):[];
    document.getElementById('hnxAlphaFull')&&document.getElementById('hnxAlphaFull').remove();
    return {e1:{gross:e1[c('Gross Compensation')],nonTax:e1[c('Non-Taxable (de minimis)')],taxable:e1[c('Taxable Compensation')]},e2taxable:e2[c('Taxable Compensation')],
      f2316:{gross:fe1[F.indexOf('Gross Compensation')],taxable:fe1[F.indexOf('Taxable Compensation')]},
      totalTaxable:Math.round(tA*100)/100,t1601:Math.round(t1601*100)/100,regDraftRows:rg.filter(r=>/^DRAFT/.test(r[3]||'')).length,regRows:rg.length-1,
      full:{gross:tds[3],nonTax:tds[4],taxable:tds[5]}};},
  expect:{'e1.gross':'9500.00','e1.nonTax':'1500.00','e1.taxable':'7300.00',e2taxable:'12300.00','f2316.gross':'9500.00','f2316.taxable':'7300.00',
    totalTaxable:19600,t1601:19600,regDraftRows:1,regRows:3,'full.gross':'9,500.00','full.nonTax':'1,500.00','full.taxable':'7,300.00'} },
{ name:'remittances: office 26 Aug–10 Sep (approved, SSS EE 400.00) belongs to SEPTEMBER in the pack, Government Remittances and Gov Monthly; a weekly DRAFT (SSS 151.67) is in none — Sep SSS EE 400.00 everywhere, August has no approved run, and the pack names the run that moved month (deductions-loans-05)',
  run:async()=>{
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_2026-08-26_2026-09-10',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'approved',approvedAt:1,totals:{},
        lines:[{empId:'O1',name:'OFFICE, ANN',sss:400,phic:200,hdmf:100,totalGovDed:700,withholdingTax:0,grossPay:8000,grossEarnings:8000,netPay:7300,statutory:{sssER:800,phicER:200,hdmfER:100,msc:16000}}]},
      {id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'draft',totals:{},
        lines:[{empId:'L1',name:'LABOUR, JO',sss:151.67,phic:77,hdmf:46.67,totalGovDed:275.34,withholdingTax:0,grossPay:0,grossEarnings:0,netPay:0,statutory:{sssER:303.33,phicER:77,hdmfER:46.67,msc:13000}}]}]));
    const toasts=[];const _st=window.showToast;window.showToast=m=>{toasts.push(String(m));};
    let html='';const _o=window.open;window.open=()=>({document:{write:h=>{html+=h;},close:()=>{}},print:()=>{}});
    hnxRemitPack('2026-09');const sep=html;html='';hnxRemitPack('2026-08');const aug=html;
    window.open=_o;
    const texts=[];const _c=URL.createObjectURL;URL.createObjectURL=()=>'blob:x';const _B=window.Blob;window.Blob=function(parts,o){texts.push(parts.join(''));return new _B(parts,o);};
    hnxGovRemitExport('sss','2026-09');window.Blob=_B;URL.createObjectURL=_c;
    const rows=texts[0].replace(/^﻿/,'').split('\n').map(r=>r.split('","').map(c=>c.replace(/^"|"$/g,'')));const tot=rows.find(r=>/TOTAL TO REMIT TO SSS/.test(r[0]))||[];
    hnxGovMonthly('2026-09');await sleep(300);
    const sssRow=[...document.querySelectorAll('#hnxGovTbl tr')].find(t=>/^SSS/.test((t.textContent||'').trim()));const cells=sssRow?[...sssRow.querySelectorAll('td')].map(t=>(t.textContent||'').trim()):[];
    document.getElementById('hnxGovM')&&document.getElementById('hnxGovM').remove();
    window.showToast=_st;
    const packTot=(sep.match(/TOTAL — pay these<\/td><td>([^<]*)<\/td>/)||[])[1]||'';
    return {packSepSssEE:packTot,changeNote:/Month rule changed/.test(sep)&&/2026-08-26 → 2026-09-10/.test(sep),packAug:aug===''&&toasts.some(t=>/No APPROVED payroll runs in 2026-08/.test(t)),remitSssEE:tot[3],govMonthly:{labor:cells[1],office:cells[2]}};},
  expect:{packSepSssEE:'₱400.00',changeNote:true,packAug:true,remitSssEE:'400',govMonthly:{labor:'₱0.00',office:'₱400.00'}} },
{ name:'payslip: basic 8,000 + ₱1,000 de minimis are listed ABOVE gross 9,000 (no "added after tax" row), deductions 700, net 8,300; a ₱1,000 + Allowance entry shows in the line breakdown and the rows add up to Gross 10,000 (allowances-11)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'P1',name:'SLIP, ONE',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'},{id:'P2',name:'SLIP, TWO',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'}]));
    const base={employmentType:'Regular',dailyRate:727.27,daysWorked:11,paidDays:11,sundaysWorked:0,sundayPremium:0,holidayPay:0,basicPay:8000,memoAdd:0,memoDed:0,referralBonus:0,tardyDeduction:0,allowanceTaxAmt:0,allowanceNonTaxAmt:1000,recurringAllowance:1000,recurringAllowanceTaxable:false,grossPay:8000,sss:400,phic:200,hdmf:100,totalGovDed:700,withholdingTax:0};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-08-11_2026-08-25',type:'semi_monthly',periodStart:'2026-08-11',periodEnd:'2026-08-25',status:'approved',approvedAt:1,totals:{},lines:[
      Object.assign({},base,{empId:'P1',name:'SLIP, ONE',grossEarnings:9000,netPay:8300}),
      Object.assign({},base,{empId:'P2',name:'SLIP, TWO',grossEarnings:10000,netPay:9300,allowanceNonTaxable:1000,allowanceTaxable:0,allowanceTotal:1000,allowanceEntries:[{id:'T1',catId:'transportation',amount:1000}]})]}]));},
  run:async()=>{const rid='office_2026-08-11_2026-08-25';window._payOfficeCurrentPeriod={start:'2026-08-11',end:'2026-08-25',half:1,label:'11 – 25 Aug'};
    const amt=s=>{const m=String(s).replace(/,/g,'').match(/([+−-])?₱([0-9.]+)/);return m?(m[1]==='−'||m[1]==='-'?-1:1)*(+m[2]):0;};
    const slip=id=>{payShowPayslip(rid,id);const trs=[...document.querySelectorAll('#payslipBody table')][1].querySelectorAll('tr');const rows=[...trs].map(t=>[...t.querySelectorAll('td')].map(x=>(x.textContent||'').trim())).filter(r=>r.length===2);
      const gi=rows.findIndex(r=>r[0]==='GROSS PAY');const di=rows.findIndex(r=>/de minimis/.test(r[0]));let sum=0;rows.slice(0,gi).forEach(r=>{sum+=amt(r[1]);});
      const txt=document.getElementById('payslipBody').textContent||'';document.getElementById('payslipModal').classList.remove('open');
      return {deMinAboveGross:di>=0&&di<gi,sumAbove:Math.round(sum*100)/100,gross:amt(rows[gi][1]),afterTax:/added after tax/.test(txt)};};
    const s1=slip('P1'),s2=slip('P2');
    openPayrollLine(rid,'P2','semi_monthly');const body=document.getElementById('payrollLineBody');
    const row=[...body.querySelectorAll('.pay-breakdown-row')].find(r=>/Allowances this cut-off/.test(r.textContent||''));
    document.getElementById('payrollLineModal').classList.remove('open');
    return {s1,s2,lineRow:row?(row.querySelector('.pay-breakdown-value').textContent||'').trim():'missing'};},
  expect:{'s1.deMinAboveGross':true,'s1.sumAbove':9000,'s1.gross':9000,'s1.afterTax':false,'s2.deMinAboveGross':true,'s2.sumAbove':10000,'s2.gross':10000,lineRow:'+₱1,000.00'} },
{ name:'Rates & Tax screen shows the by-law shares payroll uses (₱610/day → ₱1,210.50 a month, ₱282.45 a 7/30 week) instead of the unused flat ₱312.50 table, and Edit Rates changes nothing (deductions-loans-09)',
  run:async()=>{switchView('payroll_rates');await sleep(800);renderPayrollRates();await sleep(200);
    const t=(document.getElementById('payrollRatesBody').textContent||'').replace(/\s+/g,' ');
    const before=localStorage.getItem('hydroPro_payroll_rates');const _p=window.prompt;window.prompt=()=>'200';
    const toasts=[];const _st=window.showToast;window.showToast=m=>{toasts.push(String(m));};
    payRatesEdit();window.prompt=_p;window.showToast=_st;
    return {byLaw:/computed BY LAW/.test(t),month:/1,210\.50/.test(t),week:/282\.45/.test(t),flatGone:!/Total Weekly Deduction/.test(t),editBtn:/Edit Rates/.test(t),
      unchanged:localStorage.getItem('hydroPro_payroll_rates')===before,told:toasts.some(m=>/Nothing changed/.test(m))};},
  expect:{byLaw:true,month:true,week:true,flatGone:true,editBtn:false,unchanged:true,told:true} },
/* ---- round 2 (reviewer follow-ups) ---- */
{ name:'weekly gov refresher re-derives an OLD stored draft (no specialTax field, gov 0): ⭐ annual ₱600,000 at ₱3,000/day, 6 days 10–16 Sep → gov 840.00, tax stays 1,201.92 (was re-bracketed to 2,414.95), net 15,958.08; Regular ₱2,000/day → gross 12,000.00, gov 711.67, tax 1,151.87, net 10,136.46; run totals tax 2,353.79, net 26,094.54 (G r2)',
  seed:()=>{localStorage.setItem('hydroPro_pay_special_v1',JSON.stringify({SX:{annualBasic:600000}}));},
  run:async()=>{const S=labour('SX','SPECIAL WEEKLY',{dailyRate:3000}),R=labour('RG','REGULAR WEEKLY',{dailyRate:2000});setE([S,R]);
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={SX:rec('present','07:00','17:00','manual'),RG:rec('present','07:00','17:00','manual')};});setA(a);
    try{loadEmployees();}catch(e){}
    const e1=calcEmployeePayroll(S,'2026-09-10','2026-09-16','weekly'),e2=calcEmployeePayroll(R,'2026-09-10','2026-09-16','weekly');
    /* a line as a build before 'specialTax' travelled with the line stored it, with the old (zero) gov */
    const old=l=>{const x=JSON.parse(JSON.stringify(l));delete x.specialTax;delete x.govExempt;x.sss=0;x.phic=0;x.hdmf=0;x.totalGovDed=0;x.taxBase=x.grossPay;x.netPay=Math.round((x.grossEarnings-x.withholdingTax)*100)/100;x.netShortfall=0;return x;};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'draft',lines:[old(e1),old(e2)],totals:{sss:0,phic:0,hdmf:0,totalGovDed:0,withholdingTax:0,netPay:0}}]));
    const n=window.hnxGovRefresh();const run=getPayrollRun('ops_2026-09-10_2026-09-16');const s1=run.lines[0],s2=run.lines[1];
    const pick=l=>({gov:l.totalGovDed,tax:l.withholdingTax,taxBase:l.taxBase,net:l.netPay,short:l.netShortfall});
    return {fixed:n,engine:{sx:pick(e1),rg:Object.assign(pick(e2),{gross:e2.grossPay})},stored:{sx:pick(s1),rg:Object.assign(pick(s2),{gross:s2.grossPay})},
      totals:{tax:run.totals.withholdingTax,net:run.totals.netPay,gov:run.totals.totalGovDed}};},
  expect:{fixed:2,'engine.sx':{gov:840,tax:1201.92,taxBase:17160,net:15958.08,short:0},'stored.sx':{gov:840,tax:1201.92,taxBase:17160,net:15958.08,short:0},
    'engine.rg':{gov:711.67,tax:1151.87,taxBase:11288.33,net:10136.46,short:0,gross:12000},'stored.rg':{gov:711.67,tax:1151.87,taxBase:11288.33,net:10136.46,short:0,gross:12000},
    totals:{tax:2353.79,net:26094.54,gov:1551.67}} },
{ name:'month-rule note: the change-over is stamped when this build LOADS (not at the first pack open) — a 26 Aug–10 Sep run approved under this build is NOT flagged "leave it out" (it was), one first approved before and re-approved now IS; QB journal Sep carries SSS payable (EE+ER) 1,200.00 for the moved office run, Aug has no approved run (G r2, deductions-loans-05)',
  run:async()=>{
    const stampedAtLoad=+(localStorage.getItem('hnx_pay_endmonth_since')||0)>0;
    const now=Date.now();
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_2026-08-26_2026-09-10',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'approved',approvedAt:now-5000,totals:{},
        lines:[{empId:'O1',name:'OFFICE, ANN',sss:400,phic:200,hdmf:100,totalGovDed:700,withholdingTax:0,grossPay:8000,grossEarnings:8000,netPay:7300,statutory:{sssER:800,phicER:200,hdmfER:100,msc:16000}}]},
      {id:'ops_2026-08-27_2026-09-02',type:'weekly',periodStart:'2026-08-27',periodEnd:'2026-09-02',status:'approved',approvedAt:now-5000,
        approvalHistory:[{approvedAt:1,approvedBy:'old',reopenedAt:2,reopenedBy:'x',reason:'reopened'}],totals:{},
        lines:[{empId:'L1',name:'LABOUR, JO',sss:151.67,phic:77,hdmf:46.67,totalGovDed:275.34,withholdingTax:0,grossPay:3948,grossEarnings:3948,netPay:3672.66,statutory:{sssER:303.33,phicER:77,hdmfER:46.67,msc:13000}}]}]));
    const toasts=[];const _st=window.showToast;window.showToast=m=>{toasts.push(String(m));};
    let html='';const _o=window.open;window.open=()=>({document:{write:h=>{html+=h;},close:()=>{}},print:()=>{}});
    hnxRemitPack('2026-09');const pack=html;window.open=_o;
    const je=window._hnxPayJeHtml('2026-09');const jeAug=window._hnxPayJeHtml('2026-08');
    window.showToast=_st;
    const note=s=>{const m=s.match(/Month rule changed:[\s\S]*?<\/div>/);return m?m[0]:'';};
    const tr=[...new DOMParser().parseFromString('<table>'+je+'</table>','text/html').querySelectorAll('tr')].map(t=>[...t.querySelectorAll('td')].map(x=>(x.textContent||'').trim()));
    const sssAnn=(tr.find(r=>r[0]==='OFFICE, ANN'&&/^SSS payable/.test(r[1]||''))||[])[3]||'';
    return {stampedAtLoad,pack:{freshFlagged:/2026-08-26 → 2026-09-10/.test(note(pack)),reapprovedFlagged:/2026-08-27 → 2026-09-02/.test(note(pack))},
      je:{freshFlagged:/2026-08-26 → 2026-09-10/.test(note(je)),reapprovedFlagged:/2026-08-27 → 2026-09-02/.test(note(je)),sssAnn},
      jeAug:jeAug===''&&toasts.some(t=>/No APPROVED payroll runs in 2026-08/.test(t))};},
  expect:{stampedAtLoad:true,pack:{freshFlagged:false,reapprovedFlagged:true},je:{freshFlagged:false,reapprovedFlagged:true,sssAnn:'₱1,200.00'},jeAug:true} },
{ name:'month-rule note on a device first opened AFTER the change (stamp 1 Jan 2027): capped at the 1 Oct 2026 cut-over, so a 26 Nov–10 Dec 2026 run approved 1 Dec 2026 is NOT flagged (it was, forever); a run approved 1 Sep 2026 still is (G r2)',
  seed:()=>{localStorage.setItem('hnx_pay_endmonth_since',String(Date.parse('2027-01-01T00:00:00+08:00')));},
  run:async()=>{
    const ln={empId:'O1',name:'OFFICE, ANN',sss:400,phic:200,hdmf:100,totalGovDed:700,withholdingTax:0,grossPay:8000,grossEarnings:8000,netPay:7300,statutory:{sssER:800,phicER:200,hdmfER:100,msc:16000}};
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_2026-11-26_2026-12-10',type:'semi_monthly',periodStart:'2026-11-26',periodEnd:'2026-12-10',status:'approved',approvedAt:Date.parse('2026-12-01T10:00:00+08:00'),totals:{},lines:[ln]},
      {id:'office_2026-08-26_2026-09-10',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'approved',approvedAt:Date.parse('2026-09-01T10:00:00+08:00'),totals:{},lines:[ln]}]));
    const note=s=>{const m=s.match(/Month rule changed:[\s\S]*?<\/div>/);return m?m[0]:'';};
    return {dec:/2026-11-26 → 2026-12-10/.test(note(window._hnxPayJeHtml('2026-12'))),sep:/2026-08-26 → 2026-09-10/.test(note(window._hnxPayJeHtml('2026-09')))};},
  expect:{dec:false,sep:true} },
{ name:'Accounting → Reports → BIR Alphalist (live): ₱1,000 HR + ₱500 period de minimis shows Non-taxable 1,500.00 (was 500.00) and a Taxable column 7,300.00; stale-taxBase House Rental 12,300.00; total taxable 19,600.00 = BIR Center = 1601-C; the draft is left out (G r2, allowances-07)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E1',name:'ONE, EMP',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,tin:'123456789',dateHired:'2025-01-01'},{id:'E2',name:'TWO, EMP',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,tin:'223456789',dateHired:'2025-01-01'}]));},
  run:async()=>{
    const L1={empId:'E1',name:'ONE, EMP',employmentType:'Regular',grossPay:8000,grossEarnings:9500,allowanceNonTaxAmt:1000,recurringAllowance:1000,allowanceNonTaxable:500,allowanceTaxable:0,allowanceTotal:500,sss:400,phic:200,hdmf:100,totalGovDed:700,taxBase:7300,withholdingTax:0,netPay:8800};
    const L2={empId:'E2',name:'TWO, EMP',employmentType:'Regular',grossPay:13000,grossEarnings:13000,allowanceNonTaxAmt:0,allowanceTaxable:5000,allowanceNonTaxable:0,allowanceTotal:5000,sss:400,phic:200,hdmf:100,totalGovDed:700,taxBase:7300,withholdingTax:282.45,netPay:12017.55};
    const Y=new Date().getFullYear(); /* the live table shows the statement year (this year) */
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_'+Y+'-08-11_'+Y+'-08-25',type:'semi_monthly',periodStart:Y+'-08-11',periodEnd:Y+'-08-25',status:'approved',approvedAt:1,lines:[L1,L2],totals:{}},
      {id:'office_'+Y+'-08-26_'+Y+'-09-10',type:'semi_monthly',periodStart:Y+'-08-26',periodEnd:Y+'-09-10',status:'draft',lines:[L1],totals:{}}]));
    window.__hnxACC.open();await sleep(500);window.__hnxACC.navLeaf('reports','rep','alpha');await sleep(800);
    const tbl=[...document.querySelectorAll('#hnxaccOverlay table')].find(t=>/Non-taxable/.test((t.querySelector('thead')||t).textContent||''));
    const H=tbl?[...tbl.querySelectorAll('thead th')].map(x=>x.textContent.trim()):[];
    const rows=tbl?[...tbl.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(x=>x.textContent.trim())):[];
    window.__hnxACC.close();
    const c=n=>H.indexOf(n),r=nm=>rows.find(x=>x[0]===nm)||[],tot=rows.find(x=>/^TOTAL/.test(x[0]))||[];
    const M=window.__hnxACC.payroll1601(Y);let t1601=0;for(let i=1;i<=12;i++)t1601+=(M&&M[i]&&M[i].taxable)||0;
    return {e1:{gross:r('ONE, EMP')[c('Gross comp')],nonTax:r('ONE, EMP')[c('Non-taxable')],taxable:c('Taxable')<0?'no column':r('ONE, EMP')[c('Taxable')]},
      e2taxable:c('Taxable')<0?'no column':r('TWO, EMP')[c('Taxable')],totalTaxable:c('Taxable')<0?'no column':tot[c('Taxable')],t1601:'₱'+t1601.toLocaleString('en-PH',{minimumFractionDigits:2})};},
  expect:{e1:{gross:'₱9,500.00',nonTax:'₱1,500.00',taxable:'₱7,300.00'},e2taxable:'₱12,300.00',totalTaxable:'₱19,600.00',t1601:'₱19,600.00'} },
{ name:'Contributions per employee (approved runs): office 26 Aug–10 Sep SSS EE 400.00 / ER+EC 830.00 counts, the weekly DRAFT (SSS 151.67) does not — and is now NAMED on screen and on the sheet ("⏳ 1 draft run … ops_2026-09-10_2026-09-16"), sheet header says APPROVED (was "approved/saved") (G r2, deductions-loans-05)',
  run:async()=>{
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'O1',name:'OFFICE, ANN',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000},{id:'L1',name:'LABOUR, JO',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:500}]));
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_2026-08-26_2026-09-10',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'approved',approvedAt:1,totals:{},
        lines:[{empId:'O1',name:'OFFICE, ANN',sss:400,phic:200,hdmf:100,totalGovDed:700,withholdingTax:0,grossPay:8000,grossEarnings:8000,netPay:7300,statutory:{sssER:800,phicER:200,hdmfER:100,msc:16000}}]},
      {id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'draft',totals:{},
        lines:[{empId:'L1',name:'LABOUR, JO',sss:151.67,phic:77,hdmf:46.67,totalGovDed:275.34,withholdingTax:0,grossPay:0,grossEarnings:0,netPay:0,statutory:{sssER:303.33,phicER:77,hdmfER:46.67,msc:13000}}]}]));
    hnxGovYtd();await sleep(300);
    const set=(id,v)=>{const el=document.getElementById(id);el.value=v;el.onchange&&el.onchange();};
    set('gyFrom','2026-08-01');set('gyTo','2026-09-30');set('gySrc','runs');await sleep(200);
    const body=document.getElementById('gyBody');const txt=(body.textContent||'').replace(/\s+/g,' ');
    const rows=[...body.querySelectorAll('tr')].map(t=>[...t.querySelectorAll('td')].map(x=>(x.textContent||'').trim()));
    const ann=rows.find(r=>r[0]==='OFFICE, ANN')||[];const jo=rows.find(r=>r[0]==='LABOUR, JO');
    const texts=[];const _c=URL.createObjectURL;URL.createObjectURL=()=>'blob:x';const _B=window.Blob;window.Blob=function(parts,o){texts.push(parts.join(''));return new _B(parts,o);};
    const _st=window.showToast;window.showToast=()=>{};
    try{window.hnxGovYtdExport('2026-08-01','2026-09-30',null,'runs');}finally{window.Blob=_B;URL.createObjectURL=_c;window.showToast=_st;}
    document.getElementById('hnxGovYtdOverlay')&&document.getElementById('hnxGovYtdOverlay').remove();
    const sheet=(texts[0]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    return {annSss:ann[1]||'',joListed:!!jo,screenNamesDraft:/⏳ 1 draft run .*not included.*ops_2026-09-10_2026-09-16/.test(txt),
      sheetNamesDraft:/⏳ 1 draft run .*not included.*ops_2026-09-10_2026-09-16/.test(sheet),sheetApproved:/from APPROVED payroll runs/.test(sheet),sheetOld:/approved\/saved/.test(sheet)};},
  expect:{annSss:'400.00 / 830.00',joListed:false,screenNamesDraft:true,sheetNamesDraft:true,sheetApproved:true,sheetOld:false} },
{ name:'allowance display: a CARRIED ₱1,000 transport at 6 of 11 paid days — the + Allowance dialog Total reads 545.45 (was 1,000.00, the run pays 545.45), the Doctor column says "pays ₱545.45"; an entry DELETED in this cut-off is no longer told "carries it in automatically"; a gov override typed on a ⭐ gov-exempt special is refused (was stored with "✓ SSS updated" and ignored) (G r2)',
  seed:()=>{localStorage.setItem('hydroPro_pay_filter_v1',JSON.stringify({mode:'active',att:'all'}));localStorage.setItem('hydroPro_pay_special_v1',JSON.stringify({SPC:{annualBasic:300000,govExempt:true}}));},
  run:async()=>{const B=office('BBB','BBB OFFICE',{monthlyBasic:16000}),C=office('CCC','CCC OFFICE',{monthlyBasic:16000}),S=office('SPC','SPECIAL EXEC',{monthlyBasic:80000});setE([B,C,S]);try{loadEmployees();}catch(e){}
    localStorage.setItem('hydroPro_employee_allowances_v1',JSON.stringify({'office_2026-07-11_2026-07-25':{BBB:[{id:'SB',catId:'transportation',amount:1000,note:''}],CCC:[{id:'SC',catId:'transportation',amount:1000,note:''}]}}));
    const wd=[];for(let d=new Date('2026-07-26T00:00:00');d<=new Date('2026-08-10T00:00:00');d.setDate(d.getDate()+1)){const w=d.getDay();if(w>=1&&w<=5)wd.push(ymd(d));}
    const abs={status:'absent',timeIn:'',timeOut:'',lateMinutes:0,source:'manual',editedBy:'jinky',reason:'absent'};
    const a={};wd.forEach((d,i)=>{if(i<5)a[d]={BBB:abs};});setA(a);
    const pk='office_2026-07-26_2026-08-10';
    switchView('payroll_office');await sleep(3000);
    window._payOfficeCurrentPeriod={start:'2026-07-26',end:'2026-08-10',half:2,label:'26 Jul – 10 Aug'};renderPayrollOffice();await sleep(800);
    setEmpAllowancesForPeriod(pk,'CCC',[]);renderPayrollOffice();await sleep(800);
    const lb=getPayrollRun(pk).lines.find(x=>x.empId==='BBB');
    payOfficeManageAllowancesDialog('BBB');const ov=document.getElementById('payAllowOverlay');
    const tiles=ov?[...ov.querySelectorAll('div')].filter(d=>/^(Total|Taxable|Non-taxable)$/i.test((d.textContent||'').trim())).map(d=>((d.nextElementSibling||{}).textContent||'').trim()):[];
    const rowNote=ov?((ov.querySelector('tbody')||{}).textContent||'').replace(/\s+/g,' '):'';ov&&ov.remove();
    hnxAllowDoctor();const doc=document.getElementById('hnxAllowDoc');
    const drow=nm=>{const tr=doc?[...doc.querySelectorAll('tr')].find(t=>(t.textContent||'').indexOf(nm)>=0):null;return tr?[...tr.querySelectorAll('td')].map(x=>(x.textContent||'').replace(/\s+/g,' ').trim()):[];};
    const b=drow('BBB OFFICE'),c=drow('CCC OFFICE');doc&&doc.remove();
    const toasts=[];const _st=window.showToast;window.showToast=m=>{toasts.push(String(m));};
    payOfficeEditGovDed(pk,'SPC','sss','900',0);window.showToast=_st;
    const ovr=JSON.parse(localStorage.getItem('hydroPro_office_gov_overrides')||'{}');
    return {runPays:lb.allowanceTotal,tiles,rowSaysPays:/pays ₱545\.45/.test(rowNote),docB:/pays ₱545\.45/.test(b[2]||''),
      docCOld:/carries it in automatically/.test(c[5]||''),docCNew:/NOT in this one/.test(c[5]||''),
      exempt:{stored:!!(ovr.SPC&&ovr.SPC.sss),refused:toasts.some(t=>/EXEMPT/.test(t)),saidUpdated:toasts.some(t=>/SSS updated/.test(t))}};},
  expect:{runPays:545.45,tiles:['₱545.45','₱0.00','₱545.45'],rowSaysPays:true,docB:true,docCOld:false,docCNew:true,exempt:{stored:false,refused:true,saidUpdated:false}} },
];
