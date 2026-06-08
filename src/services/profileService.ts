/**
 * profileService.ts
 * Wraps all profile-related API endpoints:
 *   GET  /customer/profile
 *   POST /customer/profile/update   (name, email, phone, avatar_file, password, ...)
 *   POST /customer/client/update    (company info)
 *   POST /customer/password/change  (current + new password)
 */

import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileCountry {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  code: string;
}

export interface ProfileCity {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  country_id: number;
}

export interface ProfileCategory {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  description?: string;
}

export interface ProfileClient {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  email: string;
  phone: string;
  address?: string;
  logo?: string;
  avatar?: string;
  active: boolean | number;
  country_id: number;
  city_id: number;
  category_id?: number;
  category?: ProfileCategory;
  country?: ProfileCountry;
  city?: ProfileCity;
  foodics_connected?: boolean;
}

export interface ProfileRole {
  id: number;
  name: string;
  permissions?: Array<{ name: string; translated_name?: string }>;
}

export interface ProfileSubscription {
  package_name?: string;
  name?: string;
  days_remaining?: number;
  end_date?: string;
  status?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  email: string;
  phone?: string;
  avatar?: string;
  type?: string;
  active?: boolean;
  main_admin?: boolean;
  country_id?: number;
  city_id?: number;
  country?: ProfileCountry;
  city?: ProfileCity;
  client?: ProfileClient;
  roles?: ProfileRole[];
  subscription?: ProfileSubscription;
  has_face_embedding?: boolean;
  created_at?: string;
}

export interface UpdateProfileInput {
  name_ar?: string;
  name_en?: string;
  email?: string;
  phone?: string;
  country_id?: number | string;
  city_id?: number | string;
  avatar_file?: File | null;
}

export interface UpdateClientInput {
  name_ar?: string;
  name_en?: string;
  email?: string;
  phone?: string;
  address?: string;
  country_id?: number | string;
  city_id?: number | string;
  category_id?: number | string;
  avatar_file?: File | null;
}

export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrap<T>(res: unknown): T {
  if (!res) throw new Error("Empty response");
  const obj = res as Record<string, unknown>;
  if (obj.data !== undefined) return obj.data as T;
  return res as T;
}

function asStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function asNum(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v) return Number(v) || undefined;
  return undefined;
}

function asBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return false;
}

function parseCountry(raw: Record<string, unknown>): ProfileCountry {
  return {
    id: asNum(raw.id) ?? 0,
    name: asStr(raw.name),
    name_ar: asStr(raw.name_ar),
    name_en: asStr(raw.name_en),
    code: asStr(raw.code),
  };
}

function parseCity(raw: Record<string, unknown>): ProfileCity {
  return {
    id: asNum(raw.id) ?? 0,
    name: asStr(raw.name),
    name_ar: asStr(raw.name_ar),
    name_en: asStr(raw.name_en),
    country_id: asNum(raw.country_id) ?? 0,
  };
}

function parseClient(raw: Record<string, unknown>): ProfileClient {
  return {
    id: asNum(raw.id) ?? 0,
    name: asStr(raw.name),
    name_ar: asStr(raw.name_ar),
    name_en: asStr(raw.name_en),
    email: asStr(raw.email),
    phone: asStr(raw.phone),
    address: asStr(raw.address) || undefined,
    logo: asStr(raw.logo) || undefined,
    avatar: asStr(raw.avatar) || undefined,
    active: asBool(raw.active),
    country_id: asNum(raw.country_id) ?? 0,
    city_id: asNum(raw.city_id) ?? 0,
    category_id: asNum(raw.category_id),
    category: raw.category
      ? {
          id: asNum((raw.category as Record<string, unknown>).id) ?? 0,
          name: asStr((raw.category as Record<string, unknown>).name),
          name_ar: asStr((raw.category as Record<string, unknown>).name_ar),
          name_en: asStr((raw.category as Record<string, unknown>).name_en),
          description: asStr(
            (raw.category as Record<string, unknown>).description
          ),
        }
      : undefined,
    country: raw.country
      ? parseCountry(raw.country as Record<string, unknown>)
      : undefined,
    city: raw.city ? parseCity(raw.city as Record<string, unknown>) : undefined,
    foodics_connected: raw.foodics_connected
      ? asBool(raw.foodics_connected)
      : undefined,
  };
}

