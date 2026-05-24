import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface TwoFactorStatus {
  enabled: boolean;
  confirmed: boolean;
}

export interface TwoFactorSetup {
  qrCode?: string;
  secret?: string;
  recoveryCodes?: string[];
}

function s(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}
function b(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return false;
}

export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.security.twoFactorStatus);
  const data = (res?.data as Record<string, unknown>) ?? res ?? {};
  return {
    enabled: b(data.enabled ?? data.is_enabled ?? data.two_factor_enabled),
    confirmed: b(data.confirmed ?? data.is_confirmed ?? data.two_factor_confirmed),
  };
}

export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.security.twoFactorSetup, {
    method: "POST",
  });
  const data = (res?.data as Record<string, unknown>) ?? res ?? {};
  const codes = Array.isArray(data.recovery_codes)
    ? (data.recovery_codes as unknown[]).map(String)
    : Array.isArray(data.recoveryCodes)
      ? (data.recoveryCodes as unknown[]).map(String)
      : undefined;
  return {
    qrCode: s(data.qr_code) ?? s(data.qrCode) ?? s(data.qr) ?? s(data.qr_code_url),
    secret: s(data.secret) ?? s(data.code),
    recoveryCodes: codes,
  };
}

export async function enableTwoFactor(code: string): Promise<TwoFactorStatus> {
  await apiFetch(endpoints.security.twoFactorEnable, {
    method: "POST",
    body: { code, otp: code },
  });
  return fetchTwoFactorStatus();
}

export async function verifyTwoFactor(code: string): Promise<void> {
  await apiFetch(endpoints.security.twoFactorVerify, {
    method: "POST",
    body: { code, otp: code },
  });
}

export async function disableTwoFactor(password?: string): Promise<TwoFactorStatus> {
  await apiFetch(endpoints.security.twoFactorDisable, {
    method: "POST",
    body: password ? { password } : {},
  });
  return fetchTwoFactorStatus();
}
