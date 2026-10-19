---
name: ship
description: Turn a change the maintainer has tested and approved into a pull request, get CI green, merge it when asked and deploy it when asked. Use when the maintainer says they're satisfied with a change, or asks to commit, open a PR, merge or deploy.
---

# Ship a tested change

Only start once the maintainer has tried the change locally (the `local-env` skill) and said
they're satisfied. If they haven't, go back to that skill.

## 1. Branch and checks

Work on a branch named after the change (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `ci/…`), cut
from an up-to-date `main`. Run the checks again:

```bash
make test
```

If a lockfile changed, it must only point at public npm:

```bash
grep -c 'https://' bun.lock                                              # expect 0
grep -o '"resolved": "https://[^/]*' api/package-lock.json | sort -u     # only registry.npmjs.org
```

## 2. Commit

- **Message:** a conventional first line (`feat(web): …`, `fix(api): …`). The body says why,
  not what the diff already shows.
- **Never commit** `api/.dev.vars`, build output (`.output/`, `dist/`) or local databases.

## 3. Pull request

```bash
git push -u origin <branch>
gh pr create --base main --title "<the commit's first line>" --body-file <file>
```

The body has three short sections:

- **What:** the change, from the user's side first.
- **Deploy:** a new migration (`db:migrate:remote` first), new secrets, or "nothing special".
- **Testing:** the checks that ran, and what the maintainer tried locally.

## 4. CI

```bash
gh pr checks <number> --watch
```

The `test-web` and `test-api` checks are required. Fix a failure with a new commit; never force-push.

## 5. Merge, only when asked

```bash
gh pr merge <number> --merge --admin
```

The maintainer can't approve their own PR, so merging uses the admin bypass, and only once
they've said to merge. The branch is deleted automatically.

## 6. Deploy, with the maintainer's approval

Merging to `main` starts the Deploy workflow. Its `approve` job waits for the maintainer, in
the run's page on GitHub (**Review deployments** → **production-approval** → **Approve and
deploy**). Give them the link:

```bash
gh run list --workflow Deploy --branch main --limit 1 --json url --jq '.[0].url'
```

Once approved, `deploy-api` applies migrations and deploys the API, then `deploy-web` deploys the
site. If `main` moved on while it waited, the jobs stop and the newer run deploys instead. The
tests don't run again: they passed on the PR. Follow it with `gh run watch <run-id>`.

The maintainer can also deploy from their machine with `make deploy` (in Claude Code:
`! make deploy`). It refuses to run from another branch, with uncommitted changes, or when `main`
differs from `origin/main`, and asks for confirmation in their terminal. Never run it yourself
with `CONFIRM=yes`. Single steps exist too: `make migration`, `make build_and_deploy_backend`,
`make build_and_deploy_frontend`.

Then check that `/api/health` on the live site returns `{"ok":true}` and that the changed pages
work. To undo a deploy: `npx wrangler rollback <version-id> --name sabado-a-tarde-web` (or
`-api`). A rollback does not undo a migration.
