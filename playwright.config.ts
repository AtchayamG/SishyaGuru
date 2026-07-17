import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/foundation",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://localhost:3199" },
  webServer: {
    command: "npm run dev -- --port 3199",
    url: "http://localhost:3199",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
