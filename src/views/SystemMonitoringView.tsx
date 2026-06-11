"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Video,
  Brain,
  AlertTriangle,
  MapPin,
  Clock,
ShieldAlert,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  systemMonitoringService,
  type AlertItem,
  type PulseCamera,
} from "@/services/systemMonitoringService";

export default function SystemMonitoringView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [now, setNow] = React.useState(Date.now());

  const pulseQ = useQuery({
    queryKey: ["system-monitoring", "pulse"],
    queryFn: () => systemMonitoringService.getPulse(),
    refetchInterval: 15_000,
  });
  const alertsQ = useQuery({
    queryKey: ["system-monitoring", "alerts"],
    queryFn: () => systemMonitoringService.getAlerts(10),
    refetchInterval: 10_000,
  });

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const updatedSeconds = pulseQ.dataUpdatedAt
    ? Math.max(0, Math.floor((now - pulseQ.dataUpdatedAt) / 1000))
    : 0;

  const pulse = pulseQ.data;

  const refresh = () => {
    pulseQ.refetch();
    alertsQ.refetch();
  };


  if (!hasPermission("system_monitoring")) {
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
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold sm:text-xl">
              {t("systemMonitoring.title", "System Monitoring")}
            </h1>
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600">
              <span className="me-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {t("systemMonitoring.live", "LIVE")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              "systemMonitoring.subtitle",
              "Camera health, worker status & live alerts"
            )}
            <span className="mx-1">·</span>
            {t("systemMonitoring.updatedAgo", "Updated {{n}}s ago", {
              n: updatedSeconds,
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          aria-label="Refresh"
        >
          <RefreshCw
            className={cn("h-4 w-4", pulseQ.isFetching && "animate-spin")}
          />
        </Button>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <HealthGauge value={pulse?.systemHealth ?? 0} />
            <div>
              <p className="text-base font-semibold">
                {t("systemMonitoring.systemHealth", "System Health")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("systemMonitoring.cameraUptime", "Camera uptime")}
              </p>
            </div>
          </CardContent>
        </Card>

        <KpiCard
          icon={Video}
          tone="emerald"
          value={pulse?.camerasOnline ?? 0}
          label={t("systemMonitoring.online", "Online")}
          progress={
            pulse?.camerasTotal
              ? ((pulse.camerasOnline ?? 0) / pulse.camerasTotal) * 100
              : 0
          }
        />
        <KpiCard
          icon={Brain}
          tone="indigo"
          value={pulse?.activeWorkers ?? 0}
          label={t("systemMonitoring.activeWorkers", "Active Workers")}
        />
        <KpiCard
          icon={AlertTriangle}
          tone="amber"
          value={pulse?.detectionsToday ?? 0}
          label={t("systemMonitoring.detectionsToday", "Detections Today")}
        />
      </section>

      {/* Camera health + Alert timeline */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Camera health – 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                {t("systemMonitoring.cameraHealth", "Camera Health")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t(
                  "systemMonitoring.cameraHealthSummary",
                  "{{online}} online · {{offline}} offline · {{degraded}} degraded",
                  {
                    online:
                      pulse?.cameras.filter((c) => c.status === "online")
                        .length ?? 0,
                    offline:
                      pulse?.cameras.filter((c) => c.status === "offline")
                        .length ?? 0,
                    degraded:
                      pulse?.cameras.filter((c) => c.status === "degraded")
                        .length ?? 0,
                  }
                )}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs"
            >
              {t("systemMonitoring.nCameras", "{{n}} cameras", {
                n: pulse?.cameras.length ?? 0,
              })}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(pulse?.cameras ?? []).map((c) => (
              <CameraHealthCard
                key={c.id}
                camera={c}
              />
            ))}
          </CardContent>
        </Card>

        {/* Alert timeline – 1/3 width */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                {t("systemMonitoring.alertTimeline", "Alert Timeline")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("systemMonitoring.last10", "Last 10 detections")}
              </p>
            </div>
            <Badge className="border-red-500/30 bg-red-500/15 text-red-600">
              <span className="me-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {t("systemMonitoring.live", "LIVE")}
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 space-y-1 overflow-y-auto">
            {(alertsQ.data ?? []).map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
              />
            ))}
            {alertsQ.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("systemMonitoring.noAlerts", "No alerts")}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function HealthGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const tone =
    v >= 90
      ? "text-emerald-500"
      : v >= 60
        ? "text-amber-500"
        : "text-destructive";
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 80 80"
      >
        <circle
          cx="40"
          cy="40"
          r={r}
          className="stroke-muted"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          className={cn("transition-all", tone)}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {Math.round(v)}%
      </div>
    </div>
  );
}

const TONE_BG: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600",
  indigo: "bg-indigo-500/10 text-indigo-600",
  amber: "bg-amber-500/10 text-amber-600",
};

function KpiCard({
  icon: Icon,
  tone,
  value,
  label,
  progress,
}: {
  icon: React.ElementType;
  tone: "emerald" | "indigo" | "amber";
  value: number | string;
  label: string;
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              TONE_BG[tone]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold leading-none">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        {typeof progress === "number" && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_DOT: Record<PulseCamera["status"], string> = {
  online: "bg-emerald-500",
  offline: "bg-destructive",
  degraded: "bg-amber-500",
};
const STATUS_BADGE: Record<
  PulseCamera["status"],
  { label: string; class: string }
> = {
  online: {
    label: "ONLINE",
    class:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  offline: {
    label: "OFFLINE",
    class: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  degraded: {
    label: "DEGRADED",
    class:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

function CameraHealthCard({ camera }: { camera: PulseCamera }) {
  const badge = STATUS_BADGE[camera.status];
  return (
    <div className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-sm">
          <span
            className={cn("h-2 w-2 rounded-full", STATUS_DOT[camera.status])}
          />
          {camera.name}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            badge.class
          )}
        >
          {badge.label}
        </Badge>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {camera.branch}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {camera.lastSeen}
        </span>
      </div>
    </div>
  );
}

/** Map detection type → severity for dot colour */
function alertSeverity(type: string, severity: AlertItem["severity"]) {
  if (severity === "critical" || type === "ppe_violation") return "critical";
  if (severity === "warning") return "warning";
  return "info";
}

const SEV_ROW: Record<string, string> = {
  info: "",
  warning: "bg-amber-500/8",
  critical: "bg-orange-500/10",
};
const SEV_DOT: Record<string, string> = {
  info: "bg-muted-foreground/40",
  warning: "bg-amber-500",
  critical: "bg-orange-500",
};

function AlertRow({ alert }: { alert: AlertItem }) {
  const sev = alertSeverity(alert.type, alert.severity);
  return (
    <div className={cn("rounded-lg px-3 py-2.5", SEV_ROW[sev])}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", SEV_DOT[sev])}
          />
          <span className="truncate text-sm font-medium">{alert.type}</span>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {alert.timestamp}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 ps-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Video className="h-3 w-3" />
          {alert.source}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {alert.branch}
        </span>
        {typeof alert.confidence === "number" && (
          <Badge
            variant="outline"
            className="ms-auto text-[10px] tabular-nums"
          >
            {alert.confidence}%
          </Badge>
        )}
      </div>
    </div>
  );
}
