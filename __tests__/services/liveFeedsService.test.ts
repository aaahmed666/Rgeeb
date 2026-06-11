/**
 * liveFeedsService unit tests
 * Tests: branch listing (all=1 vs paginated+keyword), camera mapping with
 * nested branch objects, demo fallbacks on API failure.
 */

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { liveFeedsService } from "@/services/liveFeedsService";

const mockGet = (api as unknown as { get: jest.Mock }).get;

beforeEach(() => jest.clearAllMocks());

describe("listBranches", () => {
  it("requests all branches when no pagination is given", async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1, name: "Main" }] });
    const res = await liveFeedsService.listBranches();
    expect(mockGet).toHaveBeenCalledWith(endpoints.organization.branches, {
      query: { all: 1 },
    });
    expect(res).toEqual([{ id: "1", name: "Main" }]);
  });

  it("paginates with keyword when requested", async () => {
    mockGet.mockResolvedValue({ data: [] });
    await liveFeedsService.listBranches({ page: 2, per_page: 10, keyword: "down" });
    expect(mockGet).toHaveBeenCalledWith(endpoints.organization.branches, {
      query: { page: 2, per_page: 10, keyword: "down" },
    });
  });

  it("falls back to title and indexed names", async () => {
    mockGet.mockResolvedValue({ data: [{ id: 7, title: "Branch by title" }, {}] });
    const res = await liveFeedsService.listBranches();
    expect(res[0].name).toBe("Branch by title");
    expect(res[1].name).toBe("Branch 2");
  });

  it("returns the demo branches when the API fails", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    const res = await liveFeedsService.listBranches();
    expect(res.map((b) => b.id)).toEqual(["main", "second"]);
  });
});

describe("listCameras", () => {
  it("maps cameras including the nested branch object", async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 3,
          name: "Gate Cam",
          code: "CAM-G1",
          branch: { id: "b1", name: "Main Branch" },
          status: "ONLINE",
          rtsp_url: "rtsp://example/stream",
        },
      ],
    });
    const res = await liveFeedsService.listCameras({ branchId: "b1" });
    expect(mockGet).toHaveBeenCalledWith(endpoints.cameras.list, {
      query: { branch_id: "b1" },
    });
    expect(res[0]).toMatchObject({
      id: "3",
      name: "Gate Cam",
      code: "CAM-G1",
      branchId: "b1",
      branchName: "Main Branch",
      status: "online",
    });
  });

  it("returns demo cameras when the API fails", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    const res = await liveFeedsService.listCameras();
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toHaveProperty("rtspUrl");
  });
});
