/* v22.68 (Joshane, Purchasing, 13 Oct 2026, screenshot of RFQ-2026-000011, closing 2026-10-18, 0/4 quotes in): "how can I put the
   individual price for each of the 3 items? The log offer only allows 1 price for 3 items." The request: 1. Common Wire Nail #2 5 kg,
   2. Common Wire Nail #3 5 kg, 3. Tansi #200 5 roll; suppliers Famous Lumber & Construction Supply, SWCC Hardware & Construction Supplies,
   Triox Enterprise OPC, Chribas Trading Inc. ➕ Log offer showed ONE Qty offered (15 = 5 kg + 5 kg + 5 rolls added together) and ONE
   Unit price. Since v22.68 an offer on a request with several items is priced PER ITEM: one row per item (qty offered in its own unit,
   price, brand), the evaluation compares landed totals for the quantities asked with an Item-by-item table, the PO lines take the
   supplier's own item prices (delivery apart) and the 3-way match counts the delivery. */
const USERS=[{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',department:'Purchasing',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},
  {username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true}];
const SEED=new Function("localStorage.setItem('hydroPro_users',JSON.stringify("+JSON.stringify(USERS)+"));"+
  "['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_purch_audit','hydroPro_acct_purch_history'].forEach(k=>localStorage.setItem(k,'[]'));"+
  "localStorage.removeItem('hydroPro_purch_roles_v1');localStorage.removeItem('hnx_cloud_token');");
const PRE="const U="+JSON.stringify(USERS)+";const g0=window.getCurrentUser;const as=k=>{const u=U.find(x=>x.username===k);window.getCurrentUser=()=>u;};"+
  "const TS=[];window.showToast=m=>TS.push(String(m));const AL=[];window.alert=m=>AL.push(String(m));const CF=[];window.confirm=m=>{CF.push(String(m));return true;};"+
  "let PR_ANS=null;const PM=[];window.prompt=m=>{PM.push(String(m));return PR_ANS;};"+
  "const J=k=>JSON.parse(localStorage.getItem(k)||'[]');const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));"+
  "const P=(id)=>J('hydroPro_purch_prs').find(x=>x.id===(id||'pr11'));const R=(id)=>J('hydroPro_purch_rfqs').find(x=>x.id===(id||'rfq11'));"+
  "const setP=(id,f)=>{const a=J('hydroPro_purch_prs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_prs',a);};"+
  "const val=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;return !!e;};const gv=id=>{const e=document.getElementById(id);return e?e.value:null;};"+
  "const mk=(id,v)=>{let e=document.getElementById(id);if(!e){e=document.createElement('input');e.id=id;e.style.display='none';document.body.appendChild(e);}e.value=v;return e;};"+
  "const rd=x=>Math.round(x*100)/100;const view=()=>(document.getElementById('view-acct_purch_pro')||{}).innerText||'';"+
  "const pdf=(mb,name)=>new File([new Uint8Array(Math.round(mb*1024*1024))],name||'final.pdf',{type:'application/pdf'});"+
  "const pick=(id,f)=>{const e=document.getElementById(id);if(!e)return false;const dt=new DataTransfer();dt.items.add(f);e.files=dt.files;return true;};"+
  "const FAM='Famous Lumber & Construction Supply',SW='SWCC Hardware & Construction Supplies',TX='Triox Enterprise OPC',CH='Chribas Trading Inc.';const T=Date.now()-2*864e5;"+
  "const ITEMS=[{desc:'Common Wire Nail #2',code:'',qty:5,unit:'kg',unitCost:0},{desc:'Common Wire Nail #3',code:'',qty:5,unit:'kg',unitCost:0},{desc:'Tansi #200',code:'',qty:5,unit:'roll',unitCost:0}];"+
  "const PR11=ex=>Object.assign({id:'pr11',number:'PR-2026-000011',title:'Nails and tansi for GH15',dept:'Construction',project:'GH15',klass:'Construction materials',company:'APTI',needBy:'2026-10-31',priority:'Normal',"+
    "justification:'Common wire nails and tansi for the GH15 formworks.',items:ITEMS.map(x=>Object.assign({},x)),status:'RFQ',rfqId:'rfq11',createdBy:'joshane',createdAt:T,revision:1,checkedBy:'Jinky Pagtama',checkedAt:T+1000,"+
    "approvedBy:'Dr Amy Patdu',approvedAt:T+2000,approvedEstimate:0,workflow:[{stage:'Draft',at:T,by:'Joshane Espinosa',note:'created'}],overrides:[]},ex||{});"+
  "const RFQ11=ex=>Object.assign({id:'rfq11',number:'RFQ-2026-000011',prId:'pr11',status:'Open',closingDate:'2026-10-18',createdAt:T,updatedAt:T,suppliers:[FAM,SW,TX,CH].map(n=>({name:n,email:'',phone:'',sentAt:null,channel:null,quote:null}))},ex||{});"+
  "const OQ=ex=>Object.assign({qty:15,unitPrice:95,vatIncl:true,delivery:0,total:1425,brand:'',validUntil:'2027-01-31',deliveryDays:3,payTerms:'',warranty:'',notes:'',deliverToOk:false,file:null,at:T,by:'jinky'},ex||{});"+
  "const sup=(n,q)=>({name:n,email:'',phone:'',sentAt:null,channel:null,quote:q||null});"+
  "const logOffer=async(i,prices,vat,del)=>{__PURPRO.quoteToggle('rfq11:'+i);await sleep(150);prices.forEach((p,j)=>val('ppQl'+j,p==null?'':String(p)));val('ppQv',vat||'incl');val('ppQdc',del?String(del):'');val('ppQvu','2027-01-31');val('ppQd','3');__PURPRO.saveQuote('rfq11',i);await sleep(150);};"+
  "const FOUR=async()=>{await logOffer(0,[85,80,120],'incl',100);await logOffer(1,[90,88,130],'incl',150);await logOffer(2,[82,80,118],'excl',0);await logOffer(3,[70,68,null],'incl',0);};"+
  "const start=async(prs,rfqs,u)=>{put('hydroPro_purch_prs',prs);put('hydroPro_purch_rfqs',rfqs);as(u||'jinky');__PURPRO.openPR(prs[0].id);await sleep(300);};";
const NEED="!!(window.__PURPRO&&window.__PURPRO.offerLines)";
/* v22.74: the two screen cases need the signed-in harness user to exist, or the login screen covers the view and nothing is laid out */
const SEED_UI=new Function("localStorage.setItem('hydroPro_users',JSON.stringify("+JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}].concat(USERS))+"));"+
  "['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_purch_audit','hydroPro_acct_purch_history'].forEach(k=>localStorage.setItem(k,'[]'));"+
  "localStorage.removeItem('hydroPro_purch_roles_v1');localStorage.removeItem('hnx_cloud_token');");
