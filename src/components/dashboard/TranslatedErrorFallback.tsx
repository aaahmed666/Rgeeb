"use client";

import { useTranslation } from "react-i18next";
import { PageErrorFallback } from "@/components/dashboard/error-fallback";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  /** Optional page-specific title key — falls back to generic errors.pageLoadFailed */
  titleKey?: string;
}

/**
 * Translated error boundary wrapper.
 * Replaces the 87 individual error.tsx files that had hardcoded English strings.
 * All error boundaries now use i18n keys so the UI is fully bilingual.
 */
export default function TranslatedErrorFallback({ error, reset, titleKey }: Props) {
  const { t } = useTranslation();
  return (
    <PageErrorFallback
      error={error}
      reset={reset}
      title={t(titleKey ?? "errors.pageLoadFailed", "Failed to load page")}
      description={t("errors.tryAgain", "There was an error loading this page. Please try again.")}
    />
  );
}
