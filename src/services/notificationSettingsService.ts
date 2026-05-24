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
    telegramEnabled: b(r.telegram_enabled ?? r.telegramEnabled),
    telegramBotToken: s(r.telegram_bot_token ?? r.telegramBotToken),
    telegramChatId: s(r.telegram_chat_id ?? r.telegramChatId),
    telegramVerified: b(r.telegram_verified ?? r.telegramVerified),
    emailEnabled: b(r.email_enabled ?? r.emailEnabled),
    emailRecipients: arr(r.email_recipients ?? r.emailRecipients),
    allAlertTypes: b(r.all_alert_types ?? r.allAlertTypes ?? true, true),
    alertTypes: arr(r.alert_types ?? r.alertTypes),
    cooldownMinutes: Number(r.cooldown_minutes ?? r.cooldownMinutes ?? 5) || 5,
    quietHoursStart: s(r.quiet_hours_start ?? r.quietHoursStart),
    quietHoursEnd: s(r.quiet_hours_end ?? r.quietHoursEnd),
    deliverySummary: b(r.delivery_summary ?? r.deliverySummary),
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

export async function updateNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const payload: Record<string, unknown> = {};
  if (patch.telegramEnabled !== undefined) payload.telegram_enabled = patch.telegramEnabled;
  if (patch.telegramBotToken !== undefined) payload.telegram_bot_token = patch.telegramBotToken;
  if (patch.telegramChatId !== undefined) payload.telegram_chat_id = patch.telegramChatId;
  if (patch.emailEnabled !== undefined) payload.email_enabled = patch.emailEnabled;
  if (patch.emailRecipients !== undefined) payload.email_recipients = patch.emailRecipients;
  if (patch.allAlertTypes !== undefined) payload.all_alert_types = patch.allAlertTypes;
  if (patch.alertTypes !== undefined) payload.alert_types = patch.alertTypes;
  if (patch.cooldownMinutes !== undefined) payload.cooldown_minutes = patch.cooldownMinutes;
  if (patch.quietHoursStart !== undefined) payload.quiet_hours_start = patch.quietHoursStart;
  if (patch.quietHoursEnd !== undefined) payload.quiet_hours_end = patch.quietHoursEnd;
  if (patch.deliverySummary !== undefined) payload.delivery_summary = patch.deliverySummary;
  if (patch.waitViolationAlerts !== undefined)
    payload.wait_violation_alerts = patch.waitViolationAlerts;

  const res = await apiFetch<unknown>(endpoints.notificationSettings.update, {
    method: "POST",
    body: payload,
  });
  const data =
    (res as { data?: Record<string, unknown> })?.data ??
    (res as Record<string, unknown>) ??
    null;
  return mapSettings(data);
}

export async function verifyTelegram(): Promise<void> {
  await apiFetch(endpoints.notificationSettings.verifyTelegram, { method: "POST" });
}

export async function sendTestTelegram(): Promise<void> {
  await apiFetch(endpoints.notificationSettings.testTelegram, { method: "POST" });
}

export async function sendTestEmail(email: string): Promise<void> {
  await apiFetch(endpoints.notificationSettings.testEmail, {
    method: "POST",
    body: { email },
  });
}
