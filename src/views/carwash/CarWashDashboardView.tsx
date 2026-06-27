"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  Car,
  Video,
  Sparkles,
  Timer,
  Plus,
  CameraOff,
  Camera as CameraIcon,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  carWashService,
  type CarWashCamera,
  type CarWashSummary,
} from "@/services/carWashService";

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  Icon,
  accent,
  highlighted,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  Icon: React.ElementType;
  accent: string;
  highlighted?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className={cn("relative p-5", highlighted && "ring-1 ring-primary/40")}>
      {highlighted && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      )}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-20" />
      ) : (
        <p className={cn("mt-3 text-3xl font-bold", accent)}>{value}</p>
      )}
    </Card>
  );
}

/* ── Camera card ───────────────────────────────────────────────────────── */
function CameraCard({
  camera,
  onOpen,
}: {
  camera: CarWashCamera;
  onOpen: (c: CarWashCamera) => void;
}) {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={() => onOpen(camera)} className="group text-start">
      <Card className="overflow-hidden transition-colors hover:border-primary/50">
        <div className="flex aspect-video items-center justify-center bg-muted/40">
          {camera.online ? (
            <CameraIcon className="h-10 w-10 text-muted-foreground/60 transition-colors group-hover:text-primary/70" />
          ) : (
            <CameraOff className="h-10 w-10 text-muted-foreground/40" />
          )}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-base font-semibold">{camera.name}</h3>
          <p className="text-sm text-muted-foreground">{camera.location}</p>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                camera.online
                  ? "bg-[var(--status-success)]/15 text-[var(--status-success)]"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  camera.online ? "bg-[var(--status-success)]" : "bg-muted-foreground",
                )}
              />
              {camera.online ? t("carWash.online") : t("carWash.offline")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("carWash.zonesCount", { count: camera.zones })}
            </span>
          </div>
        </div>
      </Card>
    </button>
  );
}

export default function CarWashDashboardView() {
  const { t } = useTranslation();
  const router = useRouter();

  const [summary, setSummary] = useState<CarWashSummary | null>(null);
  const [cameras, setCameras] = useState<CarWashCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        carWashService.getSummary(),
        carWashService.getCameras(),
      ]);
      setSummary(s);
      setCameras(c);
    } catch {
      setError(t("carWash.loadError", "Could not load car wash data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLabel = useMemo(
    () => (summary ? `${summary.activeCameras}/${summary.totalCameras}` : "—"),
    [summary],
  );

  const openCamera = (c: CarWashCamera) => {
    router.push(`/dashboard/carwash/live?camera=${encodeURIComponent(c.id)}`);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("carWash.dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("carWash.dashboard.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("me-2 h-4 w-4", loading && "animate-spin")} />
          {t("common.refresh")}
        </Button>
      </div>

      {error && (
        <Card className="flex items-center gap-3 border-destructive/40 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="outline" size="sm" className="ms-auto" onClick={load}>
            {t("common.retry", "Retry")}
          </Button>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("carWash.stats.totalVehicles")}
          value={summary?.totalVehicles ?? 0}
          Icon={Car}
          accent="text-[var(--status-success)]"
          loading={loading}
        />
        <StatCard
          label={t("carWash.stats.activeCameras")}
          value={activeLabel}
          Icon={Video}
          accent="text-[var(--status-info)]"
          highlighted
          loading={loading}
        />
        <StatCard
          label={t("carWash.stats.fullService")}
          value={summary?.fullService ?? 0}
          Icon={Sparkles}
          accent="text-primary"
          loading={loading}
        />
        <StatCard
          label={t("carWash.stats.avgDuration")}
          value={summary?.avgDurationMin ?? 0}
          Icon={Timer}
          accent="text-foreground"
          loading={loading}
        />
      </div>

      {/* Cameras */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("carWash.cameras.title")}</h2>
        <Button size="sm">
          <Plus className="me-2 h-4 w-4" />
          {t("carWash.cameras.add")}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : cameras.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          {t("carWash.cameras.empty", "No cameras configured yet.")}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cameras.map((camera) => (
            <CameraCard key={camera.id} camera={camera} onOpen={openCamera} />
          ))}
        </div>
      )}
    </div>
  );
}
