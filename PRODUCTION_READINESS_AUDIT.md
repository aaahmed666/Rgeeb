# Production Readiness Audit Report
**Project:** RGEEB AI Security & Analytics Platform
**Audit Type:** Complete Static Code Analysis
**Auditor Role:** Senior Frontend Engineer / QA Lead / React Architect / Next.js Expert / TypeScript Reviewer
**Date:** June 2026

---

## Production Readiness Score: 51 / 100

| Phase | Score | Status |
|---|---|---|
| Authentication | 42/100 | 🔴 Critical bugs |
| Dashboard | 72/100 | 🟡 No error handling |
| Insights | 55/100 | 🟡 Missing states/exports |
| AI Services | 68/100 | 🟡 Mock data in prod |
| Translation | 60/100 | 🟡 41 missing keys |
| Shared Components | 75/100 | 🟡 2 wrong usages |
| Filters/Export/Refresh | 48/100 | 🔴 Auth-less exports |
| Infrastructure | 30/100 | 🔴 Hardcoded dev URLs |

---

## 🔴 CRITICAL BUGS (Ship-Blockers)

---

### BUG-001 — FormData Serialized to `{}` — Face Login & File Uploads Completely Broken

**Severity:** CRITICAL
**File:** `src/lib/api.ts`
**Line:** 336
**Also affects:** `src/services/authService.ts:185`, `src/services/profileService.ts:290`, `src/services/camerasService.ts:175,185`

**Problem:**
`apiFetch()` unconditionally calls `JSON.stringify(body)` on every request body. When a `FormData` object is passed, `JSON.stringify(new FormData())` returns `"{}"` — the multipart payload is completely lost. Additionally, the `Content-Type: application/json` header is always set, which overrides the browser's automatic `multipart/form-data; boundary=...` header that FormData requires.

This silently breaks **four distinct features**:
1. Face login (`faceLoginRequest` sends `fd.append("image", dataUrl)` → `{}` arrives at backend)
2. Profile avatar upload (`updateProfile` builds `FormData` with `avatar_file` → `{}`)
3. Camera create (`createCamera` uses `buildCameraFormData` → `{}`)
4. Camera update (`updateCamera` uses `buildCameraFormData` → `{}`)

**Why it's risky:**
The API call succeeds (2xx) because it's a valid JSON request — it just silently has no data. No error is thrown, no loading state fails. Users see a spinner and then a success toast while nothing actually happened on the backend.

**Root Cause:**
```ts
// src/lib/api.ts line 332–336
headers: {
  ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
},
body: body !== undefined ? JSON.stringify(body) : undefined,
// JSON.stringify(new FormData()) === "{}"
```

**Exact Code Fix:**
```ts
// src/lib/api.ts — replace lines 330–337

const isFormData = body instanceof FormData;
const res = await fetch(buildUrl(path, query), {
  ...rest,
  signal: controller.signal,
  headers: {
    Accept: "application/json",
    // Do NOT set Content-Type for FormData — browser sets multipart boundary automatically
    ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...authHeaders,
    ...headers,
  },
  // Do NOT JSON.stringify FormData
  body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
});
```

---

### BUG-002 — `register()` Never Stores Auth Token After Registration

**Severity:** CRITICAL
**File:** `src/lib/auth.tsx`
**Line:** 261–267

**Problem:**
The `login()` function correctly calls `setAuthToken(token, rememberMe)` after receiving a token (line 236). The `register()` function does **not**. It calls `registerRequest(payload)` which returns `{ token, user, raw }`, but the token is silently discarded. The subsequent `fetchProfileRequest()` call (line 263) is sent without an `Authorization` header, causing a 401 if the backend hasn't also set a cookie. If `rawUser` is null and `fetchProfileRequest` returns null (due to 401), `toAuthUser(null, email)` creates a minimal user with only the email — no name, no permissions, no roles.

**Why it's risky:**
New users complete the 4-step registration flow and land on the dashboard with a broken auth session — no permissions, missing profile data. Every permission check fails silently.

**Current code:**
```ts
// src/lib/auth.tsx line 261–267
const register: AuthState["register"] = async (payload) => {
  const { user: rawUser } = await registerRequest(payload);  // token DISCARDED
  const resolved = rawUser ?? (await fetchProfileRequest());  // called without token → 401
  const finalUser = toAuthUser(resolved, payload.email);
  setAuthRole(finalUser.role);
  applyUser(finalUser);
};
```

