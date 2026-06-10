"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Clock,
  DollarSign,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
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
const LANG_COLORS = ["#1e3a8a", "#22d3ee"];

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

  /* fetch analytics */
  useEffect(() => {
    let cancelled = false;
    const f = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
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
    });
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

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
          <DonutChart slices={coloredLangs} />
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
  const maxVal = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i): [number, number] => [
    PL + i * step,
    PT + (1 - p.value / maxVal) * innerH,
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

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

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

      {/* horizontal grid lines + y labels */}
      {yTicks.map((t) => {
        const y = PT + (1 - t) * innerH;
        return (
          <g key={t}>
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
              {Math.round(maxVal * t)}
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
  const max = Math.max(1, ...points.map((p) => p.value));
  const slotW = W / points.length;
  const barW = Math.max(8, slotW * 0.55);

  return (
    <svg
      viewBox={`0 0 ${W} ${H + PB}`}
      className="w-full"
    >
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
        const barH = Math.max(3, (p.value / max) * innerH);
        const x = slotW * i + (slotW - barW) / 2;
        const y = PT + innerH - barH;
        return (
          <g key={i}>
            {/* bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill="#1e3a8a"
              rx="3"
              opacity="0.82"
            />
            {/* value on top */}
            <text
              x={x + barW / 2}
              y={y - 5}
              fontSize={dense ? "10" : "11"}
              textAnchor="middle"
              fill="currentColor"
              opacity="0.75"
              fontWeight="600"
            >
              {p.value}
            </text>
            {/* x-label */}
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
          </g>
        );
      })}
    </svg>
  );
}

/* ─── DonutChart ─────────────────────────────────────────────────────────── */
interface DonutPath {
  d: string;
  color: string;
  pctLabel: string;
  lx: number;
  ly: number;
  label: string;
  value: number;
}

function DonutChart({ slices }: { slices: DistributionSlice[] }) {
  if (!slices.length) return <EmptyChart />;

  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 70,
    r = 44,
    cx = 100,
    cy = 100;
  let acc = 0;

  const paths = slices
    .map((s): DonutPath | null => {
      const pct = s.value / total;
      const start = acc * Math.PI * 2;
      acc += pct;
      const end = acc * Math.PI * 2;
      if (end - start < 0.001) return null;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + R * Math.sin(start),
        y1 = cy - R * Math.cos(start);
      const x2 = cx + R * Math.sin(end),
        y2 = cy - R * Math.cos(end);
      const x3 = cx + r * Math.sin(end),
        y3 = cy - r * Math.cos(end);
      const x4 = cx + r * Math.sin(start),
        y4 = cy - r * Math.cos(start);
      const mid = (start + end) / 2;
      const lx = cx + ((R + r) / 2) * Math.sin(mid);
      const ly = cy - ((R + r) / 2) * Math.cos(mid);
      return {
        d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`,
        color: s.color ?? "#888",
        pctLabel: `${(pct * 100).toFixed(1)}%`,
        lx,
        ly,
        label: s.label,
        value: s.value,
      };
    })
    .filter((p): p is DonutPath => p !== null);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 200 200"
        className="h-44 w-44"
      >
        {paths.map((p, i) => (
          <g key={i}>
            <path
              d={p.d}
              fill={p.color}
            />
            <text
              x={p.lx}
              y={p.ly}
              fontSize="10"
              textAnchor="middle"
              fill="white"
              fontWeight="700"
              dominantBaseline="middle"
            >
              {p.pctLabel}
            </text>
          </g>
        ))}
        <text
          x="100"
          y="96"
          fontSize="18"
          textAnchor="middle"
          fill="currentColor"
          fontWeight="700"
        >
          {total}
        </text>
        <text
          x="100"
          y="112"
          fontSize="9"
          textAnchor="middle"
          fill="currentColor"
          opacity="0.45"
        >
          total
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {slices.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold tabular-nums">{s.value}</span>
          </span>
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
        const pct = Math.round((s.value / total) * 100);
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
  return (
    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground opacity-40">
      — no data —
    </div>
  );
}
