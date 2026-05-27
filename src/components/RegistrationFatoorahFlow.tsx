"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, GitBranch } from "lucide-react";

/**
 * RegistrationFatoorahFlow
 *
 * Renders the SVG flow diagram that shows the end-to-end path from the
 * multi-step registration form through to the Fatoorah dashboard page.
 *
 * The SVG is inlined (not an <img>) so the `sendPrompt()` onclick handlers
 * embedded in each step node stay active when the component is used inside
 * the Claude.ai artifact runtime.
 *
 * sendPrompt is injected by the artifact host; when running outside that
 * environment we fall back to a no-op so the component doesn't crash.
 */

declare global {
  interface Window {
    sendPrompt?: (text: string) => void;
  }
}

export default function RegistrationFatoorahFlow() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mt-10 w-full max-w-2xl mx-auto">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-5 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/60"
      >
        <span className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-violet-500" />
          {t(
            "fatoorah.flowDiagramTitle",
            "Registration → Fatoorah flow diagram"
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs text-muted-foreground">
            {t(
              "fatoorah.flowDiagramDesc",
              "Click any step to ask the AI assistant about that part of the code."
            )}
          </p>
          {/* SVG inlined — click handlers call window.sendPrompt() */}
          <FlowSvg />
        </div>
      )}
    </div>
  );
}

/**
 * The actual SVG diagram content.
 * Kept as a separate component so the outer collapsible stays light.
 * sendPrompt calls are wrapped in a safe helper so they don't throw
 * when running outside the Claude artifact runtime.
 */
