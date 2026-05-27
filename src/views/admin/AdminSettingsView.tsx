"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  FileText,
  Bell,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fetchAdminSettings, upsertManyAdminSettings } from "@/services/adminService";


// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Tab-level save button ─────────────────────────────────────────────────────
function SaveBar({
  onSave,
  isPending,
}: {
  onSave: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex justify-end pt-4 border-t border-border/60">
      <Button
        onClick={onSave}
        disabled={isPending}
        className="gap-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Changes
      </Button>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function AdminSettingsView() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchAdminSettings,
  });
  const s = q.data;

  // ── General state ──────────────────────────────────────────────────────────
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  // ── Legal state ────────────────────────────────────────────────────────────
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [cookiePolicy, setCookiePolicy] = useState("");

  // ── Notifications state ────────────────────────────────────────────────────
  const [notificationEmail, setNotificationEmail] = useState("");
  const [emailSignature, setEmailSignature] = useState("");

  // Populate form when data loads
  useEffect(() => {
    if (!s) return;
    setAppName(s.general.appName ?? "");
    setAppDescription(s.general.appDescription ?? "");
    setContactEmail(s.general.contactEmail ?? "");
    setSupportPhone(s.general.supportPhone ?? "");
    setPrivacyPolicy(s.legal.privacyPolicy ?? "");
    setTermsOfService(s.legal.termsOfService ?? "");
    setCookiePolicy(s.legal.cookiePolicy ?? "");
    setNotificationEmail(s.notifications.notificationEmail ?? "");
    setEmailSignature(s.notifications.emailSignature ?? "");
  }, [s]);

  const mut = useMutation({
    mutationFn: (pairs: { key: string; value: string }[]) =>
      upsertManyAdminSettings(pairs),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveGeneral = () =>
    mut.mutate([
      { key: "app_name", value: appName },
      { key: "app_description", value: appDescription },
      { key: "contact_email", value: contactEmail },
      { key: "support_phone", value: supportPhone },
    ]);

  const saveLegal = () =>
    mut.mutate([
      { key: "privacy_policy", value: privacyPolicy },
      { key: "terms_of_service", value: termsOfService },
      { key: "cookie_policy", value: cookiePolicy },
    ]);

  const saveNotifications = () =>
    mut.mutate([
      { key: "notification_email", value: notificationEmail },
      { key: "email_signature", value: emailSignature },
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
              {q.error instanceof Error ? q.error.message : "Failed to load"}
            </div>
          ) : (
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">
                  <SettingsIcon className="mr-2 h-4 w-4" /> General
                </TabsTrigger>
                <TabsTrigger value="legal">
                  <FileText className="mr-2 h-4 w-4" /> Legal
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="mr-2 h-4 w-4" /> Notifications
                </TabsTrigger>
              </TabsList>

              {/* ── General ──────────────────────────────────────────────── */}
              <TabsContent
                value="general"
                className="mt-6 space-y-4"
              >
                <Field label="Application Name">
                  <Input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My App"
                  />
                </Field>
                <Field label="Application Description">
                  <Textarea
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    rows={4}
                    placeholder="Short description of the application"
                  />
                </Field>
                <Field label="Contact Email">
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </Field>
                <Field label="Support Phone">
                  <Input
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </Field>
                <SaveBar
                  onSave={saveGeneral}
                  isPending={mut.isPending}
                />
              </TabsContent>

              {/* ── Legal ─────────────────────────────────────────────────── */}
              <TabsContent
                value="legal"
                className="mt-6 space-y-4"
              >
                <Field label="Privacy Policy">
                  <Textarea
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    rows={8}
                    placeholder="Privacy policy content…"
                  />
                </Field>
                <Field label="Terms of Service">
                  <Textarea
                    value={termsOfService}
                    onChange={(e) => setTermsOfService(e.target.value)}
                    rows={8}
                    placeholder="Terms of service content…"
                  />
                </Field>
                <Field label="Cookie Policy">
                  <Textarea
                    value={cookiePolicy}
                    onChange={(e) => setCookiePolicy(e.target.value)}
                    rows={8}
                    placeholder="Cookie policy content…"
                  />
                </Field>
                <SaveBar
                  onSave={saveLegal}
                  isPending={mut.isPending}
                />
              </TabsContent>

              {/* ── Notifications ─────────────────────────────────────────── */}
              <TabsContent
                value="notifications"
                className="mt-6 space-y-4"
              >
                <Field label="Notification Email">
                  <Input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="notifications@example.com"
                  />
                </Field>
                <Field label="Email Signature">
                  <Textarea
                    value={emailSignature}
                    onChange={(e) => setEmailSignature(e.target.value)}
                    rows={8}
                    placeholder="Email signature HTML or text…"
                  />
                </Field>
                <SaveBar
                  onSave={saveNotifications}
                  isPending={mut.isPending}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
