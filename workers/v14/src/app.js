import {buildIntelligence} from './intelligence.js';

const ALLOWED_ROLES = new Set(['admin', 'president', 'primary_ea']);

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

function fail(status, code, message, detail) {
  return json({ok: false, error: {code, message, ...(detail ? {detail} : {})}}, status);
}

async function readJson(request, maximumBytes = 64_000) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maximumBytes) throw Object.assign(new Error('Request payload is too large'), {status: 413, code: 'PAYLOAD_TOO_LARGE'});
  const raw = await request.text();
  if (raw.length > maximumBytes) throw Object.assign(new Error('Request payload is too large'), {status: 413, code: 'PAYLOAD_TOO_LARGE'});
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON'), {status: 400, code: 'INVALID_JSON'});
  }
}

function requireMethod(request, method) {
  if (request.method !== method) throw Object.assign(new Error(`Method ${request.method} is not allowed`), {status: 405, code: 'METHOD_NOT_ALLOWED'});
}

function requireIdentity(identity) {
  if (!identity?.tenantId || !identity?.userId) throw Object.assign(new Error('Authentication required'), {status: 401, code: 'UNAUTHENTICATED'});
  if (!ALLOWED_ROLES.has(identity.role) || !identity.permissions?.includes('executive_assistant')) {
    throw Object.assign(new Error('Executive Assistant authorization required'), {status: 403, code: 'FORBIDDEN'});
  }
  return identity;
}

function ensureFields(value, allowed, required) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('Request body must be an object'), {status: 400, code: 'INVALID_REQUEST'});
  const unexpected = Object.keys(value).filter(key => !allowed.includes(key));
  if (unexpected.length) throw Object.assign(new Error(`Unexpected fields: ${unexpected.join(', ')}`), {status: 400, code: 'INVALID_REQUEST'});
  const missing = required.filter(key => value[key] == null);
  if (missing.length) throw Object.assign(new Error(`Required fields missing: ${missing.join(', ')}`), {status: 400, code: 'INVALID_REQUEST'});
}

function validateConfigure(body) {
  ensureFields(body, ['timezone','morningTime','eveningTime','mailDays','calendarHorizonDays','calendarScope','autoTriage'], ['timezone','morningTime','eveningTime','mailDays','calendarHorizonDays','calendarScope','autoTriage']);
  if (!/^[A-Za-z_]+\/[A-Za-z_+\-/]+$/.test(body.timezone)) throw Object.assign(new Error('timezone must be an IANA timezone'), {status: 400, code: 'INVALID_TIMEZONE'});
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.morningTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.eveningTime) || body.morningTime === body.eveningTime) throw Object.assign(new Error('Morning and evening must be different valid HH:MM times'), {status: 400, code: 'INVALID_SCHEDULE'});
  if (!Number.isInteger(body.mailDays) || body.mailDays < 1 || body.mailDays > 90) throw Object.assign(new Error('mailDays must be 1 through 90'), {status: 400, code: 'INVALID_WINDOW'});
  if (!Number.isInteger(body.calendarHorizonDays) || body.calendarHorizonDays < 1 || body.calendarHorizonDays > 31) throw Object.assign(new Error('calendarHorizonDays must be 1 through 31'), {status: 400, code: 'INVALID_WINDOW'});
  if (!['primary','all_authorized'].includes(body.calendarScope) || typeof body.autoTriage !== 'boolean') throw Object.assign(new Error('Invalid calendarScope or autoTriage value'), {status: 400, code: 'INVALID_CONFIG'});
  return body;
}

