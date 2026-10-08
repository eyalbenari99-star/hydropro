/* v21.45 (Eyal): ⚖️ Rate audit — paid rate (half-month ÷ Mon–Fri) vs should-be (monthly ÷ days − Sundays), item by item, read-only.
   v21.46 (Eyal: "cancel the new update"): the Rate audit screen was REMOVED — the trail entry reads "the v21.45 Rate audit screen is
   removed (no calculation was ever changed by it — the office daily rate and Sunday 130% stay exactly as before)". The v21.45 case
   called HNXRATE.data/sheets/divisor, which no longer exist, so it now pins what v21.46 promised instead: the screen and its API are
   gone, the Help centre no longer sends people to it (v22.17), and the office rate rule it questioned is untouched. */
const SEED=function(){
  localStorage.setItem('hydroPro_ph_holidays','{}'); /* no holiday inside 11–25 Sep 2026: 11 Mon–Fri scheduled days */
  /* the same approved office runs the v21.45 audit read — nothing may turn them into a Rate audit any more */
  const L=(id,name,o)=>Object.assign({empId:id,name,salaryCategory:'accounting',monthlyBasic:16000,dailyRate:727.27,sundaysWorked:0,sundayPremium:0},o);
  localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
    {id:'R1',type:'semi_monthly',status:'approved',periodStart:'2026-09-11',periodEnd:'2026-09-25',lines:[L('E1','Ann Office',{sundaysWorked:1,sundayPremium:945.45})]}]));
};
module.exports=[
{ name:'⚖️ Rate audit cancelled (v21.46, Eyal: "cancel the new update"): no window.HNXRATE, no Payroll ▸ ⚖️ Rate audit view or screen, and the Payroll Help guide says it is gone instead of sending people to it (v22.17); the rule it questioned is unchanged — Ann 16,000/month on 11–25 Sep 2026 is still paid 727.27/day (8,000 ÷ 11 Mon–Fri days, not 615.38 = 16,000 ÷ 26), weekday basic 8,000.00, and a signed Sunday 945.45 (130% of 727.27, not 615.38), so the line\'s basicPay (which carries the Sunday, v13.42) is 8,945.45',
  seed:SEED,
  run:async()=>{await sleep(4000);
    const views=(typeof MODULES!=='undefined'&&MODULES.payroll&&Array.isArray(MODULES.payroll.views))?MODULES.payroll.views.map(v=>v&&(v.id||v)):[];
    const ann=office('ANN','ANN OFFICE',{monthlyBasic:16000});setE([ann]);
    setA({'2026-09-20':{ANN:rec('present','08:00','17:00')}});
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify({'ANN|2026-09-20':{acct:'ok',acctBy:'Jinky',final:'ok',finalBy:'Eyal'}}));
    const l=calcEmployeePayroll(ann,'2026-09-11','2026-09-25','semi_monthly');
    const g=(window.HNX_HELP_GUIDES||[]).find(x=>x.id==='m_payroll')||{};const gs=JSON.stringify(g);
    return {hnxrate:typeof window.HNXRATE,payrollViewsRead:views.indexOf('payroll_ops')>=0,auditView:views.indexOf('payroll_rate_audit')>=0,
      auditScreen:!!document.getElementById('view-payroll_rate_audit'),
      guideFound:Array.isArray(g.sections),guideSendsToAudit:/Payroll ▸ ⚖️ Rate audit/.test(gs),guideSaysCancelled:(g.sections||[]).some(s=>/Rate audit/.test(s.h||'')&&/cancelled in v21\.46/.test(s.h||'')),
      rate:Math.round(l.dailyRate*100)/100,weekdayBasic:Math.round((l.basicPay-l.sundayPremium)*100)/100,sunday:l.sundayPremium,basicPay:l.basicPay};},
  expect:{hnxrate:'undefined',payrollViewsRead:true,auditView:false,auditScreen:false,guideFound:true,guideSendsToAudit:false,guideSaysCancelled:true,rate:727.27,weekdayBasic:8000,sunday:945.45,basicPay:8945.45} },
];
