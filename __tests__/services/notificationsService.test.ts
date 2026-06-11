/**
 * notificationsService unit tests
 * Tests: list normalisation across envelope shapes, severity resolution
 * (API value trusted, inference fallback), unread count shapes, error
 * resilience for all four methods.
 */

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { notificationsService } from "@/services/notificationsService";

const mockGet = (api as unknown as { get: jest.Mock }).get;
const mockPost = (api as unknown as { post: jest.Mock }).post;

beforeEach(() => jest.clearAllMocks());

describe("list", () => {
  it("maps a { data, meta } envelope with pagination", async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Fire detected",
          body: "Camera 2 detected smoke",
          type: "fire_smoke",
          severity: "critical",
          status: "sent",
          detection_id: 77,
          created_at: "2026-06-11T10:00:00Z",
        },
      ],
      meta: { total: 41, last_page: 3 },
    });
    const res = await notificationsService.list(1, 20);
    expect(mockGet).toHaveBeenCalledWith(endpoints.notifications.list, {
      query: { page: 1, per_page: 20 },
    });
    expect(res.total).toBe(41);
    expect(res.lastPage).toBe(3);
    expect(res.items[0]).toMatchObject({
      id: "1",
      title: "Fire detected",
      severity: "critical",
      detectionId: "77",
      taskId: null,
    });
  });

  it("supports the nested { data: { data, meta } } shape", async () => {
    mockGet.mockResolvedValue({
      data: { data: [{ id: 2, type: "task_assigned" }], meta: { total: 1, last_page: 1 } },
    });
    const res = await notificationsService.list();
    expect(res.items).toHaveLength(1);
    expect(res.items[0].title).toBe("task_assigned"); // falls back to type
  });

  it("infers severity from the type when the API value is unrecognised", async () => {
    mockGet.mockResolvedValue({
      data: [
        { id: 1, type: "fire_smoke", severity: "weird" },
        { id: 2, type: "ppe_violation" },
        { id: 3, type: "daily_report" },
      ],
    });
    const res = await notificationsService.list();
    expect(res.items.map((i) => i.severity)).toEqual(["critical", "warning", "info"]);
  });

  it("returns an empty page on request failure", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    const res = await notificationsService.list(2, 10);
    expect(res).toEqual({ items: [], total: 0, page: 2, perPage: 10, lastPage: 1 });
  });
});

describe("unreadCount", () => {
  it.each([
    [{ count: 7 }, 7],
    [{ unread: 3 }, 3],
    [{ data: { count: 9 } }, 9],
    [{}, 0],
  ])("reads %j as %d", async (payload, expected) => {
    mockGet.mockResolvedValue(payload);
    expect(await notificationsService.unreadCount()).toBe(expected);
  });

  it("returns 0 on failure", async () => {
    mockGet.mockRejectedValue(new Error("boom"));
    expect(await notificationsService.unreadCount()).toBe(0);
  });
});

describe("markAllRead / markRead", () => {
  it("posts to the right endpoints", async () => {
    mockPost.mockResolvedValue({});
    await notificationsService.markAllRead();
    expect(mockPost).toHaveBeenCalledWith(endpoints.notifications.markAllRead, {});
    await notificationsService.markRead("12");
    expect(mockPost).toHaveBeenCalledWith(endpoints.notifications.markRead("12"), {});
  });

  it("swallows errors silently", async () => {
    mockPost.mockRejectedValue(new Error("boom"));
    await expect(notificationsService.markAllRead()).resolves.toBeUndefined();
    await expect(notificationsService.markRead("1")).resolves.toBeUndefined();
  });
});
