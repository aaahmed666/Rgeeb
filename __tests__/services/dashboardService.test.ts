/**
 * dashboardService unit tests
 * Tests every method with:
 *  - real API response shape
 *  - missing/null fields (honest empty values — no fabricated demo data)
 *  - error case (network failure)
 *
 * The in-flight cache is invalidated before every test so results never
 * leak between tests.
 */

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
}));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    dashboard: { overview: "/customer/dashboard" },
    notifications: {
      unreadCount: "/customer/notifications/unread-count",
      list: "/customer/notifications",
    },
    auth: { profile: "/customer/profile" },
  },
}));

import { api } from "@/lib/api";
import {
  dashboardService,
  invalidateDashboardCache,
} from "@/services/dashboardService";

const mockGet = api.get as jest.Mock;

// Realistic API response
const FULL_PAYLOAD = {
  data: {
    cameras: { online: 3, total: 4 },
    active_services: [
      { id: 1, name_en: "Helmet Detection", key: "helmet", status: "active", detections: 12 },
      { id: 2, name_en: "Customer Traffic", key: "customer_traffic", status: "inactive" },
    ],
    tasks: { total: 30, open: 10, in_progress: 8, overdue: 3, completion_rate: 72 },
    visitor_flow: [
      { hour: "08", in: 50, out: 40 },
      { hour: "09", in: 80, out: 60 },
    ],
    live_activity: [
      { id: "a1", type: "PPE Violation", branch: "Main", source: "Cam 1", ago_seconds: 15, severity: "warning", timestamp: "10:00" },
    ],
    attendance: { total: 50, checked_in: 40, present: 35, checked_out: 5, absent: 10 },
    compliance: { score: 85, total_detections: 1200, violations: 180, clean: 1020 },
    detections_breakdown: [
      { key: "helmet", label: "Helmet", count: 100, percent: 50, color: "#6366f1" },
    ],
    branches: [
      { id: "b1", name: "Main Branch", cameras_online: 3, cameras_total: 4, detections: 120, grade: "A" },
    ],
    branches_summary: [
      { id: "b1", name: "Main Branch", cameras_online: 3, cameras_total: 4, detections: 120, grade: "A" },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  invalidateDashboardCache(); // never reuse a cached payload across tests
  mockGet.mockResolvedValue(FULL_PAYLOAD);
});

// ─── getSummary ────────────────────────────────────────────────────────────────

describe("dashboardService.getSummary", () => {
  test("returns mapped cameras and service counts from real payload", async () => {
    const result = await dashboardService.getSummary();
    expect(result.cameras.online).toBe(3);
    expect(result.cameras.total).toBe(4);
    expect(result.aiServicesActive).toBeGreaterThan(0);
    expect(result.branches.length).toBeGreaterThan(0);
    expect(result.branches[0]).toEqual({ id: "b1", name: "Main Branch" });
  });

  test("returns honest zeros (no fabricated 4/4 cameras) on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("timeout"));
    const result = await dashboardService.getSummary();
    expect(result.cameras).toEqual({ online: 0, total: 0 });
    expect(result.aiServicesActive).toBe(0);
    expect(result.detections).toBe(0);
    expect(result.branches).toEqual([]);
  });

  test("returns empty branches (no fake Main/Second) when payload has none", async () => {
    mockGet.mockResolvedValueOnce({ data: { cameras: { online: 1, total: 2 } } });
    const result = await dashboardService.getSummary();
    expect(result.cameras.online).toBe(1);
    expect(result.branches).toEqual([]);
  });
});

// ─── listAIServices ────────────────────────────────────────────────────────────

describe("dashboardService.listAIServices", () => {
  test("maps active_services with status and category", async () => {
    const services = await dashboardService.listAIServices();
    expect(services.length).toBe(2);
    const helmet = services.find((s) => s.key === "helmet");
    expect(helmet?.status).toBe("active");
    const traffic = services.find((s) => s.name.toLowerCase().includes("traffic"));
    expect(traffic?.status).toBe("inactive");
  });

  test("returns [] (no demo catalog) when API returns empty services", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const services = await dashboardService.listAIServices();
    expect(services).toEqual([]);
  });

  test("returns [] on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("timeout"));
    const services = await dashboardService.listAIServices();
    expect(services).toEqual([]);
  });

  test("each service has required shape", async () => {
    const services = await dashboardService.listAIServices();
    for (const s of services) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("key");
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("category");
      expect(s).toHaveProperty("status");
      expect(["active", "inactive"]).toContain(s.status);
      expect(["safety", "analytics", "operations", "monitoring"]).toContain(s.category);
    }
  });
});

