import { Edit3, Eye, Plus, PowerOff, RotateCcw } from "lucide-react";
import { ResponsiveDataView, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { MasterDataPagination } from "../../components/MasterDataPagination";
import { formatMasterDate } from "../../utils";
import type { Uom } from "../types";

interface UomsDataViewProps {
  items: Uom[];
  total: number;
  limit: number;
  offset: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage: string | null;
  hasActiveFilters: boolean;
  canManage: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onOpenDetail: (uom: Uom) => void;
  onOpenEdit: (uom: Uom) => void;
  onOpenToggleStatus: (uom: Uom) => void;
  onLimitChange: (nextLimit: number) => void;
  onOffsetChange: (nextOffset: number) => void;
}

/** Tampilan responsif (kartu mobile + tabel desktop + paginasi) untuk daftar satuan ukur. */
export function UomsDataView({
  items,
  total,
  limit,
  offset,
  pageSize,
  isLoading,
  isFetching,
  errorMessage,
  hasActiveFilters,
  canManage,
  onRetry,
  onResetFilters,
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
  onOpenToggleStatus,
  onLimitChange,
  onOffsetChange,
}: UomsDataViewProps) {
  const emptyAction = hasActiveFilters ? (
    <Button className="min-h-11 gap-2" onClick={onResetFilters} type="button" variant="outline">
      <RotateCcw aria-hidden="true" size={16} />
      Atur ulang filter
    </Button>
  ) : canManage ? (
    <Button className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700" onClick={onOpenCreate} type="button">
      <Plus aria-hidden="true" size={17} />
      Tambah satuan ukur pertama
    </Button>
  ) : undefined;

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      <ResponsiveDataView
        className={isLoading || errorMessage || items.length === 0 ? "border-0 shadow-none" : undefined}
        data={items}
        emptyAction={emptyAction}
        emptyDescription={
          hasActiveFilters
            ? "Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan seluruh satuan ukur."
            : "Tambahkan satuan ukur pertama (seperti PCS, KG, atau BOX) untuk digunakan pada pendaftaran barang (SKU)."
        }
        emptyTitle={
          hasActiveFilters
            ? "Tidak ada satuan ukur yang sesuai dengan filter"
            : "Belum ada data satuan ukur"
        }
        error={errorMessage}
        isLoading={isLoading}
        keyExtractor={(uom) => uom.id}
        loadingTitle="Memuat daftar satuan ukur..."
        mobileListAriaLabel="Daftar satuan ukur (UoM)"
        mobileListClassName="divide-y divide-line-200 space-y-0"
        onRetry={onRetry}
        renderDesktop={(rows) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <caption className="sr-only">Daftar satuan ukur (UoM)</caption>
              <thead className="bg-canvas-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="w-20 px-4 py-3">ID</th>
                  <th className="w-32 px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama satuan</th>
                  <th className="w-48 px-4 py-3">Presisi kuantitas</th>
                  <th className="w-32 px-4 py-3">Status</th>
                  <th className="w-44 px-4 py-3">Diperbarui pada</th>
                  <th className="w-64 px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((uom) => (
                  <tr
                    className="border-t border-line-200 align-top transition hover:bg-canvas-50/50"
                    key={uom.id}
                  >
                    <td className="px-4 py-4 text-xs font-semibold text-slate-600 tabular-nums">
                      #{uom.id}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                        {uom.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink-950">{uom.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          uom.allow_decimal
                            ? "bg-blue-100 text-blue-700"
                            : "bg-canvas-50 text-slate-700"
                        }`}
                      >
                        {uom.allow_decimal ? "Desimal (4 digit)" : "Bilangan bulat"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={uom.is_active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 tabular-nums">
                      {formatMasterDate(uom.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail satuan ${uom.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => onOpenDetail(uom)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} />
                          Detail
                        </button>
                        {canManage && (
                          <>
                            <button
                              aria-label={`Ubah satuan ${uom.name}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                              onClick={() => onOpenEdit(uom)}
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={15} />
                              Ubah
                            </button>
                            <button
                              aria-label={
                                uom.is_active
                                  ? `Nonaktifkan satuan ${uom.name}`
                                  : `Aktifkan kembali satuan ${uom.name}`
                              }
                              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold transition ${
                                uom.is_active
                                  ? "text-red-700 hover:bg-red-100"
                                  : "text-teal-700 hover:bg-teal-100"
                              }`}
                              onClick={() => onOpenToggleStatus(uom)}
                              type="button"
                            >
                              {uom.is_active ? (
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
        renderMobileCard={(uom) => (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 tabular-nums">
                    #{uom.id}
                  </span>
                  <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 tabular-nums">
                    {uom.code}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-ink-950">{uom.name}</p>
              </div>
              <StatusBadge status={uom.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-canvas-50 px-3 py-2 text-xs">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 font-semibold ${
                  uom.allow_decimal
                    ? "bg-blue-100 text-blue-700"
                    : "bg-surface-0 text-slate-700"
                }`}
              >
                {uom.allow_decimal ? "Desimal (4 digit)" : "Bilangan bulat"}
              </span>
              <span className="text-slate-600 tabular-nums">
                {formatMasterDate(uom.updated_at)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                aria-label={`Lihat detail satuan ${uom.name}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                onClick={() => onOpenDetail(uom)}
                type="button"
              >
                <Eye aria-hidden="true" size={15} />
                Detail
              </button>
              {canManage && (
                <>
                  <button
                    aria-label={`Ubah satuan ${uom.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100/50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                    onClick={() => onOpenEdit(uom)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    Ubah
                  </button>
                  <button
                    aria-label={
                      uom.is_active
                        ? `Nonaktifkan satuan ${uom.name}`
                        : `Aktifkan kembali satuan ${uom.name}`
                    }
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
                      uom.is_active
                        ? "border-red-200 text-red-700 hover:bg-red-100"
                        : "border-teal-200 text-teal-700 hover:bg-teal-100"
                    }`}
                    onClick={() => onOpenToggleStatus(uom)}
                    type="button"
                  >
                    {uom.is_active ? (
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

      {!isLoading && !errorMessage && total > 0 && (
        <MasterDataPagination
          isFetching={isFetching}
          itemLabel="satuan ukur"
          limit={limit}
          offset={offset}
          onLimitChange={onLimitChange}
          onOffsetChange={onOffsetChange}
          pageSize={pageSize}
          total={total}
        />
      )}
    </section>
  );
}
