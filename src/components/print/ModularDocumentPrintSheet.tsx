import type { ReactNode } from "react";
import { BarcodeVisual } from "@/components/ui/BarcodeVisual";
import { resolveLogoAssetUrl } from "@/features/document-templates/api";
import type {
  DocumentSectionKey,
  DocumentTemplate,
  LogoSize,
  PaperSize,
} from "@/features/document-templates/types";

export interface ModularPrintMetadataItem {
  label: string;
  value: ReactNode;
}

export interface ModularPrintRow {
  id: string | number;
  cells: Record<string, ReactNode>;
}

export interface ModularDocumentPrintSheetProps {
  template: DocumentTemplate;
  ariaLabel: string;
  documentNumberLabel: string;
  documentBarcodeValue: string;
  statusLabel: string;
  metadata: ModularPrintMetadataItem[];
  rows: ModularPrintRow[];
  tableSummary?: ReactNode;
  documentNotes?: string | null;
  visibleOnScreen?: boolean;
}

const LOGO_SIZE_CLASSES: Record<LogoSize, string> = {
  SMALL: "max-h-9 max-w-[110px]",
  MEDIUM: "max-h-12 max-w-[150px]",
  LARGE: "max-h-16 max-w-[200px]",
};

function resolvePaperCss(paperSize: PaperSize): string {
  if (paperSize === "LETTER") {
    return "letter";
  }
  if (paperSize === "F4") {
    return "210mm 330mm";
  }
  return "A4";
}

function getColumnAlignmentClass(key: string): string {
  if (key === "no") {
    return "text-center tabular-nums";
  }
  if (key === "qty_received" || key === "qty_shipped" || key === "qty_ordered") {
    return "text-right font-bold tabular-nums";
  }
  return "text-left";
}

function getSignatureGridClass(count: number): string {
  if (count <= 1) {
    return "grid-cols-1 max-w-xs mx-auto";
  }
  if (count === 2) {
    return "grid-cols-1 sm:grid-cols-2 print:grid-cols-2";
  }
  if (count === 4) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4";
  }
  return "grid-cols-1 sm:grid-cols-3 print:grid-cols-3";
}

