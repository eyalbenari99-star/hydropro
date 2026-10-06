/* v21.74: Tablo order-start plan as tasks + evidence files + customer follow-up 3× a day */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
    {username:'edelyn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'eyal',fullname:'Eyal Ben Ari',passwordHash:'x',role:'admin',active:true},
    {username:'amy',fullname:'Dr Amy Patdu',passwordHash:'x',role:'admin_secondary',active:true},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'supervisor',department:'hr',departments:['hr'],active:true}]));
  localStorage.setItem('hydroPro_crm_leads',JSON.stringify([]));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'📋 Tablo action plan → 22 tasks (1 parent + 21 plan rows) owned by Edelyn, shared with Eyal + Dr Amy, evidence-gated, linked to a new Tablo CRM lead with GO/NO-GO touchpoint due 9 Oct; a second seed adds 0; a deleted row is not re-created; Done is refused without evidence and allowed after a 📤 file upload (tasks/<id>/…); the lead Tasks tab shows "1/21 done" (v21.74)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('edelyn');await sleep(6000);
    window.confirm=()=>true;window.alert=()=>{};
    const r1=HNXCUSTTASKS.seedTablo();const r2=HNXCUSTTASKS.seedTablo();
    const T=HNXTASKS.load().filter(t=>t.plan==='tablo2610');
    const P=T.find(t=>t.id==='TSK_TABLO2610');const kids=T.filter(t=>t.parentId==='TSK_TABLO2610');
    const go=T.find(t=>t.id==='TSK_TABLO2610_12');
    const lead=JSON.parse(localStorage.getItem('hydroPro_crm_leads')).find(l=>/tablo/i.test(l.company));
    const tp=JSON.parse(localStorage.getItem('hydroPro_crm_touchpoints')||'[]').find(x=>x.id==='TP_TABLO2610_PLAN');
    as('tester');HNXTASKS.remove('TSK_TABLO2610_14');const r3=HNXCUSTTASKS.seedTablo();
    const gone=!HNXTASKS.load().some(t=>t.id==='TSK_TABLO2610_14');
    as('edelyn');
    const refused=HNXTASKS.setStatus('TSK_TABLO2610_01','done')===false;
    let sent=null;window.__hnxApi=(path,opt)=>{sent=path;return Promise.resolve({ok:true,json:()=>({ok:true})});};
    const f=new File(['signed MoM'],'MoM signed.pdf',{type:'application/pdf'});
    HNXTASKS.evUpload('TSK_TABLO2610_01',{files:[f],value:''});await sleep(800);
    const t1=HNXTASKS.load().find(t=>t.id==='TSK_TABLO2610_01');const ev=(t1.evidence||[])[0]||{};
    const allowed=HNXTASKS.setStatus('TSK_TABLO2610_01','done')===true;
    const html=HNXCUSTTASKS.leadHtml(lead);
    return {r1:r1.added,owner:r1.owner,shared:r1.shared.join(','),r2:r2.added,kids:kids.length,parentRule:P.rule,
      allEvidence:kids.every(t=>t.rule==='evidence'&&t.required),allEdelyn:T.every(t=>t.owner==='edelyn'),allShared:T.every(t=>t.visibility==='users'&&t.sharedWith.join(',')==='eyal,amy'),
      linked:T.every(t=>t.links[0]==='customer:'+lead.id),goDue:go.due+' '+go.dueTime,leadStage:lead.stage,tpDue:tp&&tp.nextDue,
      r3:r3.added,gone,refused,uploadKey:/^\\/r2\\/upload\\?key=tasks%2FTSK_TABLO2610_01%2F/.test(sent||''),evFile:/^tasks\\/TSK_TABLO2610_01\\/.*MoM_signed\\.pdf$/.test(ev.file||''),evNote:ev.note,allowed,
      panel:/Nexi tasks for this customer \\(1\\/21 done\\)/.test(html)&&/GO \\/ NO-GO/.test(html)};})()`),
  expect:{r1:22,owner:'edelyn',shared:'eyal,amy',r2:0,kids:21,parentRule:'simple',allEvidence:true,allEdelyn:true,allShared:true,linked:true,goDue:'2026-10-09 17:00',leadStage:'meeting',tpDue:'2026-10-09',
    r3:0,gone:true,refused:true,uploadKey:true,evFile:true,evNote:'MoM signed.pdf',allowed:true,panel:true} },

{ name:'🤝 Customer follow-up 3× a day: on 9 Oct 09:00 Edelyn gets "12 tasks (7 late)" — 7 late (rows 02–08; row 01 done), 4 today incl. GO/NO-GO 17:00, 1 in the next 2 days (row 14 deleted); a non-customer HR task is left out; the same slot never fires twice; Dr Amy (shared) gets the same 12 with the owner named; Jinky (nothing shared) gets none; the entry lands in the Assistant inbox (v21.74)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    as('edelyn');await sleep(6000);
    window.confirm=()=>true;window.alert=()=>{};
    HNXCUSTTASKS.seedTablo();
    as('tester');HNXTASKS.remove('TSK_TABLO2610_14');
    as('edelyn');HNXTASKS.addEvidence('TSK_TABLO2610_01',{note:'sent'});HNXTASKS.setStatus('TSK_TABLO2610_01','done');
    HNXTASKS.create({title:'HR file check',module:'hr',due:'2026-10-09',owner:'edelyn'});
    const e=HNXCUSTTASKS.followup('edelyn','09:00','2026-10-09');
    const again=HNXCUSTTASKS.followup('edelyn','09:00','2026-10-09');
    const a=HNXCUSTTASKS.followup('amy','13:00','2026-10-09');
    const j=HNXCUSTTASKS.followup('jinky','13:00','2026-10-09');
    const ib=JSON.parse(localStorage.getItem('hydroPro_pa_inbox_v1')||'[]');
    return {title:e&&e.title,late:/⏰ LATE/.test(e.text),today:/📌 TODAY[\\s\\S]*\\[today 17:00\\] GO \\/ NO-GO/.test(e.text),soon:/🔜 NEXT 2 DAYS[\\s\\S]*\\[10-10\\] Production/.test(e.text),
      noHr:!/HR file check/.test(e.text),again:again===null,amy:a&&a.title,amyOwner:/— Edelyn Rose Nicolas/.test(a&&a.text||''),jinky:j===null,
      inbox:ib.filter(x=>x.itemId==='custtasks').map(x=>x.user).sort().join(',')};})()`),
  expect:{title:'🤝 Customer follow-up 09:00 — 12 tasks (7 late)',late:true,today:true,soon:true,noHr:true,again:true,amy:'🤝 Customer follow-up 13:00 — 12 tasks (7 late)',amyOwner:true,jinky:true,inbox:'amy,edelyn'} }
];
