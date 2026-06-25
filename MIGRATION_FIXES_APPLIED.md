# Migration Fixes Applied

Five regressions in the new Next.js codebase were diagnosed against the old
React/TypeScript project and the Postman API contract, then fixed. Originals of
every edited file are preserved under `.migration_backups/`.

## 1. PDF & Excel export (Productivity Analytics)
- The Excel button POSTed to `/api/customer/productivity/export-excel`, which
  does not exist on the backend (only task-reports has an export endpoint,
  confirmed in the Postman collection). It also sent `date_from`/`date_to`,
  which the backend ignores.
- Fix: Excel is now generated entirely on the client from the already-loaded
  leaderboard data — no backend dependency, no new npm package. New helper
  `src/lib/excelExport.ts` builds an Excel-openable workbook (RTL-aware).
- PDF export was already client-side (jsPDF/html2canvas) and left as-is.
- Files: `src/views/ProductivityView.tsx`, `src/lib/excelExport.ts` (new).

## 2. Add New Employee form not matching old design
- Certificate fields were misplaced under "Identification" and used the wrong
  API field names (`certificate_number`/`certificate_end_date`), so the backend
  dropped them. "Issuing Authority" and "Issue Date" were missing entirely.
- Fix: added a dedicated collapsible **Health Certificate** section (after
  Status & Permissions, before Working Hours) with Certificate Number, Issuing
  Authority, Issue Date, End Date and Image — mirroring the old AddUserDrawer.
  The service now submits the correct `health_cert_*` fields (verified against
  Postman: `Customer/Employees/Create`) and the read-mapping pre-fills them in
  edit mode. `name_ar` is now also submitted and pre-filled.
- Files: `src/views/organization/EmployeesView.tsx`,
  `src/services/organizationService.ts`.

## 3. Dashboard — Branch Comparison data binding
- `getBranches` read non-existent fields (`detections`, `cameras_online`,
  `grade`) off each branch. The real payload only has
  `branches: [{ id, name, cameras_count }]`.
- Fix: per-branch detections are derived from `recent_detections` (matched by
  branch name), camera-online counts from `/customer/realtime/pulse`, and the
  A–F grade from camera health — exactly as the old DashboardPage did.
- File: `src/services/dashboardService.ts`.

## 4. Dashboard — AI Detection Breakdown data binding
- `getDetectionBreakdown` read a non-existent `detections_breakdown` field, so
  the card always showed "No detections today".
- Fix: reads `detections.by_service`, falling back to grouping
  `recent_detections` by type, computing percentages and the old color palette.
- File: `src/services/dashboardService.ts`.

## 5. Admin Panel — Category Types data binding
- The old store returned raw category objects (`[key: string]: any`), so every
  structural/type property reached the UI. The new `mapCategory` normalized to a
  narrow 6-field shape and silently dropped all other properties.
- Fix: `mapCategory` now spreads the raw object (passthrough) before layering
  normalized aliases, and `AdminCategory` carries a `type?` field plus an index
  signature — restoring parity with the old behavior.
- File: `src/services/adminService.ts`.

---

# Round 2 — Admin Clients & Users CRUD

## 6. Create Client — "The package id field is required"
- `/admin/clients/create` requires `package_id`, which the form never collected
  or sent.
- Fix: added a required **Package** select (`/admin/packages`) to the client
  dialog, added `package_id` to `AdminClientInput`, and validate it on create.
- Files: `src/views/admin/AdminClientsView.tsx`, `src/services/adminService.ts`.

## 7. Delete Client — "route api/admin/clients/63 could not be found"
- `clientDelete` built a REST path `/admin/clients/{id}` that the backend does
  not expose.
- Fix: `clientDelete` is now `/admin/clients/delete` and `deleteAdminClient`
  POSTs `{ id }` — matching every other admin entity.
- Files: `src/lib/endpoints.ts`, `src/services/adminService.ts`.

## 8. Update Client — "PUT method is not supported … Supported methods: POST"
- `updateAdminClient` used `api.put`.
- Fix: now POSTs to `/admin/clients/update` with `{ id, ...input }`.
- File: `src/services/adminService.ts`.

## 9. Create User — "The role id field is required"
- `/admin/users/create` requires `role_id`, which the form never collected.
- Fix: added a required **Role** select (`/admin/roles`) to the user dialog,
  added `role_id` to `AdminUserInput`, mapped `role_id`/`role_name` on read for
  edit pre-fill, and validate it on save.
- Files: `src/views/admin/AdminUsersView.tsx`, `src/services/adminService.ts`.

> Note: admin **Countries** and **Cities** intentionally use REST `PUT`/`DELETE`
> (the backend supports those per Postman), so they were left unchanged. Clients
> are the POST-based outlier — that mismatch is what caused bugs 7 and 8.

---

# Round 3 — ROI Configuration (Cameras)

## 10. ROI Configuration missing from the Add/Edit Camera form
- The old project let users draw detection **lines** and **polygon zones** on a
  per-camera canvas (`@core/components/DrawingCanvas`, MUI + Redux) and saved
  them as `services[].points`. The new Add Camera dialog had no ROI editor.
- Fix: reimplemented the drawing canvas for this stack as a self-contained
  component — `src/components/DrawingCanvas.tsx` (Tailwind/shadcn, local state,
  no Redux). It preserves the original behaviour exactly: Select / Line /
  Polygon tools, Undo, Clear All, Delete Selected (and the Delete/Backspace
  key), plus a "Stored Shapes" panel listing each shape's coordinates. A shape
  is `{ id, points[] }` — 2 points = line, 3+ = area.
- Integrated into the camera Add/Edit dialog as an **ROI Configuration**
  section. Existing ROI loads from `camera.services[].points` on edit and is
  saved back as `services[].points` (the same contract the old CameraForm used;
  `buildCameraFormData` serializes them as `services[i][points][j][x/y]`).
- `CameraServiceConfig.service_id` is now optional and the form-data builder
  only sends it when present, so plain ROI shapes (no service assignment)
  serialize as just their points.
- Files: `src/components/DrawingCanvas.tsx` (new), `src/views/CamerasView.tsx`,
  `src/services/camerasService.ts`.
