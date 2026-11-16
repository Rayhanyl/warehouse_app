import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, Eye, RotateCcw, Search } from "lucide-react";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import {
  formatOpnameDateTime,
  OPNAME_BUTTON_CLASS,
  OPNAME_FIELD_CLASS,
  OPNAME_STATUS_CLASSES,
  OPNAME_STATUS_LABELS,
  type OpnameFilters,
} from "../constants";
import type { StockOpname } from "../types";
import { OpnameState } from "./OpnameShared";

export function OpnamesFilterBar({
  activeCount,
  draft,
  effectiveWarehouseId,
  canAccessAllWarehouses,
  showWarehouseFilter = true,
  isTopbarWarehouseLocked = false,
  scopedWarehouses,
  isRefsError,
  onDraftChange,
  onApply,
  onReset,
  onRetryRefs,
}: {
  activeCount: number;
  draft: OpnameFilters;
  effectiveWarehouseId: number | null;
  canAccessAllWarehouses: boolean;
  showWarehouseFilter?: boolean;
  isTopbarWarehouseLocked?: boolean;
  scopedWarehouses: { id: number; code: string; name: string }[];
  isRefsError: boolean;
  onDraftChange: (updater: (current: OpnameFilters) => OpnameFilters) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onRetryRefs: () => void;
}) {
  return (
    <CollapsibleFilterPanel
      activeCount={activeCount}
      ariaLabel="Filter daftar stock opname"
      className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5"
    >
      <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onApply}>
        <label className="text-sm font-semibold text-ink-950">
          Pencarian
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-600"
              size={16}
            />
            <input
              className={`${OPNAME_FIELD_CLASS} pl-9`}
              maxLength={100}
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Nomor atau catatan sesi"
              type="search"
              value={draft.search}
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Status
          <select
            className={OPNAME_FIELD_CLASS}
            onChange={(event) =>
              onDraftChange((current) => ({
                ...current,
                status: event.target.value as OpnameFilters["status"],
              }))
            }
            value={draft.status}
          >
            <option value="all">Semua status</option>
            {Object.entries(OPNAME_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {showWarehouseFilter && (
          <label className="text-sm font-semibold text-ink-950">
            Gudang
            <select
              className={`${OPNAME_FIELD_CLASS} disabled:cursor-not-allowed disabled:bg-canvas-50 disabled:text-slate-500`}
              disabled={isTopbarWarehouseLocked}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  warehouse_id: event.target.value ? Number(event.target.value) : null,
                }))
              }
              value={isTopbarWarehouseLocked ? (effectiveWarehouseId ?? "") : (draft.warehouse_id ?? "")}
            >
              <option value="">{canAccessAllWarehouses ? "Semua gudang" : "Semua gudang saya"}</option>
              {scopedWarehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} · {warehouse.name}
                </option>
              ))}
            </select>
            {isTopbarWarehouseLocked && (
              <span className="mt-1 block text-[11px] font-medium text-teal-700">
                Mengikuti filter gudang Top Bar
              </span>
            )}
          </label>
        )}

        <label className="text-sm font-semibold text-ink-950">
          Tanggal mulai
          <input
            className={OPNAME_FIELD_CLASS}
            max={draft.date_to || undefined}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, date_from: event.target.value }))
            }
            type="date"
            value={draft.date_from}
          />
        </label>

        <label className="text-sm font-semibold text-ink-950">
          Tanggal akhir
          <input
            className={OPNAME_FIELD_CLASS}
            min={draft.date_from || undefined}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, date_to: event.target.value }))
            }
            type="date"
            value={draft.date_to}
          />
        </label>

        <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-600 sm:flex-initial"
            type="submit"
          >
            Terapkan filter
          </button>
          <button className={`${OPNAME_BUTTON_CLASS} flex-1 sm:flex-initial`} onClick={onReset} type="button">
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang
          </button>
        </div>
      </form>
      {isRefsError && (
        <p className="mt-3 text-sm text-red-800" role="alert">
          Referensi gudang dan lokasi belum dapat dimuat.{" "}
          <button className="font-semibold underline" onClick={onRetryRefs} type="button">
            Coba lagi
          </button>
        </p>
      )}
    </CollapsibleFilterPanel>
  );
}

