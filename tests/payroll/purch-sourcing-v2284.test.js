/* v22.84 (Eyal 13 Oct 2026, screenshot of Joshane's hardware request PR-2026-000011 — Common Wire Nail #2 / #3, Tansi #200 — at
   Supplier Sourcing: "why suppliers that not selling this item in the list?"). The screen listed LAZADA (153 orders, a marketplace)
   among the fits and EVERY other vendor (seeds, cargo, chemicals, Amazon…) under "Other known suppliers". Since v22.84 only suppliers
   that SELL this kind of item are listed (a SELLS tag on the card, an awarded PO of that classification, an exact past purchase, the
   item words in the name / category); everybody else is reached through 🔍 Pick another supplier, which teaches Nexi; online shops
   only under 🛒 ONLINE / 🌏 IMPORT; admins edit what a supplier sells on the 360° card; duplicate spellings (A.C. Deang = AC Deang)
   count as one and can be merged from Mission Control. */
const USERS=[{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',department:'Purchasing',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',role:'admin_secondary',active:true},
  {username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true},
  {username:'joshane',fullname:'Joshane Espinosa',role:'operator',department:'Purchasing',active:true}];
const FAM='Famous Lumber & Construction Supply',SW='SWCC Hardware & Construction Supplies',TX='Triox Enterprise OPC',CH='Chribas Trading Inc.',SY='San Yin Hardware',ACD='A.C. Deang Marketing',ACD2='AC Deang Marketing';
const VENDORS=[{id:'v1',name:FAM,phone:'0917 100 0001'},{id:'v2',name:SW,phone:'0917 100 0002'},{id:'v3',name:TX},{id:'v4',name:SY,phone:'0917'},{id:'v5',name:CH,category:'Hardware',email:'sales@chribas.ph'},
  {id:'v6',name:'LAZADA'},{id:'v7',name:'Amazon'},{id:'v8',name:ACD},{id:'v9',name:ACD2,email:'ac@deang.ph'},{id:'v10',name:'Allegiance Cargo Advantage'},{id:'v11',name:'Allied Botanical Corporation',phone:'0917 100 0011'},
  {id:'v12',name:'Alyson Chemicals Inc.'},{id:'v13',name:'CN SEEDS LTD'},{id:'v14',name:'Bedscape Corp.'}];
function hist(){
  const H=[];let n=0;const row=(sup,product,qty,cost,date)=>H.push({id:'h'+(++n),date:date||'2026-0'+(1+(n%9))+'-1'+(n%9),product,supplier:sup,qty,unitCost:cost});
  ['Common Wire Nail #2','Plywood 1/2 ordinary','Portland cement 40kg','Coco lumber 2x3x10','Tie wire #16','Hollow blocks 4in','Gravel 3/4','Sand washed','Rebar 10mm','Paint latex white'].forEach((p,i)=>row(FAM,p,10+i,100+i,'2026-08-0'+(1+i%9)));
  ['Hollow blocks 4in','Gravel 3/4','Rebar 10mm','PVC pipe 2in','Plywood 3/4 marine','Portland cement 40kg','Sand washed','Tie wire #16','Nails 2in','GI sheet 8ft','Paint latex grey'].forEach((p,i)=>row(SW,p,5+i,90+i,'2026-07-0'+(1+i%9)));
  ['Gravel 3/4','Sand washed','Common Wire Nail #3','Gravel 1/2','Sand fine','Rebar 12mm','Hollow blocks 6in','Cement 40kg','Plywood 1/4','Tie wire #16','Nails 3in','Gravel 3/4','Sand washed','Rebar 10mm','Hollow blocks 4in'].forEach((p,i)=>row(TX,p,20+i,80+i,'2026-06-0'+(1+i%9)));
  const filler=['Phone case','LED strip 5m','Desk fan','Kitchen scale','Storage box 60L'];
  for(let i=0;i<150;i++)row('LAZADA',filler[i%5],1,100+(i%7)*10,'2026-0'+(1+i%9)+'-0'+(1+i%9));
  row('LAZADA','Common Wire Nail #2 1kg',2,150,'2026-09-01');row('LAZADA','USB-C cable 1m',3,250,'2026-09-20');row('LAZADA','Tansi #200',1,420,'2026-08-15');
  row('Amazon','Book: Greenhouse design',1,1500,'2026-03-01');row('Amazon','Kindle',1,6000,'2026-03-02');row('Amazon','Echo dot',1,2500,'2026-03-03');
  row(ACD,'Fertilizer 14-14-14 50kg',1,1000,'2026-05-01');row(ACD,'Urea 46-0-0 50kg',1,2000,'2026-05-02');row(ACD2,'Complete fertilizer 25kg',1,500,'2026-04-01');
  return H;}
