/* v22.76: Project 15 → ❄ PVC Cooling System (KEHE) — the GH15 cooling-wall sub-project built from the KEHE 2023 assembly
   manual (Eyal, 13 Oct 2026: "need to create this sub project"). Two runs of 14.5 m (left / right of the GH15 door), the
   manual's figures computed from the parameters, 16 ordered steps with gates, the BOX 2 set list against the Project 15
   register, lost / short → one purchase request per part, Chart A hand-off to Maintenance once, the owner's reference
   media linked (never embedded), nothing written on render. Names, specs and quantities only — no prices anywhere.
   Review fixes (13 Oct, three reviewers): cumulative materials gate incl. pads / pump / capping, frame lines by register key,
   "of 24 ordered" as the supply, request the difference / withdraw, NEED priority + newest occurrence, typing never loses
   text or focus, Blocked before a gate, phone folds, manual letters (A = height) and words.
   Second review (13 Oct, manual / integration / screens): the 0.5 % vs 2 cm drop is a conflict to confirm with KEHE, step 11
   (stacked pads) not applicable on one tier, no invented distributor quantity, step 9 / 10 ends, chalk line, float-gutter
   couplings, 15 mm below the sill, timer / bleed are the manual's "may" / "start with"; received (not free) balance, one
   name = one part, dated withdraw, Myxl never requested, pad / pump requests name what to buy, lost / short with a blank
   allocation, cleared Needed stays cleared, per-item merges (photos, runs, ticks), fixed hand-over ids, no-signal writes
   wait on screen, laptop column order, the 0 mm end, ticks remember their figure, photo viewer / remove, phone folds Done
   steps; the owner's reference video 7. */
