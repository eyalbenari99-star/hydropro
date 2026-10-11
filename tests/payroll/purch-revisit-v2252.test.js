/* v22.52 (Eyal 11 Oct 2026, screenshot of PR-2026-000010 "3/4 Phenolic Board" at Quotation Evaluation): "1. need to go back and
   edit if not yet final any stage 2. need to add suppliers and items as option 3. need to upload final offer option" — and
   "Unless final offer comes want to go back any stage and admin should go back any case".
   Seed: 10 pc of 3/4 phenolic board (est. ₱850), checked by Jinky, approved by Dr Amy, raised by Joshane; SWCC 10 × ₱890 VAT in and
   Triox 10 × ₱1,030 VAT in (same lead 3 d, COD); Rizal RCP Pipes on the RFQ without an offer. */
const USERS=[{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',department:'Purchasing',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},
  {username:'admin',fullname:'System Admin',role:'admin',active:true},
  {username:'rea',fullname:'Rea Santos',role:'operator',department:'Purchasing',active:true},
  {username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true},
  {username:'mea',fullname:'Mea Magracia',role:'operator',department:'HR',active:true}];
const SEED=new Function("localStorage.setItem('hydroPro_users',JSON.stringify("+JSON.stringify(USERS)+"));"+
  "['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_purch_audit'].forEach(k=>localStorage.setItem(k,'[]'));"+
  "localStorage.removeItem('hydroPro_purch_roles_v1');localStorage.removeItem('hnx_cloud_token');");
const PRE="const U="+JSON.stringify(USERS)+";const g0=window.getCurrentUser;const as=k=>{const u=U.find(x=>x.username===k);window.getCurrentUser=()=>u;};"+
  "const TS=[];window.showToast=m=>TS.push(String(m));const AL=[];window.alert=m=>AL.push(String(m));const CF=[];window.confirm=m=>{CF.push(String(m));return true;};let PR_ANS=null;window.prompt=()=>PR_ANS;"+
  "const J=k=>JSON.parse(localStorage.getItem(k)||'[]');const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));"+
  "const P=(id)=>J('hydroPro_purch_prs').find(x=>x.id===(id||'pr10'));const R=(id)=>J('hydroPro_purch_rfqs').find(x=>x.id===(id||'rfq10'));"+
  "const setP=(id,f)=>{const a=J('hydroPro_purch_prs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_prs',a);};"+
  "const setR=(id,f)=>{const a=J('hydroPro_purch_rfqs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_rfqs',a);};"+
  "const val=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;return !!e;};"+
  "const rd=x=>Math.round(x*100)/100;const view=()=>(document.getElementById('view-acct_purch_pro')||{}).innerText||'';"+
  "const pdf=(mb,name)=>new File([new Uint8Array(Math.round(mb*1024*1024))],name||'final.pdf',{type:'application/pdf'});"+
  "const pick=(id,f)=>{const e=document.getElementById(id);if(!e)return false;const dt=new DataTransfer();dt.items.add(f);e.files=dt.files;return true;};"+
  "const SW='SWCC Hardware & Construction Supplies',TX='Triox Enterprise OPC',RZ='Rizal RCP Pipes';"+
  "const T=Date.now()-3*864e5;"+
  "const Q=(u,ex)=>Object.assign({qty:10,unitPrice:u,vatIncl:true,delivery:0,total:u*10,brand:'',validUntil:'2027-01-31',deliveryDays:3,payTerms:'COD',warranty:'1 year',notes:'',deliverToOk:false,file:null,at:T,by:'Jinky Pagtama'},ex||{});"+
  "const PR10=(ex)=>Object.assign({id:'pr10',number:'PR-2026-000010',title:'3/4 Phenolic Board',dept:'Construction',project:'GH15',klass:'Construction materials',company:'APTI',needBy:'2027-01-31',priority:'Normal',"+
    "justification:'Phenolic board for the GH15 formworks — the old boards are worn out and split.',items:[{desc:'3/4 Phenolic board',code:'',qty:10,unit:'pc',unitCost:850,brand:'',warehouse:'',remarks:''}],"+
    "status:'Quotation Evaluation',rfqId:'rfq10',createdBy:'joshane',createdAt:T,revision:1,checkedBy:'Jinky Pagtama',checkedAt:T+1000,approvedBy:'Dr Amy Patdu',approvedAt:T+2000,approvedEstimate:8500,"+
    "reviewedBy:'Rea Santos',reviewedAt:T+3000,buyer:'rea',workflow:[{stage:'Draft',at:T,by:'Joshane Espinosa',note:'created'},{stage:'Purchasing Review',at:T+2000,by:'Dr Amy Patdu',note:'Approved by Dr Amy Patdu'}],overrides:[]},ex||{});"+
  "const RFQ10=(ex)=>Object.assign({id:'rfq10',number:'RFQ-2026-000010',prId:'pr10',status:'Open',closingDate:'2026-10-15',createdAt:T,updatedAt:T,"+
    "suppliers:[{name:SW,email:'swcc@x.ph',phone:'',sentAt:T,channel:'email',quote:Q(890)},{name:TX,email:'triox@x.ph',phone:'',sentAt:T,channel:'email',quote:Q(1030)},{name:RZ,email:'',phone:'0917 555 0101',sentAt:null,channel:null,quote:null}]},ex||{});"+
  "const OPTB=(ex)=>Object.assign({id:'opt_b1',label:'B',spec:'Marine plywood 3/4',itemIdx:0,quote:Q(820),addedBy:'Jinky Pagtama',addedAt:T},ex||{});"+
  "const inbox=()=>J('hydroPro_pa_inbox_v1');const told=re=>inbox().filter(x=>re.test(x.title)).map(x=>x.user).sort();"+
  "const lastWf=(id)=>{const w=(P(id).workflow||[]);return w[w.length-1]||{};};";
const NEED="!!(window.__PURPRO&&window.__PURPRO.goBack&&window.__PURPRO.canGoBack)";
const run=body=>new Function('return (async()=>{'+PRE+'await sleep(3000);'+body+'})()');
module.exports=[
{ name:'↩ Evaluation → RFQ (Jinky, "Rizal must quote too"): SWCC ₱794.64 landed / ₱7,946.43, Triox ₱919.64 / ₱9,196.43 (+15.7% / +₱1,250.00) before and after; RFQ stays Open, both offers and Dr Amy\'s approval kept, workflow "↩ Back from Quotation Evaluation to RFQ", audit stage:back; the stepper offers 7 earlier stages; a stale 2nd press does nothing (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);as('jinky');
    const A=__PURPRO.a2a('pr10'),r=n=>A.rows.find(x=>x.name===n);
    const before=[rd(r(SW).landedUnit),rd(r(SW).normTotal),rd(r(TX).landedUnit),rd(r(TX).normTotal),r(TX).gapPct,r(TX).gapAmt,A.best.label];
    const ok=__PURPRO.goBack('pr10','Quotation Evaluation','RFQ','Rizal must quote too');
    const p=P(),rf=R(),w=lastWf(),au=J('hydroPro_purch_audit').filter(x=>x.action==='stage:back').map(x=>x.detail);
    const A2=__PURPRO.a2a('pr10'),r2=n=>A2.rows.find(x=>x.name===n);
    __PURPRO.openPR('pr10');await sleep(300);
    const v=document.getElementById('view-acct_purch_pro'),chips=v.querySelectorAll('.pp-pipe span.pp-back').length,btn=/Go back…/.test(v.innerText);
    const n=p.workflow.length;const stale=__PURPRO.goBack('pr10','Quotation Evaluation','RFQ','again');
    window.getCurrentUser=g0;
    return {before,ok,status:p.status,rfq:[rf.status,rf.suppliers.length,rf.suppliers.filter(s=>s.quote).map(s=>s.name+' '+s.quote.unitPrice).join(' | ')],
      kept:[p.checkedBy,p.approvedBy,p.approvedEstimate],note:w.note,back:w.back&&[w.back.from,w.back.to],au,after:[rd(r2(SW).landedUnit),rd(r2(TX).normTotal)],chips,btn,stale:[stale,P().status,P().workflow.length===n]};`),
  expect:{before:[794.64,7946.43,919.64,9196.43,15.7,1250,'SWCC Hardware & Construction Supplies'],ok:true,status:'RFQ',
    rfq:['Open',3,'SWCC Hardware & Construction Supplies 890 | Triox Enterprise OPC 1030'],kept:['Jinky Pagtama','Dr Amy Patdu',8500],
    note:'↩ Back from Quotation Evaluation to RFQ: Rizal must quote too · to redo: the steps from RFQ on',back:['Quotation Evaluation','RFQ'],
    au:['Quotation Evaluation → RFQ: Rizal must quote too'],after:[794.64,9196.43],chips:7,btn:true,stale:[false,'RFQ',true]} },

{ name:'↩ Approval → Department Approval (Rea, the buyer, "budget changed"): Jinky\'s check, Dr Amy\'s approval (₱8,500) and the purchasing review are cleared with their values kept in the workflow; Jinky gets "📝 waits for your content check", Joshane (requester), Eyal and Dr Amy get "↩ sent back", Rea (who did it) and the admin login nothing; both offers kept (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10({status:'Approval'})]);put('hydroPro_purch_rfqs',[RFQ10()]);as('rea');
    const redo=__PURPRO.canGoBack('pr10','Department Approval');
    const ok=__PURPRO.goBack('pr10','Approval','Department Approval','budget changed');
    const p=P(),w=lastWf(),c=(w.back||{}).cleared||{};
    const out={redo,ok,status:p.status,gone:[p.checkedBy,p.checkedAt,p.approvedBy,p.approvedAt,p.approvedEstimate,p.reviewedBy].map(x=>x===undefined),buyer:p.buyer,
      cleared:[c.checkedBy,c.approvedBy,c.approvedEstimate,c.reviewedBy],note:/^↩ Back from Approval to Department Approval: budget changed · to redo: Jinky Pagtama's content check, Dr Amy Patdu's approval, the purchasing review \\(Rea Santos\\), the stock check$/.test(w.note||''),
      check:told(/waits for your content check/),back:told(/sent back to Department Approval/),offers:R().suppliers.filter(s=>s.quote).length};
    window.getCurrentUser=g0;return out;`),
  expect:{redo:null,ok:true,status:'Department Approval',gone:[true,true,true,true,true,true],buyer:'rea',cleared:['Jinky Pagtama','Dr Amy Patdu',8500,'Rea Santos'],note:true,
    check:['jinky'],back:['amy','eyal','joshane'],offers:2} },

{ name:'↩ Purchase Order (draft PO-2026-000010 ₱8,900 to SWCC) → Quotation Evaluation: Jinky refused (undoes an award — Eyal or Dr Amy); Dr Amy: PO Cancelled, poId null, RFQ Open, award cleared (kept in the workflow); 📤 Issue PO on the cancelled PO does nothing; the cancelled PO is not offered for an invoice, refused by Log & match and not counted in Nexi Health "POs still open" (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10({status:'Purchase Order',poId:'po10'})]);
    put('hydroPro_purch_rfqs',[RFQ10({status:'Awarded',awardedTo:SW,awardedTotal:8900})]);
    put('hydroPro_purch_pos',[{id:'po10',number:'PO-2026-000010',prId:'pr10',rfqId:'rfq10',company:'APTI',supplier:SW,status:'Draft',createdAt:T,issuedAt:null,revisions:[],items:[{desc:'3/4 Phenolic board',qty:10,unit:'pc',unitCost:890}],total:8900}]);
    as('jinky');TS.length=0;const j=__PURPRO.goBack('pr10','Purchase Order','Quotation Evaluation','SWCC final price coming');const jt=TS.some(t=>/only Eyal or Dr Amy/.test(t)),js=P().status;
    as('amy');const ok=__PURPRO.goBack('pr10','Purchase Order','Quotation Evaluation','SWCC final price coming');
    const p=P(),rf=R(),po=J('hydroPro_purch_pos')[0],c=(lastWf().back||{}).cleared||{};
    setP('pr10',x=>{x.status='Purchase Order';x.poId='po10';});TS.length=0;__PURPRO.issuePO('pr10');const po2=J('hydroPro_purch_pos')[0];
    setP('pr10',x=>{x.status='Quotation Evaluation';x.poId=null;});
    __PURPRO.tab('invs');await sleep(200);const offered=document.querySelectorAll('#ppInvPo option').length;
    const sel=document.getElementById('ppInvPo');if(sel)sel.remove();
    const mk=(id,v)=>{let e=document.getElementById(id);if(!e){e=document.createElement('input');e.id=id;e.style.display='none';document.body.appendChild(e);}e.value=v;};
    mk('ppInvPo','po10');mk('ppInvNum','INV-1');mk('ppInvAmt','8900');AL.length=0;__PURPRO.addInvoice();const inv=[J('hydroPro_purch_invoices').length,AL.some(m=>/only against an issued purchase order|Issue a purchase order first/.test(m))];
    let health=null;try{const k=window.HNX_COCKPIT_KPIS.accounting();const row=k.find(x=>/POs still open/.test(x[1]));health=row?row[0]:'?';}catch(e){health='err '+e.message;}
    window.getCurrentUser=g0;
    return {j:[j,jt,js],ok,status:p.status,poId:p.poId,rfq:[rf.status,rf.awardedTo,rf.awardedTotal],po:[po.status,!!(po.cancelled&&/sent back from Purchase Order to Quotation Evaluation: SWCC final price coming/.test(po.cancelled.reason))],
      cleared:[c.poId,c.po&&c.po.number,c.po&&c.po.status,c.rfq&&c.rfq.awardedTo,c.rfq&&c.rfq.awardedTotal],issue:[po2.status,TS.some(t=>/only a draft PO/.test(t))],offered,inv,health};`),
  expect:{j:[false,true,'Purchase Order'],ok:true,status:'Quotation Evaluation',poId:null,rfq:['Open',null,null],po:['Cancelled',true],
    cleared:['po10','PO-2026-000010','Draft','SWCC Hardware & Construction Supplies',8900],issue:['Cancelled',true],offered:0,inv:[0,true],health:0} },

{ name:'↩ Evaluation → Supplier Sourcing: RFQ-2026-000010 stays Open with its 2 offers, the sourcing screen says it is still open; ➡ Continue → RFQ with the same RFQ (one RFQ in the store); sent back again, ticking Wilcon Depot adds it to RFQ-2026-000010 (4 suppliers, no new RFQ number) (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    put('hydroPro_acct_vendors',[{id:'v1',name:'Wilcon Depot',email:'sales@wilcon.ph',phone:'',category:'Construction materials · phenolic board plywood'}]);
    as('jinky');const ok=__PURPRO.goBack('pr10','Quotation Evaluation','Supplier Sourcing','add Wilcon');
    const s1=[P().status,R().status,R().suppliers.filter(s=>s.quote).length];
    __PURPRO.openPR('pr10');await sleep(300);const said=/RFQ-2026-000010 is still open/.test(view())&&/Continue with RFQ-2026-000010/.test(view());
    __PURPRO.rfqContinue('pr10');const s2=[P().status,P().rfqId,J('hydroPro_purch_rfqs').length,lastWf().note];
    __PURPRO.goBack('pr10','RFQ','Supplier Sourcing','add Wilcon after all');__PURPRO.openPR('pr10');await sleep(300);
    const boxes=[...document.querySelectorAll('.ppSrcPick')];const row=boxes.find(b=>/Wilcon Depot/.test((b.closest('tr')||{}).textContent||''));if(row)row.checked=true;
    const label=/Add the selected to RFQ-2026-000010/.test(view());
    __PURPRO.createRFQ('pr10');
    const rf=J('hydroPro_purch_rfqs');
    window.getCurrentUser=g0;
    return {ok,s1,said,s2,found:!!row,label,s3:[P().status,rf.length,rf[0].number,rf[0].suppliers.length,!!(rf[0].suppliers.find(s=>s.name==='Wilcon Depot')||{}).addedLate,rf[0].suppliers.filter(s=>s.quote).length]};`),
  expect:{ok:true,s1:['Supplier Sourcing','Open',2],said:true,s2:['RFQ','rfq10',1,'Back to RFQ-2026-000010 — 3 suppliers, 2 offers kept'],found:true,label:true,
    s3:['RFQ',1,'RFQ-2026-000010',4,true,2]} },

