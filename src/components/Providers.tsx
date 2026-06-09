"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { isRtl } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";

function DirectionSync({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";

  React.useEffect(() => {
    const apply = (lng: string) => {
      const dir = isRtl(lng) ? "rtl" : "ltr";
      document.documentElement.lang = lng;
      document.documentElement.dir = dir;
      document.body.dir = dir;
      // Persist using the same key i18n uses (app.language) so layout.tsx picks it up on reload
      try { localStorage.setItem("app.language", lng); } catch {}
    };

    // Apply immediately for current language
    apply(lang);

    // Also listen for future language changes from i18n.changeLanguage()
    i18n.on("languageChanged", apply);
    return () => { i18n.off("languageChanged", apply); };
  }, [lang, i18n]);

  return <>{children}</>;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes — no re-fetch when navigating between pages
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 10 minutes so back-navigation is instant
        gcTime: 10 * 60 * 1000,
        // Don't retry on 4xx errors (auth, not found) — only on network failures
        retry: (failureCount, error: unknown) => {
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DirectionSync>
            {children}
            <Toaster />
          </DirectionSync>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
