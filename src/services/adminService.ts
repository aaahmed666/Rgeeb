/**
 * Admin service — wraps /admin/* endpoints used by the admin section.
 * Endpoints are auth-protected; responses are normalized into resilient shapes.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

function pickArray(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as any;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  if (Array.isArray(r?.items)) return r.items;
  if (Array.isArray(r?.results)) return r.results;
  return [];
}

function pickObject(raw: unknown): any {
  const r = raw as any;
  return r?.data ?? r ?? {};
}

// ---------------- Dashboard ----------------
export interface AdminDashboardStats {
  raw: any;
  totals: Record<string, number | string>;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const raw = await api.get<any>(endpoints.admin.dashboardStats);
  const data = pickObject(raw);
  const totals: Record<string, number | string> = {};
  Object.entries(data).forEach(([k, v]) => {
    if (typeof v === "number" || typeof v === "string") totals[k] = v;
  });
  return { raw: data, totals };
}

// ---------------- Users (Clients) ----------------
export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  status?: string;
  avatar?: string | null;
}

function mapUser(u: any): AdminUser {
  return {
    id: String(u.id ?? u.uuid ?? crypto.randomUUID()),
    name: u.name ?? u.full_name ?? u.username ?? "—",
    email: u.email ?? undefined,
    phone: u.phone ?? u.mobile ?? undefined,
    country: u.country?.name ?? u.country_name ?? u.country ?? undefined,
    city: u.city?.name ?? u.city_name ?? u.city ?? undefined,
    status:
      u.status ??
      (u.is_active ? "active" : u.active === false ? "inactive" : "active"),
    avatar: u.avatar ?? u.image ?? null,
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const raw = await api.get<any>(endpoints.admin.users);
  return pickArray(raw).map(mapUser);
}

// ---------------- Categories ----------------
export interface AdminCategory {
  id: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  image?: string | null;
  status?: string;
}

function mapCategory(c: any): AdminCategory {
  return {
    id: String(c.id ?? crypto.randomUUID()),
    nameAr: c.name_ar ?? c.nameAr ?? c.arabic_name ?? c.name?.ar,
    nameEn: c.name_en ?? c.nameEn ?? c.english_name ?? c.name?.en ?? c.name,
    description: c.description_en ?? c.description ?? c.desc,
    image: c.image ?? c.logo ?? c.icon ?? null,
    status: c.status ?? (c.is_active ? "active" : "inactive"),
  };
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const raw = await api.get<any>(endpoints.admin.categories);
  return pickArray(raw).map(mapCategory);
}

// ---------------- Services ----------------
export interface AdminService {
  id: string;
  name: string;
  description?: string;
  price?: number | string;
  status?: string;
}

function mapService(s: any): AdminService {
  return {
    id: String(s.id ?? crypto.randomUUID()),
    name: s.name_en ?? s.name ?? s.title ?? "—",
    description: s.description_ar ?? s.description ?? s.desc,
    price: s.price ?? s.cost,
    status: s.status ?? (s.is_active ? "active" : "inactive"),
  };
}

/**
 * Fetches admin services for the data table.
 * Supports optional pagination params (page, per_page, keyword) for
 * programmatic use. Without params it uses all=1 (backward compatible).
 *
 * For SELECT DROPDOWNS use AsyncPaginatedSelect instead:
 *   <AsyncPaginatedSelect endpoint="/admin/services" ... />
 */
export async function fetchAdminServices(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
}): Promise<AdminService[]> {
  const query = params?.page
    ? {
        page: params.page,
        per_page: params.per_page ?? 20,
        ...(params.keyword ? { keyword: params.keyword } : {}),
      }
    : { all: 1 };
  const raw = await api.get<any>(endpoints.admin.services, { query });
  return pickArray(raw).map(mapService);
}

// ---------------- Packages ----------------
export interface AdminPackage {
  id: string;
  category?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  price?: number | string;
  duration?: string;
  services: string[];
  status?: string;
}

function mapPackage(p: any): AdminPackage {
  const services = Array.isArray(p.services)
    ? p.services
        .map((s: any) => s?.name_en ?? s?.name ?? s?.title ?? String(s))
        .filter(Boolean)
    : [];
  const months = p.duration_months ?? p.months;
  const years = p.duration_years ?? p.years;
  let duration = p.duration ?? "";
  if (!duration) {
    const parts: string[] = [];
    if (years) parts.push(`${years}y`);
    if (months) parts.push(`${months}m`);
    duration = parts.join(" ");
  }
  return {
    id: String(p.id ?? crypto.randomUUID()),
    category:
      p.category?.name_en ?? p.category?.name ?? p.category_name ?? undefined,
    nameAr: p.name_ar ?? p.arabic_name,
    nameEn: p.name_en ?? p.english_name ?? p.name,
    description: p.description_en ?? p.description,
    price: p.price,
    duration,
    services,
    status: p.status ?? (p.is_active ? "active" : "inactive"),
  };
}

