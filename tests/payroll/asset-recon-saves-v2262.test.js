/* v22.62 (Eyal 12 Oct, Accounting → 🏗 Assets: "still some not save and i saved again and again"). Two investigations reproduced
   the causes on the real page: (1) answers, 🧠 picks and record fields saved only through a 450 ms timer that read the box when it
   fired — a tab switch, exists/gone, 💾, 💾 Save now or a reload inside the pause lost the text (or stored ''); next ▶ inside the
   pause wrote the NEXT record's fields under the previous record and ✕ back wrote edits[ref]={}; the first ➕ question took #13
   like the built-in; the title never counted down and the % could not reach 100; a failed save still said "✓ saved"; (2) across
   computers the generic merge kept the LARGER value, not the newer one, and every computer re-uploaded its whole copy every
   30 min, so old values kept coming back. Now: every answer / field is captured at the keystroke and flushed before anything
   redraws or leaves; every mark carries a stamp and hydroPro_asset_recon_v1 merges mark by mark (newest wins) on every pull.
   Real counts: 248 assets · 202 need a correction · 27 pink (existence) · 13 questions → 242 progress units. */
const SEED=function(){
  if(localStorage.getItem('hnx_t_ar2256s'))return;
  localStorage.setItem('hnx_t_ar2256s','1');
  localStorage.setItem('hydroPro_asset_recon_v1',JSON.stringify({fixes:{},answers:{},eba:{},signoff:{},v:1,
    lastAutoRecon:Date.now(),subAuto:{at:1,n:0,by:{},refs:[],rules:2}}));
};
const K='hydroPro_asset_recon_v1',BK='hydroPro_asset_recon_bak_v1';
const OPEN=`
  const K='hydroPro_asset_recon_v1',BK='hydroPro_asset_recon_bak_v1';
  const rd=()=>JSON.parse(localStorage.getItem(K));
  const V=()=>document.getElementById('view-acct_assets');
  const openTab=async t=>{switchView('acct_assets');await sleep(1200);hnxArTab(t);await sleep(500);};
  const title=()=>{const b=V().querySelector('[data-ar-qtitle]');return b?b.textContent:'(none)';};
  const askOpt=()=>{const o=V().querySelector('[data-ar-opt="ask"]');return o?o.textContent:'(none)';};
  const selText=k=>{const s=document.getElementById('arAnsSel'+k);return s?s.options[s.selectedIndex].text:'(none)';};
  const mark=k=>{const m=document.getElementById('arAnsMark'+k);return m?m.textContent:'(none)';};
`;
const REQ="typeof window.__hnxMergeAssetRecon==='function'&&typeof window.hnxArFlush==='function'";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=[
{ name:'⌨ typed answer + tab switch within 100 ms is stored ("Typed then switched tab" in #3); typed #7 + exists on #104 at once → #7 stored and shown with ✓ saved; 🧠 pick on #1 + typed #4 + reload within 100 ms → both there after the reload (v22.62)',
  seed:SEED, requires:REQ,
  drive:async pg=>{
    const ev=(src)=>pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+src+`})()`));
    await ev(`await sleep(4000);await openTab('ask');`);
    /* 1. type, then switch tab with the drop box inside the pause */
    await pg.click('#arAns3');await pg.keyboard.type('Typed then switched tab',{delay:8});
    await pg.selectOption('#view-acct_assets select[onchange="hnxArTab(this.value)"]','ov');
    await pg.waitForTimeout(700);
    const a3=await ev(`return rd().answers['3']||null;`);
    /* 2. type, then press exists on #104 (a render from another action) inside the pause */
    await ev(`hnxArTab('ask');await sleep(400);`);
    await pg.click('#arAns7');await pg.keyboard.type('Typed then pressed exists',{delay:8});
    await pg.click('#view-acct_assets button[onclick="hnxArEba(104,\'yes\')"]');
    await pg.waitForTimeout(700);
    const r7=await ev(`const s=rd();return {a7:s.answers['7']||null,eba104:s.eba['104'],box:document.getElementById('arAns7').value,mark:mark(7)};`);
    /* 3. pick #1 from 🧠 (stored at once), type #4 (timer pending), reload at once: the typed text goes in on pagehide */
    await pg.selectOption('select[onchange^="hnxArAnsPick(1,"]',{index:1});
    await pg.click('#arAns4');await pg.keyboard.type('Typed then reloaded',{delay:8});
    await pg.reload({waitUntil:'domcontentloaded',timeout:180000});
    await pg.waitForTimeout(22000);
    const after=await ev(`const s=rd();return {a1:s.answers['1']||null,a4:s.answers['4']||null,a3:s.answers['3']||null,a7:s.answers['7']||null,
      stamped:['answers.1','answers.3','answers.4','answers.7','eba.104'].filter(p=>/^\\d{13}:/.test(String((s._ts||{})[p]||''))).length};`);
    return {a3,r7,after};
  },
  expect:{'drive.a3':'Typed then switched tab','drive.r7.a7':'Typed then pressed exists','drive.r7.eba104':'yes','drive.r7.box':'Typed then pressed exists','drive.r7.mark':'✓ saved',
    'drive.after.a1':'Yes — the repeated GL lines are duplicates: keep ONE line per unit and write the rest off','drive.after.a4':'Typed then reloaded',
    'drive.after.a3':'Typed then switched tab','drive.after.a7':'Typed then pressed exists','drive.after.stamped':5} },

