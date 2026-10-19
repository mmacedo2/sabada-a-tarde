# Runbook: hosting Sábado à Tarde on Cloudflare

Everything runs on one personal Cloudflare account:

| Piece | Cloudflare product | Name |
|---|---|---|
| Website (pages, SSR, static files) | Worker | `sabado-a-tarde-web` |
| API (data, login, admin) | Worker, **no public URL** | `sabado-a-tarde-api` |
| Database | D1 | `sabado-a-tarde` |
| Uploaded images | R2 bucket | `sabado-a-tarde-media` |

The site Worker forwards `/api/*` to the API Worker through a service binding, so only the site is
on the internet. Cost: €0 within the free tiers (see [Limits](#limits-and-costs)); R2 requires a
card on file even when usage stays free.

All commands run on your Mac. `api$` means "from the `api/` folder", `root$` means "from the repo root".

---

## 1. One-time setup (dashboard)

This section builds everything by clicking in <https://dash.cloudflare.com>, so you can see each
piece. Dashboard labels move around now and then; if one differs, look for the same words nearby.

Clicks can't do two things, so those steps use the terminal:
- **Uploading the code.** The site is about 80 JavaScript modules plus static files; the dashboard
  editor only handles a single-file Worker.
- **Creating the tables.** `wrangler d1 migrations apply` records each migration in a `d1_migrations`
  table. SQL pasted into the dashboard console would create the tables without that record, and the
  next migration run would fail trying to create them again.

What stays in code: **bindings** (which database, bucket and Worker each Worker can use) are declared
in `wrangler.jsonc`, and every deploy replaces the dashboard's bindings with the file's. Look at them
in the dashboard, but change them in the file.

### 1.1 Account and workers.dev subdomain

1. Sign up at <https://dash.cloudflare.com/sign-up> with your personal email and verify it.
2. Left sidebar → **Compute (Workers)** → **Workers & Pages**. The first visit asks you to choose a
   **workers.dev subdomain** (for example `sabadoatarde`). Your site will be at
   `https://sabado-a-tarde-web.<subdomain>.workers.dev`.
3. Note the **Account ID** shown on the right of the Workers & Pages overview (or under the account
   name on the home page). Terraform and GitHub Actions will need it later.

### 1.2 Database (D1)

1. Sidebar → **Storage & databases** → **D1 SQL database** → **Create database**.
2. Name: `sabado-a-tarde`. Location: **Western Europe** (closest to Guimarães). → **Create**.
3. On the database page, copy the **Database ID** and paste it into `api/wrangler.jsonc`:
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "sabado-a-tarde",
       "database_id": "<paste here>",
       "migrations_dir": "migrations"
     }
   ],
   ```
   The ID is not a secret, so commit it.
4. Look around: **Console** runs SQL, **Metrics** shows rows read and written (the free-plan limits),
   **Time Travel** shows restore points. All empty for now.

### 1.3 Image storage (R2)

1. Sidebar → **Storage & databases** → **R2 object storage**. The first visit asks you to add the R2
   subscription with a card, even though usage up to 10 GB is free.
2. **Create bucket** → name `sabado-a-tarde-media`, location **Automatic** (or Western Europe),
   storage class **Standard** (the free tier only covers Standard) → **Create bucket**.
3. Leave **Public access** off. Images are served through the API at `/api/media/…`, so the bucket
   never needs a public URL.
4. Account menu (top right) → **Notifications** → **Add** → **Usage based billing**: get an email if
   anything starts costing money.

> **No card?** Skip this section and say so. Uploads have to become optional first (the API can't
> deploy with an R2 binding to a bucket that doesn't exist). Crests and covers then use pasted
> image URLs.

### 1.4 Tables, starter data and your admin account (terminal)

```bash
api$ npm ci
api$ npx wrangler login          # opens the browser: approve access for your personal account
api$ npx wrangler whoami         # must show your personal account
api$ npm run db:migrate:remote   # creates the tables and records 0001 in d1_migrations
api$ npm run db:seed:remote      # 2026/27 clubs, competitions, fixtures, documents
api$ npm run admin:create -- --email you@example.com --name "Your Name" --remote
```

If `whoami` lists more than one account, `export CLOUDFLARE_ACCOUNT_ID=<id from 1.1>` first.

Back in the dashboard: D1 → `sabado-a-tarde` → **Console**, run
`SELECT COUNT(*) FROM games;` → 83. The **Tables** view now lists `games`, `clubs`, `users` and so on.

### 1.5 Upload the code (terminal)

API first: the site's service binding must point at an API Worker that already exists.

```bash
api$  npm test && npm run deploy
root$ bun run build
root$ npx wrangler@4.145.0 deploy
```

### 1.6 See what you built (dashboard)

**Workers & Pages** now lists two Workers. Open each one:

| Where | `sabado-a-tarde-api` | `sabado-a-tarde-web` |
|---|---|---|
| **Bindings** tab | `DB` → D1 `sabado-a-tarde`, `MEDIA` → R2 `sabado-a-tarde-media`, variable `COOKIE_SECURE` | `API` → service `sabado-a-tarde-api`, `ASSETS` (the static files) |
| **Settings → Domains & Routes** | workers.dev **disabled**: no public URL, reachable only through the binding | workers.dev **enabled**: this is the site |
| **Deployments** | Each deploy is a version. **Rollback** to any earlier one is a click here. | Same |
| **Observability** | API logs: requests, errors, `console.error` output | SSR logs |

Each Worker's overview also draws the architecture: web → API → D1 and R2.

### 1.7 Smoke test

On `https://sabado-a-tarde-web.<subdomain>.workers.dev`:

