/* v22.86 (Eyal, 13 Oct 2026, ABA_PARDES_Podium_Ortigas_Customer_Prospects.xlsx: "Can you upload that to CRM new leads area Podium
   Ortigas Pasig city? So we can push through the leads process with Nexi"). 30 outlets of The Podium, 12 ADB Ave, Ortigas Center
   (20 A, 10 B): new CRM leads in the area "Podium Ortigas", except an outlet already a lead at the Podium (or at no written place) or
   one that bought in the last 30 days; a past customer is added as "win back"; a chain known in the CRM at ANOTHER place gets this
   branch as its own lead. One "☎ First contact" task per new lead for Edelyn (shared Eyal + Dr Amy) under one parent; due by priority
   from today (Tue 13 Oct 2026): A +2 working days = Thu 15 Oct, B +5 = Mon 19 Oct (Sunday 18 Oct not counted). The workbook's
   Sales Playbook (1 Verify → 2 Qualify → 3 Sample → 4 Convert → 5 Track) sits on every lead and shows on the follow-up screens. */
const USERS=[
  {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'edelyn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
  {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
  {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
  {username:'guard1',fullname:'Gate Guard',passwordHash:'x',role:'operator',department:'security',departments:['security'],active:true}];
/* a clean CRM: one unrelated lead keeps the v13.97 Excel import (144 customers) out, the markers keep the automatic runs out */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'edelyn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'guard1',fullname:'Gate Guard',passwordHash:'x',role:'operator',department:'security',departments:['security'],active:true}]));
  localStorage.setItem('hydroPro_crm_import_072226','done');
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([{id:'L_OTHER',name:'Chef Ana',company:'Hotel Alpha',stage:'new',address:'Cebu City'}]));
  localStorage.setItem('hydroPro_tasks_v1','[]');
  localStorage.setItem('hydroPro_crm_newport_seed_v1','{"at":1}');localStorage.setItem('hydroPro_crm_podium_seed_v1','{"at":1}');
};
/* the company as Nexi ships it: the 144 Excel customers come in as leads (Brotzeit Podium among them, a won customer at 6th Flr ADB Ave) */
const SEED_SHIPPED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'edelyn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true}]));
  localStorage.setItem('hydroPro_crm_leads','[]');localStorage.setItem('hydroPro_tasks_v1','[]');
  localStorage.setItem('hydroPro_crm_newport_seed_v1','{"at":1}');localStorage.setItem('hydroPro_crm_podium_seed_v1','{"at":1}');
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
const T0="'2026-10-13'";
const NEW="typeof window.hnxPodiumSeed==='function'&&Array.isArray(window.__hnxPodiumProspects)";
module.exports=[
{ name:'🤝 a clean CRM, today Tue 13 Oct 2026: the 30 Podium outlets → 30 leads (stage new, owner Edelyn, area "Podium Ortigas", group "The Podium, Ortigas Center", address keeps 12 ADB Ave, Ortigas Center, Mandaluyong) + 30 "☎ First contact" tasks under 1 parent "Podium Ortigas sales targets — first contacts", owned by edelyn and shared with eyal + amy; due: 20 A on Thu 15 Oct, 10 B on Mon 19 Oct; industry 5 Cafe / 2 Deli / 1 Bakery / 22 Restaurant; every lead carries the 5-step playbook at step 1 and the 5 outlets from the 2020 listing say "verify still operating"; a second run adds 0; a deleted lead + its task are not re-created',
  requires:NEW, seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('edelyn');await sleep(5000);window.__hnxPulledOk=true;
    const r1=hnxPodiumSeed({today:${T0},force:true});const r2=hnxPodiumSeed({today:${T0},force:true});
    const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>/^LEAD_PD_/.test(l.id));
    const T=JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).filter(t=>t.plan==='podium1310');
    const parent=T.find(t=>t.id==='TSK_PODIUM1310_PLAN'),kids=T.filter(t=>t.parentId==='TSK_PODIUM1310_PLAN');
    const due=p=>kids.filter(t=>t.title.endsWith('('+p+')')).map(t=>t.due);
    const one=a=>[...new Set(a)].join(',')+'×'+a.length;
    const ind=k=>L.filter(l=>l.industry===k).length;
    const wolf=L.find(l=>l.externalRef==='PD-026');
    /* the team deletes PD-030 and its task (tombstones), then a re-check */
    const o=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');const gone='LEAD_PD_030',gt='TSK_PD1310_030';(o.hydroPro_crm_leads=o.hydroPro_crm_leads||{})[gone]=Date.now();(o.hydroPro_tasks_v1=o.hydroPro_tasks_v1||{})[gt]=Date.now();localStorage.setItem('hydroPro_optomb',JSON.stringify(o));
    localStorage.setItem('hydroPro_crm_leads',JSON.stringify(JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>l.id!==gone)));
    localStorage.setItem('hydroPro_tasks_v1',JSON.stringify(JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).filter(t=>t.id!==gt)));
    const r3=hnxPodiumSeed({today:${T0},force:true});
    const L3=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>/^LEAD_PD_/.test(l.id)).length;
    return {r1:r1.added,tasks:r1.tasks,r2:r2.added,leads:L.length,stageNew:L.every(l=>l.stage==='new'),ownerName:L[0].owner,
      area:one(L.map(l=>l.area)),group:one(L.map(l=>l.group)),addr:L.every(l=>/^Podium Ortigas · .*The Podium, 12 ADB Ave, Ortigas Center, Mandaluyong$/.test(l.address)),floor1:L[0].address,
      kids:kids.length,parent:!!parent,parentTitle:parent&&parent.title.split(' (')[0],parentSteps:!!(parent&&/1\\. Verify — Confirm branch is open/.test(parent.outcome)&&/5\\. Track — Record buyer details/.test(parent.outcome)),
      owner:kids.every(t=>t.owner==='edelyn'),shared:kids.every(t=>t.sharedWith.join(',')==='eyal,amy'&&t.visibility==='users'),linked:kids.every(t=>t.links[0]==='customer:LEAD_PD_'+t.id.slice(-3)),
      kidStep:kids.every(t=>/^Playbook step 1 of 5 — Verify: Confirm branch is open/.test(t.outcome)),
      A:one(due('A')),B:one(due('B')),cafe:ind('Cafe'),deli:ind('Deli'),bakery:ind('Bakery'),rest:ind('Restaurant'),
      playbook:L.every(l=>Array.isArray(l.playbook)&&l.playbook.map(s=>s.n+' '+s.step).join(' → ')==='1 Verify → 2 Qualify → 3 Sample → 4 Convert → 5 Track'&&l.playbookStep===1),
      old:L.filter(l=>l.verifyOperating===true).map(l=>l.externalRef).join(','),wolfNote:/⚠ 2020 historical listing — verify the outlet is still operating/.test(wolf.notes)&&/Public phone/.test(wolf.notes)===false,
      deliPhone:/Public phone: \\+63 917 160 2382/.test(L[0].notes),products:L[0].products,role:L[0].decisionRole,checked:one(L.map(l=>l.lastChecked)),src:/^https:\\/\\/www\\.spot\\.ph/.test(L[0].sourceUrl),
      r3:r3.added,after:L3};})()`),
  expect:{r1:30,tasks:30,r2:0,leads:30,stageNew:true,ownerName:'Edelyn Rose Nicolas',area:'Podium Ortigas×30',group:'The Podium, Ortigas Center×30',addr:true,floor1:'Podium Ortigas · Ground, The Podium, 12 ADB Ave, Ortigas Center, Mandaluyong',
    kids:30,parent:true,parentTitle:'Podium Ortigas sales targets — first contacts',parentSteps:true,owner:true,shared:true,linked:true,kidStep:true,
    A:'2026-10-15×20',B:'2026-10-19×10',cafe:5,deli:2,bakery:1,rest:22,playbook:true,old:'PD-026,PD-027,PD-028,PD-029,PD-030',wolfNote:true,
    deliPhone:true,products:'Romaine, frisee, arugula, herbs',role:'Purchasing / Executive Chef / F&B Manager',checked:'2026-10-13×30',src:true,r3:0,after:29} },

{ name:'🏢 the company as Nexi ships it (144 customers already leads) with the 43 Newport leads loaded first: "Brotzeit" is already a won customer AT THE PODIUM (Brotzeit Podium, 6th Flr ADB Ave, Ortigas) → left out; Bom Gosto, Manam and Wolfgang\'s Steakhouse exist only as Newport City leads → their Podium branches are added as separate leads whose notes name the other branch → 29 leads, 29 tasks',
  requires:NEW+"&&typeof window.hnxNewportSeed==='function'", seed:SEED_SHIPPED,
  run:new Function(`return (async()=>{${AS}
    as('edelyn');await sleep(5000);window.__hnxPulledOk=true;
    const np=hnxNewportSeed({today:'2026-10-12',force:true});
    const r=hnxPodiumSeed({today:${T0},force:true});
    const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads'));
    const pd=L.filter(l=>/^LEAD_PD_/.test(l.id));
    const bom=pd.find(l=>l.externalRef==='PD-004'),wolf=pd.find(l=>l.externalRef==='PD-026'),brot=L.filter(l=>/brotzeit/i.test(l.company));
    const bomNP=L.find(l=>l.id==='LEAD_NP_004');
    return {np:np.added,added:r.added,tasks:r.tasks,lead:r.skippedLead.join(','),other:r.otherBranch.join(','),active:r.skippedActiveCustomer.join(','),past:r.pastCustomer.join(','),
      pd:pd.length,noPdBrotzeit:!pd.some(l=>/brotzeit/i.test(l.company)),brotzeits:brot.map(l=>l.company).sort().join(' | '),
      bomBoth:!!(bom&&bomNP),bomNote:/Other branches already in the CRM: Bom Gosto \\(Newport City \\/ Newport World Resorts, Pasay\\)/.test(bom.notes),bomBranches:bom.otherBranches,
      wolfBranches:wolf.otherBranches,wolfTask:/Other branches in the CRM: Wolfgang's Steakhouse \\(Newport City/.test(JSON.parse(localStorage.getItem('hydroPro_tasks_v1')).find(t=>t.id==='TSK_PD1310_026').outcome)};})()`),
  expect:{np:43,added:29,tasks:29,lead:'Brotzeit',other:"Bom Gosto,Manam,Wolfgang's Steakhouse",active:'',past:'',pd:29,noPdBrotzeit:true,
    brotzeits:'Brotzeit Alabang West Parade | Brotzeit Podium | Brotzeit-Newport mall',bomBoth:true,bomNote:true,bomBranches:['Bom Gosto (Newport City / Newport World Resorts, Pasay)'],
    wolfBranches:["Wolfgang's Steakhouse (Newport City / Newport World Resorts, Pasay)"],wolfTask:true} },

{ name:'🛒 who is left out: "Deli by Chele" bought 10 days ago (CRM order 3 Oct) → skipped as an active customer; "Shi Lin" is already a lead with no place written → skipped; "Paradise Dynasty" last bought 45 days ago (delivery 29 Aug) → added as 🔁 win back; "Cyma" is a customer at Greenbelt, Makati that bought 5 days ago → that is the Makati branch, the Podium branch is added (other branch named, not win back) → 28 leads, 28 tasks',
  requires:NEW, seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('tester');await sleep(5000);window.__hnxPulledOk=true;
    localStorage.setItem('hydroPro_crm_orders',JSON.stringify([{id:'O1',customer:'Deli by Chele',date:'2026-10-03',total:9000},{id:'O2',customer:'Cyma',date:'2026-10-08',total:15000}]));
    localStorage.setItem('hydroPro_deliveries_v1',JSON.stringify([{id:'D1',customerName:'Paradise Dynasty Restaurant Inc.',deliveryDate:'2026-08-29'}]));
    localStorage.setItem('hydroPro_crm_customers',JSON.stringify([{id:'C1',name:'Cyma',address:'Greenbelt 2, Makati'}]));
    localStorage.setItem('hydroPro_crm_leads',JSON.stringify([{id:'L_OLD',name:'Chef Lin',company:'SHI LIN',stage:'contacted'}]));
    const r=hnxPodiumSeed({today:${T0},force:true});
    const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads'));
    const par=L.find(l=>l.company==='Paradise Dynasty'),cy=L.find(l=>l.company==='Cyma'&&/^LEAD_PD_/.test(l.id));
    const T=JSON.parse(localStorage.getItem('hydroPro_tasks_v1')),pt=T.find(t=>t.links[0]==='customer:'+(par&&par.id));
    return {added:r.added,tasks:r.tasks,active:r.skippedActiveCustomer.join(','),lead:r.skippedLead.join(','),past:r.pastCustomer.join(','),other:r.otherBranch.join(','),
      deliGone:!L.some(l=>l.company==='Deli by Chele'),shiGone:!L.some(l=>/^LEAD_PD_/.test(l.id)&&l.company==='Shi Lin'),
      parFlag:!!(par&&par.pastCustomer&&/win back \\(no purchase in the last 30 days; last 2026-08-29\\)/.test(par.notes)),parTask:!!(pt&&/win back/.test(pt.title)),
      cyAdded:!!cy,cyWin:!!(cy&&cy.pastCustomer),cyNote:!!(cy&&/Other branches already in the CRM: Cyma \\(Greenbelt 2, Makati\\)/.test(cy.notes))};})()`),
  expect:{added:28,tasks:28,active:'Deli by Chele',lead:'Shi Lin',past:'Paradise Dynasty',other:'Cyma',deliGone:true,shiGone:true,parFlag:true,parTask:true,cyAdded:true,cyWin:false,cyNote:true} },

{ name:'⛔ a user without CRM rights (gate guard, security) cannot load the list (refused, 0 leads); before the first cloud download of the session the automatic run waits (0 Podium leads written)',
  requires:NEW, seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('guard1');await sleep(5000);window.__hnxPulledOk=true;
    const r1=hnxPodiumSeed({today:${T0},force:true});
    as('edelyn');window.__hnxPulledOk=false;localStorage.setItem('hnx_cloud_token','t');
    const r2=hnxPodiumSeed({today:${T0}});localStorage.removeItem('hnx_cloud_token');
    const n=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).filter(l=>/^LEAD_PD_/.test(l.id)).length;
    const step=hnxPodiumStep('LEAD_PD_001',1);
    return {refused:!!r1.refused,a1:r1.added,a2:r2.added,waits:/first cloud download/.test(r2.why||''),leads:n,step:step};})()`),
  expect:{refused:true,a1:0,a2:0,waits:true,leads:0,step:false} },