function validateSync(body) {
  ensureFields(body, ['slots','resources','mailDays','calendarHorizonDays','calendarScope','purposes','policy'], ['slots','resources','mailDays','calendarHorizonDays','calendarScope','purposes','policy']);
  if (!Array.isArray(body.slots) || body.slots.length < 1 || body.slots.length > 2 || body.slots.some(slot => !['owner','assistant'].includes(slot)) || new Set(body.slots).size !== body.slots.length) throw Object.assign(new Error('slots must contain unique owner/assistant values'), {status: 400, code: 'INVALID_SLOTS'});
  if (!Array.isArray(body.resources) || body.resources.length < 1 || body.resources.length > 2 || body.resources.some(resource => !['mail','calendar'].includes(resource)) || new Set(body.resources).size !== body.resources.length) throw Object.assign(new Error('resources must contain unique mail/calendar values'), {status: 400, code: 'INVALID_RESOURCES'});
  if (!Number.isInteger(body.mailDays) || body.mailDays < 1 || body.mailDays > 90) throw Object.assign(new Error('mailDays must be 1 through 90'), {status: 400, code: 'INVALID_WINDOW'});
  if (!Number.isInteger(body.calendarHorizonDays) || body.calendarHorizonDays < 1 || body.calendarHorizonDays > 31) throw Object.assign(new Error('calendarHorizonDays must be 1 through 31'), {status: 400, code: 'INVALID_WINDOW'});
  if (!['primary','all_authorized'].includes(body.calendarScope)) throw Object.assign(new Error('Invalid calendarScope'), {status: 400, code: 'INVALID_CALENDAR_SCOPE'});
  const purposeSet = new Set(['priority','reply','follow_up','meeting_prep','workstream_clustering']);
  if (!Array.isArray(body.purposes) || body.purposes.some(purpose => !purposeSet.has(purpose))) throw Object.assign(new Error('Invalid intelligence purpose'), {status: 400, code: 'INVALID_PURPOSE'});
  ensureFields(body.policy, ['mailReadOnly','calendarReadOnly','noSend','noExternalMutation'], ['mailReadOnly','calendarReadOnly','noSend','noExternalMutation']);
  if (body.policy.mailReadOnly !== true || body.policy.calendarReadOnly !== true || body.policy.noSend !== true || body.policy.noExternalMutation !== true) {
    throw Object.assign(new Error('The v14 policy must remain read-only with no send and no external mutation'), {status: 403, code: 'POLICY_EXPANSION_DENIED'});
  }
  return body;
}

function validateDraft(body) {
  ensureFields(body, ['slot','messageId','instruction','policy'], ['slot','messageId','policy']);
  if (!['owner','assistant'].includes(body.slot) || typeof body.messageId !== 'string' || body.messageId.length < 1 || body.messageId.length > 512) throw Object.assign(new Error('Invalid draft source'), {status: 400, code: 'INVALID_DRAFT_SOURCE'});
  if (body.instruction != null && (typeof body.instruction !== 'string' || body.instruction.length > 2000)) throw Object.assign(new Error('Draft instruction is too long'), {status: 400, code: 'INVALID_INSTRUCTION'});
  ensureFields(body.policy, ['doNotSend','doNotInventFacts','flagCommitments','flagSensitiveContent'], ['doNotSend','doNotInventFacts','flagCommitments','flagSensitiveContent']);
  if (Object.values(body.policy).some(value => value !== true)) throw Object.assign(new Error('Every draft safety policy must remain enabled'), {status: 403, code: 'DRAFT_POLICY_DENIED'});
  return body;
}

function safeRedirect(returnUrl, result) {
  const target = new URL(returnUrl);
  target.searchParams.set('nexi_oauth', 'connected');
  target.searchParams.set('slot', result.slot);
  target.searchParams.set('resource', result.resource);
  return Response.redirect(target.toString(), 302);
}

