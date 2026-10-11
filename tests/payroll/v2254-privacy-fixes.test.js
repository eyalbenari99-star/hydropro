/* v22.54 release audit — privacy track (owner, 11 Oct 2026: "why Josane see office salaries and loyalty program its NO NO").
   Office salaries (🏢 Office pay) and the Loyalty program (💎 Loyalty) are owner-granted. Each case is a confirmed audit finding written
   as a rule; every figure is synthetic (DELACRUZ, MARIBEL is not a real employee).
   PRIV-1  📋 BIR / Reports Center (Full Alphalist, CSVs) needs 🏢 Office pay — no "viewAuditLog" door for accounting / admin roles.
   PRIV-2  👷 Labor Payroll kept by a pay-list person without 🏢: 🧮 Final Pay labor only, 🏛 Gov monthly no office column, ⭐ Special payroll shut.
   PRIV-3  HR card of an office employee: 💼 Contract Pay / 💰 Loyalty neither shown nor filled nor overwritten without the grant.
   PRIV-4  the 💰 / admin-role salary gate is labor rates: no office Monthly Basic in the Daily Rate note, the contract or the HR list.
   PRIV-5  prev.html (older, weaker gates) opens with ?stay=1 only during the owner's rollback.
   LOCK-3  QB Recon tells a holder where the QuickBooks export file is (Eyal) and how to load it. */
const REQ="typeof window.hnxCanOfficePay==='function'&&!!window.HNXMATRIX";
const AT='2026-10-11T01:00:00.000Z';
const LINE={empId:'E1',name:'DELACRUZ, MARIBEL',employmentType:'Regular',dailyRate:3535.32,monthlyBasic:77777,daysWorked:11,basicPay:38888.5,grossPay:38888.5,grossEarnings:38888.5,sss:1750,phic:1944.43,hdmf:200,withholdingTax:3680.94,totalGovDed:3894.43,netPay:31313.13};
function seed(o){
  /* o.users: extra users · o.perms: hydroPro_user_perms · o.who: session · o.special / o.finance / o.noHarness */
  return new Function(`
  var at=${JSON.stringify(AT)};
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'admin_secondary',department:'accounting',departments:['payroll','accounting','hr'],active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'mea',fullname:'Meajean Magracia',passwordHash:'x',role:'admin',department:'hr',active:true},
    {username:'hrflag',fullname:'Rosa Hr Clerk',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr'],salaryAccess:true,active:true},
    {username:'joshane',fullname:'Joshane Reyes',passwordHash:'x',role:'accounting',department:'accounting',active:true}]));
  localStorage.setItem('hydroPro_user_perms',JSON.stringify(${JSON.stringify(o.perms||{})}));
  localStorage.setItem('hydroPro_employees',JSON.stringify([
    {id:'E1',name:'DELACRUZ, MARIBEL',status:'Active',salaryCategory:'accounting',dept:'ACCOUNTING',payType:'semi',type:'Regular',employmentType:'Regular',monthlyBasic:77777,ewtFixed:1212,allowances:[{type:'rice',monthly:5151,taxable:false}],loyaltyMonthly:4242,rate:3636,dateHired:'2025-01-01',hireDate:'2025-01-01'},
    {id:'L1',name:'ARABIS, ANGELYN',status:'Active',salaryCategory:'Regular',dept:'CONSTRUCTION',payType:'weekly',type:'Regular',employmentType:'Regular',dailyRate:658,allowances:[{type:'transport',perDay:47,taxable:false}],dateHired:'2025-01-01',hireDate:'2025-01-01'}]));
  localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([
    {id:'office_2026-09-26_2026-10-10',type:'semi_monthly',periodStart:'2026-09-26',periodEnd:'2026-10-10',status:'approved',createdAt:Date.now()-86400000,lines:[${JSON.stringify(LINE)}],totals:{netPay:31313.13}},
    {id:'ops_2026-10-01_2026-10-07',type:'weekly',periodStart:'2026-10-01',periodEnd:'2026-10-07',status:'approved',createdAt:Date.now()-3600000,lines:[{empId:'L1',name:'ARABIS, ANGELYN',dailyRate:658,daysWorked:6,basicPay:3948,grossPay:3948,sss:100,phic:50,hdmf:50,netPay:3700}],totals:{netPay:3700}}]));
  localStorage.setItem('hydroPro_emp_contract_E1',JSON.stringify({empId:'E1',terms:{baseSalary:77777}}));
  ${o.special?"localStorage.setItem('hydroPro_pay_special_v1',JSON.stringify({E1:{govExempt:true,annualBasic:999111}}));":''}
  ${o.finance?"localStorage.setItem('hydroPro_ea_show_finance','1');":''}
  ${o.who?"sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'"+o.who+"',loginAt:Date.now()}));":''}
  ${o.noHarness?"localStorage.removeItem('hnx_test_harness');":''}`);
}
const OFF_GONE=(u,loy)=>({[u]:{overrides:{},updatedAt:AT,updatedBy:'tester',sensitive:Object.assign({office:{on:false,by:'tester',at:AT}},loy?{loyalty:{on:false,by:'tester',at:AT}}:{})}});
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
const CAPTURE=`window.__csv=[];const _co=URL.createObjectURL;URL.createObjectURL=function(b){try{if(b&&b.text)b.text().then(t=>window.__csv.push(t));}catch(e){}return _co.apply(this,arguments);};
  HTMLAnchorElement.prototype.click=function(){};window.__toasts=[];window.showToast=function(m){window.__toasts.push(String(m));};`;
