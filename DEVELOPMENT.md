# Sábado à Tarde: development and deployment

## Architecture

Everything runs on Cloudflare: two Workers, one D1 database and one R2 bucket.

```
browser ──► sabado-a-tarde-web (Worker)        TanStack Start: SSR pages + static assets
              │  /api/*  ──service binding──►  sabado-a-tarde-api (Worker, not public)
              │  SSR data ─service binding──►     Hono · D1 (SQLite) · R2 (uploaded images)
```

- **Frontend** (repo root): TanStack Start (Lovable UI). Pages load data in route `loader`s, so news
  and fixtures are server-rendered (good for SEO and for link previews on Facebook and WhatsApp).
  The admin area (`/admin/*`) renders only in the browser.
- **API** (`api/`): Hono on Workers. Public read endpoints, `/api/auth/*`, and `/api/admin/*`
  (admins only, checked on every request). The API is never exposed on its own URL: the web
  Worker forwards `/api/*` to it (`src/server.ts`), so the browser sees one origin. That means
  no CORS, and the session cookie is first-party (`HttpOnly`, `Secure`, `SameSite=Lax`).
- **Database**: D1. The schema lives in `api/migrations/` and every change is a new numbered file.
- **Images**: uploads go to R2 and are served from `/api/media/...`. Club crests and competition
  logos that ship with the site are in `public/`.

## Local development

You need Node 22+, Docker (or run the API with Node directly) and [Bun](https://bun.sh) for the
frontend (`brew install oven-sh/bun/bun`). Without installing Bun, `npx bun@1.3.0 <command>` works too.

```bash
# 1. API + local database (D1 and R2 are emulated by wrangler and stored in a Docker volume).
#    Migrations and the starter data are applied on every start; both are idempotent.
docker compose up -d --build

# 2. Create your admin (prompts for the password)
docker compose exec api npm run admin:create -- --email you@example.com --name "Your Name"

# 3. Frontend on the host. Vite proxies /api to localhost:8787.
bun install
bun run dev        # http://localhost:8080 (add `-- --port 3000` if 8080 is taken)
```

Without Docker, run the API directly: `cd api && npm ci && cp .dev.vars.example .dev.vars &&
npm run db:migrate:local && npm run db:seed:local && npm run dev`.

To reset the local database, run `docker compose down -v`. After changing code in `api/`, rebuild
the container with `docker compose up -d --build` (the code is copied into the image).

### Querying the database

Locally, D1 is a SQLite file that wrangler keeps inside the container
(`/app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`, in the `api-state` volume).

```bash
docker compose exec api npm run db:query:local -- "SELECT id, date, status, home_goals, away_goals FROM games LIMIT 10"
```

To browse it with a GUI (TablePlus, DB Browser for SQLite), copy a snapshot out and open the copy.
Don't write to the live file while the API is running.

```bash
docker compose exec api sh -c 'ls .wrangler/state/v3/d1/miniflare-D1DatabaseObject/'
docker compose cp api:/app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite ./local-db.sqlite
```

In production: `cd api && npm run db:query:remote -- "SELECT COUNT(*) FROM games"`, or the console in
the Cloudflare dashboard (Storage & Databases → D1 → sabado-a-tarde → Console). Prefer `SELECT`s
there; change data through the admin so the audit log records it.

### Tests and checks

```bash
cd api && npm test && npm run typecheck   # API tests run inside workerd with a real D1
npx tsc --noEmit && npx eslint .          # frontend (repo root)
```

## Database migrations

D1 applies the `.sql` files in `api/migrations/` in name order and records which ones ran.

1. Create the next file: `cd api && npx wrangler d1 migrations create DB add_player_number -c wrangler.jsonc`
   (creates `0002_add_player_number.sql`).
2. Write forward-only SQL. D1 has no "down" migrations. To undo a bad migration, write a new
   migration that reverses it, or restore the database with Time Travel (see RUNBOOK.md).
3. Apply locally (`npm run db:migrate:local`, or restart the container), then run `npm test`.
   The tests always run against all migrations.
4. Apply to production with `npm run db:migrate:remote`, **before** deploying code that needs the change.

Never edit a migration that has already run in production.

## Deploying to Cloudflare

See [RUNBOOK.md](RUNBOOK.md): first-time setup, routine deploys, backups, restores, rollbacks,
free-plan limits and troubleshooting.