const REQ="!!(window.PRJ&&PRJ.cool&&window.HNX_PRJ15_COOL)";
const H=`
  await sleep(3000);
  window.confirm=()=>true; window.alert=()=>{}; window.open=()=>null; window.prompt=()=>'';
  const CL=PRJ.cool, SK='hydroPro_prj15_sub_cooling_v1';
  const toasts=[];const _st=window.showToast;window.showToast=(m,t)=>{toasts.push(String(m));try{return _st&&_st(m,t);}catch(e){}};
  const KEYS=()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^hydroPro_prj(1[56]_|_)/.test(k))o[k]=localStorage.getItem(k);}return o;};
  const snapEq=(a,b)=>{const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();if(JSON.stringify(ka)!==JSON.stringify(kb))return false;return ka.every(k=>a[k]===b[k]);};
  const settle=async()=>{PRJ.pick('15');PRJ.tab('15','over');await sleep(150);PRJ.tab('15','over');await sleep(50);};
  const REALGCU=window.getCurrentUser;
  const asUser=u=>{window.getCurrentUser=()=>u;};
  const asMe=()=>{window.getCurrentUser=REALGCU;};
  const GUARD={username:'guard',fullname:'Guard',role:'staff',active:true};
  const REA={username:'rea',fullname:'Rea',role:'staff',position:'Project Engineer',department:'Projects',active:true};
  const cool=()=>JSON.parse(localStorage.getItem(SK)||'null');
  const IR=()=>JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1')||'[]');
  const MT=()=>loadMaintTasks().filter(t=>/^prj15_cool_/.test(t.autoKey||''));
  const body=()=>document.getElementById('body-prj_1516');
  const tabOpts=()=>{const s=[...body().querySelectorAll('select')].find(x=>/PRJ\\.tab\\(/.test(x.getAttribute('onchange')||''));return s?[...s.options].map(o=>o.value):[];};
  const stubX=()=>{const cap={};window.XLSX={utils:{book_new:()=>({S:[]}),aoa_to_sheet:r=>r,book_append_sheet:(wb,ws,n)=>wb.S.push({name:n,rows:ws})},writeFile:(wb,name)=>{cap.name=name;cap.S=wb.S;}};return cap;};
  const openCool=async()=>{PRJ.pick('15');PRJ.tab('15','cool');await sleep(120);};
  const tickAll=(run,n)=>{const ck=CL.checks(run,n);let ok=true;for(let i=0;i<ck.length;i++)ok=CL.check(run,n,i,true)&&ok;return ok;};
  const doneStep=(run,n)=>{tickAll(run,n);return CL.status(run,n,'done');};
  const last=()=>toasts[toasts.length-1]||'';
  /* the register module reads its stores through a per-tick cache: a test that writes localStorage directly waits one tick */
  const IK='hydroPro_prj15_items_v1';const reg=()=>JSON.parse(localStorage.getItem(IK));
  const addReg=async(ct,no,name,bal)=>{const a=reg();a.push({ct,no,name,unit:'Pcs',qty:bal,recv:bal,bal0:bal});localStorage.setItem(IK,JSON.stringify(a));await sleep(0);};
`;
const run=body=>new Function('return (async()=>{'+H+body+'})()');
const BOX2=['Top Bracket','Pad Guide 3 m/piece','Pad Guide Coupler','Pad Guide Movable Coupler','Endcover for Deflector','Water distribution pipe with holes 3 m/piece, outer dia 60 mm','Pipe Connector inner dia 60 mm','Deflector 3 m/piece','Deflector Coupling','Water Gutter 3 m/piece (2 pcs)','Pad Support','Pad Cover','Float Gutter only','Float Cover','End Cover for Gutter (4 pieces)','Coupling for Water Gutter (4 pieces)','Support Bracket for Float Gutter','Support Bracket for Bottom Gutter','Ball Valve ×2 unit + 25 mm transition pieces 2 pcs (inner dia 25 mm)','PVC T glue coupler ×1 unit (inner dia 48 mm)','Ball Valve ×4 unit (inner dia 48 mm)','PVC T glue coupler ×2 unit (inner dia 60×48 mm)','PVC Elbow glue coupler ×3 unit (inner dia 48 mm)','PVC Reduction ×3 unit (inner dia 60–48 mm)','PVC Coupling ×2 unit (inner dia 48 mm)','48 mm pipe connection 2 units','48 mm pipe connection 1 set','O-ring 2 units inner dia 48 mm','Float dia 25 mm','PVC pipe 4 m (2 m/pcs, outer dia 48 mm)','Screw, nut and washer GI 6 mm × 200 mm','Drill head dia 25 mm','Drill head dia 48 mm','Filters, European standard'];
module.exports=[
{ name:'❄ calc: 1,830 mm × 10 pads → system 6,000, opening L 5,900 × A 1,730 (A = the manual\'s cross-section letter, the height), G 2,050 (manual p.5 example; its "+250" formula 2,080 shown beside), 2 segments (no cut), 6 support + 6 top brackets at 500/1500/2500 per segment, pad supports 12, screws 10, movable couplers 2; 1,530 → 1,430 / 1,750 (v22.76)',
  requires:REQ,
  run:run(`
    const a=CL.calc({padH:1830,runs:[{id:'A',lengthMm:6000}]}),r=a.runs[0];
    const b=CL.calc({padH:1530,runs:[{id:'A',lengthMm:6000}]});
    return {S:r.S,openLen:r.openLen,A:r.A,H:r.H,G:r.G,Gf:r.Gformula,pieces:r.pieces,cut:r.cut,brackets:r.brackets,pos:r.pos,padSupports:r.padSupports,pads:r.pads,trimmed:r.trimmed,joints:r.joints,screws:r.screws,movable:r.movable,
      top:[a.H,a.G],b:[b.H,b.G,b.runs[0].G],runs:a.runs.length};
  `),
  expect:{S:6000,openLen:5900,A:1730,H:1730,G:2050,Gf:2080,pieces:2,cut:0,brackets:6,pos:[500,1500,2500,3500,4500,5500],padSupports:12,pads:10,trimmed:false,joints:1,screws:10,movable:2,top:[1730,2050],b:[1430,1750,1750],runs:1} },

{ name:'❄ GH15 default: two runs 14,500 → per run 24 + 1 trimmed (100), 5 gutters (4 × 3,000 + 2,500 cut, off-cut 500), 15 support + 15 top brackets (… 13,500, 14,000), 29 pad supports, 4 joints, 25 screws, 5 movable couplers, bleed ≈ 180 L/h; wall 30/30 brackets, 10 gutters, 48 + 2 pads, 58 supports, 2 pumps, sets 2.42 per run / 4.83 wall → 5 cover it, 24 ordered; trimLast off → 24 = 14,400, cut 2,400, still 15 (… 13,900); pumpShared → 1 pump; pad height blank → H and G null (v22.76)',
  requires:REQ,
  run:run(`
    const d=CL.calc({}),L=d.runs[0],R=d.runs[1],T=d.total;
    const e=CL.calc({runs:[{id:'L',lengthMm:14500,trimLast:false},{id:'R',lengthMm:14500,trimLast:false}]}).runs[0];
    const f=CL.calc({pumpShared:true}).total;
    return {names:d.runs.map(r=>r.name),L:[L.pads,L.padsFull,L.trimmed,L.trimMm,L.S,L.pieces,L.nFull,L.cut,L.offcut,L.brackets,L.padSupports,L.joints,L.screws,L.movable,Math.round(L.bleedL)],
      posTail:L.pos.slice(-3),padsText:L.padsText,piecesText:L.piecesText,sameR:JSON.stringify(R.pos)===JSON.stringify(L.pos)&&R.pads===L.pads,
      wall:[T.brackets,T.pieces,T.pads,T.padsTrim,T.padsText,T.padSupports,T.pumps,T.floatGutters],sets:[Math.round(L.sets*100)/100,Math.round(T.sets*100)/100,T.setsCover,T.setsOrdered],
      noTrim:[e.pads,e.S,e.cut,e.brackets,e.pos.slice(-2)],shared:f.pumps,blank:[L.H,L.G,d.H,d.G,L.A],openLen:L.openLen};
  `),
  expect:{names:['Left of door','Right of door'],L:[25,24,true,100,14500,5,4,2500,500,15,29,4,25,5,180],posTail:[12500,13500,14000],padsText:'24 × 600 = 14,400 mm + 1 trimmed (100) = 14,500 mm',
    piecesText:'4 × 3,000 + 1 cut to 2,500 mm (off-cut 500)',sameR:true,wall:[30,10,50,2,'48 + 2 trimmed',58,2,2],sets:[2.42,4.83,5,24],noTrim:[24,14400,2400,15,[13500,13900]],shared:1,blank:[null,null,null,null,null],openLen:14400} },

{ name:'👀 Opening writes nothing: cool tab + all 6 sub-screens + both runs + totals + Excel (stubbed) leave every hydroPro_prj15_*/prj16_*/prj_* key byte-identical and no sub_cooling key; tab "cool" is right after "ship" (MX1012 still right after "ml"); P16 has no "cool"; overview shows [data-cool-over]; manual link + 16 step cards with manual page links; 7 gallery items with captions (ref-07 credits the Bilibili channel 绿城温室大棚), 3 videos with posters, none autoloading; ref-07 linked from steps 0, 4, 6, 8, 10, 12, 13; HEAD media/manuals pdf + 7 refs + 3 posters = 11 × 200 (v22.76)',
  requires:REQ,
  run:run(`
    await settle();await sleep(400);await settle();
    const before=KEYS();
    await openCool();
    const o15=tabOpts();
    const manual=body().querySelector('[data-cool-manual]');
    const steps=body().querySelectorAll('[data-cool-step]').length, pglinks=body().querySelectorAll('[data-cool-step] [data-cool-manual-page]').length;
    const r7=[...body().querySelectorAll('[data-cool-stepref="ref-07"]')].map(a=>a.closest('[data-cool-step]').getAttribute('data-cool-step'));
    for(const s of ['params','materials','gates','gallery','maint','steps']){CL.screen(s);await sleep(30);for(const r of ['L','R','all']){CL.run(r);await sleep(20);}}
    CL.screen('gallery');await sleep(30);
    const refs=[...body().querySelectorAll('[data-cool-ref]')];
    const caps=refs.map(e=>(e.querySelector('[data-cool-cap]')||{}).textContent||'').filter(t=>t.length>20).length;
    const vids=[...body().querySelectorAll('[data-cool-ref] video')];
    const cap7=(body().querySelector('[data-cool-ref="ref-07"] [data-cool-cap]')||{}).textContent||'';
    const cap=stubX();CL.excel();await sleep(200);
    PRJ.tab('15','over');await sleep(50);const over=!!body().querySelector('[data-cool-over]');
    PRJ.pick('16');PRJ.tab('16','over');await sleep(50);const o16=tabOpts();
    PRJ.pick('15');CL.screen('steps');CL.run('L');PRJ.tab('15','cool');await sleep(100);
    const after=KEYS();
    const diff=Object.keys(Object.assign({},before,after)).filter(k=>before[k]!==after[k]);
    const urls=[HNX_PRJ15_COOL.manual].concat(HNX_PRJ15_COOL.refs.map(r=>r.src)).concat(HNX_PRJ15_COOL.refs.filter(r=>r.poster).map(r=>r.poster));
    const heads=await Promise.all(urls.map(u=>fetch(u,{method:'HEAD'}).then(r=>r.status).catch(()=>0)));
    return {same:snapEq(before,after),diff,noKey:localStorage.getItem(SK)===null,cool15:o15.includes('cool'),afterShip:o15[o15.indexOf('ship')+1],afterMl:o15[o15.indexOf('ml')+1],cool16:o16.includes('cool'),over,
      manual:!!manual&&manual.getAttribute('href')===HNX_PRJ15_COOL.manual&&manual.getAttribute('target')==='_blank'&&/noopener/.test(manual.getAttribute('rel')||''),
      embedded:!document.querySelector('embed[src*=pdf],object[data*=pdf],iframe[src*=pdf]'),steps,pglinks,gallery:refs.length,caps,vids:vids.length,posters:vids.filter(v=>v.getAttribute('poster')&&v.getAttribute('preload')==='metadata').length,
      autoplay:vids.filter(v=>v.autoplay||v.hasAttribute('autoplay')).length,cap7:/绿城温室大棚/.test(cap7)&&/Bilibili/.test(cap7)&&/generic/.test(cap7),r7,
      sheets:(cap.S||[]).map(s=>s.name),heads:heads.length+':'+heads.filter(h=>h===200).length};
  `),
  expect:{same:true,diff:[],noKey:true,cool15:true,afterShip:'cool',afterMl:'ship',cool16:false,over:true,manual:true,embedded:true,steps:16,pglinks:16,gallery:7,caps:7,vids:3,posters:3,autoplay:0,cap7:true,
    r7:['L:0','L:4','L:6','L:8','L:10','L:12','L:13'],sheets:['Parameters','Steps','Materials','Gates','Maintenance'],heads:'11:11'} },

{ name:'❄ Steps in order: step 1 Done refused before step 0 (store unchanged, the order toast names the step only — "Preceding work accepted" is the wall-frame gate, not the order); 0 Done needs its checkpoint ticked, then → 1 Doing ok; 3 Done refused while 2 open, then refused until the "Preceding work accepted" gate is ticked, then refused without its checkpoint; step 3 checkpoint cannot be ticked until the pad height is chosen; Left reaches 4 done while Right has 0 → progress L 27 % (4 of 15 — step 11 not applicable on one tier), R 0 %, combined 13.3 % (4/30); Blocked needs a reason; Done stamps done = today and who (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const s0=localStorage.getItem(SK);
    const r1=CL.status('L',1,'done');const same=localStorage.getItem(SK)===s0;const t1=last();
    const d0a=CL.status('L',0,'done');const t0=last();
    tickAll('L',0);const d0=CL.status('L',0,'done');
    const g1=CL.status('L',1,'doing');
    const r3a=CL.status('L',3,'done');const t3a=last();
    doneStep('L',1);doneStep('L',2);
    const r3b=CL.status('L',3,'done');const t3b=last();
    CL.setGate('L','predecessor',true,'wall frame complete');
    const r3c=CL.status('L',3,'done');const t3c=last();
    const c3a=CL.check('L',3,0,true);const tc=last();
    CL.setParam('padH',1830);
    const d3=doneStep('L',3);
    const pg=CL.progress();
    const b0=CL.status('L',4,'blocked','');const tb=last();const b1=CL.status('L',4,'blocked','waiting for the brackets');
    const st4=CL.step('L',4),st3=CL.step('L',3);
    return {r1,same,t1:/Step 0 must be Done first/.test(t1)&&!/Preceding work accepted/.test(t1),d0a,t0:/checkpoint/.test(t0),d0,g1,r3a,t3a:/Step 2 must be Done first/.test(t3a),r3b,t3b:/Preceding work accepted/.test(t3b),r3c,t3c:/checkpoint/.test(t3c),c3a,tc:/pad height/.test(tc),d3,
      pg:[pg.runs.L.done,pg.runs.L.pct,pg.runs.R.done,pg.runs.R.pct,pg.done,pg.total,pg.pct],b0,tb:/why/i.test(tb),b1,st4:[st4.status,st4.blockedWhy],st3:[st3.status,st3.done===today,!!st3.who,st3.history.length>0]};
  `),
  expect:{r1:false,same:true,t1:true,d0a:false,t0:true,d0:true,g1:true,r3a:false,t3a:true,r3b:false,t3b:true,r3c:false,t3c:true,c3a:false,tc:true,d3:true,pg:[4,27,0,0,4,30,13.3],b0:false,tb:true,b1:true,st4:['blocked','waiting for the brackets'],st3:['done',true,true,true]} },

{ name:'❄ Materials: 50 rows (34 BOX 2 + pads, distributor, pump, L-capping, 7 un-boxed §11 / ref 12 lines + the distributor with a blank Needed, 5 Myxl frame lines), KEHE parts show NOT IN REGISTER (in register 0) while the "Cooling pad bracket" frame row matches C1 #97 = 40 by key; Top Bracket per set 6, needed 15 + 15 = 30, available blank → "of 24 ordered" and the order (144) is the supply → to-request 0; sets allocated 5 → available 30, to-request 0; lost/short 2 (note) → to-request 2; ➕ creates ONE hydroPro_inv_requests_v1 record {type purchase, reqModule projects, linkType prj15_cool, linkRef top_bracket, qty 2, status submitted, needDept Maintenance, toLoc GH15} + a req: record; ➕ again → refused (2 requested); pad 7090 / 1,830 and 220 V pumps chosen → ➕ Request all raises 3 (L-capping 4, pads "Cooling pad 7090 1,830 × 600 × 150 mm (flute angles 45°/45°, 90°)" × 50, pumps "Water pump 0.75 kW, 220 V 1-phase (240 L/min, head 11 m)" × 2) — no frame line, no distributor, no second Top Bracket; all 4 sit in Purchasing\'s From Inventory filter (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.screen('materials');await sleep(50);
    const rows=CL.materials();const tb=rows.find(r=>r.key==='top_bracket'),fb=rows.find(r=>r.key==='frame_bracket');
    const inreg=(body().querySelector('[data-cool-inreg="top_bracket"]')||{}).textContent||'';
    const av=(body().querySelector('[data-cool-avail="top_bracket"]')||{}).textContent||'';
    const kehe0=rows.filter(r=>r.box==='B2'&&r.inRegister===0).length,keheN=rows.filter(r=>r.box==='B2').length;
    const blankNeed=rows.filter(r=>r.needed==null).map(r=>r.key).sort(),byBox={};rows.forEach(r=>{byBox[r.box]=(byBox[r.box]||0)+1;});
    CL.setParam('setsAllocated',5);const tb2=CL.materials().find(r=>r.key==='top_bracket');
    CL.setLost('top_bracket',2,'one box arrived open');const tb3=CL.materials().find(r=>r.key==='top_bracket');
    const n0=IR().length;const r=CL.request('top_bracket');const n1=IR().length;
    const mine=IR().filter(x=>x.linkType==='prj15_cool'&&x.linkRef==='top_bracket');const m=mine[0]||{};
    const r2=CL.request('top_bracket');const t2=last();
    CL.setParam('padH',1830);CL.setParam('padModel','7090');CL.setRun('L','pumpV','220 V 1-phase');CL.setRun('R','pumpV','220 V 1-phase');
    const before=CL.materials().filter(x=>x.toRequest>0&&!x.reqNo).map(x=>x.key).sort();
    const n=CL.requestAll();
    const all=IR().filter(x=>x.linkType==='prj15_cool');const by=k=>all.find(x=>x.linkRef===k)||{};
    return {rows:rows.length,byBox:Object.keys(byBox).sort().map(k=>k+':'+byBox[k]),blankNeed,tb:[tb.ref,tb.perSet,tb.byRun.L,tb.byRun.R,tb.needed,tb.available,tb.ordered,tb.orderedCovers,tb.inRegister,tb.toRequest],fb:[fb.inRegister,fb.needed,fb.toRequest,fb.regRows.map(x=>x.ct+'#'+x.no+'='+x.avail)],
      inreg:/NOT IN REGISTER/.test(inreg),av:/of 24 ordered/.test(av),kehe:kehe0+'/'+keheN,
      tb2:[tb2.available,tb2.toRequest],tb3:[tb3.lost,tb3.lostNote,tb3.toRequest],
      req:!!(r&&r.no),added:n1-n0,m:[m.type,m.reqModule,m.linkType,m.linkRef,m.qty,m.status,m.needDept,m.toLoc,m.priority,/KEHE ref 2/.test(m.itemName),/lost\\/short 2/.test(m.itemDesc)],
      reqRec:!!(cool()||[]).find(x=>x.id==='req:top_bracket'&&x.reqNo===r.no),reqNoShown:CL.materials().find(x=>x.key==='top_bracket').reqNo===r.no,
      r2:r2===null,t2:/already raised/.test(t2),still:mine.length,before,n,after:all.length,tbCount:all.filter(x=>x.linkRef==='top_bracket').length,
      pad:[by('pad').qty,by('pad').itemName],pump:[by('pump').qty,by('pump').itemName,/Left of door \\+ Right of door/.test(by('pump').itemDesc||'')],cap:by('l_capping').qty,
      noFrame:!all.some(x=>/^frame_/.test(x.linkRef)||x.linkRef==='distributor'),
      inbox:all.filter(x=>x.type==='purchase'&&!x.prId&&/submitted/.test(x.status)).length,qtys:all.every(x=>x.qty>0),noPrice:!/₱|price/i.test(JSON.stringify(all))};
  `),
  expect:{rows:50,byBox:['B1:3','B2:34','myxl:5','none:8'],blankNeed:['angle_brackets','anti_splash','capping_v','distributor','ext_bracket','ext_pipe','p12_capping_l100','ss_pad_cover'],tb:['2',6,15,15,30,null,144,true,0,0],fb:[40,40,0,['Container 1#97=40']],inreg:true,av:true,kehe:'34/34',tb2:[30,0],tb3:[2,'one box arrived open',2],req:true,added:1,
    m:['purchase','projects','prj15_cool','top_bracket',2,'submitted','Maintenance','GH15','High',true,true],reqRec:true,reqNoShown:true,r2:true,t2:true,still:1,
    before:['l_capping','pad','pump'],n:3,after:4,tbCount:1,pad:[50,'Cooling pad 7090 1,830 × 600 × 150 mm (flute angles 45°/45°, 90°) (KEHE, not in BOX 2)'],pump:[2,'Water pump 0.75 kW, 220 V 1-phase (240 L/min, head 11 m) (KEHE, not in BOX 2)',true],cap:4,noFrame:true,inbox:4,qtys:true,noPrice:true} },

