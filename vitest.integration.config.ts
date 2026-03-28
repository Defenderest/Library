import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    name: "integration",
    environment: "node",
    globals: false,
    passWithNoTests: true,
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
