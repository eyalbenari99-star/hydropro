import {hmac} from './vault.js';

const PROVIDERS = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    mailScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    calendarScopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    forbidden: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ]
  },
  microsoft: {
    mailScopes: ['Mail.Read'],
    calendarScopes: ['Calendars.Read'],
    identityScopes: ['openid', 'profile', 'email', 'offline_access'],
    forbidden: ['Mail.Send', 'Mail.ReadWrite', 'Calendars.ReadWrite']
  }
};

const encoder = new TextEncoder();

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomUrlSafe(bytes = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function challenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function providerConfig(env, provider) {
  if (provider === 'google') {
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
      authorize: PROVIDERS.google.authorize,
      token: PROVIDERS.google.token
    };
  }
  const tenant = env.MICROSOFT_TENANT_ID || 'common';
  return {
    clientId: env.MICROSOFT_CLIENT_ID,
    clientSecret: env.MICROSOFT_CLIENT_SECRET,
    redirectUri: env.MICROSOFT_REDIRECT_URI,
    authorize: `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize`,
    token: `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`
  };
}

function requestedScopes(provider, resource) {
  const definition = PROVIDERS[provider];
  const resourceScopes = resource === 'mail' ? definition.mailScopes : definition.calendarScopes;
  return provider === 'microsoft' ? [...definition.identityScopes, ...resourceScopes] : resourceScopes;
}

function validateReturnUrl(returnUrl, appOrigin) {
  const parsed = new URL(returnUrl);
  const allowed = new URL(appOrigin);
  if (parsed.origin !== allowed.origin) throw Object.assign(new Error('OAuth returnUrl origin is not approved'), {status: 400, code: 'INVALID_RETURN_URL'});
  return parsed.toString();
}

function validateGrant(provider, resource, returnedScope) {
  const granted = String(returnedScope || '').split(/\s+/).filter(Boolean);
  if (!granted.length) return requestedScopes(provider, resource);
  const forbidden = PROVIDERS[provider].forbidden;
  const expanded = granted.filter(scope => forbidden.includes(scope));
  if (expanded.length) throw Object.assign(new Error(`Provider granted forbidden permission: ${expanded.join(', ')}`), {status: 403, code: 'PERMISSION_EXPANSION'});
  const required = resource === 'mail' ? PROVIDERS[provider].mailScopes : PROVIDERS[provider].calendarScopes;
  if (!required.every(scope => granted.includes(scope))) throw Object.assign(new Error('Provider did not grant every required read-only scope'), {status: 403, code: 'INSUFFICIENT_SCOPE'});
  return granted;
}

function parseState(value) {
  const [id, signature] = String(value || '').split('.');
  if (!id || !signature) throw Object.assign(new Error('Invalid OAuth state'), {status: 400, code: 'INVALID_OAUTH_STATE'});
  return {id, signature};
}

export function createOAuthService(env, repository, fetcher = fetch) {
  if (!env.OAUTH_STATE || typeof env.OAUTH_STATE.put !== 'function') throw new Error('OAUTH_STATE KV binding is required');

  async function start(identity, request) {
    const {slot, resource, provider, mode, returnUrl} = request;
    if (!['owner','assistant'].includes(slot) || !['mail','calendar'].includes(resource) || !PROVIDERS[provider] || mode !== 'read_only') {
      throw Object.assign(new Error('Invalid OAuth start request'), {status: 400, code: 'INVALID_OAUTH_REQUEST'});
    }
    const approvedReturnUrl = validateReturnUrl(returnUrl, env.APP_ORIGIN);
    const config = providerConfig(env, provider);
    if (!config.clientId || !config.clientSecret || !config.redirectUri) throw Object.assign(new Error(`${provider} OAuth secrets are not configured`), {status: 503, code: 'OAUTH_NOT_CONFIGURED'});

    const stateId = crypto.randomUUID();
    const verifier = randomUrlSafe(48);
    const signature = await hmac(stateId, env.OAUTH_STATE_HMAC_KEY);
    const payload = {
      tenantId: identity.tenantId,
      actorId: identity.userId,
      slot,
      resource,
      provider,
      returnUrl: approvedReturnUrl,
      verifier,
      scopes: requestedScopes(provider, resource),
      consentRecordId: `consent_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    await env.OAUTH_STATE.put(`ea140:${stateId}`, JSON.stringify(payload), {expirationTtl: 600});

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: payload.scopes.join(' '),
      state: `${stateId}.${signature}`,
      code_challenge: await challenge(verifier),
      code_challenge_method: 'S256'
    });
    if (provider === 'google') {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
      params.set('include_granted_scopes', 'false');
    }
    return {url: `${config.authorize}?${params.toString()}`, expiresInSeconds: 600};
  }

  async function callback(provider, url) {
    if (!PROVIDERS[provider]) throw Object.assign(new Error('Unsupported OAuth provider'), {status: 400, code: 'INVALID_PROVIDER'});
    const error = url.searchParams.get('error');
    if (error) throw Object.assign(new Error(`Provider denied authorization: ${error}`), {status: 400, code: 'OAUTH_DENIED'});
    const code = url.searchParams.get('code');
    const parsedState = parseState(url.searchParams.get('state'));
    const expected = await hmac(parsedState.id, env.OAUTH_STATE_HMAC_KEY);
    if (parsedState.signature !== expected) throw Object.assign(new Error('OAuth state signature mismatch'), {status: 400, code: 'INVALID_OAUTH_STATE'});
    const raw = await env.OAUTH_STATE.get(`ea140:${parsedState.id}`);
    if (!raw) throw Object.assign(new Error('OAuth state expired or already used'), {status: 400, code: 'OAUTH_STATE_EXPIRED'});
    const state = JSON.parse(raw);
    if (state.provider !== provider) throw Object.assign(new Error('OAuth provider/state mismatch'), {status: 400, code: 'INVALID_OAUTH_STATE'});
    if (!code) throw Object.assign(new Error('OAuth authorization code is missing'), {status: 400, code: 'OAUTH_CODE_MISSING'});

    const config = providerConfig(env, provider);
    const form = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
      code,
      code_verifier: state.verifier
    });
    const tokenResponse = await fetcher(config.token, {
      method: 'POST',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body: form
    });
    if (!tokenResponse.ok) throw Object.assign(new Error(`OAuth token exchange failed (${tokenResponse.status})`), {status: 502, code: 'TOKEN_EXCHANGE_FAILED'});
    const token = await tokenResponse.json();
    const grantedScopes = validateGrant(provider, state.resource, token.scope);
    const tokenExpiresAt = token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null;

    await repository.saveConnection(state.tenantId, {
      slot: state.slot,
      resource: state.resource,
      provider,
      providerAccountId: token.id_token ? `idtoken:${await repositoryHash(repository, token.id_token)}` : null,
      accountLabelRedacted: `${state.slot} ${state.resource}`,
      tokens: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token || null,
        tokenType: token.token_type || 'Bearer'
      },
      tokenExpiresAt,
      grantedScopes,
      consentRecordId: state.consentRecordId
    });
    await repository.audit(state.tenantId, state.actorId, 'oauth_connected', 'account_connection', null, {slot: state.slot, resource: state.resource, provider});
    await env.OAUTH_STATE.delete(`ea140:${parsedState.id}`);
    return {returnUrl: state.returnUrl, slot: state.slot, resource: state.resource, provider};
  }

  return {start, callback};
}

async function repositoryHash(repository, value) {
  if (typeof repository.hash === 'function') return repository.hash(value);
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return base64Url(new Uint8Array(digest));
}
