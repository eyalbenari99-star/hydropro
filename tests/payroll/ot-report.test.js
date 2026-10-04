/* v21.43 (Eyal): 📈 OT & Premiums — Sundays / regular / special per employee per month from approved runs, Δ and flags, by category, Excel */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
  localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-21':{name:'Ninoy Aquino Day',kind:'special'},'2026-08-31':{name:'National Heroes Day',kind:'regular'},'2026-09-21':{name:'test special',kind:'special'}}));
  const att={};att['2026-08-21']={E1:{status:'present',timeIn:'07:00',timeOut:'17:00'}};att['2026-08-31']={E1:{status:'present',timeIn:'07:00',timeOut:'17:00'}};att['2026-09-21']={E1:{status:'present',timeIn:'07:00',timeOut:'17:00'}};
  localStorage.setItem('hydroPro_attendance',JSON.stringify(att));
  const L=(id,name,cat,o)=>Object.assign({empId:id,name,salaryCategory:cat,dailyRate:1000,sundaysWorked:0,sundayPremium:0,sunDays:0,holidayPay:0},o);
  localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
    {id:'R1',type:'semi_monthly',status:'approved',periodStart:'2026-08-11',periodEnd:'2026-08-25',lines:[L('E1','Ann Office','accounting',{sundaysWorked:1,sundayPremium:1300,holidayPay:300}),L('E2','Ben Office','accounting',{sundaysWorked:0,sundayPremium:0,holidayPay:0})]},
    {id:'R2',type:'semi_monthly',status:'approved',periodStart:'2026-08-26',periodEnd:'2026-09-10',lines:[L('E1','Ann Office','accounting',{sundaysWorked:0,sundayPremium:0,holidayPay:1000})]},
    {id:'R3',type:'semi_monthly',status:'approved',periodStart:'2026-09-11',periodEnd:'2026-09-25',lines:[L('E1','Ann Office','accounting',{sundaysWorked:2,sundayPremium:2600,holidayPay:300})]},
    {id:'R4',type:'weekly',status:'approved',periodStart:'2026-09-17',periodEnd:'2026-09-23',lines:[L('E3','Carl Labour','Regular',{sunDays:1,dailyRate:658})]},
    {id:'R5',type:'semi_monthly',status:'pending',periodStart:'2026-09-26',periodEnd:'2026-10-10',lines:[L('E1','Ann Office','accounting',{sundayPremium:9999})]}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
<<<<<<< HEAD
{ name:'📈 OT & Premiums: Aug = Ann 1,300 Sunday + 300 special (21 Aug worked); Sep = 1,000 regular (31 Aug, period ending 10 Sep) + 2,600 Sunday + 300 special = 3,900 → Δ +2,300 / +144% and 🔺; Ben (no premiums) is not listed; Carl the labourer shows a Sunday day 658 under Regular; a pending/draft run is left out (9,999 never appears); category totals; Excel has 7 sheets with 12-month stats (Ann YTD 5,500, peak Sep, Sundays in 2 months, top increase 2,300) and the flag text (v21.44)',
=======
{ name:'📈 OT & Premiums: Aug = Ann 1,300 Sunday + 300 special (21 Aug worked); Sep = 1,000 regular (31 Aug, period ending 10 Sep) + 2,600 Sunday + 300 special = 3,900 → Δ +2,300 / +144% and 🔺; Ben (no premiums) is not listed; Carl the labourer shows a Sunday day 658 under Regular; a pending/draft run is left out (9,999 never appears); category totals; Excel has 4 sheets and the flag text (v21.43)',
>>>>>>> origin/main
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(4000);as('tester');
    const D=HNXOT.data('2026');const ann=D.rows.filter(r=>r.empId==='E1');const aug=ann.find(r=>r.month==='2026-08'),sep=ann.find(r=>r.month==='2026-09');
    const carl=D.rows.find(r=>r.empId==='E3'&&r.month==='2026-09');
    const S=HNXOT.sheets('2026');const flat=JSON.stringify(S);
    switchView('payroll_ot');await sleep(400);const txt=(document.getElementById('view-payroll_ot')||{}).innerText||'';
<<<<<<< HEAD
    return {months:D.months.join(','),emps:D.emps,drafts:D.drafts>=1,augSun:aug.sunday,augSpecial:aug.special,augReg:aug.regular,augTot:aug.total,sepReg:sep.regular,sepSpecial:sep.special,sepSun:sep.sunday,sepTot:sep.total,dPeso:sep.dPeso,dPct:Math.round(sep.dPct),flag:sep.flag,ben:D.rows.some(r=>r.empId==='E2'),carlSun:carl.sunday,carlCat:carl.cat,catAcc:D.cats[aug.cat]['2026-09'].total,stats:D.stats[0].name+'|'+D.stats[0].ytd+'|'+D.stats[0].maxMonth+'|'+D.stats[0].sundayMonths,m12:D.months12.length,topInc:D.topInc[0]&&D.topInc[0].dPeso,sheets:S.length,flagTxt:/🔺 increase/.test(flat),no9999:flat.indexOf('9999')<0,screen:/Ann Office/.test(txt)&&/🔺/.test(txt)};})();`),
  expect:{months:'2026-08,2026-09',emps:2,drafts:true,augSun:1300,augSpecial:300,augReg:0,augTot:1600,sepReg:1000,sepSpecial:300,sepSun:2600,sepTot:3900,dPeso:2300,dPct:144,flag:true,ben:false,carlSun:658,carlCat:'Regular',catAcc:3900,stats:'Ann Office|5500|2026-09|2',m12:12,topInc:2300,sheets:7,flagTxt:true,no9999:true,screen:true} },
=======
    return {months:D.months.join(','),emps:D.emps,drafts:D.drafts>=1,augSun:aug.sunday,augSpecial:aug.special,augReg:aug.regular,augTot:aug.total,sepReg:sep.regular,sepSpecial:sep.special,sepSun:sep.sunday,sepTot:sep.total,dPeso:sep.dPeso,dPct:Math.round(sep.dPct),flag:sep.flag,ben:D.rows.some(r=>r.empId==='E2'),carlSun:carl.sunday,carlCat:carl.cat,catAcc:D.cats[aug.cat]['2026-09'].total,sheets:S.length,flagTxt:/🔺 increase/.test(flat),no9999:flat.indexOf('9999')<0,screen:/Ann Office/.test(txt)&&/🔺/.test(txt)};})();`),
  expect:{months:'2026-08,2026-09',emps:2,drafts:true,augSun:1300,augSpecial:300,augReg:0,augTot:1600,sepReg:1000,sepSpecial:300,sepSun:2600,sepTot:3900,dPeso:2300,dPct:144,flag:true,ben:false,carlSun:658,carlCat:'Regular',catAcc:3900,sheets:4,flagTxt:true,no9999:true,screen:true} },
>>>>>>> origin/main
];
