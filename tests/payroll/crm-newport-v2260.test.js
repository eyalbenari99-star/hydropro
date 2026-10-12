/* v22.60 (Eyal, 12 Oct 2026, ABA_PARDES_Newport_Customer_Prospects.xlsx: "add all that not her or active customers (meaning buying for the
   last 30 days) to Nexi as new leads in crm and to add to tasks and calendar for processing communication when new leads"). 49 Newport
   City outlets (24 A, 20 B, 5 C): new CRM leads, except an outlet already a lead or one that bought in the last 30 days; a past customer
   is added as "win back". One "☎ First contact" task per new lead for Edelyn (shared Eyal + Dr Amy) under one parent; due by priority from
   today (Mon 12 Oct 2026): A +2 working days = Wed 14 Oct, B +5 = Sat 17 Oct, C +10 = Fri 23 Oct (Sundays not counted). */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'edelyn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'guard1',fullname:'Gate Guard',passwordHash:'x',role:'operator',department:'security',departments:['security'],active:true}]));
  localStorage.setItem('hydroPro_crm_leads','[]');localStorage.setItem('hydroPro_tasks_v1','[]');
  localStorage.setItem('hydroPro_crm_newport_seed_v1','{"at":1}'); /* the automatic run is kept out of the way: each case calls the seed itself */
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
const T0="'2026-10-12'";
const NEW="typeof window.hnxNewportSeed==='function'&&Array.isArray(window.__hnxNewportProspects)";
module.exports=[
{ name:'🤝 the company as Nexi ships it (144 customers already leads), today Mon 12 Oct 2026: 6 outlets already in the CRM are left out (Cafe Mary Grace, Brotzeit, Hotel Okura Manila, Manila Marriott Hotel, Sheraton Manila Hotel, Belmont Hotel Manila) → 43 Newport leads (stage new, owner Edelyn) + 43 "☎ First contact" tasks under 1 parent, owned by edelyn and shared with eyal + amy; due: 20 A on Wed 14 Oct, 18 B on Sat 17 Oct, 5 C on Fri 23 Oct; 40 grouped "Newport World Resorts", 3 "Newport City"; a second run adds 0; a deleted lead + its task are not re-created',
  requires:NEW, seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('edelyn');await sleep(5000);window.__hnxPulledOk=true;
    const r1=hnxNewportSeed({today:${T0},force:true});const r2=hnxNewportSeed({today:${T0},force:true});
    const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>/^LEAD_NP_/.test(l.id));
    const T=JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).filter(t=>t.plan==='newport2610');
    const kids=T.filter(t=>t.parentId==='TSK_NEWPORT2610_PLAN');
    const due=p=>kids.filter(t=>t.title.endsWith('('+p+')')).map(t=>t.due);
    const one=a=>[...new Set(a)].join(',')+'×'+a.length;
    /* the team deletes NP-049 and its task (tombstones), then a re-check */
    const o=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');const gone=L[L.length-1].id,gt='TSK_NP2610_'+gone.slice(-3);(o.hydroPro_crm_leads=o.hydroPro_crm_leads||{})[gone]=Date.now();(o.hydroPro_tasks_v1=o.hydroPro_tasks_v1||{})[gt]=Date.now();localStorage.setItem('hydroPro_optomb',JSON.stringify(o));
    localStorage.setItem('hydroPro_crm_leads',JSON.stringify(JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>l.id!==gone)));
    localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).filter(t=>t.id!==gt)));
    const r3=hnxNewportSeed({today:${T0},force:true});
    return {r1:r1.added,tasks:r1.tasks,already:r1.skippedLead.join(','),r2:r2.added,leads:L.length,stageNew:L.every(l=>l.stage==='new'),ownerName:L[0].owner,kids:kids.length,parent:T.some(t=>t.id==='TSK_NEWPORT2610_PLAN'),
      owner:kids.every(t=>t.owner==='edelyn'),shared:kids.every(t=>t.sharedWith.join(',')==='eyal,amy'&&t.visibility==='users'),linked:kids.every(t=>t.links[0]==='customer:LEAD_NP_'+t.id.slice(-3)),
      A:one(due('A')),B:one(due('B')),C:one(due('C')),nwr:L.filter(l=>l.group==='Newport World Resorts').length,city:L.filter(l=>l.group==='Newport City').length,r3:r3.added};})()`),
  expect:{r1:43,tasks:43,already:'Cafe Mary Grace,Brotzeit,Hotel Okura Manila,Manila Marriott Hotel,Sheraton Manila Hotel,Belmont Hotel Manila',r2:0,leads:43,stageNew:true,ownerName:'Edelyn Rose Nicolas',kids:43,parent:true,owner:true,shared:true,linked:true,
    A:'2026-10-14×20',B:'2026-10-17×18',C:'2026-10-23×5',nwr:40,city:3,r3:0} },

{ name:'🛒 who is left out: "Bom Gosto" bought 10 days ago (CRM order 2 Oct) → skipped as an active customer; "Bar 360" is already a lead → skipped; "Bulgogi Brothers" last bought 45 days ago (delivery 28 Aug) → added as 🔁 win back; 47 leads, 47 tasks',
  requires:NEW, seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('tester');await sleep(5000);window.__hnxPulledOk=true;
    localStorage.setItem('hydroPro_crm_orders',JSON.stringify([{id:'O1',customer:'Bom Gosto',date:'2026-10-02',total:12000}]));
    localStorage.setItem('hydroPro_deliveries_v1',JSON.stringify([{id:'D1',customerName:'Bulgogi Brothers Inc.',deliveryDate:'2026-08-28'}]));
    localStorage.setItem('hydroPro_crm_leads',JSON.stringify([{id:'L_OLD',name:'Chef Marco',company:'BAR 360',stage:'contacted'}]));
    const r=hnxNewportSeed({today:${T0},force:true});
    const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads'));
    const bul=L.find(l=>l.company==='Bulgogi Brothers'),bt=JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).find(t=>t.links[0]==='customer:'+(bul&&bul.id));
    return {added:r.added,tasks:r.tasks,active:r.skippedActiveCustomer.join(','),lead:r.skippedLead.join(','),past:r.pastCustomer.join(','),
      bomGone:!L.some(l=>l.company==='Bom Gosto'),bulFlag:!!(bul&&bul.pastCustomer&&/win back/.test(bul.notes)),bulTask:!!(bt&&/win back/.test(bt.title))};})()`),
  expect:{added:47,tasks:47,active:'Bom Gosto',lead:'Bar 360',past:'Bulgogi Brothers',bomGone:true,bulFlag:true,bulTask:true} },

