# Selector rules

Each selector function takes a domain element (DeviceV2 / PlumbNode / CivilMember) and returns the best matching Asset from the catalog.

## Electrical rules

| Element | Rule |
|---|---|
| Breaker | same `poles`, `current_a >= demand`, prefer matching `curve` |
| MCCB | same `poles`, `current_a >= demand`, prefer higher kA rating |
| Contactor | `current_a >= load FLA × 1.25` |
| Overload | trip range `min <= FLA <= max` |
| Meter / CT | match by `type` + ratio |

## Plumbing rules

| Element | Rule |
|---|---|
| Pump | `flow_m3h >= demand`, `head_m >= required head` |
| Valve | match `dn`, `pn >= demand`, `material` |
| Filter | match `micron`, `flow_m3h >= demand` |
| Tank | match `material`, optional `capacity_l` |
| Pipe | match `dn`, `pn`, `material` |
| Manifold | match `dn`, port count `>= zones` |

## Civil rules (when implemented)

| Element | Rule |
|---|---|
| Beam | section modulus >= demand, material match |
| Column | section, load capacity, height |
| Foundation | type, soil bearing capacity, area |

## Tie-breakers

If multiple assets match, prefer in order:
1. Same `manufacturer` as previously selected components on this item (consistency).
2. Lowest price_unit (cost).
3. Smallest size that meets criteria (no oversizing).

## Caching

Selector queries are pure functions of (element params, tenant). Cache results in Redis or in-memory for the lifetime of a build request.
