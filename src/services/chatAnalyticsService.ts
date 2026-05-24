import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface ChatFilters {
  dateFrom?: string;
  dateTo?: string;
  channel?: string;
  intent?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ChatSummary {
  total_conversations: number;
  total_messages: number;
  active_users: number;
  avg_response_time_ms: number;
  gemini_cost: number;
  cost_period_label?: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DistributionSlice {
  label: string;
  value: number;
  color?: string;
}

export interface ConversationLog {
  id: string;
  customer: string;
  channel: string;
  language: string;
  intent: string;
  response_time_ms: number;
  ai_tokens: number;
  ai_cost: number;
  date: string;
  message?: string;
  response?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
}

// ---------- Demo fallbacks ----------
const demoSummary: ChatSummary = {
  total_conversations: 16,
  total_messages: 162,
  active_users: 1,
  avg_response_time_ms: 105,
  gemini_cost: 0,
  cost_period_label: "This month",
};

const demoOverTime: SeriesPoint[] = [
  { label: "Wed", value: 1 },
  { label: "Thu", value: 8 },
  { label: "Fri", value: 6 },
  { label: "Sun", value: 1 },
];

const demoIntents: DistributionSlice[] = [
  { label: "Visitor count", value: 44 },
  { label: "Daily report", value: 23 },
  { label: "Camera status", value: 22 },
  { label: "Unknown", value: 20 },
  { label: "Attendance", value: 15 },
  { label: "Branch info", value: 8 },
  { label: "Ppe violations", value: 6 },
  { label: "Greeting", value: 5 },
  { label: "Complaint", value: 5 },
  { label: "Fire smoke", value: 4 },
];

const demoChannels: SeriesPoint[] = [{ label: "Web", value: 162 }];

const demoLangs: DistributionSlice[] = [
  { label: "en", value: 71 },
  { label: "ar", value: 91 },
];

const demoHourly: SeriesPoint[] = [
  { label: "3 AM", value: 1 },
  { label: "10 AM", value: 6 },
  { label: "11 AM", value: 3 },
  { label: "12 PM", value: 52 },
  { label: "1 PM", value: 14 },
  { label: "2 PM", value: 23 },
  { label: "3 PM", value: 17 },
  { label: "5 PM", value: 44 },
  { label: "7 PM", value: 2 },
];

const demoLogs: Paginated<ConversationLog> = {
  data: [
    {
      id: "1",
      customer: "John Doe",
      channel: "web",
      language: "EN",
      intent: "visitor count",
      response_time_ms: 245,
      ai_tokens: 150,
      ai_cost: 0.003,
      date: "2026-05-22",
    },
    {
      id: "2",
      customer: "Ahmed Ali",
      channel: "whatsapp",
      language: "AR",
      intent: "camera status",
      response_time_ms: 189,
      ai_tokens: 120,
      ai_cost: 0.0024,
      date: "2026-05-21",
    },
  ],
  total: 2,
  per_page: 10,
  current_page: 1,
};

async function safe<T>(p: Promise<T>, fb: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fb;
  }
}
function unwrap<T>(r: T | { data: T }): T {
  return (
    r && typeof r === "object" && "data" in (r as object)
      ? (r as { data: T }).data
      : r
  ) as T;
}
function q(
  f: ChatFilters,
  extra: Record<string, string | number | undefined> = {}
) {
  return {
    date_from: f.dateFrom,
    date_to: f.dateTo,
    channel: f.channel && f.channel !== "all" ? f.channel : undefined,
    intent: f.intent && f.intent !== "all" ? f.intent : undefined,
    search: f.search || undefined,
    page: f.page,
    per_page: f.perPage,
    ...extra,
  };
}

// ---------- API raw shape (actual) ----------
interface ApiChatAnalyticsPayload {
  // camelCase flat (actual API)
  totalConversations?: number;
  totalMessages?: number;
  activeUsers?: number;
  avgResponseTime?: number;
  geminiCost?: number;
  conversationsByDay?: { date?: string; count?: number }[];
  intentDistribution?: {
    intent?: string;
    label?: string;
    count?: number;
    value?: number;
    percentage?: number;
  }[];
  channelDistribution?: {
    channel?: string;
    label?: string;
    count?: number;
    value?: number;
  }[];
  languageDistribution?: {
    language?: string;
    label?: string;
    count?: number;
    value?: number;
    percentage?: number;
  }[];
  hourlyActivity?: {
    hour?: number;
    label?: string;
    count?: number;
    value?: number;
  }[];
  // snake_case nested (expected)
  summary?: ChatSummary;
  conversations_over_time?: SeriesPoint[];
  intent_distribution?: DistributionSlice[];
  messages_by_channel?: SeriesPoint[];
  language_distribution?: DistributionSlice[];
  hourly_activity?: SeriesPoint[];
}

function hourLabel(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function normalizeChatPayload(
  raw: ApiChatAnalyticsPayload
): ChatAnalyticsPayload {
  const summary: ChatSummary = raw.summary ?? {
    total_conversations: raw.totalConversations ?? 0,
    total_messages: raw.totalMessages ?? 0,
    active_users: raw.activeUsers ?? 0,
    avg_response_time_ms: raw.avgResponseTime ?? 0,
    gemini_cost: raw.geminiCost ?? 0,
    cost_period_label: "This month",
  };

  const conversations_over_time: SeriesPoint[] =
    raw.conversations_over_time ??
    (raw.conversationsByDay ?? []).map((d) => ({
      label: String(d.date ?? ""),
      value: Number(d.count ?? 0),
    }));

  const intent_distribution: DistributionSlice[] =
    raw.intent_distribution ??
    (raw.intentDistribution ?? []).map((d) => ({
      label: String(d.intent ?? d.label ?? ""),
      value: Number(d.count ?? d.value ?? 0),
    }));

  const messages_by_channel: SeriesPoint[] =
    raw.messages_by_channel ??
    (raw.channelDistribution ?? []).map((d) => ({
      label: String(d.channel ?? d.label ?? ""),
      value: Number(d.count ?? d.value ?? 0),
    }));

  const language_distribution: DistributionSlice[] =
    raw.language_distribution ??
    (raw.languageDistribution ?? []).map((d) => ({
      label: String(d.language ?? d.label ?? ""),
      value: Number(d.count ?? d.value ?? 0),
    }));

  const hourly_activity: SeriesPoint[] =
    raw.hourly_activity ??
    (raw.hourlyActivity ?? []).map((d) => ({
      label: d.label ?? hourLabel(Number(d.hour ?? 0)),
      value: Number(d.count ?? d.value ?? 0),
    }));

  return {
    summary,
    conversations_over_time,
    intent_distribution,
    messages_by_channel,
    language_distribution,
    hourly_activity,
  };
}

interface ChatAnalyticsPayload {
  summary?: ChatSummary;
  conversations_over_time?: SeriesPoint[];
  intent_distribution?: DistributionSlice[];
  messages_by_channel?: SeriesPoint[];
  language_distribution?: DistributionSlice[];
  hourly_activity?: SeriesPoint[];
}

const cache = new Map<string, Promise<ChatAnalyticsPayload>>();

function fetchAll(f: ChatFilters): Promise<ChatAnalyticsPayload> {
  const key = JSON.stringify({
    d: f.dateFrom,
    t: f.dateTo,
    c: f.channel,
    i: f.intent,
  });
  const hit = cache.get(key);
  if (hit) return hit;
  const p = apiFetch<
    ApiChatAnalyticsPayload | { data: ApiChatAnalyticsPayload }
  >(endpoints.chatAnalytics.all, { query: q(f) })
    .then((r) => {
      const raw = (
        r && typeof r === "object" && "data" in r
          ? (r as { data: ApiChatAnalyticsPayload }).data
          : r
      ) as ApiChatAnalyticsPayload;
      return normalizeChatPayload(raw);
    })
    .catch(() => ({}) as ChatAnalyticsPayload);
  cache.set(key, p);
  setTimeout(() => cache.delete(key), 5000);
  return p;
}

export const chatAnalyticsService = {
  summary: (f: ChatFilters) =>
    safe(
      fetchAll(f).then((r) => r.summary ?? demoSummary),
      demoSummary
    ),
  conversationsOverTime: (f: ChatFilters) =>
    safe(
      fetchAll(f).then((r) => r.conversations_over_time ?? demoOverTime),
      demoOverTime
    ),
  intentDistribution: (f: ChatFilters) =>
    safe(
      fetchAll(f).then((r) => r.intent_distribution ?? demoIntents),
      demoIntents
    ),
  messagesByChannel: (f: ChatFilters) =>
    safe(
      fetchAll(f).then((r) => r.messages_by_channel ?? demoChannels),
      demoChannels
    ),
  languageDistribution: (f: ChatFilters) =>
    safe(
      fetchAll(f).then((r) => r.language_distribution ?? demoLangs),
      demoLangs
    ),
  hourlyActivity: (f: ChatFilters) =>
    safe(
      fetchAll(f).then((r) => r.hourly_activity ?? demoHourly),
      demoHourly
    ),
  conversations: (f: ChatFilters) =>
    safe(
      apiFetch<
        | Paginated<ConversationLog>
        | {
            data: ConversationLog[];
            meta?: { total: number; per_page: number; current_page: number };
          }
      >(endpoints.chatAnalytics.conversations, { query: q(f) }).then((r) => {
        if (Array.isArray((r as { data?: unknown }).data)) {
          const x = r as {
            data: ConversationLog[];
            meta?: { total: number; per_page: number; current_page: number };
          };
          return {
            data: x.data,
            total: x.meta?.total ?? x.data.length,
            per_page: x.meta?.per_page ?? f.perPage ?? 10,
            current_page: x.meta?.current_page ?? f.page ?? 1,
          } as Paginated<ConversationLog>;
        }
        return r as Paginated<ConversationLog>;
      }),
      demoLogs
    ),
};
