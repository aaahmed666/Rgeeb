/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 24: Security / 2FA — 5 endpoints
 * + Notification Settings — 5 endpoints
 * + Payment / Fatoorah — 4 endpoints
 * + Monitoring — 2 endpoints
 * + Drive-Thru — 1 endpoint
 * + Service Monitor — 1 endpoint (dynamic)
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY / 2FA
// ═══════════════════════════════════════════════════════════════════════════

describe("Security/2FA — Auth Tests", () => {
  const endpoints = [
    { name: "status", path: API.security.status },
    { name: "setup", path: API.security.setup },
  ];

  endpoints.forEach(({ name, path }) => {
    it(`GET 2fa/${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  const writeEndpoints = [
    { name: "enable", path: API.security.enable },
    { name: "disable", path: API.security.disable },
    { name: "verify", path: API.security.verify },
  ];

  writeEndpoints.forEach(({ name, path }) => {
    it(`POST 2fa/${name} without token returns 401`, () => {
      cy.apiRequest("POST", path, { body: {}, token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Security/2FA — Validation", () => {
  it("POST enable with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.security.enable, { body: {} }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });

  it("POST verify with invalid code returns 4xx", () => {
    cy.apiRequest("POST", API.security.verify, { body: { code: "000000" } }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

describe("NotificationSettings — Auth Tests", () => {
  it("GET settings without token returns 401", () => {
    cy.apiRequest("GET", API.notificationSettings.get, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST update without token returns 401", () => {
    cy.apiRequest("POST", API.notificationSettings.update, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST test without token returns 401", () => {
    cy.apiRequest("POST", API.notificationSettings.test, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST test-email without token returns 401", () => {
    cy.apiRequest("POST", API.notificationSettings.testEmail, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST verify-telegram without token returns 401", () => {
    cy.apiRequest("POST", API.notificationSettings.verifyTelegram, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT / FATOORAH
// ═══════════════════════════════════════════════════════════════════════════

describe("Payment — Auth Tests", () => {
  it("POST link-fatoorah without token returns 401", () => {
    cy.apiRequest("POST", API.payment.linkFatoorah, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST fatoorah/link without token returns 401", () => {
    cy.apiRequest("POST", API.payment.fatoorahLink, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET fatoorah/status without token returns 401", () => {
    cy.apiRequest("GET", API.payment.fatoorahStatus, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST fatoorah/unlink without token returns 401", () => {
    cy.apiRequest("POST", API.payment.unlinkFatoorah, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MONITORING / DRIVE-THRU / SERVICE MONITOR
// ═══════════════════════════════════════════════════════════════════════════

describe("Monitoring — Auth Tests", () => {
  it("GET pulse without token returns 401", () => {
    cy.apiRequest("GET", API.monitoring.pulse, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET heartbeat without token returns 401", () => {
    cy.apiRequest("GET", API.monitoring.heartbeat, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("DriveThru — Auth Tests", () => {
  it("GET dashboard without token returns 401", () => {
    cy.apiRequest("GET", API.driveThru.dashboard, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("ServiceMonitor — Auth Tests", () => {
  it("GET dashboard with invalid service id returns 4xx", () => {
    cy.apiRequest("GET", API.serviceMonitor.dashboard("999999")).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("GET dashboard without token returns 401", () => {
    cy.apiRequest("GET", API.serviceMonitor.dashboard("1"), { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});
