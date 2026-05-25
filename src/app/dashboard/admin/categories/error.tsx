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
      title="Failed to load Admin Categories"
      description="There was an error loading this page. Please try again."
    />
  );
}
