/* v22.28 security (R11 S02): People & Work managers = admin role or exactly the Duty board's three managers — never a name match */
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([
  {username:'amyc',fullname:'Amy Cruz',passwordHash:'x',role:'operator',active:true},
  {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'reamae',fullname:'Rea Mae Gaco',passwordHash:'x',role:'accounting',active:true},{username:'meajean',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',active:true},
  {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',active:true},{username:'joshane',fullname:'Joshane Espinosa',passwordHash:'x',role:'accounting',active:true},
  {username:'syra',fullname:'Syra Mae Montesa',passwordHash:'x',role:'supervisor',active:true},{username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'accounting',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'👥 People & Work: Jinky and Dr Amy see all 5 people, the admin sees 5, Rea sees 1 (her own), and "Amy Cruz" (operator, listed before Dr Amy) sees 0 and is not the Duty board\'s Amy (v22.28)',
  requires:"!!(window.HNXROLEOS&&HNXROLEOS.isMgr)",
  seed:SEED,
  run:new Function(`return (async()=>{${AS}as('tester');await sleep(6000);
    const n=u=>{as(u);return HNXPW.people().length;};
    const r={jinky:n('jinky'),amy:n('amy'),tester:n('tester'),reamae:n('reamae'),amyc:n('amyc'),mgrAmy:HNXROLEOS.mgrs().amy};
    as('tester');return r;})()`),
  expect:{jinky:5,amy:5,tester:5,reamae:1,amyc:0,mgrAmy:'amy'} }
];
