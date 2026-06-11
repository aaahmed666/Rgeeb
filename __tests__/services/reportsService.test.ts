/**
 * reportsService unit tests
 * The corrected service: returns normalized payloads from the API, defaults
 * missing arrays to [], returns null for empty payloads, and PROPAGATES
 * errors (no demo fallback) so the Reports Overview error banner works.
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    reports: {
      statistics: "/customer/reports/statistics",
    },
  },
}));

import { apiFetch } from "@/lib/api";
import { fetchReport } from "@/services/reportsService";
import type { ReportTab } from "@/services/reportsService";

const mockFetch = apiFetch as jest.Mock;

const FILTERS = { dateFrom: "2026-05-01", dateTo: "2026-05-31" };

beforeEach(() => jest.clearAllMocks());

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
      expect(data).not.toBeNull();
      expect(data!.metrics.length).toBe(1);
      expect(data!.columns.length).toBe(2);
      expect(data!.rows.length).toBe(1);
    });

    test("defaults missing arrays to [] when API returns partial data", async () => {
      mockFetch.mockResolvedValueOnce({
        metrics: [{ label: "Custom", value: "999" }],
        // columns and rows missing → default to empty arrays, no demo merge
      });
      const data = await fetchReport(tab, FILTERS);
      expect(data).not.toBeNull();
      expect(data!.metrics[0].label).toBe("Custom");
      expect(data!.columns).toEqual([]);
      expect(data!.rows).toEqual([]);
    });

    test("returns null when payload has neither metrics nor rows", async () => {
      mockFetch.mockResolvedValueOnce({});
      const data = await fetchReport(tab, FILTERS);
      expect(data).toBeNull();
    });

    test("propagates network errors to the caller", async () => {
      mockFetch.mockRejectedValueOnce(new Error("timeout"));
      await expect(fetchReport(tab, FILTERS)).rejects.toThrow("timeout");
    });

    test("sends correct query params for the tab", async () => {
      mockFetch.mockResolvedValueOnce({ metrics: [], rows: [{ a: 1 }] });
      await fetchReport(tab, FILTERS);
      expect(mockFetch).toHaveBeenCalledWith(
        "/customer/reports/statistics",
        expect.objectContaining({
          query: { date_from: FILTERS.dateFrom, date_to: FILTERS.dateTo, type: tab },
        })
      );
    });
  });
}
