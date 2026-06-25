/**
 * Dependency-free, client-side Excel export.
 *
 * The rgeeb backend exposes a spreadsheet export only for task-reports
 * (`/customer/task-reports/export-excel`). There is NO productivity export
 * endpoint (verified against the Postman collection), so the Productivity
 * "Excel" button used to POST to a route that 404s. Instead of depending on a
 * non-existent endpoint — or pulling in a heavy SheetJS dependency — we build
 * an Excel-openable workbook on the client from data already loaded in the
 * view. This mirrors how the PDF export is generated entirely client-side.
 *
 * The output is an HTML-table workbook with the `application/vnd.ms-excel`
 * MIME type and an `.xls` extension. Excel, LibreOffice and Google Sheets all
 * open it as a real, multi-column spreadsheet. A UTF-8 BOM is prepended so
 * Arabic content renders correctly, and `dir` flips the sheet for RTL locales.
 */

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ExcelExportOptions {
  /** Download filename WITHOUT extension (".xls" is appended). */
  filename: string;
  /** Worksheet tab name. */
  sheetName?: string;
  /** Column header labels. */
  headers: string[];
  /** Row data; each row is an array of cell values aligned to `headers`. */
  rows: Array<Array<string | number>>;
  /** Text direction for the sheet ("rtl" for Arabic). */
  dir?: "ltr" | "rtl";
}

export function exportRowsToExcel({
  filename,
  sheetName = "Sheet1",
  headers,
  rows,
  dir = "ltr",
}: ExcelExportOptions): void {
  const headHtml = headers
    .map(
      (h) =>
        `<th style="background:#1e293b;color:#fff;font-weight:700;text-align:${
          dir === "rtl" ? "right" : "left"
        };padding:6px 10px;border:1px solid #cbd5e1;">${escapeHtml(h)}</th>`
    )
    .join("");

  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => {
            const numeric = typeof cell === "number";
            return `<td style="padding:6px 10px;border:1px solid #e2e8f0;${
              numeric ? "mso-number-format:'0.##';" : ""
            }">${escapeHtml(cell)}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
    'xmlns="http://www.w3.org/TR/REC-html40"><head>' +
    '<meta charset="utf-8" />' +
    "<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>" +
    `<x:ExcelWorksheet><x:Name>${escapeHtml(
      sheetName
    )}</x:Name><x:WorksheetOptions><x:DisplayGridlines/>` +
    "</x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets>" +
    "</x:ExcelWorkbook></xml><![endif]--></head>" +
    `<body dir="${dir}"><table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">` +
    `<thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;

  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
