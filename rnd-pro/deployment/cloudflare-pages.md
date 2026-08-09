# Cloudflare Pages deployment (frontend only)

Since you already use a Cloudflare Worker for sync, host the frontend on Pages
and the backend on Workers (Python via PyOdide) OR on Fly/Render.

## Frontend (Pages)

1. Push the skeleton repo to GitHub.
2. In Cloudflare dashboard → Pages → Create project → Connect to Git.
3. Settings:
   - **Production branch**: `main`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/`
   - **Env vars**: `VITE_API_BASE=https://hnx-rnd-backend.fly.dev/api/rnd` (or wherever you host backend)
4. Custom domain (optional): `rnd.your-domain.com`.

## Inject into the legacy host

In `index.html` (the 17 MB monolith) add **only this**:

```html
<script src="https://your-rnd.pages.dev/rnd-bundle.js"></script>
<div id="hnx-rnd-root" style="display:none;"></div>
```

The shim immediately exposes `window.RND.*` so the existing host calls keep working.

## Backend on Fly.io

```sh
fly auth login
fly launch --config deployment/fly.toml --no-deploy
fly secrets set DATABASE_URL="postgres://..." OPENAI_API_KEY="sk-..."
fly deploy --config deployment/fly.toml
```

## Postgres on Neon

```sh
# 1. Create a Neon project at https://console.neon.tech
# 2. Copy the connection string.
# 3. Apply schema:
psql "<your-neon-url>" < migrations/001_init.sql
```
