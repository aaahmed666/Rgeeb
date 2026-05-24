"use client";

import * as React from "react";

import { setAuthToken, getAuthToken } from "@/lib/api";
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
 * Persists the bearer token via setAuthToken (localStorage) and caches the
 * resolved user profile so the dashboard shell can render synchronously
 * after a refresh.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (perm: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);
const STORAGE_KEY = "app.auth.user";

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
  const name =
    raw?.name ??
    raw?.full_name ??
    (email ? email.split("@")[0].replace(/[._-]/g, " ") : "User");
  const fromRoles = collectFromRoles(raw?.roles);
  const directPerms = normalisePermissions(raw?.permissions);
  const permissions = Array.from(
    new Set([...directPerms, ...fromRoles.perms].map((p) => p.toLowerCase()))
  );
  // Platform admin only — `type: "admin"` or role `rgeeb admin`.
  // "super admin" is a tenant-level role (regular customer account) and must
  // NOT be treated as platform admin.
  const typeLower = String(
    (raw as { type?: string })?.type ?? ""
  ).toLowerCase();
  const roleNamesLower = [
    String(raw?.role ?? "").toLowerCase(),
    ...fromRoles.roleNames.map((r) => r.toLowerCase()),
  ];
  const isAdminRole =
    typeLower === "admin" ||
    roleNamesLower.some((r) => ["rgeeb admin", "rgeeb admain"].includes(r)) ||
    permissions.some((p) => p.startsWith("admin."));
  return {
    id: String(raw?.id ?? raw?.uuid ?? crypto.randomUUID()),
    email,
    name: name ? name.charAt(0).toUpperCase() + name.slice(1) : "User",
    role: isAdminRole ? "admin" : "user",
    permissions,
  };
}

function readStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(next: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const cached = readStored();
    if (cached) setUser(cached);
    // Refresh profile in the background if we have a token.
    const token = getAuthToken();
    if (token) {
      fetchProfileRequest()
        .then((raw) => {
          if (raw) {
            const next = toAuthUser(raw, cached?.email);
            setUser(next);
            persistUser(next);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const applyUser = (next: AuthUser | null) => {
    persistUser(next);
    setUser(next);
  };

  const login: AuthState["login"] = async (email, password) => {
    if (!email || !password) throw new Error("Email and password are required");
    const { token, user: rawUser } = await loginRequest(email, password);
    setAuthToken(token);
    let resolved = rawUser;
    // Admin accounts don't have a /customer/profile endpoint — use the
    // user object returned from login directly. Only fetch profile for
    // non-admin (customer) accounts where the profile endpoint exists.
    const provisionalUser = toAuthUser(resolved, email);
    if (!resolved && provisionalUser.role !== "admin") {
      resolved = await fetchProfileRequest();
    }
    applyUser(toAuthUser(resolved, email));
  };

  const register: AuthState["register"] = async (payload) => {
    const { token, user: rawUser } = await registerRequest(payload);
    if (token) {
      setAuthToken(token);
      const resolved = rawUser ?? (await fetchProfileRequest());
      applyUser(toAuthUser(resolved, payload.email));
    }
  };

  const logout: AuthState["logout"] = async () => {
    // Route to the correct API endpoint based on user type:
    //   admin users  → POST /admin/logout
    //   regular users → POST /customer/logout
    const userType = user?.role === "admin" ? "admin" : "user";
    await logoutRequest(userType);
    setAuthToken(null);
    applyUser(null);
  };

  const refreshProfile = async () => {
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
        // Normalise: lowercase, treat `-` and `_` as the same separator.
        const norm = (s: string) => s.toLowerCase().replace(/[-_]/g, "_");
        const key = norm(String(perm));
        // Common aliases between sidebar keys and backend permission names.
        const aliases: Record<string, string[]> = {
          insights: ["analytics"],
          analytics: ["analytics"],
          system_monitoring: ["cameras", "detections"],
          live_feeds: ["cameras"],
          detection_feed: ["detections"],
          event_timeline: ["alerts", "notifications"],
          tasks: ["task_management"],
          kanban: ["task_management"],
          task_analytics: ["task_analytics"],
          escalation_alerts: ["escalation"],
          task_reports: ["task_reports"],
          ai_scheduler: ["smart_scheduler"],
          task_templates: ["task_templates"],
          ai_task_rules: ["task_rules"],
          ai_services: ["detections", "analytics"],
          organization: ["branches", "departments", "employees"],
          preferences: ["roles", "notification_settings", "settings"],
          notification_settings: ["notification_settings"],
          security: ["settings"],
          report_center: ["reports"],
          subscription: ["subscriptions"],
          br_intelligence: ["analytics"],
          productivity: ["productivity"],
          chat_analytics: ["analytics"],
          chat_settings: ["settings"],
          foodics: ["foodics.connect", "foodics.status", "foodics.branches"],
        };
        const candidates = [key, ...(aliases[key] ?? [])];
        return user.permissions.some((p) => {
          const np = norm(p);
          return candidates.some(
            (c) => np === c || np.startsWith(`${c}.`) || np.startsWith(`${c}_`)
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
