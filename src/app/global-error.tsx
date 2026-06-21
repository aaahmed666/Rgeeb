"use client";
import { useTranslation } from "react-i18next";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">{t("errors.pageDidntLoad")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("errors.globalErrorDesc")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("common.tryAgain")}
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {t("common.goHome")}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
