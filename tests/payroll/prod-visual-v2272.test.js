/* v22.72 (Eyal, 12 Oct 2026: "In production also very poor graphics and 3d images with motions we must add very organized and super
   graphics design 3d with motions"). The Production screens draw every greenhouse as its own 3-D moving picture in the Pool card's style
   (block hnx-prod-visual-v2272). These cases are the contract: every picture is driven by the stores the screens already read, the
   numbers on a picture equal the source function's value, motion runs only on a visible Production screen and obeys the 🎞 switch,
   Safe mode, Lite+auto and reduced motion, nothing writes a store, and the block stays additive across innerHTML rebuilds.
   Eyal, 13 Oct ("i dont see the additional grafics 3d in motion production all also this screen can we squeeze it all gh's to one
   full screen?"): the farm — all 14 houses, each with its own small moving picture — sits first on the Dashboard and fits one screen
   at 1366×768 and 1440×900 (7 × 2), ⛶ fills the monitor (Esc returns), two per row at 400 px. */
const NEW="window.hnxProdVisual&&window.hnxProdVisual.__v==='22.72'";
/* CI fix, Oct 2026 (red on next.html only, "One screen" minPic false at 1366×768): the farm must fit the window BELOW the sticky header, and the header's height
   follows the host's fonts — the app's body stack is "-apple-system, … Inter, system-ui, sans-serif", so a runner without Inter (GitHub ubuntu: DejaVu Sans, wide)
   wraps the top bar into one more row than a PC does (next.html carries the extra "⚠ Alerts" button: 205 → 249 px, pictures 81 px high < 90). The two "One screen"
   cases therefore pin the page to Liberation Sans (Arial metrics, close to the Windows PCs the 14-in-one-screen rule is for; Playwright installs it on every
   runner) before they measure, so the number they check no longer depends on which fonts the machine happens to have. Expectations are unchanged. */
const PIN_FONT='html *, body *{font-family:"Liberation Sans",Arial,Helvetica,sans-serif !important}';
/* a production day: today's checklist per GH (GH3: 1 critical + 3 warnings, GH7: 2 critical, GH9: 1 critical + 2 warnings), 7 Production calls,
   08:00 pool readings (GH3 = the owner's example 26 cm · EC 1.62 · pH 6.6, GH9 unread), a plant census, a planting log, this week's seedling plan,
   a flagged fan belt on GH8 */