**Exact Code Fix:**
```ts
const register: AuthState["register"] = async (payload) => {
  const { token, user: rawUser } = await registerRequest(payload);
  // Store token before fetching profile (same pattern as login)
  if (token) setAuthToken(token);
  const resolved = rawUser ?? (await fetchProfileRequest());
  const finalUser = toAuthUser(resolved, payload.email);
  setAuthRole(finalUser.role);
  applyUser(finalUser);
};
```

---

### BUG-003 — Face Login: Admin Always Redirected to `/dashboard` Instead of `/dashboard/admin`

**Severity:** CRITICAL
**File:** `src/components/FaceLoginButton.tsx`
**Lines:** 59, 109–115

**Problem:**
Three compounding issues:

1. `isAdmin` is a closure captured **before** the async `refreshProfile()` resolves. React state updates are asynchronous — `isAdmin` still holds `false` when `router.push(isAdmin ? ...)` executes on line 115.

2. For admin face login: `refreshProfile()` checks `if (user?.role === 'admin') return` (auth.tsx:282), but `user` is `null` at call time (no prior `applyUser` was called). So it proceeds to call `fetchProfileRequest()` → hits `/customer/profile` — a customer-only endpoint that returns 403 for admin accounts.

3. Even if (1) and (2) were fixed, `applyUser` is never called with the admin user data from the face login response. The `user` returned by `faceLoginRequest()` is available but unused.

**Exact Code Fix:**
```ts
// src/components/FaceLoginButton.tsx — replace capture() function body
const capture = async () => {
  // ...canvas capture unchanged...
  setSubmitting(true);
  try {
    const { token, user: rawUser } = await faceLoginRequest(dataUrl);
    if (token) setAuthToken(token);

    // Determine admin from the response directly — same logic as login()
    const provisional = rawUser
      ? toAuthUser(rawUser)  // import toAuthUser or expose a helper
      : null;
    const resolvedAdmin = provisional?.role === "admin";

    if (!resolvedAdmin && rawUser) {
      // Regular user: refresh full profile
      await refreshProfile();
    } else if (rawUser) {
      // Admin: apply user directly from face login response
      applyUser(toAuthUser(rawUser));  // needs applyUser exposed from useAuth
    }

    toast.success(t("auth.faceLogin.success", "Welcome back"));
    onClose();
    router.push(resolvedAdmin ? "/dashboard/admin" : "/dashboard");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : t("auth.faceLogin.failed", "Face login failed"));
  } finally {
    setSubmitting(false);
  }
};
```

---

### BUG-004 — Hardcoded Dev API URL in `next.config.ts` — Production Proxies to Dev Backend

**Severity:** CRITICAL
**File:** `next.config.ts`
**Line:** 3, 20

**Problem:**
The Next.js rewrite rule hardcodes `https://api.dev.rgeeb.com` as the proxy destination. When this app is deployed to production, **every API call** is proxied to the development server.

```ts
// next.config.ts line 3
const BACKEND_URL = "https://api.dev.rgeeb.com"; // HARDCODED DEV URL
```

The same URL is the fallback in `src/lib/api.ts:25`. There are no `.env` files in the project, meaning the `NEXT_PUBLIC_API_URL` environment variable is never set, and both the server-side SSR calls and the proxy destination always use the dev backend.

**Exact Code Fix:**
```ts
// next.config.ts
const BACKEND_URL = process.env.BACKEND_URL ?? "https://api.dev.rgeeb.com";
```

```ts
// .env.local (create this file)
BACKEND_URL=https://api.dev.rgeeb.com
NEXT_PUBLIC_API_URL=https://api.dev.rgeeb.com/api

// .env.production (create this file)
BACKEND_URL=https://api.rgeeb.com
NEXT_PUBLIC_API_URL=https://api.rgeeb.com/api
```

---

### BUG-005 — Branch Intelligence Export Exposes Auth Token in URL Query String

**Severity:** CRITICAL
**File:** `src/views/BrIntelligenceView.tsx`
**Line:** 268–269

**Problem:**
The export button constructs a URL with the auth token as a plain query parameter and opens it in a new tab. This is a serious security vulnerability:
- Token appears in browser history
- Token appears in server access logs
- Token appears in `Referer` headers sent to third parties
- Anyone with access to the browser, logs, or network traffic can steal the session

Additionally, the URL bypasses the Next.js `/api` proxy and hits `https://api.dev.rgeeb.com` directly — the **dev backend** — from a production deployment. This will fail with CORS errors in any environment where the frontend is not on the same origin as the dev backend.

There is no corresponding endpoint registered in `src/lib/endpoints.ts`.

