/**
 * Single source of truth for backend endpoints used across the dashboard.
 * Mirrors the routes exposed by the rgeeb API
 * (https://api.dev.rgeeb.com/api). Keep relative paths only — the base URL
 * is set in src/lib/api.ts.
 */
export const endpoints = {
  auth: {
    login: "/login",
    register: "/customer/register",
    sendOtp: "/customer/email/send-otp",
    // Forgot & reset password: the API uses OTP-based flow
    // Step 1: POST /customer/email/send-otp { email }
    // Step 2: Verify OTP at /otp page
    // Step 3: POST /customer/profile/update { password, password_confirmation }
    forgotPassword: "/customer/email/send-otp",
    resetPassword: "/customer/profile/update",
    refresh: "/auth/refresh",
    logout: "/customer/logout", // customer logout
    adminLogout: "/admin/logout", // admin logout
    face: "/customer/face-login", // POST /customer/face-login (image)
    profile: "/customer/profile",
    updateProfile: "/customer/profile/update",
    updateClient: "/customer/client/update",
  },
  lookups: {
    countries: "/customer/countries",
    cities: "/customer/cities",
    categories: "/customer/categories",
    packages: "/customer/packages",
  },
  customer: {
    profile: "/customer/profile",
    notifications: "/customer/notifications",
    notificationsUnread: "/customer/notifications/unread-count",
    notificationsMarkAllRead: "/customer/notifications/mark-all-read",
    notificationRead: (id: string | number) =>
      `/customer/notifications/${id}/read`,
    tasksDashboard: "/customer/tasks/dashboard",
  },
  dashboard: {
    overview: "/customer/dashboard",
    tasksSummary: "/customer/dashboard",
    aiServices: "/customer/ai-services",
    visitorFlow: "/customer/analytics/visitor-flow",
    liveActivity: "/customer/monitoring/live-activity",
    attendance: "/customer/analytics/attendance",
    compliance: "/customer/analytics/compliance",
    detectionsBreakdown: "/customer/analytics/detections-breakdown",
    branches: "/customer/branches",
    cameras: "/customer/cameras",
  },
  reports: {
    customers: "/customer/reports/customers",
    suppliers: "/customer/reports/suppliers",
    sales: "/customer/reports/sales",
    purchases: "/customer/reports/purchases",
    inventory: "/customer/reports/inventory",
    financials: "/customer/reports/financials",
  },
  analytics: {
    summary: "/customer/analytics/summary",
    trends: "/customer/analytics/trends",
    byService: "/customer/analytics/by-service",
    byCamera: "/customer/analytics/by-camera",
    byBranch: "/customer/analytics/by-branch",
    branches: "/customer/branches",
  },
  monitoring: {
    pulse: "/customer/realtime/pulse",
    heartbeat: "/customer/realtime/heartbeat",
    detections: "/customer/realtime/detections",
    timeline: "/customer/realtime/timeline",
    notifications: "/customer/notifications",
  },
  detections: {
    list: "/customer/detections",
    single: "/customer/detections/single",
    dashboard: "/customer/detections/dashboard",
    create: "/customer/detections/create",
    update: "/customer/detections/update",
    delete: "/customer/detections/delete",
    test: "/customer/detections/test",
    byId: (id: string) => `/customer/detections/${id}`,
  },
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
    availableServices: "/customer/branch-intelligence/available-services",
  },
  productivity: {
    summary: "/customer/productivity/summary",
    leaderboard: "/customer/productivity/leaderboard",
    departments: "/customer/productivity/departments",
    employee: "/customer/productivity/employees",
    employeeDetail: (id: string | number) =>
      `/customer/productivity/employee/${id}`,
  },
  chat: {
    send: "/customer/chat",
    sendPublic: "/customer/chat/public",
    history: "/customer/chat/history",
  },
  chatAnalytics: {
    all: "/customer/chat/analytics",
    conversations: "/customer/chat/analytics/conversations",
  },
  chatSettings: {
    settings: "/customer/chat/settings",
    testWhatsapp: "/customer/chat/settings/test-whatsapp",
    resetAlerts: "/customer/chat/settings/reset-alerts",
  },
  tasks: {
    list: "/customer/tasks",
    dashboard: "/customer/tasks/dashboard",
    board: "/customer/tasks/board",
    create: "/customer/tasks/create",
    update: "/customer/tasks/update",
    delete: "/customer/tasks/delete",
    single: "/customer/tasks/single",
    status: "/customer/tasks/status",
    byId: (id: string) => `/customer/tasks/${id}`,
    branches: "/customer/branches",
  },
  myTasks: {
    list: "/customer/my-tasks",
    stats: "/customer/my-tasks/stats",
    start: (id: string) => `/customer/my-tasks/${id}/start`,
    complete: (id: string) => `/customer/my-tasks/${id}/complete`,
    status: (id: string) => `/customer/my-tasks/${id}/status`,
  },
  taskAnalytics: {
    sla: "/customer/task-analytics/sla",
    workers: "/customer/task-analytics/workers",
    volume: "/customer/task-analytics/volume",
    aiPipeline: "/customer/task-analytics/ai-pipeline",
    branches: "/customer/task-analytics/branches",
    verify: "/customer/task-analytics/verify",
    reject: "/customer/task-analytics/reject",
    verifications: "/customer/task-analytics/verifications",
  },
  taskReports: {
    performance: "/customer/task-reports/performance",
    sla: "/customer/task-reports/sla",
    exportExcel: "/customer/task-reports/export-excel",
  },
  escalation: {
    rules: "/customer/escalation/rules",
    saveRule: "/customer/escalation/save-rule",
    rule: (id: string) => `/customer/escalation/rules/${id}`,
    log: "/customer/escalation/log",
    notifications: "/customer/task-notifications",
    unreadCount: "/customer/task-notifications/unread-count",
  },
  taskRules: {
    list: "/customer/task-rules",
    save: "/customer/task-rules/save",
  },
  organization: {
    branches: "/customer/branches",
    branchSingle: "/customer/branches/single",
    branchCreate: "/customer/branches/create",
    branchUpdate: "/customer/branches/update",
    branchDelete: "/customer/branches/delete",
    branch: (id: string) => `/customer/branches/${id}`,
    departments: "/customer/departments",
    departmentSingle: "/customer/departments/single",
    departmentCreate: "/customer/departments/create",
    departmentUpdate: "/customer/departments/update",
    departmentDelete: "/customer/departments/delete",
    department: (id: string) => `/customer/departments/${id}`,
    employees: "/customer/employees",
    employeeSingle: "/customer/employees/single",
    employeeCreate: "/customer/employees/create",
    employeeUpdate: "/customer/employees/update",
    employeeDelete: "/customer/employees/delete",
    employee: (id: string) => `/customer/employees/${id}`,
  },
  roles: {
    list: "/customer/roles",
    single: "/customer/roles/single",
    create: "/customer/roles/create",
    update: "/customer/roles/update",
    delete: "/customer/roles/delete",
    byId: (id: string) => `/customer/roles/${id}`,
    permissions: "/customer/roles/permissions",
    rolePermissions: (id: string) => `/customer/roles/${id}/permissions`,
  },
  notificationSettings: {
    get: "/customer/notification-settings",
    update: "/customer/notification-settings",
    test: "/customer/notification-settings/test",
    testTelegram: "/customer/notification-settings/test-telegram",
    testEmail: "/customer/notification-settings/test-email",
    verifyTelegram: "/customer/notification-settings/verify-telegram",
  },
  security: {
    twoFactorStatus: "/customer/2fa/status",
    twoFactorSetup: "/customer/2fa/setup",
    twoFactorEnable: "/customer/2fa/enable",
    twoFactorDisable: "/customer/2fa/disable",
    twoFactorVerify: "/customer/2fa/verify",
  },
  reportCenter: {
    types: "/customer/reports/types",
    generate: "/customer/reports/generate",
    history: "/customer/reports/history",
    scheduled: "/customer/reports/scheduled",
    schedule: "/customer/reports/schedule",
    scheduledById: (id: string) => `/customer/reports/scheduled/${id}`,
    download: (id: string) => `/customer/reports/${id}/download`,
    branches: "/customer/branches",
    services: "/customer/services",
  },
  generalReports: {
    list: "/customer/reports",
    generate: "/customer/reports/generate",
    scheduled: "/customer/reports/scheduled",
  },
  subscription: {
    current: "/customer/subscriptions/current",
    subscribe: "/customer/subscriptions/subscribe",
    renew: "/customer/subscriptions/renew",
    usage: "/customer/subscription/usage",
    services: "/customer/subscription/services",
    transactions: "/customer/subscription-transactions",
    transactionSingle: "/customer/subscription-transactions/single",
    availableServices: "/customer/services",
  },
  admin: {
    // Dashboard
    dashboardStats: "/admin/dashboard/stats",
    dashboardImpersonate: "/admin/dashboard/impersonate",
    dashboardStopImpersonate: "/admin/dashboard/stop-impersonation",
    // Users (admin users list)
    users: "/admin/users",
    userSingle: "/admin/users/single",
    userCreate: "/admin/users/create",
    userUpdate: "/admin/users/update",
    userDelete: "/admin/users/delete",
    user: (id: string | number) => `/admin/users/${id}`,
    categories: "/admin/categories",
    categorySingle: "/admin/categories/single",
    categoryCreate: "/admin/categories/create",
    categoryUpdate: "/admin/categories/update",
    categoryDelete: "/admin/categories/delete",
    category: (id: string | number) => `/admin/categories/${id}`,
    services: "/admin/services",
    serviceSingle: "/admin/services/single",
    serviceCreate: "/admin/services/create",
    serviceUpdate: "/admin/services/update",
    serviceDelete: "/admin/services/delete",
    service: (id: string | number) => `/admin/services/${id}`,
    packages: "/admin/packages",
    packageSingle: "/admin/packages/single",
    packageCreate: "/admin/packages/create",
    packageUpdate: "/admin/packages/update",
    packageDelete: "/admin/packages/delete",
    package: (id: string | number) => `/admin/packages/${id}`,
    aiModels: "/admin/aiModels",
    aiModelSingle: "/admin/aiModels/single",
    aiModelCreate: "/admin/aiModels/create",
    aiModelUpdate: "/admin/aiModels/update",
    aiModelDelete: "/admin/aiModels/delete",
    aiModel: (id: string | number) => `/admin/aiModels/${id}`,
    settings: "/admin/settings",
    settingsUpsert: "/admin/settings/upsert",
    settingsUpsertMany: "/admin/settings/upsert-many",
    settingsPrivacyPolicy: "/admin/settings/privacy-policy",
    subscriptions: "/admin/subscriptions",
    subscriptionSingle: "/admin/subscriptions/single",
    subscriptionsActive: "/admin/subscriptions/active",
    subscription: (id: string | number) => `/admin/subscriptions/${id}`,
    // Cities
    cities: "/admin/cities",
    cityCreate: "/api/admin/cities",
    citySingle: (id: string | number) => `/admin/cities/${id}`,
    cityUpdate: (id: string | number) => `/api/admin/cities/${id}`,
    cityDelete: (id: string | number) => `/api/admin/cities/${id}`,
    // Countries
    countries: "/admin/countries",
    countryCreate: "/api/admin/countries",
    countrySingle: (id: string | number) => `/admin/countries/${id}`,
    countryUpdate: (id: string | number) => `/admin/countries/${id}`,
    countryDelete: (id: string | number) => `/api/admin/countries/${id}`,
  },
  cameras: {
    list: "/customer/cameras",
    single: "/customer/cameras/single",
    checkOnline: "/customer/cameras/check-online",
    create: "/customer/cameras/create",
    update: "/customer/cameras/update",
    delete: "/customer/cameras/delete",
  },
  attendance: {
    list: "/customer/attendances",
    dashboard: "/customer/attendances/dashboard",
    checkIn: "/customer/attendances/check-in",
    checkOut: "/customer/attendances/check-out",
  },
  projects: {
    list: "/customer/projects",
    single: "/customer/projects/single",
    create: "/customer/projects/create",
    update: "/customer/projects/update",
    cancel: "/customer/projects/cancel",
    delete: "/customer/projects/delete",
  },
  smartScheduler: {
    suggestWorkers: "/customer/smart-scheduler/suggest-workers",
    suggestSchedule: "/customer/smart-scheduler/suggest-schedule",
    autoSchedule: "/customer/smart-scheduler/auto-schedule",
    applySchedule: "/customer/smart-scheduler/apply",
  },
  driveThru: {
    dashboard: "/customer/drive-thru/dashboard",
  },
  taskTemplates: {
    list: "/customer/task-templates",
    createTask: "/customer/task-templates/create-task",
  },
  serviceMonitor: {
    dashboard: (serviceId: string | number) =>
      `/customer/service-monitor/${serviceId}/dashboard`,
  },
  foodics: {
    // Connection & Status
    status: "/customer/foodics/status",
    connectUrl: "/customer/foodics/connect",
    disconnect: "/customer/foodics/disconnect",

    // Dashboard
    dashboard: "/customer/foodics/dashboard",

    // Orders
    orders: "/customer/foodics/orders",
    ordersSync: "/customer/foodics/orders/sync",

    // Refund Verification
    refunds: "/customer/foodics/refunds",

    // Cash Drawer Audit
    drawerAudits: "/customer/foodics/drawer-audits",
    drawerOperationsSync: "/customer/foodics/drawer-operations/sync",

    // Prep Time Intelligence
    prepTime: "/customer/foodics/prep-time",

    // Footfall vs Revenue
    footfall: "/customer/foodics/footfall",

    // Inventory Audit
    inventoryZones: "/customer/foodics/inventory/zones",
    inventoryZoneCreate: "/customer/foodics/inventory/zones/create",
    inventoryZoneUpdate: (id: string) =>
      `/customer/foodics/inventory/zones/${id}/update`,
    inventoryZoneDelete: (id: string) =>
      `/customer/foodics/inventory/zones/${id}/delete`,
    inventoryAuditHistory: "/customer/foodics/inventory/audits",

    // Branches
    importBranches: "/customer/foodics/branches/import",
  },
  payment: {
    linkFatoorah: "/customer/link-fatoorah",
    fatoorahStatus: "/customer/fatoorah/status",
    unlinkFatoorah: "/customer/fatoorah/unlink",
  },
  services: {
    list: "/customer/services",
    single: "/customer/services/single",
    available: "/customer/services/available",
  },
} as const;

// PATCHED — append chat messaging endpoints