const SEED=function(){
  /* CI fix, Oct 2026 (time-of-day bomb; also pinned in prod-onescreen-v2324): this seed raises its warnings at 08:15 "today" and the app escalates a warning left unanswered for ~8 hours to critical, so the cases
     below were only right between ~09:00 and ~16:15 local time. GitHub's runner is UTC: a run later than that (the "One screen" case on next.html, suite 9/12 at 19:38 UTC) counts more criticals and the pictures shrink.
     From 15:00 local on, the browser clock is moved back to 10:30 of the same local day (real time keeps running); the seed itself is read with that clock. No expectation changes. */
  (function(){var R=Date,n0=R.now(),t=new R(n0);if(t.getHours()<15)return;var sh=new R(t.getFullYear(),t.getMonth(),t.getDate(),10,30,0,0).getTime()-n0;
    var D=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+sh);}static now(){return R.now()+sh;}};window.Date=D;
    try{var ss=JSON.parse(sessionStorage.getItem('hydroPro_session')||'null');if(ss&&ss.loginAt){ss.loginAt=D.now();sessionStorage.setItem('hydroPro_session',JSON.stringify(ss));}}catch(e){}})();
  localStorage.setItem('hydroPro_ui_theme','dark');
  const d=new Date(),ymd=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'),T=ymd(d);
  const ago=n=>{const x=new Date();x.setDate(x.getDate()-n);return x;};
  const CATS={leaf:8,growth:8,rootzone:6,disease:6,climate:8,waterflow:8,infra:13,sanit:3,struct:3,prodmat:3};
  const GHS=['GH1','GH2','GH3','GH4','GH5','GH6','GH7','GH8','GH9','GH10','PRJ11','PRJ12','GH15','GH16'];
  const warnMap={GH2:['leaf_0','climate_4'],GH3:['rootzone_1','waterflow_1','infra_1'],GH5:['disease_1'],GH6:['growth_4','leaf_2'],GH8:['waterflow_0'],GH9:['climate_0','infra_11'],PRJ11:['leaf_0']};
  const dangerMap={GH3:['rootzone_3'],GH7:['disease_3','waterflow_2'],GH9:['infra_8']};
  const doneFrac={GH1:1,GH2:0.9,GH3:0.8,GH4:1,GH5:0.7,GH6:0.85,GH7:0.6,GH8:0.95,GH9:0.5,GH10:0.3,PRJ11:0.5,PRJ12:0,GH15:0,GH16:0};
  const pipes={GH1:'all',GH2:'all',GH3:'some',GH4:'all',GH5:'most',GH6:'all',GH7:'notyet',GH8:'all',GH9:'some',GH10:null};
  const seedl={GH1:'ok',GH2:'ok',GH3:'warn',GH4:'ok',GH5:'ok',GH6:'ok',GH7:'danger',GH8:'ok',GH9:'warn',GH10:null};
  const st={};
  GHS.forEach(g=>{const items={},statuses={},notes={};let k=0;Object.keys(CATS).forEach(c=>{for(let i=0;i<CATS[c];i++){k++;if((k%10)/10<doneFrac[g])items[c+'_'+i]=true;}});
    (warnMap[g]||[]).forEach(key=>{statuses[key]='warn';items[key]=true;notes[key]='Seen on span B';});(dangerMap[g]||[]).forEach(key=>{statuses[key]='danger';items[key]=true;notes[key]='Urgent';});
    st[g]={items,statuses,locations:{},notes,photos:{},fans:g==='GH8'?{3:{belt:'warn'}}:{},fanIssues:{big:[],roof:[]},supTag:g==='GH7'?'danger':(g==='GH3'||g==='GH9'?'warn':''),supNote:'',pipesClean:pipes[g]===undefined?null:pipes[g],seedlings:seedl[g]===undefined?null:seedl[g]};});
  localStorage.setItem('hydroPro_'+T,JSON.stringify(st));
  const iso=(n,h)=>{const x=ago(n);x.setHours(h||8,15,0,0);return x.toISOString();};
  localStorage.setItem('hydroPro_calls',JSON.stringify([
    {id:'PC1',subject:'GH7 — Root rot suspected on table 12',priority:'critical',status:'new_call',sourceModule:'checklist',area:'GH7',createdAt:iso(1,7),raisedAt:iso(1,7),date:ymd(ago(1)),updates:[]},
    {id:'PC2',subject:'GH3 — Low water flow at tables B3-B5',priority:'high',status:'in_progress',sourceModule:'checklist',area:'GH3',createdAt:iso(1,9),raisedAt:iso(1,9),date:ymd(ago(1)),assignees:['tester'],updates:[]},
    {id:'PC3',subject:'GH9 — Pump malfunction pool P9',priority:'critical',status:'new_call',sourceModule:'prod_tech_per_gh',area:'GH9',createdAt:iso(1,6),raisedAt:iso(1,6),date:ymd(ago(1)),updates:[]},
    {id:'PC4',subject:'GH2 — Cooling pad dry on left side',priority:'medium',status:'new_call',sourceModule:'prod_tech_per_gh',area:'GH2',createdAt:iso(2,10),raisedAt:iso(2,10),date:ymd(ago(2)),updates:[]},
    {id:'PC5',subject:'GH5 — Downy mildew on span A',priority:'high',status:'new_call',sourceModule:'dashboard',area:'GH5',createdAt:iso(3,8),raisedAt:iso(3,8),date:ymd(ago(3)),updates:[]},
    {id:'PC6',subject:'GH6 — Bolting on Romaine D batch',priority:'low',status:'new_call',sourceModule:'checklist',area:'GH6',createdAt:iso(1,14),raisedAt:iso(1,14),date:ymd(ago(1)),updates:[]},
    {id:'PC7',subject:'GH8 — Big fan row C #3 belt broken',priority:'high',status:'new_call',sourceModule:'prod_tech_per_gh',area:'GH8',createdAt:iso(1,11),raisedAt:iso(1,11),date:ymd(ago(1)),updates:[]},
    {id:'PC8',subject:'Office printer out of toner',priority:'low',status:'new_call',sourceModule:'hr',area:'Office',createdAt:iso(1,11),raisedAt:iso(1,11),date:ymd(ago(1)),updates:[]}]));
  const pool={};pool[T]={};
  [['P01','58','6.1','1.8'],['P02','52','6.4','2.4'],['P03','26','6.6','1.62'],['P04','49','6.0','1.6'],['P05','55','6.3','1.9'],['P06','40','7.1','1.5'],['P07','57','6.0','1.8'],['P08','60','6.2','1.7'],['P10','59','6.0','1.8']].forEach(r=>{pool[T][r[0]]={'08:00':{water:r[1],pH:r[2],manualPH:r[2],EC:r[3],manualEC:r[3],waterTemp:'24.0',checkedBy:'tester'}};});
  localStorage.setItem('hydroPro_irr_pool',JSON.stringify(pool));
  const PT=[{id:'nft19',label:'NFT-19',icon:'🟦',capacity:19,stage:'mature'},{id:'nft14',label:'NFT-14',icon:'🟦',capacity:14,stage:'mature'},{id:'zigzag',label:'Zigzag',icon:'⫩',capacity:104,stage:'seedling'},{id:'open',label:'Open Pipe',icon:'🟢',capacity:315,stage:'seedling'}];
  const planted={GH1:12,GH2:10,GH3:12,GH4:8,GH5:12,GH6:11,GH7:12,GH8:12,GH9:9,GH10:0};
  localStorage.setItem('hydroPro_plant_census_v1',JSON.stringify({pipeTypes:PT,ghs:Object.keys(planted).map(id=>({id,crop:'',nft19:10,nft14:2,zigzag:0,open:0,planted:planted[id]})),updatedAt:Date.now()}));
  const V={GH1:['Romaine D',18],GH2:['Lollo Rossa',30],GH3:['Butterhead F',9],GH4:['Green Oak',22],GH5:['Romaine D',2],GH6:['Pok Choi',28],GH7:['Red Oak',15],GH8:['Romaine D',34],GH9:['Lollo Bionda',12]};
  localStorage.setItem('hydroPro_planting_log_v1',JSON.stringify(Object.keys(V).map((g,i)=>({id:'pl'+i,gh:g,variety:V[g][0],date:ymd(ago(V[g][1])),lines:planted[g],notes:''}))));
  const ws=new Date();ws.setHours(12,0,0,0);ws.setDate(ws.getDate()-ws.getDay());const WK=ws.toISOString().slice(0,10);
  const plan={};Object.keys(planted).forEach((g,i)=>{plan[g]={varieties:[{variety:'CGFE',planned:6+(i%4)*2,done:Math.max(0,4+(i%5)-(i>6?4:0))}],rockwoolPrepared:8};});
  localStorage.setItem('hnx_seedling_plans_v1',JSON.stringify({[WK]:plan}));
  localStorage.setItem('hnx_irrviz_motion_v2226','always');
  /* v23.44: the 🏭 Farm Twin replaces these pictures; ▦ Classic (per computer) keeps every case below on the classic pictures it was written for */
  localStorage.setItem('hnxlocal_twin_classic_v1','1');
};
const H=`window.__hnxPulledOk=true;window.showToast=()=>{};window.confirm=()=>true;const PV=window.hnxProdVisual;
  const go=async(v,ms)=>{switchView(v,true);await sleep(ms||2200);};
  const pvAnims=()=>PV.stats().cssAnims;
  const farm=()=>document.getElementById('pvFarmGrid');
  const card=g=>farm().querySelector(':scope > [data-gh="'+g+'"]');
  const cards=()=>[...farm().querySelectorAll(':scope > article')];
  const txt=e=>(e?e.textContent:'').replace(/\\s+/g,' ').trim();
  const show=async()=>{try{document.getElementById('pvFarm').scrollIntoView({block:'start'});}catch(e){}await sleep(500);};
  try{switchModule('production');}catch(e){}await sleep(2000);`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
