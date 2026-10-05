/* v21.47 (Eyal): ✨ New task wizard — every user, from the cockpit and the floating ➕ */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Accountant',passwordHash:'x',role:'accounting',active:true,department:'accounting'},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));
  localStorage.setItem('hydroPro_tasks_v1','[]');
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'✨ Task wizard: Jinky (accounting, not admin) opens the wizard from HNXTASKS.drawer(null), fills three steps (title, module accounting, high, due tomorrow, team, evidence rule, one step) and saves — the task exists with owner jinky and one subtask; the celebration card shows; the floating ➕ is visible on tasks_my and hidden on dashboard (v21.47)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(4000);as('jinky');
    switchView('tasks_my');await sleep(1500);const fabOn=getComputedStyle(document.getElementById('hnxTaskFab')).display!=='none';
    HNXTASKS.drawer(null);await sleep(150);const wiz1=!!document.getElementById('hnxTaskWiz');
    HNXTASKWIZ.set('title','Send SM the delivery schedule',true);HNXTASKWIZ.set('outcome','Confirmed by buyer',true);HNXTASKWIZ.set('module','accounting');HNXTASKWIZ.set('type','follow-up');HNXTASKWIZ.next();await sleep(50);
    const step2=HNXTASKWIZ.state().step;HNXTASKWIZ.set('priority','high');const tmr=new Date();tmr.setDate(tmr.getDate()+1);const d=tmr.getFullYear()+'-'+String(tmr.getMonth()+1).padStart(2,'0')+'-'+String(tmr.getDate()).padStart(2,'0');HNXTASKWIZ.set('due',d);HNXTASKWIZ.set('visibility','team');HNXTASKWIZ.next();await sleep(50);
    const step3=HNXTASKWIZ.state().step;HNXTASKWIZ.set('rule','evidence');document.getElementById('twSub').value='Call the buyer';HNXTASKWIZ.addSub();HNXTASKWIZ.save();await sleep(200);
    const done=!!document.querySelector('#hnxTaskWiz .tw-done');const all=HNXTASKS.load();const t=all.find(x=>x.title==='Send SM the delivery schedule');const sub=all.find(x=>x.parentId===(t&&t.id));
    HNXTASKWIZ.close();switchView('geo_dash');await sleep(1500);const fabOff=getComputedStyle(document.getElementById('hnxTaskFab')).display==='none';
    return {purch:!!(HNXTASKS.heads&&true)&&(function(){HNXTASKWIZ.open();HNXTASKWIZ.set('module','purchasing');var ok=!!document.querySelector('#hnxTaskWiz .tw-tile.on')&&/Purchasing/.test(document.querySelector('#hnxTaskWiz .tw-tile.on').textContent);HNXTASKWIZ.close();return ok;})(),fabOn,wiz1,step2,step3,done,owner:t&&t.owner,module:t&&t.module,pri:t&&t.priority,due:t&&t.due===d,vis:t&&t.visibility,rule:t&&t.rule,sub:sub&&sub.title,subOwner:sub&&sub.owner,fabOff};})();`),
  expect:{fabOn:true,wiz1:true,step2:2,step3:3,done:true,owner:'jinky',module:'accounting',pri:'high',due:true,vis:'team',rule:'evidence',sub:'Call the buyer',subOwner:'jinky',fabOff:true,purch:true} },
];
