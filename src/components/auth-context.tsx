"use client";

/**
 * Shared auth UI primitives used across all auth pages.
 *
 * Exports:
 *  - useAuthUI()           → { isDark, isRtl, lang, theme, setTheme, setLang }
 *  - useAuthTranslations() → translation record for current lang
 *  - <AuthTopBar />        → theme + language switcher bar
 *  - <AuthLeftPanel />     → branded dark left panel with shield illustration
 *  - <AuthToast />         → floating toast notification
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { isRtl as checkRtl } from "@/lib/i18n";
import { ShieldIllustration, Icon } from "@/app/assets/icons/auth-icon";
import { COLORS } from "@/components/auth-styles";
import { useTheme as useAppTheme } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "ar";
type Theme = "light" | "dark";

// AUTH_TRANSLATIONS removed — all strings now live in
// src/i18n/locales/en.json and ar.json under the "auth" namespace.

// ─── AuthTranslations type (mirrors the JSON shape) ───────────────────────────

export interface AuthTranslations {
  brand: {
    tag: string;
    name: string;
    headline0: string;
    headline1: string;
    priority: string;
    desc: string;
    protected: string;
    monitor: string;
    uptime: string;
    users: string;
    certified: string;
  };
  login: {
    welcome: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    forgotPassword: string;
    rememberMe: string;
    signIn: string;
    orContinueWith: string;
    faceId: string;
    createAccount: string;
    terms: string;
    termsLink: string;
    and: string;
    privacyLink: string;
    emailError: string;
    passwordError: string;
    successToast: string;
    comingSoon: string;
    checkEmailTitle: string;
    checkEmailSubtitle: string;
    checkEmailDesc: string;
    checkEmailContinue: string;
    otpTitle: string;
    otpSubtitle: string;
    otpVerifyBtn: string;
    otpError: string;
    otpInvalid: string;
    otpBackToLogin: string;
    otpCodeExpires: string;
  };
  register: {
    headline: string;
    headlineAccent: string;
    subDesc: string;
    stepOf: string;
    step1Label: string;
    step1Sub: string;
    step2Label: string;
    step2Sub: string;
    step3Label: string;
    step3Sub: string;
    step4Label: string;
    step4Sub: string;
    basicTitle: string;
    basicSubtitle: string;
    nameAr: string;
    nameArPlaceholder: string;
    nameEn: string;
    nameEnPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    password: string;
    confirmPassword: string;
    country: string;
    city: string;
    selectCountry: string;
    selectCity: string;
    selectCountryFirst: string;
    categoryTitle: string;
    categorySubtitle: string;
    verifyTitle: string;
    verifySentTo: string;
    didntReceive: string;
    resendCode: string;
    sendingCode: string;
    resendIn: string;
    packageTitle: string;
    packageSubtitle: string;
    back: string;
    continue: string;
    createAccount: string;
    alreadyHaveAccount: string;
    signIn: string;
    successCreate: string;
    errorNameAr: string;
    errorNameEn: string;
    errorEmail: string;
    errorPhone: string;
    errorPassword: string;
    errorConfirm: string;
    errorCountry: string;
    errorCity: string;
    errorCategory: string;
    errorCode: string;
    errorPackage: string;
    errorCreate: string;
    strengthWeak: string;
    strengthFair: string;
    strengthGood: string;
    strengthStrong: string;
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    emailLabel: string;
    send: string;
    sent: string;
    sentDesc: string;
    sentTo: string;
    backToLogin: string;
    successToast: string;
    failToast: string;
    emailError: string;
  };
  resetPassword: {
    title: string;
    subtitle: string;
    emailLabel: string;
    tokenLabel: string;
    tokenPlaceholder: string;
    newPassword: string;
    confirmPassword: string;
    submit: string;
    back: string;
    successTitle: string;
    successDesc: string;
    goToSignIn: string;
    passwordsMatch: string;
    passwordsMismatch: string;
    errorEmail: string;
    errorToken: string;
    errorPassword: string;
    errorConfirm: string;
    errorGeneral: string;
    strengthWeak: string;
    strengthFair: string;
    strengthGood: string;
    strengthStrong: string;
  };
  checkEmail: {
    title: string;
    sentTo: string;
    desc: string;
    previewFrom: string;
    previewSubject: string;
    continueBtn: string;
    didntReceive: string;
    resendCode: string;
    resendIn: string;
    changeEmail: string;
    backToSignIn: string;
    resendSuccess: string;
    resendFail: string;
    nowLabel: string;
  };
  otp: {
    title: string;
    sentTo: string;
    verifyBtn: string;
    codeExpires: string;
    didntReceive: string;
    resendCode: string;
    resendIn: string;
    backToLogin: string;
    invalidCode: string;
    wrongCode: string;
    success: string;
  };
  shared: {
    emailError: string;
    backToLogin: string;
    langEn: string;
    langAr: string;
    securityPlatform: string;
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthUICtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  isDark: boolean;
  isRtl: boolean;
}

// Sentinel so we can detect "no provider" reliably
const _NO_PROVIDER = Symbol("no-provider");
const AuthUIContext = React.createContext<AuthUICtx | typeof _NO_PROVIDER>(
  _NO_PROVIDER
);

// ─── Storage helpers ──────────────────────────────────────────────────────────

const THEME_KEY = "app.theme";
const LANG_KEY = "app.lang";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"; // SSR: default to light (no dark class on html)
  // Read from the DOM class the blocking inline script already applied —
  // guaranteed to match reality, never causes a flash.
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function readStoredLang(fallback: string): Lang {
  if (typeof window === "undefined") return "en";
  const s = window.localStorage.getItem(LANG_KEY) as Lang | null;
  if (s === "en" || s === "ar") return s;
  return fallback.startsWith("ar") ? "ar" : "en";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  // Delegate theme state to ThemeProvider — single source of truth.
  // ThemeProvider (lib/theme.tsx) already applies the DOM class and persists to
  // localStorage, so AuthUIProvider must not duplicate that work.
  const { theme, setTheme } = useAppTheme();

  const [lang, setLangState] = React.useState<Lang>(() =>
    readStoredLang(i18n.resolvedLanguage ?? i18n.language ?? "en")
  );

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = checkRtl(lang) ? "rtl" : "ltr";
    window.localStorage.setItem(LANG_KEY, lang);
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const setLang = React.useCallback((l: Lang) => setLangState(l), []);

  const value: AuthUICtx = React.useMemo(
    () => ({
      lang,
      setLang,
      theme,
      setTheme,
      isDark: theme === "dark",
      isRtl: checkRtl(lang),
    }),
    [lang, setLang, theme, setTheme]
  );

  return (
    <AuthUIContext.Provider value={value}>{children}</AuthUIContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Returns current theme/direction state and setters.
 * When used inside <AuthUIProvider> it reads shared context.
 * When used outside (e.g. a view rendered without the provider), it creates
 * local state initialised from localStorage — so no flash either way.
 */
