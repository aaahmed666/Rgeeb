/// <reference types="cypress" />

/**
 * Shared Cypress helpers for the full API test suite.
 *
 * - Endpoint map matching src/lib/endpoints.ts
 * - Dummy data scanner
 * - Schema assertion utilities
 * - Performance thresholds
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT MAP — mirrors src/lib/endpoints.ts via /api proxy
// ═══════════════════════════════════════════════════════════════════════════

export const API = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: "/api/login",
    register: "/api/customer/register",
    logout: "/api/customer/logout",
    sendOtp: "/api/customer/email/send-otp",
    resetPassword: "/api/customer/profile/update",
    faceLogin: "/api/face-login",
    faceRegister: "/api/face/register",
    passwordRequestReset: "/api/password/request-reset",
    passwordReset: "/api/password/reset",
    profile: "/api/customer/profile",
    updateProfile: "/api/customer/profile/update",
    updateClient: "/api/customer/client/update",
  },

  // ── Lookups ──────────────────────────────────────────────────────────────
  lookups: {
    countries: "/api/customer/countries",
    cities: "/api/customer/cities",
    categories: "/api/customer/categories",
    categorySingle: "/api/customer/categories/single",
    packages: "/api/customer/packages",
    packageSingle: "/api/customer/packages/single",
  },

  // ── Notifications ────────────────────────────────────────────────────────
  notifications: {
    list: "/api/customer/notifications",
    unreadCount: "/api/customer/notifications/unread-count",
    markAllRead: "/api/customer/notifications/mark-all-read",
    readAll: "/api/customer/notifications/read-all",
    markRead: (id: string) => `/api/customer/notifications/${id}/read`,
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  dashboard: {
    overview: "/api/customer/dashboard",
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  analytics: {
    summary: "/api/customer/analytics/summary",
    trends: "/api/customer/analytics/trends",
    byService: "/api/customer/analytics/by-service",
    byCamera: "/api/customer/analytics/by-camera",
    byBranch: "/api/customer/analytics/by-branch",
    branches: "/api/customer/branches",
  },

  // ── Detections ───────────────────────────────────────────────────────────
  detections: {
    list: "/api/customer/detections",
    single: "/api/customer/detections/single",
    byId: (id: string) => `/api/customer/detections/${id}`,
    create: "/api/customer/detections/create",
    update: "/api/customer/detections/update",
    delete: "/api/customer/detections/delete",
    test: "/api/customer/detections/test",
  },

  // ── Cameras ──────────────────────────────────────────────────────────────
  cameras: {
    list: "/api/customer/cameras",
    single: "/api/customer/cameras/single",
    checkOnline: "/api/customer/cameras/check-online",
    stream: "/api/customer/cameras/stream",
    create: "/api/customer/cameras/create",
    update: "/api/customer/cameras/update",
    delete: "/api/customer/cameras/delete",
  },

  // ── Organization ─────────────────────────────────────────────────────────
  organization: {
    branches: "/api/customer/branches",
    branchSingle: "/api/customer/branches/single",
    branchCreate: "/api/customer/branches/create",
    branchUpdate: "/api/customer/branches/update",
    branchDelete: "/api/customer/branches/delete",
    departments: "/api/customer/departments",
    departmentSingle: "/api/customer/departments/single",
    departmentCreate: "/api/customer/departments/create",
    departmentUpdate: "/api/customer/departments/update",
    departmentDelete: "/api/customer/departments/delete",
    employees: "/api/customer/employees",
    employeeSingle: "/api/customer/employees/single",
    employeeCreate: "/api/customer/employees/create",
    employeeUpdate: "/api/customer/employees/update",
    employeeDelete: "/api/customer/employees/delete",
  },

  // ── Attendance ───────────────────────────────────────────────────────────
  attendance: {
    list: "/api/customer/attendances",
    dashboard: "/api/customer/attendances/dashboard",
    checkIn: "/api/customer/attendances/check-in",
    checkOut: "/api/customer/attendances/check-out",
  },

  // ── Roles ────────────────────────────────────────────────────────────────
  roles: {
    list: "/api/customer/roles",
    single: "/api/customer/roles/single",
    create: "/api/customer/roles/create",
    update: "/api/customer/roles/update",
    delete: "/api/customer/roles/delete",
    permissions: "/api/customer/roles/permissions",
  },

  // ── Services ─────────────────────────────────────────────────────────────
  services: {
    list: "/api/customer/services",
    single: "/api/customer/services/single",
    available: "/api/customer/services/available",
    new: "/api/customer/services/new",
  },

  // ── Subscription ─────────────────────────────────────────────────────────
  subscription: {
    current: "/api/customer/subscriptions/current",
    subscribe: "/api/customer/subscriptions/subscribe",
    renew: "/api/customer/subscriptions/renew",
    cancel: "/api/customer/subscriptions/cancel",
    callback: (id: string) => `/api/customer/subscriptions/callback/${id}`,
    webhook: "/api/customer/subscriptions/webhook",
    transactions: "/api/customer/subscription-transactions",
    transactionSingle: "/api/customer/subscription-transactions/single",
    addServices: "/api/customer/subscriptions/add-service",
  },

  // ── Tasks ────────────────────────────────────────────────────────────────
  tasks: {
    list: "/api/customer/tasks",
    single: "/api/customer/tasks/single",
    board: "/api/customer/tasks/board",
    create: "/api/customer/tasks/create",
    update: "/api/customer/tasks/update",
    delete: "/api/customer/tasks/delete",
    status: "/api/customer/tasks/status",
    dashboard: "/api/customer/tasks/dashboard",
    assign: "/api/customer/tasks/assign",
    comment: "/api/customer/tasks/comment",
    logs: "/api/customer/tasks/logs",
    children: "/api/customer/tasks/children",
    attachment: "/api/customer/tasks/attachment",
  },

  // ── My Tasks ─────────────────────────────────────────────────────────────
  myTasks: {
    list: "/api/customer/my-tasks",
    detail: "/api/customer/my-tasks/detail",
    stats: "/api/customer/my-tasks/stats",
    photo: "/api/customer/my-tasks/photo",
    start: (id: string) => `/api/customer/my-tasks/${id}/start`,
    complete: (id: string) => `/api/customer/my-tasks/${id}/complete`,
    status: (id: string) => `/api/customer/my-tasks/${id}/status`,
  },

  // ── Task Analytics ───────────────────────────────────────────────────────
  taskAnalytics: {
    sla: "/api/customer/task-analytics/sla",
    workers: "/api/customer/task-analytics/workers",
    volume: "/api/customer/task-analytics/volume",
    aiPipeline: "/api/customer/task-analytics/ai-pipeline",
    verify: "/api/customer/task-analytics/verify",
    reject: "/api/customer/task-analytics/reject",
    reopen: "/api/customer/task-analytics/reopen",
    verifications: "/api/customer/task-analytics/verifications",
    verificationStats: "/api/customer/task-analytics/verification-stats",
    reviewVerification: "/api/customer/task-analytics/review-verification",
    escalationRate: "/api/customer/task-analytics/escalation-rate",
    branchesAnalytics: "/api/customer/task-analytics/branches",
  },

  // ── Task Reports ─────────────────────────────────────────────────────────
  taskReports: {
    performance: "/api/customer/task-reports/performance",
    sla: "/api/customer/task-reports/sla",
    exportExcel: "/api/customer/task-reports/export-excel",
    verification: "/api/customer/task-reports/verification",
    types: "/api/customer/task-reports/types",
    downloadPerformance: "/api/customer/task-reports/download/performance",
    downloadSla: "/api/customer/task-reports/download/sla",
    downloadExportExcel: "/api/customer/task-reports/download/export-excel",
    downloadVerification: "/api/customer/task-reports/download/verification",
  },

  // ── Task Rules ───────────────────────────────────────────────────────────
  taskRules: {
    list: "/api/customer/task-rules",
    save: "/api/customer/task-rules/save",
    update: (id: string) => `/api/customer/task-rules/${id}`,
    delete: (id: string) => `/api/customer/task-rules/${id}`,
    dedupStats: "/api/customer/task-rules/dedup-stats",
  },

  // ── Escalation ───────────────────────────────────────────────────────────
  escalation: {
    rules: "/api/customer/escalation/rules",
    rule: (id: string) => `/api/customer/escalation/rules/${id}`,
    saveRule: "/api/customer/escalation/save-rule",
    log: "/api/customer/escalation/log",
  },

  // ── Task Notifications ───────────────────────────────────────────────────
  taskNotifications: {
    list: "/api/customer/task-notifications",
    markRead: "/api/customer/task-notifications/mark-read",
  },

  // ── Task Templates ───────────────────────────────────────────────────────
  taskTemplates: {
    list: "/api/customer/task-templates",
    createTask: "/api/customer/task-templates/create-task",
    use: (id: string) => `/api/customer/task-templates/${id}/use`,
    delete: (id: string) => `/api/customer/task-templates/${id}`,
  },

  // ── Productivity ─────────────────────────────────────────────────────────
  productivity: {
    summary: "/api/customer/productivity/summary",
    leaderboard: "/api/customer/productivity/leaderboard",
    departments: "/api/customer/productivity/departments",
    employeeDetail: (id: string) => `/api/customer/productivity/employee/${id}`,
  },

  // ── Report Center ────────────────────────────────────────────────────────
  reportCenter: {
    generate: "/api/customer/reports/generate",
    scheduled: "/api/customer/reports/scheduled",
    schedule: "/api/customer/reports/schedule",
    templates: "/api/customer/reports/templates",
    generated: "/api/customer/reports/generated",
    list: "/api/customer/reports",
    single: "/api/customer/reports/single",
    statistics: "/api/customer/reports/statistics",
    visitorCountToday: "/api/customer/reports/visitor-count/today",
    visitorCountByDate: "/api/customer/reports/visitor-count/by-date",
    scheduleDelete: "/api/customer/reports/schedule/delete",
    generatedDelete: "/api/customer/reports/generated/delete",
  },

  // ── Statistics ───────────────────────────────────────────────────────────
  reports: {
    statistics: "/api/customer/reports/statistics",
    customers: "/api/customer/reports/customers",
    suppliers: "/api/customer/reports/suppliers",
    sales: "/api/customer/reports/sales",
    purchases: "/api/customer/reports/purchases",
    inventory: "/api/customer/reports/inventory",
    financials: "/api/customer/reports/financials",
  },

  // ── Notification Settings ────────────────────────────────────────────────
  notificationSettings: {
    get: "/api/customer/notification-settings",
    update: "/api/customer/notification-settings",
    test: "/api/customer/notification-settings/test",
    testEmail: "/api/customer/notification-settings/test-email",
    verifyTelegram: "/api/customer/notification-settings/verify-telegram",
  },

  // ── Security / 2FA ───────────────────────────────────────────────────────
  security: {
    status: "/api/customer/2fa/status",
    setup: "/api/customer/2fa/setup",
    enable: "/api/customer/2fa/enable",
    disable: "/api/customer/2fa/disable",
    verify: "/api/customer/2fa/verify",
  },

  // ── Foodics ──────────────────────────────────────────────────────────────
  foodics: {
    status: "/api/customer/foodics/status",
    connect: "/api/customer/foodics/connect",
    disconnect: "/api/customer/foodics/disconnect",
    importBranches: "/api/customer/foodics/branches/import",
    orders: "/api/customer/foodics/orders",
    ordersSync: "/api/customer/foodics/orders/sync",
    refunds: "/api/customer/foodics/refund-verifications",
    drawerAudits: "/api/customer/foodics/drawer-audits",
    drawerOperationsSync: "/api/customer/foodics/drawer-operations/sync",
    prepTime: "/api/customer/foodics/prep-times",
    inventoryZones: "/api/customer/foodics/inventory/zones",
    inventoryAudits: "/api/customer/foodics/inventory/audits",
    inventoryAudit: "/api/customer/foodics/inventory/audit",
    branches: "/api/customer/foodics/branches",
    health: "/api/customer/foodics/health",
    conversionDaily: "/api/customer/foodics/conversion/daily",
    conversionHourly: "/api/customer/foodics/conversion/hourly",
    conversionSummary: "/api/customer/foodics/conversion/summary",
    dashboardInsights: "/api/customer/foodics/dashboard/insights",
    dashboardOverview: "/api/customer/foodics/dashboard/overview",
    dashboardTrends: "/api/customer/foodics/dashboard/trends",
    ordersSummary: "/api/customer/foodics/orders/summary",
    drawerAuditsPatterns: "/api/customer/foodics/drawer-audits/patterns",
    drawerAuditsStats: "/api/customer/foodics/drawer-audits/stats",
    prepTimesHeatmap: "/api/customer/foodics/prep-times/heatmap",
    prepTimesStats: "/api/customer/foodics/prep-times/stats",
    prepTimesSummary: "/api/customer/foodics/prep-times/summary",
    refundVerificationsStats: "/api/customer/foodics/refund-verifications/stats",
    branchesCustomersServed: "/api/customer/foodics/branches/customers-served",
  },

  // ── Branch Intelligence ──────────────────────────────────────────────────
  intelligence: {
    efficiencyIndex: "/api/customer/branch-intelligence/efficiency-index",
    rankings: "/api/customer/branch-intelligence/rankings",
    heatmap: "/api/customer/branch-intelligence/heatmap",
    branchHealth: "/api/customer/branch-intelligence/branch-health",
    serviceMatrix: "/api/customer/branch-intelligence/service-matrix",
    aiInsights: "/api/customer/branch-intelligence/ai-insights",
    anomalyDetection: "/api/customer/branch-intelligence/anomaly-detection",
    trendForecast: "/api/customer/branch-intelligence/trend-forecast",
    hourlyPeaks: "/api/customer/branch-intelligence/hourly-peaks",
    periodComparison: "/api/customer/branch-intelligence/period-comparison",
    exportReport: "/api/customer/branch-intelligence/export-report",
    availableServices: "/api/customer/branch-intelligence/available-services",
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  chat: {
    send: "/api/customer/chat",
    sendPublic: "/api/customer/chat/public",
    history: "/api/customer/chat/history",
    analytics: "/api/customer/chat/analytics",
    conversations: "/api/customer/chat/analytics/conversations",
    settings: "/api/customer/chat/settings",
    testWhatsapp: "/api/customer/chat/test-whatsapp",
    resetAlerts: "/api/customer/chat/settings/reset-alerts",
  },

  // ── Store Intelligence ───────────────────────────────────────────────────
  storeIntelligence: {
    dashboard: "/api/customer/store-intelligence/dashboard",
    traffic: "/api/customer/store-intelligence/traffic",
    conversion: "/api/customer/store-intelligence/conversion",
    demographics: "/api/customer/store-intelligence/demographics",
    heatmap: "/api/customer/store-intelligence/heatmap",
    employeePresence: "/api/customer/store-intelligence/employee-presence",
    responseTime: "/api/customer/store-intelligence/response-time",
    violations: "/api/customer/store-intelligence/violations",
    compliance: "/api/customer/store-intelligence/compliance",
    settings: "/api/customer/store-intelligence/settings",
  },

  // ── Monitoring ───────────────────────────────────────────────────────────
  monitoring: {
    pulse: "/api/customer/realtime/pulse",
    heartbeat: "/api/customer/realtime/heartbeat",
  },

  // ── Drive-Thru ───────────────────────────────────────────────────────────
  driveThru: {
    dashboard: "/api/customer/drive-thru/dashboard",
  },

  // ── Payment ──────────────────────────────────────────────────────────────
  payment: {
    linkFatoorah: "/api/customer/link-fatoorah",
    fatoorahLink: "/api/customer/fatoorah/link",
    fatoorahStatus: "/api/customer/fatoorah/status",
    unlinkFatoorah: "/api/customer/fatoorah/unlink",
  },

  // ── Service Monitor ──────────────────────────────────────────────────────
  serviceMonitor: {
    dashboard: (id: string) => `/api/customer/service-monitor/${id}/dashboard`,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// DUMMY DATA SCANNER
// ═══════════════════════════════════════════════════════════════════════════

const DUMMY_PATTERNS = [
  /John\s*Doe/i,
  /Jane\s*Doe/i,
  /Test\s*User/i,
  /Lorem\s*Ipsum/i,
  /\bplaceholder\b/i,
  /\bdummy\b/i,
  /\bfake\b/i,
  /example\.com/i,
  /sample\s*data/i,
  /foo\s*bar/i,
  /test@test/i,
];

/** Returns the first match or null if clean. */
export function scanForDummy(body: unknown): string | null {
  const text = JSON.stringify(body);
  for (const p of DUMMY_PATTERNS) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Assert an object has all keys and they match expected types. */
export function assertShape(
  obj: Record<string, unknown>,
  shape: Record<string, string>,
) {
  for (const [key, expectedType] of Object.entries(shape)) {
    expect(obj, `missing key "${key}"`).to.have.property(key);
    if (expectedType === "array") {
      expect(obj[key], `"${key}" is not an array`).to.be.an("array");
    } else {
      expect(typeof obj[key], `"${key}" type mismatch`).to.eq(expectedType);
    }
  }
}

/** Collect all static GET paths from a section for bulk auth tests. */
export function staticPaths(
  section: Record<string, unknown>,
): { name: string; path: string }[] {
  return Object.entries(section)
    .filter(([, v]) => typeof v === "string")
    .map(([name, path]) => ({ name, path: path as string }));
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

export const PERF = {
  /** Max acceptable response time for read endpoints (ms) */
  READ_MS: 5000,
  /** Max acceptable response time for write endpoints (ms) */
  WRITE_MS: 8000,
} as const;
