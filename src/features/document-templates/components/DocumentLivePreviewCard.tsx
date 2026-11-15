import { useState } from "react";
import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import type { SampleDocumentPreviewData } from "../previewData";
import { DOCUMENT_TYPE_LABELS, type DocumentTemplate } from "../types";

interface DocumentLivePreviewCardProps {
  draft: DocumentTemplate;
  samplePreview: SampleDocumentPreviewData;
}

type PreviewZoomMode = "fit" | "75" | "100";

const ZOOM_OPTIONS: Array<{ key: PreviewZoomMode; label: string }> = [
  { key: "fit", label: "Fit" },
  { key: "75", label: "75%" },
  { key: "100", label: "100%" },
];

/** Panel pratinjau langsung dokumen cetak dengan data contoh simulasi. */
export function DocumentLivePreviewCard({
  draft,
  samplePreview,
}: DocumentLivePreviewCardProps) {
  const [zoom, setZoom] = useState<PreviewZoomMode>("fit");

  const sheetWrapperClass =
    zoom === "75"
      ? "origin-top-left scale-75 w-[133.33%]"
      : zoom === "100"
        ? "min-w-[680px]"
        : "w-full";

  return (
    <div className="space-y-3 xl:sticky xl:top-6 xl:col-span-7 xl:self-start">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Pratinjau Langsung Dokumen
          </h3>
          <p className="text-xs text-slate-500">
            Kertas {draft.paper_size} | {draft.orientation} | Margin{" "}
            {draft.margin_mm} mm
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            aria-label="Skala pratinjau dokumen"
            className="inline-flex items-center gap-0.5 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50 p-0.5 text-[11px] font-semibold"
            role="group"
          >
            {ZOOM_OPTIONS.map((opt) => (
              <button
                aria-pressed={zoom === opt.key}
                className={`rounded px-2 py-1 transition ${
                  zoom === opt.key
                    ? "bg-teal-600 text-surface-0 shadow-xs"
                    : "text-slate-700 hover:text-ink-950"
                }`}
                key={opt.key}
                onClick={() => setZoom(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="rounded bg-surface-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Data contoh simulasi
          </span>
        </div>
      </div>

      <div className="max-h-[78vh] overflow-auto rounded-[var(--radius-lg)] border border-line-200 bg-slate-100 p-4">
        <div className={sheetWrapperClass}>
          <ModularDocumentPrintSheet
            ariaLabel={`Pratinjau template ${DOCUMENT_TYPE_LABELS[draft.document_type]}`}
            documentBarcodeValue={samplePreview.documentBarcodeValue}
            documentNotes={samplePreview.documentNotes}
            documentNumberLabel={samplePreview.documentNumberLabel}
            metadata={samplePreview.metadata}
            rows={samplePreview.rows}
            statusLabel={samplePreview.statusLabel}
            tableSummary={samplePreview.tableSummary}
            template={draft}
            visibleOnScreen={true}
          />
        </div>
      </div>
    </div>
  );
}