const wallFilter=`(()=>{const isClosed=window.__hnxCallStatus?window.__hnxCallStatus.closed:(c=>/^closed_/.test(c.status||''));return loadCalls().filter(c=>!isClosed(c)).filter(c=>{const sm=(c.sourceModule||'').toLowerCase();return sm.startsWith('prod')||sm==='production'||sm==='supervisor'||sm==='checklist'||(c.group||'').toLowerCase()==='operations';}).length;})()`;
module.exports=[
{ name:'🖼 Dashboard: the farm comes first — 14 compact cards in one grid (GH1–GH10, PRJ11, PRJ12, GH15, GH16), each with its own 3-D picture — and the 6 KPI tiles each carry a picture driven by the tile\'s own number (lamp lit iff Warnings / Critical > 0, ring = Checklist Done ÷ Facilities); GH3 seeded 1 critical + 3 warnings → "Critical ✕1 !3", 80 % = facProgress(GH3) (56/70), 0 page errors',
  requires:NEW, seed:SEED,
  run:fn(`await go('dashboard');
    const tiles=[...document.querySelectorAll('#statGrid > .stat-card')];
    const kpiPics=tiles.filter(t=>t.querySelector(':scope > .pv-kpi-pic svg')).length;
    const cs=cards(),c3=card('GH3'),p3=facProgress('GH3');
    const val=i=>parseInt(txt(tiles[i].querySelector('.stat-val')),10);
    const ring=tiles[1].querySelector('.pv-ringarc');
    const f=document.getElementById('pvFarm');
    return {order:cs.map(c=>c.getAttribute('data-gh')).join(','),pics:cs.filter(c=>c.querySelector(':scope > .pv-gc-pic svg')).length,first:f.nextElementSibling&&f.nextElementSibling.id,kpiPics,
      st:[...c3.querySelector('.pv-gc-r2').children].map(txt).filter(Boolean).join(' '),pct:txt(c3.querySelector('.pc')),pctEq:txt(c3.querySelector('.pc'))===p3.pct+'%',bar:c3.querySelector('.pv-bar').getAttribute('title'),
      warnLamp:!!tiles[2].querySelector('.pv-beacon')===(val(2)>0),critLamp:!!tiles[3].querySelector('.pv-beacon')===(val(3)>0),
      ringEq:Math.abs(parseFloat(ring.getAttribute('data-p'))-val(1)/val(0))<0.002,facTile:val(0),facN:GREENHOUSES.length,oldList:!!document.querySelector('#pvGhListFold #dbGhGrid')};`),
  expect:{order:'GH1,GH2,GH3,GH4,GH5,GH6,GH7,GH8,GH9,GH10,PRJ11,PRJ12,GH15,GH16',pics:14,first:'statGrid',kpiPics:6,st:'Critical ✕1 !3',pct:'80%',pctEq:true,bar:'checklist 56/70',warnLamp:true,critLamp:true,ringEq:true,facTile:14,facN:14,oldList:true} },

{ name:'🗺 One screen (Eyal 13 + 14 Oct): Production → Dashboard at 1366×768 and 1440×900 — the cockpit bar and all 14 houses (GH1–GH10, PRJ11, PRJ12, GH15, GH16) as live 3-D tiles sit inside the window below the sticky header with no scrolling (5 × 3, the 15th slot "Needs attention now"), each picture ≥ 180 × 90 px; at 400 px two per row and no sideways page scroll',
  requires:NEW+"&&!!window.hnxTwin", seed:SEED,
  drive:async pg=>{const out={};
    await pg.addStyleTag({content:PIN_FONT}); /* header height must not depend on the host's fonts */
    /* v23.44: this case measures the 🏭 Farm Twin (block hnx-twin-ui-v2324), so it leaves ▦ Classic first */
    await pg.evaluate(async()=>{localStorage.removeItem('hnxlocal_twin_classic_v1');try{hnxTwin.classic(false);}catch(e){}try{switchModule('production');}catch(e){}await new Promise(r=>setTimeout(r,1500));switchView('dashboard',true);await new Promise(r=>setTimeout(r,2500));hnxTwin.show('dash');await new Promise(r=>setTimeout(r,1500));});
    const fit=()=>pg.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));hnxTwin.show('dash');await sleep(700);const f=document.getElementById('hnxTwinDash');
      f.scrollIntoView({block:'start'});await sleep(900);f.scrollIntoView({block:'start'});await sleep(500);
      const L=hnxTwin.layout('dash'),sb=L.stickyBottom,rs=[...f.querySelectorAll('.hnx-tw-bar, .hnx-tw-tile, .hnx-tw-attn')].map(a=>a.getBoundingClientRect()),
        ps=[...f.querySelectorAll('.hnx-tw-tile .hnx-tw-pic')].map(a=>a.getBoundingClientRect()),attn=f.querySelector('.hnx-tw-attn');
      return {n:f.querySelectorAll('.hnx-tw-tile').length,cols:L.cols,rows:L.rows,slot:L.slot,inside:rs.every(b=>b.top>=sb-1&&b.bottom<=innerHeight+0.5&&b.left>=0&&b.right<=innerWidth+0.5),
        minPic:ps.length===14&&ps.every(b=>b.width>=180&&b.height>=90),attn:!!attn&&/Needs attention now/.test(attn.textContent),sw:document.documentElement.scrollWidth===innerWidth};});
    for(const [w,h] of [[1366,768],[1440,900],[400,860]]){await pg.setViewportSize({width:w,height:h});await pg.waitForTimeout(900);out[w+'x'+h]=await fit();}
    return out;},
  expect:{'drive.1366x768':{n:14,cols:5,rows:3,slot:'attention',inside:true,minPic:true,attn:true,sw:true},'drive.1440x900':{n:14,cols:5,rows:3,slot:'attention',inside:true,minPic:true,attn:true,sw:true},'drive.400x860.cols':2,'drive.400x860.n':14,'drive.400x860.sw':true} },

