"use client";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Joyride, STATUS, EVENTS, ACTIONS } from "react-joyride";
import type { Step as JoyrideStep } from "react-joyride";
import {
  Compass,
  Building2,
  Users,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

/* ─── Storage keys ─────────────────────────────────────── */
const TOUR_DONE_KEY = "app.tour.v2.done";
const TOUR_STATUS_KEY = "app.tour.v2.status";

/* ─── Custom event fired so views can open their drawer ── */
export const TOUR_OPEN_DRAWER_EVENT = "tour:open-drawer";

/* ─── Step metadata ─────────────────────────────────────── */
interface StepMeta {
  titleKey: string;
  bodyKey: string;
  icon?: React.ElementType;
  path?: string;
  /** If true, the tour fires TOUR_OPEN_DRAWER_EVENT when this step is shown */
  opensDrawer?: boolean;
}

const STEP_META: StepMeta[] = [
  /* 0 — Welcome */
  { titleKey: "tour.s1Title", bodyKey: "tour.s1Body", icon: Sparkles },
  /* 1 — Branches page */
  {
    titleKey: "tour.branchPageTitle",
    bodyKey: "tour.branchPageBody",
    icon: Building2,
    path: "/dashboard/organization/branches",
  },
  /* 2 — Create branch (opens drawer automatically) */
  {
    titleKey: "tour.branchCreateTitle",
    bodyKey: "tour.branchCreateBody",
    icon: Building2,
    path: "/dashboard/organization/branches",
    opensDrawer: true,
  },
  /* 3 — Employees page */
  {
    titleKey: "tour.employeePageTitle",
    bodyKey: "tour.employeePageBody",
    icon: Users,
    path: "/dashboard/organization/employees",
  },
  /* 4 — Create employee (opens drawer automatically) */
  {
    titleKey: "tour.employeeCreateTitle",
    bodyKey: "tour.employeeCreateBody",
    icon: Users,
    path: "/dashboard/organization/employees",
    opensDrawer: true,
  },
  /* 5 — Departments page */
  {
    titleKey: "tour.deptPageTitle",
    bodyKey: "tour.deptPageBody",
    icon: LayoutGrid,
    path: "/dashboard/organization/departments",
  },
  /* 6 — Create department (opens drawer automatically) */
  {
    titleKey: "tour.deptCreateTitle",
    bodyKey: "tour.deptCreateBody",
    icon: LayoutGrid,
    path: "/dashboard/organization/departments",
    opensDrawer: true,
  },
];

const JOYRIDE_TARGETS: string[] = [
  "body",
  "[data-tour='sidebar']",
  "[data-tour='add-branch']",
  "[data-tour='sidebar']",
  "[data-tour='add-employee']",
  "[data-tour='sidebar']",
  "[data-tour='add-department']",
];

function buildSteps(): JoyrideStep[] {
  return JOYRIDE_TARGETS.map((target, i) => ({
    target,
    content: "",
    placement: i === 0 ? ("center" as const) : ("auto" as const),
    disableBeacon: true,
    /* No spotlightClicks — the tour opens the drawer itself */
    spotlightClicks: false,
  }));
}

/* ─── Tooltip button prop types from react-joyride v2 ──── */
interface JoyrideButtonProps {
  "aria-label": string;
  "data-action": string;
  onClick: React.MouseEventHandler<HTMLElement>;
  role: string;
  title: string;
}

interface TooltipProps {
  backProps: JoyrideButtonProps;
  closeProps: JoyrideButtonProps;
  primaryProps: JoyrideButtonProps;
  skipProps: JoyrideButtonProps;
  step: JoyrideStep;
  tooltipProps: {
    "aria-modal": boolean;
    role: string;
  };
  index: number;
  isLastStep: boolean;
  size: number;
}

/* ─── Custom Tooltip ─────────────────────────────────────── */
function TourTooltip(
  props: TooltipProps & { user?: { name?: string } | null }
) {
  const {
    index,
    backProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep,
    size,
    user,
  } = props;
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const meta = STEP_META[index];
  const Icon = meta?.icon;

  const title =
    index === 0 && user?.name
      ? t("tour.s1TitleNamed", { name: user.name })
      : t(meta?.titleKey ?? "");
  const body =
    index === 0 && user?.name
      ? t("tour.s1BodyNamed", { name: user.name })
      : t(meta?.bodyKey ?? "");

  return (
    <div
      {...tooltipProps}
      className={cn(
        "w-[min(400px,calc(100vw-2rem))] rounded-2xl border bg-background shadow-2xl overflow-hidden",
        isRtl && "text-right"
      )}
    >
      {/* Progress bar */}
      <div className="relative h-1 bg-muted">
        <div
          className="absolute inset-y-0 start-0 bg-primary transition-all duration-500"
          style={{ width: `${((index + 1) / size) * 100}%` }}
        />
      </div>

      <div className="p-5">
        {/* Header */}
        <div
          className={cn(
            "flex items-start justify-between gap-3 mb-3",
            isRtl && "flex-row-reverse"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              isRtl && "flex-row-reverse"
            )}
          >
            {Icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t("tour.stepOf", { current: index + 1, total: size })}
              </p>
              <h3 className="text-base font-bold leading-tight">{title}</h3>
            </div>
          </div>

          {/* X close button */}
          <button
            {...skipProps}
            title={t("common.close")}
            className="mt-0.5 rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>

        {/* Footer */}
        <div
          className={cn(
            "mt-5 flex items-center justify-between gap-2",
            isRtl && "flex-row-reverse"
          )}
        >
          {/* Step dots */}
          <div
            className={cn(
              "flex items-center gap-1.5",
              isRtl && "flex-row-reverse"
            )}
          >
            {Array.from({ length: size }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === index ? "h-2 w-5 bg-primary" : "h-2 w-2 bg-muted"
                )}
              />
            ))}
          </div>

          <div
            className={cn(
              "flex items-center gap-2",
              isRtl && "flex-row-reverse"
            )}
          >
            {/* Skip button */}
            <button
              {...skipProps}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 text-muted-foreground"
            >
              {t("common.skip")}
            </button>

            {/* Back button */}
            {index > 0 && (
              <button
                {...backProps}
                className="inline-flex items-center justify-center rounded-md border text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                {t("common.back")}
              </button>
            )}

            {/* Next / Done button */}
            <button
              {...primaryProps}
              className="inline-flex items-center gap-1.5 justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-95 transition-opacity"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("common.done")}
                </>
              ) : (
                <>
                  {t("common.next")}
                  <ArrowRight
                    className={cn("h-3.5 w-3.5", isRtl && "rotate-180")}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export function TourGuide() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [run, setRun] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [steps] = React.useState<JoyrideStep[]>(buildSteps);

  /**
   * Guard: tracks whether the auto-open effect has already fired once
   * so it never re-runs after startTour() clears localStorage.
   */
  const autoOpenFiredRef = React.useRef(false);

  /* Auto-open for first-time visitors — runs exactly once per mount */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (autoOpenFiredRef.current) return;
    autoOpenFiredRef.current = true;

    const done = window.localStorage.getItem(TOUR_DONE_KEY);
    if (!done) {
      const id = window.setTimeout(() => setRun(true), 900);
      return () => window.clearTimeout(id);
    }
  }, []);

  /* Fire custom event so the active view can open its drawer */
  const fireOpenDrawer = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_DRAWER_EVENT));
  }, []);

  /* Navigate to the required page before showing a step */
  const navigateForStep = React.useCallback(
    async (idx: number) => {
      const path = STEP_META[idx]?.path;
      if (path && pathname !== path) {
        router.push(path);
        /* Wait for navigation + page paint */
        await new Promise((r) => setTimeout(r, 600));
      }
    },
    [pathname, router]
  );

  /* Joyride onEvent handler (react-joyride v3) */
  const handleCallback = React.useCallback(
    async (data: {
      action: string;
      index: number;
      status: string;
      type: string;
    }) => {
      const { action, index, status, type } = data;

      /* ── Tour ended (finished, skipped, or X closed) ── */
      if (
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED ||
        action === ACTIONS.CLOSE
      ) {
        const value = status === STATUS.FINISHED ? "completed" : "cancelled";

        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOUR_DONE_KEY, value);
          window.localStorage.setItem(TOUR_STATUS_KEY, value);
        }

        /* requestAnimationFrame lets Joyride finish its own cleanup
           before we unmount the overlay — prevents lag / zombie overlay */
        requestAnimationFrame(() => {
          setRun(false);
          setStepIndex(0);
        });
        return;
      }

      /* ── Step navigation ── */
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;

        if (nextIndex >= 0 && nextIndex < STEP_META.length) {
          await navigateForStep(nextIndex);

          if (STEP_META[nextIndex]?.opensDrawer) {
            await new Promise((r) => setTimeout(r, 300));
            fireOpenDrawer();
            await new Promise((r) => setTimeout(r, 400));
          }

          setStepIndex(nextIndex);
        }
      }
    },
    [navigateForStep, fireOpenDrawer]
  );

  /* Start / restart tour */
  const startTour = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOUR_DONE_KEY);
      window.localStorage.removeItem(TOUR_STATUS_KEY);
    }
    /* Hard-reset: stop → reset index → restart */
    setRun(false);
    setStepIndex(0);
    requestAnimationFrame(() => {
      setTimeout(() => setRun(true), 100);
    });
  }, []);

  const tourStatus =
    typeof window !== "undefined"
      ? window.localStorage.getItem(TOUR_STATUS_KEY)
      : null;

  return (
    <>
      {/* Always-visible trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={startTour}
        className="gap-2"
        data-tour="tour-trigger"
      >
        <Compass className="h-4 w-4" />
        <span className="hidden sm:inline">
          {tourStatus === "completed"
            ? t("tour.replay", "Replay Tour")
            : t("tour.start", "Take a tour")}
        </span>
      </Button>

      <Joyride
        steps={steps}
        stepIndex={stepIndex}
        run={run}
        tooltipComponent={(props) => (
          <TourTooltip
            {...(props as unknown as TooltipProps)}
            user={user}
          />
        )}
        onEvent={handleCallback}
        continuous
        scrollToFirstStep
        options={{ zIndex: 999999 }}
        styles={{
          overlay: { zIndex: 999997 },
          floater: { zIndex: 999999 },
        }}
      />
    </>
  );
}
