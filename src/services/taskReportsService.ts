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
  performance: { path: endpoints.taskReports.performance, ext: "pdf" },
  "sla-compliance": { path: endpoints.taskReports.slaCompliance, ext: "pdf" },
  "verification-accuracy": {
    path: endpoints.taskReports.verificationAccuracy,
    ext: "pdf",
  },
  "export-csv": { path: endpoints.taskReports.exportCsv, ext: "csv" },
};

export async function downloadTaskReport(
  type: TaskReportType,
  range: ReportDateRange
): Promise<void> {
  const cfg = PATHS[type];
  const url = new URL(`${API_BASE_URL}${cfg.path}`);
  // Backend contract (Postman: /customer/task-reports/*) expects `from` / `to`.
  // Sending `date_from` / `date_to` made the backend ignore the range.
  url.searchParams.set("from", range.dateFrom);
  url.searchParams.set("to", range.dateTo);
  url.searchParams.set("format", cfg.ext);

  const token = getAuthToken();
  const res = await fetch(url.toString(), {
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
