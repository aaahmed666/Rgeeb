/**
 * notificationSettingsService.ts
 *
 * Backend contract (matches the working legacy project):
 *   GET    /customer/notification-settings              → { data: NotificationChannelSetting[] }
 *   POST   /customer/notification-settings              → one call PER CHANNEL with:
 *            { channel, enabled, config, alert_types, cooldown_minutes,
 *              quiet_hours_start, quiet_hours_end }
 *   POST   /customer/notification-settings/test         → { channel }
 *   POST   /customer/notification-settings/verify-telegram → { bot_token, chat_id }
 *   DELETE /customer/notification-settings/:id
 *
 * The backend VALIDATES `channel` and `config` as required on every save POST.
 * Channel-specific data lives inside `config`:
 *   telegram → { bot_token, chat_id, summary_enabled, summary_interval_minutes,
 *                wait_violation_enabled, wait_violation_minutes }
 *   email    → { recipients }
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

/** Raw per-channel record as returned by the backend list endpoint. */
interface ChannelConfig {
  bot_token?: string;
  chat_id?: string;
  recipients?: string[];
  summary_enabled?: boolean;
  summary_interval_minutes?: number;
  wait_violation_enabled?: boolean;
  wait_violation_minutes?: number;
}
interface NotificationChannelSetting {
  id?: number;
  channel: "telegram" | "email";
  enabled: boolean;
  config: ChannelConfig;
  alert_types: string[] | null;
  cooldown_minutes: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
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

/**
 * Accepts either:
 *  - the legacy array of per-channel settings (preferred / real backend), or
 *  - a flat object already shaped like NotificationSettings (tolerated).
 */
function mapSettings(
  raw: unknown
): NotificationSettings {
  if (!raw) return DEFAULTS;

  // Array of channel settings → merge telegram + email into the flat UI shape.
  if (Array.isArray(raw)) {
    const list = raw as Array<Record<string, unknown>>;
    const tg = list.find((x) => x.channel === "telegram");
    const em = list.find((x) => x.channel === "email");
    const tgCfg = (tg?.config ?? {}) as ChannelConfig;
    const emCfg = (em?.config ?? {}) as ChannelConfig;

    // Shared scheduling fields come from whichever channel record exists.
    const shared = tg ?? em ?? {};
    const sharedAlertTypes = (shared.alert_types as string[] | null | undefined) ?? null;

    return {
      telegramEnabled:     b(tg?.enabled),
      telegramBotToken:    s(tgCfg.bot_token),
      telegramChatId:      s(tgCfg.chat_id),
      telegramVerified:    Boolean(tg),
      emailEnabled:        b(em?.enabled),
      emailRecipients:     arr(emCfg.recipients),
      allAlertTypes:       !sharedAlertTypes || sharedAlertTypes.length === 0,
      alertTypes:          arr(sharedAlertTypes),
      cooldownMinutes:     Number(shared.cooldown_minutes ?? 5) || 5,
      quietHoursStart:     s(shared.quiet_hours_start),
      quietHoursEnd:       s(shared.quiet_hours_end),
      deliverySummary:     b(tgCfg.summary_enabled),
      waitViolationAlerts: b(tgCfg.wait_violation_enabled, true),
    };
  }

  // Flat object fallback.
  const r = raw as Record<string, unknown>;
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
    (res as { data?: unknown })?.data ??
    (res as unknown) ??
    null;
  return mapSettings(data);
}

/**
 * Build the per-channel POST body the backend expects.
 * `channel` and `config` are REQUIRED — this is what the old project sends.
 */
function buildTelegramBody(f: NotificationSettings): NotificationChannelSetting {
  return {
    channel: "telegram",
    enabled: f.telegramEnabled,
    config: {
      bot_token: f.telegramBotToken,
      chat_id: f.telegramChatId,
      summary_enabled: f.deliverySummary,
      summary_interval_minutes: 30,
      wait_violation_enabled: f.waitViolationAlerts,
      wait_violation_minutes: 5,
    },
    alert_types: f.allAlertTypes ? null : f.alertTypes,
    cooldown_minutes: f.cooldownMinutes,
    quiet_hours_start: f.quietHoursStart || null,
    quiet_hours_end: f.quietHoursEnd || null,
  };
}

function buildEmailBody(f: NotificationSettings): NotificationChannelSetting {
  return {
    channel: "email",
    enabled: f.emailEnabled,
    config: {
      recipients: f.emailRecipients,
    },
    alert_types: f.allAlertTypes ? null : f.alertTypes,
    cooldown_minutes: f.cooldownMinutes,
    quiet_hours_start: f.quietHoursStart || null,
    quiet_hours_end: f.quietHoursEnd || null,
  };
}

/**
 * Saves notification settings. Because each channel is a separate backend
 * record, we issue one POST per channel that the patch touches.
 *
 * A patch coming from a single "Save Telegram" / "Save Email" button only has
 * that channel's fields; the "Save All" button passes the full object. We
 * detect which channels to write by which fields are present, and merge the
 * patch onto current settings so each `config` is complete.
 */
export async function updateNotificationSettings(
  patch: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  // Merge patch onto current state so every config we POST is complete.
  const current = await fetchNotificationSettings();
  const merged: NotificationSettings = { ...current, ...patch };

  const touchesTelegram =
    patch.telegramEnabled !== undefined ||
    patch.telegramBotToken !== undefined ||
    patch.telegramChatId !== undefined ||
    patch.deliverySummary !== undefined ||
    patch.waitViolationAlerts !== undefined;

  const touchesEmail =
    patch.emailEnabled !== undefined ||
    patch.emailRecipients !== undefined;

  const touchesShared =
    patch.allAlertTypes !== undefined ||
    patch.alertTypes !== undefined ||
    patch.cooldownMinutes !== undefined ||
    patch.quietHoursStart !== undefined ||
    patch.quietHoursEnd !== undefined;

  const calls: Promise<unknown>[] = [];

  // Shared fields live on both channel records, so a shared-only change must
  // write both channels to stay consistent (mirrors legacy behaviour).
  if (touchesTelegram || touchesShared) {
    calls.push(
      apiFetch(endpoints.notificationSettings.update, {
        method: "POST",
        body: buildTelegramBody(merged) as unknown as Record<string, unknown>,
      })
    );
  }
  if (touchesEmail || touchesShared) {
    calls.push(
      apiFetch(endpoints.notificationSettings.update, {
        method: "POST",
        body: buildEmailBody(merged) as unknown as Record<string, unknown>,
      })
    );
  }

  if (calls.length === 0) {
    return current;
  }

  await Promise.all(calls);
  return fetchNotificationSettings();
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

/**
 * POST /customer/notification-settings/verify-telegram { bot_token, chat_id }
 * Credentials are optional so existing call sites (verifyMut.mutate()) keep
 * working; when omitted the caller is expected to have already persisted them.
 */
export async function verifyTelegram(
  creds?: { botToken: string; chatId: string }
): Promise<void> {
  const body = creds
    ? { bot_token: creds.botToken, chat_id: creds.chatId }
    : undefined;
  await apiFetch(endpoints.notificationSettings.verifyTelegram, {
    method: "POST",
    ...(body ? { body } : {}),
  });
}

export async function sendTestTelegram(): Promise<void> {
  await testNotificationChannel("telegram");
}

export async function sendTestEmail(_email: string): Promise<void> {
  // Backend test route keys off the channel; recipients come from saved config.
  await testNotificationChannel("email");
}
