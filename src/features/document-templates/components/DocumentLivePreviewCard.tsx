import { ModularDocumentPrintSheet } from "@/components/print/ModularDocumentPrintSheet";
import type { SampleDocumentPreviewData } from "../previewData";
import { DOCUMENT_TYPE_LABELS, type DocumentTemplate } from "../types";

interface DocumentLivePreviewCardProps {
  draft: DocumentTemplate;
  samplePreview: SampleDocumentPreviewData;
}

/** Panel pratinjau langsung dokumen cetak dengan data contoh simulasi. */
export function DocumentLivePreviewCard({
  draft,
  samplePreview,
}: DocumentLivePreviewCardProps) {
  return (
    <div className="space-y-3 xl:col-span-7">
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
        <span className="rounded bg-surface-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Data contoh simulasi
        </span>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line-200 bg-slate-100 p-4">
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
  );
}
