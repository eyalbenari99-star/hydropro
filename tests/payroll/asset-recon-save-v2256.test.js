/* v22.56 (Eyal 12 Oct, screenshot of Accounting → 🏗 Assets → ❓ For Eyal → 🌸 confirm existence: "why some not save please revert
   to that … fix it and save all"). 💾 save on a line used to rewrite the store and write "✓ saved" into the screen but record NOTHING
   for the line, and the button was blue only for a line with a move or an edit — so a pressed line went white again at the next render.
   Now the press stamps saved[ref] = {at, by}; a line is blue + "✓ saved" when ANY decision is stored for it (move, edit, exists/gone,
   done in QB, a save stamp); 💾 Save all stamps a whole list (or every asset) in one write.

   Seed (every case): moves #104 (sub Tools) · edits #106 · done in QB #1 · answer Q1 · exists #105 / gone #107 · an earlier save stamp
   on #108 (1760000000000, jinky) → YOUR CHANGES = 6. The automatic sub-account fill is marked undone so no other move appears.
   The 🌸 list (tag eba) has 27 assets: 104,105,107,108,110,111,200,201,207,208,210,211,212,215,216,218,219,220,221,222,223,228,234,235,
   236,238,248. The seed is written once per browser, so a reload / a visit to prev.html keeps what the test wrote. */
const SEED=function(){
  if(localStorage.getItem('hnx_t_ar2256'))return;
  localStorage.setItem('hnx_t_ar2256','1');
  localStorage.setItem('hydroPro_asset_recon_v1',JSON.stringify({
    fixes:{'1':1},
    answers:{'1':'Yes — the repeated GL lines are duplicates: keep ONE line per unit and write the rest off'},
    eba:{'105':'yes','107':'no'},signoff:{},v:1,
    moves:{'104':{sub:'Tools'}},
    edits:{'106':{notes:'checked on site'}},
    saved:{'108':{at:1760000000000,by:'jinky'}},
    subAuto:{at:1,n:0,undone:true}
  }));
};
const EBA=[104,105,107,108,110,111,200,201,207,208,210,211,212,215,216,218,219,220,221,222,223,228,234,235,236,238,248];
/* the app wraps localStorage.setItem on the object itself (not the prototype), so a write counter wraps the same place.
   open the 🌸 list (in the page) — returns a line reader: 'blue|✓ saved HH:MM' / 'blue|✓ saved' / 'white|' */
