/* v22.80 (Eyal, 13 Oct 2026, "Create a task — Step 1 of 3": "the option to add more subjects, and again all images should be
   3-D in motion, relevant"): HNX3D (3-D moving task pictures) + HNXSUBJ (the company's own task subjects). Both pages. */
const REQ="typeof HNX3D==='object'&&typeof HNXSUBJ==='object'";
const KEY='hydroPro_task_subjects_v1';
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Accountant',passwordHash:'x',role:'accounting',active:true,department:'accounting'},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));
  localStorage.setItem('hydroPro_tasks_v1','[]');
};
const SEED_MGR=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'mgr',fullname:'Mara Manager',passwordHash:'x',role:'manager',active:true,department:'production'}]));
  localStorage.setItem('hydroPro_tasks_v1','[]');
};
/* 120 open tasks of tester's under Quality Control → the tile badge reads '99+' */
const SEED_Q=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
  const a=[];for(let i=0;i<120;i++)a.push({id:'TSKQ'+i,title:'Check batch '+i,module:'quality',owner:'tester',createdBy:'tester',status:'todo',visibility:'team',createdAt:Date.now(),required:true,history:[],evidence:[],links:[],blocks:[],sharedWith:[]});
  localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(a));
};
/* in-page helpers (stringified into each run) */
const H=`const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  const W=()=>document.getElementById('hnxTaskWiz');
  const picAnims=()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest('.h3,.h3c'));
  const swaying=()=>picAnims().filter(a=>a.animationName==='h3amb').length;
  const storyPics=()=>{const s=new Set();picAnims().forEach(a=>{const t=a.effect.target;if(t.classList&&t.classList.contains('h3a'))s.add(t.closest('.h3,.h3c'));});return s.size;};
  const tileIds=()=>[...W().querySelectorAll('.tw-grid .tw-tile')].map(t=>t.getAttribute('data-m'));
  const addSubj=async(name,icon,color)=>{HNXSUBJ.openAdd();await sleep(150);const i=document.getElementById('twsName');i.value=name;i.dispatchEvent(new Event('input',{bubbles:true}));
    if(icon)HNXSUBJ.f('icon',icon);if(color)HNXSUBJ.f('color',color);await sleep(100);const b=document.getElementById('twsGo');const dis=b.disabled;b.click();await sleep(250);return dis;};
  const contrast=(fg,bg)=>{const L=c=>c.slice(0,3).reduce((s,v,i)=>{v/=255;return s+[.2126,.7152,.0722][i]*(v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));},0);const a=L(fg),b=L(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
  const rgba=s=>{const m=String(s).match(/[\\d.]+/g)||[0,0,0];return [+m[0],+m[1],+m[2],m[3]==null?1:+m[3]];};
  const bgOf=el=>{const L=[];for(let e=el;e&&e.nodeType===1;e=e.parentElement){const c=rgba(getComputedStyle(e).backgroundColor);if(c[3]>0)L.push(c);if(c[3]>=1)break;}
    let o=[255,255,255];for(let i=L.length-1;i>=0;i--){const c=L[i];o=o.map((v,k)=>v+(c[k]-v)*c[3]);}return o;};`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
