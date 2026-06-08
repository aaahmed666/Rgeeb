"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { resetPasswordRequest } from "@/services/authService";
import { useAuthUI, AuthTopBar } from "@/components/auth-context";
import { KeyIllustration, SuccessIllustration } from "@/app/assets/icons/auth-icon";
import "./auth-shared.css";
import "./auth-reset-password.css";

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

export default function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, isRtl } = useAuthUI();
  const { t } = useTranslation();

  const [email, setEmail]       = React.useState(searchParams.get("email") ?? "");
  const [token, setToken]       = React.useState(searchParams.get("token") ?? "");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm]   = React.useState("");
  const [showPw, setShowPw]     = React.useState(false);
  const [showCf, setShowCf]     = React.useState(false);
  const [loading, setLoading]   = React.useState(false);
  const [done, setDone]         = React.useState(false);
  const [errors, setErrors]     = React.useState<Record<string, string>>({});

  const strength = getPasswordStrength(password);
  const strengthColors = ["", "#EF4444", "#F59E0B", "#22C55E", "#22C55E"];
  const strengthLabels = [
    "",
    t("auth.resetPassword.strengthWeak"),
    t("auth.resetPassword.strengthFair"),
    t("auth.resetPassword.strengthGood"),
    t("auth.resetPassword.strengthStrong"),
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email    = t("auth.resetPassword.errorEmail");
    // token comes from OTP page via URL param — no need for user to type it
    if (password.length < 8)                        e.password = t("auth.resetPassword.errorPassword");
    if (password !== confirm)                        e.confirm  = t("auth.resetPassword.errorConfirm");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPasswordRequest({ token, email, password, password_confirmation: confirm });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : t("auth.resetPassword.errorGeneral") });
    } finally { setLoading(false); }
  };

  // ── colours
  const cardBg     = isDark ? "#2E3F5C" : "#FFFFFF";
  const cardShadow = isDark ? "0 32px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)" : "0 24px 64px rgba(15,30,58,0.13)";
  const textMain   = isDark ? "#F1F5F9" : "#263450";
  const textMuted  = isDark ? "#94A3B8" : "#6B7280";
  const textLabel  = isDark ? "#CBD5E1" : "#263450";
  const inputBg    = isDark ? "#263450" : "#F9FAFB";
  const inputBdr   = (f: string) => errors[f] ? "#EF4444" : isDark ? "#334155" : "#E5E7EB";
  const strengthBg = (seg: number) =>
    strength >= seg ? strengthColors[strength] : isDark ? "#354769" : "#E5E7EB";

  const EyeOff = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3l14 14M8.5 8.5A3 3 0 0111.5 11.5M6.5 6.5C4.5 7.5 3 10 3 10s2.5 5 7 5a7 7 0 002.5-.5M13 4.5A7 7 0 0117 10s-.7 1.5-2 2.8" />
    </svg>
  );
  const EyeOn = () => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div
        className="auth-page-wrapper"
        style={{
          fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif",
          direction: isRtl ? "rtl" : "ltr",
          background: isDark
            ? "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(249,115,22,0.18) 0%, transparent 60%), #1C2D45"
            : "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(249,115,22,0.1) 0%, transparent 60%), #EDE8E0",
        }}
      >
        <AuthTopBar />
        <div className="auth-bg-dots" />

        <div className="rp-card auth-card" style={{ background: cardBg, boxShadow: cardShadow }}>
          <div className="auth-accent-stripe" />

          <div className="rp-inner">
            {/* Brand + back */}
            <div className="rp-brand-row auth-b0">
              <div className="rp-brand-logo">R</div>
              <div>
                <div className="rp-brand-name" style={{ color: textMain }}>RGEEB</div>
                <div className="rp-brand-sub" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(15,30,58,0.4)" }}>
                  {t("auth.shared.securityPlatform")}
                </div>
              </div>
              <a href="/login" className="rp-back-link" style={{ color: textMuted }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("auth.resetPassword.back")}
              </a>
            </div>

            {done ? (
              /* ── Done ── */
              <div className="rp-done">
                <div className="auth-b1" style={{ marginBottom: 22 }}>
                  <div className="rp-success-ring"
                    style={{ background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.07)", border: "2px solid rgba(34,197,94,0.3)" }}>
                    <SuccessIllustration isDark={isDark} />
                  </div>
                </div>
                <div className="auth-b2">
                  <h1 className="rp-done-title" style={{ color: textMain }}>{t("auth.resetPassword.successTitle")}</h1>
                  <p className="rp-done-desc" style={{ color: textMuted }}>{t("auth.resetPassword.successDesc")}</p>
                </div>
                <div className="auth-b3">
                  <a href="/login" className="rp-done-link">
                    {t("auth.resetPassword.goToSignIn")}
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10h12M10 4l6 6-6 6" />
                    </svg>
                  </a>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="auth-b1" style={{ marginBottom: 24 }}>
                  <KeyIllustration isDark={isDark} />
                </div>

                <div className="auth-b2" style={{ marginBottom: 28 }}>
                  <h1 className="rp-title" style={{ color: textMain }}>{t("auth.resetPassword.title")}</h1>
                  <p className="rp-subtitle" style={{ color: textMuted }}>{t("auth.resetPassword.subtitle")}</p>
                </div>

                {errors.general && (
                  <div className="auth-general-error auth-b2">{errors.general}</div>
                )}

                <div className="rp-fields">
                  {/* Email */}
                  <div className="auth-b3">
                    <label className="rp-label" style={{ color: textLabel }}>{t("auth.resetPassword.emailLabel")}</label>
                    <div className="auth-input-icon-wrap">
                      <span className="auth-input-icon" style={{ left: 16 }}>
                        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="2" y="5" width="16" height="12" rx="3" /><path d="M2 8l8 5 8-5" />
                        </svg>
                      </span>
                      <input
                        type="email" value={email}
                        className={`auth-input${errors.email ? " auth-input-err" : ""}`}
                        onChange={(e) => { setEmail(e.target.value); setErrors((er) => ({ ...er, email: "" })); }}
                        style={{ padding: "0 48px", border: `2px solid ${inputBdr("email")}`, background: inputBg, color: textMain }}
                      />
                    </div>
                    {errors.email && <p className="auth-field-error">{errors.email}</p>}
                  </div>

                  {/* Token — hidden, pre-filled from OTP page URL param */}
                  <input type="hidden" value={token} readOnly />

                  {/* New password */}
                  <div className="auth-b4">
                    <label className="rp-label" style={{ color: textLabel }}>{t("auth.resetPassword.newPassword")}</label>
                    <div className="auth-input-icon-wrap">
                      <span className="auth-input-icon" style={{ left: 16 }}>
                        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="4" y="9" width="12" height="10" rx="3" /><path d="M7 9V6a3 3 0 016 0v3" />
                        </svg>
                      </span>
                      <input
                        type={showPw ? "text" : "password"} value={password} placeholder="••••••••"
                        className={`auth-input${errors.password ? " auth-input-err" : ""}`}
                        onChange={(e) => { setPassword(e.target.value); setErrors((er) => ({ ...er, password: "" })); }}
                        style={{ padding: "0 48px", border: `2px solid ${inputBdr("password")}`, background: inputBg, color: textMain }}
                      />
                      <button type="button" className="auth-pw-toggle" onClick={() => setShowPw((v) => !v)} style={{ right: 14 }}>
                        {showPw ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                    {password && (
                      <div>
                        <div className="auth-strength-bar">
                          {[1,2,3,4].map((seg) => (
                            <div key={seg} className="auth-strength-segment" style={{ background: strengthBg(seg) }} />
                          ))}
                        </div>
                        {strength > 0 && (
                          <p style={{ fontSize: 11, fontWeight: 600, color: strengthColors[strength], marginTop: 4 }}>
                            {strengthLabels[strength]}
                          </p>
                        )}
                      </div>
                    )}
                    {errors.password && <p className="auth-field-error">{errors.password}</p>}
                  </div>

                  {/* Confirm */}
                  <div className="auth-b5">
                    <label className="rp-label" style={{ color: textLabel }}>{t("auth.resetPassword.confirmPassword")}</label>
                    <div className="auth-input-icon-wrap">
                      <span className="auth-input-icon" style={{ left: 16 }}>
                        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="4" y="9" width="12" height="10" rx="3" /><path d="M7 9V6a3 3 0 016 0v3" />
                        </svg>
                      </span>
                      <input
                        type={showCf ? "text" : "password"} value={confirm} placeholder="••••••••"
                        className={`auth-input${errors.confirm ? " auth-input-err" : ""}`}
                        onChange={(e) => { setConfirm(e.target.value); setErrors((er) => ({ ...er, confirm: "" })); }}
                        style={{ padding: "0 48px", border: `2px solid ${inputBdr("confirm")}`, background: inputBg, color: textMain }}
                      />
                      <button type="button" className="auth-pw-toggle" onClick={() => setShowCf((v) => !v)} style={{ right: 14 }}>
                        {showCf ? <EyeOff /> : <EyeOn />}
                      </button>
                    </div>
                    {confirm && (
                      <div className="rp-match-indicator">
                        {password === confirm ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2.2">
                              <polyline points="4,10 8,14 16,6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ color: "#22C55E" }}>{t("auth.resetPassword.passwordsMatch")}</span>
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 20 20" fill="#EF4444">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span style={{ color: "#EF4444" }}>{t("auth.resetPassword.passwordsMismatch")}</span>
                          </>
                        )}
                      </div>
                    )}
                    {errors.confirm && <p className="auth-field-error">{errors.confirm}</p>}
                  </div>

                  {/* Submit */}
                  <button type="button" className="auth-btn-primary auth-b6" onClick={submit} disabled={loading}
                    style={{ height: 56, width: "100%", fontSize: 15.5, marginTop: 4 }}>
                    {loading
                      ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#fff" strokeWidth="2.2"
                          style={{ animation: "authSpin 0.8s linear infinite", transformOrigin: "center" }}>
                          <circle cx="11" cy="11" r="8" strokeOpacity="0.25" />
                          <path d="M11 3a8 8 0 018 8" strokeLinecap="round" />
                        </svg>
                      : <>{t("auth.resetPassword.submit")}
                          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 10h12M10 4l6 6-6 6" />
                          </svg>
                        </>}
                  </button>

                  <div className="auth-b7" style={{ textAlign: "center" }}>
                    <a href="/login" style={{ fontSize: 13, fontWeight: 600, color: textMuted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t("auth.resetPassword.back")}
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
