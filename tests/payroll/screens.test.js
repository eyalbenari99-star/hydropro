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
    /* distinct real-looking names: boot merges look-alike names into one person */
    const NAMES=['SANTOS, ERIC','REYES, MARLON','CRUZ, DANILO','BAUTISTA, JOEL','GARCIA, RONALD','MENDOZA, ALLAN','TORRES, RAMIL','FLORES, JUNJUN'];
    const map={};const E=[];for(let i=1;i<=8;i++){map['10'+i]='W'+i;E.push({id:'W'+i,name:NAMES[i-1],status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'});}
    localStorage.setItem('hydroPro_bio_map_v1',JSON.stringify(map));localStorage.setItem('hydroPro_employees',JSON.stringify(E));},
  run:async()=>{const days=daysEnding(today,5);const D=[];
    days.forEach((d,di)=>{const p=[];for(let i=1;i<=8;i++){const tin=(di===4&&i<=5)?'06:58':'06:4'+i; /* 08:00 every day is the timetable column; 06:58 once is the gate queue */p.push({userId:'10'+i,time:tin});p.push({userId:'10'+i,time:'08:00'});p.push({userId:'10'+i,time:'17:0'+(i%6)});}D.push({date:d,punches:p});});
    window.fetch=(u)=>Promise.resolve({json:()=>Promise.resolve(/punches/.test(String(u))?{days:D}:{devices:{}})});
    window.hnxBioPull();await sleep(2500);
    const a=JSON.parse(localStorage.getItem('hydroPro_attendance')||'{}');const last=a[days[4]]||{};
    return {w1:{st:last.W1&&last.W1.status,tin:last.W1&&last.W1.timeIn,late:last.W1&&last.W1.lateMinutes},w7:{st:last.W7&&last.W7.status,tin:last.W7&&last.W7.timeIn},sched:Object.values(last).some(r=>r.timeIn==='08:00'),lateQ:Object.keys(JSON.parse(localStorage.getItem('hydroPro_late_approvals_v1')||'{}')).length};},
  expect:{'w1.st':'present','w1.tin':'06:58','w1.late':0,'w7.st':'present','w7.tin':'06:47',sched:false,lateQ:0} },
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
{ name:'office CSV carries Late Mins, Tardy Ded, the three pending columns and the uncollected shortfall; Late min is the DECIDED minutes (v20.69)',
  seed:()=>{localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-09-01_2026-09-15',type:'semi_monthly',periodStart:'2026-09-01',periodEnd:'2026-09-15',status:'approved',approvedAt:1,approvedBy:'eyal',totals:{},
    lines:[{empId:'O1',name:'OFFICE ANN',salaryCategory:'accounting',dailyRate:727.27,daysWorked:11,daysAbsentUnauth:0,daysAbsentAuth:0,sundaysWorked:0,basicPay:7909.09,sundayPremium:0,holidayPay:0,memoAdd:0,memoDed:0,referralBonus:0,lateMinutes:200,lateDecidedMins:60,lateGate:true,tardyDeduction:90.91,grossPay:7909.09,grossEarnings:7909.09,sss:0,phic:0,hdmf:0,withholdingTax:0,netPay:7909.09,netShortfall:0,pending:{late:{n:0,amt:0},memo:{n:1,amt:1000},sun:{n:1,amt:945.45},total:1945.45}},
           {empId:'O2',name:'OFFICE ZERO',salaryCategory:'accounting',dailyRate:727.27,daysWorked:0,daysAbsentUnauth:11,daysAbsentAuth:0,sundaysWorked:0,basicPay:0,grossPay:0,grossEarnings:0,sss:275.34,phic:0,hdmf:0,withholdingTax:0,netPay:0,netShortfall:275.34,memoAdd:0,memoDed:0,lateMinutes:0,tardyDeduction:0}]}]));},
  run:async()=>{let text='';const _c=URL.createObjectURL;URL.createObjectURL=()=>'blob:x';
    const _B=window.Blob;window.Blob=function(parts,o){text=parts.join('');return new _B(parts,o);};
    window._payOfficeCurrentPeriod={start:'2026-09-01',end:'2026-09-15',half:1,label:'h'};
    payOfficeExportCSV();window.Blob=_B;URL.createObjectURL=_c;
    const rows=text.split('\n').map(r=>r.split('","').map(c=>c.replace(/^"|"$/g,'')));const H=rows[0];const col=n=>H.indexOf(n);
    const r1=rows[1],r2=rows[2],tot=rows[3];
    return {hasCols:['Late Mins','Tardy Ded','Pending Late (not paid)','Pending Memo (not paid)','Pending Sun OT (not paid)','Net shortfall (uncollected)'].every(c=>col(c)>=0),
      lateMins:r1[col('Late Mins')],tardy:r1[col('Tardy Ded')],pendMemo:r1[col('Pending Memo (not paid)')],pendSun:r1[col('Pending Sun OT (not paid)')],short:r2[col('Net shortfall (uncollected)')],totShort:tot[col('Net shortfall (uncollected)')]};},
  expect:{hasCols:true,lateMins:'60',tardy:'90.91',pendMemo:'1000',pendSun:'945.45',short:'275.34',totShort:'275.34'} },
{ name:'payroll rows and payslip show the tardy note on the office row and the uncollected shortfall under Net (v20.69)',
  run:async()=>{const l={netPay:0,netShortfall:275.34,tardyDeduction:90.91,lateGate:true,lateDecidedMins:60,lateMinutes:200};
    const note=hnxNetShortNote(l);const mins=hnxLateMinsShown(l);const none=hnxNetShortNote({netPay:100,netShortfall:0});
    return {noteHas:/275\.34 uncollected/.test(note),mins,none:none===''};},
  expect:{noteHas:true,mins:60,none:true} },
{ name:'engine: the payslip allowance basis says what the engine did — weekly ÷26 × Mon–Sat days, office monthly ÷ 2 × scheduled days (v20.69)',
  run:async()=>{const jo=labour('JO','JO SANTOS');const ann=office('ANN','ANN OFFICE',{monthlyBasic:16000});setE([jo,ann]);const a={};
    ['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12'].forEach(d=>{a[d]={JO:rec('present','07:00','17:00'),ANN:rec('present','07:00','17:30')};});setA(a);
    const w=calcEmployeePayroll(jo,'2026-09-07','2026-09-13','weekly');const o=calcEmployeePayroll(ann,'2026-09-01','2026-09-15','semi_monthly');
    return {w:w.allowBasis,o:o.allowBasis};},
  expect:{w:'÷ 26 × 6 Mon–Sat days worked',o:'monthly ÷ 2 × 11 of 11 scheduled days'} },
{ name:'Attendance Matrix: a present row carrying late minutes is painted as the late it is; a labour Sunday with no record is rest, not ✗ (v20.69)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'L1',name:'SANTOS, JO',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'}]));
    const a={};a['2026-09-14']={L1:{status:'present',timeIn:'07:45',timeOut:'17:00',lateMinutes:45,source:'hrmatrix'}};a['2026-09-06']={L1:{status:'absent',timeIn:'',timeOut:'',source:'timecard-bridge'}};
    a['2026-09-15']={L1:{status:'present',timeIn:'07:00',timeOut:'17:00',source:'fingerprint'}};localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();window.hnxAttMatrix();await sleep(1200);
    const host=document.getElementById('hnxAttMxBody');const tr=[...host.querySelectorAll('tr')].find(t=>(t.textContent||'').indexOf('SANTOS, JO')>=0);
    const cell=day=>{const td=tr&&[...tr.querySelectorAll('td')].find(t=>(t.getAttribute('title')||'').indexOf(day)>=0);return td?{text:(td.textContent||'').replace(/\s+/g,' ').trim(),title:td.getAttribute('title')||''}:null;};
    const out={late:cell('2026-09-14'),sunAbs:cell('2026-09-06'),sunNone:cell('2026-09-13')};
    document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();
    return {lateIsLate:!!out.late&&/LATE 45 min/.test(out.late.title)&&/waiting/.test(out.late.text),sunAbsRest:!!out.sunAbs&&/Sun ?rest/i.test(out.sunAbs.text.replace(/\s/g,'')),sunNoneRest:!!out.sunNone&&/Sunrest/i.test(out.sunNone.text.replace(/\s/g,'')),out};},
  expect:{lateIsLate:true,sunAbsRest:true,sunNoneRest:true} },
{ name:'Attendance screen: a Sunday is never Late; a late the clock-in implies but the record does not carry is flagged not queued (v20.69)',
  run:async()=>{const sun=hnxAttEff({status:'late',timeIn:'09:00',timeOut:'17:00',lateMinutes:120},'2026-09-13');
    const derived=hnxAttEff({status:'present',timeIn:'07:30',timeOut:'17:00',lateMinutes:0},'2026-09-14');
    const stored=hnxAttEff({status:'present',timeIn:'07:30',timeOut:'17:00',lateMinutes:30},'2026-09-14');
    return {sun:[sun.status,sun.lateMinutes],derived:[derived.status,derived.lateMinutes,!!derived.notQueued],stored:[stored.status,stored.lateMinutes,!!stored.notQueued]};},
  expect:{sun:['present',0],derived:['late',30,true],stored:['late',30,false]} },
{ name:'Reconcile ✓ Approve by an approver excuses the late in the Eyal / Dr Amy queue; the day stays present with its minutes (v20.69)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'L1',name:'SANTOS, JO',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'}]));
    const a={};a['2026-09-14']={L1:{status:'late',timeIn:'08:00',timeOut:'17:00',lateMinutes:60,source:'fingerprint'}};localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{window.prompt=()=>'Eyal';recCurrentDate='2026-09-14';const before=hnxLate.scan('2026-09-14','2026-09-14','L1')[0];
    recApproveLate('L1');await sleep(500);
    const after=hnxLate.scan('2026-09-14','2026-09-14','L1')[0];const st=JSON.parse(localStorage.getItem('hydroPro_late_approvals_v1')||'{}')['2026-09-14|L1']||{};
    const r=JSON.parse(localStorage.getItem('hydroPro_attendance'))['2026-09-14'].L1;
    return {before:before&&before.decision,after:after&&after.decision,stored:st.decision,sup:r.supervisorApproval,st:r.status,mins:r.lateMinutes};},
  expect:{before:'',after:'excuse',stored:'excuse',sup:'Eyal',st:'late',mins:60} },
{ name:'biometric sync: a fingerprint row a person tagged (reason) still receives its evening OUT punch; a human decision on the status is left alone (v20.69)',
  seed:()=>{localStorage.setItem('hydroPro_bio_cfg_v1',JSON.stringify({url:'http://bio.test',token:'t'}));
    localStorage.setItem('hydroPro_bio_map_v1',JSON.stringify({'201':'A1','202':'B1'}));
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'A1',name:'REYES, MARLON',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'},{id:'B1',name:'CRUZ, DANILO',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',dailyRate:658,dateHired:'2025-01-01'}]));},
  run:async()=>{const d=daysEnding(today,2)[0];const a={};a[d]={A1:{status:'present',timeIn:'06:50',timeOut:'',lateMinutes:0,source:'fingerprint',reason:'Reconcile: accepted',editedBy:'jinky'},B1:{status:'authorized',timeIn:'',timeOut:'',lateMinutes:0,source:'fingerprint',reason:'sick',editedBy:'jinky'}};setA(a);
    const D=[{date:d,punches:[{userId:'201',time:'06:50'},{userId:'201',time:'17:02'},{userId:'202',time:'06:55'},{userId:'202',time:'17:00'}]}];
    window.fetch=(u)=>Promise.resolve({json:()=>Promise.resolve(/punches/.test(String(u))?{days:D}:{devices:{}})});
    window.hnxBioPull();await sleep(2500);const x=JSON.parse(localStorage.getItem('hydroPro_attendance'))[d];
    return {aOut:x.A1.timeOut,aReason:x.A1.reason,aSt:x.A1.status,bSt:x.B1.status,bIn:x.B1.timeIn};},
  expect:{aOut:'17:02',aReason:'Reconcile: accepted',aSt:'present',bSt:'authorized',bIn:''} },
{ name:'a draft re-persist keeps the reopen stamps, so the cloud merge cannot re-lock a reopened run with the old figures (v20.70)',
  seed:()=>{localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-07_2026-09-13',type:'weekly',periodStart:'2026-09-07',periodEnd:'2026-09-13',status:'draft',reopenedAt:1758000000000,reopenedBy:'eyal',approvalHistory:[{approvedBy:'eyal',reason:'reopened'}],lines:[],totals:{}}]));},
  run:async()=>{upsertPayrollRun({id:'ops_2026-09-07_2026-09-13',type:'weekly',periodStart:'2026-09-07',periodEnd:'2026-09-13',status:'draft',lines:[{empId:'X'}],totals:{netPay:1},createdAt:1});
    const r=JSON.parse(localStorage.getItem('hydroPro_payroll_runs'))[0];return {reopenedAt:r.reopenedAt,by:r.reopenedBy,hist:(r.approvalHistory||[]).length,lines:r.lines.length};},
  expect:{reopenedAt:1758000000000,by:'eyal',hist:1,lines:1} },
{ name:'Approve & Lock asks about pending memos and unsigned weekends, not only lates (v20.70)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'JO',name:'SANTOS, JO',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01'}]));
    const a={};['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12'].forEach(d=>{a[d]={JO:{status:'present',timeIn:'07:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'}};});localStorage.setItem('hydroPro_attendance',JSON.stringify(a));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M1',category:'hr',type:'good',empId:'JO',date:'2026-09-08',status:'pending',totalAmount:500,reasonLabel:'bonus',signatures:{}},{id:'M2',category:'hr',type:'good',empId:'JO',date:'2026-09-09',status:'pending',totalAmount:700,reasonLabel:'bonus',signatures:{}}]));},
  run:async()=>{const asked=[];window.confirm=m=>{asked.push(String(m).slice(0,120));return !/memo\(s\) not yet signed/.test(String(m));};
    window._payOpsCurrentPeriod={start:'2026-09-07',end:'2026-09-13',payday:'2026-09-19',label:'w'};renderPayrollOps();await sleep(1500);
    payOpsApprove();await sleep(400);const ov=document.getElementById('hnxAnomOv');if(ov&&window.__hnxAnomGo){ov.remove();window.__hnxAnomGo();} /* the pre-sign anomaly check is a separate gate */
    await sleep(500);const r=JSON.parse(localStorage.getItem('hydroPro_payroll_runs')).find(x=>x.id==='ops_2026-09-07_2026-09-13');
    return {asked:asked.some(m=>/2 memo\(s\) not yet signed/.test(m)),status:r&&r.status,pend:r&&r.lines[0]&&r.lines[0].pending&&r.lines[0].pending.memo.n};},
  expect:{asked:true,status:'draft',pend:2} },
{ name:'tardiness policy is one snapshot (last writer wins), memo delete and attendance clear leave tombstones (v20.70)',
  seed:()=>{localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M9',category:'hr',type:'good',empId:'X',date:'2026-09-14',status:'pending',totalAmount:500,signatures:{}}]));
    const a={};a['2026-09-14']={L1:{status:'present',timeIn:'07:00',timeOut:'17:00',source:'fingerprint'}};localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{window.confirm=()=>true;hnxTardyToggle('office');await sleep(300);const c=JSON.parse(localStorage.getItem('hydroPro_pay_tardy_v1')||'{}');
    _editingMemoId='M9';memoDelete();await sleep(200);deleteAttRecord('2026-09-14','L1');
    const tomb=JSON.parse(localStorage.getItem('hydroPro_optomb')||'{}');
    return {lww:c._lww===true&&c.updatedAt>0,memoGone:!JSON.parse(localStorage.getItem('hydroPro_memos')).some(m=>m.id==='M9'),memoTomb:!!(tomb.hydroPro_memos||{}).M9,attGone:!((JSON.parse(localStorage.getItem('hydroPro_attendance'))['2026-09-14']||{}).L1),attTomb:!!(tomb.hydroPro_attendance||{})['2026-09-14|L1']};},
  expect:{lww:true,memoGone:true,memoTomb:true,attGone:true,attTomb:true} },
{ name:'gates: a supervisor cannot rewrite pay rates on Pay Basis Check, cannot change the late policy, and cannot give both memo signatures (v20.70)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'sup',fullname:'Super Visor',passwordHash:'x',role:'supervisor',active:true}]));
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'D1',name:'DRIVER ONE',status:'Active',salaryCategory:'drivers',dept:'Logistics',payType:'weekly',dailyRate:600,dateHired:'2025-01-01'}]));
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M2',category:'hr',type:'good',empId:'D1',date:'2026-09-14',status:'pending',totalAmount:500,signatures:{}}]));},
  run:async()=>{window.confirm=()=>true;sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'sup',loginAt:Date.now()}));
    const cfg0=JSON.parse(JSON.stringify(hnxLate.cfg()));
    hnxPBSet('D1','dailyRate','999');const rate=JSON.parse(localStorage.getItem('hydroPro_employees'))[0].dailyRate;
    hnxLateCfg('minMinutes',45);const cfg1=hnxLate.cfg();
    window._viewingMemoId='M2';memoSign('supervisor');memoSign('hrManager');const m=memos.find(x=>x.id==='M2');
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));
    return {rate,minUnchanged:cfg1.minMinutes===cfg0.minMinutes,supSigned:!!m.signatures.supervisor,hrSigned:!!m.signatures.hrManager,status:m.status};},
  expect:{rate:600,minUnchanged:true,supSigned:true,hrSigned:false,status:'pending'} },
{ name:'payroll-line modal prints the same Gross as the table and the payslip (v20.70)',
  seed:()=>{localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-07_2026-09-13',type:'weekly',periodStart:'2026-09-07',periodEnd:'2026-09-13',status:'approved',approvedBy:'eyal',approvedAt:1,lines:[{empId:'D1',name:'DRIVER ONE',dailyRate:600,daysWorked:6,basicPay:3600,grossPay:3600,grossEarnings:3900,allowanceNonTaxAmt:300,sss:0,phic:0,hdmf:0,withholdingTax:0,netPay:3900,memoAdd:0,memoDed:0}],totals:{}}]));
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'D1',name:'DRIVER ONE',status:'Active',salaryCategory:'drivers',dept:'Logistics',payType:'weekly',dailyRate:600,dateHired:'2025-01-01'}]));},
  run:async()=>{window._payOpsCurrentPeriod={start:'2026-09-07',end:'2026-09-13',payday:'2026-09-19',label:'w'};openPayrollLine('ops_2026-09-07_2026-09-13','D1','weekly');await sleep(600);
    const t=document.body.innerText||'';const i=t.indexOf('Gross Pay');return {gross:t.slice(i,i+19).replace(/\s+/g,' ')};},
  expect:{gross:'Gross Pay ₱3,900.00'} },
];