{ name:'⛔ a user without CRM rights (gate guard, security) cannot load the list (refused, 0 leads); before the first cloud download of the session the automatic run waits (0 Newport leads written)',
  requires:NEW, seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('guard1');await sleep(5000);window.__hnxPulledOk=true;
    const r1=hnxNewportSeed({today:${T0},force:true});
    as('edelyn');window.__hnxPulledOk=false;localStorage.setItem('hnx_cloud_token','t');
    const r2=hnxNewportSeed({today:${T0}});localStorage.removeItem('hnx_cloud_token');
    const n=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>/^LEAD_NP_/.test(l.id)).length;
    return {refused:!!r1.refused,a1:r1.added,a2:r2.added,waits:/first cloud download/.test(r2.why||''),leads:n};})()`),
  expect:{refused:true,a1:0,a2:0,waits:true,leads:0} },

{ name:'📅 the follow-ups reach Edelyn: on Wed 14 Oct the 🤝 customer follow-up counts the 20 priority-A first contacts due that day; the lead notes carry the public phone of Bom Gosto (+63 917 523 0888) and the shared-purchasing warning; 📥 button text "Newport prospects (49)"',
  requires:NEW+"&&!!window.HNXCUSTTASKS", seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('edelyn');await sleep(5000);window.__hnxPulledOk=true;
    hnxNewportSeed({today:${T0},force:true});
    localStorage.setItem('hydroPro_pa_inbox_v1','[]');
    const e=HNXCUSTTASKS.followup('edelyn','09:00','2026-10-14');
    const bom=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).find(l=>l.company==='Bom Gosto');
    return {title:e&&e.title,phone:/\\+63 917 523 0888/.test(bom.notes),warn:/share one purchasing team/.test(bom.notes),n:window.__hnxNewportProspects.length};})()`),
  expect:{title:'🤝 Customer follow-up 09:00 — 20 tasks',phone:true,warn:true,n:49} }
];
