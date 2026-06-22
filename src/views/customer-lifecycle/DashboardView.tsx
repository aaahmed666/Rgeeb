"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  CalendarClock,
  Building,
  Camera,
  Cpu,
  Plug,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  Gauge,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  fetchDashboardStats,
  fetchCustomerGrowth,
  fetchSubscriptionTiers,
  fetchStatusDistribution,
  fetchOnboardingEfficiency,
  fetchCustomerDistribution,
  fetchLifecycleStatus,
} from "@/services/customerLifecycleMockService";
import type {
  DashboardStats,
  GrowthDataPoint,
  SubscriptionTier,
  StatusDistribution,
  OnboardingEfficiency,
  CustomerDistribution,
  LifecycleStatusItem,
} from "@/services/customerLifecycleMockService";

/* ── Trend icon helper ──────────────────────────────────────────────────── */

function TrendBadge({ value, label }: { value?: number; label?: string }) {
  if (value === undefined && !label) return null;
  const isUp = (value ?? 0) > 0;
  const isFlat = (value ?? 0) === 0;
  const Icon = isUp ? TrendingUp : isFlat ? Minus : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        isUp && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        !isUp && !isFlat && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
        isFlat && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      {value !== undefined ? `${Math.abs(value)}%` : ""}
      {label && <span className="ml-0.5">{label}</span>}
    </span>
  );
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
  isLoading?: boolean;
}

function KpiCard({ title, value, icon: Icon, trend, trendLabel, iconBg, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="mt-3 h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              iconBg ?? "bg-primary/10"
            )}
          >
            <Icon className={cn("h-5 w-5", iconBg ? "text-white" : "text-primary")} />
          </div>
        </div>
        <div className="mt-2">
          <TrendBadge value={trend} label={trendLabel} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Custom Tooltip for Charts ──────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-primary">{payload[0].value.toLocaleString()} customers</p>
    </div>
  );
}

/* ── Error State ────────────────────────────────────────────────────────── */

function DashboardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
      <h3 className="text-sm font-semibold text-foreground">Failed to Load</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </Card>
  );
}

/* ── Main DashboardView ─────────────────────────────────────────────────── */