{ name:'⛶ Full screen: the button lifts the farm over the whole window (header and side menu covered, all 14 cards inside 1366×768), Esc returns it to its place before the six numbers; the button toggles on and off; leaving the Dashboard ends it',
  requires:NEW, seed:SEED, viewport:{width:1366,height:768},
  drive:async pg=>{const st=()=>pg.evaluate(()=>{const f=document.getElementById('pvFarm'),rs=[...document.querySelectorAll('#pvFarmGrid > article')].map(a=>a.getBoundingClientRect());
      const cover=[[3,3],[innerWidth-3,3],[3,innerHeight-3],[innerWidth-3,innerHeight-3],[120,300]].every(p=>{const e=document.elementFromPoint(p[0],p[1]);return !!(e&&f.contains(e));});
      return {on:hnxProdVisual.isFullScreen(),cls:f.classList.contains('pv-fs'),cover,inside:rs.every(b=>b.top>=0&&b.bottom<=innerHeight+0.5&&b.right<=innerWidth+0.5),btn:document.getElementById('pvFarmFsBtn').textContent.trim(),home:f.parentNode.id+'>'+(f.nextElementSibling&&f.nextElementSibling.id)};});
    await pg.evaluate(async()=>{try{switchModule('production');}catch(e){}await new Promise(r=>setTimeout(r,1500));switchView('dashboard',true);await new Promise(r=>setTimeout(r,2500));});
    /* the farm sits just under the sticky header first, so the real mouse reaches the button (a busy CI box scrolls slowly) */
    const press=async()=>{await pg.evaluate(()=>{const f=document.getElementById('pvFarm');if(f&&!f.classList.contains('pv-fs'))f.scrollIntoView({block:'start'});});await pg.waitForTimeout(500);await pg.click('#pvFarmFsBtn',{timeout:20000});};
    await press();await pg.waitForTimeout(900);const a=await st();
    await pg.keyboard.press('Escape');await pg.waitForTimeout(700);const b=await st();
    await press();await pg.waitForTimeout(700);const c=await st();await press();await pg.waitForTimeout(700);const d=await st();
    await press();await pg.waitForTimeout(600);await pg.evaluate(()=>switchView('hr',true));await pg.waitForTimeout(900);
    const e=await pg.evaluate(()=>({on:hnxProdVisual.isFullScreen(),fsClass:document.body.classList.contains('pv-farm-fs')}));
    return {a:{on:a.on,cls:a.cls,cover:a.cover,inside:a.inside,btn:a.btn},b:{on:b.on,cover:b.cover,home:b.home,btn:b.btn},c:c.on,d:d.on,e};},
  expect:{'drive.a':{on:true,cls:true,cover:true,inside:true,btn:'✕ Exit full screen'},'drive.b':{on:false,cover:false,home:'view-dashboard>statGrid',btn:'⛶ Full screen'},'drive.c':true,'drive.d':false,'drive.e':{on:false,fsClass:false}} },

