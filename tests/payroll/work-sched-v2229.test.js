/* v22.29 trial (memo of 9 Oct 2026, rebuilt after the reset): a person's own work schedule is proposed by HR and APPROVED by Jinky
   (or Eyal / Dr Amy) before late and undertime are judged against it; nobody approves their own proposal. */
module.exports=[
{ name:'🕐 Work schedule: Mea (HR) proposes 06:00–15:00 for Juan (Production, department 07:00–17:30) → still 07:00 until approved; Mea cannot approve her own proposal; Jinky approves → Juan is judged on 06:00–15:00; a schedule from a later day waits for that day; "back to department hours" clears it (v22.29)',
  requires:"!!(window.hnxSched&&typeof hnxWorkSchedule==='function')",
  run:async()=>{
    window.showToast=()=>{};window.alert=()=>{};window.confirm=()=>true;
    const g=window.getCurrentUser,ge=window.getEffectiveModuleAccess;
    const U={mea:{username:'mea',fullname:'Mea Magracia',role:'hr',active:true},jinky:{username:'jinky',fullname:'Jinky Pagtama',role:'accounting',active:true}};
    window.getEffectiveModuleAccess=(u,m)=>(u.username==='mea'&&m==='hr')?'edit':'view';
    const e=labour('E1','JUAN DELA CRUZ',{dept:'PROD_TRAINEES'});setE([e]);
    localStorage.setItem('hydroPro_sched_requests_v1','[]');
    const sch=()=>{const x=hnxWorkSchedule(loadEmployees().find(z=>z.id==='E1'));return x.start+'-'+x.end;};
    const d0=sch();
    window.getCurrentUser=()=>U.mea;
    const r=window.hnxSched.propose('E1','06:00','15:00','','Memo 9 Oct: early shift');
    const pending=[r&&r.status,sch()];
    const own=window.hnxSched.decide(r.id,true);
    window.getCurrentUser=()=>U.jinky;
    const ok=window.hnxSched.decide(r.id,true);
    const after=sch();
    const t=new Date();t.setDate(t.getDate()+3);const fut=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    window.getCurrentUser=()=>U.mea;const r2=window.hnxSched.propose('E1','05:00','14:00',fut,'Next week rotation');
    window.getCurrentUser=()=>U.jinky;window.hnxSched.decide(r2.id,true);const waits=[sch(),window.hnxSched.list().find(x=>x.id===r2.id).status];
    window.getCurrentUser=()=>U.mea;const r3=window.hnxSched.propose('E1','','','','back to the department hours');
    window.getCurrentUser=()=>U.jinky;window.hnxSched.decide(r3.id,true);const back=sch();
    window.getCurrentUser=g;window.getEffectiveModuleAccess=ge;
    return {d0,pending,own,ok,after,waits,back};},
  expect:{d0:'07:00-17:30',pending:['pending','07:00-17:30'],own:false,ok:true,after:'06:00-15:00',waits:['06:00-15:00','approved'],back:'07:00-17:30'} }
];
