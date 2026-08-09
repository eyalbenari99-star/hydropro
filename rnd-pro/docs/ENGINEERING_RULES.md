# Engineering rules reference

All formulas, tables and selection logic used by the wizards and selector engines live in `backend/app/services/engineering_tables.py`. Modifying that one file changes behavior everywhere consistently.

## 1. Motor sizing (per feeder)

| Step | Calculation | Source |
|---|---|---|
| Full-load current FLA | Looked up from `MOTOR_FLA_400V_3P` table (linear interpolation), conservative at 0.85 pf · 0.9 η | NEC 430.250 / IEC 60034 |
| Branch breaker demand | `FLA × 2.5` (inverse-time) | NEC 430.52 |
| Cable demand | `FLA × 1.25` (service factor) | NEC 430.22 |
| Pick breaker | smallest NXB-63 (1-4P, C/D curve) whose rating ≥ branch demand; escalate to NM1 if > 63 A | CHINT catalog |
| Pick contactor | smallest NXC whose `kWMax400 ≥ motor kW` | AC-3 utilisation |
| Pick overload | JR36 range bracketing the motor FLA | Manufacturer ranges |
| Pick cable | smallest IEC 60364-5-52 Cu PVC whose ampacity ≥ cable demand | IEC |

Implementation: `calc_electrical.size_motor_feeder(kw)` returns all of the above.

## 2. Non-motor sizing (outlets / lighting)

| Step | Calculation |
|---|---|
| Breaker demand | `continuous A × 1.25` |
| Cable | smallest mm² with ampacity ≥ demand |
| Pick breaker | NXB-63 in C curve (or NXBLE-32 RCBO for outlets) |

## 3. Pump duty point

```
total_head_m = pressure_head_m + static_head_m + losses_m
pressure_head_m = pressure_bar × 10.197    (1 bar ≈ 10.197 m H₂O)
flow_design = flow_required × 1.15         (15 % flow margin)
head_design = total_head × 1.20            (20 % head margin)
```

Implementation: `engineering_tables.pump_duty(flow, pressure, elevation, losses)`.

## 4. Pump shaft power

```
P (kW) = (ρ × g × Q × H) / (1000 × η)
       = (1000 × 9.81 × Q(m³/s) × H(m)) / (1000 × 0.65)
```

η = 0.65 default centrifugal pump efficiency. Implementation: `selector_plumbing._pump_kw(flow_m3h, head_m)`.

## 5. Pipe DN sizing (velocity method)

```
v(m/s) = (Q m³/h ÷ 3600) ÷ (π × (ID_mm / 2000)²)
```

Pick the smallest DN whose velocity ≤ `max_velocity_ms` (default 1.8 m/s for pressure mains).

Implementation: `engineering_tables.pick_pipe_dn(flow_m3h, max_velocity)`.

## 6. Cable ampacity table

IEC 60364-5-52 Cu PVC at 30 °C in air, 2 loaded conductors. Stored in `AMPACITY` list. Use `pick_cable_mm2(continuous_a, derate)` for derating (grouping, ambient).

## 7. Tie-breakers (when multiple assets match)

1. Same manufacturer as already-selected components on the same item.
2. Lowest unit price.
3. Smallest dimension (no oversizing).

## 8. Extending

| Discipline | Add to | Then |
|---|---|---|
| Civil | `engineering_tables.py` (section moduli table) + `calc_civil.py` | `selector_civil.py` joins the pattern |
| HVAC | Heat-load table + duct-sizing function | `selector_hvac.py` |
