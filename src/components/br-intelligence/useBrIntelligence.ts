import { useCallback, useEffect, useMemo, useState } from "react";
import {
  analyticsService,
  type Branch,
} from "@/services/analyticsService";
import {
  intelligenceService,
  type AiInsight,
  type Anomaly,
  type BranchHealth,
  type EfficiencyRow,
  type HeatmapPayload,
  type HourlyPeak,
  type PeriodComparison,
  type Rankings,
  type ServiceMatrixCell,
  type TrendForecast,
} from "@/services/intelligenceService";
import { normalizeService, type RangeKey, rangeFor } from "./utils";

export interface BrIntelligenceState {
  efficiency: EfficiencyRow[];
  rankings: Rankings | null;
  heatmap: HeatmapPayload | null;
  health: BranchHealth[];
  matrix: ServiceMatrixCell[];
  insights: AiInsight[];
  anomalies: Anomaly[];
  forecast: TrendForecast | null;
  hourly: HourlyPeak[];
  comparison: PeriodComparison[];
  services: string[];
  branches: Branch[];
  loading: boolean;
  updatedAt: Date | null;
}

export interface BrIntelligenceFilters {
  range: RangeKey;
  customFrom: string;
  customTo: string;
  branchId: string;
  activeService: string;
  rankTop: 3 | 5 | 10;
}

export function useBrIntelligenceData(filters: BrIntelligenceFilters) {
  const [state, setState] = useState<BrIntelligenceState>({
    efficiency: [],
    rankings: null,
    heatmap: null,
    health: [],
    matrix: [],
    insights: [],
    anomalies: [],
    forecast: null,
    hourly: [],
    comparison: [],
    services: ["All"],
    branches: [],
    loading: true,
    updatedAt: null,
  });

  // Compute primitive date strings — stable when filters don't change
  const dateFrom = useMemo(
    () => rangeFor(filters.range, filters.customFrom, filters.customTo).from,
    [filters.range, filters.customFrom, filters.customTo]
  );
  const dateTo = useMemo(
    () => rangeFor(filters.range, filters.customFrom, filters.customTo).to,
    [filters.range, filters.customFrom, filters.customTo]
  );
  const branchIdFilter = filters.branchId === "all" ? undefined : filters.branchId;
  const { rankTop, activeService } = filters;

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const computedFilters = { dateFrom, dateTo, branchId: branchIdFilter };
    const [eff, rnk, hm, hl, mx, ins, an, fc, hr, cp] = await Promise.all([
      intelligenceService.efficiency(computedFilters),
      intelligenceService.rankings(computedFilters, rankTop),
      intelligenceService.heatmap(
        computedFilters,
        activeService === "All" ? undefined : activeService
      ),
      intelligenceService.branchHealth(computedFilters),
      intelligenceService.serviceMatrix(computedFilters),
      intelligenceService.aiInsights(computedFilters),
      intelligenceService.anomalies(computedFilters),
      intelligenceService.forecast(computedFilters),
      intelligenceService.hourly(computedFilters),
      intelligenceService.comparison(computedFilters),
    ]);

    setState((prev) => ({
      ...prev,
      efficiency: Array.isArray(eff) ? eff : [],
      rankings:
        rnk && typeof rnk === "object" && !Array.isArray(rnk) ? rnk : null,
      heatmap: hm && typeof hm === "object" && !Array.isArray(hm) ? hm : null,
      health: Array.isArray(hl) ? hl : [],
      matrix: Array.isArray(mx) ? mx : [],
      insights: Array.isArray(ins) ? ins : [],
      anomalies: Array.isArray(an) ? an : [],
      forecast: fc && typeof fc === "object" && !Array.isArray(fc) ? fc : null,
      hourly: Array.isArray(hr) ? hr : [],
      comparison: Array.isArray(cp) ? cp : [],
      loading: false,
      updatedAt: new Date(),
    }));
  }, [dateFrom, dateTo, branchIdFilter, rankTop, activeService]); // ← primitives only

  useEffect(() => {
    void analyticsService.getBranches().then((branches) => {
      setState((prev) => ({ ...prev, branches }));
    });
    void intelligenceService.availableServices().then((data) => {
      const normalized = (data as unknown[])
        .map(normalizeService)
        .filter(Boolean);
      setState((prev) => ({
        ...prev,
        services: normalized.length ? normalized : ["All"],
      }));
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return state;
}

export const useBrIntelligenceSummary = (efficiency: EfficiencyRow[]) =>
  useMemo(() => {
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
