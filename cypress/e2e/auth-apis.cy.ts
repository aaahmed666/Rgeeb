/// <reference types="cypress" />

import { API, staticPaths } from "../support/helpers";

/**
 * Module 1: Authentication — 10 endpoints
 * POST /login, /customer/register, /customer/logout, /customer/email/send-otp,
 * /customer/profile/update (reset), /face-login, /face/register,
 * /password/request-reset, /password/reset, GET /customer/profile
 */

describe("Auth — Authentication Tests", () => {
  it("POST /login without credentials returns 4xx", () => {
    cy.apiRequest("POST", API.auth.login, { body: {}, token: false }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST /login with invalid credentials returns 401 or 422", () => {
    cy.apiRequest("POST", API.auth.login, {
      body: { email: "nonexistent@test.io", password: "wrong" },
      token: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([401, 422]);
    });
  });

  it("POST /register with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.auth.register, { body: {}, token: false }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST /register with missing required fields returns 422", () => {
    cy.apiRequest("POST", API.auth.register, {
      body: { email: "partial@test.io" },
      token: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([401, 422, 400]);
    });
  });

  it("POST /logout without token returns 401", () => {
    cy.apiRequest("POST", API.auth.logout, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("GET /profile without token returns 401", () => {
    cy.apiRequest("GET", API.auth.profile, { token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST /send-otp with empty body returns 4xx", () => {
    cy.apiRequest("POST", API.auth.sendOtp, { body: {}, token: false }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST /password/request-reset with invalid email returns 4xx", () => {
    cy.apiRequest("POST", API.auth.passwordRequestReset, {
      body: { email: "not-an-email" },
      token: false,
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST /password/reset with invalid token returns 4xx", () => {
    cy.apiRequest("POST", API.auth.passwordReset, {
      body: { token: "invalid", password: "Test1234!", password_confirmation: "Test1234!" },
      token: false,
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST /face-login without face data returns 4xx", () => {
    cy.apiRequest("POST", API.auth.faceLogin, { body: {}, token: false }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST /face/register without auth returns 401", () => {
    cy.apiRequest("POST", API.auth.faceRegister, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST /profile/update without auth returns 401", () => {
    cy.apiRequest("POST", API.auth.updateProfile, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST /client/update without auth returns 401", () => {
    cy.apiRequest("POST", API.auth.updateClient, { body: {}, token: false }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe("Auth — Invalid Token Tests", () => {
  const invalidToken = "Bearer invalid-garbage-xyz";

  it("GET /profile with invalid token returns 401", () => {
    cy.apiRequest("GET", API.auth.profile, { token: "invalid-garbage-xyz" }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("POST /logout with invalid token returns 401", () => {
    cy.apiRequest("POST", API.auth.logout, { token: "invalid-garbage-xyz" }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});
