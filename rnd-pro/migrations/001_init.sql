-- HydroNexis-AI R&D module · initial Postgres schema
-- Aligns with the audit document's section 5.3.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hnx_rnd_subject (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS hnx_rnd_project (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  subject_id      uuid NOT NULL REFERENCES hnx_rnd_subject(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES hnx_rnd_project(id) ON DELETE CASCADE,
  name            text NOT NULL,
  budget_total    numeric(14,2),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hnx_rnd_project_subj_idx ON hnx_rnd_project(tenant_id, subject_id);

CREATE TABLE IF NOT EXISTS hnx_rnd_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  subject_id  uuid REFERENCES hnx_rnd_subject(id) ON DELETE SET NULL,
  project_id  uuid REFERENCES hnx_rnd_project(id) ON DELETE SET NULL,
  title       text NOT NULL,
  description text,
  type        text NOT NULL DEFAULT 'quick_board',
  status      text NOT NULL DEFAULT 'Draft',
  version     int  NOT NULL DEFAULT 1,
  spec        jsonb,
  scene       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ds          jsonb NOT NULL DEFAULT '{}'::jsonb,
  bom         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX IF NOT EXISTS hnx_rnd_item_tenant_idx ON hnx_rnd_item(tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS hnx_rnd_revision (
  id        bigserial PRIMARY KEY,
  item_id   uuid NOT NULL REFERENCES hnx_rnd_item(id) ON DELETE CASCADE,
  at        timestamptz NOT NULL DEFAULT now(),
  by_user   text,
  snapshot  bytea NOT NULL
);
CREATE INDEX IF NOT EXISTS hnx_rnd_revision_item_idx ON hnx_rnd_revision(item_id, at DESC);

CREATE TABLE IF NOT EXISTS hnx_rnd_attachment (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES hnx_rnd_item(id) ON DELETE CASCADE,
  key     text NOT NULL,
  name    text NOT NULL,
  size    bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS hnx_rnd_asset (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  domain      text NOT NULL,
  name        text NOT NULL,
  description text,
  svg         text,
  raster_key  text,
  category    text,
  tags        text[],
  standard    text,
  meta        jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  text,
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS hnx_rnd_asset_domain_idx ON hnx_rnd_asset(tenant_id, domain);

CREATE TABLE IF NOT EXISTS hnx_rnd_audit_log (
  id          bigserial PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  ts          timestamptz NOT NULL DEFAULT now(),
  who         text,
  action      text NOT NULL,
  target_kind text NOT NULL,
  target_id   uuid,
  details     jsonb
);

-- Touch triggers
CREATE OR REPLACE FUNCTION hnx_rnd_touch() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER hnx_rnd_item_touch BEFORE UPDATE ON hnx_rnd_item FOR EACH ROW EXECUTE FUNCTION hnx_rnd_touch();
