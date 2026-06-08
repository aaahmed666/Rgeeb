/**
 * taskAnalyticsService unit tests
 * Tests: SLA, workers, volume, AI pipeline, branches — real shapes + fallbacks
 */

jest.mock("@/lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    taskAnalytics: {
      sla:           "/customer/task-analytics/sla",
      workers:       "/customer/task-analytics/workers",
      volume:        "/customer/task-analytics/volume",
      aiPipeline:    "/customer/task-analytics/ai-pipeline",
      branches:      "/customer/task-analytics/branches",
      verify:        "/customer/task-analytics/verify",
      reject:        "/customer/task-analytics/reject",
      verifications: "/customer/task-analytics/verifications",
    },
  },
}));
jest.mock("@/lib/raw-response", () => ({
  pickArray: (r: unknown) => (Array.isArray(r) ? r : (r as { data?: unknown[] })?.data ?? []),
  str: (obj: Record<string, unknown>, ...keys: string[]) => {
    for (const k of keys) if (obj[k] != null) return String(obj[k]);
    return "";
  },
}));

import { api } from "@/lib/api";
import { taskAnalyticsService, verifyTask, rejectTask, fetchVerificationHistory } from "@/services/taskAnalyticsService";

const mockGet  = (api.get  as jest.Mock);
const mockPost = (api.post as jest.Mock);

beforeEach(() => jest.clearAllMocks());

// ─── sla ───────────────────────────────────────────────────────────────────────

describe("taskAnalyticsService.sla", () => {
  test("maps all SLA fields from API (camelCase)", async () => {
    mockGet.mockResolvedValue({ data: { compliance: 87, avgResponse: 12, avgCompletion: 45, overdueNow: 3 } });
    const sla = await taskAnalyticsService.sla();
    expect(sla.compliance).toBe(87);
    expect(sla.avgResponse).toBe(12);
    expect(sla.avgCompletion).toBe(45);
    expect(sla.overdueNow).toBe(3);
  });

  test("maps snake_case API fields (sla_compliance, avg_response, etc.)", async () => {
    mockGet.mockResolvedValue({ data: { sla_compliance: 75, response_time: 18, completion_time: 60, overdue: 5 } });
    const sla = await taskAnalyticsService.sla();
    expect(sla.compliance).toBe(75);
    expect(sla.avgResponse).toBe(18);
    expect(sla.avgCompletion).toBe(60);
    expect(sla.overdueNow).toBe(5);
  });

  test("returns zeros on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const sla = await taskAnalyticsService.sla();
    expect(sla).toMatchObject({ compliance: 0, avgResponse: 0, avgCompletion: 0, overdueNow: 0 });
  });

  test("all required fields present", async () => {
    mockGet.mockResolvedValue({ data: {} });
    const sla = await taskAnalyticsService.sla();
    for (const k of ["compliance","avgResponse","avgCompletion","overdueNow"]) {
      expect(sla).toHaveProperty(k);
      expect(typeof (sla as Record<string, unknown>)[k]).toBe("number");
    }
  });
});

// ─── workers ──────────────────────────────────────────────────────────────────

describe("taskAnalyticsService.workers", () => {
  const WORKERS_FLAT = [
    { id: "w1", name: "Ali Hassan",  tasks: 30, done: 28, rate: 93.3, avg_time: 25 },
    { id: "w2", name: "Sara Khaled", tasks: 20, done: 15, rate: 75.0, average_time: 40 },
  ];

  const WORKERS_NESTED = [
    {
      id: "x1", tasks: 10, done: 9, rate: 90, avgTime: 20,
      user: { id: "u1", name: "Khalid", first_name: "Khalid", last_name: "Omar" },
    },
  ];

  test("maps flat worker array", async () => {
    mockGet.mockResolvedValue({ data: WORKERS_FLAT });
    const workers = await taskAnalyticsService.workers();
    expect(workers.length).toBe(2);
    expect(workers[0].name).toBe("Ali Hassan");
    expect(workers[0].tasks).toBe(30);
    expect(workers[0].done).toBe(28);
    expect(workers[0].avgTime).toBe(25);
  });

  test("maps nested user object", async () => {
    mockGet.mockResolvedValue({ data: WORKERS_NESTED });
    const workers = await taskAnalyticsService.workers();
    expect(workers[0].name).toBe("Khalid");
  });

  test("constructs name from first_name + last_name", async () => {
    mockGet.mockResolvedValue([{
      id: "y1", tasks: 5, done: 5, rate: 100, avgTime: 15,
      user: { id: "u9", first_name: "Yasmin", last_name: "Ahmed" },
    }]);
    const workers = await taskAnalyticsService.workers();
    expect(workers[0].name).toContain("Yasmin");
  });

  test("all required fields present in each worker", async () => {
    mockGet.mockResolvedValue({ data: WORKERS_FLAT });
    const workers = await taskAnalyticsService.workers();
    for (const w of workers) {
      for (const k of ["id","name","tasks","done","rate","avgTime"]) {
        expect(w).toHaveProperty(k);
      }
    }
  });

  test("returns empty array on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const workers = await taskAnalyticsService.workers();
    expect(Array.isArray(workers)).toBe(true);
    expect(workers.length).toBe(0);
  });
});

// ─── volume ───────────────────────────────────────────────────────────────────

