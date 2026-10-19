---
name: local-env
description: Bring up the local site, API and database so the maintainer can try a change in the browser before any PR. Use after building a feature, fix or migration, or when asked to run the app locally, test locally, set up a local env, or "deixa-me testar".
---

# Local environment for testing a change

The maintainer tests every change in the browser before it becomes a PR. Your job is to hand
over a running site with the change in it, plus a short list of what to try. Then wait.

## 1. Pass the checks first

```bash
bun run lint && bun run typecheck && bun run build
cd api && npm run typecheck && npm test
```

Fix failures before handing over. Don't ask someone to test code that CI would reject.

## 2. Start the API and the local database

Default, with Docker:

```bash
docker compose up -d --build      # rebuild: the API code is copied into the image
curl -s localhost:8787/api/health # {"ok":true}
```

Every start applies pending migrations and the starter data to the database in the
`api-state` volume, and existing data is kept. A new migration therefore runs against
data that already exists, which is the realistic test. Confirm it ran:

```bash
docker compose exec api npm run db:query:local -- "SELECT name FROM d1_migrations"
```

To also test from an empty database: `docker compose down -v && docker compose up -d --build`.

**Testing "Entrar com Google"?** That needs the `OIDC_*` values in `api/.dev.vars`, and the Docker
image leaves that file out. Stop the container (`docker compose down`) and run the API
directly: `cd api && npm run db:migrate:local && npm run dev`. The redirect URI registered at
Google is `http://localhost:8080/api/auth/oidc/callback`, so the site must be on port 8080.

## 3. Start the site

```bash
bun install        # only if package.json or bun.lock changed
bun run dev        # http://localhost:8080
```

Run it in the background so it keeps running while the maintainer tests. If port 8080 is
taken, use `bun run dev -- --port 3000`, but then Google sign-in won't work.

## 4. Accounts for testing

`npm run admin:create` asks for the password in a terminal, which you can't type. Ask the
maintainer to create an account at http://localhost:8080/entrar → **Criar conta**, then give it
the role the test needs, in the **local** database only:

```bash
docker compose exec api npm run db:query:local -- "UPDATE users SET role = 'admin' WHERE email = '<email>'"
```

Use `role = 'manager'` to test what a games manager sees. If the API runs without Docker, run the
same command as `cd api && npm run db:query:local -- "..."`. Never with `--remote`.

## 5. Hand over

One short message with:

- **Where:** http://localhost:8080 and the exact pages that changed.
- **What changed**, in a sentence.
- **What to try:** a numbered list covering the main path, the edge cases (empty data, wrong
  input, each role that sees it: user, manager, admin), and a phone-width window.
- **How to stop:** `docker compose down` keeps the data; `docker compose down -v` resets it.

## 6. Wait

Stop there. When the maintainer reports a problem, fix it, run the checks again, and tell them
to refresh. Move on to the `ship` skill only once they say they're satisfied.