```ts
// BrIntelligenceView.tsx line 268 — DO NOT SHIP
const url = `https://api.dev.rgeeb.com/api/customer/branch-intelligence/export-report?date_from=${from}&date_to=${to}&type=full&token=${token ?? ""}`;
window.open(url, "_blank");
```

**Exact Code Fix:**
```ts
// 1. Add endpoint to src/lib/endpoints.ts
intelligence: {
  // ...existing keys...
  exportReport: "/customer/branch-intelligence/export-report",
},

// 2. Add service method to intelligenceService.ts
export async function exportBranchIntelligenceReport(
  from: string, to: string, type = "full"
): Promise<void> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoints.intelligence.exportReport}?date_from=${from}&date_to=${to}&type=${type}`;
  const res = await fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `branch-intelligence-${from}-${to}.xlsx`;
  a.click();
}

// 3. Replace window.open call in BrIntelligenceView.tsx line 268
onClick={async () => {
  try {
    await exportBranchIntelligenceReport(from, to);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : t("common.error"));
  }
}}
```

---

### BUG-006 — Dashboard `load()` Has No try/catch — Unhandled Rejection Crashes Component

**Severity:** HIGH
**File:** `src/views/DashboardView.tsx`
**Lines:** 258–286

**Problem:**
`load()` is an `async` function called directly with `load()` (no `void` or `.catch()`). If any of the 9 `Promise.all` entries throws (network down, 500 error, timeout), the exception propagates as an unhandled promise rejection. `setLoading(false)` is never called, leaving the dashboard in a permanent loading state. The `error.tsx` boundary won't catch this because it only catches rendering errors, not unhandled async rejections in `useEffect`.

**Exact Code Fix:**
```ts
const load = React.useCallback(async () => {
  setLoading(true);
  setError(null);  // add: const [error, setError] = React.useState<string | null>(null);
  try {
    const filters = { from, to, branchId: branchId === "all" ? undefined : branchId };
    const [s, ai, tk, vf, la, at, co, bd, br] = await Promise.all([
      dashboardService.getSummary(filters),
      dashboardService.listAIServices(filters),
      dashboardService.getTaskSummary({ ...filters, assignedToMe }),
      dashboardService.getVisitorFlow(filters),
      dashboardService.getLiveActivity(filters),
      dashboardService.getAttendance(filters),
      dashboardService.getCompliance(filters),
      dashboardService.getDetectionBreakdown(filters),
      dashboardService.getBranches(filters),
    ]);
    setSummary(s); setServices(ai); setTasks(tk); setFlow(vf);
    setActivity(la); setAttendance(at); setCompliance(co);
    setBreakdown(bd); setBranches(br);
  } catch (err) {
    setError(err instanceof Error ? err.message : t("errors.somethingWentWrong"));
  } finally {
    setLoading(false);
  }
}, [from, to, branchId, assignedToMe, t]);
```

---

## 🟠 HIGH SEVERITY BUGS

---

### BUG-007 — OTP Verification Token Exposed in URL

**Severity:** HIGH
**File:** `src/views/auth/OtpView.tsx`
**Line:** 185–187

**Problem:**
After the user enters their OTP code, `handleVerify()` redirects to:
```
/reset-password?email=user@example.com&token=123456
```
The OTP code is passed as a plain URL query parameter. It appears in browser history, server logs, and any analytics/monitoring tools. The token remains valid until used, meaning anyone with access to these logs can reset the user's password.

**Recommended Fix:**
Store the verified OTP in `sessionStorage` and read it in `ResetPasswordView` instead of passing it via URL. Alternatively, verify the OTP server-side and receive a short-lived signed reset token in return.

---

### BUG-008 — Auth Layout Has No Authenticated-User Redirect Guard

**Severity:** HIGH
**File:** `src/app/(auth)/layout.tsx`
**Lines:** 1–13 (entire file)

**Problem:**
`AuthLayout` renders `{children}` unconditionally. An already-authenticated user who navigates to `/login`, `/register`, or `/forgot-password` sees the auth page with no redirect to the dashboard. This creates confusion and allows authenticated users to accidentally log in as a different account, losing their current session.

**Exact Code Fix:**
```tsx
// src/app/(auth)/layout.tsx
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? "/dashboard/admin" : "/dashboard");
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  if (isLoading || isAuthenticated) return null;
  return <>{children}</>;
}
```

---

### BUG-009 — `/otp` and `/reset-password` Accessible Without Email Param

**Severity:** HIGH
**Files:** `src/views/auth/OtpView.tsx:119`, `src/views/auth/ResetPasswordView.tsx:28`

