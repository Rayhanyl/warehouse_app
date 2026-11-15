import { ChevronLeft, ChevronRight, Eye, Plus, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyIdr } from "@/lib/utils";
import { mapPurchaseOrderError } from "../api";
import { formatPoDate, PO_STATUS_CLASSES, PO_STATUS_LABELS } from "../constants";
import type { PurchaseOrder } from "../types";

interface PurchaseOrdersDataViewProps {
  items: PurchaseOrder[];
  total: number;
  offset: number;
  limit: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isMobile: boolean;
  hasFilters: boolean;
  canCreate: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onSelectDetail: (id: number) => void;
  onPageChange: (nextOffset: number) => void;
}

export function PurchaseOrdersDataView({
  items,
  total,
  offset,
  limit,
  isLoading,
  isError,
  error,
  isMobile,
  hasFilters,
  canCreate,
  onRetry,
  onResetFilters,
  onSelectDetail,
  onPageChange,
}: PurchaseOrdersDataViewProps) {
  const pageEnd = Math.min(offset + limit, total);

  if (isLoading) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-sm text-slate-700 shadow-[var(--shadow-1)]"
        role="status"
      >
        Memuat daftar purchase order...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-100 p-6 text-sm text-red-700"
        role="alert"
      >
        <p className="font-semibold">Daftar purchase order belum dapat dimuat</p>
        <p className="mt-1 text-slate-700">
          {mapPurchaseOrderError(error, "Terjadi kendala saat menghubungi server.").message}
        </p>
        <button
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-red-600 px-4 font-semibold text-surface-0 hover:bg-red-700"
          onClick={onRetry}
          type="button"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center shadow-[var(--shadow-1)]">
        <p className="font-semibold text-ink-950">
          {hasFilters
            ? "Tidak ada data yang cocok dengan filter"
            : "Belum ada purchase order di gudang ini"}
        </p>
        <p className="mx-auto mt-2 max-w-[55ch] text-sm leading-6 text-slate-700">
          {hasFilters
            ? "Periksa kata kunci pencarian atau hapus beberapa filter untuk melihat kembali seluruh daftar."
            : "Catat pengadaan pertama untuk mulai memproses penerimaan barang di gudang terpilih."}
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
        ) : canCreate ? (
          <Link
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
            to="/purchase-orders/new"
          >
            <Plus size={16} />
            Buat purchase order
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      {isMobile ? (
        <ul aria-label="Daftar purchase order" className="divide-y divide-line-200">
          {items.map((po) => (
            <li className="space-y-3 p-4" key={po.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600"
                    onClick={() => onSelectDetail(po.id)}
                    type="button"
                  >
                    {po.po_number}
                  </button>
                  <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                    ID #{po.id} · {formatPoDate(po.order_date)}
                    {po.expected_delivery_date
                      ? ` · Est. kirim ${formatPoDate(po.expected_delivery_date)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${PO_STATUS_CLASSES[po.status]}`}
                  >
                    {PO_STATUS_LABELS[po.status]}
                  </span>
                  {po.is_overdue && (
                    <span className="inline-flex shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      Terlambat {po.days_overdue} hari
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50/70 p-3 text-xs">
                <div>
                  <p className="text-slate-600">Pemasok</p>
                  <p className="mt-0.5 font-semibold text-ink-950">{po.supplier_name}</p>
                </div>
                <div>
                  <p className="text-slate-600">Gudang ({po.line_count} baris)</p>
                  <p className="mt-0.5 font-semibold text-ink-950">{po.warehouse_name}</p>
                </div>
              </div>
              <button
                aria-label={`Lihat detail purchase order ${po.po_number}`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                onClick={() => onSelectDetail(po.id)}
                type="button"
              >
                <Eye size={16} />
                Detail
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <caption className="sr-only">Daftar purchase order</caption>
            <thead className="bg-canvas-50 text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Nomor dokumen</th>
                <th className="px-4 py-3">Pemasok</th>
                <th className="px-4 py-3">Gudang tujuan</th>
                <th className="px-4 py-3">Tanggal pesanan</th>
                <th className="px-4 py-3">Baris</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200">
              {items.map((po) => (
                <tr className="hover:bg-canvas-50/60" key={po.id}>
                  <td className="px-4 py-4">
                    <button
                      className="font-semibold text-teal-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-600"
                      onClick={() => onSelectDetail(po.id)}
                      type="button"
                    >
                      {po.po_number}
                    </button>
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">ID #{po.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-ink-950">{po.supplier_name}</p>
                    <p className="mt-1 text-xs text-slate-600">{po.supplier_code}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-ink-950">{po.warehouse_name}</p>
                    <p className="mt-1 text-xs text-slate-600">{po.warehouse_code}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700 tabular-nums">
                    <p>{formatPoDate(po.order_date)}</p>
                    {po.expected_delivery_date && (
                      <p className="mt-1 text-xs text-slate-600">
                        Est. kirim: {formatPoDate(po.expected_delivery_date)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-700 tabular-nums">
                    <span>{po.line_count}</span>
                    {Number(po.total_amount ?? 0) > 0 && (
                      <p className="mt-1 text-xs font-semibold text-ink-950">
                        {formatCurrencyIdr(po.total_amount)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PO_STATUS_CLASSES[po.status]}`}
                      >
                        {PO_STATUS_LABELS[po.status]}
                      </span>
                      {po.is_overdue && (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                          Terlambat {po.days_overdue} hari
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      aria-label={`Lihat detail purchase order ${po.po_number}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 px-3 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                      onClick={() => onSelectDetail(po.id)}
                      type="button"
                    >
                      <Eye size={16} />
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
          Menampilkan {offset + 1} sampai {pageEnd} dari {total} purchase order
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
  );
}
