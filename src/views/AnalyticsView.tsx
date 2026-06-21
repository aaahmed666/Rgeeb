"use client";

import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  RefreshCw,
  ShieldAlert,
  Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, toLocalISODate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";
import {
  analyticsService,
  type AnalyticsSummary,
  type Branch,
  type BranchRow,
  type CameraRow,
  type ServiceBreakdown,
  type TrendPoint } from "@/services/analyticsService";

type RangeKey = "7" | "14" | "30" | "custom";

function rangeFor(key: RangeKey) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (Number(key) - 1));
  return {
    from: toLocalISODate(from),
    to: toLocalISODate(to),
  };
}

export default function AnalyticsView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [range, setRange] = useState<RangeKey>("7");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [branchId, setBranchId] = useState<string>("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [byService, setByService] = useState<ServiceBreakdown[]>([]);
  const [byCamera, setByCamera] = useState<CameraRow[]>([]);
  const [byBranch, setByBranch] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Derive from/to: custom picker takes priority over preset buttons
  const from = useMemo(() => {
    if (range === "custom" && dateRange?.[0])
      return toLocalISODate(dateRange[0]);
    return rangeFor(range === "custom" ? "7" : range).from;
  }, [range, dateRange]);

  const to = useMemo(() => {
    if (range === "custom" && dateRange?.[1])
      return toLocalISODate(dateRange[1]);
    return rangeFor(range === "custom" ? "7" : range).to;
  }, [range, dateRange]);

  // Single combined effect: runs when from/to/branchId change
  useEffect(() => {
    // Load branches once
    void analyticsService.getBranches().then(setBranches);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(() => {
    let cancelled = false;
    const filters = {
      dateFrom: from,
      dateTo:   to,
      branchId: branchId === "all" ? undefined : branchId,
    };
    setLoading(true);
    setLoadError(null);
    void Promise.all([
      analyticsService.getSummary(filters),
      analyticsService.getTrends(filters),
      analyticsService.getByService(filters),
      analyticsService.getByCamera(filters),
      analyticsService.getByBranch(filters),
    ]).then(([s, tr, sv, cm, br]) => {
      if (cancelled) return;
      setSummary(s);
      setTrends(tr);
      setByService(sv);
      setByCamera(cm);
      setByBranch(br);
    }).catch((err) => {
      if (!cancelled) setLoadError(err instanceof Error ? err.message : t("errors.somethingWentWrong", "Something went wrong"));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [from, to, branchId, t]);

  useEffect(() => {
    return loadData();
  }, [loadData]); // ← loadData is memoized on from/to/branchId/t

  const maxDet = Math.max(1, ...trends.map((t) => t.detections));

  // Read guard via aliases in auth.tsx

  // Permission read guard
  if (!hasPermission("analytics")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground">{t("common.noPermission", "You don't have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Banner */}
      <div className="overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: "linear-gradient(to right, #fb923c, #f97316, #06b6d4)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                {t("analytics.title", "Analytics")}
              </h1>
              <p className="mt-1 text-sm text-white/90">
                {t(
                  "analytics.subtitle",
                  "AI detection trends, compliance metrics, and operational insights"
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-white/15 p-1 backdrop-blur-sm">
              {(["7", "14", "30"] as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => { setRange(k); setDateRange(null); }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition",
                    range === k
                      ? "bg-white !text-slate-900"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  {k} {t("analytics.days", "Days")}
                </button>
              ))}
            </div>
            {/* Custom date range picker */}
            <div className="min-w-[220px]">
              <SharedDateRangePicker
                value={dateRange}
                onChange={(val) => {
                  setDateRange(val);
                  if (val) setRange("custom");
                }}
                placeholder={t("analytics.customRange", "Custom Range")}
              />
            </div>
            <AsyncPaginatedSelect
                endpoint="/customer/branches"
                labelKey="name"
                valueKey="id"
                extraParams={{ active: 1 }}
                value={branchId === "all" ? null : branchId}
                onChange={(v: string | null) => setBranchId(v ?? "all")}
                placeholder={t("common.allBranches")}
                isClearable
              />
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadData()}
              disabled={loading}
              className="bg-white/15 border-white/30 text-white hover:bg-white/25"
              aria-label={t("common.refresh")}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {loadError && !loading && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <button onClick={() => loadData()} className="ml-4 rounded-md bg-destructive/20 px-3 py-1 text-xs font-medium hover:bg-destructive/30">
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("analytics.totalDetections", "Total Detections")}
          value={
            loading ? null : (summary?.total_detections ?? 0).toLocaleString()
          }
          trend={summary?.trend_pct}
          trendLabel={t("analytics.vsPrev", "vs prev period")}
          icon={<Eye className="h-5 w-5" />}
          tint="bg-violet-500/10 text-violet-600"
        />
        <KpiCard
          label={t("analytics.violations", "Violations")}
          value={loading ? null : (summary?.violations ?? 0).toLocaleString()}
          hint={t("analytics.safetyHint", "Safety & compliance issues")}
          icon={<ShieldAlert className="h-5 w-5" />}
          tint="bg-rose-500/10 text-rose-600"
        />
        <KpiCard
          label={t("analytics.complianceScore", "Compliance Score")}
          value={
            loading
              ? null
              : (summary?.total_detections ?? 0) === 0
                ? "—"
                : `${(summary?.compliance_score ?? 0).toFixed(1)}%`
          }
          hint={
            (summary?.total_detections ?? 0) === 0
              ? t("analytics.noData", "No data for this period")
              : (summary?.compliance_score ?? 0) >= 80
                ? t("analytics.excellent", "Excellent")
                : t("analytics.needsImprovement", "Needs Improvement")
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          tint="bg-emerald-500/10 text-emerald-600"
          valueClass={
            (summary?.total_detections ?? 0) === 0
              ? "text-muted-foreground"
              : "text-emerald-600"
          }
        />
        <KpiCard
          label={t("analytics.activeCameras", "Active Cameras")}
          value={loading ? null : `${summary?.active_cameras ?? 0}`}
          suffix={summary ? `/${summary.total_cameras ?? 0}` : undefined}
          hint={`${summary?.active_services ?? 0} ${t("analytics.aiServicesActive", "AI services active")}`}
          icon={<Video className="h-5 w-5" />}
          tint="bg-cyan-500/10 text-cyan-600"
        />
      </div>

      {/* Trends + By Service */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">
                  {t("analytics.detectionTrends", "Detection Trends")}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {from} → {to}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Legend
                  color="hsl(220 70% 35%)"
                  label={t("analytics.allDetections", "All Detections")}
                />
                <Legend
                  color="hsl(0 75% 60%)"
                  label={t("analytics.violations", "Violations")}
                />
              </div>
            </div>
            <div className="relative flex h-64 items-end gap-2">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-full flex-1"
                    />
                  ))
                : trends.length === 0
                  ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 opacity-20" />
                      <p className="text-sm">{t("analytics.noData", "No detection data for this period")}</p>
                    </div>
                  )
                  : trends.map((p, i) => (
                    <div
                      key={p.date ?? i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="relative flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-slate-700 to-slate-400"
                          style={{
                            height: `${(p.detections / maxDet) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-rose-400/80"
                          style={{
                            height: `${(p.violations / maxDet) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {p.date}
                      </span>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-base font-semibold">
              {t("analytics.byService", "By Service")}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {t("analytics.detectionDistribution", "Detection distribution")}
            </p>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-10"
                    />
                  ))
                : byService.length === 0
                  ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {t("analytics.noServiceData", "No service data available")}
                    </p>
                  )
                  : byService.map((s, i) => (
                    <div
                      key={s.name ?? i}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: s.color ?? "hsl(220 70% 50%)",
                            }}
                          />
                          {s.name}
                        </span>
                        <span className="flex items-center gap-2">
                          {s.violations ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              {s.violations}{" "}
                              {t("analytics.violationsShort", "violations")}
                            </span>
                          ) : null}
                          <span className="font-semibold tabular-nums">
                            {(s.count ?? 0).toLocaleString()} ({s.percent ?? 0}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.percent}%`,
                            background: s.color ?? "hsl(220 70% 50%)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Camera + By Branch */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold">
              {t("analytics.detectionsByCamera", "Detections by Camera")}
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("analytics.topCameras", "Top cameras by detection count")}
            </p>
            <DataTable
              data={byCamera.map((c) => ({ id: c.camera, ...c }))}
              isLoading={loading}
              emptyMessage={t("analytics.noCameraData", "No camera data")}
              columns={[
                {
                  key: "camera",
                  header: t("analytics.camera", "Camera"),
                  render: (c) => (
                    <span className="font-medium">{c.camera}</span>
                  ),
                },
                {
                  key: "branch",
                  header: t("analytics.branch", "Branch"),
                  render: (c) => (
                    <span className="text-muted-foreground">{c.branch}</span>
                  ),
                },
                {
                  key: "total",
                  header: t("analytics.total", "Total"),
                  render: (c) => (
                    <span className="tabular-nums">
                      {(c.total ?? 0).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: "violations",
                  header: t("analytics.violations", "Violations"),
                  render: (c) => (
                    <span
                      className={cn(
                        "inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        c.violations > 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.violations}
                    </span>
                  ),
                },
                {
                  key: "rate",
                  header: t("analytics.rate", "Rate"),
                  render: (c) => (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            c.rate > 50 ? "bg-rose-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${c.rate}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">{c.rate}%</span>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-base font-semibold">
              {t("analytics.branchComparison", "Branch Comparison")}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {t(
                "analytics.detectionViolationRates",
                "Detection & violation rates"
              )}
            </p>
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-20"
                    />
                  ))
                : byBranch.map((b) => (
                    <div
                      key={b.branch}
                      className="rounded-lg border p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {b.branch}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {(b.detections ?? 0).toLocaleString()}{" "}
                          {t("analytics.detectionsShort", "detections")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              b.violation_rate > 50
                                ? "bg-rose-500"
                                : "bg-sky-500"
                            )}
                            style={{
                              width: `${Math.max(2, b.violation_rate)}%`,
                            }}
                          />
                        </div>
                        {b.violations > 0 && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                            {b.violation_rate}%{" "}
                            {t("analytics.violationsShort", "violations")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  trend,
  trendLabel,
  hint,
  icon,
  tint,
  valueClass,
}: {
  label: string;
  value: string | null | undefined;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  hint?: string;
  icon: React.ReactNode;
  tint: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {value === null ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className={cn("text-3xl font-bold tabular-nums", valueClass)}>
                {value}
                {suffix && (
                  <span className="text-xl text-muted-foreground">
                    {suffix}
                  </span>
                )}
              </p>
            )}
            {typeof trend === "number" && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend >= 0 ? "↗ +" : "↘ "}
                {trend}% {trendLabel}
              </p>
            )}
            {hint && !trend && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {hint && typeof trend !== "number" && trend !== undefined && null}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              tint
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
