# R&D & PLANNING Module — Design Document

**Codebase:** `/home/user/hydropro/index.html` (single-file app) · **Module version:** `v4.54-rnd` + HNX patch stack v1–v28+ (through ~v49) · **Core IIFE:** lines 175720–178422 (`</script>` at 178424) · **Audience:** developers

---

## 1. Executive Summary

The R&D & PLANNING module ("Stage 1") is a self-contained schematic/design tool embedded in the HydroNexis-AI single-file app: farm staff sketch plumbing, electrical, irrigation, and civil schematics on a canvas board, organize them into subjects and project trees, attach design sheets with a Draft → In review → Approved revision workflow, build catalog-priced BOMs rolled up against project budgets, and export branded PDF/Excel/SVG/DXF deliverables. Its intended users are non-technical field staff (create/submit) and admins (approve/lock/manage), but a missing permission-table entry currently locks out every non-admin by default while a deep link (`switchView('rnd_home')`) bypasses gating entirely. Architecturally it is a 2,700-line core IIFE (registering host view `rnd_home`, persisting to seven cloud-synced `hydroPro_rnd_*` localStorage keys, with R2 cloud storage for scenes/images) buried under ~80 additive "hnx-vNN" monkey-patch IIFEs (lines ~178440–201200) that add electrical-cabinet sheet generation, a Three.js 3D viewer, DXF export, voltage-aware sizing, and — critically — four escalating automatic localStorage "cleanup" reapers. Those reapers (v25–v28) permanently zero out drawing geometry for all but the 2–3 most-recently-updated items on 10–15-minute timers, making the module an active data-loss hazard for any hand-drawn content. The bones are genuinely strong (127-symbol library, status machine with approval snapshots, BOM/budget rollups, working R2 scene versioning); the current state is undermined by the destructive trimmers, a silently-dead sync push hook, the unwired permissions, a stub task-linking API with zero external callers, and an untestable patch-on-patch code organization.

---

## 2. Current Architecture

### 2.1 Module Boundaries & Registration

| Aspect | Detail |
|---|---|
| Core IIFE | Lines 175720–178422, single `<script>`, versioned `'v4.54-rnd'`, double-load guard `window.__RND_LOADED`, everything try/catch-wrapped (never throws into host) |
| Host hooks | `MODULES`, `switchModule`, `__hnxApi`, `getCurrentUserLevel`, `isAdmin`, `getCurrentUser`, `showToast` |
| Registration | Host registers `MODULES.rnd` early at line 21772; byte-identical fallback in module `register()` at 178365: `{icon:'📐', name:'R&D & PLANNING', views:[{id:'rnd_home', label:'📐 R&D & Planning', perm:null, title:'R&D & Planning'}]}` |
| Boot | `boot()`/`tryInit()` (178410–178421) poll for host readiness every 150 ms, up to 80 tries; `register()` at 178360, then `buildShell()` |
| Public API | `window.RND` (178373–178407), plus `window.linkRndItemToTask` (177604) and `window.getRndItemsForTask` (177605) |
| Companion scripts (NOT the core) | Lines 178425–178484 "Hi Nexi brain wake animation (v4.23)"; 178486–178622 "Hi-Nexi wake word"; 178625–178873 `nexi_atlas.js` (v5.00); 178875+ New-Board UI overlay v1.0 — start of the HNX patch chain |
| Patch chain | ~80 `hnx-vNN` IIFEs from v1 through v49+ (178875–~201200), each guarded by `window.__hnxNewBoardUI_vN`, each monkey-patching prior globals (`HnxV5.draw`, `HnxV10.specToScene`, …). All overlays gate on `ready()` = `window.RND && typeof window.RND.newBoard === 'function'` (178886, 180019) |

### 2.2 Screens & Navigation Map

**Shell:** `buildShell()` (176916) appends `<div class='view' id='view-rnd_home'>` with header (`📐 R&D & Planning` + offline chip `#rnd-offline`), tab strip `#rnd-tabs`, content pane `#rnd-pane`. Styles injected once by `injectStyles()` (176882, `#rnd-styles`). Router: `go(tab)` (176939) sets `ui.tab`, re-renders, triggers `migrateDirty()`; `renderPane()` (176940) dispatches. UI state singleton (176875): `ui = {tab:'dashboard', aPage:0, showTrash:false, filter:{subject:'all', project:'all', type:'all', status:'all', q:''}}`.

**Six tabs** (`TABS` array, 176933):

| Tab | Renderer | Contents |
|---|---|---|
| 📊 Dashboard | `renderDashboard` (176953) | Quick actions (+ New Schematic / ✨ Describe → Generate / ⬆ Import); subject tile grid with per-subject counts (click → `openSubject` 176981); 3 KPI cards (Total schematics / Linked to tasks / In review); Design Health block (`designHealthData` 177269: status tiles, by-type table, "Needs attention" list); Recent 8 cards |
| 🗂 Library | `renderLibrary` (176999) | Filter row (subject / project / type all·quick_board·ai_generated·imported / status / free-text over title, description, tags, ds.type, drawingNo, client, params, BOM lines); Trash toggle (`toggleTrash` 177252); 🧾 Audit button (177019); ⬇ Excel (`exportModuleXlsx`); + New; card grid via `cardHTML` (176986) — thumb or `miniDiagram` SVG (177939), badges, v-number, param/BOM/rev/link chips, lock badge, buttons Open / 📐 Sheet / 🧾 BOM / ⋯ (`itemMenu` 177203: Open, Rename, Duplicate, Attach files, Generate CAD/3D, Export PNG/SVG, Design sheet, BOM, Branded PDF, BOM Excel, Approval snapshots, Version history, Link to planning task, attachments, admin Delete) |
| ✨ Create | `renderCreate` (177610) | 5 method tiles: Quick Board, Describe → Generate (guided Q&A), Import PDF spec, Import file, disabled "Diagram (draw.io)" Stage-2 teaser (`stageTwo` 177620 just toasts) |
| 🧰 Assets | `renderAssets` (177847) | Searchable, subject-filterable, paginated (24/page, `pagerHTML` 177839) asset card grid; Where-used / admin Specs / admin Del |
| 📁 Subjects & Projects | `renderSubjects` (177730) | Subject cards (admin rename/del only for `isCustom`); project tree cards with code/status/lock/phase/file/BOM-vs-budget chips; View items / 📎 Attach / + Sub / admin ₱ Budget / admin 🔒 Lock / admin Del |
| ⚙ Settings | `renderSettings` (177821) | `#rnd-set-grid` grid-spacing number input + static "What's live in Stage 1" checklist; `saveSettings` (177834) |

**Board (not a tab):** wide modal via `openBoardModal` (177999) — zoom/Fit/Snap/undo/redo/Save/close header; 10-tool left rail (select ✥, pen, eraser, line, arrow, rect, ellipse, text T, dim ⇔, pan ✋ + color/width inputs); `<canvas id='rnd-canvas'>`; layer selector (annotations/symbols/background); BG selector (grid/dotted/blank/image); AI instruction row (✨ Apply / ⚡ Offline / 🧪 Fertigation / 🎤 Speak / ⤢ Expand); right aside with collapsible symbol palette (5 categories, live search `#rnd-sym-search`) plus per-subject asset bank panel (`boardAssetsHTML` 177866). All modals go through `openModal`/`closeModal` (178337/178338, `#rnd-modal` overlay).

**Navigation surfaces into the module** (see §4 for wiring): left sidebar (order[] 21797), Modules dropdown "Operations" group (133231), rail (211354), rail flyout (212043–212198, registry fallback 212080), Cmd+K search (via `NEXI_NAV` rebuild 173153–173184 — the hard-coded seed at 173148 lacks rnd), voice (`RND.handleVoiceCommand` 178343, matches `/r&d|r and d|planning module|schematic/`), and `open()` fallback (178356) which directly activates `#view-rnd_home`.

**HNX toolbar surfaces:** `#hnx-v4-toolbar` "HNX R&D TOOLS" side panel (built at 180309: New design / IN-1-01 sample / 3D view / DXF / BG image / Export menu / Help), extended by v12 🩺 Diagnose (184038), v22 🕐 Recent (187084), v24 💾 Save .json / 📂 Load .json / 📊 Stats (187569–187603), v25 🗄 Storage (187927), v26 🧹 Clean now (188208), v27 🔥 Deep clean (188531). Board bottom toolbar: v9 📥 Draw cabinet `#hnx-v9-draw-btn` (182388), v11 "Draw sheet" select `#hnx-v11-sheets` (183745), v14 "Switch sheet" `#hnx-v14-switch` (184675), v17 📑 BOM export `#hnx-v17-bom` (185929, v20 xlsx upgrade 186658). All hidden outside R&D by the v8 CSS gate (`body[data-hnx-rnd-active]`, 182053–182177).

