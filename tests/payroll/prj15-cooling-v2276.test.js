/* v22.76: Project 15 → ❄ PVC Cooling System (KEHE) — the GH15 cooling-wall sub-project built from the KEHE 2023 assembly
   manual (Eyal, 13 Oct 2026: "need to create this sub project"). Two runs of 14.5 m (left / right of the GH15 door), the
   manual's figures computed from the parameters, 16 ordered steps with gates, the BOX 2 set list against the Project 15
   register, lost / short → one purchase request per part, Chart A hand-off to Maintenance once, the owner's reference
   media linked (never embedded), nothing written on render. Names, specs and quantities only — no prices anywhere. */
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
`;
const run=body=>new Function('return (async()=>{'+H+body+'})()');
module.exports=[
{ name:'❄ calc: 1,830 mm × 10 pads → system 6,000, opening 5,900 × 1,730, G 2,050 (manual p.5 example; its "+250" formula 2,080 shown beside), 2 segments (no cut), 6 support + 6 top brackets at 500/1500/2500 per segment, pad supports 12, screws 10, movable couplers 2; 1,530 → 1,430 / 1,750 (v22.76)',
  requires:REQ,
  run:run(`
    const a=CL.calc({padH:1830,runs:[{id:'A',lengthMm:6000}]}),r=a.runs[0];
    const b=CL.calc({padH:1530,runs:[{id:'A',lengthMm:6000}]});
    return {S:r.S,A:r.A,H:r.H,G:r.G,Gf:r.Gformula,pieces:r.pieces,cut:r.cut,brackets:r.brackets,pos:r.pos,padSupports:r.padSupports,pads:r.pads,trimmed:r.trimmed,joints:r.joints,screws:r.screws,movable:r.movable,
      top:[a.H,a.G],b:[b.H,b.G,b.runs[0].G],runs:a.runs.length};
  `),
  expect:{S:6000,A:5900,H:1730,G:2050,Gf:2080,pieces:2,cut:0,brackets:6,pos:[500,1500,2500,3500,4500,5500],padSupports:12,pads:10,trimmed:false,joints:1,screws:10,movable:2,top:[1730,2050],b:[1430,1750,1750],runs:1} },

{ name:'❄ GH15 default: two runs 14,500 → per run 24 + 1 trimmed (100), 5 gutters (4 × 3,000 + 2,500 cut, off-cut 500), 15 support + 15 top brackets (… 13,500, 14,000), 29 pad supports, 4 joints, 25 screws, 5 movable couplers, bleed ≈ 180 L/h; wall 30/30 brackets, 10 gutters, 48 + 2 pads, 58 supports, 2 pumps, sets 2.42 per run / 4.83 wall → 5 cover it, 24 ordered; trimLast off → 24 = 14,400, cut 2,400, still 15 (… 13,900); pumpShared → 1 pump; pad height blank → H and G null (v22.76)',
  requires:REQ,
  run:run(`
    const d=CL.calc({}),L=d.runs[0],R=d.runs[1],T=d.total;
    const e=CL.calc({runs:[{id:'L',lengthMm:14500,trimLast:false},{id:'R',lengthMm:14500,trimLast:false}]}).runs[0];
    const f=CL.calc({pumpShared:true}).total;
    return {names:d.runs.map(r=>r.name),L:[L.pads,L.padsFull,L.trimmed,L.trimMm,L.S,L.pieces,L.nFull,L.cut,L.offcut,L.brackets,L.padSupports,L.joints,L.screws,L.movable,Math.round(L.bleedL)],
      posTail:L.pos.slice(-3),padsText:L.padsText,piecesText:L.piecesText,sameR:JSON.stringify(R.pos)===JSON.stringify(L.pos)&&R.pads===L.pads,
      wall:[T.brackets,T.pieces,T.pads,T.padsTrim,T.padsText,T.padSupports,T.pumps,T.floatGutters],sets:[Math.round(L.sets*100)/100,Math.round(T.sets*100)/100,T.setsCover,T.setsOrdered],
      noTrim:[e.pads,e.S,e.cut,e.brackets,e.pos.slice(-2)],shared:f.pumps,blank:[L.H,L.G,d.H,d.G],A:L.A};
  `),
  expect:{names:['Left of door','Right of door'],L:[25,24,true,100,14500,5,4,2500,500,15,29,4,25,5,180],posTail:[12500,13500,14000],padsText:'24 × 600 = 14,400 mm + 1 trimmed (100) = 14,500 mm',
    piecesText:'4 × 3,000 + 1 cut to 2,500 mm (off-cut 500)',sameR:true,wall:[30,10,50,2,'48 + 2 trimmed',58,2,2],sets:[2.42,4.83,5,24],noTrim:[24,14400,2400,15,[13500,13900]],shared:1,blank:[null,null,null,null],A:14400} },

{ name:'👀 Opening writes nothing: cool tab + all 6 sub-screens + both runs + totals + Excel (stubbed) leave every hydroPro_prj15_*/prj16_*/prj_* key byte-identical and no sub_cooling key; tab "cool" is right after "ship" (MX1012 still right after "ml"); P16 has no "cool"; overview shows [data-cool-over]; manual link + 16 step cards with manual page links; 6 gallery items with captions, 2 videos with posters, none autoloading; HEAD media/manuals pdf + 8 refs = 200 (v22.76)',
  requires:REQ,
  run:run(`
    await settle();await sleep(400);await settle();
    const before=KEYS();
    await openCool();
    const o15=tabOpts();
    const manual=body().querySelector('[data-cool-manual]');
    const steps=body().querySelectorAll('[data-cool-step]').length, pglinks=body().querySelectorAll('[data-cool-step] [data-cool-manual-page]').length;
    for(const s of ['params','materials','gates','gallery','maint','steps']){CL.screen(s);await sleep(30);for(const r of ['L','R','all']){CL.run(r);await sleep(20);}}
    CL.screen('gallery');await sleep(30);
    const refs=[...body().querySelectorAll('[data-cool-ref]')];
    const caps=refs.map(e=>(e.querySelector('[data-cool-cap]')||{}).textContent||'').filter(t=>t.length>20).length;
    const vids=[...body().querySelectorAll('[data-cool-ref] video')];
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
      sheets:(cap.S||[]).map(s=>s.name),heads:heads.length+':'+heads.filter(h=>h===200).length};
  `),
  expect:{same:true,diff:[],noKey:true,cool15:true,afterShip:'cool',afterMl:'ship',cool16:false,over:true,manual:true,embedded:true,steps:16,pglinks:16,gallery:6,caps:6,vids:2,posters:2,
    sheets:['Parameters','Steps','Materials','Gates','Maintenance'],heads:'9:9'} },

{ name:'❄ Steps in order: step 1 Done refused before step 0 (store unchanged, toast names "Preceding work accepted"); 0 Done needs its checkpoint ticked, then → 1 Doing ok; 3 Done refused while 2 open, then refused until the "Preceding work accepted" gate is ticked, then refused without its checkpoint; step 3 checkpoint cannot be ticked until the pad height is chosen; Left reaches 4 done while Right has 0 → progress L 25 %, R 0 %, combined 12.5 % (4/32); Blocked needs a reason; Done stamps done = today and who (v22.76)',
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
    return {r1,same,t1:/Step 0 must be Done first/.test(t1)&&/Preceding work accepted/.test(t1),d0a,t0:/checkpoint/.test(t0),d0,g1,r3a,t3a:/Step 2 must be Done first/.test(t3a),r3b,t3b:/Preceding work accepted/.test(t3b),r3c,t3c:/checkpoint/.test(t3c),c3a,tc:/pad height/.test(tc),d3,
      pg:[pg.runs.L.done,pg.runs.L.pct,pg.runs.R.done,pg.runs.R.pct,pg.done,pg.total,pg.pct],b0,tb:/why/i.test(tb),b1,st4:[st4.status,st4.blockedWhy],st3:[st3.status,st3.done===today,!!st3.who,st3.history.length>0]};
  `),
  expect:{r1:false,same:true,t1:true,d0a:false,t0:true,d0:true,g1:true,r3a:false,t3a:true,r3b:false,t3b:true,r3c:false,t3c:true,c3a:false,tc:true,d3:true,pg:[4,25,0,0,4,32,12.5],b0:false,tb:true,b1:true,st4:['blocked','waiting for the brackets'],st3:['done',true,true,true]} },

