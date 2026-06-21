/**
 * PDF export utilities.
 *
 * Why a library instead of `window.print()`:
 * the previous flow serialized the live DOM through the browser print engine.
 * That dragged the active dark theme and the responsive "stacked card" table
 * transform into the PDF, producing washed-out text, missing borders and broken
 * column alignment. The Br Intelligence flow additionally mutated `direction`
 * and `flexDirection` on every node behind a `setTimeout`, which was fragile and
 * left the page stuck in RTL when a print dialog was cancelled.
 *
 * Instead we rasterize the already-rendered DOM with html2canvas and lay the
 * image into an A4 page with jsPDF. The browser has already shaped Arabic glyphs
 * and resolved RTL/LTR, so capturing the rendered pixels gives correct output in
 * both languages with no font embedding or bidi reshaping required.
 *
 * The libraries are loaded dynamically so they never enter the initial bundle;
 * they are only fetched the first time a user actually exports.
 */

export type PdfDirection = "ltr" | "rtl";

export interface ExportElementOptions {
  /** Download filename. ".pdf" is appended if missing. */
  filename: string;
  /** Reading direction of the captured content. Drives header alignment. */
  dir?: PdfDirection;
  /** Optional document title printed at the top of the first page. */
  title?: string;
  /** Optional subtitle (e.g. a date range) printed under the title. */
  subtitle?: string;
  /**
   * Capture scale. Higher = sharper but heavier. 2 is a good default for
   * on-screen DPI; tables stay crisp at 100% zoom in a PDF viewer.
   */
  scale?: number;
}

// A4 in millimetres (portrait).
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 12;

/**
 * Marker class applied to <html> for the duration of a capture. The matching
 * CSS in globals.css forces the light palette and real table layout so the
 * snapshot is clean regardless of the on-screen theme or viewport width.
 */
const CAPTURE_CLASS = "pdf-capture";

/**
 * Render a DOM element into a paginated A4 PDF and trigger a download.
 *
 * The element is captured at its full scroll height and sliced across as many
 * pages as needed. Content is never scaled down to "fit" — it keeps its natural
 * proportions so text stays legible and tables stay aligned.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportElementOptions
): Promise<void> {
  const { filename, dir = "ltr", title, subtitle, scale = 2 } = options;

  // Dynamic import keeps these heavy deps out of the main bundle.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const html = document.documentElement;
  html.classList.add(CAPTURE_CLASS);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      // Force an opaque white backing so transparent cards don't render as
      // black on some browsers' canvas implementations.
      backgroundColor: "#ffffff",
      logging: false,
      // Capture the full element even if part of it is scrolled out of view.
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
  } finally {
    html.classList.remove(CAPTURE_CLASS);
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // RTL documents read right-aligned; jsPDF supports per-call alignment.
  pdf.setLanguage(dir === "rtl" ? "ar" : "en-US");

  const contentWidthMm = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;

  // Header band on page one.
  let headerHeightMm = 0;
  if (title) {
    const align = dir === "rtl" ? "right" : "left";
    const x = dir === "rtl" ? A4_WIDTH_MM - PAGE_MARGIN_MM : PAGE_MARGIN_MM;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(title, x, PAGE_MARGIN_MM + 4, { align });
    headerHeightMm = 10;
    if (subtitle) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(subtitle, x, PAGE_MARGIN_MM + 10, { align });
      headerHeightMm = 16;
    }
    // Hairline rule under the header.
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.2);
    pdf.line(
      PAGE_MARGIN_MM,
      PAGE_MARGIN_MM + headerHeightMm,
      A4_WIDTH_MM - PAGE_MARGIN_MM,
      PAGE_MARGIN_MM + headerHeightMm
    );
    headerHeightMm += 4;
  }

  // How many source pixels map to one millimetre once the bitmap is scaled to
  // the printable content width.
  const pxPerMm = canvas.width / contentWidthMm;

  // Usable vertical space per page in millimetres (first page is shorter
  // because the header band eats into it), converted to source pixels.
  const firstPageBodyMm = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2 - headerHeightMm;
  const fullPageBodyMm = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;

  // Slice the tall source canvas into page-height strips and place each strip
  // as its own image. Slicing the bitmap (rather than masking a shared image)
  // guarantees no content bleeds between pages.
  let sourceY = 0;
  let pageIndex = 0;
  while (sourceY < canvas.height) {
    const isFirst = pageIndex === 0;
    const topOffsetMm = isFirst ? PAGE_MARGIN_MM + headerHeightMm : PAGE_MARGIN_MM;
    const bodyMm = isFirst ? firstPageBodyMm : fullPageBodyMm;
    const sliceHeightPx = Math.min(
      Math.floor(bodyMm * pxPerMm),
      canvas.height - sourceY
    );
    // Defensive: a degenerate canvas could floor to a zero-height slice and
    // spin the loop forever. Bail out rather than hang the tab.
    if (sliceHeightPx <= 0) break;

    // Copy this strip into a scratch canvas.
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeightPx;
    const ctx = slice.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );
    }

    if (!isFirst) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/png"),
      "PNG",
      PAGE_MARGIN_MM,
      topOffsetMm,
      contentWidthMm,
      sliceHeightPx / pxPerMm,
      undefined,
      "FAST"
    );

    sourceY += sliceHeightPx;
    pageIndex += 1;
  }

  const safeName = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;
  pdf.save(safeName);
}

/**
 * Render an off-screen container, capture it, then remove it. Used when we want
 * a purpose-built print layout rather than a snapshot of the on-screen view.
 *
 * The builder receives a detached host element to populate. The host is mounted
 * off-screen (not display:none — html2canvas needs real layout) so it lays out
 * at a fixed A4-ish width before capture.
 */
export async function exportRenderedToPdf(
  build: (host: HTMLElement) => void | Promise<void>,
  options: ExportElementOptions
): Promise<void> {
  const host = document.createElement("div");
  // Off-screen but laid out: fixed width matching the printable content area at
  // ~96dpi (A4 content width ≈ 186mm ≈ 703px). Positioned far off-canvas.
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "-10000px";
  host.style.width = "794px"; // full A4 width in px @96dpi; margins handled by PDF
  host.style.background = "#ffffff";
  host.style.zIndex = "-1";
  host.setAttribute("dir", options.dir ?? "ltr");
  document.body.appendChild(host);

  try {
    await build(host);
    // Give the browser a frame to lay out fonts/SVGs before capture.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await exportElementToPdf(host, options);
  } finally {
    document.body.removeChild(host);
  }
}
