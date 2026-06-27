/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 16: Task Reports — 9 endpoints
 * Module 17: Task Rules — 5 endpoints
 * Module 18: Escalation — 4 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// TASK REPORTS
// ═══════════════════════════════════════════════════════════════════════════

describe("TaskReports — Auth Tests", () => {
  const endpoints = [
    { name: "performance", path: API.taskReports.performance },
    { name: "sla", path: API.taskReports.sla },
    { name: "verification", path: API.taskReports.verification },
    { name: "types", path: API.taskReports.types },
    { name: "exportExcel", path: API.taskReports.exportExcel },
    { name: "downloadPerformance", path: API.taskReports.downloadPerformance },
    { name: "downloadSla", path: API.taskReports.downloadSla },
    { name: "downloadVerification", path: API.taskReports.downloadVerification },
    { name: "downloadExportExcel", path: API.taskReports.downloadExportExcel },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET taskReports/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK RULES
// ═══════════════════════════════════════════════════════════════════════════

describe("TaskRules — Auth Tests", () => {
  it("GET list without token returns 401", () => {
    cy.apiRequest("GET", API.taskRules.list, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET dedup-stats without token returns 401", () => {
    cy.apiRequest("GET", API.taskRules.dedupStats, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST save without token returns 401", () => {
    cy.apiRequest("POST", API.taskRules.save, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("TaskRules — Validation", () => {
  it("POST save with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.taskRules.save, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("PUT update with invalid id returns 4xx", () => {
    cy.apiRequest("PUT", API.taskRules.update("INVALID"), { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 405, 422]);
    });
  });

  it("DELETE rule with invalid id returns 4xx", () => {
    cy.apiRequest("DELETE", API.taskRules.delete("INVALID")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 405, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ESCALATION
// ═══════════════════════════════════════════════════════════════════════════

describe("Escalation — Auth Tests", () => {
  it("GET rules without token returns 401", () => {
    cy.apiRequest("GET", API.escalation.rules, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET log without token returns 401", () => {
    cy.apiRequest("GET", API.escalation.log, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST save-rule without token returns 401", () => {
    cy.apiRequest("POST", API.escalation.saveRule, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("Escalation — Validation", () => {
  it("POST save-rule with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.escalation.saveRule, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("GET rule with invalid id returns 4xx", () => {
    cy.apiRequest("GET", API.escalation.rule("INVALID")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TASK NOTIFICATIONS + TASK TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

describe("TaskNotifications — Auth Tests", () => {
  it("GET list without token returns 401", () => {
    cy.apiRequest("GET", API.taskNotifications.list, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST mark-read without token returns 401", () => {
    cy.apiRequest("POST", API.taskNotifications.markRead, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("TaskTemplates — Auth Tests", () => {
  it("GET list without token returns 401", () => {
    cy.apiRequest("GET", API.taskTemplates.list, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST create-task without token returns 401", () => {
    cy.apiRequest("POST", API.taskTemplates.createTask, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST use with invalid id returns 4xx", () => {
    cy.apiRequest("POST", API.taskTemplates.use("INVALID"), { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("DELETE template with invalid id returns 4xx", () => {
    cy.apiRequest("DELETE", API.taskTemplates.delete("INVALID")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 405, 422]);
    });
  });
});

describe("Productivity — Auth Tests", () => {
  const endpoints = [
    { name: "summary", path: API.productivity.summary },
    { name: "leaderboard", path: API.productivity.leaderboard },
    { name: "departments", path: API.productivity.departments },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET productivity/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  it("GET employee detail with invalid id returns 4xx", () => {
    cy.apiRequest("GET", API.productivity.employeeDetail("INVALID")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});
