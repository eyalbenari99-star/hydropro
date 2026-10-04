/* v21.56 (Eyal): Edelyn — production supervisor without the Production module; dept-id mapping + 🔎 Access doctor */
module.exports=[
{ name:'🔎 Access: edelyn (supervisor, home dept PROD_TRAINEES) gets Production EDIT through the dept mapping; a strict user "ops" gets NONE and the doctor says STRICT; granting Edit on production via the doctor makes ops EDIT with reason "per-user override"; Reset returns to strict NONE (v21.56)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'edelyn',fullname:'Edelyn Torzar',passwordHash:'x',role:'supervisor',active:true,department:'PROD_TRAINEES'},{username:'ops',fullname:'Ops Person',passwordHash:'x',role:'supervisor',active:true,department:'maintenance'}]));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({ops:{strict:true,overrides:{}}}));},
  run:new Function(`return (async()=>{await sleep(4000);const U=loadUsers();const ed=U.find(u=>u.username==='edelyn'),op=U.find(u=>u.username==='ops');
    const edAcc=getEffectiveModuleAccess(ed,'production');const w1=HNXACCESS.why('ops').find(r=>r.module==='production');
    window.showToast=()=>{};HNXACCESS.grant('ops','production','edit');await sleep(100);const w2=HNXACCESS.why('ops').find(r=>r.module==='production');const modal=!!document.getElementById('hnxAccDoc');
    HNXACCESS.grant('ops','production','inherit');await sleep(100);const w3=HNXACCESS.why('ops').find(r=>r.module==='production');const txt=(document.getElementById('hnxAccDoc')||{}).innerText||'';
    return {edAcc,opsBefore:w1.access,strictWhy:/STRICT/.test(w1.reason),opsAfter:w2.access,ovWhy:/override/.test(w2.reason),modal,reset:w3.access,screen:/Ops Person/.test(txt)&&/PRODUCTION/i.test(txt)};})();`),
  expect:{edAcc:'edit',opsBefore:'none',strictWhy:true,opsAfter:'edit',ovWhy:true,modal:true,reset:'none',screen:true} },
];
