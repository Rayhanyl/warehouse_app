import { ArrowDown, ArrowUp } from "lucide-react";
import { moveArrayItem } from "../schemas";
import type { TableColumnConfig } from "../types";

interface DocumentTableColumnsCardProps {
  columns: TableColumnConfig[];
  onChange: (nextColumns: TableColumnConfig[]) => void;
}

/** Bagian 4 form template dokumen: visibilitas, label, dan urutan kolom tabel. */
export function DocumentTableColumnsCard({
  columns,
  onChange,
}: DocumentTableColumnsCardProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        4. Kolom Tabel Rincian
      </h3>
      <ul className="space-y-2">
        {columns.map((column, index) => (
          <li
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-line-200 bg-surface-50 p-2"
            key={column.key}
          >
            <input
              aria-label={`Tampilkan kolom ${column.key}`}
              checked={column.visible}
              onChange={(e) => {
                onChange(
                  columns.map((item, idx) =>
                    idx === index ? { ...item, visible: e.target.checked } : item,
                  ),
                );
              }}
              type="checkbox"
            />
            <input
              aria-label={`Label kolom ${column.key}`}
              className="min-h-8 flex-1 rounded border border-line-200 bg-surface-0 px-2 text-xs"
              onChange={(e) => {
                onChange(
                  columns.map((item, idx) =>
                    idx === index ? { ...item, label: e.target.value } : item,
                  ),
                );
              }}
              type="text"
              value={column.label}
            />
            <div className="flex items-center gap-1">
              <button
                aria-label={`Naikkan kolom ${column.key}`}
                className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                disabled={index === 0}
                onClick={() => onChange(moveArrayItem(columns, index, -1))}
                type="button"
              >
                <ArrowUp size={13} />
              </button>
              <button
                aria-label={`Turunkan kolom ${column.key}`}
                className="rounded border border-line-200 bg-surface-0 p-1 text-slate-600 hover:bg-surface-50 disabled:opacity-40"
                disabled={index === columns.length - 1}
                onClick={() => onChange(moveArrayItem(columns, index, 1))}
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
