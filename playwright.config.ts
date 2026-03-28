import { defineConfig, devices } from "@playwright/test";

const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : "http://127.0.0.1:3000";
const useExternalBaseUrl = Boolean(configuredBaseUrl && configuredBaseUrl.length > 0);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useExternalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
