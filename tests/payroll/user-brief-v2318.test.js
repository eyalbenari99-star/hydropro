/* v23.30 (Eyal, 13 Oct 2026: "users still not getting WhatsApp morning brief also not emails brief after review there emails").
   Each user's morning brief is sent by the nexi@ Apps Script (workers/nexi-morning-brief.gs v4.0 — its own tests are
   tests/workers/user-brief.test.mjs). Here: the app side — choosing e-mail no longer blocks the in-app briefing, briefings the old
   check blocked are repaired, the 📣 status box / test button / WhatsApp steps, the admin 📨 Brief delivery table, the permissions
   snapshot (computed for each user, never from the signed-in user), and no key or nexibrief_* store in the synced data.
   The cloud is never reached: HNX_Cloud.api is stubbed in the page. */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester Admin',passwordHash:'x',role:'admin',active:true,email:'tester@abapardes.com.ph'},
    {username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'accounting',department:'accounting',active:true,email:'',
     assistant:{workEmail:'jinkyp@abapardes.com.ph',mobile:'+639171234567',prefs:{briefTime:'06:30',channel:'mail'},authority:{autoTasks:true,autoSubtasks:true,autoFollowup:true,sendMail:true,sendWhatsApp:true,needsApproval:[]}}},
    {username:'jean',fullname:'Jean Operator',passwordHash:'x',role:'operator',department:'logistics',departments:['logistics'],active:true,email:'jean@gmail.com'},
    {username:'ederlyn',fullname:'Ederlyn Santos',passwordHash:'x',role:'supervisor',department:'production',active:true,email:'ederlyn@abapardes.com.ph'},
    {username:'mea',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',active:false,email:'mea@abapardes.com.ph'},
    {username:'sup1',fullname:'Super Visor',passwordHash:'x',role:'supervisor',department:'production',active:true,email:'sup1@abapardes.com.ph'}]));
};
/* the server log (states and times only), the cloud stub and a toast recorder — all inside the page */
const KIT=`
  const mday=ms=>new Date(ms+8*3600e3).toISOString().slice(0,10);
  const mkLog=(o)=>{const now=Date.now(),day=mday(now),at=hm=>new Date(Date.parse(day+'T'+hm+':00+08:00')).toISOString();
    const set=(m,w,p,t)=>({mail:m,mailFrom:'card',wa:w,waProp:p,t:t,eff:t,days:[1,2,3,4,5,6]});
    return Object.assign({v:1,engine:{script:'4.0',mode:'on',lastRun:new Date(now-5*60000).toISOString(),lastOk:'',lastErr:'',mailsToday:2,scopeAgeD:0.1},
      setup:{jinky:set('ok','ok','WA_JINKY','06:30'),jean:set('no-company-email','no-key','WA_JEAN','07:00'),ederlyn:set('ok','no-key','WA_EDERLYN','07:00'),sup1:set('card-off','no-key','WA_SUP1','07:00')},
      days:{[day]:{jinky:{k:'brief',e:{s:'sent',at:at('06:32')},w:{s:'sent',at:at('06:32'),parts:1}}}},tests:{}},o||{});};
  const stubCloud=(log)=>{window.__LOG=log;window.__pushes=[];window.__pulls=[];localStorage.setItem('hnx_cloud_token','test-token');
    window.HNX_Cloud.api=function(path,opts){if(/^\\/sync\\/push/.test(path)){window.__pushes.push(JSON.parse(opts.body));return Promise.resolve({ok:true,written:1});}
      if(/^\\/sync\\/pull\\?keys=nexibrief_log_v1$/.test(path)){window.__pulls.push(path);return Promise.resolve({data:window.__LOG?{nexibrief_log_v1:window.__LOG}:{}});}
      return Promise.reject(new Error('not stubbed: '+path));};};
  const toasts=[];const _st=window.showToast;window.showToast=function(m,k){toasts.push(String(m));try{return _st&&_st.apply(this,arguments);}catch(e){}};
  const txt=id=>((document.getElementById(id)||{}).innerText||'');
`;
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'📣 e-mail chosen no longer blocks (v23.30): Briefings & Voice → "In Nexi + e-mail" → 💾 Save → the briefing stays ACTIVE (was blocked "nexi-notify is not set up"); tick Wed 14 Oct 09:00 → inbox 0→1; the run\'s delivery mail = \'by nexi@ (server) — see 📣 status\' (this device sends no e-mail)',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}await sleep(1500);as('tester');
    HNXPA.saveProfile({pausedAll:true,setupDone:true,workDays:[1,2,3,4,5,6]});
    HNXPA.open('pa_setup');await sleep(400);document.getElementById('paBT').value='07:00';document.getElementById('paCh').value='app';HNXPA.ui.saveSetup();await sleep(300);
    let b=HNXPA.items().filter(x=>x.category==='briefing')[0];
    HNXPA.open('pa_brief');await sleep(400);document.getElementById('paCh2').value='mail';HNXPA.ui.saveBrief();await sleep(300);
    b=HNXPA.get(b.id);const st=b.status,ch=b.delivery.channel,why=HNXPA.readiness(b);
    HNXPA.saveProfile({pausedAll:false});const i0=HNXPA.inbox('tester').length;const n=HNXPA.tick(new Date('2026-10-14T09:00:00'));const i1=HNXPA.inbox('tester').length;HNXPA.saveProfile({pausedAll:true});
    const r=HNXPA.runs().filter(x=>x.itemId===b.id)[0]||{};
    HNXPA.open('pa_brief');await sleep(400);const t=txt('view-pa_brief');
    return {st,ch,why:why.length,n,inc:i1-i0,mail:r.delivery&&r.delivery.mail,newText:/e-mail and WhatsApp = sent by nexi@abapardes\\.com\\.ph/.test(t),oldText:/dispatched by nexi-notify/.test(t),btn:/📥 Test in Nexi now/.test(t)};})();`),
  expect:{st:'active',ch:'mail',why:0,n:1,inc:1,mail:'by nexi@ (server) — see 📣 status',newText:true,oldText:false,btn:true} },

{ name:'🩹 stuck item repaired (v23.30): a briefing seeded blocked \'nexi-notify is not set up on this device (HR → memo SMS)\' is ACTIVE within 25 s of load (history "unblocked — e-mail is sent by nexi@ (v23.30)"); another item blocked by \'e-mail delivery needs a @abapardes.com.ph address\' → ✅ Activate → active; a mailbox item stays blocked (reading a mailbox is still not connected)',
  seed:new Function('('+SEED.toString()+')();'+"const it=(id,cat,why,ch)=>({id:id,user:'tester',title:id,objective:'',category:cat,scope:'work',sources:[],trigger:{kind:'schedule',time:'07:00',days:[1,2,3,4,5,6]},actions:['summarize'],delivery:{channel:ch||'mail'},authority:'read',allowUrgent:false,status:'blocked',missing:[],blockedWhy:why,version:1,createdAt:1,updatedAt:1,lastRunAt:0,history:[]});"
    +"localStorage.setItem('hydroPro_pa_support_v1',JSON.stringify([it('SUP_stuck','briefing','nexi-notify is not set up on this device (HR → memo SMS)'),it('SUP_alert','alert','e-mail delivery needs a @abapardes.com.ph address on your profile'),it('SUP_mailbox','mail','Reading your mailbox needs a connected mail account; today Nexi only SENDS briefings through nexi-notify. Mail Brief runs separately for Eyal.','app')]));"),
  requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}as('tester');
    const s=HNXPA.get('SUP_stuck')||{},a0=(HNXPA.get('SUP_alert')||{}).status;const ok=HNXPA.activate('SUP_alert');const a1=(HNXPA.get('SUP_alert')||{}).status;
    const okM=HNXPA.activate('SUP_mailbox'),m=HNXPA.get('SUP_mailbox')||{};
    return {stuck:s.status,why:s.blockedWhy,hist:(s.history||[]).map(h=>h.what).pop(),a0,ok,a1,okM,mail:m.status};})();`),
  expect:{stuck:'active',why:'',hist:'unblocked — e-mail is sent by nexi@ (v23.30)',a0:'blocked',ok:true,a1:'active',okM:false,mail:'blocked'} },

