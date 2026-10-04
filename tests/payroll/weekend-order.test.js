/* v21.46 (Eyal): Weekend Approvals — Dr Amy signs column 2 only AFTER the Accountant; Eyal signs anything, anytime */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Accountant',passwordHash:'x',role:'accounting',active:true,permissions:{managePayroll:true}},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true}]));
  localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'O1',name:'ANN OFFICE',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:16000,dateHired:'2025-01-01'}]));
  localStorage.setItem('hydroPro_attendance',JSON.stringify({'2026-09-20':{O1:{status:'present',timeIn:'08:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'}}}));
  localStorage.setItem('hydroPro_weekend_approvals_v1','{}');
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));const st=()=>JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}')['O1|2026-09-20']||{};";
module.exports=[
{ name:'⏳ Weekend order: Dr Amy (admin_secondary) cannot sign column 2 while column 1 is empty (nothing stored) and cannot sign column 1; after Jinky signs column 1, Dr Amy\'s column 2 ✓ stores; Eyal alone signs column 2 straight away and it covers column 1 (v21.46)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(4000);window.alert=()=>{};const K='O1|2026-09-20';
    as('amy');hnxWkSet(K,'final','ok');hnxWkSave();const amyEarly=st();
    hnxWkSet(K,'acct','ok');hnxWkSave();const amyAcct=st();
    as('jinky');hnxWkSet(K,'acct','ok');hnxWkSave();const afterJinky=st();
    as('amy');hnxWkSet(K,'final','ok');hnxWkSave();const afterAmy=st();
    localStorage.setItem('hydroPro_weekend_approvals_v1','{}');
    as('eyal');hnxWkSet(K,'final','ok');hnxWkSave();const eyal=st();
    return {amyEarlyFinal:amyEarly.final||null,amyAcct:amyAcct.acct||null,jinkyAcct:afterJinky.acct,jinkyFinal:afterJinky.final||null,amyFinal:afterAmy.final,amyBy:/amy/i.test(afterAmy.finalBy||''),eyalFinal:eyal.final,eyalAcct:eyal.acct};})();`),
  expect:{amyEarlyFinal:null,amyAcct:null,jinkyAcct:'ok',jinkyFinal:null,amyFinal:'ok',amyBy:true,eyalFinal:'ok',eyalAcct:'ok'} },
];