const ITEMS=[{desc:'Common Wire Nail #2',code:'',qty:5,unit:'kg',unitCost:0},{desc:'Common Wire Nail #3',code:'',qty:5,unit:'kg',unitCost:0},{desc:'Tansi #200',code:'',qty:5,unit:'roll',unitCost:0}];
const T=Date.now()-2*864e5;
const PR=(ex)=>Object.assign({id:'pr11',number:'PR-2026-000011',title:'Nails and tansi for GH15',dept:'Construction',project:'GH15',klass:'Construction materials',company:'APTI',needBy:'2026-10-31',priority:'Normal',
  justification:'Common wire nails and tansi for the GH15 formworks.',items:ITEMS.map(x=>Object.assign({},x)),status:'Supplier Sourcing',createdBy:'joshane',createdAt:T,revision:1,checkedBy:'Jinky Pagtama',checkedAt:T+1000,
  approvedBy:'Dr Amy Patdu',approvedAt:T+2000,approvedEstimate:0,workflow:[{stage:'Draft',at:T,by:'Joshane Espinosa',note:'created'}],overrides:[]},ex||{});
const RFQ11=(ex)=>Object.assign({id:'rfq11',number:'RFQ-2026-000011',prId:'pr11',status:'Open',closingDate:'2026-10-18',createdAt:T,updatedAt:T,suppliers:[FAM,SW,TX,CH].map(n=>({name:n,email:'',phone:'',sentAt:null,channel:null,quote:null}))},ex||{});
const SEED=new Function("localStorage.setItem('hydroPro_users',JSON.stringify("+JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}].concat(USERS))+"));"+
  "['hydroPro_purch_rfqs','hydroPro_purch_pos','hydroPro_purch_grns','hydroPro_purch_invoices','hydroPro_pa_inbox_v1','hydroPro_purch_audit','hydroPro_inv_suppliers_v1'].forEach(k=>localStorage.setItem(k,'[]'));"+
  "localStorage.removeItem('hydroPro_purch_roles_v1');localStorage.removeItem('hnx_cloud_token');localStorage.removeItem('hydroPro_purch_source_class_v1');"+
  "localStorage.setItem('hydroPro_purch_prs',JSON.stringify(["+JSON.stringify(PR())+"]));"+
  "localStorage.setItem('hydroPro_acct_vendors',JSON.stringify("+JSON.stringify(VENDORS)+"));"+
  "localStorage.setItem('hydroPro_acct_purch_history',JSON.stringify("+JSON.stringify(hist())+"));");
