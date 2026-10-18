/* v23.34 (Jinky, 14 Oct 2026: "where to approve the OT? as per checking it's locked" · Eyal: "Jinky should approve that even before
   Dr Amy or me but of course we can override"; Jinky: "on her [Mea's] laptop the OT rates of Admin employees are visible … ensure
   confidential payroll information is accessible only to authorized personnel").
   HR ▸ ✅ Weekend work approvals: ① Jinky (the accountant, by her own account — her role is admin_secondary now) checks first; ② Dr Amy
   or Eyal give the FINAL, at any time — a final ✓ on an empty ① marks it "covered by <name>'s final"; Eyal signs either column; nobody
   signs their own weekend day; payroll pays only a final ✓. Office pay figures show only with 🏢 Office pay.
   Office day rate = monthly basic ÷ 22 (v22.62): ₱16,000 → ₱727.27, Sunday 130% = ₱945.45; ₱30,000 → ₱1,363.64, Sunday ₱1,772.73. */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'admin_secondary',department:'accounting',active:true,permissions:{managePayroll:true}},
    {username:'dramy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'meajean',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr','admin'],active:true},
    {username:'josh',fullname:'Joshane Espinosa',passwordHash:'x',role:'admin_secondary',department:'accounting',departments:['accounting'],allDepts:true,active:true}]));
  const off=(id,name,mb,extra)=>Object.assign({id,name,status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:mb,rate:+(mb/22).toFixed(2),dateHired:'2025-01-01',hireDate:'2025-01-01'},extra||{});
  const EMPS=JSON.stringify([
    off('O1','ANN OFFICE',16000),off('O2','BEA OFFICE',16000),off('O3','CEL OFFICE',16000),
    off('J1','PAGTAMA, JINKY',30000,{linkedUser:'jinky'}),
    off('D1','LABIOS, MARGARITA AMYTHYST P.',16000),
    off('E1','BEN ARI, EYAL',16000,{linkedUser:'eyal'}),
    {id:'L1',name:'LAB WORKER',status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01'}]);
  localStorage.setItem('hydroPro_employees',EMPS);localStorage.setItem('wk_t_emps',EMPS);
  /* the most recent Sunday at least a week back (inside the screen's 10-week window), and the Monday after it for a late */
  const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()-7);while(t.getDay()!==0)t.setDate(t.getDate()-1);
  const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const SUN=ymd(t);const m=new Date(t);m.setDate(m.getDate()+1);const MON=ymd(m);
  localStorage.setItem('wk_t_sun',SUN);localStorage.setItem('wk_t_mon',MON);
  const r={status:'present',timeIn:'08:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'};
  const late={status:'late',timeIn:'08:00',timeOut:'17:00',lateMinutes:60,source:'fingerprint'};
  const A={};A[SUN]={O1:r,O2:r,O3:r,J1:r,D1:r,E1:r};A[MON]={O1:late,L1:late};
  localStorage.setItem('hydroPro_attendance',JSON.stringify(A));
  localStorage.setItem('hydroPro_ph_holidays','{}');
  localStorage.setItem('hydroPro_payroll_runs','[]');
  localStorage.setItem('hydroPro_weekend_approvals_v1','{}');
};
/* in-page helpers shared by the cases (a string, so each case's run can eval it) */
const H=`
  /* the roster exactly as seeded: the ♻ restore of missing employee records adds the built-in roster 6 s after load */
  localStorage.setItem('hydroPro_employees',localStorage.getItem('wk_t_emps'));try{if(typeof loadEmployees==='function')loadEmployees();}catch(e){}
  window.alert=()=>{};window.confirm=()=>true;window.prompt=()=>'checked';
  const SUN=localStorage.getItem('wk_t_sun'),MON=localStorage.getItem('wk_t_mon');
  const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  const ST=()=>JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}');
  const K=id=>id+'|'+SUN;
  const toasts=[];const _st=window.showToast;window.showToast=function(m,k){toasts.push(String(m));try{return _st&&_st.apply(this,arguments);}catch(e){}};
  const screen=()=>{let h=document.getElementById('hrWeekendBody');if(!h){h=document.createElement('div');h.id='hrWeekendBody';document.body.appendChild(h);}
    window._hnxWkRender();const rows={};
    [...h.querySelectorAll('tr')].slice(1).forEach(tr=>{const td=tr.querySelectorAll('td');const nm=((td[1]&&td[1].querySelector('b'))||{}).textContent||'';
      rows[nm]={pay:td[3]?String((td[3].childNodes[0]||{}).textContent||'').trim():'',c1:td[4]?td[4].querySelectorAll('[onclick]').length:0,c2:td[5]?td[5].querySelectorAll('[onclick]').length:0,
        a:td[4]?td[4].textContent:'',chip:td[6]?td[6].textContent:''};});
    const txt=h.textContent||'';const wd=[...h.querySelectorAll('div')].find(d=>/^signed in as/.test(d.textContent||''));const bs=wd?wd.querySelectorAll('b'):[];
    return {rows,html:h.innerHTML,txt,who:bs.length?String(bs[bs.length-1].textContent).trim():''};};
  const sunPay=id=>{const e=(JSON.parse(localStorage.getItem('hydroPro_employees'))||[]).find(x=>x.id===id);const p=getSemiMonthPeriod(SUN);
    const l=calcEmployeePayroll(e,p.start,p.end,'semi_monthly');return Math.round(((+l.sundayPremium||0)+(+l.holidayPay||0))*100)/100;};
`;
module.exports=[
{ name:'✅ Weekend v23.34 — Jinky (admin_secondary "Jinky Pagtama", accounting, managePayroll) ticks ① on ANN / BEA / CEL Sunday (₱945.45 each = 16,000 ÷ 22 × 1.30) and saves → 3 rows WAITING FINAL (Dr Amy / Eyal), 0 final, ANN paid ₱0.00 Sun OT; her ② tick is refused (nothing stored); her own Sunday (PAGTAMA, JINKY ₱1,772.73 = 30,000 ÷ 22 × 1.30) is refused in ① for her (nothing stored, no clickable box); header "my sign: ① (before Dr Amy / Eyal) · office pay yes"; she sees ₱945.45 and ₱1,772.73. Joshane (admin_secondary, no 🏢 Office pay — was a FINAL signer by role) signs nothing and sees 🔒 Office pay',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('jinky');
    hnxWkSet(K('O1'),'acct','ok');hnxWkSet(K('O2'),'acct','ok');hnxWkSet(K('O3'),'acct','ok');
    hnxWkSet(K('O1'),'final','ok');            /* refused: ② is Dr Amy / Eyal */
    hnxWkSet(K('J1'),'acct','ok');             /* refused: her own Sunday */
    hnxWkSave();
    const st=ST();const sc=screen();
    const waitFinal=Object.values(sc.rows).filter(r=>/WAITING FINAL \\(Dr Amy \\/ Eyal\\)/.test(r.chip)).length;
    const finals=['O1','O2','O3','J1','D1','E1'].filter(i=>st[K(i)]&&st[K(i)].final==='ok').length; /* only this case's rows: the v17.35 amnesty signs old history Sundays */
    const jin={acct:['O1','O2','O3'].map(i=>(st[K(i)]||{}).acct||null),by:(st[K('O1')]||{}).acctBy,byU:(st[K('O1')]||{}).acctByU,final:(st[K('O1')]||{}).final||null,own:st[K('J1')]||null,
      who:sc.who,annPay:(sc.rows['ANN OFFICE']||{}).pay,jinPay:(sc.rows['PAGTAMA, JINKY']||{}).pay,annBoxes:[(sc.rows['ANN OFFICE']||{}).c1,(sc.rows['ANN OFFICE']||{}).c2],
      ownBoxes:[(sc.rows['PAGTAMA, JINKY']||{}).c1,(sc.rows['PAGTAMA, JINKY']||{}).c2],waitFinal,finals,annPaid:sunPay('O1'),
      refusedOwn:toasts.some(t=>/your own weekend day/.test(t)),refusedFinal:toasts.some(t=>/FINAL is signed by Dr Amy \\/ Eyal only/.test(t))};
    as('josh');toasts.length=0;
    hnxWkSet(K('O2'),'final','ok');hnxWkSet(K('O3'),'acct','no');hnxWkSave();
    const sj=screen();const st2=ST();
    const josh={who:sj.who,pays:Object.values(sj.rows).map(r=>r.pay),boxes:Object.values(sj.rows).reduce((a,r)=>a+r.c1+r.c2,0),
      no945:sj.html.indexOf('945')<0&&sj.html.indexOf('1,772')<0&&sj.html.indexOf('727.27')<0,o2final:(st2[K('O2')]||{}).final||null,o3acct:(st2[K('O3')]||{}).acct||null};
    return {jin,josh};})();`),
  expect:{'jin.acct':['ok','ok','ok'],'jin.by':'Jinky Pagtama','jin.byU':'jinky','jin.final':null,'jin.own':null,
    'jin.who':'① (before Dr Amy / Eyal)','jin.annPay':'₱945.45','jin.jinPay':'₱1,772.73','jin.annBoxes':[2,0],'jin.ownBoxes':[0,0],
    'jin.waitFinal':3,'jin.finals':0,'jin.annPaid':0,'jin.refusedOwn':true,'jin.refusedFinal':true,
    'josh.who':'NOTHING','josh.pays':['🔒 Office pay','🔒 Office pay','🔒 Office pay','🔒 Office pay','🔒 Office pay','🔒 Office pay'],'josh.boxes':0,'josh.no945':true,
    'josh.o2final':null,'josh.o3acct':'ok'} },

{ name:'✅ Weekend v23.34 — Dr Amy overrides: her ② ✓ on ANN before Jinky has checked stores (final ✓ by Dr Amy Patdu) and ① shows "covered by Dr Amy’s final" (acctCovered final) → ANN paid ₱945.45 Sun OT (16,000 ÷ 22 × 1.30); her ① tick is refused; on BEA after Jinky’s ① her ② keeps Jinky’s check (no cover) → ₱945.45; she signs Jinky’s own Sunday → ₱1,772.73 (30,000 ÷ 22 × 1.30); her own Sunday (LABIOS, MARGARITA AMYTHYST P.) is refused to her and Eyal signs it; header "② Final — may override ①"; un-ticking ② on CEL also clears the ① it covered; acctCovered and the signer usernames survive __hnxMergeWeekend against an older remote copy, both ways',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('jinky');hnxWkSet(K('O2'),'acct','ok');hnxWkSave();
    as('dramy');const who=screen().who;
    hnxWkSet(K('O1'),'final','ok');            /* override: Jinky has not checked ANN */
    hnxWkSet(K('O1'),'acct','ok');             /* refused: ① is Jinky's */
    hnxWkSet(K('O2'),'final','ok');            /* after Jinky */
    hnxWkSet(K('J1'),'final','ok');            /* Jinky's own day */
    hnxWkSet(K('D1'),'final','ok');            /* refused: Dr Amy's own day */
    hnxWkSet(K('O3'),'final','ok');hnxWkSet(K('O3'),'final','ok'); /* ticked and un-ticked in one go: nothing */
    hnxWkSave();
    const st=ST();const sc=screen();
    const a1=st[K('O1')]||{},a2=st[K('O2')]||{},j1=st[K('J1')]||{};
    as('eyal');hnxWkSet(K('D1'),'final','ok');hnxWkSave();const d1=ST()[K('D1')]||{};
    /* a saved cover is withdrawn with its final */
    as('dramy');hnxWkSet(K('O3'),'final','ok');hnxWkSave();const c3a=Object.assign({},ST()[K('O3')]);
    hnxWkSet(K('O3'),'final','ok');hnxWkSave();const c3b=ST()[K('O3')]||{};
    /* sync: an older remote copy of ANN (nothing signed, stamped earlier) merged over the covered row and the other way round */
    const loc=JSON.stringify({[K('O1')]:a1});const rem=JSON.stringify({[K('O1')]:{acct:null,acctAt:1,final:null,finalAt:1}});
    const m1=JSON.parse(window.__hnxMergeWeekend(loc,rem))[K('O1')]||{};const m2=JSON.parse(window.__hnxMergeWeekend(rem,loc))[K('O1')]||{};
    return {who,ann:{acct:a1.acct,cov:a1.acctCovered||null,by:a1.acctBy,final:a1.final,fby:a1.finalBy,fbyU:a1.finalByU,label:/covered by Dr Amy.s final/.test((sc.rows['ANN OFFICE']||{}).a),paid:sunPay('O1')},
      bea:{acct:a2.acct,by:a2.acctBy,cov:a2.acctCovered||null,final:a2.final,paid:sunPay('O2')},
      jin:{final:j1.final,fby:j1.finalBy,paid:sunPay('J1')},
      own:{refused:toasts.some(t=>/your own weekend day/.test(t)&&/Eyal signs it/.test(t)),eyalFinal:d1.final,eyalBy:d1.finalBy,boxes:[(sc.rows['LABIOS, MARGARITA AMYTHYST P.']||{}).c1,(sc.rows['LABIOS, MARGARITA AMYTHYST P.']||{}).c2]},
      refusedAcct:toasts.some(t=>/is Jinky.s check/.test(t)),
      cel:{tickUntick:[(st[K('O3')]||{}).acct==null,(st[K('O3')]||{}).final==null],savedCov:c3a.acctCovered||null,afterUn:[c3b.acct==null,c3b.final==null,c3b.acctCovered||null]},
      merge:{m1:[m1.acctCovered,m1.acctByU,m1.finalByU,m1.final],m2:[m2.acctCovered,m2.acctByU,m2.finalByU,m2.final]}};})();`),
  expect:{who:'② Final — may override ①',
    'ann.acct':'ok','ann.cov':'final','ann.by':'Dr Amy Patdu','ann.final':'ok','ann.fby':'Dr Amy Patdu','ann.fbyU':'dramy','ann.label':true,'ann.paid':945.45,
    'bea.acct':'ok','bea.by':'Jinky Pagtama','bea.cov':null,'bea.final':'ok','bea.paid':945.45,
    'jin.final':'ok','jin.fby':'Dr Amy Patdu','jin.paid':1772.73,
    'own.refused':true,'own.eyalFinal':'ok','own.eyalBy':'Eyal Ben Ari','own.boxes':[0,0],'refusedAcct':true,
    'cel.tickUntick':[true,true],'cel.savedCov':'final','cel.afterUn':[true,true,null],
    'merge.m1':['final','dramy','dramy','ok'],'merge.m2':['final','dramy','dramy','ok']} },

