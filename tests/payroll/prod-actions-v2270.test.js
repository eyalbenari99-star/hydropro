/* v22.70 (Eyal, 12 Oct 2026: "In production report should be each earning and critical drop box of options action to do who and when / And how"):
   every ⚠ / ✕ on the Daily Production Report carries ONE action plan — Action · Who · When · How · Status — stored in
   hydroPro_prod_plans_v1, one Tasks task per problem, carried with the problem, read-only on a past day (admin may edit).
   Runs on index.html and next.html (requires the v22.70 resolver); the trial-only case needs the trial Tasks rules. */
const REQ="typeof window.hnxProdPlanFor==='function'";
/* the seed runs in the page before the app boots; the day keys are computed there with LOCAL getters (tz Asia/Manila) */
function seed(extra){
  return new Function(`
    const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    const T=new Date(),today=ymd(T),yesterday=ymd(new Date(T.getTime()-86400000));
    localStorage.setItem('hydroPro_users',JSON.stringify([
      {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
      {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
      {username:'edelyn.n',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'production',active:true},
      {username:'maria',fullname:'Maria Santos',passwordHash:'x',role:'operator',department:'production',active:true},
      {username:'acct',fullname:'Acct Person',passwordHash:'x',role:'accounting',department:'accounting',active:true}]));
    localStorage.setItem('hydroPro_dept_heads_v1',JSON.stringify({production:'edelyn.n'}));
    localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'P1',name:'Pedro Cruz',status:'Active',dept:'APTI_REGULAR',payType:'weekly',ghAssigned:['GH7'],dailyRate:650,dateHired:'2025-01-01'},
      {id:'P2',name:'Maria Santos',status:'Active',dept:'APTI_REGULAR',payType:'weekly',ghAssigned:['GH7'],username:'maria',dailyRate:650,dateHired:'2025-01-01'},
      {id:'P3',name:'Jose Reyes',status:'Active',dept:'APTI_REGULAR',payType:'weekly',ghAssigned:['GH3'],dailyRate:650,dateHired:'2025-01-01'}]));
    const gh=()=>({items:{},statuses:{},locations:{},notes:{},photos:{},fans:{},fanIssues:{big:[],roof:[]}});
    const day={GH3:gh(),GH7:gh()};
    day.GH3.statuses={leaf_0:'warn',waterflow_1:'warn'};day.GH3.locations={leaf_0:[{type:'range',table:'D',from:12,to:18}]};day.GH3.notes={leaf_0:'tip burn D12 to D18'};
    day.GH7.statuses={disease_1:'danger'};day.GH7.notes={disease_1:'white powder on 3 heads'};
    ${extra||''}
    localStorage.setItem('hydroPro_'+today,JSON.stringify(day));
  `);
}
const YDAY=`const yd={GH7:gh()};yd.GH7.statuses={disease_1:'danger'};localStorage.setItem('hydroPro_'+yesterday,JSON.stringify(yd));`;
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));const yday=ymd(new Date(Date.now()-86400000));window.showToast=()=>{};window.confirm=()=>true;window.prompt=()=>'sprayed 10:40';await sleep(6000);";
const FLAG="const flagTable=()=>[...document.querySelectorAll('#repContent table')].find(t=>/Sub-item/.test(t.innerHTML));const flagRows=()=>[...flagTable().querySelectorAll('tbody tr')];";
const FORM=(who,due,time,action)=>`{action:'${action||'fungicide'}',who:'${who}',due:${due},dueTime:'${time||'23:59'}',how:'Use the approved product and dose'}`; /* 23:59: the row must read Open whatever the time of day the suite runs */

