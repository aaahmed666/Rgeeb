"use client";

import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function ProfileView() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{user?.name}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.personalInfo")}</CardTitle>
            <CardDescription>{t("profile.title")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("profile.firstName")}</Label>
                <Input defaultValue={user?.name.split(" ")[0]} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("profile.lastName")}</Label>
                <Input defaultValue={user?.name.split(" ")[1] ?? ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("profile.email")}</Label>
              <Input type="email" defaultValue={user?.email} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("profile.phone")}</Label>
              <Input type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("profile.bio")}</Label>
              <Textarea rows={3} placeholder="Tell us about yourself..." />
            </div>
            <Button>{t("profile.updateProfile")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.changePassword")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type="password" />
            </div>
            <Button variant="secondary">{t("common.save")}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
