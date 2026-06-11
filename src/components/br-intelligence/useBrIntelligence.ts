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
  type PeriodComparisonPayload,
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
  comparison: PeriodComparisonPayload | null;
  services: string[];
  branches: Branch[];
  loading: boolean;
  updatedAt: Date | null;
}

export interface BrIntelligenceFilters {
  range: RangeKey;
  customFrom: string;
  customTo: string;
  /** Selected branch ids. Empty array = all branches. */
  branchIds: string[];
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
    comparison: null,
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
  // Stable string key so the array identity doesn't retrigger effects
  const branchIdsKey = filters.branchIds.join(",");
  const branchIdsFilter = useMemo(
    () => (branchIdsKey ? branchIdsKey.split(",") : undefined),
    [branchIdsKey]
  );
  const { rankTop, activeService } = filters;

  // Refs so `load` always reads the *current* filter values, even though they
  // are intentionally excluded from its dependency array (changing them must
  // not trigger a full re-fetch — they have their own partial loaders below).
  const rankTopRef = React.useRef(rankTop);
  rankTopRef.current = rankTop;
  const activeServiceRef = React.useRef(activeService);
  activeServiceRef.current = activeService;

  // Main load — does NOT depend on activeService or rankTop so those filters
  // don't trigger a full re-fetch of every endpoint.
  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const computedFilters = { dateFrom, dateTo, branchIds: branchIdsFilter };
    const currentService = activeServiceRef.current;
    const [eff, rnk, hm, hl, mx, ins, an, fc, hr, cp] = await Promise.all([
      intelligenceService.efficiency(computedFilters),
      intelligenceService.rankings(computedFilters, rankTopRef.current),
      intelligenceService.heatmap(
        computedFilters,
        currentService === "All" ? undefined : currentService
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
      // Efficiency must come from the efficiency-index endpoint only.
      // (Previously this fabricated rows from the Top-N rankings payload with
      // all-zero metrics, which corrupted the Efficiency Index table, the
      // Avg/Outstanding/Critical KPIs, and made the Store Rankings Top-N
      // filter appear to affect the wrong section.)
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
      comparison: cp && typeof cp === "object" && !Array.isArray(cp) ? cp : null,
      loading: false,
      updatedAt: new Date(),
    }));
  }, [dateFrom, dateTo, branchIdsFilter]); // ← does NOT include rankTop or activeService

  // Isolated re-fetch for heatmap when service filter changes
  const loadHeatmap = useCallback(async () => {
    const computedFilters = { dateFrom, dateTo, branchIds: branchIdsFilter };
    const hm = await intelligenceService.heatmap(
      computedFilters,
      activeService === "All" ? undefined : activeService
    );
    setState((prev) => ({
      ...prev,
      heatmap: hm && typeof hm === "object" && !Array.isArray(hm) ? hm : null,
    }));
  }, [dateFrom, dateTo, branchIdsFilter, activeService]);

  // Isolated re-fetch for rankings when top-N filter changes
  const loadRankings = useCallback(async () => {
    const computedFilters = { dateFrom, dateTo, branchIds: branchIdsFilter };
    const rnk = await intelligenceService.rankings(computedFilters, rankTop);
    setState((prev) => ({
      ...prev,
      rankings:
        rnk && typeof rnk === "object" && !Array.isArray(rnk) ? rnk : null,
    }));
  }, [dateFrom, dateTo, branchIdsFilter, rankTop]);

  useEffect(() => {
    void analyticsService.getBranches().then((branches) => {
      setState((prev) => ({ ...prev, branches }));
    });
    void intelligenceService.availableServices().then((data) => {
      const normalized = (data as unknown[])
        .map(normalizeService)
        .filter(Boolean);
      // Always keep "All" as the first chip (the API list does not include
      // it), and dedupe in case the fallback catalog overlaps.
      const unique = Array.from(
        new Set(normalized.filter((s) => s.toLowerCase() !== "all"))
      );
      setState((prev) => ({
        ...prev,
        services: ["All", ...unique],
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

  return { ...state, reload: load };
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
