# HydroPro — Packaging & Logistics Modules: Full Developer Specification

**Scope:** as-built design of the PACKAGING and LOGISTICS modules in `index.html` (single-file app, ~202,700 lines), for developer review and update.
**App version at time of writing:** v13.26 (branch `claude/logistic-3ldcgz`).
All line numbers refer to `index.html` on this branch.

---

# PART A — LOGISTICS MODULE

## A1. Registration & navigation

`MODULES.logistics` (L21144): icon 🚛, "Deliveries, routes, shipments, dispatch".

| View id | Label | Renderer (line) | Notes |
|---|---|---|---|
| `log_cmd` | 🎯 Command Center | cockpit host (L6115), config `COCKPIT.log_cmd` (L17442) | **static demo numbers only** — unlike `pack_cmd` which was made live (PACK-F4) |
| `log_dash` | Dashboard | `renderLogisticsDash` (L160128) | dispatcher entry L21973 |
| `log_deliveries` | 🚚 Deliveries | `renderLogDeliveries` (L170959) | CRUD, v3.89 |
| `log_routes` | 🗺️ Routes | `renderLogRoutesRedirect` (L171008) | redirect stub → live map / SinoTrack / daily report |
| `log_vehicles` | 🚐 Dispatch | `renderLogDispatchRedirect` (L171015) | redirect stub → vehicles / drivers / deliveries |
| `fleet_trackers` | 🛰 Live Trackers | `renderFleetTrackers` (~L168642) | IMEI/SIM registry + SMS command palette |
| `fleet_gps` | 📍 GPS Daily Report | `renderFleetGps` (L77666) | XLSX import/export |
| `log_recurring` | 🔥 Recurring Tasks | `renderRecurringHub` (dispatch L21876) | |
| `log_open_calls` | 📞 Open Calls | generic calls injector | |
| `log_megabox_matrix` | 📦 Megabox Matrix | `renderLogMegaboxMatrix` (L60864) | crate reconciliation per client |
| `log_duties` | 📋 Duties Matrix | `hnxOpenDuties('SVL')` (L200390) | shared with Packaging |

`MODULES.fleet` (L21221) holds `fleet_dash / fleet_vehicles / fleet_drivers / fleet_fuel / fleet_trackers / fleet_gps / fleet_logistics_coord`; a **registration adapter** (L170644–170684) folds every fleet view into `MODULES.logistics.views` at runtime and appends `LOGI_EXTRA` (live map, GPS ops/config, radios, locations, SinoTrack, cloud files) with `perm:null`. Retries every 250 ms up to 60×.

Runtime extras: `log_checklist` (L99847), `log_sops` (L130971), `log_brain` (L125229).

**Permissions:** all `log_*` → `viewLogistics` (guard map L21802; defs L57427). `fleet_*` resolves to module `logistics` via `VIEW_TO_MODULE` (L75996) + prefix rule (L76016).

### switchView layering (critical for maintenance)
Four layers wrap `switchView`, in load order:
1. **Base dispatcher** (~L21876–21978): known ids early-return; catch-all `log_*` → `renderStubModule('logistics',v)`.
2. **`_customViews` table** (L81027–81062): `fleet_files/matrix/expiry/live_map/gps_ops/gps_config`; sets `window.currentView` *first* to keep the View Alignment Watchdog from stealing `.active` (comment L81065); renders in `setTimeout(…,50)`.
3. **Post-dispatch tail** (L81110–81116): `fleet_dash/vehicles/drivers/fuel/logistics_coord`; `fleet_gps` delayed 80 ms.
4. **Per-feature wrappers**, each flag-guarded: deliveries `__logDlvHooked` (L171021, installs at T+1000 ms), adapter `__hnxAdapterHooked` (L170685) routing `fleet_track_live/live_map/daily_report/trackers/radios/locations/gps_config/cloud_files`, plus radios/tracking/locations hooks.

**Nav hardening** (v3.90, ~L171040): outermost wrapper pre-creates `div#view-<v>` so the base can't throw mid-flip (the "module-bleed" bug), then asserts one `.view.active` + header sync. ⚠️ The deliveries/routes/dispatch renderers each do their own `.active` juggling (L170961–170963), bypassing the single-active assertion — works today, fragile under reordering.

## A2. Data stores

