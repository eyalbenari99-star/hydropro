/* v22.12: the after-login freeze — “is this call closed?” re-parsed the whole 2.3 MB maintenance store for every call */
module.exports=[
{ name:'⚡ Calls v22.12: 3,500 calls linked to a 2.3 MB maintenance store — counting open calls + reading assignees takes < 400 ms (was 3,500 full parses, 20–60 s on office PCs); a task closed through saveMaintTasks shows its call closed at once, and a store replaced by cloud sync is seen within 2 s (v22.12)',
  seed:function(){
    var tasks=[],calls=[],pad=new Array(640).join('x');
    for(var i=0;i<3500;i++){ tasks.push({id:'mt'+i,title:'Task '+i,status:(i%5===0?'done':'started'),assignees:['tech'+(i%7)],notes:pad});
      calls.push({id:'c'+i,subject:'Call '+i,description:'d',priority:'normal',group:'operations',department:'maintenance',area:'GH1',equipment:'Fan',subsystem:'Fans',sourceModule:'maintenance',raisedBy:'tester',raisedAt:Date.now()-i*60000,attachments:[],status:'new_call',acceptedBy:'',acceptedAt:null,updates:[],closedAt:null,closedBy:'',closeNote:'',recommendation:'',maintTaskId:'mt'+i}); }
    localStorage.setItem('hydroPro_maint_tasks',JSON.stringify(tasks));
    localStorage.setItem('hydroPro_calls',JSON.stringify(calls));
  },
  run:async()=>{await sleep(2500);
    const sizeK=Math.round((localStorage.getItem('hydroPro_maint_tasks')||'').length/1024);
    const all=loadCalls();window.__hnxMaintIndexDrop&&window.__hnxMaintIndexDrop();
    const t0=performance.now();
    let open=0,people=0;for(let r=0;r<3;r++){const S=window.__hnxCallStatus;open=all.filter(c=>!S.closed(c)).length;people=0;all.forEach(c=>{people+=S.assignees(c).length;});}
    const ms=Math.round(performance.now()-t0);
    /* close task mt1 the normal way → call c1 reads closed immediately */
    const ts=loadMaintTasks();ts.find(t=>t.id==='mt1').status='done';saveMaintTasks(ts);
    const c1=all.find(c=>c.id==='c1');const closedNow=window.__hnxCallStatus.closed(c1);
    /* cloud sync replaces the whole store (no saveMaintTasks) → seen within 2 s */
    const ts2=loadMaintTasks();ts2.find(t=>t.id==='mt2').status='done';localStorage.setItem('hydroPro_maint_tasks',JSON.stringify(ts2));
    await sleep(1700);const c2=all.find(c=>c.id==='c2');const closedAfterSync=window.__hnxCallStatus.closed(c2);
    return {bigStore:sizeK>=2200,open,people,fast:ms<400,closedNow,closedAfterSync,ms};},
  expect:{bigStore:true,open:2800,people:3500,fast:true,closedNow:true,closedAfterSync:true} }
];
