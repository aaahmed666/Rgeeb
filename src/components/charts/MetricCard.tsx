"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  accent?: "primary" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  accent = "primary",
}: MetricCardProps) {
  const trendUp = typeof trend === "number" && trend > 0;
  const trendDown = typeof trend === "number" && trend < 0;
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            {typeof trend === "number" && (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs font-medium",
                  trendUp && "text-emerald-600",
                  trendDown && "text-destructive",
                )}
              >
                {trendUp && <ArrowUp className="h-3 w-3" />}
                {trendDown && <ArrowDown className="h-3 w-3" />}
                {Math.abs(trend)}% {trendLabel ?? ""}
              </p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "rounded-lg p-2.5",
                accent === "primary" && "bg-primary/10 text-primary",
                accent === "chart-2" && "bg-chart-2/10 text-chart-2",
                accent === "chart-3" && "bg-chart-3/10 text-chart-3",
                accent === "chart-4" && "bg-chart-4/10 text-chart-4",
                accent === "chart-5" && "bg-chart-5/10 text-chart-5",
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
