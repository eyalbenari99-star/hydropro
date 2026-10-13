/* v23.04 (built as v22.98 / v22.99 in the spec; Eyal, 13 Oct 2026): "In purchasing we need to print out the comparison of all suppliers offer and to stove who each item we
   will buy from" · "Need to add option to print it out as well". A PRINTABLE comparison of every supplier's offer on a request's RFQ
   and, for EACH ITEM, the supplier we buy it from. Joshane (buyer) confirms the per-item plan with ➡ Proceed to award, Jinky checks it,
   Dr Amy or Eyal approve the award by item → one draft PO per supplier. The grid is frozen at the award; 🖨 Print comparison,
   🖨 Print buy list and 📊 Excel work from the first offer on. The whole-order award (award()) is unchanged.
   Request PR-2026-000031 "GH15 slab and formworks": cement 50 bag, rebar 120 pc, GI wire 20 kg, marine plywood 12 sheet; offers from
   Famous Lumber, SWCC Hardware (₱300 delivery, 2 d, 30 days) and Triox (5 d, 15 days, no wire). */
const USERS=[{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'jinky',fullname:'Jinky Pagtama',role:'accounting',department:'Purchasing',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},
  {username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true}];
const SEED=new Function("localStorage.setItem('hydroPro_users',JSON.stringify("+JSON.stringify(USERS)+"));"+
  "['hydroPro_purch_prs','hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_purch_audit','hydroPro_acct_purch_history'].forEach(k=>localStorage.setItem(k,'[]'));"+
  "localStorage.removeItem('hydroPro_purch_roles_v1');localStorage.removeItem('hnx_cloud_token');");
const PRE=`const U=${JSON.stringify(USERS)};const g0=window.getCurrentUser;const as=k=>{const u=U.find(x=>x.username===k);window.getCurrentUser=()=>u;};
const TS=[];window.showToast=m=>TS.push(String(m));const AL=[];window.alert=m=>AL.push(String(m));
let CF_OK=true;const CF=[];window.confirm=m=>{CF.push(String(m));return CF_OK;};let PR_ANS=null;const PM=[];window.prompt=m=>{PM.push(String(m));return PR_ANS;};
const J=k=>JSON.parse(localStorage.getItem(k)||'[]');const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const P=id=>J('hydroPro_purch_prs').find(x=>x.id===(id||'pr31'));const R=id=>J('hydroPro_purch_rfqs').find(x=>x.id===(id||'rfq31'));
const POS=()=>J('hydroPro_purch_pos');const lastWf=id=>{const w=(P(id).workflow||[]);return w[w.length-1]||{};};
const setP=(id,f)=>{const a=J('hydroPro_purch_prs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_prs',a);};
const setR=(id,f)=>{const a=J('hydroPro_purch_rfqs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_rfqs',a);};
const val=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;return !!e;};const rd=x=>x==null?null:Math.round(x*100)/100;
const view=()=>(document.getElementById('view-acct_purch_pro')||{}).innerText||'';
const st=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ');
const inbox=()=>J('hydroPro_pa_inbox_v1');const told=re=>inbox().filter(x=>re.test(x.title)).map(x=>x.user).sort();
const FAM='Famous Lumber & Construction Supply',SW='SWCC Hardware & Construction Supplies',TX='Triox Enterprise OPC';const T=Date.now()-2*864e5;
const ITEMS=[{desc:'Portland cement 40 kg',code:'',qty:50,unit:'bag',unitCost:0},{desc:'Rebar 10 mm',code:'',qty:120,unit:'pc',unitCost:0},{desc:'GI wire #16',code:'',qty:20,unit:'kg',unitCost:0},{desc:'Marine plywood 3/4',code:'',qty:12,unit:'sheet',unitCost:0}];
const IK=it=>String(it.desc).trim().toLowerCase().replace(/\\s+/g,' ')+'|'+String(it.unit).trim().toLowerCase();
const LQ=(its,prices,ex)=>{ex=Object.assign({},ex||{});const oq=ex.oq;delete ex.oq;const del=Number(ex.delivery||0);
  const lines=its.map((it,i)=>{const p=prices[i],on=p!=null&&p>0;return {key:IK(it),desc:it.desc,unit:it.unit,reqQty:it.qty,qty:on?((oq&&oq[i])||it.qty):0,unitPrice:on?p:0,brand:'',quoted:on};});
  const sum=lines.reduce((a,l)=>a+(l.quoted?l.qty*l.unitPrice:0),0),rs=its.reduce((a,it)=>a+it.qty,0);
  return Object.assign({qty:rs,unitPrice:Math.round(sum/rs*10000)/10000,lines,linesV:2,vatIncl:true,vatExempt:false,delivery:del,total:Math.round((sum+del)*100)/100,brand:'',validUntil:'2027-12-31',deliveryDays:3,payTerms:'COD',warranty:'',notes:'',deliverToOk:false,file:null,at:T,by:'joshane'},ex);};
const sup=(n,q,ex)=>Object.assign({name:n,email:n.split(' ')[0].toLowerCase()+'@x.ph',phone:'0917 000 0000',sentAt:T,channel:'email',quote:q||null},ex||{});
const PR=(id,num,its,ex)=>Object.assign({id,number:num,title:'GH15 slab and formworks',dept:'Construction',project:'GH15',klass:'Construction materials',company:'APTI',needBy:'2027-06-30',priority:'Normal',
  justification:'Cement, rebar, tie wire and plywood for the GH15 slab and its formworks.',items:its.map(x=>Object.assign({},x)),status:'Quotation Evaluation',rfqId:'rfq'+id.slice(2),createdBy:'joshane',createdAt:T,revision:1,
  checkedBy:'Jinky Pagtama',checkedAt:T+1000,approvedBy:'Dr Amy Patdu',approvedAt:T+2000,approvedEstimate:0,workflow:[{stage:'Draft',at:T,by:'joshane',note:'created'}],overrides:[]},ex||{});
const RFQ=(id,num,prId,sups)=>({id,number:num,prId,status:'Open',closingDate:'2026-10-20',createdAt:T,updatedAt:T,suppliers:sups});
const P1={[FAM]:[245,172,92,1450],[SW]:[255,168,95,1420],[TX]:[250,175,null,1380]};
const FILE={name:'fam.pdf',mime:'application/pdf',data:'data:application/pdf;base64,U0VDUkVURklMRQ=='};
const SUPS1=o=>{o=o||{};return [sup(FAM,LQ(ITEMS,P1[FAM],{file:FILE})),o.sw||sup(SW,LQ(ITEMS,P1[SW],{delivery:300,deliveryDays:2,payTerms:'30 days'})),sup(TX,LQ(ITEMS,P1[TX],Object.assign({deliveryDays:5,payTerms:'15 days'},o.tx||{})))].concat(o.more||[]);};
const S1=async(o)=>{o=o||{};put('hydroPro_purch_prs',[PR('pr31','PR-2026-000031',ITEMS,o.pr)]);put('hydroPro_purch_rfqs',[RFQ('rfq31','RFQ-2026-000031','pr31',SUPS1(o))]);as(o.as||'joshane');__PURPRO.openPR('pr31');await sleep(300);};
const IT2=[{desc:'PVC pipe 2" Sch 40 (3 m)',code:'',qty:20,unit:'length',unitCost:0},{desc:'PVC elbow 90° 2"',code:'',qty:30,unit:'pcs',unitCost:0}];const NL='Neltex Depot',AT='Atlanta Hardware';
const S2=async()=>{put('hydroPro_purch_prs',[PR('pr32','PR-2026-000032',IT2,{title:'PVC fittings for GH15 irrigation'})]);put('hydroPro_purch_rfqs',[RFQ('rfq32','RFQ-2026-000032','pr32',[sup(NL,LQ(IT2,[500,72],{vatIncl:false,deliveryDays:2,payTerms:'30 days'})),sup(AT,LQ(IT2,[560,78.4],{deliveryDays:7}))])]);as('joshane');__PURPRO.openPR('pr32');await sleep(300);};
const PRINT=()=>{const o={html:'',opened:0,printed:0,writes:0};window.open=()=>{o.opened++;return {document:{write:h=>{o.html+=h;o.writes++;},close(){}},print(){o.printed++;},focus(){},close(){}};};return o;};
const XL=()=>{const cap={};window.XLSX={utils:{book_new:()=>({S:[]}),aoa_to_sheet:r=>r,book_append_sheet:(wb,ws,n)=>wb.S.push({name:n,rows:ws})},writeFile:(wb,name)=>{cap.name=name;cap.S=wb.S;}};return cap;};
const CHAIN=async()=>{as('joshane');__PURPRO.cmpPropose('pr31','Quotation Evaluation');await sleep(150);as('jinky');__PURPRO.openPR('pr31');await sleep(200);__PURPRO.cmpCheck('pr31','Approval');await sleep(150);
  as('amy');__PURPRO.openPR('pr31');await sleep(300);CF.length=0;PM.length=0;__PURPRO.awardSplit('pr31','Approval',R().updatedAt,(P().buyFrom.prepared||{}).sig);await sleep(200);};
try{switchView('acct_purch_pro');}catch(e){}await sleep(400);`;
const NEED="!!(window.__PURPRO&&window.__PURPRO.cmpModel&&window.__PURPRO.awardSplit)";
/* the case body is a real function: its source is pasted after PRE, so it sees FAM, S1, CHAIN… */
const run=fn=>new Function('return (async()=>{'+PRE+'await sleep(3000);const __r=await ('+fn.toString()+')();window.getCurrentUser=g0;return __r;})()');
const FAM='Famous Lumber & Construction Supply',SW='SWCC Hardware & Construction Supplies',TX='Triox Enterprise OPC',NL='Neltex Depot',AT='Atlanta Hardware';
module.exports=[
{ name:'📊 Grid, RFQ-2026-000031 4 items × 3 offers: cement ₱255 / ₱245★ / ₱250, rebar ₱168★ / ₱172 / ₱175, wire ₱95 / ₱92★ / —, plywood ₱1,420 / ₱1,450 / ₱1,380★; SWCC sub ₱51,850.00 + ₱300 delivery, VAT incl. ₱5,587.50, landed ₱46,562.50, 2 d, 30 days; Famous ₱52,130.00 landed ₱46,544.64; Triox 3 of 4 ₱50,060.00 landed ₱44,696.43 (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();const M=__PURPRO.cmpModel('pr31');const o=k=>M.offers.find(x=>x.sup===k&&!x.opt);
    const cells=k=>o(k).cells.map(c=>c.quoted?[c.unitPrice,c.unitEx,c.line,c.lowest]:null);
    const sum=k=>{const x=o(k);return [x.sub,x.delivery,x.total,x.vatAmt,x.landed,x.covers+' of '+x.of,x.lead,x.terms];};
    const card=document.getElementById('ppCmp'),rows=card?[...card.querySelectorAll('tbody tr:not(.ft)')]:[];
    const txWire=rows[2]?[...rows[2].children].find(td=>td.getAttribute('data-label')===TX):null,v=view(),cv=card?card.innerText:'';
    return {kind:M.kind,order:M.offers.map(x=>x.label),sw:cells(SW),fam:cells(FAM),tx:cells(TX),swS:sum(SW),famS:sum(FAM),txS:sum(TX),lowest:M.lowest,
      dom:{card:!!card,rows:rows.length,lo:card?card.querySelectorAll('td.lo').length:0,txWire:txWire?txWire.textContent.trim():null,notQuoted:/not quoted/.test(cv),oneTotal:/one total for all/.test(cv),itemByItemNQ:(v.match(/not quoted/g)||[]).length,
        itemByItem:/🧾 Item by item/.test(v),bar:document.querySelectorAll('#ppCmpBar button').length,legend:/Prices as quoted · ★ lowest price per unit for the item \(compared without VAT\) · — not offered/.test(v),chip:/live — offers can still change/.test(v)}};
  }),
  expect:{kind:'live',order:[SW,FAM,TX],
    sw:[[255,227.68,12750,false],[168,150,20160,true],[95,84.82,1900,false],[1420,1267.86,17040,false]],
    fam:[[245,218.75,12250,true],[172,153.57,20640,false],[92,82.14,1840,true],[1450,1294.64,17400,false]],
    tx:[[250,223.21,12500,false],[175,156.25,21000,false],null,[1380,1232.14,16560,true]],
    swS:[51850,300,52150,5587.5,46562.5,'4 of 4',2,'30 days'],famS:[52130,0,52130,5585.36,46544.64,'4 of 4',3,'COD'],txS:[50060,0,50060,5363.57,44696.43,'3 of 4',5,'15 days'],
    lowest:[[FAM],[SW],[FAM],[TX]],
    dom:{card:true,rows:4,lo:4,txWire:'—',notQuoted:false,oneTotal:false,itemByItemNQ:1,itemByItem:true,bar:3,legend:true,chip:true}} },

