import { apiFetch, API_BASE_URL, getAuthToken } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type ReportFormat = "pdf" | "excel" | "csv";

export interface ReportTemplate {
  id: string;
  title: string;
  description?: string;
  formats?: ReportFormat[];
  icon?: string;
}

export interface GeneratedReport {
  id: string | number;
  title: string;
  template: string;
  format: ReportFormat;
  status: "completed" | "pending" | "failed" | "ready" | string;
  generated_at?: string;
  created_at?: string;
  download_url?: string;
  file_url?: string;
}

export interface ScheduledReport {
  id: string | number;
  template: string;
  format: ReportFormat;
  frequency: "daily" | "weekly" | "monthly" | string;
  recipients: string[];
  next_run?: string;
  next_send?: string;
  active?: boolean;
}

export interface GenerateReportPayload {
  template: string;
  format: ReportFormat;
  date_from: string;
  date_to: string;
  lang?: string;
  branch_id?: string | null;
  service_id?: string | null;
}

export interface ScheduleReportPayload {
  template: string;
  format: ReportFormat;
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
}

// Maps card IDs → API template slugs (confirmed from network tab)
const TEMPLATE_MAP: Record<string, string> = {
  "daily-compliance": "daily_compliance",
  "weekly-summary": "weekly_summary",
  "monthly-audit": "monthly_audit",
  "detection-detail": "detection_detail",
  attendance: "attendance_report",
  "visitor-traffic": "visitor_report",
  productivity: "productivity_report",
  "service-performance": "service_performance",
};

export function toTemplateSlug(cardId: string): string {
  return TEMPLATE_MAP[cardId] ?? cardId.replace(/-/g, "_");
}

const FALLBACK_TEMPLATES: ReportTemplate[] = [
  {
    id: "daily-compliance",
    title: "Daily Compliance Report",
    description: "All violations today grouped by type with images",
    formats: ["pdf"],
  },
  {
    id: "weekly-summary",
    title: "Weekly Summary Report",
    description: "7-day trend analysis with violation breakdown",
    formats: ["pdf", "excel"],
  },
  {
    id: "monthly-audit",
    title: "Monthly Audit Report",
    description: "Complete 30-day analytics with compliance scores",
    formats: ["pdf", "excel"],
  },
  {
    id: "detection-detail",
    title: "Detection Detail Report",
    description: "Detailed report for specific detection types",
    formats: ["pdf", "excel"],
  },
  {
    id: "attendance",
    title: "Attendance Report",
    description: "Employee check-in/out records and working hours",
    formats: ["excel", "csv"],
  },
  {
    id: "visitor-traffic",
    title: "Visitor Traffic Report",
    description: "In/out counts, peak hours, daily totals",
    formats: ["pdf", "excel"],
  },
  {
    id: "productivity",
    title: "Productivity Report",
    description: "Employee productivity scores, attendance rates, rankings",
    formats: ["pdf", "excel"],
  },
  {
    id: "service-performance",
    title: "Service Performance Report",
    description: "Per-service KPIs, compliance scores, detailed analytics",
    formats: ["pdf", "excel"],
  },
];

function unwrap<T>(res: unknown, fallback: T): T {
  if (!res) return fallback;
  if (Array.isArray(res)) return res as T;
  const obj = res as Record<string, unknown>;
  if (obj.data !== undefined) {
    const inner = obj.data;
    if (Array.isArray(inner)) return inner as T;
    if (inner && typeof inner === "object") {
      const nested = (inner as Record<string, unknown>).data;
      if (Array.isArray(nested)) return nested as T;
    }
    return inner as T;
  }
  if (obj.items !== undefined) return obj.items as T;
  return res as T;
}

