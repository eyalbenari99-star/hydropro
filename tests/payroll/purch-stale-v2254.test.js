/* v22.54 release audit — Purchasing (PUR-1/2/3/5/6/7/8, DSAFE-4/5). Owner rule, Eyal 11 Oct 2026: "Unless final offer comes want to
   go back any stage and admin should go back any case". Going back is now routine, and the Purchasing screen is NOT redrawn when a
   sync brings another computer's change — so a screen left open shows a stage the request has already left. A button on such a screen
   must never move the request past where it is now, complete it, skip Department Approval, revive a Cancelled request (only Admin
   reopens one), make a second RFQ / strand the offers, or receive goods on a purchase order that was never issued.
   Seed: PR-2026-000010 "3/4 Phenolic Board" — 10 pc (est. ₱850), raised by Joshane, checked by Jinky, approved by Dr Amy;
   RFQ-2026-000010 with SWCC 10 × ₱890 and Triox 10 × ₱1,030 (VAT in, 3 days, COD) and Rizal RCP Pipes without an offer. */
const USERS=[{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',department:'Purchasing',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},
  {username:'admin',fullname:'System Admin',role:'admin',active:true},
  {username:'rea',fullname:'Rea Santos',role:'operator',department:'Purchasing',active:true},
  {username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true}];
const SEED=new Function("localStorage.setItem('hydroPro_users',JSON.stringify("+JSON.stringify(USERS)+"));"+
  "['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_purch_audit'].forEach(k=>localStorage.setItem(k,'[]'));"+
  "localStorage.removeItem('hydroPro_purch_roles_v1');localStorage.removeItem('hnx_cloud_token');");
const PRE="const U="+JSON.stringify(USERS)+";const g0=window.getCurrentUser;const as=k=>{const u=U.find(x=>x.username===k);window.getCurrentUser=()=>u;};"+
  "const TS=[];window.showToast=m=>TS.push(String(m));const AL=[];window.alert=m=>AL.push(String(m));const CF=[];window.confirm=m=>{CF.push(String(m));return true;};let PR_ANS=null;window.prompt=()=>PR_ANS;"+
  "const J=k=>JSON.parse(localStorage.getItem(k)||'[]');const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));"+
  "const P=(id)=>J('hydroPro_purch_prs').find(x=>x.id===(id||'pr10'));const R=(id)=>J('hydroPro_purch_rfqs').find(x=>x.id===(id||'rfq10'));"+
  "const setP=(id,f)=>{const a=J('hydroPro_purch_prs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_prs',a);};"+
  "const val=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;return !!e;};"+
  "const view=()=>(document.getElementById('view-acct_purch_pro')||{}).innerText||'';"+
  "const btn=re=>[...document.querySelectorAll('#view-acct_purch_pro button')].find(b=>re.test(b.textContent));"+
  "const pdf=(mb,name)=>new File([new Uint8Array(Math.round(mb*1024*1024))],name||'final.pdf',{type:'application/pdf'});"+
  "const pick=(id,f)=>{const e=document.getElementById(id);if(!e)return false;const dt=new DataTransfer();dt.items.add(f);e.files=dt.files;return true;};"+
  "const tick=re=>{const b=[...document.querySelectorAll('.ppSrcPick')].find(x=>re.test((x.closest('tr')||{}).textContent||''));if(b)b.checked=true;return !!b;};"+
  "const SW='SWCC Hardware & Construction Supplies',TX='Triox Enterprise OPC',RZ='Rizal RCP Pipes';"+
  "const T=Date.now()-3*864e5;"+
  "const Q=(u,ex)=>Object.assign({qty:10,unitPrice:u,vatIncl:true,delivery:0,total:u*10,brand:'',validUntil:'2027-01-31',deliveryDays:3,payTerms:'COD',warranty:'1 year',notes:'',deliverToOk:false,file:null,at:T,by:'Jinky Pagtama'},ex||{});"+
  "const PR10=(ex)=>Object.assign({id:'pr10',number:'PR-2026-000010',title:'3/4 Phenolic Board',dept:'Construction',project:'GH15',klass:'Construction materials',company:'APTI',needBy:'2027-01-31',priority:'Normal',"+
    "justification:'Phenolic board for the GH15 formworks — the old boards are worn out and split.',items:[{desc:'3/4 Phenolic board',code:'',qty:10,unit:'pc',unitCost:850,brand:'',warehouse:'',remarks:''}],"+
    "status:'Quotation Evaluation',rfqId:'rfq10',createdBy:'joshane',createdAt:T,revision:1,checkedBy:'Jinky Pagtama',checkedAt:T+1000,approvedBy:'Dr Amy Patdu',approvedAt:T+2000,approvedEstimate:8500,"+
    "reviewedBy:'Rea Santos',reviewedAt:T+3000,buyer:'rea',workflow:[{stage:'Draft',at:T,by:'Joshane Espinosa',note:'created'}],overrides:[]},ex||{});"+
  "const FRESH={rfqId:null,checkedBy:undefined,checkedAt:undefined,approvedBy:undefined,approvedAt:undefined,approvedEstimate:undefined,reviewedBy:undefined,reviewedAt:undefined};"+
  "const RFQ10=(ex)=>Object.assign({id:'rfq10',number:'RFQ-2026-000010',prId:'pr10',status:'Open',closingDate:'2026-10-15',createdAt:T,updatedAt:T,"+
    "suppliers:[{name:SW,email:'swcc@x.ph',phone:'',sentAt:T,channel:'email',quote:Q(890)},{name:TX,email:'triox@x.ph',phone:'',sentAt:T,channel:'email',quote:Q(1030)},{name:RZ,email:'',phone:'0917 555 0101',sentAt:null,channel:null,quote:null}]},ex||{});"+
  "const PO=(id,num,st,ex)=>Object.assign({id:id,number:num,prId:'pr10',rfqId:'rfq10',company:'APTI',supplier:SW,status:st,createdAt:T,issuedAt:st==='Draft'?null:T,revisions:[],items:[{desc:'3/4 Phenolic board',qty:10,unit:'pc',unitCost:890}],total:8900},ex||{});"+
  "const WILCON=()=>put('hydroPro_acct_vendors',[{id:'v1',name:'Wilcon Depot',email:'sales@wilcon.ph',phone:'',category:'Construction materials · phenolic board plywood'}]);"+
  "const offers=r=>((r&&r.suppliers)||[]).filter(s=>s.quote).length;"+
  "const inbox=()=>J('hydroPro_pa_inbox_v1');"+
  "const lastWf=(id)=>{const w=(P(id).workflow||[]);return w[w.length-1]||{};};";
const NEED="!!(window.__PURPRO&&window.__PURPRO.goBack&&window.__PURPRO.canGoBack)";
const run=body=>new Function('return (async()=>{'+PRE+'await sleep(3000);'+body+'})()');
module.exports=[
{ name:'🛑 PUR-1 stale Receiving screen: Dr Amy sends PR-2026-000010 back from Receiving to Approval (PO-2026-000010 → Cancelled, RFQ-2026-000010 → Open); Rea\'s old "Complete anyway" then leaves it at Approval with no PO, the PO Cancelled and the RFQ Open — and a direct Complete on a request at Approval (no PO) is refused (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    put('hydroPro_purch_prs',[PR10({status:'Receiving',poId:'po10'})]);
    put('hydroPro_purch_rfqs',[RFQ10({status:'Awarded',awardedTo:SW,awardedTotal:8900})]);
    put('hydroPro_purch_pos',[PO('po10','PO-2026-000010','Issued')]);
    as('rea');__PURPRO.openPR('pr10');await sleep(400);
    const v=document.getElementById('view-acct_purch_pro');const snap=v.innerHTML;
    as('amy');const back=__PURPRO.goBack('pr10','Receiving','Approval','Triox cannot deliver — award again');
    const mid=[P().status,P().poId||null,J('hydroPro_purch_pos')[0].status,R().status];
    v.innerHTML=snap;as('rea');const b=btn(/Complete anyway|Complete procurement/); /* Rea's computer: her screen was never redrawn */
    TS.length=0;if(b)b.click();await sleep(300);
    const after=[P().status,P().poId||null,J('hydroPro_purch_pos')[0].status,R().status,lastWf().stage];
    const told=TS.some(m=>/PR-2026-000010 already moved on \\(now: Approval\\)/.test(m));
    put('hydroPro_purch_prs',[PR10({id:'pr11',number:'PR-2026-000011',status:'Approval',poId:null})]);
    __PURPRO.completePR('pr11');await sleep(200);
    window.getCurrentUser=g0;
    return {found:!!b,back,mid,after,told,direct:P('pr11').status};`),
  expect:{found:true,back:true,mid:['Approval',null,'Cancelled','Open'],after:['Approval',null,'Cancelled','Open','Approval'],told:true,direct:'Approval'} },

{ name:'🛑 PUR-2/PUR-3 stale Draft / AI screens: 🚀 Submit, ✋ Override and ✅ Accept pressed after the request reached Department Approval elsewhere leave it at Department Approval (nobody approved it); pressed after it was CANCELLED on a trial computer it stays Cancelled (only Admin reopens); 🤖 Run AI on a moved request writes nothing; a not-required ✅ Accept never closes a request now at Supplier Sourcing; a fresh Draft still submits (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    const AI={at:T,items:[],overall:'Purchase Required',purchaseRequired:true,totalSavings:0};
    const NR={at:T,items:[],overall:'Purchase Not Required — inventory / transfers cover every line.',purchaseRequired:false,totalSavings:0};
    const C=(fs)=>({at:Date.now(),by:'Rea Santos',reason:'duplicate',fromStage:fs});
    const mk=(id,n,st,ex)=>PR10(Object.assign({},FRESH,{id:id,number:'PR-2026-0000'+n,status:st},ex||{}));
    put('hydroPro_purch_prs',[mk('c1',21,'Draft'),mk('s1',22,'Draft'),mk('s2',23,'AI Validation',{aiAnalysis:AI}),mk('s3',24,'AI Validation',{aiAnalysis:AI}),
      mk('d1',25,'Draft'),mk('a1',26,'AI Validation',{aiAnalysis:AI}),mk('a2',27,'AI Validation',{aiAnalysis:AI}),mk('r1',28,'Submitted'),mk('n1',29,'AI Validation',{aiAnalysis:NR})]);
    const stale=async(user,id,re,change)=>{as(user);__PURPRO.openPR(id);await sleep(300);const b=btn(re);setP(id,change);if(b)b.click();await sleep(200);return !!b;};
    as('joshane');__PURPRO.openPR('c1');await sleep(300);const bc=btn(/Submit/);if(bc)bc.click();await sleep(200);const control=P('c1').status;
    const DA=x=>{x.status='Department Approval';};PR_ANS='urgent — site stopped';
    const f=[await stale('joshane','s1',/Submit/,DA),await stale('jinky','s2',/Override/,DA),await stale('rea','s3',/Accept/,DA)];
    const moved=['s1','s2','s3'].map(id=>[P(id).status,P(id).approvedBy||null]);
    const CX=fs=>x=>{x.status='Cancelled';x.cancelled=C(fs);};
    f.push(await stale('joshane','d1',/Submit/,CX('Draft')),await stale('jinky','a1',/Override/,CX('AI Validation')),await stale('rea','a2',/Accept/,CX('AI Validation')));
    const cancelled=['d1','a1','a2'].map(id=>[P(id).status,!!P(id).cancelled]);
    as('jinky');PR_ANS='x';__PURPRO.aiOverride('a1');await sleep(100);const direct=P('a1').status;
    f.push(await stale('jinky','r1',/Run AI/,DA));const ai=[P('r1').status,!!P('r1').aiAnalysis];
    f.push(await stale('eyal','n1',/Accept/,x=>{x.status='Supplier Sourcing';}));const nr=[P('n1').status,!!P('n1').closeRequest];
    window.getCurrentUser=g0;
    return {found:f,control,moved,cancelled,direct,ai,nr,told:TS.filter(m=>/already moved on|was cancelled/.test(m)).length};`),
  expect:{found:[true,true,true,true,true,true,true,true],control:'Submitted',
    moved:[['Department Approval',null],['Department Approval',null],['Department Approval',null]],
    cancelled:[['Cancelled',true],['Cancelled',true],['Cancelled',true]],direct:'Cancelled',ai:['Department Approval',false],nr:['Supplier Sourcing',false],told:9} },

{ name:'🛑 PUR-5/DSAFE-5 Supplier Sourcing with RFQ-2026-000010 still "Awarded" from an undone award and a DRAFT PO-2026-000099 left behind: the screen says RFQ-2026-000010 is still open; ➕ Add the selected (Wilcon Depot) keeps ONE RFQ — RFQ-2026-000010 opened again with 4 suppliers and its 2 offers, PO-2026-000099 Cancelled, poId cleared, request at RFQ; ➡ Continue with RFQ-2026-000010 does the same (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    WILCON();const start=(poId)=>{put('hydroPro_purch_prs',[PR10({status:'Supplier Sourcing',poId:poId})]);put('hydroPro_purch_rfqs',[RFQ10({status:'Awarded',awardedTo:SW,awardedTotal:8900,awardedKey:SW})]);put('hydroPro_purch_pos',[PO('po99','PO-2026-000099','Draft')]);};
    const out=[];
    for(const poId of [null,'po99']){ /* not linked (award on A, back on B before they synced) / linked (the merge kept A's poId) */
      start(poId);as('jinky');__PURPRO.openPR('pr10');await sleep(400);
      const said=/RFQ-2026-000010 is still open/.test(view()),add=!!btn(/Add the selected to RFQ-2026-000010/),ticked=tick(/Wilcon Depot/);
      __PURPRO.createRFQ('pr10');await sleep(300);const rf=J('hydroPro_purch_rfqs'),cur=rf.find(r=>r.id===P().rfqId)||{};
      out.push({said,add,ticked,rfqs:rf.length,rfqId:P().rfqId,status:P().status,rfq:R().status,suppliers:(cur.suppliers||[]).length,offers:offers(cur),po:J('hydroPro_purch_pos')[0].status,poId:P().poId||null});
    }
    start('po99');as('jinky');__PURPRO.openPR('pr10');await sleep(400);const cb=btn(/Continue with RFQ-2026-000010/);if(cb)cb.click();await sleep(300);
    const cont={btn:!!cb,status:P().status,rfqId:P().rfqId,rfq:R().status,offers:offers(R()),po:J('hydroPro_purch_pos')[0].status,rfqs:J('hydroPro_purch_rfqs').length};
    window.getCurrentUser=g0;
    return {out,cont};`),
  expect:{out:[{said:true,add:true,ticked:true,rfqs:1,rfqId:'rfq10',status:'RFQ',rfq:'Open',suppliers:4,offers:2,po:'Cancelled',poId:null},
               {said:true,add:true,ticked:true,rfqs:1,rfqId:'rfq10',status:'RFQ',rfq:'Open',suppliers:4,offers:2,po:'Cancelled',poId:null}],
    cont:{btn:true,status:'RFQ',rfqId:'rfq10',rfq:'Open',offers:2,po:'Cancelled',rfqs:1}} },

{ name:'🛑 PUR-5/DSAFE-5 two computers cross — Dr Amy awards SWCC on A (RFQ Awarded, DRAFT PO) while Rea sends the request back to Supplier Sourcing on B; after the real sync merge, Create RFQ with Wilcon Depot keeps RFQ-2026-000010 (1 RFQ, 2 offers, Open) and cancels the draft PO; a stale Sourcing screen whose request meanwhile reached Purchase Order makes no RFQ and does not move it (v22.54 audit)',
  requires:NEED+"&&typeof window.__hnxMergeGeneric==='function'",seed:SEED,
  run:run(`
    WILCON();put('hydroPro_purch_prs',[PR10({status:'Approval'})]);put('hydroPro_purch_rfqs',[RFQ10()]);
    const KS=['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos'];const snap=()=>{const o={};KS.forEach(k=>o[k]=localStorage.getItem(k));return o;};const base=snap();
    as('amy');__PURPRO.openPR('pr10');await sleep(300);__PURPRO.award('pr10',SW,'Approval');await sleep(200);const A=snap();
    const onA=[P().status,R().status,J('hydroPro_purch_pos').map(p=>p.status)];
    await sleep(30);KS.forEach(k=>localStorage.setItem(k,base[k]));as('rea');__PURPRO.openPR('pr10');await sleep(300);
    const backOk=__PURPRO.goBack('pr10','Approval','Supplier Sourcing','supplier list incomplete');await sleep(200);const B=snap();
    KS.forEach(k=>{const m=window.__hnxMergeGeneric(k,B[k],A[k]);if(typeof m==='string'&&m[0]==='[')localStorage.setItem(k,m);});
    const merged=[P().status,R().status,J('hydroPro_purch_pos').map(p=>p.status)];
    __PURPRO.openPR('pr10');await sleep(400);const banner=/RFQ-2026-000010 is still open/.test(view());tick(/Wilcon Depot/);
    __PURPRO.createRFQ('pr10');await sleep(300);const rf=J('hydroPro_purch_rfqs');
    const race={banner,rfqs:rf.length,rfqId:P().rfqId,rfq:R().status,offers:offers(R()),pos:J('hydroPro_purch_pos').map(p=>p.status),status:P().status};
    /* a Sourcing screen drawn with Wilcon ticked; meanwhile the request went on to Purchase Order on another computer */
    put('hydroPro_purch_prs',[PR10({status:'Supplier Sourcing',rfqId:null,poId:null})]);put('hydroPro_purch_rfqs',[]);put('hydroPro_purch_pos',[]);
    __PURPRO.openPR('pr10');await sleep(400);const t2=tick(/Wilcon Depot/);
    put('hydroPro_purch_prs',[PR10({status:'Purchase Order',poId:'po99'})]);put('hydroPro_purch_rfqs',[RFQ10({status:'Awarded',awardedTo:SW,awardedTotal:8900})]);put('hydroPro_purch_pos',[PO('po99','PO-2026-000099','Draft')]);
    __PURPRO.createRFQ('pr10');await sleep(300);
    const stale={ticked:t2,rfqs:J('hydroPro_purch_rfqs').length,rfqId:P().rfqId,status:P().status,rfq:R().status,po:J('hydroPro_purch_pos')[0].status};
    window.getCurrentUser=g0;
    return {onA,backOk,merged,race,stale};`),
  expect:{onA:['Purchase Order','Awarded',['Draft']],backOk:true,merged:['Supplier Sourcing','Awarded',['Draft']],
    race:{banner:true,rfqs:1,rfqId:'rfq10',rfq:'Open',offers:2,pos:['Cancelled'],status:'RFQ'},
    stale:{ticked:true,rfqs:1,rfqId:'rfq10',status:'Purchase Order',rfq:'Awarded',po:'Draft'}} },

{ name:'🛑 PUR-6 same stage entered again: Dr Amy\'s Purchase Order screen shows ISSUED PO-2026-000010 with ➡ Move to receiving; Admin sends the request back to Approval (PO-2026-000010 Cancelled) and awards Triox (DRAFT PO-2026-000011); her stale button leaves the request at Purchase Order, and nothing can be received on the draft: 0 GRNs, PO-2026-000011 still Draft, never issued (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    put('hydroPro_purch_prs',[PR10({status:'Purchase Order',poId:'po10'})]);
    put('hydroPro_purch_rfqs',[RFQ10({status:'Awarded',awardedTo:SW,awardedTotal:8900,awardedKey:SW})]);
    put('hydroPro_purch_pos',[PO('po10','PO-2026-000010','Issued')]);
    as('amy');__PURPRO.openPR('pr10');await sleep(300);const v=document.getElementById('view-acct_purch_pro');const snap=v.innerHTML;
    as('admin');const back=__PURPRO.goBack('pr10','Purchase Order','Approval','SWCC backed out');
    __PURPRO.openPR('pr10');await sleep(300);const sel=document.getElementById('ppAwardSel');if(sel)sel.value=TX;PR_ANS='SWCC backed out';
    __PURPRO.award('pr10','','Approval',R().updatedAt);await sleep(100);
    const np=J('hydroPro_purch_pos').find(p=>p.id!=='po10')||{};const mid=[P().status,np.number,np.status,P().poId===np.id];
    v.innerHTML=snap;as('amy');const mv=btn(/Move to receiving/);TS.length=0;if(mv)mv.click();await sleep(200);
    const st=P().status,told=TS.some(m=>/PO-2026-000011 is Draft — issue it first/.test(m));
    as('rea');__PURPRO.recordGRN('pr10');await sleep(100); /* a direct receipt on the draft */
    setP('pr10',x=>{x.status='Receiving';});__PURPRO.openPR('pr10');await sleep(300);val('ppGacc0','10');__PURPRO.recordGRN('pr10');await sleep(100);
    const po2=J('hydroPro_purch_pos').find(p=>p.id===np.id)||{};
    window.getCurrentUser=g0;
    return {found:!!mv,back,mid,st,told,grns:J('hydroPro_purch_grns').length,po2:[po2.status,po2.issuedAt||null],po10:J('hydroPro_purch_pos').find(p=>p.id==='po10').status};`),
  expect:{found:true,back:true,mid:['Purchase Order','PO-2026-000011','Draft',true],st:'Purchase Order',told:true,grns:0,po2:['Draft',null],po10:'Cancelled'} },

