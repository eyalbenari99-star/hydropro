/* v21.35 (Eyal): 🎙 Meetings phase 2 + 3 — consent gate, segment pipeline, offline catch-up, AI draft, 90-day purge */
const SEED=function(){
  localStorage.setItem('hydroPro_users',JSON.stringify([
    {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true,email:'tester@abapardes.com.ph'},
    {username:'edelynn',fullname:'Edelyn Rose Nicolas',passwordHash:'x',role:'supervisor',department:'crm',departments:['crm'],active:true},
    {username:'syram',fullname:'Syra Mae Montesa',passwordHash:'x',role:'operator',department:'logistics',departments:['logistics'],active:true}]));
  localStorage.setItem('hnx_cloud_token','test-token');
};
const AS="const as=u=>sessionStorage.setItem('hydroPro_session',JSON.stringify({username:u,loginAt:Date.now()}));";
module.exports=[
{ name:'🎙 Recording: consent is per attendee and written on the record (2 people, confirmed by tester); a 20 s segment is transcribed into the transcript at 00:00 and archived as meetings/<id>/0001.webm; the list search finds the meeting by a transcript word; an operator cannot record, an admin can (v21.35)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('tester');
    const m=HNXMEET._blank('crm');m.title='Tablo trial — recorded';m.chair='tester';m.organiser='tester';
    m.attendees=[{kind:'user',id:'edelynn',name:'Edelyn'},{kind:'ext',name:'Paulo',role:'owner'}];HNXMEET._put(m);
    window.confirm=()=>true;const okC=HNXMEET_REC._consent(m);HNXMEET._put(m);
    window.hnxCloudSTTConfigured=()=>true;window.hnxCloudSTT=()=>Promise.resolve('we agreed on a trial of ten kilos per week');
    const calls=[];window.__hnxApi=(p,o)=>{calls.push({p,method:o&&o.method,type:o&&o.headers&&o.headers['Content-Type']});return Promise.resolve({ok:true});};
    const seg=HNXMEET_REC._segment(m.id,1,0,20,new Blob(['x'],{type:'audio/webm'}));
    for(let i=0;i<40&&!(HNXMEET._get(m.id).rec.segments[0].uploaded);i++)await sleep(100);
    const M=HNXMEET._get(m.id);const s=M.rec.segments[0];
    switchView('crm_meetings');await sleep(400);HNXMEET.set('q','ten kilos');await sleep(300);
    const listed=(document.getElementById('view-crm_meetings').innerText||'').indexOf('Tablo trial')>=0;
    const adminCan=HNXMEET_REC.canRecord();as('syram');const opCan=HNXMEET_REC.canRecord();as('tester');
    return {okC,consent:M.consent.noRecording===false&&M.consent.perPerson.length===2&&M.consent.recordedBy==='tester',names:M.consent.perPerson.map(p=>p.name).join('|'),
      transcribed:s.transcribed,uploaded:s.uploaded,key:s.key==='meetings/'+m.id+'/0001.webm',uploadKey:calls[0].p==='/r2/upload?key='+encodeURIComponent('meetings/'+m.id+'/0001.webm')+'&name=0001.webm',t:M.transcript[0].t,text:M.transcript[0].text,method:calls[0].method,listed,adminCan,opCan,expiresDays:Math.round((M.rec.expiresAt-M.rec.startedAt)/864e5)};})();`),
  expect:{okC:true,consent:true,names:'Edelyn Rose Nicolas|Paulo',transcribed:true,uploaded:true,key:true,uploadKey:true,t:'00:00',text:'we agreed on a trial of ten kilos per week',method:'POST',listed:true,adminCan:true,opCan:false,expiresDays:90} },

{ name:'🎙 Offline catch-up: when the archive upload fails the segment keeps its transcript, counts 1 try and stays queued; once the cloud answers again one pump uploads it (v21.35)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('tester');
    const m=HNXMEET._blank('crm');m.title='Offline test';m.attendees=[{kind:'user',id:'edelynn',name:'Edelyn'}];m.rec={startedAt:Date.now(),endedAt:0,segments:[],markers:[],by:'tester',expiresAt:Date.now()+90*864e5,purged:false};HNXMEET._put(m);
    window.hnxCloudSTTConfigured=()=>true;window.hnxCloudSTT=()=>Promise.resolve('line one');
    window.__hnxApi=()=>Promise.reject(new Error('offline'));
    HNXMEET_REC._segment(m.id,1,0,20,new Blob(['x'],{type:'audio/webm'}));await sleep(600);
    const a=HNXMEET._get(m.id).rec.segments[0];const queued=HNXMEET_REC._queue().filter(j=>!j.done).length;
    window.__hnxApi=()=>Promise.resolve({ok:true});HNXMEET_REC._pump();await sleep(500);
    const b=HNXMEET._get(m.id).rec.segments[0];
    return {transcribedFirst:a.transcribed,uploadedFirst:a.uploaded,tries:a.tries,err:a.lastError,queued,uploadedAfter:b.uploaded,left:HNXMEET_REC._queue().filter(j=>!j.done).length};})();`),
  expect:{transcribedFirst:true,uploadedFirst:false,tries:1,err:'offline',queued:1,uploadedAfter:true,left:0} },

