/* v22.31 trial — Purchasing audit (Nexi_Purchasing_Audit v22.28): PO prices from the offer (PW-07), award by request id (PW-08),
   receiving checks (PW-11), close short / cancel / edit (PW-10), payment stage (PW-12 / LV-03), "not required" needs Eyal or
   Dr Amy (PW-03), honest RFQ sending (QT-01 / QT-02), Supplier 360° closes (LV-02), own POs count as on order (IV-04). */
const USERS=[{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},{username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true},{username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true},
  {username:'maria',fullname:'Maria Santos',role:'operator',department:'Production',active:true}];
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},{username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true},{username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true},
  {username:'maria',fullname:'Maria Santos',role:'operator',department:'Production',active:true}]));
  ['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_inv_draft_pos_v1'].forEach(k=>localStorage.setItem(k,'[]'));
  localStorage.removeItem('hydroPro_purch_roles_v1');};
const PRE="const U="+JSON.stringify(USERS)+";const g0=window.getCurrentUser;const as=k=>{const u=U.find(x=>x.username===k);window.getCurrentUser=()=>u;};"+
  "window.showToast=()=>{};const AL=[];window.alert=m=>AL.push(String(m));window.confirm=()=>true;let PR_ANS=null;window.prompt=()=>PR_ANS;"+
  "const J=k=>JSON.parse(localStorage.getItem(k)||'[]');const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));"+
  "const inp=(id,v)=>{let e=document.getElementById(id);if(!e){e=document.createElement('input');e.id=id;e.style.display='none';document.body.appendChild(e);}e.value=v;return e;};"+
  "const clr=()=>document.querySelectorAll('input[id^=ppQ],input[id^=ppG],input[id^=ppPay],select[id^=ppPay]').forEach(e=>e.remove());"+
  "const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');";
