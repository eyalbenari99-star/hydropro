/* v22.28 small rules (audit A7-16, A7-31, A1-50): one meter-calibrate rule, no "(deleted)" schedule banner, renewals open ≥ 30 days ahead */
module.exports=[
{ name:'🔬 One calibrate rule: EC meters 1.80 / 1.85 (Δ0.05) → not red, 1.80 / 1.86 (Δ0.06) → red; pH 6.00 / 6.10 (Δ0.10) → not red, 6.00 / 6.11 → red — the same line as CALIBRATE in the dose (EC 0.05, pH 0.10) (v22.28)',
  requires:"typeof window.poolMeterDrift==='function'",
  run:async()=>{const D=(a,b,k)=>window.poolMeterDrift(null,a,b,k).status;return {ec5:D('1.80','1.85','EC'),ec6:D('1.80','1.86','EC'),ph10:D('6.00','6.10','pH'),ph11:D('6.00','6.11','pH')};},
  expect:{ec5:'med',ec6:'high',ph10:'med',ph11:'high'} },
{ name:'📅 A due schedule whose report template was deleted is never announced (no "(deleted)" banner); a schedule of an existing template "Weekly harvest" still is (v22.28)',
  requires:"typeof window._showDueScheduleBanner==='function'",
  run:async()=>{localStorage.setItem('hydroPro_report_templates',JSON.stringify([{id:'T1',name:'Weekly harvest'}]));
    const old=document.getElementById('dueScheduleBanner');if(old)old.remove();
    window._showDueScheduleBanner([{templateId:'T9'}]);const a=!!document.getElementById('dueScheduleBanner');
    window._showDueScheduleBanner([{templateId:'T9'},{templateId:'T1'}]);const el=document.getElementById('dueScheduleBanner');const txt=el?el.textContent:'';if(el)el.remove();
    return {orphan:a,named:/Weekly harvest/.test(txt),deleted:/\(deleted\)/.test(txt),one:/1 scheduled report due/.test(txt)};},
  expect:{orphan:false,named:true,deleted:false,one:true} },
{ name:'🏛 Renewal lead time: empty box → 90 days, 0 → 30, 10 → 30, 60 → 60 (Eyal: apply 1–3 months before) (v22.28)',
  requires:"typeof window.ceaRgLead==='function'",
  run:async()=>({empty:window.ceaRgLead(''),zero:window.ceaRgLead(0),ten:window.ceaRgLead('10'),sixty:window.ceaRgLead(60)}),
  expect:{empty:90,zero:30,ten:30,sixty:60} }
];
