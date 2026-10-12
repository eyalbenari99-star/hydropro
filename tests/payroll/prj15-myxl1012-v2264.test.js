/* v22.64: Project 15 — the Myxl shipment MX1012 of 12 Oct 2026 (Eyal: "add item code so after easy to add to Nexi").
   348 supplier lines (322 "Delivered Material List" = shipped, 26 "Undelivered Goods" = not shipped) with permanent codes
   MX1012-D001…D322 / MX1012-U001…U026, in Eyal's four groups. The seed must equal the Excel the owner received (the fixture
   is that file's rows, byte for byte). A line enters the item register ONLY when it is received into a store. */
const FIX=require('./fixtures/mx1012_rows.json');
const PROJ=FIX.map(r=>[r.code,r.list,r.no,r.sec,r.name,r.spec,r.len,r.wid,r.qty,r.unit,r.grp,r.conf,r.ml,r.flag]);
const REQ="!!(window.PRJ&&PRJ.ship&&window.HNX_SHIP_MX1012)";
/* in-page prelude shared by every case */
const H=`
  await sleep(3000);
  window.confirm=()=>true; window.alert=()=>{}; window.open=()=>null;
  const SH=PRJ.ship;
  const KEYS=()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^hydroPro_prj(1[56]_|_)/.test(k))o[k]=localStorage.getItem(k);}return o;};
  const snapEq=(a,b)=>{const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();if(JSON.stringify(ka)!==JSON.stringify(kb))return false;return ka.every(k=>a[k]===b[k]);};
  const settle=async()=>{PRJ.pick('15');PRJ.tab('15','over');await sleep(150);PRJ.tab('15','over');await sleep(50);};
  const REALGCU=window.getCurrentUser;
  const asUser=u=>{window.getCurrentUser=()=>u;};
  const asMe=()=>{window.getCurrentUser=REALGCU;};
  const JOMEL={username:'jomel',fullname:'Jomel IT',role:'staff',active:true};
  const GUARD={username:'guard',fullname:'Guard',role:'staff',active:true};
  const reg=()=>JSON.parse(localStorage.getItem('hydroPro_prj15_items_v1')||'[]');
  const mvs=()=>JSON.parse(localStorage.getItem('hydroPro_prj15_movs_v1')||'[]');
  const row=code=>SH.rows('15').find(r=>r.code===code);
  const body=()=>document.getElementById('body-prj_1516');
  const tabOpts=()=>{const s=[...body().querySelectorAll('select')].find(x=>/PRJ\\.tab\\(/.test(x.getAttribute('onchange')||''));return s?[...s.options].map(o=>o.value):[];};
  const stubX=()=>{const cap={};window.XLSX={utils:{book_new:()=>({S:[]}),aoa_to_sheet:r=>r,book_append_sheet:(wb,ws,n)=>wb.S.push({name:n,rows:ws})},writeFile:(wb,name)=>{cap.name=name;cap.S=wb.S;}};return cap;};
  const mkReq=(code,qty,gh)=>{
    PRJ.newReq('15');const rq=PRJ.reqs('15');const id=rq[rq.length-1].id;
    const op=window.prompt;window.prompt=()=>code;PRJ.addLine('15',id);window.prompt=op;
    const n=(PRJ.reqOf('15',id).lines||[]).length;
    if(n)PRJ.setLine('15',id,n-1,'qtyReq',String(qty));
    PRJ.setReq('15',id,'by','Tester');PRJ.setReq('15',id,'reqDate',today);PRJ.setReq('15',id,'purpose','test');PRJ.setReq('15',id,'gh',gh||'GH16');
    PRJ.setReq('15',id,'approved.name','Tester');PRJ.setReq('15',id,'released.name','Jomel — IT');
    return {id,lines:n};
  };
  const go=(id,st)=>{PRJ.status('15',id,st);return PRJ.reqOf('15',id).status;};
`;
const run=body=>new Function('return (async()=>{'+H+body+'})()');
module.exports=[
{ name:'🚢 MX1012 seed = the owner\'s Excel: 348 unique codes (D 322 / U 26), every code MX1012-<list><no 3 digits>; groups G1 134 · G2 53 · G3 107 · G4 54 · G0 0; D/U G1 121/13 · G2 53/0 · G3 106/1 · G4 42/12; ML-linked 147 (G1 87 · G2 46 · G3 3 · G4 11), 9 on two ML lines; flagged 26 (G1 20 · G2 2 · G4 4); to confirm 33 (G1 26 · G2 3 · G4 4); G1 shipped Pcs 23,440 + M 11,617; D007 = Inner support beam 3 32*2 1.81 m 78 Pcs ML 34; U017 = Tank 49³ 3 Set G4 medium; D128 = 1 M ML 233 flagged (v22.64)',
  requires:REQ,
  run:run(`
    const R=SH.rows('15');
    const by=f=>{const o={};['G1','G2','G3','G4','G0'].forEach(g=>o[g]=R.filter(r=>r.seedGrp===g&&f(r)).length);return o;};
    const du={};['G1','G2','G3','G4'].forEach(g=>du[g]=[R.filter(r=>r.seedGrp===g&&r.list==='D').length,R.filter(r=>r.seedGrp===g&&r.list==='U').length]);
    const sum=(f)=>R.filter(f).reduce((a,r)=>a+r.qty,0);
    const d7=row('MX1012-D007'),u17=row('MX1012-U017'),d128=row('MX1012-D128'),d1=row('MX1012-D001');
    return {proj:R.map(r=>[r.code,r.list,r.no,r.sec,r.name,r.spec,r.len,r.wid,r.qty,r.unit,r.seedGrp,r.conf,r.ml,r.flag]),
      unique:new Set(R.map(r=>r.code)).size,codeOk:R.every(r=>r.code==='MX1012-'+r.list+String(r.no).padStart(3,'0')&&SH.code(r.ct,r.no)===r.code),
      D:R.filter(r=>r.list==='D').length,U:R.filter(r=>r.list==='U').length,groups:by(()=>true),du,
      ml:R.filter(r=>r.ml.length).length,mlBy:by(r=>r.ml.length>0),twoMl:R.filter(r=>r.ml.length>1).length,
      flagged:R.filter(r=>r.flag).length,flagBy:by(r=>!!r.flag),tc:R.filter(r=>r.toConfirm).length,tcBy:by(r=>r.toConfirm),
      g1:[sum(r=>r.seedGrp==='G1'&&r.list==='D'&&r.unit==='Pcs'),sum(r=>r.seedGrp==='G1'&&r.list==='D'&&r.unit==='M')],
      d7:[d7.name,d7.spec,d7.len,d7.qty,d7.unit,d7.grp,d7.ml],u17:[u17.name,u17.qty,u17.unit,u17.grp,u17.conf],d128:[d128.qty,d128.unit,d128.ml,!!d128.flag],
      d1why:d1.why,d1mlt:d1.mlt,key:SH.key('mx1012-d007'),inReg:R.filter(r=>r.inReg).length,rcv:R.filter(r=>r.rcv).length};
  `),
  expect:{proj:PROJ,unique:348,codeOk:true,D:322,U:26,groups:{G1:134,G2:53,G3:107,G4:54,G0:0},du:{G1:[121,13],G2:[53,0],G3:[106,1],G4:[42,12]},
    ml:147,mlBy:{G1:87,G2:46,G3:3,G4:11,G0:0},twoMl:9,flagged:26,flagBy:{G1:20,G2:2,G3:0,G4:4,G0:0},tc:33,tcBy:{G1:26,G2:3,G3:0,G4:4,G0:0},
    g1:[23440,11617],d7:['Inner support beam 3','32*2','1.81',78,'Pcs','G1',[34]],u17:['Tank 49³',3,'Set','G4','medium'],d128:[1,'M',[233],true],
    d1why:'Greenhouse main-frame rebar under the greenhouse structure heading.',d1mlt:'ML 1 · Greenhouse Main Structure - Pipe & Steel · name, spec and length',
    key:{ct:'MX1012-D',no:7},inReg:0,rcv:0} },

{ name:'👀 Opening writes nothing: after the Overview has settled, the Shipment, Item List, Material List and Central screens and the Excel leave every Project 15/16 key (hydroPro_prj15_* / prj16_* / prj_*) byte-identical; register stays 348 rows, Project 16 0; P15 screens include "ship", P16 not (pointer card instead); 348 [data-ship-code] rows; 4 group cards 134 / 53 / 107 / 54, no G0 card (v22.64)',
  requires:REQ,
  run:run(`
    await settle();await sleep(400);await settle();
    const before=KEYS();
    PRJ.tab('15','ship');
    const n=body().querySelectorAll('[data-ship-code]').length;
    const cards=[...body().querySelectorAll('[data-ship-group]')].map(e=>e.getAttribute('data-ship-group')+':'+e.getAttribute('data-lines'));
    const o15=tabOpts();
    PRJ.tab('15','items');PRJ.tab('15','ml');PRJ.pick('B');PRJ.pick('16');PRJ.tab('16','over');
    const o16=tabOpts(),ptr=!!body().querySelector('[data-ship-pointer]');
    PRJ.pick('15');PRJ.tab('15','ship');
    const cap=stubX();hnxShipExport('15');
    await sleep(300);
    const after=KEYS();
    const diff=Object.keys(Object.assign({},before,after)).filter(k=>before[k]!==after[k]);
    return {same:snapEq(before,after),diff,reg:reg().length,p16:PRJ.items('16').length,ship15:o15.includes('ship'),afterMl:o15[o15.indexOf('ml')+1],ship16:o16.includes('ship'),ptr,n,cards,sheets:(cap.S||[]).length};
  `),
  expect:{same:true,diff:[],reg:348,p16:0,ship15:true,afterMl:'ship',ship16:false,ptr:true,n:348,cards:['G1:134','G2:53','G3:107','G4:54'],sheets:8} },

{ name:'📥 Receive MX1012-D007 × 78 into Container 1: 1 receipt (src "MX1012 …", code MX1012-D007); register 348 → 349 with ct MX1012-D no 7 qty 78 recv 78 bal0 0 adj 78, balance 78; the 348 old rows JSON-identical; Container 1 holds 78; Material List rows unchanged; status Received, 1 received; the Material List shows MX1012-D007 (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const reg0=reg(),ml0=JSON.stringify(PRJ.mlRows('15'));
    const r=SH.receive('15',[{code:'MX1012-D007',qty:78}],'Container 1','DR 1234',today);
    const rc=mvs().filter(m=>m.kind==='receipt'&&m.code==='MX1012-D007');
    const reg1=reg(),it=reg1.find(x=>x.ct==='MX1012-D'&&x.no===7);
    const old=JSON.stringify(reg1.filter(x=>!/^MX/.test(x.ct)))===JSON.stringify(reg0);
    const s=row('MX1012-D007');
    PRJ.tab('15','ml');const mlTxt=body().textContent.includes('MX1012-D007');
    return {ok:r.ok,n:rc.length,src:/^MX1012 RCV-/.test(rc[0]&&rc[0].src),code:rc[0]&&rc[0].code,to:rc[0]&&rc[0].to,from:rc[0]&&rc[0].from,
      len:[reg0.length,reg1.length],it:it&&[it.ct,it.no,it.qty,it.recv,it.bal0,it.adj,it.unit],bal:PRJ.bal('15',PRJ.itemOf('15','MX1012-D',7)),old,
      onHand:PRJLOC.onHand('15','Container 1','MX1012-D',7),mlSame:JSON.stringify(PRJ.mlRows('15'))===ml0,status:s.status,sk:s.sk,
      summary:SH.summary('15').received,inReg:s.inReg,home:SH.home('15','MX1012-D',7),check:SH.check('15'),mlTxt};
  `),
  expect:{ok:true,n:1,src:true,code:'MX1012-D007',to:'Container 1',from:'Supplier (not yet sent)',len:[348,349],it:['MX1012-D',7,78,78,0,78,'Pcs'],bal:78,old:true,
    onHand:78,mlSame:true,status:'✅ Received',sk:'rcv',summary:1,inReg:true,home:'Container 1',check:[],mlTxt:true} },

{ name:'📦 Fill all arriving G2 → 50 lines (D136, D159, D322 to confirm are left out) = 208 M + 2 Set + 933 Pcs; receiving them into Warehouse C is exactly 1 ledger write + 1 register write, register 398; G2 again → 0; G4 → 39 lines, no U line; G3 → 106 lines with 106 distinct receipt ids that survive a cloud merge without them; Warehouse C holds 1 of D190 (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const f2=SH.fillGroup('15','G2'),c2=f2.map(p=>p.code);
    const units={M:0,Set:0,Pcs:0};f2.forEach(p=>{const r=row(p.code);units[r.unit]+=p.qty;});
    /* the app installs its own localStorage.setItem over the browser's — every save goes through it */
    const SI=localStorage.setItem;let wm=0,wr=0;
    localStorage.setItem=function(k){if(k==='hydroPro_prj15_movs_v1')wm++;if(k==='hydroPro_prj15_items_v1')wr++;return SI.apply(this,arguments);};
    let r2;try{r2=SH.receive('15',f2,'Warehouse C','DR 5',today);}finally{localStorage.setItem=SI;}
    const regN=reg().length,again=SH.fillGroup('15','G2').length;
    const f4=SH.fillGroup('15','G4');
    const f3=SH.fillGroup('15','G3');
    const r3=SH.receive('15',f3,'Warehouse C','',today);
    const local=localStorage.getItem('hydroPro_prj15_movs_v1');
    const cloud=JSON.stringify(JSON.parse(local).filter(m=>!r3.ids.includes(m.id)));
    const merged=JSON.parse(window.__hnxMergeGeneric('hydroPro_prj15_movs_v1',local,cloud));
    return {n2:f2.length,excl:['MX1012-D136','MX1012-D159','MX1012-D322'].filter(c=>c2.includes(c)),units,ok2:r2.ok,writes:[wm,wr],regN,again,
      n4:f4.length,u4:f4.filter(p=>/-U/.test(p.code)).length,n3:f3.length,ok3:r3.ok,ids:new Set(r3.ids).size,
      kept:r3.ids.filter(id=>merged.some(m=>m.id===id)).length,d190:PRJLOC.onHand('15','Warehouse C','MX1012-D',190),reg3:reg().length,check:SH.check('15').length};
  `),
  expect:{n2:50,excl:[],units:{M:208,Set:2,Pcs:933},ok2:true,writes:[1,1],regN:398,again:0,n4:39,u4:0,n3:106,ok3:true,ids:106,kept:106,d190:1,reg3:504,check:0} },

