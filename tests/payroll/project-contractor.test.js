/* v21.03: '19. GH15 & GH16 Project Contractor Labor' (salary category project_contractor) - weekly, NO benefits.
   Week Thu 10 – Wed 16 Sep 2026, ₱600/day, a ₱2,600/month allowance, Mon 14 Sep a regular holiday (not worked),
   worked 10, 11, Sat 12 (scanned) and 15, Wed 16 authorised leave. */
const SEED=()=>{localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-09-14':{name:'Test Holiday',kind:'regular'}}));};
module.exports=[
{ name:'👷 GH15/16 project contractor ₱600/day, 4 days worked + 1 leave + 1 unworked regular holiday + ₱2,600/mo allowance: basic ₱2,400.00, holiday ₱0, allowance ₱0, SSS/PhilHealth/Pag-IBIG ₱0 (EE and ER), net ₱2,400.00; the same person as Production Regular is paid more (v21.03)',
  seed:SEED,
  run:async()=>{
    const mk=(cat)=>{const e=labour('P1','PEDRO PROJECT',{salaryCategory:cat,employmentType:'Regular',dailyRate:600,contractorProject:'15',allowances:[{type:'rice',monthly:2600,taxable:false}]});setE([e]);
      const w=(x)=>rec(x,'07:00','16:00','fingerprint');
      setA({'2026-09-10':{P1:w('present')},'2026-09-11':{P1:w('present')},'2026-09-12':{P1:w('present')},'2026-09-15':{P1:w('present')},'2026-09-16':{P1:rec('authorized','','','manual',{editedBy:'jinky'})}});return e;};
    const reg=calcEmployeePayroll(mk('production_regular'),'2026-09-10','2026-09-16','weekly');
    const c=calcEmployeePayroll(mk('project_contractor'),'2026-09-10','2026-09-16','weekly');
    const er=c.statutory?(c.statutory.sssER+c.statutory.phicER+c.statutory.hdmfER):0;
    return {basic:c.basicPay,hol:c.holidayPay,allow:c.allowanceTaxAmt+c.allowanceNonTaxAmt,allowList:c.allowanceList.length,gov:c.totalGovDed,er,net:c.netPay,
      regMore:reg.netPay>c.netPay,regHasHol:reg.holidayPay>0,regHasAllow:(reg.allowanceNonTaxAmt||0)>0,gap:c.daysGap,proj:c.contrProject};},
  expect:{basic:2400,hol:0,allow:0,allowList:0,gov:0,er:0,net:2400,regMore:true,regHasHol:true,regHasAllow:true,gap:0,proj:'15'} },

{ name:'👷 GH15/16 project contractor + ₱500 contractor bonus dated 11 Sep: net ₱2,900.00 (₱2,400 + ₱500) — extras still pay (v21.03)',
  seed:SEED,
  run:async()=>{
    const mk=(cat)=>{const e=labour('P1','PEDRO PROJECT',{salaryCategory:cat,employmentType:'Regular',dailyRate:600,contractorProject:'15',allowances:[{type:'rice',monthly:2600,taxable:false}]});setE([e]);
      const w=(x)=>rec(x,'07:00','16:00','fingerprint');
      setA({'2026-09-10':{P1:w('present')},'2026-09-11':{P1:w('present')},'2026-09-12':{P1:w('present')},'2026-09-15':{P1:w('present')},'2026-09-16':{P1:rec('authorized','','','manual',{editedBy:'jinky'})}});return e;};
    const e=mk('project_contractor');
    localStorage.setItem('hydroPro_contr_adjust_v1',JSON.stringify([{id:'a1',empId:'P1',date:'2026-09-11',kind:'bonus',amount:500,reason:'step'}]));
    const c=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    return {bonus:c.contrBonus,net:c.netPay};},
  expect:{bonus:500,net:2900} },

{ name:'👷 GH15/16 project contractor: 13th month excluded, statutory ₱0 for any caller (weekly and semi-monthly), weekly group, listed as category 19, never flagged for HR↔payroll Align (v21.03)',
  run:async()=>{
    const e=labour('P2','ANA PROJECT',{salaryCategory:'project_contractor',employmentType:'Regular',dailyRate:600,dept:'CONTRACTUAL'});setE([e]);
    const w=statutoryForPeriod(e,'weekly','2026-09-16'),s=statutoryForPeriod(e,'semi_monthly','2026-09-25');
    const cat=(window.SAL_CATEGORIES||[]).find(x=>x[0]==='project_contractor');
    return {why:!!hnx13thExcludedWhy(e),st:[w.sss+w.phic+w.hdmf+w.sssER+w.phicER+w.hdmfER,s.sss+s.phic+s.hdmf+s.sssER+s.phicER+s.hdmfER],
      label:cat&&cat[1],office:SAL_CAT_OFFICE.indexOf('project_contractor')>=0};},
  expect:{why:true,st:[0,0],label:'19. GH15 & GH16 Project Contractor Labor',office:false} },

{ name:'💾 Jinky (accounting) moves a labourer with NO job title from Production Regular to 19. GH15 & GH16 Project Contractor Labor and presses Save → saved (was silently refused: "Job Title required") (v21.03)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Jinky',passwordHash:'x',role:'accounting',active:true}]));
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'L1',name:'LAB, JUAN',status:'Active',salaryCategory:'production_regular',dept:'APTI_REGULAR',payType:'weekly',employmentType:'Regular',type:'Regular',dailyRate:600,dateHired:'2025-01-01'}]));},
  run:async()=>{
    const cat=()=>JSON.parse(localStorage.getItem('hydroPro_employees')).find(e=>e.id==='L1').salaryCategory;
    openEmployeeModal('L1');await sleep(1500);
    const s=document.getElementById('empSalaryCategory');s.value='project_contractor';s.dispatchEvent(new Event('change',{bubbles:true}));
    saveEmployee();await sleep(1200);
    return {cat:cat(),open:document.getElementById('empModal').classList.contains('open')};},
  expect:{cat:'project_contractor',open:false} },

