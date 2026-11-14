import { Edit3, Eye, PowerOff, RotateCcw } from "lucide-react";
import { ResponsiveDataView, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { WarehouseRecord } from "../types";

interface WarehousesDataViewProps {
  warehouses: WarehouseRecord[];
  isLoading: boolean;
  canManage: boolean;
  onResetFilters: () => void;
  onOpenDetail: (warehouse: WarehouseRecord) => void;
  onOpenEdit: (warehouse: WarehouseRecord) => void;
  onOpenToggleStatus: (warehouse: WarehouseRecord) => void;
}

/** Tampilan responsif (kartu mobile + tabel desktop) untuk daftar gudang. */
export function WarehousesDataView({
  warehouses,
  isLoading,
  canManage,
  onResetFilters,
  onOpenDetail,
  onOpenEdit,
  onOpenToggleStatus,
}: WarehousesDataViewProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      <ResponsiveDataView
        className={isLoading || warehouses.length === 0 ? "border-0 shadow-none" : undefined}
        data={warehouses}
        emptyAction={
          <Button className="min-h-11 gap-2" onClick={onResetFilters} type="button" variant="outline">
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang filter
          </Button>
        }
        emptyDescription="Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan daftar gudang."
        emptyTitle="Tidak ada gudang yang sesuai dengan filter"
        isLoading={isLoading}
        keyExtractor={(wh) => wh.id}
        loadingTitle="Memuat daftar gudang..."
        mobileListAriaLabel="Daftar gudang"
        mobileListClassName="divide-y divide-line-200 space-y-0"
        renderDesktop={(rows) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">Daftar gudang</caption>
              <thead className="bg-canvas-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="w-36 px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama & Alamat Gudang</th>
                  <th className="w-48 px-4 py-3">Stok Negatif</th>
                  <th className="w-32 px-4 py-3">Status</th>
                  <th className="w-64 px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((wh) => (
                  <tr
                    className="border-t border-line-200 align-top transition hover:bg-canvas-50/50"
                    key={wh.id}
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                        {wh.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink-950">{wh.name}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {wh.address || "Alamat belum tercatat"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          wh.allow_negative_stock
                            ? "bg-amber-100 text-amber-700"
                            : "bg-canvas-50 text-slate-700"
                        }`}
                      >
                        {wh.allow_negative_stock ? "Diizinkan" : "Ditolak ketat"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={wh.is_active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail gudang ${wh.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => onOpenDetail(wh)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} />
                          Detail
                        </button>
                        {canManage && (
                          <>
                            <button
                              aria-label={`Ubah gudang ${wh.name}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                              onClick={() => onOpenEdit(wh)}
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={15} />
                              Ubah
                            </button>
                            <button
                              aria-label={
                                wh.is_active
                                  ? `Nonaktifkan gudang ${wh.name}`
                                  : `Aktifkan kembali gudang ${wh.name}`
                              }
                              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold transition ${
                                wh.is_active
                                  ? "text-red-700 hover:bg-red-100"
                                  : "text-teal-700 hover:bg-teal-100"
                              }`}
                              onClick={() => onOpenToggleStatus(wh)}
                              type="button"
                            >
                              {wh.is_active ? (
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
        renderMobileCard={(wh) => (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                  {wh.code}
                </span>
                <p className="mt-1.5 text-sm font-bold text-ink-950">{wh.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {wh.address || "Alamat belum tercatat"}
                </p>
              </div>
              <StatusBadge status={wh.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-canvas-50 px-3 py-2 text-xs">
              <span className="text-slate-600">Kebijakan stok negatif</span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 font-semibold ${
                  wh.allow_negative_stock
                    ? "bg-amber-100 text-amber-700"
                    : "bg-surface-0 text-slate-700"
                }`}
              >
                {wh.allow_negative_stock ? "Diizinkan" : "Ditolak ketat"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                aria-label={`Lihat detail gudang ${wh.name}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                onClick={() => onOpenDetail(wh)}
                type="button"
              >
                <Eye aria-hidden="true" size={15} />
                Detail
              </button>
              {canManage && (
                <>
                  <button
                    aria-label={`Ubah gudang ${wh.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100/50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                    onClick={() => onOpenEdit(wh)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    Ubah
                  </button>
                  <button
                    aria-label={
                      wh.is_active
                        ? `Nonaktifkan gudang ${wh.name}`
                        : `Aktifkan kembali gudang ${wh.name}`
                    }
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
                      wh.is_active
                        ? "border-red-200 text-red-700 hover:bg-red-100"
                        : "border-teal-200 text-teal-700 hover:bg-teal-100"
                    }`}
                    onClick={() => onOpenToggleStatus(wh)}
                    type="button"
                  >
                    {wh.is_active ? (
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

      {!isLoading && warehouses.length > 0 && (
        <div className="flex flex-col items-start justify-between gap-2 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums sm:flex-row sm:items-center">
          <span>
            Menampilkan 1 sampai {warehouses.length} dari {warehouses.length} gudang
          </span>
        </div>
      )}
    </section>
  );
}
