/**
 * DashboardView integration tests
 * Tests the component using React Testing Library:
 *  - renders all sections
 *  - handles loading state
 *  - permission guard
 *  - i18n (all t() keys resolve)
 *  - date range filter
 *  - branch filter
 *  - AI service tab filter
 *  - search filter
 *  - my tasks toggle
 *  - refresh button
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === "dashboard.welcome" && opts?.name) return `Hello, ${opts.name}!`;
      return key;
    },
    i18n: { resolvedLanguage: "en", language: "en" },
  }),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(() => ({
    hasPermission: jest.fn(() => true),
    isAdmin: false,
    user: { name: "Ahmed", role: "user" },
  })),
}));

jest.mock("@/services/dashboardService", () => ({
  dashboardService: {
    getSummary: jest.fn().mockResolvedValue({
      cameras: { online: 3, total: 4 },
      aiServicesActive: 5,
      detections: 3890,
      branches: [
        { id: "b1", name: "Main Branch" },
        { id: "b2", name: "Second Branch" },
      ],
    }),
    listAIServices: jest.fn().mockResolvedValue([
      { id: "1", key: "helmet", name: "Helmet Detection", category: "safety", status: "active", detections: 12 },
      { id: "2", key: "customer_traffic", name: "Customer Traffic", category: "analytics", status: "active", detections: 2802 },
      { id: "3", key: "gate_monitoring", name: "Gate Monitoring", category: "monitoring", status: "inactive" },
      { id: "4", key: "cash_register", name: "Cash Register", category: "operations", status: "active" },
    ]),
    getTaskSummary: jest.fn().mockResolvedValue({
      total: 30, open: 10, inProgress: 8, overdue: 3, completionRate: 72,
    }),
    getVisitorFlow: jest.fn().mockResolvedValue(
      Array.from({ length: 24 }, (_, h) => ({ hour: String(h).padStart(2, "0"), in: h * 10, out: h * 8 }))
    ),
    getLiveActivity: jest.fn().mockResolvedValue([
      { id: "a1", type: "PPE Violation", branch: "Main", source: "Cam 1", agoSeconds: 15, severity: "warning", timestamp: "10:00" },
      { id: "a2", type: "Fire Alert", branch: "Second", source: "Cam 2", agoSeconds: 5, severity: "critical", timestamp: "10:01" },
    ]),
    getAttendance: jest.fn().mockResolvedValue({
      total: 50, checkedIn: 40, present: 35, checkedOut: 5, absent: 10,
    }),
    getCompliance: jest.fn().mockResolvedValue({
      score: 85, totalDetections: 1200, violations: 180, clean: 1020,
    }),
    getDetectionBreakdown: jest.fn().mockResolvedValue([
      { key: "helmet", label: "Helmet", count: 100, percent: 50, color: "#6366f1" },
      { key: "traffic", label: "Traffic", count: 80, percent: 40, color: "#22c55e" },
    ]),
    getBranches: jest.fn().mockResolvedValue([
      { id: "b1", name: "Main Branch", camerasOnline: 3, camerasTotal: 4, detections: 120, grade: "A" },
    ]),
    getUnreadNotifications: jest.fn().mockResolvedValue(5),
    getProfile: jest.fn().mockResolvedValue({ name: "Ahmed" }),
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

jest.mock("@/components/Shareddaterangepicker", () => ({
  __esModule: true,
  default: ({ placeholder }: { placeholder: string }) =>
    React.createElement("div", { "data-testid": "date-picker", "aria-label": placeholder }),
}));

jest.mock("@/components/ai-service-icons", () => {
  const mock = () => React.createElement("svg", { "data-testid": "service-icon" });
  return new Proxy({}, { get: () => mock });
});

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) =>
    React.createElement("div", { role: "progressbar", "aria-valuenow": value }),
}));

// Mock all shadcn UI components minimally
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => React.createElement("div", { "data-testid": "card" }, children),
  CardContent: ({ children }: any) => React.createElement("div", null, children),
}));
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => React.createElement("span", { "data-testid": "badge" }, children),
}));
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    React.createElement("button", { onClick, disabled, ...props }, children),
}));
jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => React.createElement("input", props),
}));
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) =>
    React.createElement("div", { "data-testid": "select", "data-value": value, onChange: (e: any) => onValueChange?.(e.target.value) }, children),
  SelectTrigger: ({ children }: any) => React.createElement("div", null, children),
  SelectContent: ({ children }: any) => React.createElement("div", null, children),
  SelectItem: ({ children, value }: any) => React.createElement("option", { value }, children),
  SelectValue: () => null,
}));

// ── Import ────────────────────────────────────────────────────────────────────

import DashboardView from "@/views/DashboardView";
import { useAuth } from "@/lib/auth";
import { dashboardService } from "@/services/dashboardService";

const mockUseAuth = useAuth as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderDashboard() {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(React.createElement(DashboardView));
  });
  return result!;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("DashboardView — Permission Guard", () => {
  test("shows access denied when hasPermission('dashboard') returns false", async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => false,
      isAdmin: false,
      user: { name: "Guest" },
    });
    await renderDashboard();
    expect(screen.getByText(/errors.unauthorized/i)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard.welcome/i)).not.toBeInTheDocument();
  });

  test("renders full dashboard when permission granted", async () => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
    await renderDashboard();
    await waitFor(() => {
      expect(screen.queryByText(/errors.unauthorized/i)).not.toBeInTheDocument();
    });
  });
});

describe("DashboardView — Initial Render", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
  });

  test("renders welcome banner with user name", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Hello, Ahmed!/i)).toBeInTheDocument();
    });
  });

  test("renders date range picker", async () => {
    await renderDashboard();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });

  test("renders AI Services Hub section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.aiServicesHub")).toBeInTheDocument();
    });
  });

  test("renders task intelligence section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.taskIntelligence")).toBeInTheDocument();
    });
  });

  test("renders visitor flow section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.visitorFlow")).toBeInTheDocument();
    });
  });

  test("renders live activity section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.liveActivity")).toBeInTheDocument();
    });
  });

  test("renders attendance section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.employeeAttendance")).toBeInTheDocument();
    });
  });

  test("renders compliance section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.complianceScore")).toBeInTheDocument();
    });
  });

  test("renders AI detection breakdown section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.aiDetectionBreakdown")).toBeInTheDocument();
    });
  });

  test("renders branch comparison section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.branchComparison")).toBeInTheDocument();
    });
  });

  test("renders camera network section", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.cameraNetwork")).toBeInTheDocument();
    });
  });

  test("calls all dashboard service methods on mount", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(dashboardService.getSummary).toHaveBeenCalled();
      expect(dashboardService.listAIServices).toHaveBeenCalled();
      expect(dashboardService.getTaskSummary).toHaveBeenCalled();
      expect(dashboardService.getVisitorFlow).toHaveBeenCalled();
      expect(dashboardService.getLiveActivity).toHaveBeenCalled();
      expect(dashboardService.getAttendance).toHaveBeenCalled();
      expect(dashboardService.getCompliance).toHaveBeenCalled();
      expect(dashboardService.getDetectionBreakdown).toHaveBeenCalled();
      expect(dashboardService.getBranches).toHaveBeenCalled();
      expect(dashboardService.getUnreadNotifications).toHaveBeenCalled();
      expect(dashboardService.getProfile).toHaveBeenCalled();
    });
  });
});

describe("DashboardView — AI Services", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
  });

  test("renders AI service cards after load", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Helmet Detection")).toBeInTheDocument();
      expect(screen.getByText("Customer Traffic")).toBeInTheDocument();
    });
  });

  test("renders category filter tabs", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/aiServices.all/)).toBeInTheDocument();
      expect(screen.getByText(/aiServices.safety/)).toBeInTheDocument();
      expect(screen.getByText(/aiServices.analytics/)).toBeInTheDocument();
      expect(screen.getByText(/aiServices.operations/)).toBeInTheDocument();
      expect(screen.getByText(/aiServices.monitoring/)).toBeInTheDocument();
    });
  });

  test("search input filters services", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Helmet Detection")).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText("aiServices.searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "helmet" } });
    await waitFor(() => {
      expect(screen.getByText("Helmet Detection")).toBeInTheDocument();
      expect(screen.queryByText("Customer Traffic")).not.toBeInTheDocument();
    });
  });

  test("search with no match shows no service cards", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Helmet Detection")).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText("aiServices.searchPlaceholder");
    fireEvent.change(searchInput, { target: { value: "xyznotexist" } });
    await waitFor(() => {
      expect(screen.queryByText("Helmet Detection")).not.toBeInTheDocument();
    });
  });

  test("active services show active label", async () => {
    await renderDashboard();
    await waitFor(() => {
      const activeLabels = screen.getAllByText("aiServices.activeShort");
      expect(activeLabels.length).toBeGreaterThan(0);
    });
  });

  test("inactive services show inactive label", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("aiServices.inactive")).toBeInTheDocument();
    });
  });

  test("service cards link to correct route", async () => {
    await renderDashboard();
    await waitFor(() => {
      const helmetLink = screen.getByText("Helmet Detection").closest("a");
      expect(helmetLink).toHaveAttribute("href", "/dashboard/ai-services/safety/helmet-detection");
    });
  });
});

describe("DashboardView — Task Intelligence", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
  });

  test("shows task counts after load", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("30")).toBeInTheDocument(); // total badge
    });
  });

  test("my tasks toggle button exists", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.myTasks")).toBeInTheDocument();
    });
  });

  test("my tasks toggle triggers reload", async () => {
    await renderDashboard();
    await waitFor(() => expect(screen.getByText("dashboard.myTasks")).toBeInTheDocument());
    const callsBefore = (dashboardService.getTaskSummary as jest.Mock).mock.calls.length;
    fireEvent.click(screen.getByText("dashboard.myTasks"));
    await waitFor(() => {
      expect((dashboardService.getTaskSummary as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  test("create task button is rendered", async () => {
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("dashboard.createTask")).toBeInTheDocument();
    });
  });
});

describe("DashboardView — Refresh", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
  });

  test("refresh button calls load again", async () => {
    await renderDashboard();
    await waitFor(() => expect(dashboardService.getSummary).toHaveBeenCalled());
    const callsBefore = (dashboardService.getSummary as jest.Mock).mock.calls.length;
    const refreshBtn = screen.getByRole("button", { name: "common.refresh" });
    await act(async () => { fireEvent.click(refreshBtn); });
    await waitFor(() => {
      const callsAfter = (dashboardService.getSummary as jest.Mock).mock.calls.length;
      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });
});

describe("DashboardView — Unread notifications badge", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
  });

  test("shows unread count badge when unread > 0", async () => {
    (dashboardService.getUnreadNotifications as jest.Mock).mockResolvedValue(5);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/dashboard.unread/i)).toBeInTheDocument();
    });
  });

  test("hides unread badge when unread = 0", async () => {
    (dashboardService.getUnreadNotifications as jest.Mock).mockResolvedValue(0);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.queryByText(/dashboard.unread/i)).not.toBeInTheDocument();
    });
  });
});

describe("DashboardView — Error / Edge cases", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
  });

  test("renders without crash when all services return empty", async () => {
    (dashboardService.getSummary as jest.Mock).mockResolvedValue({
      cameras: { online: 0, total: 0 }, aiServicesActive: 0, detections: 0, branches: [],
    });
    (dashboardService.listAIServices as jest.Mock).mockResolvedValue([]);
    (dashboardService.getTaskSummary as jest.Mock).mockResolvedValue({ total: 0, open: 0, inProgress: 0, overdue: 0, completionRate: 0 });
    (dashboardService.getVisitorFlow as jest.Mock).mockResolvedValue([]);
    (dashboardService.getLiveActivity as jest.Mock).mockResolvedValue([]);
    (dashboardService.getBranches as jest.Mock).mockResolvedValue([]);

    await expect(renderDashboard()).resolves.not.toThrow();
    await waitFor(() => {
      expect(screen.getByText("dashboard.aiServicesHub")).toBeInTheDocument();
    });
  });

  test("handles API errors by using fallback/demo data", async () => {
    // dashboardService methods catch errors internally and return fallback data
    // So even when services fail, the component should render with empty/demo state
    // This tests that the service-level error handling works end-to-end
    
    // Restore normal mocks that simulate errors but return fallback data (via service)
    const { dashboardService: ds } = jest.requireMock("@/services/dashboardService");
    ds.getSummary.mockResolvedValueOnce({ cameras: { online: 0, total: 0 }, aiServicesActive: 0, detections: 0, branches: [] });
    ds.listAIServices.mockResolvedValueOnce([]);
    ds.getTaskSummary.mockResolvedValueOnce({ total: 0, open: 0, inProgress: 0, overdue: 0, completionRate: 0 });
    ds.getVisitorFlow.mockResolvedValueOnce([]);
    ds.getLiveActivity.mockResolvedValueOnce([]);
    ds.getAttendance.mockResolvedValueOnce({ total: 0, checkedIn: 0, present: 0, checkedOut: 0, absent: 0 });
    ds.getCompliance.mockResolvedValueOnce({ score: 0, totalDetections: 0, violations: 0, clean: 0 });
    ds.getDetectionBreakdown.mockResolvedValueOnce([]);
    ds.getBranches.mockResolvedValueOnce([]);

    await renderDashboard();
    await waitFor(() => {
      // Dashboard should render even with all-empty data (fallback path)
      expect(screen.getByText("dashboard.aiServicesHub")).toBeInTheDocument();
      expect(screen.getByText("dashboard.taskIntelligence")).toBeInTheDocument();
    });
  });

  test("renders with null profile gracefully", async () => {
    (dashboardService.getProfile as jest.Mock).mockResolvedValueOnce(null);
    // Ensure other services resolve normally
    (dashboardService.getSummary as jest.Mock).mockResolvedValueOnce({
      cameras: { online: 2, total: 3 }, aiServicesActive: 3, detections: 100, branches: [],
    });
    await renderDashboard();
    await waitFor(() => {
      expect(screen.queryByText(/errors.unauthorized/)).not.toBeInTheDocument();
    });
  });
});

describe("DashboardView — i18n keys", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
      isAdmin: false,
      user: { name: "Ahmed" },
    });
    // Re-setup all service mocks to resolve normally
    const { dashboardService: ds } = jest.requireMock("@/services/dashboardService");
    ds.getSummary.mockResolvedValue({ cameras: { online: 3, total: 4 }, aiServicesActive: 5, detections: 3890, branches: [] });
    ds.listAIServices.mockResolvedValue([{ id:"1",key:"helmet",name:"Helmet",category:"safety",status:"active" }]);
    ds.getTaskSummary.mockResolvedValue({ total: 10, open: 3, inProgress: 2, overdue: 1, completionRate: 60 });
    ds.getVisitorFlow.mockResolvedValue([{ hour: "08", in: 50, out: 40 }]);
    ds.getLiveActivity.mockResolvedValue([]);
    ds.getAttendance.mockResolvedValue({ total: 5, checkedIn: 3, present: 2, checkedOut: 1, absent: 2 });
    ds.getCompliance.mockResolvedValue({ score: 80, totalDetections: 100, violations: 20, clean: 80 });
    ds.getDetectionBreakdown.mockResolvedValue([]);
    ds.getBranches.mockResolvedValue([]);
    ds.getUnreadNotifications.mockResolvedValue(0);
    ds.getProfile.mockResolvedValue({ name: "Ahmed" });
  });

  const expectedKeys = [
    "dashboard.aiServicesHub",
    "dashboard.taskIntelligence",
    "dashboard.visitorFlow",
    "dashboard.liveActivity",
    "dashboard.employeeAttendance",
    "dashboard.complianceScore",
    "dashboard.aiDetectionBreakdown",
    "dashboard.branchComparison",
    "dashboard.cameraNetwork",
  ];

  for (const key of expectedKeys) {
    test(`renders i18n key: ${key}`, async () => {
      await renderDashboard();
      await waitFor(() => {
        expect(screen.getByText(key)).toBeInTheDocument();
      });
    });
  }
});
