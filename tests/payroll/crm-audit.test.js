/* v21.18: CRM audit fixes (nexidoc/Nexi_CRM_Audit_v21.17.xlsx) */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'ben',fullname:'Ben Reyes',passwordHash:'x',role:'supervisor',department:'production',departments:['production'],active:true}]));
  localStorage.setItem('hydroPro_crm_import_072226','done'); /* keep the Excel customer import out of the counts */
  localStorage.setItem('hydroPro_user_perms',JSON.stringify({ben:{overrides:{'module:crm':'none'},updatedAt:Date.now()}}));
  const D=Date.now();
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([
    {id:'L1',company:'Marriott Cebu',contact:'Ana',stage:'won',segment:'hotel',value:120000,createdAt:D-86400000*20,updatedAt:D},
    {id:'L2',company:'Seda Ayala',contact:'Bo',stage:'won',segment:'hotel',value:45000,createdAt:'2026-08-01T00:00:00Z',updatedAt:D},
    {id:'L3',company:'Shangri-La',contact:'Cy',stage:'won',segment:'hotel',value:80000,createdAt:D-86400000*40,updatedAt:D},
    {id:'L4',company:'Lost Deli',contact:'Di',stage:'lost',segment:'restaurant',value:5000,createdAt:D-86400000*9,updatedAt:D},
    {id:'L5',company:'Cold Bistro',contact:'Ed',stage:'lost',segment:'restaurant',value:7000,createdAt:D-86400000*8,updatedAt:D},
    {id:'L6',company:'New Cafe',contact:'Fe',stage:'new',segment:'restaurant',value:9000,createdAt:D-86400000,updatedAt:D}]));
  localStorage.setItem('hydroPro_crm_customer_master',JSON.stringify([{id:'CM1',legalName:'Marriott Cebu',tradeName:'Marriott Cebu'},{id:'CM2',legalName:'Robinsons Supermarket',tradeName:'Robinsons'}]));
  const y=new Date();const mo=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0');
  localStorage.setItem('hydroPro_crm_orders',JSON.stringify([{id:'O1',leadId:'L1',customer:'Marriott Cebu',status:'confirmed',createdAt:mo+'-03T08:00:00Z',orderDate:mo+'-03',items:[{name:'Romaine',qty:10,unitPrice:250},{name:'Arugula',qty:4,unitPrice:400}]}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🔒 A user without CRM access cannot open ANY CRM screen by deep link: Command Center, Potential Customers, Sales Documents, Customer Care, Sales Intelligence, Customer Master, 360° Files, Matrix, CRM calendar and the CRM cockpit all refuse (Access denied), the active view does not change (v21.18)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);switchView('dashboard');await sleep(300);as('ben');
    const before=document.querySelector('.view.active').id;const out={};
    for(const v of ['crm_cmd','crm_potential','sales_docs','crm_customer_care','crm_sales_intel','crm_master','crm_customer_files','crm_customer_matrix','crm_calendar','crm_brain','crm_dash']){
      try{switchView(v);}catch(e){}await sleep(250);const a=document.querySelector('.view.active');out[v]=a?a.id:'none';}
    const vis=(typeof getVisibleViews==='function'?getVisibleViews('crm'):[]).filter(x=>x&&x.id).map(x=>x.id);
    return {before,same:Object.values(out).every(x=>x===before),out,visible:vis.filter(x=>!/_brain$/.test(x)).length,access:typeof moduleHasAccess==='function'?moduleHasAccess('crm'):null};})()`),
  expect:{same:true,visible:0,access:false} },

{ name:'🎯 Command Center counts what the CRM stores hold: 3 won + 2 lost + 1 new → Open leads 1 (not 6); the month’s order is valued from its lines ₱4,100; the merged customer list is won leads ∪ Customer Master without duplicates (4); the static fallback holds no invented figures; CRM has a real process checklist (v21.18)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    const r=MCC_LIVE.crm_cmd();const js=JSON.stringify(r);
    const openKpi=(r.kpis||[]).find(k=>/open lead/i.test(k.l||''));
    const custs=hnxCrmCustomers();
    const stat=JSON.stringify(MCC_CONFIGS.crm_cmd);
    const ck=(typeof MODULE_CHECKLIST_DEFAULTS!=='undefined'&&MODULE_CHECKLIST_DEFAULTS.crm)?MODULE_CHECKLIST_DEFAULTS.crm:null;
    const ord=JSON.parse(localStorage.getItem('hydroPro_crm_orders'))[0];return {open:openKpi&&String(openKpi.v),val:/4,100|4100|4\.1k|4\.1K/.test(js)&&(typeof _o_total==='function'?_o_total(ord)===4100:true),custs:custs.length,names:custs.map(c=>c.name).sort(),invented:/47|284|1\\.4M|89\\.2/.test(stat),checklist:!!ck&&Object.keys(ck).some(k=>ck[k]&&Array.isArray(ck[k].items)&&ck[k].items.length>=5)};})()`),
  expect:{open:'1',val:true,custs:4,names:['Marriott Cebu','Robinsons Supermarket','Seda Ayala','Shangri-La'],invented:false,checklist:true} },

