import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations("./migrations"),
          COOKIE_SECURE: "false",
          // A fake provider; test/oidc.test.ts answers its HTTP calls.
          OIDC_ISSUER: "https://idp.test",
          OIDC_CLIENT_ID: "client-1",
          OIDC_CLIENT_SECRET: "secret-1",
          OIDC_PROVIDER_NAME: "Google",
        },
      },
    })),
  ],
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
  },
});
