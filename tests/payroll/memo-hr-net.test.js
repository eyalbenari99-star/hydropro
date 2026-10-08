/* v22.17 (Dr Amy, 8 Oct 2026, on Ederlyn Torzar's HR memo: "3 good, 2 minus, so how did it become 300 still?"):
   an individual (HR) memo that covers several GHs with mixed outcomes is COUNTED at the ⚙ Memo rate payroll uses for
   that person's tier (one rate per tier: + per commendation, − per reprimand), and the memo, the signing and the FINAL
   approval say where the figure came from — "computed: …" or "typed by hand by @user". Payroll pays exactly the frozen total. */
module.exports=[
{ name:'HR memo: 3 commendations + 2 reprimands for a supervisor → +3×₱100 −2×₱100 = +₱100 (was typed +₱300): the old typed memo says "typed by hand by @mea" and warns the notes name both (3 × +₱100 − 2 × ₱100 = +₱100); the 🧮 count from the notes fills +₱100, the view and the FINAL approval say "computed: 3 × +₱100 − 2 × ₱100 = +₱100", payroll memoAdd = ₱100 = the frozen total (v22.17)',
  run:async()=>{
    const notes='Commendations (GH2, GH6, & GH9): - Well done - For cleaning the floor. Memos (GH5 & GH10): - For failing to complete the recurring task (Some parts of Nursery D haven\'t been finished cleaning yet) - For failing to complete the recurring task (Some parts of Nursery B haven\'t been finished cleaning yet)';
    const ED=labour('ED','TORZAR, EDERLYN INGUITO',{tier:'supervisor',supervisorGHs:'all',ghAssigned:[]});
    setE([ED]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={ED:rec('present','07:00','17:00')};});setA(a);
    let asked='';window.confirm=t=>{asked+=String(t)+'\n';return true;};window.alert=()=>{};
    const rate=calcMemoAmountForEmp({},ED);
    /* 1) the memo as Dr Amy saw it: +₱300 typed by hand */
    const old={id:'OLD',category:'hr',type:'good',empId:'ED',date:'2026-09-15',status:'pending',title:'Commendations and memos',notes,totalAmount:300,
      impact:[{empId:'ED',empName:'TORZAR, EDERLYN INGUITO',role:'HR Memo',amount:300}],reasons:[],signatures:{supervisor:null,hrManager:null},createdAt:new Date().toISOString(),createdBy:'mea'};
    localStorage.setItem('hydroPro_memos',JSON.stringify([old]));loadMemos();
    openMemoView('OLD');await sleep(1800);
    const oldTxt=document.getElementById('memoViewBody').innerText;
    const oldPanel=(document.getElementById('hnxMemoAppr')||{}).innerText||'';
    const oldSummary=hnxMemoMoneySummary(old);
    document.getElementById('memoViewModal').classList.remove('open');
    /* 2) the same memo made with the 🧮 count */
    localStorage.setItem('hydroPro_memos','[]');loadMemos();
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','ED');renderMemoModal();
    memoUpdateField('date','2026-09-15');
    memoUpdateField('notes',notes);
    const sugg=!!document.getElementById('memoHrCalcNotes');
    memoHrCalcFromNotes();
    const amtField=document.getElementById('memoHrAmt').value;
    const boxTxt=(document.getElementById('memoHrCalcResult')||{}).innerText||'';
    const boxLines=/3 commendations \(GH2, GH6, GH9\) × \+₱100 = \+₱300/.test(boxTxt)&&/2 reprimands \(GH5, GH10\) × −₱100 = −₱200/.test(boxTxt)&&/3 × \+₱100 − 2 × ₱100 = \+₱100/.test(boxTxt);
    memoSaveAndSend();await sleep(300);
    const saved=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    asked='';hnxMemoApproveDo(saved.id,'final');
    const st=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    const frozen=hnxMemoFreeze(st,true).total;
    const l=calcEmployeePayroll(ED,'2026-09-10','2026-09-16','weekly');
    openMemoView(st.id);await sleep(1800);
    const vTxt=document.getElementById('memoViewBody').innerText;
    const panel=(document.getElementById('hnxMemoAppr')||{}).innerText||'';
    const c=st.hrCalc||{};
    return {rate,
      oldTyped:/typed by hand by @mea/.test(oldTxt),
      oldWarn:/notes mention commendations AND memos/.test(oldTxt)&&/3 × \+₱100 − 2 × ₱100 = \+₱100/.test(oldTxt),
      oldPanelTyped:/typed by hand by @mea/.test(oldPanel),
      oldSummaryTyped:/Where the figure comes from: typed by hand by @mea/.test(oldSummary),
      sugg,amtField,boxLines,
      savedAmt:saved.totalAmount,savedType:saved.type,calc:{good:c.good,bad:c.bad,goodRate:c.goodRate,badRate:c.badRate,net:c.net},
      approveAsk:/Where the figure comes from: computed: 3 × \+₱100 − 2 × ₱100 = \+₱100/.test(asked),
      status:st.status,frozen,memoAdd:l.memoAdd,memoDed:l.memoDed,paysFrozen:(l.memoAdd||0)-(l.memoDed||0)===frozen,
      viewComputed:/computed: 3 × \+₱100 − 2 × ₱100 = \+₱100/.test(vTxt)&&/Payroll will move: \+₱100/.test(vTxt),
      viewNotTyped:!/typed by hand/.test(vTxt),
      panelComputed:/computed: 3 × \+₱100 − 2 × ₱100 = \+₱100/.test(panel)};},
  expect:{rate:100,oldTyped:true,oldWarn:true,oldPanelTyped:true,oldSummaryTyped:true,sugg:true,amtField:'100',boxLines:true,
    savedAmt:100,savedType:'good',calc:{good:3,bad:2,goodRate:100,badRate:100,net:100},approveAsk:true,status:'signed',frozen:100,memoAdd:100,memoDed:0,paysFrozen:true,
    viewComputed:true,viewNotTyped:true,panelComputed:true} },

