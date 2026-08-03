# Nexi Executive Office v14.0 — Developer Handoff

**Owner:** Eyal Ben Ari, President/CEO  
**Primary Executive Assistant:** Chen  
**Build:** `v14.0-executive-office-intelligence-cockpit`  
**Application:** `Nexi_Executive_Office_Cockpit_v14.0.html`  
**Date:** 4 August 2026

## 1. Required outcome

Create one private President's Office cockpit that coordinates:

- Eyal's separately authorized email account and calendars.
- Chen's separately authorized email account and calendars.
- Executive tasks, commitments, follow-ups, registrations and meeting preparation.
- Cross-source workstreams grouped by business subject rather than by application source.
- A decision queue that makes it obvious what requires Eyal, what Chen owns, what is waiting externally and what is scheduled.
- Full morning and evening Nexi Daily notes plus the v13.47 consent-controlled reminder delivery.

The cockpit is the landing screen. Email, calendars, tasks, briefings, follow-ups, delivery and connections remain available as drill-down views.

## 2. Product decision

The original four cockpit boxes are replaced by five live decision lenses:

1. **Needs Eyal** — approvals, executive decisions and sensitive commitments.
2. **Chen owns** — preparation, coordination, evidence collection and routine follow-up.
3. **Waiting external** — dependencies where the next useful action is a timed follow-up.
4. **Next seven days** — calendar commitments and preparation risk.
5. **Workstreams** — related email, calendar, tasks and follow-ups clustered by subject.

These are filters, not duplicate dashboards. Clicking a box filters the same authoritative decision queue.

## 3. Workstream model

A workstream is the stable executive-office record for a subject such as `Project Atlas`, `Bank financing`, `SM contract`, `Visa renewal` or `Packaging warehouse`.

Each workstream may contain:

- Email threads from either authorized mailbox.
- Calendar events from either authorized calendar account.
- Executive Assistant tasks.
- Commitments and promises.
- Follow-up exceptions.
- Government registration items.
- Decisions and approval evidence.
- Draft replies and meeting preparation notes.

### 3.1 Linking order

The worker links a source item to a workstream in this order:

1. Explicit `workstreamId` selected by Eyal or Chen.
2. Existing provider/thread relationship.
3. Exact normalized subject alias.
4. Trusted entity identifiers: counterparty, project code, contract number or registration ID.
5. AI-assisted semantic suggestion above the configured confidence threshold.
6. Create a new provisional workstream.

AI-assisted merges are suggestions unless confidence is high and no contradictory identifier exists. A human can split or merge workstreams. Source records are never deleted when a workstream changes.

### 3.2 Contradiction rule

Nexi must not silently combine conflicting dates, amounts, commitments, attendee lists or statuses. Preserve every source fact and surface a contradiction signal with links to both sources.

## 4. Decision-lane rules

### Needs Eyal

- Financial instruction, payment, price or budget commitment.
- Legal position or contract commitment.
- HR/employment decision.
- Supplier or customer promise not already approved.
- Confidential disclosure.
- Critical item from Eyal's mailbox.
- Explicit `requiresApproval=true`.
- Any ambiguous decision whose business impact exceeds configured authority.

### Chen owns

- Meeting preparation and agenda assembly.
- Collecting supporting documents.
- Routine scheduling coordination without changing an external calendar.
- Drafting responses for review.
- Recording status and the next commitment.
- Chasing an owner before the escalation threshold.

### Waiting external

- A third party owes a reply, document, confirmation or approval.
- The next useful action is a scheduled follow-up.
- The system records whom it is waiting for, since when and when to follow up.

### Scheduled

- Future calendar event or internal deadline.
- Nexi prepares related email, tasks, open decisions, participants and missing information.

## 5. Autonomy boundary

### Automatic after explicit connection