module.exports=[
{ name:'📄 Report rows: 3 flagged → 3 rows with Action/Who/When/How/Status heads; GH7 ✕ first; GH7 reads "No action yet" in red; heading "1 critical item has NO ACTION YET" (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}${FLAG}as('edelyn.n');showReport();await sleep(300);
    const rows=flagRows(),heads=[...flagTable().querySelectorAll('thead th')].map(t=>t.textContent.trim());
    const cols=['Action','Who','When','How','Status'].every(c=>heads.includes(c));
    const critFirst=/GH7/.test(rows[0].innerHTML)&&/Critical/.test(rows[0].innerHTML);
    const noAction=/color:#b71c1c;font-weight:700;">No action yet/.test(rows[0].innerHTML);
    const headline=/1 critical item has NO ACTION YET/.test(document.getElementById('repContent').innerHTML);
    const warnGrey=/color:#888;">No action yet/.test(rows[1].innerHTML);
    return {rows:rows.length,cols,critFirst,noAction,headline,warnGrey};})()`),
  expect:{rows:3,cols:true,critFirst:true,noAction:true,headline:true,warnGrey:true} },

{ name:'⏰ Defaults: critical 09:05 → today 11:05; critical 22:30 → 23:59; warning Tue 13 Oct 14:59 → 13 Oct 17:00; 15:00 → 14 Oct 17:00; Sat 17 Oct 16:00 → Mon 19 Oct 17:00 (Sunday skipped) (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}
    const D=(sev,s)=>{const r=hnxProdPlanDefaults(sev,new Date(s));return [r.due,r.dueTime];};
    return {d1:D('danger','2026-10-13T09:05:00'),d2:D('danger','2026-10-13T22:30:00'),w1:D('warn','2026-10-13T14:59:00'),w2:D('warn','2026-10-13T15:00:00'),w3:D('warn','2026-10-17T16:00:00')};})()`),
  expect:{d1:['2026-10-13','11:05'],d2:['2026-10-13','23:59'],w1:['2026-10-13','17:00'],w2:['2026-10-14','17:00'],w3:['2026-10-19','17:00']} },

{ name:'📋 Options fit the item: GH7 mildew first = "Spray fungicide (approved list)", has "Other…", never rockwool; GH3 low flow first = "Increase water flow to the affected tables" + black hose; all 70 base items ≥ 10 options; fungicide HOW names SOP-PROD-007 (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}
    const o=hnxProdPlanOptions('GH7','disease_1','Downy / Powdery Mildew','danger');const w=hnxProdPlanOptions('GH3','waterflow_1','Low Water Flow at Table(s)','warn');
    let allHave=true,minN=99;CATEGORIES.forEach(c=>c.items.forEach((t,i)=>{const n=hnxProdPlanOptions('GH1',c.id+'_'+i,t,'warn').length;minN=Math.min(minN,n);if(n<10)allHave=false;}));
    const f=o.find(x=>x.id==='fungicide');
    return {d1First:o[0].label,hasOther:o.some(x=>x.id==='other'),noRockwool:!o.some(x=>x.id==='rockwool'),w1First:w[0].label,w1Hose:w.some(x=>x.id==='clean_hose'),allHave,minN,howSop:/SOP-PROD-007/.test(f.how)};})()`),
  expect:{d1First:'Spray fungicide (approved list)',hasOther:true,noRockwool:true,w1First:'Increase water flow to the affected tables',w1Hose:true,allHave:true,minN:10,howSop:true} },

{ name:'💾 Save as edelyn.n: GH7 mildew → fungicide / maria / today 23:59 → exactly 1 task (owner maria, due today 23:59, critical with reason, production, evidence rule, team, link production:PLN_<today>_GH7_disease_1), inbox to maria 1, 1 record; row reads the action, Maria Santos, Open; saving again with WHO edelyn.n keeps 1 task (owner edelyn.n), inbox 2 (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}${FLAG}as('edelyn.n');
    const r=hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:maria','today')});
    const tasks=HNXTASKS.load(),t=tasks[0]||{};const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
    const recs=hnxProdPlanLoad();
    showReport();await sleep(300);const row=flagRows()[0].innerHTML;
    const r2=hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:edelyn.n','today')});
    const tasks2=HNXTASKS.load();
    return {saved:!!r,tasks:tasks.length,owner:t.owner,dueToday:t.due===today,dueTime:t.dueTime,prio:t.priority,hasReason:!!t.criticalReason,module:t.module,rule:t.rule,vis:t.visibility,
      link:!!(t.links&&t.links[0]&&t.links[0].type==='production'&&t.links[0].id==='PLN_'+today+'_GH7_disease_1'),createdBy:t.createdBy,
      inbox1:inbox().filter(x=>x.user==='maria').length,recs:recs.length,recId:recs[0]&&recs[0].id==='PLN_'+today+'_GH7_disease_1',
      rowAction:/Spray fungicide \\(approved list\\)/.test(row),rowWho:/Maria Santos/.test(row),rowOpen:/>Open</.test(row),
      saved2:!!r2,tasks2:tasks2.length,owner2:tasks2[0].owner,inbox2:inbox().length,recs2:hnxProdPlanLoad().length};})()`),
  expect:{saved:true,tasks:1,owner:'maria',dueToday:true,dueTime:'23:59',prio:'critical',hasReason:true,module:'production',rule:'evidence',vis:'team',link:true,createdBy:'edelyn.n',inbox1:1,recs:1,recId:true,rowAction:true,rowWho:true,rowOpen:true,saved2:true,tasks2:1,owner2:'edelyn.n',inbox2:2,recs2:1} },

