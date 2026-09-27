/* v21.16: automatic storage clean-up — file stores live in the device database, nothing deleted, still synced */
const BIG=function(){ /* a 300 KB "PDF" as a data URL, the CEA in-browser fallback shape */
  return 'data:application/pdf;base64,'+'QUJDRA'.repeat(50000); };
const SEED=function(){
  const big='data:application/pdf;base64,'+'QUJDRA'.repeat(50000);
  localStorage.setItem('hydroPro_cea_docs_v1',JSON.stringify([{id:'D1',caseId:'DW-1',name:'Well permit.pdf',data:big,addedAt:'2026-09-20T01:00:00Z',size:big.length}]));
  localStorage.setItem('hydroPro_emp_contract_E1',JSON.stringify({fileName:'contract.pdf',dataUrl:big,uploadedAt:'2026-09-01'}));
  localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M1',title:'Memo one',status:'pending',photos:[{data:big,name:'p.jpg'}]}]));
};
module.exports=[
{ name:'📦 A 300 KB compliance document, a per-employee contract and a memo photo seeded raw in the browser store are moved to the device database at boot: the browser holds a 12-char stub, the screens read the full value, the sync push path sees the full value, the storage watchdog measures < 0.2 MB (v21.16)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);
    for(let i=0;i<60;i++){ if(__hnxAUTOVAULT.ready&&__hnxAUTOVAULT.ready()&&__hnxAUTOVAULT.inVault('hydroPro_cea_docs_v1')) break; await sleep(250); }await sleep(500);
    const K=['hydroPro_cea_docs_v1','hydroPro_emp_contract_E1','hydroPro_memos'];
    const stub=K.map(k=>__hnxAUTOVAULT.rawGet(k)===__hnxAUTOVAULT.STUB),inV=K.map(k=>__hnxAUTOVAULT.inVault(k));
    const full=JSON.parse(localStorage.getItem('hydroPro_cea_docs_v1'))[0],c=JSON.parse(localStorage.getItem('hydroPro_emp_contract_E1'));
    const push=String(hnxEaRawGet('hydroPro_cea_docs_v1')||'').indexOf('Well permit.pdf')>=0;
    let t=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);t+=k.length+(__hnxAUTOVAULT.rawGet(k)||'').length;}
    return {stub,inV,name:full.name,bytes:full.data.length>300000,contract:c.fileName,push,smallStore:t<0.2*1024*1024};},
  expect:{stub:[true,true,true],inV:[true,true,true],name:'Well permit.pdf',bytes:true,contract:'contract.pdf',push:true,smallStore:true} },

{ name:'📦 An empty "[]" written over the filled compliance-document store is refused (the doc stays); a real write (second document) goes through, stays vaulted, marks the key dirty and queues a push (v21.16)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);for(let i=0;i<60;i++){ if(__hnxAUTOVAULT.ready&&__hnxAUTOVAULT.ready()&&__hnxAUTOVAULT.inVault('hydroPro_cea_docs_v1')) break; await sleep(250); }await sleep(500);
    let dirty=[],pushes=0;window.__hnxMarkDirty=k=>dirty.push(k);window.__hnxSyncPushSoon=()=>{pushes++;};
    localStorage.setItem('hydroPro_cea_docs_v1','[]');await sleep(100);
    const afterEmpty=JSON.parse(localStorage.getItem('hydroPro_cea_docs_v1')).length;
    const a=JSON.parse(localStorage.getItem('hydroPro_cea_docs_v1'));a.push({id:'D2',caseId:'DW-1',name:'Second.pdf',data:'data:application/pdf;base64,QUJD',addedAt:'2026-09-27T01:00:00Z'});
    localStorage.setItem('hydroPro_cea_docs_v1',JSON.stringify(a));await sleep(100);
    return {afterEmpty,after:JSON.parse(localStorage.getItem('hydroPro_cea_docs_v1')).length,stillStub:__hnxAUTOVAULT.rawGet('hydroPro_cea_docs_v1')===__hnxAUTOVAULT.STUB,dirty:dirty.indexOf('hydroPro_cea_docs_v1')>=0,pushes:pushes>=1};},
  expect:{afterEmpty:1,after:2,stillStub:true,dirty:true,pushes:true} },

{ name:'🗄 The archiver leaves TODAY’s daily report alone and archives a 40-day-old day key (one upload, removed locally) (v21.16)',
  seed:function(){
    localStorage.setItem('hnx_cloud_token','t');window.__ups=[];
    const of=window.fetch;window.fetch=function(u,o){u=String(u);
      if(u.indexOf('/r2/upload')>=0){window.__ups.push(decodeURIComponent(u.split('key=')[1].split('&')[0]));return Promise.resolve(new Response('{"ok":true}',{status:200}));}
      if(u.indexOf('hnx-sync')>=0)return Promise.resolve(new Response('{"ok":true,"data":{}}',{status:200}));
      return of.apply(this,arguments);};
    const d=new Date();const y=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
    const old=new Date(d);old.setDate(old.getDate()-40);
    window.__today=y(d);window.__old=y(old);
    let r='';for(let i=0;i<4000;i++)r+=String.fromCharCode(48+Math.floor(Math.random()*74));const fill=JSON.stringify({GH1:{items:{leaf_0:true},notes:{a:r}}});
    localStorage.setItem('hydroPro_'+y(d),fill);localStorage.setItem('hydroPro_'+y(old),fill);
  },
  run:async()=>{
    await sleep(2500);await __hnxAUTOVAULT.run();await sleep(500);
    return {todayKept:!!localStorage.getItem('hydroPro_'+__today),oldGone:!localStorage.getItem('hydroPro_'+__old),
      ups:__ups.filter(k=>k.indexOf('hydroPro_'+__old)>=0).length,todayUploaded:__ups.some(k=>k.indexOf('hydroPro_'+__today)>=0)};},
  expect:{todayKept:true,oldGone:true,ups:1,todayUploaded:false} },
];
