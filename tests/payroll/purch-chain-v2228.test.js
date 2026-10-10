/* v22.28 Purchasing approval chain (Eyal's answers 5 Oct, A5-37/A5-38) and the two critical invoice holes:
   Eyal or Dr Amy approve, Jinky checks the content first (inbox notice), nobody approves what they raised;
   a supplier invoice could be approved by ANY user, and a second invoice for the same PO matched again (PW-06). */
module.exports=[
{ name:'🛒 Approval chain (A5-37/A5-38): PR-2026-000041 raised by Eyal reaches Department Approval → Jinky gets the inbox notice; Jinky cannot approve but checks it (Dr Amy told, Eyal not); Eyal cannot approve his own request; Mea (admin_secondary, approved before) cannot; Dr Amy approves → Purchasing Review; a stale "Inventory verified" button does not skip a stage (v22.28)',
  requires:"!!(window.__PURPRO&&window.__PURPRO.checkPR&&window.__PURPRO.isApprover)",
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},{username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true},{username:'mea',fullname:'Mea Magracia',role:'admin_secondary',active:true}]));},
  run:async()=>{
    const U={eyal:{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},amy:{username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
      jinky:{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true},mea:{username:'mea',fullname:'Mea Magracia',role:'admin_secondary',active:true}};
    const g=window.getCurrentUser;const as=k=>{window.getCurrentUser=()=>U[k];};
    window.showToast=()=>{};const al=[];window.alert=m=>al.push(String(m));window.confirm=()=>true;
    localStorage.setItem('hydroPro_pa_inbox_v1','[]');localStorage.removeItem('hydroPro_purch_roles_v1');
    const pr={id:'pr41',number:'PR-2026-000041',title:'Cement for GH15',dept:'Construction',needBy:'2026-10-20',items:[{desc:'Cement',qty:10,unitCost:300}],
      status:'AI Validation',createdBy:'eyal',createdAt:Date.now(),workflow:[],overrides:[]};
    localStorage.setItem('hydroPro_purch_prs',JSON.stringify([pr]));
    const P=()=>JSON.parse(localStorage.getItem('hydroPro_purch_prs'))[0];
    const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
    as('amy');__PURPRO.simpleAdvance('pr41','AI accepted','AI Validation');await sleep(50);
    const toJinky=inbox().filter(x=>x.user==='jinky'&&/waits for your content check/.test(x.title)).length;
    as('jinky');const jr=[__PURPRO.isApprover(),__PURPRO.isChecker()];__PURPRO.deptApprove('pr41',true);await sleep(30);const afterJ=P().status;
    __PURPRO.checkPR('pr41');await sleep(30);const checked=P().checkedBy;
    const told=inbox().filter(x=>/checked — waiting for your approval/.test(x.title)).map(x=>x.user).sort();
    as('eyal');al.length=0;__PURPRO.deptApprove('pr41',true);await sleep(30);const own=[P().status,al.some(m=>/You raised PR-2026-000041/.test(m))];
    as('mea');__PURPRO.deptApprove('pr41',true);await sleep(30);const mea=[__PURPRO.isApprover(),P().status];
    as('amy');__PURPRO.deptApprove('pr41',true);await sleep(30);const amy=P().status;
    __PURPRO.simpleAdvance('pr41','Inventory verified','Inventory Verification');await sleep(30);const stale=P().status;
    window.getCurrentUser=g;
    return {toJinky,jr,afterJ,checked,told,own,mea,amy,stale};},
  expect:{toJinky:1,jr:[false,true],afterJ:'Department Approval',checked:'jinky',told:['amy'],own:['Department Approval',true],mea:[false,'Department Approval'],amy:'Purchasing Review',stale:'Purchasing Review'} },

{ name:'🧾 Supplier invoices (critical): PO-2026-000007 ₱1,000 fully received; INV-A ₱1,000 → Matched, INV-B ₱1,000 for the same PO → Exception (was Matched again — paid twice, PW-06); Jinky cannot approve INV-A (any user could), Dr Amy can; INV-B cannot be approved as matched (v22.28)',
  requires:"!!(window.__PURPRO&&window.__PURPRO.matchInvoice&&window.__PURPRO.isApprover)",
  run:async()=>{
    const U={amy:{username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},jinky:{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true}};
    const g=window.getCurrentUser;const as=k=>{window.getCurrentUser=()=>U[k];};
    window.showToast=()=>{};window.alert=()=>{};window.confirm=()=>true;try{window.renderPurchPro=()=>{};}catch(e){}
    localStorage.setItem('hydroPro_purch_pos',JSON.stringify([{id:'po7',number:'PO-2026-000007',supplier:'Holcim',status:'Issued',total:1000,items:[{desc:'Cement',qty:10,unitCost:100}]}]));
    localStorage.setItem('hydroPro_purch_grns',JSON.stringify([{id:'g1',poId:'po7',lines:[{line:0,accepted:10}]}]));
    const t=Date.now();
    const A={id:'iA',number:'INV-A',poId:'po7',amount:1000,status:'Pending',createdAt:t-1000};
    A.matchStatus=__PURPRO.matchInvoice(A);
    localStorage.setItem('hydroPro_purch_invoices',JSON.stringify([A]));
    const B={id:'iB',number:'INV-B',poId:'po7',amount:1000,status:'Pending',createdAt:t};
    B.matchStatus=__PURPRO.matchInvoice(B);
    localStorage.setItem('hydroPro_purch_invoices',JSON.stringify([A,B]));
    const reA=__PURPRO.matchInvoice(A);
    const I=id=>JSON.parse(localStorage.getItem('hydroPro_purch_invoices')).find(x=>x.id===id);
    as('jinky');__PURPRO.approveInvoice('iA',false);await sleep(30);const j=I('iA').status;
    as('amy');__PURPRO.approveInvoice('iA',false);await sleep(30);const a=I('iA').status;
    __PURPRO.approveInvoice('iB',false);await sleep(30);const b=I('iB').status;
    window.getCurrentUser=g;
    return {m:[A.matchStatus,B.matchStatus,reA],j,a,b};},
  expect:{m:['Matched','Exception','Matched'],j:'Pending',a:'Approved',b:'Pending'} }
];
