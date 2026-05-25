"use client";

// Re-exports from the project's own theme implementation.
// next-themes is not used — the custom ThemeProvider in @/lib/theme handles
// dark-mode toggling, localStorage persistence, and the useTheme hook.
export { ThemeProvider, useTheme } from "@/lib/theme";