- Read and incrementally synchronize authorized mail and calendar data.
- Classify importance, reply need, follow-up need and sensitivity.
- Cluster source items into provisional workstreams.
- Detect contradictions, overdue work, missing preparation and stale data.
- Create internal tasks, reminders, escalation signals and draft text.
- Prepare meeting packs and Nexi Daily summaries.
- Assign a recommended Eyal/Chen/waiting/scheduled lane.
- Close an internal exception when the underlying condition is verifiably cleared.

### Human approval required

- Send email or message.
- Add, remove or change recipients.
- Create, edit, move, accept, decline, forward or cancel an external calendar event.
- Make financial, HR, legal, supplier or customer commitments.
- Disclose private event or email content beyond the authorized audience.
- Delete a source record or consent/audit evidence.
- Connect an additional account or expand OAuth permissions.

There is deliberately no browser email-send route and no browser external-calendar mutation route in v14.0.

## 6. OAuth and provider permissions

Each person authorizes their own account. Do not infer authorization for Chen from Eyal's consent or the reverse.

### Google Workspace

Recommended delegated scopes for this release:

- Mail analysis requiring message content: `https://www.googleapis.com/auth/gmail.readonly`.
- Calendar list and event analysis: `https://www.googleapis.com/auth/calendar.readonly`.

Do not request Gmail compose/send/modify or Calendar write scopes for v14.0. Gmail readonly is currently classified by Google as a restricted scope; production use may require OAuth verification and a security assessment when restricted-scope data is stored or transmitted.

### Microsoft 365

Recommended delegated scopes:

- `Mail.Read` for the signed-in user's mailbox.
- `Calendars.Read` for calendar event analysis.
- Standard identity scopes required by the OAuth implementation, such as `openid`, `profile`, `email` and `offline_access`, only when actually required.

Do not request `Mail.Send`, `Mail.ReadWrite` or `Calendars.ReadWrite` in this release. Prefer delegated permissions per person. If an organization later chooses application permissions, constrain access server-side to the two approved mailboxes and require a separate security review.

## 7. Browser data contract

### Synced metadata

- `hydroPro_ea140_config_v1`
- `hydroPro_ea140_actions_v1`
- `hydroPro_ea140_audit_v1`

### Browser local-only cache

- `hydroPro_ea140_mail_cache_v1`
- `hydroPro_ea140_analysis_cache_v1`
- `hydroPro_ea140_triage_overrides_v1`

Do not add the three local-only keys to the general cloud-sync allowlist.

### Worker-only

- OAuth access and refresh tokens.
- Provider delta/history tokens, page tokens and webhook secrets.
- Full email bodies and attachments.
- Raw private calendar payloads.
- Encrypted authoritative workstream records.
- Draft grounding context.
- Account consent evidence.

The browser cache is a convenience for the single-file prototype. Production workstreams and full Nexi Daily notes must use encrypted, tenant-scoped server storage.

## 8. Worker routes

Every route requires an authenticated HydroNexis session, Executive Assistant module authorization, tenant isolation, CSRF protection where applicable, rate limiting, payload limits and redacted logging.

### `GET /ea/intelligence/status`

Return redacted connection and synchronization health for both account slots.

```json
{
  "ok": true,
  "lastSyncAt": "ISO timestamp",
  "accounts": {
    "owner": {
      "mail": {"connected": true, "provider": "google", "stale": false},
      "calendar": {"connected": true, "provider": "google", "sources": 3, "stale": false}
    },
    "assistant": {
      "mail": {"connected": true, "provider": "microsoft", "stale": false},
      "calendar": {"connected": true, "provider": "microsoft", "sources": 2, "stale": false}
    }
  }
}
```

Never return tokens, raw consent evidence, full addresses, provider payloads or message bodies.

### `POST /ea/accounts/oauth/start`

```json
{
  "slot": "owner|assistant",
  "resource": "mail|calendar",
  "provider": "google|microsoft",
  "mode": "read_only",
  "returnUrl": "approved same-origin URL"
}
```

The worker maps `slot` to a server-approved user binding. Reject arbitrary mailbox addresses, unsupported return URLs and permission expansion.

