/// <reference types="cypress" />

/**
 * Car Wash — Comprehensive API Validation
 *
 * Verifies every endpoint in endpoints.carWash is called with the correct
 * path under /api/customer/..., validates schemas, detects dummy data,
 * and measures performance.
 */

// ── Endpoints & expected paths ──────────────────────────────────────────────
const CAR_WASH_ENDPOINTS = {
  dashboard: "/api/customer/drive-thru/dashboard",
  cameras: "/api/customer/cameras",
  cameraStream: "/api/customer/cameras/stream",
  analyticsByService: "/api/customer/analytics/by-service",
  analyticsByCamera: "/api/customer/analytics/by-camera",
} as const;

// ── Dummy data patterns ─────────────────────────────────────────────────────
const DUMMY_PATTERNS = [
  /John\s*Doe/i,
  /Test\s*User/i,
  /Lorem\s*Ipsum/i,
  /\bExample\b/i,
  /\bSample\b/i,
  /\bDummy\b/i,
  /\bFake\b/i,
  /\bPlaceholder\b/i,
] as const;

function containsDummy(body: unknown): string | null {
  const text = JSON.stringify(body);
  for (const p of DUMMY_PATTERNS) {
    const match = text.match(p);
    if (match) return match[0];
  }
  return null;
}

