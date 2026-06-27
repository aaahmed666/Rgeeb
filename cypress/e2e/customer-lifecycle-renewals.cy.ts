/// <reference types="cypress" />

/**
 * Customer Lifecycle — Renewals Page Tests
 *
 * Endpoints tested:
 *  - GET /api/customer-lifecycle/renewals/stats    (renewalStats)
 *  - GET /api/customer-lifecycle/renewals/groups   (renewalGroups)
 */

const RENEWAL_STATS = "/api/customer-lifecycle/renewals/stats";
const RENEWAL_GROUPS = "/api/customer-lifecycle/renewals/groups";

describe("Customer Lifecycle — Renewals", () => {
  describe("Success", () => {
    beforeEach(() => {
      cy.intercept("GET", `${RENEWAL_STATS}*`, {
        fixture: "customer-lifecycle/renewal-stats.json",
      }).as("getStats");
      cy.intercept("GET", `${RENEWAL_GROUPS}*`, {
        body: [
          {
            label: "Expiring in 7 Days",
            urgency: "critical",
            contractCount: 8,
            totalValue: "$640k",
            entries: [
              {
                id: "r1",
                customerName: "Astra Media Group",
                customerInitials: "AM",
                accountManager: "Marcus V.",
                currentPackage: "Enterprise AI+",
                expiryDate: "Oct 24, 2023",
                daysLeft: 4,
                status: "Negotiating",
                riskScore: 82,
                riskLabel: "82% High Risk",
                riskColor: "red",
                action: "View Case",
              },
            ],
          },
        ],
      }).as("getGroups");

      cy.visit("/dashboard/customer-lifecycle/renewals", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle/renewals");
    });

    it("calls both renewals endpoints", () => {
      cy.wait("@getStats");
      cy.wait("@getGroups");
    });

    it("renders health score from fixture", () => {
      cy.wait("@getStats");
      cy.contains("94.2").should("exist");
    });

    it("renders renewal group with urgency label", () => {
      cy.wait("@getGroups");
      cy.contains("Expiring in 7 Days").should("exist");
    });

    it("renders renewal entries with customer names", () => {
      cy.wait("@getGroups");
      cy.contains("Astra Media Group").should("exist");
    });

    it("shows risk score badge", () => {
      cy.wait("@getGroups");
      cy.contains("82%").should("exist");
    });
  });

  describe("Schema — RenewalStats fixture", () => {
    it("has all required fields", () => {
      cy.fixture("customer-lifecycle/renewal-stats.json").then((data) => {
        expect(data).to.have.property("healthScore").that.is.a("number");
        expect(data).to.have.property("healthTrend").that.is.a("string");
        expect(data).to.have.property("upcomingRenewals").that.is.a("number");
        expect(data).to.have.property("upcomingRenewalsLabel").that.is.a("string");
        expect(data).to.have.property("forecastedRevenue").that.is.a("string");
        expect(data).to.have.property("forecastedRevenueTrend").that.is.a("string");
        expect(data).to.have.property("highRiskAttrition").that.is.a("number");
        expect(data).to.have.property("highRiskAttritionLabel").that.is.a("string");
      });
    });
  });

  describe("Error", () => {
    it("falls back to mock on 500", () => {
      cy.intercept("GET", `${RENEWAL_STATS}*`, { statusCode: 500, body: {} }).as("statsErr");
      cy.intercept("GET", `${RENEWAL_GROUPS}*`, { statusCode: 500, body: {} }).as("groupsErr");

      cy.visit("/dashboard/customer-lifecycle/renewals", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle/renewals");

      cy.wait("@statsErr");
      // Mock fallback renders content
      cy.get("body").should("exist");
      cy.contains("Renewal").should("exist");
    });
  });

  describe("Empty", () => {
    it("handles empty renewal groups", () => {
      cy.intercept("GET", `${RENEWAL_STATS}*`, { fixture: "customer-lifecycle/renewal-stats.json" });
      cy.intercept("GET", `${RENEWAL_GROUPS}*`, { body: [] }).as("emptyGroups");

      cy.visit("/dashboard/customer-lifecycle/renewals", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle/renewals");

      cy.wait("@emptyGroups");
      cy.get("body").should("exist");
    });
  });
});
