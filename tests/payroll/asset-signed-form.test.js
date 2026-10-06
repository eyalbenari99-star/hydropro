/* v21.75: asset deployment — upload the paper request signed by the employee straight to the 201 file; HR reviews it */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
  localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E77',name:'ESTONIO, REVEN GERALDO',status:'Active',department:'MAINTENANCE'}]));
  localStorage.setItem('hydroPro_inv_requests_v1',JSON.stringify([{id:'RQ1',no:'REQ-0001',type:'asset',fulfillType:'employee',empId:'E77',empName:'ESTONIO, REVEN GERALDO',
    itemName:'Dell Latitude E7450',itemSku:'LAP-E7450',qty:1,unit:'pc',serialNo:'6N4Y062',status:'issued',issuedAt:'2026-10-06T02:30:00.000Z',issuedBy:'admin',
    chain:[],history:[],createdAt:'2026-10-06T01:39:00.000Z',fromType:'it'}]));
};
module.exports=[
{ name:'📤 Asset deployment Dell E7450 to ESTONIO (not yet signed): 📤 Upload signed form (PDF) → uploaded to hr/201/E77/assetdeploy_RQ1_…pdf, request ack by ESTONIO mode "upload", 201 doc assetdeploy_RQ1 points to r2img: with HR review "pending" (notes say so), asset register gets the laptop, request detail shows "HR review pending" + HR accept; ↩ Return with "Unsigned page 2" → returned; ✓ HR accept → ok, 201 notes "accepted by" (v21.75)',
  seed:SEED,
  run:new Function(`return (async()=>{
    await sleep(6000);window.confirm=()=>true;window.alert=()=>{};
    let sent=null;window.__hnxApi=(path,opt)=>{sent=path;return Promise.resolve({ok:true,json:()=>({ok:true})});};
    switchView('inv_requests');await sleep(400);__hnxInvReq.open('RQ1');await sleep(300);
    const before=/Upload signed form/.test(document.getElementById('invRequestsBody').innerHTML);
    const f=new File(['%PDF-1.4 signed'],'request signed.pdf',{type:'application/pdf'});
    __hnxInvReq.ackUpload('RQ1',{files:[f],value:''});await sleep(800);
    const r=JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1'))[0];
    const d=(JSON.parse(localStorage.getItem('hydroPro_hr_201_docs')||'{}').E77||{}).assetdeploy_RQ1||{};
    const A=(JSON.parse(localStorage.getItem('hydroPro_hr_assets')||'{}').E77||[]);
    const html=document.getElementById('invRequestsBody').innerHTML;
    window.prompt=()=>'Unsigned page 2';__hnxInvReq.ackReview('RQ1','returned');await sleep(200);
    const ret=JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1'))[0].ack.hrReview;
    __hnxInvReq.ackReview('RQ1','ok');await sleep(200);
    const ok=JSON.parse(localStorage.getItem('hydroPro_inv_requests_v1'))[0].ack.hrReview;
    const d2=(JSON.parse(localStorage.getItem('hydroPro_hr_201_docs')||'{}').E77||{}).assetdeploy_RQ1||{};
    return {before,upPath:/^\\/r2\\/upload\\?key=hr%2F201%2FE77%2Fassetdeploy_RQ1_[a-z0-9]+\\.pdf/.test(sent||''),ackBy:r.ack&&r.ack.by,mode:r.ack&&r.ack.mode,
      fileKey:/^hr\\/201\\/E77\\/assetdeploy_RQ1_[a-z0-9]+\\.pdf$/.test(r.ack&&r.ack.file||''),pending:r.ack&&r.ack.hrReview&&r.ack.hrReview.status,filed:r.ack&&r.ack.filed201,
      docPtr:String(d.scanUrl||'').slice(0,6),docMime:d.mime,docPending:/HR review: pending/.test(d.notes||''),asset:A.length===1&&/Dell Latitude E7450/.test(A[0].name),
      shows:/HR review pending/.test(html)&&/HR accept/.test(html)&&/Signed form/.test(html),
      ret:ret.status+'|'+ret.note,ok:ok.status,docOk:/HR review: accepted by/.test(d2.notes||'')};})()`),
  expect:{before:true,upPath:true,ackBy:'ESTONIO, REVEN GERALDO',mode:'upload',fileKey:true,pending:'pending',filed:true,docPtr:'r2img:',docMime:'application/pdf',docPending:true,asset:true,
    shows:true,ret:'returned|Unsigned page 2',ok:'ok',docOk:true} }
];