{ name:'✅ Done: maria (owner, operator) cannot close the critical; edelyn.n closes it with "sprayed 10:40" → task done, 1 evidence, doneBy edelyn.n, row "Done · Edelyn Rose Nicolas"; a warning for maria → maria closes it herself (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}${FLAG}as('edelyn.n');
    hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:maria','today')});
    hnxProdPlanSave(today,'GH3','leaf_0',${FORM('user:maria','today','17:00','calcium')});
    as('maria');const mariaCrit=hnxProdPlanDone(today,'GH7','disease_1');const canM=hnxProdPlanCanClose(hnxProdPlanFor(today,'GH7','disease_1'));
    as('edelyn.n');const done=hnxProdPlanDone(today,'GH7','disease_1');
    const t=HNXTASKS.load().find(x=>/GH7/.test(x.title));
    showReport();await sleep(300);const row=flagRows()[0].innerHTML;
    as('maria');const mariaWarn=hnxProdPlanDone(today,'GH3','leaf_0');const tw=HNXTASKS.load().find(x=>/GH3/.test(x.title));
    return {mariaCrit,canM,done,status:t.status,evidence:(t.evidence||[]).length,doneBy:t.doneBy,rowDone:/Done · Edelyn Rose Nicolas/.test(row),mariaWarn,warnStatus:tw.status,warnBy:tw.doneBy};})()`),
  expect:{mariaCrit:false,canM:false,done:true,status:'done',evidence:1,doneBy:'edelyn.n',rowDone:true,mariaWarn:true,warnStatus:'done',warnBy:'maria'} },

{ name:'↩ Carry-over: yesterday\'s GH7 mildew plan (open task) is the plan of today\'s carried row — same id PLN_<yesterday>_GH7_disease_1, 1 task, row "carried from"; editing today updates that record and that task (1 record, 1 task) (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(YDAY+"day.GH7.carried={disease_1:yesterday};"),
  run:new Function(`return (async()=>{${AS}${FLAG}as('tester');
    const r=hnxProdPlanSave(yday,'GH7','disease_1',${FORM('user:maria','yday','17:00')});
    as('edelyn.n');const rec=hnxProdPlanFor(today,'GH7','disease_1');
    showReport();await sleep(300);const row=flagRows()[0].innerHTML;
    const r2=hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:maria','today','12:00','isolate')});
    const t=HNXTASKS.load();
    return {saved:!!r,sameId:!!rec&&rec.id==='PLN_'+yday+'_GH7_disease_1',tasks:1,carriedText:/carried from/.test(row),rowAction:/Spray fungicide/.test(row),
      saved2:!!r2,recs:hnxProdPlanLoad().length,recId2:hnxProdPlanLoad()[0].id==='PLN_'+yday+'_GH7_disease_1',tasksAfter:t.length,title2:/Isolate the affected table/.test(t[0].title)};})()`),
  expect:{saved:true,sameId:true,tasks:1,carriedText:true,rowAction:true,saved2:true,recs:1,recId2:true,tasksAfter:1,title2:true} },

{ name:'⏰ Overdue: GH3 low flow due yesterday 17:00 → status overdue; row "OVERDUE"; export text = [Increase water flow…, Maria Santos, <yesterday> 17:00, how, OVERDUE]; exportDailyExcel reads _reportContext (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}${FLAG}as('edelyn.n');
    hnxProdPlanSave(today,'GH3','waterflow_1',{action:'flow_up',who:'user:maria',due:yday,dueTime:'17:00',how:'Open the table valve'});
    const rec=hnxProdPlanFor(today,'GH3','waterflow_1');const st=hnxProdPlanStatus(rec);
    showReport();await sleep(300);const row=flagRows().find(r=>/Low Water Flow/.test(r.innerHTML)).innerHTML;
    const P=hnxProdPlanText(today,'GH3','waterflow_1','warn');
    return {code:st.code,row:/OVERDUE/.test(row),xl:[P.action,P.who,P.when===yday+' 17:00',P.how,P.state],ctx:/_reportContext/.test(exportDailyExcel.toString()),pdf:/_reportContext/.test(exportDailyPDF.toString())};})()`),
  expect:{code:'overdue',row:true,xl:['Increase water flow to the affected tables','Maria Santos',true,'Open the table valve','OVERDUE'],ctx:true,pdf:true} },

