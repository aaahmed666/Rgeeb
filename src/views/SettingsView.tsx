"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Eye, Globe, Info, Moon, Shield } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * FIX: All Toggle switches now have local state with onChange handlers.
 * Previously every Switch was uncontrolled with no state — checking/unchecking
 * had no effect and nothing was persisted.
 *
 * Notification settings (real API) → handled in /preferences/notification-settings
 * Security (2FA) → handled in /preferences/security
 * These toggles are local UI preferences stored in localStorage.
 */

function useLocalToggle(key: string, defaultValue = false) {
  const stored =
    typeof window !== "undefined" ? localStorage.getItem(key) : null;
  const [value, setValue] = useState<boolean>(
    stored !== null ? stored === "true" : defaultValue
  );

  const set = (v: boolean) => {
    setValue(v);
    if (typeof window !== "undefined") localStorage.setItem(key, String(v));
  };
  return [value, set] as const;
}

function Toggle({
  label,
  hint,
  storageKey,
  defaultValue,
  onToggle,
}: {
  label: string;
  hint?: string;
  storageKey: string;
  defaultValue?: boolean;
  onToggle?: (v: boolean) => void;
}) {
  const [checked, setChecked] = useLocalToggle(storageKey, defaultValue);

  const handleChange = (v: boolean) => {
    setChecked(v);
    onToggle?.(v);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <Label className="font-medium">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
      />
    </div>
  );
}

export default function SettingsView() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-lg font-bold sm:text-xl">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
      </header>

      <Tabs defaultValue="display">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="display" className="gap-1">
            <Moon className="h-4 w-4" /> {t("settings.display")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-4 w-4" /> {t("settings.notifications")}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1">
            <Shield className="h-4 w-4" /> {t("settings.security")}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1">
            <Eye className="h-4 w-4" /> {t("settings.privacy")}
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1">
            <Info className="h-4 w-4" /> {t("settings.about")}
          </TabsTrigger>
        </TabsList>

        {/* ── Display ── */}
        <TabsContent value="display" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.display")}</CardTitle>
              <CardDescription>{t("settings.themeDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("settings.theme")}</span>
                </div>
                <ThemeToggle />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t("common.language")}</span>
                </div>
                <LanguageSwitcher />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
              <CardDescription>
                {t(
                  "settings.notificationsDesc",
                  "For detailed channel settings (Telegram, Email) go to Notification Settings."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <Toggle
                storageKey="pref_email_notif"
                label={t("settings.emailNotifications", "Email notifications")}
                hint={t("settings.emailNotificationsHint", "Receive product updates by email")}
              />
              <Toggle
                storageKey="pref_push_notif"
                label={t("settings.pushNotifications", "Push notifications")}
                hint={t("settings.pushNotificationsHint", "Browser push for important alerts")}
              />
              <Toggle
                storageKey="pref_weekly_digest"
                label={t("settings.weeklyDigest", "Weekly digest")}
                hint={t("settings.weeklyDigestHint", "Summary of activity each Monday")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.security")}</CardTitle>
              <CardDescription>
                {t(
                  "settings.securityDesc",
                  "For 2FA setup go to Preferences → Security."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <Toggle
                storageKey="pref_signin_alerts"
                label={t("settings.signInAlerts", "Sign-in alerts")}
                hint={t("settings.signInAlertsHint", "Notify me of new sign-ins")}
                onToggle={(v) => {
                  if (v) toast.info("Sign-in alerts enabled (local preference).");
                }}
              />
              <Toggle
                storageKey="pref_trusted_devices"
                label={t("settings.trustedDevices", "Trusted devices only")}
                hint={t("settings.trustedDevicesHint", "Block sessions from unknown devices")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy ── */}
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.privacy")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Toggle
                storageKey="pref_usage_analytics"
                label={t("settings.shareAnalytics", "Share usage analytics")}
                hint={t("settings.shareAnalyticsHint", "Help us improve the product")}
              />
              <Toggle
                storageKey="pref_personalised"
                label={t("settings.personalisedContent", "Personalised content")}
                hint={t("settings.personalisedContentHint", "Use my activity to tailor results")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── About ── */}
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.about")}</CardTitle>
              <CardDescription>{t("settings.about")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.version")}</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.build")}</span>
                <span>2026.05.21</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.license")}</span>
                <span>MIT</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