{ name:'📷 Photos: addPhoto(L,4,{url,caption}) → its own record photo:L:4:<id> with id/at/by; second photo 2; the photos survive a render and show as 2 thumbnails on the Left step card, each with its caption printed under it; a thumbnail opens the in-page viewer with "bracket at 500"; 🗑 Remove takes one away (record kept as removed, history "Photo removed"); once the step is Done a removal needs a reason; a photo without url is refused (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const PX='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const a=CL.addPhoto('L',4,{url:PX,caption:'bracket at 500'});
    const p1=CL.step('L',4).photos,n1=p1.length;
    const b=CL.addPhoto('L',4,{url:PX,caption:'bracket at 1500'});
    const c=CL.addPhoto('L',4,{caption:'no url'});
    PRJ.tab('15','over');await sleep(50);await openCool();CL.run('L');CL.screen('steps');await sleep(80);
    const p2=CL.step('L',4).photos;
    const caps=[...body().querySelectorAll('[data-cool-step="L:4"] [data-cool-photocap]')].map(e=>e.textContent);
    body().querySelector('[data-cool-step="L:4"] [data-cool-photo]').click();await sleep(50);
    const v=document.getElementById('hnxCoolViewer');const viewer=v?[(v.querySelector('[data-cool-viewcap]')||{}).textContent,!!(v.querySelector('img')||{}).src]:null;if(v)v.click();
    const recs=(cool()||[]).filter(x=>/^photo:L:4:/.test(x.id)).length;
    const rm=CL.removePhoto('L',4,p2[1].id,'');const p3=CL.step('L',4).photos;
    const kept=(cool()||[]).find(x=>x.id===p2[1].id);
    /* step 4 Done: removal needs a reason */
    CL.setParam('padH',1530);CL.setParam('dropMm',20);CL.setGate('L','predecessor',true,'ok');for(let n=0;n<=4;n++)doneStep('L',n);
    window.prompt=()=>'';const rmD=CL.removePhoto('L',4,p2[0].id);window.prompt=()=>'wrong step';const rmD2=CL.removePhoto('L',4,p2[0].id);
    return {a,b,c,n1,p1:[!!p1[0].id,!!p1[0].at,!!p1[0].by,p1[0].caption,/^photo:L:4:/.test(p1[0].id)],n2:p2.length,thumbs:body().querySelectorAll('[data-cool-step="L:4"] [data-cool-photo]').length,caps,viewer,recs,other:CL.step('R',4).photos.length,
      rm,p3:p3.map(x=>x.caption),kept:[!!kept&&kept.removed,!!(kept&&kept.removedBy)],hist:CL.step('L',4).history.some(h=>/^Photo removed: bracket at 1500/.test(h.ev)),rmD,rmD2,p4:CL.step('L',4).photos.length};
  `),
  expect:{a:true,b:true,c:false,n1:1,p1:[true,true,true,'bracket at 500',true],n2:2,thumbs:2,caps:['bracket at 500','bracket at 1500'],viewer:['bracket at 500',true],recs:2,other:0,
    rm:true,p3:['bracket at 500'],kept:[true,true],hist:true,rmD:false,rmD2:true,p4:0} },

{ name:'❄ Gates: six labels in the module\'s order; materials auto red with the short list — Left "Top Bracket 0/15 (wall 30)", "Cooling pad … 0/25 (wall 50)", "Water pump … 0/1 (wall 2)", "L-capping … 0/2 (wall 4)", Right "Top Bracket 0/30", no drill heads, no Myxl lines, no distributor (no quantity); drawing green with the manual + an added R&D link; predecessor / manpower / equipment ticks by the engineer; inspections green "15 checkpoints, one per step (step 11 not applicable — one tier of pads)"; step 3 Doing refused until predecessor is ticked; the materials gate is set by Nexi, not by hand (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.screen('gates');await sleep(50);
    const g0=CL.gates('L');
    const link=CL.addGateLink('L','ABA PARDES Build Sequence (R&D library)','');
    const hand=CL.setGate('L','materials',true,null);
    const t1=CL.setGate('L','manpower',true,'crew of 4'),t2=CL.setGate('L','equipment',true,null);
    tickAll('L',0);CL.status('L',0,'done');doneStep('L',1);doneStep('L',2);
    const s3a=CL.status('L',3,'doing');const ta=last();
    const t3=CL.setGate('L','predecessor',true,'wall frame accepted by Eyal');
    const s3b=CL.status('L',3,'doing');
    const g1=CL.gates('L');
    await sleep(60);const dom=[...body().querySelectorAll('[data-cool-gate^="L:"]')].map(e=>e.getAttribute('data-cool-gate').slice(2)+':'+e.getAttribute('data-cool-ok'));
    const gR=CL.gates('R')[0].detail;
    return {labels:g0.map(g=>g.label),ok0:g0.map(g=>g.ok),mat:/^short: /.test(g0[0].detail)&&/Top Bracket 0\\/15 \\(wall 30\\)/.test(g0[0].detail),padL:/Cooling pad [^·]*0\\/25 \\(wall 50\\)/.test(g0[0].detail),pumpL:/Water pump [^·]*0\\/1 \\(wall 2\\)/.test(g0[0].detail),capL:/L-capping [^·]*0\\/2 \\(wall 4\\)/.test(g0[0].detail),tbR:/Top Bracket 0\\/30/.test(gR)&&!/Top Bracket 0\\/30 \\(wall/.test(gR),noTools:!/Drill head/.test(g0[0].detail)&&!/Myxl/.test(g0[0].detail)&&!/Distributor/.test(g0[0].detail),draw0:g0[1].detail,insp:g0[5].detail,link,hand,t1,t2,s3a,ta:/Preceding work accepted/.test(ta),t3,s3b,
      ok1:g1.map(g=>g.ok),draw1:/Build Sequence/.test(g1[1].detail),dom,R:CL.gates('R').map(g=>g.ok)};
  `),
  expect:{labels:['Required materials available','Drawing sheet linked','Preceding work accepted','Assigned manpower confirmed','Required equipment available','Inspection checkpoints defined'],ok0:[false,true,false,false,false,true],mat:true,padL:true,pumpL:true,capL:true,tbR:true,noTools:true,draw0:'KEHE manual, 16 pages',insp:'15 checkpoints, one per step (step 11 not applicable — one tier of pads)',
    link:true,hand:false,t1:true,t2:true,s3a:false,ta:true,t3:true,s3b:true,ok1:[false,true,true,true,true,true],draw1:true,dom:['materials:0','drawing:1','predecessor:1','manpower:1','equipment:1','inspections:1'],R:[false,true,false,false,false,true]} },

