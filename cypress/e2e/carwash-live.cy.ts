/// <reference types="cypress" />

describe("Car Wash — Live View", () => {
  describe("With stream URL", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("getCameras");
      cy.intercept("GET", "/api/customer/cameras/stream*", {
        fixture: "carwash/stream.json",
      }).as("getStream");

      cy.visit("/dashboard/carwash/live?camera=cam-cw-01", {
        failOnStatusCode: false,
      });
      cy.login();
      cy.visit("/dashboard/carwash/live?camera=cam-cw-01");
    });

    it("calls cameras and stream endpoints", () => {
      cy.wait("@getCameras");
      cy.wait("@getStream");
    });

    it("displays camera name from ?camera= param", () => {
      cy.wait("@getCameras");
      cy.contains("Bay 1").should("exist");
    });

    it("renders video element when stream URL is returned", () => {
      cy.wait("@getStream");
      cy.get('[data-testid="live-video"]').should("exist");
    });

    it("shows ROI overlay when AI is running", () => {
      cy.wait("@getCameras");
      cy.get('[data-testid="roi-overlay"]').should("exist");
      cy.contains("DETAIL ZONE").should("exist");
    });

    it("toggles AI start/stop", () => {
      cy.wait("@getCameras");
      cy.get('[data-testid="ai-toggle-button"]').should("contain.text", "Stop AI");
      cy.get('[data-testid="ai-toggle-button"]').click();
      cy.get('[data-testid="ai-toggle-button"]').should("contain.text", "Start AI");
      cy.get('[data-testid="roi-overlay"]').should("not.exist");
    });

    it("stream request includes correct camera id query param", () => {
      cy.wait("@getStream").its("request.url").should("include", "id=cam-cw-01");
    });
  });

  describe("Without stream URL", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("getCameras");
      cy.intercept("GET", "/api/customer/cameras/stream*", {
        body: {},
      }).as("getStreamEmpty");

      cy.visit("/dashboard/carwash/live?camera=cam-cw-01", {
        failOnStatusCode: false,
      });
      cy.login();
      cy.visit("/dashboard/carwash/live?camera=cam-cw-01");
    });

    it("does not render video when no stream URL", () => {
      cy.wait("@getStreamEmpty");
      cy.get('[data-testid="live-video"]').should("not.exist");
    });
  });
});
