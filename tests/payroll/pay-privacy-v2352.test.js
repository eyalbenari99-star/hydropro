/* v23.52 (Eyal, 18 Oct 2026: "Only Jinky, me and Dr Amy can see salary-related numbers. Check and double check NO ONE else can see
   salaries related numbers"): the 🔒 salary-privacy sweep. Every memo peso (📋 Memos cards, Month Total, 🏛 queues, Financial Impact,
   📅 Memos of the day, 🧮 Memo Matrix, the 201 file, 📈 GH Analytics), 🎁 Referral Bonuses, 💰 Level Rates and the card's level-rate
   line, 📜 Audit Log pay details, 🚚 Trips in Fleet / Logistics + the 🩺 Trip Doctor, 👷 Contractor labor and the 🚑 Storage Rescue
   backup file follow the existing gates — hnxPayVisibleFor (office → 🏢 Office pay, labour → 💰), canViewSalaries, hnxPaySensitiveAllowed —
   and read 🔒 for everyone else. Fixtures: office ANN / BEA / CEL 16,000; labourers EDER / JUAN 658 on GH3 (memo rate ₱100 a head);
   a driver and a helper. Mea = supervisor with HR edit, no 💰, no 🏢; Josh = admin_secondary (💰 by role, no 🏢); acct = an
   'accounting' role login without 💰; syra = an operator with Logistics / Fleet view only; Jinky / Dr Amy / Eyal = the pay name list. */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'admin_secondary',department:'accounting',active:true,permissions:{managePayroll:true}},
    {username:'dramy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'meajean',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr','admin'],active:true},
    {username:'josh',fullname:'Joshane Espinosa',passwordHash:'x',role:'admin_secondary',department:'accounting',departments:['accounting'],allDepts:true,active:true},
    {username:'acct',fullname:'Acct Clerk',passwordHash:'x',role:'accounting',department:'accounting',departments:['accounting','hr'],active:true},
    {username:'syra',fullname:'Syra Dispatch',passwordHash:'x',role:'operator',department:'logistics',departments:['logistics'],active:true}]));
  localStorage.setItem('hydroPro_user_perms',JSON.stringify({
    syra:{overrides:{'module:logistics':'view','module:fleet':'view'},updatedAt:'2026-10-18T00:00:00.000Z',updatedBy:'tester'},
    acct:{overrides:{'module:hr':'edit','module:projects':'view'},updatedAt:'2026-10-18T00:00:00.000Z',updatedBy:'tester'}}));
  const off=(id,name,mb)=>({id,name,status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:mb,rate:+(mb/22).toFixed(2),dateHired:'2025-01-01',hireDate:'2025-01-01'});
  const lab=(id,name,extra)=>Object.assign({id,name,status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'},extra||{});
  const EMPS=[off('O1','ANN OFFICE',16000),off('O2','BEA OFFICE',16000),off('O3','CEL OFFICE',16000),
    lab('W1','WORKER, EDER',{ghAssigned:['GH3']}),lab('W2','WORKER, JUAN',{ghAssigned:['GH3']}),lab('D1','DRIVER, DANTE',{dept:'Drivers'}),lab('H1','HELPER, NICO',{dept:'Helpers'})];
  localStorage.setItem('hydroPro_employees',JSON.stringify(EMPS));localStorage.setItem('pp52_emps',JSON.stringify(EMPS));
  const d=new Date();d.setHours(0,0,0,0);const D=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const r={status:'present',timeIn:'07:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'};
  const A={};A[D]={W1:r,W2:r,D1:r,H1:r,O1:r,O2:r,O3:r};localStorage.setItem('hydroPro_attendance',JSON.stringify(A));
  localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:100,supervisor:100,explicit:true}));
  localStorage.setItem('hydroPro_ph_holidays','{}');localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'pp52_run',type:'weekly',periodStart:'2026-10-01',periodEnd:'2026-10-07',status:'approved',lines:[{empId:'W1',netPay:3948}]}]));
  localStorage.setItem('hydroPro_training_level_rates',JSON.stringify({1:350,2:450,3:550,4:680,5:850}));
  localStorage.setItem('hydroPro_hr_201_memos_v1',JSON.stringify({W1:[{id:'PH1',date:D,type:'bad',reason:'Damaged crates',amount:-500,addedAt:Date.now()}]}));
  localStorage.setItem('hydroPro_hr_referrals',JSON.stringify([{id:'R1',referrerId:'W1',referrerName:'WORKER, EDER',refereeId:'W2',refereeName:'WORKER, JUAN',hiredAt:Date.now()-100*86400000,qualifiesAt:Date.now()-10*86400000,minDays:90,amount:1500,currency:'PHP',status:'qualified'}]));
  localStorage.setItem('hydroPro_audit',JSON.stringify([
    {ts:'2026-10-17T01:00:00.000Z',u:'jinky',r:'admin_secondary',a:'payroll_approve',d:'Approved weekly_2026-10-05_2026-10-11 — ₱123,456.78',gh:''},
    {ts:'2026-10-17T01:01:00.000Z',u:'jinky',r:'admin_secondary',a:'payroll_allow_add',d:'Allowances set for ANN OFFICE: meal ₱100/day, transport ₱2,000/mo',gh:''},
    {ts:'2026-10-17T01:02:00.000Z',u:'tester',r:'admin',a:'login',d:'Signed in from the office PC',gh:''}]));
  localStorage.setItem('hydroPro_fleet_drivers',JSON.stringify([{id:'D1',name:'DRIVER, DANTE',active:true}]));
  localStorage.setItem('hydroPro_fleet_helpers',JSON.stringify([{id:'H1',name:'HELPER, NICO',active:true}]));
};
const H=`
  window.alert=()=>{};window.confirm=()=>true;window.prompt=()=>'ok';
  localStorage.setItem('hydroPro_employees',localStorage.getItem('pp52_emps'));try{loadEmployees();}catch(e){}
  const U=()=>JSON.parse(localStorage.getItem('hydroPro_users')||'[]');
  const as=u=>{const x=U().find(y=>y.username===u);if(!window.__tGCU)window.__tGCU=window.getCurrentUser;sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));window.getCurrentUser=()=>x;return x;};
  const all=()=>JSON.parse(localStorage.getItem('hydroPro_memos')||'[]');
  const put=list=>{localStorage.setItem('hydroPro_memos',JSON.stringify(list));loadMemos();};
  const seedMemo=(o,by)=>{const ms=all();ms.push(Object.assign({reasons:['test'],signatures:{supervisor:null,hrManager:null},status:'draft',createdBy:by||'meajean',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),impact:[],totalAmount:0},o));put(ms);return o.id;};
  const toasts=[];window.showToast=(t,k)=>{toasts.push(String(t));};
  const peso=s=>/₱\\s?\\d/.test(String(s));
  /* memos of today: HR −₱500 on labourer EDER (approved ① ②), HR +₱300 on office ANN (approved), GH3 BAD −₱100 × 2 (waiting ①), HR −₱200 on JUAN (waiting ①), an HR draft on JUAN */
  const fix=()=>{
    seedMemo({id:'PH1',category:'hr',type:'bad',empId:'W1',date:today,title:'Damaged crates',totalAmount:-500,impact:[{empId:'W1',empName:'WORKER, EDER',role:'HR Memo',amount:-500}]});
    seedMemo({id:'PO1',category:'hr',type:'good',empId:'O1',date:today,title:'Office bonus',totalAmount:300,impact:[{empId:'O1',empName:'ANN OFFICE',role:'HR Memo',amount:300}]});
    seedMemo({id:'PG1',category:'production',type:'bad',gh:'GH3',date:today,title:'GH3 bad — trays'});
    seedMemo({id:'PH2',category:'hr',type:'bad',empId:'W2',date:today,title:'Late back',totalAmount:-200,impact:[{empId:'W2',empName:'WORKER, JUAN',role:'HR Memo',amount:-200}]});
    seedMemo({id:'PD1',category:'hr',type:'good',empId:'W2',date:today,title:'Draft bonus',totalAmount:150,impact:[{empId:'W2',empName:'WORKER, JUAN',role:'HR Memo',amount:150}]});
    actAs('mea');['PH1','PO1','PG1','PH2'].forEach(id=>hnxMemoSubmit(id));
    chainApprove('PH1');chainApprove('PO1');actAsTester();loadMemos();};
`;
module.exports=[
{ name:'📋 Memos v23.52 — Mea (HR edit, no 💰, no 🏢): every card amount 🔒 (EDER −₱500, ANN +₱300, GH3 −₱200, JUAN −₱200), Month Total 🔒, the 🏛 queue rows show 🔒 and no "▸ pesos per person"; Josh (💰, no 🏢): labour pesos −₱500 / −₱200 and the GH3 total, ANN 🔒 and the Month Total 🔒 (an office memo is in it); Jinky: −₱500, +₱300, −₱200 and Month Total −₱200 (−500 + 300); Eyal the same',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);fix();
    const screen=u=>{as(u);renderMemos();const b=document.getElementById('memosBody');
      const cards={};[...b.querySelectorAll('.memo-card')].forEach(c=>{cards[c.querySelector('.memo-card-title').textContent.trim()]=c.querySelector('.memo-amount').textContent.trim();});
      const tile=[...b.querySelectorAll('.memo-stat')].find(x=>/Month Total/.test(x.textContent));const mt=tile?tile.querySelector('.memo-stat-val').textContent.trim():'(no tile)';
      const q=document.getElementById('hnxMemoQueues');const rows=q?[...q.querySelectorAll('.hnxmq-row')].map(r=>r.textContent.replace(/\\s+/g,' ').trim()):[];
      return {cards,mt,qN:rows.length,qLocks:rows.filter(r=>/🔒/.test(r)).length,qPeso:rows.some(peso),qDetails:q?q.querySelectorAll('details').length:-1,qHas200:rows.some(r=>/₱200\\.00/.test(r))};};
    return {mea:screen('meajean'),josh:screen('josh'),jinky:screen('jinky'),eyal:screen('eyal')};})();`),
  expect:{'mea.cards.Damaged crates':'🔒','mea.cards.Office bonus':'🔒','mea.cards.GH3 bad — trays':'🔒','mea.cards.Late back':'🔒','mea.cards.Draft bonus':'🔒','mea.mt':'🔒','mea.qN':2,'mea.qLocks':2,'mea.qPeso':false,'mea.qDetails':0,
    'josh.cards.Damaged crates':'−₱500','josh.cards.Office bonus':'🔒','josh.cards.GH3 bad — trays':'−₱200','josh.cards.Late back':'−₱200','josh.cards.Draft bonus':'+₱150','josh.mt':'🔒','josh.qLocks':0,'josh.qHas200':true,'josh.qDetails':2,
    'jinky.cards.Damaged crates':'−₱500','jinky.cards.Office bonus':'+₱300','jinky.cards.GH3 bad — trays':'−₱200','jinky.cards.Late back':'−₱200','jinky.cards.Draft bonus':'+₱150','jinky.mt':'−₱200','jinky.qLocks':0,'jinky.qDetails':2,
    'eyal.cards.Damaged crates':'−₱500','eyal.cards.Office bonus':'+₱300','eyal.cards.GH3 bad — trays':'−₱200','eyal.cards.Late back':'−₱200','eyal.cards.Draft bonus':'+₱150','eyal.mt':'−₱200'} },

{ name:'📋 Memo view / edit v23.52 — Mea opens EDER −₱500, ANN +₱300 and the GH3 memo: every 💰 Financial Impact row and Total read 🔒; the EDIT form of the saved draft on JUAN shows 🔒 instead of the amount box (no #memoHrAmt), while a NEW HR memo keeps the box; typing −999,999 for ANN gives Mea NO basic-pay toast; Jinky sees −₱500 / +₱300 / 2 × −₱100 = −₱200, the amount box on the draft, and the toast "basic pay (₱8,000)" (16,000 ÷ 2); Josh: EDER −₱500 shown, ANN 🔒',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);fix();
    const view=id=>{openMemoView(id);const mv=document.getElementById('memoViewModal');const rows=[...mv.querySelectorAll('.memo-impact-amt')].map(x=>x.textContent.trim());
      const tot=mv.querySelector('.memo-impact-total');const t=tot?tot.querySelectorAll('span')[1].textContent.trim():'';mv.classList.remove('open');return {rows,t};};
    const look=u=>{as(u);const a=view('PH1'),b=view('PO1'),c=view('PG1');
      openMemoEdit('PD1');const lockBox=!!document.querySelector('#memoModalBody [data-memo-amt-lock]'),amtBox=!!document.getElementById('memoHrAmt');closeMemoModal();
      openMemoCreate('hr');const newBox=!!document.getElementById('memoHrAmt');toasts.length=0;_editingMemoData.empId='O1';memoUpdateHrAmount('-999999');const basicToast=toasts.filter(t=>/basic pay/.test(t));closeMemoModal();
      return {eder:a.rows.join('|')+'='+a.t,ann:b.rows.join('|')+'='+b.t,gh3:c.rows.join('|')+'='+c.t,lockBox,amtBox,newBox,basicToast:basicToast.length,basic8000:basicToast.some(t=>/basic pay \\(₱8,000/.test(t))};};
    const mea=look('meajean'),jinky=look('jinky'),josh=look('josh');
    return {mea,jinky,josh};})();`),
  expect:{'mea.eder':'🔒=🔒','mea.ann':'🔒=🔒','mea.gh3':'🔒|🔒=🔒','mea.lockBox':true,'mea.amtBox':false,'mea.newBox':true,'mea.basicToast':0,
    'jinky.eder':'−₱500=−₱500','jinky.ann':'+₱300=+₱300','jinky.gh3':'−₱100|−₱100=−₱200','jinky.lockBox':false,'jinky.amtBox':true,'jinky.basicToast':1,'jinky.basic8000':true,
    'josh.eder':'−₱500=−₱500','josh.ann':'🔒=🔒','josh.gh3':'−₱100|−₱100=−₱200'} },

