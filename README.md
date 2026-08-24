# Ghayarak frontend

The real deployed version of the app — same code as the Claude artifact,
made runnable as an actual website via Vite.

## What's real vs. still-demo right now

- **Auth (sign in / sign up) is real** — it calls the actual backend at
  `https://ghayarak-backend-production.up.railway.app`, creates real users
  in the real Postgres database, issues real JWTs.
- **Everything else (listings, orders, seller center, admin) is still
  local demo data** — see the `window.storage` shim at the top of
  `src/App.jsx` for why, and `FRONTEND_INTEGRATION.md` (in the backend
  repo) for the plan to wire the rest of it up, screen by screen.

## Local development

```
npm install
npm run dev
```

## Deploying

Connect this repo to Vercel (or Netlify) — both auto-detect a Vite React
app with zero configuration. No environment variables needed on the
frontend side; the backend URL is currently hardcoded in `src/App.jsx`
(search for `API_BASE`) rather than pulled from a build-time env var —
worth changing to `import.meta.env.VITE_API_URL` once there's a staging
vs. production backend distinction to make.

## Known rough edges

- Tailwind is loaded via the CDN `<script>` tag in `index.html`, not a
  real PostCSS build. Fine for getting this live and testable; swap for
  a proper Tailwind build before a real launch.
- `window.storage` (shared/local demo persistence) is polyfilled with
  `localStorage`, which means it's per-browser, not actually shared
  across visitors the way the original Claude-artifact storage was.
