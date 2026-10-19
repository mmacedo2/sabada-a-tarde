# AGENTS.md

Sábado à Tarde: an independent website for popular football in Guimarães (results, standings,
competitions, clubs, news). Public repository, MIT licence.

## Layout

- `src/`: the website. React with TanStack Start, Tailwind, shadcn/ui. Uses Bun.
- `api/`: the API. Hono on Cloudflare Workers, with D1 (database) and R2 (images). Uses npm.
- `api/migrations/`: the database schema, as numbered SQL files.
- [DEVELOPMENT.md](DEVELOPMENT.md): local setup, commands and migrations. Read it before running anything.

## How every change ships

Every feature, fix and migration goes through these steps, in this order:

1. **Branch** from an up-to-date `main`. Never commit to `main` directly.
2. **Build it and pass the checks** below. API behaviour changes come with tests in `api/test/`.
3. **Set up the local environment** so the maintainer can test it: API, local database with any
   new migration applied, and the site, plus a short list of what to try. Use the `local-env` skill.
4. **Wait for the maintainer.** They test in the browser and say when they're satisfied. No
   commit, push or PR before that.
5. **Open the PR** with the `ship` skill: push, PR to `main`, CI green. Merge only when asked.
6. **Deploy only when asked**, in this order: migrations, then the API, then the site.

## Checks (the same ones CI runs)

```bash
bun run lint && bun run typecheck && bun run build      # repo root
cd api && npm run typecheck && npm test                  # API
```

## Rules

- **Migrations:** always a new numbered file, never an edit to one that ran in production.
  Migrations only add things, so the running code keeps working while they apply. To remove or
  rename something, first deploy code that stops using it, then drop it in a later migration.
- **Production:** don't run anything that touches production (`--remote`, `wrangler deploy`,
  `wrangler secret`, remote queries) unless the maintainer asks for that exact step.
- **Secrets** live in `api/.dev.vars` (git-ignored) and in Wrangler secrets. Never commit them.
- **Lockfiles** come from public npm only (`bunfig.toml` and `api/.npmrc` pin it). Before
  committing a lockfile, check it contains no private or company registry URLs.
- **Language:** the site's text is European Portuguese ("utilizador", "palavra-passe", "ecrã").
  Code, comments, commits and PRs are in English.
- **Commits:** conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`) and one topic
  per PR. PRs are merged with merge commits, not squashed.
- **No links to the official AFPG site** (afpguimaraes.com), in code or data.
