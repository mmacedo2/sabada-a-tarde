# Local development only: runs the API in the same runtime as Cloudflare
# (workerd via `wrangler dev`) with a local D1 database and R2 bucket.
# workerd needs glibc, so this is Debian-based rather than Alpine.
FROM node:22-bookworm-slim

WORKDIR /app
ENV CI=true WRANGLER_SEND_METRICS=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8787
# Migrations and the seed are idempotent, so every start brings the database up to date.
CMD ["sh", "-c", "npm run db:migrate:local && npm run db:seed:local && npx wrangler dev -c wrangler.jsonc --ip 0.0.0.0 --port 8787 --var COOKIE_SECURE:false"]