{ name:'❄ Materials: 42 rows, KEHE parts show NOT IN REGISTER (in register 0) while the "Cooling pad bracket" frame row matches C1 #97 = 40; Top Bracket per set 6, needed 15 + 15 = 30, available blank → "of 24 ordered"; sets allocated 5 → available 30, to-request 0; lost/short 2 (note) → to-request 2; ➕ creates ONE hydroPro_inv_requests_v1 record {type purchase, reqModule projects, linkType prj15_cool, linkRef top_bracket, qty 2, status submitted, needDept Maintenance, toLoc GH15} + a req: record; ➕ again → still 1; ➕ Request all → only parts still short (l-capping, pads, pump, corner connector), no second Top Bracket; all sit in Purchasing\'s From Inventory filter (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();CL.screen('materials');await sleep(50);
    const rows=CL.materials();const tb=rows.find(r=>r.key==='top_bracket'),fb=rows.find(r=>r.key==='frame_bracket');
    const inreg=(body().querySelector('[data-cool-inreg="top_bracket"]')||{}).textContent||'';
    const av=(body().querySelector('[data-cool-avail="top_bracket"]')||{}).textContent||'';
    const kehe0=rows.filter(r=>r.box==='B2'&&r.inRegister===0).length,keheN=rows.filter(r=>r.box==='B2').length;
    CL.setParam('setsAllocated',5);const tb2=CL.materials().find(r=>r.key==='top_bracket');
    CL.setLost('top_bracket',2,'one box arrived open');const tb3=CL.materials().find(r=>r.key==='top_bracket');
    const n0=IR().length;const r=CL.request('top_bracket');const n1=IR().length;
    const mine=IR().filter(x=>x.linkType==='prj15_cool'&&x.linkRef==='top_bracket');const m=mine[0]||{};
    const r2=CL.request('top_bracket');const t2=last();
    const before=CL.materials().filter(x=>x.toRequest>0&&!x.reqNo).map(x=>x.key).sort();
    const n=CL.requestAll();
    const all=IR().filter(x=>x.linkType==='prj15_cool');
    return {rows:rows.length,tb:[tb.ref,tb.perSet,tb.byRun.L,tb.byRun.R,tb.needed,tb.available,tb.inRegister,tb.toRequest],fb:[fb.inRegister,fb.needed,fb.toRequest,fb.regRows.map(x=>x.ct+'#'+x.no+'='+x.avail)],
      inreg:/NOT IN REGISTER/.test(inreg),av:/of 24 ordered/.test(av),kehe:kehe0+'/'+keheN,
      tb2:[tb2.available,tb2.toRequest],tb3:[tb3.lost,tb3.lostNote,tb3.toRequest],
      req:!!(r&&r.no),added:n1-n0,m:[m.type,m.reqModule,m.linkType,m.linkRef,m.qty,m.status,m.needDept,m.toLoc,m.priority,/KEHE ref 2/.test(m.itemName),/lost\\/short 2/.test(m.itemDesc)],
      reqRec:!!(cool()||[]).find(x=>x.id==='req:top_bracket'&&x.reqNo===r.no),reqNoShown:CL.materials().find(x=>x.key==='top_bracket').reqNo===r.no,
      r2:r2===null,t2:/already raised/.test(t2),still:mine.length,before,n,after:all.length,tbCount:all.filter(x=>x.linkRef==='top_bracket').length,
      inbox:all.filter(x=>x.type==='purchase'&&!x.prId&&/submitted/.test(x.status)).length,qtys:all.every(x=>x.qty>0),noPrice:!/₱|price/i.test(JSON.stringify(all))};
  `),
  expect:{rows:42,tb:['2',6,15,15,30,null,0,30],fb:[40,40,0,['Container 1#97=40']],inreg:true,av:true,kehe:'34/34',tb2:[30,0],tb3:[2,'one box arrived open',2],req:true,added:1,
    m:['purchase','projects','prj15_cool','top_bracket',2,'submitted','Maintenance','GH15','High',true,true],reqRec:true,reqNoShown:true,r2:true,t2:true,still:1,
    before:['frame_corner','l_capping','pad','pump'],n:4,after:5,tbCount:1,inbox:5,qtys:true,noPrice:true} },

{ name:'❄ Photos: addPhoto(L,4,{url,caption}) → step record photos 1 with id/at/by; second photo 2; the store photos survive a render and show as 2 thumbnails on the Left step cards; a photo without url is refused (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const a=CL.addPhoto('L',4,{url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',caption:'bracket at 500'});
    const p1=CL.step('L',4).photos,n1=p1.length;
    const b=CL.addPhoto('L',4,{url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',caption:'bracket at 1500'});
    const c=CL.addPhoto('L',4,{caption:'no url'});
    PRJ.tab('15','over');await sleep(50);await openCool();CL.run('L');CL.screen('steps');await sleep(80);
    const p2=CL.step('L',4).photos;
    return {a,b,c,n1,p1:[!!p1[0].id,!!p1[0].at,!!p1[0].by,p1[0].caption],n2:p2.length,thumbs:body().querySelectorAll('[data-cool-step="L:4"] [data-cool-photo]').length,other:CL.step('R',4).photos.length};
  `),
  expect:{a:true,b:true,c:false,n1:1,p1:[true,true,true,'bracket at 500'],n2:2,thumbs:2,other:0} },

