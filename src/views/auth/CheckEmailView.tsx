"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthUI, AuthTopBar } from "@/components/auth-context";
import { sendOtpRequest } from "@/services/authService";
import { EmailIllustration, Icon } from "@/app/assets/icons/auth-icon";
import "./auth-shared.css";
import "./auth-check-email.css";

export default function CheckEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { isDark, isRtl } = useAuthUI();
  const { t } = useTranslation();

  const [resendCountdown, setResendCountdown] = useState(60);
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

  const showToast = useCallback((msg: string, success = false) => {
    setToast({ msg, visible: true, success });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2800);
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || !email) return;
    try {
      await sendOtpRequest(email);
      setResendCountdown(60);
      showToast(t("auth.checkEmail.resendSuccess"), true);
    } catch {
      showToast(t("auth.checkEmail.resendFail"), false);
    }
  }, [email, resendCountdown, showToast, t]);

  const handleContinue = () => {
    router.push(`/otp?email=${encodeURIComponent(email)}`);
  };

  // ── colours
  const cardBg = isDark ? "#2E3F5C" : "#FFFFFF";
  const cardShadow = isDark
    ? "0 32px 80px rgba(0,0,0,0.55)"
    : "0 24px 64px rgba(15,30,58,0.12)";
  const textMain = isDark ? "#F1F5F9" : "#263450";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const textFaint = isDark ? "#64748B" : "#9CA3AF";
  const previewBg = isDark ? "rgba(249,115,22,0.06)" : "rgba(249,115,22,0.04)";
  const previewBdr = isDark ? "rgba(249,115,22,0.28)" : "rgba(249,115,22,0.22)";
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
        className="auth-card ce-card"
        style={{ background: cardBg, boxShadow: cardShadow }}
      >
        <div className="auth-single-card-corner" />

        {/* Back */}
        <button
          className="auth-back-btn auth-b0"
          onClick={() => router.push("/login")}
          style={{ color: textMuted, marginBottom: 12, padding: "6px 0" }}
        >
          <Icon.ArrowLeft />
          {t("auth.checkEmail.backToSignIn")}
        </button>

        {/* Illustration */}
        <div
          className="auth-b1"
          style={{ marginBottom: 28 }}
        >
          <EmailIllustration isDark={isDark} />
        </div>

        {/* Title */}
        <div
          className="auth-b2"
          style={{ marginBottom: 24 }}
        >
          <h1
            className="ce-title"
            style={{ color: textMain, letterSpacing: isRtl ? 0 : "-0.5px" }}
          >
            {t("auth.checkEmail.title")}
          </h1>
          <p
            className="ce-subtitle"
            style={{ color: textMuted }}
          >
            {t("auth.checkEmail.sentTo")}{" "}
            <strong style={{ color: textMain, fontWeight: 700 }}>
              {email || "your email"}
            </strong>
          </p>
          <p
            className="ce-desc"
            style={{ color: textFaint }}
          >
            {t("auth.checkEmail.desc")}
          </p>
        </div>

        {/* Email preview */}
        <div
          className="auth-b3 ce-preview"
          style={{
            background: previewBg,
            border: `1.5px dashed ${previewBdr}`,
          }}
        >
          <div className="ce-preview-icon">
            <Icon.EmailEnvelope />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="ce-preview-from"
              style={{ color: textMuted }}
            >
              {t("auth.checkEmail.previewFrom")}
            </div>
            <div
              className="ce-preview-subject"
              style={{ color: isDark ? "#E2E8F0" : "#263450" }}
            >
              {t("auth.checkEmail.previewSubject")}
            </div>
          </div>
          <div className="ce-now-badge">
            <span className="ce-now-dot" />
            <span className="ce-now-text">{t("auth.checkEmail.nowLabel")}</span>
          </div>
        </div>

        {/* Continue button */}
        <button
          type="button"
          className="auth-btn-primary auth-b4"
          onClick={handleContinue}
          style={{ width: "100%", marginBottom: 20 }}
        >
          {t("auth.checkEmail.continueBtn")}
          <Icon.ArrowRightBtn rtl={isRtl} />
        </button>

        {/* Resend */}
        <div className="ce-resend-row auth-b5">
          <span style={{ fontSize: 13.5, color: textFaint }}>
            {t("auth.checkEmail.didntReceive")}{" "}
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
              ? `${t("auth.checkEmail.resendIn")} ${resendCountdown}s`
              : t("auth.checkEmail.resendCode")}
          </button>
        </div>

        <div className="ce-change-row auth-b6">
          <button
            onClick={() => router.push("/login")}
            className="auth-resend-btn"
            style={{ fontSize: 13, color: textFaint, cursor: "pointer" }}
          >
            {t("auth.checkEmail.changeEmail")}
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
