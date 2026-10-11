/* v22.40 (Eyal, 10 Oct 2026): "can we reorganize all to see each pool all images and motions in one screen not to move around so
   much?" — the Pool Monitor shows one card per pool (no sideways scrolling; all of a pool's pictures inside its card, the card
   shorter than the window), "☰ Table" puts the wide table back and is kept on this computer only; and "mark with number each liter
   we add … if just part like 3/4 put 0.75" — every A/B litre jug is numbered 1, 2, 3 … and a last part-jug shows its share. */
const NEW="typeof window.hnxIrrCardsOn==='function'&&typeof window.hnxIrrLayout==='function'";
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const host=()=>document.getElementById('stubIrrNutrientsBody');
  const card=id=>[...host().querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));
  const rec=id=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[_irrDate]||{})[id]||{})['08:00']||{};};
  const fill=id=>{irrSavePool(id,'water','32');irrSavePool(id,'EC','1.62');irrSavePool(id,'manualEC','1.6');irrSavePool(id,'pH','6.3');irrSavePool(id,'manualPH','6.28');
    irrSavePool(id,'waterTemp','24.5');irrSavePool(id,'airPump','working');irrSavePool(id,'ozoneSec','55');};
  const inside=(a,b)=>{const r=a.getBoundingClientRect(),c=b.getBoundingClientRect();return r.left>=c.left-1&&r.right<=c.right+1&&r.top>=c.top-1&&r.bottom<=c.bottom+1;};`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
const TEXT120=new Function(`localStorage.setItem('hydroPro_ui_textscale','1.2');`);
module.exports=[
{ name:'▦ One card per pool (Eyal 10 Oct) at a 1512×982 laptop with text 120 %: no sideways scrolling (frame 0 px wider than the screen), Pool 1 (32 cm, EC 1.62, pH 6.3, 24.5 °C, air OK, ozone 55 s) has all its pictures inside its own card — 3 gauges (EC, pH, tank — v22.46: the fill valve\'s "+566 L" is the ① water box now) + a picture in every other box (v22.46: 13 — finish clock, hand EC and pH meters, temp, air, ozone, source, water, A, B, C, checked-by clipboard and the proportion beside "Nexi says"; none hidden, Nexi\'s drawing split into the water / A / B / C boxes) — and the card is shorter than the window',
  requires:NEW, viewport:{width:1512,height:982}, seed:TEXT120,
  run:fn(`fill('P01');await sleep(400);renderIrrPoolMonitor();await sleep(600);
    const w=host().querySelector('.irr-pool-table-wrap');const c=card('P01');
    const allPics=[...c.querySelectorAll('.irr-cv')],pics=allPics.filter(p=>p.offsetParent!==null),hidden=allPics.length-pics.length,gauges=[...c.querySelectorAll('[data-ivkey]')].filter(g=>g.offsetParent!==null);const rx=c.querySelector('.irr-rx');
    return {cards:w.classList.contains('irr-pc'),extra:Math.max(0,w.scrollWidth-w.clientWidth),thead:getComputedStyle(host().querySelector('.irr-pool-table thead')).display,
      nexiRows:host().querySelectorAll('tr.irr-nexi-row').length,pics:pics.length,hidden,picsIn:pics.every(p=>inside(p,c)),gauges:gauges.map(g=>g.getAttribute('data-ivkey').split(':').pop()).sort().join(','),gaugesIn:gauges.every(g=>inside(g,c)),
      drawingIn:!!rx&&inside(rx,c),saysIn:!!c.querySelector('.irr-nexi-says'),fits:c.getBoundingClientRect().height<=innerHeight,local:localStorage.getItem('hydroPro_irr_layout_v1')===null};`),
  expect:{cards:true,extra:0,thead:'none',nexiRows:0,pics:13,hidden:0,picsIn:true,gauges:'ec,ph,tank',gaugesIn:true,drawingIn:true,saysIn:true,fits:true,local:true} },

{ name:'▦ The cards also hold on a 390 px phone: 0 px sideways scroll (frame and page), every tile of Pools 1–3 inside its card',
  requires:NEW, viewport:{width:390,height:844},
  run:fn(`fill('P01');fill('P02');await sleep(400);renderIrrPoolMonitor();await sleep(600);
    const w=host().querySelector('.irr-pool-table-wrap');const cs=[...host().querySelectorAll('.irr-pool-table tbody > tr')].slice(0,3);
    return {extra:Math.max(0,w.scrollWidth-w.clientWidth),page:Math.max(0,document.documentElement.scrollWidth-innerWidth)<=1,tiles:cs.every(c=>[...c.children].every(td=>inside(td,c)))};`),
  expect:{extra:0,page:true,tiles:true} },

{ name:'☰ "Table" puts the wide table back (header shown, Nexi\'s row under Pool 1, the frame scrolls sideways) and is kept on THIS computer only (hnxlocal_irr_layout_v1 = table, nothing synced); ▦ brings the cards back',
  requires:NEW,
  run:fn(`fill('P01');await sleep(300);
    hnxIrrLayout('table');await sleep(500);const w=host().querySelector('.irr-pool-table-wrap');
    const t={cards:w.classList.contains('irr-pc'),thead:getComputedStyle(host().querySelector('.irr-pool-table thead')).display,nexiRow:!!card('P01').nextElementSibling&&card('P01').nextElementSibling.classList.contains('irr-nexi-row'),
      scrolls:w.scrollWidth>w.clientWidth,key:localStorage.getItem('hnxlocal_irr_layout_v1'),pressed:(host().querySelector('.irr-pc-bar button.on')||{}).textContent||''};
    hnxIrrLayout('cards');await sleep(500);const w2=host().querySelector('.irr-pool-table-wrap');
    const synced=Object.keys(localStorage).filter(k=>k.indexOf('hydroPro_')===0&&/layout/i.test(k));
    return {table:t,back:w2.classList.contains('irr-pc'),key2:localStorage.getItem('hnxlocal_irr_layout_v1'),synced:synced.length};`),
  expect:{table:{cards:false,thead:'table-header-group',nexiRow:true,scrolls:true,key:'table',pressed:'☰ Table'},back:true,key2:'cards',synced:0} },

{ name:'⌨ A reading typed in a card is saved like in the table: Pool 3 EC box in its card ← 1.75, then Tab → saved EC 1.75; the water level 41 → Nexi\'s drawing for Pool 3 appears inside the same card',
  requires:NEW,
  run:fn(`const c=card('P03');const ec=c.querySelector('input[placeholder="EC"]');ec.focus();ec.value='1.75';ec.dispatchEvent(new Event('change',{bubbles:true}));ec.blur();await sleep(500);
    const lv=card('P03').querySelector('input[placeholder="cm"]');lv.value='41';lv.dispatchEvent(new Event('change',{bubbles:true}));await sleep(900);
    const c2=card('P03');return {ec:rec('P03').EC,water:rec('P03').water,drawing:!!c2.querySelector('.irr-rx[data-rxpool="P03"]')};`),
  expect:{ec:'1.75',water:'41',drawing:true} },

{ name:'🔢 Each litre numbered (Eyal 10 Oct): Pool 1 at 32 cm → 28 cm to add → A 2.8 L and B 2.8 L: jugs numbered 1, 2 and the last part-jug 0.8 (A and B each); the A cell picture says 1, 2, 0.8 too',
  requires:NEW,
  run:fn(`irrSavePool('P01','water','32');irrSavePool('P01','EC','1.7');await sleep(400);renderIrrPoolMonitor();await sleep(500);
    const rx=document.querySelector('.irr-rx[data-rxpool="P01"]');const st=rx?[...rx.querySelectorAll('.irr-rx-step')]:[];
    const nums=i=>st[i]?[...st[i].querySelectorAll('.irr-rx-jug i')].map(x=>x.textContent):[];
    const cv=[...card('P01').querySelectorAll('.irr-cv')].find(e=>/^A /.test(e.getAttribute('aria-label')||''));
    return {A:rec('P01').A,a:nums(1),b:nums(2),cell:cv?[...cv.querySelectorAll('text')].map(t=>t.textContent):[],last:st[1]?(st[1].querySelector('.irr-rx-jug:last-child')||{}).title:''};`),
  expect:{A:2.8,a:['1','2','0.8'],b:['1','2','0.8'],cell:['1','2','0.8'],last:'Last jug: 0.8 L = 800 ml'} },

{ name:'🔢 Nine litres are nine numbered jugs (they used to fold into one jug "× 9" above 8): Pool 9 (2 L per 10 cm) at 5 cm → 45 cm to add → A 9 L → jugs 1 … 9',
  requires:NEW,
  run:fn(`irrSavePool('P09','water','5');irrSavePool('P09','EC','1.7');await sleep(400);renderIrrPoolMonitor();await sleep(500);
    const rx=document.querySelector('.irr-rx[data-rxpool="P09"]');const st=rx?[...rx.querySelectorAll('.irr-rx-step')]:[];
    return {A:rec('P09').A,a:st[1]?[...st[1].querySelectorAll('.irr-rx-jug i')].map(x=>x.textContent).join(','):'',fold:!!(st[1]&&st[1].querySelector('.irr-rx-n'))};`),
  expect:{A:9,a:'1,2,3,4,5,6,7,8,9',fold:false} }
];
