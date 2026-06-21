"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Minimal Terms of Service page.
 * Created because the login footer links to /terms; previously this was a 404.
 * Replace the placeholder copy with the real legal text before launch.
 */
export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
      <h1 className="text-2xl font-bold">{t("legal.termsTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("legal.termsBody")}</p>
      <Link href="/login" className="text-sm font-medium text-primary underline">
        {t("common.backToSignIn")}
      </Link>
    </main>
  );
}