describe("taskAnalyticsService.volume", () => {
  test("maps volume points from API", async () => {
    mockGet.mockResolvedValue({ data: [
      { date: "2026-05-01", count: 12 },
      { date: "2026-05-02", count: 18 },
    ]});
    const vol = await taskAnalyticsService.volume();
    expect(vol.length).toBe(2);
    expect(vol[0].date).toBe("2026-05-01");
    expect(vol[0].count).toBe(12);
  });

  test("uses alternative field names (day, value, total, tasks)", async () => {
    mockGet.mockResolvedValue([
      { day: "2026-05-01", value: 8 },
      { label: "May 2",   total: 14 },
    ]);
    const vol = await taskAnalyticsService.volume();
    expect(vol[0].count).toBe(8);
    expect(vol[1].count).toBe(14);
  });

  test("returns empty array on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const vol = await taskAnalyticsService.volume();
    expect(Array.isArray(vol)).toBe(true);
  });
});

// ─── aiPipeline ───────────────────────────────────────────────────────────────

describe("taskAnalyticsService.aiPipeline", () => {
  test("maps AI pipeline fields", async () => {
    mockGet.mockResolvedValue({ data: {
      detections: 500, tasks_created: 120, deduplicated: 30,
      dedup_rate: 25.0, ai_completion: 100, total: 120,
    }});
    const ai = await taskAnalyticsService.aiPipeline();
    expect(ai.detections).toBe(500);
    expect(ai.tasksCreated).toBe(120);
    expect(ai.deduplicated).toBe(30);
    expect(ai.dedupRate).toBe(25.0);
    expect(ai.aiCompletion).toBe(100);
    expect(ai.aiTotal).toBe(120);
  });

  test("computes dedupRate when not provided", async () => {
    mockGet.mockResolvedValue({ data: { detections: 100, tasks_created: 80, deduplicated: 20 } });
    const ai = await taskAnalyticsService.aiPipeline();
    // dedupRate = (20/100)*100 = 20%
    expect(ai.dedupRate).toBe(20);
  });

  test("all fields are numbers", async () => {
    mockGet.mockResolvedValue({ data: {} });
    const ai = await taskAnalyticsService.aiPipeline();
    for (const k of ["detections","tasksCreated","deduplicated","dedupRate","aiCompletion","aiTotal"]) {
      expect(typeof (ai as Record<string, unknown>)[k]).toBe("number");
    }
  });

  test("returns zero-filled object on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const ai = await taskAnalyticsService.aiPipeline();
    expect(ai.detections).toBe(0);
    expect(ai.tasksCreated).toBe(0);
  });
});

// ─── branches ─────────────────────────────────────────────────────────────────

describe("taskAnalyticsService.branches", () => {
  test("maps branch performance rows", async () => {
    mockGet.mockResolvedValue({ data: [
      { id: "b1", name: "Main", tasks: 50, rate: 88, avg_time: 30, fast_response: true },
      { id: "b2", name: "Second", tasks: 30, completion_rate: 72, avgTime: 45 },
    ]});
    const branches = await taskAnalyticsService.branches();
    expect(branches.length).toBe(2);
    expect(branches[0].name).toBe("Main");
    expect(branches[0].tasks).toBe(50);
    expect(branches[0].rate).toBe(88);
    expect(branches[0].fastResponse).toBe(true);
    expect(branches[1].rate).toBe(72);
  });

  test("uses nested branch object shape", async () => {
    mockGet.mockResolvedValue([{
      id: "c1", tasks: 20, rate: 80, avg_time: 20,
      branch: { id: "bb1", name: "Express Branch" },
    }]);
    const branches = await taskAnalyticsService.branches();
    expect(branches[0].name).toBe("Express Branch");
  });

  test("required shape fields present", async () => {
    mockGet.mockResolvedValue({ data: [{ id: "x", name: "X", tasks: 10, rate: 50, avgTime: 25 }] });
    const branches = await taskAnalyticsService.branches();
    for (const b of branches) {
      for (const k of ["id","name","tasks","rate","avgTime"]) expect(b).toHaveProperty(k);
    }
  });

  test("returns empty array on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const branches = await taskAnalyticsService.branches();
    expect(Array.isArray(branches)).toBe(true);
    expect(branches.length).toBe(0);
  });
});

// ─── verifyTask / rejectTask ──────────────────────────────────────────────────

describe("taskAnalyticsService verification actions", () => {
  test("verifyTask calls api.post with correct params", async () => {
    mockPost.mockResolvedValue({});
    await verifyTask("task-123", "Looks good");
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining("verify"),
      { task_id: "task-123", notes: "Looks good" }
    );
  });

  test("rejectTask calls api.post with correct params", async () => {
    mockPost.mockResolvedValue({});
    await rejectTask("task-456", "Not complete");
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining("reject"),
      { task_id: "task-456", notes: "Not complete" }
    );
  });
});

// ─── fetchVerificationHistory ─────────────────────────────────────────────────

describe("fetchVerificationHistory", () => {
  test("maps verification records from API", async () => {
    mockGet.mockResolvedValue([
      {
        id: "v1", task_id: "t1",
        task: { title: "Check camera" },
        action: "verify",
        notes: "All clear",
        reviewed_at: "2026-05-20T10:00:00Z",
        reviewed_by: { name: "Ahmed" },
      },
      {
        id: "v2", task_id: "t2",
        action: "reject",
        notes: "Incomplete",
        reviewed_by: { name: "Sara" },
      },
    ]);
    const history = await fetchVerificationHistory();
    expect(history.length).toBe(2);
    expect(history[0].id).toBe("v1");
    expect(history[0].action).toBe("verify");
    expect(history[0].taskTitle).toBe("Check camera");
    expect(history[1].action).toBe("reject");
  });

  test("defaults action to 'verify' for unknown values", async () => {
    mockGet.mockResolvedValue([{ id: "v3", task_id: "t3", action: "unknown" }]);
    const history = await fetchVerificationHistory();
    expect(history[0].action).toBe("verify");
  });
});
