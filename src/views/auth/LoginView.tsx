"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useAuthUI, AuthTopBar } from "@/components/auth-context";
import { ShieldIllustration, Icon } from "@/app/assets/icons/auth-icon";
import "./auth-shared.css";
import "./auth-login.css";

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

export default function LoginView() {
  const router = useRouter();
  const { login } = useAuth();
  const { isDark, isRtl } = useAuthUI();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    visible: boolean;
    success?: boolean;
  }>({ msg: "", visible: false });

  const strength = getPasswordStrength(password);
  const strengthColors = ["", "#EF4444", "#F59E0B", "#22C55E", "#22C55E"];
  const strengthLabels = [
    "",
    t("auth.login.strengthWeak", "Weak"),
    t("auth.login.strengthFair", "Fair"),
    t("auth.login.strengthGood", "Good"),
    t("auth.login.strengthStrong", "Strong"),
  ];

  const showToast = useCallback((msg: string, success = false) => {
    setToast({ msg, visible: true, success });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2800);
  }, []);

  const validate = useCallback(() => {
    let ok = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr(t("auth.login.emailError"));
      ok = false;
    }
    if (password.length < 6) {
      setPassErr(t("auth.login.passwordError"));
      ok = false;
    }
    return ok;
  }, [email, password, t]);

  const handleSignIn = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // login() returns { isAdmin } from the resolved user — no React
      // re-render needed before we can navigate to the right dashboard.
      const { landingPath } = await login(email, password, remember);
      showToast(t("auth.login.successToast"), true);
      router.push(landingPath);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Sign in failed", false);
    } finally {
      setLoading(false);
    }
  }, [validate, email, password, remember, login, showToast, router, t]);

  // ── colours
  const pageBg = isDark
    ? "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(249,115,22,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 110%, rgba(15,30,58,0.5) 0%, transparent 60%), #1C2D45"
    : "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(249,115,22,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 110%, rgba(15,30,58,0.07) 0%, transparent 60%), #EDE8E0";
  const cardShadow = isDark
    ? "0 32px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)"
    : "0 24px 64px rgba(15,30,58,0.13), 0 4px 16px rgba(15,30,58,0.06)";
  const rightBg = isDark ? "#2E3F5C" : "#FFFFFF";
  const textMain = isDark ? "#F1F5F9" : "#263450";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const inputBg = isDark ? "#263450" : "#F9FAFB";
  const inputBdr = (hasErr: boolean) =>
    hasErr ? "#EF4444" : isDark ? "#334155" : "#E5E7EB";
  const dividerBg = isDark ? "#354769" : "#E5E7EB";

  return (
    <div
      className="auth-page-wrapper"
      style={{
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif",
        direction: isRtl ? "rtl" : "ltr",
        background: pageBg,
      }}
    >
      <AuthTopBar />

      <div
        className="auth-card auth-card-inner"
        style={{ boxShadow: cardShadow }}
      >
        {/* ══ LEFT PANEL ══ */}
        <div className="auth-left">
          <div className="auth-left-grid" />
          <div className="auth-left-glow auth-glow-orb" />

          <div className="login-brand auth-b0">
            <div className="login-brand-logo">R</div>
            <div>
              <div className="login-brand-name">{t("auth.brand.name")}</div>
              <div className="login-brand-tag">{t("auth.brand.tag")}</div>
            </div>
          </div>

          <div className="login-headline-wrap auth-b1">
            <h2
              className="login-headline auth-left-headline"
              style={{ letterSpacing: isRtl ? 0 : "-1px" }}
            >
              {t("auth.brand.headline0")}
              <br />
              {t("auth.brand.headline1")}
              <em className="login-headline-accent">
                {t("auth.brand.priority")}
              </em>
            </h2>
            <p className="login-headline-desc">{t("auth.brand.desc")}</p>
          </div>

          <div className="login-shield-area auth-b2">
            <div
              className="login-status-badge auth-badge1"
              style={{ [isRtl ? "right" : "left"]: 0, top: 10 }}
            >
              <span
                className="login-status-dot"
                style={{ background: "#22C55E", boxShadow: "0 0 8px #22C55E" }}
              />
              {t("auth.brand.protected")}
            </div>
            <div
              className="login-status-badge auth-badge2 auth-badge2-hide"
              style={{ [isRtl ? "left" : "right"]: 0, top: 10 }}
            >
              <span
                className="login-status-dot"
                style={{ background: "#F97316", boxShadow: "0 0 8px #F97316" }}
              />
              256-bit SSL
            </div>
            <div className="auth-shield">
              <ShieldIllustration />
            </div>
            <div
              className="login-status-badge auth-badge3"
              style={{ [isRtl ? "right" : "left"]: 10, bottom: 10 }}
            >
              <span
                className="login-status-dot"
                style={{ background: "#60A5FA", boxShadow: "0 0 8px #60A5FA" }}
              />
              {t("auth.brand.monitor")}
            </div>
          </div>

          <div className="login-stats auth-b3">
            {[
              { val: "99.9%", label: t("auth.brand.uptime") },
              { val: "50K+", label: t("auth.brand.users") },
              { val: "ISO 27001", label: t("auth.brand.certified") },
            ].map((s) => (
              <div key={s.label}>
                <div className="login-stat-value">{s.val}</div>
                <div className="login-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div
          className="auth-right"
          style={{ background: rightBg }}
        >
          <div
            className="auth-right-accent"
            style={{ [isRtl ? "left" : "right"]: -60 }}
          />

          <div className="auth-page">
            <div className="auth-b4">
              <h1
                className="login-title"
                style={{ color: textMain, letterSpacing: isRtl ? 0 : "-1px" }}
              >
                {t("auth.login.welcome")}
              </h1>
              <p
                className="login-subtitle"
                style={{ color: textMuted }}
              >
                {t("auth.login.subtitle")}
              </p>
            </div>

            <div className="login-fields">
              {/* Email */}
              <div className="auth-b5">
                <label
                  className="login-label"
                  style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                >
                  {t("auth.login.emailLabel")}
                </label>
                <div className="auth-input-icon-wrap">
                  <span
                    className="auth-input-icon"
                    style={{
                      [isRtl ? "right" : "left"]: 16,
                      color: emailErr ? "#EF4444" : "#9CA3AF",
                    }}
                  >
                    <Icon.Email />
                  </span>
                  <input
                    type="email"
                    value={email}
                    placeholder={t("auth.login.emailPlaceholder")}
                    autoComplete="email"
                    className={`auth-input${emailErr ? " auth-input-err" : ""}`}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailErr("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    style={{
                      padding: isRtl ? "0 48px 0 16px" : "0 16px 0 48px",
                      border: `2px solid ${inputBdr(!!emailErr)}`,
                      background: inputBg,
                      color: textMain,
                    }}
                  />
                </div>
                {emailErr && (
                  <p className="auth-field-error">
                    <Icon.ErrorCircle /> {emailErr}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="auth-b5">
                <div className="login-forgot-row">
                  <label
                    className="login-label"
                    style={{
                      color: isDark ? "#CBD5E1" : "#263450",
                      marginBottom: 0,
                    }}
                  >
                    {t("auth.login.passwordLabel")}
                  </label>
                  <a
                    href="/forgot-password"
                    className="login-forgot-link"
                  >
                    {t("auth.login.forgotPassword")}
                  </a>
                </div>
                <div className="auth-input-icon-wrap">
                  <span
                    className="auth-input-icon"
                    style={{
                      [isRtl ? "right" : "left"]: 16,
                      color: passErr ? "#EF4444" : "#9CA3AF",
                    }}
                  >
                    <Icon.Password />
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`auth-input${passErr ? " auth-input-err" : ""}`}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPassErr("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    style={{
                      padding: "0 48px",
                      border: `2px solid ${inputBdr(!!passErr)}`,
                      background: inputBg,
                      color: textMain,
                    }}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw((v) => !v)}
                    style={{ [isRtl ? "left" : "right"]: 14 }}
                  >
                    {showPw ? <Icon.EyeOff /> : <Icon.Eye />}
                  </button>
                </div>
                {password && (
                  <div>
                    <div className="auth-strength-bar">
                      {[1, 2, 3, 4].map((seg) => (
                        <div
                          key={seg}
                          className="auth-strength-segment"
                          style={{
                            background:
                              strength >= seg
                                ? strengthColors[strength]
                                : dividerBg,
                          }}
                        />
                      ))}
                    </div>
                    {strength > 0 && (
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: strengthColors[strength],
                          marginTop: 4,
                        }}
                      >
                        {strengthLabels[strength]}
                      </p>
                    )}
                  </div>
                )}
                {passErr && (
                  <p className="auth-field-error">
                    <Icon.ErrorCircle /> {passErr}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <label className="login-remember-row auth-b6">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ display: "none" }}
                />
                <div
                  className="auth-check-box"
                  style={{
                    border: `2px solid ${remember ? "#F97316" : isDark ? "#334155" : "#E5E7EB"}`,
                    background: remember ? "#F97316" : inputBg,
                  }}
                >
                  {remember && <Icon.CheckboxTick />}
                </div>
                <span
                  className="login-remember-text"
                  style={{ color: textMuted }}
                >
                  {t("auth.login.rememberMe")}
                </span>
              </label>

              {/* Sign in button */}
              <button
                type="button"
                className="auth-btn-primary auth-b7"
                onClick={handleSignIn}
                disabled={loading}
                style={{ height: 56, width: "100%", fontSize: 15.5 }}
              >
                {loading ? (
                  <Icon.Spinner />
                ) : (
                  <>
                    {t("auth.login.signIn")} <Icon.SignInArrow rtl={isRtl} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="login-divider auth-b7">
                <div
                  className="login-divider-line"
                  style={{ background: dividerBg }}
                />
                <span
                  className="login-divider-text"
                  style={{ color: isDark ? "#475569" : "#9CA3AF" }}
                >
                  {t("auth.login.orContinueWith")}
                </span>
                <div
                  className="login-divider-line"
                  style={{ background: dividerBg }}
                />
              </div>

              {/* Social buttons */}
              <div className="login-social-row auth-social-row auth-b8">
                {[
                  {
                    label: t("auth.login.faceId"),
                    href: "/face-login",
                    icon: <Icon.FaceId />,
                  },
                  {
                    label: t("auth.login.createAccount"),
                    href: "/register",
                    icon: <Icon.Plus />,
                  },
                ].map((btn) => (
                  <a
                    key={btn.label}
                    href={btn.href}
                    className="auth-social-btn"
                    style={{
                      border: `2px solid ${dividerBg}`,
                      background: inputBg,
                      color: isDark ? "#CBD5E1" : "#263450",
                    }}
                  >
                    {btn.icon}
                    {btn.label}
                  </a>
                ))}
              </div>

              {/* Footer */}
              <p
                className="login-footer-text auth-b8"
                style={{ color: isDark ? "#475569" : "#9CA3AF" }}
              >
                {t("auth.login.terms")}{" "}
                <a
                  href="/terms"
                  className="login-footer-link"
                >
                  {t("auth.login.termsLink")}
                </a>{" "}
                {t("auth.login.and")}{" "}
                <a
                  href="/privacy"
                  className="login-footer-link"
                >
                  {t("auth.login.privacyLink")}
                </a>
              </p>
            </div>
          </div>
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