{ name:'❄ Hand-over: every applicable step Done on Left (step 11 refused: not applicable on one tier; drop confirmed 20 mm) → 10 Chart A + 1 quarterly = 11 maintenance tasks with fixed ids T_prj15_cool_<key> (weekly 4 / monthly 5 / yearly 1 / quarterly 1), assignee = maintenance lead (dept head "jomel" → "Jomel IT"), priority NEED (a real Maintenance level, never "medium"), location GH15, sourceModule prj15_cooling, remarks carry the 8 rules, the night rule ("may be installed … 22:00") and "WARNING: DO NOT add chemicals"; Right run Done → 0 created, still 11; the maint record holds 11 ids; the Maintenance sub-tab shows 11 ✓; a second computer handing over before it syncs makes the same 11 ids → the merge keeps 11, not 22 (v22.76)',
  requires:REQ,
  seed:()=>{localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'jomel'}));const us=JSON.parse(localStorage.getItem('hydroPro_users')||'[]');us.push({username:'jomel',fullname:'Jomel IT',role:'staff',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(us));},
  run:run(`
    await openCool();
    CL.setParam('padH',1530);CL.setParam('padModel','7060');CL.setParam('dropMm',20);
    const mt0=localStorage.getItem('hydroPro_maint_tasks');
    const before=MT().length;
    for(const r of ['L','R'])CL.setGate(r,'predecessor',true,'frame ok');
    const na11=CL.status('L',11,'done');const tna=last();
    let okL=true;for(let n=0;n<16;n++){if(n===11)continue;okL=doneStep('L',n)&&okL;}
    const m1=MT();
    const cad=k=>m1.filter(t=>t.recurrence&&t.recurrence.type===k).length;
    const t0=m1[0]||{};
    let okR=true;for(let n=0;n<16;n++){if(n===11)continue;okR=doneStep('R',n)&&okR;}
    const m2=MT();
    const again=CL.handover();
    const rec=(cool()||[]).find(x=>x.id==='maint')||{};
    CL.screen('maint');await sleep(60);
    const ticks=[...body().querySelectorAll('[data-cool-chart]')].filter(e=>/✓/.test(e.textContent)).length;
    /* computer B: the same maintenance store as before A's hand-over (not pulled yet) */
    const rawA=localStorage.getItem('hydroPro_maint_tasks');
    if(mt0==null)localStorage.removeItem('hydroPro_maint_tasks');else localStorage.setItem('hydroPro_maint_tasks',mt0);
    const hb=CL.handover();const rawB=localStorage.getItem('hydroPro_maint_tasks');
    const mg=JSON.parse(window.__hnxMergeGeneric('hydroPro_maint_tasks',rawB,rawA)||rawB).filter(t=>/^prj15_cool_/.test(t.autoKey||''));
    return {before,na11,tna:/not applicable/.test(tna),okL,n1:m1.length,cad:[cad('weekly'),cad('monthly'),cad('yearly'),cad('quarterly')],keys:m1.map(t=>t.autoKey).sort(),ids:m1.every(t=>t.id==='T_'+t.autoKey),
      t0:[t0.assignees&&t0.assignees[0].name,t0.assignees&&t0.assignees[0].isLeader,t0.team,t0.location,t0.sourceModule,t0.status,t0.priority,t0.category,!!t0.scheduledDate,t0.durationDays],
      title:/^❄ GH15 cooling pads — /.test(t0.title),rem:[/WARNING: DO NOT add chemicals/.test(t0.remarks),/may be installed: pumps off 22:00/.test(t0.remarks),/8\\. /.test(t0.remarks),/start with/.test(t0.remarks)],desc:/Chart A/.test(t0.description)&&/Left of door \\+ Right of door/.test(t0.description),
      okR,n2:m2.length,again:[again.created.length,again.existing],recIds:(rec.taskIds||[]).length,by:!!rec.by,pg:CL.progress().pct,ticks,b:hb.created.length,merged:mg.length};
  `),
  expect:{before:0,na11:false,tna:true,okL:true,n1:11,cad:[4,5,1,1],keys:['prj15_cool_m_control','prj15_cool_m_float_valve','prj15_cool_m_pipe_holes','prj15_cool_m_pump_filter','prj15_cool_m_sump','prj15_cool_q_disinfect','prj15_cool_w_dry_streaks','prj15_cool_w_pad_face','prj15_cool_w_return_filter','prj15_cool_w_strainer','prj15_cool_y_trough'],ids:true,
    t0:['Jomel IT',true,'⭐ Jomel IT','GH15','prj15_cooling','not_started','need','pm',true,1],title:true,rem:[true,true,true,true],desc:true,okR:true,n2:11,again:[0,11],recIds:11,by:true,pg:100,ticks:11,b:11,merged:11} },

{ name:'🔒 Permissions: staff "guard" → canEdit false, setParam / status / setLost / setGate refused, request null, store unchanged, 0 enabled [data-cool-edit] controls and the 🔒 banner; "Rea" with position Project Engineer → canEdit true; an administrator names "guard" among the editors → guard edits; the editors field is administrators-only; a read-only user picking a photo is refused BEFORE the caption is asked (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const s0=localStorage.getItem(SK);
    asUser(GUARD);await openCool();
    const g=[CL.canEdit(),CL.setParam('padH',1530),CL.status('L',0,'doing'),CL.setLost('top_bracket',1,'x'),CL.setGate('L','manpower',true,null),CL.request('top_bracket'),CL.setRun('L','lengthMm',12000)];
    const same=localStorage.getItem(SK)===s0;
    const en=body().querySelectorAll('[data-cool-edit]:not([disabled])').length,ro=!!body().querySelector('[data-cool-ro]');
    CL.screen('materials');await sleep(40);const en2=body().querySelectorAll('[data-cool-edit]:not([disabled])').length;
    CL.screen('params');await sleep(40);const en3=body().querySelectorAll('[data-cool-edit]:not([disabled])').length;CL.screen('steps');
    let asked=0;window.prompt=()=>{asked++;return 'x';};
    hnxCoolPhoto('L',4,{files:[new File([new Uint8Array([1,2,3])],'a.jpg',{type:'image/jpeg'})],value:''});await sleep(50);window.prompt=()=>'';
    asUser(REA);await openCool();
    const rea=[CL.canEdit(),!!body().querySelector('[data-cool-ro]'),body().querySelectorAll('[data-cool-edit]:not([disabled])').length>0,CL.setParam('editors','guard')];
    asMe();await openCool();
    const adm=[CL.canEdit(),CL.setParam('editors','guard, chen')];
    asUser(GUARD);await openCool();
    const g2=[CL.canEdit(),CL.setLost('top_bracket',1,'counted short'),!!body().querySelector('[data-cool-ro]')];
    asMe();
    return {g,same,en,ro,en2,en3,asked,rea,adm,g2,editors:CL.params().editors};
  `),
  expect:{g:[false,false,false,false,false,null,false],same:true,en:0,ro:true,en2:0,en3:0,asked:0,rea:[true,false,true,false],adm:[true,true],g2:[true,true,false],editors:['guard','chen']} },

{ name:'⬇ Excel: Prj15_Cooling_KEHE_<today>.xlsx with 5 sheets Parameters / Steps / Materials / Gates / Maintenance; Parameters name the pad tiers, the unconfirmed drop and the 0 mm end of each run; Steps 33 rows (1 + 16 × 2, step 11 "n/a"); Materials 1 + 50 rows with the formula column; Gates 1 + 12; Maintenance 12 rows after the hand-over button; no price column anywhere (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const cap=stubX();CL.excel();await sleep(200);
    const S=cap.S||[];const by=n=>(S.find(s=>s.name===n)||{}).rows||[];
    const pr=by('Parameters'),st=by('Steps');
    const h=CL.handover();
    const cap2=stubX();CL.excel();await sleep(200);const M2=(cap2.S.find(s=>s.name==='Maintenance')||{}).rows||[];
    return {name:cap.name,sheets:S.map(s=>s.name),steps:st.length,na:st.filter(r=>r[1]===11).map(r=>r[3]),mats:by('Materials').length,matHead:by('Materials')[0].slice(0,5),gates:by('Gates').length,maint1:by('Maintenance').length,
      params:[!!pr.find(r=>r[0]==='Pad tiers'&&r[1]===1),!!pr.find(r=>/Gutter drop/.test(r[0])&&/not confirmed/.test(r[1])),pr.filter(r=>/0 mm at$/.test(r[0])).map(r=>r[1])],
      created:h.created.length,maint2:M2.length,m2ids:M2.slice(1).every(r=>/^T_/.test(String(r[3]))),noPrice:!/₱|price|cost/i.test(JSON.stringify(S))};
  `),
  expect:{name:'Prj15_Cooling_KEHE_'+(new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'))+'.xlsx',sheets:['Parameters','Steps','Materials','Gates','Maintenance'],steps:33,na:['n/a','n/a'],mats:51,matHead:['Ref','BOX 2 name','Spec','Per set','Basis'],gates:13,maint1:12,
    params:[true,true,['door side end','door side end']],created:11,maint2:12,m2ids:true,noPrice:true} },

{ name:'🆘 Help centre: Projects has exactly one section whose heading names KEHE (and still exactly one MX1012 heading); the guide names "Left of door", "24 + 1 trimmed", "Lost / short", "Chart A", "never shows a price", "✅ Task Board" (not a "PM tasks" screen), "the larger of available and in register", "Withdraw", "(not short)", the gates under "Screen ✅ Gates" (not "under the steps"), the 0.5 % / 2 cm drop to confirm with KEHE, step 11 "Not applicable", the chalk line, seven reference photos and videos; the Help centre carries no download or file path (v22.76)',
  requires:REQ,
  run:run(`
    const g=(window.HNX_HELP_GUIDES||[]).find(x=>x.id==='m_projects');
    const secs=(g&&g.sections||[]).filter(s=>/KEHE/.test(s.h||''));
    const mx=(g&&g.sections||[]).filter(s=>/MX1012/.test(s.h||''));
    const txt=JSON.stringify(secs);
    return {sec:secs.length,mx:mx.length,has:['Left of door','24 + 1 trimmed','Lost / short','Chart A','never shows a price','Preceding work accepted','✅ Task Board','the larger of available and in register','Withdraw','(not short)','height A = pad height − 100 mm','Screen ✅ Gates','0.5 % slope','2 cm drop end to end','confirm the drop with KEHE','Not applicable','chalk line','seven reference photos and videos','may be installed'].map(x=>txt.includes(x)),
      noUnder:!/sit under the steps/.test(txt),noPm:!/PM tasks,/.test(txt)&&!/Maintenance → PM tasks/.test(txt),noFile:!/media\\/manuals|\\.pdf|download/i.test(txt)};
  `),
  expect:{sec:1,mx:1,has:[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true],noUnder:true,noPm:true,noFile:true} },

