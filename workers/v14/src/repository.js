function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function results(value) {
  return Array.isArray(value?.results) ? value.results : [];
}

function requireDb(db) {
  if (!db || typeof db.prepare !== 'function') throw new Error('D1 DB binding is required');
}

export function createRepository(db, vault) {
  requireDb(db);
  if (!vault || typeof vault.seal !== 'function' || typeof vault.open !== 'function') throw new Error('Token/content vault is required');

  async function connectionStatus(tenantId) {
    const query = await db.prepare(
      `SELECT slot, resource, provider, account_label_redacted, status, last_sync_at,
              last_error_code, updated_at
         FROM ea_account_connections
        WHERE tenant_id = ?`
    ).bind(tenantId).all();
    const accounts = {
      owner: {mail: {connected: false}, calendar: {connected: false}},
      assistant: {mail: {connected: false}, calendar: {connected: false}}
    };
    let lastSyncAt = null;
    for (const row of results(query)) {
      if (!accounts[row.slot] || !accounts[row.slot][row.resource]) continue;
      accounts[row.slot][row.resource] = {
        connected: row.status === 'connected',
        provider: row.provider,
        account: row.account_label_redacted || '',
        stale: row.last_sync_at ? Date.now() - new Date(row.last_sync_at).getTime() > 15 * 60000 : true,
        lastSyncAt: row.last_sync_at || null,
        errorCode: row.last_error_code || null
      };
      if (row.last_sync_at && (!lastSyncAt || row.last_sync_at > lastSyncAt)) lastSyncAt = row.last_sync_at;
    }
    return {ok: true, lastSyncAt, accounts};
  }

  async function getConnection(tenantId, slot, resource) {
    return db.prepare(
      `SELECT * FROM ea_account_connections
        WHERE tenant_id = ? AND slot = ? AND resource = ? AND status = 'connected'`
    ).bind(tenantId, slot, resource).first();
  }

  async function requireConnections(tenantId, slots, resources) {
    const missing = [];
    for (const slot of slots) {
      for (const resource of resources) {
        if (!await getConnection(tenantId, slot, resource)) missing.push(`${slot}:${resource}`);
      }
    }
    if (missing.length) {
      const error = new Error(`Required connections are not active: ${missing.join(', ')}`);
      error.status = 409;
      error.code = 'CONNECTION_REQUIRED';
      throw error;
    }
  }

  async function saveConnection(tenantId, record) {
    const at = now();
    const tokenCiphertext = await vault.seal(JSON.stringify(record.tokens), `connection:${tenantId}:${record.slot}:${record.resource}`);
    await db.prepare(
      `INSERT INTO ea_account_connections
       (tenant_id, slot, resource, provider, provider_account_id, account_label_redacted,
        token_ciphertext, token_expires_at, granted_scopes_json, consent_record_id, status,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'connected', ?, ?)
       ON CONFLICT(tenant_id, slot, resource) DO UPDATE SET
         provider = excluded.provider,
         provider_account_id = excluded.provider_account_id,
         account_label_redacted = excluded.account_label_redacted,
         token_ciphertext = excluded.token_ciphertext,
         token_expires_at = excluded.token_expires_at,
         granted_scopes_json = excluded.granted_scopes_json,
         consent_record_id = excluded.consent_record_id,
         status = 'connected',
         last_error_code = NULL,
         updated_at = excluded.updated_at`
    ).bind(
      tenantId,
      record.slot,
      record.resource,
      record.provider,
      record.providerAccountId || null,
      record.accountLabelRedacted || null,
      tokenCiphertext,
      record.tokenExpiresAt || null,
      JSON.stringify(record.grantedScopes || []),
      record.consentRecordId,
      at,
      at
    ).run();
  }

  async function openConnection(tenantId, slot, resource) {
    const record = await getConnection(tenantId, slot, resource);
    if (!record) return null;
    return {
      ...record,
      tokens: JSON.parse(await vault.open(record.token_ciphertext, `connection:${tenantId}:${slot}:${resource}`))
    };
  }

  async function saveConfig(tenantId, actorId, config) {
    await db.prepare(
      `INSERT INTO ea_intelligence_config
       (tenant_id, timezone, morning_time, evening_time, mail_days, calendar_horizon_days,
        calendar_scope, auto_triage, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(tenant_id) DO UPDATE SET
         timezone = excluded.timezone,
         morning_time = excluded.morning_time,
         evening_time = excluded.evening_time,
         mail_days = excluded.mail_days,
         calendar_horizon_days = excluded.calendar_horizon_days,
         calendar_scope = excluded.calendar_scope,
         auto_triage = excluded.auto_triage,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    ).bind(
      tenantId,
      config.timezone,
      config.morningTime,
      config.eveningTime,
      config.mailDays,
      config.calendarHorizonDays,
      config.calendarScope,
      config.autoTriage ? 1 : 0,
      actorId,
      now()
    ).run();
  }

  async function saveIntelligence(tenantId, actorId, intelligence, requestMeta) {
    const runId = id('sync');
    const startedAt = requestMeta.startedAt || now();
    const completedAt = now();
    const statements = [];

    statements.push(db.prepare(
      `INSERT INTO ea_sync_runs
       (tenant_id, id, requested_by, slots_json, resources_json, source_snapshot_at,
        status, counts_json, warnings_json, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      tenantId,
      runId,
      actorId,
      JSON.stringify(requestMeta.slots),
      JSON.stringify(requestMeta.resources),
      intelligence.sourceSnapshotAt,
      intelligence.warnings.length ? 'partial' : 'complete',
      JSON.stringify({messages: intelligence.messages.length, workstreams: intelligence.workstreams.length, signals: intelligence.recommendations.length}),
      JSON.stringify(intelligence.warnings),
      startedAt,
      completedAt
    ));

    for (const workstream of intelligence.workstreams) {
      const context = `workstream:${tenantId}:${workstream.id}`;
      statements.push(db.prepare(
        `INSERT INTO ea_workstreams
         (tenant_id, id, title_ciphertext, aliases_ciphertext, summary_ciphertext,
          next_outcome_ciphertext, owner_lane, sensitivity, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(tenant_id, id) DO UPDATE SET
           title_ciphertext = excluded.title_ciphertext,
           aliases_ciphertext = excluded.aliases_ciphertext,
           summary_ciphertext = excluded.summary_ciphertext,
           next_outcome_ciphertext = excluded.next_outcome_ciphertext,
           owner_lane = excluded.owner_lane,
           sensitivity = excluded.sensitivity,
           status = excluded.status,
           updated_at = excluded.updated_at`
      ).bind(
        tenantId,
        workstream.id,
        await vault.seal(workstream.title, `${context}:title`),
        await vault.seal(JSON.stringify(workstream.aliases), `${context}:aliases`),
        await vault.seal(workstream.summary || '', `${context}:summary`),
        await vault.seal(workstream.nextOutcome || '', `${context}:outcome`),
        workstream.ownerLane,
        workstream.sensitivity,
        workstream.status,
        completedAt,
        completedAt
      ));
    }

    for (const signal of intelligence.recommendations) {
      const context = `signal:${tenantId}:${signal.id}`;
      const idempotencyKey = `ea140:${signal.sourceRef.sourceType}:${signal.sourceRef.opaqueId}:${signal.safeNextAction}`;
      statements.push(db.prepare(
        `INSERT INTO ea_signals
         (tenant_id, id, workstream_id, source_type, source_ref_hash, title_ciphertext,
          why_ciphertext, priority, decision_lane, requires_approval, status, due_at,
          confidence, safe_next_action_ciphertext, idempotency_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(tenant_id, id) DO UPDATE SET
           title_ciphertext = excluded.title_ciphertext,
           why_ciphertext = excluded.why_ciphertext,
           priority = excluded.priority,
           decision_lane = excluded.decision_lane,
           requires_approval = excluded.requires_approval,
           status = excluded.status,
           due_at = excluded.due_at,
           confidence = excluded.confidence,
           safe_next_action_ciphertext = excluded.safe_next_action_ciphertext,
           updated_at = excluded.updated_at`
      ).bind(
        tenantId,
        signal.id,
        signal.workstreamId,
        signal.sourceRef.sourceType,
        await vault.hash(`${tenantId}:${signal.sourceRef.sourceType}:${signal.sourceRef.opaqueId}`),
        await vault.seal(signal.title, `${context}:title`),
        await vault.seal(signal.why, `${context}:why`),
        signal.priority,
        signal.decisionLane,
        signal.requiresApproval ? 1 : 0,
        signal.status,
        signal.dueAt || null,
        signal.confidence,
        await vault.seal(signal.safeNextAction, `${context}:action`),
        idempotencyKey,
        completedAt,
        completedAt
      ));
    }

    for (const slot of requestMeta.slots) {
      for (const resource of requestMeta.resources) {
        statements.push(db.prepare(
          `UPDATE ea_account_connections SET last_sync_at = ?, last_error_code = NULL, updated_at = ?
            WHERE tenant_id = ? AND slot = ? AND resource = ?`
        ).bind(completedAt, completedAt, tenantId, slot, resource));
      }
    }

    await db.batch(statements);
    return {runId};
  }

  async function audit(tenantId, actorId, action, targetType, targetHash, detail = {}) {
    await db.prepare(
      `INSERT INTO ea_audit_log
       (tenant_id, id, actor_id, action, target_type, target_hash, detail_redacted_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(tenantId, id('audit'), actorId, action, targetType, targetHash || null, JSON.stringify(detail), now()).run();
  }

  return {
    connectionStatus,
    getConnection,
    requireConnections,
    saveConnection,
    openConnection,
    saveConfig,
    saveIntelligence,
    audit
  };
}
