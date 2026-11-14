import { Code2 } from "lucide-react";
import { collectDiffRows, formatCellValue } from "../utils";

export function AuditLogDiffSection({
  oldValues,
  newValues,
  showRawJson,
  onToggleRawJson,
}: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  showRawJson: boolean;
  onToggleRawJson: () => void;
}) {
  const diffRows = collectDiffRows(oldValues, newValues);

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Perbandingan Perubahan Data (Sebelum vs Sesudah)
        </h3>
        {(oldValues || newValues) && (
          <button
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-line-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-canvas-50"
            onClick={onToggleRawJson}
            type="button"
          >
            <Code2 aria-hidden="true" size={14} />
            {showRawJson ? "Lihat Tabel Diff" : "Lihat JSON Mentah"}
          </button>
        )}
      </div>

      {diffRows.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-line-500 p-4 text-center text-xs text-slate-600">
          Tidak ada perubahan data field pada aktivitas ini.
        </div>
      ) : showRawJson ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Sebelum (old_values)</p>
            <pre className="max-h-60 overflow-auto rounded-[var(--radius-md)] bg-ink-950 p-3 text-xs leading-5 text-canvas-50">
              {oldValues ? JSON.stringify(oldValues, null, 2) : "Tidak ada"}
            </pre>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Sesudah (new_values)</p>
            <pre className="max-h-60 overflow-auto rounded-[var(--radius-md)] bg-ink-950 p-3 text-xs leading-5 text-canvas-50">
              {newValues ? JSON.stringify(newValues, null, 2) : "Tidak ada"}
            </pre>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead className="bg-canvas-50 font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="px-3 py-2.5">Field</th>
                <th className="px-3 py-2.5">Nilai Lama</th>
                <th className="px-3 py-2.5">Nilai Baru</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((row) => (
                <tr className="border-t border-line-200 align-top" key={row.field}>
                  <td className="px-3 py-2.5 font-mono font-semibold text-ink-950">
                    {row.field}
                  </td>
                  <td
                    className={`px-3 py-2.5 break-all font-mono ${
                      row.hasOld && row.changed
                        ? "bg-red-50/70 text-red-800"
                        : "text-slate-600"
                    }`}
                  >
                    {row.hasOld ? formatCellValue(row.oldVal) : "-"}
                  </td>
                  <td
                    className={`px-3 py-2.5 break-all font-mono ${
                      row.hasNew && row.changed
                        ? "bg-teal-50/80 text-teal-800"
                        : "text-slate-700"
                    }`}
                  >
                    {row.hasNew ? formatCellValue(row.newVal) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