module.exports=[
{ name:"🧊 3-D task pictures (v22.80): admin tester sees 25 desk tiles + ➕, 25 + 11 = 36 pictures and 0 emoji left in tiles and chips; .tw-tile.on text is exactly 'Purchasing'; labels 'HR & People' / 'IT' / 'CRM & Sales'",
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);HNXTASKWIZ.open();await sleep(700);
    const tiles=[...W().querySelectorAll('.tw-grid .tw-tile')],desk=tiles.filter(t=>t.getAttribute('data-m')!=='__add'),add=tiles.filter(t=>t.getAttribute('data-m')==='__add');
    const pics=desk.filter(t=>t.querySelector(':scope > .h3.h3-tile')).length,chips=[...W().querySelectorAll('.tw-chip')],coins=chips.filter(c=>c.querySelector(':scope > .h3c')).length;
    const EMO=/\\p{Extended_Pictographic}/u,emoji=tiles.concat(chips).filter(t=>EMO.test(t.textContent)).length;
    const lab=id=>{const t=W().querySelector('.tw-tile[data-m="'+id+'"] .n');return t&&t.textContent;};
    const r={desk:desk.length,add:add.length,addPic:!!(add[0]&&add[0].querySelector('.h3')),pictures:pics+coins,emoji,hr:lab('hr'),it:lab('it'),crm:lab('crm'),placeholders:W().querySelectorAll('.h3p').length,
      chipText:chips.map(c=>c.textContent).join('|')};
    HNXTASKWIZ.set('module','purchasing');await sleep(300);const on=W().querySelector('.tw-tile.on');r.onText=on&&on.textContent;
    HNXTASKWIZ.close();return r;`),
  expect:{desk:25,add:1,addPic:true,pictures:36,emoji:0,hr:'HR & People',it:'IT',crm:'CRM & Sales',placeholders:0,onText:'Purchasing',
    chipText:'Follow-up|Discovery|Trial|Quote|Forecast|Delivery recovery|Training|Approval|Maintenance|Administration|Other'} },

{ name:'🎞 Motion (v22.80): open → ≥ 20 tiles swaying, ≤ 6 telling their story, waveSteps grows within 8 s, 0 rAF frames with the pointer still; hover → frames > 0, back to rest after leaving (≈ 0.35 s; polled up to 3 s); closed → 0 picture animations, 0 observed, rAF stopped',
  requires:REQ, seed:SEED,
  drive:async pg=>{
    const ev=f=>pg.evaluate('(async()=>{'+'const sleep=ms=>new Promise(r=>setTimeout(r,ms));'+H+f+'})()');
    await ev('HNXTASKWIZ.open();await sleep(1500);return 1;');
    const a=await ev('const s=HNX3D.stats();return {sway:swaying(),story:storyPics(),statStory:s.story,steps:s.waveSteps,frames:s.rafFrames,motion:s.motion};');
    /* the wave hands the story on when a picture's 3.6 s cycle ends — poll (a loaded CI box can draw ~1 frame a second) */
    let b;for(let k=0;k<16;k++){await pg.waitForTimeout(k<8?1000:500);b=await ev('const s=HNX3D.stats();return {steps:s.waveSteps,frames:s.rafFrames,raf:s.rafRunning,story:storyPics()};');if(k>=7&&b.steps>a.steps)break;}
    const box=await ev('const r=W().querySelector(\'.tw-tile[data-m="payroll"]\').getBoundingClientRect();return {x:r.left+r.width*.75,y:r.top+r.height*.3};');
    await pg.mouse.move(box.x-20,box.y+10);await pg.mouse.move(box.x,box.y,{steps:6});await pg.waitForTimeout(250);
    const c=await ev('const s=HNX3D.stats();return {frames:s.rafFrames,tilting:s.tilting,tilt:(W().querySelector(\'.tw-tile[data-m="payroll"] .h3-stage\').style.transform||\'\')};');
    const card=await ev('const r=W().querySelector(".tw-card").getBoundingClientRect();return {x:r.left+6,y:r.top+6};');
    await pg.mouse.move(card.x,card.y,{steps:3});
    /* the ease back is time-based (≈ 0.35 s on a normal PC); a loaded test box may draw only one frame a second, so poll up to 3 s */
    let d;for(let k=0;k<12;k++){await pg.waitForTimeout(250);d=await ev('const s=HNX3D.stats();return {raf:s.rafRunning,tilting:s.tilting};');if(!d.raf&&!d.tilting)break;}
    await ev('HNXTASKWIZ.close();await sleep(400);return 1;');
    const e=await ev('const s=HNX3D.stats();return {anims:picAnims().length,observed:s.observed,mounted:s.mounted,raf:s.rafRunning,defsAnims:document.getAnimations().filter(x=>x.effect&&x.effect.target&&x.effect.target.closest&&x.effect.target.closest("#hnx3dDefs")).length};');
    return {sway20:a.sway>=20,story6:a.story<=6&&a.story>=1,statStory6:a.statStory<=6,motion:a.motion,waveGrew:b.steps>a.steps,stillFrames:b.frames-a.frames,stillRaf:b.raf,
      hoverFrames:c.frames>b.frames,hoverTilting:c.tilting,tilted:/rotateX/.test(c.tilt),leftRaf:d.raf,leftTilting:d.tilting,closedAnims:e.anims,closedObserved:e.observed,closedMounted:e.mounted,closedRaf:e.raf,defsAnims:e.defsAnims};
  },
  expect:{'drive.sway20':true,'drive.story6':true,'drive.statStory6':true,'drive.motion':true,'drive.waveGrew':true,'drive.stillFrames':0,'drive.stillRaf':false,
    'drive.hoverFrames':true,'drive.hoverTilting':1,'drive.tilted':true,'drive.leftRaf':false,'drive.leftTilting':0,
    'drive.closedAnims':0,'drive.closedObserved':0,'drive.closedMounted':0,'drive.closedRaf':false,'drive.defsAnims':0} },

{ name:'🧊 Still (v22.80): ⚡ Lite → 0 picture animations and 0 rAF on hover; Safe → 0; reduced motion → 0; 🎞 off → 0; Lite off again → ≥ 20 after the next repaint',
  requires:REQ, seed:SEED,
  drive:async pg=>{
    const ev=f=>pg.evaluate('(async()=>{'+'const sleep=ms=>new Promise(r=>setTimeout(r,ms));'+H+f+'})()');
    const reopen='HNXTASKWIZ.close();HNXTASKWIZ.open();await sleep(900);';
    await ev('HNX_LITE.set(true,true);'+reopen+'return 1;');
    const lite=await ev('return {anims:picAnims().length,motion:HNX3D.motionOk(),hint:!!W().querySelector(".h3-lh"),f:HNX3D.stats().rafFrames};');
    const bx=await ev('const r=W().querySelector(\'.tw-tile[data-m="irrigation"]\').getBoundingClientRect();return {x:r.left+r.width*.7,y:r.top+r.height*.3};');
    await pg.mouse.move(bx.x-15,bx.y+5);await pg.mouse.move(bx.x,bx.y,{steps:5});await pg.waitForTimeout(400);
    const liteHover=await ev('return {f:HNX3D.stats().rafFrames,anims:picAnims().length,pose:getComputedStyle(W().querySelector(\'.tw-tile[data-m="irrigation"] .h3-stage\')).transform!=="none"};');
    await pg.mouse.move(5,5);
    await ev('HNX_LITE.set(false,true);window.__HNX_SAFE=true;'+reopen+'return 1;');
    const safe=await ev('const n=picAnims().length,m=HNX3D.motionOk();window.__HNX_SAFE=false;return {anims:n,motion:m};');
    await pg.emulateMedia({reducedMotion:'reduce'});
    await ev(reopen+'return 1;');
    const rm=await ev('return {anims:picAnims().length,motion:HNX3D.motionOk()};');
    await pg.emulateMedia({reducedMotion:'no-preference'});
    await ev('document.documentElement.classList.add("hnx-iv-m-off");'+reopen+'return 1;');
    const off=await ev('const n=picAnims().length;document.documentElement.classList.remove("hnx-iv-m-off");return {anims:n};');
    await ev('HNX_LITE.set(true,true);'+reopen+'HNX_LITE.set(false,true);HNXTASKWIZ.set("module","general");await sleep(900);return 1;');
    const back=await ev('return {sway:swaying(),motion:HNX3D.motionOk()};');
    await ev('HNXTASKWIZ.close();return 1;');
    return {liteAnims:lite.anims,liteMotion:lite.motion,liteHint:lite.hint,liteRaf:liteHover.f-lite.f,liteHoverAnims:liteHover.anims,litePose:liteHover.pose,
      safeAnims:safe.anims,safeMotion:safe.motion,rmAnims:rm.anims,rmMotion:rm.motion,offAnims:off.anims,back20:back.sway>=20,backMotion:back.motion};
  },
  expect:{'drive.liteAnims':0,'drive.liteMotion':false,'drive.liteHint':true,'drive.liteRaf':0,'drive.liteHoverAnims':0,'drive.litePose':true,
    'drive.safeAnims':0,'drive.safeMotion':false,'drive.rmAnims':0,'drive.rmMotion':false,'drive.offAnims':0,'drive.back20':true,'drive.backMotion':true} },

{ name:"🌱 Own subject (v22.80): tester adds 'Seedling nursery' (seedling, #43a047) → id subj-seedling-nursery, 26 tiles + ➕, the new tile selected; a team task filed under it keeps module subj-seedling-nursery and shows '🌱 Seedling nursery' on My Day, badge 1 on its tile, its own Task Tracker filter option listing 1 task, a 'Seedling nursery' row on Nexi's Task Board and 'Seedling nursery' in the calendar legend; the store holds exactly 1 record",
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);HNXTASKWIZ.open();await sleep(400);
    const dis=await addSubj('Seedling nursery','seedling','#43a047');
    const st=HNXTASKWIZ.state(),ids=tileIds(),on=W().querySelector('.tw-tile.on');
    const store=JSON.parse(localStorage.getItem('${KEY}')||'null');
    const r={addDisabled:dis,module:st.module,tiles:ids.filter(x=>x!=='__add').length,addLast:ids[ids.length-1],onId:on&&on.getAttribute('data-m'),onPic:!!(on&&on.querySelector('.h3.h3-tile')),
      rec:store&&store.length===1?[store[0].id,store[0].name,store[0].icon,store[0].color,store[0].status,store[0].createdBy,typeof store[0].createdAt,!!store[0]._fts]:null};
    HNXTASKWIZ.set('title','Water the seedlings',true);HNXTASKWIZ.next();await sleep(60);HNXTASKWIZ.set('visibility','team');HNXTASKWIZ.set('due',today);HNXTASKWIZ.next();await sleep(60);HNXTASKWIZ.save();await sleep(250);HNXTASKWIZ.close();
    const t=HNXTASKS.load().find(x=>x.title==='Water the seedlings');r.taskModule=t&&t.module;
    switchView('tasks_my');await sleep(1200);const row=[...document.querySelectorAll('#view-tasks_my .hnx-tk')].map(x=>x.textContent).find(x=>/Water the seedlings/.test(x))||'';r.myDay=/🌱 Seedling nursery/.test(row);
    HNXTASKWIZ.open();await sleep(500);const tile=W().querySelector('.tw-tile[data-m="subj-seedling-nursery"]');r.badge=tile&&tile.getAttribute('data-n');r.tileText=tile&&tile.textContent;HNXTASKWIZ.close();
    switchView('task_tracker');await sleep(800);try{renderTaskTracker();}catch(e){}await sleep(300);
    const msel=()=>[...document.querySelectorAll('#taskTrackerBody select')].find(x=>[...x.options].some(o=>o.value==='subj-seedling-nursery'));
    const opt=msel()&&[...msel().options].find(o=>o.value==='subj-seedling-nursery');r.ttOption=opt&&opt.textContent.trim();
    _tt_moduleFilter='subj-seedling-nursery';renderTaskTracker();await sleep(300);const ms=msel(),cn=ms&&ms.nextElementSibling;r.ttCount=cn&&cn.textContent.trim();_tt_moduleFilter='all';try{renderTaskTracker();}catch(e){}
    HNXPA.open('pa_day');await sleep(500);r.board=/Seedling nursery/.test((document.getElementById('view-pa_day')||{}).innerText||'');
    HNXTASKS.create({title:'Harvest GH2',module:'production',owner:'tester',visibility:'team',due:today});
    const cal=HNXCAL2.html({key:'v2280t',mode:'month',events:loadCalEvents()});const box=document.createElement('div');box.innerHTML=cal;r.legend=[...box.querySelectorAll('.lg')].map(x=>x.textContent).find(x=>/Seedling/.test(x))||'';
    r.legendColor=HNXCAL2.color('subj-seedling-nursery');
    r.records=(JSON.parse(localStorage.getItem('${KEY}')||'[]')||[]).length;return r;`),
  expect:{addDisabled:false,module:'subj-seedling-nursery',tiles:26,addLast:'__add',onId:'subj-seedling-nursery',onPic:true,
    rec:['subj-seedling-nursery','Seedling nursery','seedling','#43a047','active','tester','number',true],
    taskModule:'subj-seedling-nursery',myDay:true,badge:'1',tileText:'Seedling nursery',ttOption:'🌱 Seedling nursery',ttCount:'1 item',board:true,legend:'Seedling nursery · 1',legendColor:'#43a047',records:1} },

