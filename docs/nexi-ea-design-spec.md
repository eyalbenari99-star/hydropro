# Nexi Executive Assistant — Design & Developer Review Spec
**Build:** v13.69b · **Owner:** Eyal Ben Ari (President/CEO) · **Primary EA:** Chen · **Date:** 2026-08-03
**Purpose of this document:** hand a developer everything needed to review, critique and rebuild the EA module's *interface* — the logic and data model are already implemented and listed here so the redesign doesn't lose behaviour.

---

## 1. Why a redesign is warranted (honest critique of what exists)

The EA works but it *looks* like an internal tool, not an executive product. Concrete problems:

| # | Problem | Where it shows |
|---|---|---|
| D1 | **Two visual languages collide.** The EA views are plain stacked sections; the cockpit is the old "brain" card system with a different type scale, spacing and colour usage. | Nexi's Desk vs cockpit boxes |
| D2 | **No visual hierarchy.** Queue rows, commitment rows, VIP chips and meeting rows all use ~12px text with near-identical weight; nothing tells the eye what matters first. | Nexi's Desk |
| D3 | **Density without rhythm.** Sections are separated only by a section-title; no cards, no grid, no consistent 8px spacing scale. | all four EA views |
| D4 | **Colour carries meaning inconsistently.** Green/amber/red appear for priority, for source type and for decoration; source badges (GOV/PAYROLL/EMAIL) compete with urgency colour. | queue rows |
| D5 | **Forms are raw.** Commitment logging, VIP add, registration checklist and email paste use unstyled inline inputs in a row that wraps badly under 1200px. | Desk, Gov Registrations |
| D6 | **No empty/loading/error states by design.** Empty lists are one grey sentence; nothing communicates "Nexi is watching" when there is nothing to do. | all |
| D7 | **Mobile is unusable.** Fixed multi-column rows and wide tables overflow; the President reads briefs on a phone. | all |
| D8 | **The cockpit duplicates the Desk** rather than complementing it — same four facts twice, no drill-down relationship. | cockpit vs Desk |
| D9 | **Voice and delivery are invisible** — the "read my brief" and 06:00/18:00 behaviour have no persistent status affordance. | Daily Notes |
| D10 | **No identity.** Nothing signals "this is the President's private cockpit" beyond a text badge; it should feel distinct from the farm modules. | all |

---

## 2. What must not be lost (implemented behaviour)

### 2.1 Views (module `assistant`, private access)
1. **🗂 Nexi's Desk** — unified priority queue + commitment ledger + upcoming meetings + VIP graph + weekly lookback + (admin) access manager.
2. **📋 Daily Notes** — 06:00 morning / 18:00 evening briefs, history (60), voice read-aloud, copy-to-message, auto-generation while open.
3. **📧 Email Intelligence** — mailbox config + authorization, classification, filters, review-only draft studio.
4. **🛂 Gov Registrations** — per-registration requirement checklists, expiry + lead time, custom items/groups.
5. **Cockpit** (rendered on top of the Desk) — four live boxes for her task groups.

### 2.2 The priority queue (the core object)
Each item: `{src, owner, title, why, due, score, action}`.
Sources: `GOV` (remittance deadlines), `PAYROLL` (runs awaiting Approve & Lock), `HR` (contracts ending ≤30d), `COMPLIANCE` (missing gov IDs), `TASK` (EA tasks), `COMMIT` (commitment ledger), `MEETING` (agenda missing <24h), `GOVREG` (registration inside renewal window), `EMAIL` (critical/needs-reply).
Ranking: score (0–9) desc, then due date. Top 10 shown.

### 2.3 Data stores
`hydroPro_ea_commitments_v1` · `hydroPro_ea_vip_graph_v1` · `hydroPro_ea_notes_v1` (+cfg) · `hydroPro_ea_email_cfg_v1` / `_cache_` / `_drafts_` / `_actions_` · `hydroPro_gov_registrations_v1` · `hydroPro_ea_access_v1` / `_primary_access_v1`.
Per-user scoping: primary users (President + Primary EA) share base keys; other allowed users get `key__username`.

### 2.4 Access model
- **President/admin** — everything, always (fail-open by design).
- **Primary EA (Chen)** — works *inside* the President's workspace: his calendar, commitments, notes, registrations.
- **Personal EA (e.g. Jinky)** — own private workspace, invisible to others in the UI.
- Everyone else — lock screen.

---

## 3. Target design (what the developer should build)

### 3.1 Layout system
- **Grid:** 12-column, max-width 1280px, 24px gutters. Cards snap to 4/6/8/12 columns.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 only.
- **Type scale:** 28/20/16/13.5/11.5px — Display, Section, Card title, Body, Meta. One family, three weights (400/600/800).
- **Radius:** 14px cards, 10px controls, 999px pills. **Elevation:** 1 shadow token, no borders competing with shadows.

