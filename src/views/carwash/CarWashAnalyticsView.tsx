"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Car,
  CheckCircle2,
  Clock,
  Timer,
  FileText,
  Sheet,
  Search,
  Trash2,
  AlertCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  carWashService,
  SERVICE_COLORS,
  SERVICE_LABEL_KEY,
  formatDuration,
  type CarWashSummary,
  type ServiceBreakdownSlice,
  type ClassificationBar,
  type ServiceType,
  type VehicleLogEntry,
} from "@/services/carWashService";

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  Icon,
  accent,
  topBar,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  Icon: React.ElementType;
  accent: string;
  topBar?: boolean;
  loading?: boolean;
}) {
  return (
    <Card data-testid={`kpi-card-${label.toLowerCase().replace(/\s+/g, "-")}`} className="relative p-5">
      {topBar && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-[var(--status-info)] to-transparent" />
      )}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-20" />
      ) : (
        <p className={cn("mt-3 text-3xl font-bold", accent)}>{value}</p>
      )}
    </Card>
  );
}

/* ── Service pill ──────────────────────────────────────────────────────── */
function ServicePill({ service }: { service: ServiceType }) {
  const { t } = useTranslation();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium uppercase"
      style={{
        backgroundColor: `color-mix(in oklch, ${SERVICE_COLORS[service]} 18%, transparent)`,
        color: SERVICE_COLORS[service],
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SERVICE_COLORS[service] }}
      />
      {t(SERVICE_LABEL_KEY[service])}
    </span>
  );
}

export default function CarWashAnalyticsView() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const [summary, setSummary] = useState<CarWashSummary | null>(null);
  const [breakdown, setBreakdown] = useState<ServiceBreakdownSlice[]>([]);
  const [classification, setClassification] = useState<ClassificationBar[]>([]);
  const [vehicleLog, setVehicleLog] = useState<VehicleLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await carWashService.getAnalytics();
      setSummary(res.summary);
      setBreakdown(res.breakdown);
      setClassification(res.classification);
      setVehicleLog(res.vehicleLog);
    } catch {
      setError(t("carWash.loadError", "Could not load analytics."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const donutData = useMemo(
    () =>
      breakdown.map((s) => ({
        name: t(SERVICE_LABEL_KEY[s.type]),
        value: s.count,
        color: SERVICE_COLORS[s.type],
      })),
    [breakdown, t],
  );

  const filteredLog = useMemo(() => {
    const ql = query.trim().toLowerCase();
    if (!ql) return vehicleLog;
    return vehicleLog.filter((v) =>
      [v.plate, v.vehicleClass, ...v.zones].join(" ").toLowerCase().includes(ql),
    );
  }, [query, vehicleLog]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("carWash.analytics.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("carWash.analytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-destructive">
            <FileText className="me-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            size="sm"
            className="bg-[var(--status-success)] text-white hover:bg-[var(--status-success)]/90"
          >
            <Sheet className="me-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {error && (
        <Card data-testid="error-card" className="flex items-center gap-3 border-destructive/40 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="outline" size="sm" className="ms-auto" onClick={load} data-testid="retry-button">
            {t("common.retry", "Retry")}
          </Button>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("carWash.stats.totalVehicles")}
          value={summary?.totalVehicles ?? 0}
          Icon={Car}
          accent="text-[var(--status-success)]"
          topBar
          loading={loading}
        />
        <StatCard
          label={t("carWash.stats.fullService")}
          value={summary?.fullService ?? 0}
          Icon={CheckCircle2}
          accent="text-[var(--status-info)]"
          loading={loading}
        />
        <StatCard
          label={t("carWash.stats.avgExtDuration")}
          value={formatDuration(summary?.avgExtSeconds ?? 0)}
          Icon={Clock}
          accent="text-primary"
          loading={loading}
        />
        <StatCard
          label={t("carWash.stats.avgIntDuration")}
          value={formatDuration(summary?.avgIntSeconds ?? 0)}
          Icon={Timer}
          accent="text-foreground"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Donut — service breakdown */}
        <Card className="p-5">
          <h2 className="text-base font-semibold">
            {t("carWash.analytics.serviceBreakdown")}
          </h2>
          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : donutData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("carWash.analytics.noData", "No data for this period")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {donutData.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
              {donutData.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Bar — vehicle classification */}
        <Card className="p-5">
          <h2 className="text-base font-semibold">
            {t("carWash.analytics.vehicleClassification")}
          </h2>
          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : classification.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t("carWash.analytics.noData", "No data for this period")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classification}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="vehicleClass"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklch, var(--primary) 10%, transparent)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={120} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Vehicle log */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("carWash.analytics.vehicleLog")}</h2>
          <span className="text-xs text-muted-foreground">
            {t("carWash.analytics.records", { count: summary?.totalVehicles ?? vehicleLog.length })}
          </span>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("carWash.analytics.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.time")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.trackId")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.plate")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.class")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.service")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.extTime")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.intTime")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.totalTime")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("carWash.table.zones")}</th>
                <th className="px-3 py-2 text-end font-medium">{t("carWash.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={10} className="px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredLog.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                    {query
                      ? t("carWash.analytics.noResults")
                      : t("carWash.analytics.noData", "No data for this period")}
                  </td>
                </tr>
              ) : (
                filteredLog.map((v) => (
                  <tr key={v.id} data-testid="vehicle-row" className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium">{v.time}</td>
                    <td className="px-3 py-3 font-mono text-[var(--status-success)]">
                      {v.trackId ? `#${v.trackId}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-[var(--status-info)]">{v.plate}</td>
                    <td className="px-3 py-3">{v.vehicleClass}</td>
                    <td className="px-3 py-3">
                      <ServicePill service={v.service} />
                    </td>
                    <td className="px-3 py-3">{formatDuration(v.extSeconds)}</td>
                    <td className="px-3 py-3">{formatDuration(v.intSeconds)}</td>
                    <td className="px-3 py-3 font-semibold">
                      {formatDuration(v.extSeconds + v.intSeconds)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {v.zones.join(", ")}
                    </td>
                    <td className="px-3 py-3 text-end">
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="me-1 h-3.5 w-3.5" />
                        {t("common.delete")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