{ name:'🧮 Default buy-from: cement Famous ₱245, rebar SWCC ₱168, wire Famous ₱92, plywood Triox ₱1,380 → 3 POs Famous ₱14,090.00 · SWCC ₱20,460.00 (₱300 delivery once) · Triox ₱16,560.00 = ₱51,110.00 (₱45,633.93 without VAT) vs Famous alone ₱52,130.00 (₱46,544.64) → saves ₱910.71; Nexi\'s whole-order pick stays SWCC 98 (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();const v=view(),vals=[0,1,2,3].map(i=>(document.getElementById('ppBf'+i)||{}).value);
    const o2=[...((document.getElementById('ppBf2')||{}).options||[])].map(o=>o.value);
    const M=__PURPRO.cmpModel('pr31'),Pl=M.plan;
    return {vals,o2,def:M.def,groups:Pl.groups.map(g=>[g.sup,g.items,g.sub,g.delivery,g.total,g.vatAmt,g.landed]),plan:[Pl.n,Pl.total,Pl.bill,Pl.landed,Pl.vatAmt,Pl.unassigned.length,Pl.shorts.length],
      single:[M.single.label,M.single.total,M.single.bill,M.single.landed],diff:M.diff,nexi:[M.nexi.label,M.nexi.score],
      txt:[/Chosen plan: 3 purchase orders · to pay ₱51,110\.00 · without VAT ₱45,633\.93/.test(v),/Cheapest single supplier for all items: Famous Lumber & Construction Supply · to pay ₱52,130\.00 · without VAT ₱46,544\.64/.test(v),
        /The plan saves ₱910\.71 without VAT/.test(v),/Nexi's whole-order pick \(score\): SWCC Hardware & Construction Supplies 98\/100/.test(v),/Prepared by — · Checked by — · Approved by —/.test(v)]};
  }),
  expect:{vals:[FAM,SW,FAM,TX],o2:[SW,FAM],def:[FAM,SW,FAM,TX],
    groups:[[FAM,[0,2],14090,0,14090,1509.64,12580.36],[SW,[1],20160,300,20460,2192.14,18267.86],[TX,[3],16560,0,16560,1774.29,14785.71]],
    plan:[3,51110,51110,45633.93,5476.07,0,0],single:[FAM,52130,52130,46544.64],diff:{ex:910.71,pay:1020},nexi:[SW,98],txt:[true,true,true,true,true]} },

