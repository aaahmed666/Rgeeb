"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  analyticsService,
  type AnalyticsSummary,
  type Branch,
  type BranchRow,
  type CameraRow,
  type ServiceBreakdown,
  type TrendPoint,
} from "@/services/analyticsService";

type RangeKey = "7" | "14" | "30";

function rangeFor(key: RangeKey) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (Number(key) - 1));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AnalyticsView() {
  const { t } = useTranslation();
  const [range, setRange] = useState<RangeKey>("7");
  const [branchId, setBranchId] = useState<string>("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [byService, setByService] = useState<ServiceBreakdown[]>([]);
  const [byCamera, setByCamera] = useState<CameraRow[]>([]);
  const [byBranch, setByBranch] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(() => rangeFor(range), [range]);

  const load = useCallback(async () => {
    setLoading(true);
    const filters = {
      dateFrom: from,
      dateTo: to,
      branchId: branchId === "all" ? undefined : branchId,
    };
    const [s, tr, sv, cm, br] = await Promise.all([
      analyticsService.getSummary(filters),
      analyticsService.getTrends(filters),
      analyticsService.getByService(filters),
      analyticsService.getByCamera(filters),
      analyticsService.getByBranch(filters),
    ]);
    setSummary(s);
    setTrends(tr);
    setByService(sv);
    setByCamera(cm);
    setByBranch(br);
    setLoading(false);
  }, [from, to, branchId]);

  useEffect(() => {
    void analyticsService.getBranches().then(setBranches);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDet = Math.max(1, ...trends.map((t) => t.detections));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-cyan-500 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
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
                  onClick={() => setRange(k)}
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
            <Select
              value={branchId}
              onValueChange={setBranchId}
            >
              <SelectTrigger className="h-9 w-44 border-white/30 bg-white/15 text-white backdrop-blur-sm [&>svg]:text-white">
                <Building2 className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("analytics.allBranches", "All Branches")}
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
            loading ? null : `${(summary?.compliance_score ?? 0).toFixed(1)}%`
          }
          hint={
            (summary?.compliance_score ?? 0) >= 80
              ? t("analytics.excellent", "Excellent")
              : t("analytics.needsImprovement", "Needs Improvement")
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          tint="bg-emerald-500/10 text-emerald-600"
          valueClass="text-emerald-600"
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
            <div className="flex h-64 items-end gap-2">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-full flex-1"
                    />
                  ))
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
                ↗ {trend >= 0 ? "+" : ""}
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
