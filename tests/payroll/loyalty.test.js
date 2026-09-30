/* v21.21 (Eyal): Accounting → Loyalty Savings — the workbook's figures reproduced from the seeded data */
module.exports=[
{ name:'💰 Loyalty Savings: seeded from the audit — 10 remittances ₱219,000, 1,689.1159 units, value ₱223,075.29 @ NAVPU 132.0663, earnings ₱4,075.29; Jinky 110,000 → 847.9905 units, 50.20% of the fund, worth ₱111,990.97, interest ₱1,990.97; Torzar 10.04%; outstanding to Sep-2026 ₱89,000 (Taladtad 53,000); the screen registers under Accounting and the statement prints the employee\'s share (v21.21)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:async()=>{
    await sleep(6000);
    const C=HNXLOY.calc();const r2=x=>Math.round(x*100)/100,r4=x=>Math.round(x*10000)/10000;
    /* the seed is 'outstanding to Sep-2026'; every month after that adds 10,000 + 10,000 + 2,000 of due — netted out so the case holds on any date */
    const _mAfter=Math.max(0,(+C.cur.slice(0,4)-2026)*12+(+C.cur.slice(5,7)-9)),_x=_mAfter*22000,_xJ=_mAfter*10000;
    const j=C.members.find(m=>m.m.name.indexOf('Pagtama')>=0),t=C.members.find(m=>m.m.name.indexOf('Taladtad')>=0),e=C.members.find(m=>m.m.name.indexOf('Torzar')>=0);
    const oT=C.out[t.m.id],oJ=C.out[j.m.id];
    const reg=(MODULES.accounting.views||[]).some(v=>v.id==='acct_loyalty');
    switchView('acct_loyalty');await sleep(800);const ov=document.getElementById('view-acct_loyalty').innerText;
    HNXLOY.statement(j.m.id);await sleep(400);const st=document.getElementById('hnxLoyPrint').innerText;
    /* a new month funded and a new remittance change the numbers */
    HNXLOY.setPaid('2026-07',j.m.id,10000);const C2=HNXLOY.calc();
    return {batches:HNXLOY.db().batches.length,remitted:C.totContrib,units:r4(C.totUnits),value:r2(C.totValue),earn:r2(C.totEarn),navpu:C.navpu,
      jContrib:j.contrib,jUnits:r4(j.units),jShare:Math.round(j.shareFund*10000)/100,jValue:r2(j.value),jEarn:r2(j.earn),eShare:Math.round(e.shareFund*10000)/100,
      outTot:C.outTot-_x,tOut:oT.due-oT.paid-_xJ,jOut:oJ.due-oJ.paid-_xJ,reg,overview:/Cash remitted/i.test(ov)&&/219,000/.test(ov),statement:/Pagtama/.test(st)&&/Saved for you/i.test(st)&&/111,990\.97/.test(st),
      afterFund:C2.outTot-_x};},
  expect:{batches:10,remitted:219000,units:1689.1159,value:223075.29,earn:4075.29,navpu:132.0663,jContrib:110000,jUnits:847.9905,jShare:50.2,jValue:111990.97,jEarn:1990.97,eShare:10.04,outTot:89000,tOut:53000,jOut:30000,reg:true,overview:true,statement:true,afterFund:79000} },
];