{ name:'⚖ Tie and VAT, PR-2026-000032: pipe ₱500.00 without VAT at Neltex (VAT out) = Atlanta ₱560 VAT in → both ★, default Neltex (2 d before 7 d); elbow Atlanta ₱78.40 (₱70.00 without VAT) beats Neltex ₱72 VAT out → 2 POs Neltex ₱10,000.00 + 12% = ₱11,200.00 to pay, Atlanta ₱2,352.00; ₱12,100.00 without VAT = Atlanta alone → "Same cost without VAT"; choosing Atlanta for the pipe asks no reason → 1 supplier ₱13,552.00 (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S2();const card=document.getElementById('ppCmp'),lo=card?card.querySelectorAll('td.lo').length:0,v0=view();
    const M0=__PURPRO.cmpModel('pr32'),o=k=>M0.offers.find(x=>x.sup===k);
    PM.length=0;__PURPRO.bfSet('pr32',0,AT,'Quotation Evaluation');await sleep(200);
    const pk=((P('pr32').buyFrom||{}).picks||{})['pvc pipe 2" sch 40 (3 m)|length']||{},M1=__PURPRO.cmpModel('pr32');
    return {lo,order:M0.offers.map(x=>[x.label,x.vat,x.score]),lowest:M0.lowest,def:M0.def,nl:[o(NL).sub,o(NL).vatAmt,o(NL).bill],at:[o(AT).sub,o(AT).vatAmt,o(AT).landed],
      groups:M0.plan.groups.map(g=>[g.sup,g.total,g.vatAmt,g.bill,g.landed]),plan:[M0.plan.n,M0.plan.total,M0.plan.bill,M0.plan.landed],diff:M0.diff,single:M0.single.label,
      same:/Same cost without VAT/.test(v0),withoutVat:/₱70\.00 without VAT/.test(v0),pm:PM.length,pick:pk.slot,after:[M1.plan.n,M1.plan.groups.map(g=>g.sup),M1.plan.bill,M1.plan.landed]};
  }),
  expect:{lo:3,order:[[NL,'excl',97.7],[AT,'incl',95]],lowest:[[NL,AT],[AT]],def:[NL,AT],nl:[12160,1459.2,13619.2],at:[13552,1452,12100],
    groups:[[NL,10000,1200,11200,10000],[AT,2352,252,2352,2100]],plan:[2,12352,13552,12100],diff:{ex:0,pay:0},single:AT,same:true,withoutVat:true,pm:0,pick:AT,after:[1,[AT],13552,12100]} },

{ name:'✋ Not the lowest needs a reason: plywood → SWCC ₱1,420 over Triox ₱1,380: no reason → unchanged; "Triox cannot deliver before 20 Oct" → Famous ₱14,090.00 + SWCC ₱37,500.00 = ₱51,590.00 (₱46,062.50) saves ₱482.14; back to Triox → no question, pick cleared; at Approval the choice cannot change and Dr Amy sees no drop-down (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();PM.length=0;TS.length=0;PR_ANS=null;__PURPRO.bfSet('pr31',3,SW,'Quotation Evaluation');await sleep(150);
    const t1=[PM.length,/^Why buy "Marine plywood 3\/4" from SWCC Hardware & Construction Supplies at ₱1,420\.00\/sheet instead of the lowest, Triox Enterprise OPC at ₱1,380\.00\/sheet\?/.test(PM[0]||''),
      TS.some(t=>/reason is required/.test(t)),JSON.stringify((P().buyFrom||{}).picks||{})];
    PR_ANS='Triox cannot deliver before 20 Oct';__PURPRO.bfSet('pr31',3,SW,'Quotation Evaluation');await sleep(200);
    const pk=P().buyFrom.picks['marine plywood 3/4|sheet']||{},M=__PURPRO.cmpModel('pr31'),v=view();
    const after=[M.plan.n,M.plan.groups.map(g=>[g.sup,g.total,g.vatAmt,g.landed]),M.plan.total,M.plan.landed,M.diff];
    const shown=[/✎ Triox cannot deliver before 20 Oct/.test(v),/Why not the lowest price:/.test(v),/Marine plywood 3\/4 → SWCC Hardware & Construction Supplies \(₱1,420\.00 vs Triox Enterprise OPC ₱1,380\.00\): Triox cannot deliver before 20 Oct — Joshane Espinosa/.test(v),!!document.querySelector('#ppCmp button')];
    PM.length=0;__PURPRO.bfSet('pr31',3,TX,'Quotation Evaluation');await sleep(150);const back=[PM.length,JSON.stringify(P().buyFrom.picks)];
    setP('pr31',x=>{x.status='Approval';});TS.length=0;__PURPRO.bfSet('pr31',3,SW,'Quotation Evaluation');await sleep(100);
    const refused=[TS.some(t=>/PR-2026-000031 is at Approval — the buy-from choices change only at Quotation Evaluation/.test(t)),JSON.stringify(P().buyFrom.picks)];
    as('amy');__PURPRO.openPR('pr31');await sleep(300);
    return {t1,pick:[pk.slot,pk.why,pk.by,pk.lowest,pk.lowestPrice,pk.price],after,shown,back,refused,amy:[!document.getElementById('ppBf0'),!!document.getElementById('ppCmp'),/buyer's plan not confirmed/.test(view())]};
  }),
  expect:{t1:[1,true,true,'{}'],pick:[SW,'Triox cannot deliver before 20 Oct','joshane',TX,1380,1420],
    after:[2,[[FAM,14090,1509.64,12580.36],[SW,37500,4017.86,33482.14]],51590,46062.5,{ex:482.14,pay:540}],shown:[true,true,true,true],back:[0,'{}'],refused:[true,'{}'],amy:[true,true,true]} },

