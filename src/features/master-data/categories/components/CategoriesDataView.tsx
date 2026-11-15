import { Edit3, Eye, Plus, PowerOff, RotateCcw } from "lucide-react";
import { ResponsiveDataView, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { MasterDataPagination } from "../../components/MasterDataPagination";
import { formatMasterDate } from "../../utils";
import type { Category } from "../types";

interface CategoriesDataViewProps {
  items: Category[];
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
  onOpenDetail: (category: Category) => void;
  onOpenEdit: (category: Category) => void;
  onOpenToggleStatus: (category: Category) => void;
  onLimitChange: (nextLimit: number) => void;
  onOffsetChange: (nextOffset: number) => void;
}

/** Tampilan responsif (kartu mobile + tabel desktop + paginasi) untuk daftar kategori barang. */
export function CategoriesDataView({
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
}: CategoriesDataViewProps) {
  const emptyAction = hasActiveFilters ? (
    <Button className="min-h-11 gap-2" onClick={onResetFilters} type="button" variant="outline">
      <RotateCcw aria-hidden="true" size={16} />
      Atur ulang filter
    </Button>
  ) : canManage ? (
    <Button className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700" onClick={onOpenCreate} type="button">
      <Plus aria-hidden="true" size={17} />
      Tambah kategori pertama
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
            ? "Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan seluruh kategori."
            : "Tambahkan kategori barang pertama agar Anda dapat mengelompokkan SKU di dalam gudang."
        }
        emptyTitle={
          hasActiveFilters
            ? "Tidak ada kategori barang yang sesuai dengan filter"
            : "Belum ada data kategori barang"
        }
        error={errorMessage}
        isLoading={isLoading}
        keyExtractor={(category) => category.id}
        loadingTitle="Memuat daftar kategori barang..."
        mobileListAriaLabel="Daftar kategori barang"
        mobileListClassName="divide-y divide-line-200 space-y-0"
        onRetry={onRetry}
        renderDesktop={(rows) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Daftar kategori barang</caption>
              <thead className="bg-canvas-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="w-20 px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nama kategori</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="w-32 px-4 py-3">Status</th>
                  <th className="w-44 px-4 py-3">Diperbarui pada</th>
                  <th className="w-64 px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((category) => (
                  <tr
                    className="border-t border-line-200 align-top transition hover:bg-canvas-50/50"
                    key={category.id}
                  >
                    <td className="px-4 py-4 text-xs font-semibold text-slate-600 tabular-nums">
                      #{category.id}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink-950">{category.name}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <p className="max-w-md leading-6">
                        {category.description || "Belum ada deskripsi"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={category.is_active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 tabular-nums">
                      {formatMasterDate(category.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail kategori ${category.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => onOpenDetail(category)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} />
                          Detail
                        </button>
                        {canManage && (
                          <>
                            <button
                              aria-label={`Ubah kategori ${category.name}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                              onClick={() => onOpenEdit(category)}
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={15} />
                              Ubah
                            </button>
                            <button
                              aria-label={
                                category.is_active
                                  ? `Nonaktifkan kategori ${category.name}`
                                  : `Aktifkan kembali kategori ${category.name}`
                              }
                              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold transition ${
                                category.is_active
                                  ? "text-red-700 hover:bg-red-100"
                                  : "text-teal-700 hover:bg-teal-100"
                              }`}
                              onClick={() => onOpenToggleStatus(category)}
                              type="button"
                            >
                              {category.is_active ? (
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
        renderMobileCard={(category) => (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  #{category.id}
                </span>
                <p className="mt-0.5 text-sm font-bold text-ink-950">{category.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {category.description || "Belum ada deskripsi"}
                </p>
              </div>
              <StatusBadge status={category.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>

            <p className="text-xs text-slate-600 tabular-nums">
              Diperbarui: {formatMasterDate(category.updated_at)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                aria-label={`Lihat detail kategori ${category.name}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                onClick={() => onOpenDetail(category)}
                type="button"
              >
                <Eye aria-hidden="true" size={15} />
                Detail
              </button>
              {canManage && (
                <>
                  <button
                    aria-label={`Ubah kategori ${category.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100/50 px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                    onClick={() => onOpenEdit(category)}
                    type="button"
                  >
                    <Edit3 aria-hidden="true" size={15} />
                    Ubah
                  </button>
                  <button
                    aria-label={
                      category.is_active
                        ? `Nonaktifkan kategori ${category.name}`
                        : `Aktifkan kembali kategori ${category.name}`
                    }
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-semibold transition ${
                      category.is_active
                        ? "border-red-200 text-red-700 hover:bg-red-100"
                        : "border-teal-200 text-teal-700 hover:bg-teal-100"
                    }`}
                    onClick={() => onOpenToggleStatus(category)}
                    type="button"
                  >
                    {category.is_active ? (
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
          itemLabel="kategori"
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