{ name:'✅ Weekend v23.34 — Eyal signs either column: his ① on CEL is his own check; one-click ✓ Approve all 🖐 scanned (payroll banner) gives the FINAL on ANN, BEA, CEL, PAGTAMA, LABIOS (5 days) — BEA keeps Jinky’s ① (acctBy Jinky Pagtama, no cover), CEL keeps his own ①, ANN / PAGTAMA / LABIOS get ① covered by his final — and skips his own Sunday (BEN ARI, EYAL), which Dr Amy then signs; ANN pays ₱945.45 and Jinky ₱1,772.73; header "① + ② Final — ② may override ①"; Jinky gets no Approve-all button and the one-click is refused to her',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('jinky');hnxWkSet(K('O2'),'acct','ok');hnxWkSave();
    const jBtn=/hnxWkApproveAll/.test(hnxWkPendBanner(SUN,SUN));hnxWkApproveAll(SUN,SUN);const jAll=['O1','O2','O3','J1','D1','E1'].filter(i=>(ST()[K(i)]||{}).final==='ok').length;
    as('eyal');const who=screen().who;const eBtn=/hnxWkApproveAll/.test(hnxWkPendBanner(SUN,SUN));
    hnxWkSet(K('O3'),'acct','ok');hnxWkSave();
    hnxWkApproveAll(SUN,SUN);
    const st=ST();const f=k=>st[K(k)]||{};
    const finals=['O1','O2','O3','J1','D1','E1'].filter(i=>f(i).final==='ok');
    as('dramy');hnxWkSet(K('E1'),'final','ok');hnxWkSave();const e1=ST()[K('E1')]||{};
    return {who,jBtn,eBtn,jAll,finals,bea:[f('O2').acctBy,f('O2').acctCovered||null],cel:[f('O3').acctBy,f('O3').acctCovered||null],
      covered:['O1','J1','D1'].map(i=>f(i).acctCovered||null),coveredBy:f('O1').acctBy,ownSkipped:(st[K('E1')]||{}).final||null,
      amyOnEyal:[e1.final,e1.finalBy,e1.acctCovered||null],paid:[sunPay('O1'),sunPay('J1')]};})();`),
  expect:{who:'① + ② Final — ② may override ①',jBtn:false,eBtn:true,jAll:0,finals:['O1','O2','O3','J1','D1'],
    bea:['Jinky Pagtama',null],cel:['Eyal Ben Ari',null],covered:['final','final','final'],coveredBy:'Eyal Ben Ari',ownSkipped:null,
    amyOnEyal:['ok','Dr Amy Patdu','final'],paid:[945.45,1772.73]} },

{ name:'🔒 Office pay v23.34 — Mea (supervisor, HR, no 💰, no 🏢 Office pay) sees the 🔒 Office pay LOCK instead of the Weekend screen (v23.50: 0 rows, no "ANN OFFICE", no "130%", no "945" / "1,772" / "727.27"; v23.34 only hid the pesos); ⏰ Late approvals shows 🔒 for ANN’s 60-minute late (Jinky sees ₱90.91 = 60 ÷ 480 × 727.27) and for the labourer’s (Jinky sees ₱82.25 = 60 ÷ 480 × 658); HR ⬇ Export leaves monthlyBasic / rate out for ANN and the labourer (file says 7 people); an ⬆ Import by Mea saying ANN ₱99,999 keeps ₱16,000 (name change accepted)',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    const lateHtml=()=>{let v=document.getElementById('view-hr_late');if(!v){v=document.createElement('div');v.className='view';v.id='view-hr_late';document.body.appendChild(v);}
      window.renderHrLateView();return v.innerHTML;};
    as('jinky');const jl=lateHtml();const jw=screen();
    as('meajean');const mw=screen();const ml=lateHtml();
    /* ⬇ Export: catch the file instead of downloading it */
    const blobs=[];const _c=URL.createObjectURL,_k=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{blobs.push(b);return '#';};HTMLAnchorElement.prototype.click=function(){};
    try{exportHR();}catch(e){}URL.createObjectURL=_c;HTMLAnchorElement.prototype.click=_k;
    let file={};try{file=JSON.parse(await blobs[0].text());}catch(e){}
    const fe=id=>(file.employees||[]).find(x=>x.id===id)||{};
    /* ⬆ Import by Mea: ANN 99,999 and a new name */
    const all=JSON.parse(localStorage.getItem('hydroPro_employees'));const fake=all.map(e=>e.id==='O1'?Object.assign({},e,{name:'ANN OFFICE-SANTOS',monthlyBasic:99999,rate:4545.41}):e);
    const f=new File([JSON.stringify({employees:fake})],'hr.json',{type:'application/json'});
    importHR({files:[f],value:''});await sleep(900);
    const ann=(JSON.parse(localStorage.getItem('hydroPro_employees'))||[]).find(e=>e.id==='O1')||{};
    return {mea:{lock:/data-wk-lock/.test(mw.html),rows:Object.keys(mw.rows).length,clean:mw.html.indexOf('945')<0&&mw.html.indexOf('1,772')<0&&mw.html.indexOf('727.27')<0&&mw.html.indexOf('130%')<0&&mw.html.indexOf('ANN OFFICE')<0,
        late:{lock:/🔒 Office pay/.test(ml),noAnn:ml.indexOf('90.91')<0,noLab:ml.indexOf('82.25')<0}},
      jinky:{pay:(jw.rows['ANN OFFICE']||{}).pay,office:/office pay yes/.test(jw.txt),late:[jl.indexOf('₱90.91')>=0,jl.indexOf('₱82.25')>=0]},
      exp:{gotFile:!!file.employees,annMb:fe('O1').monthlyBasic===undefined,annRate:fe('O1').rate===undefined,labRate:fe('L1').dailyRate===undefined,annName:fe('O1').name,left:(file.payFieldsLeftOut||{}).people},
      imp:{name:ann.name,mb:ann.monthlyBasic,rate:ann.rate}};})();`),
  expect:{'mea.lock':true,'mea.rows':0,'mea.clean':true,
    'mea.late.lock':true,'mea.late.noAnn':true,'mea.late.noLab':true,
    'jinky.pay':'₱945.45','jinky.office':true,'jinky.late':[true,true],
    'exp.gotFile':true,'exp.annMb':true,'exp.annRate':true,'exp.labRate':true,'exp.annName':'ANN OFFICE','exp.left':7,
    'imp.name':'ANN OFFICE-SANTOS','imp.mb':16000,'imp.rate':727.27} },

