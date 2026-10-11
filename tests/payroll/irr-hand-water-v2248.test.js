/* v22.48 (Eyal, 11 Oct 2026, screenshots of v22.46's pool cards):
   - "the hand meters should be with scala like up with the image of hand meter" — beside the pen meter a scale like the EC / pH
     meter above it (EC 0–5, pH 0–8), the pool's OK band in green, the hand reading as a pointer and the controller's reading as a
     white tick, so a drift between the two meters shows at a glance;
   - "in the water also add how many cm to add and to what max" — the ① water picture writes "+28 cm" on the water that rises and
     "max 60" on the target line ("≈+3 cm" from the last reading, "at max ✓" when the pool is already full). */
const NEW="typeof window.hnxIrrCellViz==='function'&&String(window.hnxIrrCellViz('hand',{k:'EC'})).indexOf('cv-scale')>=0";
const H=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  const host=()=>document.getElementById('stubIrrNutrientsBody');
  const card=id=>[...host().querySelectorAll('.irr-pool-table tbody > tr')].find(tr=>tr.querySelector('[onchange*="irrSavePool(\\''+id+'\\'"]'));
  const put=(id,o)=>Object.keys(o).forEach(k=>irrSavePool(id,k,o[k]));
  const pic=el=>el?el.querySelector('.irr-cv'):null;
  const lab=e=>e?(e.getAttribute('aria-label')||''):'';
  const txt=(e,sel)=>e?[...e.querySelectorAll(sel)].map(t=>t.textContent):[];
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
module.exports=[
{ name:'📏 Hand meters have a scale (Eyal 11 Oct): Pool 2, EC 1.62 / hand 1.60, pH 6.3 / hand 6.28 → hand EC scale 0 1 2 3 4 5 with the OK band 1.7–1.9 green, the pointer at 1.60 (y 28.8 of 3…41) and the white controller tick at 1.62 (y 28.7); hand pH scale 0 2 4 6 8, band 5.8–6.5, pointer at 6.28 (y 11.2); a pool not read has the scale and band but no pointer; "1.60" fits its box whole at the 1512 laptop',
  requires:NEW, viewport:{width:1512,height:982},
  run:fn(`put('P02',{water:'32',EC:'1.62',manualEC:'1.60',pH:'6.3',manualPH:'6.28'});await sleep(400);renderIrrPoolMonitor();await sleep(700);
    const c=card('P02'),E=pic(c.children[3]),P=pic(c.children[5]),n5=pic(card('P05').children[3]);
    const tip=e=>{const p=e&&e.querySelector('path.cv-hand');const m=p&&/L23\\.6 ([\\d.]+)/.exec(p.getAttribute('d'));return m?+m[1]:null;};
    const meter=e=>{const l=e&&e.querySelector('line.cv-meter');return l?+l.getAttribute('y1'):null;};
    const band=e=>{const b=e&&e.querySelector('rect.cv-okband');return b?[+b.getAttribute('y'),+(+b.getAttribute('y')+ +b.getAttribute('height')).toFixed(1)]:null;};
    const yv=(x,top)=>+(41-38*x/top).toFixed(1);
    const inp=c.children[3].querySelector('input.irr-pool-input');
    return {ecTicks:txt(E,'text.cv-tick'),phTicks:txt(P,'text.cv-tick'),
      ecBand:band(E),ecBandWant:[yv(1.9,5),yv(1.7,5)],phBand:band(P),phBandWant:[yv(6.5,8),yv(5.8,8)],
      ecTip:tip(E),ecMeter:meter(E),phTip:tip(P),phMeter:meter(P),
      notRead:[txt(n5,'text.cv-tick').length,!!(n5&&n5.querySelector('rect.cv-okband')),tip(n5)],
      label:lab(E),fits:!!inp&&inp.value==='1.60'&&inp.scrollWidth<=inp.clientWidth+1};`),
  expect:{ecTicks:['0','1','2','3','4','5'],phTicks:['0','2','4','6','8'],ecBand:[26.6,28.1],ecBandWant:[26.6,28.1],phBand:[10.1,13.5],phBandWant:[10.1,13.4],
    ecTip:28.8,ecMeter:28.7,phTip:11.2,phMeter:11.1,notRead:[6,true,null],label:'Hand EC meter 1.60',fits:true} },

{ name:'💧 ① Water says how many cm and to what max (Eyal 11 Oct): Pool 2 at 32 cm, target 60 → "+28 cm" on the rising water and "max 60" on the target line (label still "+566 L"); Pool 1 read yesterday at 57 cm, nothing today → "≈+3 cm" dimmed; Pool 4 at 62 cm → "at max ✓", no "+"; Pool 5 untouched → no cm text, "max 60" only',
  requires:NEW,
  run:fn(`const T=_irrDate;const d=new Date(T+'T12:00:00');d.setDate(d.getDate()-1);const Y=d.toISOString().slice(0,10);
    _irrDate=Y;window.irrSetPoolTime('16:00');put('P01',{water:'57',EC:'1.676',pH:'6.2'});_irrDate=T;window.irrSetPoolTime('08:00');
    put('P02',{water:'32',EC:'1.62',pH:'6.3'});put('P04',{water:'62'});
    await sleep(2300);renderIrrPoolMonitor();await sleep(700);
    const W=id=>pic(card(id).children[11]);const all=e=>txt(e,'text');
    const tg=e=>{const t=all(e);const i=t.indexOf('max');return i>=0?t.slice(i,i+2).join(' '):null;};
    return {p2:txt(W('P02'),'text.cv-gap'),p2max:tg(W('P02')),p2lab:/add 566 L/.test(lab(W('P02'))),
      p1:txt(W('P01'),'text.cv-gap'),p1prev:W('P01').classList.contains('prev'),
      p4:txt(W('P04'),'text.cv-gap'),p5:txt(W('P05'),'text.cv-gap'),p5max:tg(W('P05'))};`),
  expect:{p2:['+28 cm'],p2max:'max 60',p2lab:true,p1:['≈+3 cm'],p1prev:true,p4:['at max ✓'],p5:[],p5max:'max 60'} }
];
