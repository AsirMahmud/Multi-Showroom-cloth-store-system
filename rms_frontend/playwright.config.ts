import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node scripts/start-e2e-backend.mjs",
      url: "http://127.0.0.1:8001/admin/login/",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "node scripts/start-e2e-frontend.mjs",
      url: "http://127.0.0.1:3100/login",
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
