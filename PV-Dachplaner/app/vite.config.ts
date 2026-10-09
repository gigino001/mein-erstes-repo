import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: { include: ["@pv-dachplaner/geometry-core > clipper-lib"] },
  build: { target: "es2022", sourcemap: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
