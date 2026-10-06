/* v21.87: Nexi Assistant → 👁 Team follow-up */
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},{username:'joshane',fullname:'Joshane Espinosa',passwordHash:'x',role:'accounting',active:true},
  {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',active:true}]));
  const T=[{id:'T1',title:'Send SOA',owner:'joshane',status:'todo',due:'2026-10-10'},{id:'T2',title:'Bank recon',owner:'joshane',status:'todo',due:'2026-10-13'},
   {id:'T3',title:'Supplier call',owner:'joshane',status:'done',due:'2026-10-12',doneAt:'2026-10-12T03:00:00Z'},
   {id:'R1',title:'Weekly price watch',owner:'joshane',status:'todo',due:'2026-10-07',seriesId:'S1'},{id:'R2',title:'Weekly price watch',owner:'joshane',status:'todo',due:'2026-10-14',seriesId:'S1'},
   {id:'R3',title:'Daily follow-ups',owner:'edelyn.n',status:'done',due:'2026-10-12',doneAt:'2026-10-12T05:00:00Z',seriesId:'S2'},{id:'R4',title:'Daily follow-ups',owner:'edelyn.n',status:'todo',due:'2026-10-13',seriesId:'S2'}];
  localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(T));};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'👁 Team follow-up: on 13 Oct Joshane = 3 open (+routine) → overdue 2 (T1 10 Oct, R1 7 Oct), today 1, done 7 d 1, routine S1 behind; Edelyn routine on track; dropdown opens Joshane with Overdue/Today/Routines; Dr Amy allowed, Joshane locked out (v21.87)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}as('tester');await sleep(6000);window.hnxLocalToday=()=>'2026-10-13';
    const A=JSON.parse(localStorage.getItem('hydroPro_tasks_v1'));const j=HNXTF.stats('joshane',A,'2026-10-13'),e=HNXTF.stats('edelyn.n',A,'2026-10-13');
    switchView('pa_team');await sleep(600);const h=document.getElementById('view-pa_team');const sel=!!h.querySelector('#tfSel');
    HNXTF.pick('joshane');await sleep(200);const one=/⚠ Overdue/.test(h.innerHTML)&&/Send SOA/.test(h.innerHTML)&&/Weekly price watch/.test(h.innerHTML)&&/behind/.test(h.innerHTML);
    as('amy');const amy=HNXTF.allowed();as('joshane');HNXTF.render();await sleep(100);const lock=/Only Eyal, Dr Amy/.test(h.innerHTML);
    return {jopen:j.open,jover:j.over,jtoday:j.today,jdone:j.done7,jmiss:j.rMiss,eok:e.rOk,emiss:e.rMiss,sel,one,amy,lock};})()`),
  expect:{jopen:4,jover:2,jtoday:1,jdone:1,jmiss:1,eok:1,emiss:0,sel:true,one:true,amy:true,lock:true} }
];
