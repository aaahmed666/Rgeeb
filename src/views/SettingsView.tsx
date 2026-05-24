"use client";

import { useTranslation } from "react-i18next";
import { Bell, Eye, Globe, Info, Moon, Shield } from "lucide-react";

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

function Toggle({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <Label className="font-medium">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch />
    </div>
  );
}

export default function SettingsView() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("settings.title")}</h1>
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

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Toggle label="Email notifications" hint="Receive product updates by email" />
              <Toggle label="Push notifications" hint="Browser push for important alerts" />
              <Toggle label="Weekly digest" hint="Summary of activity each Monday" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.security")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Toggle label="Two-factor authentication" hint="Require a one-time code at sign in" />
              <Toggle label="Sign-in alerts" hint="Notify me of new sign-ins" />
              <Toggle label="Trusted devices only" hint="Block sessions from unknown devices" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.privacy")}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <Toggle label="Share usage analytics" hint="Help us improve the product" />
              <Toggle label="Personalised content" hint="Use my activity to tailor results" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.about")}</CardTitle>
              <CardDescription>App information and credits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>1.0.0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Build</span><span>2026.05.21</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">License</span><span>MIT</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
