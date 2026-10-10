/* v22.28 payroll audit open items (Nexi_Payroll_Audit_v22.xlsx, 9 Oct 2026) */
module.exports=[
{ name:'💼 PAY-075: an office employee on a ₱16,000 Monthly Basic with an old Daily Rate Override ₱900 → the override box is greyed out and says "Not used — pay comes from the Monthly Basic ₱16,000 ÷ 2 ÷ working days (the ₱900 here is ignored)"; a weekly labourer without a Monthly Basic keeps the box open (v22.28)',
  requires:"typeof window.hnxEwtFixedMigrate==='function'",
  run:async()=>{setE([office('O1','REYES, ANA',{monthlyBasic:16000,rateOverride:900}),labour('L1','CRUZ, JUAN')]);loadEmployees();
    openEmployeeModal('O1');await sleep(300);const b=document.getElementById('empRate');const n=document.getElementById('empRateNote');
    const o={disabled:b.disabled,note:n?n.textContent:''};
    openEmployeeModal('L1');await sleep(300);const b2=document.getElementById('empRate');const n2=document.getElementById('empRateNote');
    try{closeEmployeeModal&&closeEmployeeModal();}catch(e){}try{document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));}catch(e){}
    return {officeOff:o.disabled,officeNote:/Not used — pay comes from the Monthly Basic ₱16,000 ÷ 2 ÷ working days \(the ₱900 here is ignored\)/.test(o.note),labourOff:b2.disabled,labourNote:n2?n2.textContent:''};},
  expect:{officeOff:true,officeNote:true,labourOff:false,labourNote:''} },

{ name:'🧾 NEW-01: management EWT on the HR card — the one-time move writes ₱2,604.17 for Dr Amy (PATDU, MARGARITA AMY) and ₱4,270.83 for Eyal, nothing for "SANTOS, IRISH MAE" (not management by name) or a member who already has ₱1,000; the 26 Sep–10 Oct cut-off then withholds 2,604.17 / 4,270.83 / 1,000 company-paid (v22.28)',
  requires:"typeof window.hnxEwtFixedMigrate==='function'",
  run:async()=>{const M=(id,name,extra)=>office(id,name,Object.assign({salaryCategory:'11. Management',dept:'Management',employmentType:'Consultant',monthlyBasic:50000},extra||{}));
    setE([M('A','PATDU, MARGARITA AMY'),M('E','BEN ARI, EYAL'),M('I','SANTOS, IRISH MAE'),M('J','DELA CRUZ, JUAN',{ewtFixed:1000})]);loadEmployees();
    const n=window.hnxEwtFixedMigrate(true);const E=JSON.parse(localStorage.getItem('hydroPro_employees'));const f=id=>(E.find(e=>e.id===id)||{}).ewtFixed||null;
    loadEmployees();const tax=id=>calcEmployeePayroll(E.find(e=>e.id===id),'2026-09-26','2026-10-10','semi').withholdingTax;
    return {moved:n,amy:f('A'),eyal:f('E'),irish:f('I'),juan:f('J'),taxAmy:tax('A'),taxEyal:tax('E'),taxJuan:tax('J')};},
  expect:{moved:2,amy:2604.17,eyal:4270.83,irish:null,juan:1000,taxAmy:2604.17,taxEyal:4270.83,taxJuan:1000} },

{ name:'🕘 PAY-067: Juan hired 6 Oct — a late on 5 Oct (before the hire date) is not queued (1 counted as ignored), his enrolment day 7 Oct is not queued, the late of 8 Oct is (1 row); Mea (admin role) cannot decide lates, the System Admin can (v22.28)',
  requires:"window.hnxLate&&typeof window.hnxEwtFixedMigrate==='function'",
  run:async()=>{setE([labour('W1','CRUZ, JUAN',{dateHired:'2026-10-06',hireDate:'2026-10-06'})]);loadEmployees();
    setA({'2026-10-05':{W1:rec('late','08:00','17:00')},'2026-10-07':{W1:rec('present','07:00','17:00')},'2026-10-08':{W1:rec('late','08:00','17:00')}});
    try{const c=window.hnxLate.cfg();if(!c.on||c.minMinutes){window.hnxLate.setCfg(Object.assign({},c,{on:true,minMinutes:0}));}}catch(e){}
    const rows=window.hnxLate.scan('2026-10-05','2026-10-10').filter(r=>r.empId==='W1').map(r=>r.date);const ign=window.__hnxLateBeforeHire;
    const h=localStorage.getItem('hnx_test_harness');localStorage.removeItem('hnx_test_harness');const g=window.getCurrentUser;
    window.getCurrentUser=()=>({username:'mea',fullname:'Mea Magracia',role:'admin',active:true});const mea=window.hnxLate.canDecide();
    window.getCurrentUser=()=>({username:'admin',fullname:'System Admin',role:'admin',active:true});const adm=window.hnxLate.canDecide();
    window.getCurrentUser=g;if(h!=null)localStorage.setItem('hnx_test_harness',h);
    return {rows,ign,mea,adm};},
  expect:{rows:['2026-10-08'],ign:1,mea:false,adm:true} }
];