{ name:"🚫 Duplicates (v22.80): 'seedling  NURSERY', 'Seedling nurseries', 'Accounting' and 'R&D' are refused (4 × duplicate); the store still has 1 record; the dialog says 'Already a subject: Accounting — pick that tile instead' and Add is off",
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);const a=HNXSUBJ.add({name:'Seedling nursery',icon:'seedling',color:'#43a047'});
    const r=['seedling  NURSERY','Seedling nurseries','Accounting','R&D'].map(n=>{const x=HNXSUBJ.add({name:n});return x.reason+':'+x.match;});
    HNXTASKWIZ.open();await sleep(300);HNXSUBJ.openAdd();await sleep(150);const i=document.getElementById('twsName');i.value='Accounting';i.dispatchEvent(new Event('input',{bubbles:true}));await sleep(80);
    const msg=document.getElementById('twsMsg').textContent,off=document.getElementById('twsGo').disabled;HNXTASKWIZ.close();
    return {first:a.ok,refused:r,records:JSON.parse(localStorage.getItem('${KEY}')).length,msg,off,short:HNXSUBJ.add({name:'x'}).reason,digits:HNXSUBJ.add({name:'123'}).reason};`),
  expect:{first:true,refused:['duplicate:Seedling nursery','duplicate:Seedling nursery','duplicate:Accounting','duplicate:R&D & Planning'],records:1,msg:'⚠ Already a subject: Accounting — pick that tile instead',off:true,short:'bad-name',digits:'bad-name'} },

{ name:"🗄 Retire (v22.80): retire → 25 + ➕; the task still shows 'Seedling nursery'; the editor shows 'Seedling nursery (retired)' and 💾 Save keeps subj-seedling-nursery; restore → the tile is back",
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);const a=HNXSUBJ.add({name:'Seedling nursery',icon:'seedling',color:'#43a047'});
    const t=HNXTASKS.create({title:'Pot the seedlings',module:a.id,owner:'tester',visibility:'team',due:today});
    const ret=HNXSUBJ.retire(a.id);HNXTASKWIZ.open();await sleep(400);const ids=tileIds();HNXTASKWIZ.close();
    switchView('tasks_my');await sleep(1200);const row=[...document.querySelectorAll('#view-tasks_my .hnx-tk')].map(x=>x.textContent).find(x=>/Pot the seedlings/.test(x))||'';
    HNXTASKS.drawer(t.id);await sleep(200);const s=document.getElementById('tkM'),opt=s&&s.options[s.selectedIndex];const optText=opt&&opt.textContent;
    HNXTASKS.save(t.id);await sleep(200);const after=HNXTASKS.load().find(x=>x.id===t.id);
    const rec=JSON.parse(localStorage.getItem('${KEY}'))[0];
    const res=HNXSUBJ.restore(a.id);HNXTASKWIZ.open();await sleep(400);const ids2=tileIds();HNXTASKWIZ.close();
    return {retired:ret.ok,status:rec.status,retiredBy:rec.retiredBy,tiles:ids.filter(x=>x!=='__add').length,hasSubj:ids.includes(a.id),row:/🌱 Seedling nursery/.test(row),editor:optText,saved:after&&after.module,
      restored:res.ok,back:ids2.includes(a.id),tiles2:ids2.filter(x=>x!=='__add').length,label:HNXSUBJ.label(a.id)};`),
  expect:{retired:true,status:'retired',retiredBy:'tester',tiles:25,hasSubj:false,row:true,editor:'Seedling nursery (retired)',saved:'subj-seedling-nursery',restored:true,back:true,tiles2:26,label:'Seedling nursery'} },

