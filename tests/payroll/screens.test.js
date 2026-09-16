/* The screens must say what the engine says. */
module.exports=[
{ name:'Attendance Matrix: a late day carries its approval state (v20.58)',
  seed:()=>{const d=new Date();const t=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'CYR',name:'VIRGO, MARIA CYRIL',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',dailyRate:700,dateHired:'2025-01-01'}]));
    const a={};a[t]={CYR:{status:'late',timeIn:'10:30',timeOut:'17:00',lateMinutes:210,source:'fingerprint'}};localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{const grab=async()=>{document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();window.hnxAttMatrix();await sleep(1200);
      const td=[...document.querySelectorAll('#hnxAttMxBody td')].find(t=>/10:30/.test(t.textContent||''));return td?{badge:(td.textContent||'').replace(/[\s\d:]+/g,' ').trim(),border:td.style.border}:'no cell';};
    const waiting=await grab();
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({[today+'|CYR']:{decision:'excuse',by:'Eyal',at:Date.now()}}));const excused=await grab();
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({[today+'|CYR']:{decision:'deduct',lateMinutes:210,by:'Dr Amy',at:Date.now()}}));const deduct=await grab();
    document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();return {waiting,excused,deduct};},
  expect:{'waiting.badge':'⏳ waiting','waiting.border':'1px dashed rgb(255, 202, 40)','excused.badge':'✓ excused','excused.border':'1px solid rgb(102, 187, 106)','deduct.badge':'➖ deduct','deduct.border':'1px solid rgb(239, 83, 80)'} },
{ name:'Attendance Matrix: half day, imported office absent, and pre-hire days agree with the engine (v20.65)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'O1',name:'OFFICE, ANN',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',dailyRate:700,dateHired:'2025-01-01'},{id:'L2',name:'NEW, EDELYN',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2026-09-09'}]));
    const a={};a['2026-09-09']={O1:{status:'present',timeIn:'07:00',timeOut:'12:00',source:'manual',dayFraction:0.5,editedBy:'jinky'},L2:{status:'present',timeIn:'07:00',timeOut:'17:00',source:'fingerprint'}};
    a['2026-09-08']={O1:{status:'absent',timeIn:'',timeOut:'',source:'sheet-history',history:1}};a['2026-09-07']={O1:{status:'present',timeIn:'07:00',timeOut:'17:30',source:'fingerprint'}};localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();window.hnxAttMatrix();await sleep(1200);
    const host=document.getElementById('hnxAttMxBody');
    const cell=(name,day)=>{const tr=[...host.querySelectorAll('tr')].find(t=>(t.textContent||'').indexOf(name)>=0);const td=tr&&[...tr.querySelectorAll('td')].find(t=>(t.getAttribute('title')||'').indexOf(day)>=0);return td?{text:(td.textContent||'').replace(/\s+/g,' ').trim().slice(0,12),title:(td.getAttribute('title')||'').slice(0,60)}:'no cell';};
    const out={half:cell('OFFICE, ANN','2026-09-09'),imported:cell('OFFICE, ANN','2026-09-08'),preHire:cell('NEW, EDELYN','2026-09-07')};
    document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();
    return {halfIsHalf:/HALF DAY/.test(out.half.title),importedIsPaid:out.imported.text==='·',preHireIsOutside:/outside employment/.test(out.preHire.title),out};},
  expect:{halfIsHalf:true,importedIsPaid:true,preHireIsOutside:true} },
{ name:'Attendance screen: the six cards filter, Pending explains why (v20.62)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E1',name:'BEN ARI, EYAL',status:'Active',salaryCategory:'management',dept:'Management',payType:'semi',dailyRate:1000,dateHired:'2020-01-01'},{id:'E2',name:'OFFICE, ANNA',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',dailyRate:700,dateHired:'2024-01-01'}]));localStorage.setItem('hydroPro_attendance','{}');},
  run:async()=>{switchView('attendance');await sleep(1500);const v=document.getElementById('view-attendance');const cards=()=>[...v.querySelectorAll('.att-stat')];
    const pend=cards().find(c=>/Pending/.test(c.textContent||''));pend.click();await sleep(900);
    const why=(v.querySelector('#attPendWhy')||{}).textContent||'';const on=cards().filter(c=>c.classList.contains('on')).map(c=>(c.querySelector('.att-stat-label')||{}).textContent);
    cards().find(c=>/Pending/.test(c.textContent||'')).click();await sleep(600);
    return {clickable:cards().every(c=>!!c.getAttribute('onclick')),filter:attFilterStatus===''?'cleared':attFilterStatus,on,whyNamesEyal:/BEN ARI, EYAL/.test(why)&&/not on the biometric clock/.test(why)};},
  expect:{clickable:true,filter:'cleared',on:['Pending'],whyNamesEyal:true} },
{ name:'payroll screens: Excel and CSV stay visible, the rest folds (v20.63); the three pending columns exist (v20.61)',
  run:async()=>{const out={};for(const view of ['payroll_ops','payroll_office']){switchView(view);await sleep(5200);const v=document.getElementById('view-'+view);
      const vis=[...v.querySelectorAll('button')].filter(x=>!x.closest('table')&&x.style.display!=='none'&&x.offsetParent!==null).map(x=>(x.textContent||'').trim());
      out[view]={exports:vis.filter(t=>/Excel|CSV/i.test(t)).sort(),pendTh:[...v.querySelectorAll('th')].map(t=>(t.textContent||'').trim()).filter(t=>/^⏳/.test(t))};}
    return out;},
  expect:{'payroll_ops.exports':['📄 CSV (plain data)','📑 Full Report (Excel)'],'payroll_ops.pendTh':['⏳ Late','⏳ Memo','⏳ Sun OT'],'payroll_office.exports':['📄 CSV (plain data)','📑 Full Report (Excel)'],'payroll_office.pendTh':['⏳ Late','⏳ Memo','⏳ Sun OT']} },
{ name:'Attendance Matrix is a real screen: sidebar, search, registry (v20.60)',
  run:async()=>{try{window.NexiNavRefresh&&window.NexiNavRefresh();}catch(e){}
    switchView('attendance');await sleep(800);const tab=!!document.getElementById('modTab-hr_att_matrix');
    switchView('hr_att_matrix');await sleep(1500);const v=document.getElementById('view-hr_att_matrix');
    const r={inModules:!!MODULES.hr.views.find(x=>x.id==='hr_att_matrix'),inSearch:!!(window.NEXI_NAV||[]).find(x=>x.id==='hr_att_matrix'),registry:(window.HNX_VIEW_REGISTRY.get('hr_att_matrix')||{}).status,tab,active:!!(v&&v.classList.contains('active')),overlay:!!document.getElementById('hnxAttMx')};
    document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();return r;},
  expect:{inModules:true,inSearch:true,registry:'live',tab:true,active:true,overlay:true} },
];
