/* v23.40 (Eyal, 14 Oct 2026: "i would like to have this video in a loop no voice in main screen Nexi when you log in first you see that
   until you go to the screen that you need"). 🎬 The HydroNexis-AI film (media/nexi-welcome.webm / .mp4 — no sound track at all) loops
   silently over the CONTENT area after sign-in until a screen is chosen; the sidebar, the module tabs and the top bar stay in front.
   The rulebook drives the other screens with a real mouse, so under the harness the film waits for hnx_wv_test=1 — these cases set it
   (the last case checks that without it nothing shows). */
const SEED=function(){localStorage.setItem('hnx_wv_test','1');};
module.exports=[
{ name:'🎬 Welcome video v23.40: after sign-in #hnxWelcomeVideo covers the content area only — left = the content’s left edge (right of the sidebar rail, whatever its width), top ≥ the top bar’s bottom, inside the viewport, z-index 45; <video> muted=true loop=true autoplay=true playsinline volume 0, sources media/nexi-welcome.webm then media/nexi-welcome.mp4, poster media/nexi-welcome-poster.jpg, playing with 0 audio bytes decoded (no sound track) and video bytes > 0; the hint reads “Choose a screen from the menu, or click to continue”, the brand says HydroNexis-AI; the menu rail (#hnxRail or #moduleSidebar, whichever this width shows) and the module tab bar are in front of the film at their centres; the film is the element at the centre of the content; the box is laid out in real viewport px under the page’s A− 115 % A+ zoom',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV();if(!ov)return {shown:false,state:HNXWV.state()};
    const v=ov.querySelector('video'),r=ov.getBoundingClientRect(),sb=document.getElementById('moduleSidebar').getBoundingClientRect(),tb=document.getElementById('topbar').getBoundingClientRect();
    const mid=el=>{const b=el.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2];};
    /* in front = the first element painted at the point that is the film or the rail/tab bar is NOT the film (the harness’s cloud banners may sit above both) */
    const front=el=>{if(!el)return null;const [x,y]=mid(el);const L=document.elementsFromPoint(x,y);const i=L.findIndex(e=>ov.contains(e)),j=L.findIndex(e=>el.contains(e));return j>=0&&(i<0||j<i);};
    const rail=[...document.querySelectorAll('#hnxRail,#moduleSidebar')].find(e=>e.getBoundingClientRect().width>0),tabs=document.getElementById('moduleHeader');
    const centre=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    const main=document.getElementById('appMain').getBoundingClientRect();
    return {shown:true,mode:ov.getAttribute('data-mode'),leftOk:r.left>=sb.right-1&&Math.abs(r.left-Math.max(sb.right,main.left))<=1,left:Math.round(r.left),topOk:r.top>=tb.bottom-1,fits:r.right<=innerWidth&&r.bottom<=innerHeight&&r.left>=0&&r.width>300,
      z:getComputedStyle(ov).zIndex,muted:v.muted,loop:v.loop,autoplay:v.autoplay,inline:v.playsInline||v.hasAttribute('playsinline'),vol:v.volume,
      srcs:[...v.querySelectorAll('source')].map(s=>s.getAttribute('src')+'|'+s.getAttribute('type')),poster:v.getAttribute('poster'),
      playing:!v.paused&&v.readyState>=2&&v.currentTime>0,audioBytes:v.webkitAudioDecodedByteCount||0,videoBytes:(v.webkitVideoDecodedByteCount||0)>0,
      hint:(ov.querySelector('.hnx-wv-hint')||{}).textContent,brand:/HydroNexis-AI/.test((ov.querySelector('.hnx-wv-brand')||{}).textContent||''),
      railFront:front(rail),tabsFront:front(tabs),zoom:getComputedStyle(document.body).zoom,centreIsFilm:!!(centre&&ov.contains(centre)),landingIsCurrent:HNXWV.state().landing===String(window.currentView)};},
  expect:{shown:true,mode:'video',leftOk:true,topOk:true,fits:true,z:'45',muted:true,loop:true,autoplay:true,inline:true,vol:0,
    srcs:['media/nexi-welcome.webm|video/webm','media/nexi-welcome.mp4|video/mp4'],poster:'media/nexi-welcome-poster.jpg',playing:true,audioBytes:0,videoBytes:true,
    hint:'Choose a screen from the menu, or click to continue',brand:true,railFront:true,tabsFront:true,centreIsFilm:true,landingIsCurrent:true} },