{ name:'🛑 PUR-6 a stale Receiving screen of PO-2026-000010 records nothing once the request is on another PO, and goods are received only at Receiving: a GRN of 10 pc pressed after the request went back to Purchase Order is refused (0 GRNs); at Receiving on its own issued PO the 10 pc are received (1 GRN, Fully Delivered) (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    put('hydroPro_purch_prs',[PR10({status:'Receiving',poId:'po10'})]);
    put('hydroPro_purch_rfqs',[RFQ10({status:'Awarded',awardedTo:SW,awardedTotal:8900,awardedKey:SW})]);
    put('hydroPro_purch_pos',[PO('po10','PO-2026-000010','Issued')]);
    as('rea');__PURPRO.openPR('pr10');await sleep(300);const v=document.getElementById('view-acct_purch_pro');const snap=v.innerHTML;
    setP('pr10',x=>{x.status='Purchase Order';}); /* sent back from Receiving to Purchase Order on another computer */
    v.innerHTML=snap;val('ppGacc0','10');const g=btn(/Record GRN/);if(g)g.click();await sleep(200);const back=J('hydroPro_purch_grns').length;
    put('hydroPro_purch_pos',[PO('po10','PO-2026-000010','Cancelled'),PO('po11','PO-2026-000011','Issued',{supplier:TX,items:[{desc:'3/4 Phenolic board',qty:10,unit:'pc',unitCost:1030}],total:10300})]);
    setP('pr10',x=>{x.status='Receiving';x.poId='po11';}); /* awarded again on another computer: now PO-2026-000011 */
    v.innerHTML=snap;val('ppGacc0','10');const g2=btn(/Record GRN/);if(g2)g2.click();await sleep(200);const other=J('hydroPro_purch_grns').length;
    __PURPRO.openPR('pr10');await sleep(300);val('ppGacc0','10');const g3=btn(/Record GRN/);if(g3)g3.click();await sleep(200);
    const gr=J('hydroPro_purch_grns');
    window.getCurrentUser=g0;
    return {found:[!!g,!!g2,!!g3],back,other,now:gr.length,on:gr.length?gr[0].poId:null,po11:J('hydroPro_purch_pos').find(p=>p.id==='po11').status};`),
  expect:{found:[true,true,true],back:0,other:0,now:1,on:'po11',po11:'Fully Delivered'} },

{ name:'🛑 PUR-7 📎 Upload final offer pressed twice while the 2 MB file is still uploading (cloud mocked at 600 ms) → ONE upload, SWCC history [₱890], one "📎 Final offer" workflow row, one notice each to Eyal and Dr Amy; a fast double click without the cloud (local copy) → the same (v22.54 audit)',
  requires:NEED+"&&typeof window.__hnxApi==='function'",seed:SEED,
  run:run(`
    put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);
    const calls=[];localStorage.setItem('hnx_cloud_token','test-token');const api0=window.__hnxApi;
    window.__hnxApi=(path,o)=>new Promise(res=>{calls.push(path);const k=decodeURIComponent(path.split('key=')[1].split('&')[0]);setTimeout(()=>res({ok:true,key:k}),600);});
    as('jinky');__PURPRO.openPR('pr10');await sleep(300);__PURPRO.quoteToggle('rfq10:0:A:final');await sleep(300);
    pick('ppQff',pdf(2,'SWCC final.pdf'));val('ppQu','850');
    const b=btn(/Upload final offer/);if(b)b.click();await sleep(300);const b2=btn(/Upload final offer/);if(b2)b2.click();await sleep(2000);
    localStorage.removeItem('hnx_cloud_token');window.__hnxApi=api0;
    const sum=()=>{const q=R().suppliers[0].quote;return {final:!!q.final,price:q.unitPrice,hist:(q.history||[]).map(h=>h.unitPrice+(h.final?'F':'')),wf:(P().workflow||[]).filter(w=>/Final offer/.test(w.note||'')).length,ib:inbox().filter(x=>/final offer from SWCC/.test(x.title)).map(x=>x.user).sort()};};
    const cloud=Object.assign({clicks:[!!b,!!b2],uploads:calls.length},sum());
    put('hydroPro_purch_prs',[PR10()]);put('hydroPro_purch_rfqs',[RFQ10()]);put('hydroPro_pa_inbox_v1',[]);
    __PURPRO.openPR('pr10');await sleep(300);__PURPRO.quoteToggle('rfq10:0:A:final');await sleep(300);
    pick('ppQff',pdf(1,'SWCC final.pdf'));val('ppQu','850');const b3=btn(/Upload final offer/);if(b3){b3.click();b3.click();}await sleep(2500);
    const local=Object.assign({clicked:!!b3},sum());
    window.getCurrentUser=g0;
    return {cloud,local,busy:TS.filter(m=>/still uploading/.test(m)).length};`),
  expect:{cloud:{clicks:[true,true],uploads:1,final:true,price:850,hist:['890'],wf:1,ib:['amy','eyal']},
    local:{clicked:true,final:true,price:850,hist:['890'],wf:1,ib:['amy','eyal']},busy:2} },

{ name:'🛑 PUR-8 a CANCELLED request raised 40 days ago (need-by 1 Sep 2026) is not open: Accounting cockpit "Purchase requests" open 0, stalled 0, no red; Mission Control "open 0" and no past-need-by alert; Analytics "Open PRs" 0 — the Completed one still counts as done (1 of 1) (v22.54 audit)',
  requires:"!!(window.HNX_COCKPIT_SUBJECTS&&window.HNX_COCKPIT_SUBJECTS.accounting&&window.__PURPRO)",seed:SEED,
  run:run(`
    const old=Date.now()-40*864e5;
    put('hydroPro_purch_prs',[PR10({status:'Cancelled',createdAt:old,needBy:'2026-09-01',cancelled:{at:Date.now(),by:'Rea Santos',reason:'duplicate',fromStage:'Approval'}}),PR10({id:'pr11',number:'PR-2026-000011',status:'Completed',createdAt:old})]);
    const box=window.HNX_COCKPIT_SUBJECTS.accounting.find(x=>x.name==='Purchase requests');const r=box.compute();
    const kpi=re=>{const t=[...document.querySelectorAll('#view-acct_purch_pro .pp-kpi > div')].find(d=>re.test((d.querySelector('.l')||{}).textContent||''));return t?[(t.querySelector('.v')||{}).textContent,(t.querySelector('.l')||{}).textContent]:null;};
    as('jinky');__PURPRO.tab('mission');await sleep(400);const v=view(),mission=kpi(/^Purchase Requests/);
    __PURPRO.tab('analytics');await sleep(400);const analytics=kpi(/^Open PRs/);
    window.getCurrentUser=g0;
    return {open:r.open,crit:r.crit,done:r.done,pct:r.pct,reds:(r.reds||[]).length,mission,pastNeedBy:/PR-2026-000010 still open past need-by/.test(v),analytics};`),
  expect:{open:0,crit:0,done:1,pct:100,reds:0,mission:['2','Purchase Requests · open 0'],pastNeedBy:false,analytics:['0','Open PRs']} },

{ name:'🛑 DSAFE-4 items added after approval on a trial computer (Marine epoxy 2 gal × ₱1,500 waiting for Jinky\'s check) — every copy shows "Items were added after approval" at the award and refuses 🏅 Award (0 POs, stays at Approval); after Jinky presses ✔ Added items checked the award makes 1 PO and the request moves to Purchase Order (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    put('hydroPro_purch_prs',[PR10({status:'Approval',items:[{desc:'3/4 Phenolic board',code:'',qty:10,unit:'pc',unitCost:850},{desc:'Marine epoxy 1 gal',code:'',qty:2,unit:'gal',unitCost:1500,addedAfterApproval:true,addedBy:'Rea Santos',addedAt:T+5000,notInSos:false}],
      itemsChangedAt:T+5000,itemsChangedWhy:'the added items',addedPending:{need:'checker',at:T+5000,by:'Rea Santos',grow:3000}})]);
    put('hydroPro_purch_rfqs',[RFQ10()]);
    as('amy');__PURPRO.openPR('pr10');await sleep(300);const shown=/Items were added after approval/.test(view());
    AL.length=0;PR_ANS='ok';__PURPRO.award('pr10','','Approval',R().updatedAt);await sleep(100);
    const refused=[J('hydroPro_purch_pos').length,P().status,AL.some(m=>/must check them before the award/.test(m))];
    as('jinky');__PURPRO.openPR('pr10');await sleep(300);const ck=btn(/Added items checked/);if(ck)ck.click();await sleep(200);
    const checked=[!!ck,!!P().addedPending];
    as('amy');__PURPRO.openPR('pr10');await sleep(300);AL.length=0;__PURPRO.award('pr10','','Approval',R().updatedAt);await sleep(200);
    window.getCurrentUser=g0;
    return {shown,refused,checked,after:[J('hydroPro_purch_pos').length,P().status],alerts:AL.slice(0,2)};`),
  expect:{shown:true,refused:[0,'Approval',true],checked:[true,false],after:[1,'Purchase Order'],alerts:[]} },

