"use client";
export const dynamic = 'force-dynamic';


import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { FaceLoginButton } from "@/components/FaceLoginButton";
import { useAuthUI, AuthTopBar } from "@/components/auth-context";
import "../../../views/auth/auth-shared.css";

export default function FaceLoginPage() {
  const { isDark, isRtl } = useAuthUI();
  const { t } = useTranslation();
  const router = useRouter();

  const cardBg     = isDark ? "#2E3F5C" : "#FFFFFF";
  const textMain   = isDark ? "#F1F5F9" : "#263450";
  const textMuted  = isDark ? "#94A3B8" : "#6B7280";

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
        className="auth-card auth-single-card"
        style={{ background: cardBg, boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.55)" : "0 24px 64px rgba(15,30,58,0.12)" }}
      >
        <div className="auth-single-card-corner" />

        <button
          className="auth-back-btn auth-b0"
          onClick={() => router.push("/login")}
          style={{ color: textMuted, marginBottom: 24, padding: "6px 0" }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: isRtl ? "scaleX(-1)" : "none" }}>
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("auth.shared.backToLogin", "Back to sign in")}
        </button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: textMain, letterSpacing: "-0.5px" }}>
            {t("auth.login.faceId", "Sign in with Face ID")}
          </h1>
          <p style={{ fontSize: 14, color: textMuted, marginTop: 8 }}>
            {t("auth.faceLoginDesc", "Center your face in the camera frame to sign in instantly.")}
          </p>
        </div>

        <FaceLoginButton />
      </div>
    </div>
  );
}
