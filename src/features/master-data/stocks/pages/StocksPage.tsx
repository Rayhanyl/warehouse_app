import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Filter,
  Package,
  Plus,
  PowerOff,
  RotateCcw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { CollapsibleFilterPanel } from "@/components/ui/CollapsibleFilterPanel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermission } from "@/hooks/usePermission";
import { fetchCategories } from "@/features/master-data/categories/api";
import { fetchUoms } from "@/features/master-data/uoms/api";
import {
  buildStockItemsCsv,
  createStockItem,
  downloadStockItemsImportTemplate,
  fetchStockItems,
  mapStockApiError,
  updateStockItem,
} from "../api";
import type { MasterFormSubmitError } from "../../errors";
import { StockDeleteDialog } from "../components/StockDeleteDialog";
import { StockDetailDialog } from "../components/StockDetailDialog";
import { StockFormDialog } from "../components/StockFormDialog";
import { StockImportDialog } from "../components/StockImportDialog";
import type {
  StockFormPayload,
  StockItem,
  StockStatusFilter,
} from "../types";

export function StocksPage() {
  const { can } = usePermission();
  const isMobile = useIsMobile();
  const canManage = can("master:manage");

  const [records, setRecords] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("all");
  const [draftStatus, setDraftStatus] = useState<StockStatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);

  const [detailTarget, setDetailTarget] = useState<StockItem | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    item: StockItem | null;
  }>({
    isOpen: false,
    mode: "create",
    item: null,
  });
  const [confirmTarget, setConfirmTarget] = useState<StockItem | null>(null);
  const [formError, setFormError] = useState<MasterFormSubmitError | null>(null);
  const [confirmError, setConfirmError] = useState<MasterFormSubmitError | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [uomOptions, setUomOptions] = useState<
    { id: number; code: string; name: string; allow_decimal: boolean }[]
  >([]);

  useEffect(() => {
    let active = true;
    void fetchStockItems({
      limit: 200,
      offset: 0,
      search: "",
      status: "all",
      category_id: null,
      uom_id: null,
      sort_by: "id",
      sort_dir: "asc",
    })
      .then((page) => {
        if (active) setRecords(page.items);
      })
      .catch(() => {
        if (active) {
          setNotice("Daftar barang belum dapat dimuat. Periksa koneksi lalu coba lagi.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchCategories({
        limit: 200,
        offset: 0,
        search: "",
        status: "active",
        sort_by: "name",
        sort_dir: "asc",
      }),
      fetchUoms({
        limit: 200,
        offset: 0,
        search: "",
        status: "active",
        sort_by: "name",
        sort_dir: "asc",
      }),
    ])
      .then(([categories, uoms]) => {
        if (!active) return;
        setCategoryOptions(categories.items.map(({ id, name }) => ({ id, name })));
        setUomOptions(
          uoms.items.map(({ id, code, name, allow_decimal }) => ({
            id,
            code,
            name,
            allow_decimal,
          })),
        );
      })
      .catch(() => {
        if (active) setNotice("Referensi kategori dan satuan ukur belum dapat dimuat.");
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((item) => {
      if (statusFilter === "active" && !item.is_active) {
        return false;
      }
      if (statusFilter === "inactive" && item.is_active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.sku.toLocaleLowerCase().includes(query) ||
        Boolean(item.barcode && item.barcode.toLocaleLowerCase().includes(query)) ||
        item.name.toLocaleLowerCase().includes(query) ||
        item.category_name.toLocaleLowerCase().includes(query)
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

  async function handleSaveItem(payload: StockFormPayload) {
    if (isMutating) return;
    setFormError(null);
    setIsMutating(true);

    try {
      if (formState.mode === "create") {
        const created = await createStockItem({
          sku: payload.sku,
          barcode: payload.barcode ?? null,
          name: payload.name,
          description: payload.description,
          category_id: payload.category_id,
          uom_id: payload.uom_id,
          is_active: payload.is_active,
        });
        setRecords((current) => [created, ...current]);
        setFormState({ isOpen: false, mode: "create", item: null });
        notifySuccess(`Barang "${created.name} (${created.sku})" berhasil ditambahkan.`);
        return;
      }

      if (!formState.item) {
        return;
      }

      const targetId = formState.item.id;
      const updated = await updateStockItem(targetId, {
        sku: payload.sku,
        barcode: payload.barcode ?? null,
        name: payload.name,
        description: payload.description,
        category_id: payload.category_id,
        uom_id: payload.uom_id,
        is_active: payload.is_active,
      });
      setRecords((current) =>
        current.map((item) => (item.id === targetId ? updated : item)),
      );
      setDetailTarget((current) => (current?.id === targetId ? updated : current));
      setFormState({ isOpen: false, mode: "create", item: null });
      notifySuccess(`Barang "${updated.name} (${updated.sku})" berhasil diperbarui.`);
    } catch (error) {
      const mapped = mapStockApiError(
        error,
        formState.mode === "create"
          ? "Barang baru belum dapat disimpan."
          : "Perubahan barang belum dapat disimpan.",
      );
      setFormError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  async function handleConfirmToggle(item: StockItem) {
    if (isMutating) return;
    setConfirmError(null);
    setIsMutating(true);

    const nextActive = !item.is_active;
    try {
      const updated = await updateStockItem(item.id, { is_active: nextActive });
      setRecords((current) =>
        current.map((row) => (row.id === item.id ? updated : row)),
      );
      setDetailTarget((current) => (current?.id === item.id ? updated : current));
      setConfirmTarget(null);
      notifySuccess(
        updated.is_active
          ? `Barang "${updated.name}" berhasil diaktifkan kembali.`
          : `Barang "${updated.name}" berhasil dinonaktifkan.`,
      );
    } catch (error) {
      const mapped = mapStockApiError(
        error,
        nextActive
          ? "Barang belum dapat diaktifkan kembali."
          : "Barang belum dapat dinonaktifkan.",
      );
      setConfirmError(mapped);
      toast.error(mapped.message);
    } finally {
      setIsMutating(false);
    }
  }

  function handleDownloadCsv() {
    const csvContent = buildStockItemsCsv(filteredItems);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    if (typeof URL.createObjectURL === "function") {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "barang-sku.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    }
    notifySuccess(
      `Data barang (${filteredItems.length} baris) berhasil diunduh.`,
    );
  }

  async function handleDownloadImportTemplate() {
    try {
      const blob = await downloadStockItemsImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template_import_barang.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setNotice("Template import belum dapat diunduh. Periksa koneksi lalu coba lagi.");
    }
  }

  async function refreshStockItems() {
    try {
      const page = await fetchStockItems({
        limit: 200,
        offset: 0,
        search: "",
        status: "all",
        category_id: null,
        uom_id: null,
        sort_by: "id",
        sort_dir: "asc",
      });
      setRecords(page.items);
    } catch {
      setNotice("Import selesai, tetapi daftar barang belum dapat diperbarui.");
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
                    setFormState({ isOpen: true, mode: "create", item: null });
                  }}
                  type="button"
                >
                  <Plus aria-hidden="true" size={17} />
                  Tambah barang
                </button>
              </>
            )}
          </>
        }
        description="Kelola data master SKU yang mengacu pada satu kategori aktif dan satu satuan ukur dasar."
        title="Barang (SKU)"
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
        ariaLabel="Filter daftar barang"
        title="Filter daftar barang"
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
                placeholder="Cari SKU, nama barang, atau kategori..."
                type="search"
                value={draftSearch}
              />
            </div>
          </label>

          <label className="text-sm font-semibold text-ink-950">
            Status barang
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftStatus(event.target.value as StockStatusFilter)
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

      {filteredItems.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
            <Package aria-hidden="true" size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink-950">
            Tidak ada barang yang sesuai dengan filter
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-700">
            Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan daftar barang.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
          {isMobile ? (
            <ul aria-label="Daftar barang (SKU)" className="divide-y divide-line-200">
              {filteredItems.map((item) => (
                <li className="space-y-3 p-4" key={item.id}>
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
                      <p className="mt-1.5 text-sm font-bold text-ink-950">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {item.description || "Tanpa deskripsi"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.is_active
                          ? "bg-teal-100 text-teal-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <CheckCircle2 aria-hidden="true" size={13} />
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
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
                      onClick={() => setDetailTarget(item)}
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
                          onClick={() => {
                            setFormError(null);
                            setFormState({
                              isOpen: true,
                              mode: "edit",
                              item,
                            });
                          }}
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
                          onClick={() => {
                            setConfirmError(null);
                            setConfirmTarget(item);
                          }}
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
                </li>
              ))}
            </ul>
          ) : (
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
                  {filteredItems.map((item) => (
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
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.is_active
                              ? "bg-teal-100 text-teal-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <CheckCircle2 aria-hidden="true" size={13} />
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1">
                          <button
                            aria-label={`Lihat detail barang ${item.name}`}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                            onClick={() => setDetailTarget(item)}
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
                                onClick={() => {
                                  setFormError(null);
                                  setFormState({
                                    isOpen: true,
                                    mode: "edit",
                                    item,
                                  });
                                }}
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
                                onClick={() => {
                                  setConfirmError(null);
                                  setConfirmTarget(item);
                                }}
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
          <div className="flex flex-col items-start justify-between gap-2 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums sm:flex-row sm:items-center">
            <span>
              Menampilkan 1 sampai {filteredItems.length} dari{" "}
              {filteredItems.length} barang
            </span>
          </div>
        </section>
      )}
      </div>

      <StockDetailDialog
        canManage={canManage}
        item={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={(item) => {
          setFormError(null);
          setFormState({ isOpen: true, mode: "edit", item });
        }}
        onToggleStatus={(item) => {
          setConfirmError(null);
          setConfirmTarget(item);
        }}
      />

      <StockFormDialog
        initialItem={formState.item}
        isOpen={formState.isOpen}
        isSubmitting={isMutating}
        key={`${formState.mode}-${formState.item?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={() => {
          setFormError(null);
          setFormState((current) => ({ ...current, isOpen: false }));
        }}
        onSubmit={handleSaveItem}
        submitError={formError}
        existingItems={records}
        categoryOptions={categoryOptions}
        uomOptions={uomOptions}
      />

      <StockDeleteDialog
        isSubmitting={isMutating}
        item={confirmTarget}
        onClose={() => {
          setConfirmError(null);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirmToggle}
        submitError={confirmError}
      />

      {canManage && isImportOpen && (
        <StockImportDialog
          onClose={() => setIsImportOpen(false)}
          onDownloadTemplate={() => void handleDownloadImportTemplate()}
          onImported={refreshStockItems}
        />
      )}
    </>
  );
}
