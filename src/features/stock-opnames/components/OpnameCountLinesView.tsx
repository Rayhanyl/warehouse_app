import type { Dispatch, SetStateAction } from "react";
import Decimal from "decimal.js";
import { X } from "lucide-react";
import type {
  OpnameItemReference,
  OpnameReference,
  StockOpname,
  StockOpnameLine,
} from "../types";

export type CountDraft = { qty: string; notes: string };
export type FoundDraft = {
  location_id: string;
  item_id: string;
  qty: string;
  notes: string;
};

interface OpnameCountLinesViewProps {
  isMobile: boolean;
  opnameStatus: StockOpname["status"];
  canCount: boolean;
  opnameLines: StockOpnameLine[];
  counts: Record<number, CountDraft>;
  setCounts: Dispatch<SetStateAction<Record<number, CountDraft>>>;
  found: FoundDraft[];
  setFound: Dispatch<SetStateAction<FoundDraft[]>>;
  locations: OpnameReference[];
  items: OpnameItemReference[];
}

function computeVariance(line: StockOpnameLine, draft?: CountDraft): string | null {
  if (
    draft?.qty !== undefined &&
    draft.qty !== "" &&
    Number.isFinite(Number(draft.qty))
  ) {
    return new Decimal(draft.qty).minus(line.qty_system).toFixed(4);
  }
  return line.qty_variance;
}

/**
 * Responsive opname physical count line editor supporting both snapshot items and ad-hoc found items.
 */
