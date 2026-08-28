import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// This dev sandbox pre-installs Chromium at a fixed path instead of letting
// Playwright download its own. Fall back to Playwright's normal managed
// browser everywhere else (CI, a contributor's machine), so this config
// isn't sandbox-specific.
const sandboxChromium = "/opt/pw-browsers/chromium";
const chromiumLaunchOptions = existsSync(sandboxChromium)
  ? { executablePath: sandboxChromium }
  : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /touch-controls\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumLaunchOptions,
      },
    },
    {
      // Android preset defaults to Chromium (unlike iPhone presets, which
      // default to WebKit — not installed in this sandbox) and gives us
      // hasTouch/isMobile for real touch-event testing.
      name: "mobile",
      testMatch: /touch-controls\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        launchOptions: chromiumLaunchOptions,
      },
    },
  ],
});
