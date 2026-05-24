"use client";

import { useTheme } from "@/lib/theme";

interface LogoProps {
  className?: string;
  variant?: "auto" | "light" | "dark";
}

/**
 * The light/dark image files are different artwork variants of the brand
 * logo (one optimised for light backgrounds, the other for dark). We swap
 * based on the active theme.
 */
export function Logo({ className = "h-8 w-auto", variant = "auto" }: LogoProps) {
  const { theme } = useTheme();
  const effective = variant === "auto" ? theme : variant;
  const src = effective === "dark" ? "/logo-dark.png" : "/logo-light.png";
  return <img src={src} alt="Company logo" className={className} />;
}
