"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  FileText,
  Bell,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {  } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fetchAdminSettings, upsertManyAdminSettings } from "@/services/adminService";

// ─── Field config — matches old implementation's settingFields ─────────────────
//
// Old code used: app_name, app_description, contact_email, support_phone,
//                privacy_policy, terms_of_service, cookie_policy,
//                notification_email, email_signature
// Postman: POST /admin/settings/upsert-many  { settings[0][key], settings[0][value] }
// AdminSettings.raw is Record<string, string> — key/value pairs from the API.

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SaveBar({ onSave, isPending, t }: { onSave: () => void; isPending: boolean; t: (k: string) => string }) {
  return (
    <div className="flex justify-end border-t border-border/60 pt-4">
      <Button onClick={onSave} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("common.save")}
      </Button>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function AdminSettingsView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  // AdminSettings.raw is Record<string,string> — flat key/value map
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchAdminSettings,
  });

  // We keep a single flat state object matching the raw keys
  const [vals, setVals] = useState<Record<string, string>>({});

  // Populate from API — raw is already { app_name: "...", privacy_policy: "..." }
  useEffect(() => {
    if (q.data?.raw) {
      setVals(q.data.raw);
    }
  }, [q.data]);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setVals((prev) => ({ ...prev, [key]: e.target.value }));

  const v = (key: string) => vals[key] ?? "";

  // Postman: POST /admin/settings/upsert-many
  // body: settings[0][key], settings[0][value], settings[1][key], ...
  // upsertManyAdminSettings already builds that format
  const mut = useMutation({
    mutationFn: (pairs: { key: string; value: string }[]) =>
      upsertManyAdminSettings(pairs),
    onSuccess: () => {
      toast.success(t("validation.saveSuccess"));
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveGeneral = () =>
    mut.mutate([
      { key: "app_name",        value: v("app_name") },
      { key: "app_description", value: v("app_description") },
      { key: "contact_email",   value: v("contact_email") },
      { key: "support_phone",   value: v("support_phone") },
    ]);

  const saveLegal = () =>
    mut.mutate([
      { key: "privacy_policy",  value: v("privacy_policy") },
      { key: "terms_of_service",value: v("terms_of_service") },
      { key: "cookie_policy",   value: v("cookie_policy") },
    ]);

  const saveNotifications = () =>
    mut.mutate([
      { key: "notification_email", value: v("notification_email") },
      { key: "email_signature",    value: v("email_signature") },
    ]);

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.settings"
        Icon={SettingsIcon}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {q.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : q.isError ? (
            <div className="text-sm text-destructive">
              {q.error instanceof Error ? q.error.message : t("admin.common.loadingFailed")}
            </div>
          ) : (
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">
                  <SettingsIcon className="me-2 h-4 w-4" /> {t("admin.settings_general")}
                </TabsTrigger>
                <TabsTrigger value="legal">
                  <FileText className="me-2 h-4 w-4" /> {t("admin.settings_policies")}
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="me-2 h-4 w-4" /> {t("admin.settings_notifications")}
                </TabsTrigger>
              </TabsList>

              {/* ── General ──────────────────────────────────────────────── */}
              <TabsContent value="general" className="mt-6 space-y-4">
                <Field label={t("admin.settings_appName")}>
                  <Input
                    value={v("app_name")}
                    onChange={set("app_name")}
                    placeholder="My App"
                  />
                </Field>
                <Field label={t("admin.settings_appDesc")}>
                  <Textarea
                    value={v("app_description")}
                    onChange={set("app_description")}
                    rows={4}
                    placeholder="Short description of the application"
                  />
                </Field>
                <Field label={t("admin.settings_contactEmail")}>
                  <Input
                    type="email"
                    value={v("contact_email")}
                    onChange={set("contact_email")}
                    placeholder="contact@example.com"
                  />
                </Field>
                <Field label={t("admin.settings_supportPhone")}>
                  <Input
                    value={v("support_phone")}
                    onChange={set("support_phone")}
                    placeholder="+1 555 000 0000"
                  />
                </Field>
                <SaveBar onSave={saveGeneral} isPending={mut.isPending} t={t} />
              </TabsContent>

              {/* ── Legal ─────────────────────────────────────────────────── */}
              <TabsContent value="legal" className="mt-6 space-y-4">
                <Field label={t("admin.settings_privacy")}>
                  <Textarea
                    value={v("privacy_policy")}
                    onChange={set("privacy_policy")}
                    rows={8}
                    placeholder="Privacy policy content…"
                  />
                </Field>
                <Field label={t("admin.settings_terms")}>
                  <Textarea
                    value={v("terms_of_service")}
                    onChange={set("terms_of_service")}
                    rows={8}
                    placeholder="Terms of service content…"
                  />
                </Field>
                <Field label={t("admin.settings_cookies")}>
                  <Textarea
                    value={v("cookie_policy")}
                    onChange={set("cookie_policy")}
                    rows={8}
                    placeholder="Cookie policy content…"
                  />
                </Field>
                <SaveBar onSave={saveLegal} isPending={mut.isPending} t={t} />
              </TabsContent>

              {/* ── Notifications ─────────────────────────────────────────── */}
              <TabsContent value="notifications" className="mt-6 space-y-4">
                <Field label={t("admin.settings_notifEmail")}>
                  <Input
                    type="email"
                    value={v("notification_email")}
                    onChange={set("notification_email")}
                    placeholder="notifications@example.com"
                  />
                </Field>
                <Field label={t("admin.settings_emailSig")}>
                  <Textarea
                    value={v("email_signature")}
                    onChange={set("email_signature")}
                    rows={8}
                    placeholder="Email signature HTML or text…"
                  />
                </Field>
                <SaveBar onSave={saveNotifications} isPending={mut.isPending} t={t} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