// ─── getTaskSummary ────────────────────────────────────────────────────────────

describe("dashboardService.getTaskSummary", () => {
  test("maps task fields correctly", async () => {
    const tasks = await dashboardService.getTaskSummary();
    expect(tasks.total).toBe(30);
    expect(tasks.open).toBe(10);
    expect(tasks.inProgress).toBe(8);
    expect(tasks.overdue).toBe(3);
    expect(tasks.completionRate).toBe(72);
  });

  test("returns zeros when tasks key missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const tasks = await dashboardService.getTaskSummary();
    expect(tasks.total).toBe(0);
    expect(tasks.completionRate).toBe(0);
  });

  test("handles null payload", async () => {
    mockGet.mockRejectedValueOnce(new Error("fail"));
    const tasks = await dashboardService.getTaskSummary();
    expect(tasks).toMatchObject({ total: 0, open: 0, inProgress: 0, overdue: 0, completionRate: 0 });
  });
});

// ─── getVisitorFlow ─────────────────────────────────────────────────────────────

describe("dashboardService.getVisitorFlow", () => {
  test("maps visitor flow array from API", async () => {
    const flow = await dashboardService.getVisitorFlow();
    expect(flow.length).toBe(2);
    expect(flow[0]).toEqual({ hour: "08", in: 50, out: 40 });
  });

  test("returns [] (no fabricated 24-hour series) when API empty", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const flow = await dashboardService.getVisitorFlow();
    expect(flow).toEqual([]);
  });

  test("all flow points have valid numbers", async () => {
    const flow = await dashboardService.getVisitorFlow();
    for (const p of flow) {
      expect(typeof p.in).toBe("number");
      expect(typeof p.out).toBe("number");
      expect(p.in).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── getLiveActivity ───────────────────────────────────────────────────────────

describe("dashboardService.getLiveActivity", () => {
  test("maps live activity from API", async () => {
    const activity = await dashboardService.getLiveActivity();
    expect(activity.length).toBe(1);
    const a = activity[0];
    expect(a.id).toBe("a1");
    expect(a.type).toBe("PPE Violation");
    expect(["info", "warning", "critical"]).toContain(a.severity);
    expect(a.branch).toBe("Main");
  });

  test("returns [] (no demo feed) when API empty", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const activity = await dashboardService.getLiveActivity();
    expect(activity).toEqual([]);
  });

  test("all activity items have required fields", async () => {
    const activity = await dashboardService.getLiveActivity();
    for (const a of activity) {
      expect(a).toHaveProperty("id");
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("branch");
      expect(a).toHaveProperty("source");
    }
  });

  test("infers severity from event type when not provided", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        live_activity: [
          { id: "x1", type: "PPE violation", branch: "B", source: "S", ago_seconds: 10, timestamp: "09:00" },
          { id: "x2", type: "fire alert", branch: "B", source: "S", score: 0.9, ago_seconds: 5, timestamp: "09:01" },
          { id: "x3", type: "crossing", branch: "B", source: "S", ago_seconds: 20, timestamp: "09:02" },
        ],
      },
    });
    const activity = await dashboardService.getLiveActivity();
    const violation = activity.find((a) => a.id === "x1");
    const fire = activity.find((a) => a.id === "x2");
    const crossing = activity.find((a) => a.id === "x3");
    expect(violation?.severity).toBe("warning");
    expect(fire?.severity).toBe("critical");
    expect(crossing?.severity).toBe("info");
  });
});

// ─── getAttendance ─────────────────────────────────────────────────────────────

describe("dashboardService.getAttendance", () => {
  test("maps attendance data from API", async () => {
    const att = await dashboardService.getAttendance();
    expect(att).not.toBeNull();
    expect(att!.total).toBe(50);
    expect(att!.checkedIn).toBe(40);
    expect(att!.present).toBe(35);
    expect(att!.checkedOut).toBe(5);
    expect(att!.absent).toBe(10);
  });

  test("returns null (no demo data) when attendance key missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const att = await dashboardService.getAttendance();
    expect(att).toBeNull();
  });
});

// ─── getCompliance ─────────────────────────────────────────────────────────────

