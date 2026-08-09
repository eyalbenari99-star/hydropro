# Plumbing Catalog CSV Schema

One unified CSV at `data/sample_plumbing_products.csv` covers every
plumbing 3D component (pump, filter, pipe, valve, tank, manifold, sensor).

## Required meta columns

| Column        | Type | Notes                                              |
|---------------|------|----------------------------------------------------|
| `discipline`  | str  | Always `plumbing`                                  |
| `asset_kind`  | str  | Always `component_3d`                              |
| `part_no`     | str  | Catalog part number                                |
| `name`        | str  | Human label                                        |
| `manufacturer`| str  | `Pedrollo`, `Grundfos`, `Amiad`, `Bermad`, ...     |
| `series`      | str  | `centrifugal`, `disc`, `sand`, ...                 |
| `node_type`   | str  | `pump` / `filter` / `pipe` / `valve` / `tank` / `manifold` / `sensor` |
| `gltf_key`    | str  | R2/S3 path to `.glb`                               |
| `tags`        | str  | Comma-separated tags                               |

## Type-specific columns

### Pumps

| Column         | Type | Required | Example                |
|----------------|------|----------|------------------------|
| `flow_m3h_max` | num  | yes      | 25                     |
| `head_m_max`   | num  | yes      | 60                     |
| `material`     | str  | rec.     | `cast iron`, `stainless steel` |

### Filters

| Column         | Type | Required | Example       |
|----------------|------|----------|---------------|
| `micron`       | int  | yes      | 130, 100, 80  |
| `flow_m3h_max` | num  | yes      | 15            |
| `series`       | str  | yes      | `disc`, `sand`, `screen` |

### Pipes

| Column     | Type | Required | Example     |
|------------|------|----------|-------------|
| `dn`       | int  | yes      | 25, 32, ... |
| `pn`       | int  | yes      | 10, 16, 25  |
| `material` | str  | yes      | `PE`, `PVC`, `Steel` |

### Valves

| Column     | Type | Required | Example       |
|------------|------|----------|---------------|
| `dn`       | int  | yes      | 50            |
| `pn`       | int  | yes      | 10            |
| `material` | str  | yes      | `PVC`         |

## Column -> params translation

| CSV column      | params key    |
|-----------------|---------------|
| `node_type`     | `nodeType`    |
| `flow_m3h_max`  | `flowM3hMax`  |
| `head_m_max`    | `headMMax`    |
| `dn`            | `dn`          |
| `pn`            | `pn`          |
| `micron`        | `micron`      |
| `material`      | `material`    |

Result for a centrifugal pump row:

```json
{
  "nodeType": "pump",
  "series": "centrifugal",
  "manufacturer": "Grundfos",
  "flowM3hMax": 25,
  "headMMax": 60,
  "material": "cast iron"
}
```
