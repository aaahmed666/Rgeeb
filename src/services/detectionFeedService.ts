/**
 * Detection feed service – wraps /customer/monitoring/detections plus the
 * supporting lookups (branches, cameras, ai-services) used by the filter bar.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface DetectionItem {
  id: string;
  type: string;
  image?: string;
  score: number;
  service: string;
  camera: string;
  branch: string;
  detectedAt: string;
}

export interface DetectionFilters {
  branchId?: string;
  cameraId?: string;
  service?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export interface DetectionResponse {
  items: DetectionItem[];
  total: number;
  page: number;
  perPage: number;
}

export interface LookupOption {
  id: string;
  name: string;
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

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export const detectionFeedService = {
  list: async (f: DetectionFilters = {}): Promise<DetectionResponse> => {
    const perPage = f.perPage ?? 15;
    const page = f.page ?? 1;
    const fallback: DetectionResponse = { items: [], total: 0, page, perPage };
    try {
      const raw = await api.get<Record<string, unknown>>(
        endpoints.detections.list,
        {
          query: {
            page,
            per_page: perPage,
            branch_id: f.branchId,
            camera_id: f.cameraId,
            service: f.service,
            date_from: f.from,
            date_to: f.to,
          },
        }
      );
      const list = unwrapList(raw);
      const items: DetectionItem[] = list.map((x, i) => {
        const r = x as Record<string, unknown>;
        const cam = (r.camera as Record<string, unknown>) ?? {};
        const branch = (r.branch as Record<string, unknown>) ?? {};
        const service = (r.service as Record<string, unknown>) ?? {};
        const score = num(r.score ?? r.confidence ?? 0);
        return {
          id: String(r.id ?? i),
          type: String(r.type ?? r.event ?? r.label ?? "detection"),
          image:
            (r.image_url as string) ??
            (r.image as string) ??
            (r.thumbnail as string) ??
            undefined,
          score: score > 1 ? score : Math.round(score * 100),
          service: String(r.service_name ?? service.name ?? r.service ?? "—"),
          camera: String(r.camera_name ?? cam.name ?? r.camera ?? "—"),
          branch: String(r.branch_name ?? branch.name ?? r.branch ?? "—"),
          detectedAt: String(
            r.detected_at ?? r.created_at ?? r.timestamp ?? ""
          ),
        };
      });
      const meta = (raw?.meta as Record<string, unknown>) ?? {};
      const total = num(
        raw?.total ??
          meta.total ??
          (raw?.data as Record<string, unknown>)?.total ??
          items.length,
        items.length
      );
      return { items, total, page, perPage };
    } catch {
      return fallback;
    }
  },

  remove: (id: string) =>
    api.delete<unknown>(endpoints.detections.byId(id)).catch(() => null),

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
        const raw = await api.get<unknown>(endpoints.organization.branches, {
          query,
        });
        return unwrapList(raw).map((b, i) => {
          const x = b as Record<string, unknown>;
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? `Branch ${i + 1}`),
          } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),

  listCameras: (branchId?: string) =>
    safe(
      (async () => {
        const raw = await api.get<unknown>(endpoints.cameras.list, {
          query: { branch_id: branchId },
        });
        return unwrapList(raw).map((c, i) => {
          const x = c as Record<string, unknown>;
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? `Camera ${i + 1}`),
          } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),

  listServices: () =>
    safe(
      (async () => {
        const raw = await api.get<unknown>(endpoints.services.list);
        return unwrapList(raw).map((s, i) => {
          const x = s as Record<string, unknown>;
          return {
            id: String(x.key ?? x.id ?? i),
            name: String(x.name ?? `Service ${i + 1}`),
          } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),
};
