/* v22.52 (Eyal, 11 Oct 2026: "bring again the details of access or review or not each module to each user — why Josane see office
   salaries and loyalty program its NO NO"): 🏢 Office pay and 💎 Loyalty are owner-granted areas (default holders = the pay name list,
   the owner grants / takes away), QuickBooks pay lines are masked for everyone else, the Accounting payroll reports hide office lines,
   the loyalty guide carries no figures, and 🔐 Access matrix explains every user × module with the same reasons as 🔎 Access. */
const REQ="typeof window.hnxCanOfficePay==='function'&&!!window.HNXMATRIX";
const USERS=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'joshanee',fullname:'Joshane Espinosa',passwordHash:'x',role:'supervisor',department:'payroll',departments:['payroll','accounting','meetings'],salaryAccess:true,active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'admin_secondary',department:'accounting',departments:['payroll','accounting','hr'],active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'mea',fullname:'Meajean Magracia',passwordHash:'x',role:'admin',department:'hr',active:true}]));
  localStorage.setItem('hydroPro_employees',JSON.stringify([
    {id:'E1',name:'PAGTAMA, JINKY',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:30000,dateHired:'2025-01-01'},
    {id:'L1',name:'ARABIS, ANGELYN',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01'}]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));const U=n=>loadUsers().find(x=>x.username===n);";
module.exports=[
{ name:'🔐 Owner-granted areas: Joshane (supervisor · payroll+accounting+meetings · 💰 on) → office false, loyalty false, payroll none, accounting edit, labor canViewSalaries true, managePayroll false; owner all true; Jinky (pay name list) office+loyalty true; owner takes Jinky\'s office away → false (loyalty stays), gives it back → true {on:true,by:tester}; Eyal can never be locked out (v22.52)',
  requires:REQ, seed:USERS,
  run:new Function(`return (async()=>{${AS}await sleep(5000);
    as('joshanee');const J=U('joshanee');
    const josh=[hnxCanOfficePay(),hnxCanLoyalty(),getEffectiveModuleAccess(J,'payroll'),getEffectiveModuleAccess(J,'accounting'),canViewSalaries(),can('managePayroll')].join('|');
    as('tester');const owner=[hnxCanOfficePay(),hnxCanLoyalty()].join('|');
    const jinky0=[hnxCanOfficePay(U('jinky')),hnxCanLoyalty(U('jinky'))].join('|');
    const r1=HNXSENS.revoke('jinky','office');const jinky1=[hnxCanOfficePay(U('jinky')),hnxCanLoyalty(U('jinky'))].join('|');
    const r2=HNXSENS.grant('jinky','office');const jinky2=hnxCanOfficePay(U('jinky'));
    const st=JSON.parse(localStorage.getItem('hydroPro_user_perms')).jinky.sensitive.office;
    const eyalLock=HNXSENS.revoke('eyal','office');const eyalOK=[hnxCanOfficePay(U('eyal')),hnxCanLoyalty(U('eyal'))].join('|');
    return {josh,owner,jinky0,r1,jinky1,r2,jinky2,by:st.by,on:st.on,eyalLock,eyalOK};})();`),
  expect:{josh:'false|false|none|edit|true|false',owner:'true|true',jinky0:'true|true',r1:true,jinky1:'false|true',r2:true,jinky2:true,by:'tester',on:true,eyalLock:false,eyalOK:'true|true'} },

{ name:'🛡 Only the owner decides: a grant by Jinky (not an owner) is refused; forged entries (by:joshanee, by:jinky) are ignored → office false; Dr Amy grants Joshane loyalty → true; nobody changes their own; Reset of overrides keeps the grant; sync merge: a NEWER whole entry without .sensitive keeps the older grant, a newer revoke from the cloud beats an older local grant (v22.52)',
  requires:REQ, seed:function(){(USERS)();localStorage.setItem('hydroPro_user_perms',JSON.stringify({joshanee:{overrides:{},updatedAt:'2026-10-11T00:00:00.000Z',sensitive:{office:{on:true,by:'joshanee',at:'2026-10-11T00:00:00.000Z'}}}}));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  run:new Function(`return (async()=>{${AS}await sleep(5000);
    as('jinky');const g1=HNXSENS.grant('joshanee','office');
    const forged1=hnxCanOfficePay(U('joshanee'));
    let P=JSON.parse(localStorage.getItem('hydroPro_user_perms'));P.joshanee.sensitive.office={on:true,by:'jinky',at:new Date().toISOString()};localStorage.setItem('hydroPro_user_perms',JSON.stringify(P));
    const forged2=hnxCanOfficePay(U('joshanee'));
    as('amy');const g2=HNXSENS.grant('joshanee','loyalty');const loy=hnxCanLoyalty(U('joshanee'));const offStill=hnxCanOfficePay(U('joshanee'));
    const self=HNXSENS.revoke('amy','office');
    clearUserOverrides('joshanee');const keep=hnxCanLoyalty(U('joshanee'));
    const L={joshanee:{overrides:{},updatedAt:'2026-10-11T05:00:00.000Z',sensitive:{loyalty:{on:true,by:'amy',at:'2026-10-11T05:00:00.000Z'}}}};
    const R={joshanee:{overrides:{'module:hr':'view'},updatedAt:'2026-10-11T06:00:00.000Z'}};
    const m1=JSON.parse(window.__hnxMergePerms(JSON.stringify(L),JSON.stringify(R))).joshanee;
    const L2={joshanee:{overrides:{},updatedAt:'2026-10-11T07:00:00.000Z',sensitive:{loyalty:{on:true,by:'amy',at:'2026-10-11T05:00:00.000Z'}}}};
    const R2={joshanee:{overrides:{},updatedAt:'2026-10-11T04:00:00.000Z',sensitive:{loyalty:{on:false,by:'tester',at:'2026-10-11T06:30:00.000Z'}}}};
    const m2=JSON.parse(window.__hnxMergePerms(JSON.stringify(L2),JSON.stringify(R2))).joshanee;
    return {g1,forged1,forged2,g2,loy,offStill,self,keep,m1keeps:!!(m1.sensitive&&m1.sensitive.loyalty&&m1.sensitive.loyalty.on===true),m1ov:m1.overrides['module:hr'],m2revoke:m2.sensitive.loyalty.on};})();`),
  expect:{g1:false,forged1:false,forged2:false,g2:true,loy:true,offStill:false,self:false,keep:true,m1keeps:true,m1ov:'view',m2revoke:false} },

{ name:'🔐 explain(): Joshane accounting EDIT "department: accounting", payroll NONE "pay lock … department: payroll does not open it" (locked), hr NONE "strict by default — not granted", overview EDIT "always on"; admin-role "mea" (not the System Admin login) payroll NONE; 🔎 Access card gives the same reason; matrix as owner cycles hr none→view→edit→none, Alt-reset removes the key, payroll refused; as Joshane nothing changes; 30 users × every module + 3 areas in < 300 ms; the matrix fits a 1512 px laptop with a sticky header and first column (v22.52)',
  requires:REQ, viewport:{width:1512,height:900},
  seed:function(){(USERS)();var U=JSON.parse(localStorage.getItem('hydroPro_users'));for(var i=0;i<24;i++)U.push({username:'u'+i,fullname:'User '+i,passwordHash:'x',role:i%3?'supervisor':'operator',department:['production','hr','maintenance','accounting'][i%4],active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  run:new Function(`return (async()=>{${AS}await sleep(5000);window.showToast=()=>{};window.confirm=()=>true;
    const J=U('joshanee');const e=m=>HNXMATRIX.explain(J,m);
    const acc=e('accounting'),pay=e('payroll'),hr=e('hr'),ov=e('overview');
    localStorage.removeItem('hnx_test_harness'); /* in the field only the System Admin login passes; the harness lets every admin through */
    const mea=HNXMATRIX.explain(U('mea'),'payroll');localStorage.setItem('hnx_test_harness','1');
    const card=HNXACCESS.why('joshanee').find(r=>r.module==='payroll');
    as('tester');
    const c1=HNXMATRIX.cycle('joshanee','hr'),o1=getUserOverrides('joshanee')['module:hr'];
    const c2=HNXMATRIX.cycle('joshanee','hr'),o2=getUserOverrides('joshanee')['module:hr'];
    const c3=HNXMATRIX.cycle('joshanee','hr'),o3=getUserOverrides('joshanee')['module:hr'];
    const rs=HNXMATRIX.reset('joshanee','hr'),o4=('module:hr' in getUserOverrides('joshanee'));
    const cp=HNXMATRIX.cycle('joshanee','payroll');
    as('joshanee');const cj=HNXMATRIX.cycle('u1','hr'),oj=('module:hr' in getUserOverrides('u1'));
    as('tester');
    const t0=performance.now();const R=HNXMATRIX.rows();const ms=performance.now()-t0;
    const cells=R.length*Object.keys(R[0].cells).length;
    HNXMATRIX.open('joshanee');await sleep(400);
    const box=document.querySelector('#hnxAccMatrix .mxbox'),w=document.querySelector('#hnxAccMatrix .mxw').getBoundingClientRect();
    const th=document.querySelector('#hnxAccMatrix thead th:nth-child(3)'),u1=document.querySelector('#hnxAccMatrix tbody td.u');
    const sticky=getComputedStyle(th).position==='sticky'&&getComputedStyle(u1).position==='sticky';
    const fits=w.right<=1512&&w.left>=0&&box.scrollWidth<=box.clientWidth+2;
    const josRow=[...document.querySelectorAll('#hnxAccMatrix tbody tr')].find(tr=>/joshanee/.test(tr.textContent));
    const offCell=josRow&&josRow.querySelector('td[data-k="sens"][data-m="office"]');
    HNXMATRIX.close();
    return {acc:[acc.access,acc.reason].join('|'),pay:[pay.access,/pay lock.*department: payroll does not open it/.test(pay.reason),pay.locked].join('|'),hr:[hr.access,hr.reason].join('|'),ov:[ov.access,ov.reason].join('|'),
      mea:mea.access+'|'+/pay lock/.test(mea.reason),cardSame:card.reason.indexOf('pay lock')>=0&&card.access==='none',
      cyc:[c1,o1,c2,o2,c3,o3].join(','),reset:rs&&!o4,payRefused:cp===false,joshRefused:cj===false&&!oj,
      fast:ms<300,cellsOK:cells>=30*20,sticky,fits,offCellTitle:!!offCell&&/not granted/.test(offCell.title),users:R.length};})();`),
  expect:{acc:'edit|department: accounting',pay:'none|true|true',hr:'none|strict by default — not granted',ov:'edit|always on',mea:'none|true',cardSame:true,
    cyc:'view,view,edit,edit,none,none',reset:true,payRefused:true,joshRefused:true,fast:true,cellsOK:true,sticky:true,fits:true,offCellTitle:true,users:30} },

{ name:'🔒 QuickBooks mask: as Joshane the TB keeps total debit ₱680,000 with "🔒 Office pay (restricted)" ₱30,000 and "🔒 Loyalty program (restricted)" ₱22,000, Production ₱150,000 and Bank ₱500,000 unchanged, no PAGTAMA / BEN ARI / loyalty account in the cache, trainee ARABIS kept; her write never reaches the stored cache; the owner sees the raw rows; a QuickBooks ledger call keeps the amount but the office payee reads "🔒 Office payroll" (labor payee kept) (v22.52)',
  requires:REQ,
  seed:function(){(USERS)();
    var raw={Header:{ReportName:'TrialBalance'},Columns:{Column:[{ColTitle:''},{ColTitle:'Debit'},{ColTitle:'Credit'}]},Rows:{Row:[
      {ColData:[{value:'- BP_Acctg_PAGTAMA, JINKY',id:'1'},{value:'30000.00'},{value:''}]},
      {ColData:[{value:'Accrued Loyalty Program Payable - Corporate',id:'2'},{value:''},{value:'22000.00'}]},
      {ColData:[{value:'COS_Salaries & Wages - Production',id:'3'},{value:'150000.00'},{value:''}]},
      {ColData:[{value:'Cash in Bank - BDO',id:'4'},{value:'500000.00'},{value:''}]},
      {ColData:[{value:'- Trainee_ARABIS, ANGELYN',id:'5'},{value:'8000.00'},{value:''}]},
      {ColData:[{value:'A/P - BIR - Withholding  Tax Payable-Compensation - BEN ARI, EYAL',id:'6'},{value:''},{value:'5000.00'}]}]}};
    var parsed={rows:[{account:'- BP_Acctg_PAGTAMA, JINKY',debit:30000,credit:0,ending:30000},{account:'Accrued Loyalty Program Payable - Corporate',debit:0,credit:22000,ending:-22000},
      {account:'COS_Salaries & Wages - Production',debit:150000,credit:0,ending:150000},{account:'Cash in Bank - BDO',debit:500000,credit:0,ending:500000}],totalDebit:680000,totalCredit:22000,balanced:false};
    localStorage.setItem('hydroPro_acct_qb_v1',JSON.stringify({APTI:{tb:{at:Date.now(),raw:raw,parsed:parsed}}}));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  drive:async(pg)=>{
    const gl={Header:{ReportName:'GeneralLedger'},Rows:{Row:[{type:'Section',Header:{ColData:[{value:'Cash in Bank - BDO'}]},Rows:{Row:[
      {type:'Data',ColData:[{value:'2026-10-10'},{value:'Check'},{value:'101'},{value:'PAGTAMA, JINKY'},{value:'Salary 26 Sep-10 Oct'},{value:'- BP_Acctg_PAGTAMA, JINKY'},{value:'-27500.00'},{value:'472500.00'}]},
      {type:'Data',ColData:[{value:'2026-10-10'},{value:'Check'},{value:'102'},{value:'ARABIS, ANGELYN'},{value:'Wages week 40'},{value:'Payroll Clearing_Net Pay_Weekly'},{value:'-4100.00'},{value:'468400.00'}]}]},
      Summary:{ColData:[{value:'Total for Cash in Bank - BDO'},{value:''},{value:''},{value:''},{value:''},{value:''},{value:'-31600.00'},{value:''}]}}]}};
    await pg.route(u=>u.hostname==='127.0.0.1'&&u.pathname.indexOf('/api/qb/')===0,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(gl)}));return 'routed';},
  run:new Function(`return (async()=>{${AS}await sleep(5000);
    as('joshanee');const qb=JSON.parse(localStorage.getItem('hydroPro_acct_qb_v1'));const R=qb.APTI.tb.parsed.rows;const txt=JSON.stringify(qb);
    const off=R.find(r=>r.account.indexOf('🔒 Office pay (restricted)')===0),loy=R.find(r=>r.account.indexOf('🔒 Loyalty program (restricted)')===0);
    const tDebit=R.reduce((a,r)=>a+(r.debit||0),0),prod=R.find(r=>r.account==='COS_Salaries & Wages - Production'),bank=R.find(r=>r.account==='Cash in Bank - BDO');
    const raw0=qb.APTI.tb.raw.Rows.Row.map(r=>r.ColData[0].value);
    qb.APTI.tb.at=1;localStorage.setItem('hydroPro_acct_qb_v1',JSON.stringify(qb));const mine=JSON.parse(localStorage.getItem('hydroPro_acct_qb_v1')).APTI.tb.at;
    const res=await fetch('/api/qb/apti/general-ledger?start_date=2026-10-01&end_date=2026-10-31');const gl=await res.json();
    const rows=gl.Rows.Row[0].Rows.Row.map(r=>r.ColData.map(c=>c.value));
    as('tester');const own=JSON.parse(localStorage.getItem('hydroPro_acct_qb_v1'));const ownTxt=JSON.stringify(own);
    const res2=await fetch('/api/qb/apti/general-ledger?x=2');const gl2=await res2.json();
    return {noName:!/PAGTAMA|BEN ARI|Loyalty Program Payable/.test(txt),off:off&&off.debit,loy:loy&&loy.credit,tDebit,totalKept:qb.APTI.tb.parsed.totalDebit,prod:prod&&prod.debit,bank:bank&&bank.debit,
      trainee:raw0.includes('- Trainee_ARABIS, ANGELYN'),rawLocks:raw0.filter(x=>/^🔒 /.test(x)).length,
      joshSees:mine,ownerUntouched:own.APTI.tb.at!==1&&/BP_Acctg_PAGTAMA, JINKY/.test(ownTxt)&&/Accrued Loyalty Program Payable/.test(ownTxt),
      payee:rows[0][3],memo:rows[0][4],split:rows[0][5],amt:rows[0][6],laborPayee:rows[1][3],ownerPayee:gl2.Rows.Row[0].Rows.Row[0].ColData[3].value};})();`),
  expect:{noName:true,off:30000,loy:22000,tDebit:680000,totalKept:680000,prod:150000,bank:500000,trainee:true,rawLocks:3,joshSees:1,ownerUntouched:true,
    payee:'🔒 Office payroll',memo:'Salary 26 Sep-10 Oct',split:'🔒 Office payroll',amt:'-27500.00',laborPayee:'ARABIS, ANGELYN',ownerPayee:'PAGTAMA, JINKY'} },

{ name:'📂 Accounting reports for Joshane (💰 on, no office pay): Payroll Report shows the labor run ₱120,000 only with "🔒 Office lines hidden (1)" and "labor only"; Alphalist has no PAGTAMA; pasted payroll CSV shows 🔒 Restricted; 1601-C null; Office Payroll card 🔒 — the owner sees both runs, the pasted table and the card amount (v22.52)',
  requires:REQ,
  seed:function(){(USERS)();var Y=new Date().getFullYear();
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_'+Y+'-09-26_'+Y+'-10-10',type:'semi_monthly',periodStart:Y+'-09-26',periodEnd:Y+'-10-10',status:'approved',approvedAt:1,totals:{netPay:50000},lines:[{empId:'E1',name:'PAGTAMA, JINKY',grossPay:55000,grossEarnings:55000,totalGovDed:2000,withholdingTax:3000,netPay:50000,taxBase:53000}]},
      {id:'ops_'+Y+'-09-27_'+Y+'-10-03',type:'weekly',periodStart:Y+'-09-27',periodEnd:Y+'-10-03',status:'approved',approvedAt:1,totals:{netPay:120000},lines:[{empId:'L1',name:'ARABIS, ANGELYN',grossPay:125000,grossEarnings:125000,totalGovDed:5000,withholdingTax:0,netPay:120000,taxBase:120000}]}]));
    localStorage.setItem('hydroPro_acct_csv_v1',JSON.stringify({APTI:{pay:'Name,Gross\nPAGTAMA JINKY,55000',alpha:'Name,Gross\nPAGTAMA JINKY,55000'}}));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  run:new Function(`return (async()=>{${AS}await sleep(5000);const Y=new Date().getFullYear();
    const rep=async(k)=>{window.__hnxACC.navLeaf('reports','rep',k);await sleep(700);return (document.getElementById('hnxaccOverlay')||{}).innerText||'';};
    as('joshanee');window.__hnxACC.open();await sleep(500);const jp=await rep('pay'),ja=await rep('alpha');window.__hnxACC.close();
    const j1601=window.__hnxACC.payroll1601(Y);switchView('acct_dash');await sleep(700);const jd=(document.getElementById('view-acct_dash')||{}).innerText||'';
    as('tester');window.__hnxACC.open();await sleep(500);const tp=await rep('pay'),ta=await rep('alpha');window.__hnxACC.close();
    const t1601=window.__hnxACC.payroll1601(Y);switchView('acct_dash');await sleep(700);const td=(document.getElementById('view-acct_dash')||{}).innerText||'';
    return {jHidden:/Office lines hidden \\(1\\)/.test(jp),jLabor:/120,000\\.00/.test(jp)&&!/50,000\\.00/.test(jp),jLaborOnly:/labor only/.test(jp),jCsv:/Restricted/.test(jp)&&!/PAGTAMA JINKY/.test(jp),
      jAlpha:!/PAGTAMA/.test(ja)&&/ARABIS/.test(ja),j1601:j1601===null,jCard:/Office Payroll \\(latest\\)\\s*🔒/i.test(jd),
      tBoth:/120,000\\.00/.test(tp)&&/50,000\\.00/.test(tp)&&!/Office lines hidden/.test(tp),tCsv:/PAGTAMA JINKY/.test(tp),tAlpha:/PAGTAMA/.test(ta),t1601:!!t1601,tCard:/50,000\\.00/.test(td)};})();`),
  expect:{jHidden:true,jLabor:true,jLaborOnly:true,jCsv:true,jAlpha:true,j1601:true,jCard:true,tBoth:true,tCsv:true,tAlpha:true,t1601:true,tCard:true} },

{ name:'💎 Menus, ⌘K and Help: Joshane\'s Accounting tabs have no 💰 Loyalty Savings, ⌘K "loyalty" lists no Loyalty Savings / Office Payroll screen, the Help centre hides the loyalty guide and opening it by id shows nothing of it; the owner sees all three; no guide carries the loyalty figures (219,000 / 10,000 / Taladtad / Joshane) (v22.52)',
  requires:REQ, seed:USERS,
  run:new Function(`return (async()=>{${AS}await sleep(6000);
    try{window.NexiNavRefresh&&NexiNavRefresh();}catch(e){}
    const look=async()=>{const tabs=getVisibleViews('accounting').map(v=>v.id);
      let s='';try{if(window.hnxSearchOpen)hnxSearchOpen();hnxSearchRun('loyalty');await sleep(150);s=(document.getElementById('hnxSearchList')||{}).innerText||'';hnxSearchRun('office payroll');await sleep(150);s+=' || '+((document.getElementById('hnxSearchList')||{}).innerText||'');hnxSearchClose();}catch(e){s='ERR '+e;}
      let h='';try{HNX_HELP.open('acct_loyalty');await sleep(300);h=(document.getElementById('hnxhOv')||{}).innerText||'';HNX_HELP.close&&HNX_HELP.close();}catch(e){h='ERR '+e;}
      return {loyTab:tabs.includes('acct_loyalty'),cmdK:/loyalty savings/i.test(s),cmdKOffice:/office payroll/i.test(s),help:/BDO Short Term Fund UITF/.test(h)};};
    as('joshanee');const j=await look();as('tester');const t=await look();
    const all=JSON.stringify(window.HNX_HELP_GUIDES||[]);
    return {j,t,figures:/219,000|₱10,000 \\/ ₱10,000|Taladtad|such as Joshane/.test(all),sens:(window.HNX_HELP_GUIDES||[]).filter(g=>g.sens==='loyalty').map(g=>g.id).join(',')};})();`),
  expect:{j:{loyTab:false,cmdK:false,cmdKOffice:false,help:false},t:{loyTab:true,cmdK:true,cmdKOffice:true,help:true},figures:false,sens:'acct_loyalty'} },

{ name:'🗂 Repo: no served page carries the QuickBooks pay export or the loyalty figures — every old root copy with APP_VERSION / QBPAY is redirected by _redirects (index, next, prev, driver are not), prev.html is scrubbed, and no nexidoc guide holds "219,000" (v22.52)',
  drive:async()=>{const fs=require('fs'),path=require('path'),cp=require('child_process');const root=path.resolve(__dirname,'../..');
    const red=fs.existsSync(path.join(root,'_redirects'))?fs.readFileSync(path.join(root,'_redirects'),'utf8'):'';
    const redirected=new Set(red.split('\n').map(l=>l.trim().split(/\s+/)[0]).filter(x=>x&&x[0]==='/').map(x=>decodeURIComponent(x.slice(1))));
    const html=fs.readdirSync(root).filter(f=>/\.html$/.test(f));
    const keep=['index.html','next.html','prev.html'];const appRefs=['driver.html'];
    const leakyOld=[],served=[],servedLeaks=[];
    for(const f of html){const s=fs.readFileSync(path.join(root,f),'utf8');const old=/APP_VERSION|var QBPAY=\{"months"/.test(s);
      if(!keep.includes(f)&&old&&!redirected.has(f))leakyOld.push(f);
      if(!redirected.has(f)){served.push(f);if(/^var QBPAY=\{"months".*"rows":\[\{/m.test(s)||/219,000|₱10,000 \/ ₱10,000|Taladtad short/.test(s))servedLeaks.push(f);}}
    const wrongly=keep.concat(appRefs).filter(f=>redirected.has(f));
    let doc='';try{doc=cp.execFileSync('python3',['-c',"import zipfile,glob,sys\nfor f in sorted(glob.glob(sys.argv[1]+'/nexidoc/**/*',recursive=True)):\n  try:\n    b=b''.join(zipfile.ZipFile(f).read(n) for n in zipfile.ZipFile(f).namelist()) if f.endswith(('.docx','.xlsx')) else open(f,'rb').read()\n  except Exception: continue\n  if '219,000'.encode() in b: print(f)",root]).toString().trim();}catch(e){doc='ERR '+e.message;}
    return {leakyOld,servedLeaks,wrongly,doc,redirects:redirected.size>50};},
  expect:{'drive.leakyOld':[],'drive.servedLeaks':[],'drive.wrongly':[],'drive.doc':'','drive.redirects':true} },

{ name:'🚦 Office payroll screen follows the owner\'s decision: Jinky (no grant written) opens 🏢 Office Payroll; after the owner takes office pay away she gets "🔒 Office salaries are owner-granted" and the screen stays shut, Labor payroll still opens; Joshane never opens either (v22.52)',
  requires:REQ, seed:USERS,
  run:new Function(`return (async()=>{${AS}await sleep(5000);let msg='';window.showToast=(m)=>{msg+=' | '+String(m);};window._toast=window.showToast;
    const open=async v=>{document.querySelectorAll('.view.active').forEach(x=>x.classList.remove('active')); /* the previous person's screen (a sign-out clears it the same way) */msg='';try{switchView(v);}catch(e){}const el=document.getElementById('view-'+v);const on=!!(el&&el.classList.contains('active'));await sleep(500);return {on,msg};};
    as('joshanee');const s1=await open('payroll_office'),s2=await open('payroll_ops');
    as('jinky');const j1=await open('payroll_office');
    as('tester');const rv=HNXSENS.revoke('jinky','office');
    as('jinky');const j2=await open('payroll_office');const j3=await open('payroll_ops');
    return {jinkyOpens:j1.on,rv,refused:!j2.on&&/owner-granted/.test(j2.msg),labor:j3.on,joshOffice:s1.on,joshLabor:s2.on,joshMsg:/Payroll is visible only/.test(s2.msg)};})();`),
  expect:{jinkyOpens:true,rv:true,refused:true,labor:true,joshOffice:false,joshLabor:false,joshMsg:true} },
/* ---- review of v22.52: the confirmed findings, each as a rule ---- */
{ name:'🏦 Bank & Card Recon for an accountant without 🏢 (Rosa, department accounting): the PAGTAMA ₱-27,500.00 QuickBooks line reads "🔒 Office payroll" on screen, in the 🔗 link list and in the CSV, ARABIS ₱-4,100.00 stays; her own ledger pull stores the REAL payee (synced store has PAGTAMA, no 🔒); the owner sees PAGTAMA (v22.52 review)',
  requires:REQ,
  seed:function(){(USERS)();var U=JSON.parse(localStorage.getItem('hydroPro_users'));U.push({username:'rosa',fullname:'Rosa Reyes',passwordHash:'x',role:'supervisor',department:'accounting',departments:['accounting'],active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({rosa:{overrides:{'module:bankrecon':'edit'},updatedAt:'2026-10-11T00:00:00.000Z',updatedBy:'tester'}}));
    localStorage.setItem('hydroPro_recon_v1',JSON.stringify({v2:1,v3:1,accounts:{a1:{name:'Cash in Bank - BDO',company:'APTI',type:'bank',sourceClass:'bank',installments:[],chartNo:'1011-002'}},
      sets:{'a1::2026-10':{acctId:'a1',period:'2026-10',createdAt:1,vari:[],
        lines:[{ref:'S1',date:'2026-10-10',amt:-27500,desc:'TRANSFER 101',period:'2026-10',qb:{uid:'u1',date:'2026-10-10',name:'PAGTAMA, JINKY',amt:-27500,ref:'101',acct:'- BP_Acctg_PAGTAMA, JINKY'}},
               {ref:'S2',date:'2026-10-10',amt:-999,desc:'BANK CHARGE',period:'2026-10'}],
        qb:[{date:'2026-10-10',amt:-27500,name:'PAGTAMA, JINKY',acct:'- BP_Acctg_PAGTAMA, JINKY',ref:'101',transactionId:'Check#101',uid:'u1',used:true},
            {date:'2026-10-10',amt:-1500,name:'PAGTAMA, JINKY',acct:'Cash in Bank - BDO',ref:'103',transactionId:'Check#103',uid:'u3',used:false},
            {date:'2026-10-10',amt:-4100,name:'ARABIS, ANGELYN',acct:'Cash in Bank - BDO',ref:'102',transactionId:'Check#102',uid:'u2',used:false}]}}}));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  drive:async(pg)=>{
    const gl={Header:{ReportName:'GeneralLedger'},Rows:{Row:[{type:'Section',Header:{ColData:[{value:'Cash in Bank - BDO'}]},Rows:{Row:[
      {type:'Data',ColData:[{value:'2026-10-10'},{value:'Check'},{value:'101'},{value:'PAGTAMA, JINKY'},{value:'Salary 26 Sep-10 Oct'},{value:'- BP_Acctg_PAGTAMA, JINKY'},{value:'-27500.00'},{value:'472500.00'}]},
      {type:'Data',ColData:[{value:'2026-10-10'},{value:'Check'},{value:'102'},{value:'ARABIS, ANGELYN'},{value:'Wages week 40'},{value:'Payroll Clearing_Net Pay_Weekly'},{value:'-4100.00'},{value:'468400.00'}]}]},
      Summary:{ColData:[{value:'Total for Cash in Bank - BDO'},{value:''},{value:''},{value:''},{value:''},{value:''},{value:'-31600.00'},{value:''}]}}]}};
    await pg.route(u=>u.pathname.indexOf('/api/qb/')>=0&&/general-ledger/.test(u.pathname),r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(gl)}));return 'routed';},
  run:new Function(`return (async()=>{${AS}await sleep(5000);window.showToast=()=>{};window._toast=window.showToast;
    window.XLSX={utils:{book_new:()=>({SheetNames:[],Sheets:{}}),aoa_to_sheet:a=>({__rows:a}),book_append_sheet:(wb,ws,n)=>{wb.SheetNames.push(n);wb.Sheets[n]=ws;},sheet_to_json:ws=>ws.__rows}};
    const view=async()=>{switchView('recon');await sleep(900);try{hnxReconPick('a1::2026-10');}catch(e){}await sleep(700);return (document.getElementById('view-recon')||{}).innerText||'';};
    const csv=async()=>{let b=null;const cu=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=x=>{b=x;return 'blob:none';};HTMLAnchorElement.prototype.click=function(){};
      try{hnxReconCsv();}finally{URL.createObjectURL=cu;HTMLAnchorElement.prototype.click=ck;}return b?await b.text():'';};
    const link=()=>{let m='';const p=window.prompt;window.prompt=x=>{m=String(x);return null;};try{hnxReconLink(1);}finally{window.prompt=p;}return m;};
    const store=()=>localStorage.getItem('hydroPro_recon_v1')||'';
    as('rosa');const office=hnxCanOfficePay();const t1=await view(),c1=await csv(),p1=link();
    await hnxReconQBPull();await sleep(800);const after=store();const t2=(document.getElementById('view-recon')||{}).innerText||'';
    const S=JSON.parse(after).sets['a1::2026-10'];
    as('tester');const t3=await view(),c3=await csv();
    const masked=t=>!/PAGTAMA/.test(t)&&/🔒 Office payroll/.test(t)&&/ARABIS/.test(t);
    return {office,screen:masked(t1),csv:masked(c1),link:!/PAGTAMA/.test(p1)&&/🔒 Office payroll/.test(p1)&&/ARABIS/.test(p1),
      pulled:(S.qb||[]).map(q=>q.name+' '+q.amt).sort().join(' | '),storeNoLock:!/🔒/.test(after),src:/live pull/.test(JSON.stringify(S.qbFileMeta||{})),screenAfter:masked(t2),
      owner:/PAGTAMA, JINKY/.test(t3)&&!/🔒 Office payroll/.test(t3),ownerCsv:/PAGTAMA, JINKY/.test(c3)};})();`),
  expect:{office:false,screen:true,csv:true,link:true,pulled:'ARABIS, ANGELYN -4100 | PAGTAMA, JINKY -27500',storeNoLock:true,src:true,screenAfter:true,owner:true,ownerCsv:true} },

{ name:'🗄 QuickBooks aging + cash-flow caches: Joshane reads them masked (no PAGTAMA, one 🔒 row ₱5,000.00, Acme ₱1,200.00 kept) and her write stays in memory (the stored copy keeps PAGTAMA, no 🔒); the owner reads PAGTAMA; both keys are in SKIP_KEYS; the QB Recon pay export lands in hnxlocal_qbpay_v1 (not hydroPro_qbpay_local_v1) and never in the daily backup (v22.52 review)',
  requires:REQ,
  seed:function(){(USERS)();
    var ap={Header:{ReportName:'AgedPayables'},Rows:{Row:[{ColData:[{value:'PAGTAMA, JINKY'},{value:'5000.00'}]},{ColData:[{value:'Acme Hardware Supply'},{value:'1200.00'}]}]}};
    localStorage.setItem('hydroPro_acct_qb_aging_v1',JSON.stringify({APTI:{ap:{at:Date.now(),raw:ap}}}));
    var cf={rows:[{account:'- BP_Acctg_PAGTAMA, JINKY',m:[1000,2000]},{account:'Utilities Expense',m:[300,400]}]};
    localStorage.setItem('hydroPro_acct_qb_cashflow_v1',JSON.stringify({APTI:{'2026':{at:Date.now(),data:cf}}}));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  drive:async()=>{const fs=require('fs'),path=require('path');const s=fs.readFileSync(path.resolve(__dirname,'../..',process.env.NEXI_PAGE||'index.html'),'utf8');
    const m=/var SKIP_KEYS=\[([^\]]*)\]/.exec(s)||['',''];return {aging:m[1].indexOf("'hydroPro_acct_qb_aging_v1'")>=0,cash:m[1].indexOf("'hydroPro_acct_qb_cashflow_v1'")>=0};},
  run:new Function(`return (async()=>{${AS}await sleep(5000);window.showToast=()=>{};
    const NG=k=>(window.__hnxNG||Storage.prototype.getItem).call(localStorage,k)||'';
    as('joshanee');const a=localStorage.getItem('hydroPro_acct_qb_aging_v1'),c=localStorage.getItem('hydroPro_acct_qb_cashflow_v1');
    const A=JSON.parse(a).APTI.ap.raw.Rows.Row.map(r=>r.ColData.map(x=>x.value).join(' '));
    localStorage.setItem('hydroPro_acct_qb_aging_v1',JSON.stringify({APTI:{ap:{at:1,raw:{Rows:{Row:[]}}}}}));const mine=JSON.parse(localStorage.getItem('hydroPro_acct_qb_aging_v1')).APTI.ap.at;
    const stored=NG('hydroPro_acct_qb_aging_v1');
    as('tester');const own=localStorage.getItem('hydroPro_acct_qb_aging_v1');
    const f=new File([JSON.stringify({months:['2026-08'],rows:[{account:'QBPAY_MARKER_7731 BP_Acctg_X',m:[1]}],summary:[{}]})],'qbpay.json',{type:'application/json'});
    hnxQbpayLoadFile({files:[f]});await sleep(800);
    localStorage.setItem('hnx_cloud_token','t');const AB=window.hnxAutoBackupCloud;let cap=null;window.hnxAutoBackupCloud=p=>{cap=p;return Promise.resolve({ok:true});};
    try{await hnxAutoBackupNow();}finally{window.hnxAutoBackupCloud=AB;}const bk=JSON.stringify((cap&&cap.data)||{});const bkHasData=!!cap&&Object.keys(cap.data||{}).length>5;
    return {aging:A.join(' | '),cashMasked:!/PAGTAMA/.test(c)&&/🔒/.test(c)&&/Utilities Expense/.test(c),mine,storedReal:/PAGTAMA/.test(stored)&&!/🔒/.test(stored),owner:/PAGTAMA/.test(own)&&!/🔒/.test(own),
      local:/QBPAY_MARKER_7731/.test(localStorage.getItem('hnxlocal_qbpay_v1')||''),oldKey:localStorage.getItem('hydroPro_qbpay_local_v1'),backupClean:bkHasData&&!/QBPAY_MARKER_7731/.test(bk)};})();`),
  expect:{aging:'🔒 Office pay (restricted) · payroll expense 5000.00 | Acme Hardware Supply 1200.00',cashMasked:true,mine:1,storedReal:true,owner:true,local:true,oldKey:null,backupClean:true,'drive.aging':true,'drive.cash':true} },

{ name:'🏢 Taking office pay away from Jinky closes every payroll screen that lists office people: she keeps Labor / Trips / Rates / History, loses Office, All, QB Recon, Pay Basis, BIR, OT & Premiums, Final Pay, payroll brain; History lists the weekly ₱120000 run only (owner: both, ₱50000 office); the payroll cockpit counts 1 run (owner 2); Dr Amy keeps Pay Basis; a 🏢 grant to Joshane opens the office line ₱50,000.00 of her Accounting Payroll Report but not the Payroll module (v22.52 review)',
  requires:REQ,
  seed:function(){(USERS)();var Y=new Date().getFullYear();
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
      {id:'office_'+Y+'-09-26_'+Y+'-10-10',type:'semi_monthly',periodStart:Y+'-09-26',periodEnd:Y+'-10-10',status:'approved',approvedAt:1,createdAt:2,totals:{netPay:50000},lines:[{empId:'E1',name:'PAGTAMA, JINKY',grossPay:55000,grossEarnings:55000,totalGovDed:2000,withholdingTax:3000,netPay:50000,taxBase:53000}]},
      {id:'ops_'+Y+'-09-27_'+Y+'-10-03',type:'weekly',periodStart:Y+'-09-27',periodEnd:Y+'-10-03',status:'approved',approvedAt:1,createdAt:1,totals:{netPay:120000},lines:[{empId:'L1',name:'ARABIS, ANGELYN',grossPay:125000,grossEarnings:125000,totalGovDed:5000,withholdingTax:0,netPay:120000,taxBase:120000}]}]));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  run:new Function(`return (async()=>{${AS}await sleep(5000);window.showToast=()=>{};window._toast=window.showToast;window.confirm=()=>true;
    const V=['payroll_ops','pay_trips','payroll_rates','payroll_history','payroll_office','payroll_all','payroll_qbrecon','pay_basis','payroll_bir','payroll_ot','hr_final_pay','payroll_brain'];
    const hist=async()=>{document.querySelectorAll('.view.active').forEach(x=>x.classList.remove('active'));switchView('payroll_history');await sleep(600);return (document.getElementById('payrollHistoryBody')||{}).innerText||'';};
    const cock=()=>{try{return HNX_COCKPIT_SUBJECTS.payroll.find(x=>x.name==='Payroll runs').compute().total;}catch(e){return 'ERR '+e;}};
    as('tester');const rv=HNXSENS.revoke('jinky','office');const th=await hist(),tc=cock();
    as('jinky');const jv=V.filter(v=>hnxSensViewAllowed(v)).join(',');const jh=await hist(),jc=cock();
    const amy=hnxSensViewAllowed('pay_basis',loadUsers().find(x=>x.username==='amy'));
    as('tester');const g=HNXSENS.grant('joshanee','office');
    as('joshanee');const jo=hnxSensViewAllowed('payroll_office');window.__hnxACC.open();await sleep(500);window.__hnxACC.navLeaf('reports','rep','pay');await sleep(800);const jp=(document.getElementById('hnxaccOverlay')||{}).innerText||'';window.__hnxACC.close();
    return {rv,jinkyViews:jv,jinkyHist:/Weekly Ops/.test(jh)&&!/Bi-monthly Office/.test(jh)&&!/50000/.test(jh)&&/120000/.test(jh),ownerHist:/Bi-monthly Office/.test(th)&&/50000/.test(th)&&/120000/.test(th),
      jinkyCockpit:jc,ownerCockpit:tc,amy,grant:g,joshPayrollOffice:jo,joshReport:/50,000\\.00/.test(jp)&&!/Office lines hidden/.test(jp)};})();`),
  expect:{rv:true,jinkyViews:'payroll_ops,pay_trips,payroll_rates,payroll_history',jinkyHist:true,ownerHist:true,jinkyCockpit:1,ownerCockpit:2,amy:true,grant:true,joshPayrollOffice:false,joshReport:true} },

{ name:'💉 A username carrying script (q\');window.__pw1=1;//) never runs: the 🔎 Access card\'s 🔐 Access matrix, View and Lift-Strict buttons and the Permissions tab\'s 🔐 Open in Access matrix pass it as data — __pw1 stays unset, the matrix opens on that user and the View override is written for him (v22.52 review)',
  requires:REQ,
  seed:function(){(USERS)();var U=JSON.parse(localStorage.getItem('hydroPro_users'));U.push({username:"q');window.__pw1=1;//",fullname:'Odd "Name"',passwordHash:'x',role:'supervisor',department:'production',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({"q');window.__pw1=1;//":{overrides:{},strict:true,updatedAt:'2026-10-11T00:00:00.000Z'}}));}.toString().replace('(USERS)()','('+USERS.toString()+')()'),
  run:new Function(`return (async()=>{${AS}await sleep(5000);window.showToast=()=>{};window.confirm=()=>true;const ODD="q');window.__pw1=1;//";
    as('tester');const btn=(root,re)=>[...root.querySelectorAll('button')].find(b=>re.test(b.textContent));
    HNXACCESS.open(ODD);await sleep(300);let doc=document.getElementById('hnxAccDoc');
    btn(doc,/Access matrix/).click();await sleep(400);const fx=document.querySelector('#hnxAccMatrix tr.fx');const m1=!!fx&&fx.textContent.indexOf(ODD)>=0;HNXMATRIX.close();
    doc=document.getElementById('hnxAccDoc');const vb=[...doc.querySelectorAll('button')].find(b=>b.textContent.trim()==='View');const mod=vb&&vb.getAttribute('data-m');vb&&vb.click();await sleep(300);
    const ov=getUserOverrides(ODD)['module:'+mod];
    doc=document.getElementById('hnxAccDoc');const ls=btn(doc,/Lift Strict/);ls&&ls.click();await sleep(300);const strict=hnxUserStrict_(ODD);
    const d=document.getElementById('hnxAccDoc');d&&d.remove();
    const host=document.createElement('div');host.innerHTML=renderUserPermsTab(ODD);document.body.appendChild(host);btn(host,/Open in Access matrix/).click();await sleep(400);
    const fx2=document.querySelector('#hnxAccMatrix tr.fx');const m2=!!fx2&&fx2.textContent.indexOf(ODD)>=0;HNXMATRIX.close();host.remove();
    return {pw:typeof window.__pw1,matrixFromCard:m1,view:ov,lifted:strict===false,matrixFromPerms:m2};})();`),
  expect:{pw:'undefined',matrixFromCard:true,view:'view',lifted:true,matrixFromPerms:true} },

{ name:'🖥 Wall Launcher + masked-row nature: Joshane\'s Wall Launcher lists no Loyalty Savings / Office Payroll / QB Recon / Labor Payroll screen (the owner\'s lists all four); in a QuickBooks report the 2312 office SSS row ₱-1,200.00 reads "· payable / accrued" and the 6122 office EWT row ₱800.00 "· payroll expense", the labor SSS row ₱-500.00 stays (v22.52 review)',
  requires:REQ,
  seed:USERS,
  run:new Function(`return (async()=>{${AS}await sleep(6000);window.showToast=()=>{};
    const wall=async()=>{const b=document.getElementById('hnx-wall_launcher-body');if(b)delete b.dataset.shellRendered;switchView('wall_launcher');await sleep(900);
      return [...document.querySelectorAll('#hnxWlPalette .hnx-pmod')].map(x=>x.getAttribute('data-id')).filter(id=>/^(acct_loyalty|payroll_office|payroll_qbrecon|payroll_ops)$/.test(id)).sort().join(',');};
    as('joshanee');const jw=await wall();
    const rep={Rows:{Row:[
      {type:'Section',Header:{ColData:[{value:'2312 Government Contributions Payable'},{value:''}]},Rows:{Row:[{type:'Data',ColData:[{value:'SSS Premium - PAGTAMA, JINKY'},{value:'-1200.00'}]},{type:'Data',ColData:[{value:'SSS Premium - ARABIS, ANGELYN'},{value:'-500.00'}]}]},Summary:{ColData:[{value:'Total 2312'},{value:'-1700.00'}]}},
      {type:'Section',Header:{ColData:[{value:'6122 Taxes and Licenses'},{value:''}]},Rows:{Row:[{type:'Data',ColData:[{value:'EWT Withholding - PAGTAMA, JINKY'},{value:'800.00'}]}]},Summary:{ColData:[{value:'Total 6122'},{value:'800.00'}]}}]}};
    const M=HNXMATRIX.mask(rep);const sec=i=>M.Rows.Row[i].Rows.Row.map(r=>r.ColData.map(c=>c.value).join(' ')).join(' | ');
    as('tester');const tw=await wall();
    return {joshWall:jw,ownerWall:tw,s2312:sec(0),s6122:sec(1)};})();`),
  expect:{joshWall:'',ownerWall:'acct_loyalty,payroll_office,payroll_ops,payroll_qbrecon',s2312:'🔒 Office pay (restricted) · payable / accrued -1200.00 | SSS Premium - ARABIS, ANGELYN -500.00',s6122:'🔒 Office pay (restricted) · payroll expense 800.00'} },
];
