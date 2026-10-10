/* v22.28 fleet audit L49: deleting an Administration › Fleet-AI daily log left no tombstone — the trip journal put its trip day back as
   PENDING within 30 s, where it could be approved and paid. */
module.exports=[
{ name:'🗑 Fleet-AI daily log L1 (Juan, 8 Oct, 3 trips, pending) deleted → its trip day t1 is gone and STAYS gone after the trip journal sweep (tombstoned, was back within 30 s); the log row is gone; the audit says so (v22.28)',
  requires:"window.__hnxFLEET&&typeof window.__hnxFLEET.dailyDel==='function'&&typeof window.hnxTripJournalSweep==='function'",
  run:async()=>{window.confirm=()=>true;window.showToast=()=>{};
    const day={id:'t1',date:'2026-10-08',truck:'ABC 123',driverId:'D1',helperId:'',trips:[{to:'Tablo'},{to:'Hotel'},{to:'Store'}],status:'pending',source:'fleet',fleetId:'L1',createdAt:Date.now()-60000,updatedAt:Date.now()-60000};
    localStorage.setItem('hydroPro_trip_log_v1',JSON.stringify([day]));window.hnxTripJournalPut(day);
    localStorage.setItem('hydroPro_admin_fleet_daily_v1',JSON.stringify([{id:'L1',date:'2026-10-08',vehicleId:'V1',tripLogId:'t1'}]));
    window.__hnxFLEET.dailyDel('L1');await sleep(50);
    const after=JSON.parse(localStorage.getItem('hydroPro_trip_log_v1')||'[]').map(x=>x.id);
    try{window.hnxTripJournalSweep(false);}catch(e){}await sleep(1500);
    const swept=JSON.parse(localStorage.getItem('hydroPro_trip_log_v1')||'[]').map(x=>x.id);
    const logs=JSON.parse(localStorage.getItem('hydroPro_admin_fleet_daily_v1')||'[]').map(x=>x.id);
    const au=JSON.parse(localStorage.getItem('hydroPro_audit')||'[]').some(x=>/removed with its Fleet-AI daily log/.test(String(x.d||'')));
    return {after,swept,logs,au};},
  expect:{after:[],swept:[],logs:[],au:true} }
];
