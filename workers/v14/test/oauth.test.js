import test from 'node:test';
import assert from 'node:assert/strict';
import {createOAuthService} from '../src/oauth.js';

function fixture() {
  const memory=new Map(),saved=[];
  const env={
    APP_ORIGIN:'https://app.example.test',
    GOOGLE_CLIENT_ID:'google-client',GOOGLE_CLIENT_SECRET:'google-secret',GOOGLE_REDIRECT_URI:'https://worker.example.test/ea/accounts/oauth/callback/google',
    MICROSOFT_CLIENT_ID:'ms-client',MICROSOFT_CLIENT_SECRET:'ms-secret',MICROSOFT_TENANT_ID:'common',MICROSOFT_REDIRECT_URI:'https://worker.example.test/ea/accounts/oauth/callback/microsoft',
    OAUTH_STATE_HMAC_KEY:'abcdefghijklmnopqrstuvwxyz-0123456789-oauth-state',
    OAUTH_STATE:{
      async put(key,value){memory.set(key,value);},
      async get(key){return memory.get(key)||null;},
      async delete(key){memory.delete(key);}
    }
  };
  const repository={
    async saveConnection(tenantId,record){saved.push({tenantId,record});},
    async audit(){},
    async hash(value){return `hash:${value.length}`;}
  };
  const fetcher=async (_url,options)=>{
    const form=new URLSearchParams(options.body);
    assert(form.get('code_verifier'));
    return new Response(JSON.stringify({access_token:'access',refresh_token:'refresh',token_type:'Bearer',expires_in:3600,scope:'https://www.googleapis.com/auth/gmail.readonly'}),{status:200,headers:{'content-type':'application/json'}});
  };
  return {env,repository,fetcher,memory,saved};
}

test('Google mail OAuth requests readonly scope, PKCE and signed one-time state', async () => {
  const f=fixture();
  const oauth=createOAuthService(f.env,f.repository,f.fetcher);
  const result=await oauth.start({tenantId:'tenant-1',userId:'eyal'},{slot:'owner',resource:'mail',provider:'google',mode:'read_only',returnUrl:'https://app.example.test/office'});
  const url=new URL(result.url);
  assert.equal(url.origin,'https://accounts.google.com');
  assert.equal(url.searchParams.get('scope'),'https://www.googleapis.com/auth/gmail.readonly');
  assert.equal(url.searchParams.get('scope').includes('gmail.send'),false);
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert(url.searchParams.get('code_challenge'));
  assert(url.searchParams.get('state').includes('.'));
  assert.equal(f.memory.size,1);

  const callback=new URL(`https://worker.example.test/ea/accounts/oauth/callback/google?code=provider-code&state=${encodeURIComponent(url.searchParams.get('state'))}`);
  const completed=await oauth.callback('google',callback);
  assert.equal(completed.slot,'owner');
  assert.equal(completed.resource,'mail');
  assert.equal(f.saved.length,1);
  assert.equal(f.saved[0].record.grantedScopes.includes('https://www.googleapis.com/auth/gmail.readonly'),true);
  assert.equal(f.saved[0].record.grantedScopes.some(scope=>scope.includes('send')),false);
  assert.equal(f.memory.size,0,'OAuth state must be single-use');
});

test('Microsoft calendar OAuth requests Calendars.Read and no write scope', async () => {
  const f=fixture();
  const oauth=createOAuthService(f.env,f.repository,f.fetcher);
  const result=await oauth.start({tenantId:'tenant-1',userId:'chen'},{slot:'assistant',resource:'calendar',provider:'microsoft',mode:'read_only',returnUrl:'https://app.example.test/office'});
  const url=new URL(result.url);
  const scopes=url.searchParams.get('scope').split(' ');
  assert(scopes.includes('Calendars.Read'));
  assert.equal(scopes.includes('Calendars.ReadWrite'),false);
  assert.equal(scopes.includes('Mail.Send'),false);
});

test('rejects unapproved OAuth return origins', async () => {
  const f=fixture();
  const oauth=createOAuthService(f.env,f.repository,f.fetcher);
  await assert.rejects(
    oauth.start({tenantId:'tenant-1',userId:'eyal'},{slot:'owner',resource:'mail',provider:'google',mode:'read_only',returnUrl:'https://evil.example/steal'}),
    error=>error.code==='INVALID_RETURN_URL'
  );
});

test('rejects provider permission expansion during token exchange', async () => {
  const f=fixture();
  f.fetcher=async()=>new Response(JSON.stringify({access_token:'access',scope:'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send'}),{status:200,headers:{'content-type':'application/json'}});
  const oauth=createOAuthService(f.env,f.repository,f.fetcher);
  const result=await oauth.start({tenantId:'tenant-1',userId:'eyal'},{slot:'owner',resource:'mail',provider:'google',mode:'read_only',returnUrl:'https://app.example.test/office'});
  const state=new URL(result.url).searchParams.get('state');
  await assert.rejects(
    oauth.callback('google',new URL(`https://worker.example.test/ea/accounts/oauth/callback/google?code=x&state=${encodeURIComponent(state)}`)),
    error=>error.code==='PERMISSION_EXPANSION'
  );
  assert.equal(f.saved.length,0);
});