/* the case body is a real function: its source is pasted after PRE, so it sees FAM, logOffer, put… */
const run=fn=>new Function('return (async()=>{'+PRE+'await sleep(3000);const __r=await ('+fn.toString()+')();window.getCurrentUser=g0;return __r;})()');
module.exports=[
{ name:'🧾 RFQ-2026-000011: ➕ Log offer for Famous on 3 items shows one row per item — Qty offered 5 kg / 5 kg / 5 roll (never 15), no single Unit price box, no "Request needs 15"; 85 / 80 / 120 VAT in + ₱100 delivery → "Total as quoted: ₱1,525.00 · 3 of 3 items · delivery included", saved lines 5×85 / 5×80 / 5×120, total ₱1,525.00, row "QUOTED ₱1,525.00"; a one-item request keeps Qty offered 5 + Unit price (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const PR12=PR11({id:'pr12',number:'PR-2026-000012',title:'Nails',items:[Object.assign({},ITEMS[0])],rfqId:'rfq12'});
    await start([PR11(),PR12],[RFQ11(),RFQ11({id:'rfq12',number:'RFQ-2026-000012',prId:'pr12',suppliers:[sup(FAM)]})]);
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);
    const qty=['ppQlq0','ppQlq1','ppQlq2'].map(gv),ids={};['ppQq','ppQu','ppQb','ppQl2','ppQlb2'].forEach(id=>{ids[id]=!!document.getElementById(id);});
    const cell=(document.getElementById('ppQl0')||document.body).closest('td'),form=(document.getElementById('ppQForm')||{}).innerText||''; /* v22.74: the form is a card under the supplier table */
    const perKg=/\/kg/.test(cell?cell.innerText:'');
    ['85','80','120'].forEach((p,j)=>val('ppQl'+j,p));val('ppQdc','100');val('ppQv','incl');val('ppQvu','2027-01-31');val('ppQd','3');
    __PURPRO.qTot();const tot=(document.getElementById('ppQtot')||{}).textContent;
    __PURPRO.saveQuote('rfq11',0);await sleep(200);
    const q=R().suppliers[0].quote||{},chip=/QUOTED ₱1,525\.00/.test(view());
    __PURPRO.openPR('pr12');await sleep(300);__PURPRO.quoteToggle('rfq12:0');await sleep(150);
    const single={ppQq:gv('ppQq'),ppQu:!!document.getElementById('ppQu'),ppQl0:!!document.getElementById('ppQl0'),needs:/Request needs 5/.test(view())};
    return {qty,ids,perKg,needs15:/Request needs 15/.test(form),note:/Nexi compares every offer on the total for what you asked \(5 kg · 5 kg · 5 roll\)/.test(form),tot,
      lines:(q.lines||[]).map(l=>[l.qty,l.unitPrice,l.quoted]),total:q.total,del:q.delivery,vat:q.vatIncl,chip,single,alerts:AL};}),
  expect:{qty:['5','5','5'],ids:{ppQq:false,ppQu:false,ppQb:false,ppQl2:true,ppQlb2:true},perKg:true,needs15:false,note:true,
    tot:'Total as quoted: ₱1,525.00 · 3 of 3 items · delivery included',lines:[[5,85,true],[5,80,true],[5,120,true]],total:1525,del:100,vat:true,chip:true,
    single:{ppQq:'5',ppQu:true,ppQl0:false,needs:true},alerts:[]} },

{ name:'⚖ Four offers on 5 kg + 5 kg + 5 roll: Famous 85/80/120 VAT in + ₱100 → landed ₱1,361.61, score 95, 🏅 BEST + 💰 CHEAPEST; Triox 82/80/118 VAT out → ₱1,400.00 (+2.8% / +₱38.39, score 93.4); SWCC 90/88/130 VAT in + ₱150 → ₱1,508.93 (+10.8% / +₱147.32, score 89.1); Chribas 70/68, no Tansi → 2 of 3, ₱616.07, score 76, listed LAST and never cheapest; cheapest per item Nail #2 Chribas ₱62.50, Nail #3 Chribas ₱60.71, Tansi Famous ₱107.14 (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11()]);await FOUR();
    __PURPRO.openPR('pr11');await sleep(300);const chChip=/QUOTED ₱690\.00 · 2 of 3 items/.test(view());
    setP('pr11',p=>{p.status='Quotation Evaluation';});__PURPRO.openPR('pr11');await sleep(300);
    const A=__PURPRO.a2a('pr11'),v=view(),row=n=>A.rows.find(r=>r.sup===n)||{flags:[]};
    return {order:A.order.map(r=>r.label),rows:A.order.map(r=>[rd(r.normTotal),r.covers,r.gapPct,r.gapAmt,r.score]),best:A.best&&A.best.label,cheapest:A.cheapest&&A.cheapest.label,
      parts:A.order.map(r=>r.parts.price),chFlags:row(CH).flags.join('|'),txFlags:row(TX).flags.join('|'),items:A.items.map(m=>[m.desc,m.cheapestLabel,rd(m.cheapestEx)]),
      view:{itemByItem:/🧾 Item by item/.test(v),quantities:/apple to apple on the quantities asked \(5 kg · 5 kg · 5 roll\)/.test(v),no15:!/Total for 15|on 15 units/.test(v),chChip},alerts:AL};}),
  expect:{order:['Famous Lumber & Construction Supply','Triox Enterprise OPC','SWCC Hardware & Construction Supplies','Chribas Trading Inc.'],
    rows:[[1361.61,3,0,0,95],[1400,3,2.8,38.39,93.4],[1508.93,3,10.8,147.32,89.1],[616.07,2,null,null,76]],
    best:'Famous Lumber & Construction Supply',cheapest:'Famous Lumber & Construction Supply',parts:[100,97,90,100],chFlags:'no price for: Tansi #200',txFlags:'VAT to add on invoice',
    items:[['Common Wire Nail #2','Chribas Trading Inc.',62.5],['Common Wire Nail #3','Chribas Trading Inc.',60.71],['Tansi #200','Famous Lumber & Construction Supply',107.14]],
    view:{itemByItem:true,quantities:true,no15:true,chChip:true},alerts:[]} },

{ name:'🏅 Dr Amy awards Famous → PO lines Nail #2 5 kg @ ₱85, Nail #3 5 kg @ ₱80, Tansi #200 5 roll @ ₱120, delivery ₱100 apart, total ₱1,525.00 "offer — price per item" (was ₱0 lines); GRN Nail #2 5 kg → Partially Delivered, INV-11 ₱1,525 → Waiting GRN (₱454.82 received of ₱1,494.50 needed); the rest received → Fully Delivered, ↻ → Matched; purchase history ₱85 / ₱80 / ₱120 (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11()]);await FOUR();
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);
    __PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    let po=J('hydroPro_purch_pos')[0]||{};
    __PURPRO.issuePO('pr11');await sleep(100);__PURPRO.simpleAdvance('pr11','PO issued — awaiting delivery','Purchase Order',po.id);await sleep(100);
    as('jinky');__PURPRO.openPR('pr11');await sleep(300);val('ppGacc0','5');__PURPRO.recordGRN('pr11',po.id);await sleep(200);
    const st1=(J('hydroPro_purch_pos')[0]||{}).status;
    mk('ppInvPo',po.id);mk('ppInvNum','INV-11');mk('ppInvAmt','1525');__PURPRO.addInvoice();await sleep(150);
    const inv=J('hydroPro_purch_invoices')[0]||{},m1=inv.matchStatus;
    __PURPRO.openPR('pr11');await sleep(300);val('ppGacc1','5');val('ppGacc2','5');__PURPRO.recordGRN('pr11',po.id);await sleep(200);
    const st2=(J('hydroPro_purch_pos')[0]||{}).status;__PURPRO.rematch(inv.id);await sleep(100);const m2=(J('hydroPro_purch_invoices')[0]||{}).matchStatus;
    po=J('hydroPro_purch_pos')[0]||{};
    return {po:(po.items||[]).map(it=>[it.desc,it.qty,it.unit,it.unitCost]),delivery:po.delivery,total:po.total,from:po.pricesFrom,sup:po.supplier,
      st1,m1,st2,m2,hist:J('hydroPro_acct_purch_history').filter(h=>h.source==='grn').map(h=>h.unitCost),pos:J('hydroPro_purch_pos').length,prompts:PM.length};}),
  expect:{po:[['Common Wire Nail #2',5,'kg',85],['Common Wire Nail #3',5,'kg',80],['Tansi #200',5,'roll',120]],delivery:100,total:1525,from:'offer — price per item',sup:'Famous Lumber & Construction Supply',
    st1:'Partially Delivered',m1:'Waiting GRN',st2:'Fully Delivered',m2:'Matched',hist:[85,80,120],pos:1,prompts:0} },

