"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanFace, X } from "lucide-react";
import { toast } from "sonner";

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
import { setAuthToken } from "@/lib/api";
import { faceLoginRequest } from "@/services/authService";

/**
 * Face login flow:
 *  - Opens the user's webcam, captures a single JPEG frame
 *  - Sends it as a base64 data URL to POST /face-login
 *  - On success, stores the returned token and routes to the dashboard.
 */
export function FaceLoginButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ScanFace className="me-2 h-4 w-4" />
          Sign in with Face ID
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
        setError(
          e instanceof Error ? e.message : "Could not access the camera",
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

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
      const { token } = await faceLoginRequest(dataUrl);
      setAuthToken(token);
      toast.success("Welcome back");
      onClose();
      router.push("/dashboard");
      // Force reload so the AuthProvider picks up the new session.
      if (typeof window !== "undefined") window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Face login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Sign in with your face</DialogTitle>
        <DialogDescription>
          Center your face in the frame, then capture to sign in.
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
              <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-primary/60" />
            </>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={capture} disabled={!ready || submitting || !!error}>
          <Camera className="me-2 h-4 w-4" />
          {submitting ? "Verifying..." : "Capture & sign in"}
        </Button>
      </DialogFooter>
    </>
  );
}
