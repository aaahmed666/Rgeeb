"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import {
  BarChart3,
  Calculator,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Users,
  Loader2,
  ShieldAlert,
  PlugZap,
  AlertTriangle,
} from "lucide-react";
import type { DateRange } from "rsuite/DateRangePicker";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import { cn, toLocalISODate } from "@/lib/utils";
import {
  fetchReport,
  type ReportPayload,
  type ReportTab,
} from "@/services/reportsService";

type Preset = "7d" | "30d" | "month" | "year";

function toISO(d: Date) {
  return toLocalISODate(d);
}

function rangeFor(preset: Preset): [Date, Date] {
  const now = new Date();
  // Ensure end date is never in the future
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);
  const cap = (d: Date): Date => (d > today ? today : d);

  if (preset === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return [d, cap(now)];
  }
  if (preset === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return [d, cap(now)];
  }
  if (preset === "month") {
    return [new Date(now.getFullYear(), now.getMonth(), 1), cap(now)];
  }
  return [new Date(now.getFullYear(), 0, 1), cap(now)];
}

const TABS: {
  key: ReportTab;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "customers", icon: Users },
  { key: "suppliers", icon: Truck },
  { key: "sales", icon: BarChart3 },
  { key: "purchases", icon: ShoppingCart },
  { key: "inventory", icon: Package },
  { key: "financials", icon: Calculator },
];

const PRESETS: [Preset, string][] = [
  ["7d", "Last 7 Days"],
  ["30d", "Last 30 Days"],
  ["month", "This Month"],
  ["year", "This Year"],
];

export default function StatisticsView() {
  const { t } = useTranslation();
  const { hasPermission, user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | null>(rangeFor("30d"));
  const [activePreset, setActivePreset] = useState<Preset>("30d");
  const [tab, setTab] = useState<ReportTab>("customers");
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const today = toISO(new Date());
  const from = dateRange ? toISO(dateRange[0]) : "";
  // Cap end date to today — never allow future dates to be sent to the API
  const to = dateRange ? (toISO(dateRange[1]) > today ? today : toISO(dateRange[1])) : "";
  const canFetch = useMemo(() => Boolean(from && to && from <= to), [from, to]);

  const load = useCallback(
    async (which: ReportTab) => {
      if (!canFetch) return;
      setLoading(true);
      setLoadError(null);
      try {
        const r = await fetchReport(which, { dateFrom: from, dateTo: to });
        setData(r);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : t("errors.somethingWentWrong", "Something went wrong"));
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [canFetch, from, to, t]
  );

  // Auto-load when date range or tab changes
  useEffect(() => {
    if (canFetch) {
      void load(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, from, to]);

  const applyPreset = (p: Preset) => {
    setActivePreset(p);
    setDateRange(rangeFor(p));
    // Note: the useEffect above will fire automatically when from/to change
  };

  // Read guard handled via auth aliases — isAdmin bypasses all

  // Fatoorah connection gate (parity with old Overview page): reports can only
  // be fetched when the account has a Fatoorah client id.
  const hasFatoorahId = useMemo(() => {
    if (user?.fatoorahClientId != null && user.fatoorahClientId !== "") {
      return true;
    }
    // Fallback: read the raw stored profile in case the field wasn't mapped.
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("app.auth.user") ??
            window.sessionStorage.getItem("app.auth.user")
          : null;
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const fid =
        parsed.fatoorahClientId ?? parsed.fatoorah_client_id ?? null;
      return fid != null && fid !== "";
    } catch {
      return false;
    }
  }, [user?.fatoorahClientId]);

  // Permission read guard
  if (!hasPermission("statistics")) {
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
      {/* Page header */}
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold sm:text-xl">
            {t("reports.title", "Reports Overview")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "reports.subtitle",
              "Comprehensive financial analytics powered by Fatoorah"
            )}
          </p>
        </div>
      </header>

      {/* Error banner */}
      {loadError && !loading && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <button onClick={() => void load(tab)} className="ml-4 rounded-md bg-destructive/20 px-3 py-1 text-xs font-medium hover:bg-destructive/30">
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* Fatoorah not connected — gate (matches old Overview page) */}
      {!hasFatoorahId ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-amber-400/40 bg-gradient-to-br from-amber-400/15 to-amber-400/5 text-amber-500">
              <PlugZap className="h-11 w-11" />
            </div>
            <h2 className="mb-2 text-lg font-bold">
              {t("reports.fatoorahNotConnected", "Fatoorah Not Connected")}
            </h2>
            <p className="mb-5 max-w-md text-sm text-muted-foreground">
              {t(
                "reports.fatoorahConnectHint",
                "Please connect your Fatoorah account to fetch financial reports. Go to Settings → Fatoorah Integration to link your account."
              )}
            </p>
            <div className="flex max-w-lg items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-start text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                {t(
                  "reports.fatoorahNoClientId",
                  "Your account does not have a Fatoorah Client ID. Reports cannot be loaded until you connect."
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filter card — all controls in ONE row */}
          <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick presets */}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
              {t("reports.quick", "Quick")}:
            </span>
            {PRESETS.map(([k, label]) => (
              <Button
                key={k}
                size="sm"
                variant={activePreset === k ? "default" : "outline"}
                className={cn(
                  "rounded-full transition-all shrink-0",
                  activePreset === k && "shadow-sm shadow-primary/30"
                )}
                onClick={() => applyPreset(k)}
              >
                {t(
                  `reports.${k === "7d" ? "last7" : k === "30d" ? "last30" : k === "month" ? "thisMonth" : "thisYear"}`,
                  label
                )}
              </Button>
            ))}
            {/* Divider */}
            <span className="h-6 w-px bg-border shrink-0 hidden sm:block" />
            {/* Date range picker */}
            <div className="flex-1 min-w-[220px]">
              <SharedDateRangePicker
                value={dateRange}
                onChange={(val) => {
                  setDateRange(val);
                  setActivePreset("" as Preset);
                }}
              />
            </div>
            {/* Fetch button */}
            <Button
              disabled={!canFetch || loading}
              onClick={() => load(tab)}
              className="gap-2 px-5 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {t("reports.fetch", "Fetch Reports")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as ReportTab)}
          >
            <div className="border-b px-2 sm:px-4">
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
                {TABS.map(({ key, icon: Icon }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <Icon className="h-4 w-4" />
                    {t(
                      `reports.tabs.${key}`,
                      key.charAt(0).toUpperCase() + key.slice(1)
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <Loader2 className="me-2 h-5 w-5 animate-spin" />
                  {t("reports.loading", "Loading…")}
                </div>
              ) : !data ? (
                <EmptyState
                  title={t(
                    "reports.emptyTitle",
                    "Select a date range to view reports"
                  )}
                  description={t(
                    "reports.emptyDesc",
                    "Choose start and end dates, then click Fetch Reports"
                  )}
                />
              ) : (
                <ReportContent data={data} />
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}

function ReportContent({ data }: { data: ReportPayload }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums">
              {m.value}
            </div>
            {typeof m.trend === "number" && (
              <div
                className={cn(
                  "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                  m.trend >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                {m.trend >= 0 ? "+" : ""}
                {m.trend}%
              </div>
            )}
          </div>
        ))}
      </div>

      <DataTable
        data={data.rows.map((r, i) => ({ id: i, ...r }))}
        emptyMessage="No data"
        columns={data.columns.map((c) => ({
          key: c.key,
          header: c.label,
          render: (row: any) => row[c.key] ?? "—",
        }))}
      />
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/30">
        <TrendingUp className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