{ name:'🔒 Office pay v23.34 — a Joshane-like account (admin_secondary: 💰 labour rates by role, no 🏢 Office pay): HR Daily Payroll Base ₱658 (the labourer only; Jinky ₱5,658 = 5 × 727.27 + 1,363.64 + 658), Training ▸ Level Rates Total Daily Payroll ₱658 (Jinky ₱5,657.99), HR Final Pay refused for ANN (office) and opened for the labourer, the office payroll drill-down refused ("Office pay")',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    const base=()=>{try{renderHR();}catch(e){}const t=(document.getElementById('hrStats')||{}).textContent||'';return (t.match(/Daily Payroll Base\\s*(₱[\\d,]+|🔒)/)||['',''])[1];};
    const lvl=()=>{let b=document.getElementById('trainingBody');if(!b){b=document.createElement('div');b.id='trainingBody';document.body.appendChild(b);}try{renderTrainRates();}catch(e){}
      return ((b.textContent||'').match(/Total Daily Payroll\\s*(₱[\\d,.]+|🔒)/)||['',''])[1];};
    const fp=id=>{const o=document.getElementById('hnxFpModal');if(o)o.remove();try{hnxOpenFinalPay(id);}catch(e){}const m=!!document.getElementById('hnxFpModal');const o2=document.getElementById('hnxFpModal');if(o2)o2.remove();return m;};
    as('josh');const jb=base(),jl=lvl(),jfA=fp('O1'),jfL=fp('L1');toasts.length=0;
    window._payOfficeCurrentPeriod={start:SUN,end:SUN};try{window._drillPayroll('office');}catch(e){}const drill=toasts.some(t=>/Office pay/.test(t));
    as('jinky');const kb=base(),kl=lvl(),kfA=fp('O1');
    return {josh:{base:jb,lvl:jl,fpAnn:jfA,fpLab:jfL,drillRefused:drill},jinky:{base:kb,lvl:kl,fpAnn:kfA}};})();`),
  expect:{'josh.base':'₱658','josh.lvl':'₱658','josh.fpAnn':false,'josh.fpLab':true,'josh.drillRefused':true,
    'jinky.base':'₱5,658','jinky.lvl':'₱5,657.99','jinky.fpAnn':true} },

{ name:'🔑 Chains by account, not role (v23.34): Jinky (admin_secondary) is refused the payroll Approve & Lock ("Final payroll approval is for Eyal / Dr Amy only"), the CEA FINAL sign-off (her accounting step stores), an escalated attendance deviation, and the fuel-card reconciliation review; Dr Amy passes each — Approve & Lock reaches "Nothing to approve", the CEA approval becomes approved, the deviation approved, the reconciliation reviewedBy Dr Amy Patdu',
  seed:new Function('('+SEED.toString()+')();('+(function(){
    localStorage.setItem('hydroPro_cea_appr_v1',JSON.stringify([{id:'AP1',caseId:'',type:'Permit fee',amount:5000,chain:['accounting','final'],decisions:[],status:'pending',at:new Date().toISOString()}]));
    localStorage.setItem('hydroPro_att_dev_v1',JSON.stringify({DV1:{id:'DV1',status:'escalated',empId:'L1',name:'LAB WORKER',date:localStorage.getItem('wk_t_mon'),times:['07:00','07:40'],escalatedBy:'Jinky Pagtama',escalatedAt:new Date().toISOString(),escNote:'two people on one ID?'}}));}).toString()+')();'),
  run:new Function(`return (async()=>{${H}await sleep(3000);
    const P0={start:SUN,end:SUN};window._payOfficeCurrentPeriod=P0;window._payOpsCurrentPeriod=P0;
    as('jinky');toasts.length=0;try{payOfficeApprove();}catch(e){}try{payOpsApprove();}catch(e){}const jLock=toasts.filter(t=>/Final payroll approval is for Eyal \\/ Dr Amy only/.test(t)).length;
    try{CEA.decideAppr('AP1',true,'');}catch(e){}const ceaAcct=(JSON.parse(localStorage.getItem('hydroPro_cea_appr_v1'))[0]||{}).decisions.length;
    toasts.length=0;try{CEA.decideAppr('AP1',true,'');}catch(e){}const ceaJ=JSON.parse(localStorage.getItem('hydroPro_cea_appr_v1'))[0]||{};const ceaRef=toasts.some(t=>/Final approval is President\\/VP/.test(t));
    try{hnxAttDev.decide('DV1','approved');}catch(e){}const devJ=(JSON.parse(localStorage.getItem('hydroPro_att_dev_v1'))||{}).DV1||{};
    let recJ=null;try{hnxFuelPolicy.reconMode('weekly',SUN);hnxFuelPolicy.reconStamp('reviewed');recJ=(JSON.parse(localStorage.getItem('hydroPro_fuel_recon_v1')||'[]')||[]).filter(r=>r&&r.reviewedBy).length;}catch(e){recJ='threw '+e.message;}
    as('dramy');toasts.length=0;try{payOfficeApprove();}catch(e){}const aLock=[toasts.some(t=>/Final payroll approval is for Eyal/.test(t)),toasts.some(t=>/Nothing to approve/.test(t))];
    try{CEA.decideAppr('AP1',true,'');}catch(e){}const ceaA=JSON.parse(localStorage.getItem('hydroPro_cea_appr_v1'))[0]||{};
    try{hnxAttDev.decide('DV1','approved');}catch(e){}const devA=(JSON.parse(localStorage.getItem('hydroPro_att_dev_v1'))||{}).DV1||{};
    let recA=null;try{hnxFuelPolicy.reconStamp('reviewed');recA=((JSON.parse(localStorage.getItem('hydroPro_fuel_recon_v1')||'[]')||[]).filter(r=>r&&r.reviewedBy)[0]||{}).reviewedBy||null;}catch(e){recA='threw '+e.message;}
    return {jinky:{lock:jLock,ceaAcctStep:ceaAcct,ceaFinal:[ceaJ.status,ceaJ.decisions.length,ceaRef],dev:devJ.status,recon:recJ},
      amy:{lock:aLock,cea:[ceaA.status,ceaA.decisions.length],dev:devA.status,recon:recA}};})();`),
  expect:{'jinky.lock':2,'jinky.ceaAcctStep':1,'jinky.ceaFinal':['pending',1,true],'jinky.dev':'escalated','jinky.recon':0,
    'amy.lock':[false,true],'amy.cea':['approved',2],'amy.dev':'approved','amy.recon':'Dr Amy Patdu'} },
];

/* ---- v23.36 review fixes (7 confirmed findings) ---- */
/* catch a file a screen would download: run fn, return the text of the first Blob it built */
const GRAB=`const grab=async fn=>{const blobs=[];const _c=URL.createObjectURL,_r=URL.revokeObjectURL,_k=HTMLAnchorElement.prototype.click;
    URL.createObjectURL=b=>{blobs.push(b);return '#';};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){};
    try{fn();}catch(e){}URL.createObjectURL=_c;URL.revokeObjectURL=_r;HTMLAnchorElement.prototype.click=_k;await sleep(50);return blobs[0]?await blobs[0].text():'';};
  const csvRow=(csv,first)=>{const L=String(csv||'').split('\\n');const h=L[0].split(',');const r=(L.find(l=>l.indexOf(first)===0)||'').split(',');const o={};h.forEach((k,i)=>{o[k]=r[i];});return o;};`;
module.exports.push(
{ name:'🔁 Weekend sync (review) — Jinky ✗ on ANN’s Sunday (t0) meets Dr Amy’s one-click ✓ Approve all 🖐 scanned (t1) from a computer that had not pulled the ✗: the merge keeps ① no by jinky with no "covered by" (both ways) and sets the blind final back to pending (finalBlind dramy) → ANN ₱0.00, not ₱945.45 (16,000 ÷ 22 × 1.30); row REJECTED BY ACCOUNTING with the red "back to pending" line; BEA (no ✗) keeps the covered final → ₱945.45; Dr Amy’s deliberate ② ✓ after seeing the ✗ pays ANN ₱945.45 and survives a merge with the stale copy (both ways)',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('jinky');hnxWkSet(K('O1'),'acct','no');hnxWkSave();const jin=ST();await sleep(20);
    localStorage.setItem('hydroPro_weekend_approvals_v1','{}');           /* Dr Amy's laptop: Jinky's ✗ not pulled yet */
    as('dramy');hnxWkApproveAll(SUN,SUN);const amy=ST();const a0=amy[K('O1')]||{};
    const mA=JSON.parse(window.__hnxMergeWeekend(JSON.stringify(jin),JSON.stringify(amy)));
    const mB=JSON.parse(window.__hnxMergeWeekend(JSON.stringify(amy),JSON.stringify(jin)));
    const f=x=>[x.acct||null,x.acctByU||null,x.acctCovered||null,x.final||null,(x.finalBlind||{}).byU||null];
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(mA));
    const sc=screen();const blindPaid=sunPay('O1'),beaPaid=sunPay('O2');
    await sleep(20);hnxWkSet(K('O1'),'final','ok');hnxWkSave();const del=ST()[K('O1')]||{};const delPaid=sunPay('O1');
    const now=ST();const mC=JSON.parse(window.__hnxMergeWeekend(JSON.stringify(now),JSON.stringify(amy)))[K('O1')]||{};
    const mD=JSON.parse(window.__hnxMergeWeekend(JSON.stringify(amy),JSON.stringify(now)))[K('O1')]||{};
    return {stale:[a0.final||null,a0.acctCovered||null],m:f(mA[K('O1')]||{}),mRev:f(mB[K('O1')]||{}),bea:[(mA[K('O2')]||{}).final,(mA[K('O2')]||{}).acctCovered||null],
      chip:/REJECTED BY ACCOUNTING/.test((sc.rows['ANN OFFICE']||{}).chip),note:/was given before Jinky.s ✗ reached it — back to pending/.test(sc.txt),
      blindPaid,beaPaid,del:[del.final,del.acct,del.finalBlind||null],delPaid,mC:[mC.acct,mC.final,mC.finalByU],mD:[mD.acct,mD.final,mD.finalByU]};})();`),
  expect:{stale:['ok','final'],m:['no','jinky',null,null,'dramy'],mRev:['no','jinky',null,null,'dramy'],bea:['ok','final'],chip:true,note:true,
    blindPaid:0,beaPaid:945.45,del:['ok','no',null],delPaid:945.45,mC:['no','ok','dramy'],mD:['no','ok','dramy']} },

