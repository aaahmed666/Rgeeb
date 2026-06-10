# FULL PRODUCTION RELIABILITY AUDIT REPORT
**Codebase:** AI SaaS Admin Dashboard (Next.js 15 / React / TypeScript)
**Audited:** src/views, src/services, src/components, src/lib, src/hooks, src/app
**Date:** 2026-06-10

---

## Executive Summary

| Area | Score | Status |
|---|---|---|
| Button Functionality | 72 / 100 | ⚠️ Issues Found |
| API Data Integrity | 70 / 100 | ⚠️ Issues Found |
| Permission Enforcement | 65 / 100 | 🔴 Critical Gaps |
| Route Protection | 60 / 100 | 🔴 Critical Gaps |
| **Overall Production Readiness** | **67 / 100** | 🔴 NOT Production Ready |

**Blockers before production:**
- `AdminClientsView` uses wrong endpoint AND has zero permission enforcement
- `endpoints.admin.clients` missing from source (build fails — confirmed via TS error)
- Download and Delete buttons in `ReportCenterView` have no permission guard
- All Foodics write operations (create/edit/delete zone) have zero permission enforcement
- `aiServicesData.ts` stats are fully hardcoded — shown as live data in the UI
- `reportsService` has full hardcoded demo dataset (never returned, but present as dead code risk)
- `ServiceMonitorView` calculates "yesterday" as `Math.round(totalDet * 1.2)` — fabricated

---

## 1. CRITICAL ISSUES (BLOCKERS)

---

### BLOCKER-01 — Build Failure: `endpoints.admin.clients` missing
**File:** `src/lib/endpoints.ts`
**File:** `src/services/adminService.ts`, line 73
**Severity:** 🔴 CRITICAL — Build fails

`adminService.ts` references `endpoints.admin.clients` which does not exist in the `admin` section of `endpoints.ts`. This causes a TypeScript compile error and a failed production build.

```ts
// adminService.ts:73 — FAILS
api.get<unknown>(endpoints.admin.clients ?? endpoints.admin.users)
// endpoints.ts admin section has no `clients` key
```

**Fix:** Add `clients: "/admin/clients"` inside the `admin` section of `endpoints.ts`.

---

### BLOCKER-02 — `AdminClientsView` fetches wrong endpoint
**File:** `src/views/admin/AdminClientsView.tsx`, line 58
**Severity:** 🔴 CRITICAL — Wrong data displayed

`AdminClientsView` declares it's showing "Clients" but its `useQuery` calls `fetchAdminUsers` which hits `/admin/users`. There is no `fetchAdminClients` function in `adminService.ts`.

```ts
// Line 58 — hits /admin/users, not /admin/clients
const q = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAdminUsers });
```

`create`, `update`, and `delete` mutations also call `createAdminUser`, `updateAdminUser`, `deleteAdminUser` — all targeting the `/admin/users/*` endpoints, not `/admin/clients/*`.

**Fix:** Add `fetchAdminClients`, `createAdminClient`, `updateAdminClient`, `deleteAdminClient` to `adminService.ts` targeting `endpoints.admin.clients`, and update `AdminClientsView` to use them.

---

### BLOCKER-03 — `AdminClientsView`: Permission variable declared but never used
**File:** `src/views/admin/AdminClientsView.tsx`, line 49
**Severity:** 🔴 CRITICAL — All CRUD buttons fully unguarded

```ts
const can = usePermission("clients"); // declared
```

Zero uses of `can.create`, `can.update`, or `can.delete` anywhere in the component. Every action button — Add Client, Edit (dropdown), Delete (dropdown) — is accessible to any authenticated user including non-admins.

Compare to the correct pattern used in `AdminCategoriesView.tsx:402`, `AdminServicesView.tsx:332`, etc.:

```tsx
{can.update && <DropdownMenuItem onClick={() => openEdit(u)}>Edit</DropdownMenuItem>}
{can.delete && <DropdownMenuItem onClick={() => setToDelete(u)}>Delete</DropdownMenuItem>}
```

**Fix:** Gate the Add button with `can.create`, and the edit/delete dropdown items with `can.update` / `can.delete` respectively.

---

