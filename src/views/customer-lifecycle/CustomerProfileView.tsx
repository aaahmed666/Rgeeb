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
import { useTranslation } from "react-i18next";

import { fetchCustomerProfile } from "@/services/customerLifecycleMockService";
import type { CustomerProfile, ActivityEvent } from "@/services/customerLifecycleMockService";

/* ── Status styling ─────────────────────────────────────────────────────── */

const SUBSCRIPTION_STATUS_STYLES: Record<CustomerProfile["subscription"]["status"], string> = {
  Active: "bg-[var(--status-success)]/15 text-[var(--status-success)] border-[var(--status-success)]/30",
  Warning: "bg-[var(--status-warning)]/15 text-[var(--status-warning)] border-[var(--status-warning)]/30",
  Expired: "bg-[var(--status-danger)]/15 text-[var(--status-danger)] border-[var(--status-danger)]/30",
};

const ACTIVITY_DOT: Record<ActivityEvent["type"], string> = {
  asset: "bg-[var(--status-success)]",
  integration: "bg-[var(--status-info)]",
  ai: "bg-[var(--status-warning)]",
  subscription: "bg-primary",
  system: "bg-muted",
  training: "bg-[var(--status-info)]",
  account: "bg-[var(--chart-5)]",
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
              trendTone === "positive" ? "text-[var(--status-success)]" : "text-muted-foreground"
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
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{label}</EmptyTitle>
          <EmptyDescription>
            {t("customerLifecycle.cp.tabComingSoon", "This tab is part of a later phase and is not available yet.")}
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
  const { t } = useTranslation();
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
              <Link href="/dashboard/customer-lifecycle">{t("customerLifecycle.title", "Customer Lifecycle")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/customer-lifecycle/customers">{t("customerLifecycle.customers", "Customers")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("customerLifecycle.cp.title", "Customer Profile")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {profileQ.isLoading && <ProfileSkeleton />}

      {profileQ.isError && (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Empty className="max-w-md">
            <EmptyHeader>
              <EmptyTitle>{t("customerLifecycle.cp.errTitle", "Failed to load customer profile")}</EmptyTitle>
              <EmptyDescription>
                {t("customerLifecycle.cp.errDesc", "Something went wrong while loading this customer.")}
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={() => profileQ.refetch()}>
              {t("customerLifecycle.common.tryAgain", "Try again")}
            </Button>
          </Empty>
        </div>
      )}

      {data && (
        <Tabs defaultValue="Overview" className="space-y-6">
          <TabsList className="h-auto flex-wrap">
            {PROFILE_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs">
                {t("customerLifecycle.cp.tab." + tab.replace(/\s+/g, "").toLowerCase(), tab)}
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
                      className="mt-2 border-[var(--status-success)] bg-[var(--status-success)]/10 text-[var(--status-success)] dark:border-[var(--status-success)] dark:text-[var(--status-success)]"
                    >
                      {data.tier}
                    </Badge>

                    <Separator className="my-5" />

                    <div className="space-y-4 text-start">
                      <InfoField label={t("customerLifecycle.cp.customerId", "Customer ID")} value={data.customerId} />
                      <InfoField label={t("customerLifecycle.cp.industry", "Industry")} value={data.industry} />
                      <InfoField label={t("customerLifecycle.cp.region", "Region")} value={data.region} />
                    </div>

                    <Button className="mt-5 w-full gap-2">
                      <Pencil className="h-4 w-4" />
                      {t("customerLifecycle.cp.editProfile", "Edit Profile")}
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
                        {t("customerLifecycle.cp.arr", "Annual Recurring Revenue")}
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
                        {t("customerLifecycle.cp.healthScore", "Health Score")}
                      </p>
                      <p className="text-lg font-bold text-[var(--status-success)]">
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
                    label={t("customerLifecycle.cp.totalBranches", "Total Branches")}
                    value={data.totalBranches}
                    trend={data.totalBranchesTrend}
                    trendTone="positive"
                  />
                  <KpiCard
                    icon={Camera}
                    label={t("customerLifecycle.cp.totalCameras", "Total Cameras")}
                    value={data.totalCameras}
                    trend={data.totalCamerasLabel}
                  />
                  <KpiCard
                    icon={Cpu}
                    label={t("customerLifecycle.cp.aiServices", "AI Services")}
                    value={data.aiServices}
                    trend={data.aiServicesTrend}
                    trendTone="positive"
                  />
                  <KpiCard
                    icon={Plug}
                    label={t("customerLifecycle.cp.activeIntegrations", "Active Integrations")}
                    value={data.activeIntegrations}
                    trend={data.activeIntegrationsLabel}
                    trendTone="positive"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Company Information */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">{t("customerLifecycle.cp.companyInfo", "Company Information")}</h3>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <InfoField label={t("customerLifecycle.cp.legalName", "Legal Name")} value={data.companyInfo.legalName} />
                        <InfoField label={t("customerLifecycle.cp.businessType", "Business Type")} value={data.companyInfo.businessType} />
                        <InfoField label={t("customerLifecycle.cp.accountManager", "Account Manager")} value={data.companyInfo.accountManager} />
                        <InfoField label={t("customerLifecycle.cp.primaryContact", "Primary Contact")} value={data.companyInfo.primaryContact} />
                      </div>
                      <InfoField label={t("customerLifecycle.cp.hqAddress", "Headquarters Address")} value={data.companyInfo.headquartersAddress} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-border p-3">
                          <InfoField label={t("customerLifecycle.cp.primaryPhone", "Primary Phone")} value={data.companyInfo.primaryPhone} />
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <InfoField label={t("customerLifecycle.cp.supportSla", "Support SLA")} value={data.companyInfo.supportSla} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription Status — emphasized navy panel per design */}
                  <Card className="overflow-hidden border-sidebar-border bg-sidebar text-sidebar-foreground">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h3 className="text-lg font-bold">{t("customerLifecycle.cp.subscriptionStatus", "Subscription Status")}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase",
                          SUBSCRIPTION_STATUS_STYLES[data.subscription.status]
                        )}
                      >
                        {t("customerLifecycle.status." + data.subscription.status.toLowerCase(), data.subscription.status)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                          {t("customerLifecycle.cp.currentPlan", "Current Plan")}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold">{data.subscription.plan}</p>
                          <span className="text-xs text-sidebar-foreground/60">{data.subscription.planEdition}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-sidebar-foreground/60">{t("customerLifecycle.cp.startDate", "Start Date")}</span>
                        <span className="font-medium">{data.subscription.startDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-sidebar-foreground/60">{t("customerLifecycle.cp.renewalDate", "Renewal Date")}</span>
                        <span className="font-medium text-[var(--status-warning)]">{data.subscription.renewalDate}</span>
                      </div>

                      <div className="space-y-1.5">
                        <Progress
                          value={Math.min(100, Math.max(0, (data.subscription.daysRemaining / 365) * 100))}
                          className="h-2 bg-sidebar-foreground/15"
                        />
                        <p className="text-xs text-sidebar-foreground/60">
                          {t("customerLifecycle.cp.daysRemaining", "{{n}} days remaining in current cycle", { n: data.subscription.daysRemaining })}
                        </p>
                      </div>

                      <Separator className="bg-sidebar-foreground/15" />

                      <ul className="space-y-2">
                        {data.subscription.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--status-success)]" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="gap-1.5">
                          <PackagePlus className="h-4 w-4" />
                          {t("customerLifecycle.cp.manageBilling", "Manage Billing")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-sidebar-foreground/20 bg-transparent text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          {t("customerLifecycle.cp.upgrade", "Upgrade")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Key Contacts */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <h3 className="text-lg font-bold text-foreground">{t("customerLifecycle.cp.keyContacts", "Key Contacts")}</h3>
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
                          <div className="text-start sm:text-end text-xs">
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
                      <h3 className="text-lg font-bold text-foreground">{t("customerLifecycle.cp.recentActivity", "Recent Account Activity")}</h3>
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                        <Link href="/dashboard/customer-lifecycle/lifecycle">{t("customerLifecycle.cp.viewAllTimeline", "View All Timeline")}</Link>
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

          {PROFILE_TABS.filter((tab) => tab !== "Overview").map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <ComingSoonTab label={tab} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
