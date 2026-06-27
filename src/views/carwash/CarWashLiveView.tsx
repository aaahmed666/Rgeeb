"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { Square, Play, Wifi, PenSquare, Camera as CameraIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { carWashService, type CarWashCamera } from "@/services/carWashService";

export default function CarWashLiveView() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const cameraId = params.get("camera") ?? undefined;

  const [cameras, setCameras] = useState<CarWashCamera[]>([]);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(true);
  const [now] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const list = await carWashService.getCameras();
        if (!active) return;
        setCameras(list);
        const target = cameraId ?? list[0]?.id;
        if (target) {
          const url = await carWashService.getStream(target).catch(() => null);
          if (active) setStreamUrl(url);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cameraId]);

  const camera = useMemo(
    () => cameras.find((c) => c.id === cameraId) ?? cameras[0],
    [cameras, cameraId],
  );

  const timestamp = now
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {loading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <h1 className="text-xl font-bold">{camera?.name ?? "—"}</h1>
          )}
          <p className="text-xs text-muted-foreground">
            Ejaz · {camera?.location ?? "—"} ·{" "}
            <span className="text-[var(--status-success)]">{t("carWash.online")}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={aiRunning ? "outline" : "default"}
            size="sm"
            className={cn(aiRunning && "text-destructive")}
            onClick={() => setAiRunning((v) => !v)}
            data-testid="ai-toggle-button"
          >
            {aiRunning ? (
              <>
                <Square className="me-2 h-4 w-4" />
                {t("carWash.live.stopAi")}
              </>
            ) : (
              <>
                <Play className="me-2 h-4 w-4" />
                {t("carWash.live.startAi")}
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Wifi className="me-2 h-4 w-4" />
            {t("carWash.live.testConnection")}
          </Button>
          <Button variant="outline" size="sm">
            <PenSquare className="me-2 h-4 w-4" />
            {t("carWash.live.editRoi")}
          </Button>
        </div>
      </div>

      {/* Feed */}
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-video w-full bg-muted/50">
          {streamUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              data-testid="live-video"
              src={streamUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <CameraIcon className="h-16 w-16 text-muted-foreground/30" />
              )}
            </div>
          )}

          {/* Timestamp overlay */}
          {!loading && (
            <div className="absolute left-4 top-4 rounded bg-black/50 px-2 py-1 font-mono text-sm text-white/90">
              {timestamp}
            </div>
          )}

          {/* ROI zone overlay — drawn with theme primary (orange) */}
          {aiRunning && !loading && (
            <svg
              data-testid="roi-overlay"
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1000 560"
              preserveAspectRatio="none"
            >
              <polygon
                points="180,90 690,150 600,520 60,440"
                fill="color-mix(in oklch, var(--primary) 14%, transparent)"
                stroke="var(--primary)"
                strokeWidth={4}
              />
              <g>
                <rect
                  x="300"
                  y="290"
                  width="230"
                  height="44"
                  rx="4"
                  fill="color-mix(in oklch, var(--primary) 22%, black)"
                  stroke="var(--primary)"
                  strokeWidth={3}
                />
                <text
                  x="415"
                  y="319"
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="700"
                  fill="var(--primary)"
                  style={{ letterSpacing: "2px" }}
                >
                  {t("carWash.live.detailZone")}
                </text>
              </g>
            </svg>
          )}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        {t("carWash.live.zonesHint", { count: camera?.zones ?? 0 })}
      </p>
    </div>
  );
}
