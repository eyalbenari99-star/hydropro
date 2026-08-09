# Electrical Catalog CSV Schema

One unified CSV at `data/sample_electrical_products.csv` covers every
electrical 3D component. Each row becomes one `hnx_rnd_asset` row whose
`params` jsonb is queried directly by `selector_electrical.py`.

## Required meta columns (every row)

| Column        | Type   | Notes                                              |
|---------------|--------|----------------------------------------------------|
| `discipline`  | str    | Always `electrical`                                |
| `asset_kind`  | str    | Always `component_3d`                              |
| `part_no`     | str    | Catalog part number, e.g. `NXB-63 C16 3P`          |
| `name`        | str    | Human label                                        |
| `manufacturer`| str    | `CHINT`, `ABB`, `Schneider`, ...                   |
| `series`      | str    | `NXB` / `NXC` / `JR36` / `NM1` / `DT862` / `LMZJ1` |
| `device_kind` | str    | `MCB` / `MCCB` / `Contactor` / `Overload` / `Meter` / `CT` |
| `gltf_key`    | str    | R2/S3 path to `.glb` (may be empty during seeding) |
| `tags`        | str    | Comma-separated tags                               |

## Device-specific columns

### MCBs (CHINT NXB)

| Column      | Type | Required | Example       |
|-------------|------|----------|---------------|
| `poles`     | int  | yes      | 1 / 2 / 3 / 4 |
| `current_a` | num  | yes      | 6, 10, 16, ... 63 |
| `curve`     | str  | yes      | `B` / `C` / `D` |
| `u_n_v`     | int  | rec.     | 230 (1P) or 400 (3P) |
| `i_cn_ka`   | num  | rec.     | 6 or 10 kA    |

### MCCBs (CHINT NM1)

| Column      | Type | Required | Example                   |
|-------------|------|----------|---------------------------|
| `poles`     | int  | yes      | 3 or 4                    |
| `current_a` | num  | yes      | 100, 250, 400, 630, ...   |
| `frame_a`   | num  | yes      | 100, 250, 400, 630, 1250  |
| `u_n_v`     | int  | rec.     | 400                       |
| `i_cn_ka`   | num  | rec.     | 36                        |

### Contactors (CHINT NXC, AC-3)

| Column          | Type | Required | Example       |
|-----------------|------|----------|---------------|
| `poles`         | int  | yes      | 3             |
| `ac3_current_a` | num  | yes      | 9, 12, 18, ..., 170 |
| `kw_max_400`    | num  | yes      | 4, 5.5, 7.5, ..., 90 |

### Overload relays (CHINT JR36)

| Column     | Type | Required | Example |
|------------|------|----------|---------|
| `fl_min_a` | num  | yes      | 4.0     |
| `fl_max_a` | num  | yes      | 6.4     |

### Current transformers (CHINT LMZJ1)

| Column        | Type | Required | Example  |
|---------------|------|----------|----------|
| `ratio`       | str  | yes      | `300/5`  |
| `primary_a`   | num  | yes      | 300      |
| `secondary_a` | num  | yes      | 5        |

### Energy meters (CHINT DT862)

| Column      | Type | Required | Example |
|-------------|------|----------|---------|
| `poles`     | int  | rec.     | 3       |
| `u_n_v`     | int  | rec.     | 400     |
| `current_a` | num  | rec.     | 10      |

## Column -> params jsonb translation

The importer (`scripts/import_assets_csv.py`) translates snake_case
columns into camelCase params keys the selectors query:

| CSV column      | params key   |
|-----------------|--------------|
| `device_kind`   | `deviceType` |
| `current_a`     | `currentA`   |
| `u_n_v`         | `uN_V`       |
| `i_cn_ka`       | `iCn_kA`     |
| `frame_a`       | `frameA`     |
| `ac3_current_a` | `ac3CurrentA`|
| `kw_max_400`    | `kwMax400`   |
| `fl_min_a`      | `flMinA`     |
| `fl_max_a`      | `flMaxA`     |
| `primary_a`     | `primaryA`   |
| `secondary_a`   | `secondaryA` |

Resulting params jsonb for a 3-pole NXB C16 row:

```json
{
  "deviceType": "MCB",
  "series": "NXB",
  "manufacturer": "CHINT",
  "poles": 3,
  "currentA": 16,
  "curve": "C",
  "uN_V": 400,
  "iCn_kA": 10
}
```

## Validation

Dry-run validation before hitting the API:

```bash
python3 scripts/import_assets_csv.py --dry-run data/sample_electrical_products.csv
```

The importer enforces per-device required keys. A missing required key
emits `WARN`; bad rows do not block other rows from importing.

## Adding non-CHINT brands

ABB / Schneider / Siemens use the same columns. Just change
`manufacturer` and `series`. The selectors filter by `series` so an
`NXB`-only query will not see ABB parts; a brand-free query orders by
catalog match score.
