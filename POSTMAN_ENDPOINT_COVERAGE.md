# Postman → Frontend Endpoint Coverage

**Source contract:** `AI sass.postman_collection.json` (311 unique method+path endpoints)
**Registry:** `src/lib/endpoints.ts`
**Coverage:** **311 / 311 = 100%** — every Postman endpoint has a constant in the registry.

Verified with `tsc --noEmit` (clean), `vitest` (101/101), `jest` (unchanged — the
only 12 failures are pre-existing in `reportsService.test.ts`, an untouched file
whose tests exercise an external Fatoorah `fetch` mock).

## What was added/fixed in this pass

### New page (built end-to-end)
- **Orchestrator** (`/dashboard/admin/orchestrator`) — worker/GPU control plane
  (`active`, `pending`, `stale`, `stop-list`, `activate`, `reset-all`). Service,
  view, routes, admin nav entry, EN/AR i18n.

### Bug fixes
- **Chat settings never saved.** `POST /customer/chat/settings` was sending
  `whatsapp_enabled`/`whatsapp_number`/`notification_language`/`alert_thresholds`,
  but the contract (and the GET mapping) use `enabled`/`phoneNumber`/
  `notificationLanguage`/`alertThresholds`. Aligned the POST + test-whatsapp body.
- **AI Assistant language.** The chatbot now converses in the configured
  `notificationLanguage` (falls back to UI locale).
- **Task report "Verification Accuracy"** was aliased to the *performance*
  endpoint (wrong report). Repointed to the real `/customer/task-reports/verification`.
- **Customer-Island drift.** `islandService` now calls `/customer/store-intelligence/*`
  first and falls back to the legacy `/customer/island/*` on 404.

### Registry completeness (added constants)
- Auth: public `face-login`, `face/register`, `password/request-reset`, `password/reset`.
- Cameras: `stream`. Services: `new`. Notifications: `read-all` alias.
- Subscriptions: `cancel`, `callback`, `webhook`.
- My Tasks: `detail`, `photo`. Report Center: `schedule/delete`, `generated/delete`, visitor-count.
- Branch Intelligence: `export-report`. Chat Settings: top-level `test-whatsapp` alias.
- Task Analytics: `escalation-rate`, `verification-stats`, `review-verification`, `reopen`, `branches`.
- Task Reports: real `verification`, `types`, and `download/*` variants.
- Foodics: `branches(+customers-served)`, `health`, `conversion/{daily,hourly,summary}`,
  `dashboard/{insights,overview,trends}`, `orders/{by-foodics-id,summary}`,
  `drawer-audits/{patterns,stats}`, `prep-times(+heatmap,stats,summary)`,
  `refund-verifications(+stats)`, `inventory/audit`.
- Admin: `profile`, `dashboard-stats`, `impersonate`, `stop-impersonation`,
  detections CRUD, roles CRUD + permissions.
- New blocks: `broadcasting`, `storeIntelligence`, `webhooks`, `orchestrator`.

## Notes for backend confirmation
- Foodics naming (`conversion/*` vs `footfall`, `dashboard/*` vs consolidated
  `dashboard`, `prep-times` vs `prep-time`, `refund-verifications` vs `refunds`):
  both naming sets now exist as constants; services use the consolidated paths
  with the granular ones available. Confirm which the live backend serves.
- `island` vs `store-intelligence`: the service handles either via fallback.
- Server-to-server endpoints (`broadcasting/auth`, `subscriptions/webhook`,
  `webhooks/*`, `orchestrator/*`) are registry-level; they are not user-facing pages.
