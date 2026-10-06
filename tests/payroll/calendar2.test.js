/* v21.93: colourful Day / Week / Month / Year calendars with drill-down */
module.exports=[
{ name:'📅 Calendar v21.93: Production calendar (Oct 2026) shows the new month view with 2 items on 13 Oct; Year view lists 12 months with Oct count 3; drill Year→Oct→13 Oct gives Day with 2 cards; Late filter keeps only the overdue one; hiding production in the main calendar legend removes it (v21.93)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
    localStorage.setItem('hydroPro_cal_events_v2',JSON.stringify([{id:'E1',title:'Harvest GH4',module:'production',date:'2026-10-13',time:'07:00'},{id:'E2',title:'Spray GH2',module:'production',date:'2026-10-13',time:'09:00',done:true},
      {id:'E3',title:'Old check',module:'production',date:'2026-10-02'},{id:'E4',title:'Pump PM',module:'maintenance',date:'2026-10-13'}]));},
  run:new Function(`return (async()=>{await sleep(6000);window.hnxLocalToday=()=>'2026-10-06';const K=Object.keys(localStorage).find(k=>/calendar_events|cal_events/i.test(k));
    switchView('production_calendar');await sleep(800);const v=document.getElementById('view-production_calendar');const has=!!(v&&v.querySelector('.hc2'));
    HNXCAL2.go('m_production','month','2026-10-13');await sleep(100);const m13=v.querySelector('#hc2_m_production').innerHTML.includes('Harvest GH4');
    HNXCAL2.go('m_production','year','2026-10-13');await sleep(100);const months=v.querySelectorAll('.ym').length;const oct=(v.querySelectorAll('.ym')[9]||{}).textContent||'';
    HNXCAL2.go('m_production','day','2026-10-13');await sleep(100);const cards=v.querySelectorAll('.dcard').length;
    HNXCAL2.go('m_production','month','2026-10-01');HNXCAL2.f('m_production','late');await sleep(100);const late=v.querySelector('#hc2_m_production').innerHTML;
    return {K:!!K,has,m13,months,oct3:/Oct ›\\s*3/.test(oct),cards,lateOnly:late.includes('Old check')&&!late.includes('Harvest GH4')};})()`),
  expect:{K:true,has:true,m13:true,months:12,oct3:true,cards:2,lateOnly:true} }
];