| Key | Shape | Writers |
|---|---|---|
| `hydroPro_log_deliveries` | `[{id, date:'YYYY-MM-DD', destination, customer, vehicleId, driverId, items(free text), status, notes}]`; status ∈ `scheduled \| out for delivery \| delivered \| failed` | `_dlvAdd/_dlvUpd/_dlvDel` (L170940–170944) |
| `hydroPro_fleet_vehicles` (L74231) | `[{id, name, plate, type, driverId, helperId, status:'active'\|'idle'\|'maint'\|'offline', fuel 0–100, lat, lng, gpsTs, lastServiceOdo?, coldChain?}]` | `saveFVeh`, `updFV`, `addFleetVehicle`, `updateFleetGPS` |
| `hydroPro_fleet_drivers` (L74232) | `[{id, name, license, phone, notes}]` | `saveFDrv`, `updFD` |
| `hydroPro_fleet_fuel` (L74233) | `[{id, date, vehicleId, liters, cost, mileage?, location?, notes?}]` | `saveFFuel`, fuel CRUD |
| `hydroPro_gps_reports` (L76599) | **object** keyed `date::vehicleId` → `{date, vehicleId, odoOut, odoIn, fillUpLiters, perLiter, dashCam, generalNote, stops:[{location,timeIn,timeOut,km}]}` | `saveGpsReports` (L76601) |
| `hydroPro_fleet_gps_positions` (L106412) | `{vehicleId:[{ts,lat,lng,speed,course,source,ignition}]}` capped 2000/vehicle; 30-day auto-purge (L197191, runs boot+5 s & every 30 min) | `addFleetGpsPosition` (L170606) |
| `hydroPro_fleet_gps_config` (L106411) | `{source:'gps18_manual', pollingSec:60, stopThresholdMin:5, geofences:[{name,lat,lng,radius\|radiusM}]}` | `saveFleetGpsConfig`, Locations tab |
| `hydroPro_fleet_gps_draft_trips` | draft trips pending confirmation | GPS Ops console |
| `hydroPro_gps_driver_attendance` | per date/driver attendance | L78312, L108752 |
| `hydroPro_fleet_trackers` (L168469) | `[{id, vehicleId, imei, sim, phone, password}]` | `saveTrackers` |
| `hydroPro_fleet_sms_cmds` (L168470) | editable SMS command palette (`{pwd}` placeholder) | trackers screen |
| `hydroPro_fleet_radios` (L169491) | `[{radioName, radioId, sim, inCharge, firstAct, firstExp, curAct, curExp}]`; seeded `SEED_RADIOS` (L169498) | `saveFleetRadios` |
| `hydroPro_fleet_vehicle_files` / `_service` (L98115–98116) | per-vehicle documents vs `FLEET_DOC_TEMPLATES` (OR/CR, LTO, CTPL, comprehensive, emission, photos, inspection, tires, oil) + service history | Fleet Files |
| `hydroPro_log_megabox_v1` (L60860) | `{clients:[{name, counts:{black,blue,gray,pink,crate}}], updated}`; seeded 12 clients | `_mbxSave` (L60863) — the **only** logistics writer that explicitly calls `hnxScheduleSync()` |
| `hydroPro_sim_alerted` / `hydroPro_sim_auto_tasks` (L106272) | SIM-expiry alert dedupe + auto-created tasks | SIM watcher |
| `hydroPro_logistics_checklist_config` / `hydroPro_logistics_checklist` (L98934) | module checklist config + state | checklist renderer |

Cloud sync: since v12.90-livesync **all `hydroPro_*` keys** sync implicitly (comment L73674); explicit `hnxScheduleSync()` is belt-and-braces. Cross-tab GPS fan-out via `BroadcastChannel('hydroPro_gps')` (L107452).

## A3. Screen specs

### A3.1 Logistics Dashboard — `renderLogisticsDash` (L160128)
Sources: deliveries, vehicles, drivers, fuel, calls (`department==='logistics' && !isCallClosed(c)`).
Hero chips: Today done/total · On-time 7d (≥90 ok / ≥75 warn) · Fleet active/total · Open calls (0 ok / >5 crit) · Fuel MoM (≤5 ok / ≤15 warn).
Six KPI cards: Deliveries today, On-time 7d, Fleet active, Fuel cost 30d (₱), **Late/failed** (failed-today + overdue undelivered), Open calls.
Panels: Recent Deliveries (last 8, driver resolved via `driverId` per LOG-F5) → `log_deliveries`; Fleet grid (12 vehicles, status colors per LOG-F4) → `fleet_vehicles`.
Fix history: LOG-F1 (key repoint), LOG-F2 (canonical closed statuses), v13.26 LOG-F3/F4/F5 (status vocabulary + name resolution).

