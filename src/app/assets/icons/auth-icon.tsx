/**
 * auth-icons.tsx
 * All SVG illustrations and icon components used across auth pages.
 * Import from here instead of defining inline in views.
 */

import * as React from "react";

// ─── ShieldIllustration ───────────────────────────────────────────────────────
export function ShieldIllustration() {
  return (
    <svg
      width="160"
      height="178"
      viewBox="0 0 160 178"
      fill="none"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 36px rgba(249,115,22,0.28))" }}
    >
      <circle
        cx="80"
        cy="94"
        r="72"
        stroke="rgba(249,115,22,0.08)"
        strokeWidth="1.5"
      />
      <circle
        cx="80"
        cy="94"
        r="60"
        stroke="rgba(249,115,22,0.12)"
        strokeWidth="1.5"
      />
      <path
        d="M80 18L24 42v42c0 32 24 58 56 68 32-10 56-36 56-68V42L80 18z"
        fill="url(#shG)"
        stroke="rgba(249,115,22,0.45)"
        strokeWidth="1.5"
      />
      <path
        d="M80 30L34 50v34c0 26 19 47 46 56 27-9 46-30 46-56V50L80 30z"
        fill="url(#shI)"
        opacity="0.5"
      />
      <rect
        x="63"
        y="82"
        width="34"
        height="28"
        rx="6"
        fill="rgba(249,115,22,0.9)"
      />
      <path
        d="M68 82v-9a12 12 0 0124 0v9"
        stroke="rgba(249,115,22,0.65)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="80"
        cy="93"
        r="5"
        fill="rgba(255,255,255,0.22)"
      />
      <rect
        x="77.5"
        y="95"
        width="5"
        height="8"
        rx="2.5"
        fill="rgba(255,255,255,0.22)"
      />
      <circle
        cx="110"
        cy="134"
        r="14"
        fill="#22C55E"
        stroke="#263450"
        strokeWidth="2"
      />
      <path
        d="M104 134l5 5 8-8"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="36"
        cy="80"
        r="3"
        fill="rgba(249,115,22,0.4)"
      />
      <circle
        cx="50"
        cy="140"
        r="2.5"
        fill="rgba(249,115,22,0.3)"
      />
      <circle
        cx="124"
        cy="72"
        r="3"
        fill="rgba(249,115,22,0.4)"
      />
      <circle
        cx="115"
        cy="154"
        r="2"
        fill="rgba(249,115,22,0.25)"
      />
      <defs>
        <linearGradient
          id="shG"
          x1="80"
          y1="18"
          x2="80"
          y2="152"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#263450"
          />
          <stop
            offset="100%"
            stopColor="#263450"
          />
        </linearGradient>
        <linearGradient
          id="shI"
          x1="80"
          y1="30"
          x2="80"
          y2="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="#F97316"
            stopOpacity="0.15"
          />
          <stop
            offset="100%"
            stopColor="#F97316"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── EmailSentIllustration ────────────────────────────────────────────────────
export function EmailSentIllustration({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 120,
        height: 120,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
          animation: "authGlow 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: isDark
            ? "rgba(249,115,22,0.12)"
            : "rgba(249,115,22,0.08)",
          border: "2px solid rgba(249,115,22,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
        >
          <rect
            x="4"
            y="12"
            width="44"
            height="30"
            rx="6"
            fill="url(#emailGrad)"
            stroke="rgba(249,115,22,0.5)"
            strokeWidth="1.5"
          />
          <path
            d="M4 18l22 14 22-14"
            stroke="rgba(249,115,22,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="40"
            cy="12"
            r="10"
            fill="#22C55E"
            stroke={isDark ? "#2E3F5C" : "#fff"}
            strokeWidth="2.5"
          />
          <path
            d="M35 12l4 4 7-7"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id="emailGrad"
              x1="4"
              y1="12"
              x2="48"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor={isDark ? "#354769" : "#FFF7ED"}
              />
              <stop
                offset="100%"
                stopColor={isDark ? "#263450" : "#FFEDD5"}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#F97316",
          opacity: 0.6,
          animation: "authBadgePop 0.5s 0.3s both",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#22C55E",
          opacity: 0.5,
          animation: "authBadgePop 0.5s 0.5s both",
        }}
      />
    </div>
  );
}

