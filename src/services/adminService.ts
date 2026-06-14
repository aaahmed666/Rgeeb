/**
 * Admin service — wraps all /admin/* endpoints.
 * Every entity has full CRUD so views never call api.post inline.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import {
  pickArray,
  pickObject,
  str,
  num,
  bool,
  id,
  type RawObject,
} from "@/lib/raw-response";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrap(raw: unknown): RawObject {
  const obj = pickObject(raw);
  // Many endpoints wrap in { data: ... }
  if (obj.data && typeof obj.data === "object") return obj.data as RawObject;
  return obj;
}

function unwrapArray(raw: unknown): RawObject[] {
  const arr = pickArray(raw);
  if (arr.length > 0) return arr;
  // Try { data: [...] }
  const obj = raw as Record<string, unknown>;
  if (obj?.data && Array.isArray(obj.data)) return obj.data as RawObject[];
  return [];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  clients: number;
  categories: number;
  services: number;
  packages: number;
  aiModels: number;
  subscriptions: number;
  activeSubscriptions: number;
}

/**
 * Builds stats by running parallel count queries on the list endpoints.
 * Tries a dedicated /admin/dashboard-stats endpoint first (fast, accurate).
 * Falls back to list queries, preferring meta.total over array length to avoid
 * pagination caps (ISSUE-D01). Uses /admin/clients not /admin/users (ISSUE-D02).
 */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  // 1. Try dedicated stats endpoint (fast, accurate)
  try {
    const raw = await api.get<unknown>("/admin/dashboard-stats");
    const obj = unwrap(raw);
    if (obj.clients !== undefined) {
      return {
        clients:             num(obj, "clients",               "total_clients") ?? 0,
        categories:          num(obj, "categories")            ?? 0,
        services:            num(obj, "services")              ?? 0,
        packages:            num(obj, "packages")              ?? 0,
        aiModels:            num(obj, "ai_models", "aiModels") ?? 0,
        subscriptions:       num(obj, "subscriptions")         ?? 0,
        activeSubscriptions: num(obj, "active_subscriptions",  "activeSubscriptions") ?? 0,
      };
    }
  } catch { /* fall through to list fallback */ }

  // 2. Parallel list queries — use meta.total when available (avoids pagination cap)
  const results = await Promise.allSettled([
    api.get<unknown>(endpoints.admin.clients ?? endpoints.admin.users), // ISSUE-D02: clients, not users
    api.get<unknown>(endpoints.admin.categories),
    api.get<unknown>(endpoints.admin.services),
    api.get<unknown>(endpoints.admin.packages),
    api.get<unknown>(endpoints.admin.aiModels),
    api.get<unknown>(endpoints.admin.subscriptions),
    api.get<unknown>(endpoints.admin.subscriptionsActive),
  ]);

  const count = (r: PromiseSettledResult<unknown>) => {
    if (r.status !== "fulfilled") return 0;
    const raw = r.value as Record<string, unknown>;
    const meta = raw?.meta as Record<string, unknown> | undefined;
    return num(meta ?? {}, "total") ?? unwrapArray(r.value).length;
  };

  return {
    clients:             count(results[0]),
    categories:          count(results[1]),
    services:            count(results[2]),
    packages:            count(results[3]),
    aiModels:            count(results[4]),
    subscriptions:       count(results[5]),
    activeSubscriptions: count(results[6]),
  };
}

// ─── Users (admin user accounts) ─────────────────────────────────────────────

export interface AdminUser {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
  mainAdmin?: boolean;
  clientId?: string;
  country?: string;
  city?: string;
  avatar?: string | null;
  createdAt?: string;
}

function mapUser(u: RawObject): AdminUser {
  const country = u.country as RawObject | undefined;
  const city = u.city as RawObject | undefined;
  return {
    id: id(u),
    nameAr: str(u, "name_ar"),
    nameEn: str(u, "name_en"),
    name: str(u, "name_en", "name_ar", "name") ?? "—",
    email: str(u, "email"),
    phone: str(u, "phone"),
    active: bool(u, "active"),
    mainAdmin: bool(u, "main_admin"),
    clientId: str(u, "client_id"),
    country:
      (country && str(country, "name_en", "name")) ?? str(u, "country_name"),
    city: (city && str(city, "name_en", "name")) ?? str(u, "city_name"),
    avatar: str(u, "avatar") ?? null,
    createdAt: str(u, "created_at"),
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.users)).map(
    mapUser
  );
}