### A3.2 Deliveries CRUD (IIFE L170926, v3.89)
`STATUS=['scheduled','out for delivery','delivered','failed']`. Stats: Total / Today / Pending (scheduled + out) / Delivered. Toolbar: Add, Export CSV (`Date,Destination,Customer,Vehicle,Driver,Items,Status,Notes`, blob revoked after 2 s), status filter. Fully inline-editable table; only a status change re-renders.

### A3.3 Logistics Coordinator — `renderLogisticsCoordinator` (L85871), view `fleet_logistics_coord`
14-day window over `hydroPro_gps_reports`. Per vehicle: daysDriven, totalKm (Σ `odoIn−odoOut`, clamped ≥0), totalLiters, stops, utilization% (=days/14), km/L, dailyKm, service-due (**SERVICE_INTERVAL=10 000 km**, `lastServiceOdo||0`), fuel runway (**TANK_L=50** fixed). Aggregates: fleet km/liters, avg utilization, service ≤7d count, underutilized (<30%). Cold-chain panel: vehicles flagged `coldChain` or name/type contains "refrig", alert when `daysDriven===0`.

### A3.4 GPS / tracking suite
- **GPS Daily Report** (L77666): per date::vehicle odometers, fill-ups, stops; day defaults to farm-local (`hnxLocalToday()`, LOG-F5); XLSX import/export via lazy `ensureXLSX()` (FLEET-F2); importer reads "FILL UP- LITER" from column 10 (FLEET-F4).
- **Live Map** (L106676): Leaflet, geofence circles honoring `radius` *and* `radiusM` (FLEET-F7).
- **GPS Ops / Config** (L106813 / L106975): position source, polling, stop threshold, geofences, Traccar import, data-maintenance resets; settings hydrate from persisted config (FLEET-F5).
- **Trackers / Radios / SinoTrack / Locations** (~L168642 / L169651 / L169743 / L170023).
- **Daily-report auto-builder** (~L169857): derives stops/driving time/distance from position history.

### A3.5 Fleet core screens
Vehicles (L76428, driver/helper resolution incl. employee-store ids — FLEET-F3), Drivers (L76460), Fuel (L76488), Fleet dashboard (L76203), Fleet Files/Matrix/Expiry (L98110+), Megabox Matrix (L60864, CSV export).

## A4. Connections (Logistics ⇄ rest of app)

| Connection | Mechanism | Lines |
|---|---|---|
| **Calls / tickets** | `department==='logistics'`; aliases `['logistics','drivers_helpers','logistic']`; auto-classifier keywords driver/vehicle/van/delivery/transport/truck/fuel/tire/dispatch/shipment; call-type `reroute → logistics` | L160151, L81445, L74726, L10483 |
| **Packaging / crates** | shares `hydroPro_crates_v1` + `hydroPro_deliveries_v1` (crate dispatch/returns); Megabox Matrix reconciles client crate balances; **LOG-F1 boundary:** `hydroPro_deliveries_v1` is packaging/crates-owned, logistics deliveries live in `hydroPro_log_deliveries` | L160144, L171708 |
| **Duties Matrix** | `log_duties` opens the shared SVL/SVP duties overlay (`hydroPro_duties_v1`); daily reset per local day via `doneDate` (LOG-F4) | L200390, L200115 |
| **Dashboard widgets** | main dashboard cards Fleet Vehicle Status / Deliveries Today / Fuel Consumption read fleet keys directly (FLEET-F6 status/key fixes) | L26496, L27670–27690 |
| **Reports/exports** | daily report section (GPS + fleet status) L78667; XLSX "Fleet" sheet L78748; report builders `gps_summary`, `driver_attendance` L105347 |
| **SOPs** | `sop_delivery_truck`, `sop_ebike_megabox` → logistics (L16649); `log_sops`/`fleet_sops` tabs (L130913–130972) |
| **HR/employees** | driver assignment resolves employee-store records (`_fleetEmployees`, FLEET-F3) | L76386 |
| **Cloud sync** | implicit all-key sync; `_mbxSave` explicit; GPS BroadcastChannel; 30-day GPS purge | L73674, L60863, L107452, L197233 |