const PRE="const U="+JSON.stringify(USERS)+";const g0=window.getCurrentUser;const as=k=>{const u=U.find(x=>x.username===k);window.getCurrentUser=()=>u;};"+
  "const TS=[];window.showToast=m=>TS.push(String(m));const AL=[];window.alert=m=>AL.push(String(m));window.confirm=m=>true;let PR_ANS=null;const PM=[];window.prompt=m=>{PM.push(String(m));return PR_ANS;};"+
  "const J=k=>JSON.parse(localStorage.getItem(k)||'[]');const byId=(k,id)=>J(k).find(x=>x&&x.id===id)||{};const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));"+
  "const setP=(id,f)=>{const a=J('hydroPro_purch_prs');const x=a.find(y=>y.id===id);f(x);put('hydroPro_purch_prs',a);};"+
  "const val=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;return !!e;};"+
  "const view=()=>(document.getElementById('view-acct_purch_pro')||{}).innerText||'';"+
  "const names=()=>[...document.querySelectorAll('#ppSrcFit tr b[data-n]')].map(b=>b.dataset.n);"+
  "const rowOf=n=>[...document.querySelectorAll('#ppSrcFit tr')].find(t=>{const b=t.querySelector('b[data-n]');return b&&b.dataset.n===n;});"+
  "const tick=n=>{const r=rowOf(n);const b=r&&r.querySelector('.ppSrcPick');if(b)b.checked=true;return !!b;};"+
  "const isT=n=>{const r=rowOf(n);const b=r&&r.querySelector('.ppSrcPick');return !!(b&&b.checked);};"+
  "const clk=n=>{const r=rowOf(n);const b=r&&r.querySelector('.ppSrcPick');if(b)b.click();return !!b;};"+
  "const header=()=>(view().match(/Suppliers that sell this kind of item (\\(\\d+\\))/)||[])[1]||null;"+
  "const found=()=>[...document.querySelectorAll('#ppSrcFindList .ppSrcFindRow b')].map(b=>b.textContent);"+
  "const V=()=>J('hydroPro_acct_vendors');const card=n=>V().find(x=>x.name===n)||{};"+
  "const FAM='"+FAM+"',SW='"+SW+"',TX='"+TX+"',CH='"+CH+"',SY='"+SY+"',ACD='"+ACD+"',ACD2='"+ACD2+"';"+
  "const T="+T+";const PRX="+PR.toString()+";const RFQ11="+RFQ11.toString()+";const ITEMS="+JSON.stringify(ITEMS)+";"+
  "const open=async id=>{__PURPRO.openPR(id);await sleep(350);};"+
  "const logOffer=async(i,prices,vat,del)=>{__PURPRO.quoteToggle('rfq11:'+i);await sleep(150);prices.forEach((p,j)=>val('ppQl'+j,p==null?'':String(p)));val('ppQv',vat||'incl');val('ppQdc',del?String(del):'');val('ppQvu','2027-01-31');val('ppQd','3');__PURPRO.saveQuote('rfq11',i);await sleep(150);};";
const NEED="!!(window.__PURPRO&&window.__PURPRO.supKey&&window.__PURPRO.srcPick)";
const run=fn=>new Function('return (async()=>{'+PRE+'await sleep(3000);const __r=await ('+fn.toString()+')();window.getCurrentUser=g0;return __r;})()');
module.exports=[
{ name:'🛒 Hardware request PR-2026-000011 (Construction materials): the list is exactly Chribas Trading Inc. (card category Hardware), Famous, SWCC, San Yin Hardware (name), Triox (sold nails before) — 5 rows, header "(5)"; LAZADA (153 orders) and Amazon are NOT listed; no "Other known suppliers"; Select all ticks 5; every row carries SELLS · Construction materials (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    as('joshane');await open('pr11');
    const n=names(),txt=view();
    __PURPRO.srcAll(true);const ticked=[...document.querySelectorAll('#ppSrcFit .ppSrcPick:checked')].length;
    const sellsChips=[...document.querySelectorAll('#ppSrcFit tr')].filter(t=>/SELLS · Construction materials/.test(t.innerText)).length;
    return {fit:n.slice().sort(),header:header(),lazada:n.includes('LAZADA'),amazon:n.includes('Amazon'),other:/Other known suppliers/.test(txt),ticked,sellsChips,cls:__PURPRO.sourceClass('pr11').cls,errs:AL};}),
  expect:{fit:[CH,FAM,SW,SY,TX],header:'(5)',lazada:false,amazon:false,other:false,ticked:5,sellsChips:5,cls:'local',errs:[]} },

