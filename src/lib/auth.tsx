"use client";

import * as React from "react";

import {
  clearAuthAndRedirect,
  setAuthToken,
  getAuthToken,
  setAuthRole,
  getAuthRole,
  setStoredUser,
  getStoredUser,
} from "@/lib/api";
import {
  loginRequest,
  registerRequest,
  fetchProfileRequest,
  logoutRequest,
  type AuthUserRaw,
  type RegisterPayload,
} from "@/services/authService";

/**
 * Auth context backed by the rgeeb API.
 * Uses secure httpOnly cookies for token storage (managed by backend).
 * Caches the resolved user profile in React state so the dashboard shell
 * can render synchronously after a refresh.
 */

export interface AuthUser {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "admin" | "user";
  permissions: string[];
  /**
   * True when the backend profile payload actually contained a `roles` or
   * `permissions` field. Used to distinguish "this account type has no RBAC"
   * (legacy backend — fail open for compatibility) from "RBAC is enabled but
   * this user was granted nothing" (fail closed).
   */
  rbacProvided: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (perm: string) => boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ isAdmin: boolean }>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

function normalisePermissions(raw: AuthUserRaw["permissions"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((p) => (typeof p === "string" ? p : (p?.name ?? "")))
      .filter(Boolean)
      .map((p) => String(p));
  }
  if (typeof raw === "object") {
    return Object.keys(raw).filter((k) => (raw as Record<string, unknown>)[k]);
  }
  return [];
}

function collectFromRoles(roles: AuthUserRaw["roles"]): {
  roleNames: string[];
  perms: string[];
} {
  const roleNames: string[] = [];
  const perms: string[] = [];
  if (!Array.isArray(roles)) return { roleNames, perms };
  for (const r of roles) {
    if (r?.name) roleNames.push(String(r.name));
    perms.push(...normalisePermissions(r?.permissions));
  }
  return { roleNames, perms };
}

function toAuthUser(raw: AuthUserRaw | null, fallbackEmail?: string): AuthUser {
  const email = raw?.email ?? fallbackEmail ?? "";

  // Prefer name_en for display, fall back to name_ar, then name, then email-derived
  const nameEn = raw?.name_en ?? raw?.name ?? raw?.full_name;
  const nameAr = raw?.name_ar;
  const displayName =
    nameEn ??
    nameAr ??
    (email ? email.split("@")[0].replace(/[._-]/g, " ") : "User");

  const fromRoles = collectFromRoles(raw?.roles);
  const directPerms = normalisePermissions(raw?.permissions);
  const permissions = Array.from(
    new Set([...directPerms, ...fromRoles.perms].map((p) => p.toLowerCase()))
  );

  // Admin detection:
  //  1. type === "admin"          — direct field in login response
  //  2. role name === "rgeeb admin"
  //  3. any permission starts with "admin."
  // "super admin" is a tenant-level role — NOT a platform admin.
  const typeLower = String(
    (raw as { type?: string })?.type ?? ""
  ).toLowerCase();
  const roleNamesLower = [
    String(raw?.role ?? "").toLowerCase(),
    ...fromRoles.roleNames.map((r) => r.toLowerCase()),
  ];
  const isAdminRole =
    typeLower === "admin" ||
    roleNamesLower.some((r) => r === "rgeeb admin") ||
    permissions.some((p) => p.startsWith("admin."));

  // RBAC is considered "provided" when the payload explicitly carried a
  // roles array or a permissions field (even an empty one is an explicit
  // authorization decision by the backend).
  const rbacProvided =
    Array.isArray(raw?.roles) || raw?.permissions !== undefined;

  return {
    id: String(raw?.id ?? raw?.uuid ?? crypto.randomUUID()),
    email,
    name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
    nameAr: nameAr || undefined,
    nameEn: nameEn || undefined,
    phone: raw?.phone ?? undefined,
    avatar: raw?.avatar ?? undefined,
    role: isAdminRole ? "admin" : "user",
    permissions,
    rbacProvided,
  };
}