{ name:'🎬 Welcome video v23.40: switchView(\'geo_dash\') removes the film — the overlay is gone, the video paused and unloaded (0 <source> left, no src), dismissed = "nav", the Global Dashboard is the active view; shown again, a sidebar click (HR) removes it ("menu")',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV(),v=ov&&ov.querySelector('video');
    switchView('geo_dash');await sleep(300);
    const gone=!OV(),paused=v?v.paused:null,srcLeft=v?v.querySelectorAll('source').length:null,src=v?(v.getAttribute('src')||''):null,how=HNXWV.state().dismissed,active=(document.querySelector('.view.active')||{}).id;
    const again=HNXWV.show();await sleep(300);const shown2=!!OV();
    document.getElementById('modBtn-hr').click();await sleep(400);
    return {had:!!ov,gone,paused,srcLeft,src,how,active,again,shown2,gone2:!OV(),how2:HNXWV.state().dismissed};},
  expect:{had:true,gone:true,paused:true,srcLeft:0,src:'',how:'nav',active:'view-geo_dash',again:true,shown2:true,gone2:true,how2:'menu'} },

{ name:'🎬 Welcome video v23.40: a click on the film removes it ("click") and the landing view stays; shown again, Esc removes it ("key"); again, Enter; again, Space (its default prevented on the body); Enter typed into an input does not remove it; show() keeps ONE overlay (5 shows in all, never two at once)',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV();if(!ov)return {shown:false};const landing=String(window.currentView);
    ov.click();await sleep(100);const c={gone:!OV(),how:HNXWV.state().dismissed,same:String(window.currentView)===landing};
    const key=(k,target)=>{const ev=new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true});(target||document.body).dispatchEvent(ev);return ev.defaultPrevented;};
    HNXWV.show();await sleep(100);key('Escape');await sleep(50);const esc={gone:!OV(),how:HNXWV.state().dismissed};
    HNXWV.show();await sleep(100);key('Enter');await sleep(50);const ent={gone:!OV(),how:HNXWV.state().dismissed};
    HNXWV.show();await sleep(100);const prevented=key(' ');await sleep(50);const spc={gone:!OV(),how:HNXWV.state().dismissed,prevented};
    HNXWV.show();await sleep(100);const inp=document.createElement('input');document.body.appendChild(inp);inp.focus();key('Enter',inp);await sleep(50);const typed={stays:!!OV()};inp.remove();
    const one=HNXWV.show();const n=document.querySelectorAll('#hnxWelcomeVideo').length;HNXWV.dismiss('test');
    return {c,esc,ent,spc,typed,one,n,shows:HNXWV.state().shows};},
  expect:{c:{gone:true,how:'click',same:true},esc:{gone:true,how:'key'},ent:{gone:true,how:'key'},spc:{gone:true,how:'key',prevented:true},typed:{stays:true},one:true,n:1,shows:5} },

{ name:'🛟 Welcome video v23.40: safe mode (?safe=1 → hnx_safe) → no overlay at all, HNXWV.why() = "safe", show() returns false and still shows nothing',
  seed:function(){localStorage.setItem('hnx_wv_test','1');sessionStorage.setItem('hnx_safe','1');}, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(1500);return {safe:!!window.__HNX_SAFE,ov:!!OV(),why:HNXWV.why(),show:HNXWV.show(),ov2:!!OV()};},
  expect:{safe:true,ov:false,why:'safe',show:false,ov2:false} },