{ name:'⏳ Not-shipped and to-confirm lines: U001 × 48 with the confirm answered No → refused, nothing written; answered Yes → Received, register row MX1012-U no 1, code stays MX1012-U001; D168 (65 roof fans, to confirm) asks exactly 1 confirm (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const b0=KEYS();
    window.confirm=()=>false;
    const a=SH.receive('15',[{code:'MX1012-U001',qty:48}],'Container 1','',today);
    const same=snapEq(b0,KEYS());
    window.confirm=()=>true;
    const b=SH.receive('15',[{code:'MX1012-U001',qty:48}],'Container 1','',today);
    const u=row('MX1012-U001'),rr=reg().find(x=>x.ct==='MX1012-U'&&x.no===1);
    let nc=0;window.confirm=()=>{nc++;return true;};
    const c=SH.receive('15',[{code:'MX1012-D168',qty:65}],'Container 1','',today);
    return {a:a.ok,same,b:b.ok,st:u.status,rr:rr&&[rr.ct,rr.no,rr.adj],code:rr&&SH.code(rr.ct,rr.no),c:c.ok,nc};
  `),
  expect:{a:false,same:true,b:true,st:'✅ Received',rr:['MX1012-U',1,48],code:'MX1012-U001',c:true,nc:1} },

{ name:'🟠 Part, over, undo: D001 500 of 1,200 → Part, 700 to come; Jomel (warehouse, not admin) +800 → refused; admin +800 with confirm → Over-received 1,300; admin undo of the 800 → Part 500; Jomel undo → refused; after 200 go out on an item request (balance 300, Container 1 holds 300), undoing the 500 → refused (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const r1=SH.receive('15',[{code:'MX1012-D001',qty:500}],'Container 1','',today);
    const s1=row('MX1012-D001');
    asUser(JOMEL);const r2=SH.receive('15',[{code:'MX1012-D001',qty:800}],'Container 1','',today);asMe();
    const r3=SH.receive('15',[{code:'MX1012-D001',qty:800}],'Container 1','',today);
    const s3=row('MX1012-D001');
    const r4=SH.undo('15',r3.ids[0],'typed twice');
    const s4=row('MX1012-D001');
    asUser(JOMEL);const r5=SH.undo('15',r1.ids[0],'x');asMe();
    const q=mkReq('MX1012-D001',200);
    const st=[go(q.id,'SUBMITTED'),go(q.id,'APPROVED'),go(q.id,'RELEASED')];
    const r6=SH.undo('15',r1.ids[0],'wrong');
    const it=PRJ.itemOf('15','MX1012-D',1);
    return {r1:r1.ok,s1:[s1.sk,s1.rcv,s1.rem],r2:r2.ok,r3:r3.ok,s3:[s3.sk,s3.rcv],r4:r4.ok,s4:[s4.sk,s4.rcv],r5:r5.ok,lines:q.lines,st,r6:r6.ok,
      bal:PRJ.bal('15',it),adj:it.adj,onHand:PRJLOC.onHand('15','Container 1','MX1012-D',1),undos:mvs().filter(m=>m.kind==='unreceipt').length};
  `),
  expect:{r1:true,s1:['part',500,700],r2:false,r3:true,s3:['over',1300],r4:true,s4:['part',500],r5:false,lines:1,st:['SUBMITTED','APPROVED','RELEASED'],r6:false,
    bal:300,adj:500,onHand:300,undos:1} },

