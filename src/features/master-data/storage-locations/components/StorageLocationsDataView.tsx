import { Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { ResponsiveDataView, StatusBadge } from "@/components/shared";
import type { StorageLocationRecord } from "../types";

interface StorageLocationsDataViewProps {
  filteredLocations: StorageLocationRecord[];
  totalLocationsCount: number;
  hasActiveFilters: boolean;
  isLoading: boolean;
  canManage: boolean;
  reactivatingId: string | null;
  onOpenDetail: (location: StorageLocationRecord) => void;
  onOpenEdit: (location: StorageLocationRecord) => void;
  onOpenDeactivate: (location: StorageLocationRecord) => void;
  onReactivate: (location: StorageLocationRecord) => void;
}

function formatShortDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(parsed);
}

/** Tampilan responsif (kartu mobile + tabel desktop) untuk daftar lokasi penyimpanan. */
export function StorageLocationsDataView({
  filteredLocations,
  totalLocationsCount,
  hasActiveFilters,
  isLoading,
  canManage,
  reactivatingId,
  onOpenDetail,
  onOpenEdit,
  onOpenDeactivate,
  onReactivate,
}: StorageLocationsDataViewProps) {
  return (
    <>
      <ResponsiveDataView
        className="border-0 shadow-none"
        data={filteredLocations}
        emptyDescription={
          hasActiveFilters
            ? "Coba ubah kata kunci pencarian, pilihan gudang, atau tampilkan semua status."
            : "Tambahkan lokasi penyimpanan pertama untuk memetakan rak di dalam gudang."
        }
        emptyTitle={
          hasActiveFilters
            ? "Tidak ada lokasi penyimpanan yang cocok dengan filter."
            : "Belum ada data lokasi penyimpanan."
        }
        isLoading={isLoading}
        keyExtractor={(location) => location.id}
        loadingTitle="Memuat daftar lokasi penyimpanan..."
        mobileListAriaLabel="Daftar lokasi penyimpanan"
        mobileListClassName="divide-y divide-slate-200 space-y-0"
        renderDesktop={(rows) => (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-4 py-3">Kode Lokasi</th>
                  <th scope="col" className="px-4 py-3">Nama Lokasi</th>
                  <th scope="col" className="px-4 py-3">Gudang Induk</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Diperbarui</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((location) => (
                  <tr key={location.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                      {location.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {location.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {location.warehouse_code}
                      </span>
                      <span className="block text-xs text-slate-600">
                        {location.warehouse_name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={location.is_active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                      {formatShortDate(location.updated_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(location)}
                          aria-label={`Lihat detail lokasi ${location.name}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          title="Lihat detail"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(location)}
                              aria-label={`Edit lokasi ${location.name}`}
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                              title="Edit lokasi"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {location.is_active ? (
                              <button
                                type="button"
                                onClick={() => onOpenDeactivate(location)}
                                aria-label={`Nonaktifkan lokasi ${location.name}`}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-red-700 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-700"
                                title="Nonaktifkan lokasi"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={reactivatingId === location.id}
                                onClick={() => onReactivate(location)}
                                aria-label={`Aktifkan kembali lokasi ${location.name}`}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Aktifkan kembali"
                              >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderMobileCard={(location) => (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-900">
                  {location.code}
                </span>
                <p className="mt-1.5 text-sm font-bold text-slate-900">
                  {location.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-slate-800">
                    {location.warehouse_code}
                  </span>{" "}
                  · {location.warehouse_name}
                </p>
              </div>
              <StatusBadge status={location.is_active ? "ACTIVE" : "INACTIVE"} />
            </div>

            <p className="text-xs text-slate-600 tabular-nums">
              Diperbarui: {formatShortDate(location.updated_at)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenDetail(location)}
                aria-label={`Lihat detail lokasi ${location.name}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                title="Lihat detail"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Detail
              </button>
              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenEdit(location)}
                    aria-label={`Edit lokasi ${location.name}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    title="Edit lokasi"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Ubah
                  </button>
                  {location.is_active ? (
                    <button
                      type="button"
                      onClick={() => onOpenDeactivate(location)}
                      aria-label={`Nonaktifkan lokasi ${location.name}`}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-700"
                      title="Nonaktifkan lokasi"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Nonaktifkan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={reactivatingId === location.id}
                      onClick={() => onReactivate(location)}
                      aria-label={`Aktifkan kembali lokasi ${location.name}`}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-emerald-200 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Aktifkan kembali"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Aktifkan
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}
      />

      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Menampilkan{" "}
          <strong className="font-semibold text-slate-900">
            {filteredLocations.length}
          </strong>{" "}
          dari{" "}
          <strong className="font-semibold text-slate-900">
            {totalLocationsCount}
          </strong>{" "}
          lokasi penyimpanan.
        </span>
      </div>
    </>
  );
}
