/// <reference types="cypress" />

describe("Car Wash — Dashboard", () => {
  // ── Success Path ──────────────────────────────────────────────────────────
  describe("Success", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        fixture: "carwash/dashboard.json",
      }).as("getDashboard");

      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("getCameras");

      cy.visit("/dashboard/carwash", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash");
    });

    it("calls both dashboard and cameras endpoints", () => {
      cy.wait("@getDashboard");
      cy.wait("@getCameras");
    });

    it("renders 4 KPI stat cards with correct values", () => {
      cy.wait("@getDashboard");
      cy.get('[data-testid^="kpi-card-"]').should("have.length", 4);
      // Total Vehicles = 147 from fixture
      cy.get('[data-testid="kpi-card-total-vehicles"]').should("contain.text", "147");
    });

    it("renders camera cards from fixture data", () => {
      cy.wait("@getCameras");
      cy.get('[data-testid^="camera-card-"]').should("have.length", 4);
      cy.get('[data-testid="camera-card-cam-cw-01"]').should("contain.text", "Bay 1");
    });

    it("shows online badge for online cameras", () => {
      cy.wait("@getCameras");
      cy.get('[data-testid="camera-card-cam-cw-01"]').should("contain.text", "Online");
    });

    it("clicking a camera navigates to live view", () => {
      cy.wait("@getCameras");
      cy.get('[data-testid="camera-card-cam-cw-01"]').click();
      cy.url().should("include", "/dashboard/carwash/live");
      cy.url().should("include", "camera=cam-cw-01");
    });

    it("Refresh button re-triggers API calls", () => {
      cy.wait("@getDashboard");
      cy.wait("@getCameras");

      // Re-intercept to check second call
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        fixture: "carwash/dashboard.json",
      }).as("getDashboard2");
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("getCameras2");

      cy.get('[data-testid="refresh-button"]').click();
      cy.wait("@getDashboard2");
      cy.wait("@getCameras2");
    });
  });

  // ── Error State ───────────────────────────────────────────────────────────
  describe("Error handling", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("getDashboardErr");
      cy.intercept("GET", "/api/customer/cameras*", {
        statusCode: 500,
        body: { message: "Internal Server Error" },
      }).as("getCamerasErr");

      cy.visit("/dashboard/carwash", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash");
    });

    it("shows error card on 500", () => {
      cy.wait("@getDashboardErr");
      cy.get('[data-testid="error-card"]').should("exist");
    });

    it("retry button re-fetches", () => {
      cy.wait("@getDashboardErr");

      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        fixture: "carwash/dashboard.json",
      }).as("retryDash");
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("retryCams");

      cy.get('[data-testid="retry-button"]').click();
      cy.wait("@retryDash");
      cy.get('[data-testid="error-card"]').should("not.exist");
    });
  });

  // ── Empty State ───────────────────────────────────────────────────────────
  describe("Empty state", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        body: { summary: { total_vehicles: 0 } },
      }).as("getDashEmpty");
      cy.intercept("GET", "/api/customer/cameras*", {
        body: { data: [] },
      }).as("getCamsEmpty");

      cy.visit("/dashboard/carwash", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash");
    });

    it("shows empty cameras message", () => {
      cy.wait("@getCamsEmpty");
      cy.get('[data-testid="cameras-empty"]').should("exist");
    });
  });
});