{ name:'⚙ Welcome video v23.40: the synced switch OFF (hydroPro_welcome_video_v1 {on:false,by:"eyal",at}) → nothing shows, why() = "off"; a supervisor cannot switch it (ok:false); the admin switches it ON → {on:true,by:"tester",_lww:true} stored with at/updatedAt, the audit log says "🎬 Welcome video on sign-in switched ON for every computer", show() works; OFF again removes the showing film ("off")',
  seed:function(){localStorage.setItem('hnx_wv_test','1');localStorage.setItem('hydroPro_welcome_video_v1',JSON.stringify({on:false,by:'eyal',at:1760400000000}));}, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(1500);const off={ov:!!OV(),why:HNXWV.why(),cfg:HNXWV.cfg()};
    actAs('mea');const sup=HNXWV.setOn(true);actAsTester();
    const on=HNXWV.setOn(true);const st=JSON.parse(localStorage.getItem('hydroPro_welcome_video_v1'));
    const aud=(JSON.parse(localStorage.getItem('hydroPro_audit')||'[]')).filter(a=>/🎬 Welcome video on sign-in switched ON for every computer/.test(a.d||'')).length;
    const show=HNXWV.show();await sleep(300);const shown=!!OV();
    HNXWV.setOn(false);await sleep(100);
    return {off,supOk:sup.ok,onOk:on.ok,st:{on:st.on,by:st.by,lww:st._lww,at:st.at>1760000000000&&st.updatedAt===st.at},aud,show,shown,gone:!OV(),how:HNXWV.state().dismissed,why2:HNXWV.why()};},
  expect:{off:{ov:false,why:'off',cfg:{on:false,by:'eyal',at:1760400000000}},supOk:false,onOk:true,st:{on:true,by:'tester',lww:true,at:true},aud:1,show:true,shown:true,gone:true,how:'off',why2:'off'} },

{ name:'🎞 Welcome video v23.40 with prefers-reduced-motion: reduce → the still picture only: data-mode poster, no <video> at all, the poster <img> media/nexi-welcome-poster.jpg visible, still = "reduced-motion", the same hint',
  seed:SEED, requires:"!!window.HNXWV", drive:async pg=>{await pg.emulateMedia({reducedMotion:'reduce'});return 'reduce';},
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');HNXWV.dismiss('test');HNXWV.show();await sleep(600);const ov=OV();if(!ov)return {shown:false,state:HNXWV.state()};const img=ov.querySelector('.hnx-wv-poster');
    return {shown:true,mode:ov.getAttribute('data-mode'),video:!!ov.querySelector('video'),img:!!(img&&getComputedStyle(img).display!=='none'&&/media\/nexi-welcome-poster\.jpg$/.test(img.src)),still:HNXWV.still(),hint:(ov.querySelector('.hnx-wv-hint')||{}).textContent};},
  expect:{drive:'reduce',shown:true,mode:'poster',video:false,img:true,still:'reduced-motion',hint:'Choose a screen from the menu, or click to continue'} },

{ name:'🎞 Welcome video v23.40 with 🎞 Motion off (html.hnx-iv-m-off) → poster only (still = "motion-off", no <video>); Motion back on → the film plays again (video mode, muted)',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(1500);HNXWV.dismiss('test');document.documentElement.classList.add('hnx-iv-m-off');HNXWV.show();await sleep(400);const a=OV();
    const off={mode:a&&a.getAttribute('data-mode'),video:!!(a&&a.querySelector('video')),still:HNXWV.state().still};
    HNXWV.dismiss('test');document.documentElement.classList.remove('hnx-iv-m-off');HNXWV.show();await sleep(400);const b=OV(),v=b&&b.querySelector('video');
    return {off,on:{mode:b&&b.getAttribute('data-mode'),video:!!v,muted:v?v.muted:null}};},
  expect:{off:{mode:'poster',video:false,still:'motion-off'},on:{mode:'video',video:true,muted:true}} },

