/* v22.40 (Eyal, 10 Oct 2026: "also i need report each base line chcked each time insert the datat organized per active pool 1-10 plus
   prj 11 for now"): 📒 Readings report — every Pool Monitor round somebody filled in, one row per day and round (newest first), one
   section per active pool (default Pool 1 … Pool 10, PRJ11-A, PRJ11-B; one synced list an admin can change). A due round with nothing
   typed shows "— not entered —", future rounds never show, the colours are the Pool Monitor's own, ⚡ = worked out by Nexi, a CSV with
   a Pool column, and the report never writes a reading. The page clock is Sat 10 Oct 2026 10:00 Manila: today only the 08:00 round is due. */
const NEW="typeof window.renderIrrReadingsReport==='function'&&!!window.hnxIrrReadings&&typeof window.hnxIrrReadingsCsv==='function'";
const CLOCK=`const RD=Date;const off=RD.parse('2026-10-10T02:00:00Z')-RD.now();
  function FD(){const a=[].slice.call(arguments);if(!(this instanceof FD))return new RD(RD.now()+off).toString();return a.length?new (Function.prototype.bind.apply(RD,[null].concat(a)))():new RD(RD.now()+off);}
  FD.prototype=RD.prototype;FD.now=function(){return RD.now()+off;};FD.UTC=RD.UTC;FD.parse=RD.parse;window.Date=FD;`;
const OPEN=`window.__hnxPulledOk=true;localStorage.setItem('_v2_46_97_dose_migration_done','1');window.showToast=()=>{};window.confirm=()=>true;
  switchView('irr_nutrients');await sleep(900);window.irrSetPoolTime('08:00');renderIrrPoolMonitor();await sleep(300);
  const T='2026-10-10',Y='2026-10-09';
  const at=(day,round,pool,f,v)=>{_irrDate=day;window.irrSetPoolTime(round);irrSavePool(pool,f,v);};
  const back=async()=>{_irrDate=hnxLocalToday();window.irrSetPoolTime('08:00');await sleep(700);};
  const REP=async p=>{switchView('irr_readings');await sleep(700);if(p)hnxIrrReadings.setPeriod(p);await sleep(150);return document.getElementById('irrReadingsBody');};
  const SEC=id=>document.querySelector('#irrReadingsBody .hnx-rr-sec[data-pool="'+id+'"]');
  const CHIP=(id,k)=>{const s=SEC(id),c=s&&s.querySelector('.hnx-rr-chip[data-k="'+k+'"]');return c?c.textContent:null;};
  const ROWS=id=>SEC(id)?[...SEC(id).querySelectorAll('tbody tr')]:[];
  const CELL=(id,day,round,f)=>{const s=SEC(id),r=s&&s.querySelector('tr[data-date="'+day+'"][data-round="'+round+'"]'),c=r&&r.querySelector('td[data-f="'+f+'"]');
    return c?{v:[...c.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(''),sev:((c.className.match(/rr-(ok|warn|crit)/)||[])[1]||''),auto:!!c.querySelector('.hnx-rr-auto')}:null;};
  const DEF=['P01','P02','P03','P04','P05','P06','P07','P08','P09','P10','P11A','P11B'];`;
const fn=body=>new Function('return (async()=>{'+OPEN+body+'})();');
const seed=new Function(CLOCK);
module.exports=[
{ name:'📒 Readings report: 12 sections by default, in order Pool 1 … Pool 10, PRJ11-A, PRJ11-B ("Pool 1 · GH1 · Room 1&2" first, "PRJ11-B · PRJ11 · Room PRJ11" last); the 📒 Readings Report tab sits right after 🏊 Pool Monitor and opens its own screen',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`await REP('today');
    const secs=[...document.querySelectorAll('#irrReadingsBody .hnx-rr-sec')],heads=secs.map(s=>s.querySelector('.hnx-rr-h').textContent);
    const v=MODULES.irrigation.views.map(x=>x.id);
    return {n:secs.length,ids:secs.map(s=>s.getAttribute('data-pool')),first:heads[0],last:heads[heads.length-1],after:v.indexOf('irr_readings')===v.indexOf('irr_nutrients')+1,
      active:document.getElementById('view-irr_readings').classList.contains('active'),view:window.currentView};`),
  expect:{n:12,ids:['P01','P02','P03','P04','P05','P06','P07','P08','P09','P10','P11A','P11B'],first:'Pool 1 · GH1 · Room 1&2',last:'PRJ11-B · PRJ11 · Room PRJ11',after:true,active:true,view:'irr_readings'} },