{ name:'🔍 Typing "alli" finds only Allied Botanical Corporation (sells: nothing recorded yet); ➕ Use for this request lists it ticked (6 rows) and keeps SWCC, ticked before, ticked; tags its card sells Construction materials from "picked", audit sup:tag; the ticks survive a re-render, an untick of Allied sticks (still listed); 📨 Create RFQ with Famous + Allied makes an RFQ with those 2 names (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    as('joshane');await open('pr11');const AB='Allied Botanical Corporation';
    tick(SW); /* Joshane ticked SWCC before she searched */
    __PURPRO.srcFind('pr11','alli');const f=found(),ftxt=(document.getElementById('ppSrcFindList')||{}).innerText||'';
    __PURPRO.srcPick('pr11',__PURPRO.supKey(AB));await sleep(350);
    const rows=names().length,ticked=isT(AB),swKept=isT(SW);
    const t=(card(AB).sells||[])[0]||{};
    await open('pr11');const stillTicked=isT(AB),swStill=isT(SW);
    clk(AB);await open('pr11');const untickSticks=!isT(AB),stillListed=names().includes(AB),swAfter=isT(SW);
    clk(AB);clk(SW);tick(FAM);__PURPRO.createRFQ('pr11');await sleep(350);
    const rfq=J('hydroPro_purch_rfqs').find(r=>r.prId==='pr11')||{};
    return {found:f,nothing:/sells: nothing recorded yet/.test(ftxt),rows,ticked,tagK:t.k,tagFrom:t.from,audit:(J('hydroPro_purch_audit').find(a=>a.action==='sup:tag')||{}).action,stillTicked,swKept,swStill,untickSticks,stillListed,swAfter,rfqNames:(rfq.suppliers||[]).map(s=>s.name),status:byId('hydroPro_purch_prs','pr11').status,toast:TS.some(m=>/Allied Botanical Corporation added for this request — Nexi noted it sells Construction materials/.test(m))};}),
  expect:{found:['Allied Botanical Corporation'],nothing:true,rows:6,ticked:true,tagK:'Construction materials',tagFrom:'picked',audit:'sup:tag',stillTicked:true,swKept:true,swStill:true,untickSticks:true,stillListed:true,swAfter:true,rfqNames:[FAM,'Allied Botanical Corporation'],status:'RFQ',toast:true} },

{ name:'🛒 Online item "USB-C cable 2m" (IT & office): source is ONLINE because we last bought it from LAZADA — LAZADA listed first with 🛒 ONLINE SHOP, Famous absent; override to Local only hides LAZADA; cement stays LOCAL with LAZADA hidden and the note names online shops (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    as('joshane');
    put('hydroPro_purch_prs',[PRX(),PRX({id:'pr12',number:'PR-2026-000012',title:'USB-C cable for the office laptop',klass:'IT & office',items:[{desc:'USB-C cable 2m',qty:2,unit:'pc',unitCost:0}]}),
      PRX({id:'pr13',number:'PR-2026-000013',title:'Cement for GH15 footing',klass:'Construction materials',items:[{desc:'Portland cement 40kg',qty:50,unit:'bag',unitCost:0}]})]);
    await open('pr12');const n1=names(),r1=rowOf('LAZADA');
    const cls=__PURPRO.sourceClass('pr12').cls,why=__PURPRO.sourceClass('pr12').why,chip=!!(r1&&/ONLINE SHOP/.test(r1.innerText)),banner=/🛒 ONLINE — small items we buy from Lazada, Shopee or Amazon/.test(view());
    __PURPRO.srcClass('pr12','local');await sleep(350);const afterLocal=names().includes('LAZADA');
    await open('pr13');const n3=names();
    return {cls,why:/we last bought it from LAZADA/.test(why),first:n1[0],chip,banner,famous:n1.includes(FAM),afterLocal,cementCls:__PURPRO.sourceClass('pr13').cls,cementLazada:n3.includes('LAZADA'),cementFamous:n3.includes(FAM),note:/overseas suppliers, Alibaba and online shops \(Lazada, Shopee, Amazon\) are not offered/.test(view())};}),
  expect:{cls:'online',why:true,first:'LAZADA',chip:true,banner:true,famous:false,afterLocal:false,cementCls:'local',cementLazada:false,cementFamous:true,note:true} },

