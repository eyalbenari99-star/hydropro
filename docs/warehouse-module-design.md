# HydroPro — Intelligent Warehouse Module (Design)

**Target:** Logistics module → new **🏬 Warehouse** tab
**Version tag when built:** v13.27 (WH-1)
**Status:** Design for approval — no code written yet.

---

## 1. What you asked for

- A **Warehouse tab inside Logistics** with a **dropdown of all warehouses** and an **"+ Add warehouse"** option.
- The first warehouse pre-created and named **"Packaging Center WH"**.
- The ability to **upload the product counts** (the stock list you have) into that warehouse.
- Before building: a detailed plan for how the *intelligent* warehouse module works.

## 2. How it fits what already exists

The app already has an Inventory module with these stores, and the warehouse module must not fight it:

| Existing store | What it holds | Warehouse module's relationship |
|---|---|---|
| `hydroPro_inv_stock` | Item master: `{id, sku, name, category, unit, onHand, minStock, unitCost, supplier, location, notes}` | We reuse the same item shape. `location` today is free text — the warehouse module makes it structured. |
| `hydroPro_inv_movements` | `{id, date, sku, name, type:'in'/'out'/'adjust', qty, reason, by}` | We extend movements with `warehouseId` (and `toWarehouseId` for transfers). |
| `hydroPro_log_deliveries` | Deliveries CRUD (Logistics) | A delivery marked *delivered* can auto-deduct stock from its source warehouse (Stage 2). |
| SOS overlay (`hydroPro_inv_sos_overlay_v1`) | Live SOS-sourced items | Untouched. Warehouse quantities are our own layer. |

**Design rule:** one **item catalog** (shared with Inventory), and **per-warehouse quantities** kept separately. We never store the same product twice per warehouse — we store *how many of it* sits in each warehouse.

## 3. Data model (new localStorage keys, all cloud-synced via `hnxCloudSyncPush`)

### 3.1 `hydroPro_wh_warehouses` — the warehouse registry
```js
[{
  id: 'wh_xxxx',            // uid()
  name: 'Packaging Center WH',
  code: 'PCW',              // short code shown in badges
  type: 'packaging',        // packaging | cold | dry | staging | other
  address: '',
  manager: '',              // free text or employee name
  active: true,
  createdAt: '2026-07-31'
}]
```
Seeded on first run with **Packaging Center WH** so the dropdown is never empty.

### 3.2 `hydroPro_wh_stock` — per-warehouse quantities
```js
[{
  id: 'ws_xxxx',
  warehouseId: 'wh_xxxx',
  sku: 'CRATE-L',           // joins to the item catalog by sku (fallback: name)
  name: 'Large crate',      // denormalized so rows survive catalog edits
  category: 'packaging',
  unit: 'pcs',
  qty: 240,                 // counted quantity in THIS warehouse
  minQty: 50,               // per-warehouse reorder threshold
  lastCountAt: '2026-07-31',
  lastCountBy: 'Eyal',
  notes: ''
}]
```

### 3.3 `hydroPro_wh_movements` — the audit trail (intelligence feeds on this)
```js
[{
  id: 'wm_xxxx',
  ts: 1769871234000,
  warehouseId: 'wh_xxxx',
  toWarehouseId: null,      // set only for type:'transfer'
  sku: 'CRATE-L', name: 'Large crate',
  type: 'in' | 'out' | 'adjust' | 'transfer' | 'count',
  qty: 20,                  // signed for adjust; positive otherwise
  before: 240, after: 260,  // snapshot for auditability
  reason: 'delivery DLV-… / manual count / CSV import / …',
  by: 'Eyal'
}]
```
Every change writes a movement. `count` records a physical recount (before/after tells you shrinkage).

## 4. UI — Logistics → 🏬 Warehouse

One new view `log_warehouse`, registered exactly like `log_deliveries` (wrapper around `switchView`, lazy `view-log_warehouse` container, same fleet-table styling).

```
┌───────────────────────────────────────────────────────────────┐
│ 🏬 Warehouse    [ Packaging Center WH ▾ ]  [＋ Add warehouse] │
│                 dropdown of all active warehouses              │
├───────────────────────────────────────────────────────────────┤
│ KPI row: Items · Total units · Low stock · Last count · Value  │
├───────────────────────────────────────────────────────────────┤
│ [➕ Add item] [📥 Import CSV / paste list] [📤 Export] [🔁 Transfer] │
│ [search box]  [category filter ▾]  [☑ low stock only]          │
├───────────────────────────────────────────────────────────────┤
│ SKU | Name | Category | Unit | Qty | Min | Last count | ⚡ | 🗑 │
│  inline-editable qty (writes a 'count' movement automatically)  │
├───────────────────────────────────────────────────────────────┤
│ 📜 Recent movements (collapsible, last 20 for this warehouse)  │
└───────────────────────────────────────────────────────────────┘
```

