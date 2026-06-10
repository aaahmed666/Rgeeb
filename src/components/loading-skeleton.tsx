"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface LoadingSkeletonProps {
  title?: boolean;
  rows?: number;
  columns?: number;
  variant?: "card" | "table" | "list" | "grid";
}

/**
 * Reusable loading skeleton for consistent placeholder UX across dashboard.
 * Supports multiple variants for different layout types.
 */
export function LoadingSkeleton({
  title = true,
  rows = 5,
  columns = 1,
  variant = "card",
}: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <Card className="p-4">
        {title && <Skeleton className="mb-4 h-6 w-32" />}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-3">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-10 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {title && <Skeleton className="mb-4 h-6 w-32" />}
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div>
        {title && <Skeleton className="mb-4 h-6 w-32" />}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-3 h-24 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className="p-4">
      {title && <Skeleton className="mb-4 h-6 w-32" />}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </Card>
  );
}