{ name:'📨 The chain to an award by item: Joshane\'s ➡ Proceed to award records his plan (3 POs) and tells Jinky; Joshane cannot check; Jinky ✔ checks (Eyal, Dr Amy, Tester told); Dr Amy approves → PO-…1 Famous [cement 50 bag ₱245, wire 20 kg ₱92] ₱14,090.00 · PO-…2 SWCC [rebar 120 pc ₱168] + ₱300 = ₱20,460.00 · PO-…3 Triox [plywood 12 sheet ₱1,380] ₱16,560.00; poId = first, 3 poIds, RFQ Awarded "split" ₱51,110.00; sheet frozen (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();__PURPRO.cmpPropose('pr31','Quotation Evaluation');await sleep(200);
    const p1=P(),pp=(p1.buyFrom||{}).prepared||{},note1=((p1.workflow||[]).find(w=>/^Evaluation complete/.test(w.note||''))||{}).note||'';
    const tj=told(/comparison waits for your check/);
    as('jinky');__PURPRO.tab('mission');await sleep(250);const mis=/comparison check/.test(view());
    as('joshane');TS.length=0;__PURPRO.cmpCheck('pr31','Approval');const jx=[TS.some(t=>/comparison check is Jinky's/.test(t)),!P().cmpCheck];
    as('jinky');__PURPRO.openPR('pr31');await sleep(250);const jbtn=[...document.querySelectorAll('#ppCmp button')].some(b=>/Checked — comparison OK/.test(b.textContent));
    __PURPRO.cmpCheck('pr31','Approval');await sleep(150);const ta=told(/comparison checked — waiting for your award/),chk=(P().cmpCheck||{}).user;
    as('amy');__PURPRO.tab('mission');await sleep(250);const amis=/award \(comparison checked\)/.test(view());
    __PURPRO.openPR('pr31');await sleep(300);const box=(document.getElementById('ppSplitBox')||{}).innerText||'';
    CF.length=0;PM.length=0;__PURPRO.awardSplit('pr31','Approval',R().updatedAt,(P().buyFrom.prepared||{}).sig);await sleep(250);
    const pos=POS(),p=P(),rf=R();
    return {st1:p1.status,prep:[pp.user,pp.n,pp.total,pp.sig===__PURPRO.cmpModel('pr31').plan.sig],
      note1:/^Evaluation complete — Nexi: SWCC Hardware & Construction Supplies 98 · buy from 3 suppliers: Famous Lumber & Construction Supply \(Portland cement 40 kg, GI wire #16\) · SWCC Hardware & Construction Supplies \(Rebar 10 mm\) · Triox Enterprise OPC \(Marine plywood 3\/4\) · to pay ₱51,110\.00$/.test(note1),
      tj,mis,jx,jbtn,ta,chk,amis,box:/🏅 Approve split award → 3 purchase orders/.test(box),
      cf:[CF.length,/3 purchase orders · to pay ₱51,110\.00 · the plan saves ₱910\.71 without VAT against Famous Lumber & Construction Supply alone/.test(CF[0]||'')],pm:PM.length,
      pos:pos.map(x=>[x.supplier,x.total,x.delivery,x.items.map(y=>[y.desc,y.qty,y.unit,y.unitCost]),x.status]),split:pos.map(x=>[x.split.k,x.split.of,x.split.group.length,x.itemIdx]),
      pr:[p.poId===(pos[0]||{}).id,(p.poIds||[]).length,p.status],rfq:[rf.status,rf.awardedKey,rf.awardedTotal,rf.awardedTo],
      note:/^Awarded by item to 3 suppliers · ₱51,110\.00 · PO drafts PO-\d{4}-\d{6} \(Famous Lumber & Construction Supply ₱14,090\.00\) \+ PO-\d{4}-\d{6} \(SWCC Hardware & Construction Supplies ₱20,460\.00\) \+ PO-\d{4}-\d{6} \(Triox Enterprise OPC ₱16,560\.00\)$/.test(lastWf().note||''),
      au:J('hydroPro_purch_audit').filter(a=>/^award:/.test(a.action)).map(a=>a.action+' '+a.detail),
      sheet:[(p.cmpSheet||{}).kind,((p.cmpSheet||{}).award||{}).kind,(((p.cmpSheet||{}).award||{}).pos||[]).length,((p.cmpSheet||{}).people||{}).approved&&p.cmpSheet.people.approved.user,(p.awardSnapshot||{}).key]};
  }),
  expect:{st1:'Approval',prep:['joshane',3,51110,true],note1:true,tj:['jinky'],mis:true,jx:[true,true],jbtn:true,ta:['amy','eyal','tester'],chk:'jinky',amis:true,box:true,cf:[1,true],pm:0,
    pos:[[FAM,14090,0,[['Portland cement 40 kg',50,'bag',245],['GI wire #16',20,'kg',92]],'Draft'],[SW,20460,300,[['Rebar 10 mm',120,'pc',168]],'Draft'],[TX,16560,0,[['Marine plywood 3/4',12,'sheet',1380]],'Draft']],
    split:[[1,3,3,[0,2]],[2,3,3,[1]],[3,3,3,[3]]],pr:[true,3,'Purchase Order'],rfq:['Awarded','split',51110,FAM+' + '+SW+' + '+TX],note:true,
    au:['award:split Famous Lumber & Construction Supply ₱14,090.00 + SWCC Hardware & Construction Supplies ₱20,460.00 + Triox Enterprise OPC ₱16,560.00 · saves ₱910.71 without VAT'],
    sheet:['frozen','split',3,'amy','split']} },

{ name:'🔒 Award-by-item guards: Eyal prepared → Eyal refused; no Jinky check + No → nothing; a stale stamp → nothing; Triox offers 10 of 12 plywood → reason asked, PO Triox 10 sheet ₱13,800.00 and "Marine plywood 3/4 × 2 sheet short" not ordered; a second press makes no second set (3 POs) (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1({tx:{oq:[50,120,0,10]}});
    const M0=__PURPRO.cmpModel('pr31');const plan=[M0.plan.total,M0.plan.landed,M0.plan.shorts,M0.diff,M0.plan.groups.map(g=>[g.sup,g.total,g.vatAmt,g.landed])];
    as('eyal');__PURPRO.cmpPropose('pr31','Quotation Evaluation');await sleep(200);
    AL.length=0;__PURPRO.awardSplit('pr31','Approval',R().updatedAt,(P().buyFrom.prepared||{}).sig);await sleep(100);
    const self=[AL.some(a=>/You confirmed the buy-from plan of PR-2026-000031 — someone else approves it/.test(a)),POS().length];
    as('amy');__PURPRO.openPR('pr31');await sleep(250);CF_OK=false;CF.length=0;__PURPRO.awardSplit('pr31','Approval',R().updatedAt,(P().buyFrom.prepared||{}).sig);await sleep(100);
    const nocheck=[CF.some(c=>/has NOT been checked by Jinky yet/.test(c)),POS().length];CF_OK=true;
    TS.length=0;__PURPRO.awardSplit('pr31','Approval',R().updatedAt-5,(P().buyFrom.prepared||{}).sig);await sleep(100);
    const stale=[TS.some(t=>/changed since this screen was drawn/.test(t)),POS().length];
    TS.length=0;__PURPRO.awardSplit('pr31','Approval',R().updatedAt,'pxxxx');await sleep(100);const badSig=[TS.some(t=>/changed since the buyer confirmed them/.test(t)),POS().length];
    as('jinky');__PURPRO.cmpCheck('pr31','Approval');await sleep(100);
    as('amy');PM.length=0;CF.length=0;PR_ANS='Triox has only 10 sheets — the other 2 on a new request';__PURPRO.awardSplit('pr31','Approval',R().updatedAt,(P().buyFrom.prepared||{}).sig);await sleep(250);
    const r1=[PM.length,/Triox Enterprise OPC offers less than asked: 10 sheet of Marine plywood 3\/4 for 12 asked — 2 sheet short is NOT ordered/.test(PM[0]||''),CF.length];
    const tx=POS().find(x=>x.supplier===TX)||{},p=P(),wf=lastWf().note||'';
    __PURPRO.awardSplit('pr31','Approval',R().updatedAt,(p.buyFrom.prepared||{}).sig);await sleep(150);
    return {plan,self,nocheck,stale,badSig,r1,tx:[tx.total,(tx.items||[]).map(x=>[x.desc,x.qty,x.unitCost]),tx.notOrdered],partial:((p.partialAwards||[])[0]||{}).reason,
      note:/ · NOT ordered: Marine plywood 3\/4 × 2 sheet short$/.test(wf),n:POS().length,detail:/Marine plywood 3\/4 × 2 sheet short/.test(view())};
  }),
  expect:{plan:[48350,45633.93,[{i:3,desc:'Marine plywood 3/4',qty:2,unit:'sheet',sup:'Triox Enterprise OPC',offered:10,asked:12}],{ex:910.71,pay:3780},
      [[FAM,14090,1509.64,12580.36],[SW,20460,2192.14,18267.86],[TX,13800,1478.57,14785.71]]],
    self:[true,0],nocheck:[true,0],stale:[true,0],badSig:[true,0],r1:[1,true,0],
    tx:[13800,[['Marine plywood 3/4',10,1380]],[{desc:'Marine plywood 3/4',qty:2,unit:'sheet',short:true,offered:10,asked:12}]],partial:'Triox has only 10 sheets — the other 2 on a new request',note:true,n:3,detail:true} },

{ name:'🅱 Option B only on its row: SWCC Option B Phenolic board ₱1,300 is the plywood default and is not offered for cement, rebar or wire; ONE SWCC PO: rebar ₱168 + "Marine plywood 3/4 — Option B: Phenolic board 3/4" ₱1,300, delivery ₱300 once = ₱36,060.00, plus Famous ₱14,090.00 = ₱50,150.00, saves ₱500.00 without VAT against SWCC · Option B alone; the alternative is confirmed (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const swB=sup(SW,LQ(ITEMS,P1[SW],{delivery:300,deliveryDays:2,payTerms:'30 days'}),{options:[{id:'opt_b1',label:'B',spec:'Phenolic board 3/4',itemIdx:3,quote:LQ(ITEMS,[255,168,95,1300],{delivery:300,deliveryDays:2,payTerms:'30 days'}),addedBy:'joshane',addedAt:T}]});
    await S1({sw:swB});const K=SW+'#opt:opt_b1',s3=document.getElementById('ppBf3');
    const o0=[...document.getElementById('ppBf0').options].map(o=>o.value),o3=[...s3.options].map(o=>o.value),sel3=s3.value;
    const card=document.getElementById('ppCmp'),optNote=/Option B is for Marine plywood 3\/4/.test(card?card.innerText:'');
    const M=__PURPRO.cmpModel('pr31');
    await CHAIN();const pos=POS(),swp=pos.find(x=>x.supplier===SW)||{};
    return {order:M.offers.map(o=>[o.label,o.score]),o0:o0.includes(K),o3:o3.includes(K),sel3:sel3===K,def3:M.def[3]===K,optNote,
      groups:M.plan.groups.map(g=>[g.sup,g.slots.length,g.items,g.total,g.vatAmt,g.landed]),plan:[M.plan.total,M.plan.landed],single:[M.single.label,M.single.bill,M.single.landed],diff:M.diff,
      cf:CF.some(c=>/Option B is an alternative \(Phenolic board 3\/4\) for Marine plywood 3\/4 — award it\?/.test(c)),n:pos.length,
      sw:[swp.total,swp.delivery,(swp.items||[]).map(x=>[x.desc,x.unitCost]),(swp.option||{}).label,(swp.options||[]).length],alt:/ · alternative Option B \(Phenolic board 3\/4\) confirmed by amy$/.test(lastWf().note||'')};
  }),
  expect:{order:[[SW+' · Option B',98],[SW+' · Option A',96.3],[FAM,93.4],[TX,75.2]],o0:false,o3:true,sel3:true,def3:true,optNote:true,
    groups:[[FAM,1,[0,2],14090,1509.64,12580.36],[SW,2,[1,3],36060,3863.57,32196.43]],plan:[50150,44776.79],single:[SW+' · Option B',50710,45276.79],diff:{ex:500,pay:560},
    cf:true,n:2,sw:[36060,300,[['Rebar 10 mm',168],['Marine plywood 3/4 — Option B: Phenolic board 3/4',1300]],'B',1],alt:true} },

