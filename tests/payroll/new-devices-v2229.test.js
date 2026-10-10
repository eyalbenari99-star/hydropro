/* v22.29 trial (new devices, rebuilt after the reset): the invite link carries the person's department(s), position and rights record
   (a fresh device gave them nothing under Strict-by-default); the cloud sign-in is retried per username every 20 s (it was asked once
   per page load); the sign-in card scrolls on a phone (SIGN IN sat below the screen). */
module.exports=[
{ name:'📱 New device: Rea (Accounting, AP clerk, Strict with Inventory = edit) is invited → on a device with no roster the link creates her WITH department accounting, position AP clerk and her rights record (Inventory edit); the cloud sign-in may be retried for rea after 20 s and at once for another username; the login overlay scrolls (v22.29)',
  requires:"typeof window.hnxRosterMayTry==='function'&&!!document.getElementById('hnx-login-phone-v2229')",
  run:async()=>{
    window.alert=()=>{};
    const keepU=localStorage.getItem('hydroPro_users'),keepP=localStorage.getItem('hydroPro_user_perms');
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'rea',fullname:'Rea Santos',role:'operator',active:true,department:'accounting',departments:['accounting'],position:'AP clerk',passwordHash:'x'}]));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({rea:{strict:true,overrides:{'module:inventory':'edit'}}}));
    const url=window.buildInviteURL({username:'rea',fullname:'Rea Santos',email:'',password:'Temp12345',role:'operator'});
    const b64=url.split('#invite=')[1];
    const payload=JSON.parse(decodeURIComponent(escape(atob(b64))));
    /* the new device: nothing synced yet */
    localStorage.setItem('hydroPro_users','[]');localStorage.setItem('hydroPro_user_perms','{}');
    history.replaceState(null,'','#invite='+b64);
    await processInviteLink();await sleep(50);
    const u=(JSON.parse(localStorage.getItem('hydroPro_users'))||[]).find(x=>x.username==='rea')||{};
    const pm=(JSON.parse(localStorage.getItem('hydroPro_user_perms'))||{}).rea||{};
    const t1=window.hnxRosterMayTry('a','rea'),t2=window.hnxRosterMayTry('a','REA'),t3=window.hnxRosterMayTry('a','jomel');
    window.__hnxRosterTry['a|rea']=Date.now()-21000;const t4=window.hnxRosterMayTry('a','rea');
    const ov=getComputedStyle(document.getElementById('loginScreen')).overflowY;
    if(keepU!=null)localStorage.setItem('hydroPro_users',keepU);if(keepP!=null)localStorage.setItem('hydroPro_user_perms',keepP);
    return {link:[payload.d,payload.ps,!!(payload.pm&&payload.pm.overrides)],user:[u.department,(u.departments||[]).join(','),u.position,u.mustChangePassword],pm:[pm.strict,(pm.overrides||{})['module:inventory']],tries:[t1,t2,t3,t4],ov};},
  expect:{link:['accounting','AP clerk',true],user:['accounting','accounting','AP clerk',true],pm:[true,'edit'],tries:[true,false,true,true],ov:'auto'} }
];
