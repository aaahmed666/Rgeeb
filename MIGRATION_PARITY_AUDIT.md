# MIGRATION AUDIT & FEATURE PARITY REPORT — OLD vs NEW

**OLD:** Materio/MUI Next.js (Pages Router, Redux Toolkit, axios, CASL-style ACL `{action, subject}`) — 165 page files (91 business routes under `/apps/*`, rest are template demo pages: `pages/components/*`, `pages/forms/*`, `pages/charts/*`, `pages/dashboards/{crm,ecommerce,analytics}`).
**NEW:** Next.js App Router, shadcn/Tailwind, react-query + service layer, i18next (en/ar parity), `usePermission`/`hasPermission` RBAC — 109 routes after this audit.
**Verification:** `tsc --noEmit` clean · Jest 185/185 · Vitest 101/101 · zero `rules-of-hooks` violations in new code.

---

## 1. EXECUTIVE SUMMARY

The NEW project had already reached parity on 90 of 91 OLD business routes (template demo pages are intentionally dropped — correct). This audit found and **fixed** one entire missing production module (Customer Island — 8 pages), **fixed** two API contract regressions (subscription add-service, report-center deletes), and confirmed the remaining endpoint diffs are intentional backend evolution, not regressions. Remaining open items are backend-confirmation questions, listed in §5/§6.

**Production Readiness Score: 88/100** (was ~74 before this round: −10 for the missing island module, −4 for the API regressions).
Deductions remaining: −5 reset-password backend contract unresolved (see prior STATIC_AUDIT_REPORT), −3 open endpoint confirmations (§6), −2 island module is a faithful port but unexercised against the live backend, −2 minor translation/hardcoded-string backlog.
**Code Quality Score: 8.5/10** — typed service layer, consistent guards, tested services; deductions for residual raw tables/native selects and the dual test-runner setup.

---

## 2. FEATURE PARITY — PAGE-BY-PAGE

Format: PAGE · OLD FEATURE · NEW STATUS · SEVERITY · RECOMMENDATION

| PAGE | OLD FEATURE | NEW STATUS | SEVERITY | RECOMMENDATION |
|---|---|---|---|---|
| Customer Island (8 pages) | KPI dashboard, hourly traffic + attraction rate, conversion funnel, presence timeline, response-time avg/min/max, demographics (gender + 5 age groups), heatmap (camera/date/hour), violations table (status chips, 10/25/50 pagination); filters from/to/branch_id in URL; ACL subject `island` | ✅ **PORTED in this round** — `islandService` (8 endpoints, identical params/types/unwrapping), `IslandHeader` (URL-persisted filters, tab nav), 8 views, 8 routes, sidebar group, `island` permission alias, full en+ar i18n | Critical (was) | Smoke-test against live `/customer/island/*` |
| Customer Island → Response Time | Nav linked `/apps/customer-island/response-time` but **no page file existed in OLD** (production 404) | ✅ Implemented in NEW (API existed in OLD store) | Medium | Intentional improvement — NEW exceeds OLD here |
| Subscription → Add Services | `GET /customer/services/available?all=1` + `POST /customer/subscriptions/add-service {service_ids}` | ✅ **FIXED** — NEW was POSTing to the services *list* endpoint | High (was) | None — endpoints now match production |
| Report Center → delete generated/scheduled | `POST …/generated/delete` / `…/schedule/delete` | ✅ **FIXED** — NEW used RESTful DELETE only; now tries DELETE then falls back to the legacy POST | High (was) | Remove fallback once backend confirms RESTful routes |
| Notifications → mark all read | `POST /customer/notifications/read-all` | NEW uses `/mark-all-read` — **Postman confirms NEW is canonical**; OLD path was legacy | None | No action |
| Task Analytics | OLD: `…/branches`, `…/reopen` | NEW: `volume/sla/workers/ai-pipeline/verifications` + `verify`/`reject` — matches current Postman; backend evolved | Low | Confirm `reopen` was superseded by `verify`/`reject` |
| Foodics health page | `/apps/foodics/health` | ✅ exists (`/dashboard/foodics/health`) | None | — |
| Foodics conversion page | `/apps/foodics/conversion` (daily/hourly/summary) | ✅ Footfall/conversion page exists; endpoints present in `endpoints.ts` | None | — |
| Foodics OAuth callback | OLD called `/customer/foodics/callback` directly | NEW uses connect-URL + disconnect flow | Low | Verify the backend handles the OAuth redirect itself |
| Admin Clients → Impersonate | `POST /admin/impersonate` (login-as-client) | ❌ Not implemented; **not in Postman either** | Medium | Confirm with backend; if route is live, add an "Impersonate" action to AdminClientsView |
| Overview `[tabs]` page | Tabbed overview | Superseded by Insights section (statistics/analytics) | Low | Intentional redesign |
| User list/view | `/apps/user/*` | Employees + Admin Users views | None | — |
| Template pages (components/forms/charts demos, CRM/eCommerce dashboards) | Materio demos | Intentionally dropped | None | Correct — not business features |