{ name:'👀 The pictures move on the screen Eyal opens first: Production → Dashboard at 1366×900 with no scrolling shows the farm\'s first row (pictures inside the window) and its houses are moving (fans / water / halos) with 🎞 Always',
  requires:NEW, seed:SEED, viewport:{width:1366,height:900},
  run:fn(`hnxIrrViz.setMotion('always');HNX_LITE.set(false,true);switchView('dashboard',true);window.scrollTo(0,0);await sleep(2600);window.scrollTo(0,0);await sleep(800);
    const row=cards().slice(0,7),vis=row.filter(c=>{const b=c.querySelector('.pv-gc-pic').getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight;}).length;
    let mv=0;for(let i=0;i<20&&mv<5;i++){mv=document.getAnimations().filter(a=>{try{const t=a.effect.target;return a.playState==='running'&&row.some(c=>c.contains(t));}catch(e){return false;}}).length;if(mv<5)await sleep(200);}
    return {visible:vis,moving:mv>=5?true:mv};`),
  expect:{visible:7,moving:true} },

{ name:'🏃 Motion only on the visible Production screen: 🎞 always on the dashboard → ≥ 10 running picture animations and the settle loop running, then idle (running:false); switchView(hr) → 0 running picture animations within 500 ms and the loop stopped; back on the dashboard the pictures move again',
  requires:NEW, seed:SEED,
  run:fn(`hnxIrrViz.setMotion('always');HNX_LITE.set(false,true);await go('dashboard');await show();
    PV.settle(null,true);await sleep(100);const s1=PV.stats();let a1=0;for(let i=0;i<20&&a1<10;i++){a1=pvAnims();if(a1<10)await sleep(150);}
    let s2=PV.stats();for(let i=0;i<80&&s2.running;i++){await sleep(250);s2=PV.stats();} /* ~1.7 s on a normal PC; up to 20 s allowed for a starved CI box whose frames come seconds apart */
    await go('hr',500);const a3=pvAnims(),s3=PV.stats();await go('dashboard');await show();let a4=0;for(let i=0;i<20&&a4<10;i++){a4=pvAnims();if(a4<10)await sleep(150);}
    return {anims:a1>=10,running:s1.running,idle:!s2.running&&s2.reason==='idle',away:a3,awayRunning:s3.running,awayReason:s3.reason,back:a4>=10};`),
  expect:{anims:true,running:true,idle:true,away:0,awayRunning:false,awayReason:'no view',back:true} },

