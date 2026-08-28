import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "node",
    // e2e/ holds Playwright specs, run via `npm run test:e2e`, not Vitest.
    exclude: ["node_modules/**", "e2e/**"],
  },
});
