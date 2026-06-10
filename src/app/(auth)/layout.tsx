"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Auth layout — redirects already-authenticated users to their dashboard
 * so they don't see login/register pages while logged in.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? "/dashboard/admin" : "/dashboard");
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Show nothing while loading or while redirecting
  if (isLoading || isAuthenticated) return null;

  return <>{children}</>;
}
