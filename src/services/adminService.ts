/**
 * Admin service — wraps /admin/* endpoints used by the admin section.
 * Endpoints are auth-protected; responses are normalized into resilient shapes.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, pickObject, str, num, bool, id, type RawObject } from "@/lib/raw-response";

// ---------------- Dashboard ----------------
export interface AdminDashboardStats {
  totals: Record<string, number | string>;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const raw = await api.get<unknown>(endpoints.admin.dashboardStats);
  const data = pickObject(raw);
  const totals: Record<string, number | string> = {};
  Object.entries(data).forEach(([k, v]) => {
    if (typeof v === "number" || typeof v === "string") totals[k] = v;
  });
  return { totals };
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

function mapUser(u: RawObject): AdminUser {
  const country = u.country as RawObject | undefined;
  const city = u.city as RawObject | undefined;
  return {
    id: id(u),
    name: str(u, "name", "full_name", "username") ?? "—",
    email: str(u, "email"),
    phone: str(u, "phone", "mobile"),
    country: (country && str(country, "name")) ?? str(u, "country_name", "country"),
    city: (city && str(city, "name")) ?? str(u, "city_name", "city"),
    status:
      str(u, "status") ??
      (bool(u, "is_active") ? "active" : u.active === false ? "inactive" : "active"),
    avatar: (str(u, "avatar", "image") ?? null),
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const raw = await api.get<unknown>(endpoints.admin.users);
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

function mapCategory(c: RawObject): AdminCategory {
  const name = c.name as RawObject | undefined;
  return {
    id: id(c),
    nameAr: str(c, "name_ar", "nameAr", "arabic_name") ?? (name && str(name, "ar")),
    nameEn: str(c, "name_en", "nameEn", "english_name") ?? (name && str(name, "en")) ?? str(c, "name"),
    description: str(c, "description_en", "description", "desc"),
    image: str(c, "image", "logo", "icon") ?? null,
    status: str(c, "status") ?? (bool(c, "is_active") ? "active" : "inactive"),
  };
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const raw = await api.get<unknown>(endpoints.admin.categories);
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

function mapService(s: RawObject): AdminService {
  return {
    id: id(s),
    name: str(s, "name_en", "name", "title") ?? "—",
    description: str(s, "description_ar", "description", "desc"),
    price: num(s, "price", "cost") ?? str(s, "price", "cost"),
    status: str(s, "status") ?? (bool(s, "is_active") ? "active" : "inactive"),
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
  const raw = await api.get<unknown>(endpoints.admin.services, { query });
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

function mapPackage(p: RawObject): AdminPackage {
  const services = Array.isArray(p.services)
    ? (p.services as RawObject[])
        .map((s) => str(s, "name_en", "name", "title") ?? String(s))
        .filter(Boolean)
    : [];
  const months = num(p, "duration_months", "months");
  const years = num(p, "duration_years", "years");
  let duration = str(p, "duration") ?? "";
  if (!duration) {
    const parts: string[] = [];
    if (years) parts.push(`${years}y`);
    if (months) parts.push(`${months}m`);
    duration = parts.join(" ");
  }
  const category = p.category as RawObject | undefined;
  return {
    id: id(p),
    category:
      (category && (str(category, "name_en", "name"))) ??
      str(p, "category_name"),
    nameAr: str(p, "name_ar", "arabic_name"),
    nameEn: str(p, "name_en", "english_name", "name"),
    description: str(p, "description_en", "description"),
    price: num(p, "price") ?? str(p, "price"),
    duration,
    services,
    status: str(p, "status") ?? (bool(p, "is_active") ? "active" : "inactive"),
  };
}

export async function fetchAdminPackages(): Promise<AdminPackage[]> {
  const raw = await api.get<unknown>(endpoints.admin.packages);
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

function mapAiModel(m: RawObject): AdminAiModel {
  return {
    id: id(m),
    name: str(m, "name") ?? "—",
    version: str(m, "version"),
    modelPath: str(m, "model_path", "path"),
    services: Array.isArray(m.services)
      ? (m.services as RawObject[])
          .map((s) => str(s, "name", "name_en") ?? String(s))
          .join(", ")
      : (str(m, "services") ?? "-"),
    status: str(m, "status") ?? (bool(m, "is_active") ? "active" : "inactive"),
  };
}

export async function fetchAdminAiModels(): Promise<AdminAiModel[]> {
  const raw = await api.get<unknown>(endpoints.admin.aiModels);
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
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const raw = await api.get<unknown>(endpoints.admin.settings);
  const d = pickObject(raw);
  return {
    general: {
      appName: str(d, "app_name", "application_name", "name"),
      appDescription: str(d, "app_description", "application_description", "description"),
      contactEmail: str(d, "contact_email"),
      supportPhone: str(d, "support_phone"),
    },
    legal: {
      privacyPolicy: str(d, "privacy_policy"),
      termsOfService: str(d, "terms_of_service", "terms"),
      cookiePolicy: str(d, "cookie_policy"),
    },
    notifications: {
      notificationEmail: str(d, "notification_email"),
      emailSignature: str(d, "email_signature"),
    },
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

function mapSubscription(s: RawObject): AdminSubscription {
  const user = s.user as RawObject | undefined;
  const customer = s.customer as RawObject | undefined;
  const pkg = s.package as RawObject | undefined;
  return {
    id: id(s),
    user:
      (user && str(user, "name")) ??
      str(s, "user_name") ??
      (customer && str(customer, "name")) ??
      "—",
    amount: num(s, "amount", "price") ?? str(s, "amount", "price"),
    notes: str(s, "notes", "note"),
    package: (pkg && str(pkg, "name_en", "name")) ?? str(s, "package_name"),
    status: str(s, "status", "payment_status"),
    type: str(s, "type") ?? "Subscribe",
    startDate: str(s, "start_date", "starts_at"),
    endDate: str(s, "end_date", "ends_at"),
    createdAt: str(s, "created_at", "createdAt"),
  };
}

export async function fetchAdminSubscriptions(): Promise<AdminSubscription[]> {
  const raw = await api.get<unknown>(endpoints.admin.subscriptions);
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
  const raw = await api.post<unknown>(endpoints.admin.userCreate, input);
  return mapUser(pickObject(raw));
}

export async function updateAdminUser(
  userId: string | number,
  input: Partial<AdminUserInput>
): Promise<AdminUser> {
  const raw = await api.post<unknown>(endpoints.admin.userUpdate, { id: userId, ...input });
  return mapUser(pickObject(raw));
}

export async function deleteAdminUser(userId: string | number): Promise<void> {
  await api.post<unknown>(endpoints.admin.userDelete, { id: userId });
}

export async function fetchAdminUserSingle(
  userId: string | number
): Promise<AdminUser> {
  const raw = await api.get<unknown>(endpoints.admin.userSingle, { query: { id: userId } });
  return mapUser(pickObject(raw));
}
