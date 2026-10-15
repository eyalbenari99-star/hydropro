/* v23.46 (Eyal, 15 Oct 2026: "Jomel HR employee records should be the incentive on Sep 30 but its not reflect in payrolls cut off now
   also we need to have the incentive or penalty me and dr amy approval after Jinky will add to his employee card also Jomel incentive
   actually 2000 monthly depend on his full atendees if no 1 absent he get auto 2000 peso after the end of the month next payroll
   cutoff (each 10 of the month)").
   An incentive / penalty row on the HR card (🏅 attendance incentive perfectMonth, incentive / bonus purpose, a one-time incentive,
   a "1-Time Incentive" + Allowance entry) is created {approval:pending} and pays ₱0 until ① Jinky → ② Dr Amy / Eyal (override allowed,
   nobody approves their own row); the ₱2,000 perfect-month rule itself is v21.23, unchanged. Rows saved before v23.46 (no approval
   field) pay as before. Fixture: office JOMEL ₱16,000, cut-off 26 Sep – 10 Oct 2026 (closes September; payday the 10th), no
   attendance records (office: no record = paid), Manila dates; the chain people of memoUsers (Jinky adds, Dr Amy / Eyal approve). */
const REQ="typeof window.hnxIncCan==='function'&&typeof window.hnxIncStampRows==='function'&&typeof window.hnxIncRunBanner==='function'";
const SEED=function(){
  ['hydroPro_payroll_runs','hydroPro_onetime_allow_v1','hydroPro_pa_inbox_v1'].forEach(k=>localStorage.setItem(k,'[]'));
  ['hydroPro_ph_holidays','hydroPro_employee_allowances_v1','hydroPro_attendance'].forEach(k=>localStorage.setItem(k,'{}'));
};
const HELP=`
  memoUsers();
  window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>'not this month';
  const PS='2026-09-26',PE='2026-10-10';
  const JO=o=>Object.assign({id:'J1',name:'JOMEL, TEST',status:'Active',salaryCategory:'accounting',dept:'Logistics',payType:'semi',employmentType:'Regular',monthlyBasic:16000,rate:727.27,dateHired:'2025-01-01',hireDate:'2025-01-01'},o||{});
  const emp=()=>(JSON.parse(localStorage.getItem('hydroPro_employees')||'[]')).find(e=>e&&e.id==='J1');
  const reset=o=>{setE([JO(o)]);loadEmployees();};
  const addRow=(by,row)=>{actAs(by);const E=JSON.parse(localStorage.getItem('hydroPro_employees')||'[]');const e=E.find(x=>x.id==='J1');const old=e.allowances||[];
    e.allowances=hnxIncStampRows(old,old.concat([row||{type:'attendance',perfectMonth:2000,taxable:false}]));e.updatedAt=Date.now();setE(E);loadEmployees();hnxIncNotifyRows('J1',old,e.allowances);actAsTester();return e.allowances[e.allowances.length-1];};
  const ref=aid=>({kind:'card',empId:'J1',aid});
  const run=()=>{const l=calcEmployeePayroll(emp(),PS,PE,'semi_monthly');const inc=(l.allowanceList||[]).find(x=>x&&x.incentive);return {allow:l.recurringAllowance,basic:l.basicPay,note:(inc&&inc.note)||'',waiting:!!(inc&&inc.waiting),paid:!!(inc&&inc.paid),inc:inc?inc.incentive:0,net:l.netPay,one:(l.onetimeList||[]).map(o=>[o.amount,!!o.waiting,o.full||0])};};
  const dec=(who,r,step,opts)=>{actAs(who);const x=hnxIncDecide(r,step,Object.assign({noConfirm:true,noRender:true,silent:true},opts||{}))||{};actAsTester();return {ok:!!x.ok,why:x.why||'',covered:!!x.covered};};
  const apOf=aid=>hnxIncApprovalOf((emp().allowances||[]).find(a=>a&&a.aid===aid));
  const stage=aid=>hnxIncStage(apOf(aid));
  const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
  const WAIT=/⏳ waiting for approval \\(① Jinky → ② Dr Amy \\/ Eyal\\)/;
`;
const R=fn=>eval('(async()=>{'+HELP+'\nreturn ('+fn.toString()+')();})');

