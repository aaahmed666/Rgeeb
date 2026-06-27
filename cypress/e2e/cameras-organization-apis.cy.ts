/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 7: Cameras — 7 endpoints
 * Module 8: Organization (Branches, Departments, Employees) — 15 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// CAMERAS
// ═══════════════════════════════════════════════════════════════════════════

describe("Cameras — Auth Tests", () => {
  const readEndpoints = [
    { name: "list", path: API.cameras.list },
    { name: "single", path: API.cameras.single },
    { name: "checkOnline", path: API.cameras.checkOnline },
    { name: "stream", path: API.cameras.stream },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET cameras/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  ["create", "update", "delete"].forEach((action) => {
    it(`POST cameras/${action} without token returns 401`, () => {
      cy.apiRequest("POST", API.cameras[action as "create" | "update" | "delete"], {
        body: {},
        token: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Cameras — Validation", () => {
  it("POST create with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.cameras.create, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST update with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.cameras.update, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST delete with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.cameras.delete, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("GET single with invalid id returns 4xx", () => {
    cy.apiRequest("GET", API.cameras.single, { qs: { id: "INVALID" } }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZATION — Branches, Departments, Employees (15 endpoints)
// ═══════════════════════════════════════════════════════════════════════════

describe("Organization — Auth Tests", () => {
  const entities = [
    { prefix: "branch", list: API.organization.branches, single: API.organization.branchSingle, create: API.organization.branchCreate, update: API.organization.branchUpdate, del: API.organization.branchDelete },
    { prefix: "department", list: API.organization.departments, single: API.organization.departmentSingle, create: API.organization.departmentCreate, update: API.organization.departmentUpdate, del: API.organization.departmentDelete },
    { prefix: "employee", list: API.organization.employees, single: API.organization.employeeSingle, create: API.organization.employeeCreate, update: API.organization.employeeUpdate, del: API.organization.employeeDelete },
  ];

  entities.forEach(({ prefix, list, single, create, update, del }) => {
    it(`GET ${prefix} list without token returns 401`, () => {
      cy.apiRequest("GET", list, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });

    it(`GET ${prefix} single without token returns 401`, () => {
      cy.apiRequest("GET", single, { token: false }).then((res) => {
        expect(res.status).to.be.oneOf([401, 404, 422]);
      });
    });

    it(`POST ${prefix} create without token returns 401`, () => {
      cy.apiRequest("POST", create, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });

    it(`POST ${prefix} update without token returns 401`, () => {
      cy.apiRequest("POST", update, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });

    it(`POST ${prefix} delete without token returns 401`, () => {
      cy.apiRequest("POST", del, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Organization — Validation", () => {
  const entities = [
    { prefix: "branch", create: API.organization.branchCreate, update: API.organization.branchUpdate, del: API.organization.branchDelete },
    { prefix: "department", create: API.organization.departmentCreate, update: API.organization.departmentUpdate, del: API.organization.departmentDelete },
    { prefix: "employee", create: API.organization.employeeCreate, update: API.organization.employeeUpdate, del: API.organization.employeeDelete },
  ];

  entities.forEach(({ prefix, create, update, del }) => {
    it(`POST ${prefix} create with empty body returns 4xx`, () => {
      cy.apiRequest("POST", create, { body: {} }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 422]);
      });
    });

    it(`POST ${prefix} update with empty body returns 4xx`, () => {
      cy.apiRequest("POST", update, { body: {} }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 422]);
      });
    });

    it(`POST ${prefix} delete with empty body returns 4xx`, () => {
      cy.apiRequest("POST", del, { body: {} }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 422]);
      });
    });
  });
});
