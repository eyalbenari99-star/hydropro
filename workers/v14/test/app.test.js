import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/app.js';

const identity = {tenantId:'tenant-1',userId:'eyal',role:'president',permissions:['executive_assistant']};

function services(options = {}) {
  const calls = [];
  const repository = {
    async connectionStatus(){return {ok:true,lastSyncAt:null,accounts:{owner:{mail:{connected:true},calendar:{connected:true}},assistant:{mail:{connected:true},calendar:{connected:true}}}};},
    async requireConnections(_tenant, slots, resources){calls.push(['requireConnections',slots,resources]);if(options.missingConnection)throw Object.assign(new Error('connection missing'),{status:409,code:'CONNECTION_REQUIRED'});},
    async saveConfig(_tenant,_actor,body){calls.push(['saveConfig',body]);},
    async saveIntelligence(_tenant,_actor,intelligence,meta){calls.push(['saveIntelligence',intelligence,meta]);return {runId:'sync-1'};},
    async audit(...args){calls.push(['audit',...args]);}
  };
  const providerRaw = {
    sourceSnapshotAt:new Date().toISOString(),
    messages:[
      {id:'m1',threadId:'th1',slot:'owner',provider:'google',from:{name:'Board'},subject:'Project Atlas payment approval',workstream:'Project Atlas',snippet:'Urgent approval required',important:true,needsReply:true,priority:'critical',requiresApproval:true},
      {id:'m2',threadId:'th2',slot:'assistant',provider:'microsoft',from:{name:'Supplier'},subject:'Project Atlas documents',workstream:'Project Atlas',snippet:'Please confirm documents',needsFollowUp:true,priority:'high'}
    ],
    events:[
      {id:'e1',slot:'owner',title:'Project Atlas meeting',workstream:'Project Atlas',start:new Date(Date.now()+3600000).toISOString(),end:new Date(Date.now()+7200000).toISOString()}
    ],
    tasks:[
      {id:'t1',slot:'assistant',title:'Prepare Atlas evidence',workstream:'Project Atlas',priority:'high',status:'in_progress'}
    ],
    warnings:[]
  };
  return {
    calls,
    value:{
      auth:{async authenticate(){return options.unauthenticated?null:options.identity||identity;}},
      repository,
      oauth:{
        async start(_identity,body){calls.push(['oauthStart',body]);return {url:'https://auth.example.test',expiresInSeconds:600};},
        async callback(){return {returnUrl:'https://app.example.test/office',slot:'owner',resource:'mail',provider:'google'};}
      },
      providers:{
        async sync(_identity,body){calls.push(['providerSync',body]);return providerRaw;},
        async getThread(_identity,slot,messageId){calls.push(['getThread',slot,messageId]);return {subject:'Project Atlas documents',replyTo:'supplier@example.test',messages:[{id:messageId,text:'Authorized source text'}]};}
      },
      analyzer:{
        async enrich(context){calls.push(['enrich']);return context.intelligence;},
        async draft(context){calls.push(['draft',context]);return {subject:'Re: Project Atlas documents',to:'supplier@example.test',body:'Grounded review-only draft',riskFlags:['Commitment review required'],groundingRefs:['m2']};}
      },
      hash:async value=>`hash:${value}`
    }
  };
}

function request(path, method='GET', body, headers={}) {
  return new Request(`https://worker.example.test${path}`,{
    method,
    headers:{...(body?{'content-type':'application/json'}:{}),...headers},
    ...(body?{body:JSON.stringify(body)}:{})
  });
}

function syncBody(overrides={}) {
  return {
    slots:['owner','assistant'],
    resources:['mail','calendar'],
    mailDays:30,
    calendarHorizonDays:14,
    calendarScope:'all_authorized',
    purposes:['priority','reply','follow_up','meeting_prep','workstream_clustering'],
    policy:{mailReadOnly:true,calendarReadOnly:true,noSend:true,noExternalMutation:true},
    ...overrides
  };
}

test('rejects unauthenticated requests', async () => {
  const fixture=services({unauthenticated:true});
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/status'));
  assert.equal(response.status,401);
  assert.equal((await response.json()).error.code,'UNAUTHENTICATED');
});