module.exports=[
{ name:'(a) Office JOMEL ₱16,000 + 🏅 attendance incentive ₱2,000 added by Jinky (her adding = ①, stage final): run 26 Sep – 10 Oct 2026 pays basic 8,000.00 and allowance ₱0 with "⏳ waiting for approval (① Jinky → ② Dr Amy / Eyal)"; Jinky cannot give ② (not a final approver), Mea cannot; Dr Amy ② → allowance 2,000.00 "September 2026: no missing day — paid in full", net +2,000; Dr Amy and Eyal got the inbox note when the row was added, Jinky the ✅ note when it was approved',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();
    const r=addRow('jinky');const st0=stage(r.aid),a=run();
    const own=dec('jinky',ref(r.aid),'final'),mea=dec('mea',ref(r.aid),'final');
    const notes0=inbox().filter(x=>x.id.indexOf('INC_card:J1:'+r.aid+'_final_')===0).map(x=>x.user).sort();
    const ok=dec('dramy',ref(r.aid),'final');const b=run(),ap=apOf(r.aid);
    const noteJ=inbox().find(x=>x.id==='INC_card:J1:'+r.aid+'_approved_jinky');
    return {st0,a0:a.allow,basic:a.basic,note0:WAIT.test(a.note),waiting0:a.waiting,own:{ok:own.ok,why:/FINAL approval of Dr Amy or Eyal/.test(own.why)},mea:{ok:mea.ok,why:/FINAL approval of Dr Amy or Eyal/.test(mea.why)},notes0,ok:ok.ok,
      st1:stage(r.aid),a1:b.allow,note1:b.note,paid1:b.paid,netDiff:Math.round((b.net-a.net)*100)/100,acct:{by:ap.acct.by,self:!!ap.acct.self},final:ap.final.by,noteJ:!!noteJ&&/✅ Incentive approved/.test(noteJ.title)};}),
  expect:{st0:'final',a0:0,basic:8000,note0:true,waiting0:true,own:{ok:false,why:true},mea:{ok:false,why:true},notes0:['dramy','eyal'],ok:true,st1:'approved',a1:2000,note1:'September 2026: no missing day — paid in full',paid1:true,netDiff:2000,acct:{by:'jinky',self:true},final:'dramy',noteJ:true} },

{ name:'(b) The same with one unauthorised absence on 15 Sep: before ② allowance ₱0 "⏳ waiting"; after Dr Amy’s ② still ₱0 — "September 2026: 1 missing day — not paid" (the v21.23 absence test and its note are unchanged; an office manual absence is counted, not dated, by the v20.64 trace); the 11–25 Sep cut-off (no month closes) shows it pending',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();setA({'2026-09-15':{J1:{status:'absent',source:'manual',editedBy:'hr'}}});
    const r=addRow('jinky');const a=run();dec('dramy',ref(r.aid),'final');const b=run();
    const m=calcEmployeePayroll(emp(),'2026-09-11','2026-09-25','semi_monthly');const im=(m.allowanceList||[]).find(x=>x&&x.incentive)||{};
    return {a0:a.allow,w0:WAIT.test(a.note),st:stage(r.aid),a1:b.allow,paid1:b.paid,note1:b.note,mid:m.recurringAllowance,midPending:!!im.pending};}),
  expect:{a0:0,w0:true,st:'approved',a1:0,paid1:false,note1:'September 2026: 1 missing day — not paid',mid:0,midPending:true} },