{ name:'➕ At Quotation Evaluation Jinky adds Wilcon Depot (email from the supplier card) — its offer form opens at once; 10 × ₱950 VAT in → ₱848.21 landed, ₱8,482.14, +6.7% / +₱535.71 vs SWCC; 3 rows; Rizal RCP Pipes is listed under "No offer yet" (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    put('hydroPro_acct_vendors',[{id:'v1',name:'Wilcon Depot',email:'sales@wilcon.ph',phone:''}]);
    as('jinky');__PURPRO.openPR('pr10');await sleep(300);
    const none=/No offer yet:[\\s\\S]*Rizal RCP Pipes/.test(view());
    val('ppAddSupN','Wilcon Depot');val('ppAddSupE','');val('ppAddSupP','');__PURPRO.rfqAddSupplier('rfq10');await sleep(200);
    const form=!!document.getElementById('ppQForm')&&/Offer — Wilcon Depot/.test(document.getElementById('ppQForm').innerText);
    val('ppQq','10');val('ppQu','950');val('ppQv','incl');val('ppQd','3');val('ppQp','COD');val('ppQvu','2027-01-31');
    __PURPRO.saveQuote('rfq10',3);await sleep(200);
    const A=__PURPRO.a2a('pr10'),w=A.rows.find(x=>x.name==='Wilcon Depot')||{};
    window.getCurrentUser=g0;
    return {none,form,email:(R().suppliers.find(s=>s.name==='Wilcon Depot')||{}).email,rows:A.rows.length,w:[rd(w.landedUnit),rd(w.normTotal),w.gapPct,w.gapAmt],status:P().status};`),
  expect:{none:true,form:true,email:'sales@wilcon.ph',rows:3,w:[848.21,8482.14,6.7,535.71],status:'Quotation Evaluation'} },

{ name:'🅱 SWCC Option B "Marine plywood 3/4" 10 × ₱820 → ₱732.14 landed, ₱7,321.43, CHEAPEST and BEST; SWCC A +8.5% / +₱625.00; Triox +25.6% / +₱1,875.00; workflow "Option B added"; ✏ SWCC A ₱890 → ₱880 keeps Option B and adds a history row (₱890); ✕ Option B needs a reason, then it is kept under removedOptions (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    as('jinky');__PURPRO.openPR('pr10');await sleep(200);__PURPRO.quoteToggle('rfq10:0:new');await sleep(200);
    const f=!!document.getElementById('ppQo');val('ppQo','Marine plywood 3/4');val('ppQq','10');val('ppQu','820');val('ppQv','incl');
    __PURPRO.saveQuote('rfq10',0,'new');await sleep(200);
    const A=__PURPRO.a2a('pr10'),by=k=>A.rows.find(x=>x.label===k)||{};
    const b=by(SW+' · Option B'),a=by(SW+' · Option A'),t=by(TX);
    const o=R().suppliers[0].options||[];
    const shown=/Option B/.test(view())&&/Marine plywood 3\\/4/.test(view());const wf0=lastWf().note||'';
    __PURPRO.quoteToggle('rfq10:0');await sleep(150);val('ppQu','880');__PURPRO.saveQuote('rfq10',0);await sleep(150);
    const s0=R().suppliers[0];
    PR_ANS=null;__PURPRO.optRemove('rfq10',0,o[0].id);const kept=(R().suppliers[0].options||[]).length;
    PR_ANS='SWCC withdrew the plywood';__PURPRO.optRemove('rfq10',0,o[0].id);const s1=R().suppliers[0];
    window.getCurrentUser=g0;
    return {f,opt:[o.length,o[0]&&o[0].label,o[0]&&o[0].spec,o[0]&&o[0].addedBy],b:[rd(b.landedUnit),rd(b.normTotal),A.cheapest.key===b.key,A.best.key===b.key,(b.flags||[])[0]],
      a:[a.gapPct,a.gapAmt],t:[t.gapPct,t.gapAmt],wf:/^Option B added: SWCC Hardware & Construction Supplies — Marine plywood 3\\/4 · 10 × ₱820\\.00$/.test(wf0),shown,
      edit:[s0.quote.unitPrice,(s0.options||[]).length,(s0.quote.history||[]).map(h=>h.unitPrice)],rm:[kept,(s1.options||[]).length,(s1.removedOptions||[]).map(x=>x.label+' '+x.removedReason)]};`),
  expect:{f:true,opt:[1,'B','Marine plywood 3/4','jinky'],b:[732.14,7321.43,true,true,'Option B: Marine plywood 3/4'],a:[8.5,625],t:[25.6,1875],wf:true,shown:true,
    edit:[880,1,[890]],rm:[1,0,['B SWCC withdrew the plywood']]} },

