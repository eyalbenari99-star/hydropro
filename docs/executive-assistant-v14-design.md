# Nexi Executive Assistant v14 — Design Review & Upgrade Plan

**Prepared for:** Eyal Ben Ari (President) · ABA Pardes / HydroNexis-AI
**Reviewing:** v13.45 (EA module) · v13.46 (Email Intelligence) · v13.47 (President/EA Calendar + SMS Delivery)
**Date:** 2026-08-03

---

## 1. Verdict on the current design

The v13.45–13.47 designs are **excellent on security and plumbing** — read-only OAuth, worker-side tokens, consent/idempotency discipline, prompt-injection defenses, no-send boundary. Keep all of that unchanged.

Where they fall short is **intelligence and unification**. As designed, the EA module is three parallel pipes (calendar, email, SMS) that each produce their own list. A great executive assistant is not three lists — it is **one brain that knows what matters today, chases what is slipping, and prepares you before you ask**. That is the upgrade.

### Specific gaps found in the handoffs

| # | Gap | Where | Why it matters |
|---|-----|-------|----------------|
| G1 | Email, calendar, tasks and follow-ups are separate views with separate stores; nothing ranks them against each other | v13.45 §views, v13.46 stores | The President sees 4 lists, not "the 7 things that matter now" |
| G2 | Email classifier scores messages but has **no VIP tiering** — the board chair and a newsletter both compete on the same +3 rules | v13.46 classification | One flat "important sender list" is not how an EA thinks |
| G3 | **No commitment tracking** — when the President writes "I'll send the contract by Friday", nothing remembers Friday | absent everywhere | This is the #1 thing a human EA does |
| G4 | Meeting prep tasks are created, but prep **content** is empty — no dossier of who/what/last-contact/open items | v13.45 autoPrep | A prep task without a prep pack is just another to-do |
| G5 | The EA module is blind to the **rest of HydroNexis** — payroll deadlines (1601-C on the 10th, SSS month-end), contract expiries, license renewals, cutoff approvals never reach the morning brief | all three docs | Your real deadlines live in the farm system, not in Gmail |
| G6 | SMS/WhatsApp are delivery pipes with no **reply loop** — the President can't answer "APPROVE" or "MOVE TO 3PM" from the phone | v13.47 webhook handles only STOP | One-way messaging halves the value |
| G7 | No **quiet hours / interrupt policy** — a 15-minute reminder fires at the same priority as "board member is waiting on you" | v13.47 scheduler | Escalation without levels trains you to ignore everything |
| G8 | No **weekly lookback** — time spent, meetings vs plan, commitments kept/missed, response-time stats | absent | An EA that never reports on itself can't improve |
| G9 | Email drafts are local-only text with no tone memory | v13.46 drafts | Every draft re-explains "how Eyal writes" |
| G10 | Two mailbox slots max (assistant only in v13.46); the President mailbox is future work with no defined path | v13.46 mailboxScope | Decide the path now, even if activated later |
| G11 | Everything is English-only | all | The operation runs in EN + Filipino; SMS/notes should support both |
| G12 | No voice — Nexi already speaks in HydroNexis, but the brief is silent | all | "Nexi, read my morning brief" is a 20-line change with outsized value |

---

## 2. The v14 architecture — one brain, five senses, three hands

```
  SENSES (read-only)                 BRAIN                        HANDS (consent-gated)
┌──────────────────────┐   ┌─────────────────────────┐   ┌──────────────────────────┐
│ Calendars (Pres+EA)  │   │ UNIFIED PRIORITY ENGINE │   │ Nexi Daily notes (06/18) │
│ Email (EA mailbox…)  │──▶│  · one ranked queue     │──▶│ SMS / WhatsApp concise   │
│ HydroNexis modules   │   │  · VIP graph            │   │ Voice brief (Nexi TTS)   │
│  (payroll, contracts,│   │  · commitment ledger    │   │ Reply-draft studio       │
│   licenses, tasks)   │   │  · SLA clocks           │   │ One-tap approvals        │
│ Inbound SMS replies  │   │  · prep-pack builder    │   └──────────────────────────┘
└──────────────────────┘   │  · interrupt policy     │
                           └─────────────────────────┘
```

