/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 9: Attendance — 4 endpoints
 * Module 10: Roles & Permissions — 6 endpoints
 * Module 11: Services / AI Catalog — 4 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════

describe("Attendance — Auth Tests", () => {
  it("GET list without token returns 401", () => {
    cy.apiRequest("GET", API.attendance.list, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET dashboard without token returns 401", () => {
    cy.apiRequest("GET", API.attendance.dashboard, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST check-in without token returns 401", () => {
    cy.apiRequest("POST", API.attendance.checkIn, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST check-out without token returns 401", () => {
    cy.apiRequest("POST", API.attendance.checkOut, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("Attendance — Validation", () => {
  it("POST check-in with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.attendance.checkIn, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST check-out with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.attendance.checkOut, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROLES & PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("Roles — Auth Tests", () => {
  const readEndpoints = [
    { name: "list", path: API.roles.list },
    { name: "single", path: API.roles.single },
    { name: "permissions", path: API.roles.permissions },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET roles/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  ["create", "update", "delete"].forEach((action) => {
    it(`POST roles/${action} without token returns 401`, () => {
      cy.apiRequest("POST", API.roles[action as "create" | "update" | "delete"], {
        body: {},
        token: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Roles — Validation", () => {
  it("POST create with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.roles.create, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST update with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.roles.update, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST delete with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.roles.delete, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES (AI CATALOG)
// ═══════════════════════════════════════════════════════════════════════════

describe("Services — Auth Tests", () => {
  const endpoints = [
    { name: "list", path: API.services.list },
    { name: "single", path: API.services.single },
    { name: "available", path: API.services.available },
    { name: "new", path: API.services.new },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET services/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Services — Validation", () => {
  it("GET single without id returns 4xx", () => {
    cy.apiRequest("GET", API.services.single).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});
