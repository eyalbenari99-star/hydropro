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
{ name:'the in-app Rulebook passes on this build and touches nothing in the store (v20.67)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'REAL1',name:'REAL, PERSON',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'}]));
    localStorage.setItem('hydroPro_attendance',JSON.stringify({'2026-09-15':{REAL1:{status:'late',timeIn:'09:00',timeOut:'17:00',lateMinutes:120,source:'fingerprint'}}}));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'REALM',category:'hr',type:'good',empId:'REAL1',date:'2026-09-15',status:'pending',totalAmount:123}]));},
  run:async()=>{const keys=['hydroPro_employees','hydroPro_attendance','hydroPro_memos','hydroPro_late_approvals_v1','hydroPro_weekend_approvals_v1','hydroPro_ph_holidays'];
    const snap=()=>keys.map(k=>k+'='+(localStorage.getItem(k)||'')).join('\n');const before=snap();
    const rb=window.hnxRulebook({quiet:true});const after=snap();
    return {ok:rb.ok,failed:rb.results.filter(r=>!r.ok).map(r=>r.name),storeUntouched:before===after,hookCleared:window.__hnxRulebook==null};},
  expect:{ok:true,failed:[],storeUntouched:true,hookCleared:true} },
{ name:'biometric sync: five labourers scanning the same minute at the gate keep their in-scan; a timetable column repeated daily is still dropped (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_bio_cfg_v1',JSON.stringify({url:'http://bio.test',token:'t'}));
    const map={};const E=[];for(let i=1;i<=8;i++){map['10'+i]='W'+i;E.push({id:'W'+i,name:'WORKER '+i,status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'});}
    localStorage.setItem('hydroPro_bio_map_v1',JSON.stringify(map));localStorage.setItem('hydroPro_employees',JSON.stringify(E));},
  run:async()=>{const days=daysEnding(today,5);const D=[];
    days.forEach((d,di)=>{const p=[];for(let i=1;i<=8;i++){const tin=(di===4&&i<=5)?'06:58':'06:45';p.push({userId:'10'+i,time:tin});p.push({userId:'10'+i,time:'08:00'});p.push({userId:'10'+i,time:'17:0'+(i%6)});}D.push({date:d,punches:p});});
    window.fetch=(u)=>Promise.resolve({json:()=>Promise.resolve(/punches/.test(String(u))?{days:D}:{devices:{}})});
    window.hnxBioPull();await sleep(2500);
    const a=JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}');const last=a[days[4]]||{};
    return {w1:{st:last.W1&&last.W1.status,tin:last.W1&&last.W1.timeIn,late:last.W1&&last.W1.lateMinutes},w7:{st:last.W7&&last.W7.status,tin:last.W7&&last.W7.timeIn},lateQ:Object.keys(JSON.parse(localStorage.getItem('hydroPro_late_approvals_v1')||'{}')).length};},
  expect:{'w1.st':'present','w1.tin':'06:58','w1.late':0,'w7.st':'present','w7.tin':'06:45',lateQ:0} },
{ name:'timecard bridge: an out-only row is measured from the out-scan and queued as late, never a silent 07:00 present day (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'JO1',name:'JO SANTOS',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'}]));
    localStorage.setItem('hydroPro_timecard_runs_v1',JSON.stringify([{headers:['Date','Name','Time In','Time Out'],rows:[['2026-09-14','JO SANTOS','','13:05']],periodStart:'2026-09-14',periodEnd:'2026-09-14'}]));},
  run:async()=>{const r=window.hnxTcToAttendance('2026-09-14','2026-09-14',{});const rec=((JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}')['2026-09-14'])||{}).JO1||{};
    return {written:r.written,st:rec.status,tin:rec.timeIn,tout:rec.timeOut,late:rec.lateMinutes};},
  expect:{written:1,st:'late',tin:'',tout:'13:05',late:365} },
{ name:'ZK punch-log import: an unmapped ID is listed as unmatched and the other rows still land (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'A1',name:'ANNA ONE',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'},{id:'B1',name:'BEN ONE',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'}]));},
  run:async()=>{const R=(u,n,t)=>({userid:u,name:n,date:'2026-09-14',time:t});
    let threw='';try{processZkRows([R('A1','ANNA ONE','07:00'),R('X9','NOBODY HERE','07:01'),R('B1','BEN ONE','07:02'),R('A1','ANNA ONE','17:00'),R('B1','BEN ONE','17:01')],'test.xlsx');}catch(e){threw=String(e.message||e);}
    const d=JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}')['2026-09-14']||{};
    return {threw,a:d.A1&&d.A1.timeOut,b:d.B1&&d.B1.timeOut,x:!!d.X9};},
  expect:{threw:'',a:'17:00',b:'17:01',x:false} },
{ name:'reopen gives a paid referral bonus back to the draft (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-07_2026-09-13',type:'weekly',periodStart:'2026-09-07',periodEnd:'2026-09-13',status:'approved',approvedAt:1,approvedBy:'eyal',lines:[],totals:{}}]));
    localStorage.setItem('hydroPro_hr_payroll_bonuses',JSON.stringify([{id:'B1',employeeId:'EMP-A',type:'referral',amount:2000,paidInPayroll:true,payrollRunId:'ops_2026-09-07_2026-09-13'},{id:'B2',employeeId:'EMP-B',type:'referral',amount:2000,paidInPayroll:true,payrollRunId:'ops_2026-08-31_2026-09-06'}]));},
  run:async()=>{window._payOpsCurrentPeriod={start:'2026-09-07',end:'2026-09-13',payday:'2026-09-19',label:'test week'};
    window.hnxPayReopen('ops');await sleep(800);
    const b=JSON.parse(localStorage.getItem('hydroPro_hr_payroll_bonuses')||'[]');const run=JSON.parse(localStorage.getItem('hydroPro_payroll_runs')||'[]')[0];
    return {status:run.status,b1:[b[0].paidInPayroll,b[0].payrollRunId],b2:[b[1].paidInPayroll,b[1].payrollRunId]};},
  expect:{status:'draft',b1:[false,null],b2:[true,'ops_2026-08-31_2026-09-06']} },
{ name:'manual-add pickers: a weekly labourer is not offered on the OFFICE run and an office person is not offered on the WEEKLY run (v20.68)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'D1',name:'DRIVER ONE',status:'Active',salaryCategory:'drivers',dept:'Logistics',payType:'weekly',dailyRate:600,dateHired:'2025-01-01'},{id:'O1',name:'OFFICE ANN',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',monthlyBasic:16000,dateHired:'2025-01-01'}]));},
  run:async()=>{const names=()=>{const o=document.getElementById('payAddEmpOverlay');const r=o?[...o.querySelectorAll('option')].map(x=>x.value):[];o&&o.remove();return r;};
    window._payOpsCurrentPeriod={start:'2026-09-07',end:'2026-09-13',payday:'2026-09-19',label:'w'};window._payOfficeCurrentPeriod={start:'2026-09-01',end:'2026-09-15',half:1,label:'h'};
    payOpsAddEmpDialog();await sleep(300);const ops=names();payOfficeAddEmpDialog();await sleep(300);const off=names();
    return {ops,off};},
  expect:{ops:[],off:[]} },
];