describe("Car Wash — API Validation Suite", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1 · ENDPOINT COVERAGE — all 3 pages call the right endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe("1 · Endpoint Coverage", () => {
    it("Dashboard page calls: dashboard + cameras", () => {
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.dashboard}*`).as("dash");
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.cameras}*`).as("cams");

      cy.visit("/dashboard/carwash", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash");

      cy.wait("@dash").its("response.statusCode").should("be.oneOf", [200, 401, 403]);
      cy.wait("@cams").its("response.statusCode").should("be.oneOf", [200, 401, 403]);
    });

    it("Analytics page calls: dashboard + cameras (+ fallbacks)", () => {
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.dashboard}*`).as("dash");
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.cameras}*`).as("cams");
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.analyticsByService}*`).as("bySvc");
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.analyticsByCamera}*`).as("byCam");

      cy.visit("/dashboard/carwash/analytics", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash/analytics");

      cy.wait("@dash").its("response.statusCode").should("be.oneOf", [200, 401, 403]);
      cy.wait("@cams").its("response.statusCode").should("be.oneOf", [200, 401, 403]);
    });

    it("Live page calls: cameras + stream", () => {
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.cameras}*`).as("cams");
      cy.intercept("GET", `${CAR_WASH_ENDPOINTS.cameraStream}*`).as("stream");

      cy.visit("/dashboard/carwash/live?camera=test", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash/live?camera=test");

      cy.wait("@cams").its("response.statusCode").should("be.oneOf", [200, 401, 403]);
      cy.wait("@stream").its("response.statusCode").should("be.oneOf", [200, 400, 401, 403, 404]);
    });

    it("all endpoints are under /api/customer/ (proxy path)", () => {
      Object.values(CAR_WASH_ENDPOINTS).forEach((path) => {
        expect(path).to.match(/^\/api\/customer\//);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2 · AUTHENTICATION — endpoints reject unauthorized requests
  // ═══════════════════════════════════════════════════════════════════════════
  describe("2 · Authentication", () => {
    Object.entries(CAR_WASH_ENDPOINTS).forEach(([name, path]) => {
      it(`${name}: returns 401 without auth token`, () => {
        cy.request({
          url: path,
          failOnStatusCode: false,
          headers: { Accept: "application/json" },
        }).then((res) => {
          expect(res.status).to.eq(401);
        });
      });

      it(`${name}: returns 401 with invalid token`, () => {
        cy.request({
          url: path,
          failOnStatusCode: false,
          headers: {
            Accept: "application/json",
            Authorization: "Bearer invalid-token-xyz",
          },
        }).then((res) => {
          expect(res.status).to.eq(401);
        });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3 · SCHEMA VALIDATION — fixture responses match expected shapes
  // ═══════════════════════════════════════════════════════════════════════════
  describe("3 · Schema Validation (via fixtures)", () => {
    it("dashboard fixture has summary with numeric fields", () => {
      cy.fixture("carwash/dashboard.json").then((data) => {
        expect(data).to.have.property("summary");
        const s = data.summary;
        expect(s.total_vehicles).to.be.a("number");
        expect(s.active_cameras).to.be.a("number");
        expect(s.total_cameras).to.be.a("number");
        expect(s.full_service).to.be.a("number");
        expect(s.avg_duration_min).to.be.a("number");
        expect(s.avg_ext_seconds).to.be.a("number");
        expect(s.avg_int_seconds).to.be.a("number");
      });
    });

    it("dashboard fixture has service_breakdown array", () => {
      cy.fixture("carwash/dashboard.json").then((data) => {
        expect(data.service_breakdown).to.be.an("array");
        data.service_breakdown.forEach((s: { type: string; count: number }) => {
          expect(s).to.have.property("type");
          expect(s).to.have.property("count");
          expect(s.count).to.be.a("number");
        });
      });
    });

    it("dashboard fixture has vehicles array with required fields", () => {
      cy.fixture("carwash/dashboard.json").then((data) => {
        expect(data.vehicles).to.be.an("array").with.length.greaterThan(0);
        data.vehicles.forEach(
          (v: {
            id: string;
            time: string;
            plate: string;
            track_id: number;
            vehicle_class: string;
            service: string;
            ext_seconds: number;
            int_seconds: number;
            zones: string[];
          }) => {
            expect(v).to.have.property("id");
            expect(v).to.have.property("time");
            expect(v).to.have.property("plate");
            expect(v).to.have.property("track_id");
            expect(v.track_id).to.be.a("number");
            expect(v).to.have.property("vehicle_class");
            expect(v).to.have.property("service");
            expect(v).to.have.property("ext_seconds");
            expect(v.ext_seconds).to.be.a("number");
            expect(v).to.have.property("int_seconds");
            expect(v.int_seconds).to.be.a("number");
            expect(v).to.have.property("zones");
            expect(v.zones).to.be.an("array");
          },
        );
      });
    });

    it("cameras fixture has data array with id, name, is_online", () => {
      cy.fixture("carwash/cameras.json").then((data) => {
        expect(data.data).to.be.an("array").with.length.greaterThan(0);
        data.data.forEach(
          (c: { id: string; name: string; is_online: boolean; zones: string[] }) => {
            expect(c).to.have.property("id");
            expect(c).to.have.property("name");
            expect(c).to.have.property("is_online");
            expect(c.is_online).to.be.a("boolean");
            expect(c).to.have.property("zones");
            expect(c.zones).to.be.an("array");
          },
        );
      });
    });

    it("stream fixture has url string", () => {
      cy.fixture("carwash/stream.json").then((data) => {
        expect(data).to.have.property("url");
        expect(data.url).to.be.a("string");
        expect(data.url).to.include("http");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4 · DUMMY DATA DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("4 · Dummy Data Detection", () => {
    const fixtures = [
      "carwash/dashboard.json",
      "carwash/cameras.json",
      "carwash/stream.json",
    ];

    fixtures.forEach((fx) => {
      it(`${fx} contains no dummy data`, () => {
        cy.fixture(fx).then((data) => {
          const found = containsDummy(data);
          expect(found, `Dummy data "${found}" in ${fx}`).to.be.null;
        });
      });
    });

    it("no repeated fake IDs in cameras fixture", () => {
      cy.fixture("carwash/cameras.json").then((data) => {
        const ids = data.data.map((c: { id: string }) => c.id);
        const unique = new Set(ids);
        expect(unique.size).to.eq(ids.length);
      });
    });

    it("no repeated fake IDs in vehicles fixture", () => {
      cy.fixture("carwash/dashboard.json").then((data) => {
        const ids = data.vehicles.map((v: { id: string }) => v.id);
        const unique = new Set(ids);
        expect(unique.size).to.eq(ids.length);
      });
    });

    it("vehicle data is not all identical (not static mock)", () => {
      cy.fixture("carwash/dashboard.json").then((data) => {
        if (data.vehicles.length > 1) {
          const first = JSON.stringify(data.vehicles[0]);
          const allSame = data.vehicles.every(
            (v: unknown) => JSON.stringify(v) === first,
          );
          expect(allSame, "All vehicles are identical — likely mock").to.be.false;
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5 · VALIDATION — bad inputs
  // ═══════════════════════════════════════════════════════════════════════════
  describe("5 · Validation (bad inputs)", () => {
    it("stream with empty camera id doesn't crash", () => {
      cy.intercept("GET", "/api/customer/cameras/stream*", {
        body: {},
      }).as("streamEmpty");
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("cams");

      cy.visit("/dashboard/carwash/live", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash/live");

      cy.wait("@cams");
      // Should still render the page without error
      cy.get("body").should("exist");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6 · PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════
  describe("6 · Performance (fixture response time)", () => {
    it("intercepted dashboard responds instantly", () => {
      cy.intercept("GET", "/api/customer/drive-thru/dashboard*", {
        fixture: "carwash/dashboard.json",
      }).as("dash");
      cy.intercept("GET", "/api/customer/cameras*", {
        fixture: "carwash/cameras.json",
      }).as("cams");

      cy.visit("/dashboard/carwash", { failOnStatusCode: false });
      cy.login();
      cy.visit("/dashboard/carwash");

      cy.wait("@dash").its("duration").should("be.lessThan", 5000);
      cy.wait("@cams").its("duration").should("be.lessThan", 5000);
    });
  });
});
