"use client";

import { useCallback } from "react";
import { ApiError } from "@/lib/api";
import type { StructuredApiError } from "@/lib/api-types";

/**
 * Converts ApiError to a StructuredApiError for consistent error handling.
 */
export function useErrorHandler() {
  const structureError = useCallback(
    (error: unknown): StructuredApiError => {
      if (error instanceof ApiError) {
        const type = getErrorType(error.status);
        return {
          type,
          status: error.status,
          message: error.message,
          code: "API_ERROR",
          retryable: isRetryable(error.status),
          timestamp: new Date().toISOString(),
        };
      }

      if (error instanceof Error) {
        return {
          type: "network",
          status: 0,
          message: error.message || "An error occurred",
          code: "UNKNOWN_ERROR",
          retryable: true,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        type: "server",
        status: 500,
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        retryable: true,
        timestamp: new Date().toISOString(),
      };
    },
    []
  );

  const isRetryable = useCallback((status: number): boolean => {
    // Retry on timeouts, server errors, and rate limits
    return status === 408 || status === 429 || (status >= 500 && status < 600);
  }, []);

  const getErrorType = useCallback(
    (status: number): StructuredApiError["type"] => {
      if (status === 401) return "auth";
      if (status === 403) return "forbidden";
      if (status === 404) return "notfound";
      if (status === 422) return "validation";
      if (status >= 500) return "server";
      return "network";
    },
    []
  );

  return { structureError, isRetryable, getErrorType };
}

/**
 * Hook for retrying async operations with exponential backoff.
 */
export function useRetry(maxAttempts = 3, baseDelayMs = 1000) {
  const retry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      onError?: (error: Error, attempt: number) => void
    ): Promise<T> => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          onError?.(lastError, attempt);

          if (attempt < maxAttempts) {
            const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      throw lastError || new Error("Max retry attempts exceeded");
    },
    [maxAttempts, baseDelayMs]
  );

  return { retry };
}
