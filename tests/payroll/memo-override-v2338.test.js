/* v23.38 (Eyal, 15 Oct 2026: "The weekends approval and memos should be Jinky and after doc amy or me in any case we can over right
   it if we want"). The memo chain now allows what ✅ Weekend approvals already allowed since v23.34: Dr Amy or Eyal may give the
   FINAL ② while the memo still waits for Jinky's ① — ① is stored {covered:'final'} "covered by <name>'s final", the memo is approved
   and pays like any ② (rates frozen at that moment); Jinky may still add her own check later (the cover becomes her check, pay
   unchanged). Nobody overrides a memo they wrote or submitted; Mea / Jinky see no override button; the normal path is unchanged.
   Fixture as memo-chain-v2294: 4 GH3 workers (₱100 memo rate) present 8–14 Oct 2026, payroll week 8–14 Oct (Manila dates); Mea
   writes, Jinky checks, Dr Amy / Eyal approve. */
function FX(){
  memoUsers();
  const E=[labour('W1','TORZAR, EDERLYN',{ghAssigned:['GH3']}),labour('W2','CRUZ, JUAN',{ghAssigned:['GH3']}),labour('W3','REYES, ANA',{ghAssigned:['GH3']}),labour('W4','GARCIA, PEDRO',{ghAssigned:['GH3']})];
  setE(E);loadEmployees();
  const a={};['2026-10-08','2026-10-09','2026-10-10','2026-10-12','2026-10-13','2026-10-14'].forEach(d=>{a[d]={};E.forEach(e=>{a[d][e.id]=rec('present','07:00','17:00');});});setA(a);
  window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>'ok';
  return E;
}
const HELP=`
  const fx=${FX.toString()};
  const all=()=>JSON.parse(localStorage.getItem('hydroPro_memos')||'[]');
  const g=id=>all().find(m=>m&&m.id===id);
  const put=list=>{localStorage.setItem('hydroPro_memos',JSON.stringify(list));loadMemos();};
  const seedMemo=(o,by)=>{const ms=all();ms.push(Object.assign({reasons:['test'],signatures:{supervisor:null,hrManager:null},status:'draft',createdBy:by||'mea',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),impact:[],totalAmount:0},o));put(ms);return o.id;};
  const pay=e=>{const l=calcEmployeePayroll(e,'2026-10-08','2026-10-14','weekly');return [Math.round((l.memoDed||0)*100)/100,Math.round((l.memoAdd||0)*100)/100,(l.pending&&l.pending.memo)?[l.pending.memo.n,Math.round(l.pending.memo.amt*100)/100]:null];};
  const pendN=e=>{const p=pay(e)[2];return p?p[0]:0;};
  const stageOf=id=>hnxMemoStage(g(id));
  const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
  const sum=a=>Math.round(a.reduce((s,x)=>s+x,0)*100)/100;
  const user=n=>memoUsers().find(x=>x.username===n);
  const daySteps=(id,d)=>{try{const M=hnxMemoDay.model(d,d,{});const m=M.memos.find(x=>x.id===id);return m?String(m.steps||''):'';}catch(e){return 'ERR '+(e&&e.message);}};
`;
const R=fn=>eval('(async()=>{'+HELP+'\nreturn ('+fn.toString()+')();})');
const REQ="typeof window.hnxMemoAcctCovered==='function'&&typeof window.hnxMemoAcctLbl==='function'";