{ name:'⚡ Static: Lite ON + 🎞 auto → 0 running picture animations, stats().reason "lite"; __HNX_SAFE → "safe"; 🎞 off → "off"; Lite ON + 🎞 always → ≥ 10 running (the Pool card rule); the still picture\'s markup equals the moving one\'s',
  requires:NEW, seed:SEED,
  run:fn(`await go('dashboard');await show();const svg=()=>card('GH1').querySelector('.pv-gc-pic svg').innerHTML;
    HNX_LITE.set(true,true);hnxIrrViz.setMotion('auto');PV.kick();await sleep(400);const lite={a:pvAnims(),r:PV.stats().reason};
    window.__HNX_SAFE=true;PV.kick();await sleep(300);const safe={a:pvAnims(),r:PV.stats().reason};window.__HNX_SAFE=false;
    hnxIrrViz.setMotion('off');PV.kick();await sleep(300);const off={a:pvAnims(),r:PV.stats().reason,m:svg()};
    hnxIrrViz.setMotion('always');PV.kick();let aa=0;for(let i=0;i<20&&aa<10;i++){aa=pvAnims();if(aa<10)await sleep(150);}const r=PV.stats().reason;const al={a:aa>=10,r:r===''||r==='idle',same:svg()===off.m};
    HNX_LITE.set(false,true);return {lite,safe,off:{a:off.a,r:off.r},always:al};`),
  expect:{lite:{a:0,r:'lite'},safe:{a:0,r:'safe'},off:{a:0,r:'off'},always:{a:true,r:true,same:true}} },

{ name:'♿ Reduced motion (emulated) → stats().reason "reduced motion" and 0 running picture animations even with 🎞 always',
  requires:NEW, seed:SEED,
  drive:async pg=>{await pg.emulateMedia({reducedMotion:'reduce'});return 'reduce';},
  run:fn(`hnxIrrViz.setMotion('always');await go('dashboard');await show();PV.kick();await sleep(400);return {a:pvAnims(),r:PV.stats().reason};`),
  expect:{a:0,r:'reduced motion',drive:'reduce'} },

{ name:'📱 400 px: dashboard, wall, production_brain, checklist, supervisor, prod_supervisor_matrix, prod_seedling_plan → page scrollWidth 400 on each and no picture text under 11 px',
  requires:NEW, seed:SEED, viewport:{width:400,height:860},
  run:fn(`const out={},fonts=[];for(const v of ['dashboard','wall','production_brain','checklist','supervisor','prod_supervisor_matrix','prod_seedling_plan']){await go(v,/brain|wall/.test(v)?3000:2000);
      out[v]=document.documentElement.scrollWidth;const root=PV.activeView()||document.body;
      [...root.querySelectorAll('.hnx-pv *, .pv-chip, .pv-pill, .pv-sec, .pv-sec .cnt, .pv-call *, .pv-gc-b *, .pv-th, .pv-pct, .pv-farmbar *')].forEach(e=>{if(e.children.length===0&&e.textContent.trim()&&e.getClientRects().length){const f=parseFloat(getComputedStyle(e).fontSize);if(f<11)fonts.push(v+':'+e.className+':'+f);}});}
    out.small=fonts.slice(0,5);return out;`),
  expect:{dashboard:400,wall:400,production_brain:400,checklist:400,supervisor:400,prod_supervisor_matrix:400,prod_seedling_plan:400,small:[]} },

{ name:'🔢 Numbers equal the source: P03 08:00 water 26 / EC 1.62 / pH 6.6 → GH3 pool line "P03 26/60 cm · EC 1.62 · pH 6.6" and the cylinder water height = 26 of the 70 cm scale ± 1 (20.1 of 54 units); GH9 unread → "?" and "no reading today"; the calls count equals renderWall\'s Open Calls (8: 6 Production + 2 pool alerts)',
  requires:NEW, seed:SEED,
  run:fn(`await go('dashboard');const c3=card('GH3'),c9=card('GH9');
    const d=c3.querySelector('.pv-gc-pic .pv-rise path').getAttribute('d');const top=parseFloat(d.split(' ')[1]);
    const P3=(IRR_POOLS||loadIrrPools()).find(p=>p.id==='P03'),b=irrLevelBands(P3),max=Math.max(b.critAbove,irrDailyTarget(P3)*1.15,26*1.1);const expH=54*(26/max);
    const h=150-top,pl=c3.querySelector('.pool');
    const n=parseInt((txt(document.querySelector('#pvCalls .pv-sec .cnt')).match(/\\d+/)||['x'])[0],10),wall=${wallFilter};
    renderWall();const wv=[...document.querySelectorAll('#wallSummary .w-stat')].find(t=>/Open Calls/.test(t.textContent));
    return {line:[...pl.children].map(txt).join(' · '),title:pl.getAttribute('title'),target:irrDailyTarget(P3),h:+h.toFixed(1),hOk:Math.abs(h-expH)<=1,gh9:txt(c9.querySelector('.pool')),q:[...c9.querySelectorAll('.pv-gc-pic text')].some(t=>t.textContent==='?'&&getComputedStyle(t).display!=='none'),calls:n,callsEqWall:n===wall&&n===parseInt(txt(wv.querySelector('.w-val')),10)};`),
  expect:{line:'P03 26/60 cm · EC 1.62 · pH 6.6',title:'P03 08:00 · level 26 of 60 cm · EC 1.62 · pH 6.6',target:60,h:20.1,hOk:true,gh9:'P09 · no reading today',q:true,calls:8,callsEqWall:true} },

