/**
 * Shared permission logic.
 *
 * Both the sidebar (`hasPermission` in auth.tsx) and the page-level CRUD guard
 * (`usePermission`) MUST use the same alias map and matching rules — otherwise
 * an item can appear in the sidebar but its page rejects you with
 * "You are not authorized to perform this action" (and vice-versa).
 *
 * Real backend permissions use the format "namespace.action", e.g.
 * "task_management.read". Source: /customer/profile → roles[].permissions[].name
 */

/** Normalise: lowercase, treat `-`, `_`, and `.` as the same separator. */
export const normPerm = (s: string): string =>
  s.toLowerCase().replace(/[-_.]/g, "_");

/**
 * Granular AI-service / Customer-Island feature namespaces.
 *
 * In the OLD project each AI-service page was gated on its own subject
 * (helmet_detection, queue_management, people_counting, …). The NEW UI groups
 * them all under the single "island" (Store) menu, so holding ANY of these
 * backend grants must reveal the Island menu and open its pages — otherwise a
 * user provisioned with only granular feature permissions would see nothing
 * here. (Ported from old_extract navigation/vertical/index.ts subjects.)
 */
export const STORE_AI_FEATURES: string[] = [
  "helmet_detection",
  "kitchen_ppe",
  "fire_detection",
  "face_detection",
  "mask_detection",
  "age_gender_analytics",
  "behavior_analysis",
  "cash_register_monitoring",
  "clean_tables",
  "cup_counting",
  "customer_traffic",
  "delivery_tracking",
  "drive_thru_monitoring",
  "gate_monitoring",
  "license_plate_recognition",
  "motion_detection",
  "object_detection",
  "overcrowd_violation",
  "people_counting",
  "person_detection",
  "queue_management",
  "receipt_detection",
  "sandwich_counting",
  "smoking_detection",
  "spill_detection",
  "vehicle_tracking",
  "waiting_customer",
];

/**
 * Maps sidebar/view route keys → real backend permission namespaces.
 * A single route key can map to several backend namespaces (ANY match grants).
 */
export const PERMISSION_ALIASES: Record<string, string[]> = {
  // ── Dashboard & Overview ──
  dashboard: [
    "detections",
    "analytics",
    "branches",
    "service_monitor",
    "task_management",
  ],
  // ── AI Services ──
  ai_services: ["detections", "analytics", "service_monitor"],
  // OLD project gated the whole "AI Services" group on the `services` subject
  // (services.read). Map it to the same namespaces plus the Island/Store group.
  services: ["services", "detections", "analytics", "service_monitor", "store", "island", ...STORE_AI_FEATURES],
  detection_feed: ["detections"],
  live_feeds: ["detections", "cameras"],
  system_monitoring: ["detections", "cameras", "service_monitor"],
  // ── Analytics & Insights ──
  analytics: ["analytics"],
  statistics: ["reports", "analytics"],
  insights: ["analytics"],
  chat_analytics: ["analytics"],
  br_intelligence: ["analytics"],
  // ── Tasks ──
  tasks: ["task_management"],
  kanban: ["task_management"],
  my_tasks: ["my_tasks", "task_management"],
  task_analytics: ["task_analytics"],
  task_reports: ["task_reports"],
  ai_scheduler: ["smart_scheduler"],
  task_templates: ["task_templates"],
  ai_task_rules: ["task_rules"],
  escalation_alerts: ["escalation"],
  // ── Organization ──
  organization: ["branches", "departments", "employees"],
  branches: ["branches"],
  departments: ["departments"],
  employees: ["employees"],
  cameras: ["cameras"],
  attendance: ["attendances", "attendance"],
  // ── Customer Island / Store (backend ACL namespace is `store.*`) ──
  // Branded "Store" in the UI; historically keyed "island". The backend grants
  // access via granular `store.*` leaves (store.dashboard, store.traffic, …,
  // store.settings.read) with NO bare `store`/`store.read` — the read-prefix
  // rule in permissionMatchesAction lets any `store.*` grant reveal the menu and
  // open every page (sidebar ↔ guard both call hasPermission("island")).
  island: ["island", "customer_island", "store", ...STORE_AI_FEATURES],
  customer_island: ["island", "customer_island", "store", ...STORE_AI_FEATURES],
  store: ["store", "island", "customer_island", ...STORE_AI_FEATURES],
  // ── Preferences ──
  preferences: ["roles", "notification_settings", "settings"],
  roles: ["roles"],
  permissions: ["roles"],
  notification_settings: ["notification_settings"],
  security: ["settings"],
  chat_settings: ["settings"],
  // ── Reports & Other ──
  report_center: ["reports"],
  subscription: ["subscriptions"],
  // Fatoorah (payment link) — backend grants fatoorah.link / .status / .unlink
  // (non-CRUD leaves). Listing the namespace lets the read-prefix rule reveal it.
  fatoorah: ["fatoorah", "subscriptions"],
  // Productivity sits under Insights. The OLD project gated it on `roles`
  // (same as Branch Intelligence), and the backend doesn't expose a dedicated
  // `productivity` namespace — so map it to the namespaces the other visible
  // Insights items use (analytics / roles), plus its own, so it shows whenever
  // any of those is granted.
  productivity: ["productivity", "analytics", "roles"],
  // ── Foodics ──
  // Backend grants Foodics access via the `foodics.connect` permission plus
  // granular child namespaces (foodics.orders, foodics.dashboard, …). The OLD
  // project showed the whole group if the user had ANY of these. We list every
  // real namespace as a candidate so a grant on any one reveals the menu.
  foodics: [
    "foodics",
    "foodics_connect",
    "foodics_orders",
    "foodics_refund_verifications",
    "foodics_drawer_audits",
    "foodics_prep_times",
    "foodics_conversion",
    "foodics_inventory",
    "foodics_inventory_zones",
    "foodics_dashboard",
  ],
  foodics_connection: ["foodics", "foodics_connect"],
  foodics_orders: ["foodics", "foodics_orders"],
  foodics_refund: ["foodics", "foodics_refund_verifications"],
  foodics_cash_drawer: ["foodics", "foodics_drawer_audits"],
  foodics_prep_time: ["foodics", "foodics_prep_times"],
  foodics_footfall: ["foodics", "foodics_conversion"],
  foodics_inventory: ["foodics", "foodics_inventory", "foodics_inventory_zones"],
  foodics_dashboard: ["foodics", "foodics_dashboard"],
  foodics_health: ["foodics", "foodics_dashboard"],
  // ── Event Timeline / Notifications ──
  event_timeline: ["alerts", "notifications"],
  notifications: ["notifications", "notification"],
  // ── Customer Lifecycle (CRM) ──
  customer_lifecycle: ["customer_lifecycle", "crm"],
  crm_dashboard: ["customer_lifecycle", "crm"],
  crm_customers: ["customer_lifecycle", "crm"],
  crm_lifecycle: ["customer_lifecycle", "crm"],
  crm_subscriptions: ["customer_lifecycle", "crm"],
  crm_branches: ["customer_lifecycle", "crm"],
  crm_cameras: ["customer_lifecycle", "crm"],
  crm_ai_services: ["customer_lifecycle", "crm"],
  crm_modules: ["customer_lifecycle", "crm"],
  crm_integrations: ["customer_lifecycle", "crm"],
  crm_renewals: ["customer_lifecycle", "crm"],
};

