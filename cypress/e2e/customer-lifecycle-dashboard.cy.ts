/// <reference types="cypress" />

/**
 * Customer Lifecycle — Dashboard Page Tests
 *
 * The dashboard page calls 7 endpoints simultaneously:
 *   dashboardStats, customerGrowth, subscriptionTiers,
 *   statusDistribution, onboardingEfficiency, customerDistribution, lifecycleStatus
 */

const CL_DASH = {
  dashboardStats: "/api/customer-lifecycle/dashboard-stats",
  customerGrowth: "/api/customer-lifecycle/customer-growth",
  subscriptionTiers: "/api/customer-lifecycle/subscription-tiers",
  statusDistribution: "/api/customer-lifecycle/status-distribution",
  onboardingEfficiency: "/api/customer-lifecycle/onboarding-efficiency",
  customerDistribution: "/api/customer-lifecycle/distribution",
  lifecycleStatus: "/api/customer-lifecycle/lifecycle-status",
};

function interceptAllDashboard() {
  cy.intercept("GET", `${CL_DASH.dashboardStats}*`, { fixture: "customer-lifecycle/dashboard-stats.json" }).as("dashStats");
  cy.intercept("GET", `${CL_DASH.customerGrowth}*`, { fixture: "customer-lifecycle/customer-growth.json" }).as("growth");
  cy.intercept("GET", `${CL_DASH.subscriptionTiers}*`, { fixture: "customer-lifecycle/subscription-tiers.json" }).as("tiers");
  cy.intercept("GET", `${CL_DASH.statusDistribution}*`, { body: [
    { label: "Active Deployment", count: 842, color: "var(--status-success)" },
    { label: "Setting Up", count: 118, color: "var(--status-info)" },
  ] }).as("statusDist");
  cy.intercept("GET", `${CL_DASH.onboardingEfficiency}*`, { body: {
    velocity: 78, avgDays: 14.2, trend: 2.4, trendLabel: "On Target",
  } }).as("onboarding");
  cy.intercept("GET", `${CL_DASH.customerDistribution}*`, { body: [
    { name: "Retail", value: 38, color: "var(--chart-1)" },
    { name: "Healthcare", value: 22, color: "var(--chart-2)" },
  ] }).as("distribution");
  cy.intercept("GET", `${CL_DASH.lifecycleStatus}*`, { body: [
    { stage: "Active", count: 842, color: "var(--status-success)", percentage: 57 },
    { stage: "Onboarding", count: 234, color: "var(--status-info)", percentage: 16 },
  ] }).as("lifecycleStatus");
}

describe("Customer Lifecycle — Dashboard Page", () => {
  describe("Success", () => {
    beforeEach(() => {
      interceptAllDashboard();
      cy.visit("/dashboard/customer-lifecycle", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle");
    });

    it("fires all 7 dashboard API calls", () => {
      cy.wait("@dashStats");
      cy.wait("@growth");
      cy.wait("@tiers");
      cy.wait("@statusDist");
      cy.wait("@onboarding");
      cy.wait("@distribution");
      cy.wait("@lifecycleStatus");
    });

    it("renders KPI cards with fixture data", () => {
      cy.wait("@dashStats");
      // Total Customers = 1482 from fixture
      cy.contains("1,482").should("exist");
    });

    it("renders growth chart (recharts SVG)", () => {
      cy.wait("@growth");
      cy.get(".recharts-line, .recharts-area, .recharts-bar").should("exist");
    });

    it("renders subscription tiers chart", () => {
      cy.wait("@tiers");
      cy.get(".recharts-pie, .recharts-bar").should("exist");
    });
  });

  describe("Error fallback", () => {
    it("page still renders when dashboardStats returns 500", () => {
      cy.intercept("GET", `${CL_DASH.dashboardStats}*`, { statusCode: 500, body: {} }).as("dashErr");
      cy.intercept("GET", `${CL_DASH.customerGrowth}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.subscriptionTiers}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.statusDistribution}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.onboardingEfficiency}*`, { body: {} });
      cy.intercept("GET", `${CL_DASH.customerDistribution}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.lifecycleStatus}*`, { body: [] });

      cy.visit("/dashboard/customer-lifecycle", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle");

      cy.wait("@dashErr");
      // Mock fallback should kick in — page renders normally
      cy.get("body").should("exist");
      cy.contains("Customer Lifecycle").should("exist");
    });
  });

  describe("Empty data", () => {
    it("handles empty arrays gracefully", () => {
      cy.intercept("GET", `${CL_DASH.dashboardStats}*`, { body: {} });
      cy.intercept("GET", `${CL_DASH.customerGrowth}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.subscriptionTiers}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.statusDistribution}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.onboardingEfficiency}*`, { body: {} });
      cy.intercept("GET", `${CL_DASH.customerDistribution}*`, { body: [] });
      cy.intercept("GET", `${CL_DASH.lifecycleStatus}*`, { body: [] });

      cy.visit("/dashboard/customer-lifecycle", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle");

      // Should not crash
      cy.get("body").should("exist");
    });
  });
});
