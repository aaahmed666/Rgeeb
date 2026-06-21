"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={t("common.toggleTheme")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