export async function fetchAdminUserSingle(
  userId: string | number
): Promise<AdminUser> {
  return mapUser(
    unwrap(
      await api.get<unknown>(endpoints.admin.userSingle, {
        query: { id: userId },
      })
    )
  );
}

export interface AdminUserInput {
  name_ar: string;
  name_en: string;
  email: string;
  password?: string;
  phone?: string;
  active?: boolean;
  main_admin?: boolean;
  client_id?: string | number;
}

export async function createAdminUser(
  input: AdminUserInput
): Promise<AdminUser> {
  return mapUser(
    unwrap(await api.post<unknown>(endpoints.admin.userCreate, input))
  );
}

export async function updateAdminUser(
  userId: string | number,
  input: Partial<AdminUserInput>
): Promise<AdminUser> {
  return mapUser(
    unwrap(
      await api.post<unknown>(endpoints.admin.userUpdate, {
        id: userId,
        ...input,
      })
    )
  );
}

export async function deleteAdminUser(userId: string | number): Promise<void> {
  await api.post<unknown>(endpoints.admin.userDelete, { id: userId });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface AdminCategory {
  id: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  image?: string | null;
  active?: boolean;
}

function mapCategory(c: RawObject): AdminCategory {
  return {
    id: id(c),
    nameAr: str(c, "name_ar"),
    nameEn: str(c, "name_en", "name"),
    description: str(c, "description"),
    image: str(c, "image", "category_image") ?? null,
    active: bool(c, "active"),
  };
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.categories)).map(
    mapCategory
  );
}

export interface AdminCategoryInput {
  name_ar: string;
  name_en: string;
  description?: string;
  active?: boolean;
  category_image?: File | null;
}

export async function createAdminCategory(
  input: AdminCategoryInput
): Promise<AdminCategory> {
  const fd = new FormData();
  fd.append("name_ar", input.name_ar);
  fd.append("name_en", input.name_en);
  if (input.description) fd.append("description", input.description);
  fd.append("active", input.active !== false ? "1" : "0");
  if (input.category_image) fd.append("category_image", input.category_image);
  return mapCategory(
    unwrap(await api.post<unknown>(endpoints.admin.categoryCreate, fd))
  );
}

export async function updateAdminCategory(
  categoryId: string | number,
  input: Partial<AdminCategoryInput>
): Promise<AdminCategory> {
  const fd = new FormData();
  fd.append("id", String(categoryId));
  if (input.name_ar !== undefined) fd.append("name_ar", input.name_ar);
  if (input.name_en !== undefined) fd.append("name_en", input.name_en);
  if (input.description !== undefined)
    fd.append("description", input.description);
  if (input.active !== undefined) fd.append("active", input.active ? "1" : "0");
  if (input.category_image) fd.append("category_image", input.category_image);
  return mapCategory(
    unwrap(await api.post<unknown>(endpoints.admin.categoryUpdate, fd))
  );
}

export async function deleteAdminCategory(
  categoryId: string | number
): Promise<void> {
  await api.post<unknown>(endpoints.admin.categoryDelete, { id: categoryId });
}

// ─── Services ─────────────────────────────────────────────────────────────────

export interface AdminService {
  id: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  price?: number;
  active?: boolean;
  requiresDrawing?: boolean;
}

function mapService(s: RawObject): AdminService {
  return {
    id: id(s),
    nameAr: str(s, "name_ar"),
    nameEn: str(s, "name_en", "name"),
    description: str(s, "description"),
    price: num(s, "price"),
    active: bool(s, "active"),
    requiresDrawing: bool(s, "requires_drawing"),
  };
}

export async function fetchAdminServices(): Promise<AdminService[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.services)).map(
    mapService
  );
}

export interface AdminServiceInput {
  name_ar: string;
  name_en: string;
  description?: string;
  price?: number | string;
  active?: boolean;
}

