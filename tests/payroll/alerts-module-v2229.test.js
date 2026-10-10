/* v22.29 trial (Eyal 9 Oct, rebuilt after the reset): an alert belongs to its module; its card pops only for people who can open that
   module, and the top bar's ⚠ Alerts lists the open alerts of MY modules, blinking while any is critical. */
module.exports=[
{ name:'⚠ Alerts by module: Pool 6 pH HIGH (urgent, irrigation), a missed checkpoint (priority, security), Pump leak (urgent maintenance task) and a closed irrigation call → the guard (Security only) gets the checkpoint card and 1 alert, no pool card; Eyal (all modules) sees 3 — 2 critical — and ⚠ Alerts blinks with 3, grouped Irrigation / Maintenance / Security (v22.29)',
  requires:"typeof window.hnxAlertForMe==='function'&&typeof window.hnxMyAlerts==='function'&&typeof window._fireNotification==='function'",
  run:async()=>{
    const g=window.getCurrentUser,ge=window.getEffectiveModuleAccess;
    const U={guard:{username:'guard',fullname:'Guard One',role:'staff',department:'security',active:true},eyal:{username:'eyal',fullname:'Eyal Ben Ari',role:'admin',active:true}};
    window.getEffectiveModuleAccess=(u,m)=>u.username==='eyal'?'edit':(m==='security'?'edit':'none');
    const now=new Date().toISOString();
    localStorage.setItem('hydroPro_calls',JSON.stringify([
      {id:'cA',subject:'Pool 6 · pH HIGH (7.10)',priority:'urgent',status:'open',sourceModule:'irr_pools',area:'GH6',createdAt:now,updates:[]},
      {id:'cB',subject:'Missed checkpoint 3',priority:'priority',status:'open',sourceModule:'sec_patrol',createdAt:now,updates:[]},
      {id:'cC',subject:'Pool 2 · EC LOW',priority:'urgent',status:'closed_fixed',sourceModule:'irr_pools',createdAt:now,updates:[]}]));
    localStorage.setItem('hydroPro_maint_tasks',JSON.stringify([{id:'tA',title:'Pump leak GH3',priority:'urgent',status:'open',category:'Plumbing',createdAt:now}]));
    try{Object.keys(window._perfCache||{}).forEach(k=>delete window._perfCache[k]);}catch(e){} /* loadCalls keeps a 2-s cache */
    const host=document.getElementById('notifToastHost');if(host)host.innerHTML='';
    window.getCurrentUser=()=>U.guard;
    const fm=[window.hnxAlertForMe({src:'irr_pools'}),window.hnxAlertForMe({src:'sec_patrol'}),window.hnxAlertForMe({taskId:'tA',src:''})];
    window._fireNotification({severity:'critical',title:'Pool 6 · pH HIGH',src:'irr_pools',callId:'cA',tag:'call:cA'});
    window._fireNotification({severity:'warning',title:'Missed checkpoint 3',src:'sec_patrol',callId:'cB',tag:'call:cB'});
    await sleep(50);
    const cards=[...((document.getElementById('notifToastHost')||{}).children||[])].map(c=>c.dataset&&c.dataset.src).filter(Boolean);
    const guard=window.hnxMyAlerts(true).map(a=>a.id);
    window.getCurrentUser=()=>U.eyal;
    const L=window.hnxMyAlerts(true);
    window.hnxModAlertsPaint();await sleep(50);
    const b=document.getElementById('hnxModAlertsBtn');
    window.hnxModAlertsToggle(true);await sleep(30);
    const groups=[...document.querySelectorAll('#hnxModAlertsPanel .g')].map(x=>x.textContent.split(' · ')[0]).sort();
    window.hnxModAlertsToggle(false);
    window.getCurrentUser=g;window.getEffectiveModuleAccess=ge;
    return {fm,cards,guard,eyal:[L.length,L.filter(a=>a.crit).length],btn:b?[b.className,b.querySelector('.n').textContent]:null,groups};},
  expect:{fm:[false,true,false],cards:['sec_patrol'],guard:['cB'],eyal:[3,2],btn:['crit','3'],groups:['Irrigation','Maintenance','Security']} }
];
