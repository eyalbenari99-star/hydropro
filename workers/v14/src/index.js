import {createApp} from './app.js';
import {createOAuthService} from './oauth.js';
import {createRepository} from './repository.js';
import {createVault} from './vault.js';

function serviceRequired(binding, name) {
  if (!binding || typeof binding.fetch !== 'function') throw Object.assign(new Error(`${name} service binding is not configured`), {status: 503, code: `${name}_UNAVAILABLE`});
  return binding;
}

function internalRequest(path, request, body) {
  const headers = new Headers({'content-type': 'application/json'});
  for (const name of ['authorization','cookie','x-csrf-token','x-request-id']) {
    const value = request?.headers?.get(name);
    if (value) headers.set(name, value);
  }
  return new Request(`https://internal${path}`, {method: body == null ? 'GET' : 'POST', headers, ...(body == null ? {} : {body: JSON.stringify(body)})});
}

function createAuth(env) {
  return {
    async authenticate(request) {
      const binding = serviceRequired(env.HNX_AUTH, 'HNX_AUTH');
      const response = await binding.fetch(internalRequest('/v1/session/verify', request, null));
      if (response.status === 401) return null;
      if (!response.ok) throw Object.assign(new Error('Authentication service unavailable'), {status: 503, code: 'AUTH_UNAVAILABLE'});
      const identity = await response.json();
      return {
        tenantId: identity.tenantId,
        userId: identity.userId,
        role: identity.role,
        permissions: Array.isArray(identity.permissions) ? identity.permissions : []
      };
    }
  };
}

function createProviderGateway(env) {
  return {
    async sync(identity, request) {
      const binding = serviceRequired(env.PROVIDER_GATEWAY, 'PROVIDER_GATEWAY');
      const response = await binding.fetch(new Request('https://internal/v1/ea/sync', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-hnx-tenant-id': identity.tenantId, 'x-hnx-user-id': identity.userId},
        body: JSON.stringify(request)
      }));
      if (!response.ok) throw Object.assign(new Error(`Provider synchronization failed (${response.status})`), {status: response.status >= 500 ? 502 : response.status, code: 'PROVIDER_SYNC_FAILED'});
      return response.json();
    },
    async getThread(identity, slot, messageId) {
      const binding = serviceRequired(env.PROVIDER_GATEWAY, 'PROVIDER_GATEWAY');
      const response = await binding.fetch(new Request('https://internal/v1/ea/thread', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-hnx-tenant-id': identity.tenantId, 'x-hnx-user-id': identity.userId},
        body: JSON.stringify({slot, messageId, purpose: 'review_only_draft'})
      }));
      if (response.status === 404) return null;
      if (!response.ok) throw Object.assign(new Error(`Provider thread lookup failed (${response.status})`), {status: response.status >= 500 ? 502 : response.status, code: 'PROVIDER_THREAD_FAILED'});
      return response.json();
    }
  };
}

function mergeEnrichment(base, enriched) {
  if (!enriched || typeof enriched !== 'object') return base;
  const patches = new Map((Array.isArray(enriched.recommendations) ? enriched.recommendations : []).map(item => [item.id, item]));
  const recommendations = base.recommendations.map(original => {
    const patch = patches.get(original.id);
    if (!patch) return original;
    const requiresApproval = original.requiresApproval || patch.requiresApproval === true;
    return {
      ...original,
      why: typeof patch.why === 'string' ? patch.why.slice(0, 1000) : original.why,
      safeNextAction: typeof patch.safeNextAction === 'string' ? patch.safeNextAction.slice(0, 500) : original.safeNextAction,
      confidence: Number.isFinite(Number(patch.confidence)) ? Math.max(0, Math.min(1, Number(patch.confidence))) : original.confidence,
      missingFacts: Array.isArray(patch.missingFacts) ? patch.missingFacts.map(String).slice(0, 30) : original.missingFacts,
      contradictions: Array.isArray(patch.contradictions) ? patch.contradictions.map(String).slice(0, 30) : original.contradictions,
      requiresApproval,
      decisionLane: requiresApproval ? 'owner' : original.decisionLane
    };
  });
  const streamPatches = new Map((Array.isArray(enriched.workstreams) ? enriched.workstreams : []).map(item => [item.id, item]));
  const workstreams = base.workstreams.map(original => {
    const patch = streamPatches.get(original.id);
    return patch ? {
      ...original,
      summary: typeof patch.summary === 'string' ? patch.summary.slice(0, 5000) : original.summary,
      nextOutcome: typeof patch.nextOutcome === 'string' ? patch.nextOutcome.slice(0, 1000) : original.nextOutcome
    } : original;
  });
  return {...base, recommendations, workstreams};
}

function createAnalyzer(env) {
  return {
    async enrich(context) {
      if (!env.NEXI_AI || typeof env.NEXI_AI.fetch !== 'function') return context.intelligence;
      const response = await env.NEXI_AI.fetch(new Request('https://internal/v1/ea/enrich', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-hnx-tenant-id': context.identity.tenantId},
        body: JSON.stringify({
          purpose: 'executive_office_workstream_analysis',
          policy: {doNotInventFacts: true, preserveSourceRefs: true, cannotReduceApproval: true},
          intelligence: context.intelligence
        })
      }));
      if (!response.ok) return {...context.intelligence, warnings: [...context.intelligence.warnings, `AI enrichment unavailable (${response.status}); deterministic analysis used.`]};
      return mergeEnrichment(context.intelligence, await response.json());
    },
    async draft(context) {
      if (!env.NEXI_AI || typeof env.NEXI_AI.fetch !== 'function') {
        return {
          subject: context.thread.subject ? `Re: ${context.thread.subject.replace(/^Re:\s*/i, '')}` : '',
          to: context.thread.replyTo || '',
          body: 'Thank you for your email. We are reviewing the details and will follow up shortly.',
          riskFlags: ['Fallback acknowledgement only. Review and replace with a complete factual response.'],
          groundingRefs: []
        };
      }
      const response = await env.NEXI_AI.fetch(new Request('https://internal/v1/ea/draft', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-hnx-tenant-id': context.identity.tenantId},
        body: JSON.stringify({
          slot: context.slot,
          messageId: context.messageId,
          instruction: context.instruction,
          thread: context.thread,
          policy: {...context.policy, noProviderWrite: true, preserveUncertainty: true}
        })
      }));
      if (!response.ok) throw Object.assign(new Error(`Nexi draft service failed (${response.status})`), {status: 502, code: 'AI_DRAFT_FAILED'});
      return response.json();
    }
  };
}

function runtime(env) {
  const vault = createVault(env.TOKEN_ENCRYPTION_KEY_BASE64);
  const repository = createRepository(env.DB, vault);
  return createApp({
    auth: createAuth(env),
    repository,
    oauth: createOAuthService(env, repository),
    providers: createProviderGateway(env),
    analyzer: createAnalyzer(env),
    hash: vault.hash
  });
}

export default {
  fetch(request, env) {
    return runtime(env).fetch(request);
  }
};

export {createAnalyzer, createAuth, createProviderGateway, mergeEnrichment, runtime};
