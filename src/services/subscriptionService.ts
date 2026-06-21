import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface SubscriptionDetails {
  id: string;
  package_name: string;
  status: "active" | "expired" | "pending" | "cancelled";
  price: number;
  currency: string;
  duration_months: number;
  start_date: string;
  end_date: string;
  days_remaining: number;
  services: string[];
  service_names_ar?: string[];
}

export interface ResourceUsage {
  cameras: { used: number; total: number };
  branches: { used: number; total: number };
}

export interface BillingTransaction {
  id: string;
  date: string;
  type: "subscribe" | "payment" | "refund";
  package_name: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  method?: string;
  period_from?: string;
  period_to?: string;
}

export interface AvailableService {
  id: string;
  name: string;
  name_ar?: string;
  price?: number;
  included?: boolean;
}

function unwrap<T>(res: unknown, fallback: T): T {
  if (!res) return fallback;
  if (Array.isArray(res)) return res as T;
  const obj = res as { data?: T; items?: T };
  if (obj.data !== undefined) return obj.data;
  if (obj.items !== undefined) return obj.items;
  return res as T;
}

function asNumber(v: unknown, def = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }
  return def;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.max(0, Math.floor((e - Date.now()) / (1000 * 60 * 60 * 24)));
}

/**
 * GET /customer/subscriptions/current
 *
 * The backend returns the rich shape consumed by the OLD project's dashboard:
 *   {
 *     subscription_start_date, subscription_end_date,
 *     subscription_is_active, is_valid,
 *     package: { name_en, name_ar, price, duration_months,
 *                max_cameras, max_branches, services: [{ id, name, name_ar }] }
 *   }
 *
 * The previous mapper read top-level `package_name` / `start_date` / `status`
 * which DO NOT exist on this payload, so every field collapsed to its empty
 * default (— / 0 days / "Expiring soon"). This maps the real nested fields,
 * keeping the flat-shape names as fallbacks for forward compatibility.
 */
export async function fetchSubscription(): Promise<SubscriptionDetails | null> {
  try {
    const res = await apiFetch<Record<string, unknown>>(
      endpoints.subscription.current
    );
    const data = ((res?.data as Record<string, unknown>) ?? res) as Record<
      string,
      unknown
    > | null;
    if (!data) return null;

    const pkg = (data.package ?? {}) as Record<string, unknown>;

    // Services live on the package in the real contract; fall back to top-level.
    const services = Array.isArray(pkg.services)
      ? (pkg.services as unknown[])
      : Array.isArray(data.services)
        ? (data.services as unknown[])
        : [];

    const startDate = String(
      data.subscription_start_date ??
        data.start_date ??
        data.starts_at ??
        ""
    );
    const endDate = String(
      data.subscription_end_date ?? data.end_date ?? data.expires_at ?? ""
    );

    // Status: prefer an explicit string; otherwise derive from the boolean
    // flags the OLD project relied on (is_valid / subscription_is_active).
    const explicitStatus =
      typeof data.status === "string" && data.status
        ? (data.status as SubscriptionDetails["status"])
        : null;
    const isActive =
      data.is_valid === true || data.subscription_is_active === true;
    const status: SubscriptionDetails["status"] =
      explicitStatus ?? (isActive ? "active" : "expired");

    return {
      id: String(data.id ?? pkg.id ?? ""),
      package_name: String(
        pkg.name_en ??
          pkg.name_ar ??
          pkg.name ??
          data.package_name ??
          data.name ??
          "—"
      ),
      status,
      price: asNumber(pkg.price ?? data.price ?? data.total ?? 0),
      currency: String(data.currency ?? pkg.currency ?? "SAR"),
      duration_months: asNumber(
        pkg.duration_months ??
          data.duration_months ??
          data.months ??
          pkg.duration ??
          0
      ),
      start_date: startDate,
      end_date: endDate,
      days_remaining: asNumber(
        data.days_remaining ?? daysBetween(startDate, endDate)
      ),
      services: services.map((s) =>
        typeof s === "string"
          ? s
          : String(
              (s as Record<string, unknown>)?.name ??
                (s as Record<string, unknown>)?.name_en ??
                (s as Record<string, unknown>)?.title ??
                ""
            )
      ),
      service_names_ar: services
        .map((s) =>
          typeof s === "object" && s
            ? String((s as Record<string, unknown>)?.name_ar ?? "")
            : ""
        )
        .filter(Boolean),
    };
  } catch {
    return null;
  }
}

