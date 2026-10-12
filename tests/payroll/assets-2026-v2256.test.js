/* v22.56 (Eyal, 12 Oct): Accounting → 🏗 Assets → 📅 Assets 2026 — the 2025 audit carried forward + 2026 additions.
   Numbers come from the design prototype (scratch roll-forward on the real DATA + the 28-Sep-2026 schedule). */
const fs=require('fs'),zlib=require('zlib');
/* the module's own writer: a STORED zip of XML parts, text as inline strings, numbers as <v> */
function unzipStored(buf){const out={};let p=0;while(p+30<=buf.length&&buf.readUInt32LE(p)===0x04034b50){const method=buf.readUInt16LE(p+8),csize=buf.readUInt32LE(p+18),nlen=buf.readUInt16LE(p+26),xlen=buf.readUInt16LE(p+28);const name=buf.slice(p+30,p+30+nlen).toString('utf8');const data=buf.slice(p+30+nlen+xlen,p+30+nlen+xlen+csize);out[name]=method===0?data.toString('utf8'):zlib.inflateRawSync(data).toString('utf8');p+=30+nlen+xlen+csize;}return out;}
function colIdx(c){let n=0;for(const ch of c)n=n*26+(ch.charCodeAt(0)-64);return n-1;}
function unesc(t){return String(t).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');}
function sheetRows(xml){const rows=[];const rr=/<row r="(\d+)">([\s\S]*?)<\/row>/g;let m;while((m=rr.exec(xml))){const r=[];const cc=/<c r="([A-Z]+)\d+"(?: t="inlineStr")?>(?:<v>([^<]*)<\/v>|<is><t[^>]*>([\s\S]*?)<\/t><\/is>)<\/c>/g;let c;while((c=cc.exec(m[2]))){r[colIdx(c[1])]=c[2]!==undefined?parseFloat(c[2]):unesc(c[3]);}rows[+m[1]-1]=r;}return rows;}
function readXlsx(path){const z=unzipStored(fs.readFileSync(path));const wb=z['xl/workbook.xml']||'';const names=[];const sr=/<sheet name="([^"]*)"/g;let m;while((m=sr.exec(wb)))names.push(unesc(m[1]));const out={};names.forEach((n,i)=>{out[n]=sheetRows(z['xl/worksheets/sheet'+(i+1)+'.xml']||'');});return out;}
const r2=x=>Math.round(x*100)/100;
/* the owner's decisions seeded straight into the module's store (plain JSON, same shape st() reads) */
const seedStore=o=>'localStorage.setItem("hydroPro_asset_recon_v1",JSON.stringify('+JSON.stringify(Object.assign({fixes:{},answers:{},eba:{},signoff:{},v:1},o))+'));';
const S3=seedStore({fixes:{9:1},eba:{108:'no'}});
const S4=seedStore({moves:{4:{uc:'Office',type:'Funiture & Fixtures',sub:'Computers'}},edits:{4:{cost:'200000',lifeS:'10'}}});
const S7=seedStore({newAssets:[{ref:-77,desc:'OLD PUMP (registered late)',price:600000,qty:1,acq:'2024-01-15',lifeYears:5,uc:'Production',type:'Machinery & Equipment',pay:'Cash',sub:'',by:'Tester',at:'2026-10-01'}]});
module.exports=[
{ name:'📅 Assets 2026 clean store as at 30 Sep 2026: A = 243 assets, opening NBV ₱125,323,115.34 (cost ₱234,543,968.08 − dep ₱109,220,852.74); B = the 5 audit 2026 rows ₱19,923,693.22 (#142 #143 #226 #229 #230); 2026 depreciation ₱17,337,217.18; NBV ₱127,909,591.38; check 0; no date #34 #141 #196; the tab is first in SEE and a quick button (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);hnxArYrAt('2026-09-30');await sleep(200);hnxArTab('yr');await sleep(700);
    const V=hnxArAssets2026('2026-09-30');const v=document.getElementById('view-acct_assets');const txt=v.innerText;
    const sel=v.querySelector('select[onchange="hnxArTab(this.value)"]');const first=sel&&sel.querySelector('optgroup option');
    const quick=[...v.querySelectorAll('button')].find(b=>/^📅 Assets 2026$/.test(b.textContent.trim()));
    const head=(v.querySelector('a[onclick="hnxArTab(\'yr\')"]')||{}).textContent||'';
    return {Y:V.Y,asOf:V.asOf,A:V.A.length,B:V.B.length,C:V.C.length,openN:V.T.openN,openCost:V.T.openCost,openDep:V.T.openDep,openNbv:V.T.openNbv,addN:V.T.addN,addCost:V.T.addCost,addRefs:V.B.slice().sort((a,b)=>a-b),dep:V.T.dep,closeN:V.T.closeN,closeNbv:V.T.closeNbv,check:V.T.check,twins:V.twins.length,future:V.future.length,noDate:V.noDate.slice().sort((a,b)=>a-b),
      delivered:V.changed.deliveredN+'|'+V.changed.deliveredNbv,title:/Assets 2026 — as at 30 Sep 2026/.test(txt),bridgeOpen:/125,323,115\.34/.test(txt),bridgeClose:/127,909,591\.38/.test(txt),tick:/the bridge ties to the centavo/.test(txt),
      firstInSee:first?first.value+'|'+first.parentNode.label.replace(/^\S+\s/,''):'',quickBtn:!!quick,header:head.trim()};},
  expect:{Y:2026,asOf:'2026-09-30',A:243,B:5,C:0,openN:243,openCost:234543968.08,openDep:109220852.74,openNbv:125323115.34,addN:5,addCost:19923693.22,addRefs:[142,143,226,229,230],dep:17337217.18,closeN:248,closeNbv:127909591.38,check:0,twins:0,future:0,noDate:[34,141,196],delivered:'243|125323115.34',title:true,bridgeOpen:true,bridgeClose:true,tick:true,firstInSee:'yr|SEE',quickBtn:true,header:'📅 Assets 2026'} },
{ name:'📅 Assets 2026 after 📥 Load the 28-Sep-2026 schedule (34 added): the 4 twins #142 #143 #229 #230 are counted once (PO0522-01 PO0202-03 PO0501-01 PO0527-02 left out), B = 35 additions ₱25,013,699.51, dep ₱17,609,037.30, NBV ₱132,727,777.55, check 0; ⚠ To resolve lists them; the lapsing card says "34 rows · 4 already in the 2025 audit file (#142 #143 #229 #230)" (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);hnxArTab('new');await sleep(400);const r1=hnxArLoadLapsing2026();await sleep(500);
    const cardTxt=document.getElementById('view-acct_assets').innerText;
    hnxArYrAt('2026-09-30');hnxArTab('yr');await sleep(700);
    const V=hnxArAssets2026('2026-09-30');const txt=document.getElementById('view-acct_assets').innerText;
    const tw=V.twins.slice().sort((a,b)=>a.audit-b.audit);
    return {added:r1.added,A:V.A.length,B:V.B.length,C:V.C.length,addN:V.T.addN,addCost:V.T.addCost,dep:V.T.dep,closeN:V.T.closeN,closeNbv:V.T.closeNbv,check:V.T.check,
      twins:tw.map(t=>t.audit),twinPo:tw.map(t=>t.po.replace(/^2026-21-/,'')),twinFilesNotInB:tw.every(t=>V.B.indexOf(t.file)<0&&V.rows.every(r=>r.ref!==t.file)),auditRowsInB:tw.every(t=>V.B.indexOf(t.audit)>=0),
      resolveCard:/same purchase in two places/.test(txt)&&/#230/.test(txt)&&/#143/.test(txt),badge:V.rows.filter(r=>r.sec==='B'&&/counted once/.test(r.status)).map(r=>r.ref).sort((a,b)=>a-b),
      cardLine:/34 rows · 4 already in the 2025 audit file \(#142 #143 #229 #230\) → counted once in Assets 2026/.test(cardTxt),cardBtn:/📅 Assets 2026 — the 2025 audit carried forward/.test(cardTxt)};},
  expect:{added:34,A:243,B:35,C:0,addN:35,addCost:25013699.51,dep:17609037.3,closeN:278,closeNbv:132727777.55,check:0,twins:[142,143,229,230],twinPo:['PO0522-01','PO0202-03','PO0501-01','PO0527-02'],twinFilesNotInB:true,auditRowsInB:true,resolveCard:true,badge:[142,143,229,230],cardLine:true,cardBtn:true} },
{ name:'📅 Assets 2026 taken out: #108 marked gone (EBA no) and the disposal #9 marked done → section C with their 31 Dec 2025 NBV ₱74,066.07 + ₱74,202.40 = ₱148,268.47 (cost ₱411,978.61), A = 241, dep ₱17,285,437.71, NBV ₱127,813,102.38, check 0, status "taken out — …"; the 2027 view does not show them (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  seed:new Function(S3),
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);hnxArYrAt('2026-09-30');hnxArTab('yr');await sleep(700);
    const V=hnxArAssets2026('2026-09-30');const row=r=>V.rows.find(x=>x.ref===r);const txt=document.getElementById('view-acct_assets').innerText;
    const V7=hnxArAssets2026('2027-03-31');
    return {A:V.A.length,B:V.B.length,C:V.C.slice().sort((a,b)=>a-b),openN:V.T.openN,openNbv:V.T.openNbv,dispN:V.T.dispN,dispCost:V.T.dispCost,dispNbv:V.T.dispNbv,dep:V.T.dep,closeN:V.T.closeN,closeNbv:V.T.closeNbv,check:V.T.check,
      s9:row(9).status,s108:row(108).status,r9:[row(9).sec,row(9).openNbv,row(9).removed,row(9).closeNbv],r108:[row(108).sec,row(108).openNbv,row(108).removed],
      strip:/148,268\.47/.test(txt)&&/2 assets/.test(txt),changedLine:/2 taken out/.test(txt),in2027:V7.rows.filter(r=>r.ref===9||r.ref===108).length,open2027:V7.T.openN,check2027:V7.T.check};},
  expect:{A:241,B:5,C:[9,108],openN:243,openNbv:125323115.34,dispN:2,dispCost:411978.61,dispNbv:148268.47,dep:17285437.71,closeN:246,closeNbv:127813102.38,check:0,
    s9:'taken out — written off (done in QB)',s108:'taken out — gone (EBA: does not exist)',r9:['C',74202.4,74202.4,0],r108:['C',74066.07,74066.07],strip:true,changedLine:true,in2027:0,open2027:246,check2027:0} },
{ name:'📅 Assets 2026 move + edit: #4 moved to Office → Funiture & Fixtures → Computers and edited to ₱200,000 · 10 years → the row shows the new sub-account number (…-001), sub-account Computers, cost ₱200,000, the audit’s dep ₱141,660.14 kept (NBV ₱58,339.86), ₱1,620.55 a month, 2026 dep ₱14,584.97, NBV ₱43,754.89; opening ₱125,361,218.04, check 0; the changed line counts 1 move of your own beside the automatic sub-accounts (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  seed:new Function(S4),
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);hnxArYrAt('2026-09-30');hnxArTab('yr');await sleep(700);
    const V=hnxArAssets2026('2026-09-30');const r=V.rows.find(x=>x.ref===4);const txt=document.getElementById('view-acct_assets').innerText;
    return {sec:r.sec,uc:r.uc,type:r.type,sub:r.sub,acctSub:/-001$/.test(r.acct)&&r.acct!=='1025-001-002-007',acctMom:r.acct.slice(0,8),cost:r.cost,openDep:r.openDep,openNbv:r.openNbv,mon:r.mon,dep:r.dep,closeDep:r.closeDep,closeNbv:r.closeNbv,life:r.life,
      A:V.A.length,openNbv:V.T.openNbv,dep:V.T.dep,closeNbv:V.T.closeNbv,check:V.T.check,changed:V.changed.editsN+'|'+V.changed.editsDelta+'|'+(V.changed.moves-V.changed.autoSubs),autoSubsListed:V.changed.autoSubs>100,line:/record edits \+₱38,102\.70 \(1 edited\) · 0 registered in Nexi with a pre-2026 date/.test(txt)&&/(\d+) moves, of which (\d+) automatic sub-accounts · 0 taken out/.test(txt),manualInLine:(function(){var m=txt.match(/(\d+) moves, of which (\d+) automatic sub-accounts/);return m?(+m[1]-+m[2]):null;})(),inOffice:/Office/.test(txt)};},
  expect:{sec:'A',uc:'Office',type:'Funiture & Fixtures',sub:'Computers',acctSub:true,acctMom:'1025-003',cost:200000,openDep:141660.14,openNbv:58339.86,mon:1620.55,dep:14584.97,closeDep:156245.11,closeNbv:43754.89,life:10,
    A:243,openNbv:125361218.04,dep:17336624.28,closeNbv:127948286.98,check:0,changed:'1|38102.7|1',autoSubsListed:true,line:true,manualInLine:1,inOffice:true} },
{ name:'📅 Assets <year> date picker: 2025-06-30 is clamped to 31 Dec 2025 (dep 0, NBV ₱125,323,115.34, the 5 audit 2026 rows listed as future); 31 Jan 2027 reads "Assets 2027" opening from the 31 Dec 2026 closing (248 assets, ₱121,997,702.18), Jan dep ₱1,968,147.78, NBV ₱120,029,554.40, check 0; the input has min 2025-12-31 (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);hnxArTab('yr');await sleep(300);
    hnxArYrAt('2025-06-30');await sleep(600);const v=document.getElementById('view-acct_assets');const inp=v.querySelector('#arYrAt');const t1=v.innerText;const V1=hnxArAssets2026(inp.value);
    hnxArYrAt('2027-01-31');await sleep(600);const t2=v.innerText;const V2=hnxArAssets2026('2027-01-31');const close26=hnxArAssets2026('2026-12-31').T;
    return {clamped:inp.value,min:inp.getAttribute('min'),t1:/Assets 2026 — as at 31 Dec 2025/.test(t1),dep1:V1.T.dep,nbv1:V1.T.closeNbv,future1:V1.future.slice().sort((a,b)=>a-b),B1:V1.B.length,
      Y2:V2.Y,t2:/Assets 2027 — as at 31 Jan 2027/.test(t2),open2:V2.T.openN+'|'+V2.T.openNbv,sameAsClose26:V2.T.openNbv===close26.closeNbv&&V2.T.openN===close26.closeN,dep2:V2.T.dep,nbv2:V2.T.closeNbv,check2:V2.T.check,B2:V2.B.length,
      sel2:[...v.querySelectorAll('select[onchange="hnxArTab(this.value)"] option')].some(o=>o.value==='yr'&&/Assets 2027/.test(o.textContent)),seeLbl:/NBV 31 Dec 2026/.test(t2)};},
  expect:{clamped:'2025-12-31',min:'2025-12-31',t1:true,dep1:0,nbv1:125323115.34,future1:[142,143,226,229,230],B1:0,Y2:2027,t2:true,open2:'248|121997702.18',sameAsClose26:true,dep2:1968147.78,nbv2:120029554.4,check2:0,B2:0,sel2:true,seeLbl:true} },
{ name:'📅 Assets 2026 → Excel (schedule loaded, 30 Sep 2026): file APTI-Assets-2026-lapsing-as-at-2026-09-30.xlsx, sheet "Assets 2026" with 278 asset rows = A 243 + B 35 in the lapsing layout (MOTHER ACCOUNT … NEXI #), GRAND TOTAL cost ₱259,557,667.59 / NBV ₱132,727,777.55 = the screen, the month columns sum to the 2026 dep ₱17,609,037.30, roll-forward check 0; sheet "To resolve" lists the 4 twins; ⬇ ALL tabs carries both sheets (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  drive:async(pg)=>{
    await pg.waitForTimeout(6000);await pg.evaluate(()=>{switchView('acct_assets');});await pg.waitForTimeout(1500);
    await pg.evaluate(()=>{hnxArTab('new');hnxArLoadLapsing2026();hnxArYrAt('2026-09-30');hnxArTab('yr');});await pg.waitForTimeout(800);
    const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:30000}),pg.evaluate(()=>{hnxArXlTab();})]);
    const wb=readXlsx(await dl.path());const sh=wb['Assets 2026']||[],tz=wb['To resolve']||[];
    const H=sh[2]||[];const iRef=H.indexOf('NEXI #'),iCost=H.indexOf('COST'),iCn=H.findIndex(x=>/^NET BOOK VALUE 2026-09-30$/.test(String(x))),iDep=H.findIndex(x=>/^2026 DEPRECIATION TO 2026-09-30$/.test(String(x))),iJan=H.indexOf('JAN 2026'),iSep=H.indexOf('SEP 2026'),iOct=H.indexOf('OCT 2026');
    const assetRows=sh.filter(r=>r&&typeof r[iRef]==='number');
    const grand=sh.find(r=>r&&/^GRAND TOTAL/.test(String(r[0]||'')));
    const months=r2(assetRows.reduce((a,r)=>a+r.slice(iJan,iSep+1).reduce((p,v)=>p+(+v||0),0),0));
    const rf=sh.find(r=>r&&/^check \(must be 0\.00\)/.test(String(r[0]||'')));
    const twinHdr=tz.findIndex(r=>r&&r[0]==='AUDIT #');const twins=[];for(let k=twinHdr+1;k<tz.length;k++){const r=tz[k];if(!r||typeof r[0]!=='number')break;twins.push(r[0]);}twins.sort((a,b)=>a-b);
    const scr=await pg.evaluate(()=>{const V=hnxArAssets2026('2026-09-30');return {AB:V.A.length+V.B.length,A:V.A.length,B:V.B.length,closeCost:V.T.closeCost,closeNbv:V.T.closeNbv,dep:V.T.dep};});
    const [dl2]=await Promise.all([pg.waitForEvent('download',{timeout:60000}),pg.evaluate(()=>{hnxArXlAll();})]);
    const all=Object.keys(readXlsx(await dl2.path()));
    return {file:dl.suggestedFilename(),rows:assetRows.length,AB:scr.AB,A:scr.A,B:scr.B,head:[H[0],H[4],H[11],H[12],H[iRef]],octBlank:assetRows.every(r=>r[iOct]===undefined||r[iOct]===''),
      grandCost:grand&&grand[iCost],grandNbv:grand&&grand[iCn],grandDep:grand&&grand[iDep],scrCost:scr.closeCost,scrNbv:scr.closeNbv,scrDep:scr.dep,months,rfCheck:rf&&rf[iCost],twins,
      allHas:all.indexOf('Assets 2026')>=0&&all.indexOf('To resolve')>=0,allFirst:all[0]};},
  expect:{'drive.file':'APTI-Assets-2026-lapsing-as-at-2026-09-30.xlsx','drive.rows':278,'drive.AB':278,'drive.A':243,'drive.B':35,'drive.head':['MOTHER ACCOUNT','Equipment Per Lapsing','COST','MONTHLY AMORTIZATION','NEXI #'],'drive.octBlank':true,
    'drive.grandCost':259557667.59,'drive.grandNbv':132727777.55,'drive.grandDep':17609037.3,'drive.scrCost':259557667.59,'drive.scrNbv':132727777.55,'drive.scrDep':17609037.3,'drive.months':17609037.3,'drive.rfCheck':0,'drive.twins':[142,143,229,230],'drive.allHas':true,'drive.allFirst':'00 Overview'} },
{ name:'📅 Assets 2026 importer bug: a New Asset ₱600,000 · 5y bought 2024-01-15 (registered late) opens with straight-line dep to 31 Dec 2025 ₱230,000 (23 months), NBV ₱370,000, then ₱10,000 a month → 2026 dep ₱90,000, NBV ₱280,000 at 30 Sep 2026; the record says "Audit says depreciated ₱230,000"; counted as "1 registered in Nexi with a pre-2026 date"; opening ₱125,693,115.34, check 0 (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  seed:new Function(S7),
  run:async()=>{
    await sleep(6000);switchView('acct_assets');await sleep(1500);hnxArYrAt('2026-09-30');hnxArTab('yr');await sleep(700);
    const V=hnxArAssets2026('2026-09-30');const r=V.rows.find(x=>x.ref===-77);const txt=document.getElementById('view-acct_assets').innerText;
    hnxArAsAt('2026-09-30');hnxArGo(-77);await sleep(700);const rec=document.getElementById('view-acct_assets').innerText;
    const dep=(rec.match(/AUDIT SAYS DEPRECIATED \(31 DEC 2025\)\s*\n?\s*(₱[\d,]+)/i)||[])[1]||'';const bv=(rec.match(/AUDIT SAYS BOOK VALUE \(31 DEC 2025\)\s*\n?\s*(₱[\d,]+)/i)||[])[1]||'';
    return {sec:r.sec,cost:r.cost,openDep:r.openDep,openNbv:r.openNbv,mon:r.mon,dep:r.dep,closeDep:r.closeDep,closeNbv:r.closeNbv,A:V.A.length,openN:V.T.openN,openNbv:V.T.openNbv,check:V.T.check,preNew:V.changed.preNewN+'|'+V.changed.preNewNbv,line:/1 registered in Nexi with a pre-2026 date \(₱370,000\.00\)/.test(txt),recDep:dep,recBv:bv};},
  expect:{sec:'A',cost:600000,openDep:230000,openNbv:370000,mon:10000,dep:90000,closeDep:320000,closeNbv:280000,A:244,openN:244,openNbv:125693115.34,check:0,preNew:'1|370000',line:true,recDep:'₱230,000',recBv:'₱370,000'} },
{ name:'📇 Asset Records at 30 Sep 2026 and 📅 Assets 2026 agree asset by asset (248 rows, 0 differences in Depreciated / Book value): #68 — whose dep the audit zeroed — is now ₱144,002.80 depreciated (₱16,000.31 a month, NBV ₱864,016.80) on both screens; the Dep. JE left-to-run follows the same opening (v22.56)',
  requires:"typeof hnxArAssets2026==='function'",
  drive:async(pg)=>{
    await pg.waitForTimeout(6000);await pg.evaluate(()=>{switchView('acct_assets');});await pg.waitForTimeout(1500);
    await pg.evaluate(()=>{hnxArAsAt('2026-09-30');hnxArGroup('');hnxArTab('recs');});await pg.waitForTimeout(1200);
    const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:60000}),pg.evaluate(()=>{hnxArXlTab();})]);
    const sh=readXlsx(await dl.path())['02 Asset Records']||[];const H=sh[0]||[];
    const iDep=H.indexOf('Depreciated to 2026-09-30'),iBv=H.indexOf('Book value at 2026-09-30'),iMon=H.indexOf('Monthly depreciation');
    const recs={};sh.slice(1).forEach(r=>{if(r&&typeof r[0]==='number')recs[r[0]]={dep:r[iDep],bv:r[iBv],mon:r[iMon]};});
    const V=await pg.evaluate(()=>hnxArAssets2026('2026-09-30'));
    let n=0,diff=[];V.rows.forEach(r=>{const x=recs[r.ref];if(!x||typeof x.dep!=='number')return;n++;if(Math.abs(x.dep-r.closeDep)>0.005||Math.abs(x.bv-r.closeNbv)>0.011)diff.push(r.ref+':'+x.dep+'/'+r.closeDep);});
    const r68=V.rows.find(r=>r.ref===68),x68=recs[68];
    return {rows:Object.keys(recs).length,compared:n,diff:diff.slice(0,5),yr68:[r68.closeDep,r68.closeNbv,r68.mon],rec68:[x68.dep,x68.bv,r2(x68.mon)],noDateUnknown:[34,141,196].every(r=>typeof recs[r].dep!=='number')};},
  expect:{'drive.rows':248,'drive.compared':245,'drive.diff':[],'drive.yr68':[144002.8,864016.8,16000.31],'drive.rec68':[144002.8,864016.8,16000.31],'drive.noDateUnknown':true} },
];
