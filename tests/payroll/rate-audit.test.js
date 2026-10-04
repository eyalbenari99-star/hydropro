/* v21.45 (Eyal): ⚖️ Rate audit — paid rate (half-month ÷ Mon–Fri) vs should-be (monthly ÷ days − Sundays), item by item, read-only */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
  const L=(id,name,o)=>Object.assign({empId:id,name,salaryCategory:'accounting',monthlyBasic:16000,dailyRate:727.27,rateWhy:'half of 16,000 ÷ 11 working days',sundaysWorked:0,sundayPremium:0,sunDays:0,satDays:0,holidayPay:0,tardyDeduction:0,daysAbsentUnauth:0},o);
  localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
    /* Sep 2026: 30 days, 4 Sundays → divisor 26 → should-be rate 615.38 */
    {id:'R1',type:'semi_monthly',status:'approved',periodStart:'2026-09-11',periodEnd:'2026-09-25',lines:[
      L('E1','Ann Office',{sundaysWorked:1,sunDays:1,sundayPremium:945.45,holidayPay:218.18,tardyDeduction:90.91,daysAbsentUnauth:1}),
      L('E2','Ben Office',{sundaysWorked:1,sunDays:0,satDays:1,sundayPremium:945.45})]},
    {id:'R2',type:'weekly',status:'approved',periodStart:'2026-09-17',periodEnd:'2026-09-23',lines:[L('E3','Carl Labour',{monthlyBasic:0,dailyRate:658,sunDays:1})]},
    {id:'R3',type:'semi_monthly',status:'draft',periodStart:'2026-09-26',periodEnd:'2026-10-10',lines:[L('E1','Ann Office',{sundayPremium:9999})]}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'⚖️ Rate audit: Sep 2026 divisor 26 → Ann 16,000 paid at 727.27, should be 615.38; Sunday paid 945.45 vs should 615.38 @100% (Δ +330.07) or 800.00 @130% (Δ +145.45); holiday 218.18 → 184.61; tardy 90.91 → 76.92 (Δ −13.99: less should be deducted, so underpaid); absence 727.27 → 615.38 (Δ −111.89); Ben Saturday on a 5-day card 945.45 → 615.38; Carl (weekly) and the draft 9,999 never appear; 4 sheets (v21.45)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(4000);as('tester');
    const D=HNXRATE.data('2026',{sunPct:100,satPct:100});const ann=D.rows.find(r=>r.empId==='E1'),ben=D.rows.find(r=>r.empId==='E2');
    const D2=HNXRATE.data('2026',{sunPct:130});const ann2=D2.rows.find(r=>r.empId==='E1');
    const S=HNXRATE.sheets('2026');const flat=JSON.stringify(S);
    switchView('payroll_rate_audit');await sleep(400);const txt=(document.getElementById('view-payroll_rate_audit')||{}).innerText||'';
    return {div:HNXRATE.divisor('2026-09'),rows:D.rows.length,newRate:ann.newRate,oldRate:ann.oldRate,sunShould:ann.sunShould,dSun:ann.dSun,sunShould130:ann2.sunShould,dSun130:ann2.dSun,holShould:ann.holShould,tardyShould:ann.tardyShould,dTardy:ann.dTardy,absShould:ann.absShould,dAbs:ann.dAbs,benSat:ben.satShould,benDSat:ben.dSat,carl:D.rows.some(r=>r.empId==='E3'),no9999:flat.indexOf('9999')<0,sheets:S.length,screen:/Ann Office/.test(txt)&&/Rate audit/.test(txt)};})();`),
  expect:{div:26,rows:2,newRate:615.38,oldRate:727.27,sunShould:615.38,dSun:330.07,sunShould130:800,dSun130:145.45,holShould:184.61,tardyShould:76.92,dTardy:-13.99,absShould:615.38,dAbs:-111.89,benSat:615.38,benDSat:330.07,carl:false,no9999:true,sheets:4,screen:true} },
];