/* ---------- ✅ Weekend approvals (regression): the rule the memo chain now mirrors — seed and helpers as wk-approvals-v2332 ---------- */
const WK_SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'admin_secondary',department:'accounting',active:true,permissions:{managePayroll:true}},
    {username:'dramy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true}]));
  const off=(id,name,mb,extra)=>Object.assign({id,name,status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:mb,rate:+(mb/22).toFixed(2),dateHired:'2025-01-01',hireDate:'2025-01-01'},extra||{});
  const EMPS=JSON.stringify([off('O1','ANN OFFICE',16000),off('J1','PAGTAMA, JINKY',30000,{linkedUser:'jinky'})]);
  localStorage.setItem('hydroPro_employees',EMPS);localStorage.setItem('wk_t_emps',EMPS);
  const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()-7);while(t.getDay()!==0)t.setDate(t.getDate()-1);
  const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const SUN=ymd(t);localStorage.setItem('wk_t_sun',SUN);
  const r={status:'present',timeIn:'08:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'};
  const A={};A[SUN]={O1:r,J1:r};
  localStorage.setItem('hydroPro_attendance',JSON.stringify(A));
  localStorage.setItem('hydroPro_ph_holidays','{}');
  localStorage.setItem('hydroPro_payroll_runs','[]');
  localStorage.setItem('hydroPro_weekend_approvals_v1','{}');
};
const WH=`
  localStorage.setItem('hydroPro_employees',localStorage.getItem('wk_t_emps'));try{if(typeof loadEmployees==='function')loadEmployees();}catch(e){}
  window.alert=()=>{};window.confirm=()=>true;window.prompt=()=>'checked';
  const SUN=localStorage.getItem('wk_t_sun');
  const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  const ST=()=>JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}');
  const K=id=>id+'|'+SUN;
  const screen=()=>{let h=document.getElementById('hrWeekendBody');if(!h){h=document.createElement('div');h.id='hrWeekendBody';document.body.appendChild(h);}
    window._hnxWkRender();const rows={};
    [...h.querySelectorAll('tr')].slice(1).forEach(tr=>{const td=tr.querySelectorAll('td');const nm=((td[1]&&td[1].querySelector('b'))||{}).textContent||'';rows[nm]={a:td[4]?td[4].textContent:''};});
    return {rows};};
  const sunPay=id=>{const e=(JSON.parse(localStorage.getItem('hydroPro_employees'))||[]).find(x=>x.id===id);const p=getSemiMonthPeriod(SUN);
    const l=calcEmployeePayroll(e,p.start,p.end,'semi_monthly');return Math.round(((+l.sundayPremium||0)+(+l.holidayPay||0))*100)/100;};
`;

module.exports=[
{ name:'Override ② before ① (v23.38): GH3 BAD −₱100 × 4 present (12 Oct) submitted by Mea → Eyal gives ② while ① is pending (hnxMemoCan: ok, covered final, side eyal) → memo approved (signed, payable), ① "covered by Eyal’s final" (chain.acct {by eyal, covered final, round 1}, ② by eyal), the card reads "① covered by Eyal’s final · <date> · ② ✓ Eyal", payroll 8–14 Oct memoDed ₱100 each = −₱400 at once, ⏳ Memo column empty (0 waiting per worker), rates frozen at ② (4 impact lines); log submit · acct (covered) · final, all by mea / eyal / eyal; Mea’s ✅ approved notice reads "① covered by Eyal Ben Ari’s final · ② Eyal Ben Ari"; 📅 Memos of the day reads "① covered by Eyal’s final"; the migration pass repairs nothing (the memo stays paid)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'V1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad — override'},'mea');
    actAs('mea');hnxMemoSubmit('V1');const stage0=stageOf('V1'),ded0=E.map(e=>pay(e)[0]),pend0=E.map(pendN);
    actAs('eyal');const canE=hnxMemoCan(g('V1'),user('eyal'),'final');
    const r=hnxMemoApproveDo('V1','final')||{};
    actAsTester();
    const m=g('V1'),a=m.chain.acct||{},f=m.chain.final||{};
    const line=hnxMemoChainLine(m);
    const rep=hnxMemoChainMigrate().repaired;
    const note=inbox().find(x=>x.id==='MEMO_V1_r1_approved_mea')||{};
    return {stage0,ded0,pend0,can:{ok:!!canE.ok,covered:canE.covered||null,side:canE.side||null},ok:!!r.ok,status:m.status,stage:hnxMemoStage(m),payable:hnxMemoPayable(m),
      acct:{by:a.by,covered:a.covered||null,name:a.name,round:a.round},final:{by:f.by,side:f.side},covered:hnxMemoAcctCovered(m),
      line:/^① covered by Eyal’s final · \d{1,2} [A-Z][a-z]{2} · ② ✓ Eyal \d{1,2} [A-Z][a-z]{2}$/.test(line),
      ded:E.map(e=>pay(e)[0]),dedSum:sum(E.map(e=>pay(e)[0])),pend:E.map(pendN),frozen:(!!m.ratesAtSign)&&(m.impact||[]).length,
      log:(m.approvalLog||[]).map(x=>x.step),decisions:(m.approvalLog||[]).map(x=>x.decision),logBy:(m.approvalLog||[]).map(x=>x.by),
      note:/① covered by Eyal Ben Ari’s final · ② Eyal Ben Ari/.test(note.text||''),day:/^① covered by Eyal’s final · /.test(daySteps('V1','2026-10-12')),rep};}),
  expect:{stage0:'acct',ded0:[0,0,0,0],pend0:[1,1,1,1],can:{ok:true,covered:'final',side:'eyal'},ok:true,status:'signed',stage:'approved',payable:true,
    acct:{by:'eyal',covered:'final',name:'Eyal Ben Ari',round:1},final:{by:'eyal',side:'eyal'},covered:true,line:true,
    ded:[100,100,100,100],dedSum:400,pend:[0,0,0,0],frozen:4,log:['submit','acct','final'],decisions:['submitted','covered','approved'],logBy:['mea','eyal','eyal'],note:true,day:true,rep:0} },

