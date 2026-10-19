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
   migration that reverses it, or restore the database with Time Travel (below).
3. Apply locally (`npm run db:migrate:local`, or restart the container), then run `npm test`.
   The tests always run against all migrations.
4. Apply to production with `npm run db:migrate:remote`, **before** deploying code that needs the change.

Never edit a migration that has already run in production.

## Deploying to Cloudflare (first time)

Run these from your machine with your personal Cloudflare account.

1. **Account.** Sign up at dash.cloudflare.com. The Workers Free plan is enough to start.
2. **Log in Wrangler.** `cd api && npx wrangler login`, then `npx wrangler whoami` to confirm it's
   the right account.
3. **Create the database.** `npx wrangler d1 create sabado-a-tarde`. Copy the printed
   `database_id` into `api/wrangler.jsonc` under `d1_databases`.
4. **Create the bucket.** Enable R2 in the dashboard (Cloudflare may ask for a payment method even
   for free-tier usage), then run `npx wrangler r2 bucket create sabado-a-tarde-media`.
5. **Schema and starter data.**
   ```bash
   npm ci
   npm run db:migrate:remote
   npm run db:seed:remote
   npm run admin:create -- --email you@example.com --name "Your Name" --remote
   ```
6. **Deploy the API.** `npm run deploy`. It has no public URL (`workers_dev: false`), which is intended.
7. **Deploy the site.** From the repo root:
   ```bash
   bun run build
   npx wrangler@4.145.0 deploy   # uses the config generated in .output/
   ```
   It is served at `https://sabado-a-tarde-web.<your-subdomain>.workers.dev`.
8. **Custom domain (optional).** In the dashboard, open Workers → `sabado-a-tarde-web` → Settings →
   Domains & Routes → add your domain (it must be on Cloudflare DNS).
9. **Check it works.** Open `/entrar`, log in, and open `/admin`.

After that, deploy in this order: migrations (if any), then the API, then the site.

### Free-plan limits worth knowing

- **Workers:** 100,000 requests per day and **10 ms CPU per request**. Password hashing
  (PBKDF2, 100k iterations) is close to that limit, so a login can occasionally fail with error
  1102. If that happens, Workers Paid ($5/month) removes the limit. Reading pages is well within it.
- **D1:** 5M rows read and 100k rows written per day, 500 MB per database. Over the limit, queries
  fail until midnight UTC.
- **R2:** 10 GB storage and free egress.
- **Backups:** D1 Time Travel restores to any minute in the last 7 days on Free (30 on Paid):
  `npx wrangler d1 time-travel restore sabado-a-tarde --timestamp=<RFC3339> -c wrangler.jsonc`.
