"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const DashboardView = dynamic(() => import("@/views/DashboardView"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export default function DashboardIndexPage() {
  const { isAdmin, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  // CRM-scoped accounts (e.g. the CRM demo login) have no access to the
  // generic dashboard modules — send them to their own dashboard.
  const crmOnly =
    !isAdmin && hasPermission("customer_lifecycle") && !hasPermission("insights");

  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) {
      router.replace("/dashboard/admin");
    } else if (crmOnly) {
      router.replace("/dashboard/customer-lifecycle");
    }
  }, [isAdmin, crmOnly, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Admin / CRM-only will be redirected above — render nothing during redirect
  if (isAdmin || crmOnly) return null;

  return <DashboardView />;
}
