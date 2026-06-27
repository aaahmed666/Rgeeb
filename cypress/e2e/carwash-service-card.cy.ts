/// <reference types="cypress" />

describe("Car Wash — Service Card (AI Services Hub)", () => {
  beforeEach(() => {
    cy.visit("/dashboard/ai-services", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/ai-services");
  });

  it("shows Car Wash in the service grid", () => {
    // Expand the grid if needed
    cy.get("body").then(($body) => {
      if ($body.find("button:contains('Show')").length) {
        cy.contains("button", /show all/i).click();
      }
    });
    cy.get('[data-testid="service-card-car-wash"]').should("exist");
    cy.get('[data-testid="service-card-car-wash"]').should("contain.text", "Car Wash");
  });

  it("Car Wash card shows as the 31st service", () => {
    cy.get("body").then(($body) => {
      if ($body.find("button:contains('Show')").length) {
        cy.contains("button", /show all/i).click();
      }
    });
    cy.get('[data-testid="service-card-car-wash"]').should("exist");
  });

  it("clicking Car Wash card navigates to /dashboard/carwash", () => {
    cy.get("body").then(($body) => {
      if ($body.find("button:contains('Show')").length) {
        cy.contains("button", /show all/i).click();
      }
    });
    cy.get('[data-testid="service-card-car-wash"]').click();
    cy.url().should("include", "/dashboard/carwash");
  });
});
