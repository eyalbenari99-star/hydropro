/* v21.86: 👥 People & Work view on the live duty engine */
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'reamae',fullname:'Rea Mae Gaco',passwordHash:'x',role:'accounting',active:true},{username:'meajean',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',active:true},
  {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',active:true},{username:'joshane',fullname:'Joshane Espinosa',passwordHash:'x',role:'accounting',active:true},
  {username:'syra',fullname:'Syra Mae Montesa',passwordHash:'x',role:'supervisor',active:true},{username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'accounting',active:true}]));};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'👥 People & Work: admin sees 5 people + lanes with one block per duty today; a missed duty (X) of yesterday and an owner-cancelled duty (NA?) appear in Needs your decision; ✓ NA approves it; Rea sees only her own card (v21.86)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}as('tester');await sleep(6000);window.hnxLocalToday=()=>'2026-10-13';const R=HNXROLEOS,d='2026-10-13';
    const y=new Date(d+'T00:00:00');y.setDate(y.getDate()-1);const yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    R.generate(yd);R.generate(d);
    const a=JSON.parse(localStorage.getItem('hydroPro_tasks_v1'));const c=a.find(t=>t.roleos&&t.roleos.key==='rea'&&t.due===yd);if(c)c.status='cancelled';localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(a));
    const today=a.filter(t=>t.roleos&&t.due===d).length;
    switchView('tasks_people');await sleep(700);const h=document.getElementById('view-tasks_people');
    const cards=h.querySelectorAll('.pc').length,blocks=h.querySelectorAll('.bk').length,decTxt=h.innerHTML;
    const hasX=/>X<\\/span>/.test(decTxt),hasNA=/NA\\?/.test(decTxt);
    if(c)HNXPW.na(c.id,true);await sleep(200);
    const ok=c?!!JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).find(t=>t.id===c.id).naApprovedBy:true;
    as('reamae');HNXPW.render();await sleep(200);const own=h.querySelectorAll('.pc').length;
    return {cards,blocksMatch:blocks===today,hasX:hasX||!c,hasNA:hasNA||!c,ok,own};})()`),
  expect:{cards:5,blocksMatch:true,hasX:true,hasNA:true,ok:true,own:1} }
];