{ name:'🔐 Who may add (v22.80): Jinky (accounting, not a head) sees no ➕ and add is refused as not-allowed with the store unchanged; Jinky as head of accounting can add; Jinky\'s retire is refused as admin-only',
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);as('jinky');HNXTASKWIZ.open();await sleep(400);const ids=tileIds();HNXTASKWIZ.close();
    const no=HNXSUBJ.add({name:'Cold room',icon:'snow'});const before=localStorage.getItem('${KEY}');
    localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({accounting:'jinky',_lww:true,updatedAt:Date.now()}));
    HNXTASKWIZ.open();await sleep(400);const ids2=tileIds();HNXTASKWIZ.close();
    const yes=HNXSUBJ.add({name:'Cold room',icon:'snow'});const ret=HNXSUBJ.retire(yes.id);const ed=HNXSUBJ.edit(yes.id,{name:'Cold store'});
    const rec=JSON.parse(localStorage.getItem('${KEY}')||'[]');as('tester');
    return {addTile:ids.includes('__add'),no:no.reason,before,addTile2:ids2.includes('__add'),yes:yes.ok&&yes.id,by:rec[0]&&rec[0].createdBy,ret:ret.reason,ed:ed.reason,status:rec[0]&&rec[0].status,name:rec[0]&&rec[0].name};`),
  expect:{addTile:false,no:'not-allowed',before:null,addTile2:true,yes:'subj-cold-room',by:'jinky',ret:'admin-only',ed:'admin-only',status:'active',name:'Cold room'} },

{ name:'💾 Editor keeps the desk (v22.80): purchasing, safety, meetings, admin and compliance tasks keep their module after 💾 Save (they used to be re-filed as general); the repeating-work list shows names',
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);const out={};
    for(const m of ['purchasing','safety','meetings','admin','compliance','accounting']){const t=HNXTASKS.create({title:'Keep '+m,module:m,owner:'tester',visibility:'team'});
      HNXTASKS.drawer(t.id);await sleep(120);HNXTASKS.save(t.id);await sleep(120);out[m]=(HNXTASKS.load().find(x=>x.id===t.id)||{}).module;}
    HNXTASKS.seriesForm(null);await sleep(150);const o=[...document.getElementById('srM').options];const txt=v=>{const x=o.find(z=>z.value===v);return x&&x.textContent;};
    out.series=[txt('hr'),txt('crm'),txt('purchasing'),txt('general')];const f=document.getElementById('hnxSerF');if(f)f.remove();return out;`),
  expect:{purchasing:'purchasing',safety:'safety',meetings:'meetings',admin:'admin',compliance:'compliance',accounting:'accounting',series:['HR & People','CRM & Sales','Purchasing','General']} },

