/* v21.04: Help guides link to the screens they explain, with Contents and a way back. */
module.exports=[
{ name:'🆘 Help: the Payroll guide lists its screens (Labor Payroll among them) and a Contents list; ↗ opens 👷 Labor Payroll (Weekly), closes Help and leaves a 📖 Back button; Back reopens the same guide at the same section (v21.05)',
  run:async()=>{
    HNX_HELP.open('m_payroll');await sleep(400);
    const ov=document.getElementById('hnxhOv');
    const toc=!!ov.querySelector('.hnxh-toc-l'),tocN=ov.querySelectorAll('.hnxh-toc-l button').length,secN=(HNX_HELP_GUIDES.find(g=>g.id==='m_payroll').sections||[]).length;
    const goN=ov.querySelectorAll('.hnxh-go').length;
    const screens=HNX_HELP.screensFor('m_payroll');
    const trips=HNX_HELP.screensFor('trips');
    HNX_HELP.go('payroll_ops',2);await sleep(1500);
    const closed=ov.style.display==='none',chip=!!document.getElementById('hnxhBackChip'),view=String(window.currentView||'');
    HNX_HELP.back();await sleep(500);
    const reopened=ov.style.display!=='none'&&!!ov.querySelector('#hnxh-s-2'),chipGone=!document.getElementById('hnxhBackChip');
    HNX_HELP.close();
    return {toc,tocAll:tocN===secN,manyLinks:goN>5,hasOps:screens.indexOf('payroll_ops')>=0,tripsRates:trips.indexOf('payroll_rates')>=0,closed,chip,view,reopened,chipGone};},
  expect:{toc:true,tocAll:true,manyLinks:true,hasOps:true,tripsRates:true,closed:true,chip:true,view:'payroll_ops',reopened:true,chipGone:true} },
{ name:'🆘 Help: every guide renders with its links and no page error; almost every guide links at least one screen (v21.05)',
  run:async()=>{
    let none=[],bad=[];
    for(const g of HNX_HELP_GUIDES){ try{ HNX_HELP.open(g.id); const n=document.querySelectorAll('#hnxhOv .hnxh-go').length; if(!n)none.push(g.id);}catch(e){bad.push(g.id+':'+e.message);} }
    HNX_HELP.close();
    return {bad,fewWithout:none.length<=4,none};},
  expect:{bad:[],fewWithout:true} },
];
