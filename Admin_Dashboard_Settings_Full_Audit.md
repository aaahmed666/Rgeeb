# Full Audit Report — Admin Dashboard & Settings Modules
> Generated from live source code analysis · June 2026

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Admin Dashboard Audit](#2-admin-dashboard-audit)
3. [Settings Module Audit](#3-settings-module-audit)
4. [Master Data / Management Screens Audit](#4-master-data--management-screens-audit)
5. [Permissions Audit](#5-permissions-audit)
6. [Shared Component Compliance](#6-shared-component-compliance)
7. [Translation Compliance](#7-translation-compliance)
8. [Final Consolidated Issue Registry](#8-final-consolidated-issue-registry)
9. [Production Risk Ranking](#9-production-risk-ranking)

---

## 1. Executive Summary

| Category | Issues | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low |
|---|---|---|---|---|---|
| Access Control / Security | 4 | 3 | 1 | — | — |
| Dashboard Stats & Calculations | 3 | 1 | 1 | 1 | — |
| Form Validation | 3 | 1 | 2 | — | — |
| Missing Refresh Buttons | 3 | — | 3 | — | — |
| Missing Export (8 views) | 8 | — | — | 8 | — |
| Translation / i18n | 24+ | — | 6 | 18+ | — |
| Empty Import Lint Errors | 2 | — | 2 | — | — |
| Missing Search / Filter | 2 | — | 1 | 1 | — |
| Error State Missing | 1 | — | 1 | — | — |
| Stats Semantic Bug | 1 | — | — | 1 | — |
| **Total** | **51+** | **5** | **17** | **28+** | — |

---

## 2. Admin Dashboard Audit

### 2.1 KPI / Stats Cards

#### ISSUE-D01 — Dashboard stats count paginated arrays, not real totals
**Severity: 🔴 CRITICAL**
**File:** `src/services/adminService.ts:48–74`

`fetchAdminDashboardStats()` fires 7 parallel `GET` list calls and counts `unwrapArray(r.value).length`. If the backend paginates (typically 20 items/page), every KPI card shows a maximum of 20 regardless of real data size.

```ts
// CURRENT (broken):
const count = (r: PromiseSettledResult<unknown>) =>
  r.status === "fulfilled" ? unwrapArray(r.value).length : 0;
```

**Fix:** Try dedicated `/admin/dashboard-stats` first; in the array fallback, prefer `meta.total`:

```ts
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  // 1. Try dedicated stats endpoint (fast, accurate)
  try {
    const raw = await api.get<unknown>("/admin/dashboard-stats");
    const obj = unwrap(raw);
    if (obj.clients !== undefined) {
      return {
        clients:              num(obj, "clients",               "total_clients") ?? 0,
        categories:           num(obj, "categories")            ?? 0,
        services:             num(obj, "services")              ?? 0,
        packages:             num(obj, "packages")              ?? 0,
        aiModels:             num(obj, "ai_models", "aiModels") ?? 0,
        subscriptions:        num(obj, "subscriptions")         ?? 0,
        activeSubscriptions:  num(obj, "active_subscriptions",  "activeSubscriptions") ?? 0,
      };
    }
  } catch { /* fall through to list fallback */ }

  // 2. Parallel list queries — use meta.total when available
  const results = await Promise.allSettled([
    api.get<unknown>(endpoints.admin.users),        // should be /admin/clients
    api.get<unknown>(endpoints.admin.categories),
    api.get<unknown>(endpoints.admin.services),
    api.get<unknown>(endpoints.admin.packages),
    api.get<unknown>(endpoints.admin.aiModels),
    api.get<unknown>(endpoints.admin.subscriptions),
    api.get<unknown>(endpoints.admin.subscriptionsActive),
  ]);

  const count = (r: PromiseSettledResult<unknown>) => {
    if (r.status !== "fulfilled") return 0;
    const raw = r.value as Record<string, unknown>;
    const meta = raw?.meta as Record<string, unknown> | undefined;
    return num(meta ?? {}, "total") ?? unwrapArray(r.value).length;
  };

  return {
    clients:             count(results[0]),
    categories:          count(results[1]),
    services:            count(results[2]),
    packages:            count(results[3]),
    aiModels:            count(results[4]),
    subscriptions:       count(results[5]),
    activeSubscriptions: count(results[6]),
  };
}
```

---

#### ISSUE-D02 — "Clients" stat actually fetches admin users — semantically wrong
**Severity: 🟡 MEDIUM**
**File:** `src/services/adminService.ts:57`, `src/views/admin/AdminDashboardView.tsx:22`

`STAT_KEYS[0]` has `key: "clients"` and `labelKey: "admin.statClients"`, but `fetchAdminDashboardStats()` calls `endpoints.admin.users` (`/admin/users`) for `results[0]`. Admin users ≠ clients. The dashboard KPI card labelled "Clients" is counting platform admin accounts.

**Fix:** Either change `results[0]` to call a dedicated clients endpoint, or rename the stat to "Users":
```ts
// Option A — fix the endpoint (if /admin/clients exists):
api.get<unknown>(endpoints.admin.clients),  // was endpoints.admin.users

// Option B — rename the stat key and label:
{ key: "users", labelKey: "admin.statUsers", icon: Users, … }
```

---

#### ISSUE-D03 — Dashboard has no error state for failed stats fetch
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminDashboardView.tsx:85–107`

When `stats.isError` is `true`, the view silently renders all KPI cards showing `0`. There is no `stats.isError` check, no error message, and no retry button.

**Fix:** Add error handling after the loading check:
```tsx
{stats.isLoading
  ? Array.from({ length: STAT_KEYS.length }).map((_, i) => (
      <Skeleton key={i} className="h-24 rounded-xl" />
    ))
  : stats.isError
    ? (
      <div className="col-span-full flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          {t("admin.common.loadingFailed")}
        </p>
        <Button variant="outline" size="sm" onClick={() => stats.refetch()}>
          <RefreshCw className="me-2 h-4 w-4" />
          {t("common.retry", "Retry")}
        </Button>
      </div>
    )
  : STAT_KEYS.map(…)}
```

---

### 2.2 Refresh Functionality

#### ISSUE-D04 — AdminDashboardView has no Refresh button
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminDashboardView.tsx`

The dashboard uses `AdminPageHeader`-equivalent markup but does **not** use `AdminPageHeader` at all — it has a custom `<header>` with only a title. There is no refresh trigger. With `staleTime: 60_000`, data can be 1 full minute stale.

**Fix:** Replace the custom header with `AdminPageHeader`, or add a `RefreshCw` button manually:
```tsx
// Add to the header's flex container:
import { RefreshCw } from "lucide-react";
<Button
  variant="outline"
  size="sm"
  onClick={() => stats.refetch()}
  disabled={stats.isFetching}
>
  <RefreshCw className={`me-2 h-4 w-4 ${stats.isFetching ? "animate-spin" : ""}`} />
  {t("common.refresh")}
</Button>
```

---

### 2.3 Navigation Grid

The navigation grid in `AdminDashboardView` is well-structured. All 9 admin sections are linked correctly with i18n keys. No issues found.

---

### 2.4 Empty / Loading States

| State | Behaviour | Verdict |
|---|---|---|
| Loading (stats) | Skeleton cards shown | ✅ |
| Error (stats) | Silent zeros, no error UI | ❌ See ISSUE-D03 |
| Loading (nav grid) | Static, always rendered | ✅ Acceptable |
| Access Denied | Correct ShieldAlert gate | ✅ |

---

## 3. Settings Module Audit

### 3.1 AdminSettingsView (`src/views/admin/AdminSettingsView.tsx`)

#### ISSUE-S01 — No isAdmin access guard — any authenticated user can edit platform settings
**Severity: 🔴 CRITICAL**
**File:** `src/views/admin/AdminSettingsView.tsx:59`

`useAuth()` fetches `isAdmin` on line 59 but it is **never used** to guard the view. Any logged-in non-admin who navigates directly to `/dashboard/admin/settings` can load, read, and save all platform settings including app name, contact email, support phone, privacy policy, terms of service, and notification configuration.

Additionally, line 14 contains a completely empty import: `import {  } from "lucide-react"` which will cause lint/build warnings.

**Fix:**
```tsx
// Add immediately after useQueryClient() on ~line 61:
if (!isAdmin) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.noAccess")}</p>
      </div>
    </div>
  );
}

// Also fix line 14 — remove the empty import entirely:
// REMOVE: import {  } from "lucide-react";
// ADD ShieldAlert to the existing lucide-react import on line 6
```

---

#### ISSUE-S02 — saveGeneral() has zero form validation
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminSettingsView.tsx:99–105`

`saveGeneral()` sends `contact_email` and `support_phone` directly to the API without any validation. An empty `app_name`, a malformed email (`not-an-email`), or a blank phone number will reach the backend.

**Fix:**
```tsx
const saveGeneral = () => {
  if (!v("app_name").trim()) {
    toast.error(t("admin.settings.appNameRequired", "App name is required"));
    return;
  }
  if (v("contact_email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("contact_email"))) {
    toast.error(t("admin.settings.invalidEmail", "Invalid email format"));
    return;
  }
  // Also validate notification_email if it's being saved in saveNotifications():
  mut.mutate([
    { key: "app_name",        value: v("app_name") },
    { key: "app_description", value: v("app_description") },
    { key: "contact_email",   value: v("contact_email") },
    { key: "support_phone",   value: v("support_phone") },
  ]);
};
```

---

#### ISSUE-S03 — All input/textarea placeholders are hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/admin/AdminSettingsView.tsx:158, 166, 194, 202, 210, 231`

| Line | Hardcoded String |
|---|---|
| 158 | `placeholder="My App"` |
| 166 | `placeholder="Short description of the application"` |
| 194 | `placeholder="Privacy policy content…"` |
| 202 | `placeholder="Terms of service content…"` |
| 210 | `placeholder="Cookie policy content…"` |
| 231 | `placeholder="Email signature HTML or text…"` |

**Fix — add to en.json and ar.json:**
```json
// en.json additions under "admin":
"settings_placeholder_appName": "My App",
"settings_placeholder_appDesc": "Short description of the application",
"settings_placeholder_privacy": "Privacy policy content…",
"settings_placeholder_terms": "Terms of service content…",
"settings_placeholder_cookies": "Cookie policy content…",
"settings_placeholder_emailSig": "Email signature HTML or text…"
```

**Usage:**
```tsx
placeholder={t("admin.settings_placeholder_appName", "My App")}
placeholder={t("admin.settings_placeholder_appDesc", "Short description of the application")}
// etc.
```

---

#### ISSUE-S04 — Notification email validation missing in saveNotifications()
**Severity: 🟡 MEDIUM**
**File:** `src/views/admin/AdminSettingsView.tsx:107–112`

`saveNotifications()` sends `notification_email` without validating the email format.

**Fix:** Apply the same email regex check as ISSUE-S02's fix:
```tsx
const saveNotifications = () => {
  if (v("notification_email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("notification_email"))) {
    toast.error(t("admin.settings.invalidEmail", "Invalid email format"));
    return;
  }
  mut.mutate([
    { key: "notification_email", value: v("notification_email") },
    { key: "email_signature",    value: v("email_signature") },
  ]);
};
```

---

### 3.2 PermissionsView (`src/views/preferences/PermissionsView.tsx`)

#### ISSUE-S05 — PermissionsView has zero permission check — full registry exposed to all users
**Severity: 🔴 CRITICAL**
**File:** `src/views/preferences/PermissionsView.tsx`

The entire view renders with no `usePermission()` call and no `isAdmin` check. Any authenticated user who navigates to `/dashboard/preferences/permissions` sees the complete permission registry, all role assignments, and the full role×permission matrix.

**Fix:**
```tsx
// Add near the top of PermissionsView():
import { usePermission } from "@/hooks/usePermission";

export default function PermissionsView() {
  const { t } = useTranslation();
  const can = usePermission("roles");   // reuse the "roles" resource guard

  // Access denied gate — add BEFORE any data-fetching hooks
  if (!can.read) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        </div>
      </div>
    );
  }
  // … rest of component
```

---

### 3.3 SecurityView (`src/views/preferences/SecurityView.tsx`)

All CRUD operations are gated via `can.update` from `usePermission("security")`. Refresh is handled by TanStack Query's natural refetch. **No blocking issues found.**

Minor: The view does not use `AdminPageHeader`; it has a custom inline header which is visually inconsistent with other settings pages but not a functional bug.

---

### 3.4 NotificationSettingsView (`src/views/preferences/NotificationSettingsView.tsx`)

All save operations are gated via `can.update`. Loading and error states are handled. **No blocking issues found.**

Minor: The `testEmail` input has a hardcoded placeholder fallback but uses `t("notifSettings.sendTest", "Send Test Email")` correctly. **Acceptable.**

---

### 3.5 RolesView (`src/views/preferences/RolesView.tsx`)

View is guarded by `usePermission("roles")`. Create/Update/Delete are gated by `can.create`, `can.update`, `can.delete`. Dependency validation before save is implemented. **No blocking issues found.**

---

### 3.6 Chat Settings (`src/app/dashboard/chat-settings/`)

This route exists in the Next.js app directory but no `ChatSettingsView` exists under `src/views/`. It only has `error.tsx`, `loading.tsx`, and `page.tsx` stubs. **Missing view implementation — audit deferred until view exists.**

---

## 4. Master Data / Management Screens Audit

### 4.1 AdminUsersView (`src/views/admin/AdminUsersView.tsx`)

#### ISSUE-M01 — All form Labels are hardcoded English
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminUsersView.tsx:138–189`

| Line | Hardcoded Label |
|---|---|
| 138 | `<Label>Name (EN) *</Label>` |
| 143 | `<Label>Name (AR)</Label>` |
| 149 | `<Label>Email *</Label>` |
| 154 | `<Label>Phone</Label>` |
| 159 | `<Label>{isEdit ? "New Password (leave blank to keep)" : "Password *"}</Label>` |
| 166 | `<Label>Active</Label>` |
| 171 | `<Label>Main Admin</Label>` |

Translation keys already exist in `en.json` under `admin.users` (e.g., `admin.users.email`, `admin.users.phone`, `admin.users.mainAdmin`, etc.).

**Fix:**
```tsx
<Label>{t("admin.users.englishName", "Name (EN)")} *</Label>
<Label>{t("admin.users.arabicName", "Name (AR)")}</Label>
<Label>{t("admin.users.email", "Email")} *</Label>
<Label>{t("admin.users.phone", "Phone")}</Label>
<Label>
  {isEdit
    ? t("admin.users.newPassword", "New Password (leave blank to keep)")
    : `${t("admin.users.password", "Password")} *`}
</Label>
<Label>{t("common.active", "Active")}</Label>
<Label>{t("admin.users.mainAdmin", "Main Admin")}</Label>
```

---

#### ISSUE-M02 — Delete confirmation description is hardcoded English
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminUsersView.tsx:382`

```tsx
// CURRENT:
description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}

// FIX:
description={t(
  "admin.common.confirmDeleteDesc",
  `Are you sure you want to delete "{{name}}"? This cannot be undone.`,
  { name: deleteTarget?.name }
)}
```

---

#### ISSUE-M03 — errorMessage in DataTable is hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/admin/AdminUsersView.tsx:302`

```tsx
// CURRENT:
errorMessage={error instanceof Error ? error.message : "Failed to load users"}

// FIX:
errorMessage={error instanceof Error ? error.message : t("errors.loadFailed")}
```

---

#### ISSUE-M04 — No Refresh button in AdminUsersView hero
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminUsersView.tsx:265–290`

The hero section only has an "Add User" button. There is no way to manually trigger a refetch without a full page reload.

**Fix:** The view uses `AdminPageHeader`-less hero. Add a `RefreshCw` ghost button:
```tsx
// In the hero's flex div alongside the Add User button:
import { RefreshCw } from "lucide-react";
<Button
  variant="ghost"
  size="icon"
  onClick={() => qc.invalidateQueries({ queryKey: ["admin", "users"] })}
  disabled={isLoading}
  className="shrink-0 border-0 bg-white/20 text-white backdrop-blur hover:bg-white/30"
>
  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
</Button>
```

---

### 4.2 AdminPackagesView (`src/views/admin/AdminPackagesView.tsx`)

#### ISSUE-M05 — 6 form Labels are hardcoded English
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminPackagesView.tsx:187–263`

| Line | Hardcoded Label | Available Translation Key |
|---|---|---|
| ~200 | `Description (AR)` | Add `admin.packages.descAr` |
| ~205 | `Description (EN)` | Add `admin.packages.descEn` |
| ~213 | `Price *` | `admin.packages.price` ✅ |
| ~219 | `Duration (months) *` | `admin.packages.duration` ✅ |
| ~226 | `Max Cameras` | `admin.packages.maxCameras` ✅ |
| ~232 | `Max Branches` | `admin.packages.maxBranches` ✅ |
| ~238 | `Category` | `admin.packages.category` ✅ |
| ~244 | `Services` | `admin.packages.services` ✅ |

**Fix — Description labels (keys already exist as sub-keys in some locales but not as `descAr`/`descEn`):**
```json
// en.json — add to admin.packages:
"descAr": "Description (AR)",
"descEn": "Description (EN)"

// ar.json — add to admin.packages:
"descAr": "الوصف بالعربية",
"descEn": "الوصف بالإنجليزية"
```

```tsx
<Label>{t("admin.packages.descAr", "Description (AR)")}</Label>
<Label>{t("admin.packages.descEn", "Description (EN)")}</Label>
<Label>{t("admin.packages.price", "Price")} *</Label>
<Label>{t("admin.packages.duration", "Duration (months)")} *</Label>
<Label>{t("admin.packages.maxCameras", "Max Cameras")}</Label>
<Label>{t("admin.packages.maxBranches", "Max Branches")}</Label>
<Label>{t("admin.packages.category", "Category")}</Label>
<Label>{t("admin.packages.services", "Services")}</Label>
```

---

#### ISSUE-M06 — "Loading services…" is hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/admin/AdminPackagesView.tsx` (services checkbox list)

```tsx
// CURRENT:
<div className="p-2 text-sm text-muted-foreground">Loading services…</div>

// FIX:
<div className="p-2 text-sm text-muted-foreground">{t("common.loading")}</div>
```

---

### 4.3 AdminSubscriptionsView (`src/views/admin/AdminSubscriptionsView.tsx`)

#### ISSUE-M07 — Empty React import (lint error)
**Severity: 🟠 HIGH**
**File:** `src/views/admin/AdminSubscriptionsView.tsx:3`

```tsx
import {  } from "react";
```
This empty destructure import is a lint error in strict mode (React 19 does not require this import at all).

**Fix:** Remove line 3 entirely.

---

#### ISSUE-M08 — No search, no date filter, no status filter
**Severity: 🟡 MEDIUM**
**File:** `src/views/admin/AdminSubscriptionsView.tsx`

Both `DataTable` instances have no `searchValue`, no `onSearchChange`, no date range picker, and no status dropdown. With high subscription volume the tables become unnavigable.

**Fix:** Add debounced search + optional status filter:
```tsx
// Add state:
const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } =
  useDebounceSearch("", 300);
const [statusFilter, setStatusFilter] = useState<string>("all");

// Add client-side filter over allQ.data / activeQ.data:
const filteredAll = useMemo(() => {
  const q = debouncedSearch.trim().toLowerCase();
  return (allQ.data ?? []).filter((s) => {
    const textMatch = !q || [s.userName, s.userEmail, s.package]
      .filter(Boolean).join(" ").toLowerCase().includes(q);
    const statusMatch = statusFilter === "all" || s.status === statusFilter;
    return textMatch && statusMatch;
  });
}, [allQ.data, debouncedSearch, statusFilter]);

// Pass to DataTable:
<DataTable
  data={filteredAll}
  searchValue={search}
  onSearchChange={handleSearchChange}
  searchPlaceholder={t("admin.subscriptions.searchPlaceholder", "Search subscriptions…")}
  …
/>
```

---

### 4.4 AdminCategoriesView / AdminServicesView

Minor hardcoded placeholder strings found but `t()` fallbacks are provided inline. Functional translation paths exist. **Low impact.**

| File | Line | Hardcoded |
|---|---|---|
| AdminCategoriesView.tsx | ~164 | `placeholder="English name"` |
| AdminCategoriesView.tsx | ~172 | `placeholder="Optional description"` |
| AdminServicesView.tsx | ~130 | `placeholder="Service name in English"` |
| AdminServicesView.tsx | ~147 | `placeholder="Service description"` |

---

### 4.5 AdminClientsView (`src/views/admin/AdminClientsView.tsx`)

- ✅ `isAdmin` guard present
- ❌ No `usePermission()` for create/edit/delete gating — action buttons always render for any `isAdmin` user regardless of granular permissions
- Minor: `placeholder="John Doe"` on English name field is hardcoded

---

### 4.6 AdminCountriesView / AdminCitiesView

Both use `AsyncPaginatedSelect` correctly for foreign-key lookups. Permissions are properly gated. Minor hardcoded placeholders:

| File | Line | Hardcoded |
|---|---|---|
| AdminCountriesView.tsx | ~218 | `placeholder="United Arab Emirates"` |
| AdminCitiesView.tsx | ~242 | `placeholder="Dubai"` |

---

### 4.7 BranchesView (`src/views/organization/BranchesView.tsx`)

#### ISSUE-M09 — errorMessage is hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/organization/BranchesView.tsx:140`

```tsx
// CURRENT:
errorMessage={error instanceof Error ? error.message : "Failed to load"}

// FIX:
errorMessage={error instanceof Error ? error.message : t("errors.loadFailed")}
```

#### ISSUE-M10 — 5 form placeholders are hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/organization/BranchesView.tsx:409, 417, 426, 468, 478`

```tsx
placeholder="Enter branch name"       // line 409
placeholder="Enter phone number"      // line 417
placeholder="Enter branch address"    // line 426
placeholder="Enter municipality permit number"  // line 468
placeholder="Enter type of activity"  // line 478
```

**Fix — add keys and use t():**
```json
// en.json additions under "branches":
"placeholder_name": "Enter branch name",
"placeholder_phone": "Enter phone number",
"placeholder_address": "Enter branch address",
"placeholder_permit": "Enter municipality permit number",
"placeholder_activity": "Enter type of activity"
```

---

### 4.8 EmployeesView (`src/views/organization/EmployeesView.tsx`)

#### ISSUE-M11 — errorMessage is hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/organization/EmployeesView.tsx:237`

```tsx
// CURRENT:
errorMessage={error instanceof Error ? error.message : "Failed to load"}

// FIX:
errorMessage={error instanceof Error ? error.message : t("errors.loadFailed")}
```

#### ISSUE-M12 — 3 form placeholders are hardcoded English
**Severity: 🟡 MEDIUM**
**File:** `src/views/organization/EmployeesView.tsx:674, 683, 692`

```tsx
placeholder="Enter name in English"   // line 674
placeholder="05XXXXXXXX"              // line 683
placeholder="employee@example.com"   // line 692
```

---

### 4.9 Missing Export Across All Admin List Views

#### ISSUE-M13 — No CSV/Excel export in any admin list view
**Severity: 🟡 MEDIUM (8 affected views)**

`DataTable` exports `ExportCSVButton` and `ExportExcelButton` helpers and has an `exportActions` slot. None of the 8 admin views pass `exportActions`.

**Affected files:**
- `AdminUsersView.tsx`
- `AdminClientsView.tsx`
- `AdminCategoriesView.tsx`
- `AdminServicesView.tsx`
- `AdminPackagesView.tsx`
- `AdminAiModelsView.tsx`
- `AdminCountriesView.tsx`
- `AdminCitiesView.tsx`

**Fix pattern (same for all):**
```tsx
import { ExportCSVButton } from "@/components/ui/data-table";

// Utility:
function exportToCSV(rows: AdminUser[], filename: string) {
  const headers = ["Name (EN)", "Name (AR)", "Email", "Phone", "Status"];
  const csvRows = rows.map((u) => [
    u.nameEn ?? u.name, u.nameAr ?? "", u.email ?? "", u.phone ?? "",
    u.active !== false ? "Active" : "Inactive",
  ]);
  const content = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// In DataTable:
<DataTable
  …
  exportActions={
    <ExportCSVButton onClick={() => exportToCSV(filtered, "admin-users.csv")} />
  }
/>
```

---

## 5. Permissions Audit

### 5.1 Full Permissions Matrix

| View | View Guard | Create Guard | Edit Guard | Delete Guard |
|---|---|---|---|---|
| AdminDashboardView | ✅ `isAdmin` | N/A | N/A | N/A |
| AdminUsersView | ✅ `isAdmin` | ✅ `can.create` | ✅ `can.update` | ✅ `can.delete` |
| AdminClientsView | ✅ `isAdmin` | ❌ Missing `can.create` | ❌ Missing `can.update` | ❌ Missing `can.delete` |
| AdminCategoriesView | ✅ `isAdmin` | ✅ `can.create` | ✅ `can.update` | ✅ `can.delete` |
| AdminServicesView | ✅ `isAdmin` | ✅ `can.create` | ✅ `can.update` | ✅ `can.delete` |
| AdminPackagesView | ✅ `isAdmin` | ✅ `can.create` | ✅ `can.update` | ✅ `can.delete` |
| AdminAiModelsView | ✅ `isAdmin` | ✅ `can.create` | ✅ `can.update` | ✅ `can.delete` |
| AdminSettingsView | ❌ **MISSING** | ❌ **MISSING** | ❌ **MISSING** | N/A |
| AdminSubscriptionsView | ✅ `isAdmin` | N/A | N/A | N/A |
| AdminCountriesView | ✅ `isAdmin` | ✅ | ✅ | ✅ |
| AdminCitiesView | ✅ `isAdmin` | ✅ | ✅ | ✅ |
| BranchesView | ✅ `usePermission` | ✅ | ✅ | ✅ |
| DepartmentsView | ✅ `usePermission` | ✅ | ✅ | ✅ |
| EmployeesView | ✅ `usePermission` | ✅ | ✅ | ✅ |
| RolesView | ✅ `usePermission("roles")` | ✅ | ✅ | ✅ |
| PermissionsView | ❌ **MISSING** | N/A | N/A | N/A |
| SecurityView | ✅ `usePermission("security")` | N/A | ✅ | N/A |
| NotificationSettingsView | ✅ `usePermission` | N/A | ✅ | N/A |

### 5.2 Buttons Visible Without Permissions

**AdminClientsView** — Add Client, Edit, Delete buttons are unconditionally rendered for any `isAdmin` user. There is no `usePermission("clients")` check.

**Fix for AdminClientsView:**
```tsx
const can = usePermission("clients");
// Gate all action buttons with can.create / can.update / can.delete
```

---

## 6. Shared Component Compliance

### 6.1 AsyncPaginatedSelect Usage

| View | Field | Component Used | Verdict |
|---|---|---|---|
| AdminPackagesView.tsx | Category | `AsyncPaginatedSelect` | ✅ Correct |
| AdminCitiesView.tsx | Country | `AsyncPaginatedSelect` | ✅ Correct |
| DepartmentsView.tsx | Branch / Parent dept | `AsyncPaginatedSelect` | ✅ Correct |
| EmployeesView.tsx | Dept / Branch / Role | `AsyncPaginatedSelect` | ✅ Correct |
| AdminPackagesView.tsx (services) | Services multi-select | Custom checkbox list | ⚠️ Acceptable — pagination not needed for small lists |

### 6.2 DataTable Usage

All views use `DataTable` from `@/components/ui/data-table`. No legacy `<table>` markup found in admin/settings views. ✅ Compliant.

### 6.3 Date Range Pickers

No date range pickers (`SharedRangePicker`) are used anywhere in the audited admin/settings views. Subscription dates are display-only. **No violations, but see ISSUE-M08 — subscriptions should have date filtering added.**

---

## 7. Translation Compliance

### 7.1 Missing i18n Keys (Must Be Added)

#### en.json additions required

```json
// Under "admin.users":
"nameEn": "Name (EN)",
"nameAr": "Name (AR)",
"newPassword": "New Password (leave blank to keep)"

// Under "admin.packages":
"descAr": "Description (AR)",
"descEn": "Description (EN)"

// Under "admin.settings":
"appNameRequired": "App name is required",
"invalidEmail": "Invalid email format",
"placeholder_appName": "My App",
"placeholder_appDesc": "Short description of the application",
"placeholder_privacy": "Privacy policy content…",
"placeholder_terms": "Terms of service content…",
"placeholder_cookies": "Cookie policy content…",
"placeholder_emailSig": "Email signature HTML or text…"

// Under "branches":
"placeholder_name": "Enter branch name",
"placeholder_phone": "Enter phone number",
"placeholder_address": "Enter branch address",
"placeholder_permit": "Enter municipality permit number",
"placeholder_activity": "Enter type of activity"

// Under "employees":
"placeholder_nameEn": "Enter name in English",
"placeholder_phone": "05XXXXXXXX",
"placeholder_email": "employee@example.com"

// Under "admin.common":
"confirmDeleteDesc": "Are you sure you want to delete \"{{name}}\"? This cannot be undone."
```

#### ar.json additions required (mirror of above in Arabic)

```json
// Under "admin.users":
"nameEn": "الاسم بالإنجليزية",
"nameAr": "الاسم بالعربية",
"newPassword": "كلمة مرور جديدة (اتركه فارغاً للإبقاء على الحالي)"

// Under "admin.packages":
"descAr": "الوصف بالعربية",
"descEn": "الوصف بالإنجليزية"

// Under "admin.settings":
"appNameRequired": "اسم التطبيق مطلوب",
"invalidEmail": "صيغة البريد الإلكتروني غير صحيحة",
"placeholder_appName": "تطبيقي",
"placeholder_appDesc": "وصف مختصر للتطبيق",
"placeholder_privacy": "محتوى سياسة الخصوصية…",
"placeholder_terms": "محتوى شروط الخدمة…",
"placeholder_cookies": "محتوى سياسة ملفات تعريف الارتباط…",
"placeholder_emailSig": "توقيع البريد (HTML أو نص)…"

// Under "admin.common":
"confirmDeleteDesc": "هل أنت متأكد من حذف \"{{name}}\"؟ لا يمكن التراجع عن هذا الإجراء."
```

### 7.2 Hardcoded String Summary

| File | Count | Examples |
|---|---|---|
| AdminUsersView.tsx | 7 | Labels in UserDialog |
| AdminPackagesView.tsx | 8 | Labels in PackageDialog |
| AdminSettingsView.tsx | 6 | All placeholder texts |
| BranchesView.tsx | 6 | 5 placeholders + 1 error |
| EmployeesView.tsx | 4 | 3 placeholders + 1 error |
| AdminCategoriesView.tsx | 2 | English name + description placeholders |
| AdminServicesView.tsx | 2 | English name + description placeholders |
| AdminClientsView.tsx | 1 | `placeholder="John Doe"` |
| AdminSubscriptionsView.tsx | 0 | ✅ Clean |
| **Total** | **36+** | |

---

## 8. Final Consolidated Issue Registry

### 🔴 Critical (5 issues)

| ID | Issue | File | Severity |
|---|---|---|---|
| S01 | AdminSettingsView accessible by non-admins | AdminSettingsView.tsx:59 | 🔴 CRITICAL |
| S05 | PermissionsView accessible by all users | PermissionsView.tsx | 🔴 CRITICAL |
| D01 | Dashboard stats show paginated counts not totals | adminService.ts:48–74 | 🔴 CRITICAL |
| — | AdminSettingsView empty `import {}` from lucide-react | AdminSettingsView.tsx:14 | 🔴 Build Risk |
| — | AdminSubscriptionsView empty `import {}` from react | AdminSubscriptionsView.tsx:3 | 🔴 Build Risk |

### 🟠 High (13 issues)

| ID | Issue | File |
|---|---|---|
| D03 | Dashboard stats has no error state / retry | AdminDashboardView.tsx |
| D04 | Dashboard has no Refresh button | AdminDashboardView.tsx |
| S02 | saveGeneral() zero form validation | AdminSettingsView.tsx:99 |
| S04 | saveNotifications() email not validated | AdminSettingsView.tsx:107 |
| M01 | 7 hardcoded Labels in UserDialog | AdminUsersView.tsx:138 |
| M02 | Delete confirmation hardcoded English | AdminUsersView.tsx:382 |
| M03 | errorMessage hardcoded | AdminUsersView.tsx:302 |
| M04 | No Refresh in AdminUsersView hero | AdminUsersView.tsx |
| M05 | 8 hardcoded Labels in PackageDialog | AdminPackagesView.tsx |
| M07 | Empty React import (lint error) | AdminSubscriptionsView.tsx:3 |
| M08 | No search/filter in subscriptions | AdminSubscriptionsView.tsx |
| — | AdminClientsView missing usePermission for CRUD | AdminClientsView.tsx |
| — | AdminDashboardView stats call /admin/users not /admin/clients | adminService.ts:57 |

### 🟡 Medium (20+ issues)

| ID | Issue | File |
|---|---|---|
| D02 | Clients stat semantically wrong (counts admin users) | adminService.ts |
| S03 | 6 hardcoded placeholders in AdminSettingsView | AdminSettingsView.tsx |
| M06 | "Loading services…" hardcoded | AdminPackagesView.tsx |
| M09 | errorMessage hardcoded in BranchesView | BranchesView.tsx:140 |
| M10 | 5 hardcoded placeholders in BranchesView | BranchesView.tsx |
| M11 | errorMessage hardcoded in EmployeesView | EmployeesView.tsx:237 |
| M12 | 3 hardcoded placeholders in EmployeesView | EmployeesView.tsx |
| M13 | No export in 8 admin list views | All admin list views |
| — | AdminCategoriesView 2 hardcoded placeholders | AdminCategoriesView.tsx |
| — | AdminServicesView 2 hardcoded placeholders | AdminServicesView.tsx |
| — | AdminClientsView `placeholder="John Doe"` hardcoded | AdminClientsView.tsx |
| — | AdminCountriesView hardcoded EN name placeholder | AdminCountriesView.tsx |
| — | AdminCitiesView hardcoded city name placeholder | AdminCitiesView.tsx |
| — | 15+ missing translation keys (see section 7.1) | en.json / ar.json |

---

## 9. Production Risk Ranking

### TOP 5 — Fix Before Next Release

| Rank | Issue | Impact |
|---|---|---|
| 1 | **ISSUE-S01** — Any auth'd user can read/write all platform settings | Data integrity, brand risk |
| 2 | **ISSUE-S05** — Any auth'd user can read full permission/role registry | Security disclosure |
| 3 | **ISSUE-D01** — KPI cards always show ≤20 (pagination cap) | Misleading business data |
| 4 | **Empty imports** (AdminSettingsView line 14, AdminSubscriptionsView line 3) | Build/lint failures |
| 5 | **ISSUE-S02** — Invalid emails and blank app names accepted | API error exposure, bad UX |

### Quick Wins (1–2 lines each)

- `errorMessage={t("errors.loadFailed")}` — replace all 4 hardcoded instances
- Remove `import {  } from "react"` and `import {  } from "lucide-react"`
- Add `if (!isAdmin) return <AccessDenied />` to AdminSettingsView
- Add `const can = usePermission("roles"); if (!can.read) return <AccessDenied />` to PermissionsView

---

*End of report. Total audited files: 18 views + 2 services + 1 component + 2 i18n files.*
