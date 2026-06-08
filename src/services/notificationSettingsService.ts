/**
 * notificationSettingsService.ts
 *
 * Postman spec:
 *   GET  /customer/notification-settings         → list settings
 *   POST /customer/notification-settings         → { channel, enabled }
 *   POST /customer/notification-settings/test    → { channel }
 *
 * FIX: updateNotificationSettings now sends { channel, enabled } per Postman.
 *      We still maintain the rich frontend state shape for the UI, but the
 *      actual API calls use the minimal { channel, enabled } format.
 */
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface NotificationSettings {
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramVerified: boolean;
  emailEnabled: boolean;
  emailRecipients: string[];
  allAlertTypes: boolean;
  alertTypes: string[];
  cooldownMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  deliverySummary: boolean;
  waitViolationAlerts: boolean;
}

const DEFAULTS: NotificationSettings = {
  telegramEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
  telegramVerified: false,
  emailEnabled: false,
  emailRecipients: [],
  allAlertTypes: true,
  alertTypes: [],
  cooldownMinutes: 5,
  quietHoursStart: "",
  quietHoursEnd: "",
  deliverySummary: false,
  waitViolationAlerts: false,
};

function s(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}
function b(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return fallback;
}
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v) return v.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function mapSettings(r: Record<string, unknown> | null | undefined): NotificationSettings {
  if (!r) return DEFAULTS;
  return {
    telegramEnabled:    b(r.telegram_enabled ?? r.telegramEnabled),
    telegramBotToken:   s(r.telegram_bot_token ?? r.telegramBotToken),
    telegramChatId:     s(r.telegram_chat_id ?? r.telegramChatId),
    telegramVerified:   b(r.telegram_verified ?? r.telegramVerified),
    emailEnabled:       b(r.email_enabled ?? r.emailEnabled),
    emailRecipients:    arr(r.email_recipients ?? r.emailRecipients),
    allAlertTypes:      b(r.all_alert_types ?? r.allAlertTypes ?? true, true),
    alertTypes:         arr(r.alert_types ?? r.alertTypes),
    cooldownMinutes:    Number(r.cooldown_minutes ?? r.cooldownMinutes ?? 5) || 5,
    quietHoursStart:    s(r.quiet_hours_start ?? r.quietHoursStart),
    quietHoursEnd:      s(r.quiet_hours_end ?? r.quietHoursEnd),
    deliverySummary:    b(r.delivery_summary ?? r.deliverySummary),
    waitViolationAlerts: b(r.wait_violation_alerts ?? r.waitViolationAlerts),
  };
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await apiFetch<unknown>(endpoints.notificationSettings.get);
  const data =
    (res as { data?: Record<string, unknown> })?.data ??
    (res as Record<string, unknown>) ??
    null;
  return mapSettings(data);
}

/**
 * POST /customer/notification-settings { channel, enabled }
 * Postman uses simple { channel, enabled } format.
 * We accept a patch object and translate to one call per changed channel.
 */
export async function updateNotificationSettings(
  patch: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  // Map rich patch → array of { channel, enabled } calls
  const calls: Promise<unknown>[] = [];

  if (patch.telegramEnabled !== undefined) {
    calls.push(
      apiFetch(endpoints.notificationSettings.update, {
        method: "POST",
        body: { channel: "telegram", enabled: patch.telegramEnabled },
      })
    );
  }
  if (patch.emailEnabled !== undefined) {
    calls.push(
      apiFetch(endpoints.notificationSettings.update, {
        method: "POST",
        body: { channel: "email", enabled: patch.emailEnabled },
      })
    );
  }
  // For fields beyond enabled/disabled (bot_token, chat_id, etc.)
  // send as-is using the same endpoint — backend may accept extended body
  const extra: Record<string, unknown> = {};
  if (patch.telegramBotToken !== undefined) extra.telegram_bot_token = patch.telegramBotToken;
  if (patch.telegramChatId   !== undefined) extra.telegram_chat_id   = patch.telegramChatId;
  if (patch.emailRecipients  !== undefined) extra.email_recipients    = patch.emailRecipients;
  if (patch.allAlertTypes    !== undefined) extra.all_alert_types     = patch.allAlertTypes;
  if (patch.alertTypes       !== undefined) extra.alert_types         = patch.alertTypes;
  if (patch.cooldownMinutes  !== undefined) extra.cooldown_minutes    = patch.cooldownMinutes;
  if (patch.quietHoursStart  !== undefined) extra.quiet_hours_start   = patch.quietHoursStart;
  if (patch.quietHoursEnd    !== undefined) extra.quiet_hours_end     = patch.quietHoursEnd;
  if (patch.deliverySummary  !== undefined) extra.delivery_summary    = patch.deliverySummary;
  if (patch.waitViolationAlerts !== undefined) extra.wait_violation_alerts = patch.waitViolationAlerts;

  if (Object.keys(extra).length > 0) {
    calls.push(
      apiFetch(endpoints.notificationSettings.update, {
        method: "POST",
        body: extra,
      })
    );
  }

  if (calls.length === 0) {
    return fetchNotificationSettings();
  }

  const results = await Promise.allSettled(calls);
  // Use the last successful response for state refresh
  const lastOk = [...results].reverse().find((r) => r.status === "fulfilled");
  const data =
    lastOk?.status === "fulfilled"
      ? ((lastOk.value as { data?: Record<string, unknown> })?.data ??
         (lastOk.value as Record<string, unknown>) ??
         null)
      : null;

  return data ? mapSettings(data) : fetchNotificationSettings();
}

/**
 * POST /customer/notification-settings/test { channel }
 */
export async function testNotificationChannel(channel: "telegram" | "email"): Promise<void> {
  await apiFetch(endpoints.notificationSettings.test, {
    method: "POST",
    body: { channel },
  });
}

// Legacy helpers kept for backward-compat with NotificationSettingsView
export async function verifyTelegram(): Promise<void> {
  await apiFetch(endpoints.notificationSettings.verifyTelegram, { method: "POST" });
}

export async function sendTestTelegram(): Promise<void> {
  await testNotificationChannel("telegram");
}

export async function sendTestEmail(email: string): Promise<void> {
  await apiFetch(endpoints.notificationSettings.testEmail, {
    method: "POST",
    body: { email, channel: "email" },
  });
}
