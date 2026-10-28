import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Filter,
  Plus,
  PowerOff,
  RotateCcw,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import { buildWarehousesCsv, initialSampleWarehouses } from "../api";
import { WarehouseDeleteDialog } from "../components/WarehouseDeleteDialog";
import { WarehouseDetailDialog } from "../components/WarehouseDetailDialog";
import { WarehouseFormDialog } from "../components/WarehouseFormDialog";
import type {
  WarehouseFormPayload,
  WarehouseRecord,
  WarehouseStatusFilter,
} from "../types";

export function WarehousesPage() {
  const { can } = usePermission();
  const canManage = can("warehouse:manage") || can("master:manage");

  const [records, setRecords] = useState<WarehouseRecord[]>(
    initialSampleWarehouses,
  );
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<WarehouseStatusFilter>("all");
  const [draftStatus, setDraftStatus] = useState<WarehouseStatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);

  const [detailTarget, setDetailTarget] = useState<WarehouseRecord | null>(
    null,
  );
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    warehouse: WarehouseRecord | null;
  }>({
    isOpen: false,
    mode: "create",
    warehouse: null,
  });
  const [confirmTarget, setConfirmTarget] = useState<WarehouseRecord | null>(
    null,
  );

  const filteredWarehouses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((wh) => {
      if (statusFilter === "active" && !wh.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && wh.is_active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        wh.code.toLocaleLowerCase().includes(query) ||
        wh.name.toLocaleLowerCase().includes(query) ||
        (wh.address ?? "").toLocaleLowerCase().includes(query)
      );
    });
  }, [records, search, statusFilter]);

  function notifySuccess(message: string) {
    setNotice(message);
    toast.success(message);
  }

  function handleApplyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(draftSearch);
    setStatusFilter(draftStatus);
  }

  function handleResetFilter() {
    setDraftSearch("");
    setDraftStatus("all");
    setSearch("");
    setStatusFilter("all");
  }

  function handleSaveWarehouse(payload: WarehouseFormPayload) {
    const now = new Date().toISOString();
    if (formState.mode === "create") {
      const nextId =
        records.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      const created: WarehouseRecord = {
        id: nextId,
        ...payload,
        created_by: 1,
        created_at: now,
        updated_at: now,
      };
      setRecords((current) => [created, ...current]);
      setFormState({ isOpen: false, mode: "create", warehouse: null });
      notifySuccess(`Gudang "${created.name} (${created.code})" berhasil ditambahkan (Contoh data).`);
      return;
    }

    if (!formState.warehouse) {
      return;
    }

    const targetId = formState.warehouse.id;
    setRecords((current) =>
      current.map((item) =>
        item.id === targetId
          ? { ...item, ...payload, updated_at: now }
          : item,
      ),
    );
    setFormState({ isOpen: false, mode: "create", warehouse: null });
    notifySuccess(`Gudang "${payload.name} (${payload.code})" berhasil diperbarui (Contoh data).`);
  }

  function handleConfirmToggle(warehouse: WarehouseRecord) {
    const nextActive = !warehouse.is_active;
    const now = new Date().toISOString();
    setRecords((current) =>
      current.map((item) =>
        item.id === warehouse.id
          ? { ...item, is_active: nextActive, updated_at: now }
          : item,
      ),
    );
    setConfirmTarget(null);
    notifySuccess(
      nextActive
        ? `Gudang "${warehouse.name}" berhasil diaktifkan kembali (Contoh data).`
        : `Gudang "${warehouse.name}" berhasil dinonaktifkan (Contoh data).`,
    );
  }

  function handleDownloadCsv() {
    const csvContent = buildWarehousesCsv(filteredWarehouses);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    if (typeof URL.createObjectURL === "function") {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "gudang-contoh-data.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    }
    notifySuccess(
      `Data gudang (${filteredWarehouses.length} baris) berhasil diunduh.`,
    );
  }

  return (
    <>
      <PageHeader
        action={
          <>
            <span className="inline-flex min-h-11 items-center rounded-full bg-amber-100 px-3.5 text-xs font-bold text-amber-700">
              Contoh data
            </span>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={handleDownloadCsv}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              Unduh CSV
            </button>
            {canManage && (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                onClick={() =>
                  setFormState({
                    isOpen: true,
                    mode: "create",
                    warehouse: null,
                  })
                }
                type="button"
              >
                <Plus aria-hidden="true" size={17} />
                Tambah gudang
              </button>
            )}
          </>
        }
        description="Kelola fasilitas gudang beserta alamat dan kebijakan saldo stok negatif per gudang. Saat ini menampilkan contoh data pratinjau antarmuka."
        title="Gudang"
      />

      {notice && (
        <div
          className="mb-6 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-teal-600/30 bg-teal-100 px-4 py-3 text-sm text-teal-700"
          role="status"
        >
          <p className="font-semibold">{notice}</p>
          <button
            aria-label="Tutup notifikasi"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] hover:bg-ink-950/5"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      <section
        aria-label="Filter daftar gudang"
        className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5"
      >
        <form
          className="grid gap-4 md:grid-cols-3"
          onSubmit={handleApplyFilter}
        >
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
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Cari kode, nama, atau alamat gudang..."
                type="search"
                value={draftSearch}
              />
            </div>
          </label>

          <label className="text-sm font-semibold text-ink-950">
            Status gudang
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftStatus(event.target.value as WarehouseStatusFilter)
              }
              value={draftStatus}
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              type="submit"
            >
              <Filter aria-hidden="true" size={16} />
              Terapkan filter
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={handleResetFilter}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Atur ulang
            </button>
          </div>
        </form>
      </section>

      {filteredWarehouses.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
            <Warehouse aria-hidden="true" size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink-950">
            Tidak ada gudang yang sesuai dengan filter
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-700">
            Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan daftar contoh gudang.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">Daftar gudang (Contoh data)</caption>
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
                {filteredWarehouses.map((wh) => (
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
                        {wh.allow_negative_stock
                          ? "Diizinkan"
                          : "Ditolak ketat"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          wh.is_active
                            ? "bg-teal-100 text-teal-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <CheckCircle2 aria-hidden="true" size={13} />
                        {wh.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail gudang ${wh.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => setDetailTarget(wh)}
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
                              onClick={() =>
                                setFormState({
                                  isOpen: true,
                                  mode: "edit",
                                  warehouse: wh,
                                })
                              }
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
                              onClick={() => setConfirmTarget(wh)}
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums">
            <span>
              Menampilkan 1 sampai {filteredWarehouses.length} dari{" "}
              {filteredWarehouses.length} gudang (Contoh data)
            </span>
          </div>
        </section>
      )}

      <WarehouseDetailDialog
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={(warehouse) =>
          setFormState({ isOpen: true, mode: "edit", warehouse })
        }
        onToggleStatus={(warehouse) => setConfirmTarget(warehouse)}
        warehouse={detailTarget}
      />

      <WarehouseFormDialog
        initialWarehouse={formState.warehouse}
        isOpen={formState.isOpen}
        key={`${formState.mode}-${formState.warehouse?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={() =>
          setFormState((current) => ({ ...current, isOpen: false }))
        }
        onSubmit={handleSaveWarehouse}
      />

      <WarehouseDeleteDialog
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmToggle}
        warehouse={confirmTarget}
      />
    </>
  );
}