### 2.3 Data Model — Storage Keys

**Load/save layer:** key constants at 175743–175745 (+ `K_AUDIT` at 177248). `load(k,def)` (175746) JSON.parses with default; `save(k,v)` (175747–175776) stringifies, on success calls `window.__hnxSyncPushSoon()` (which is **never defined** — see §3.3), and on `QuotaExceededError` runs a 3-step recovery: (1) delete `hydroPro_rnd_items_v1_backup` + `_backup_meta` (v75 auto-backup, 175757) and retry; (2) if `k===K_ITEMS`, strip any `item.thumb` that is a `data:` URL (175760–175772) and retry; (3) toast "⚠ Storage FULL — save aborted. Run HnxData.export()…".

#### `hydroPro_rnd_subjects_v1` (K_SUBJ)

Array of subject records. Seeded lazily by `subjects()` (175785) from `DEFAULT_SUBJECTS` (175778–175784): plumbing 🚰 #4dd0e1, electrical ⚡ #ffca28, irrigation 💧 #26c6da, machines ("Machines/Equipment") ⚙️ #90a4ae, buildings ("Buildings/Civil") 🏗️ #a1887f, order 1–5.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Seed ids fixed; custom via `uid('subj')` |
| `name` | string | `renameSubject` (177743) mutates only this |
| `icon` | string | Custom default `'📐'` |
| `color` | string | Custom default GOLD `'#C9A227'` |
| `order` | int | `arr.length+1` for custom |
| `isCustom` | bool | Seeds `false` |
| `createdBy`, `createdAt` | string | Custom only (`addSubject` 177742) |

`delSubject` (177744, admin-only) filters by id; items keep `subjectId` but lose the folder. `subjectById` (175789) falls back to `{name:'—', icon:'📐', color:'#9e9e9e'}`.

#### `hydroPro_rnd_projects_v1` (K_PROJ)

Array of project records forming an arbitrary-depth tree (phases = child projects). Created by `addProject` (177745) and `newItemMeta`'s `_mkNewProj` (177632); sub-projects via `addSubProject` (177776) / `_mkNewSub` (177633).

| Field | Type | Notes |
|---|---|---|
| `id` | string | `uid('prj')` |
| `name` | string | |
| `code` | string? | Prompted, optional |
| `status` | string | `'Active'` on create |
| `parentId` | string? | Present on sub-projects/phases |
| `budget` | number\|null | `projSetBudget` (177750), admin-only, audited |
| `lockLevel` | `'none'`\|`'design_locked'`\|`'frozen'` | Cycled by `projLock` (177756), admin-only, audited; **inherited down** the tree via `projLockOf` (177253, walks UP the parent chain, cycle-safe) |
| `files[]` | array | `attachProjectFile` (177784): `{name, key (raw R2 key 'rnd/projects/<projId>/…'), type, size, at, by}`, ≤25 MB via `r2PutRaw`; `dlProjFile` (177802); `delProjFile` (177811, admin-only) |
| `createdBy`, `createdAt`, `updatedAt` | | |

Tree render: `projTreeHTML` (177751); children: `projChildren` (177748); cascade delete: `_collectSubtree` (177777) via `delProject` (177746) — **removes project records only; items are neither deleted nor reassigned** (dangling `projectId`). `projBomTotal` (177749) sums `qty*unitPrice` across non-deleted items in the subtree; over/left chips at 177762–177763. `openProject` (177747) just sets the library filter.

#### `hydroPro_rnd_items_v1` (K_ITEMS) — the design records

Canonical creation shape, `baseItem(meta,type)` (177721–177725):

| Field | Type / shape | Notes |
|---|---|---|
| `id` | `uid('rnd')` | |
| `subjectId` | string | Required |
| `projectId` | string\|null | "— none —" allowed (`newItemMeta` 177623, nested picker `projOptionsNested` 177622) |
| `title`, `description` | string | |
| `type` | `'quick_board'`\|`'ai_generated'`\|`'imported'` | |
| `status` | `'Draft'`\|`'In review'`\|`'Approved'`\|`'Archived'` | `statusItem` (177272) prompt-based setter; admin gate on Approved/Archived |
| `ds` | object | Design sheet: `{type, params[], designer, checker, approver, submittedBy, submittedAt, approvedBy, approvedAt, rev:'A', notes}`; later gains `client`, `drawingNo`, `sops:[sopId]`, `snapshots:[{rev,at,by,params,bom,warnings}]` (cap 50, `dsApprove` 177335). Normalized by `getDs` (177287) |
| `tags` | string[] | |
| `scene` | object\|null | **Stripped from localStorage by `putItem`** — see persistence rule below |
| `spec` | object\|null | AI/guided spec (§2.7) |
| `sceneKey` | string\|null | R2 key `'rnd/scene/<id>/v<version>.json'` (`persistScene` 176077) |
| `thumb` | string\|null | `r2img:` pointer online, JPEG dataURL offline (`boardSave` 178301–178327) |
| `exportPng`, `exportKey` | | `exportKey` = `r2img:` pointer to full PNG |
| `version` | int | Starts 1 |
| `revisions[]` | array | `{version, ts, by, kind:'manual', comment, thumb, sceneKey\|null}` (`pushRevision` 177563, **cap 40**; `metaCopy` re-maps at 177232) |
| `bom` | object | `{lines:[{assetId, itemCode, name, spec, uom (def 'pc'), qty (def 1), unitPrice (''\|number), remarks}], updatedBy, updatedAt}` — `bomCommit` 177425, normalized `getBom` 177372 |
| `attachments[]` | array | `{id:uid('att'), name, type, key, at}` (`importFlow` 177646 for PDFs, `attachMoreFiles` 177031) |
| `aiMeta` | object | `{generated, engine:'guided'\|'guided-cabinet'\|'guided-plan'\|…}` (`_gGen` 177705) |
| `cad` | object | `{generatedAt, urls, warnings, log}` (`generateCad` 177134 / `_cadPoll` 177102) |
| `linkedTasks[]` | array | `{moduleId, taskId, ts}` (`linkItem` 177596) |
| `deletedAt`, `deletedBy` | | Soft delete (`delItem` 177250) |
| `_dirty` | bool | Offline flag (scene not yet in R2) |
| `hnxCabinetSpec`, `hnxSheetNum` | | **Non-core**, stamped by HNX v6 `patchV5` (181452–181479); the regenerability key for trimmed sheets |
| `createdBy/At`, `updatedBy/At` | | |

**Persistence rule:** `putItem` (177234) stores `metaCopy()` (177231), which **strips `scene` and `__img`** — the full drawing lives in R2 under `sceneKey`; the scene is kept inline only as an offline fallback (`rec.scene` + `rec._dirty=true` when no sceneKey, 177235). `migrateDirty()` (176083) opportunistically uploads and nulls local scenes. **The HNX patch layers bypass this rule** with raw `localStorage.setItem` of full inline scenes (§3.2).

#### `hydroPro_rnd_settings_v1` (K_SET)

Single object, default `{defaultBoardMode:'quick', gridSpacing:40}` (`settings()` 175788). Only `gridSpacing` is editable (`renderSettings` 177821 / `saveSettings` 177834, must be > 0); it feeds `blankScene()` (177880) and the board BG selector (`_setBg`, ~178385). `defaultBoardMode` is defined but **never read** anywhere.

#### `hydroPro_rnd_assets_v1` (K_ASSET)

Array of asset records, two kinds:

| Field | Seeded symbol (`seedAssets` 175968) | Admin upload (`addAssetUpload` 177864 / `addAssetSvg` 177865 / `_addBoardImage` 178405) |
|---|---|---|
| `id` | `'seed_<category>_<index>'` | `uid('asset')` |
| `subjectId` | via `SEED_SUBJ_MAP` (175967): plumbing→plumbing, electrical→electrical, irrigation→irrigation, panel→electrical, fixtures→electrical | picked / board's subjectId |
| `name` | symbol name | user-supplied |
| `kind` | `'symbol_vector'` | `'photo'` (upload) or `'symbol_vector'` (pasted SVG) |
| `svg` / `src` | inline SVG string | `src:'r2img:<key>'` pointer / `svg` |
| `isSystemDefault` | `true` | `false` |
| `createdBy/At` | `createdAt` | both |

