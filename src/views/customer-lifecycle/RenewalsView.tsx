"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  CalendarClock,
  DollarSign,
  AlertTriangle,
  Download,
  Plus,
  Eye,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SharedTablePaginated } from "@/components/SharedTablePaginated";
import { type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

import {
  fetchRenewalStats,
  fetchRenewalGroups,
} from "@/services/customerLifecycleMockService";
import type {
  RenewalStats,
  RenewalGroup,
  RenewalEntry,
} from "@/services/customerLifecycleMockService";

/* ── Risk Badge ─────────────────────────────────────────────────────────── */

const RISK_STYLES: Record<string, string> = {
  red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/* ── Urgency Section ────────────────────────────────────────────────────── */

function RenewalSection({
  group,
  columns,
}: {
  group: RenewalGroup;
  columns: DataTableColumn<RenewalEntry>[];
}) {
  const urgencyStyles: Record<string, string> = {
    critical: "border-rose-500/30",
    warning: "border-amber-500/30",
    normal: "border-border",
  };

  const urgencyBadgeStyles: Record<string, string> = {
    critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    normal: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold uppercase", urgencyBadgeStyles[group.urgency])}
          >
            {group.contractCount} Contracts
          </Badge>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Total Value: <strong className="text-foreground">{group.totalValue}</strong>
        </span>
      </div>
      <SharedTablePaginated
        columns={columns}
        data={group.entries}
        className={cn("border", urgencyStyles[group.urgency])}
        emptyMessage="No renewals in this window"
        currentPage={1}
        totalPages={1}
      />
    </div>
  );
}

/* ── Main RenewalsView ──────────────────────────────────────────────────── */

export default function RenewalsView() {
  const statsQ = useQuery<RenewalStats>({
    queryKey: ["cl-renewal-stats"],
    queryFn: fetchRenewalStats,
    staleTime: 30_000,
  });

  const groupsQ = useQuery<RenewalGroup[]>({
    queryKey: ["cl-renewal-groups"],
    queryFn: fetchRenewalGroups,
    staleTime: 30_000,
  });

  const s = statsQ.data;

  const renewalColumns: DataTableColumn<RenewalEntry>[] = useMemo(
    () => [
      {
        key: "customerName",
        header: "Customer Name",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {row.customerInitials}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{row.customerName}</p>
              <p className="text-[10px] text-muted-foreground">{row.accountManager}</p>
            </div>
          </div>
        ),
      },
      {
        key: "currentPackage",
        header: "Current Package",
        render: (row) => (
          <span className="text-sm text-foreground">{row.currentPackage}</span>
        ),
      },
      {
        key: "expiryDate",
        header: "Expiry Date",
        render: (row) => (
          <div>
            <p className="text-sm text-foreground">{row.expiryDate}</p>
            <p className={cn(
              "text-[10px] font-medium",
              row.daysLeft <= 7 ? "text-rose-500" : row.daysLeft <= 14 ? "text-amber-500" : "text-muted-foreground"
            )}>
              {row.daysLeft} days left
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <span className="text-xs font-medium text-muted-foreground">{row.status}</span>
        ),
      },
      {
        key: "riskScore",
        header: "Risk Score",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn("border-0 text-[10px] font-semibold", RISK_STYLES[row.riskColor])}
          >
            {row.riskLabel}
          </Badge>
        ),
      },
      {
        key: "action",
        header: "Action",
        render: (row) => (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-primary">
            {row.action}
            <ChevronRight className="h-3 w-3" />
          </Button>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Renewal Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Proactive contract renewal management and churn prevention
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Quote
          </Button>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsQ.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </CardContent>
              </Card>
            ))
          : (
            <>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Health Score
                    </p>
                    <Heart className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s?.healthScore}%</p>
                  <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    {s?.healthTrend}
                  </p>
                </CardContent>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Upcoming Renewals
                    </p>
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s?.upcomingRenewals}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{s?.upcomingRenewalsLabel}</p>
                </CardContent>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Forecasted Revenue
                    </p>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s?.forecastedRevenue}</p>
                  <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    {s?.forecastedRevenueTrend}
                  </p>
                </CardContent>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      High Risk Attrition
                    </p>
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{s?.highRiskAttrition}</p>
                  <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">
                    {s?.highRiskAttritionLabel}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
      </div>

      {/* ── Renewal Groups ── */}
      {groupsQ.isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupsQ.data?.map((group) => (
            <RenewalSection
              key={group.label}
              group={group}
              columns={renewalColumns}
            />
          ))}
        </div>
      )}
    </div>
  );
}