{ name:'📅 Memos of the day v23.52 — Mea (HR edit, no 💰 / 🏢): full list of the 5 memos but money:false — every amount null, totals null, the Excel "Memo lines" sheet has no Amount (₱) / Memo total (₱) column and no ₱ anywhere; Josh (💰, no 🏢): money:true, EDER −500, GH3 −100 × 2, ANN 🔒 Office pay (amountHidden, amount null); Jinky: ANN +300 shown, net −₱500 + 300 − 200 − 200 = −₱600',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);fix();
    async function XL(go){let blob=null;const oc=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{blob=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};
      try{await go();await sleep(800);}finally{URL.createObjectURL=oc;HTMLAnchorElement.prototype.click=ck;}
      const wb=new ExcelJS.Workbook();await wb.xlsx.load(await blob.arrayBuffer());return wb;}
    const PESO=wb=>wb.worksheets.some(ws=>{let f=false;ws.eachRow({includeEmpty:false},r=>{(r.values||[]).forEach(v=>{if(/₱\\s?\\d/.test(String(v==null?'':(typeof v==='object'?JSON.stringify(v):v))))f=true;});});return f;});
    const look=async u=>{as(u);const M=hnxMemoDay.model(today,today,{});const by={};(M.memos||[]).forEach(m=>{by[m.id]={tot:m.total,hid:m.amountHidden,p:m.people.map(p=>p.amount)};});
      const wb=await XL(()=>hnxMemoDay.excel({from:today,to:today}));const ws=wb.getWorksheet('Memo lines');let H=[];for(let r=1;r<=10;r++){const v=ws.getRow(r).values;if(v&&v.indexOf('Memo no.')>=0){H=v.filter(Boolean);break;}}
      return {money:!!M.scope.money,full:!!M.scope.full,n:(M.memos||[]).length,eder:by.PH1,ann:by.PO1,gh3:by.PG1,net:M.sum.net,cols:H.filter(c=>/₱/.test(c)).length,xlPeso:PESO(wb)};};
    return {mea:await look('meajean'),josh:await look('josh'),jinky:await look('jinky')};})();`),
  expect:{'mea.money':false,'mea.full':true,'mea.n':5,'mea.eder':{tot:null,hid:false,p:[null]},'mea.ann':{tot:null,hid:false,p:[null]},'mea.gh3':{tot:null,hid:false,p:[null,null]},'mea.net':null,'mea.cols':0,'mea.xlPeso':false,
    'josh.money':true,'josh.eder':{tot:-500,hid:false,p:[-500]},'josh.ann':{tot:null,hid:true,p:[null]},'josh.gh3':{tot:-200,hid:false,p:[-100,-100]},'josh.cols':2,
    'jinky.money':true,'jinky.ann':{tot:300,hid:false,p:[300]},'jinky.net':-600} },

{ name:'📁 201 memos · 📈 GH Analytics · 🧮 Memo Matrix v23.52 — Mea: the 201 Memos Archived amount of EDER reads 🔒 (no ₱500), the 201 JSON export carries no dailyRate / monthlyBasic and amount "🔒"; the GH Analytics scorecard shows 🔒 for Net ₱ and the drill (no ₱ figure); the Memo Matrix chip tip ends "· 🔒" (no "· ₱"); Jinky: −₱500 on the 201 list, dailyRate 658 in the export, −₱500.00 on the scorecard, "· ₱500" on the chip',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);fix();
    const emp=employees.find(e=>e.id==='W1');
    const look=async u=>{as(u);
      window._hr201SelectedId='W1';renderHr201();const v201=document.getElementById('view-hr_201');const sec=[...v201.querySelectorAll('details.hr201-section')].find(d=>/Memos Archived/.test(d.textContent));
      const td=sec?(([...sec.querySelectorAll('tbody tr')][0]||{querySelectorAll:()=>[]}).querySelectorAll('td')[3]||{}).textContent||'':'(no section)';window._hr201SelectedId=null;
      let pack=null;const oc=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;let blob=null;URL.createObjectURL=b=>{blob=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};
      try{window._hr201ExportJSON('W1');await sleep(200);pack=JSON.parse(await blob.text());}finally{URL.createObjectURL=oc;HTMLAnchorElement.prototype.click=ck;}
      _hnxGHA.gh('ALL');_hnxGHA.from(today);_hnxGHA.to(today);_hnxGHA.tab('emp');_hnxGHA.emp('W1');await sleep(300);
      const host=document.getElementById('ghAnaBody');const txt=host?host.textContent:'';const row=host?(host.querySelector('tr[data-emp="W1"]')||{}).textContent||'':'';
      const dr=host?host.querySelector('.hnx-gha-drill'):null;const dt=dr?dr.textContent:'';
      switchView('memo_matrix');await sleep(300);__memoMxSet('from',today);__memoMxSet('until',today);await sleep(500);
      const tips=[...document.querySelectorAll('#view-memo_matrix span[title]')].map(x=>x.getAttribute('title'));
      return {amt:td.trim(),rate:pack.employee.dailyRate===undefined?'none':pack.employee.dailyRate,leftOut:!!pack.employee._payLeftOut,xAmt:pack.memos[0]&&pack.memos[0].amount,
        rowLock:/🔒/.test(row),rowPeso:peso(row),drillLock:/🔒/.test(dt),drillPeso:peso(dt),drillN:(dt.match(/\\[(paid|waiting ①|waiting ②)\\]/g)||[]).length,
        tipLock:tips.some(t=>/· 🔒$/.test(t)),tipPeso:tips.some(t=>/· ₱/.test(t)),tip500:tips.some(t=>/· ₱500$/.test(t)),tips:tips.length};};
    const mea=await look('meajean'),jinky=await look('jinky');
    return {mea,jinky};})();`),
  expect:{'mea.amt':'🔒','mea.rate':'none','mea.leftOut':true,'mea.xAmt':'🔒','mea.rowLock':true,'mea.rowPeso':false,'mea.drillLock':true,'mea.drillPeso':false,'mea.drillN':1,'mea.tipLock':true,'mea.tipPeso':false,
    'jinky.amt':'−₱500','jinky.rate':658,'jinky.leftOut':false,'jinky.xAmt':-500,'jinky.rowLock':false,'jinky.rowPeso':true,'jinky.drillPeso':true,'jinky.drillN':1,'jinky.tip500':true,'jinky.tipLock':false} },