{ name:'✂ Dr Amy awards Chribas (no Tansi) over Nexi\'s Famous with a reason → the prompt says "Tansi #200 × 5 roll … will NOT be ordered", PO lines ₱70 / ₱68, total ₱690.00, not ordered Tansi #200 × 5 roll, workflow "· NOT ordered: Tansi #200 × 5 roll"; the PO screen says "Not on this PO: Tansi #200 × 5 roll" (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11()]);await FOUR();
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);
    val('ppAwardSel',CH);PR_ANS='Famous has no stock until November';__PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const po=J('hydroPro_purch_pos')[0]||{},p=P(),w=(p.workflow||[]).slice(-1)[0]||{};
    __PURPRO.openPR('pr11');await sleep(300);
    return {prompt:PM.length===1&&/You are overriding Nexi's recommendation \(Famous Lumber & Construction Supply\)\./.test(PM[0])&&/did not quote: Tansi #200 × 5 roll\. That will NOT be ordered on this PO/.test(PM[0]),
      lines:(po.items||[]).map(it=>[it.desc,it.qty,it.unitCost]),total:po.total,notOrdered:po.notOrdered,
      note:/^Awarded to Chribas Trading Inc\. · ₱690\.00 · PO draft PO-\d{4}-\d{6} · NOT ordered: Tansi #200 × 5 roll$/.test(w.note||''),reason:((p.overrides||[]).slice(-1)[0]||{}).reason,
      poView:/Not on this PO: Tansi #200 × 5 roll/.test(view())};}),
  expect:{prompt:true,lines:[['Common Wire Nail #2',5,70],['Common Wire Nail #3',5,68]],total:690,notOrdered:[{desc:'Tansi #200',qty:5,unit:'roll'}],
    note:true,reason:'Famous has no stock until November · not ordered: Tansi #200 × 5 roll',poView:true} },

{ name:'🕰 SWCC offer logged before v22.68 with ONE price (15 × ₱95 VAT in = ₱1,425): same numbers as before — ₱84.82 per unit landed, ₱1,272.32 landed total — flagged "one price for all items"; with no estimates its award is refused ("no price per item", 0 POs, stays at Approval); ✏ Edit offer shows 5 kg / 5 kg / 5 roll at ₱95 each with "logged with ONE price for all items (₱95.00 each)"; saved 85 / 80 / 120 → ₱1,425.00 per item, the ₱95 offer kept in its history (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11({status:'Approval'})],[RFQ11({suppliers:[sup(FAM),sup(SW,OQ()),sup(TX),sup(CH)]})],'amy');
    const A=__PURPRO.a2a('pr11'),r=A.rows.find(x=>x.sup===SW)||{flags:[]};
    const legacy=[rd(r.landedUnit),rd(r.normTotal),r.covers,r.flags.some(f=>/^one price for all items/.test(f))];
    AL.length=0;__PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(150);
    const refused=[AL.some(m=>/no price per item/.test(m)),J('hydroPro_purch_pos').length,P().status];
    setP('pr11',p=>{p.status='Quotation Evaluation';});as('jinky');__PURPRO.openPR('pr11');await sleep(300);
    __PURPRO.quoteToggle('rfq11:1');await sleep(150);
    const prefill=[[0,1,2].map(j=>gv('ppQl'+j)),[0,1,2].map(j=>gv('ppQlq'+j)),/logged with ONE price for all items \(₱95\.00 each\)/.test(view())];
    ['85','80','120'].forEach((p,j)=>val('ppQl'+j,p));__PURPRO.saveQuote('rfq11',1);await sleep(200);
    const q=R().suppliers[1].quote||{};
    return {refused,legacy,prefill,saved:(q.lines||[]).map(l=>[l.qty,l.unitPrice]),total:q.total,hist:(q.history||[]).map(h=>h.unitPrice)};}),
  expect:{refused:[true,0,'Approval'],legacy:[84.82,1272.32,3,true],prefill:[['95','95','95'],['5','5','5'],true],saved:[[5,85],[5,80],[5,120]],total:1425,hist:[95]} },

{ name:'🕰 The same one-price offer on a request with estimates ₱80 / ₱75 / ₱110 is still awarded (DSAFE-4 rule): PO lines ₱86.04 / ₱80.66 / ₱118.30 "PR estimates scaled to the offer total", total ₱1,425.00 (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const est=[80,75,110];
    await start([PR11({status:'Approval',items:ITEMS.map((x,i)=>Object.assign({},x,{unitCost:est[i]}))})],[RFQ11({suppliers:[sup(FAM),sup(SW,OQ()),sup(TX),sup(CH)]})],'amy');
    __PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const po=J('hydroPro_purch_pos')[0]||{};
    return {lines:(po.items||[]).map(it=>it.unitCost),from:po.pricesFrom,total:po.total,pos:J('hydroPro_purch_pos').length,alerts:AL};}),
  expect:{lines:[86.04,80.66,118.3],from:'PR estimates scaled to the offer total',total:1425,pos:1,alerts:[]} },

{ name:'📎 Famous final offer (FAM final.pdf, kept in the request): Tansi ₱120 → ₱110, nails unchanged → lines 85/80/110, ₱1,525.00 → ₱1,475.00, 📎 FINAL, history keeps ₱1,525.00; workflow "₱1,525.00 → ₱1,475.00 total"; Eyal and Dr Amy told "₱1,316.96 landed total"; evaluation "was ₱1,525.00"; ✏ lead days 3 → 5 stays FINAL; Nail #2 ₱85 → ₱84 asks first ("3 of 3 items · ₱1,475.00") and is no longer final, ₱1,470.00 (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11({status:'Quotation Evaluation'})],[RFQ11()]);
    await logOffer(0,[85,80,120],'incl',100);
    __PURPRO.quoteToggle('rfq11:0:A:final');await sleep(150);val('ppQl2','110');pick('ppQff',pdf(0.1,'FAM final.pdf'));
    await __PURPRO.saveQuote('rfq11',0,'A','final');await sleep(300);
    let q=R().suppliers[0].quote||{};
    const fin=[!!q.final,(q.lines||[]).map(l=>l.unitPrice),q.total],hist=(q.history||[]).map(h=>h.total);
    const wf=/📎 Final offer: Famous Lumber & Construction Supply \(A\) ₱1,525\.00 → ₱1,475\.00 total · FAM final\.pdf/.test(((P().workflow||[]).slice(-1)[0]||{}).note||'');
    const told=J('hydroPro_pa_inbox_v1').filter(x=>/final offer from/.test(x.title)&&/₱1,475\.00 total as quoted · ₱1,316\.96 landed total/.test(x.body)).map(x=>x.user).sort();
    __PURPRO.openPR('pr11');await sleep(300);const was=/was ₱1,525\.00/.test(view());
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);val('ppQd','5');CF.length=0;__PURPRO.saveQuote('rfq11',0);await sleep(200);
    q=R().suppliers[0].quote||{};const keep=[!!q.final,CF.length];
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);val('ppQl0','84');CF.length=0;__PURPRO.saveQuote('rfq11',0);await sleep(200);
    q=R().suppliers[0].quote||{};
    return {fin,hist,wf,told,was,keep,unfin:[!!q.final,q.total,/FINAL offer \(3 of 3 items · ₱1,475\.00, file FAM final\.pdf\)/.test(CF[0]||'')],
      note:/final offer edited ₱1,475\.00 → ₱1,470\.00 total — no longer counts as final/.test(((P().workflow||[]).slice(-1)[0]||{}).note||''),alerts:AL};}),
  expect:{fin:[true,[85,80,110],1475],hist:[1525],wf:true,told:['amy','eyal'],was:true,keep:[true,0],unfin:[false,1470,true],note:true,alerts:[]} },

