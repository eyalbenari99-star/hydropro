/* v21.88: critical alert seen-list no longer forgets old items past 500 */
module.exports=[
{ name:'🔕 Alerts: 700 live calls/tasks marked seen are all kept (old 500-cap made the oldest 200 re-fire as CRITICAL); a deleted item’s id is dropped (v21.88)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:new Function(`return (async()=>{await sleep(6000);const ids=[];for(let i=0;i<700;i++)ids.push('task:T'+i);
    const live=new Set(ids.slice(0,699));__hnxCritSeen.save(new Set(ids),live);const back=__hnxCritSeen.load();
    return {kept:back.size,first:back.has('task:T0'),gone:!back.has('task:T699')};})()`),
  expect:{kept:699,first:true,gone:true} }
];
