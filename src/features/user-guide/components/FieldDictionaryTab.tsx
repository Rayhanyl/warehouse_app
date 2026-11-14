import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GUIDE_FIELDS, MODULE_GUIDES } from "../guideContent";
import type { GuideModuleId } from "../types";

export function FieldDictionaryTab({
  activeModuleId,
}: {
  activeModuleId: GuideModuleId;
}) {
  const [query, setQuery] = useState("");
  const currentGuide = MODULE_GUIDES[activeModuleId];

  const filteredFields = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return GUIDE_FIELDS;
    }
    return GUIDE_FIELDS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.fieldName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.appliesTo.some((mod) => mod.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-700">
          Referensi aturan validasi field penting (sedang aktif:{" "}
          <strong>{currentGuide.title}</strong>).
        </p>
        <div className="relative w-full sm:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={15}
          />
          <input
            aria-label="Cari penjelasan field transaksi"
            className="min-h-10 w-full rounded-[var(--radius-md)] border border-line-200 bg-surface-0 pl-9 pr-3 text-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari UoM, ISSUED, rak, variance..."
            type="search"
            value={query}
          />
        </div>
      </div>

      {filteredFields.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line-200 p-6 text-center text-xs text-slate-600">
          Tidak ada penjelasan field yang cocok dengan kata kunci pencarian Anda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredFields.map((field) => (
            <div
              className="flex flex-col justify-between rounded-[var(--radius-md)] border border-line-200 bg-surface-0 p-4 text-xs"
              key={field.id}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-teal-800">
                    {field.fieldName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {field.appliesTo.join(" | ")}
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-bold text-ink-950">{field.label}</h4>
                <p className="mt-1.5 leading-5 text-slate-700">{field.description}</p>
              </div>
              <div className="mt-3 space-y-1.5 pt-2">
                <p className="rounded border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-teal-950">
                  <strong>Contoh Isian Benar:</strong> {field.exampleValid}
                </p>
                <p className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-red-900">
                  <strong>Hindari:</strong> {field.commonMistake}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
