import type {
  DocumentTemplate,
  PaperOrientation,
  PaperSize,
} from "../types";

interface DocumentPaperVisibilitySectionProps {
  draft: DocumentTemplate;
  fieldErrors: Record<string, string>;
  onUpdateField: <K extends keyof DocumentTemplate>(
    key: K,
    value: DocumentTemplate[K],
  ) => void;
}

/** Bagian 2 form template dokumen: ukuran kertas, orientasi, margin, opsi tampil, dan catatan. */
export function DocumentPaperVisibilitySection({
  draft,
  fieldErrors,
  onUpdateField,
}: DocumentPaperVisibilitySectionProps) {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        2. Ukuran Kertas, Margin & Visibilitas
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            className="mb-1 block text-xs font-medium text-slate-700"
            htmlFor="tpl-paper-size"
          >
            Kertas
          </label>
          <select
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs"
            id="tpl-paper-size"
            onChange={(e) =>
              onUpdateField("paper_size", e.target.value as PaperSize)
            }
            value={draft.paper_size}
          >
            <option value="A4">A4</option>
            <option value="LETTER">Letter</option>
            <option value="F4">F4 (Folio)</option>
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium text-slate-700"
            htmlFor="tpl-orientation"
          >
            Orientasi
          </label>
          <select
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-2.5 text-xs"
            id="tpl-orientation"
            onChange={(e) =>
              onUpdateField("orientation", e.target.value as PaperOrientation)
            }
            value={draft.orientation}
          >
            <option value="PORTRAIT">Portrait</option>
            <option value="LANDSCAPE">Landscape</option>
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium text-slate-700"
            htmlFor="tpl-margin-mm"
          >
            Margin (mm)
          </label>
          <input
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 px-2.5 text-xs tabular-nums"
            id="tpl-margin-mm"
            max={40}
            min={4}
            onChange={(e) =>
              onUpdateField("margin_mm", Number(e.target.value) || 0)
            }
            type="number"
            value={draft.margin_mm}
          />
        </div>
      </div>
      {fieldErrors.margin_mm && (
        <p className="text-xs text-red-600">{fieldErrors.margin_mm}</p>
      )}

      <div className="space-y-2 pt-1 text-xs text-slate-700">
        <label className="flex items-center gap-2">
          <input
            checked={draft.show_barcode}
            onChange={(e) => onUpdateField("show_barcode", e.target.checked)}
            type="checkbox"
          />
          <span>Tampilkan barcode nomor dokumen di kop surat</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            checked={draft.show_line_notes}
            onChange={(e) => onUpdateField("show_line_notes", e.target.checked)}
            type="checkbox"
          />
          <span>Tampilkan kolom catatan per baris (line notes)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            checked={draft.show_company_contact}
            onChange={(e) =>
              onUpdateField("show_company_contact", e.target.checked)
            }
            type="checkbox"
          />
          <span>Tampilkan informasi kontak perusahaan di header</span>
        </label>
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="tpl-header-notes"
        >
          Catatan Header (Opsional)
        </label>
        <textarea
          className="w-full rounded-[var(--radius-md)] border border-line-200 p-2.5 text-xs"
          id="tpl-header-notes"
          onChange={(e) => onUpdateField("header_notes", e.target.value)}
          rows={2}
          value={draft.header_notes ?? ""}
        />
      </div>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-slate-700"
          htmlFor="tpl-footer-notes"
        >
          Catatan Footer / Legal (Opsional)
        </label>
        <textarea
          className="w-full rounded-[var(--radius-md)] border border-line-200 p-2.5 text-xs"
          id="tpl-footer-notes"
          onChange={(e) => onUpdateField("footer_notes", e.target.value)}
          rows={2}
          value={draft.footer_notes ?? ""}
        />
      </div>
    </div>
  );
}