{ name:'🛑 DSAFE-3 the rollback copy (v22.52) made RFQ-2026-000011 (Wilcon Depot, Triox — no offers) for a request sent back to Supplier Sourcing and left RFQ-2026-000010 (SWCC ₱890, Triox ₱1,030, Rizal) open on the side: the stage card says RFQ-2026-000010 is also open; ⇄ Bring its suppliers and offers in → RFQ-2026-000011 has 4 suppliers and 2 offers (SWCC ₱890 moved, Triox ₱1,030 filled in), RFQ-2026-000010 Cancelled as merged, the request stays on RFQ-2026-000011 at RFQ, and the note is gone (v22.54 audit)',
  requires:NEED,seed:SEED,
  run:run(`
    put('hydroPro_purch_prs',[PR10({status:'RFQ',rfqId:'rfq11'})]);
    put('hydroPro_purch_rfqs',[RFQ10(),{id:'rfq11',number:'RFQ-2026-000011',prId:'pr10',status:'Open',closingDate:'2026-10-18',createdAt:T+9000,updatedAt:T+9000,
      suppliers:[{name:'Wilcon Depot',email:'sales@wilcon.ph',phone:'',sentAt:null,channel:null,quote:null},{name:TX,email:'triox@x.ph',phone:'',sentAt:null,channel:null,quote:null}]}]);
    as('jinky');__PURPRO.openPR('pr10');await sleep(400);const said=/RFQ-2026-000010 \\(3 suppliers, 2 offers\\) is also open for PR-2026-000010/.test(view());
    const b=btn(/Bring its suppliers and offers into RFQ-2026-000011/);if(b)b.click();await sleep(300);
    const r11=R('rfq11'),r10=R('rfq10');
    window.getCurrentUser=g0;
    return {said,found:!!b,suppliers:r11.suppliers.map(s=>s.name+(s.quote?' '+s.quote.unitPrice:'')),offers:offers(r11),old:[r10.status,r10.mergedInto,offers(r10)],
      pr:[P().status,P().rfqId],gone:!/is also open for PR-2026-000010/.test(view()),rfqs:J('hydroPro_purch_rfqs').length};`),
  expect:{said:true,found:true,suppliers:['Wilcon Depot','Triox Enterprise OPC 1030','SWCC Hardware & Construction Supplies 890','Rizal RCP Pipes'],offers:2,
    old:['Cancelled','rfq11',2],pr:['RFQ','rfq11'],gone:true,rfqs:2} }
];
