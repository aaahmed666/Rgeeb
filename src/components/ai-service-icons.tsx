// Custom SVG icons for AI Services Hub — replaces generic lucide-react icons
import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

// ── Safety ─────────────────────────────────────────────────────────────────

export function HardHatIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M12 2C8.5 2 5.5 4.5 5 8H4a1 1 0 00-1 1v2a1 1 0 001 1h16a1 1 0 001-1V9a1 1 0 00-1-1h-1c-.5-3.5-3.5-6-7-6z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M12 2v6M8.5 4.5L10 8M15.5 4.5L14 8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="14"
        width="18"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        opacity=".7"
      />
      <rect
        x="6"
        y="17.5"
        width="12"
        height="1.5"
        rx=".75"
        fill="currentColor"
        opacity=".5"
      />
    </svg>
  );
}

export function ChefHatIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <ellipse
        cx="12"
        cy="7"
        rx="7"
        ry="5.5"
        fill="currentColor"
        opacity=".9"
      />
      <circle
        cx="7"
        cy="7.5"
        r="2.5"
        fill="white"
        opacity=".3"
      />
      <circle
        cx="17"
        cy="7.5"
        r="2.5"
        fill="white"
        opacity=".3"
      />
      <circle
        cx="12"
        cy="5"
        r="2"
        fill="white"
        opacity=".3"
      />
      <rect
        x="6"
        y="11"
        width="12"
        height="7"
        rx="1"
        fill="currentColor"
        opacity=".8"
      />
      <rect
        x="6"
        y="18"
        width="12"
        height="1.5"
        rx=".75"
        fill="currentColor"
        opacity=".6"
      />
      <path
        d="M9 14h6M9 16.5h4"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M7 10V7a5 5 0 0110 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2.5"
        fill="currentColor"
        opacity=".9"
      />
      <circle
        cx="12"
        cy="15.5"
        r="2"
        fill="white"
        opacity=".8"
      />
      <rect
        x="11"
        y="15.5"
        width="2"
        height="3"
        rx="1"
        fill="white"
        opacity=".8"
      />
    </svg>
  );
}

export function FlameIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M12 2C9 6 7 8 8 12c-2-1-2-4-2-4-3 3-2 8 2 10.5A6 6 0 0012 22a6 6 0 006-6c0-3-2-5-3-6 0 2-1 3-3 3 2-3 2-7 0-11z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M12 18a2 2 0 01-2-2c0-1.5 1-2.5 2-3 1 .5 2 1.5 2 3a2 2 0 01-2 2z"
        fill="white"
        opacity=".7"
      />
    </svg>
  );
}

export function CigaretteIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <rect
        x="2"
        y="13"
        width="14"
        height="4"
        rx="2"
        fill="currentColor"
        opacity=".9"
      />
      <rect
        x="16"
        y="13"
        width="6"
        height="4"
        rx="2"
        fill="currentColor"
        opacity=".5"
      />
      <path
        d="M17 10c0-3 2-4 2-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M20 10c0-2 1-3 1-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".5"
      />
    </svg>
  );
}

export function DropletsIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M12 3C12 3 7 9 7 13a5 5 0 0010 0c0-4-5-10-5-10z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M7 3c0 0-3 4-3 6a3 3 0 006 0c0-2-3-6-3-6z"
        fill="currentColor"
        opacity=".6"
      />
      <path
        d="M17 7c0 0-3 4-3 6a3 3 0 006 0c0-2-3-6-3-6z"
        fill="currentColor"
        opacity=".6"
      />
    </svg>
  );
}

// ── Analytics ──────────────────────────────────────────────────────────────

export function UsersIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <circle
        cx="9"
        cy="7"
        r="3.5"
        fill="currentColor"
        opacity=".9"
      />
      <circle
        cx="16"
        cy="7"
        r="2.5"
        fill="currentColor"
        opacity=".6"
      />
      <path
        d="M2 19c0-4 3-7 7-7s7 3 7 7"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M16 12c2.5 0 5 1.8 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  );
}

