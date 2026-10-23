/* v23.54 (Eyal, 21 Oct 2026, Production greenhouse card screenshot: "why the point of warning and critical not in the right place in the gh
   also in the matrix down i dont see that and always to see the last report until new report will replace").
   Root cause found by the audit and verified in the source: the Production checklist state is per day (hydroPro_<YYYY-MM-DD>) and the
   carry-forward of the history block copied only the STATUS and the NOTE of a still-open ⚠ / ✕ into the new day — never its LOCATION. On
   the new day the item therefore had no place: the 🏭 Farm Twin put its pin at a spot made up from a hash of the item key, and the
   📍 Location Heatmap (the matrix) stayed empty until somebody typed the place again.
   Four decisions (Eyal approved all four):
     D1  the location is carried with the problem (hnxProdCarryForward) and, for a day that was carried before this fix, READ from the day
         it came from (read-time fallback — no old day is rewritten); today's own entry always wins, an empty list taken off on purpose too;
     D2  an item with no known location is drawn as a grey, dashed "no location" pin in ONE fixed place of the house, never at an invented one;
     D3  until a new report replaces it, the matrix and the pins say "Last report <date> · carried" (the date it was really reported);
     D4  a ⚠ / ✕ needs a place before it is saved — a table, all tables, most tables — or the explicit "❔ Unknown", so nobody is blocked.
   Seed (yesterday = Y, today = T, all relative to the real date so the cases never go stale):
     Y  GH3  ✕ rootzone_3 "Root Rot (Pythium Suspected)" B12–B16 + note · ⚠ disease_1 C7 + note · ⚠ leaf_2 note, NO place · ⚠ growth_5 NO place ·
               waterflow_1 OK
        GH6  ⚠ climate_0 ALL tables + note
        GH7  ✕ infra_2 with the place marked UNKNOWN
     T  GH3  ⚠ waterflow_1 reported TODAY (its own, B12–B16 + note)     GH5  ⚠ waterflow_1 reported TODAY at B12–B16 (the "own report" control)
   → at start-up: 6 problems carried (GH3 4 · GH6 1 · GH7 1), 4 notes, 3 locations, 1 "unknown" mark; yesterday's OK is not carried; the two own
   reports stay as they are. */
const MON="['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']";
/* the same dates on the Node side (the browser and Node share the machine's clock and zone), for the expected texts */
const ymdN=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const agoN=n=>{const x=new Date();x.setDate(x.getDate()-n);return ymdN(x);};
const labN=iso=>(+iso.slice(8))+' '+eval(MON)[+iso.slice(5,7)-1];
const D1N=agoN(1),D3N=agoN(3),LR1='Last report '+labN(D1N)+' · carried',LR3='Last report '+labN(D3N)+' · carried';
const DAYS=`const MON=${MON};const Y=daysEnding(today,2)[0],T=today,lab=iso=>(+iso.slice(8))+' '+MON[+iso.slice(5,7)-1],LR='Last report '+lab(Y)+' · carried';`;
const SEED=function(){
  const ymd=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const ago=n=>{const x=new Date();x.setDate(x.getDate()-n);return ymd(x);};
  const T=ago(0),Y=ago(1);
  const gh=o=>Object.assign({items:{},statuses:{},locations:{},notes:{},photos:{},fans:{},fanIssues:{big:[],roof:[]},supTag:'',supNote:'',pipesClean:null,seedlings:null},o);
  localStorage.setItem('hydroPro_'+Y,JSON.stringify({
    GH3:gh({statuses:{rootzone_3:'danger',disease_1:'warn',leaf_2:'warn',growth_5:'warn',waterflow_1:'ok'},
      notes:{rootzone_3:'Brown slimy roots',disease_1:'Mildew on the span',leaf_2:'Pale tips'},
      locations:{rootzone_3:[{type:'range',table:'B',from:12,to:16}],disease_1:[{type:'specific',table:'C',number:7}]}}),
    GH6:gh({statuses:{climate_0:'warn'},notes:{climate_0:'Pad dry'},locations:{climate_0:[{type:'all'}]}}),
    GH7:gh({statuses:{infra_2:'danger'},extras:{infra_2:{locUnknown:true}}})}));
  localStorage.setItem('hydroPro_'+T,JSON.stringify({
    GH3:gh({statuses:{waterflow_1:'warn'},notes:{waterflow_1:'Low flow today'},locations:{waterflow_1:[{type:'specific',table:'E',number:20}]}}),
    GH5:gh({statuses:{waterflow_1:'warn'},notes:{waterflow_1:'Low flow today'},locations:{waterflow_1:[{type:'range',table:'B',from:12,to:16}]}})}));
  localStorage.removeItem('hnxlocal_twin_classic_v1');
  localStorage.setItem('hnx_twin_gl','force');
  localStorage.setItem('hnx_irrviz_motion_v2226','always');
};
/* the same seed, but the previous days are in the shape the app wrote BEFORE this fix: the problem and its "carried from" mark are in
   today's record (and in the day before it) with NO location, the place lives only on the day it was first reported (3 days ago) */
