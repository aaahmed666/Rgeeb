"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAuthUI, AuthTopBar } from "@/components/auth-context";
import {
  fetchCategories,
  fetchCities,
  fetchCountries,
  // fetchPackages, // removed with package-selection step
} from "@/services/lookupsService";
import { sendOtpRequest } from "@/services/authService";
// import { subscribeToPackage } from "@/services/subscriptionService"; // removed with payment step
import { EmailSentIllustration, Icon } from "@/app/assets/icons/auth-icon";
import "./auth-shared.css";
import "./auth-register.css";
interface BasicInfo {
  name_ar: string;
  name_en: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  nationality: string;
  city_id: string;
}

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

// ── Normalise Arabic-Indic / Eastern-Arabic digits → ASCII ───────────────────
function normaliseDigits(raw: string): string {
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
}

// ── OTP input ─────────────────────────────────────────────────────────────────
function OtpDigits({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
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
    }
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = normaliseDigits(e.clipboardData.getData("text")).slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="register-otp-row">
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
          className="register-otp-input"
          style={{
            border: `2px solid ${d ? "#F97316" : isDark ? "rgba(255,255,255,0.12)" : "rgba(15,30,58,0.15)"}`,
            background: d
              ? isDark
                ? "rgba(249,115,22,0.12)"
                : "rgba(249,115,22,0.06)"
              : isDark
                ? "#263450"
                : "#F9FAFB",
            color: isDark ? "#F1F5F9" : "#263450",
          }}
        />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RegisterView() {
  const { isDark, isRtl } = useAuthUI();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { register, isAdmin } = useAuth();

  const [step, setStep] = React.useState(0);
  const [basic, setBasic] = React.useState<BasicInfo>({
    name_ar: "",
    name_en: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    nationality: "",
    city_id: "",
  });
  const [showPw, setShowPw] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [otp, setOtp] = React.useState("");
  // const [packageId, setPackageId] = React.useState(""); // removed with package step
  const [submitting, setSubmitting] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );
  const [resendTimer, setResendTimer] = React.useState(0);

  const strength = getPasswordStrength(basic.password);
  const strengthColors = ["", "#EF4444", "#F59E0B", "#22C55E", "#22C55E"];
  const strengthLabels = [
    "",
    t("auth.register.strengthWeak"),
    t("auth.register.strengthFair"),
    t("auth.register.strengthGood"),
    t("auth.register.strengthStrong"),
  ];

  const countriesQ = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
  const citiesQ = useQuery({
    queryKey: ["cities", basic.nationality],
    queryFn: () => fetchCities(basic.nationality),
    enabled: !!basic.nationality,
  });
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(i18n.language),
  });
  // Package selection step removed — auto free-trial on registration.
  // Kept commented in case paid packages return.
  // const packagesQ = useQuery({
  //   queryKey: ["packages", categoryId],
  //   queryFn: () =>
  //     fetchPackages({ all: true, category_id: categoryId || undefined }),
  //   enabled: step >= 3,
  // });

  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const localised = (en?: string, ar?: string, fallback?: string) =>
    (isRtl ? ar || en : en || ar) || fallback || "";

  const validateBasic = (): string | null => {
    const e: Record<string, string> = {};
    if (!basic.name_ar.trim()) e.name_ar = t("auth.register.errorNameAr");
    if (!basic.name_en.trim()) e.name_en = t("auth.register.errorNameEn");
    if (!/^\S+@\S+\.\S+$/.test(basic.email))
      e.email = t("auth.register.errorEmail");
    if (!/^\+?\d{8,15}$/.test(basic.phone.replace(/\s/g, "")))
      e.phone = t("auth.register.errorPhone");
    if (basic.password.length < 8)
      e.password = t("auth.register.errorPassword");
    if (basic.password !== basic.confirm)
      e.confirm = t("auth.register.errorConfirm");
    if (!basic.nationality) e.nationality = t("auth.register.errorCountry");
    if (!basic.city_id) e.city_id = t("auth.register.errorCity");
    setFieldErrors(e);
    return Object.keys(e).length === 0 ? null : "error";
  };

  const handleNext = async () => {
    if (step === 0) {
      if (validateBasic()) return;
      setSendingOtp(true);
      try {
        await sendOtpRequest(basic.email);
      } catch {
        // Continue to the next step (the user can resend from there), but
        // tell them the first send failed instead of failing silently.
        toast.error(
          t(
            "auth.register.otpSendFailed",
            "We couldn't send the verification code. You can resend it on the verification step."
          )
        );
      } finally {
        setSendingOtp(false);
      }
    }
    if (step === 1 && !categoryId) {
      toast.error(t("auth.register.errorCategory"));
      return;
    }
    if (step === 2) {
      // ── Step 2: verify OTP then register the account ─────────────────────
      // NOTE: This is now the FINAL step. Registration auto-subscribes the
      // account to a free trial package (managed from admin). The package
      // selection + payment steps were removed — see the commented-out
      // `step === 3` block below if we ever need to bring them back.
      if (otp.length !== 6) {
        toast.error(t("auth.register.errorCode"));
        return;
      }
      setSubmitting(true);
      try {
        await register({
          name_ar: basic.name_ar,
          name_en: basic.name_en,
          email: basic.email,
          phone: basic.phone,
          password: basic.password,
          password_confirmation: basic.confirm,
          country_id: basic.nationality, // API field is country_id
          city_id: basic.city_id,
          category_id: categoryId,
          otp_code: otp,
          otp: otp,
        });
        toast.success(t("auth.register.successCreate"));
        // Free trial is applied automatically server-side — straight to dashboard.
        router.push(isAdmin ? "/dashboard/admin" : "/dashboard");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("auth.register.errorCreate")
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }
    /* ──────────────────────────────────────────────────────────────────────
     * REMOVED — Package selection + payment step (Fatoorah).
     * Kept commented in case we decide to re-introduce paid packages later.
     *
     * if (step === 3) {
     *   // ── Step 3: subscribe to selected package ─────────────────────────
     *   if (!packageId) {
     *     toast.error(t("auth.register.errorPackage"));
     *     return;
     *   }
     *   setSubmitting(true);
     *   try {
     *     const { payment_link } = await subscribeToPackage(packageId);
     *     toast.success(
     *       t("auth.register.successSubscribe", "Successfully subscribed to package!")
     *     );
     *     if (payment_link) {
     *       // Open the Fatoorah checkout in a new tab (matches old project behaviour).
     *       const paymentWindow = window.open(
     *         payment_link,
     *         "_blank",
     *         "noopener,noreferrer"
     *       );
     *       if (
     *         !paymentWindow ||
     *         paymentWindow.closed ||
     *         typeof paymentWindow.closed === "undefined"
     *       ) {
     *         toast.error(
     *           `${t("auth.register.popupBlocked", "Popup blocked! Please allow popups or visit:")} ${payment_link}`
     *         );
     *       } else {
     *         toast.success(
     *           t("auth.register.redirectingPayment", "Redirecting to payment page...")
     *         );
     *       }
     *     }
     *     // Whether or not there is a payment link, navigate to the dashboard.
     *     router.push(isAdmin ? "/dashboard/admin" : "/dashboard");
     *   } catch (err) {
     *     toast.error(
     *       err instanceof Error
     *         ? err.message
     *         : t("auth.register.errorSubscribe", "Failed to subscribe to package")
     *     );
     *   } finally {
     *     setSubmitting(false);
     *   }
     *   return;
     * }
     * ────────────────────────────────────────────────────────────────────── */
    setStep((s) => s + 1);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setSendingOtp(true);
    try {
      await sendOtpRequest(basic.email);
      setResendTimer(60);
      toast.success(t("auth.checkEmail.resendSuccess"));
    } catch {
      toast.error(t("auth.checkEmail.resendFail"));
    } finally {
      setSendingOtp(false);
    }
  };

  const STEPS = [
    { label: t("auth.register.step1Label"), sub: t("auth.register.step1Sub") },
    { label: t("auth.register.step2Label"), sub: t("auth.register.step2Sub") },
    { label: t("auth.register.step3Label"), sub: t("auth.register.step3Sub") },
    // Step 4 (package selection) removed — auto free-trial on registration.
    // { label: t("auth.register.step4Label"), sub: t("auth.register.step4Sub") },
  ];

  // ── colours
  const cardShadow = isDark
    ? "0 32px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)"
    : "0 24px 64px rgba(15,30,58,0.13)";
  const rightBg = isDark ? "#2E3F5C" : "#FFFFFF";
  const textMain = isDark ? "#F1F5F9" : "#263450";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";
  const textFaint = isDark ? "#64748B" : "#9CA3AF";
  const inputBg = isDark ? "#263450" : "#F9FAFB";
  const inputBdr = (f: string) =>
    fieldErrors[f] ? "#EF4444" : isDark ? "#334155" : "#E5E7EB";
  const dividerBg = isDark ? "#354769" : "#E5E7EB";

  const inp = (field: string, noPad?: boolean): React.CSSProperties => ({
    border: `2px solid ${inputBdr(field)}`,
    background: inputBg,
    color: textMain,
    ...(noPad ? { paddingLeft: 14, paddingRight: 14 } : {}),
  });

  // Shared inline icon wrapper style for form fields
  const iconWrap: React.CSSProperties = {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9CA3AF",
    display: "flex",
    pointerEvents: "none",
  };

  return (
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
      <div
        className="auth-bg-dots"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(249,115,22,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        className="auth-card auth-card-inner"
        style={{ maxWidth: 1020, boxShadow: cardShadow }}
      >
        {/* ══ LEFT PANEL ══ */}
        <div className="register-left">
          <div className="auth-left-grid" />
          <div className="auth-left-glow auth-glow-orb" />

          <div className="register-brand auth-b0">
            <div className="register-brand-logo">R</div>
            <div>
              <div className="register-brand-name">{t("auth.brand.name")}</div>
              <div className="register-brand-sub">
                {t("auth.shared.securityPlatform")}
              </div>
            </div>
          </div>

          <div className="register-headline-wrap auth-b1">
            <h2 className="register-headline">
              {t("auth.register.headline")}
              <br />
              <em className="register-headline-accent">
                {t("auth.register.headlineAccent")}
              </em>
            </h2>
            <p className="register-headline-desc">
              {t("auth.register.subDesc")}
            </p>
          </div>

          {/* Step tracker */}
          <div className="register-steps auth-b2">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div
                  key={i}
                  className="register-step-item"
                  style={{
                    background: active
                      ? "rgba(249,115,22,0.12)"
                      : done
                        ? "rgba(34,197,94,0.06)"
                        : "transparent",
                    border: `1px solid ${active ? "rgba(249,115,22,0.3)" : done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <div
                    className="register-step-circle"
                    style={{
                      background: active
                        ? "#F97316"
                        : done
                          ? "#22C55E"
                          : "rgba(255,255,255,0.06)",
                      border: `2px solid ${active ? "#F97316" : done ? "#22C55E" : "rgba(255,255,255,0.12)"}`,
                      boxShadow: active
                        ? "0 4px 14px rgba(249,115,22,0.4)"
                        : done
                          ? "0 4px 12px rgba(34,197,94,0.3)"
                          : "none",
                    }}
                  >
                    {done ? (
                      <Icon.StepCheck />
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: active ? "#fff" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <div
                      className="register-step-label"
                      style={{
                        color: active
                          ? "#fff"
                          : done
                            ? "rgba(34,197,94,0.9)"
                            : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="register-step-sub"
                      style={{
                        color: active
                          ? "rgba(255,255,255,0.55)"
                          : "rgba(255,255,255,0.22)",
                      }}
                    >
                      {s.sub}
                    </div>
                  </div>
                  {active && <div className="register-step-active-dot" />}
                </div>
              );
            })}
          </div>

          <div className="register-stats auth-b3">
            {[
              { val: "99.9%", lbl: t("auth.brand.uptime") },
              { val: "50K+", lbl: t("auth.brand.users") },
              { val: "ISO 27001", lbl: t("auth.brand.certified") },
            ].map((s) => (
              <div key={s.lbl}>
                <div className="register-stat-value">{s.val}</div>
                <div className="register-stat-label">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div
          className="auth-right"
          style={{ background: rightBg, paddingTop: 40, paddingBottom: 44 }}
        >
          <div
            className="auth-accent-stripe"
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
          />
          <div
            className="auth-right-accent"
            style={{ right: -60 }}
          />

          {/* Progress bar */}
          <div
            className="auth-b0"
            style={{ marginBottom: 28 }}
          >
            <div className="register-progress-header">
              <span
                className="register-progress-step-text"
                style={{ color: textFaint }}
              >
                {t("auth.register.stepLabel", "Step")} {step + 1} {t("auth.register.stepOf")} {STEPS.length}
              </span>
              <span className="register-progress-pct">
                {Math.round(((step + 1) / STEPS.length) * 100)}%
              </span>
            </div>
            <div
              className="register-progress-track"
              style={{ background: dividerBg }}
            >
              <div
                className="register-progress-fill"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* ─── STEP 0: Basic Info ─── */}
          {step === 0 && (
            <div
              className="auth-page"
              style={{ flex: 1, overflow: "auto" }}
            >
              <div
                className="auth-b1"
                style={{ marginBottom: 24 }}
              >
                <h1
                  className="register-step-title"
                  style={{ color: textMain }}
                >
                  {t("auth.register.basicTitle")}
                </h1>
                <p
                  className="register-step-subtitle"
                  style={{ color: textMuted }}
                >
                  {t("auth.register.basicSubtitle")}
                </p>
              </div>

              <div className="register-fields-grid">
                {/* Name Arabic */}
                <div className="auth-b2">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.nameAr")}
                  </div>
                  <input
                    value={basic.name_ar}
                    dir="rtl"
                    placeholder={t("auth.register.nameArPlaceholder")}
                    className={`register-input${fieldErrors.name_ar ? " register-input-err" : ""}`}
                    onChange={(e) => {
                      setBasic((b) => ({ ...b, name_ar: e.target.value }));
                      setFieldErrors((fe) => ({ ...fe, name_ar: "" }));
                    }}
                    style={inp("name_ar", true)}
                  />
                  {fieldErrors.name_ar && (
                    <div className="register-field-error">
                      {fieldErrors.name_ar}
                    </div>
                  )}
                </div>

                {/* Name English */}
                <div className="auth-b2">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.nameEn")}
                  </div>
                  <input
                    value={basic.name_en}
                    placeholder={t("auth.register.nameEnPlaceholder")}
                    className={`register-input${fieldErrors.name_en ? " register-input-err" : ""}`}
                    onChange={(e) => {
                      setBasic((b) => ({ ...b, name_en: e.target.value }));
                      setFieldErrors((fe) => ({ ...fe, name_en: "" }));
                    }}
                    style={inp("name_en", true)}
                  />
                  {fieldErrors.name_en && (
                    <div className="register-field-error">
                      {fieldErrors.name_en}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="auth-b2">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.email")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}>
                      <Icon.Email />
                    </span>
                    <input
                      type="email"
                      value={basic.email}
                      placeholder={t("auth.register.emailPlaceholder")}
                      className={`register-input${fieldErrors.email ? " register-input-err" : ""}`}
                      onChange={(e) => {
                        setBasic((b) => ({ ...b, email: e.target.value }));
                        setFieldErrors((fe) => ({ ...fe, email: "" }));
                      }}
                      style={{ ...inp("email"), paddingLeft: 44 }}
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className="register-field-error">
                      {fieldErrors.email}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="auth-b2">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.phone")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}>
                      <Icon.Phone />
                    </span>
                    <input
                      value={basic.phone}
                      placeholder={t("auth.register.phonePlaceholder")}
                      className={`register-input${fieldErrors.phone ? " register-input-err" : ""}`}
                      onChange={(e) => {
                        setBasic((b) => ({ ...b, phone: e.target.value }));
                        setFieldErrors((fe) => ({ ...fe, phone: "" }));
                      }}
                      style={{ ...inp("phone"), paddingLeft: 44 }}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <div className="register-field-error">
                      {fieldErrors.phone}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="auth-b3">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.password")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}>
                      <Icon.Password />
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={basic.password}
                      placeholder="••••••••"
                      className={`register-input${fieldErrors.password ? " register-input-err" : ""}`}
                      onChange={(e) => {
                        setBasic((b) => ({ ...b, password: e.target.value }));
                        setFieldErrors((fe) => ({ ...fe, password: "" }));
                      }}
                      style={{
                        ...inp("password"),
                        paddingLeft: 44,
                        paddingRight: 40,
                      }}
                    />
                    <button
                      type="button"
                      className="register-pw-toggle"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? <Icon.EyeOff /> : <Icon.Eye />}
                    </button>
                  </div>
                  {basic.password && (
                    <div style={{ marginTop: 6 }}>
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
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: strengthColors[strength],
                            marginTop: 3,
                          }}
                        >
                          {strengthLabels[strength]}
                        </p>
                      )}
                    </div>
                  )}
                  {fieldErrors.password && (
                    <div className="register-field-error">
                      {fieldErrors.password}
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="auth-b3">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.confirmPassword")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}>
                      <Icon.Password />
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={basic.confirm}
                      placeholder="••••••••"
                      className={`register-input${fieldErrors.confirm ? " register-input-err" : ""}`}
                      onChange={(e) => {
                        setBasic((b) => ({ ...b, confirm: e.target.value }));
                        setFieldErrors((fe) => ({ ...fe, confirm: "" }));
                      }}
                      style={{ ...inp("confirm"), paddingLeft: 44 }}
                    />
                  </div>
                  {fieldErrors.confirm && (
                    <div className="register-field-error">
                      {fieldErrors.confirm}
                    </div>
                  )}
                </div>

                {/* Country */}
                <div className="auth-b4">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.country")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}>
                      <Icon.Globe />
                    </span>
                    <select
                      value={basic.nationality}
                      className={`register-input register-select${fieldErrors.nationality ? " register-input-err" : ""}`}
                      onChange={(e) => {
                        setBasic((b) => ({
                          ...b,
                          nationality: e.target.value,
                          city_id: "",
                        }));
                        setFieldErrors((fe) => ({ ...fe, nationality: "" }));
                      }}
                      style={{ ...inp("nationality"), paddingLeft: 44 }}
                    >
                      <option value="">
                        {countriesQ.isLoading
                          ? t("common.loading")
                          : t("auth.register.selectCountry")}
                      </option>
                      {(countriesQ.data ?? []).map((c: any) => (
                        <option
                          key={c.id}
                          value={String(c.id)}
                        >
                          {localised(c.name_en, c.name_ar, c.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.nationality && (
                    <div className="register-field-error">
                      {fieldErrors.nationality}
                    </div>
                  )}
                </div>

                {/* City */}
                <div className="auth-b4">
                  <div
                    className="register-label"
                    style={{ color: isDark ? "#CBD5E1" : "#263450" }}
                  >
                    {t("auth.register.city")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={iconWrap}>
                      <Icon.Location />
                    </span>
                    <select
                      value={basic.city_id}
                      disabled={!basic.nationality}
                      className={`register-input register-select${fieldErrors.city_id ? " register-input-err" : ""}`}
                      onChange={(e) => {
                        setBasic((b) => ({ ...b, city_id: e.target.value }));
                        setFieldErrors((fe) => ({ ...fe, city_id: "" }));
                      }}
                      style={{
                        ...inp("city_id"),
                        paddingLeft: 44,
                        opacity: basic.nationality ? 1 : 0.6,
                        cursor: basic.nationality ? "pointer" : "not-allowed",
                      }}
                    >
                      <option value="">
                        {!basic.nationality
                          ? t("auth.register.selectCountryFirst")
                          : citiesQ.isLoading
                            ? t("common.loading")
                            : t("auth.register.selectCity")}
                      </option>
                      {(citiesQ.data ?? []).map((c: any) => (
                        <option
                          key={c.id}
                          value={String(c.id)}
                        >
                          {localised(c.name_en, c.name_ar, c.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.city_id && (
                    <div className="register-field-error">
                      {fieldErrors.city_id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 1: Category ─── */}
          {step === 1 && (
            <div
              className="auth-page"
              style={{ flex: 1, overflow: "auto" }}
            >
              <div
                className="auth-b1"
                style={{ marginBottom: 24 }}
              >
                <h1
                  className="register-step-title"
                  style={{ color: textMain }}
                >
                  {t("auth.register.categoryTitle")}
                </h1>
                <p
                  className="register-step-subtitle"
                  style={{ color: textMuted }}
                >
                  {t("auth.register.categorySubtitle")}
                </p>
              </div>
              <div className="register-categories-grid">
                {categoriesQ.isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: 140,
                          borderRadius: 14,
                          border: `1px solid ${dividerBg}`,
                          background: inputBg,
                          opacity: 0.6,
                        }}
                      />
                    ))
                  : (categoriesQ.data ?? []).map((c: any) => {
                      const id = String(c.id);
                      const active = categoryId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          className="register-cat-card"
                          onClick={() => setCategoryId(id)}
                          style={{
                            border: `2px solid ${active ? "#F97316" : dividerBg}`,
                            background: active
                              ? isDark
                                ? "rgba(249,115,22,0.1)"
                                : "rgba(249,115,22,0.06)"
                              : inputBg,
                            boxShadow: active
                              ? "0 6px 20px rgba(249,115,22,0.2)"
                              : "none",
                          }}
                        >
                          <div
                            className="register-cat-icon"
                            style={{
                              background: active
                                ? "rgba(249,115,22,0.15)"
                                : isDark
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(15,30,58,0.05)",
                            }}
                          >
                            <Icon.CategoryGrid active={active} />
                          </div>
                          <div
                            className="register-cat-name"
                            style={{ color: active ? "#F97316" : textMain }}
                          >
                            {localised(c.name_en, c.name_ar, c.name)}
                          </div>
                          {active && (
                            <div
                              className="register-cat-check"
                              style={{ marginTop: 10 }}
                            >
                              <Icon.SmallCheck />
                            </div>
                          )}
                        </button>
                      );
                    })}
              </div>
            </div>
          )}

          {/* ─── STEP 2: Verify ─── */}
          {step === 2 && (
            <div className="auth-page register-verify-wrap">
              <div
                className="auth-b1"
                style={{ marginBottom: 24 }}
              >
                <div
                  className="register-verify-icon"
                  style={{
                    background: isDark
                      ? "rgba(249,115,22,0.1)"
                      : "rgba(249,115,22,0.07)",
                    border: "2px solid rgba(249,115,22,0.25)",
                  }}
                >
                  <EmailSentIllustration isDark={isDark} />
                </div>
              </div>

              <div
                className="auth-b2"
                style={{ textAlign: "center", marginBottom: 28 }}
              >
                <h1
                  className="register-step-title"
                  style={{ color: textMain }}
                >
                  {t("auth.register.verifyTitle")}
                </h1>
                <p
                  style={{
                    fontSize: 13.5,
                    color: textMuted,
                    marginTop: 8,
                    lineHeight: 1.65,
                  }}
                >
                  {t("auth.register.verifySentTo")}{" "}
                  <strong style={{ color: textMain }}>{basic.email}</strong>
                </p>
              </div>

              <div
                className="auth-b3"
                style={{ marginBottom: 18, width: "100%" }}
              >
                <OtpDigits
                  value={otp}
                  onChange={setOtp}
                  isDark={isDark}
                />
              </div>

              <div className="register-resend-row auth-b4">
                <span style={{ fontSize: 13.5, color: textFaint }}>
                  {t("auth.register.didntReceive")}{" "}
                </span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || sendingOtp}
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: resendTimer > 0 ? "default" : "pointer",
                    color:
                      resendTimer > 0
                        ? isDark
                          ? "#475569"
                          : "#CBD5E1"
                        : "#F97316",
                  }}
                >
                  {sendingOtp
                    ? t("auth.register.sendingCode")
                    : resendTimer > 0
                      ? `${t("auth.register.resendIn")} ${resendTimer}s`
                      : t("auth.register.resendCode")}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Package ─── */}
          {/* ──────────────────────────────────────────────────────────────
            * REMOVED — Package selection step UI (step === 3).
            * Auto free-trial on registration; no package/payment screen.
            * Kept commented in case paid packages return.
            *
            * {step === 3 && (
            *   <div className="auth-page" style={{ flex: 1, overflow: "auto" }}>
            *     <div className="auth-b1" style={{ marginBottom: 24 }}>
            *       <h1 className="register-step-title" style={{ color: textMain }}>
            *         {t("auth.register.packageTitle")}
            *       </h1>
            *       <p className="register-step-subtitle" style={{ color: textMuted }}>
            *         {t("auth.register.packageSubtitle")}
            *       </p>
            *     </div>
            *     <div className="register-packages-grid">
            *       {packagesQ.isLoading
            *         ? Array.from({ length: 4 }).map((_, i) => (
            *             <div key={i} style={{ height: 180, borderRadius: 14,
            *               border: `1px solid ${dividerBg}`, background: inputBg, opacity: 0.6 }} />
            *           ))
            *         : (packagesQ.data ?? []).map((p: any) => {
            *             const id = String(p.id);
            *             const active = packageId === id;
            *             return (
            *               <button key={id} type="button" className="register-pkg-card"
            *                 onClick={() => setPackageId(id)}
            *                 style={{ border: `2px solid ${active ? "#F97316" : dividerBg}`,
            *                   background: active ? (isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.06)") : inputBg,
            *                   boxShadow: active ? "0 6px 20px rgba(249,115,22,0.2)" : "none" }}>
            *                 <div className="register-pkg-name" style={{ color: textMain }}>
            *                   {localised(p.name_en, p.name_ar, p.name)}
            *                 </div>
            *                 <p className="register-pkg-desc" style={{ color: textFaint }}>
            *                   {localised(p.description_en, p.description_ar, p.description)}
            *                 </p>
            *                 <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 4 }}>
            *                   <span className="register-pkg-price">${p.price ?? 0}</span>
            *                   {p.duration && (
            *                     <span style={{ fontSize: 12, color: textFaint }}>
            *                       / {p.duration} {p.duration_unit ?? "month"}
            *                     </span>
            *                   )}
            *                 </div>
            *                 <div className="register-pkg-radio"
            *                   style={{ border: `2px solid ${active ? "#F97316" : isDark ? "#334155" : "#D1D5DB"}`,
            *                     background: active ? "#F97316" : "transparent" }}>
            *                   {active && <Icon.SmallCheck />}
            *                 </div>
            *               </button>
            *             );
            *           })}
            *     </div>
            *   </div>
            * )}
            * ────────────────────────────────────────────────────────────── */}

          {/* ── Navigation buttons ── */}
          <div
            className="register-nav"
            style={{ borderTop: `1px solid ${dividerBg}` }}
          >
            {step > 0 && (
              <button
                type="button"
                className="auth-btn-outline"
                onClick={() => setStep((s) => s - 1)}
                style={{
                  height: 52,
                  padding: "0 22px",
                  border: `2px solid ${dividerBg}`,
                  background: inputBg,
                  color: isDark ? "#CBD5E1" : "#263450",
                }}
              >
                <Icon.ArrowLeft />
                {t("auth.register.back")}
              </button>
            )}

            <button
              type="button"
              className="auth-btn-primary"
              onClick={handleNext}
              disabled={submitting || sendingOtp}
              style={{
                flex: 1,
                height: 52,
                opacity: submitting || sendingOtp ? 0.8 : 1,
              }}
            >
              {submitting || sendingOtp ? (
                <Icon.Spinner />
              ) : (
                <>
                  {step === 2
                    ? t("auth.register.createAccount")
                    : t("auth.register.continue")}
                  <Icon.SignInArrow rtl={isRtl} />
                </>
              )}
            </button>
          </div>

          {step === 0 && (
            <div className="register-signin-hint">
              <span style={{ color: isDark ? "#475569" : "#9CA3AF" }}>
                {t("auth.register.alreadyHaveAccount")}{" "}
              </span>
              <a
                href="/login"
                className="register-signin-link"
              >
                {t("auth.register.signIn")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