export function useAuthUI(): AuthUICtx {
  const ctx = React.useContext(AuthUIContext);
  const { i18n } = useTranslation();

  // These local states are only used in the fallback path
  const [langLocal, setLangLocal] = React.useState<Lang>(() =>
    readStoredLang(i18n.resolvedLanguage ?? i18n.language ?? "en")
  );
  const [themeLocal, setThemeLocal] = React.useState<Theme>(() =>
    readStoredTheme()
  );

  if (ctx !== _NO_PROVIDER) {
    return ctx as AuthUICtx;
  }

  // Fallback — outside provider
  return {
    lang: langLocal,
    setLang: (l: Lang) => {
      setLangLocal(l);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LANG_KEY, l);
        document.documentElement.lang = l;
        document.documentElement.dir = checkRtl(l) ? "rtl" : "ltr";
      }
      i18n.changeLanguage(l);
    },
    theme: themeLocal,
    setTheme: (t: Theme) => {
      setThemeLocal(t);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_KEY, t);
        document.documentElement.classList.toggle("dark", t === "dark");
        document.documentElement.style.colorScheme = t;
      }
    },
    isDark: themeLocal === "dark",
    isRtl: checkRtl(langLocal),
  };
}

/**
 * Returns the full auth translation object for the current language,
 * sourced from en.json / ar.json under the "auth" namespace.
 */