**Seed versioning:** `assetsAll()` (175964–175966) writes companion key `hydroPro_rnd_assets_seedver` = **5**; if stored seedver ≠ 5 it keeps only `!isSystemDefault` records, prepends fresh `seedAssets()`, re-saves — built-ins re-seed on bump, custom assets survive. `putAsset` (175970) upserts by id; `delAsset` (175971) admin-only + confirm; built-ins show a "built-in" chip instead of Del (`renderAssets` 177861).

#### `hydroPro_rnd_catalog_v1` (K_CAT)

**Dictionary (object, not array)** keyed by asset id; `catalog()` (176009) = `load(K_CAT,{})`.

| Field | Notes |
|---|---|
| `itemCode`, `desc`, `specs`, `uom`, `unitPrice` (number or raw string, `''` allowed), `mfr`, `model` | Admin overrides via `catSet(id,fields)` (176012, admin-only, stamps `updatedBy:who()` / `updatedAt:now()`) |

Effective resolution `catEffective(a)` (176011), 3-level precedence: per-asset override → `CAT_DEFAULTS[a.name]` (33-entry hardcoded map at 175974–176008 keyed by symbol name, e.g. `'Pump':{itemCode:'PL-PUMP', uom:'pc', specs:'Centrifugal water pump'}`, `'MCB'→'EL-MCB'`, `'VFD'→'EL-VFD'`, `'Ceiling light'→'FX-CL'`) → `autoCode(a)` (176010): `'<prefix>-<NAME-SLUG≤10>'` with prefix map `{plumbing:'PL', electrical:'EL', panel:'EL', fixtures:'FX', irrigation:'IR', machines:'MC', buildings:'CV', default 'GN'}`. Edited via `editCatalog`/`saveCatalog` modal (176013/176031, admin-only; others get "Admin only — specs are view-only"). Consumed by BOM pickers (`bomPickAdd` 177428), asset cards, where-used (`itemUsage` 177262, matches by assetId OR itemCode), the module Excel export "Catalog" sheet (177476–177478), and `aiProposeBom`'s catalog context (177538).

#### `hydroPro_rnd_audit_v1` (K_AUDIT, declared 177248)

Append-only array capped at **500** events. `audit(action, entity, id, detail)` (177249) pushes `{ts:now() ISO, by:who() (175738), action, entity, id, detail}`. Exact call sites:

| Call site | (action, entity) |
|---|---|
| `delItem` 177250 | `('purge','design', title)` on permanent delete; `('soft-delete','design', title)` on trash |
| `restoreItem` 177251 | `('restore','design')` |
| `projLock` 177256 | `('lock','project', name+' → '+newLevel)` |
| `dsSubmit` 177333 | `('submit','design')` |
| `dsApprove` 177335 | `('approve','design','Rev X')` |
| `dsRevise` 177336 | `('revise','design','Rev X')` |
| `projSetBudget` 177750 | `('budget','project','name = value')` |

Viewer: `openAuditLog` (177258), from Library 🧾 button (177019); newest-first, renders max **200** of the 500 rows, modal "AUDIT LOG (R&D)". **Ordinary edits/saves (boardSave, BOM, design-sheet, renames) are NOT audited** — only the seven actions above.

#### Auxiliary keys

| Key | Purpose |
|---|---|
| `hydroPro_rnd_assets_seedver` | Seed version int (=5), 175964–175965 |
| `hydroPro_rnd_items_v1_backup` / `_backup_meta` | v75 30 s auto-backup (200079–200121) — doubles items footprint; first sacrifice of quota recovery (175757) |
| `hnx_cloud_token` (host, read-only) | R2 auth (`r2Token` 176043; `aiReachable` 176283) |

### 2.4 Drawing Engine

**Scene shape** (`blankScene` 177880): `{w:1600, h:1000, bg:{type:'grid'|'dotted'|'blank'|'image', grid:<px>, imageKey?:'r2img:…'}, objects:[]}`. HNX v5+ uses defaults `w:2400, h:3600, bg:{type:'grid',grid:40}` (180592–180594) and mm→canvas mapping `SCALE=1.5, OX=40, OY=60` (`specToSceneObjects` 180487). Object ids: `'o_'+Math.random().toString(36).slice(2,10)` (180493).

**Object kinds** (created in `onDown`/`onMove`/`onUp` 178094–178157, `addObj` 178159):

| Kind | Shape |
|---|---|
| `path` | `{kind:'path', layer, stroke, width, points:[{x,y,p}]}` (pen with pressure) |
| `line` / `arrow` | `{x1,y1,x2,y2,stroke,width}`; Shift = orthogonal lock (178133) |
| `rect` / `ellipse` | `{x,y,w,h,stroke,width,fill:'none'}` |
| `text` | `{x,y,text,size,color}` |
| `symbol` | `{kind:'symbol', layer, x, y, w:80, h:80, rot:0, svg, name}` — **full inline SVG per placement** (onDown 178106) |
| `img` | `{x,y,w,h,src,name}` — `src` may be `r2img:` pointer, 120×120 default from asset bank |
| dim tool | Emits arrow + editable text label pair (178108–178119) |

⚠ **Schema split:** the core renderer reads `o.kind`; HNX v5 wrote `o.type` (`'rect'`/`'text'`) — v9 (182179–182482) exists solely to fix that mismatch. Both schemas persist in stored data.

**Layers:** background / symbols / annotations, fixed z-order (`draw` 178182). **Board controller state** (178058–178064): `tool`, `color '#1F4D2C'`, `width`, `layer`, `view {scale, ox, oy}`, `sel`, `undoStack`/`redoStack` (full `JSON.stringify(board.scene.objects)` snapshots per step — RND._undo/_redo 178389–178390), `pendingSym`/`pendingAsset`, `snapToGrid` (default true), palm rejection via `activePen` pointer id (178097). Zoom: `RND._zoom(d)` (178391) — `d===0` fits (`scale = min(canvas.w/scene.w, canvas.h/scene.h)`, origin 10,10), else ×1.15 / ×0.87. Shortcuts (Help modal `openHelp` 179211, list 179240–179245): Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Delete, `0` fit, Ctrl/Cmd+S.

**Save path** (`boardSave` 178301–178327): renders full PNG + 320 px JPEG thumb; when online (`r2Ready` = `hnx_cloud_token` present + `navigator.onLine`) uploads PNG→`exportKey`, thumb→`thumb` (r2img pointers), calls `pushRevision()`, uploads scene JSON to `'rnd/scene/<id>/v<version>.json'` → `sceneKey`, drops local scene ("Saved v# ☁ cloud"); offline keeps dataURL thumb, sets `_dirty`, stores scene inline until `migrateDirty()` (176083). **`boardSave` does NOT call `ensureEditable`** — a project lock does not block canvas saves (unlike `dsCommit` 177328 and `bomCommit` 177425).

**Versioning:** `versionsItem`/`restoreRev` (177551/177555) restore by revision `sceneKey` (cloud) or legacy embedded `r.scene`; every save/restore appends a revision (cap 40).

**R2 plumbing:** `R2_WORKER = 'https://hnx-sync.eyalbenari99.workers.dev'` (176042); `POST /r2/upload?key=…`, `GET /r2/file?key=…`, Bearer `hnx_cloud_token`. Images use the `r2img:<key>` pointer convention shared with `hnx_photovault`; JSON scenes/attachments use raw keys so the image rehydrator ignores them (comment 176038–176041; `r2PutRaw`/`r2PutJson`/`r2GetJson` 176074–176076). `r2Url()` (176056) resolves pointers with object-URL cache `_r2cache` (reuses `window.hnxPhotoVault._cache`).

**Exports:** `exportPng` (177565), `exportSvg` (177573, `sceneToSvg` — "opens in Illustrator, Inkscape, AutoCAD"), `exportDesignPdf` (177507, print-window HTML with logo/title block/params/SOPs/BOM/approval table), `exportBomXlsx` (177495), `exportModuleXlsx` (177464, sheets: Designs / BOM lines / Catalog / Summary, `window.XLSX` via `ensureXLSX`), `brandBlock` (177493, drawingNo default `'<projectCode||HNX>-<last4 of item id>'`). HNX adds: hand-written DXF R12 (`exportDXF` 179775 / `buildDXF` 179787: `$ACADVER AC1009`, 1 unit = 1 mm, layers ENCLOSURE/BREAKER/CONTACTOR/OVERLOAD/CONTROL/METER/CT/LABEL/DEVICE at 179810–179820, rects as 4 LINE entities `rect()` 179826, TEXT via `text()` 179838, `downloadBlob` 179462); export menu popup `openExportMenu` (179933, routes 179954–179967); 3D snapshot via `canvas.toDataURL('image/png')` (179715–179725, 181157–181165). Print = PDF export.