{ name:'(c) Added by Mea (stage ①): Mea cannot check (① is Jinky’s), Dr Amy’s ② is refused for Mea’s ① no — Jinky ✔ ① (stage final) then Eyal ✅ ② pays 2,000.00; a second row added by Mea: Eyal’s ② BEFORE ① is an override — ① "covered by Eyal’s final", approved, pays; Jinky’s later ✔ makes ① her own check, still approved',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();
    const r=addRow('mea');const st0=stage(r.aid);const meaA=dec('mea',ref(r.aid),'acct');const jin=dec('jinky',ref(r.aid),'acct');const st1=stage(r.aid);const eyal=dec('eyal',ref(r.aid),'final');const a=run();
    const notesFinal=inbox().filter(x=>x.id.indexOf('INC_card:J1:'+r.aid+'_final_')===0).map(x=>x.user).sort();
    reset();const r2=addRow('mea');const canE=hnxIncCan(apOf(r2.aid),memoUsers().find(x=>x.username==='eyal'),'final');
    const ov=dec('eyal',ref(r2.aid),'final');const ap2=apOf(r2.aid);const b=run();const lbl=hnxIncLabel(ap2);
    const late=dec('jinky',ref(r2.aid),'acct');const ap3=apOf(r2.aid);
    return {st0,meaA:{ok:meaA.ok,why:/accountant’s check \(Jinky\)/.test(meaA.why)},jin:jin.ok,st1,eyal:eyal.ok,a:a.allow,notesFinal,canE:{ok:!!canE.ok,covered:canE.covered||null},ov:{ok:ov.ok,covered:ov.covered},acct2:{by:ap2.acct.by,covered:ap2.acct.covered||null},st2:hnxIncStage(ap2),b:b.allow,lbl:/① covered by Eyal’s final/.test(lbl),late:late.ok,acct3:{by:ap3.acct.by,covered:ap3.acct.covered||null},st3:hnxIncStage(ap3),fin3:ap3.final.by};}),
  expect:{st0:'acct',meaA:{ok:false,why:true},jin:true,st1:'final',eyal:true,a:2000,notesFinal:['dramy','eyal'],canE:{ok:true,covered:'final'},ov:{ok:true,covered:true},acct2:{by:'eyal',covered:'final'},st2:'approved',b:2000,lbl:true,late:true,acct3:{by:'jinky',covered:null},st3:'approved',fin3:'eyal'} },

{ name:'(d) Nobody approves a row they added: Eyal’s row → Eyal’s ② refused ("You added this row — Dr Amy gives ②"), Dr Amy’s ② (override) approves it; Dr Amy’s row → her ② refused, Jinky ✔ ①, Dr Amy still refused, Eyal ✅ ②; Jinky’s row → her ✔ ① is not offered (her adding is ①); ✖ Reject by Dr Amy with a reason leaves Mea’s row unpaid (status rejected, "✖ rejected — not paid")',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();
    const r=addRow('eyal');const e1=dec('eyal',ref(r.aid),'final');const a1=dec('dramy',ref(r.aid),'final');const s1=stage(r.aid);
    reset();const r2=addRow('dramy');const a2=dec('dramy',ref(r2.aid),'final');const j2=dec('jinky',ref(r2.aid),'acct');const a3=dec('dramy',ref(r2.aid),'final');const e2=dec('eyal',ref(r2.aid),'final');const s2=stage(r2.aid);
    reset();const r3=addRow('jinky');const j3=dec('jinky',ref(r3.aid),'acct');
    reset();const r4=addRow('mea');const rj=dec('dramy',ref(r4.aid),'reject',{reason:'not this month'});const ap4=apOf(r4.aid);const x=run();const again=dec('eyal',ref(r4.aid),'final');
    return {e1:{ok:e1.ok,why:/You added this row — Dr Amy gives ②/.test(e1.why)},a1:a1.ok,s1,a2:{ok:a2.ok,why:/You added this row — Eyal gives ②/.test(a2.why)},j2:j2.ok,a3:a3.ok,e2:e2.ok,s2,j3:{ok:j3.ok,why:/already done by Jinky/.test(j3.why)},
      rj:rj.ok,st4:hnxIncStage(ap4),reason:ap4.rejected.reason,x:x.allow,xnote:/✖ rejected by Dr Amy Patdu — not paid/.test(x.note),again:{ok:again.ok,why:/rejected/.test(again.why)},noteMea:!!inbox().find(n=>n.id==='INC_card:J1:'+r4.aid+'_rejected_mea')};}),
  expect:{e1:{ok:false,why:true},a1:true,s1:'approved',a2:{ok:false,why:true},j2:true,a3:false,e2:true,s2:'approved',j3:{ok:false,why:true},rj:true,st4:'rejected',reason:'not this month',x:0,xnote:true,again:{ok:false,why:true},noteMea:true} },

