/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 19: Report Center — 12 endpoints
 * Module 20: Statistics/Reports — 7 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// REPORT CENTER
// ═══════════════════════════════════════════════════════════════════════════

describe("ReportCenter — Auth Tests", () => {
  const readEndpoints = [
    { name: "list", path: API.reportCenter.list },
    { name: "single", path: API.reportCenter.single },
    { name: "scheduled", path: API.reportCenter.scheduled },
    { name: "templates", path: API.reportCenter.templates },
    { name: "generated", path: API.reportCenter.generated },
    { name: "statistics", path: API.reportCenter.statistics },
    { name: "visitorCountToday", path: API.reportCenter.visitorCountToday },
    { name: "visitorCountByDate", path: API.reportCenter.visitorCountByDate },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET reportCenter/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  const writeEndpoints = [
    { name: "generate", path: API.reportCenter.generate },
    { name: "schedule", path: API.reportCenter.schedule },
    { name: "scheduleDelete", path: API.reportCenter.scheduleDelete },
    { name: "generatedDelete", path: API.reportCenter.generatedDelete },
  ];

  writeEndpoints.forEach(({ name, path }) => {
    it(`POST reportCenter/${name} without token returns 401`, () => {
      cy.apiRequest("POST", path, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("ReportCenter — Validation", () => {
  it("POST generate with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.reportCenter.generate, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST schedule with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.reportCenter.schedule, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST schedule/delete with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.reportCenter.scheduleDelete, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS / REPORTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Statistics — Auth Tests", () => {
  const endpoints = [
    { name: "statistics", path: API.reports.statistics },
    { name: "customers", path: API.reports.customers },
    { name: "suppliers", path: API.reports.suppliers },
    { name: "sales", path: API.reports.sales },
    { name: "purchases", path: API.reports.purchases },
    { name: "inventory", path: API.reports.inventory },
    { name: "financials", path: API.reports.financials },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET reports/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});
