/* CRM wave 1 (Eyal, 21-22 Oct 2026, "All, straight to stable"; source: CRM_COMPLIANCE_REVIEW_2026-10-21, packages 0A and 0B).
   0A  The CRM 🏠 Overview showed "This view hit a snag while loading" as soon as a lead's createdAt was a NUMBER (epoch ms, which
       Potential Customers ▸ "+ Lead" writes) next to another stale / new lead: the Stale Leads and New Leads This Week cards sorted
       with  la.localeCompare(lb)  on the raw value. Both sort keys now go through _crmYmd. crm-audit case 3 never saw it (its seed holds
       only one stale lead, so the comparator never runs).
   0B  🆕 Customer Master, 📁 Customer 360° Files and 📊 Customer Matrix are registered in MODULES.crm.views (perm viewCRM) right after
       🤝 Customers, so the sidebar fly-out and the view picker list them on EVERY open (they used to arrive from a 2-second timer that the
       fly-out's 220 ms copy usually beat). The fly-out no longer lists the hidden 📢 Marketing placeholder, and the "Deals" / "Setup"
       divider objects are not drawn as clickable buttons (the objects stay: the Users permission matrix emits its rows from them).
   Dates are relative to the machine clock; every lead name is synthetic. */
const BASE=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'edelyn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'ben',fullname:'Ben Reyes',passwordHash:'x',role:'supervisor',department:'production',departments:['production'],active:true}]));
  localStorage.setItem('hydroPro_user_perms',JSON.stringify({ben:{overrides:{'module:crm':'none'},updatedAt:Date.now()}}));
  localStorage.setItem('hydroPro_crm_import_072226','done'); /* keep the Excel customer import out of the counts */
  localStorage.setItem('hydroPro_crm_newport_seed_v1','{"at":1}');localStorage.setItem('hydroPro_crm_podium_seed_v1','{"at":1}'); /* and the prospect seeders */
  localStorage.setItem('hydroPro_tasks_v1','[]');
};
const mk=extra=>new Function('('+BASE.toString()+')();'+(extra?'('+extra.toString()+')();':''));

