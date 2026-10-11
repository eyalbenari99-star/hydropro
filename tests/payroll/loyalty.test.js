/* v21.21 (Eyal): Accounting → Loyalty Savings — the workbook's figures reproduced from the seeded data.
   v22.52: the plan is no longer built into the page (anyone could read it in View Source) — it lives in the synced store, so the case
   seeds that store.
   v22.54 (audit RI-2): the repository must not carry the real plan either — the case seeds a SYNTHETIC plan with the same structure
   (fixtures/loyalty-synthetic-plan.json: invented members Alpha / Bravo / Charlie T. Member, invented amounts, checks and COP numbers).
   The expected figures below were computed independently from that fixture (units = amount ÷ NAVPU, a member's units = the batch units ×
   their share of the batch, value = units × the latest NAVPU 104.25). */
const LOY=JSON.stringify(require('./fixtures/loyalty-synthetic-plan.json'));
module.exports=[
{ name:'💰 Loyalty Savings (synthetic plan): 10 remittances ₱155,000, 1,527.7739 units, value ₱159,270.43 @ NAVPU 104.25, earnings ₱4,270.43; Alpha 88,000 → 866.8907 units, 56.74% of the fund, worth ₱90,373.36, interest ₱2,373.36; Charlie 10.64%; outstanding to Sep-2026 ₱62,000 (Bravo 33,500, Alpha 24,000); funding Alpha\'s Jul-2026 (₱8,000) leaves ₱54,000; the screen registers under Accounting and the statement prints the employee\'s share (v21.21 · v22.54)',
  seed:new Function("localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));localStorage.setItem('hydroPro_loyalty_v1',"+JSON.stringify(LOY)+");"),
  run:async()=>{
    await sleep(6000);
    const C=HNXLOY.calc();const r2=x=>Math.round(x*100)/100,r4=x=>Math.round(x*10000)/10000;
    const j=C.members.find(m=>m.m.name.indexOf('Alpha')>=0),t=C.members.find(m=>m.m.name.indexOf('Bravo')>=0),e=C.members.find(m=>m.m.name.indexOf('Charlie')>=0);
    /* the plan is 'outstanding to Sep-2026'; every month after that adds each member's monthly amount as due — netted out so the case holds on any date */
    const _mAfter=Math.max(0,(+C.cur.slice(0,4)-2026)*12+(+C.cur.slice(5,7)-9));
    const _x=_mAfter*(+j.m.monthly+(+t.m.monthly)+(+e.m.monthly)),_xA=_mAfter*(+j.m.monthly),_xB=_mAfter*(+t.m.monthly);
    const oT=C.out[t.m.id],oJ=C.out[j.m.id];
    const reg=(MODULES.accounting.views||[]).some(v=>v.id==='acct_loyalty');
    switchView('acct_loyalty');await sleep(800);const ov=document.getElementById('view-acct_loyalty').innerText;
    HNXLOY.statement(j.m.id);await sleep(400);const st=document.getElementById('hnxLoyPrint').innerText;
    /* a new month funded changes the numbers */
    HNXLOY.setPaid('2026-07',j.m.id,8000);const C2=HNXLOY.calc();
    return {batches:HNXLOY.db().batches.length,remitted:C.totContrib,units:r4(C.totUnits),value:r2(C.totValue),earn:r2(C.totEarn),navpu:C.navpu,
      jContrib:j.contrib,jUnits:r4(j.units),jShare:Math.round(j.shareFund*10000)/100,jValue:r2(j.value),jEarn:r2(j.earn),eShare:Math.round(e.shareFund*10000)/100,
      outTot:C.outTot-_x,tOut:oT.due-oT.paid-_xB,jOut:oJ.due-oJ.paid-_xA,reg,overview:/Cash remitted/i.test(ov)&&/155,000/.test(ov),statement:/Alpha/.test(st)&&/Saved for you/i.test(st)&&/90,373\.36/.test(st),
      afterFund:C2.outTot-_x};},
  expect:{batches:10,remitted:155000,units:1527.7739,value:159270.43,earn:4270.43,navpu:104.25,jContrib:88000,jUnits:866.8907,jShare:56.74,jValue:90373.36,jEarn:2373.36,eShare:10.64,outTot:62000,tOut:33500,jOut:24000,reg:true,overview:true,statement:true,afterFund:54000} },
];
/* v22.54 audit DSAFE-6 (pre-existing since v21.21): a remittance deleted on one computer came back from any computer that still held it —
   the sync's deep merge unions id-carrying arrays. Two computers simulated in one page through the real HNX_Cloud.pull / push. */