export function ActivityIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <polyline
        points="22,12 18,12 15,20 9,4 6,12 2,12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function TrendingUpIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <polyline
        points="23,6 13.5,15.5 8.5,10.5 1,18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity=".9"
      />
      <polyline
        points="17,6 23,6 23,12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function UserCheckIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <circle
        cx="9"
        cy="7"
        r="4"
        fill="currentColor"
        opacity=".85"
      />
      <path
        d="M2 21c0-4 3-7 7-7s7 3 7 7"
        fill="currentColor"
        opacity=".85"
      />
      <path
        d="M16 11l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScanFaceIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M3 7V4a1 1 0 011-1h3M17 3h3a1 1 0 011 1v3M21 17v3a1 1 0 01-1 1h-3M7 21H4a1 1 0 01-1-1v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="9"
        cy="10"
        r="1.2"
        fill="currentColor"
      />
      <circle
        cx="15"
        cy="10"
        r="1.2"
        fill="currentColor"
      />
      <path
        d="M9 15s1 2 3 2 3-2 3-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AlignJustifyIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <circle
        cx="5"
        cy="6"
        r="1.5"
        fill="currentColor"
      />
      <rect
        x="9"
        y="4.5"
        width="12"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity=".9"
      />
      <circle
        cx="5"
        cy="12"
        r="1.5"
        fill="currentColor"
      />
      <rect
        x="9"
        y="10.5"
        width="12"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity=".7"
      />
      <circle
        cx="5"
        cy="18"
        r="1.5"
        fill="currentColor"
        opacity=".5"
      />
      <rect
        x="9"
        y="16.5"
        width="8"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity=".5"
      />
    </svg>
  );
}

export function ClockIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        opacity=".15"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7v5l3.5 3.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Operations ─────────────────────────────────────────────────────────────

export function CreditCardIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2.5"
        fill="currentColor"
        opacity=".9"
      />
      <rect
        x="2"
        y="9"
        width="20"
        height="4"
        fill="white"
        opacity=".25"
      />
      <rect
        x="4"
        y="15"
        width="5"
        height="2"
        rx="1"
        fill="white"
        opacity=".6"
      />
      <rect
        x="11"
        y="15"
        width="3"
        height="2"
        rx="1"
        fill="white"
        opacity=".4"
      />
    </svg>
  );
}

export function UtensilsCrossedIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M3 3l18 18M3 21L10.5 13.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8 3a5 5 0 015 5 5 5 0 01-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity=".8"
      />
      <path
        d="M16 3v4c0 1.1.9 2 2 2h0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".8"
      />
      <path
        d="M18 9v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".8"
      />
    </svg>
  );
}

export function CoffeeIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M18 8h1a4 4 0 010 8h-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity=".7"
      />
      <path
        d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M6 1v3M10 1v3M14 1v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  );
}

export function TruckIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M1 3h15v13H1z"
        fill="currentColor"
        opacity=".9"
        rx="1"
      />
      <path
        d="M16 8h4l3 3v5h-7V8z"
        fill="currentColor"
        opacity=".7"
      />
      <circle
        cx="5.5"
        cy="18.5"
        r="2.5"
        fill="currentColor"
      />
      <circle
        cx="18.5"
        cy="18.5"
        r="2.5"
        fill="currentColor"
        opacity=".8"
      />
      <rect
        x="1"
        y="3"
        width="15"
        height="13"
        rx="1"
        fill="currentColor"
        opacity=".9"
      />
    </svg>
  );
}

export function CarIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M5 11l2-5h10l2 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <rect
        x="2"
        y="11"
        width="20"
        height="7"
        rx="2"
        fill="currentColor"
        opacity=".9"
      />
      <rect
        x="4"
        y="12.5"
        width="4"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".5"
      />
      <rect
        x="16"
        y="12.5"
        width="4"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".5"
      />
      <circle
        cx="6"
        cy="19.5"
        r="2"
        fill="currentColor"
      />
      <circle
        cx="18"
        cy="19.5"
        r="2"
        fill="currentColor"
      />
    </svg>
  );
}

export function ReceiptIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M4 2h16v20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L4 22V2z"
        fill="currentColor"
        opacity=".9"
      />
      <rect
        x="7"
        y="7"
        width="10"
        height="1.5"
        rx=".75"
        fill="white"
        opacity=".7"
      />
      <rect
        x="7"
        y="10.5"
        width="10"
        height="1.5"
        rx=".75"
        fill="white"
        opacity=".7"
      />
      <rect
        x="7"
        y="14"
        width="6"
        height="1.5"
        rx=".75"
        fill="white"
        opacity=".5"
      />
    </svg>
  );
}

export function SandwichIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M3 6h18l-1 3H4L3 6z"
        fill="currentColor"
        opacity=".8"
        rx="1"
      />
      <path
        d="M4 9h16l1 3H3l1-3z"
        fill="currentColor"
        opacity=".6"
      />
      <path
        d="M3 12h18l1 3H2l1-3z"
        fill="currentColor"
        opacity=".8"
      />
      <path
        d="M4 15h16a2 2 0 01-2 2H6a2 2 0 01-2-2z"
        fill="currentColor"
        opacity=".9"
      />
    </svg>
  );
}

