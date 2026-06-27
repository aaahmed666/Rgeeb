/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 21: Branch Intelligence — 12 endpoints
 * Module 22: Chat / AI Assistant — 8 endpoints
 * Module 23: Store Intelligence — 10 endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════
// BRANCH INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

describe("BranchIntelligence — Auth Tests", () => {
  const endpoints = [
    { name: "efficiencyIndex", path: API.intelligence.efficiencyIndex },
    { name: "rankings", path: API.intelligence.rankings },
    { name: "heatmap", path: API.intelligence.heatmap },
    { name: "branchHealth", path: API.intelligence.branchHealth },
    { name: "serviceMatrix", path: API.intelligence.serviceMatrix },
    { name: "aiInsights", path: API.intelligence.aiInsights },
    { name: "anomalyDetection", path: API.intelligence.anomalyDetection },
    { name: "trendForecast", path: API.intelligence.trendForecast },
    { name: "hourlyPeaks", path: API.intelligence.hourlyPeaks },
    { name: "periodComparison", path: API.intelligence.periodComparison },
    { name: "exportReport", path: API.intelligence.exportReport },
    { name: "availableServices", path: API.intelligence.availableServices },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET intelligence/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("BranchIntelligence — Validation", () => {
  it("GET heatmap with invalid service_id returns 4xx or empty", () => {
    cy.apiRequest("GET", API.intelligence.heatmap, {
      qs: { service_id: -999 },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 400, 401, 422]);
    });
  });

  it("GET rankings with invalid period returns 4xx or empty", () => {
    cy.apiRequest("GET", API.intelligence.rankings, {
      qs: { period: "invalid-period" },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CHAT / AI ASSISTANT
// ═══════════════════════════════════════════════════════════════════════════

describe("Chat — Auth Tests", () => {
  it("GET history without token returns 401", () => {
    cy.apiRequest("GET", API.chat.history, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST send without token returns 401", () => {
    cy.apiRequest("POST", API.chat.send, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET analytics without token returns 401", () => {
    cy.apiRequest("GET", API.chat.analytics, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET conversations without token returns 401", () => {
    cy.apiRequest("GET", API.chat.conversations, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET settings without token returns 401", () => {
    cy.apiRequest("GET", API.chat.settings, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST test-whatsapp without token returns 401", () => {
    cy.apiRequest("POST", API.chat.testWhatsapp, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST reset-alerts without token returns 401", () => {
    cy.apiRequest("POST", API.chat.resetAlerts, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("Chat — Validation", () => {
  it("POST send with empty message returns 4xx", () => {
    cy.apiRequest("POST", API.chat.send, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST send-public with empty message returns 4xx", () => {
    cy.apiRequest("POST", API.chat.sendPublic, { body: {}, token: false }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STORE INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════

describe("StoreIntelligence — Auth Tests", () => {
  const endpoints = [
    { name: "dashboard", path: API.storeIntelligence.dashboard },
    { name: "traffic", path: API.storeIntelligence.traffic },
    { name: "conversion", path: API.storeIntelligence.conversion },
    { name: "demographics", path: API.storeIntelligence.demographics },
    { name: "heatmap", path: API.storeIntelligence.heatmap },
    { name: "employeePresence", path: API.storeIntelligence.employeePresence },
    { name: "responseTime", path: API.storeIntelligence.responseTime },
    { name: "violations", path: API.storeIntelligence.violations },
    { name: "compliance", path: API.storeIntelligence.compliance },
    { name: "settings", path: API.storeIntelligence.settings },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET storeIntelligence/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});
