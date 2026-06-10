"use client";

import { useTranslation } from "react-i18next";
import { BarChart3, Trophy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EfficiencySummary } from "./useBrIntelligenceSummary";

interface BrIntelligenceMetricsProps {
  summary: EfficiencySummary;
  loading: boolean;
  updatedAt: string;
}

export function BrIntelligenceMetrics({
  summary,
  loading,
  updatedAt,
}: BrIntelligenceMetricsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Average Score",
      value: summary.avg.toFixed(1),
      icon: BarChart3,
      color: "text-blue-500",
    },
    {
      label: "Outstanding",
      value: summary.outstanding,
      icon: Trophy,
      color: "text-green-500",
    },
    {
      label: "Needs Attention",
      value: summary.needs,
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      label: "Critical",
      value: summary.critical,
      icon: CheckCircle2,
      color: "text-red-500",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${metric.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