{ name:'🛑 Every refusal writes nothing (all Project 15/16 keys unchanged): cloud token before the first download, an old copy of Nexi, into GH15, into the supplier, register unreadable, ledger unreadable, qty 0 / −5 / "abc", tomorrow\'s date, signed in as the guard (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const out={},pick=[{code:'MX1012-D007',qty:1}];
    /* a direct localStorage write is only seen by the app after its one-tick read cache drops — hence the sleeps */
    const t=async(name,fn)=>{await sleep(5);const b=KEYS();let r;try{r=fn();}catch(e){r={threw:String(e)};}out[name]=[!!(r&&r.ok),snapEq(b,KEYS())];};
    const pOk=window.__hnxPulledOk;
    await t('token',()=>{localStorage.setItem('hnx_cloud_token','test-token');window.__hnxPulledOk=false;
      try{return SH.receive('15',pick,'Container 1','',today);}finally{localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=pOk;}});
    window.__hnxStaleApp='99.9';await t('stale',()=>SH.receive('15',pick,'Container 1','',today));delete window.__hnxStaleApp;
    await t('gh15',()=>SH.receive('15',pick,'GH15','',today));
    await t('supplier',()=>SH.receive('15',pick,'Supplier (not yet sent)','',today));
    const rg=localStorage.getItem('hydroPro_prj15_items_v1');
    localStorage.setItem('hydroPro_prj15_items_v1','{bad');await t('register',()=>SH.receive('15',pick,'Container 1','',today));localStorage.setItem('hydroPro_prj15_items_v1',rg);
    const mv=localStorage.getItem('hydroPro_prj15_movs_v1');
    localStorage.setItem('hydroPro_prj15_movs_v1','{bad');await t('ledger',()=>SH.receive('15',pick,'Container 1','',today));localStorage.setItem('hydroPro_prj15_movs_v1',mv);
    await t('zero',()=>SH.receive('15',[{code:'MX1012-D007',qty:0}],'Container 1','',today));
    await t('neg',()=>SH.receive('15',[{code:'MX1012-D007',qty:-5}],'Container 1','',today));
    await t('abc',()=>SH.receive('15',[{code:'MX1012-D007',qty:'abc'}],'Container 1','',today));
    const tm=new Date();tm.setDate(tm.getDate()+1);
    await t('tomorrow',()=>SH.receive('15',pick,'Container 1','',ymd(tm)));
    asUser(GUARD);await t('guard',()=>SH.receive('15',pick,'Container 1','',today));asMe();
    await sleep(5);const ok=SH.receive('15',pick,'Container 1','',today);
    return Object.assign(out,{finally:ok.ok});
  `),
  expect:{token:[false,true],stale:[false,true],gh15:[false,true],supplier:[false,true],register:[false,true],ledger:[false,true],zero:[false,true],neg:[false,true],abc:[false,true],tomorrow:[false,true],guard:[false,true],finally:true} },

{ name:'🧾 Release path: D007 78 received into Container 1; a request line typed as MX1012-D007 picks ct MX1012-D no 7; 30 SUBMITTED → APPROVED → RELEASED goes out of Container 1, balance 48, Container 1 holds 48; a second request of 50 cannot be APPROVED; releases show no audit row for MX lines and +30 units; MX1012-U026 (not received) adds no line (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const L0=PRJ.releaseLines('15','','');const u0=L0.reduce((a,x)=>a+x.qtyApp,0);
    SH.receive('15',[{code:'MX1012-D007',qty:78}],'Container 1','',today);
    const q=mkReq('MX1012-D007',30,'GH15');const l=PRJ.reqOf('15',q.id).lines[0];
    const st=[go(q.id,'SUBMITTED'),go(q.id,'APPROVED'),go(q.id,'RELEASED')];
    const iss=mvs().filter(m=>m.kind==='issue'&&m.ct==='MX1012-D'&&m.no===7);
    const it=PRJ.itemOf('15','MX1012-D',7);
    const q2=mkReq('MX1012-D007',50,'GH16');const st2=[go(q2.id,'SUBMITTED'),go(q2.id,'APPROVED')];
    const L1=PRJ.releaseLines('15','','');
    const q3=mkReq('MX1012-U026',5,'GH16');
    return {pick:[l.ct,l.no],st,from:iss.map(m=>m.from),bal:PRJ.bal('15',it),onHand:PRJLOC.onHand('15','Container 1','MX1012-D',7),st2,
      audit:L1.filter(x=>x.status==='FROM AUDIT'&&/^MX/.test(x.ct)).length,units:L1.reduce((a,x)=>a+x.qtyApp,0)-u0,u026:q3.lines};
  `),
  expect:{pick:['MX1012-D',7],st:['SUBMITTED','APPROVED','RELEASED'],from:['Container 1'],bal:48,onHand:48,st2:['SUBMITTED','SUBMITTED'],audit:0,units:30,u026:0} },