const SEED_LEGACY=function(){
  const ymd=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const ago=n=>{const x=new Date();x.setDate(x.getDate()-n);return ymd(x);};
  const T=ago(0),D1=ago(1),D3=ago(3);
  const gh=o=>Object.assign({items:{},statuses:{},locations:{},notes:{},photos:{},fans:{},fanIssues:{big:[],roof:[]},supTag:'',supNote:'',pipesClean:null,seedlings:null},o);
  localStorage.setItem('hydroPro_'+D3,JSON.stringify({
    GH4:gh({statuses:{waterflow_2:'warn',disease_2:'danger'},notes:{waterflow_2:'No flow at the end of the row'},
      locations:{waterflow_2:[{type:'specific',table:'A',number:3}],disease_2:[{type:'range',table:'D',from:4,to:6}]}})}));
  localStorage.setItem('hydroPro_'+D1,JSON.stringify({
    GH4:gh({statuses:{waterflow_2:'warn',disease_2:'danger'},notes:{waterflow_2:'No flow at the end of the row'},carried:{waterflow_2:D3,disease_2:D3}})}));
  localStorage.setItem('hydroPro_'+T,JSON.stringify({
    GH4:gh({statuses:{waterflow_2:'warn',disease_2:'danger'},notes:{waterflow_2:'No flow at the end of the row'},carried:{waterflow_2:D1,disease_2:D1}})}));
  /* the carry for today was already done by the old code: it must not run again */
  localStorage.setItem('hydroPro_prod_carry_v1',JSON.stringify({[T]:{from:D1,n:2,at:new Date().toISOString()}}));
  localStorage.removeItem('hnxlocal_twin_classic_v1');
  localStorage.setItem('hnx_twin_gl','force');
};
const H=`window.__hnxPulledOk=true;window.showToast=()=>{};window.confirm=()=>true;const TW=window.hnxTwin;
  const tx=e=>(e?e.textContent:'').replace(/\\s+/g,' ').trim();
  const until=async(f,ms)=>{const t0=Date.now();let v=f();while(!v&&Date.now()-t0<(ms||8000)){await sleep(150);v=f();}return v;};
  const go=async(v,ms)=>{switchView(v,true);await sleep(ms||2200);};
  const J=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}};
  const rd=(d,g)=>(J('hydroPro_'+d)||{})[g]||{};
  const r2=n=>Math.round(n*100)/100;
  /* where the engine put a table-located item, as an offset from the house centre (places['t:<key>']) - the same for a carried and for an own report */
  const relT=(g,k)=>{try{const I=TW._site().info[g],P=I&&I.places['t:'+k];return P?{dx:r2(P.x-I.x),dz:r2(P.z-I.z)}:null;}catch(e){return null;}};
  /* where the open drill-down's picture puts an item (placeOf), and the ONE fixed slot a house keeps for items with no place */
  const dplace=k=>{try{const d=TW._drill(),it=d.f.items.filter(i=>i.key===k)[0],p=it?TW._place(d.I,it):null;return p?{x:r2(p.x),y:r2(p.y),z:r2(p.z),nowhere:!!p.nowhere}:null;}catch(e){return null;}};
  const dslot=()=>{try{const d=TW._drill(),p=TW._place(d.I,{key:'',place:{t:'house'}});return {x:r2(p.x),y:r2(p.y),z:r2(p.z)};}catch(e){return null;}};
  const item=(g,k)=>{try{const f=TW.model().facilities.filter(x=>x.id===g)[0];return f?f.items.filter(i=>i.key===k)[0]||null:null;}catch(e){return null;}};
  const CI=(g,k)=>{try{return hnxProdCarryInfo(g,state[g],k)||{};}catch(e){return {};}};
  const lt=l=>(l||[]).map(x=>x.type==='range'?x.table+x.from+'-'+x.to:x.type==='specific'?x.table+x.number:x.type).join('+');
  ${DAYS}
  try{switchModule('production');}catch(e){}await sleep(1500);`;