### BLOCKER-04 — No middleware protecting `/dashboard/admin/*` routes
**File:** No `middleware.ts` found in project root
**File:** `src/app/dashboard/admin/clients/page.tsx` — just renders `<AdminClientsView />`
**Severity:** 🔴 CRITICAL — Admin routes accessible by URL to any logged-in user

The dashboard layout (`src/app/dashboard/layout.tsx`) only redirects unauthenticated users. It does NOT redirect non-admins away from `/dashboard/admin/*`. Each admin view individually checks `if (!isAdmin) return <AccessDenied />`, but this is UI-only protection — the page shell, JS bundle, and API calls all load before the guard fires.

**Fix:** Add `middleware.ts` at the project root to check `isAdmin` (from the auth token/cookie) server-side for all `/dashboard/admin` routes, or add a shared admin layout wrapper at `src/app/dashboard/admin/layout.tsx` that enforces the guard before rendering children.

---

### BLOCKER-05 — `ReportCenterView`: Download and Delete buttons have no permission guard
**File:** `src/views/ReportCenterView.tsx`, lines 676, 679, 723
**Severity:** 🔴 CRITICAL — Destructive actions accessible without permission check

Generate button correctly checks `can.create` (line 614–615). But:

```tsx
// Line 676 — Download: NO permission check
onClick={() => { downloadMut.mutate(h.id); }}

// Line 679 — Delete Generated Report: NO permission check
onClick={() => deleteGenMut.mutate(h.id)}

// Line 723 — Delete Scheduled Report: NO permission check
onClick={() => deleteSchedMut.mutate(s.id)}
```

**Fix:**
```tsx
// Download — guard with can.read
disabled={!can.read} onClick={() => can.read && downloadMut.mutate(h.id)}

// Delete — guard with can.delete
disabled={!can.delete} onClick={() => can.delete && deleteGenMut.mutate(h.id)}
```

---

### BLOCKER-06 — `FoodicsInventoryAuditPage`: All write operations have zero permission enforcement
**File:** `src/views/foodics/FoodicsInventoryAuditPage.tsx`
**Severity:** 🔴 CRITICAL — Create, Edit, Delete zone buttons unguarded

`FoodicsInventoryAuditPage` has 9 interactive buttons including `handleAddZone` (API: POST create zone), `handleEditZone` (API: PUT update zone), `handleDeleteZone` (API: DELETE zone). Zero `usePermission` calls exist.

```tsx
// Line 76 — create zone, no permission check
await foodicsService.createInventoryZone(...)

// Line 91 — update zone, no permission check  
await foodicsService.updateInventoryZone(id, ...)

// Line 104 — delete zone, no permission check (uses browser confirm() — see ISSUE-UI-01)
await foodicsService.deleteInventoryZone(id)
```

**Fix:** Add `const can = usePermission("foodics")` and gate each write button accordingly.

---

### BLOCKER-07 — `aiServicesData.ts`: Hardcoded stats displayed as live data
**File:** `src/views/ai-services/aiServicesData.ts`, lines 55–63 (and throughout)
**File:** `src/views/ai-services/AIServiceDetailView.tsx`, lines 148–178
**Severity:** 🔴 CRITICAL — Fabricated numbers shown as real metrics

Every AI service entry has a `stats` block with hardcoded values:

```ts
stats: {
  totalDetections: 14832,   // HARDCODED
  todayDetections: 47,      // HARDCODED
  accuracy: 97,             // HARDCODED
  uptime: 99.8,             // HARDCODED
  avgResponseMs: 42,        // HARDCODED
  cameras: 8,               // HARDCODED
}
```

`AIServiceDetailView` renders these directly (`service.stats.totalDetections.toLocaleString()`) on the condition that `service.apiId == null` (the `StaticDetailView` branch). Services WITH an `apiId` correctly route to `ServiceMonitorView` which calls the real API. But all services without `apiId` display fabricated numbers.

**Fix:** Either assign `apiId` to every service and fetch live data, or remove the stats display block entirely from `StaticDetailView` and show a "No live data available" placeholder.

---