function readStored(): AuthUser | null {
  return getStoredUser<AuthUser>();
}

function persistUser(next: AuthUser | null) {
  setStoredUser(next);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialise synchronously from storage so the first render of any
  // consumer already has the correct auth state — prevents a redirect
  // flash to /login immediately after login() navigates to the dashboard.
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return readStored();
  });

  // isLoading = true only when a token exists but no stored user yet,
  // meaning we still need to fetch/validate before rendering protected pages.
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === "undefined") return false;
    const hasToken = !!(
      window.localStorage.getItem("app.auth.token") ||
      window.sessionStorage.getItem("app.auth.token")
    );
    const hasStoredUser = !!(
      window.localStorage.getItem("app.auth.user") ||
      window.sessionStorage.getItem("app.auth.user")
    );
    return hasToken && !hasStoredUser;
  });

  React.useEffect(() => {
    (async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          // No token — ensure we're fully unauthenticated.
          setIsLoading(false);
          return;
        }

        // If user was already restored from storage (synchronous init above),
        // just do a silent background re-validation for regular users.
        if (user) {
          setIsLoading(false);
          if (user.role !== "admin") {
            // Background refresh — don't block rendering.
            fetchProfileRequest()
              .then((raw) => {
                if (raw) applyUser(toAuthUser(raw, user.email));
              })
              .catch(() => {
                /* stored user remains valid */
              });
          }
          return;
        }

        // Token exists but no stored user (fresh tab / storage cleared).
        const storedRole = getAuthRole();
        if (storedRole === "admin") {
          // Admin — no /customer/profile endpoint, stay authenticated.
          setIsLoading(false);
          return;
        }

        // Regular user — fetch profile to hydrate the session.
        const raw = await fetchProfileRequest();
        if (raw) {
          const resolved = toAuthUser(raw);
          setAuthRole(resolved.role);
          applyUser(resolved);
        }
      } catch {
        setAuthToken(null);
        persistUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyUser = (next: AuthUser | null) => {
    persistUser(next);
    setUser(next);
    setIsLoading(false);
  };

  const login: AuthState["login"] = async (
    email,
    password,
    rememberMe = false
  ) => {
    if (!email || !password) throw new Error("Email and password are required");
    const { token, user: rawUser } = await loginRequest(
      email,
      password,
      rememberMe
    );
    if (token) setAuthToken(token, rememberMe);

    // Determine admin from the raw login response directly.
    // We check both the `type` field and the provisional role so either
    // signal is sufficient — no API call needed for admins.
    const rawType = String(
      (rawUser as { type?: string })?.type ?? ""
    ).toLowerCase();
    const provisional = toAuthUser(rawUser, email);
    const isAdminUser = rawType === "admin" || provisional.role === "admin";

    let resolved: AuthUserRaw | null = rawUser ?? null;

    if (!isAdminUser) {
      // Regular customer — fetch full profile to get roles, subscription etc.
      const profile = await fetchProfileRequest();
      if (profile) resolved = profile;
    }

    const finalUser = toAuthUser(resolved, email);
    setAuthRole(finalUser.role); // persist so mount effect skips wrong profile call on refresh
    applyUser(finalUser);
    return { isAdmin: finalUser.role === "admin" };
  };

  const register: AuthState["register"] = async (payload) => {
    const { token, user: rawUser } = await registerRequest(payload);
    // Store token before fetching profile — same pattern as login().
    // Without this, fetchProfileRequest() sends no Authorization header → 401.
    if (token) setAuthToken(token);
    const resolved = rawUser ?? (await fetchProfileRequest());
    const finalUser = toAuthUser(resolved, payload.email);
    setAuthRole(finalUser.role); // always "user" for new registrations
    applyUser(finalUser);
  };

  const logout: AuthState["logout"] = async () => {
    // Route to the correct API endpoint based on user type:
    //   admin users  → POST /admin/logout
    //   regular users → POST /customer/logout
    const userType = user?.role === "admin" ? "admin" : "user";
    await logoutRequest(userType);
    // clearAuthAndRedirect clears React state and redirects to login.
    applyUser(null);
    clearAuthAndRedirect();
  };

  const refreshProfile = async () => {
    // Admin accounts don't have a /customer/profile endpoint — skip.
    if (user?.role === "admin") return;
    const raw = await fetchProfileRequest();
    if (raw) applyUser(toAuthUser(raw, user?.email));
  };

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === "admin",
      hasPermission: (perm) => {
        if (!user) return false;
        if (user.role === "admin") return true;
        // Legacy compatibility: if the backend never sent RBAC data at all
        // (no roles array, no permissions field), this account type predates
        // RBAC — grant access. But if RBAC data WAS provided and the list is
        // empty, that is an explicit "no permissions" decision — fail CLOSED.
        if (!user.permissions || user.permissions.length === 0) {
          // `!== true` (not `=== false`): sessions cached in localStorage
          // before this field existed have `undefined` — treat them as
          // legacy until the next profile refresh repopulates the flag.
          return user.rbacProvided !== true;
        }

        // Normalise: lowercase, treat `-` and `_` as the same separator.
        const norm = (s: string) => s.toLowerCase().replace(/[-_.]/g, "_");
        const key = norm(String(perm));

        /**
         * Aliases: maps sidebar/view route keys → real backend permission namespaces.
         * Real permissions use format: "namespace.action" e.g. "analytics.read"
         * Source: /customer/profile API response → roles[].permissions[].name
         */
        const aliases: Record<string, string[]> = {
          // ── Dashboard & Overview ──
          dashboard:            ["detections", "analytics", "branches", "service_monitor", "task_management"],
          // ── AI Services ──
          ai_services:          ["detections", "analytics", "service_monitor"],
          detection_feed:       ["detections"],
          live_feeds:           ["detections", "cameras"],
          system_monitoring:    ["detections", "cameras", "service_monitor"],
          // ── Analytics & Insights ──
          analytics:            ["analytics"],
          statistics:           ["reports", "analytics"],
          insights:             ["analytics"],
          chat_analytics:       ["analytics"],
          br_intelligence:      ["analytics"],
          // ── Tasks ──
          tasks:                ["task_management"],
          kanban:               ["task_management"],
          my_tasks:             ["my_tasks", "task_management"],
          task_analytics:       ["task_analytics"],
          task_reports:         ["task_reports"],
          ai_scheduler:         ["smart_scheduler"],
          task_templates:       ["task_templates"],
          ai_task_rules:        ["task_rules"],
          escalation_alerts:    ["escalation"],
          // ── Organization ──
          organization:         ["branches", "departments", "employees"],
          branches:             ["branches"],
          departments:          ["departments"],
          employees:            ["employees"],
          cameras:              ["cameras"],
          attendance:           ["attendances", "attendance"],
          projects:             ["projects"],
          // ── Customer Island (parity with old ACL subject "island") ──
          island:               ["island", "customer_island"],
          customer_island:      ["island", "customer_island"],
          // ── Preferences ──
          preferences:          ["roles", "notification_settings", "settings"],
          roles:                ["roles"],
          permissions:          ["roles"],
          notification_settings:["notification_settings"],
          security:             ["settings"],
          chat_settings:        ["settings"],
          // ── Reports & Other ──
          report_center:        ["reports"],
          subscription:         ["subscriptions"],
          productivity:         ["productivity"],
          // ── Foodics ──
          foodics:              ["foodics"],
          foodics_connection:   ["foodics"],
          foodics_orders:       ["foodics"],
          foodics_dashboard:    ["foodics"],
          // ── Event Timeline / Notifications ──
          event_timeline:       ["alerts", "notifications"],
          visitor_records:      ["detections", "analytics"],
          notifications:        ["notifications", "notification"],
        };

        const candidates = [key, ...(aliases[key] ?? [])];

        return user.permissions.some((p) => {
          const np = norm(p);
          return candidates.some(
            (c) => np === c || np.startsWith(`${c}_`) || np.startsWith(`${c}.`.replace(".", "_"))
          );
        });
      },
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
