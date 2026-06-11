/**
 * ChatAnalyticsView tests
 *  - renders KPI cards from the summary
 *  - renders all chart sections
 *  - donut legend shows values + percentages, total in the center
 *  - single-channel bar chart renders one slim bar (capped width)
 *  - y-axis ticks are unique (no "1 1 2 2" duplicates)
 *  - error banner + retry
 *  - empty states
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown> | string) => {
      if (typeof opts === "string") return opts;
      if (typeof opts === "object" && typeof opts?.defaultValue === "string")
        return opts.defaultValue as string;
      return key;
    },
    i18n: { dir: () => "ltr", resolvedLanguage: "en", language: "en" },
  }),
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(() => ({
    hasPermission: jest.fn(() => true),
    isAdmin: false,
    user: { name: "Sales", role: "user" },
  })),
}));

const summary = {
  total_conversations: 16,
  total_messages: 206,
  active_users: 1,
  avg_response_time_ms: 105,
  gemini_cost: 0.42,
  cost_period_label: "This month",
};
const overTime = [
  { label: "Sun", value: 2 },
  { label: "Wed", value: 2 },
];
const intents = [
  { label: "Visitor count", value: 44 },
  { label: "Daily report", value: 23 },
];
const channels = [{ label: "Web", value: 206 }];
const langs = [
  { label: "en", value: 88 },
  { label: "ar", value: 118 },
];
const hourly = [
  { label: "3 AM", value: 1 },
  { label: "10 AM", value: 6 },
  { label: "12 PM", value: 52 },
];

jest.mock("@/services/chatAnalyticsService", () => ({
  chatAnalyticsService: {
    summary: jest.fn(),
    conversationsOverTime: jest.fn(),
    intentDistribution: jest.fn(),
    messagesByChannel: jest.fn(),
    languageDistribution: jest.fn(),
    hourlyActivity: jest.fn(),
  },
}));

import { chatAnalyticsService } from "@/services/chatAnalyticsService";
import ChatAnalyticsView from "@/views/ChatAnalyticsView";

const svc = chatAnalyticsService as jest.Mocked<typeof chatAnalyticsService>;

function mockHappyPath() {
  (svc.summary as jest.Mock).mockResolvedValue(summary);
  (svc.conversationsOverTime as jest.Mock).mockResolvedValue(overTime);
  (svc.intentDistribution as jest.Mock).mockResolvedValue(intents);
  (svc.messagesByChannel as jest.Mock).mockResolvedValue(channels);
  (svc.languageDistribution as jest.Mock).mockResolvedValue(langs);
  (svc.hourlyActivity as jest.Mock).mockResolvedValue(hourly);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHappyPath();
});

describe("ChatAnalyticsView", () => {
  it("renders the page header and KPI cards", async () => {
    render(<ChatAnalyticsView />);
    expect(screen.getByText("Chat Analytics")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("16")).toBeInTheDocument(),
    );
    expect(screen.getByText("105ms")).toBeInTheDocument();
    expect(screen.getByText("$0.42")).toBeInTheDocument();
  });

  it("renders all five chart sections", async () => {
    render(<ChatAnalyticsView />);
    await waitFor(() =>
      expect(
        screen.getByText("chatAnalytics.conversationsOverTime"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("chatAnalytics.intentDistribution")).toBeInTheDocument();
    expect(screen.getByText("chatAnalytics.messagesByChannel")).toBeInTheDocument();
    expect(screen.getByText("chatAnalytics.languageDistribution")).toBeInTheDocument();
    expect(screen.getByText("chatAnalytics.hourlyActivity")).toBeInTheDocument();
  });

  it("shows the language donut with total, values and percentages", async () => {
    const { container } = render(<ChatAnalyticsView />);
    // 206 appears both as the messages KPI and the donut center total
    await waitFor(() =>
      expect(screen.getAllByText("206").length).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getByText("en")).toBeInTheDocument();
    expect(screen.getByText("ar")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("118")).toBeInTheDocument();
    // 88/206 and 118/206
    expect(screen.getAllByText("42.7%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("57.3%").length).toBeGreaterThanOrEqual(1);
    // Slice paths exist and are separated from each other (card-colored stroke)
    const paths = container.querySelectorAll('path[stroke-linejoin="round"]');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it("caps the single-channel bar width instead of a full-width slab", async () => {
    const { container } = render(<ChatAnalyticsView />);
    await waitFor(() => expect(screen.getByText("Web")).toBeInTheDocument());
    const bars = Array.from(
      container.querySelectorAll('rect[fill="url(#colGrad)"]'),
    );
    expect(bars.length).toBeGreaterThanOrEqual(1);
    for (const bar of bars) {
      expect(Number(bar.getAttribute("width"))).toBeLessThanOrEqual(48);
    }
  });

  it("renders unique y-axis tick labels for the area chart", async () => {
    const { container } = render(<ChatAnalyticsView />);
    await waitFor(() => expect(screen.getByText("Sun")).toBeInTheDocument());
    const tickTexts = Array.from(
      container.querySelectorAll('svg text[text-anchor="end"]'),
    ).map((el) => el.textContent);
    expect(tickTexts.length).toBeGreaterThanOrEqual(2);
    expect(new Set(tickTexts).size).toBe(tickTexts.length);
  });

  it("shows the error banner and retries on click", async () => {
    (svc.summary as jest.Mock).mockRejectedValueOnce(new Error("Network down"));
    render(<ChatAnalyticsView />);
    await waitFor(() =>
      expect(screen.getByText("Network down")).toBeInTheDocument(),
    );

    mockHappyPath();
    fireEvent.click(screen.getByText("common.retry"));
    await waitFor(() =>
      expect(screen.queryByText("Network down")).not.toBeInTheDocument(),
    );
    expect((await screen.findAllByText("206")).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty states when the API returns no series data", async () => {
    (svc.conversationsOverTime as jest.Mock).mockResolvedValue([]);
    (svc.messagesByChannel as jest.Mock).mockResolvedValue([]);
    (svc.languageDistribution as jest.Mock).mockResolvedValue([]);
    (svc.hourlyActivity as jest.Mock).mockResolvedValue([]);
    (svc.intentDistribution as jest.Mock).mockResolvedValue([]);
    render(<ChatAnalyticsView />);
    await waitFor(() =>
      expect(screen.getAllByText("No data for this period").length).toBe(5),
    );
  });

  it("reloads data when the refresh button is clicked", async () => {
    render(<ChatAnalyticsView />);
    await waitFor(() => expect(svc.summary).toHaveBeenCalledTimes(1));
    // The refresh button is disabled while loading — wait for it to enable.
    const refreshBtn = screen.getByLabelText("common.refresh");
    await waitFor(() => expect(refreshBtn).not.toBeDisabled());
    fireEvent.click(refreshBtn);
    await waitFor(() => expect(svc.summary).toHaveBeenCalledTimes(2));
  });
});
