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
  guard_name?: string;
  client_id?: number | string | null;
  permissions?: Array<RawPermission | string>;
}
export interface AuthUserRaw {
  id?: string | number;
  uuid?: string;
  // Name fields — login returns name_ar, name_en, name
  name?: string;
  name_ar?: string;
  name_en?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  // type: "admin" | "customer" — primary admin signal
  type?: string;
  // Legacy role string (some responses)
  role?: string;
  roles?: RawRole[];
  permissions?: Array<RawPermission | string> | Record<string, unknown>;
  // Profile fields (present in both login and /customer/profile)
  avatar?: string;
  active?: boolean | number;
  main_admin?: boolean | number;
  token?: string;
  // Customer-specific
  client_id?: number | string | null;
  // Fatoorah integration — when present the account can fetch financial reports.
  fatoorah_client_id?: number | string | null;
  client?: Record<string, unknown> | null;
  country_id?: number | string | null;
  city_id?: number | string | null;
  role_id?: number | string | null;
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
    // Login response: token is at root level alongside id/email
    ((env as unknown as Record<string, unknown>).token as string) ??
    null
  );
}

function pickUser(env: Envelope | null | undefined): AuthUserRaw | null {
  if (!env) return null;
  const root = env as unknown as Record<string, unknown>;
  const data = (env.data ?? {}) as Record<string, unknown>;

  // Priority 1: nested user/customer/profile inside data envelope
  const nested =
    (data.user as AuthUserRaw) ??
    (data.customer as AuthUserRaw) ??
    (data.profile as AuthUserRaw) ??
    (env.user as AuthUserRaw) ??
    null;
  if (nested) return nested;

  // Priority 2: data itself is the user object
  if (data && typeof data === "object" && ("id" in data || "email" in data)) {
    return data as AuthUserRaw;
  }

  // Priority 3: root IS the user (login response shape from rgeeb API)
  // { id, token, type, email, roles, ... } — token is a separate field
  if (root && typeof root === "object" && ("id" in root || "email" in root)) {
    return root as AuthUserRaw;
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
  /** Alias for otp_code — accepted by the RegisterView multi-step form. */
  otp?: string;
  name_ar: string;
  name_en: string;
  phone: string;
  /**
   * country_id is the canonical field name expected by POST /customer/register.
   * The RegisterView previously sent this as `nationality`; it now sends `country_id`.
   */
  country_id: string;
  city_id: string;
  category_id: string;
  /** Optional name field kept for legacy single-name forms. */
  name?: string;
}

export async function registerRequest(
  payload: RegisterPayload
): Promise<LoginResult> {
  // Normalise the otp alias to otp_code so the backend always receives the canonical field name.
  const { otp, ...rest } = payload;
  const normalised = { ...rest, otp_code: rest.otp_code || otp || "" };
  const raw = await apiFetch<Envelope>(endpoints.auth.register, {
    method: "POST",
    body: normalised,
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

/**
 * POST /customer/face-login
 * Sends the captured frame as a base64 data URL in the `image` field.
 * FIX: wrapped in FormData so multipart-expecting backends also accept it.
 */
export async function faceLoginRequest(
  imageDataUrl: string
): Promise<LoginResult> {
  // Try FormData first (multipart) — more compatible with file-processing backends
  const fd = new FormData();
  fd.append("image", imageDataUrl);

  const raw = await apiFetch<Envelope>(endpoints.auth.face, {
    method: "POST",
    body: fd,
    skipAuthRedirect: true,
  });
  return { token: pickToken(raw), user: pickUser(raw), raw };
}

/**
 * Forgot password — sends an OTP to the email via POST /customer/email/send-otp.
 * The user then verifies the OTP at /otp, and can reset their password
 * via POST /customer/profile/update { password, password_confirmation }.
 */
export async function forgotPasswordRequest(
  email: string
): Promise<{ message: string }> {
  // Reuse the same OTP endpoint — backend sends a verification code
  return sendOtpRequest(email);
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Reset password via POST /customer/profile/update.
 * After OTP verification, the user submits their new password here.
 * The `token` field is the OTP code from /otp page — sent as otp_code.
 * The `email` field is included for the unauthenticated reset flow.
 */
export async function resetPasswordRequest(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  const raw = await apiFetch<Envelope>(endpoints.auth.resetPassword, {
    method: "POST",
    body: {
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      email: payload.email,
      // Send the OTP code as otp_code so backend can validate the reset session
      ...(payload.token ? { otp_code: payload.token } : {}),
    },
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
        skipAuthRedirect: true, // never redirect on 403/401 — caller handles auth state
      });
      return pickUser(raw);
    } catch {
      return null;
    } finally {
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
