/* v23.50 (Eyal, 18 Oct 2026: "Mea see the sunday/Saturday over time rate which only Jinky, me and Dr Amy can see … check and double check
   NO ONE can see salaries related numbers"): HR ▸ ✅ Weekend Approvals is OFFICE PAY as a whole — the tab is listed and the screen renders
   only for 🏢 Office pay holders (hnxCanOfficePay: System Admin login, Jinky, Dr Amy, Eyal + owner grants). Everyone else gets a lock. */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'admin_secondary',department:'accounting',active:true,permissions:{managePayroll:true}},
    {username:'dramy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'meajean',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr','admin'],active:true},
    {username:'josh',fullname:'Joshane Espinosa',passwordHash:'x',role:'admin_secondary',department:'accounting',departments:['accounting'],allDepts:true,active:true}]));
  const off=(id,name,mb,extra)=>Object.assign({id,name,status:'Active',salaryCategory:'accounting',dept:'Accounting',payType:'semi',employmentType:'Regular',monthlyBasic:mb,rate:+(mb/22).toFixed(2),dateHired:'2025-01-01',hireDate:'2025-01-01'},extra||{});
  const EMPS=JSON.stringify([off('O1','ANN OFFICE',16000),off('O2','BEA OFFICE',16000),off('O3','CEL OFFICE',16000)]);
  localStorage.setItem('hydroPro_employees',EMPS);localStorage.setItem('pp_t_emps',EMPS);
  const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()-7);while(t.getDay()!==0)t.setDate(t.getDate()-1);
  const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const SUN=ymd(t);localStorage.setItem('pp_t_sun',SUN);
  const r={status:'present',timeIn:'08:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'};
  const A={};A[SUN]={O1:r,O2:r,O3:r};
  localStorage.setItem('hydroPro_attendance',JSON.stringify(A));
  localStorage.setItem('hydroPro_ph_holidays','{}');localStorage.setItem('hydroPro_payroll_runs','[]');
  localStorage.setItem('hydroPro_weekend_approvals_v1','{}');localStorage.setItem('hydroPro_user_perms','{}');
};
const H=`
  localStorage.setItem('hydroPro_employees',localStorage.getItem('pp_t_emps'));try{if(typeof loadEmployees==='function')loadEmployees();}catch(e){}
  window.alert=()=>{};window.confirm=()=>true;
  const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));
  const tabs=()=>{try{return getVisibleViews('hr').map(v=>v.id);}catch(e){return ['ERR '+e.message];}};
  const screen=()=>{let h=document.getElementById('hrWeekendBody');if(!h){h=document.createElement('div');h.id='hrWeekendBody';document.body.appendChild(h);}
    window._hnxWkRender();const html=h.innerHTML;const rows=[...h.querySelectorAll('tr')].slice(1).map(tr=>{const td=tr.querySelectorAll('td');
      return {name:((td[1]&&td[1].querySelector('b'))||{}).textContent||'',pay:td[3]?String((td[3].childNodes[0]||{}).textContent||'').trim():''};});
    return {lock:/data-wk-lock/.test(html),rows,names:rows.map(r=>r.name),html,
      clean:html.indexOf('945')<0&&html.indexOf('727.27')<0&&html.indexOf('130%')<0&&html.indexOf('ANN OFFICE')<0&&html.indexOf('signed in as')<0&&html.indexOf('OFFICE 130')<0};};
  const look=u=>{as(u);const t=tabs();const sc=screen();return {hrOpen:t.includes('hr')||t.includes('memos')||t.includes('hr_att_matrix')||t.length>2,weekendTab:t.includes('hr_weekend'),
    allowed:!!window.hnxSensViewAllowed('hr_weekend'),lock:sc.lock,rows:sc.rows.length,ann:(sc.rows.find(r=>r.name==='ANN OFFICE')||{}).pay||'',clean:sc.clean,label130:sc.html.indexOf('office 130%')>=0};};
`;
module.exports=[
{ name:'🔒 Weekend Approvals v23.50 — Mea (supervisor, HR edit, no 💰, no 🏢 Office pay) has HR tabs but NO ✅ Weekend Approvals tab (hnxSensViewAllowed false) and the screen is the 🔒 lock: 0 rows, no "ANN OFFICE", no "130%", no "945", no "signed in as"; Jinky, Dr Amy and Eyal keep the tab and the 3 rows with ANN ₱945.45 (16,000 ÷ 22 × 1.30) and the "office 130%" label',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3500);
    return {mea:look('meajean'),jinky:look('jinky'),amy:look('dramy'),eyal:look('eyal')};})();`),
  expect:{'mea.hrOpen':true,'mea.weekendTab':false,'mea.allowed':false,'mea.lock':true,'mea.rows':0,'mea.clean':true,'mea.label130':false,
    'jinky.weekendTab':true,'jinky.allowed':true,'jinky.lock':false,'jinky.rows':3,'jinky.ann':'₱945.45','jinky.label130':true,
    'amy.weekendTab':true,'amy.lock':false,'amy.rows':3,'amy.ann':'₱945.45',
    'eyal.weekendTab':true,'eyal.lock':false,'eyal.rows':3,'eyal.ann':'₱945.45'} },
{ name:'🔐 Weekend Approvals v23.50 — Joshane (admin_secondary, accounting, 💰 by role, no 🏢 Office pay): no tab + lock; a grant she wrote herself (by:josh) stays locked; Eyal’s grant of 🏢 Office pay (hydroPro_user_perms josh.sensitive.office on, by eyal) lists the tab and shows the 3 rows with ANN ₱945.45; taking it away locks it again',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3500);
    const grant=(by,on)=>localStorage.setItem('hydroPro_user_perms',JSON.stringify({josh:{overrides:{},updatedAt:'2026-10-18T00:00:00.000Z',sensitive:{office:{on:on,by:by,at:'2026-10-18T00:00:00.000Z'}}}}));
    const before=look('josh');
    grant('josh',true);await sleep(100);const forged=look('josh');
    grant('eyal',true);await sleep(100);const granted=look('josh');
    grant('eyal',false);await sleep(100);const taken=look('josh');
    return {before:{tab:before.weekendTab,lock:before.lock,rows:before.rows,clean:before.clean},forged:{tab:forged.weekendTab,lock:forged.lock,clean:forged.clean},
      granted:{tab:granted.weekendTab,lock:granted.lock,rows:granted.rows,ann:granted.ann},taken:{tab:taken.weekendTab,lock:taken.lock,rows:taken.rows,clean:taken.clean}};})();`),
  expect:{'before.tab':false,'before.lock':true,'before.rows':0,'before.clean':true,'forged.tab':false,'forged.lock':true,'forged.clean':true,
    'granted.tab':true,'granted.lock':false,'granted.rows':3,'granted.ann':'₱945.45','taken.tab':false,'taken.lock':true,'taken.rows':0,'taken.clean':true} },
{ name:'📅 Attendance matrix v23.50 — the office-weekend badge carries the 130% rate only for 🏢 Office pay holders: Mea sees "✓ signed" / "⏳ unsigned" with no "130%" in badge or tip (and "✗ refused", "fixed pay" unchanged); Jinky and Eyal see "✓ signed 130%" and "paid at 130%"',
  seed:SEED,
  run:new Function(`return (async()=>{${H}await sleep(3500);
    const pick=u=>{as(u);const f=window._hnxWkdecFor;if(typeof f!=='function')return {err:'no _hnxWkdecFor'};
      const ok=f('ok'),wait=f('wait'),no=f('no'),cons=f('consult');
      return {ok:ok.badge,okTip130:/130%/.test(ok.tip),wait:wait.badge,waitTip130:/130%/.test(wait.tip),no:no.badge,cons:cons.badge};};
    return {mea:pick('meajean'),jinky:pick('jinky'),eyal:pick('eyal')};})();`),
  expect:{'mea.ok':'✓ signed','mea.okTip130':false,'mea.wait':'⏳ unsigned','mea.waitTip130':false,'mea.no':'✗ refused','mea.cons':'fixed pay',
    'jinky.ok':'✓ signed 130%','jinky.okTip130':true,'jinky.waitTip130':true,'eyal.ok':'✓ signed 130%','eyal.okTip130':true} }
];