**AI/CAD pipeline:** `createMethod(m)` (177636) routes: `'quick'` → `newBoard` (177970; auto-builds fertigation layout via `buildFertigationScene` if title matches `/fertigation|fismart|dosing/`, 177973–177988); `'import'` → `importFlow` (177646: R2 upload; PDFs→attachments, images→`scene.bg={type:'image',imageKey}`); `'ai'` → `aiFlow` (177664: free-text + voice `startVoice` 176817, ✨ `_aiGen` / ⚡ `_aiGenOffline` / 🧪 fertigation form, plus tap-to-answer `GUIDED` per-subject question sets 176091–176135; `_gGen` 177705 builds deterministic scenes via `guidedToSpec`→`renderSpec`, or `renderCabinet`/`renderPlan`); `'pdfspec'` → `window.RND_importPdfSpec`. Spec model (documented 176146): `{title, size, subtitle, nodes:[{id,label,sym,role:'source'|'inline'|'dest'}], edges:[{from,to,size,via:[sym]}]}`; `aiBuildSpec` (176289, `__hnxApi('/ai/analyze')`, 30 s timeout, `parseLooseJson` 176284) may return richer v1 spec `{version,title,subject,units,nodes[kind,symbol,role,spec],edges[type,size,material,via,designation],layout2D,layout3D}` or up to 4 follow-ups; symbols constrained to `AI_SYMS` (176288, 58 names). `renderSpec` (176147) lays sources→trunk→inline→riser→destinations with labeled pipe sizes. `generateCad` (177134) POSTs `{spec, meta, options:{outputs:['dwg','dxf','pdf','gltf'], pageSize:'A3', scale:'1:50', …}}` to `__hnxApi('/cad/generate')`, accepts 4 response shapes (`_cadPickUrls` 177087), polls every 2 s up to 5 min (`_cadPoll` 177102), stores `it.cad`. `aiProposeBom` (177537) POSTs catalog-code context to `/ai/analyze`, parses loose JSON `{lines:[…]}`, marks remarks "AI suggested".

**HNX drawing pipeline (v9–v17):** v10 (182484–183095) engineer-grade IEC 60617 submittal sheet — SVG symbol generators (MCB/MCCB/contactor/overload/meter/CT/motor/SPD/PLC/relay/PSU/terminal, 182512–182673), sheet border + reference grid, front elevation, DIN rails, panel schedule, legend, title block; **REPLACES `scene.objects`** (183056–183057). v11 (183098–183819): Sheet 2 SLD (`buildSLD` 183124), Sheet 3 Control Wiring ladder (`buildControl` 183265), Sheet 4 Terminal Block (`buildTerminals` 183396), Sheet 5 Panel Internals (`buildInternals` 183513). v17 Sheet 6 Cross-Section (185845–185895), device click-to-details, SLD IEC 60446 wire-color legend. v13 (184193–184631): critical draw-timing fix — closeModal FIRST, wait 350 ms for host boardSave's empty-state write, THEN write objects and reopen (184457–184511); reroutes all older draw paths to `drawV13` (184517–184549). v14 (184633–184898): Switch-sheet dropdown (recovery path), 1.5× symbols, **local Data-URL background fallback replacing R2 upload** (184764–184857, embed at 184829). v16 visual depth + brand labels (CHINT/ABB/SCHNEIDER). v7 sizing math (181559–182051): `flaFromKw` (181583: 3×400V ≈ 1.80×kW, 3×230V ≈ 3.13×kW, 1×230V ≈ 5.43×kW, 1×115V ≈ 10.87×kW via P/(√3·V·0.80)), `standardBreakerAbove` (181593, ratings 6–63), `jr36Range` (181598), `nxcByKw` (181616, CHINT frames), `feederSize` (181628, breaker = FLA×2.5 per NEC 430.52), `parseFeedersText` (181650), wizard `openMyPlan` (181785), `drawAndShow` chain RND.newBoard → HnxV5.draw → HnxV6.open3D (181882), MutationObserver interceptors (181911, 181969). 3D: v2 `open3DViewer` (179546, Three.js r128 lazy-load 179372, presets 179649, wireframe 179702, orbit 179667–179698) upgraded by v6 `open3DDetailed` (181015) with per-device meshes (`buildDeviceMesh` 180768: breaker 180802, MCCB 180821, contactor 180837, overload 180858, meter 180882, CT 180901, relay 180918, PLC 180935, PSU 180956, terminals 180977, SPD 180994). Templates: hardcoded `in101Spec()` "ABA PARDES IN-1-01 Main Distribution Cabinet" (duplicated at 179474 and 180448: 1200×2200×600 mm enclosure, ~35 devices), parametric `autoLayoutCabinet` (181335) and voltage-aware `autoLayout` (181674). v3 client-side parsing (180048–180245): PDF.js 3.11.174 / SheetJS / mammoth from CDN (`lazyScript` 180064), `parsePdf` 180108, `parseXlsx` 180135, `parseDocx` 180155, dispatcher `parseFile` 180168 → `window.HnxParseFile` (180179), MutationObserver patch of the spec-import modal (`attachSpecPatch` 180188).

### 2.5 Symbol Library & Asset Bank

`SYMBOLS` (175794): category → array of `{n:name, s:'<svg…>'}`, 100×100 viewBox inline SVG with painterly gradients. Base set: plumbing 14, electrical 7, irrigation 6, panel 11, fixtures 13. Expansion IIFE (175868–175959, gradient ids `nx1..nx75`): +16 plumbing, +16 electrical, +16 irrigation, +14 panel, +14 fixtures. **Totals: 127 symbols — plumbing 30, electrical 23, irrigation 22, panel 25, fixtures 27.**

`SYM_BY_NAME` (175961) flattens all categories to a name→svg lookup — **duplicate names (Filter, Manifold, Venturi injector…) collapse, last category wins** — used by guided/AI/offline scene builders (`symObj` 176138). Board palette (178000–178011) lists 5 categories with counts and per-name search. AI generation is constrained to `AI_SYMS` (176288, 58 names).

**Asset bank** = persisted, user-extensible mirror of SYMBOLS plus admin photo uploads (see K_ASSET above). Placement: (a) palette → `_pickSym(cat,ix)` (178386) sets `board.pendingSym`, next tap stamps 80×80 symbol; (b) asset panel → `_pickAsset(id)` (178404): `symbol_vector` → same as palette; `photo` → `{kind:'img', src:'r2img:…'}` at 120×120. Board panel filters to the item's subjectId (`boardAssetsHTML` 177866). Where-used: `itemUsage(assetId)` (177262) matches BOM lines by assetId or effective itemCode, sums qty/₱ per design; `openWhereUsed` (177264) with `closeModalThenSheet` (177263).

### 2.6 Permissions

Two-tier: **admin vs everyone else**. `isAdminLvl()` (175737) = `getCurrentUserLevel() >= 3 || isAdmin()` (defensively probed; failure → non-admin). `who()` (175738) = `getCurrentUser().name||id` else `'user'`. **No per-user ownership anywhere** — any user edits any unlocked item.

| Admin-only (explicit `isAdminLvl()` guard + toast) | Line |
|---|---|
| `delAsset` | 175971 |
| `catSet`/`editCatalog`/`saveCatalog` | 176012–176031 |
| `delItem` (soft-delete AND purge) | 177250 |
| `restoreItem` | 177251 |
| `projLock` | 177256 |
| `statusItem` → Approved/Archived | 177272 |
| `dsApprove` | 177335 |
| SOP link/unlink buttons (render-gated) | 177363–177365 |
| `addSubject` / `delSubject` | 177742 / 177744 (`renameSubject` 177743 has NO code guard; button renders only for admin && isCustom, 177734) |
| `delProject` | 177746 |
| `projSetBudget` | 177750 |
| `delProjFile` | 177811 |
| `addAssetUpload` / `addAssetSvg` / `_addBoardImage` | 177864 / 177865 / 178405 |

Non-admins can: create/edit/rename/duplicate items, `dsSubmit`, back-to-draft, revise, edit BOMs, create projects/sub-projects (`addProject`/`addSubProject` unguarded), attach project files, set status Draft/In review.

**Lock enforcement:** `ensureEditable(it)` (177255) — admins always pass; others blocked when `isItemLocked(it)` (177254, via inherited `projLockOf`). Enforced at `dsCommit` (177328) and `bomCommit` (177425) **only** — `boardSave` (178301) skips it, so a `frozen` project's drawings can still be redrawn by anyone.