/* ---- Overview seeds. Lead dates come in four shapes: epoch ms (number), full ISO text, 'YYYY-MM-DD' text, missing / junk ---- */
const SEED_MIXED=mk(function(){
  const D=864e5,now=Date.now(),iso=n=>new Date(now-n*D).toISOString(),ymd=n=>iso(n).slice(0,10),num=n=>now-n*D;
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([
    /* stale: no activity in 14+ days — oldest first expected S40, S35, S30, S26, S21, S18 */
    {id:'S40',name:'Stale 40d numeric',company:'Synth A',stage:'new',createdAt:num(40)},
    {id:'S35',name:'Stale 35d iso',company:'Synth B',stage:'contacted',createdAt:iso(35)},
    {id:'S30',name:'Stale 30d numeric, meeting 33d',company:'Synth C',stage:'new',createdAt:num(30)},
    {id:'S26',name:'Stale 26d date-only',company:'Synth D',stage:'new',createdAt:ymd(26)},
    {id:'S21',name:'Stale 21d sample (created 50d)',company:'Synth E',stage:'contacted',createdAt:num(50)},
    {id:'S18',name:'Stale 18d touchpoint (created 45d)',company:'Synth F',stage:'new',createdAt:num(45)},
    /* not stale: yesterday's touchpoint; hot because qualified + active this week */
    {id:'H1',name:'Hot yesterday touch',company:'Synth G',stage:'qualified',createdAt:num(60)},
    /* new this week, newest first expected N1, N2, N3, W4, N5 */
    {id:'N1',name:'New 1d iso',company:'Synth H',stage:'new',createdAt:iso(1)},
    {id:'N2',name:'New 2d numeric',company:'Synth I',stage:'new',createdAt:num(2)},
    {id:'N3',name:'New 3d date-only',company:'Synth J',stage:'contacted',createdAt:ymd(3)},
    {id:'W4',name:'Won 4d numeric',company:'Synth K',stage:'won',createdAt:num(4)},
    {id:'N5',name:'New 5d numeric',company:'Synth L',stage:'qualified',createdAt:num(5)},
    /* neither stale nor new: no date, junk date */
    {id:'X0',name:'No date',company:'Synth M',stage:'new'},
    {id:'XJ',name:'Junk date',company:'Synth N',stage:'new',createdAt:'not a date'}]));
  localStorage.setItem('hydroPro_crm_touchpoints',JSON.stringify([
    {id:'T1',leadId:'S18',type:'call',date:ymd(18),by:'tester',subject:'synthetic'},
    {id:'T2',leadId:'H1',type:'call',date:ymd(1),by:'tester',subject:'synthetic'}]));
  localStorage.setItem('hydroPro_crm_samples',JSON.stringify([{id:'P1',leadId:'S21',date:ymd(21),products:[],status:'sent'}]));
  localStorage.setItem('hydroPro_crm_meetings',JSON.stringify([{id:'M1',leadId:'S30',type:'meeting',date:ymd(33),attendees:[],agenda:'synthetic'}]));
});
/* the review's own case: 3 active numeric-date leads 20 / 30 / 40 days old with no touchpoints (the Stale sort runs on numbers) and ONE new numeric lead */
const SEED_STALE=mk(function(){
  const D=864e5,now=Date.now(),num=n=>now-n*D;
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([
    {id:'SA20',name:'Stale 20d numeric',company:'Synth A',stage:'new',createdAt:num(20)},
    {id:'SA30',name:'Stale 30d numeric',company:'Synth B',stage:'contacted',createdAt:num(30)},
    {id:'SA40',name:'Stale 40d numeric',company:'Synth C',stage:'new',createdAt:num(40)},
    {id:'NB2',name:'New 2d numeric',company:'Synth D',stage:'new',createdAt:num(2)}]));
  localStorage.setItem('hydroPro_crm_touchpoints','[]');localStorage.setItem('hydroPro_crm_samples','[]');localStorage.setItem('hydroPro_crm_meetings','[]');
});
/* four numeric-date leads created within the week (the New This Week sort runs on numbers) and ONE stale lead (one element: its sort never calls the comparator) */
const SEED_NEW=mk(function(){
  const D=864e5,now=Date.now(),num=n=>now-n*D;
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([
    {id:'NC4',name:'New 4d numeric',company:'Synth A',stage:'new',createdAt:num(4)},
    {id:'NC2',name:'New 2d numeric',company:'Synth B',stage:'new',createdAt:num(2)},
    {id:'NC5',name:'New 5d numeric',company:'Synth C',stage:'contacted',createdAt:num(5)},
    {id:'NC3',name:'New 3d numeric',company:'Synth D',stage:'new',createdAt:num(3)},
    {id:'SC30',name:'Stale 30d numeric',company:'Synth E',stage:'new',createdAt:num(30)}]));
  localStorage.setItem('hydroPro_crm_touchpoints','[]');localStorage.setItem('hydroPro_crm_samples','[]');localStorage.setItem('hydroPro_crm_meetings','[]');
});
/* reads the Overview: error boundary, the ids of the rows of a card in the order drawn, and the KPI tiles */
const OV_READ="switchView('crm_dash');await sleep(2500);"
 +"const card=re=>{const s=[...document.querySelectorAll('#view-crm_dash strong')].find(x=>re.test(x.textContent));return s&&s.parentElement.parentElement.parentElement;};"
 +"const ids=c=>c?[...c.querySelectorAll('[onclick*=\"_crmSelLead\"]')].map(e=>(e.getAttribute('onclick').match(/_crmSelLead='([^']*)'/)||[])[1]).join(','):null;"
 +"const kpi=re=>{const s=[...document.querySelectorAll('#view-crm_dash .pay-stat')].find(x=>re.test((x.querySelector('.pay-stat-label')||{}).textContent||''));return s?s.querySelector('.pay-stat-val').textContent.trim():null;};"
 +"const txt=document.getElementById('view-crm_dash').innerText;"
 +"return {snag:/hit a snag/i.test(txt),stale:ids(card(/Stale Leads/)),fresh:ids(card(/New Leads This Week/)),hot:ids(card(/Hot Leads/)),kStale:kpi(/Stale/),kNew:kpi(/New This Week/),kHot:kpi(/Hot Leads/),kTouch:kpi(/Touches/)};";