{ name:'🎁 Referral Bonuses v23.52 — Mea: hnxSensViewAllowed(hr_referrals) false, no 🎁 sub-tab in HR, switchView refused (🔒 toast, __lastNavDenied), the screen renders the lock with no "PHP 1,500", the 201 card of EDER shows 🔒 for the bonus / Bonuses earned and no "Manage all referrals" button, 💰 Pay Now refused (status stays qualified); Josh (💰, not on the pay list) the same lock; Jinky: tab listed, 1 row with PHP 1,500, 201 card PHP 1,500 + the button',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);
    const emp=employees.find(e=>e.id==='W1');
    const look=async u=>{as(u);const allowed=!!hnxSensViewAllowed('hr_referrals');
      switchView('hr');await sleep(900);const tab=!!document.querySelector('#modTab-hr_referrals');
      toasts.length=0;window.__lastNavDenied='';switchView('hr_referrals');await sleep(300);const denied=window.__lastNavDenied==='hr_referrals',lockToast=toasts.some(t=>/🔒/.test(t));
      renderHrReferrals();const v=document.getElementById('view-hr_referrals');const html=v?v.innerHTML:'';
      window._hr201SelectedId='W1';renderHr201();const card=document.getElementById('view-hr_201').innerHTML;window._hr201SelectedId=null;const i=card.indexOf('🎁 Referral Bonuses');const seg=i>=0?card.slice(i,i+2600):'';
      toasts.length=0;window._payReferral('R1','manual');const st=(JSON.parse(localStorage.getItem('hydroPro_hr_referrals'))[0]||{}).status;
      return {allowed,tab,denied,lockToast,lock:/data-ref-lock/.test(html),rows:(html.match(/PHP 1,500/g)||[]).length,cardLock:/🔒/.test(seg),cardPeso:/PHP 1,500/.test(seg),manage:/Manage all referrals/.test(seg),payToast:toasts.some(t=>/🔒 Only Jinky/.test(t)),st};};
    const mea=await look('meajean'),josh=await look('josh'),jinky=await look('jinky');
    return {mea,josh,jinky};})();`),
  expect:{'mea.allowed':false,'mea.tab':false,'mea.denied':true,'mea.lockToast':true,'mea.lock':true,'mea.rows':0,'mea.cardLock':true,'mea.cardPeso':false,'mea.manage':false,'mea.payToast':true,'mea.st':'qualified',
    'josh.allowed':false,'josh.lock':true,'josh.rows':0,'josh.st':'qualified',
    'jinky.allowed':true,'jinky.tab':true,'jinky.denied':false,'jinky.lock':false,'jinky.rows':3,'jinky.cardPeso':true,'jinky.cardLock':false,'jinky.manage':true} },

{ name:'🚚 Trips v23.52 — syra (operator, Logistics / Fleet view, no 💰) opens Logistics ▸ 🚚 Trips: the day row of DANTE (1st ALABANG → 2nd CLARK) shows 🔒 in Driver ₱, no "(D ₱500" leg text, no "· ₱" in the area pick lists, no 🧮 Rate Table tab, no 🩺 Trip Doctor button, hnxTripDoctor() does not open and its report carries no ₱ figure; Jinky on the Fleet copy: 500.00 in the row, "(D ₱500", "· ₱500" options, the 🩺 button and the overlay',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);
    const RK='hydroPro_trip_rates_v1',LK='hydroPro_trip_log_v1';
    switchView('pay_trips');await sleep(2200);
    const r=JSON.parse(localStorage.getItem(RK)||'{}');r.live=JSON.parse(JSON.stringify(r.draft));r.liveApprovedBy='tester';r.liveApprovedAt=Date.now();r.draftDirty=false;localStorage.setItem(RK,JSON.stringify(r));
    localStorage.setItem(LK,JSON.stringify([{id:'t1',date:today,driverId:'D1',helperId:'',truck:'V1',trips:['alabang','clark'],status:'approved'}]));
    const look=async(u,vid)=>{as(u);switchView('pay_dash');await sleep(300);switchView(vid);await sleep(2800);
      const v=document.getElementById('view-'+vid);const lines=(v.innerText||'').split('\\n').map(x=>x.replace(/\\s+/g,' ').trim());
      const row=lines.find(x=>/DANTE/.test(x)&&/1st /.test(x))||'(no row)';
      const opts=[...v.querySelectorAll('select option')].map(o=>o.textContent);
      const tabs=[...v.querySelectorAll('button')].map(b=>b.textContent).filter(t=>/Rate Table/.test(t)).length;
      const btn=!!v.querySelector('#hnxTripDocBtn');
      hnxTripDoctor();await sleep(200);const wrap=document.getElementById('hnxTripDocWrap');const open=!!wrap;if(wrap)wrap.remove();
      const rep=window.__hnxTripDoc.report();
      return {row,rowLock:/🔒/.test(row),rowLeg:/\\(D ₱500/.test(row),row500:/500\\.00/.test(row),optPeso:opts.some(t=>/· ₱/.test(t)),opt500:opts.some(t=>/· ₱500/.test(t)),tabs,btn,open,repPeso:peso(rep)};};
    const syra=await look('syra','log_trips'),jinky=await look('jinky','fleet_trips');
    return {syra,jinky};})();`),
  expect:{'syra.rowLock':true,'syra.rowLeg':false,'syra.row500':false,'syra.optPeso':false,'syra.tabs':0,'syra.btn':false,'syra.open':false,'syra.repPeso':false,
    'jinky.rowLock':false,'jinky.rowLeg':true,'jinky.row500':true,'jinky.opt500':true,'jinky.btn':true,'jinky.open':true,'jinky.repPeso':true} },

