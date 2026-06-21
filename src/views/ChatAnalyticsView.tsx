"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  Users,
  Clock,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  barLayout,
  donutSegments,
  labelStep,
  niceTicks,
  pctOf,
} from "@/lib/chartMath";
import {
  chatAnalyticsService,
  type ChatSummary,
  type DistributionSlice,
  type SeriesPoint,
} from "@/services/chatAnalyticsService";

/* ─── Colour palette ─────────────────────────────────────────────────────── */
const INTENT_COLORS = [
  "#1e3a8a",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f97316",
  "#a855f7",
];
const LANG_COLORS = ["#1e3a8a", "#0ea5e9"];

/* ─── Main view ──────────────────────────────────────────────────────────── */
export default function ChatAnalyticsView() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const isRTL = i18n.dir() === "rtl";

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [overTime, setOverTime] = useState<SeriesPoint[]>([]);
  const [intents, setIntents] = useState<DistributionSlice[]>([]);
  const [channels, setChannels] = useState<SeriesPoint[]>([]);
  const [langs, setLangs] = useState<DistributionSlice[]>([]);
  const [hourly, setHourly] = useState<SeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* fetch analytics — `t` is read via a ref so a new translation-function
     identity (e.g. on language change/re-render) never re-triggers fetching */
  const tRef = React.useRef(t);
  tRef.current = t;
  const loadData = useCallback(() => {
    let cancelled = false;
    const f = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
    setLoading(true);
    setLoadError(null);
    void Promise.all([
      chatAnalyticsService.summary(f),
      chatAnalyticsService.conversationsOverTime(f),
      chatAnalyticsService.intentDistribution(f),
      chatAnalyticsService.messagesByChannel(f),
      chatAnalyticsService.languageDistribution(f),
      chatAnalyticsService.hourlyActivity(f),
    ]).then(([s, ot, it, ch, lg, hr]) => {
      if (cancelled) return;
      setSummary(s);
      setOverTime(ot);
      setIntents(it);
      setChannels(ch);
      setLangs(lg);
      setHourly(hr);
    }).catch((err) => {
      if (!cancelled) setLoadError(err instanceof Error ? err.message : tRef.current("errors.somethingWentWrong", "Something went wrong"));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dateFrom, dateTo]);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  const coloredIntents = useMemo(
    () =>
      intents.map((s, i) => ({
        ...s,
        color: s.color ?? INTENT_COLORS[i % INTENT_COLORS.length],
      })),
    [intents]
  );
  const coloredLangs = useMemo(
    () =>
      langs.map((l, i) => ({
        ...l,
        color: l.color ?? LANG_COLORS[i % LANG_COLORS.length],
      })),
    [langs]
  );

  return (
    <div
      className="space-y-6 p-4 md:p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("chatAnalytics.title", "Chat Analytics")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              "chatAnalytics.subtitle",
              "Monitor your AI assistant performance and user interactions"
            )}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => loadData()} disabled={loading} aria-label={t("common.refresh")}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error banner */}
      {loadError && !loading && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <button onClick={() => loadData()} className="ml-4 rounded-md bg-destructive/20 px-3 py-1 text-xs font-medium hover:bg-destructive/30">
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t("chatAnalytics.totalConversations")}
          value={summary?.total_conversations ?? 0}
          icon={MessagesSquare}
          tone="indigo"
        />
        <StatCard
          label={t("chatAnalytics.totalMessages")}
          value={summary?.total_messages ?? 0}
          icon={MessageSquare}
          tone="sky"
        />
        <StatCard
          label={t("chatAnalytics.activeUsers")}
          value={summary?.active_users ?? 0}
          icon={Users}
          tone="emerald"
        />
        <StatCard
          label={t("chatAnalytics.avgResponseTime")}
          value={`${summary?.avg_response_time_ms ?? 0}ms`}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label={t("chatAnalytics.geminiCost")}
          value={`$${(summary?.gemini_cost ?? 0).toFixed(2)}`}
          sub={summary?.cost_period_label ?? t("chatAnalytics.thisMonth")}
          icon={DollarSign}
          tone="rose"
        />
      </div>

      {/* Conversations over time + Intent distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("chatAnalytics.conversationsOverTime")}
          </h3>
          <AreaChart points={overTime} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("chatAnalytics.intentDistribution")}
          </h3>
          <IntentBarList slices={coloredIntents} />
        </Card>
      </div>

      {/* Channel + Language + Hourly */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("chatAnalytics.messagesByChannel")}
          </h3>
          <ColumnChart points={channels} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("chatAnalytics.languageDistribution")}
          </h3>
          <DonutChart
            slices={coloredLangs}
            totalLabel={t("common.total", "Total")}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("chatAnalytics.hourlyActivity")}
          </h3>
          <ColumnChart
            points={hourly}
            dense
          />
        </Card>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/* ─── StatCard ───────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone: "indigo" | "sky" | "emerald" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  };
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground leading-tight">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
        {sub && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
        )}
      </div>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tones[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}

/* ─── AreaChart ──────────────────────────────────────────────────────────── */
function AreaChart({ points }: { points: SeriesPoint[] }) {
  if (!points.length) return <EmptyChart />;

  const W = 800,
    H = 220,
    PL = 48,
    PR = 20,
    PT = 24,
    PB = 36;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const dataMax = Math.max(0, ...points.map((p) => p.value));
  const { ticks, niceMax } = niceTicks(dataMax, 5);
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i): [number, number] => [
    points.length > 1 ? PL + i * step : PL + innerW / 2,
    PT + (1 - p.value / niceMax) * innerH,
  ]);

  const linePath = coords
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = coords[i - 1];
      const cx = (px + x) / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(" ");

  const areaPath =
    linePath +
    ` L ${coords[coords.length - 1][0]} ${H - PB}` +
    ` L ${coords[0][0]} ${H - PB} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient
          id="areaGrad"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#1e3a8a"
            stopOpacity="0.22"
          />
          <stop
            offset="100%"
            stopColor="#1e3a8a"
            stopOpacity="0.01"
          />
        </linearGradient>
      </defs>

      {/* horizontal grid lines + y labels (integer, no duplicates) */}
      {ticks.map((tick) => {
        const y = PT + (1 - tick / niceMax) * innerH;
        return (
          <g key={tick}>
            <line
              x1={PL}
              x2={W - PR}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeDasharray="4 3"
            />
            <text
              x={PL - 8}
              y={y + 4}
              fontSize="11"
              textAnchor="end"
              fill="currentColor"
              opacity="0.45"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* area + line */}
      <path
        d={areaPath}
        fill="url(#areaGrad)"
      />
      <path
        d={linePath}
        stroke="#1e3a8a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* dots, x-labels, value labels */}
      {coords.map(([x, y], i) => (
        <g key={i}>
          {/* value above dot */}
          <text
            x={x}
            y={y - 10}
            fontSize="11"
            textAnchor="middle"
            fill="#1e3a8a"
            fontWeight="700"
            opacity="0.9"
          >
            {points[i].value}
          </text>
          {/* dot outer */}
          <circle
            cx={x}
            cy={y}
            r="5"
            fill="#1e3a8a"
            opacity="0.2"
          />
          {/* dot inner */}
          <circle
            cx={x}
            cy={y}
            r="3.5"
            fill="#1e3a8a"
          />
          <circle
            cx={x}
            cy={y}
            r="1.5"
            fill="white"
          />
          {/* x label */}
          <text
            x={x}
            y={H - 6}
            fontSize="11"
            textAnchor="middle"
            fill="currentColor"
            opacity="0.55"
          >
            {points[i].label}
          </text>
        </g>
      ))}

      {/* baseline */}
      <line
        x1={PL}
        x2={W - PR}
        y1={H - PB}
        y2={H - PB}
        stroke="currentColor"
        strokeOpacity="0.1"
      />
    </svg>
  );
}

/* ─── ColumnChart (bar with value labels on top) ─────────────────────────── */
function ColumnChart({
  points,
  dense,
}: {
  points: SeriesPoint[];
  dense?: boolean;
}) {
  if (!points.length) return <EmptyChart />;

  const W = 400,
    H = dense ? 160 : 180,
    PB = 28,
    PT = 20;
  const innerH = H - PB - PT;
  const dataMax = Math.max(0, ...points.map((p) => p.value));
  const { niceMax } = niceTicks(dataMax, 4);
  const { slotW, barW } = barLayout(points.length, W, {
    maxBarWidth: dense ? 28 : 48,
  });
  const xStep = labelStep(points.length, dense ? 6 : 8);

  return (
    <svg
      viewBox={`0 0 ${W} ${H + PB}`}
      className="w-full"
    >
      <defs>
        <linearGradient id="colGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#3b5bdb" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* baseline */}
      <line
        x1="0"
        x2={W}
        y1={H}
        y2={H}
        stroke="currentColor"
        strokeOpacity="0.1"
      />

      {points.map((p, i) => {
        const barH = Math.max(3, (p.value / niceMax) * innerH);
        const x = slotW * i + (slotW - barW) / 2;
        const y = PT + innerH - barH;
        const showXLabel = i % xStep === 0 || points.length <= 8;
        return (
          <g key={i}>
            {/* slot track (subtle, grounds short bars) */}
            <rect
              x={x}
              y={PT}
              width={barW}
              height={innerH}
              fill="currentColor"
              opacity="0.035"
              rx="5"
            />
            {/* bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill="url(#colGrad)"
              rx="5"
            />
            {/* value on top */}
            <text
              x={x + barW / 2}
              y={y - 6}
              fontSize={dense ? "10" : "11"}
              textAnchor="middle"
              fill="currentColor"
              opacity="0.75"
              fontWeight="600"
            >
              {p.value}
            </text>
            {/* x-label (skipped when crowded) */}
            {showXLabel && (
              <text
                x={x + barW / 2}
                y={H + 18}
                fontSize={dense ? "9" : "10"}
                textAnchor="middle"
                fill="currentColor"
                opacity="0.5"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── DonutChart ─────────────────────────────────────────────────────────── */
function DonutChart({
  slices,
  totalLabel = "Total",
}: {
  slices: DistributionSlice[];
  totalLabel?: string;
}) {
  if (!slices.length) return <EmptyChart />;

  const { segments, total } = donutSegments(slices, {
    outerRadius: 78,
    innerRadius: 52,
    labelThreshold: 0.1,
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <svg
        viewBox="-40 0 280 200"
        className="h-48 w-64 max-w-full"
      >
        {/* track ring (visible while slices are tiny / single-slice) */}
        <circle
          cx="100"
          cy="100"
          r="65"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="26"
        />
        {segments.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.color}
            stroke="var(--card, #fff)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}

        {/* Outside % callouts — leader line + label, coloured per slice so
            they read cleanly off the ring instead of overlapping it. */}
        {segments.map((p, i) => {
          if (!p.showLabel) return null;
          const R = 78; // outerRadius used above
          const sin = Math.sin(p.mid);
          const cos = Math.cos(p.mid);
          const right = sin >= 0;
          const x1 = 100 + (R + 1) * sin;
          const y1 = 100 - (R + 1) * cos;
          const xKnee = 100 + (R + 15) * sin;
          const yKnee = 100 - (R + 15) * cos;
          const xTail = xKnee + (right ? 10 : -10);
          const xText = xTail + (right ? 3 : -3);
          return (
            <g key={`label-${i}`}>
              <path
                d={`M ${x1} ${y1} L ${xKnee} ${yKnee} L ${xTail} ${yKnee}`}
                fill="none"
                stroke={p.color}
                strokeOpacity="0.55"
                strokeWidth="1.25"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx={x1} cy={y1} r="1.6" fill={p.color} />
              <text
                x={xText}
                y={yKnee}
                fontSize="11"
                textAnchor={right ? "start" : "end"}
                fill={p.color}
                fontWeight="700"
                dominantBaseline="middle"
              >
                {p.pctLabel}
              </text>
            </g>
          );
        })}

        <text
          x="100"
          y="97"
          fontSize="22"
          textAnchor="middle"
          fill="currentColor"
          fontWeight="700"
          className="tabular-nums"
        >
          {total}
        </text>
        <text
          x="100"
          y="113"
          fontSize="9"
          textAnchor="middle"
          fill="currentColor"
          opacity="0.5"
          style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          {totalLabel}
        </text>
      </svg>

      <div className="flex w-full flex-col gap-2 text-xs">
        {segments.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="truncate font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums">
              <span className="font-semibold">{s.value}</span>
              <span className="w-12 rounded-md bg-muted px-1.5 py-0.5 text-center text-[11px] font-semibold text-muted-foreground">
                {s.pctLabel}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── IntentBarList (horizontal progress bars — much clearer than pie) ───── */
function IntentBarList({ slices }: { slices: DistributionSlice[] }) {
  if (!slices.length) return <EmptyChart />;
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="space-y-3">
      {slices.slice(0, 10).map((s) => {
        const pct = pctOf(s.value, total);
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="truncate text-muted-foreground">
                  {s.label}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-muted-foreground tabular-nums">
                  {s.value}
                </span>
                <span className="w-8 text-right font-semibold tabular-nums">
                  {pct}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: s.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── EmptyChart ─────────────────────────────────────────────────────────── */
function EmptyChart() {
  const { t } = useTranslation();
  return (
    <div className="flex h-36 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground/60">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" strokeLinecap="round" />
        <path d="M7 14l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs">{t("common.noDataForPeriod")}</span>
    </div>
  );
}
