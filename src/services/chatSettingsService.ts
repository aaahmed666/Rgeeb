import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface WhatsappSettings {
  enabled: boolean;
  phone_number: string;
  language: "ar" | "en";
  daily_reports: boolean;
  weekly_reports: boolean;
  realtime_alerts: boolean;
}

export interface SmartAlerts {
  ppe_violations_window_minutes: number; // 1-20
  visitor_drop_percentage: number; // 10-90
  minimum_traffic_baseline: number; // visitors
  wait_time_minutes: number; // 1-30
}

export interface ChatSettings {
  whatsapp: WhatsappSettings;
  alerts: SmartAlerts;
}

export const DEFAULT_ALERTS: SmartAlerts = {
  ppe_violations_window_minutes: 5,
  visitor_drop_percentage: 50,
  minimum_traffic_baseline: 10,
  wait_time_minutes: 10,
};

const demoSettings: ChatSettings = {
  whatsapp: {
    enabled: false,
    phone_number: "",
    language: "ar",
    daily_reports: false,
    weekly_reports: false,
    realtime_alerts: true,
  },
  alerts: { ...DEFAULT_ALERTS },
};

// Shape returned by GET /api/customer/chat/settings
interface ApiChatSettings {
  enabled: boolean;
  phoneNumber: string;
  notificationLanguage: "ar" | "en";
  dailyReports: boolean;
  weeklyReports: boolean;
  alerts: boolean; // maps to realtime_alerts
  alertThresholds: {
    ppeSurge: number;
    visitorDrop: number;
    minTraffic: number;
    waitTime: number;
  };
}

function mapApiResponse(raw: ApiChatSettings): ChatSettings {
  return {
    whatsapp: {
      enabled: raw.enabled,
      phone_number: raw.phoneNumber,
      language: raw.notificationLanguage,
      daily_reports: raw.dailyReports,
      weekly_reports: raw.weeklyReports,
      realtime_alerts: raw.alerts,
    },
    alerts: {
      ppe_violations_window_minutes:
        raw.alertThresholds?.ppeSurge ??
        DEFAULT_ALERTS.ppe_violations_window_minutes,
      visitor_drop_percentage:
        raw.alertThresholds?.visitorDrop ??
        DEFAULT_ALERTS.visitor_drop_percentage,
      minimum_traffic_baseline:
        raw.alertThresholds?.minTraffic ??
        DEFAULT_ALERTS.minimum_traffic_baseline,
      wait_time_minutes:
        raw.alertThresholds?.waitTime ?? DEFAULT_ALERTS.wait_time_minutes,
    },
  };
}

// Maps the internal ChatSettings shape to the payload the
// POST /customer/chat/settings endpoint expects. The backend uses the SAME
// field names it returns from GET (enabled, phoneNumber, notificationLanguage,
// dailyReports, weeklyReports, alerts, alertThresholds.*) — see the Postman
// collection. Sending snake_case keys (whatsapp_enabled, …) silently no-ops,
// so the round-trip must use these exact names. Only present fields are sent
// so partial updates stay partial.
function toApiRequest(body: Partial<ChatSettings>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const w = body.whatsapp;
  if (w) {
    if (w.enabled !== undefined) out.enabled = w.enabled;
    if (w.phone_number !== undefined) out.phoneNumber = w.phone_number;
    if (w.language !== undefined) out.notificationLanguage = w.language;
    if (w.daily_reports !== undefined) out.dailyReports = w.daily_reports;
    if (w.weekly_reports !== undefined) out.weeklyReports = w.weekly_reports;
    if (w.realtime_alerts !== undefined) out.alerts = w.realtime_alerts;
  }
  const a = body.alerts;
  if (a) {
    const thresholds: Record<string, number> = {};
    if (a.ppe_violations_window_minutes !== undefined)
      thresholds.ppeSurge = a.ppe_violations_window_minutes;
    if (a.visitor_drop_percentage !== undefined)
      thresholds.visitorDrop = a.visitor_drop_percentage;
    if (a.minimum_traffic_baseline !== undefined)
      thresholds.minTraffic = a.minimum_traffic_baseline;
    if (a.wait_time_minutes !== undefined)
      thresholds.waitTime = a.wait_time_minutes;
    if (Object.keys(thresholds).length) out.alertThresholds = thresholds;
  }
  return out;
}

async function safe<T>(p: Promise<T>, fb: T): Promise<T> {
  try {
    const result = await p;
    return result ?? fb;
  } catch {
    return fb;
  }
}

function unwrap<T>(r: T | { data: T }): T {
  const unwrapped =
    r && typeof r === "object" && "data" in (r as object)
      ? (r as { data: T }).data
      : r;
  if (unwrapped == null) throw new Error("Empty response");
  return unwrapped as T;
}

export const chatSettingsService = {
  get: () =>
    safe(
      apiFetch<ApiChatSettings | { data: ApiChatSettings }>(
        endpoints.chatSettings.settings
      )
        .then(unwrap)
        .then(mapApiResponse),
      demoSettings
    ),
  update: (body: Partial<ChatSettings>) =>
    apiFetch<{ success: boolean } | ChatSettings | { data: ChatSettings }>(
      endpoints.chatSettings.settings,
      // Backend route only accepts POST (PUT returns 405 MethodNotAllowed).
      // It also expects flat snake_case fields, not the internal
      // { whatsapp, alerts } shape, so map before sending.
      { method: "POST", body: toApiRequest(body) }
    ),
  sendTest: (phone: string, language: string) =>
    apiFetch<{ success: boolean }>(endpoints.chatSettings.testWhatsapp, {
      method: "POST",
      // Postman "test whatsapp" expects `phoneNumber` (not phone_number).
      body: { phoneNumber: phone, notificationLanguage: language },
    }),
};
