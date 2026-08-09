# Rollout sequence — dev → staging → prod

## Phase 0 · Prep (1 day)

- [ ] Clone the skeleton into a fresh Git repository.
- [ ] Push to GitHub / GitLab.
- [ ] Provision Postgres (Neon free tier is fine).
- [ ] Apply schema: `psql <neon-url> < migrations/001_init.sql`.
- [ ] Create R2 bucket `hnx-rnd-dev` (and `-prod` later).
- [ ] Set OpenAI key in a secrets vault (1Password / Doppler / Fly secrets).

## Phase 1 · Dev (3 days)

- [ ] Run `docker compose up` locally; verify backend `/health` and frontend `/`.
- [ ] Port the parser logic into `services/parser.py` (`TODO(14.6)`).
- [ ] Port renderer / BOM / wire-PDF into `services/renderer.py` and `services/bom.py` (`TODO(14.11)`).
- [ ] Port DXF builder into `services/dxf.py` (`TODO(14.12)`).
- [ ] Seed Asset DB with the working 127 + 300-mega symbols (TODO from `INJECT_FAIL_v1.py` reference — drop the bad pattern, keep the SVG generators).
- [ ] Run `pytest` — every test that has fixtures must pass.

## Phase 2 · Staging (2 days)

- [ ] Deploy backend to Fly.io: `fly deploy --config deployment/fly.toml`.
- [ ] Deploy frontend to Cloudflare Pages from `frontend/`.
- [ ] Set `VITE_API_BASE` on Pages = the Fly URL.
- [ ] Run the migration script against staging using a real localStorage dump.
- [ ] Open the staging frontend, walk through every section of `TEST_CHECKLIST.md`.

## Phase 3 · Prod cutover (1 day)

- [ ] In the legacy `index.html`, add the `<script src="https://rnd.<your-domain>/rnd-bundle.js">` and `<div id="hnx-rnd-root">` lines.
- [ ] Keep the old R&D IIFE in place for one release as a fallback.
- [ ] Monitor `[hnxCheckRND]` logs and the backend's `/health` for 48 h.
- [ ] When stable: delete the old IIFE block from `index.html` in the next release.

## Rollback plan

If the new R&D causes issues, the legacy IIFE is still in `index.html`. Revert the one-line `<script src=...>` and `<div>` additions, redeploy the host. New R&D goes back to being unreachable; old R&D resumes serving.

## Observability

- Backend: structured JSON logs to stdout. Pipe to Logtail / Datadog / Grafana Cloud.
- Frontend: window error handler posts to `/api/rnd/errors` (add this route — not in skeleton yet).
- Uptime: ping `/api/rnd/health` from UptimeRobot or Cloudflare health checks.
