/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Modules 3+4: Notifications (5 endpoints) + Dashboard (1 endpoint)
 */

describe("Notifications — Auth Tests", () => {
  const endpoints = [
    { name: "list", path: API.notifications.list },
    { name: "unreadCount", path: API.notifications.unreadCount },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET ${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  it("POST mark-all-read without token returns 401", () => {
    cy.apiRequest("POST", API.notifications.markAllRead, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST read-all without token returns 401", () => {
    cy.apiRequest("POST", API.notifications.readAll, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST mark-read with invalid id returns 4xx", () => {
    cy.apiRequest("POST", API.notifications.markRead("INVALID"), { token: false }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });
});

describe("Notifications — Validation", () => {
  it("POST mark-read with non-numeric id returns 4xx", () => {
    cy.apiRequest("POST", API.notifications.markRead("abc!@#")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});

describe("Dashboard — Auth Tests", () => {
  it("GET /customer/dashboard without token returns 401", () => {
    cy.apiRequest("GET", API.dashboard.overview, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET /customer/dashboard with invalid token returns 401", () => {
    cy.apiRequest("GET", API.dashboard.overview, { token: "invalid-xyz" }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});
