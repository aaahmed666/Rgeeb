/**
 * Foodics Intelligence API Service
 * Full integration based on the Postman collection endpoints.
 * Base: /customer/foodics/*
 */

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodicsStatus {
  connected: boolean;
  connected_at: string | null;
  business_id: string | null;
  business_name: string | null;
  services: {
    foodics_api: boolean;
    health_endpoint: boolean;
    order_sync: boolean;
    ai_workers: boolean;
    webhook_receiver: boolean;
    bridge_api: boolean;
  };
}

export interface FoodicsOrder {
  id: string;
  reference: string;
  date: string;
  type: string;
  customer: string | null;
  total: number;
  discount: number;
  status: string;
  branch_id: string;
  branch_name: string;
}

export interface FoodicsOrderStats {
  total_orders: number;
  total_sales: number;
  total_discounts: number;
  avg_order_value: number;
}

export interface FoodicsOrdersResponse {
  data: FoodicsOrder[];
  stats: FoodicsOrderStats;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FoodicsRefundVerification {
  /** Present in the legacy production API — required for the manager review action */
  id?: number | string;
  order_ref: string;
  amount: number;
  type: string;
  refunded_at: string;
  ai_status: string;
  person: string | null;
  confidence: number | null;
  verdict: string;
  branch_id: string;
  branch_name: string;
}

export interface FoodicsRefundStats {
  total_refunds: number;
  suspicious: number;
  critical: number;
  flagged_rate: number;
}

export interface FoodicsRefundsResponse {
  data: FoodicsRefundVerification[];
  stats: FoodicsRefundStats;
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FoodicsDrawerAudit {
  id: string;
  status: string;
  person: string | null;
  employee_id: string | null;
  matched_order: string | null;
  patterns: string | null;
  date: string;
  verdict: string;
  branch_id: string;
  branch_name: string;
}

export interface FoodicsDrawerStats {
  total_opens: number;
  unmatched: number;
  suspicious: number;
  critical: number;
  flagged_rate: number;
}

export interface FoodicsDrawerResponse {
  data: FoodicsDrawerAudit[];
  stats: FoodicsDrawerStats;
  pattern_flags: PatternFlag[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PatternFlag {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  count: number;
}

export interface FoodicsPrepTimeRecord {
  id: string;
  date: string;
  order_placed: string;
  food_ready: string;
  kitchen_prep: number;
  service: number;
  total_cycle: number;
  hour: number;
  branch_id: string;
  branch_name: string;
}

export interface FoodicsPrepTimeStats {
  total_orders: number;
  ai_matched: number;
  ai_matched_pct: number;
  avg_kitchen_prep: number | null;
  avg_service: number | null;
  avg_total_cycle: number | null;
}

export interface FoodicsPrepTimeResponse {
  data: FoodicsPrepTimeRecord[];
  stats: FoodicsPrepTimeStats;
  heatmap: HeatmapCell[][];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface HeatmapCell {
  hour: number;
  day: number;
  value: number;
  label: string;
}

export interface FoodicsFootfallRecord {
  date: string;
  footfall: number;
  orders: number;
  conversion_rate: number;
  revenue: number;
  revenue_per_visitor: number;
  branch_id: string;
  branch_name: string;
}

export interface FoodicsFootfallStats {
  total_footfall: number;
  total_orders: number;
  conversion_rate: number | null;
  total_revenue: number;
  revenue_per_visitor: number | null;
  avg_daily_footfall: number;
}

export interface FoodicsFootfallResponse {
  data: FoodicsFootfallRecord[];
  stats: FoodicsFootfallStats;
  hourly_breakdown: HourlyBreakdown[];
}

// ── Raw conversion feeds (parity with OLD store conversion_* migrations) ──
export interface ConversionHourlyStat {
  branch_id: number | string;
  stat_date: string;
  hour: number;
  footfall_in: number;
  footfall_out: number;
  orders_count: number;
  conversion_rate: number | null;
  revenue: number;
  revenue_per_visitor: number | null;
}

export interface ConversionDailySummary {
  branch_id: number | string;
  stat_date: string;
  total_footfall_in: number;
  total_footfall_out: number;
  total_orders: number;
  avg_conversion_rate: number | null;
  total_revenue: number;
  revenue_per_visitor: number | null;
  peak_hour: number | null;
}

export interface ConversionSummary {
  days_count: number;
  total_footfall: number;
  total_orders: number;
  total_revenue: number;
  avg_conversion_rate: number | null;
  avg_revenue_per_visitor: number | null;
  avg_daily_footfall: number;
}

export interface HourlyBreakdown {
  hour: number;
  avg_footfall: number;
  avg_orders: number;
  avg_conversion: number;
}

export interface FoodicsInventoryZone {
  id: string;
  name: string;
  branch_id: string;
  branch_name: string;
  items_count: number;
  last_audit: string | null;
  status: string;
}

export interface FoodicsInventoryAudit {
  id: string;
  zone_id: string;
  zone_name: string;
  date: string;
  status: string;
  items_audited: number;
  discrepancies: number;
  branch_id: string;
  branch_name: string;
}

export interface FoodicsDashboardStats {
  total_orders: number;
  total_revenue: number;
  avg_ticket: number;
  conversion_rate: number | null;
  suspicious_refunds: number;
  suspicious_refunds_pct: number;
  drawer_flags: number;
  drawer_flags_pct: number;
  avg_kitchen_prep: number | null;
  avg_kitchen_matched_pct: number;
  inventory_issues: number;
  inventory_audits_total: number;
}

export interface FoodicsDashboardInsights {
  summary: string;
  anomalies: string[];
  all_clear: boolean;
}

export interface FoodicsDashboardTrends {
  orders: { days: number; total: number };
  prep_times: { data_points: number; avg: number | null };
  conversion: { days: number; visitors: number };
  refunds: { records: number; total: number };
}

export interface FoodicsDashboard {
  stats: FoodicsDashboardStats;
  ai_insights: FoodicsDashboardInsights;
  trends: FoodicsDashboardTrends;
  branch_id: string | null;
  date_from: string | null;
  date_to: string | null;
}

export interface FoodicsConnectUrl {
  url: string;
}

// ─── Filters / Params ─────────────────────────────────────────────────────────

export interface FoodicsDateBranchFilter {
  branch_id?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
  status?: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const foodicsService = {
  // Connection
  getStatus: () =>
    api
      .get<{ data: FoodicsStatus }>(endpoints.foodics.status)
      .then((r) => r.data),
  // Backend (parity with legacy app): GET /customer/foodics/connect
  //   → { data: { authorization_url } }
  // The legacy production system reads `authorization_url`; some newer feeds
  // use `url`. Accept either so the OAuth redirect never lands on
  // `/dashboard/foodics/undefined`.
  getConnectUrl: (): Promise<FoodicsConnectUrl> =>
    api
      .get<Record<string, unknown>>(endpoints.foodics.connect)
      .then((r) => {
        const root = (r ?? {}) as Record<string, unknown>;
        const inner = (root.data ?? root) as Record<string, unknown>;
        const url =
          (inner.authorization_url as string | undefined) ??
          (inner.url as string | undefined) ??
          (root.authorization_url as string | undefined) ??
          (root.url as string | undefined) ??
          "";
        return { url };
      }),
  disconnect: () => api.post(endpoints.foodics.disconnect),

  // Dashboard (aggregate)
  //
  // The page needs stats + ai_insights + trends together. The backend exposes
  // these as three separate feeds (/dashboard/overview, /insights, /trends),
  // matching the OLD app. We fetch them in parallel and adapt to the page's
  // consolidated shape, tolerating both the OLD nested response (orders.*,
  // conversion.*, refunds.*, prep_time.*) and a newer flat `stats` response.
  getDashboard: async (
    params?: FoodicsDateBranchFilter
  ): Promise<FoodicsDashboard> => {
    const query = params as never;
    const [ovRes, insRes, trRes] = await Promise.all([
      api
        .get<{
          data: Record<string, unknown>;
        }>(endpoints.foodics.dashboardOverview, { query })
        .catch(() => ({ data: {} as Record<string, unknown> })),
      api
        .get<Record<string, unknown>>(endpoints.foodics.dashboardInsights, {
          query,
        })
        .catch(() => ({ data: {} }) as Record<string, unknown>),
      api
        .get<{
          data: Record<string, unknown>;
        }>(endpoints.foodics.dashboardTrends, { query })
        .catch(() => ({ data: {} as Record<string, unknown> })),
    ]);

    const ov = (ovRes?.data ?? {}) as Record<string, never>;
    const num = (v: unknown): number =>
      typeof v === "number" ? v : Number(v ?? 0) || 0;
    const get = (obj: unknown, key: string): unknown =>
      obj && typeof obj === "object"
        ? (obj as Record<string, unknown>)[key]
        : undefined;

    // Prefer a flat `stats` block if present; else derive from nested groups.
    const flatStats = get(ov, "stats") as Record<string, unknown> | undefined;
    const orders = get(ov, "orders");
    const conversion = get(ov, "conversion");
    const refunds = get(ov, "refunds");
    const drawer = get(ov, "drawer");
    const inventory = get(ov, "inventory");
    const prep = get(ov, "prep_time") ?? get(ov, "prep_times");

    const stats: FoodicsDashboardStats = flatStats
      ? {
          total_orders: num(flatStats.total_orders),
          total_revenue: num(flatStats.total_revenue),
          avg_ticket: num(flatStats.avg_ticket),
          conversion_rate: (flatStats.conversion_rate as number | null) ?? null,
          suspicious_refunds: num(flatStats.suspicious_refunds),
          suspicious_refunds_pct: num(flatStats.suspicious_refunds_pct),
          drawer_flags: num(flatStats.drawer_flags),
          drawer_flags_pct: num(flatStats.drawer_flags_pct),
          avg_kitchen_prep:
            (flatStats.avg_kitchen_prep as number | null) ?? null,
          avg_kitchen_matched_pct: num(flatStats.avg_kitchen_matched_pct),
          inventory_issues: num(flatStats.inventory_issues),
          inventory_audits_total: num(flatStats.inventory_audits_total),
        }
      : {
          // Nested overview groups (parity with legacy dashboard.tsx:
          // ov.orders / ov.conversion / ov.refunds / ov.drawer /
          // ov.prep_time / ov.inventory).
          total_orders: num(get(orders, "total_orders")),
          total_revenue: num(get(orders, "total_revenue")),
          avg_ticket: num(get(orders, "avg_ticket")),
          conversion_rate:
            (get(conversion, "conversion_rate") as number | null) ?? null,
          suspicious_refunds: num(get(refunds, "suspicious_count")),
          suspicious_refunds_pct: num(get(refunds, "suspicious_rate")),
          drawer_flags: num(get(drawer, "flagged_count")),
          drawer_flags_pct: num(get(drawer, "flagged_rate")),
          avg_kitchen_prep:
            (get(prep, "avg_kitchen_prep_seconds") as number | null) ?? null,
          avg_kitchen_matched_pct: num(get(prep, "match_rate")),
          inventory_issues: num(get(inventory, "discrepancies")),
          inventory_audits_total: num(get(inventory, "total_audits")),
        };

    // Insights: the backend returns an array of insight objects
    // ({ type, severity, title, message, metric, action }) — parity with legacy
    // DashboardInsight[]. Some deployments wrap it as { data: [...] } or expose
    // a newer { summary, anomalies, all_clear } object; handle all shapes.
    const insPayload = insRes?.data;
    let ai_insights: FoodicsDashboardInsights;
    if (Array.isArray(insPayload)) {
      const items = insPayload as Record<string, unknown>[];
      const anomalies = items
        .map((it) => {
          const title = String(it.title ?? "");
          const message = String(it.message ?? "");
          return title && message
            ? `${title}: ${message}`
            : title || message;
        })
        .filter(Boolean);
      ai_insights = {
        summary: "",
        anomalies,
        all_clear: anomalies.length === 0,
      };
    } else {
      const ins = (insPayload ?? {}) as Record<string, unknown>;
      const nested = Array.isArray(ins.data)
        ? (ins.data as Record<string, unknown>[])
        : null;
      if (nested) {
        const anomalies = nested
          .map((it) => {
            const title = String(it.title ?? "");
            const message = String(it.message ?? "");
            return title && message
              ? `${title}: ${message}`
              : title || message;
          })
          .filter(Boolean);
        ai_insights = {
          summary: String(ins.summary ?? ""),
          anomalies,
          all_clear:
            typeof ins.all_clear === "boolean"
              ? ins.all_clear
              : anomalies.length === 0,
        };
      } else {
        const anomalies = Array.isArray(ins.anomalies)
          ? (ins.anomalies as string[])
          : [];
        ai_insights = {
          summary: String(ins.summary ?? ""),
          anomalies,
          all_clear:
            typeof ins.all_clear === "boolean"
              ? ins.all_clear
              : anomalies.length === 0,
        };
      }
    }

    // Trends: tolerate OLD array feeds or the newer scalar-summary shape.
    const tr = (trRes?.data ?? {}) as Record<string, unknown>;
    const arr = (v: unknown): Record<string, unknown>[] =>
      Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
    const sumBy = (rows: Record<string, unknown>[], key: string) =>
      rows.reduce((s, r) => s + num(r[key]), 0);

    const trOrders = tr.orders;
    const trPrep = tr.prep_times ?? tr.prep_time;
    const trConv = tr.conversion;
    const trRef = tr.refunds;

    const trends: FoodicsDashboardTrends = {
      orders: Array.isArray(trOrders)
        ? { days: arr(trOrders).length, total: sumBy(arr(trOrders), "orders") }
        : {
            days: num(get(trOrders, "days")),
            total: num(get(trOrders, "total")),
          },
      prep_times: Array.isArray(trPrep)
        ? {
            data_points: arr(trPrep).length,
            avg: arr(trPrep).length
              ? Math.round(sumBy(arr(trPrep), "avg_prep") / arr(trPrep).length)
              : null,
          }
        : {
            data_points: num(get(trPrep, "data_points")),
            avg: (get(trPrep, "avg") as number | null) ?? null,
          },
      conversion: Array.isArray(trConv)
        ? {
            days: arr(trConv).length,
            visitors: sumBy(arr(trConv), "total_footfall_in"),
          }
        : {
            days: num(get(trConv, "days")),
            visitors: num(get(trConv, "visitors")),
          },
      refunds: Array.isArray(trRef)
        ? { records: arr(trRef).length, total: sumBy(arr(trRef), "count") }
        : {
            records: num(get(trRef, "records")),
            total: num(get(trRef, "total")),
          },
    };

    return {
      stats,
      ai_insights,
      trends,
      branch_id: (get(ov, "branch_id") as string | null) ?? null,
      date_from: (get(ov, "date_from") as string | null) ?? null,
      date_to: (get(ov, "date_to") as string | null) ?? null,
    };
  },

  // Orders
  // Orders
  //
  // Records from /orders; aggregate stats from /orders/summary when the base
  // response doesn't embed them (parity with the OLD orders page).
  getOrders: async (
    params?: FoodicsDateBranchFilter
  ): Promise<FoodicsOrdersResponse> => {
    const query = params as never;
    const [listRes, sumRes] = await Promise.all([
      api
        .get<Record<string, unknown>>(endpoints.foodics.orders, { query })
        .catch(() => ({}) as Record<string, unknown>),
      api
        .get<{
          data: Record<string, unknown>;
        }>(endpoints.foodics.ordersSummary, { query })
        .catch(() => ({ data: {} as Record<string, unknown> })),
    ]);
    const root = (listRes ?? {}) as Record<string, unknown>;
    const inner = (root.data ?? root) as Record<string, unknown>;
    const num = (v: unknown) =>
      typeof v === "number" ? v : Number(v ?? 0) || 0;

    // Label maps (parity with legacy orders.tsx ORDER_TYPE_MAP / ORDER_STATUS_MAP).
    const ORDER_TYPE_MAP: Record<number, string> = {
      1: "Dine In",
      2: "Pick Up",
      3: "Delivery",
      4: "Drive Thru",
    };
    const ORDER_STATUS_MAP: Record<number, string> = {
      1: "Pending",
      2: "Active",
      3: "Declined",
      4: "Closed",
      5: "Returned",
      6: "Joined",
      7: "Void",
      8: "Draft",
    };

    // Raw rows from the Laravel paginator carry the backend's field names
    // (FoodicsOrderResource). The page consumes a flattened shape, so map them
    // here (parity with the legacy production system).
    const rawRows = (
      Array.isArray(inner) ? inner : Array.isArray(inner.data) ? inner.data : []
    ) as Record<string, unknown>[];

    const data: FoodicsOrder[] = rawRows.map((row) => {
      const typeNum = num(row.type);
      const statusNum = num(row.status);
      return {
        id: String(row.foodics_order_id ?? row.id ?? ""),
        reference: (row.reference as string) || String(row.id ?? ""),
        date: (row.business_date as string) ?? "",
        type: ORDER_TYPE_MAP[typeNum] ?? (row.type != null ? `Type ${typeNum}` : ""),
        customer: (row.customer_name as string) ?? null,
        total: num(row.total_price),
        discount: num(row.discount_amount),
        status:
          ORDER_STATUS_MAP[statusNum] ??
          (row.status != null ? `Status ${statusNum}` : ""),
        branch_id: String(row.branch_id ?? ""),
        branch_name: (row.branch_name as string) ?? "",
      };
    });
    // /orders/summary may return an array of daily rows; fold to totals.
    const rawSum = sumRes?.data;
    const sumRows = Array.isArray(rawSum)
      ? (rawSum as Record<string, unknown>[])
      : [];
    const embedded = root.stats as Record<string, unknown> | undefined;
    const totalOrders = embedded
      ? num(embedded.total_orders)
      : sumRows.reduce((s, r) => s + num(r.orders_count ?? r.total_orders), 0);
    const totalSales = embedded
      ? num(embedded.total_sales)
      : sumRows.reduce((s, r) => s + num(r.total_sales), 0);
    const totalDiscounts = embedded
      ? num(embedded.total_discounts)
      : sumRows.reduce((s, r) => s + num(r.total_discounts), 0);
    const stats: FoodicsOrderStats = {
      total_orders: totalOrders,
      total_sales: totalSales,
      total_discounts: totalDiscounts,
      avg_order_value: embedded
        ? num(embedded.avg_order_value)
        : totalOrders > 0
          ? Math.round((totalSales / totalOrders) * 100) / 100
          : 0,
    };
    return {
      data,
      stats,
      current_page: num(inner.current_page ?? root.current_page) || 1,
      last_page: num(inner.last_page ?? root.last_page) || 1,
      per_page: num(inner.per_page ?? root.per_page) || data.length,
      total: num(inner.total ?? root.total) || data.length,
    };
  },
  syncOrders: () => api.post(endpoints.foodics.ordersSync),

  // Refund Verification
  //
  // Records come from /refund-verifications. Aggregate stats from a /stats
  // sibling feed when the base response doesn't embed them (parity with OLD).
  getRefunds: async (
    params?: FoodicsDateBranchFilter
  ): Promise<FoodicsRefundsResponse> => {
    const query = params as never;
    const [listRes, statsRes] = await Promise.all([
      api
        .get<Record<string, unknown>>(endpoints.foodics.refunds, { query })
        .catch(() => ({}) as Record<string, unknown>),
      api
        .get<Record<string, unknown>>(
          endpoints.foodics.refundVerificationsStats,
          { query }
        )
        .catch(() => ({ data: [] }) as Record<string, unknown>),
    ]);
    const root = (listRes ?? {}) as Record<string, unknown>;
    const inner = (root.data ?? root) as Record<string, unknown>;
    const num = (v: unknown) =>
      typeof v === "number" ? v : Number(v ?? 0) || 0;

    // Raw rows from the Laravel paginator. The backend's
    // RefundVerificationResource exposes these exact field names; the page
    // consumes a flattened shape, so map them here (parity with the legacy
    // production system — see old store/apps/foodics fetchRefundVerifications).
    const rawRows = (
      Array.isArray(inner) ? inner : Array.isArray(inner.data) ? inner.data : []
    ) as Record<string, unknown>[];

    const data: FoodicsRefundVerification[] = rawRows.map((row) => {
      const conf = row.detection_confidence;
      return {
        id: (row.id as number | string | undefined) ?? undefined,
        order_ref: String(row.foodics_order_id ?? row.id ?? ""),
        amount: num(row.refund_amount),
        type: (row.refund_type as string) ?? "",
        refunded_at: (row.refunded_at as string) ?? "",
        ai_status: (row.verification_status as string) ?? "pending",
        person:
          row.person_detected == null
            ? null
            : row.person_detected
              ? "Detected"
              : "Not detected",
        confidence:
          conf == null ? null : Math.round(num(conf) * 100),
        verdict: (row.manager_verdict as string) ?? "pending",
        branch_id: String(row.branch_id ?? ""),
        branch_name: (row.branch_name as string) ?? "",
      };
    });

    // Stats endpoint returns an array: [{ verification_status, count }, ...].
    // Aggregate it into the consolidated card shape (parity with the legacy
    // system's stats reducer in refunds.tsx).
    const statsArr = (
      Array.isArray(statsRes?.data)
        ? statsRes.data
        : Array.isArray((statsRes as Record<string, unknown>)?.stats)
          ? (statsRes as Record<string, unknown>).stats
          : Array.isArray(root.stats)
            ? root.stats
            : []
    ) as Record<string, unknown>[];

    const countFor = (s: string) =>
      num(
        statsArr.find((r) => (r.verification_status as string) === s)?.count
      );
    const totalRefunds = statsArr.reduce((sum, r) => sum + num(r.count), 0);
    const suspicious = countFor("suspicious");
    const critical = countFor("critical");
    const flaggedRate =
      totalRefunds > 0
        ? Number((((suspicious + critical) / totalRefunds) * 100).toFixed(1))
        : 0;

    const stats: FoodicsRefundStats = {
      total_refunds: totalRefunds,
      suspicious,
      critical,
      flagged_rate: flaggedRate,
    };
    return {
      data,
      stats,
      current_page: num(inner.current_page ?? root.current_page) || 1,
      last_page: num(inner.last_page ?? root.last_page) || 1,
      per_page: num(inner.per_page ?? root.per_page) || data.length,
      total: num(inner.total ?? root.total) || data.length,
    };
  },
  /**
   * Manager review of a refund verification
   * (verdict: legitimate | fraud | inconclusive).
   * POST /customer/foodics/refund-verifications/{id}/review
   */
  reviewRefund: (
    id: string | number,
    body: { verdict: string; notes: string }
  ) => api.post(endpoints.foodics.refundReview(id), body),

  // Cash Drawer Audit
  //
  // Records from /drawer-audits; stats from /drawer-audits/stats; pattern flags
  // from /drawer-audits/patterns (parity with OLD app's three calls).
  getDrawerAudits: async (
    params?: FoodicsDateBranchFilter
  ): Promise<FoodicsDrawerResponse> => {
    const query = params as never;
    const [listRes, statsRes, patRes] = await Promise.all([
      api
        .get<Record<string, unknown>>(endpoints.foodics.drawerAudits, { query })
        .catch(() => ({}) as Record<string, unknown>),
      api
        .get<Record<string, unknown>>(endpoints.foodics.drawerAuditsStats, {
          query,
        })
        .catch(() => ({ data: [] }) as Record<string, unknown>),
      api
        .get<{ data: PatternFlag[] }>(endpoints.foodics.drawerAuditsPatterns, {
          query,
        })
        .catch(() => ({ data: [] as PatternFlag[] })),
    ]);
    const root = (listRes ?? {}) as Record<string, unknown>;
    const inner = (root.data ?? root) as Record<string, unknown>;
    const num = (v: unknown) =>
      typeof v === "number" ? v : Number(v ?? 0) || 0;

    // Status labels kept lowercase to match the page's color lookup; the page
    // applies a `capitalize` class for display (parity with legacy AUDIT_STATUS_CONFIG).
    const rawRows = (
      Array.isArray(inner) ? inner : Array.isArray(inner.data) ? inner.data : []
    ) as Record<string, unknown>[];

    const data: FoodicsDrawerAudit[] = rawRows.map((row) => {
      const flags = row.pattern_flags;
      let patterns: string | null = null;
      if (Array.isArray(flags) && flags.length) {
        patterns = flags.join(", ");
      } else if (flags && typeof flags === "object") {
        const keys = Object.keys(flags as Record<string, unknown>);
        patterns = keys.length ? keys.join(", ") : null;
      }
      return {
        id: String(row.id ?? ""),
        status: (row.audit_status as string) ?? "unmatched",
        person:
          row.person_detected == null
            ? null
            : row.person_detected
              ? "Detected"
              : "Not detected",
        employee_id:
          row.employee_identified
            ? (row.employee_id as string) ?? "Identified"
            : null,
        matched_order:
          row.matched_order_id != null ? `#${row.matched_order_id}` : null,
        patterns,
        date: (row.created_at as string) ?? "",
        verdict: (row.manager_verdict as string) ?? "pending",
        branch_id: String(row.branch_id ?? ""),
        branch_name: (row.branch_name as string) ?? "",
      };
    });

    // Stats endpoint returns an array: [{ audit_status, count }, ...].
    // Aggregate into the consolidated card shape (parity with legacy drawer.tsx).
    const statsArr = (
      Array.isArray(statsRes?.data)
        ? statsRes.data
        : Array.isArray((statsRes as Record<string, unknown>)?.stats)
          ? (statsRes as Record<string, unknown>).stats
          : Array.isArray(root.stats)
            ? root.stats
            : []
    ) as Record<string, unknown>[];

    const countFor = (s: string) =>
      num(statsArr.find((r) => (r.audit_status as string) === s)?.count);
    const totalOpens = statsArr.reduce((sum, r) => sum + num(r.count), 0);
    const unmatched = countFor("unmatched");
    const suspicious = countFor("suspicious");
    const critical = countFor("critical");
    const flaggedRate =
      totalOpens > 0
        ? Number((((suspicious + critical) / totalOpens) * 100).toFixed(1))
        : 0;

    const stats: FoodicsDrawerStats = {
      total_opens: totalOpens,
      unmatched,
      suspicious,
      critical,
      flagged_rate: flaggedRate,
    };
    const pattern_flags = Array.isArray(root.pattern_flags)
      ? (root.pattern_flags as PatternFlag[])
      : (patRes?.data ?? []);
    return {
      data,
      stats,
      pattern_flags,
      current_page: num(inner.current_page ?? root.current_page) || 1,
      last_page: num(inner.last_page ?? root.last_page) || 1,
      per_page: num(inner.per_page ?? root.per_page) || data.length,
      total: num(inner.total ?? root.total) || data.length,
    };
  },
  syncDrawerOperations: () => api.post(endpoints.foodics.drawerOperationsSync),
  /**
   * Manager review of a drawer audit
   * (verdict: legitimate | fraud | inconclusive).
   * POST /customer/foodics/drawer-audits/{id}/review
   */
  reviewDrawerAudit: (
    id: string | number,
    body: { verdict: string; notes: string }
  ) => api.post(endpoints.foodics.drawerAuditReview(id), body),

  // Prep Time Intelligence
  //
  // Records come from /prep-times (paginated). The page also needs aggregate
  // stats and a day/hour heatmap, which the backend serves from /summary and
  // /heatmap (parity with the OLD app's three prep-time calls). Fetch all three
  // in parallel and adapt field names; tolerate a base response that already
  // bundles stats/heatmap.
  getPrepTime: async (
    params?: FoodicsDateBranchFilter
  ): Promise<FoodicsPrepTimeResponse> => {
    const query = params as never;
    const [recRes, sumRes, heatRes] = await Promise.all([
      api
        .get<Record<string, unknown>>(endpoints.foodics.prepTime, { query })
        .catch(() => ({}) as Record<string, unknown>),
      api
        .get<{
          data: Record<string, unknown>;
        }>(endpoints.foodics.prepTimesSummary, { query })
        .catch(() => ({ data: {} as Record<string, unknown> })),
      api
        .get<{
          data: Record<string, unknown>[];
        }>(endpoints.foodics.prepTimesHeatmap, { query })
        .catch(() => ({ data: [] as Record<string, unknown>[] })),
    ]);

    const root = (recRes ?? {}) as Record<string, unknown>;
    // The records list may be at .data, .data.data, or .data.records.
    const inner = (root.data ?? root) as Record<string, unknown>;
    const rawRecords = (
      Array.isArray(inner)
        ? inner
        : Array.isArray(inner.data)
          ? inner.data
          : Array.isArray(inner.records)
            ? inner.records
            : []
    ) as Record<string, unknown>[];

    const num = (v: unknown): number =>
      typeof v === "number" ? v : Number(v ?? 0) || 0;
    const numN = (v: unknown): number | null =>
      v == null ? null : Number(v) || 0;

    // Raw rows carry the backend's field names (prep_times migration). Map to
    // the flattened shape the page consumes (parity with the legacy system).
    const records: FoodicsPrepTimeRecord[] = rawRecords.map((row) => ({
      id: String(row.id ?? ""),
      date: (row.business_date as string) ?? "",
      order_placed: (row.t1_order_placed as string) ?? "",
      food_ready: (row.t3_food_ready as string) ?? "",
      kitchen_prep: num(row.kitchen_prep_seconds),
      service: num(row.service_seconds),
      total_cycle: num(row.total_cycle_seconds),
      hour: num(row.hour_of_day),
      branch_id: String(row.branch_id ?? ""),
      branch_name: (row.branch_name as string) ?? "",
    }));

    // Stats: prefer an embedded stats block, else the /summary feed.
    const rawStats =
      (root.stats as Record<string, unknown> | undefined) ??
      (sumRes?.data as Record<string, unknown> | undefined) ??
      {};
    const stats: FoodicsPrepTimeStats = {
      total_orders: num(rawStats.total_orders),
      ai_matched: num(rawStats.ai_matched ?? rawStats.matched_orders),
      ai_matched_pct: num(rawStats.ai_matched_pct ?? rawStats.match_rate),
      avg_kitchen_prep: numN(
        rawStats.avg_kitchen_prep ?? rawStats.avg_kitchen_prep_seconds
      ),
      avg_service: numN(rawStats.avg_service ?? rawStats.avg_service_seconds),
      avg_total_cycle: numN(
        rawStats.avg_total_cycle ?? rawStats.avg_total_cycle_seconds
      ),
    };

    // Heatmap: flatten the backend's cell list into a single row of cells; the
    // page re-bins by day/hour itself.
    const rawHeat = Array.isArray(root.heatmap)
      ? (root.heatmap as Record<string, unknown>[])
      : (heatRes?.data ?? []);
    const heatCells: HeatmapCell[] = rawHeat.map((c) => ({
      hour: num(c.hour),
      day: num(c.day),
      value: num(c.value ?? c.avg_prep_seconds ?? c.orders),
      label: String(c.label ?? ""),
    }));

    return {
      data: records,
      stats,
      heatmap: heatCells.length ? [heatCells] : [],
      current_page: num(inner.current_page ?? root.current_page) || 1,
      last_page: num(inner.last_page ?? root.last_page) || 1,
      per_page: num(inner.per_page ?? root.per_page) || records.length,
      total: num(inner.total ?? root.total) || records.length,
    };
  },

  // Footfall vs Revenue
  //
  // The page expects a single { data, hourly_breakdown, stats } object, but the
  // backend exposes three separate conversion feeds (parity with the OLD app's
  // conversion page). We fetch all three in parallel and adapt their fields
  // (footfall_in / total_footfall_in / avg_conversion_rate → the page's names).
  getFootfall: async (
    params?: FoodicsDateBranchFilter
  ): Promise<FoodicsFootfallResponse> => {
    const query = params as never;
    const [dailyRes, hourlyRes, summaryRes] = await Promise.all([
      api
        .get<{
          data: ConversionDailySummary[];
        }>(endpoints.foodics.conversionDaily, { query })
        .catch(() => ({ data: [] as ConversionDailySummary[] })),
      api
        .get<{
          data: ConversionHourlyStat[];
        }>(endpoints.foodics.conversionHourly, { query })
        .catch(() => ({ data: [] as ConversionHourlyStat[] })),
      api
        .get<{
          data: ConversionSummary | null;
        }>(endpoints.foodics.conversionSummary, { query })
        .catch(() => ({ data: null as ConversionSummary | null })),
    ]);

    const dailyRows = dailyRes?.data ?? [];
    const data: FoodicsFootfallRecord[] = dailyRows.map((row) => ({
      date: row.stat_date,
      footfall: row.total_footfall_in ?? 0,
      orders: row.total_orders ?? 0,
      conversion_rate: row.avg_conversion_rate ?? 0,
      revenue: row.total_revenue ?? 0,
      revenue_per_visitor: row.revenue_per_visitor ?? 0,
      branch_id: String(row.branch_id ?? ""),
      branch_name: "",
    }));

    // Collapse hourly rows into per-hour averages for the heatmap/table.
    const hourlyRows = hourlyRes?.data ?? [];
    const byHour = new Map<
      number,
      { footfall: number; orders: number; conv: number; n: number }
    >();
    for (const h of hourlyRows) {
      const cur = byHour.get(h.hour) ?? {
        footfall: 0,
        orders: 0,
        conv: 0,
        n: 0,
      };
      cur.footfall += h.footfall_in ?? 0;
      cur.orders += h.orders_count ?? 0;
      cur.conv += h.conversion_rate ?? 0;
      cur.n += 1;
      byHour.set(h.hour, cur);
    }
    const hourly_breakdown: HourlyBreakdown[] = Array.from(byHour.entries())
      .map(([hour, v]) => ({
        hour,
        avg_footfall: v.n ? Math.round(v.footfall / v.n) : 0,
        avg_orders: v.n ? Math.round(v.orders / v.n) : 0,
        avg_conversion: v.n ? Math.round((v.conv / v.n) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.hour - b.hour);

    const sum = summaryRes?.data ?? null;
    const stats: FoodicsFootfallStats = {
      total_footfall: sum?.total_footfall ?? 0,
      total_orders: sum?.total_orders ?? 0,
      conversion_rate: sum?.avg_conversion_rate ?? null,
      total_revenue: sum?.total_revenue ?? 0,
      revenue_per_visitor: sum?.avg_revenue_per_visitor ?? null,
      avg_daily_footfall: sum?.avg_daily_footfall ?? 0,
    };

    return { data, hourly_breakdown, stats };
  },

  // Inventory Audit
  getInventoryZones: async (
    branch_id?: string
  ): Promise<{ data: FoodicsInventoryZone[] }> => {
    const res = await api
      .get<Record<string, unknown>>(endpoints.foodics.inventoryZones, {
        query: branch_id ? { branch_id } : undefined,
      })
      .catch(() => ({}) as Record<string, unknown>);
    const rows = (
      Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []
    ) as Record<string, unknown>[];
    // Map raw inventory_zones fields to the flattened shape (parity with legacy).
    const data: FoodicsInventoryZone[] = rows.map((row) => {
      const zone = (row.zone as Record<string, unknown> | undefined) ?? row;
      return {
        id: String(row.id ?? ""),
        name: String(zone.name ?? row.name ?? ""),
        branch_id: String(row.branch_id ?? ""),
        branch_name: String(row.branch_name ?? ""),
        items_count: Number(row.baseline_count ?? row.detected_count ?? 0) || 0,
        last_audit: (row.audited_at as string) ?? null,
        status: String(row.product_type ?? (row.active ? "active" : "inactive")),
      };
    });
    return { data };
  },
  createInventoryZone: (data: { name: string; branch_id: string }) =>
    api.post(endpoints.foodics.inventoryZoneCreate, data),
  updateInventoryZone: (id: string, data: { name: string }) =>
    api.post(endpoints.foodics.inventoryZoneUpdate(id), data),
  deleteInventoryZone: (id: string) =>
    api.post(endpoints.foodics.inventoryZoneDelete(id)),
  /**
   * Trigger an inventory audit for a zone (parity with the OLD "Run Audit"
   * action). POST /customer/foodics/inventory/audit { zone_id }.
   */
  runInventoryAudit: (zoneId: string) =>
    api.post(endpoints.foodics.inventoryAudit, { zone_id: zoneId }),
  getInventoryAuditHistory: async (
    params?: FoodicsDateBranchFilter
  ): Promise<{ data: FoodicsInventoryAudit[] }> => {
    const res = await api
      .get<Record<string, unknown>>(endpoints.foodics.inventoryAuditHistory, {
        query: params as never,
      })
      .catch(() => ({}) as Record<string, unknown>);
    const inner = (res.data ?? res) as Record<string, unknown>;
    const rows = (
      Array.isArray(inner)
        ? inner
        : Array.isArray(inner.data)
          ? inner.data
          : []
    ) as Record<string, unknown>[];
    // Map raw inventory_audits fields (DB schema) to the flattened shape.
    const data: FoodicsInventoryAudit[] = rows.map((row) => {
      const zone = row.zone as Record<string, unknown> | undefined;
      return {
        id: String(row.id ?? ""),
        zone_id: String(row.zone_id ?? ""),
        zone_name: String(zone?.name ?? row.zone_name ?? ""),
        date: (row.audited_at as string) ?? "",
        status: String(row.review_status ?? row.camera_level ?? ""),
        items_audited: Number(row.detected_count ?? 0) || 0,
        discrepancies: row.discrepancy ? 1 : 0,
        branch_id: String(row.branch_id ?? ""),
        branch_name: String(row.branch_name ?? ""),
      };
    });
    return { data };
  },

  // Branches
  importBranches: () => api.post(endpoints.foodics.importBranches),
  getBranches: () =>
    api.get<{ data: { id: string; name: string }[] }>(
      endpoints.organization.branches
    ),
};