{ name:'📱 Welcome video v23.40 on a 400×860 phone: the overlay fits the viewport (right ≤ 400, bottom ≤ 860), starts at the content’s left edge (the sidebar rail is hidden or 60 px on a phone), adds no sideways scroll (the page’s scrollWidth is the same with and without it), the hint is readable (12px) and inside the overlay',
  viewport:{width:400,height:860}, seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV();if(!ov)return {shown:false,state:HNXWV.state()};const r=ov.getBoundingClientRect(),sw1=document.documentElement.scrollWidth;
    HNXWV.dismiss('test');await sleep(100);const sw0=document.documentElement.scrollWidth;HNXWV.show();await sleep(300);const o2=OV(),h=o2.querySelector('.hnx-wv-hint span'),hr=h.getBoundingClientRect(),r2=o2.getBoundingClientRect();
    return {shown:true,vw:innerWidth,fits:r.right<=innerWidth&&r.bottom<=innerHeight&&r.left>=0&&r.width>200,leftOk:(()=>{const sb=document.getElementById('moduleSidebar').getBoundingClientRect(),m=document.getElementById('appMain').getBoundingClientRect();return r.left>=sb.right-1&&Math.abs(r.left-Math.max(sb.right,m.left))<=1;})(),left:Math.round(r.left),
      addsOverflow:sw1>sw0,hintFont:getComputedStyle(h).fontSize,hintInside:hr.left>=r2.left-1&&hr.right<=r2.right+1&&hr.bottom<=r2.bottom+1&&hr.width>100,hintText:h.textContent};},
  expect:{shown:true,vw:400,fits:true,leftOk:true,addsOverflow:false,hintFont:'12px',hintInside:true,hintText:'Choose a screen from the menu, or click to continue'} },

{ name:'🧷 Welcome video v23.40 follows a layout that settles AFTER it shows (size observers, not the 400-ms tick the governor may stretch): the sidebar made 400 px wide → within 150 ms the film\'s left edge is at 400 and it still ends at the right window edge; sidebar back → within 150 ms the left edge is back where it was',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV();if(!ov)return {shown:false};const sb=document.getElementById('moduleSidebar');const R=()=>ov.getBoundingClientRect();
    const left0=Math.round(R().left),sbw0=Math.round(sb.getBoundingClientRect().width);['width','min-width','max-width'].forEach(p=>sb.style.setProperty(p,'400px','important'));await sleep(150);const r1=R(),sbr=Math.round(sb.getBoundingClientRect().right);
    const wide={sbRight:sbr,leftFollows:Math.abs(Math.round(r1.left)-sbr)<=1&&sbr>=399,rightOk:Math.abs(Math.round(r1.right)-innerWidth)<=1};
    ['width','min-width','max-width'].forEach(p=>sb.style.removeProperty(p));await sleep(150);const back={left:Math.round(R().left)===left0,sbw:Math.round(sb.getBoundingClientRect().width)===sbw0};
    return {shown:true,wide:{leftFollows:wide.leftFollows,rightOk:wide.rightOk},back};},
  expect:{shown:true,wide:{leftFollows:true,rightOk:true},back:{left:true,sbw:true}} },

{ name:'📱 Welcome video v23.40 is never adopted by the phone layout as a widget (hnx-phonelayout tray): at 400×860, 4 s after it shows, the film is still a direct child of <body>, position fixed, outside #hnxPhoneTray, full width 400 and ending at the window bottom; moved into the tray by hand with position static → within 2.5 s it is back on <body>, fixed and full width (self-heal)',
  viewport:{width:400,height:860}, seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(4000);const ov=OV();if(!ov)return {shown:false,state:HNXWV.state()};const R=()=>ov.getBoundingClientRect();
    const a={onBody:ov.parentElement===document.body,fixed:getComputedStyle(ov).position==='fixed',inTray:!!ov.closest('#hnxPhoneTray'),w:Math.round(R().width),bottom:Math.round(R().bottom)};
    let tray=document.getElementById('hnxPhoneTray');if(!tray){tray=document.createElement('div');tray.id='hnxPhoneTray';tray.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99995;';document.body.appendChild(tray);}
    tray.appendChild(ov);['position','max-width','overflow','white-space'].forEach((p,i)=>ov.style.setProperty(p,['static','140px','hidden','nowrap'][i],'important'));await sleep(2500);
    const o2=OV();const b={onBody:o2.parentElement===document.body,fixed:getComputedStyle(o2).position==='fixed',w:Math.round(o2.getBoundingClientRect().width),bottom:Math.round(o2.getBoundingClientRect().bottom)};
    return {shown:true,a,b};},
  expect:{shown:true,a:{onBody:true,fixed:true,inTray:false,w:400,bottom:860},b:{onBody:true,fixed:true,w:400,bottom:860}} },

