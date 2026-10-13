/* v23.06 (Eyal, 13 Oct 2026): "Memos of the day should be Delia's [daily] option or to print out with all details of the day in any time" —
   📅 Memos of the day: for any day (or a range) every memo DATED that day with all its details; 🖨 print / PDF and 📊 Excel at any time.
   Fixture: GH3 = TORZAR (team leader ₱150), CRUZ, REYES (absent 13 Oct); GH5 = GARCIA, SANTOS; DELA CRUZ, MARK supervises GH3 + GH5 (₱100);
   memo rates 150 / 100 / 100; everyone present 8–14 Oct except REYES on 13 Oct; payroll week 8–14 Oct.
   Eight memos dated 13 Oct (+ one late record, + one decoy on 12 Oct): approved through ① Jinky → ② Dr Amy / Eyal, waiting at ① or ②,
   returned, rejected, an old-rule applied memo, an HR memo typed −₱500 on GOOD, and a 🚧 warning. */
const HELP=`
const D='2026-10-13',Z=h=>'2026-10-13T'+h+':00.000Z';
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
function FX(o){o=o||{};
  localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:100,supervisor:100,explicit:true}));
  localStorage.setItem('hydroPro_users',JSON.stringify([['tester','Tester','admin'],['eyal','Eyal Ben Ari','admin'],['dramy','Dr Amy Patdu','admin_secondary'],['jinky','Jinky Pagtama','accounting'],['mea','Meajean Magracia','supervisor'],['mark','Mark Dela Cruz','supervisor'],['joe','Joe Operator','operator']].map(([u,f,r])=>({username:u,fullname:f,passwordHash:'x',role:r,active:true}))));
  const E=[labour('W1','TORZAR, EDERLYN',{ghAssigned:['GH3'],tier:'Team Leader'}),labour('W2','CRUZ, JUAN',{ghAssigned:['GH3']}),labour('W3','REYES, ANA',{ghAssigned:['GH3']}),
    labour('W4','GARCIA, PEDRO',{ghAssigned:['GH5']}),labour('W5','SANTOS, MARIA',{ghAssigned:['GH5']}),
    labour('S1','DELA CRUZ, MARK',{ghAssigned:[],tier:'supervisor',supervisorGHs:['GH3','GH5'],username:'mark'})];
  setE(E);loadEmployees();
  const a={};['2026-10-08','2026-10-09','2026-10-10','2026-10-12','2026-10-13','2026-10-14'].forEach(d=>{a[d]={};E.forEach(e=>{a[d][e.id]=rec('present','07:00','17:00');});});
  a[D].W3=rec('absent','','');setA(a);
  const J=h=>({by:'jinky',name:'Jinky Pagtama',at:Z(h),round:1}),A=h=>({by:'dramy',name:'Dr Amy Patdu',at:Z(h),round:1,side:'amy'}),Y=h=>({by:'eyal',name:'Eyal Ben Ari',at:Z(h),round:1,side:'eyal'});
  const ch=(ac,fi,re)=>({v:2294,round:1,since:Z('00:12'),submittedBy:'mea',submittedAt:Z('00:12'),acct:ac||null,final:fi||null,returned:re||null,notified:[]});
  const fin=f=>({name:f.name,username:f.by,at:f.at});
  const base=o=>Object.assign({reasons:[],customReason:'',notes:'',photos:[],pdfs:[],videoLinks:[],impact:[],totalAmount:0,signatures:{supervisor:null,hrManager:null},createdBy:'mea',updatedAt:Z('00:12'),date:D},o);
  const M=[
   base({id:'D1',createdAt:Z('00:10'),category:'production',type:'good',gh:'GH3',title:'GH3 — harvest on time',reasons:['⭐ Exceptional produce quality'],customReason:'Team stayed late',notes:'Trays cleaned before 9',
     photos:[{data:PNG,name:'trays.png',mime:'image/png'}],pdfs:[{data:'data:application/pdf;base64,JVBERi0xLjQK',name:'report.pdf'}],videoLinks:[{url:'https://example.com/v1',label:'walkthrough'},{url:'javascript:alert(1)',label:'bad link'}],
     status:'signed',chain:ch(J('03:05'),A('06:40')),approvals:{final:fin(A('06:40'))},
     approvalLog:[{at:Z('00:12'),round:1,step:'submit',decision:'submitted',by:'mea',name:'Meajean Magracia',role:'creator'},{at:Z('03:05'),round:1,step:'acct',decision:'approved',by:'jinky',name:'Jinky Pagtama',role:'accountant',money:{total:350,lines:3}},{at:Z('06:40'),round:1,step:'final',decision:'approved',by:'dramy',name:'Dr Amy Patdu',role:'final approver',money:{total:350,lines:3}}]}),
   base({id:'D2',createdAt:Z('00:20'),category:'production',type:'bad',gh:'GH3',title:'GH3 — trays not cleaned',reasons:['📉 Below target'],whatNotDone:'Trays left dirty in row 4',outcome:'Seedlings lost',
     impact:[{empId:'W1',empName:'TORZAR, EDERLYN',role:'Team Leader',amount:-150},{empId:'W2',empName:'CRUZ, JUAN',role:'Worker',amount:-100},{empId:'W3',empName:'REYES, ANA',role:'Worker',amount:-100},{empId:'S1',empName:'DELA CRUZ, MARK',role:'Supervisor',amount:-100}],totalAmount:-450,
     status:'signed',chain:ch(J('03:10'),Y('07:15')),approvals:{final:fin(Y('07:15'))}}),
   base({id:'D3',createdAt:Z('01:00'),category:'production',type:'bad',gh:'GH5',title:'GH5 — irrigation left open',status:'pending',chain:ch(J('04:00'),null)}),
   base({id:'D4',createdAt:Z('01:30'),category:'hr',type:'good',empId:'W2',title:'Damaged crates',totalAmount:-500,impact:[{empId:'W2',empName:'CRUZ, JUAN',role:'HR Memo',amount:-500}],status:'signed',chain:ch(J('03:20'),A('06:50')),approvals:{final:fin(A('06:50'))}}),
   base({id:'D5',createdAt:Z('02:00'),category:'hr',type:'bad',noMoney:true,empId:'W4',title:'🚧 Warning — late back from break',status:'returned',chain:ch(null,null,{by:'jinky',name:'Jinky Pagtama',at:Z('05:20'),step:'acct',reason:'add the photo',round:1})}),
   base({id:'D6',createdAt:Z('00:30'),category:'production',type:'good',gh:'GH5',title:'GH5 — clean packing area',status:'applied',signatures:{supervisor:{name:'Mark Dela Cruz',username:'mark',signedAt:Z('01:00')},hrManager:{name:'Meajean Magracia',username:'mea',signedAt:Z('01:30')}},appliedBy:'tester',appliedAt:Z('02:00')}),
   base({id:'D7',createdAt:Z('02:30'),category:'production',type:'bad',gh:'GH3',title:'GH3 <b>x</b> wrong',status:'rejected',rejection:{by:'dramy',name:'Dr Amy Patdu',at:Z('07:00'),note:'Wrong GH'},chain:ch(J('03:30'),null)}),
   base({id:'D8',createdAt:Z('03:00'),category:'production',type:'good',gh:'GH5',title:'GH5 — early start',status:'pending',chain:ch(null,null)}),
   base({id:'LATE_2026-10-13_W5',source:'late_approval',category:'hr',noMoney:true,empId:'W5',title:'⏰ Late 25 min',status:'signed',createdAt:Z('08:00')}),
   base({id:'X0',date:'2026-10-12',createdAt:'2026-10-12T02:00:00.000Z',category:'production',type:'bad',gh:'GH3',title:'decoy — another day',status:'pending',chain:ch(null,null)})];
  if(o.v1)M.push(base({id:'V1',createdAt:Z('02:10'),category:'hr',type:'bad',empId:'W5',title:'virtual chain',totalAmount:-200,status:'pending',signatures:{supervisor:null,hrManager:{name:'Jinky Pagtama',username:'jinky',signedAt:Z('02:00')}}}));
  localStorage.setItem('hydroPro_memos',JSON.stringify(M));loadMemos();window.confirm=()=>true;window.alert=()=>{};return {E,a,M};}
function RUNS(){localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-10-08_2026-10-14',type:'weekly',periodStart:'2026-10-08',periodEnd:'2026-10-14',payday:'2026-10-17',status:'approved',
  lines:[{empId:'W1',memoList:[{id:'D1',kind:'good',amt:150},{id:'D2',kind:'bad',amt:150}]},{empId:'W2',memoList:[{id:'D1',kind:'good',amt:100},{id:'D2',kind:'bad',amt:100},{id:'D4',kind:'bad',amt:500}]},{empId:'S1',memoList:[{id:'D1',kind:'good',amt:100},{id:'D2',kind:'bad',amt:100}]}]}]));}
function FU(){localStorage.setItem('hydroPro_memo_followups_v1',JSON.stringify([{id:'fu1',memoId:'D2',attempt:1,gh:'GH3',title:'GH3 — trays not cleaned',memoDate:D,dueDate:'2026-10-14',status:'fixed',checkedBy:'mark',checkedAt:Date.parse('2026-10-14T01:00:00Z'),note:''}]));}
function AS(un){const U=JSON.parse(localStorage.getItem('hydroPro_users'));const x=U.find(y=>y.username===un);if(!window.__tGCU)window.__tGCU=window.getCurrentUser;sessionStorage.setItem('hydroPro_session',JSON.stringify({username:un,loginAt:Date.now()}));window.getCurrentUser=()=>x;return x;}
function ASTESTER(){sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));if(window.__tGCU)window.getCurrentUser=window.__tGCU;}
async function XL(go){let blob=null,file='';const oc=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{blob=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){file=this.download;};
  try{await go();await sleep(800);}finally{URL.createObjectURL=oc;HTMLAnchorElement.prototype.click=ck;}
  const wb=new ExcelJS.Workbook();await wb.xlsx.load(await blob.arrayBuffer());return {wb,file};}
function ROWS(ws){let h=0;for(let r=1;r<=10;r++){if(ws.getRow(r).values.indexOf('Memo no.')>=0){h=r;break;}}const H=ws.getRow(h).values;const out=[];
  for(let r=h+1;r<=ws.rowCount;r++){const v=ws.getRow(r).values;if(!v||!v.length)continue;const o={};H.forEach((k,i)=>{if(k)o[k]=v[i];});if(o['Memo no.'])out.push(o);}return {H,out};}
function POP(){window.__pw=window.__pw||[];return function(){var b={html:'',printed:0};window.__pw.push(b);return {closed:false,focus(){},close(){},print(){b.printed++;},document:{open(){b.html='';},write(h){b.html+=h;},close(){}}};};}
function PESO(wb){return wb.worksheets.some(ws=>{let f=false;ws.eachRow({includeEmpty:false},r=>{(r.values||[]).forEach(v=>{if(String(v==null?'':(typeof v==='object'?JSON.stringify(v):v)).indexOf('₱')>=0)f=true;});});return f;});}
const r2=x=>Math.round((+x||0)*100)/100;
`;
const R=fn=>eval('(async()=>{'+HELP+'\nreturn ('+fn.toString()+')();})');