**Host-level wiring is broken** (see §3.4): view registered `perm:null` (21772, 178365); no `rnd_home` row in switchView guards (21883–21903); no `'rnd'` row in `moduleToRolePerm` (57927–57948) → `defaultModuleAccessForRole` returns `'none'` (57950) for every non-admin role; `'rnd'` absent from `DEPARTMENT_OPTIONS` (57917) so the home-department auto-Edit path (57984–57986) can never grant it. Module gate: `switchModule` → `moduleHasAccess` (21410–21422) → `canView('rnd')` (58013) → `getEffectiveModuleAccess` (57972). But `switchView('rnd_home')` is never checked (denial only fires for listed views, 21904) and switchView's module-sync (21912–21919) sets `currentModule` without a `moduleHasAccess` check.

### 2.7 Design Sheet Workflow

`DESIGN_TYPES` (177275–177285): 9 types with parameter templates — `gravity_drain_floor`, `irrigation_room`, `nft_loop`, `ventilation`, `cooling_pad`, `electrical_distribution`, `roof_cladding`, plus `''` and `'other'`; `dsSetType` (177330) merges missing template rows. `DTYPE_RANGES` (177290–177298): typical min/max per type (e.g. nft_loop Slope 1–3 %, electrical_distribution Voltage 200–480 V), checked by `validateDesignParams` (177299), surfaced in sheet, dashboard health, and approval.

**Status machine:** Draft → `dsSubmit` (177333, stamps `ds.submittedBy/At`, audited) → In review → admin `dsApprove` (177335: warns on out-of-range params, stamps `approvedBy/At`, pushes `ds.snapshots` entry `{rev, at, by, params-copy, bom-copy, warnings}` cap 50, audited) → Approved → `dsRevise` (177336: `rev = nextRev` (177289: A→B…Z→AA, or numeric suffix +1), clears approval/submission stamps, back to Draft, audited); `dsBackToDraft` (177334) from review. `openSnapshots` (177270) lists frozen snapshots. SOPs: `ds.sops` holds ids from host `window.SOP_LIBRARY` (`sopLib` 177310); `sopSuggest` (177313) keyword-matches by design type via `SOP_KW` (177301). Edits buffered in `_dsEdit`, committed by `dsCommit` (177328, enforces `ensureEditable`, stamps `updatedBy/At`). **No notifications on submit; no reject-with-comment; only 7 actions audited.**

**BOM sources** (modal `renderBomModal` 177445): "+ From catalog" (`bomAddFromCatalog`/`renderBomPicker` 177427/177432, `bomPickAdd` 177428 copies `catEffective` values and keeps `assetId`); "+ Manual line" (`bomAddManual` 177379); "🎨 From drawing" (`bomAutoFromScene` 177383: counts `kind:'symbol'` scene objects by name; updates qty on existing same-name lines, else adds with itemCode `'AUTO-<SLUG>'`, remarks "auto-extracted from drawing"); "🤖 AI suggest" (`aiProposeBom` 177537). Totals: `bomLineTotal`/`bomTotal` (177374–177375, ₱).

### 2.8 Sync Behavior

- **Primary sync:** v2.75 worker layer (script 138962, `WORKER hnx-sync.eyalbenari99.workers.dev` 138967, **20 s tick** 138970). `shouldSync` (139014–139023) syncs any `hydroPro_`-prefixed key not in `SKIP_PREFIXES` (138973: session/biometric/audit/rescue/ea-email — **rnd not excluded, and neither are the `_backup` keys**). `collectData` (139219–139231) skips empty values. Pull-merge is generic v12.90 **whole-key newer-wins/deep-union** (merge helpers 139258).
- **Dead push hook:** the module's `save()` calls `window.__hnxSyncPushSoon()` (175751, 175775 — the only two occurrences in the file). **The function is never defined.** All R&D writes ride the 20 s interval only.
- **Legacy Firebase whitelist** `HNX_SYNCED_KEYS` (109650–109663) does NOT include any rnd key.
- **AutoVault** (175449+): IndexedDB offload list (175453–175460) **excludes** rnd keys — R&D stays in localStorage; `lzEligible` (175515–175518) LZ-compresses `hydroPro_rnd_*` values > 120 KB in place unless containing `'data:image/'`.
- **R2:** board scenes, thumbs, exports, project files, attachments bypass localStorage via pointers (note at 177831: "store only a tiny link").
- **v75 auto-backup** (200079–200121): copies `hydroPro_rnd_items_v1` to `_backup` every 30 s — doubling footprint, syncing to cloud, and being the first thing deleted under quota pressure (175757).

---

## 3. Critical Constraints & Known Issues

Blunt summary: **this module actively destroys user data on timers, its "cloud has backups" assumption rests on a sync hook that was never implemented, and every fix must land in a ~80-layer monkey-patch stack with live races and a broken filter.**

### 3.1 localStorage Quota & the Destructive Trimmers (THE issue)

All app data — including every R&D board's full rendered scene — lives in localStorage against an **assumed 10 MB quota** (hardcoded `quotaEstimate = 10*1024*1024` at 187675; perf monitor warns at > 9 MB, 95577; no literal "19MB" constant exists anywhere). Generated engineering sheets write **hundreds-to-thousands of objects** (grid refs, per-terminal table rows, per-device IEC symbol SVG strings embedded as text) and re-serialize the **entire items array** on every draw (183064, 183723, 184491); every draw path has an explicit quota-failure catch (182339–182343, 183064–183065, 183723–183724, 184490–184495, 185080–185087). v14's Data-URL backgrounds (184829) make it worse. The response was four escalating reapers:

| Trimmer | Version | Trigger | Keep window | Strip threshold | Lines |
|---|---|---|---|---|---|
| `shrinkRndItems` | v25.4 | **Manual only** (Storage Manager button 187756; `HnxV25.shrink` 187971) | Top 2 by `updatedAt` | > 50 objects | 187882–187922 (strip 187903–187906) |
| `trimRndItems` | v26.5 | **AUTOMATIC**: every page load +5 s (toast 188193–188196) and silently every 15 min (188201–188203); 🧹 button 188208; `HnxV26.trimRnd` 188245 | Top 5 | > 50 | 188124–188157 (`_stripped` 188146) |
| `trimRndItemsHard` | v27.7 | **AUTOMATIC**: every load +4 s (188519–188523) and every 10 min (188526–188528); 🔥 button 188531; `HnxV27.trimRndHard` 188565 | Top 3 | **> 20** | 188440–188473 (`_stripped` 188462) |
| v28 "NUCLEAR" | v28 | **Synchronous at script parse time** (starts 188575) | **Top 2** | **> 10** | 188766–188797 (`_stripped` 188787) |