{ name:'🔁 Merges and repair: group moves merge per id and field (newer G3 beats older G4 whichever side holds it; D168 here + U017 there → both kept); a register that lost its MX rows shows check = [MX1012-D007] and Put them back rebuilds it with adj 78, every other row identical; a destination set on D007 keeps qty 78 / recv 78 / adj 78 (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const t0=Date.now(),iso=x=>new Date(x).toISOString();
    const L={id:'MX1012-U017',code:'MX1012-U017',grp:'G3',prev:'G4',by:'eyal',updatedAt:iso(t0),_fts:{grp:t0}};
    const R={id:'MX1012-U017',code:'MX1012-U017',grp:'G4',prev:'G3',by:'amy',updatedAt:iso(t0-60000),_fts:{grp:t0-60000}};
    const D={id:'MX1012-D168',code:'MX1012-D168',grp:'G1',prev:'G4',by:'eyal',updatedAt:iso(t0),_fts:{grp:t0}};
    const M=(a,b)=>JSON.parse(window.__hnxMergeGeneric('hydroPro_prj15_ship_v1',JSON.stringify(a),JSON.stringify(b)));
    const m1=M([L],[R]),m2=M([R],[L]),m3=M([D],[R]);
    localStorage.setItem('hydroPro_prj15_ship_v1',JSON.stringify(m3));await sleep(5);
    const g=[SH.groupOf('15','MX1012-U017'),SH.groupOf('15','MX1012-D168')];
    localStorage.removeItem('hydroPro_prj15_ship_v1');await sleep(5);
    SH.receive('15',[{code:'MX1012-D007',qty:78}],'Container 1','',today);
    const full=reg(),nonMx=JSON.stringify(full.filter(x=>!/^MX/.test(x.ct)));
    localStorage.setItem('hydroPro_prj15_items_v1',JSON.stringify(full.filter(x=>!/^MX/.test(x.ct))));await sleep(5);
    const chk=SH.check('15');
    PRJ.tab('15','ship');const banner=!!body().querySelector('[data-ship-check]');
    const rp=SH.repair('15');
    const back=reg().find(x=>x.ct==='MX1012-D'&&x.no===7);
    const same=JSON.stringify(reg().filter(x=>!/^MX/.test(x.ct)))===nonMx;
    PRJ.setDest('15','MX1012-D',7,'GH15');
    const d=reg().find(x=>x.ct==='MX1012-D'&&x.no===7);
    return {m1:m1.map(x=>x.grp),m2:m2.map(x=>x.grp),m3:m3.map(x=>x.id).sort(),g,chk,banner,rp:rp.ok,back:back&&back.adj,same,after:SH.check('15'),
      dest:d&&[d.dest,d.qty,d.recv,d.adj]};
  `),
  expect:{m1:['G3'],m2:['G3'],m3:['MX1012-D168','MX1012-U017'],g:['G4','G1'],chk:['MX1012-D007'],banner:true,rp:true,back:78,same:true,after:[],dest:['GH15',78,78,78]} },

{ name:'🔀 Group moves: admin moves U017 G4 → G3 → G3 108 · G4 53, marked moved from G4; moved back → not moved, G4 54; ticked D001–D003 → G0 → a G0 card with 3 lines, To confirm 36; Jomel cannot move a line (edit store unchanged) (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const a=SH.setGroup('15',['MX1012-U017'],'G3');const s1=SH.summary('15'),u1=row('MX1012-U017');
    const b=SH.setGroup('15',['MX1012-U017'],'G4');const s2=SH.summary('15'),u2=row('MX1012-U017');
    PRJ.tab('15','ship');
    ['MX1012-D001','MX1012-D002','MX1012-D003'].forEach(c=>hnxShipTick(c,true));
    hnxShipMoveTicked('15','G0');
    const g0=body().querySelector('[data-ship-group="G0"]');
    const s3=SH.summary('15');
    const ed=localStorage.getItem('hydroPro_prj15_ship_v1');
    asUser(JOMEL);const c=SH.setGroup('15',['MX1012-D010'],'G2');asMe();
    return {a:a.ok,g3:s1.groups.G3.lines,g4:s1.groups.G4.lines,u1:[u1.grp,u1.moved,u1.seedGrp],b:b.ok,u2:[u2.grp,u2.moved],g4b:s2.groups.G4.lines,
      g0:g0&&g0.getAttribute('data-lines'),tc:s3.toConfirm,c:c.ok,same:localStorage.getItem('hydroPro_prj15_ship_v1')===ed,
      recs:JSON.parse(ed).length};
  `),
  expect:{a:true,g3:108,g4:53,u1:['G3',true,'G4'],b:true,u2:['G4',false],g4b:54,g0:'3',tc:36,c:false,same:true,recs:4} },

