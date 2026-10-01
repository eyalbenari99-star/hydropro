/* v21.29 (Eyal): 🎙 Meetings phase 1 — minutes, decisions, actions → tasks, follow-up, legacy import */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true,email:'tester@abapardes.com.ph'},
    {username:'edelynn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true,email:'edelynn@abapardes.com.ph'},
    {username:'syram',fullname:'Syra Mae Montesa',passwordHash:'x',role:'operator',department:'logistics',departments:['logistics'],active:true}]));
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([{id:'L1',name:'Paulo',company:'Tablo Kitchen X Cafe',stage:'meeting'}]));
  localStorage.setItem('hydroPro_crm_meetings',JSON.stringify([{id:'OLD1',leadId:'L1',type:'meeting',date:'2026-09-29',attendees:['Paulo','chef'],agenda:'Supply trial',minutes:'Agreed a trial.',decisions:'Trial 20 kg/week for 4 weeks',actionItems:[{what:'Send the signed supply agreement',who:'Edelyn',when:'2026-10-02'}],by:'edelynn',createdAt:'2026-09-29T08:00:00Z'}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🎙 Meetings: the legacy lead meeting is imported once (linked to Tablo, decision approved, action owner matched to edelynn); a new meeting with 2 actions publishes exactly 2 tasks (idempotent on re-publish) with owner, due, module and a meeting link; the minutes show the task state and "1 of 2 done" after one task is done; decisions go proposed → approved by the chair; a follow-up carries the open action with the SAME task id; the sub-tab is registered in CRM and Production (v21.29)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('tester');
    switchView('crm_meetings');await sleep(900);
    const L=HNXMEET.load();const imp=L.find(m=>m.legacyId==='OLD1')||{};
    const importedOnce=(HNXMEET._import(),HNXMEET.load().filter(m=>m.legacyId==='OLD1').length);
    /* new meeting */
    const m=HNXMEET._blank('crm');m.title='Osteria Antica — first supply';m.chair='tester';m.organiser='tester';m.link={type:'lead',id:'L1',name:'Tablo Kitchen X Cafe'};
    m.attendees=[{kind:'user',id:'edelynn',name:'Edelyn'},{kind:'ext',name:'Marco',role:'owner'}];
    m.minutes.summary='Trial agreed.';m.minutes.decisions=[{id:'D1',text:'Trial 10 kg/week',state:'proposed',by:'',at:''}];
    m.minutes.actions=[{id:'A1',what:'Send quotation',outcome:'quotation in Files',owner:'edelynn',due:'2026-10-03',priority:'high',taskId:null},{id:'A2',what:'Confirm delivery slot',outcome:'',owner:'syram',due:'2026-10-03',priority:'normal',taskId:null}];
    HNXMEET._put(m);
    const n1=HNXMEET._publish(m);const n2=HNXMEET._publish(m);
    const tasks=HNXTASKS.load().filter(t=>(t.links||[]).some(l=>l.type==='meeting'&&l.id===m.id));
    const t1=tasks.find(t=>t.title==='Send quotation')||{};
    HNXTASKS.quickDone(t1.id);await sleep(200);
    const P=HNXMEET.progress(HNXMEET.load().find(x=>x.id===m.id));
    /* decision approval through the editor */
    HNXMEET.open(m.id);await sleep(300);HNXMEET.decState(0,'approved');await sleep(200);
    const dec=HNXMEET.load().find(x=>x.id===m.id).minutes.decisions[0];
    const txt=HNXMEET.text(HNXMEET.load().find(x=>x.id===m.id),'internal');
    /* follow-up carries the open action with the same task */
    HNXMEET.followUp();await sleep(300);
    const fu=HNXMEET.load().find(x=>x.carriedFrom===m.id)||{minutes:{actions:[],decisions:[]}};
    HNXMEET.close();
    const tabs=(MODULES.crm.views||[]).some(v=>v.id==='crm_meetings')&&(MODULES.production.views||[]).some(v=>v.id==='prod_meetings');
    return {imported:!!imp.id,impLink:imp.link&&imp.link.name,impDec:imp.minutes&&imp.minutes.decisions[0]&&imp.minutes.decisions[0].state,impOwner:imp.minutes&&imp.minutes.actions[0]&&imp.minutes.actions[0].owner,importedOnce,
      n1,n2,tasks:tasks.length,owner:t1.owner,due:t1.due,module:t1.module,prio:t1.priority,done:P.done,total:P.total,decState:dec.state,decBy:dec.by,
      textHasDone:/✅ done/.test(txt)&&/\\[APPROVED/.test(txt),fuActions:fu.minutes.actions.length,fuSameTask:fu.minutes.actions[0]&&fu.minutes.actions[0].taskId===(tasks.find(t=>t.title==='Confirm delivery slot')||{}).id,fuDecs:fu.minutes.decisions.length,tabs};})()`),
  expect:{imported:true,impLink:'Tablo Kitchen X Cafe',impDec:'approved',impOwner:'edelynn',importedOnce:1,n1:2,n2:0,tasks:2,owner:'edelynn',due:'2026-10-03',module:'crm',prio:'high',done:1,total:2,decState:'approved',decBy:'tester',textHasDone:true,fuActions:1,fuSameTask:true,fuDecs:0,tabs:true} },
];
