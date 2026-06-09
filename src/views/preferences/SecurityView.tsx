"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Shield, Loader2, KeyRound, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  disableTwoFactor, enableTwoFactor, fetchTwoFactorStatus, setupTwoFactor, TwoFactorSetup,
} from "@/services/securityService";

export default function SecurityView() {
  const { t } = useTranslation();
  const can = usePermission("security");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [confirmDisable, setConfirmDisable] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["security", "2fa"],
    queryFn: fetchTwoFactorStatus,
  });

  const setupMut = useMutation({
    mutationFn: () => setupTwoFactor(),
    onSuccess: (s) => { setSetup(s); setOpen(true); },
    onError: (e: Error) => toast.error(e.message),
  });

  const enableMut = useMutation({
    mutationFn: () => enableTwoFactor(code),
    onSuccess: () => {
      toast.success(t("security.enabled", "Two-factor authentication enabled"));
      qc.invalidateQueries({ queryKey: ["security", "2fa"] });
      setOpen(false);
      setCode("");
      setSetup(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disableMut = useMutation({
    mutationFn: () => disableTwoFactor(),
    onSuccess: () => {
      toast.success(t("security.disabled", "Two-factor authentication disabled"));
      qc.invalidateQueries({ queryKey: ["security", "2fa"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
          <ShieldCheck className="h-6 w-6" />
          {t("security.title", "Security Settings")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("security.subtitle", "Manage your account security and two-factor authentication")}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t("security.twoFactor", "Two-Factor Authentication")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("security.twoFactorSub", "Add an extra layer of security to your account")}
              </p>
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : status?.enabled ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="me-1 h-3 w-3" />
                {t("security.enabledLabel", "Enabled")}
              </Badge>
            ) : (
              <Badge variant="outline">{t("security.disabledLabel", "Disabled")}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("security.use", "Use an authenticator app like Google Authenticator or Authy to generate verification codes.")}
          </p>
          {status?.enabled ? (
            <Button
              variant="destructive"
              disabled={!can.update || disableMut.isPending}
              onClick={() => can.update && setConfirmDisable(true)}
            >
              {disableMut.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              <Shield className="me-2 h-4 w-4" />
              {t("security.disable", "Disable 2FA")}
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95"
              disabled={!can.update || setupMut.isPending}
              onClick={() => can.update && setupMut.mutate()}
            >
              {setupMut.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              <ShieldCheck className="me-2 h-4 w-4" />
              {t("security.enable", "Enable 2FA")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCode(""); setSetup(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("security.scanQr", "Scan QR Code")}</DialogTitle>
            <DialogDescription>
              {t("security.scanQrDesc", "Scan the QR code with your authenticator app, then enter the 6-digit code below.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {setup?.qrCode ? (
              <div className="flex justify-center rounded-lg border bg-white p-4">
                {setup.qrCode.startsWith("<svg") ? (
                  <div className="h-48 w-48" dangerouslySetInnerHTML={{ __html: setup.qrCode }} />
                ) : (
                  <img src={setup.qrCode} alt="2FA QR code" className="h-48 w-48 object-contain" />
                )}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border text-sm text-muted-foreground">
                {t("security.noQr", "No QR code returned by server")}
              </div>
            )}
            {setup?.secret && (
              <div className="flex items-center gap-2 rounded-md border bg-muted p-2 text-xs">
                <KeyRound className="h-3.5 w-3.5" />
                <code className="flex-1 truncate font-mono">{setup.secret}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(setup.secret!);
                    toast.success(t("common.copied", "Copied"));
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t("security.verificationCode", "Verification Code")}</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>
            {setup?.recoveryCodes && setup.recoveryCodes.length > 0 && (
              <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
                <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {t("security.recoveryCodes", "Recovery Codes — save these somewhere safe")}
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-900 dark:text-amber-200">
                  {setup.recoveryCodes.map((c) => <div key={c}>{c}</div>)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button disabled={!can.update || code.length !== 6 || enableMut.isPending} onClick={() => can.update && enableMut.mutate()}>
              {enableMut.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("security.confirm", "Confirm & Enable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        title={t("security.confirmDisableTitle", "Disable Two-Factor Authentication")}
        description={t("security.confirmDisableDesc", "Are you sure you want to disable 2FA? This will reduce your account security.")}
        confirmLabel={t("security.disable", "Disable 2FA")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={() => { disableMut.mutate(); setConfirmDisable(false); }}
      />
    </div>
  );
}