export function useAuthTranslations(): AuthTranslations {
  const { t } = useTranslation();
  // Return a typed proxy so callers can do tr.login.signIn etc.
  return t("auth", { returnObjects: true }) as AuthTranslations;
}

// ─── AuthTopBar ───────────────────────────────────────────────────────────────

export function AuthTopBar() {
  const { lang, setLang, theme, setTheme, isRtl } = useAuthUI();

  return (
    <>
      {/*
        Static CSS only — no isDark interpolation.
        Light values are the default; .dark overrides apply when the <html>
        element carries the "dark" class (set by the blocking inline script
        before first paint, and kept in sync by ThemeProvider).
        This eliminates the SSR/client hydration mismatch that occurred when
        isDark was interpolated into the style string at render time.
      */}
      <style>{`
        .auth-topbar-pill { position:fixed; top:18px; z-index:200; display:flex; align-items:center; gap:2px; background:rgba(255,255,255,0.88); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(15,30,58,0.10); border-radius:50px; padding:4px; box-shadow:0 4px 24px rgba(0,0,0,0.14); transition:background 0.3s,border-color 0.3s; }
        .dark .auth-topbar-pill { background:rgba(15,22,40,0.88); border-color:rgba(255,255,255,0.09); }
        .auth-tb-btn { display:flex; align-items:center; gap:6px; padding:7px 13px; border-radius:50px; border:none; background:transparent; cursor:pointer; font-size:13px; font-weight:700; letter-spacing:0.3px; transition:background 0.2s,color 0.2s,box-shadow 0.2s; line-height:1; color:#64748B; font-family:inherit; }
        .dark .auth-tb-btn { color:#94A3B8; }
        .auth-tb-btn:hover { color:#F97316 !important; }
        .auth-tb-btn.auth-tb-active { background:#F97316 !important; color:#fff !important; box-shadow:0 3px 14px rgba(249,115,22,0.45); }
        .auth-tb-divider { width:1px; height:22px; background:rgba(15,30,58,0.12); margin:0 3px; flex-shrink:0; }
        .dark .auth-tb-divider { background:rgba(255,255,255,0.12); }
        .auth-tb-icon-btn { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50px; border:none; background:transparent; cursor:pointer; transition:background 0.2s,color 0.2s,box-shadow 0.2s; color:#64748B; font-family:inherit; flex-shrink:0; }
        .dark .auth-tb-icon-btn { color:#94A3B8; }
        .auth-tb-icon-btn:hover { color:#F97316 !important; }
        .auth-tb-icon-btn.auth-tb-active { background:#F97316 !important; color:#fff !important; box-shadow:0 3px 14px rgba(249,115,22,0.45); }
      `}</style>
      {/* Pill container — floats top-right (or top-left in RTL) */}
      <div
        className="auth-topbar-pill"
        style={{ [isRtl ? "left" : "right"]: 20 }}
        suppressHydrationWarning
      >
        {/* EN */}
        <button
          className={`auth-tb-btn${lang === "en" ? " auth-tb-active" : ""}`}
          onClick={() => setLang("en")}
          aria-label="English"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle
              cx="10"
              cy="10"
              r="8.5"
            />
            <path d="M10 1.5C10 1.5 7 5 7 10s3 8.5 3 8.5M10 1.5C10 1.5 13 5 13 10s-3 8.5-3 8.5M1.5 10h17M2 6.5h16M2 13.5h16" />
          </svg>
          EN
        </button>

        {/* AR */}
        <button
          className={`auth-tb-btn${lang === "ar" ? " auth-tb-active" : ""}`}
          onClick={() => setLang("ar")}
          aria-label="Arabic"
        >
          <span
            style={{
              fontSize: 15,
              fontFamily: "'Cairo',sans-serif",
              lineHeight: 1,
            }}
          >
            ع
          </span>
          AR
        </button>

        {/* Divider */}
        <div className="auth-tb-divider" />

        {/* Sun — light */}
        <button
          className={`auth-tb-icon-btn${theme === "light" ? " auth-tb-active" : ""}`}
          onClick={() => setTheme("light")}
          aria-label="Light mode"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle
              cx="10"
              cy="10"
              r="4"
            />
            <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.2 4.2l1.1 1.1M14.7 14.7l1.1 1.1M4.2 15.8l1.1-1.1M14.7 5.3l1.1-1.1" />
          </svg>
        </button>

        {/* Moon — dark */}
        <button
          className={`auth-tb-icon-btn${theme === "dark" ? " auth-tb-active" : ""}`}
          onClick={() => setTheme("dark")}
          aria-label="Dark mode"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M17 11.5A7.5 7.5 0 118.5 3a5.5 5.5 0 108.5 8.5z" />
          </svg>
        </button>
      </div>
    </>
  );
}

