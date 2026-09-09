import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.PLAYWRIGHT_CHANNEL || "chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // DuckDB-WASM and PDF/OCR browser workers are intentionally resource-heavy. Running the
  // release gate in one Playwright worker prevents Chrome teardown races and cross-test pressure.
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/webkit-mobile.spec.ts",
      use: { ...devices["Desktop Chrome"], channel: browserChannel, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      testIgnore: ["**/webkit-mobile.spec.ts", "**/zh-lineation.spec.ts"],
      use: { ...devices["Desktop Chrome"], channel: browserChannel, viewport: { width: 1024, height: 768 } },
    },
    {
      name: "mobile",
      testIgnore: ["**/webkit-mobile.spec.ts", "**/zh-lineation.spec.ts"],
      use: { ...devices["Desktop Chrome"], channel: browserChannel, viewport: { width: 390, height: 844 }, isMobile: true },
    },
    {
      // D06 joins this project so the fragment landing and the 390px
      // no-overflow claim for the family labels are engine-real on iOS
      // Safari, not inferred from Chromium's text metrics.
      name: "iphone-webkit",
      testMatch: ["**/webkit-mobile.spec.ts", "**/circuit-index-groups.spec.ts", "**/ask-opener-switching.spec.ts", "**/groupconv-atlas.spec.ts"],
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
    {
      // F-05: WebKit never adds horizontal overflow scrollers to the tab
      // order on its own (Chromium does), and the rail-retraction focus race
      // must hold in both engines — this project runs exactly the keyboard-
      // access spec on desktop WebKit so those contracts are engine-real
      // without dragging the whole suite through a second browser.
      // D06 adds circuit-index-groups here for the same reason: the two
      // engines disagree on whether a fragment jump moves focus to a
      // focusable target, so the family jump's focus-only enhancement and
      // its no-JS fallback are both asserted on WebKit rather than assumed.
      name: "desktop-webkit",
      testMatch: ["**/keyboard-access.spec.ts", "**/circuit-index-groups.spec.ts", "**/groupconv-atlas.spec.ts"],
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
    // Task D05: zh lineation is asserted on rendered line boxes in both
    // engines; the spec resizes one page through every width itself, so the
    // desktop Chromium project plus this WebKit project cover the matrix.
    {
      name: "lineation-webkit",
      testMatch: ["**/zh-lineation.spec.ts", "**/zh-lineation-opaque.spec.ts"],
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
