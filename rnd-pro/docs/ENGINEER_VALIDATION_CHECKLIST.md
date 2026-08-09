# Engineer Validation Checklist

Hand this document to the senior engineer who will sign off on the
R&D wizard outputs. Run each section against at least 3-5 distinct
designs before declaring a discipline production-ready.

Issues found during this checklist should be triaged into one of
three buckets:

- **Formula / margin** -> fix in `backend/app/services/engineering_tables.py`
- **Spec builder** -> fix in `backend/app/services/calc_electrical.py` or `calc_plumbing.py`
- **Catalog data** -> fix in `data/sample_*_products.csv` (wrong rating, curve, frame, micron, ...)

---

## A. Electrical wizard validation

Run for a minimum of 5 cabinets across these patterns:
- Small irrigation panel (4-6 pump feeders, 1x230V or 3x400V)
- Fertigation plant (10-15 feeders, mix of pumps + outlets)
- General distribution board (lighting + sockets, no motors)
- MCC with one large machine (15+ kW motor)
- Stress test: 30+ feeders, 400 A main

### A1. Input sanity

- [ ] All 15 questions render with clear labels and help text
- [ ] Voltage options match site standards (3x400 / 1x230)
- [ ] Short-circuit options cover 6, 10, 25, 36 kA
- [ ] Feeder editor lets you add, remove, and reorder feeders
- [ ] Feeder type select offers: pump, fan, machine, outlet, lighting
- [ ] kW field accepts decimals (e.g. 0.75, 2.2)

### A2. Motor sizing — compare against IEC/NEC tables

Test motors at 400 V 3-phase:

| Motor kW | Expected FLA (A) | Tolerated band |
|----------|------------------|----------------|
| 0.37     | 1.0              | 0.9 - 1.2      |
| 0.75     | 1.8              | 1.6 - 2.0      |
| 1.5      | 3.5              | 3.2 - 3.8      |
| 2.2      | 4.9              | 4.6 - 5.4      |
| 5.5      | 11.4             | 10.5 - 12.5    |
| 7.5      | 15.2             | 14.0 - 16.5    |
| 11       | 22               | 20 - 24        |
| 15       | 28.5             | 26 - 31        |
| 22       | 41               | 38 - 44        |

For each kW above:
- [ ] FLA displayed in summary is within tolerated band
- [ ] Breaker rating >= FLA x 2.5 (NEC 430.52) and rounded UP to nearest standard
- [ ] Breaker is NXB-63 with curve D for motor feeders
- [ ] Overload range contains FLA (range LO <= FLA <= range HI)
- [ ] Selected NXC contactor has kW rating >= motor kW
- [ ] No "OUT OF RANGE" tags on overload

### A3. Breaker / frame selection

For each test cabinet:

- [ ] All feeders <= 63 A use NXB-63 (not NM1)
- [ ] All feeders > 63 A use NM1 with appropriate frame
- [ ] Main breaker frame >= main_in_current_a
- [ ] If `breaker_series=Any`, the system picks the cheapest correct frame
- [ ] If `brand=ABB`, no CHINT parts appear in the BOM

### A4. Cable sizing (IEC 60364-5-52)

For 2-3 feeders per test cabinet:

- [ ] Cable mm^2 listed in summary
- [ ] Ampacity column listed in summary
- [ ] Ampacity >= breaker rating (or per your local margin rule)
- [ ] No cable smaller than 1.5 mm^2 for any feeder
- [ ] No cable smaller than 2.5 mm^2 for power circuits
- [ ] Length-based voltage-drop check (if engineer policy enforces it)

### A5. BOM sanity

After Build, open the BOM and verify:

- [ ] One breaker per feeder (no duplicates, no missing)
- [ ] Motor feeders also have one contactor + one overload
- [ ] All BOM lines have qty > 0
- [ ] All BOM lines reference a real part number from the catalog
- [ ] Main incomer, busbars, SPD, meter, CTs are listed if enabled
- [ ] Totals (qty, price if set) match expected

### A6. 2D / 3D layout

- [ ] 2D drawing shows main section above feeders section
- [ ] Busbars (L1/L2/L3/N/PE) drawn at top
- [ ] Feeder refs (1QF, 2QF, ...) labeled in order
- [ ] 3D viewer loads without console errors
- [ ] Feeder devices render at the expected DIN rail position
- [ ] When a feeder is selected in the table, it highlights in 3D