// ─── AuthLeftPanel ────────────────────────────────────────────────────────────

export function AuthLeftPanel() {
  const { isRtl } = useAuthUI();
  const { t } = useTranslation();
  const tr = {
    brandName: t("auth.brand.name"),
    brandTag: t("auth.brand.tag"),
    headline: [t("auth.brand.headline0"), t("auth.brand.headline1")] as [
      string,
      string,
    ],
    priority: t("auth.brand.priority"),
    desc: t("auth.brand.desc"),
    protected: t("auth.brand.protected"),
    monitor: t("auth.brand.monitor"),
    uptime: t("auth.brand.uptime"),
    users: t("auth.brand.users"),
    certified: t("auth.brand.certified"),
  };

  return (
    <div
      className="auth-left"
      style={{
        width: 420,
        flexShrink: 0,
        background:
          "linear-gradient(160deg, #243552 0%, #263450 45%, #1C2D45 100%)",
        padding: "52px 44px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(249,115,22,0.04) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />
      {/* Orange glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Brand mark */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg,#F97316,#EA580C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(249,115,22,0.45)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              {tr.brandName}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(255,255,255,0.42)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {tr.brandTag}
            </div>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ marginTop: 44, position: "relative", zIndex: 2 }}>
        <h2
          style={{
            fontSize: 38,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#fff",
            letterSpacing: isRtl ? 0 : "-1px",
            margin: 0,
          }}
        >
          {tr.headline[0]}
          <br />
          {tr.headline[1]}
          <em style={{ color: "#F97316", fontStyle: "normal" }}>
            {tr.priority}
          </em>
        </h2>
        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            color: "rgba(255,255,255,0.48)",
            lineHeight: 1.75,
            maxWidth: 280,
          }}
        >
          {tr.desc}
        </p>
      </div>

      {/* Shield illustration */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          margin: "20px 0",
        }}
      >
        {/* Protected badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            [isRtl ? "right" : "left"]: 0,
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 50,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#22C55E",
              boxShadow: "0 0 8px #22C55E",
              flexShrink: 0,
            }}
          />
          {tr.protected}
        </div>

        <ShieldIllustration />
      </div>

      {/* Stats row */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          gap: 16,
          marginTop: "auto",
        }}
      >
        {[
          { label: tr.monitor, value: "" },
          { label: tr.uptime, value: "99.9%" },
          { label: tr.certified, value: "ISO" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ flex: 1 }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#F97316",
                marginBottom: 2,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.42)",
                lineHeight: 1.4,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AuthToast ────────────────────────────────────────────────────────────────

interface AuthToastProps {
  msg: string;
  visible: boolean;
  success?: boolean;
  isDark?: boolean;
}

export function AuthToast({ msg, visible, success = true }: AuthToastProps) {
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 24}px)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s, transform 0.3s",
        zIndex: 9999,
        background: success
          ? "linear-gradient(135deg,#22C55E,#16A34A)"
          : "linear-gradient(135deg,#EF4444,#DC2626)",
        color: "#fff",
        borderRadius: 14,
        padding: "14px 24px",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: success
          ? "0 8px 32px rgba(34,197,94,0.35)"
          : "0 8px 32px rgba(239,68,68,0.35)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 220,
        maxWidth: 380,
        whiteSpace: "nowrap",
      }}
    >
      {success ? <Icon.ToastSuccess /> : <Icon.ToastWarning />}
      {msg}
    </div>
  );
}
