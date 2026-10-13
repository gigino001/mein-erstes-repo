import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  // geometry-core liegt außerhalb von app/: seine Abhängigkeit kommt aus app/node_modules (auch im frischen Klon)
  resolve: { alias: { "clipper-lib": fileURLToPath(new URL("./node_modules/clipper-lib/clipper.js", import.meta.url)) } },
  optimizeDeps: { include: ["clipper-lib"] },
  build: { target: "es2022", sourcemap: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
