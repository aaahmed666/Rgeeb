/**
 * chatAnalyticsService unit tests
 * Tests: API normalisation (camelCase + snake_case), demo fallback, pagination, cache
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    chatAnalytics: {
      all:           "/customer/chat-analytics",
      conversations: "/customer/chat-analytics/conversations",
    },
  },
}));

import { apiFetch } from "@/lib/api";
import { chatAnalyticsService } from "@/services/chatAnalyticsService";

const mockFetch = apiFetch as jest.Mock;

// Realistic API response — camelCase shape (actual API)
const CAMEL_PAYLOAD = {
  totalConversations: 16,
  totalMessages:      162,
  activeUsers:        1,
  avgResponseTime:    105,
  geminiCost:         0.42,
  conversationsByDay: [
    { date: "2026-05-20", count: 4 },
    { date: "2026-05-21", count: 7 },
  ],
  intentDistribution: [
    { intent: "visitor count", count: 44 },
    { intent: "daily report",  count: 23 },
  ],
  channelDistribution: [
    { channel: "Web", count: 162 },
  ],
  languageDistribution: [
    { language: "en", count: 71 },
    { language: "ar", count: 91 },
  ],
  hourlyActivity: [
    { hour: 10, count: 6 },
    { hour: 12, count: 52 },
  ],
};

// Alternative: nested snake_case shape
const SNAKE_PAYLOAD = {
  summary: {
    total_conversations: 20,
    total_messages: 200,
    active_users: 3,
    avg_response_time_ms: 120,
    gemini_cost: 0.55,
  },
  conversations_over_time: [{ label: "Mon", value: 5 }, { label: "Tue", value: 8 }],
  intent_distribution:     [{ label: "greeting", value: 30 }],
  messages_by_channel:     [{ label: "Web", value: 200 }],
  language_distribution:   [{ label: "en", value: 100 }],
  hourly_activity:         [{ label: "10 AM", value: 6 }],
};

const DEMO_LOGS = {
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
  ],
  total: 1,
  per_page: 10,
  current_page: 1,
};

beforeEach(() => jest.clearAllMocks());

// ─── summary ───────────────────────────────────────────────────────────────────

describe("chatAnalyticsService.summary", () => {
  test("normalises camelCase API payload", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const s = await chatAnalyticsService.summary({});
    expect(s.total_conversations).toBe(16);
    expect(s.total_messages).toBe(162);
    expect(s.active_users).toBe(1);
    expect(s.avg_response_time_ms).toBe(105);
    expect(s.gemini_cost).toBe(0.42);
  });

  test("normalises snake_case nested payload", async () => {
    mockFetch.mockResolvedValue({ data: SNAKE_PAYLOAD });
    const s = await chatAnalyticsService.summary({ dateFrom: "2026-03-01", dateTo: "2026-03-31" });
    expect(s.total_conversations).toBe(20);
    expect(s.gemini_cost).toBe(0.55);
  });

  test("returns demo summary on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const s = await chatAnalyticsService.summary({});
    expect(s.total_conversations).toBeGreaterThan(0);
    expect(s).toHaveProperty("total_messages");
    expect(s).toHaveProperty("active_users");
    expect(s).toHaveProperty("avg_response_time_ms");
    expect(s).toHaveProperty("gemini_cost");
  });

  test("all required fields present", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const s = await chatAnalyticsService.summary({});
    const required = ["total_conversations","total_messages","active_users","avg_response_time_ms","gemini_cost"];
    for (const k of required) expect(s).toHaveProperty(k);
  });
});

// ─── conversationsOverTime ────────────────────────────────────────────────────

describe("chatAnalyticsService.conversationsOverTime", () => {
  test("maps conversationsByDay to SeriesPoint[]", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const pts = await chatAnalyticsService.conversationsOverTime({});
    expect(pts.length).toBe(2);
    expect(pts[0].label).toBe("2026-05-20");
    expect(pts[0].value).toBe(4);
  });

  test("uses snake_case conversations_over_time when present", async () => {
    mockFetch.mockResolvedValue({ data: SNAKE_PAYLOAD });
    const pts = await chatAnalyticsService.conversationsOverTime({ dateFrom: "2026-02-01", dateTo: "2026-02-28" });
    expect(pts[0].label).toBe("Mon");
    expect(pts[0].value).toBe(5);
  });

  test("returns demo on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const pts = await chatAnalyticsService.conversationsOverTime({});
    expect(pts.length).toBeGreaterThan(0);
    for (const p of pts) {
      expect(p).toHaveProperty("label");
      expect(typeof p.value).toBe("number");
    }
  });
});

// ─── intentDistribution ────────────────────────────────────────────────────────

describe("chatAnalyticsService.intentDistribution", () => {
  test("maps intentDistribution from camelCase payload", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const intents = await chatAnalyticsService.intentDistribution({});
    expect(intents.length).toBe(2);
    expect(intents[0].label).toBe("visitor count");
    expect(intents[0].value).toBe(44);
  });

  test("returns demo intents on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const intents = await chatAnalyticsService.intentDistribution({});
    expect(intents.length).toBeGreaterThan(0);
    for (const i of intents) {
      expect(i).toHaveProperty("label");
      expect(typeof i.value).toBe("number");
    }
  });
});

// ─── messagesByChannel ────────────────────────────────────────────────────────

describe("chatAnalyticsService.messagesByChannel", () => {
  test("maps channelDistribution correctly", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const ch = await chatAnalyticsService.messagesByChannel({});
    expect(ch.length).toBe(1);
    expect(ch[0].label).toBe("Web");
    expect(ch[0].value).toBe(162);
  });

  test("returns demo channels on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const ch = await chatAnalyticsService.messagesByChannel({});
    expect(ch.length).toBeGreaterThan(0);
  });
});

// ─── languageDistribution ─────────────────────────────────────────────────────

describe("chatAnalyticsService.languageDistribution", () => {
  test("maps language distribution correctly", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const langs = await chatAnalyticsService.languageDistribution({});
    expect(langs.length).toBe(2);
    expect(langs.map(l => l.label)).toContain("en");
    expect(langs.map(l => l.label)).toContain("ar");
  });

  test("total values sum > 0", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const langs = await chatAnalyticsService.languageDistribution({});
    const total = langs.reduce((s, l) => s + l.value, 0);
    expect(total).toBeGreaterThan(0);
  });
});

// ─── hourlyActivity ───────────────────────────────────────────────────────────

describe("chatAnalyticsService.hourlyActivity", () => {
  test("maps hourlyActivity with hourLabel conversion", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const hourly = await chatAnalyticsService.hourlyActivity({});
    expect(hourly.length).toBe(2);
    // hour 10 → "10 AM", hour 12 → "12 PM"
    expect(hourly[0].label).toBe("10 AM");
    expect(hourly[1].label).toBe("12 PM");
  });

  test("returns demo on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const hourly = await chatAnalyticsService.hourlyActivity({});
    expect(hourly.length).toBeGreaterThan(0);
  });
});

// ─── conversations (logs) ──────────────────────────────────────────────────────

describe("chatAnalyticsService.conversations", () => {
  test("returns paginated logs", async () => {
    mockFetch.mockResolvedValue(DEMO_LOGS);
    const logs = await chatAnalyticsService.conversations({ page: 1, perPage: 10 });
    expect(logs.data.length).toBe(1);
    expect(logs.total).toBe(1);
    expect(logs.per_page).toBe(10);
    expect(logs.current_page).toBe(1);
  });

  test("normalises { data, meta } shape", async () => {
    mockFetch.mockResolvedValue({
      data: DEMO_LOGS.data,
      meta: { total: 50, per_page: 10, current_page: 2 },
    });
    const logs = await chatAnalyticsService.conversations({ page: 2, perPage: 10 });
    expect(logs.total).toBe(50);
    expect(logs.current_page).toBe(2);
  });

  test("logs contain required fields", async () => {
    mockFetch.mockResolvedValue(DEMO_LOGS);
    const logs = await chatAnalyticsService.conversations({});
    for (const l of logs.data) {
      expect(l).toHaveProperty("id");
      expect(l).toHaveProperty("customer");
      expect(l).toHaveProperty("channel");
      expect(l).toHaveProperty("intent");
      expect(l).toHaveProperty("response_time_ms");
      expect(l).toHaveProperty("ai_tokens");
      expect(l).toHaveProperty("ai_cost");
      expect(l).toHaveProperty("date");
    }
  });

  test("returns demo logs on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const logs = await chatAnalyticsService.conversations({});
    expect(logs.data.length).toBeGreaterThan(0);
    expect(logs).toHaveProperty("total");
    expect(logs).toHaveProperty("per_page");
  });
});

// ─── in-flight deduplication cache ────────────────────────────────────────────

describe("chatAnalyticsService cache", () => {
  test("parallel calls with same filters use cache (single fetch)", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    const filters = { dateFrom: "2026-06-01", dateTo: "2026-06-30" };
    await Promise.all([
      chatAnalyticsService.summary(filters),
      chatAnalyticsService.intentDistribution(filters),
      chatAnalyticsService.conversationsOverTime(filters),
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("different filters result in separate requests", async () => {
    mockFetch.mockResolvedValue({ data: CAMEL_PAYLOAD });
    await chatAnalyticsService.summary({ dateFrom: "2026-04-01", dateTo: "2026-04-30" });
    await chatAnalyticsService.summary({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