{ name:'🔁 Weekend sync (review) — Dr Amy’s ② ✓ on CEL covers ① (t1), Eyal turns ② to ✗ (t2): the cleared ① is dated (acctAt ≥ t1), so merging with the t1 copy both ways — and with an older undated clear — gives ① empty, no "covered by Dr Amy’s final", ② no → CEL ₱0.00; Eyal’s later ② ✓ writes a cover of HIS final (covered by Eyal’s final) → ₱945.45 (16,000 ÷ 22 × 1.30)',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('dramy');hnxWkSet(K('O3'),'final','ok');hnxWkSave();const c1=JSON.parse(JSON.stringify(ST()));const t1=(c1[K('O3')]||{}).finalAt;await sleep(20);
    as('eyal');hnxWkSet(K('O3'),'final','no');hnxWkSave();const c2=JSON.parse(JSON.stringify(ST()));const r2=c2[K('O3')]||{};
    const mg=(l,r)=>JSON.parse(window.__hnxMergeWeekend(JSON.stringify(l),JSON.stringify(r)))[K('O3')]||{};
    const und=JSON.parse(JSON.stringify(c2));und[K('O3')].acctAt=null;
    const f=x=>[x.acct||null,x.acctCovered||null,x.final||null];
    const m1=mg(c2,c1),m2=mg(c1,c2),m3=mg(und,c1),m4=mg(c1,und);
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(Object.assign({},c2,{[K('O3')]:m2})));const paidNo=sunPay('O3');
    await sleep(20);hnxWkSet(K('O3'),'final','ok');hnxWkSave();const e3=ST()[K('O3')]||{};const sc=screen();
    return {dated:[r2.acct||null,typeof r2.acctAt==='number'&&r2.acctAt>=t1,r2.final],m1:f(m1),m2:f(m2),m3:f(m3),m4:f(m4),paidNo,
      eyal:[e3.acct,e3.acctBy,e3.acctCovered||null,e3.final],label:/covered by Eyal.s final/.test((sc.rows['CEL OFFICE']||{}).a),paid:sunPay('O3')};})();`),
  expect:{dated:[null,true,'no'],m1:[null,null,'no'],m2:[null,null,'no'],m3:[null,null,'no'],m4:[null,null,'no'],paidNo:0,
    eyal:['ok','Eyal Ben Ari','final','ok'],label:true,paid:945.45} },

{ name:'🔑 Weekend ① fallback (review) — Joshane (admin_secondary, accounting, managePayroll by role) with an owner-granted 🏢 Office pay sees ₱945.45 but signs NOTHING while Jinky’s account exists: header "NOTHING", 0 boxes, his ① tick on ANN stores nothing; once 🏛 Approvers names him the accountant he signs ① (BEA ok by josh, header "① (before Dr Amy / Eyal)") and Jinky signs nothing (CEL nothing stored)',
  seed:new Function('('+SEED.toString()+')();('+(function(){
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({josh:{sensitive:{office:{on:true,by:'eyal',at:new Date().toISOString()}}}}));}).toString()+')();'),
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('josh');const off=!!window.hnxCanOfficePay();const sc=screen();
    hnxWkSet(K('O1'),'acct','ok');hnxWkSet(K('O1'),'final','ok');hnxWkSave();const o1=ST()[K('O1')]||null;
    localStorage.setItem('hydroPro_memo_approvers_v1',JSON.stringify({acctUser:'josh'}));
    const sc2=screen();hnxWkSet(K('O2'),'acct','ok');hnxWkSave();const o2=ST()[K('O2')]||{};
    as('jinky');const sc3=screen();hnxWkSet(K('O3'),'acct','ok');hnxWkSave();const o3=ST()[K('O3')]||null;
    return {josh:{office:off,who:sc.who,pay:(sc.rows['ANN OFFICE']||{}).pay,boxes:Object.values(sc.rows).reduce((a,r)=>a+r.c1+r.c2,0),o1},
      named:{who:sc2.who,o2:[o2.acct||null,o2.acctByU||null]},jinky:{who:sc3.who,o3}};})();`),
  expect:{'josh.office':true,'josh.who':'NOTHING','josh.pay':'₱945.45','josh.boxes':0,'josh.o1':null,
    'named.who':'① (before Dr Amy / Eyal)','named.o2':['ok','josh'],'jinky.who':'NOTHING','jinky.o3':null} },

