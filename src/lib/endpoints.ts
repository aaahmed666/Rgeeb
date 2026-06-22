/**
 * Single source of truth for all backend API endpoints.
 *
 * Rules:
 *  - One canonical path per API route — no silent duplicates.
 *  - Sections that truly share a URL (e.g. GET+POST on same path) are
 *    kept with a comment explaining the intent.
 *  - Dynamic routes use arrow functions: (id) => `/customer/X/${id}`
 *
 * Base URL is set in src/lib/api.ts — keep relative paths here only.
 */
export const endpoints = {
  // ── Authentication ──────────────────────────────────────────────────────────
  auth: {
    login: "/login",
    register: "/customer/register",
    logout: "/customer/logout",
    adminLogout: "/admin/logout",

    // OTP / forgot-password flow:
    //   Step 1 → sendOtp   POST /customer/email/send-otp { email }
    //   Step 2 → OTP page
    //   Step 3 → resetPassword POST /customer/profile/update { password }
    sendOtp: "/customer/email/send-otp",
    // ⚠️ AUDIT RISK: /customer/profile/update is an *authenticated* endpoint.
    // In the forgot-password flow the user has no session, so this call is
    // expected to fail with 401 unless the backend accepts otp_code+email as
    // an auth substitute on this route. Confirm with backend; if a dedicated
    // unauthenticated reset endpoint exists (e.g. /customer/password/reset),
    // point this here instead.
    resetPassword: "/customer/profile/update", // step-3 of forgot-password

    // Face login
    face: "/face-login", // POST face recognition login
    facePublic: "/face-login", // POST public face login (no session)
    faceRegister: "/face/register", // POST enroll a face

    // Public password reset (unauthenticated flow, separate from OTP/profile)
    passwordRequestReset: "/password/request-reset", // POST { email }
    passwordReset: "/password/reset", // POST { token, password }

    // Profile
    profile: "/customer/profile", // GET  profile
    updateProfile: "/customer/profile/update", // POST update profile
    updateClient: "/customer/client/update", // POST update client info
  },

  // ── Lookup / reference data ─────────────────────────────────────────────────
  lookups: {
    countries: "/customer/countries",
    cities: "/customer/cities",
    categories: "/customer/categories",
    categorySingle: "/customer/categories/single",
    packages: "/customer/packages",
    packageSingle: "/customer/packages/single",
  },

  // ── Notifications ────────────────────────────────────────────────────────────
  notifications: {
    list: "/customer/notifications",
    unreadCount: "/customer/notifications/unread-count",
    markAllRead: "/customer/notifications/mark-all-read",
    readAll: "/customer/notifications/read-all", // collection alias of mark-all-read
    markRead: (id: string | number) => `/customer/notifications/${id}/read`,
  },

  // ── Dashboard (overview) ─────────────────────────────────────────────────────
  dashboard: {
    overview: "/customer/dashboard", // single unified dashboard endpoint
  },

  // ── Analytics ───────────────────────────────────────────────────────────────
  analytics: {
    summary: "/customer/analytics/summary",
    trends: "/customer/analytics/trends",
    byService: "/customer/analytics/by-service",
    byCamera: "/customer/analytics/by-camera",
    byBranch: "/customer/analytics/by-branch",
    branches: "/customer/branches",
  },

  // ── Detections ───────────────────────────────────────────────────────────────
  detections: {
    list: "/customer/detections",
    single: "/customer/detections/single",
    byId: (id: string | number) => `/customer/detections/${id}`,
    create: "/customer/detections/create",
    update: "/customer/detections/update",
    delete: "/customer/detections/delete",
    test: "/customer/detections/test",
  },

  // ── Real-time / System Monitoring ────────────────────────────────────────────
  monitoring: {
    pulse: "/customer/realtime/pulse",
    heartbeat: "/customer/realtime/heartbeat",
  },

  // ── Cameras ──────────────────────────────────────────────────────────────────
  cameras: {
    list: "/customer/cameras",
    single: "/customer/cameras/single",
    checkOnline: "/customer/cameras/check-online",
    stream: "/customer/cameras/stream", // GET live stream URL/token
    create: "/customer/cameras/create",
    update: "/customer/cameras/update",
    delete: "/customer/cameras/delete",
  },

  // ── Organization (branches / departments / employees) ───────────────────────
  organization: {
    branches: "/customer/branches",
    branchSingle: "/customer/branches/single",
    branchCreate: "/customer/branches/create",
    branchUpdate: "/customer/branches/update",
    branchDelete: "/customer/branches/delete",

    departments: "/customer/departments",
    departmentSingle: "/customer/departments/single",
    departmentCreate: "/customer/departments/create",
    departmentUpdate: "/customer/departments/update",
    departmentDelete: "/customer/departments/delete",

    employees: "/customer/employees",
    employeeSingle: "/customer/employees/single",
    employeeCreate: "/customer/employees/create",
    employeeUpdate: "/customer/employees/update",
    employeeDelete: "/customer/employees/delete",
  },

  // ── Attendance ───────────────────────────────────────────────────────────────
  attendance: {
    list: "/customer/attendances",
    dashboard: "/customer/attendances/dashboard",
    checkIn: "/customer/attendances/check-in",
    checkOut: "/customer/attendances/check-out",
  },

  // ── Roles & Permissions ──────────────────────────────────────────────────────
  roles: {
    list: "/customer/roles",
    single: "/customer/roles/single",
    create: "/customer/roles/create",
    update: "/customer/roles/update",
    delete: "/customer/roles/delete",
    permissions: "/customer/roles/permissions",
  },

  // ── Services (AI services catalog) ──────────────────────────────────────────
  services: {
    list: "/customer/services",
    single: "/customer/services/single",
    available: "/customer/services/available",
    new: "/customer/services/new", // newly-released services feed
  },

  // ── Subscription ─────────────────────────────────────────────────────────────
  subscription: {
    current: "/customer/subscriptions/current",
    subscribe: "/customer/subscriptions/subscribe",
    renew: "/customer/subscriptions/renew",
    cancel: "/customer/subscriptions/cancel",
    callback: (id: string | number) => `/customer/subscriptions/callback/${id}`,
    webhook: "/customer/subscriptions/webhook", // payment gateway → backend
    transactions: "/customer/subscription-transactions",
    transactionSingle: "/customer/subscription-transactions/single",
    // @deprecated Not implemented on the backend (returns 404). Usage is
    // derived from /cameras + /branches counts and the package limits instead,
    // for parity with the legacy production dashboard. Kept only for reference.
    usage: "/customer/subscriptions/usage",
    // Production contract (verified against the OLD system):
    //   list  → GET  /customer/services/available?all=1
    //   add   → POST /customer/subscriptions/add-service { service_ids }
    availableServices: "/customer/services/available",
    addServices: "/customer/subscriptions/add-service",
    services: "/customer/services",
  },

  // ── Tasks ────────────────────────────────────────────────────────────────────
  tasks: {
    list: "/customer/tasks",
    single: "/customer/tasks/single",
    board: "/customer/tasks/board",
    create: "/customer/tasks/create",
    update: "/customer/tasks/update",
    delete: "/customer/tasks/delete",
    // Dedicated status endpoint (OLD production contract): POST { id, status }.
    // This is a lightweight status-only change and must NOT be routed through
    // /update, which is the full-update endpoint that validates every field
    // (name, priority, etc.) and silently resets the task when they're absent —
    // that was making drag-and-drop snap the card back to its old column.
    status: "/customer/tasks/status",
    dashboard: "/customer/tasks/dashboard",
    branches: "/customer/branches",
    // OLD production task-detail contract (not in Postman; kept for parity):
    assign: "/customer/tasks/assign", // POST { id, user_id }
    comment: "/customer/tasks/comment", // POST { id, body }
    logs: "/customer/tasks/logs", // GET  ?id=&per_page=
    children: "/customer/tasks/children", // GET  ?id= — subtasks of a parent
    attachment: "/customer/tasks/attachment", // POST multipart { id, file }
    // Fallback path if the primary status endpoint is unavailable on a given
    // backend build: route the status change through the full-update endpoint.
    legacyStatus: "/customer/tasks/update",
  },

  // ── My Tasks ─────────────────────────────────────────────────────────────────
  myTasks: {
    list: "/customer/my-tasks",
    detail: "/customer/my-tasks/detail", // GET ?id= — single task detail
    stats: "/customer/my-tasks/stats",
    photo: "/customer/my-tasks/photo", // POST multipart proof photo
    start: (id: string | number) => `/customer/my-tasks/${id}/start`,
    complete: (id: string | number) => `/customer/my-tasks/${id}/complete`,
    status: (id: string | number) => `/customer/my-tasks/${id}/status`,
    // Legacy action-style paths — the OLD production frontend's contract
    // (POST with `{ id }` in the body). Used as final fallback because the
    // Postman collection documents neither convention for these actions.
    legacyStart: "/customer/my-tasks/start",
    legacyComplete: "/customer/my-tasks/complete",
    legacyComment: "/customer/my-tasks/comment",
  },

  // ── Task Analytics ───────────────────────────────────────────────────────────
  taskAnalytics: {
    sla: "/customer/task-analytics/sla",
    workers: "/customer/task-analytics/workers",
    volume: "/customer/task-analytics/volume",
    aiPipeline: "/customer/task-analytics/ai-pipeline",
    verify: "/customer/task-analytics/verify",
    reject: "/customer/task-analytics/reject",
    reopen: "/customer/task-analytics/reopen",
    verifications: "/customer/task-analytics/verifications",
    verificationStats: "/customer/task-analytics/verification-stats",
    reviewVerification: "/customer/task-analytics/review-verification",
    escalationRate: "/customer/task-analytics/escalation-rate",
    // NOTE: `branches` intentionally points at the generic branch list — it
    // feeds the branch filter dropdown. `branchesAnalytics` is the dedicated
    // per-branch analytics breakdown from the collection.
    branches: "/customer/branches",
    branchesAnalytics: "/customer/task-analytics/branches",
  },

  // ── Task Notifications ───────────────────────────────────────────────────────
  // Distinct from the general notifications feed — these are task-assignment /
  // task-status alerts. The service layer (escalationService) reads the
  // { notifications: [], unread_count: N } payload.
  taskNotifications: {
    list: "/customer/task-notifications",
    markRead: "/customer/task-notifications/mark-read", // POST { id } | { ids: [] }
  },

  // ── Task Reports ─────────────────────────────────────────────────────────────
  taskReports: {
    performance: "/customer/task-reports/performance",
    sla: "/customer/task-reports/sla",
    slaCompliance: "/customer/task-reports/sla", // alias
    exportExcel: "/customer/task-reports/export-excel",
    exportCsv: "/customer/task-reports/export-excel", // same endpoint, format param
    // The backend now exposes a real verification report (confirmed in the
    // current Postman collection). Previously this aliased to /performance,
    // which silently returned the wrong report.
    verification: "/customer/task-reports/verification",
    verificationAccuracy: "/customer/task-reports/verification",
    types: "/customer/task-reports/types",
    // Download variants (collection exposes a /download/* prefix that streams
    // the file rather than returning JSON)
    downloadPerformance: "/customer/task-reports/download/performance",
    downloadSla: "/customer/task-reports/download/sla",
    downloadExportExcel: "/customer/task-reports/download/export-excel",
    downloadVerification: "/customer/task-reports/download/verification",
  },

  // ── Task Rules ───────────────────────────────────────────────────────────────
  taskRules: {
    list: "/customer/task-rules",
    save: "/customer/task-rules/save", // POST — create & update per Postman
    update: (id: string | number) => `/customer/task-rules/${id}`,
    delete: (id: string | number) => `/customer/task-rules/${id}`,
    legacyDelete: "/customer/task-rules/delete", // OLD production contract (POST { id })
    dedupStats: "/customer/task-rules/dedup-stats", // deduplication stats (present in OLD)
  },

  // ── Escalation ───────────────────────────────────────────────────────────────
  escalation: {
    rules: "/customer/escalation/rules",
    rule: (id: string | number) => `/customer/escalation/rules/${id}`,
    saveRule: "/customer/escalation/save-rule",
    legacyDeleteRule: "/customer/escalation/delete-rule", // OLD production contract (POST { id })
    log: "/customer/escalation/log",
  },

  // ── Smart Scheduler ──────────────────────────────────────────────────────────
  smartScheduler: {
    suggestWorkers: "/customer/smart-scheduler/suggest-workers",
    suggestSchedule: "/customer/smart-scheduler/suggest-schedule",
    autoSchedule: "/customer/smart-scheduler/auto-schedule",
    applySchedule: "/customer/smart-scheduler/apply",
  },

  // ── Task Templates ───────────────────────────────────────────────────────────
  taskTemplates: {
    list: "/customer/task-templates",
    createTask: "/customer/task-templates/create-task",
    use: (id: string | number) => `/customer/task-templates/${id}/use`,
    delete: (id: string | number) => `/customer/task-templates/${id}`,
  },

  // ── Productivity ─────────────────────────────────────────────────────────────
  productivity: {
    summary: "/customer/productivity/summary",
    leaderboard: "/customer/productivity/leaderboard",
    departments: "/customer/productivity/departments",
    employeeDetail: (id: string | number) =>
      `/customer/productivity/employee/${id}`,
  },

  // ── Report Center ────────────────────────────────────────────────────────────
  reportCenter: {
    // Working endpoints (from Postman)
    generate: "/customer/reports/generate",
    scheduled: "/customer/reports/scheduled",
    schedule: "/customer/reports/schedule",
    scheduledById: (id: string) => `/customer/reports/scheduled/${id}`,
    download: (id: string) => `/customer/reports/${id}/download`,
    // Additional endpoints used by reportCenterService
    templates: "/customer/reports/templates",
    generated: "/customer/reports/generated",
    generatedById: (id: string) => `/customer/reports/generated/${id}`,
    // Base list / detail and visitor-count feeds (from the current collection)
    list: "/customer/reports",
    single: "/customer/reports/single",
    statistics: "/customer/reports/statistics",
    visitorCountToday: "/customer/reports/visitor-count/today",
    visitorCountByDate: "/customer/reports/visitor-count/by-date",
    // Delete actions (collection uses POST .../delete, not RESTful DELETE)
    scheduleDelete: "/customer/reports/schedule/delete",
    generatedDelete: "/customer/reports/generated/delete",
    downloadLegacy: "/customer/reports/download", // GET ?id= — legacy fallback
  },

  // ── Statistics (business reports tabs) ───────────────────────────────────────
  // NOTE: /customer/reports/statistics is the real endpoint.
  // The tab-specific paths (customers, suppliers …) may 404 on this backend;
  // reportsService.fetchReport() always tries /statistics first, then demo data.
  reports: {
    statistics: "/customer/reports/statistics",
    customers: "/customer/reports/customers",
    suppliers: "/customer/reports/suppliers",
    sales: "/customer/reports/sales",
    purchases: "/customer/reports/purchases",
    inventory: "/customer/reports/inventory",
    financials: "/customer/reports/financials",
  },

  // ── Notification Settings ────────────────────────────────────────────────────
  // GET and POST share the same URL — intentional (REST convention)
  notificationSettings: {
    get: "/customer/notification-settings", // GET
    update: "/customer/notification-settings", // POST (same URL)
    test: "/customer/notification-settings/test",
    testEmail: "/customer/notification-settings/test-email",
    verifyTelegram: "/customer/notification-settings/verify-telegram",
  },

  // ── Security / 2FA ───────────────────────────────────────────────────────────
  security: {
    status: "/customer/2fa/status",
    setup: "/customer/2fa/setup",
    enable: "/customer/2fa/enable",
    disable: "/customer/2fa/disable",
    verify: "/customer/2fa/verify",
    // Aliases used by securityService.ts
    twoFactorStatus: "/customer/2fa/status",
    twoFactorSetup: "/customer/2fa/setup",
    twoFactorEnable: "/customer/2fa/enable",
    twoFactorDisable: "/customer/2fa/disable",
    twoFactorVerify: "/customer/2fa/verify",
  },

  // ── Drive-Thru ───────────────────────────────────────────────────────────────
  driveThru: {
    dashboard: "/customer/drive-thru/dashboard",
  },

  // ── Service Monitor ──────────────────────────────────────────────────────────
  serviceMonitor: {
    dashboard: (serviceId: string | number) =>
      `/customer/service-monitor/${serviceId}/dashboard`,
  },

  // ── Branch Intelligence ──────────────────────────────────────────────────────
  intelligence: {
    efficiencyIndex: "/customer/branch-intelligence/efficiency-index",
    rankings: "/customer/branch-intelligence/rankings",
    heatmap: "/customer/branch-intelligence/heatmap",
    branchHealth: "/customer/branch-intelligence/branch-health",
    serviceMatrix: "/customer/branch-intelligence/service-matrix",
    aiInsights: "/customer/branch-intelligence/ai-insights",
    anomalyDetection: "/customer/branch-intelligence/anomaly-detection",
    trendForecast: "/customer/branch-intelligence/trend-forecast",
    hourlyPeaks: "/customer/branch-intelligence/hourly-peaks",
    periodComparison: "/customer/branch-intelligence/period-comparison",
    exportReport: "/customer/branch-intelligence/export-report", // GET downloadable report
    // OLD production source for the heatmap service filter — returns only
    // services that actually have branch-intelligence data (unlike the
    // general /customer/services catalog).
    availableServices: "/customer/branch-intelligence/available-services",
  },

  // ── Chat (AI Assistant) ──────────────────────────────────────────────────────
  chat: {
    send: "/customer/chat",
    sendPublic: "/customer/chat/public",
    history: "/customer/chat/history",
  },

  // ── Chat Analytics ───────────────────────────────────────────────────────────
  chatAnalytics: {
    all: "/customer/chat/analytics",
    conversations: "/customer/chat/analytics/conversations",
  },

  // ── Chat Settings ────────────────────────────────────────────────────────────
  chatSettings: {
    settings: "/customer/chat/settings",
    testWhatsapp: "/customer/chat/test-whatsapp", // matches Postman collection (backend route)
    resetAlerts: "/customer/chat/settings/reset-alerts",
  },

  // ── Foodics Integration ──────────────────────────────────────────────────────
  foodics: {
    status: "/customer/foodics/status",
    connect: "/customer/foodics/connect",
    disconnect: "/customer/foodics/disconnect",
    importBranches: "/customer/foodics/branches/import",

    // Dashboard — the page aggregates the three /dashboard/* feeds via
    // foodicsService.getDashboard (overview + insights + trends below).

    // Orders
    orders: "/customer/foodics/orders",
    ordersSync: "/customer/foodics/orders/sync",

    // Refund Verification (backend path is /refund-verifications, not /refunds)
    refunds: "/customer/foodics/refund-verifications",

    // Cash Drawer
    drawerAudits: "/customer/foodics/drawer-audits",
    drawerOperationsSync: "/customer/foodics/drawer-operations/sync",
    // Manager review actions (ported from legacy system — see old store/apps/foodics)
    drawerAuditReview: (id: string | number) =>
      `/customer/foodics/drawer-audits/${id}/review`,
    refundReview: (id: string | number) =>
      `/customer/foodics/refund-verifications/${id}/review`,

    // Prep Time (backend path is /prep-times, plural)
    prepTime: "/customer/foodics/prep-times",

    // Footfall vs Revenue — the page consumes a consolidated shape that the
    // backend does not expose directly; foodicsService.getFootfall aggregates
    // the three /conversion/* feeds (daily, hourly, summary) instead.

    // Inventory — zone create is a POST to the base zones path (no /create
    // suffix in the backend); update posts to /zones/{id}; delete to /delete.
    inventoryZones: "/customer/foodics/inventory/zones",
    inventoryZoneCreate: "/customer/foodics/inventory/zones",
    inventoryZoneUpdate: (id: string) =>
      `/customer/foodics/inventory/zones/${id}`,
    inventoryZoneDelete: (id: string) =>
      `/customer/foodics/inventory/zones/${id}/delete`,
    inventoryAuditHistory: "/customer/foodics/inventory/audits",
    inventoryAudit: "/customer/foodics/inventory/audit", // POST run an audit

    // Branches
    branches: "/customer/foodics/branches",
    branchesCustomersServed: "/customer/foodics/branches/customers-served",

    // Health
    health: "/customer/foodics/health",

    // Conversion (footfall → orders)
    conversionDaily: "/customer/foodics/conversion/daily",
    conversionHourly: "/customer/foodics/conversion/hourly",
    conversionSummary: "/customer/foodics/conversion/summary",

    // Dashboard breakdowns (collection exposes these granular feeds in
    // addition to the consolidated `dashboard` endpoint above)
    dashboardInsights: "/customer/foodics/dashboard/insights",
    dashboardOverview: "/customer/foodics/dashboard/overview",
    dashboardTrends: "/customer/foodics/dashboard/trends",

    // Orders
    ordersByFoodicsId: (id: string | number) =>
      `/customer/foodics/orders/by-foodics-id/${id}`,
    ordersSummary: "/customer/foodics/orders/summary",

    // Drawer audit analytics
    drawerAuditsPatterns: "/customer/foodics/drawer-audits/patterns",
    drawerAuditsStats: "/customer/foodics/drawer-audits/stats",

    // Prep times (granular collection paths alongside the `prepTime` alias)
    prepTimes: "/customer/foodics/prep-times",
    prepTimesHeatmap: "/customer/foodics/prep-times/heatmap",
    prepTimesStats: "/customer/foodics/prep-times/stats",
    prepTimesSummary: "/customer/foodics/prep-times/summary",

    // Refund verifications (granular collection paths alongside `refunds`)
    refundVerifications: "/customer/foodics/refund-verifications",
    refundVerificationsStats: "/customer/foodics/refund-verifications/stats",
  },

  // ── Fatoorah Payment ─────────────────────────────────────────────────────────
  payment: {
    linkFatoorah: "/customer/link-fatoorah",
    fatoorahLink: "/customer/fatoorah/link", // collection path variant
    fatoorahStatus: "/customer/fatoorah/status",
    unlinkFatoorah: "/customer/fatoorah/unlink",
  },

  // ── Admin Panel ──────────────────────────────────────────────────────────────
  admin: {
    login: "/login",
    logout: "/admin/logout",
    profile: "/admin/profile",
    dashboardStats: "/admin/dashboard-stats",
    impersonate: "/admin/impersonate",
    stopImpersonation: "/admin/stop-impersonation",

    // Detections (admin catalog)
    detections: "/admin/detections",
    detectionSingle: "/admin/detections/single",
    detectionCreate: "/admin/detections/create",
    detectionUpdate: "/admin/detections/update",
    detectionDelete: "/admin/detections/delete",

    // Roles (admin)
    roles: "/admin/roles",
    roleSingle: "/admin/roles/single",
    rolePermissions: "/admin/roles/permissions",
    roleCreate: "/admin/roles/create",
    roleUpdate: "/admin/roles/update",
    roleDelete: "/admin/roles/delete",

    // Users
    users: "/admin/users",
    userSingle: "/admin/users/single",
    userCreate: "/admin/users/create",
    userUpdate: "/admin/users/update",
    userDelete: "/admin/users/delete",

    // Categories
    categories: "/admin/categories",
    categorySingle: "/admin/categories/single",
    categoryCreate: "/admin/categories/create",
    categoryUpdate: "/admin/categories/update",
    categoryDelete: "/admin/categories/delete",

    // Services
    services: "/admin/services",
    serviceSingle: "/admin/services/single",
    serviceCreate: "/admin/services/create",
    serviceUpdate: "/admin/services/update",
    serviceDelete: "/admin/services/delete",

    // Packages
    packages: "/admin/packages",
    packageSingle: "/admin/packages/single",
    packageCreate: "/admin/packages/create",
    packageUpdate: "/admin/packages/update",
    packageDelete: "/admin/packages/delete",

    // AI Models
    aiModels: "/admin/aiModels",
    aiModelSingle: "/admin/aiModels/single",
    aiModelCreate: "/admin/aiModels/create",
    aiModelUpdate: "/admin/aiModels/update",
    aiModelDelete: "/admin/aiModels/delete",

    // Settings
    settings: "/admin/settings",
    settingsUpsert: "/admin/settings/upsert",
    settingsUpsertMany: "/admin/settings/upsert-many",
    privacyPolicy: "/admin/settings/privacy-policy",
    settingsPrivacyPolicy: "/admin/settings/privacy-policy", // alias used by adminService

    // Subscriptions
    subscriptions: "/admin/subscriptions",
    subscriptionSingle: "/admin/subscriptions/single",
    subscriptionsActive: "/admin/subscriptions/active",

    // Cities
    // NOTE: Postman collection shows /api/admin/cities for POST/PUT/DELETE but
    // that "/api/" prefix is the backend's own router prefix — NOT the Next.js
    // proxy prefix.  apiFetch prepends API_BASE_URL ("/api") automatically, so
    // endpoints here must be relative to the backend root (no leading /api/).
    cities: "/admin/cities",
    cityCreate: "/admin/cities",
    citySingle: (id: string | number) => `/admin/cities/${id}`,
    cityUpdate: (id: string | number) => `/admin/cities/${id}`,
    cityDelete: (id: string | number) => `/admin/cities/${id}`,

    // Countries
    countries: "/admin/countries",
    countryCreate: "/admin/countries",
    countrySingle: (id: string | number) => `/admin/countries/${id}`,
    countryUpdate: (id: string | number) => `/admin/countries/${id}`,
    countryDelete: (id: string | number) => `/admin/countries/${id}`,

    // Clients
    clients: "/admin/clients",
    clientSingle: "/admin/clients/single",
    clientCreate: "/admin/clients/create",
    clientUpdate: "/admin/clients/update",
    clientDelete: (id: string | number) => `/admin/clients/${id}`,
    clientToggle: (id: string | number) => `/admin/clients/${id}/toggle-status`,
  },

  // ── Broadcasting (websocket auth) ────────────────────────────────────────────
  broadcasting: {
    auth: "/customer/broadcasting/auth", // GET/POST — private channel auth
  },

  // ── Store Intelligence (a.k.a. Customer Island) ──────────────────────────────
  // The current backend serves these under /customer/store-intelligence/*.
  // Older deployments used /customer/island/* (same sub-paths); islandService
  // tries store-intelligence first and falls back to island automatically.
  storeIntelligence: {
    dashboard: "/customer/store-intelligence/dashboard",
    traffic: "/customer/store-intelligence/traffic",
    conversion: "/customer/store-intelligence/conversion",
    demographics: "/customer/store-intelligence/demographics",
    heatmap: "/customer/store-intelligence/heatmap",
    employeePresence: "/customer/store-intelligence/employee-presence",
    responseTime: "/customer/store-intelligence/response-time",
    violations: "/customer/store-intelligence/violations",
    compliance: "/customer/store-intelligence/compliance",
    settings: "/customer/store-intelligence/settings", // GET + POST same URL
    // Legacy base (kept for the islandService fallback)
    legacyBase: "/customer/island",
  },

  // ── Webhooks / public callbacks (server-to-server) ───────────────────────────
  webhooks: {
    whatsapp: "/webhook/whatsapp", // GET verify · POST inbound
    foodicsSuccess: "/foodics-success", // GET OAuth success redirect
    foodicsWebhook: "/foodics-webhook", // POST Foodics events
  },

  // ── Orchestrator (worker / GPU control plane) ───────────────────────────────
  // Machine-to-machine endpoints authenticated with the X-Orchestrator-Token
  // header (see orchestratorService). activate/heartbeat/reset-all are writes;
  // active/pending/stale/stop-list are read-only monitoring feeds.
  orchestrator: {
    activate: "/orchestrator/activate", // POST { camera_service_id, container_id }
    active: "/orchestrator/active", // GET  currently-assigned workers
    heartbeat: "/orchestrator/heartbeat", // POST { workers[], gpu_stats[] }
    pending: "/orchestrator/pending", // GET  camera-services awaiting assignment
    resetAll: "/orchestrator/reset-all", // POST clears all assignments
    stale: "/orchestrator/stale", // GET  workers past the heartbeat threshold
    stopList: "/orchestrator/stop-list", // GET  camera-services flagged to stop
  },
} as const;
