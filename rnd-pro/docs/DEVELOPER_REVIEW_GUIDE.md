# HydroNexis-AI R&D & Planning — developer review guide

Status: review implementation, not production authorization

This package converts the approved master specification into a runnable product foundation. It is intended for architecture, security, engineering, UX, data, and delivery review before production integration.

For the fastest visual review after a production build, open `frontend/review-preview.html`. It loads the compiled local bundle and does not require production credentials.

## Review surfaces

### Executive cockpit

- Portfolio confidence, active-project, approval, risk, and variance indicators.
- Digital project-twin cards with progress, confidence, budget, risks, approvals, tasks, ownership, and stage.
- Nexi engineering findings with severity, evidence, confidence, and a controlled next action.
- Auditable activity feed.

### Professional Engineering Studio

- Dark CAD-style workspace matching the HydroNexis-AI digital-twin visual language.
- Project, revision, approval, autosave, layer, scale, snapping, and export controls.
- Real scene objects rendered in a high-DPI canvas.
- Selection, drag, keyboard nudge, delete, eight resize handles, rotation handle, shift-constrained resize, grid snapping, zoom, undo, redo, and exact numeric properties.
- PNG/JPG/TIFF placement with aspect-ratio lock, opacity, rotation, object lock, and persisted scene properties.
- Layers, properties, and Nexi inspector modes.
- Supervised Nexi flow that separates finding, evidence, calculation, proposed change, impact, and approval.

### Portfolio controls

- Project portfolio and status filtering.
- Approval queue and non-bypassable safeguard explanation.
- Engineering knowledge/evidence categories.
- Admin-only Nexi development and governance lifecycle.

## Code map

| Area | Key files |
|---|---|
| Product shell | `frontend/src/rnd-ui/RNDApp.tsx` |
| Executive cockpit | `frontend/src/rnd-ui/CockpitOverview.tsx` |
| Engineering studio | `frontend/src/rnd-ui/EngineeringStudio.tsx` |
| High-DPI scene surface | `frontend/src/rnd-ui/SceneCanvas.tsx` |
| Canvas rendering | `frontend/src/rnd-core/scene-engine/canvasRenderer.ts` |
| Pointer/resize/rotation | `frontend/src/rnd-core/scene-engine/interaction.ts` |
| Geometry/hit testing | `frontend/src/rnd-core/scene-engine/geometry.ts` |
| Design and motion system | `frontend/src/rnd-ui/rnd-system.css` |
| Cockpit/Nexi API contracts | `backend/app/api/cockpit.py` |
| Typed API models | `backend/app/models/project_v2.py` |
| Operating-system schema | `migrations/003_engineering_operating_system.sql` |
| Contract tests | `backend/tests/test_cockpit_contract.py` |

## Safe review mode

The cockpit uses deterministic local review data so reviewers can inspect the full interface without production credentials or external side effects. The backend exposes typed review endpoints at:

- `GET /api/rnd/cockpit/summary`
- `POST /api/rnd/projects/{project_id}/nexi/analyze`
- `POST /api/rnd/change-sets/preview`

These routes do not apply a scene change. They return evidence, assumptions, required approvals, affected outputs, audit references, and rollback availability.

Before deployment, replace the review repository with tenant-filtered PostgreSQL queries and require host-authenticated actor, tenant, role, and project scopes in middleware.

## Required developer decisions

1. Confirm the host authentication token, tenant claim, role/permission vocabulary, and project-scoped authorization middleware.
2. Confirm the production PostgreSQL migration process, database backup/rehearsal environment, and row-level isolation approach.
3. Select the collaboration model and service: transaction log, websocket presence, object conflict strategy, and offline queue.
4. Select licensed DXF/DWG/BIM conversion services and validate fidelity using golden engineering files.
5. Replace review metrics and project cards with normalized API queries and durable jobs.
6. Connect scene saves to immutable revisions; never update approved or issued revisions in place.
7. Connect Nexi responses to schema-validated tools, deterministic engineering engines, evidence retrieval, action policy, and audit.
8. Implement signed exports, QR verification, company branding, and approval signatures through the document service.

## Mandatory production gates

- All tenant and project authorization tests pass.
- No browser bundle, local storage, log, prompt, export, or exception contains a secret.
- Uploaded files are type-checked, malware-scanned, size-limited, and parsed in a sandbox.
- Safety, legal, professional, financial, and issued-document actions require configured human approval.
- Every Nexi action shows the proposed change, reason, evidence, confidence, risk, affected outputs, approvals, and rollback.
- Every accepted save is durable and read-after-write verified.
- Migration rehearsal reconciles counts, hashes, geometry bounds, and attachments before cutover.
- Image resize tests pass at 25%, 100%, 400%, and 1600% zoom on supported browsers and device-pixel ratios.
- Motion respects `prefers-reduced-motion` and core workflows remain keyboard accessible.

## Review checklist

- Product owner: workflows, terminology, cockpit priorities, and acceptance criteria.
- Discipline engineers: calculations, standards, assumptions, model behavior, and professional review boundaries.
- Security: authentication, project isolation, uploads, prompt injection, secrets, audit, retention, and external sharing.
- Data: schema, version immutability, evidence provenance, integration outbox, backup, and migration.
- Frontend: scene architecture, interaction performance, accessibility, responsive behavior, and design tokens.
- Backend: API contract, durable jobs, idempotency, authorization, deterministic engines, and observability.
- QA: golden files, reference calculations, cross-browser image control, collaboration conflicts, export round trips, and rollback.

## Not represented as production-complete

The review fixture does not claim licensed native DWG support, final multi-user collaboration, qualified-engineer certification, production AI/model credentials, live warehouse/finance commitments, or deployment approval. Those capabilities must be implemented and accepted through the master specification gates.