{ name:'HR memo typed by hand: a worker at ⚙ Memo rates ₱120 counted 1 commendation + 3 reprimands → +1×₱120 −3×₱120 = −₱240 turns the memo ⚠️ BAD (GOOD refused while counted); typing −₱150 instead shows "typed by hand by @tester — the count gives −₱240" on the memo and the FINAL approval, and payroll deducts exactly the frozen ₱150; with Worker = ₱0 the count says it has no rate (v22.17)',
  run:async()=>{
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:120,supervisor:100,explicit:true}));
    const W=labour('W1','CRUZ, JUAN',{ghAssigned:['GH3']});setE([W]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={W1:rec('present','07:00','17:00')};});setA(a);
    let asked='';window.confirm=t=>{asked+=String(t)+'\n';return true;};window.alert=()=>{};
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','W1');renderMemoModal();
    memoUpdateField('date','2026-09-15');memoUpdateField('notes','Mixed week');
    memoHrCalcSet('good',1);memoHrCalcSet('bad',3);
    const t1=_editingMemoData.type,a1=_editingMemoData.totalAmount;
    memoSetType('good');const t2=_editingMemoData.type;
    memoUpdateHrAmount('-150');
    const typedBox=!!document.getElementById('memoHrCalcTyped');
    memoSaveAndSend();await sleep(300);
    const saved=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    asked='';hnxMemoApproveDo(saved.id,'final');
    const st=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    const frozen=hnxMemoFreeze(st,true).total;
    const l=calcEmployeePayroll(W,'2026-09-10','2026-09-16','weekly');
    openMemoView(st.id);await sleep(1800);
    const vTxt=document.getElementById('memoViewBody').innerText;
    const panel=(document.getElementById('hnxMemoAppr')||{}).innerText||'';
    document.getElementById('memoViewModal').classList.remove('open');
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:0,supervisor:100,explicit:true}));
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);memoUpdateField('empId','W1');renderMemoModal();
    const noRate=!!document.getElementById('memoHrCalcNoRate');
    closeMemoModal();
    return {t1,a1,t2,typedBox,savedAmt:saved.totalAmount,savedType:saved.type,amountBy:saved.amountBy,
      askTyped:/Where the figure comes from: typed by hand by @tester — the count gives −₱240/.test(asked),
      status:st.status,frozen,memoAdd:l.memoAdd,memoDed:l.memoDed,paysFrozen:(l.memoAdd||0)-(l.memoDed||0)===frozen,
      viewTyped:/typed by hand by @tester — the count gives −₱240/.test(vTxt)&&/Payroll will move: −₱150/.test(vTxt),
      panelTyped:/typed by hand by @tester/.test(panel),noRate};},
  expect:{t1:'bad',a1:-240,t2:'bad',typedBox:true,savedAmt:-150,savedType:'bad',amountBy:'tester',askTyped:true,
    status:'signed',frozen:-150,memoAdd:0,memoDed:150,paysFrozen:true,viewTyped:true,panelTyped:true,noRate:true} },

