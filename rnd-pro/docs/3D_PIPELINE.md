# 3D component pipeline

## Sourcing 3D models

You have three realistic paths to populate ~500 components per discipline:

1. **Manufacturer downloads** — many vendors offer STEP/SolidWorks for free:
   - CHINT: https://chintglobal.com (request 3D library via sales).
   - Schneider Electric: https://www.se.com/ww/en/download/ → 3D models section.
   - ABB: https://new.abb.com/products/ → CAD downloads.
   - Standard valves / pumps: 3D ContentCentral, GrabCAD, TraceParts.

2. **STEP → GLB conversion** — once you have STEP files:
   - Use Blender (free) with the STEPper add-on, or
   - `freecad-cli` with `Mesh.export()` to GLTF, or
   - Commercial: CAD Exchanger.

3. **Hand-modelled in Blender** — for the simple components (busbars, terminal blocks, generic enclosures). Each takes ~30 minutes.

## Upload pipeline

1. Save each `.glb` to your R2 bucket under `assets/<discipline>/<part_no>.glb`.
2. Add a row to a CSV with the fields below.
3. Run `scripts/import_assets_csv.py` — populates Postgres `hnx_rnd_asset` rows with `gltf_key` pointing to R2.

## Asset DB CSV schema

| Column | Required | Notes |
|---|---|---|
| name | yes | Display name |
| discipline | yes | electrical / plumbing / civil |
| asset_kind | yes | symbol_2d / component_3d / composite |
| partNo | recommended | Manufacturer part number |
| manufacturer | recommended |  |
| device_kind | electrical | breaker / mccb / contactor / overload / meter / ct |
| poles | electrical | 1, 2, 3, 4 |
| current_a | electrical | rated A |
| curve | electrical | C / D |
| kV | electrical | insulation voltage |
| type | plumbing | pump / valve / filter / tank / manifold / dripper / sensor |
| dn_mm | plumbing | nominal diameter |
| pn_bar | plumbing | pressure rating |
| material | plumbing | PVC / PE / brass / iron |
| flow_m3h | plumbing | rated flow |
| head_m | plumbing | rated head |
| svg | optional | inline SVG for 2D symbol |
| gltf_key | for 3D | R2/S3 key |
| dim_w_mm, dim_h_mm, dim_d_mm | optional | bounding box for placement |
| price_unit | optional | for BOM totals |

## How selectors use it

`services/selector_electrical.py` issues queries like:

```sql
SELECT * FROM hnx_rnd_asset
 WHERE discipline='electrical'
   AND asset_kind='component_3d'
   AND params->>'device_kind' = 'breaker'
   AND (params->>'poles')::int = 3
   AND (params->>'current_a')::int >= 25
   AND (params->>'curve') = 'D'
 ORDER BY (params->>'current_a')::int ASC
 LIMIT 1;
```

GIN index on `params` (migration 002) makes this fast for thousands of rows.

## Rendering in the frontend

`Cabinet3DView.tsx` falls back to colored primitives when an asset has no `gltfKey` set. When `gltfKey` is present, the viewer should:

```ts
const url = `${API_BASE}/assets/gltf/${asset.id}`;     // backend proxies signed URL from R2
const loader = new GLTFLoader();
loader.load(url, gltf => scene.add(gltf.scene));
```

Replace the primitive `mesh` in the viewer with the loaded glTF.
