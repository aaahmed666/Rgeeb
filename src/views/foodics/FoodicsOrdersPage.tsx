"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, RefreshCw, Search, ChevronLeft, ChevronRight,
  ClipboardList, DollarSign, Tag, TrendingUp,
} from "lucide-react";
import { foodicsService, FoodicsOrder, FoodicsOrderStats } from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";
import { ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function FoodicsOrdersPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<FoodicsOrder[]>([]);
  const [stats, setStats] = useState<FoodicsOrderStats>({
    total_orders: 0, total_sales: 0, total_discounts: 0, avg_order_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getOrders({
        branch_id: branchId || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: 25,
      });
      setOrders(res.data ?? []);
      setStats(res.stats ?? { total_orders: 0, total_sales: 0, total_discounts: 0, avg_order_value: 0 });
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, status, from, to, page]);

  useEffect(() => {
    foodicsService.getBranches().then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await foodicsService.syncOrders();
      await fetchOrders();
    } finally {
      setSyncing(false);
    }
  };

  const filteredOrders = orders.filter((o) =>
    !search || o.reference?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.toLowerCase().includes(search.toLowerCase())
  );

  const StatCard = ({
    icon: Icon, label, value, color,
  }: { icon: React.ElementType; label: string; value: string; color: string }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  if (!hasPermission("foodics.orders.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view Orders.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Orders" value={String(stats.total_orders)} color="bg-indigo-500" />
        <StatCard icon={DollarSign} label="Total Sales" value={`SAR ${stats.total_sales.toFixed(2)}`} color="bg-emerald-500" />
        <StatCard icon={Tag} label="Total Discounts" value={`SAR ${stats.total_discounts.toFixed(2)}`} color="bg-pink-500" />
        <StatCard icon={TrendingUp} label="Avg Order Value" value={`SAR ${stats.avg_order_value.toFixed(2)}`} color="bg-sky-500" />
      </div>

      {/* Filters + Sync */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Orders
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="text-left py-3 px-2">Ref #</th>
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Customer</th>
                <th className="text-right py-3 px-2">Total</th>
                <th className="text-right py-3 px-2">Discount</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                    <td className="py-3 px-2 font-mono text-xs text-primary">{order.reference}</td>
                    <td className="py-3 px-2 text-muted-foreground">{order.date}</td>
                    <td className="py-3 px-2">{order.type}</td>
                    <td className="py-3 px-2">{order.customer ?? "—"}</td>
                    <td className="py-3 px-2 text-right font-medium">SAR {order.total.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">SAR {order.discount.toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total === 0 ? "0–0 of 0" : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <span>Rows per page: 25</span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
