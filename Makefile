# Sábado à Tarde. Run `make help` to list the targets.
#
# Production targets change the live site. They only run from a clean `main` that matches
# origin/main, and they ask before doing anything unless CONFIRM=yes (the deploy workflow sets it).

SHELL := /bin/bash
.DEFAULT_GOAL := help

WRANGLER := npx wrangler@4.145.0
SEMGREP_IMAGE := semgrep/semgrep:1.181.0
GITLEAKS_IMAGE := ghcr.io/gitleaks/gitleaks:v8.30.1
# Local site port. Google sign-in only works on 8080, the redirect URI registered at Google.
PORT ?= 8080

.PHONY: help test test_lint test_unit test_build test_security test_sast test_secrets test_deps \
	deploy migration build_and_deploy_backend build_and_deploy_frontend _production_guard \
	local local_migration local_build_and_deploy_backend local_build_and_deploy_frontend \
	local_role local_logs local_down local_reset

help: ## Show this list
	@awk 'BEGIN {FS = ":.*## "} \
		/^##@/ {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)} \
		/^[a-z][a-z_]*:.*## / {printf "  \033[36m%-32s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

##@ Checks

test: test_lint test_unit test_build ## Everything CI runs

test_lint: ## Lint and type-check the site and the API
	bun run lint
	bun run typecheck
	cd api && npm run typecheck

test_unit: ## API tests (run inside workerd with a real D1)
	cd api && npm test

test_build: ## Production build of the site
	bun run build

test_security: test_sast test_secrets test_deps ## All three security checks below

test_sast: ## Static security analysis of the code (Semgrep, in Docker)
	docker run --rm -v "$(CURDIR):/src" -w /src $(SEMGREP_IMAGE) semgrep scan \
		--config p/default --config p/secrets --metrics=off --error --quiet \
		--exclude node_modules --exclude api/node_modules --exclude .output --exclude routeTree.gen.ts

test_secrets: ## Leaked secrets anywhere in the git history (Gitleaks, in Docker)
	docker run --rm -v "$(CURDIR):/repo" -w /repo $(GITLEAKS_IMAGE) git --redact --no-banner /repo

test_deps: ## Known high or critical vulnerabilities in what ships to production
	bun audit --prod --audit-level=high
	cd api && npm audit --omit=dev --audit-level=high

##@ Production (changes the live site)

deploy: test_lint test_unit _production_guard migration build_and_deploy_backend build_and_deploy_frontend ## Checks, then migrations, API and site, in that order

migration: _production_guard ## Apply new migrations to the production database
	cd api && npm run db:migrate:remote

build_and_deploy_backend: _production_guard ## Build and deploy the API Worker
	cd api && npm run deploy

build_and_deploy_frontend: _production_guard ## Build and deploy the site Worker
	bun run build
	$(WRANGLER) deploy

# Runs once per `make` call, however many production targets ask for it.
_production_guard:
	@branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$branch" != "main" ]; then \
		echo "Production deploys run from main, and this is $$branch."; exit 1; fi; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "Commit or stash your changes first: production only gets what is on main."; exit 1; fi; \
	git fetch -q origin main; \
	if [ "$$(git rev-parse HEAD)" != "$$(git rev-parse origin/main)" ]; then \
		echo "This main is not origin/main. Run git pull (or push) first."; exit 1; fi; \
	if [ "$(CONFIRM)" != "yes" ]; then \
		read -r -p "This changes the live site ($$(git rev-parse --short HEAD)). Continue? [y/N] " answer; \
		if [ "$$answer" != "y" ] && [ "$$answer" != "Y" ]; then echo "Cancelled."; exit 1; fi; fi

##@ Local (your machine only)

local: local_build_and_deploy_backend local_build_and_deploy_frontend ## API, database and site, at http://localhost:8080 (PORT=3000 to change)

local_build_and_deploy_backend: ## Rebuild and start the API and its local database (Docker), applying new migrations
	docker compose up -d --build
	@for i in $$(seq 1 90); do \
		if curl -sf localhost:8787/api/health >/dev/null; then echo "API ready at http://localhost:8787"; exit 0; fi; \
		sleep 1; done; \
	echo "The API did not start. See make local_logs"; exit 1

local_migration: local_build_and_deploy_backend ## Apply new migrations to the local database and list them
	docker compose exec api npm run db:query:local -- "SELECT id, name, applied_at FROM d1_migrations ORDER BY id"

local_build_and_deploy_frontend: ## Start the site at http://localhost:8080 (PORT=3000 to change; Ctrl+C stops it)
	@if lsof -nP -iTCP:$(PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "Port $(PORT) is in use:"; lsof -nP -iTCP:$(PORT) -sTCP:LISTEN | tail -n +2; \
		echo "Free it, or run with another port, e.g. make local PORT=3000"; exit 1; fi
	bun install --frozen-lockfile
	bun run dev --port $(PORT)

local_role: ## Give a local account a role: make local_role EMAIL=you@example.com ROLE=admin
	@if ! printf '%s' "$(EMAIL)" | grep -Eq '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$$'; then \
		echo "Usage: make local_role EMAIL=you@example.com ROLE=user|manager|admin"; exit 1; fi; \
	case "$(ROLE)" in user|manager|admin) ;; *) \
		echo "ROLE must be user, manager or admin."; exit 1;; esac
	docker compose exec api npm run db:query:local -- \
		"UPDATE users SET role = '$(ROLE)' WHERE email = '$(EMAIL)'; SELECT email, role FROM users WHERE email = '$(EMAIL)'"

local_logs: ## Follow the local API logs
	docker compose logs -f api

local_down: ## Stop the local API (the local database is kept)
	docker compose down

local_reset: ## Stop the local API and delete its database (fresh starter data next time)
	docker compose down -v
