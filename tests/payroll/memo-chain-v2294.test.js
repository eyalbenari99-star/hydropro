/* v23.10 (Eyal, 13 Oct 2026): "all memos should be approved by Jinky the accountant then Dr Amy or me" — every memo (GH good / bad,
   HR bonus / deduction, 🚧 warning) goes ① Jinky (accountant) → ② Dr Amy or Eyal (FINAL, either one) before payroll pays it; and
   (Eyal, on TORZAR, EDERLYN's memo scorecard) "how come Eder not getting the minus just the plus? or she get always net only?" — the
   GH Analytics scorecard counts plus / minus exactly as payroll pays. Fixture: 4 GH3 workers (₱100 memo rate) present 8–14 Oct 2026,
   payroll week 8–14 Oct; Mea writes, Jinky checks, Dr Amy / Eyal approve. */
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
  const T='2026-10-11T03:00:00.000Z';
  const all=()=>JSON.parse(localStorage.getItem('hydroPro_memos')||'[]');
  const g=id=>all().find(m=>m&&m.id===id);
  const put=list=>{localStorage.setItem('hydroPro_memos',JSON.stringify(list));loadMemos();};
  const seedMemo=(o,by)=>{const ms=all();ms.push(Object.assign({reasons:['test'],signatures:{supervisor:null,hrManager:null},status:'draft',createdBy:by||'mea',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),impact:[],totalAmount:0},o));put(ms);return o.id;};
  const edit=(id,fn)=>{const ms=all();const m=ms.find(x=>x.id===id);fn(m);m.updatedAt=new Date().toISOString();put(ms);};
  const pay=e=>{const l=calcEmployeePayroll(e,'2026-10-08','2026-10-14','weekly');return [Math.round((l.memoDed||0)*100)/100,Math.round((l.memoAdd||0)*100)/100,(l.pending&&l.pending.memo)?[l.pending.memo.n,Math.round(l.pending.memo.amt*100)/100]:null];};
  const stageOf=id=>hnxMemoStage(g(id));
  const inbox=()=>JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
  const sum=a=>Math.round(a.reduce((s,x)=>s+x,0)*100)/100;
