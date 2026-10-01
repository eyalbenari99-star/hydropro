/* v21.37 (Eyal): 🌾 Harvest — SOS item receipts → GH × variety, lot-number dates, exact-match logbook, report, monthly mail */
const RECEIPT={id:'IR1001',number:'2026-21-IR1001-08',date:'2026-10-01',vendor:{name:'AteretPaz Technologies Inc GH4'},location:{name:'APAC CENTER COLD STORAGE'},
  lines:[{item:{name:'Curly Red Frisee B',sku:'CRFB'},quantity:11.29,uom:'kg',class:{name:'Aba Pardes Harvesting per GH:APAC GH4'},lot:{lotNumber:'CRFB10012026-33'}},
         {item:{name:'Curly Red Frisee B',sku:'CRFB'},quantity:8.95,uom:'kg',class:{name:'Aba Pardes Harvesting per GH:APAC GH4'},lot:{lotNumber:'CRFB10012026-34'}},
         {item:{name:'Curly Red Frisee B W & T',sku:'CRFBW'},quantity:10.47,uom:'kg',class:{name:'Aba Pardes Harvesting per GH:APAC GH4'},lot:{lotNumber:'CRFBW10012026-38'}},
         {item:{name:'Green Oak',sku:'GO'},quantity:5,uom:'kg',class:{name:'Aba Pardes Harvesting per GH:APAC GH7'},lot:{lotNumber:'GO09302026-12'}},
         {item:{name:'Empty',sku:'X'},quantity:0,class:{name:'Aba Pardes Harvesting per GH:APAC GH7'}}]};
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true,email:'tester@abapardes.com.ph'}]));localStorage.setItem('hnx_cloud_token','t');};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🌾 Harvest: one SOS receipt → 4 lines (the 0-kg line dropped); Class → GH4/GH7; "W & T" → grade W&T, variety Curly Red Frisee B; lot CRFB10012026-33 → harvest day 2026-10-01 and GO09302026-12 → 2026-09-30; October matrix GH4 = 30.71 kg, total 30.71; the pull through the worker stores the receipt and the screen shows the matrix (v21.37)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}const RECEIPT=${JSON.stringify(RECEIPT)};
    await sleep(6000);as('tester');
    const R=HNXHARV._normalize({itemreceipts:[RECEIPT]});const r=R[0];
    const pd=HNXHARV._partDate('CRFB10012026-33'),pd2=HNXHARV._partDate('GO09302026-12'),bad=HNXHARV._partDate('nolot');
    window.__hnxApi=(p)=>{return Promise.resolve({itemreceipts:[RECEIPT]});};
    HNXHARV._state.period='month';HNXHARV._state.anchor='2026-10-15';
    const n=await HNXHARV.pull();
    const A=HNXHARV._agg(HNXHARV._compare&&[]);
    switchView('pack_harvest');await sleep(500);const txt=(document.getElementById('view-pack_harvest')||{}).innerText||'';
    const A2=HNXHARV._agg((function(){const st=JSON.parse(localStorage.getItem('hydroPro_harvest_v1'));const L=[];Object.keys(st.receipts).forEach(id=>st.receipts[id].lines.forEach(l=>L.push(l)));return L.filter(l=>l.day>='2026-10-01'&&l.day<='2026-10-31');})());
    const prodTab=(MODULES.production.views||[]).some(v=>v.id==='prod_harvest'),packTab=(MODULES.packaging.views||[]).some(v=>v.id==='pack_harvest');
    return {lines:r.lines.length,gh1:r.lines[0].gh,gh4:r.lines[3].gh,variety3:r.lines[2].variety,grade3:r.lines[2].grade,grade1:r.lines[0].grade,day1:r.lines[0].day,lot1:r.lines[0].lot,day4:r.lines[3].day,pd:pd.date,pd2:pd2.date,badDate:bad.date,
      pulled:n,gh4kg:A2.mx.GH4['Curly Red Frisee B'],total:A2.total,ghs:A2.ghs.join('|'),shows:/30\\.71/.test(txt)&&/GH4/.test(txt),prodTab,packTab};})();`),
  expect:{lines:4,gh1:'GH4',gh4:'GH7',variety3:'Curly Red Frisee B',grade3:'W&T',grade1:'fresh',day1:'2026-10-01',lot1:'33',day4:'2026-09-30',pd:'2026-10-01',pd2:'2026-09-30',badDate:'',pulled:1,gh4kg:30.71,total:30.71,ghs:'GH4',shows:true,prodTab:true,packTab:true} },

{ name:'📒 Logbook exact match: logbook 30.71 kg for GH4 Curly Red Frisee B on 1 Oct = match; 30.00 kg = differs (−0.71) and stays open until a reason is written (then explained); a logbook line for GH9 is "not in SOS"; the report counts 2 unexplained differences; the mail goes to the saved @abapardes.com.ph list once (v21.37)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}const RECEIPT=${JSON.stringify(RECEIPT)};
    await sleep(6000);as('tester');
    HNXHARV._merge(HNXHARV._normalize({itemreceipts:[RECEIPT]}),'2026-10-01','2026-10-31');
    HNXHARV._logAdd({date:'2026-10-01',gh:'GH4',variety:'Curly Red Frisee B',crates:6,kg:30.71});
    const c1=HNXHARV._compare('2026-10-01','2026-10-31');const m1=c1.find(c=>c.gh==='GH4');
    localStorage.setItem('hydroPro_harvest_log_v1','[]');
    HNXHARV._logAdd({date:'2026-10-01',gh:'GH4',variety:'Curly Red Frisee B',crates:6,kg:30});
    HNXHARV._logAdd({date:'2026-10-01',gh:'GH9',variety:'Lollo',crates:1,kg:2});
    const c2=HNXHARV._compare('2026-10-01','2026-10-31');const d2=c2.find(c=>c.gh==='GH4'),n9=c2.find(c=>c.gh==='GH9');
    const rep1=HNXHARV._report('2026-10-01','2026-10-31','October 2026');
    HNXHARV._setReason(d2.key,'one crate weighed after the receipt was closed');
    const c3=HNXHARV._compare('2026-10-01','2026-10-31');const d3=c3.find(c=>c.gh==='GH4');
    /* monthly mail */
    localStorage.setItem('hydroPro_notify_cfg_v1',JSON.stringify({workerUrl:'https://nexi-notify.test.workers.dev',workerToken:'nt'}));
    const st=JSON.parse(localStorage.getItem('hydroPro_harvest_v1'));st.reportTo=['mea@abapardes.com.ph','x@gmail.com'];localStorage.setItem('hydroPro_harvest_v1',JSON.stringify(st));
    const sent=[];const f0=window.fetch;window.fetch=(u,o)=>{if(String(u).indexOf('/notify/mail')>=0){sent.push(JSON.parse(o.body));return Promise.resolve(new Response('{"ok":true}',{status:200}));}return f0.apply(window,arguments);};
    const ok=await HNXHARV._mail('2026-10-01','2026-10-31','October 2026',st.reportTo,false);
    window.fetch=f0;
    return {match:m1.state,matchOk:m1.ok,diffState:d2.state,diff:d2.diff,openBefore:!d2.ok,notInSos:n9.state,reportOpen:/2 unexplained differences/.test(rep1),reportTotal:/TOTAL: 30\\.71 kg/.test(rep1),explained:d3.ok&&d3.state==='differs',
      mailed:ok,to:sent[0].to.join('|'),subject:sent[0].subject,bodyHasGH4:/GH4: 30\\.71 kg/.test(sent[0].text)};})();`),
  expect:{match:'match',matchOk:true,diffState:'differs',diff:-0.71,openBefore:true,notInSos:'not in SOS',reportOpen:true,reportTotal:true,explained:true,mailed:true,to:'mea@abapardes.com.ph',subject:'Harvest report — October 2026',bodyHasGH4:true} },
];
