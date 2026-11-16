import { Edit3, Eye, PowerOff, RotateCcw } from "lucide-react";
import { ResponsiveDataView, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { MasterDataPagination } from "../../components/MasterDataPagination";
import type { StockItem } from "../types";

interface StocksDataViewProps {
  items: StockItem[];
  total?: number;
  limit?: number;
  offset?: number;
  isLoading: boolean;
  canManage: boolean;
  onResetFilters: () => void;
  onOpenDetail: (item: StockItem) => void;
  onOpenEdit: (item: StockItem) => void;
  onOpenToggleStatus: (item: StockItem) => void;
  onLimitChange?: (nextLimit: number) => void;
  onOffsetChange?: (nextOffset: number) => void;
}

/** Tampilan responsif (kartu mobile + tabel desktop) untuk daftar master barang (SKU). */
export function StocksDataView({
  items,
  total,
  limit = 20,
  offset = 0,
  isLoading,
  canManage,
  onResetFilters,
  onOpenDetail,
  onOpenEdit,
  onOpenToggleStatus,
  onLimitChange = () => {},
  onOffsetChange = () => {},
}: StocksDataViewProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      <ResponsiveDataView
        className={isLoading || items.length === 0 ? "border-0 shadow-none" : undefined}
        data={items}
        emptyAction={
          <Button className="min-h-11 gap-2" onClick={onResetFilters} type="button" variant="outline">
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang filter
          </Button>
        }
        emptyDescription="Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan daftar barang."
        emptyTitle="Tidak ada barang yang sesuai dengan filter"
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        loadingTitle="Memuat daftar barang..."
        mobileListAriaLabel="Daftar barang (SKU)"
        mobileListClassName="divide-y divide-line-200 space-y-0"
        renderDesktop={(rows) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">Daftar barang (SKU)</caption>
              <thead className="bg-canvas-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="w-36 px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Nama barang</th>
                  <th className="w-48 px-4 py-3">Kategori</th>
                  <th className="w-36 px-4 py-3">Satuan dasar</th>
                  <th className="w-32 px-4 py-3">Status</th>
                  <th className="w-64 px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr
                    className="border-t border-line-200 align-top transition hover:bg-canvas-50/50"
                    key={item.id}
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                        {item.sku}
                      </span>
                      {item.barcode && (
                        <p className="mt-1 text-xs font-medium text-slate-600 tabular-nums">
                          BC: {item.barcode}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink-950">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {item.description || "Tanpa deskripsi"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                      {item.category_name}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-ink-950 tabular-nums">
                      {item.uom_code} ({item.uom_name})
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.is_active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail barang ${item.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => onOpenDetail(item)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} />
                          Detail
                        </button>
                        {canManage && (
                          <>
                            <button
                              aria-label={`Ubah barang ${item.name}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                              onClick={() => onOpenEdit(item)}
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={15} />
                              Ubah
                            </button>
                            <button
                              aria-label={
                                item.is_active
                                  ? `Nonaktifkan barang ${item.name}`
                                  : `Aktifkan kembali barang ${item.name}`
                              }
                              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold transition ${
                                item.is_active
                                  ? "text-red-700 hover:bg-red-100"
                                  : "text-teal-700 hover:bg-teal-100"
                              }`}
                              onClick={() => onOpenToggleStatus(item)}
                              type="button"
                            >
                              {item.is_active ? (
                                <>
                                  <PowerOff aria-hidden="true" size={15} />
                                  Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <RotateCcw aria-hidden="true" size={15} />
                                  Aktifkan
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderMobileCard={(item) => (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                    {item.sku}
                  </span>
                  {item.barcode && (
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      BC: {item.barcode}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-bold text-ink-950">{item.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {item.description || "Tanpa deskripsi"}
                </p>
              </div>
              <StatusBadge status={item.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>

            <dl className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-xs">
              <div>
                <dt className="text-slate-600">Kategori</dt>
                <dd className="mt-0.5 font-semibold text-ink-950">
                  {item.category_name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600">Satuan dasar</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {item.uom_code} ({item.uom_name})
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              <button
                aria-label={`Lihat detail barang ${item.name}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                onClick={() => onOpenDetail(item)}
                type="button"
              >
                <Eye aria-hidden="true" size={15} />
                Detail
              </button>
              {canManage && (
                <>
                  <button
                    aria-label={`Ubah barang ${item.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100/50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                    onClick={() => onOpenEdit(item)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    Ubah
                  </button>
                  <button
                    aria-label={
                      item.is_active
                        ? `Nonaktifkan barang ${item.name}`
                        : `Aktifkan kembali barang ${item.name}`
                    }
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
                      item.is_active
                        ? "border-red-200 text-red-700 hover:bg-red-100"
                        : "border-teal-200 text-teal-700 hover:bg-teal-100"
                    }`}
                    onClick={() => onOpenToggleStatus(item)}
                    type="button"
                  >
                    {item.is_active ? (
                      <>
                        <PowerOff aria-hidden="true" size={15} />
                        Nonaktifkan
                      </>
                    ) : (
                      <>
                        <RotateCcw aria-hidden="true" size={15} />
                        Aktifkan
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      />

      {!isLoading && items.length > 0 && (
        <MasterDataPagination
          itemLabel="barang"
          limit={limit}
          offset={offset}
          onLimitChange={onLimitChange}
          onOffsetChange={onOffsetChange}
          pageSize={items.length}
          total={total ?? items.length}
        />
      )}
    </section>
  );
}
