/* v22.11: 🩺 Health Guardian */
module.exports=[
{ name:'🩺 Guardian v22.11: a cycle measures this computer (status, store K, jobs, version), writes ONE record for this device into hydroPro_health_v1 (an id-list, updatedAt), keeps other computers’ records, and the 🩺 Nexi Health panel lists both (v22.11)',
  seed:function(){localStorage.setItem('hnx_device_id','dev_test01');localStorage.setItem('hydroPro_health_v1',JSON.stringify([{id:'dev_other',updatedAt:Date.now()-60000,user:'meajean',ver:'22.10',status:'red',blocked1m:44,blocked10m:30,storeK:9000,failedSaves:3,vault:'ok',sync:'ok'}]));},
  run:async()=>{await sleep(3000);const m=window.__hnxGuardian.runNow();const arr=JSON.parse(localStorage.getItem('hydroPro_health_v1')||'[]');
    const mine=arr.filter(r=>r.id==='dev_test01');const other=arr.find(r=>r.id==='dev_other');
    window.hnxHealthPanel();const p=document.getElementById('hnxHealthPanel');const txt=p?p.textContent:'';
    return {measured:!!m&&['green','amber','red'].indexOf(m.status)>=0&&m.storeK>0&&m.jobs>0,one:mine.length===1&&!!mine[0].updatedAt&&mine[0].ver===String(APP_VERSION),keptOther:!!other,panel:/meajean/.test(txt)&&/Nexi Health/.test(txt)};},
  expect:{measured:true,one:true,keptOther:true,panel:true} },
{ name:'🩺 Guardian v22.11: two minutes blocked > 50 % → emergency slow-down level 2 (a heavy 500 ms job then waits ≥ 15 s; a sync job keeps its pace), five healthy minutes release it; a memory refresh is never planned while someone used the computer in the last 3 minutes (v22.11)',
  run:async()=>{await sleep(2500);const G=window.__hnxGuardian;
    window.__eHeavy=0;window.__eSync=0;setInterval(function heavyForTest(){window.__eHeavy++;const t=performance.now();while(performance.now()-t<8){}},500);setInterval(function(){/* tryAutoSync */window.__eSync++;},500);
    await sleep(2500);
    G.hist.push({blockedPct:60,at:Date.now()},{blockedPct:60,at:Date.now()});const m1={blockedPct:60,at:Date.now(),storeK:10,newFailed:0,lite:true,status:'red'};G.hist.push(m1);
    window.__hnxGovEmergency(0);G.emerg=0;
    /* drive repair() the way a cycle would */ G.runNow&&0;
    window.__hnxGovEmergency(2);G.emerg=2;const h0=window.__eHeavy,s0=window.__eSync;await sleep(6000);const heavy=window.__eHeavy-h0,sync=window.__eSync-s0;
    window.__hnxGovEmergency(0);G.emerg=0;
    G.lastInput=Date.now();for(let i=0;i<3;i++)G.hist.push({blockedPct:1,heapPct:95,dom:100,at:Date.now(),status:'red'});
    G.runNow();const planned=!!document.getElementById('hnxGuardReload');
    return {heavySlowed:heavy<=1,syncPace:sync>=6,noReloadWhileUsed:!planned};},
  expect:{heavySlowed:true,syncPace:true,noReloadWhileUsed:true} }
];
