/* v22.54 release audit — the QuickBooks pay mask (hnx-sensitive-areas-v2252) for people without 🏢 Office pay / 💎 Loyalty.
   LOCK-1  the first QuickBooks pull after opening Nexi waits for the mask; the in-memory snapshot is masked when READ as well.
   LOCK-2  a non-holder's 12-month pull lives in memory only — so do its 24 h "fresh" stamps; after a reload it is pulled again.
   LOCK-4  a masked row in the nexi-qb flatten shape keeps its amount (string values summed), the first row's depth and no id.
   LOCK-5  when somebody with MORE access signs in after a masked pull (signed out / a non-holder before), QuickBooks is read again.
   DSAFE-1 Bank & Card Recon: a 🔒 masked row is never offered, saved or applied as a journal-entry DEBIT account.
   All names are synthetic (DELACRUZ, MARIBEL is an office employee of the seed, not a real person). */
const REQ="typeof window.hnxCanOfficePay==='function'&&!!window.HNXMATRIX";
const REALM='123145713380624';
const USERS=`localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'joshanee',fullname:'Joshane Espinosa',passwordHash:'x',role:'supervisor',department:'ACCOUNTING',departments:['payroll','accounting','meetings'],salaryAccess:true,active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true}]));
  localStorage.setItem('hydroPro_employees',JSON.stringify([
    {id:'E1',name:'DELACRUZ, MARIBEL',status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:31000,dateHired:'2025-01-01'},
    {id:'L1',name:'ARABIS, ANGELYN',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01'}]));
  localStorage.removeItem('hnx_test_harness');`;
/* a stub nexi-qb worker: /qb/snapshot answers rows in the worker's flatten() shape (values are strings, depth a number, id a string) */
function qbStub(host,rows,extra){return `
  localStorage.setItem('hydroPro_qb_cfg_v1',JSON.stringify({url:'http://${host}',token:'t',realm:'${REALM}'}));
  var of=window.fetch;window.__qbCalls=[];
  window.fetch=function(u,i){var s=typeof u==='string'?u:((u&&u.url)||'');
    if(s.indexOf('${host}')>=0){
      if(/\\/qb\\/snapshot/.test(s))window.__qbCalls.push({t:Math.round(performance.now()),maskReady:!!document.getElementById('hnx-sensitive-areas-v2252')&&!!window.HNXMATRIX,who:(JSON.parse(sessionStorage.getItem('hydroPro_session')||'{}').username||'')});
      var rows=${JSON.stringify(rows)};
      var body=/\\/qb\\/snapshot/.test(s)?{at:Date.now(),ok:true,data:{profitAndLoss:{rows:rows,columns:['','Total'],header:{}}${extra||''}}}:
               /\\/qb\\/report/.test(s)?{ok:true,report:'ProfitAndLoss',rows:rows,columns:['','Total'],header:{}}:{ok:true};
      return Promise.resolve(new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}}));}
    return of.apply(this,arguments);};`;}
const ROWS=[
  {depth:1,label:'Expenses',values:[''],type:'Section',group:'Expenses',id:''},
  {depth:2,label:'6122-900-001-001 - BP_Acctg_DELACRUZ, MARIBEL',values:['31000.00'],type:'Data',group:'',id:'101'},
  {depth:2,label:'6122-900-001-002 - OT_Acctg_DELACRUZ, MARIBEL',values:['4500.00'],type:'Data',group:'',id:'202'},
  {depth:2,label:'6200 Utilities',values:['1000.00'],type:'Data',group:'',id:'303'},
  {depth:1,label:'Total Expenses',values:['36500.00'],type:'Summary',group:'Expenses',id:''}];
const SNAP=`const snapTxt=()=>JSON.stringify(((hnxQBSnapshot('${REALM}')||{}).data||{}));`;
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";

/* LOCK-2: the 12-month pull through the real qb-api URL, stubbed */
function monthlySeed(who){return new Function(USERS+`
  sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'${who}',loginAt:Date.now()}));
  var of=window.fetch;
  window.fetch=function(u,i){var s=typeof u==='string'?u:((u&&u.url)||'');
    if(s.indexOf('qb-api.eyalbenari99.workers.dev/api/qb/')>=0){
      var m=s.match(/\\/api\\/qb\\/[a-z]+\\/([a-z-]+)\\?/);var rep=m?m[1]:'?';
      var C=JSON.parse(sessionStorage.getItem('zzC')||'{}');C[rep]=(C[rep]||0)+1;sessionStorage.setItem('zzC',JSON.stringify(C));
      var body={Header:{ReportName:'X'},Columns:{Column:[{ColTitle:''},{ColTitle:'Total'}]},Rows:{Row:[
        {type:'Section',Header:{ColData:[{value:'Income'},{value:''}]},Rows:{Row:[{type:'Data',ColData:[{value:'4000 Sales'},{value:'1000.00'}]}]},Summary:{ColData:[{value:'Total Income'},{value:'1000.00'}]}}]}};
      return Promise.resolve(new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}}));}
    return of.apply(this,arguments);};`);}
