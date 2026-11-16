import type { FormEvent } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { formatGrDate, GR_STATUS_CLASSES, GR_STATUS_LABELS } from "../constants";
import type { GoodsReceipt, GoodsReceiptListParams, GoodsReceiptStatus } from "../types";

export function GoodsReceiptsDataView({
  items,
  total,
  offset,
  limit,
  draftParams,
  activeFilterCount,
  hasFilters,
  isLoading,
  isError,
  isMobile,
  canManage,
  warehouses = [],
  showWarehouseFilter = false,
  isTopbarWarehouseLocked = false,
  effectiveWarehouseId = null,
  onDraftChange,
  onApplyFilters,
  onResetFilters,
  onRetry,
  onOpenCreate,
  onEditDraft,
  onSelectDetail,
  onPageChange,
}: {
  items: GoodsReceipt[];
  total: number;
  offset: number;
  limit: number;
  draftParams: GoodsReceiptListParams;
  activeFilterCount: number;
  hasFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  isMobile: boolean;
  canManage: boolean;
  warehouses?: { id: number; code: string; name: string; is_active?: boolean }[];
  showWarehouseFilter?: boolean;
  isTopbarWarehouseLocked?: boolean;
  effectiveWarehouseId?: number | null;
  onDraftChange: (
    updater: (current: GoodsReceiptListParams) => GoodsReceiptListParams,
  ) => void;
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  onOpenCreate: () => void;
  onEditDraft?: (receipt: GoodsReceipt) => void;
  onSelectDetail: (id: number) => void;
  onPageChange: (nextOffset: number) => void;
}) {
  const pageEnd = Math.min(offset + limit, total);

  return (
    <>
      <CollapsibleFilterPanel
        activeCount={activeFilterCount}
        ariaLabel="Filter daftar penerimaan barang"
        className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5"
      >
        <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onApplyFilters}>
          <label className="text-sm font-semibold text-ink-950">
            Pencarian
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                size={16}
              />
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 pr-3 pl-9 text-sm font-normal text-ink-950 placeholder:text-slate-600 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                onChange={(event) =>
                  onDraftChange((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Cari nomor GR, PO, atau pemasok..."
                type="search"
                value={draftParams.search}
              />
            </div>
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Status
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...current,
                  status: event.target.value as GoodsReceiptStatus | "all",
                }))
              }
              value={draftParams.status}
            >
              <option value="all">Semua status</option>
              {Object.entries(GR_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {showWarehouseFilter && (
            <label className="text-sm font-semibold text-ink-950">
              Gudang
              <select
                className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-canvas-50 disabled:text-slate-500"
                disabled={isTopbarWarehouseLocked}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    warehouse_id: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                value={
                  isTopbarWarehouseLocked
                    ? (effectiveWarehouseId ?? "")
                    : (draftParams.warehouse_id ?? "")
                }
              >
                <option value="">Semua gudang</option>
                {warehouses
                  .filter((wh) => wh.is_active !== false)
                  .map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.code} · {wh.name}
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
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, date_from: event.target.value }))
              }
              type="date"
              value={draftParams.date_from}
            />
          </label>
          <label className="text-sm font-semibold text-ink-950">
            Tanggal akhir
            <input
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, date_to: event.target.value }))
              }
              type="date"
              value={draftParams.date_to}
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4">
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-900 sm:flex-initial"
              type="submit"
            >
              Terapkan filter
            </button>
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 sm:flex-initial"
              onClick={onResetFilters}
              type="button"
            >
              <RotateCcw size={16} />
              Atur ulang
            </button>
          </div>
        </form>
      </CollapsibleFilterPanel>

      {isLoading ? (
        <div
          className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-center text-sm text-slate-700"
          role="status"
        >
          Memuat daftar penerimaan...
        </div>
      ) : isError ? (
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-900">Daftar penerimaan belum dapat dimuat.</p>
          <button
            className="mt-4 inline-flex min-h-11 rounded-[var(--radius-md)] bg-red-700 px-4 text-sm font-semibold text-surface-0 hover:bg-red-800"
            onClick={onRetry}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center shadow-[var(--shadow-1)]">
          <p className="font-semibold text-ink-950">
            {hasFilters ? "Tidak ada data yang cocok dengan filter" : "Belum ada penerimaan barang"}
          </p>
          <p className="mx-auto mt-2 max-w-[55ch] text-sm leading-6 text-slate-700">
            {hasFilters
              ? "Periksa kata kunci atau rentang tanggal, lalu coba lagi."
              : "Buat draft penerimaan dari purchase order yang sudah diterbitkan."}
          </p>
          {hasFilters ? (
            <button
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
              onClick={onResetFilters}
              type="button"
            >
              <RotateCcw size={16} />
              Atur ulang filter
            </button>
          ) : canManage ? (
            <button
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
              onClick={onOpenCreate}
              type="button"
            >
              <Plus size={16} />
              Buat penerimaan
            </button>
          ) : null}
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
          {isMobile ? (
            <ul aria-label="Daftar penerimaan barang" className="divide-y divide-line-200">
              {items.map((receipt) => (
                <li className="space-y-3 p-4" key={receipt.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600"
                        onClick={() => onSelectDetail(receipt.id)}
                        type="button"
                      >
                        {receipt.gr_number}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                        ID #{receipt.id} · {formatGrDate(receipt.received_date)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${GR_STATUS_CLASSES[receipt.status]}`}
                    >
                      {GR_STATUS_LABELS[receipt.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                    <div>
                      <p className="text-slate-600">Purchase order</p>
                      <p className="mt-0.5 font-semibold text-ink-950">{receipt.po_number}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Gudang</p>
                      <p className="mt-0.5 font-semibold text-ink-950">{receipt.warehouse_name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-600">Pemasok</p>
                      <p className="mt-0.5 font-semibold text-ink-950">
                        {receipt.supplier_name} ({receipt.supplier_code})
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {receipt.status === "DRAFT" && canManage && onEditDraft && (
                      <button
                        aria-label={`Ubah draft penerimaan ${receipt.gr_number}`}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                        onClick={() => onEditDraft(receipt)}
                        type="button"
                      >
                        <Pencil size={15} />
                        Ubah Draft
                      </button>
                    )}
                    <button
                      aria-label={`Lihat detail penerimaan ${receipt.gr_number}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                      onClick={() => onSelectDetail(receipt.id)}
                      type="button"
                    >
                      <Eye size={16} />
                      Detail
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                <caption className="sr-only">Daftar penerimaan barang</caption>
                <thead className="bg-canvas-50 text-xs font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Nomor dokumen</th>
                    <th className="px-4 py-3">Purchase order</th>
                    <th className="px-4 py-3">Pemasok</th>
                    <th className="px-4 py-3">Gudang</th>
                    <th className="px-4 py-3">Tanggal terima</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-200">
                  {items.map((receipt) => (
                    <tr className="hover:bg-canvas-50/60" key={receipt.id}>
                      <td className="px-4 py-4">
                        <button
                          className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600"
                          onClick={() => onSelectDetail(receipt.id)}
                          type="button"
                        >
                          {receipt.gr_number}
                        </button>
                        <p className="mt-1 text-xs text-slate-600 tabular-nums">ID #{receipt.id}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-ink-950">{receipt.po_number}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-ink-950">{receipt.supplier_name}</p>
                        <p className="mt-1 text-xs text-slate-600">{receipt.supplier_code}</p>
                      </td>
                      <td className="px-4 py-4 text-ink-950">{receipt.warehouse_name}</td>
                      <td className="px-4 py-4 text-slate-700 tabular-nums">
                        {formatGrDate(receipt.received_date)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${GR_STATUS_CLASSES[receipt.status]}`}
                        >
                          {GR_STATUS_LABELS[receipt.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {receipt.status === "DRAFT" && canManage && onEditDraft && (
                            <button
                              aria-label={`Ubah draft penerimaan ${receipt.gr_number}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                              onClick={() => onEditDraft(receipt)}
                              type="button"
                            >
                              <Pencil size={15} />
                              Ubah Draft
                            </button>
                          )}
                          <button
                            aria-label={`Lihat detail penerimaan ${receipt.gr_number}`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                            onClick={() => onSelectDetail(receipt.id)}
                            type="button"
                          >
                            <Eye size={16} />
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-line-200 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <span className="tabular-nums">
              Menampilkan {total === 0 ? 0 : offset + 1} sampai {pageEnd} dari {total} penerimaan
            </span>
            <div className="flex justify-end gap-2">
              <button
                aria-label="Halaman sebelumnya"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40"
                disabled={offset === 0}
                onClick={() => onPageChange(Math.max(0, offset - limit))}
                type="button"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                aria-label="Halaman berikutnya"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-500 disabled:opacity-40"
                disabled={pageEnd >= total}
                onClick={() => onPageChange(offset + limit)}
                type="button"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