{ name:'📇 record #26 CM-700D ₱103,180.16: cost typed 123456 then next ▶ at once → edits[26].cost 123456 with loc "Warehouse 2" + supplier "ACME Supply" kept, #27 STIHL ₱17,538.27 untouched (no edits[27]); typed into notes then ✕ back at once → the 4 earlier fields of #26 kept, never {} (v22.62)',
  seed:SEED, requires:REQ,
  drive:async pg=>{
    const ev=(src)=>pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+src+`})()`));
    await ev(`await sleep(4000);switchView('acct_assets');await sleep(1200);hnxArGo(26);await sleep(800);`);
    await pg.click('#arE_loc');await pg.keyboard.type('Warehouse 2',{delay:8});await pg.waitForTimeout(900);
    await pg.click('#arE_supplier');await pg.keyboard.type('ACME Supply',{delay:8});await pg.waitForTimeout(900);
    const e0=await ev(`return rd().edits['26'];`);
    /* edit the cost, then next ▶ inside the pause */
    await ev(`const i=document.getElementById('arE_cost');i.focus();i.select();`);
    await pg.keyboard.type('123456',{delay:8});
    await pg.click('button[onclick="hnxArNext()"]');
    await pg.waitForTimeout(1000);
    const e1=await ev(`const s=rd();return {c26:s.edits['26'].cost,l26:s.edits['26'].loc,s26:s.edits['26'].supplier,has27:!!s.edits['27'],
      formRef:document.getElementById('arFocus').getAttribute('data-ref'),formDesc:document.getElementById('arE_desc').value,formCost:document.getElementById('arE_cost').value};`);
    /* back on #26 the form shows the edited cost and its own name */
    await ev(`hnxArGo(26);await sleep(700);`);
    const back=await ev(`return {desc:document.getElementById('arE_desc').value,cost:document.getElementById('arE_cost').value};`);
    /* type into notes, then ✕ back inside the pause */
    await pg.click('#arE_notes');await pg.keyboard.press('End');await pg.keyboard.type(' NOTE-26',{delay:8});
    await pg.click('button[onclick="hnxArUnfocus()"]');
    await pg.waitForTimeout(1000);
    const e2=await ev(`const s=rd(),e=s.edits['26']||{};return {desc:e.desc,loc:e.loc,supplier:e.supplier,notesEnd:/ NOTE-26$/.test(e.notes||''),cost:e.cost,nFields:Object.keys(e).length,has27:!!s.edits['27'],
      stamped:['edits.26.cost','edits.26.loc','edits.26.notes','edits.26.supplier'].every(p=>/^\\d{13}:/.test(String((s._ts||{})[p]||''))),n27:Object.keys(s._ts||{}).filter(p=>/^edits\\.27\\./.test(p)).length};`);
    return {e0:{loc:e0.loc,supplier:e0.supplier},e1,back,e2};
  },
  expect:{'drive.e0.loc':'Warehouse 2','drive.e0.supplier':'ACME Supply',
    'drive.e1.c26':'123456','drive.e1.l26':'Warehouse 2','drive.e1.s26':'ACME Supply','drive.e1.has27':false,'drive.e1.formRef':'27','drive.e1.formDesc':'STIHL 4134 200 0240 FS120 BRUSH CUTTER','drive.e1.formCost':'17538.27',
    'drive.back.desc':'CM-700D','drive.back.cost':'123456',
    'drive.e2.desc':'CM-700D','drive.e2.loc':'Warehouse 2','drive.e2.supplier':'ACME Supply','drive.e2.notesEnd':true,'drive.e2.cost':'123456','drive.e2.nFields':10,'drive.e2.has27':false,
    'drive.e2.stamped':true,'drive.e2.n27':0} },

