"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building,
  Camera,
  Cpu,
  Plug,
  TrendingUp,
  Zap,
  CheckCircle2,
  Pencil,
  Construction,
  PackagePlus,
  ArrowUpCircle,
  Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { fetchCustomerProfile } from "@/services/customerLifecycleMockService";
import type { CustomerProfile, ActivityEvent } from "@/services/customerLifecycleMockService";

/* ── Status styling ─────────────────────────────────────────────────────── */

const SUBSCRIPTION_STATUS_STYLES: Record<CustomerProfile["subscription"]["status"], string> = {
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  Warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  Expired: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

const ACTIVITY_DOT: Record<ActivityEvent["type"], string> = {
  asset: "bg-emerald-500",
  integration: "bg-indigo-500",
  ai: "bg-amber-500",
  subscription: "bg-primary",
  system: "bg-slate-500",
  training: "bg-blue-500",
  account: "bg-purple-500",
};

/* ── Sub-components ─────────────────────────────────────────────────────── */

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendTone = "muted",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  trend: string;
  trendTone?: "positive" | "muted";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <span
            className={cn(
              "text-xs font-semibold",
              trendTone === "positive" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          >
            {trend}
          </span>
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </CardContent>
    </Card>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{label}</EmptyTitle>
          <EmptyDescription>
            This tab is part of a later phase and is not available yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

/* ── Loading skeleton ───────────────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Skeleton className="h-[520px] w-full rounded-xl" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Main view ──────────────────────────────────────────────────────────── */

const PROFILE_TABS = [
  "Overview",
  "Branches",
  "Cameras",
  "AI Services",
  "Modules",
  "Integrations",
  "Timeline",
] as const;

export default function CustomerProfileView() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  const profileQ = useQuery<CustomerProfile>({
    queryKey: ["cl-customer-profile", id],
    queryFn: () => fetchCustomerProfile(id),
    staleTime: 30_000,
  });

  const data = profileQ.data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Breadcrumb ── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/customer-lifecycle">Customer Lifecycle</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/customer-lifecycle/customers">Customers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Customer Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {profileQ.isLoading && <ProfileSkeleton />}

      {profileQ.isError && (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Empty className="max-w-md">
            <EmptyHeader>
              <EmptyTitle>Failed to load customer profile</EmptyTitle>
              <EmptyDescription>
                Something went wrong while loading this customer.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={() => profileQ.refetch()}>
              Try again
            </Button>
          </Empty>
        </div>
      )}

      {data && (
        <Tabs defaultValue="Overview" className="space-y-6">
          <TabsList className="h-auto flex-wrap">
            {PROFILE_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Overview" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* ── Left column ── */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                      {data.initials}
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-foreground">{data.name}</h2>
                    <Badge
                      variant="outline"
                      className="mt-2 border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                    >
                      {data.tier}
                    </Badge>

                    <Separator className="my-5" />

                    <div className="space-y-4 text-left">
                      <InfoField label="Customer ID" value={data.customerId} />
                      <InfoField label="Industry" value={data.industry} />
                      <InfoField label="Region" value={data.region} />
                    </div>

                    <Button className="mt-5 w-full gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Annual Recurring Revenue
                      </p>
                      <p className="text-lg font-bold text-foreground">{data.annualRevenue}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Health Score
                      </p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {data.healthScore}/100
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Main column ── */}
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    icon={Building}
                    label="Total Branches"
                    value={data.totalBranches}
                    trend={data.totalBranchesTrend}
                    trendTone="positive"
                  />
                  <KpiCard
                    icon={Camera}
                    label="Total Cameras"
                    value={data.totalCameras}
                    trend={data.totalCamerasLabel}
                  />
                  <KpiCard
                    icon={Cpu}
                    label="AI Services"
                    value={data.aiServices}
                    trend={data.aiServicesTrend}
                    trendTone="positive"
                  />
                  <KpiCard
                    icon={Plug}
                    label="Active Integrations"
                    value={data.activeIntegrations}
                    trend={data.activeIntegrationsLabel}
                    trendTone="positive"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Company Information */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">Company Information</h3>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <InfoField label="Legal Name" value={data.companyInfo.legalName} />
                        <InfoField label="Business Type" value={data.companyInfo.businessType} />
                        <InfoField label="Account Manager" value={data.companyInfo.accountManager} />
                        <InfoField label="Primary Contact" value={data.companyInfo.primaryContact} />
                      </div>
                      <InfoField label="Headquarters Address" value={data.companyInfo.headquartersAddress} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-border p-3">
                          <InfoField label="Primary Phone" value={data.companyInfo.primaryPhone} />
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <InfoField label="Support SLA" value={data.companyInfo.supportSla} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription Status */}
                  <Card className="overflow-hidden border-slate-800 bg-slate-900 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h3 className="text-lg font-bold">Subscription Status</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase",
                          SUBSCRIPTION_STATUS_STYLES[data.subscription.status]
                        )}
                      >
                        {data.subscription.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Current Plan
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold">{data.subscription.plan}</p>
                          <span className="text-xs text-slate-400">{data.subscription.planEdition}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Start Date</span>
                        <span className="font-medium">{data.subscription.startDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Renewal Date</span>
                        <span className="font-medium text-amber-400">{data.subscription.renewalDate}</span>
                      </div>

                      <div className="space-y-1.5">
                        <Progress
                          value={Math.min(100, Math.max(0, (data.subscription.daysRemaining / 365) * 100))}
                          className="h-2"
                        />
                        <p className="text-xs text-slate-400">
                          {data.subscription.daysRemaining} days remaining in current cycle
                        </p>
                      </div>

                      <Separator className="bg-slate-700" />

                      <ul className="space-y-2">
                        {data.subscription.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="gap-1.5">
                          <PackagePlus className="h-4 w-4" />
                          Manage Billing
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-slate-50"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          Upgrade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Key Contacts */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-lg font-bold text-foreground">Key Contacts</h3>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.contacts?.map((contact, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-border last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.role}</p>
                          </div>
                          <div className="text-left sm:text-right text-xs">
                            <p className="text-foreground">{contact.email}</p>
                            <p className="text-muted-foreground">{contact.phone}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recent Account Activity */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">Recent Account Activity</h3>
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                        <Link href="/dashboard/customer-lifecycle/lifecycle">View All Timeline</Link>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-5">
                        {data.recentActivity.map((event, i) => (
                          <li key={event.id} className="relative flex gap-4">
                            <div className="flex flex-col items-center">
                              <span
                                className={cn(
                                  "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                                  ACTIVITY_DOT[event.type]
                                )}
                              >
                                <span className="h-2 w-2 rounded-full bg-white" />
                              </span>
                              {i < data.recentActivity.length - 1 && (
                                <span className="mt-1 w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-foreground">{event.title}</p>
                                <span className="shrink-0 text-xs text-muted-foreground">{event.date}</span>
                              </div>
                              <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {PROFILE_TABS.filter((t) => t !== "Overview").map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <ComingSoonTab label={tab} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
