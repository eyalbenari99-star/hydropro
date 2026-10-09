/* v22.20 (Eyal, 9 Oct 2026: "critical don't do the noise, just blink") — alerts make no sound.
   Before: a CRITICAL card beeped 3 tones (warning 2 tones) when "Play sound" was on (the default), the computer's pop-up
   notification played the system sound, and Nexi read new criticals aloud. Now the card still appears (and blinks),
   but no AudioContext is ever created for an alert, every pop-up notification is created with silent:true, and the
   🔔 Notifications "Play sound" switch is greyed off. */
const SEED=function(){localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));
  localStorage.setItem('hydroPro_notif_settings',JSON.stringify({enabled:true,sound:true,browser:true}));};
module.exports=[
{ name:'🔇 Quiet alerts: 1 critical + 1 warning fired with "Play sound" ON in old settings → 0 beeps (no AudioContext), 2 cards still on screen, 2 pop-ups both silent (v22.20)',
  requires:"window.__hnxQuietAlerts===true",
  seed:SEED,
  run:new Function(`return (async()=>{await sleep(6000);
    let ctx=0;const RealAC=window.AudioContext;window.AudioContext=window.webkitAudioContext=function(){ctx++;return new RealAC();};
    const pops=[];const N=function(t,o){pops.push({t:String(t),silent:!!(o&&o.silent)});this.close=function(){};};N.permission='granted';N.requestPermission=()=>Promise.resolve('granted');
    const RealN=window.Notification;try{Object.defineProperty(window,'Notification',{value:N,configurable:true,writable:true});}catch(e){window.Notification=N;}
    const h0=document.getElementById('notifToastHost');const before=h0?[...h0.children].filter(c=>!/^hnx(ClearAllBtn|OldCritBtn|MoreAlerts)$/.test(c.id)).length:0;
    window.__hnxCritFire({severity:'critical',title:'Pool 1 pH HIGH',subtitle:'quiet test',tag:'qa1'});
    window.__hnxCritFire({severity:'warning',title:'Pool 2 EC low',subtitle:'quiet test',tag:'qa2'});
    await sleep(400);
    const h=document.getElementById('notifToastHost');const cards=h?[...h.children].filter(c=>!/^hnx(ClearAllBtn|OldCritBtn|MoreAlerts)$/.test(c.id)).length-before:0;
    window.AudioContext=RealAC;try{Object.defineProperty(window,'Notification',{value:RealN,configurable:true,writable:true});}catch(e){}
    return {beeps:ctx,cards,pops:pops.length,silent:pops.filter(p=>p.silent).length};})()`),
  expect:{beeps:0,cards:2,pops:2,silent:2} },
{ name:'🔇 Quiet alerts: 🔔 Notifications settings show "Play sound" greyed off (disabled, unchecked) even when the old setting was ON (v22.20)',
  requires:"window.__hnxQuietAlerts===true",
  seed:SEED,
  run:new Function(`return (async()=>{await sleep(6000);window.openNotifSettings();await sleep(200);
    const c=document.getElementById('notifSound');const m=document.getElementById('notifSettingsModal');
    const r={disabled:!!(c&&c.disabled),checked:!!(c&&c.checked),says:!!(m&&/never beep/.test(m.textContent))};if(m)m.remove();return r;})()`),
  expect:{disabled:true,checked:false,says:true} }
];