// ── Monitoring ─────────────────────────────────────────────────────────────

export function NavigationIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <polygon
        points="3,11 22,2 13,21 11,13"
        fill="currentColor"
        opacity=".9"
      />
    </svg>
  );
}

export function IdCardIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        fill="currentColor"
        opacity=".9"
      />
      <circle
        cx="8"
        cy="12"
        r="3"
        fill="white"
        opacity=".5"
      />
      <rect
        x="13"
        y="9"
        width="7"
        height="2"
        rx="1"
        fill="white"
        opacity=".6"
      />
      <rect
        x="13"
        y="13"
        width="5"
        height="2"
        rx="1"
        fill="white"
        opacity=".4"
      />
    </svg>
  );
}

export function EyeIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
        fill="currentColor"
        opacity=".9"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="white"
        opacity=".7"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="currentColor"
        opacity=".9"
      />
    </svg>
  );
}

export function RadioIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M5.6 5.6a9 9 0 0012.8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity=".5"
      />
      <path
        d="M8.5 8.5a5 5 0 007 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity=".7"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        fill="currentColor"
        opacity=".9"
      />
      <line
        x1="12"
        y1="14.5"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="21"
        x2="16"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BoxIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M21 8l-9-5-9 5v8l9 5 9-5V8z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M3 8l9 5 9-5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".5"
        fill="none"
      />
      <path
        d="M12 13v8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".5"
      />
    </svg>
  );
}

export function AlertOctagonIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <polygon
        points="7.86,2 16.14,2 22,7.86 22,16.14 16.14,22 7.86,22 2,16.14 2,7.86"
        fill="currentColor"
        opacity=".9"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="13"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16.5"
        r="1.2"
        fill="white"
      />
    </svg>
  );
}

export function PersonStandingIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <circle
        cx="12"
        cy="4.5"
        r="2.5"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M8 22l1.5-6 2.5 2 2.5-2L16 22"
        fill="currentColor"
        opacity=".8"
      />
      <path
        d="M9 10h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".5"
      />
      <path
        d="M12 7v9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".9"
      />
    </svg>
  );
}

export function SearchPersonIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="currentColor"
        opacity=".15"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="10"
        cy="8"
        r="2.5"
        fill="currentColor"
        opacity=".8"
      />
      <path
        d="M5.5 15c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"
        fill="currentColor"
        opacity=".8"
      />
      <line
        x1="15.5"
        y1="15.5"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BusIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        fill="currentColor"
        opacity=".9"
      />
      <rect
        x="3"
        y="14"
        width="18"
        height="3"
        rx="1"
        fill="currentColor"
        opacity=".7"
      />
      <rect
        x="5"
        y="6.5"
        width="5"
        height="3.5"
        rx="1"
        fill="white"
        opacity=".5"
      />
      <rect
        x="14"
        y="6.5"
        width="5"
        height="3.5"
        rx="1"
        fill="white"
        opacity=".5"
      />
      <circle
        cx="7"
        cy="19"
        r="2"
        fill="currentColor"
      />
      <circle
        cx="17"
        cy="19"
        r="2"
        fill="currentColor"
      />
      <line
        x1="3"
        y1="10"
        x2="3"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 4h18"
        stroke="white"
        strokeWidth="1.5"
        opacity=".3"
      />
    </svg>
  );
}

// ── Fire Detection (separate from Flame/Smoke & Fire) ──
export function FireDetectionIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      <path
        d="M12 2C9 6 7 8 8 12c-2-1-2-4-2-4-3 3-2 8 2 10.5A6 6 0 0012 22a6 6 0 006-6c0-3-2-5-3-6 0 2-1 3-3 3 2-3 2-7 0-11z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M12 18a2 2 0 01-2-2c0-1.5 1-2.5 2-3 1 .5 2 1.5 2 3a2 2 0 01-2 2z"
        fill="white"
        opacity=".7"
      />
    </svg>
  );
}

// ── Smoke Detection (separate from Fire Detection) ──
export function SmokeDetectionIcon({ className, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...p}
    >
      {/* Smoke cloud layers */}
      <path
        d="M4 18c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2s-.9 2-2 2H6c-1.1 0-2-.9-2-2z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M6 14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2s-.9 2-2 2H8c-1.1 0-2-.9-2-2z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M8 10c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4c-1.1 0-2-.9-2-2z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Wisp at top */}
      <path
        d="M11 8c0-2 1-3 1-5 0 0 1 1 1 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