{ name:'🔒 Past day: viewPastReport(yesterday) shows the plan text; no ✎ for edelyn.n (canEdit false); ✎ for tester (admin); the PDF is named after the report\'s day (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(YDAY),
  run:new Function(`return (async()=>{${AS}${FLAG}as('tester');
    hnxProdPlanSave(yday,'GH7','disease_1',${FORM('user:maria','yday','17:00')});
    as('edelyn.n');viewPastReport(yday);await sleep(300);let html=document.getElementById('repContent').innerHTML;
    const text=/Spray fungicide \\(approved list\\)/.test(html)&&/Maria Santos/.test(html),supEdit=hnxProdPlanCanEdit(yday),supPencil=/hnxProdPlanEdit\\(/.test(html);
    as('tester');viewPastReport(yday);await sleep(300);html=document.getElementById('repContent').innerHTML;
    const adminEdit=hnxProdPlanCanEdit(yday),adminPencil=/hnxProdPlanEdit\\(/.test(html);
    return {text,supEdit,supPencil,adminEdit,adminPencil,past:!!(window._reportContext&&window._reportContext.date===yday),pdfName:/DailyReport-\\$\\{_ctx\\.date/.test(exportDailyPDF.toString())};})()`),
  expect:{text:true,supEdit:false,supPencil:false,adminEdit:true,adminPencil:true,past:true,pdfName:true} },