### BLOCKER-08 — `ServiceMonitorView`: "Yesterday" stat is fabricated
**File:** `src/views/ai-services/ServiceMonitorView.tsx`, line 226
**Severity:** 🔴 CRITICAL — Displayed metric is mathematically fabricated, not from API

```ts
// Line 226 — fabricated: takes today's total and multiplies by 1.2
sub: `${t("serviceMonitor.yesterday")}: ${Math.round(totalDet * 1.2)}`
```

The API response does not provide a "yesterday" count. Instead the code invents one by multiplying today's total by 1.2 — always making yesterday appear 20% higher. This is false data shown to users.

**Fix:** Either fetch a yesterday figure from the API (add a date-range query), or remove the "yesterday" sub-label entirely.

---

## 2. API DATA INTEGRITY ISSUES

---

### API-01 — `reportsService.ts`: Hardcoded demo dataset exists in production bundle
**File:** `src/services/reportsService.ts`, lines 34–130
**Severity:** ⚠️ HIGH — Dead code with fabricated data in production

A large `const demo` object contains fake customers, suppliers, invoices, and financials (e.g. "Acme Corp", "BoxCo", "$64,820"). `fetchReport()` currently returns `null` on API failure rather than `demo[tab]`, so the demo data is never shown. However it inflates the bundle and is one line change away from leaking fake data.

**Fix:** Remove the `demo` const entirely. On API failure, return `null` (already correct) and let the view show its empty state.

---

### API-02 — `StatisticsView`: Shows blank state when API returns null, no retry button
**File:** `src/views/StatisticsView.tsx`
**Severity:** ⚠️ MEDIUM — Poor error recovery

When `fetchReport()` returns `null` (API 404 or error), the view shows an empty state `"reports.emptyTitle"` with no retry button. Users cannot attempt to reload without refreshing the entire page.

**Fix:** Add a retry button in the empty/error state that re-calls `fetchReport`.

---

### API-03 — `AdminSubscriptionsView`: Read-only, no CRUD, no refresh button
**File:** `src/views/admin/AdminSubscriptionsView.tsx`
**Severity:** ⚠️ LOW — Missing refresh capability

The view fetches subscription data correctly but has zero buttons (confirmed by audit scan). There is no refresh, no export, and no ability to manage subscriptions from the admin panel.

---

## 3. BUTTON AUDIT REPORT

### Fully Functional ✅
The following views have buttons correctly wired to mutations with loading states, error handling, and permission guards:
- `TasksView` — create, edit, delete, status change, pagination, view toggle
- `CamerasView` — check-online, create, edit, delete (all guarded)
- `BranchesView`, `DepartmentsView`, `EmployeesView` — full CRUD guarded
- `AdminCategoriesView`, `AdminServicesView`, `AdminPackagesView`, `AdminAiModelsView` — full CRUD guarded
- `AdminUsersView` — full CRUD guarded
- `AdminCountriesView`, `AdminCitiesView` — full CRUD guarded
- `RolesView` — create, edit, delete guarded
- `NotificationSettingsView` — save, test, verify guarded
- `EscalationAlertsView` — guarded
- `ProjectsView` — guarded
- `KanbanView` — guarded
- `LoginView`, `RegisterView`, `ForgotPasswordView` — submit disabled during loading

### Broken or Unguarded Buttons ❌

| # | File | Line | Button | Issue |
|---|---|---|---|---|
| 1 | `AdminClientsView.tsx` | 101 | Add Client | No `can.create` guard |
| 2 | `AdminClientsView.tsx` | ~155 | Edit (dropdown) | No `can.update` guard |
| 3 | `AdminClientsView.tsx` | ~160 | Delete (dropdown) | No `can.delete` guard |
| 4 | `ReportCenterView.tsx` | 676 | Download Report | No `can.read` guard |
| 5 | `ReportCenterView.tsx` | 679 | Delete Generated | No `can.delete` guard |
| 6 | `ReportCenterView.tsx` | 723 | Delete Scheduled | No `can.delete` guard |
| 7 | `FoodicsInventoryAuditPage.tsx` | 159 | Add Zone | No permission guard |
| 8 | `FoodicsInventoryAuditPage.tsx` | 196 | Edit Zone | No permission guard |
| 9 | `FoodicsInventoryAuditPage.tsx` | 215 | Delete Zone | No permission guard |
| 10 | `FoodicsConnectionPage.tsx` | 85 | Disconnect Foodics | No permission guard, uses `confirm()` |
| 11 | `FatoorahView.tsx` | 146 | Unlink Fatoorah | No permission guard, uses `confirm()` |

