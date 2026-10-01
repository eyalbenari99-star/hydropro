/* v21.27 (Jinky, 1 Oct 2026): a cleared / stale computer can no longer overwrite the employee roster */
module.exports=[
{ name:'👥 Roster seed guard: with a cloud token and an empty store loadEmployees() creates NOTHING; without a token the seed is marked _seed and unstamped; in the by-id merge a real record (dept APTI_ACCOUNTING, stamped) beats the seed (APAC_PACKAGING) whichever side is local; a restore stamps with the backup time so a newer live edit still wins (v21.27)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'X1',name:'KEEP, ME',status:'Active',dept:'APTI_ACCOUNTING'}]));},
  run:async()=>{
    await sleep(5000);
    const RK='hydroPro_employees';
    /* 1. synced device, empty store → no seed */
    localStorage.setItem('hnx_cloud_token','t');localStorage.removeItem(RK);
    const a=loadEmployees();const rawA=localStorage.getItem(RK);
    /* 2. standalone device → seed marked, no _fts */
    localStorage.removeItem('hnx_cloud_token');localStorage.removeItem(RK);
    const b=loadEmployees();const sb=JSON.parse(localStorage.getItem(RK)||'[]');const j=sb.find(e=>e.id==='EMP1006')||{};
    /* 3. merge: real record vs seed */
    const real=[{id:'EMP1006',name:'PAGTAMA, JINKY SORNE',dept:'APTI_ACCOUNTING',rate:1363.64,updatedAt:1700000000000,_fts:{dept:1700000000000,rate:1700000000000}}];
    const seedRec=[Object.assign({},j)];
    const m1=JSON.parse(window.__hnxMergeGeneric(RK,JSON.stringify(seedRec),JSON.stringify(real))||'[]');
    const m2=window.__hnxMergeGeneric(RK,JSON.stringify(real),JSON.stringify(seedRec));
    const m2l=m2==null?real:JSON.parse(m2);
    /* 4. restore stamping: __hnxStampAt = backup time */
    localStorage.setItem(RK,JSON.stringify([{id:'R1',name:'OLD, COPY',dept:'APAC_ADMIN'}]));
    window.__hnxStampAt=1600000000000;localStorage.setItem(RK,JSON.stringify([{id:'R1',name:'OLD, COPY',dept:'APAC_PACKAGING'}]));window.__hnxStampAt=0;
    const r=JSON.parse(localStorage.getItem(RK))[0];
    return {noSeed:a.length===0&&(rawA==null||rawA==='[]'),seeded:b.length>10,marked:j._seed===true&&!j._fts&&!j.updatedAt,
      m1dept:(m1.find(e=>e.id==='EMP1006')||{}).dept,m2dept:(m2l.find(e=>e.id==='EMP1006')||{}).dept,restoreStamp:r._fts&&r._fts.dept};},
  expect:{noSeed:true,seeded:true,marked:true,m1dept:'APTI_ACCOUNTING',m2dept:'APTI_ACCOUNTING',restoreStamp:1600000000000} },
];
