import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorBoundaryProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  description?: string;
}

/**
 * Generic error fallback component for dashboard pages.
 * Displays error details and provides a retry button.
 */
export function PageErrorFallback({
  error,
  reset,
  title,
  description,
}: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("errors.somethingWentWrong");
  const resolvedDescription =
    description ?? t("errors.pageErrorDesc");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">{resolvedTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{resolvedDescription}</p>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <div className="rounded-md bg-red-50 p-3 text-left">
            <p className="text-xs font-mono text-red-700">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-center pt-2">
          {reset && (
            <Button onClick={reset} variant="default" size="sm">
              <RefreshCw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </Button>
          )}
          <Button
            onClick={() => window.location.href = "/dashboard"}
            variant="outline"
            size="sm"
          >
            {t("common.backToDashboard")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Error component for 404 Not Found scenarios.
 */
export function NotFoundError() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="text-4xl font-bold text-muted-foreground">404</div>
        <div>
          <h2 className="text-lg font-semibold">{t("errors.notFoundTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Button onClick={() => window.location.href = "/dashboard"} size="sm">
          {t("common.returnToDashboard")}
        </Button>
      </Card>
    </div>
  );
}

/**
 * Error component for 401/403 authentication/authorization failures.
 */
export function AccessDeniedError({
  reason,
}: { reason?: string }) {
  const { t } = useTranslation();
  const resolvedReason =
    reason ?? t("common.noPermission");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("common.accessDenied")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{resolvedReason}</p>
        </div>
        <Button onClick={() => window.location.href = "/dashboard"} size="sm">
          {t("common.backToDashboard")}
        </Button>
      </Card>
    </div>
  );
}