const M5=['aged-payables','aged-receivables','balance-sheet','general-ledger','profit-loss'];
function monthlyDrive(){return async(pg)=>{
  const r1=await pg.evaluate(async(M5)=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));sessionStorage.setItem('zzC','{}');
    const done=new Promise(r=>window.addEventListener('hnx-monthly-filled',()=>r(1),{once:true}));window.hnxRefreshMonthly();const fin=await Promise.race([done,sleep(120000).then(()=>0)]);
    let rk=[];try{rk=Object.keys((JSON.parse(localStorage.getItem('hydroPro_acct_qb_monthly_v1')||'{}')||{}).APTI||{});}catch(e){}
    return {fin,session:rk.filter(x=>M5.includes(x)).sort()};},M5);
  await pg.reload({waitUntil:'domcontentloaded'});await pg.waitForTimeout(25000);
  const r2=await pg.evaluate(async(M5)=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const rd=()=>{let rk=[];try{rk=Object.keys((JSON.parse(localStorage.getItem('hydroPro_acct_qb_monthly_v1')||'{}')||{}).APTI||{});}catch(e){}return rk.filter(x=>M5.includes(x)).sort();};
    const atBoot=rd();sessionStorage.setItem('zzC','{}');window.__hnxAcctOpened=true;
    for(let i=0;i<30&&rd().length<5;i++)await sleep(3000);
    const C=JSON.parse(sessionStorage.getItem('zzC')||'{}');
    return {atBoot,afterOpen:rd(),repulled:M5.filter(k=>C[k]>0)};},M5);
  return {r1,r2};};}