export async function createAdminService(
  input: AdminServiceInput
): Promise<AdminService> {
  return mapService(
    unwrap(await api.post<unknown>(endpoints.admin.serviceCreate, input))
  );
}

export async function updateAdminService(
  serviceId: string | number,
  input: Partial<AdminServiceInput>
): Promise<AdminService> {
  return mapService(
    unwrap(
      await api.post<unknown>(endpoints.admin.serviceUpdate, {
        id: serviceId,
        ...input,
      })
    )
  );
}

export async function deleteAdminService(
  serviceId: string | number
): Promise<void> {
  await api.post<unknown>(endpoints.admin.serviceDelete, { id: serviceId });
}

// ─── Packages ─────────────────────────────────────────────────────────────────

export interface AdminPackage {
  id: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price?: number;
  durationMonths?: number;
  maxCameras?: number;
  maxBranches?: number;
  categoryId?: string;
  categoryName?: string;
  serviceIds?: string[];
  serviceNames?: string[];
  active?: boolean;
}

function mapPackage(p: RawObject): AdminPackage {
  const category = p.category as RawObject | undefined;
  const services = Array.isArray(p.services) ? (p.services as RawObject[]) : [];
  return {
    id: id(p),
    nameAr: str(p, "name_ar"),
    nameEn: str(p, "name_en", "name"),
    descriptionAr: str(p, "description_ar"),
    descriptionEn: str(p, "description_en", "description"),
    price: num(p, "price"),
    durationMonths: num(p, "duration_months"),
    maxCameras: num(p, "max_cameras"),
    maxBranches: num(p, "max_branches"),
    categoryId: str(p, "category_id") ?? (category && id(category)),
    categoryName:
      (category && str(category, "name_en", "name")) ?? str(p, "category_name"),
    serviceIds: services.map((s) => id(s)).filter(Boolean),
    serviceNames: services
      .map((s) => str(s, "name_en", "name") ?? "")
      .filter(Boolean),
    active: bool(p, "active"),
  };
}

export async function fetchAdminPackages(): Promise<AdminPackage[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.packages)).map(
    mapPackage
  );
}

export interface AdminPackageInput {
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price: number | string;
  duration_months: number | string;
  active?: boolean;
  category_id?: string | number;
  max_cameras?: number | string;
  max_branches?: number | string;
  "service_ids[]"?: (string | number)[];
}

export async function createAdminPackage(
  input: AdminPackageInput
): Promise<AdminPackage> {
  // Build FormData with service_ids[] array
  const fd = buildPackageFormData(input);
  return mapPackage(
    unwrap(await api.post<unknown>(endpoints.admin.packageCreate, fd))
  );
}

export async function updateAdminPackage(
  packageId: string | number,
  input: Partial<AdminPackageInput>
): Promise<AdminPackage> {
  const fd = buildPackageFormData(input);
  fd.append("id", String(packageId));
  return mapPackage(
    unwrap(await api.post<unknown>(endpoints.admin.packageUpdate, fd))
  );
}

export async function deleteAdminPackage(
  packageId: string | number
): Promise<void> {
  await api.post<unknown>(endpoints.admin.packageDelete, { id: packageId });
}

function buildPackageFormData(input: Partial<AdminPackageInput>): FormData {
  const fd = new FormData();
  const fields: (keyof AdminPackageInput)[] = [
    "name_ar",
    "name_en",
    "description_ar",
    "description_en",
    "price",
    "duration_months",
    "category_id",
    "max_cameras",
    "max_branches",
  ];
  fields.forEach((k) => {
    if (input[k] !== undefined) fd.append(k, String(input[k]));
  });
  if (input.active !== undefined) fd.append("active", input.active ? "1" : "0");
  (input["service_ids[]"] ?? []).forEach((sid, idx) => {
    fd.append(`service_ids[${idx}]`, String(sid));
  });
  return fd;
}

// ─── AI Models ────────────────────────────────────────────────────────────────

export interface AdminAiModel {
  id: string;
  name: string;
  version?: string;
  modelPath?: string;
  serviceIds?: string[];
  serviceNames?: string[];
  active?: boolean;
}

