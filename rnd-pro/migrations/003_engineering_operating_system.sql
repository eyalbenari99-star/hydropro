-- HydroNexis-AI R&D & Planning · governed engineering operating-system layer
-- Review migration: apply only after 001_init.sql and 002_add_3d_columns.sql.

ALTER TABLE hnx_rnd_project
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS site_id uuid,
  ADD COLUMN IF NOT EXISTS discipline text,
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'working_draft',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS autonomy_mode text NOT NULL DEFAULT 'supervised'
    CHECK (autonomy_mode IN ('copilot', 'supervised', 'maximum')),
  ADD COLUMN IF NOT EXISTS jurisdiction text,
  ADD COLUMN IF NOT EXISTS risk_class text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS confidentiality text NOT NULL DEFAULT 'company_confidential',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS hnx_rnd_project_code_uq
  ON hnx_rnd_project (tenant_id, code) WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS hnx_rnd_project_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_share boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS hnx_rnd_source_asset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  sha256 text NOT NULL,
  source_kind text NOT NULL,
  license_ref text,
  malware_status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sha256)
);

CREATE TABLE IF NOT EXISTS hnx_rnd_scene_revision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  item_id uuid REFERENCES hnx_rnd_item(id) ON DELETE SET NULL,
  parent_revision_id uuid REFERENCES hnx_rnd_scene_revision(id) ON DELETE RESTRICT,
  branch_name text,
  revision_no integer NOT NULL,
  status text NOT NULL DEFAULT 'Working Draft',
  scene_hash text NOT NULL,
  scene_snapshot jsonb NOT NULL,
  change_summary text,
  created_by text NOT NULL,
  created_by_kind text NOT NULL DEFAULT 'user' CHECK (created_by_kind IN ('user', 'nexi', 'service')),
  created_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  UNIQUE (project_id, revision_no)
);

CREATE TABLE IF NOT EXISTS hnx_rnd_scene_object (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  revision_id uuid NOT NULL REFERENCES hnx_rnd_scene_revision(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  object_type text NOT NULL,
  layer_key text NOT NULL,
  geometry jsonb NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_asset_id uuid REFERENCES hnx_rnd_source_asset(id) ON DELETE SET NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (revision_id, object_key)
);

CREATE TABLE IF NOT EXISTS hnx_rnd_assumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES hnx_rnd_scene_revision(id) ON DELETE CASCADE,
  statement text NOT NULL,
  basis text NOT NULL,
  risk_class text NOT NULL,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  affected_outputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_task_id text,
  owner_id text,
  status text NOT NULL DEFAULT 'open',
  created_by text NOT NULL,
  created_by_kind text NOT NULL DEFAULT 'nexi',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS hnx_rnd_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  authority text NOT NULL,
  source_title text NOT NULL,
  source_locator text NOT NULL,
  source_version text,
  accessed_at timestamptz NOT NULL,
  claim text NOT NULL,
  content_hash text,
  license_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hnx_rnd_calculation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES hnx_rnd_scene_revision(id) ON DELETE CASCADE,
  engine_key text NOT NULL,
  rule_version text NOT NULL,
  inputs jsonb NOT NULL,
  outputs jsonb NOT NULL,
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  result_hash text NOT NULL,
  review_status text NOT NULL DEFAULT 'unreviewed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hnx_rnd_review_issue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES hnx_rnd_scene_revision(id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  severity text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  affected_object_keys text[] NOT NULL DEFAULT '{}',
  evidence_ids uuid[] NOT NULL DEFAULT '{}',
  owner_id text,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hnx_rnd_approval (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  revision_id uuid NOT NULL REFERENCES hnx_rnd_scene_revision(id) ON DELETE RESTRICT,
  stage_key text NOT NULL,
  required_role text NOT NULL,
  required_qualification text,
  decision text NOT NULL DEFAULT 'pending',
  decision_by text,
  decision_reason text,
  signature_hash text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hnx_rnd_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  override_type text NOT NULL,
  scope jsonb NOT NULL,
  reason text NOT NULL,
  authorized_by text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  follow_up_task_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hnx_rnd_integration_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  project_id uuid REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  correlation_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  audience text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS hnx_nexi_improvement_proposal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  proposal_type text NOT NULL,
  title text NOT NULL,
  evidence jsonb NOT NULL,
  proposed_change jsonb NOT NULL,
  risk_class text NOT NULL,
  sandbox_ref text NOT NULL,
  test_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_status text NOT NULL DEFAULT 'pending',
  approved_by text,
  deployment_ref text,
  rollback_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE INDEX IF NOT EXISTS hnx_rnd_member_project_idx ON hnx_rnd_project_member (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS hnx_rnd_scene_project_idx ON hnx_rnd_scene_revision (tenant_id, project_id, revision_no DESC);
CREATE INDEX IF NOT EXISTS hnx_rnd_scene_object_idx ON hnx_rnd_scene_object (revision_id, layer_key);
CREATE INDEX IF NOT EXISTS hnx_rnd_review_open_idx ON hnx_rnd_review_issue (tenant_id, project_id, status, severity);
CREATE INDEX IF NOT EXISTS hnx_rnd_approval_queue_idx ON hnx_rnd_approval (tenant_id, decision, created_at);
CREATE INDEX IF NOT EXISTS hnx_rnd_outbox_due_idx ON hnx_rnd_integration_outbox (status, next_attempt_at);

COMMENT ON TABLE hnx_rnd_scene_revision IS 'Immutable saved drawing/model revisions; issued versions are never updated in place.';
COMMENT ON TABLE hnx_rnd_integration_outbox IS 'Durable, idempotent cross-module events for tasks, inventory, procurement, finance, EA and audit.';
COMMENT ON TABLE hnx_nexi_improvement_proposal IS 'Admin-governed sandbox proposals; Nexi cannot approve or alter her own authority.';