{ name:'Dr Amy overrides Mea’s GH3 BAD −₱100 × 4 (① "covered by Dr Amy’s final", memoDed ₱400), then Jinky ticks ① later (hnxMemoCan: ok, late) → her check replaces the cover (acct by jinky, Jinky Pagtama, no cover), the memo stays approved (signed, ② still Dr Amy’s), pay unchanged −₱400, log submit · acct (covered) · final · acct, the card reads "① ✓ Jinky · ② ✓ Dr Amy" and 📅 Memos of the day "① Jinky ✓"; before her tick Mea’s ① is refused, after it Jinky’s second tick is refused (not waiting)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'V2',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad — Dr Amy override'},'mea');
    actAs('mea');hnxMemoSubmit('V2');
    actAs('dramy');const ov=!!hnxMemoApproveDo('V2','final').ok;
    const a1=g('V2').chain.acct||{},line1=hnxMemoChainLine(g('V2')),ded1=E.map(e=>pay(e)[0]),day1=daySteps('V2','2026-10-12');
    actAs('mea');const meaLate=!!hnxMemoApproveDo('V2','acct').ok;
    actAs('jinky');const canJ=hnxMemoCan(g('V2'),user('jinky'),'acct');
    const tick=hnxMemoApproveDo('V2','acct')||{};
    const again=!!hnxMemoApproveDo('V2','acct').ok;
    actAsTester();
    const m=g('V2'),a=m.chain.acct||{};
    return {ov,a1:{by:a1.by,covered:a1.covered||null},line1:/^① covered by Dr Amy’s final · /.test(line1),day1:/^① covered by Dr Amy’s final · /.test(day1),ded1,meaLate,canJ:{ok:!!canJ.ok,late:!!canJ.late},tick:{ok:!!tick.ok,late:!!tick.late},again,
      acct:{by:a.by,covered:a.covered||null,name:a.name},covered:hnxMemoAcctCovered(m),stage:hnxMemoStage(m),status:m.status,ded:E.map(e=>pay(e)[0]),dedSum:sum(E.map(e=>pay(e)[0])),
      log:(m.approvalLog||[]).map(x=>x.step),line:/^① ✓ Jinky \d{1,2} [A-Z][a-z]{2} · ② ✓ Dr Amy /.test(hnxMemoChainLine(m)),day:/^① Jinky ✓ /.test(daySteps('V2','2026-10-12')),finalKept:(m.chain.final||{}).by};}),
  expect:{ov:true,a1:{by:'dramy',covered:'final'},line1:true,day1:true,ded1:[100,100,100,100],meaLate:false,canJ:{ok:true,late:true},tick:{ok:true,late:true},again:false,
    acct:{by:'jinky',covered:null,name:'Jinky Pagtama'},covered:false,stage:'approved',status:'signed',ded:[100,100,100,100],dedSum:400,log:['submit','acct','final','acct'],line:true,day:true,finalKept:'dramy'} },