module.exports=[
{ name:'☁ First QuickBooks pull waits for the mask: Joshane signed in at boot — the stub snapshot (BP_Acctg_DELACRUZ, MARIBEL ₱31,000.00) is first read with the mask ready, hnxQBSnapshot has no DELACRUZ, ☁ QB Sync shows no DELACRUZ and no 31000; a holder\'s raw copy read in the same page by Joshane is masked (v22.54 audit LOCK-1)',
  requires:REQ, seed:new Function(USERS+qbStub('l1qb.test',ROWS)+"sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'joshanee',loginAt:Date.now()}));"),
  run:new Function(`return (async()=>{${AS}${SNAP}
    const F=HNXMATRIX.flags();const first=(window.__qbCalls||[])[0]||{};
    const boot=snapTxt();switchView('qb_sync');await sleep(2500);const t=(document.getElementById('view-qb_sync')||{}).innerText||'';
    as('eyal');await new Promise(r=>hnxQBPullAll(r));await sleep(300);const eyalRaw=/DELACRUZ/.test(snapTxt());
    as('joshanee');const joshRead=snapTxt();const all=JSON.stringify(hnxQBAll()||{});
    return {who:F.u+'|'+F.off,firstMaskReady:!!first.maskReady,bootName:/DELACRUZ/.test(boot),screenName:/DELACRUZ/.test(t),screenAmt:/31,?000/.test(t),
      eyalRaw,joshReadName:/DELACRUZ/.test(joshRead)||/DELACRUZ/.test(all),joshReadLock:/🔒/.test(joshRead)};})();`),
  expect:{who:'joshanee|true',firstMaskReady:true,bootName:false,screenName:false,screenAmt:false,eyalRaw:true,joshReadName:false,joshReadLock:true} },

{ name:'🔢 A masked office row keeps its amount: the flatten-shape snapshot BP ₱31,000.00 + OT ₱4,500.00 of DELACRUZ reaches Joshane as ONE "6122 🔒 Office pay (restricted) · payroll expense" row with values ["35500.00"], depth 2 and no id; the Data rows add up to the ₱36,500.00 total again; the /qb/report call the same; ☁ QB Sync prints 35500 (v22.54 audit LOCK-4)',
  requires:REQ, seed:new Function(USERS+qbStub('l4qb.test',ROWS)+"sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'joshanee',loginAt:Date.now()}));"),
  run:new Function(`return (async()=>{
    const snap=await (await fetch('http://l4qb.test/qb/snapshot?realm=${REALM}')).json();
    const rep=await (await fetch('http://l4qb.test/qb/report?name=ProfitAndLoss&realm=${REALM}')).json();
    const rows=snap.data.profitAndLoss.rows,m=rows.filter(r=>/🔒/.test(r.label));
    const sum=rows.filter(r=>r.type==='Data').reduce((a,r)=>a+(parseFloat(((r.values||[])[0])||'0')||0),0);
    const rm=rep.rows.filter(r=>/🔒/.test(r.label));
    await new Promise(r=>hnxQBPullAll(r));await sleep(300);switchView('qb_sync');await sleep(2500);
    const line=((((document.getElementById('view-qb_sync')||{}).innerText)||'').split('\\n').filter(l=>/Office pay/.test(l))[0])||'';
    return {n:m.length,label:m[0]&&m[0].label,values:m[0]&&m[0].values,depth:m[0]&&m[0].depth,id:m[0]&&m[0].id,sum,named:/DELACRUZ/.test(JSON.stringify(snap)),
      report:rm.length===1&&JSON.stringify(rm[0].values)==='["35500.00"]',screen:/35,?500/.test(line)};})();`),
  expect:{n:1,label:'6122 🔒 Office pay (restricted) · payroll expense',values:['35500.00'],depth:2,id:'',sum:36500,named:false,report:true,screen:true} },

{ name:'🔓 Signed out, then Eyal signs in: the 3-minute QuickBooks pull ran while nobody was signed in (masked, 🔒), Eyal\'s sign-in reads QuickBooks again at once — his snapshot and ☁ QB Sync show BP_Acctg_DELACRUZ, MARIBEL, no 🔒, no reload (v22.54 audit LOCK-5 A)',
  requires:REQ, seed:new Function(USERS+qbStub('l5qb.test',ROWS)+"sessionStorage.removeItem('hydroPro_session');"),
  run:new Function(`return (async()=>{${AS}${SNAP}window.__noReload=1;
    await new Promise(r=>hnxQBPullAll(r));await sleep(500);const out=snapTxt();
    as('eyal');try{showApp();}catch(e){}await sleep(3000);const F=HNXMATRIX.flags();const after=snapTxt();
    let screen='';try{switchView('qb_sync');await sleep(2000);screen=(document.getElementById('view-qb_sync')||{}).innerText||'';}catch(e){}
    return {outMasked:/🔒/.test(out)&&!/DELACRUZ/.test(out),F:F.u+'|'+F.off,afterRaw:/DELACRUZ/.test(after)&&!/🔒/.test(after),screen:/DELACRUZ/.test(screen),noReload:window.__noReload===1};})();`),
  expect:{outMasked:true,F:'eyal|false',afterRaw:true,screen:true,noReload:true} },

{ name:'🔓 Joshane pulls (masked), signs out, Eyal signs in → raw; Eyal signs out, a pull runs signed out, Eyal signs back in → raw again (the previous user was a holder too) (v22.54 audit LOCK-5 B+C)',
  requires:REQ, seed:new Function(USERS+qbStub('l5bqb.test',ROWS)+"sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'joshanee',loginAt:Date.now()}));"),
  run:new Function(`return (async()=>{${AS}${SNAP}window.__noReload=1;
    await new Promise(r=>hnxQBPullAll(r));await sleep(500);const josh=snapTxt();
    try{doLogout();}catch(e){}await sleep(300);as('eyal');try{showApp();}catch(e){}await sleep(3000);const b=snapTxt();
    try{doLogout();}catch(e){}await sleep(300);await new Promise(r=>hnxQBPullAll(r));await sleep(500);const out=snapTxt();
    as('eyal');try{showApp();}catch(e){}await sleep(3000);const c=snapTxt();
    return {joshMasked:/🔒/.test(josh)&&!/DELACRUZ/.test(josh),bRaw:/DELACRUZ/.test(b)&&!/🔒/.test(b),outMasked:/🔒/.test(out),cRaw:/DELACRUZ/.test(c)&&!/🔒/.test(c),noReload:window.__noReload===1};})();`),
  expect:{joshMasked:true,bRaw:true,outMasked:true,cRaw:true,noReload:true} },

{ name:'📅 Joshane\'s 12-month QuickBooks pull (5 reports) stays in memory — and so do its "fresh" stamps: after a reload the 5 reports are pulled again when Accounting opens (aged-payables, aged-receivables, balance-sheet, general-ledger, profit-loss) (v22.54 audit LOCK-2)',
  seed:monthlySeed('joshanee'), drive:monthlyDrive(), run:new Function('return (async()=>({}))();'),
  expect:{'drive.r1.fin':1,'drive.r1.session':M5,'drive.r2.atBoot':[],'drive.r2.afterOpen':M5,'drive.r2.repulled':M5} },

{ name:'📅 A holder\'s 12-month pull is saved with its 24 h stamp: Eyal reloads → the 5 reports are there at boot and none is pulled again (v22.54 audit LOCK-2 control)',
  seed:monthlySeed('eyal'), drive:monthlyDrive(), run:new Function('return (async()=>({}))();'),
  expect:{'drive.r1.fin':1,'drive.r1.session':M5,'drive.r2.atBoot':M5,'drive.r2.afterOpen':M5,'drive.r2.repulled':[]} },

{ name:'🏦 Bank & Card Recon for Joshane (no 🏢): the ✎ DEBIT list offers no 🔒 row (1012 Cash, 5122 labor wages only), a 🔒 account typed in is refused (line and rules unchanged); the owner\'s 🤖 Auto-JE ignores a synced rule whose DEBIT is "🔒 Office pay (restricted) · payable / accrued" — the ₱15,000 line stays uncategorised (v22.54 audit DSAFE-1)',
  requires:REQ,
  seed:new Function(USERS.replace("localStorage.removeItem('hnx_test_harness');","")+
    "localStorage.setItem('hydroPro_acct_qb_v1',JSON.stringify({APTI:{tb:{at:Date.now(),parsed:{rows:[{account:'1012 Cash in Bank - BDO',debit:900000,credit:0},{account:'2140-900-003 Net Pay - Semi Monthly - DELACRUZ, MARIBEL',debit:0,credit:15000},{account:'6122-900-014 BP_ADMIN_DELACRUZ, MARIBEL',debit:31000,credit:0},{account:'5122-900-015 BP_ARABIS, ANGELYN',debit:14010,credit:0}]}}}}));"+
    "localStorage.setItem('hydroPro_recon_v1',JSON.stringify({v2:1,accounts:{bdo1:{name:'BDO Checking',company:'APTI',sourceClass:'bank',chartNo:'1012'}},sets:{'bdo1::2026-09':{acctId:'bdo1',period:'2026-09',lines:[{ref:'L1',date:'2026-09-30',desc:'PAYROLL TRANSFER 0930',amt:15000}]},'bdo1::2026-10':{acctId:'bdo1',period:'2026-10',lines:[{ref:'M1',date:'2026-10-15',desc:'PAYROLL TRANSFER 1015',amt:15000}]}}}));"+
    "localStorage.removeItem('hydroPro_recon_rules_v1');"),
  run:new Function(`return (async()=>{${AS}await sleep(1500);window.__toasts=[];window.showToast=m=>window.__toasts.push(String(m));
    localStorage.removeItem('hnx_test_harness');as('joshanee');const off=hnxCanOfficePay();
    hnxReconCompany('APTI');hnxReconAcct('bdo1');hnxReconPick('bdo1::2026-09');await sleep(300);
    hnxReconSetCat(0);await sleep(200);const sel=document.getElementById('hnxJeDr');const opts=sel?[...sel.options].map(o=>o.textContent):[];
    const d=document.getElementById('hnxJeEdit');const tx=d.querySelector('#hnxJeDrTxt');tx.value='🔒 Office pay (restricted) · payable / accrued';tx.setAttribute('data-code','2140');
    hnxReconJeSave(0);await sleep(200);const still=!!document.getElementById('hnxJeEdit');const dd=document.getElementById('hnxJeEdit');if(dd)dd.remove();
    const G=k=>Storage.prototype.getItem.call(localStorage,k);
    const ln=JSON.parse(G('hydroPro_recon_v1')).sets['bdo1::2026-09'].lines[0];const rules0=JSON.parse(G('hydroPro_recon_rules_v1')||'[]').length;
    /* a rule that reached the synced store from an older computer */
    localStorage.setItem('hydroPro_recon_rules_v1',JSON.stringify([{m:'PAYROLL TRANSFER',cat:'Payroll',dr:'🔒 Office pay (restricted) · payable / accrued',code:'2140'}]));
    localStorage.setItem('hnx_test_harness','1');as('tester');hnxReconPick('bdo1::2026-10');await sleep(300);hnxReconAutoJe();await sleep(200);
    const ln2=JSON.parse(G('hydroPro_recon_v1')).sets['bdo1::2026-10'].lines[0];
    return {off,optsN:opts.length,optsLock:opts.some(o=>/🔒/.test(o)),opts:opts.map(o=>o.split(' ')[0]).join(','),refused:window.__toasts.some(t=>/That account is restricted/.test(t)),still,
      savedDr:ln.acctdr||'',rules0,autoDr:ln2.acctdr||'',autoCode:ln2.code||''};})();`),
  expect:{off:false,optsN:2,optsLock:false,opts:'1012,5122-900-015',refused:true,still:true,savedDr:'',rules0:0,autoDr:'',autoCode:''} },
];
