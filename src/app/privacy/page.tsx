"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Minimal Privacy Policy page.
 * Created because the login footer links to /privacy; previously this was a 404.
 * Replace the placeholder copy with the real legal text before launch.
 */
export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
      <h1 className="text-2xl font-bold">{t("legal.privacyTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("legal.privacyBody")}</p>
      <Link href="/login" className="text-sm font-medium text-primary underline">
        {t("common.backToSignIn")}
      </Link>
    </main>
  );
}
