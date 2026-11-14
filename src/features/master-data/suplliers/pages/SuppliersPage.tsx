import { FormEvent, useEffect, useMemo, useState } from "react";
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
  Truck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermission } from "@/hooks/usePermission";
import {
  buildSuppliersCsv,
  createSupplier,
  downloadSupplierImportTemplate,
  fetchSuppliers,
  mapSupplierApiError,
  updateSupplier,
} from "../api";
import type { MasterFormSubmitError } from "../../errors";
import { SupplierDeleteDialog } from "../components/SupplierDeleteDialog";
import { SupplierDetailDialog } from "../components/SupplierDetailDialog";
import { SupplierFormDialog } from "../components/SupplierFormDialog";
import { SupplierImportDialog } from "../components/SupplierImportDialog";
import type {
  Supplier,
  SupplierFormPayload,
  SupplierStatusFilter,
} from "../types";

export function SuppliersPage() {
  const { can } = usePermission();
  const isMobile = useIsMobile();
  const canManage = can("master:manage");

  const [records, setRecords] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>("all");
  const [draftStatus, setDraftStatus] = useState<SupplierStatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);

  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    supplier: Supplier | null;
  }>({
    isOpen: false,
    mode: "create",
    supplier: null,
  });
  const [confirmTarget, setConfirmTarget] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<MasterFormSubmitError | null>(null);
  const [confirmError, setConfirmError] = useState<MasterFormSubmitError | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchSuppliers({
      limit: 200,
      offset: 0,
      search: "",
      status: "all",
      sort_by: "id",
      sort_dir: "asc",
    })
      .then((page) => {
        if (active) setRecords(page.items);
      })
      .catch(() => {
        if (active) {
          setNotice("Daftar pemasok belum dapat dimuat. Periksa koneksi lalu coba lagi.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((supplier) => {
      if (statusFilter === "active" && !supplier.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && supplier.is_active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        supplier.code.toLocaleLowerCase().includes(query) ||
        supplier.name.toLocaleLowerCase().includes(query) ||
        (supplier.contact_person ?? "").toLocaleLowerCase().includes(query)
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

  async function handleSaveSupplier(payload: SupplierFormPayload) {
    if (isMutating) return;
    setFormError(null);
    setIsMutating(true);

    try {
      if (formState.mode === "create") {
        const created = await createSupplier(payload);
        setRecords((current) => [created, ...current]);
        setFormState({ isOpen: false, mode: "create", supplier: null });
        notifySuccess(`Pemasok "${created.name}" berhasil ditambahkan.`);
        return;
      }

      if (!formState.supplier) {
        return;
      }

      const targetId = formState.supplier.id;
      const updated = await updateSupplier(targetId, payload);
      setRecords((current) =>
        current.map((item) => (item.id === targetId ? updated : item)),
      );
      setDetailTarget((current) => (current?.id === targetId ? updated : current));
      setFormState({ isOpen: false, mode: "create", supplier: null });
      notifySuccess(`Pemasok "${updated.name}" berhasil diperbarui.`);
    } catch (error) {
      const mapped = mapSupplierApiError(
        error,
        formState.mode === "create"
          ? "Pemasok baru belum dapat disimpan."
          : "Perubahan data pemasok belum dapat disimpan.",
      );
      setFormError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  async function handleConfirmToggle(supplier: Supplier) {
    if (isMutating) return;
    setConfirmError(null);
    setIsMutating(true);

    const nextActive = !supplier.is_active;
    try {
      const updated = await updateSupplier(supplier.id, { is_active: nextActive });
      setRecords((current) =>
        current.map((item) => (item.id === supplier.id ? updated : item)),
      );
      setDetailTarget((current) =>
        current?.id === supplier.id ? updated : current,
      );
      setConfirmTarget(null);
      notifySuccess(
        updated.is_active
          ? `Pemasok "${updated.name}" berhasil diaktifkan kembali.`
          : `Pemasok "${updated.name}" berhasil dinonaktifkan.`,
      );
    } catch (error) {
      const mapped = mapSupplierApiError(
        error,
        nextActive
          ? "Pemasok belum dapat diaktifkan kembali."
          : "Pemasok belum dapat dinonaktifkan.",
      );
      setConfirmError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  function handleDownloadCsv() {
    const csvContent = buildSuppliersCsv(filteredSuppliers);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    if (typeof URL.createObjectURL === "function") {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pemasok.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    }
    notifySuccess(
      `Data pemasok (${filteredSuppliers.length} baris) berhasil diunduh.`,
    );
  }

  async function handleDownloadImportTemplate() {
    try {
      const blob = await downloadSupplierImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template_import_supplier.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const message =
        "Template import pemasok belum dapat diunduh. Periksa koneksi lalu coba lagi.";
      setNotice(message);
      toast.error(message);
    }
  }

  async function refreshSuppliers() {
    try {
      const page = await fetchSuppliers({
        limit: 200,
        offset: 0,
        search: "",
        status: "all",
        sort_by: "id",
        sort_dir: "asc",
      });
      setRecords(page.items);
    } catch {
      setNotice("Import selesai, tetapi daftar pemasok belum dapat diperbarui.");
    }
  }

  return (
    <>
      <div className="no-print">
      <PageHeader
        action={
          <>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={handleDownloadCsv}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              Unduh CSV
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={() => void handleDownloadImportTemplate()}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              Unduh template
            </button>
            {canManage && (
              <>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-teal-600 bg-surface-0 px-4 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                  onClick={() => setIsImportOpen(true)}
                  type="button"
                >
                  <Upload aria-hidden="true" size={17} />
                  Import Excel
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                  onClick={() => {
                    setFormError(null);
                    setFormState({ isOpen: true, mode: "create", supplier: null });
                  }}
                  type="button"
                >
                  <Plus aria-hidden="true" size={17} />
                  Tambah pemasok
                </button>
              </>
            )}
          </>
        }
        description="Kelola data rekanan pemasok untuk penerbitan purchase order dan penerimaan barang."
        title="Pemasok (supplier)"
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

      <CollapsibleFilterPanel
        activeCount={(search.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
        ariaLabel="Filter daftar pemasok"
        title="Filter daftar pemasok"
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
                placeholder="Cari kode, nama, atau narahubung..."
                type="search"
                value={draftSearch}
              />
            </div>
          </label>

          <label className="text-sm font-semibold text-ink-950">
            Status pemasok
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftStatus(event.target.value as SupplierStatusFilter)
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
      </CollapsibleFilterPanel>

      {filteredSuppliers.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
            <Truck aria-hidden="true" size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink-950">
            Tidak ada pemasok yang sesuai dengan filter
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-700">
            Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan daftar pemasok.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
          {isMobile ? (
            <ul aria-label="Daftar pemasok" className="divide-y divide-line-200">
              {filteredSuppliers.map((supplier) => (
                <li className="space-y-3 p-4" key={supplier.id}>
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
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        supplier.is_active
                          ? "bg-teal-100 text-teal-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <CheckCircle2 aria-hidden="true" size={13} />
                      {supplier.is_active ? "Aktif" : "Nonaktif"}
                    </span>
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
                      onClick={() => setDetailTarget(supplier)}
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
                          onClick={() => {
                            setFormError(null);
                            setFormState({
                              isOpen: true,
                              mode: "edit",
                              supplier,
                            });
                          }}
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
                          onClick={() => {
                            setConfirmError(null);
                            setConfirmTarget(supplier);
                          }}
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
                </li>
              ))}
            </ul>
          ) : (
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
                  {filteredSuppliers.map((supplier) => (
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
                        <p className="font-semibold text-ink-950">
                          {supplier.name}
                        </p>
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
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            supplier.is_active
                              ? "bg-teal-100 text-teal-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <CheckCircle2 aria-hidden="true" size={13} />
                          {supplier.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          <button
                            aria-label={`Lihat detail pemasok ${supplier.name}`}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                            onClick={() => setDetailTarget(supplier)}
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
                                onClick={() => {
                                  setFormError(null);
                                  setFormState({
                                    isOpen: true,
                                    mode: "edit",
                                    supplier,
                                  });
                                }}
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
                                onClick={() => {
                                  setConfirmError(null);
                                  setConfirmTarget(supplier);
                                }}
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
          <div className="flex flex-col items-start justify-between gap-2 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums sm:flex-row sm:items-center">
            <span>
              Menampilkan 1 sampai {filteredSuppliers.length} dari{" "}
              {filteredSuppliers.length} pemasok
            </span>
          </div>
        </section>
      )}
      </div>

      <SupplierDetailDialog
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={(supplier) => {
          setFormError(null);
          setFormState({ isOpen: true, mode: "edit", supplier });
        }}
        onToggleStatus={(supplier) => {
          setConfirmError(null);
          setConfirmTarget(supplier);
        }}
        supplier={detailTarget}
      />

      <SupplierFormDialog
        initialSupplier={formState.supplier}
        isOpen={formState.isOpen}
        isSubmitting={isMutating}
        key={`${formState.mode}-${formState.supplier?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={() => {
          setFormError(null);
          setFormState((current) => ({ ...current, isOpen: false }));
        }}
        onSubmit={handleSaveSupplier}
        submitError={formError}
        existingSuppliers={records}
      />

      <SupplierDeleteDialog
        isSubmitting={isMutating}
        onClose={() => {
          setConfirmError(null);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirmToggle}
        submitError={confirmError}
        supplier={confirmTarget}
      />

      {canManage && isImportOpen && (
        <SupplierImportDialog
          onClose={() => setIsImportOpen(false)}
          onDownloadTemplate={() => void handleDownloadImportTemplate()}
          onImported={refreshSuppliers}
        />
      )}
    </>
  );
}