function FlowSvg() {
  const send = (msg: string) => {
    if (
      typeof window !== "undefined" &&
      typeof window.sendPrompt === "function"
    ) {
      window.sendPrompt(msg);
    }
  };

  /* ─── arrow marker ─── */
  const arrowPath = "M2 1L8 5L2 9";

  /* ─── shared colour tokens ─── */
  const violet = {
    fill: "#EEEDFE",
    stroke: "#534AB7",
    text: "#3C3489",
    sub: "#534AB7",
  };
  const green = {
    fill: "#E1F5EE",
    stroke: "#0F6E56",
    text: "#085041",
    sub: "#0F6E56",
  };
  const sand = {
    fill: "#F1EFE8",
    stroke: "#5F5E5A",
    text: "#444441",
    sub: "#5F5E5A",
  };
  const arrow = "#73726C";
  type ColorToken = typeof violet;

  const Box = ({
    x,
    y,
    w = 320,
    h = 56,
    color,
    title,
    sub,
    onClick,
  }: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    color: ColorToken;
    title: string;
    sub?: string;
    onClick: () => void;
  }) => (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth={0.5}
      />
      <text
        x={x + w / 2}
        y={y + (sub ? h * 0.38 : h / 2)}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color.text}
        style={{ fontSize: 14, fontWeight: 500 }}
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h * 0.7}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color.sub}
          style={{ fontSize: 12 }}
        >
          {sub}
        </text>
      )}
    </g>
  );

  const Arrow = ({
    x1,
    y1,
    x2,
    y2,
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={arrow}
      strokeWidth={1.5}
      markerEnd="url(#arrow-reg)"
    />
  );

  const cx = 340; // horizontal centre

  return (
    <svg
      width="100%"
      viewBox="0 0 680 1200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Post-registration to Fatoorah flow"
    >
      <title>Post-registration to Fatoorah flow — src_2 codebase</title>

      <defs>
        <marker
          id="arrow-reg"
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path
            d={arrowPath}
            fill="none"
            stroke={arrow}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* ── Phase gutter labels ── */}
      {[
        [70, "0"],
        [190, "1"],
        [310, "2"],
        [430, "3"],
        [560, "API"],
        [680, "API"],
        [790, "→"],
        [900, "→"],
        [1010, "→"],
      ].map(([y, label]) => (
        <text
          key={String(y)}
          x={28}
          y={Number(y)}
          textAnchor="middle"
          fill="#3D3D3A"
          opacity={0.45}
          style={{ fontSize: 12 }}
        >
          {label}
        </text>
      ))}

      {/* ── STEP 0 ── */}
      <Box
        x={180}
        y={40}
        color={violet}
        title="Step 0 — Basic info"
        sub="Validates form → POST /customer/email/send-otp"
        onClick={() =>
          send("explain step 0 basic info and OTP sending in RegisterView")
        }
      />
      <Arrow
        x1={cx}
        y1={96}
        x2={cx}
        y2={130}
      />

      {/* ── STEP 1 ── */}
      <Box
        x={180}
        y={130}
        color={violet}
        title="Step 1 — Category selection"
        sub="CategoryStep — categories from useQuery"
        onClick={() =>
          send("explain the category selection step in RegisterView")
        }
      />
      <Arrow
        x1={cx}
        y1={186}
        x2={cx}
        y2={220}
      />

      {/* ── STEP 2 ── */}
      <Box
        x={180}
        y={220}
        color={violet}
        title="Step 2 — Email verification"
        sub="Enter 6-digit OTP — VerifyStep"
        onClick={() => send("explain the OTP verify step in RegisterView")}
      />
      <Arrow
        x1={cx}
        y1={276}
        x2={cx}
        y2={310}
      />

      {/* ── STEP 2 submit → register() ── */}
      <Box
        x={180}
        y={310}
        color={green}
        title="register(payload) called"
        sub="No package_id — name, email, phone, otp_code, country_id…"
        onClick={() =>
          send(
            "what does register() do in auth.tsx after OTP is verified at step 2"
          )
        }
      />
      <Arrow
        x1={cx}
        y1={366}
        x2={cx}
        y2={400}
      />

      {/* ── POST /customer/register ── */}
      <Box
        x={180}
        y={400}
        color={green}
        title="POST /customer/register"
        sub="Returns token + user — stored via setAuthToken()"
        onClick={() =>
          send(
            "what does POST /customer/register return and how is the token stored"
          )
        }
      />

      {/* Side note: localStorage */}
      <line
        x1={500}
        y1={428}
        x2={572}
        y2={428}
        stroke={arrow}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        markerEnd="url(#arrow-reg)"
      />
      <rect
        x={574}
        y={410}
        width={88}
        height={36}
        rx={6}
        fill={sand.fill}
        stroke={sand.stroke}
        strokeWidth={0.5}
      />
      <text
        x={618}
        y={428}
        textAnchor="middle"
        dominantBaseline="central"
        fill={sand.text}
        style={{ fontSize: 12 }}
      >
        localStorage
      </text>
      <text
        x={536}
        y={422}
        textAnchor="middle"
        fill="#3D3D3A"
        opacity={0.6}
        style={{ fontSize: 12 }}
      >
        token
      </text>

      <Arrow
        x1={cx}
        y1={456}
        x2={cx}
        y2={490}
      />

      {/* ── GET /customer/profile ── */}
      <Box
        x={180}
        y={490}
        color={green}
        title="GET /customer/profile"
        sub="Fetched if no user in register response"
        onClick={() =>
          send(
            "why does register() call fetchProfileRequest after registerRequest"
          )
        }
      />
      <Arrow
        x1={cx}
        y1={546}
        x2={cx}
        y2={580}
      />

      {/* ── applyUser ── */}
      <Box
        x={180}
        y={580}
        w={320}
        h={44}
        color={sand}
        title={`applyUser() — session active, role = "user"`}
        onClick={() => send("what does applyUser do in the auth context")}
      />
      <Arrow
        x1={cx}
        y1={624}
        x2={cx}
        y2={658}
      />

      {/* ── STEP 3 — Package selection ── */}
      <Box
        x={180}
        y={658}
        color={violet}
        title="Step 3 — Package selection"
        sub="PackageStep — packages filtered by categoryId"
        onClick={() =>
          send("explain the package selection step in RegisterView")
        }
      />
      <Arrow
        x1={cx}
        y1={714}
        x2={cx}
        y2={748}
      />

      {/* ── POST /customer/subscriptions/subscribe ── */}
      <Box
        x={180}
        y={748}
        color={green}
        title="POST /customer/subscriptions/subscribe"
        sub="{ package_id } — returns subscription + payment_link"
        onClick={() =>
          send(
            "explain how subscribeToPackage works and what payment_link it returns"
          )
        }
      />

      {/* ── payment_link check ── */}
      <Arrow
        x1={cx}
        y1={804}
        x2={cx}
        y2={838}
      />
      <Box
        x={180}
        y={838}
        w={320}
        h={56}
        color={green}
        title="payment_link returned?"
        sub="if yes → window.open(link, '_blank') new tab"
        onClick={() =>
          send(
            "how does RegisterView open the Fatoorah payment_link in a new tab after subscribe"
          )
        }
      />

      {/* Branch YES → new tab */}
      <line
        x1={500}
        y1={866}
        x2={572}
        y2={866}
        stroke={arrow}
        strokeWidth={1.5}
        markerEnd="url(#arrow-reg)"
      />
      <rect
        x={574}
        y={846}
        width={92}
        height={40}
        rx={6}
        fill="#E1F5EE"
        stroke="#0F6E56"
        strokeWidth={0.5}
      />
      <text
        x={620}
        y={862}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#085041"
        style={{ fontSize: 11, fontWeight: 500 }}
      >
        YES →
      </text>
      <text
        x={620}
        y={877}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#085041"
        style={{ fontSize: 10 }}
      >
        pay.fatoorah.ai
      </text>
      <text
        x={536}
        y={860}
        textAnchor="middle"
        fill="#3D3D3A"
        opacity={0.6}
        style={{ fontSize: 11 }}
      >
        window.open _blank
      </text>

      {/* router.push regardless */}
      <Arrow
        x1={cx}
        y1={894}
        x2={cx}
        y2={928}
      />

      {/* ── router.push ── */}
      <Box
        x={180}
        y={928}
        w={320}
        h={44}
        color={sand}
        title="router.push('/dashboard')"
        onClick={() =>
          send(
            "where does router.push redirect after subscription in RegisterView"
          )
        }
      />
      <Arrow
        x1={cx}
        y1={972}
        x2={cx}
        y2={1006}
      />

      {/* ── Sidebar / Fatoorah nav ── */}
      {/* ── FatoorahView ── */}
      <Box
        x={180}
        y={1096}
        color={green}
        title="FatoorahView — link form"
        sub="POST /customer/link-fatoorah { email, password } — can also unlink later"
        onClick={() =>
          send(
            "explain the FatoorahView link form and POST /customer/link-fatoorah"
          )
        }
      />

      {/* ── "how it differs from old" callout ── */}
      <rect
        x={36}
        y={390}
        width={130}
        height={160}
        rx={8}
        fill="none"
        stroke="rgba(31,30,29,0.15)"
        strokeWidth={0.5}
        strokeDasharray="4 3"
      />
      {[
        [410, "same as old app", 0.7, true],
        [428, "register first", 0.6, false],
        [444, "then separate", 0.6, false],
        [460, "subscribe call", 0.6, false],
        [480, "payment_link from", 0.6, false],
        [496, "subscribe resp.", 0.6, false],
        [514, "window.open", 0.6, false],
        [530, "→ new tab", 0.6, false],
      ].map(([y, label, opacity, bold]) => (
        <text
          key={String(y)}
          x={101}
          y={Number(y)}
          textAnchor="middle"
          fill="#3D3D3A"
          opacity={Number(opacity)}
          style={{ fontSize: 12, fontWeight: bold ? 500 : 400 }}
        >
          {String(label)}
        </text>
      ))}
      <line
        x1={166}
        y1={475}
        x2={178}
        y2={428}
        stroke={arrow}
        strokeWidth={0.5}
        strokeDasharray="4 3"
      />
    </svg>
  );
}
