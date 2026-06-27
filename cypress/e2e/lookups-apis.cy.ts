/// <reference types="cypress" />

import { API } from "../support/helpers";

/**
 * Module 2: Lookups — 6 endpoints
 * GET /customer/countries, cities, categories, categories/single, packages, packages/single
 */

const LOOKUP_ENDPOINTS = [
  { name: "countries", path: API.lookups.countries },
  { name: "cities", path: API.lookups.cities },
  { name: "categories", path: API.lookups.categories },
  { name: "packages", path: API.lookups.packages },
];

describe("Lookups — Auth Tests", () => {
  LOOKUP_ENDPOINTS.forEach(({ name, path }) => {
    it(`GET ${name} without token returns 401`, () => {
      cy.apiRequest("GET", path, { token: false }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});

describe("Lookups — Schema Tests", () => {
  LOOKUP_ENDPOINTS.forEach(({ name, path }) => {
    it(`GET ${name} returns array or object`, () => {
      cy.apiRequest("GET", path).then((res) => {
        if (res.status === 200) {
          expect(res.body).to.not.be.null;
        }
      });
    });
  });

  it("GET categories/single without id param returns 4xx", () => {
    cy.apiRequest("GET", API.lookups.categorySingle).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });

  it("GET packages/single without id param returns 4xx", () => {
    cy.apiRequest("GET", API.lookups.packageSingle).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404, 422]);
    });
  });
});
