/* v21.46 (Eyal): Weekend Approvals — Dr Amy signs column 2 only AFTER the Accountant; Eyal signs anything, anytime.
   v23.34 (Eyal, 14 Oct 2026: "Jinky should approve that even before Dr Amy or me but of course we can override"): the OWNER RULE
   CHANGED — Dr Amy may now sign column 2 before the accountant too (an override); a final ✓ on an empty column 1 marks it covered
   by that final. Every other check of the v21.46 case stays: Dr Amy never signs column 1, the accountant never signs column 2,
   Eyal's final covers column 1. Only amyEarlyFinal flipped (null → 'ok'). */
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
{ name:'⏳ Weekend order v23.34 (owner rule changed from v21.46 "Dr Amy only after Jinky" to "we can override"): Dr Amy\'s column 2 ✓ BEFORE the accountant now stores and marks column 1 covered by her final; her column 1 tick is still refused (column 1 stays the cover, not hers); the accountant\'s later column 1 ✓ turns the cover into her own check; the accountant still cannot sign column 2 (Dr Amy\'s final stays); Eyal\'s column 2 ✓ alone still covers column 1',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(4000);window.alert=()=>{};const K='O1|2026-09-20';
    as('amy');hnxWkSet(K,'final','ok');hnxWkSave();const amyEarly=st();
    hnxWkSet(K,'acct','ok');hnxWkSave();const amyAcct=st();
    as('jinky');hnxWkSet(K,'acct','ok');hnxWkSave();const afterJinky=st();
    hnxWkSet(K,'final','no');hnxWkSave();const jinkyFinal=st();
    localStorage.setItem('hydroPro_weekend_approvals_v1','{}');
    as('eyal');hnxWkSet(K,'final','ok');hnxWkSave();const eyal=st();
    return {amyEarlyFinal:amyEarly.final||null,amyEarlyCover:amyEarly.acctCovered||null,amyAcct:[amyAcct.acct||null,amyAcct.acctCovered||null],
      jinkyAcct:afterJinky.acct,jinkyBy:afterJinky.acctBy,jinkyCover:afterJinky.acctCovered||null,
      jinkyFinal:[jinkyFinal.final,/amy/i.test(jinkyFinal.finalBy||'')],amyBy:/amy/i.test(amyEarly.finalBy||''),
      eyalFinal:eyal.final,eyalAcct:eyal.acct,eyalCover:eyal.acctCovered||null};})();`),
  expect:{amyEarlyFinal:'ok',amyEarlyCover:'final',amyAcct:['ok','final'],jinkyAcct:'ok',jinkyBy:'Jinky Accountant',jinkyCover:null,
    jinkyFinal:['ok',true],amyBy:true,eyalFinal:'ok',eyalAcct:'ok',eyalCover:'final'} },
];
