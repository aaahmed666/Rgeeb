"use client";

/**
 * NavigationProgress
 * Shows a thin animated bar at the top of the screen the moment a Link is
 * clicked, giving instant visual feedback before the new page loads.
 *
 * Uses the native Next.js router events (startTransition pattern) via
 * patching history.pushState / replaceState — no extra library needed.
 */

import * as React from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = React.useRef(pathname);

  const start = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(10);
    setVisible(true);

    let current = 10;
    intervalRef.current = setInterval(() => {
      // Slow down as we approach 90%
      const increment = current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 2 : 0.5;
      current = Math.min(current + increment, 90);
      setProgress(current);
    }, 120);
  }, []);

  const finish = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Detect navigation start by intercepting history pushState
  React.useEffect(() => {
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    history.pushState = (...args) => {
      start();
      return originalPush(...args);
    };
    history.replaceState = (...args) => {
      // Don't show for replace (used by auth redirects etc.)
      return originalReplace(...args);
    };

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, [start]);

  // Detect navigation complete by watching pathname change
  React.useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      finish();
    }
  }, [pathname, finish]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "120ms",
          boxShadow: "0 0 8px 1px hsl(var(--primary) / 0.6)",
        }}
      />
    </div>
  );
}