{ name:'➕ the first custom question is #14 (built-in #13 exists): answering it stores answers["cq14-…"] and leaves #13 "Jinky traces…" alone; its 🧠 pick does not touch #13 either; removing it keeps #13\'s answer and drops its own (v22.62)',
  seed:SEED, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(4000);await openTab('ask');
    document.getElementById('arQText').value='Custom question from tester?';document.getElementById('arQSugg').value='Alpha|Beta';
    hnxArQAdd();await sleep(500);
    const q=rd().customQs[0];
    const key='c'+q.id;
    /* built-in #13 from its drop box */
    hnxArAnsPick(13,{value:'Jinky traces each original entry and RE-POSTS the depreciation as a credit, entry by entry'});await sleep(300);
    /* the custom one typed */
    const inp=document.getElementById('arAns'+key);inp.value='Custom answer typed';hnxArAnsTouch(key);await sleep(700);
    const s1=rd();
    const a1={no:q.no,idPrefix:q.id.slice(0,4),boxes13:document.querySelectorAll('[id="arAns13"]').length,a13:s1.answers['13'],ac:s1.answers[key],num14:s1.answers['14']===undefined};
    /* a pick in the custom drop box */
    hnxArAnsPick(key,{value:'Beta'});await sleep(300);
    const s2=rd();const a2={a13:s2.answers['13'],ac:s2.answers[key],title:title()};
    /* remove it */
    hnxArQDel(q.no);await sleep(500);
    const s3=rd();
    return {a1,a2,after:{qs:(s3.customQs||[]).length,a13:s3.answers['13'],ac:s3.answers[key]===undefined,title:title()}};})()`),
  expect:{'a1.no':14,'a1.idPrefix':'q14-','a1.boxes13':1,'a1.a13':'Jinky traces each original entry and RE-POSTS the depreciation as a credit, entry by entry','a1.ac':'Custom answer typed','a1.num14':true,
    'a2.a13':'Jinky traces each original entry and RE-POSTS the depreciation as a credit, entry by entry','a2.ac':'Beta','a2.title':'❓ 12 of 14 still open — only Eyal can answer these',
    'after.qs':0,'after.a13':'Jinky traces each original entry and RE-POSTS the depreciation as a credit, entry by entry','after.ac':true,'after.title':'❓ 12 of 13 still open — only Eyal can answer these'} },

{ name:'➕ migration: a custom question stored as #13 (the old collision) is renumbered to #14 once after load; built-in #13 and the custom one both keep "shared answer"; the next ➕ question is #15 (v22.62)',
  seed:function(){
    if(localStorage.getItem('hnx_t_ar2256m'))return;
    localStorage.setItem('hnx_t_ar2256m','1');
    localStorage.setItem('hydroPro_asset_recon_v1',JSON.stringify({fixes:{},answers:{'13':'shared answer'},eba:{},signoff:{},v:1,
      lastAutoRecon:Date.now(),subAuto:{at:1,n:0,by:{},refs:[],rules:2},
      customQs:[{id:'q13-1760000000000',no:13,area:'GENERAL',q:'Old custom question?',stake:'',sugg:[],by:'jinky',at:1760000000000}]}));
  }, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(6000);
    const s=rd(),q=s.customQs[0];
    await openTab('ask');
    document.getElementById('arQText').value='Another one?';hnxArQAdd();await sleep(400);
    const s2=rd();
    return {no:q.no,a13:s.answers['13'],ac:s.answers['c'+q.id],boxes13:document.querySelectorAll('[id="arAns13"]').length,next:s2.customQs[1].no,title:title()};})()`),
  expect:{no:14,a13:'shared answer',ac:'shared answer',boxes13:1,next:15,title:'❓ 13 of 15 still open — only Eyal can answer these'} },