{ name:'❄ Gates: six labels in the module\'s order; materials auto red with the short list; drawing green with the manual + an added R&D link; predecessor / manpower / equipment ticks by the engineer; inspections green "16 checkpoints, one per step"; step 3 Doing refused until predecessor is ticked; the materials gate is set by Nexi, not by hand (v22.76)',
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
    return {labels:g0.map(g=>g.label),ok0:g0.map(g=>g.ok),mat:/^short: /.test(g0[0].detail)&&/Top Bracket 0\\/15/.test(g0[0].detail),draw0:g0[1].detail,insp:g0[5].detail,link,hand,t1,t2,s3a,ta:/Preceding work accepted/.test(ta),t3,s3b,
      ok1:g1.map(g=>g.ok),draw1:/Build Sequence/.test(g1[1].detail),dom,R:CL.gates('R').map(g=>g.ok)};
  `),
  expect:{labels:['Required materials available','Drawing sheet linked','Preceding work accepted','Assigned manpower confirmed','Required equipment available','Inspection checkpoints defined'],ok0:[false,true,false,false,false,true],mat:true,draw0:'KEHE manual, 16 pages',insp:'16 checkpoints, one per step',
    link:true,hand:false,t1:true,t2:true,s3a:false,ta:true,t3:true,s3b:true,ok1:[false,true,true,true,true,true],draw1:true,dom:['materials:0','drawing:1','predecessor:1','manpower:1','equipment:1','inspections:1'],R:[false,true,false,false,false,true]} },

{ name:'❄ Hand-over: all 16 steps Done on Left → 10 Chart A + 1 quarterly = 11 maintenance tasks (weekly 4 / monthly 5 / yearly 1 / quarterly 1), assignee = maintenance lead (dept head "jomel" → "Jomel IT"), location GH15, sourceModule prj15_cooling, remarks carry the 8 rules, the night timer and "WARNING: DO NOT add chemicals"; Right run Done → 0 created, still 11; the maint record holds 11 ids; the Maintenance sub-tab shows 11 ✓ (v22.76)',
  requires:REQ,
  seed:()=>{localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({maintenance:'jomel'}));const us=JSON.parse(localStorage.getItem('hydroPro_users')||'[]');us.push({username:'jomel',fullname:'Jomel IT',role:'staff',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(us));},
  run:run(`
    await openCool();
    CL.setParam('padH',1530);CL.setParam('padModel','7060');
    const before=MT().length;
    for(const r of ['L','R'])CL.setGate(r,'predecessor',true,'frame ok');
    let okL=true;for(let n=0;n<16;n++)okL=doneStep('L',n)&&okL;
    const m1=MT();
    const cad=k=>m1.filter(t=>t.recurrence&&t.recurrence.type===k).length;
    const t0=m1[0]||{};
    let okR=true;for(let n=0;n<16;n++)okR=doneStep('R',n)&&okR;
    const m2=MT();
    const again=CL.handover();
    const rec=(cool()||[]).find(x=>x.id==='maint')||{};
    CL.screen('maint');await sleep(60);
    const ticks=[...body().querySelectorAll('[data-cool-chart]')].filter(e=>/✓/.test(e.textContent)).length;
    return {before,okL,n1:m1.length,cad:[cad('weekly'),cad('monthly'),cad('yearly'),cad('quarterly')],keys:m1.map(t=>t.autoKey).sort(),
      t0:[t0.assignees&&t0.assignees[0].name,t0.assignees&&t0.assignees[0].isLeader,t0.team,t0.location,t0.sourceModule,t0.status,t0.priority,t0.category,!!t0.scheduledDate,t0.durationDays],
      title:/^❄ GH15 cooling pads — /.test(t0.title),rem:[/WARNING: DO NOT add chemicals/.test(t0.remarks),/22:00/.test(t0.remarks),/8\\. /.test(t0.remarks)],desc:/Chart A/.test(t0.description)&&/Left of door \\+ Right of door/.test(t0.description),
      okR,n2:m2.length,again:[again.created.length,again.existing],ids:(rec.taskIds||[]).length,by:!!rec.by,pg:CL.progress().pct,ticks};
  `),
  expect:{before:0,okL:true,n1:11,cad:[4,5,1,1],keys:['prj15_cool_m_control','prj15_cool_m_float_valve','prj15_cool_m_pipe_holes','prj15_cool_m_pump_filter','prj15_cool_m_sump','prj15_cool_q_disinfect','prj15_cool_w_dry_streaks','prj15_cool_w_pad_face','prj15_cool_w_return_filter','prj15_cool_w_strainer','prj15_cool_y_trough'],
    t0:['Jomel IT',true,'⭐ Jomel IT','GH15','prj15_cooling','not_started','medium','pm',true,1],title:true,rem:[true,true,true],desc:true,okR:true,n2:11,again:[0,11],ids:11,by:true,pg:100,ticks:11} },

{ name:'🔒 Permissions: staff "guard" → canEdit false, setParam / status / setLost / setGate refused, request null, store unchanged, 0 enabled [data-cool-edit] controls and the 🔒 banner; "Rea" with position Project Engineer → canEdit true; an administrator names "guard" among the editors → guard edits; the editors field is administrators-only (v22.76)',
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
    asUser(REA);await openCool();
    const rea=[CL.canEdit(),!!body().querySelector('[data-cool-ro]'),body().querySelectorAll('[data-cool-edit]:not([disabled])').length>0,CL.setParam('editors','guard')];
    asMe();await openCool();
    const adm=[CL.canEdit(),CL.setParam('editors','guard, chen')];
    asUser(GUARD);await openCool();
    const g2=[CL.canEdit(),CL.setLost('top_bracket',1,'counted short'),!!body().querySelector('[data-cool-ro]')];
    asMe();
    return {g,same,en,ro,en2,en3,rea,adm,g2,editors:CL.params().editors};
  `),
  expect:{g:[false,false,false,false,false,null,false],same:true,en:0,ro:true,en2:0,en3:0,rea:[true,false,true,false],adm:[true,true],g2:[true,true,false],editors:['guard','chen']} },

