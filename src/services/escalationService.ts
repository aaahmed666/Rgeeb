/**
 * Escalation & Notifications service — wraps the
 * /customer/task-notifications/* endpoints used by the
 * Escalation & Alerts page.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface EscalationRule {
  id: string;
  level: "L1" | "L2" | "L3" | string;
  name: string;
  trigger: string; // e.g. "+15 min"
  action: string; // e.g. "Remind Worker"
  actionType?: string;
  active: boolean;
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

function pickArray(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as any;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  if (Array.isArray(r?.items)) return r.items;
  if (Array.isArray(r?.results)) return r.results;
  // /customer/task-notifications returns { notifications: [], unread_count: N }
  if (Array.isArray(r?.notifications)) return r.notifications;
  return [];
}

function mapRule(r: any): EscalationRule {
  const minutes =
    r.trigger_minutes ?? r.triggerMinutes ?? r.minutes ?? r.delay_minutes;
  const trigger =
    r.trigger ??
    (minutes != null ? `+${minutes} min` : (r.trigger_label ?? ""));
  return {
    id: String(r.id ?? r._id ?? crypto.randomUUID()),
    level: r.level ?? r.severity ?? "L1",
    name: r.name ?? r.title ?? r.description ?? "",
    trigger,
    action: r.action_label ?? r.actionLabel ?? r.action ?? r.action_type ?? "",
    actionType: r.action_type ?? r.actionType,
    active: Boolean(r.active ?? r.is_active ?? r.enabled ?? false),
  };
}

function mapNotification(n: any): NotificationItem {
  return {
    id: String(n.id ?? n._id ?? crypto.randomUUID()),
    title: n.title ?? n.subject ?? n.message ?? "Notification",
    body: n.body ?? n.message ?? n.description ?? "",
    level: n.level ?? n.severity ?? n.priority,
    read: Boolean(n.read ?? n.is_read ?? n.read_at),
    createdAt: n.created_at ?? n.createdAt ?? n.timestamp,
    type: n.type,
  };
}

function mapLog(l: any): EscalationLogItem {
  return {
    id: String(l.id ?? l._id ?? crypto.randomUUID()),
    taskId: l.task_id ?? l.taskId,
    taskTitle: l.task_title ?? l.taskTitle ?? l.task?.title,
    level: l.level ?? l.severity,
    action: l.action ?? l.action_label,
    triggeredAt: l.triggered_at ?? l.created_at ?? l.createdAt,
    status: l.status,
    recipient: l.recipient ?? l.assigned_to ?? l.user,
  };
}

export const escalationService = {
  async rules(): Promise<EscalationRule[]> {
    const r = await api.get<unknown>(endpoints.escalation.rules);
    return pickArray(r).map(mapRule);
  },
  async toggleRule(id: string, active: boolean) {
    return api.patch(endpoints.escalation.rule(id), { active });
  },
  async deleteRule(id: string) {
    return api.delete(endpoints.escalation.rule(id));
  },
  async notifications(perPage = 20): Promise<NotificationItem[]> {
    const r = await api.get<unknown>(endpoints.escalation.notifications, {
      query: { per_page: perPage },
    });
    return pickArray(r).map(mapNotification);
  },
  async unreadCount(): Promise<number> {
    const r = await api.get<any>(endpoints.escalation.unreadCount);
    return Number(r?.count ?? r?.data?.count ?? r?.unread ?? 0);
  },
  async log(): Promise<EscalationLogItem[]> {
    const r = await api.get<unknown>(endpoints.escalation.log);
    return pickArray(r).map(mapLog);
  },
  async markAllRead() {
    return api.post(`${endpoints.escalation.notifications}/mark-all-read`, {});
  },
};
