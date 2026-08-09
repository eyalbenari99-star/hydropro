# HydroNexis-AI R&D Module — Developer Handoff

**From:** ABA PARDES AGRITECH CORP
**Package:** `HydroNexis-AI-RND-rebuild-skeleton.zip` (~120 KB compressed, 113 files)
**Goal:** Stand up the new R&D & Planning module (wizard-driven cabinet + plumbing + civil design with auto BOM / 2D / 3D / DXF).

---

## What this zip is

A production-grade rebuild skeleton — TypeScript + React + Vite frontend, Python FastAPI backend, Postgres + JSONB asset DB, Three.js 3D viewer. It replaces the old monolithic R&D IIFE in `index.html`. **Architecture, types, engineering rules, and 139-row CHINT catalog are all in place.** You inherit a clean, internally consistent codebase — your job is wiring, not design.

## Day 1 — Stand up the stack (≈2 hours)

```sh
# 1. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
psql -d hnx < ../migrations/001_init.sql
psql -d hnx < ../migrations/002_add_3d_columns.sql
uvicorn main:app --reload --port 8001

# 2. Frontend
cd ../frontend
npm install
npm run dev
```

**Smoke test** — both must respond:

- `curl http://localhost:8001/api/rnd/health`
- `curl http://localhost:8001/api/rnd/wizards/electrical/questions` → 15 questions
- `curl http://localhost:8001/api/rnd/wizards/plumbing/questions` → 12 questions
- `curl http://localhost:8001/api/rnd/wizards/civil/questions` → 7 questions
- `http://localhost:5173` → wizard UI loads

## Day 2 — Import the catalog (≈30 min)

```sh
cd scripts
# Validate first (zero fails / zero warns expected):
python3 import_assets_csv.py --dry-run ../data/sample_electrical_products.csv
python3 import_assets_csv.py --dry-run ../data/sample_plumbing_products.csv

# Then import:
python3 import_assets_csv.py http://localhost:8001 <tenant-uuid> ../data/sample_electrical_products.csv
python3 import_assets_csv.py http://localhost:8001 <tenant-uuid> ../data/sample_plumbing_products.csv
```

Verify in DB: 139 electrical rows (NXB / NM1 / NXC / JR36 / LMZJ1 / DT862) + 46 plumbing rows (pumps / filters / pipes / valves).

## Day 3 — End-to-end test (≈1 hour)

Run one wizard cycle of each discipline and confirm the full chain:

- Electrical: 4-feeder irrigation panel (one 2.2 kW pump, one 5.5 kW pump, one lighting circuit, one outlet) → Build → verify NXB breakers, NXC contactors, JR36 overloads selected from catalog (not synth).
- Plumbing: 4 zones × 3 m³/h, 3 bar → Build → verify pump duty = 13.8 m³/h × 42.7 m, main DN sensible.
- Civil: 3 spans × 40 m greenhouse → Build → verify 27 columns, 24 rafters, 15 purlins.

## Day 4-5 — Wire into the legacy host

```sh
cd frontend && npm run build   # produces dist/rnd-bundle.js
```

Copy `dist/rnd-bundle.js` into the host's static assets. In `index.html`:

```html
<script src="/static/rnd-bundle.js"></script>
<div id="hnx-rnd-root" style="display:none;"></div>
```

The new `window.RND.open()` should mount the React app on `#hnx-rnd-root`. **Do NOT edit `index.html` with bulk `str.replace('</body>', ...)` — it corrupts other modules' inline `document.write` payloads. Use `html.rfind('</body>')` instead.** This is documented in `04_failed_patterns_DO_NOT_REUSE/INJECT_FAIL_v1.py`.

Migrate legacy data with `scripts/migrate_localstorage.py` before removing the old R&D IIFE.

## Where to start reading

| File | Purpose |
|---|---|
| `README.md` | High-level architecture |
| `docs/ENGINEERING_RULES.md` | Every formula (motor FLA, cable ampacity, pump duty, pipe DN) |
| `docs/WIZARD_QUESTION_SETS.md` | Question schema + loader contract |
| `docs/ELECTRICAL_CSV_SCHEMA.md` | CSV column → params jsonb translation |
| `docs/ENGINEER_VALIDATION_CHECKLIST.md` | Hand to senior engineer for sign-off |
| `backend/app/services/engineering_tables.py` | **Single source of truth** for all sizing logic |
| `backend/app/api/wizards.py` | All three wizard build endpoints |
| `frontend/src/rnd-ui/wizards/` | ElectricalWizard, PlumbingWizard, CivilWizard, FeederEditor |

## When something is wrong — where to fix

| Symptom | Fix in |
|---|---|
| Sizing formula off (FLA, breaker × FLA, pump margin) | `backend/app/services/engineering_tables.py` |
| Wrong part selected from catalog | `data/sample_electrical_products.csv` or `selector_electrical.py` |
| Wizard answer not mapping to spec | `backend/app/services/calc_electrical.py` / `calc_plumbing.py` / `calc_civil.py` |
| UI step missing or wrong order | `frontend/src/rnd-ui/wizards/*.tsx` |
| 3D models don't load | `gltf_key` paths in CSV — upload real `.glb` files to R2 at those paths |

## Definition of done

- All three wizards (Electrical / Plumbing / Civil) end-to-end on the dev box.
- 139+46 catalog rows imported with 0 errors.
- Senior engineer signs `docs/ENGINEER_VALIDATION_CHECKLIST.md` for Electrical + Plumbing.
- New bundle loads from inside the legacy `index.html` host without breaking existing modules.
- Old R&D localStorage migrated to the new asset DB.

## Pending work (out of scope of this handoff)

1. Source real `.glb` 3D models for the 139 electrical + 46 plumbing parts and upload to R2 at the `gltf_key` paths.
2. HVAC discipline (4th wizard) — not yet started.
3. Multi-brand support beyond CHINT (ABB, Schneider) — schema supports it; needs CSV rows.

## Contact

Project lead: Eyal Ben-Ari · ABA PARDES AGRITECH CORP · eyalbenari99@gmail.com

Open a PR against the dev branch when each phase passes. Do not push to main without engineer sign-off on the validation checklist.
