/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 12: Subscription — 9 endpoints
 * Module 13: Tasks — 13 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════

describe("Subscription — Auth Tests", () => {
  const readEndpoints = [
    { name: "current", path: API.subscription.current },
    { name: "transactions", path: API.subscription.transactions },
    { name: "transactionSingle", path: API.subscription.transactionSingle },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET subscription/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  const writeEndpoints = [
    { name: "subscribe", path: API.subscription.subscribe },
    { name: "renew", path: API.subscription.renew },
    { name: "cancel", path: API.subscription.cancel },
    { name: "addServices", path: API.subscription.addServices },
  ];

  writeEndpoints.forEach(({ name, path }) => {
    it(`POST subscription/${name} without token returns 401`, () => {
      cy.apiRequest("POST", path, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Subscription — Validation", () => {
  it("POST subscribe with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.subscription.subscribe, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST add-service with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.subscription.addServices, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("GET callback with invalid id returns 4xx", () => {
    cy.apiRequest("GET", API.subscription.callback("INVALID")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════════════════

describe("Tasks — Auth Tests", () => {
  const readEndpoints = [
    { name: "list", path: API.tasks.list },
    { name: "single", path: API.tasks.single },
    { name: "board", path: API.tasks.board },
    { name: "dashboard", path: API.tasks.dashboard },
    { name: "logs", path: API.tasks.logs },
    { name: "children", path: API.tasks.children },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET tasks/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  const writeEndpoints = [
    { name: "create", path: API.tasks.create },
    { name: "update", path: API.tasks.update },
    { name: "delete", path: API.tasks.delete },
    { name: "status", path: API.tasks.status },
    { name: "assign", path: API.tasks.assign },
    { name: "comment", path: API.tasks.comment },
  ];

  writeEndpoints.forEach(({ name, path }) => {
    it(`POST tasks/${name} without token returns 401`, () => {
      cy.apiRequest("POST", path, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Tasks — Validation", () => {
  it("POST create with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.tasks.create, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST update with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.tasks.update, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST delete with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.tasks.delete, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST status with missing id returns 4xx", () => {
    cy.apiRequest("POST", API.tasks.status, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST assign with missing task id returns 4xx", () => {
    cy.apiRequest("POST", API.tasks.assign, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST comment with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.tasks.comment, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("GET single without id returns 4xx", () => {
    cy.apiRequest("GET", API.tasks.single).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});
