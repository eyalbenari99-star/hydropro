/* The screens must say what the engine says. */
module.exports=[
{ name:'Attendance Matrix: a late day carries its approval state (v20.58/v20.89)',
  /* v20.89 (a real fix, not a rewrite of the rule): the late-approval badge only applies on a weekday —
     an office Saturday/Sunday shows the weekend "⏳ unsigned" badge instead (v20.65, by design). This test
     used to stamp the case on whatever day the suite happened to run, so on a Sunday it collided with the
     weekend badge and failed a sound build. It now always exercises a Mon-Fri day, whatever day it runs.
     seed() and run() are stringified and evaluated separately in the page, so the weekday-picker is
     duplicated inline in each rather than shared via an outer const (which the page never sees). */
  seed:()=>{
    const d=new Date();if(d.getDay()===0)d.setDate(d.getDate()-2);else if(d.getDay()===6)d.setDate(d.getDate()-1);
    const t=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'CYR',name:'VIRGO, MARIA CYRIL',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',dailyRate:700,dateHired:'2025-01-01'}]));
    const a={};a[t]={CYR:{status:'late',timeIn:'10:30',timeOut:'17:00',lateMinutes:210,source:'fingerprint'}};localStorage.setItem('hydroPro_attendance',JSON.stringify(a));},
  run:async()=>{
    const d=new Date();if(d.getDay()===0)d.setDate(d.getDate()-2);else if(d.getDay()===6)d.setDate(d.getDate()-1);
    const t=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const grab=async()=>{document.getElementById('hnxAttMx')&&document.getElementById('hnxAttMx').remove();window.hnxAttMatrix();await sleep(1200);
      const td=[...document.querySelectorAll('#hnxAttMxBody td')].find(t=>/10:30/.test(t.textContent||''));return td?{badge:(td.textContent||'').replace(/[\s\d:]+/g,' ').trim(),border:td.style.border}:'no cell';};
    const waiting=await grab();
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({[t+'|CYR']:{decision:'excuse',by:'Eyal',at:Date.now()}}));const excused=await grab();
    localStorage.setItem('hydroPro_late_approvals_v1',JSON.stringify({[t+'|CYR']:{decision:'deduct',lateMinutes:210,by:'Dr Amy',at:Date.now()}}));const deduct=await grab();
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
{ name:'the Rulebook passes on EVERY day of the week, not only the day the suite happens to run (v20.72)',
  run:async()=>{const orig=window.hnxLocalToday;const out={};const W=['Thu','Fri','Sat','Sun','Mon','Tue','Wed'];
    /* seven CONSECUTIVE days covering every weekday, all at or after the fixed fixtures' week
       (2026-09-10..16), so only calendar-dependence is under test, not a clock set to the past */
    for(let i=0;i<7;i++){const d=new Date('2026-09-17T00:00:00');d.setDate(d.getDate()+i);
      const y=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      window.hnxLocalToday=()=>y;
      let r=null;try{r=hnxRulebook({quiet:true});}catch(e){r={ok:false,results:[{ok:false,name:'THREW '+e.message}]};}
      out[W[i]]=r&&r.ok?'ok':((r&&r.results)||[]).filter(x=>!x.ok).map(x=>x.name);}
    window.hnxLocalToday=orig;return out;},
  expect:{Mon:'ok',Tue:'ok',Wed:'ok',Thu:'ok',Fri:'ok',Sat:'ok',Sun:'ok'} },
{ name:'a floored line (net 0, shortfall 312.50) reconciles with netGap 0 — the strip no longer false-alarms, and the QB journal balances via a shortfall debit line (v20.79)',
  seed:()=>{localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'approved',approvedAt:1,approvedBy:'eyal',totals:{},
    lines:[{empId:'F1',name:'FLOORED, ONE',dailyRate:658,daysWorked:5,basicPay:3200,grossPay:3200,grossEarnings:3200,sss:900,phic:800,hdmf:800,totalGovDed:2500,withholdingTax:1012.5,taxCompanyPaid:false,netPay:0,netShortfall:312.50,memoAdd:0,memoDed:0}]}]));},
  run:async()=>{const runs=JSON.parse(localStorage.getItem('hydroPro_payroll_runs'));const x=window.hnxPaySums(runs[0].lines);
    const html=window._hnxPayJeHtml('2026-09');
    const nums=(html.match(/₱[\d,]+\.\d{2}/g)||[]).map(s=>parseFloat(s.replace(/[₱,]/g,'')));
    const tot=nums.slice(-2); /* the TOTALS row's DEBIT then CREDIT, printed last */
    return {netGap:x.netGap,shortfall:x.shortfall,net:x.net,td:tot[0],tc:tot[1],hasShortfallRow:/Due from employee/.test(html)};},
  expect:{netGap:0,shortfall:312.5,net:0,td:3512.5,tc:3512.5,hasShortfallRow:true} },
{ name:'🏗 Fixed Assets: importing a lapsing schedule (Excel rows) registers every valid row as a New Asset — a title banner above the header does not break it, and a row missing cost is skipped (v20.80)',
  seed:()=>{localStorage.removeItem('hydroPro_asset_recon_v1');},
  run:async()=>{const rows=[
      [null,null,null,null,null,null,null,null,null,null,null,null,'LAPSING YEAR 2026'], /* banner row above the header, like the real file */
      ['MOTHER ACCOUNT','CATEGORY','DEPARTMENT','Equipment Per Lapsing','QUANTITY','ESTIMATED YEARS','Acquisition Date','END DATE','Recorded in Quickbook','VENDOR','COST','MONTHLY AMORTIZATION'],
      ['1025-003-002 Furniture & Fixtures - Office Machine and Equipment','Machinery and Equipment','Corporate','Epson Ecotank L6460 Ink Tank Printer','1','5','2026-01-19','2031-01-19','1025-003-005 FURNITURE & FIXTURES:Office Machine and Equipment','LAZADA.COM.PH','22361.33','372.69'],
      ['1025-007 VEHICLES','Vehicle','Management','2026 Chery Tiggo PRO PHEV','1','8','2026-02-02','2034-02-02','1013-001-001 ADVANCES','Caraso Motors Givatim Israel','3563104.36','37115.67'],
      ['1025-001-002 Machinery and Equipment - Construction','Machinery and Equipment','Construction','Scaffolding 1.7h','18','5','2026-08-20','2031-08-20','1016-300-003 INVENTORY','E.E Scaffolding','','444'], /* no COST — must be skipped */
      [null,null,null,null,null,null,null,null,null,null,null,null], /* blank row */
    ];
    const r=window.hnxArImportLapsingRows(rows);
    const s=JSON.parse(localStorage.getItem('hydroPro_asset_recon_v1'));
    const na=(s.newAssets||[]).slice().sort((a,b)=>b.price-a.price);
    return {added:r.added,skipped:r.skipped,count:na.length,
      vehicle:{desc:na[0].desc,price:na[0].price,qty:na[0].qty,years:na[0].lifeYears,uc:na[0].uc,acq:na[0].acq,supplier:na[0].supplier},
      printer:{desc:na[1].desc,price:na[1].price,type:na[1].type}};},
  expect:{added:2,skipped:1,count:2,'vehicle.desc':'2026 Chery Tiggo PRO PHEV','vehicle.price':3563104.36,'vehicle.qty':1,'vehicle.years':8,'vehicle.uc':'Management','vehicle.acq':'2026-02-02','vehicle.supplier':'Caraso Motors Givatim Israel','printer.desc':'Epson Ecotank L6460 Ink Tank Printer','printer.price':22361.33,'printer.type':'Machinery and Equipment'} },
{ name:'📍 Per-Greenhouse Schedule: a greenhouse outside today\'s rotation is a tappable dashed cell, not a dead one — marking it works and shows done, whatever weekday the suite runs on (v20.81)',
  run:async()=>{
    switchView('prod_recurring');await sleep(1500);
    const v=document.getElementById('view-prod_recurring');
    /* find any live "na" cell — not scheduled today for that GH, but now clickable — and read
       its taskId/gh straight out of the onclick it renders, so the test needs no assumption
       about which weekday it happens to run on */
    const naCell=[...v.querySelectorAll('.hnx-ghm-c.na[onclick]')][0];
    if(!naCell)return {found:false};
    const m=(naCell.getAttribute('onclick')||'').match(/hnxGhmCell\('([^']+)','([^']*)'\)/);
    const beforeCls=naCell.className;
    window._openRecurringCellModal(m[1],m[2]);await sleep(200);
    const btn=document.querySelector('.hnx-rm-sb.done');if(btn)window.hnxRmPickStatus(btn);
    if(typeof window.hnxRmSave==='function')window.hnxRmSave();
    await sleep(600);
    if(typeof renderRecurringHub==='function')renderRecurringHub();await sleep(600);
    const v2=document.getElementById('view-prod_recurring');
    const key=m[1]+"','"+m[2];
    const after=[...v2.querySelectorAll('.hnx-ghm-c[onclick]')].find(el=>(el.getAttribute('onclick')||'').indexOf(key)>=0);
    return {found:true,beforeCls,afterCls:after&&after.className,afterText:after&&(after.textContent||'').trim()};},
  expect:{found:true,beforeCls:'hnx-ghm-c na',afterCls:'hnx-ghm-c hit offsched done',afterText:'✓'} },
{ name:'📜 CEA Regulatory Register: a license with no expiration date (SEC/BIR Certificate of Registration) can be saved — it no longer requires an expiry (v20.82)',
  seed:()=>{localStorage.removeItem('hydroPro_cea_reg_v1');},
  run:async()=>{
    const form=document.createElement('div');form.style.display='none';
    form.innerHTML='<input id="ceaRgN"><select id="ceaRgCo"><option>APTI</option></select><select id="ceaRgAg"><option>Other</option></select>'
      +'<input id="ceaRgLic"><input id="ceaRgIs" type="date"><input id="ceaRgEx" type="date"><input id="ceaRgLd" type="number" value="90"><input id="ceaRgOw" value="tester">';
    document.body.appendChild(form);
    document.getElementById('ceaRgN').value='SEC — Certificate of Registration';
    document.getElementById('ceaRgEx').value=''; /* deliberately blank — the never-expires case */
    window.ceaRgSaveItem();
    form.remove();
    const reg=JSON.parse(localStorage.getItem('hydroPro_cea_reg_v1')||'[]');
    const it=reg.find(r=>r.name==='SEC — Certificate of Registration');
    return {saved:!!it,expiry:it&&it.expiry,status:it&&it.status};},
  expect:{saved:true,expiry:'',status:'Active'} },
{ name:'📜 CEA case: APPROVED is refused with no VERIFIED government check, accepted once one is logged, and the case is stamped with when — plus the linked register item\'s file-by-renewal date shows in the header (v20.83)',
  seed:()=>{localStorage.removeItem('hydroPro_cea_cases_v1');localStorage.removeItem('hydroPro_cea_gov_v1');localStorage.removeItem('hydroPro_cea_reg_v1');localStorage.removeItem('hydroPro_cea_docs_v1');
    localStorage.setItem('hydroPro_cea_reg_v1',JSON.stringify([{id:'RG1',name:'FPA Warehouse Registration',company:'APTI',agency:'FPA',expiry:'2026-12-01',leadDays:90,owner:'edelyn'}]));
    localStorage.setItem('hydroPro_cea_cases_v1',JSON.stringify([{id:'REG-RNW-TEST',kind:'renewal',company:'APTI',title:'FPA Warehouse Registration Renewal',owner:'Edelyn',status:'UNDER_REVIEW',priority:'med',due:'2026-10-01',nextAction:'',waitingOn:'',risk:'orange',riskReason:'',createdAt:1,createdBy:'test',archived:false,history:[],docs:[],tasks:[],approvals:[],gov:[],extra:{regItemId:'RG1'},updatedAt:1}]));},
  run:async()=>{
    switchView('cea_regulatory');await sleep(1200);
    const refused=CEA.advance('REG-RNW-TEST','APPROVED'); /* no VERIFIED check yet — must be refused */
    const afterRefusal=JSON.parse(localStorage.getItem('hydroPro_cea_cases_v1')||'[]').find(x=>x.id==='REG-RNW-TEST');
    /* drive it exactly as a user does: log a VERIFIED check, then flip status */
    const gv=JSON.parse(localStorage.getItem('hydroPro_cea_gov_v1')||'[]');
    gv.push({id:'GV1',caseId:'REG-RNW-TEST',method:'Email',agency:'FPA',refNo:'FPA-2026-4471',checkedAt:new Date().toISOString(),checkedBy:'tester',
      rawStatus:'Approved',normStatus:'APPROVED',confidence:'VERIFIED',evidenceDoc:'',nextCheck:'2026-11-01',note:''});
    localStorage.setItem('hydroPro_cea_gov_v1',JSON.stringify(gv));
    const accepted=CEA.advance('REG-RNW-TEST','APPROVED');
    const cases=JSON.parse(localStorage.getItem('hydroPro_cea_cases_v1')||'[]');
    const c=cases.find(x=>x.id==='REG-RNW-TEST');
    CEA.openCase('REG-RNW-TEST');await sleep(300);
    const drawerText=(document.getElementById('ceaDrawer')||{}).textContent||'';
    return {refused,statusAfterRefusal:afterRefusal&&afterRefusal.status,accepted,status:c&&c.status,stamped:!!(c&&c.approvedAt),applyByShown:/file the renewal by/.test(drawerText)};},
  expect:{refused:false,statusAfterRefusal:'UNDER_REVIEW',accepted:true,status:'APPROVED',stamped:true,applyByShown:true} },
{ name:'📜 CEA case: 🖊 Request Internal Sign-off never sets the government status, and says so — Edelyn pressed it 3x over 4 days expecting APPROVED, this stops the trap (v20.84)',
  seed:()=>{localStorage.removeItem('hydroPro_cea_cases_v1');localStorage.removeItem('hydroPro_cea_gov_v1');localStorage.removeItem('hydroPro_cea_appr_v1');localStorage.removeItem('hydroPro_cea_reg_v1');
    localStorage.setItem('hydroPro_cea_cases_v1',JSON.stringify([{id:'REG-RNW-T2',kind:'renewal',company:'APTI',title:'FPA Warehouse Registration Renewal',owner:'Edelyn',status:'UNDER_REVIEW',priority:'med',due:'2026-10-01',nextAction:'',waitingOn:'',risk:'orange',riskReason:'',createdAt:1,createdBy:'test',archived:false,history:[],docs:[],tasks:[],approvals:[],gov:[],extra:{},updatedAt:1}]));},
  run:async()=>{
    switchView('cea_regulatory');await sleep(1200);
    CEA.openCase('REG-RNW-T2');await sleep(300);
    const drawerBefore=(document.getElementById('ceaDrawer')||{}).textContent||'';
    const btn=[...document.querySelectorAll('#ceaDrawer button')].find(b=>/Request Internal Sign-off/.test(b.textContent||''));
    CEA.reqApproval('REG-RNW-T2','Case approval',0);await sleep(300);
    const c=JSON.parse(localStorage.getItem('hydroPro_cea_cases_v1')||'[]').find(x=>x.id==='REG-RNW-T2');
    return {buttonExists:!!btn,statusUnchanged:c&&c.status==='UNDER_REVIEW',hintShownBeforeClick:/Log Government Check above first/.test(drawerBefore),historyMentionsSignOff:c&&c.history.some(h=>/Internal sign-off requested/.test(h.ev))};},
  expect:{buttonExists:true,statusUnchanged:true,hintShownBeforeClick:true,historyMentionsSignOff:true} },
{ name:'🤝 CRM: a customer\'s 📎 Files tab lists/uploads/downloads/deletes through the cloud file API, scoped to that customer only, never localStorage — and each file keeps a name + notes (date/uploader come from the file itself) that can be edited later (v20.85/v20.87)',
  seed:()=>{localStorage.setItem('hydroPro_crm_leads',JSON.stringify([{id:'LEAD1',name:'Test Buyer',company:'Test Co',stage:'won',createdAt:new Date().toISOString()}]));
    localStorage.removeItem('hydroPro_crm_file_meta_v1');},
  run:async()=>{
    const calls=[];
    window.__hnxApi=(path,opts)=>{
      calls.push({path,method:(opts&&opts.method)||'GET'});
      if(/\/r2\/list/.test(path)){
        const uploaded=calls.some(c=>/\/r2\/upload/.test(c.path));
        return Promise.resolve({files:uploaded?[{key:'crm/LEAD1/site-visit.mp4',size:2500000,contentType:'video/mp4',uploaded:new Date().toISOString()}]:[]});
      }
      if(/\/r2\/upload/.test(path))return Promise.resolve({ok:true});
      if(/\/r2\/delete/.test(path))return Promise.resolve({ok:true});
      return Promise.resolve({});
    };
    window.prompt=(msg)=>/Name this file/.test(msg)?'EVIA site visit':(/Description/.test(msg)?'Walkthrough with the buyer, Sept 18':'');
    _crmSelLead='LEAD1';_crmDetailTab='files';renderCRM();await sleep(400);
    const before={files:_crmFilesState.files.length,hasUploadBtn:!!document.querySelector('label input#crmFilesInput')};
    const fakeFile=new File(['x'.repeat(100)],'site-visit.mp4',{type:'video/mp4'});
    const fakeInput={files:[fakeFile],value:''};
    window.crmFilesUpload(fakeInput);await sleep(400);
    const uploadCall=calls.find(c=>/\/r2\/upload/.test(c.path));
    const meta1=JSON.parse(localStorage.getItem('hydroPro_crm_file_meta_v1')||'{}')['crm/LEAD1/site-visit.mp4'];
    const html1=document.getElementById('crmFilesBody').innerHTML;
    /* edit the name + notes after the fact */
    window.prompt=(msg)=>/Name for this file/.test(msg)?'EVIA site visit (final)':(/Description/.test(msg)?'Updated: signed the PO on this visit':'');
    window.crmFilesEditMeta('crm/LEAD1/site-visit.mp4');await sleep(200);
    const meta2=JSON.parse(localStorage.getItem('hydroPro_crm_file_meta_v1')||'{}')['crm/LEAD1/site-visit.mp4'];
    const html2=document.getElementById('crmFilesBody').innerHTML;
    return {before,uploadKeyScoped:uploadCall&&/key=crm%2FLEAD1%2Fsite-visit\.mp4/.test(uploadCall.path),
      filesAfter:_crmFilesState.files.length,fileName:_crmFilesState.files[0]&&_crmFilesState.files[0].key,
      meta1Name:meta1&&meta1.name,meta1Notes:meta1&&meta1.notes,
      shownName1:/EVIA site visit</.test(html1),shownNotes1:/Walkthrough with the buyer/.test(html1),
      meta2Name:meta2&&meta2.name,meta2Notes:meta2&&meta2.notes,
      shownName2:/EVIA site visit \(final\)/.test(html2),shownNotes2:/signed the PO/.test(html2)};},
  expect:{'before.files':0,'before.hasUploadBtn':true,uploadKeyScoped:true,filesAfter:1,fileName:'crm/LEAD1/site-visit.mp4',
    meta1Name:'EVIA site visit',meta1Notes:'Walkthrough with the buyer, Sept 18',shownName1:true,shownNotes1:true,
    meta2Name:'EVIA site visit (final)',meta2Notes:'Updated: signed the PO on this visit',shownName2:true,shownNotes2:true} },
{ name:'📚 Sales Documents: a file over 1.5MB (the presentation video case) goes to cloud storage instead of being refused, and shows a ☁ badge; a small file still stays local as before (v20.86)',
  seed:()=>{localStorage.removeItem('hydroPro_crm_sales_docs_v1');},
  run:async()=>{
    const uploadCalls=[];
    window.__hnxApi=(path,opts)=>{
      if(/\/r2\/upload/.test(path))uploadCalls.push(path);
      if(/\/r2\/upload/.test(path))return Promise.resolve({ok:true});
      if(/\/r2\/delete/.test(path))return Promise.resolve({ok:true});
      return Promise.resolve({});
    };
    window.prompt=(msg)=>/Name this/.test(msg)?'Company Presentation':(/kind of document/.test(msg)?'4':'');
    const bigFile=new File([new Uint8Array(2*1024*1024)],'presentation.mp4',{type:'video/mp4'});
    const smallFile=new File(['tiny'],'flyer.pdf',{type:'application/pdf'});
    /* drive the exact cloud-fallback path hnxSdUpload calls once a file exceeds SD_MAX */
    window.sdUploadCloud(bigFile,'Company Presentation','Product video');
    await sleep(300);
    /* small file still goes through the legacy local FileReader path */
    const r=new FileReader();
    const smallDone=new Promise(res=>{r.onload=()=>{
      const all=JSON.parse(localStorage.getItem('hydroPro_crm_sales_docs_v1')||'[]');
      all.push({id:'sd_small',name:'Flyer',kind:'Brochure / flyer',file:smallFile.name,type:smallFile.type,size:smallFile.size,data:r.result,by:'tester',at:new Date().toISOString()});
      localStorage.setItem('hydroPro_crm_sales_docs_v1',JSON.stringify(all));res();
    };r.readAsDataURL(smallFile);});
    await smallDone;
    const all2=JSON.parse(localStorage.getItem('hydroPro_crm_sales_docs_v1')||'[]');
    const big=all2.find(d=>d.name==='Company Presentation'),small=all2.find(d=>d.name==='Flyer');
    const html=window.hnxSdLibraryHTML();
    return {uploaded:uploadCalls.length===1,bigHasCloudKey:!!(big&&big.cloudKey&&/documents\/sales_pack\//.test(big.cloudKey)),bigHasNoData:!(big&&big.data),
      smallHasData:!!(small&&small.data),smallHasNoCloudKey:!(small&&small.cloudKey),badgeShown:/☁/.test(html)};},
  expect:{uploaded:true,bigHasCloudKey:true,bigHasNoData:true,smallHasData:true,smallHasNoCloudKey:true,badgeShown:true} },
{ name:'📍 GPS Daily Report: _gpsOdoGap flags the real Sept-16 case (108 odo vs 151.90 GPS, +40.6%) as danger, and a normal row (188 vs 210.40, +11.9%) as ok (v20.88)',
  run:async()=>{
    const real=window._gpsOdoGap(108,151.90);
    const normal=window._gpsOdoGap(188,210.40);
    const watch=window._gpsOdoGap(100,118); /* +18% — amber band */
    const noOdo=window._gpsOdoGap(null,80);
    return {real,normal,watch,noOdo};},
  expect:{'real.gapKm':43.9,'real.gapPct':40.6,'real.flag':'danger','normal.gapKm':22.4,'normal.gapPct':11.9,'normal.flag':'ok','watch.flag':'warn',noOdo:null} },
{ name:'📍 GPS Daily Report: the on-screen "GPS vs Odometer" tile shows the flagged gap for a real vehicle/day (v20.88)',
  seed:()=>{localStorage.setItem('hydroPro_fleet_vehicles',JSON.stringify([{id:'V1',name:'ISUZU TRAVIZ',plate:'NEQ 4101'}]));
    localStorage.setItem('hydroPro_gps_reports',JSON.stringify({'2026-09-16::V1':{vehicleId:'V1',date:'2026-09-16',odoOut:119740,odoIn:119848,kmMode:'odometer',
      stops:[{location:'Base',timeIn:'16:01',timeOut:'16:01',km:119740},{location:'Drop',timeIn:'16:23',timeOut:'16:23',km:119891.90}],
      fillUpLiters:null,perLiter:null,dashCam:'WORKING',generalNote:''}}));},
  run:async()=>{
    switchView('fleet_gps');await sleep(300);
    hnxGpsSel('2026-09-16','V1');await sleep(300);
    const el=document.getElementById('gpsOdoGap');
    return {text:el&&el.textContent.trim(),color:el&&el.style.color,warned:/too big to be normal GPS drift/.test(document.getElementById('view-fleet_gps').innerHTML)};},
  expect:{text:'+43.90 km (+40.6%)',warned:true} },
{ name:'📡 Admin → Users → ערוצי תקשורת: a channel cannot be switched on without consent, needs a value, and clearing the value auto-disables it (v20.89)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'jinky',fullname:'JINKY',passwordHash:'x',role:'accounting',active:true}]));},
  run:async()=>{
    const users0=()=>JSON.parse(localStorage.getItem('hydroPro_users'));
    window._toggleUserChannel('jinky','email',true); /* no consent yet — must be refused */
    const noConsent=users0().find(u=>u.username==='jinky').channels;
    window._toggleUserChannelConsent('jinky',true);
    const consented=users0().find(u=>u.username==='jinky').channels.consent.signed;
    window._toggleUserChannel('jinky','email',true); /* consented but no value — must still be refused */
    const noValue=users0().find(u=>u.username==='jinky').channels.email.on;
    window._setUserChannelValue('jinky','email','jinky@abapardes.com.ph');
    window._toggleUserChannel('jinky','email',true); /* consented + value — must succeed */
    const onWithValue=users0().find(u=>u.username==='jinky').channels.email;
    window._setUserChannelValue('jinky','email',''); /* clearing the value must auto-disable */
    const afterClear=users0().find(u=>u.username==='jinky').channels.email;
    return {noConsentOn:!!(noConsent&&noConsent.email&&noConsent.email.on),consented,noValueOn:noValue,
      onWithValue:{on:onWithValue.on,value:onWithValue.value},afterClear:{on:afterClear.on,value:afterClear.value}};},
  expect:{noConsentOn:false,consented:true,noValueOn:false,'onWithValue.on':true,'onWithValue.value':'jinky@abapardes.com.ph','afterClear.on':false,'afterClear.value':''} },
{ name:'🌙 Dashboard: the Night Auditor banner stays silent unconfigured, offers admin a setup link, and shows the real GPS-gap finding once a worker URL answers (v20.90)',
  run:async()=>{
    localStorage.removeItem('hydroPro_night_audit_cfg');
    switchView('dashboard');await sleep(600);
    const unconfigured=(document.getElementById('dbNightAudit')||{}).innerHTML||'';
    localStorage.setItem('hydroPro_night_audit_cfg',JSON.stringify({workerUrl:'https://fake-night-audit.example'}));
    const realFetch=window.fetch;
    window.fetch=function(url){
      if(String(url).indexOf('/audit/latest')>=0){
        return Promise.resolve({json:()=>Promise.resolve({date:'2026-09-16',findings:[
          {rule:'gps_odo_gap',severity:'danger',entity:'V1',date:'2026-09-16',detail:'GPS +43.9 km (+40.6%) vs odometer'}
        ]})});
      }
      return realFetch(url);
    };
    _renderDbNightAudit();await sleep(300);
    const withFindings=document.getElementById('dbNightAudit').innerHTML;
    window.fetch=realFetch;
    localStorage.removeItem('hydroPro_night_audit_cfg');
    _renderDbNightAudit();
    return {unconfiguredHasLink:/הגדר את כתובת/.test(unconfigured),
      findingsShown:/V1/.test(withFindings)&&/40\.6%/.test(withFindings)&&/🔴/.test(withFindings)};},
  expect:{unconfiguredHasLink:true,findingsShown:true} },
];
