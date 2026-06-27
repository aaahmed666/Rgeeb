/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 14: My Tasks — 7 endpoints
 * Module 15: Task Analytics — 12 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// MY TASKS
// ═══════════════════════════════════════════════════════════════════════════

describe("MyTasks — Auth Tests", () => {
  const readEndpoints = [
    { name: "list", path: API.myTasks.list },
    { name: "detail", path: API.myTasks.detail },
    { name: "stats", path: API.myTasks.stats },
  ];

  readEndpoints.forEach(({ name, path }) => {
    it(`GET myTasks/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  it("POST photo without token returns 401", () => {
    cy.apiRequest("POST", API.myTasks.photo, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("MyTasks — Validation", () => {
  it("POST start with invalid id returns 4xx", () => {
    cy.apiRequest("POST", API.myTasks.start("INVALID"), { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("POST complete with invalid id returns 4xx", () => {
    cy.apiRequest("POST", API.myTasks.complete("INVALID"), { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("POST status with invalid id returns 4xx", () => {
    cy.apiRequest("POST", API.myTasks.status("INVALID"), { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("GET detail without id returns 4xx", () => {
    cy.apiRequest("GET", API.myTasks.detail).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

describe("TaskAnalytics — Auth Tests", () => {
  const endpoints = [
    { name: "sla", path: API.taskAnalytics.sla },
    { name: "workers", path: API.taskAnalytics.workers },
    { name: "volume", path: API.taskAnalytics.volume },
    { name: "aiPipeline", path: API.taskAnalytics.aiPipeline },
    { name: "verifications", path: API.taskAnalytics.verifications },
    { name: "verificationStats", path: API.taskAnalytics.verificationStats },
    { name: "escalationRate", path: API.taskAnalytics.escalationRate },
    { name: "branchesAnalytics", path: API.taskAnalytics.branchesAnalytics },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET taskAnalytics/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  const writeEndpoints = [
    { name: "verify", path: API.taskAnalytics.verify },
    { name: "reject", path: API.taskAnalytics.reject },
    { name: "reopen", path: API.taskAnalytics.reopen },
    { name: "reviewVerification", path: API.taskAnalytics.reviewVerification },
  ];

  writeEndpoints.forEach(({ name, path }) => {
    it(`POST taskAnalytics/${name} without token returns 401`, () => {
      cy.apiRequest("POST", path, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("TaskAnalytics — Validation", () => {
  it("POST verify with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.taskAnalytics.verify, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST reject with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.taskAnalytics.reject, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});
