/* v23.28 — 📅 Memos of the day, review fixes (14 Oct 2026). Same fixture as memo-daily-v2306.test.js (FX: GH3 TORZAR team leader ₱150,
   CRUZ, REYES absent 13 Oct; GH5 GARCIA, SANTOS; DELA CRUZ, MARK supervises GH3 + GH5 ₱100; eight memos dated 13 Oct).
   Covers: a leaver present on the memo day is in the memo as payroll pays him; a memo inside an APPROVED (locked) run shows what the
   run paid; the HR menu opens the report for everyone in scope and on today; 🏢 Office pay hides an office HR memo's pesos from a
   pay-list person without it; the overlay clears the desktop rail and the phone tray; tables keep whole names on a phone; print
   headings never end a page and the printed card is compact. */
const {HELP}=require('./memo-daily-v2306.test.js');
const R=fn=>eval('(async()=>{'+HELP+'\nreturn ('+fn.toString()+')();})');

module.exports=[
{ name:'A leaver is in the memo as payroll pays him (review): LEAVER, LEO (Resigned, last day 13 Oct, GH3) and NOSTATUS, NINA (card with no status, GH5) present 13 Oct → D1 +₱450 (4 people), D2 −₱450 (4), D6 +₱400 (4), D8 ⏳ +₱400, D3 ⏳ −₱400; plus +₱1,250, minus −₱1,350, net −₱100; LEO +₱100 / −₱100 = payroll 8–14 Oct [100, 100], NINA approved +₱100 = payroll [100, 0]; every person’s approved part = calcEmployeePayroll',
  run:R(async()=>{
    const {E}=FX({leaver:true});
    const M=hnxMemoDay.model(D,D,{}),S=M.sum,by={};M.memos.forEach(m=>{by[m.id]=m;});
    const pay={};E.forEach(e=>{const l=calcEmployeePayroll(e,'2026-10-08','2026-10-14','weekly');pay[e.id]=[r2(l.memoAdd),r2(l.memoDed)];});
    const ap=p=>[r2(p.plus-p.waitPlus),r2(-(p.minus-p.waitMinus))];
    const payMatch=S.perPerson.length>0&&S.perPerson.every(p=>{const x=pay[p.empId];return !!x&&JSON.stringify(ap(p))===JSON.stringify(x);});
    const P=id=>S.perPerson.find(p=>p.empId===id)||{};
    return {d1:[by.D1.total,by.D1.people.length,by.D1.people.some(p=>p.empId==='L1')],d2:[by.D2.total,by.D2.people.length],d6:[by.D6.total,by.D6.people.length],
      d8:by.D8.total,d3:by.D3.total,tot:[S.plus,S.minus,S.net],leo:[P('L1').plus,P('L1').minus],nina:ap(P('L2')),payL1:pay.L1,payL2:pay.L2,payMatch};
  }),
  expect:{d1:[450,4,true],d2:[-450,4],d6:[400,4],d8:400,d3:-400,tot:[1250,-1350,-100],leo:[100,-100],nina:[100,0],payL1:[100,100],payL2:[100,0],payMatch:true}},

{ name:'A memo in an APPROVED (locked) run shows what the run paid (review): REYES was paid D1 +₱100 / D2 −₱100 in the locked week 8–14 Oct and her 13 Oct was corrected to absent afterwards → D1 +₱450 (4 people, REYES +₱100), D2 −₱450 (4), "⚠ Paid in the locked run: +₱450 (4 people) · today’s attendance gives +₱350 (3 people)"; approved 4 memos +₱750 / −₱950; REYES row 2 memos +₱100 / −₱100; plus +₱1,050, minus −₱1,250, net −₱200; a supervisor sees the note without pesos',
  run:R(async()=>{
    FX();
    /* the week was locked while REYES (W3) was present on 13 Oct; her day was corrected to absent afterwards */
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-10-08_2026-10-14',type:'weekly',periodStart:'2026-10-08',periodEnd:'2026-10-14',payday:'2026-10-17',status:'approved',lines:[
      {empId:'W1',name:'TORZAR, EDERLYN',memoList:[{id:'D1',kind:'good',amt:150},{id:'D2',kind:'bad',amt:150}]},
      {empId:'W2',name:'CRUZ, JUAN',memoList:[{id:'D1',kind:'good',amt:100},{id:'D2',kind:'bad',amt:100},{id:'D4',kind:'bad',amt:500}]},
      {empId:'W3',name:'REYES, ANA',memoList:[{id:'D1',kind:'good',amt:100},{id:'D2',kind:'bad',amt:100}]},
      {empId:'S1',name:'DELA CRUZ, MARK',memoList:[{id:'D1',kind:'good',amt:100},{id:'D2',kind:'bad',amt:100}]}]}]));
    const M=hnxMemoDay.model(D,D,{}),by={};M.memos.forEach(m=>{by[m.id]=m;});
    const h=hnxMemoDay.html(M);
    const w3=M.sum.perPerson.find(p=>p.empId==='W3')||{};
    AS('mark');const Ms=hnxMemoDay.model(D,D,{}),hs=hnxMemoDay.html(Ms);ASTESTER();
    return {d1:[by.D1.total,by.D1.people.length,by.D1.people.map(p=>p.empId+':'+p.amount).join(',')],d2:[by.D2.total,by.D2.people.length],locked:[by.D1.locked,by.D6.locked],
      pay:by.D1.payroll,note:h.includes('⚠ Paid in the locked run: +₱450 (4 people) · today’s attendance gives +₱350 (3 people)'),
      paid:[M.sum.paid.n,M.sum.paid.plus,M.sum.paid.minus],w3:[w3.n,w3.plus,w3.minus,w3.net].join(':'),tot:[M.sum.plus,M.sum.minus,M.sum.net],
      sup:hs.includes('⚠ The people paid in the locked run differ from today’s attendance')&&hs.indexOf('₱')<0,supRunsNoMoney:Ms.memos.every(m=>(m.runs||[]).every(r=>!('paid' in r)))};
  }),
  expect:{d1:[450,4,'W1:150,W2:100,W3:100,S1:100'],d2:[-450,4],locked:[true,false],pay:'✅ Paid — weekly run 2026-10-08 → 2026-10-14 (approved, locked)',note:true,
    paid:[4,750,-950],w3:'2:100:-100:0',tot:[1050,-1250,-200],sup:true,supRunsNoMoney:true}},

