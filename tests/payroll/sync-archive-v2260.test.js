/* v22.60 (Eyal, 12 Oct 2026: "sync error for 2 days not solved yet"; his Cloud Sync Diagnostic: "not stored by the cloud (too big):
   maint_tasks, calls — kept on this computer"). The cloud drops any store over 5 MB; the calls passed it when ~3,500 automatic alarm calls
   were closed on 10 Oct (closed calls were kept for ever). 📦 Archive moves closed calls / done tasks — unchanged — into monthly archive
   stores; nothing is deleted (📂 Archive + ↩ back); a tombstone + a synced index keep an archived record out of the live list on every
   computer; the owner's first cut records his OK so Data Safety does not hold it. Seeds use the facade after boot (the archive and the
   calls live in the device database, not the 5 MB browser store). Today in these cases = 12 Oct 2026 12:00 Manila (NOW below). */
const H=`
  const NOW=Date.parse('2026-10-12T04:00:00Z'),D=864e5;
  const CK='hydroPro_calls',TK='hydroPro_maint_tasks';
  window.confirm=()=>true;window.showToast=()=>{};
  const call=(i,x)=>Object.assign({id:'C'+i,subject:'Pool alarm '+i,status:'new',priority:'urgent',raisedAt:NOW-90*D,automatic:true,autoKey:'pool::P0'+(i%9)+'::EC',updates:[{ts:NOW-90*D,by:'system',note:'raised'}]},x||{});
  const closedAuto=(i,daysAgo)=>call(i,{status:'closed_fixed',closedAt:NOW-daysAgo*D,updatedAt:NOW-daysAgo*D,autoResolved:true,closeNote:'🤖 condition cleared — closed by Nexi'});
  const task=(i,x)=>Object.assign({id:'T'+i,title:'Pool alarm task '+i,status:'not_started',priority:'high',createdAt:'2026-07-01',autoKey:'pool::'+i},x||{});
  const ids=a=>a.map(o=>o.id);
  const archAll=pre=>window.__hnxArch.keys(/maint_tasks/.test(pre)?'tasks':'calls');
  const archRecs=pre=>archAll(pre).reduce((a,k)=>a.concat(JSON.parse(localStorage.getItem(k)||'[]')),[]);
  const loginAdmin=()=>{try{const u=getCurrentUser();if(u)u.role='admin';}catch(e){}};
`;
const run=fn=>new Function('return (async()=>{'+H+' await new Promise(r=>setTimeout(r,3000)); loginAdmin(); return await ('+fn.toString()+')(); })();');
const NEW="!!window.__hnxArch&&typeof window.hnxSyncArchive==='function'";
module.exports=[
{ name:'📦 the first cut: 4,000 automatic calls closed 3–60 days ago + 150 open + 50 closed by a person 30 days ago → the 4,000 move to hydroPro_calls_arch_2026-08 / 2026-09 / 2026-10 (by close month), the live list keeps 200 (150 open + the 50 a person closed, under the 60-day rule), every archived call byte-identical, ids live + archive = 4,200 with none twice, 4,000 index entries and 4,000 tombstones',
  requires:NEW,
  run:run(async()=>{
    const live=[];for(let i=0;i<4000;i++)live.push(closedAuto(i,3+(i%58)));
    for(let i=4000;i<4150;i++)live.push(call(i));
    for(let i=4150;i<4200;i++)live.push(call(i,{automatic:false,autoKey:undefined,status:'closed_fixed',closedAt:NOW-30*D,updatedAt:NOW-30*D}));
    const before={};live.forEach(o=>{before[o.id]=JSON.stringify(o);});
    localStorage.setItem(CK,JSON.stringify(live));localStorage.setItem(TK,'[]');
    const r=window.__hnxArch.run({now:NOW});
    const L=JSON.parse(localStorage.getItem(CK)),A=archRecs('hydroPro_calls_arch_');
    const all=ids(L).concat(ids(A)),uniq=new Set(all);
    const identical=A.every(o=>before[o.id]===JSON.stringify(o));
    const idx=JSON.parse(localStorage.getItem('hydroPro_calls_arch_index_v1')||'{}');
    const tomb=(JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}').calls)||{};
    const archived=new Set(ids(A));
    return {moved:r.moved.calls,live:L.length,open:L.filter(o=>o.status==='new').length,keys:archAll('hydroPro_calls_arch_').map(k=>k.replace('hydroPro_calls_arch_','')),
      identical,total:all.length,uniq:uniq.size,idx:Object.keys(idx).length,tombs:[...archived].filter(id=>tomb[id]).length};
  }),
  expect:{moved:4000,live:200,open:150,keys:['2026-08','2026-09','2026-10'],identical:true,total:4200,uniq:4200,idx:4000,tombs:4000} },

{ name:'🛡 the cut goes up: the cloud still holds the old 4,200-call copy, the new 200-call live list would "remove 4,000 of 4,200" — the push gate lets it through because the owner OK\'d exactly this copy (not HELD), and the new archive stores (no cloud copy yet) pass too',
  requires:NEW+"&&typeof window.__hnxPushGuard==='function'",
  run:run(async()=>{
    const live=[];for(let i=0;i<4000;i++)live.push(closedAuto(i,10));for(let i=4000;i<4200;i++)live.push(call(i));
    const oldRaw=JSON.stringify(live);localStorage.setItem(CK,oldRaw);localStorage.setItem(TK,'[]');
    window.__hnxCloudRaw=window.__hnxCloudRaw||{};window.__hnxCloudRaw[CK]=oldRaw;
    window.__hnxArch.run({now:NOW});
    const newRaw=localStorage.getItem(CK),ak=archAll('hydroPro_calls_arch_')[0];
    const data={};data[CK]=newRaw;data[ak]=localStorage.getItem(ak);
    const out=window.__hnxPushGuard(data);
    return {calls:CK in out,arch:ak in out,liveN:JSON.parse(newRaw).length};
  }),
  expect:{calls:true,arch:true,liveN:200} },

{ name:'♻ a stale copy never brings archived calls back: after the cut (4,000 archived, 200 live) another computer\'s old 4,200-call list lands in the live store with one NEW open call of its own → the sweep drops the 4,000 archived ids again (live 201), keeps the new call; a call edited AFTER it was archived (a later update) stays live and leaves the index (live 202, index 3,999)',
  requires:NEW,
  run:run(async()=>{
    const live=[];for(let i=0;i<4000;i++)live.push(closedAuto(i,10));for(let i=4000;i<4200;i++)live.push(call(i));
    const stale=JSON.parse(JSON.stringify(live));
    localStorage.setItem(CK,JSON.stringify(live));localStorage.setItem(TK,'[]');
    window.__hnxArch.run({now:NOW});
    const back=stale.concat([call(9999,{subject:'new on B'})]);
    localStorage.setItem(CK,JSON.stringify(back));
    window.__hnxArch.sweep();
    const a=JSON.parse(localStorage.getItem(CK));
    const st2=JSON.parse(JSON.stringify(stale));st2[5].updatedAt=Date.now()+1000;st2[5].updates.push({ts:Date.now(),by:'eyal',note:'re-opened'});
    localStorage.setItem(CK,JSON.stringify(a.concat([st2[5]])));
    window.__hnxArch.sweep();
    const b=JSON.parse(localStorage.getItem(CK)),idx=JSON.parse(localStorage.getItem('hydroPro_calls_arch_index_v1')||'{}');
    return {afterStale:a.length,newKept:a.some(o=>o.id==='C9999'),afterEdit:b.length,editedLive:b.some(o=>o.id==='C5'),idx:Object.keys(idx).length};
  }),
  expect:{afterStale:201,newKept:true,afterEdit:202,editedLive:true,idx:3999} },

{ name:'🔧 maintenance tasks: 3,000 automatic tasks done 30 days ago + 100 open → the 3,000 move to hydroPro_maint_tasks_arch_2026-09, live 100; a closed call and its done task move TOGETHER; a done task linked to a call a person raised that closed (through that task) only 3 days ago stays live with it',
  requires:NEW,
  run:run(async()=>{
    const T=[];for(let i=0;i<3000;i++)T.push(task(i,{status:'done',doneDate:'2026-09-12',updatedAt:NOW-30*D}));for(let i=3000;i<3100;i++)T.push(task(i));
    T.push(task('P1',{status:'done',doneDate:'2026-09-01',updatedAt:NOW-41*D}));T.push(task('P2',{status:'done',doneDate:'2026-09-01',updatedAt:NOW-41*D}));
    const C=[call('P1',{status:'closed_fixed',closedAt:NOW-41*D,updatedAt:NOW-41*D,maintTaskId:'TP1'}),call('P2',{automatic:false,autoKey:undefined,status:'new',maintTaskId:'TP2',updatedAt:NOW-3*D})];
    localStorage.setItem(TK,JSON.stringify(T));localStorage.setItem(CK,JSON.stringify(C));
    const r=window.__hnxArch.run({now:NOW});
    const LT=JSON.parse(localStorage.getItem(TK)),LC=JSON.parse(localStorage.getItem(CK)),AT=archRecs('hydroPro_maint_tasks_arch_'),AC=archRecs('hydroPro_calls_arch_');
    return {movedT:r.moved.tasks,liveT:LT.length,keys:archAll('hydroPro_maint_tasks_arch_').map(k=>k.replace('hydroPro_maint_tasks_arch_','')),
      pairCallArch:AC.some(o=>o.id==='CP1'),pairTaskArch:AT.some(o=>o.id==='TP1'),openPairCall:LC.some(o=>o.id==='CP2'),openPairTask:LT.some(o=>o.id==='TP2')};
  }),
  expect:{movedT:3001,liveT:101,keys:['2026-09'],pairCallArch:true,pairTaskArch:true,openPairCall:true,openPairTask:true} },

{ name:'📂 the archive viewer: "📂 Archive — 4000 older closed calls", search "alarm 3999" finds 1; ↩ back to the live list → the call is live again (stamped newer than its tombstone), gone from the index and from the archive store (3,999 left)',
  requires:NEW,
  run:run(async()=>{
    const live=[];for(let i=0;i<4000;i++)live.push(closedAuto(i,10));for(let i=4000;i<4010;i++)live.push(call(i));
    localStorage.setItem(CK,JSON.stringify(live));localStorage.setItem(TK,'[]');
    window.__hnxArch.run({now:NOW});
    window.hnxArchiveView('calls');await new Promise(r=>setTimeout(r,300));
    const v=document.getElementById('hnxArchView'),title=v.querySelector('b').textContent;
    const q=v.querySelector('#hnxArchQ');q.value='alarm 3999';q.dispatchEvent(new Event('input'));
    const found=v.querySelectorAll('#hnxArchRows tr').length;
    v.querySelector('[data-arch-back="C3999"]').click();await new Promise(r=>setTimeout(r,300));
    const L=JSON.parse(localStorage.getItem(CK)),c=L.find(o=>o.id==='C3999'),idx=JSON.parse(localStorage.getItem('hydroPro_calls_arch_index_v1'));
    const tomb=JSON.parse(localStorage.getItem('hydroPro_optomb')).calls.C3999;
    return {title,found,live:!!c,newer:!!c&&c.updatedAt>tomb,inIdx:'C3999' in idx,left:archRecs('hydroPro_calls_arch_').length};
  }),
  expect:{title:'📂 Archive — 4000 older closed calls',found:1,live:true,newer:true,inIdx:false,left:3999} },

{ name:'☀ the daily pass after the first cut moves only what newly qualifies and writes NOTHING when nothing does: 10 open + 5 calls closed by a person 3 days ago → 0 moved, the live list byte-identical',
  requires:NEW,
  run:run(async()=>{
    const live=[];for(let i=0;i<10;i++)live.push(call(i));for(let i=10;i<15;i++)live.push(call(i,{automatic:false,autoKey:undefined,status:'closed_fixed',closedAt:NOW-3*D,updatedAt:NOW-3*D}));
    const raw=JSON.stringify(live);localStorage.setItem(CK,raw);localStorage.setItem(TK,'[]');
    const r=window.__hnxArch.run({daily:true,now:NOW});
    return {moved:r.moved.calls+r.moved.tasks,same:localStorage.getItem(CK)===raw};
  }),
  expect:{moved:0,same:true} },

{ name:'🟣 the owner sees the way out: an upload that left hydroPro_calls unsent (too big) shows the purple banner "📦 Archive old closed items" to an admin, and the Cloud Sync Diagnostic carries 📦 Archive + 📂 Archive; the size ladder stops as soon as both stores are under the target (target 50 KB here: 1 day for automatic, then 14 days, then 2 days for a person\'s calls)',
  requires:NEW,
  run:run(async()=>{
    window.__hnxPushSkipped=[{k:'hydroPro_calls',size:6e6}];window.__hnxArch.banner();
    const ban=!!document.getElementById('hnxArchBanner')&&/Archive old closed items/.test(document.getElementById('hnxArchBanner').textContent);
    const live=[];for(let i=0;i<60;i++)live.push(call(i,{automatic:false,autoKey:undefined,status:'closed_fixed',closedAt:NOW-(i<30?20:5)*D,updatedAt:NOW-(i<30?20:5)*D,description:'x'.repeat(2500)}));
    localStorage.setItem(CK,JSON.stringify(live));localStorage.setItem(TK,'[]');
    const p=window.__hnxArch.plan({now:NOW,target:50000});
    const diag=/hnx-sd-arch/.test(document.documentElement.innerHTML)||[...document.scripts].some(s=>/hnx-sd-arch/.test(s.textContent));
    return {ban,tier:p.tier,n:p.n.calls,diag};
  }),
  expect:{ban:true,tier:3,n:60,diag:true} }
];