{ name:'⬇ Excel: Prj15_Cooling_KEHE_<today>.xlsx with 5 sheets Parameters / Steps / Materials / Gates / Maintenance; Steps 33 rows (1 + 16 × 2); Materials 1 + 42 rows with the formula column; Gates 1 + 12; Maintenance 12 rows after the hand-over button; no price column anywhere (v22.76)',
  requires:REQ,
  run:run(`
    await openCool();
    const cap=stubX();CL.excel();await sleep(200);
    const S=cap.S||[];const by=n=>(S.find(s=>s.name===n)||{}).rows||[];
    const h=CL.handover();
    const cap2=stubX();CL.excel();await sleep(200);const M2=(cap2.S.find(s=>s.name==='Maintenance')||{}).rows||[];
    return {name:cap.name,sheets:S.map(s=>s.name),steps:by('Steps').length,mats:by('Materials').length,matHead:by('Materials')[0].slice(0,5),gates:by('Gates').length,maint1:by('Maintenance').length,
      created:h.created.length,maint2:M2.length,m2ids:M2.slice(1).every(r=>/^T_/.test(String(r[3]))),noPrice:!/₱|price|cost/i.test(JSON.stringify(S))};
  `),
  expect:{name:'Prj15_Cooling_KEHE_'+(new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'))+'.xlsx',sheets:['Parameters','Steps','Materials','Gates','Maintenance'],steps:33,mats:43,matHead:['Ref','BOX 2 name','Spec','Per set','Basis'],gates:13,maint1:12,created:11,maint2:12,m2ids:true,noPrice:true} },

{ name:'🆘 Help centre: Projects has exactly one section whose heading names KEHE (and still exactly one MX1012 heading); the guide names "Left of door", "24 + 1 trimmed", "Lost / short", "Chart A", "never shows a price"; the Help centre carries no download or file path (v22.76)',
  requires:REQ,
  run:run(`
    const g=(window.HNX_HELP_GUIDES||[]).find(x=>x.id==='m_projects');
    const secs=(g&&g.sections||[]).filter(s=>/KEHE/.test(s.h||''));
    const mx=(g&&g.sections||[]).filter(s=>/MX1012/.test(s.h||''));
    const txt=JSON.stringify(secs);
    return {sec:secs.length,mx:mx.length,has:['Left of door','24 + 1 trimmed','Lost / short','Chart A','never shows a price','Preceding work accepted'].map(x=>txt.includes(x)),noFile:!/media\\/manuals|\\.pdf|download/i.test(txt)};
  `),
  expect:{sec:1,mx:1,has:[true,true,true,true,true,true],noFile:true} }
];