{ name:'☁ Cloud-first (v22.80): after boot the key is absent (0 writes); with a cloud token and before the first pull, add → not-synced-yet with nothing written',
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);HNXTASKWIZ.open();await sleep(300);HNXTASKWIZ.close();const boot=localStorage.getItem('${KEY}');
    const tok=localStorage.getItem('hnx_cloud_token'),pulled=window.__hnxPulledOk;localStorage.setItem('hnx_cloud_token','v2280-test');window.__hnxPulledOk=false;
    const r=HNXSUBJ.add({name:'Cold room'});const after=localStorage.getItem('${KEY}');
    if(tok==null)localStorage.removeItem('hnx_cloud_token');else localStorage.setItem('hnx_cloud_token',tok);window.__hnxPulledOk=pulled;
    localStorage.setItem('${KEY}','{"broken":1}');const bad=HNXSUBJ.add({name:'Cold room'});const kept=localStorage.getItem('${KEY}');localStorage.removeItem('${KEY}');
    return {boot,reason:r.reason,after,bad:bad.reason,kept};`),
  expect:{boot:null,reason:'not-synced-yet',after:null,bad:'store-unreadable',kept:'{"broken":1}'} },

{ name:'📱 400 px (v22.80): scrollWidth ≤ 400, 3 tile columns, the ➕ dialog\'s Add button reachable with no sideways scroll',
  requires:REQ, seed:SEED, viewport:{width:400,height:860},
  run:fn(`await sleep(1500);HNXTASKWIZ.open();await sleep(500);const g=W().querySelector('.tw-grid');const cols=getComputedStyle(g).gridTemplateColumns.split(' ').length;
    const sw1=Math.max(document.documentElement.scrollWidth,W().scrollWidth);const pic=W().querySelector('.h3-tile').offsetWidth; /* CSS px (the phone layout zooms the page) */
    HNXSUBJ.openAdd();await sleep(250);const x=W().querySelector('.tw-sub'),b=document.getElementById('twsGo');b.scrollIntoView({block:'center'});await sleep(100);const r=b.getBoundingClientRect();
    const picCols=getComputedStyle(x.querySelector('.tws-pics')).gridTemplateColumns.split(' ').length;
    const out={cols,sw:sw1<=400,pic,subSw:x.scrollWidth<=x.clientWidth,docSw:document.documentElement.scrollWidth<=400,btnIn:r.left>=0&&r.right<=400&&r.top>=0&&r.bottom<=860,picCols};HNXTASKWIZ.close();return out;`),
  expect:{cols:3,sw:true,pic:52,subSw:true,docSw:true,btnIn:true,picCols:4} },

{ name:'📦 Size (v22.80): icon library ≤ 64 KB, CSS ≤ 12 KB, subjects ≤ 24 KB, total ≤ 100 KB; ≤ 45 nodes per tile picture; every story part rests at the end of its cycle; 15 tile clicks + 15 full repaints leave 0 extra observers',
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);const by=id=>new Blob([(document.getElementById(id)||{}).textContent||'']).size;
    const lib=by('hnx-3d-icons-v2280'),css=by('hnx-3d-icons-css-v2280'),sub=by('hnx-task-subjects-v2280');
    HNXTASKWIZ.open();await sleep(400);let maxNodes=0,bad=0,parts=0;
    W().querySelectorAll('.h3.h3-tile').forEach(el=>{maxNodes=Math.max(maxNodes,el.querySelectorAll('*').length);const P=parseFloat(el.getAttribute('data-p'));
      el.querySelectorAll('.h3a').forEach(a=>{parts++;const t=parseFloat(a.style.getPropertyValue('--t')),o=parseFloat(a.style.getPropertyValue('--o')||'0'),n=parseFloat(a.style.getPropertyValue('--n')||'1');const k=P/t;
        if(Math.abs(k-Math.round(k))>1e-6||o+n*t>P+1e-6)bad++;});});
    const mods=['production','hr','payroll','it','fleet'];for(let i=0;i<15;i++){HNXTASKWIZ.set('module',mods[i%5]);HNXTASKWIZ.repaint();await sleep(30);}await sleep(300);
    const s=HNX3D.stats(),live=document.querySelectorAll('.h3,.h3c').length;HNXTASKWIZ.close();await sleep(100);const s2=HNX3D.stats();
    return {lib64:lib<=65536,css12:css<=12288,sub24:sub<=24576,total100:lib+css+sub<=102400,maxNodes45:maxNodes<=45,parts:parts>40,badParts:bad,observed:s.observed,live,extra:s.observed-live,mountedAfterClose:s2.mounted,observedAfterClose:s2.observed,sizes:[lib,css,sub]};`),
  expect:{lib64:true,css12:true,sub24:true,total100:true,maxNodes45:true,parts:true,badParts:0,extra:0,mountedAfterClose:0,observedAfterClose:0} },

