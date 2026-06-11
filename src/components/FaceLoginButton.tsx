"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanFace, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setAuthToken, setAuthRole, setStoredUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { faceLoginRequest } from "@/services/authService";

/**
 * Face login flow:
 *  1. Opens webcam, captures a JPEG frame
 *  2. Sends image → POST /customer/face-login (FormData — fixed BUG-001)
 *  3. On success, stores token, applies user directly from response (fixed BUG-003)
 *  4. Redirects based on role determined from response (not from stale closure)
 */
export function FaceLoginButton() {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-full rounded-xl border-border/50 text-base font-semibold transition-all hover:-translate-y-0.5 hover:bg-secondary/50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ScanFace className="me-2 h-5 w-5" />
          {t("auth.login.faceId", "Sign in with Face ID")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {open && <FaceLoginDialogBody onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function FaceLoginDialogBody({ onClose }: { onClose: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  // refreshProfile used only for regular users after face login
  const { refreshProfile } = useAuth();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t("auth.faceLogin.cameraError", "Could not access the camera"));
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [t]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setSubmitting(true);
    try {
      const { token, user: rawUser } = await faceLoginRequest(dataUrl);

      // Store token immediately so subsequent API calls are authenticated
      if (token) setAuthToken(token);

      // Determine admin status directly from response — avoids stale closure bug.
      // Do NOT rely on isAdmin from useAuth() which reflects pre-login state.
      const rawType = String((rawUser as { type?: string })?.type ?? "").toLowerCase();
      const rawRoleName = String((rawUser as { role?: string })?.role ?? "").toLowerCase();
      const resolvedAdmin =
        rawType === "admin" ||
        rawRoleName === "rgeeb admin" ||
        rawRoleName === "admin";

      if (resolvedAdmin) {
        // Admin: persist role and minimal user directly from face login response
        setAuthRole("admin");
        if (rawUser) {
          setStoredUser({
            id: String(rawUser.id ?? rawUser.uuid ?? ""),
            name: rawUser.name_en ?? rawUser.name ?? rawUser.email ?? "Admin",
            email: rawUser.email ?? "",
            role: "admin",
            permissions: [],
          });
        }
      } else {
        // Regular user: fetch full profile to get roles and permissions
        await refreshProfile();
      }

      toast.success(t("auth.faceLogin.success", "Welcome back"));
      onClose();
      if (resolvedAdmin) {
        // Admin: the in-memory auth context cannot be refreshed via
        // /customer/profile (customer-only endpoint), so a client-side
        // router.push would land on the admin dashboard with a stale,
        // unauthenticated context. A full navigation re-mounts
        // AuthProvider, which hydrates from the storage we just wrote.
        window.location.assign("/dashboard/admin");
      } else {
        // Regular user: context was refreshed via refreshProfile() above.
        router.push("/dashboard");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("auth.faceLogin.failed", "Face login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("auth.faceLogin.dialogTitle", "Sign in with your face")}</DialogTitle>
        <DialogDescription>
          {t("auth.faceLoginDesc", "Center your face in the camera frame to sign in instantly.")}
        </DialogDescription>
      </DialogHeader>

      <div className="my-4 flex items-center justify-center">
        <div className="relative aspect-square w-72 overflow-hidden rounded-2xl border bg-muted">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <X className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {/* Face oval guide */}
              <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-primary/60" />
            </>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button onClick={capture} disabled={!ready || submitting || !!error}>
          <Camera className="me-2 h-4 w-4" />
          {submitting
            ? t("auth.faceLogin.verifying", "Verifying…")
            : t("auth.faceLogin.capture", "Capture & sign in")}
        </Button>
      </DialogFooter>
    </>
  );
}
