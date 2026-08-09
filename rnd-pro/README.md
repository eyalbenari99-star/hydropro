# HydroNexis-AI R&D Pro V2 — developer review implementation

> **2026 developer-review implementation:** The package now includes the high-fidelity Nexi R&D cockpit, five-stage project intake, professional 2D studio, synchronized Three.js digital twin, calculations, BOM/warehouse/procurement review, AI Gantt, supervised Nexi changes, revisions, approvals, and exports. Start with `docs/RND_PRO_V2_IMPLEMENTATION_STATUS.md`, then `docs/DEVELOPER_REVIEW_GUIDE.md`.

**Stack:** TypeScript + React + Vite (frontend) · Python FastAPI (backend) · PostgreSQL · Cloudflare R2

This skeleton implements the rebuild plan from the design audit. It replaces the broken 17 MB `index.html` R&D IIFE with a properly modular system. The legacy host app keeps working — the new R&D module mounts inside a single `<div id="hnx-rnd-root">`.

## Folder tree

```
HydroNexis-AI-RND-rebuild-skeleton/
├── README.md                          ← read first
├── docs/
│   └── ARCHITECTURE.md                ← architecture deep-dive
├── frontend/                          ← TypeScript + React + Vite
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx                   ← entrypoint exposes window.__initRNDv2
│       ├── rnd-core/                  ← pure logic (no React, easy to test)
│       │   ├── data-model.ts          ← Item, Scene, CabinetSpecV2, BOM types
│       │   ├── api-client.ts          ← fetch wrapper with timeouts/retries
│       │   ├── ai-pipeline.ts         ← AI Apply online + offline heuristics
│       │   ├── scene-engine/
│       │   │   ├── canvasRenderer.ts
│       │   │   └── interaction.ts
│       │   ├── spec-engine/
│       │   │   ├── renderSpec.ts      ← dispatcher v1/v2/plan/plumbing
│       │   │   ├── renderCabinetV2.ts ← v2 renderer (ports aba_all.py logic)
│       │   │   └── normalizeCabSpec.ts
│       │   └── bom-engine/
│       │       └── generateBomFromCabSpec.ts
│       ├── rnd-ui/                    ← React components
│       │   ├── RNDApp.tsx
│       │   ├── LibraryView.tsx
│       │   ├── BoardModal.tsx
│       │   ├── SymbolPalette.tsx
│       │   ├── DesignSheetPanel.tsx
│       │   ├── BomPanel.tsx
│       │   ├── AiApplyPanel.tsx
│       │   ├── SpecImportModal.tsx
│       │   └── ReferenceSuite.tsx
│       └── integration/
│           └── hnx-shim.ts            ← window.RND.* facade for legacy host
├── backend/                           ← Python FastAPI
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── main.py                        ← entrypoint
│   └── app/
│       ├── __init__.py
│       ├── api/                       ← thin HTTP layer
│       │   ├── items.py
│       │   ├── assets.py
│       │   ├── parse_cabinet.py
│       │   ├── render_png.py
│       │   ├── bom_xlsx.py
│       │   ├── wire_pdf.py
│       │   ├── export_dxf.py
│       │   ├── import_spec.py
│       │   ├── ai_render.py
│       │   └── reference.py
│       ├── models/
│       │   ├── cabinet.py             ← Pydantic models matching frontend types
│       │   ├── item.py
│       │   └── asset.py
│       ├── services/                  ← business logic (port of aba_all.py)
│       │   ├── renderer.py
│       │   ├── parser.py
│       │   ├── bom.py
│       │   └── dxf.py
│       └── core/
│           ├── config.py
│           └── db.py
├── migrations/
│   └── 001_init.sql                   ← Postgres schema
└── scripts/
    └── migrate_localstorage.py        ← one-off: legacy localStorage → Postgres
```

## Quick start

```sh
# 1. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
psql -d hnx < ../migrations/001_init.sql
uvicorn main:app --reload --port 8001

# 2. Frontend
cd ../frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/rnd-bundle.js

# 3. Inject into the legacy host (one-line patch in index.html):
<script src="/static/rnd-bundle.js"></script>
<div id="hnx-rnd-root" style="display:none;"></div>

# 4. The legacy R&D IIFE keeps working; new code takes over when window.RND.open() is called.
```

## What you get vs what the IIFE gave

| Surface | Legacy IIFE (v4.54-rnd) | New skeleton |
|---|---|---|
| Cabinet renderer | v1 flat rails | **v2 sections + rails + items** (port of aba_all.py) |
| BOM | Manual | **Auto-generated from CabinetSpec v2** |
| 3D | None | **Three.js viewer over HTTP, geometry built by backend** |
| Export DXF | None | **Backend service** |
| Panel PDF | None | **reportlab on backend** |
| Asset DB | None (in-code SYMBOLS only) | **Postgres + R2 with proper pagination** |
| Library quota | 5 MB localStorage | **Unlimited (Postgres)** |
| `file://` works | Partially | **Backend serves everything (no CDN issues)** |

## Migration path

`scripts/migrate_localstorage.py` reads the user's existing `hydroPro_rnd_*` keys (dump them via DevTools first) and POSTs each into the new backend. After successful migration the legacy IIFE is dead code that can be deleted from `index.html`.

## Acceptance criteria checklist

Maps to the audit document's section 14 (criteria 14.1–14.18). Each is implemented or stubbed in this skeleton with a `// TODO(14.x)` marker where the developer needs to finish.

## Authors

ABA PARDES AGRITECH CORP · HydroNexis-AI internal use only.