{ name:'🧱 Welcome video v23.40 never covers a notice: z-index 45 < .modal-overlay 500 < toast 9999 (all three fixed, the toast and the film direct children of <body>, the toast pointer-events none); a modal INSIDE the content area (#maintPartsModal lives in #appMain, a stacking context at z 1) opened while the film shows → within 600 ms the film hides (visibility hidden, hidden:true) and the video pauses, the modal box is the element at its own centre; closed → the film is back and playing; a modal at <body> level (#profileModal) paints above the film at its centre and the film stays',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV();if(!ov)return {shown:false};const v=ov.querySelector('video');const at=el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);};
    showToast('hello film','ok');await sleep(150);const t=document.getElementById('toast');const toast={z:getComputedStyle(t).zIndex,above:+getComputedStyle(t).zIndex>+getComputedStyle(ov).zIndex,body:t.parentElement===document.body&&ov.parentElement===document.body,pe:getComputedStyle(t).pointerEvents};
    const m=document.getElementById('maintPartsModal'),am=document.getElementById('appMain');m.classList.add('open');await sleep(700);const box=m.querySelector('.modal');const e=at(box);
    const inMain={inMain:am.contains(m),zm:getComputedStyle(m).zIndex,hidden:getComputedStyle(ov).visibility==='hidden',st:HNXWV.state().hidden,paused:v.paused,modalTop:!!(e&&m.contains(e))};
    m.classList.remove('open');await sleep(700);const back={visible:getComputedStyle(ov).visibility==='visible',st:HNXWV.state().hidden,playing:!v.paused};
    const pm=document.getElementById('profileModal');pm.classList.add('open');await sleep(700);const pb=pm.querySelector('.modal'),pe=at(pb);const root={inMain:am.contains(pm),modalTop:!!(pe&&pm.contains(pe)),filmStays:getComputedStyle(ov).visibility==='visible'&&!!OV()};pm.classList.remove('open');
    return {shown:true,z:getComputedStyle(ov).zIndex,toast,inMain,back,root};},
  expect:{shown:true,z:'45',toast:{z:'9999',above:true,body:true,pe:'none'},inMain:{inMain:true,zm:'500',hidden:true,st:true,paused:true,modalTop:true},back:{visible:true,st:false,playing:true},root:{inMain:false,modalTop:true,filmStays:true}} },

{ name:'🔁 Welcome video v23.40 shows again on the next sign-in: film → doLogout() removes it ("sign-out") and the sign-in box shows; sign in again (session + showApp()) → the film is back within a second (2 shows), muted, over the content, the sign-in box hidden',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const first=!!OV();doLogout();await sleep(300);const afterOut=!!OV(),how=HNXWV.state().dismissed,login=document.getElementById('loginScreen').style.display;
    sessionStorage.setItem('hydroPro_session',JSON.stringify({username:'tester',loginAt:Date.now()}));showApp();await sleep(1200);const ov=OV(),v=ov&&ov.querySelector('video');
    return {first,afterOut,how,login,back:!!ov,shows:HNXWV.state().shows,muted:v?v.muted:null,loginHidden:document.getElementById('loginScreen').style.display==='none',leftOk:ov?ov.getBoundingClientRect().left>=document.getElementById('moduleSidebar').getBoundingClientRect().right-1:null};},
  expect:{first:true,afterOut:false,how:'sign-out',login:'flex',back:true,shows:2,muted:true,loginHidden:true,leftOk:true} },

