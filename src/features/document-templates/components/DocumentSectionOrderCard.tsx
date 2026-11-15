import { ArrowDown, ArrowUp } from "lucide-react";
import { moveArrayItem } from "../schemas";
import { SECTION_LABELS, type DocumentSectionKey } from "../types";

interface DocumentSectionOrderCardProps {
  sectionOrder: DocumentSectionKey[];
  onChange: (nextOrder: DocumentSectionKey[]) => void;
}

/** Bagian 3 form template dokumen: pengaturan urutan blok dokumen cetak. */
export function DocumentSectionOrderCard({
  sectionOrder,
  onChange,
}: DocumentSectionOrderCardProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        3. Urutan Bagian Dokumen
      </h3>
      <ul className="space-y-2">
        {sectionOrder.map((sectionKey, index) => (
          <li
            className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 px-3 py-2 text-xs"
            key={sectionKey}
          >
            <span className="font-medium text-slate-800">
              {index + 1}. {SECTION_LABELS[sectionKey]}
            </span>
            <div className="flex items-center gap-1">
              <button
                aria-label={`Naikkan bagian ${sectionKey}`}
                className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                disabled={index === 0}
                onClick={() => onChange(moveArrayItem(sectionOrder, index, -1))}
                type="button"
              >
                <ArrowUp size={13} />
              </button>
              <button
                aria-label={`Turunkan bagian ${sectionKey}`}
                className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                disabled={index === sectionOrder.length - 1}
                onClick={() => onChange(moveArrayItem(sectionOrder, index, 1))}
                type="button"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