{ name:'(e) A one-time ₱500 incentive dated 30 Sep added in 💰 Allowances (kind 🏅 Incentive / bonus, by the tester = Eyal’s side) follows the same gate: the run lists it ⏳ ₱0 (full 500); Eyal’s ② refused (his side added it), Jinky ✔ ① then Dr Amy ✅ ② → 500.00 paid in 26 Sep – 10 Oct; an expense return added the same way pays at once (no approval)',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();
    hnxAllowMan('J1');await sleep(300);
    document.getElementById('hnxAM_okind').value='incentive';document.getElementById('hnxAM_olabel').value='Perfect attendance September';document.getElementById('hnxAM_odate').value='2026-09-30';document.getElementById('hnxAM_oamt').value='500';
    hnxAllowOneAdd('J1');await sleep(200);
    const o=JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1'))[0];const a=run();
    const badge=/⏳ waiting for approval/.test((document.getElementById('hnxAllowMan')||{}).textContent||'');
    const e=dec('eyal',{kind:'onetime',id:o.id},'final');const j=dec('jinky',{kind:'onetime',id:o.id},'acct');const d=dec('dramy',{kind:'onetime',id:o.id},'final');const b=run();
    document.getElementById('hnxAM_okind').value='expense';document.getElementById('hnxAM_olabel').value='Fare reimbursement';document.getElementById('hnxAM_odate').value='2026-10-01';document.getElementById('hnxAM_oamt').value='120';
    hnxAllowOneAdd('J1');await sleep(200);const c=run();const o2=JSON.parse(localStorage.getItem('hydroPro_onetime_allow_v1'))[1];
    try{document.getElementById('hnxAllowMan').remove();}catch(x){}
    return {kind:o.kind,st:hnxIncStage(o.approval),a:a.allow,one:a.one,badge,e:{ok:e.ok,why:/② is given by Dr Amy/.test(e.why)},j:j.ok,d:d.ok,b:b.allow,bone:b.one,noApproval:!o2.approval,c:c.allow};}),
  expect:{kind:'incentive',st:'acct',a:0,one:[[0,true,500]],badge:true,e:{ok:false,why:true},j:true,d:true,b:500,bone:[[500,false,0]],noApproval:true,c:620} },

{ name:'(f) A row saved before v23.46 (no approval field, no id) pays as before: ₱2,000 "paid in full" at once, no badge, and a card save that leaves it unchanged adds no approval; the attendance-incentive rulebook fixture (meal ₱2,000 + incentive, 16–31 Aug) still pays 1,000 + 2,000 = 3,000',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset({allowances:[{type:'other',perfectMonth:2000,taxable:false}]});
    const a=run();const kept=hnxIncStampRows(emp().allowances,emp().allowances.map(x=>Object.assign({},x)));
    const lbl=hnxIncBadgeHTML({kind:'card',empId:'J1',aid:''},emp().allowances[0],'hr');
    setE([{id:'J1',name:'JOMEL, TEST',status:'Active',salaryCategory:'accounting',dept:'Logistics',payType:'semi',employmentType:'Regular',monthlyBasic:22000,dailyRate:1000,dateHired:'2025-01-01',hireDate:'2025-01-01',allowances:[{type:'meal',monthly:2000,taxable:false},{type:'other',perfectMonth:2000,taxable:false}]}]);loadEmployees();
    const b=calcEmployeePayroll(emp(),'2026-08-16','2026-08-31','semi');
    return {a:a.allow,paid:a.paid,note:a.note,noApproval:!kept[0].approval&&!kept[0].aid,legacyLbl:/saved before v23.46/.test(lbl),aug:b.recurringAllowance};}),
  expect:{a:2000,paid:true,note:'September 2026: no missing day — paid in full',noApproval:true,legacyLbl:true,aug:3000} },

