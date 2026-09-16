/* Shared harness: one Chromium, the real index.html served from the repo root, a seeded
   session, and value assertions. Every test is a plain object {name, seed, run, expect}.
   seed  : runs in the page BEFORE the app loads (localStorage fixtures)
   run   : runs in the page after the app is up; returns an object
   expect: {'path.to.value': expected, ...} compared with deep equality
   The whole suite is the owner's rulebook in executable form. */
const {chromium}=require('playwright-core');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT=process.env.PORT||'8799';
const BOOT_MS=+(process.env.BOOT_MS||23000);
function get(o,path){return path.split('.').reduce((a,k)=>(a==null?undefined:a[k]),o);}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
async function runCase(t){
  const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  const pg=await b.newPage({viewport:{width:1600,height:1000}});
  const errs=[];pg.on('pageerror',e=>{const s=String(e);if(!/NotSupportedError/.test(s))errs.push(s.slice(0,160));});
  pg.on('dialog',d=>d.accept());
  await pg.addInitScript((extra)=>{
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hnx_first_boot','2026-01-01');
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));
    localStorage.setItem('hydroPro_late_cfg_v1',JSON.stringify({on:true,minMinutes:0,scope:'both'}));
    ['hydroPro_late_approvals_v1','hydroPro_weekend_approvals_v1'].forEach(k=>localStorage.setItem(k,'{}'));
    localStorage.setItem('hydroPro_memos','[]');
    if(extra)eval('('+extra+')()');
  }, t.seed?t.seed.toString():null);
  await pg.goto('http://127.0.0.1:'+PORT+'/index.html?cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
  await pg.waitForTimeout(BOOT_MS);
  let out;
  try{ out=await pg.evaluate('(async()=>{'+PAGE_HELPERS+' return ('+t.run.toString()+')();})()'); }catch(e){ out={__threw:String(e.message).slice(0,200)}; }
  await b.close();
  const fails=[];
  for(const [path,exp] of Object.entries(t.expect||{})){
    const got=get(out,path);
    if(!same(got,exp))fails.push({path,expected:exp,actual:got});
  }
  if(errs.length)fails.push({path:'(page errors)',expected:[],actual:errs.slice(0,3)});
  return {name:t.name,ok:!fails.length,fails,out};
}
/* helpers every test can call inside the page (they are stringified, so keep them self-contained) */
const PAGE_HELPERS=`
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const today=(typeof hnxLocalToday==='function')?hnxLocalToday():new Date().toISOString().slice(0,10);
  const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const daysEnding=(end,n)=>{const out=[];for(let i=n-1;i>=0;i--){const t=new Date(end+'T00:00:00');t.setDate(t.getDate()-i);out.push(ymd(t));}return out;};
  const rec=(st,tin,tout,src,extra)=>Object.assign({status:st,timeIn:tin,timeOut:tout,lateMinutes:st==='late'?60:0,source:src||'fingerprint'},extra||{});
  const setE=E=>localStorage.setItem('hydroPro_employees',JSON.stringify(E));
  const setA=a=>localStorage.setItem('hydroPro_attendance',JSON.stringify(a));
  const labour=(id,name,extra)=>Object.assign({id,name,status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'},extra||{});
  const office=(id,name,extra)=>Object.assign({id,name,status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',dailyRate:700,dateHired:'2025-01-01',hireDate:'2025-01-01'},extra||{});
  const L=l=>({days:l.daysWorked,sun:l.sundaysWorked,absU:l.daysAbsentUnauth,absA:l.daysAbsentAuth,basic:l.basicPay,gap:l.daysGap,rest:l.dayAudit&&l.dayAudit.rest,satNoProof:l.dayAudit&&l.dayAudit.satNoProof,todayWait:l.dayAudit&&l.dayAudit.todayWait,absentDates:l.absentDates,tardy:l.tardyDeduction,latePending:l.latePending,memoAdd:l.memoAdd,net:l.netPay,pending:l.pending&&{late:[l.pending.late.n,l.pending.late.amt],memo:[l.pending.memo.n,l.pending.memo.amt],sun:[l.pending.sun.n,l.pending.sun.amt]}});
`;
module.exports={runCase,PAGE_HELPERS};