// ─── LockIllustration ─────────────────────────────────────────────────────────
export function LockIllustration({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 110,
        height: 110,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
          animation: "authGlow 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.07)",
          border: "2px solid rgba(249,115,22,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
        >
          <rect
            x="9"
            y="24"
            width="34"
            height="24"
            rx="7"
            fill="url(#lockGrad)"
            stroke="rgba(249,115,22,0.55)"
            strokeWidth="1.5"
          />
          <path
            d="M16 24v-8a10 10 0 0120 0v8"
            stroke="rgba(249,115,22,0.6)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="26"
            cy="34"
            r="4.5"
            fill="rgba(249,115,22,0.85)"
          />
          <rect
            x="23.5"
            y="36"
            width="5"
            height="6"
            rx="2.5"
            fill="rgba(249,115,22,0.85)"
          />
          <defs>
            <linearGradient
              id="lockGrad"
              x1="9"
              y1="24"
              x2="43"
              y2="48"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor={isDark ? "#354769" : "#FFF7ED"}
              />
              <stop
                offset="100%"
                stopColor={isDark ? "#263450" : "#FFEDD5"}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// ─── KeyIllustration ──────────────────────────────────────────────────────────
export function KeyIllustration({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 110,
        height: 110,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          animation: "authGlow 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: isDark
            ? "rgba(249,115,22,0.09)"
            : "rgba(249,115,22,0.06)",
          border: "2px solid rgba(249,115,22,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          fill="none"
        >
          <circle
            cx="18"
            cy="22"
            r="12"
            fill="url(#keyBg)"
            stroke="rgba(249,115,22,0.55)"
            strokeWidth="1.5"
          />
          <circle
            cx="18"
            cy="22"
            r="6"
            fill="rgba(249,115,22,0.8)"
          />
          <path
            d="M27 22h18M39 22v5M43 22v4"
            stroke="rgba(249,115,22,0.75)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="keyBg"
              x1="6"
              y1="10"
              x2="30"
              y2="34"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor={isDark ? "#354769" : "#FFF7ED"}
              />
              <stop
                offset="100%"
                stopColor={isDark ? "#263450" : "#FFEDD5"}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// ─── OtpShieldIcon (mini, used inside OTP step) ───────────────────────────────
export function OtpShieldIcon({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        background: isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.07)",
        border: "2px solid rgba(249,115,22,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M20 4L6 10v10c0 8 6 14.5 14 17 8-2.5 14-9 14-17V10L20 4z"
          fill="url(#otpShG)"
          stroke="rgba(249,115,22,0.4)"
          strokeWidth="1.2"
        />
        <rect
          x="14"
          y="18"
          width="12"
          height="10"
          rx="3"
          fill="rgba(249,115,22,0.9)"
        />
        <path
          d="M16 18v-3a4 4 0 018 0v3"
          stroke="rgba(249,115,22,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <defs>
          <linearGradient
            id="otpShG"
            x1="20"
            y1="4"
            x2="20"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor="#263450"
            />
            <stop
              offset="100%"
              stopColor="#263450"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Small inline icons ───────────────────────────────────────────────────────
export const Icon = {
  Email: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect
        x="2"
        y="5"
        width="16"
        height="12"
        rx="3"
      />
      <path d="M2 8l8 5 8-5" />
    </svg>
  ),
  Password: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect
        x="4"
        y="9"
        width="12"
        height="10"
        rx="3"
      />
      <path d="M7 9V6a3 3 0 016 0v3" />
    </svg>
  ),
  EyeOff: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 3l14 14M8.5 8.5A3 3 0 0111.5 11.5M6.5 6.5C4.5 7.5 3 10 3 10s2.5 5 7 5a7 7 0 002.5-.5M13 4.5A7 7 0 0117 10s-.7 1.5-2 2.8" />
    </svg>
  ),
  Eye: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <circle
        cx="10"
        cy="10"
        r="2.5"
      />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      width="19"
      height="19"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 10h12M10 4l6 6-6 6" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 4l-6 6 6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Check: ({ size = 18 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <polyline
        points="4,10 8,14 16,6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Globe: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle
        cx="10"
        cy="10"
        r="8.5"
      />
      <path d="M10 1.5C10 1.5 7 5 7 10s3 8.5 3 8.5M10 1.5C10 1.5 13 5 13 10s-3 8.5-3 8.5M1.5 10h17M2 6.5h16M2 13.5h16" />
    </svg>
  ),
  Sun: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle
        cx="10"
        cy="10"
        r="4"
      />
      <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.2 4.2l1.1 1.1M14.7 14.7l1.1 1.1M4.2 15.8l1.1-1.1M14.7 5.3l1.1-1.1" />
    </svg>
  ),
  Moon: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M17 11.5A7.5 7.5 0 118.5 3a5.5 5.5 0 108.5 8.5z" />
    </svg>
  ),
  Spinner: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      style={{
        animation: "authSpin 0.8s linear infinite",
        transformOrigin: "center",
      }}
    >
      <circle
        cx="11"
        cy="11"
        r="8"
        strokeOpacity="0.25"
      />
      <path
        d="M11 3a8 8 0 018 8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Clock: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle
        cx="10"
        cy="10"
        r="8"
      />
      <path
        d="M10 6v4l2.5 2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  FaceId: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 3H4a1 1 0 00-1 1v2M14 3h2a1 1 0 011 1v2M6 17H4a1 1 0 01-1-1v-2M14 17h2a1 1 0 001-1v-2" />
      <circle
        cx="7.5"
        cy="8.5"
        r="1"
      />
      <circle
        cx="12.5"
        cy="8.5"
        r="1"
      />
      <path d="M7 13s1 1.5 3 1.5 3-1.5 3-1.5" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10 3v14M3 10h14" />
    </svg>
  ),
  ErrorCircle: ({ size = 13 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v2h2V9H9zm0 4v2h2v-2H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Phone: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 4h4l2 4-2.5 1.5a11 11 0 005 5L14 12l4 2v4a2 2 0 01-2 2A16 16 0 012 6a2 2 0 012-2z" />
    </svg>
  ),
  Location: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M10 2a6 6 0 00-6 6c0 5 6 10 6 10s6-5 6-10a6 6 0 00-6-6z" />
      <circle
        cx="10"
        cy="8"
        r="2"
      />
    </svg>
  ),

  // ── Envelope (small, for email preview cards) ─────────────────────────────
  EmailEnvelope: ({
    color = "#F97316",
    size = 19,
  }: {
    color?: string;
    size?: number;
  }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
    >
      <rect
        x="2"
        y="5"
        width="16"
        height="12"
        rx="3"
      />
      <path d="M2 8l8 5 8-5" />
    </svg>
  ),

  // ── Arrow right for primary buttons ────────────────────────────────────────
  ArrowRightBtn: ({ rtl = false }: { rtl?: boolean }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      style={{ transform: rtl ? "scaleX(-1)" : "none" }}
    >
      <path
        d="M4 10h12M10 4l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // ── Toast success ───────────────────────────────────────────────────────────
  ToastSuccess: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="#22C55E"
      strokeWidth="2.2"
    >
      <polyline points="4,10 8,14 16,6" />
    </svg>
  ),

  // ── Toast warning / info ────────────────────────────────────────────────────
  ToastWarning: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="#F97316"
      strokeWidth="2.2"
    >
      <path
        d="M10 6v5M10 14v1"
        strokeLinecap="round"
      />
    </svg>
  ),

  // ── Step done checkmark (small, for step progress dots) ───────────────────
  StepCheck: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
    >
      <polyline points="2,7 6,11 12,3" />
    </svg>
  ),

  // ── Verify checkmark (for verify button) ───────────────────────────────────
  VerifyCheck: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <polyline
        points="4,10 8,14 16,6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // ── Clock (for expiry timer) ────────────────────────────────────────────────
  ClockTimer: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle
        cx="10"
        cy="10"
        r="8"
      />
      <path
        d="M10 6v4l2.5 2.5"
        strokeLinecap="round"
      />
    </svg>
  ),

  // ── Checkbox tick (remember-me) ────────────────────────────────────────────
  CheckboxTick: () => (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,6 5,9 10,3" />
    </svg>
  ),

  // ── Sign-in / submit arrow (slightly larger than ArrowRightBtn) ────────────
  SignInArrow: ({ rtl = false }: { rtl?: boolean }) => (
    <svg
      width="19"
      height="19"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: rtl ? "scaleX(-1)" : "none" }}
    >
      <path d="M4 10h12M10 4l6 6-6 6" />
    </svg>
  ),

  // ── 4-square category grid icon ────────────────────────────────────────────
  CategoryGrid: ({ active = false }: { active?: boolean }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke={active ? "#F97316" : "#9CA3AF"}
      strokeWidth="1.5"
    >
      <rect
        x="2"
        y="2"
        width="7"
        height="7"
        rx="2"
      />
      <rect
        x="11"
        y="2"
        width="7"
        height="7"
        rx="2"
      />
      <rect
        x="2"
        y="11"
        width="7"
        height="7"
        rx="2"
      />
      <rect
        x="11"
        y="11"
        width="7"
        height="7"
        rx="2"
      />
    </svg>
  ),

  // ── Small check (10-11px, for active cards / radio buttons) ────────────────
  SmallCheck: () => (
    <svg
      width="10"
      height="10"
      viewBox="0 0 20 20"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
    >
      <polyline
        points="4,10 8,14 16,6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ─── EmailIllustration (large, for CheckEmailView) ────────────────────────────
export function EmailIllustration({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 130,
        height: 130,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          animation: "authGlow 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.07)",
          border: "2px solid rgba(249,115,22,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
        >
          <rect
            x="6"
            y="16"
            width="52"
            height="36"
            rx="7"
            fill="url(#ceGrad)"
            stroke="rgba(249,115,22,0.45)"
            strokeWidth="1.5"
          />
          <path
            d="M6 24l26 16 26-16"
            stroke="rgba(249,115,22,0.65)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="18"
            y="36"
            width="14"
            height="2.5"
            rx="1.25"
            fill="rgba(249,115,22,0.25)"
          />
          <rect
            x="18"
            y="42"
            width="9"
            height="2.5"
            rx="1.25"
            fill="rgba(249,115,22,0.15)"
          />
          <circle
            cx="50"
            cy="16"
            r="13"
            fill="#22C55E"
            stroke={isDark ? "#2E3F5C" : "#fff"}
            strokeWidth="3"
          />
          <path
            d="M44 16l4.5 4.5 8-8"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id="ceGrad"
              x1="6"
              y1="16"
              x2="58"
              y2="52"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor={isDark ? "#354769" : "#FFF7ED"}
              />
              <stop
                offset="100%"
                stopColor={isDark ? "#263450" : "#FFEDD5"}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 5,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "#F97316",
          opacity: 0.55,
          animation: "authBadgePop 0.5s 0.3s both",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 2,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#22C55E",
          opacity: 0.5,
          animation: "authBadgePop 0.5s 0.5s both",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: -4,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#60A5FA",
          opacity: 0.4,
          animation: "authBadgePop 0.5s 0.7s both",
        }}
      />
    </div>
  );
}

