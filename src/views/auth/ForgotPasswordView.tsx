"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { sendOtpRequest } from "@/services/authService";
import {
  AuthLeftPanel,
  AuthToast,
  AuthTopBar,
} from "@/components/auth-context";
import { useAuthUI } from "@/components/auth-context";
import { Icon, LockIllustration } from "@/app/assets/icons/auth-icon";
import {
  COLORS,
  getAuthPageBg,
  getCardShadow,
  getInputStyle,
  getPrimaryBtnStyle,
} from "@/components/auth-styles";
import "./auth-shared.css";
import "./auth-forgot-password.css";

/**
 * Forgot Password Flow (OTP-based):
 *  1. User enters email → POST /customer/email/send-otp
 *  2. User is redirected to /check-email?email=... then /otp?email=...
 *  3. After OTP verification they can set a new password via profile/update
 */
export default function ForgotPasswordView() {
  const { isDark, isRtl } = useAuthUI();
  const { t } = useTranslation();

  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{
    msg: string;
    visible: boolean;
    success?: boolean;
  }>({ msg: "", visible: false });

  const showToast = React.useCallback((msg: string, success = false) => {
    setToast({ msg, visible: true, success });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000);
  }, []);

  const handleSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t("auth.forgotPassword.emailError"));
      return;
    }
    setLoading(true);
    try {
      // Send OTP to the email — user will verify via /check-email → /otp
      await sendOtpRequest(email);
      setSent(true);
      showToast(t("auth.forgotPassword.successToast"), true);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("auth.forgotPassword.failToast"),
        false
      );
    } finally {
      setLoading(false);
    }
  };

  const textMain = isDark ? COLORS.textDark : COLORS.textLight;
  const textMuted = isDark ? COLORS.textDarkMuted : COLORS.textLightMuted;
  const textFaint = isDark ? COLORS.textDarkFaint : COLORS.textLightFaint;

  return (
    <>
      <AuthTopBar />
      <div
        className="auth-page-wrapper"
        style={{
          fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif",
          direction: isRtl ? "rtl" : "ltr",
          background: getAuthPageBg(isDark),
        }}
      >
        <div
          className="auth-card auth-card-inner"
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 980,
            minHeight: 620,
            boxShadow: getCardShadow(isDark),
          }}
        >
          <AuthLeftPanel />

          {/* Right panel */}
          <div
            className="auth-right"
            style={{ background: isDark ? COLORS.cardDark : COLORS.bgCard }}
          >
            <div
              className="auth-right-accent"
              style={{ [isRtl ? "left" : "right"]: -60 }}
            />

            <div className="fp-content auth-page">
              {/* Back */}
              <a
                href="/login"
                className="auth-back-btn auth-b0"
                style={{
                  color: textMuted,
                  marginBottom: 24,
                  display: "inline-flex",
                }}
              >
                <span
                  style={{
                    transform: isRtl ? "scaleX(-1)" : "none",
                    display: "flex",
                  }}
                >
                  <Icon.ArrowLeft />
                </span>
                {t("auth.forgotPassword.backToLogin")}
              </a>

              {/* Illustration */}
              <div
                className="auth-b1"
                style={{ marginBottom: 28 }}
              >
                <LockIllustration isDark={isDark} />
              </div>

              {!sent ? (
                <>
                  <div
                    className="auth-b2"
                    style={{ textAlign: "center", marginBottom: 28 }}
                  >
                    <h1
                      className="fp-title"
                      style={{
                        color: textMain,
                        letterSpacing: isRtl ? 0 : "-0.5px",
                      }}
                    >
                      {t("auth.forgotPassword.title")}
                    </h1>
                    <p
                      className="fp-subtitle"
                      style={{ color: textMuted }}
                    >
                      {t("auth.forgotPassword.subtitle")}
                    </p>
                  </div>

                  <div
                    className="auth-b3"
                    style={{ marginBottom: 20 }}
                  >
                    <label
                      className="fp-label"
                      style={{
                        color: isDark
                          ? COLORS.textDarkBorder
                          : COLORS.textLight,
                      }}
                    >
                      {t("auth.forgotPassword.emailLabel")}
                    </label>
                    <div className="auth-input-icon-wrap">
                      <span
                        className="auth-input-icon"
                        style={{
                          [isRtl ? "right" : "left"]: 16,
                          color: emailError ? COLORS.red : "#9CA3AF",
                        }}
                      >
                        <Icon.Email />
                      </span>
                      <input
                        type="email"
                        value={email}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`auth-input${emailError ? " auth-input-err" : ""}`}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        style={{
                          ...getInputStyle(isDark, !!emailError),
                          padding: isRtl ? "0 48px 0 16px" : "0 16px 0 48px",
                        }}
                      />
                    </div>
                    {emailError && (
                      <p className="auth-field-error">
                        <Icon.ErrorCircle /> {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="auth-btn-primary auth-b4"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ ...getPrimaryBtnStyle(loading), width: "100%" }}
                  >
                    {loading ? (
                      <Icon.Spinner />
                    ) : (
                      <>
                        {t("auth.forgotPassword.send")}{" "}
                        <Icon.ArrowRightBtn rtl={isRtl} />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div
                  className="auth-b2"
                  style={{ textAlign: "center" }}
                >
                  <div className="fp-sent-check">
                    <Icon.Check size={28} />
                  </div>
                  <h1
                    className="fp-sent-title"
                    style={{ color: textMain }}
                  >
                    {t("auth.forgotPassword.sent")}
                  </h1>
                  <p
                    className="fp-sent-desc"
                    style={{ color: textMuted }}
                  >
                    {t("auth.forgotPassword.sentDesc")}
                  </p>
                  <p
                    className="fp-sent-email"
                    style={{ color: textFaint }}
                  >
                    {t("auth.forgotPassword.sentTo")}{" "}
                    <strong style={{ color: textMain }}>{email}</strong>
                  </p>
                  {/* Direct user to the OTP verification page */}
                  <a
                    href={`/check-email?email=${encodeURIComponent(email)}`}
                    className="auth-btn-primary"
                    style={{
                      ...getPrimaryBtnStyle(false, 52),
                      marginTop: 28,
                      textDecoration: "none",
                    }}
                  >
                    {t("auth.checkEmail.continueBtn", "Enter code")}
                  </a>
                  <div style={{ marginTop: 16 }}>
                    <a
                      href="/login"
                      style={{
                        fontSize: 13,
                        color: textFaint,
                        textDecoration: "none",
                      }}
                    >
                      {t("auth.forgotPassword.backToLogin")}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <AuthToast
          msg={toast.msg}
          visible={toast.visible}
          success={toast.success}
          isDark={isDark}
        />
      </div>
    </>
  );
}
