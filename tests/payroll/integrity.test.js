/* v21.06: 🕵 Attendance Integrity (owners only) */
module.exports=[
{ name:'🕵 clock ID PROD033 (Mary Grace) scanned 06:55 + 07:40 and 17:02 + 17:30 on 21 Sep → "one clock ID, two people?"; scans on 22 Sep while she is recorded ON LEAVE (authorized, by jinky) → critical; PROD099 scanning but linked to nobody; unlinking PROD022 is audited and kept in the link history; the history screen shows her raw scans vs the record (v21.06)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([
      {id:'MG',name:'OCIER, MARY GRACE',status:'Active',salaryCategory:'production',dailyRate:600},
      {id:'ST',name:'STUDENT, ANA',status:'Active',salaryCategory:'production',dailyRate:600}]));
    localStorage.setItem('hydroPro_bio_map_v1',JSON.stringify({PROD033:'MG',PROD022:'ST'}));
    localStorage.setItem('hydroPro_attendance',JSON.stringify({'2026-09-22':{MG:{status:'authorized',editedBy:'jinky',reason:'leave'}}}));},
  run:async()=>{
    window.__hnxBioLastDays=()=>[
      {date:'2026-09-21',punches:[{userId:'PROD033',time:'06:55'},{userId:'PROD033',time:'07:40'},{userId:'PROD033',time:'17:02'},{userId:'PROD033',time:'17:30'},{userId:'PROD099',time:'07:10'}]},
      {date:'2026-09-22',punches:[{userId:'PROD033',time:'07:05'},{userId:'PROD033',time:'17:01'}]}];
    const F=hnxIntegrityScan();
    const kinds=F.map(f=>f.kind+'@'+(f.date||'')+'@'+(f.clockId||f.empId||'')).sort();
    await sleep(4500);
    window.confirm=()=>true;
    hnxBioUnmap('PROD022');await sleep(300);
    const aud=JSON.parse(localStorage.getItem('hydroPro_audit')||'[]').some(a=>/PROD022 UNLINKED/.test(a.d));
    const hist=JSON.parse(localStorage.getItem('hydroPro_bio_map_hist_v1')||'[]').some(h=>(h.changes||[]).some(c=>c.id==='PROD022'&&c.from==='ST'&&c.to===''));
    const P=hnxIntegrityPerson('MG');
    switchView('hr_integrity');await sleep(1500);
    const txt=(document.getElementById('view-hr_integrity')||{}).textContent||'';
    return {kinds,aud,hist,ids:P.clockIds,raw21:(P.scans.find(x=>x.date==='2026-09-21')||{}).raw,edit22:(P.edits[0]||{}).by,screen:/Attendance Integrity/.test(txt)&&/CRITICAL/.test(txt)};},
  expect:{kinds:['scan-while-absent@2026-09-22@PROD033','two-people@2026-09-21@PROD033','unmapped@2026-09-21@PROD099'],aud:true,hist:true,ids:['PROD033'],
    raw21:['06:55','07:40','17:02','17:30'],edit22:'jinky',screen:true} },
{ name:'🕵 Attendance Integrity is hidden from and refused to Jinky (admin 2) — owners only (v21.06)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Jinky S. Pagtama',passwordHash:'x',role:'admin_secondary',active:true}]));},
  run:async()=>{
    await sleep(1600);
    const v=(MODULES.hr.views||[]).find(x=>x.id==='hr_integrity');
    switchView('hr_integrity');await sleep(1500);
    const txt=(document.getElementById('view-hr_integrity')||{}).textContent||'';
    return {hidden:!!(v&&v.hidden),refused:/only/.test(txt)&&!/CRITICAL/.test(txt)};},
  expect:{hidden:true,refused:true} },

{ name:'🕵 📚 Load history reads a 90-day range from the clock store: an August day where PROD033 scanned 07:00 + 07:45 is flagged, and an old worker (no range support) is reported as needing a redeploy (v21.07)',
  seed:()=>{localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'MG',name:'OCIER, MARY GRACE',status:'Active'}]));
    localStorage.setItem('hydroPro_bio_map_v1',JSON.stringify({PROD033:'MG'}));
    localStorage.setItem('hydroPro_bio_cfg_v1',JSON.stringify({url:'https://bio.test',token:'t'}));},
  run:async()=>{
    let asked='';
    window.fetch=async(u)=>{asked=String(u);return {json:async()=>({ok:true,range:{from:'2026-06-27',to:'2026-09-25'},days:[{date:'2026-08-10',punches:[{userId:'PROD033',time:'07:00'},{userId:'PROD033',time:'07:45'}]}]})};};
    switchView('hr_integrity');await sleep(1500);
    await hnxIntegrityLoad('2026-06-27','2026-09-25');
    const F=hnxIntegrityScan().map(f=>f.kind+'@'+f.date);
    window.fetch=async()=>({json:async()=>({ok:true,days:[]})});
    await hnxIntegrityLoad('2026-06-27','2026-09-25');
    const txt=document.getElementById('view-hr_integrity').textContent;
    return {range:/from=2026-06-27&to=2026-09-25/.test(asked),F,old:/older version/.test(txt)};},
  expect:{range:true,F:['two-people@2026-08-10'],old:true} },
];
