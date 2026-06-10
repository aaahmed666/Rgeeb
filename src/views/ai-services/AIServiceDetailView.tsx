"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Activity,
  Camera,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings2,
  RefreshCw,
  Download,
  Eye,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ServiceMonitorView from "./ServiceMonitorView";
import type { AIServiceMeta } from "./aiServiceTypes";
export type { AIServiceMeta } from "./aiServiceTypes";

interface Props {
  service: AIServiceMeta;
}

// If service has an apiId, render the live monitor; otherwise the static fallback
export default function AIServiceDetailView({ service }: Props) {
  if (service.apiId != null) {
    return (
      <ServiceMonitorView
        service={service}
        serviceApiId={service.apiId}
      />
    );
  }
  return <StaticDetailView service={service} />;
}

function StaticDetailView({ service }: Props) {
  const { t } = useTranslation();
  const Icon = service.icon;
  const [isActive, setIsActive] = React.useState(true);
  const { stats } = service;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/ai-services"
          className="hover:text-foreground transition-colors"
        >
          AI Services
        </Link>
        <span>/</span>
        <Link
          href={service.categoryHref}
          className="hover:text-foreground transition-colors"
        >
          {service.category}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{service.label}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={service.categoryHref}>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{ backgroundColor: service.bgColor }}
          >
            <Icon
              className="h-7 w-7"
              style={{ color: service.color }}
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold sm:text-xl">{service.label}</h1>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={
                  isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""
                }
              >
                {isActive
                  ? t("aiServices.activeStatus", "Active")
                  : t("aiServices.inactiveStatus", "Inactive")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {service.description}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            {t("aiServices.configure")}
          </Button>
          <Button
            size="sm"
            variant={isActive ? "destructive" : "default"}
            className="gap-2"
            onClick={() => setIsActive((v) => !v)}
          >
            {isActive ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isActive
              ? t("aiServices.deactivate", "Deactivate")
              : t("aiServices.activate", "Activate")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: t("aiServices.totalDetections", "Total Detections"),
            value: stats.totalDetections.toLocaleString(),
            icon: Activity,
            color: "text-blue-500",
          },
          {
            label: t("aiServices.today", "Today"),
            value: stats.todayDetections.toLocaleString(),
            icon: Clock,
            color: "text-purple-500",
          },
          {
            label: t("aiServices.accuracy", "Accuracy"),
            value: `${stats.accuracy}%`,
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: t("aiServices.uptime", "Uptime"),
            value: `${stats.uptime}%`,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: t("aiServices.avgResponse", "Avg Response"),
            value: `${stats.avgResponseMs}ms`,
            icon: Zap,
            color: "text-amber-500",
          },
          {
            label: t("aiServices.cameras", "Cameras"),
            value: stats.cameras.toString(),
            icon: Camera,
            color: "text-cyan-500",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="text-center"
          >
            <CardContent className="pt-4 pb-3 px-3">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold leading-tight">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Description + Use Cases */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("aiServices.about", "About this Service")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.detailedDescription}
              </p>
              <div>
                <p className="text-sm font-semibold mb-2">
                  {t("aiServices.useCases")}
                </p>
                <ul className="space-y-1.5">
                  {service.useCases.map((uc) => (
                    <li
                      key={uc}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("aiServices.performance", "Performance")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: t(
                    "aiServices.detectionAccuracy",
                    "Detection Accuracy"
                  ),
                  value: stats.accuracy,
                },
                {
                  label: t("aiServices.serviceUptime", "Service Uptime"),
                  value: stats.uptime,
                },
                {
                  label: t("aiServices.cameraCoverage", "Camera Coverage"),
                  value: Math.min(100, stats.cameras * 12),
                },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}%</span>
                  </div>
                  <Progress
                    value={m.value}
                    className="h-1.5"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events + Actions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">
                {t("aiServices.recentEvents", "Recent Events")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Eye className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t("aiServices.noLiveEvents", "No live event data — assign a camera to this service to see real-time detections.")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t("aiServices.detectionTrend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1.5 h-24">
                {[
                  42,
                  78,
                  55,
                  91,
                  63,
                  88,
                  stats.todayDetections > 100 ? 100 : stats.todayDetections,
                ].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${v}%`,
                        backgroundColor:
                          i === 6 ? service.color : `${service.color}66`,
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {["M", "T", "W", "T", "F", "S", "T"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