{ name:'📦 HR import (review) — Mea’s ⬇ Export (no 🏢 Office pay) leaves ANN’s monthly basic / rate / allowances out and names them (_payLeftOut); Eyal’s ⬆ Import of that file keeps ₱16,000, rate 727.27 and the ₱1,000 allowance, so her Sunday still prices ₱945.45 (16,000 ÷ 22 × 1.30), not ₱455; an older file marked only payFieldsLeftOut keeps them too; a file that DOES carry ₱17,600 changes it; 🛟 Make this the truth with Mea’s older file keeps the stored ₱17,600',
  seed:SEED,
  run:new Function(`return (async()=>{${H}${GRAB}await sleep(3000);
    const E0=JSON.parse(localStorage.getItem('hydroPro_employees'));E0.find(e=>e.id==='O1').allowances=[{name:'Rice',amount:1000,taxable:false}];
    localStorage.setItem('hydroPro_employees',JSON.stringify(E0));try{loadEmployees();}catch(e){}
    const ann=()=>(JSON.parse(localStorage.getItem('hydroPro_employees'))||[]).find(e=>e.id==='O1')||{};
    const pick=x=>[x.monthlyBasic,x.rate,(x.allowances||[]).length,x._payLeftOut===undefined];
    as('meajean');let file={};try{file=JSON.parse(await grab(()=>exportHR()));}catch(e){}
    const fa=(file.employees||[]).find(x=>x.id==='O1')||{};
    as('eyal');const imp=async o=>{importHR({files:[new File([JSON.stringify(o)],'hr.json',{type:'application/json'})],value:''});await sleep(900);return ann();};
    const a1=await imp(file);const price=window.hnxWkPriceFor(a1,SUN).pay;
    const old=JSON.parse(JSON.stringify(file));(old.employees||[]).forEach(e=>{delete e._payLeftOut;});const a2=await imp(old);
    const full={employees:JSON.parse(localStorage.getItem('hydroPro_employees')).map(e=>e.id==='O1'?Object.assign({},e,{monthlyBasic:17600,rate:800}):e)};const a3=await imp(full);
    const rf=new File([JSON.stringify(old)],'hr-old.json',{type:'application/json'});window.hnxRosterFile({files:[rf]});await sleep(600);
    window.hnxRosterPick(0);const a4=ann();
    return {file:{mb:fa.monthlyBasic===undefined,al:fa.allowances===undefined,list:['monthlyBasic','rate','allowances'].every(k=>(fa._payLeftOut||[]).indexOf(k)>=0)},
      eyalImport:pick(a1),price,oldFile:pick(a2),fullFile:[a3.monthlyBasic,a3.rate],roster:[a4.monthlyBasic,a4.rate,(a4.allowances||[]).length,a4._payLeftOut===undefined]};})();`),
  expect:{'file.mb':true,'file.al':true,'file.list':true,eyalImport:[16000,727.27,1,true],price:945.45,oldFile:[16000,727.27,1,true],
    fullFile:[17600,800],roster:[17600,800,1,true]} },