{ name:'📨 status lines from the server log (v23.30): jinky "✅ E-mail brief: active — last sent Wed 06:32 (next 06:30 tomorrow)." + "✅ WhatsApp: sent Wed 06:32 (CallMeBot confirmed)."; jean "⚠ Not set up: Administration ▸ 👥 Users ▸ 🧭 Assistant ▸ Work e-mail — put your @abapardes.com.ph address." + "📱 WhatsApp brief: not set up — 5 steps."; no log → "⚠ The nexi@ brief engine is not running yet" (last run 51 min ago at 08:37 = not running too; the morning limit is 50 min); dry → "🧪 Trial run — Nexi would e-mail you at 06:30 to jinkyp@abapardes.com.ph"; the 📣 box shows jinky\'s line',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}
    const now=Date.parse('2026-10-14T08:00:00+08:00'),L=mkLog();L.engine.lastRun='2026-10-14T07:46:00+08:00';
    L.days={'2026-10-14':{jinky:{k:'brief',e:{s:'sent',at:'2026-10-14T06:32:10+08:00'},w:{s:'sent',at:'2026-10-14T06:32:12+08:00',parts:1}}}};
    const f=s=>s.icon+' '+s.text;const sj=HNXUB.status('jinky',L,now),se=HNXUB.status('jean',L,now),sn=HNXUB.status('jinky',null,now);
    const stale=HNXUB.status('jinky',L,Date.parse('2026-10-14T08:37:00+08:00')),fresh50=HNXUB.status('jinky',L,Date.parse('2026-10-14T08:36:00+08:00'));
    const D=JSON.parse(JSON.stringify(L));D.engine.mode='dry';const sd=HNXUB.status('jinky',D,now);
    const O=JSON.parse(JSON.stringify(L));O.engine.mode='off';const so=HNXUB.status('jinky',O,now);
    /* the real screen, as jinky, with the cloud stubbed */
    stubCloud(mkLog());actAs('jinky');HNXPA.open('pa_brief');await sleep(3500);const box=txt('hnxUbStatus');
    return {jm:f(sj.mail),jw:f(sj.wa),em:f(se.mail),ew:f(se.wa),none:/^⚠ The nexi@ brief engine is not running yet\\. Admin: "paste nexi-morning-brief\\.gs v4 and run installUserBriefs/.test(f(sn.mail)),
      stale:/not running yet/.test(f(stale.mail)),fresh50:/not running yet/.test(f(fresh50.mail)),dry:f(sd.mail),off:f(so.mail),box:/✅ E-mail brief: active — last sent [A-Z][a-z]{2} 06:32/.test(box)&&/engine ✅ v4\\.0 · on/.test(box)};})();`),
  expect:{jm:'✅ E-mail brief: active — last sent Wed 06:32 (next 06:30 tomorrow).',jw:'✅ WhatsApp: sent Wed 06:32 (CallMeBot confirmed).',
    em:'⚠ Not set up: Administration ▸ 👥 Users ▸ 🧭 Assistant ▸ Work e-mail — put your @abapardes.com.ph address.',ew:'📱 WhatsApp brief: not set up — 5 steps.',
    none:true,stale:true,fresh50:false,dry:'🧪 Trial run — Nexi would e-mail you at 06:30 to jinkyp@abapardes.com.ph; nothing is sent until the owner switches it on.',
    off:'⏸ Morning briefs are switched off by the owner.',box:true} },

{ name:'📱 WhatsApp steps (v23.30): jean presses "📱 Get the brief on WhatsApp (5 steps)" → 5 steps shown, a link to callmebot.com, no <input> for a key anywhere in the box, no "+34" number in the page text',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(mkLog());actAs('jean');HNXPA.open('pa_brief');await sleep(3500);
    const before=(document.getElementById('hnxUbSteps')||{style:{}}).style.display;
    document.getElementById('hnxUbStepsBtn').click();await sleep(200);const S=document.getElementById('hnxUbSteps');
    const box=document.getElementById('hnxUbStatus'),links=[...S.querySelectorAll('a')].map(a=>a.href);
    return {before,shown:S.style.display,steps:S.querySelectorAll('li').length,link:links.some(h=>/^https:\\/\\/www\\.callmebot\\.com\\//.test(h)),inputs:box.querySelectorAll('input,textarea').length,
      plus34:/\\+\\s?34/.test(txt('view-pa_brief')),wa:/📱 WhatsApp brief: not set up — 5 steps/.test(box.innerText),key:/I allow callmebot to send me messages/.test(S.innerText)};})();`),
  expect:{before:'none',shown:'block',steps:5,link:true,inputs:0,plus34:false,wa:true,key:true} },

