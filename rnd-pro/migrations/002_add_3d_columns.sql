-- Migration 002 — extend Asset DB for 3D components and wizard-driven selection.
-- Applies on top of 001_init.sql.

ALTER TABLE hnx_rnd_asset
  ADD COLUMN IF NOT EXISTS discipline text NOT NULL DEFAULT 'electrical',
  ADD COLUMN IF NOT EXISTS asset_kind text NOT NULL DEFAULT 'symbol_2d'
    CHECK (asset_kind IN ('symbol_2d', 'component_3d', 'composite')),
  ADD COLUMN IF NOT EXISTS gltf_key text,
  ADD COLUMN IF NOT EXISTS params jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dim_w_mm numeric(10,2),
  ADD COLUMN IF NOT EXISTS dim_h_mm numeric(10,2),
  ADD COLUMN IF NOT EXISTS dim_d_mm numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_unit numeric(12,2),
  ADD COLUMN IF NOT EXISTS price_currency text DEFAULT 'USD';

CREATE INDEX IF NOT EXISTS hnx_rnd_asset_disc_kind_idx
  ON hnx_rnd_asset(tenant_id, discipline, asset_kind);

-- GIN index over params jsonb so selector queries can use ->>'current' fast.
CREATE INDEX IF NOT EXISTS hnx_rnd_asset_params_idx
  ON hnx_rnd_asset USING gin (params);

-- Wizard sessions — keeps a record of every answer set for audit / re-edit.
CREATE TABLE IF NOT EXISTS hnx_rnd_wizard_session (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  discipline  text NOT NULL,
  user_id     text,
  answers     jsonb NOT NULL DEFAULT '{}'::jsonb,
  produced_item_id uuid REFERENCES hnx_rnd_item(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','complete','abandoned')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS hnx_rnd_wizard_session_idx
  ON hnx_rnd_wizard_session(tenant_id, discipline, created_at DESC);