{ name:'The author cannot override his own memo: Eyal writes and submits a GH3 BAD −₱100 × 4 → his ② while ① is pending is refused ("You wrote this memo"), stage stays ①, ₱0 paid, his panel has no FINAL button ("🔒 Opens after ①"); Mea and Jinky are refused too ("Waiting for Jinky’s check first"); Dr Amy’s override is accepted → ① "covered by Dr Amy’s final", memoDed ₱400; Jinky’s own HR −₱300 for REYES, submitted by her → Eyal’s override alone approves it (① covered by Eyal), REYES memoDed ₱100 + ₱300 = ₱400',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'V3',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad — by Eyal'},'eyal');
    actAs('eyal');hnxMemoSubmit('V3');
    const own=hnxMemoApproveDo('V3','final')||{};const stA=stageOf('V3'),dedA=E.map(e=>pay(e)[0]);
    openMemoView('V3');await sleep(1800);const pa=document.getElementById('hnxMemoAppr');
    const eyalPanel=!!pa&&!pa.querySelector('[data-act="final"]')&&/🔒 Opens after ①/.test(pa.textContent);
    document.getElementById('memoViewModal').classList.remove('open');
    actAs('mea');const mea=hnxMemoApproveDo('V3','final')||{};
    actAs('jinky');const jin=hnxMemoApproveDo('V3','final')||{};
    actAs('dramy');const amy=!!hnxMemoApproveDo('V3','final').ok;
    const a3=g('V3').chain.acct||{},dedB=E.map(e=>pay(e)[0]);
    seedMemo({id:'V4',category:'hr',type:'bad',empId:'W3',date:'2026-10-13',title:'Lost crates',totalAmount:-300,impact:[{empId:'W3',empName:'REYES, ANA',role:'HR Memo',amount:-300}]},'jinky');
    actAs('jinky');const subJ=!!hnxMemoSubmit('V4').ok;
    actAs('eyal');const ovJ=!!hnxMemoApproveDo('V4','final').ok;
    actAsTester();
    const a4=g('V4').chain.acct||{};
    return {own:{ok:!!own.ok,why:/You wrote this memo/.test(own.why||'')},stA,dedA,eyalPanel,mea:{ok:!!mea.ok,why:/Waiting for Jinky’s check first/.test(mea.why||'')},jin:{ok:!!jin.ok,why:/Waiting for Jinky’s check first/.test(jin.why||'')},
      amy,a3:{by:a3.by,covered:a3.covered||null},line3:/^① covered by Dr Amy’s final · /.test(hnxMemoChainLine(g('V3'))),ded:dedB,
      subJ,ovJ,a4:{by:a4.by,covered:a4.covered||null},stage4:stageOf('V4'),reyes:pay(E[2])[0]};}),
  expect:{own:{ok:false,why:true},stA:'acct',dedA:[0,0,0,0],eyalPanel:true,mea:{ok:false,why:true},jin:{ok:false,why:true},amy:true,a3:{by:'dramy',covered:'final'},line3:true,ded:[100,100,100,100],
    subJ:true,ovJ:true,a4:{by:'eyal',covered:'final'},stage4:'approved',reyes:400} },

