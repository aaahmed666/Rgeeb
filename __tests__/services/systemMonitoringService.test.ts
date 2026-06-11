/**
 * systemMonitoringService unit tests
 * Tests: pulse payload normalisation (health %, camera status, alerts +
 * severity scoring), 3s request de-duplication cache, error fallback.
 *
 * The service keeps a module-level cache, so each test loads a fresh copy
 * via jest.resetModules().
 */

const mockGet = jest.fn();

jest.mock("@/lib/api", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args), post: jest.fn() },
}));

type Service = typeof import("@/services/systemMonitoringService").systemMonitoringService;

function freshService(): Service {
  let svc: Service;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    svc = require("@/services/systemMonitoringService").systemMonitoringService;
  });
  return svc!;
}

const PULSE = {
  detections_today: 3890,
  active_workers: 4,
  timestamp: "2026-06-11T12:00:00Z",
  camera_health: { total: 4, online: 3, offline: 1 },
  cameras: [
    { id: 1, name: "Gate", branch: "Main", status: "online", last_heartbeat_at: "2026-06-11T11:59:00Z" },
    { id: 2, name: "Door", branch: "Main", is_online: false },
  ],
  recent_alerts: [
    { id: 9, type: "ppe_violation", camera: "Gate", branch: "Main", score: 0.92, detected_at: "2026-06-11T11:58:00Z" },
    { id: 10, type: "fire_smoke", camera: "Door", branch: "Main", score: 0.5 },
    { id: 11, type: "visitor", camera: "Gate", branch: "Main", score: 0.7 },
  ],
};

beforeEach(() => {
  jest.resetModules();
  mockGet.mockReset();
});

describe("getPulse", () => {
  it("normalises the pulse payload", async () => {
    mockGet.mockResolvedValue({ data: PULSE });
    const pulse = await freshService().getPulse();

    expect(pulse.systemHealth).toBe(75); // 3/4 online
    expect(pulse.camerasOnline).toBe(3);
    expect(pulse.camerasTotal).toBe(4);
    expect(pulse.activeWorkers).toBe(4);
    expect(pulse.detectionsToday).toBe(3890);

    expect(pulse.cameras[0]).toMatchObject({ id: "1", name: "Gate", status: "online" });
    expect(pulse.cameras[0].lastSeen).not.toBe("Never");
    // is_online:false wins over a missing status
    expect(pulse.cameras[1].status).toBe("offline");
    expect(pulse.cameras[1].lastSeen).toBe("Never");
  });

  it("scores alert severity from type + confidence", async () => {
    mockGet.mockResolvedValue({ data: PULSE });
    const pulse = await freshService().getPulse();
    const sev = pulse.alerts.map((a) => a.severity);
    // violation @0.92 → critical, fire @0.5 → warning, visitor → info
    expect(sev).toEqual(["critical", "warning", "info"]);
    expect(pulse.alerts[0].confidence).toBe(92);
  });

  it("de-duplicates concurrent requests within the 3s cache window", async () => {
    mockGet.mockResolvedValue({ data: PULSE });
    const svc = freshService();
    await Promise.all([svc.getPulse(), svc.getPulse(), svc.getAlerts(5)]);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("returns a safe fallback (demo cameras, zeroed stats) on failure", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    const pulse = await freshService().getPulse();
    expect(pulse.systemHealth).toBe(0);
    expect(pulse.camerasTotal).toBe(0);
    expect(pulse.cameras.length).toBeGreaterThan(0); // demo placeholder
    expect(pulse.alerts).toEqual([]);
  });
});

describe("getAlerts", () => {
  it("limits the number of alerts returned", async () => {
    mockGet.mockResolvedValue({ data: PULSE });
    const alerts = await freshService().getAlerts(2);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].type).toBe("ppe_violation");
  });
});
