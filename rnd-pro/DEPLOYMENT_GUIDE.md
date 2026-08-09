# Deployment guide

You can run this in three increasingly cloud-native shapes. Pick one:

## Option A — Local Docker (developer machine)

```sh
cd deployment
docker compose up --build
```

Result:
- Postgres → `localhost:5432`
- Backend → `http://localhost:8001`
- Frontend dev server → `http://localhost:5173`

The compose file auto-runs `migrations/001_init.sql` on first Postgres boot.

## Option B — Cloud (recommended: Cloudflare Pages + Fly + Neon)

| Layer | Provider | Why |
|---|---|---|
| Frontend bundle | **Cloudflare Pages** | You already use Cloudflare for the sync worker; one origin. |
| Backend API | **Fly.io** (or Render) | Python FastAPI with persistent volume, free hobby tier. |
| Postgres | **Neon** | Serverless, free tier, plays well with Fly. |
| Object storage | **Cloudflare R2** | You already have a bucket. |
| LLM | **OpenAI API key on the backend** (not browser) | One secret per environment. |

See `deployment/cloudflare-pages.md` for the click-through walkthrough. The relevant configs are `deployment/fly.toml` and `deployment/render.yaml`.

## Option C — Single VPS behind nginx

```sh
cd deployment
docker compose -f docker-compose.prod.yml up -d --build
```

Frontend bundle is served from `frontend/dist`, backend is on internal `8001`, nginx terminates TLS using certs in `deployment/certs/`.

---

## Environment variables

Copy `backend/.env.example` → `backend/.env`. Required keys:

- `DATABASE_URL` — Postgres connection string.
- `CORS_ORIGINS` — comma-separated list of frontend origins.
- `OPENAI_API_KEY` — DALL-E key (optional; leave blank to disable AI render).
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` — object storage.

Frontend `frontend/.env.example` → `frontend/.env`:

- `VITE_API_BASE` — public URL of the backend's `/api/rnd` prefix.

---

## Wiring into the legacy `index.html`

After building (`npm run build` produces `frontend/dist/rnd-bundle.js`):

```html
<!-- in the legacy index.html, anywhere in <body> -->
<script src="/static/rnd-bundle.js"></script>
<div id="hnx-rnd-root" style="display:none;"></div>
```

The bundle's `installShim()` runs immediately, overwriting `window.RND` with the new façade. The legacy R&D IIFE can be deleted from `index.html` after migration.

---

## Migration from existing localStorage

1. In Chrome DevTools on the running monolith console:
   ```js
   JSON.stringify({
     items: localStorage.getItem('hydroPro_rnd_items_v1'),
     subjects: localStorage.getItem('hydroPro_rnd_subjects_v1'),
     projects: localStorage.getItem('hydroPro_rnd_projects_v1'),
     assets: localStorage.getItem('hydroPro_rnd_assets_v1')
   })
   ```
   Save to `dump.json`.

2. Run:
   ```sh
   python3 scripts/migrate_localstorage.py dump.json http://localhost:8001 <tenant-uuid>
   ```

3. Confirm in the new frontend (`http://localhost:5173`) — every subject / project / item appears.