{ name:'Normal path unchanged (v23.38): Mea’s GH3 BAD −₱100 × 4 → Jinky ① then Dr Amy ② pays memoDed ₱400, the card reads "① ✓ Jinky · ② ✓ Dr Amy", log submit · acct · final; while ① is pending Eyal’s panel offers "✅ FINAL now (override — covers Jinky’s check)" with the hint "Jinky checks first; you may approve anyway", his Decision box the same option, and his row in the "① Waiting for Jinky" list the override button (no ✔ Approve all for him); Mea (supervisor) and Jinky see no override button (Jinky: ✔ Approve ① only; Mea: no buttons, "🔒 Opens after ①"); Jinky cannot give ②; after Jinky’s ① Dr Amy’s panel reads "✔ FINAL approve → payroll" with no override',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'V5',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad — normal'},'mea');
    actAs('mea');hnxMemoSubmit('V5');
    const qd=()=>{const d=document.createElement('div');d.innerHTML=hnxMemoQueuesHTML();return d;};
    const panel=async()=>{await sleep(1800);return document.getElementById('hnxMemoAppr');};
    actAs('eyal');openMemoView('V5');let pa=await panel();
    const eyal={btn:!!pa&&!!pa.querySelector('[data-act="final"]')&&/✅ FINAL now \(override — covers Jinky’s check\)/.test(pa.textContent),hint:!!pa&&/Jinky checks first; you may approve anyway/.test(pa.textContent),noAcct:!!pa&&!pa.querySelector('[data-act="acct"]'),
      opt:!!pa&&[...pa.querySelectorAll('#hnxMemoDecide option')].some(o=>o.value==='approve'&&/FINAL now \(override/.test(o.textContent))};
    let d=qd();const qa=d.querySelector('[data-q="acct"]');eyal.q=!!qa&&!!qa.querySelector('.hnxmq-row [data-act="final"]')&&/FINAL now \(override/.test(qa.textContent)&&/Jinky checks first; you may approve anyway/.test(qa.textContent);eyal.bulk=!d.querySelector('[data-bulk="acct"]');
    actAs('mea');pa=await panel();const mea={none:!!pa&&!pa.querySelector('[data-act]'),lock:!!pa&&/🔒 Opens after ①/.test(pa.textContent)};d=qd();mea.q=!d.querySelector('[data-q="acct"] [data-act]');
    actAs('jinky');pa=await panel();const jin={acct:!!pa&&!!pa.querySelector('[data-act="acct"]')&&/✔ Approve ①/.test(pa.textContent),noFinal:!!pa&&!pa.querySelector('[data-act="final"]'),lock:!!pa&&/🔒 Opens after ①/.test(pa.textContent)};
    d=qd();jin.q=!d.querySelector('[data-q="acct"] [data-act="final"]')&&!!d.querySelector('[data-q="acct"] [data-act="acct"]');
    const jinFinal=!!hnxMemoApproveDo('V5','final').ok;
    const a=!!hnxMemoApproveDo('V5','acct').ok;
    actAs('dramy');pa=await panel();const amy={btn:!!pa&&!!pa.querySelector('[data-act="final"]')&&/✔ FINAL approve → payroll/.test(pa.textContent),noOv:!!pa&&!/override/.test(pa.textContent)};
    document.getElementById('memoViewModal').classList.remove('open');
    const f=!!hnxMemoApproveDo('V5','final').ok;actAsTester();
    const m=g('V5'),ac=m.chain.acct||{};
    return {eyal,mea,jin,jinFinal,a,amy,f,acct:{by:ac.by,covered:ac.covered||null},line:/^① ✓ Jinky \d{1,2} [A-Z][a-z]{2} · ② ✓ Dr Amy /.test(hnxMemoChainLine(m)),ded:E.map(e=>pay(e)[0]),dedSum:sum(E.map(e=>pay(e)[0])),log:(m.approvalLog||[]).map(x=>x.step)};}),
  expect:{eyal:{btn:true,hint:true,noAcct:true,opt:true,q:true,bulk:true},mea:{none:true,lock:true,q:true},jin:{acct:true,noFinal:true,lock:true,q:true},jinFinal:false,a:true,amy:{btn:true,noOv:true},f:true,
    acct:{by:'jinky',covered:null},line:true,ded:[100,100,100,100],dedSum:400,log:['submit','acct','final']} },

{ name:'✅ Weekend approvals unchanged (regression, v23.38): Dr Amy’s ② ✓ on ANN’s Sunday before Jinky’s check still stores final ✓ by Dr Amy Patdu with ① "covered by Dr Amy’s final" (acctCovered final, acctBy Dr Amy Patdu) → ANN paid ₱945.45 Sun OT (16,000 ÷ 22 × 1.30); Jinky’s later ① tick makes it her own check (acctBy Jinky Pagtama, no cover), ② kept, pay unchanged ₱945.45',
  requires:"typeof window.hnxWkSet==='function'&&typeof window.hnxWkSave==='function'&&typeof window._hnxWkRender==='function'",
  seed:WK_SEED,
  run:new Function(`return (async()=>{${WH}await sleep(3000);
    as('dramy');hnxWkSet(K('O1'),'final','ok');hnxWkSave();
    const a=ST()[K('O1')]||{},sc=screen();
    const amy={acct:a.acct,cov:a.acctCovered||null,by:a.acctBy,final:a.final,fby:a.finalBy,label:/covered by Dr Amy.s final/.test((sc.rows['ANN OFFICE']||{}).a),paid:sunPay('O1')};
    as('jinky');hnxWkSet(K('O1'),'acct','ok');hnxWkSave();
    const b=ST()[K('O1')]||{};
    return {amy,jin:{acct:b.acct,cov:b.acctCovered||null,by:b.acctBy,final:b.final,fby:b.finalBy,paid:sunPay('O1')}};})();`),
  expect:{'amy.acct':'ok','amy.cov':'final','amy.by':'Dr Amy Patdu','amy.final':'ok','amy.fby':'Dr Amy Patdu','amy.label':true,'amy.paid':945.45,
    'jin.acct':'ok','jin.cov':null,'jin.by':'Jinky Pagtama','jin.final':'ok','jin.fby':'Dr Amy Patdu','jin.paid':945.45} }
];