{ name:'📒 Readings report, Today at 10:00 Manila: Pool 1’s 08:00 round shows EC 1.62 (warning), pH 6.9 (critical), level 40 cm (ok), 24 °C (ok), checked by Reven, water 405 L and A 2 L marked ⚡ (worked out by Nexi) while typed values carry no ⚡ → "Rounds entered 1 of 1", "Out of range 1"; Pool 2 → "Rounds entered 0 of 1" with one "— not entered —" row; the 11:00–16:00 rounds are not shown yet',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`at(T,'08:00','P01','water','40');at(T,'08:00','P01','EC','1.62');at(T,'08:00','P01','pH','6.9');at(T,'08:00','P01','waterTemp','24');at(T,'08:00','P01','airPump','working');at(T,'08:00','P01','checkedBy','Reven');
    await back();await REP('today');
    const p2=ROWS('P02');
    return {ec:CELL('P01',T,'08:00','EC'),ph:CELL('P01',T,'08:00','pH'),lvl:CELL('P01',T,'08:00','water'),temp:CELL('P01',T,'08:00','waterTemp'),
      w:CELL('P01',T,'08:00','waterAdded'),a:CELL('P01',T,'08:00','A'),by:CELL('P01',T,'08:00','checkedBy').v,air:CELL('P01',T,'08:00','airPump').v,
      r1:CHIP('P01','rounds'),o1:CHIP('P01','out'),last:/^Last reading Sat 10 Oct · 08:00 round · saved 10:0\\d$/.test(CHIP('P01','last')),
      r2:CHIP('P02','rounds'),p2rows:p2.length,p2missing:p2.length===1&&p2[0].classList.contains('hnx-rr-missing')&&p2[0].textContent.indexOf('— not entered —')>=0,
      future:document.querySelectorAll('#irrReadingsBody tr[data-round="11:00"],#irrReadingsBody tr[data-round="14:00"],#irrReadingsBody tr[data-round="16:00"]').length};`),
  expect:{ec:{v:'1.62',sev:'warn',auto:false},ph:{v:'6.9',sev:'crit',auto:false},lvl:{v:'40',sev:'ok',auto:false},temp:{v:'24',sev:'ok',auto:false},
    w:{v:'405',sev:'',auto:true},a:{v:'2',sev:'',auto:true},by:'Reven',air:'✓ working',
    r1:'Rounds entered 1 of 1',o1:'Out of range 1',last:true,r2:'Rounds entered 0 of 1',p2rows:1,p2missing:true,future:0} },

{ name:'📒 Readings report, Last 7 days (Sun 4 – Sat 10 Oct, today at 10:00): Pool 3 with 9 Oct 08:00 + 14:00 entered → "Rounds entered 2 of 25", 25 rows newest first (10 Oct 08:00 on top, then 9 Oct 16:00 … 4 Oct 08:00 at the bottom), 23 "— not entered —", last reading Fri 9 Oct 14:00; all 12 pools → rounds entered 2 of 300',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`at(Y,'08:00','P03','water','50');at(Y,'08:00','P03','EC','1.8');at(Y,'08:00','P03','pH','6.1');at(Y,'14:00','P03','water','45');
    await back();await REP('7d');
    const rows=ROWS('P03'),keys=rows.map(r=>r.getAttribute('data-date')+' '+r.getAttribute('data-round'));
    const sorted=keys.slice().sort().reverse();
    return {r3:CHIP('P03','rounds'),rows:rows.length,missing:rows.filter(r=>r.classList.contains('hnx-rr-missing')).length,
      top:keys[0],second:keys[1],bottom:keys[keys.length-1],newestFirst:JSON.stringify(keys)===JSON.stringify(sorted),
      last:/^Last reading Fri 9 Oct · 14:00 round/.test(CHIP('P03','last')||''),ec:CELL('P03',Y,'08:00','EC'),
      sum:/rounds entered 2 of 300/.test(document.querySelector('#irrReadingsBody .hnx-rr-sum').textContent)};`),
  expect:{r3:'Rounds entered 2 of 25',rows:25,missing:23,top:'2026-10-10 08:00',second:'2026-10-09 16:00',bottom:'2026-10-04 08:00',newestFirst:true,last:true,
    ec:{v:'1.8',sev:'ok',auto:false},sum:true} },

