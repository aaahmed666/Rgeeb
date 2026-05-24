"use client";

import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminSectionPlaceholder({
  titleKey,
  Icon,
}: {
  titleKey: string;
  Icon: LucideIcon;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t(titleKey)}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">{t("admin.sectionSoon")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t(titleKey)}</CardTitle>
          <CardDescription>{t("admin.sectionDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            {t("admin.sectionEmpty")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