{ name:'💸 HR Final Pay dashboard (review) — a Joshane-like account (💰 labour rates, no 🏢 Office pay): PAID OUT reads "₱ 4,606.00 + 2 🔒 Office pay" (the labourer only; ANN ₱22,345.67 and a leaver no longer on the roster ₱9,999.99 left out), no 22,345 / 9,999 on screen, 💾 Export CSV has empty base_wages / net_final_pay for ANN and the unknown leaver (pay_left_out note) and 4606 for the labourer, the unknown leaver’s Final Pay window refused; Jinky’s PAID OUT is ₱ 36,951.66 and her CSV carries 22345.67 with no pay_left_out column',
  seed:new Function('('+SEED.toString()+')();('+(function(){
    localStorage.setItem('hydroPro_offboarding_v1',JSON.stringify({
      O1:{empId:'O1',reason:'resignation',status:'completed',startedAt:'2026-09-20T00:00:00Z',finalizedAt:'2026-09-30T00:00:00Z'},
      L1:{empId:'L1',reason:'resignation',status:'completed',startedAt:'2026-09-20T00:00:00Z',finalizedAt:'2026-09-30T00:00:00Z'},
      X9:{empId:'X9',reason:'resignation',status:'completed',startedAt:'2026-09-20T00:00:00Z',finalizedAt:'2026-09-30T00:00:00Z'}}));
    const fp=(id,c)=>({empId:id,status:'released',lastWorkingDay:'2026-09-30',calc:c,preparedBy:'Jinky',approvedBy:'Dr Amy',releasedBy:'Eyal',releasedAt:'2026-10-05T00:00:00Z'});
    localStorage.setItem('hydroPro_final_pay_v1',JSON.stringify({
      O1:fp('O1',{baseWagesLastPeriod:8000,prorated13thMonth:12000,leaveCashValue:3636.36,totalEarnings:23636.36,totalDeductions:1290.69,netFinalPay:22345.67}),
      L1:fp('L1',{baseWagesLastPeriod:3948,prorated13thMonth:658,leaveCashValue:0,totalEarnings:4606,totalDeductions:0,netFinalPay:4606}),
      X9:fp('X9',{baseWagesLastPeriod:9999.99,prorated13thMonth:0,leaveCashValue:0,totalEarnings:9999.99,totalDeductions:0,netFinalPay:9999.99})}));}).toString()+')();'),
  run:new Function(`return (async()=>{${H}${GRAB}await sleep(3000);
    const dash=()=>{window.renderHrFinalPayDashboard();const t=(document.getElementById('hrFinalPayHost')||{}).textContent||'';
      return {t,paid:((t.match(/PAID OUT💸(.*?)TOTAL/)||[])[1]||'').trim()};};
    const fpo=id=>{const o=document.getElementById('hnxFpModal');if(o)o.remove();try{hnxOpenFinalPay(id);}catch(e){}const m=!!document.getElementById('hnxFpModal');const o2=document.getElementById('hnxFpModal');if(o2)o2.remove();return m;};
    as('josh');const d=dash();const csv=await grab(()=>window.__hnxFpExport());const o1=csvRow(csv,'O1,'),l1=csvRow(csv,'L1,'),x9=csvRow(csv,'X9,');const x9open=fpo('X9');
    as('jinky');const dj=dash();const cj=await grab(()=>window.__hnxFpExport());const j1=csvRow(cj,'O1,');
    return {josh:{paid:d.paid,clean:d.t.indexOf('22,345')<0&&d.t.indexOf('9,999')<0,o1:[o1.base_wages,o1.net_final_pay,/office pay/.test(o1.pay_left_out||'')],
        l1:l1.net_final_pay,x9:[x9.net_final_pay,/office pay/.test(x9.pay_left_out||'')],csvClean:csv.indexOf('22345')<0&&csv.indexOf('9999')<0,x9open},
      jinky:{paid:dj.paid,o1:j1.net_final_pay,col:cj.split('\\n')[0].indexOf('pay_left_out')>=0}};})();`),
  expect:{'josh.paid':'3₱ 4,606.00 + 2 🔒 Office pay','josh.clean':true,'josh.o1':['','',true],'josh.l1':'4606','josh.x9':['',true],'josh.csvClean':true,'josh.x9open':false,
    'jinky.paid':'3₱ 36,951.66','jinky.o1':'22345.67','jinky.col':false} },

