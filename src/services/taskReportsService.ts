import { API_BASE_URL, getAuthToken } from "@/lib/api";

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
  performance: { path: "/customer/task-reports/performance", ext: "pdf" },
  "sla-compliance": { path: "/customer/task-reports/sla-compliance", ext: "pdf" },
  "verification-accuracy": { path: "/customer/task-reports/verification-accuracy", ext: "pdf" },
  "export-csv": { path: "/customer/task-reports/export", ext: "csv" },
};

export async function downloadTaskReport(
  type: TaskReportType,
  range: ReportDateRange,
): Promise<void> {
  const cfg = PATHS[type];
  const url = new URL(`${API_BASE_URL}${cfg.path}`);
  url.searchParams.set("date_from", range.dateFrom);
  url.searchParams.set("date_to", range.dateTo);
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
