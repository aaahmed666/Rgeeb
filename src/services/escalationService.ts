/**
 * Escalation & Notifications service — wraps the
 * /customer/task-notifications/* endpoints used by the
 * Escalation & Alerts page.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import {
  pickArray as _pickArr,
  str,
  bool,
  id,
  type RawObject,
} from "@/lib/raw-response";

export interface EscalationRule {
  id: string;
  level: "L1" | "L2" | "L3" | string;
  name: string;
  trigger: string; // e.g. "+15 min"
  action: string; // e.g. "Remind Worker"
  actionType?: string;
  active: boolean;
}

/** Payload for create/update — matches the backend save-rule contract. */
export interface EscalationRuleInput {
  id?: string | number;
  name: string;
  level: number;
  trigger_minutes: number;
  action: string;
  enabled: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  level?: string;
  read?: boolean;
  createdAt?: string;
  type?: string;
}

export interface EscalationLogItem {
  id: string;
  taskId?: string;
  taskTitle?: string;
  level?: string;
  action?: string;
  triggeredAt?: string;
  status?: string;
  recipient?: string;
}

function pickArray(raw: unknown): RawObject[] {
  // Supplement the shared helper with the notifications-specific key.
  if (Array.isArray(raw)) return raw as RawObject[];
  const r = raw as RawObject | undefined;
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data as RawObject[];
  const nested = r.data as RawObject | undefined;
  if (nested && Array.isArray(nested.data)) return nested.data as RawObject[];
  if (Array.isArray(r.items)) return r.items as RawObject[];
  if (Array.isArray(r.results)) return r.results as RawObject[];
  // /customer/task-notifications returns { notifications: [], unread_count: N }
  if (Array.isArray(r.notifications)) return r.notifications as RawObject[];
  return _pickArr(raw);
}

function mapRule(r: RawObject): EscalationRule {
  const minutes =
    r.trigger_minutes ?? r.triggerMinutes ?? r.minutes ?? r.delay_minutes;
  const trigger =
    str(r, "trigger") ??
    (minutes != null ? `+${minutes} min` : (str(r, "trigger_label") ?? ""));
  return {
    id: id(r),
    level: str(r, "level", "severity") ?? "L1",
    name: str(r, "name", "title", "description") ?? "",
    trigger,
    action:
      str(r, "action_label", "actionLabel", "action", "action_type") ?? "",
    actionType: str(r, "action_type", "actionType"),
    active: bool(r, "active", "is_active", "enabled"),
  };
}

function mapNotification(n: RawObject): NotificationItem {
  return {
    id: id(n),
    title: str(n, "title", "subject", "message") ?? "Notification",
    body: str(n, "body", "message", "description") ?? "",
    level: str(n, "level", "severity", "priority"),
    read: Boolean(n.read ?? n.is_read ?? n.read_at),
    createdAt: str(n, "created_at", "createdAt", "timestamp"),
    type: str(n, "type"),
  };
}

function mapLog(l: RawObject): EscalationLogItem {
  const task = l.task as RawObject | undefined;
  return {
    id: id(l),
    taskId: str(l, "task_id", "taskId"),
    taskTitle:
      str(l, "task_title", "taskTitle") ?? (task && str(task, "title")),
    level: str(l, "level", "severity"),
    action: str(l, "action", "action_label"),
    triggeredAt: str(l, "triggered_at", "created_at", "createdAt"),
    status: str(l, "status"),
    recipient: str(l, "recipient", "assigned_to", "user"),
  };
}

export const escalationService = {
  async rules(): Promise<EscalationRule[]> {
    const r = await api.get<unknown>(endpoints.escalation.rules);
    return pickArray(r).map(mapRule);
  },
  /**
   * Create or update an escalation rule (also used to toggle `enabled`).
   * Mirrors the OLD production contract: POST /customer/escalation/save-rule
   * with { id?, name, level, trigger_minutes, action, enabled }. Passing an
   * `id` updates the existing rule; omitting it creates a new one.
   *
   * NOTE: there is no PATCH /escalation/rules/{id} endpoint (it 404s) — the
   * toggle goes through this save-rule call with the full rule payload.
   */
  async saveRule(input: EscalationRuleInput) {
    return api.post(endpoints.escalation.saveRule, input);
  },
  async deleteRule(id: string) {
    try {
      return await api.delete(endpoints.escalation.rule(id));
    } catch {
      // OLD production contract fallback: POST /customer/escalation/delete-rule { id }
      return api.post(endpoints.escalation.legacyDeleteRule, { id });
    }
  },
  async notifications(perPage = 20): Promise<NotificationItem[]> {
    const r = await api.get<unknown>(endpoints.notifications.list, {
      query: { per_page: perPage },
    });
    return pickArray(r).map(mapNotification);
  },
  async unreadCount(): Promise<number> {
    const r = await api.get<unknown>(endpoints.notifications.unreadCount);
    if (typeof r === "object" && r !== null) {
      const obj = r as Record<string, unknown>;
      const nested = obj.data as Record<string, unknown> | undefined;
      return Number(obj.count ?? nested?.count ?? obj.unread ?? 0);
    }
    return 0;
  },
  async log(): Promise<EscalationLogItem[]> {
    const r = await api.get<unknown>(endpoints.escalation.log);
    return pickArray(r).map(mapLog);
  },
  async markAllRead() {
    return api.post(`${endpoints.notifications.list}/mark-all-read`, {});
  },
};
