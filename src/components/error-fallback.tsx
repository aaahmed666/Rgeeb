"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { StructuredApiError } from "@/lib/api-types";

interface ErrorFallbackProps {
  error: Error | StructuredApiError | null;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Reusable error display component for consistent error UX.
 * Shows error messages with optional retry button and debug info.
 */
export function ErrorFallback({
  error,
  onRetry,
  title = "Something went wrong",
  showDetails = false,
  compact = false,
}: ErrorFallbackProps) {
  if (!error) return null;

  const message = isStructuredError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : "An unknown error occurred";

  const details = isStructuredError(error) ? error.details : undefined;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <p className="flex-1">{message}</p>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="ml-2 h-7 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-destructive" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          {showDetails && details && (
            <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
              {details.map((detail, idx) => (
                <div key={idx}>
                  <strong>{detail.field}:</strong> {detail.message}
                </div>
              ))}
            </div>
          )}

          {showDetails && isStructuredError(error) && (
            <div className="mt-3 text-xs text-muted-foreground">
              <p>
                Status: {error.status} | Type: {error.type} | Retryable:{" "}
                {error.retryable ? "Yes" : "No"}
              </p>
            </div>
          )}

          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function isStructuredError(error: unknown): error is StructuredApiError {
  return (
    error !== null &&
    typeof error === "object" &&
    "type" in error &&
    "status" in error
  );
}