const CLOUD=function(){
  window.__tCloud={
    async call(fn,data,first){
      const C=window.HNX_Cloud,f0=window.fetch;
      localStorage.setItem('hnx_cloud_token','test-token');
      C.state.online=true;C.state.syncing=false;C.state.error=null;
      window.__hnxPulledOk=!first;window.__pushed=null;
      window.fetch=function(u,o){u=String(u);
        if(u.indexOf('/sync/keys')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({keys:Object.keys(data||{}),count:Object.keys(data||{}).length})});
        if(u.indexOf('/sync/pull')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({data:data||{}})});
        if(u.indexOf('/sync/push')>=0){try{window.__pushed=JSON.parse(o.body).data;}catch(e){}return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({ok:true})});}
        return f0.apply(this,arguments);};
      try{await C[fn]();}finally{window.fetch=f0;localStorage.removeItem('hnx_cloud_token');window.__hnxPulledOk=true;}
      return C.state.error||null;
    },
    pull(data,first){return this.call('pull',data,first);},
    push(){return this.call('push',{});}
  };
};
module.exports.push(
{ name:'🗑 A deleted remittance stays deleted: LB3 (₱15,500, synthetic plan) deleted on computer A stays gone after computer B — still holding LB3 — pulls A\'s 9-remittance plan and uploads, and A pulls B\'s upload; the fund keeps 9 remittances ₱139,500 (v22.54 audit DSAFE-6)',
  seed:new Function('('+CLOUD.toString()+')();'+"localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));localStorage.setItem('hydroPro_loyalty_v1',"+JSON.stringify(JSON.stringify(Object.assign({},JSON.parse(LOY),{updatedAt:Date.now()-3600000})))+");"),
  run:async()=>{
    const K='hydroPro_loyalty_v1',C=window.__tCloud;window.confirm=()=>true;
    const ids=raw=>{const d=JSON.parse(raw||'{}');const t=d.delBatches||{};return ((d.batches)||[]).filter(b=>!t[b.id]).map(b=>b.id).join(',');};
    const B10=localStorage.getItem(K);                       /* computer B's copy = the shared plan before the delete */
    await C.push();
    try{switchView('acct_loyalty');}catch(e){}await sleep(800);
    HNXLOY.delBatch('LB3');                                  /* computer A deletes LB3 */
    const A9=localStorage.getItem(K);
    await C.push();
    localStorage.setItem(K,B10);await C.push();              /* become computer B */
    await C.pull({[K]:A9});const onB=localStorage.getItem(K);
    window.__hnxLastFullPush=0;await C.push();const bPushed=window.__pushed&&window.__pushed[K];
    localStorage.setItem(K,A9);await C.push();               /* back to computer A */
    await C.pull({[K]:bPushed||onB});const onA=localStorage.getItem(K);
    let shown='',rem=0;try{switchView('acct_loyalty');await sleep(600);const c=HNXLOY.db();shown=(c.batches||[]).map(b=>b.id).join(',');rem=HNXLOY.calc().totContrib;}catch(e){shown='err '+e.message;}
    return {aAfterDelete:ids(A9),onB:ids(onB),bUploadHasLB3:!!(bPushed&&ids(bPushed).split(',').indexOf('LB3')>=0),onA:ids(onA),shown,rem};},
  expect:{aAfterDelete:'LB1,LB2,LB4,LB5,LB6,LB7,LB8,LB9,LB10',onB:'LB1,LB2,LB4,LB5,LB6,LB7,LB8,LB9,LB10',bUploadHasLB3:false,onA:'LB1,LB2,LB4,LB5,LB6,LB7,LB8,LB9,LB10',shown:'LB1,LB2,LB4,LB5,LB6,LB7,LB8,LB9,LB10',rem:139500} });