// Each granular AI-service feature also resolves to the Island/Store group, so a
// page or sidebar item keyed by the specific feature (e.g. "queue_management")
// opens for a user holding that grant — and the Island menu reveals too.
for (const feature of STORE_AI_FEATURES) {
  if (!PERMISSION_ALIASES[feature]) {
    PERMISSION_ALIASES[feature] = [
      feature,
      "store",
      "island",
      "customer_island",
      "services",
    ];
  }
}

/** Resolve a route key to the list of namespaces that grant access to it. */
export function resolvePermissionCandidates(resource: string): string[] {
  const key = normPerm(resource);
  return [key, ...(PERMISSION_ALIASES[key] ?? [])];
}

/**
 * Does the user (with `userPerms`) have ANY permission for `resource`?
 * Mirrors the sidebar `hasPermission` matching exactly.
 */
export function permissionMatchesAny(
  resource: string,
  userPerms: string[]
): boolean {
  const candidates = resolvePermissionCandidates(resource);
  return userPerms.some((p) => {
    const np = normPerm(p);
    return candidates.some((c) => np === c || np.startsWith(`${c}_`));
  });
}

/**
 * Does the user have permission for a specific CRUD `action` on `resource`?
 * Matches "namespace.read", "namespace.*", "*.read", "*", or any broader grant
 * for the namespace (e.g. an admin-style "task_management" with no action).
 */
export function permissionMatchesAction(
  resource: string,
  action: string,
  userPerms: string[]
): boolean {
  const candidates = resolvePermissionCandidates(resource);
  const act = normPerm(action);
  return userPerms.some((p) => {
    const np = normPerm(p); // e.g. "task_management_read", "task_management", "*"
    // Global wildcards: "*" stays "*"; "*.read" → "*_read"
    if (np === "*" || np === `*_${act}`) return true;
    return candidates.some(
      (c) =>
        np === `${c}_${act}` || // exact namespace.action  (e.g. task_management_read)
        np === `${c}_*` || // namespace.*  → namespace_*
        np === c || // whole namespace granted with no action suffix (admin-style)
        // View/read is the lowest privilege: holding ANY permission inside the
        // namespace (even a non-CRUD leaf like store.dashboard,
        // foodics.dashboard.overview, fatoorah.status) implies you may view it.
        // We do NOT widen create/update/delete this way — those stay strict.
        (act === "read" && np.startsWith(`${c}_`))
    );
  });
}

/**
 * View-access check used by `hasPermission` (page guards + sidebar parity).
 *
 * Two shapes of `perm` are supported:
 *  1. A bare resource/route key (e.g. "tasks", "island", "system_monitoring")
 *     → requires `read` on that resource (a user with only create/update but
 *     no read can NOT view the page).
 *  2. An explicit "namespace.action" (e.g. "foodics.orders.read",
 *     "attendance.read", "analytics.read") → requires exactly that action.
 *
 * Both go through the same alias map + matcher, so the sidebar and every page
 * guard agree: an item shows IFF its page opens.
 */
export function canAccess(
  perm: string,
  {
    isAdmin,
    userPerms,
    rbacProvided,
  }: { isAdmin: boolean; userPerms: string[]; rbacProvided?: boolean }
): boolean {
  if (isAdmin) return true;

  // No RBAC data at all → legacy account: grant. Empty list w/ RBAC → fail closed.
  if (!userPerms || userPerms.length === 0) {
    return rbacProvided !== true;
  }

  // Detect an explicit CRUD action suffix on the requested permission.
  const ACTIONS = ["read", "create", "update", "delete"];
  const lastSegment = perm.split(".").pop()?.toLowerCase() ?? "";
  if (ACTIONS.includes(lastSegment)) {
    const resource = perm.slice(0, perm.lastIndexOf("."));
    return permissionMatchesAction(resource, lastSegment, userPerms);
  }

  // Bare resource key → viewing requires read.
  return permissionMatchesAction(perm, "read", userPerms);
}
