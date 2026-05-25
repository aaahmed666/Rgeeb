"use client";

import { useMemo } from "react";
import type { BrIntelligenceFilters } from "./useBrIntelligence";
import type { EfficiencyRow as EfficiencyItem } from "@/services/intelligenceService";

export interface EfficiencySummary {
  avg: number;
  outstanding: number;
  needs: number;
  critical: number;
}

/**
 * Compute efficiency summary statistics from raw efficiency data
 */
export function useBrIntelligenceSummary(
  efficiency: EfficiencyItem[]
): EfficiencySummary {
  return useMemo(() => {
    const avg = efficiency.length
      ? efficiency.reduce((a, b) => a + b.score, 0) / efficiency.length
      : 0;
    const outstanding = efficiency.filter(
      (e) => e.status === "Outstanding"
    ).length;
    const needs = efficiency.filter(
      (e) => e.status === "Needs Attention"
    ).length;
    const critical = efficiency.filter((e) => e.status === "Critical").length;
    return { avg, outstanding, needs, critical };
  }, [efficiency]);
}

/**
 * Access and normalize all unique services from the filters list
 */
export function useBrIntelligenceServices(allServices: string[]): string[] {
  return useMemo(() => {
    const normalized = Array.from(new Set(allServices))
      .map((s) => String(s))
      .filter(Boolean);
    return normalized.length ? normalized : ["All"];
  }, [allServices]);
}
