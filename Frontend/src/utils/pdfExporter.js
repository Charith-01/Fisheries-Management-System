// Frontend/src/utils/pdfExporter.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** ---- Business header constants (shared by all reports) ---- */
const BRAND = {
  name: "Dhanushka Fisheries",
  owner: "Mr. Nipun Thanushka",
  address: "Matara Road, Magalle, Galle",
  phone: "0768660219",
  logoPath: "/logo-dashboard.png",
  timezone: "Asia/Colombo",
};

let _logoDataUrl = null;
async function loadLogoDataURL(path = BRAND.logoPath) {
  if (_logoDataUrl) return _logoDataUrl;
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    _logoDataUrl = dataUrl;
    return dataUrl;
  } catch {
    _logoDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
    return _logoDataUrl;
  }
}

export async function exportTablePDF({
  title = "Report",
  meta = {},
  columns = [],
  rows = [],
  orientation = "landscape",
  format = "a4",
  filename,
}) {
  const doc = new jsPDF({ orientation, unit: "pt", format });
  const pageSize = doc.internal.pageSize;
  const pageWidth = pageSize.getWidth();
  const pageHeight = pageSize.getHeight();

  // base margins
  const margin = { left: 32, right: 32, top: 36, bottom: 32 };
  const headerBandH = 96; // custom header height
  const gapBelowHeader = 12; // small gap between header divider and content

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;

  const logo = await loadLogoDataURL(BRAND.logoPath);

  // Build table head/body
  const head = [columns.map((c) => c.header || "")];
  const body = rows.map((r) =>
    columns.map((c) => {
      try {
        const v = typeof c.get === "function" ? c.get(r) : r[c.accessor];
        return v == null ? "-" : String(v);
      } catch {
        return "-";
      }
    })
  );

  const columnStyles = {};
  columns.forEach((c, i) => {
    const st = {};
    if (c.align) st.halign = c.align;
    if (c.width) st.cellWidth = c.width;
    columnStyles[i] = st;
  });

  // Filter out the 3 unwanted meta keys
  const OMIT_META_KEYS = new Set(["Order Status", "Payment Status", "Search"]);
  const metaEntries = Object.entries(meta).filter(([k, v]) => {
    if (v === undefined || v === null || v === "") return false;
    return !OMIT_META_KEYS.has(String(k));
  });
  const hasMeta = metaEntries.length > 0;

  // Reserve header space for ALL pages in margin.top
  const topForAllPages = margin.top + headerBandH + gapBelowHeader;

  // Rough meta height for first page (single or wrapped line)
  // (We keep it generous to avoid collisions if it wraps)
  const metaExtraOnFirstPage = hasMeta ? 24 : 0;

  const drawHeaderFooter = (data) => {
    const yTop = margin.top;

    // Logo
    const logoW = 120;
    const logoH = 36;
    doc.addImage(logo, "PNG", margin.left, yTop, logoW, logoH);

    // Org info
    const infoX = margin.left + logoW + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor("#0f172a");
    doc.text(BRAND.name, infoX, yTop + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#334155");
    doc.text(`Owner: ${BRAND.owner}`, infoX, yTop + 28);
    doc.text(BRAND.address, infoX, yTop + 42);
    doc.text(`Phone: ${BRAND.phone}`, infoX, yTop + 56);

    // Title (center)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor("#0f172a");
    doc.text(title, pageWidth / 2, yTop + 38, { align: "center" });

    // Timestamp / TZ (right)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#475569");
    doc.text(`Generated: ${ts}`, pageWidth - margin.right, yTop + 16, { align: "right" });
    doc.text(`Timezone: ${BRAND.timezone}`, pageWidth - margin.right, yTop + 30, { align: "right" });

    // Divider
    doc.setDrawColor("#94a3b8");
    doc.setLineWidth(0.6);
    doc.line(
      margin.left,
      yTop + headerBandH - 10,
      pageWidth - margin.right,
      yTop + headerBandH - 10
    );

    // Meta (only on page 1), below divider
    if (data.pageNumber === 1 && hasMeta) {
      let x = margin.left;
      let y = yTop + headerBandH + 8;

      metaEntries.forEach(([label, value], idx) => {
        // Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor("#0f172a");
        const labelText = `${label}: `;
        doc.text(labelText, x, y);
        const labelW = doc.getTextWidth(labelText);

        // Value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor("#0f172a");
        const valueText = String(value);
        doc.text(valueText, x + labelW, y);
        const valueW = doc.getTextWidth(valueText);

        x += labelW + valueW;

        if (idx < metaEntries.length - 1) {
          const sep = "   |   ";
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor("#475569");
          doc.text(sep, x, y);
          x += doc.getTextWidth(sep);
        }

        if (x > pageWidth - margin.right - 40) {
          x = margin.left;
          y += 16;
        }
      });
    }

    // Footer
    const pageStr = `Page ${data.pageNumber}`;
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text(`${BRAND.name} • Admin Reports`, margin.left, pageHeight - margin.bottom + 14);
    doc.text(pageStr, pageWidth - margin.right, pageHeight - margin.bottom + 14, { align: "right" });
  };

  autoTable(doc, {
    head,
    body,
    // Reserve header space on ALL pages:
    margin: { left: margin.left, right: margin.right, top: topForAllPages, bottom: margin.bottom },
    // Push first page down a bit more for the meta line:
    startY: topForAllPages + metaExtraOnFirstPage,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      overflow: "linebreak",
      lineColor: "#e2e8f0",
      lineWidth: 0.25,
      valign: "middle",
      textColor: "#0f172a",
    },
    headStyles: {
      fillColor: "#e2e8f0",
      textColor: "#0f172a",
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: "#f8fafc" },
    columnStyles,
    didDrawPage: drawHeaderFooter,
  });

  const safeTitle = title.toLowerCase().replace(/\s+/g, "-");
  const file = filename || `${safeTitle}_${ts.replace(/[: ]/g, "-")}.pdf`;
  doc.save(file);
}
