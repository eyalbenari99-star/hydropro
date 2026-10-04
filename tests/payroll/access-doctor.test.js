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
module.exports.push(
{ name:'👑 Owner\'s standing grant: user "torzar" (Ederlyn Torzar, supervisor, STRICT on, override production=none, home dept blank) still gets Production EDIT, the sidebar lists Production, and the doctor names the owner\'s grant (v21.57)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'torzar',fullname:'Ederlyn Torzar',passwordHash:'x',role:'supervisor',active:true,department:''}]));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({torzar:{strict:true,overrides:{'module:production':'none'}}}));},
  run:new Function(`return (async()=>{await sleep(4000);const u=loadUsers().find(x=>x.username==='torzar');const acc=getEffectiveModuleAccess(u,'production');const w=HNXACCESS.why('torzar').find(r=>r.module==='production');
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'torzar',loginAt:Date.now()}));const has=moduleHasAccess('production');
    return {acc,why:/owner/.test(w.reason),has};})();`),
  expect:{acc:'edit',why:true,has:true} });
module.exports.push(
{ name:'👑 Jomel: user "jomel" (supervisor, STRICT with overrides for 7 modules only) gets Production, Maintenance, IT, Irrigation, Security EDIT via the owner\'s grant; a strict user "mia" who is the Department Head of quality gets Quality EDIT with the reason "department head" (v21.59)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'jomel',fullname:'Jomel Galvo',passwordHash:'x',role:'supervisor',active:true,department:''},{username:'mia',fullname:'Mia QC',passwordHash:'x',role:'supervisor',active:true,department:''}]));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({jomel:{strict:true,overrides:{'module:overview':'view','module:fleet':'edit'}},mia:{strict:true,overrides:{}}}));
    localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({quality:'mia',maintenance:'jomel'}));},
  run:new Function(`return (async()=>{await sleep(4000);const U=loadUsers();const j=U.find(x=>x.username==='jomel'),m=U.find(x=>x.username==='mia');
    const acc=['production','maintenance','it','irrigation','security'].map(x=>getEffectiveModuleAccess(j,x)).join(',');
    const q=getEffectiveModuleAccess(m,'quality');const w=HNXACCESS.why('mia').find(r=>r.module==='quality');const other=getEffectiveModuleAccess(m,'production');
    return {acc,q,why:/department head/.test(w.reason),other};})();`),
  expect:{acc:'edit,edit,edit,edit,edit',q:'edit',why:true,other:'none'} });
module.exports.push(
{ name:'🔎 Audit all: "ops" (supervisor, STRICT, override production=none, head of maintenance) is reported missing production and maintenance among others; "clerk" (accounting, no strict) is missing nothing; Fix everyone writes the overrides so ops gets production and maintenance EDIT and the audit then shows 0 to fix (v21.60)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'ops',fullname:'Ops Person',passwordHash:'x',role:'supervisor',active:true,department:'production'},{username:'clerk',fullname:'Acct Clerk',passwordHash:'x',role:'accounting',active:true,department:'accounting'}]));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({ops:{strict:true,overrides:{'module:production':'none'}}}));localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'ops'}));},
  run:new Function(`return (async()=>{await sleep(4000);window.confirm=()=>true;window.showToast=()=>{};
    const A=HNXACCESS.auditAll();const ops=A.find(r=>r.username==='ops'),clerk=A.find(r=>r.username==='clerk');
    const before={opsMissProd:ops.missing.includes('production'),opsMissMaint:ops.missing.includes('maintenance')||ops.has.includes('maintenance'),clerkMissing:clerk.missing.length};
    HNXACCESS.fixAll();await sleep(100);const U=loadUsers().find(u=>u.username==='ops');let err='';try{HNXACCESS.openAudit();}catch(e){err=String(e);}const after=HNXACCESS.auditAll().filter(r=>r.missing.length).length;
    return Object.assign(before,{prod:getEffectiveModuleAccess(U,'production'),maint:getEffectiveModuleAccess(U,'maintenance'),after,modal:!!document.getElementById('hnxAccAudit'),err});})();`),
  expect:{opsMissProd:true,opsMissMaint:true,clerkMissing:0,prod:'edit',maint:'edit',after:0,modal:true,err:''} });
module.exports.push(
{ name:'👑 Mea: user "mea" (Meajean Magracia, supervisor, home dept APAC_ADMIN, STRICT with no overrides) gets Production EDIT via the owner\'s standing grant and 🔎 Access says so; "clerk2" (same dept, no grant) stays none (v21.61)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'mea',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',active:true,department:'APAC_ADMIN'},{username:'clerk2',fullname:'Other Clerk',passwordHash:'x',role:'supervisor',active:true,department:'APAC_ADMIN'}]));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({mea:{strict:true,overrides:{}},clerk2:{strict:true,overrides:{}}}));},
  run:new Function(`return (async()=>{await sleep(4000);const U=loadUsers();const m=U.find(x=>x.username==='mea'),c=U.find(x=>x.username==='clerk2');
    const w=HNXACCESS.why('mea').find(r=>r.module==='production');
    return {prod:getEffectiveModuleAccess(m,'production'),why:/standing grant/.test(w.reason),other:getEffectiveModuleAccess(c,'production')};})();`),
  expect:{prod:'edit',why:true,other:'none'} });