/** Always returns a plain array — never throws, never returns non-array */
function unwrapArray<T>(res: unknown): T[] {
  try {
    const result = unwrap<T[]>(res, []);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * API response shape:
 * { id: "daily_compliance", name_en: "...", name_ar: "...",
 *   description_en: "...", description_ar: "...",
 *   formats: ["pdf", "excel"], icon: "shield-check" }
 *
 * The card ICONS registry and TEMPLATE_MAP use dash-separated IDs (e.g. "daily-compliance"),
 * while the API uses underscore IDs (e.g. "daily_compliance").
 * We normalise here so the rest of the UI stays unchanged.
 */
export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  try {
    const res = await apiFetch<unknown>(endpoints.reportCenter.templates);
    const raw = unwrapArray<Record<string, unknown>>(res);

    if (!raw.length) return FALLBACK_TEMPLATES;

    // Detect current locale from i18next (stored in localStorage as app.language)
    const lang =
      (typeof window !== "undefined" && localStorage.getItem("app.language")) ||
      "en";
    const isAr = lang === "ar";

    const normalized: ReportTemplate[] = raw.map((item) => {
      // Convert underscore id → dash id to match ICONS registry & TEMPLATE_MAP
      const dashId = String(item.id ?? "")
        .toLowerCase()
        .replace(/_/g, "-");

      // Find matching fallback as safety net
      const fallback = FALLBACK_TEMPLATES.find((f) => f.id === dashId);

      // Pick localised title — name_en / name_ar are the real API fields
      const title =
        String(
          (isAr ? item.name_ar : item.name_en) ??
            item.name_en ??
            item.title ??
            item.name ??
            ""
        ).trim() ||
        (fallback?.title ?? dashId);

      // Pick localised description
      const description =
        String(
          (isAr ? item.description_ar : item.description_en) ??
            item.description_en ??
            item.description ??
            ""
        ).trim() ||
        (fallback?.description ?? "");

      const formats = (
        Array.isArray(item.formats) && item.formats.length
          ? item.formats
          : (fallback?.formats ?? ["pdf"])
      ) as ReportFormat[];

      return {
        id: dashId,
        title,
        description,
        formats,
        icon: item.icon as string | undefined,
      };
    });

    return normalized;
  } catch {
    return FALLBACK_TEMPLATES;
  }
}

export const fetchReportTypes = fetchReportTemplates;

export async function fetchBranches(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    const res = await apiFetch<unknown>(endpoints.organization.branches, {
      query: { all: 1 },
    });
    const list = unwrapArray<Record<string, unknown>>(res);
    return list.map((b) => ({
      id: String(b.id ?? b.uuid ?? ""),
      name: String(b.name ?? b.name_en ?? b.name_ar ?? "—"),
    }));
  } catch {
    return [];
  }
}

export async function fetchServices(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    const res = await apiFetch<unknown>(endpoints.services.list, {
      query: { all: 1 },
    });
    const list = unwrapArray<Record<string, unknown>>(res);
    return list.map((s) => ({
      id: String(s.id ?? ""),
      name: String(s.name ?? s.title ?? s.name_en ?? "—"),
    }));
  } catch {
    return [];
  }
}

/**
 * GET /customer/reports/generated
 * Returns list of previously generated reports with download_url.
 */
export async function fetchGeneratedReports(): Promise<GeneratedReport[]> {
  try {
    const res = await apiFetch<unknown>(endpoints.reportCenter.generated);
    return unwrapArray<GeneratedReport>(res);
  } catch {
    return [];
  }
}

export const fetchReportHistory = fetchGeneratedReports;

/** GET /customer/reports/scheduled */
export async function fetchScheduledReports(): Promise<ScheduledReport[]> {
  try {
    const res = await apiFetch<unknown>(endpoints.reportCenter.scheduled);
    return unwrapArray<ScheduledReport>(res);
  } catch {
    return [];
  }
}

/**
 * POST /customer/reports/generate
 *
 * Response shape (confirmed from DevTools Preview):
 *   { status: true, message: "report_generated", data: GeneratedReport }
 *
 * After a successful generate we auto-download the file so the user doesn't have
 * to open the History tab — exactly like the OLD project, which called the
 * authenticated blob endpoint right after generate.
 */
export async function generateReport(
  payload: GenerateReportPayload
): Promise<GeneratedReport> {
  const token = getAuthToken();

  const body: Record<string, unknown> = {
    template: payload.template,
    format: payload.format,
    date_from: payload.date_from,
    date_to: payload.date_to,
    lang: payload.lang ?? "en",
  };
  if (payload.branch_id) body.branch_id = payload.branch_id;
  if (payload.service_id) body.service_id = payload.service_id;

  const res = await fetch(`${API_BASE_URL}${endpoints.reportCenter.generate}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Failed to generate report (${res.status})`);

  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data: GeneratedReport;
  };

  const report = json.data;

  // Auto-download the freshly generated report. We download by id through the
  // authenticated proxy endpoint (downloadReport) rather than anchoring to the
  // raw `download_url`: that URL points straight at the backend with no Bearer
  // token, which made Laravel redirect to the (undefined) `login` route and
  // throw a 500. Going through downloadReport keeps the request authenticated.
  if (report?.id != null) {
    try {
      await downloadReport(report.id, {
        template: payload.template,
        format: payload.format,
      });
    } catch {
      // Non-fatal: the report was generated and is available in History even if
      // the immediate download didn't start. The caller still gets `report`.
    }
  }

  return report;
}

