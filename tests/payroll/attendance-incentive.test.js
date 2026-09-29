/* v21.23 (Eyal, Jomel's ₱2,000): attendance incentive — paid whole in the cut-off that closes the month, only with no missing day */
const SEED=function(){
  localStorage.setItem('hydroPro_employees',JSON.stringify([
    {id:'J1',name:'JOMEL, TEST',status:'Active',salaryCategory:'accounting',dept:'Logistics',payType:'semi',employmentType:'Regular',monthlyBasic:22000,dailyRate:1000,dateHired:'2025-01-01',hireDate:'2025-01-01',
     allowances:[{type:'meal',monthly:2000,taxable:false},{type:'other',perfectMonth:2000,taxable:false}]}]));
  localStorage.setItem('hydroPro_attendance',JSON.stringify({}));
};
module.exports=[
{ name:'🎯 Office employee, Meal ₱2,000/month + attendance incentive ₱2,000: 16–31 Aug with no missing day pays 1,000 + 2,000 = ₱3,000 allowance (line says "paid in full"); 1–15 Aug pays ₱1,000 only (closes with the month); with one unauthorised absence on 3 Aug the closing cut-off pays ₱1,000 and names the missing day; the card preview shows the incentive as once a month (v21.23)',
  seed:SEED,
  run:async()=>{
    await sleep(6000);try{loadEmployees();}catch(e){}
    const E=JSON.parse(localStorage.getItem('hydroPro_employees'))[0];
    const a=calcEmployeePayroll(E,'2026-08-16','2026-08-31','semi');
    const inc=(a.allowanceList||[]).find(x=>x.incentive);
    const b=calcEmployeePayroll(E,'2026-08-01','2026-08-15','semi');const incB=(b.allowanceList||[]).find(x=>x.incentive);
    localStorage.setItem('hydroPro_attendance',JSON.stringify({'2026-08-03':{J1:{status:'absent',source:'manual',editedBy:'hr'}}}));
    const c=calcEmployeePayroll(E,'2026-08-16','2026-08-31','semi');const incC=(c.allowanceList||[]).find(x=>x.incentive);
    const pv=hnxAllowPreview(E,E.allowances);
    return {full:a.recurringAllowance,fullPaid:!!(inc&&inc.paid),fullNote:/no missing day/.test(inc&&inc.note||''),first:b.recurringAllowance,firstPending:!!(incB&&incB.pending),afterAbs:c.recurringAllowance,absNote:/1 missing day/.test(incC&&incC.note||''),noteTxt:(incC&&incC.note)||'',absPaid:!!(incC&&incC.paid),preview:pv.rows.some(r=>/ONCE a month/.test(r.text)),previewTotal:pv.total};},
  expect:{full:3000,fullPaid:true,fullNote:true,first:1000,firstPending:true,afterAbs:1000,absNote:true,absPaid:false,preview:true,previewTotal:1000} },

{ name:'🍚 Duplicate guard: a card with the same Meal ₱2,000/month row three times is warned about ("on this card 3 times") by the allowance check (v21.23)',
  seed:SEED,
  run:async()=>{
    await sleep(5000);const E=JSON.parse(localStorage.getItem('hydroPro_employees'))[0];
    const three=[{type:'meal',monthly:2000,taxable:false},{type:'meal',monthly:2000,taxable:false},{type:'meal',monthly:2000,taxable:false}];
    const oc=window.confirm;let asked='';window.confirm=function(m){asked=String(m);return true;};
    const ok=hnxAllowGuard(E,E.allowances,three);window.confirm=oc;
    const C=window.__hnxAllowGuardLast;
    return {warned:C.warn.some(w=>/3 times/.test(w)),asked:/3 times/.test(asked),ok};},
  expect:{warned:true,asked:true,ok:true} },
];

/* v21.24 (Jinky: “I didn't do anything po”): identical rows on a card are counted once */
module.exports.push(
{ name:'🍚 Duplicates collapse: Meal ₱2,000/month on the card THREE times + incentive ₱2,000 → 1–15 Aug pays ₱1,000 (not ₱3,000), 16–31 Aug pays 1,000 + 2,000 = ₱3,000; the HR card opens it as ONE Meal row (v21.24)',
  seed:function(){
    localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'J1',name:'JOMEL, TEST',status:'Active',salaryCategory:'accounting',dept:'Logistics',payType:'semi',employmentType:'Regular',monthlyBasic:22000,dailyRate:1000,dateHired:'2025-01-01',hireDate:'2025-01-01',
       allowances:[{type:'meal',monthly:2000,taxable:false},{type:'meal',monthly:2000,taxable:false},{type:'meal',monthly:2000,taxable:false},{type:'other',perfectMonth:2000,taxable:false}]}]));
    localStorage.setItem('hydroPro_attendance',JSON.stringify({}));
  },
  run:async()=>{
    await sleep(6000);try{loadEmployees();}catch(e){}
    const E=JSON.parse(localStorage.getItem('hydroPro_employees'))[0];
    const a=calcEmployeePayroll(E,'2026-08-01','2026-08-15','semi');
    const b=calcEmployeePayroll(E,'2026-08-16','2026-08-31','semi');
    const d=window.__hnxAllowDedupe(E.allowances,E);
    return {first:a.recurringAllowance,closing:b.recurringAllowance,rows:d.length,meals:d.filter(x=>x.type==='meal').length,cardStill:E.allowances.length};},
  expect:{first:1000,closing:3000,rows:2,meals:1,cardStill:4} }
);
