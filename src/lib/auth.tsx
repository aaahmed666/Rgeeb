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
import { canAccess } from "@/lib/permissions";

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
  /** Fatoorah client id — present when the account has connected Fatoorah. */
  fatoorahClientId?: string | number | null;
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
  ) => Promise<{ isAdmin: boolean; landingPath: string }>;
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

  // ── CRM (Customer Lifecycle) demo access ──
  // The Customer Lifecycle module is frontend-only (mock data) and the backend
  // does not yet expose a `customer_lifecycle` permission. This dedicated demo
  // account is scoped to CRM ONLY: it sees the Customer Lifecycle dashboard and
  // all of its pages, with the same shell/styling as the normal & admin
  // dashboards, but none of the other modules. When the backend ships real
  // RBAC, drop this block and grant `customer_lifecycle.*` server-side instead.
  const CRM_DEMO_EMAILS = ["crm-admin@admin.com"];
  const isCrmDemo = !!email && CRM_DEMO_EMAILS.includes(email.toLowerCase());

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
  let isAdminRole =
    typeLower === "admin" ||
    roleNamesLower.some((r) => r === "rgeeb admin") ||
    permissions.some((p) => p.startsWith("admin."));

  // RBAC is considered "provided" when the payload explicitly carried a
  // roles array or a permissions field (even an empty one is an explicit
  // authorization decision by the backend).
  let rbacProvided =
    Array.isArray(raw?.roles) || raw?.permissions !== undefined;

  // Force the CRM demo account into a deterministic, CRM-only shape regardless
  // of what the backend returns for this email: its permission set is REPLACED
  // with exactly the CRM read scope (so any analytics/branches/etc. the backend
  // may attach to this account are dropped), it is never a platform admin, and
  // rbacProvided=true so the "empty perms → grant all" fallback can't widen it.
  if (isCrmDemo) {
    permissions.length = 0;
    permissions.push("customer_lifecycle.read");
    isAdminRole = false;
    rbacProvided = true;
  }

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
    fatoorahClientId: raw?.fatoorah_client_id ?? null,
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

    // Decide where to land. Admins → admin dashboard. A user scoped to CRM
    // (e.g. the CRM demo account) → the Customer Lifecycle dashboard, since the
    // generic /dashboard would show modules they can't access. Everyone else →
    // the normal dashboard.
    const isAdminFinal = finalUser.role === "admin";
    const perms = finalUser.permissions ?? [];
    const hasCrm = perms.some((p) => p.startsWith("customer_lifecycle"));
    const crmOnly =
      !isAdminFinal &&
      hasCrm &&
      // no other module permission present
      !perms.some((p) => !p.startsWith("customer_lifecycle"));
    const landingPath = isAdminFinal
      ? "/dashboard/admin"
      : crmOnly
        ? "/dashboard/customer-lifecycle"
        : "/dashboard";

    return { isAdmin: isAdminFinal, landingPath };
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
    // Best-effort server logout. The backend isn't wired yet, so never let a
    // failed/rejected request block the client-side sign-out — we still clear
    // local auth and redirect to /login regardless.
    try {
      await logoutRequest(userType);
    } catch {
      // ignore — proceed with local logout
    }
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
        // Viewing access requires `read` (or the explicit action if `perm`
        // already carries one, e.g. "foodics.orders.read"). Shared with the
        // sidebar via canAccess so "shows in sidebar" === "page opens".
        return canAccess(String(perm), {
          isAdmin: user.role === "admin",
          userPerms: user.permissions ?? [],
          rbacProvided: user.rbacProvided,
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