{ name:'⏱ Frame cost: 60 loop frames at 1366×900 (PV.bench, the loop\'s own work, best of up to 3 runs) average ≤ 4 ms and max ≤ 16 ms; the dashboard adds ≤ 1,200 nodes and runs ≤ 40 picture animations',
  requires:NEW, seed:SEED, viewport:{width:1366,height:900},
  run:fn(`hnxIrrViz.setMotion('always');HNX_LITE.set(false,true);await go('dashboard');await show();
    let bm=PV.bench(60);for(let i=0;i<2&&bm.maxMs>16;i++){await sleep(400);const b2=PV.bench(60);if(b2.maxMs<bm.maxMs)bm=b2;}await sleep(1500);
    const hosts=[...document.querySelectorAll('#pvFarm, #pvCalls, #pvRecStrip, #pvRec > .pv-sec, #pvRecFold > summary, #pvCallsAlso > summary, #pvGhListFold > summary, .pv-kpi-pic, #matrixWrap .pv-th')];
    const added=hosts.reduce((a,e)=>a+1+e.querySelectorAll('*').length,0);
    const anims=document.getAnimations().filter(a=>{try{const t=a.effect.target;return a.playState==='running'&&t&&t.closest('.hnx-pv')&&t.closest('#view-dashboard');}catch(e){return false;}}).length;
    return {frames:bm.frames,avg:bm.avgMs<=4?true:bm.avgMs,max:bm.maxMs<=16?true:bm.maxMs,added:added<=1200?true:added,anims:anims<=40?true:anims};`),
  expect:{frames:60,avg:true,max:true,added:true,anims:true} },

{ name:'🧱 Additive: renderDB() ×3 then renderWall() leaves exactly 6 KPI + 14 farm + 14 wall pictures (no duplicates; unchanged signatures carry .pv-rest); __hnxGovStats().jobs.length unchanged; the stores the pictures read are byte-identical before and after',
  requires:NEW, seed:SEED,
  run:fn(`await go('dashboard');const KEYS=['hydroPro_plant_census_v1','hydroPro_planting_log_v1','hydroPro_irr_pool','hydroPro_calls','hnx_seedling_plans_v1','hydroPro_'+today,'hnx_irrviz_motion_v2226'];
    const snap=()=>KEYS.map(k=>localStorage.getItem(k)).join('\\u0001');const s0=snap(),j0=__hnxGovStats().jobs.length;
    renderDB();await sleep(400);renderDB();await sleep(400);renderDB();await sleep(600);PV.decorate();PV.decorate();
    const jobs=__hnxGovStats().jobs.length===j0,stores=snap()===s0;
    const kpi=document.querySelectorAll('#statGrid .pv-kpi-pic').length,f=cards().length;
    const rest=cards().every(c=>c.classList.contains('pv-rest'));
    const singles=['pvFarm','pvCalls','pvCallsAlso','pvRec','pvRecFold','pvGhListFold','dbGhGrid'].map(id=>document.querySelectorAll('#'+id).length);
    await go('wall',3000);renderWall();await sleep(800);const w=document.querySelectorAll('#wallGrid > .wall-card > .pv-hero').length,wk=document.querySelectorAll('#wallSummary .pv-kpi-pic').length;
    return {kpi,farm:f,rest,singles,wall:w,wallKpi:wk,jobs,stores};`),
  expect:{kpi:6,farm:14,rest:true,singles:[1,1,1,1,1,1,1],wall:14,wallKpi:8,jobs:true,stores:true} },

{ name:'🖥 Wall: body.wall-mode hides the rail and the CCTV strip, 14 cards in 5 columns with 22 px names, ≤ 3 action chips per card, a site strip above the grid; Esc leaves the wall',
  requires:NEW, seed:SEED, viewport:{width:1600,height:1000},
  run:fn(`await go('wall',3200);const hid=s=>{const e=document.querySelector(s);return !e||getComputedStyle(e).display==='none';};
    const wcs=[...document.querySelectorAll('#wallGrid > .wall-card')];
    const cols=getComputedStyle(document.getElementById('wallGrid')).gridTemplateColumns.split(' ').length;
    const out={mode:document.body.classList.contains('wall-mode'),rail:hid('#hnxRail'),cctv:hid('#hnxModCamStrip'),cards:wcs.length,pics:wcs.filter(c=>c.querySelector(':scope > .pv-hero svg')).length,cols,
      name:getComputedStyle(wcs[0].querySelector('.wall-fac-name')).fontSize,maxChips:Math.max(...wcs.map(c=>c.querySelectorAll(':scope > .pv-chips > .pv-chip').length))<=3,site:!!document.querySelector('#pvWallSite svg')};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(900);out.left=!document.body.classList.contains('wall-mode');return out;`),
  expect:{mode:true,rail:true,cctv:true,cards:14,pics:14,cols:5,name:'22px',maxChips:true,site:true,left:true} },