function mapAiModel(m: RawObject): AdminAiModel {
  const services = Array.isArray(m.services) ? (m.services as RawObject[]) : [];
  return {
    id: id(m),
    name: str(m, "name") ?? "—",
    version: str(m, "version"),
    modelPath: str(m, "model_path"),
    serviceIds: services.map((s) => id(s)).filter(Boolean),
    serviceNames: services
      .map((s) => str(s, "name_en", "name") ?? "")
      .filter(Boolean),
    active: bool(m, "active"),
  };
}

export async function fetchAdminAiModels(): Promise<AdminAiModel[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.aiModels)).map(
    mapAiModel
  );
}

export interface AdminAiModelInput {
  name: string;
  version?: string;
  model_path?: string;
  active?: boolean;
  "service_ids[]"?: (string | number)[];
}

function buildAiModelFormData(
  input: Partial<AdminAiModelInput> & { id?: string | number }
): FormData {
  const fd = new FormData();
  if (input.id !== undefined) fd.append("id", String(input.id));
  if (input.name !== undefined) fd.append("name", input.name);
  if (input.version !== undefined) fd.append("version", input.version);
  if (input.model_path !== undefined) fd.append("model_path", input.model_path);
  if (input.active !== undefined) fd.append("active", input.active ? "1" : "0");
  // Postman: service_ids[] with indexed keys
  (input["service_ids[]"] ?? []).forEach((sid, idx) => {
    fd.append(`service_ids[${idx}]`, String(sid));
  });
  return fd;
}

export async function createAdminAiModel(
  input: AdminAiModelInput
): Promise<AdminAiModel> {
  return mapAiModel(
    unwrap(
      await api.post<unknown>(
        endpoints.admin.aiModelCreate,
        buildAiModelFormData(input)
      )
    )
  );
}

export async function updateAdminAiModel(
  modelId: string | number,
  input: Partial<AdminAiModelInput>
): Promise<AdminAiModel> {
  return mapAiModel(
    unwrap(
      await api.post<unknown>(
        endpoints.admin.aiModelUpdate,
        buildAiModelFormData({ id: modelId, ...input })
      )
    )
  );
}

export async function deleteAdminAiModel(
  modelId: string | number
): Promise<void> {
  await api.post<unknown>(endpoints.admin.aiModelDelete, { id: modelId });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AdminSettings {
  raw: Record<string, string>; // key → value pairs from API
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const raw = await api.get<unknown>(endpoints.admin.settings);
  const arr = unwrapArray(raw);
  // Settings come as [{ key, value }, ...] or as a flat object
  const result: Record<string, string> = {};
  if (arr.length > 0) {
    arr.forEach((item) => {
      const k = str(item, "key");
      const v = str(item, "value");
      if (k) result[k] = v ?? "";
    });
  } else {
    const obj = unwrap(raw);
    Object.entries(obj).forEach(([k, v]) => {
      if (typeof v === "string" || typeof v === "number") result[k] = String(v);
    });
  }
  return { raw: result };
}

export async function upsertAdminSetting(
  key: string,
  value: string
): Promise<void> {
  await api.post<unknown>(endpoints.admin.settingsUpsert, { key, value });
}

export async function upsertManyAdminSettings(
  pairs: { key: string; value: string }[]
): Promise<void> {
  const body: Record<string, string> = {};
  pairs.forEach(({ key, value }, idx) => {
    body[`settings[${idx}][key]`] = key;
    body[`settings[${idx}][value]`] = value;
  });
  await api.post<unknown>(endpoints.admin.settingsUpsertMany, body);
}

export async function fetchAdminPrivacyPolicy(): Promise<string> {
  const raw = await api.get<unknown>(endpoints.admin.settingsPrivacyPolicy);
  const obj = unwrap(raw);
  return str(obj, "privacy_policy", "content", "value") ?? "";
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface AdminSubscription {
  id: string;
  userName?: string;
  userEmail?: string;
  package?: string;
  packageId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  price?: number;
  createdAt?: string;
}

function mapSubscription(s: RawObject): AdminSubscription {
  const user = (s.user ?? s.customer) as RawObject | undefined;
  const pkg = s.package as RawObject | undefined;
  return {
    id: id(s),
    userName:
      (user && str(user, "name_en", "name")) ??
      str(s, "user_name", "customer_name"),
    userEmail: (user && str(user, "email")) ?? str(s, "user_email"),
    package: (pkg && str(pkg, "name_en", "name")) ?? str(s, "package_name"),
    packageId: (pkg && id(pkg)) ?? str(s, "package_id"),
    status: str(s, "status"),
    startDate: str(s, "start_date", "starts_at"),
    endDate: str(s, "end_date", "ends_at"),
    daysRemaining: num(s, "days_remaining"),
    price: num(s, "price", "amount"),
    createdAt: str(s, "created_at"),
  };
}

export async function fetchAdminSubscriptions(): Promise<AdminSubscription[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.subscriptions)).map(
    mapSubscription
  );
}

