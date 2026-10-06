/* v21.80: Rea + Mea role operating systems */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'reamae',fullname:'Rea Mae Gaco',passwordHash:'x',role:'accounting',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'accounting',email:'jinky@abapardes.com.ph',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🧭 Role OS: admin session creates meajean (Admin+HR, must change pw); Tue 13 Oct → Rea 8 daily + 4 weekly (W03–W06) = 12, Mea 16 daily; Sat 10 Oct → 0 duties (Saturday off) but Fri 9 Oct carries Rea W12–W14 + Mea W04–W09; Oct M02 "last" = Sat 31 → Fri 30; Mea M14 last Sunday = 25 Oct; second generate adds 0; Rea D01 done 07:50 with proof = D, D03 done 15:40 = L, D02 open after 16:00 = X; reminder 30 min before reaches Rea; +2 h escalation reaches Jinky; 17:45 fail report lands in Jinky, Dr Amy and Eyal inboxes once (v21.80)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('tester');await sleep(6000);window.confirm=()=>true;
    await HNXROLEOS.ensureMea();
    const mea=JSON.parse(localStorage.getItem('hydroPro_users')).find(u=>u.username==='meajean')||{};
    const R=HNXROLEOS;
    const g1=R.generate('2026-10-13'),g2=R.generate('2026-10-13');
    const T=JSON.parse(localStorage.getItem('hydroPro_tasks_v1'));
    const rea13=T.filter(t=>t.roleos&&t.roleos.key==='rea'&&t.due==='2026-10-13').length,mea13=T.filter(t=>t.roleos&&t.roleos.key==='mea'&&t.due==='2026-10-13').length;
    const sat=R.dutiesOn('rea','2026-10-10').length+R.dutiesOn('mea','2026-10-10').length;
    const fri=R.dutiesOn('rea','2026-10-09').filter(x=>x.freq==='weekly').map(x=>x.tid).join(',')+'|'+R.dutiesOn('mea','2026-10-09').filter(x=>x.freq==='weekly').map(x=>x.tid).join(',');
    const last=R.ruleDate('last','2026-10-05'),lastSun=R.ruleDate('lastSun','2026-10-05');
    const tk=id=>JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).find(t=>t.id===id);
    const mk=(id,iso)=>{const a=JSON.parse(localStorage.getItem('hydroPro_tasks_v1'));const t=a.find(x=>x.id===id);t.status='done';t.doneAt=iso;t.evidence=[{note:'proof'}];localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(a));};
    mk('ROS_rea_D01_2026-10-13','2026-10-12T23:50:00Z');mk('ROS_rea_D03_2026-10-13','2026-10-13T07:40:00Z');
    const c1=R.code(tk('ROS_rea_D01_2026-10-13'),'2026-10-13','17:00'),c3=R.code(tk('ROS_rea_D03_2026-10-13'),'2026-10-13','17:00'),c2=R.code(tk('ROS_rea_D02_2026-10-13'),'2026-10-13','16:30'),c8=R.code(tk('ROS_rea_D08_2026-10-13'),'2026-10-13','16:30');
    R.remind('2026-10-13','16:05');R.remind('2026-10-13','18:05');
    const ib=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
    const rem=ib().some(x=>x.user==='reamae'&&x.id==='ROSR_ROS_rea_D05_2026-10-13'),esc=ib().some(x=>x.user==='jinky'&&x.id==='ROSE_ROS_rea_D02_2026-10-13');
    const f1=R.sendReport('2026-10-13'),f2=R.sendReport('2026-10-13');
    const fr=ib().filter(x=>/^ROSF_2026-10-13_/.test(x.id)).map(x=>x.user).sort().join(',');
    return {mea:[mea.role,mea.departments&&mea.departments.join('+'),mea.mustChangePassword,mea.email].join('|'),g1,g2,rea13,mea13,sat,fri,last,lastSun,c1,c3,c2,c8,rem,esc,
      fail:!!f1&&f2===null&&/X  D02/.test(f1.text)&&/L  D03/.test(f1.text),fr};})()`),
  expect:{mea:'supervisor|hr+admin|true|meajean@abapardes.com.ph',g1:28,g2:0,rea13:12,mea13:16,sat:0,fri:'W12,W13,W14|W04,W05,W06,W07,W08,W09',last:'2026-10-30',lastSun:'2026-10-25',c1:'D',c3:'L',c2:'X',c8:'open',rem:true,esc:true,fail:true,fr:'amy,eyal,jinky'} },
{ name:'📇 Rea contact: admin session fills Rea Mae Gaco card with reag@abapardes.com.ph and +639178209154; a card that already has an e-mail keeps it (v21.81)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}as('tester');await sleep(6000);const ch=HNXROLEOS.ensureRea();
    const r=JSON.parse(localStorage.getItem('hydroPro_users')).find(u=>u.username==='reamae');
    const U=JSON.parse(localStorage.getItem('hydroPro_users'));U.find(u=>u.username==='reamae').email='rea.old@abapardes.com.ph';localStorage.setItem('hydroPro_users',JSON.stringify(U));
    HNXROLEOS.ensureRea();const r2=JSON.parse(localStorage.getItem('hydroPro_users')).find(u=>u.username==='reamae');
    return {ch,email:r.email,phone:r.phone,keep:r2.email};})()`),
  expect:{ch:true,email:'reag@abapardes.com.ph',phone:'+639178209154',keep:'rea.old@abapardes.com.ph'} }
];