{ name:'📒 Readings report CSV (hnxIrrReadingsCsv): Pool 1 + Pool 3 for 9–10 Oct at 10:00 → the header + 10 lines (5 rounds each: the four of 9 Oct + 08:00 today), a Pool column, 7 "not entered"; Pool 1’s 10 Oct 08:00 line: EC meter 1.62, level 40 cm, A 2, "EC meter warning", worked out by Nexi lists A; Today for the 12 default pools → header + 12 lines',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`at(T,'08:00','P01','water','40');at(T,'08:00','P01','EC','1.62');at(Y,'08:00','P03','water','50');at(Y,'14:00','P03','water','45');
    await back();await REP('today');
    const parse=l=>{const o=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else if(ch===','){o.push(c);c='';}else if(ch==='"')q=true;else c+=ch;}o.push(c);return o;};
    const csv=hnxIrrReadingsCsv({from:Y,to:T,pools:['P01','P03']}),lines=csv.split('\\n'),H=parse(lines[0]);
    const obj=l=>{const v=parse(l),o={};H.forEach((h,i)=>o[h]=v[i]);return o;};
    const rows=lines.slice(1).map(obj),p1=rows.find(r=>r.Pool==='Pool 1'&&r.Date===T&&r.Round==='08:00')||{};
    const def=hnxIrrReadingsCsv().split('\\n');
    return {head:lines[0],n:lines.length,p1n:rows.filter(r=>r.Pool==='Pool 1').length,p3n:rows.filter(r=>r.Pool==='Pool 3').length,
      missing:rows.filter(r=>r.Status==='not entered').length,
      p1:{status:p1.Status,ec:p1['EC meter'],lvl:p1['Level cm'],a:p1['A L'],out:p1['Out of range'],nexiA:/(^|, )A(,|$)/.test(p1['Worked out by Nexi']||'')},
      def:def.length,defPools:[...new Set(def.slice(1).map(l=>parse(l)[0]))].length};`),
  expect:{head:'Pool,Room,GH,Date,Round,Status,Finish time,EC meter,EC manual,pH meter,pH manual,Level cm,Temp °C,Air pump,Ozone s,Source,Water added L,A L,B L,C L,Checked by,Saved at,Saved by,Out of range,Worked out by Nexi',
    n:11,p1n:5,p3n:5,missing:7,p1:{status:'entered',ec:'1.62',lvl:'40',a:'2',out:'EC meter warning',nexiA:true},def:13,defPools:12} },

{ name:'📒 Readings report is read-only: opening it, switching Today / Yesterday / Last 7 days / This month / Custom (1 Sep – 10 Oct, 40 days) and building the CSV makes 0 writes to hydroPro_irr_pool (byte-identical before and after); the only key it writes is the per-computer period hnxlocal_irr_readings_period_v1',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`at(T,'08:00','P01','water','40');at(T,'08:00','P01','EC','1.62');at(Y,'14:00','P03','water','45');
    await back();await sleep(800);
    const before=localStorage.getItem('hydroPro_irr_pool');
    const keys=[];let pool=0,inRep=false;const SI=localStorage.setItem,PI=Storage.prototype.setItem; /* the app installs its own localStorage.setItem; both layers are watched */
    const spy=o=>function(k,v){if(k==='hydroPro_irr_pool')pool++;if(inRep)keys.push(k);return o.apply(this,arguments);};
    localStorage.setItem=spy(SI);Storage.prototype.setItem=spy(PI);
    const R=f=>{inRep=true;try{return f();}finally{inRep=false;}};
    try{
      await REP();
      R(()=>hnxIrrReadings.setPeriod('today'));R(()=>hnxIrrReadings.setPeriod('yesterday'));R(()=>hnxIrrReadings.setPeriod('7d'));R(()=>hnxIrrReadings.setPeriod('month'));
      R(()=>hnxIrrReadings.setCustom('2026-09-01','2026-10-10'));const secs=document.querySelectorAll('#irrReadingsBody .hnx-rr-sec').length;
      R(()=>hnxIrrReadingsCsv());R(()=>hnxIrrReadings.render());R(()=>hnxIrrReadingsModel({from:'2026-09-01',to:'2026-10-10'}));
      await sleep(300);
      return {pool,same:localStorage.getItem('hydroPro_irr_pool')===before,keys:[...new Set(keys)],secs,
        period:JSON.parse(localStorage.getItem('hnxlocal_irr_readings_period_v1')||'{}')};
    }finally{localStorage.setItem=SI;Storage.prototype.setItem=PI;}`),
  expect:{pool:0,same:true,keys:['hnxlocal_irr_readings_period_v1'],secs:12,period:{preset:'custom',from:'2026-09-01',to:'2026-10-10'}} },