export function createApp(services) {
  const {auth, repository, oauth, providers, analyzer} = services;
  if (!auth || !repository || !oauth || !providers || !analyzer) throw new Error('auth, repository, oauth, providers and analyzer services are required');
  const hash = services.hash || (async value => {
    const bytes = new TextEncoder().encode(String(value));
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
  });

  async function route(request) {
    const url = new URL(request.url);

    const callback = url.pathname.match(/^\/ea\/accounts\/oauth\/callback\/(google|microsoft)$/);
    if (callback) {
      requireMethod(request, 'GET');
      const result = await oauth.callback(callback[1], url);
      return safeRedirect(result.returnUrl, result);
    }

    if (!url.pathname.startsWith('/ea/')) return fail(404, 'NOT_FOUND', 'Route not found');
    const identity = requireIdentity(await auth.authenticate(request));

    if (url.pathname === '/ea/intelligence/status') {
      requireMethod(request, 'GET');
      return json(await repository.connectionStatus(identity.tenantId));
    }

    if (url.pathname === '/ea/accounts/oauth/start') {
      requireMethod(request, 'POST');
      const body = await readJson(request, 12_000);
      ensureFields(body, ['slot','resource','provider','mode','returnUrl'], ['slot','resource','provider','mode','returnUrl']);
      const result = await oauth.start(identity, body);
      await repository.audit(identity.tenantId, identity.userId, 'oauth_start', 'account_connection', null, {slot: body.slot, resource: body.resource, provider: body.provider});
      return json({ok: true, ...result});
    }

    if (url.pathname === '/ea/intelligence/configure') {
      requireMethod(request, 'POST');
      const body = validateConfigure(await readJson(request, 16_000));
      await repository.saveConfig(identity.tenantId, identity.userId, body);
      await repository.audit(identity.tenantId, identity.userId, 'intelligence_configure', 'tenant_config', null, {timezone: body.timezone, morningTime: body.morningTime, eveningTime: body.eveningTime, calendarScope: body.calendarScope});
      return json({ok: true, updatedAt: new Date().toISOString()});
    }

    if (url.pathname === '/ea/intelligence/sync') {
      requireMethod(request, 'POST');
      const startedAt = new Date().toISOString();
      const body = validateSync(await readJson(request));
      await repository.requireConnections(identity.tenantId, body.slots, body.resources);
      const raw = await providers.sync(identity, body);
      let intelligence = buildIntelligence(raw, {tenantId: identity.tenantId});
      intelligence = await analyzer.enrich({identity, request: body, intelligence, raw});
      const saved = await repository.saveIntelligence(identity.tenantId, identity.userId, intelligence, {slots: body.slots, resources: body.resources, startedAt});
      await repository.audit(identity.tenantId, identity.userId, 'intelligence_sync', 'sync_run', saved.runId, {slots: body.slots, resources: body.resources, messageCount: intelligence.messages.length, signalCount: intelligence.recommendations.length});
      return json({ok: true, runId: saved.runId, ...intelligence});
    }

    if (url.pathname === '/ea/intelligence/email/draft') {
      requireMethod(request, 'POST');
      const body = validateDraft(await readJson(request, 16_000));
      await repository.requireConnections(identity.tenantId, [body.slot], ['mail']);
      const thread = await providers.getThread(identity, body.slot, body.messageId);
      if (!thread) throw Object.assign(new Error('Authorized message thread was not found'), {status: 404, code: 'THREAD_NOT_FOUND'});
      const draft = await analyzer.draft({identity, slot: body.slot, messageId: body.messageId, instruction: body.instruction || '', thread, policy: body.policy});
      if (!draft || typeof draft.body !== 'string') throw Object.assign(new Error('Draft service returned no body'), {status: 502, code: 'DRAFT_UNAVAILABLE'});
      await repository.audit(identity.tenantId, identity.userId, 'draft_generated', 'email_thread', await hash(`${identity.tenantId}:${body.slot}:${body.messageId}`), {slot: body.slot, riskFlagCount: Array.isArray(draft.riskFlags) ? draft.riskFlags.length : 0});
      return json({ok: true, body: draft.body, subject: draft.subject || '', to: draft.to || '', riskFlags: Array.isArray(draft.riskFlags) ? draft.riskFlags : [], groundingRefs: Array.isArray(draft.groundingRefs) ? draft.groundingRefs : [], sent: false, providerDraftCreated: false});
    }

    return fail(404, 'NOT_FOUND', 'Route not found');
  }

  return {
    async fetch(request) {
      try {
        return await route(request);
      } catch (error) {
        const status = Number(error.status) || 500;
        const code = error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED');
        const message = status >= 500 && !error.expose ? 'The Executive Office service could not complete the request' : error.message;
        return fail(status, code, message);
      }
    }
  };
}