export async function fetchAdminActiveSubscriptions(): Promise<
  AdminSubscription[]
> {
  return unwrapArray(
    await api.get<unknown>(endpoints.admin.subscriptionsActive)
  ).map(mapSubscription);
}

export async function fetchAdminSubscriptionSingle(
  subId: string | number
): Promise<AdminSubscription> {
  return mapSubscription(
    unwrap(
      await api.get<unknown>(endpoints.admin.subscriptionSingle, {
        query: { id: subId },
      })
    )
  );
}

// ─── Countries ────────────────────────────────────────────────────────────────

export interface AdminCountry {
  id: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
}

function mapCountry(c: RawObject): AdminCountry {
  return {
    id: id(c),
    nameAr: str(c, "name_ar"),
    nameEn: str(c, "name_en", "name"),
    code: str(c, "code"),
  };
}

export async function fetchAdminCountries(): Promise<AdminCountry[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.countries)).map(
    mapCountry
  );
}

export interface AdminCountryInput {
  name_ar: string;
  name_en: string;
  code?: string;
}

export async function createAdminCountry(
  input: AdminCountryInput
): Promise<AdminCountry> {
  return mapCountry(
    unwrap(await api.post<unknown>(endpoints.admin.countryCreate, input))
  );
}

export async function updateAdminCountry(
  cid: string | number,
  input: Partial<AdminCountryInput>
): Promise<AdminCountry> {
  return mapCountry(
    unwrap(
      await api.put<unknown>(
        (endpoints.admin.countryUpdate as (id: string | number) => string)(cid),
        input
      )
    )
  );
}

export async function deleteAdminCountry(cid: string | number): Promise<void> {
  await api.delete<unknown>(
    (endpoints.admin.countryDelete as (id: string | number) => string)(cid)
  );
}

// ─── Cities ───────────────────────────────────────────────────────────────────

export interface AdminCity {
  id: string;
  nameAr?: string;
  nameEn?: string;
  countryId?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

function mapCity(c: RawObject): AdminCity {
  const country = c.country as RawObject | undefined;
  return {
    id: id(c),
    nameAr: str(c, "name_ar"),
    nameEn: str(c, "name_en", "name"),
    countryId: str(c, "country_id") ?? (country && id(country)),
    countryName:
      (country && str(country, "name_en", "name")) ?? str(c, "country_name"),
    latitude: num(c, "latitude"),
    longitude: num(c, "longitude"),
  };
}

export async function fetchAdminCities(
  countryId?: string | number
): Promise<AdminCity[]> {
  const query = countryId ? { country_id: countryId } : undefined;
  return unwrapArray(
    await api.get<unknown>(endpoints.admin.cities, { query })
  ).map(mapCity);
}

export interface AdminCityInput {
  country_id: string | number;
  name_ar: string;
  name_en: string;
  latitude?: number;
  longitude?: number;
}

export async function createAdminCity(
  input: AdminCityInput
): Promise<AdminCity> {
  return mapCity(
    unwrap(await api.post<unknown>(endpoints.admin.cityCreate, input))
  );
}

export async function updateAdminCity(
  cityId: string | number,
  input: Partial<AdminCityInput>
): Promise<AdminCity> {
  return mapCity(
    unwrap(
      await api.put<unknown>(
        (endpoints.admin.cityUpdate as (id: string | number) => string)(cityId),
        input
      )
    )
  );
}

export async function deleteAdminCity(cityId: string | number): Promise<void> {
  await api.delete<unknown>(
    (endpoints.admin.cityDelete as (id: string | number) => string)(cityId)
  );
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export interface AdminClient {
  id: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  active?: boolean;
  mainAdmin?: boolean;
  avatar?: string;
  createdAt?: string;
}

function mapClient(c: RawObject): AdminClient {
  const country = c.country as RawObject | undefined;
  return {
    id: str(c, "id") ?? String(c.id ?? ""),
    name: str(c, "name_en", "name") ?? "",
    nameEn: str(c, "name_en"),
    nameAr: str(c, "name_ar"),
    email: str(c, "email"),
    phone: str(c, "phone"),
    country:
      (country && str(country, "name_en", "name")) ?? str(c, "country_name"),
    active: c.active !== false && c.active !== 0,
    mainAdmin: Boolean(c.main_admin),
    city: str(c, "city"),
    avatar: str(c, "avatar", "avatar_url"),
    createdAt: str(c, "created_at"),
  };
}

export async function fetchAdminClients(): Promise<AdminClient[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.clients)).map(
    mapClient
  );
}