Everything below keeps the v13.4x security model verbatim (worker-side tokens, read-only scopes, consent, idempotency, no autonomous external mutation).

---

## 3. The twelve upgrades

### U1 · Unified Priority Queue (replaces per-source lists)
One ranked list — **"Nexi's Desk"** — merging calendar exceptions, email actions, delegated tasks, HydroNexis deadlines and commitments. Each item carries: source, owner (President/EA), due clock, priority score, one-line "why", and the single recommended next action. The Command Center's first screen becomes this queue, capped at 10 items; everything else is one tap deeper.
*Score = source-signal score (v13.46 rules kept) × VIP weight × urgency decay (due in 2h ≫ due next week) × owner factor (President-blocking items float).*

### U2 · VIP Relationship Graph (replaces flat important-sender list)
Three tiers instead of one list — **Tier 1 Board/Family/Bank · Tier 2 Key customers/suppliers/Dra Amy/Jinky · Tier 3 everyone configured** — each with its own SLA (e.g. Tier 1 reply within 4h, Tier 2 same day). The graph also stores per-contact context the prep packs use: role, company, last interaction, open threads, notes. Seeded automatically from the existing CRM + comm-lines directory.

### U3 · Commitment Ledger (new — the killer feature)
Nexi extracts **promises in both directions** from authorized email threads and meeting notes: "we owe them" and "they owe us", each with owner, due date, source citation. Ledger items enter the priority queue when due, appear in the 18:00 note ("3 commitments due tomorrow"), and nag politely until closed. Extraction is review-first: Nexi proposes, the EA confirms with one tap — no silent commitments.

### U4 · Meeting Prep Packs (upgrade of autoPrep)
24h before each meeting, Nexi builds a real dossier: attendee cards from the VIP graph, last email thread summary, open commitments with that party, relevant HydroNexis data (their orders from CRM, their deliveries from Logistics, outstanding balance from Accounting), location/travel time, and what the President must decide. Delivered as a Nexi Daily note + linked from the reminder SMS.

### U5 · HydroNexis Deadline Feed (closes G5)
The morning brief and priority queue subscribe to the farm system itself: government remittance deadlines (BIR 1601-C by the 10th, PhilHealth 11–15, SSS month-end), payroll cutoffs awaiting Approve & Lock, contract/lease expiries, license renewals, employee contract ends, pending approvals in Nexi Operations. These are deterministic — no AI needed — and they are the deadlines that actually cost money when missed.

### U6 · Two-way SMS/WhatsApp command loop (upgrade of the webhook)
Inbound replies become commands with a strict, safe grammar: `1`..`9` acts on the numbered item in the last message (APPROVE / DONE / SNOOZE), `BRIEF` re-sends today's summary, `NEXT` sends the next appointment. Anything else is logged for the EA. Free-text never triggers external actions; approvals only ever confirm items already fully prepared and shown in-app. STOP handling stays exactly as designed.

### U7 · Interrupt Policy & Escalation Ladder (closes G7)
Three delivery classes — **Routine** (batched into 06:00/18:00 only), **Timely** (event reminders, same-day items), **Interrupt** (Tier-1 waiting, safety, payroll lock deadline in <2h). Quiet hours (default 21:00–05:30) suppress Routine and Timely; only Interrupt breaks through, and each interrupt states why it qualified. Repeated ignored interrupts escalate to the EA's phone.

### U8 · Friday Lookback (closes G8)
A weekly executive report: meetings held vs planned, hours by category, commitments kept/missed, average reply time by VIP tier, top waiting-on-others blockers, and Nexi's three suggestions for next week. Delivered as a Nexi Daily note Friday 17:00 + optional printable one-pager with the company header.

