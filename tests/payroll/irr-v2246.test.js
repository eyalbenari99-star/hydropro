/* v22.46 (Eyal, 10 Oct 2026, screenshot of v22.44's Pool 1 card): "so much empty space which i dont want also so much non images 3d
   with motion as requested should be each one please do and reorganize". Every box of a pool card has its OWN moving 3-D picture —
   the hand EC / pH meters (a pen meter in a sample of pool water), the finish time (a clock), checked by (a clipboard), the source,
   ① water, ② A, ③ B, ④ C (Nexi's drawing split into the boxes it describes, so it is not drawn twice) — no box is taller than what it
   holds, and before this round's level the water / A / B / C pictures show the last reading's dose, dimmed with ≈. */
const NEW="typeof window.hnxIrrCellViz==='function'&&String(window.hnxIrrCellViz('hand',{k:'EC'})).indexOf('Hand EC meter')>=0";
const H=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  const host=()=>document.getElementById('stubIrrNutrientsBody');
  const card=id=>[...host().querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));
  const rec=id=>{try{delete window._perfCache._irrPool;}catch(e){}return ((loadIrrPool()[_irrDate]||{})[id]||{})['08:00']||{};};
  const put=(id,o)=>Object.keys(o).forEach(k=>irrSavePool(id,k,o[k]));
  const pic=el=>el?el.querySelector('.irr-cv'):null;
  const shown=e=>!!e&&e.offsetParent!==null&&e.getBoundingClientRect().width>8&&e.getBoundingClientRect().height>8;
  const lab=e=>e?(e.getAttribute('aria-label')||''):'';
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
const TEXT120=new Function(`localStorage.setItem('hydroPro_ui_textscale','1.2');`);
const FULL=`put('P02',{water:'32',EC:'1.62',manualEC:'1.60',pH:'6.3',manualPH:'6.28',waterTemp:'24.5',airPump:'working',ozoneSec:'55',finishTime:'10:45',checkedBy:'Reven'});`;
module.exports=[
{ name:'🖼 Every box of a card has its own 3-D picture (Eyal 10 Oct: "should be each one"): Pool 2 at 32 cm, EC 1.62 / hand 1.60, pH 6.3 / hand 6.28, 24.5 °C, air OK, ozone 55 s, finished 10:45, checked by Reven → finish time = a clock "Finished at 10:45", hand EC = a pen meter "Hand EC meter 1.60", hand pH "6.28", temperature, air, ozone, source, ① water "+566 L", ② A and ③ B "2.8 L = 3 jugs", ④ C "153 cc", checked by = a clipboard "Checked by Reven" — every one shown, in 3-D gradients; the EC, pH and tank gauges too',
  requires:NEW, viewport:{width:1512,height:982}, seed:TEXT120,
  run:fn(FULL+`await sleep(400);renderIrrPoolMonitor();await sleep(700);
    const c=card('P02'),td=i=>c.children[i-1];
    const boxes=[2,4,6,8,9,10,11,12,13,14,15,16];
    const missing=boxes.filter(i=>!shown(pic(td(i))));
    const flat=boxes.filter(i=>!/url\\(#cv/.test((pic(td(i))||{}).innerHTML||''));
    const gauges=[3,5,7].filter(i=>!shown(td(i).querySelector('.irr-viz,.iv-water,[data-ivkey]')));
    return {missing,flat,gauges,clock:lab(pic(td(2))),hand:lab(pic(td(4))),handPh:lab(pic(td(6))),water:/add 566 L/.test(lab(pic(td(12)))),a:lab(pic(td(13))),b:lab(pic(td(14))),c:lab(pic(td(15))),check:lab(pic(td(16)))};`),
  expect:{missing:[],flat:[],gauges:[],clock:'Finished at 10:45',hand:'Hand EC meter 1.60',handPh:'Hand pH meter 6.28',water:true,a:'A 2.8 L = 3 jugs (the last one 0.8 L)',b:'B 2.8 L = 3 jugs (the last one 0.8 L)',c:'C 153 cc',check:'Checked by Reven'} },

{ name:'📏 No empty space (Eyal 10 Oct: "so much empty space which I don\'t want"): at 1512×982 with text 120 % Pool 2\'s card is under 45 % of the window, no box holds less than 60 % of its own height (v22.44 had the hand EC box at 42 % and the level box at 57 %), Nexi\'s drawing is not drawn twice in the card (its pictures are the ① water / ② A / ③ B / ④ C boxes; "Nexi says" and the proportion stay) and nothing scrolls sideways',
  requires:NEW, viewport:{width:1512,height:982}, seed:TEXT120,
  run:fn(FULL+`await sleep(400);renderIrrPoolMonitor();await sleep(700);
    const c=card('P02'),w=host().querySelector('.irr-pool-table-wrap');
    const loose=[...c.children].map((td,i)=>{const r=td.getBoundingClientRect();let top=1e9,bot=-1e9;[...td.children].forEach(k=>{const q=k.getBoundingClientRect();if(q.height>0){top=Math.min(top,q.top);bot=Math.max(bot,q.bottom);}});
      const lbl=getComputedStyle(td,'::before').content;const used=(bot-top)+(lbl&&lbl!=='none'&&lbl!=='normal'?14:0);return {i:i+1,f:r.height>0?used/r.height:1};}).filter(x=>x.f<0.6).map(x=>x.i+':'+x.f.toFixed(2));
    const rx=c.querySelector('.irr-pc-rx');const steps=[...rx.querySelectorAll('.irr-rx-step')];
    return {third:c.getBoundingClientRect().height<=innerHeight*0.45,loose,stepsHidden:steps.length>0&&steps.every(s=>s.offsetParent===null),says:shown(rx.querySelector('.irr-nexi-says')),ratio:shown(rx.querySelector('.irr-rx-ratio')),extra:Math.max(0,w.scrollWidth-w.clientWidth)};`),
  expect:{third:true,loose:[],stepsHidden:true,says:true,ratio:true,extra:0} },

{ name:'≈ Before this round\'s level the pictures show the LAST reading\'s dose (as the greyed ≈ boxes): Pool 1 read yesterday 16:00 at 57 cm, EC 1.676, pH 6.2 → this morning, nothing typed yet, the water picture is dimmed "57 cm at the last reading, fill to 60 cm, add ≈61 L", A and B "≈0.3 L = 1 jug", C "≈15 cc — from the last reading"; nothing is saved from it',
  requires:NEW,
  run:fn(`const T=_irrDate;const d=new Date(T+'T12:00:00');d.setDate(d.getDate()-1);const Y=d.toISOString().slice(0,10);
    _irrDate=Y;window.irrSetPoolTime('16:00');put('P01',{water:'57',EC:'1.676',pH:'6.2'});_irrDate=T;window.irrSetPoolTime('08:00');
    await sleep(2300);renderIrrPoolMonitor();await sleep(700);
    const c=card('P01'),td=i=>c.children[i-1];
    const W=pic(td(12)),A=pic(td(13)),C=pic(td(15)),r=rec('P01');
    return {water:lab(W),wPrev:!!W&&W.classList.contains('prev'),a:lab(A),aPrev:!!A&&A.classList.contains('prev'),c:lab(C),saved:[r.water||'',r.A||'',r.waterAdded||'']};`),
  expect:{water:'Water: 57 cm at the last reading, fill to 60 cm, add ≈61 L',wPrev:true,a:'A ≈0.3 L = 1 jug (the last one 0.3 L) — from the last reading',aPrev:true,c:'C ≈15 cc — from the last reading',saved:['','','']} },

{ name:'∅ With no reading at all no box is blank: Pool 5 untouched → an empty glass tank with its target line, an empty A jug, an empty C beaker, the pen meters "not read", the clock "Finish time not entered", the clipboard "Not checked yet"',
  requires:NEW,
  run:fn(`renderIrrPoolMonitor();await sleep(600);const c=card('P05'),td=i=>c.children[i-1];
    return {water:/^Water: no level yet, fill to \\d+ cm$/.test(lab(pic(td(12)))),a:lab(pic(td(13))),c:lab(pic(td(15))),hand:lab(pic(td(4))),clock:lab(pic(td(2))),check:lab(pic(td(16)))};`),
  expect:{water:true,a:'A: nothing to add yet (each jug = 1 L)',c:'C: nothing to add yet',hand:'Hand EC meter not read',clock:'Finish time not entered',check:'Not checked yet'} },

{ name:'🔢 The A / B pictures number up to 15 litres in rows of five (they folded into "× n" above 5): A 12 L → jugs 1 … 12 on 3 rows; 2.75 L → 1, 2, 0.75 on one row; 16 L → one jug "× 16"',
  requires:NEW,
  run:fn(`const t=h=>{const d=document.createElement('div');d.innerHTML=h;return d;};
    const a12=t(hnxIrrCellViz('A',{l:12})),a275=t(hnxIrrCellViz('A',{l:2.75})),a16=t(hnxIrrCellViz('A',{l:16}));
    const nums=d=>[...d.querySelectorAll('text.cv-num')].map(x=>x.textContent);
    const rows=d=>new Set([...d.querySelectorAll('text.cv-num')].map(x=>x.getAttribute('y'))).size;
    return {n12:nums(a12).join(','),rows12:rows(a12),n275:nums(a275).join(','),rows275:rows(a275),fold16:/× 16/.test(a16.textContent)};`),
  expect:{n12:'1,2,3,4,5,6,7,8,9,10,11,12',rows12:3,n275:'1,2,0.75',rows275:1,fold16:true} },

{ name:'🎞 The new pictures move with 🎞 Motion: "always" → the pen meter bobs (cvDip), the clock\'s second hand runs (cvSpin), the clipboard\'s tick draws itself (cvDraw); "off" → all still',
  requires:NEW,
  run:fn(FULL+`await sleep(400);hnxIrrViz.setMotion('always');renderIrrPoolMonitor();await sleep(500);
    const c=card('P02'),td=i=>c.children[i-1];try{c.scrollIntoView({block:'center'});}catch(e){}await sleep(400);
    const an=(i,sel)=>{const e=td(i).querySelector('.irr-cv '+sel);return e?getComputedStyle(e).animationName:'none';};
    const on={dip:an(4,'.cv-dip'),spin:an(2,'.cv-spin'),draw:an(16,'.cv-draw')};
    hnxIrrViz.setMotion('off');await sleep(300);const off={dip:an(4,'.cv-dip'),spin:an(2,'.cv-spin'),draw:an(16,'.cv-draw')};
    hnxIrrViz.setMotion('always');return {on,off};`),
  expect:{on:{dip:'cvDip',spin:'cvSpin',draw:'cvDraw'},off:{dip:'none',spin:'none',draw:'none'}} },

{ name:'☰ The wide table keeps Nexi\'s full drawing under Pool 2\'s row — its 4 pictures (tank, A, B, C) shown — and the hand EC cell has its pen meter there too',
  requires:NEW,
  run:fn(FULL+`await sleep(400);hnxIrrLayout('table');await sleep(600);
    const row=card('P02');const nx=row.nextElementSibling;const steps=nx?[...nx.querySelectorAll('.irr-rx-step')]:[];
    const t={steps:steps.length,shown:steps.every(s=>s.offsetParent!==null),handPic:shown(pic(row.children[3]))};
    hnxIrrLayout('cards');await sleep(500);return t;`),
  expect:{steps:4,shown:true,handPic:true} },

{ name:'📱 On a 390 px phone every card holds: the hand EC box (pen meter beside it) is at least 56 px wide, every tile inside its card, 0 px sideways scroll',
  requires:NEW, viewport:{width:390,height:844},
  run:fn(FULL+`await sleep(400);renderIrrPoolMonitor();await sleep(700);
    const c=card('P02'),w=host().querySelector('.irr-pool-table-wrap');const inp=c.children[3].querySelector('input');
    const inside=(a,b)=>{const r=a.getBoundingClientRect(),q=b.getBoundingClientRect();return r.left>=q.left-1&&r.right<=q.right+1;};
    return {wide:inp.getBoundingClientRect().width>=56,tiles:[...c.children].every(td=>inside(td,c)),extra:Math.max(0,w.scrollWidth-w.clientWidth),page:Math.max(0,document.documentElement.scrollWidth-innerWidth)<=1};`),
  expect:{wide:true,tiles:true,extra:0,page:true} }
];