{ name:'🎓 Training (review) — a Joshane-like account (💰, no 🏢 Office pay): the employee profile of ANN shows Daily Rate "🔒 Office pay", the Skills-matrix CSV gives "🔒 Office pay" for ANN (no 727.27 = 16,000 ÷ 22) and a figure for the labourer, the training certificate says "Daily Rate: 🔒 Office pay"; Jinky sees ₱727.27 in all three; Mea (no 💰) gets RESTRICTED',
  seed:SEED,
  run:new Function(`return (async()=>{${H}${GRAB}await sleep(3000);
    const prof=id=>{let b=document.getElementById('trainingBody');if(!b){b=document.createElement('div');b.id='trainingBody';document.body.appendChild(b);}
      _trainSelEmp=id;try{renderTrainEmployee();}catch(e){return 'threw '+e.message;}return ((b.textContent||'').match(/Daily Rate\\s*(🔒 Office pay|🔒|₱[\\d,.]+)/)||['',''])[1];};
    const cell=(csv,nm)=>{const r=String(csv).split('\\n').find(l=>l.indexOf('"'+nm+'"')===0)||'';const c=r.split('","');return (c[5]||'').replace(/"/g,'');};
    const run=async u=>{as(u);const m=await grab(()=>exportTrainMatrix());const c=await grab(()=>exportEmpCert('O1'));
      return {prof:prof('O1'),ann:cell(m,'ANN OFFICE'),lab:cell(m,'LAB WORKER'),no727:m.indexOf('727.27')<0&&c.indexOf('727.27')<0,cert:(c.match(/Daily Rate: [^"]*/)||[''])[0]};};
    const j=await run('josh'),k=await run('jinky'),m=await run('meajean');
    return {josh:{prof:j.prof,ann:j.ann,lab:/^\\d/.test(j.lab),no727:j.no727,cert:j.cert},jinky:{prof:k.prof,ann:k.ann,cert:k.cert},mea:{ann:m.ann,cert:m.cert}};})();`),
  expect:{'josh.prof':'🔒 Office pay','josh.ann':'🔒 Office pay','josh.lab':true,'josh.no727':true,'josh.cert':'Daily Rate: 🔒 Office pay',
    'jinky.prof':'₱727.27','jinky.ann':'727.27','jinky.cert':'Daily Rate: ₱727.27','mea.ann':'RESTRICTED','mea.cert':'Daily Rate: RESTRICTED'} },