{ name:'🏷 Learning: eyal awards Chribas on RFQ-2026-000011 → Chribas card sells [Construction materials, from po, ref PO-…]; logging Famous\'s offer tags Famous from "offer"; 🏭 Scorecard shows a solid "SELLS · Construction materials" on exactly those 2 rows; picking LAZADA from the search for the hardware item adds it but writes NO tag; a PO to an RFQ row named "SWCC Hardware & Construction — Elf 2.7 m³ × 5 trips" makes no supplier card of that label, "Famous Lumber & Construction Supply — Option B" learns on Famous\'s card (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    as('joshane');
    put('hydroPro_purch_prs',[PRX({status:'RFQ',rfqId:'rfq11'}),PRX({id:'pr14',number:'PR-2026-000014'})]);put('hydroPro_purch_rfqs',[RFQ11()]);
    await open('pr14');__PURPRO.srcFind('pr14','laza');__PURPRO.srcPick('pr14',__PURPRO.supKey('LAZADA'));await sleep(350);
    const lazListed=names().includes('LAZADA'),lazadaTags=(card('LAZADA').sells||[]).length;
    as('jinky');await open('pr11');await logOffer(0,[85,80,120],'incl',100);await logOffer(3,[70,68,null],'incl',0);
    const fam=(card(FAM).sells||[])[0]||{};
    setP('pr11',p=>{p.status='Approval';});as('eyal');await open('pr11');
    val('ppAwardSel',CH);PR_ANS='Famous has no stock until November';__PURPRO.award('pr11','','Approval',byId('hydroPro_purch_rfqs','rfq11').updatedAt);await sleep(250);
    const po=J('hydroPro_purch_pos').find(x=>x.prId==='pr11')||{},ch=(card(CH).sells||[]).find(t=>t.k==='Construction materials')||{};
    __PURPRO.tab('score');await sleep(300);
    const scoreRows=[...document.querySelectorAll('#view-acct_purch_pro table tbody tr')];
    const scoreSells=scoreRows.filter(t=>[...t.querySelectorAll('.pp-sells[data-guess="0"]')].some(c=>/SELLS · Construction materials/.test(c.textContent))).length;
    const nCards=V().length,junk=__PURPRO._supLearn('SWCC Hardware & Construction — Elf 2.7 m³ × 5 trips','Construction materials','po','PO-2026-000099');
    const optLearn=__PURPRO._supLearn(FAM+' — Option B','Construction materials','po','PO-2026-000098'),famAfter=(card(FAM).sells||[]).find(t=>t.k==='Construction materials')||{};
    return {awardTag:[ch.k,ch.from],awardRef:String(ch.ref||'').slice(0,2),poSup:po.supplier,offerTag:[fam.k,fam.from],offerRef:fam.ref,scoreRows:scoreRows.length,scoreSells,lazListed,lazadaTags,
      junk,cardsSame:V().length===nCards,noLabelCard:!V().some(v=>/Elf 2\.7/.test(v.name)),optLearn,famFrom:famAfter.from,alerts:AL};}),
  expect:{awardTag:['Construction materials','po'],awardRef:'PO',poSup:CH,offerTag:['Construction materials','offer'],offerRef:'RFQ-2026-000011',scoreRows:4,scoreSells:2,lazListed:true,lazadaTags:0,
    junk:false,cardsSame:true,noLabelCard:true,optLearn:true,famFrom:'po',alerts:[]} },

