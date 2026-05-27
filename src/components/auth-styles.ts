/**
 * Shared design tokens and style helpers for all auth pages.
 * Import from "@/components/auth-styles".
 */

// ─── Color palette ────────────────────────────────────────────────────────────

export const COLORS = {
  orange: "#F97316",
  red: "#EF4444",

  // Dark-mode surfaces  (#2E3F5C base palette)
  cardDark: "#263450",       // inputs / deeper cards
  inputDark: "#243552",      // left-panel / input backgrounds
  borderDark: "rgba(255,255,255,0.12)",
  borderDarkSubtle: "rgba(255,255,255,0.07)",

  // Text – dark mode
  textDark: "#F1F5F9",
  textDarkMuted: "#94A3B8",
  textDarkFaint: "#475569",
  textDarkBorder: "#CBD5E1",

  // Light-mode surfaces
  bgCard: "#FFFFFF",
  inputLight: "#F9FAFB",
  borderLight: "rgba(15,30,58,0.15)",

  // Text – light mode
  textLight: "#0F1E3A",
  textLightMuted: "#6B7280",
  textLightFaint: "#9CA3AF",
} as const;

// ─── Page / card helpers ──────────────────────────────────────────────────────

export function getAuthPageBg(isDark: boolean): string {
  return isDark
    ? "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(249,115,22,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 110%, rgba(30,45,80,0.6) 0%, transparent 60%), #1C2D45"
    : "radial-gradient(ellipse 80% 60% at 70% -10%, rgba(249,115,22,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 110%, rgba(15,30,58,0.07) 0%, transparent 60%), #EDE8E0";
}

export function getCardShadow(isDark: boolean): string {
  return isDark
    ? "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)"
    : "0 32px 80px rgba(15,30,58,0.14), 0 0 0 1px rgba(15,30,58,0.07)";
}

// ─── Input / button style factories ──────────────────────────────────────────

export function getInputStyle(
  isDark: boolean,
  hasError = false
): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: `1.5px solid ${
      hasError ? COLORS.red : isDark ? COLORS.borderDark : COLORS.borderLight
    }`,
    background: isDark ? COLORS.inputDark : COLORS.inputLight,
    color: isDark ? COLORS.textDark : COLORS.textLight,
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };
}

export function getPrimaryBtnStyle(
  loading = false,
  height = 48
): React.CSSProperties {
  return {
    height,
    borderRadius: 12,
    border: "none",
    background: loading
      ? "rgba(249,115,22,0.6)"
      : "linear-gradient(135deg,#F97316,#EA580C)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s",
    boxShadow: loading ? "none" : "0 8px 24px rgba(249,115,22,0.38)",
  };
}

// ─── React import (used only for CSSProperties type reference) ────────────────
import type React from "react";
