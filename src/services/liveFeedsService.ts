/**
 * Live feeds service – wraps /customer/cameras and /customer/branches
 * for the Live Feeds monitoring page.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface BranchOption {
  id: string;
  name: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  status: "online" | "offline" | "degraded";
  rtspUrl?: string;
  thumbnail?: string;
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown> | null;
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data as unknown[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.data)) return d.data as unknown[];
  return [];
}

export const liveFeedsService = {
  /** For SELECT DROPDOWNS prefer: <AsyncPaginatedSelect endpoint="/customer/branches" />
   *  This method is still used for non-select contexts. */
  listBranches: (params?: {
    page?: number;
    per_page?: number;
    keyword?: string;
  }) =>
    safe(
      (async () => {
        const query = params?.page
          ? {
              page: params.page,
              per_page: params.per_page ?? 20,
              ...(params.keyword ? { keyword: params.keyword } : {}),
            }
          : { all: 1 };
        const raw = await api.get<unknown>(endpoints.dashboard.branches, {
          query,
        });
        return unwrapList(raw).map((b, i) => {
          const x = b as Record<string, unknown>;
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? x.title ?? `Branch ${i + 1}`),
          } satisfies BranchOption;
        });
      })(),
      [
        { id: "main", name: "Main Branch" },
        { id: "second", name: "Second Branch" },
      ] as BranchOption[]
    ),

  listCameras: (params: { branchId?: string } = {}) =>
    safe(
      (async () => {
        const raw = await api.get<unknown>(endpoints.dashboard.cameras, {
          query: { branch_id: params.branchId },
        });
        return unwrapList(raw).map((c, i) => {
          const x = c as Record<string, unknown>;
          const branch = (x.branch as Record<string, unknown>) ?? {};
          const status = String(
            x.status ?? "online"
          ).toLowerCase() as CameraFeed["status"];
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? `Camera ${i + 1}`),
            code: String(x.code ?? x.camera_code ?? ""),
            branchId: String(x.branch_id ?? branch.id ?? ""),
            branchName: String(x.branch_name ?? branch.name ?? ""),
            status: ["online", "offline", "degraded"].includes(status)
              ? status
              : "online",
            rtspUrl:
              (x.rtsp_url as string) ?? (x.stream_url as string) ?? undefined,
            thumbnail:
              (x.thumbnail as string) ?? (x.preview_url as string) ?? undefined,
          } satisfies CameraFeed;
        });
      })(),
      [
        {
          id: "1",
          name: "PPE",
          code: "CAM_PPE",
          branchId: "main",
          branchName: "Main Branch",
          status: "online",
          rtspUrl: "rtsp://admin:Ll112233@100.74.52.88:8554/Streaming/Channels",
        },
        {
          id: "2",
          name: "Waiting",
          code: "CAM3",
          branchId: "main",
          branchName: "Main Branch",
          status: "online",
          rtspUrl: "rtsp://admin:Ll112233@100.74.52.88:8554/Streaming/Channels",
        },
        {
          id: "3",
          name: "Gate",
          code: "Cam-002",
          branchId: "second",
          branchName: "Second Branch",
          status: "online",
          rtspUrl: "rtsp://admin:Ll112233@100.74.52.88:8554/Streaming/Channels",
        },
        {
          id: "4",
          name: "Camera 1",
          code: "Cam_001",
          branchId: "main",
          branchName: "Main Branch",
          status: "online",
          rtspUrl: "rtsp://admin:Ll112233@100.74.52.88:8554/Streaming/Channels",
        },
      ] as CameraFeed[]
    ),
};
