import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  source: string; // "detection" | "task" | …
  channel: string; // "in_app" | "whatsapp" | …
  severity: "info" | "warning" | "critical";
  status: string; // "sent" | "read" | …
  detectionId: string | null;
  taskId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/**
 * Trust the severity field from the API directly.
 * Only fall back to inference if the field is missing or unrecognised.
 */
function resolveSeverity(
  apiSeverity: unknown,
  type: string
): NotificationItem["severity"] {
  if (
    apiSeverity === "critical" ||
    apiSeverity === "warning" ||
    apiSeverity === "info"
  ) {
    return apiSeverity;
  }
  // inference fallback
  const t = type.toLowerCase();
  if (t.includes("fire") || t.includes("smoke") || t.includes("overcrowd"))
    return "critical";
  if (t.includes("violation") || t.includes("warning")) return "warning";
  return "info";
}

function unwrapList(raw: unknown): {
  list: unknown[];
  meta: Record<string, unknown>;
} {
  if (Array.isArray(raw)) return { list: raw, meta: {} };
  const r = (raw ?? {}) as Record<string, unknown>;
  // { data: [...], meta: {...} }
  if (Array.isArray(r.data)) {
    return {
      list: r.data as unknown[],
      meta: (r.meta as Record<string, unknown>) ?? {},
    };
  }
  // { data: { data: [...], meta: {...} } }
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.data)) {
    return {
      list: d.data as unknown[],
      meta: (d.meta as Record<string, unknown>) ?? d,
    };
  }
  return { list: [], meta: r };
}

export const notificationsService = {
  list: async (page = 1, perPage = 20): Promise<NotificationsResponse> => {
    try {
      const raw = await api.get<unknown>(endpoints.customer.notifications, {
        query: { page, per_page: perPage },
      });
      const { list, meta } = unwrapList(raw);

      const items: NotificationItem[] = list.map((x, i) => {
        const r = x as Record<string, unknown>;
        const type = String(r.type ?? "notification");
        return {
          id: String(r.id ?? i),
          title: String(r.title ?? type),
          body: String(r.body ?? r.message ?? ""),
          type,
          source: String(r.source ?? "system"),
          channel: String(r.channel ?? "in_app"),
          severity: resolveSeverity(r.severity, type),
          status: String(r.status ?? "sent"),
          detectionId: r.detection_id != null ? String(r.detection_id) : null,
          taskId: r.task_id != null ? String(r.task_id) : null,
          createdAt: String(r.created_at ?? r.createdAt ?? ""),
          readAt: (r.read_at ?? r.readAt ?? null) as string | null,
        };
      });

      const total = num(meta.total ?? items.length, items.length);
      const lastPage = num(meta.last_page ?? meta.lastPage ?? 1, 1);
      return { items, total, page, perPage, lastPage };
    } catch {
      return { items: [], total: 0, page, perPage, lastPage: 1 };
    }
  },

  unreadCount: async (): Promise<number> => {
    try {
      const raw = await api.get<unknown>(
        endpoints.customer.notificationsUnread
      );
      const r = (raw ?? {}) as Record<string, unknown>;
      return num(
        r.count ?? r.unread ?? (r.data as Record<string, unknown>)?.count,
        0
      );
    } catch {
      return 0;
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await api.post<unknown>(endpoints.customer.notificationsMarkAllRead, {});
    } catch {
      /* ignore */
    }
  },

  markRead: async (id: string): Promise<void> => {
    try {
      await api.post<unknown>(endpoints.customer.notificationRead(id), {});
    } catch {
      /* ignore */
    }
  },
};
