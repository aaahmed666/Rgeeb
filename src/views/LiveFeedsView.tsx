"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Filter, LayoutGrid, List, Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { liveFeedsService, type CameraFeed } from "@/services/liveFeedsService";

const ALL = "__all__";

export default function LiveFeedsView() {
  const { t } = useTranslation();
  const [branchId, setBranchId] = React.useState<string>(ALL);
  const [view, setView] = React.useState<"list" | "grid">("list");

  const branchesQ = useQuery({
    queryKey: ["live-feeds", "branches"],
    queryFn: () => liveFeedsService.listBranches(),
  });
  const camerasQ = useQuery({
    queryKey: ["live-feeds", "cameras", branchId],
    queryFn: () =>
      liveFeedsService.listCameras({
        branchId: branchId === ALL ? undefined : branchId,
      }),
    refetchInterval: 30000,
  });

  const cameras = camerasQ.data ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("liveFeeds.title", "Live Camera Feeds")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("liveFeeds.subtitle", "Monitor your cameras in real-time")}
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <Button
            size="sm"
            variant={view === "list" ? "default" : "ghost"}
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={view === "grid" ? "default" : "ghost"}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4" />
            {t("liveFeeds.filters", "Filters")}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t("liveFeeds.branch", "Branch")}
              </label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("liveFeeds.allBranches", "All branches")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>
                    {t("liveFeeds.allBranches", "All branches")}
                  </SelectItem>
                  {(branchesQ.data ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("liveFeeds.showingN", "Showing {{n}} cameras", { n: cameras.length })}
        </p>
      </div>

      {camerasQ.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="aspect-video animate-pulse bg-muted" />
              <CardContent className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cameras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Video className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              {t("liveFeeds.noCameras", "No cameras available")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            view === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {cameras.map((c) => (
            <CameraCard key={c.id} camera={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CameraCard({ camera }: { camera: CameraFeed }) {
  const { t } = useTranslation();
  const statusTone =
    camera.status === "online"
      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
      : camera.status === "degraded"
        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
        : "bg-destructive/15 text-destructive border-destructive/30";

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <Badge
          className={cn(
            "absolute top-2 z-10 border text-[10px] uppercase tracking-wide",
            statusTone,
            "end-2",
          )}
        >
          {t(`liveFeeds.status.${camera.status}`, camera.status)}
        </Badge>
        {camera.thumbnail ? (
          <img
            src={camera.thumbnail}
            alt={camera.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Logo variant="dark" className="h-16 w-auto opacity-80" />
          </div>
        )}
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{camera.name}</p>
          <Badge variant="outline" className={cn("text-[10px] uppercase", statusTone)}>
            {t(`liveFeeds.status.${camera.status}`, camera.status)}
          </Badge>
        </div>
        {camera.code && (
          <p className="text-xs text-muted-foreground">
            {t("liveFeeds.code", "Code")}: {camera.code}
          </p>
        )}
        {camera.branchName && (
          <p className="text-xs text-muted-foreground">{camera.branchName}</p>
        )}
        {camera.rtspUrl && (
          <p
            className="truncate border-t pt-2 font-mono text-[10px] text-muted-foreground/80"
            title={camera.rtspUrl}
          >
            {camera.rtspUrl}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
