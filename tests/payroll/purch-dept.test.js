/* v21.53 (Eyal): Purchasing Workspace — Department is a dropdown with every department; the tab bar is never folded */
module.exports=[
{ name:'🛒 Purchasing request form: Department is a <select> that lists Construction, Projects, Purchasing, Accounting and Production; picking Construction stores it on the draft; after 6 s the 10 workflow tabs + Quick tools are still visible (no "All tools (9)…" picker) (v21.53)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:new Function(`return (async()=>{await sleep(4000);switchView('acct_purch_pro');await sleep(600);__PURPRO.tab('prs');await sleep(200);__PURPRO.newPR();await sleep(300);
    const v=document.getElementById('view-acct_purch_pro');const sel=[...v.querySelectorAll('select.pp-in')].find(x=>[...x.options].some(o=>o.value==='Construction'));
    const opts=sel?[...sel.options].map(o=>o.value):[];sel.value='Construction';sel.dispatchEvent(new Event('change'));
    await sleep(6500);const nav=v.querySelector('.pp-nav');const tabs=nav?[...nav.querySelectorAll('button')].filter(b=>b.offsetParent!==null).length:0;const picker=!!v.querySelector('.hnx-tbsel');
    return {isSelect:!!sel,has:['Construction','Projects','Purchasing','Accounting','Production'].every(x=>opts.includes(x)),stored:(function(){renderPurchPro();var s2=[...v.querySelectorAll('select.pp-in')].find(x=>[...x.options].some(o=>o.value==='Construction'));return s2?s2.value:'(n/a)';})(),tabs,picker};})();`),
  expect:{isSelect:true,has:true,stored:'Construction',tabs:10,picker:false} },
];
module.exports.push(
{ name:'🏗 Project & Classification drop boxes (v21.67): the form offers "PRJ15 – Greenhouse 15 Construction" from the Projects module and the seeded classifications; ➕ Add a project "Road drainage GH15" saves it and selects it; a saved request stores project, classification and company APTI; a request without classification is refused',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_prj_projects_v1',JSON.stringify([{id:'PRJ15',p:'15',code:'APAC-GH-2026',name:'PRJ15 – Greenhouse 15 Construction'}]));},
  run:new Function(`return (async()=>{await sleep(4000);window.alert=m=>{window.__lastAlert=m;};
    switchView('acct_purch_pro');await sleep(600);__PURPRO.newPR();await sleep(300);
    const v=document.getElementById('view-acct_purch_pro');const ps=document.getElementById('ppf_project'),cs=document.getElementById('ppf_klass');
    const hasPrj=ps&&[...ps.options].some(o=>o.value==='PRJ15 – Greenhouse 15 Construction');const hasCls=cs&&[...cs.options].some(o=>o.value==='Construction materials');
    window.prompt=()=>'Road drainage GH15';ps.value='__add__';__PURPRO.dfSel('project',ps);await sleep(300);
    const ps2=document.getElementById('ppf_project');const sel=ps2&&ps2.value;const saved=JSON.parse(localStorage.getItem('hydroPro_purch_projects_v1')||'[]');
    __PURPRO.df('title','Cement for drainage');__PURPRO.df('dept','Construction');__PURPRO.df('needBy','2026-10-20');__PURPRO.df('justification','Drainage of GH15 to the road needs cement and pipes before the rains.');__PURPRO.dif(0,'desc','Cement 40kg');__PURPRO.dif(0,'qty',100);
    window.__lastAlert='';__PURPRO.saveDraft();await sleep(200);const refused=/Classification/.test(window.__lastAlert||'');
    const cs2=document.getElementById('ppf_klass');cs2.value='Construction materials';__PURPRO.dfSel('klass',cs2);__PURPRO.saveDraft();await sleep(300);
    const pr=JSON.parse(localStorage.getItem('hydroPro_purch_prs')).find(p=>p.title==='Cement for drainage');
    return {hasPrj:!!hasPrj,hasCls:!!hasCls,sel,saved:saved[0],refused,project:pr&&pr.project,klass:pr&&pr.klass,company:pr&&pr.company,txt:/APTI/.test(v.innerText)};})();`),
  expect:{hasPrj:true,hasCls:true,sel:'Road drainage GH15',saved:'Road drainage GH15',refused:true,project:'Road drainage GH15',klass:'Construction materials',company:'APTI',txt:true} });
