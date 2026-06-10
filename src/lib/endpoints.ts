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
    login:        "/login",
    register:     "/customer/register",
    logout:       "/customer/logout",
    adminLogout:  "/admin/logout",

    // OTP / forgot-password flow:
    //   Step 1 → sendOtp   POST /customer/email/send-otp { email }
    //   Step 2 → OTP page
    //   Step 3 → resetPassword POST /customer/profile/update { password }
    sendOtp:       "/customer/email/send-otp",
    resetPassword: "/customer/profile/update",   // step-3 of forgot-password

    // Face login
    face:          "/customer/face-login",       // POST face recognition login

    // Profile
    profile:       "/customer/profile",          // GET  profile
    updateProfile: "/customer/profile/update",   // POST update profile
    updateClient:  "/customer/client/update",    // POST update client info
  },

  // ── Lookup / reference data ─────────────────────────────────────────────────
  lookups: {
    countries:  "/customer/countries",
    cities:     "/customer/cities",
    categories: "/customer/categories",
    packages:   "/customer/packages",
  },

  // ── Notifications ────────────────────────────────────────────────────────────
  notifications: {
    list:        "/customer/notifications",
    unreadCount: "/customer/notifications/unread-count",
    markAllRead: "/customer/notifications/mark-all-read",
    markRead:    (id: string | number) => `/customer/notifications/${id}/read`,
  },

  // ── Dashboard (overview) ─────────────────────────────────────────────────────
  dashboard: {
    overview: "/customer/dashboard",   // single unified dashboard endpoint
  },

  // ── Analytics ───────────────────────────────────────────────────────────────
  analytics: {
    summary:   "/customer/analytics/summary",
    trends:    "/customer/analytics/trends",
    byService: "/customer/analytics/by-service",
    byCamera:  "/customer/analytics/by-camera",
    byBranch:  "/customer/analytics/by-branch",
    branches:  "/customer/branches",
  },

  // ── Detections ───────────────────────────────────────────────────────────────
  detections: {
    list:      "/customer/detections",
    single:    "/customer/detections/single",
    byId:      (id: string | number) => `/customer/detections/${id}`,
    create:    "/customer/detections/create",
    update:    "/customer/detections/update",
    delete:    "/customer/detections/delete",
    test:      "/customer/detections/test",
  },

  // ── Real-time / System Monitoring ────────────────────────────────────────────
  monitoring: {
    pulse:     "/customer/realtime/pulse",
    heartbeat: "/customer/realtime/heartbeat",
  },

  // ── Cameras ──────────────────────────────────────────────────────────────────
  cameras: {
    list:        "/customer/cameras",
    single:      "/customer/cameras/single",
    checkOnline: "/customer/cameras/check-online",
    create:      "/customer/cameras/create",
    update:      "/customer/cameras/update",
    delete:      "/customer/cameras/delete",
  },

  // ── Organization (branches / departments / employees) ───────────────────────
  organization: {
    branches:         "/customer/branches",
    branchSingle:     "/customer/branches/single",
    branchCreate:     "/customer/branches/create",
    branchUpdate:     "/customer/branches/update",
    branchDelete:     "/customer/branches/delete",

    departments:      "/customer/departments",
    departmentSingle: "/customer/departments/single",
    departmentCreate: "/customer/departments/create",
    departmentUpdate: "/customer/departments/update",
    departmentDelete: "/customer/departments/delete",

    employees:        "/customer/employees",
    employeeSingle:   "/customer/employees/single",
    employeeCreate:   "/customer/employees/create",
    employeeUpdate:   "/customer/employees/update",
    employeeDelete:   "/customer/employees/delete",
  },

  // ── Attendance ───────────────────────────────────────────────────────────────
  attendance: {
    list:      "/customer/attendances",
    dashboard: "/customer/attendances/dashboard",
    checkIn:   "/customer/attendances/check-in",
    checkOut:  "/customer/attendances/check-out",
  },

  // ── Roles & Permissions ──────────────────────────────────────────────────────
  roles: {
    list:        "/customer/roles",
    single:      "/customer/roles/single",
    create:      "/customer/roles/create",
    update:      "/customer/roles/update",
    delete:      "/customer/roles/delete",
    permissions: "/customer/roles/permissions",
  },

  // ── Services (AI services catalog) ──────────────────────────────────────────
  services: {
    list:      "/customer/services",
    single:    "/customer/services/single",
    available: "/customer/services/available",
  },

  // ── Subscription ─────────────────────────────────────────────────────────────
  subscription: {
    current:           "/customer/subscriptions/current",
    subscribe:         "/customer/subscriptions/subscribe",
    renew:             "/customer/subscriptions/renew",
    transactions:      "/customer/subscription-transactions",
    transactionSingle: "/customer/subscription-transactions/single",
    usage:             "/customer/subscriptions/usage",
    availableServices: "/customer/services",
    services:          "/customer/services",
  },

  // ── Tasks ────────────────────────────────────────────────────────────────────
  tasks: {
    list:      "/customer/tasks",
    single:    "/customer/tasks/single",
    board:     "/customer/tasks/board",
    create:    "/customer/tasks/create",
    update:    "/customer/tasks/update",
    delete:    "/customer/tasks/delete",
    status:    "/customer/tasks/update",    // Postman: POST /update with { id, status } — no separate status endpoint
    dashboard: "/customer/tasks/dashboard",
    branches:  "/customer/branches",
  },

  // ── My Tasks ─────────────────────────────────────────────────────────────────
  myTasks: {
    list:     "/customer/my-tasks",
    stats:    "/customer/my-tasks/stats",
    start:    (id: string | number) => `/customer/my-tasks/${id}/start`,
    complete: (id: string | number) => `/customer/my-tasks/${id}/complete`,
    status:   (id: string | number) => `/customer/my-tasks/${id}/status`,
  },

  // ── Task Analytics ───────────────────────────────────────────────────────────
  taskAnalytics: {
    sla:           "/customer/task-analytics/sla",
    workers:       "/customer/task-analytics/workers",
    volume:        "/customer/task-analytics/volume",
    aiPipeline:    "/customer/task-analytics/ai-pipeline",
    verify:        "/customer/task-analytics/verify",
    reject:        "/customer/task-analytics/reject",
    verifications: "/customer/task-analytics/verifications",
    branches:      "/customer/branches",
  },

  // ── Task Reports ─────────────────────────────────────────────────────────────
  taskReports: {
    performance:           "/customer/task-reports/performance",
    sla:                   "/customer/task-reports/sla",
    slaCompliance:         "/customer/task-reports/sla",           // alias
    exportExcel:           "/customer/task-reports/export-excel",
    exportCsv:             "/customer/task-reports/export-excel",  // same endpoint, format param
    verificationAccuracy:  "/customer/task-reports/performance",   // fallback to performance
  },

  // ── Task Rules ───────────────────────────────────────────────────────────────
  taskRules: {
    list:   "/customer/task-rules",
    save:   "/customer/task-rules/save",    // POST — create & update per Postman
    update: (id: string | number) => `/customer/task-rules/${id}`,
    delete: (id: string | number) => `/customer/task-rules/${id}`,
  },

  // ── Escalation ───────────────────────────────────────────────────────────────
  escalation: {
    rules:    "/customer/escalation/rules",
    rule:     (id: string | number) => `/customer/escalation/rules/${id}`,
    saveRule: "/customer/escalation/save-rule",
    log:      "/customer/escalation/log",
  },

  // ── Smart Scheduler ──────────────────────────────────────────────────────────
  smartScheduler: {
    suggestWorkers:  "/customer/smart-scheduler/suggest-workers",
    suggestSchedule: "/customer/smart-scheduler/suggest-schedule",
    autoSchedule:    "/customer/smart-scheduler/auto-schedule",
    applySchedule:   "/customer/smart-scheduler/apply",
  },

  // ── Task Templates ───────────────────────────────────────────────────────────
  taskTemplates: {
    list:       "/customer/task-templates",
    createTask: "/customer/task-templates/create-task",
    use:        (id: string | number) => `/customer/task-templates/${id}/use`,
    delete:     (id: string | number) => `/customer/task-templates/${id}`,
  },

  // ── Projects ─────────────────────────────────────────────────────────────────
  projects: {
    list:   "/customer/projects",
    single: "/customer/projects/single",
    create: "/customer/projects/create",
    update: "/customer/projects/update",
    cancel: "/customer/projects/cancel",
    delete: "/customer/projects/delete",
  },

  // ── Productivity ─────────────────────────────────────────────────────────────
  productivity: {
    summary:        "/customer/productivity/summary",
    leaderboard:    "/customer/productivity/leaderboard",
    departments:    "/customer/productivity/departments",
    employeeDetail: (id: string | number) => `/customer/productivity/employee/${id}`,
  },

  // ── Report Center ────────────────────────────────────────────────────────────
  reportCenter: {
    // Working endpoints (from Postman)
    generate:       "/customer/reports/generate",
    scheduled:      "/customer/reports/scheduled",
    schedule:       "/customer/reports/schedule",
    scheduledById:  (id: string) => `/customer/reports/scheduled/${id}`,
    download:       (id: string) => `/customer/reports/${id}/download`,
    // Additional endpoints used by reportCenterService
    templates:      "/customer/reports/templates",
    generated:      "/customer/reports/generated",
    generatedById:  (id: string) => `/customer/reports/generated/${id}`,
  },

  // ── Statistics (business reports tabs) ───────────────────────────────────────
  // NOTE: /customer/reports/statistics is the real endpoint.
  // The tab-specific paths (customers, suppliers …) may 404 on this backend;
  // reportsService.fetchReport() always tries /statistics first, then demo data.
  reports: {
    statistics: "/customer/reports/statistics",
    customers:  "/customer/reports/customers",
    suppliers:  "/customer/reports/suppliers",
    sales:      "/customer/reports/sales",
    purchases:  "/customer/reports/purchases",
    inventory:  "/customer/reports/inventory",
    financials: "/customer/reports/financials",
  },

  // ── Notification Settings ────────────────────────────────────────────────────
  // GET and POST share the same URL — intentional (REST convention)
  notificationSettings: {
    get:            "/customer/notification-settings",   // GET
    update:         "/customer/notification-settings",   // POST (same URL)
    test:           "/customer/notification-settings/test",
    testEmail:      "/customer/notification-settings/test-email",
    verifyTelegram: "/customer/notification-settings/verify-telegram",
  },

  // ── Security / 2FA ───────────────────────────────────────────────────────────
  security: {
    status:          "/customer/2fa/status",
    setup:           "/customer/2fa/setup",
    enable:          "/customer/2fa/enable",
    disable:         "/customer/2fa/disable",
    verify:          "/customer/2fa/verify",
    // Aliases used by securityService.ts
    twoFactorStatus: "/customer/2fa/status",
    twoFactorSetup:  "/customer/2fa/setup",
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
    efficiencyIndex:  "/customer/branch-intelligence/efficiency-index",
    rankings:         "/customer/branch-intelligence/rankings",
    heatmap:          "/customer/branch-intelligence/heatmap",
    branchHealth:     "/customer/branch-intelligence/branch-health",
    serviceMatrix:    "/customer/branch-intelligence/service-matrix",
    aiInsights:       "/customer/branch-intelligence/ai-insights",
    anomalyDetection: "/customer/branch-intelligence/anomaly-detection",
    trendForecast:    "/customer/branch-intelligence/trend-forecast",
    hourlyPeaks:      "/customer/branch-intelligence/hourly-peaks",
    periodComparison: "/customer/branch-intelligence/period-comparison",
  },

  // ── Chat (AI Assistant) ──────────────────────────────────────────────────────
  chat: {
    send:       "/customer/chat",
    sendPublic: "/customer/chat/public",
    history:    "/customer/chat/history",
  },

  // ── Chat Analytics ───────────────────────────────────────────────────────────
  chatAnalytics: {
    all:           "/customer/chat/analytics",
    conversations: "/customer/chat/analytics/conversations",
  },

  // ── Chat Settings ────────────────────────────────────────────────────────────
  chatSettings: {
    settings:     "/customer/chat/settings",
    testWhatsapp: "/customer/chat/settings/test-whatsapp",
    resetAlerts:  "/customer/chat/settings/reset-alerts",
  },

  // ── Foodics Integration ──────────────────────────────────────────────────────
  foodics: {
    status:       "/customer/foodics/status",
    connect:      "/customer/foodics/connect",
    disconnect:   "/customer/foodics/disconnect",
    importBranches: "/customer/foodics/branches/import",

    // Dashboard
    dashboard: "/customer/foodics/dashboard",

    // Orders
    orders:     "/customer/foodics/orders",
    ordersSync: "/customer/foodics/orders/sync",

    // Refund Verification
    refunds: "/customer/foodics/refunds",

    // Cash Drawer
    drawerAudits:       "/customer/foodics/drawer-audits",
    drawerOperationsSync: "/customer/foodics/drawer-operations/sync",

    // Prep Time
    prepTime: "/customer/foodics/prep-time",

    // Footfall vs Revenue
    footfall: "/customer/foodics/footfall",

    // Inventory
    inventoryZones:       "/customer/foodics/inventory/zones",
    inventoryZoneCreate:  "/customer/foodics/inventory/zones/create",
    inventoryZoneUpdate:  (id: string) => `/customer/foodics/inventory/zones/${id}/update`,
    inventoryZoneDelete:  (id: string) => `/customer/foodics/inventory/zones/${id}/delete`,
    inventoryAuditHistory: "/customer/foodics/inventory/audits",
  },

  // ── Fatoorah Payment ─────────────────────────────────────────────────────────
  payment: {
    linkFatoorah:   "/customer/link-fatoorah",
    fatoorahStatus: "/customer/fatoorah/status",
    unlinkFatoorah: "/customer/fatoorah/unlink",
  },

  // ── Admin Panel ──────────────────────────────────────────────────────────────
  admin: {
    login:   "/login",
    logout:  "/admin/logout",

    // Users
    users:       "/admin/users",
    userSingle:  "/admin/users/single",
    userCreate:  "/admin/users/create",
    userUpdate:  "/admin/users/update",
    userDelete:  "/admin/users/delete",

    // Categories
    categories:      "/admin/categories",
    categorySingle:  "/admin/categories/single",
    categoryCreate:  "/admin/categories/create",
    categoryUpdate:  "/admin/categories/update",
    categoryDelete:  "/admin/categories/delete",

    // Services
    services:      "/admin/services",
    serviceSingle: "/admin/services/single",
    serviceCreate: "/admin/services/create",
    serviceUpdate: "/admin/services/update",
    serviceDelete: "/admin/services/delete",

    // Packages
    packages:      "/admin/packages",
    packageSingle: "/admin/packages/single",
    packageCreate: "/admin/packages/create",
    packageUpdate: "/admin/packages/update",
    packageDelete: "/admin/packages/delete",

    // AI Models
    aiModels:      "/admin/aiModels",
    aiModelSingle: "/admin/aiModels/single",
    aiModelCreate: "/admin/aiModels/create",
    aiModelUpdate: "/admin/aiModels/update",
    aiModelDelete: "/admin/aiModels/delete",

    // Settings
    settings:           "/admin/settings",
    settingsUpsert:     "/admin/settings/upsert",
    settingsUpsertMany: "/admin/settings/upsert-many",
    privacyPolicy:          "/admin/settings/privacy-policy",
    settingsPrivacyPolicy:  "/admin/settings/privacy-policy",  // alias used by adminService

    // Subscriptions
    subscriptions:       "/admin/subscriptions",
    subscriptionSingle:  "/admin/subscriptions/single",
    subscriptionsActive: "/admin/subscriptions/active",

    // Cities  (POST/PUT/DELETE use /api/admin/ prefix per Postman)
    cities:       "/admin/cities",
    cityCreate:   "/api/admin/cities",
    citySingle:   (id: string | number) => `/admin/cities/${id}`,
    cityUpdate:   (id: string | number) => `/api/admin/cities/${id}`,
    cityDelete:   (id: string | number) => `/api/admin/cities/${id}`,

    // Countries
    countries:      "/admin/countries",
    countryCreate:  "/api/admin/countries",
    countrySingle:  (id: string | number) => `/admin/countries/${id}`,
    countryUpdate:  (id: string | number) => `/admin/countries/${id}`,
    countryDelete:  (id: string | number) => `/api/admin/countries/${id}`,
  }

} as const;