{ name:'❄ Materials gate is cumulative and counts every KEHE part with a quantity: register KEHE lines (full supplier names) at the single-run quantity (15 top brackets, 15 support brackets, 29 pad supports, 5 gutters, 5 gutter couplings … 25 pads, 1 pump, 2 L-capping) → Left gate GREEN, Right gate RED with "Top Bracket 15/30", "Cooling pad … 25/50", "Water pump … 1/2"; Top Bracket in register 15, needed 30, to-request 0 (the 24 ordered sets cover it); 20 top brackets → Left ok, Right "Top Bracket 20/30"; pads 0 → Left red "Cooling pad … 0/25 (wall 50)"; distributor has no quantity → never in the gate; frame lines by register KEY: adj 100 on Container 1 #65 "Corner connector 70*80*95" leaves Double corner connector at 0, MX1012-D 66 received 530 → 530 while MX1012-D 47 ×8 is not counted; a frame line is never "to request" (Myxl supply, MX1012-D066 530 still to come) (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    CL.setParam('padH',1830);CL.setParam('padModel','7090');
    const setAdj=async(ct,no,adj)=>{const a=reg();const it=a.find(x=>x.ct===ct&&Number(x.no)===no);it.adj=adj;localStorage.setItem(IK,JSON.stringify(a));await sleep(0);};
    const m0=CL.materials();
    let no=900;for(const m of m0){if(m.box==='myxl'||m.tool||m.needed==null)continue;const q=m.byRun.L||m.needed;await addReg('KEHE',++no,m.name,q);}
    const m1=CL.materials();const tb1=m1.find(m=>m.key==='top_bracket'),pad1=m1.find(m=>m.key==='pad'),dist1=m1.find(m=>m.key==='distributor');
    const gL=CL.gates('L')[0],gR=CL.gates('R')[0];
    await addReg('KEHE',++no,'Top Bracket',5);const gL2=CL.gates('L')[0],gR2=CL.gates('R')[0];
    const a=reg();a.forEach(x=>{if(x.ct==='KEHE'&&/^Cooling pad 7090/.test(x.name)){x.bal0=0;x.bal=0;}});localStorage.setItem(IK,JSON.stringify(a));await sleep(0);
    const gL3=CL.gates('L')[0];
    const fc0=CL.materials().find(m=>m.key==='frame_corner');
    await setAdj('Container 1',65,100);const fc1=CL.materials().find(m=>m.key==='frame_corner');
    await addReg('MX1012-D',47,'Corner connector 70*80*95',8);await addReg('MX1012-D',66,'Double corner connector 60*120',530);const fc2=CL.materials().find(m=>m.key==='frame_corner');
    return {tb1:[tb1.inRegister,tb1.needed,tb1.toRequest],pad1:[pad1.inRegister,pad1.needed],dist1:[dist1.inRegister,dist1.needed,dist1.box],
      L:[gL.ok,gL.detail],R:[gR.ok,/Top Bracket 15\\/30/.test(gR.detail),/Cooling pad [^·]*25\\/50/.test(gR.detail),/Water pump [^·]*1\\/2/.test(gR.detail),/Distributor/.test(gR.detail)],
      L2:gL2.ok,R2:[gR2.ok,/Top Bracket 20\\/30/.test(gR2.detail)],L3:[gL3.ok,/Cooling pad [^·]*0\\/25 \\(wall 50\\)/.test(gL3.detail)],
      fc0:[fc0.inRegister,fc0.toRequest,fc0.short,fc0.onWay,fc0.ship.map(s=>s.code),fc0.regRows.map(x=>x.ct+'#'+x.no).sort()],fc1:[fc1.inRegister,fc1.toRequest],fc2:[fc2.inRegister,fc2.toRequest,fc2.regRows.map(x=>x.ct+'#'+x.no).sort()],
      c65:reg().find(x=>x.ct==='Container 1'&&x.no===65).name};
  `),
  expect:{tb1:[15,30,0],pad1:[25,50],dist1:[0,null,'B1'],L:[true,'every KEHE part is in the Project 15 register with enough balance for this run and the runs before it'],R:[false,true,true,true,false],
    L2:true,R2:[false,true],L3:[false,true],fc0:[0,0,0,530,['MX1012-D066'],['Container 1#96']],fc1:[0,0],fc2:[530,0,['Container 1#96','MX1012-D#66']],c65:'Corner connector 70*80*95'} },

{ name:'📦 Parts handed out to the installers still cover the need: register pads 7090 × 50 and Top Bracket × 30 (Warehouse C), sets allocated 4 (24 top brackets available); release 25 pads + 15 top brackets on a Project 15 item request (RELEASED, GH15, "Left run install") → pads in register 50 (in store now 25), to request 0; Top Bracket in register 30 (in store 15), to request 0; Right-of-door gate names neither; ➕ pads → "Nothing to request" (no IR raised) (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.setParam('padH',1830);CL.setParam('padModel','7090');
    await addReg('Warehouse C',9901,'Cooling pad 7090 1830 × 600 × 150',50);await addReg('Warehouse C',9902,'Top Bracket',30);
    CL.setParam('setsAllocated',4);
    const mat=k=>CL.materials().find(m=>m.key===k);
    const b={pad:mat('pad'),tb:mat('top_bracket')};
    const rl=JSON.parse(localStorage.getItem('hydroPro_prj15_reqs_v1')||'[]');
    rl.push({id:'RQX1',no:'RQ-X1',status:'RELEASED',gh:'GH15',by:'Tester',purpose:'Left run install',lines:[{ct:'Warehouse C',no:9901,qtyReq:25,qtyApp:25},{ct:'Warehouse C',no:9902,qtyReq:15,qtyApp:15}],updatedAt:Date.now()});
    localStorage.setItem('hydroPro_prj15_reqs_v1',JSON.stringify(rl));await sleep(0);
    const a={pad:mat('pad'),tb:mat('top_bracket')};
    const gR=CL.gates('R')[0].detail;
    const n0=IR().length;const ir=CL.request('pad');const t=last();
    return {before:[b.pad.inRegister,b.pad.toRequest,b.tb.inRegister,b.tb.available,b.tb.toRequest],bal:PRJ.bal('15',reg().find(x=>x.no===9901)),
      after:[a.pad.inRegister,a.pad.inStore,a.pad.toRequest,a.tb.inRegister,a.tb.inStore,a.tb.toRequest],gate:[/Cooling pad/.test(gR),/Top Bracket/.test(gR)],ir:ir===null,t:/Nothing to request/.test(t),added:IR().length-n0};
  `),
  expect:{before:[50,0,30,24,0],bal:25,after:[50,25,0,30,15,0],gate:[false,false],ir:true,t:true,added:0} },

{ name:'🔤 One name = one part: each of the 34 BOX 2 supplier names and every part name hits exactly ONE part pattern (the 5 Myxl frame names none — they match by register key); in the register "Water Gutter 3 m/piece (2 pcs)" 5 + "Coupling for Water Gutter (4 pieces)" 8 → gutters 5 / couplings 8, "Float Gutter only" 1 + "Support Bracket for Float Gutter" 4 → 1 / 4, "Deflector 3 m/piece" 5 + "Endcover for Deflector" 4 → 5 / 4, the 48 mm tee 1 + the 60×48 tee 4 → 1 / 4, "L-capping 50×50×0.48 L8ft" 4 + "Capping L 100 × 2,438 mm (8 ft) × 0.48 thk" 3 → 4 / 3 (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const B=${JSON.stringify(BOX2)};
    const P=HNX_PRJ15_COOL.parts;const bad=[];
    B.map(n=>({n})).concat(P.map(p=>({n:p.name,own:p.key,myxl:p.box==='myxl'}))).forEach(x=>{const hits=P.filter(p=>p.re&&p.re.test(x.n)).map(p=>p.key);if(x.myxl?hits.length!==0:(hits.length!==1||(x.own&&hits[0]!==x.own)))bad.push(x.n+' → '+hits.join(','));});
    let no=700;for(const [n,q] of [['Water Gutter 3 m/piece (2 pcs)',5],['Coupling for Water Gutter (4 pieces)',8],['Float Gutter only',1],['Support Bracket for Float Gutter',4],['Deflector 3 m/piece',5],['Endcover for Deflector',4],['PVC T glue coupler ×1 unit (inner dia 48 mm)',1],['PVC T glue coupler ×2 unit (inner dia 60×48 mm)',4],['L-capping 50×50×0.48 L8ft',4],['Capping L 100 × 2,438 mm (8 ft) × 0.48 thk',3]])await addReg('Warehouse C',++no,n,q);
    const m=CL.materials(),q=k=>m.find(x=>x.key===k).inRegister;
    return {names:B.length+P.length,bad,reg:[q('water_gutter'),q('gutter_coupling'),q('float_gutter'),q('float_gutter_bracket'),q('deflector'),q('end_cover_deflector'),q('p5_tee48'),q('p5b_tee6048'),q('l_capping'),q('p12_capping_l100')]};
  `),
  expect:{names:84,bad:[],reg:[5,8,1,4,5,4,1,4,4,3]} },

{ name:'❄ Blocked before the gate: step 3 "Wall opening" set Blocked with "wall frame not finished by Myxl" while "Preceding work accepted" is unticked → stored (status blocked, reason kept); Doing and Done still refused with the gate toast; after the tick Doing ok; once Done the red "Blocked:" line is gone and the old reason shows muted as "was blocked: …" (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    for(let n=0;n<3;n++)doneStep('L',n);
    const b=CL.status('L',3,'blocked','wall frame not finished by Myxl');const st=CL.step('L',3);
    await sleep(30);const red0=!!body().querySelector('[data-cool-blocked="L:3"]');
    const d=CL.status('L',3,'doing');const td=last();const dn=CL.status('L',3,'done');
    CL.setGate('L','predecessor',true,'frame accepted');CL.setParam('padH',1530);
    const d2=CL.status('L',3,'doing');const st2=CL.step('L',3);
    const dd=doneStep('L',3);CL.fold('L:3',true,{getAttribute:()=>'done'});await sleep(40);
    const card=body().querySelector('[data-cool-step="L:3"]');
    return {b,st:[st.status,st.blockedWhy],red0,d,td:/Preceding work accepted/.test(td),dn,d2,st2:st2.status,dd,red1:!!body().querySelector('[data-cool-blocked="L:3"]'),was:/was blocked: wall frame not finished by Myxl/.test(card.textContent)};
  `),
  expect:{b:true,st:['blocked','wall frame not finished by Myxl'],red0:true,d:false,td:true,dn:false,d2:true,st2:'doing',dd:true,red1:false,was:true} },