{ name:'🏅 Whole-order award unchanged: no plan confirmed: #ppAwardSel [SWCC, Famous, Triox] = SWCC (recommended), no split box → 1 PO SWCC ₱52,150.00, 4 lines, delivery ₱300, note "Awarded to SWCC … · ₱52,150.00 · PO draft PO-…", sheet frozen with SWCC on every item; a confirmed all-Famous plan (2 reasons) preselects Famous → override reason → PO Famous ₱52,130.00 (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1({pr:{status:'Approval'}});as('amy');__PURPRO.openPR('pr31');await sleep(300);
    const sel=document.getElementById('ppAwardSel'),opts=[...sel.options].map(o=>o.value),txt=[...sel.options].map(o=>o.textContent),selv=sel.value,box=!!document.getElementById('ppSplitBox');
    const v0=view(),note0=/The buyer has not confirmed a per-item plan — the whole order goes to one supplier below/.test(v0);
    CF.length=0;PM.length=0;__PURPRO.award('pr31','','Approval',R().updatedAt);await sleep(250);
    const po=POS()[0]||{},p=P(),M=__PURPRO.cmpModel('pr31');
    const part1={opts,txt,selv,box,note0,cf:CF.length,pm:PM.length,po:[POS().length,po.supplier,po.total,(po.items||[]).length,po.delivery],
      note:/^Awarded to SWCC Hardware & Construction Supplies · ₱52,150\.00 · PO draft PO-\d{4}-\d{6}$/.test(lastWf().note||''),sheet:[(p.cmpSheet||{}).kind,((p.cmpSheet||{}).award||{}).kind],aw:(M.awarded||[]).map(a=>a&&a.sup)};
    put('hydroPro_purch_pos',[]);put('hydroPro_purch_audit',[]);await S1();
    PR_ANS='Famous delivers everything in one trip';__PURPRO.bfSet('pr31',1,FAM,'Quotation Evaluation');await sleep(150);__PURPRO.bfSet('pr31',3,FAM,'Quotation Evaluation');await sleep(150);
    __PURPRO.cmpPropose('pr31','Quotation Evaluation');await sleep(200);const note1=((P().workflow||[]).find(w=>/^Evaluation complete/.test(w.note||''))||{}).note||'';
    as('jinky');__PURPRO.cmpCheck('pr31','Approval');await sleep(100);
    as('amy');__PURPRO.openPR('pr31');await sleep(300);const s2=document.getElementById('ppAwardSel'),v2=s2?s2.value:null,box2=!!document.getElementById('ppSplitBox');
    PM.length=0;PR_ANS='one supplier, one delivery';__PURPRO.award('pr31','','Approval',R().updatedAt);await sleep(250);
    const po2=POS()[0]||{};
    return {part1,part2:{note1:/ · buy everything from Famous Lumber & Construction Supply · to pay ₱52,130\.00$/.test(note1),v2,box2,pm:/overriding Nexi's recommendation/.test(PM[0]||''),po:[POS().length,po2.supplier,po2.total],
      au:J('hydroPro_purch_audit').filter(a=>/^award/.test(a.action)).map(a=>a.action)}};
  }),
  expect:{part1:{opts:[SW,FAM,TX],txt:['SWCC Hardware & Construction Supplies — ₱46,562.50 landed total · 4 of 4 items · score 98 (recommended)','Famous Lumber & Construction Supply — ₱46,544.64 landed total · 4 of 4 items · score 95','Triox Enterprise OPC — ₱44,696.43 landed total · 3 of 4 items · score 76.2'],
      selv:SW,box:false,note0:true,cf:0,pm:0,po:[1,SW,52150,4,300],note:true,sheet:['frozen','single'],aw:[SW,SW,SW,SW]},
    part2:{note1:true,v2:FAM,box2:false,pm:true,po:[1,FAM,52130],au:['award:override','award']}} },

{ name:'📦 Three POs downstream: issue each (3 confirms); ➡ Move to receiving refused while PO-…2 is Draft; receive SWCC 120 pc → Fully Delivered, others Issued; invoice ₱20,460.00 on the SWCC PO → Matched; receive all → ✅ Complete → Completed, 3 POs Closed; no red "still live" banner (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();await CHAIN();const ids=(P().poIds||[]).slice(),num=i=>(POS().find(x=>x.id===ids[i])||{}).number;
    as('amy');__PURPRO.openPR('pr31');await sleep(250);const tabs=document.querySelectorAll('#ppPoTabs button').length;
    CF.length=0;__PURPRO.issuePO('pr31',ids[0]);await sleep(150);const v1=view();
    TS.length=0;__PURPRO.simpleAdvance('pr31','PO issued — awaiting delivery','Purchase Order',ids[0]);await sleep(150);
    const ref=[TS.some(t=>t.indexOf(num(1)+' is Draft — issue it first')>=0),P().status];
    __PURPRO.issuePO('pr31',ids[1]);await sleep(100);__PURPRO.issuePO('pr31',ids[2]);await sleep(100);const conf=CF.length;
    __PURPRO.simpleAdvance('pr31','PO issued — awaiting delivery','Purchase Order',ids[0]);await sleep(200);const st2=P().status;
    __PURPRO.poSel('pr31',ids[1]);await sleep(200);val('ppGacc0','120');__PURPRO.recordGRN('pr31',ids[1]);await sleep(200);
    const s1=ids.map(id=>(POS().find(x=>x.id===id)||{}).status);
    __PURPRO.tab('invs');await sleep(250);val('ppInvPo',ids[1]);val('ppInvNum','SW-INV-1');val('ppInvAmt','20460');val('ppInvDate',today);__PURPRO.addInvoice();await sleep(200);
    const inv=J('hydroPro_purch_invoices')[0]||{};
    __PURPRO.openPR('pr31');await sleep(250);__PURPRO.poSel('pr31',ids[0]);await sleep(200);val('ppGacc0','50');val('ppGacc1','20');__PURPRO.recordGRN('pr31',ids[0]);await sleep(200);
    __PURPRO.poSel('pr31',ids[2]);await sleep(200);val('ppGacc0','12');__PURPRO.recordGRN('pr31',ids[2]);await sleep(200);
    CF.length=0;__PURPRO.completePR('pr31',ids[0]);await sleep(250);
    return {tabs,still:/still live/.test(v1),ref,conf,st2,s1,inv:[inv.matchStatus,inv.poId===ids[1]],cf:CF.length&&/invoice matched ✓/.test(CF[0])&&/invoice not matched yet/.test(CF[0]),done:P().status,
      closed:ids.map(id=>(POS().find(x=>x.id===id)||{}).status),note:/^Completed · 3 purchase orders · invoices pending$/.test(lastWf().note||'')};
  }),
  expect:{tabs:3,still:false,ref:[true,'Purchase Order'],conf:3,st2:'Receiving',s1:['Issued','Fully Delivered','Issued'],inv:['Matched',true],cf:true,done:'Completed',closed:['Closed','Closed','Closed'],note:true} },

