/* v21.76: payroll + Loyalty Savings visible only to admin, Jinky, Eyal, Dr Amy */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'joshane',fullname:'Joshane Espinosa',passwordHash:'x',role:'admin_secondary',department:'accounting',departments:['accounting'],allDepts:true,active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr','accounting','payroll'],active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🔒 Pay privacy: Joshane (accounting, secondary admin, all depts) → managePayroll false, viewSalaries false, payroll module none, Loyalty locked; Jinky, Dr Amy and admin → payroll allowed + Loyalty open (v21.76)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    const chk=u=>{as(u);const U=getCurrentUser();return [can('managePayroll'),can('viewSalaries'),getEffectiveModuleAccess(U,'payroll'),hnxPaySensitiveAllowed(U)].join('|');};
    return {josh:chk('joshane'),jinky:chk('jinky').split('|')[3],amy:chk('amy').split('|')[3],admin:chk('tester'),
      joshLoy:(()=>{as('joshane');return window.hnxPaySensitiveAllowed(getCurrentUser());})()};})()`),
  expect:{josh:'false|false|none|false',jinky:'true',amy:'true',admin:'true|true|edit|true',joshLoy:false} }
];
