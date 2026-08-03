const HIGH_IMPACT = /\b(payment|bank|wire|budget|price|contract|legal|lawsuit|termination|salary|employment|hire|fire|supplier commitment|customer commitment|confidential disclosure)\b/i;
const URGENT = /\b(urgent|critical|immediately|today|overdue|deadline|final notice|escalat)\b/i;
const REPLY = /\b(reply|respond|confirm|approval|approve|decision|answer|feedback|sign off)\b/i;
const WAITING = /\b(waiting|awaiting|pending from|owe us|to provide|external response)\b/i;
const STOP_WORDS = new Set(['the','and','for','from','with','your','our','this','that','please','update','follow','regarding','request','meeting']);

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value == null ? '' : value).trim();
}

function timestamp(value) {
  const result = new Date(value || 0).getTime();
  return Number.isFinite(result) ? result : 0;
}

function normalizePriority(value, haystack = '') {
  const raw = text(value).toLowerCase();
  if (raw === 'critical' || raw === 'urgent') return 'critical';
  if (raw === 'high') return 'high';
  if (raw === 'low') return 'low';
  if (URGENT.test(haystack)) return 'high';
  return 'medium';
}

function stableHash(value) {
  let hash = 2166136261;
  const input = text(value);
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function normalizeSubject(value) {
  const words = text(value)
    .replace(/^\s*((re|fw|fwd):\s*)+/ig, '')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/[^a-z0-9]+/ig, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word && !STOP_WORDS.has(word));
  return words.slice(0, 6).join(' ') || 'general';
}

function workstreamKey(item) {
  return normalizeSubject(item.workstream || item.workstreamTitle || item.subject || item.title || item.summary);
}

function titleCase(value) {
  return text(value).replace(/\b\w/g, character => character.toUpperCase());
}

function senderLabel(message) {
  if (typeof message.from === 'string') return message.from.slice(0, 200);
  return text(message.from?.name || message.senderName || message.sender || 'Unknown sender').slice(0, 200);
}

function sourceRef(slot, sourceType, item) {
  return {
    slot,
    sourceType,
    opaqueId: text(item.id || item.messageId || item.eventId || item.externalId || stableHash(JSON.stringify(item))).slice(0, 512),
    ...(item.provider ? { provider: item.provider } : {}),
    ...(item.threadId ? { threadId: text(item.threadId).slice(0, 512) } : {}),
    ...(item.deepLink || item.webLink ? { deepLink: text(item.deepLink || item.webLink).slice(0, 2048) } : {})
  };
}

function signalBase(item, sourceType, slot) {
  const title = text(item.subject || item.title || item.summary || `${sourceType} item`).slice(0, 300);
  const haystack = [title, item.snippet, item.preview, item.notes, item.description, item.recommendation].map(text).join(' ');
  const requiresApproval = Boolean(item.requiresApproval || item.needsApproval || HIGH_IMPACT.test(haystack));
  const priority = requiresApproval && URGENT.test(haystack) ? 'critical' : normalizePriority(item.priority || item.severity || item.importance, haystack);
  const status = text(item.status || 'open').toLowerCase();
  const waiting = status === 'waiting' || Boolean(item.waitingFor) || WAITING.test(haystack);
  const scheduled = sourceType === 'calendar';
  let decisionLane = requiresApproval ? 'owner' : slot === 'owner' && (priority === 'critical' || item.needsDecision) ? 'owner' : slot === 'assistant' ? 'assistant' : 'assistant';
  if (waiting && !requiresApproval) decisionLane = 'waiting';
  if (scheduled && !requiresApproval) decisionLane = 'scheduled';

  let safeNextAction = 'Review the source and record the next commitment';
  if (sourceType === 'email') safeNextAction = item.needsReply || item.replyRecommended || REPLY.test(haystack) ? 'Prepare a grounded reply draft for human review' : 'Read and classify the authorized thread';
  if (sourceType === 'calendar') safeNextAction = item.location && (item.description || item.agenda) ? 'Open the meeting pack' : 'Prepare agenda, location and supporting evidence';
  if (decisionLane === 'waiting') safeNextAction = 'Set the next follow-up time and identify the person who owes the response';
  if (requiresApproval) safeNextAction = 'Prepare evidence and a recommendation for Eyal; do not execute the decision';

  const key = workstreamKey(item);
  const reference = sourceRef(slot, sourceType, item);
  return {
    id: `signal_${stableHash(`${sourceType}:${slot}:${reference.opaqueId}:${safeNextAction}`)}`,
    workstreamId: `ws_${stableHash(key)}`,
    sourceRef: reference,
    title,
    why: text(item.recommendation || item.why || item.reason || item.notes || safeNextAction).slice(0, 1000),
    priority,
    decisionLane,
    requiresApproval,
    status: scheduled ? 'scheduled' : waiting ? 'waiting' : ['acknowledged','in_progress'].includes(status) ? status : 'open',
    dueAt: item.dueAt || item.followUpAt || item.start || item.receivedAt || item.date || null,
    safeNextAction,
    confidence: Number.isFinite(Number(item.confidence)) ? Math.max(0, Math.min(1, Number(item.confidence))) : requiresApproval ? 0.98 : 0.82,
    missingFacts: arr(item.missingFacts).map(text).filter(Boolean).slice(0, 30),
    contradictions: arr(item.contradictions).map(text).filter(Boolean).slice(0, 30),
    _workstreamKey: key
  };
}