`;
const R=fn=>eval('(async()=>{'+HELP+'\nreturn ('+fn.toString()+')();})');
const REQ="typeof window.hnxMemoStage==='function'";

module.exports=[
{ name:'① → ②: GH3 BAD memo −₱100 × 4 present (12 Oct) submitted by Mea → payroll 8–14 Oct moves ₱0 (⏳ Memo 1 × ₱100 each); Mea\'s FINAL before Jinky refused (since v23.38 Dr Amy\'s or Eyal\'s early ② is the override — memo-override-v2338); Jinky cannot give the FINAL; Jinky ✔ ① → still ₱0; Dr Amy ✔ ② → memoDed ₱100 each = ₱400; a GH3 GOOD +₱100 × 4 finalised by EYAL → memoAdd ₱400 (either final approver is enough) (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'M1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad — trays not cleaned'},'mea');
    actAs('mea');const sub=!!hnxMemoSubmit('M1').ok;
    const stage0=stageOf('M1');const P0=E.map(pay);
    actAs('mea');const meaEarly=!!hnxMemoApproveDo('M1','final').ok; /* v23.38: Dr Amy / Eyal may now override at ① — see memo-override-v2338 */
    const stageA=stageOf('M1');
    actAs('jinky');const jinkyAcct=!!hnxMemoApproveDo('M1','acct').ok;
    const stageB=stageOf('M1');const dedB=E.map(e=>pay(e)[0]);
    const jinkyFinal=!!hnxMemoApproveDo('M1','final').ok;
    actAs('dramy');const amyFinal=!!hnxMemoApproveDo('M1','final').ok;
    actAsTester();
    const m=g('M1');const ded=E.map(e=>pay(e)[0]);
    seedMemo({id:'M2',category:'production',type:'good',gh:'GH3',date:'2026-10-13',title:'GH3 good — harvest on time'},'mea');
    actAs('mea');hnxMemoSubmit('M2');actAs('jinky');hnxMemoApproveDo('M2','acct');actAs('eyal');const eyalFinal=!!hnxMemoApproveDo('M2','final').ok;actAsTester();
    const add=E.map(e=>pay(e)[1]);
    return {sub,stage0,pend0:P0.map(p=>p[2]),ded0:P0.map(p=>p[0]),meaEarly,stageA,jinkyAcct,stageB,dedB,jinkyFinal,amyFinal,status:m.status,stage:hnxMemoStage(m),
      ded,dedSum:sum(ded),log:(m.approvalLog||[]).map(x=>x.step),logBy:(m.approvalLog||[]).map(x=>x.by),eyalFinal,addSum:sum(add),m2Side:(g('M2').chain.final||{}).side};}),
  expect:{sub:true,stage0:'acct',pend0:[[1,100],[1,100],[1,100],[1,100]],ded0:[0,0,0,0],meaEarly:false,stageA:'acct',jinkyAcct:true,stageB:'final',dedB:[0,0,0,0],
    jinkyFinal:false,amyFinal:true,status:'signed',stage:'approved',ded:[100,100,100,100],dedSum:400,log:['submit','acct','final'],logBy:['mea','jinky','dramy'],eyalFinal:true,addSum:400,m2Side:'eyal'} },

{ name:'Nobody approves their own memo: Jinky\'s HR −₱300 for REYES → her ① refused, Eyal covers ①, Eyal\'s ② refused (same person), the System Admin login\'s ② refused (Eyal\'s side), Dr Amy ② → memoDed ₱300; Eyal\'s GH3 −₱100 × 4 → Jinky ①, Eyal\'s ② refused, Dr Amy ② → ₱400; Dr Amy\'s +₱250 bonus for GARCIA → Jinky ①, Dr Amy\'s ② refused, Eyal ② → memoAdd ₱250; the −₱300 memo keeps the type it was written with (GOOD) and still deducts (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    const U=memoUsers();U.push({username:'admin',fullname:'System Admin',passwordHash:'x',role:'admin',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
    seedMemo({id:'J1',category:'hr',type:'good',empId:'W3',date:'2026-10-12',title:'Lost harvest crates',totalAmount:-300,impact:[{empId:'W3',empName:'REYES, ANA',role:'HR Memo',amount:-300}]},'jinky');
    actAs('jinky');hnxMemoSubmit('J1');
    const r1=!!hnxMemoApproveDo('J1','acct').ok;
    actAs('eyal');const cov=!!hnxMemoApproveDo('J1','acct').ok;
    const r2=!!hnxMemoApproveDo('J1','final').ok;
    actAs('admin');const r3=!!hnxMemoApproveDo('J1','final').ok;
    actAs('dramy');const f1=!!hnxMemoApproveDo('J1','final').ok;
    const covered=(g('J1').chain.acct||{}).covered;
    seedMemo({id:'E1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 — irrigation left open'},'eyal');
    actAs('eyal');hnxMemoSubmit('E1');actAs('jinky');const a2=!!hnxMemoApproveDo('E1','acct').ok;
    actAs('eyal');const r4=!!hnxMemoApproveDo('E1','final').ok;
    actAs('dramy');const f2=!!hnxMemoApproveDo('E1','final').ok;
    seedMemo({id:'A1',category:'hr',type:'good',empId:'W4',date:'2026-10-13',title:'Bonus — night shift',totalAmount:250,impact:[{empId:'W4',empName:'GARCIA, PEDRO',role:'HR Memo',amount:250}]},'dramy');
    actAs('dramy');hnxMemoSubmit('A1');actAs('jinky');const a3=!!hnxMemoApproveDo('A1','acct').ok;
    actAs('dramy');const r5=!!hnxMemoApproveDo('A1','final').ok;
    actAs('eyal');const f3=!!hnxMemoApproveDo('A1','final').ok;
    actAsTester();
    return {refusals:[r1,r2,r3,r4,r5],covered,oks:[cov,f1,a2,f2,a3,f3],j1Type:g('J1').type,j1Dir:hnxMemoDir(g('J1')),ded:E.map(e=>pay(e)[0]),add:E.map(e=>pay(e)[1])};}),
  expect:{refusals:[false,false,false,false,false],covered:'creator-is-accountant',oks:[true,true,true,true,true,true],j1Type:'good',j1Dir:-1,ded:[100,100,400,100],add:[0,0,0,250]} },

{ name:'↩ Return and resubmit: Mea\'s HR −₱500 for CRUZ → Jinky returns it ("wrong amount") → RETURNED to Mea, ₱0 paid, ⏳ ₱500, a return without a reason is refused; corrected to −₱200 and resubmitted it restarts at ① (round 2); Dr Amy returns it at ② ("add the photo"); resubmitted (round 3), Jinky ✔ + Eyal ✔ → memoDed ₱200, not ₱500; the log holds 8 steps (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'H3',category:'hr',type:'bad',empId:'W2',date:'2026-10-12',title:'Damaged crates',totalAmount:-500,impact:[{empId:'W2',empName:'CRUZ, JUAN',role:'HR Memo',amount:-500}]},'mea');
    actAs('mea');hnxMemoSubmit('H3');
    actAs('jinky');window.prompt=()=>'';const noReason=!!hnxMemoReturn('H3').ok;window.prompt=()=>'ok';
    const r1=!!hnxMemoReturn('H3','wrong amount').ok;
    const st1=g('H3').status,pay1=pay(E[1]);
    edit('H3',m=>{m.totalAmount=-200;m.impact=[{empId:'W2',empName:'CRUZ, JUAN',role:'HR Memo',amount:-200}];});
    actAs('mea');hnxMemoSubmit('H3');
    const m2=g('H3');const round2=m2.chain.round,stage2=hnxMemoStage(m2),acct2=m2.chain.acct;
    actAs('jinky');hnxMemoApproveDo('H3','acct');
    actAs('dramy');const r2=!!hnxMemoReturn('H3','add the photo').ok;
    const st3=g('H3').status;
    actAs('mea');hnxMemoSubmit('H3');
    actAs('jinky');hnxMemoApproveDo('H3','acct');
    actAs('eyal');hnxMemoApproveDo('H3','final');
    actAsTester();
    const m=g('H3');
    return {noReason,r1,st1,pay1,round2,stage2,acct2,r2,st3,round:m.chain.round,stage:hnxMemoStage(m),ded:pay(E[1])[0],
      decisions:m.approvalLog.map(x=>x.decision),rounds:m.approvalLog.map(x=>x.round),
      returnedToMea:inbox().filter(x=>x.user==='mea'&&/^MEMO_H3_r\d+_returned_mea$/.test(x.id)).length};}),
  expect:{noReason:false,r1:true,st1:'returned',pay1:[0,0,[1,500]],round2:2,stage2:'acct',acct2:null,r2:true,st3:'returned',round:3,stage:'approved',ded:200,
    decisions:['submitted','returned','resubmitted','approved','returned','resubmitted','approved','approved'],rounds:[1,1,2,2,2,3,3,3],returnedToMea:2} },

{ name:'🚧 A late WARNING (₱0) for CRUZ filed by Mea (hnxLateMemo) waits for Jinky (① queue 1), then Dr Amy (② queue 1); ₱0 in payroll and never in ⏳ Memo at any step; approved → scorecard CRUZ ⚠ 1, ✅ 0, ❌ 0, Net ₱0 (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    actAs('mea');hnxLateMemo('W2','2026-10-12',30,0);
    const id=(all().find(m=>m&&m._lateAuto&&m.empId==='W2')||{}).id;
    const stages=[stageOf(id)],pays=[pay(E[1])];
    const q=()=>{const d=document.createElement('div');d.innerHTML=hnxMemoQueuesHTML();return d.textContent;};
    actAs('jinky');const q1=/① Waiting for Jinky \(accountant\) — 1/.test(q());
    hnxMemoApproveDo(id,'acct');stages.push(stageOf(id));pays.push(pay(E[1]));
    actAs('dramy');const q2=/② Waiting for final \(Dr Amy \/ Eyal\) — 1/.test(q());
    hnxMemoApproveDo(id,'final');stages.push(stageOf(id));pays.push(pay(E[1]));
    actAsTester();
    _hnxGHA.from('2026-10-01');_hnxGHA.to('2026-10-31');
    const e=_hnxGHA.stats().byE.W2||{};
    return {stages,q1,q2,pays,sc:{good:e.good,bad:e.bad,warn:e.warn,net:e.net}};}),
  expect:{stages:['acct','final','approved'],q1:true,q2:true,pays:[[0,0,[0,0]],[0,0,[0,0]],[0,0,[0,0]]],sc:{good:0,bad:0,warn:1,net:0}} },

{ name:'👷 Scorecard = payroll (Eder\'s question): TORZAR, EDERLYN with an HR memo −₱500 left on GOOD (10 Oct), GH3 −₱100 (12 Oct) and +₱100 (13 Oct), and an old-style {type:"production",kind:"bad",ghAffected:"GH3"} −₱100 (9 Oct), all final → ✅ 1 ❌ 3 Net −₱600 = payroll memoAdd ₱100 − memoDed ₱700 (the −₱500 is ❌ and minus, not ✅ +₱500); a GH3 −₱100 still waiting ② (14 Oct) is ⏳ 1 (−₱100), not in Net; draft (10 Oct), returned (9 Oct) and rejected (8 Oct) memos not counted; CRUZ, JUAN ✅ 1 ❌ 2 Net −₱100; the same with GH3 picked; the drill-down lists 5 memos with date, GH, ± and status; the footnote says payroll pays each memo as its own line (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    const ch=(acct,fin)=>({v:2294,round:1,since:T,submittedBy:'mea',submittedAt:T,acct:acct?{by:'jinky',name:'Jinky Pagtama',at:T,round:1}:null,final:fin?{by:'dramy',name:'Dr Amy Patdu',at:T,round:1,side:'amy'}:null,returned:null,notified:['r1:acct','r1:final','r1:approved']});
    const fin={status:'signed',chain:ch(true,true),approvals:{final:{name:'Dr Amy Patdu',username:'dramy',at:T}}};
    const gh=(id,type,date,extra)=>Object.assign({id,category:'production',type,gh:'GH3',date,title:id+' GH3 '+type,reasons:[type==='bad'?'📉 Below target':'⭐ Exceptional produce quality']},extra);
    seedMemo(Object.assign({id:'S1',category:'hr',type:'good',empId:'W1',date:'2026-10-10',title:'HR memo −₱500 (type left GOOD)',totalAmount:-500,impact:[{empId:'W1',empName:'TORZAR, EDERLYN',role:'HR Memo',amount:-500}]},fin),'mea');
    seedMemo(gh('S2','bad','2026-10-12',fin),'mea');
    seedMemo(gh('S3','good','2026-10-13',fin),'mea');
    seedMemo({id:'S4',type:'production',kind:'bad',ghAffected:'GH3',date:'2026-10-09',title:'old-style bad memo',status:'signed',approvals:{final:{name:'Eyal Ben Ari',username:'eyal',at:T}}},'mea');
    seedMemo(gh('S5','bad','2026-10-14',{status:'pending',chain:ch(true,false)}),'mea');
    seedMemo(gh('S6','bad','2026-10-10',{status:'draft'}),'mea');
    seedMemo(gh('S7','bad','2026-10-09',{status:'returned',chain:Object.assign(ch(false,false),{returned:{by:'jinky',name:'Jinky Pagtama',at:T,step:'acct',reason:'wrong GH',round:1}})}),'mea');
    seedMemo(gh('S8','bad','2026-10-08',{status:'rejected',rejection:{by:'eyal',name:'Eyal Ben Ari',at:T,note:'not fair'}}),'mea');
    const pk=e=>({good:e.good,bad:e.bad,warn:e.warn,net:e.net,waitN:e.waitN,waitAmt:e.waitAmt});
    _hnxGHA.from('2026-10-01');_hnxGHA.to('2026-10-31');
    const st=_hnxGHA.stats();const W1=pk(st.byE.W1||{}),W2=pk(st.byE.W2||{});
    const it=(st.byE.W1||{}).items||[];
    _hnxGHA.gh('GH3');const W1gh=pk((_hnxGHA.stats().byE.W1)||{});
    _hnxGHA.gh('ALL');_hnxGHA.tab('emp');_hnxGHA.emp('W1');await sleep(200);
    const host=document.getElementById('ghAnaBody');const txt=host?host.textContent:'';
    const dr=host?host.querySelector('.hnx-gha-drill'):null;const dt=dr?dr.textContent:'';
    const drillN=(dt.match(/\[(paid|waiting ①|waiting ②)\]/g)||[]).length;
    return {W1,W2,payW1:pay(E[0]),payW2:pay(E[1]),W1gh,dirs:it.map(x=>x.dir),amounts:it.map(x=>x.amount),status:it.map(x=>x.status),dates:it.map(x=>x.date),
      drillN,drillGH:/HR \(individual\)/.test(dt)&&/GH3/.test(dt)&&/➖/.test(dt)&&/➕/.test(dt),footnote:/own plus or minus line/.test(txt),heading:/counts what payroll pays/.test(txt)};}),
  expect:{W1:{good:1,bad:3,warn:0,net:-600,waitN:1,waitAmt:-100},W2:{good:1,bad:2,warn:0,net:-100,waitN:1,waitAmt:-100},payW1:[700,100,[3,300]],payW2:[200,100,[3,300]],
    W1gh:{good:1,bad:3,warn:0,net:-600,waitN:1,waitAmt:-100},dirs:['−','−','−','+','−'],amounts:[-100,-500,-100,100,-100],status:['paid','paid','paid','paid','waiting ②'],
    dates:['2026-10-09','2026-10-10','2026-10-12','2026-10-13','2026-10-14'],drillN:5,drillGH:true,footnote:true,heading:true} },

{ name:'Release v23.10 moves only WAITING memos into the chain and no paid figure moves: signed before 10 Oct −₱200, FINAL-approved −₱300 and APPLIED +₱400 stay paid and byte-identical; a signed-but-not-final −₱150 whose HR signature is Jinky\'s lands at ② (₱0, ⏳ ₱150); a pending −₱50 lands at ① (⏳ ₱50); Jinky\'s own signature on her own −₱60 memo does not count (①, ⏳ ₱60); draft −₱75, rejected −₱80, a LATE_ record and a signed warning untouched; 5 notices (one per memo per step); a second pass changes nothing (v23.10)',
  requires:REQ,
  seed:()=>{
    localStorage.setItem('hnx_memo_final_from','2026-10-10');
    const U=[['tester','Tester','admin'],['eyal','Eyal Ben Ari','admin'],['dramy','Dr Amy Patdu','admin_secondary'],['jinky','Jinky Pagtama','accounting'],['mea','Meajean Magracia','supervisor'],['sup3','Sup Three','supervisor']]
      .map(x=>({username:x[0],fullname:x[1],passwordHash:'x',role:x[2],active:true}));
    localStorage.setItem('hydroPro_users',JSON.stringify(U));
    const lab=(id,name)=>({id,name,status:'Active',salaryCategory:'Regular',dept:'Construction',payType:'weekly',employmentType:'Regular',dailyRate:658,dateHired:'2025-01-01',hireDate:'2025-01-01',ghAssigned:['GH3']});
    const E=[lab('W1','TORZAR, EDERLYN'),lab('W2','CRUZ, JUAN'),lab('W3','REYES, ANA'),lab('W4','GARCIA, PEDRO')];
    localStorage.setItem('hydroPro_employees',JSON.stringify(E));
    const a={};['2026-10-08','2026-10-09','2026-10-10','2026-10-12','2026-10-13','2026-10-14'].forEach(d=>{a[d]={};E.forEach(e=>{a[d][e.id]={status:'present',timeIn:'07:00',timeOut:'17:00',lateMinutes:0,source:'fingerprint'};});});
    localStorage.setItem('hydroPro_attendance',JSON.stringify(a));
    const T='2026-10-11T03:00:00.000Z',sig=u=>({name:u,username:u,signedAt:T});
    const hr=(id,emp,amt,date,extra)=>Object.assign({id,category:'hr',type:amt<0?'bad':'good',empId:emp,date,title:id+' memo',reasons:['test'],totalAmount:amt,
      impact:amt?[{empId:emp,empName:emp,role:'HR Memo',amount:amt}]:[],signatures:{supervisor:null,hrManager:null},createdAt:'2026-10-11T02:00:00.000Z',createdBy:'mea',updatedAt:'2026-10-11T04:00:00.000Z'},extra||{});
    const M=[
      hr('L1','W1',-200,'2026-10-09',{status:'signed',createdAt:'2026-10-09T02:00:00.000Z',signatures:{supervisor:sig('sup3'),hrManager:sig('eyal')}}),
      hr('L2','W2',-300,'2026-10-10',{status:'signed',signatures:{supervisor:sig('sup3'),hrManager:sig('jinky')},approvals:{final:{name:'Dr Amy Patdu',username:'dramy',at:T}}}),
      hr('L3','W3',400,'2026-10-12',{status:'applied',appliedAt:T,appliedBy:'tester'}),
      hr('L4','W4',-150,'2026-10-12',{status:'signed',signatures:{supervisor:sig('sup3'),hrManager:sig('jinky')}}),
      hr('L5','W1',-50,'2026-10-09',{status:'pending'}),
      hr('L6','W2',-75,'2026-10-12',{status:'draft'}),
      hr('L7','W3',-80,'2026-10-12',{status:'rejected',rejection:{by:'eyal',name:'Eyal Ben Ari',at:T,note:'no'}}),
      {id:'LATE_2026-10-12_W4',category:'hr',type:'bad',kind:'bad',empId:'W4',employeeId:'W4',date:'2026-10-12',title:'Late — GARCIA, PEDRO · 2026-10-12',reasons:['Tardiness'],status:'signed',noMoney:true,amount:0,amt:0,source:'late_approval',createdAt:T,createdBy:'eyal'},
      hr('L9','W2',0,'2026-10-12',{status:'signed',type:'bad',noMoney:true}),
      hr('L10','W3',-60,'2026-10-12',{status:'signed',createdBy:'jinky',signatures:{supervisor:sig('sup3'),hrManager:sig('jinky')}})
    ];
    localStorage.setItem('hydroPro_memos',JSON.stringify(M));
    localStorage.setItem('test_seed_memos_v2294',JSON.stringify(M));
  },
  run:R(async()=>{
    const seed=JSON.parse(localStorage.getItem('test_seed_memos_v2294'));
    const ms=all(),by=id=>ms.find(m=>m.id===id);
    const ids={L1:'L1',L2:'L2',L3:'L3',L4:'L4',L5:'L5',L6:'L6',L7:'L7',L8:'LATE_2026-10-12_W4',L9:'L9',L10:'L10'};
    const stages={};Object.keys(ids).forEach(k=>{stages[k]=hnxMemoStage(by(ids[k]));});
    const chain=ms.filter(m=>m&&m.chain).map(m=>m.id).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const same=id=>JSON.stringify(by(id))===JSON.stringify(seed.find(m=>m.id===id));
    const untouched=['L1','L2','L3','L6','L7','LATE_2026-10-12_W4','L9'].every(same);
    const changed=['L1','L2','L3','L6','L7','LATE_2026-10-12_W4','L9'].filter(id=>!same(id));
    loadEmployees();const E=JSON.parse(localStorage.getItem('hydroPro_employees')).filter(e=>/^W[1-4]$/.test(e.id)); /* the app may add its own sample employees at boot */
    const P={};E.forEach(e=>{P[e.id]=pay(e);});
    const notices=inbox().map(x=>x.id).filter(x=>/^MEMO_/.test(x)).sort();
    const again=hnxMemoChainMigrate().changed;
    return {stages,chain,L4acctBy:(by('L4').chain.acct||{}).by,L4status:by('L4').status,L10acct:by('L10').chain.acct,untouched,changed,pay:P,notices,again};}),
  expect:{stages:{L1:'approved',L2:'approved',L3:'applied',L4:'final',L5:'acct',L6:'draft',L7:'rejected',L8:'record',L9:'approved',L10:'acct'},chain:['L4','L5','L10'],
    L4acctBy:'jinky',L4status:'pending',L10acct:null,untouched:true,changed:[],
    pay:{W1:[200,0,[1,50]],W2:[300,0,[1,75]],W3:[0,400,[1,60]],W4:[0,0,[1,150]]},
    notices:['MEMO_L10_r1_acct_dramy','MEMO_L10_r1_acct_eyal','MEMO_L4_r1_final_dramy','MEMO_L4_r1_final_eyal','MEMO_L5_r1_acct_jinky'],again:0} },

{ name:'A FINAL written by an older Nexi tab (before v23.10: approvals.final + status signed, no Jinky check) on a memo already in the chain pays ₱0 (⏳ ₱100 × 4) and goes back to ① with an "ignored" log line; after Jinky ✔ and Dr Amy ✔ it pays ₱400 (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'O1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad'},'mea');
    actAs('mea');hnxMemoSubmit('O1');actAsTester();
    edit('O1',m=>{m.status='signed';m.approvals={final:{name:'Eyal Ben Ari',username:'eyal',at:new Date().toISOString()}};
      m.signatures={supervisor:{name:'Eyal Ben Ari',username:'eyal',signedAt:T},hrManager:{name:'Eyal Ben Ari',username:'eyal',signedAt:T}};});
    const dedStale=E.map(e=>pay(e)[0]),pendStale=E.map(e=>pay(e)[2]),stage=stageOf('O1');
    const r=hnxMemoChainMigrate();
    const m=g('O1');
    const ok=chainApprove('O1');
    const ded=E.map(e=>pay(e)[0]);
    return {dedStale,pendStale,stage,repaired:r.repaired,status:m.status,ignored:(m.approvalLog||[]).some(l=>l.step==='ignored'&&/older Nexi/.test(l.reason||'')),
      finalGone:!(m.approvals&&m.approvals.final),ok,ded,dedSum:sum(ded)};}),
  expect:{dedStale:[0,0,0,0],pendStale:[[1,100],[1,100],[1,100],[1,100]],stage:'acct',repaired:1,status:'pending',ignored:true,finalGone:true,ok:[true,true],ded:[100,100,100,100],dedSum:400} },

{ name:'Notices once per step: Mea submits → 1 notice to Jinky; re-render, a migrate pass and a repeated notify add none; Jinky ✔ → 1 each to Dr Amy and Eyal; Dr Amy ✔ → 1 to Mea ("approved"); 4 in total; the SMS snapshot lists only ② memos (1) and the e-mail list keeps accounting@abapardes.com.ph and drops jinky@gmail.com and hr@abapardes.com (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    const cnt=()=>inbox().filter(x=>/^MEMO_N1_/.test(x.id)).length;
    seedMemo({id:'N1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad'},'mea');
    seedMemo({id:'N2',category:'production',type:'bad',gh:'GH3',date:'2026-10-13',title:'GH3 bad 2'},'mea');
    actAs('mea');hnxMemoSubmit('N1');hnxMemoSubmit('N2');const c1=cnt();
    renderMemos();hnxMemoChainMigrate();hnxMemoNotify(g('N1'),'acct');const c2=cnt();
    actAs('jinky');hnxMemoApproveDo('N1','acct');const c3=cnt();
    localStorage.setItem('hydroPro_memo_approvers_v1',JSON.stringify({hrEmail:'hr@abapardes.com',acctEmail:'accounting@abapardes.com.ph, jinky@gmail.com'}));
    const snap=hnxMemoSnapshot();
    actAs('dramy');hnxMemoApproveDo('N1','final');const c4=cnt();
    actAsTester();
    const to=inbox().filter(x=>/^MEMO_N1_/.test(x.id)).map(x=>x.id.replace(/^MEMO_N1_r1_/,'')).sort();
    return {counts:[c1,c2,c3,c4],to,snapN:snap.pending.length,snapId:(snap.pending[0]||{}).id,snapAmt:(snap.pending[0]||{}).amount,acct:snap.emails.acct,hr:snap.emails.hr};}),
  expect:{counts:[1,1,3,4],to:['acct_jinky','approved_mea','final_dramy','final_eyal'],snapN:1,snapId:'N1',snapAmt:-400,acct:'accounting@abapardes.com.ph',hr:''} },

{ name:'Old holes closed (harness off): Mea (admin role) cannot give ① or ② (stage unchanged), cannot ✓ Apply a memo waiting ② (₱0 stays ₱0), cannot save 🏛 Approvers (acctUser unchanged), cannot ↩ Re-open; "Amy Cruz" (operator) is not a final approver while Dr Amy Patdu exists; hnxMemoCanDecide: Eyal yes, Dr Amy yes, Jinky no, Mea no (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const h=localStorage.getItem('hnx_test_harness');localStorage.removeItem('hnx_test_harness');
    const E=fx();
    const U=memoUsers();U.find(x=>x.username==='mea').role='admin';U.push({username:'amyc',fullname:'Amy Cruz',passwordHash:'x',role:'operator',active:true});
    localStorage.setItem('hydroPro_users',JSON.stringify(U));
    localStorage.setItem('hydroPro_memo_approvers_v1',JSON.stringify({acctUser:'jinky',hrEmail:'hr@abapardes.com.ph'}));
    const cfg0=localStorage.getItem('hydroPro_memo_approvers_v1');
    seedMemo({id:'X1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad'},'eyal');
    seedMemo({id:'Y1',category:'hr',type:'bad',empId:'W1',date:'2026-10-12',title:'Old warning',noMoney:true,status:'signed',createdAt:'2026-10-01T02:00:00.000Z',approvals:{final:{name:'Eyal Ben Ari',username:'eyal',at:T}}},'mea');
    actAs('eyal');hnxMemoSubmit('X1');
    actAs('mea');const r1=!!hnxMemoApproveDo('X1','acct').ok;const sA=stageOf('X1');
    actAs('jinky');hnxMemoApproveDo('X1','acct');
    actAs('mea');const r2=!!hnxMemoApproveDo('X1','final').ok;
    try{memoApply('X1');}catch(e){}const r3=g('X1').status==='applied'||g('X1').status==='signed';
    const r4=!!(hnxMemoApproversSave({acctUser:'mea'})||{}).ok;const cfgSame=localStorage.getItem('hydroPro_memo_approvers_v1')===cfg0;
    try{memoReopen('Y1');}catch(e){}const r5=g('Y1').status!=='signed';
    const stage=stageOf('X1'),ded=E.map(e=>pay(e)[0]);
    const W=n=>hnxMemoWho(memoUsers().find(x=>x.username===n));
    const amyCruz=W('amyc').final;
    const dec={};['eyal','dramy','jinky','mea'].forEach(n=>{dec[n]=hnxMemoCanDecide(memoUsers().find(x=>x.username===n));});
    actAsTester();if(h!=null)localStorage.setItem('hnx_test_harness',h);
    return {refused:[r1,r2,r3,r4,r5],stageAfterMea:sA,stage,ded,cfgSame,amyCruz,decide:dec};}),
  expect:{refused:[false,false,false,false,false],stageAfterMea:'acct',stage:'final',ded:[0,0,0,0],cfgSame:true,amyCruz:false,decide:{eyal:true,dramy:true,jinky:false,mea:false}} },

{ name:'🏛 Approvals screen: Jinky sees "① Waiting for Jinky (accountant) — 3" and "② Waiting for final (Dr Amy / Eyal) — 1" with the money (−₱400.00), "✔ Approve all 3" only for her; it moves all 3 to ② (4 waiting, ₱0 paid); Dr Amy\'s "✔ Approve all 4" pays memoDed ₱300 + memoAdd ₱100 per worker; on a ① memo Dr Amy\'s panel offers "✅ FINAL now (override — covers Jinky’s check)" (v23.38) and no ① button, and Jinky\'s panel has "✔ Approve ①"; the card reads "① ✓ Jinky · ② ⏳" (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    [['Q1','bad','2026-10-08'],['Q2','bad','2026-10-09'],['Q3','bad','2026-10-10'],['Q4','good','2026-10-12']].forEach(x=>seedMemo({id:x[0],category:'production',type:x[1],gh:'GH3',date:x[2],title:'GH3 '+x[1]+' '+x[2]},'mea'));
    actAs('mea');['Q1','Q2','Q3','Q4'].forEach(id=>hnxMemoSubmit(id));
    actAs('jinky');hnxMemoApproveDo('Q4','acct');
    const qd=()=>{const d=document.createElement('div');d.innerHTML=hnxMemoQueuesHTML();return d;};
    let d=qd(),t=d.textContent;
    const q1=/① Waiting for Jinky \(accountant\) — 3/.test(t),q2=/② Waiting for final \(Dr Amy \/ Eyal\) — 1/.test(t),money=/−₱400\.00/.test(t);
    const bulkJinky=!!d.querySelector('[data-bulk="acct"]')&&/✔ Approve all 3/.test(t)&&!d.querySelector('[data-bulk="final"]');
    actAs('dramy');d=qd();const bulkAmyOnQ1=!!d.querySelector('[data-bulk="acct"]');
    openMemoView('Q1');await sleep(1800);
    let pa=document.getElementById('hnxMemoAppr');const amyPanel=!!pa&&/✅ FINAL now \(override — covers Jinky’s check\)/.test(pa.textContent)&&!!pa.querySelector('[data-act="final"]')&&!pa.querySelector('[data-act="acct"]'); /* v23.38 */
    actAs('jinky');await sleep(1800);
    pa=document.getElementById('hnxMemoAppr');const jinkyBtn=!!pa&&!!pa.querySelector('[data-act="acct"]')&&/✔ Approve ①/.test(pa.textContent);
    document.getElementById('memoViewModal').classList.remove('open');
    const m1=hnxMemoApproveMany('acct');
    const cnt=s=>all().filter(m=>hnxMemoStage(m)===s).length;
    const after1=[cnt('acct'),cnt('final')],dedMid=E.map(e=>pay(e)[0]);
    renderMemos();const card=[...document.querySelectorAll('#memosBody .memo-card')].find(c=>/openMemoView\('Q1'\)/.test(c.getAttribute('onclick')||''));
    const cardOk=!!card&&/① ✓ Jinky[^·]*· ② ⏳/.test(card.textContent);
    actAs('dramy');const m2=hnxMemoApproveMany('final');actAsTester();
    return {q1,q2,money,bulkJinky,bulkAmyOnQ1,amyPanel,jinkyBtn,many1:{done:m1.done,skipped:m1.skipped},after1,dedMid,card:cardOk,many2:{done:m2.done},
      ded:E.map(e=>pay(e)[0]),add:E.map(e=>pay(e)[1])};}),
  expect:{q1:true,q2:true,money:true,bulkJinky:true,bulkAmyOnQ1:false,amyPanel:true,jinkyBtn:true,many1:{done:3,skipped:0},after1:[0,4],dedMid:[0,0,0,0],card:true,many2:{done:4},
    ded:[300,300,300,300],add:[100,100,100,100]} },
/* ---------- v23.10 review fixes (three-lens review of the memo chain) ---------- */
{ name:'HR sign is never rewritten (review): Mea\'s HR −₱500 for CRUZ returned by Jinky ("it is a +₱500 bonus"), corrected to +₱500 and approved ① ② → +₱500; an old draft −₱500 left on GOOD auto-saved (form and type stay GOOD), corrected to +₱500, ① ② → +₱500 — CRUZ memoAdd ₱1,000, memoDed ₱0; an old {type:"hr",kind:"good",amount:−₱200} memo for REYES paid under the old rule, re-opened by Eyal, 📨 Submitted by Mea, ① ② → memoDed ₱200 again and it stays an HR memo (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    actAs('mea');
    openMemoCreate('hr');
    _editingMemoData.empId='W2';_editingMemoData.date='2026-10-12';_editingMemoData.title='Crates bonus';_editingMemoData.reasons=['test'];
    memoUpdateHrAmount('-500');memoSaveAndSend();
    const id=(all().find(m=>m&&m.title==='Crates bonus')||{}).id;const t1=g(id).type;
    actAs('jinky');const ret=!!hnxMemoReturn(id,'it is a +500 bonus').ok;
    actAs('mea');openMemoEdit(id);memoUpdateHrAmount('500');memoSaveAndSend();
    const ap1=chainApprove(id);const tFinal=g(id).type;
    seedMemo({id:'H9',category:'hr',type:'good',empId:'W2',date:'2026-10-13',title:'old −500 on GOOD',totalAmount:-500,impact:[{empId:'W2',empName:'CRUZ, JUAN',role:'HR Memo',amount:-500}]},'mea');
    actAs('mea');openMemoEdit('H9');_autosaveMemoDraft();
    const tAuto=g('H9').type,goodBtn=!!document.querySelector('#memoModalBody .memo-type-btn.active.good');
    memoUpdateHrAmount('500');memoSaveAndSend();const ap2=chainApprove('H9');
    put(all().concat([{id:'OS1',type:'hr',kind:'good',empId:'W3',date:'2026-10-12',title:'old shape deduction',amount:-200,status:'signed',createdBy:'mea',createdAt:'2026-10-05T02:00:00.000Z',updatedAt:'2026-10-05T02:00:00.000Z',signatures:{supervisor:{username:'sup3'},hrManager:{username:'hr1'}}}]));
    const p0=pay(E[2])[0];
    actAs('eyal');memoReopen('OS1');const st1=g('OS1').status;
    actAs('mea');const sub=!!hnxMemoSubmit('OS1').ok;const os=g('OS1');
    const ap3=chainApprove('OS1');
    actAsTester();
    const c=pay(E[1]),r=pay(E[2]);
    return {t1,ret,ap1,tFinal,tAuto,goodBtn,ap2,p0,st1,sub,cat:hnxMemoCat(os),type:os.type,ap3,cruz:[c[0],c[1]],reyes:[r[0],r[1]]};}),
  expect:{t1:'good',ret:true,ap1:[true,true],tFinal:'good',tAuto:'good',goodBtn:true,ap2:[true,true],p0:200,st1:'returned',sub:true,cat:'hr',type:'hr',ap3:[true,true],cruz:[0,1000],reyes:[200,0]} },

{ name:'A stale computer and a fast clock never undo a decision (review): a computer last synced before v23.10 (memo X waiting, memo Y signed without FINAL) waits while its cloud download is not done, then tags its OLD copies and merges with the cloud where X got ① Jinky + ② Dr Amy and Y got Eyal\'s v22.28 FINAL → X stays approved and Y stays paid (TORZAR memoDed ₱300 + ₱200 + ₱100 = ₱600); with Jinky\'s PC clock 2 min fast, Dr Amy\'s ② still wins the merge (approved, memoDed ₱100 each); a late WARNING is born in the approval order (round 1, waiting ①, 1 notice to Jinky) (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    localStorage.setItem('hnx_memo_final_from','2026-10-10');
    const X={id:'X1',category:'hr',type:'good',empId:'W1',amount:-300,totalAmount:-300,date:'2026-10-12',title:'Late deduction',reasons:['test'],status:'pending',createdBy:'mea',createdAt:'2026-10-12T01:00:00.000Z',updatedAt:'2026-10-12T01:00:00.000Z',signatures:{}};
    const Y={id:'Y1',category:'hr',type:'bad',empId:'W1',amount:-200,totalAmount:-200,date:'2026-10-11',title:'Old-rule signed',reasons:['test'],status:'signed',createdBy:'mea',createdAt:'2026-10-11T01:00:00.000Z',updatedAt:'2026-10-11T03:00:00.000Z',signatures:{supervisor:{name:'Sup',username:'sup3',signedAt:'2026-10-11T02:00:00.000Z'},hrManager:{name:'Mea',username:'mea2',signedAt:'2026-10-11T03:00:00.000Z'}}};
    const stale=JSON.stringify([X,Y]);
    const Yf=JSON.parse(JSON.stringify(Y));Yf.approvals={final:{name:'Eyal Ben Ari',username:'eyal',at:'2026-10-12T05:00:00.000Z'}};Yf.updatedAt='2026-10-12T05:00:00.000Z';
    put([X,Yf]);hnxMemoChainMigrate();const ap=chainApprove('X1');
    const cloud=localStorage.getItem('hydroPro_memos');
    localStorage.setItem('hydroPro_memos',stale);loadMemos();
    localStorage.setItem('hnx_cloud_token','test-only');const po=window.__hnxPulledOk;window.__hnxPulledOk=false;
    const wait=hnxMemoChainMigrate();const untouched=localStorage.getItem('hydroPro_memos')===stale;
    localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=po;
    const mig=hnxMemoChainMigrate().changed;
    const local=localStorage.getItem('hydroPro_memos');
    put(JSON.parse(window.__hnxMergeGeneric('hydroPro_memos',local,cloud)||local));
    const st={X:stageOf('X1'),Y:stageOf('Y1'),Xfinal:((g('X1').chain||{}).final||{}).by||null,Yfinal:!!(g('Y1').approvals&&g('Y1').approvals.final)};
    seedMemo({id:'K1',category:'production',type:'bad',gh:'GH3',date:'2026-10-13',title:'GH3 bad skew'},'mea');
    actAs('mea');hnxMemoSubmit('K1');actAs('jinky');hnxMemoApproveDo('K1','acct');
    const J1=all();J1.find(x=>x.id==='K1').updatedAt=new Date(Date.now()+120000).toISOString();const jc=JSON.stringify(J1);
    localStorage.setItem('hydroPro_memos',jc);loadMemos();
    actAs('dramy');hnxMemoApproveDo('K1','final');actAsTester();
    const amy=localStorage.getItem('hydroPro_memos');
    put(JSON.parse(window.__hnxMergeGeneric('hydroPro_memos',amy,jc)||amy));
    const stK=stageOf('K1');
    actAs('mea');hnxLateMemo('W2','2026-10-12',30,0);actAsTester();
    const lm=all().find(m=>m&&m._lateAuto&&m.empId==='W2')||{};
    return {ap,wait:!!wait.waiting,untouched,mig,st,stK,ded:E.map(e=>pay(e)[0]),
      late:{round:(lm.chain||{}).round,by:(lm.chain||{}).submittedBy,stage:hnxMemoStage(lm),notices:inbox().filter(x=>x.id==='MEMO_'+lm.id+'_r1_acct_jinky').length}};}),
  expect:{ap:[true,true],wait:true,untouched:true,mig:2,st:{X:'approved',Y:'approved',Xfinal:'dramy',Yfinal:true},stK:'approved',ded:[600,100,100,100],
    late:{round:1,by:'mea',stage:'acct',notices:1}} },

{ name:'Two decisions at once (review): Eyal ↩ returns a memo at ② while Dr Amy\'s screen still shows ② (round 1) → her ✔ is refused "changed on another computer" and the memo stays RETURNED (₱0 paid, ⏳ 1 × ₱100 for TORZAR); Dr Amy\'s ② that another computer\'s write erased is found on her computer: 1 lost decision, 1 inbox notice to her, a second check adds none (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'D1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad two'},'mea');
    actAs('mea');hnxMemoSubmit('D1');actAs('jinky');hnxMemoApproveDo('D1','acct');
    const seen={stage:stageOf('D1'),round:g('D1').chain.round};
    actAs('eyal');const r1=!!hnxMemoReturn('D1','add the photo').ok;
    actAs('dramy');const r2=hnxMemoAct('D1','final',seen.stage,seen.round)||{};
    const st=stageOf('D1'),p=pay(E[0]);
    seedMemo({id:'D2',category:'production',type:'good',gh:'GH3',date:'2026-10-13',title:'GH3 good two'},'mea');
    actAs('mea');hnxMemoSubmit('D2');actAs('jinky');hnxMemoApproveDo('D2','acct');
    const before=JSON.parse(localStorage.getItem('hydroPro_memos')).find(x=>x.id==='D2');
    actAs('dramy');const f=!!hnxMemoApproveDo('D2','final').ok;
    before.updatedAt=new Date(Date.now()+60000).toISOString();
    put(all().map(x=>x.id==='D2'?before:x));
    const lost=hnxMemoCheckMine().map(x=>x.id+':'+x.step);const again=hnxMemoCheckMine().length;
    actAsTester();
    return {seen,r1,r2:{ok:!!r2.ok,changed:/changed on another computer/.test(r2.why||'')},st,p,f,lost,again,
      notice:inbox().filter(x=>x.id==='MEMO_D2_lost_final_r1_dramy'&&x.user==='dramy').length,stageD2:stageOf('D2')};}),
  expect:{seen:{stage:'final',round:1},r1:true,r2:{ok:false,changed:true},st:'returned',p:[0,0,[1,100]],f:true,lost:['D2:final'],again:0,notice:1,stageD2:'final'} },

{ name:'An editor left open never overwrites (review): Mea\'s draft R1 is open in ✏️ Edit while, on another computer, it is submitted, Jinky ✔ ① and Dr Amy ✔ ② (memoDed ₱100 × 4 = ₱400); this tab\'s list is stale → one more keystroke (auto-save) writes nothing and 💾 Save draft is refused ("changed on another computer") — the memo stays approved with its 3-step log and payroll keeps ₱400 (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'R1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad R1'},'mea');
    actAs('mea');openMemoEdit('R1');
    const snap=localStorage.getItem('hydroPro_memos');
    hnxMemoSubmit('R1');actAs('jinky');hnxMemoApproveDo('R1','acct');actAs('dramy');hnxMemoApproveDo('R1','final');
    actAs('mea');memos=JSON.parse(snap); /* this tab's in-memory list was not refreshed */
    _editingMemoData.customReason='one more word';_autosaveMemoDraft();
    const afterAuto={stage:stageOf('R1'),log:(g('R1').approvalLog||[]).length};
    let tt='';const ot=window.showToast;window.showToast=(t)=>{tt+=String(t)+'\n';};
    memoSaveDraft();window.showToast=ot;
    try{closeMemoModal();}catch(e){}
    actAsTester();
    return {afterAuto,refused:/changed on another computer/.test(tt),stage:stageOf('R1'),log:(g('R1').approvalLog||[]).map(x=>x.step),ded:E.map(e=>pay(e)[0]),dedSum:sum(E.map(e=>pay(e)[0]))};}),
  expect:{afterAuto:{stage:'approved',log:3},refused:true,stage:'approved',log:['submit','acct','final'],ded:[100,100,100,100],dedSum:400} },

{ name:'🏛 Approvers stand-in sticks on every computer (review): Eyal names @joshane while Jinky is away; back to "automatic" → a computer still holding joshane takes the cloud copy (accountant: jinky); joshane → @ana wins too; an older copy stamped with an ISO date is replaced (saved as one last-writer-wins snapshot with a number stamp) (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const U=memoUsers();U.push({username:'joshane',fullname:'Joshane Reyes',passwordHash:'x',role:'accounting',active:true},{username:'ana',fullname:'Ana Cruz',passwordHash:'x',role:'accounting',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
    const K='hydroPro_memo_approvers_v1',M=(l,r)=>JSON.parse(window.__hnxMergeGeneric(K,l,r)||l);
    actAs('eyal');
    hnxMemoApproversSave({acctUser:'joshane'});const held=localStorage.getItem(K);const acct1=hnxMemoPeople().acct;
    await sleep(5);hnxMemoApproversSave({acctUser:''});const cloud1=localStorage.getItem(K);
    const m1=M(held,cloud1);
    localStorage.setItem(K,held);await sleep(5);hnxMemoApproversSave({acctUser:'ana'});const cloud2=localStorage.getItem(K);
    const m2=M(held,cloud2);
    const old=JSON.stringify({acctUser:'joshane',hrEmail:'hr@abapardes.com.ph',updatedAt:'2026-10-12T01:00:00.000Z',updatedBy:'eyal'});
    const m3=M(old,cloud1);
    localStorage.setItem(K,JSON.stringify(m1));const acct2=hnxMemoPeople().acct;
    actAsTester();
    return {acct1,m1:m1.acctUser,m2:m2.acctUser,m3:m3.acctUser,acct2,lww:m1._lww===true,num:typeof m1.updatedAt};}),
  expect:{acct1:'joshane',m1:'',m2:'ana',m3:'',acct2:'jinky',lww:true,num:'number'} },

{ name:'Roles (review): Dr Amy cannot 📨 Submit Eyal\'s draft (nobody would be left for ②) — it stays a draft; Eyal submits it → Jinky ① → Dr Amy ② → memoDed ₱100 × 4; Eyal\'s own memo at ① reads "Jinky checks it first"; Dr Amy taking back Mea\'s memo is logged "HR (took it back to edit)", not "creator"; Mea cannot change the SMS reminder numbers, Eyal can; Eyal names @joshane stand-in → she gets 1 notice for the memo already waiting at ①, a second pass adds 0 (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    const U=memoUsers();U.push({username:'joshane',fullname:'Joshane Reyes',passwordHash:'x',role:'accounting',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
    seedMemo({id:'EY1',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad by Eyal'},'eyal');
    actAs('dramy');const s1=hnxMemoSubmit('EY1')||{};const st0=stageOf('EY1');
    actAs('eyal');const s2=!!hnxMemoSubmit('EY1').ok;
    const d=document.createElement('div');d.innerHTML=hnxMemoQueuesHTML();const note=((d.querySelector('[data-q="acct"] .hnxmq-own')||{}).textContent)||'';
    actAs('jinky');hnxMemoApproveDo('EY1','acct');actAs('dramy');const f=!!hnxMemoApproveDo('EY1','final').ok;
    seedMemo({id:'T1',category:'production',type:'bad',gh:'GH3',date:'2026-10-14',title:'GH3 T1'},'mea');
    actAs('mea');hnxMemoSubmit('T1');actAs('dramy');hnxMemoTakeBack('T1');const tl=(g('T1').approvalLog||[]).slice(-1)[0]||{};
    const K='hydroPro_notify_cfg_v1';localStorage.setItem(K,JSON.stringify({finalMobile:'0917 000 0000',firstMobile:'0918 000 0000',workerUrl:'',workerToken:''}));const k0=localStorage.getItem(K);
    const rm=()=>{const x=document.getElementById('hnxSmsSetup');if(x)x.remove();};
    actAs('mea');hnxSmsSetup();const roMea=!!(document.getElementById('hnxSMS_fm')||{}).disabled;hnxSmsSetupSave();const meaSame=localStorage.getItem(K)===k0;rm();
    actAs('eyal');hnxSmsSetup();const fm=document.getElementById('hnxSMS_fm');const roEyal=!!fm.disabled;fm.value='0917 111 2222';hnxSmsSetupSave();const eyalSaved=JSON.parse(localStorage.getItem(K)).finalMobile;rm();
    seedMemo({id:'S1',category:'hr',type:'bad',empId:'W1',date:'2026-10-13',title:'HR bad S1',totalAmount:-50,impact:[{empId:'W1',empName:'TORZAR, EDERLYN',role:'HR Memo',amount:-50}]},'mea');
    actAs('mea');hnxMemoSubmit('S1');
    actAs('eyal');hnxMemoApproversSave({acctUser:'joshane'});
    const n1=inbox().filter(x=>/^MEMO_S1_r1_acct_/.test(x.id)).map(x=>x.id).sort();const again=hnxMemoChainMigrate().notices;
    actAsTester();
    return {s1:{ok:!!s1.ok,why:/nobody is left to give ②/.test(s1.why||'')},st0,s2,note:/Jinky checks it first/.test(note),f,ded:E.map(e=>pay(e)[0]),takeBackRole:tl.role,
      sms:{roMea,meaSame,roEyal,eyalSaved},n1,again};}),
  expect:{s1:{ok:false,why:true},st0:'draft',s2:true,note:true,f:true,ded:[100,100,100,100],takeBackRole:'HR (took it back to edit)',
    sms:{roMea:true,meaSame:true,roEyal:false,eyalSaved:'0917 111 2222'},n1:['MEMO_S1_r1_acct_jinky','MEMO_S1_r1_acct_joshane'],again:0} },

{ name:'The scorecard keeps what payroll paid (review): GH3 BAD −₱100 × 5 (12 Oct, incl. LEAVER who resigned before it and was present), GH3 GOOD +₱100 × 4 (13 Oct) and HR −₱500 for TORZAR, all ① ②; the ② summary reads −₱500.00 (5 lines); TORZAR payroll memoDed ₱600 memoAdd ₱100, LEAVER memoDed ₱100; then TORZAR moves to GH5 and CRUZ resigns → TORZAR still ✅1 ❌2 Net −₱500, CRUZ keeps her row ✅1 ❌1 Net ₱0 (payroll memoDed ₱100 memoAdd ₱100), LEAVER ❌1 −₱100; an HR −₱300 for SANTOS dated 6 Oct approved after the week 1–7 Oct was locked pays on 8 Oct → scorecard 8–14 Oct Net −₱300 = payroll memoDed ₱300, and 1–7 Oct has no SANTOS row (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    setE(E.concat([labour('R1','LEAVER, ROY',{ghAssigned:['GH3'],status:'Resigned',lastWorkingDay:'2026-10-16'}),labour('W5','SANTOS, LEA',{ghAssigned:['GH4']})]));loadEmployees();
    const a=JSON.parse(localStorage.getItem('hydroPro_attendance'));a['2026-10-12'].R1=rec('present','07:00','17:00');
    ['2026-10-01','2026-10-02','2026-10-03','2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-12','2026-10-13','2026-10-14'].forEach(d=>{a[d]=a[d]||{};a[d].W5=rec('present','07:00','17:00');});setA(a);
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-10-01_2026-10-07',type:'weekly',periodStart:'2026-10-01',periodEnd:'2026-10-07',status:'approved',approvedAt:Date.now()-86400000,approvedBy:'eyal',lines:[{empId:'W5',name:'SANTOS, LEA',dailyRate:658,daysWorked:6,memoList:[]}],totals:{}}]));
    seedMemo({id:'GB',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad'},'mea');
    seedMemo({id:'GG',category:'production',type:'good',gh:'GH3',date:'2026-10-13',title:'GH3 good'},'mea');
    seedMemo({id:'HW',category:'hr',type:'good',empId:'W1',date:'2026-10-10',title:'HR −500 on GOOD',totalAmount:-500,impact:[{empId:'W1',empName:'TORZAR, EDERLYN',role:'HR Memo',amount:-500}]},'mea');
    seedMemo({id:'HC',category:'hr',type:'bad',empId:'W5',date:'2026-10-06',title:'HR carried',totalAmount:-300,impact:[{empId:'W5',empName:'SANTOS, LEA',role:'HR Memo',amount:-300}]},'mea');
    const ids=['GB','GG','HW','HC'];
    actAs('mea');ids.forEach(id=>hnxMemoSubmit(id));
    actAs('jinky');ids.forEach(id=>hnxMemoApproveDo(id,'acct'));
    const summ=String(hnxMemoMoneySummary(g('GB'))).split('\n')[0];
    actAs('dramy');ids.forEach(id=>hnxMemoApproveDo(id,'final'));actAsTester();
    const emp=id=>JSON.parse(localStorage.getItem('hydroPro_employees')).find(x=>x.id===id);
    const pk=e=>e?{good:e.good,bad:e.bad,net:e.net}:null;
    const pW1=pay(emp('W1')),pR1=pay(emp('R1'));
    _hnxGHA.gh('ALL');_hnxGHA.from('2026-10-08');_hnxGHA.to('2026-10-14');const b=_hnxGHA.stats().byE;
    const Es=JSON.parse(localStorage.getItem('hydroPro_employees'));Es.find(x=>x.id==='W1').ghAssigned=['GH5'];Es.find(x=>x.id==='W2').status='Resigned';localStorage.setItem('hydroPro_employees',JSON.stringify(Es));loadEmployees();
    await sleep(2200);
    const af=_hnxGHA.stats().byE;const pW2=pay(emp('W2')),pW5=pay(emp('W5'));
    _hnxGHA.from('2026-10-01');_hnxGHA.to('2026-10-07');const wk1=_hnxGHA.stats().byE;
    return {summ,payDate:g('HC').payDate||null,payW1:[pW1[0],pW1[1]],payR1:pR1[0],W1:[pk(b.W1),pk(af.W1)],W2:pk(af.W2),payW2:[pW2[0],pW2[1]],R1:pk(af.R1),W5:pk(af.W5),payW5:pW5[0],W5wk1:pk(wk1.W5)};}),
  expect:{summ:'Payroll will move: −₱500.00 (5 lines)',payDate:'2026-10-08',payW1:[600,100],payR1:100,W1:[{good:1,bad:2,net:-500},{good:1,bad:2,net:-500}],W2:{good:1,bad:1,net:0},payW2:[100,100],
    R1:{good:0,bad:1,net:-100},W5:{good:0,bad:1,net:-300},payW5:300,W5wk1:null} },

{ name:'An office share is never lost (review): GH3 BAD memo 16 Oct with the OFFICE cut-off 11–25 Oct already approved and the week 15–21 Oct open → TORZAR memoDed ₱100 in 15–21 Oct; OFFICE, SUP (supervises every GH) is carried to 26 Oct: 11–25 Oct ₱0, 26 Oct–10 Nov memoDed ₱100 (was ₱0); the FINAL confirm names the carry (v23.10)',
  requires:REQ,
  run:R(async()=>{
    memoUsers();
    const E=[labour('W1','TORZAR, EDERLYN',{ghAssigned:['GH3']}),office('O1','OFFICE, SUP',{monthlyBasic:20000,supervisorGHs:'all'})];setE(E);loadEmployees();
    setA({'2026-10-16':{W1:rec('present','07:00','17:00'),O1:rec('present','07:00','17:00')}});
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'office_2026-10-11_2026-10-25',type:'semi_monthly',periodStart:'2026-10-11',periodEnd:'2026-10-25',status:'approved',approvedAt:Date.now()-5000,approvedBy:'eyal',lines:[{empId:'O1',name:'OFFICE, SUP',dailyRate:909.09,daysWorked:11,memoList:[]}],totals:{}}]));
    window.alert=()=>{};window.prompt=()=>'ok';let conf='';window.confirm=t=>{conf+=String(t)+'\n';return true;};
    seedMemo({id:'G9',category:'production',type:'bad',gh:'GH3',date:'2026-10-16',title:'GH3 bad 16 Oct'},'mea');
    actAs('mea');hnxMemoSubmit('G9');const ap=chainApprove('G9');
    const m=g('G9');
    const D=(e,s,t,k)=>{const l=calcEmployeePayroll(e,s,t,k);return Math.round((l.memoDed||0)*100)/100;};
    return {ap,payDateBy:m.payDateBy||null,payDate:m.payDate||null,said:/OFFICE, SUP: 2026-10-11 → 2026-10-25 approved → 2026-10-26/.test(conf),
      w1:D(E[0],'2026-10-15','2026-10-21','weekly'),o1own:D(E[1],'2026-10-11','2026-10-25','semi_monthly'),o1next:D(E[1],'2026-10-26','2026-11-10','semi_monthly')};}),
  expect:{ap:[true,true],payDateBy:{O1:'2026-10-26'},payDate:null,said:true,w1:100,o1own:0,o1next:100} },

{ name:'Final pay already recorded (review): LEAVER (Resigned, last day 16 Oct) has an HR −₱400 dated 12 Oct waiting ①; the final pay 8–16 Oct is recorded; Jinky ① and Dr Amy ② → payroll 8–14 and 15–21 Oct deduct ₱0 (the final pay holds those days) and the FINAL confirm and the approval log both say final pay was already recorded for LEAVER, ROY (v23.10)',
  requires:REQ,
  run:R(async()=>{
    memoUsers();
    const E=[labour('R1','LEAVER, ROY',{ghAssigned:['GH3'],status:'Resigned',lastWorkingDay:'2026-10-16'})];setE(E);loadEmployees();
    const a={};['2026-10-08','2026-10-09','2026-10-10','2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16'].forEach(d=>{a[d]={R1:rec('present','07:00','17:00')};});setA(a);
    window.alert=()=>{};window.prompt=()=>'ok';let conf='';window.confirm=t=>{conf+=String(t)+'\n';return true;};
    seedMemo({id:'HL',category:'hr',type:'bad',empId:'R1',date:'2026-10-12',title:'unreturned tools',totalAmount:-400,impact:[{empId:'R1',empName:'LEAVER, ROY',role:'HR Memo',amount:-400}]},'mea');
    actAs('mea');hnxMemoSubmit('HL');actAsTester();
    hnxFinalPayAddSettlement({empId:'R1',name:'LEAVER, ROY',from:'2026-10-08',to:'2026-10-16',net:1234,at:Date.now(),by:'tester'});
    const ap=chainApprove('HL');
    const D=(s,t)=>{const l=calcEmployeePayroll(E[0],s,t,'weekly');return Math.round((l.memoDed||0)*100)/100;};
    const last=(g('HL').approvalLog||[]).slice(-1)[0]||{};
    return {ap,said:/Final pay is already RECORDED for LEAVER, ROY on 2026-10-12/.test(conf),log:/final pay already recorded for LEAVER, ROY/.test(last.reason||''),wk:[D('2026-10-08','2026-10-14'),D('2026-10-15','2026-10-21')]};}),
  expect:{ap:[true,true],said:true,log:true,wk:[0,0]} },

{ name:'Jinky reaches her ① list without HR edit rights (review): as the accountant (role accounting, can(manageHR) false) switchView("memos") lands on Memos with "① Waiting for Jinky (accountant) — 1" and its ✔ button; a user outside the approval order with the same role is still refused (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    const U=memoUsers();U.push({username:'ops1',fullname:'Ops Person',passwordHash:'x',role:'accounting',active:true});localStorage.setItem('hydroPro_users',JSON.stringify(U));
    seedMemo({id:'Q9',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad Q9'},'mea');
    actAs('mea');hnxMemoSubmit('Q9');
    actAs('jinky');try{switchView('dashboard');}catch(e){}await sleep(600);
    const can0=can('manageHR');
    try{switchView('memos');}catch(e){}await sleep(2500);
    const v=document.getElementById('view-memos');const on=!!v&&v.classList.contains('active');
    const qb=v?v.querySelector('#hnxMemoQueues [data-q="acct"]'):null;const q=qb?qb.textContent:'';
    const btn=!!(qb&&qb.querySelector('[data-act="acct"]'));
    actAs('ops1');try{switchView('hydro_brain');}catch(e){}await sleep(1200);
    const opsPre=document.getElementById('view-memos').classList.contains('active');
    try{switchView('memos');}catch(e){}await sleep(1500);
    const ops=document.getElementById('view-memos').classList.contains('active');
    actAsTester();
    return {can0,on,q1:/① Waiting for Jinky \(accountant\) — 1/.test(q),btn,opsPre,ops};}),
  expect:{can0:false,on:true,q1:true,btn:true,opsPre:false,ops:false} },

{ name:'Screens show payroll\'s sign (review): an HR memo on BAD typed +₱300 for CRUZ, ① ② → payroll memoDed ₱300 for it (CRUZ ₱400 with the GH3 −₱100) and the memo view\'s Financial Impact reads −₱300 and Total −₱300 (no +₱300); the 201 row of TORZAR\'s −₱500 left on GOOD (archived before v23.10 as GOOD) reads BAD −₱500; the GH Analytics month drill lists 3 memos, each with its pesos; the payroll ⏳ Memo header says "not yet final-approved" (v23.10)',
  requires:REQ,
  run:R(async()=>{
    const E=fx();
    seedMemo({id:'D1',category:'hr',type:'bad',empId:'W2',date:'2026-10-12',title:'HR bad typed +300',totalAmount:300,impact:[{empId:'W2',empName:'CRUZ, JUAN',role:'HR Memo',amount:300}]},'mea');
    seedMemo({id:'L1',category:'hr',type:'good',empId:'W1',date:'2026-10-10',title:'HR −500 on GOOD',totalAmount:-500,impact:[{empId:'W1',empName:'TORZAR, EDERLYN',role:'HR Memo',amount:-500}]},'mea');
    seedMemo({id:'GB',category:'production',type:'bad',gh:'GH3',date:'2026-10-12',title:'GH3 bad'},'mea');
    actAs('mea');['D1','L1','GB'].forEach(id=>hnxMemoSubmit(id));actAsTester();
    ['D1','L1','GB'].forEach(id=>chainApprove(id));
    const a201=load201Memos();a201.W1=[{id:'L1',type:'good',amount:0,reason:'',date:'2026-10-10',addedAt:1}];save201Memos(a201);
    _openFull201ForEmployee('W1');await sleep(2500);
    const det=[...document.querySelectorAll('details.hr201-section')].find(d=>/Memos Archived/.test(d.textContent));
    const row=det?([...det.querySelectorAll('tr')].map(t=>t.textContent.replace(/\s+/g,' ')).find(t=>/10\/2026|2026/.test(t)&&/₱|—/.test(t))||''):'';
    openMemoView('D1');await sleep(400);
    const lab=[...document.querySelectorAll('#memoViewBody .memo-form-label')].find(x=>/Financial Impact/.test(x.textContent));const fi=lab?lab.parentNode.textContent:'';
    document.getElementById('memoViewModal').classList.remove('open');
    _hnxGHA.gh('ALL');_hnxGHA.from('2026-10-01');_hnxGHA.to('2026-10-31');_hnxGHA.tab('memo');_hnxGHA.mo('2026-10');await sleep(300);
    const host=document.getElementById('ghAnaBody');
    const rows=host?[...host.querySelectorAll('div')].filter(d=>/^(➖|➕|⚠) \d{4}-\d{2}-\d{2} · /.test(d.textContent)&&!d.querySelector('div')):[];
    return {payW2:pay(E[1])[0],fi:{minus:/−₱300/.test(fi),plus:/\+₱300/.test(fi),total:/Total\s*−₱300/.test(fi)},row201:{bad:/BAD/.test(row),good:/GOOD/.test(row),amt:/−₱500/.test(row)},
      drill:[rows.length,rows.filter(d=>/₱/.test(d.textContent)).length],th:/not yet final-approved/.test(HNX_PEND_TH)};}),
  expect:{payW2:400,fi:{minus:true,plus:false,total:true},row201:{bad:true,good:false,amt:true},drill:[3,3],th:true} }
];
