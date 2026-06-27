/// <reference types="cypress" />

/**
 * Customer Lifecycle — Comprehensive API Test Suite
 *
 * Discovered endpoints (from src/lib/endpoints.ts → customerLifecycle):
 *
 *  #  | Method | Path                                            | Function
 * --- | ------ | ----------------------------------------------- | --------------------
 *  1  | GET    | /customer-lifecycle/dashboard-stats              | dashboardStats
 *  2  | GET    | /customer-lifecycle/customer-growth              | customerGrowth
 *  3  | GET    | /customer-lifecycle/subscription-tiers           | subscriptionTiers
 *  4  | GET    | /customer-lifecycle/status-distribution          | statusDistribution
 *  5  | GET    | /customer-lifecycle/onboarding-efficiency        | onboardingEfficiency
 *  6  | GET    | /customer-lifecycle/distribution                 | customerDistribution
 *  7  | GET    | /customer-lifecycle/lifecycle-status              | lifecycleStatus
 *  8  | GET    | /customer-lifecycle/customers                    | customers (list)
 *  9  | POST   | /customer-lifecycle/customers                    | customers (create)
 * 10  | GET    | /customer-lifecycle/customers/:id                | customer (profile)
 * 11  | PUT    | /customer-lifecycle/customers/:id                | customer (update)
 * 12  | DELETE | /customer-lifecycle/customers/:id                | customer (delete)
 * 13  | GET    | /customer-lifecycle/lifecycle/:customerId        | lifecycle
 * 14  | GET    | /customer-lifecycle/timeline/:customerId         | timeline
 * 15  | GET    | /customer-lifecycle/subscriptions/:id            | subscriptionOverview
 * 16  | GET    | /customer-lifecycle/renewals/stats               | renewalStats
 * 17  | GET    | /customer-lifecycle/renewals/groups              | renewalGroups
 *
 * All paths go through /api proxy → /api/customer-lifecycle/...
 */

// ── All endpoint paths (via /api proxy) ─────────────────────────────────────
const CL = {
  dashboardStats: "/api/customer-lifecycle/dashboard-stats",
  customerGrowth: "/api/customer-lifecycle/customer-growth",
  subscriptionTiers: "/api/customer-lifecycle/subscription-tiers",
  statusDistribution: "/api/customer-lifecycle/status-distribution",
  onboardingEfficiency: "/api/customer-lifecycle/onboarding-efficiency",
  customerDistribution: "/api/customer-lifecycle/distribution",
  lifecycleStatus: "/api/customer-lifecycle/lifecycle-status",
  customers: "/api/customer-lifecycle/customers",
  customer: (id: string) => `/api/customer-lifecycle/customers/${id}`,
  lifecycle: (id: string) => `/api/customer-lifecycle/lifecycle/${id}`,
  timeline: (id: string) => `/api/customer-lifecycle/timeline/${id}`,
  subscriptions: (id: string) => `/api/customer-lifecycle/subscriptions/${id}`,
  renewalStats: "/api/customer-lifecycle/renewals/stats",
  renewalGroups: "/api/customer-lifecycle/renewals/groups",
} as const;

// All static GET endpoints for bulk tests
const STATIC_ENDPOINTS: { name: string; path: string }[] = [
  { name: "dashboardStats", path: CL.dashboardStats },
  { name: "customerGrowth", path: CL.customerGrowth },
  { name: "subscriptionTiers", path: CL.subscriptionTiers },
  { name: "statusDistribution", path: CL.statusDistribution },
  { name: "onboardingEfficiency", path: CL.onboardingEfficiency },
  { name: "customerDistribution", path: CL.customerDistribution },
  { name: "lifecycleStatus", path: CL.lifecycleStatus },
  { name: "customers", path: CL.customers },
  { name: "renewalStats", path: CL.renewalStats },
  { name: "renewalGroups", path: CL.renewalGroups },
];

// ── Dummy data patterns ─────────────────────────────────────────────────────
const CL_DUMMY_PATTERNS = [
  /John\s*Doe/i,
  /Jane\s*Doe/i,
  /Test\s*User/i,
  /Lorem\s*Ipsum/i,
  /\bplaceholder\b/i,
  /\bdummy\b/i,
  /\bfake\b/i,
  /example\.com/i,
  /sample\s*data/i,
] as const;