## A5. Nexi intelligence — per-screen value

Nexi's on-device brain registers a **logistics domain** (L171699–171725): keywords `logistic, delivery, deliveries, fleet, truck, vehicle, driver, dispatch, route, gps, fuel, megabox, crate`.

| Data / screen | Nexi collection read | Intelligent value today |
|---|---|---|
| Deliveries | `hydroPro_log_deliveries` | custom `answer()`: "deliveries today / pending" counts using the real CRUD statuses; farm snapshot `snap.deliveriesToday` (L173502) |
| Fleet positions | `hydroPro_fleet_gps_positions` | "where are the trucks" — counts tracked vehicles; if empty, explains the tracker bridge isn't running |
| Vehicles / drivers / fuel | `hydroPro_fleet_vehicles`, `_drivers`, `_fuel` | inventory-style counts and status answers |
| Megabox / crates | `hydroPro_crates_v1` | crate-balance context (shared with packaging domain) |
| Navigation | `NEXI_NAV` (L172477): `log_duties`, `fleet_trackers`, `fleet_gps`; aliases `'live trackers' → fleet_trackers` (L172885); command-center map `logistics → log_cmd` (L172926); duties map (L172931) | "open live trackers", "go to logistics command center" work by voice/text |
| Fleet-AI overlay | `hnxFleetAI()` button injected into log/fleet dashboards (L197242) + Vehicles toolbar (L76435) | on-demand fleet analysis overlay |
| AI Brain views | `log_brain` (L125229, keywords L125457), `fleet_brain` (L125152, keywords L125460: fleet/vehicle/truck/driver/fuel/gps/km) | module-scoped AI command views |

⚠️ **Stale reference:** Nexi's logistics collections list `hydroPro_fuel_logs` (L171706) — nothing writes that key; the live key is `hydroPro_fleet_fuel`. Fuel questions through Nexi silently see no data.

## A6. Known issues / recommended updates (Logistics)

1. **"Today" disagreement:** `renderLogisticsDash` uses UTC `toISOString()` (L160158) while GPS report uses `hnxLocalToday()` — before 08:00 farm time the two screens disagree. → switch the dash to `hnxLocalToday()`.
2. **On-time rate is fictional:** `d.late` is never written, so "On-time 7d" = delivered rate. → either derive lateness (delivered after `date`) or relabel.
3. **Coordinator service-due default:** `lastServiceOdo||0` makes any real odometer show due-now, and **no UI writes `lastServiceOdo`**. → add a "record service" action on Vehicles.
4. **Fixed assumptions:** 50 L tank, 10 000 km interval, 14-day/7-day-week utilization — make per-vehicle config.
5. **Cold-chain comment vs code:** comment says "3 days", code tests 14-day `daysDriven===0` (L85949).
6. **Nexi fuel key stale** (see A5).
7. **`log_cmd` cockpit still demo numbers** — mirror the PACK-F4 treatment with live KPIs.
8. **Deliveries CRUD `items` is free text** — blocks warehouse Stage-2 stock deduction (see Warehouse design doc); plan structured items.
9. Fleet status vocabulary: writers produce `active|idle|maint|offline`; readers also accept `in_use|available|maintenance|in_service` defensively — document `idle` in the dash active/maint split (currently counted in neither).

---

# PART B — PACKAGING MODULE

## B1. Registration & navigation

`MODULES.packaging` (L21129): icon 📦, "Daily output dashboard, Wash & Trim SOP, materials inventory, output standardization".

| View id | Label | Renderer (line) |
|---|---|---|
| `pack_cmd` | 🎯 Command Center | cockpit host L6114; **live** config `MCC_LIVE.pack_cmd` (L17838, PACK-F4) |
| `pack_calls` | 📞 Packaging Calls | `renderPackCalls` (L84887) |
| `pack_checklist` | ✅ Daily Checklist | `renderModuleChecklist('packaging',…)` (dispatch L21976) |
| `pack_dash` | Dashboard | `renderPackagingDash` (L84923) |
| `pack_washtrim` | 🥬 Wash & Trim SOP | `renderWashTrim` (L30243) |
| `pack_materials` | 📦 Materials | `renderPackagingMaterials` (L85151) |
| `pack_operations` | ⚙️ Operations (stub) | `renderStubModule` (L21977) |
| `pack_duties` | 📋 Duties Matrix | `hnxOpenDuties('SVP')` (L200391, perm-checked per PACK-F3) |