{ name:'🏅 Award: Dr Amy\'s award screen goes stale when Jinky goes back and Triox re-quotes ₱1,000 → that award does nothing; Triox over Nexi\'s pick without a justification makes no PO; Dr Amy awards SWCC Option B after confirming the alternative → PO ₱8,200, option B, line "— Option B: Marine plywood 3/4", RFQ awarded Option B, comparison frozen (3 rows); a second award makes no second PO (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10({status:'Approval'})]);
    put('hydroPro_purch_rfqs',[RFQ10({suppliers:[{name:SW,email:'swcc@x.ph',sentAt:T,quote:Q(890),options:[OPTB()]},{name:TX,email:'triox@x.ph',sentAt:T,quote:Q(1030)},{name:RZ,phone:'0917',sentAt:null,quote:null}]})]);
    as('amy');__PURPRO.openPR('pr10');await sleep(300);const stamp=R().updatedAt;const optKey=SW+'#opt:opt_b1';
    const listed=[...document.querySelectorAll('#ppAwardSel option')].map(o=>o.value);
    as('jinky');__PURPRO.goBack('pr10','Approval','Quotation Evaluation','Triox re-quotes');__PURPRO.quoteToggle('rfq10:1');await sleep(150);val('ppQu','1000');__PURPRO.saveQuote('rfq10',1);await sleep(150);
    __PURPRO.simpleAdvance('pr10','Evaluation complete','Quotation Evaluation');
    as('amy');TS.length=0;const sel0=document.getElementById('ppAwardSel');if(sel0)sel0.remove();
    __PURPRO.award('pr10','','Approval',stamp);const stale=[J('hydroPro_purch_pos').length,P().status,TS.some(t=>/changed since this screen was drawn/.test(t))];
    __PURPRO.openPR('pr10');await sleep(300);
    const sel=document.getElementById('ppAwardSel');sel.value=TX;PR_ANS=null;__PURPRO.award('pr10','','Approval',R().updatedAt);const tri=[J('hydroPro_purch_pos').length,P().status];
    sel.value=optKey;CF.length=0;__PURPRO.award('pr10','','Approval',R().updatedAt);
    const po=J('hydroPro_purch_pos')[0]||{},p=P(),rf=R();
    __PURPRO.award('pr10','','Approval',R().updatedAt);
    window.getCurrentUser=g0;
    return {listed,stale,tri,conf:CF.some(m=>/Option B is an alternative \\(Marine plywood 3\\/4\\) — award it\\?/.test(m)),
      po:[po.total,po.supplier,(po.option||{}).label,/ — Option B: Marine plywood 3\\/4$/.test(((po.items||[])[0]||{}).desc||''),Math.round(((po.items||[])[0]||{}).unitCost*100)/100],
      pr:[p.status,p.poId===po.id,(p.awardSnapshot||{}).label,((p.awardSnapshot||{}).rows||[]).length],rfq:[rf.status,rf.awardedTo,rf.awardedOption],
      note:/^Awarded to SWCC Hardware & Construction Supplies · Option B · ₱8,200\\.00 · PO draft PO-\\d{4}-\\d{6} · alternative Option B \\(Marine plywood 3\\/4\\) confirmed by amy$/.test(lastWf().note||''),pos:J('hydroPro_purch_pos').length};`),
  expect:{listed:['SWCC Hardware & Construction Supplies#opt:opt_b1','SWCC Hardware & Construction Supplies','Triox Enterprise OPC'],stale:[0,'Approval',true],tri:[0,'Approval'],conf:true,
    po:[8200,'SWCC Hardware & Construction Supplies','B',true,820],pr:['Purchase Order',true,'SWCC Hardware & Construction Supplies · Option B',3],rfq:['Awarded','SWCC Hardware & Construction Supplies','B'],note:true,pos:1} },

{ name:'📎 Final offer SWCC A — 2.0 MB PDF to the Nexi cloud (mocked): key purchasing/PR-2026-000010/RFQ-2026-000010/SWCC…_A_<date>_<uid>_SWCC_final.pdf, Content-Type application/pdf; ₱890 → ₱850 → ₱758.93 landed, ₱7,589.29, Triox +21.2% / +₱1,607.14; history[0] ₱890; no data: in the RFQ store; 📎 FINAL opens hnxFilesOpen(key) for Eyal; Eyal and Dr Amy told ₱758.93 landed; a 2nd final the same day keeps both files; ✏ edit after it keeps the final file and the history; then Jinky cannot go back (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    const calls=[];localStorage.setItem('hnx_cloud_token','test-token');const api0=window.__hnxApi;
    window.__hnxApi=async(path,o)=>{calls.push({path,ct:o.headers['Content-Type'],size:o.body&&o.body.size});const k=decodeURIComponent(path.split('key=')[1].split('&')[0]);return {ok:true,key:k};};
    as('jinky');__PURPRO.openPR('pr10');await sleep(200);__PURPRO.quoteToggle('rfq10:0:A:final');await sleep(200);
    const hasFile=pick('ppQff',pdf(2,'SWCC final.pdf'));val('ppQu','850');
    await __PURPRO.saveQuote('rfq10',0,'A','final');await sleep(100);
    const q=R().suppliers[0].quote,key=(q.finalFile||{}).key||'',nCalls=calls.length;
    const A=__PURPRO.a2a('pr10'),sw=A.rows.find(x=>x.name===SW),tx=A.rows.find(x=>x.name===TX);
    const noData=!/data:/.test(localStorage.getItem('hydroPro_purch_rfqs'));
    const wf=lastWf().note,ib=inbox().filter(x=>/final offer from SWCC/.test(x.title));
    __PURPRO.openPR('pr10');await sleep(200);const chip=/📎 FINAL/.test(view())&&/was ₱890\\.00/.test(view());
    as('eyal');const opened=[];const fo=window.hnxFilesOpen;window.hnxFilesOpen=k=>opened.push(k);__PURPRO.openOfferFile('rfq10',0,'A');window.hnxFilesOpen=fo;
    as('jinky');__PURPRO.quoteToggle('rfq10:0:A:final');await sleep(150);pick('ppQff',pdf(1,'SWCC final v2.pdf'));val('ppQu','845');await __PURPRO.saveQuote('rfq10',0,'A','final');await sleep(100);
    const q2=R().suppliers[0].quote;
    __PURPRO.quoteToggle('rfq10:0');await sleep(150);val('ppQd','5');__PURPRO.saveQuote('rfq10',0);await sleep(100);
    const q3=R().suppliers[0].quote;
    const jb=__PURPRO.canGoBack('pr10','RFQ');
    localStorage.removeItem('hnx_cloud_token');window.__hnxApi=api0;window.getCurrentUser=g0;
    return {hasFile,calls:nCalls,calls2:calls.length,ct:calls[0]&&calls[0].ct,size:calls[0]&&calls[0].size,
      key:/^purchasing\\/PR-2026-000010\\/RFQ-2026-000010\\/SWCC_Hardware_Construction_Supplies_A_\\d{4}-\\d{2}-\\d{2}_f_[a-z0-9]+_SWCC_final\\.pdf$/.test(key),
      q:[q.final,q.unitPrice,q.total,q.finalBy,(q.history||[]).map(h=>h.unitPrice),(q.finalFile||{}).name,(q.finalFile||{}).size],
      a2a:[rd(sw.landedUnit),rd(sw.normTotal),tx.gapPct,tx.gapAmt],noData,
      wf:/^📎 Final offer: SWCC Hardware & Construction Supplies \\(A\\) ₱890\\.00 → ₱850\\.00 · SWCC final\\.pdf$/.test(wf||''),
      told:ib.map(x=>x.user).sort(),landedTold:ib.every(x=>/₱758\\.93 per unit landed/.test(x.body)),pf:(P().finalOffer||{}).sup,chip,opened:opened[0]===key,
      two:[q2.unitPrice,(q2.finalFile||{}).key!==key,((q2.history||[])[1]||{}).finalFile&&q2.history[1].finalFile.key===key,(q2.history||[]).length],
      edit:[q3.final,(q3.finalFile||{}).key===(q2.finalFile||{}).key,q3.deliveryDays,(q3.history||[]).length,q3.unitPrice],jb};`),
  expect:{hasFile:true,calls:1,calls2:2,ct:'application/pdf',size:2097152,key:true,q:[true,850,8500,'jinky',[890],'SWCC final.pdf',2097152],
    a2a:[758.93,7589.29,21.2,1607.14],noData:true,wf:true,told:['amy','eyal'],landedTold:true,pf:'SWCC Hardware & Construction Supplies',chip:true,opened:true,
    two:[845,true,true,2],edit:[true,true,5,3,845],jb:'Final offer received (SWCC Hardware & Construction Supplies) — only Admin can go back'} },

