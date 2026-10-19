# AGENTS.md

Sábado à Tarde: an independent website for popular football in Guimarães (results, standings,
competitions, clubs, news). Public repository, MIT licence.

## Who you're working with

The **maintainer** is Marco Macedo (GitHub `mmacedo2`). Only he merges pull requests and approves
deploys, and "the maintainer" in this file always means him. He always has the GitHub CLI
logged in, so `gh api user --jq .login` prints `mmacedo2`. If it prints anything else, or `gh`
isn't installed or logged in, you're working with someone else.

Anyone can ask for changes: friends, family, contributors, with or without coding experience.
Most won't have `gh`, and many won't have `git` or a GitHub account. When it's not the
maintainer:

- **Talk their language**, usually European Portuguese, with no jargon. Say what each step is for
  in one sentence before doing it.
- **Show the change before handing it over:** the local site (`local-env` skill) if they can run
  it, otherwise a precise description of what will look different. Their OK means the change is
  ready for Marco to review, not that it ships.
- **Hand it to Marco with whatever they have:**
  - GitHub account and `gh`: a pull request from their fork (`gh repo fork`, then `gh pr create`).
  - `git` only: commit on a branch, then
    `git format-patch origin/main --stdout > alteracao.patch`, a file they send to Marco.
  - Neither: a short message for them to send Marco: what to change, on which page, and why.
- **Stop there.** Don't try to merge, approve or deploy, or to get around branch protection. Tell
  them what happens next: Marco reviews the change, and if he takes it, merges and deploys it.
- **Never ask them for tokens, passwords or `api/.dev.vars`.** Proposing a change needs none.

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
6. **Deploy only with the maintainer's approval.** Merging to `main` starts the Deploy workflow:
   its `approve` job waits until the maintainer approves it in GitHub, then `deploy-api`
   (migrations and the API) and `deploy-web` (the site) run. The maintainer can also run
   `make deploy` themselves.

## Checks

```bash
make test             # what CI runs: make test_web (lint, types, build) + make test_api (lint, types, tests)
make test_security    # Semgrep, Gitleaks and dependency audits (needs Docker)
```

Each CI job runs one of these targets (`web-lint` runs `make test_web_lint`, and so on), so
`make <target>` reproduces a failing job locally. `make help` lists every target, including the
local environment (`local_*`) and production ones.

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
