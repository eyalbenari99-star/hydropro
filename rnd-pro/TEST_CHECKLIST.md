# Test checklist — acceptance criteria 14.1 – 14.18

This is the minimum manual + automated test pass before retiring the legacy
R&D IIFE. Each row maps to a criterion in section 14 of the design audit.

| # | Criterion | Manual test | Automated test |
|---|---|---|---|
| **14.1** | R&D module is a separate file | `ls frontend/dist/rnd-bundle.js` exists after `npm run build`. | — |
| **14.2** | Every public `window.RND.*` works | In legacy host console, call `window.RND.open()`, `openItem(id)`, `newBoard()` — modal mounts. | — |
| **14.3** | Health log present | `curl http://localhost:8001/api/rnd/health` returns `{ok:true}`. | `tests/test_acceptance.py::test_14_3_health_endpoint_returns_ok` |
| **14.4** | Existing items load without error | After migration, the Library lists every previously-saved board. | `test_14_4_can_list_items` + `__tests__/renderCabinetV2.test.ts` |
| **14.5** | CRUD + snapshots + cloud sync | Create item, save, snapshot, restore, check sync worker received POST. | — |
| **14.6** | AI Apply on IN-1-01 markdown produces populated cabinet | Paste full IN-1-01 spec → cabinet renders with ≥30 devices. | `test_14_6_parse_in101_markdown_yields_populated_cabinet` |
| **14.7** | Asset DB opens, lists ≥50 default symbols | 📚 Asset DB → catalog shows symbols across electrical/plumbing. | `test_14_7_assets_db_seeded_with_50_plus_symbols` |
| **14.8** | Asset DB ≥1000 items without quota | Run `scripts/seed_assets.py` to insert 1000 rows, confirm via `/api/rnd/assets` returns them. | — |
| **14.9** | 🧊 3D view opens populated cabinet | Click 3D view button on populated board → Three.js scene renders. | — |
| **14.10** | 🎨 AI render produces image | Trigger AI render → DALL-E image URL stored on board. | — |
| **14.11** | 📄 Panel PDF matches aba_all.py output | Generate PDF, diff against reference PDF in `tests/fixtures/`. | `test_14_11_render_png_produces_non_trivial_image` |
| **14.12** | 📐 Export DXF opens in AutoCAD | Download DXF, open in AutoCAD/LibreCAD — outline + sections visible. | `test_14_12_export_dxf_is_valid_r2000` |
| **14.13** | 📥 Import spec routes to deterministic parser when patterns recognised | Drop PDF with `NXB-63` text → returns `format: 'flat'`, cabinet build succeeds. | — |
| **14.14** | Warning banner within 1 s for empty-shell cabinets | Open cabinet with empty `items` → red banner appears < 1 s. | E2E test (Playwright) recommended. |
| **14.15** | Reference Suite at `/reference` with ≥6 categories | Navigate to `/reference` → 6 tiles visible. | — |
| **14.16** | No `str.replace('</body>', …)` anywhere | `grep -r "replace('</body>'" src/ backend/` returns nothing in non-quarantine files. | `test_14_16_no_body_replace_pattern_in_codebase` |
| **14.17** | Edits tracked in Git | `git log --oneline` shows reviewable history. | — |
| **14.18** | First paint under 300 ms | Chrome DevTools → Performance recording → FCP < 300 ms. | Lighthouse CI in pipeline. |

## Running

```sh
# Backend
cd backend && pytest -v

# Frontend
cd frontend && npm test
```

Skipped tests carry `TODO(14.x)` annotations that tell the developer exactly which port from `aba_all.py` enables them.
