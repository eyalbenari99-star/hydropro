/* v22.03: a stall the page survives is reported on screen */
module.exports=[
{ name:'🧯 Stall v22.03: blocking the screen thread for 9 s right after a mark shows the red stall box naming that operation and files a 🧯 Stall inbox item for eyal (v22.03)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'meajean',fullname:'Mea',passwordHash:'x',role:'supervisor',active:true}]));sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'meajean',loginAt:Date.now()}));},
  run:async()=>{await sleep(4000);window.__hnxBB.mark('test.block','hydroPro_demo');const t=Date.now();while(Date.now()-t<9200){}for(let i=0;i<20;i++){if(window.__hnxBB.stalls.length)break;await sleep(500);}
    const box=document.getElementById('hnxStallBox');const ib=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='freeze'&&/Stall/.test(x.title));
    return {box:!!box&&/test\.block/.test(box.textContent)&&/hydroPro_demo/.test(box.textContent),stall:window.__hnxBB.stalls.length>=1&&window.__hnxBB.stalls[0].op==='test.block',inbox:ib.some(x=>x.user==='eyal'&&/test\.block/.test(x.body))};},
  expect:{box:true,stall:true,inbox:true} }
];
