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
      { method: "PUT", body }
    ),
  sendTest: (phone: string, language: string) =>
    apiFetch<{ success: boolean }>(endpoints.chatSettings.testWhatsapp, {
      method: "POST",
      body: { phone_number: phone, language },
    }),
};