{ name:'⏰ Late memo (review) — Eyal’s ₱91.00 penalty on ANN’s 60-minute late (60 ÷ 480 × 727.27 = 90.91 → typed 91) writes the memo "Late — penalty (amount on ⏰ Late approvals)" with no ₱ in reason / description / notes (lateAmount 91 kept); an older memo saying "Late — penalty ₱82.00" is rewritten once (1, then 0) and dated; Mea opening either memo reads no ₱91 / ₱82; Jinky still sees PENALTY ₱91.00 on ⏰ Late approvals',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3000);
    as('eyal');const ok=window.hnxLate.decide(MON,'O1','penalty',91,'','ANN OFFICE',60);
    const id='LATE_'+MON+'_O1',idO='LATE_'+MON+'_L1';
    const M=()=>JSON.parse(localStorage.getItem('hydroPro_memos'))||[];const mem=M().find(m=>m.id===id)||{};
    const txt=[mem.reason,mem.description,mem.note,mem.notes].join(' | ');
    const body='LAB WORKER was 60 minute(s) late on '+MON+'. Late — penalty ₱82.00. Decided by Eyal Ben Ari.';
    const all=M();all.push({id:idO,category:'hr',type:'bad',kind:'bad',subject:'Late — '+MON,title:'Late — LAB WORKER · '+MON,reason:'Late — penalty ₱82.00',reasonKey:'tardiness',reasonLabel:'Tardiness',
      reasons:['Tardiness'],description:body,note:body,notes:body,empId:'L1',employeeId:'L1',employees:['L1'],name:'LAB WORKER',date:MON,createdAt:'2026-10-06T01:00:00.000Z',createdBy:'Eyal Ben Ari',
      status:'signed',noMoney:true,amount:0,amt:0,source:'late_approval',lateMinutes:60,lateDecision:'penalty',lateAmount:82});
    localStorage.setItem('hydroPro_memos',JSON.stringify(all));
    const n1=window.hnxLate.scrubPenaltyPesos(),n2=window.hnxLate.scrubPenaltyPesos();const old=M().find(m=>m.id===idO)||{};
    const otxt=[old.reason,old.description,old.note,old.notes].join(' | ');
    as('meajean');const view=mid=>{try{if(typeof loadMemos==='function')loadMemos();openMemoView(mid);return (document.getElementById('memoViewBody')||{}).textContent||'';}catch(e){return 'threw '+e.message;}};
    const v1=view(id),v2=view(idO);
    as('jinky');let lt='';try{let v=document.getElementById('view-hr_late');if(!v){v=document.createElement('div');v.className='view';v.id='view-hr_late';document.body.appendChild(v);}window.hnxLateSet('show','decided');window.renderHrLateView();lt=v.textContent||'';}catch(e){lt='threw '+e.message;}
    return {ok,reason:mem.reason,peso:/₱/.test(txt)||/91/.test(txt),lateAmount:mem.lateAmount,scrub:[n1,n2],old:[/₱|82/.test(otxt),/amount on ⏰ Late approvals/.test(old.notes||''),!!old.updatedAt],
      mea:[v1.indexOf('₱91')<0&&v1.indexOf('91.00')<0&&!/^threw/.test(v1)&&v1.length>0,v2.indexOf('₱82')<0&&v2.indexOf('82.00')<0&&!/^threw/.test(v2)&&v2.length>0],jinkyLate:/PENALTY ₱91\\.00/.test(lt)};})();`),
  expect:{ok:true,reason:'Late — penalty (amount on ⏰ Late approvals)',peso:false,lateAmount:91,scrub:[1,0],old:[false,true,true],mea:[true,true],jinkyLate:true} }
);
