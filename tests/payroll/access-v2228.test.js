/* v22.28 (Eyal, 14 Sep: "approved by Dr Amy or me — then it is ready in payroll"; audit A1-07 / payroll D9 / POL-01):
   late decisions and the FINAL approval of memos belong to Eyal and Dr Amy (and the System Admin login) — other admin-role
   accounts no longer pass; a money memo created from 10 Oct 2026 is paid only after that final approval. */
module.exports=[
{ name:'🔐 Who decides: System Admin (admin) yes · Eyal Ben Ari yes · Dr Amy Patdu yes · Mea (admin role) NO · Jinky (accounting) NO · Amylou-like "Amylyn" NO · an inactive Eyal NO — the same for the memo decider (v22.28)',
  requires:"typeof window.hnxIsOwnerDecider==='function'",
  run:async()=>{const h=localStorage.getItem('hnx_test_harness');localStorage.removeItem('hnx_test_harness');
    const U={admin:{username:'admin',fullname:'System Admin',role:'admin',active:true},eyal:{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},
      amy:{username:'dramy',fullname:'Dr Amy Patdu',role:'manager',active:true},mea:{username:'mea',fullname:'Mea Magracia',role:'admin',active:true},
      jinky:{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true},amylyn:{username:'amylyn',fullname:'Amylyn Cruz',role:'admin',active:true},
      gone:{username:'eyal2',fullname:'Eyal Ben Ari',role:'admin',active:false}};
    const r={},m={};Object.keys(U).forEach(k=>{r[k]=window.hnxIsOwnerDecider(U[k]);m[k]=window.hnxMemoCanDecide?window.hnxMemoCanDecide(U[k]):null;});
    if(h!=null)localStorage.setItem('hnx_test_harness',h);return {r,m};},
  expect:{r:{admin:true,eyal:true,amy:true,mea:false,jinky:false,amylyn:false,gone:false},m:{admin:true,eyal:true,amy:true,mea:false,jinky:false,amylyn:false,gone:false}} },

{ name:'🔐 Payroll gate first: Mea (an admin-role account) → managePayroll NO, viewSalaries NO; the System Admin login → yes, yes; Eyal (admin role) → yes, yes (v22.28)',
  requires:"typeof window.hnxIsOwnerDecider==='function'",
  run:async()=>{const h=localStorage.getItem('hnx_test_harness');localStorage.removeItem('hnx_test_harness');const g=window.getCurrentUser;
    const as=u=>{window.getCurrentUser=()=>u;return [can('managePayroll'),can('viewSalaries')];};
    const r={mea:as({username:'mea',fullname:'Mea Magracia',role:'admin',active:true}),admin:as({username:'admin',fullname:'System Admin',role:'admin',active:true}),eyal:as({username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true})};
    window.getCurrentUser=g;if(h!=null)localStorage.setItem('hnx_test_harness',h);return r;},
  expect:{mea:[false,false],admin:[true,true],eyal:[true,true]} },

{ name:'📋 Job descriptions: Mea (admin role) sees only "🔒 kept by Jinky, Eyal and Dr Amy"; Jinky sees the form with NO Print JD button; Print refuses; two saves ("Grower" → "Senior Grower") keep 1 earlier version (v22.28)',
  requires:"typeof window._hrJDAllowed==='function'",
  run:async()=>{const h=localStorage.getItem('hnx_test_harness');localStorage.removeItem('hnx_test_harness');const g=window.getCurrentUser;window.showToast=()=>{};
    const emp={id:'E1',name:'CRUZ, JUAN',dept:'Production'};
    window.getCurrentUser=()=>({username:'mea',fullname:'Mea Magracia',role:'admin',active:true});
    const mea=window._hr201JDSection(emp);const meaOk=window._hrJDAllowed();
    window.getCurrentUser=()=>({username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true});
    const jin=window._hr201JDSection(emp);const host=document.createElement('div');host.innerHTML=jin;document.body.appendChild(host);
    const save=t=>{document.getElementById('hrJDTitle_E1').value=t;try{window._hr201JDSave('E1');}catch(e){}};
    save('Grower');save('Senior Grower');const jd=JSON.parse(localStorage.getItem('hydroPro_hr_201_jd_v1')||'{}').E1||{};
    let printed=false;const ow=window.open;window.open=()=>{printed=true;return null;};try{window._hr201JDPrint('E1');}catch(e){}window.open=ow;
    host.remove();window.getCurrentUser=g;if(h!=null)localStorage.setItem('hnx_test_harness',h);
    return {meaLocked:/kept by Jinky, Eyal and Dr Amy/.test(mea)&&!/hrJDTitle_/.test(mea),meaOk,jinkyForm:/hrJDTitle_E1/.test(jin),printBtn:/Print JD/.test(jin),printed,title:jd.title,hist:(jd.history||[]).map(x=>x.title)};},
  expect:{meaLocked:true,meaOk:false,jinkyForm:true,printBtn:false,printed:false,title:'Senior Grower',hist:['Grower']} },

{ name:'💰 Memo final approval: a −₱200 memo of 8 Oct for Juan, signed by Supervisor + HR Manager and CREATED 11 Oct (rule from 10 Oct) → payroll 5–11 Oct deducts ₱0 and lists it as not approved yet; after the FINAL approval it deducts ₱200; the same memo created 5 Oct (old rule) is deducted ₱200 at once (v22.28)',
  requires:"typeof window.hnxMemoNeedsFinal==='function'",
  run:async()=>{localStorage.setItem('hnx_memo_final_from','2026-10-10');
    const W=labour('W1','CRUZ, JUAN',{ghAssigned:['GH3']});setE([W]);loadEmployees();
    const a={};['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10'].forEach(d=>{a[d]={W1:rec('present','07:00','17:00')};});setA(a);
    const sig={name:'Sup',signedAt:'2026-10-11T03:00:00.000Z'};
    const memo=(id,created,extra)=>Object.assign({id,category:'hr',type:'bad',empId:'W1',date:'2026-10-08',status:'signed',title:'Late to the round',totalAmount:-200,amountBy:'tester',
      impact:[{empId:'W1',empName:'CRUZ, JUAN',role:'HR Memo',amount:-200}],reasons:[],signatures:{supervisor:sig,hrManager:sig},createdAt:created,createdBy:'mea'},extra||{});
    const run=list=>{localStorage.setItem('hydroPro_memos',JSON.stringify(list));try{loadMemos();}catch(e){}const l=calcEmployeePayroll(W,'2026-10-05','2026-10-11','weekly');return {ded:l.memoDed||0,add:l.memoAdd||0};};
    const needs=window.hnxMemoNeedsFinal(memo('N','2026-10-11T02:00:00.000Z'));
    const before=run([memo('N','2026-10-11T02:00:00.000Z')]);
    const after=run([memo('N','2026-10-11T02:00:00.000Z',{approvals:{final:{name:'Eyal Ben Ari',username:'eyal',at:'2026-10-11T05:00:00.000Z'}}})]);
    const old=run([memo('O','2026-10-05T02:00:00.000Z')]);
    localStorage.removeItem('hnx_memo_final_from');
    return {needs,before:before.ded,after:after.ded,old:old.ded};},
  expect:{needs:true,before:0,after:200,old:200} }
];
