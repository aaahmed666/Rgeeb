"use client";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  HardDrive,
  Wifi,
  Zap,
ShieldAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GaugeChart, HealthCheckCard } from "@/components/charts/Monitoring";
import { LineChartComponent } from "@/components/charts/Charts";

const perfData = [
  { name: "00:00", latency: 45, throughput: 220 },
  { name: "04:00", latency: 52, throughput: 240 },
  { name: "08:00", latency: 68, throughput: 320 },
  { name: "12:00", latency: 71, throughput: 380 },
  { name: "16:00", latency: 60, throughput: 410 },
  { name: "20:00", latency: 48, throughput: 290 },
];

const services = [
  { name: "API Server", description: "Main API", status: "up" as const, responseTime: 45, uptime: 99.98, lastCheck: "2m" },
  { name: "Database", description: "PostgreSQL", status: "up" as const, responseTime: 12, uptime: 99.95, lastCheck: "1m" },
  { name: "Cache", description: "Redis cluster", status: "degraded" as const, responseTime: 156, uptime: 98.5, lastCheck: "30s" },
  { name: "Queue", description: "Message queue", status: "warning" as const, responseTime: 89, uptime: 99.2, lastCheck: "45s" },
];

const alerts = [
  { id: 1, severity: "high" as const, title: "CPU usage spike", body: "API server CPU exceeded 85% for 5 minutes.", when: "12m ago" },
  { id: 2, severity: "medium" as const, title: "Cache degraded", body: "Redis cluster response time above threshold.", when: "37m ago" },
  { id: 3, severity: "low" as const, title: "Backup completed", body: "Daily backup finished successfully.", when: "2h ago" },
];

const sevTone: Record<"high" | "medium" | "low", string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-amber-500/15 text-amber-600",
  low: "bg-emerald-500/15 text-emerald-600",
};

export default function MonitoringView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();


  if (!hasPermission("event_timeline")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-lg font-bold sm:text-xl">{t("monitoring.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("monitoring.description")}</p>
      </header>

      <Tabs defaultValue="system">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="system">{t("monitoring.system")}</TabsTrigger>
          <TabsTrigger value="health">{t("monitoring.health")}</TabsTrigger>
          <TabsTrigger value="performance">{t("monitoring.performance")}</TabsTrigger>
          <TabsTrigger value="alerts">{t("monitoring.alerts")}</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { icon: Cpu, label: t("monitoring.cpu"), value: 42, unit: "%" },
            { icon: Database, label: t("monitoring.memory"), value: 68, max: 128, unit: "GB" },
            { icon: HardDrive, label: t("monitoring.disk"), value: 55, unit: "%" },
            { icon: Wifi, label: t("monitoring.network"), value: 120, max: 1000, unit: "Mbps" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label}>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{m.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart label={m.label} value={m.value} max={m.max} unit={m.unit} />
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="health" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((s) => (
            <HealthCheckCard key={s.name} {...s} />
          ))}
        </TabsContent>

        <TabsContent value="performance" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Avg Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">58ms</p>
                <p className="text-xs text-muted-foreground">P95: 124ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Activity className="h-5 w-5 text-chart-4" />
                <CardTitle className="text-base">Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">312 rps</p>
                <p className="text-xs text-muted-foreground">+8% vs yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0.42%</p>
                <p className="text-xs text-muted-foreground">Under threshold</p>
              </CardContent>
            </Card>
          </div>
          <LineChartComponent
            title="Latency vs Throughput"
            data={perfData}
            lines={[
              { key: "latency", name: "Latency (ms)" },
              { key: "throughput", name: "Throughput (rps)" },
            ]}
            height={320}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6 space-y-3">
          {alerts.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <Badge className={`uppercase ${sevTone[a.severity]}`} variant="secondary">
                  {a.severity}
                </Badge>
                <div className="flex-1">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                </div>
                <span className="text-xs text-muted-foreground">{a.when}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