{ name:'🧭 the follow-up screens: on Thu 15 Oct the 🤝 customer follow-up counts the 20 priority-A first contacts due that day; the playbook strip reads "1 Verify → 2 Qualify → 3 Sample → 4 Convert → 5 Track" at step 1 with "Now — Verify"; ✓ Step done → step 2 Qualify; the lead\'s stage lights the step (sample_sent → 3, won → 5, contacted with step 4 ticked stays 4); the strip is drawn in CRM ▸ lead detail and in the task drawer; 📥 button "Podium prospects (30)" next to Newport',
  requires:NEW+"&&!!window.HNXCUSTTASKS&&!!window.HNXTASKS", seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('tester');await sleep(5000);window.__hnxPulledOk=true;
    hnxPodiumSeed({today:${T0},force:true});
    localStorage.setItem('hydroPro_pa_inbox_v1','[]');
    const e=HNXCUSTTASKS.followup('edelyn','09:00','2026-10-15');
    const h1=hnxPodiumPlaybookHtml('LEAD_PD_001');const d=s=>{const x=document.createElement('div');x.innerHTML=s;return x;};
    const chips=d(h1).querySelectorAll('.hnx-pb-step');const text=[...chips].map(c=>c.textContent.trim()).join(' → ');
    const ok1=hnxPodiumStep('LEAD_PD_001',1);const h2=hnxPodiumPlaybookHtml('LEAD_PD_001');
    const setStage=(id,st,step)=>{const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads'));const l=L.find(x=>x.id===id);l.stage=st;if(step)l.playbookStep=step;localStorage.setItem('hydroPro_crm_leads',JSON.stringify(L));};
    setStage('LEAD_PD_002','sample_sent');setStage('LEAD_PD_003','won');setStage('LEAD_PD_004','contacted',4);
    /* the lead detail in CRM ▸ Leads */
    switchView('crm_leads',true);await sleep(1500);_crmSelLead='LEAD_PD_002';renderCRM();await sleep(300);hnxPodiumPaint();await sleep(300);
    const strip=document.querySelector('#crmLeadsBody .hnx-podium-playbook');
    _crmSelLead=null;renderCRM();
    /* both enhancers re-draw their buttons after the list re-renders: Podium every 1.5 s, but Newport's 3 s poller is stretched to 7 s by the
       HNX TIMER OPTIMIZER (3-15 s band) and the job governor can start it a few ticks late, so it comes back 0-7+ s after the render depending on where
       its clock happens to be. A fixed sleep(5000) passed on a fast machine and failed on the CI runner (Newport not yet drawn -> nextToNewport false).
       Wait until BOTH buttons are drawn (max 25 s); the order check below is unchanged: Podium must sit right after Newport. */
    for(let w=0;w<250&&!(document.getElementById('hnxNewportBtn')&&document.getElementById('hnxPodiumBtn'));w++)await sleep(100);
    const btn=document.getElementById('hnxPodiumBtn');const nb=document.getElementById('hnxNewportBtn');
    /* the task drawer of a first-contact task */
    HNXTASKS.drawer('TSK_PD1310_003');await sleep(300);const ds=document.querySelector('#hnxTaskF .hnx-podium-playbook');const f=document.getElementById('hnxTaskF');if(f)f.remove();
    return {title:e&&e.title,steps:text,step1:/data-step="1"/.test(h1)&&/Now — <b>Verify<\\/b>: Confirm branch is open and obtain direct restaurant number/.test(h1)&&/first contact due 2026-10-15/.test(h1),
      ok1:ok1,step2:/data-step="2"/.test(h2)&&/Now — <b>Qualify<\\/b>/.test(h2)&&/✓ 1 Verify/.test(h2),stored:JSON.parse(localStorage.getItem('hydroPro_crm_leads')).find(l=>l.id==='LEAD_PD_001').playbookStep,
      s2:hnxPodiumStepOf('LEAD_PD_002'),s3:hnxPodiumStepOf('LEAD_PD_003'),s4:hnxPodiumStepOf('LEAD_PD_004'),
      strip:!!strip,stripLead:strip&&strip.getAttribute('data-lead'),stripStep:strip&&strip.getAttribute('data-step'),stripText:!!strip&&/3 Sample/.test(strip.textContent)&&/Now — Sample/.test(strip.textContent),
      btn:btn&&btn.textContent,nextToNewport:!!(btn&&nb&&nb.nextElementSibling===btn),drawer:ds&&ds.getAttribute('data-lead'),drawerStep:ds&&ds.getAttribute('data-step'),n:window.__hnxPodiumProspects.length};})()`),
  expect:{title:'🤝 Customer follow-up 09:00 — 20 tasks',steps:'1 Verify → 2 Qualify → 3 Sample → 4 Convert → 5 Track',step1:true,ok1:true,step2:true,stored:2,s2:3,s3:5,s4:4,
    strip:true,stripLead:'LEAD_PD_002',stripStep:'3',stripText:true,btn:'📥 Podium prospects (30) — load / re-check',nextToNewport:true,drawer:'LEAD_PD_003',drawerStep:'5',n:30} }
];