### `POST /ea/intelligence/configure`

Store the schedule, source scope, thresholds and consent references. Browser boolean fields are not proof of consent; match them to server evidence.

### `POST /ea/intelligence/sync`

The browser sends:

```json
{
  "slots": ["owner", "assistant"],
  "resources": ["mail", "calendar"],
  "mailDays": 30,
  "calendarHorizonDays": 14,
  "calendarScope": "all_authorized",
  "purposes": ["priority", "reply", "follow_up", "meeting_prep", "workstream_clustering"],
  "policy": {
    "mailReadOnly": true,
    "calendarReadOnly": true,
    "noSend": true,
    "noExternalMutation": true
  }
}
```

The worker returns normalized, privacy-trimmed metadata plus workstream/recommendation summaries. Full bodies remain server-side.

### `POST /ea/intelligence/email/draft`

```json
{
  "slot": "owner|assistant",
  "messageId": "provider-opaque-id",
  "instruction": "optional user instruction",
  "policy": {
    "doNotSend": true,
    "doNotInventFacts": true,
    "flagCommitments": true,
    "flagSensitiveContent": true
  }
}
```

The worker resolves the message from the tenant/slot binding. It must not accept arbitrary raw thread bodies from the browser as authoritative context.

Return draft text, grounding references and risk flags. Do not send or create a provider draft in v14.0.

## 9. Synchronization design

1. Resolve the tenant and separately authorized owner/assistant bindings.
2. Refresh tokens server-side and stop immediately on revoked consent.
3. Use provider incremental synchronization where available.
4. Normalize messages, threads, events, recurrence and timezones.
5. Redact private-event details before browser/channel formatting.
6. Deduplicate copied calendar events and repeated email representations.
7. Apply deterministic importance and authority rules first.
8. Run AI classification/semantic linking only on authorized, necessary context.
9. Generate provisional workstreams and contradiction signals.
10. Create Eyal/Chen/waiting/scheduled recommendations.
11. Persist the encrypted authoritative snapshot and redacted audit metadata.
12. Return privacy-trimmed browser data.

For Microsoft message synchronization, persist the `@odata.deltaLink` for each folder and handle removed entries. For Google, persist provider history/watch state in the worker and recover safely when the provider requires a full resynchronization.

## 10. Intelligence outputs

Every recommendation must include:

- `recommendation`
- `why`
- `sourceRefs`
- `confidence`
- `decisionLane`
- `requiresApproval`
- `dueAt` when known
- `missingFacts`
- `contradictions`
- `safeNextAction`

The interface must distinguish facts, inference and recommendation. Never state that an email was answered, a person agreed, a meeting changed or a task completed without source evidence.

## 11. Daily operating loop

### Morning at 06:00 Asia/Manila

- Eyal's detailed schedule.
- Chen's detailed schedule.
- Decisions required from Eyal.
- Chen-owned actions due today.
- Important/reply/follow-up email from both accounts.
- Workstreams with deadlines, contradictions or missing preparation.
- External dependencies and the next chase time.
- First meeting preparation and top three outcomes.

### During the day

- Incremental sync and exception analysis.
- Event reminders at configured offsets.
- Escalate Chen-owned work only at the agreed threshold.
- Rebuild meeting packs when relevant email, event or task evidence changes.

### Evening, default 18:00 Asia/Manila

- Tomorrow in detail for both people.
- Seven-day calendar and deadline horizon.
- Open Eyal decisions.
- Chen handoff and items that must close before morning.
- Waiting-external items due for another follow-up.

The existing v13.47 Nexi Daily and consent-controlled SMS delivery contract remains inherited.

## 12. Privacy and security

