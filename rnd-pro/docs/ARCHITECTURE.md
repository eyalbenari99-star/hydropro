# Architecture

## Why this rebuild exists

The legacy R&D module is one IIFE inside a 17 MB `index.html`. Every attempted feature extension during the recent session broke the file (string-literal injection, bulk `</body>` replace, apostrophe escapes). The new design isolates R&D into its own bundle that the host loads on demand.

## Frontend (TypeScript + React + Vite)

- **`rnd-core/`** holds pure logic with **no React imports**. Easy to unit test. Mirrors `aba_all.py` data model in TypeScript.
- **`rnd-ui/`** holds React components. They consume `rnd-core` services.
- **`integration/hnx-shim.ts`** publishes the `window.RND.*` facade that the legacy host expects. Calling `window.RND.open()` mounts the React tree on `#hnx-rnd-root`.

## Backend (Python FastAPI)

Heavy operations (PDF, DXF, image generation, cabinet rendering) run server-side. This:

1. Removes CDN dependencies that fail under `file://`.
2. Lets us reuse the working `aba_all.py` code as-is.
3. Centralises OpenAI/DALL-E key (one secret on the server, not per-browser).
4. Enables proper batching and cost caps.

Routes:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/rnd/items` | List items for tenant |
| POST | `/api/rnd/items` | Create item |
| GET/PUT/DELETE | `/api/rnd/items/{id}` | CRUD |
| POST | `/api/rnd/parse-cabinet` | Markdown/text → CabinetSpecV2 |
| POST | `/api/rnd/render-png` | CabinetSpecV2 → PNG |
| POST | `/api/rnd/bom-xlsx` | CabinetSpecV2 → XLSX |
| POST | `/api/rnd/wire-pdf` | CabinetSpecV2 → PDF |
| POST | `/api/rnd/export-dxf` | CabinetSpecV2 → DXF text |
| GET | `/api/rnd/assets` | Filtered Asset DB |
| POST | `/api/rnd/assets` | Create asset (admin) |
| POST | `/api/rnd/import-spec` | PDF/XLSX/DOCX/image → text + maybe spec |
| POST | `/api/rnd/ai-render` | DALL-E cabinet image |
| GET | `/api/rnd/health` | Liveness + dependency health |

## Database (PostgreSQL)

`migrations/001_init.sql` ports the legacy localStorage shapes into proper tables with `tenant_id`. The mapping:

| Legacy key | Table |
|---|---|
| `hydroPro_rnd_subjects_v1` | `hnx_rnd_subject` |
| `hydroPro_rnd_projects_v1` | `hnx_rnd_project` |
| `hydroPro_rnd_items_v1` | `hnx_rnd_item` |
| `hydroPro_rnd_assets_v1` | `hnx_rnd_asset` |

## Object storage (Cloudflare R2)

The existing Cloudflare Worker at `hnx-sync.eyalbenari99.workers.dev` is fine for now. Move BG images and AI-generated photos to a new R2 bucket with signed URLs.

## Data flow for "Build cabinet from markdown"

```
User pastes markdown in AI Apply
        ↓
frontend AiApplyPanel.tsx
        ↓ POST /api/rnd/parse-cabinet
backend api/parse_cabinet.py
        ↓ services/parser.py (port of aba_all.py logic)
        ↓ returns CabinetSpecV2 JSON
frontend rnd-core/spec-engine/renderCabinetV2.ts
        ↓ builds Scene from spec
frontend scene-engine/canvasRenderer.ts
        ↓ renders to <canvas>
[POST /api/rnd/items to persist]
```

## Build / deploy

- Frontend: `npm run build` → single `rnd-bundle.js` file (~200 KB gzipped target).
- Backend: standard FastAPI, `uvicorn main:app`. Containerise with Docker for production.
- DB: PostgreSQL 14+.
- Auth: reuse the host app's tenant token. Backend validates it on every request.