export async function fetchAdminPackages(): Promise<AdminPackage[]> {
  const raw = await api.get<any>(endpoints.admin.packages);
  return pickArray(raw).map(mapPackage);
}

// ---------------- AI Models ----------------
export interface AdminAiModel {
  id: string;
  name: string;
  version?: string;
  modelPath?: string;
  services?: string;
  status?: string;
}

function mapAiModel(m: any): AdminAiModel {
  return {
    id: String(m.id ?? crypto.randomUUID()),
    name: m.name ?? "—",
    version: m.version,
    modelPath: m.model_path ?? m.path,
    services: Array.isArray(m.services)
      ? m.services
          .map((s: any) => s?.name ?? s?.name_en ?? String(s))
          .join(", ")
      : (m.services ?? "-"),
    status: m.status ?? (m.is_active ? "active" : "inactive"),
  };
}

export async function fetchAdminAiModels(): Promise<AdminAiModel[]> {
  const raw = await api.get<any>(endpoints.admin.aiModels);
  return pickArray(raw).map(mapAiModel);
}

// ---------------- Settings ----------------
export interface AdminSettings {
  general: {
    appName?: string;
    appDescription?: string;
    contactEmail?: string;
    supportPhone?: string;
  };
  legal: {
    privacyPolicy?: string;
    termsOfService?: string;
    cookiePolicy?: string;
  };
  notifications: {
    notificationEmail?: string;
    emailSignature?: string;
  };
  raw: any;
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const raw = await api.get<any>(endpoints.admin.settings);
  const d = pickObject(raw);
  return {
    general: {
      appName: d.app_name ?? d.application_name ?? d.name,
      appDescription:
        d.app_description ?? d.application_description ?? d.description,
      contactEmail: d.contact_email,
      supportPhone: d.support_phone,
    },
    legal: {
      privacyPolicy: d.privacy_policy,
      termsOfService: d.terms_of_service ?? d.terms,
      cookiePolicy: d.cookie_policy,
    },
    notifications: {
      notificationEmail: d.notification_email,
      emailSignature: d.email_signature,
    },
    raw: d,
  };
}

// ---------------- Subscriptions ----------------
export interface AdminSubscription {
  id: string;
  user?: string;
  amount?: number | string;
  notes?: string;
  package?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

function mapSubscription(s: any): AdminSubscription {
  return {
    id: String(s.id ?? crypto.randomUUID()),
    user: s.user?.name ?? s.user_name ?? s.customer?.name ?? "—",
    amount: s.amount ?? s.price,
    notes: s.notes ?? s.note,
    package: s.package?.name_en ?? s.package?.name ?? s.package_name,
    status: s.status ?? s.payment_status,
    type: s.type ?? "Subscribe",
    startDate: s.start_date ?? s.starts_at,
    endDate: s.end_date ?? s.ends_at,
    createdAt: s.created_at ?? s.createdAt,
  };
}

export async function fetchAdminSubscriptions(): Promise<AdminSubscription[]> {
  const raw = await api.get<any>(endpoints.admin.subscriptions);
  return pickArray(raw).map(mapSubscription);
}

// =================== USERS — full CRUD ===================

export interface AdminUserInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  country_id?: string | number;
  city_id?: string | number;
  status?: string;
}

export async function createAdminUser(
  input: AdminUserInput
): Promise<AdminUser> {
  const raw = await api.post<any>(endpoints.admin.userCreate, input);
  return mapUser(pickObject(raw));
}

export async function updateAdminUser(
  id: string | number,
  input: Partial<AdminUserInput>
): Promise<AdminUser> {
  const raw = await api.post<any>(endpoints.admin.userUpdate, { id, ...input });
  return mapUser(pickObject(raw));
}

export async function deleteAdminUser(id: string | number): Promise<void> {
  await api.post<any>(endpoints.admin.userDelete, { id });
}

export async function fetchAdminUserSingle(
  id: string | number
): Promise<AdminUser> {
  const raw = await api.get<any>(endpoints.admin.userSingle, { query: { id } });
  return mapUser(pickObject(raw));
}
