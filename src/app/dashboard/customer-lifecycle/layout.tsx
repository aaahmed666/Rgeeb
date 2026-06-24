"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Route guard for the Customer Lifecycle (CRM) module.
 *
 * The CRM module is PUBLIC to every signed-in user — it requires NO
 * `customer_lifecycle` permission or role (matching the sidebar, which shows
 * the group to everyone). This guard therefore only enforces authentication,
 * exactly like the parent dashboard layout; any logged-in user can open these
 * pages.
 */
function CrmGuardSkeleton() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-background">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function CustomerLifecycleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // While auth resolves, or before the redirect for unauthenticated visitors
  // takes effect, render a neutral skeleton instead of flashing content.
  if (isLoading || !isAuthenticated) {
    return <CrmGuardSkeleton />;
  }

  return <>{children}</>;
}
