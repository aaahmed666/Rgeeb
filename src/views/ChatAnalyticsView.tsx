"use client";

import {
  Fragment as FragmentWithKey,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Clock,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import {
  chatAnalyticsService,
  type ChatSummary,
  type ConversationLog,
  type DistributionSlice,
  type Paginated,
  type SeriesPoint,
} from "@/services/chatAnalyticsService";

const INTENT_COLORS = [
  "#1e3a8a",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
  "#8b5cf6",
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#a855f7",
];

export default function ChatAnalyticsView() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const [channel, setChannel] = useState("all");
  const [intent, setIntent] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [overTime, setOverTime] = useState<SeriesPoint[]>([]);
  const [intents, setIntents] = useState<DistributionSlice[]>([]);
  const [channels, setChannels] = useState<SeriesPoint[]>([]);
  const [langs, setLangs] = useState<DistributionSlice[]>([]);
  const [hourly, setHourly] = useState<SeriesPoint[]>([]);
  const [logs, setLogs] = useState<Paginated<ConversationLog> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const baseFilters = useMemo(() => ({}), []);
  const logFilters = useMemo(
    () => ({ channel, intent, search, page, perPage }),
    [channel, intent, search, page]
  );

  const loadCore = useCallback(async () => {
    const [s, ot, it, ch, lg, hr] = await Promise.all([
      chatAnalyticsService.summary(baseFilters),
      chatAnalyticsService.conversationsOverTime(baseFilters),
      chatAnalyticsService.intentDistribution(baseFilters),
      chatAnalyticsService.messagesByChannel(baseFilters),
      chatAnalyticsService.languageDistribution(baseFilters),
      chatAnalyticsService.hourlyActivity(baseFilters),
    ]);
    setSummary(s);
    setOverTime(ot);
    setIntents(it);
    setChannels(ch);
    setLangs(lg);
    setHourly(hr);
  }, [baseFilters]);

  const loadLogs = useCallback(async () => {
    const l = await chatAnalyticsService.conversations(logFilters);
    setLogs(l);
  }, [logFilters]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);
  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const totalPages = logs
    ? Math.max(1, Math.ceil(logs.total / logs.per_page))
    : 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("chatAnalytics.title", "Chat Analytics")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "chatAnalytics.subtitle",
            "Monitor your AI assistant performance and user interactions"
          )}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("chatAnalytics.totalConversations", "Total Conversations")}
          value={summary?.total_conversations ?? 0}
          icon={MessagesSquare}
          tone="indigo"
        />
        <StatCard
          label={t("chatAnalytics.totalMessages", "Total Messages")}
          value={summary?.total_messages ?? 0}
          icon={MessageSquare}
          tone="sky"
        />
        <StatCard
          label={t("chatAnalytics.activeUsers", "Active Users")}
          value={summary?.active_users ?? 0}
          icon={Users}
          tone="emerald"
        />
        <StatCard
          label={t("chatAnalytics.avgResponseTime", "Avg Response Time")}
          value={`${summary?.avg_response_time_ms ?? 0}ms`}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label={t("chatAnalytics.geminiCost", "Gemini Cost")}
          value={`$${(summary?.gemini_cost ?? 0).toFixed(2)}`}
          sub={
            summary?.cost_period_label ??
            t("chatAnalytics.thisMonth", "This month")
          }
          icon={DollarSign}
          tone="rose"
        />
      </div>

      {/* Conversations over time + Intent distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <h3 className="mb-4 text-base font-semibold">
            {t(
              "chatAnalytics.conversationsOverTime",
              "Conversations Over Time"
            )}
          </h3>
          <AreaChart points={overTime} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">
            {t("chatAnalytics.intentDistribution", "Intent Distribution")}
          </h3>
          <PieChart slices={withColors(intents)} />
        </Card>
      </div>

      {/* Channels + Languages + Hourly */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">
            {t("chatAnalytics.messagesByChannel", "Messages by Channel")}
          </h3>
          <BarChart points={channels} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">
            {t("chatAnalytics.languageDistribution", "Language Distribution")}
          </h3>
          <DonutChart
            slices={langs.map((l, i) => ({
              ...l,
              color: l.color ?? (i === 0 ? "#0c2340" : "#22d3ee"),
            }))}
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">
            {t("chatAnalytics.hourlyActivity", "Hourly Activity")}
          </h3>
          <BarChart
            points={hourly}
            dense
          />
        </Card>
      </div>

      {/* Conversation Logs */}
      <Card className="p-5">
        <h3 className="mb-4 text-base font-semibold">
          {t("chatAnalytics.conversationLogs", "Conversation Logs")}
        </h3>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t(
                "chatAnalytics.searchPlaceholder",
                "Search by customer..."
              )}
              className="ps-9"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("chatAnalytics.channel", "Channel")}
            </label>
            <Select
              value={channel}
              onValueChange={(v) => {
                setChannel(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("chatAnalytics.intent", "Intent")}
            </label>
            <Select
              value={intent}
              onValueChange={(v) => {
                setIntent(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                {intents.map((i) => (
                  <SelectItem
                    key={i.label}
                    value={i.label.toLowerCase()}
                  >
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          data={logs?.data ?? []}
          emptyMessage={t("common.noData", "No data")}
          columns={[
            {
              key: "expand",
              header: "",
              headClassName: "w-8",
              render: (row) => (
                <button
                  onClick={() =>
                    setExpanded(expanded === row.id ? null : row.id)
                  }
                  className="text-muted-foreground"
                >
                  {expanded === row.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              ),
            },
            {
              key: "customer",
              header: t("chatAnalytics.customer", "Customer"),
              render: (row) => (
                <span className="font-medium">{row.customer}</span>
              ),
            },
            {
              key: "channel",
              header: t("chatAnalytics.channel", "Channel"),
              render: (row) => (
                <Badge
                  variant="outline"
                  className="border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                >
                  {row.channel}
                </Badge>
              ),
            },
            {
              key: "language",
              header: t("chatAnalytics.language", "Language"),
              render: (row) => <Badge variant="outline">{row.language}</Badge>,
            },
            {
              key: "intent",
              header: t("chatAnalytics.intent", "Intent"),
              render: (row) => (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  {row.intent}
                </Badge>
              ),
            },
            {
              key: "response_time",
              header: t("chatAnalytics.responseTime", "Response Time"),
              render: (row) => <span>{row.response_time_ms}ms</span>,
            },
            {
              key: "ai_usage",
              header: t("chatAnalytics.aiUsage", "AI Usage"),
              render: (row) => (
                <span className="text-muted-foreground">
                  {row.ai_tokens} tokens (${row.ai_cost.toFixed(4)})
                </span>
              ),
            },
            {
              key: "date",
              header: t("chatAnalytics.date", "Date"),
              render: (row) => (
                <span className="text-muted-foreground">
                  {formatDate(row.date, isRTL)}
                </span>
              ),
            },
          ]}
        />

        <div className="mt-3 flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>
            {t("chatAnalytics.rowsPerPage", "Rows per page:")}{" "}
            {logs?.per_page ?? perPage}
          </span>
          <span>
            {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, logs?.total ?? 0)} {t("common.of", "of")}{" "}
            {logs?.total ?? 0}
          </span>
          <button
            className="rounded border px-2 py-1 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <button
            className="rounded border px-2 py-1 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- helpers + viz ---------------- */

function withColors(slices: DistributionSlice[]): DistributionSlice[] {
  return slices.map((s, i) => ({
    ...s,
    color: s.color ?? INTENT_COLORS[i % INTENT_COLORS.length],
  }));
}

function formatDate(iso: string, rtl: boolean) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return rtl ? `${yyyy}/${mm}/${dd}` : `${dd}/${mm}/${yyyy}`;
}

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
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {sub && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
        )}
      </div>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          tones[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}

function AreaChart({ points }: { points: SeriesPoint[] }) {
  const w = 800,
    h = 240,
    pad = 32;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map(
    (p, i) =>
      [pad + i * step, h - pad - (p.value / max) * (h - pad * 2)] as const
  );
  const path = coords.length
    ? `M ${coords[0][0]} ${coords[0][1]} ` +
      coords
        .slice(1)
        .map(([x, y], i) => {
          const [px, py] = coords[i];
          const cx = (px + x) / 2;
          return `C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
        })
        .join(" ")
    : "";
  const fill = coords.length
    ? `${path} L ${coords[coords.length - 1][0]} ${h - pad} L ${coords[0][0]} ${h - pad} Z`
    : "";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
    >
      <defs>
        <linearGradient
          id="caArea"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#1e3a8a"
            stopOpacity="0.35"
          />
          <stop
            offset="100%"
            stopColor="#1e3a8a"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={w - pad}
          y1={pad + t * (h - pad * 2)}
          y2={pad + t * (h - pad * 2)}
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeDasharray="3 3"
        />
      ))}
      {fill && (
        <path
          d={fill}
          fill="url(#caArea)"
        />
      )}
      {path && (
        <path
          d={path}
          stroke="#1e3a8a"
          strokeWidth="2.5"
          fill="none"
        />
      )}
      {points.map((p, i) => (
        <text
          key={i}
          x={pad + i * step}
          y={h - 8}
          fontSize="11"
          textAnchor="middle"
          fill="currentColor"
          opacity="0.6"
        >
          {p.label}
        </text>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((tt) => (
        <text
          key={tt}
          x={pad - 6}
          y={h - pad - tt * (h - pad * 2) + 4}
          fontSize="11"
          textAnchor="end"
          fill="currentColor"
          opacity="0.5"
        >
          {Math.round(max * tt)}
        </text>
      ))}
    </svg>
  );
}

function BarChart({
  points,
  dense,
}: {
  points: SeriesPoint[];
  dense?: boolean;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="space-y-2">
      <div className={cn("flex items-end gap-2", dense ? "h-44" : "h-56")}>
        {points.map((p) => (
          <div
            key={p.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="relative w-full flex-1">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t bg-[#1e3a8a]"
                style={{ height: `${(p.value / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChart({ slices }: { slices: DistributionSlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 70,
    cx = 100,
    cy = 100;
  let acc = 0;
  const paths = slices.map((s) => {
    const start = (acc / total) * Math.PI * 2;
    acc += s.value;
    const end = (acc / total) * Math.PI * 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.sin(start);
    const y1 = cy - r * Math.cos(start);
    const x2 = cx + r * Math.sin(end);
    const y2 = cy - r * Math.cos(end);
    const mid = (start + end) / 2;
    const lx = cx + r * 0.65 * Math.sin(mid);
    const ly = cy - r * 0.65 * Math.cos(mid);
    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: s.color ?? "#888",
      label: `${((s.value / total) * 100).toFixed(1)}%`,
      lx,
      ly,
      name: s.label,
    };
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-48"
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
              fontSize="9"
              textAnchor="middle"
              fill="white"
              fontWeight="700"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px]">
        {slices.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ slices }: { slices: DistributionSlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 70,
    r = 42,
    cx = 100,
    cy = 100;
  let acc = 0;
  const paths = slices.map((s) => {
    const start = (acc / total) * Math.PI * 2;
    acc += s.value;
    const end = (acc / total) * Math.PI * 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.sin(start);
    const y1 = cy - R * Math.cos(start);
    const x2 = cx + R * Math.sin(end);
    const y2 = cy - R * Math.cos(end);
    const x3 = cx + r * Math.sin(end);
    const y3 = cy - r * Math.cos(end);
    const x4 = cx + r * Math.sin(start);
    const y4 = cy - r * Math.cos(start);
    const mid = (start + end) / 2;
    const lx = cx + ((R + r) / 2) * Math.sin(mid);
    const ly = cy - ((R + r) / 2) * Math.cos(mid);
    return {
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`,
      color: s.color,
      label: `${((s.value / total) * 100).toFixed(1)}%`,
      lx,
      ly,
    };
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 200 200"
        className="h-48 w-48"
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
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px]">
        {slices.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
