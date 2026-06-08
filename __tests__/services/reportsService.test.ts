/**
 * reportsService unit tests
 * Tests all 6 report tabs: API merge with demo, fallback on error
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    reports: {
      customers:  "/customer/reports/customers",
      suppliers:  "/customer/reports/suppliers",
      sales:      "/customer/reports/sales",
      purchases:  "/customer/reports/purchases",
      inventory:  "/customer/reports/inventory",
      financials: "/customer/reports/financials",
    },
  },
}));

import { apiFetch } from "@/lib/api";
import { fetchReport } from "@/services/reportsService";
import type { ReportTab } from "@/services/reportsService";

const mockFetch = apiFetch as jest.Mock;

const FILTERS = { dateFrom: "2026-05-01", dateTo: "2026-05-31" };

beforeEach(() => jest.clearAllMocks());

// ─── Shared shape tests ────────────────────────────────────────────────────────

const ALL_TABS: ReportTab[] = ["customers","suppliers","sales","purchases","inventory","financials"];

for (const tab of ALL_TABS) {
  describe(`fetchReport("${tab}")`, () => {
    test("returns complete ReportPayload from API", async () => {
      const API_RESPONSE = {
        metrics: [{ label: "Total", value: "100", trend: 5 }],
        columns: [{ key: "name", label: "Name" }, { key: "value", label: "Value" }],
        rows:    [{ name: "Item A", value: "50" }],
      };
      mockFetch.mockResolvedValueOnce(API_RESPONSE);
      const data = await fetchReport(tab, FILTERS);
      expect(data.metrics.length).toBe(1);
      expect(data.columns.length).toBe(2);
      expect(data.rows.length).toBe(1);
    });

    test("merges with demo when API returns partial data (missing rows)", async () => {
      mockFetch.mockResolvedValueOnce({
        metrics: [{ label: "Custom", value: "999" }],
        // columns and rows missing → should fall back to demo values
      });
      const data = await fetchReport(tab, FILTERS);
      expect(data.metrics[0].label).toBe("Custom");  // API metric used
      expect(data.columns.length).toBeGreaterThan(0); // demo columns
      expect(data.rows.length).toBeGreaterThan(0);    // demo rows
    });

    test("returns full demo data on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("timeout"));
      const data = await fetchReport(tab, FILTERS);
      expect(data.metrics.length).toBeGreaterThan(0);
      expect(data.columns.length).toBeGreaterThan(0);
      expect(data.rows.length).toBeGreaterThan(0);
    });

    test("metrics have required fields", async () => {
      mockFetch.mockRejectedValueOnce(new Error("fail"));
      const data = await fetchReport(tab, FILTERS);
      for (const m of data.metrics) {
        expect(m).toHaveProperty("label");
        expect(m).toHaveProperty("value");
      }
    });

    test("columns have key and label", async () => {
      mockFetch.mockRejectedValueOnce(new Error("fail"));
      const data = await fetchReport(tab, FILTERS);
      for (const c of data.columns) {
        expect(c).toHaveProperty("key");
        expect(c).toHaveProperty("label");
      }
    });
  });
}

// ─── Demo data completeness ────────────────────────────────────────────────────

describe("reportsService demo data completeness", () => {
  test("each tab has at least 4 metrics in demo", async () => {
    for (const tab of ALL_TABS) {
      mockFetch.mockRejectedValueOnce(new Error("fail"));
      const data = await fetchReport(tab, FILTERS);
      expect(data.metrics.length).toBeGreaterThanOrEqual(4);
    }
  });

  test("each tab has at least 2 rows in demo", async () => {
    for (const tab of ALL_TABS) {
      mockFetch.mockRejectedValueOnce(new Error("fail"));
      const data = await fetchReport(tab, FILTERS);
      expect(data.rows.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("financials tab demo has Revenue, Expenses, Profit metrics", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fail"));
    const data = await fetchReport("financials", FILTERS);
    const labels = data.metrics.map(m => m.label);
    expect(labels).toContain("Revenue");
    expect(labels).toContain("Expenses");
    expect(labels).toContain("Profit");
  });

  test("customers tab demo has Revenue metric with trend", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fail"));
    const data = await fetchReport("customers", FILTERS);
    const revenue = data.metrics.find(m => m.label === "Revenue");
    expect(revenue).toBeDefined();
    expect(revenue?.trend).toBeGreaterThan(0);
  });
});