{ name:'📎 Final offer refused or kept in the request: not signed in + 3 MB → refused (2.5 MB without the cloud), still ₱890; 12 MB → refused (10 MB max); cloud HTTP 500 + 1 MB PDF → kept in the request (data:, "cloud upload failed"), ₱850; at Approval the final offer is refused ("↩ Go back to the RFQ / evaluation first") (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    as('jinky');__PURPRO.openPR('pr10');await sleep(200);
    const tryFinal=async(i,mb,u)=>{__PURPRO.quoteToggle('rfq10:'+i+':A:final');await sleep(150);pick('ppQff',pdf(mb,'final '+mb+'MB.pdf'));val('ppQu',u);AL.length=0;await __PURPRO.saveQuote('rfq10',i,'A','final');await sleep(100);return AL.slice();};
    const a1=await tryFinal(0,3,'850');const q1=R().suppliers[0].quote;
    __PURPRO.quoteToggle(null);const a2=await tryFinal(0,12,'850');const q2=R().suppliers[0].quote;
    localStorage.setItem('hnx_cloud_token','t');const api0=window.__hnxApi;window.__hnxApi=async()=>{throw new Error('HTTP 500');};
    __PURPRO.quoteToggle(null);const a3=await tryFinal(0,1,'850');const q3=R().suppliers[0].quote;
    localStorage.removeItem('hnx_cloud_token');window.__hnxApi=api0;
    setP('pr10',x=>{x.status='Approval';});__PURPRO.quoteToggle(null);await sleep(50);__PURPRO.quoteToggle('rfq10:1:A:final');AL.length=0;
    const fx=document.createElement('input');fx.type='file';fx.id='ppQff';fx.style.display='none';document.body.appendChild(fx);pick('ppQff',pdf(1,'triox.pdf'));
    await __PURPRO.saveQuote('rfq10',1,'A','final');const a4=AL.slice();fx.remove();
    window.getCurrentUser=g0;
    return {a1:a1.some(m=>/at most 2\\.5 MB can be kept/.test(m)),q1:[q1.unitPrice,!!q1.final],a2:a2.some(m=>/at most 10 MB/.test(m)),q2:[q2.unitPrice,!!q2.final],
      q3:[q3.unitPrice,q3.final,!!(q3.finalFile&&q3.finalFile.local),/^data:application\\/pdf/.test((q3.finalFile||{}).data||''),/cloud upload failed \\(HTTP 500\\)/.test((q3.finalFile||{}).note||'')],
      a4:a4.some(m=>/Go back to the RFQ \\/ evaluation first/.test(m)),t:!!R().suppliers[1].quote.final};`),
  expect:{a1:true,q1:[890,false],a2:true,q2:[890,false],q3:[850,true,true,true,true],a4:true,t:false} },

{ name:'🔒 After SWCC\'s final offer: Jinky cannot go back (only Admin) — the stage card says so and no stage chip is clickable; Dr Amy (approver, not Admin) cannot either; Admin goes back from Approval to RFQ ("re-quote after the final") → RFQ Open, the final offer and both offers kept, Joshane (requester) and Rea (buyer) told; Admin is offered every earlier stage (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10({status:'Approval',finalOffer:{at:T,by:'Jinky Pagtama',sup:SW,label:'A'}})]);
    put('hydroPro_purch_rfqs',[RFQ10({suppliers:[{name:SW,email:'swcc@x.ph',sentAt:T,quote:Q(850,{final:true,finalAt:T,finalBy:'Jinky Pagtama',finalFile:{key:'purchasing/PR-2026-000010/RFQ-2026-000010/SWCC_A.pdf',name:'SWCC final.pdf',mime:'application/pdf',size:1000},history:[Q(890)]})},{name:TX,email:'triox@x.ph',sentAt:T,quote:Q(1030)}]})]);
    as('jinky');const jb=__PURPRO.canGoBack('pr10','RFQ');TS.length=0;const j=__PURPRO.goBack('pr10','Approval','RFQ','x');
    __PURPRO.openPR('pr10');await sleep(300);const v1=document.getElementById('view-acct_purch_pro');const card=/Final offer received \\(SWCC Hardware & Construction Supplies\\) — only Admin can go back/.test(v1.innerText),chips=v1.querySelectorAll('.pp-back').length;
    as('amy');const ab=__PURPRO.canGoBack('pr10','Quotation Evaluation');
    as('admin');const targets=__PURPRO.backTargets('pr10');const ok=__PURPRO.goBack('pr10','Approval','RFQ','re-quote after the final');
    const p=P(),rf=R();
    window.getCurrentUser=g0;
    return {jb,j:[j,TS.some(t=>/only Admin can go back/.test(t))],card,chips,ab,targets,ok,status:p.status,rfq:[rf.status,rf.suppliers[0].quote.final,rf.suppliers.filter(s=>s.quote).length],told:told(/sent back to RFQ/)};`),
  expect:{jb:'Final offer received (SWCC Hardware & Construction Supplies) — only Admin can go back',j:[false,true],card:true,chips:0,
    ab:'Final offer received (SWCC Hardware & Construction Supplies) — only Admin can go back',
    targets:['Quotation Evaluation','RFQ','Supplier Sourcing','Inventory Verification','Purchasing Review','Department Approval','AI Validation','Submitted','Draft'],ok:true,status:'RFQ',rfq:['Open',true,2],told:['joshane','rea']} },