{ name:'📨 test button (v23.30): jinky presses "📨 Send me a test brief" → 1 push of nexibrief_req_jinky {user:jinky, by:jinky}; a 2nd press within 30 min → refused toast, still 1 push; when the server log has tests.jinky.id === that id → "✅ Test sent HH:MM — e-mail ✅ · WhatsApp ✅"; no cloud token → refused, 0 pushes',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(mkLog());actAs('jinky');HNXPA.open('pa_brief');await sleep(3500);
    const ok1=await HNXUB.ui.test();const p1=window.__pushes.length,P=window.__pushes[0]||{data:{}},key=Object.keys(P.data)[0],req=JSON.parse(P.data[key]||'{}');
    const waiting=txt('hnxUbTestMsg');
    const ok2=await HNXUB.ui.test();const p2=window.__pushes.length,refusedToast=toasts.some(t=>/One test every 30 minutes/.test(t));
    window.__LOG.tests={jinky:{id:req.id,at:new Date().toISOString(),s:'done',e:{s:'sent',at:new Date().toISOString()},w:{s:'sent',at:new Date().toISOString(),parts:1}}};
    await HNXUB.ui.refresh();const done=txt('hnxUbTestMsg');
    localStorage.removeItem('hnxlocal_brief_req_last');localStorage.removeItem('hnx_cloud_token');const ok3=await HNXUB.ui.test();const p3=window.__pushes.length;
    return {ok1,p1,key,user:req.user,by:req.by,idOk:/^BRQ_\\d+_[a-z0-9]{1,4}$/.test(req.id||''),waiting:/^⏳ Requested \\d\\d:\\d\\d — nexi@ sends it within 15 minutes$/.test(waiting),
      ok2,p2,refusedToast,done:/^✅ Test sent \\d\\d:\\d\\d — e-mail ✅ · WhatsApp ✅$/.test(done),doneTxt:done,ok3,p3,noTok:toasts.some(t=>/needs the cloud connection/.test(t))};})();`),
  expect:{ok1:true,p1:1,key:'nexibrief_req_jinky',user:'jinky',by:'jinky',idOk:true,waiting:true,ok2:false,p2:1,refusedToast:true,done:true,ok3:false,p3:1,noTok:true} },

{ name:'🗂 admin table (v23.30): the admin opens Administration ▸ 👥 Users ▸ 📨 Brief delivery → 4 rows = the active non-skipped users (jinky, jean, ederlyn, sup1 — mea inactive, tester skipped), the WA_ name per row (WA_JINKY, WA_JEAN, WA_EDERLYN, WA_SUP1), jean\'s e-mail red with the Fix "Work e-mail", sup1\'s Fix "send e-mail briefings"; "Only problems" → 2 rows; a supervisor gets no 📨 Brief delivery button and the table does not open',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(mkLog());as('tester');switchView('users');await sleep(3200);
    const bar=!!document.getElementById('hnxUbAdminBtn');HNXUB.ui.admin();await sleep(800);
    const R=[...document.querySelectorAll('#hnxUbAdminTable tr.hnxUbRow')];const users=R.map(r=>r.getAttribute('data-user'));
    const props=R.map(r=>r.querySelector('code').textContent);const row=u=>R.find(r=>r.getAttribute('data-user')===u);
    const jeanRed=/rgb\\(255, 138, 128\\)|#ff8a80/i.test(row('jean').children[1].innerHTML),jeanFix=row('jean').querySelector('.hnxUbFix').textContent,supFix=(row('sup1').querySelector('.hnxUbFix')||{}).textContent||'';
    HNXUB.ui.onlyProblems(true);await sleep(100);const nProb=document.querySelectorAll('#hnxUbAdminTable tr.hnxUbRow').length;
    const footer=/Keys are never shown or typed in Nexi/.test(txt('hnxUbAdmin'));
    document.getElementById('hnxUbAdmin').remove();const b=document.getElementById('hnxUbAdminBar');if(b)b.remove();
    actAs('sup1');await sleep(3200);const supBar=!!document.getElementById('hnxUbAdminBar');HNXUB.ui.admin();await sleep(200);const supModal=!!document.getElementById('hnxUbAdmin');
    return {bar,n:R.length,users,props,jeanRed,jeanFix:/Work e-mail/.test(jeanFix),supFix:/send e-mail briefings/.test(supFix),nProb,footer,supBar,supModal};})();`),
  expect:{bar:true,n:4,users:['jinky','jean','ederlyn','sup1'],props:['WA_JINKY','WA_JEAN','WA_EDERLYN','WA_SUP1'],jeanRed:true,jeanFix:true,supFix:true,nProb:2,footer:true,supBar:false,supModal:false} },