/**
 * Download a report by its download_url or via the download endpoint.
 */
export function triggerDownload(url: string, filename?: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? "report";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Download a generated report by id.
 *
 * Mirrors the OLD project exactly: an *authenticated* GET to
 * `/customer/reports/download?id={id}` requested as a blob, then anchored to an
 * object URL.
 *
 * Why this matters (the bug): the previous version first hit a RESTful route
 * `/customer/reports/{id}/download` that does NOT exist on the backend, and the
 * generate flow anchored straight to the absolute backend `download_url`
 * (`https://api.dev.rgeeb.com/api/customer/reports/download?id=80`). A plain
 * anchor navigation carries NO Authorization header, so Laravel's auth
 * middleware tried to redirect to the `login` route — which isn't defined for
 * the API — producing the "Route [login] not defined" 500 seen in the browser.
 *
 * Fetching the bytes through the same-origin `/api` proxy WITH the Bearer token
 * keeps the request authenticated, so the backend streams the file instead of
 * redirecting. The blob is then saved client-side.
 */
export async function downloadReport(
  id: string | number,
  meta?: { template?: string; format?: ReportFormat | string }
): Promise<void> {
  const token = getAuthToken();
  // Single real route (confirmed in the Postman collection): there is no
  // `/customer/reports/{id}/download`. Hitting that nonexistent route was what
  // triggered the login-redirect 500.
  const res = await fetch(
    `${API_BASE_URL}${endpoints.reportCenter.downloadLegacy}?id=${encodeURIComponent(
      String(id)
    )}`,
    {
      headers: {
        Accept: "application/octet-stream, application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const ct = res.headers.get("content-type") ?? "";
  // Some backends answer with a JSON envelope carrying a signed URL instead of
  // the file bytes. Honour that; otherwise treat the body as the file.
  if (ct.includes("application/json")) {
    const json = (await res.json()) as {
      data?: { download_url?: string };
      download_url?: string;
    };
    const url = json.data?.download_url ?? json.download_url;
    if (url) {
      triggerDownload(url, buildReportFilename(id, meta));
      return;
    }
    return;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  triggerDownload(objectUrl, buildReportFilename(id, meta));
  // Revoke on the next tick, after the click has been dispatched.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

/**
 * Build a download filename matching the OLD project's convention:
 *   `${template}_${format}.${ext}`  (ext = xlsx for excel, csv for csv, else pdf)
 * Falls back to `report-{id}` when no template metadata is available.
 */
function buildReportFilename(
  id: string | number,
  meta?: { template?: string; format?: ReportFormat | string }
): string {
  if (!meta?.template) return `report-${id}`;
  const fmt = meta.format || "report";
  const ext = fmt === "excel" ? "xlsx" : fmt === "csv" ? "csv" : "pdf";
  return `${meta.template}_${fmt}.${ext}`;
}

/**
 * Delete a generated report.
 * Tries the RESTful route first, then falls back to the legacy
 * production route used by the OLD system:
 *   POST /customer/reports/generated/delete { id }
 */
export async function deleteGeneratedReport(
  id: string | number
): Promise<void> {
  try {
    await apiFetch(endpoints.reportCenter.generatedById(String(id)), {
      method: "DELETE",
    });
  } catch {
    await apiFetch("/customer/reports/generated/delete", {
      method: "POST",
      body: { id },
    });
  }
}

/** POST /customer/reports/schedule */
export async function scheduleReport(
  payload: ScheduleReportPayload
): Promise<ScheduledReport | null> {
  try {
    return await apiFetch<ScheduledReport>(endpoints.reportCenter.schedule, {
      method: "POST",
      body: payload,
    });
  } catch {
    return null;
  }
}

/**
 * Delete a scheduled report.
 * Tries the RESTful route first, then falls back to the legacy
 * production route used by the OLD system:
 *   POST /customer/reports/schedule/delete { id }
 */
export async function deleteScheduledReport(
  id: string | number
): Promise<void> {
  try {
    await apiFetch(endpoints.reportCenter.scheduledById(String(id)), {
      method: "DELETE",
    });
  } catch {
    await apiFetch("/customer/reports/schedule/delete", {
      method: "POST",
      body: { id },
    });
  }
}
