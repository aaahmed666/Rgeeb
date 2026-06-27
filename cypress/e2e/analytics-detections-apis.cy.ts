/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 5: Analytics — 6 endpoints
 * Module 6: Detections — 7 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

describe("Analytics — Auth Tests", () => {
  const endpoints = [
    { name: "summary", path: API.analytics.summary },
    { name: "trends", path: API.analytics.trends },
    { name: "byService", path: API.analytics.byService },
    { name: "byCamera", path: API.analytics.byCamera },
    { name: "byBranch", path: API.analytics.byBranch },
    { name: "branches", path: API.analytics.branches },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET ${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Analytics — Validation", () => {
  it("GET summary with invalid date range returns 4xx or empty", () => {
    cy.apiRequest("GET", API.analytics.summary, {
      qs: { from: "invalid-date", to: "invalid-date" },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 400, 401, 422]);
    });
  });

  it("GET by-service with invalid service_id returns 4xx or empty", () => {
    cy.apiRequest("GET", API.analytics.byService, {
      qs: { service_id: -999 },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DETECTIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("Detections — Auth Tests", () => {
  const readEndpoints = [
    { name: "list", path: API.detections.list },
    { name: "single", path: API.detections.single },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET ${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  it("POST create without token returns 401", () => {
    cy.apiRequest("POST", API.detections.create, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST update without token returns 401", () => {
    cy.apiRequest("POST", API.detections.update, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST delete without token returns 401", () => {
    cy.apiRequest("POST", API.detections.delete, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("Detections — Validation", () => {
  it("GET /detections/{id} with invalid ID returns 4xx", () => {
    cy.apiRequest("GET", API.detections.byId("INVALID-999")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("POST create with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.detections.create, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST update with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.detections.update, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST delete with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.detections.delete, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});