### 3.2 Screen structure — "Today" first
```
┌───────────────────────────────────────────────────────────────┐
│  Good morning, Eyal.            [🔊 Brief] [⚙] [🔐 Access]     │  ← greeting bar, time-aware
│  Monday · Aug 3 · 3 things need you before noon                │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│ COMMITMENTS  │  MEETINGS    │ REGISTRATIONS│  MAIL            │  ← 4 group cards (the cockpit)
│    2 due     │  3 · 1 no    │  1 in window │  4 need reply    │     number-first, one metric
│  today       │  agenda      │  visa 20d    │  2 critical      │     + one supporting line
├──────────────┴──────────────┴──────────────┴──────────────────┤
│  NEXT UP                                        [see all →]   │  ← the queue, max 5 on screen
│  ① ⏰ 09:30  Robinsons meeting — agenda missing   [Prep pack]  │
│  ② 🤝 today  We owe SM: price list                [Mark done] │
│  ③ 🛂 20d    9(g) visa renewal — 3 documents left  [Open]      │
└───────────────────────────────────────────────────────────────┘
```
Rules: **one action per row**, the row itself is the click target for detail; the button is only the primary action. Numbers are the loudest element; labels are quiet.

### 3.3 Card anatomy (group cards)
- Big number (28px/800) + unit label (11.5px/600 uppercase, 60% opacity).
- One supporting line max (13.5px) — the *most urgent instance*, not a summary.
- Left accent bar 3px carrying the state colour; the card body stays neutral.
- Click → filters the queue to that group (this is the missing drill-down, D8).

### 3.4 Colour semantics (fix D4)
| Token | Use | Only for |
|---|---|---|
| `--urgent` red | overdue / <2h | left accent + number |
| `--soon` amber | due today / <7d | left accent + number |
| `--calm` green | on track / done | confirmations |
| `--info` blue | live/computed, not saved | the "○ live" state |
| neutral | everything else | source badges become **text**, not colour |

Source (GOV/EMAIL/…) becomes a small uppercase label in neutral grey — urgency owns colour.

### 3.5 States (fix D6)
- **Empty:** illustration + "Nexi is watching 6 sources. Nothing needs you right now." + last-checked timestamp.
- **Working:** skeleton rows, never spinners over content.
- **Error:** inline card with what failed and the last good timestamp; never a blank screen.
- **Stale:** if calendar/mail sync is older than the threshold, a persistent amber ribbon (per the v13.47 handoff rule).

### 3.6 Forms (fix D5)
Every EA form becomes a **sheet** (right-side drawer on desktop, bottom sheet on mobile): one column, labels above fields, primary action pinned bottom-right, destructive actions text-only. Applies to: log commitment, add VIP, add registration item, email draft, access grant.

### 3.7 Responsive (fix D7)
- ≥1200px: 4 group cards in a row, queue full width.
- 768–1199px: 2×2 cards, queue rows wrap the meta line under the title.
- <768px: single column, cards become a horizontal scroll strip, queue rows become two-line list items, tables → stacked key/value.

### 3.8 Identity (fix D10)
The EA module gets its own subtle skin: slightly warmer surface, a persistent "Private — President's office" watermark line in the header, and the workspace badge (Primary / Personal) as a pill next to the greeting.

### 3.9 Voice & delivery affordance (fix D9)
Persistent status chip in the greeting bar: `🔊 Brief ready · 06:00` / `Sent 06:00 · next 18:00` / `Worker not connected — in-app only`, clickable to Daily Notes.

---

## 4. Component inventory for the developer

| Component | Props / states | Notes |
|---|---|---|
| `GreetingBar` | name, dateLine, urgentCount, workspaceBadge, voiceStatus | time-aware copy |
| `GroupCard` | icon, label, value, unit, supportLine, state, onClick | 4 instances |
| `QueueRow` | rank, sourceLabel, title, why, dueChip, primaryAction | row click = detail |
| `DetailSheet` | title, sections[], actions[] | used by every drill-down |
| `FormSheet` | fields[], primaryAction, dangerAction | replaces all inline forms |
| `ChecklistCard` | items[], progress, expiry, leadDays | registrations |
| `NotePane` | body(text), kind, date, history[], onCopy, onSpeak | daily notes |
| `MailRow` | priority, from, subject, reasons[], actions | email view |
| `EmptyState` | icon, headline, sub, lastChecked | all views |
| `StaleRibbon` | source, lastSyncAt | calendar/mail |

Accessibility: 4.5:1 contrast minimum, focus rings on every control, full keyboard path through queue → row → sheet, `aria-live="polite"` on the queue count.

---

## 5. Review questions for the developer
1. Should the cockpit stay embedded at the top of the Desk (current) or become the module's landing screen with the Desk as a drill-down?
2. Is a drawer (`FormSheet`) acceptable in this app's existing modal system, or should forms stay inline but restyled?
3. Do we adopt a design-token file for the EA and back-port it to the other modules later, or match the existing farm-module styling exactly?
4. Mobile: is a dedicated phone layout worth it before the worker ships (phone delivery may cover most mobile use)?
5. Any objection to source badges losing colour in favour of urgency-only colour?

*Behaviour, data model and access rules in sections 2 are implemented and tested — the redesign should re-skin and re-arrange them, not change them.*