- **Warehouse dropdown**: lists all `active` warehouses + a final "＋ Add warehouse…" option that prompts for name/code/type. Selection persists in `hydroPro_wh_selected`.
- **Manage warehouses**: small ⚙ next to the dropdown → rename / deactivate (never hard-delete a warehouse that has stock or movements — deactivate instead, so history stays intact).
- **⚡ column**: per-row status dot — green OK, orange `qty ≤ minQty`, red `qty = 0`.

### 4.1 Getting your product list in (the "upload all there" part)
Three paths, all landing in **Packaging Center WH** (or whichever warehouse is selected):

1. **📥 Import — paste or CSV file.** A modal with a textarea + file picker. Accepts `name, qty` at minimum; optional columns `sku, category, unit, minQty, unitCost`. Header row auto-detected; delimiter auto-detected (comma / tab / semicolon — so a straight paste from Excel/Sheets works). Preview table before commit → each committed row writes the stock record + one `in` movement with reason `CSV import`.
2. **➕ Add item** — quick inline row for one-off items.
3. **Pull from Inventory catalog** — checkbox list of existing `hydroPro_inv_stock` items to link into this warehouse at qty 0, ready for counting.

Duplicate rule on import: match by `sku` first, then case-insensitive `name`; matched rows **update qty** (as a `count` movement) rather than create duplicates.

## 5. The "intelligent" part

Stage 1 ships rule-based intelligence computed live from movements (no key, offline, same pattern as the rest of HNX). Each insight renders in an **🧠 Insights strip** under the KPI row:

| Insight | How it's computed | Action offered |
|---|---|---|
| **Low stock / stock-out risk** | `qty ≤ minQty`, and *days-to-empty* = qty ÷ avg daily `out` qty (last 30d of movements) | "Create purchase request" → writes into `hydroPro_inv_requests_v1` (existing Inventory requests store) |
| **Reorder suggestion** | When days-to-empty < lead-time guess (default 7d, editable per item) suggest order qty = 30d usage − qty | one-click add to request |
| **Dead stock** | No `out` movement in 60d and qty > 0 | flag row grey, suggest transfer or write-off |
| **Shrinkage watch** | `count` movements where after < before with no matching `out` | list discrepancies with dates + who counted |
| **Count staleness** | `lastCountAt` older than 14d | "Due for cycle count" list, sorted oldest first |
| **Imbalance across warehouses** | Same sku: one WH at 0/low while another WH holds > 2× its min | suggest a 🔁 transfer with pre-filled qty |

All thresholds (7d lead time, 60d dead stock, 14d count cycle) live in one small config object so they're tunable later without touching logic.

**Stage 2 (after Stage 1 is live and used):**
- **Delivery link:** marking a delivery *delivered* in Logistics → Deliveries deducts its items from a chosen source warehouse (delivery gains an optional `warehouseId` + structured items). Kept out of Stage 1 because today's delivery `items` field is free text.
- **Nexi awareness:** register warehouse data in Nexi's on-device brain ("how many large crates in packaging center?").
- **Logistics dashboard chip:** add a "WH low stock" chip to `renderLogisticsDash`.
- **Usage forecasting:** simple 4-week moving average per sku per warehouse to predict next week's consumption (drives smarter reorder qty).

## 6. Wiring & conventions (matches the codebase)

- New IIFE script block near the other Logistics modules; guard `window._whModuleInstalled`.
- View id `log_warehouse`; renderer `window.renderWhWarehouse()`; hook into `switchView` the same way `log_deliveries` does; add the tab to the Logistics module's `views` list so nav-hardening's `findModuleForView` owns it correctly.
- ES5-style functions, `esc()` for all user text, inline styles consistent with `fleet-table` / `fleet-stat-card` classes.
- Every save calls `hnxCloudSyncPush()` if present (same as `_invSaveCustomCats`).
- Movements list capped at 2,000 entries (oldest trimmed) to keep localStorage safe.
- CSV export mirrors `_dlvExport` (quote-escaped, dated filename).

## 7. Build plan / order of work

| Step | Deliverable | Size |
|---|---|---|
| 1 | Stores + seed "Packaging Center WH" + warehouse dropdown/add/manage | small |
| 2 | Stock table CRUD + inline qty edit → auto `count` movements + KPI row | medium |
| 3 | Import modal (paste/CSV, preview, dedupe) + export | medium |
| 4 | Movements log + 🔁 transfer between warehouses | small |
| 5 | 🧠 Insights strip (6 rules above) + purchase-request hook | medium |
| 6 | Stage 2 items (delivery deduction, Nexi, dashboard chip, forecast) | later |

Steps 1–5 ship together as one v13.27 commit; Stage 2 as follow-ups.

## 8. Open questions for you

1. **Value KPI:** do you track `unitCost` per item so the dashboard can show total ₱ stock value, or skip cost for now?
2. **Who counts:** should `lastCountBy` come from the logged-in HydroPro user automatically, or typed manually?
3. **Your product list:** send it in any form (paste, CSV, Excel export, even a photo of the count sheet) — the import is built to swallow `name, qty` at minimum. If you share it now I'll shape the import columns around it exactly.
