/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 20: Foodics Integration — 29 endpoints (largest module)
 */

// ═══════════════════════════════════════════════════════════════════════════
// FOODICS — AUTH TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Foodics — Auth Tests", () => {
  const readEndpoints = [
    { name: "status", path: API.foodics.status },
    { name: "orders", path: API.foodics.orders },
    { name: "refunds", path: API.foodics.refunds },
    { name: "drawerAudits", path: API.foodics.drawerAudits },
    { name: "prepTime", path: API.foodics.prepTime },
    { name: "branches", path: API.foodics.branches },
    { name: "health", path: API.foodics.health },
    { name: "conversionDaily", path: API.foodics.conversionDaily },
    { name: "conversionHourly", path: API.foodics.conversionHourly },
    { name: "conversionSummary", path: API.foodics.conversionSummary },
    { name: "dashboardInsights", path: API.foodics.dashboardInsights },
    { name: "dashboardOverview", path: API.foodics.dashboardOverview },
    { name: "dashboardTrends", path: API.foodics.dashboardTrends },
    { name: "ordersSummary", path: API.foodics.ordersSummary },
    { name: "drawerAuditsPatterns", path: API.foodics.drawerAuditsPatterns },
    { name: "drawerAuditsStats", path: API.foodics.drawerAuditsStats },
    { name: "prepTimesHeatmap", path: API.foodics.prepTimesHeatmap },
    { name: "prepTimesStats", path: API.foodics.prepTimesStats },
    { name: "prepTimesSummary", path: API.foodics.prepTimesSummary },
    { name: "refundVerificationsStats", path: API.foodics.refundVerificationsStats },
    { name: "branchesCustomersServed", path: API.foodics.branchesCustomersServed },
    { name: "inventoryZones", path: API.foodics.inventoryZones },
    { name: "inventoryAudits", path: API.foodics.inventoryAudits },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET foodics/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  const writeEndpoints = [
    { name: "connect", path: API.foodics.connect },
    { name: "disconnect", path: API.foodics.disconnect },
    { name: "importBranches", path: API.foodics.importBranches },
    { name: "ordersSync", path: API.foodics.ordersSync },
    { name: "drawerOperationsSync", path: API.foodics.drawerOperationsSync },
    { name: "inventoryAudit", path: API.foodics.inventoryAudit },
  ];

  writeEndpoints.forEach(({ name, path }) => {
    it(`POST foodics/${name} without token returns 401`, () => {
      cy.apiRequest("POST", path, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FOODICS — VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

describe("Foodics — Validation", () => {
  it("POST connect with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.foodics.connect, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST import-branches with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.foodics.importBranches, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST inventory/audit with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.foodics.inventoryAudit, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST orders/sync with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.foodics.ordersSync, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST drawer-operations/sync with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.foodics.drawerOperationsSync, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});