/* ---------- v23.24 review fixes (visual, speed and data reviews of v22.80) ---------- */
{ name:"⌨ Typing (v23.24 review): typing 'Send SM the schedule' with the real keyboard stores exactly that (it came out backwards) and rebuilds no picture (same elements; ≤ 4 wave starts per 3.6 s); typing 'Confirmed by buyer' in the outcome keeps focus there; a click on Production / Forecast moves the highlight without a rebuild; after a full repaint the caret is at the END (' now' is appended)",
  requires:REQ, seed:SEED,
  drive:async pg=>{
    const ev=f=>pg.evaluate('(async()=>{'+'const sleep=ms=>new Promise(r=>setTimeout(r,ms));'+H+f+'})()');
    await ev('HNXTASKWIZ.open();await sleep(1200);window.__sel=W().querySelector(".tw-tile.on .h3");window.__pay=W().querySelector(\'.tw-tile[data-m="payroll"] .h3\');window.__w0=HNX3D.stats().waveSteps;window.__t0=performance.now();return 1;');
    await pg.click('#twTitle');
    await pg.keyboard.type('Send SM the schedule',{delay:80});
    const a=await ev('const s=HNX3D.stats();return {title:HNXTASKWIZ.state().title,value:document.getElementById("twTitle").value,same:W().querySelector(".tw-tile.on .h3")===window.__sel&&W().querySelector(\'.tw-tile[data-m="payroll"] .h3\')===window.__pay,steps:s.waveSteps-window.__w0,ms:performance.now()-window.__t0};');
    await pg.click('#twOut');
    await pg.keyboard.type('Confirmed by buyer',{delay:80});
    const b=await ev('return {outcome:HNXTASKWIZ.state().outcome,focus:document.activeElement&&document.activeElement.id,title:HNXTASKWIZ.state().title};');
    await pg.click('#hnxTaskWiz .tw-tile[data-m="production"]');
    await pg.click('#hnxTaskWiz .tw-chip[data-t="forecast"]');
    const c=await ev('await sleep(200);return {module:HNXTASKWIZ.state().module,on:[...W().querySelectorAll(".tw-tile.on")].map(t=>t.getAttribute("data-m")),type:HNXTASKWIZ.state().type,chip:[...W().querySelectorAll(".tw-chip.on")].map(t=>t.getAttribute("data-t")),same:W().querySelector(\'.tw-tile[data-m="payroll"] .h3\')===window.__pay};');
    await ev('HNXTASKWIZ.repaint();await sleep(500);return 1;');
    await pg.keyboard.type(' now',{delay:60});
    const d=await ev('const t=document.getElementById("twTitle");return {title:HNXTASKWIZ.state().title,focus:document.activeElement===t};');
    await ev('HNXTASKWIZ.close();return 1;');
    return {title:a.title,value:a.value,noRebuild:a.same,waveOk:a.steps<=4*Math.ceil(a.ms/3600)+4,outcome:b.outcome,outFocus:b.focus,titleKept:b.title,
      module:c.module,on:c.on,type:c.type,chip:c.chip,noRebuild2:c.same,afterRepaint:d.title,focus:d.focus};
  },
  expect:{'drive.title':'Send SM the schedule','drive.value':'Send SM the schedule','drive.noRebuild':true,'drive.waveOk':true,'drive.outcome':'Confirmed by buyer','drive.outFocus':'twOut',
    'drive.titleKept':'Send SM the schedule','drive.module':'production','drive.on':['production'],'drive.type':'forecast','drive.chip':['forecast'],'drive.noRebuild2':true,
    'drive.afterRepaint':'Send SM the schedule now','drive.focus':true} },

{ name:"🛡 Markup in a name (v23.24 review): a manager's '<img src=x onerror=__x=1>' and 'Visitors \"VIP\"' are refused (bad-name), an admin rename to '<b>lab</b>' too; a synced record carrying markup is ignored (no tile, label 'Evil'); the Task Tracker shows 0 injected <img> and prints a markup label as text; 'R&D lab' still reads 'R&D lab'",
  requires:REQ, seed:SEED_MGR,
  run:fn(`await sleep(1500);as('mgr');const canAdd=HNXSUBJ.canAdd();
    const bad=HNXSUBJ.add({name:'<img src=x onerror=__x=1>'}),q=HNXSUBJ.add({name:'Visitors "VIP"'}),ok=HNXSUBJ.add({name:'R&D lab'});
    as('tester');const ren=HNXSUBJ.edit(ok.id,{name:'<b>lab</b>'});
    const st=JSON.parse(localStorage.getItem('${KEY}'));st.push({id:'subj-evil',name:'<img src=x onerror=__x=2>',icon:'flag',color:'#e53935',status:'active',createdAt:Date.now(),createdBy:'x'});localStorage.setItem('${KEY}',JSON.stringify(st));
    const evil={get:HNXSUBJ.get('subj-evil'),label:HNXSUBJ.label('subj-evil'),listed:HNXSUBJ.list().some(s=>s.id==='subj-evil')};
    HNXTASKS.create({title:'Plain title',module:'subj-evil',owner:'tester',visibility:'team'});HNXTASKS.create({title:'Lab work',module:ok.id,owner:'tester',visibility:'team'});
    HNXTASKWIZ.open();await sleep(400);const tiles=tileIds();HNXTASKWIZ.close();
    switchView('task_tracker');await sleep(800);try{renderTaskTracker();}catch(e){}await sleep(300);const v=document.getElementById('view-task_tracker');
    const inj1=v.querySelectorAll('img[src="x"]').length;const optRD=[...v.querySelectorAll('select option')].map(o=>o.textContent.trim()).find(t=>/R&D lab/.test(t))||'';
    const L=HNXSUBJ.label;HNXSUBJ.label=()=>'<img src=x onerror=__y=1>';try{renderTaskTracker();}catch(e){}await sleep(300);
    const inj2=v.querySelectorAll('img[src="x"]').length,shown=/<img src=x/.test(v.innerText);HNXSUBJ.label=L;try{renderTaskTracker();}catch(e){}
    return {canAdd,bad:bad.reason,quote:q.reason,ok:ok.ok&&ok.id,ren:ren.reason,evil,tilesEvil:tiles.includes('subj-evil'),inj1,inj2,shown,x:typeof window.__x,y:typeof window.__y,optRD};`),
  expect:{canAdd:true,bad:'bad-name',quote:'bad-name',ok:'subj-r-and-d-lab',ren:'bad-name',evil:{get:null,label:'Evil',listed:false},tilesEvil:false,inj1:0,inj2:0,shown:true,x:'undefined',y:'undefined',optRD:'🚩 R&D lab'} },

