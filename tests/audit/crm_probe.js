/* CRM audit probe: boots the real index.html once, opens every CRM screen, clicks every button/link inside it
   (except destructive ones), and records page errors, empty screens, "failed to load" toasts, dialogs and
   every outbound request (workers, QuickBooks, SOS). Output: JSON on stdout. */
const {chromium}=require('playwright-core');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT=process.env.PORT||'8830';
const BOOT_MS=+(process.env.BOOT_MS||25000);
const DESTRUCTIVE=/delete|remove|clear|reset|wipe|purge|erase|sign out|logout|drop|archive all|danger/i;
(async()=>{
  const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  const pg=await b.newPage({viewport:{width:1600,height:1000}});
  const errs=[],dialogs=[],reqs=[];
  pg.on('pageerror',e=>errs.push({at:Date.now(),msg:String(e).slice(0,200)}));
  pg.on('dialog',d=>{dialogs.push({at:Date.now(),type:d.type(),msg:d.message().slice(0,160)});d.type()==='confirm'?d.dismiss():d.accept();});
  pg.on('request',r=>{const u=r.url();if(/127\.0\.0\.1|localhost|fonts\.g|cdnjs|jsdelivr|data:/.test(u))return;reqs.push({at:Date.now(),m:r.method(),u:u.slice(0,160)});});
  await pg.addInitScript(()=>{
    localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},{username:'jinky',fullname:'Jinky Pagtama',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true}]));
    localStorage.setItem('hnx_first_boot','2026-01-01');
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));
    localStorage.setItem('hydroPro_memos','[]');
    /* a little CRM data so screens have something to show */
    localStorage.setItem('hydroPro_crm_leads',JSON.stringify([{id:'L1',company:'Marriott Cebu',contact:'Ana Cruz',email:'ana@example.com',phone:'0917',stage:'won',segment:'hotel',value:120000,createdAt:Date.now()-86400000*20,updatedAt:Date.now()-86400000},{id:'L2',company:'Seda Ayala',contact:'Bo Lim',stage:'sample',segment:'hotel',value:45000,createdAt:Date.now()-86400000*5,updatedAt:Date.now()}]));
    window.__probe={toasts:[]};
    const ot=window.showToast;document.addEventListener('DOMContentLoaded',()=>{const w=window.showToast;window.showToast=function(m,k){try{window.__probe.toasts.push({at:Date.now(),m:String(m).slice(0,160),k});}catch(e){}return w&&w.apply(this,arguments);};});
  });
  await pg.goto('http://127.0.0.1:'+PORT+'/index.html?cb='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
  await pg.waitForTimeout(BOOT_MS);
  const views=await pg.evaluate(()=>{const M=(typeof MODULES!=='undefined'?MODULES:window.MODULES)||{};return (M.crm&&M.crm.views||[]).filter(v=>v&&v.id).map(v=>({id:v.id,label:v.label,perm:v.perm||null,hidden:!!v.hidden}));});
  const out={views:[],errs,dialogs,reqs};
  for(const v of views){
    const t0=Date.now();const e0=errs.length,r0=reqs.length,d0=dialogs.length;
    let r;
    try{
      await pg.evaluate(id=>{window.__probe.toasts=[];switchView(id);},v.id);
      await pg.waitForTimeout(1800);
      r=await pg.evaluate(id=>{
        const a=document.querySelector('.view.active'),el=document.getElementById('view-'+id);
        const html=el?el.innerHTML:'';const txt=el?el.innerText.replace(/\s+/g,' ').trim():'';
        const btns=el?Array.from(el.querySelectorAll('button,a[href="#"],a[onclick],[onclick]')).filter(x=>x.offsetParent!==null).map((x,i)=>({i,tag:x.tagName,text:(x.innerText||x.value||x.title||'').replace(/\s+/g,' ').trim().slice(0,50),oc:(x.getAttribute('onclick')||'').slice(0,90)})):[];
        return {active:a&&a.id,htmlLen:html.length,textLen:txt.length,sample:txt.slice(0,220),btns,toasts:window.__probe.toasts.slice(),loading:/Loading…|Render error|failed to load/i.test(txt),tabs:Array.from(el?el.querySelectorAll('.tab,.subtab,[data-tab]'):[]).length};
      },v.id);
    }catch(e){r={evalError:String(e.message).slice(0,200),btns:[]};}
    const clicks=[];
    const seen=new Set();
    for(const bt of (r.btns||[]).slice(0,60)){
      const key=bt.text+'|'+bt.oc;if(seen.has(key))continue;seen.add(key);
      if(DESTRUCTIVE.test(bt.text)||DESTRUCTIVE.test(bt.oc))continue;
      const ce=errs.length,cd=dialogs.length,cr=reqs.length;
      let res={};
      try{
        res=await pg.evaluate(({id,i})=>{const el=document.getElementById('view-'+id);const list=el?Array.from(el.querySelectorAll('button,a[href="#"],a[onclick],[onclick]')).filter(x=>x.offsetParent!==null):[];const x=list[i];if(!x)return {gone:true};window.__probe.toasts=[];try{x.click();}catch(e){return {clickErr:String(e.message).slice(0,120)};}return {ok:true};},{id:v.id,i:bt.i});
        await pg.waitForTimeout(500);
        const after=await pg.evaluate(id=>{const a=document.querySelector('.view.active');const modals=Array.from(document.body.children).filter(x=>x.nodeType===1&&/fixed/.test(getComputedStyle(x).position)&&x.offsetParent!==null&&x.getBoundingClientRect().width>300).map(x=>x.id||x.className||x.tagName).slice(0,3);return {active:a&&a.id,toasts:window.__probe.toasts.slice(0,3),modals};},v.id);
        res=Object.assign(res,after);
        /* close whatever opened and come back */
        await pg.evaluate(id=>{Array.from(document.body.children).forEach(x=>{try{if(x.nodeType===1&&/fixed/.test(getComputedStyle(x).position)&&x.id&&!/hnxRail|toastHost|hnxSaveAlarm|notif|hnxAlert|hnxSTO/.test(x.id)&&x.getBoundingClientRect().width>300&&/modal|F$|overlay|drawer|popup|dlg|hnx/i.test(x.id))x.remove();}catch(e){}});const a=document.querySelector('.view.active');if(!a||a.id!=='view-'+id)try{switchView(id);}catch(e){}},v.id);
        await pg.waitForTimeout(250);
      }catch(e){res.err=String(e.message).slice(0,160);}
      clicks.push({text:bt.text,oc:bt.oc,res,errs:errs.slice(ce).map(x=>x.msg),dialogs:dialogs.slice(cd).map(x=>x.msg),reqs:reqs.slice(cr).map(x=>x.m+' '+x.u)});
    }
    out.views.push({id:v.id,label:v.label,perm:v.perm,hidden:v.hidden,ms:Date.now()-t0,render:r,errs:errs.slice(e0).map(x=>x.msg),reqs:reqs.slice(r0).map(x=>x.m+' '+x.u),dialogs:dialogs.slice(d0).map(x=>x.msg),clicks});
    process.stderr.write(v.id+' '+(r.htmlLen||0)+'b '+clicks.length+' clicks '+errs.slice(e0).length+' errs\n');
  }
  await b.close();
  console.log(JSON.stringify(out,null,1));
})().catch(e=>{console.error(e);process.exit(1);});