function emailSignals(raw) {
  return arr(raw.messages).flatMap(message => {
    const slot = message.slot === 'owner' ? 'owner' : 'assistant';
    const haystack = [message.subject, message.snippet, message.preview, message.recommendation].map(text).join(' ');
    const needsAttention = Boolean(message.important || message.needsReply || message.needsFollowUp || message.replyRecommended || message.followUpRecommended || URGENT.test(haystack) || HIGH_IMPACT.test(haystack));
    return needsAttention ? [signalBase(message, 'email', slot)] : [];
  });
}

function calendarSignals(raw) {
  const now = Date.now();
  return arr(raw.events).flatMap(event => {
    const start = timestamp(event.start || event.startAt || event.dateTime);
    const end = timestamp(event.end || event.endAt) || start + 3600000;
    if (!start || end < now || start > now + 31 * 86400000) return [];
    return [signalBase({...event, dueAt: event.start || event.startAt}, 'calendar', event.slot === 'assistant' || event.calendarSlot === 'assistant' ? 'assistant' : 'owner')];
  });
}

function genericSignals(raw, collection, sourceType) {
  return arr(raw[collection]).flatMap(item => {
    const status = text(item.status).toLowerCase();
    if (/done|closed|cancelled|complete|archived/.test(status)) return [];
    const slot = item.slot === 'owner' || item.assignedRole === 'owner' || item.ownerRole === 'owner' ? 'owner' : 'assistant';
    return [signalBase(item, sourceType, slot)];
  });
}

function buildWorkstreams(signals) {
  const groups = new Map();
  for (const signal of signals) {
    const key = signal._workstreamKey || 'general';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(signal);
  }
  return [...groups.entries()].map(([key, items]) => {
    const sourceRefs = items.map(item => item.sourceRef);
    const score = items.reduce((total, item) => total + ({critical: 9, high: 6, medium: 3, low: 1}[item.priority] || 1), 0);
    const top = [...items].sort(compareSignals)[0];
    return {
      id: `ws_${stableHash(key)}`,
      tenantId: 'resolved-by-worker',
      title: titleCase(key),
      status: items.every(item => item.status === 'scheduled') ? 'active' : items.some(item => item.status === 'waiting') ? 'waiting' : 'active',
      aliases: [key],
      sourceRefs,
      summary: `${items.length} related item${items.length === 1 ? '' : 's'} across ${[...new Set(items.map(item => item.sourceRef.sourceType))].join(', ')}.`,
      nextOutcome: top.safeNextAction,
      ownerLane: top.decisionLane,
      sensitivity: items.some(item => item.requiresApproval) ? 'private_executive' : 'confidential',
      updatedAt: new Date().toISOString(),
      score
    };
  }).sort((a, b) => b.score - a.score || b.sourceRefs.length - a.sourceRefs.length);
}

function compareSignals(left, right) {
  const rank = {critical: 0, high: 1, medium: 2, low: 3};
  return (rank[left.priority] ?? 9) - (rank[right.priority] ?? 9) || (timestamp(left.dueAt) || Number.MAX_SAFE_INTEGER) - (timestamp(right.dueAt) || Number.MAX_SAFE_INTEGER);
}

function browserMessages(raw) {
  return arr(raw.messages).slice(0, 500).map(message => ({
    id: text(message.id || message.messageId).slice(0, 512),
    threadId: text(message.threadId).slice(0, 512),
    slot: message.slot === 'owner' ? 'owner' : 'assistant',
    provider: message.provider,
    from: { name: senderLabel(message) },
    subject: text(message.subject || '(no subject)').slice(0, 300),
    snippet: text(message.snippet || message.preview).slice(0, 360),
    receivedAt: message.receivedAt || message.date || null,
    unread: Boolean(message.unread),
    important: Boolean(message.important),
    needsReply: Boolean(message.needsReply || message.replyRecommended),
    needsFollowUp: Boolean(message.needsFollowUp || message.followUpRecommended),
    priority: normalizePriority(message.priority || message.importance, [message.subject, message.snippet].map(text).join(' ')),
    recommendation: text(message.recommendation).slice(0, 500),
    workstream: text(message.workstream || message.workstreamTitle).slice(0, 200)
  }));
}

export function buildIntelligence(raw = {}, options = {}) {
  const signals = [
    ...emailSignals(raw),
    ...calendarSignals(raw),
    ...genericSignals(raw, 'tasks', 'task'),
    ...genericSignals(raw, 'commitments', 'commitment'),
    ...genericSignals(raw, 'followUps', 'follow_up'),
    ...genericSignals(raw, 'registrations', 'registration')
  ].sort(compareSignals).map(signal => {
    const {_workstreamKey, ...clean} = signal;
    return clean;
  });

  const signalsForGroups = [
    ...emailSignals(raw),
    ...calendarSignals(raw),
    ...genericSignals(raw, 'tasks', 'task'),
    ...genericSignals(raw, 'commitments', 'commitment'),
    ...genericSignals(raw, 'followUps', 'follow_up'),
    ...genericSignals(raw, 'registrations', 'registration')
  ];
  const workstreams = buildWorkstreams(signalsForGroups).map(workstream => ({...workstream, tenantId: options.tenantId || 'tenant'}));

  return {
    sourceSnapshotAt: raw.sourceSnapshotAt || new Date().toISOString(),
    messages: browserMessages(raw),
    workstreams,
    recommendations: signals,
    warnings: arr(raw.warnings).map(text).filter(Boolean).slice(0, 100)
  };
}
