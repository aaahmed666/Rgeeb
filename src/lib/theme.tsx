"use client";

import * as React from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "app.theme";

/**
 * Read the theme that the blocking inline script already applied to <html>.
 * This never returns a "wrong" value because the script runs before React
 * hydrates — so React's initial state always matches the DOM.
 */
function readAppliedTheme(): Theme {
  if (typeof window === "undefined") return "light"; // SSR: default to light — matches no-class HTML default
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from the DOM class that the blocking script already set —
  // guaranteed to match, so no hydration mismatch and no post-paint flash.
  const [theme, setThemeState] = React.useState<Theme>(readAppliedTheme);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
