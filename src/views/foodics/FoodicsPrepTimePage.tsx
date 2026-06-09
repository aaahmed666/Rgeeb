"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
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
import { useAuth } from "@/lib/auth";
import { ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from(
  { length: 24 },
  (_, i) => `${i === 0 ? "12" : i > 12 ? i - 12 : i}${i < 12 ? "am" : "pm"}`
);

function formatTime(mins: number | null): string {
  if (mins == null) return "—";
  if (mins < 60) return `${mins.toFixed(0)}m`;
  return `${Math.floor(mins / 60)}h ${(mins % 60).toFixed(0)}m`;
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
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"records" | "heatmap">("records");

  const [branchId, setBranchId] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";
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
    foodicsService
      .getBranches()
      .then((r) => setBranches(r.data ?? []))
      .catch(() => {});
  }, []);

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
          Access Denied
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have permission to view Prep Time.
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
          label={t("foodics.syncing")}
          value={`${stats.ai_matched} (${stats.ai_matched_pct.toFixed(0)}%)`}
          bg="bg-emerald-500"
        />
        <StatCard
          icon={ChefHat}
          label={t("foodics.avgPrepTime")}
          value={formatTime(stats.avg_kitchen_prep)}
          bg="bg-amber-500"
        />
        <StatCard
          icon={Hand}
          label={t("foodics.minPrepTime")}
          value={formatTime(stats.avg_service)}
          bg="bg-sky-500"
        />
        <StatCard
          icon={Clock}
          label={t("foodics.maxPrepTime")}
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
            <ClipboardList className="w-4 h-4" /> {t("foodics.orders")}
          </button>
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "heatmap"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> {t("intel.detectionHeatmap")}
          </button>
        </div>

        <div className="p-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
            >
              <option value="">{t("foodics.branch")}</option>
              {branches.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                >
                  {b.name}
                </option>
              ))}
            </select>
            <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {activeTab === "records" && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                      <th className="text-left py-3 px-2">ID</th>
                      <th className="text-left py-3 px-2">{t("foodics.date")}</th>
                      <th className="text-left py-3 px-2">{t("foodics.orders")}</th>
                      <th className="text-left py-3 px-2">{t("foodics.prepTime")}</th>
                      <th className="text-right py-3 px-2">{t("foodics.avgPrepTime")}</th>
                      <th className="text-right py-3 px-2">{t("foodics.minPrepTime")}</th>
                      <th className="text-right py-3 px-2">{t("foodics.maxPrepTime")}</th>
                      <th className="text-right py-3 px-2">Hour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-12"
                        >
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {t("foodics.noPrepTime")}
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition"
                        >
                          <td className="py-3 px-2 font-mono text-xs">
                            {r.id}
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {r.date}
                          </td>
                          <td className="py-3 px-2">{r.order_placed}</td>
                          <td className="py-3 px-2">{r.food_ready}</td>
                          <td className="py-3 px-2 text-right">
                            {formatTime(r.kitchen_prep)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {formatTime(r.service)}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            {formatTime(r.total_cycle)}
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {r.hour}:00
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                        {DAY_LABELS[dayIdx]}
                      </span>
                      {row.map((val, hourIdx) => {
                        const intensity = val / maxHeat;
                        return (
                          <div
                            key={hourIdx}
                            title={`${DAY_LABELS[dayIdx]} ${hourIdx}:00 — ${val.toFixed(1)} min`}
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
                    <span>Low</span>
                    {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                      <div
                        key={v}
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor: `hsl(${220 - v * 180}, 80%, ${70 - v * 30}%)`,
                        }}
                      />
                    ))}
                    <span>High</span>
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
