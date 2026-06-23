import { API_BASE_URL, getAuthToken } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type TaskReportType =
  | "performance"
  | "sla-compliance"
  | "verification-accuracy"
  | "export-csv";

export interface ReportDateRange {
  dateFrom: string;
  dateTo: string;
}

const PATHS: Record<TaskReportType, { path: string; ext: "pdf" | "csv" }> = {
  performance: { path: endpoints.taskReports.downloadPerformance, ext: "pdf" },
  "sla-compliance": { path: endpoints.taskReports.downloadSla, ext: "pdf" },
  "verification-accuracy": {
    path: endpoints.taskReports.downloadVerification,
    ext: "pdf",
  },
  "export-csv": { path: endpoints.taskReports.downloadExportExcel, ext: "csv" },
};

export async function downloadTaskReport(
  type: TaskReportType,
  range: ReportDateRange
): Promise<void> {
  const cfg = PATHS[type];

  // Backend contract (Postman: /customer/task-reports/*) expects `from` / `to`.
  // Sending `date_from` / `date_to` made the backend ignore the range.
  const params = new URLSearchParams({
    from: range.dateFrom,
    to: range.dateTo,
    format: cfg.ext,
  });

  // Pass the relative URL STRING straight to fetch() — fetch resolves it
  // against the document origin. Wrapping it in `new URL()` first throws
  // "Failed to construct 'URL': Invalid URL", because on the client
  // API_BASE_URL is the relative proxy path "/api" and `new URL()` needs an
  // absolute base. This matches the pattern used by the other working
  // downloads in this app (Branch Intelligence, Report Center, Productivity).
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${cfg.path}?${params}`, {
    headers: {
      Accept: cfg.ext === "pdf" ? "application/pdf" : "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download report (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = `${range.dateFrom}_to_${range.dateTo}`;
  a.href = objectUrl;
  a.download = `task-${type}-${stamp}.${cfg.ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