/** Count the items returned by a `?all=1` list endpoint. */
async function countResource(endpoint: string): Promise<number> {
  try {
    const res = await apiFetch<unknown>(endpoint, { query: { all: 1 } });
    const list = unwrap<unknown[]>(res, []);
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Resource usage (cameras / branches).
 *
 * Parity with the OLD dashboard, which derived usage from real data and never
 * called a dedicated usage endpoint:
 *   used  = number of items in /customer/cameras?all=1 and /customer/branches?all=1
 *   total = package.max_cameras / package.max_branches (from /subscriptions/current)
 *
 * The previous implementation probed /customer/subscriptions/usage first, but
 * that endpoint does not exist on the backend and returned 404 on every load.
 * We now compute usage the same way the old project did.
 */
export async function fetchUsage(): Promise<ResourceUsage> {
  try {
    const [camerasCount, branchesCount] = await Promise.all([
      countResource(endpoints.cameras.list),
      countResource(endpoints.organization.branches),
    ]);

    let maxCameras = 50;
    let maxBranches = 50;
    try {
      const res = await apiFetch<Record<string, unknown>>(
        endpoints.subscription.current
      );
      const data = (res?.data as Record<string, unknown>) ?? res ?? {};
      const pkg = (data.package ?? {}) as Record<string, unknown>;
      maxCameras = asNumber(pkg.max_cameras, 50);
      maxBranches = asNumber(pkg.max_branches, 50);
    } catch {
      // keep defaults
    }

    return {
      cameras: { used: camerasCount, total: maxCameras || 50 },
      branches: { used: branchesCount, total: maxBranches || 50 },
    };
  } catch {
    return {
      cameras: { used: 0, total: 50 },
      branches: { used: 0, total: 50 },
    };
  }
}

export async function fetchTransactions(): Promise<BillingTransaction[]> {
  try {
    const res = await apiFetch<unknown>(endpoints.subscription.transactions, {
      query: { all: 1 },
    });
    const list = unwrap<Array<Record<string, unknown>>>(res, []);
    return list.map((t) => ({
      id: String(t.id ?? ""),
      date: String(t.date ?? t.created_at ?? ""),
      type: (t.type as BillingTransaction["type"]) ?? "payment",
      package_name: String(
        t.package_name ?? t.package?.["name" as keyof typeof t.package] ?? "—"
      ),
      amount: asNumber(t.amount ?? t.total ?? 0),
      currency: String(t.currency ?? "SAR"),
      status: (t.status as BillingTransaction["status"]) ?? "pending",
      method: t.method ? String(t.method) : undefined,
      period_from: t.period_from ? String(t.period_from) : undefined,
      period_to: t.period_to ? String(t.period_to) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function fetchAvailableServices(): Promise<AvailableService[]> {
  try {
    const res = await apiFetch<unknown>(
      endpoints.subscription.availableServices,
      {
        query: { all: 1 },
      }
    );
    const list = unwrap<Array<Record<string, unknown>>>(res, []);
    return list.map((s) => ({
      id: String(s.id ?? ""),
      name: String(s.name ?? s.title ?? s.name_en ?? "—"),
      name_ar: s.name_ar ? String(s.name_ar) : undefined,
      price: s.price !== undefined ? asNumber(s.price) : undefined,
      included: Boolean(s.included),
    }));
  } catch {
    return [];
  }
}

/**
 * Extract a Fatoorah checkout URL from an API response payload, regardless of
 * which field name the backend used. Mirrors the OLD project, which redirected
 * the user to `payment_link` after subscribe / add-service / renew.
 */
function extractPaymentLink(raw: unknown): string | null {
  if (!raw) return null;
  const data = ((raw as Record<string, unknown>)?.data ?? raw) as Record<
    string,
    unknown
  > | null;
  if (!data) return null;
  return (
    (data.payment_link as string) ??
    (data.payment_url as string) ??
    (data.checkout_url as string) ??
    null
  );
}

export interface AddServicesResult {
  ok: boolean;
  payment_link: string | null;
  /** Server-provided error message when ok is false (for a useful toast). */
  error?: string;
}

export async function addServices(
  serviceIds: string[]
): Promise<AddServicesResult> {
  try {
    // The backend expects multipart form-data with an array field
    // `service_ids[]` (see the Postman collection: POST add-service uses
    // formdata `service_ids`, and the rest of this app posts Laravel-style
    // indexed arrays — e.g. rolesService's `permission_ids[i]`). The previous
    // code sent a JSON body `{ service_ids: [...] }`, which Laravel does not
    // bind to the expected `service_ids` array, so the request failed
    // validation and the user could never add a service.
    const fd = new FormData();
    serviceIds.forEach((id, i) => {
      fd.append(`service_ids[${i}]`, id);
    });

    const raw = await apiFetch<Record<string, unknown>>(
      endpoints.subscription.addServices,
      {
        method: "POST",
        body: fd,
      }
    );
    // Parity: the OLD AddServiceDialog opened `data.payment_link` (Fatoorah
    // checkout) in a new tab when present. Surface it so the caller can do the
    // same instead of silently swallowing it.
    return { ok: true, payment_link: extractPaymentLink(raw) };
  } catch (e) {
    return {
      ok: false,
      payment_link: null,
      error: e instanceof Error ? e.message : undefined,
    };
  }
}

export interface SubscribeResult {
  payment_link: string | null;
}

/**
 * POST /customer/subscriptions/renew
 *
 * Mirrors the OLD renew flow. Like subscribe, the backend may return a
 * `payment_link` (Fatoorah checkout) which the caller should open in a new tab.
 */
export async function renewSubscription(): Promise<SubscribeResult> {
  const raw = await apiFetch<Record<string, unknown>>(
    endpoints.subscription.renew,
    { method: "POST" }
  );
  return { payment_link: extractPaymentLink(raw) };
}

/**
 * POST /customer/subscriptions/subscribe { package_id }
 *
 * Mirrors the old project's subscribeToPackage thunk.
 * The API returns the subscription object which may include a `payment_link`
 * (Fatoorah checkout URL). When present the caller should open it in a new
 * tab (window.open) so the user can complete payment, then redirect to /dashboard.
 */
export async function subscribeToPackage(
  packageId: string
): Promise<SubscribeResult> {
  const raw = await apiFetch<Record<string, unknown>>(
    endpoints.subscription.subscribe,
    {
      method: "POST",
      body: { package_id: packageId },
    }
  );
  return { payment_link: extractPaymentLink(raw) };
}