{ name:'↩ Frozen, then unfrozen: after the award Famous cement → ₱999 on the RFQ changes nothing printed (₱245.00, ₱51,110.00, Approved by Dr Amy Patdu); Dr Amy ↩ back to Quotation Evaluation ("Famous changed its price") cancels the 3 drafts, clears poId / poIds / sheet (1 in history) / plan / Jinky\'s check; redo says "Jinky Pagtama\'s comparison check"; the live grid now buys cement from Triox ₱250 (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();await CHAIN();
    setR('rfq31',r=>{r.suppliers.find(s=>s.name===FAM).quote.lines[0].unitPrice=999;});
    const o=PRINT();__PURPRO.cmpPrint('pr31');const h=st(o.html);
    const fz=[/★ ₱245\.00/.test(h),!/₱999\.00/.test(h),/₱51,110\.00/.test(h),/Approved by — Dr Amy \/ Eyal Dr Amy Patdu/.test(h),/frozen at the award/.test(h)];
    as('amy');PR_ANS=null;const ok=__PURPRO.goBack('pr31','Purchase Order','Quotation Evaluation','Famous changed its price');await sleep(250);
    const p=P(),rf=R(),b=(lastWf().back||{}).cleared||{};
    return {fz,ok,pos:POS().map(x=>x.status),pr:[p.poId,p.poIds===undefined,p.cmpSheet===undefined,(p.cmpSheetHistory||[]).length,((p.buyFrom||{}).prepared)===undefined,p.cmpCheck===undefined,!!p.buyFrom&&p.buyFrom.v===1,p.status],
      rfq:[rf.status,rf.awardedKey],cleared:[(b.pos||[]).length,!!b.cmpSheet,(b.cmpCheck||{}).user,(b.buyFromPrepared||{}).user,(b.poIds||[]).length],
      note:/to redo: the award to Famous Lumber & Construction Supply \+ SWCC Hardware & Construction Supplies \+ Triox Enterprise OPC, draft PO-\d{4}-\d{6} cancelled, draft PO-\d{4}-\d{6} cancelled, draft PO-\d{4}-\d{6} cancelled, the buy-from plan \(Joshane Espinosa\), Jinky Pagtama's comparison check$/.test(lastWf().note||''),
      def0:__PURPRO.cmpModel('pr31').def[0],kind:__PURPRO.cmpModel('pr31').kind};
  }),
  expect:{fz:[true,true,true,true,true],ok:true,pos:['Cancelled','Cancelled','Cancelled'],pr:[null,true,true,1,true,true,true,'Quotation Evaluation'],rfq:['Open',null],cleared:[3,true,'jinky','joshane',3],note:true,def0:TX,kind:'live'} },

{ name:'🖨 Print comparison before approval: one write, A4 landscape, PR-2026-000031 · RFQ-2026-000031, Requested by Joshane Espinosa · Construction · GH15, purpose; Famous Lumber &amp; Construction Supply, "—" for Triox wire, 4 lowest cells, Buy from per item, ₱51,110.00 vs ₱52,130.00 saves ₱910.71; "Live comparison — not yet approved"; empty signature lines; no offer file; print called on a desktop (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();const o=PRINT();const r=__PURPRO.cmpPrint('pr31');await sleep(800);const h=o.html,t=st(h);
    return {r,opened:o.opened,writes:o.writes,title:/<title>Offer comparison PR-2026-000031 · RFQ-2026-000031<\/title>/.test(h),a4:/@page\{size:A4 landscape/.test(h),brand:/hnx-brand/.test(h),fam:/Famous Lumber &amp; Construction Supply/.test(h),
      lo:(h.match(/<td class="n lo"/g)||[]).length,na:(h.match(/<td class="na" colspan="2">—<\/td>/g)||[]).length,h1:/Offer comparison — PR-2026-000031 · RFQ-2026-000031/.test(t),
      req:/Requested by: Joshane Espinosa · Construction · GH15/.test(t),purpose:/Purpose: Cement, rebar, tie wire and plywood for the GH15 slab and its formworks\./.test(t),deliver:/Deliver to: GH15 \(project\) — confirm the drop-off point with the buyer/.test(t),
      buyFrom:(h.match(/<td class="bf"><b>/g)||[]).length,plan:[/Chosen plan: 3 purchase orders · to pay ₱51,110\.00/.test(t),/Cheapest single supplier for all items: Famous Lumber & Construction Supply · to pay ₱52,130\.00/.test(t),/The plan saves ₱910\.71 without VAT/.test(t)],
      perSup:/Per supplier/.test(t)&&/Total ₱14,090\.00|Total to pay/.test(t),live:/Live comparison — not yet approved · offers can still change/.test(t),
      sigs:['Prepared by — Buyer','Checked by — Accountant','Approved by — Dr Amy / Eyal'].every(x=>h.includes(x)),emptySig:(h.match(/<div class="nm"><\/div>/g)||[]).length,
      noFile:!/U0VDUkVURklMRQ|data:application\/pdf/.test(h),footer:/Nexi · Purchasing · PR-2026-000031 · printed .* by .* · v\d+\.\d+/.test(t)&&typeof APP_VERSION!=='undefined'&&t.includes('· v'+APP_VERSION),printed:o.printed===(matchMedia('(pointer:coarse)').matches?0:1),
      audit:J('hydroPro_purch_audit').some(a=>a.action==='cmp:print'&&a.ref==='PR-2026-000031')};
  }),
  expect:{r:true,opened:1,writes:1,title:true,a4:true,brand:true,fam:true,lo:4,na:1,h1:true,req:true,purpose:true,deliver:true,buyFrom:4,plan:[true,true,true],perSup:true,live:true,sigs:true,emptySig:3,noFile:true,footer:true,printed:true,audit:true} },

{ name:'🖨 Print after approval + reasons: plywood → SWCC with "Triox cannot deliver before 20 Oct", then the chain → 2 POs; the printout names Prepared by Joshane Espinosa, Checked by Jinky Pagtama, Approved by Dr Amy Patdu with dates, shows PO numbers in Buy from, the reason, ₱51,590.00 and saves ₱482.14; "Approved … — frozen at the award"; no "not yet approved" (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();PR_ANS='Triox cannot deliver before 20 Oct';__PURPRO.bfSet('pr31',3,SW,'Quotation Evaluation');await sleep(150);await CHAIN();
    const pos=POS(),o=PRINT();__PURPRO.cmpPrint('pr31');const h=o.html,t=st(h);
    const sig=(role,name)=>new RegExp('<div class="role">'+role+'</div><div class="nm">'+name+'</div><div class="ln">Signature over printed name</div><div class="dt">Date: \\d{1,2} [A-Z][a-z]{2} \\d{4}</div>').test(h);
    return {n:pos.length,sigs:[sig('Prepared by — Buyer','Joshane Espinosa'),sig('Checked by — Accountant','Jinky Pagtama'),sig('Approved by — Dr Amy / Eyal','Dr Amy Patdu')],
      poNums:pos.every(p=>t.includes(p.number)),why:/Why: Triox cannot deliver before 20 Oct/.test(t),reason:/Marine plywood 3\/4 → SWCC Hardware & Construction Supplies \(₱1,420\.00 vs Triox Enterprise OPC ₱1,380\.00\): Triox cannot deliver before 20 Oct — Joshane Espinosa/.test(t),
      plan:/₱51,590\.00/.test(t),saves:/The plan saves ₱482\.14 without VAT/.test(t),frozen:/Approved \d{1,2} [A-Z][a-z]{2} \d{4} by Dr Amy Patdu — frozen at the award/.test(t),notYet:/not yet approved/.test(t),
      awarded:/Awarded: by item — Famous Lumber & Construction Supply \+ SWCC Hardware & Construction Supplies · 2 purchase orders/.test(t)};
  }),
  expect:{n:2,sigs:[true,true,true],poNums:true,why:true,reason:true,plan:true,saves:true,frozen:true,notYet:false,awarded:true} },

{ name:'🖨 Six offers split into two tables: S6 (+ Wilcon, CW Home Depot, Citi Hardware cement only): tables of 4 and 2 offers, each repeating Item / Qty / Buy from; every supplier header once; the plan stays 3 POs ₱51,110.00 (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1({more:[sup('Wilcon Depot',LQ(ITEMS,[248,null,null,null])),sup('CW Home Depot',LQ(ITEMS,[249,null,null,null])),sup('Citi Hardware',LQ(ITEMS,[251,null,null,null]))]});
    const M=__PURPRO.cmpModel('pr31'),h=__PURPRO.cmpHtml('pr31','sheet'),tabs=h.split('<table class="cmp"').slice(1).map(x=>x.split('</table>')[0]);
    const e=s=>s.replace(/&/g,'&amp;');
    return {order:M.offers.map(o=>o.sup),plan:[M.plan.n,M.plan.total],n:tabs.length,heads:tabs.map(x=>[/>Item</.test(x),/>Qty</.test(x),/>Buy from</.test(x),(x.match(/<th colspan="2">/g)||[]).length,(x.match(/<tr>/g)||[]).length]),
      once:[SW,FAM,TX,'Wilcon Depot','CW Home Depot','Citi Hardware'].map(n=>h.split('<th colspan="2">'+e(n)).length-1)};
  }),
  expect:{order:[SW,FAM,TX,'Wilcon Depot','CW Home Depot','Citi Hardware'],plan:[3,51110],n:2,heads:[[true,true,true,4,6],[true,true,true,2,6]],once:[1,1,1,1,1,1]} },

