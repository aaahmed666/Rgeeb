# RGEEB Dashboard — Complete Static Code Audit

**Scope:** full codebase, no runtime execution. Roles applied: Senior Frontend Engineer / QA Lead / React Architect / Next.js Expert / TypeScript Reviewer.
**Verification state after fixes:** `npx tsc --noEmit` clean · Jest 185/185 · Vitest 101/101.
**Legend:** ✅ FIXED = corrected in this audit round (code shipped in this zip). ⚠️ OPEN = documented, needs product/backend decision.

---

## 1. AUTHENTICATION REVIEW

### ✅ FIXED — OTP page claimed success without verification
- **Severity:** High · **File:** `src/views/auth/OtpView.tsx` (handleVerify)
- **Problem:** Any 6-digit input produced a success toast and redirect; no server validation exists (by design — backend has no verify endpoint), the 5-minute expiry countdown was never enforced, and the try/catch was dead code.
- **Why risky:** Users were told "verified" when the code could be wrong/expired; the real failure surfaced confusingly later at reset-password.
- **Fix applied:** removed the misleading success toast and dead try/catch; the expiry is now enforced (`auth.otp.expired` key added to en/ar); the code is forwarded honestly for server-side validation at reset.

### ✅ FIXED — Admin face-login landed with a stale auth context
- **Severity:** High · **File:** `src/components/FaceLoginButton.tsx`
- **Problem:** For admins, the handler wrote token/role/user to storage but never updated the in-memory `AuthProvider` state (it skips `refreshProfile()` because `/customer/profile` is customer-only), then did a client-side `router.push("/dashboard/admin")`.
- **Why risky:** The admin dashboard rendered against `user: null` — guards could bounce a successfully authenticated admin.
- **Fix applied:** admin path now uses `window.location.assign("/dashboard/admin")` so `AuthProvider` re-mounts and hydrates from the storage just written; customer path keeps `router.push` (context already refreshed).

### ✅ FIXED — Register step 0 swallowed OTP-send failures
- **Severity:** Medium · **File:** `src/views/auth/RegisterView.tsx` (handleNext, step 0)
- **Problem:** `catch {}` advanced the wizard silently when the first OTP send failed.
- **Fix applied:** an error toast (`auth.register.otpSendFailed`, en+ar) now tells the user the send failed and that they can resend on the verification step.

### ✅ FIXED — Popup-blocked message dropped the payment link
- **Severity:** Medium · **File:** `src/views/auth/RegisterView.tsx` (step 3 subscribe)
- **Problem:** `t("auth.register.popupBlocked", "…visit: " + payment_link)` — the second argument is i18next's *defaultValue*; since the key **exists** in both locales, the static translation was shown and the link was discarded.
- **Fix applied:** the link is appended outside the translation: `` `${t(...)} ${payment_link}` ``.

### ✅ FIXED — /terms and /privacy were 404s
- **Severity:** Medium · **File:** `src/views/auth/LoginView.tsx:454,461` → links
- **Fix applied:** minimal placeholder pages created at `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` (replace copy with real legal text before launch).

