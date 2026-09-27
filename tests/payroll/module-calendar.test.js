/* v21.15: Customer Relations moved to CRM; a calendar in every module */
module.exports=[
{ name:'🤝 Customer Relations is gone from the Compliance menu and is CRM ▸ Customer Care; the old link cea_customers opens it in CRM and it renders the same screen (Accounts / Complaints tabs) (v21.15)',
  run:async()=>{
    await sleep(6000);
    const inCea=MODULES.cea.views.some(v=>v.id==='cea_customers'),inCrm=MODULES.crm.views.some(v=>v.id==='crm_customer_care');
    switchView('cea_customers');await sleep(800);
    const act=document.querySelector('.view.active');
    const html=(document.getElementById('view-crm_customer_care')||{}).innerHTML||'';
    return {inCea,inCrm,active:act&&act.id,tabs:/Accounts/.test(html)&&/Complaints/.test(html)};},
  expect:{inCea:false,inCrm:true,active:'view-crm_customer_care',tabs:true} },

{ name:'📅 Every module (Production, HR, Maintenance, Irrigation, CRM, Compliance …) ends with 📅 Calendar; a task added in Maintenance shows only there, is stored in the shared calendar with module maintenance, and the main calendar store holds it (v21.15)',
  run:async()=>{
    await sleep(6000);
    const mods=['production','hr','maintenance','irrigation','crm','cea','inventory','logistics'];
    const has=mods.map(m=>MODULES[m].views.some(v=>v.id===m+'_calendar'));
    switchView('maintenance_calendar');await sleep(400);
    HNXMCAL.add('maintenance',today);await sleep(100);
    document.getElementById('mcT').value='Replace pump seal GH3';document.getElementById('mcA').value='tester';document.getElementById('mcR').value='1';
    HNXMCAL.save('maintenance','');await sleep(300);
    const all=JSON.parse(localStorage.getItem('hydroPro_cal_events_v2')||'[]').filter(e=>e.title==='Replace pump seal GH3');
    const mainHtml=document.getElementById('view-maintenance_calendar').innerHTML;
    return {has,n:all.length,mod:all[0]&&all[0].module,assignee:all[0]&&all[0].assignee,inMaint:HNXMCAL.items('maintenance').length,inProd:HNXMCAL.items('production').length,shown:/Replace pump seal GH3/.test(mainHtml)};},
  expect:{has:[true,true,true,true,true,true,true,true],n:1,mod:'maintenance',assignee:'tester',inMaint:1,inProd:0,shown:true} },

{ name:'🔔 Reminder “1 day before”: due for the assignee from the day before, not two days before; not for someone else; stops once marked done (v21.15)',
  run:async()=>{
    await sleep(4000);
    const add=(d,n)=>{const t=new Date(d+'T00:00:00');t.setDate(t.getDate()+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};
    const due=add(today,5);
    const a=JSON.parse(localStorage.getItem('hydroPro_cal_events_v2')||'[]');
    a.push({id:'EVT_T1',module:'hr',title:'Contract renewal Juan',date:due,remind:'1',assignee:'tester',createdBy:'tester',done:false});
    localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify(a));
    const r2=HNXMCAL.due('tester',add(due,-2)).length,r1=HNXMCAL.due('tester',add(due,-1)).length,other=HNXMCAL.due('someone',add(due,-1)).length;
    HNXMCAL.done('hr','EVT_T1');await sleep(200);
    const after=HNXMCAL.due('tester',due).length;
    return {r2,r1,other,after};},
  expect:{r2:0,r1:1,other:0,after:0} },
];