---

## Deployment (added)

- **`deployment/`** — Docker Compose for local dev (`docker-compose.yml`), production (`docker-compose.prod.yml`), nginx config, Fly.io (`fly.toml`), Render (`render.yaml`), and Cloudflare Pages instructions (`cloudflare-pages.md`).
- **`backend/.env.example`** + **`frontend/.env.example`** — every env var the system reads.
- **`backend/tests/`** — pytest scaffold with one test per acceptance criterion (14.x).
- **`frontend/src/__tests__/`** — Vitest unit test for `renderCabinetV2`.
- **`DEPLOYMENT_GUIDE.md`** — choose-your-own-host walkthrough (local / cloud / VPS).
- **`TEST_CHECKLIST.md`** — manual + automated test plan per 14.x criterion.
- **`ROLLOUT_SEQUENCE.md`** — Phase 0 → 3 plan with rollback strategy.
- **`scripts/seed_assets.py`** — seed minimal Asset DB so 14.7/14.8 are testable on day one.


---

## 3D + Wizard layer (added)

- **Migration `002_add_3d_columns.sql`** — extends the Asset DB with `discipline`, `asset_kind`, `gltf_key`, `params jsonb` (+ GIN index), and a `hnx_rnd_wizard_session` table.
- **Selector engines** — `backend/app/services/selector_electrical.py` and `selector_plumbing.py` pick the right Asset for each device/node based on engineering rules.
- **Wizard backend** — `app/api/wizards.py` exposes:
  - `GET /api/rnd/wizards/{discipline}/questions` — discipline-specific question schema.
  - `POST /api/rnd/wizards/electrical/build` — answers → `CabinetSpecV2`.
  - `POST /api/rnd/wizards/plumbing/build` — answers → `PlumbingSpec`.
- **3D builders** — `app/api/build_3d.py` converts a spec into a neutral `Scene3D` graph the frontend renders.
- **Wizard frontend** — `rnd-ui/wizards/ElectricalWizard.tsx` (15 questions) and `PlumbingWizard.tsx` (12 questions) with shared `QuestionRenderer`.
- **3D viewer** — `rnd-ui/Cabinet3DView.tsx` uses Three.js with orbit controls; falls back to colored primitives until `.glb` assets are uploaded.
- **3D adapters** — `rnd-core/scene-engine/cabinetTo3DGeometry.ts` and `plumbingTo3DGeometry.ts` can also run locally without the backend.
- **Sample data** — `data/sample_electrical_products.csv` (22 CHINT parts) and `data/sample_plumbing_products.csv` (21 fittings / pumps / valves / tanks / sensors).
- **Bulk import** — `scripts/import_assets_csv.py` reads any CSV with the documented schema and POSTs to `/api/rnd/assets`.
- **Docs** — `docs/3D_PIPELINE.md` (sourcing + uploading 3D models), `docs/WIZARD_DESIGN.md` (the pattern), `docs/SELECTOR_RULES.md` (engineering rules).


---

## Engineering layer (added)

The selectors and wizards now use **real engineering rules**, not placeholders:

- `backend/app/services/engineering_tables.py` — motor FLA, IEC ampacity, NXB-63 / NM1 / NXC / JR36 frame tables, pipe DN, pump duty point.
- `backend/app/services/calc_electrical.py` — `size_motor_feeder(kw)` returns FLA, breaker, contactor, overload, cable for one motor feeder.
- `backend/app/services/calc_plumbing.py` — `size_plumbing_system(answers)` returns pump duty, main + per-zone DN, filter sizing.
- `backend/app/services/selector_electrical.py` & `selector_plumbing.py` — RE-WRITTEN to query Postgres first, fall back to engineering rules + part-number synthesis.
- `backend/app/api/wizards.py` — RE-WRITTEN: returns `{ spec, computed }` so the UI shows the math behind every selection.
- `frontend/src/rnd-ui/wizards/`:
  - `FeederEditor.tsx` — table editor for per-feeder configuration (label / kind / count / kW / A).
  - `WizardStepper.tsx` — multi-step navigation.
  - `ComputedSummary.tsx` — engineering summary panels (`ElectricalComputedSummary`, `PlumbingComputedSummary`).
  - `ElectricalWizard.tsx` — RE-WRITTEN as 4-step (Application · Feeders · Extras · Review) with the FeederEditor.
  - `PlumbingWizard.tsx` — RE-WRITTEN as 4-step (System · Hydraulics · Fertigation · Review) with the computed summary.
- `docs/ENGINEERING_RULES.md` — single source of truth for every formula and table used by the wizards.

The engineer now sees, after clicking Build:

> Pump duty: 13.8 m³/h × 49.5 m (15 % flow / 20 % head margin)
> Pressure head: 35.7 m · Static: 0 m · Losses: 5 m
> Main pipe: DN65 · velocity 1.16 m/s · PE
> Per-zone: DN32 · 3.45 m³/h · velocity 1.21 m/s
> Filtration: 130 µm · disc · 13.8 m³/h

And for electrical:

> 1QF — Roof fan — 0.2 kW — FLA 0.7 A — NXB-63 3P D6 — NXC-09 — JR36-20 0.68-1.1A — 1.5 mm² Cu (18 A)
> 4QF — Water pump 1 — 2.2 kW — FLA 4.9 A — NXB-63 3P D16 — NXC-12 — JR36-20 4.0-6.4A — 2.5 mm² Cu (24 A)

All values come from one file: `engineering_tables.py`. Change a rule there and every wizard, selector and report reflects it.