Mechanics: for every localStorage key starting `hydroPro_rnd_` containing `items` whose value is an array, sort by `updatedAt` desc, keep the top-N ids, and for every other item over the threshold set `it.scene.objects = []` and `it.scene._stripped = true`, then write back. **Permanent, silent for background runs.** Only items carrying `hnxCabinetSpec` (+ `hnxSheetNum`) can be regenerated via "Switch sheet" (#hnx-v14-switch, 184675–184723) — **hand-drawn boards, pre-HNX boards, and post-generation manual edits are irrecoverably destroyed** (regeneration rebuilds the pristine sheet, discarding edits). The keep window is per-key recency, and draw functions stamp `updatedAt = Date.now()+1` (184486), so **rendering one sheet can evict a colleague's board from the keep set**. `runAggressive` (188478–188517) additionally deletes every local backup key via `deleteOldBackups` (188293–188318): `hydroPro_backup_manual_*`, `hydroPro_backup_*` + `hydroPro_backup_index`, `hydroPro_autobackup_*`, `/_bak_v\d+$/`, `/_backup_v\d+$/`, `hnx_t*_bak*` — on the stated assumption "Cloud has backups, safe to trim" (188258), **which is false in the ≤20 s window because the eager push hook is undefined** (§3.3). v26's `runAutoClean` (188162–188188) also trims `hydroPro_error_log_v1` (100), `hydroPro_audit` (200), `hydroPro_recurring_instances` (90 days), `hydroPro_issues_v2` (open + last 200 closed); v27/v28 tighten all of these further (error 30→20, audit 100→50, recurring 30→14 days, issues 50→open+30, seed studies 50).

**Hard design rule for any new work:** `scene.objects` for anything but the ~2–3 most-recently-updated items must be treated as ephemeral. Any feature storing meaningful user work in `scene.objects` without a regenerable spec **WILL lose data**; any feature growing localStorage must account for the reapers.

**Aggravating factors:** trims do **not** exempt `_dirty` (offline-only) scenes — an offline drawing's only copy can be zeroed before it ever reaches the cloud; the v75 30 s backup both doubles the footprint and syncs to the cloud; the quota-defense stack is a 6-layer ladder that no one owns end-to-end: global QUOTA GUARD `setItem` wrapper (6531–6591), LZString shim (6632–6636, "~5MB now holds ~50–70MB of JSON"), AutoVault in-place LZ (175465–175541), the module `save()` ladder (175747–175776), v25–v28 reapers (187631–188890), v74 `HnxData` console helpers (199968–200070) + v75 backup (200079).

### 3.2 Patch-Stack Code Organization

The module is a 2,700-line core plus ~80 stacked patch IIFEs (~13k+ lines) that never edit earlier code — each monkey-patches prior globals, rebinds buttons by `cloneNode` replacement, and runs its own 500–1500 ms `setInterval` poller forever. Observable pathologies:

- **Broken prefix filter (v5, line 180433):** `if (!k || !k.indexOf('hydroPro_rnd_') === 0) continue;` — operator precedence makes this `(!k.indexOf(...)) === 0`, false for every non-null key, so the filter is a **no-op and every localStorage key is JSON.parsed on each direct-draw** (including multi-MB unrelated keys). The corrected idiom `k.indexOf('hydroPro_rnd_') !== 0` appears in v6/v7+ (181432, 181462, 15+ sites).
- **Wrong-board heuristic (v5 `drawToBoard`, 180547–180618):** no handle to the open board, so it flushes via `RND._save()` (180426), walks localStorage (`findActiveBoard` 180423, loop 180431–180444), prefers the key containing `'items'` (180555), and picks the item with **highest `updatedAt`** (180573–180581) as "the open board" — acknowledged in-code as a guessable-wrong heuristic; generated geometry can land on a colleague's unrelated schematic. Redraw is forced by `RND.closeModal()` + `RND.openItem(id)` (180608–180618); clipboard fallback `offerClipboardFallback` (180621). Same walk pattern in v6 `openFromBoard` (181427) and `patchV5` (181452).
- **Load-bearing race:** v13's draw waits a fixed **350 ms** after closeModal for the host boardSave's empty-state write before writing objects (184457–184511) — success is device-speed-dependent.
- **Replace-not-append:** sheet generation **replaces** `scene.objects` (183056–183057) without pushing a revision — manual annotations on a generated sheet are wiped by regeneration with no history entry.
- **UI churn wars:** v49 (194720–194800) exists solely to pacify older patches — `findRndPanel` (194743–194747) locates `.hnx-v4-toolbar`, `lockFlags` (194752–194764) stamps fake `dataset.v33Done/v34Done/v36Done='locked-v49'` every 500 ms, and a MutationObserver deletes "leak" nodes matching `LEAK_SIGNATURES` (194727). v29.5 (189058–189080) rewrites the toolbar title every 500 ms forever; each version restamps the title (e.g. 187946–187953), so the visible label = last patch loaded. v12 (183821–184191) exists to audit/rebind silently-broken buttons.
- **Three competing `isRndActive()` pollers** (179272–179294, 179994–180013, 182121–182136) plus the v8 gate's 500 ms tick and `switchModule` monkey-wrap (182150–182165). v4's original gate checked the wrong global (`window.currentModule` vs `window.HN_currentModule`, comment 180249–180253) — hence `showAll()` (180260) force-showed everything and v8 had to reinstate gating via CSS.
- **Zero testability:** everything anonymous-IIFE inside a 200k+-line HTML file, entangled with DOM/localStorage/timers/network; the only verification tools are manual in-product harnesses (v12 Diagnose 184053–184157, v15 "🚨 TEST DRAW NOW" 184982–185115, v24 Stats/`validateSpec` 187429–187558).
- Other fragile patterns worth knowing: v19 temporarily monkey-patches `window.Date` during an import handler (186344–186365); v21 wraps `window.FileReader` globally (186783–186862).

### 3.3 Sync Conflicts & the Dead Push Hook

1. **`window.__hnxSyncPushSoon` is never defined** — verified: only the two guarded call sites at 175751/175775 exist. Every R&D `save()`'s intended eager push is a silent no-op; sync rides the 20 s tick. A user who saves and closes the tab (or whose device sleeps in the field) within 20 s loses the push — while v27/v28 delete local backups on the assumption the cloud has copies.
2. **Whole-key newer-wins clobbering:** the generic layer pushes/pulls `hydroPro_rnd_items_v1` as one value. Two devices editing **different** items clobber each other's records wholesale — no per-item merge, no conflict surfacing.
3. **Backup keys sync too:** `hydroPro_rnd_items_v1_backup` is not in `SKIP_PREFIXES` (138973) — wasted bandwidth, wider clobber surface.
4. Scene JSONs in R2 are per-version keys (`v<version>.json`) and effectively immutable — scene-level conflicts don't exist; only the (currently clobber-prone) metadata record conflicts.
5. **No user-visible sync state** beyond the single `#rnd-offline` chip — staff cannot tell cloud-safe from local-only.

### 3.4 Permissions Gap

Simultaneously too strict and too loose: no `'rnd'` in `moduleToRolePerm` (57927–57948) or `DEPARTMENT_OPTIONS` (57917) → every non-admin role defaults to `'none'` (57950) and the intended user base can't see the module without a per-user `'module:rnd'` override (57976), `user.allDepts` (57983), or admin role; meanwhile no guards-table entry (21883–21903) + `perm:null` view + unguarded module-sync (21912–21919) means `switchView('rnd_home')` (Cmd+K, Nexi atlas, voice, console, pasted link) opens it for **anyone**, unchecked. Inside the module: no ownership model, and `boardSave` skips `ensureEditable` (locks don't stop drawing).

### 3.5 Data-Integrity Footnotes

- Loose string-id references only, no referential integrity: `delSubject` leaves items tagged to a "—" fallback (by design, 177744/175789); `delProject` (177746) strands items with dangling `projectId` (they silently vanish from the tree, never reassigned).
- `SYM_BY_NAME` name collisions (175961): duplicate symbol names across categories collapse, last wins.
- `dupItem` (177241) resets `linkedTasks`.
- `projBomTotal` "spend" is estimated BOM cost, not actuals — the over/left budget chips (177762–177763) silently conflate the two.
- Ordinary content edits are unaudited (only 7 lifecycle actions, §2.3); content restores from revisions are not audited either.
- Two disjoint "R&D" features: the Overview R&D domain / rd_engine dashboard (88451–88471) scores from `hydroPro_seed_studies` + irrigation pool learning — **not** from `hydroPro_rnd_*`.

---

## 4. Integration Map

### What touches this module

| Surface | Wiring | Line(s) |
|---|---|---|
| Host module registry | `MODULES.rnd` registered early (primary) + module fallback | 21771–21772, 178365 |
| Sidebar | `SIDEBAR_LABELS.rnd='R&D'` (21791); order[] between 'projects' and 'admin' | 21794–21820, 21797 |
| Modules dropdown | GROUPS 'Operations'; filtered by `canView(k)` | 133231, 133247 |
| Rail v13.91 | `NAV()` built from registry (comment: R&D was missing from the hand-written list) | 211351–211366 |
| Rail flyout v13.99 | `registryViews(k)` fallback lists `MODULES.rnd.views` | 212043–212198, 212080–212082 |
| Cmd+K search | `NEXI_NAV` v13.13 rebuild from `window.MODULES` adds rnd_home (hard-coded seed at 173148 lacks it) | 173148, 173153–173184, 211423–211517 |
| Voice | `RND.handleVoiceCommand` — open module / new-board intents | 178343–178351 |
| Nexi cockpit | `genericCockpit(key)` **defined at 206342** (206322 is inside `buildAssistantCockpit`); wrapper 206352–206374 assigns `HN_BRAIN_MODULES.rnd = genericCockpit('rnd')` on first open (206361), rebrands header "NEXI RND COCKPIT" (206366); static placeholder (health 85, one 'observe' insight, zero R&D data). Without the wrapper the base renderer would mislabel-fall-back to the PRODUCTION cockpit (13042–13043). Brain tab injected into every sub-tab bar by `injectAllBrainTabs` (13963–13965) / `injectBrainTab` (13935–13961) |
| Generic cloud sync | `hydroPro_` prefix rule (139014–139023) — all seven keys + backups sync | 138962–139258 |
| AutoVault | LZ-compresses `hydroPro_rnd_*` > 120 KB (excluded from IndexedDB offload) | 175515–175518, 175453–175460 |
| Data Rescue | Full export dumps all `hydroPro_*` keys generically | 209081–209093 |
| Host SOP library | `window.SOP_LIBRARY` consumed by design-sheet SOP linking | 177310 |
| R2 worker | `hnx-sync.eyalbenari99.workers.dev` — scenes, thumbs, exports, files, CAD | 176042–176076 |
| AI backend | `__hnxApi('/ai/analyze')`, `__hnxApi('/cad/generate')` | 176289, 177537, 177134 |
| CDN (HNX overlays) | Three.js r128 (multi-CDN fallback 184014–184033), PDF.js 3.11.174, SheetJS, mammoth | 179372, 180058–180061 |