const BIRCLICK=`const ovB=()=>document.getElementById('hnxBirOverlay');const btnIn=(ov,re)=>ov&&[...ov.querySelectorAll('button')].find(b=>re.test(b.getAttribute('onclick')||''));`;

module.exports=[
{ name:'📋 BIR / Reports needs 🏢 Office pay: Jinky (pay name list, office pay taken away by the owner) keeps 👷 Labor Payroll, but its 🗂 picker → 📋 BIR / Reports opens nothing — no Full Alphalist line DELACRUZ ₱38,888.50 gross / ₱3,680.94 tax, no Alphalist CSV row; hnxBirExport / hnxBirPreviewFull / hnxBirSheet called directly refuse with "🔒 … owner-granted"; the owner opens the center and sees ₱38,888.50 (v22.54 audit PRIV-1)',
  requires:REQ, seed:seed({perms:OFF_GONE('jinky',true),who:'jinky'}),
  run:new Function(`return (async()=>{${AS}${CAPTURE}${BIRCLICK}const RX=/38,?888\\.50|3,?680\\.94/;await sleep(1500);
    const office=hnxCanOfficePay(),mp=can('managePayroll');
    switchView('payroll_ops');await sleep(5000);const ops=!!document.querySelector('#view-payroll_ops.active');
    const sel=document.querySelector('#view-payroll_ops .hnx-deepwrap select');const opt=sel&&[...sel.options].find(o=>/BIR/.test(o.textContent));
    if(opt){sel.value=opt.value;sel.dispatchEvent(new Event('change'));}else{try{hnxBirCenter();}catch(e){}}await sleep(1200);
    const overlay=!!ovB();
    window.__csv=[];try{hnxBirExport('alphalist',2026);}catch(e){}try{hnxBirPreviewFull(2026);}catch(e){}let w=null;const wo=window.open;window.open=function(){w=1;return null;};try{hnxBirSheet(2026);}catch(e){}window.open=wo;await sleep(1500);
    const full=document.getElementById('hnxAlphaFull');const direct=!!full||!!w||(window.__csv||[]).some(t=>/DELACRUZ/.test(t));if(full)full.remove();
    const refused=window.__toasts.some(t=>/BIR \\/ Reports lists office salaries — owner-granted/.test(t));
    as('tester');window.__csv=[];try{hnxBirCenter();}catch(e){}await sleep(900);const oo=ovB();const fb=btnIn(oo,/hnxBirPreviewFull/);if(fb)fb.click();await sleep(1200);
    const ownerFull=RX.test(((document.getElementById('hnxAlphaFull')||{}).innerText)||'');
    return {office,mp,ops,overlay,direct,refused,ownerOverlay:!!oo,ownerFull};})();`),
  expect:{office:false,mp:true,ops:true,overlay:false,direct:false,refused:true,ownerOverlay:true,ownerFull:true} },

{ name:'📋 Nexi’s Desk offers no 📋 BIR center to Joshane (role accounting, not on the pay name list, 💰 Finance items on) and hnxBirCenter() opens nothing for her or for Mea (admin role, not a holder) — no DELACRUZ ₱38,888.50 (v22.54 audit PRIV-1)',
  requires:REQ, seed:seed({who:'joshane',finance:true}),
  run:new Function(`return (async()=>{${AS}${CAPTURE}${BIRCLICK}const RX=/38,?888\\.50|3,?680\\.94/;await sleep(1500);
    const office=hnxCanOfficePay(),viewAudit=can('viewAuditLog');
    try{switchView('ea_desk');}catch(e){}await sleep(2500);if(!document.querySelector('#view-ea_desk.active')){try{renderEaDesk();}catch(e){}await sleep(1500);}
    const desk=!!document.querySelector('#view-ea_desk.active');
    const item=[...document.querySelectorAll('#view-ea_desk [onclick="hnxBirCenter()"]')].filter(b=>b.offsetParent!==null).length;
    try{hnxBirCenter();}catch(e){}await sleep(800);const josh=!!ovB();try{hnxBirPreviewFull(2026);}catch(e){}await sleep(600);const joshFull=RX.test(document.body.innerText);
    localStorage.removeItem('hnx_test_harness');as('mea');const meaOffice=hnxCanOfficePay();try{hnxBirCenter();}catch(e){}await sleep(800);const mea=!!ovB();localStorage.setItem('hnx_test_harness','1');
    return {office,viewAudit,desk,deskItem:item,joshOverlay:josh,joshFull,meaOffice,meaOverlay:mea};})();`),
  expect:{office:false,viewAudit:true,desk:true,deskItem:0,joshOverlay:false,joshFull:false,meaOffice:false,meaOverlay:false} },

{ name:'👷 Labor Payroll without 🏢 (Dr Amy, office pay taken away): 🧮 Final Pay lists ARABIS only and refuses DELACRUZ (no ₱77,777 / ₱3,888.85), 🏛 Gov monthly Oct-2026 shows no office SSS ₱1,750.00 / PhilHealth ₱1,944.43 / tax ₱3,680.94 and says "🔒 Office … not shown", ⭐ Special payroll (annual basic ₱999,111) has no button and refuses; the owner sees the office tax ₱3,680.94 and ₱999,111 (v22.54 audit PRIV-2)',
  requires:REQ, seed:seed({perms:OFF_GONE('amy'),who:'amy',special:true}),
  run:new Function(`return (async()=>{${AS}window.__toasts=[];window.showToast=m=>window.__toasts.push(String(m));await sleep(1500);
    const RX=/77,?777|3,?888\\.85|1,?750\\.00|1,?944\\.43|3,?680\\.94|999,?111/;
    const office=hnxCanOfficePay();switchView('payroll_ops');await sleep(6000);const v=document.getElementById('view-payroll_ops');const ops=!!(v&&v.classList.contains('active'));
    const btn=t=>Array.from((v||document).querySelectorAll('button')).find(b=>b.textContent.indexOf(t)>=0);
    try{hnxFinalPay();}catch(e){}await sleep(900);const s=document.getElementById('fpEmp');const fpOpts=s?Array.from(s.options).map(o=>o.textContent).join('|'):'';
    const o1=document.getElementById('hnxFinalPayOverlay');const fpLeak=!!(o1&&RX.test(o1.innerText));if(o1)o1.remove();
    try{hnxFinalPay('E1');}catch(e){}await sleep(900);const o2=document.getElementById('hnxFinalPayOverlay');const fpOffice=!!o2;if(o2)o2.remove();
    try{hnxGovMonthly('2026-10');}catch(e){}await sleep(900);const g=document.getElementById('hnxGovM');const gt=g?g.innerText:'';if(g)g.remove();
    const spBtn=!!btn('Special payroll');try{hnxSpecialPay();}catch(e){}await sleep(600);const sp=document.getElementById('hnxSpecialPay');const spOpens=!!sp;if(sp)sp.remove();
    as('tester');try{hnxGovMonthly('2026-10');}catch(e){}await sleep(900);const g2=document.getElementById('hnxGovM');const ownerGm=!!g2&&/3,680\\.94/.test(g2.innerText);if(g2)g2.remove();
    try{hnxSpecialPay();}catch(e){}await sleep(600);const sp2=document.getElementById('hnxSpecialPay');const ownerSp=!!sp2&&/999,?111/.test(sp2.innerText);if(sp2)sp2.remove();
    return {office,ops,fpLabor:/ARABIS/.test(fpOpts),fpListsOffice:/DELACRUZ/.test(fpOpts),fpLeak,fpOffice,gmLeak:RX.test(gt),gmNote:/🔒 Office \\(semi-monthly\\) is not shown/.test(gt),spBtn,spOpens,ownerGm,ownerSp};})();`),
  expect:{office:false,ops:true,fpLabor:true,fpListsOffice:false,fpLeak:false,fpOffice:false,gmLeak:false,gmNote:true,spBtn:false,spOpens:false,ownerGm:true,ownerSp:true} },

{ name:'🗂 HR card without 🏢 / 💎 (Jinky and Dr Amy, both taken away): the office card of DELACRUZ shows no 💼 Contract Pay — Monthly Basic, EWT ₱1,212 and the rice ₱5,151 are not even filled, no 💰 loyalty ₱4,242 — and a save keeps 77777 / 1212 / 5151 / 4242 / rate 3636; the labor card of ARABIS still shows its ₱47/day allowance; the owner sees 77777 and 4242 (v22.54 audit PRIV-3)',
  requires:REQ, seed:seed({perms:Object.assign(OFF_GONE('jinky',true),OFF_GONE('amy',true)),who:'jinky'}),
  run:new Function(`return (async()=>{${AS}window.showToast=()=>{};await sleep(1500);
    const vis=id=>{const el=document.getElementById(id);if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
    const val=id=>(document.getElementById(id)||{}).value||'';
    const close=()=>document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open'));
    const look=async(u)=>{as(u);switchView('hr');await sleep(1200);openEmployeeModal('E1');await sleep(1200);
      const r={block:vis('empAllowanceBlock'),mb:val('empMonthlyBasic'),ewt:val('empEwtFixed'),ly:val('empLoyaltyMonthly'),lyVis:vis('empLoyaltyMonthly'),allow:(window._empAllowDraft||[]).length>0||/5,?151/.test((document.getElementById('empAllowanceBlock')||{}).innerText||''),rate:val('empRate')};
      document.getElementById('empMonthlyBasic').value='12345';document.getElementById('empLoyaltyMonthly').value='111';document.getElementById('empEwtFixed').value='9';
      try{saveEmployee();}catch(e){r.err=String(e);}await sleep(900);close();
      const e=JSON.parse(localStorage.getItem('hydroPro_employees')).find(x=>x.id==='E1');r.saved=[e.monthlyBasic,e.ewtFixed,(e.allowances||[]).map(a=>a.monthly).join('+'),e.loyaltyMonthly,e.rateOverride||e.rate].join('|');
      openEmployeeModal('L1');await sleep(1000);r.labor=vis('empAllowanceBlock')&&vis('empContractPayPart')&&(window._empAllowDraft||[]).length===1;close();return r;};
    const j=await look('jinky'),a=await look('amy');
    as('tester');openEmployeeModal('E1');await sleep(1000);const owner=[val('empMonthlyBasic'),val('empLoyaltyMonthly'),vis('empAllowanceBlock')].join('|');close();
    return {j,a,owner};})();`),
  expect:{'j.block':false,'j.mb':'','j.ewt':'','j.ly':'','j.lyVis':false,'j.allow':false,'j.rate':'','j.saved':'77777|1212|5151|4242|3636','j.labor':true,
    'a.block':false,'a.mb':'','a.ly':'','a.allow':false,'a.saved':'77777|1212|5151|4242|3636','a.labor':true,owner:'77777|4242|true'} },

{ name:'💰 The labor-rate gate shows no office pay: Mea (admin role) and an HR clerk with 💰 open the office card of DELACRUZ (Monthly Basic ₱77,777) — the Daily Rate note and tooltip say "🔒 office pay — owner-granted" with no 77,777, the rate box is empty (no 3,636), the 📄 contract Base salary reads 🔒 (no 77777), the HR list row shows 🔒 (no ₱3,636); Eyal sees "Monthly Basic ₱77,777" (v22.54 audit PRIV-4)',
  requires:REQ, seed:seed({perms:{hrflag:{overrides:{'module:hr':'edit'},updatedAt:AT,updatedBy:'tester'}},who:'mea',noHarness:true}),
  run:new Function(`return (async()=>{${AS}window.showToast=()=>{};await sleep(1500);localStorage.removeItem('hnx_test_harness');
    const vis=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
    const look=async(u)=>{as(u);try{switchView('hr');}catch(e){}await sleep(1500);
      const rowTxt=((document.getElementById('view-hr')||{}).innerText||'')+' '+((document.querySelector('#view-hr tr[data-empid="E1"]')||{}).innerText||'');
      openEmployeeModal('E1');await sleep(1200);const box=document.getElementById('empRate'),note=document.getElementById('empRateNote');
      const r={office:hnxCanOfficePay(),cvs:canViewSalaries(),rateVis:vis(box),note:(note&&note.textContent)||'',title:(box&&box.title)||'',rate:(box&&box.value)||'',row:/3,?636/.test(rowTxt)};
      document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open'));
      try{hnxOpenContract('E1');}catch(e){}await sleep(900);const cs=document.getElementById('hnxCT_salary');r.contract=!!(cs&&cs.type!=='hidden'&&vis(cs)&&/77777/.test(cs.value));
      r.contractLock=/office pay is owner-granted/.test((document.getElementById('hnxContractModal')||{}).innerText||'');
      const cm=document.getElementById('hnxContractModal');if(cm)cm.remove();
      r.leak=/77,?777/.test(r.note+' '+r.title)||/3636/.test(r.rate);r.lockNote=/🔒 office pay — owner-granted/.test(r.note);return r;};
    const m=await look('mea'),h=await look('hrflag'),e=await look('eyal');
    localStorage.setItem('hnx_test_harness','1');
    return {mea:[m.office,m.cvs,m.rateVis,m.leak,m.lockNote,m.contract,m.contractLock,m.row].join('|'),hr:[h.office,h.cvs,h.leak,h.lockNote,h.contract,h.row].join('|'),eyal:/Monthly Basic ₱77,777/.test(e.note)&&e.contract};})();`),
  expect:{mea:'false|true|true|false|true|false|true|false',hr:'false|true|false|true|false|false',eyal:true} },

{ name:'🚦 prev.html (the previous copy, older access gates) with ?stay=1 and NO rollback is sent to /index.html (v22.54 audit PRIV-5)',
  seed:function(){localStorage.setItem('hnx_router_test','1');localStorage.setItem('hydroPro_release_ctl_v1','{}');},
  drive:async(pg)=>{const u=new URL(pg.url());await pg.goto(u.origin+'/prev.html?stay=1&cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});await pg.waitForTimeout(4000);
    const a=new URL(pg.url()).pathname;await pg.goto(u.origin+'/index.html?stay=1&cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});await pg.waitForTimeout(2000);
    return {prevStay:a,indexStay:new URL(pg.url()).pathname};},
  run:function(){return {};},
  expect:{'drive.prevStay':'/index.html','drive.indexStay':'/index.html'} },

{ name:'⏪ During the owner\'s rollback prev.html?stay=1 stays on /prev.html; the router inside prev.html sends /prev (extensionless) and /prev?stay=1 to /index.html when no rollback is on and keeps them during one (v22.54 audit PRIV-5)',
  seed:function(){localStorage.setItem('hnx_router_test','1');localStorage.setItem('hydroPro_release_ctl_v1',JSON.stringify({rollback:true}));},
  drive:async(pg)=>{const u=new URL(pg.url());await pg.goto(u.origin+'/prev.html?stay=1&cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});await pg.waitForTimeout(4000);
    const rb=new URL(pg.url()).pathname;
    /* the router script of prev.html, run against a stub location (the test server cannot serve an extensionless /prev) */
    const fs=require('fs'),path=require('path'),vm=require('vm');const s=fs.readFileSync(path.resolve(__dirname,'../../prev.html'),'utf8');
    const m=/<script id="hnx-release-router-v2216">([\s\S]*?)<\/script>/.exec(s);
    const sim=(p,search,rollback)=>{const store={hydroPro_release_ctl_v1:JSON.stringify(rollback?{rollback:true}:{})},sess={};let went=null;
      function St(o){this.o=o;}St.prototype.getItem=function(k){return Object.prototype.hasOwnProperty.call(this.o,k)?this.o[k]:null;};St.prototype.setItem=function(k,v){this.o[k]=String(v);};St.prototype.removeItem=function(k){delete this.o[k];};
      const ls=new St(store),ss=new St(sess);const win={};
      const ctx={window:win,Storage:St,localStorage:ls,sessionStorage:ss,URLSearchParams,location:{pathname:p,search:search,hash:'',replace:x=>{went=x;}}};
      vm.runInNewContext(m[1],ctx);return went||'(stays)';};
    return {rb,router:!!m,ext:sim('/prev','',false),extStay:sim('/prev','?stay=1',false),htmlStay:sim('/prev.html','?stay=1',false),extRb:sim('/prev','?stay=1',true),nextStay:sim('/next.html','?stay=1',false)};},
  run:function(){return {};},
  expect:{'drive.rb':'/prev.html','drive.router':true,'drive.ext':'/index.html','drive.extStay':'/index.html?stay=1','drive.htmlStay':'/index.html?stay=1','drive.extRb':'(stays)','drive.nextStay':'(stays)'} },

{ name:'🔁 QB Recon → 🏛 2026 government JE audit tells a holder plainly where the QuickBooks export is: "Eyal has the file (qbpay-2026.json)", 📥 Choose file, once on each computer — and has a file input; Joshane sees only the 🔒 line, no file hint (v22.54 audit LOCK-3)',
  requires:REQ, seed:seed({}),
  run:new Function(`return (async()=>{${AS}await sleep(1500);
    const look=async(u)=>{as(u);try{switchView('payroll_qbrecon');}catch(e){}await sleep(1200);try{_hnxPQ.tab('audit');}catch(e){}await sleep(500);
      const b=document.getElementById('payQbrBody');return {t:(b&&b.innerText)||'',file:!!(b&&b.querySelector('input[type=file]'))};};
    const t=await look('tester');let j={t:'',file:false};
    try{as('joshane');window._hnxPayQbrRender&&window._hnxPayQbrRender();await sleep(400);const b=document.getElementById('payQbrBody');j={t:(b&&b.innerText)||'',file:!!(b&&b.querySelector('input[type=file]'))};}catch(e){}
    return {who:/Eyal has the file \\(qbpay-2026\\.json\\)/.test(t.t),how:/📥 Choose file/.test(t.t)&&/once on each computer/.test(t.t),file:t.file,josh:!/qbpay-2026/.test(j.t)&&!j.file};})();`),
  expect:{who:true,how:true,file:true,josh:true} },
];