{ name:"🏷 Subjects data (v23.24 review): rename 'Seedling nursery' → 'Plant nursery', then add 'Seedling nursery' again → a 2nd subject subj-seedling-nursery-2 (it failed silently); the Production badge counts only tester's own task (1, not 4); Nexi's brief, the calendar Day card and the Audit log say 'Plant nursery', never 'subj-'; a v22.74 save that re-filed the task as General is restored by the editor; a deliberate General clears t.subj",
  requires:REQ, seed:SEED,
  run:fn(`await sleep(1500);const a=HNXSUBJ.add({name:'Seedling nursery',icon:'seedling',color:'#43a047'});const ren=HNXSUBJ.edit(a.id,{name:'Plant nursery'});const b=HNXSUBJ.add({name:'Seedling nursery',icon:'seedling'});
    HNXTASKWIZ.open();await sleep(400);const ids=tileIds();HNXTASKWIZ.close();
    ['jinky','jinky','jinky'].forEach((o,i)=>HNXTASKS.create({title:'Theirs '+i,module:'production',owner:o,visibility:'team'}));HNXTASKS.create({title:'Mine',module:'production',owner:'tester',visibility:'team'});
    HNXTASKWIZ.open();await sleep(400);const pt=W().querySelector('.tw-tile[data-m="production"]');const badge=pt.getAttribute('data-n'),tip=pt.title;HNXTASKWIZ.close();
    const t=HNXTASKS.create({title:'Water the seedlings',module:a.id,owner:'tester',visibility:'team',due:today,dueTime:'09:00'});
    HNXPA.open('pa_day');await sleep(600);const pa=((document.getElementById('view-pa_day')||{}).innerText||'').split('\\n').find(l=>/09:00/.test(l)&&/Water the seedlings/.test(l)&&/·/.test(l))||'';
    const box=document.createElement('div');box.innerHTML=HNXCAL2.html({key:'v2280r',mode:'day',events:loadCalEvents()});const day=box.textContent||'';
    switchView('audit');await sleep(500);const audit=(document.getElementById('auditTable')||{}).textContent||'';
    const s0=HNXTASKS.load().find(x=>x.id===t.id);const arr=HNXTASKS.load();arr.find(x=>x.id===t.id).module='general';localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(arr));
    HNXTASKS.drawer(t.id);await sleep(200);const sel=document.getElementById('tkM');const shownSel=sel&&sel.value;HNXTASKS.save(t.id);await sleep(200);const s1=HNXTASKS.load().find(x=>x.id===t.id);
    HNXTASKS.update(t.id,{module:'general'});const s2=HNXTASKS.load().find(x=>x.id===t.id);
    return {ren:ren.ok,b:b.ok&&b.id,both:[a.id,b.id].every(x=>ids.includes(x)),names:[HNXSUBJ.label(a.id),HNXSUBJ.label(b.id)],badge,tip,
      brief:/Plant nursery/.test(pa)&&!/subj-/.test(pa),dayCard:/Plant nursery/.test(day)&&!/subj-/.test(day),audit:/Plant nursery/.test(audit)&&!/subj-seedling/.test(audit),
      subjField:s0.subj,shownSel,restored:[s1.module,s1.subj],cleared:[s2.module,s2.subj]};`),
  expect:{ren:true,b:'subj-seedling-nursery-2',both:true,names:['Plant nursery','Seedling nursery'],badge:'1',tip:'1 open task of yours here',brief:true,dayCard:true,audit:true,
    subjField:'subj-seedling-nursery',shownSel:'subj-seedling-nursery',restored:['subj-seedling-nursery','subj-seedling-nursery'],cleared:['general','']} },

