/**
 * Auth service – wraps the rgeeb auth endpoints.
 * Backend returns envelopes of the form { status, message, data } where
 * data carries the token on login and the created user on register.
 *
 * Tokens are now managed via secure httpOnly cookies set by the backend.
 */
import { apiFetch, ApiError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface RawPermission {
  name?: string;
  translated_name?: string;
}
export interface RawRole {
  id?: number | string;
  name?: string;
  permissions?: Array<RawPermission | string>;
}
export interface AuthUserRaw {
  id?: string | number;
  uuid?: string;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  roles?: RawRole[];
  permissions?: Array<RawPermission | string> | Record<string, unknown>;
}

export interface LoginResult {
  token: string | null;
  user: AuthUserRaw | null;
  raw: unknown;
}

interface Envelope<T = unknown> {
  status?: boolean;
  message?: string;
  data?: T;
  token?: string;
  access_token?: string;
  user?: AuthUserRaw;
}

function pickToken(env: Envelope | null | undefined): string | null {
  if (!env) return null;
  const data = (env.data ?? {}) as Record<string, unknown>;
  return (
    (data.token as string) ??
    (data.access_token as string) ??
    (data.api_token as string) ??
    (env.token as string) ??
    (env.access_token as string) ??
    null
  );
}

function pickUser(env: Envelope | null | undefined): AuthUserRaw | null {
  if (!env) return null;
  const data = (env.data ?? {}) as Record<string, unknown>;
  const user =
    (data.user as AuthUserRaw) ??
    (data.customer as AuthUserRaw) ??
    (data.profile as AuthUserRaw) ??
    (env.user as AuthUserRaw) ??
    null;
  if (user) return user;
  // Fallback: data itself may be the user object.
  if (data && typeof data === "object" && ("email" in data || "id" in data)) {
    return data as AuthUserRaw;
  }
  return null;
}

export async function loginRequest(
  email: string,
  password: string,
  rememberMe = false
): Promise<LoginResult> {
  const raw = await apiFetch<Envelope>(endpoints.auth.login, {
    method: "POST",
    body: { email, password, remember_me: rememberMe },
    // Skip global 401 redirect — the user isn't authenticated yet.
    skipAuthRedirect: true,
  });
  // Extract token from response envelope — supports both httpOnly cookie
  // flows (token: null) and Bearer token flows (token: string).
  const token = pickToken(raw);
  return { token, user: pickUser(raw), raw };
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirmation: string;
  otp_code: string;
  name_ar: string;
  name_en: string;
  phone: string;
  nationality: string;
  city_id: string;
  category_id: string;
  package_id: string;
  /** Optional name field kept for legacy single-name forms. */
  name?: string;
}

export async function registerRequest(
  payload: RegisterPayload
): Promise<LoginResult> {
  const raw = await apiFetch<Envelope>(endpoints.auth.register, {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });
  const token = pickToken(raw);
  return { token: token ?? "", user: pickUser(raw), raw };
}

export async function sendOtpRequest(
  email: string
): Promise<{ message: string }> {
  const raw = await apiFetch<Envelope>(endpoints.auth.sendOtp, {
    method: "POST",
    body: { email },
    skipAuthRedirect: true,
  });
  return { message: raw?.message ?? "Verification code sent." };
}

export async function faceLoginRequest(
  imageDataUrl: string
): Promise<LoginResult> {
  const raw = await apiFetch<Envelope>(endpoints.auth.face, {
    method: "POST",
    body: { image: imageDataUrl },
    skipAuthRedirect: true,
  });
  // With httpOnly cookies, the token is managed by the backend.
  return { token: null, user: pickUser(raw), raw };
}

export async function forgotPasswordRequest(
  email: string
): Promise<{ message: string }> {
  const raw = await apiFetch<Envelope>(endpoints.auth.forgotPassword, {
    method: "POST",
    body: { email },
    skipAuthRedirect: true,
  });
  return { message: raw?.message ?? "Password reset link sent." };
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export async function resetPasswordRequest(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  const raw = await apiFetch<Envelope>(endpoints.auth.resetPassword, {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });
  return { message: raw?.message ?? "Password reset successful." };
}

let inflightProfile: Promise<AuthUserRaw | null> | null = null;
export async function fetchProfileRequest(): Promise<AuthUserRaw | null> {
  if (inflightProfile) return inflightProfile;
  inflightProfile = (async () => {
    try {
      const raw = await apiFetch<Envelope>(endpoints.auth.profile, {
        method: "GET",
      });
      return pickUser(raw);
    } catch {
      return null;
    } finally {
      // release after microtask so concurrent callers share, but next call refetches
      setTimeout(() => {
        inflightProfile = null;
      }, 0);
    }
  })();
  return inflightProfile;
}

/**
 * Calls the correct logout endpoint depending on the user type.
 *  - admin  → POST /admin/logout
 *  - user   → POST /customer/logout
 * The local token is cleared by the caller regardless of network outcome.
 */
export async function logoutRequest(
  userType: "admin" | "user" = "user"
): Promise<void> {
  const endpoint =
    userType === "admin" ? endpoints.auth.adminLogout : endpoints.auth.logout;
  try {
    await apiFetch(endpoint, { method: "POST" });
  } catch {
    // ignore — local token will be cleared regardless
  }
}
