"use client";

import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Unlink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import RegistrationFatoorahFlow from "@/components/RegistrationFatoorahFlow";

/* ------------------------------------------------------------------ */
/* Service calls                                                        */
/* ------------------------------------------------------------------ */
interface FatoorahStatus {
  linked: boolean;
  email?: string;
  linked_at?: string;
}

async function fetchFatoorahStatus(): Promise<FatoorahStatus> {
  try {
    const res = await apiFetch<unknown>(endpoints.payment.fatoorahStatus);
    const obj = res as Record<string, unknown>;
    const data = (obj?.data ?? obj) as Record<string, unknown>;
    return {
      linked: Boolean(data?.linked ?? data?.is_linked ?? false),
      email: data?.email as string | undefined,
      linked_at: data?.linked_at as string | undefined,
    };
  } catch {
    return { linked: false };
  }
}

async function linkFatoorah(payload: {
  email: string;
  password: string;
}): Promise<void> {
  await apiFetch(endpoints.payment.linkFatoorah, {
    method: "POST",
    body: payload,
  });
}

async function unlinkFatoorah(): Promise<void> {
  await apiFetch(endpoints.payment.unlinkFatoorah, { method: "POST" });
}

/* ------------------------------------------------------------------ */
/* View                                                                 */
/* ------------------------------------------------------------------ */
export default function FatoorahView() {
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const { t } = useTranslation();
  const can = usePermission("fatoorah");
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const status = useQuery({
    queryKey: ["fatoorah-status"],
    queryFn: fetchFatoorahStatus,
  });

  const linkMut = useMutation({
    mutationFn: () => linkFatoorah({ email, password }),
    onSuccess: () => {
      toast.success(
        t("fatoorah.linked", "Fatoorah account linked successfully")
      );
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["fatoorah-status"] });
    },
    onError: () =>
      toast.error(
        t(
          "fatoorah.linkFailed",
          "Failed to link account. Please check your credentials."
        )
      ),
  });

  const unlinkMut = useMutation({
    mutationFn: unlinkFatoorah,
    onSuccess: () => {
      toast.success(t("fatoorah.unlinked", "Fatoorah account unlinked"));
      qc.invalidateQueries({ queryKey: ["fatoorah-status"] });
    },
    onError: () =>
      toast.error(t("fatoorah.unlinkFailed", "Failed to unlink account")),
  });

  const isLinked = status.data?.linked;

  /* Loading */
  if (status.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ── Connected state ─────────────────────────────────────────────── */
  if (isLinked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="mb-1 text-2xl font-bold text-card-foreground">
            {t("fatoorah.connectedTitle", "Fatoorah Connected")}
          </h2>
          <p className="mb-2 text-sm text-muted-foreground">
            {t(
              "fatoorah.connectedDesc",
              "Your Fatoorah account is linked and active."
            )}
          </p>
          {status.data?.email && (
            <p className="mb-6 text-sm font-medium text-foreground">
              {status.data.email}
            </p>
          )}
          {status.data?.linked_at && (
            <p className="mb-6 text-xs text-muted-foreground">
              {t("fatoorah.linkedSince", "Linked since")}{" "}
              {new Date(status.data.linked_at).toLocaleDateString()}
            </p>
          )}
          <button
            onClick={() => setShowUnlinkConfirm(true)}
            disabled={!can.delete || unlinkMut.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-6 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
          >
            {unlinkMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="h-4 w-4" />
            )}
            {t("fatoorah.unlinkAccount", "Unlink Account")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Not connected — Link form ───────────────────────────────────── */
  return (
    <>
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#1a2744]">
          <Link2 className="h-10 w-10 text-white" />
        </div>

        {/* Heading */}
        <h2 className="mb-1 text-center text-2xl font-bold text-[#1a2744]">
          {t("fatoorah.title", "Link Fatoorah Account")}
        </h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {t(
            "fatoorah.subtitle",
            "Connect your Fatoorah account to enable payment processing"
          )}
        </p>

        {/* Form */}
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("fatoorah.email", "Email Address")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@rgeeb.com"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none ring-0 transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("fatoorah.password", "Password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none ring-0 transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => linkMut.mutate()}
            disabled={!can.create || !email.trim() || !password.trim() || linkMut.isPending}
            style={{ color: "#ffffff" }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2744] py-3 text-sm font-semibold transition hover:bg-[#243460] disabled:opacity-60"
          >
            {linkMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {t("fatoorah.linkAccount", "Link Account")}
          </button>
        </div>

        {/* Security note */}
        <div className="mt-6 flex gap-2.5 rounded-xl bg-muted/50 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {t("fatoorah.secureTitle", "Secure Connection")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "fatoorah.secureDesc",
                "Your credentials are encrypted and securely stored. We never share your information with third parties."
              )}
            </p>
          </div>
        </div>

        {/* Error */}
        {linkMut.isError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t(
              "fatoorah.linkFailed",
              "Failed to link account. Please check your credentials."
            )}
          </div>
        )}
      </div>

      {/* Registration → Fatoorah flow diagram */}
      <RegistrationFatoorahFlow />
    </div>
    <ConfirmDeleteDialog
      open={showUnlinkConfirm}
      onOpenChange={setShowUnlinkConfirm}
      title={t("fatoorah.confirmUnlink", "Unlink Account")}
      description={t("fatoorah.confirmUnlinkDesc", "Are you sure you want to unlink your Fatoorah account? This cannot be undone.")}
      onConfirm={() => { setShowUnlinkConfirm(false); unlinkMut.mutate(); }}
    />
    </>
  );
}