### U9 · Voice Brief (closes G12)
"Hi Nexi, my brief" (or one tap) reads the morning note aloud with the existing Nexi voice pipeline — first appointment, conflicts, top 3 queue items, commitments due. Works in the truck on the way to the farm.

### U10 · Draft Studio with tone memory (closes G9)
Reply drafts keep the v13.46 grounding + no-send rules, and add: a per-sender tone profile (formal for the bank, warm for long-term suppliers), reusable snippets (bank details, farm address, standard terms), bilingual drafting (English / Filipino / Taglish on request), and a one-screen review with the risk flags inline. Still zero provider-write until you approve a scope upgrade.

### U11 · Mailbox growth path (closes G10)
Phase A (now): EA mailbox read-only — as v13.46. Phase B: add the President's mailbox as a **separate slot with separate consent**, classification-only by default (Nexi flags, never drafts from it, unless enabled). Phase C (optional, step-up consent + feature flag): provider-side drafts in the EA mailbox only. Send authority is deliberately **never** automatic in any phase.

### U12 · Bilingual delivery (closes G11)
Per-recipient language setting: notes and SMS in English or Filipino (GSM-7-safe), including the opt-out line. The President and EA can each pick their own.

---

## 4. Data additions (same security placement rules as v13.4x)

| Store | Sync class | Purpose |
|---|---|---|
| `hydroPro_ea_queue_v1` | cloud | Unified priority queue items (normalized, redacted) |
| `hydroPro_ea_vip_graph_v1` | cloud | VIP tiers, SLAs, contact context cards |
| `hydroPro_ea_commitments_v1` | cloud | Commitment ledger (direction, owner, due, source ref, status) |
| `hydroPro_ea_prep_packs_v1` | local | Rendered prep-pack previews (authoritative copy = worker record) |
| `hydroPro_ea_lookback_v1` | cloud | Weekly lookback metrics (numbers only, no bodies) |
| `hydroPro_ea_tone_profiles_v1` | local | Per-sender tone notes and snippets (no message bodies) |
| `hydroPro_ea_interrupt_policy_v1` | cloud | Quiet hours, delivery classes, escalation ladder |

New worker routes: `/ea/queue` (GET), `/ea/commitments` (GET/POST confirm/close), `/ea/prep/:eventId` (GET), `/ea/lookback` (GET), `/ea/inbound/command` (internal, from SMS webhook). All under the existing auth/tenant/redaction regime; no new provider scopes required for U1–U9.

## 5. What stays exactly as the handoffs specify

Read-only OAuth scopes · worker-side token encryption · consent + STOP machinery · idempotency keys · segment limits & PH SMS compliance · prompt-injection rules · no send route · external calendar mutation = human-only · error model · deployment gates. These sections are genuinely production-grade; v14 builds on top, not instead.

## 6. Build order (each phase ships something usable)

| Phase | Ships | Depends on |
|---|---|---|
| P1 | U5 HydroNexis deadline feed + U1 queue (in-app only) | nothing external — pure app work, can start now |
| P2 | U2 VIP graph + U3 commitment ledger (review-first) | P1 |
| P3 | U4 prep packs + U8 lookback + U9 voice brief | P1–P2 |
| P4 | Worker: calendars + 06:00/18:00 notes + SMS (v13.47 as written) + U7 interrupt policy | OAuth + SMS provider setup |
| P5 | Email intelligence (v13.46 as written) + U10 draft studio | Phase 4 worker |
| P6 | U6 two-way commands + U11 phase B/C mailbox growth | P4–P5 live and stable |

P1–P3 need **no OAuth, no SMS provider, no worker changes** — they run on data already inside HydroNexis and deliver a working "Nexi's Desk" immediately.

---
*Questions to decide before build start are asked separately with answer options.*