export function OpnamesDataView({
  items,
  total,
  offset,
  limit,
  isLoading,
  isError,
  isMobile,
  hasFilters,
  canManage,
  onRetry,
  onResetFilters,
  onOpenCreate,
  onSelectDetail,
  onPageChange,
}: {
  items: StockOpname[];
  total: number;
  offset: number;
  limit: number;
  isLoading: boolean;
  isError: boolean;
  isMobile: boolean;
  hasFilters: boolean;
  canManage: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onSelectDetail: (id: number) => void;
  onPageChange: (nextOffset: number) => void;
}) {
  const pageEnd = Math.min(offset + limit, total);

  if (isLoading) {
    return <OpnameState text="Memuat daftar stock opname..." />;
  }
  if (isError) {
    return (
      <OpnameState
        error
        onRetry={onRetry}
        text="Daftar stock opname belum dapat dimuat."
      />
    );
  }
  if (items.length === 0) {
    return (
      <OpnameState
        action={hasFilters ? onResetFilters : canManage ? onOpenCreate : undefined}
        actionLabel={hasFilters ? "Atur ulang filter" : "Buat sesi opname"}
        empty
        text={hasFilters ? "Tidak ada sesi yang cocok dengan filter" : "Belum ada sesi stock opname"}
      />
    );
  }

  return (
    <section
      aria-label="Daftar sesi stock opname"
      className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]"
    >
      {isMobile ? (
        <ul className="divide-y divide-line-200">
          {items.map((item) => (
            <li className="space-y-3 p-4" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600"
                    onClick={() => onSelectDetail(item.id)}
                    type="button"
                  >
                    {item.opname_number}
                  </button>
                  <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                    {formatOpnameDateTime(item.created_at)}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold ${OPNAME_STATUS_CLASSES[item.status]}`}
                >
                  {OPNAME_STATUS_LABELS[item.status]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                <div>
                  <p className="text-slate-600">Gudang</p>
                  <p className="mt-0.5 font-semibold text-ink-950">
                    {item.warehouse_code} · {item.warehouse_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">Baris</p>
                  <p className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                    {item.line_count}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-600">Cakupan</p>
                  <p className="mt-0.5 font-semibold text-ink-950">
                    {item.location_code
                      ? `${item.location_code} · ${item.location_name}`
                      : "Seluruh lokasi aktif"}
                  </p>
                </div>
              </div>
              <button
                aria-label={`Lihat detail ${item.opname_number}`}
                className={`${OPNAME_BUTTON_CLASS} w-full`}
                onClick={() => onSelectDetail(item.id)}
                type="button"
              >
                <Eye aria-hidden="true" size={16} />
                Detail
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-left text-sm">
            <caption className="sr-only">Daftar stock opname</caption>
            <thead className="bg-canvas-50 text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Nomor dan tanggal</th>
                <th className="px-4 py-3">Gudang</th>
                <th className="px-4 py-3">Cakupan</th>
                <th className="px-4 py-3 text-right">Baris</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200">
              {items.map((item) => (
                <tr className="hover:bg-canvas-50/60" key={item.id}>
                  <td className="px-4 py-4">
                    <button
                      className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600"
                      onClick={() => onSelectDetail(item.id)}
                      type="button"
                    >
                      {item.opname_number}
                    </button>
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">
                      {formatOpnameDateTime(item.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {item.warehouse_code} · {item.warehouse_name}
                  </td>
                  <td className="px-4 py-4">
                    {item.location_code
                      ? `${item.location_code} · ${item.location_name}`
                      : "Seluruh lokasi aktif"}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{item.line_count}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-semibold ${OPNAME_STATUS_CLASSES[item.status]}`}
                    >
                      {OPNAME_STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      aria-label={`Lihat detail ${item.opname_number}`}
                      className={OPNAME_BUTTON_CLASS}
                      onClick={() => onSelectDetail(item.id)}
                      type="button"
                    >
                      <Eye aria-hidden="true" size={16} />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-line-200 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <span className="tabular-nums">
          Menampilkan {total === 0 ? 0 : offset + 1} sampai {pageEnd} dari {total} sesi
        </span>
        <div className="flex justify-end gap-2">
          <button
            aria-label="Halaman sebelumnya"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40"
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="Halaman berikutnya"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40"
            disabled={pageEnd >= total}
            onClick={() => onPageChange(offset + limit)}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