module.exports=[
{ name:'13 Oct 2026: 8 memos (late record hidden, 12 Oct decoy out) → 🌟 good 3 +₱950 · ⚠️ bad 3 −₱650 (rejected GH3 −₱350 not counted) · 👤 HR 1 −₱500 (typed −₱500 on GOOD = minus) · 🚧 warning 1 ₱0 → plus +₱950, minus −₱1,150, net −₱200; approved +₱650/−₱850, waiting 2 (① 1 · ② 1) +₱300/−₱300; GH3 +₱350/−₱350, GH5 +₱600/−₱300, HR −₱500; Eder (TORZAR) +₱150 / −₱150 net ₱0, CRUZ +₱100 / −₱600 net −₱500, DELA CRUZ +₱300 / −₱200 net +₱100; approved part per person = payroll 8–14 Oct (W1 150/150, W2 100/600, W4 100/0, W5 100/0, S1 200/100)',
  run:R(async()=>{
    const {E}=FX();
    const M=hnxMemoDay.model(D,D,{}),S=M.sum,B=S.byKind;
    const pay={};E.forEach(e=>{const l=calcEmployeePayroll(e,'2026-10-08','2026-10-14','weekly');pay[e.id]=[r2(l.memoAdd),r2(l.memoDed)];});
    const payMatch=S.perPerson.length>0&&S.perPerson.every(p=>{const x=pay[p.empId];return !!x&&Math.abs((p.plus-p.waitPlus)-x[0])<0.005&&Math.abs(-(p.minus-p.waitMinus)-x[1])<0.005;});
    return {n:M.memos.length,ids:M.memos.map(m=>m.id).join(','),late:M.late.n,
      by:{good:[B.good.n,B.good.plus,B.good.minus],bad:[B.bad.n,B.bad.plus,B.bad.minus],hr:[B.hr.n,B.hr.plus,B.hr.minus],warning:[B.warning.n,B.warning.plus,B.warning.minus]},
      tot:[S.plus,S.minus,S.net],paid:[S.paid.plus,S.paid.minus,S.paid.net],wait:[S.waiting.n,S.waiting.acct,S.waiting.final,S.waiting.plus,S.waiting.minus],
      nc:[S.notCounted.returned,S.notCounted.rejected,S.notCounted.draft],
      gh:S.perGH.map(g=>[g.key,g.n,g.plus,g.minus,g.net,g.waitingN].join(':')).join('|'),
      person:S.perPerson.map(p=>[p.empId,p.n,p.plus,p.minus,p.net].join(':')).join('|'),pay,payMatch};
  }),
  expect:{n:8,ids:'D1,D2,D6,D3,D4,D5,D7,D8',late:1,by:{good:[3,950,0],bad:[3,0,-650],hr:[1,0,-500],warning:[1,0,0]},tot:[950,-1150,-200],paid:[650,-850,-200],
    wait:[2,1,1,300,-300],nc:[1,1,0],gh:'GH3:3:350:-350:0:0|GH5:3:600:-300:300:2|HR:2:0:-500:-500:0',
    person:'W2:3:100:-600:-500|S1:5:300:-200:100|W4:3:200:-100:100|W5:3:200:-100:100|W1:2:150:-150:0',
    pay:{W1:[150,150],W2:[100,600],W3:[0,0],W4:[100,0],W5:[100,0],S1:[200,100]},payMatch:true}},

{ name:'Every memo in full (13 Oct): D1 "① Jinky ✓ 11:05 · ② Dr Amy ✓ 14:40", written 08:10 by Meajean Magracia, log 3 rows, 1 photo + report.pdf + 1 video (javascript: link dropped); D2 "① Jinky ✓ 11:10 · ② Eyal ✓ 15:15", frozen −₱450 (4 people) vs payroll today −₱350 (3 people), follow-up ✔ fixed; D3 "① Jinky ✓ 12:00 · ⏳ waiting ② Dr Amy / Eyal"; D8 "⏳ waiting ① Jinky"; D5 "↩ Returned by Jinky 13:20 at ①: add the photo"; D7 "✖ Rejected by Dr Amy 15:00: Wrong GH"; D6 "Before the chain (old rule): Supervisor ✓ Mark Dela Cruz 09:00 · HR Manager ✓ Meajean Magracia 09:30 · applied by @tester 10:00"; payroll D1/D2/D4 paid in weekly run 2026-10-08 → 2026-10-14, D6 not in a run yet; titles escaped',
  run:R(async()=>{
    FX();RUNS();FU();
    const M=hnxMemoDay.model(D,D,{}),by={};M.memos.forEach(m=>{by[m.id]=m;});
    const h=hnxMemoDay.html(M);
    const steps={};['D1','D2','D3','D4','D5','D6','D7','D8'].forEach(i=>{steps[i]=by[i].steps;});
    const a=by.D1.attach;
    return {steps,d1:[by.D1.time,by.D1.createdByName,by.D1.log.length,a.photos.length,a.pdfs[0]&&a.pdfs[0].name,a.videos.length,a.dropped],
      d2:[by.D2.frozen&&by.D2.frozen.total,by.D2.frozen&&by.D2.frozen.n,by.D2.total,by.D2.people.length,by.D2.frozenDiff],fu:by.D2.followUp,
      pay:{D1:by.D1.payroll,D2:by.D2.payroll,D4:by.D4.payroll,D6:by.D6.payroll,D3:by.D3.payroll,D8:by.D8.payroll,D5:by.D5.payroll,D7:by.D7.payroll},
      esc:h.includes('GH3 &lt;b&gt;x&lt;/b&gt; wrong')&&!h.includes('<b>x</b>'),js:/javascript:/i.test(h),logRow:h.includes('Jinky Pagtama (accountant) — approved'),
      frozenTxt:h.includes('Frozen on the memo when it was saved: −₱450 (4 people). Payroll counts today: −₱350 (3 people)'),
      video:h.includes('href="https://example.com/v1" target="_blank" rel="noopener noreferrer"'),dropTxt:h.includes('(1 link not shown — not a web address)'),pdfTxt:h.includes('📄 report.pdf (PDF, 1 KB)')};
  }),
  expect:{steps:{D1:'① Jinky ✓ 11:05 · ② Dr Amy ✓ 14:40',D2:'① Jinky ✓ 11:10 · ② Eyal ✓ 15:15',D3:'① Jinky ✓ 12:00 · ⏳ waiting ② Dr Amy / Eyal',D4:'① Jinky ✓ 11:20 · ② Dr Amy ✓ 14:50',
      D5:'↩ Returned by Jinky 13:20 at ①: add the photo',D6:'Before the chain (old rule): Supervisor ✓ Mark Dela Cruz 09:00 · HR Manager ✓ Meajean Magracia 09:30 · applied by @tester 10:00',
      D7:'✖ Rejected by Dr Amy 15:00: Wrong GH',D8:'⏳ waiting ① Jinky'},
    d1:['08:10','Meajean Magracia',3,1,'report.pdf',1,1],d2:[-450,4,-350,3,true],fu:'✔ Fixed — checked by mark 14 Oct 09:00',
    pay:{D1:'✅ Paid — weekly run 2026-10-08 → 2026-10-14 (approved, locked)',D2:'✅ Paid — weekly run 2026-10-08 → 2026-10-14 (approved, locked)',D4:'✅ Paid — weekly run 2026-10-08 → 2026-10-14 (approved, locked)',
      D6:'✅ Approved — not in a payroll run yet (open its week in Payroll, or ↻ Recalculate)',D3:'⏳ Not paid yet — waits for ② Dr Amy / Eyal',D8:'⏳ Not paid yet — waits for ① Jinky',
      D5:'🚧 Warning — moves no money',D7:'✖ Not counted (rejected)'},
    esc:true,js:false,logRow:true,frozenTxt:true,video:true,dropTxt:true,pdfTxt:true}},

{ name:'Filters and range (13 Oct): GH5 → 3 memos +₱600/−₱300 net +₱300; 👤 HR → D4 −₱500; 🚧 warning → D5 ₱0; ⏳ waiting → D3 + D8 net ₱0; department Construction → D4 + D5; ⏰ late shown → 9 memos, net still −₱200; range 12–13 Oct → 9 memos (X0 GH3 −₱450 ⏳①) minus −₱1,600 net −₱650 waiting 3; ‹ from 13 Oct → 12 Oct = 1 memo',
  run:R(async()=>{
    FX();
    const md=(o,f,t)=>hnxMemoDay.model(f||D,t||D,o||{});
    const g5=md({gh:'GH5'}),hr=md({type:'hr'}),wa=md({type:'warning'}),wt=md({status:'waiting'}),dp=md({dept:'Construction'}),lt=md({late:true}),rg=md({},'2026-10-12',D);
    hnxMemoDay.set('from',D);hnxMemoDay.set('to',D);hnxMemoDay.step(-1);
    const st=hnxMemoDay.state();
    return {gh5:[g5.memos.length,g5.sum.plus,g5.sum.minus,g5.sum.net],hr:hr.memos.map(m=>m.id).join(','),hrNet:hr.sum.net,warn:wa.memos.map(m=>m.id).join(','),
      wait:wt.memos.map(m=>m.id).join(','),waitNet:wt.sum.net,dept:dp.memos.map(m=>m.id).join(','),late:[lt.memos.length,lt.late.n,lt.late.shown,lt.sum.net],
      range:[rg.memos.length,rg.memos[0].id,rg.sum.plus,rg.sum.minus,rg.sum.net,rg.sum.waiting.n],step:[st.from,st.to,hnxMemoDay.model(st.from,st.to,{}).memos.length]};
  }),
  expect:{gh5:[3,600,-300,300],hr:'D4',hrNet:-500,warn:'D5',wait:'D3,D8',waitNet:0,dept:'D4,D5',late:[9,1,true,-200],range:[9,'X0',950,-1600,-650,3],step:['2026-10-12','2026-10-12',1]}},

{ name:'Print 13 Oct (A4 portrait): company header + "MEMOS OF THE DAY — Tue 13 Oct 2026", +₱950 / −₱1,150 / Net −₱200, all 8 memos D1…D8 (no decoy, no late record), D1 "① Jinky ✓ 11:05 · ② Dr Amy ✓ 14:40", photo thumbnail embedded, report.pdf named not embedded, no javascript:, <b> escaped, signature lines Prepared by HR · Checked by Jinky (accountant) · Approved by Dr Amy / Eyal, white page, memo cards break-inside:avoid, print dialog opened once',
  seed:()=>{window.__pw=[];window.open=function(){var b={html:'',printed:0};window.__pw.push(b);return {closed:false,focus(){},close(){},print(){b.printed++;},document:{open(){b.html='';},write(h){b.html+=h;},close(){}}};};},
  run:R(async()=>{
    FX();window.__pw.length=0;
    const r=await hnxMemoDay.print({from:D,to:D});await sleep(1500);
    const b=window.__pw[0]||{},h=b.html||'';
    return {pops:window.__pw.length,ok:!!r.ok,photos:r.photos,brand:/class="hnx-brand"/.test(h),title:h.includes('MEMOS OF THE DAY — Tue 13 Oct 2026'),
      totals:h.includes('+₱950')&&h.includes('−₱1,150')&&h.includes('−₱200'),ids:['D1','D2','D3','D4','D5','D6','D7','D8'].every(i=>h.includes('class="mno">'+i+'<')),
      decoy:h.includes('decoy'),late:h.includes('LATE_2026'),steps:h.includes('① Jinky ✓ 11:05 · ② Dr Amy ✓ 14:40'),thumb:/<img class="thumb" src="data:image\//.test(h),
      pdfName:h.includes('report.pdf'),pdfData:h.includes('data:application/pdf'),js:/javascript:/i.test(h),esc:h.includes('GH3 &lt;b&gt;x&lt;/b&gt; wrong')&&!h.includes('<b>x</b>'),
      page:/@page\{size:A4 portrait/.test(h),avoid:/\.memo\{[^}]*break-inside:avoid/.test(h),sigs:['Prepared by — HR','Checked by — Jinky (accountant)','Approved by — Dr Amy / Eyal'].every(x=>h.includes(x)),
      white:/body\{[^}]*background:#fff/.test(h),printed:b.printed};
  }),
  expect:{pops:1,ok:true,photos:1,brand:true,title:true,totals:true,ids:true,decoy:false,late:false,steps:true,thumb:true,pdfName:true,pdfData:false,js:false,esc:true,page:true,avoid:true,sigs:true,white:true,printed:1}},

{ name:'Excel 13 Oct: Memos_2026-10-13.xlsx — sheets Memo lines / Summary / Approval log, 20 memo × person rows (D1 3, D2 3, D6 3, D3 3, D4 1, D5 1, D7 3, D8 3), 16 counted rows sum −₱200, 4 not counted (D5 warning, D7 rejected), CRUZ, JUAN rows +100 / −100 / −500 / −100, approval log 3 rows, landscape',
  run:R(async()=>{
    FX();
    const {wb,file}=await XL(()=>hnxMemoDay.excel({from:D,to:D}));
    const ws=wb.getWorksheet('Memo lines'),T=ROWS(ws),rows=T.out;
    const yes=rows.filter(r=>r['Counted']==='yes'),no=rows.filter(r=>String(r['Counted']).indexOf('no')===0);
    return {file,sheets:wb.worksheets.map(w=>w.name).join(','),rows:rows.length,yes:yes.length,no:no.length,sumYes:r2(yes.reduce((t,r)=>t+(+r['Amount (₱)']||0),0)),
      cruz:rows.filter(r=>r['Employee']==='CRUZ, JUAN').map(r=>r['Amount (₱)']).join(','),log:ROWS(wb.getWorksheet('Approval log')).out.length,
      orient:ws.pageSetup&&ws.pageSetup.orientation,hasAmount:T.H.indexOf('Amount (₱)')>=0,noD5:rows.filter(r=>r['Memo no.']==='D5').map(r=>r['Counted']).join(',')};
  }),
  expect:{file:'Memos_2026-10-13.xlsx',sheets:'Memo lines,Summary,Approval log',rows:20,yes:16,no:4,sumYes:-200,cruz:'100,-100,-500,-100',log:3,orient:'landscape',hasAmount:true,noD5:'no — warning'}},

{ name:'Supervisor without HR (mark = DELA CRUZ, MARK, GH3 + GH5): 6 memos D1 D2 D6 D3 D7 D8 (HR D4 and warning D5 hidden), good 3 · bad 3 · waiting 2, NO peso anywhere — model amounts null, screen overlay, print and Excel (18 rows, no Amount column, no ₱); Daily Summary card "Memos of Tue 13 Oct 2026 in GH3, GH5: 6 memo(s)" without ₱ opens the overlay; operator joe (not linked) → 🔒, no card',
  run:R(async()=>{
    FX();AS('mark');
    const M=hnxMemoDay.model(D,D,{}),S=M.sum;
    const nullMoney=M.memos.every(m=>m.total===null&&m.people.every(p=>p.amount===null)&&(!m.frozen||m.frozen.total===null)&&m.log.every(l=>l.money===null))
      &&S.plus===null&&S.minus===null&&S.net===null&&S.paid.net===null&&S.waiting.plus===null&&S.waiting.net===null&&['good','bad','hr','warning'].every(k=>S.byKind[k].plus===null)
      &&S.perGH.every(g=>g.plus===null&&g.net===null)&&S.perPerson.every(p=>p.plus===null&&p.net===null&&p.waitPlus===null);
    const w1=S.perPerson.find(p=>p.empId==='W1')||{};
    hnxMemoDay.open({from:D,to:D});await sleep(500);
    const ovEl=document.getElementById('hnxMemoDayOv'),ovT=ovEl?ovEl.innerText:'';
    const po=window.open;window.__pw=[];window.open=POP();let ph='';
    try{await hnxMemoDay.print({from:D,to:D});await sleep(300);ph=(window.__pw[0]||{}).html||'';}finally{window.open=po;}
    const {wb}=await XL(()=>hnxMemoDay.excel({from:D,to:D}));const T=ROWS(wb.getWorksheet('Memo lines'));
    _briefingDate=D;switchView('daily_briefing');await sleep(2500);
    const c=document.getElementById('hnxMemoDayBrief'),ct=c?c.innerText:'';
    if(c){const bt=c.querySelector('button');if(bt)bt.click();}await sleep(400);
    const ovOpen=!!document.getElementById('hnxMemoDayOv')&&document.getElementById('hnxMemoDayOv').classList.contains('open');
    try{hnxMemoDay.close();}catch(e){}
    AS('joe');const joeDenied=!!hnxMemoDay.model(D,D,{}).denied;const joeOpen=hnxMemoDay.open({from:D,to:D});
    try{renderDailyBriefing();}catch(e){}await sleep(300);
    const joeCard=!!document.getElementById('hnxMemoDayBrief');
    ASTESTER();
    return {money:M.scope.money,ghs:(M.scope.ghs||[]).join(','),n:M.memos.length,ids:M.memos.map(m=>m.id).join(','),
      by:[S.byKind.good.n,S.byKind.bad.n,S.byKind.hr.n,S.byKind.warning.n],wait:S.waiting.n,nullMoney,w1:[w1.n,w1.plusN,w1.minusN].join(':'),
      ovSup:ovT.includes('Your greenhouses: GH3, GH5'),ovPeso:ovT.indexOf('₱')>=0,printOk:ph.includes('MEMOS OF THE DAY'),printPeso:ph.indexOf('₱')>=0,
      xlRows:T.out.length,xlAmount:T.H.indexOf('Amount (₱)')>=0,xlPeso:PESO(wb),
      card:ct.includes('Memos of Tue 13 Oct 2026 in GH3, GH5: 6 memo(s)'),cardPeso:!c||ct.indexOf('₱')>=0,ov:ovOpen,joeDenied,joeOpen,joeCard};
  }),
  expect:{money:false,ghs:'GH3,GH5',n:6,ids:'D1,D2,D6,D3,D7,D8',by:[3,3,0,0],wait:2,nullMoney:true,w1:'2:1:1',ovSup:true,ovPeso:false,printOk:true,printPeso:false,
    xlRows:18,xlAmount:false,xlPeso:false,card:true,cardPeso:false,ov:true,joeDenied:true,joeOpen:false,joeCard:false}},

{ name:'Read-only + entry points: Memos toolbar shows 📅 Memos of the day before 👤 + HR Memo → opens HR view memo_day; Daily Summary of 13 Oct shows "📋 Memos of Tue 13 Oct 2026: 8 memo(s) … ⏳ 2 waiting approval" with no ₱; model / paint / 6 filter changes write NOTHING (0 setItem / removeItem) and print + Excel leave memos, payroll runs, attendance and follow-ups byte-identical',
  run:R(async()=>{
    FX();RUNS();await sleep(6000);
    switchView('memos');await sleep(1500);
    const btn=document.getElementById('hnxMemoDayBtn'),nx=btn&&btn.nextElementSibling;
    const btnBeforeHr=!!nx&&nx.textContent.indexOf('+ HR Memo')>=0;
    await sleep(3000);const nx2=btn&&btn.isConnected&&btn.nextElementSibling;const stillBefore=!!nx2&&nx2.textContent.indexOf('+ HR Memo')>=0;
    if(btn)btn.click();await sleep(800);
    const vw=document.getElementById('view-memo_day');const view=!!vw&&vw.classList.contains('active')&&vw.innerText.indexOf('Memos of the day')>=0;
    _briefingDate=D;switchView('daily_briefing');await sleep(2500);
    const c=document.getElementById('hnxMemoDayBrief'),ct=c?c.innerText:'';
    const card=ct.indexOf('Memos of Tue 13 Oct 2026: 8 memo(s)')>=0&&ct.indexOf('⏳ 2 waiting approval')>=0;
    const KEYS=['hydroPro_memos','hydroPro_payroll_runs','hydroPro_attendance','hydroPro_memo_followups_v1'];
    const snap=KEYS.map(k=>localStorage.getItem(k));
    const writes=[],SP=Storage.prototype,os=SP.setItem,or=SP.removeItem;
    SP.setItem=function(k){if(this===localStorage)writes.push('set:'+k);return os.apply(this,arguments);};
    SP.removeItem=function(k){if(this===localStorage)writes.push('rm:'+k);return or.apply(this,arguments);};
    try{
      const M=hnxMemoDay.model(D,D,{});hnxMemoDay.html(M);hnxMemoDay.paint(document.getElementById('hnxMemoDayViewBody'));
      hnxMemoDay.set('gh','GH3');hnxMemoDay.set('type','bad');hnxMemoDay.set('status','waiting');hnxMemoDay.set('late',true);hnxMemoDay.set('from','2026-10-12');hnxMemoDay.set('to',D);
    }finally{SP.setItem=os;SP.removeItem=or;}
    const po=window.open;window.__pw=[];window.open=POP();
    try{await hnxMemoDay.print({from:D,to:D});}finally{window.open=po;}
    await XL(()=>hnxMemoDay.excel({from:D,to:D}));await sleep(500);
    const same=KEYS.every((k,i)=>localStorage.getItem(k)===snap[i]);
    return {btn:!!btn,btnBeforeHr,stillBefore,view,card,cardPeso:!c||ct.indexOf('₱')>=0,writes,same};
  }),
  expect:{btn:true,btnBeforeHr:true,stillBefore:true,view:true,card:true,cardPeso:false,writes:[],same:true}},

{ name:'Phone 390 px: Memos of the day for HR (view) and for a supervisor (overlay) has no sideways scroll, the toolbar wraps, 🖨 Print / PDF and 📊 Excel are on screen',
  viewport:{width:390,height:844},
  run:R(async()=>{
    FX();const before=document.documentElement.scrollWidth;
    function chk(host){const b=[...host.querySelectorAll('button')].filter(x=>/Print \/ PDF|📊 Excel/.test(x.textContent));
      return {fit:host.scrollWidth<=host.clientWidth+1,page:document.documentElement.scrollWidth<=Math.max(before,390)+1,
        btns:b.length===2&&b.every(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.left>=-1&&r.right<=391;}),sw:[host.scrollWidth,host.clientWidth,document.documentElement.scrollWidth]};}
    hnxMemoDay.open({from:D,to:D});await sleep(1200);
    const v=document.getElementById('view-memo_day'),a=chk(v),va=v.classList.contains('active');
    AS('mark');hnxMemoDay.open({from:D,to:D});await sleep(800);
    const ov=document.getElementById('hnxMemoDayOv'),b=chk(ov),oa=ov.classList.contains('open');
    try{hnxMemoDay.close();}catch(e){}ASTESTER();
    return {viewOk:va&&a.fit&&a.page,ovOk:oa&&b.fit&&b.page,btns:a.btns&&b.btns,dbg:{a:a.sw,b:b.sw,before}};
  }),
  expect:{viewOk:true,ovOk:true,btns:true}},

{ name:'Memo chain: an old pending memo Jinky signed as HR Manager (10:00) shows "① Jinky ✓ 10:00 (her HR Manager signature before v22.94) · ⏳ waiting ② Dr Amy / Eyal" and waits at ② (−₱200); labels come from the chain (✅ Approved / ✅ Applied / ⏳ ② Final / ⏳ ① Jinky / ↩ Returned / ✖ Rejected); waiting 3 (① 1 · ② 2) +₱300 / −₱500',
  requires:"typeof window.hnxMemoStage==='function'&&!!window.hnxMemoDay",
  run:R(async()=>{
    FX({v1:true});
    const M=hnxMemoDay.model(D,D,{}),v1=M.memos.find(m=>m.id==='V1')||{},W=M.sum.waiting;
    return {v1:v1.steps,v1Total:v1.total,labels:M.memos.map(m=>m.id+':'+m.stageLabel).join('|'),wait:[W.n,W.acct,W.final,W.plus,W.minus]};
  }),
  expect:{v1:'① Jinky ✓ 10:00 (her HR Manager signature before v22.94) · ⏳ waiting ② Dr Amy / Eyal',v1Total:-200,
    labels:'D1:✅ Approved|D2:✅ Approved|D6:✅ Applied|D3:⏳ ② Final|D4:✅ Approved|D5:↩ Returned|V1:⏳ ② Final|D7:✖ Rejected|D8:⏳ ① Jinky',wait:[3,1,2,300,-500]}}
];