{ name:'📜 Audit Log v23.52 — Josh (admin_secondary, not on the pay name list) opens Administration ▸ Audit Log: "Approved … — ₱123,456.78" and "Allowances set for ANN OFFICE …" read "🔒 pay details", "Signed in from the office PC" stays, no ₱ figure on the screen; hnxAuditDetailFor masks the same rows for the export; Jinky and Eyal read ₱123,456.78 and the ₱100/day allowance line',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);
    const look=u=>{const x=as(u);renderAuditLog();const t=document.getElementById('auditTable').textContent.replace(/\\s+/g,' ');
      const mine=loadAuditLog().filter(e=>/^2026-10-17T01:0/.test(String(e.ts)));const d=mine.map(e=>hnxAuditDetailFor(e,x));
      return {can:!!can('viewAuditLog'),n:mine.length,locks:(t.match(/🔒 pay details/g)||[]).length>=2,run:/123,456\\.78/.test(t),allow:/₱100\\/day/.test(t),login:/Signed in from the office PC/.test(t),peso:peso(t),exp:d.filter(s=>s==='🔒 pay details').length,expLogin:d.indexOf('Signed in from the office PC')>=0};};
    return {josh:look('josh'),jinky:look('jinky'),eyal:look('eyal')};})();`),
  expect:{'josh.can':true,'josh.n':3,'josh.locks':true,'josh.run':false,'josh.allow':false,'josh.login':true,'josh.peso':false,'josh.exp':2,'josh.expLogin':true,
    'jinky.locks':false,'jinky.run':true,'jinky.allow':true,'jinky.exp':0,'eyal.locks':false,'eyal.run':true,'eyal.allow':true} },

{ name:'🚑 Storage Rescue v23.52 — Mea presses ⬇ Backup only: the file has NO hydroPro_payroll_runs, hydroPro_memos, hydroPro_weekend_approvals_v1 or hydroPro_training_level_rates, ANN keeps no monthlyBasic and EDER no dailyRate (_payLeftOut lists them), payLeftOut names the 4+ keys, the toast says "without the pay stores" and the screen carries the 🔒 note; syra the same; Jinky: the complete file (pp52_run in payroll runs, ANN 16000, EDER 658, no payLeftOut) and "Full backup downloaded"',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);
    localStorage.setItem('hydroPro_memos',JSON.stringify([{id:'M9',category:'hr',empId:'W1',totalAmount:-500,status:'draft'}]));
    const look=async u=>{as(u);let blob=null;const oc=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{blob=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};
      toasts.length=0;try{window.__hnxSpace.backup();await sleep(400);}finally{URL.createObjectURL=oc;HTMLAnchorElement.prototype.click=ck;}
      const j=JSON.parse(await blob.text()),D=j.data||{};const E=JSON.parse(D.hydroPro_employees||'[]');const ann=E.find(e=>e.id==='O1')||{},eder=E.find(e=>e.id==='W1')||{};
      hnxSpaceRescue();await sleep(300);const w=document.getElementById('hnxSpaceWrap');const note=!!(w&&w.querySelector('[data-space-paynote]'));if(w)w.remove();
      return {runs:D.hydroPro_payroll_runs===undefined?'left out':(/pp52_run/.test(D.hydroPro_payroll_runs)?'full':'other'),memos:D.hydroPro_memos===undefined?'left out':'in',wk:D.hydroPro_weekend_approvals_v1===undefined?'left out':'in',lvl:D.hydroPro_training_level_rates===undefined?'left out':'in',
        annMB:ann.monthlyBasic===undefined?'none':ann.monthlyBasic,ederRate:eder.dailyRate===undefined?'none':eder.dailyRate,ederLeft:Array.isArray(eder._payLeftOut)?eder._payLeftOut.indexOf('dailyRate')>=0:false,
        left:j.payLeftOut?j.payLeftOut.keys.length>=4:'none',toast:toasts.some(t=>/without the pay stores/.test(t))?'without':(toasts.some(t=>/Full backup downloaded/.test(t))?'full':toasts.join('|')),note,users:D.hydroPro_users!==undefined};};
    const mea=await look('meajean'),syra=await look('syra'),jinky=await look('jinky');
    return {mea,syra,jinky};})();`),
  expect:{'mea.runs':'left out','mea.memos':'left out','mea.wk':'left out','mea.lvl':'left out','mea.annMB':'none','mea.ederRate':'none','mea.ederLeft':true,'mea.left':true,'mea.toast':'without','mea.note':true,'mea.users':true,
    'syra.runs':'left out','syra.annMB':'none','syra.toast':'without',
    'jinky.runs':'full','jinky.memos':'in','jinky.annMB':16000,'jinky.ederRate':658,'jinky.ederLeft':false,'jinky.left':'none','jinky.toast':'full','jinky.note':false} },