{ name:'📒 Readings report custom period: 10 Oct → 1 Oct says "FROM must be on or before TO." and shows no table; 1 Aug → 10 Oct (71 days) says "Pick at most 62 days (71 days chosen)."; 9 Sep → 10 Oct (32 days, today at 10:00) → 12 sections, Pool 1 "Rounds entered 0 of 125" (31 days × 4 + 1)',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`await REP('today');
    const err=()=>{const e=document.querySelector('#irrReadingsBody .hnx-rr-err');return e?e.textContent.replace(/^⚠ /,''):'';};
    const tables=()=>document.querySelectorAll('#irrReadingsBody table.hnx-rr-t').length;
    hnxIrrReadings.setCustom('2026-10-10','2026-10-01');const e1=err(),t1=tables();
    hnxIrrReadings.setCustom('2026-08-01','2026-10-10');const e2=err(),t2=tables();
    hnxIrrReadings.setCustom('2026-09-09','2026-10-10');
    return {e1,t1,e2,t2,e3:err(),secs:document.querySelectorAll('#irrReadingsBody .hnx-rr-sec').length,r1:CHIP('P01','rounds'),
      on:(document.querySelector('#irrReadingsBody .hnx-rr-seg button.on')||{}).textContent};`),
  expect:{e1:'FROM must be on or before TO.',t1:0,e2:'Pick at most 62 days (71 days chosen).',t2:0,e3:'',secs:12,r1:'Rounds entered 0 of 125',on:'Custom'} },

{ name:'📒 Readings report pool list ("for now"): an admin ticks Pool 1 + PRJ11-A → the synced setting hydroPro_irr_report_pools_v1 = ["P01","P11A"] and the report shows 2 sections; someone without Pool & Drum Setup rights sees ✏ Change pools disabled and a save is refused (list unchanged); ↺ Pool 1–10 + PRJ11 brings back the 12',
  requires:NEW, tz:'Asia/Manila', seed,
  run:fn(`await REP('today');
    hnxIrrReadings.openPools();await sleep(100);
    const box=document.getElementById('hnxRrChooser');const opened=!!box;
    [...box.querySelectorAll('input[type=checkbox]')].forEach(i=>{i.checked=(i.value==='P11A'||i.value==='P01');});
    hnxIrrReadings.savePools();await sleep(100);
    const saved=JSON.parse(localStorage.getItem('hydroPro_irr_report_pools_v1')||'null');
    const two=[...document.querySelectorAll('#irrReadingsBody .hnx-rr-sec')].map(s=>s.getAttribute('data-pool'));
    const oA=window.isAdmin,oC=window.can;let disabled=null,refused=null,kept=null;
    try{window.isAdmin=()=>false;window.can=p=>p==='viewIrrigation';hnxIrrReadings.render();
      const b=document.querySelector('#irrReadingsBody button[data-act="pools"]');disabled=!!(b&&b.disabled);
      refused=hnxIrrReadings.savePools(['P02'])===false;kept=localStorage.getItem('hydroPro_irr_report_pools_v1');}
    finally{window.isAdmin=oA;window.can=oC;}
    hnxIrrReadings.openPools();await sleep(100);hnxIrrReadings.defaultPools();hnxIrrReadings.savePools();await sleep(100);
    return {opened,saved,two,disabled,refused,kept,back:document.querySelectorAll('#irrReadingsBody .hnx-rr-sec').length,
      list:JSON.parse(localStorage.getItem('hydroPro_irr_report_pools_v1')||'null').join(',')===DEF.join(',')};`),
  expect:{opened:true,saved:['P01','P11A'],two:['P01','P11A'],disabled:true,refused:true,kept:'["P01","P11A"]',back:12,list:true} },

{ name:'📱 Readings report on a phone (375 px): the 📒 Readings report button on the Pool Monitor opens it, its tables scroll sideways inside their own box (rows stay rows, not the phone card fold), the report and the page are never wider than the screen, and ← Pool Monitor goes back',
  requires:NEW, tz:'Asia/Manila', seed, viewport:{width:375,height:800},
  run:fn(`at(T,'08:00','P01','water','40');at(T,'08:00','P01','EC','1.7');await back();renderIrrPoolMonitor();await sleep(300);
    const btn=document.querySelector('#stubIrrNutrientsBody button[onclick*="irr_readings"]');const label=btn?btn.textContent.trim():'';
    btn.click();await sleep(900);const opened=window.currentView;
    const body=document.getElementById('irrReadingsBody'),wrap=body.querySelector('.hnx-rr-wrap'),td=body.querySelector('table.hnx-rr-t tbody td');
    await sleep(3000); /* the v13.88 card labeller runs every 2.5 s */
    const r={label,opened,inBox:wrap.scrollWidth>wrap.clientWidth+50,rowDisplay:getComputedStyle(td).display,
      report:body.scrollWidth<=body.clientWidth+1,page:document.documentElement.scrollWidth<=innerWidth+1};
    body.querySelector('button[data-act="back"]').click();await sleep(900);r.back=window.currentView;
    return r;`),
  expect:{label:'📒 Readings report',opened:'irr_readings',inBox:true,rowDisplay:'table-cell',report:true,page:true,back:'irr_nutrients'} }
];