{ name:'❓ answering #8–#12 from 🧠 and #13 in own words → title "❓ 7 of 13 still open — only Eyal can answer these" updated in place (no redraw, focus kept) and after a redraw; drop box "❓ For Eyal (7 open)"; the own-words answer is the selected "✏ My own words" option, never an empty "Nexi suggests…" (v22.62)',
  seed:SEED, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(4000);await openTab('ask');
    const t0=title(),o0=askOpt();
    for(const n of [8,9,10,11,12]){const sel=document.getElementById('arAnsSel'+n);hnxArAnsPick(n,{value:sel.options[1].text});await sleep(150);}
    const inp=document.getElementById('arAns13');inp.focus();inp.value='My own words';hnxArAnsTouch(13);await sleep(700);
    const live={title:title(),opt:askOpt(),focus:document.activeElement===inp,sel13:selText(13),mark13:mark(13),ring:(V().querySelector('[data-ar-ring] text')||{}).textContent,
      ringN:(String((V().querySelector('[data-ar-ring] div')||{}).textContent).match(/(\\d+ of \\d+)$/)||[])[1]};
    hnxArTab('ov');await sleep(300);hnxArTab('ask');await sleep(400);
    const s=rd();
    return {t0,o0,live,redrawn:{title:title(),opt:askOpt(),sel13:selText(13),box13:document.getElementById('arAns13').value},a13:s.answers['13'],n:Object.keys(s.answers).length};})()`),
  expect:{t0:'❓ 13 of 13 still open — only Eyal can answer these',o0:'❓ For Eyal (13 open)',
    'live.title':'❓ 7 of 13 still open — only Eyal can answer these','live.opt':'❓ For Eyal (7 open)','live.focus':true,'live.sel13':'✏ My own words','live.mark13':'✓ saved','live.ring':'2%','live.ringN':'6 of 242',
    'redrawn.title':'❓ 7 of 13 still open — only Eyal can answer these','redrawn.opt':'❓ For Eyal (7 open)','redrawn.sel13':'✏ My own words','redrawn.box13':'My own words',a13:'My own words',n:6} },

{ name:'📈 recon % = corrections 202 + existence checks 27 + answers 13 = 242 units: everything done except 211/219/248 (pink only, no "mark done") → 239 of 242 = 99 %; exists on 211/219/248 → 242 of 242 = 100 % and the red WORK IN QUICKBOOKS banner is gone; exists on #104 alone moves it 0 → 1 of 242 (v22.62)',
  seed:SEED, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(4000);await openTab('ov');
    const p0=window._hnxArProgress();
    hnxArEba(104,'yes');await sleep(300);
    const p1=window._hnxArProgress();
    const s=rd();
    /* every asset with a "mark done" anywhere (all 11 tabs): done; every pink one except 211/219/248: exists; every question answered */
    const seen=[];for(const t of ['ov','new','recs','acct','qbr','je','reg','fix','disp','ask','sign']){hnxArTab(t);await sleep(400);V().querySelectorAll('button[onclick^="hnxArFix("]').forEach(b=>{seen.push(+b.getAttribute('onclick').match(/-?\\d+/)[0]);});}
    const refs=[...new Set(seen)];
    s.fixes={};refs.forEach(r=>{s.fixes[r]=1;});
    for(let n=1;n<=13;n++)s.answers[n]='Answered '+n;
    const pink=[104,105,107,108,110,111,200,201,207,208,210,211,212,215,216,218,219,220,221,222,223,228,234,235,236,238,248];
    s.eba={};pink.forEach(r=>{if([211,219,248].indexOf(r)<0)s.eba[r]='yes';});
    localStorage.setItem(K,JSON.stringify(s));
    const p2=window._hnxArProgress();
    hnxArTab('ov');await sleep(400);
    const banner2=!!V().querySelector('[data-ar-pct]'),pct2=(V().querySelector('[data-ar-pct]')||{}).textContent;
    hnxArEba(211,'yes');hnxArEba(219,'no');hnxArEba(248,'yes');await sleep(400);
    const p3=window._hnxArProgress();
    const banner3=!!V().querySelector('[data-ar-pct]'),ring3=(V().querySelector('[data-ar-ring] text')||{}).textContent;
    return {p0:{all:p0.all,doneAll:p0.doneAll,pct:p0.pct,tot:p0.tot,ebaTot:p0.ebaTot,qTot:p0.qTot},p1:{doneAll:p1.doneAll,ebaDone:p1.ebaDone,pct:p1.pct},reachable:refs.length,
      p2:{doneAll:p2.doneAll,done:p2.done,ebaDone:p2.ebaDone,qDone:p2.qDone,pct:p2.pct},banner2,pct2,p3:{doneAll:p3.doneAll,pct:p3.pct},banner3,ring3};})()`),
  expect:{'p0.all':242,'p0.doneAll':0,'p0.pct':0,'p0.tot':202,'p0.ebaTot':27,'p0.qTot':13,'p1.doneAll':1,'p1.ebaDone':1,'p1.pct':0,reachable:202,
    'p2.doneAll':239,'p2.done':202,'p2.ebaDone':24,'p2.qDone':13,'p2.pct':99,banner2:true,pct2:'🔧 WORK IN QUICKBOOKS — 99% done (239 of 242)',
    'p3.doneAll':242,'p3.pct':100,banner3:false,ring3:'100%'} },

{ name:'🛑 browser storage full: typed #2 + 💾 save → "⚠ NOT saved", the text "typed while full" stays in the box, the red DID NOT GO THROUGH banner shows; after freeing space a 🧠 pick on #3 carries #2 along and the banner is gone (v22.62)',
  seed:SEED, requires:REQ,
  drive:async pg=>{
    const ev=(src)=>pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+src+`})()`));
    await ev(`await sleep(4000);await openTab('ask');`);
    const fill=()=>ev(`const NS=window.__hnxNS||Storage.prototype.setItem;let n=0,size=512*1024,i=0;
      while(size>=1){const chunk='x'.repeat(size);try{NS.call(localStorage,'zz_fill_'+(i++),chunk);n+=size;}catch(e){size=size>>1;}}return n;`);
    const f1=await fill();
    await ev(`localStorage.removeItem(BK);`);const f2=await fill();
    await pg.click('#arAns2');await pg.keyboard.type('typed while full',{delay:5});
    await pg.click('button[onclick="hnxArAns(2)"]');await pg.waitForTimeout(900);
    const full=await ev(`const s=rd();return {stored:(s.answers||{})['2']===undefined?null:s.answers['2'],box:document.getElementById('arAns2').value,mark:mark(2),
      banner:[...V().querySelectorAll('b')].some(b=>/DID NOT GO THROUGH/.test(b.textContent))};`);
    await ev(`Object.keys(localStorage).filter(k=>/^zz_fill_/.test(k)).forEach(k=>localStorage.removeItem(k));`);
    await pg.selectOption('select[onchange^="hnxArAnsPick(3,"]',{index:1});await pg.waitForTimeout(800);
    const freed=await ev(`const s=rd();hnxArTab('ov');await sleep(300);hnxArTab('ask');await sleep(300);
      return {a2:s.answers['2'],a3:s.answers['3'],box:document.getElementById('arAns2').value,mark:mark(2),banner:[...V().querySelectorAll('b')].some(b=>/DID NOT GO THROUGH/.test(b.textContent))};`);
    return {filled:f1>0&&f2>=0,full,freed};
  },
  expect:{'drive.filled':true,'drive.full.stored':null,'drive.full.box':'typed while full','drive.full.mark':'⚠ NOT saved','drive.full.banner':true,
    'drive.freed.a2':'typed while full','drive.freed.a3':'Write it off — the concrete is poured and belongs to the building cost','drive.freed.box':'typed while full','drive.freed.mark':'✓ saved','drive.freed.banner':false} },