Runtime-injected: `crates_mgr` "📦 Crates & Cold Storage" (L110103, renderer `renderCratesMgrView` L111483), `packaging_matrix` (T-11, L160372/160527), `pack_recurring` (L160373/160530), `pack_sops` (L130915/130974), `pack_brain` (L125228).

Static shells L5925–5931 + L6114. ⚠️ Source contains a **duplicate `view-pack_materials`** (L5926 vs L5928) — removed at runtime by v57 P0b (L196251); safe to fix in source.

Dispatcher entries L21971–21977 (early-return per id, `pack_*` prefix → stub). Permissions: all 8 views → `viewPackaging` (L21801, defs L57426). `MODULE_HOME.packaging='pack_dash'` (L172874).

## B2. Data stores

| Key | Shape | Writers |
|---|---|---|
| `hydroPro_pack_materials` (L84826) | `[{id, name, category, stock, unit, reorderPoint, supplier, unitCost, lastAdjust?:{delta,reason,at,by}}]`; defaults `PACK_DEFAULT_MATERIALS` (L84841) | `_packAdjustStock` (L84864, PACK-F5) → `_packSaveMaterials` |
| `hydroPro_pack_targets` (L84827) | `{productName: grams}` | **no writer — dead key**; dash uses `WT_PRODUCT_TYPES.targetGrams` instead |
| `hydroPro_washtrim_sessions` (L30202) | date-keyed map `{ 'YYYY-MM-DD': { pickTicket:{issuedAt,issuedBy,formulas[],outputs[{productId,count}],notes}, phaseChecks:{<phase>:{done,time,by,notes}}, summary:{outputs:{pid:{produced,pass,over,under}}, totalKgPacked, issues, photo(base64), submittedAt,submittedBy}, crew:{leads,workers,notes}, remarks, finalized } }` | `saveWTSessions` (L30205) |
| `hydroPro_packaging_checklist_config` / `hydroPro_packaging_checklist` (L98935) | subjects: sealing (4 items), labeling (5), cold_chain (4), hygiene (5), materials — defaults L99457+ | checklist renderer |
| `hydroPro_crate_types_v1` (L111406) | `[{id,name,lengthCm,widthCm,heightCm,maxWeightKg,tareWeightKg,color}]` | `hnxSaveCrateTypes` |
| `hydroPro_crates_v1` (L111407) | `[{id, typeId, state:'in_storage'\|'out_for_delivery'\|'damaged'\|'missing', contents:{crop,gh,harvestDate,weightKg}, storageZone, deliveryId, history[], lastSeen}]` | `hnxSaveCrates` |
| `hydroPro_deliveries_v1` (L111408) | crate deliveries `[{id, status:'in_transit'\|'returned_full'\|'returned_partial'\|…, crateIds[], dispatchTime, customerId}]` — **crates-owned, not logistics** (LOG-F1) | `hnxSaveDeliveries` |
| `hydroPro_cold_storage_v1` (L111409) | `{totalVolumeM3, zones[], notes}` | `hnxSaveColdStorage` |
| `hydroPro_customers_v1` (L111410) | crate-return customer registry | `hnxSaveCustomers` |
| `hydroPro_duties_v1` (L200102) | `{tasks:{n:{assignee,done,when,by,details,notes,doneDate}}, coldCount, shipPlan:{'YYYY-MM-DD':n}}` | duties overlay |
| `hydroPro_issues_v2` | packaging tickets (`module==='packaging'`) | issues module (read-only here) |

All 5 crate keys registered in `HNX_SYNCED_KEYS` (L111412). Snapshot group `megabox` covers `hydroPro_megabox*` + `hydroPro_crates*` (L201095).

## B3. Screen specs