1. `/api/health` returns `{"ok":true}`. This proves the site → API binding.
2. The home page shows fixtures and the standings. This proves SSR → API → D1.
3. **Entrar** → log in → `/admin`. A login that returns error **1102** means the CPU limit was hit
   (see [Troubleshooting](#troubleshooting)).
4. **Notícias → Nova notícia**: upload a cover, publish, open it on the site, then delete it.
   This proves R2 and admin writes. The image appears in R2 → bucket → **Objects** under `uploads/`.
5. Watch `sabado-a-tarde-api` → **Observability** for errors while you click around.

### 1.8 Your own domain (optional)

1. Home → **Add a domain** (or **Onboard a domain**) → enter the domain → plan **Free**. If you buy it
   in Cloudflare (**Domain Registration → Register Domains**) this step is automatic.
2. For a domain bought elsewhere: Cloudflare shows two nameservers. Set them at your registrar and
   wait for the domain to become **Active** (minutes to hours).
3. **Workers & Pages** → `sabado-a-tarde-web` → **Settings** → **Domains & Routes** → **Add** →
   **Custom domain** → `sabadoatarde.pt` → **Add domain**. Cloudflare creates the DNS record and the
   certificate. The hostname must not already have a CNAME record.
4. A custom domain matches one exact hostname. To also serve `www.`, add it as a second custom domain,
   or add a redirect rule from `www` to the bare domain.

### 1.9 Sign in and registration with Google (optional)

"Entrar com Google" lets anyone create an account on the site with the `user` role. An existing
account (yours, for example) is linked by its email the first time it signs in with Google, as
long as Google has verified that email. Admin rights are still only given in Admin → Utilizadores.
The button appears only when the three settings below are set. Any OpenID Connect provider works the
same way; only the issuer changes.

1. <https://console.cloud.google.com> → create a project → **Google Auth Platform** → **Branding**:
   app name, support email. **Audience**: External, then **Publish app** (in Testing, only listed
   test users can sign in).
2. **Clients** → **Create client** → Web application. **Authorized redirect URIs**, one per address
   the site runs on:
   - `https://sabado-a-tarde-web.<subdomain>.workers.dev/api/auth/oidc/callback`
   - `https://sabadoatarde.pt/api/auth/oidc/callback` (each custom domain)
   - `http://localhost:8080/api/auth/oidc/callback` (local development)
3. Give the API Worker the client's values:
   ```bash
   api$ npx wrangler secret put OIDC_ISSUER -c wrangler.jsonc          # https://accounts.google.com
   api$ npx wrangler secret put OIDC_CLIENT_ID -c wrangler.jsonc
   api$ npx wrangler secret put OIDC_CLIENT_SECRET -c wrangler.jsonc
   api$ npx wrangler secret put OIDC_PROVIDER_NAME -c wrangler.jsonc   # Google
   ```
   Locally, put the same lines in `api/.dev.vars` and run the API with `npm run dev` in `api/`
   (the Docker image leaves `.dev.vars` out).

To turn it off again, delete all three of `OIDC_ISSUER`, `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET`
(`npx wrangler secret delete <name> -c wrangler.jsonc`): with only some of them set, the API logs
an error and the button disappears. Accounts created through Google can then sign in only after an
admin sets them a password.

### Doing the same from the terminal

| Dashboard step | Command |
|---|---|
| 1.2 Create database | `api$ npx wrangler d1 create sabado-a-tarde --location weur` |
| 1.3 Create bucket | `api$ npx wrangler r2 bucket create sabado-a-tarde-media --location weur` |
| Console query | `api$ npm run db:query:remote -- "SELECT …"` |
| Rollback | `npx wrangler rollback <version-id> --name sabado-a-tarde-web` |

---

## 2. Routine operations

### Deploy a change

```bash
api$  npm test && npm run typecheck
api$  npm run db:migrate:remote     # only if api/migrations/ has a new file
api$  npm run deploy                # only if api/ changed
root$ bun run build && npx wrangler@4.145.0 deploy   # only if the site changed
```

Always in this order: **migrations → API → site**. New code can rely on new columns, and old code
keeps working on the new schema because migrations only add things. If a migration removes or
renames something, deploy the code that stops using it first, then the migration in a later deploy.

### Change the database schema

1. `api$ npx wrangler d1 migrations create DB <what_changes> -c wrangler.jsonc`
2. Write the SQL, run `docker compose up -d --build` locally and `npm test`.
3. Deploy as above. Never edit a migration that already ran in production.

### Back up

D1 keeps 7 days of point-in-time history on the free plan (Time Travel). For anything older, export
regularly, for example every Monday:

```bash
api$ npx wrangler d1 export sabado-a-tarde --remote --output backups/$(date +%F).sql -c wrangler.jsonc
```

`api/backups/` is git-ignored: exports contain emails and password hashes. Keep them somewhere
private, such as an encrypted disk or a password-manager attachment. Uploaded images live in R2 and
are not part of this export.

### Restore the database

Restoring replaces the whole database, including changes made after that moment.

```bash
api$ npx wrangler d1 time-travel info sabado-a-tarde -c wrangler.jsonc                                  # current bookmark: note it to undo the restore
api$ npx wrangler d1 time-travel restore sabado-a-tarde --timestamp=2026-10-18T14:00:00Z -c wrangler.jsonc
```

From an export older than 7 days: create a new database, import the file
(`npx wrangler d1 execute <new-db> --remote --file backups/<date>.sql`), point `database_id` at it
and redeploy the API.

### Roll back code

```bash
api$ npx wrangler deployments list --name sabado-a-tarde-web
api$ npx wrangler rollback <version-id> --name sabado-a-tarde-web -m "why"
```

Same for `sabado-a-tarde-api`. A rollback doesn't undo migrations, which is another reason they
only ever add things.

### Locked out of the admin

Run `admin:create` again with your email. It resets the password and restores the admin role:

```bash
api$ npm run admin:create -- --email you@example.com --name "Your Name" --remote
```

### Logs and usage

- Live logs: `npx wrangler tail sabado-a-tarde-web` / `sabado-a-tarde-api` (add `--status error`).
- History: Dashboard → Workers → the Worker → **Observability** (enabled in both configs).
- Usage against the free limits: Dashboard → Workers & Pages (requests) and D1 → `sabado-a-tarde`
  → Metrics (rows read and written).
- Who changed what: the **Registo** page in the admin.

---

## Limits and costs

| | Free plan | When it would bite |
|---|---|---|
| Workers requests | 100,000 per day (site + API) | A big match day with many people on live scores polling every 20 s |
| Workers CPU | 10 ms per request | Login (password hashing is about 13 ms) |
| D1 | 5M rows read and 100k written per day, 500 MB per database | Over the daily limit, queries fail until midnight UTC |
| D1 Time Travel | 7 days | Older restores need your own exports |
| R2 | 10 GB, free egress | Only admins can upload, 5 MB per image |

**Workers Paid** ($5/month) raises all of the above (30 days of Time Travel, no 10 ms CPU limit,
10M requests a month). Upgrade when one of these starts to bite. Nothing in the code changes.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Site deploy fails mentioning service `sabado-a-tarde-api` | API not deployed yet, or deployed to another account | Deploy the API first, then check `wrangler whoami` |
| Error **1102** "Worker exceeded resource limits" on login | 10 ms CPU limit on the free plan | Try again (it's intermittent), or move to Workers Paid |
| Admin actions fail with "Pedido de outra origem recusado" | Request reached the API with a different Host than its Origin | Always use the site's address; don't call the API through another domain or proxy |
| Pages load but show an error, and `tail` shows `no such table` | Migrations not applied to the remote database | `npm run db:migrate:remote` |
| Everything returns errors after a busy day | D1 daily row limit reached | Wait for 00:00 UTC, or upgrade |
| `wrangler` prompts for an account or uses the wrong one | Logged into several accounts | `export CLOUDFLARE_ACCOUNT_ID=…` |
