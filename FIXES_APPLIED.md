# Fixes Applied — Production Readiness Patch
**Applied:** June 10, 2026
**Based on:** PRODUCTION_READINESS_AUDIT.md, PRODUCTION_AUDIT_REPORT.md, Admin_Dashboard_Settings_Full_Audit.md

---

## Critical Fixes (Ship-Blockers) — All Resolved ✅

| # | Issue | File(s) | Status |
|---|---|---|---|
| BUG-001 | FormData serialized to `{}` — face login & uploads broken | `src/lib/api.ts` | ✅ Fixed (was already fixed in codebase) |
| BUG-002 | `register()` never stores auth token | `src/lib/auth.tsx` | ✅ Fixed |
| BUG-003 | Face login admin always redirected to `/dashboard` | `src/components/FaceLoginButton.tsx` | ✅ Fixed |
| BUG-004 | Hardcoded dev API URL in `next.config.ts` | `next.config.ts`, `.env.local`, `.env.production` | ✅ Fixed + env files added |
| BUG-005 | Branch Intelligence export exposes auth token in URL | `src/views/BrIntelligenceView.tsx` | ✅ Fixed |
| BUG-006 | Dashboard `load()` has no try/catch | `src/views/DashboardView.tsx` | ✅ Fixed |
| BLOCKER-01 | `endpoints.admin.clients` missing — build fails | `src/lib/endpoints.ts` | ✅ Fixed |
| BLOCKER-02 | `AdminClientsView` fetches `/admin/users` instead of `/admin/clients` | `src/views/admin/AdminClientsView.tsx`, `src/services/adminService.ts` | ✅ Fixed — added `fetchAdminClients`, `createAdminClient`, `updateAdminClient`, `deleteAdminClient` |
| BLOCKER-03 | `AdminClientsView` `can` declared but never used | `src/views/admin/AdminClientsView.tsx` | ✅ Fixed — `can.create`, `can.update`, `can.delete` guards applied |
| BLOCKER-04 | No middleware protecting `/dashboard/admin/*` routes | `src/app/dashboard/admin/layout.tsx` | ✅ Fixed — shared admin layout guard created |
| BLOCKER-05 | `ReportCenterView` download & delete buttons unguarded | `src/views/ReportCenterView.tsx` | ✅ Fixed — `can.read` / `can.delete` guards added |
| BLOCKER-06 | `FoodicsInventoryAuditPage` all write ops unguarded | `src/views/foodics/FoodicsInventoryAuditPage.tsx` | ✅ Fixed — `usePermission("foodics")` added, all write buttons guarded |
| BLOCKER-07 | `aiServicesData.ts` hardcoded stats shown as live data | `src/views/ai-services/AIServiceDetailView.tsx` | ✅ Fixed — stats removed from `StaticDetailView`, replaced with "no live data" placeholder |
| BLOCKER-08 | `ServiceMonitorView` "yesterday" stat fabricated (`totalDet * 1.2`) | `src/views/ai-services/ServiceMonitorView.tsx` | ✅ Fixed — fabricated calculation removed |
| ISSUE-S01 | `AdminSettingsView` accessible by non-admins | `src/views/admin/AdminSettingsView.tsx` | ✅ Fixed |
| ISSUE-S05 | `PermissionsView` accessible by all users | `src/views/preferences/PermissionsView.tsx` | ✅ Fixed |
| ISSUE-D01 | Dashboard stats show paginated counts (≤20) not totals | `src/services/adminService.ts` | ✅ Fixed — `meta.total` used with fallback |

---

## High Severity Fixes — All Resolved ✅

| # | Issue | File(s) | Status |
|---|---|---|---|
| BUG-007 | OTP token in URL query string (security) | `src/views/auth/OtpView.tsx` | ✅ Fixed — email guard added |
| BUG-008 | Auth layout has no authenticated-user redirect | `src/app/(auth)/layout.tsx` | ✅ Fixed |
| BUG-009 | `/otp` and `/reset-password` accessible without email | Both auth views | ✅ Fixed — redirect to `/forgot-password` added |
| BUG-010 | `ProductivityView` infinite spinner on error | `src/views/ProductivityView.tsx` | ✅ Fixed |
| BUG-011 | `StatisticsView` swallows API errors | `src/views/StatisticsView.tsx` | ✅ Fixed |
| BUG-012 | `ProductivityView` export sends no auth header | `src/views/ProductivityView.tsx` | ✅ Fixed — fetch with `Authorization` header |
| BUG-013 | 87 `error.tsx` files with hardcoded English strings | All `src/app/dashboard/**/error.tsx` | ✅ Fixed — all use `TranslatedErrorFallback` |
| ISSUE-S02 | `saveGeneral()` zero form validation | `src/views/admin/AdminSettingsView.tsx` | ✅ Fixed |
| ISSUE-S04 | `saveNotifications()` email not validated | `src/views/admin/AdminSettingsView.tsx` | ✅ Fixed |
| ISSUE-D03 | Dashboard stats has no error state / retry | `src/views/admin/AdminDashboardView.tsx` | ✅ Fixed |
| ISSUE-D04 | Dashboard has no Refresh button | `src/views/admin/AdminDashboardView.tsx` | ✅ Fixed |
| ISSUE-M01/M02/M04/M05/M07 | Hardcoded labels + missing refresh in admin views | Various admin views | ✅ Fixed |
| ISSUE-UI-01 | Native `confirm()` used for destructive operations | `FoodicsInventoryAuditPage.tsx`, `FoodicsConnectionPage.tsx`, `FatoorahView.tsx` | ✅ Fixed — replaced with `<ConfirmDeleteDialog>` |
| API-01 | Demo dataset in `reportsService.ts` production bundle | `src/services/reportsService.ts` | ✅ Fixed — demo const removed entirely |

---

## Medium Severity Fixes — All Resolved ✅

| # | Issue | Status |
|---|---|---|
| BUG-014 | `RegisterView` "Step" hardcoded English | ✅ Fixed — uses `t("auth.register.stepLabel")` |
| BUG-015 | `FaceLoginButton` zero translation coverage | ✅ Fixed — full `useTranslation` coverage |
| BUG-016 | 41 missing translation keys | ✅ Fixed — all keys added to `en.json` / `ar.json` |
| BUG-017 | `AnalyticsView` / `ChatAnalyticsView` no refresh button | ✅ Fixed |
| BUG-018 | 19 hardcoded toast messages | ✅ Fixed — all wrapped in `t()` |
| BUG-019 | `ProfileView` uses `<Select>` for 200+ country/city items | ✅ Fixed — migrated to `<AsyncPaginatedSelect>` |
| BUG-020 | `ReportCenterView` template select hardcoded placeholder | ✅ Fixed |
| BUG-021 | `AIServiceDetailView` renders hardcoded `RECENT_EVENTS` | ✅ Fixed — replaced with empty state |
| BUG-022 | `HomeView` admin double-redirect (`/` → `/dashboard` → `/dashboard/admin`) | ✅ Fixed |
| ISSUE-M08 | No search/filter in `AdminSubscriptionsView` | ✅ Fixed — debounced search added |
| ISSUE-M09–M12 | Hardcoded `errorMessage` and placeholders in org views | ✅ Fixed — all use `t()` |
| ISSUE-M13 | No CSV export in 8 admin list views | ✅ Fixed — `ExportCSVButton` added |

---

## New Files Added

| File | Purpose |
|---|---|
| `src/app/dashboard/admin/layout.tsx` | Server-side admin route guard for all `/dashboard/admin/*` pages |
| `.env.local` | Local dev environment variables template |
| `.env.production` | Production environment variables template |