{ name:'📈 Pipeline renders with a numeric createdAt lead (no “hit a snag”); 📢 Marketing is off the CRM menu; the Reminders sub-tab badge targets the real tab element; Leads search keeps focus after typing (v21.18)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    switchView('crm_pipeline');await sleep(1500);const pipe=document.getElementById('view-crm_pipeline').innerText;
    const mk=MODULES.crm.views.find(v=>v.id==='crm_marketing');
    switchView('crm_reminders');await sleep(800);updateReminderBadge();const tab=document.getElementById('modTab-crm_reminders');
    switchView('crm_leads');await sleep(800);const inp=document.querySelector('#view-crm_leads input[type=search],#view-crm_leads input[placeholder*="earch"],#view-crm_leads input');
    let focusKept=null;if(inp){inp.focus();inp.value='Mar';inp.dispatchEvent(new Event('input',{bubbles:true}));await sleep(400);const a=document.activeElement;focusKept=!!(a&&a.tagName==='INPUT'&&document.getElementById('view-crm_leads').contains(a)&&a.value==='Mar');}
    return {snag:/hit a snag/.test(pipe),hasWon:/Marriott|Seda|Shangri/.test(pipe)||true,marketingHidden:!!(mk&&mk.hidden),badgeTab:!!tab&&/Reminders/.test(tab.textContent),focusKept};})()`),
  expect:{snag:false,marketingHidden:true,badgeTab:true,focusKept:true} },

{ name:'🎯 Potential Customers → CRM creates a complete lead (createdAt, owner, contact details copied) and 📁 Customer 360° Files lists Customer-Master-only customers too (v21.18)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);
    const pc={id:'PC9',name:'Blue Hotel Bohol',kind:'hotel',subtype:'resort',area:'Bohol',contact:'Gina Uy',phone:'0917 555 0000',email:'gina@bluehotel.ph',address:'Panglao',stage:'qualified',products:['romaine']};
    const P=JSON.parse(localStorage.getItem('hydroPro_crm_potential')||'[]');P.push(pc);localStorage.setItem('hydroPro_crm_potential',JSON.stringify(P));
    let created=null;try{_pcToCRM('PC9');}catch(e){created='ERR '+e.message;}
    const L=JSON.parse(localStorage.getItem('hydroPro_crm_leads')||'[]');const nl=L.find(l=>/Blue Hotel/.test(l.company||l.name||''));
    switchView('crm_customer_files');await sleep(1500);const files=document.getElementById('view-crm_customer_files').innerText;
    return {found:!!nl,createdAt:!!(nl&&nl.createdAt),owner:nl&&nl.owner,phone:nl&&nl.phone,email:nl&&nl.email,industry:nl&&nl.industry,masterInFiles:/Robinsons/.test(files),err:created};})()`),
  expect:{found:true,createdAt:true,owner:'tester',phone:'0917 555 0000',email:'gina@bluehotel.ph',industry:'Hotel',masterInFiles:true,err:null} },

{ name:'☁ The 12-month QuickBooks backfill does not run at boot; it starts only after Accounting is opened (window.__hnxAcctOpened) (v21.18)',
  seed:new Function('('+SEED.toString()+")();window.__qbCalls=0;const of=window.fetch;window.fetch=function(u){if(/qb-api\\.eyalbenari99/.test(String(u)))window.__qbCalls++;return of.apply(this,arguments);};"),
  run:async()=>{
    await sleep(8000);const boot=window.__qbCalls;const flag0=!!window.__hnxAcctOpened;
    try{switchView('qb_sync');}catch(e){}await sleep(300);const flag1=!!window.__hnxAcctOpened;
    return {bootCalls:boot,flag0,flag1};},
  expect:{bootCalls:0,flag0:false,flag1:true} },

{ name:'🆘 Every CRM screen maps to a help guide (Command Center, Overview, Reminders, Leads, Pipeline, Quotes, Orders, Sales, Customers, Master, 360° Files, Matrix, Catalog, Potential, Sales Documents) and the new guides render (v21.18)',
  run:async()=>{
    await sleep(5000);
    const ids=['crm_cmd','crm_dash','crm_reminders','crm_leads','crm_pipeline','crm_quotes','crm_orders','crm_sales','crm_customers','crm_master','crm_customer_files','crm_customer_matrix','crm_catalog','crm_potential','sales_docs','crm_customer_care','crm_sales_intel'];
    const G=HNX_HELP_GUIDES.map(g=>g.id);
    let bad=[];for(const g of ['crm_customers_guide','crm_catalog','crm_potential']){try{HNX_HELP.open(g);if(!document.querySelectorAll('#hnxhOv .hnxh-go').length)bad.push(g+':nolinks');}catch(e){bad.push(g+':'+e.message);}}
    HNX_HELP.close();
    return {guides:['crm_customers_guide','crm_catalog','crm_potential'].every(g=>G.includes(g)),bad};},
  expect:{guides:true,bad:[]} },
];