### A7. Exports

- [ ] Panel schedule PDF lists every feeder with rating, type, contactor, overload
- [ ] Wire schedule lists source -> destination with cable size
- [ ] DXF opens in AutoCAD without errors
- [ ] BOM XLSX has discipline-grouped sheets

---

## B. Plumbing wizard validation

Run for a minimum of 5 hydraulic systems:
- Drip irrigation: 4 zones, 3 m^3/h each, 3 bar at field
- Sprinkler: 8 zones, 12 m^3/h each, 2.5 bar at field
- Fertigation: irrigation + 3 fertilizer drums + acid + dosing
- Booster set: 25 m^3/h, 4 bar, 10 m elevation
- Filtration skid only: 30 m^3/h, sand + disc in series

### B1. Hydraulics inputs

- [ ] All 12 questions render with clear units (m^3/h, bar, m)
- [ ] Zones count accepts 1-64
- [ ] Flow per zone accepts decimals (e.g. 3.5)
- [ ] Pressure at field accepts 1-10 bar
- [ ] Elevation accepts negative values for downhill systems

### B2. Pump duty point

Sample design: 4 zones * 3 m^3/h = 12 m^3/h, 3 bar field, 0 m elev, default 5 m losses.

Expected (with 15% flow / 20% head margin):
- Pressure head = 3 * 10.197 = 30.6 m
- Total head before margin = 30.6 + 0 + 5 = 35.6 m
- Duty flow = 12 * 1.15 = 13.8 m^3/h
- Duty head = 35.6 * 1.20 = 42.7 m

For each test:

- [ ] Duty flow shown in summary matches flow * 1.15 within 0.1 m^3/h
- [ ] Duty head shown matches (pressure + static + losses) * 1.20 within 0.5 m
- [ ] Margins editable from `engineering_tables.pump_duty()`

### B3. Main DN and velocity

Hazen-Williams: target velocity 1.0-1.5 m/s (default cap 1.8).

For each test:

- [ ] Main DN selected from standard list (25, 32, 40, 50, 65, 80, 100, ...)
- [ ] Computed main velocity falls within 0.5-1.8 m/s
- [ ] Doubling flow steps DN up at least one size

### B4. Zone DN

- [ ] Zone DN < main DN
- [ ] Per-zone velocity within 0.5-1.8 m/s
- [ ] Changing `flow_per_zone_m3h` re-sizes zone DN automatically

### B5. Filtration

- [ ] `filtration_grade=130` and `filtration_type=auto` -> disc filter at 130 um
- [ ] `filtration_type=sand` -> sand battery at chosen grade
- [ ] `filtration_type=both` -> sand THEN disc in series (both appear in BOM)
- [ ] Filter flow capacity >= duty flow

### B6. Pump selection from catalog

Once pump products are imported:

- [ ] Selected pump has flow_m3h_max >= duty flow
- [ ] Selected pump has head_m_max >= duty head
- [ ] Pump is the smallest catalog row that satisfies both
- [ ] If no pump fits, summary shows a warning instead of crashing

### B7. 2D / 3D layout

- [ ] 2D shows: source -> pump -> filter -> manifold -> zones (left to right)
- [ ] Fertigation drums + acid drum drawn upstream of dosing unit
- [ ] EC / pH sensors drawn after dosing, before manifold
- [ ] 3D viewer renders pipes as cylinders with correct DN scaling
- [ ] Pumps and filters load `.glb` if available, fallback to placeholder boxes

### B8. BOM

- [ ] Pump listed with flow/head spec
- [ ] Each filter (sand and/or disc) listed
- [ ] Main pipe listed with DN, material, length placeholder
- [ ] Each zone valve listed
- [ ] Fertilizer drums, acid drum, dosing unit listed if `has_fertigation=true`
- [ ] EC / pH sensors listed if `has_ec_ph_sensors=true`

---

## C. Sign-off

When all checklist items pass for a discipline, the senior engineer
signs and dates below:

```
Electrical wizard sign-off:
  Engineer name: ______________________________
  Date:          ______________________________
  Signature:     ______________________________

Plumbing wizard sign-off:
  Engineer name: ______________________________
  Date:          ______________________________
  Signature:     ______________________________

Civil wizard sign-off (when ready):
  Engineer name: ______________________________
  Date:          ______________________________
  Signature:     ______________________________
```

Sign-offs are tracked in the project repo under `docs/sign-offs/`.