{ name:'🧾 Buy list: before approval 3 pages with "DRAFT — not yet approved": Famous cement + wire ₱14,090.00 (famous@x.ph · 0917 000 0000) · SWCC rebar + delivery ₱300.00 = ₱20,460.00 · Triox plywood ₱16,560.00, each only its items, Deliver to GH15; after the award the same 3 pages carry PO-…1/2/3 and no DRAFT (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();const sec=h=>h.split('<section class="bl').slice(1).map(st);
    const chk=(t,s,inc,exc,tot)=>[t.includes('BUY LIST — '+s),inc.filter(x=>!t.includes(x)),exc.filter(x=>t.includes(x)),t.includes('Total to pay '+tot)];
    const spec=[[FAM,['Portland cement 40 kg','GI wire #16','famous@x.ph · 0917 000 0000','VAT included (12%) ₱1,509.64'],['Rebar 10 mm','Marine plywood'],'₱14,090.00'],
      [SW,['Rebar 10 mm','Delivery ₱300.00','swcc@x.ph','Payment terms: 30 days · lead time 2 d'],['Portland cement','GI wire','Marine plywood'],'₱20,460.00'],
      [TX,['Marine plywood 3/4','triox@x.ph'],['Portland cement','Rebar 10 mm','GI wire'],'₱16,560.00']];
    const B0=sec(__PURPRO.cmpHtml('pr31','buy'));
    const before=B0.map((t,k)=>chk(t,spec[k][0],spec[k][1].concat(['DRAFT — not yet approved','Deliver to: GH15','PO: — (after the approval)','Approval: pending','Page '+(k+1)+' of 3 · PR-2026-000031']),spec[k][2],spec[k][3]));
    const o=PRINT();__PURPRO.cmpPrintBuy('pr31');const pr1=[o.opened,o.writes,/<title>Buy list PR-2026-000031 · RFQ-2026-000031<\/title>/.test(o.html)];
    await CHAIN();const pos=POS(),B1=sec(__PURPRO.cmpHtml('pr31','buy'));
    const after=B1.map((t,k)=>chk(t,spec[k][0],spec[k][1].concat(['PO: '+pos[k].number,'Approved: Dr Amy Patdu','Checked: Jinky Pagtama','Buyer: Joshane Espinosa']),spec[k][2].concat(['DRAFT']),spec[k][3]));
    return {n0:B0.length,before,pr1,n1:B1.length,after};
  }),
  expect:{n0:3,before:[[true,[],[],true],[true,[],[],true],[true,[],[],true]],pr1:[1,1,true],n1:3,after:[[true,[],[],true],[true,[],[],true],[true,[],[],true]]} },

{ name:'🖨 Where the buttons are: 📝 Purchase Requests: 🖨 on PR-2026-000031 (offers), none on the Draft PR-2026-000040; pressing it prints without opening the request; RFQ stage with one offer shows the print bar, without offers none; a Completed request still shows 🖨 Print comparison / 🖨 Print buy list / 📊 Excel and prints the frozen sheet (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();const a=J('hydroPro_purch_prs');a.push(PR('pr40','PR-2026-000040',ITEMS,{status:'Draft',rfqId:null,title:'Draft request'}));put('hydroPro_purch_prs',a);
    __PURPRO.tab('prs');await sleep(300);
    const rows=[...document.querySelectorAll('#view-acct_purch_pro table.pp-tbl tbody tr')],rowOf=n=>rows.find(r=>r.textContent.includes(n));
    const b31=rowOf('PR-2026-000031')&&rowOf('PR-2026-000031').querySelector('button[title="Print the offer comparison"]'),b40=rowOf('PR-2026-000040')&&rowOf('PR-2026-000040').querySelector('button[title="Print the offer comparison"]');
    const o=PRINT();if(b31)b31.click();await sleep(200);const list=[!!b31,!b40,o.opened,/Offer comparison PR-2026-000031/.test(o.html),!document.getElementById('ppCmp')&&!!document.querySelector('#view-acct_purch_pro table.pp-tbl')];
    setP('pr31',x=>{x.status='RFQ';});setR('rfq31',r=>{r.suppliers.forEach((s,i)=>{if(i>0)s.quote=null;});});__PURPRO.openPR('pr31');await sleep(250);
    const rfqBar=[!!document.getElementById('ppCmpBar'),/RFQ-2026-000031 · 1 offer · 4 items/.test((document.getElementById('ppCmpBar')||{}).innerText||'')];
    setR('rfq31',r=>{r.suppliers.forEach(s=>{s.quote=null;});});__PURPRO.openPR('pr31');await sleep(250);const noBar=!document.getElementById('ppCmpBar');
    put('hydroPro_purch_pos',[]);await S1();await CHAIN();setP('pr31',x=>{x.status='Completed';});setR('rfq31',r=>{r.suppliers.find(s=>s.name===FAM).quote.lines[0].unitPrice=999;});
    __PURPRO.openPR('pr31');await sleep(300);const bar=[...document.querySelectorAll('#ppCmpBar button')].map(b=>b.textContent.trim());
    const det=document.getElementById('ppCmp'),isDet=!!det&&det.tagName==='DETAILS'&&!det.open,chip=/🔒 approved \d{1,2} [A-Z][a-z]{2} \d{4} by Dr Amy Patdu — frozen/.test(det?det.textContent:'');
    const o2=PRINT();[...document.querySelectorAll('#ppCmpBar button')].find(b=>/Print comparison/.test(b.textContent)).click();await sleep(100);const t2=st(o2.html);
    return {list,rfqBar,noBar,bar,isDet,chip,completed:[o2.opened,/frozen at the award/.test(t2),/★ ₱245\.00/.test(t2),!/₱999/.test(t2)]};
  }),
  expect:{list:[true,true,1,true,true],rfqBar:[true,true],noBar:true,bar:['🖨 Print comparison','🖨 Print buy list','📊 Excel'],isDet:true,chip:true,completed:[1,true,true,true]} },