export interface AdminClientInput {
  name_en: string;
  name_ar?: string;
  email: string;
  phone?: string;
  password?: string;
  active?: boolean;
  main_admin?: boolean;
}

export async function createAdminClient(
  input: AdminClientInput
): Promise<AdminClient> {
  return mapClient(
    unwrap(await api.post<unknown>(endpoints.admin.clientCreate, input))
  );
}

export async function updateAdminClient(
  clientId: string | number,
  input: Partial<AdminClientInput>
): Promise<AdminClient> {
  return mapClient(
    unwrap(
      await api.put<unknown>(
        endpoints.admin.clientUpdate,
        { id: clientId, ...input }
      )
    )
  );
}

export async function deleteAdminClient(
  clientId: string | number
): Promise<void> {
  const deleteFn = endpoints.admin.clientDelete as (id: string | number) => string;
  await api.delete<unknown>(deleteFn(clientId));
}

// ─── Roles (admin) ────────────────────────────────────────────────────────────
// Endpoints: GET /admin/roles · GET /admin/roles/single?id= ·
//            GET /admin/roles/permissions · POST create|update|delete
// create/update fields: name, permission_ids[]  (update also: id)

export interface AdminPermission {
  id: string;
  name: string;
  group?: string;
}

export interface AdminRole {
  id: string;
  name: string;
  permissionIds: string[];
  permissionsCount: number;
}

function mapPermission(p: RawObject): AdminPermission {
  return {
    id: id(p),
    name: str(p, "name", "label", "key", "display_name") ?? "",
    group: str(p, "group", "category", "module"),
  };
}

function permIds(raw: unknown): string[] {
  return pickArray(raw)
    .map((x) =>
      x && typeof x === "object" ? id(x as RawObject) : String(x)
    )
    .filter(Boolean);
}

function mapRole(r: RawObject): AdminRole {
  const ids = permIds(r.permissions ?? r.permission_ids ?? r.permissionIds);
  return {
    id: id(r),
    name: str(r, "name", "display_name") ?? "",
    permissionIds: ids,
    permissionsCount: num(r, "permissions_count") ?? ids.length,
  };
}

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.roles)).map(mapRole);
}

export async function fetchAdminRoleSingle(
  roleId: string | number
): Promise<AdminRole> {
  return mapRole(
    unwrap(
      await api.get<unknown>(endpoints.admin.roleSingle, {
        query: { id: roleId },
      })
    )
  );
}

export async function fetchAdminPermissions(): Promise<AdminPermission[]> {
  return unwrapArray(
    await api.get<unknown>(endpoints.admin.rolePermissions)
  ).map(mapPermission);
}

export interface AdminRoleInput {
  name: string;
  permission_ids: (string | number)[];
}

function roleFormData(input: Partial<AdminRoleInput>, roleId?: string | number) {
  const fd = new FormData();
  if (roleId !== undefined) fd.append("id", String(roleId));
  if (input.name !== undefined) fd.append("name", input.name);
  // Indexed form (permission_ids[0], permission_ids[1], …) — matches the
  // proven customer rolesService payload; a plain JSON array is not reliably
  // accepted by the backend.
  if (input.permission_ids)
    input.permission_ids.forEach((pid, i) =>
      fd.append(`permission_ids[${i}]`, String(pid))
    );
  return fd;
}