{ name:'⬇ Excel comparison of RFQ-2026-000011: sheets "Apple to apple" + "Item by item"; header has Items quoted / Total as quoted ₱ / Landed total ex-VAT ₱ and "Common Wire Nail #2 ₱/kg", "… qty", "… brand / spec" — no "Total for 15"; Famous row 3 of 3, ₱1,525, ₱1,361.61, 85 × 5; Chribas Tansi "not quoted"; Item by item Tansi → Famous ₱107.14; a one-item request keeps "Total for 5" (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const cap={};window.XLSX={utils:{book_new:()=>({S:[]}),aoa_to_sheet:r=>r,book_append_sheet:(wb,ws,n)=>wb.S.push({name:n,rows:ws})},writeFile:(wb,name)=>{cap.name=name;cap.S=wb.S;}};
    const PR12=PR11({id:'pr12',number:'PR-2026-000012',title:'Nails',items:[Object.assign({},ITEMS[0])],rfqId:'rfq12'});
    await start([PR11(),PR12],[RFQ11(),RFQ11({id:'rfq12',number:'RFQ-2026-000012',prId:'pr12',suppliers:[sup(FAM,OQ({qty:5,unitPrice:85,total:425}))]})]);await FOUR();
    __PURPRO.a2aExcel('pr11');
    const S=cap.S||[],S1=(S[0]||{}).rows||[],hdr=S1.find(r=>r[0]==='Supplier')||[],fam=S1.find(r=>r[0]===FAM)||[],ch=S1.find(r=>r[0]===CH)||[],S2=(S[1]||{}).rows||[];
    const out={sheets:S.map(s=>s.name),hdr:hdr.slice(0,9),itemHdr:hdr.slice(25,28),no15:!hdr.some(h=>/Total for 15/.test(String(h))),
      fam:[fam[0],fam[4],fam[5],fam[6],fam[7],fam[8],fam[25],fam[26]],chTansi:ch.slice(-3),tansiRow:S2.find(r=>r[0]==='Tansi #200'),totals:S2.find(r=>r[0]==='Landed total ex-VAT')};
    __PURPRO.a2aExcel('pr12');out.single=(((cap.S||[])[0]||{}).rows||[]).find(r=>r[0]==='Supplier').find(h=>/^Total for/.test(String(h)));
    return out;}),
  expect:{sheets:['Apple to apple','Item by item'],hdr:['Supplier','Option','Final offer','Was ₱ (total)','Items quoted','VAT','Delivery ₱','Total as quoted ₱','Landed total ex-VAT ₱'],
    itemHdr:['Common Wire Nail #2 ₱/kg','Common Wire Nail #2 qty','Common Wire Nail #2 brand / spec'],no15:true,
    fam:['Famous Lumber & Construction Supply','3 of 3','included',100,1525,1361.61,85,5],chTansi:['not quoted','',''],
    tansiRow:['Tansi #200',5,'roll',107.14,118,116.07,'not quoted',107.14,'Famous Lumber & Construction Supply'],totals:['Landed total ex-VAT','','',1361.61,1400,1508.93,616.07],single:'Total for 5'} },

{ name:'↔ Trial offers saved before v22.68 keep their item prices: Famous [85,80,120] by position → 3 of 3, ₱1,272.32, awarded → PO ₱85 / ₱80 / ₱120; an offer with 2 positional prices on a request that later got Tansi → counts as 0 of 3 ("items changed after this offer"), ✏ Edit prefills 85 / 80 / empty and saves 2 of 3 with no page error (v22.68)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const FQ=OQ({lines:[{unitPrice:85},{unitPrice:80},{unitPrice:120}]}),SQ=OQ({qty:10,unitPrice:82.5,lines:[{unitPrice:85},{unitPrice:80}],total:825});
    const PR13=PR11({id:'pr13',number:'PR-2026-000013',status:'Quotation Evaluation',rfqId:'rfq13',itemsChangedAt:T+5000});
    await start([PR11({status:'Approval'}),PR13],[RFQ11({suppliers:[sup(FAM,FQ),sup(SW),sup(TX),sup(CH)]}),RFQ11({id:'rfq13',number:'RFQ-2026-000013',prId:'pr13',suppliers:[sup(FAM),sup(SW,SQ)]})],'amy');
    const A=__PURPRO.a2a('pr11'),r=A.rows.find(x=>x.sup===FAM)||{};
    __PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);const po=J('hydroPro_purch_pos')[0]||{};
    as('jinky');__PURPRO.openPR('pr13');await sleep(300);
    const r13=(__PURPRO.a2a('pr13').rows.find(x=>x.sup===SW))||{flags:[]};
    __PURPRO.quoteToggle('rfq13:1');await sleep(150);const prefill=[0,1,2].map(j=>gv('ppQl'+j));
    __PURPRO.saveQuote('rfq13',1);await sleep(200);
    const r2=(__PURPRO.a2a('pr13').rows.find(x=>x.sup===SW))||{flags:[]};
    return {pos:[r.covers,rd(r.normTotal)],po:(po.items||[]).map(it=>it.unitCost),from:po.pricesFrom,stale:[r13.covers,r13.flags.some(f=>/items changed after this offer/.test(f))],
      prefill,after:[r2.covers,r2.flags.find(f=>/^no price for/.test(f))],alerts:AL};}),
  expect:{pos:[3,1272.32],po:[85,80,120],from:'offer — price per item',stale:[0,true],prefill:['85','80',''],after:[2,'no price for: Tansi #200'],alerts:[]} },

{ name:'➕ next.html: Hammer 1 pc added at the RFQ after Famous priced 3 items → Famous 3 of 4 ("no price for: Hammer"), no BEST; ✏ Edit shows Hammer empty; Hammer ₱350 → 4 of 4, BEST, ₱1,875.00 quoted, ₱1,674.11 landed (v22.68 trial)',
  requires:"!!(window.__PURPRO&&window.__PURPRO.offerLines&&window.__PURPRO.rfqAddItem)",seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11()]);
    await logOffer(0,[85,80,120],'incl',100);
    mk('ppAddItD','Hammer');mk('ppAddItQ','1');mk('ppAddItU','pc');mk('ppAddItC','350');__PURPRO.rfqAddItem('pr11');await sleep(200);
    const A=__PURPRO.a2a('pr11'),r=A.rows[0]||{flags:[]};
    const before=[r.covers,r.of,A.best?A.best.label:null,r.flags.some(f=>/^no price for: Hammer$/.test(f))];
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);const empty=gv('ppQl3');
    val('ppQl3','350');__PURPRO.saveQuote('rfq11',0);await sleep(200);
    const A2=__PURPRO.a2a('pr11'),r2=A2.rows[0]||{};
    return {before,empty,after:[r2.covers,r2.of,A2.best?A2.best.label:null,(R().suppliers[0].quote||{}).total,rd(r2.normTotal)]};}),
  expect:{before:[3,4,null,true],empty:'',after:[4,4,'Famous Lumber & Construction Supply',1875,1674.11]} },
