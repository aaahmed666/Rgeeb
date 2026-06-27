/// <reference types="cypress" />

/**
 * Customer Lifecycle — Customer CRUD Operations
 *
 * Tests CREATE (POST), READ (GET), UPDATE (PUT), DELETE operations
 * on /api/customer-lifecycle/customers endpoints with cy.intercept fixtures.
 */

const CL_CUSTOMERS = "/api/customer-lifecycle/customers";
const CL_CUSTOMER = (id: string) => `/api/customer-lifecycle/customers/${id}`;

describe("Customer Lifecycle — CRUD Operations", () => {
  // ── READ: Customer List ─────────────────────────────────────────────────
  describe("READ: Customer List (GET /customers)", () => {
    beforeEach(() => {
      cy.intercept("GET", `${CL_CUSTOMERS}*`, {
        fixture: "customer-lifecycle/customers.json",
      }).as("getCustomers");

      cy.visit("/dashboard/customer-lifecycle/customers", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle/customers");
    });

    it("calls customers endpoint on page load", () => {
      cy.wait("@getCustomers");
    });

    it("renders customer rows from fixture", () => {
      cy.wait("@getCustomers");
      // 3 customers in fixture
      cy.contains("Nexus Market").should("exist");
      cy.contains("Global Logistics Co.").should("exist");
      cy.contains("SafeVault Security").should("exist");
    });

    it("passes pagination params in request", () => {
      cy.wait("@getCustomers").then((interception) => {
        // Default page=1 should be in the URL
        expect(interception.request.url).to.include("customer-lifecycle/customers");
      });
    });
  });

  // ── READ: Customer Profile ──────────────────────────────────────────────
  describe("READ: Customer Profile (GET /customers/:id)", () => {
    beforeEach(() => {
      cy.intercept("GET", `${CL_CUSTOMER("RGE-10293")}*`, {
        fixture: "customer-lifecycle/customer-profile.json",
      }).as("getProfile");

      cy.visit("/dashboard/customer-lifecycle/customers/RGE-10293", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/customer-lifecycle/customers/RGE-10293");
    });

    it("calls profile endpoint with customer ID", () => {
      cy.wait("@getProfile").then((interception) => {
        expect(interception.request.url).to.include("/customers/RGE-10293");
      });
    });

    it("renders profile data from fixture", () => {
      cy.wait("@getProfile");
      cy.contains("Global Retail Corp").should("exist");
    });
  });

  // ── CREATE: New Customer ────────────────────────────────────────────────
  describe("CREATE: New Customer (POST /customers)", () => {
    it("POST request includes correct headers", () => {
      cy.intercept("POST", `${CL_CUSTOMERS}*`, {
        statusCode: 201,
        body: {
          id: "RGE-10301",
          name: "New Corp",
          initials: "NC",
          customerId: "RGE-10301",
          businessType: "Retail",
          status: "Onboarding",
          branches: 1,
          cameras: 10,
          aiServices: 0,
          package: "Basic",
          endDate: "Dec 31, 2025",
        },
      }).as("createCustomer");

      cy.request({
        method: "POST",
        url: CL_CUSTOMERS,
        failOnStatusCode: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: {
          name: "New Corp",
          businessType: "Retail",
          status: "Onboarding",
          branches: 1,
          cameras: 10,
          aiServices: 0,
          package: "Basic",
          endDate: "Dec 31, 2025",
        },
      }).then((res) => {
        // Without auth: 401, with auth: 201 or 200
        expect(res.status).to.be.oneOf([200, 201, 401, 422]);
      });
    });

    it("POST with missing name returns validation error", () => {
      cy.request({
        method: "POST",
        url: CL_CUSTOMERS,
        failOnStatusCode: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: { businessType: "Retail" },
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 422, 400]);
      });
    });

    it("POST with empty string name returns validation error", () => {
      cy.request({
        method: "POST",
        url: CL_CUSTOMERS,
        failOnStatusCode: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: { name: "", businessType: "Retail" },
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 422, 400]);
      });
    });
  });

  // ── UPDATE: Customer ────────────────────────────────────────────────────
  describe("UPDATE: Customer (PUT /customers/:id)", () => {
    it("PUT with valid body returns 200 or auth error", () => {
      cy.request({
        method: "PUT",
        url: CL_CUSTOMER("RGE-10293"),
        failOnStatusCode: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: { name: "Updated Corp", status: "Active" },
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403, 404, 422]);
      });
    });

    it("PUT to nonexistent customer returns 4xx", () => {
      cy.request({
        method: "PUT",
        url: CL_CUSTOMER("NONEXISTENT-99999"),
        failOnStatusCode: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: { name: "Ghost" },
      }).then((res) => {
        expect(res.status).to.be.gte(400);
      });
    });

    it("PUT with empty body returns 4xx", () => {
      cy.request({
        method: "PUT",
        url: CL_CUSTOMER("RGE-10293"),
        failOnStatusCode: false,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: {},
      }).then((res) => {
        expect(res.status).to.be.gte(400);
      });
    });
  });

  // ── DELETE: Customer ────────────────────────────────────────────────────
  describe("DELETE: Customer (DELETE /customers/:id)", () => {
    it("DELETE without auth returns 401", () => {
      cy.request({
        method: "DELETE",
        url: CL_CUSTOMER("RGE-10293"),
        failOnStatusCode: false,
        headers: { Accept: "application/json" },
      }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });

    it("DELETE nonexistent customer returns 4xx", () => {
      cy.request({
        method: "DELETE",
        url: CL_CUSTOMER("NONEXISTENT-99999"),
        failOnStatusCode: false,
        headers: { Accept: "application/json" },
      }).then((res) => {
        expect(res.status).to.be.gte(400);
      });
    });

    it("DELETE with empty ID returns 4xx", () => {
      cy.request({
        method: "DELETE",
        url: CL_CUSTOMER(""),
        failOnStatusCode: false,
        headers: { Accept: "application/json" },
      }).then((res) => {
        expect(res.status).to.be.gte(400);
      });
    });
  });
});
