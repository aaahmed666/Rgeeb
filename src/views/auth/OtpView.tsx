"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { sendOtpRequest } from "@/services/authService";
import { useAuthUI, AuthTopBar } from "@/components/auth-context";
import { OtpIllustration, Icon } from "@/app/assets/icons/auth-icon";
import "./auth-shared.css";
import "./auth-otp.css";

// ── Normalise a string so Arabic-Indic / Eastern-Arabic digits become ASCII ──
// Covers: Arabic-Indic ٠-٩ (U+0660-U+0669) and
//         Extended Arabic-Indic ۰-۹ (U+06F0-U+06F9)
function normaliseDigits(raw: string): string {
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}

// ── OTP digit input ───────────────────────────────────────────────────────────
function OtpDigits({
  value,
  onChange,
  hasError,
  isDark,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  isDark: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const handleChange = (idx: number, raw: string) => {
    const d = normaliseDigits(raw).slice(-1);
    const next = [...digits];
    next[idx] = d;
    onChange(next.join(""));
    if (d && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        const next = [...digits];
        next[idx - 1] = "";
        onChange(next.join(""));
        refs.current[idx - 1]?.focus();
      } else {
        const next = [...digits];
        next[idx] = "";
        onChange(next.join(""));
      }
    } else if (e.key === "ArrowLeft" && idx > 0) refs.current[idx - 1]?.focus();
    else if (e.key === "ArrowRight" && idx < 5) refs.current[idx + 1]?.focus();
  };

  // Paste: works for both LTR and RTL — normalise first, then fill slots
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = normaliseDigits(e.clipboardData.getData("text")).slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const borderColor = (d: string) =>
    hasError
      ? "#EF4444"
      : d
        ? "#F97316"
        : isDark
          ? "rgba(255,255,255,0.12)"
          : "rgba(15,30,58,0.14)";
  const bg = (d: string) =>
    d
      ? isDark
        ? "rgba(249,115,22,0.1)"
        : "rgba(249,115,22,0.05)"
      : isDark
        ? "#263450"
        : "#F9FAFB";

  return (
    <div className="auth-otp-row">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={d}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="auth-otp-input"
          style={{
            border: `2px solid ${borderColor(d)}`,
            background: bg(d),
            color: isDark ? "#F1F5F9" : "#263450",
            transform: d ? "scale(1.04)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OtpView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { isDark, isRtl } = useAuthUI();
  const { t } = useTranslation();

  // Guard: redirect back to forgot-password if no email in URL
  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [expiry, setExpiry] = useState(300);
  const [toast, setToast] = useState<{
    msg: string;
    visible: boolean;
    success?: boolean;
  }>({
    msg: "",
    visible: false,
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  useEffect(() => {
    if (expiry <= 0) return;
    const id = setInterval(() => setExpiry((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback((msg: string, success = false) => {
    setToast({ msg, visible: true, success });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2800);
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || !email) return;
    try {
      await sendOtpRequest(email);
      setResendCountdown(60);
      setExpiry(300);
      showToast(t("auth.otp.resendCode"), true);
    } catch {
      showToast(t("auth.shared.emailError"), false);
    }
  }, [email, resendCountdown, showToast, t]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      setCodeError(t("auth.otp.invalidCode"));
      return;
    }
    setLoading(true);
    setCodeError("");
    try {
      /**
       * FIX: OtpView is used in the forgot-password flow (not 2FA).
       * The correct behaviour after the user enters the OTP code is:
       *   → redirect to /reset-password?email=...&token=<code>
       * The backend will validate the OTP on the reset-password call.
       *
       * Previously this was incorrectly calling endpoints.security.twoFactorVerify
       * which is the 2FA endpoint (/customer/2fa/verify) — completely wrong context.
       */
      showToast(t("auth.otp.success"), true);
      setTimeout(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(code)}`
        );
      }, 600);
    } catch (err) {
      setCodeError(
        err instanceof Error ? err.message : t("auth.otp.wrongCode")
      );
    } finally {
      setLoading(false);
    }
  }, [code, email, t, showToast, router]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── colours
  const cardBg = isDark ? "#2E3F5C" : "#FFFFFF";
  const cardShadow = isDark
    ? "0 32px 80px rgba(0,0,0,0.55)"
    : "0 24px 64px rgba(15,30,58,0.12)";
  const textMain = isDark ? "#F1F5F9" : "#263450";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const textFaint = isDark ? "#64748B" : "#9CA3AF";
  const stepBg = (n: number) =>
    n <= 2 ? "#F97316" : isDark ? "#354769" : "#F3F4F6";
  const stepColor = (n: number) =>
    n <= 2 ? "#fff" : isDark ? "#475569" : "#9CA3AF";
  const lineBg = (n: number) =>
    n < 2 ? "#F97316" : isDark ? "#354769" : "#E5E7EB";
  const expiryColor = expiry < 60 ? "#EF4444" : textFaint;
  const resendColor =
    resendCountdown > 0 ? (isDark ? "#475569" : "#CBD5E1") : "#F97316";

  return (
    <div
      className="auth-page-wrapper"
      style={{
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif",
        direction: isRtl ? "rtl" : "ltr",
        background: isDark
          ? "radial-gradient(ellipse 80% 60% at 60% -10%, rgba(249,115,22,0.16) 0%, transparent 60%), #1C2D45"
          : "radial-gradient(ellipse 80% 60% at 60% -10%, rgba(249,115,22,0.09) 0%, transparent 60%), #EDE8E0",
      }}
    >
      <AuthTopBar />

      <div
        className="auth-card otp-card"
        style={{ background: cardBg, boxShadow: cardShadow }}
      >
        <div className="auth-single-card-corner" />

        {/* Back */}
        <button
          className="auth-back-btn auth-b0"
          onClick={() =>
            router.push(`/check-email?email=${encodeURIComponent(email)}`)
          }
          style={{ color: textMuted, marginBottom: 20, padding: "6px 0" }}
        >
          <Icon.ArrowLeft />
          {t("auth.otp.backToLogin")}
        </button>

        {/* Step progress */}
        <div className="otp-steps auth-b1">
          {[1, 2, 3].map((step, idx) => (
            <div
              key={step}
              className="otp-step-item"
            >
              <div
                className="otp-step-dot"
                style={{ background: stepBg(step), color: stepColor(step) }}
              >
                {step < 2 ? <Icon.StepCheck /> : step}
              </div>
              {idx < 2 && (
                <div
                  className="otp-step-line"
                  style={{ background: lineBg(step) }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Shield */}
        <div className="otp-shield-wrap auth-b2">
          <div
            className="otp-shield-box"
            style={{
              background: isDark
                ? "rgba(249,115,22,0.1)"
                : "rgba(249,115,22,0.07)",
            }}
          >
            <OtpIllustration isDark={isDark} />
          </div>
        </div>

        {/* Title */}
        <div
          className="auth-b3"
          style={{ marginBottom: 24 }}
        >
          <h1
            className="otp-title"
            style={{ color: textMain, letterSpacing: isRtl ? 0 : "-0.5px" }}
          >
            {t("auth.otp.title")}
          </h1>
          <p
            className="otp-subtitle"
            style={{ color: textMuted }}
          >
            {t("auth.otp.sentTo")}{" "}
            <strong style={{ color: "#F97316", fontWeight: 700 }}>
              {email || "your email"}
            </strong>
          </p>
        </div>

        {/* OTP digits */}
        <div
          className={`otp-digits-wrap auth-b4${codeError ? " auth-otp-shake" : ""}`}
        >
          <OtpDigits
            value={code}
            onChange={(v) => {
              setCode(v);
              setCodeError("");
            }}
            hasError={!!codeError}
            isDark={isDark}
          />
        </div>

        {/* Error */}
        {codeError && (
          <div className="otp-error-row auth-b4">
            <p className="otp-error-text">
              <Icon.ErrorCircle />
              {codeError}
            </p>
          </div>
        )}

        {/* Expiry */}
        <div className="otp-expiry auth-b5">
          <span
            className="otp-expiry-text"
            style={{ color: expiryColor, fontWeight: expiry < 60 ? 600 : 400 }}
          >
            <Icon.ClockTimer />
            {t("auth.otp.codeExpires")}: {formatTime(expiry)}
          </span>
        </div>

        {/* Verify button */}
        <button
          type="button"
          className="auth-btn-primary auth-b6"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          style={{
            width: "100%",
            marginBottom: 20,
            opacity: loading || code.length !== 6 ? 0.6 : 1,
          }}
        >
          {loading ? (
            <Icon.Spinner />
          ) : (
            <>
              {t("auth.otp.verifyBtn")} <Icon.VerifyCheck />
            </>
          )}
        </button>

        {/* Resend */}
        <div className="otp-resend-row auth-b7">
          <span style={{ fontSize: 13.5, color: textFaint }}>
            {t("auth.otp.didntReceive")}{" "}
          </span>
          <button
            className="auth-resend-btn"
            onClick={handleResend}
            disabled={resendCountdown > 0}
            style={{
              color: resendColor,
              cursor: resendCountdown > 0 ? "default" : "pointer",
            }}
          >
            {resendCountdown > 0
              ? `${t("auth.otp.resendIn")} ${resendCountdown}s`
              : t("auth.otp.resendCode")}
          </button>
        </div>
      </div>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className="auth-toast"
        style={{
          transform: `translateX(-50%) translateY(${toast.visible ? "0" : "80px"})`,
          background: isDark ? "#2E3F5C" : "#263450",
          color: "#fff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        {toast.success ? <Icon.ToastSuccess /> : <Icon.ToastWarning />}
        {toast.msg}
      </div>
    </div>
  );
}
