import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    name: "unit",
    environment: "jsdom",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    exclude: ["tests/e2e/**", "tests/integration/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage/unit",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
    },
  },
});