{ name:'HR & People → 📅 Memos of the day with HR VIEW only (review): pay-list Jinky gets the report with pesos and supervisor Mark his GH3 + GH5 without pesos — no 🔒; coming in from the menu opens on today (HR had opened 12 Oct before), re-opening the open view keeps the day',
  run:R(async()=>{
    FX();
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({jinky:{overrides:{'module:hr':'view'}},mark:{overrides:{'module:hr':'view'}}}));
    const out={};
    for(const un of ['jinky','mark']){
      AS(un);try{hnxMemoDay.close();}catch(e){}
      const menu=(getVisibleViews('hr')||[]).some(x=>(x&&(x.id||x))==='memo_day');
      try{switchView('dashboard');}catch(e){}await sleep(300);
      switchView('memo_day');await sleep(700);
      hnxMemoDay.set('day',D);await sleep(300);
      const v=document.getElementById('view-memo_day'),t=v?v.innerText:'';
      out[un]={menu,active:!!v&&v.classList.contains('active'),lock:t.indexOf('🔒 Memos of the day is for')>=0,report:t.indexOf('Memos of the day — Tue 13 Oct 2026')>=0,
        peso:t.indexOf('₱')>=0,sup:t.indexOf('Your greenhouses: GH3, GH5')>=0};
      try{switchView('dashboard');}catch(e){}await sleep(300);
    }
    ASTESTER();
    const T=hnxLocalToday();
    hnxMemoDay.open({from:'2026-10-12',to:'2026-10-12'});await sleep(600);
    switchView('memo_day');await sleep(400);const keep=hnxMemoDay.state().from;
    switchView('memos');await sleep(600);switchView('memo_day');await sleep(600);const back=hnxMemoDay.state();
    return {jinky:out.jinky,mark:out.mark,keep,back:back.from===T&&back.to===T&&!back.gh&&!back.type&&!back.status};
  }),
  expect:{jinky:{menu:true,active:true,lock:false,report:true,peso:true,sup:false},mark:{menu:true,active:true,lock:false,report:true,peso:false,sup:true},keep:'2026-10-12',back:true}},