### What this module touches / exposes

| Export | Consumers |
|---|---|
| `window.RND` (178373–178407) — full API: navigation, item lifecycle, DS workflow, BOM, exports, board internals, AI/voice, asset bank | The ~80 HNX overlays; Nexi atlas; voice layer |
| `window.linkRndItemToTask` (177604) / `window.getRndItemsForTask` (177605) | **ZERO callers anywhere in the file.** The registry-promised "link to planning tasks" is a `prompt()`-based free-text tag (`linkItem` 177596–177602: type a module id + free-text task ref → `item.linkedTasks`); no picker, no validation, no reverse lookup in planning/maintenance/cockpits. Stage-1 list itself calls it a "planning-task link API" (177831), deferring integration to Stage 2 |
| HNX globals | `HnxNewBoardUI` (179344), `HnxV2` (180033), `HnxV3`/`HnxParseFile` (180179/180233), `HnxV4` (180390), `HnxV5` (180712), `HnxV6` (181545), `HnxV7` (182037), `HnxV8` (182167), `HnxLog` (184909), `HnxV25/26/27` shrink/trim handles, `HnxV43.center` (194066) |

**Key fact: nothing outside the R&D script chain reads `hydroPro_rnd_*`.** Reports, daily briefing, cockpits, maintenance, and planning never consume the module's data; every read/write of these keys sits between lines 175720 and 200200.

---

## 5. Improvement Roadmap

Merged UX + technical proposals. Effort: S / M / L. P1 = ship before anything else; P2 = structural; P3 = capability growth.

| # | Pri | Problem | Proposal | Effort | Impact |
|---|---|---|---|---|---|
| R1 | **P1** | Auto-trimmers (v25–v28) permanently zero `scene.objects` beyond keep-top-2/3 on 10–15-min timers; hand-drawn work, pre-HNX boards, and manual edits irrecoverable; `updatedAt+1` stamping evicts other boards; v27/v28 delete all local backups on a false "cloud has it" premise | **Archive-then-strip:** disable v28 parse-time strip + v27/v26 auto schedules immediately (stopgap: keep only v26 keep-5/>50 or nothing); rewrite the strip contract to upload scene JSON via existing `persistScene`/`r2PutJson` and record `sceneKey` before zeroing; refuse to strip `_dirty`/offline/no-sceneKey scenes; rehydrate `_stripped && sceneKey` items on open via `r2GetJson`; show "archived to cloud — tap to reload" instead of a blank canvas; consolidate 4 reapers into ONE storage governor with visible policy; one-time recovery scan of R2/sync worker for orphaned scene JSONs | M | **CRITICAL** — nothing else matters if drawings vanish |
| R2 | **P1** | `__hnxSyncPushSoon` never defined → all saves ride 20 s tick; tab-close/device-sleep loses work | Define it as a debounced (~2 s) wrapper around the existing worker push (~138970); add `beforeunload`/`visibilitychange` flush | S | High |
| R3 | **P1** | Line 180433 precedence bug — v5 JSON.parses every localStorage key on each draw | `if (!k \|\| k.indexOf('hydroPro_rnd_') !== 0) continue;` (idiom already at 181432/181462) | S | Med (perf + bug-class) |
| R4 | **P1** | `rnd` missing from `moduleToRolePerm` (57927–57948) and `DEPARTMENT_OPTIONS` (57917) → non-admins locked out; no guards entry (21883–21903) + `perm:null` → deep-link bypasses all gating | Add `'rnd'` rows with role defaults (maintenance/operations = Edit, others = View); add `rnd_home` to guards (better: derive guards from registry so every view is checked); decide/document `perm:null` intent | S | High — unblocks the actual user base, closes bypass |
| R5 | **P1** | `boardSave` (178301) skips `ensureEditable` — frozen/design_locked projects don't stop drawing saves | Call `ensureEditable()` in `boardSave` (matches `dsCommit` 177328 / `bomCommit` 177425) | S | Med — makes the CEO's lock workflow real |
| R6 | **P1** | Offline `_dirty` scenes race the reapers (only copy destroyed); no sync visibility; `migrateDirty` only runs on tab switch | Exempt `_dirty` / no-sceneKey items in every trim (guard in 4 places); per-item sync badge (cloud ✓ / pending ↑ / local-only ⚠) on cards + board header; run `migrateDirty` on `online` events; add `_backup` keys to `SKIP_PREFIXES` (138973) | S–M | High — closes the likeliest real-world loss path |
| R7 | **P2** | Full scenes + Data-URL backgrounds serialized into one synced localStorage key; HNX draw paths bypass `putItem` with raw `setItem` (180599, 183064, 183723, 184491); v75 backup doubles footprint | Single exported writer `RND.putScene(itemId, objects)` wrapping `putItem`/`persistScene`; move offline scene buffer to IndexedDB (extend AutoVault list 175453–175460); revert v14 Data-URL backgrounds to R2 `imageKey` + IndexedDB pending queue; move v75 backup to IndexedDB/R2 | M–L | **CRITICAL** — removes the quota ceiling structurally |
| R8 | **P2** | Generated sheets stored as baked geometry (redundant with stored `hnxCabinetSpec`); every symbol placement inlines full SVG; dual `kind`/`type` schemas; verbose path points | `scene.generator = {type:'cabinet-sheet', spec, sheetNum, rendererVersion}`, render on open, persist only annotation-layer overlays; symbols as `{kind:'symbol', ref:assetId\|name}` resolved via `SYM_BY_NAME`/`assetsAll` with a permanent load-time shim; one canonical schema (`kind`) + `schemaVersion`; flat number arrays for paths; pin `rendererVersion` (approval snapshots already exist at `dsApprove`) | M | High — 10–50× size cut on sheets; removes the pressure behind R1/R7 |
| R9 | **P2** | Duplication: 127 seeded SVGs persisted despite living in code; offline dataURL thumbs in items key (recovery ladder already strips them, 175760–175772); no content addressing | Resolve `isSystemDefault` assets virtually from `SYMBOLS` (persist custom only; keep deterministic `seed_<cat>_<ix>` ids for catalog/where-used; drop seedver machinery); SHA-256 content-hash R2 keys for uploads; thumbs always r2img online / IndexedDB offline | S–M | Med-High |
| R10 | **P2** | Whole-key newer-wins sync clobbers concurrent edits to different items | Per-item merge for `hydroPro_rnd_items_v1` in the pull-merge path (extension point 139258): union by id, per-item newer-`updatedAt` wins, `deletedAt` tombstones; detect same-item conflicts via `item.version`, push loser into `revisions[]` with a toast; roll out behind a flag, log divergences first | M | High — closes multi-device loss channel |
| R11 | **P2** | Snapshot undo (full `JSON.stringify` of objects per step) is heap-hungry on 1000s-object sheets; sheet redraws replace objects with no revision; legacy embedded-scene revisions trimmable; restores unaudited | Command/delta undo stack (stable `o.id` makes it easy; op-count cap + one baseline); invariant in the single writer: any replace/zero of `scene.objects` MUST `pushRevision()` first; migrate legacy `r.scene` revisions to R2 sceneKeys in `migrateDirty`; audit content restores | M | Med |
| R12 | **P2** | ~80-patch stack: pollers, cloneNode rebinding, label wars, wrong-item heuristic, 350 ms race | Freeze the chain (no v50); extract core + patches to separate .js files (even concat/esbuild); fold surviving behavior into core in dependency order, deleting superseded layers (v9→canonical schema, v12→bind-once, v49→one toolbar owner, v25–v28→storage governor); replace localStorage-walk heuristic with `RND.getActiveItem()`/`RND.appendObjects(itemId, objs)`; replace pollers with one `'rnd:active-changed'` event (v8 switchModule wrap exists); one schemaVersion-stamped storage accessor as sole reader/writer of `hydroPro_rnd_*`; keep `HnxVN` objects as thin shims during transition, behind existing guards for fallback | L | High — every other fix lands in one place |
| R13 | **P2** | Zero automated tests; manual harnesses (Diagnose/TEST DRAW/Stats) bolted into production | Extract pure functions to unit-tested modules: `flaFromKw`, `standardBreakerAbove`, `jr36Range`, `nxcByKw`, `feederSize` (NEC 430.52 table tests), `parseFeedersText`, `autoLayoutCabinet`/`autoLayout`, `guidedToSpec`/`renderSpec`/`renderCabinet`/`renderPlan`, `buildDXF`, sheet builders, `catEffective`/`autoCode`, `validateSpec`/`validateDesignParams`, `nextRev`, `parseLooseJson`, scene normalizers; golden-file storage-contract tests per `hydroPro_rnd_*_v1` schema (round-trip + size budget); one Playwright smoke: create → draw → save → reload → intact → generate sheet → switch sheet → BOM export non-empty | M | High enabler — precondition for R7–R12 |
| R14 | **P3** | Task linking is a `prompt()` stub; bridge APIs have zero callers; no location/asset dimension | Real picker over actual planning/maintenance tasks with validated ids; reverse "Schematics" panel on task/project cards calling `getRndItemsForTask`; first-class location/asset field (greenhouse/zone/system) in items, filters, dashboard; QR code on exported PDFs deep-linking to the live approved revision | M | High — turns drawing toy into infrastructure knowledge base |
| R15 | **P3** | Desktop-modal board on a phone/tablet field app; blocking `prompt()`/`confirm()` everywhere (`statusItem` 177272, `linkItem` 177596, `projSetBudget` 177750, project code 177745); button-only zoom; 44 px targets only via v22 retrofit | Touch-first pass: pinch-zoom/two-finger pan, bottom-sheet palette/toolbar on narrow viewports, bigger handles, long-press context menu; replace all prompt/confirm with `openModal`-based dialogs; phone "view mode" — read-only pan/zoom + BOM/design-sheet tabs (the dominant field use case) | M (dialogs+view mode), L (full gesture pass) | High — view mode alone serves most field usage |
| R16 | **P3** | Approval flow has no inbox, no notifications, no reject-with-comment, no revision diff | "Pending my approval" queue (tab badge + dashboard card, one-tap approve); required note on revise/back-to-draft stored on the revision; submit/approve notifications via host toast/briefing; side-by-side thumbnail diff of submitted vs last approved snapshot (revision thumbs exist, 177563) | M | Med-High — makes approval the CEO's real control point |
| R17 | **P3** | Library retrieval doesn't match field lookup ("approved panel drawing for Greenhouse 2"); dangling refs on subject/project delete; generic `miniDiagram` thumbs | Location field as primary grouping for non-admins; "Approved only" toggle (default on in view mode); forced reassignment on subject/project delete; "my drafts / recently approved" rail; label miniDiagram fallback as "no preview yet" | M | Med-High — retrieval is the everyday use case |
| R18 | **P3** | BOM/budget dead-ends at export; "spend" chips conflate estimate with actuals; `AUTO-` lines never reconciled; admin-only catalog goes stale | Honest labels ("estimated BOM cost vs budget"); "Create purchase request" handing lines to logistics/planning (via R14 linking); reconcile prompt matching `AUTO-` lines to catalog by name; non-admin price suggestions queued for admin approval | M | Med |
| R19 | **P3** | Five-way create fork with no guidance; engineer-speak (Rev A, checker, BOM, lockLevel); dead draw.io teaser + unused `defaultBoardMode`; templates buried (IN-1-01 only in overlay pickers); voice undiscoverable | Collapse Create to "Describe it" (default) + "Draw it", demote imports; template gallery reusing existing generators (`buildFertigationScene` 177973, `guidedToSpec`/`renderSpec` 176147, `renderCabinet`/`renderPlan` 177705, IN-1-01 179474/180448); plain-language relabeling + tooltips; remove dead teaser/setting; first-run board overlay | S–M | Med — adoption lever, only matters after P1 |
| R20 | **P3** | Static `genericCockpit` placeholder for rnd; Overview "R&D" domain scores from unrelated seed-study data | Feed the Nexi rnd cockpit real module data (in-review count, health warnings, recent approvals) once the storage accessor (R12f) exists; reconcile or clearly separate the two "R&D" features | S–M | Low-Med |