{ name:'⬇ Excel: Summary · All items (grouped) · G1 Greenhouse PRJ15+16 · G2 Irrigation room · G3 Tank & facilities bldg · G4 Equipment & machines · To confirm · Receipts with 348 / 134 / 53 / 107 / 54 / 33 / 0 rows; the owner\'s 16 columns first; Summary G1 121/13/134 · 23,440/652 Pcs · 11,617 M … Total 322/26/348 · 34,350/1,166 Pcs · 22 Set · 11,826 M; row 1 = D001 G1 Delivered 1,200 M; after U017 → G3 the G3 sheet has 108 rows and shows G4 as the supplier-file group; Items and Central exports end with Item code, Group (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    let cap=stubX();hnxShipExport('15');
    const S=cap.S||[],names=S.map(s=>s.name),n=S.map(s=>s.rows.length-1);
    const sum=S[0].rows.slice(1).map(r=>[r[0]].concat(r.slice(2,9)));
    const extra=S[0].rows.slice(1).map(r=>r.slice(9));
    const r1=S[1].rows[1];
    const head=S[1].rows[0].slice(0,16);
    const fname=/^Prj15-shipment-MX1012-\\d{4}-\\d{2}-\\d{2}\\.xlsx$/.test(cap.name);
    SH.setGroup('15',['MX1012-U017'],'G3');
    cap=stubX();hnxShipExport('15');
    const g3=cap.S.find(s=>s.name==='G3 Tank & facilities bldg');
    const hi=g3.rows[0].indexOf('Group in supplier file (when changed)');
    const u=g3.rows.find(r=>r[2]==='MX1012-U017');
    cap=stubX();hnxPrjExportItems('15');const it=cap.S[0].rows[0].slice(-2);
    cap=stubX();hnxPrjExportCentral();const ce=cap.S[0].rows[0].slice(-2);
    return {names,n,head,sum,extra,r1:[r1[0],r1[2],r1[3],r1[8],r1[10],r1[11]],fname,g3:g3.rows.length-1,u:u&&[u[0],u[hi]],it,ce};
  `),
  expect:{names:['Summary','All items (grouped)','G1 Greenhouse PRJ15+16','G2 Irrigation room','G3 Tank & facilities bldg','G4 Equipment & machines','To confirm','Receipts'],
    n:[6,348,134,53,107,54,33,0],
    head:['Group','Group name','Item code','Status','Supplier list No.','Supplier section','Item','Spec','Length (m)','Width (m)','Qty','Unit','In Nexi material list (PRJ15/16)','Check','Confidence','Why this group'],
    sum:[['G1',121,13,134,23440,652,0,11617],['G2',53,0,53,943,0,2,208],['G3',106,1,107,9755,420,0,0],['G4',42,12,54,212,94,20,1],['G0',0,0,0,0,0,0,0],['Total',322,26,348,34350,1166,22,11826]],
    extra:[[0,0,134,0],[0,0,53,0],[0,0,107,0],[0,0,54,0],[0,0,0,0],[0,0,348,0]],
    r1:['G1','MX1012-D001','Delivered','',1200,'M'],fname:true,g3:108,u:['G3','G4'],it:['Item code','Group'],ce:['Item code','Group']} },

{ name:'🚫 Exclusions: with D001–D014 received, drawingsFor(MX1012-D 5) = [], drawing proposals on every sheet, the request recon and the SOS rows are exactly as before; after G3 (106 lines) is received the Gutter & Post screen shows no G3 line; Item List filter MX1012-D007 → 1 row; the movement form offers every register row (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const pages=PRJ.pages().map(p=>p.page);
    const P0=JSON.stringify(pages.map(n=>PRJ.proposals('15',n))),R0=JSON.stringify(PRJ.recon('15','','').rows),S0=PRJ.sosRows('15').rows.length;
    const picks=[];for(let i=1;i<=14;i++){const c='MX1012-D'+String(i).padStart(3,'0');picks.push({code:c,qty:row(c).qty});}
    const r=SH.receive('15',picks,'Container 1','',today);
    const dw=PRJ.drawingsFor('15','MX1012-D',5);
    const P1=JSON.stringify(pages.map(n=>PRJ.proposals('15',n))),R1=JSON.stringify(PRJ.recon('15','','').rows),S1=PRJ.sosRows('15').rows.length;
    const f3=SH.fillGroup('15','G3');const r3=SH.receive('15',f3,'Warehouse C','',today);
    PRJ.tab('15','inst');const html=body().innerHTML;
    const g3=SH.rows('15').filter(x=>x.grp==='G3'&&x.list==='D').map(x=>x.no);
    const leak=g3.filter(no=>html.includes('<td>MX1012-D</td><td>'+no+'</td>')).length;
    PRJ.tab('15','items');PRJ.filt('15','MX1012-D007');const n7=body().querySelectorAll('table.prj-tbl tbody tr').length;PRJ.filt('15','');
    PRJ.tab('15','locs');const opts=document.querySelectorAll('#prjMvItem option').length;
    return {r:r.ok,dw,props:P1===P0,recon:R1===R0,sos:[S0===S1,S1],r3:r3.ok,n3:f3.length,leak,n7,opts:opts===PRJ.items('15').length,optsN:opts};
  `),
  expect:{r:true,dw:[],props:true,recon:true,sos:[true,348],r3:true,n3:106,leak:0,n7:1,opts:true,optsN:468} },

