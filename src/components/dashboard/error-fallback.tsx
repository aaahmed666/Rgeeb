import React from "react";
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
  title = "Something went wrong",
  description = "An error occurred while loading this page. Please try again.",
}: ErrorBoundaryProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
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
              Try Again
            </Button>
          )}
          <Button
            onClick={() => window.location.href = "/dashboard"}
            variant="outline"
            size="sm"
          >
            Back to Dashboard
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
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="text-4xl font-bold text-muted-foreground">404</div>
        <div>
          <h2 className="text-lg font-semibold">Page Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Button onClick={() => window.location.href = "/dashboard"} size="sm">
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
}

/**
 * Error component for 401/403 authentication/authorization failures.
 */
export function AccessDeniedError({
  reason = "You don't have permission to view this page.",
}: { reason?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
        </div>
        <Button onClick={() => window.location.href = "/dashboard"} size="sm">
          Back to Dashboard
        </Button>
      </Card>
    </div>
  );
}