/* ---- v22.74: the money / compatibility / phone review of v22.68 ---- */
{ name:'💰 One item, 5 kg asked, Famous offers 10 kg @ ₱85 VAT in: the PO orders the 5 kg approved — line 5 × ₱85 = ₱425.00 = PO total (was total ₱850 over a ₱425 line), Dr Amy is told "10 kg offered for 5 asked — the PO orders the 5 kg approved" (no reason asked), rfq.awardedTotal ₱425, workflow "₱425.00", the offer keeps ₱850 as quoted; GRN 5 → Fully Delivered, INV ₱425 → Matched (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const PR12=PR11({id:'pr12',number:'PR-2026-000012',title:'Nails',items:[Object.assign({},ITEMS[0])],rfqId:'rfq12'});
    await start([PR12],[RFQ11({id:'rfq12',number:'RFQ-2026-000012',prId:'pr12',suppliers:[sup(FAM)]})]);
    __PURPRO.quoteToggle('rfq12:0');await sleep(150);val('ppQq','10');val('ppQu','85');val('ppQv','incl');val('ppQvu','2027-01-31');val('ppQd','3');__PURPRO.saveQuote('rfq12',0);await sleep(200);
    const q=R('rfq12').suppliers[0].quote||{};
    setP('pr12',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr12');await sleep(300);CF.length=0;
    __PURPRO.award('pr12','','Approval',R('rfq12').updatedAt);await sleep(200);const cfA=CF.slice();
    const po=J('hydroPro_purch_pos')[0]||{},w=(P('pr12').workflow||[]).slice(-1)[0]||{};
    __PURPRO.openPR('pr12');await sleep(300);const card=view();
    __PURPRO.issuePO('pr12');await sleep(100);__PURPRO.simpleAdvance('pr12','PO issued — awaiting delivery','Purchase Order',po.id);await sleep(100);
    as('jinky');__PURPRO.openPR('pr12');await sleep(300);val('ppGacc0','5');__PURPRO.recordGRN('pr12',po.id);await sleep(200);
    mk('ppInvPo',po.id);mk('ppInvNum','INV-12');mk('ppInvAmt','425');__PURPRO.addInvoice();await sleep(150);
    return {offer:[q.qty,q.unitPrice,q.total],po:(po.items||[]).map(it=>[it.qty,it.unitCost]),total:po.total,asQuoted:po.asQuoted,awardedTotal:R('rfq12').awardedTotal,
      note:/^Awarded to Famous Lumber & Construction Supply · ₱425\.00 · PO draft/.test(w.note||''),confirm:cfA.length===1&&/Common Wire Nail #2: 10 kg offered for 5 asked — the PO orders the 5 kg approved/.test(cfA[0]),prompts:PM.length,
      card:/Total ₱425\.00/.test(card),st:(J('hydroPro_purch_pos')[0]||{}).status,match:(J('hydroPro_purch_invoices')[0]||{}).matchStatus,alerts:AL};}),
  expect:{offer:[10,85,850],po:[[5,85]],total:425,asQuoted:850,awardedTotal:425,note:true,confirm:true,prompts:0,card:true,st:'Fully Delivered',match:'Matched',alerts:[]} },

{ name:'💰 One item 10 kg asked (estimate ₱90): Famous offers 12 kg × ₱100 → PO 10 kg @ ₱100 = ₱1,000.00 (told "12 kg offered for 10 asked"), GRN 10 → Fully Delivered, INV ₱1,000 → Matched; Famous offers 8 kg × ₱100 → flag "offers 8 of 10", the award asks a reason ("offers less than asked: 8 kg of Common Wire Nail #2 for 10 asked … × 2 kg short is NOT ordered"), PO 8 × ₱100 = ₱800.00, notOrdered 2 kg short, audit award:partial (no override of anybody), workflow "NOT ordered: Common Wire Nail #2 × 2 kg short", Receiving shows it; GRN 8 → Fully Delivered, INV ₱800 → Matched (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const one=(id,n)=>PR11({id:id,number:'PR-2026-0000'+n,title:'Nails',status:'Approval',rfqId:'rfq'+n,items:[{desc:'Common Wire Nail #2',code:'',qty:10,unit:'kg',unitCost:90}]});
    await start([one('pr12','12'),one('pr13','13')],[RFQ11({id:'rfq12',number:'RFQ-2026-000012',prId:'pr12',suppliers:[sup(FAM,OQ({qty:12,unitPrice:100,total:1200}))]}),RFQ11({id:'rfq13',number:'RFQ-2026-000013',prId:'pr13',suppliers:[sup(FAM,OQ({qty:8,unitPrice:100,total:800}))]})],'amy');
    const cyc=async(prId,rfqId,invAmt,invNo)=>{__PURPRO.openPR(prId);await sleep(300);CF.length=0;PM.length=0;PR_ANS='only 8 in stock';
      __PURPRO.award(prId,'','Approval',R(rfqId).updatedAt);await sleep(200);const cfA=CF.slice();
      const po=J('hydroPro_purch_pos').find(p=>p.prId===prId)||{},w=(P(prId).workflow||[]).slice(-1)[0]||{};
      __PURPRO.issuePO(prId);await sleep(100);__PURPRO.simpleAdvance(prId,'PO issued — awaiting delivery','Purchase Order',po.id);await sleep(100);
      as('jinky');__PURPRO.openPR(prId);await sleep(300);const recv=view();val('ppGacc0',String((po.items||[{}])[0].qty));__PURPRO.recordGRN(prId,po.id);await sleep(200);
      mk('ppInvPo',po.id);mk('ppInvNum',invNo);mk('ppInvAmt',String(invAmt));__PURPRO.addInvoice();await sleep(150);as('amy');
      return {po:(po.items||[]).map(it=>[it.qty,it.unitCost]),total:po.total,notOrdered:po.notOrdered||null,cf:cfA,pm:PM.slice(),note:w.note||'',recv:/Not on this PO: Common Wire Nail #2 × 2 kg short/.test(recv),
        st:(J('hydroPro_purch_pos').find(p=>p.prId===prId)||{}).status,match:(J('hydroPro_purch_invoices').find(i=>i.number===invNo)||{}).matchStatus};};
    const a=await cyc('pr12','rfq12',1000,'INV-12');
    const flag8=(__PURPRO.a2a('pr13').rows[0]||{flags:[]}).flags.join('|');
    const b=await cyc('pr13','rfq13',800,'INV-13');
    const p13=P('pr13'),au=J('hydroPro_purch_audit').filter(x=>/^award:/.test(x.action)).map(x=>x.action+' '+x.detail);
    return {a:{po:a.po,total:a.total,notOrdered:a.notOrdered,cf:a.cf.length===1&&/Common Wire Nail #2: 12 kg offered for 10 asked — the PO orders the 10 kg approved/.test(a.cf[0]),pm:a.pm.length,st:a.st,match:a.match,note:/· ₱1,000\.00 · PO draft/.test(a.note)},
      flag8,b:{po:b.po,total:b.total,notOrdered:b.notOrdered,cf:b.cf.length,pm:b.pm.length===1&&/^This award orders less than PR-2026-000013 asks\./.test(b.pm[0])&&/offers less than asked: 8 kg of Common Wire Nail #2 for 10 asked\. The PO orders what is offered — Common Wire Nail #2 × 2 kg short is NOT ordered/.test(b.pm[0]),
        st:b.st,match:b.match,note:/^Awarded to Famous Lumber & Construction Supply · ₱800\.00 · PO draft PO-\d{4}-\d{6} · NOT ordered: Common Wire Nail #2 × 2 kg short$/.test(b.note),recv:b.recv},
      overrides:(p13.overrides||[]).length,partial:((p13.partialAwards||[])[0]||{}).reason,audit:au,alerts:AL};}),
  expect:{a:{po:[[10,100]],total:1000,notOrdered:null,cf:true,pm:0,st:'Fully Delivered',match:'Matched',note:true},flag8:'offers 8 of 10',
    b:{po:[[8,100]],total:800,notOrdered:[{desc:'Common Wire Nail #2',qty:2,unit:'kg',short:true,offered:8,asked:10}],cf:0,pm:true,st:'Fully Delivered',match:'Matched',note:true,recv:true},
    overrides:0,partial:'only 8 in stock',audit:['award:partial Famous Lumber & Construction Supply: only 8 in stock · not ordered: Common Wire Nail #2 × 2 kg short'],alerts:[]} },

