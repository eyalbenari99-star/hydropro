/* v21.77: canvas sheet 10/06 → Purchasing, GH15 drop-off commitment */
module.exports=[
{ name:'🏗 GH15 canvas: seed → PR-GH15-SAND + PR-GH15-GRAVEL at Quotation Evaluation with 8 offers each; second seed adds 0; FAMOUS 3 m³ truck sand = ₱12,000 for 12 m³; every offer flagged "drop-off NOT committed"; award refused until the GH15 commitment is ticked (v21.77)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:new Function(`return (async()=>{await sleep(6000);let msg='';window.alert=m=>{msg=m;};window.confirm=()=>true;
    const a1=HNXGH15CANVAS.seed(),a2=HNXGH15CANVAS.seed();
    const prs=JSON.parse(localStorage.getItem('hydroPro_purch_prs'));const rf=JSON.parse(localStorage.getItem('hydroPro_purch_rfqs'));
    const sand=prs.find(p=>p.id==='PR_GH15_SAND'),r=rf.find(x=>x.id==='RFQ_GH15_SAND');
    const fam=r.suppliers.find(s=>/FAMOUS — 3/.test(s.name));
    __PURPRO.award('PR_GH15_SAND',fam.name);const refused=/not committed the drop-off/.test(msg);
    return {a2,status:sand.status+'|'+prs.find(p=>p.id==='PR_GH15_GRAVEL').status,offers:r.suppliers.length,famTotal:fam.quote.total,
      deliverTo:/Side of GH15 ONLY/.test(sand.deliverTo),refused};})()`),
  expect:{a2:0,status:'Quotation Evaluation|Quotation Evaluation',offers:8,famTotal:12000,deliverTo:true,refused:true} },
{ name:'📨 RFQ reply contact: GH15 sand RFQ e-mail ends with Accounting 09778572212 + accounting@abapardes.com.ph; SMS keeps the contact and the GH15 delivery point, under 400 chars (v21.78)',
  seed:function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:new Function(`return (async()=>{await sleep(6000);HNXGH15CANVAS.seed();const t=__PURPRO.rfqText('PR_GH15_SAND','RFQ_GH15_SAND');
    return {mail:/Mobile: 09778572212\\nEmail: accounting@abapardes\\.com\\.ph$/.test(t.email),sms:/Reply to Accounting: 09778572212 \\/ accounting@abapardes\\.com\\.ph$/.test(t.sms),gh:/GH15/.test(t.sms),short:t.sms.length<400};})()`),
  expect:{mail:true,sms:true,gh:true,short:true} }
];