{ name:'✨ AI minutes: the draft fills the skeleton — summary set, 2 discussion lines with [mm:ss], 2 decisions PROPOSED, 2 actions (owner "Edelyn Rose Nicolas" matched to edelynn; "Marco" unmatched keeps the name as said), question and risk appended, due only when valid; draft() through the editor calls nexi-ai with mode minutes and the attendee names (v21.35)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('tester');
    const m=HNXMEET._blank('crm');m.title='AI draft test';m.date='2026-10-01';m.chair='tester';m.organiser='tester';m.attendees=[{kind:'user',id:'edelynn',name:'Edelyn'},{kind:'ext',name:'Marco',role:'owner'}];
    m.minutes.discussion='Existing point';m.transcript=[{n:1,t:'00:00',text:'We agreed on a trial of ten kilos per week. Edelyn will send the agreement by Friday. Marco checks the chef.'}];HNXMEET._put(m);
    const d={summary:'Trial agreed.',discussion:['[00:00] Trial of 10 kg/week agreed','[00:12] Deliveries Tuesday and Friday'],decisions:['Trial order 10 kg/week for 4 weeks','Deliveries before 7 AM'],
      actions:[{what:'Send the signed supply agreement',outcome:'agreement in Files',owner:'Edelyn Rose Nicolas',ownerText:'Edelyn',due:'2026-10-03',priority:'high'},{what:'Confirm micro-greens with the chef',owner:'',ownerText:'Marco',due:'next week',priority:'odd'}],
      openQuestions:['Does the chef want micro-greens?'],risks:['Cold chain on Friday'],extra:['Trial price as quoted'],nextMeeting:'Site visit Mon 5 Oct 11:00'};
    const n=HNXMEET_REC._apply(m,d,'transcript','test-model');HNXMEET._put(m);
    const M=HNXMEET._get(m.id);
    /* end-to-end through the editor with a stubbed nexi-ai */
    localStorage.setItem('hydroPro_nexi_ai_cfg_v1',JSON.stringify({url:'https://nexi-ai.test.workers.dev',token:'ai-tok'}));
    let sent=null;const f0=window.fetch;window.fetch=(u,o)=>{if(String(u).indexOf('/ai/analyze')>=0){sent={u:String(u),auth:o.headers.Authorization,ctx:JSON.parse(o.body).context};return Promise.resolve(new Response(JSON.stringify({minutes:{summary:'',discussion:['[00:30] one more'],decisions:[],actions:[],openQuestions:[],risks:[],extra:[],nextMeeting:''},model:'m'}),{status:200}));}return f0.apply(window,arguments);};
    HNXMEET.open(m.id);await sleep(400);const r=await HNXMEET_REC.draft();await sleep(200);const C=HNXMEET._cur();HNXMEET.close();window.fetch=f0;
    return {counts:n,summary:M.minutes.summary,disc:M.minutes.discussion.split('\\n').length,dec:M.minutes.decisions.map(x=>x.state).join('|'),acts:M.minutes.actions.length,owner1:M.minutes.actions[0].owner,due1:M.minutes.actions[0].due,prio1:M.minutes.actions[0].priority,owner2:M.minutes.actions[1].owner,ownerText2:M.minutes.actions[1].ownerText,due2:M.minutes.actions[1].due,prio2:M.minutes.actions[1].priority,
      q:M.minutes.questions,risk:M.minutes.risks,extra:M.minutes.extra,next:M.minutes.next,aiFrom:M.aiDraft.from,
      e2e:r.ok,mode:sent.ctx.mode,people:sent.ctx.people.join('|'),auth:sent.auth,hasTranscript:/ten kilos/.test(sent.ctx.transcript),discAfter:C.minutes.discussion.split('\\n').length};})();`),
  expect:{counts:{decisions:2,actions:2,unmatched:1},summary:'Trial agreed.',disc:3,dec:'proposed|proposed',acts:2,owner1:'edelynn',due1:'2026-10-03',prio1:'high',owner2:'',ownerText2:'Marco',due2:'',prio2:'normal',
    q:'Does the chef want micro-greens?',risk:'Cold chain on Friday',extra:'Trial price as quoted',next:'Site visit Mon 5 Oct 11:00',aiFrom:'transcript',e2e:true,mode:'minutes',people:'Edelyn Rose Nicolas|Marco',auth:'Bearer ai-tok',hasTranscript:true,discAfter:4} },

{ name:'🎙 90-day retention: a recording older than 90 days has its 2 archived segments deleted by the sweep (2 DELETE calls), is marked purged, and keeps its transcript; a fresh recording is untouched (v21.35)',
  seed:SEED,
  run:new Function(`return (async()=>{${AS}
    await sleep(6000);as('tester');
    const old=HNXMEET._blank('crm');old.title='Old recorded';old.transcript=[{n:1,t:'00:00',text:'kept'}];old.rec={startedAt:Date.now()-95*864e5,endedAt:0,by:'tester',expiresAt:Date.now()-5*864e5,purged:false,markers:[],segments:[{n:1,key:'meetings/'+old.id+'/0001.webm',uploaded:true,transcribed:true,t0:0,dur:20},{n:2,key:'meetings/'+old.id+'/0002.webm',uploaded:true,transcribed:true,t0:20,dur:20}]};HNXMEET._put(old);
    const fresh=HNXMEET._blank('crm');fresh.title='Fresh recorded';fresh.rec={startedAt:Date.now(),endedAt:0,by:'tester',expiresAt:Date.now()+80*864e5,purged:false,markers:[],segments:[{n:1,key:'meetings/'+fresh.id+'/0001.webm',uploaded:true,transcribed:true,t0:0,dur:20}]};HNXMEET._put(fresh);
    const dels=[];window.__hnxApi=(p,o)=>{if(o&&o.method==='DELETE')dels.push(p);return Promise.resolve({ok:true});};
    const n=await HNXMEET_REC.sweep(true);
    const O=HNXMEET._get(old.id),F=HNXMEET._get(fresh.id);
    return {n,dels:dels.length,keys:dels.map(p=>decodeURIComponent(p.split('key=')[1])).join('|')==='meetings/'+old.id+'/0001.webm|meetings/'+old.id+'/0002.webm',purged:O.rec.purged,why:O.rec.purgedWhy,transcriptKept:O.transcript[0].text,freshPurged:F.rec.purged,freshUploaded:F.rec.segments[0].uploaded};})();`),
  expect:{n:2,dels:2,keys:true,purged:true,why:'90-day retention',transcriptKept:'kept',freshPurged:false,freshUploaded:true} },
];