{ name:'💰 RFQ-2026-000011: Famous offers 10 kg of Nail #2 for 5 asked (85/80/120 + ₱100) → flag "10 kg offered for 5", ₱1,950.00 as quoted, landed ₱1,361.61 BEST; the award tells Dr Amy and the PO orders 5 kg: lines 5×85 / 5×80 / 5×120, total ₱1,525.00 (was 10 kg, ₱1,950.00, no word). Famous offers 3 kg for 5 → "offers 3 of 5 kg"; awarding it asks a reason naming "3 kg of Common Wire Nail #2 for 5 asked … × 2 kg short", PO 3 kg / 5 / 5, total ₱1,355.00, notOrdered 2 kg short, workflow and PO card "NOT ordered: Common Wire Nail #2 × 2 kg short" (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const famQ=async(qty0)=>{__PURPRO.quoteToggle('rfq11:0');await sleep(150);['85','80','120'].forEach((p,j)=>val('ppQl'+j,p));val('ppQlq0',String(qty0));val('ppQdc','100');val('ppQv','incl');val('ppQvu','2027-01-31');val('ppQd','3');__PURPRO.saveQuote('rfq11',0);await sleep(200);};
    await start([PR11()],[RFQ11()]);await famQ(10);await logOffer(2,[82,80,118],'excl',0);
    const q1=R().suppliers[0].quote||{},A1=__PURPRO.a2a('pr11'),r1=A1.rows.find(r=>r.sup===FAM)||{flags:[]};
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);CF.length=0;
    __PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const po1=J('hydroPro_purch_pos')[0]||{},w1=(P().workflow||[]).slice(-1)[0]||{};
    const over={q:[q1.total,rd(r1.normTotal),A1.best&&A1.best.label,r1.flags.join('|')],cf:CF.length===1&&/Common Wire Nail #2: 10 kg offered for 5 asked — the PO orders the 5 kg approved/.test(CF[0]),pm:PM.length,
      po:(po1.items||[]).map(it=>[it.qty,it.unitCost]),total:po1.total,notOrdered:po1.notOrdered||null,note:/· ₱1,525\.00 · PO draft/.test(w1.note||'')};
    await start([PR11()],[RFQ11()]);await famQ(3);await logOffer(2,[82,80,118],'excl',0);
    const r2=(__PURPRO.a2a('pr11').rows.find(r=>r.sup===FAM))||{flags:[]};
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);CF.length=0;PM.length=0;val('ppAwardSel',FAM);PR_ANS='Famous has only 3 kg left';
    __PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const po2=J('hydroPro_purch_pos').slice(-1)[0]||{},w2=(P().workflow||[]).slice(-1)[0]||{};
    __PURPRO.openPR('pr11');await sleep(300);
    return {over,short:{flag:r2.flags.join('|'),pm:PM.length===1&&/offers less than asked: 3 kg of Common Wire Nail #2 for 5 asked\. The PO orders what is offered — Common Wire Nail #2 × 2 kg short is NOT ordered/.test(PM[0]),cf:CF.length,
      po:(po2.items||[]).map(it=>[it.qty,it.unitCost]),total:po2.total,notOrdered:po2.notOrdered,note:/· ₱1,355\.00 · PO draft PO-\d{4}-\d{6} · NOT ordered: Common Wire Nail #2 × 2 kg short$/.test(w2.note||''),card:/Not on this PO: Common Wire Nail #2 × 2 kg short — raise a new request for it/.test(view())},alerts:AL};}),
  expect:{over:{q:[1950,1361.61,'Famous Lumber & Construction Supply','Common Wire Nail #2: 10 kg offered for 5'],cf:true,pm:0,po:[[5,85],[5,80],[5,120]],total:1525,notOrdered:null,note:true},
    short:{flag:'Common Wire Nail #2: offers 3 of 5 kg',pm:true,cf:0,po:[[3,85],[5,80],[5,120]],total:1355,notOrdered:[{desc:'Common Wire Nail #2',qty:2,unit:'kg',short:true,offered:3,asked:5}],note:true,card:true},alerts:[]} },

{ name:'✏ An item renamed at Draft after the offers (Common Wire Nail #2 → "Common Wire Nail #2 (2 in)"): Famous keeps 3 of 3, ₱1,361.61 and 🏅 BEST (was "2 of 3" and the one-price SWCC ₱1,473.21 became BEST), flagged "renamed after this offer (was Common Wire Nail #2)"; Triox keeps 3 of 3; ✏ Edit offer prefills 85 / 80 / 120 and says so; the award tells Dr Amy and the PO carries the renamed item at ₱85: 3 lines, ₱1,525.00 (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11({suppliers:[sup(FAM),sup(SW,OQ({unitPrice:110,total:1650})),sup(TX),sup(CH)]})]);
    await logOffer(0,[85,80,120],'incl',100);await logOffer(2,[82,80,118],'excl',0);
    setP('pr11',p=>{p.items[0].desc='Common Wire Nail #2 (2 in)';p.itemsChangedAt=Date.now();p.itemsChangedWhy='revision 2';p.revision=2;p.status='Quotation Evaluation';});__PURPRO.openPR('pr11');await sleep(300);
    const A=__PURPRO.a2a('pr11'),fam=A.rows.find(r=>r.sup===FAM)||{flags:[]},tx=A.rows.find(r=>r.sup===TX)||{};
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);const prefill=[0,1,2].map(j=>gv('ppQl'+j)),says=/renamed after this offer/.test(view());__PURPRO.quoteToggle(null);await sleep(100);
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);CF.length=0;
    __PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);const po=J('hydroPro_purch_pos')[0]||{};
    return {fam:[fam.covers,rd(fam.normTotal),fam.flags.some(f=>/^Common Wire Nail #2 \(2 in\): renamed after this offer \(was Common Wire Nail #2\)/.test(f))],tx:[tx.covers,rd(tx.normTotal)],best:A.best&&A.best.label,cheapest:A.cheapest&&A.cheapest.label,
      prefill,says,cf:CF.length===1&&/renamed after this offer \(was Common Wire Nail #2\) — priced as quoted, ₱85\.00\/kg/.test(CF[0]),pm:PM.length,po:(po.items||[]).map(it=>[it.desc,it.qty,it.unitCost]),total:po.total,alerts:AL};}),
  expect:{fam:[3,1361.61,true],tx:[3,1400],best:'Famous Lumber & Construction Supply',cheapest:'Famous Lumber & Construction Supply',prefill:['85','80','120'],says:true,cf:true,pm:0,
    po:[['Common Wire Nail #2 (2 in)',5,85],['Common Wire Nail #3',5,80],['Tansi #200',5,120]],total:1525,alerts:[]} },

{ name:'🧾 VAT: Triox 82/80/118 "not included" awarded (override, reason) → PO ₱1,400.00 ex-VAT, card "Total ₱1,400.00 + 12% VAT = ₱1,568.00 on the invoice · prices without VAT", Issue PO says "+ 12% VAT = 1568 on the invoice"; GRN 5/5/5 → Fully Delivered; INV ₱1,568 → Matched (was Exception); a second invoice ₱1,400 → Exception (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11()]);await FOUR();
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);
    val('ppAwardSel',TX);PR_ANS='Triox delivers tomorrow';__PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const po=J('hydroPro_purch_pos')[0]||{};__PURPRO.openPR('pr11');await sleep(300);const card=view();
    CF.length=0;__PURPRO.issuePO('pr11');await sleep(100);const issue=CF[0]||'';__PURPRO.simpleAdvance('pr11','PO issued — awaiting delivery','Purchase Order',po.id);await sleep(100);
    as('jinky');__PURPRO.openPR('pr11');await sleep(300);['0','1','2'].forEach(i=>val('ppGacc'+i,'5'));__PURPRO.recordGRN('pr11',po.id);await sleep(200);
    mk('ppInvPo',po.id);mk('ppInvNum','INV-TX');mk('ppInvAmt','1568');__PURPRO.addInvoice();await sleep(150);
    mk('ppInvNum','INV-TX2');mk('ppInvAmt','1400');__PURPRO.addInvoice();await sleep(150);
    const inv=J('hydroPro_purch_invoices');
    return {total:po.total,vat:[po.vatIncl,po.vatExempt],card:/Total ₱1,400\.00 \+ 12% VAT = ₱1,568\.00 on the invoice · prices without VAT/.test(card),issue:/for 1400 \+ 12% VAT = 1568 on the invoice\?/.test(issue),
      st:(J('hydroPro_purch_pos')[0]||{}).status,m:inv.map(i=>[i.number,i.matchStatus]),alerts:AL};}),
  expect:{total:1400,vat:[false,false],card:true,issue:true,st:'Fully Delivered',m:[['INV-TX','Matched'],['INV-TX2','Exception']],alerts:[]} },

