"use client";

import { PageErrorFallback } from "@/components/dashboard/error-fallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageErrorFallback
      error={error}
      reset={reset}
      title="Failed to load Analytics"
      description="There was an error loading the analytics dashboard. Please try again."
    />
  );
}