{ name:'☁ three computers on one mocked cloud: A answers #1 "Keep it" + 104 gone; B (its pull frozen on the old copy) marks #50 done and full-uploads its stale copy → A\'s next pull keeps "Keep it" + 104 gone and takes #50, then B has all three; the reverse order (B first, then A) loses nothing either; C on prev.html (v22.54, no stamps) full-uploads its stale whole copy → A and B still hold the stamped marks and the cloud is corrected (v22.62)',
  seed:SEED, requires:REQ,
  drive:async pg=>{
    const browser=pg.context().browser();
    const PORT=process.env.PORT||'8799',PAGE=process.env.NEXI_PAGE||'index.html';
    const USERS=[{username:'eyal',fullname:'Eyal',passwordHash:'x',role:'admin',active:true,updatedAt:1},{username:'jinky',fullname:'Jinky',passwordHash:'x',role:'admin',active:true,updatedAt:1}];
    const base=extra=>JSON.stringify(Object.assign({fixes:{},answers:{'1':'Write it off'},eba:{'104':'yes'},signoff:{},v:1,lastAutoRecon:Date.now(),subAuto:{at:1,n:0,by:{},refs:[],rules:2}},extra||{}));
    let cloud={hydroPro_users:JSON.stringify(USERS)};cloud[K]=base();
    const frozen={},pushes=[];
    const sum=raw=>{try{const o=JSON.parse(raw);return {a1:o.answers['1'],eba104:o.eba['104'],fix50:(o.fixes||{})['50']||0,eba105:o.eba['105']||''};}catch(e){return null;}};
    async function computer(who,user,page,r0){
      const ctx=await browser.newContext({viewport:{width:1500,height:950},serviceWorkers:'block'});
      await ctx.route(/^https:/,async(route,req)=>{
        const u=new URL(req.url());
        if(u.host!=='hnx-sync.eyalbenari99.workers.dev')return route.abort();
        const J=o=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
        const src=frozen[who]||cloud;
        if(u.pathname==='/sync/keys')return J({ok:true,keys:Object.keys(src),count:Object.keys(src).length});
        if(u.pathname==='/sync/pull'){const ks=u.searchParams.get('keys');const data={};(ks?ks.split(','):Object.keys(src)).forEach(k=>{if(src[k]!=null)data[k]=src[k];});return J({ok:true,data,count:Object.keys(data).length});}
        if(u.pathname==='/sync/push'&&req.method()==='POST'){let d={};try{d=JSON.parse(req.postData()||'{}').data||{};}catch(e){}
          const ks=Object.keys(d);ks.forEach(k=>{cloud[k]=typeof d[k]==='string'?d[k]:JSON.stringify(d[k]);});
          if(d[K]!=null)pushes.push({who,n:ks.length,recon:sum(cloud[K])});
          return J({ok:true,written:ks.length,unchanged:0,keys:ks,skipped:[]});}
        if(u.pathname==='/health')return J({status:'ok'});
        return J({ok:true,data:{}});
      });
      await ctx.addInitScript(({user,USERS,r0})=>{
        if(localStorage.getItem('__sim_seeded'))return;localStorage.setItem('__sim_seeded','1');
        localStorage.setItem('hnx_test_harness','1');localStorage.setItem('hydroPro_users',JSON.stringify(USERS));localStorage.setItem('hnx_first_boot','2026-01-01');
        sessionStorage.setItem('hydroPro_session',JSON.stringify({username:user,loginAt:Date.now()}));
        localStorage.setItem('hnx_cloud_token','t');localStorage.setItem('hnxlocal_last_full_push',String(Date.now()));localStorage.setItem('hydroPro_memos','[]');
        localStorage.setItem('hydroPro_asset_recon_v1',r0);
      },{user,USERS,r0});
      const p=await ctx.newPage();p.on('dialog',d=>d.accept());
      const errs=[];p.on('pageerror',e=>{const s=String(e);if(!/NotSupportedError/.test(s))errs.push(s.slice(0,120));});
      await p.goto('http://127.0.0.1:'+PORT+'/'+page+'?cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
      return {who,ctx,pg:p,errs};
    }
    const ready=async c=>{for(let i=0;i<200;i++){if(await c.pg.evaluate(()=>!!window.__hnxPulledOk).catch(()=>false))return true;await sleep(500);}return false;};
    const local=c=>c.pg.evaluate(k=>{try{const o=JSON.parse(localStorage.getItem(k));return {a1:o.answers['1'],eba104:o.eba['104'],fix50:(o.fixes||{})['50']||0,eba105:o.eba['105']||''};}catch(e){return null;}},K);
    const waitLocal=async(c,pred,ms)=>{for(let i=0;i<ms/500;i++){const o=await local(c);if(o&&pred(o))return o;await sleep(500);}return await local(c);};
    const waitCloud=async(pred,ms)=>{for(let i=0;i<ms/250;i++){if(pred(sum(cloud[K])))return true;await sleep(250);}return false;};
    const waitPush=async(who,n0,ms)=>{for(let i=0;i<ms/250;i++){const p=pushes.filter(x=>x.who===who);if(p.length>n0)return p[p.length-1].recon;await sleep(250);}return null;};
    const openAsk=async c=>{await c.pg.evaluate(()=>{switchView('acct_assets');});await sleep(1200);await c.pg.evaluate(()=>{hnxArTab('ask');});await sleep(600);};
    const out={};
    const A=await computer('A','eyal',PAGE,cloud[K]),B=await computer('B','jinky',PAGE,cloud[K]);
    out.ready={A:await ready(A),B:await ready(B)};
    await sleep(3000);await openAsk(A);await openAsk(B);
    /* ---- 1. B's view of the cloud freezes on the old copy; A saves; B marks #50 and full-uploads its stale copy ---- */
    frozen.B=Object.assign({},cloud);
    await A.pg.fill('#arAns1','Keep it');await A.pg.click('button[onclick="hnxArAns(1)"]');await sleep(300);
    await A.pg.click('button[onclick="hnxArEba(104,\'no\')"]');
    out.cloudHasA=await waitCloud(o=>o&&o.a1==='Keep it'&&o.eba104==='no',40000);
    await B.pg.evaluate(()=>{window.__hnxLastFullPush=0;hnxArFix(50);});
    out.cloudAfterBStale=await waitPush('B',0,40000);
    delete frozen.B;
    out.A_after=await waitLocal(A,o=>o.fix50===1,90000);
    out.cloudAfterA=await waitCloud(o=>o&&o.a1==='Keep it'&&o.eba104==='no'&&o.fix50===1,60000)?sum(cloud[K]):sum(cloud[K]);
    out.B_after=await waitLocal(B,o=>o.a1==='Keep it'&&o.eba104==='no',90000);
    out.B_screen1=await B.pg.evaluate(()=>{hnxArTab('ask');return document.getElementById('arAns1').value;});
    /* ---- 2. reverse: B (frozen) un-marks #50 first and full-uploads; then A changes #1 and 104 again ---- */
    frozen.B=Object.assign({},cloud);
    const nB=pushes.filter(x=>x.who==='B').length;
    await B.pg.evaluate(()=>{window.__hnxLastFullPush=0;hnxArFix(50);});
    out.rev_cloudAfterB=await waitPush('B',nB,40000);
    await A.pg.evaluate(()=>{hnxArTab('ask');});await sleep(300);
    await A.pg.fill('#arAns1','Write it off — sold 2021');await A.pg.click('button[onclick="hnxArAns(1)"]');await sleep(300);
    await A.pg.click('button[onclick="hnxArEba(104,\'yes\')"]');
    out.rev_cloudHasA=await waitCloud(o=>o&&o.a1==='Write it off — sold 2021'&&o.eba104==='yes'&&o.fix50===0,60000);
    delete frozen.B;
    out.rev_A=await waitLocal(A,o=>o.fix50===0&&o.a1==='Write it off — sold 2021',90000);
    out.rev_B=await waitLocal(B,o=>o.a1==='Write it off — sold 2021'&&o.eba104==='yes',90000);
    out.rev_cloud=sum(cloud[K]);
    /* ---- 3. C on prev.html (v22.54: no stamps, string-order merge) full-uploads its stale whole copy ---- */
    const stale=base({fixes:{'50':1}});
    frozen.C=Object.assign({},cloud,{[K]:stale});
    const C=await computer('C','jinky','prev.html',stale);
    out.readyC=await ready(C);
    await C.pg.evaluate(()=>{switchView('acct_assets');});await sleep(1500);
    await C.pg.evaluate(()=>{window.__hnxLastFullPush=0;hnxArTab('ask');hnxArEba(105,'yes');});
    out.cloudAfterC=await waitPush('C',0,60000);
    delete frozen.C;
    out.A_afterC=await waitLocal(A,o=>o.eba105==='yes',90000);
    out.cloudAfterA2=await waitCloud(o=>o&&o.a1==='Write it off — sold 2021'&&o.eba104==='yes'&&o.fix50===0&&o.eba105==='yes',60000)?sum(cloud[K]):sum(cloud[K]);
    out.B_afterC=await waitLocal(B,o=>o.eba105==='yes',90000);
    out.errs={A:A.errs.slice(0,2),B:B.errs.slice(0,2)};
    out.pushes=pushes.map(x=>x.who).join('');
    await A.ctx.close();await B.ctx.close();await C.ctx.close();
    return out;
  },
  expect:{'drive.ready':{A:true,B:true},'drive.cloudHasA':true,'drive.cloudAfterBStale':{a1:'Write it off',eba104:'yes',fix50:1,eba105:''},
    'drive.A_after':{a1:'Keep it',eba104:'no',fix50:1,eba105:''},'drive.cloudAfterA':{a1:'Keep it',eba104:'no',fix50:1,eba105:''},'drive.B_after':{a1:'Keep it',eba104:'no',fix50:1,eba105:''},'drive.B_screen1':'Keep it',
    'drive.rev_cloudAfterB':{a1:'Keep it',eba104:'no',fix50:0,eba105:''},'drive.rev_cloudHasA':true,
    'drive.rev_A':{a1:'Write it off — sold 2021',eba104:'yes',fix50:0,eba105:''},'drive.rev_B':{a1:'Write it off — sold 2021',eba104:'yes',fix50:0,eba105:''},'drive.rev_cloud':{a1:'Write it off — sold 2021',eba104:'yes',fix50:0,eba105:''},
    'drive.readyC':true,'drive.cloudAfterC':{a1:'Write it off',eba104:'yes',fix50:1,eba105:'yes'},
    'drive.A_afterC':{a1:'Write it off — sold 2021',eba104:'yes',fix50:0,eba105:'yes'},'drive.cloudAfterA2':{a1:'Write it off — sold 2021',eba104:'yes',fix50:0,eba105:'yes'},'drive.B_afterC':{a1:'Write it off — sold 2021',eba104:'yes',fix50:0,eba105:'yes'},
    'drive.errs':{A:[],B:[]}} },

{ name:'↩ the undo ring hydroPro_asset_recon_bak_v1 is in SKIP_KEYS: a save marks only hydroPro_asset_recon_v1 as unsent, never the ring; Undo goes through S(): the restored #1 "Write it off" carries a fresh stamp (newer than the "Keep it" one), the pre-undo copy enters the ring, and a failed undo says COULD NOT RESTORE (v22.62)',
  seed:SEED, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(4000);
    const src=await (await fetch(location.pathname)).text();
    const m=/var SKIP_KEYS=\\[([^\\]]*)\\]/.exec(src)||['',''];
    const inSkip=m[1].indexOf("'hydroPro_asset_recon_bak_v1'")>=0;
    localStorage.removeItem('hnxlocal_dirty_v1');
    await openTab('ask');
    document.getElementById('arAns1').value='Write it off';hnxArAns(1);await sleep(300);
    document.getElementById('arAns1').value='Keep it';hnxArAns(1);await sleep(900); /* the unsent list is written 0.5 s after a change */
    const d=JSON.parse(localStorage.getItem('hnxlocal_dirty_v1')||'{}');
    const t1=rd()._ts['answers.1'];
    const ring=JSON.parse(localStorage.getItem(BK)||'[]');
    const ix=ring.findIndex(b=>JSON.parse(b.s).answers['1']==='Write it off');
    const before=localStorage.getItem(K);
    window.confirm=()=>true;
    hnxArUndo(ix);await sleep(400);
    const s=rd(),ring2=JSON.parse(localStorage.getItem(BK)||'[]');
    const t2=s._ts['answers.1'];
    /* a failed undo: a stored setItem that throws for the store */
    const o=localStorage.setItem;let alerted='';window.alert=x=>{alerted=String(x);};
    localStorage.setItem=function(k){if(k===K)throw Object.assign(new Error('full'),{name:'QuotaExceededError'});return o.apply(this,arguments);};
    hnxArUndo(0);await sleep(300);
    localStorage.setItem=o;
    return {inSkip,dirty:{recon:d[K]===1,ring:!!d[BK]},a1:s.answers['1'],newer:String(t2)>String(t1),stampFormat:/^\\d{13}:[0-9a-z]+$/.test(String(t2)),ringHasPrev:ring2.some(b=>b.s===before),box:document.getElementById('arAns1').value,
      failed:/COULD NOT RESTORE/.test(alerted),stillA1:rd().answers['1']};})()`),
  expect:{inSkip:true,dirty:{recon:true,ring:false},a1:'Write it off',newer:true,stampFormat:true,ringHasPrev:true,box:'Write it off',failed:true,stillA1:'Write it off'} },

{ name:'🔕 a computer where nothing changed writes nothing at load: with __hnxPulledOk the store is byte-identical after 30 s and 0 writes hit it (healLists, autoSubsOnce, the daily auto-recon and the question renumbering wait for the first download and write only a real change); the CloudFix self-test upload body holds only hydroPro_cloudfix_lasttest (v22.62)',
  seed:function(){
    if(!localStorage.getItem('hnx_t_ar2256q')){localStorage.setItem('hnx_t_ar2256q','1');
      localStorage.setItem('hydroPro_asset_recon_v1',JSON.stringify({fixes:{'1':1},answers:{'1':'Write it off'},eba:{'104':'yes'},signoff:{},v:1,
        lastAutoRecon:Date.now(),subAuto:{at:1,n:0,by:{},refs:[],rules:2},moves:{'104':{sub:'Tools'}},saved:{'108':{at:1760000000000,by:'jinky'}}}));}
    window.__hnxPulledOk=true;window.__reconWrites=0;
    const o=localStorage.setItem.bind(localStorage);
    localStorage.setItem=function(k,v){if(k==='hydroPro_asset_recon_v1'&&localStorage.getItem(k)!==String(v))window.__reconWrites++;return o(k,v);};
  }, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    const raw0=localStorage.getItem(K);
    await sleep(30000);
    const raw1=localStorage.getItem(K),writes=window.__reconWrites;
    /* CloudFix: stub fetch, give it a token, call its push */
    localStorage.setItem('hnx_cloud_token','test-token');
    const f0=window.fetch;let body=null;
    window.fetch=function(u,o){u=String(u);if(u.indexOf('/sync/push')>=0){try{body=JSON.parse(o.body).data;}catch(e){}return Promise.resolve({ok:true,status:200,text:()=>Promise.resolve('{"ok":true}'),json:()=>Promise.resolve({ok:true})});}return f0.apply(this,arguments);};
    try{await window.HNX_CloudFix.push();}catch(e){body={err:String(e)};}
    window.fetch=f0;localStorage.removeItem('hnx_cloud_token');
    return {same:raw0===raw1,writes,keys:body?Object.keys(body):null};})()`),
  expect:{same:true,writes:0,keys:['hydroPro_cloudfix_lasttest']} },

