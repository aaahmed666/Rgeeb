"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GaugeProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
}

export function GaugeChart({ label, value, max = 100, unit = "%" }: GaugeProps) {
  const pct = Math.min(100, (value / max) * 100);
  const tone =
    pct > 85 ? "text-destructive" : pct > 60 ? "text-chart-1" : "text-emerald-600";
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-2xl font-bold ${tone}`}>
          {value}
          <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

interface HealthProps {
  name: string;
  description?: string;
  status: "up" | "degraded" | "down" | "warning";
  responseTime: number;
  uptime: number;
  lastCheck: string;
}

const STATUS_STYLES: Record<HealthProps["status"], string> = {
  up: "bg-emerald-500/15 text-emerald-600",
  degraded: "bg-amber-500/15 text-amber-600",
  warning: "bg-amber-500/15 text-amber-600",
  down: "bg-destructive/15 text-destructive",
};

export function HealthCheckCard(props: HealthProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{props.name}</CardTitle>
          {props.description && (
            <p className="text-xs text-muted-foreground">{props.description}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[props.status]}`}
        >
          {props.status}
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-muted-foreground">Response</p>
          <p className="mt-1 font-semibold">{props.responseTime}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">Uptime</p>
          <p className="mt-1 font-semibold">{props.uptime}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Checked</p>
          <p className="mt-1 font-semibold">{props.lastCheck}</p>
        </div>
      </CardContent>
    </Card>
  );
}