{ name:'(g) The office run 26 Sep – 10 Oct generated BEFORE ② stores the line at allowance ₱0 ⏳ and the banner names Jomel "waiting for approval"; after Dr Amy’s ② the stored line still says ₱0 and the banner reads "approved after this run was generated … press 🔄 Recalculate"; 🔄 Recalculate → 2,000.00 "paid in full" and the banner clears; the 🧾 breakdown and the Allowances tile carry the ⏳ note while waiting',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();setA({'2026-09-28':{J1:rec('present','07:00','17:00')}});const r=addRow('jinky'); /* the payroll filter lists an office person only with a record in the cut-off (v20.99) */
    switchView('payroll_office');await sleep(2500);
    const P={start:PS,end:PE,half:'second',label:'26 Sep — 10 Oct'};window._payOfficeCurrentPeriod=P;renderPayrollOffice();await sleep(300);
    const rid=payOfficeRunId(P);const line=()=>((getPayrollRun(rid)||{}).lines||[]).find(l=>l.empId==='J1')||{};
    const l0=line();const run0=getPayrollRun(rid);const ban0=hnxAllowStaleBanner(run0.lines,run0);
    const cell=/⏳ incentive/.test((document.getElementById('view-payroll_office')||{}).innerHTML||'');
    openPayrollLine(rid,'J1','semi_monthly');await sleep(200);const bd=(document.getElementById('payrollLineModal')||document.body).textContent||'';const bdOk=/🏅 attendance incentive ₱2,000\.00 a month — ⏳ waiting for approval/.test(bd);
    try{document.getElementById('payrollLineModal').classList.remove('open');}catch(e){}
    let tile='';try{window._drillPayroll('office','allowance');await sleep(300);tile=document.body.textContent;}catch(e){}
    const tileOk=/attendance incentive ⏳ — ⏳ waiting for approval/.test(tile);
    dec('dramy',ref(r.aid),'final');
    const l1=line();const run1=getPayrollRun(rid);const ban1=hnxAllowStaleBanner(run1.lines,run1);
    window._payOfficeCurrentPeriod=P;payOfficeRecalc();await sleep(300);
    const l2=line();const run2=getPayrollRun(rid);const ban2=hnxAllowStaleBanner(run2.lines,run2);
    return {a0:l0.recurringAllowance,w0:!!(l0.allowanceList||[]).find(x=>x.waiting),ban0:/⏳.*waiting for approval.*JOMEL, TEST \(attendance incentive ₱2,000\.00\)/.test(ban0),cell,bdOk,tileOk,
      a1:l1.recurringAllowance,ban1:/approved after this run was generated.*JOMEL, TEST \(attendance incentive ₱2,000\.00\).*🔄 Recalculate/.test(ban1),a2:l2.recurringAllowance,note2:((l2.allowanceList||[]).find(x=>x.incentive)||{}).note,ban2};}),
  expect:{a0:0,w0:true,ban0:true,cell:true,bdOk:true,tileOk:true,a1:0,ban1:true,a2:2000,note2:'September 2026: no missing day — paid in full',ban2:''} },

{ name:'(h) The HR card itself (Eyal: "its not reflect in payrolls"): 🏅 Attendance incentive added on the employee card and 💾 Save Employee keeps the row (it used to be dropped) — the row reads "₱2,000.00 a month — paid in the cut-off that closes the month when the month has no missing day" and "⏳ after 💾 Save it waits for ① Jinky → ② Dr Amy / Eyal"; saved: perfectMonth 2000 with approval pending by the tester, the run pays ₱0 ⏳; reopening the card shows the ⏳ badge with ✅ FINAL now (override) for Dr Amy (the tester, Eyal’s side, added it; Jinky has not checked) and ✖ Reject, and for Jinky ✔ Check ① but no FINAL button',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();
    openEmployeeModal('J1');await sleep(400);window._empAllowAddIncentive();await sleep(100);
    const t0=(document.getElementById('empAllowList')||{}).textContent||'';
    saveEmployee();await sleep(400);
    const e=emp();const row=(e.allowances||[])[0]||{};const a=run();
    actAs('dramy');openEmployeeModal('J1');await sleep(400);const h1=(document.getElementById('empAllowList')||{}).innerHTML||'';
    try{const U=JSON.parse(localStorage.getItem('hydroPro_users'));U.forEach(u=>{if(u&&u.username==='jinky'){u.role='admin_secondary';u.department='accounting';}});localStorage.setItem('hydroPro_users',JSON.stringify(U));}catch(e){} /* Jinky's real account is admin_secondary (wk-approvals fixture) — the HR card opens for manageHR */
    actAs('jinky');openEmployeeModal('J1');await sleep(400);const h2=(document.getElementById('empAllowList')||{}).innerHTML||'';actAsTester();
    try{document.getElementById('empModal').classList.remove('open');}catch(x){}
    return {desc:/₱2,000\.00 a month — paid in the cut-off that closes the month when the month has no missing day/.test(t0),pre:/⏳ after 💾 Save it waits for ① Jinky → ② Dr Amy \/ Eyal/.test(t0),
      kept:row.perfectMonth,type:row.type,aid:!!row.aid,st:hnxIncStage(row.approval),by:(row.approval||{}).by,a:a.allow,w:a.waiting,
      amy:{badge:/⏳ waiting for approval/.test(h1),approve:/data-act="final"[^>]*>✅ FINAL now \(override\)/.test(h1),reject:/data-act="reject"/.test(h1)},jinky:{badge:/⏳ waiting for approval/.test(h2),acct:/data-act="acct"[^>]*>✔ Check ①/.test(h2),final:/data-act="final"/.test(h2)}};}),
  expect:{desc:true,pre:true,kept:2000,type:'attendance',aid:true,st:'acct',by:'tester',a:0,w:true,amy:{badge:true,approve:true,reject:true},jinky:{badge:true,acct:true,final:false}} },