---

## 6. Suggested Phase Plan

### Phase 1 — Quick wins & stop-the-bleeding (days; effort S each; negligible migration risk)

All are strict tightenings of intended behavior, shippable independently:

1. **Disarm the reapers (stopgap):** disable v28's parse-time strip (188766–188797) and v27's 10-min schedule (188519–188528); leave at most v26 keep-5/>50. One-line schedule removals; immediately widens the survival window.
2. **Define `window.__hnxSyncPushSoon`** as a debounced (~2 s) call into the existing worker push, + `beforeunload`/`visibilitychange` flush. Makes every `save()` eager as designed and makes the "cloud has backups" premise start being true.
3. **Fix line 180433** prefix filter (`!== 0` idiom).
4. **Exempt `_dirty`/no-`sceneKey` items** from every remaining trim function (guard in 4 places).
5. **Add `hydroPro_rnd_items_v1_backup`** to sync `SKIP_PREFIXES` (138973).
6. **Call `ensureEditable()` in `boardSave`** (178301) so project locks block canvas saves.
7. **Permissions wiring:** add `'rnd'` to `moduleToRolePerm` + `DEPARTMENT_OPTIONS`; add `rnd_home` to the switchView guards (ideally derive guards from the registry to fix the bug class).
8. **One-time recovery scan** of R2 / the sync worker for orphaned scene JSONs belonging to already-stripped items.

### Phase 2 — Storage re-architecture (the structural fix; weeks)

Sequenced so each step de-risks the next:

1. **Test harness first (R13):** extract and unit-test the pure functions (sizing math, spec/sheet builders, catalog resolution, validators, `nextRev`, `parseLooseJson`); golden-file storage-contract tests per key; one Playwright smoke covering the historical bug classes (kind/type mismatch, save races, strip-on-load).
2. **Single writer (R7a):** `RND.putScene(itemId, objects)` wrapping `putItem`/`persistScene`; route every HNX draw path through it; replace the localStorage-walk heuristic with `RND.getActiveItem()`/`RND.appendObjects()` (R12d). Enforce the invariant: any replace/zero of `scene.objects` pushes a revision first (R11b).
3. **Archive-then-strip governor (R1):** one storage policy replacing v25–v28; strip only verified-`sceneKey` or `hnxCabinetSpec` items; rehydrate-on-open; visible "archived" state.
4. **IndexedDB offline buffer (R7b–d):** pending scenes, thumbs, backgrounds, and the v75 backup out of the synced localStorage key; revert v14's Data-URL backgrounds.
5. **Scene format v2 (R8):** `scene.generator` render-on-open for sheets; symbol-by-ref; canonical `kind` schema + `schemaVersion` with permanent load-time shims (cloud peers hold old records); flat path arrays.
6. **Asset dedup (R9):** virtual seeds, content-hash upload keys, pointer-only thumbs.
7. **Per-item sync merge (R10):** union-by-id / newer-updatedAt / tombstones behind a logging flag, then enforced; conflict-loser → `revisions[]` + toast; per-item sync badges (R6).
8. **Patch-stack consolidation (R12):** freeze the chain, split files, fold layers in dependency order (v9, v12, v49, v25–v28 die first), event-driven activation replacing pollers, one storage accessor module.
9. **Undo delta stack (R11a)** once the writer choke point exists.

### Phase 3 — New capabilities (after the module is safe and reachable)

1. **Real task/asset linking (R14):** validated pickers, reverse "Schematics" panels in planning/maintenance, location/greenhouse field, QR deep links on PDFs.
2. **Field-first UX (R15):** phone view mode first (read-only pan/zoom + BOM/sheet), then prompt()→modal replacement, then the full touch/gesture editing pass.
3. **Review workflow (R16):** approval inbox + badge, reject-with-comment, notifications, snapshot thumbnail diff.
4. **Findability (R17):** location grouping, Approved-only toggle, delete-time reassignment, recents/pinned rail.
5. **BOM → procurement (R18):** honest budget labels, purchase-request handoff, AUTO-line reconciliation, price-suggestion queue.
6. **Create-flow simplification + templates (R19)** and **real Nexi cockpit data (R20)**.

---

*Every line number in this document refers to `/home/user/hydropro/index.html`. The visible HNX toolbar version label equals the last patch loaded, not a coherent release; treat `v4.54-rnd` (core) + the patch high-water mark (~v49, with v28's reaper active) as the deployed state.*