{ name:'❄ Requests follow the outstanding quantity: allocation blank → only pads, pumps and the L-capping are short (no BOX 2 line, no Myxl line); ➕ Request all (confirmed) raises 1 request for 4 pcs (the L-capping) and lists the pads and pumps as "Not raised yet" (choose the pad height and model / the pump voltage); ➕ pads → refused "Choose the pad height and model", ➕ pump → refused "pump voltage", ➕ frame corner → refused "never bought here"; lost 2 on Top Bracket → ➕ raises 2 (the allocation is still blank); lost 7 → ➕ raises the difference 5 "additional to IR…", KPI "3 requests open"; a third press → refused; lost back to 0 → "7 more than needed", ✖ Withdraw sets both to withdrawn (history kept, updatedAt stamped) and every computer\'s merge keeps "withdrawn" in both directions; they leave Purchasing\'s From Inventory inbox; a withdrawn request is never a PR (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.screen('materials');await sleep(60);
    const asks=[];window.confirm=m=>{asks.push(String(m));return true;};
    const m0=CL.materials();const short0=m0.filter(m=>m.toRequest>0).map(m=>m.key).sort();
    const n0=CL.requestAll();const ir0=IR().filter(x=>x.linkType==='prj15_cool');
    const q0=ir0.reduce((a,x)=>a+x.qty,0);
    const rp=CL.request('pad');const tp=last();const ru=CL.request('pump');const tu=last();const rf=CL.request('frame_corner');const tf=last();
    CL.setLost('top_bracket',2,'box open');const r1=CL.request('top_bracket');
    CL.setLost('top_bracket',7,'3 more broke');await sleep(30);
    const tb2=CL.materials().find(m=>m.key==='top_bracket');const btn2=!!body().querySelector('[data-cool-req="top_bracket"]');
    const r2=CL.request('top_bracket');const tb3=CL.materials().find(m=>m.key==='top_bracket');
    const r3=CL.request('top_bracket');const t3=last();
    await sleep(30);const head1=(body().querySelector('[data-cool-head]')||{}).textContent||'';
    CL.setLost('top_bracket',0,null);await sleep(30);const tb4=CL.materials().find(m=>m.key==='top_bracket');
    const wbtn=!!body().querySelector('[data-cool-withdraw="top_bracket"]'),rbtn=!!body().querySelector('[data-cool-req="top_bracket"]');
    const other=localStorage.getItem('hydroPro_inv_requests_v1');
    const w=CL.withdraw('top_bracket');const tb5=CL.materials().find(m=>m.key==='top_bracket');
    const mine=IR().filter(x=>x.linkType==='prj15_cool'&&x.linkRef==='top_bracket');
    const local=localStorage.getItem('hydroPro_inv_requests_v1');
    const st=raw=>JSON.parse(raw).filter(x=>x.linkRef==='top_bracket').map(x=>x.status);
    const m1=window.__hnxMergeGeneric('hydroPro_inv_requests_v1',other,local)||other,m2=window.__hnxMergeGeneric('hydroPro_inv_requests_v1',local,other)||local;
    const inbox=IR().filter(x=>x.type==='purchase'&&!x.prId&&/submitted|approved|await|issued/i.test(x.status));
    const w2=CL.withdraw('top_bracket');
    return {short0,asked:asks.length,ask:/^Raise 1 purchase request for 4 pcs\\?/.test(asks[0]||'')&&/Not raised yet:/.test(asks[0]||'')&&/pad height and model/.test(asks[0]||'')&&/pump voltage/.test(asks[0]||''),n0,q0,first:ir0.map(x=>x.linkRef),
      rp:rp===null,tp:/pad height and model/.test(tp),ru:ru===null,tu:/pump voltage/.test(tu),rf:rf===null,tf:/never bought here/.test(tf),
      r1:r1&&r1.qty,tb2:[tb2.toRequest,tb2.requested,tb2.pending,tb2.openReqs.length],btn2,r2:[r2&&r2.qty,/additional to IR/.test(r2&&r2.itemDesc||'')],tb3:[tb3.toRequest,tb3.requested,tb3.pending],r3:r3===null,t3:/already raised/.test(t3),
      head1:/3 requests open/.test(head1),tb4:[tb4.toRequest,tb4.requested,tb4.over],wbtn,rbtn,w,tb5:[tb5.openReqs.length,tb5.over,tb5.reqNo],mine:mine.map(x=>x.status),stamped:mine.every(x=>typeof x.updatedAt==='number'&&!!x.withdrawnAt&&!!x.withdrawnBy),hist:mine.every(x=>/withdrawn from Project 15/.test(JSON.stringify(x.history))),
      merge:[st(m1),st(m2)],inboxTb:inbox.filter(x=>x.linkRef==='top_bracket').length,inboxN:inbox.filter(x=>x.linkType==='prj15_cool').length,w2};
  `),
  expect:{short0:['l_capping','pad','pump'],asked:1,ask:true,n0:1,q0:4,first:['l_capping'],rp:true,tp:true,ru:true,tu:true,rf:true,tf:true,
    r1:2,tb2:[7,2,5,1],btn2:true,r2:[5,true],tb3:[7,7,0],r3:true,t3:true,head1:true,tb4:[0,7,7],wbtn:true,rbtn:false,w:2,tb5:[0,0,''],mine:['withdrawn','withdrawn'],stamped:true,hist:true,
    merge:[['withdrawn','withdrawn'],['withdrawn','withdrawn']],inboxTb:0,inboxN:1,w2:0} },

{ name:'🔁 Cloud merge keeps both sides: a cleared Needed (40 → blank) stays cleared when merged with the copy that still holds 40 (both directions, Needed back to the computed 30); the same with the clock held still (both writes in one millisecond): the clear is stamped 1 ms after the 40 and stays cleared both ways; computer A adds a photo to step 4 Left, sets Left to 14,400 mm and ticks checkpoint 0 of step 0, computer B (same start) adds its photo, renames Right and ticks checkpoint 1 of step 0 → after the merge, in both directions: 2 photos, Left 14,400, Right renamed, both ticks (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    CL.setNeed('top_bracket',40,'x');const cloud=localStorage.getItem(SK);await sleep(5);/* a later edit */CL.setNeed('top_bracket','','');const local=localStorage.getItem(SK);
    const nd=raw=>{const r=JSON.parse(raw).find(x=>x.id==='need:top_bracket');return r?r.qty:'none';};
    /* the same millisecond on one computer (clock held still): the stamp only moves forward, so the clear still outranks the 40 */
    const NOW=Date.now,T0=NOW();Date.now=()=>T0;
    CL.setNeed('pad_support',40,'x');const c2=localStorage.getItem(SK);CL.setNeed('pad_support','','');const l2=localStorage.getItem(SK);
    Date.now=NOW;
    const ps=(raw,f)=>{const r=JSON.parse(raw).find(x=>x.id==='need:pad_support');return r?r[f]:'none';};
    const ms=[ps(window.__hnxMergeGeneric(SK,l2,c2)||l2,'qty'),ps(window.__hnxMergeGeneric(SK,c2,l2)||c2,'qty'),ps(l2,'updatedAt')-ps(c2,'updatedAt'),ps(c2,'updatedAt')===T0];
    const na=window.__hnxMergeGeneric(SK,local,cloud)||local,nb=window.__hnxMergeGeneric(SK,cloud,local)||cloud;
    localStorage.setItem(SK,na);await sleep(0);const neededA=CL.materials().find(m=>m.key==='top_bracket').needed;
    CL.setParam('padH',1530);await sleep(5);const base=localStorage.getItem(SK);
    const PX='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    CL.addPhoto('L',4,{url:PX,caption:'A brackets'});await sleep(5);CL.setRun('L','lengthMm',14400);await sleep(5);CL.check('L',0,0,true);await sleep(5);
    const rawA=localStorage.getItem(SK);
    await sleep(30);localStorage.setItem(SK,base);await sleep(5);
    CL.addPhoto('L',4,{url:PX,caption:'B brackets'});await sleep(5);CL.setRun('R','name','Right of door (pump side)');await sleep(5);CL.check('L',0,1,true);await sleep(5);
    const rawB=localStorage.getItem(SK);
    const look=async raw=>{localStorage.setItem(SK,raw);await sleep(0);const p=CL.params();return {photos:CL.step('L',4).photos.map(x=>x.caption).sort(),L:p.runs[0].lengthMm,R:p.runs[1].name,ticks:[0,1,2].map(i=>CL.checks('L',0).length>i&&!!JSON.parse(raw).find(x=>x.id==='step:L:0'&&x['ck'+i]&&x['ck'+i].on))};};
    const onA=await look(window.__hnxMergeGeneric(SK,rawA,rawB)),onB=await look(window.__hnxMergeGeneric(SK,rawB,rawA));
    return {need:[nd(na),nd(nb)],ms,neededA,onA,onB};
  `),
  expect:{need:[null,null],ms:[null,null,1,true],neededA:30,onA:{photos:['A brackets','B brackets'],L:14400,R:'Right of door (pump side)',ticks:[true,true,false]},onB:{photos:['A brackets','B brackets'],L:14400,R:'Right of door (pump side)',ticks:[true,true,false]}} },

{ name:'📘 Manual fixes: the drop — step 4 shows "0.5 %" = 72.5 mm AND "2 cm end to end", says "confirm the drop with KEHE", its drop checkpoint is refused while the confirmed drop is blank and reads "Drop 20 mm" once 20 is set; the 15 mm is "below the opening sill" (a step 4 checkpoint); step 11 is "Not applicable" on one tier and required with 2 tiers (step 12 waits for it, pads needed 100); the p.3 tools have a chalk line, no utility knife; step 9 closes ONE end (door side), step 10 adds "Second end cover (20) + pad cover (21)" and "L-capping (22) cut and fixed at both ends"; gutter couplings 5 per run (end mount) → 6 (centre mount); step 14 / 12 / checklist: the timer "may be installed", the bleed "started at ≈ 180 L/h … adjust as necessary" (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.setParam('padH',1530);await sleep(40);
    const t=s=>(body().querySelector(s)||{}).textContent||'';
    const s4=t('[data-cool-step="L:4"]');
    const c4=CL.checks('L',4);
    CL.setGate('L','predecessor',true,'ok');for(let n=0;n<=3;n++)doneStep('L',n);
    const d0=CL.check('L',4,3,true);const td=last();
    CL.setParam('dropMm',20);const c4b=CL.checks('L',4);const d1=CL.check('L',4,3,true);
    const s11=t('[data-cool-step="L:11"]'),na=CL.step('L',11).na;
    const gc0=CL.materials().find(m=>m.key==='gutter_coupling').byRun.L;CL.setRun('L','floatMount','centre');const gc1=CL.materials().find(m=>m.key==='gutter_coupling').byRun.L;
    for(let n=4;n<=10;n++)doneStep('L',n);
    const s12a=CL.status('L',12,'doing');
    CL.setParam('padTiers',2);const s12b=CL.status('L',12,'doing');const t12=last();const pads2=CL.materials().find(m=>m.key==='pad').needed;const na2=CL.step('L',11).na;
    const T=HNX_PRJ15_COOL.tools;
    return {s4:[/0\\.5 %/.test(s4),/72\\.5 mm/.test(s4),/2 cm drop end to end/.test(s4),/confirm the drop with KEHE/.test(s4),/at least 15 mm below the bottom edge \\(sill\\) of the wall opening/.test(s4)],c4:[c4[2],c4[3]],d0,td:/confirmed with KEHE/.test(td),c4b:c4b[3],d1,
      s11:/Not applicable/.test(s11),na,s12a,s12b,t12:/Step 11 must be Done first/.test(t12),pads2,na2,
      tools:[T.length,T.includes('chalk line'),T.includes('utility knife')],c9:CL.checks('L',9),c10:CL.checks('L',10).slice(5),gc:[gc0,gc1],
      c14:CL.checks('L',14).slice(0,2),c12:CL.checks('L',12)[3],rule4:HNX_PRJ15_COOL.checklist[3],timer:/may be installed/.test(HNX_PRJ15_COOL.timerRule)};
  `),
  expect:{s4:[true,true,true,true,true],c4:['Top of each bracket ≥ 15 mm below the opening sill','Drop (as confirmed with KEHE) measured end to end towards the pump (corner side end — the far end, at 14,500 mm)'],d0:false,td:true,c4b:'Drop 20 mm measured end to end towards the pump (corner side end — the far end, at 14,500 mm)',d1:true,
    s11:true,na:true,s12a:true,s12b:false,t12:true,pads2:100,na2:false,tools:[15,true,false],c9:['End cover (20) + pad cover (21) seated at the door side end (the end the pads are pushed against)'],
    c10:['Second end cover (20) + pad cover (21) pushed tight against the pads','L-capping (22) cut and fixed at both ends'],gc:[5,6],
    c14:['Pads dry out completely each night (a 24 h timer may be installed: off 22:00, on after 09:00 — or the climate control)','Bleed started at ≈ 180 L/h, adjust as necessary'],c12:'Bleed started at ≈ 180 L/h (1 US gal/h per linear foot) — adjust as necessary',
    rule4:'Bleed water continuously — start with ≈ 1 US gallon/hour per linear foot of pad and adjust as necessary.',timer:true} },

{ name:'📐 Zero point and pad count: both runs measure from the door side (0 mm) with the pump at the corner side — step 4 "from the door side end", step 6 "the cut piece at the corner side end", step 10 "the trimmed pad goes at the corner side end"; Left set to 0 mm = corner side → "from the corner side end" and the pump end becomes "corner side end — the 0 mm end"; "or number of pads" 24 keeps the measured 14,500 mm (24 pads chosen = 14,400) and the trim box is disabled with "no trim needed — 24 × 600 = 14,400 mm" (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.run('L');CL.screen('steps');await sleep(40);
    const t=s=>(body().querySelector(s)||{}).textContent||'';
    const p0=CL.params();
    const s4=t('[data-cool-step="L:4"]'),s6=t('[data-cool-step="L:6"]'),s10=t('[data-cool-step="L:10"]');
    CL.setRun('L','zero','corner');await sleep(40);const s4b=t('[data-cool-step="L:4"]');const c4=CL.checks('L',4);
    CL.setRun('L','pads',24);CL.screen('params');await sleep(40);
    const p1=CL.params();const trim=body().querySelector('[data-cool-run-params="L"] select[data-cool-param="trim"]');
    return {zero:p0.runs.map(r=>r.zero),side:p0.pumpSide,s4:/from the door side end/.test(s4),s6:/the cut piece at the corner side end/.test(s6),s10:/the trimmed pad goes at the corner side end/.test(s10),
      s4b:/Measure every position from the corner side end/.test(s4b),c4:/corner side end — the 0 mm end/.test(c4[3]),
      pads:[p1.runs[0].lengthMm,p1.runs[0].pads,CL.calc(p1).runs[0].S],trim:[trim.disabled,trim.options[0].textContent]};
  `),
  expect:{zero:['door','door'],side:'corner',s4:true,s6:true,s10:true,s4b:true,c4:true,pads:[14500,24,14400],trim:[true,'no trim needed — 24 × 600 = 14,400 mm']} },