{ name:'📊 Excel: sheets ["Offer comparison","Buy list"]; header (17 columns); cement row [Portland cement 40 kg, 50, bag, 255, 12750, "", 245, 12250, "", 250, 12500, "", Famous…, Famous…, 245, 12250, ""]; wire row has "—" for Triox; landed row 46562.5 / 46544.64 / 44696.43 / plan 45633.93; Famous buy-list rows incl. VAT (included) 1509.64 and Total to pay 14090; with no XLSX it calls ensureXLSX once and writes; ⬇ Excel comparison does the same and keeps ["Apple to apple","Item by item"] (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();const cap=XL();__PURPRO.cmpExcel('pr31');
    const S=cap.S||[],s1=(S[0]||{}).rows||[],s2=(S[1]||{}).rows||[],hi=s1.findIndex(r=>r[0]==='Item'),hdr=s1[hi]||[];
    const cem=s1[hi+1],wire=s1[hi+3]||[],landed=s1.find(r=>r[0]==='Landed total ex-VAT ₱'),toPay=s1.find(r=>r[0]==='To pay ₱'),plan=s1.find(r=>r[0]==='Chosen plan'),diff=s1.find(r=>r[0]==='Difference without VAT');
    const fam=s2.filter(r=>r[0]===FAM).map(r=>[r[2],r[7]]);
    delete window.XLSX;let calls=0,cap2=null;window.ensureXLSX=()=>{calls++;cap2=XL();return Promise.resolve();};
    __PURPRO.cmpExcel('pr31');await sleep(300);
    delete window.XLSX;let calls2=0,cap3=null;window.ensureXLSX=()=>{calls2++;cap3=XL();return Promise.resolve();};
    __PURPRO.a2aExcel('pr31');await sleep(300);
    return {name:cap.name,sheets:S.map(s=>s.name),title:s1[0],n:hdr.length,hdr,cem,wire:wire.slice(9,12),landed,toPay,plan,diff,fam,s2h:s2[0],
      load:[calls,cap2&&cap2.name,cap2&&cap2.S&&cap2.S.length],a2a:[calls2,cap3&&cap3.name,cap3&&cap3.S&&cap3.S.map(s=>s.name)],audit:J('hydroPro_purch_audit').filter(a=>a.action==='cmp:excel').length};
  }),
  expect:{name:'Offer_comparison_PR-2026-000031.xlsx',sheets:['Offer comparison','Buy list'],title:['Offer comparison — PR-2026-000031 · RFQ-2026-000031 · GH15 slab and formworks'],n:17,
    hdr:['Item','Qty','Unit',SW+' ₱/unit',SW+' line ₱',SW+' brand / spec',FAM+' ₱/unit',FAM+' line ₱',FAM+' brand / spec',TX+' ₱/unit',TX+' line ₱',TX+' brand / spec','Lowest','Buy from','Buy-from ₱/unit','Buy-from line ₱','Reason'],
    cem:['Portland cement 40 kg',50,'bag',255,12750,'',245,12250,'',250,12500,'',FAM,FAM,245,12250,''],wire:['—','',''],
    landed:['Landed total ex-VAT ₱','','',46562.5,'','',46544.64,'','',44696.43,'','','','','',45633.93,''],toPay:['To pay ₱','','',52150,'','',52130,'','',50060,'','','','','',51110,''],
    plan:['Chosen plan','3 purchase orders','to pay',51110,'without VAT',45633.93],diff:['Difference without VAT',910.71],
    fam:[['Portland cement 40 kg',12250],['GI wire #16',1840],['Delivery',0],['VAT (included)',1509.64],['Total to pay',14090]],s2h:['Supplier','PO','Item','Brand / spec','Qty','Unit','Unit price ₱','Line ₱'],
    load:[1,'Offer_comparison_PR-2026-000031.xlsx',2],a2a:[1,'Offers_PR-2026-000031.xlsx',['Apple to apple','Item by item']],audit:2} },

{ name:'📱 Phone 390 px: the comparison card fits (no sideways page scroll), each Buy-from drop-down is ≥ 140 px and on screen, the print bar buttons are on screen; the print page has the phone CSS and the 🖨 Print / Save PDF button (v23.04)',
  requires:NEED,seed:SEED,viewport:{width:390,height:844},
  run:run(async()=>{
    await S1();await sleep(300);const card=document.getElementById('ppCmp'),W=window.innerWidth;
    const cr=card?card.getBoundingClientRect():{left:-1,right:9999};
    const dd=[0,1,2,3].map(i=>{const e=document.getElementById('ppBf'+i);if(!e)return [false,false];e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [r.width>=140,r.left>=0&&r.right<=W+1];});
    const bar=[...document.querySelectorAll('#ppCmpBar button')].map(b=>{b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=W+1;});
    const h=__PURPRO.cmpHtml('pr31','sheet');
    return {card:!!card,fits:cr.left>=0&&cr.right<=W+1,noScroll:document.documentElement.scrollWidth<=W+1,dd,bar,phoneCss:/@media screen and \(max-width:760px\)/.test(h),btn:/🖨 Print \/ Save PDF/.test(h)};
  }),
  expect:{card:true,fits:true,noScroll:true,dd:[[true,true],[true,true],[true,true],[true,true]],bar:[true,true,true],phoneCss:true,btn:true} },

{ name:'🚫 Pop-ups blocked: window.open → null: toast "Pop-up blocked — allow pop-ups for this site to print", returns false (comparison and buy list), no page error, nothing audited (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    await S1();window.open=()=>null;TS.length=0;const r=__PURPRO.cmpPrint('pr31'),r2=__PURPRO.cmpPrintBuy('pr31');
    return {r,r2,toast:TS.filter(t=>/Pop-up blocked — allow pop-ups for this site to print/.test(t)).length,audit:J('hydroPro_purch_audit').filter(a=>/^cmp:print/.test(a.action)).length};
  }),
  expect:{r:false,r2:false,toast:2,audit:0} },

{ name:'1️⃣ One-item request: PR-2026-000033 SWCC ₱890★ / Triox ₱1,030: 1 row, no drop-down, Buy from "Nexi: SWCC…" before the award; buy list 1 page SWCC ₱8,900.00 DRAFT; after Dr Amy\'s award Buy from "SWCC … PO-…", sheet kind single, no DRAFT (v23.04)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    const IT4=[{desc:'3/4 Phenolic board',code:'',qty:10,unit:'pc',unitCost:850}];
    const Q4=u=>({qty:10,unitPrice:u,vatIncl:true,delivery:0,total:u*10,brand:'',validUntil:'2027-12-31',deliveryDays:3,payTerms:'COD',warranty:'',notes:'',deliverToOk:false,file:null,at:T,by:'joshane'});
    put('hydroPro_purch_prs',[PR('pr33','PR-2026-000033',IT4,{title:'Phenolic board for GH15'})]);put('hydroPro_purch_rfqs',[RFQ('rfq33','RFQ-2026-000033','pr33',[sup(SW,Q4(890)),sup(TX,Q4(1030))])]);
    as('joshane');__PURPRO.openPR('pr33');await sleep(300);
    const card=document.getElementById('ppCmp'),rows=card?card.querySelectorAll('tbody tr:not(.ft)').length:0,dd=!!document.getElementById('ppBf0');
    const bf=((card&&card.querySelector('tbody tr:not(.ft) td.bf'))||{}).innerText||'',M=__PURPRO.cmpModel('pr33');
    const b0=__PURPRO.cmpHtml('pr33','buy'),t0=st(b0),n0=b0.split('<section class="bl').length-1;
    __PURPRO.cmpPropose('pr33','Quotation Evaluation');await sleep(200);const prep=((P('pr33').buyFrom||{}).prepared||{}).sig;
    as('jinky');__PURPRO.cmpCheck('pr33','Approval');await sleep(100);
    as('amy');__PURPRO.openPR('pr33');await sleep(300);CF.length=0;PM.length=0;__PURPRO.award('pr33','','Approval',R('rfq33').updatedAt);await sleep(250);
    __PURPRO.openPR('pr33');await sleep(300);const po=POS()[0]||{},p=P('pr33');
    const c2=document.getElementById('ppCmp');if(c2)c2.open=true;await sleep(50);const bf2=((c2&&c2.querySelector('tbody tr:not(.ft) td.bf'))||{}).innerText||'';
    const b1=__PURPRO.cmpHtml('pr33','buy'),s1=__PURPRO.cmpHtml('pr33','sheet');
    return {rows,dd,bf:[/Nexi: SWCC Hardware & Construction Supplies/.test(bf),/chosen at the award/.test(bf)],cells:M.offers.map(o=>[o.sup,o.mode,o.cells[0].unitPrice,o.cells[0].unitEx,o.cells[0].line,o.cells[0].lowest]),plan:M.plan,nexi:[M.nexi.label,M.nexi.score],
      buy0:[n0,/DRAFT — not yet approved/.test(t0),/BUY LIST — SWCC Hardware & Construction Supplies/.test(t0),/Total to pay ₱8,900\.00/.test(t0)],prep,
      after:[po.supplier,po.total,/SWCC Hardware & Construction Supplies/.test(bf2),!!po.number&&bf2.includes(po.number),((p.cmpSheet||{}).award||{}).kind,/DRAFT/.test(b1),!!po.number&&b1.includes('PO: '+po.number),/Checked by — Accountant<\/div><div class="nm">Jinky Pagtama/.test(s1)]};
  }),
  expect:{rows:1,dd:false,bf:[true,true],cells:[[SW,'unit',890,794.64,8900,true],[TX,'unit',1030,919.64,10300,false]],plan:null,nexi:[SW,95],buy0:[1,true,true,true],prep:'single',
    after:[SW,8900,true,true,'single',false,true,true]} },
];
