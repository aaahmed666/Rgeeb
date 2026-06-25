"use client";

import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TourGuide } from "@/components/TourGuide";
import { useAuth } from "@/lib/auth";

export function AppHeader() {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="h-6"
      />
      <div className="flex-1" />

      <div
        data-tour="header-tools"
        className="flex items-center gap-2"
      >
        <TourGuide />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <Separator
        orientation="vertical"
        className="mx-1 h-6"
      />

      {user && (
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar className="h-9 w-9">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-sm leading-tight md:block">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">
              {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary me-1">
                {t("common.roleAdmin", "Admin")}
              </span>
            ) : null}
              {user.email}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        aria-label={t("common.logout")}
        title={t("common.logout")}
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}
