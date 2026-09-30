/* v21.26 (Eyal): loyalty savings booked as an employer payable on the cut-off ending the 25th; the HR card is the source */
module.exports=[
{ name:'💰 Loyalty payable: card says ₱10,000/month → 11–25 of the current month books statutory.loyaltyER 10,000 (never deducted, net unchanged), 26 Sep–10 Oct books nothing; Government Remittances for the month shows the BDO card at ₱10,000; the Loyalty screen links the member to the card and takes its amount (v21.26)',
  seed:function(){
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'E1',name:'PAGTAMA, JINKY SORNE',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:30000,dailyRate:1363.64,dateHired:'2025-01-01',hireDate:'2025-01-01',loyaltyMonthly:10000},
      {id:'E2',name:'GACO, REA JANE',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dailyRate:727.27,dateHired:'2025-01-01',hireDate:'2025-01-01'}]));
    localStorage.setItem('hydroPro_attendance',JSON.stringify({}));
  },
  run:async()=>{
    await sleep(6000);try{loadEmployees();}catch(e){}
    const E=JSON.parse(localStorage.getItem('hydroPro_employees'));
    const cur=HNXLOY.calc().cur,ps=cur+'-11',pe=cur+'-25';
    const a=calcEmployeePayroll(E[0],ps,pe,'semi'),b=calcEmployeePayroll(E[0],'2026-09-26','2026-10-10','semi'),c=calcEmployeePayroll(E[1],ps,pe,'semi');
    const E0=Object.assign({},E[0]);delete E0.loyaltyMonthly;const a0=calcEmployeePayroll(E0,ps,pe,'semi');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_'+ps+'_'+pe,periodStart:ps,periodEnd:pe,status:'approved',lines:[a,c]}]));
    hnxGovRemit(cur);await sleep(600);const ov=(document.getElementById('hnxGovRemitOverlay')||{}).innerText||'';try{document.getElementById('hnxGovRemitOverlay').remove();}catch(e){}
    const C=HNXLOY.calc();const j=C.members.find(m=>m.m.empId==='E1');
    switchView('acct_loyalty');await sleep(800);const txt=document.getElementById('view-acct_loyalty').innerText;
    return {loy:+(a.statutory&&a.statutory.loyaltyER)||0,later:+(b.statutory&&b.statutory.loyaltyER)||0,other:+(c.statutory&&c.statutory.loyaltyER)||0,netSame:Math.abs(a.netPay-a0.netPay)<0.01,
      govCard:/Loyalty savings/.test(ov)&&/10,000\.00/.test(ov),linked:!!j,amt:j?+j.m.monthly:0,panel:/Employer payable/.test(txt)&&/booked in the APPROVED run: ₱10,000/.test(txt)};},
  expect:{loy:10000,later:0,other:0,netSame:true,govCard:true,linked:true,amt:10000,panel:true} },
];