{ name:'🚪 closing a changed employee card asks Save / Don\'t save: ✕ + OK saves the new group; ✕ + Cancel leaves the card exactly as it was (production_regular) and closes it; an unchanged card closes with no question (v21.03)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Jinky',passwordHash:'x',role:'accounting',active:true}]));
    localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'L1',name:'LAB, JUAN',status:'Active',salaryCategory:'production_regular',dept:'APTI_REGULAR',payType:'weekly',employmentType:'Regular',type:'Regular',dailyRate:600,dateHired:'2025-01-01'},
      {id:'L2',name:'LAB, PEDRO',status:'Active',salaryCategory:'production_regular',dept:'APTI_REGULAR',payType:'weekly',employmentType:'Regular',type:'Regular',dailyRate:600,dateHired:'2025-01-01'}]));},
  run:async()=>{
    const cat=id=>JSON.parse(localStorage.getItem('hydroPro_employees')).find(e=>e.id===id).salaryCategory;
    const isOpen=()=>document.getElementById('empModal').classList.contains('open');
    let asked=0;
    const change=async(id,ans)=>{openEmployeeModal(id);await sleep(1500);
      const s=document.getElementById('empSalaryCategory');s.value='project_contractor';s.dispatchEvent(new Event('change',{bubbles:true}));s.dispatchEvent(new Event('input',{bubbles:true}));
      await sleep(2500);window.confirm=()=>{asked++;return ans;};
      document.querySelector('#empModal .modal-close').click();await sleep(1200);};
    await change('L1',true);const a=[cat('L1'),isOpen()];const aq=asked;
    await change('L2',false);const b=[cat('L2'),isOpen()];const bq=asked-aq;
    const before=asked;openEmployeeModal('L1');await sleep(1500);document.querySelector('#empModal .modal-close').click();await sleep(500);
    return {save:a,discard:b,askedSave:aq>=1,askedDiscard:bq,noChangeAsked:asked-before,noChangeOpen:isOpen()};},
  expect:{save:['project_contractor',false],discard:['production_regular',false],askedSave:true,askedDiscard:1,noChangeAsked:0,noChangeOpen:false} },
];