const NEED="!!(window.__hnxPurchAudit2231>=1)";
module.exports=[
{ name:'🛒 PW-07/PW-08: 2 items with no estimates — D\'Agro Supply prices 10 bags × ₱120 + 4 rolls × ₱45 + ₱50 delivery = ₱1,430; the award (only the request id travels, the apostrophe no longer breaks it) builds PO lines ₱120 / ₱45, total ₱1,430 "offer — price per item"; an offer with no per-item price and no estimates is refused — no PO (v22.31)',
  requires:NEED,seed:SEED,
  run:new Function(`return (async()=>{${PRE}as('amy');await sleep(4000);
    const pr={id:'p1',number:'PR-2026-000101',title:'GH15 repairs',dept:'Construction',needBy:'2026-10-30',items:[{desc:'Cement bag',qty:10,unit:'bag'},{desc:'Tie wire roll',qty:4,unit:'roll'}],status:'RFQ',rfqId:'r1',createdBy:'maria',workflow:[],overrides:[]};
    const pr2={id:'p2',number:'PR-2026-000102',title:'Pipes',dept:'Construction',needBy:'2026-10-30',items:[{desc:'PVC 2in',qty:5},{desc:'Elbow',qty:5}],status:'Approval',rfqId:'r2',createdBy:'maria',workflow:[],overrides:[]};
    put('hydroPro_purch_prs',[pr,pr2]);
    put('hydroPro_purch_rfqs',[{id:'r1',number:'RFQ-1',prId:'p1',status:'Open',suppliers:[{name:"D'Agro Supply",email:'x@y.ph'}]},{id:'r2',number:'RFQ-2',prId:'p2',status:'Open',suppliers:[{name:'Pipe Co',quote:{qty:10,unitPrice:80,delivery:0,total:800,deliverToOk:true}}]}]);
    clr();inp('ppQq','');inp('ppQu','');inp('ppQdc','50');inp('ppQl0','120');inp('ppQl1','45');__PURPRO.saveQuote('r1',0);await sleep(50);
    const q=J('hydroPro_purch_rfqs')[0].suppliers[0].quote;
    const P=J('hydroPro_purch_prs');P[0].status='Approval';put('hydroPro_purch_prs',P);
    __PURPRO.award('p1');await sleep(50);const po=J('hydroPro_purch_pos')[0]||{};
    AL.length=0;__PURPRO.award('p2');await sleep(50);const refused=AL.some(m=>/no price per item/.test(m));
    clr();window.getCurrentUser=g0;
    return {total:q.total,lines:(q.lines||[]).map(l=>l.unitPrice),poLines:(po.items||[]).map(i=>i.unitCost),poTotal:po.total,from:po.pricesFrom,sup:po.supplier,pos:J('hydroPro_purch_pos').length,refused,p2:J('hydroPro_purch_prs')[1].status};})()`),
  expect:{total:1430,lines:[120,45],poLines:[120,45],poTotal:1430,from:'offer — price per item',sup:"D'Agro Supply",pos:1,refused:true,p2:'Approval'} },

{ name:'📦 PW-11/PW-10: PO-2026-000201 for 100 m — accepting 120 is refused ("only 100 remain"), all-rejected 5 keeps it Issued, 80 accepted dated yesterday → Partially Delivered with yesterday\'s date, a date tomorrow is refused; Dr Amy closes it short (20 cancelled) and nothing more can be received (v22.31)',
  requires:NEED,seed:SEED,
  run:new Function(`return (async()=>{${PRE}as('amy');await sleep(4000);
    const y=ymd(new Date(Date.now()-864e5)),tm=ymd(new Date(Date.now()+864e5));
    put('hydroPro_purch_prs',[{id:'p3',number:'PR-3',title:'Hose',status:'Receiving',poId:'po3',items:[{desc:'Drip hose',qty:100,unit:'m'}],createdBy:'maria',workflow:[]}]);
    put('hydroPro_purch_pos',[{id:'po3',number:'PO-2026-000201',prId:'p3',supplier:'Netafim',status:'Issued',total:5000,items:[{desc:'Drip hose',qty:100,unit:'m',unitCost:50}]}]);
    const st=()=>J('hydroPro_purch_pos')[0].status;
    clr();inp('ppGacc0','120');inp('ppGrej0','');inp('ppGdate',y);AL.length=0;__PURPRO.recordGRN('p3');await sleep(30);const over=[AL.some(m=>/only 100 m remain/.test(m)),J('hydroPro_purch_grns').length];
    inp('ppGacc0','0');inp('ppGrej0','5');__PURPRO.recordGRN('p3');await sleep(30);const rej=st();
    inp('ppGacc0','80');inp('ppGrej0','0');inp('ppGdate',tm);AL.length=0;__PURPRO.recordGRN('p3');await sleep(30);const fut=AL.some(m=>/cannot be in the future/.test(m));
    inp('ppGdate',y);__PURPRO.recordGRN('p3');await sleep(30);const part=[st(),J('hydroPro_purch_grns').slice(-1)[0].date===y];
    PR_ANS='Supplier out of stock — rest cancelled';__PURPRO.closePO('p3');await sleep(30);const po=J('hydroPro_purch_pos')[0];
    inp('ppGacc0','5');inp('ppGdate',y);AL.length=0;__PURPRO.recordGRN('p3');await sleep(30);const after=AL.some(m=>/Closed \\(short\\)/.test(m));
    clr();window.getCurrentUser=g0;
    return {over,rej,fut,part,closed:po.status,cancelled:po.shortClosed&&po.shortClosed.cancelled,after,grns:J('hydroPro_purch_grns').length};})()`),
  expect:{over:[true,0],rej:'Issued',fut:true,part:['Partially Delivered',true],closed:'Closed (short)',cancelled:[20],after:true,grns:2} },

{ name:'💳 PW-12/LV-03: terms "30 days" → INV-301 dated 1 Oct is due 31 Oct on approval; ₱400 by bank transfer BDO-1 → Partly paid, balance ₱600; ₱700 refused (more than the balance), a transfer with no reference refused; ₱600 cash → Paid; terms: COD 0, "Net 45" 45, none null; a COD invoice of 1 Sep shows OVERDUE in Mission Control (v22.31)',
  requires:NEED,seed:SEED,
  run:new Function(`return (async()=>{${PRE}as('amy');await sleep(4000);
    put('hydroPro_purch_pos',[{id:'po4',number:'PO-4',supplier:'Holcim',status:'Fully Delivered',total:1000,payTerms:'30 days',items:[{desc:'Cement',qty:10,unitCost:100}]},{id:'po5',number:'PO-5',supplier:'Hardware',status:'Fully Delivered',total:500,payTerms:'COD',items:[{desc:'Nails',qty:5,unitCost:100}]}]);
    put('hydroPro_purch_grns',[{id:'g4',poId:'po4',lines:[{line:0,accepted:10}]},{id:'g5',poId:'po5',lines:[{line:0,accepted:5}]}]);
    put('hydroPro_purch_invoices',[{id:'i4',number:'INV-301',poId:'po4',date:'2026-10-01',amount:1000,status:'Pending',matchStatus:'Matched',createdAt:1},{id:'i5',number:'INV-302',poId:'po5',date:'2026-09-01',amount:500,status:'Pending',matchStatus:'Matched',createdAt:2}]);
    __PURPRO.approveInvoice('i4',false);__PURPRO.approveInvoice('i5',false);await sleep(30);
    const I=id=>J('hydroPro_purch_invoices').find(x=>x.id===id);const due=I('i4').dueDate;
    const pay=(a,m,r)=>{clr();inp('ppPayAmt',a);inp('ppPayDate',ymd(new Date()));inp('ppPayMethod',m);inp('ppPayRef',r);__PURPRO.recordPayment('i4');};
    pay('400','Bank transfer','BDO-1');await sleep(20);const p1=[I('i4').status,__PURPRO.invBalance(I('i4'))];
    AL.length=0;pay('700','Bank transfer','BDO-2');const big=AL.some(m=>/more than the balance/.test(m));
    AL.length=0;pay('600','Bank transfer','');const noref=AL.some(m=>/reference/.test(m));
    pay('600','Cash','');await sleep(20);const p2=[I('i4').status,__PURPRO.invBalance(I('i4')),(I('i4').payments||[]).length];
    const T=[__PURPRO.termsDays('COD'),__PURPRO.termsDays('Net 45'),__PURPRO.termsDays('')];
    __PURPRO.tab('mission');await sleep(200);const v=document.getElementById('view-acct_purch_pro');const od=!!v&&/Invoice INV-302 OVERDUE since 2026-09-01/.test(v.innerText);
    clr();window.getCurrentUser=g0;
    return {due,p1,big,noref,p2,T,od};})()`),
  expect:{due:'2026-10-31',p1:['Partly paid',600],big:true,noref:true,p2:['Paid',0,2],T:[0,45,null],od:true} },

{ name:'🗑 PW-03/PW-10: Joshane (Purchasing) presses "not required" on Maria\'s ₱24,000 request → it stays open and Eyal + Dr Amy get the question; Dr Amy says "needed" → Department Approval; on a second one she confirms → Completed; a request at RFQ is cancelled with a reason (its RFQ too) and never moves again; a draft sent back is edited → same request, revision 2, qty 12 (v22.31)',
  requires:NEED,seed:SEED,
  run:new Function(`return (async()=>{${PRE}as('joshane');await sleep(4000);
    const base=(id,n,st)=>({id,number:n,title:'Fertilizer '+n,dept:'Production',klass:'Inputs',needBy:'2026-10-30',justification:'Calcium nitrate for GH4 and GH8 — two weeks of dosing at the current EC targets',items:[{desc:'Calcium nitrate',qty:10,unit:'bag',unitCost:2400}],status:st,createdBy:'maria',workflow:[],overrides:[],aiAnalysis:{purchaseRequired:false,overall:'covered'}});
    put('hydroPro_purch_prs',[base('a1','PR-A1','AI Validation'),base('a2','PR-A2','AI Validation'),Object.assign(base('a3','PR-A3','RFQ'),{rfqId:'rq3'}),Object.assign(base('a4','PR-A4','Draft'),{workflow:[{stage:'Draft',at:1,by:'amy',note:'REJECTED: qty too high'}]})]);
    put('hydroPro_purch_rfqs',[{id:'rq3',number:'RFQ-3',prId:'a3',status:'Open',suppliers:[]}]);
    const P=id=>J('hydroPro_purch_prs').find(x=>x.id===id);
    __PURPRO.aiAccept('a1');await sleep(30);const asked=[P('a1').status,!!P('a1').closeRequest];
    const to=J('hydroPro_pa_inbox_v1').filter(x=>/close as not required/.test(x.title)).map(x=>x.user).sort();
    as('amy');__PURPRO.closeNoPurchase('a1',false);await sleep(30);const needed=[P('a1').status,P('a1').closeRequest];
    as('joshane');__PURPRO.aiAccept('a2');as('amy');__PURPRO.closeNoPurchase('a2',true);await sleep(30);const closed=P('a2').status;
    as('joshane');PR_ANS='Supplier no longer needed — stock arrived from GH2';__PURPRO.cancelPR('a3','RFQ');await sleep(30);
    const can=[P('a3').status,J('hydroPro_purch_rfqs')[0].status,P('a3').cancelled&&P('a3').cancelled.reason];
    __PURPRO.simpleAdvance('a3','x','Cancelled');await sleep(20);const still=P('a3').status;
    __PURPRO.editPR('a4');__PURPRO.df('title','Fertilizer — 12 bags');__PURPRO.dif(0,'qty','12');__PURPRO.saveDraft();await sleep(30);
    const e=P('a4');
    window.getCurrentUser=g0;
    return {asked,to,needed,closed,can,still,edit:[e.title,e.items[0].qty,e.revision,J('hydroPro_purch_prs').length]};})()`),
  expect:{asked:['AI Validation',true],to:['amy','eyal'],needed:['Department Approval',null],closed:'Completed',can:['Cancelled','Cancelled','Supplier no longer needed — stock arrived from GH2'],still:'Cancelled',edit:['Fertilizer — 12 bags',12,2,4]} },

{ name:'📨 QT-01/QT-02/LV-02/IV-04: an RFQ e-mail through mailto shows DRAFT OPENED (not SENT) until ✓ Sent; SMS on this computer is refused; Supplier 360° closes with Escape and with a click outside and sits above every banner; FERT-01 has 20 on a draft engine PO + 50 − 30 received on an issued PO = 40 on order (v22.31)',
  requires:NEED,seed:SEED,
  run:new Function(`return (async()=>{${PRE}as('joshane');await sleep(4000);window.open=()=>null;
    put('hydroPro_purch_prs',[{id:'q1',number:'PR-Q1',title:'Seeds',status:'RFQ',rfqId:'rq1',items:[{desc:'Lettuce seed',qty:2}],createdBy:'maria',workflow:[]}]);
    put('hydroPro_purch_rfqs',[{id:'rq1',number:'RFQ-Q1',prId:'q1',status:'Open',suppliers:[{name:'Verisem',email:'sales@verisem.it',phone:'+639171234567'}]}]);
    const S0=()=>J('hydroPro_purch_rfqs')[0].suppliers[0];
    __PURPRO.sendRFQ('rq1',0,'email');await sleep(30);const mail=[!!S0().openedAt,!!S0().sentAt];
    const o2=S0().openedAt;localStorage.setItem('hydroPro_purch_rfqs',JSON.stringify(J('hydroPro_purch_rfqs').map(r=>{r.suppliers[0].openedAt=null;return r;})));
    __PURPRO.sendRFQ('rq1',0,'sms');await sleep(30);const sms=!!S0().openedAt;
    __PURPRO.rfqMarkSent('rq1',0);await sleep(20);const sent=!!S0().sentAt;
    __PURPRO.sup360N('Verisem');await sleep(50);let m=document.getElementById('ppSup360');const z=m?Number(m.style.zIndex):0;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await sleep(20);const esc=!document.getElementById('ppSup360');
    __PURPRO.sup360N('Verisem');await sleep(50);m=document.getElementById('ppSup360');m.dispatchEvent(new MouseEvent('click',{bubbles:true}));await sleep(20);const bd=!document.getElementById('ppSup360');
    put('hydroPro_inv_draft_pos_v1',[{id:'d1',ref:'PO261010-001',supplier:'Yara',status:'draft',lines:[{sku:'FERT-01',name:'Calcium nitrate',qty:20}]},{id:'d2',ref:'PO261010-002',supplier:'Yara',status:'received',lines:[{sku:'FERT-01',qty:99}]}]);
    put('hydroPro_purch_pos',[{id:'pp1',number:'PO-9',status:'Issued',items:[{desc:'Calcium nitrate',code:'FERT-01',qty:50}]},{id:'pp2',number:'PO-10',status:'Cancelled',items:[{desc:'Calcium nitrate',code:'FERT-01',qty:70}]}]);
    put('hydroPro_purch_grns',[{id:'gg',poId:'pp1',lines:[{line:0,accepted:30}]}]);
    const oo=typeof window.hnxLocalOnOrder==='function'?window.hnxLocalOnOrder({sku:'FERT-01',name:'Calcium nitrate'}):-1;
    window.getCurrentUser=g0;
    return {mail,sms,sent,z:z>=2147483000,esc,bd,oo};})()`),
  expect:{mail:[true,false],sms:false,sent:true,z:true,esc:true,bd:true,oo:40} },

{ name:'🔒 QT-14: Maria (Production, no Purchasing edit) cannot delete a manual purchase record (3 rows stay); Joshane (Purchasing) cannot clear the 2 SOS-imported rows (only Eyal or Dr Amy); Dr Amy clears them → 1 manual row left (v22.31)',
  requires:NEED,seed:SEED,
  run:new Function(`return (async()=>{${PRE}await sleep(4000);try{window._renderAcctPurchasing=()=>{};}catch(e){}
    put('hydroPro_acct_purch_history',[{id:'h1',source:'manual',product:'Cement',supplier:'Holcim',qty:10,unitCost:300},{id:'h2',source:'sos',product:'Seeds',supplier:'Verisem',qty:1,unitCost:9000},{id:'h3',source:'sos',product:'Pipe',supplier:'Atlanta',qty:5,unitCost:200}]);
    as('maria');window._purchDeleteHistory('h1');await sleep(20);const m=J('hydroPro_acct_purch_history').length;
    as('joshane');window._purchClearSOSHistory();await sleep(20);const j=J('hydroPro_acct_purch_history').length;
    as('amy');window._purchClearSOSHistory();await sleep(20);const a=J('hydroPro_acct_purch_history').map(x=>x.id);
    window.getCurrentUser=g0;return {m,j,a};})()`),
  expect:{m:3,j:3,a:['h1']} }
];
