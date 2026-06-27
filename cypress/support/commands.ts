/// <reference types="cypress" />

/**
 * Custom Cypress commands for the Rgeeb test suite.
 *
 * - cy.login()         — plant auth token
 * - cy.apiRequest()    — authenticated API request wrapper
 * - cy.assertNoDummy() — scan response for dummy/mock data
 */

import { scanForDummy } from "./helpers";

const TOKEN_KEY = "app.auth.token";
const REMEMBER_KEY = "app.auth.remember";
const FAKE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjMiLCJuYW1lIjoiQ3lwcmVzcyBUZXN0IiwiZXhwIjozMjUwMzY4MDAwMH0." +
  "fake_signature_for_testing";

// ── cy.login() ────────────────────────────────────────────────────────────
Cypress.Commands.add("login", () => {
  cy.window().then((win) => {
    win.localStorage.setItem(REMEMBER_KEY, "true");
    win.localStorage.setItem(TOKEN_KEY, Cypress.env("AUTH_TOKEN") ?? FAKE_TOKEN);
  });
});

// ── cy.apiRequest() ───────────────────────────────────────────────────────
Cypress.Commands.add(
  "apiRequest",
  (
    method: string,
    url: string,
    options?: { body?: unknown; qs?: Record<string, unknown>; token?: string | false },
  ) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options?.token !== false) {
      headers.Authorization = `Bearer ${options?.token ?? Cypress.env("AUTH_TOKEN") ?? FAKE_TOKEN}`;
    }
    if (options?.body) {
      headers["Content-Type"] = "application/json";
    }
    return cy.request({
      method: method as Cypress.HttpMethod,
      url,
      failOnStatusCode: false,
      headers,
      body: options?.body as Cypress.RequestBody,
      qs: options?.qs as Record<string, string>,
    });
  },
);

// ── cy.assertNoDummy() ───────────────────────────────────────────────────
Cypress.Commands.add("assertNoDummy", { prevSubject: false }, (body: unknown) => {
  const found = scanForDummy(body);
  expect(found, `Dummy data detected: "${found}"`).to.be.null;
});

// ── Type augmentation ─────────────────────────────────────────────────────
declare global {
  namespace Cypress {
    interface Chainable {
      /** Plant a fake auth token to skip login redirect. */
      login(): Chainable<void>;

      /** Authenticated API request wrapper. Set token=false for unauthenticated. */
      apiRequest(
        method: string,
        url: string,
        options?: {
          body?: unknown;
          qs?: Record<string, unknown>;
          token?: string | false;
        },
      ): Chainable<Cypress.Response<unknown>>;

      /** Assert the given body contains no dummy/placeholder data. */
      assertNoDummy(body: unknown): Chainable<void>;
    }
  }
}

export {};
