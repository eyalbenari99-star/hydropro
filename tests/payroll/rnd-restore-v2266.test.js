/* v22.66 (Eyal, 12 Oct 2026: "where is the r&d old module gone. I need it back it was there 1-2 months ago with all the board and
   images and all"). Nothing was deleted from the code, but since v18.96 (9 Sep) every module — R&D too — opened on a "🧠 AI Brain"
   summary first, the Engineering Board drew an empty grid after a reload when a drawing held a picture, and the storage cleaners
   turned R&D pictures into cloud pointers the boards could not draw. This suite holds the restore:
   · 📐 R&D & Planning and 🚀 R&D PRO open on their boards again (the cockpit is the 2nd screen); every other module still opens on
     its cockpit, and a jump to rnd_brain from another module still opens the R&D cockpit;
   · an Engineering Board drawing with a picture opens drawn after a reload, also when the picture lives in the cloud (r2img:);
   · the cleaners (Storage X-ray, AutoVault photo mover, v28 strip) leave R&D drawings alone;
   · 📜 Recover R&D from cloud copies adds back only records missing here, never changes or deletes, and can be undone. */
const PNG2='(()=>{const c=document.createElement("canvas");c.width=c.height=2;const x=c.getContext("2d");x.fillStyle="#d32f2f";x.fillRect(0,0,2,2);return c;})()';
module.exports=[
{ name:'📐 R&D lands on rnd_home again; list = rnd_home, rnd_brain, rnd_calendar; still rnd_home after 3 s (v22.66)',
  run:async()=>{
    await sleep(6000);
    switchModule('rnd');await sleep(3000);
    const act=document.querySelector('#appMain .view.active')||document.querySelector('.view.active');
    return {cv:window.currentView,active:act&&act.id,ids:getVisibleViews('rnd').map(v=>v.id)};},
  expect:{cv:'rnd_home',active:'view-rnd_home',ids:['rnd_home','rnd_brain','rnd_calendar']} },

{ name:'🚀 R&D PRO lands on rndpro_home, cockpit second (rndpro_home, rndpro_brain) (v22.66)',
  run:async()=>{
    await sleep(6000);
    switchModule('rndpro');await sleep(2500);
    const cv=window.currentView,ids=getVisibleViews('rndpro').map(v=>v.id);
    /* the PRO overlay opens by itself on its home screen — close it */
    for(let i=0;i<20&&!document.querySelector('.rnd-shell,.rnd-studio');i++)await sleep(250);
    try{const x=document.getElementById('hnxRndProExit');if(x)x.click();}catch(e){}
    await sleep(500);
    return {cv,first:ids[0],second:ids[1]};},
  expect:{cv:'rndpro_home',first:'rndpro_home',second:'rndpro_brain'} },

{ name:'🧠 Other modules still open on their cockpit first (Production, HR, Projects → [true,true,true]) (v22.66)',
  run:async()=>{
    await sleep(6000);
    return {brainFirst:['production','hr','projects'].map(m=>/_brain$/.test((getVisibleViews(m)[0]||{}).id||''))};},
  expect:{brainFirst:[true,true,true]} },

{ name:'🧠 The R&D cockpit is still reachable from another module: Overview → switchView(rnd_brain) opens the R&D cockpit (v22.66)',
  run:async()=>{
    await sleep(6000);
    switchModule('overview');await sleep(800);
    switchView('rnd_brain');await sleep(1500);
    const b=document.getElementById('hnxModBrainView'),btn=document.querySelector('.module-btn.active');
    return {cv:window.currentView,mod:(typeof currentModule!=='undefined'?currentModule:null)||(btn&&btn.id.replace('modBtn-','')),
      brainOn:!!(b&&b.classList.contains('active')),ck:!!document.querySelector('#hnxModBrainView .ceack[data-mod="rnd"]')};},
  expect:{cv:'rnd_brain',mod:'rnd',brainOn:true,ck:true} },

{ name:'🖼 Engineering Board with 1 picture + 1 line opens drawn after reload; saved objs carry no _el (2 objects, 1 picture ready) (v22.66)',
  run:new Function(`return (async()=>{
    await sleep(3000);
    const png=${PNG2}.toDataURL('image/png');
    localStorage.setItem('hydroPro_rnd2_boards_v1',JSON.stringify([{id:'b2_t1',title:'T',objs:[{id:'o1',t:'img',x:0,y:0,w:2,h:2,src:png,opacity:1,_el:{}},{id:'o2',t:'line',x:0,y:0,w:50,h:50}],versions:[]}]));
    RND2.openStudio();let threw=false;try{RND2.open('b2_t1');}catch(e){threw=true;}
    await sleep(800);
    let d={};try{d=RND2._diag();}catch(e){d={err:String(e).slice(0,80)};}
    try{RND2.save(true);}catch(e){}
    const B=(JSON.parse(localStorage.getItem('hydroPro_rnd2_boards_v1')||'[]')||[]).find(b=>b&&b.id==='b2_t1')||{};
    const elSaved=(B.objs||[]).some(o=>'_el' in o);
    try{RND2.close();}catch(e){}
    return {threw,n:d.n,imgs:d.imgs,elSaved};})()`),
  expect:{threw:false,n:2,imgs:[true],elSaved:false} },

{ name:'☁ Engineering Board draws an r2img: picture from the cloud (asks for migrated/hydroPro_rnd2_boards_v1/t.png, 1 picture ready, src kept as r2img:); without a token it opens with the "picture in cloud" box and no error (v22.66)',
  run:new Function(`return (async()=>{
    await sleep(3000);
    const blob=await new Promise(r=>${PNG2}.toBlob(r,'image/png'));
    const of=window.fetch;let asked=null;
    window.fetch=function(u,o){const s=String(u);
      if(s.indexOf('/r2/file?key=')>-1){const k=decodeURIComponent(s.split('key=')[1].split('&')[0]);
        if(k.indexOf('migrated/hydroPro_rnd2_boards_v1/')===0){asked=asked||k;return Promise.resolve(new Response(blob,{status:200,headers:{'Content-Type':'image/png'}}));}}
      return of.apply(this,arguments);};
    const board=(id,f)=>({id,title:id,objs:[{id:'o1',t:'img',x:0,y:0,w:40,h:40,src:'r2img:migrated/hydroPro_rnd2_boards_v1/'+f,opacity:1,_el:{}}],versions:[]});
    localStorage.setItem('hydroPro_rnd2_boards_v1',JSON.stringify([board('b2_c1','t.png'),board('b2_c2','t2.png')]));
    localStorage.setItem('hnx_cloud_token','test-token');
    RND2.openStudio();let threw=false;try{RND2.open('b2_c1');}catch(e){threw=true;}
    await sleep(1200);
    let d={};try{d=RND2._diag();}catch(e){d={err:String(e).slice(0,80)};}
    try{RND2.save(true);}catch(e){}
    const src=((((JSON.parse(localStorage.getItem('hydroPro_rnd2_boards_v1')||'[]')||[]).find(b=>b&&b.id==='b2_c1')||{}).objs||[])[0]||{}).src;
    /* no cloud sign-in on this computer: the picture cannot be fetched — the board still opens, with the box */
    localStorage.removeItem('hnx_cloud_token');
    let threw2=false;try{RND2.open('b2_c2');}catch(e){threw2=true;}
    await sleep(800);
    let d2={};try{d2=RND2._diag();}catch(e){d2={err:String(e).slice(0,80)};}
    const box=!!(RND2._state().objs[0]||{})._cloudErr;
    try{RND2.close();}catch(e){}
    window.fetch=of;
    return {threw,asked,imgs:d.imgs,srcKept:src==='r2img:migrated/hydroPro_rnd2_boards_v1/t.png',noTok:{threw:threw2,imgs:d2.imgs,box}};})()`),
  expect:{threw:false,asked:'migrated/hydroPro_rnd2_boards_v1/t.png',imgs:[true],srcKept:true,noTok:{threw:false,imgs:[false],box:true}} },

{ name:'🧹 Cleaners leave R&D drawings alone: Storage X-ray + photo mover move the control store\'s photo to the cloud but not an Engineering Board picture or an R&D PRO drawing (v22.66)',
  run:async()=>{
    await sleep(2500);
    const photo=i=>{const c=document.createElement('canvas');c.width=c.height=320;const x=c.getContext('2d');for(let y=0;y<320;y+=4)for(let z=0;z<320;z+=4){x.fillStyle='rgb('+((y*7+z*13+i*31)%255)+','+((y*z+i)%255)+','+((z*3+i*17)%255)+')';x.fillRect(z,y,4,4);}return c.toDataURL('image/jpeg',0.95);};
    localStorage.setItem('hydroPro_rnd2_boards_v1',JSON.stringify([{id:'b2_p',title:'P',objs:[{id:'o1',t:'img',x:0,y:0,w:320,h:320,src:photo(1),opacity:1}],versions:[]}]));
    localStorage.setItem('hnx-rnd-pro:p1',JSON.stringify({id:'p1',sheet:{bg:photo(2)},notes:'x'.repeat(30000)}));
    localStorage.setItem('hydroPro_test_photos_v1',JSON.stringify([{id:'x1',img:photo(3),notes:'m'.repeat(30000)}]));
    localStorage.setItem('hnx_cloud_token','test-token');
    const of=window.fetch;
    window.fetch=function(u,o){if(String(u).indexOf('/r2/upload')>-1)return new Promise(r=>setTimeout(()=>r(new Response('{"ok":true}',{status:200,headers:{'Content-Type':'application/json'}})),100));return of.apply(this,arguments);};
    const has=k=>(localStorage.getItem(k)||'').indexOf('data:image/')>-1;
    try{hnxStorageClean(true);}catch(e){}
    try{__hnxAUTOVAULT.run();}catch(e){}
    for(let i=0;i<300&&has('hydroPro_test_photos_v1');i++)await sleep(100);
    /* a second round of both, so a store skipped only because the first was busy would be caught */
    try{hnxStorageClean(true);}catch(e){}
    try{__hnxAUTOVAULT.run();}catch(e){}
    await sleep(6000);
    window.fetch=of;localStorage.removeItem('hnx_cloud_token');
    return {rnd2Kept:has('hydroPro_rnd2_boards_v1'),proKept:has('hnx-rnd-pro:p1'),controlMoved:!has('hydroPro_test_photos_v1')&&/r2img:/.test(localStorage.getItem('hydroPro_test_photos_v1')||'')};},
  expect:{rnd2Kept:true,proKept:true,controlMoved:true} },

{ name:'✂ v28 never strips R&D drawings, even with the browser store full (3 items × 12 objects stay 12/12/12) (v22.66)',
  seed:function(){
    Object.defineProperty(window,'__hnxStoreLimit',{configurable:true,get:function(){return 1;},set:function(){}});
    var mk=function(n,d){var o=[];for(var i=0;i<12;i++)o.push({id:'s'+n+'_'+i,type:'rect',x:i*10,y:i*10,w:10,h:10});return {id:'rnd_v28_'+n,title:'V28 '+n,subjectId:'plumbing',updatedAt:d,createdAt:d,scene:{objects:o}};};
    localStorage.setItem('hydroPro_rnd_items_v1',JSON.stringify([mk(1,'2026-09-01T10:00:00.000Z'),mk(2,'2026-09-02T10:00:00.000Z'),mk(3,'2026-09-03T10:00:00.000Z')]));
  },
  run:async()=>{
    await sleep(1000);
    const It=JSON.parse(localStorage.getItem('hydroPro_rnd_items_v1')||'[]')||[];
    return {v28ran:!!(window.HnxV28&&!window.HnxV28.skipped),
      counts:['rnd_v28_1','rnd_v28_2','rnd_v28_3'].map(id=>{const x=It.find(i=>i&&i.id===id);return x&&x.scene&&x.scene.objects?x.scene.objects.length:-1;})};},
  expect:{v28ran:true,counts:[12,12,12]} },

{ name:'📜 Recover adds only what is missing: device copy 2026-09-05 has items a,b,c + board x; here only a → +2 items, +1 board, a keeps its title, employees untouched, undo restores 1 item; an operator is refused (v22.66)',
  seed:function(){var U=JSON.parse(localStorage.getItem('hydroPro_users'));U.push({username:'op1',fullname:'Operator One',passwordHash:'x',role:'operator',department:'production',departments:['production'],active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));},
  run:async()=>{
    await sleep(3000);
    localStorage.setItem('hydroPro_rnd_items_v1',JSON.stringify([{id:'rnd_a',title:'A'}]));
    localStorage.removeItem('hydroPro_rnd2_boards_v1');
    const empBefore=localStorage.getItem('hydroPro_employees');
    await HNXIDB.put('hydroPro_autobackup_2026-09-05',{exportedAt:1,source:'auto-daily',data:{
      hydroPro_rnd_items_v1:'[{"id":"rnd_a","title":"A-old"},{"id":"rnd_b"},{"id":"rnd_c"}]',
      hydroPro_rnd2_boards_v1:'[{"id":"b2_x","title":"X","objs":[]}]',
      hydroPro_employees:'[]'}});
    localStorage.setItem('hnx_cloud_token','test-token');
    const of=window.fetch;
    const J=o=>Promise.resolve(new Response(JSON.stringify(o),{status:200,headers:{'Content-Type':'application/json'}}));
    window.fetch=function(u,o){const s=String(u);
      if(s.indexOf('/sync/pull?keys=hydroPro_rnd_items_v1_backup')>-1)return J({data:{},count:0});
      if(s.indexOf('/sync/versions?key=hydroPro_rnd')>-1)return J({key:'x',versions:[]});
      if(s.indexOf('/r2/list?')>-1)return J({files:[],count:0,truncated:false,cursor:null});
      return of.apply(this,arguments);};
    let S=null,err='';try{S=await hnxRndRecover.scan();}catch(e){err=String(e&&e.message||e).slice(0,100);}
    const src=S&&S.sources.find(s=>s.kind==='device'&&s.date==='2026-09-05');
    if(src)await hnxRndRecover.addMissing(src.id);
    const It=JSON.parse(localStorage.getItem('hydroPro_rnd_items_v1')||'[]'),Bo=JSON.parse(localStorage.getItem('hydroPro_rnd2_boards_v1')||'[]');
    const after={items:It.length,boards:Bo.length},aTitle=(It.find(x=>x.id==='rnd_a')||{}).title;
    const empUntouched=localStorage.getItem('hydroPro_employees')===empBefore;
    if(src)await hnxRndRecover.undo();
    const undoItems=(JSON.parse(localStorage.getItem('hydroPro_rnd_items_v1')||'[]')||[]).length;
    /* an operator may not use it */
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'op1',loginAt:Date.now()}));
    let denied=false;try{await hnxRndRecover.scan();}catch(e){denied=true;}
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));
    window.fetch=of;localStorage.removeItem('hnx_cloud_token');
    return {err,found:!!src,missing:src&&src.missing,after,aTitle,empUntouched,undoItems,denied};},
  expect:{err:'',found:true,missing:{items:2,boards:1},after:{items:3,boards:1},aTitle:'A',empUntouched:true,undoItems:1,denied:true} },
];