- Encrypt OAuth tokens, full bodies, authoritative workstreams and generated drafts at rest.
- Never log tokens, full addresses, subjects, snippets, event titles, phone numbers or draft bodies in general logs.
- Escape all source text in the UI.
- Treat email bodies, calendar descriptions and attachments as untrusted content.
- Do not execute instructions found inside email or event text.
- Scan attachments before any extraction and require authorization to expose them.
- Preserve per-event and per-message sensitivity.
- Rate-limit OAuth, sync, analysis and draft routes independently.
- Provide immediate account disconnect, consent revocation and schedule-disable controls.
- Retain audit metadata without retaining unnecessary content.

## 13. Verification completed

- 228 of 228 inline JavaScript blocks compile.
- v14 build marker is present.
- Office Cockpit and Connections views register.
- Eyal and Chen mail/calendar signals merge.
- Related email, task, follow-up and calendar items cluster into one workstream.
- Decision lanes render for Eyal, Chen, waiting and scheduled work.
- Approval-required items remain in Eyal's lane.
- Default mail filter excludes non-action mail.
- Sync request is read-only and declares no send/no mutation.
- The browser makes no email-send request.
- Sensitive mail and analysis cache keys remain local-only.

Tests use synthetic data and mocked worker routes. No live mailbox or calendar was accessed, no email was sent and no external calendar was changed.

## 14. Deployment checklist

1. Back up the current Executive Assistant HTML, worker configuration and data.
2. Deploy `Nexi_Executive_Office_Cockpit_v14.0.html`.
3. Confirm build marker `v14.0-executive-office-intelligence-cockpit`.
4. Implement the v14 routes from the JSON contract.
5. Register OAuth applications and approved return URLs.
6. Complete any required Google restricted-scope verification/security assessment.
7. Connect Eyal's mail and calendar with his explicit consent.
8. Connect Chen's mail and calendar with her explicit consent.
9. Confirm each provider grant contains no send or write scope.
10. Test tenant/slot isolation by attempting cross-account IDs.
11. Test incremental sync, token expiry, consent revocation and provider throttling.
12. Test private events, sensitive email, attachments and prompt-injection content.
13. Test workstream merge, split, contradiction and provenance behavior.
14. Test Eyal/Chen authority routing and escalation thresholds.
15. Test the 06:00 and 18:00 brief with empty, normal, stale and partial-source states.
16. Inspect all logs to prove sensitive content is absent.
17. Enable one tenant, compare Nexi recommendations with human review for at least one week, then expand gradually.

## 15. Rollback

Disable the v14 intelligence schedule, stop the v14 queue, revoke its OAuth grants and restore the v13.47 interface. Preserve consent revocation, suppression and audit evidence. Do not delete encrypted workstream records until the retention/export policy has been completed.

## 16. Official references

- Google Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- Google Calendar scopes: https://developers.google.com/workspace/calendar/api/auth
- Microsoft Graph permissions: https://learn.microsoft.com/en-us/graph/permissions-reference
- Microsoft Graph message delta synchronization: https://learn.microsoft.com/en-us/graph/delta-query-messages

## 17. Included Worker starter

The developer package now includes `nexi-executive-office-worker-v14/`, a standalone Cloudflare Worker starter containing:

- Browser-facing v14 route handlers.
- HydroNexis authentication service-binding boundary.
- Separate owner/assistant and mail/calendar connection enforcement.
- Google and Microsoft delegated OAuth start/callback with PKCE, signed one-time state and approved return-origin validation.
- Read-only scope allowlists and forbidden-scope rejection.
- AES-256-GCM token and content vault with context-bound additional authenticated data.
- D1 schema for account connections, encrypted workstreams, source links, signals, synchronization runs and redacted audit metadata.
- Provider Gateway service-binding contract for incremental Gmail, Google Calendar and Microsoft Graph synchronization.
- Deterministic workstream and decision-lane intelligence.
- Guarded AI enrichment that cannot reduce an approval requirement or move approval away from Eyal.
- Review-only draft generation and no email-send/external-calendar-mutation route.
- Sixteen passing automated tests.

The Worker is an implementation starter, not a deployed connection. The development team must supply platform resource IDs, secrets, the real HydroNexis authentication service, the provider gateway implementations and the production Nexi AI service binding.