{ name:'🧹 A.C. Deang Marketing / AC Deang Marketing: the search shows ONE "A.C. Deang Marketing · 3 orders"; Mission Control 🧹 Duplicate suppliers (1); joshane cannot merge; a merge into a mistyped name ("Bedscap Corporaton") is refused and makes no card; eyal merges → aliases [\'AC Deang Marketing\'], e-mail ac@deang.ph copied, both cards kept (14 cards), Supplier 360° says 3 orders ₱3,500.00, audit sup:merge; the scorecard has one row for a PO under the old spelling (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    put('hydroPro_purch_pos',[{id:'po_old',number:'PO-2026-000001',prId:'prx',company:'APTI',klass:'Agri inputs (seeds, fertiliser, media)',supplier:ACD2,status:'Issued',total:500,createdAt:T,issuedAt:T,revisions:[],items:[{desc:'Complete fertilizer 25kg',qty:1,unit:'bag',unitCost:500}]}]);
    as('joshane');await open('pr11');__PURPRO.srcFind('pr11','deang');const f=found(),ftxt=(document.getElementById('ppSrcFindList')||{}).innerText||'';
    __PURPRO.tab('mission');await sleep(300);const cands=(view().match(/Duplicate suppliers \((\d+)\)/)||[])[1];
    const denied=__PURPRO.supMerge(ACD2,ACD)===false&&/Only Eyal or Dr Amy/.test(TS[TS.length-1]||'')&&!card(ACD).aliases;
    as('eyal');const typo=__PURPRO.supMerge('Bedscape Corp.','Bedscap Corporaton'),typoCards=V().length,typoKept=!card('Bedscape Corp.').mergedInto;
    const ok=__PURPRO.supMerge(ACD2,ACD);await sleep(100);
    const su=card(ACD),lo=card(ACD2);
    __PURPRO.sup360N(ACD);await sleep(200);const m=document.getElementById('ppSup360'),mt=m?m.innerText:'';if(m)m.remove();
    __PURPRO.tab('score');await sleep(300);const scoreRows=[...document.querySelectorAll('#view-acct_purch_pro table tbody tr')].filter(t=>/Deang/.test(t.innerText));
    return {typo,typoCards,typoKept,one:f.length===1&&f[0]===ACD,orders:(ftxt.match(/\d+ orders/)||[])[0],cands,denied,ok,aliases:su.aliases,email:su.email,cards:V().length,merged:lo.mergedInto===su.id,s360:(mt.match(/Purchase history — (\d+ orders)/)||[])[1],spend:(mt.match(/Total spend: (₱[\d,.]+)/)||[])[1],alsoKnown:/Also known as: AC Deang Marketing/.test(mt),audit:(J('hydroPro_purch_audit').find(a=>a.action==='sup:merge')||{}).detail,scoreRows:scoreRows.length,scoreName:/A\.C\. Deang Marketing/.test((scoreRows[0]||{}).innerText||''),toast:TS[TS.length-1]};}),
  expect:{typo:false,typoCards:14,typoKept:true,one:true,orders:'3 orders',cands:'1',denied:true,ok:true,aliases:['AC Deang Marketing'],email:'ac@deang.ph',cards:14,merged:true,s360:'3 orders',spend:'₱3,500.00',alsoKnown:true,audit:'AC Deang Marketing → A.C. Deang Marketing · 3 history rows, 1 POs, 0 RFQs now count together',scoreRows:1,scoreName:true,toast:'Merged: AC Deang Marketing → A.C. Deang Marketing (3 orders together)'} },

