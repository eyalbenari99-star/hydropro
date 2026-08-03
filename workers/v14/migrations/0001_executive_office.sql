PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ea_account_connections (
  tenant_id TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('owner', 'assistant')),
  resource TEXT NOT NULL CHECK (resource IN ('mail', 'calendar')),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_account_id TEXT,
  account_label_redacted TEXT,
  token_ciphertext TEXT NOT NULL,
  token_expires_at TEXT,
  granted_scopes_json TEXT NOT NULL,
  consent_record_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'revoked', 'error', 'disconnected')),
  provider_cursor_ciphertext TEXT,
  last_sync_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, slot, resource)
);

CREATE INDEX IF NOT EXISTS ea_account_connections_status_idx
  ON ea_account_connections (tenant_id, status, updated_at);

CREATE TABLE IF NOT EXISTS ea_intelligence_config (
  tenant_id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  morning_time TEXT NOT NULL DEFAULT '06:00',
  evening_time TEXT NOT NULL DEFAULT '18:00',
  mail_days INTEGER NOT NULL DEFAULT 30 CHECK (mail_days BETWEEN 1 AND 90),
  calendar_horizon_days INTEGER NOT NULL DEFAULT 14 CHECK (calendar_horizon_days BETWEEN 1 AND 31),
  calendar_scope TEXT NOT NULL DEFAULT 'all_authorized' CHECK (calendar_scope IN ('primary', 'all_authorized')),
  auto_triage INTEGER NOT NULL DEFAULT 1 CHECK (auto_triage IN (0, 1)),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ea_workstreams (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  title_ciphertext TEXT NOT NULL,
  aliases_ciphertext TEXT NOT NULL,
  summary_ciphertext TEXT,
  next_outcome_ciphertext TEXT,
  owner_lane TEXT NOT NULL CHECK (owner_lane IN ('owner', 'assistant', 'waiting', 'scheduled')),
  sensitivity TEXT NOT NULL DEFAULT 'private_executive',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'completed', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ea_workstreams_lane_idx
  ON ea_workstreams (tenant_id, owner_lane, status, updated_at);

CREATE TABLE IF NOT EXISTS ea_source_links (
  tenant_id TEXT NOT NULL,
  workstream_id TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('owner', 'assistant')),
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'calendar', 'task', 'commitment', 'follow_up', 'registration', 'decision')),
  provider TEXT,
  opaque_id_hash TEXT NOT NULL,
  source_payload_ciphertext TEXT NOT NULL,
  source_version TEXT,
  observed_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, source_type, opaque_id_hash),
  FOREIGN KEY (tenant_id, workstream_id) REFERENCES ea_workstreams (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ea_source_links_workstream_idx
  ON ea_source_links (tenant_id, workstream_id, source_type);

CREATE TABLE IF NOT EXISTS ea_signals (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  workstream_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_ref_hash TEXT NOT NULL,
  title_ciphertext TEXT NOT NULL,
  why_ciphertext TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  decision_lane TEXT NOT NULL CHECK (decision_lane IN ('owner', 'assistant', 'waiting', 'scheduled')),
  requires_approval INTEGER NOT NULL CHECK (requires_approval IN (0, 1)),
  status TEXT NOT NULL,
  due_at TEXT,
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  safe_next_action_ciphertext TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (tenant_id, workstream_id) REFERENCES ea_workstreams (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ea_signals_queue_idx
  ON ea_signals (tenant_id, status, decision_lane, priority, due_at);

CREATE TABLE IF NOT EXISTS ea_sync_runs (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  slots_json TEXT NOT NULL,
  resources_json TEXT NOT NULL,
  source_snapshot_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'partial', 'failed')),
  counts_json TEXT NOT NULL DEFAULT '{}',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  error_code TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS ea_audit_log (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_hash TEXT,
  detail_redacted_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS ea_audit_log_created_idx
  ON ea_audit_log (tenant_id, created_at);