const OPEN=`
  const K='hydroPro_asset_recon_v1';
  const rd=()=>JSON.parse(localStorage.getItem(K));
  const V=()=>document.getElementById('view-acct_assets');
  const btn=r=>V().querySelector('button[onclick*="hnxArSaveLine('+r+')"]');
  const line=r=>{const b=btn(r);if(!b)return 'missing';const mk=b.nextElementSibling;
    return (/btn-primary/.test(b.className)?'blue':'white')+'|'+String(mk?mk.textContent:'').replace(/\\d\\d:\\d\\d/,'HH:MM');};
  const changes=()=>{const m=(V().innerText.match(/YOUR CHANGES ON THIS DEVICE — (\\d+) saved/)||[])[1];return m?+m:0;};
  const pick=s=>JSON.stringify({moves:s.moves||{},edits:s.edits||{},eba:s.eba||{},fixes:s.fixes||{},answers:s.answers||{},signoff:s.signoff||{}});
  const openTab=async t=>{switchView('acct_assets');await sleep(1200);hnxArTab(t);await sleep(500);};
`;
module.exports=[
{ name:'💾 save on #220 (🌸 list, no move/edit) stamps saved["220"] by tester → blue + "✓ saved HH:MM" at once, after a full re-render AND after a page reload; #104 (a move) stays blue "✓ saved"; never-touched #110 stays white with no mark (v22.56)',
  seed:SEED,
  drive:async pg=>{
    const r1=await pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+`
      await sleep(5000);await openTab('ask');
      const before=line(220);
      btn(220).click();await sleep(300);
      const after=line(220);
      hnxArTab('ov');await sleep(300);hnxArTab('ask');await sleep(500);
      const rerender=line(220);
      const s=rd(),st=(s.saved||{})['220']||{};
      return {before,after,rerender,stamp:st.at>1.7e12,by:st.by,n104:line(104),n110:line(110)};})()`));
    await pg.reload({waitUntil:'domcontentloaded',timeout:180000});
    await pg.waitForTimeout(22000);
    return r1;
  },
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(4000);await openTab('ask');
    const s=rd();
    return {l220:line(220),l104:line(104),l110:line(110),kept:!!(s.saved&&s.saved['220']&&s.saved['220'].by==='tester'),changes:changes()};})()`),
  expect:{'drive.before':'white|','drive.after':'blue|✓ saved HH:MM','drive.rerender':'blue|✓ saved HH:MM','drive.stamp':true,'drive.by':'tester',
    'drive.n104':'blue|✓ saved','drive.n110':'white|',
    l220:'blue|✓ saved HH:MM',l104:'blue|✓ saved',l110:'white|',kept:true,changes:6} },

{ name:'🌸 💾 Save all on the confirm-existence list: 27 rows → all 27 stamped in ONE write, the list says "✓ 27 lines saved" and every row is blue; #108 keeps its earlier stamp (jinky, 1760000000000); moves/edits/exists-gone/done/answers byte-identical; the undo ring holds the state from just before; YOUR CHANGES stays 6 (v22.56)',
  seed:SEED,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(5000);await openTab('ask');
    const raw0=localStorage.getItem(K),s0=JSON.parse(raw0),ch0=changes();
    const mark0=(V().querySelector('[data-ar-listmark="eba"]')||{}).textContent;
    let writes=0;const o=localStorage.setItem;localStorage.setItem=function(k){if(k===K)writes++;return o.apply(this,arguments);};
    V().querySelector('button[onclick*="hnxArSaveAll(\\'eba\\')"]').click();await sleep(500);
    localStorage.setItem=o;
    const s1=rd(),sv=s1.saved||{};
    const card=V().querySelector('button[onclick*="hnxArSaveAll(\\'eba\\')"]').closest('div[style*="border-radius:13px"]');
    const rows=[...card.querySelectorAll('button[onclick*="hnxArSaveLine("]')];
    const ring=JSON.parse(localStorage.getItem('hydroPro_asset_recon_bak_v1')||'[]');
    const EBA=${JSON.stringify(EBA)};
    return {mark0,writes,stamped:EBA.filter(r=>sv[String(r)]&&sv[String(r)].at>0).length,others:Object.keys(sv).filter(k=>EBA.indexOf(+k)<0).length,
      k108:sv['108'],same:pick(s0)===pick(s1),
      ringHead:!!(ring[0]&&JSON.stringify(JSON.parse(ring[0].s))===JSON.stringify(s0)),
      mark:(V().querySelector('[data-ar-listmark="eba"]')||{}).textContent,rows:rows.length,blue:rows.filter(b=>/btn-primary/.test(b.className)).length,
      l220:line(220),l108:line(108),changes0:ch0,changes:changes()};})()`),
  expect:{mark0:'✓ 4 of 27 lines saved',writes:1,stamped:27,others:0,k108:{at:1760000000000,by:'jinky'},same:true,ringHead:true,
    mark:'✓ 27 lines saved',rows:27,blue:27,l220:'blue|✓ saved HH:MM',l108:'blue|✓ saved 9 Oct',changes0:6,changes:6} },

