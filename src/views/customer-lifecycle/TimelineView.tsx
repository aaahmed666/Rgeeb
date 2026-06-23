"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Camera,
  DollarSign,
  Download,
  Filter,
  FileText,
  Zap,
  Shield,
  Plug,
  HardDrive,
  CreditCard,
  UserPlus,
  GraduationCap,
  Paperclip,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { fetchTimelineData } from "@/services/customerLifecycleMockService";
import type { TimelineData, ActivityEvent } from "@/services/customerLifecycleMockService";

/* ── Event type → icon / color mapping ──────────────────────────────────── */

const EVENT_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; text: string }
> = {
  subscription: { icon: CreditCard, bg: "bg-[var(--status-success)]/15", text: "text-[var(--status-success)]" },
  system: { icon: Zap, bg: "bg-[var(--status-info)]/15", text: "text-[var(--status-info)]" },
  training: { icon: GraduationCap, bg: "bg-[var(--chart-5)]/15", text: "text-[var(--chart-5)] dark:text-[var(--chart-5)]" },
  ai: { icon: Shield, bg: "bg-[var(--status-info)]/15", text: "text-[var(--status-info)]" },
  integration: { icon: Plug, bg: "bg-[var(--status-warning)]/15", text: "text-[var(--status-warning)]" },
  asset: { icon: HardDrive, bg: "bg-[var(--status-info)]/15", text: "text-[var(--status-info)]" },
  account: { icon: UserPlus, bg: "bg-muted/15", text: "text-muted-foreground dark:text-muted-foreground" },
};

/* ── Timeline Event Card ────────────────────────────────────────────────── */

function TimelineEvent({ event }: { event: ActivityEvent }) {
  const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.system;
  const Icon = config.icon;

  return (
    <div className="group relative flex gap-4 pb-8 last:pb-0">
      {/* Vertical connector line */}
      <div className="absolute start-5 top-12 bottom-0 w-px bg-border group-last:hidden" />

      {/* Dot */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bg
        )}
      >
        <Icon className={cn("h-4.5 w-4.5", config.text)} />
      </div>

      {/* Content */}
      <Card className="flex-1 transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{event.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {event.description}
              </p>
              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {event.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] font-semibold uppercase tracking-wide"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {/* Attachment */}
              {event.attachment && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {event.attachment.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {event.attachment.size}
                      {event.attachment.note && ` · ${event.attachment.note}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
              {event.date}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main TimelineView ──────────────────────────────────────────────────── */

export default function TimelineView() {
  const { t } = useTranslation();
  const timelineQ = useQuery<TimelineData>({
    queryKey: ["cl-timeline-data"],
    queryFn: () => fetchTimelineData(),
    staleTime: 30_000,
  });

  const data = timelineQ.data;

  if (timelineQ.isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {t("customerLifecycle.customers", "Customers")} &gt; {data?.customerName}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {t("customerLifecycle.tl.title", "Customer Timeline")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            {t("customerLifecycle.tl.filterView", "Filter View")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {t("customerLifecycle.tl.exportCsv", "Export CSV")}
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-info)]/10">
              <Calendar className="h-5 w-5 text-[var(--status-info)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("customerLifecycle.tl.daysSinceLaunch", "Days Since Launch")}
              </p>
              <p className="text-xl font-bold text-foreground">{data?.daysSinceLaunch}</p>
              <p className="text-[10px] text-[var(--status-success)]">
                {data?.daysTrend}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--chart-5)]/10">
              <Camera className="h-5 w-5 text-[var(--chart-5)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("customerLifecycle.tl.activeCameras", "Active Cameras")}
              </p>
              <p className="text-xl font-bold text-foreground">
                {data?.activeCameras.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">{data?.activeCamerasLabel}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-success)]/10">
              <DollarSign className="h-5 w-5 text-[var(--status-success)]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("customerLifecycle.tl.annualizedValue", "Annualized Value")}
              </p>
              <p className="text-xl font-bold text-foreground">{data?.annualizedValue}</p>
              <p className="text-[10px] text-muted-foreground">
                {data?.annualizedValueLabel}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Timeline ── */}
      <div className="mx-auto max-w-3xl">
        {data?.events.map((event) => (
          <TimelineEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
