"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  foodicsService,
  FoodicsOrder,
  FoodicsOrderStats,
} from "@/services/foodicsService";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/lib/auth";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

const STATUS_COLORS: Record<string, string> = {
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  refunded:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function FoodicsOrdersPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<FoodicsOrder[]>([]);
  const [stats, setStats] = useState<FoodicsOrderStats>({
    total_orders: 0,
    total_sales: 0,
    total_discounts: 0,
    avg_order_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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
      setStats(
        res.stats ?? {
          total_orders: 0,
          total_sales: 0,
          total_discounts: 0,
          avg_order_value: 0,
        }
      );
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, status, from, to, page]);

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

  const filteredOrders = orders.filter(
    (o) =>
      !search ||
      o.reference?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.toLowerCase().includes(search.toLowerCase())
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
  }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  if (!hasPermission("foodics.orders.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {t("foodics.accessDenied")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have permission to view Orders.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label={t("foodics.totalOrders")}
          value={String(stats.total_orders)}
          color="bg-indigo-500"
        />
        <StatCard
          icon={DollarSign}
          label={t("foodics.totalSales")}
          value={`SAR ${stats.total_sales.toFixed(2)}`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Tag}
          label={t("foodics.totalDiscounts")}
          value={`SAR ${stats.total_discounts.toFixed(2)}`}
          color="bg-pink-500"
        />
        <StatCard
          icon={TrendingUp}
          label={t("foodics.avgOrderValue")}
          value={`SAR ${stats.avg_order_value.toFixed(2)}`}
          color="bg-sky-500"
        />
      </div>

      {/* Filters + Sync */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("foodics.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="w-48">
            <AsyncPaginatedSelect
              endpoint="/customer/branches"
              labelKey="name"
              valueKey="id"
              value={branchId || null}
              onChange={(v) => {
                setBranchId(v ?? "");
                setPage(1);
              }}
              placeholder={t("foodics.branch")}
              height={38}
              isClearable
            />
          </div>
          <AsyncPaginatedSelect
            options={[
              { value: "completed", label: t("foodics.orderStatus.completed") },
              { value: "pending", label: t("foodics.orderStatus.pending") },
              { value: "cancelled", label: t("foodics.orderStatus.cancelled") },
              { value: "refunded", label: t("foodics.orderStatus.refunded") },
            ]}
            value={status || null}
            onChange={(v) => {
              setStatus(v ?? "");
              setPage(1);
            }}
            placeholder={t("foodics.orderStatus.all")}
            height={38}
            isClearable
          />
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
        <div className="mt-4">
          <DataTable<FoodicsOrder>
            data={filteredOrders}
            isLoading={loading}
            emptyMessage={t("foodics.noOrders")}
            emptyDescription={t("foodics.noOrdersDesc")}
            columns={[
              {
                key: "reference",
                header: t("foodics.reference"),
                render: (o) => (
                  <span className="font-mono text-xs text-primary">
                    {o.reference}
                  </span>
                ),
              },
              {
                key: "date",
                header: t("foodics.date"),
                cellClassName: "text-muted-foreground",
                render: (o) => o.date,
              },
              {
                key: "type",
                header: t("foodics.type"),
                render: (o) => o.type,
              },
              {
                key: "customer",
                header: t("foodics.customer"),
                render: (o) => o.customer ?? "—",
              },
              {
                key: "total",
                header: t("common.total"),
                headClassName: "text-right",
                cellClassName: "text-right font-medium",
                render: (o) => `SAR ${o.total.toFixed(2)}`,
              },
              {
                key: "discount",
                header: t("foodics.totalDiscounts"),
                headClassName: "text-right",
                cellClassName: "text-right text-muted-foreground",
                render: (o) => `SAR ${o.discount.toFixed(2)}`,
              },
              {
                key: "status",
                header: t("foodics.status"),
                render: (o) => (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {o.status}
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total === 0
              ? "0–0 of 0"
              : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <span>{t("admin.common.rowsPerPage")}: 25</span>
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
