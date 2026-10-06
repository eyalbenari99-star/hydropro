/* v21.91: payroll gate on every payroll screen */
module.exports=[
{ name:'🔒 Payroll gate: HR head (manageHR), another admin-role user and Joshane cannot open payroll_ops, pay_basis, pay_trips, hr_final_pay (view stays closed, 🔒); Jinky, Dr Amy and the System Admin login can; pay_basis/pay_trips/hr_final_pay now need managePayroll (v21.91)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'admin',fullname:'System Admin',passwordHash:'x',role:'admin',active:true},
    {username:'jomel',fullname:'Jomel IT',passwordHash:'x',role:'admin',active:true},{username:'hrhead',fullname:'HR Head',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr'],active:true},
    {username:'joshane',fullname:'Joshane Espinosa',passwordHash:'x',role:'accounting',active:true},{username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'accounting',active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));},
  run:new Function(`return (async()=>{const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));localStorage.removeItem('hnx_test_harness');as('admin');await sleep(6000);await sleep(1600);
    const V=['payroll_ops','pay_basis','pay_trips','hr_final_pay'];
    const can=u=>{as(u);return V.map(v=>{try{document.querySelectorAll('.view.active').forEach(e=>e.classList.remove('active'));switchView(v);}catch(e){}const el=document.getElementById('view-'+v);return el&&el.classList.contains('active')?1:0;}).join('');};
    const perm=['pay_basis','pay_trips','hr_final_pay'].map(id=>{let p='';Object.keys(MODULES).forEach(m=>(MODULES[m].views||[]).forEach(x=>{if(x&&x.id===id)p=x.perm;}));return p;}).join(',');
    return {hr:can('hrhead'),jomel:can('jomel'),josh:can('joshane'),allowed:['jinky','amy','admin'].map(u=>(as(u),hnxPaySensitiveAllowed(getCurrentUser())?1:0)).join(''),perm};})()`),
  expect:{hr:'0000',jomel:'0000',josh:'0000',allowed:'111',perm:'managePayroll,managePayroll,managePayroll'} }
];
