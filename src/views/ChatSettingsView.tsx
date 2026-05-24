"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Clock,
  Info,
  MessageCircle,
  Phone,
  RotateCcw,
  Save,
  Send,
  Settings as SettingsIcon,
  ShieldOff,
  TrendingDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  chatSettingsService,
  DEFAULT_ALERTS,
  type ChatSettings,
  type SmartAlerts,
  type WhatsappSettings,
} from "@/services/chatSettingsService";

export default function ChatSettingsView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [whatsapp, setWhatsapp] = useState<WhatsappSettings>({
    enabled: false,
    phone_number: "",
    language: "ar",
    daily_reports: false,
    weekly_reports: false,
    realtime_alerts: true,
  });
  const [alerts, setAlerts] = useState<SmartAlerts>(DEFAULT_ALERTS);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await chatSettingsService.get();
    setWhatsapp(s.whatsapp);
    setAlerts(s.alerts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await chatSettingsService.update({ whatsapp, alerts });
      toast.success(t("chatSettings.saved", "Settings saved"));
    } catch {
      toast.error(t("chatSettings.saveFailed", "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!whatsapp.phone_number) {
      toast.error(t("chatSettings.phoneRequired", "Please enter a phone number"));
      return;
    }
    setSendingTest(true);
    try {
      await chatSettingsService.sendTest(whatsapp.phone_number, whatsapp.language);
      toast.success(t("chatSettings.testSent", "Test message sent"));
    } catch {
      toast.error(t("chatSettings.testFailed", "Failed to send test message"));
    } finally {
      setSendingTest(false);
    }
  };

  const resetAlerts = () => setAlerts({ ...DEFAULT_ALERTS });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card className="flex items-start gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            {t("chatSettings.title", "AI Assistant Settings")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "chatSettings.subtitle",
              "Configure notifications, alerts, and WhatsApp integration",
            )}
          </p>
        </div>
      </Card>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            {t("chatSettings.whatsappTab", "WhatsApp Notifications")}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t("chatSettings.smartAlertsTab", "Smart Alerts")}
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp tab */}
        <TabsContent value="whatsapp" className="space-y-0">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {t("chatSettings.whatsappTitle", "WhatsApp Notifications")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "chatSettings.whatsappDesc",
                      "Receive AI assistant updates via WhatsApp",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={whatsapp.enabled}
                  onCheckedChange={(v) => setWhatsapp({ ...whatsapp, enabled: v })}
                  disabled={loading}
                />
                <span className="text-sm text-muted-foreground">
                  {whatsapp.enabled
                    ? t("common.enabled", "Enabled")
                    : t("common.disabled", "Disabled")}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("chatSettings.phoneNumber", "WhatsApp Phone Number")}
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={whatsapp.phone_number}
                      onChange={(e) =>
                        setWhatsapp({ ...whatsapp, phone_number: e.target.value })
                      }
                      placeholder="+966500000000"
                      className="ps-9"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      "chatSettings.phoneHelp",
                      "Include country code (e.g., +966 for Saudi Arabia)",
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("chatSettings.notifLanguage", "Notification Language")}
                  </Label>
                  <Select
                    value={whatsapp.language}
                    onValueChange={(v) =>
                      setWhatsapp({ ...whatsapp, language: v as "ar" | "en" })
                    }
                  >
                    <SelectTrigger className="mt-1" disabled={loading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">
                  {t("chatSettings.notifTypes", "Notification Types")}
                </h4>
                <InfoBanner
                  text={t(
                    "chatSettings.notifTypesHelp",
                    "Choose which notifications you want to receive on WhatsApp",
                  )}
                />

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ToggleCard
                    title={t("chatSettings.dailyReports", "Daily Reports")}
                    desc={t(
                      "chatSettings.dailyReportsDesc",
                      "Receive daily summary at 9:00 AM",
                    )}
                    value={whatsapp.daily_reports}
                    onChange={(v) =>
                      setWhatsapp({ ...whatsapp, daily_reports: v })
                    }
                  />
                  <ToggleCard
                    title={t("chatSettings.weeklyReports", "Weekly Reports")}
                    desc={t(
                      "chatSettings.weeklyReportsDesc",
                      "Receive weekly summary on Sunday",
                    )}
                    value={whatsapp.weekly_reports}
                    onChange={(v) =>
                      setWhatsapp({ ...whatsapp, weekly_reports: v })
                    }
                  />
                  <ToggleCard
                    title={t("chatSettings.realtimeAlerts", "Real-time Alerts")}
                    desc={t(
                      "chatSettings.realtimeAlertsDesc",
                      "Camera offline, security events",
                    )}
                    value={whatsapp.realtime_alerts}
                    onChange={(v) =>
                      setWhatsapp({ ...whatsapp, realtime_alerts: v })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={sendTest}
                  disabled={!whatsapp.phone_number || sendingTest}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t("chatSettings.sendTest", "Send Test Message")}
                </Button>
                <Button onClick={save} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("chatSettings.saveSettings", "Save Settings")}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Smart Alerts tab */}
        <TabsContent value="alerts">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {t("chatSettings.thresholdsTitle", "Smart Alert Thresholds")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "chatSettings.thresholdsDesc",
                      "Configure when you receive proactive alerts",
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAlerts}
                className="gap-2 text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                {t("chatSettings.resetDefaults", "Reset Defaults")}
              </Button>
            </div>

            <div className="space-y-5 p-5">
              <InfoBanner
                text={t(
                  "chatSettings.alertsBanner",
                  "Alerts are checked every 5 minutes. When a threshold is breached, you will receive a notification via your enabled channels (WhatsApp, in-app).",
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SliderCard
                  icon={ShieldOff}
                  tone="rose"
                  title={t("chatSettings.ppeTitle", "PPE Violations Surge")}
                  desc={t(
                    "chatSettings.ppeDesc",
                    "Violations within {{n}}-minute window",
                    { n: alerts.ppe_violations_window_minutes },
                  )}
                  value={alerts.ppe_violations_window_minutes}
                  onChange={(v) =>
                    setAlerts({ ...alerts, ppe_violations_window_minutes: v })
                  }
                  min={1}
                  max={20}
                  step={1}
                  marks={["1", "5", "10", "20"]}
                  footnote={t(
                    "chatSettings.ppeFoot",
                    "Alert when {{n}}+ violations occur in 30 minutes",
                    { n: alerts.ppe_violations_window_minutes },
                  )}
                />
                <SliderCard
                  icon={TrendingDown}
                  tone="cyan"
                  title={t("chatSettings.visitorDropTitle", "Visitor Drop Alert")}
                  desc={t(
                    "chatSettings.visitorDropDesc",
                    "Percentage drop compared to yesterday",
                  )}
                  value={alerts.visitor_drop_percentage}
                  onChange={(v) =>
                    setAlerts({ ...alerts, visitor_drop_percentage: v })
                  }
                  min={10}
                  max={90}
                  step={10}
                  marks={["10%", "30%", "50%", "70%", "90%"]}
                  pill={`${alerts.visitor_drop_percentage}%`}
                  footnote={t(
                    "chatSettings.visitorDropFoot",
                    "Alert when visitors drop by {{n}}%+ vs yesterday",
                    { n: alerts.visitor_drop_percentage },
                  )}
                />
                <Card className="p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {t("chatSettings.baselineTitle", "Minimum Traffic Baseline")}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "chatSettings.baselineDesc",
                          "Min yesterday visitors to trigger drop alert",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      value={alerts.minimum_traffic_baseline}
                      onChange={(e) =>
                        setAlerts({
                          ...alerts,
                          minimum_traffic_baseline: Number(e.target.value) || 0,
                        })
                      }
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("chatSettings.visitorsMin", "visitors minimum")}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t(
                      "chatSettings.baselineFoot",
                      "Prevents false alerts on low-traffic days (requires 10+ visitors yesterday)",
                    )}
                  </p>
                </Card>
                <SliderCard
                  icon={Clock}
                  tone="emerald"
                  title={t("chatSettings.waitTimeTitle", "Wait Time Threshold")}
                  desc={t(
                    "chatSettings.waitTimeDesc",
                    "Maximum acceptable wait time in minutes",
                  )}
                  value={alerts.wait_time_minutes}
                  onChange={(v) => setAlerts({ ...alerts, wait_time_minutes: v })}
                  min={1}
                  max={30}
                  step={1}
                  marks={["1m", "5m", "10m", "20m", "30m"]}
                  pill={`${alerts.wait_time_minutes}m`}
                  footnote={t(
                    "chatSettings.waitTimeFoot",
                    "Alert when any customer waits more than {{n}} minutes",
                    { n: alerts.wait_time_minutes },
                  )}
                />
              </div>

              <div className="flex justify-end border-t pt-4">
                <Button onClick={save} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("chatSettings.saveSettings", "Save Settings")}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------- helpers --------- */

function InfoBanner({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-700 dark:text-cyan-300">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function ToggleCard({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </Card>
  );
}

function SliderCard({
  icon: Icon,
  tone,
  title,
  desc,
  value,
  onChange,
  min,
  max,
  step,
  marks,
  pill,
  footnote,
}: {
  icon: React.ElementType;
  tone: "rose" | "cyan" | "violet" | "emerald";
  title: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  marks: string[];
  pill?: string;
  footnote: string;
}) {
  const tones: Record<string, string> = {
    rose: "bg-rose-500/10 text-rose-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
    violet: "bg-violet-500/10 text-violet-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        {pill && (
          <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
            {pill}
          </span>
        )}
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        {marks.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{footnote}</p>
    </Card>
  );
}