const ovRun=()=>new Function('return (async()=>{await sleep(3000);'+OV_READ+'})()');

const IDS3=['crm_master','crm_customer_files','crm_customer_matrix'];

module.exports=[
/* ============ 0A — Overview crash ============ */
{ name:'🏠 0A Overview with epoch-ms, ISO, date-only, missing and junk lead dates: no "hit a snag"; ⏰ Stale Leads = 6 oldest first S40, S35, S30, S26, S21, S18 (a 21d sample beats a 50d createdAt, an 18d touchpoint beats 45d, a 33d meeting beats 30d); 🆕 New This Week = 5 newest first N1, N2, N3, W4, N5; 🔥 Hot = 1 (H1); Touches (7d) = 1',
  seed:SEED_MIXED, run:ovRun(),
  expect:{snag:false,stale:'S40,S35,S30,S26,S21,S18',fresh:'N1,N2,N3,W4,N5',hot:'H1',kStale:'6',kNew:'5',kHot:'1',kTouch:'1'} },

{ name:'⏰ 0A Stale Leads sort alone: 3 active leads with epoch-ms createdAt 20 / 30 / 40 days old and no touchpoints → no "hit a snag", Stale = 3 oldest first SA40, SA30, SA20; New This Week = 1 (NB2)',
  seed:SEED_STALE, run:ovRun(),
  expect:{snag:false,stale:'SA40,SA30,SA20',fresh:'NB2',kStale:'3',kNew:'1'} },

{ name:'🆕 0A New This Week sort alone: 4 epoch-ms leads created 2 / 3 / 4 / 5 days ago → no "hit a snag", New This Week = 4 newest first NC2, NC3, NC4, NC5; Stale = 1 (SC30)',
  seed:SEED_NEW, run:ovRun(),
  expect:{snag:false,fresh:'NC2,NC3,NC4,NC5',stale:'SC30',kNew:'4',kStale:'1'} },

/* ============ 0B — the three screens in the CRM menu, no Marketing, no divider buttons ============ */
{ name:'🧭 0B the CRM fly-out lists 🆕 Customer Master, 📁 Customer 360° Files and 📊 Customer Matrix right after 🤝 Customers on the FIRST and the TENTH open (and on all ten, each once, whatever the 2-second injector is doing); no 📢 Marketing; no "Deals" / "Setup" divider entry; the list is the same 20 screens every time and is exactly the screens the CRM module registers (the 📞 Open Issues shortcut the 2-second injector adds now and then aside)',
  seed:mk(),
  run:async()=>{
    await sleep(3000);
    const rail=document.querySelector('#hnxRail .r-item[data-mod="crm"]');
    const want=['🆕 Customer Master','📁 Customer 360° Files','📊 Customer Matrix'];
    const gaps=[150,700,1300,1900,350,1100,2300,500,1500,900]; /* spread the ten opens over the injector's 2 s tick */
    const lists=[],counts=[];
    for(let i=0;i<10;i++){
      hnxRailMod('crm',{currentTarget:rail,target:rail,stopPropagation(){}});
      await sleep(900);
      lists.push((window.__hnxFlyItems||[]).map(x=>x.label));
      const c=document.querySelector('#hnxFlyout .f-h span[data-count]');counts.push(c?c.textContent:null);
      hnxFlyClose();await sleep(gaps[i]);
    }
    const has=l=>want.every(w=>l.filter(x=>x===w).length===1);
    const core=l=>l.filter(x=>!/^📞 Open Issues/.test(x)); /* the legacy injector adds this shortcut on some ticks only */
    const i0=lists[0].indexOf('🤝 Customers');
    return {first:has(lists[0]),tenth:has(lists[9]),allTen:lists.every(has),
      marketing:lists.some(l=>l.some(x=>/Marketing/.test(x))),dividers:lists.some(l=>l.some(x=>/^(Deals|Setup)$/.test(x))),
      dupes:lists.some(l=>new Set(l).size!==l.length),sameSize:new Set(lists.map(l=>core(l).length)).size===1,size:core(lists[9]).length+':'+(core(lists[9]).length===getVisibleViews('crm').filter(v=>v&&!v.divider).length),
      order:i0<0?null:lists[0].slice(i0,i0+5).join(' | '),countTxt:counts[9]===lists[9].length+' screens'};},
  expect:{first:true,tenth:true,allTen:true,marketing:false,dividers:false,dupes:false,sameSize:true,size:'20:true',
    order:'🤝 Customers | 🆕 Customer Master | 📁 Customer 360° Files | 📊 Customer Matrix | 🤝 Customer Care',countTxt:true} },

{ name:'📑 0B the header drop box and the 🔽 view picker list the three screens once each, with no duplicate button ids (the legacy 2-second injector skips a screen the registry already draws), no "undefined" divider button / option, and no "Deals" / "Setup" row; 📢 Marketing stays registered but hidden; the two divider objects stay in the registry',
  seed:mk(),
  run:async()=>{
    await sleep(3000);
    switchModule('crm');await sleep(5000); /* two injector ticks */
    const tabs=[...document.querySelectorAll('#modSubTabs .module-sub-tab')];
    const cnt={};tabs.forEach(b=>{if(b.id)cnt[b.id]=(cnt[b.id]||0)+1;});
    const sel=[...document.querySelectorAll('#modSubTabs select option')].map(o=>o.value);
    const trg=document.querySelector('#hnxViewPicker .hnx-vp-trigger');
    let pick=[];if(trg){trg.click();await sleep(500);pick=[...document.querySelectorAll('#hnxVpPanel .hnx-vp-item')].map(i=>(i.querySelector('span')||{}).textContent||'');trg.click();}
    const want=['🆕 Customer Master','📁 Customer 360° Files','📊 Customer Matrix'];
    const mkt=MODULES.crm.views.find(v=>v.id==='crm_marketing');
    return {dupIds:Object.keys(cnt).filter(k=>cnt[k]>1),undefTabs:tabs.filter(b=>b.id==='modTab-undefined').length,
      selHas3:['crm_master','crm_customer_files','crm_customer_matrix'].every(v=>sel.includes(v)),selUndef:sel.includes('undefined'),
      pickerHas3:want.every(w=>pick.filter(x=>x.trim()===w).length===1),pickerDividers:pick.filter(x=>/^\s*(Deals|Setup)\s*$/.test(x)).length,pickerDupes:new Set(pick).size!==pick.length,pickerRows:pick.length>10,
      marketingHidden:!!(mkt&&mkt.hidden),dividerObjects:MODULES.crm.views.filter(v=>v.divider).map(v=>v.label).join('|')};},
  expect:{dupIds:[],undefTabs:0,selHas3:true,selUndef:false,pickerHas3:true,pickerDividers:0,pickerDupes:false,pickerRows:true,marketingHidden:true,dividerObjects:'Deals|Setup'} },

{ name:'🔒 0B each of the three screens opens and renders (no "hit a snag") for a CRM user (viewCRM), is listed for her, and is refused for a user without CRM access (the open screen does not change, none of the three listed)',
  seed:mk(),
  run:async()=>{
    const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
    await sleep(3000);
    const ids=['crm_master','crm_customer_files','crm_customer_matrix'];
    const out={ok:{},denied:{}};
    as('edelyn');await sleep(300);
    out.edelynAccess=moduleHasAccess('crm');
    out.edelynListed=ids.filter(id=>getVisibleViews('crm').some(v=>v.id===id)).length;
    for(const id of ids){
      switchView('crm_dash');await sleep(500);
      try{switchView(id);}catch(e){}
      await sleep(1500);
      const a=document.querySelector('.view.active');
      out.ok[id]=!!a&&a.id==='view-'+id&&!/hit a snag/i.test(a.innerText)&&a.innerText.length>100&&window.__lastNavDenied===null;
    }
    as('tester');switchView('dashboard');await sleep(600); /* a neutral screen, opened by the admin */
    as('ben');await sleep(300);
    out.benAccess=moduleHasAccess('crm');
    out.benListed=ids.filter(id=>getVisibleViews('crm').some(v=>v.id===id)).length;
    const before=document.querySelector('.view.active').id;
    for(const id of ids){
      try{switchView(id);}catch(e){}
      await sleep(500);
      const a=document.querySelector('.view.active');
      out.denied[id]=!!a&&a.id===before&&a.id!=='view-'+id;
    }
    as('tester');
    return {edelynAccess:out.edelynAccess,edelynListed:out.edelynListed,ok:Object.values(out.ok).join(','),benAccess:out.benAccess,benListed:out.benListed,denied:Object.values(out.denied).join(',')};},
  expect:{edelynAccess:true,edelynListed:3,ok:'true,true,true',benAccess:false,benListed:0,denied:'true,true,true'} },

{ name:'👥 0B the Users permission matrix gains exactly 3 rows (tab:crm_master, tab:crm_customer_files, tab:crm_customer_matrix) against the registry without them; the divider objects Deals / Setup are untouched and the matrix still emits one tab:undefined row per divider object in the app',
  seed:mk(),
  run:async()=>{
    await sleep(3000);
    const ids=['crm_master','crm_customer_files','crm_customer_matrix'];
    const keys=()=>{const h=renderUserPermsTab('ben');return [...new Set(h.match(/name="tab:[A-Za-z0-9_]+"/g)||[])].map(s=>s.slice(10,-1));};
    const undefRows=()=>(renderUserPermsTab('ben').match(/name="tab:undefined" value="none"/g)||[]).length;
    const dividers=Object.values(MODULES).reduce((n,m)=>n+(m.views||[]).filter(v=>v&&v.divider).length,0);
    const orig=MODULES.crm.views;
    const withNow=keys(),undefWith=undefRows();
    MODULES.crm.views=orig.filter(v=>!ids.includes(v.id));
    const base=keys();
    MODULES.crm.views=orig;
    const back=keys();
    return {inRegistry:ids.every(id=>orig.some(v=>v.id===id)),perm:ids.map(id=>(orig.find(v=>v.id===id)||{}).perm).join(','),rowsAdded:withNow.length-base.length,
      added:withNow.filter(k=>!base.includes(k)).sort().join(','),restored:back.length===withNow.length,
      undefinedRowsMatchDividers:undefWith===dividers&&dividers>=2,crmDividers:orig.filter(v=>v.divider).map(v=>v.label).join('|')};},
  expect:{inRegistry:true,perm:'viewCRM,viewCRM,viewCRM',rowsAdded:3,added:'crm_customer_files,crm_customer_matrix,crm_master',restored:true,undefinedRowsMatchDividers:true,crmDividers:'Deals|Setup'} },

{ name:'🆘 0B the guide: 🤝 Customers — three screens carries a "Where they are in the CRM menu" section and ↗ links to the three screens (SCREEN_GUIDE already maps the ids); the CRM & Sales guide says the Overview sorts by the real date and no longer calls Marketing a visible placeholder; the Help centre renders them',
  seed:mk(),
  run:async()=>{
    await sleep(3000);
    const g=id=>HNX_HELP_GUIDES.find(x=>x.id===id);
    const cg=JSON.stringify(g('crm_customers_guide')),mg=JSON.stringify(g('m_crm'));
    const screens=HNX_HELP.screensFor('crm_customers_guide');
    let links=0,err=null,shown='';
    try{HNX_HELP.open('crm_customers_guide');await sleep(500);const ov=document.getElementById('hnxhOv');links=ov.querySelectorAll('.hnxh-go').length;shown=ov.innerText;HNX_HELP.close();}catch(e){err=e.message;}
    let err2=null;try{HNX_HELP.open('m_crm');await sleep(400);HNX_HELP.close();}catch(e){err2=e.message;}
    return {screens3:['crm_master','crm_customer_files','crm_customer_matrix'].every(s=>screens.indexOf(s)>=0),where:/Where they are in the CRM menu/.test(cg),shownWhere:/Where they are in the CRM menu/.test(shown),
      links:links>3,overviewDate:/whether the date was saved as a date or as a number/.test(mg),mktNotPlaceholder:!/the screen is a placeholder/.test(mg),err:err,err2:err2};},
  expect:{screens3:true,where:true,shownWhere:true,links:true,overviewDate:true,mktNotPlaceholder:true,err:null,err2:null} },

{ name:'🔎 0B nothing else moved: 🎯 Leads still draws both "📥 Newport prospects (49) — load / re-check" and "📥 Podium prospects (30) — load / re-check" (Podium right after Newport), and the lead search narrows 3 leads to Alpha ×2 (LA, LB) and to Zeta ×1 (LZ) and the two buttons are drawn again afterwards',
  seed:mk(function(){
    const iso=new Date().toISOString();
    localStorage.setItem('hydroPro_crm_leads',JSON.stringify([
      {id:'LA',name:'Chef Ana',company:'Alpha Hotel',stage:'new',createdAt:iso},
      {id:'LB',name:'Chef Bo',company:'Alpha Resort',stage:'contacted',createdAt:iso},
      {id:'LZ',name:'Chef Zed',company:'Zeta Foods',stage:'new',createdAt:iso}]));
  }),
  run:async()=>{
    await sleep(3000);
    _crmLeadFilter='all_active';
    switchView('crm_leads');await sleep(1500);
    const both=()=>document.getElementById('hnxNewportBtn')&&document.getElementById('hnxPodiumBtn');
    /* both enhancers re-draw their buttons after every list render; Newport's poller can be stretched to 7+ s — wait for both (max 25 s) */
    for(let w=0;w<250&&!both();w++)await sleep(100);
    const nb=document.getElementById('hnxNewportBtn'),pb=document.getElementById('hnxPodiumBtn');
    const out={newport:nb&&nb.textContent,podium:pb&&pb.textContent,podiumAfterNewport:!!(nb&&pb&&nb.nextElementSibling===pb)};
    const rows=()=>[...document.querySelectorAll('#view-crm_leads [onclick*="_crmSelLead"]')].map(e=>(e.getAttribute('onclick').match(/_crmSelLead='([^']*)'/)||[])[1]).join(',');
    out.all=rows();
    const type=v=>{const i=document.getElementById('crmLeadSearch');i.focus();i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));};
    type('alpha');await sleep(600);out.alpha=rows();
    type('zeta');await sleep(600);out.zeta=rows();
    for(let w=0;w<250&&!both();w++)await sleep(100);
    out.redrawn=!!both();
    return out;},
  expect:{newport:'📥 Newport prospects (49) — load / re-check',podium:'📥 Podium prospects (30) — load / re-check',podiumAfterNewport:true,all:'LA,LB,LZ',alpha:'LA,LB',zeta:'LZ',redrawn:true} },
];