---

## 4. PERMISSION ISSUES

### Missing `usePermission` entirely

| View | Buttons | Write Operations | Risk |
|---|---|---|---|
| `AdminClientsView.tsx` | 9 | Create, Update, Delete | 🔴 HIGH — `can` declared but unused |
| `FoodicsInventoryAuditPage.tsx` | 9 | Create zone, Edit zone, Delete zone | 🔴 HIGH |
| `FoodicsConnectionPage.tsx` | 3 | Disconnect integration | 🔴 HIGH |
| `AttendanceView.tsx` | 6 | Check-in, Check-out import | ⚠️ MEDIUM |
| `AiSchedulerView.tsx` | 4 | Apply schedule | ⚠️ MEDIUM |
| `AiTaskRulesView.tsx` | 8 | (has `can` — OK — re-check passed) | ✅ |
| `ChatSettingsView.tsx` | 6 | Save settings, Test webhook | ⚠️ MEDIUM |
| `VisitorRecordsView.tsx` | 7 | Export | ⚠️ LOW |
| `MyTasksView.tsx` | 9 | Start, Complete task | ⚠️ LOW — own-task actions, may be intentional |

### `usePermission` declared but partially unused

| View | Declared For | Unused Actions |
|---|---|---|
| `AdminClientsView.tsx` | `"clients"` | `can.create`, `can.update`, `can.delete` — all 3 unused |

### Sidebar nav items without permission key
**File:** `src/components/AppSidebar.tsx`

The sidebar filters items with `!item.permission || hasPermission(item.permission)`. Items without a `permission` field are always shown. Confirm all sensitive routes (admin panel link, subscription link) have a permission or `isAdmin` guard on their nav item.

---

## 5. UI / UX ISSUES

### ISSUE-UI-01 — Native `confirm()` used for destructive operations
**Files:**
- `src/views/foodics/FoodicsInventoryAuditPage.tsx`, line 102
- `src/views/foodics/FoodicsConnectionPage.tsx`, line 85
- `src/views/FatoorahView.tsx`, line 146

Native `window.confirm()` is non-dismissible on mobile, unstyled, untranslatable, and inconsistent with the rest of the app which uses `<ConfirmDeleteDialog>`.

**Fix:** Replace all three `confirm()` calls with `<ConfirmDeleteDialog>` (already used throughout the rest of the codebase).

---

### ISSUE-UI-02 — `AdminSubscriptionsView` has no refresh or management buttons
**File:** `src/views/admin/AdminSubscriptionsView.tsx`

Read-only view with no refresh button, no export, no detail view. Low severity but incomplete.

---

### ISSUE-UI-03 — `StatisticsView` empty state has no retry
**File:** `src/views/StatisticsView.tsx`, ~line 245

When the API returns null (404 / error), only an empty state message is shown. No retry button. Users must manually re-click "Generate" or reload the page.

---

## 6. COMPLETE FIX PRIORITY LIST

### Must Fix Before Deploy (Blockers)

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | BLOCKER-01 | `src/lib/endpoints.ts` | Add `clients: "/admin/clients"` inside `admin` section |
| 2 | BLOCKER-02 | `src/services/adminService.ts` | Add `fetchAdminClients`, `createAdminClient`, `updateAdminClient`, `deleteAdminClient` |
| 3 | BLOCKER-02 | `src/views/admin/AdminClientsView.tsx` | Replace `fetchAdminUsers` with `fetchAdminClients`; update queryKey to `["admin","clients"]` |
| 4 | BLOCKER-03 | `src/views/admin/AdminClientsView.tsx` | Apply `can.create`, `can.update`, `can.delete` guards to all action buttons |
| 5 | BLOCKER-04 | `src/app/dashboard/admin/layout.tsx` (create) | Add isAdmin server-side guard for all `/dashboard/admin/*` routes |
| 6 | BLOCKER-05 | `src/views/ReportCenterView.tsx` lines 676, 679, 723 | Add `can.read`/`can.delete` guards to download and delete buttons |
| 7 | BLOCKER-06 | `src/views/foodics/FoodicsInventoryAuditPage.tsx` | Add `usePermission("foodics")` and gate all write buttons |
| 8 | BLOCKER-07 | `src/views/ai-services/aiServicesData.ts` + `AIServiceDetailView.tsx` | Remove hardcoded stats from `StaticDetailView`; show placeholder instead |
| 9 | BLOCKER-08 | `src/views/ai-services/ServiceMonitorView.tsx` line 226 | Remove fabricated `Math.round(totalDet * 1.2)` yesterday calc |

