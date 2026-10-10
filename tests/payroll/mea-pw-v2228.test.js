/* v22.28 security: Mea's first password never sits in the synced Role OS store (hydroPro_roleos_v1) */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'reamae',fullname:'Rea Mae Gaco',passwordHash:'x',role:'accounting',active:true}]));
  localStorage.setItem('hydroPro_roleos_v1','{}');
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🔑 Admin creates meajean → 0 passwords in the synced Role OS store, the Duty board shows the first password (Nexi- + 6) to the admin once, and after "seen" it is gone from the board and memory (v22.28)',
  requires:"!!(window.HNXROLEOS&&HNXROLEOS.purgeMeaPw)",
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('tester');await sleep(6000);delete window.__hnxMeaPwOnce;
    const made=await HNXROLEOS.ensureMea();
    const S=JSON.parse(localStorage.getItem('hydroPro_roleos_v1')||'{}');
    HNXROLEOS.render();const host=document.getElementById('view-tasks_roleos');const h1=host?host.innerHTML:'';
    const m=h1.match(/First password: <code>(Nexi-[A-Z0-9]{6})<\\/code>/);
    const inStore=JSON.stringify(S).indexOf(m?m[1]:'Nexi-')>=0;
    HNXROLEOS.pwSeen();const h2=host?host.innerHTML:'';
    return {made,stored:'meaPw' in S,inStore,shown:!!m,after:/First password/.test(h2),mem:!!window.__hnxMeaPwOnce};})()`),
  expect:{made:true,stored:false,inStore:false,shown:true,after:false,mem:false} },
{ name:'🔑 An old copy "Nexi-ABC234" already in the synced store: on Rea’s computer it is removed and NOT kept; on the admin’s computer it is removed from the store but shown on the Duty board this session (v22.28)',
  requires:"!!(window.HNXROLEOS&&HNXROLEOS.purgeMeaPw)",
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('reamae');await sleep(6000);delete window.__hnxMeaPwOnce;
    localStorage.setItem('hydroPro_roleos_v1',JSON.stringify({meaDone:1,meaPw:'Nexi-ABC234'}));
    const r1=HNXROLEOS.purgeMeaPw();const rea={purged:r1,store:localStorage.getItem('hydroPro_roleos_v1').indexOf('ABC234')>=0,mem:!!window.__hnxMeaPwOnce};
    localStorage.setItem('hydroPro_roleos_v1',JSON.stringify({meaDone:1,meaPw:'Nexi-ABC234'}));as('tester');
    HNXROLEOS.render();const host=document.getElementById('view-tasks_roleos');const h=host?host.innerHTML:'';
    const adm={store:localStorage.getItem('hydroPro_roleos_v1').indexOf('ABC234')>=0,shown:/First password: <code>Nexi-ABC234</.test(h),done:JSON.parse(localStorage.getItem('hydroPro_roleos_v1')).meaDone};
    return {rea,adm};})()`),
  expect:{rea:{purged:true,store:false,mem:false},adm:{store:false,shown:true,done:1}} }
];