{ name:'🧰 Existing code fixed: two movements of 1 recorded back to back get 2 different ids; a destination saved on Container 1 #5 keeps #248\'s seedRev 4 and the next items() writes nothing; the ledger memo returns the same rows (and rebuilds after a tick); the Shipment, Item List and Stock screens render in under 5 s after every shipped line that can be filled (292 receipts: G1 97 · G2 50 · G3 106 · G4 39) is received — measured ≈0.4 s (v22.64)',
  requires:REQ,
  run:run(`
    await settle();
    const n0=mvs().length;
    PRJ.move('15','Container 1',5,'Supplier (not yet sent)','Container 1',1,'t1');
    PRJ.move('15','Container 1',5,'Supplier (not yet sent)','Container 1',1,'t2');
    const moves=mvs().length-n0,last=mvs().slice(-2).map(m=>m.id);
    PRJ.setDest('15','Container 1',5,'GH15');
    const r248=reg().find(x=>x.ct==='Container 1'&&x.no===248);
    const SI=localStorage.setItem;let w=0;
    localStorage.setItem=function(k){if(k==='hydroPro_prj15_items_v1')w++;return SI.apply(this,arguments);};
    try{await sleep(5);PRJ.items('15');PRJ.items('15');}finally{localStorage.setItem=SI;}
    const a1=PRJLOC.nmovs('15'),a2=PRJLOC.nmovs('15');await sleep(20);const a3=PRJLOC.nmovs('15');
    let nR=0;['G1','G2','G3','G4'].forEach(g=>{const f=SH.fillGroup('15',g);nR+=f.length;SH.receive('15',f,'Warehouse C','',today);});
    const t0=performance.now();PRJ.tab('15','ship');PRJ.tab('15','items');PRJ.tab('15','locs');const ms=Math.round(performance.now()-t0);
    console.log('[prj15-myxl1012] render after '+nR+' receipts: '+ms+' ms');
    return {moves,distinct:last[0]!==last[1],rev:r248&&r248.seedRev,dest:reg().find(x=>x.ct==='Container 1'&&x.no===5).dest,w,
      memo:a1===a2,same:JSON.stringify(a1)===JSON.stringify(a3),rebuilt:a1!==a3,nR,fast:ms<5000,ms};
  `),
  expect:{moves:2,distinct:true,rev:4,dest:'GH15',w:0,memo:true,same:true,rebuilt:true,nR:292,fast:true} },

{ name:'🆘 Help centre: Projects has the "A supplier shipment — Myxl MX1012" section naming MX1012-D001, G1 Greenhouse, Receive and Put them back (v22.64)',
  requires:REQ,
  run:run(`
    const g=(window.HNX_HELP_GUIDES||[]).find(x=>x.id==='m_projects');
    const secs=(g&&g.sections||[]).filter(s=>/MX1012/.test(s.h||''));
    const txt=JSON.stringify(g&&g.sections||[]);
    return {sec:secs.length,has:['MX1012-D001','G1 Greenhouse','Receive','Put them back'].map(x=>txt.includes(x))};
  `),
  expect:{sec:1,has:[true,true,true,true]} }
];