### B3.1 Packaging Dashboard — `renderPackagingDash` (L84923)
Hero chips: Today kg (farm-local day, PACK-F2) · 7-day kg · QC pass 7d (`_qcLoadInspections`, dates normalized by v57 P1) · Low stock count.
Stat row: Packed Today (+session count) · 7-Day Total · Daily Avg · QC Pass Rate (90/70 thresholds) · Material Types · Low Stock.
Output-standardization table: per product `produced/pass/over/under`, off-target ≤3% ok / ≤8% warn / else crit; product meta from `WT_PRODUCT_TYPES` (L30086: `wt_500`, `wt_250`, `rte_250`, `rte_500` with target/tolerance grams).
Gaps: never reads `hydroPro_pack_targets`; **no cold-storage/crates KPI** despite `crates_mgr` living in this module; materials consumption is manual only.

### B3.2 Wash & Trim SOP — `renderWashTrim` (L30243)
Tabs: pick_ticket / checklist / summary / crew / history. Phase model `WT_PHASES` (L30094–30201): 12 phases (A…K) with expected minutes, materials, responsible roles, steps; physical constants: 2 packing lines × 3 tables × 10 blue crates, 4 scales, 8 spinner baskets; tolerances 500 g ± 5 g (W&T), 250 g ± 3 g (RTE). "Go to Daily Process" routed to phase checklist (PACK-F1). Summary photo stored as base64 — **photo-bloat monitor** warns >2 MB (v57 P2, L196324).

### B3.3 Materials — `renderPackagingMaterials` (L85151)
Grouped by category, 4 stat tiles, ± Adjust (receive/consume prompt with reason, PACK-F5). **Parallel to the Inventory module** — own store, no shared SKU key with `hydroPro_inv_stock`.

### B3.4 Crates & Cold Storage — `renderCratesMgrView` (L111483)
9 tabs: Dashboard (fill %, in-storage/in-transit/damaged/missing, by-type, last-5 deliveries — L111545), Cold Storage (crate table + QR label printer — L111770), Crate Types (L111659), Harvest Log (L111845), Deliveries (L111932 — the `hydroPro_deliveries_v1` screen; **do not confuse with logistics deliveries**), Returns (L112040), Customers (L112128), History (L112212), Invoices (L118167).

### B3.5 Command Center — `MCC_LIVE.pack_cmd` (L17838)
Live KPIs from W&T sessions + materials + open packaging calls; shows '—' when uncomputable (PACK-F4 replaced hardcoded demo numbers).

### B3.6 Duties Matrix (shared overlay, ~L200100–200420)
SVP (Supervisor Packaging) / PS (Packaging Staff) task grid; cold-storage-vs-SOS count tab; harvest PO pull (`/sos/purchase-orders`, L200400); shipments-vs-plan tab; Ask-AI context; daily reset per local day via `doneDate` (LOG-F4); perm-gated (PACK-F3).

### B3.7 Packaging-AI overlay — `hnxPackAI` (L77565; stub fallback v57 P0a L196238)
Tabs Output / Materials / Issues / Ask over W&T sessions, materials, issues. Debug: `HnxV57.audit()` (L196373).

## B4. Connections (Packaging ⇄ rest of app)

| Connection | Mechanism | Lines |
|---|---|---|
| **Production handoff** | harvest crates enter via Crates → Harvest Log (`contents.crop/gh/harvestDate/weightKg`); W&T pick ticket pulls from cold storage (phases E/F); reports `harvestYield`/`harvestLog` read the same key | L111845, L92818–92828 |
| **QC** | dashboard QC pass rate from `_qcLoadInspections()`; date normalization monkey-patch | L84987, L196287 |
| **Logistics** | crate dispatch/returns (`hydroPro_deliveries_v1`), Megabox reconciliation, shared duties matrix; LOG-F1 key boundary | L160144, L171708 |
| **Issues/calls** | routing regex `/pack|crate|carton|box|bag|bin|clamshell|punnet|label/ → 'packaging'` (L97567); `renderPackCalls` filter; keyword classifier L74725 |
| **Inventory** | **deliberately parallel** — packaging materials in own store; the planned Warehouse module (see `warehouse-module-design.md`) is the convergence path |
| **SOS (external)** | duties cold-count vs SOS, harvest POs, shipments-vs-plan | ~L200240–200400 |
| **HR** | duties assignees from `hydroPro_employees`/`hydroPro_hr_employees`; positions SVP/PS (L200106) |
| **Docs** | Google Drive registry: W&T process xlsx, Glide monitoring sheets | L135412 |
| **Cloud sync** | crate keys in `HNX_SYNCED_KEYS`; all-key implicit sync | L111412 |

## B5. Nexi intelligence — per-screen value