{ name:'✔ A tick remembers its figure: Left steps 0–4 Done (pad 1,530, drop 20); Left wall 14,500 → 12,000 asks first (confirm names "step 4") and, confirmed, step 4 stays Done but "needs re-check": the count tick no longer counts ("Count = 12", was "Count = 15"), the card shows "⚠ figures changed since this was ticked (was: Count = 15)"; refusing the question leaves 14,500 and the ticks untouched (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.run('L');CL.screen('steps');
    CL.setParam('padH',1530);CL.setParam('dropMm',20);CL.setGate('L','predecessor',true,'ok');
    for(let n=0;n<=4;n++)doneStep('L',n);
    const asks=[];window.confirm=m=>{asks.push(String(m));return false;};
    const no=CL.setRun('L','lengthMm',12000);const keep=[CL.params().runs[0].lengthMm,CL.ticked('L',4)];
    window.confirm=m=>{asks.push(String(m));return true;};
    const yes=CL.setRun('L','lengthMm',12000);await sleep(60);
    const st=CL.stale('L',4);const card=body().querySelector('[data-cool-step="L:4"]');
    return {no,keep,asked:asks.length,names:/step 4/.test(asks[0]||''),yes,status:CL.step('L',4).status,ticked:CL.ticked('L',4),stale:st.map(s=>[s.now,s.was]).slice(0,1),
      recheck:card.getAttribute('data-cool-recheck'),warn:/figures changed since this was ticked \\(was: Count = 15\\)/.test(card.textContent),open:card.open};
  `),
  expect:{no:false,keep:[14500,true],asked:2,names:true,yes:true,status:'done',ticked:false,stale:[['Count = 12','Count = 15']],recheck:'1',warn:true,open:true} },

{ name:'⏳ No signal at the wall (cloud token, first download not finished, the cooling store empty at boot): engineer "rea" types a note and leaves the box → the text stays in the box, nothing is stored yet, a blue banner says 1 change waits; a photo waits too (2); once the download finishes both save by themselves (note stored, 1 photo) and the banner goes; with the store already on this computer at boot a write saves at once (v22.76)',
  requires:REQ,
  drive:async pg=>{
    const w=ms=>pg.waitForTimeout(ms);
    /* a click that a passing toast covers waits up to 8 s, then focuses / clicks the element itself (a loaded CI machine) */
    const tap=async s=>{try{await pg.click(s,{timeout:8000});}catch(e){await pg.evaluate(x=>document.querySelector(x).scrollIntoView({block:'center'}),s);await pg.click(s,{force:true,timeout:8000});}};
    await pg.evaluate(()=>{try{switchView('prj_1516');}catch(e){}window.getCurrentUser=()=>({username:'rea',fullname:'Rea',role:'staff',position:'Project Engineer',department:'Projects',active:true});
      localStorage.setItem('hnx_cloud_token','test-token');window.__hnxPulledOk=false;window.__hnxPresentAtBoot={};
      PRJ.pick('15');PRJ.tab('15','cool');PRJ.cool.run('L');PRJ.cool.screen('steps');});
    await w(500);
    const NOTES='[data-cool-step="L:0"] textarea';
    await tap(NOTES);await pg.keyboard.type('BOX 2 carton 7 crushed',{delay:30});await tap('[data-cool-head] .prj-mut');await w(1600);
    const held=await pg.evaluate(s=>({box:document.querySelector(s).value,stored:PRJ.cool.step('L',0).notes,pend:PRJ.cool.pending().length,banner:(()=>{const b=document.querySelector('[data-cool-pending]');return !!b&&b.style.display!=='none'&&/1 change wait/.test(b.textContent);})()}),NOTES);
    const ph=await pg.evaluate(()=>{const r=PRJ.cool.addPhoto('L',0,{url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',caption:'carton 7'});return [r,PRJ.cool.pending().length,PRJ.cool.step('L',0).photos.length];});
    await pg.evaluate(()=>{window.__hnxPulledOk=true;});try{await pg.waitForFunction(()=>PRJ.cool.pending().length===0,null,{timeout:12000});}catch(e){}await w(400);
    const saved=await pg.evaluate(()=>({notes:PRJ.cool.step('L',0).notes,photos:PRJ.cool.step('L',0).photos.length,pend:PRJ.cool.pending().length,banner:(document.querySelector('[data-cool-pending]')||{style:{}}).style.display}));
    const atBoot=await pg.evaluate(()=>{window.__hnxPulledOk=false;window.__hnxPresentAtBoot={hydroPro_prj15_sub_cooling_v1:1};const r=PRJ.cool.setStep('L',1,'notes','kept at once');const v=PRJ.cool.step('L',1).notes;localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=true;return [r,v];});
    return {held,ph,saved,atBoot};
  },
  expect:{'drive.held':{box:'BOX 2 carton 7 crushed',stored:'',pend:1,banner:true},'drive.ph':[false,2,0],'drive.saved':{notes:'BOX 2 carton 7 crushed',photos:1,pend:0,banner:'none'},'drive.atBoot':[true,'kept at once']} },

{ name:'🛠 Maintenance occurrences: after the hand-over the strainer task opens in the Maintenance form with priority NEED selected (and a legacy "medium" task keeps "medium" selected, not URGENT); Save as Done spawns the next weekly occurrence that carries assignees[0].name "Jomel IT", the Chart A description, sourceModule prj15_cooling, category pm and NO autoKey; the sub-tab row shows the child "not_started · <next date>" (2 occurrences, 1 done) and the Excel Maintenance sheet exports the child id (v22.76)',
  requires:REQ,
  seed:()=>{localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'jomel'}));const us=JSON.parse(localStorage.getItem('hydroPro_users')||'[]');us.push({username:'jomel',fullname:'Jomel IT',role:'staff',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(us));},
  run:run(`
    await openCool();
    const h=CL.handover();
    const root=MT().find(t=>t.autoKey==='prj15_cool_w_strainer');
    openMaintTask(root.id);await sleep(120);
    const sel=document.getElementById('maintTaskPriority');const pr0=sel&&sel.value;
    const legacy={id:'T_legacy_med',title:'legacy',location:'GH15',team:'x',priority:'medium',status:'not_started',scheduledDate:today,dateSubmit:today,durationDays:1,materials:[],toolsList:[],tools:'',remarks:'',photos:[],gantt:[],createdAt:Date.now()};
    const all=loadMaintTasks();all.push(legacy);saveMaintTasks(all);
    openMaintTask('T_legacy_med');await sleep(120);const selL=document.getElementById('maintTaskPriority');const prL=selL&&selL.value;
    openMaintTask(root.id);await sleep(120);
    document.getElementById('maintTaskStatus').value='done';
    maintSaveTask();await sleep(150);
    const kids=loadMaintTasks().filter(t=>t.parentTaskId===root.id);const k=kids[0]||{};
    const st=CL.maintState().find(x=>x.key==='w_strainer');
    CL.screen('maint');await sleep(80);const row=(body().querySelector('[data-cool-chart="w_strainer"]')||{}).textContent||'';
    const cap=stubX();CL.excel();await sleep(200);const mn=(cap.S.find(s=>s.name==='Maintenance')||{}).rows||[];const ex=mn.find(r=>r[0]==='w_strainer')||[];
    return {created:h.created.length,pr0,prL,kids:kids.length,k:[k.assignees&&k.assignees[0]&&k.assignees[0].name,/Chart A/.test(k.description||''),k.sourceModule,k.category,k.autoKey===undefined,k.status,k.scheduledDate>today,k.priority],
      rootDone:loadMaintTasks().find(t=>t.id===root.id).status,st:[st.taskId===k.id,st.rootId===root.id,st.status,st.scheduled===k.scheduledDate,st.occurrences,st.done],row:/not_started/.test(row)&&/2 occurrences, 1 done/.test(row),ex:[ex[3]===k.id,ex[5],ex[6]]};
  `),
  expect:{created:11,pr0:'need',prL:'medium',kids:1,k:['Jomel IT',true,'prj15_cooling','pm',true,'not_started',true,'need'],rootDone:'done',st:[true,true,'not_started',true,2,1],row:true,ex:[true,'not_started',2]} },

{ name:'⌨ Typing never loses text or focus (engineer "rea", real keyboard, Projects screen open): Notes "pads arr" + 1.4 s pause + "ived wet" → stored "pads arrived wet" and the box still has the focus; WHO "Rea San" + pause + "tos" → "Rea Santos"; Lost / short "1" + pause + "2" → 12, Tab lands in the note box, "broken" stored; one checkbox click → one history line, not two (v22.76)',
  requires:REQ,
  drive:async pg=>{
    const w=ms=>pg.waitForTimeout(ms);
    /* a click that a passing toast covers waits up to 8 s, then focuses / clicks the element itself (a loaded CI machine) */
    const tap=async s=>{try{await pg.click(s,{timeout:8000});}catch(e){await pg.evaluate(x=>document.querySelector(x).scrollIntoView({block:'center'}),s);await pg.click(s,{force:true,timeout:8000});}};
    await pg.evaluate(()=>{try{switchView('prj_1516');}catch(e){}window.getCurrentUser=()=>({username:'rea',fullname:'Rea',role:'staff',position:'Project Engineer',department:'Projects',active:true});PRJ.pick('15');PRJ.tab('15','cool');PRJ.cool.run('L');PRJ.cool.screen('steps');});
    await w(400);
    const NOTES='[data-cool-step="L:0"] textarea',WHO="[data-cool-step=\"L:0\"] input[onchange*=\"'who'\"]";
    await tap(NOTES);await pg.keyboard.type('pads arr',{delay:60});await w(1400);await pg.keyboard.type('ived wet',{delay:60});await w(1400);
    const notes=await pg.evaluate(s=>({v:PRJ.cool.step('L',0).notes,f:document.activeElement===document.querySelector(s)}),NOTES);
    await tap(WHO);await pg.keyboard.type('Rea San',{delay:60});await w(1400);await pg.keyboard.type('tos',{delay:60});await w(1400);
    const who=await pg.evaluate(s=>({v:PRJ.cool.step('L',0).who,f:document.activeElement===document.querySelector(s)}),WHO);
    await tap('[data-cool-check="L:0:0"]');await w(1700);
    const hist=await pg.evaluate(()=>PRJ.cool.step('L',0).history.filter(h=>/^✓ /.test(h.ev)).length);
    await pg.evaluate(()=>PRJ.cool.screen('materials'));await w(400);
    await tap('[data-cool-lost="top_bracket"]');await pg.keyboard.type('1',{delay:60});await w(1400);await pg.keyboard.type('2',{delay:60});await w(1400);
    const lost=await pg.evaluate(()=>({v:PRJ.cool.materials().find(m=>m.key==='top_bracket').lost,f:document.activeElement===document.querySelector('[data-cool-lost="top_bracket"]')}));
    await pg.keyboard.press('Tab');await w(300);
    const tabbed=await pg.evaluate(()=>document.activeElement===document.querySelector('[data-cool-lostnote="top_bracket"]'));
    await pg.keyboard.type('broken',{delay:60});await w(1400);
    const note=await pg.evaluate(()=>PRJ.cool.materials().find(m=>m.key==='top_bracket').lostNote);
    return {notes,who,hist,lost,tabbed,note};
  },
  expect:{'drive.notes':{v:'pads arrived wet',f:true},'drive.who':{v:'Rea Santos',f:true},'drive.hist':1,'drive.lost':{v:12,f:true},'drive.tabbed':true,'drive.note':'broken'} },

{ name:'💻 Laptop 1366 × 768 (app text 115 %): the Materials table keeps Lost / short, To request, ➕ and Delivery ✓ inside its box (the Top Bracket lost box, the ➕ cell and the Box 2 tick end left of the box\'s right edge), the box (70 vh) is shorter than the window and scrolls itself, and its header row stays on top after scrolling 2,000 px (v22.76)',
  requires:REQ,
  viewport:{width:1366,height:768},
  run:run(`
    try{switchView('prj_1516');}catch(e){}
    await openCool();CL.screen('materials');await sleep(400);
    const wr=body().querySelector('.cool-matw'),R=wr.getBoundingClientRect();
    const inside=e=>{const r=e.getBoundingClientRect();return r.left>=R.left&&r.right<=R.right;};
    const row=body().querySelector('[data-cool-part="pad"]');
    const lost=body().querySelector('[data-cool-lost="top_bracket"]'),reqCell=row.querySelector('td[data-label="Request"]'),dlv=row.querySelector('td[data-label="Delivery ✓"]'),tr=row.querySelector('td[data-label="To request"]');
    const cs=getComputedStyle(wr);
    wr.scrollTop=2000;await sleep(80);const th=wr.querySelector('thead th');const stuck=Math.abs(th.getBoundingClientRect().top-wr.getBoundingClientRect().top)<2;
    return {lost:inside(lost),req:inside(reqCell),dlv:inside(dlv),tr:inside(tr),tall:R.height<innerHeight,scrolls:/auto|scroll/.test(cs.overflowY)&&wr.scrollHeight>wr.clientHeight,stuck,
      order:[...wr.querySelectorAll('thead th')].map(t=>t.textContent.trim()).slice(2,7)};
  `),
  expect:{lost:true,req:true,dlv:true,tr:true,tall:true,scrolls:true,stuck:true,order:['Needed','Lost / short','To request','Request','Delivery ✓']} },

{ name:'📱 Phone 400 px: the Materials table folds — the Top Bracket row\'s Needed value, Lost / short box and ➕ cell all end inside the 400 px window (no sideways drag), the table is no wider than its card; Chart A "Cadence" / "Maintenance task" cells and the "Steps — both runs" cells likewise; the KPI tiles sit two to a row; after steps 0 and 1 are Done they fold to one line, ▶ Next points at step 2 and the safety block folds; the contractor-labour tile never lands in the ❄ header but still shows on the Projects overview (v22.76)',
  requires:REQ,
  viewport:{width:400,height:800},
  run:run(`
    try{switchView('prj_1516');}catch(e){}
    await openCool();CL.screen('materials');await sleep(3200);
    const W=window.innerWidth;const R=e=>e?Math.round(e.getBoundingClientRect().right):-1;
    const row=body().querySelector('[data-cool-part="top_bracket"]');
    const needed=row.querySelector('[data-cool-needed]'),lost=row.querySelector('[data-cool-lost]'),avail=row.querySelector('[data-cool-avail]');
    const tbl=body().querySelector('[data-cool-materials] table');
    const lbl=(row.querySelector('td[data-label="Needed"]')||{}).getAttribute?row.querySelector('td[data-label="Needed"]').getAttribute('data-label'):'';
    const mat={needed:R(needed)<=W,lost:R(lost)<=W,avail:R(avail)<=W,tbl:Math.round(tbl.getBoundingClientRect().width)<=W,lbl,wide:getComputedStyle(tbl).minWidth};
    CL.screen('maint');await sleep(3200);const ch=body().querySelector('[data-cool-chart="w_strainer"]');const cells=[...ch.children];
    const maint={cad:R(cells[0])<=W,task:R(cells[2])<=W,txt:/weekly/.test(cells[0].textContent)};
    CL.run('all');CL.screen('steps');await sleep(3200);const tr=body().querySelector('[data-cool-steps-all] tbody tr');const tds=[...tr.children];
    const steps={last:R(tds[tds.length-1])<=W,n:tds.length};
    CL.run('L');await sleep(3600);
    const kp=body().querySelector('[data-cool-head] .cool-kpis');const kpis=getComputedStyle(kp).gridTemplateColumns.split(' ').length;
    const head=!!body().querySelector('[data-cool-head] .hnx-contr-kpi');
    doneStep('L',0);doneStep('L',1);await sleep(100);
    const c0=body().querySelector('[data-cool-step="L:0"]'),c2=body().querySelector('[data-cool-step="L:2"]');
    const fold={c0:c0.open,c0h:Math.round(c0.getBoundingClientRect().height)<160,c2:c2.open,next:(body().querySelector('[data-cool-next]')||{getAttribute:()=>''}).getAttribute('data-cool-next'),safety:body().querySelector('[data-cool-safety]').open};
    try{switchView('prj_1516');}catch(e){}PRJ.tab('15','over');await sleep(3600);const over=!!body().querySelector('[data-cool-over] .hnx-contr-kpi');
    /* the tile is injected every 3 s and any redraw of the overview removes it until the next tick — wait for it (up to 12 s) */
    let anywhere=false;for(let i=0;i<48&&!anywhere;i++){anywhere=!!document.querySelector('#view-prj_1516 .hnx-contr-kpi');if(!anywhere)await sleep(250);}
    return {W,mat,maint,steps,kpis,head,fold,over,anywhere};
  `),
  expect:{W:400,mat:{needed:true,lost:true,avail:true,tbl:true,lbl:'Needed',wide:'0px'},maint:{cad:true,task:true,txt:true},steps:{last:true,n:4},kpis:2,head:false,fold:{c0:false,c0h:true,c2:true,next:'L:2',safety:false},over:false,anywhere:true} },

{ name:'📘 Manual words: safety block starts with "Read and understand the KEHE manual" (5 lines) and step 1 asks "Crew has read the manual (p.3)"; step 0 says "do not open a box until it is needed"; step 10 shakes and trims "pad AND its distributor" with the checkpoint "Distributor strip on every pad"; step 3 prints "L = 14,400 mm" and "A = 1,730 mm" with the pad at 1,830; the ❄ header has no contractor tile at 1600 px (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.setParam('padH',1830);await sleep(60);
    const t=(s)=>(body().querySelector(s)||{}).textContent||'';
    const safe=t('[data-cool-safety]');const s0=t('[data-cool-step="L:0"]'),s1=t('[data-cool-step="L:1"]'),s3=t('[data-cool-step="L:3"]'),s10=t('[data-cool-step="L:10"]');
    const c1=CL.checks('L',1),c10=CL.checks('L',10);
    await sleep(3500);const head=!!body().querySelector('[data-cool-head] .hnx-contr-kpi');
    return {safeN:HNX_PRJ15_COOL.safety.length,safe:/^[^•]*• Read and understand the KEHE manual/.test(safe.replace(/\\s+/g,' ')),c1:c1[0],s0:/do not open a box until it is needed; keep unopened boxes in a closed, safe, dry place/.test(s0),
      s10:[/Shake every pad and its distributor/.test(s10),/trim the last pad AND its distributor with a saw/.test(s10),c10.includes('Distributor strip on every pad, last one trimmed to match')],
      s3:[/L = 14,400 mm/.test(s3),/A = 1,730 mm/.test(s3),/Opening measured L 14,400 mm × A 1,730 mm/.test(s3)],head};
  `),
  expect:{safeN:5,safe:true,c1:'Crew has read the manual (p.3)',s0:true,s10:[true,true,true],s3:[true,true,true],head:false} }
];