{ name:'✅ exists / gone / mark done count as saved without a separate 💾 press: exists #200 and gone #201 → blue "✓ saved" with no stamp written; done in QB on #210 → blue, undone again → white; #211 stays white; YOUR CHANGES 6 → 9 → 8 (v22.56)',
  seed:SEED,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(5000);await openTab('ask');
    hnxArEba(200,'yes');await sleep(300);hnxArEba(201,'no');await sleep(300);hnxArFix(210);await sleep(400);
    const a={l200:line(200),l201:line(201),l210:line(210),l211:line(211),changes:changes()};
    const s=rd();
    hnxArFix(210);await sleep(400);
    return Object.assign(a,{stamps:['200','201','210'].filter(k=>(s.saved||{})[k]).length,l210off:line(210),changesOff:changes()});})()`),
  expect:{l200:'blue|✓ saved',l201:'blue|✓ saved',l210:'blue|✓ saved',l211:'white|',changes:9,stamps:0,l210off:'white|',changesOff:8} },

{ name:'🏗 💾 Save all 248 lines in the YOUR CHANGES bar: "✓ 6 of 248 lines saved" → one write stamps all 248 assets → "✓ 248 lines saved", decisions identical, YOUR CHANGES stays 6, 👁 only-my-changes still lists 5 assets (#108 is only saved, not a change); every list with 💾 save lines (Register, Fix in QB, Disposals, 🌸, Accounts to create) has 💾 Save all at its head (v22.56)',
  seed:SEED,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(5000);await openTab('ov');
    const s0=rd();
    const b=V().querySelector('button[onclick*="hnxArSaveAll(\\'all\\')"]');
    const label=b&&b.textContent,mark0=(V().querySelector('[data-ar-listmark="all"]')||{}).textContent;
    let writes=0;const o=localStorage.setItem;localStorage.setItem=function(k){if(k===K)writes++;return o.apply(this,arguments);};
    b.click();await sleep(600);
    localStorage.setItem=o;
    const s1=rd();
    const mark=(V().querySelector('[data-ar-listmark="all"]')||{}).textContent;
    hnxArOnlyMine();await sleep(400);
    const mineN=+((V().innerText.match(/MTC audit Aug 2026 · (\\d+) assets/)||[])[1]||-1);
    hnxArOnlyMine();await sleep(400);
    /* every list card that carries 💾 save lines carries a 💾 Save all for exactly those lines */
    const heads={};
    for(const t of ['reg','fix','disp','ask','acct']){
      hnxArTab(t);await sleep(500);
      const cards=[...V().querySelectorAll('div[style*="border-radius:13px"]')].filter(c=>c.querySelector('button[onclick*="hnxArSaveLine("]'));
      heads[t]=cards.length+'/'+cards.filter(c=>c.querySelector('button[onclick*="hnxArSaveAll("]')).length;
    }
    return {label,mark0,writes,keys:Object.keys(s1.saved||{}).length,mark,same:pick(s0)===pick(s1),changes:changes(),mineN,
      allCards:Object.keys(heads).every(t=>{const p=heads[t].split('/');return +p[0]>0&&p[0]===p[1];}),heads};})()`),
  expect:{label:'💾 Save all 248 lines',mark0:'✓ 6 of 248 lines saved',writes:1,keys:248,mark:'✓ 248 lines saved',same:true,changes:6,mineN:5,allCards:true} },

