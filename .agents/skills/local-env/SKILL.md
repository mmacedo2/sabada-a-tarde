---
name: local-env
description: Bring up the local site, API and database so the maintainer can try a change in the browser before any PR. Use after building a feature, fix or migration, or when asked to run the app locally, test locally, set up a local env, or "deixa-me testar".
---

# Local environment for testing a change

The maintainer tests every change in the browser before it becomes a PR. Your job is to hand
over a running site with the change in it, plus a short list of what to try. Then wait.

## 1. Pass the checks first

```bash
make test
```

Fix failures before handing over. Don't ask someone to test code that CI would reject.

## 2. Start the API and the local database

```bash
make local_migration
```

It rebuilds the API image (the code and migrations are copied into it), starts the container,
waits for `/api/health`, and lists the applied migrations. Every start applies pending
migrations and the starter data to the database in the `api-state` volume, keeping existing
data. A new migration therefore runs against data that already exists, which is the realistic
test. To also test from an empty database: `make local_reset`, then `make local_migration`.

**Testing "Entrar com Google"?** That needs the `OIDC_*` values in `api/.dev.vars`, and the Docker
image leaves that file out. Run `make local_down`, then start the API directly:
`cd api && npm run db:migrate:local && npm run dev`. Google only accepts
`http://localhost:8080/api/auth/oidc/callback`, so the site must be on port 8080.

## 3. Start the site

```bash
make local_build_and_deploy_frontend          # http://localhost:8080
make local_build_and_deploy_frontend PORT=3000
```

It runs in the foreground, so start it in the background and leave it running while the
maintainer tests. If the port is taken, the target says by which process. Don't stop processes
you didn't start; use another `PORT` instead (Google sign-in then won't work).

## 4. Accounts for testing

`npm run admin:create` asks for the password in a terminal, which you can't type. Ask the
maintainer to create an account at `/entrar` → **Criar conta**, then give it the role the test
needs, in the local database:

```bash
make local_role EMAIL=<email> ROLE=admin      # or manager, user
```

## 5. Hand over

One short message with:

- **Where:** the local URL and the exact pages that changed.
- **What changed**, in a sentence.
- **What to try:** a numbered list covering the main path, the edge cases (empty data, wrong
  input, each role that sees it: user, manager, admin), and a phone-width window.
- **How to stop:** `make local_down` keeps the data; `make local_reset` deletes it.

## 6. Wait

Stop there. When the maintainer reports a problem, fix it, run `make test` again, rebuild what
changed (`make local_build_and_deploy_backend` for `api/`; the site reloads by itself), and tell
them to refresh. Move on to the `ship` skill only once they say they're satisfied.
