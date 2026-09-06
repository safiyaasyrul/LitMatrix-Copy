import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "DISABLE_HMR=true PORT=4173 pnpm run dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      // Keep Firefox in the matrix because Blob-backed downloads can differ
      // across engines. Its native GTK/X11 libraries are declared in the
      // workspace .replit file. Install the browser binaries with:
      // pnpm exec playwright install chromium firefox
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});