{ name:'HR memo 🚧 WARNING with a count: a supervisor counted 3 commendations + 2 reprimands → 3 × +₱100 − 2 × ₱100 = +₱100 is 🌟 GOOD; pressing 🚧 WARNING (and re-entering the count) keeps it WARNING, saved type bad + noMoney with the +₱100 count on record; it shows under the Warning filter, not Bad; payroll memoAdd ₱0 and memoDed ₱0 while pending and after FINAL approval; leaving WARNING by ⚠️ BAD lands on 🌟 GOOD +₱100 (v22.17)',
  run:async()=>{
    const S1=labour('S1','REYES, ANA',{tier:'supervisor',supervisorGHs:'all',ghAssigned:[]});
    setE([S1]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={S1:rec('present','07:00','17:00')};});setA(a);
    window.confirm=()=>true;window.alert=()=>{};
    const rate=calcMemoAmountForEmp({},S1);
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','S1');renderMemoModal();
    memoUpdateField('date','2026-09-15');memoUpdateField('notes','Mixed week, warning only');
    memoHrCalcSet('good',3);memoHrCalcSet('bad',2);
    const t1=_editingMemoData.type,a1=_editingMemoData.totalAmount;
    hnxMemoWarnSet();
    const t2=_editingMemoData.type,nm2=_editingMemoData.noMoney;
    memoHrCalcSet('bad',2); /* the count entered again while WARNING must not turn it GOOD */
    const t3=_editingMemoData.type,nm3=_editingMemoData.noMoney,a3=_editingMemoData.totalAmount;
    const warnBox=!!document.getElementById('memoHrCalcWarnOnly'),typedBox=!!document.getElementById('memoHrCalcTyped');
    memoSaveAndSend();await sleep(300);
    const saved=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    const lp=calcEmployeePayroll(S1,'2026-09-10','2026-09-16','weekly');
    const shown=()=>document.getElementById('memosBody').innerHTML.includes("openMemoView('"+saved.id+"')");
    memoFilter.type='warning';renderMemos();const inWarn=shown();
    memoFilter.type='bad';renderMemos();const inBad=shown();
    memoFilter.type='good';renderMemos();const inGood=shown();
    memoFilter.type='';renderMemos();
    hnxMemoApproveDo(saved.id,'final');
    const st=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    const l=calcEmployeePayroll(S1,'2026-09-10','2026-09-16','weekly');
    const summary=hnxMemoMoneySummary(st);
    openMemoView(st.id);await sleep(1800);
    const vTxt=document.getElementById('memoViewBody').innerText;
    document.getElementById('memoViewModal').classList.remove('open');
    /* leaving WARNING by the ⚠️ BAD button: the +₱100 count keeps it 🌟 GOOD */
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','S1');renderMemoModal();memoUpdateField('date','2026-09-15');
    memoHrCalcSet('good',3);memoHrCalcSet('bad',2);hnxMemoWarnSet();
    memoSetType('bad');
    const t4=_editingMemoData.type,nm4=!!_editingMemoData.noMoney,a4=_editingMemoData.totalAmount,k4=hnxMemoHrSource(_editingMemoData).kind;
    closeMemoModal();
    const c=saved.hrCalc||{};
    return {rate,t1,a1,t2,nm2,t3,nm3,a3,warnBox,typedBox,
      savedType:saved.type,savedNoMoney:saved.noMoney,savedAmt:saved.totalAmount,calc:{good:c.good,bad:c.bad,goodRate:c.goodRate,badRate:c.badRate,net:c.net},
      pendingPay:{memoAdd:lp.memoAdd,memoDed:lp.memoDed,pendN:lp.pending&&lp.pending.memo&&lp.pending.memo.n},
      inWarn,inBad,inGood,status:st.status,finalType:st.type,finalNoMoney:st.noMoney,memoAdd:l.memoAdd,memoDed:l.memoDed,
      summaryNoMoney:/warning memo — no money moves/.test(summary)&&/Payroll will move: ₱0\.00/.test(summary),
      viewNoPayLine:!/Payroll will move: \+₱100/.test(vTxt)&&!/typed by hand/.test(vTxt),
      t4,nm4,a4,k4};},
  expect:{rate:100,t1:'good',a1:100,t2:'bad',nm2:true,t3:'bad',nm3:true,a3:100,warnBox:true,typedBox:false,
    savedType:'bad',savedNoMoney:true,savedAmt:100,calc:{good:3,bad:2,goodRate:100,badRate:100,net:100},
    pendingPay:{memoAdd:0,memoDed:0,pendN:0},inWarn:true,inBad:false,inGood:false,status:'signed',finalType:'bad',finalNoMoney:true,memoAdd:0,memoDed:0,
    summaryNoMoney:true,viewNoPayLine:true,t4:'good',nm4:false,a4:100,k4:'calc'} },