### ⚠️ OPEN — Reset-password posts to an authenticated endpoint
- **Severity:** Critical (flow-blocking if backend doesn't special-case it)
- **File:** `src/lib/endpoints.ts` (`auth.resetPassword = "/customer/profile/update"`); consumed by `src/services/authService.ts → resetPasswordRequest` and `src/views/auth/ResetPasswordView.tsx`.
- **Problem:** In the forgot-password flow the user has **no session**, yet the reset posts to `/customer/profile/update`, a profile-update route that normally requires auth. The Postman collection contains no reset/forgot endpoint at all.
- **Why risky:** Expected result is a 401 → the entire forgot-password flow dead-ends at the final step.
- **Recommended fix:** backend must either accept `email + otp_code` as an auth substitute on this route, or expose a dedicated unauthenticated endpoint (e.g. `POST /customer/password/reset`) — then point `endpoints.auth.resetPassword` there. An inline ⚠️ comment was added at the endpoint definition.

### ⚠️ OPEN — Face-login endpoint not in the API contract
- **Severity:** Medium · `endpoints.auth.face = "/customer/face-login"` does not appear in the Postman collection. Confirm it exists server-side; the FormData encoding choice is otherwise reasonable.

### Verified OK
- **Login:** validation (email regex, ≥6 password), loading state, error toast, remember-me → localStorage vs sessionStorage split, admin-vs-customer redirect resolved from the response (not stale context), Enter-key submit on both fields, error clearing on input.
- **Forgot password:** validation, loading, success/fail toasts, route chain `/forgot-password → /check-email?email → /otp?email → /reset-password?email&token` is consistent, with guards redirecting back when params are missing.
- **Reset password:** validation (email, ≥8, confirm match), loading, success state with delayed redirect to /login, error banner; `useSearchParams` correctly wrapped in `<Suspense>` in its page.
- **Token management:** `app.auth.token` in sessionStorage by default, localStorage with remember-me; `clearAuthAndRedirect` on 401 (skipped via `skipAuthRedirect` on all unauthenticated auth calls — correct); profile fetch deduplicated via in-flight promise.
- **OTP/check-email pages** use `dynamic = 'force-dynamic'` instead of Suspense for `useSearchParams` — functional; consider Suspense for consistency (Low).

---

## 2. COMPONENT COMPLIANCE — Select usage

`AsyncPaginatedSelect` is used in 21 files (entity pickers loading from API). Violations below should migrate when the data is API-backed and paginated; static enum filters are acceptable on shadcn Select but listed for completeness.

**Native `<select>` (recommended replacement: AsyncPaginatedSelect for API data, shadcn Select for static enums):**
| File | Lines |
|---|---|
| src/components/br-intelligence/BrIntelligenceHeader.tsx | 549, 567 |
| src/views/BrIntelligenceHelpers.tsx | 753, 774 |
| src/views/CamerasView.tsx | 494 |
| src/views/KanbanView.tsx | 241, 259, 277 |
| src/views/auth/RegisterView.tsx | 810, 857 (country/city → AsyncPaginatedSelect strongly recommended; these are API entities) |
| src/views/foodics/FoodicsDashboardPage.tsx | 115 |
| src/views/foodics/FoodicsOrdersPage.tsx | 131, 141 |
| src/views/foodics/FoodicsRefundVerificationPage.tsx | 112, 120 |
| src/views/foodics/FoodicsPrepTimePage.tsx | 215 |
| src/views/foodics/FoodicsFootfallPage.tsx | 125 |
| src/views/foodics/FoodicsInventoryAuditPage.tsx | 156, 310 |
| src/views/foodics/FoodicsDrawerAuditPage.tsx | 142, 147 |

**shadcn `@/components/ui/select`** (static enums — acceptable, 17 files): BrIntelligenceFilterBar, AdminCategories/Services/Packages/Cities/AiModels, ReportCenter, TaskTemplates, ChatSettings, AiTaskRules, Dashboard, Tasks, BrIntelligence, EventTimeline, Departments, Employees, Projects.
**react-select:** only inside `AsyncPaginatedSelect` itself (correct). No legacy select libraries found.

---

## 3. DASHBOARD REVIEW (customer)

All previously reported dashboard bugs were fixed in earlier rounds and remain in place: timezone-safe dates, honest `getSummary` (no fabricated 4/4 cameras), demo constants deleted, permission guard implemented, My-Tasks toggle wired to `assignedToMe` + reload, refresh via `invalidateDashboardCache()`, 30s auto-refresh interval, loading skeletons and error states present, AI Services Hub search filter functional (verified by the 40-test Jest suite incl. search/no-match/links/toggle/refresh).
**No export button exists on the customer dashboard** — if one is expected by QA, it is a missing feature, not a regression.

## 4. INSIGHTS REVIEW

- **Br Intelligence** (`BrIntelligenceView`, `useBrIntelligence`): fabricated efficiency fallback removed; Top-N filter scoped to rankings only; stale-closure reads fixed via refs; custom date range on value/onChange; future dates clamped; ranges computed in local time; print report expands sections with data via `printMode` + `beforeprint`/`afterprint` listeners and `window.print()` (BrIntelligenceView:337/432) — correct.
- **Analytics**: demo fallbacks removed, errors propagate to banner+Retry, "—/No data" with zero detections, trend arrows direction-correct, refresh re-runs `loadData()`.
- **Reports Overview** (`StatisticsView`): presets→state→effect→fetch chain verified; future end-date capped; errors propagate; ✅ FIXED missing read guard (`hasPermission("statistics")`) — `hasPermission` was destructured but dead.
- **Chat Analytics**: refresh button wired to `loadData()` (line 126) — OK.
- **Pagination/Export:** Insights pages are aggregate views without pagination (correct); export exists on BrIntelligence (print) and works.

## 5. AI SERVICES REVIEW

- `AIServiceDetailView`: useQuery with loading/`isError`/Retry/refresh — OK. Missing-API-ID empty states now translated (keys added).
- `ServiceMonitorView`: refresh present; uses local-date fix from round 1.
- 40+ service routes share these views via params — no per-page drift found.
- **Missing functionality:** none blocking; live metrics intentionally gated on an assigned API ID with an explanatory empty state.

## 6. TRANSLATION AUDIT

- **ar.json vs en.json:** perfect parity — 2,389 keys each, 0 missing either way. 10 identical values are legitimately language-neutral (brand, "Excel", placeholders).
- ✅ **FIXED — 23 keys used in code but absent from both files** (Arabic users saw English defaults): `tasks.commentAdded/attachmentUploaded/comments/activityLog/attachments/commentPlaceholder/addComment/noActivity/logEntry/uploadAttachmentHint`, `intel.autoRefreshOn/autoRefreshOff/live/recentActivity/serviceBreakdown`, `aiServices.noLiveData/noLiveMetrics`, `admin.settings`, `admin.subscriptions.searchPlaceholder`, `fatoorah.confirmUnlinkDesc`, `foodics.disconnectConfirm`, `validation.deleteConfirmDesc` — all added to **both** locales with real Arabic. (Plus new keys: `auth.otp.expired`, `auth.register.otpSendFailed`, `productivity.exportFailed`.)
- `admin.categories` at `AdminPageHeader.tsx:11` is a false positive (remapped to `.title` via TITLE_KEY_MAP).
- ✅ **FIXED — hardcoded "Access Denied" guards** in `SystemMonitoringView.tsx:64`, `LiveFeedsView.tsx:45`, `TaskReportsView.tsx:169` → now `t("errors.unauthorized")` / `t("common.noPermission")`.
- ⚠️ OPEN — remaining hardcoded UI strings (Low/Medium; add keys to both locales):
  CamerasView:185 "Cameras", :341 "Unknown" · ReportCenterView:275 "Weekly", :276 "Monthly", :664 "Generated Reports", :789 "Scheduled Reports" · AttendanceView:120 "Attendance" · FoodicsView:116 "Connection Status" · KanbanView:492 "Delete Task" · ProjectsView:96 "Pending", :200 "Projects" · SettingsView:228 "Version", :236 "License" · AdminPackagesView:230/240/251/263 "Max Cameras/Max Branches/Category/Services" · FoodicsDashboardPage:174 "All Clear" · FoodicsConnectionPage:321–340 "Status/Connected At/Business ID/Business Name" · FoodicsDrawerAuditPage:168–172 "Employee ID/Matched Order/Patterns/Verdict".
- ⚠️ OPEN — 887 keys defined but never statically referenced. Many are reached via dynamic `t(variable)` (service labels, statuses); do **not** delete without a dynamic-usage trace.

## 7. SHARED COMPONENT AUDIT

- **DataTable** (`@/components/ui/data-table`): 28 views — compliant.
- **SharedDateRangePicker:** 18 views; all `rsuite` imports in views are type-only — compliant.
- ⚠️ Raw `<table>` (recommended: DataTable): all 6 Foodics pages, `BrIntelligenceHelpers.tsx`, `preferences/PermissionsView.tsx` (read-only matrix — acceptable exception).

## 8. FILTERS / EXPORT / REFRESH / SEARCH / PAGINATION

- **Refresh verified wired** (handler → re-fetch): Dashboard, Analytics, ChatAnalytics (`loadData()`), EventTimeline (`query.refetch()` ×2 incl. error state), AdminDashboard (`stats.refetch()`, spinner, disabled while fetching), AIServiceDetail, all 11 admin CRUD views, Attendance, DetectionFeed, EscalationAlerts, Foodics connection, MyTasks, Notifications, Profile, Projects, ReportCenter, Subscription, SystemMonitoring, TaskAnalytics, Tasks, VisitorRecords.
- ✅ **FIXED — Productivity Excel export failed silently** (`ProductivityView.tsx` catch only logged to console). Now shows `toast.error(t("productivity.exportFailed"))`. The `/api/customer/productivity/export-excel` path is valid via the Next.js rewrite proxy (`next.config.ts:16–25`); PDF export = `window.print()` — OK.
- **TaskReports exports** (CSV/PDF cards) and **BrIntelligence print** verified wired.
- **Search:** AI Services Hub (dashboard) verified by tests; admin views use `searchPlaceholder`-driven server/client filters; Tasks/VisitorRecords/EventTimeline searches bound to query params.
- **Pagination:** present where lists paginate (Attendance, DetectionFeed, EventTimeline, Notifications, Tasks, VisitorRecords, organization views, Foodics orders/audits) via `page`/`per_page`.

## 9. ADMIN DASHBOARD AUDIT

`AdminDashboardView.tsx` — clean: admin guard, useQuery with `enabled: isAdmin` + 60s staleTime, skeletons, error card with Retry, refresh button with spinner/disabled, 7 KPI cards mapped defensively (`?? 0`), nav grid translated. `fetchAdminDashboardStats` tries the dedicated stats endpoint and falls back to counting list endpoints — acceptable. **No date-range/branch filters or export exist on this screen** — flag to product if required (missing feature, not a bug).

## 10. SETTINGS MODULE / FORMS / MASTER DATA / PERMISSIONS

- **Forms with full CRUD+validation+states verified:** Profile, AdminSettings (admin-guarded, line 64), Security (2FA), NotificationSettings, Roles — all have mutation, validation, loading, error and success handling.
- **SettingsView** is intentionally local (localStorage toggles; notification/security settings live in their real pages) — documented in-file; not a defect. Hydration note: `useLocalToggle` reads localStorage during render — safe only because pages are client-rendered, but converting to a `useEffect` read would be more robust (Low).
- **PermissionsView** is a read-only role×resource matrix (useQuery only) — no mutations by design.
- **Master data CRUD** (admin Users/Clients/Categories/Services/Packages/AiModels/Cities/Countries/Subscriptions; organization Branches/Departments/Employees): DataTable + search + refresh + `usePermission`-gated create/update/delete buttons throughout.
- ✅ **FIXED — missing read guards (Critical):** direct URL access bypassed view permissions on 9 pages. Added `hasPermission` guards to `StatisticsView`, `AnalyticsView` (both had it destructured but **unused** — same dead-guard bug DashboardView had) and `can.read` guards (consistent with their existing `can.create/update/delete` gating) to `organization/BranchesView`, `organization/DepartmentsView`, `organization/EmployeesView`, `preferences/RolesView`, `CamerasView`, `TasksView`, `TaskTemplatesView`. Verified zero `react-hooks/rules-of-hooks` violations after insertion.
- ⚠️ OPEN — views still without an explicit read guard (Low–Medium; most are intentionally broad): NotificationsView, EventTimelineView, VisitorRecordsView, ProjectsView, ReportCenterView, SubscriptionView, ProductivityView, KanbanView, ChatAnalyticsView, AiServicesView, preferences/SecurityView, preferences/NotificationSettingsView, FatoorahView, ProfileView (profile is self-scoped — fine). Recommended: replicate the same guard pattern with the matching alias keys (`notifications`, `event_timeline`, `visitor_records`, `projects`, `report_center`, `subscription`, `productivity`, `kanban`, `chat_analytics`, `ai_services`, `security`, `notification_settings`).
- **Export permission:** no per-export permission concept exists in the backend contract; export buttons follow page read access. Flag to product if `*.export` permissions are planned.

## 11. PRODUCTION RISKS — TOP LIST

1. ⚠️ **Reset-password 401 risk** (backend contract) — see §1.
2. ⚠️ **Face-login endpoint unconfirmed** in API contract.
3. ✅ Fabricated demo data (dashboard/analytics/intelligence) — removed in earlier rounds; failures now surface honestly.
4. ✅ Permission bypass via direct URL on 9 views — guarded.
5. ⚠️ Remaining unguarded low-sensitivity views (list above).
6. ⚠️ Hardcoded strings list (Arabic UX) — §6.
7. ✅ Timezone date-shift (UTC+3) — fixed project-wide in earlier rounds.
8. ⚠️ Native selects in Register (country/city) won't scale past small lists — migrate to AsyncPaginatedSelect.