{ name:'🩹 Welcome video v23.40 when the file cannot play: an error on the last <source> (no file / unsupported) → the still picture (data-mode poster, the <video> removed, still = "no-source", the same hint) and no page error; autoplay refused (play() rejects NotAllowedError) → the poster too (still = "autoplay")',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(2500);const ov=OV();if(!ov)return {shown:false};const v=ov.querySelector('video');
    v.querySelector('source:last-child').dispatchEvent(new Event('error'));await sleep(100);
    const a={mode:ov.getAttribute('data-mode'),video:!!ov.querySelector('video'),still:HNXWV.state().still,hint:(ov.querySelector('.hnx-wv-hint')||{}).textContent,shown:!!OV()};
    HNXWV.dismiss('test');const op=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('no','NotAllowedError'));};
    HNXWV.show();await sleep(300);HTMLMediaElement.prototype.play=op;const o2=OV();
    const b={mode:o2&&o2.getAttribute('data-mode'),video:!!(o2&&o2.querySelector('video')),still:HNXWV.state().still};HNXWV.dismiss('test');
    return {a,b};},
  expect:{a:{mode:'poster',video:false,still:'no-source',hint:'Choose a screen from the menu, or click to continue',shown:true},b:{mode:'poster',video:false,still:'autoplay'}} },

{ name:'⚙ Welcome video v23.40 admin switch on the screens: Administration ▸ 🔐 Security Center shows the “🎬 Welcome video on sign-in” card — badge ON, “⏹ Switch OFF for everyone”; the ⚙ TOOLS menu lists “Welcome video on sign-in — ON for everyone — click to switch OFF”; the card button (confirm accepted) → {on:false,by:"tester"}, badge OFF, “▶ Switch ON for everyone”, TOOLS says OFF; a supervisor gets no TOOLS entry',
  seed:SEED, requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(1500);HNXWV.dismiss('test');switchView('security_center');await sleep(800);const card=document.getElementById('hnxWvCard');if(!card)return {card:false};
    const tx=()=>({badge:document.getElementById('hnxWvBadge').textContent,btn:document.getElementById('hnxWvToggle').textContent});const before=tx();
    const tools=()=>{openToolsMenu();const pop=document.getElementById('toolsMenuPopover');const it=pop&&pop.querySelector('.hnx-wv-item');const s=it?it.innerText.replace(/\s+/g,' ').trim():null;if(pop)pop.remove();return s;};
    const t1=tools();document.getElementById('hnxWvToggle').click();await sleep(300);const st=JSON.parse(localStorage.getItem('hydroPro_welcome_video_v1'));const after=tx();const t2=tools();
    actAs('mea');const t3=tools();actAsTester();HNXWV.setOn(true,true);
    return {card:true,before,t1,st:{on:st.on,by:st.by},after,t2,t3,inSec:!!document.getElementById('hnxWvCard').closest('#securityCenterBody')};},
  expect:{card:true,before:{badge:'ON',btn:'⏹ Switch OFF for everyone'},t1:'🎬 Welcome video on sign-in ON for everyone — click to switch OFF',st:{on:false,by:'tester'},after:{badge:'OFF',btn:'▶ Switch ON for everyone'},t2:'🎬 Welcome video on sign-in OFF for everyone — click to switch ON',t3:null,inSec:true} },

{ name:'🧪 Welcome video v23.40 under the test harness without hnx_wv_test: no overlay (why() = "harness", 0 shows) — the rulebook cases that drive screens with a real mouse never click a film; HNXWV is there',
  requires:"!!window.HNXWV",
  run:async()=>{const OV=()=>document.getElementById('hnxWelcomeVideo');await sleep(1500);return {ov:!!OV(),why:HNXWV.why(),shows:HNXWV.state().shows};},
  expect:{ov:false,why:'harness',shows:0} }
];