{ name:'💰 Level rates · 👷 contractor v23.52 — an "accounting" role login without 💰: canManageTrainingRates false (Josh, admin_secondary: true); Mea\'s employee card: after onEmpLevelChange on L3 the #empLevelHint holds no ₱ (no "₱550/day") and stays hidden even after a Department change to a labour dept; Jinky sees "₱550/day" and the hint re-shown; hnxContrAdjAdd for the accounting login is refused with "🔒 Accounting and management only", for Josh it asks for amount and reason',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(2500);
    const lvl=u=>{as(u);const sel=document.getElementById('empLevel');sel.value='3';onEmpLevelChange();const h=document.getElementById('empLevelHint');
      const ds=document.getElementById('empDept');if(ds){if(![...ds.options].some(o=>o.value==='APTI_REGULAR')){const o=document.createElement('option');o.value='APTI_REGULAR';o.textContent='APTI - Regular';ds.appendChild(o);}ds.value='APTI_REGULAR';}onEmpDeptChange();
      toasts.length=0;hnxContrAdjAdd('W1');const t=toasts[0]||'';
      return {mgr:!!canManageTrainingRates(),cvs:!!canViewSalaries(),hint:h.innerHTML,peso:peso(h.innerHTML),r550:/₱550\\/day/.test(h.innerHTML),shown:h.style.display!=='none',labor:!!isLaborDept('APTI_REGULAR'),contr:/🔒 Accounting and management only/.test(t)?'locked':(/Amount and reason/.test(t)?'open':t)};};
    const acct=lvl('acct'),mea=lvl('meajean'),josh=lvl('josh'),jinky=lvl('jinky');
    return {acct,mea,josh,jinky};})();`),
  expect:{'acct.mgr':false,'acct.cvs':false,'acct.peso':false,'acct.shown':false,'acct.contr':'locked',
    'mea.mgr':false,'mea.peso':false,'mea.r550':false,'mea.shown':false,'mea.labor':true,'mea.contr':'locked',
    'josh.mgr':true,'josh.cvs':true,'josh.r550':true,'josh.shown':true,'josh.contr':'open',
    'jinky.mgr':true,'jinky.r550':true,'jinky.shown':true,'jinky.contr':'open'} }
];
