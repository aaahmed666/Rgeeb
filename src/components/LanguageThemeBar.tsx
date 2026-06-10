"use client";

/**
 * LanguageThemeBar
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared toolbar shown on Login and Register pages.
 *
 * Features:
 *  • Language toggle  – EN ↔ AR  (switches dir + i18n + persists in localStorage)
 *  • Theme toggle     – light ↔ dark  (persists in localStorage, no flash)
 *
 * Flash prevention:
 *  The layout.tsx / _document should already inject the inline script
 *  (see ThemeScriptInline export below) into <head> BEFORE any CSS loads.
 *  This reads localStorage and sets data-theme + dir on <html> immediately,
 *  preventing any flash of wrong theme or direction.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as React from "react";
import { Globe, Moon, Sun } from "lucide-react";
import i18n from "@/lib/i18n";

// ── Storage keys ──────────────────────────────────────────────────────────────
const THEME_KEY = "app.theme";
const LANG_KEY = "app.language"; // must match i18n detection key

// ── Types ─────────────────────────────────────────────────────────────────────
type Theme = "light" | "dark";
type Lang = "en" | "ar";

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

function applyLang(lang: Lang) {
  const root = document.documentElement;
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.body.dir = lang === "ar" ? "rtl" : "ltr";
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
  // Sync with react-i18next so translations actually change
  i18n.changeLanguage(lang);
}

function readStored<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

// ── Inline script (inject into <head> to prevent flash) ───────────────────────
/**
 * Insert <ThemeScriptInline /> as the FIRST child of <head> in layout.tsx.
 * It runs synchronously before paint so there is zero flash.
 *
 * Usage in layout.tsx:
 *   import { ThemeScriptInline } from "@/components/LanguageThemeBar";
 *   <head><ThemeScriptInline /></head>
 */
export function ThemeScriptInline() {
  const script = `
(function(){
  try {
    var theme = localStorage.getItem('${THEME_KEY}') || 'light';
    var lang  = localStorage.getItem('app.language')  || 'en';
    var root  = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    root.setAttribute('data-theme', theme);
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  } catch(e) {}
})();
  `.trim();

  // dangerouslySetInnerHTML is required here — this is an intentional inline
  // synchronous script to prevent flash.
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

// ── Hook (share state across both pages via a simple event bus) ───────────────
type BarState = { theme: Theme; lang: Lang };

const EVENT = "lang-theme-bar-change";

function dispatchChange(state: BarState) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
}

export function useLanguageTheme() {
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [lang, setLangState] = React.useState<Lang>("en");

  // Read from i18n / storage once on mount (SSR safe — always starts light/en)
  React.useEffect(() => {
    setThemeState(readStored<Theme>(THEME_KEY, "light"));
    // Prefer i18n's resolved language over raw localStorage
    const currentLang = (i18n.resolvedLanguage ??
      i18n.language ??
      readStored<Lang>(LANG_KEY, "en")) as Lang;
    setLangState(currentLang === "ar" ? "ar" : "en");
  }, []);

  // Listen for changes from other components on the same page
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<BarState>).detail;
      setThemeState(detail.theme);
      setLangState(detail.lang);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  // Listen for i18n language changes triggered from other components (e.g. LanguageSwitcher)
  React.useEffect(() => {
    const onLangChanged = (lng: string) => {
      setLangState(lng === "ar" ? "ar" : "en");
    };
    i18n.on("languageChanged", onLangChanged);
    return () => {
      i18n.off("languageChanged", onLangChanged);
    };
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      dispatchChange({ theme: next, lang: readStored<Lang>(LANG_KEY, "en") });
      return next;
    });
  }, []);

  const toggleLang = React.useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "en" ? "ar" : "en";
      applyLang(next);
      dispatchChange({
        theme: readStored<Theme>(THEME_KEY, "light"),
        lang: next,
      });
      return next;
    });
  }, []);

  return { theme, lang, toggleTheme, toggleLang };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface LanguageThemeBarProps {
  /** Override position. Defaults to top-right absolute. */
  className?: string;
}

export function LanguageThemeBar({ className }: LanguageThemeBarProps) {
  const { theme, lang, toggleTheme, toggleLang } = useLanguageTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: isDark ? "rgba(15,30,58,0.85)" : "rgba(240,238,234,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 9999,
        padding: "4px 6px",
        border: isDark
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid rgba(15,30,58,0.12)",
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.35)"
          : "0 4px 24px rgba(15,30,58,0.1)",
        userSelect: "none",
      }}
    >
      {/* ── Language toggle ── */}
      <button
        onClick={toggleLang}
        title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 9999,
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          fontFamily:
            lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif",
          letterSpacing: lang === "en" ? "0.04em" : "0",
          background: "#F97316",
          color: "#fff",
          transition: "opacity 0.18s, transform 0.18s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <Globe
          size={15}
          strokeWidth={2.5}
        />
        {lang === "en" ? "EN" : "AR"}
      </button>

      {/* ── Inactive language label ── */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 12px",
          fontSize: 14,
          fontWeight: 600,
          fontFamily:
            lang === "ar" ? "'Inter', sans-serif" : "'Cairo', sans-serif",
          color: isDark ? "rgba(255,255,255,0.55)" : "rgba(15,30,58,0.5)",
          cursor: "pointer",
          borderRadius: 9999,
          transition: "color 0.18s",
        }}
        onClick={toggleLang}
        title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
      >
        {/* Arabic ع or Latin E indicator */}
        <span style={{ fontSize: 16, lineHeight: 1 }}>
          {lang === "en" ? "ع" : "E"}
        </span>
        {lang === "en" ? "AR" : "EN"}
      </span>

      {/* ── Divider ── */}
      <span
        style={{
          width: 1,
          height: 20,
          background: isDark ? "rgba(255,255,255,0.15)" : "rgba(15,30,58,0.15)",
          margin: "0 2px",
          borderRadius: 1,
        }}
      />

      {/* ── Theme toggle ── */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: 9999,
          border: "none",
          cursor: "pointer",
          background: isDark ? "#F97316" : "transparent",
          color: isDark
            ? "#fff"
            : isDark
              ? "rgba(255,255,255,0.6)"
              : "rgba(15,30,58,0.5)",
          transition: "background 0.2s, color 0.2s, transform 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isDark)
            e.currentTarget.style.background = "rgba(249,115,22,0.12)";
          e.currentTarget.style.transform = "rotate(15deg) scale(1.1)";
        }}
        onMouseLeave={(e) => {
          if (!isDark) e.currentTarget.style.background = "transparent";
          e.currentTarget.style.transform = "rotate(0) scale(1)";
        }}
      >
        {isDark ? (
          <Moon
            size={16}
            strokeWidth={2.5}
          />
        ) : (
          <Sun
            size={16}
            strokeWidth={2.5}
            color="rgba(15,30,58,0.55)"
          />
        )}
      </button>
    </div>
  );
}