{ name:'🧮 __hnxMergeAssetRecon by itself: a newer stamp wins in both directions ("Keep it" t2 over "Write it off" t1, gone over exists, 0 over 1); a stamped removal (edits.26 reset at t3) beats the older value; an unstamped side loses to a stamped one; a stamp whose hash no longer matches its value counts as unstamped (the v22.54 copy); unstamped on both sides keeps the old rule ("Write it off" > "Keep it"); localAhead only when the cloud lacks the outcome (v22.62)',
  seed:SEED, requires:REQ,
  run:new Function(`return (async()=>{`+OPEN+`
    const M=window.__hnxMergeAssetRecon,SD=window._hnxArStampDiff;
    const st=(o)=>{const w=JSON.parse(JSON.stringify(o));return w;};
    const base=()=>({fixes:{'1':1},answers:{'1':'Write it off'},eba:{'104':'yes'},signoff:{},v:1,edits:{'26':{cost:'123456',loc:'Bay 7'}}});
    /* stamps are written by the module's own differ, so the hashes are real */
    const pad=t=>String(t).padStart(13,'0');
    const stamp=(prev,next)=>JSON.stringify(SD(JSON.parse(JSON.stringify(prev)),JSON.parse(JSON.stringify(next))));
    const r0=JSON.stringify(SD(null,base()));            /* every entry stamped t0 */
    const A1=JSON.parse(r0);A1.answers['1']='Keep it';A1.eba['104']='no';A1.fixes['1']=0;delete A1.edits['26'];
    const a1=stamp(JSON.parse(r0),A1);                     /* stamped now (t2), tombstones for edits.26.* */
    const B1=JSON.parse(r0);B1.answers['2']='Answer two';B1.saved={'220':{at:1,by:'b'}};
    const b1=stamp(JSON.parse(r0),B1);
    const m1=M(a1,b1),m2=M(b1,a1);
    const o1=JSON.parse(m1.out),o2=JSON.parse(m2.out);
    /* a verified but OLDER stamp on the other side (2020) loses to a1's */
    const C=JSON.parse(a1);C.answers['1']='Older text';
    C._ts['answers.1']=pad(1600000000000)+':'+SD(null,{answers:{'1':'Older text'}})._ts['answers.1'].split(':')[1];
    const mc=M(a1,JSON.stringify(C));
    /* the v22.54 case: value reverted by string order, stamp kept → hash mismatch → unstamped → loses */
    const D=JSON.parse(a1);D.answers['1']='Write it off';D.eba['104']='yes';
    const md=M(a1,JSON.stringify(D)),md2=M(JSON.stringify(D),a1);
    /* both unstamped → the old rule */
    const U1=JSON.stringify({answers:{'1':'Keep it'},v:1}),U2=JSON.stringify({answers:{'1':'Write it off'},v:1});
    const mu=M(U1,U2),mu2=M(U2,U1);
    return {dir1:{a1:o1.answers['1'],eba:o1.eba['104'],fix:o1.fixes['1'],a2:o1.answers['2'],e26:o1.edits['26']===undefined,saved:!!o1.saved['220'],ahead:m1.localAhead},
      dir2:{a1:o2.answers['1'],eba:o2.eba['104'],fix:o2.fixes['1'],a2:o2.answers['2'],e26:o2.edits['26']===undefined,ahead:m2.localAhead},
      older:{out:mc.out===null,ahead:mc.localAhead},
      v2254:{a1:JSON.parse(md.out||a1).answers['1'],eba:JSON.parse(md.out||a1).eba['104'],aheadL:md.localAhead,a1r:JSON.parse(md2.out).answers['1'],ebaR:JSON.parse(md2.out).eba['104'],aheadR:md2.localAhead},
      unst:{a:JSON.parse(mu.out||U1).answers['1'],b:JSON.parse(mu2.out||U2).answers['1']},
      same:M(a1,a1).out===null&&M(a1,a1).localAhead===false};})()`),
  expect:{'dir1.a1':'Keep it','dir1.eba':'no','dir1.fix':0,'dir1.a2':'Answer two','dir1.e26':true,'dir1.saved':true,'dir1.ahead':true,
    'dir2.a1':'Keep it','dir2.eba':'no','dir2.fix':0,'dir2.a2':'Answer two','dir2.e26':true,'dir2.ahead':true,
    'older.out':true,'older.ahead':true,
    'v2254.a1':'Keep it','v2254.eba':'no','v2254.aheadL':true,'v2254.a1r':'Keep it','v2254.ebaR':'no','v2254.aheadR':false,
    'unst.a':'Write it off','unst.b':'Write it off',same:true} }
];