// ─── OtpIllustration (shield with lock, for OtpView) ─────────────────────────
export function OtpIllustration({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 22,
        background: isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.07)",
        border: "2px solid rgba(249,115,22,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "authGlow 4s ease-in-out infinite",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M20 3L5 9v10c0 9.4 6.4 16.7 15 19 8.6-2.3 15-9.6 15-19V9L20 3z"
          fill="url(#otpIllShG)"
          stroke="rgba(249,115,22,0.4)"
          strokeWidth="1.2"
        />
        <rect
          x="13"
          y="17"
          width="14"
          height="12"
          rx="4"
          fill="rgba(249,115,22,0.9)"
        />
        <path
          d="M15 17v-4a5 5 0 0110 0v4"
          stroke="rgba(249,115,22,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="20"
          cy="23"
          r="2.2"
          fill="rgba(255,255,255,0.5)"
        />
        <rect
          x="18.8"
          y="24"
          width="2.4"
          height="3"
          rx="1.2"
          fill="rgba(255,255,255,0.5)"
        />
        <defs>
          <linearGradient
            id="otpIllShG"
            x1="20"
            y1="3"
            x2="20"
            y2="37"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor="#263450"
            />
            <stop
              offset="100%"
              stopColor="#263450"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── SuccessIllustration (used in ResetPasswordView) ─────────────────────────
export function SuccessIllustration({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        margin: "0 auto",
        background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.07)",
        border: "2px solid rgba(34,197,94,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "authSuccessRing 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <svg
        width="46"
        height="46"
        viewBox="0 0 46 46"
        fill="none"
      >
        <circle
          cx="23"
          cy="23"
          r="20"
          fill={isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.1)"}
          stroke="rgba(34,197,94,0.35)"
          strokeWidth="1.5"
        />
        <path
          d="M13 23l8 8 13-13"
          stroke="#22C55E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