| Data / screen | Nexi hook | Intelligent value today |
|---|---|---|
| Module routing | keyword map L12909: `packaging:['pack','packaging','crate','label']`; module reg L171867 | packaging questions route to the domain |
| Navigation | `MODULE_HOME.packaging='pack_dash'` (L172874); duties map `packaging → pack_duties` (L172932); command-center map | "open packaging", "packaging duties" navigation |
| W&T output | sessions read by `MCC_LIVE.pack_cmd` and Packaging-AI | today/7-day kg answers via cockpit + PackAI Ask tab |
| Materials | `hydroPro_pack_materials` via PackAI `mats()` (L77504) | low-stock awareness in overlay |
| Crates | `hydroPro_crates_v1` in Nexi logistics collections (L171708) | crate counts/balances |
| Ask-AI contexts | `__hnxAskCtx.packai` (L77569), `__hnxAskCtx.duties` (L200330) | context-scoped LLM answers when a key is configured |
| AI Brain | `pack_brain` (L125228) | module-scoped AI command view |

⚠️ Gap: Nexi has **no direct packaging collection** for W&T sessions or materials in its core domain list — coverage comes via PackAI overlay and cockpit, not conversational answers ("how many kg packed today" is answered by the farm snapshot only).

## B6. Known issues / recommended updates (Packaging)

1. **Dead key `hydroPro_pack_targets`** — no writer; either build a targets editor or delete the key + loader.
2. **Duplicate `view-pack_materials` shell in source** (L5926/L5928) — runtime-patched (v57 P0b); fix at source.
3. **Photo bloat** — base64 photos in W&T summaries can blow localStorage; monitor exists (v57 P2) but no compression/offload; consider r2img (like employee photos, v13.25).
4. **Materials vs Inventory duplication** — two disconnected stock systems; converge via the Warehouse module (Packaging Center WH) per the approved design.
5. **Dashboard blind to cold storage** — `pack_dash` shows no crates/cold-storage KPI though `crates_mgr` is in-module.
6. **Nexi conversational gap** — register W&T sessions + pack materials as Nexi collections with a custom `answer()` ("kg packed today", "low packaging stock").
7. **`pack_operations` stub** — dead tab; repurpose or remove.

---

# PART C — Cross-module summary for reviewers

## C1. The three "deliveries" concepts (naming hazard)
| Store | Owner | Meaning |
|---|---|---|
| `hydroPro_log_deliveries` | Logistics | customer delivery jobs (CRUD screen) |
| `hydroPro_deliveries_v1` | Packaging/Crates | crate dispatch & return cycles |
| `hydroPro_gps_reports` stops | Fleet | physical stop evidence per trip |
No linkage exists between the three today. Recommended: delivery record gains optional `crateDeliveryId` + `warehouseId`; GPS stop auto-match by date+vehicle is a Stage-3 candidate.

## C2. Shared infrastructure both modules rely on
- `hnxLocalToday()` (L16679, farm-local UTC+8 day) — **must** be used for any "today" logic; UTC drift bugs recur (PACK-F2, LOG-F5, and the still-open A6.1).
- Nav hardening + per-feature `switchView` wrappers — add new views via a flag-guarded wrapper + `VIEW_TO_MODULE` entry; never edit the base dispatcher for injected features.
- Canonical call-closed check `isCallClosed` / `closed_fixed|closed_finalize|closed_cant_fix` (LOG-F2).
- Duties overlay (`hydroPro_duties_v1`) serves both SVL and SVP.
- Implicit all-key cloud sync since v12.90; heavy keys (GPS positions, W&T photos) have purge/monitor guards — new large stores need the same.

## C3. Priority update list (both modules, ranked)
1. Build the **Warehouse module** (approved design) — resolves B6.4 and gives Logistics Stage-2 stock deduction a target.
2. Fix UTC "today" in `renderLogisticsDash` (A6.1) — one-line, recurring bug class.
3. Point Nexi at `hydroPro_fleet_fuel` (A6.6) and add packaging collections (B6.6).
4. Live-ify `log_cmd` cockpit (A6.7) — pattern already proven by PACK-F4.
5. Add `lastServiceOdo` capture on Vehicles (A6.3) — Coordinator's service forecast is currently wrong for every vehicle.
6. Structured delivery items (A6.8) — prerequisite for warehouse deduction and true on-time metrics (A6.2).