test('rejects users without Executive Assistant authority', async () => {
  const fixture=services({identity:{tenantId:'tenant-1',userId:'other',role:'employee',permissions:[]}});
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/status'));
  assert.equal(response.status,403);
  assert.equal((await response.json()).error.code,'FORBIDDEN');
});

test('returns redacted dual-account status', async () => {
  const fixture=services();
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/status'));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.accounts.owner.mail.connected,true);
  assert.equal(body.accounts.assistant.calendar.connected,true);
  assert.equal(JSON.stringify(body).includes('token'),false);
});

test('starts only a validated OAuth connection', async () => {
  const fixture=services();
  const response=await createApp(fixture.value).fetch(request('/ea/accounts/oauth/start','POST',{slot:'owner',resource:'mail',provider:'google',mode:'read_only',returnUrl:'https://app.example.test/office'}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).url,'https://auth.example.test');
  assert(fixture.calls.some(call=>call[0]==='oauthStart'&&call[1].slot==='owner'));
});

test('builds one cross-source workstream and keeps approval with Eyal', async () => {
  const fixture=services();
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/sync','POST',syncBody()));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.ok,true);
  assert.equal(body.runId,'sync-1');
  const atlas=body.workstreams.find(workstream=>workstream.title==='Project Atlas');
  assert(atlas);
  assert(atlas.sourceRefs.some(ref=>ref.sourceType==='email'));
  assert(atlas.sourceRefs.some(ref=>ref.sourceType==='calendar'));
  assert(atlas.sourceRefs.some(ref=>ref.sourceType==='task'));
  const approval=body.recommendations.find(signal=>signal.requiresApproval);
  assert(approval);
  assert.equal(approval.decisionLane,'owner');
  assert(fixture.calls.some(call=>call[0]==='requireConnections'&&call[1].length===2&&call[2].length===2));
  assert(fixture.calls.some(call=>call[0]==='saveIntelligence'));
});

test('rejects any policy expansion before provider access', async () => {
  const fixture=services();
  const body=syncBody({policy:{mailReadOnly:true,calendarReadOnly:true,noSend:false,noExternalMutation:true}});
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/sync','POST',body));
  assert.equal(response.status,403);
  assert.equal((await response.json()).error.code,'POLICY_EXPANSION_DENIED');
  assert.equal(fixture.calls.some(call=>call[0]==='providerSync'),false);
});

test('stops when a requested slot or resource has no consented connection', async () => {
  const fixture=services({missingConnection:true});
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/sync','POST',syncBody()));
  assert.equal(response.status,409);
  assert.equal((await response.json()).error.code,'CONNECTION_REQUIRED');
  assert.equal(fixture.calls.some(call=>call[0]==='providerSync'),false);
});

test('prepares a review-only draft without sending or creating a provider draft', async () => {
  const fixture=services();
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/email/draft','POST',{
    slot:'assistant',messageId:'m2',instruction:'Professional and concise',
    policy:{doNotSend:true,doNotInventFacts:true,flagCommitments:true,flagSensitiveContent:true}
  }));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.body,'Grounded review-only draft');
  assert.equal(body.sent,false);
  assert.equal(body.providerDraftCreated,false);
  assert(fixture.calls.some(call=>call[0]==='getThread'));
  assert(fixture.calls.some(call=>call[0]==='draft'));
});

test('has no email-send or external-calendar mutation route', async () => {
  const fixture=services();
  for (const path of ['/ea/intelligence/email/send','/ea/calendar/events/create','/ea/calendar/events/delete']) {
    const response=await createApp(fixture.value).fetch(request(path,'POST',{}));
    assert.equal(response.status,404,path);
  }
});

test('validates and persists intelligence configuration', async () => {
  const fixture=services();
  const response=await createApp(fixture.value).fetch(request('/ea/intelligence/configure','POST',{
    timezone:'Asia/Manila',morningTime:'06:00',eveningTime:'18:00',mailDays:30,calendarHorizonDays:14,calendarScope:'all_authorized',autoTriage:true
  }));
  assert.equal(response.status,200);
  assert(fixture.calls.some(call=>call[0]==='saveConfig'));
});