{ name:'🔒 Mea (no Purchasing edit) cannot go back, add an option or upload a final offer; with Buyers = Rea, Jinky cannot send the request back to RFQ (the Buyers\' step) but can to Department Approval, and Rea can to RFQ (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    as('mea');const edit=__PURPRO.canEdit();const mb=__PURPRO.canGoBack('pr10','RFQ');TS.length=0;const g=__PURPRO.goBack('pr10','Quotation Evaluation','RFQ','x');
    const fx=['ppQo','ppQq','ppQu'].map(id=>{const e=document.createElement('input');e.id=id;e.style.display='none';document.body.appendChild(e);return e;});fx[0].value='Marine plywood';fx[1].value='10';fx[2].value='820';
    TS.length=0;__PURPRO.saveQuote('rfq10',0,'new');const opt=[(R().suppliers[0].options||[]).length,TS.some(t=>/Purchasing changes need/.test(t))];fx.forEach(e=>e.remove());
    put('hydroPro_purch_roles_v1',{approvers:[],checkers:[],buyers:['rea'],warehouse:[]});
    as('jinky');const jr=__PURPRO.canGoBack('pr10','RFQ'),jd=__PURPRO.canGoBack('pr10','Department Approval');
    as('rea');const rr=__PURPRO.canGoBack('pr10','RFQ');
    localStorage.removeItem('hydroPro_purch_roles_v1');window.getCurrentUser=g0;
    return {edit,mb,g:[g,P().status],opt,jr,jd,rr};`),
  expect:{edit:false,mb:'Going back needs Accounting or Purchasing EDIT — ask Admin ▸ Users',g:[false,'Quotation Evaluation'],opt:[0,true],
    jr:'Sourcing, RFQs and offers are the Buyers\' step (Mission Control ▸ 👥 Purchasing roles)',jd:null,rr:null} },

{ name:'🚨 Back from Receiving with goods received: PO-2026-000011 has 6 of 10 received and invoice INV-77 → Dr Amy refused (only Admin), Admin without typing BACK refused; with BACK the request is at Quotation Evaluation, the PO stays Partially Delivered "reopened by admin" (history row), the GRN and the invoice are untouched, a red banner says goods were received, and a new award is blocked; PR-2026-000012 with an issued PO and nothing received → Dr Amy goes back to Approval, PO Cancelled, RFQ Open (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`const pr11=PR10({id:'pr11',number:'PR-2026-000011',status:'Receiving',rfqId:'rfq11',poId:'po11'}),pr12=PR10({id:'pr12',number:'PR-2026-000012',status:'Purchase Order',rfqId:'rfq12',poId:'po12'});
    put('hydroPro_purch_prs',[pr11,pr12]);
    put('hydroPro_purch_rfqs',[RFQ10({id:'rfq11',number:'RFQ-2026-000011',prId:'pr11',status:'Awarded',awardedTo:SW,awardedTotal:8900}),RFQ10({id:'rfq12',number:'RFQ-2026-000012',prId:'pr12',status:'Awarded',awardedTo:TX,awardedTotal:10300})]);
    put('hydroPro_purch_pos',[{id:'po11',number:'PO-2026-000011',prId:'pr11',rfqId:'rfq11',supplier:SW,status:'Partially Delivered',issuedAt:T,total:8900,items:[{desc:'3/4 Phenolic board',qty:10,unit:'pc',unitCost:890}],revisions:[]},
      {id:'po12',number:'PO-2026-000012',prId:'pr12',rfqId:'rfq12',supplier:TX,status:'Issued',issuedAt:T,total:10300,items:[{desc:'3/4 Phenolic board',qty:10,unit:'pc',unitCost:1030}],revisions:[]}]);
    put('hydroPro_purch_grns',[{id:'g11',number:'GRN-2026-000011',poId:'po11',date:'2026-10-09',receiver:'Warehouse',lines:[{line:0,accepted:6,rejected:0}],createdAt:T}]);
    put('hydroPro_purch_invoices',[{id:'i77',number:'INV-77',poId:'po11',amount:5340,status:'Pending',matchStatus:'Waiting GRN',createdAt:T}]);
    as('amy');TS.length=0;const a=__PURPRO.goBack('pr11','Receiving','Quotation Evaluation','wrong spec');const at=TS.some(t=>/only Admin can go back/.test(t));
    as('admin');PR_ANS='nope';const n1=__PURPRO.goBack('pr11','Receiving','Quotation Evaluation','wrong spec');const st1=P('pr11').status;
    PR_ANS='BACK';const ok=__PURPRO.goBack('pr11','Receiving','Quotation Evaluation','wrong spec');
    const p=P('pr11'),po=J('hydroPro_purch_pos').find(x=>x.id==='po11'),c=(lastWf('pr11').back||{}).cleared||{};
    __PURPRO.openPR('pr11');await sleep(300);const banner=/🚨 PO-2026-000011 \\(Partially Delivered\\)[\\s\\S]*goods were already RECEIVED \\(6\\)/.test(view());
    as('jinky');__PURPRO.simpleAdvance('pr11','Evaluation complete','Quotation Evaluation');
    as('amy');AL.length=0;const sl=document.getElementById('ppAwardSel');if(sl)sl.remove();__PURPRO.award('pr11','','Approval');const blocked=[AL.some(m=>/PO-2026-000011 \\(Partially Delivered\\) already exists for PR-2026-000011/.test(m)),J('hydroPro_purch_pos').length];
    PR_ANS=null;const b12=__PURPRO.goBack('pr12','Purchase Order','Approval','Triox cannot deliver');
    const p12=P('pr12'),po12=J('hydroPro_purch_pos').find(x=>x.id==='po12');
    window.getCurrentUser=g0;
    return {a:[a,at],n1:[n1,st1],ok,status:p.status,poId:p.poId,reopened:p.reopenedPOs,po:[po.status,(po.reopenedByAdmin||{}).by,/Reopened by admin — PR-2026-000011 sent back from Receiving to Quotation Evaluation: wrong spec/.test(((po.history||[]).slice(-1)[0]||{}).note||'')],
      kept:[J('hydroPro_purch_grns').length,J('hydroPro_purch_invoices').length,J('hydroPro_purch_invoices')[0].status],cleared:c.po&&c.po.kept,rfq:R('rfq11').status,banner,blocked,
      b12:[b12,p12.status,p12.poId,po12.status,R('rfq12').status]};`),
  expect:{a:[false,true],n1:[false,'Receiving'],ok:true,status:'Quotation Evaluation',poId:null,reopened:['po11'],po:['Partially Delivered','admin',true],
    kept:[1,1,'Pending'],cleared:'reopened by admin — 6 received, 1 invoice(s) kept',rfq:'Open',banner:true,blocked:[true,2],
    b12:[true,'Approval',null,'Cancelled','Open']} },

{ name:'↩ Back to Draft: Jinky sends PR-2026-000010 back ("qty is 12"); the draft says who sent it back and why; Joshane edits it (qty 10 → 12, revision 2) and submits again; Jinky\'s check and Dr Amy\'s approval are cleared; the offers kept on the open RFQ are flagged "offer is from before revision 2"; old data — a request at RFQ with an orphan draft PO and an "Awarded" RFQ — is healed when a supplier is added (PO Cancelled, RFQ Open) (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10(),PR10({id:'pr13',number:'PR-2026-000013',status:'RFQ',rfqId:'rfq13',poId:'po13'})]);
    put('hydroPro_purch_rfqs',[RFQ10(),RFQ10({id:'rfq13',number:'RFQ-2026-000013',prId:'pr13',status:'Awarded',awardedTo:SW,awardedTotal:8900})]);
    put('hydroPro_purch_pos',[{id:'po13',number:'PO-2026-000013',prId:'pr13',rfqId:'rfq13',supplier:SW,status:'Draft',total:8900,items:[{desc:'3/4 Phenolic board',qty:10,unit:'pc',unitCost:890}],revisions:[]}]);
    as('jinky');const ok=__PURPRO.goBack('pr10','Quotation Evaluation','Draft','qty is 12');const p0=P();
    __PURPRO.openPR('pr10');await sleep(300);const banner=/↩ Sent back by jinky: ↩ Back from Quotation Evaluation to Draft: qty is 12/.test(view())&&/Edit request/.test(view());
    as('joshane');__PURPRO.editPR('pr10');await sleep(200);__PURPRO.dif(0,'qty','12');__PURPRO.saveDraft();await sleep(200);const p1=P();
    __PURPRO.submitPR('pr10');await sleep(100);
    const A=__PURPRO.a2a('pr10'),flag=(A.rows.find(x=>x.name===SW)||{}).flags||[];
    as('jinky');__PURPRO.openPR('pr13');await sleep(200);val('ppAddSupN','Wilcon Depot');__PURPRO.rfqAddSupplier('rfq13');
    const po13=J('hydroPro_purch_pos')[0],r13=R('rfq13');
    window.getCurrentUser=g0;
    return {ok,gone:[p0.checkedBy,p0.approvedBy,p0.aiAnalysis].map(x=>x==null),banner,edit:[p1.status,p1.revision,p1.items[0].qty,p1.itemsChangedWhy],status:P().status,flag:flag.indexOf('offer is from before revision 2')>=0,
      heal:[po13.status,r13.status,r13.suppliers.length,P('pr13').poId,J('hydroPro_purch_audit').some(x=>x.action==='rfq:reopen-heal')]};`),
  expect:{ok:true,gone:[true,true,true],banner:true,edit:['Draft',2,12,'revision 2'],status:'Submitted',flag:true,heal:['Cancelled','Open',4,null,true]} },

