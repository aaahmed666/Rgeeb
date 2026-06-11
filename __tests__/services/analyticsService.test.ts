/**
 * analyticsService unit tests
 * Tests every method: real API shape, demo fallback, error, normalizers
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    analytics: {
      summary:   "/customer/analytics/summary",
      trends:    "/customer/analytics/trends",
      byService: "/customer/analytics/by-service",
      byCamera:  "/customer/analytics/by-camera",
      byBranch:  "/customer/analytics/by-branch",
      branches:  "/customer/branches",
    },
  },
}));

import { apiFetch } from "@/lib/api";
import { analyticsService } from "@/services/analyticsService";

const mockFetch = apiFetch as jest.Mock;

const RAW_SUMMARY = {
  total_detections: 29705,
  total_violations: 5861,
  compliance_score: 80.3,
  active_cameras: 4,
  total_cameras: 4,
  active_services: 29,
  detection_change: 3.6,
};

const RAW_TRENDS = [
  { period: "2026-05-15", total: 3200, violations: "400" },
  { period: "2026-05-16", total: 4100, violations: "512" },
];

const RAW_SERVICES = [
  { service_id: 1, name_en: "Customer Traffic", total: 22498, violations: "0" },
  { service_id: 2, name_en: "Kitchen PPE",      total: 5855,  violations: "5855" },
];

const RAW_CAMERAS = [
  { camera_id: 1, camera_name: "Gate",      branch_name: "Second Branch", total: 22498, violations: "0" },
  { camera_id: 2, camera_name: "PPE Cam",   branch_name: "Main Branch",   total: 5855,  violations: "5855" },
];

const RAW_BRANCHES = [
  { id: 1, name: "Second Branch", total_detections: 22498, violations: "0" },
  { id: 2, name: "Main Branch",   total_detections: 7207,  violations: "5861" },
];

beforeEach(() => jest.clearAllMocks());

// ─── getSummary ────────────────────────────────────────────────────────────────

describe("analyticsService.getSummary", () => {
  test("normalises raw summary correctly", async () => {
    mockFetch.mockResolvedValue({ data: RAW_SUMMARY });
    const s = await analyticsService.getSummary({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(s.total_detections).toBe(29705);
    expect(s.violations).toBe(5861);
    expect(s.compliance_score).toBe(80.3);
    expect(s.active_cameras).toBe(4);
    expect(s.active_services).toBe(29);
    expect(s.trend_pct).toBe(3.6);
  });

  test("unwraps both { data: ... } and flat response shapes", async () => {
    mockFetch.mockResolvedValue(RAW_SUMMARY);   // flat (no data wrapper)
    const s = await analyticsService.getSummary({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(s.total_detections).toBe(29705);
  });

  test("propagates network errors (no demo fallback)", async () => {
    mockFetch.mockRejectedValue(new Error("timeout"));
    await expect(
      analyticsService.getSummary({ dateFrom: "2026-05-01", dateTo: "2026-05-31" })
    ).rejects.toThrow("timeout");
  });

  test("all required fields are present", async () => {
    mockFetch.mockResolvedValue({ data: RAW_SUMMARY });
    const s = await analyticsService.getSummary({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    const required = ["total_detections","violations","compliance_score","active_cameras","total_cameras","active_services"];
    for (const k of required) expect(s).toHaveProperty(k);
  });
});

// ─── getTrends ─────────────────────────────────────────────────────────────────

describe("analyticsService.getTrends", () => {
  test("normalises trend points — slices date to MM-DD format", async () => {
    mockFetch.mockResolvedValue({ data: RAW_TRENDS });
    const trends = await analyticsService.getTrends({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(trends.length).toBe(2);
    expect(trends[0].date).toBe("05-15");
    expect(trends[0].detections).toBe(3200);
    expect(trends[0].violations).toBe(400);         // string → number
  });

  test("handles violations as string number", async () => {
    mockFetch.mockResolvedValue(RAW_TRENDS);
    const trends = await analyticsService.getTrends({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(typeof trends[0].violations).toBe("number");
  });

  test("propagates errors (no demo fallback)", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    await expect(
      analyticsService.getTrends({ dateFrom: "2026-05-01", dateTo: "2026-05-31" })
    ).rejects.toThrow("fail");
  });
});

// ─── getByService ──────────────────────────────────────────────────────────────

describe("analyticsService.getByService", () => {
  test("computes percentages correctly", async () => {
    mockFetch.mockResolvedValue({ data: RAW_SERVICES });
    const services = await analyticsService.getByService({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(services.length).toBe(2);
    const totalCount = RAW_SERVICES.reduce((s, r) => s + r.total, 0);
    for (const s of services) {
      expect(s.percent).toBe(Math.round((s.count / totalCount) * 100));
    }
  });

  test("violations converted from string to number or undefined", async () => {
    mockFetch.mockResolvedValue({ data: RAW_SERVICES });
    const services = await analyticsService.getByService({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    const traffic = services.find(s => s.name === "Customer Traffic");
    const ppe     = services.find(s => s.name === "Kitchen PPE");
    expect(traffic?.violations).toBeUndefined();          // "0" → falsy → undefined
    expect(ppe?.violations).toBe(5855);
  });

  test("each service has a color assigned", async () => {
    mockFetch.mockResolvedValue({ data: RAW_SERVICES });
    const services = await analyticsService.getByService({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    for (const s of services) expect(s.color).toBeTruthy();
  });

  test("propagates errors (no demo fallback)", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    await expect(
      analyticsService.getByService({ dateFrom: "2026-05-01", dateTo: "2026-05-31" })
    ).rejects.toThrow("fail");
  });
});

// ─── getByCamera ───────────────────────────────────────────────────────────────

describe("analyticsService.getByCamera", () => {
  test("computes violation rate correctly", async () => {
    mockFetch.mockResolvedValue({ data: RAW_CAMERAS });
    const cameras = await analyticsService.getByCamera({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    const gate = cameras.find(c => c.camera === "Gate");
    const ppe  = cameras.find(c => c.camera === "PPE Cam");
    expect(gate?.rate).toBe(0);     // 0/22498 = 0%
    expect(ppe?.rate).toBe(100);    // 5855/5855 = 100%
  });

  test("rate is 0 when total is 0", async () => {
    mockFetch.mockResolvedValue([{ camera_name: "Empty", branch_name: "B", total: 0, violations: "0" }]);
    const cameras = await analyticsService.getByCamera({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(cameras[0].rate).toBe(0);
  });

  test("all required fields present", async () => {
    mockFetch.mockResolvedValue({ data: RAW_CAMERAS });
    const cameras = await analyticsService.getByCamera({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    for (const c of cameras) {
      expect(c).toHaveProperty("camera");
      expect(c).toHaveProperty("branch");
      expect(c).toHaveProperty("total");
      expect(c).toHaveProperty("violations");
      expect(c).toHaveProperty("rate");
      expect(c.rate).toBeGreaterThanOrEqual(0);
      expect(c.rate).toBeLessThanOrEqual(100);
    }
  });

  test("propagates errors (no demo fallback)", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    await expect(
      analyticsService.getByCamera({ dateFrom: "2026-05-01", dateTo: "2026-05-31" })
    ).rejects.toThrow("fail");
  });
});

// ─── getByBranch ───────────────────────────────────────────────────────────────

describe("analyticsService.getByBranch", () => {
  test("computes violation_rate correctly", async () => {
    mockFetch.mockResolvedValue({ data: RAW_BRANCHES });
    const branches = await analyticsService.getByBranch({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    const second = branches.find(b => b.branch === "Second Branch");
    const main   = branches.find(b => b.branch === "Main Branch");
    expect(second?.violation_rate).toBe(0);
    expect(main?.violation_rate).toBe(81);  // Math.round(5861/7207*100)
  });

  test("violations converted from string to number", async () => {
    mockFetch.mockResolvedValue({ data: RAW_BRANCHES });
    const branches = await analyticsService.getByBranch({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    for (const b of branches) expect(typeof b.violations).toBe("number");
  });

  test("propagates errors (no demo fallback)", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    await expect(
      analyticsService.getByBranch({ dateFrom: "2026-05-01", dateTo: "2026-05-31" })
    ).rejects.toThrow("fail");
  });
});

// ─── getBranches ───────────────────────────────────────────────────────────────

describe("analyticsService.getBranches", () => {
  test("unwraps branch list from { data: [...] }", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "1", name: "Main" }, { id: "2", name: "Second" }] });
    const branches = await analyticsService.getBranches();
    expect(branches.length).toBe(2);
    expect(branches[0].id).toBe("1");
  });

  test("propagates errors (no demo fallback)", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    await expect(analyticsService.getBranches()).rejects.toThrow("fail");
  });
});