{ name:'HR memo employee switch: typed +₱250 for a worker (count 3 × +₱100 = +₱300) stays +₱250 "typed by hand by @tester — the count gives +₱450" after switching to a team leader, and the 🧮 count offers "Use +₱450" (3 × +₱150); saved +₱250 GOOD on the team leader, payroll memoAdd ₱250 = frozen, the worker ₱0; a counted +₱300 still re-prices to +₱450 on the same switch (v22.17)',
  run:async()=>{
    const W=labour('W1','CRUZ, JUAN',{ghAssigned:['GH3']});
    const T=labour('T1','SANTOS, MARIA',{tier:'Team Leader',ghAssigned:['GH3']});
    setE([W,T]);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={W1:rec('present','07:00','17:00'),T1:rec('present','07:00','17:00')};});setA(a);
    window.confirm=()=>true;window.alert=()=>{};
    const rW=calcMemoAmountForEmp({},W),rT=calcMemoAmountForEmp({},T);
    /* A) the Amount came from the count → the switch re-prices it */
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','W1');renderMemoModal();
    memoUpdateField('date','2026-09-15');memoUpdateField('notes','Three commendations');
    memoHrCalcSet('good',3);
    const cA1=_editingMemoData.totalAmount;
    memoUpdateField('empId','T1');
    const cA2=_editingMemoData.totalAmount,cAKind=hnxMemoHrSource(_editingMemoData).kind,cAField=document.getElementById('memoHrAmt').value;
    closeMemoModal();
    /* B) the Amount was typed by hand → it stays, the count is re-rated and offered */
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','W1');renderMemoModal();
    memoUpdateField('date','2026-09-15');memoUpdateField('notes','Three commendations, judged +250');
    memoHrCalcSet('good',3);
    const b1=_editingMemoData.totalAmount;
    memoUpdateHrAmount('250');
    memoUpdateField('empId','T1');
    const m=_editingMemoData,src=hnxMemoHrSource(m);
    const b2=m.totalAmount,bField=document.getElementById('memoHrAmt').value,bType=m.type,bBy=m.amountBy;
    const offer=(document.getElementById('memoHrCalcTyped')||{}).innerText||'';
    const box=(document.getElementById('memoHrCalcResult')||{}).innerText||'';
    memoSaveAndSend();await sleep(300);
    const saved=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    hnxMemoApproveDo(saved.id,'final');
    const st=JSON.parse(localStorage.getItem('hydroPro_memos'))[0]||{};
    const frozen=hnxMemoFreeze(st,true).total;
    const lT=calcEmployeePayroll(T,'2026-09-10','2026-09-16','weekly'),lW=calcEmployeePayroll(W,'2026-09-10','2026-09-16','weekly');
    return {rW,rT,cA1,cA2,cAKind,cAField,b1,b2,bField,bType,bBy,srcKind:src.kind,srcText:src.text,
      offerUse450:/Use \+₱450/.test(offer)&&/\(\+₱250\)/.test(offer),box450:/3 commendations × \+₱150 = \+₱450/.test(box),
      savedAmt:saved.totalAmount,savedType:saved.type,savedEmp:saved.empId,savedImpact:(saved.impact||[]).map(i=>[i.empId,i.amount]),
      status:st.status,frozen,memoAddT:lT.memoAdd,memoDedT:lT.memoDed,paysFrozen:(lT.memoAdd||0)-(lT.memoDed||0)===frozen,memoAddW:lW.memoAdd,memoDedW:lW.memoDed};},
  expect:{rW:100,rT:150,cA1:300,cA2:450,cAKind:'calc',cAField:'450',b1:300,b2:250,bField:'250',bType:'good',bBy:'tester',
    srcKind:'typed',srcText:'typed by hand by @tester — the count gives +₱450',offerUse450:true,box450:true,
    savedAmt:250,savedType:'good',savedEmp:'T1',savedImpact:[['T1',250]],status:'signed',frozen:250,memoAddT:250,memoDedT:0,paysFrozen:true,memoAddW:0,memoDedW:0} },
{ name:'HR memo employee switch then emptied count: count 3 × +₱100 = +₱300 for a worker, typed +₱250, switched to a team leader, then typed +₱300 and emptied the count → the Amount stays +₱300 typed by hand (the old worker figure ₱300 made the empty count "take it back" to ₱0) (v22.17)',
  run:async()=>{
    const W=labour('W1','CRUZ, JUAN',{ghAssigned:['GH3']});
    const T=labour('T1','SANTOS, MARIA',{tier:'Team Leader',ghAssigned:['GH3']});
    setE([W,T]);loadEmployees();window.confirm=()=>true;window.alert=()=>{};
    try{localStorage.removeItem('hnx_memo_form_draft_v1');}catch(e){}
    openMemoCreate('hr');await sleep(200);
    memoUpdateField('empId','W1');renderMemoModal();
    memoUpdateField('date','2026-09-15');memoUpdateField('notes','Three commendations');
    memoHrCalcSet('good',3);const counted=_editingMemoData.totalAmount;
    memoUpdateHrAmount('250');memoUpdateField('empId','T1');const afterSwitch=_editingMemoData.totalAmount;
    memoUpdateHrAmount('300');memoHrCalcSet('good',0);
    const m=_editingMemoData,out={counted,afterSwitch,amount:m.totalAmount,field:(document.getElementById('memoHrAmt')||{}).value,impact:(m.impact||[]).map(i=>[i.empId,i.amount])};
    closeMemoModal();return out;},
  expect:{counted:300,afterSwitch:250,amount:300,field:'300',impact:[['T1',300]]} },
];