{ name:'🔑 Permissions: maria (operator with Production edit) may assign today; acct (accounting) may not and sees no ✎; edelyn.n may (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}${FLAG}
    as('maria');const maria=hnxProdPlanCanEdit(today);
    as('acct');const acct=hnxProdPlanCanEdit(today);showReport();await sleep(300);const acctPencil=/hnxProdPlanEdit\\(/.test(document.getElementById('repContent').innerHTML);
    const acctSave=hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:maria','today')});
    as('edelyn.n');const sup=hnxProdPlanCanEdit(today);showReport();await sleep(300);const supPencil=/hnxProdPlanEdit\\(/.test(document.getElementById('repContent').innerHTML);
    return {maria,acct,acctPencil,acctSave:!!acctSave,tasks:HNXTASKS.load().length,sup,supPencil};})()`),
  expect:{maria:true,acct:false,acctPencil:false,acctSave:false,tasks:0,sup:true,supPencil:true} },

{ name:'🩺 Same plan everywhere: Problems & Actions, the GH7 facility card and the Daily Summary all read "Spray fungicide" · "Maria Santos" (v22.70)',
  requires:REQ,tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('edelyn.n');
    hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:maria','today')});
    renderProdActions();await sleep(200);const pa=document.getElementById('view-prod_actions').innerHTML;
    showFacilityDetail('GH7');await sleep(200);const fd=document.getElementById('facDetailModal').innerHTML;
    openDailySummaryModal();await sleep(300);const ds=(document.getElementById('dsBody')||{}).innerHTML||'';
    return {pa:/Spray fungicide/.test(pa)&&/Maria Santos/.test(pa),paBtn:/✎ Plan/.test(pa),fd:/Spray fungicide/.test(fd)&&/Maria Santos/.test(fd),ds:/🛠 Spray fungicide/.test(ds)&&/Maria Santos/.test(ds),dsNoPlan:/No action yet/.test(ds)};})()`),
  expect:{pa:true,paBtn:true,fd:true,ds:true,dsNoPlan:true} },

{ name:'📊 Pipes / seedlings / fans / custom: GH3 pipes "some" + seedlings ✕ + fan 4 motor ✕ + custom_0 ⚠ → flagged table 6 rows, Big Fans row has a Plan cell, fan 4 first option = "Maintenance call — fan / motor", seedlings first = "Move the seedlings out of the nursery now" (v22.70)',
  requires:REQ,tz:'Asia/Manila',
  seed:seed("day.GH3.pipesClean='some';day.GH3.seedlings='danger';day.GH3.fans={4:{motor:'danger'}};day.GH3.statuses.custom_0='warn';localStorage.setItem('hydroPro_custom_checklist_category_v1',JSON.stringify({GH3:{id:'custom',icon:'⭐',name:'Custom — GH3',items:['Check the new trellis']}}));"),
  run:new Function(`return (async()=>{${AS}${FLAG}as('edelyn.n');showReport();await sleep(300);
    const rows=flagRows().map(r=>r.innerHTML);const fanT=[...document.querySelectorAll('#repContent table')].find(t=>/Fan # — Issues/.test(t.innerHTML));
    const fanRow=fanT?fanT.querySelector('tbody tr'):null;
    return {rows:rows.length,hasPipes:rows.some(r=>/NFT Pipes Clean/.test(r)),hasSeed:rows.some(r=>/Seedlings \\/ Nursery/.test(r)),hasCustom:rows.some(r=>/Check the new trellis/.test(r)),
      fanCell:!!fanRow&&fanRow.querySelectorAll('td').length===3&&/No action yet/.test(fanRow.innerHTML),
      fanFirst:hnxProdPlanOptions('GH3','fan_4','Big Fan 4','danger')[0].label,seedFirst:hnxProdPlanOptions('GH3','seedlings','Seedlings / Nursery','danger')[0].label,
      pipesFirst:hnxProdPlanOptions('GH3','pipes','NFT Pipes Clean','warn')[0].label,customFirst:hnxProdPlanOptions('GH3','custom_0','Check the new trellis','warn')[0].label};})()`),
  expect:{rows:6,hasPipes:true,hasSeed:true,hasCustom:true,fanCell:true,fanFirst:'Maintenance call — fan / motor',seedFirst:'Move the seedlings out of the nursery now',pipesFirst:'Clean the NFT pipes now',customFirst:'Fix now on site'} },

{ name:'🚦 Trial copy: the task a plan creates carries origin module:production (v22.71)',
  requires:"!!window.__hnxTasksRules&&typeof window.hnxProdPlanFor==='function'",tz:'Asia/Manila',seed:seed(),
  run:new Function(`return (async()=>{${AS}as('edelyn.n');
    hnxProdPlanSave(today,'GH7','disease_1',${FORM('user:maria','today')});
    const t=HNXTASKS.load()[0]||{};return {origin:t.origin,tasks:HNXTASKS.load().length};})()`),
  expect:{origin:'module:production',tasks:1} }
];