export function OpnameCountLinesView({
  isMobile,
  opnameStatus,
  canCount,
  opnameLines,
  counts,
  setCounts,
  found,
  setFound,
  locations,
  items,
}: OpnameCountLinesViewProps) {
  const editable = opnameStatus === "IN_PROGRESS" && canCount;

  if (isMobile) {
    return (
      <div className="mt-4 space-y-3">
        {opnameLines.map((line) => {
          const current = counts[line.id];
          const variance = computeVariance(line, current);
          return (
            <div
              className="space-y-3 rounded-[var(--radius-md)] border border-line-200 p-4"
              key={line.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-950">
                    {line.item_sku} · {line.item_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {line.location_code} · {line.location_name}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-canvas-100 px-2.5 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                  Sistem: {line.qty_system}
                </span>
              </div>
              <div className="grid gap-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Hasil fisik (Selisih:{" "}
                  <span className="tabular-nums text-ink-950">{variance ?? "-"}</span>)
                  {editable ? (
                    <input
                      aria-label={`Hasil fisik ${line.item_sku}`}
                      className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        setCounts((currentCounts) => ({
                          ...currentCounts,
                          [line.id]: {
                            qty: event.target.value,
                            notes: currentCounts[line.id]?.notes ?? line.notes ?? "",
                          },
                        }))
                      }
                      step={line.allow_decimal ? "0.0001" : "1"}
                      type="number"
                      value={current?.qty ?? line.qty_physical ?? ""}
                    />
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-ink-950 tabular-nums">
                      {line.qty_physical ?? "-"}
                    </p>
                  )}
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Catatan hitung
                  {editable ? (
                    <input
                      aria-label={`Catatan hitung ${line.item_sku}`}
                      className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      maxLength={500}
                      onChange={(event) =>
                        setCounts((currentCounts) => ({
                          ...currentCounts,
                          [line.id]: {
                            qty: currentCounts[line.id]?.qty ?? line.qty_physical ?? "",
                            notes: event.target.value,
                          },
                        }))
                      }
                      value={current?.notes ?? line.notes ?? ""}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{line.notes || "-"}</p>
                  )}
                </label>
              </div>
            </div>
          );
        })}

        {found.map((line, index) => (
          <div
            className="space-y-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/60 p-4"
            key={`found-${index}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-900">
                Barang temuan #{index + 1}
              </span>
              <button
                aria-label={`Hapus barang temuan ${index + 1}`}
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-[var(--radius-md)] border border-red-300 bg-surface-0 px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                onClick={() =>
                  setFound((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
                type="button"
              >
                <X aria-hidden="true" size={16} />
                Hapus
              </button>
            </div>
            <div className="grid gap-3">
              <label className="block text-xs font-semibold text-slate-700">
                Lokasi
                <select
                  aria-label={`Lokasi barang temuan ${index + 1}`}
                  className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2 text-sm"
                  onChange={(event) =>
                    setFound((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index
                          ? { ...entry, location_id: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  value={line.location_id}
                >
                  <option value="">Pilih lokasi</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.code} · {location.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Barang
                <select
                  aria-label={`Barang temuan ${index + 1}`}
                  className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2 text-sm"
                  onChange={(event) =>
                    setFound((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index
                          ? { ...entry, item_id: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  value={line.item_id}
                >
                  <option value="">Pilih barang</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} · {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Jumlah ditemukan
                <input
                  aria-label={`Jumlah barang temuan ${index + 1}`}
                  className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm tabular-nums"
                  min="0"
                  onChange={(event) =>
                    setFound((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, qty: event.target.value } : entry,
                      ),
                    )
                  }
                  step={
                    items.find((item) => item.id === Number(line.item_id))?.allow_decimal
                      ? "0.0001"
                      : "1"
                  }
                  type="number"
                  value={line.qty}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Catatan temuan
                <input
                  aria-label={`Catatan barang temuan ${index + 1}`}
                  className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm"
                  maxLength={500}
                  onChange={(event) =>
                    setFound((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index
                          ? { ...entry, notes: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  value={line.notes}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
      <table className="min-w-[780px] w-full border-collapse text-left text-sm">
        <caption className="sr-only">Baris hitung stock opname</caption>
        <thead className="bg-canvas-50 text-xs font-semibold text-slate-700">
          <tr>
            <th className="px-3 py-3">Barang dan lokasi</th>
            <th className="px-3 py-3 text-right">Saldo sistem</th>
            <th className="px-3 py-3">Hasil fisik</th>
            <th className="px-3 py-3 text-right">Selisih</th>
            <th className="px-3 py-3">Catatan hitung</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-200">
          {opnameLines.map((line) => {
            const current = counts[line.id];
            const variance = computeVariance(line, current);
            return (
              <tr key={line.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold text-ink-950">
                    {line.item_sku} · {line.item_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {line.location_code} · {line.location_name}
                  </p>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{line.qty_system}</td>
                <td className="px-3 py-3">
                  {editable ? (
                    <input
                      aria-label={`Hasil fisik ${line.item_sku}`}
                      className="h-11 w-36 rounded-[var(--radius-md)] border border-line-500 px-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        setCounts((currentCounts) => ({
                          ...currentCounts,
                          [line.id]: {
                            qty: event.target.value,
                            notes: currentCounts[line.id]?.notes ?? line.notes ?? "",
                          },
                        }))
                      }
                      step={line.allow_decimal ? "0.0001" : "1"}
                      type="number"
                      value={current?.qty ?? line.qty_physical ?? ""}
                    />
                  ) : (
                    line.qty_physical ?? "-"
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{variance ?? "-"}</td>
                <td className="px-3 py-3">
                  {editable ? (
                    <input
                      aria-label={`Catatan hitung ${line.item_sku}`}
                      className="h-11 min-w-48 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      maxLength={500}
                      onChange={(event) =>
                        setCounts((currentCounts) => ({
                          ...currentCounts,
                          [line.id]: {
                            qty: currentCounts[line.id]?.qty ?? line.qty_physical ?? "",
                            notes: event.target.value,
                          },
                        }))
                      }
                      value={current?.notes ?? line.notes ?? ""}
                    />
                  ) : (
                    line.notes || "-"
                  )}
                </td>
              </tr>
            );
          })}

          {found.map((line, index) => (
            <tr className="bg-amber-50/60" key={`found-${index}`}>
              <td className="min-w-64 px-3 py-3">
                <div className="grid gap-2">
                  <select
                    aria-label={`Lokasi barang temuan ${index + 1}`}
                    className="h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2"
                    onChange={(event) =>
                      setFound((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index
                            ? { ...entry, location_id: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    value={line.location_id}
                  >
                    <option value="">Pilih lokasi</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.code} · {location.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Barang temuan ${index + 1}`}
                    className="h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2"
                    onChange={(event) =>
                      setFound((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index
                            ? { ...entry, item_id: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    value={line.item_id}
                  >
                    <option value="">Pilih barang</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} · {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="px-3 py-3 text-right tabular-nums">0</td>
              <td className="px-3 py-3">
                <input
                  aria-label={`Jumlah barang temuan ${index + 1}`}
                  className="h-11 w-36 rounded-[var(--radius-md)] border border-line-500 px-3 tabular-nums"
                  min="0"
                  onChange={(event) =>
                    setFound((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, qty: event.target.value } : entry,
                      ),
                    )
                  }
                  step={
                    items.find((item) => item.id === Number(line.item_id))?.allow_decimal
                      ? "0.0001"
                      : "1"
                  }
                  type="number"
                  value={line.qty}
                />
              </td>
              <td className="px-3 py-3 text-right tabular-nums">{line.qty || "-"}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Catatan barang temuan ${index + 1}`}
                    className="h-11 min-w-40 rounded-[var(--radius-md)] border border-line-500 px-3"
                    maxLength={500}
                    onChange={(event) =>
                      setFound((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, notes: event.target.value } : entry,
                        ),
                      )
                    }
                    value={line.notes}
                  />
                  <button
                    aria-label={`Hapus barang temuan ${index + 1}`}
                    className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() =>
                      setFound((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    type="button"
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
