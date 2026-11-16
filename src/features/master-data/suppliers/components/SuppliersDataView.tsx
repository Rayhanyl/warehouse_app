import { Edit3, Eye, PowerOff, RotateCcw } from "lucide-react";
import { ResponsiveDataView, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { MasterDataPagination } from "../../components/MasterDataPagination";
import type { Supplier } from "../types";

interface SuppliersDataViewProps {
  suppliers: Supplier[];
  total?: number;
  limit?: number;
  offset?: number;
  isLoading: boolean;
  canManage: boolean;
  onResetFilters: () => void;
  onOpenDetail: (supplier: Supplier) => void;
  onOpenEdit: (supplier: Supplier) => void;
  onOpenToggleStatus: (supplier: Supplier) => void;
  onLimitChange?: (nextLimit: number) => void;
  onOffsetChange?: (nextOffset: number) => void;
}

/** Tampilan responsif (kartu mobile + tabel desktop) untuk daftar pemasok. */
export function SuppliersDataView({
  suppliers,
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
}: SuppliersDataViewProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
      <ResponsiveDataView
        className={isLoading || suppliers.length === 0 ? "border-0 shadow-none" : undefined}
        data={suppliers}
        emptyAction={
          <Button className="min-h-11 gap-2" onClick={onResetFilters} type="button" variant="outline">
            <RotateCcw aria-hidden="true" size={16} />
            Atur ulang filter
          </Button>
        }
        emptyDescription="Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan daftar pemasok."
        emptyTitle="Tidak ada pemasok yang sesuai dengan filter"
        isLoading={isLoading}
        keyExtractor={(supplier) => supplier.id}
        loadingTitle="Memuat daftar pemasok..."
        mobileListAriaLabel="Daftar pemasok"
        mobileListClassName="divide-y divide-line-200 space-y-0"
        renderDesktop={(rows) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">Daftar pemasok</caption>
              <thead className="bg-canvas-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="w-32 px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama pemasok</th>
                  <th className="px-4 py-3">Narahubung & Kontak</th>
                  <th className="w-32 px-4 py-3">Status</th>
                  <th className="w-64 px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((supplier) => (
                  <tr
                    className="border-t border-line-200 align-top transition hover:bg-canvas-50/50"
                    key={supplier.id}
                  >
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                        {supplier.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink-950">{supplier.name}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {supplier.address || "Alamat belum tercatat"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-700">
                      <p className="font-semibold text-ink-950">
                        {supplier.contact_person || "Belum dicantumkan"}
                      </p>
                      <p className="mt-1 tabular-nums">
                        {supplier.phone || "Tanpa telepon"} ·{" "}
                        {supplier.email || "Tanpa email"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={supplier.is_active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail pemasok ${supplier.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => onOpenDetail(supplier)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} />
                          Detail
                        </button>
                        {canManage && (
                          <>
                            <button
                              aria-label={`Ubah pemasok ${supplier.name}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                              onClick={() => onOpenEdit(supplier)}
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={15} />
                              Ubah
                            </button>
                            <button
                              aria-label={
                                supplier.is_active
                                  ? `Nonaktifkan pemasok ${supplier.name}`
                                  : `Aktifkan kembali pemasok ${supplier.name}`
                              }
                              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold transition ${
                                supplier.is_active
                                  ? "text-red-700 hover:bg-red-100"
                                  : "text-teal-700 hover:bg-teal-100"
                              }`}
                              onClick={() => onOpenToggleStatus(supplier)}
                              type="button"
                            >
                              {supplier.is_active ? (
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
        renderMobileCard={(supplier) => (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex rounded-[var(--radius-sm)] bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 tabular-nums">
                  {supplier.code}
                </span>
                <p className="mt-1.5 text-sm font-bold text-ink-950">
                  {supplier.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {supplier.address || "Alamat belum tercatat"}
                </p>
              </div>
              <StatusBadge status={supplier.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>

            <div className="rounded-[var(--radius-md)] bg-canvas-50 p-3 text-xs text-slate-700">
              <p className="font-semibold text-ink-950">
                {supplier.contact_person || "Belum dicantumkan"}
              </p>
              <p className="mt-1 tabular-nums">
                {supplier.phone || "Tanpa telepon"} ·{" "}
                {supplier.email || "Tanpa email"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                aria-label={`Lihat detail pemasok ${supplier.name}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                onClick={() => onOpenDetail(supplier)}
                type="button"
              >
                <Eye aria-hidden="true" size={15} />
                Detail
              </button>
              {canManage && (
                <>
                  <button
                    aria-label={`Ubah pemasok ${supplier.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100/50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                    onClick={() => onOpenEdit(supplier)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    Ubah
                  </button>
                  <button
                    aria-label={
                      supplier.is_active
                        ? `Nonaktifkan pemasok ${supplier.name}`
                        : `Aktifkan kembali pemasok ${supplier.name}`
                    }
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
                      supplier.is_active
                        ? "border-red-200 text-red-700 hover:bg-red-100"
                        : "border-teal-200 text-teal-700 hover:bg-teal-100"
                    }`}
                    onClick={() => onOpenToggleStatus(supplier)}
                    type="button"
                  >
                    {supplier.is_active ? (
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

      {!isLoading && suppliers.length > 0 && (
        <MasterDataPagination
          itemLabel="pemasok"
          limit={limit}
          offset={offset}
          onLimitChange={onLimitChange}
          onOffsetChange={onOffsetChange}
          pageSize={suppliers.length}
          total={total ?? suppliers.length}
        />
      )}
    </section>
  );
}
