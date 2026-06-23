"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Route guard for the Customer Lifecycle (CRM) module.
 *
 * The parent dashboard layout only enforces authentication. The CRM module is
 * additionally gated on the `customer_lifecycle` permission — the same check
 * the sidebar uses to show/hide the nav group (see AppSidebar / lib/auth
 * CRM_DEMO_EMAILS). Without this guard a logged-in user without CRM access
 * could still reach the pages by typing the URL directly. Here we redirect
 * them back to the dashboard home so the module truly only appears for
 * CRM-enabled accounts.
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
  const { isLoading, isAuthenticated, hasPermission } = useAuth();
  const router = useRouter();

  const allowed = hasPermission("customer_lifecycle");

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, allowed, router]);

  // While auth resolves, or when access is denied (during the redirect tick),
  // render a neutral skeleton instead of flashing the protected content.
  if (isLoading || !isAuthenticated || !allowed) {
    return <CrmGuardSkeleton />;
  }

  return <>{children}</>;
}