{ name:'(i) 💰 Allowances dialog: a row "attendance incentive / per MONTH if no missing day / 2000" saved by Jinky is stamped (aid, ① by her adding), the reopened dialog shows "⏳ waiting for approval" and, for Eyal, ✅ Approve ②; saving the dialog again unchanged keeps the approval; Eyal’s ② from the dialog button pays 2,000.00',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();
    actAs('jinky');hnxAllowMan('J1');await sleep(300);hnxAllowAddRow();
    const rows=document.querySelectorAll('#hnxAllowMan .hnxAllowRow');const nr=rows[rows.length-1];nr.querySelector('.alType').value='attendance incentive';nr.querySelector('.alMode').value='perfect';nr.querySelector('.alAmt').value='2000';
    hnxAllowSave('J1');await sleep(200);actAsTester();
    const r=emp().allowances[0];const st0=hnxIncStage(r.approval);const a=run();
    actAs('eyal');hnxAllowMan('J1');await sleep(300);const h=(document.getElementById('hnxAllowMan')||{}).innerHTML||'';
    hnxAllowSave('J1');await sleep(200);const r1=emp().allowances[0];
    hnxAllowMan('J1');await sleep(300);const b=document.querySelector('#hnxAllowMan .hnxIncBtn[data-act="final"]');if(b)b.click();await sleep(300);actAsTester();
    try{document.getElementById('hnxAllowMan').remove();}catch(x){}
    const r2=emp().allowances[0];const c=run();
    return {pm:r.perfectMonth,type:r.type,aid:!!r.aid,st0,by:r.approval.by,acctSelf:!!(r.approval.acct&&r.approval.acct.self),a:a.allow,badge:/⏳ waiting for approval/.test(h),approveBtn:/data-act="final"[^>]*>✅ Approve ②/.test(h),sameAid:r1.aid===r.aid,kept:hnxIncStage(r1.approval),st2:hnxIncStage(r2.approval),fin:(r2.final||r2.approval.final||{}).by,c:c.allow};}),
  expect:{pm:2000,type:'attendance incentive',aid:true,st0:'final',by:'jinky',acctSelf:true,a:0,badge:true,approveBtn:true,sameAid:true,kept:'final',st2:'approved',fin:'eyal',c:2000} },