export async function createAdminRole(input: AdminRoleInput): Promise<AdminRole> {
  return mapRole(
    unwrap(await api.post<unknown>(endpoints.admin.roleCreate, roleFormData(input)))
  );
}

export async function updateAdminRole(
  roleId: string | number,
  input: Partial<AdminRoleInput>
): Promise<AdminRole> {
  return mapRole(
    unwrap(
      await api.post<unknown>(
        endpoints.admin.roleUpdate,
        roleFormData(input, roleId)
      )
    )
  );
}

export async function deleteAdminRole(roleId: string | number): Promise<void> {
  await api.post<unknown>(endpoints.admin.roleDelete, { id: roleId });
}

// ─── Detections (admin) ─────────────────────────────────────────────────────
// Endpoints: GET /admin/detections · GET /admin/detections/single?id= ·
//            POST create|update|delete
// fields: client_id, branch_id, camera_id, ai_model_id?, service_id?, type?,
//         score?, detected_at?, data?   (update also: id)

export interface AdminDetection {
  id: string;
  clientId?: string;
  clientName?: string;
  branchId?: string;
  branchName?: string;
  cameraId?: string;
  cameraName?: string;
  serviceId?: string;
  serviceName?: string;
  aiModelId?: string;
  type?: string;
  score?: number;
  detectedAt?: string;
}

function mapDetection(d: RawObject): AdminDetection {
  return {
    id: id(d),
    clientId: str(d, "client_id", "clientId"),
    clientName: str(d, "client_name", "client"),
    branchId: str(d, "branch_id", "branchId"),
    branchName: str(d, "branch_name", "branch"),
    cameraId: str(d, "camera_id", "cameraId"),
    cameraName: str(d, "camera_name", "camera"),
    serviceId: str(d, "service_id", "serviceId"),
    serviceName: str(d, "service_name", "service"),
    aiModelId: str(d, "ai_model_id", "aiModelId"),
    type: str(d, "type"),
    score: num(d, "score"),
    detectedAt: str(d, "detected_at", "detectedAt", "created_at"),
  };
}

export async function fetchAdminDetections(): Promise<AdminDetection[]> {
  return unwrapArray(await api.get<unknown>(endpoints.admin.detections)).map(
    mapDetection
  );
}

export interface AdminDetectionInput {
  client_id: string | number;
  branch_id: string | number;
  camera_id: string | number;
  ai_model_id?: string | number;
  service_id?: string | number;
  type?: string;
  score?: number;
  detected_at?: string;
}

function detectionFormData(
  input: Partial<AdminDetectionInput>,
  detectionId?: string | number
) {
  const fd = new FormData();
  if (detectionId !== undefined) fd.append("id", String(detectionId));
  const map: Record<string, unknown> = {
    client_id: input.client_id,
    branch_id: input.branch_id,
    camera_id: input.camera_id,
    ai_model_id: input.ai_model_id,
    service_id: input.service_id,
    type: input.type,
    score: input.score,
    detected_at: input.detected_at,
  };
  Object.entries(map).forEach(([k, v]) => {
    if (v !== undefined && v !== "") fd.append(k, String(v));
  });
  return fd;
}

export async function createAdminDetection(
  input: AdminDetectionInput
): Promise<AdminDetection> {
  return mapDetection(
    unwrap(
      await api.post<unknown>(endpoints.admin.detectionCreate, detectionFormData(input))
    )
  );
}

export async function updateAdminDetection(
  detectionId: string | number,
  input: Partial<AdminDetectionInput>
): Promise<AdminDetection> {
  return mapDetection(
    unwrap(
      await api.post<unknown>(
        endpoints.admin.detectionUpdate,
        detectionFormData(input, detectionId)
      )
    )
  );
}

export async function deleteAdminDetection(
  detectionId: string | number
): Promise<void> {
  await api.post<unknown>(endpoints.admin.detectionDelete, { id: detectionId });
}