{ name:'🔁 Stable and trial share the records: ✏ SWCC A on this copy keeps its Option B, its final offer (file + flag) and adds a history row; a supplier taken off on another computer while Rizal\'s offer form is open — the offer (10 × ₱900) still goes to Rizal, not to the supplier now in that row (v22.52)',
  requires:NEED,seed:SEED,
  run:run(`put('hydroPro_purch_prs',[PR10()]);
    put('hydroPro_purch_rfqs',[RFQ10({suppliers:[{name:SW,email:'swcc@x.ph',sentAt:T,quote:Q(850,{final:true,finalAt:T,finalBy:'Rea Santos',finalFile:{key:'purchasing/k1.pdf',name:'f.pdf',size:9},history:[Q(890)],lines:null}),options:[OPTB()]},{name:TX,email:'triox@x.ph',sentAt:T,quote:Q(1030)},{name:RZ,phone:'0917',sentAt:null,quote:null}]})]);
    as('jinky');__PURPRO.openPR('pr10');await sleep(200);__PURPRO.quoteToggle('rfq10:0');await sleep(150);val('ppQd','7');__PURPRO.saveQuote('rfq10',0);await sleep(100);
    const s0=R().suppliers[0];
    __PURPRO.quoteToggle('rfq10:2');await sleep(150);
    setR('rfq10',r=>{const x=r.suppliers.splice(0,1)[0];r.removed=(r.removed||[]).concat([Object.assign(x,{removedBy:'Rea Santos',removedAt:Date.now(),removeReason:'other computer'})]);});
    val('ppQq','10');val('ppQu','900');val('ppQv','incl');__PURPRO.saveQuote('rfq10',2);await sleep(100);
    const r=R();window.getCurrentUser=g0;
    return {s0:[(s0.options||[]).length,s0.quote.final,(s0.quote.finalFile||{}).key,s0.quote.deliveryDays,(s0.quote.history||[]).map(h=>h.unitPrice)],
      after:r.suppliers.map(s=>s.name+' '+(s.quote?s.quote.unitPrice:'—'))};`),
  expect:{s0:[1,true,'purchasing/k1.pdf',7,[890,850]],after:['Triox Enterprise OPC 1030','Rizal RCP Pipes 900']} },