{ name:'🏢 Office pay is owner-granted (review): pay-list Jinky WITHOUT 🏢 Office pay sees OFFICE, OLIVIA’s approved HR memo −₱1,200 as 🔒 (total and amount null, Excel amount blank) and the totals leave it out — HR −₱500, minus −₱1,150, "1 office memo counted without amounts"; with 🏢 Office pay on, and for HR, −₱1,200 shows (HR −₱1,700, minus −₱2,350)',
  run:R(async()=>{
    FX({office:true});
    const look=()=>{const M=hnxMemoDay.model(D,D,{}),o=M.memos.find(m=>m.id==='O_HR1')||{},h=hnxMemoDay.html(M);
      return {total:o.total,amt:(o.people||[]).map(p=>p.amount).join(','),hidden:!!o.amountHidden,hr:M.sum.byKind.hr.minus,minus:M.sum.minus,hiddenN:M.sum.hiddenN,
        badge:h.includes('🔒 Office pay'),line:h.includes('1 office memo counted without amounts'),counted:o.counted};};
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({jinky:{overrides:{},sensitive:{office:{on:false,by:'eyal',at:'2026-10-13T00:00:00Z'}}}}));
    AS('jinky');await sleep(2200);
    const off=look();
    const {wb}=await XL(()=>hnxMemoDay.excel({from:D,to:D}));const row=ROWS(wb.getWorksheet('Memo lines')).out.find(r=>r['Memo no.']==='O_HR1')||{};
    const xlBlank=typeof row['Amount (₱)']!=='number'&&typeof row['Memo total (₱)']!=='number'&&row['Counted']==='yes';
    localStorage.setItem('hydroPro_user_perms',JSON.stringify({jinky:{overrides:{},sensitive:{office:{on:true,by:'eyal',at:'2026-10-13T00:00:00Z'}}}}));
    await sleep(2200);const on=look();
    ASTESTER();const hr=look();
    return {off,xlBlank,on:[on.total,on.hidden,on.hr,on.minus],hr:[hr.total,hr.hidden,hr.hr,hr.minus]};
  }),
  expect:{off:{total:null,amt:'',hidden:true,hr:-500,minus:-1150,hiddenN:1,badge:true,line:true,counted:true},xlBlank:true,on:[-1200,false,-1700,-2350],hr:[-1200,false,-1700,-2350]}},

{ name:'Desktop 1366×768 (review): the supervisor overlay starts right of the left rail — ‹, the From date and the heading are clickable inside it; in the HR view the toolbar pins below the app’s top bar and 🖨 Print / PDF stays clickable after scrolling to the last memo',
  viewport:{width:1366,height:768},
  run:R(async()=>{
    FX();await sleep(300);
    const rail=document.getElementById('hnxRail'),railed=document.body.classList.contains('hnx-railed')&&!!rail&&getComputedStyle(rail).display!=='none';
    AS('mark');hnxMemoDay.open({from:D,to:D});await sleep(900);
    const ov=document.getElementById('hnxMemoDayOv');
    const hit=sel=>{const el=ov.querySelector(sel);if(!el)return 'none';const r=el.getBoundingClientRect();const x=document.elementFromPoint(r.left+Math.min(8,r.width/2),r.top+r.height/2);return !!x&&ov.contains(x);};
    const inOv={prev:hit('.hnx-md-bar button'),from:hit('.hnx-md-bar input[type=date]'),head:hit('.hnx-md-h')};
    const clear=!railed||ov.getBoundingClientRect().left>=rail.getBoundingClientRect().right-1;
    hnxMemoDay.close();ASTESTER();
    hnxMemoDay.open({from:D,to:D});await sleep(900);
    const host=document.getElementById('hnxMemoDayViewBody'),ms=host.querySelectorAll('.hnx-md-memo');ms[ms.length-1].scrollIntoView();await sleep(500);
    const pb=[...host.querySelectorAll('.hnx-md-bar button')].find(b=>/Print \/ PDF/.test(b.textContent)),pr=pb.getBoundingClientRect();
    const px=document.elementFromPoint(pr.left+pr.width/2,pr.top+pr.height/2);
    return {inOv,clear,print:!!px&&(px===pb||pb.contains(px)),dbg:{railed,barTop:Math.round(host.querySelector('.hnx-md-bar').getBoundingClientRect().top),y:Math.round(window.scrollY)}};
  }),
  expect:{inOv:{prev:true,from:true,head:true},clear:true,print:true}},