{ name:'🧾 VAT: SWCC logged as "none — non-VAT supplier" (90/88/130 + ₱150): no "VAT to add on invoice" flag, compared as quoted (₱1,690.00 landed), shown "no VAT"; awarded (override) → PO ₱1,690.00, card "non-VAT supplier — no VAT on the invoice", GRN all → INV ₱1,690 → Matched; Excel VAT column "none (non-VAT supplier)" (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const cap={};window.XLSX={utils:{book_new:()=>({S:[]}),aoa_to_sheet:r=>r,book_append_sheet:(wb,ws,n)=>wb.S.push({name:n,rows:ws})},writeFile:(wb,name)=>{cap.S=wb.S;}};
    await start([PR11()],[RFQ11()]);await logOffer(0,[85,80,120],'incl',100);await logOffer(1,[90,88,130],'exempt',150);
    const q=R().suppliers[1].quote||{};setP('pr11',p=>{p.status='Quotation Evaluation';});__PURPRO.openPR('pr11');await sleep(300);
    const A=__PURPRO.a2a('pr11'),sw=A.rows.find(r=>r.sup===SW)||{flags:[]},noVat=/no VAT/.test(view());
    __PURPRO.a2aExcel('pr11');const row=(((cap.S||[])[0]||{}).rows||[]).find(r=>r[0]===SW)||[];
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);
    val('ppAwardSel',SW);PR_ANS='SWCC has stock';__PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const po=J('hydroPro_purch_pos')[0]||{};__PURPRO.openPR('pr11');await sleep(300);const card=view();
    __PURPRO.issuePO('pr11');await sleep(100);__PURPRO.simpleAdvance('pr11','PO issued — awaiting delivery','Purchase Order',po.id);await sleep(100);
    as('jinky');__PURPRO.openPR('pr11');await sleep(300);['0','1','2'].forEach(i=>val('ppGacc'+i,'5'));__PURPRO.recordGRN('pr11',po.id);await sleep(200);
    mk('ppInvPo',po.id);mk('ppInvNum','INV-SW');mk('ppInvAmt','1690');__PURPRO.addInvoice();await sleep(150);
    return {q:[q.vatIncl,q.vatExempt,q.total],sw:[rd(sw.normTotal),sw.flags.join('|')],noVat,excelVat:row[5],total:po.total,vat:[po.vatIncl,po.vatExempt],card:/Total ₱1,690\.00 · non-VAT supplier — no VAT on the invoice/.test(card),
      match:(J('hydroPro_purch_invoices')[0]||{}).matchStatus,alerts:AL};}),
  expect:{q:[false,true,1690],sw:[1690,''],noVat:true,excelVat:'none (non-VAT supplier)',total:1690,vat:[false,true],card:true,match:'Matched',alerts:[]} },

{ name:'🕰 SWCC one-price offer from before v22.68 for 5 at ₱95 VAT in + ₱100 delivery (₱575): landed total ₱1,361.61 = 15 × ₱84.82 + ₱89.29 (was ₱1,540.18 — the delivery counted three times), the Item-by-item foot and the Excel "Landed total ex-VAT" agree (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const cap={};window.XLSX={utils:{book_new:()=>({S:[]}),aoa_to_sheet:r=>r,book_append_sheet:(wb,ws,n)=>wb.S.push({name:n,rows:ws})},writeFile:(wb,name)=>{cap.S=wb.S;}};
    await start([PR11({status:'Quotation Evaluation'})],[RFQ11({suppliers:[sup(FAM),sup(SW,OQ({qty:5,unitPrice:95,delivery:100,total:575})),sup(TX),sup(CH)]})]);
    const A=__PURPRO.a2a('pr11'),r=A.rows.find(x=>x.sup===SW)||{flags:[]};
    __PURPRO.a2aExcel('pr11');const tot=((((cap.S||[])[1]||{}).rows||[]).find(x=>x[0]==='Landed total ex-VAT')||[]).slice(3);
    return {landed:[rd(r.normTotal),rd(r.cmp),rd(r.delEx),rd(r.unitEx)],flag:r.flags.some(f=>/^offers 5 \(one price for all items\)/.test(f)),foot:/Landed total \(VAT-exclusive, delivery in\)\s*₱1,361\.61/.test(view()),excel:tot,alerts:AL};}),
  expect:{landed:[1361.61,1361.61,89.29,84.82],flag:true,foot:true,excel:[1361.61],alerts:[]} },