export function ModularDocumentPrintSheet({
  template,
  ariaLabel,
  documentNumberLabel,
  documentBarcodeValue,
  statusLabel,
  metadata,
  rows,
  tableSummary,
  documentNotes,
  visibleOnScreen = false,
}: ModularDocumentPrintSheetProps) {
  const logoSrc = resolveLogoAssetUrl(template.logo_url);
  const logoSizeClass = LOGO_SIZE_CLASSES[template.logo_size] ?? LOGO_SIZE_CLASSES.MEDIUM;
  const visibleColumns = template.table_columns.filter(
    (col) => col.visible && (template.show_line_notes || col.key !== "notes"),
  );
  const safeMarginMm = Number.isFinite(template.margin_mm)
    ? Math.min(40, Math.max(4, template.margin_mm))
    : 12;

  const pageCss = `@media print { @page { size: ${resolvePaperCss(
    template.paper_size,
  )} ${template.orientation.toLowerCase()}; margin: ${safeMarginMm}mm; } }`;

  const logoElement = logoSrc ? (
    <img
      alt={`Logo ${template.company_name}`}
      className={`object-contain ${logoSizeClass}`}
      src={logoSrc}
    />
  ) : null;

  const companyBlock = (
    <div className={template.logo_position === "CENTER" ? "text-center" : ""}>
      <p className="text-xs font-bold tracking-widest text-slate-700 uppercase">
        {template.company_name}
      </p>
      {template.company_address && (
        <p className="mt-0.5 text-[11px] text-slate-700">{template.company_address}</p>
      )}
      {template.show_company_contact && template.company_contact && (
        <p className="text-[11px] text-slate-600">{template.company_contact}</p>
      )}
      <h3 className="mt-2 text-lg font-bold tracking-tight text-ink-950 uppercase sm:text-xl">
        {template.document_title}
      </h3>
    </div>
  );

  const documentBadgeBlock = (
    <div
      className={`flex max-w-full flex-col gap-1.5 text-sm ${
        template.logo_position === "CENTER"
          ? "items-center text-center"
          : "items-start text-left sm:items-end sm:text-right print:items-end print:text-right"
      }`}
    >
      <p className="font-bold text-ink-950 tabular-nums">{documentNumberLabel}</p>
      <p className="text-xs font-semibold text-slate-700">{statusLabel}</p>
      {template.show_barcode && documentBarcodeValue && (
        <div className="max-w-full overflow-x-auto">
          <BarcodeVisual
            className="border border-ink-950/30 px-1.5 py-1"
            height={28}
            showValue={false}
            value={documentBarcodeValue}
          />
        </div>
      )}
    </div>
  );

  function renderSection(sectionKey: DocumentSectionKey) {
    if (sectionKey === "HEADER") {
      return (
        <div className="border-b-2 border-ink-950 pb-4" key="HEADER">
          {template.logo_position === "CENTER" ? (
            <div className="flex flex-col items-center gap-3">
              {logoElement}
              {companyBlock}
              {documentBadgeBlock}
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {template.logo_position === "LEFT" && logoElement}
                {companyBlock}
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end print:items-end">
                {template.logo_position === "RIGHT" && logoElement}
                {documentBadgeBlock}
              </div>
            </div>
          )}
          {template.header_notes && (
            <p className="mt-3 rounded border border-ink-950/20 bg-canvas-50 px-3 py-2 text-xs text-slate-800">
              {template.header_notes}
            </p>
          )}
        </div>
      );
    }

    if (sectionKey === "METADATA") {
      return (
        <dl
          className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 border-b border-line-500 pb-4 text-xs sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3"
          key="METADATA"
        >
          {metadata.map((item) => (
            <div key={item.label}>
              <dt className="font-semibold text-slate-600">{item.label}</dt>
              <dd className="mt-0.5 text-ink-950">{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    }

    if (sectionKey === "TABLE") {
      return (
        <div className="mt-4" key="TABLE">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse border border-ink-950 text-left text-xs print:min-w-0">
              <thead>
                <tr className="border-b border-ink-950 bg-canvas-50 font-bold text-ink-950">
                  {visibleColumns.map((col, idx) => (
                    <th
                      className={`${
                        idx < visibleColumns.length - 1 ? "border-r border-ink-950" : ""
                      } px-2.5 py-2 ${getColumnAlignmentClass(col.key)}`}
                      key={col.key}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-b border-ink-950/60" key={row.id}>
                    {visibleColumns.map((col, idx) => (
                      <td
                        className={`${
                          idx < visibleColumns.length - 1 ? "border-r border-ink-950" : ""
                        } px-2.5 py-2 ${getColumnAlignmentClass(col.key)}`}
                        key={col.key}
                      >
                        {row.cells[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tableSummary && (
            <p className="mt-2 text-xs text-slate-700 tabular-nums">{tableSummary}</p>
          )}
        </div>
      );
    }

    if (sectionKey === "NOTES") {
      if (!documentNotes && !template.footer_notes) {
        return null;
      }
      return (
        <div className="mt-4 space-y-1.5 text-xs text-slate-700" key="NOTES">
          {documentNotes && (
            <p className="rounded border border-ink-950/20 bg-canvas-50 px-3 py-2 text-ink-950">
              <strong>Catatan Transaksi:</strong> {documentNotes}
            </p>
          )}
          {template.footer_notes && (
            <p className="italic text-slate-700">{template.footer_notes}</p>
          )}
        </div>
      );
    }

    if (sectionKey === "SIGNATURES") {
      if (template.signature_layout.length === 0) {
        return null;
      }
      return (
        <div
          className={`print-signature-grid mt-8 grid gap-4 pt-2 text-center text-xs sm:gap-6 ${getSignatureGridClass(
            template.signature_layout.length,
          )}`}
          key="SIGNATURES"
        >
          {template.signature_layout.map((sig, idx) => (
            <div className="rounded border border-ink-950/50 p-3" key={`${sig.title}-${idx}`}>
              <p className="font-bold text-ink-950">{sig.title}</p>
              {sig.subtitle && (
                <p className="text-[11px] text-slate-600">{sig.subtitle}</p>
              )}
              <div className="h-16" />
              <p className="border-t border-ink-950 pt-1 font-medium text-ink-950">
                {sig.placeholder}
              </p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }

  return (
    <section
      aria-label={ariaLabel}
      className={`printable-document-sheet ${
        visibleOnScreen ? "mt-5 block" : "hidden"
      } rounded-[var(--radius-md)] border border-ink-950/30 bg-surface-0 text-ink-950 print:mt-0 print:block print:border-0 print:p-0`}
      data-orientation={template.orientation}
      data-paper-size={template.paper_size}
      style={{ padding: `${Math.min(24, Math.max(10, Math.round(safeMarginMm * 1.4)))}px` }}
    >
      <style>{pageCss}</style>
      {template.section_order.map((sectionKey) => renderSection(sectionKey))}
    </section>
  );
}
