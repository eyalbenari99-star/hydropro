/* v21.14: ⚠ attendance deviations — one clock ID scanning twice in the morning and twice after work */
const SEED=function(){
  localStorage.setItem('hydroPro_employees',JSON.stringify([
    {id:'E1',name:'DELA CRUZ, JUAN',status:'Active',payType:'weekly',dept:'Construction',dailyRate:658},
    {id:'E2',name:'SANTOS, MARIA',status:'Active',payType:'weekly',dept:'Construction',dailyRate:658}]));
  localStorage.setItem('hydroPro_bio_map_v1',JSON.stringify({'101':'E1','102':'E2'}));
  localStorage.setItem('hydroPro_notify_cfg_v1',JSON.stringify({workerUrl:'https://nexi-notify.test',workerToken:'t'}));
  window.__mails=[];
  const of=window.fetch;
  window.fetch=function(u,o){
    if(String(u).indexOf('https://nexi-notify.test/')===0){window.__mails.push(JSON.parse(o.body));return Promise.resolve(new Response('{"ok":true}',{status:200}));}
    return of.apply(this,arguments);
  };
  const D=new Date();D.setDate(D.getDate()-1);const y=D.getFullYear()+'-'+String(D.getMonth()+1).padStart(2,'0')+'-'+String(D.getDate()).padStart(2,'0');
  window.__devDay=y;
  window.__hnxBioLastDays=function(){return [{date:y,punches:[
    {userId:'101',time:'07:01:10'},{userId:'101',time:'07:26:40'},{userId:'101',time:'17:02:00'},{userId:'101',time:'17:41:30'},
    {userId:'102',time:'07:05:00'},{userId:'102',time:'07:05:50'},{userId:'102',time:'17:10:00'}]}];};
};
module.exports=[
{ name:'⚠ Juan: clock ID 101 scanned 07:01, 07:26, 17:02, 17:41 → ONE deviation (2 morning scans 25 min apart · 2 evening scans 39 min apart); Maria’s double tap 07:05/07:05 is one scan, no deviation; ONE e-mail to accounting@ + it@ naming Juan, marked sent (v21.14)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);
    hnxAttDev.tick();await sleep(800);
    const L=hnxAttDev.list();
    return {n:L.length,who:L.map(d=>d.empId),why:L[0]&&L[0].why,times:L[0]&&L[0].times,status:L[0]&&L[0].status,
      mails:__mails.length,to:__mails[0]&&__mails[0].to,subj:__mails[0]&&/DELA CRUZ, JUAN/.test(__mails[0].subject),body:__mails[0]&&/07:01, 07:26, 17:02, 17:41/.test(__mails[0].text),
      sent:!!(L[0]&&L[0].mailedAt)};},
  expect:{n:1,who:['E1'],why:['2 morning scans 25 min apart','2 evening scans 39 min apart'],times:['07:01','07:26','17:02','17:41'],status:'open',
    mails:1,to:['accounting@abapardes.com.ph','it@abapardes.com.ph'],subj:true,body:true,sent:true} },

{ name:'⚠ The next pull finds the same scans: no second deviation and no second e-mail (v21.14)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);
    hnxAttDev.tick();await sleep(800);hnxAttDev.tick();await sleep(800);await hnxAttDev.mail(true);
    return {n:hnxAttDev.list().length,mails:__mails.length};},
  expect:{n:1,mails:1} },

{ name:'⚠ Attendance Matrix: Juan’s day is framed ⚠ CHECK with a red banner and ⚠ Review deviations; after ✅ Approve with a note it shows ⚠✓ OK, keeps who/when, the banner is gone and the attendance record is untouched (v21.14)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);
    hnxAttDev.tick();await sleep(800);
    const y=__devDay;
    const att=JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}');const before=JSON.stringify((att[y]||{}).E1||null);
    hnxAttMatrix();await sleep(600);
    const mx=()=>document.getElementById('hnxAttMxBody').innerHTML;
    const open1={check:/⚠ CHECK/.test(mx()),banner:/1 attendance deviation waiting/.test(mx()),btn:/Review deviations/.test(mx())};
    window.prompt=()=>'went out for supplies at 07:10, came back';
    const id=hnxAttDev.list()[0].id;hnxAttDev.decide(id,'approved');await sleep(500);
    const d=hnxAttDev.list()[0];
    const att2=JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}');
    return {open1,status:d.status,by:!!d.decidedBy,note:d.note,ok:/⚠✓ OK/.test(mx()),banner:/attendance deviation.? waiting/.test(mx()),
      recSame:JSON.stringify((att2[y]||{}).E1||null)===before};},
  expect:{'open1.check':true,'open1.banner':true,'open1.btn':true,status:'approved',by:true,note:'went out for supplies at 07:10, came back',ok:true,banner:false,recSame:true} },

{ name:'⚠ A decision needs a note: an empty note leaves it waiting (v21.14)',
  seed:SEED,
  run:async()=>{
    await sleep(2500);hnxAttDev.tick();await sleep(800);
    window.prompt=()=>'';hnxAttDev.decide(hnxAttDev.list()[0].id,'rejected');await sleep(200);
    return {status:hnxAttDev.list()[0].status};},
  expect:{status:'open'} },
];
module.exports.push(
{ name:'⚠ Jinky (Accounting, not admin) can ✅ Approve or ⚠ Send to admin but not “Not accepted”; once sent to admin she cannot decide it, the cell turns ⚠ ADMIN and an admin decides (v21.14)',
  seed:new Function('('+SEED.toString()+')();localStorage.setItem(\'hydroPro_users\',JSON.stringify([{username:\'jinky\',fullname:\'Jinky Pagtama\',passwordHash:\'x\',role:\'staff\',department:\'Accounting\',active:true},{username:\'tester\',fullname:\'Tester\',passwordHash:\'x\',role:\'admin\',active:true}]));sessionStorage.setItem(\'hydroPro_session\',JSON.stringify({username:\'jinky\',loginAt:Date.now()}));'),
  run:async()=>{
    await sleep(2500);hnxAttDev.tick();await sleep(800);
    const id=hnxAttDev.list()[0].id;
    window.prompt=()=>'no idea';hnxAttDev.decide(id,'rejected');await sleep(200);
    const afterReject=hnxAttDev.list()[0].status;
    window.prompt=()=>'two people on one ID?';hnxAttDev.decide(id,'escalated');await sleep(200);
    const esc=hnxAttDev.list()[0];
    hnxAttDev.decide(id,'approved');await sleep(200);
    const stillEsc=hnxAttDev.list()[0].status;
    const cell=hnxAttDev.cell('E1',__devDay).badge;
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));
    window.prompt=()=>'confirmed: colleague scanned for him';hnxAttDev.decide(id,'rejected');await sleep(200);
    const fin=hnxAttDev.list()[0];
    return {afterReject,esc:esc.status,escBy:esc.escalatedBy,stillEsc,admin:/⚠ ADMIN/.test(cell),final:fin.status,note:fin.note};},
  expect:{afterReject:'open',esc:'escalated',escBy:'Jinky Pagtama',stillEsc:'escalated',admin:true,final:'rejected',note:'confirmed: colleague scanned for him'} }
);
