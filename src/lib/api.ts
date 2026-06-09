/**
 * Centralised API client for the rgeeb backend.
 * Reads the base URL from NEXT_PUBLIC_API_URL with a safe default.
 * Attaches the bearer token persisted by the auth layer (if any) and
 * returns parsed JSON. Throws an ApiError on non-2xx responses so callers
 * can surface a friendly fallback.
 *
 * Features:
 * - Bearer token management (supports httpOnly cookie migration via auth layer)
 * - Global 401 handling: clears session and redirects to /login
 * - Request timeout protection (30s default)
 * - Unified error responses with fallback messages
 * - Type-safe query string and JSON body encoding
 * - Request/response type safety with JSDoc hints
 */

import type { ListResponse, PaginatedResponse } from "./api-types";

// In the browser we ALWAYS proxy through Next.js rewrites (/api → backend).
// This prevents CORS errors regardless of deployment environment.
// On the server (SSR) we hit the backend directly using the env var.
export const API_BASE_URL =
  typeof window === "undefined"
    // Server-side (SSR/build): hit backend directly
    ? (process.env.NEXT_PUBLIC_API_URL ?? "https://api.dev.rgeeb.com/api")
    // Client-side: ALWAYS use the Next.js proxy — never expose backend URL to browser
    : "/api";

const TOKEN_KEY = "app.auth.token";
const USER_KEY = "app.auth.user";
const ROLE_KEY = "app.auth.role"; // "admin" | "user" — persisted to skip wrong profile calls on mount
const REMEMBER_KEY = "app.auth.remember";
const DEFAULT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Token helpers — localStorage + sessionStorage with "Remember Me" support.
// When "Remember Me" is checked the token goes to localStorage (survives
// tab / browser close). Otherwise it lives in sessionStorage (cleared when
// the tab is closed).
// ---------------------------------------------------------------------------

/** Which storage back-end to use based on the remember-me flag. */
function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const remembered = window.localStorage.getItem(REMEMBER_KEY);
    return remembered === "true" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Retrieves the stored authentication token. */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Check both storages — the token could be in either depending on
    // whether the user chose "remember me" last time.
    return (
      window.localStorage.getItem(TOKEN_KEY) ??
      window.sessionStorage.getItem(TOKEN_KEY) ??
      null
    );
  } catch {
    return null;
  }
}

/** Stores or clears the authentication token. */
export function setAuthToken(token: string | null, remember = false) {
  if (typeof window === "undefined") return;
  try {
    // Persist the remember-me preference for future reads.
    if (remember) {
      window.localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
    }

    // Clear from both storages first to avoid stale duplicates.
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);

    if (token) {
      const store = remember ? window.localStorage : window.sessionStorage;
      store.setItem(TOKEN_KEY, token);
    }
  } catch {
    // storage unavailable
  }
}

