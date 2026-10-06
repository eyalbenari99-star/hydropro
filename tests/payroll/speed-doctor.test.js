/* v21.95: speed doctor + coalesced rail sweep */
module.exports=[
{ name:'🩺 Speed v21.95: 40 body mutations in 1 s trigger at most 6 rail sweeps (was 120); hnxSpeedReport() files one 🩺 inbox item each for eyal and admin, once per day (v21.95)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'meajean',fullname:'Mea',passwordHash:'x',role:'admin',active:true},{username:'eyal',fullname:'Eyal',passwordHash:'x',role:'admin',active:true}]));},
  run:new Function(`return (async()=>{await sleep(6000);let n=0;const G=window.hnxRailGuard;
    const st=window.getComputedStyle;window.getComputedStyle=function(e){if(e&&e.id==='hnxRail')n++;return st.apply(this,arguments);};
    await sleep(3000);n=0;for(let i=0;i<40;i++){const d=document.createElement('div');document.body.appendChild(d);await sleep(25);d.remove();}
    await sleep(1500);window.getComputedStyle=st;
    await window.hnxSpeedReport(true);await window.hnxSpeedReport();const ib=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]').filter(x=>x.itemId==='speed');
    return {few:n<=8,ok:typeof G==='function',items:ib.length>=1&&ib.length<=3};})()`),
  expect:{few:true,ok:true,items:true} }
];
