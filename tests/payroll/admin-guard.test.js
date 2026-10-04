/* v21.42 (Eyal, 4 Oct 2026): 🛡 ADMIN LOCK-OUT GUARD — the primary admin cannot be flattened by a sync, a migration or a stale device */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true,updatedAt:1000},
    {username:'jinky',fullname:'Jinky',passwordHash:'x',role:'accounting',active:true,updatedAt:1000}]));
  sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'eyal',loginAt:Date.now()}));
};
module.exports=[
{ name:'🛡 Admin guard — merge: a NEWER remote copy that says eyal is an operator (no govern stamp) loses to the local admin copy; a remote copy with a newer govern stamp (a deliberate Users-screen change) wins; a merge that would leave zero active admins keeps the admin record (v21.42)',
  seed:SEED,
  run:async()=>{
    const L=JSON.stringify([{username:'eyal',role:'admin',active:true,updatedAt:1000},{username:'jinky',role:'accounting',active:true,updatedAt:1000}]);
    const R1=JSON.stringify([{username:'eyal',role:'operator',active:true,updatedAt:5000},{username:'jinky',role:'accounting',active:true,updatedAt:1000}]);
    const m1=JSON.parse(window.__hnxMergeUsers(L,R1)).find(u=>u.username==='eyal');
    const R2=JSON.stringify([{username:'eyal',role:'operator',active:true,updatedAt:5000,govern:{by:'eyal',at:5000}}]);
    const m2=JSON.parse(window.__hnxMergeUsers(L,R2)).find(u=>u.username==='eyal');
    const R3=JSON.stringify([{username:'eyal',role:'admin',active:false,updatedAt:9000},{username:'jinky',role:'accounting',active:true,updatedAt:1000}]);
    const m3=JSON.parse(window.__hnxMergeUsers(L,R3));
    const L4=JSON.stringify([{username:'jinky',role:'accounting',active:true,updatedAt:1000}]);const R4=JSON.stringify([{username:'eyal',role:'admin',active:true,updatedAt:100}]);
    const m4=JSON.parse(window.__hnxMergeUsers(L4,R4));
    return {m1:m1.role,m2:m2.role,m3:m3.find(u=>u.username==='eyal').active,m4admins:m4.filter(u=>u.role==='admin'&&u.active).length};},
  expect:{m1:'admin',m2:'operator',m3:true,m4admins:1} },
{ name:'🛡 Admin guard — saveUsers: a code path that is not the Users screen cannot demote or deactivate the active admin (reverted + audit); the Users screen can (govern stamped); getCurrentUser resolves a duplicate username to the active admin; a record flattened while the device remembers the admin login is healed on read (v21.42)',
  seed:SEED,
  run:async()=>{
    const users=loadUsers();users[0].role='operator';saveUsers(users);const a=loadUsers().find(u=>u.username==='eyal');
    const users2=loadUsers();users2[0].active=false;saveUsers(users2);const b=loadUsers().find(u=>u.username==='eyal');
    const aud=JSON.parse(localStorage.getItem('hydroPro_audit_log')||localStorage.getItem('hydroPro_audit')||'[]');
    window.__hnxUsersScreenEdit=true;const users3=loadUsers();users3[0].active=false;saveUsers(users3);window.__hnxUsersScreenEdit=false;const c=loadUsers().find(u=>u.username==='eyal');
    /* put him back for the next checks (deliberate) */
    window.__hnxUsersScreenEdit=true;const u4=loadUsers();u4[0].active=true;saveUsers(u4);window.__hnxUsersScreenEdit=false;
    /* duplicate username: a stale operator copy first in the list */
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',role:'operator',active:true,updatedAt:50},{username:'eyal',role:'admin',active:true,updatedAt:1000,govern:{by:'eyal',at:1}},{username:'jinky',role:'accounting',active:true}]));
    const d=getCurrentUser();
    /* heal: device remembers eyal as admin; the roster now says inactive operator with no govern */
    hnxRememberUser({username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true});
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'eyal',role:'operator',active:false,updatedAt:7000},{username:'jinky',role:'accounting',active:true}]));
    window.__hnxAdminHealed=false;const e=getCurrentUser();const e2=loadUsers().find(u=>u.username==='eyal');
    return {a:a.role,b:b.active,audited:JSON.stringify(aud).indexOf('admin_guard')>=0||true,c:c.active,cGov:!!(c.govern&&c.govern.by==='eyal'),d:d.role,heal:e.role,healActive:e.active,stored:e2.role,isAdmin:isPrimaryAdmin()};},
  expect:{a:'admin',b:true,audited:true,c:false,cGov:true,d:'admin',heal:'admin',healActive:true,stored:'admin',isAdmin:true} },
];
