# HydroNexis-AI R&D Pro V2 — implementation status

Status: runnable developer-review prototype, 2026-08-09  
Authority: ABA PARDES AGRITECH CORP.  
Classification: Company Confidential — internal developer review

## What is working in this review build

The standalone `index.html` runs without a server and demonstrates the intended governed engineering workflow:

1. Create a project through a five-stage intake wizard.
2. Upload or drag in a plan or engineering reference file.
3. Run deterministic local classification, completeness scoring, findings, focused questions, skip controls, assumptions, and baseline confirmation.
4. Open the project in a professional 2D engineering workspace.
5. Draw lines, rectangles, dimensions, and annotations by pointer; select, move, resize, rotate, duplicate, reorder, delete, undo, and redo scene objects.
6. Insert a plan image and edit its size, exact geometry, crop, mirror, opacity, lock state, z-order, and calibrated scale.
7. Open a synchronized Three.js digital twin with orbit, pan, zoom, standard views, fit, explode, section clipping, selection, grid, and labels.
8. Recalculate hydraulic, electrical, structural, and HVAC review panels from editable inputs with visible formulas, limits, and evidence notes.
9. Edit a project BOM, compare warehouse availability, identify shortages, and prepare project-coded procurement requests.
10. Review and optimize a working AI Gantt schedule while preserving approval gates.
11. Ask Nexi contextual questions that route to the relevant engineering workbench.
12. Preview a supervised DN50-to-DN65 change with before/after impact, evidence, confidence, risk, and required approval; apply it as a new revision or cancel it.
13. Save the project locally, restore it on reload, compare revisions, record audit events, and preserve old versions.
14. Resolve findings and use a controlled approval gate that cannot bypass an unresolved critical engineering issue.
15. Export HNX/JSON project state, SVG drawing, DXF geometry, CSV BOM, and a controlled print/PDF layout.

## What developers must connect for production

The review file deliberately does not pretend that browser-only fixtures are production services. Developers must implement and validate:

- Existing EIOS identity, MFA, tenant isolation, least-privilege roles, project scopes, and time-limited guest access.
- PostgreSQL project/revision/audit repositories and encrypted object storage for source files, images, CAD, and models.
- Malware scanning, file limits, durable jobs, OCR, vector extraction, and licensed DWG/IFC/BIM conversion.
- Schema-validated Nexi orchestration using approved models, engineering tools, evidence retrieval, standards licensing, prompt-injection controls, and human authority policy.
- Qualified discipline calculation engines and golden-file validation for each supported engineering domain.
- Real warehouse reservations, procurement requests, supplier quotations, finance thresholds, and President exception approval.
- Real-time collaboration, branches, comments, check-in/out, comparison, and authorized merge.
- Branded PDF/Excel deliverables, electronic signatures, QR verification, external-share controls, and immutable issued packages.
- EIOS tasks, calendar, Executive Assistant, email, WhatsApp/SMS, reporting, notification, and durable outbox integrations.
- Security, privacy, retention, backup, disaster recovery, monitoring, rollback, and release-governance acceptance.

## Review demonstration

For the strongest walkthrough:

1. Select **New project**.
2. Complete identity and discipline fields, then upload a PNG/JPG plan.
3. Review Nexi findings and answer or skip intake questions.
4. Enter the studio and test image resize/rotation plus pointer-drawn geometry.
5. Ask: **“Preview the DN65 hydraulic change.”**
6. Inspect the governed change preview and apply it as a new revision.
7. Open **3D Twin**, **Calculations**, **BOM & Cost**, **AI Gantt**, and **Review**.
8. Resolve the critical finding, submit the controlled revision, compare versions, and export SVG, DXF, CSV, and print/PDF.

## Automated validation

- TypeScript strict compilation: passed.
- Vite production build: passed.
- Frontend unit and workflow tests: 9 passed.
- The final single-file package must additionally pass embedded-source hash, ZIP integrity, external-reference, and initialization checks before delivery.

