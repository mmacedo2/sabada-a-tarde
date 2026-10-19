import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type PluginOption } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// In development the API runs separately (`npm run dev` in api/ or docker compose).
const API_ORIGIN = process.env["API_ORIGIN"] ?? "http://127.0.0.1:8787";

export default defineConfig(({ command }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      // Fail the build if browser code imports server-only modules.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
  ];
  // Builds the site Worker into .output/, merging wrangler.jsonc into its config.
  if (command === "build") plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  plugins.push(viteReact());

  return {
    plugins,
    server: {
      host: "::",
      port: 8080,
      // Keep the Host header so the API's same-origin check sees the page's own host.
      proxy: { "/api": { target: API_ORIGIN, changeOrigin: false } },
    },
  };
});
