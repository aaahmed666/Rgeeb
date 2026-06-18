# Resolved Issues — Changed Files

All paths are relative to the project root. Drop each file into the same path in your repo.

## 1. User create — client_id dropdown
The "Create User" form had no client field, so `/admin/users/create` failed with
"The client id field is required." Added a client selector (paginated async,
searchable) using the existing `AsyncPaginatedSelect`, sends `client_id` in the
payload, and disables Save until a client is chosen.

- `src/views/admin/AdminUsersView.tsx`
- `src/services/adminService.ts` (added `clientName` to `AdminUser` mapping)

## 2. Registration flow — removed package + payment steps
Flow now ends at email (OTP) verification. After registration the account is
auto-subscribed to a free trial server-side, then redirected to the dashboard.
The package-selection and payment (Fatoorah) logic, query, state, imports, and
JSX are commented out (not deleted) in case paid packages return.

- `src/views/auth/RegisterView.tsx`

## 3. Admin packages — is_trial flag
Add/Edit package now sends `is_trial` (boolean → "1"/"0", matches `in:0,1`).
Added a "Trial package" toggle in the form; type + mapper + form-data builder updated.

- `src/views/admin/AdminPackagesView.tsx`
- `src/services/adminService.ts`

## 4. Permissions — sidebar / page guard parity
Root cause: the sidebar (`hasPermission`) and page guards (`usePermission`) used
two different permission systems, so an item could show in the sidebar but its
page returned "You are not authorized…".

Fix: a single shared module is now the source of truth. `hasPermission` is
read-based (viewing a page requires `read`, or the explicit action when the
permission string already carries one, e.g. `foodics.orders.read`). The sidebar
and every page guard go through the same alias map + matcher, so an item shows
in the sidebar IFF its page actually opens.

Behaviour change: a user with RBAC data but an empty permission list now
fails closed (previously got read-only access by default). Genuine legacy
accounts (backend sent no RBAC at all) still get access.

- `src/lib/permissions.ts` (new shared module: alias map, matchers, `canAccess`)
- `src/lib/auth.tsx` (`hasPermission` → read-based via `canAccess`)
- `src/hooks/usePermission.ts` (`read` via shared `canAccess`)
- `src/components/AppSidebar.tsx` (`canSee` uses the now read-based `hasPermission`)

## 5. AI Services Hub — page guard + duplicate apiId
- The hub page had no permission guard (it imported `hasPermission` but never
  used it). Added an `ai-services` read guard, same permission that gates the
  sidebar group.
- Duplicate `apiId: 12` shared by `smoke-detection` and `gate-monitoring` caused
  Gate Monitoring to pull Smoke Detection's live data. Removed the wrong apiId
  from `gate-monitoring` (commented, with a FIXME) so it shows the static
  fallback until the real backend service id is confirmed (30 is the free/likely
  candidate).

- `src/views/AiServicesView.tsx`
- `src/views/ai-services/aiServicesData.ts`

## Follow-ups (not code — need your input / backend)
- Confirm the real backend service id for Gate Monitoring, then set its `apiId`.
- Add i18n keys with provided fallbacks: `admin.users.client`,
  `admin.users.selectClient`, `admin.packages.isTrial`, `admin.packages.isTrialHint`,
  `common.notAuthorized`.
