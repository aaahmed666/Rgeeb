/// <reference types="cypress" />

describe("Car Wash — Analytics", () => {
  describe("Success", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        fixture: "carwash/dashboard.json",
      }).as("getDashboard");

      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("getCameras");

      cy.intercept("GET", "/api/customer/analytics/by-service*", {
        body: [],
      }).as("getByService");

      cy.intercept("GET", "/api/customer/analytics/by-camera*", {
        body: [],
      }).as("getByCamera");

      cy.visit("/dashboard/carwash/analytics", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash/analytics");
    });

    it("calls dashboard endpoint for analytics data", () => {
      cy.wait("@getDashboard");
    });

    it("renders 4 KPI stat cards", () => {
      cy.wait("@getDashboard");
      cy.get('[data-testid^="kpi-card-"]').should("have.length", 4);
    });

    it("renders donut chart (recharts SVG) for service breakdown", () => {
      cy.wait("@getDashboard");
      // Recharts renders inside <svg> with <g> elements
      cy.get(".recharts-pie").should("exist");
    });

    it("renders bar chart for vehicle classification", () => {
      cy.wait("@getDashboard");
      cy.get(".recharts-bar").should("exist");
    });

    it("renders vehicle log table rows", () => {
      cy.wait("@getDashboard");
      cy.get('[data-testid="vehicle-row"]').should("have.length", 3);
    });

    it("search filters vehicle log", () => {
      cy.wait("@getDashboard");
      cy.get('[data-testid="search-input"]').type("KSA 1234");
      cy.get('[data-testid="vehicle-row"]').should("have.length", 1);
      cy.get('[data-testid="vehicle-row"]').should("contain.text", "KSA 1234 AB");
    });

    it("clearing search restores all rows", () => {
      cy.wait("@getDashboard");
      cy.get('[data-testid="search-input"]').type("KSA 1234");
      cy.get('[data-testid="vehicle-row"]').should("have.length", 1);
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="vehicle-row"]').should("have.length", 3);
    });
  });

  describe("No data", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        body: {},
      }).as("getDashEmpty");
      cy.intercept("GET", "/api/customer/cameras*", {
        body: { data: [] },
      }).as("getCamsEmpty");
      cy.intercept("GET", "/api/customer/analytics/by-service*", {
        body: [],
      }).as("getByServiceEmpty");
      cy.intercept("GET", "/api/customer/analytics/by-camera*", {
        body: [],
      }).as("getByCameraEmpty");

      cy.visit("/dashboard/carwash/analytics", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash/analytics");
    });

    it("shows no-data placeholder when breakdown is empty", () => {
      cy.wait("@getDashEmpty");
      cy.contains("No data").should("exist");
    });
  });

  describe("Error", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        statusCode: 500,
        body: {},
      }).as("getDashErr");
      cy.intercept("GET", "/api/customer/cameras*", {
        statusCode: 500,
        body: {},
      }).as("getCamsErr");

      cy.visit("/dashboard/carwash/analytics", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash/analytics");
    });

    it("shows error card on failure", () => {
      cy.wait("@getDashErr");
      cy.get('[data-testid="error-card"]').should("exist");
    });

    it("retry button re-fetches", () => {
      cy.wait("@getDashErr");
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        fixture: "carwash/dashboard.json",
      }).as("retryDash");
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("retryCams");

      cy.get('[data-testid="retry-button"]').click();
      cy.wait("@retryDash");
    });
  });
});