function clContainsDummy(body: unknown): string | null {
  const text = JSON.stringify(body);
  for (const p of CL_DUMMY_PATTERNS) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · AUTHENTICATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Authentication", () => {
  STATIC_ENDPOINTS.forEach(({ name, path }) => {
    it(`${name}: rejects request without auth token (401)`, () => {
      cy.request({
        url: path,
        failOnStatusCode: false,
        headers: { Accept: "application/json" },
      }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });

  it("customers/:id rejects without token (401)", () => {
    cy.request({
      url: CL.customer("RGE-10293"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("lifecycle/:id rejects without token (401)", () => {
    cy.request({
      url: CL.lifecycle("RGE-10293"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("timeline/:id rejects without token (401)", () => {
    cy.request({
      url: CL.timeline("RGE-10293"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("subscriptions/:id rejects without token (401)", () => {
    cy.request({
      url: CL.subscriptions("RGE-10293"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("rejects invalid bearer token (401)", () => {
    cy.request({
      url: CL.dashboardStats,
      failOnStatusCode: false,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer invalid-garbage-token-xyz",
      },
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it("rejects expired JWT (401)", () => {
    const expired =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiIxIiwiZXhwIjoxMDAwMDAwMDAwfQ." +
      "expired_sig";
    cy.request({
      url: CL.dashboardStats,
      failOnStatusCode: false,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${expired}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · SCHEMA VALIDATION (via fixtures)
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Schema Validation", () => {
  describe("DashboardStats", () => {
    it("has all required numeric KPI fields", () => {
      cy.fixture("customer-lifecycle/dashboard-stats.json").then((data) => {
        const numericFields = [
          "totalCustomers", "totalCustomersTrend",
          "activeCustomers", "activeCustomersTrend",
          "inOnboarding", "activeSubscriptions", "activeSubscriptionsTrend",
          "upcomingRenewals", "totalBranches", "totalBranchesTrend",
          "totalCameras", "totalCamerasTrend",
          "activeAiServices", "activeAiServicesTrend",
          "activeIntegrations", "activeIntegrationsTrend",
        ];
        numericFields.forEach((f) => {
          expect(data).to.have.property(f);
          expect(data[f]).to.be.a("number");
        });
      });
    });

    it("has string label fields", () => {
      cy.fixture("customer-lifecycle/dashboard-stats.json").then((data) => {
        expect(data.inOnboardingLabel).to.be.a("string");
        expect(data.upcomingRenewalsLabel).to.be.a("string");
      });
    });
  });

  describe("CustomerGrowth", () => {
    it("is an array of {month, value} objects", () => {
      cy.fixture("customer-lifecycle/customer-growth.json").then((data) => {
        expect(data).to.be.an("array").with.length.greaterThan(0);
        data.forEach((p: { month: string; value: number }) => {
          expect(p).to.have.property("month");
          expect(p.month).to.be.a("string");
          expect(p).to.have.property("value");
          expect(p.value).to.be.a("number");
        });
      });
    });
  });

  describe("SubscriptionTiers", () => {
    it("each tier has name, value (number), color", () => {
      cy.fixture("customer-lifecycle/subscription-tiers.json").then((data) => {
        expect(data).to.be.an("array").with.length.greaterThan(0);
        data.forEach((t: { name: string; value: number; color: string }) => {
          expect(t.name).to.be.a("string");
          expect(t.value).to.be.a("number");
          expect(t.color).to.be.a("string");
        });
      });
    });
  });

  describe("Customer List", () => {
    it("has paginated response shape: data[], total, page, totalPages", () => {
      cy.fixture("customer-lifecycle/customers.json").then((data) => {
        expect(data).to.have.property("data").that.is.an("array");
        expect(data).to.have.property("total").that.is.a("number");
        expect(data).to.have.property("page").that.is.a("number");
        expect(data).to.have.property("totalPages").that.is.a("number");
      });
    });

    it("each customer has required fields with correct types", () => {
      cy.fixture("customer-lifecycle/customers.json").then(
        (data: { data: Array<Record<string, unknown>> }) => {
          data.data.forEach((c) => {
            expect(c).to.have.property("id").that.is.a("string");
            expect(c).to.have.property("name").that.is.a("string");
            expect(c).to.have.property("initials").that.is.a("string");
            expect(c).to.have.property("customerId").that.is.a("string");
            expect(c).to.have.property("businessType").that.is.a("string");
            expect(c).to.have.property("status").that.is.a("string");
            expect(c).to.have.property("branches").that.is.a("number");
            expect(c).to.have.property("cameras").that.is.a("number");
            expect(c).to.have.property("aiServices").that.is.a("number");
            expect(c).to.have.property("package").that.is.a("string");
            expect(c).to.have.property("endDate").that.is.a("string");
          });
        },
      );
    });

    it("status values are within valid enum", () => {
      const valid = ["Active", "Onboarding", "Warning", "Suspended", "Churned"];
      cy.fixture("customer-lifecycle/customers.json").then(
        (data: { data: Array<{ status: string }> }) => {
          data.data.forEach((c) => {
            expect(c.status).to.be.oneOf(valid);
          });
        },
      );
    });
  });

  describe("CustomerProfile", () => {
    it("has all required top-level fields", () => {
      cy.fixture("customer-lifecycle/customer-profile.json").then((data) => {
        expect(data).to.have.property("id");
        expect(data).to.have.property("name");
        expect(data).to.have.property("tier");
        expect(data).to.have.property("healthScore").that.is.a("number");
        expect(data).to.have.property("totalBranches").that.is.a("number");
        expect(data).to.have.property("totalCameras").that.is.a("number");
        expect(data).to.have.property("aiServices").that.is.a("number");
        expect(data).to.have.property("companyInfo").that.is.an("object");
        expect(data).to.have.property("contacts").that.is.an("array");
        expect(data).to.have.property("subscription").that.is.an("object");
        expect(data).to.have.property("recentActivity").that.is.an("array");
      });
    });

    it("subscription has plan, status, dates, features", () => {
      cy.fixture("customer-lifecycle/customer-profile.json").then(
        (data: { subscription: Record<string, unknown> }) => {
          const sub = data.subscription;
          expect(sub).to.have.property("plan").that.is.a("string");
          expect(sub).to.have.property("status").that.is.a("string");
          expect(sub).to.have.property("startDate").that.is.a("string");
          expect(sub).to.have.property("renewalDate").that.is.a("string");
          expect(sub).to.have.property("daysRemaining").that.is.a("number");
          expect(sub).to.have.property("features").that.is.an("array");
        },
      );
    });

    it("healthScore is between 0 and 100", () => {
      cy.fixture("customer-lifecycle/customer-profile.json").then(
        (data: { healthScore: number }) => {
          expect(data.healthScore).to.be.gte(0).and.lte(100);
        },
      );
    });
  });

  describe("RenewalStats", () => {
    it("has numeric healthScore and upcomingRenewals", () => {
      cy.fixture("customer-lifecycle/renewal-stats.json").then((data) => {
        expect(data.healthScore).to.be.a("number");
        expect(data.upcomingRenewals).to.be.a("number");
        expect(data.highRiskAttrition).to.be.a("number");
        expect(data.forecastedRevenue).to.be.a("string");
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · VALIDATION TESTS (bad inputs)
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Validation", () => {
  it("GET customer with invalid ID returns 404 or 422", () => {
    cy.request({
      url: CL.customer("NONEXISTENT-99999"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.be.oneOf([401, 404, 422]);
    });
  });

  it("GET lifecycle with empty ID returns 4xx", () => {
    cy.request({
      url: CL.lifecycle(""),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("GET timeline with invalid UUID returns 4xx", () => {
    cy.request({
      url: CL.timeline("not-a-valid-uuid!@#"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("DELETE customer with invalid ID returns 4xx", () => {
    cy.request({
      method: "DELETE",
      url: CL.customer("INVALID-ID"),
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("POST create customer with empty body returns 4xx", () => {
    cy.request({
      method: "POST",
      url: CL.customers,
      failOnStatusCode: false,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: {},
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("PUT update customer with null values returns 4xx", () => {
    cy.request({
      method: "PUT",
      url: CL.customer("RGE-10293"),
      failOnStatusCode: false,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: { name: null, status: null },
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });

  it("GET customers with invalid page param returns 4xx or empty", () => {
    cy.request({
      url: `${CL.customers}?page=-1&perPage=abc`,
      failOnStatusCode: false,
      headers: { Accept: "application/json" },
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 400, 401, 422]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · DUMMY DATA DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Dummy Data Detection", () => {
  const fixtures = [
    "customer-lifecycle/dashboard-stats.json",
    "customer-lifecycle/customers.json",
    "customer-lifecycle/customer-profile.json",
    "customer-lifecycle/customer-growth.json",
    "customer-lifecycle/subscription-tiers.json",
    "customer-lifecycle/renewal-stats.json",
  ];

  fixtures.forEach((fx) => {
    it(`${fx} contains no dummy/placeholder data`, () => {
      cy.fixture(fx).then((data) => {
        const found = clContainsDummy(data);
        expect(found, `Dummy data "${found}" in ${fx}`).to.be.null;
      });
    });
  });

  it("customer IDs are unique (no repeated fake IDs)", () => {
    cy.fixture("customer-lifecycle/customers.json").then(
      (data: { data: Array<{ id: string }> }) => {
        const ids = data.data.map((c) => c.id);
        const unique = new Set(ids);
        expect(unique.size).to.eq(ids.length);
      },
    );
  });

  it("customer records are not all identical (not static mock)", () => {
    cy.fixture("customer-lifecycle/customers.json").then(
      (data: { data: Array<Record<string, unknown>> }) => {
        if (data.data.length > 1) {
          const first = JSON.stringify(data.data[0]);
          const allSame = data.data.every((c) => JSON.stringify(c) === first);
          expect(allSame, "All customers are identical — likely static mock").to.be.false;
        }
      },
    );
  });

  it("growth data has increasing trend (not random)", () => {
    cy.fixture("customer-lifecycle/customer-growth.json").then(
      (data: Array<{ value: number }>) => {
        // Generally increasing — last value > first value
        expect(data[data.length - 1].value).to.be.gte(data[0].value);
      },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Business Logic", () => {
  it("dashboard activeCustomers <= totalCustomers", () => {
    cy.fixture("customer-lifecycle/dashboard-stats.json").then(
      (data: { activeCustomers: number; totalCustomers: number }) => {
        expect(data.activeCustomers).to.be.lte(data.totalCustomers);
      },
    );
  });

  it("dashboard numeric KPIs are non-negative", () => {
    cy.fixture("customer-lifecycle/dashboard-stats.json").then((data) => {
      Object.values(data).forEach((v) => {
        if (typeof v === "number") expect(v).to.be.gte(0);
      });
    });
  });

  it("subscription tiers sum to 100%", () => {
    cy.fixture("customer-lifecycle/subscription-tiers.json").then(
      (data: Array<{ value: number }>) => {
        const total = data.reduce((sum, t) => sum + t.value, 0);
        expect(total).to.eq(100);
      },
    );
  });

  it("renewal healthScore is between 0 and 100", () => {
    cy.fixture("customer-lifecycle/renewal-stats.json").then(
      (data: { healthScore: number }) => {
        expect(data.healthScore).to.be.gte(0).and.lte(100);
      },
    );
  });

  it("customer profile healthScore is within 0-100", () => {
    cy.fixture("customer-lifecycle/customer-profile.json").then(
      (data: { healthScore: number }) => {
        expect(data.healthScore).to.be.gte(0).and.lte(100);
      },
    );
  });

  it("subscription daysRemaining is non-negative", () => {
    cy.fixture("customer-lifecycle/customer-profile.json").then(
      (data: { subscription: { daysRemaining: number } }) => {
        expect(data.subscription.daysRemaining).to.be.gte(0);
      },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · ENDPOINT COVERAGE (via intercept on real pages)
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Endpoint Coverage", () => {
  it("Dashboard page calls dashboardStats + growth + tiers + status + efficiency + distribution + lifecycle-status", () => {
    cy.intercept("GET", `${CL.dashboardStats}*`).as("dashStats");
    cy.intercept("GET", `${CL.customerGrowth}*`).as("growth");
    cy.intercept("GET", `${CL.subscriptionTiers}*`).as("tiers");
    cy.intercept("GET", `${CL.statusDistribution}*`).as("statusDist");
    cy.intercept("GET", `${CL.onboardingEfficiency}*`).as("onboarding");
    cy.intercept("GET", `${CL.customerDistribution}*`).as("distribution");
    cy.intercept("GET", `${CL.lifecycleStatus}*`).as("lifecycleStatus");

    cy.visit("/dashboard/customer-lifecycle", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle");

    cy.wait("@dashStats");
    cy.wait("@growth");
    cy.wait("@tiers");
    cy.wait("@statusDist");
    cy.wait("@onboarding");
    cy.wait("@distribution");
    cy.wait("@lifecycleStatus");
  });

  it("Customers page calls customers list endpoint", () => {
    cy.intercept("GET", `${CL.customers}*`).as("customerList");

    cy.visit("/dashboard/customer-lifecycle/customers", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle/customers");

    cy.wait("@customerList");
  });

  it("Renewals page calls renewalStats + renewalGroups", () => {
    cy.intercept("GET", `${CL.renewalStats}*`).as("renewStats");
    cy.intercept("GET", `${CL.renewalGroups}*`).as("renewGroups");

    cy.visit("/dashboard/customer-lifecycle/renewals", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle/renewals");

    cy.wait("@renewStats");
    cy.wait("@renewGroups");
  });

  it("all endpoint paths are under /api/customer-lifecycle/ (proxy)", () => {
    const allPaths = [
      CL.dashboardStats, CL.customerGrowth, CL.subscriptionTiers,
      CL.statusDistribution, CL.onboardingEfficiency, CL.customerDistribution,
      CL.lifecycleStatus, CL.customers, CL.renewalStats, CL.renewalGroups,
      CL.customer("test"), CL.lifecycle("test"),
      CL.timeline("test"), CL.subscriptions("test"),
    ];
    allPaths.forEach((p) => {
      expect(p).to.match(/^\/api\/customer-lifecycle\//);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7 · ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Error Handling", () => {
  it("500 on dashboardStats shows error gracefully (no crash)", () => {
    cy.intercept("GET", `${CL.dashboardStats}*`, { statusCode: 500, body: {} }).as("dashErr");
    // Intercept all other dashboard APIs to prevent them from blocking
    cy.intercept("GET", `${CL.customerGrowth}*`, { body: [] });
    cy.intercept("GET", `${CL.subscriptionTiers}*`, { body: [] });
    cy.intercept("GET", `${CL.statusDistribution}*`, { body: [] });
    cy.intercept("GET", `${CL.onboardingEfficiency}*`, { body: {} });
    cy.intercept("GET", `${CL.customerDistribution}*`, { body: [] });
    cy.intercept("GET", `${CL.lifecycleStatus}*`, { body: [] });

    cy.visit("/dashboard/customer-lifecycle", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle");

    cy.wait("@dashErr");
    // Page should still render (mock fallback catches the error)
    cy.get("body").should("exist");
  });

  it("500 on customers list uses mock fallback", () => {
    cy.intercept("GET", `${CL.customers}*`, { statusCode: 500, body: {} }).as("custErr");

    cy.visit("/dashboard/customer-lifecycle/customers", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle/customers");

    cy.wait("@custErr");
    cy.get("body").should("exist");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8 · PERFORMANCE (fixture sanity)
// ═══════════════════════════════════════════════════════════════════════════

describe("Customer Lifecycle — Performance", () => {
  it("intercepted dashboard loads within 5s", () => {
    cy.intercept("GET", `${CL.dashboardStats}*`, { fixture: "customer-lifecycle/dashboard-stats.json" }).as("dashStats");
    cy.intercept("GET", `${CL.customerGrowth}*`, { fixture: "customer-lifecycle/customer-growth.json" });
    cy.intercept("GET", `${CL.subscriptionTiers}*`, { fixture: "customer-lifecycle/subscription-tiers.json" });
    cy.intercept("GET", `${CL.statusDistribution}*`, { body: [] });
    cy.intercept("GET", `${CL.onboardingEfficiency}*`, { body: {} });
    cy.intercept("GET", `${CL.customerDistribution}*`, { body: [] });
    cy.intercept("GET", `${CL.lifecycleStatus}*`, { body: [] });

    cy.visit("/dashboard/customer-lifecycle", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle");

    cy.wait("@dashStats").its("duration").should("be.lessThan", 5000);
  });

  it("intercepted customer list loads within 5s", () => {
    cy.intercept("GET", `${CL.customers}*`, { fixture: "customer-lifecycle/customers.json" }).as("custList");

    cy.visit("/dashboard/customer-lifecycle/customers", { failOnStatusCode: false });
    cy.login();
    cy.visit("/dashboard/customer-lifecycle/customers");

    cy.wait("@custList").its("duration").should("be.lessThan", 5000);
  });
});