describe("dashboardService.getCompliance", () => {
  test("maps compliance score from API", async () => {
    const c = await dashboardService.getCompliance();
    expect(c).not.toBeNull();
    expect(c!.score).toBe(85);
    expect(c!.totalDetections).toBe(1200);
    expect(c!.violations).toBe(180);
    expect(c!.clean).toBe(1020);
  });

  test("violations + clean equals totalDetections in payload", async () => {
    const c = await dashboardService.getCompliance();
    expect(c).not.toBeNull();
    expect(c!.violations + c!.clean).toBe(c!.totalDetections);
  });

  test("derives score when backend omits it", async () => {
    mockGet.mockResolvedValueOnce({
      data: { compliance: { total_detections: 1000, violations: 100 } },
    });
    const c = await dashboardService.getCompliance();
    expect(c).not.toBeNull();
    expect(c!.score).toBe(90); // 100 - (100/1000)*100
  });

  test("returns null (no demo score) when key missing", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const c = await dashboardService.getCompliance();
    expect(c).toBeNull();
  });
});

// ─── getDetectionBreakdown ──────────────────────────────────────────────────────

describe("dashboardService.getDetectionBreakdown", () => {
  test("maps breakdown array from API", async () => {
    const bd = await dashboardService.getDetectionBreakdown();
    expect(bd.length).toBe(1);
    expect(bd[0]).toEqual({
      key: "helmet",
      label: "Helmet",
      count: 100,
      percent: 50,
      color: "#6366f1",
    });
  });

  test("returns [] (no demo breakdown) when API empty", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const bd = await dashboardService.getDetectionBreakdown();
    expect(bd).toEqual([]);
  });
});

// ─── getBranches ───────────────────────────────────────────────────────────────

describe("dashboardService.getBranches", () => {
  test("maps branches from API", async () => {
    const branches = await dashboardService.getBranches();
    expect(branches.length).toBe(1);
    expect(branches[0].id).toBe("b1");
    expect(branches[0].name).toBe("Main Branch");
    expect(branches[0].camerasOnline).toBe(3);
    expect(branches[0].camerasTotal).toBe(4);
  });

  test("returns [] (no demo branches) when API empty", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const branches = await dashboardService.getBranches();
    expect(branches).toEqual([]);
  });

  test("all branches have required shape", async () => {
    const branches = await dashboardService.getBranches();
    for (const b of branches) {
      expect(b).toHaveProperty("id");
      expect(b).toHaveProperty("name");
      expect(b).toHaveProperty("camerasOnline");
      expect(b).toHaveProperty("camerasTotal");
      expect(b).toHaveProperty("detections");
      expect(b).toHaveProperty("grade");
    }
  });
});

// ─── getUnreadNotifications ────────────────────────────────────────────────────

describe("dashboardService.getUnreadNotifications", () => {
  test("returns count from { count } shape", async () => {
    mockGet.mockResolvedValue({ count: 7 });
    const count = await dashboardService.getUnreadNotifications();
    expect(count).toBe(7);
  });

  test("returns count from { data: { count } } shape", async () => {
    mockGet.mockResolvedValue({ data: { count: 3 } });
    const count = await dashboardService.getUnreadNotifications();
    expect(count).toBe(3);
  });

  test("returns 0 on API failure", async () => {
    mockGet.mockRejectedValueOnce(new Error("fail"));
    const count = await dashboardService.getUnreadNotifications();
    expect(count).toBe(0);
  });

  test("returns 0 on empty response", async () => {
    mockGet.mockResolvedValueOnce({});
    const count = await dashboardService.getUnreadNotifications();
    expect(count).toBe(0);
  });
});

// ─── concurrent requests deduplication ────────────────────────────────────────

describe("dashboardService in-flight deduplication", () => {
  test("parallel calls with the same query share ONE API request", async () => {
    const [s1, services, tasks] = await Promise.all([
      dashboardService.getSummary({ from: "2024-05-01", to: "2024-05-01" }),
      dashboardService.listAIServices({ from: "2024-05-01", to: "2024-05-01" }),
      // getTaskSummary defaults assigned_to_me=true → its own cache key,
      // so it is expected to be the one extra request.
      dashboardService.getTaskSummary({ from: "2024-05-01", to: "2024-05-01" }),
    ]);
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(s1.cameras.total).toBe(4);
    expect(services.length).toBe(2);
    expect(tasks.total).toBe(30);
  });

  test("different filters trigger separate API requests", async () => {
    await dashboardService.getSummary({ from: "2024-06-01", to: "2024-06-01" });
    await dashboardService.getSummary({ from: "2024-07-01", to: "2024-07-01" });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  test("invalidateDashboardCache forces a refetch", async () => {
    await dashboardService.getSummary({ from: "2024-08-01", to: "2024-08-01" });
    invalidateDashboardCache();
    await dashboardService.getSummary({ from: "2024-08-01", to: "2024-08-01" });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