{ name:'🧠 Brain: HNX_COCKPIT_KPIS.production\'s 9 values are identical before and after decoration, the farm map shows 14 houses, Subjects keeps its boxes and the hnxCkKpi drill-down opens',
  requires:NEW, seed:SEED,
  run:fn(`const kp=()=>JSON.stringify(HNX_COCKPIT_KPIS.production().map(k=>[k[0],k[1]]));const before=kp();
    await go('production_brain',3500);const host=document.getElementById('hnxModBrainView');const after=kp();
    const labels=[...document.querySelectorAll('#pvBrainFarm svg text')].map(t=>t.textContent.trim()).filter(t=>/^(GH\\d+|PRJ\\d+)$/.test(t));
    const kpis=host.querySelectorAll('.ceack-kpi').length,boxes=host.querySelectorAll('.ceack-grid .ceack-box').length,fold=!!host.querySelector('details.pv-fold .ceack-grid');
    const k0=host.querySelector('.ceack-kpi');k0&&k0.click();await sleep(600);const drawer=!!document.getElementById('hnxCkDrawer');
    return {same:before===after,n:JSON.parse(after).length,houses:labels.length,kpis,boxes:boxes>0,fold,drawer};`),
  expect:{same:true,n:9,houses:14,kpis:9,boxes:true,fold:true,drawer:true} },

{ name:'🌓 Dark and light theme (hnxSetTheme): 0 text nodes of the pictures under 4.5:1 on the dashboard (farm, calls list, recurring strip, fold titles, KPI, matrix) and the Supervisor Daily Report in either theme, and no inline dark colour in any picture SVG',
  requires:NEW, seed:SEED,
  run:fn(`await go('dashboard');await sleep(600);
    const rgb=s=>{const m=String(s||'').match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(parseFloat);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};};
    const lum=c=>{const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);};
    const blend=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
    const bgOf=el=>{const chain=[];let e=el;while(e&&e.nodeType===1){const c=rgb(getComputedStyle(e).backgroundColor);if(c&&c.a>0)chain.push(c);if(c&&c.a>=1)break;e=e.parentElement;}let bg={r:255,g:255,b:255,a:1};for(let i=chain.length-1;i>=0;i--)bg=blend(chain[i],bg);return bg;};
    const check=(root,sel)=>{const low=[];root.querySelectorAll(sel).forEach(el=>{if(el.closest('svg'))return;const t=[...el.childNodes].filter(n=>n.nodeType===3&&n.nodeValue.trim().length>1);if(!t.length)return;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||el.offsetParent===null)return;
        const fg=rgb(cs.color);if(!fg)return;const bg=bgOf(el);const L1=lum(fg),L2=lum(bg);const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);if(cr<4.5)low.push(el.className+' "'+t[0].nodeValue.trim().slice(0,20)+'" '+cr.toFixed(2));});return low;};
    const SEL='#pvFarm *, #pvCalls *, #pvRec > .pv-sec *, #pvRecStrip *, #pvRecFold > summary *, #pvCallsAlso > summary *, #pvGhListFold > summary *, .pv-kpi-pic *, #matrixWrap .mx-cell *';
    const pass=async(theme)=>{hnxSetTheme(theme);await go('dashboard');hnxSetTheme(theme);await sleep(500);const on=document.body.classList.contains('hnx-light')===(theme==='light');
      const dash=check(document.getElementById('view-dashboard'),SEL);await go('prod_supervisor_matrix');const mx=check(document.getElementById('view-prod_supervisor_matrix'),'th .pv-pct, td[data-pv-st] button');return {on,dash:dash.slice(0,6),mx:mx.slice(0,6)};};
    const dk=await pass('dark'),lt=await pass('light');
    const dark=[...document.querySelectorAll('.hnx-pv svg *:not(defs *)')].filter(e=>/^#[0-4]/i.test(e.getAttribute('fill')||'')||/^#[0-4]/i.test(e.getAttribute('stroke')||'')||/#[0-4][0-9a-f]{5}/i.test(e.getAttribute('style')||'')).length;
    hnxSetTheme('dark');return {dark:dk,light:lt,inlineDark:dark};`),
  expect:{dark:{on:true,dash:[],mx:[]},light:{on:true,dash:[],mx:[]},inlineDark:0} }
];
