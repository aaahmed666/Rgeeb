"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import { dateRangeToISO } from "@/lib/utils";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Link2,
  ChefHat,
  Hand,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  foodicsService,
  FoodicsPrepTimeRecord,
  FoodicsPrepTimeStats,
} from "@/services/foodicsService";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/lib/auth";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

const DAY_LABEL_KEYS = [
  "foodics.daySun",
  "foodics.dayMon",
  "foodics.dayTue",
  "foodics.dayWed",
  "foodics.dayThu",
  "foodics.dayFri",
  "foodics.daySat",
];
const HOUR_LABELS = Array.from(
  { length: 24 },
  (_, i) => `${i === 0 ? "12" : i > 12 ? i - 12 : i}${i < 12 ? "am" : "pm"}`
);

// Input is SECONDS (parity with legacy prep-times.tsx formatTime). The
// backend's *_seconds fields are passed straight through.
function formatTime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Clock formatter for timestamp columns (parity with legacy → "HH:mm:ss").
function formatClock(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function FoodicsPrepTimePage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<FoodicsPrepTimeRecord[]>([]);
  const [heatmap, setHeatmap] = useState<number[][]>([]);
  const [stats, setStats] = useState<FoodicsPrepTimeStats>({
    total_orders: 0,
    ai_matched: 0,
    ai_matched_pct: 0,
    avg_kitchen_prep: null,
    avg_service: null,
    avg_total_cycle: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"records" | "heatmap">("records");

  const [branchId, setBranchId] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const { from, to } = dateRangeToISO(dateRange);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getPrepTime({
        branch_id: branchId || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: 25,
      });
      setRecords(res.data ?? []);
      setStats(
        res.stats ?? {
          total_orders: 0,
          ai_matched: 0,
          ai_matched_pct: 0,
          avg_kitchen_prep: null,
          avg_service: null,
          avg_total_cycle: null,
        }
      );
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);

      // Build heatmap matrix [day][hour]
      const matrix: number[][] = Array.from({ length: 7 }, () =>
        Array(24).fill(0)
      );
      (res.heatmap ?? []).flat().forEach((cell) => {
        if (cell.day >= 0 && cell.day < 7 && cell.hour >= 0 && cell.hour < 24) {
          matrix[cell.day][cell.hour] = cell.value;
        }
      });
      setHeatmap(matrix);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, from, to, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxHeat = Math.max(...heatmap.flat(), 1);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    bg,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    bg: string;
  }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide text-center">
        {label}
      </p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  if (!hasPermission("foodics.prep_times.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {t("foodics.accessDenied")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("foodics.noPermissionPrepTime")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={ClipboardList}
          label={t("foodics.totalOrders")}
          value={String(stats.total_orders)}
          bg="bg-indigo-500"
        />
        <StatCard
          icon={Link2}
          label={t("foodics.aiMatched")}
          value={`${stats.ai_matched} (${stats.ai_matched_pct.toFixed(0)}%)`}
          bg="bg-emerald-500"
        />
        <StatCard
          icon={ChefHat}
          label={t("foodics.kitchenPrep")}
          value={formatTime(stats.avg_kitchen_prep)}
          bg="bg-amber-500"
        />
        <StatCard
          icon={Hand}
          label={t("foodics.service")}
          value={formatTime(stats.avg_service)}
          bg="bg-sky-500"
        />
        <StatCard
          icon={Clock}
          label={t("foodics.totalCycle")}
          value={formatTime(stats.avg_total_cycle)}
          bg="bg-violet-500"
        />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "records"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> {t("foodics.tabRecords")}
          </button>
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "heatmap"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> {t("foodics.tabHeatmap")}
          </button>
        </div>

        <div className="p-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="w-full sm:w-44">
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
            <SharedDateRangePicker
              className="rs-compact w-full sm:w-64"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {activeTab === "records" && (
            <>
              <DataTable<FoodicsPrepTimeRecord>
                data={records}
                isLoading={loading}
                emptyMessage={t("foodics.noPrepTime")}
                columns={[
                  {
                    key: "id",
                    header: t("common.id", "ID"),
                    cellClassName: "font-mono text-xs",
                    render: (r) => r.id,
                  },
                  {
                    key: "date",
                    header: t("foodics.date"),
                    cellClassName: "text-muted-foreground",
                    render: (r) => r.date,
                  },
                  {
                    key: "order_placed",
                    header: t("foodics.orderPlaced"),
                    render: (r) => formatClock(r.order_placed),
                  },
                  {
                    key: "food_ready",
                    header: t("foodics.foodReady"),
                    render: (r) =>
                      r.food_ready ? (
                        formatClock(r.food_ready)
                      ) : (
                        <span className="text-muted-foreground">
                          {t("foodics.noMatch", "No match")}
                        </span>
                      ),
                  },
                  {
                    key: "kitchen_prep",
                    header: t("foodics.kitchenPrep"),
                    headClassName: "text-right",
                    cellClassName: "text-right",
                    render: (r) => formatTime(r.kitchen_prep),
                  },
                  {
                    key: "service",
                    header: t("foodics.service"),
                    headClassName: "text-right",
                    cellClassName: "text-right",
                    render: (r) => formatTime(r.service),
                  },
                  {
                    key: "total_cycle",
                    header: t("foodics.totalCycle"),
                    headClassName: "text-right",
                    cellClassName: "text-right font-medium",
                    render: (r) => formatTime(r.total_cycle),
                  },
                  {
                    key: "hour",
                    header: t("foodics.footfallHour", "Hour"),
                    headClassName: "text-right",
                    cellClassName: "text-right text-muted-foreground",
                    render: (r) => `${r.hour}:00`,
                  },
                ]}
              />
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {total === 0
                    ? t("foodics.paginationEmpty")
                    : t("foodics.paginationRange", {
                        from: (page - 1) * 25 + 1,
                        to: Math.min(page * 25, total),
                        total,
                      })}
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
            </>
          )}

          {activeTab === "heatmap" && (
            <div className="overflow-x-auto">
              {heatmap.length === 0 ||
              heatmap.every((row) => row.every((v) => v === 0)) ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t("foodics.noFootfall")}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Hour labels */}
                  <div className="flex gap-1 pl-10">
                    {HOUR_LABELS.filter((_, i) => i % 3 === 0).map((h, i) => (
                      <div
                        key={i}
                        className="text-xs text-muted-foreground"
                        style={{ width: 72 }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  {heatmap.map((row, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="flex items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground w-8">
                        {t(DAY_LABEL_KEYS[dayIdx])}
                      </span>
                      {row.map((val, hourIdx) => {
                        const intensity = val / maxHeat;
                        return (
                          <div
                            key={hourIdx}
                            title={t("foodics.heatmapCellTitle", { day: t(DAY_LABEL_KEYS[dayIdx]), hour: hourIdx, value: val.toFixed(1) })}
                            className="w-5 h-5 rounded-sm transition"
                            style={{
                              backgroundColor:
                                val === 0
                                  ? "var(--muted)"
                                  : `hsl(${220 - intensity * 180}, 80%, ${70 - intensity * 30}%)`,
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>{t("foodics.heatmapLow")}</span>
                    {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                      <div
                        key={v}
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor: `hsl(${220 - v * 180}, 80%, ${70 - v * 30}%)`,
                        }}
                      />
                    ))}
                    <span>{t("foodics.heatmapHigh")}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