{ name:'🏗 Option on a GH15 drop-off request: Jinky adds FAMOUS Option B (12 m³ washed sand, no drop-off commitment) → Dr Amy\'s award of it is refused (drop-off not committed); ↩ back to evaluation, ticked → awarded, PO line "— Option B: Washed sand 12 m³" (v22.52)',
  requires:NEED+"&&!!window.HNXGH15CANVAS",seed:SEED,
  run:run(`HNXGH15CANVAS.seed();const r0=R('RFQ_GH15_SAND'),fi=r0.suppliers.findIndex(s=>/FAMOUS — Per m/.test(s.name));
    as('jinky');__PURPRO.openPR('PR_GH15_SAND');await sleep(200);__PURPRO.quoteToggle('RFQ_GH15_SAND:'+fi+':new');await sleep(200);
    val('ppQo','Washed sand 12 m³');val('ppQq','12');val('ppQu','1500');val('ppQv','incl');__PURPRO.saveQuote('RFQ_GH15_SAND',fi,'new');await sleep(100);
    const o=(R('RFQ_GH15_SAND').suppliers[fi].options||[])[0]||{};const key=r0.suppliers[fi].name+'#opt:'+o.id;
    __PURPRO.simpleAdvance('PR_GH15_SAND','Evaluation complete','Quotation Evaluation');
    as('amy');__PURPRO.openPR('PR_GH15_SAND');await sleep(300);document.getElementById('ppAwardSel').value=key;AL.length=0;PR_ANS='cheapest washed sand';__PURPRO.award('PR_GH15_SAND','','Approval');
    const refused=[AL.some(m=>/has not committed the drop-off/.test(m)),J('hydroPro_purch_pos').length];
    as('jinky');__PURPRO.goBack('PR_GH15_SAND','Approval','Quotation Evaluation','get the drop-off in writing');__PURPRO.quoteToggle('RFQ_GH15_SAND:'+fi+':'+o.id);await sleep(200);
    const gh=document.getElementById('ppQgh');if(gh)gh.checked=true;__PURPRO.saveQuote('RFQ_GH15_SAND',fi,o.id);await sleep(100);
    __PURPRO.simpleAdvance('PR_GH15_SAND','Evaluation complete','Quotation Evaluation');
    as('amy');__PURPRO.openPR('PR_GH15_SAND');await sleep(300);document.getElementById('ppAwardSel').value=key;__PURPRO.award('PR_GH15_SAND','','Approval');
    const po=J('hydroPro_purch_pos')[0]||{};window.getCurrentUser=g0;
    return {opt:[o.label,o.spec],refused,gh:!!gh,po:[po.total,(po.option||{}).label,/ — Option B: Washed sand 12 m³$/.test(((po.items||[])[0]||{}).desc||'')],status:P('PR_GH15_SAND').status};`),
  expect:{opt:['B','Washed sand 12 m³'],refused:[true,0],gh:true,po:[18000,'B',true],status:'Purchase Order'} }
];
