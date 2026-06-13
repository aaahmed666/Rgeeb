/**
 * detectionFeedService unit tests
 * Focus: the Service filter must only return rows for the selected service.
 * The /customer/detections endpoint has no service param, so filtering is
 * done client-side by service name with local pagination.
 */

jest.mock("@/lib/api", () => ({ api: { get: jest.fn(), delete: jest.fn() } }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    detections: {
      list: "/customer/detections",
      byId: (id: string | number) => `/customer/detections/${id}`,
    },
  },
}));

import { api } from "@/lib/api";
import { detectionFeedService } from "@/services/detectionFeedService";

const mockGet = (api as unknown as { get: jest.Mock }).get;

const ROWS = [
  { id: 1, type: "Table Dirty", score: 0.94, service_name: "Clean Tables", camera_name: "Camera 1", branch_name: "Main Branch", detected_at: "2026-05-31T16:48:00Z" },
  { id: 2, type: "Ppe Violation", score: 0.8, service_name: "Kitchen PPE", camera_name: "PPE", branch_name: "Main Branch", detected_at: "2026-05-31T16:47:00Z" },
  { id: 3, type: "Ppe Violation", score: 0.79, service_name: "Kitchen PPE", camera_name: "PPE", branch_name: "Main Branch", detected_at: "2026-05-31T16:47:00Z" },
  { id: 4, type: "Crossing Out", score: 0.97, service_name: "Customer Traffic", camera_name: "Gate", branch_name: "Second Branch", detected_at: "2026-05-31T16:46:00Z" },
  { id: 5, type: "Ppe Violation", score: 0.94, service_name: "Kitchen PPE", camera_name: "PPE", branch_name: "Main Branch", detected_at: "2026-05-31T16:42:00Z" },
];

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ data: ROWS, total: ROWS.length });
});

describe("detectionFeedService.list — service filter", () => {
  test("returns only rows matching the selected service", async () => {
    const res = await detectionFeedService.list({ service: "Kitchen PPE" });
    expect(res.items.length).toBe(3);
    expect(res.items.every((it) => it.service === "Kitchen PPE")).toBe(true);
    expect(res.total).toBe(3);
  });

  test("does not leak rows from other services (the reported bug)", async () => {
    const res = await detectionFeedService.list({ service: "Kitchen PPE" });
    const leaked = res.items.filter((it) => it.service !== "Kitchen PPE");
    expect(leaked).toEqual([]);
  });

  test("matches service name case/space-insensitively", async () => {
    const res = await detectionFeedService.list({ service: "  kitchen ppe  " });
    expect(res.items.length).toBe(3);
  });

  test("pulls a wider window when filtering so matches aren't missed", async () => {
    await detectionFeedService.list({ service: "Kitchen PPE", perPage: 15 });
    const query = mockGet.mock.calls[0][1].query;
    expect(query.per_page).toBeGreaterThanOrEqual(100);
    expect(query.page).toBe(1);
    // never sends a (ignored) service param to this endpoint
    expect(query.service).toBeUndefined();
    expect(query.service_id).toBeUndefined();
  });

  test("paginates the filtered set locally", async () => {
    const p1 = await detectionFeedService.list({ service: "Kitchen PPE", page: 1, perPage: 2 });
    expect(p1.items.map((i) => i.id)).toEqual(["2", "3"]);
    expect(p1.total).toBe(3);
    const p2 = await detectionFeedService.list({ service: "Kitchen PPE", page: 2, perPage: 2 });
    expect(p2.items.map((i) => i.id)).toEqual(["5"]);
    expect(p2.total).toBe(3);
  });

  test("no service filter returns the full server page unchanged", async () => {
    const res = await detectionFeedService.list({});
    expect(res.items.length).toBe(5);
    expect(res.total).toBe(5);
    const query = mockGet.mock.calls[0][1].query;
    expect(query.per_page).toBe(15);
  });
});