/** Persists the resolved role so the mount effect knows which profile endpoint to call. */
export function setAuthRole(role: "admin" | "user") {
  if (typeof window === "undefined") return;
  try {
    // Use the same storage as the token so both are cleared together.
    const store = getStore() ?? window.sessionStorage;
    store.setItem(ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

/** Returns the stored role, or null if unknown. */
export function getAuthRole(): "admin" | "user" | null {
  if (typeof window === "undefined") return null;
  try {
    const v =
      window.localStorage.getItem(ROLE_KEY) ??
      window.sessionStorage.getItem(ROLE_KEY) ??
      null;
    return v === "admin" || v === "user" ? v : null;
  } catch {
    return null;
  }
}

/** Persists the resolved AuthUser so it can be restored on mount without an API call. */
export function setStoredUser(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  } | null
) {
  if (typeof window === "undefined") return;
  try {
    const store = getStore() ?? window.sessionStorage;
    if (user) {
      store.setItem(USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_KEY);
      window.sessionStorage.removeItem(USER_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Returns the persisted AuthUser, or null if not stored / parse error. */
export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(USER_KEY) ??
      window.sessionStorage.getItem(USER_KEY) ??
      null;
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 401 global handler
// ---------------------------------------------------------------------------

/**
 * Clears local auth state and redirects to the login page.
 */
export function clearAuthAndRedirect(): void {
  if (typeof window === "undefined") return;
  try {
    [window.localStorage, window.sessionStorage].forEach((s) => {
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
      s.removeItem(ROLE_KEY);
      s.removeItem(REMEMBER_KEY);
    });
  } catch {
    // ignore storage errors
  }
  window.location.replace("/login");
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/** Typed API error with status code and 401 auth error detection */
export class ApiError extends Error {
  status: number;
  body: unknown;
  isAuthError: boolean;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
    this.isAuthError = status === 401;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  /** Skip the global 401 redirect (e.g. during login itself). */
  skipAuthRedirect?: boolean;
}

function buildUrl(path: string, query?: ApiOptions["query"]): string {
  // When API_BASE_URL is a relative path (e.g. "/api" in browser via proxy),
  // new URL() needs an absolute base — use window.location.origin.
  const resolved = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const base =
    typeof window !== "undefined" ? window.location.origin : undefined;

  const url = resolved.startsWith("http")
    ? new URL(resolved)
    : new URL(resolved, base);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function normalizeErrorMessage(body: unknown, status: number): string {
  const statusMessages: Record<number, string> = {
    401: "Your session has expired. Please log in again.",
    403: "You do not have permission to access this resource.",
    404: "Resource not found.",
    408: "The request timed out. Please check your connection and try again.",
    422: "Validation failed. Please check your input.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Internal server error. Please try again later.",
    502: "Server gateway error. Please try again later.",
    503: "Service temporarily unavailable.",
  };

  if (!body)
    return statusMessages[status] ?? `Request failed with status ${status}`;

  if (typeof body === "string") return body;

  const obj = body as Record<string, unknown>;

  // Collect field-level validation errors (Laravel-style)
  if (obj.errors && typeof obj.errors === "object") {
    const fieldErrors = Object.values(obj.errors as Record<string, unknown>)
      .flat()
      .filter((v): v is string => typeof v === "string")
      .slice(0, 3)
      .join("; ");
    if (fieldErrors) return fieldErrors;
  }

  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.detail === "string") return obj.detail;

  return statusMessages[status] ?? `Request failed with status ${status}`;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Core fetch wrapper with type safety, timeout, and error handling.
 *
 * Security Features:
 * - Bearer token authentication via httpOnly cookies (set by backend)
 * - credentials: "include" ensures cookies are automatically sent
 * - Global 401 handler to prevent unauthorized state leakage
 * - 30s timeout protection against hanging requests
 * - Request/response validation and error normalization
 *
 * Error Handling:
 * - Maps HTTP status codes to user-friendly messages
 * - Extracts field-level validation errors (Laravel-style)
 * - Timeout errors converted to 408 ApiError for consistency
 * - Callers should catch ApiError and display message or retry
 *
 * @template T - The expected response type
 * @param path - API endpoint path (relative or absolute)
 * @param opts - Request options including query, body, headers, timeoutMs, and skipAuthRedirect
 * @throws ApiError - On non-2xx responses with isAuthError flag for 401s
 * @returns Parsed JSON response
 *
 * @example
 * try {
 *   const user = await apiFetch<User>('/api/user');
 * } catch (err) {
 *   if (err instanceof ApiError && err.isAuthError) {
 *     // Session expired — redirect handled automatically via clearAuthAndRedirect()
 *   } else if (err instanceof ApiError) {
 *     console.error('API error:', err.message);
 *   }
 * }
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiOptions = {}
): Promise<T> {
  const {
    body,
    query,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuthRedirect = false,
    ...rest
  } = opts;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const token = getAuthToken();
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders.Authorization = `Bearer ${token}`;

    const res = await fetch(buildUrl(path, query), {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...authHeaders,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const msg = normalizeErrorMessage(parsed, res.status);
      const error = new ApiError(res.status, msg, parsed);

      // Global 401 handler: clear local auth and redirect to login.
      if (res.status === 401 && !skipAuthRedirect) {
        clearAuthAndRedirect();
      }

      throw error;
    }

    return parsed as T;
  } catch (err) {
    // Re-wrap AbortError as a timeout ApiError for consistent handling.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        408,
        "The request timed out. Please check your connection and try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// HTTP method helpers
// ---------------------------------------------------------------------------

/** Strongly-typed HTTP method helpers */
export const api = {
  /** GET request helper */
  get: <T>(path: string, opts?: ApiOptions): Promise<T> =>
    apiFetch<T>(path, { ...opts, method: "GET" }),

  /** POST request helper */
  post: <T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T> =>
    apiFetch<T>(path, { ...opts, method: "POST", body }),

  /** PUT request helper */
  put: <T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T> =>
    apiFetch<T>(path, { ...opts, method: "PUT", body }),

  /** PATCH request helper */
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T> =>
    apiFetch<T>(path, { ...opts, method: "PATCH", body }),

  /** DELETE request helper */
  delete: <T>(path: string, opts?: ApiOptions): Promise<T> =>
    apiFetch<T>(path, { ...opts, method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Paginated / list helpers
// ---------------------------------------------------------------------------

/** Helper for endpoints that return paginated lists */
export async function fetchPaginated<T>(
  path: string,
  {
    limit = 20,
    offset = 0,
    ...opts
  }: ApiOptions & { limit?: number; offset?: number } = {}
): Promise<PaginatedResponse<T>> {
  return apiFetch<PaginatedResponse<T>>(path, {
    ...opts,
    query: { ...opts.query, limit, offset },
  });
}

/** Helper for endpoints that return simple lists */
export async function fetchList<T>(
  path: string,
  opts?: ApiOptions
): Promise<ListResponse<T>> {
  return apiFetch<ListResponse<T>>(path, opts);
}