### Should Fix (High)

| # | Issue | File | Fix |
|---|---|---|---|
| 10 | API-01 | `src/services/reportsService.ts` | Delete entire `demo` const (lines 34–130) |
| 11 | ISSUE-UI-01 | `FoodicsInventoryAuditPage.tsx`, `FoodicsConnectionPage.tsx`, `FatoorahView.tsx` | Replace `confirm()` with `<ConfirmDeleteDialog>` |
| 12 | PERM | `src/views/AttendanceView.tsx` | Add `usePermission("attendance")` and guard check-in/out |
| 13 | PERM | `src/views/ChatSettingsView.tsx` | Add `usePermission("chat-settings")` and guard save buttons |
| 14 | PERM | `src/views/AiSchedulerView.tsx` | Add `usePermission("ai-scheduler")` and guard apply button |
| 15 | PERM | `src/views/foodics/FoodicsConnectionPage.tsx` | Add `usePermission("foodics")` |

### Nice to Have (Medium/Low)

| # | Issue | Fix |
|---|---|---|
| 16 | API-02 | Add retry button in `StatisticsView` empty state |
| 17 | API-03 | Add refresh button to `AdminSubscriptionsView` |
| 18 | `MyTasksView` | Confirm whether start/complete should be permission-gated or owner-only |

---

## Appendix — Files Audited

```
src/lib/endpoints.ts
src/lib/auth.tsx
src/lib/api.ts
src/hooks/usePermission.ts
src/services/adminService.ts
src/services/reportsService.ts
src/services/foodicsService.ts
src/views/admin/AdminDashboardView.tsx
src/views/admin/AdminClientsView.tsx
src/views/admin/AdminUsersView.tsx
src/views/admin/AdminCategoriesView.tsx
src/views/admin/AdminServicesView.tsx
src/views/admin/AdminPackagesView.tsx
src/views/admin/AdminAiModelsView.tsx
src/views/admin/AdminCountriesView.tsx
src/views/admin/AdminCitiesView.tsx
src/views/admin/AdminSubscriptionsView.tsx
src/views/admin/AdminSettingsView.tsx
src/views/ai-services/aiServicesData.ts
src/views/ai-services/AIServiceDetailView.tsx
src/views/ai-services/ServiceMonitorView.tsx
src/views/ReportCenterView.tsx
src/views/StatisticsView.tsx
src/views/TasksView.tsx
src/views/CamerasView.tsx
src/views/KanbanView.tsx
src/views/SubscriptionView.tsx
src/views/FoodicsView.tsx
src/views/foodics/FoodicsInventoryAuditPage.tsx
src/views/foodics/FoodicsConnectionPage.tsx
src/views/FatoorahView.tsx
src/views/AttendanceView.tsx
src/views/ChatSettingsView.tsx
src/views/AiSchedulerView.tsx
src/views/DetectionFeedView.tsx
src/views/EventTimelineView.tsx
src/views/VisitorRecordsView.tsx
src/views/ProfileView.tsx
src/views/preferences/RolesView.tsx
src/views/preferences/PermissionsView.tsx
src/views/preferences/NotificationSettingsView.tsx
src/views/organization/BranchesView.tsx
src/views/organization/DepartmentsView.tsx
src/views/organization/EmployeesView.tsx
src/views/auth/LoginView.tsx
src/app/dashboard/layout.tsx
src/components/AppSidebar.tsx
src/components/AppSidebarNavItems.ts
```