{ name:'🎞 Hover-out + ➕ dialog (v23.24 review): leaving Payroll mid-stamp keeps the SAME running stamp animation (h3-fin, still pressed down — it used to snap back in one frame) and the story stops at rest within 20 s with no class left; with the ➕ dialog open 0 grid CSS animations run (all paused, h3-hold; a 0.15 s hover transition is not a picture animation), and after Cancel ≥ 20 tiles sway again',
  requires:REQ, seed:SEED,
  drive:async pg=>{
    const ev=f=>pg.evaluate('(async()=>{'+'const sleep=ms=>new Promise(r=>setTimeout(r,ms));'+H+f+'})()');
    const cdp=await pg.context().newCDPSession(pg);await cdp.send('Animation.enable');
    await ev('HNXTASKWIZ.open();await sleep(1500);return 1;');
    const box=await ev('const r=W().querySelector(\'.tw-tile[data-m="payroll"]\').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};');
    /* a loaded test box draws ~1 frame a second and hands animation events out a frame late: slow the animation clock 50× BEFORE hovering,
       so no stale animationiteration (from a cycle that ended before the pointer left) reaches the page after it */
    await cdp.send('Animation.setPlaybackRate',{playbackRate:.02});
    await pg.mouse.move(box.x-12,box.y);await pg.mouse.move(box.x,box.y,{steps:3});
    let run=false;for(let k=0;k<24&&!run;k++){await pg.waitForTimeout(250);run=await ev('const e=W().querySelector(\'.tw-tile[data-m="payroll"] .m-stamp\');return e.getAnimations().length>0;');}
    const a=await ev('const e=W().querySelector(\'.tw-tile[data-m="payroll"] .m-stamp\');const an=e.getAnimations()[0];an.currentTime=1800;window.__an=an;return {t:getComputedStyle(e).transform};');
    await pg.mouse.move(5,5);
    const b=await ev('const h=W().querySelector(\'.tw-tile[data-m="payroll"] .h3\'),e=h.querySelector(".m-stamp");return {fin:h.classList.contains("h3-fin"),same:e.getAnimations()[0]===window.__an,state:window.__an.playState,t:getComputedStyle(e).transform};');
    await cdp.send('Animation.setPlaybackRate',{playbackRate:1});
    let c;for(let k=0;k<40;k++){await pg.waitForTimeout(500);c=await ev('const h=W().querySelector(\'.tw-tile[data-m="payroll"] .h3\'),e=h.querySelector(".m-stamp");return {fin:h.classList.contains("h3-fin"),anims:e.getAnimations().length,t:getComputedStyle(e).transform,z:h.querySelectorAll(".h3-z").length};');if(!c.fin)break;}
    await ev('HNXSUBJ.openAdd();await sleep(1200);return 1;');
    const d=await ev('const g=W().querySelector(".tw-grid");const A=document.getAnimations().filter(a=>a.animationName&&a.effect&&a.effect.target&&g.contains(a.effect.target));return {running:A.filter(a=>a.playState==="running").length,names:A.filter(a=>a.playState==="running").map(a=>a.animationName),paused:A.filter(a=>a.playState==="paused").length,hold:W().classList.contains("h3-hold"),onScreen:HNX3D.stats().onScreen,dialog:document.querySelectorAll(".tw-sub .h3").length};');
    await ev('HNXSUBJ.close();await sleep(900);return 1;');
    const e=await ev('return {sway:swaying(),hold:W().classList.contains("h3-hold")};');
    await ev('HNXTASKWIZ.close();return 1;');
    return {pressed:a.t!=='none',fin:b.fin,sameAnim:b.same,state:b.state,stillPressed:b.t!=='none',endFin:c.fin,endAnims:c.anims,endPose:c.t,endZ:c.z,
      gridRunning:d.running,gridRunningNames:d.names,gridPaused:d.paused>20,hold:d.hold,onScreenDialogOnly:d.onScreen<=d.dialog,sway20:e.sway>=20,holdAfter:e.hold};
  },
  expect:{'drive.pressed':true,'drive.fin':true,'drive.sameAnim':true,'drive.state':'running','drive.stillPressed':true,'drive.endFin':false,'drive.endAnims':0,'drive.endPose':'none','drive.endZ':0,
    'drive.gridRunning':0,'drive.gridRunningNames':[],'drive.gridPaused':true,'drive.hold':true,'drive.onScreenDialogOnly':true,'drive.sway20':true,'drive.holdAfter':false} },

{ name:"🌗 Light theme + labels + badge (v23.24 review, 400 px): in light the IT cloud / Meetings bubble get an outline, the Production arch shows (opacity .6), the Safety beam is amber; the chosen tile's name reads ≥ 4.5 : 1 on every desk and on 10 subject colours, light and dark; the '99+' badge (z-index 3) on Quality Control touches no part of the picture",
  requires:REQ, seed:SEED_Q, viewport:{width:400,height:860},
  run:fn(`await sleep(1500);HNX_LITE.set(true,true);hnxSetTheme('light');
    const SW=['#43a047','#8bc34a','#00acc1','#1e88e5','#3949ab','#8e24aa','#e91e63','#e53935','#fb8c00','#fdd835'],NM=['Nursery','Cold room','Visitors','Solar field','Export','Welfare','Storage yard','Launch','Ideas','Goals'];
    const added=SW.map((c,i)=>HNXSUBJ.add({name:NM[i],color:c}).ok).filter(Boolean).length;
    HNXTASKWIZ.open();await sleep(700);
    const g=sel=>W().querySelector(sel),cs=(sel,p)=>getComputedStyle(g(sel))[p];
    const lightParts={cloud:cs('.tw-tile[data-m="it"] .lc','stroke')!=='none',bubble:cs('.tw-tile[data-m="meetings"] .lc','stroke')!=='none',arch:cs('.tw-tile[data-m="production"] .gh','opacity'),archStroke:cs('.tw-tile[data-m="production"] .gh','stroke'),beam:cs('.tw-tile[data-m="safety"] .bm','fill')};
    const q=g('.tw-tile[data-m="quality"]'),pa=getComputedStyle(q,'::after'),r=q.getBoundingClientRect(),z=r.width/q.offsetWidth;
    const B={t:r.top+parseFloat(pa.top)*z,l:r.right-(parseFloat(pa.right)+parseFloat(pa.width))*z};B.b=B.t+parseFloat(pa.height)*z;B.r=B.l+parseFloat(pa.width)*z; /* the ::after box (CSS px × page zoom) */
    let hits=0;q.querySelectorAll('.h3 svg path,.h3 svg circle,.h3 svg ellipse,.h3 svg rect').forEach(e=>{const x=e.getBoundingClientRect();if(!x.width&&!x.height)return;if(x.left<B.r&&x.right>B.l&&x.top<B.b&&x.bottom>B.t)hits++;});
    const badge={n:q.getAttribute('data-n'),z:pa.zIndex,hits};
    const minC=()=>{let m=99,worst='';tileIds().filter(x=>x!=='__add').forEach(id=>{HNXTASKWIZ.set('module',id);const t=g('.tw-tile[data-m="'+id+'"]'),n=t.querySelector('.n');
      const c=contrast(rgba(getComputedStyle(n).color),bgOf(t));if(c<m){m=c;worst=id;}});return {min:Math.round(m*100)/100,worst};};
    const light=minC();hnxSetTheme('dark');await sleep(300);const dark=minC();HNXTASKWIZ.close();HNX_LITE.set(false,true);
    return {added,lightParts,badge,light45:light.min>=4.5,dark45:dark.min>=4.5,light,dark};`),
  expect:{added:10,'lightParts.cloud':true,'lightParts.bubble':true,'lightParts.arch':'0.6','lightParts.archStroke':'rgb(120, 144, 156)','lightParts.beam':'rgb(255, 143, 0)',
    'badge.n':'99+','badge.z':'3','badge.hits':0,light45:true,dark45:true} },
];
