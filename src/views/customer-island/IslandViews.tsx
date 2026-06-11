"use client";

/**
 * Customer Island views — parity port of the OLD project's
 * pages/apps/customer-island/* (Materio/MUI/Redux) into the NEW stack
 * (App Router, shadcn, recharts, islandService).
 *
 * Every page replicates the old behavior:
 *  - filters (from/to/branch_id) read from the URL query string
 *  - load on mount and whenever the query filters change
 *  - loading skeletons per KPI / chart
 *  - error alert with the API message
 *  - same calculations (formatResponseTime, percentages, hour buckets)
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Clock3,
  ShieldAlert,
  ShoppingCart,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import IslandHeader, {
  useIslandFilters,
} from "@/components/customer-island/IslandHeader";
import {
  formatResponseTime,
  islandService,
  type IslandConversionData,
  type IslandDashboardData,
  type IslandPresenceData,
  type IslandResponseTimeData,
  type IslandTrafficData,
} from "@/services/islandService";

/* ─── Shared plumbing ──────────────────────────────────────────────────── */

export function useIslandData<T>(
  fetcher: (f: { from?: string; to?: string; branch_id?: string }) => Promise<T>
) {
  const filters = useIslandFilters();
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher(filters));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.branch_id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, load, filters };
}

export function IslandGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  if (!hasPermission("island")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">
          {t("errors.unauthorized", "Access Denied")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("common.noPermission", "You don't have permission to view this page.")}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

export function IslandError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

/* ─── 1. Island Dashboard — six gradient KPI cards ─────────────────────── */

const KPI_DEFS: Array<{
  key: keyof IslandDashboardData;
  labelKey: string;
  fallback: string;
  gradient: string;
  icon: React.ElementType;
  format?: (v: number) => string;
}> = [
  { key: "total_passers", labelKey: "island.kpi.passers", fallback: "Total Passers", gradient: "linear-gradient(135deg, #4f46e5, #3b82f6)", icon: Users },
  { key: "total_stoppers", labelKey: "island.kpi.stoppers", fallback: "Total Stoppers", gradient: "linear-gradient(135deg, #10b981, #059669)", icon: UserMinus },
  { key: "total_buyers", labelKey: "island.kpi.buyers", fallback: "Total Buyers", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", icon: ShoppingCart },
  { key: "avg_response_time", labelKey: "island.kpi.avgResponse", fallback: "Average Response Time", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", icon: Clock3, format: formatResponseTime },
  { key: "presence_percentage", labelKey: "island.kpi.presence", fallback: "Presence Percentage", gradient: "linear-gradient(135deg, #a855f7, #9333ea)", icon: UserCheck, format: (v) => `${v ?? 0}%` },
  { key: "total_violations", labelKey: "island.kpi.violations", fallback: "Total Violations", gradient: "linear-gradient(135deg, #ef4444, #dc2626)", icon: AlertTriangle },
];

export function IslandDashboardView() {
  const { t } = useTranslation();
  const { data, loading, error, load } = useIslandData<IslandDashboardData>(
    (f) => islandService.dashboard(f)
  );

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KPI_DEFS.map(({ key, labelKey, fallback, gradient, icon: Icon, format }) => {
            const raw = data?.[key] ?? 0;
            const display = format
              ? format(Number(raw))
              : Number(raw).toLocaleString();
            return (
              <div
                key={key}
                className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md transition-transform hover:-translate-y-1"
                style={{ background: gradient }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                  {t(labelKey, fallback)}
                </p>
                {loading ? (
                  <Skeleton className="mt-2 h-10 w-28 bg-white/25" />
                ) : (
                  <p className="mt-1 text-3xl font-extrabold">{display}</p>
                )}
                <Icon className="absolute bottom-3 end-4 h-12 w-12 opacity-15" />
                <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
              </div>
            );
          })}
        </div>
      </div>
    </IslandGuard>
  );
}

/* ─── 2. Traffic Analytics — hourly passers/stoppers + attraction rate ─── */

export function IslandTrafficView() {
  const { t } = useTranslation();
  const { data, loading, error, load } = useIslandData<IslandTrafficData>((f) =>
    islandService.traffic(f)
  );

  const chart = React.useMemo(() => {
    const byHour = new Map<number, { hour: string; passers: number; stoppers: number; rate: number }>();
    for (let h = 0; h < 24; h++)
      byHour.set(h, { hour: hourLabel(h), passers: 0, stoppers: 0, rate: 0 });
    for (const p of data?.hourly_passers ?? [])
      byHour.get(p.hour)!.passers = p.count;
    for (const s of data?.hourly_stoppers ?? [])
      byHour.get(s.hour)!.stoppers = s.count;
    for (const r of data?.attraction_rates ?? [])
      byHour.get(r.hour)!.rate = r.rate;
    return Array.from(byHour.values());
  }, [data]);

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("island.traffic.title", "Hourly Traffic & Attraction Rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hour" fontSize={11} interval={2} />
                  <YAxis yAxisId="left" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" fontSize={11} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="passers" name={t("island.traffic.passers", "Passers")} fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="left" dataKey="stoppers" name={t("island.traffic.stoppers", "Stoppers")} fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="rate" name={t("island.traffic.attractionRate", "Attraction Rate")} stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </IslandGuard>
  );
}

/* ─── 3. Conversion Funnel — passers → stoppers → buyers ───────────────── */

export function IslandConversionView() {
  const { t } = useTranslation();
  const { data, loading, error, load } = useIslandData<IslandConversionData>(
    (f) => islandService.conversion(f)
  );

  const stages = [
    { label: t("island.conversion.passers", "Passers"), value: data?.passers ?? 0, pct: 100, color: "#3b82f6" },
    { label: t("island.conversion.stoppers", "Stoppers"), value: data?.stoppers ?? 0, pct: data?.stoppers_percentage ?? 0, color: "#10b981" },
    { label: t("island.conversion.buyers", "Buyers"), value: data?.buyers ?? 0, pct: data?.buyers_percentage ?? 0, color: "#f59e0b" },
  ];

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("island.conversion.title", "Conversion Funnel")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              stages.map((s, i) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.value.toLocaleString()} · {Number(s.pct).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-9 w-full overflow-hidden rounded-lg bg-muted">
                    <div
                      className="flex h-full items-center rounded-lg px-3 text-xs font-semibold text-white transition-all"
                      style={{
                        width: `${Math.max(Number(s.pct), 4)}%`,
                        background: s.color,
                        marginInlineStart: `${i * 4}%`,
                      }}
                    >
                      {Number(s.pct).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </IslandGuard>
  );
}

/* ─── 4. Employee Presence — 24h present/absent timeline ───────────────── */

export function IslandPresenceView() {
  const { t } = useTranslation();
  const { data, loading, error, load } = useIslandData<IslandPresenceData>(
    (f) => islandService.employeePresence(f)
  );

  const byHour = React.useMemo(() => {
    const m = new Map<number, "present" | "absent" | "unknown">();
    for (let h = 0; h < 24; h++) m.set(h, "unknown");
    for (const p of data?.timeline ?? []) m.set(p.hour, p.status);
    return m;
  }, [data]);

  const presentHours = Array.from(byHour.values()).filter((s) => s === "present").length;

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("island.presence.title", "Employee Presence Timeline")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="grid grid-cols-12 gap-1 sm:grid-cols-24">
                  {Array.from(byHour.entries()).map(([h, status]) => (
                    <div key={h} className="flex flex-col items-center gap-1">
                      <div
                        title={`${hourLabel(h)} — ${status}`}
                        className={
                          "h-10 w-full rounded " +
                          (status === "present"
                            ? "bg-emerald-500"
                            : status === "absent"
                              ? "bg-rose-400"
                              : "bg-muted")
                        }
                      />
                      <span className="text-[10px] text-muted-foreground">{h}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500" />
                    {t("island.presence.present", "Present")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-rose-400" />
                    {t("island.presence.absent", "Absent")}
                  </span>
                  <span className="ms-auto font-medium text-foreground">
                    {t("island.presence.coverage", "Coverage")}: {presentHours}/24h
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </IslandGuard>
  );
}

/* ─── 5. Response Time — avg / min / max hourly lines ──────────────────── */

export function IslandResponseTimeView() {
  const { t } = useTranslation();
  const { data, loading, error, load } =
    useIslandData<IslandResponseTimeData>((f) => islandService.responseTime(f));

  const chart = React.useMemo(() => {
    const byHour = new Map<number, { hour: string; avg: number; min: number; max: number }>();
    for (let h = 0; h < 24; h++)
      byHour.set(h, { hour: hourLabel(h), avg: 0, min: 0, max: 0 });
    for (const p of data?.hourly_avg_response_time ?? []) byHour.get(p.hour)!.avg = p.value;
    for (const p of data?.hourly_min_response_time ?? []) byHour.get(p.hour)!.min = p.value;
    for (const p of data?.hourly_max_response_time ?? []) byHour.get(p.hour)!.max = p.value;
    return Array.from(byHour.values());
  }, [data]);

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("island.responseTime.title", "Hourly Response Time (seconds)")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hour" fontSize={11} interval={2} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: number) => formatResponseTime(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="avg" name={t("island.responseTime.avg", "Average")} stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="min" name={t("island.responseTime.min", "Min")} stroke="#10b981" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="max" name={t("island.responseTime.max", "Max")} stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </IslandGuard>
  );
}

/* ─── 6. Demographics — gender pie + age groups ────────────────────────── */

const AGE_KEYS = ["0-18", "19-25", "26-35", "36-45", "46+"] as const;
const AGE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444"];

export function IslandDemographicsView() {
  const { t } = useTranslation();
  const { data, loading, error, load } = useIslandData(
    (f) => islandService.demographics(f)
  );

  const genderData = [
    { name: t("island.demographics.male", "Male"), value: data?.gender?.male ?? 0, color: "#3b82f6" },
    { name: t("island.demographics.female", "Female"), value: data?.gender?.female ?? 0, color: "#ec4899" },
  ];
  const ageData = AGE_KEYS.map((k, i) => ({
    name: k,
    value: data?.age_groups?.[k] ?? 0,
    color: AGE_COLORS[i],
  }));

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.demographics.gender", "Gender Distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {genderData.map((g) => (
                        <Cell key={g.name} fill={g.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.demographics.ageGroups", "Age Groups")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" name={t("island.demographics.visitors", "Visitors")} radius={[4, 4, 0, 0]}>
                      {ageData.map((a) => (
                        <Cell key={a.name} fill={a.color} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </IslandGuard>
  );
}
