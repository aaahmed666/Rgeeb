import React from "react";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { AuthUIProvider } from "@/components/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "RGEEB Dashboard",
  description: "AI-powered security & analytics platform",
};

// Runs synchronously before first paint — reads localStorage and applies the
// correct theme class to <html> so there is zero flash on load or refresh.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('app.theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || (!stored && prefersDark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    var lang = localStorage.getItem('app.language');
    if (lang === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  } catch (e) {}
})();
`.trim();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script — must be first in <head> before any CSS or paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AuthUIProvider>{children}</AuthUIProvider>
        </Providers>
      </body>
    </html>
  );
}