const fn=body=>new Function('return (async()=>{'+H+body+'})();');
const TWIN="window.hnxTwin&&/^23\\.2[45]$/.test(window.hnxTwin.__v)";
const CARRY="typeof window.hnxProdCarryForward==='function'";

module.exports=[
{ name:'🧭 D1 Carry-forward copies status + note + LOCATION: yesterday GH3 ✕ B12–B16 + ⚠ C7 + 2 ⚠ without a place, GH6 ⚠ all tables, GH7 ✕ place unknown, one OK → today 6 problems carried (GH3 4 · GH6 1 · GH7 1), 4 notes, 3 locations (B12–16, C7, all), 1 unknown mark; the OK and today\'s own reports are not touched; the log says 6 / 3; yesterday is not rewritten',
  requires:CARRY, seed:SEED,
  run:fn(`const t3=rd(T,'GH3'),t5=rd(T,'GH5'),t6=rd(T,'GH6'),t7=rd(T,'GH7'),y3=rd(Y,'GH3'),log=(J('hydroPro_prod_carry_v1')||{})[T]||{};
    const ck=g=>Object.keys(g.carried||{}).sort().join(',');
    const n=(g,f)=>Object.keys(g[f]||{}).filter(k=>(g.carried||{})[k]).length;
    return {carriedGH3:ck(t3),carriedGH6:ck(t6),carriedGH7:ck(t7),carriedGH5:ck(t5),
      status:Object.keys(t3.carried||{}).concat(Object.keys(t6.carried||{}),Object.keys(t7.carried||{})).filter((k,i,a)=>true).length,
      notes:n(t3,'notes')+n(t6,'notes')+n(t7,'notes'),
      locs:n(t3,'locations')+n(t6,'locations')+n(t7,'locations'),
      range:lt(t3.locations&&t3.locations.rootzone_3),one:lt(t3.locations&&t3.locations.disease_1),all:lt(t6.locations&&t6.locations.climate_0),
      noPlace:(t3.locations||{}).leaf_2===undefined&&(t3.locations||{}).growth_5===undefined,
      unk:!!((t7.extras||{}).infra_2||{}).locUnknown,
      okNotCarried:!(t3.carried||{}).waterflow_1&&t3.statuses.waterflow_1==='warn'&&lt(t3.locations.waterflow_1)==='E20',
      own5:t5.statuses.waterflow_1==='warn'&&lt(t5.locations.waterflow_1)==='B12-16',
      logFrom:log.from===Y,logN:log.n,logLoc:log.loc,
      ydayLocs:Object.keys(y3.locations||{}).length,ydayCarried:Object.keys(y3.carried||{}).length,ydayRange:lt(y3.locations.rootzone_3)};`),
  expect:{carriedGH3:'disease_1,growth_5,leaf_2,rootzone_3',carriedGH6:'climate_0',carriedGH7:'infra_2',carriedGH5:'',status:6,notes:4,locs:3,
    range:'B12-16',one:'C7',all:'all',noPlace:true,unk:true,okNotCarried:true,own5:true,logFrom:true,logN:6,logLoc:3,ydayLocs:2,ydayCarried:0,ydayRange:'B12-16'} },

{ name:'📍 D1+D3 Same place on the pins and on the matrix, labelled "Last report <date> · carried": the carried ✕ B12–B16 draws at exactly the spot a report made today at B12–B16 draws (GH5 control, offset from the house centre), its 5 cells B12–B16 are red on the Location Heatmap and on the drill-down mini map, the ⚠ C7 is amber; GH3 shows 4 carried items under the label, the Dashboard matrix says 6; a new own report (D9) replaces it: D9 lit, B12–B16 dark, 3 left under the label',
  requires:TWIN, seed:SEED, viewport:{width:1600,height:1000},
  run:fn(`await go('dashboard',2500);TW.show('dash');await sleep(1500);
    const out={};
    const it=item('GH3','rootzone_3'),c7=item('GH3','disease_1'),own=item('GH3','waterflow_1'),ctl=item('GH5','waterflow_1');
    out.model={locs:lt(it&&it.locs),where:it&&it.where,lr:it&&it.lr===Y,c7:lt(c7&&c7.locs),c7lr:c7&&c7.lr===Y,ownLr:own?own.lr:null,ctlLr:ctl?ctl.lr:null};
    out.same=!!relT('GH3','rootzone_3')&&JSON.stringify(relT('GH3','rootzone_3'))===JSON.stringify(relT('GH5','waterflow_1'));
    /* the real checklist: Location Heatmap of GH3 */
    await go('checklist',2500);const fs=document.getElementById('facSelect');fs.value='GH3';fs.dispatchEvent(new Event('change',{bubbles:true}));await sleep(2500);
    const hm=()=>document.getElementById('clHeatmap');
    const cells=cls=>[...hm().querySelectorAll('td.hmap-cell.'+cls)].map(e=>e.getAttribute('data-cell')).join(',');
    const bar=()=>hm().querySelector('.hmap-carried-bar');
    out.map={danger:cells('hmap-danger'),warn:cells('hmap-warn'),carried:[...hm().querySelectorAll('td.hmap-cell[data-carried]')].map(e=>e.getAttribute('data-cell')).join(','),
      label:bar()?tx(bar().querySelector('.hmap-lr')):'',date:bar()?bar().getAttribute('data-carried'):'',n:bar()?+bar().getAttribute('data-n'):-1,meta:tx(hm().querySelector('.hmap-meta'))};
    /* the Farm Twin drill-down of GH3: its mini map and its pins */
    TW.open('GH3');await until(()=>document.querySelectorAll('#hnxTwinDrill .hnx-tw-dl .hnx-tw-pin').length>=5,15000);await sleep(800);
    const d=document.getElementById('hnxTwinDrill');
    out.mini={red:[...d.querySelectorAll('.hnx-tw-heat i.crit')].map(e=>e.getAttribute('data-cell')).join(','),amber:[...d.querySelectorAll('.hnx-tw-heat i.warn')].map(e=>e.getAttribute('data-cell')).join(','),
      carried:d.querySelectorAll('.hnx-tw-heat i[data-lr]').length};
    const pin=k=>d.querySelector('.hnx-tw-dl .hnx-tw-pin[data-k="'+k+'"]');
    out.pins={n:d.querySelectorAll('.hnx-tw-dl .hnx-tw-pin').length,carriedPin:!!pin('rootzone_3')&&!pin('rootzone_3').classList.contains('noloc')&&pin('rootzone_3').getAttribute('data-lr')===Y,
      tag:tx(d.querySelector('.hnx-tw-dl .hnx-tw-lr')),tip:pin('rootzone_3')?pin('rootzone_3').title:'',ownPin:!!pin('waterflow_1')&&!pin('waterflow_1').hasAttribute('data-lr')};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(500);
    /* the Dashboard matrix says how much of it is the last report */
    await go('dashboard',2500);renderDB();await sleep(500);
    const note=document.querySelector('#matrixWrap .hnx-lr-note');out.dash={text:tx(note),date:note?note.getAttribute('data-lr'):''};
    /* a new report of today replaces the carried one: the place is typed again (D9) */
    setLocations('GH3','rootzone',3,[{type:'specific',table:'D',number:9}]);await sleep(300);
    await go('checklist',2500);fs.value='GH3';fs.dispatchEvent(new Event('change',{bubbles:true}));await sleep(2500);
    const info=CI('GH3','rootzone_3');
    out.after={rootCarried:info.carried,danger:cells('hmap-danger'),warn:cells('hmap-warn'),d9carried:!!hm().querySelector('td[data-cell="D9"][data-carried]'),n:bar()?+bar().getAttribute('data-n'):-1,
      label:bar()?tx(bar().querySelector('.hmap-lr')):''};
    return out;`),
  expect:{'model':{locs:'B12-16',where:'B12–B16',lr:true,c7:'C7',c7lr:true,ownLr:false,ctlLr:false},same:true,
    'map':{danger:'B12,B13,B14,B15,B16',warn:'C7,E20',carried:'B12,B13,B14,B15,B16,C7',label:LR1,date:D1N,n:4,meta:'GH3 · 5 flagged · 3 with location · 2 unplaced'},
    'mini':{red:'B12,B13,B14,B15,B16',amber:'C7,E20',carried:6},
    'pins':{n:5,carriedPin:true,tag:LR1,tip:'Root Rot (Pythium Suspected) · B12–B16 · '+LR1,ownPin:true},
    'dash':{text:'↩ '+LR1+' — 6 flagged items still come from it',date:D1N},
    'after':{rootCarried:false,danger:'D9',warn:'C7,E20',d9carried:false,n:3,label:LR1}} },

{ name:'⚪ D2 Honest pins: GH3\'s two flagged items with no place (leaf_2, growth_5) are grey DASHED "no location recorded" pins side by side around ONE fixed spot of the house — the same 3-D point for both, the point the house reports as its no-location slot — never at a made-up position; the 3 located pins are not grey; the card says "no location recorded"; GH7\'s ✕ carried as "unknown" is a no-location pin too; the checklist strip draws the same 2 grey + 3 normal pins; a no-location pin gets no loupe',
  requires:TWIN, seed:SEED, viewport:{width:1600,height:1000},
  run:fn(`await go('dashboard',2500);TW.show('dash');await sleep(1500);
    const out={};
    TW.open('GH3');await until(()=>document.querySelectorAll('#hnxTwinDrill .hnx-tw-dl .hnx-tw-pin').length>=5,15000);await sleep(800);
    const a=dplace('leaf_2'),b=dplace('growth_5'),s=dslot(),c=dplace('rootzone_3');
    out.fixed={a:a&&a.nowhere,b:b&&b.nowhere,same:!!a&&!!b&&a.x===b.x&&a.y===b.y&&a.z===b.z,atSlot:!!a&&!!s&&a.x===s.x&&a.y===s.y&&a.z===s.z,located:c&&c.nowhere};
    const d=document.getElementById('hnxTwinDrill'),pins=[...d.querySelectorAll('.hnx-tw-dl .hnx-tw-pin')];
    const nl=pins.filter(p=>p.classList.contains('noloc'));
    const cs=nl[0]?getComputedStyle(nl[0]):null;
    out.pins={total:pins.length,noloc:nl.length,keys:nl.map(p=>p.getAttribute('data-k')).sort().join(','),attr:nl.length>0&&nl.every(p=>p.getAttribute('data-noloc')==='1'),
      dashed:!!cs&&cs.borderTopStyle==='dashed',grey:!!cs&&cs.backgroundColor==='rgb(107, 114, 128)',tip:nl[0]?nl[0].title:'',
      locatedGrey:pins.filter(p=>!p.classList.contains('noloc')).some(p=>getComputedStyle(p).backgroundColor==='rgb(107, 114, 128)'),
      /* side by side: the two grey pins are 23 px apart on one line, centred on the spot */
      apart:nl.length===2?Math.round(Math.abs(parseFloat(nl[0].style.left)-parseFloat(nl[1].style.left))):-1,level:nl.length===2&&nl[0].style.top===nl[1].style.top};
    const card=k=>tx(d.querySelector('.hnx-tw-card[data-k="'+k+'"] .t'));
    out.cards={leaf2:card('leaf_2'),root:card('rootzone_3')};
    out.loc=tx([...d.querySelectorAll('.hnx-tw-sec')].find(s=>/^Location/.test(tx(s.querySelector('h4'))))).replace(/Last report.*$/,'');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(500);
    /* GH7: the ✕ carried as "unknown" is a no-location pin too */
    TW.open('GH7');await until(()=>document.querySelectorAll('#hnxTwinDrill .hnx-tw-dl .hnx-tw-pin').length>=1,15000);await sleep(800);
    const q=dplace('infra_2'),qs=dslot();
    out.gh7={unknown:CI('GH7','infra_2').unknown===true,carried:CI('GH7','infra_2').carried===true,nowhere:!!q&&q.nowhere===true&&!!qs&&q.x===qs.x&&q.z===qs.z,
      pin:!!document.querySelector('#hnxTwinDrill .hnx-tw-dl .hnx-tw-pin[data-k="infra_2"].noloc'),where:(item('GH7','infra_2')||{}).where,lr:(item('GH7','infra_2')||{}).lr===Y};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(500);
    /* the checklist strip of GH3 draws the same grey pins */
    await go('checklist',2500);const fs=document.getElementById('facSelect');fs.value='GH3';fs.dispatchEvent(new Event('change',{bubbles:true}));await sleep(2500);TW.show('cl');await sleep(2000);
    const sp=[...document.querySelectorAll('#hnxTwinCl .hnx-tw-pin')];out.strip={noloc:sp.filter(p=>p.classList.contains('noloc')).length,located:sp.filter(p=>!p.classList.contains('noloc')).length,
      tag:tx(document.querySelector('#hnxTwinCl .hnx-tw-lr'))};
    return out;`),
  expect:{'fixed':{a:true,b:true,same:true,atSlot:true,located:false},
    'pins':{total:5,noloc:2,keys:'growth_5,leaf_2',attr:true,dashed:true,grey:true,tip:'Yellowish Leaves · no location recorded · '+LR1,locatedGrey:false,apart:23,level:true},
    'cards':{leaf2:'⚠ Yellowish Leaves · no location recorded',root:'✕ Root Rot (Pythium Suspected) · B12–B16'},
    'loc':'Location2 flagged items have no location recorded: Yellowish Leaves · Overcrowding',
    'gh7':{unknown:true,carried:true,nowhere:true,pin:true,where:'no location recorded',lr:true},
    'strip':{noloc:2,located:3,tag:LR1}} },

{ name:'🔒 D4 Flagging needs a place: ⚠ / ✕ on GH2 with no place is REFUSED (status stays empty, the "📍 Where is it?" box opens); Cancel keeps it empty; ❔ Unknown flags it with no place (marked unknown, 0 locations); a table + number flags it with C7; "All tables" flags it with [all]; a flag on an item that already has a place needs no question; the row drop box and a preset ask the same way; clearing the flag clears the unknown mark',
  requires:TWIN, seed:SEED, viewport:{width:1600,height:1000},
  run:fn(`await go('checklist',2500);const fs=document.getElementById('facSelect');fs.value='GH2';fs.dispatchEvent(new Event('change',{bubbles:true}));await sleep(2000);
    const out={},gate=()=>document.getElementById('hnxLocGate');
    const press=sel=>{const g=gate(),b=g&&g.querySelector(sel);if(b)b.click();return !!b;};
    const S=(c,i)=>getStatus('GH2',c,i),L=(c,i)=>lt(getLocations('GH2',c,i)),U=(c,i)=>!!getExtra('GH2',c,i).locUnknown;
    setStatusUI('GH2','leaf',0,'warn');await sleep(300);
    out.refused={status:S('leaf',0),box:!!gate(),title:tx(gate()&&gate().querySelector('.hnx-lg-t')),dlg:gate()?gate().getAttribute('role'):''};
    press('[data-lg="cancel"]');await sleep(200);out.cancelled={status:S('leaf',0),box:!!gate()};
    setStatusUI('GH2','leaf',0,'danger');await sleep(300);out.askedCritical=!!gate()&&S('leaf',0)===null;
    press('[data-lg="unk"]');await sleep(500);
    out.unknown={status:S('leaf',0),unk:U('leaf',0),locs:L('leaf',0),box:!!gate()};
    setStatusUI('GH2','leaf',1,'warn');await sleep(300);
    const g1=gate();if(g1){g1.querySelector('#hnxLgT').value='C';g1.querySelector('#hnxLgN').value='7';}
    press('[data-lg="spec"]');await sleep(500);out.table={status:S('leaf',1),locs:L('leaf',1),unk:U('leaf',1),box:!!gate()};
    setStatusUI('GH2','leaf',2,'warn');await sleep(300);press('[data-lg="all"]');await sleep(500);out.all={status:S('leaf',2),locs:L('leaf',2)};
    /* a table without a number is not enough — the box stays and says so */
    setStatusUI('GH2','leaf',3,'warn');await sleep(300);const g2=gate();if(g2)g2.querySelector('#hnxLgT').value='D';press('[data-lg="spec"]');await sleep(300);
    out.half={status:S('leaf',3),box:!!gate(),msg:tx(gate()&&gate().querySelector('.hnx-lg-msg')).slice(0,29)};press('[data-lg="cancel"]');await sleep(200);
    /* a place already there: no question. Upgrading ⚠ → ✕ on leaf_1 keeps C7 and asks nothing */
    setStatusUI('GH2','leaf',1,'danger');await sleep(400);out.upgrade={status:S('leaf',1),box:!!gate(),locs:L('leaf',1)};
    /* the row drop box ("what do you see?") */
    try{hnxRowPick({value:'x',options:[{text:'Tip burn on the outer leaves'}],selectedIndex:0,value:'tipburn'},'GH2','leaf',4);}catch(e){out.rowErr=String(e).slice(0,80);}
    await sleep(400);out.row={status:S('leaf',4),box:!!gate()};press('[data-lg="unk"]');await sleep(500);
    out.rowAfter={status:S('leaf',4),unk:U('leaf',4),note:/Tip burn on the outer leaves/.test(getNote('GH2','leaf',4))};
    /* presets: "Pythium suspected" (place: pick it yourself) asks, "Bolting" (all tables) does not */
    const px=PRESET_TEMPLATES.findIndex(p=>/Pythium/.test(p.name)),pb=PRESET_TEMPLATES.findIndex(p=>/Bolting/.test(p.name));
    const rz=getCategoriesForGh('GH2').find(c=>c.id==='rootzone').items.indexOf('Root Rot (Pythium Suspected)'),gr=getCategoriesForGh('GH2').find(c=>c.id==='growth').items.indexOf('Bolting (Early Flowering)');
    applyPresetTemplate('GH2',px);await sleep(400);out.preset={status:getStatus('GH2','rootzone',rz),box:!!gate()};press('[data-lg="unk"]');await sleep(500);
    out.presetAfter={status:getStatus('GH2','rootzone',rz),unk:!!getExtra('GH2','rootzone',rz).locUnknown};
    applyPresetTemplate('GH2',pb);await sleep(400);out.presetAll={status:getStatus('GH2','growth',gr),box:!!gate(),locs:lt(getLocations('GH2','growth',gr))};
    /* pressing the active flag again clears it, and the unknown mark with it */
    setStatusUI('GH2','leaf',0,'danger');await sleep(400);out.cleared={status:S('leaf',0),unk:U('leaf',0),box:!!gate()};
    /* and a flag asked again later is asked again */
    setStatusUI('GH2','leaf',0,'warn');await sleep(300);out.askedAgain=!!gate()&&S('leaf',0)===null;press('[data-lg="cancel"]');
    return out;`),
  expect:{'refused':{status:null,box:true,title:'📍 Where is it?',dlg:'dialog'},'cancelled':{status:null,box:false},askedCritical:true,
    'unknown':{status:'danger',unk:true,locs:'',box:false},'table':{status:'warn',locs:'C7',unk:false,box:false},'all':{status:'warn',locs:'all'},
    'half':{status:null,box:true,msg:'Pick the table AND the number'},'upgrade':{status:'danger',box:false,locs:'C7'},
    'row':{status:null,box:true},'rowAfter':{status:'warn',unk:true,note:true},'preset':{status:null,box:true},'presetAfter':{status:'danger',unk:true},
    'presetAll':{status:'danger',box:false,locs:'all'},'cleared':{status:null,unk:false,box:false},askedAgain:true} },

{ name:'↩ D1 read-time fallback for a day carried BEFORE this fix: GH4 ⚠ waterflow_2 and ✕ disease_2 sit in today\'s record with a "carried from yesterday" mark and NO location (the place is on the day they were first reported, 3 days ago, behind yesterday\'s copy): getLocations reads A3 and D4–D6 through the chain, nothing is written to today\'s or any old record, the label date is the REAL report (3 days ago) not yesterday, the Location Heatmap lights A3 and D4–D6 under "Last report <3 days ago> · carried"; taking the place off today (empty list) wins over the old one; a new place replaces the label',
  requires:CARRY, seed:SEED_LEGACY, viewport:{width:1600,height:1000},
  run:fn(`const D3=daysEnding(today,4)[0],D1=daysEnding(today,2)[0],lbl=lab(D3);
    const before=JSON.stringify([J('hydroPro_'+T),J('hydroPro_'+D1),J('hydroPro_'+D3)]);
    await go('checklist',2500);const fs=document.getElementById('facSelect');fs.value='GH4';fs.dispatchEvent(new Event('change',{bubbles:true}));await sleep(2500);
    const out={};
    const read=()=>({wf:lt(getLocations('GH4','waterflow',2)),ds:lt(getLocations('GH4','disease',2))});
    out.read=read();
    const info=CI('GH4','waterflow_2');out.info={carried:info.carried,fromReal:info.from===D3,hopYesterday:info.hop===D1,locs:lt(info.locs)};
    const hm=document.getElementById('clHeatmap');
    out.map={lit:[...hm.querySelectorAll('td.hmap-cell.hmap-danger,td.hmap-cell.hmap-warn')].map(e=>e.getAttribute('data-cell')).join(','),label:tx(hm.querySelector('.hmap-carried-bar .hmap-lr')),expectedLabel:'Last report '+lbl+' · carried'};
    out.picker=/Last report/.test(tx(document.getElementById('clBody')))&&tx(document.getElementById('clBody')).indexOf('Last report '+lbl+' · carried')>=0;
    out.notWritten=JSON.stringify([J('hydroPro_'+T),J('hydroPro_'+D1),J('hydroPro_'+D3)])===before;
    /* the Farm Twin reads the same place */
    await go('dashboard',2500);TW.show('dash');await sleep(1500);
    out.twin={wf:lt((item('GH4','waterflow_2')||{}).locs),ds:lt((item('GH4','disease_2')||{}).locs),lr:(item('GH4','waterflow_2')||{}).lr===D3,pin:!!relT('GH4','waterflow_2')&&!!relT('GH4','disease_2')};
    /* today's list taken off on purpose wins over the old place; a new place replaces the old one and the label */
    setLocations('GH4','waterflow',2,[]);await sleep(300);const empty=CI('GH4','waterflow_2');
    out.removed={locs:lt(getLocations('GH4','waterflow',2)),carried:empty.carried,stored:Array.isArray(rd(T,'GH4').locations.waterflow_2)};
    setLocations('GH4','disease',2,[{type:'specific',table:'F',number:30}]);await sleep(300);const rep=CI('GH4','disease_2');
    out.replaced={locs:lt(getLocations('GH4','disease',2)),carried:rep.carried};
    return out;`),
  expect:{'read':{wf:'A3',ds:'D4-6'},'info':{carried:true,fromReal:true,hopYesterday:true,locs:'A3'},'map':{lit:'A3,D4,D5,D6',label:LR3,expectedLabel:LR3},
    picker:true,notWritten:true,'twin':{wf:'A3',ds:'D4-6',lr:true,pin:true},'removed':{locs:'',carried:false,stored:true},'replaced':{locs:'F30',carried:false}} },
];
