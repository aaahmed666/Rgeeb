"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Send, Mail, Plus, X, Loader2, CheckCircle2, AlertTriangle, Moon, Clock, Truck, TimerReset, Save,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  fetchNotificationSettings,
  NotificationSettings,
  sendTestEmail,
  sendTestTelegram,
  updateNotificationSettings,
  verifyTelegram,
} from "@/services/notificationSettingsService";

export default function NotificationSettingsView() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: fetchNotificationSettings,
  });

  const [form, setForm] = useState<NotificationSettings | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => { if (data) setForm(data); }, [data]);

  const saveMut = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) => updateNotificationSettings(patch),
    onSuccess: () => {
      toast.success(t("notifSettings.saved", "Settings saved"));
      qc.invalidateQueries({ queryKey: ["notification-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMut = useMutation({
    mutationFn: () => verifyTelegram(),
    onSuccess: () => { toast.success(t("notifSettings.verified", "Telegram verified")); qc.invalidateQueries({ queryKey: ["notification-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const testTgMut = useMutation({
    mutationFn: () => sendTestTelegram(),
    onSuccess: () => toast.success(t("notifSettings.testSent", "Test sent")),
    onError: (e: Error) => toast.error(e.message),
  });
  const testEmailMut = useMutation({
    mutationFn: (email: string) => sendTestEmail(email),
    onSuccess: () => toast.success(t("notifSettings.testSent", "Test sent")),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="me-2 h-5 w-5 animate-spin" />
        {t("common.loading", "Loading…")}
      </div>
    );
  }

  const update = <K extends keyof NotificationSettings>(k: K, v: NotificationSettings[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur"><Bell className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("notifSettings.title", "Notification Settings")}</h1>
            <p className="text-sm text-white/80">{t("notifSettings.subtitle", "Configure alert channels and preferences")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Telegram */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600"><Send className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold">{t("notifSettings.telegram", "Telegram")}</h2>
                  <p className="text-xs text-muted-foreground">{t("notifSettings.telegramSub", "Receive alerts in Telegram")}</p>
                </div>
              </div>
              <Switch checked={form.telegramEnabled} onCheckedChange={(v) => update("telegramEnabled", v)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("notifSettings.botToken", "Bot Token")}</Label>
              <Input value={form.telegramBotToken} onChange={(e) => update("telegramBotToken", e.target.value)} placeholder="123456:ABC-DEF..." />
            </div>
            <div className="space-y-1.5">
              <Label>{t("notifSettings.chatId", "Chat ID")}</Label>
              <Input value={form.telegramChatId} onChange={(e) => update("telegramChatId", e.target.value)} placeholder="-5131023516" />
              <p className="text-xs text-muted-foreground">{t("notifSettings.chatIdHint", "Group or channel chat ID")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={verifyMut.isPending} onClick={() => verifyMut.mutate()}>
                {verifyMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}
                {t("notifSettings.verify", "Verify")}
              </Button>
              <Button variant="outline" disabled={testTgMut.isPending} onClick={() => testTgMut.mutate()}>
                {testTgMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
                {t("notifSettings.test", "Test")}
              </Button>
            </div>
            <Button
              className="w-full bg-sky-600 hover:bg-sky-700"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({
                telegramEnabled: form.telegramEnabled,
                telegramBotToken: form.telegramBotToken,
                telegramChatId: form.telegramChatId,
              })}
            >
              <Save className="me-2 h-4 w-4" />
              {t("notifSettings.saveTelegram", "Save Telegram Settings")}
            </Button>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600"><Mail className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-semibold">{t("notifSettings.email", "Email")}</h2>
                  <p className="text-xs text-muted-foreground">{t("notifSettings.emailSub", "Receive alerts via email")}</p>
                </div>
              </div>
              <Switch checked={form.emailEnabled} onCheckedChange={(v) => update("emailEnabled", v)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("notifSettings.addRecipient", "Add Email Recipient")}</Label>
              <div className="flex gap-2">
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!newEmail.trim()) return;
                    update("emailRecipients", [...form.emailRecipients, newEmail.trim()]);
                    setNewEmail("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {form.emailRecipients.length === 0 ? (
              <div className="rounded-lg bg-sky-50 p-3 text-sm text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                {t("notifSettings.addOneRecipient", "Add at least one email recipient")}
              </div>
            ) : (
              <div className="space-y-1">
                {form.emailRecipients.map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span className="truncate">{r}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => update("emailRecipients", form.emailRecipients.filter((x) => x !== r))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder={t("notifSettings.sendTest", "Send Test Email")} />
              <Button variant="outline" disabled={!testEmail || testEmailMut.isPending} onClick={() => testEmailMut.mutate(testEmail)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({
                emailEnabled: form.emailEnabled,
                emailRecipients: form.emailRecipients,
              })}
            >
              <Save className="me-2 h-4 w-4" />
              {t("notifSettings.saveEmail", "Save Email Settings")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alert Types */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600"><Bell className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">{t("notifSettings.alertTypes", "Alert Types")}</h2>
                <p className="text-xs text-muted-foreground">{t("notifSettings.alertTypesSub", "Choose which detections trigger notifications")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600">{t("notifSettings.allTypes", "All Types")}</Badge>
              <Switch checked={form.allAlertTypes} onCheckedChange={(v) => update("allAlertTypes", v)} />
            </div>
          </div>
          {form.allAlertTypes && (
            <div className="flex items-center gap-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
              <CheckCircle2 className="h-4 w-4" />
              {t("notifSettings.allTypesHint", "All detection types will trigger notifications")}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cooldown */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600"><TimerReset className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">{t("notifSettings.cooldown", "Cooldown Period")}</h2>
                <p className="text-xs text-muted-foreground">{t("notifSettings.cooldownSub", "Minimum time between notifications")}</p>
              </div>
            </div>
            <div className="text-center text-2xl font-bold">{form.cooldownMinutes} {t("notifSettings.min", "min")}</div>
            <Slider
              value={[form.cooldownMinutes]}
              min={1}
              max={60}
              step={1}
              onValueChange={(v) => update("cooldownMinutes", v[0])}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span><span>5</span><span>15</span><span>30</span><span>60</span>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-500/10 p-2 text-slate-600"><Moon className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">{t("notifSettings.quietHours", "Quiet Hours")}</h2>
                <p className="text-xs text-muted-foreground">{t("notifSettings.quietHoursSub", "No notifications during these hours")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("notifSettings.start", "Start")}</Label>
                <Input type="time" value={form.quietHoursStart} onChange={(e) => update("quietHoursStart", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("notifSettings.end", "End")}</Label>
                <Input type="time" value={form.quietHoursEnd} onChange={(e) => update("quietHoursEnd", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Summary */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-2 text-orange-600"><Truck className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">{t("notifSettings.deliverySummary", "Delivery Summary Reports")}</h2>
                <p className="text-xs text-muted-foreground">{t("notifSettings.deliverySummarySub", "Send periodic delivery tracking summaries to Telegram")}</p>
              </div>
            </div>
            <Switch checked={form.deliverySummary} onCheckedChange={(v) => update("deliverySummary", v)} />
          </div>
          {!form.telegramVerified && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {t("notifSettings.configureFirst", "Configure and verify Telegram settings above first")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wait violation */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600"><Clock className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">{t("notifSettings.waitViolation", "Wait Time Violation Alerts")}</h2>
                <p className="text-xs text-muted-foreground">{t("notifSettings.waitViolationSub", "Alert when customers wait too long")}</p>
              </div>
            </div>
            <Switch checked={form.waitViolationAlerts} onCheckedChange={(v) => update("waitViolationAlerts", v)} />
          </div>
          {!form.telegramVerified && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {t("notifSettings.configureFirst", "Configure and verify Telegram settings above first")}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full bg-gradient-to-r from-indigo-600 to-rose-600 text-white"
        disabled={saveMut.isPending}
        onClick={() => saveMut.mutate(form)}
      >
        {saveMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
        {t("notifSettings.saveAll", "Save All Settings")}
      </Button>
    </div>
  );
}