export default function DashboardView() {
  const statsQ = useQuery<DashboardStats>({
    queryKey: ["cl-dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });

  const growthQ = useQuery<GrowthDataPoint[]>({
    queryKey: ["cl-customer-growth"],
    queryFn: fetchCustomerGrowth,
    staleTime: 60_000,
  });

  const tiersQ = useQuery<SubscriptionTier[]>({
    queryKey: ["cl-subscription-tiers"],
    queryFn: fetchSubscriptionTiers,
    staleTime: 60_000,
  });

  const statusQ = useQuery<StatusDistribution[]>({
    queryKey: ["cl-status-distribution"],
    queryFn: fetchStatusDistribution,
    staleTime: 60_000,
  });

  const onboardingQ = useQuery<OnboardingEfficiency>({
    queryKey: ["cl-onboarding-efficiency"],
    queryFn: fetchOnboardingEfficiency,
    staleTime: 60_000,
  });

  const distributionQ = useQuery<CustomerDistribution[]>({
    queryKey: ["cl-customer-distribution"],
    queryFn: fetchCustomerDistribution,
    staleTime: 60_000,
  });

  const lifecycleQ = useQuery<LifecycleStatusItem[]>({
    queryKey: ["cl-lifecycle-status"],
    queryFn: fetchLifecycleStatus,
    staleTime: 60_000,
  });

  const s = statsQ.data;

  /* Handle global error state */
  if (statsQ.isError && growthQ.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <DashboardError
          message="Unable to load dashboard data. Please check your connection and try again."
          onRetry={() => {
            statsQ.refetch();
            growthQ.refetch();
            tiersQ.refetch();
            statusQ.refetch();
            onboardingQ.refetch();
            distributionQ.refetch();
            lifecycleQ.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Executive Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unified intelligence across all customer operations
        </p>
      </div>

      {/* ── KPI Cards — Row 1 (5 cards) ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Total Customers"
          value={s?.totalCustomers ?? 0}
          icon={Users}
          trend={s?.totalCustomersTrend}
          iconBg="bg-slate-800 dark:bg-slate-700"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="Active Customers"
          value={s?.activeCustomers ?? 0}
          icon={UserCheck}
          trend={s?.activeCustomersTrend}
          iconBg="bg-emerald-500"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="In Onboarding"
          value={s?.inOnboarding ?? 0}
          icon={UserPlus}
          trendLabel={s?.inOnboardingLabel}
          iconBg="bg-blue-500"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="Active Subscriptions"
          value={s?.activeSubscriptions ?? 0}
          icon={CreditCard}
          trend={s?.activeSubscriptionsTrend}
          iconBg="bg-violet-500"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="Upcoming Renewals"
          value={s?.upcomingRenewals ?? 0}
          icon={CalendarClock}
          trendLabel={s?.upcomingRenewalsLabel}
          iconBg="bg-amber-500"
          isLoading={statsQ.isLoading}
        />
      </div>

      {/* ── KPI Cards — Row 2 (4 cards) ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Branches"
          value={s?.totalBranches ?? 0}
          icon={Building}
          trend={s?.totalBranchesTrend}
          iconBg="bg-orange-500"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="Total Cameras"
          value={s?.totalCameras ?? 0}
          icon={Camera}
          trend={s?.totalCamerasTrend}
          iconBg="bg-purple-500"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="Active AI Services"
          value={s?.activeAiServices ?? 0}
          icon={Cpu}
          trend={s?.activeAiServicesTrend}
          iconBg="bg-cyan-500"
          isLoading={statsQ.isLoading}
        />
        <KpiCard
          title="Active Integrations"
          value={s?.activeIntegrations ?? 0}
          icon={Plug}
          trend={s?.activeIntegrationsTrend}
          iconBg="bg-teal-500"
          isLoading={statsQ.isLoading}
        />
      </div>

      {/* ── Charts Row 1: Customer Growth + Subscription Tiers ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Customer Growth</CardTitle>
                <p className="text-xs text-muted-foreground">Active subscription trend over the last 12 months</p>
              </div>
              <Badge variant="outline" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                12% Growth
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {growthQ.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : growthQ.isError ? (
              <DashboardError message="Failed to load growth chart" onRetry={() => growthQ.refetch()} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={growthQ.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a1f2e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a1f2e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    className="text-[11px] fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-[11px] fill-muted-foreground"
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#1a1f2e"
                    strokeWidth={2.5}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status (Tiers) Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Subscription Status</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution by plan type</p>
          </CardHeader>
          <CardContent>
            {tiersQ.isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : tiersQ.isError ? (
              <DashboardError message="Failed to load subscription data" onRetry={() => tiersQ.refetch()} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={tiersQ.data}
                    cx="50%"
                    cy="42%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {tiersQ.data?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text x="50%" y="40%" textAnchor="middle" className="fill-foreground text-xl font-bold">
                    1.4k
                  </text>
                  <text x="50%" y="48%" textAnchor="middle" className="fill-muted-foreground text-[10px]">
                    Total Users
                  </text>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", fontWeight: 500, paddingTop: "8px" }}
                    formatter={(value: string, entry: { payload?: { value?: number } }) => (
                      <span className="text-foreground">
                        {entry?.payload?.value}% {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: Customer Distribution + Lifecycle Status ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Distribution (by Industry) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Customer Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Segmentation by industry vertical</p>
          </CardHeader>
          <CardContent>
            {distributionQ.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : distributionQ.isError ? (
              <DashboardError message="Failed to load distribution data" onRetry={() => distributionQ.refetch()} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={distributionQ.data}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                    label={({ name, value }: { name: string; value: number }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {distributionQ.data?.map((entry, index) => (
                      <Cell key={`dist-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", fontWeight: 500 }}
                    formatter={(value: string) => (
                      <span className="text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lifecycle Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Lifecycle Status</CardTitle>
            <p className="text-xs text-muted-foreground">Current stage distribution across all customers</p>
          </CardHeader>
          <CardContent>
            {lifecycleQ.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : lifecycleQ.isError ? (
              <DashboardError message="Failed to load lifecycle data" onRetry={() => lifecycleQ.refetch()} />
            ) : (
              <div className="space-y-3.5">
                {lifecycleQ.data?.map((item) => (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-foreground">{item.stage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                        <span className="font-semibold text-foreground">{item.count}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row: Status Distribution + Onboarding Efficiency ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Current customer states</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusQ.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))
              : statusQ.isError
                ? <DashboardError message="Failed to load status data" onRetry={() => statusQ.refetch()} />
                : statusQ.data?.map((item) => {
                    const maxCount = Math.max(
                      ...(statusQ.data?.map((d) => d.count) ?? [1])
                    );
                    const pct = (item.count / maxCount) * 100;
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{item.label}</span>
                          <span className="font-semibold text-foreground">{item.count}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
          </CardContent>
        </Card>

        {/* Onboarding Efficiency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Onboarding Efficiency</CardTitle>
            <p className="text-xs text-muted-foreground">
              Average time to full deployment: {onboardingQ.data?.avgDays ?? "—"} days
            </p>
          </CardHeader>
          <CardContent>
            {onboardingQ.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="mx-auto h-36 w-36 rounded-full" />
                <Skeleton className="mx-auto h-4 w-40" />
              </div>
            ) : onboardingQ.isError ? (
              <DashboardError message="Failed to load onboarding data" onRetry={() => onboardingQ.refetch()} />
            ) : (
              <div className="flex flex-col items-center gap-4">
                {/* Gauge */}
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="10"
                      className="stroke-muted"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${((onboardingQ.data?.velocity ?? 0) / 100) * 264} 264`}
                      className="stroke-[#f97316] transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-foreground">
                      {onboardingQ.data?.velocity}%
                    </span>
                    <span className="text-xs text-muted-foreground">Velocity</span>
                  </div>
                </div>
                {/* Bottom label */}
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5">
                  <Gauge className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {onboardingQ.data?.trendLabel}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {onboardingQ.data?.trend} days faster than last month
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