{ name:'🔐 scope snapshot (v23.30, admin session): 1 push of nexibrief_scope_v1 only; jean.m = her own 4 modules (overview, tasks, assistant, logistics — not the admin\'s 25+), jean.pay=false, jinky.pay=true, mea (inactive) absent; an unchanged snapshot is not pushed again; a non-admin session pushes nothing',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(mkLog());window.__hnxPulledOk=true;as('tester');
    localStorage.removeItem('hnxlocal_brief_scope_hash');const ok1=await HNXUB.publishScope();const p1=window.__pushes.length,P=window.__pushes[0]||{data:{}};
    const keys=Object.keys(P.data),snap=JSON.parse(P.data.nexibrief_scope_v1||'{}'),U=snap.users||{};
    const ok2=await HNXUB.publishScope();const p2=window.__pushes.length;
    actAs('jean');const ok3=await HNXUB.publishScope(true);const p3=window.__pushes.length;
    const adminN=(U.tester&&U.tester.m||[]).length;
    return {ok1,p1,keys,jeanM:(U.jean&&U.jean.m||[]).slice().sort(),jeanPay:U.jean&&U.jean.pay,jinkyPay:U.jinky&&U.jinky.pay,mea:'mea' in U,adminMany:adminN>=20,ok2,p2,ok3,p3,by:snap.by};})();`),
  expect:{ok1:true,p1:1,keys:['nexibrief_scope_v1'],jeanM:['assistant','logistics','overview','tasks'],jeanPay:false,jinkyPay:true,mea:false,adminMany:true,ok2:false,p2:1,ok3:false,p3:1,by:'tester'} },

{ name:'🔑 no secrets (v23.30): after the test request, the status box, the 🧭 card status and the admin table, no hydroPro_* value in localStorage contains "apikey"; the card shows "WA_JINKY" and no key field; nexibrief_* stores are never written to localStorage and are not sync keys (no hydroPro_ prefix, not in EXTRA_SYNC_KEYS)',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(mkLog());as('tester');
    HNXPA.ui.card('jinky');await sleep(2500);const card=txt('hnxUbCardStatus');const cardInputs=(document.getElementById('hnxUbCardStatus')||document.body).querySelectorAll('input').length;
    document.getElementById('hnxPaCard').remove();
    actAs('jinky');HNXPA.open('pa_brief');await sleep(3000);await HNXUB.ui.test();actAsTester();switchView('users');await sleep(2500);HNXUB.ui.admin();await sleep(600);
    const hp=Object.keys(localStorage).filter(k=>/^hydroPro_/.test(k)&&/apikey/i.test(localStorage.getItem(k)||''));
    const nb=Object.keys(localStorage).filter(k=>/^nexibrief_/.test(k));
    const src=await (await fetch(location.pathname)).text();const m=src.match(/var EXTRA_SYNC_KEYS=\\[([\\s\\S]*?)\\];/);
    const keys=Object.values(HNXUB.KEYS);
    return {hp,nb,card:/WA_JINKY/.test(card)&&/E-mail brief: active/.test(card),cardInputs,
      local:['hnxlocal_brief_log_cache','hnxlocal_brief_req_last'].every(k=>localStorage.getItem(k)!=null),
      notHydro:keys.every(k=>k.indexOf('hydroPro_')!==0),notExtra:!!m&&!/nexibrief|hnxlocal_brief/.test(m[1])};})();`),
  expect:{hp:[],nb:[],card:true,cardInputs:0,local:true,notHydro:true,notExtra:true} },
{ name:'⛔ test refused when nexi@ cannot answer (review fix): no server log (engine not running) → "📨 Send me a test brief" returns false, toast "engine is not running yet — no test can be sent", 0 pushes; USER_BRIEF off → false, toast "switched off by the owner", 0 pushes; a request already waiting while the engine is down reads "⏳ Requested HH:MM — waits for the nexi@ engine (not running)"',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(null);actAs('jinky');HNXPA.open('pa_brief');await sleep(3200);
    const ok1=await HNXUB.ui.test();const p1=window.__pushes.length,t1=toasts.some(t=>/engine is not running yet — no test can be sent/.test(t));
    const L=mkLog();L.engine.mode='off';window.__LOG=L;await HNXUB.ui.refresh();
    const ok2=await HNXUB.ui.test();const p2=window.__pushes.length,t2=toasts.some(t=>/switched off by the owner — no test can be sent/.test(t));
    window.__LOG=null;localStorage.setItem('hnxlocal_brief_req_last',JSON.stringify({id:'BRQ_1_x',user:'jinky',at:Date.now()-60000}));await HNXUB.ui.refresh();
    const w=txt('hnxUbTestMsg');
    return {ok1,p1,t1,ok2,p2,t2,wait:/^⏳ Requested \\d\\d:\\d\\d — waits for the nexi@ engine \\(not running\\)$/.test(w),w};})();`),
  expect:{ok1:false,p1:0,t1:true,ok2:false,p2:0,t2:true,wait:true} },

{ name:'📝 status texts (review fix): tester (system/test account) → "ℹ This account gets no morning brief (system / test account)."; jean (not admin), engine down → "… not running yet. The owner still has to switch it on."; leader eyal with no WhatsApp entry → "📱 Leadership WhatsApp: only if WA_EYAL is set on the server."; Sat 17 Oct after the 06:31 send → "(next Mon 06:30)"; Sun 18 Oct → "next 06:30 tomorrow (last sent Sat 06:31)"; daily cap skip → "⚠ Not sent today: daily mail cap — Administration is told."; HR e-mail of another user → "⚠ Not set up: the HR e-mail on file belongs to another user …"; key-name clash → "⚠ WhatsApp brief: another user has the same server key name WA_LOU …"; a test with WhatsApp card-off → "WhatsApp ⚠ not ticked on your 🧭 card" (no raw code)',
  seed:SEED, requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}as('tester');await sleep(1500);
    const f=s=>s.icon+' '+s.text,now=Date.parse('2026-10-14T08:00:00+08:00'),D7=[1,2,3,4,5,6];
    const L=mkLog();L.engine.lastRun='2026-10-14T07:50:00+08:00';
    L.setup.eyal={mail:'leader',mailFrom:'user',wa:'leader',waProp:'WA_EYAL',t:'07:00',eff:'07:00',days:D7};
    L.setup.lou={mail:'shared-email',mailFrom:'',wa:'key-name-clash',waProp:'WA_LOU',t:'07:00',eff:'07:00',days:D7};
    const skip=f(HNXUB.status('tester',L,now).mail),ld=f(HNXUB.status('eyal',L,now).wa),lm=f(HNXUB.status('lou',L,now).mail),lw=f(HNXUB.status('lou',L,now).wa);
    const sat=Date.parse('2026-10-17T08:00:00+08:00'),S=mkLog();S.engine.lastRun='2026-10-17T07:50:00+08:00';
    S.days={'2026-10-17':{jinky:{k:'brief',e:{s:'sent',at:'2026-10-17T06:31:00+08:00'},w:{s:'sent',at:'2026-10-17T06:31:00+08:00',parts:1}}}};
    const satM=f(HNXUB.status('jinky',S,sat).mail);
    const U=JSON.parse(JSON.stringify(S));U.engine.lastRun='2026-10-18T08:50:00+08:00';const sunM=f(HNXUB.status('jinky',U,Date.parse('2026-10-18T09:00:00+08:00')).mail);
    const K=mkLog();K.engine.lastRun='2026-10-14T07:50:00+08:00';K.days={'2026-10-14':{jinky:{k:'brief',e:{s:'skip',at:'2026-10-14T06:31:00+08:00',why:'daily mail cap'}}}};
    const capM=f(HNXUB.status('jinky',K,now).mail);
    actAs('jean');const nonAdmin=f(HNXUB.status('jean',null,now).mail);
    const T=mkLog();T.setup.jinky.wa='card-off';T.tests={jinky:{id:'BRQ_9_x',at:new Date().toISOString(),s:'done',e:{s:'sent',at:new Date().toISOString()}}};
    localStorage.setItem('hnxlocal_brief_req_last',JSON.stringify({id:'BRQ_9_x',user:'jinky',at:Date.now()}));
    stubCloud(T);actAs('jinky');HNXPA.open('pa_brief');await sleep(3200);const tm=txt('hnxUbTestMsg');
    return {skip,nonAdmin,ld,satM,sunM,capM,lm:/^⚠ Not set up: the HR e-mail on file belongs to another user — Administration ▸ 👥 Users ▸ 🧭 Assistant ▸ Work e-mail/.test(lm),lw,tm:tm.replace(/\\d\\d:\\d\\d/,'HH:MM')};})();`),
  expect:{skip:'ℹ This account gets no morning brief (system / test account).',
    nonAdmin:'⚠ The nexi@ brief engine is not running yet. The owner still has to switch it on.',
    ld:'📱 Leadership WhatsApp: only if WA_EYAL is set on the server.',
    satM:'✅ E-mail brief: active — last sent Sat 06:31 (next Mon 06:30).',
    sunM:'✅ E-mail brief: active — next 06:30 tomorrow (last sent Sat 06:31).',
    capM:'⚠ Not sent today: daily mail cap — Administration is told.',
    lm:true,
    lw:'⚠ WhatsApp brief: another user has the same server key name WA_LOU — Administration renames one of the two accounts.',
    tm:'✅ Test sent HH:MM — e-mail ✅ · WhatsApp ⚠ not ticked on your 🧭 card'} },

