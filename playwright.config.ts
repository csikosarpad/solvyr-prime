import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    ...devices["Desktop Chrome"],
    channel: "chromium",
    baseURL: "http://127.0.0.1:5173",
    locale: "en-US",
    reducedMotion: "reduce",
    // screenshot: "off",
    // screenshot: "only-on-failure",
    // trace: "off",
    // video: "off",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