{ name:'(j) Payroll → ✅ Approvals: the queue lists the card row and a one-time incentive (2 waiting); "✔ Approve all I may" by Dr Amy FINAL-approves both (override on the card row Mea added, ① covered) → 2,000 + 500 pay; the HNX_Approval ledger holds two card_incentive approvals and the task type is registered; a "1-Time Incentive" + Allowance entry waits too (allowanceTotal 0, allowanceWaiting 1) and pays 1,000 after ②',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();const r=addRow('mea');
    actAs('mea');const ots=[{id:'ot_t1',empId:'J1',date:'2026-09-30',label:'September bonus',amount:500,taxable:false,kind:'incentive',approval:hnxIncNew(),createdAt:Date.now()}];localStorage.setItem('hydroPro_onetime_allow_v1',JSON.stringify(ots));actAsTester();
    const q0=hnxIncPending();const html=hnxIncQueueHTML();
    actAs('dramy');const res=hnxIncApproveAll();actAsTester();
    const a=run();const led=(HNX_Approval.loadLog()||[]).filter(x=>x.taskType==='card_incentive');
    const task=HNX_Approval.TASK_TYPES.some(x=>x.id==='card_incentive');
    const pk='office_2026-09-26_2026-10-10';actAs('mea');setEmpAllowancesForPeriod(pk,'J1',[{id:'al_e1',catId:'one_time_incentive',amount:1000,note:'',addedAt:Date.now(),approvalJ:JSON.stringify(hnxIncNew()),updatedAt:Date.now()}]);actAsTester();
    const l0=hnxApplyPeriodAllowances(calcEmployeePayroll(emp(),PS,PE,'semi_monthly'),pk);
    const d=dec('dramy',{kind:'entry',period:pk,empId:'J1',id:'al_e1'},'final');
    const l1=hnxApplyPeriodAllowances(calcEmployeePayroll(emp(),PS,PE,'semi_monthly'),pk);
    return {n0:q0.length,kinds:q0.map(x=>x.ref.kind).sort(),html:/JOMEL, TEST/.test(html)&&/🏅 attendance incentive ₱2,000\.00 a month/.test(html)&&/one-time &quot;September bonus&quot; ₱500\.00 dated 2026-09-30/.test(html),done:res.done,n1:hnxIncPending().length,
      cardCov:(apOf(r.aid).acct||{}).covered||null,a:a.allow,one:a.one,led:led.length,task,e0:l0.allowanceTotal,w0:(l0.allowanceWaiting||[]).length,d:d.ok,e1:l1.allowanceTotal,w1:(l1.allowanceWaiting||[]).length};}),
  expect:{n0:2,kinds:['card','onetime'],html:true,done:2,n1:0,cardCov:'final',a:2500,one:[[500,false,0]],led:2,task:true,e0:0,w0:1,d:true,e1:1000,w1:0} },

{ name:'(k) Sync: the roster merge keeps the DECIDED row — a card saved on another computer before it pulled the approval (same aid, allowances stamped newer, approval still pending) merges to approved on both directions; a changed amount (new signature) is a new decision and is left alone',
  requires:REQ, seed:SEED, tz:'Asia/Manila',
  run:R(async()=>{ reset();const r=addRow('mea');dec('dramy',ref(r.aid),'final');
    const A=JSON.parse(localStorage.getItem('hydroPro_employees'));const e=A[0];const t=Date.now();
    const pend=JSON.parse(JSON.stringify(e));pend.allowances[0].approval={at:new Date(t-60000).toISOString(),status:'pending',by:'mea',name:'Meajean Magracia',acct:null,final:null,v:2342};pend.updatedAt=t+5000;pend._fts=Object.assign({},e._fts||{},{allowances:t+5000});
    const appr=JSON.parse(JSON.stringify(e));appr.updatedAt=t;appr._fts=Object.assign({},e._fts||{},{allowances:t});
    const m1=JSON.parse(window.__hnxMergeGeneric('hydroPro_employees',JSON.stringify([appr]),JSON.stringify([pend]))||'[]')[0]||{};
    const m2=JSON.parse(window.__hnxMergeGeneric('hydroPro_employees',JSON.stringify([pend]),JSON.stringify([appr]))||'[]')[0]||{};
    const chg=JSON.parse(JSON.stringify(pend));chg.allowances[0].perfectMonth=1500;
    const m3=JSON.parse(window.__hnxMergeGeneric('hydroPro_employees',JSON.stringify([appr]),JSON.stringify([chg]))||'[]')[0]||{};
    return {s1:hnxIncStage(m1.allowances[0].approval),by1:m1.allowances[0].approval.final.by,s2:hnxIncStage(m2.allowances[0].approval),s3:hnxIncStage(m3.allowances[0].approval),pm3:m3.allowances[0].perfectMonth};}),
  expect:{s1:'approved',by1:'dramy',s2:'approved',s3:'acct',pm3:1500} }
];