{ name:'☁ Two computers save different lines: the real sync merge (__hnxMergeGeneric) joins them — saved 220 + 221 + 222, the line both saved (#221) keeps the newer time 1760000300000 in both directions, both directions agree, exists #200 and the move on #104 survive; the merged copy paints 220/221/222/104/200 blue (v22.56)',
  seed:SEED,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(5000);
    const base={fixes:{},answers:{},eba:{},signoff:{},v:1};
    const A=Object.assign({},base,{eba:{'200':'yes'},saved:{'220':{at:1760000000000,by:'jinky'},'221':{at:1760000100000,by:'jinky'}}});
    const B=Object.assign({},base,{moves:{'104':{sub:'Tools'}},saved:{'222':{at:1760000200000,by:'eyal'},'221':{at:1760000300000,by:'eyal'}}});
    const m1=JSON.parse(window.__hnxMergeGeneric(K,JSON.stringify(A),JSON.stringify(B)));
    const m2=JSON.parse(window.__hnxMergeGeneric(K,JSON.stringify(B),JSON.stringify(A)));
    const norm=o=>JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));
    localStorage.setItem(K,JSON.stringify(m1));
    await openTab('ask');
    return {keys:Object.keys(m1.saved).sort(),at221:m1.saved['221'].at,at221b:m2.saved['221'].at,agree:norm(m1.saved)===norm(m2.saved),
      eba200:m1.eba['200'],move104:m1.moves['104'].sub,
      l220:line(220),l221:line(221),l222:line(222),l104:line(104),l200:line(200),l210:line(210)};})()`),
  expect:{keys:['220','221','222'],at221:1760000300000,at221b:1760000300000,agree:true,eba200:'yes',move104:'Tools',
    l220:'blue|✓ saved 9 Oct',l221:'blue|✓ saved 9 Oct',l222:'blue|✓ saved 9 Oct',l104:'blue|✓ saved',l200:'blue|✓ saved',l210:'white|'} },

{ name:'⏪ Older copy round trip: #220 and #221 saved here, then prev.html (the previous stable copy — v22.54 today, which has no 💾 Save all) opens the same data, marks #104 exists, presses its own 💾 save on #110 and its 💾 Save now → saved 108/220/221 are all still in the data and its sync merge keeps a remote saved line (234); back on this copy #220/#221 are blue "✓ saved HH:MM", #104 blue, YOUR CHANGES 7 (the seed\'s 6 + exists on #104). While prev.html is the old code it paints #220 white and its press on #110 records nothing (#110 white here); once prev.html carries this fix both are blue (v22.56)',
  seed:SEED,
  drive:async pg=>{
    const base='http://127.0.0.1:'+(process.env.PORT||'8799')+'/';
    const a=await pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+`
      await sleep(5000);await openTab('ask');hnxArSaveLine(220);await sleep(200);hnxArSaveLine(221);await sleep(200);
      return {keys:Object.keys(rd().saved||{}).sort()};})()`));
    await pg.goto(base+'prev.html?cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
    await pg.waitForTimeout(23000);
    const b=await pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+`
      await sleep(4000);
      let ver='';try{ver=String(APP_VERSION);}catch(e){}
      const old=typeof window.hnxArSaveAll!=='function';
      await openTab('ask');
      const paints220=line(220).split('|')[0];
      hnxArEba(104,'yes');await sleep(300);
      hnxArSaveLine(110);await sleep(300);
      hnxArSaveNow();await sleep(400);
      const s=rd();
      const R=JSON.stringify({fixes:{},answers:{},eba:{},signoff:{},v:1,saved:{'234':{at:1760000400000,by:'eyal'}}});
      const m=JSON.parse(window.__hnxMergeGeneric(K,localStorage.getItem(K),R));
      const has=(o,ks)=>ks.every(k=>!!(o&&o[k]));
      return {ver,old,paints220,kept:has(s.saved,['108','220','221']),eba104:s.eba['104'],mergedKept:has(m.saved,['108','220','221','234'])};})()`));
    await pg.goto(base+(process.env.NEXI_PAGE||'index.html')+'?cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
    await pg.waitForTimeout(22000);
    const c=await pg.evaluate(new Function(`return (async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));`+OPEN+`
      await sleep(4000);await openTab('ask');
      const s=rd(),sv=s.saved||{};
      return {kept:['108','220','221'].every(k=>!!sv[k]),eba104:s.eba['104'],move104:(s.moves||{})['104']&&s.moves['104'].sub,
        l220:line(220),l221:line(221),l104:line(104),l110:line(110),changes:changes()};})()`));
    /* what the previous copy does with the line is version-dependent: the old code paints #220 white and its press on #110
       records nothing; a previous copy that already carries this fix paints #220 blue and stamps #110 */
    return {a,b,c,oldPaint:b.old?b.paints220==='white':b.paints220==='blue',
      l110:b.old?c.l110==='white|':c.l110==='blue|✓ saved HH:MM'};
  },
  expect:{'drive.a.keys':['108','220','221'],'drive.b.kept':true,'drive.b.eba104':'yes','drive.b.mergedKept':true,'drive.oldPaint':true,
    'drive.c.kept':true,'drive.c.eba104':'yes','drive.c.move104':'Tools','drive.c.l220':'blue|✓ saved HH:MM','drive.c.l221':'blue|✓ saved HH:MM',
    'drive.c.l104':'blue|✓ saved','drive.l110':true,'drive.c.changes':7} },
{ name:'⏪ (review, v22.58) line saves never push a real earlier version out of the 3-deep undo list: ring = [A: moves #150 + #151, Z: + answer 2] → 💾 save on #220, #221, #222 and 💾 Save all on 🌸 (27) → the ring still holds A and Z (2 earlier versions with their decisions), the newest copy carries the stamps',
  seed:SEED,
  run:new Function(`return (async()=>{`+OPEN+`
    await sleep(4000);
    const cur=localStorage.getItem(K),base=JSON.parse(cur);
    const A=Object.assign({},base,{moves:Object.assign({},base.moves,{'150':{sub:'Tools'},'151':{sub:'Tools'}})});
    const Z=Object.assign({},A,{answers:Object.assign({},A.answers,{'2':'Keep it'})});
    localStorage.setItem('hydroPro_asset_recon_bak_v1',JSON.stringify([{at:2,s:JSON.stringify(Z)},{at:1,s:JSON.stringify(A)}]));
    await openTab('ask');
    btn(220).click();await sleep(250);btn(221).click();await sleep(250);btn(222).click();await sleep(250);
    hnxArSaveAll('eba');await sleep(400);
    const ring=JSON.parse(localStorage.getItem('hydroPro_asset_recon_bak_v1')||'[]');
    const has=pred=>ring.some(v=>{try{return pred(JSON.parse(v.s));}catch(e){return false;}});
    const hasA=has(o=>o.moves&&o.moves['150']&&o.moves['151']&&!(o.answers&&o.answers['2']));
    const hasZ=has(o=>o.answers&&o.answers['2']==='Keep it');
    return {len:ring.length,hasA,hasZ};})()`),
  expect:{len:3,hasA:true,hasZ:true} }
];
