/**
 * Foodics Intelligence API Service
 * Full integration based on the Postman collection endpoints.
 * Base: /customer/foodics/*
 */

import { api } from "@/lib/api";

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
      .get<{ data: FoodicsStatus }>("/customer/foodics/status")
      .then((r) => r.data),
  getConnectUrl: () =>
    api
      .get<{ data: FoodicsConnectUrl }>("/customer/foodics/connect")
      .then((r) => r.data),
  disconnect: () => api.post("/customer/foodics/disconnect"),

  // Dashboard (aggregate)
  getDashboard: (params?: FoodicsDateBranchFilter) =>
    api
      .get<{
        data: FoodicsDashboard;
      }>("/customer/foodics/dashboard", { query: params as never })
      .then((r) => r.data),

  // Orders
  getOrders: (params?: FoodicsDateBranchFilter) =>
    api
      .get<{
        data: FoodicsOrdersResponse;
      }>("/customer/foodics/orders", { query: params as never })
      .then((r) => r.data),
  syncOrders: () => api.post("/customer/foodics/orders/sync"),

  // Refund Verification
  getRefunds: (params?: FoodicsDateBranchFilter) =>
    api
      .get<{
        data: FoodicsRefundsResponse;
      }>("/customer/foodics/refunds", { query: params as never })
      .then((r) => r.data),

  // Cash Drawer Audit
  getDrawerAudits: (params?: FoodicsDateBranchFilter) =>
    api
      .get<{
        data: FoodicsDrawerResponse;
      }>("/customer/foodics/drawer-audits", { query: params as never })
      .then((r) => r.data),
  syncDrawerOperations: () =>
    api.post("/customer/foodics/drawer-operations/sync"),

  // Prep Time Intelligence
  getPrepTime: (params?: FoodicsDateBranchFilter) =>
    api
      .get<{
        data: FoodicsPrepTimeResponse;
      }>("/customer/foodics/prep-time", { query: params as never })
      .then((r) => r.data),

  // Footfall vs Revenue
  getFootfall: (params?: FoodicsDateBranchFilter) =>
    api
      .get<{
        data: FoodicsFootfallResponse;
      }>("/customer/foodics/footfall", { query: params as never })
      .then((r) => r.data),

  // Inventory Audit
  getInventoryZones: (branch_id?: string) =>
    api.get<{ data: FoodicsInventoryZone[] }>(
      "/customer/foodics/inventory/zones",
      {
        query: branch_id ? { branch_id } : undefined,
      }
    ),
  createInventoryZone: (data: { name: string; branch_id: string }) =>
    api.post("/customer/foodics/inventory/zones/create", data),
  updateInventoryZone: (id: string, data: { name: string }) =>
    api.post(`/customer/foodics/inventory/zones/${id}/update`, data),
  deleteInventoryZone: (id: string) =>
    api.post(`/customer/foodics/inventory/zones/${id}/delete`),
  getInventoryAuditHistory: (params?: FoodicsDateBranchFilter) =>
    api.get<{ data: FoodicsInventoryAudit[] }>(
      "/customer/foodics/inventory/audits",
      {
        query: params as never,
      }
    ),

  // Branches
  importBranches: () => api.post("/customer/foodics/branches/import"),
  getBranches: () =>
    api.get<{ data: { id: string; name: string }[] }>("/customer/branches"),
};
