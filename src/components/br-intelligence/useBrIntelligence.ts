import React, { useCallback, useEffect, useMemo, useState } from "react";
import { analyticsService, type Branch } from "@/services/analyticsService";
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
  const branchIdFilter =
    filters.branchId === "all" ? undefined : filters.branchId;
  const { rankTop, activeService } = filters;

  // Main load — does NOT depend on activeService or rankTop so those filters
  // don't trigger a full re-fetch of every endpoint.
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

    // Use rankings by_score as efficiency data when efficiency-index returns empty
    const effData =
      Array.isArray(eff) && eff.length > 0
        ? eff
        : (rnk?.by_score ?? []).map((r, i) => ({
            branch: r.branch,
            score: typeof r.value === "number" ? r.value : Number(r.value),
            compliance: 0,
            detections: 0,
            violations: 0,
            violation_rate: 0,
            tasks_done: 0,
            tasks_total: 0,
            task_rate: 0,
            trend: 0,
            status: "Outstanding" as const,
            _rank: i,
          }));
    setState((prev) => ({
      ...prev,
      efficiency: effData,
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
  }, [dateFrom, dateTo, branchIdFilter]); // ← does NOT include rankTop or activeService

  // Isolated re-fetch for heatmap when service filter changes
  const loadHeatmap = useCallback(async () => {
    const computedFilters = { dateFrom, dateTo, branchId: branchIdFilter };
    const hm = await intelligenceService.heatmap(
      computedFilters,
      activeService === "All" ? undefined : activeService
    );
    setState((prev) => ({
      ...prev,
      heatmap: hm && typeof hm === "object" && !Array.isArray(hm) ? hm : null,
    }));
  }, [dateFrom, dateTo, branchIdFilter, activeService]);

  // Isolated re-fetch for rankings when top-N filter changes
  const loadRankings = useCallback(async () => {
    const computedFilters = { dateFrom, dateTo, branchId: branchIdFilter };
    const rnk = await intelligenceService.rankings(computedFilters, rankTop);
    setState((prev) => ({
      ...prev,
      rankings:
        rnk && typeof rnk === "object" && !Array.isArray(rnk) ? rnk : null,
    }));
  }, [dateFrom, dateTo, branchIdFilter, rankTop]);

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

  // Full reload when date range or branch changes
  useEffect(() => {
    void load();
  }, [load]);

  // Partial reload: only heatmap when service filter changes (after initial load)
  const isFirstHeatmapRender = React.useRef(true);
  useEffect(() => {
    if (isFirstHeatmapRender.current) {
      isFirstHeatmapRender.current = false;
      return;
    }
    void loadHeatmap();
  }, [loadHeatmap]);

  // Partial reload: only rankings when top-N changes (after initial load)
  const isFirstRankingsRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRankingsRender.current) {
      isFirstRankingsRender.current = false;
      return;
    }
    void loadRankings();
  }, [loadRankings]);

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
