"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { AIAssistant } from "@/components/AIAssistant";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NavigationProgress } from "@/components/NavigationProgress";

/**
 * Skeleton that inherits the page background (dark or light) so there is
 * zero colour flash while the auth state resolves.
 */
function AuthSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 border-r border-border/40 bg-sidebar md:block" />
      {/* Content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <div className="h-14 border-b border-border/40 bg-background" />
        {/* Body: a single centred spinner */}
        <div className="flex flex-1 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    </div>
  );
}

// NOTE: Do NOT wrap translation-aware components in React.memo without a custom
// comparator — memo prevents re-renders, which breaks language switching.
const StableAIAssistant = React.memo(AIAssistant);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <AuthSkeleton />;
  }

  return (
    <SidebarProvider>
      {/* Progress bar — appears instantly on Link click, before new page loads */}
      <NavigationProgress />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex min-h-screen flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-background pb-24">
            {children}
          </main>
          <ScrollToTop />
          {!isAdmin && <StableAIAssistant />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
