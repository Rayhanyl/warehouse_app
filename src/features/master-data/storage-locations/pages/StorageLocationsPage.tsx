import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import {
  buildStorageLocationsCsv,
  initialSampleStorageLocations,
  sampleWarehouseOptions,
} from "../api";
import { StorageLocationDeleteDialog } from "../components/StorageLocationDeleteDialog";
import { StorageLocationDetailDialog } from "../components/StorageLocationDetailDialog";
import { StorageLocationFormDialog } from "../components/StorageLocationFormDialog";
import type {
  StorageLocationFormPayload,
  StorageLocationRecord,
  StorageLocationStatusFilter,
} from "../types";

interface NotificationBanner {
  type: "success" | "error";
  message: string;
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

export function StorageLocationsPage() {
  const { can } = usePermission();
  const canManage = can("location:manage") || can("master:manage");

  const [locations, setLocations] = useState<StorageLocationRecord[]>(
    initialSampleStorageLocations,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StorageLocationStatusFilter>("all");
  const [banner, setBanner] = useState<NotificationBanner | null>(null);

  const [detailTarget, setDetailTarget] = useState<StorageLocationRecord | null>(null);
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    record: StorageLocationRecord | null;
  }>({
    open: false,
    mode: "create",
    record: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<StorageLocationRecord | null>(null);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return locations.filter((item) => {
      if (warehouseFilter !== "all" && item.warehouse_id !== warehouseFilter) {
        return false;
      }
      if (statusFilter === "active" && !item.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && item.is_active) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        item.code.toLowerCase().includes(normalizedQuery) ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.warehouse_code.toLowerCase().includes(normalizedQuery) ||
        item.warehouse_name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [locations, searchQuery, warehouseFilter, statusFilter]);

  const handleOpenCreate = () => {
    setFormState({ open: true, mode: "create", record: null });
  };

  const handleOpenEdit = (location: StorageLocationRecord) => {
    setFormState({ open: true, mode: "edit", record: location });
  };

  const handleFormSubmit = (payload: StorageLocationFormPayload) => {
    const nowIso = new Date().toISOString();
    const selectedWarehouse =
      sampleWarehouseOptions.find((wh) => wh.id === payload.warehouse_id) ??
      sampleWarehouseOptions[0];

    if (formState.mode === "create") {
      const nextRecord: StorageLocationRecord = {
        id: `loc-${Date.now()}`,
        warehouse_id: selectedWarehouse.id,
        warehouse_code: selectedWarehouse.code,
        warehouse_name: selectedWarehouse.name,
        code: payload.code,
        name: payload.name,
        is_active: true,
        created_by: "usr-session",
        created_at: nowIso,
        updated_at: nowIso,
      };
      setLocations((prev) => [nextRecord, ...prev]);
      setFormState({ open: false, mode: "create", record: null });
      setBanner({
        type: "success",
        message: `Lokasi penyimpanan "${nextRecord.name}" (${nextRecord.code}) berhasil ditambahkan ke daftar contoh.`,
      });
      return;
    }

    if (formState.mode === "edit" && formState.record) {
      const targetId = formState.record.id;
      setLocations((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? {
                ...item,
                warehouse_id: selectedWarehouse.id,
                warehouse_code: selectedWarehouse.code,
                warehouse_name: selectedWarehouse.name,
                code: payload.code,
                name: payload.name,
                is_active: payload.is_active,
                updated_at: nowIso,
              }
            : item,
        ),
      );
      setFormState({ open: false, mode: "create", record: null });
      setBanner({
        type: "success",
        message: `Lokasi penyimpanan "${payload.name}" (${payload.code}) berhasil diperbarui.`,
      });
    }
  };

  const handleConfirmDeactivate = (location: StorageLocationRecord) => {
    const nowIso = new Date().toISOString();
    setLocations((prev) =>
      prev.map((item) =>
        item.id === location.id
          ? {
              ...item,
              is_active: false,
              updated_at: nowIso,
            }
          : item,
      ),
    );
    setDeleteTarget(null);
    setBanner({
      type: "success",
      message: `Lokasi penyimpanan "${location.name}" berhasil dinonaktifkan.`,
    });
  };

  const handleReactivate = (location: StorageLocationRecord) => {
    const nowIso = new Date().toISOString();
    setLocations((prev) =>
      prev.map((item) =>
        item.id === location.id
          ? {
              ...item,
              is_active: true,
              updated_at: nowIso,
            }
          : item,
      ),
    );
    setBanner({
      type: "success",
      message: `Lokasi penyimpanan "${location.name}" berhasil diaktifkan kembali.`,
    });
  };

  const handleDownloadCsv = () => {
    if (filteredLocations.length === 0) {
      setBanner({
        type: "error",
        message: "Tidak ada data lokasi penyimpanan untuk diunduh pada filter saat ini.",
      });
      return;
    }

    try {
      const csvContent = buildStorageLocationsCsv(filteredLocations);
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute("download", `lokasi-penyimpanan-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBanner({
        type: "success",
        message: `Berhasil mengunduh ${filteredLocations.length} baris data lokasi penyimpanan (CSV).`,
      });
    } catch {
      setBanner({
        type: "error",
        message: "Gagal membuat file unduhan data lokasi penyimpanan.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lokasi Penyimpanan"
        description="Kelola daftar zona karantina, lorong rak, dan bin penyimpanan di setiap gudang."
        action={
          <>
            <span className="inline-flex min-h-11 items-center rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              Contoh data
            </span>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={filteredLocations.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <span>Unduh CSV</span>
            </button>
            {canManage ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah lokasi</span>
              </button>
            ) : null}
          </>
        }
      />

      {banner ? (
        <div
          role={banner.type === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {banner.type === "success" ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"
                aria-hidden="true"
              />
            ) : null}
            <p className="font-medium">{banner.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="Tutup notifikasi"
            className="inline-flex min-h-11 min-w-11 -my-1.5 -mr-1.5 items-center justify-center rounded-md text-current opacity-75 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <section
        aria-label="Filter dan daftar lokasi penyimpanan"
        className="rounded-lg border border-slate-200 bg-white shadow-xs"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor="storage-location-search-input" className="sr-only">
                Cari kode, nama lokasi, atau gudang
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="storage-location-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari kode atau nama lokasi..."
                className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="w-full sm:w-64">
              <label htmlFor="storage-location-warehouse-filter" className="sr-only">
                Filter berdasarkan gudang
              </label>
              <select
                id="storage-location-warehouse-filter"
                value={warehouseFilter}
                onChange={(event) => setWarehouseFilter(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="all">Semua gudang ({sampleWarehouseOptions.length})</option>
                {sampleWarehouseOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} ({item.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter status lokasi penyimpanan"
              className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5"
            >
              {(
                [
                  { key: "all", label: "Semua" },
                  { key: "active", label: "Aktif" },
                  { key: "inactive", label: "Nonaktif" },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`min-h-10 rounded-xs px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700 ${
                      active
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filteredLocations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              {searchQuery.trim() || warehouseFilter !== "all" || statusFilter !== "all"
                ? "Tidak ada lokasi penyimpanan yang cocok dengan filter."
                : "Belum ada data lokasi penyimpanan."}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {searchQuery.trim() || warehouseFilter !== "all" || statusFilter !== "all"
                ? "Coba ubah kata kunci pencarian, pilihan gudang, atau tampilkan semua status."
                : "Tambahkan lokasi penyimpanan pertama untuk memetakan rak di dalam gudang."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-4 py-3">
                    Kode Lokasi
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Nama Lokasi
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Gudang Induk
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Diperbarui
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                      {location.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{location.name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {location.warehouse_code}
                      </span>
                      <span className="block text-xs text-slate-600">
                        {location.warehouse_name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {location.is_active ? (
                        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                      {formatShortDate(location.updated_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(location)}
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
                              onClick={() => handleOpenEdit(location)}
                              aria-label={`Edit lokasi ${location.name}`}
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                              title="Edit lokasi"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {location.is_active ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(location)}
                                aria-label={`Nonaktifkan lokasi ${location.name}`}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-red-700 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-700"
                                title="Nonaktifkan lokasi"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivate(location)}
                                aria-label={`Aktifkan kembali lokasi ${location.name}`}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Menampilkan{" "}
            <strong className="font-semibold text-slate-900">{filteredLocations.length}</strong>{" "}
            dari <strong className="font-semibold text-slate-900">{locations.length}</strong>{" "}
            lokasi penyimpanan contoh.
          </span>
          <span>
            Mode pratinjau: perubahan disimpan sementara pada sesi browser ini.
          </span>
        </div>
      </section>

      <StorageLocationDetailDialog
        location={detailTarget}
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={(location) => handleOpenEdit(location)}
      />

      <StorageLocationFormDialog
        open={formState.open}
        mode={formState.mode}
        initialData={formState.record}
        warehouseOptions={sampleWarehouseOptions}
        existingLocations={locations}
        onClose={() => setFormState({ open: false, mode: "create", record: null })}
        onSubmit={handleFormSubmit}
      />

      <StorageLocationDeleteDialog
        location={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}
