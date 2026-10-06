/* v21.89: critical calls closed by supervisors only, with what was done; old ones reviewed */
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'worker',fullname:'Juan Worker',passwordHash:'x',role:'staff',active:true}]));
  const old=Date.now()-10*86400000,now=Date.now();
  localStorage.setItem('hydroPro_calls',JSON.stringify([{id:'C1',subject:'GH2 — Downy mildew',priority:'urgent',status:'new_call',createdAt:old},
   {id:'C2',subject:'GH7 cooling pad cover broken',priority:'urgent',status:'new_call',createdAt:old},{id:'C3',subject:'GH1 new pest',priority:'urgent',status:'new_call',createdAt:now},
   {id:'C4',subject:'Light out',priority:'normal',status:'new_call',createdAt:old}]));};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🚨 Critical calls: old-critical list = C1, C2 + C4 (normal call auto-escalated to urgent after days open; not C3 new); worker cannot close; supervisor with a 9-char note refused; with a real note closes both as Finalized with the note in history; age guard: 10-day call = 240 h (v21.89)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}as('worker');await sleep(6000);
    const L=hnxOldCritical.list().map(c=>c.id).join(',');const w=hnxOldCritical.close(['C1'],'checked, no mildew present at all').ok;
    as('tester');const short=hnxOldCritical.close(['C1','C2'],'all good.').ok;
    const r=hnxOldCritical.close(['C1','C2','C4'],'GH2 and GH7 checked 6 Oct by supervisor — fixed / not present');
    const A=JSON.parse(localStorage.getItem('hydroPro_calls'));const c1=A.find(c=>c.id==='C1');
    return {L,w,short,n:r.n,st:c1.status,note:/old-critical review: GH2 and GH7/.test(JSON.stringify(c1.updates)),left:hnxOldCritical.list().length,age:Math.round(hnxItemAgeH({createdAt:Date.now()-10*86400000})),sup:hnxCanCloseCritical(),wk:(as('worker'),hnxCanCloseCritical())};})()`),
  expect:{L:'C1,C2,C4',w:false,short:false,n:3,st:'closed_finalize',note:true,left:0,age:240,sup:true,wk:false} }
];