{ name:'✏ Admin tags: eyal saves Bedscape Corp. sells Packaging → a Packaging request lists Bedscape; removing the guessed "Electrical" from "Alyson Chemicals Inc." (it sold us an LED bulb) writes notSells and it stays off an Electrical request; a card typed as kind marketplace ("Mega Mall PH", category Hardware) is hidden for the hardware item; joshane cannot save tags (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    put('hydroPro_acct_vendors',V().concat([{id:'v15',name:'Mega Mall PH',kind:'marketplace',category:'Hardware'}]));
    put('hydroPro_acct_purch_history',J('hydroPro_acct_purch_history').concat([{id:'hx1',date:'2026-09-01',product:'LED bulb 9W',supplier:'Alyson Chemicals Inc.',qty:4,unitCost:120}]));
    put('hydroPro_purch_prs',[PRX(),PRX({id:'pr15',number:'PR-2026-000015',title:'Boxes for harvest',klass:'Packaging',items:[{desc:'Carton box 20x20x15',qty:200,unit:'pc',unitCost:0}]}),
      PRX({id:'pr16',number:'PR-2026-000016',title:'Wire for GH15 panel',klass:'Electrical',items:[{desc:'THHN wire 3.5mm',qty:100,unit:'m',unitCost:0}]})]);
    as('joshane');const jo=__PURPRO.supSellsSave('Bedscape Corp.',['Packaging'],''),joCard=!card('Bedscape Corp.').sells;
    as('eyal');const guess=__PURPRO.supSells('Alyson Chemicals Inc.').tags.map(t=>t.k+(t.guess?'?':''));
    const bed=__PURPRO.supSellsSave('Bedscape Corp.',['Packaging'],'');const bt=(card('Bedscape Corp.').sells||[])[0]||{};
    await open('pr15');const bedListed=names().includes('Bedscape Corp.');
    __PURPRO.supSellsSave('Alyson Chemicals Inc.',['Agri inputs (seeds, fertiliser, media)'],'');const al=card('Alyson Chemicals Inc.');
    await open('pr16');const alysonOff=!names().includes('Alyson Chemicals Inc.');
    await open('pr11');const megaHidden=!names().includes('Mega Mall PH'),chribas=names().includes(CH);
    __PURPRO.sup360N('Bedscape Corp.');await sleep(200);const m=document.getElementById('ppSup360'),mt=m?m.innerText:'';if(m)m.remove();
    return {jo,joCard,guess:guess.slice().sort(),bed,bedTag:[bt.k,bt.from],bedListed,notSells:al.notSells,alSells:(al.sells||[]).map(t=>t.k),alysonOff,megaHidden,chribas,s360:/What this supplier sells/.test(mt)&&/SELLS · Packaging/.test(mt)&&/✏ Edit/.test(mt),audit:J('hydroPro_purch_audit').filter(a=>a.action==='sup:sells').length};}),
  expect:{jo:false,joCard:true,guess:['Agri inputs (seeds, fertiliser, media)?','Electrical?'],bed:true,bedTag:['Packaging','admin'],bedListed:true,notSells:['Electrical'],alSells:['Agri inputs (seeds, fertiliser, media)'],alysonOff:true,megaHidden:true,chribas:true,s360:true,audit:2} },

{ name:'↩ Nothing already selected changes: PR-2026-000011 sent back to Supplier Sourcing with RFQ-2026-000011 open (Famous, SWCC, Triox, Chribas) shows "is still open · 4 suppliers"; ticking San Yin → ➕ Add → 5 suppliers, same number, one RFQ (v22.84)',
  requires:NEED,seed:SEED,
  run:run(async()=>{
    put('hydroPro_purch_prs',[PRX({rfqId:'rfq11'})]);put('hydroPro_purch_rfqs',[RFQ11()]);
    as('joshane');await open('pr11');const t=view();
    const still=/RFQ-2026-000011 is still open/.test(t)&&/4 suppliers/.test(t),btn=/Add the selected to RFQ-2026-000011/.test(t),listed=names().slice().sort();
    const ok=tick(SY);__PURPRO.createRFQ('pr11');await sleep(350);
    const rf=J('hydroPro_purch_rfqs').filter(r=>r.prId==='pr11');
    return {still,btn,listed,ok,n:rf[0].suppliers.length,number:rf[0].number,rfqs:rf.length,late:!!(rf[0].suppliers.find(s=>s.name===SY)||{}).addedLate,status:byId('hydroPro_purch_prs','pr11').status};}),
  expect:{still:true,btn:true,listed:[CH,FAM,SW,SY,TX],ok:true,n:5,number:'RFQ-2026-000011',rfqs:1,late:true,status:'RFQ'} }
];
