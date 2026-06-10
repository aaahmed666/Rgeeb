import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type ReportTab =
  | "customers"
  | "suppliers"
  | "sales"
  | "purchases"
  | "inventory"
  | "financials";

export interface ReportFilters {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
}

export interface ReportMetric {
  label: string;
  value: string | number;
  trend?: number;
  hint?: string;
}

export interface ReportRow {
  [key: string]: string | number;
}

export interface ReportPayload {
  metrics: ReportMetric[];
  columns: { key: string; label: string }[];
  rows: ReportRow[];
}

const demo: Record<ReportTab, ReportPayload> = {
  customers: {
    metrics: [
      { label: "Total Customers", value: "1,248", trend: 8.4 },
      { label: "New", value: "92", trend: 12.1 },
      { label: "Active", value: "874", trend: 3.2 },
      { label: "Revenue", value: "$48,920", trend: 18.5 },
    ],
    columns: [
      { key: "name", label: "Customer" },
      { key: "orders", label: "Orders" },
      { key: "revenue", label: "Revenue" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { name: "Acme Corp", orders: 24, revenue: "$8,420", status: "Active" },
      { name: "Globex", orders: 19, revenue: "$6,310", status: "Active" },
      { name: "Initech", orders: 12, revenue: "$3,950", status: "Idle" },
    ],
  },
  suppliers: {
    metrics: [
      { label: "Suppliers", value: "186" },
      { label: "Pending POs", value: "23" },
      { label: "Spend", value: "$22,140" },
      { label: "On-time", value: "94%" },
    ],
    columns: [
      { key: "name", label: "Supplier" },
      { key: "orders", label: "POs" },
      { key: "spend", label: "Spend" },
    ],
    rows: [
      { name: "BoxCo", orders: 14, spend: "$6,200" },
      { name: "PartsPro", orders: 9, spend: "$4,810" },
    ],
  },
  sales: {
    metrics: [
      { label: "Sales", value: "$64,820", trend: 14.2 },
      { label: "Orders", value: "412" },
      { label: "Avg. Order", value: "$157" },
      { label: "Refunds", value: "$1,240" },
    ],
    columns: [
      { key: "invoice", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "total", label: "Total" },
    ],
    rows: [
      { invoice: "INV-2041", customer: "Acme", total: "$1,240" },
      { invoice: "INV-2042", customer: "Globex", total: "$842" },
    ],
  },
  purchases: {
    metrics: [
      { label: "Purchases", value: "$22,140" },
      { label: "Orders", value: "98" },
      { label: "Pending", value: "12" },
      { label: "Returns", value: "$320" },
    ],
    columns: [
      { key: "po", label: "PO" },
      { key: "supplier", label: "Supplier" },
      { key: "total", label: "Total" },
    ],
    rows: [
      { po: "PO-118", supplier: "BoxCo", total: "$2,100" },
      { po: "PO-119", supplier: "PartsPro", total: "$1,480" },
    ],
  },
  inventory: {
    metrics: [
      { label: "SKUs", value: "1,820" },
      { label: "Stock Value", value: "$184,200" },
      { label: "Low Stock", value: "34" },
      { label: "Out of Stock", value: "8" },
    ],
    columns: [
      { key: "sku", label: "SKU" },
      { key: "name", label: "Item" },
      { key: "qty", label: "Qty" },
    ],
    rows: [
      { sku: "A-101", name: "Widget", qty: 240 },
      { sku: "A-102", name: "Gadget", qty: 18 },
    ],
  },
  financials: {
    metrics: [
      { label: "Revenue", value: "$64,820", trend: 14.2 },
      { label: "Expenses", value: "$28,440" },
      { label: "Profit", value: "$36,380", trend: 22.1 },
      { label: "Margin", value: "56%" },
    ],
    columns: [
      { key: "account", label: "Account" },
      { key: "debit", label: "Debit" },
      { key: "credit", label: "Credit" },
    ],
    rows: [
      { account: "Sales", debit: "$0", credit: "$64,820" },
      { account: "COGS", debit: "$22,140", credit: "$0" },
    ],
  },
};

export async function fetchReport(
  tab: ReportTab,
  filters: ReportFilters,
): Promise<ReportPayload | null> {
  try {
    const data = await apiFetch<Partial<ReportPayload>>(
      endpoints.reports.statistics,
      { query: { date_from: filters.dateFrom, date_to: filters.dateTo, type: tab } },
    );
    if (data && (data.metrics || data.rows)) {
      return {
        metrics: data.metrics ?? [],
        columns: data.columns ?? [],
        rows:    data.rows    ?? [],
      };
    }
    return null;
  } catch {
    return null;
  }
}
