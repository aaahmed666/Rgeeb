import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    setupNodeEvents(_on, _config) {
      // node-level event listeners
    },
  },
  video: false,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 15000,
  requestTimeout: 15000,
  responseTimeout: 30000,
  env: {
    AUTH_TOKEN: "",
    API_BASE_URL: "http://localhost:3000/api",
  },
});
