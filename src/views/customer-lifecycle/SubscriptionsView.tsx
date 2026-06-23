"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Settings, HardDrive, FileText, TrendingUp, AlertCircle, Edit, Bolt, Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { fetchSubscriptionOverview } from "@/services/customerLifecycleMockService";
import type {
  SubscriptionOverview,
  AiServiceLog,
} from "@/services/customerLifecycleMockService";

/* ── Status badge helper ────────────────────────────────────────────────── */

const AI_STATUS_STYLES: Record<string, string> = {
  Stable: "bg-[var(--status-success)]/10 text-[var(--status-success)]",
  Throttled: "bg-[var(--status-warning)]/10 text-[var(--status-warning)]",
  Error: "bg-[var(--status-danger)]/10 text-[var(--status-danger)]",
};

/* ── Main SubscriptionsView ─────────────────────────────────────────────── */

export default function SubscriptionsView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "RGE-10293";

  const subQ = useQuery<SubscriptionOverview>({
    queryKey: ["cl-subscription-overview", id],
    queryFn: () => fetchSubscriptionOverview(id),
    staleTime: 30_000,
  });

  const data = subQ.data;

  const aiLogColumns: DataTableColumn<AiServiceLog>[] = useMemo(
    () => [
      {
        key: "serviceName",
        header: t("customerLifecycle.sub.serviceName", "Service Name"),
        render: (row) => (
          <span className="text-sm font-semibold text-primary">{row.serviceName}</span>
        ),
      },
      {
        key: "unitCost",
        header: t("customerLifecycle.sub.unitCost", "Unit Cost"),
        render: (row) => (
          <span className="text-sm text-muted-foreground">{row.unitCost}</span>
        ),
        headClassName: "text-end",
        cellClassName: "text-end font-mono",
      },
      {
        key: "callsLast24h",
        header: t("customerLifecycle.sub.calls24h", "Calls (Last 24h)"),
        render: (row) => (
          <span className="text-sm font-semibold text-foreground">
            {row.callsLast24h.toLocaleString()}
          </span>
        ),
        headClassName: "text-end",
        cellClassName: "text-end font-mono",
      },
      {
        key: "status",
        header: t("customerLifecycle.common.status", "Status"),
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "border-0 text-[10px] font-bold uppercase px-2 py-0.5",
              AI_STATUS_STYLES[row.status]
            )}
          >
            {t("customerLifecycle.aiStatus." + row.status.toLowerCase(), row.status)}
          </Badge>
        ),
        headClassName: "text-end",
        cellClassName: "text-end",
      },
    ],
    []
  );

  if (subQ.isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* ── Header Section with Subscription ID & Status ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{data?.planName || t("customerLifecycle.sub.defaultPlan", "Enterprise Ultra")}</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            {t("customerLifecycle.sub.subscriptionId", "Subscription ID:")}{" "}
            <span className="font-semibold text-xs bg-muted px-2 py-0.5 rounded text-foreground">
              {data?.subscriptionId}
            </span>
          </p>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto">
          <div className="flex flex-col items-end">
            <Badge
              variant="outline"
              className="bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)] text-[10px] font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1 shrink-0"
            >
              <span className="w-1.5 h-1.5 bg-[var(--status-success)] rounded-full animate-pulse" />
              {t("customerLifecycle.status.active", "Active")}
            </Badge>
            <span className="text-[10px] text-muted-foreground mt-1 font-medium">{t("customerLifecycle.sub.renewal", "Renewal:")} {data?.renewalDate}</span>
          </div>
          <Button className="gap-2 font-semibold active:scale-95 transition-transform">
            <Edit className="h-3.5 w-3.5" />
            {t("customerLifecycle.sub.managePlan", "Manage Plan")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column (span 8): Service Utilization & AI Logs */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Service Utilization Card */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">{t("customerLifecycle.sub.utilizationTitle", "Service Utilization Overview")}</CardTitle>
              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                {data?.performanceLabel}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {data?.utilization.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">
                      <strong className="text-foreground">{item.used}</strong> / {item.total} {item.unit}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        item.percentage >= 80 ? "bg-[var(--chart-1)]" : "bg-primary"
                      )}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                    <span>{t("customerLifecycle.sub.utilized", "{{n}}% Utilized", { n: item.percentage })}</span>
                    <span className={cn(item.percentage >= 80 ? "text-[var(--status-warning)]" : "text-[var(--status-success)]")}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent AI Logs DataTable */}
          <DataTable
            columns={aiLogColumns}
            data={data?.aiServiceLogs ?? []}
            title={t("customerLifecycle.sub.aiLogsTitle", "Recent AI Service Logs")}
            emptyMessage={t("customerLifecycle.sub.noLogs", "No service logs available")}
          />
        </div>

        {/* Right column (span 4): Node Coverage, Storage, Invoice */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Node Coverage circular gauge */}
          <Card className="bg-primary text-primary-foreground border border-border shadow-md relative overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center relative z-10">
              <h3 className="text-primary-foreground text-sm font-semibold mb-6 text-center">{t("customerLifecycle.sub.nodeCoverage", "Global Node Coverage")}</h3>
              {/* Circular Gauge */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-primary-foreground/15" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(data?.nodeCoverage.percentage ?? 0) * 2.512} 251.2`}
                    className="text-primary-foreground transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground">{data?.nodeCoverage.percentage}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-primary-foreground/60">{t("customerLifecycle.sub.fleetActive", "Fleet Active")}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                <div className="bg-primary-foreground/10 rounded-lg p-3 text-center border border-primary-foreground/5">
                  <p className="text-[9px] text-primary-foreground/60 uppercase font-semibold">{t("customerLifecycle.sub.primaryNodes", "Primary Nodes")}</p>
                  <p className="text-lg font-bold text-primary-foreground mt-0.5">{data?.nodeCoverage.primaryNodes}</p>
                </div>
                <div className="bg-primary-foreground/10 rounded-lg p-3 text-center border border-primary-foreground/5">
                  <p className="text-[9px] text-primary-foreground/60 uppercase font-semibold">{t("customerLifecycle.sub.edgeGateways", "Edge Gateways")}</p>
                  <p className="text-lg font-bold text-primary-foreground mt-0.5">{data?.nodeCoverage.edgeGateways}</p>
                </div>
              </div>
            </CardContent>
            {/* Background globe icon */}
            <Globe className="absolute -bottom-8 -end-8 w-32 h-32 text-primary-foreground/5 pointer-events-none" />
          </Card>

          {/* Storage Allocation Card */}
          <Card className="border border-border shadow-sm p-6">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">{t("customerLifecycle.sub.storageAllocation", "Storage Allocation")}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-primary rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>{t("customerLifecycle.sub.hotEdge", "Hot Edge Storage")}</span>
                    <span>1.2 TB</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("customerLifecycle.sub.hotEdgeDesc", "Instant access / Real-time processing")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[var(--status-info)] rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>{t("customerLifecycle.sub.standardCloud", "Standard Cloud")}</span>
                    <span>2.4 TB</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("customerLifecycle.sub.standardCloudDesc", "Archived event clips / 7 day retention")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[var(--chart-5)] rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span>{t("customerLifecycle.sub.deepArchive", "Deep Archive")}</span>
                    <span>0.6 TB</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("customerLifecycle.sub.deepArchiveDesc", "LTS Compliance data / 1 year retention")}</div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6 text-xs font-bold h-9">
              {t("customerLifecycle.sub.expandStorage", "Expand Storage")}
            </Button>
          </Card>

          {/* Next Invoice Card */}
          <Card className="bg-muted/40 border border-border p-6 rounded-xl">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t("customerLifecycle.sub.nextInvoice", "Next Invoice")}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">$</span>
              <span className="text-2xl font-bold text-foreground">{data?.nextInvoice.amount.replace("$", "")}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{t("customerLifecycle.sub.estimatedTotal", "Estimated total for")} {data?.nextInvoice.period}</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-[var(--chart-1)] font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              {data?.nextInvoice.trend}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Bottom Scale Action Bar ── */}
      <div className="p-6 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--chart-1)]/10 flex items-center justify-center text-[var(--chart-1)] shrink-0">
            <Bolt className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">{t("customerLifecycle.sub.scaleTitle", "Scale your operations effortlessly")}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{t("customerLifecycle.sub.scaleBody", "Looking to add more branches? Upgrade to Enterprise Platinum for unlimited camera licenses.")}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          <Button variant="ghost" size="sm" className="font-bold">{t("customerLifecycle.sub.comparePlans", "Compare Plans")}</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold active:scale-95 transition-transform">{t("customerLifecycle.sub.upgradePlan", "Upgrade Plan")}</Button>
        </div>
      </div>
    </div>
  );
}
