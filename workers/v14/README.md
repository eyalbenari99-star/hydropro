# Nexi Executive Office Worker v14

Cloudflare Worker starter for the Nexi Executive Office cockpit.

This code implements the browser-facing v14 route contract, one-time OAuth state with PKCE, encrypted D1 persistence, deterministic workstream intelligence, guarded AI enrichment and review-only email drafting.

It intentionally contains no email-send route and no external-calendar mutation route.

## Included

- Authenticated route dispatcher with President/Primary-EA authorization.
- Separate owner/assistant and mail/calendar connection bindings.
- Google and Microsoft delegated OAuth start/callback flow.
- Read-only scope allowlists and permission-expansion rejection.
- AES-256-GCM token/content vault.
- D1 migration for connections, config, encrypted workstreams, signals, sync runs and redacted audit metadata.
- Provider Gateway service-binding adapter.
- Deterministic signal classification and subject-based workstream clustering.
- AI enrichment that cannot reduce an approval requirement or move an approval away from Eyal.
- Grounded, review-only draft route.
- Fourteen automated authorization, OAuth, workstream, policy and no-send tests.

## Browser routes

- `GET /ea/intelligence/status`
- `POST /ea/accounts/oauth/start`
- `POST /ea/intelligence/configure`
- `POST /ea/intelligence/sync`
- `POST /ea/intelligence/email/draft`
- `GET /ea/accounts/oauth/callback/google`
- `GET /ea/accounts/oauth/callback/microsoft`

## Required bindings

### `DB`

Cloudflare D1 database. Apply `migrations/0001_executive_office.sql` before deployment.

### `OAUTH_STATE`

Cloudflare KV namespace for signed, one-time OAuth state. State expires after ten minutes and is deleted after successful use.

### `HNX_AUTH`

Service binding that handles `GET https://internal/v1/session/verify` and returns:

```json
{
  "tenantId": "tenant-id",
  "userId": "user-id",
  "role": "admin|president|primary_ea",
  "permissions": ["executive_assistant"]
}
```

The service must verify the real HydroNexis session and must not trust identity headers supplied by a public client.

### `PROVIDER_GATEWAY`

Private service binding that owns provider API calls and incremental cursors.

`POST /v1/ea/sync` receives the validated read-only sync request with server-injected tenant/user headers. It returns normalized `messages`, `events`, `tasks`, `commitments`, `followUps`, `registrations`, `sourceSnapshotAt` and `warnings`.

`POST /v1/ea/thread` receives `{slot, messageId, purpose:"review_only_draft"}` and returns the current authorized thread. It must resolve the slot and ID inside the server tenant binding and reject arbitrary cross-account IDs.

The gateway may use Google history/watch state and Microsoft per-folder delta links, but those cursors stay server-side.

### `NEXI_AI`

Private service binding with:

- `POST /v1/ea/enrich` — returns patches keyed only to existing signal/workstream IDs.
- `POST /v1/ea/draft` — returns `{to, subject, body, riskFlags, groundingRefs}`.

The Worker accepts only explanatory enrichment. AI cannot remove `requiresApproval`, move an approval away from Eyal, invent source IDs or create a new send action.

## Secrets

Set these through `wrangler secret put`; never commit `.dev.vars`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- `TOKEN_ENCRYPTION_KEY_BASE64` — exactly 32 random bytes encoded as base64.
- `OAUTH_STATE_HMAC_KEY` — at least 32 high-entropy characters.

## Local verification

```bash
npm test
npm run check
```

No external service or credentials are needed for the tests.

## Deployment sequence

1. Create D1 and KV resources.
2. Replace placeholder IDs and service names in `wrangler.jsonc`.
3. Apply the D1 migration.
4. Configure the application origin and OAuth redirect URIs.
5. Store secrets with the platform secret manager.
6. Deploy `HNX_AUTH`, `PROVIDER_GATEWAY` and `NEXI_AI` private services.
7. Deploy this Worker.
8. Test unauthorized, cross-tenant, cross-slot, revoked-consent and permission-expansion cases.
9. Connect one test account per slot and compare one week of recommendations with human review.

## Not complete until deployment team supplies

- Real HydroNexis session verification.
- Google/Microsoft application registrations and verification.
- Provider Gateway implementations for Gmail, Calendar and Microsoft Graph incremental synchronization.
- Production AI service binding and structured-output validation.
- Alerting, retention policy, key rotation and disaster recovery.
- Scheduled 06:00/18:00 execution and the inherited v13.47 delivery worker.

