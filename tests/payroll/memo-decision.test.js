/* v21.62: the memo Decision dropdown — Approve / Reject with a note (Eyal, Dr Amy, Admin). */
module.exports=[
{ name:'✖ Reject a memo: GH3 BAD memo (8 workers × ₱200 + 2 supervisors × ₱100 = −₱1,800) FINAL-approved counts ₱1,800 in payroll; the Decision dropdown appears in the view modal for the admin; ✖ Reject with note "Wrong GH" → status REJECTED, note stamped, payroll memoDed = ₱0, list filter has Rejected, re-open returns it to pending (v21.62)',
  run:async()=>{
    localStorage.setItem('hydroPro_memo_rates_v1',JSON.stringify({teamLeader:150,worker:200,supervisor:100}));
    const E=[];for(let i=1;i<=8;i++)E.push(labour('W'+i,'WORKER, '+i,{ghAssigned:['GH3']}));
    E.push(labour('S1','SUP, ONE',{ghAssigned:[],supervisorGHs:'all',tier:'supervisor'}));E.push(labour('S2','SUP, TWO',{ghAssigned:['GH1'],supervisorGHs:'all',tier:'supervisor'}));
    setE(E);loadEmployees();
    const a={};['2026-09-10','2026-09-11','2026-09-12','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={};E.forEach(e=>{a[d][e.id]=rec('present','07:00','17:00');});});setA(a);
    const m={id:'M1',category:'production',type:'bad',gh:'GH3',date:'2026-09-15',status:'pending',title:'GH3 bad',reasons:[],signatures:{supervisor:null,hrManager:null},createdAt:new Date().toISOString(),createdBy:'tester'};
    localStorage.setItem('hydroPro_memos',JSON.stringify([m]));loadMemos();
    window.confirm=()=>true;window.alert=()=>{};
    hnxMemoApproveDo('M1','final');
    const payroll=()=>Math.round(E.reduce((s,e)=>s+(calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly').memoDed||0),0));
    const paidBefore=payroll();
    openMemoView('M1');await sleep(2500);
    const sel=document.getElementById('hnxMemoDecide');const hasSel=!!sel;const opts=sel?[...sel.options].map(o=>o.value).join(','):'';
    window.prompt=()=>'Wrong GH';
    hnxMemoDecide('M1','reject');await sleep(300);
    const st=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    const paidAfter=payroll();
    await sleep(1600);const txt=document.getElementById('memoViewBody').innerText;
    const rejShown=/REJECTED/.test(txt)&&/Wrong GH/.test(txt);
    const filt=/value="rejected"/.test(document.getElementById('view-memos')?document.getElementById('view-memos').innerHTML:'');
    memoReopen('M1');const st2=JSON.parse(localStorage.getItem('hydroPro_memos'))[0];
    return {paidBefore,hasSel,opts,status:st.status,note:st.rejection&&st.rejection.note,by:st.rejection&&st.rejection.by,paidAfter,rejShown,reopened:st2.status,trail:!!(st2.reopens&&st2.reopens[0].prior.rejection)};},
  expect:{paidBefore:1800,hasSel:true,opts:',reject',status:'rejected',note:'Wrong GH',by:'tester',paidAfter:0,rejShown:true,reopened:'pending',trail:true} }
];
