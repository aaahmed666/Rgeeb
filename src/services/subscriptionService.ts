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

export async function fetchSubscription(): Promise<SubscriptionDetails | null> {
  try {
    const res = await apiFetch<Record<string, unknown>>(
      endpoints.subscription.current
    );
    const data = (res?.data as Record<string, unknown>) ?? res;
    if (!data) return null;
    const services = Array.isArray(data.services)
      ? (data.services as unknown[])
      : [];
    return {
      id: String(data.id ?? ""),
      package_name: String(data.package_name ?? data.name ?? "—"),
      status: (data.status as SubscriptionDetails["status"]) ?? "active",
      price: asNumber(data.price ?? data.total ?? 0),
      currency: String(data.currency ?? "SAR"),
      duration_months: asNumber(data.duration_months ?? data.months ?? 0),
      start_date: String(data.start_date ?? data.starts_at ?? ""),
      end_date: String(data.end_date ?? data.expires_at ?? ""),
      days_remaining: asNumber(
        data.days_remaining ??
          daysBetween(
            String(data.start_date ?? ""),
            String(data.end_date ?? "")
          )
      ),
      services: services.map((s) =>
        typeof s === "string"
          ? s
          : String(
              (s as Record<string, unknown>)?.name ??
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

export async function fetchUsage(): Promise<ResourceUsage> {
  try {
    const res = await apiFetch<Record<string, unknown>>(
      endpoints.subscription.usage
    );
    const data = (res?.data as Record<string, unknown>) ?? res ?? {};
    const cameras = (data.cameras ?? {}) as Record<string, unknown>;
    const branches = (data.branches ?? {}) as Record<string, unknown>;
    return {
      cameras: {
        used: asNumber(cameras.used),
        total: asNumber(cameras.total ?? cameras.limit, 50),
      },
      branches: {
        used: asNumber(branches.used),
        total: asNumber(branches.total ?? branches.limit, 50),
      },
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

export async function addServices(serviceIds: string[]): Promise<boolean> {
  try {
    await apiFetch(endpoints.subscription.services, {
      method: "POST",
      body: { service_ids: serviceIds },
    });
    return true;
  } catch {
    return false;
  }
}

export interface SubscribeResult {
  payment_link: string | null;
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
  const data = (raw?.data ?? raw) as Record<string, unknown> | null;
  const payment_link =
    (data?.payment_link as string) ??
    (data?.payment_url as string) ??
    (data?.checkout_url as string) ??
    null;
  return { payment_link };
}