{ name:'🗂 admin table, review fixes: Iris Ben Ari → server key name WA_IRIS (not WA_EYAL), Amy Santos (amy.s) → WA_AMY_S (not WA_AMY); jean (Users e-mail jean@gmail.com, HR jean.op@abapardes.com.ph) → "jean.op@abapardes.com.ph · from HR record"; mark.d + mark_d → both WhatsApp "same server key name WA_MARK_D"; no Fix ends in "WhatsApp (optional):" and no Fix repeats a step; the admin chip shows the engine error "⚠ Cloud login failed"; jean\'s 🧭 card saved from the table with jean@abapardes.com.ph → her row shows it "from 🧭 card" without reopening',
  seed:new Function('('+SEED.toString()+')();'+"var U=JSON.parse(localStorage.getItem('hydroPro_users'));U.push({username:'iris',fullname:'Iris Ben Ari',passwordHash:'x',role:'operator',active:true,email:'iris@abapardes.com.ph'},{username:'amy.s',fullname:'Amy Santos',passwordHash:'x',role:'operator',active:true,email:'amys@abapardes.com.ph'},{username:'mark.d',fullname:'Mark Dela',passwordHash:'x',role:'operator',active:true,email:'markd@abapardes.com.ph'},{username:'mark_d',fullname:'Mark Dino',passwordHash:'x',role:'operator',active:true,email:'markdino@abapardes.com.ph'});localStorage.setItem('hydroPro_users',JSON.stringify(U));"
    +"localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E77',name:'Jean Operator',username:'jean',email:'jean.op@abapardes.com.ph',status:'Active'}]));"),
  requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}const L=mkLog();L.engine.lastErr='Cloud login failed: bad password (2026-10-14T00:10:00Z)';stubCloud(L);as('tester');switchView('users');await sleep(3200);
    HNXUB.ui.admin();await sleep(900);
    const R=()=>[...document.querySelectorAll('#hnxUbAdminTable tr.hnxUbRow')],row=u=>R().find(r=>r.getAttribute('data-user')===u);

    const key=u=>(row(u).querySelector('code')||{}).textContent;
    const jeanCell=row('jean').children[1].innerText.replace(/\\s+/g,' ').trim();
    const clash=['mark.d','mark_d'].every(u=>/same server key name WA_MARK_D/.test(row(u).children[4].innerText));
    const fixes=R().map(r=>((r.querySelector('.hnxUbFix')||{}).textContent||''));
    const dangling=fixes.filter(x=>/WhatsApp \\(optional\\):\\s*$/.test(x)).length,dup=fixes.filter(x=>{const p=x.split(' · ');return new Set(p).size!==p.length;}).length;
    const chipErr=/⚠ Cloud login failed/.test(txt('hnxUbAdmin'));const iris=key('iris'),amys=key('amy.s'),n0=R().map(r=>r.getAttribute('data-user')).join(',');
    HNXPA.ui.card('jean');await sleep(700);const inp=document.getElementById('pcMail');inp.value='jean@abapardes.com.ph';HNXPA.ui.saveCard('jean');await sleep(3200);
    const n1=R().map(r=>r.getAttribute('data-user')).join(','),after=row('jean').children[1].innerText.replace(/\\s+/g,' ').trim(),open=!!document.getElementById('hnxUbAdmin');
    document.getElementById('hnxUbAdmin').remove();
    return {iris,amys,jeanCell,clash,dangling,dup,chipErr,after,open,same:n0===n1?true:n0+' → '+n1};})();`),
  expect:{iris:'WA_IRIS',amys:'WA_AMY_S',jeanCell:'jean.op@abapardes.com.ph from HR record',clash:true,dangling:0,dup:0,chipErr:true,after:'jean@abapardes.com.ph from 🧭 card',open:true,same:true} },

{ name:'🌗 light theme + snapshot on access change (review fix): light theme → the 📣 status box and the assistant cards have a light background (not the dark .view .card gradient); an admin removes jean\'s Logistics (🔐 override "none") → within 12 s a new nexibrief_scope_v1 is pushed without logistics in jean.m; jean (Users e-mail jean@gmail.com) carries her HR e-mail jean.op@abapardes.com.ph in the snapshot',
  seed:new Function('('+SEED.toString()+')();'+"localStorage.setItem('hydroPro_employees',JSON.stringify([{id:'E77',name:'Jean Operator',username:'jean',email:'jean.op@abapardes.com.ph',status:'Active'}]));"),
  requires:"!!window.HNXUB",
  run:new Function(`return (async()=>{${AS}${KIT}stubCloud(mkLog());window.__hnxPulledOk=true;as('tester');
    try{hnxSetTheme('light');}catch(e){}await sleep(300);actAs('jinky');HNXPA.open('pa_brief');await sleep(3200);
    const lum=el=>{const m=String(getComputedStyle(el).backgroundColor).match(/\\d+(\\.\\d+)?/g)||[0,0,0];return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255;};
    const box=document.getElementById('hnxUbStatus'),bgImg=getComputedStyle(box).backgroundImage,boxLum=lum(box);
    const cards=[...document.querySelectorAll('#view-pa_brief .card')],cardsLight=cards.length>0&&cards.every(c=>getComputedStyle(c).backgroundImage==='none'&&lum(c)>0.6);
    const light=document.body.classList.contains('hnx-light');try{hnxSetTheme('dark');}catch(e){}actAsTester();
    localStorage.removeItem('hnxlocal_brief_scope_hash');await HNXUB.publishScope(true);const p0=window.__pushes.length;
    const s0=JSON.parse((window.__pushes[p0-1]||{data:{}}).data.nexibrief_scope_v1||'{}'),j0=(s0.users||{}).jean||{};
    await sleep(10500);
    const P=JSON.parse(localStorage.getItem('hydroPro_user_perms')||'{}');P.jean=Object.assign({},P.jean||{},{overrides:Object.assign({},(P.jean||{}).overrides||{},{'module:logistics':'none'})});
    localStorage.setItem('hydroPro_user_perms',JSON.stringify(P));await sleep(12000);
    const scopes=window.__pushes.filter(x=>x.data&&x.data.nexibrief_scope_v1),last=JSON.parse(scopes[scopes.length-1].data.nexibrief_scope_v1),j1=last.users.jean||{};
    return {light,bgImg,boxLight:boxLum>0.6,cardsLight,had:(j0.m||[]).indexOf('logistics')>=0,pushedAgain:window.__pushes.length>p0,lost:(j1.m||[]).indexOf('logistics')<0,hrMail:j0.mail};})();`),
  expect:{light:true,bgImg:'none',boxLight:true,cardsLight:true,had:true,pushedAgain:true,lost:true,hrMail:'jean.op@abapardes.com.ph'} }
];
