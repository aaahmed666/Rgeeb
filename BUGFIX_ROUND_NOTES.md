# Front-End Bug Fix Round — Summary

All reported front-end bugs addressed. TypeScript: clean (`npx tsc --noEmit`).
Tests: Jest 185/185 passing (`npx jest`), Vitest 101/101 passing (`npx vitest run`).

## Source fixes

1. **Timezone-safe dates** — `src/lib/utils.ts` gained `toLocalISODate`, `todayLocalISO`,
   `clampToToday`, `clampISODateToToday`. All `toISOString().slice(0,10)` calls in
   StatisticsView (Reports Overview), DashboardView, AnalyticsView, dashboardService,
   intelligenceService, and br-intelligence/utils were replaced — these shifted the
   calendar day for non-UTC users (UTC+3), causing the "wrong day" date-range behavior.
2. **Br Intelligence wrong data** — `useBrIntelligence.ts` no longer fabricates
   Efficiency Index rows from the Top-N rankings payload (which zeroed every metric and
   capped rows at the Top-N), fixing the Efficiency table, the Avg/Outstanding/Critical
   KPIs, and the "Store Rankings filter affects the wrong section" bug. `rankTop` /
   `activeService` are read through refs to avoid stale-closure reloads.
3. **Br Intelligence date range** — custom range now uses the picker's `value/onChange`
   API; previously two string callbacks each checked the other half from stale state, so
   the first selection never activated custom mode.
4. **Shared date range picker** — string mode emits local dates and clamps future
   selections to today (future dates also remain disabled in the calendar).
5. **Reports Overview** — `reportsService.fetchReport` propagates errors instead of
   swallowing them, so the error banner + Retry work; date filters send local dates.
6. **Analytics page** — `analyticsService` demo fallbacks deleted (29,705 detections /
   80.3% / random trends no longer appear when the API fails); errors surface to the
   view's banner. Compliance KPI shows "— / No data" instead of a score when there are
   zero detections; trend arrows point ↘ for negative values.
7. **Dashboard data** — `dashboardService.getSummary` returns honest zeros instead of a
   fabricated 4/4-cameras + fake-branches fallback; all dead `DEMO_*` constants removed
   (Visitor Flow, Live Activity, Attendance, Compliance, Breakdown, Branches).
8. **Hero icon** — the 👋 is anchored inline at the start of the heading so it no longer
   floats when the welcome title wraps (also correct in RTL via `me-3`).
9. **Chatbot API contract** — `chatService` sends `session_id` (was `conversation_id`,
   breaking conversation context) and paginates history with `per_page` (was `limit`);
   responses/history accept the session under either key.
10. **Chatbot widget UI** — panel height is `min(540px, 100dvh - 8rem)` so it never
    overflows short viewports.
11. **Dashboard permission guard** — `hasPermission("dashboard")` is now enforced with
    the same Access Denied screen as the other views (it was destructured but unused).
12. **Task Intelligence "My Tasks"** — now an actual assigned-to-me toggle that reloads
    the task KPIs (`setAssignedToMe` existed but was never wired; the button was a Link).

## Test-infrastructure fixes

- `vitest.config.ts`: `@` alias pointed at the repo root instead of `./src`, so every
  Vitest suite failed to resolve imports; fixed, and `include` narrowed to the six
  Vitest suites.
- `jest.config.cjs`: fixed the invalid `setupFilesAfterFramework` → `setupFilesAfterEnv`;
  ignores the Vitest suites and `__mocks__` helpers so `npx jest` runs green.
- `vitest.setup.ts`: added a `sessionStorage` mock (remember-me stores tokens there).
- `src/lib/error-handling.ts`: implemented to its test spec (code extraction from
  ApiError bodies, pass-through+timestamp for normalized objects, friendly messages for
  known codes, status-based `isRetryableError`, call-time NODE_ENV for dev loggers).
  No production file imported the old stub.
- Rewrote stale suites that still asserted the removed demo-data behavior
  (`reportsService`, `analyticsService`, `dashboardService` tests) and repaired test
  isolation (dashboard cache invalidation between tests, complete `@/lib/api` mock in
  auth tests, restored `window.location` after the redirect test, `vi.stubEnv` instead
  of redefining `process.env`, i18next default-value-aware `t` mock + missing
  `initReactI18next`/`invalidateDashboardCache` mocks in the DashboardView suite).