{ name:'Phone 400×844 (review): Per person keeps whole names (Employee column ≥ 100 px, a row under 80 px), the toolbar is not pinned (position static), and the end of the overlay clears the docked tray — the last memo’s “Open memo →” is tappable',
  viewport:{width:400,height:844},
  run:R(async()=>{
    FX();AS('jinky');hnxMemoDay.open({from:D,to:D});await sleep(1200);
    const ov=document.getElementById('hnxMemoDayOv');
    const pp=[...ov.querySelectorAll('.hnx-md-sec')].find(s=>{const t=s.querySelector('.hnx-md-st');return !!t&&/Per person/i.test(t.textContent);});
    const td=pp&&pp.querySelector('tbody tr td'),tr=pp&&pp.querySelector('tbody tr');
    const col=td?Math.round(td.getBoundingClientRect().width):0,rowH=tr?Math.round(tr.getBoundingClientRect().height):0;
    const pos=getComputedStyle(ov.querySelector('.hnx-md-bar')).position;
    ov.scrollTop=ov.scrollHeight;await sleep(400);
    const ms=ov.querySelectorAll('.hnx-md-memo'),last=ms[ms.length-1],btn=last.querySelector('button');
    const r=btn.getBoundingClientRect(),x=document.elementFromPoint(r.left+Math.min(10,r.width/2),r.top+r.height/2);
    const tray=document.getElementById('hnxPhoneTray');
    hnxMemoDay.close();ASTESTER();
    return {col100:col>=100,row80:rowH>0&&rowH<80,pos,lastTap:!!x&&(x===btn||btn.contains(x)),dbg:{col,rowH,tray:!!tray,trayH:tray?tray.offsetHeight:0,btnBottom:Math.round(r.bottom),hit:x?String(x.id||x.className||x.tagName).slice(0,60):null,vh:innerHeight}};
  }),
  expect:{col100:true,row80:true,pos:'static',lastTap:true}},

{ name:'Print layout (review): h2, h3, the section labels, day headers and rounds never end a page (break-after:avoid); the printed card is compact — label beside its text, 18 mm photos, approval · payroll · follow-up in one row (D2 has all three)',
  run:R(async()=>{
    FX();FU();window.__pw=[];const po=window.open;window.open=POP();let h='';
    try{await hnxMemoDay.print({from:D,to:D});await sleep(600);h=(window.__pw[0]||{}).html||'';}finally{window.open=po;}
    const d2=h.slice(h.indexOf('class="mno">D2<'));
    return {avoid:/h2,h3,\.k,\.dayh,\.rnd\{break-after:avoid;page-break-after:avoid\}/.test(h),thumb:/\.thumb\{width:18mm;height:18mm/.test(h),
      sec:h.includes('<div class="sec"><div class="k">👥 People'),trio:d2.indexOf('<div class="trio t3">')>=0&&d2.indexOf('<div class="trio t3">')<d2.indexOf('class="mno">D3<'),
      trio2:h.includes('<div class="trio t2">'),tables:/table th,table td\{overflow-wrap:break-word\}/.test(h)};
  }),
  expect:{avoid:true,thumb:true,sec:true,trio:true,trio2:true,tables:true}}
];