All other 80+ business routes have direct NEW equivalents (verified by route map diff with alias table: admins→admin/users, smart-scheduler→ai-scheduler, task-rules→ai-task-rules, monitoring→system-monitoring, attendances→attendance, branch-intelligence→br-intelligence, escalation→escalation-alerts).

## 3. BUG DETECTION (Phase 3)

New code introduced this round was checked for: hook-order violations (eslint rules-of-hooks: 0), missing Suspense around `useSearchParams` (all 8 island pages wrapped), unbounded effects (island loaders depend only on primitive filter values), null crashes (`?? 0`, `?? "—"` on every API field, hour-bucket maps pre-seeded 0–23 so charts never index-crash), race conditions (filter changes reset violations to page 1, matching OLD; per-view loading flags), memory leaks (no intervals/listeners added; header uses router.replace, no subscriptions), and i18n keys (full en/ar set added — locale parity preserved at equal key counts). Pre-existing bug classes (timezone dates, demo-data fabrication, swallowed errors, dead permission guards) were fixed in earlier rounds and remain covered by the 286 passing tests.

## 4. DASHBOARD AUDIT (Phase 4)

Calculations cross-checked OLD→NEW: `formatTime` seconds→`Xm Ys` ported verbatim as `formatResponseTime`; presence % displayed raw with `%` suffix (same); funnel percentages taken from API (`stoppers_percentage`/`buyers_percentage`), not recomputed — same as OLD; attraction-rate plotted on a separate % axis (OLD chart parity); KPI gradients/icons match the OLD card set 1:1. Main dashboard, Admin dashboard, Analytics, and Br-Intelligence calculations were verified in the prior audit (see STATIC_AUDIT_REPORT.md) — visitor flow, compliance score derivation (`100 − violations/total×100`), and detection breakdowns match.

## 5. PERMISSION AUDIT (Phase 5)

OLD ACL pairs `{action, subject}` map to NEW `hasPermission`/`usePermission` namespaces. Coverage: every OLD subject has a NEW alias (`island` added this round). Page access: island pages guard with `hasPermission("island")` (matches OLD subject); per-action OLD ACL granularity (`action: 'traffic'` etc.) is intentionally collapsed to subject-level in NEW — flag to product if per-tab permissions must be enforced (Low). Button-level create/update/delete gating via `can.*` verified across master-data views in the prior audit; 9 missing read guards were fixed there. **Open:** Impersonate permission (no NEW surface, see §2).

## 6. API AUDIT (Phase 6)

158 OLD endpoints diffed against 242 NEW endpoint strings. After normalizing query-string artifacts: **8 island endpoints → added**; **add-service → fixed**; **2 report deletes → fixed with fallback**; `read-all`→`mark-all-read` and `chat/test-whatsapp`→`chat/settings/test-whatsapp` are NEW-correct per Postman. **Open confirmations:** `/admin/impersonate`, `/customer/task-analytics/{branches,reopen}` (superseded?), `/customer/foodics/callback`, `/customer/task-notifications{,/mark-read}` (NEW consolidates into escalation/notifications services), `/customer/task-templates/delete` (NEW uses RESTful DELETE — consider the same fallback pattern if QA hits 405).

## 7. AUTO-FIX LOG (Phase 7)

Files added: `src/services/islandService.ts`, `src/components/customer-island/IslandHeader.tsx`, `src/views/customer-island/IslandViews.tsx`, `src/views/customer-island/IslandHeatmapViolations.tsx`, 8 × `src/app/dashboard/customer-island/*/page.tsx`. Files modified: `AppSidebar.tsx` (island group + icons), `lib/auth.tsx` (island alias), `lib/endpoints.ts` (availableServices/addServices), `services/subscriptionService.ts`, `services/reportCenterService.ts`, `i18n/locales/{en,ar}.json` (+66 keys each). Nothing removed; all 286 existing tests still pass.

## 8. PERFORMANCE NOTES

Island charts render ≤24-point datasets (negligible); recharts already in the bundle (no new deps); URL-based filters avoid context re-render cascades; violations list server-paginated. OLD's Redux global store is replaced by per-view fetch state — fewer cross-page re-renders by construction.