{ name:'💾 Famous Nail #2 typed 85.555 → saved ₱85.56, total ₱1,527.80 = PO lines + delivery (was ₱1,527.78, 2 centavos off its lines); a price of −5 is refused "the price cannot be below 0"; saving with Nail #2 left empty asks "Famous … has no price for: Common Wire Nail #2. Save those as NOT quoted …?" (was saved without a word) and saves 2 of 3, ₱1,100.00 (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11()]);
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);['85.555','80','120'].forEach((p,j)=>val('ppQl'+j,p));val('ppQdc','100');val('ppQv','incl');val('ppQvu','2027-01-31');val('ppQd','3');CF.length=0;__PURPRO.saveQuote('rfq11',0);await sleep(200);
    const q=R().suppliers[0].quote||{},cf0=CF.length;
    __PURPRO.quoteToggle('rfq11:0');await sleep(150);val('ppQl0','-5');AL.length=0;__PURPRO.saveQuote('rfq11',0);await sleep(150);const neg=AL.slice();
    val('ppQl0','');CF.length=0;__PURPRO.saveQuote('rfq11',0);await sleep(200);const q2=R().suppliers[0].quote||{};
    return {line:[(q.lines||[{}])[0].unitPrice,(q.lines||[{}])[0].qty],total:q.total,cf0,neg,ask:CF.length===1&&/^Famous Lumber & Construction Supply has no price for: Common Wire Nail #2\.\n\nSave those as NOT quoted \(the offer will not count as covering every item\)\?$/.test(CF[0]),
      saved:(q2.lines||[]).map(l=>l.quoted),total2:q2.total,chip:/QUOTED ₱1,100\.00 · 2 of 3 items/.test(view())};}),
  expect:{line:[85.56,5],total:1527.8,cf0:0,neg:['Common Wire Nail #2: the price cannot be below 0'],ask:true,saved:[false,true,true],total2:1100,chip:true} },

{ name:'🧾 Item by item: a total-only offer from before v21.64 (Famous ₱1,500 for 15, no unit price) shows "one total for all" in each of its 3 cells (was "not quoted" ×3 while the footer said "one price"), ₱1,339.29 landed (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const FQ=OQ({qty:15,total:1500});delete FQ.unitPrice;
    await start([PR11({status:'Quotation Evaluation'})],[RFQ11({suppliers:[sup(FAM,FQ),sup(SW,OQ()),sup(TX),sup(CH)]})]);
    const A=__PURPRO.a2a('pr11'),r=A.rows.find(x=>x.sup===FAM)||{},v=view();
    return {landed:rd(r.normTotal),one:[r.one,r.oneMode],cells:(v.match(/one total for all(?! items)/g)||[]).length,notQuoted:(v.match(/not quoted/g)||[]).length};}),
  expect:{landed:1339.29,one:[true,'total'],cells:3,notQuoted:0} },

{ name:'✂ Only Chribas offers (nails, no Tansi) — Nexi recommends none: the award with reason "only nails for now" is recorded as award:partial "Chribas Trading Inc.: only nails for now · not ordered: Tansi #200 × 5 roll" (was award:override "… over :" and an override of nobody), pr.partialAwards[0], no pr.overrides entry; PO ₱690.00 (v22.74)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await start([PR11()],[RFQ11({suppliers:[sup(CH)]})]);await logOffer(0,[70,68,null],'incl',0);
    setP('pr11',p=>{p.status='Approval';});as('amy');__PURPRO.openPR('pr11');await sleep(300);
    const sel=document.getElementById('ppAwardSel'),empty=!!sel&&sel.value==='';val('ppAwardSel',CH);PR_ANS='only nails for now';__PURPRO.award('pr11','','Approval',R().updatedAt);await sleep(200);
    const p=P(),po=J('hydroPro_purch_pos')[0]||{},au=J('hydroPro_purch_audit').filter(x=>/^award:/.test(x.action)).map(x=>x.action+' '+x.detail);
    return {empty,pm:PM.length===1&&/^Nexi recommends no offer — none covers every item\./.test(PM[0]),au,overrides:(p.overrides||[]).length,partial:(p.partialAwards||[]).map(x=>[x.reason,(x.notOrdered||[]).map(n=>n.desc)]),total:po.total,alerts:AL};}),
  expect:{empty:true,pm:true,au:['award:partial Chribas Trading Inc.: only nails for now · not ordered: Tansi #200 × 5 roll'],overrides:0,partial:[['only nails for now',['Tansi #200']]],total:690,alerts:[]} },

{ name:'📱 Phone (400 px): ➕ Log offer at the RFQ opens the per-item form as a card under the supplier table (#ppQForm — not inside a table cell, where the phone layout squeezed it to 2 px) — the price box of Nail #2 is at least 100 px wide, its row cells carry their labels ("Qty offered", "Price per unit ₱") at once, "Total as quoted" is at least 200 px wide, the first price box has the cursor (v22.74)',
  requires:NEED,seed:SEED_UI,viewport:{width:400,height:800},
  run:run(async()=>{
    try{switchView('acct_purch_pro');}catch(e){}await sleep(300);
    await start([PR11()],[RFQ11()]);__PURPRO.quoteToggle('rfq11:0');await sleep(300);
    const f=document.getElementById('ppQForm'),b=document.getElementById('ppQl0'),cell=b&&b.closest('td'),tot=document.getElementById('ppQtot');
    return {card:!!f&&f.classList.contains('pp-card')&&f.contains(b),inCell:!!(b&&b.closest('td[colspan]')),wOk:!!b&&b.getBoundingClientRect().width>=100,labels:[document.getElementById('ppQlq0').closest('td').getAttribute('data-label'),cell.getAttribute('data-label')],
      totOk:!!tot&&tot.getBoundingClientRect().width>=200,focus:document.activeElement&&document.activeElement.id,vw:innerWidth};}),
  expect:{card:true,inCell:false,wOk:true,labels:['Qty offered','Price per unit ₱'],totOk:true,focus:'ppQl0',vw:400} },

{ name:'🖥 1366 px, Quotation Evaluation with four offers: the Change column (✏ Edit offer) is the 2nd column of the comparison — all four buttons visible without sideways scrolling (were 1,800 px to the right); pressing ✏ Edit offer on Chribas (last row) brings the form into view with the cursor in the first price box (before: the form opened above the viewport, nothing visible happened) (v22.74)',
  requires:NEED,seed:SEED_UI,viewport:{width:1366,height:768},
  run:run(async()=>{
    try{switchView('acct_purch_pro');}catch(e){}await sleep(300);
    await start([PR11()],[RFQ11()]);await FOUR();setP('pr11',p=>{p.status='Quotation Evaluation';});__PURPRO.openPR('pr11');await sleep(300);
    const v=document.getElementById('view-acct_purch_pro'),tb=[...v.querySelectorAll('table.pp-tbl')].find(t=>/Items quoted/.test((t.querySelector('thead')||{}).innerText||''));
    const ths=[...tb.querySelectorAll('thead th')].map(x=>x.innerText.trim()),edit=[...v.querySelectorAll('button')].filter(b=>/Edit offer/.test(b.innerText));
    const er=edit.map(b=>b.getBoundingClientRect()).every(r=>r.left>=0&&r.right<=innerWidth);
    edit[edit.length-1].scrollIntoView();await sleep(100);__PURPRO.quoteToggle('rfq11:3');await sleep(400);
    const f=document.getElementById('ppQForm'),r=f&&f.getBoundingClientRect();
    return {ths:ths.slice(0,3),editVisible:er,n:edit.length,inView:!!r&&r.top>=-1&&r.top<innerHeight,title:f&&f.innerText.split('\n')[0],focus:document.activeElement&&document.activeElement.id};}),
  expect:{ths:['Supplier','Change','Items quoted'],editVisible:true,n:4,inView:true,title:'✏ Offer — Chribas Trading Inc.',focus:'ppQl0'} }
];
