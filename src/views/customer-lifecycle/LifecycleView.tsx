"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock,
  Shield,
  UserCircle,
  Timer,
  Rocket,
  AlertTriangle,
  Heart,
  TrendingUp,
  Ticket,
  ChevronRight,
  School,
  FileCheck,
  CreditCard,
  Building,
  Camera,
  Layers,
  Settings,
  HelpCircle,
  Play,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SharedTablePaginated } from "@/components/SharedTablePaginated";
import { type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { fetchLifecycleProgress } from "@/services/customerLifecycleMockService";
import type { LifecycleStage, Milestone, LifecycleProgress } from "@/services/customerLifecycleMockService";

/* ── Stage pipeline ─────────────────────────────────────────────────────── */

function StagePipeline({ stages }: { stages: LifecycleStage[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t("customerLifecycle.pipeline", "Lifecycle Pipeline")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex items-start justify-between overflow-x-auto pb-4 scrollbar-thin">
          {/* Connector line */}
          <div className="absolute start-4 end-4 top-5 h-0.5 bg-border" />
          {stages.map((stage, i) => {
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.status === "current";
            return (
              <div
                key={stage.key}
                className="relative z-10 flex w-28 shrink-0 flex-col items-center text-center px-1"
              >
                {/* Dot */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary animate-pulse",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 bg-background text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                {/* Label */}
                <p
                  className={cn(
                    "mt-2 text-[10px] font-semibold leading-tight",
                    isCompleted && "text-foreground",
                    isCurrent && "text-primary font-bold",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {t(`lifecycle.stages.${stage.key}`, stage.label)}
                </p>
                {/* Date */}
                {stage.date && (
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{stage.date}</p>
                )}
                {stage.estimatedDate && !stage.date && (
                  <p className="mt-0.5 text-[9px] text-muted-foreground italic">
                    {t("lifecycle.est", "Est.")} {stage.estimatedDate}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Milestone status styles ─────────────────────────────────────────────── */

const MILESTONE_STATUS: Record<string, string> = {
  Completed: "bg-[var(--status-success)]/10 text-[var(--status-success)]",
  "In Progress": "bg-[var(--status-info)]/10 text-[var(--status-info)]",
  Scheduled: "bg-muted/10 text-muted-foreground dark:text-muted-foreground",
  Blocked: "bg-[var(--status-danger)]/10 text-[var(--status-danger)]",
};

/* ── Onboarding Checklist Roadmap Step type ──────────────────────────────── */

interface OnboardingStep {
  step: number;
  key: string;
  label: string;
  date?: string;
  status: "completed" | "current" | "pending";
  icon: React.ElementType;
}

/* ── Main LifecycleView ─────────────────────────────────────────────────── */

export default function LifecycleView() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "RGE-10293";
  const [activeTab, setActiveTab] = useState<string>("tracker");

  const progressQ = useQuery<LifecycleProgress>({
    queryKey: ["cl-lifecycle-progress", id],
    queryFn: () => fetchLifecycleProgress(id),
    staleTime: 30_000,
  });

  const data = progressQ.data;

  // Render Columns for Milestones Table
  const milestoneColumns: DataTableColumn<Milestone>[] = useMemo(
    () => [
      {
        key: "task",
        header: t("lifecycle.milestoneTask", "Milestone Task"),
        render: (row) => (
          <span className="text-sm font-semibold text-foreground">{row.task}</span>
        ),
      },
      {
        key: "owner",
        header: t("lifecycle.owner", "Owner"),
        render: (row) => <span className="text-sm text-muted-foreground">{row.owner}</span>,
      },
      {
        key: "targetDate",
        header: t("lifecycle.targetDate", "Target Date"),
        render: (row) => <span className="text-sm text-muted-foreground">{row.targetDate}</span>,
      },
      {
        key: "status",
        header: t("common.status", "Status"),
        render: (row) => (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold uppercase border-0", MILESTONE_STATUS[row.status])}
          >
            {row.status}
          </Badge>
        ),
      },
    ],
    [t]
  );

  // Steps for Phase 9 Onboarding Progress Checklist
  const onboardingSteps: OnboardingStep[] = useMemo(() => {
    return [
      { step: 1, key: "contract", label: t("onboarding.contract", "Contract Completed"), date: "MAY 12", status: "completed", icon: FileCheck },
      { step: 2, key: "payment", label: t("onboarding.payment", "Payment Received"), date: "MAY 14", status: "completed", icon: CreditCard },
      { step: 3, key: "branches", label: t("onboarding.branches", "Branches Added"), date: "MAY 15", status: "completed", icon: Building },
      { step: 4, key: "cameras", label: t("onboarding.cameras", "Cameras Added"), date: "MAY 15", status: "completed", icon: Camera },
      { step: 5, key: "rtsp", label: t("onboarding.rtsp", "RTSP Verified"), date: "MAY 16", status: "completed", icon: Play },
      { step: 6, key: "integrations", label: t("onboarding.integrations", "Integrations Completed"), date: "MAY 18", status: "completed", icon: Layers },
      { step: 7, key: "ai", label: t("onboarding.ai", "AI Services Activated"), status: "current", icon: Shield },
      { step: 8, key: "training", label: t("onboarding.training", "Training Completed"), status: "pending", icon: School },
      { step: 9, key: "golive", label: t("onboarding.golive", "Go Live Completed"), status: "pending", icon: Rocket },
    ];
  }, [t]);

  // Overall Onboarding percentage calculation (e.g., 6 steps completed out of 9 = 67%)
  const completedStepsCount = onboardingSteps.filter((s) => s.status === "completed").length;
  const overallPercentage = Math.round((completedStepsCount / onboardingSteps.length) * 100);

  if (progressQ.isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <p className="text-xs text-muted-foreground">
            {t("customerLifecycle.customers", "Customers")} &gt; {data?.customerName}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {activeTab === "tracker" ? t("customerLifecycle.lifecycle", "Lifecycle Tracker") : t("onboarding.title", "Onboarding Roadmap")}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="bg-[var(--status-info)]/10 text-[var(--status-info)] border-[var(--status-info)] text-xs font-semibold">
              {data?.statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("lifecycle.currentStage", "Current Stage")}: <strong className="text-foreground">{data?.currentStage}</strong>
            </span>
          </div>
        </div>

        {/* Tab Selector Switcher */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:w-[320px]">
            <TabsTrigger value="tracker" className="cursor-pointer">{t("lifecycle.tabTracker", "Tracker")}</TabsTrigger>
            <TabsTrigger value="onboarding" className="cursor-pointer">{t("lifecycle.tabOnboarding", "Onboarding Progress")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        {/* TAB 1: Lifecycle Pipeline Tracker */}
        <TabsContent value="tracker" className="space-y-6 mt-0">
          {/* Pipeline Map */}
          {data?.stages && <StagePipeline stages={data.stages} />}

          {/* Milestones + Side Widgets */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Milestones Table utilizing SharedTablePaginated */}
            <div className="lg:col-span-2">
              <SharedTablePaginated
                columns={milestoneColumns}
                data={data?.milestones ?? []}
                title={t("lifecycle.roadmapTitle", "Implementation Milestones")}
                emptyMessage={t("common.noData", "No milestones yet")}
                currentPage={1}
                totalPages={1}
              />
            </div>

            {/* Side Widgets */}
            <div className="space-y-4">
              {/* Engagement Health Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Heart className="h-4 w-4 text-[var(--status-danger)]" />
                    {t("lifecycle.healthTitle", "Engagement Health")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("lifecycle.healthScore", "Health Score")}</span>
                    <span className="text-2xl font-bold text-foreground">
                      {data?.engagementHealth.score}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{data?.engagementHealth.maxScore}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[var(--status-success)] transition-all duration-700"
                      style={{
                        width: `${((data?.engagementHealth.score ?? 0) / (data?.engagementHealth.maxScore ?? 10)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-[var(--status-success)]" />
                      {t("lifecycle.velocity", "Onboarding Velocity")}
                    </span>
                    <span className="font-semibold text-[var(--status-success)]">
                      {data?.engagementHealth.onboardingVelocity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Ticket className="h-3 w-3 text-[var(--status-warning)]" />
                      {t("lifecycle.tickets", "Support Tickets")}
                    </span>
                    <span className="font-semibold text-foreground">
                      {data?.engagementHealth.supportTickets}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Account Specialist — emphasized navy panel per design */}
              <Card className="bg-sidebar text-sidebar-foreground border-sidebar-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
                    <UserCircle className="h-4 w-4 text-primary" />
                    {t("lifecycle.specialist", "Account Specialist")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {data?.accountSpecialist.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sidebar-foreground">
                        {data?.accountSpecialist.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/70">
                        {data?.accountSpecialist.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Time / Go-Live / Risk Widgets */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--status-info)]/10">
                  <Timer className="h-4 w-4 text-[var(--status-info)]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("lifecycle.timeInStage", "Time in Stage")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {data?.timeInStage.days} {t("common.days", "days")}
                  </p>
                  <p className="text-[10px] text-[var(--status-success)]">
                    {data?.timeInStage.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--status-success)]/10">
                  <Rocket className="h-4 w-4 text-[var(--status-success)]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("lifecycle.projectedGoLive", "Projected Go-Live")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {data?.projectedGoLive.date}
                  </p>
                  <p className="text-[10px] text-[var(--status-success)]">
                    {data?.projectedGoLive.status}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--status-success)]/10">
                  <Shield className="h-4 w-4 text-[var(--status-success)]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("lifecycle.riskAssessment", "Risk Assessment")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {data?.riskAssessment.level}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {data?.riskAssessment.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Onboarding Roadmap Checklist (Phase 9) */}
        <TabsContent value="onboarding" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Radial Progress Card */}
            <Card className="flex flex-col items-center justify-center text-center p-8">
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" strokeWidth="10" className="stroke-muted" />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${overallPercentage * 5.02} 502`}
                    className="stroke-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-4xl text-primary">{overallPercentage}%</span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">
                    {t("onboarding.completion", "Completion")}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{t("onboarding.progressTitle", "Steady Progress")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-4">
                {t("onboarding.progressDesc", "Customer is currently validating operational AI services and syncing camera streams.")}
              </p>
            </Card>

            {/* Right Column: Status Cards Summary */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="bg-[var(--status-success)]/10 text-[var(--status-success)] border-0 text-xs font-semibold">
                      {t("onboarding.activeNow", "Active now")}
                    </Badge>
                  </div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {t("onboarding.completedSteps", "Completed Steps")}
                  </h4>
                  <p className="text-3xl font-bold text-foreground">0{completedStepsCount}</p>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-[var(--status-success)]" style={{ width: `${overallPercentage}%` }} />
                </div>
              </Card>

              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--chart-1)]/10 flex items-center justify-center text-[var(--chart-1)]">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {t("onboarding.remainingSteps", "Remaining Steps")}
                  </h4>
                  <p className="text-3xl font-bold text-foreground">0{onboardingSteps.length - completedStepsCount}</p>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-[var(--chart-1)]" style={{ width: `${100 - overallPercentage}%` }} />
                </div>
              </Card>
            </div>
          </div>

          {/* Checklist Roadmap */}
          <Card className="p-8">
            <div className="mb-8">
              <h3 className="font-bold text-lg text-foreground mb-1">{t("onboarding.roadmapTitle", "Onboarding Roadmap")}</h3>
              <p className="text-xs text-muted-foreground">{t("onboarding.roadmapDesc", "Standardized workflow for Tier-1 activations")}</p>
            </div>

            {/* High Density Timeline Checklist */}
            <div className="relative">
              {/* Desktop Horizontal Line */}
              <div className="absolute top-6 start-12 end-12 h-[2px] bg-muted hidden lg:block" />
              <div className="absolute top-6 start-12 h-[2px] bg-primary hidden lg:block" style={{ width: "70%" }} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-6 relative">
                {onboardingSteps.map((step) => {
                  const isCompleted = step.status === "completed";
                  const isCurrent = step.status === "current";
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center group">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center z-10 mb-3 shadow-sm transition-transform group-hover:scale-105",
                          isCompleted && "bg-primary text-primary-foreground",
                          isCurrent && "bg-secondary-container text-on-secondary-container ring-4 ring-[var(--chart-1)] dark:ring-[var(--chart-1)]/40",
                          !isCompleted && !isCurrent && "bg-muted text-muted-foreground/60 border border-border"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <StepIcon className={cn("h-5 w-5", isCurrent && "animate-pulse")} />
                        )}
                      </div>
                      <span className={cn("text-[10px] font-bold uppercase", isCurrent ? "text-secondary" : "text-muted-foreground")}>
                        {t("onboarding.step", "Step")} {step.step}
                      </span>
                      <h5 className="font-semibold text-xs mt-1 text-foreground">{step.label}</h5>
                      {step.date && <span className="text-[9px] text-[var(--status-success)] font-bold mt-1">{step.date}</span>}
                      {isCurrent && <span className="text-[9px] text-[var(--chart-1)] font-bold mt-1 uppercase tracking-wide">{t("common.inProgress", "In Progress")}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Onboarding Checklist Details Footer Cards */}
            <div className="mt-12 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-muted/20">
                <div className="w-10 h-10 rounded-lg bg-[var(--status-success)]/10 flex items-center justify-center text-[var(--status-success)] shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h6 className="font-bold text-sm text-foreground">{t("onboarding.paymentVerified", "Payment Verified")}</h6>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("onboarding.paymentVerifiedDesc", "Annual Enterprise subscription confirmed.")}</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-muted/20">
                <div className="w-10 h-10 rounded-lg bg-[var(--status-success)]/10 flex items-center justify-center text-[var(--status-success)] shrink-0">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h6 className="font-bold text-sm text-foreground">{t("onboarding.cameraHandshake", "Camera Handshake")}</h6>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("onboarding.cameraHandshakeDesc", "All streams reporting healthy connections.")}</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-muted/20">
                <div className="w-10 h-10 rounded-lg bg-[var(--chart-1)]/10 flex items-center justify-center text-[var(--chart-1)] shrink-0">
                  <Layers className="h-5 w-5 animate-spin-slow" />
                </div>
                <div>
                  <h6 className="font-bold text-sm text-foreground">{t("onboarding.aiSyncing", "AI Syncing")}</h6>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("onboarding.aiSyncingDesc", "Uploading specialized detection modules to edge nodes.")}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