function parseProfile(raw: Record<string, unknown>): UserProfile {
  const roles: ProfileRole[] = Array.isArray(raw.roles)
    ? (raw.roles as Record<string, unknown>[]).map((r) => ({
        id: asNum(r.id) ?? 0,
        name: asStr(r.name),
        permissions: Array.isArray(r.permissions)
          ? (r.permissions as Record<string, unknown>[]).map((p) => ({
              name: asStr(p.name ?? p),
              translated_name: asStr(p.translated_name),
            }))
          : undefined,
      }))
    : [];

  // Try to extract subscription from client.current_subscription or raw.subscription
  const clientRaw = (raw.client ?? {}) as Record<string, unknown>;
  const subRaw = (raw.subscription ??
    clientRaw.current_subscription ??
    {}) as Record<string, unknown>;
  const subscription: ProfileSubscription = {
    package_name:
      asStr(subRaw.package_name) ||
      asStr(subRaw.name) ||
      asStr((subRaw.package as Record<string, unknown>)?.name) ||
      undefined,
    days_remaining: asNum(subRaw.days_remaining),
    end_date: asStr(subRaw.end_date) || undefined,
    status: asStr(subRaw.status) || undefined,
  };

  return {
    id: asNum(raw.id) ?? 0,
    name: asStr(raw.name || raw.name_en || raw.name_ar),
    name_ar: asStr(raw.name_ar) || undefined,
    name_en: asStr(raw.name_en) || undefined,
    email: asStr(raw.email),
    phone: asStr(raw.phone) || undefined,
    avatar: asStr(raw.avatar) || undefined,
    type: asStr(raw.type) || undefined,
    active: asBool(raw.active),
    main_admin: asBool(raw.main_admin),
    country_id: asNum(raw.country_id),
    city_id: asNum(raw.city_id),
    country: raw.country
      ? parseCountry(raw.country as Record<string, unknown>)
      : undefined,
    city: raw.city ? parseCity(raw.city as Record<string, unknown>) : undefined,
    client: raw.client ? parseClient(clientRaw) : undefined,
    roles,
    subscription:
      subscription.package_name || subscription.days_remaining !== undefined
        ? subscription
        : undefined,
    has_face_embedding: asBool(raw.has_face_embedding),
    created_at: asStr(raw.created_at) || undefined,
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** GET /customer/profile */
export async function fetchProfile(): Promise<UserProfile> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.auth.profile);
  const raw = unwrap<Record<string, unknown>>(res);
  return parseProfile(raw);
}

/** POST /customer/profile/update */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<UserProfile> {
  const formData = new FormData();
  if (input.name_ar !== undefined) formData.append("name_ar", input.name_ar);
  if (input.name_en !== undefined) formData.append("name_en", input.name_en);
  if (input.email !== undefined) formData.append("email", input.email);
  if (input.phone !== undefined) formData.append("phone", input.phone);
  if (input.country_id !== undefined)
    formData.append("country_id", String(input.country_id));
  if (input.city_id !== undefined)
    formData.append("city_id", String(input.city_id));
  if (input.avatar_file) formData.append("avatar_file", input.avatar_file);

  const res = await apiFetch<Record<string, unknown>>(
    endpoints.auth.updateProfile,
    { method: "POST", body: formData }
  );
  const raw = unwrap<Record<string, unknown>>(res);
  return parseProfile(raw);
}

/** POST /customer/client/update */
export async function updateClient(
  input: UpdateClientInput
): Promise<ProfileClient> {
  const formData = new FormData();
  if (input.name_ar !== undefined) formData.append("name_ar", input.name_ar);
  if (input.name_en !== undefined) formData.append("name_en", input.name_en);
  if (input.email !== undefined) formData.append("email", input.email);
  if (input.phone !== undefined) formData.append("phone", input.phone);
  if (input.address !== undefined) formData.append("address", input.address);
  if (input.country_id !== undefined)
    formData.append("country_id", String(input.country_id));
  if (input.city_id !== undefined)
    formData.append("city_id", String(input.city_id));
  if (input.category_id !== undefined)
    formData.append("category_id", String(input.category_id));
  if (input.avatar_file) formData.append("avatar_file", input.avatar_file);

  const res = await apiFetch<Record<string, unknown>>(
    endpoints.auth.updateClient,
    { method: "POST", body: formData }
  );
  const raw = unwrap<Record<string, unknown>>(res);
  // response might be the client or wrapped
  const clientRaw = (raw.client ?? raw) as Record<string, unknown>;
  return parseClient(clientRaw);
}

/**
 * Change password.
 * FIX: tries POST /customer/profile/update with password fields (Postman-documented flow).
 * If a dedicated /customer/password/change endpoint exists on backend, it would be preferable —
 * but it is not in the Postman collection, so we use profile/update.
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<void> {
  await apiFetch(endpoints.auth.updateProfile, {
    method: "POST",
    body: {
      current_password: input.current_password,
      password: input.password,
      password_confirmation: input.password_confirmation,
    },
  });
}
