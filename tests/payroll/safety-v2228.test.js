/* v22.28 (Eyal, 9 Oct: two stores were made "the truth" with Upload anyway by mistake — "what to do?"; audit A7-27 / A7-03):
   🛡 Data Safety lists every upload made the truth in the last 14 days with ↩ Undo (the cloud version from just before it), and the
   cloud version history works for every store, not only employees. */
module.exports=[
{ name:'🛡 Uploads made the truth: 2 "Upload anyway" lines (attendance 9 Oct 10:00, hr employees 9 Oct 12:00) + 1 of 20 days ago → the card lists 2, newest first, each with its store; ↩ Undo on attendance picks the cloud version saved at 10:00:05 (the first at or after the upload), not 09:00 or 11:30 (v22.28)',
  requires:"window.HNXDS&&typeof window.HNXDS.undoUpload==='function'",
  run:async()=>{const t=s=>Date.parse(s);
    localStorage.setItem('hydroPro_attendance',JSON.stringify({}));localStorage.setItem('hydroPro_hr_employees',JSON.stringify([]));
    const L=JSON.parse(localStorage.getItem('hydroPro_audit')||'[]');const now=Date.now();
    const at1=now-2*3600e3,at2=now-1*3600e3,old=now-20*864e5;
    L.push({ts:new Date(old).toISOString(),u:'admin',a:'security',d:'🛡 attendance set as the truth for every computer (admin: upload anyway)'});
    L.push({ts:new Date(at1).toISOString(),u:'admin',a:'security',d:'🛡 attendance set as the truth for every computer (admin: upload anyway)'});
    L.push({ts:new Date(at2).toISOString(),u:'admin',a:'security',d:'🛡 hr employees set as the truth for every computer (admin: upload anyway)'});
    localStorage.setItem('hydroPro_audit',JSON.stringify(L));
    const ups=window.HNXDS.upAnyways();
    window.HNX_Cloud=window.HNX_Cloud||{};const oa=window.HNX_Cloud.api;
    window.HNX_Cloud.api=p=>Promise.resolve(/\/sync\/versions/.test(p)?{versions:[{ts:at1+90*60e3,size:9},{ts:at1+5000,size:9},{ts:at1-3600e3,size:9}]}:{});
    let picked=null;const orv=window.HNXDS.restoreVersion;window.HNXDS.restoreVersion=(k,ts)=>{picked={k,dt:ts-at1};};
    window.HNXDS.undoUpload('hydroPro_attendance',at1);await sleep(300);
    window.HNXDS.restoreVersion=orv;window.HNX_Cloud.api=oa;
    return {n:ups.length,first:ups[0]&&ups[0].label,keys:ups.map(u=>u.key),picked};},
  expect:{n:2,first:'hr employees',keys:['hydroPro_hr_employees','hydroPro_attendance'],picked:{k:'hydroPro_attendance',dt:5000}} }
];