**Problem:**
Both pages read `email` from `searchParams.get("email") ?? ""`. If a user navigates directly to `/otp` or `/reset-password` without query params, `email` is an empty string. `OtpView` shows a countdown for an OTP that was never sent (expiry timer runs from 300s regardless). `ResetPasswordView` validates email as part of `validate()` but shows the email input pre-filled as empty — the user must manually type their own email for the reset to work, which is unexpected UX and creates an attack surface (reset anyone's password if you intercept their OTP token).

**Exact Code Fix:**
```tsx
// Add to both OtpView and ResetPasswordView
useEffect(() => {
  if (!email) {
    router.replace("/forgot-password");
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

---

### BUG-010 — `ProductivityView` Infinite Spinner on API Failure

**Severity:** HIGH
**File:** `src/views/ProductivityView.tsx`
**Lines:** 62–82

**Problem:**
`setLoading(true)` is called before the `Promise.all`. `setLoading(false)` is called only inside `.then()`. If the API calls reject, `.then()` never runs and `loading` stays `true` forever — the page shows an infinite spinner with no error message, no retry button, and no way to recover without a full page reload.

The same pattern affects `src/views/ChatAnalyticsView.tsx` (no `loading` state at all, so no spinner but also no error indication).

**Exact Code Fix (ProductivityView):**
```ts
void Promise.all([...]).then(([s, l, d]) => {
  if (cancelled) return;
  setSummary(s); setLeaderboard(l); setDepartments(d);
  if (l.length && !selectedEmployee) setSelectedEmployee(l[0].id);
}).catch((err) => {
  if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
}).finally(() => {
  if (!cancelled) setLoading(false);
});
```

---

### BUG-011 — `StatisticsView` Silently Swallows API Errors

**Severity:** HIGH
**File:** `src/views/StatisticsView.tsx`
**Lines:** 93–102

**Problem:**
The `load()` function uses `try { ... } finally { setLoading(false) }` with **no `catch` block**. If `fetchReport()` rejects, the error is silently discarded. The loading state clears, but the table remains empty and stale. There is no `error` state, no error message, no retry button. Users see a blank table with no indication that data failed to load.

**Exact Code Fix:**
```ts
const [error, setError] = useState<string | null>(null);

const load = useCallback(async (which: ReportTab) => {
  if (!canFetch) return;
  setLoading(true);
  setError(null);
  try {
    const r = await fetchReport(which, { dateFrom: from, dateTo: to });
    setData(r);
  } catch (err) {
    setError(err instanceof Error ? err.message : t("errors.somethingWentWrong"));
  } finally {
    setLoading(false);
  }
}, [canFetch, from, to, t]);
```

---

### BUG-012 — `ProductivityView` Export Sends No Auth Header — Returns 401

**Severity:** HIGH
**File:** `src/views/ProductivityView.tsx`
**Lines:** 157–162

**Problem:**
The export button uses `link.click()` to trigger a browser navigation to `/api/customer/productivity/export-excel`. Browser-initiated navigation requests do **not** include custom headers. The API uses `Authorization: Bearer <token>` (not cookies). This request will arrive at the backend without authentication and return a 401 or 403. The user sees no error — the browser just ignores the failed download silently.

```ts
// BROKEN: no auth header
const link = document.createElement("a");
link.href = `/api/customer/productivity/export-excel?...`;
link.download = "productivity.xlsx";
link.click();
```

**Exact Code Fix:**
```ts
onClick={async () => {
  const token = getAuthToken();
  const params = dateFrom ? `?date_from=${dateFrom}&date_to=${dateTo ?? ""}` : "";
  const res = await fetch(`/api/customer/productivity/export-excel${params}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) { toast.error(t("productivity.exportFailed", "Export failed")); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "productivity.xlsx"; a.click();
  URL.revokeObjectURL(url);
}}
```

---

### BUG-013 — All 87 `error.tsx` Boundary Files Have Hardcoded English Strings

**Severity:** HIGH
**Files:** All `src/app/dashboard/**/error.tsx` (87 files)
**Example:** `src/app/dashboard/error.tsx:14-15`

**Problem:**
Every `error.tsx` boundary file passes hardcoded English strings as `title` and `description` props to `PageErrorFallback`. These strings are not wrapped in `t()` and cannot be translated. Arabic users see English error messages.

```tsx
// All 87 files follow this pattern — HARDCODED
title="Failed to load Dashboard"
description="There was an error loading this page. Please try again."
```

**Exact Code Fix:**
Since `error.tsx` files are server-compatible Next.js boundaries, create a client wrapper:

```tsx
// src/app/dashboard/error.tsx
"use client";
import { useTranslation } from "react-i18next";
import { PageErrorFallback } from "@/components/dashboard/error-fallback";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();
  return (
    <PageErrorFallback
      error={error}
      reset={reset}
      title={t("errors.pageLoadFailed", "Failed to load page")}
      description={t("errors.tryAgain", "There was an error. Please try again.")}
    />
  );
}
```

Apply consistently across all 87 files using a script or template.

---

## 🟡 MEDIUM SEVERITY

---

### BUG-014 — `RegisterView` Has `"Step"` Hardcoded in English (Partial Translation)

**Severity:** MEDIUM
**File:** `src/views/auth/RegisterView.tsx`
**Line:** 541

**Problem:**
The step progress indicator renders `Step {step + 1} {t("auth.register.stepOf")} {STEPS.length}`. The word "Step" is hardcoded English. Arabic users see "Step 1 من 4" instead of "الخطوة 1 من 4".

**Exact Code Fix:**
```tsx
// Replace line 541
{t("auth.register.stepLabel", "Step")} {step + 1} {t("auth.register.stepOf")} {STEPS.length}

// Add to en.json auth.register:
"stepLabel": "Step"

// Add to ar.json auth.register:
"stepLabel": "الخطوة"
```

---

### BUG-015 — FaceLoginButton Has Zero Translation Coverage

**Severity:** MEDIUM
**File:** `src/components/FaceLoginButton.tsx`
**Lines:** 41, 80, 112, 117, 126, 165

**Problem:**
`FaceLoginButton` does not import or use `useTranslation`. Every visible string is hardcoded English: button label "Sign in with Face ID", dialog title "Sign in with your face", error messages "Could not access the camera" and "Face login failed", toast "Welcome back", and button text "Capture & sign in" / "Verifying…". Arabic users of this component see English-only UI.

**Exact Code Fix:**
```tsx
import { useTranslation } from "react-i18next";
// Inside FaceLoginButton:
const { t } = useTranslation();
// Replace hardcoded strings:
// "Sign in with Face ID" → t("auth.login.faceId")
// "Sign in with your face" → t("auth.faceLogin.dialogTitle", "Sign in with your face")
// "Could not access the camera" → t("auth.faceLogin.cameraError", "Could not access the camera")
// "Welcome back" → t("auth.faceLogin.success", "Welcome back")
// "Face login failed" → t("auth.faceLogin.failed", "Face login failed")
// "Capture & sign in" → t("auth.faceLogin.capture", "Capture & sign in")
// "Verifying…" → t("auth.faceLogin.verifying", "Verifying…")
// "Cancel" → t("common.cancel")
```

---

### BUG-016 — 41 Missing Translation Keys Cause Runtime Falls to Key Strings

**Severity:** MEDIUM
**Files:** Multiple views and locale files

**Problem:**
41 `t()` calls reference keys that do not exist in `en.json`. At runtime, `react-i18next` returns the key path as a string — users see text like `"cameras.code"`, `"eventTimeline.title"`, `"visitorRecords.noRecords"`. The entire `eventTimeline` and `visitorRecords` namespaces exist in the codebase but have no entries in the locale files.

**Complete list of missing EN keys:**

| File | Missing Key |
|---|---|
| `views/CamerasView.tsx` | `cameras.code`, `cameras.source`, `cameras.model`, `cameras.ipAddress`, `cameras.minConf`, `cameras.directionIn`, `cameras.directionInOption`, `cameras.directionOutOption`, `cameras.enableCounter` |
| `views/EventTimelineView.tsx` | `eventTimeline.title`, `eventTimeline.subtitle`, `eventTimeline.alerts`, `eventTimeline.found`, `eventTimeline.noEvents`, `common.branch`, `common.dateRange`, `common.type`, `errors.loadFailed` |
| `views/VisitorRecordsView.tsx` | `visitorRecords.title`, `visitorRecords.subtitle`, `visitorRecords.total`, `visitorRecords.entered`, `visitorRecords.exited`, `visitorRecords.noRecords`, `visitors.enter`, `visitors.exit`, `common.page`, `common.prev`, `errors.loadFailed` |
| `views/ProjectsView.tsx` | `projects.branches`, `projects.selectManager`, `projects.branchNote` |
| `views/TasksView.tsx` | `tasks.form.assignTo`, `tasks.form.assignNote`, `tasks.form.startDate`, `tasks.form.endDate`, `tasks.form.time`, `tasks.form.recurringSettings`, `tasks.form.everyDays`, `tasks.form.saveAsDraft`, `tasks.form.selectEmployee` |

**Also — 12 AR keys missing from EN (already fixed in this audit session):**
`intel.confidence95`, `intel.errorDesc`, `intel.errorTitle`, `intel.forecast`, `intel.historical`, `intel.noForecastData`, `intel.printDate`, `productivity.status_absent`, `productivity.status_late`, `productivity.status_leave`, `productivity.status_present`, `productivity.unassigned`

---

### BUG-017 — `AnalyticsView` and `ChatAnalyticsView` Have No Refresh Button

**Severity:** MEDIUM
**Files:** `src/views/AnalyticsView.tsx`, `src/views/ChatAnalyticsView.tsx`

**Problem:**
Both views fetch data on mount and on filter change, but neither exposes a manual refresh button. If data fails to load (API timeout, network blip), users have no way to retry without changing a filter or reloading the full page. Dashboard has a working refresh button; these pages are inconsistent.

**Recommended Fix:**
```tsx
// Add a refresh button to the filter bar
<Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
  {t("common.refresh")}
</Button>
```

---

### BUG-018 — Hardcoded Toast Messages — Not Translated (19 instances)

**Severity:** MEDIUM
**Files:** Multiple views

**Problem:**
19 `toast.success()` and `toast.error()` calls use hardcoded English strings instead of `t()`. In Arabic UI mode, all mutation feedback (creates, updates, deletes) appears in English.

**Complete list:**

| File | Line | Hardcoded String |
|---|---|---|
| `views/CamerasView.tsx` | 125 | `"Online status refreshed"` |
| `views/CamerasView.tsx` | 146 | `"Camera deleted"` |
| `views/CamerasView.tsx` | 127 | `"Failed to check online status"` |
| `views/CamerasView.tsx` | 149 | `"Delete failed"` |
| `views/ReportCenterView.tsx` | 183 | `"Please select a report template"` |
| `views/ReportCenterView.tsx` | 191 | `"Please enter at least one recipient email"` |
| `views/ReportCenterView.tsx` | 373 | `"Download failed"` |
| `views/ReportCenterView.tsx` | 380 | `"Report deleted"` |
| `views/ReportCenterView.tsx` | 390 | `"Report scheduled successfully"` |
| `views/ReportCenterView.tsx` | 401 | `"Schedule removed"` |
| `views/DetectionFeedView.tsx` | 100 | `"Detection deleted successfully"` |
| `views/EscalationAlertsView.tsx` | 69 | `"Rule updated"` |
| `views/EscalationAlertsView.tsx` | 78 | `"Rule deleted"` |
| `views/MyTasksView.tsx` | 81 | `"Task started"` |
| `views/MyTasksView.tsx` | 90 | `"Task completed"` |
| `views/NotificationsView.tsx` | 61 | `"All notifications marked as read"` |
| `views/TasksView.tsx` | 350 | `"Task deleted"` |
| `views/TasksView.tsx` | 360 | `"Status updated"` |
| `views/admin/AdminClientsView.tsx` | 101-108 | 3 hardcoded validation errors |

---

### BUG-019 — `ProfileView` Uses Shadcn `<Select>` for API-Backed Countries/Cities Data

**Severity:** MEDIUM
**File:** `src/views/ProfileView.tsx`
**Lines:** 432–470

**Problem:**
Countries and cities are loaded from the API via `useQuery` then rendered inside a shadcn `<Select>` using `.map()`. Shadcn `<Select>` (`@radix-ui/react-select`) renders **all options in the DOM at once**. Most country lists have 200+ entries; city lists can exceed 500. This causes:
- Slow initial render (DOM with 500+ `<SelectItem>` nodes)
- Poor accessibility (screen readers enumerate all options)
- No search/filter capability within the dropdown
- Inconsistency with `AsyncPaginatedSelect` used elsewhere for the same data

**File:** `src/views/ProfileView.tsx` line 440: `"Select country"` placeholder is hardcoded (Arabic fallback on line 440 is also hardcoded: `"اختر الدولة"`).

**Recommended Fix:**
Replace both `<Select>` blocks with `<AsyncPaginatedSelect>`:
```tsx
<AsyncPaginatedSelect
  endpoint={endpoints.lookups.countries}
  labelKey="name_en"
  valueKey="id"
  value={selectedCountry}
  onChange={(v) => { setSelectedCountry(v ?? ""); setCityId(""); }}
  placeholder={t("auth.register.selectCountry")}
  isDark={false}
/>
```

---

### BUG-020 — `ReportCenterView` Template Select Uses API Data in Shadcn `<Select>`

**Severity:** MEDIUM
**File:** `src/views/ReportCenterView.tsx`
**Lines:** 215–231

**Problem:**
Report templates are fetched from `endpoints.reportCenter.templates` via `useQuery` and rendered inside a shadcn `<Select>`. If templates grow beyond a few entries, this creates the same performance and UX issues as BUG-019. `SelectValue placeholder="Report Template"` is hardcoded English (line 220).

**Recommended Fix:**
Replace with `<AsyncPaginatedSelect endpoint={endpoints.reportCenter.templates} .../>` or at minimum wrap the placeholder in `t()`.

---

### BUG-021 — `AIServiceDetailView` Renders Hardcoded Mock Data in `RECENT_EVENTS`

**Severity:** MEDIUM
**File:** `src/views/ai-services/AIServiceDetailView.tsx`
**Lines:** 35–50, 328

**Problem:**
The `StaticDetailView` component (rendered for services without an `apiId`) uses a hardcoded `RECENT_EVENTS` array with timestamps like `"2 min ago"`, `"8 min ago"`, and detection labels like `"Detection triggered"`. This static mock data renders in production for every service that doesn't have a `serviceApiId`. Users see fake, stale data that never updates.

```ts
const RECENT_EVENTS = [
  { time: "2 min ago", label: "Detection triggered", cam: "Camera 3", status: "alert" },
  // ...
];
```

**Recommended Fix:**
Either remove `RECENT_EVENTS` and show an empty state for services without API data, or fetch real recent detections from the detections API filtered by service type.

---

### BUG-022 — `HomeView` Admin Redirect Goes Through Double Hop

**Severity:** LOW-MEDIUM
**File:** `src/views/HomeView.tsx`
**Line:** 12

**Problem:**
`HomeView` redirects all authenticated users to `/dashboard`:
```ts
router.replace(isAuthenticated ? "/dashboard" : "/login");
```
`DashboardPage` then checks `isAdmin` and redirects admins to `/dashboard/admin` (line 17). This creates an unnecessary double redirect for admin users: `/` → `/dashboard` → `/dashboard/admin`. Both redirects are `replace()`, so it works, but adds latency.

**Exact Code Fix:**
```ts
router.replace(isAuthenticated ? (isAdmin ? "/dashboard/admin" : "/dashboard") : "/login");
```

---

## 🔵 COMPONENT COMPLIANCE AUDIT

### Select Component Usage Analysis

**Verdict: ALL `<Select>` usages are from `@/components/ui/select` (shadcn/Radix) — NOT `react-select` or legacy libraries.**

No instances of direct `react-select` imports were found outside of `AsyncPaginatedSelect.tsx` itself (where it is intentional).

The `<Select>` component from shadcn is **correctly used** for static enum data in the following files:
- `TasksView.tsx` — PRIORITIES, TYPES, STATUSES (static arrays, correct)
- `AiTaskRulesView.tsx` — taskTypes, priorities (static arrays, correct)
- `EventTimelineView.tsx` — COMMON_TYPES (static array, correct)
- `ProjectsView.tsx` — STATUSES (static array, correct)
- `BrIntelligenceFilterBar.tsx` — service names (small static set, acceptable)

**Two files require migration from `<Select>` to `<AsyncPaginatedSelect>`:**

| File | Line | Issue |
|---|---|---|
| `src/views/ProfileView.tsx` | 432, 453 | Countries (200+ API items) and cities (500+ API items) rendered in `<Select>` — performance and UX risk |
| `src/views/ReportCenterView.tsx` | 215 | Report templates from API rendered in `<Select>` — no search, no pagination |

**`AsyncPaginatedSelect` is correctly used in 35+ locations** across the codebase for all dynamic API-backed dropdowns.

---

## 🔵 FILTERS / REFRESH / EXPORT AUDIT

### Page-by-Page Status

| Page | Filters | Refresh | Export | Notes |
|---|---|---|---|---|
| Dashboard | ✅ Date + Branch + Category | ✅ Connected to `load()` | ❌ None | |
| Analytics | ✅ Date + Branch | ❌ No refresh button | ❌ None | |
| Branch Intelligence | ✅ Date + Branch + Service | ✅ Refresh works | 🔴 BROKEN (hardcoded URL, token in query string) | BUG-005 |
| Statistics | ✅ Date presets + picker | ✅ Tab change triggers load | ✅ Inherited from DataTable | |
| Chat Analytics | ✅ Date range | ❌ No refresh button | ❌ None | |
| Productivity | ✅ Date range | ✅ Date change triggers load | 🟡 Auth-less export | BUG-012 |
| Detection Feed | ✅ All filters | ✅ Implicit via filter | ✅ Via DataTable export | |
| Service Monitor | ✅ Date + Branch | ✅ RefreshCw button | ❌ None | |
| Report Center | ✅ Multiple filters | ✅ React Query invalidate | ✅ `downloadReport()` with auth | |
| Task Reports | ✅ Date range | ✅ Implicit | ✅ `downloadTaskReport()` with auth | |
| Cameras | ✅ Search only | ✅ React Query refetch | ❌ None | |
| Tasks | ✅ Status/Type/Priority/Branch | ✅ React Query invalidate | ❌ None | |

---

## 🔵 AUTHENTICATION FLOW SUMMARY

| Flow | Status | Issues |
|---|---|---|
| Login | 🟡 Works | No redirect guard for authenticated users |
| Register (4-step) | 🔴 Broken | BUG-002: token not stored; "Step" hardcoded |
| OTP Verification | 🟡 Works | Token in URL (BUG-007); no email guard (BUG-009) |
| Forgot Password | ✅ Works | Minor: no redirect after OTP page "Back" press |
| Reset Password | 🟡 Works | No guard for direct URL access (BUG-009) |
| Face Login | 🔴 Broken | BUG-001 (FormData), BUG-003 (admin redirect) |
| Logout | ✅ Works | Both admin and user routes correct |
| Token Refresh | ✅ Works | Background refresh on mount |
| Permission Guards | ✅ Works | Aliases in auth.tsx cover all routes |

---

## 🔵 TRANSLATION AUDIT SUMMARY

| Metric | Count |
|---|---|
| Total EN keys | 2,256 (after fix) |
| Total AR keys | 2,256 |
| Keys missing from EN (fixed) | 12 → 0 |
| Keys missing from AR | 0 |
| Views with missing `t()` keys | 5 views, 41 keys |
| Views with hardcoded strings | 12+ views |
| error.tsx files with hardcoded strings | 87 files |
| Components without `useTranslation` | 1 (`FaceLoginButton`) |

---

## 🔵 MISSING FEATURES REPORT

| Feature | Status | Location |
|---|---|---|
| Branch Intelligence Export via authenticated fetch | ❌ Missing | `intelligenceService.ts` |
| `eventTimeline` translations | ❌ Empty namespace | `en.json`, `ar.json` |
| `visitorRecords` translations | ❌ Empty namespace | `en.json`, `ar.json` |
| Refresh button — Analytics page | ❌ Missing | `AnalyticsView.tsx` |
| Refresh button — Chat Analytics page | ❌ Missing | `ChatAnalyticsView.tsx` |
| Error state — Analytics page | ❌ Missing | `AnalyticsView.tsx` |
| Error state — Chat Analytics page | ❌ Missing | `ChatAnalyticsView.tsx` |
| Error state — Statistics page | ❌ Missing | `StatisticsView.tsx` |
| Production env vars | ❌ No `.env` files | Project root |
| Admin face login (works correctly) | ❌ Broken | `FaceLoginButton.tsx` |
| Avatar upload | ❌ Broken (FormData bug) | `profileService.ts` |
| Camera create/update | ❌ Broken (FormData bug) | `camerasService.ts` |
| DataTable server-side pagination | ❌ Not implemented | `data-table.tsx` |

---

## 🔵 BUGS FIXED IN THIS AUDIT SESSION

| Fix | File | Description |
|---|---|---|
| Added 12 missing EN translation keys | `src/i18n/locales/en.json` | `intel.*` and `productivity.status_*` keys |

---

## 🔵 REMAINING RISKS FOR PRODUCTION

1. **FormData bug (BUG-001)** — Face login, avatar upload, camera management are all silently broken. Must fix before any demo or QA testing.

2. **Register token not stored (BUG-002)** — New user registrations result in sessions with incomplete user data. First impressions for new customers are broken.

3. **Dev URL hardcoded in `next.config.ts` (BUG-004)** — A production build will proxy every API call to the dev backend. Data leakage, wrong environment.

4. **Token in URL for password reset (BUG-007)** — Security risk; password reset tokens appear in browser history and server logs.

5. **87 error pages in English only (BUG-013)** — Systematic issue requiring scripted fix across 87 files.

6. **41 missing translation keys (BUG-016)** — Entire pages (`EventTimeline`, `VisitorRecords`) show raw key strings to users in all languages.

7. **No loading/error state in ChatAnalytics** — Silent failures with no user feedback.

8. **Branch Intelligence export (BUG-005)** — Exposes auth token in URL, hits dev backend directly, will fail in production with CORS.
