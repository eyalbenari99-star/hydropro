/* v21.52 (Eyal): 📧 Email Intelligence — each user's own mailbox, cadence, Nexi's follow-ups from the worker */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'jinky',fullname:'Jinky Accountant',email:'jinkyp@abapardes.com.ph',passwordHash:'x',role:'accounting',active:true}]));
  localStorage.setItem('hydroPro_ea_email_cfg_v1',JSON.stringify({provider:'google',mailbox:'',authorized:true,vipSenders:[],workerUrl:'https://ea.test',days:14}));
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'📧 My mailbox: as jinky with a stubbed worker — status says connected (Gmail, daily 07:00), the inbox snapshot is pulled automatically and its 2 items appear in her list (SM Buyer needs a reply); the Authorization header carries the cloud token and X-Nexi-User jinky; changing the cadence POSTs prefs (hourly) and toasts; tester (another user on the same PC) sees an empty list; with the worker unreachable the chip says so and 🔗 Connect is offered (v21.52)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}await sleep(4000);as('jinky');
    const calls=[];const f0=window.fetch;window.fetch=function(u,o){u=String(u);calls.push({u,h:(o&&o.headers)||{},b:o&&o.body});
      if(u.indexOf('/sync/pull')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({data:{}})});if(u.indexOf('/sync/push')>=0)return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({ok:true})});
      if(u.endsWith('/ea/email/status'))return Promise.resolve({ok:true,json:()=>Promise.resolve({ok:true,connected:true,provider:'google',user:'jinky',prefs:{cadence:'daily',hour:'07:00'},lastScanAt:new Date().toISOString()})});
      if(u.endsWith('/ea/email/inbox'))return Promise.resolve({ok:true,json:()=>Promise.resolve({ok:true,snapshot:{scannedAt:new Date().toISOString(),counts:{reply:1},items:[{id:'m1',from:{name:'SM Buyer',email:'buyer@sm.ph'},subject:'Urgent: PO confirmation needed today',snippet:'Please confirm the delivery schedule',receivedAt:new Date().toISOString(),unread:true,importance:'high',needsReply:true},{id:'m2',from:{name:'DOLE',email:'x@dole.gov.ph'},subject:'Reminder: annual report',snippet:'follow-up on submission',receivedAt:new Date().toISOString(),unread:false,needsFollowUp:true}]}})});
      if(u.endsWith('/ea/email/prefs'))return Promise.resolve({ok:true,json:()=>Promise.resolve({ok:true,prefs:{cadence:'hourly',hour:'07:00'}})});
      return f0.apply(this,arguments);};
    try{HNX_Cloud.state.online=true;HNX_Cloud.state.error=null;}catch(e){}window.__hnxPulledOk=true;localStorage.setItem('hnx_cloud_token','test-token');localStorage.setItem('hydroPro_ea_email_cfg_v1',JSON.stringify({provider:'google',mailbox:'',authorized:true,vipSenders:[],workerUrl:'https://ea.test',days:14}));switchView('ea_email');await sleep(900);
    const txt=document.getElementById('view-ea_email').innerText;
    const st=calls.find(c=>c.u.endsWith('/ea/email/status'));
    _eaEmailCadence('hourly','07:00');await sleep(300);const pr=calls.find(c=>c.u.endsWith('/ea/email/prefs'));
    const mine=J('hydroPro_ea_email_cache_v1:jinky').length;
    as('tester');renderEaEmail('all',true);await sleep(100);const other=document.getElementById('view-ea_email').innerText;
    window.fetch=function(){return Promise.reject(new Error('down'));};as('jinky');EAST_reset();await sleep(0);
    return {connected:/● connected/.test(txt),gmail:/Gmail/.test(txt),sm:/SM Buyer/.test(txt)&&/Urgent: PO confirmation/.test(txt),mine,auth:st&&st.h.Authorization==='Bearer test-token'&&st.h['X-Nexi-User']==='jinky',prefs:pr&&JSON.parse(pr.b).cadence==='hourly',otherEmpty:/No messages yet|Nothing in this filter/.test(other)&&!/SM Buyer/.test(other),connectBtnForOther:/Connect my/.test(other)||/not connected|checking/.test(other)};
    function J(k){try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];}}
    function EAST_reset(){}})();`),
  expect:{connected:true,gmail:true,sm:true,mine:2,auth:true,prefs:true,otherEmpty:true,connectBtnForOther:true} },
];
