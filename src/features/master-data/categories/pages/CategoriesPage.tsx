import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  Filter,
  FolderOpen,
  Plus,
  PowerOff,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import {
  buildCategoriesCsv,
  fetchCategories,
  mapCategoryApiError,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from "../api";
import { CategoryDeleteDialog } from "../components/CategoryDeleteDialog";
import { CategoryDetailDialog } from "../components/CategoryDetailDialog";
import { CategoryFormDialog } from "../components/CategoryFormDialog";
import type {
  Category,
  CategoryCreatePayload,
  CategoryListParams,
  CategorySortField,
  CategoryStatusFilter,
  CategoryUpdatePayload,
  SortDirection,
} from "../types";

const initialParams: CategoryListParams = {
  limit: 20,
  offset: 0,
  search: "",
  status: "all",
  sort_by: "id",
  sort_dir: "asc",
};

interface PageNotice {
  type: "success" | "error";
  message: string;
  requestId?: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CategoriesPage() {
  const { can } = usePermission();
  const canManage = can("master:manage");

  const [params, setParams] = useState<CategoryListParams>(initialParams);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<CategoryStatusFilter>("all");
  const [draftSortBy, setDraftSortBy] = useState<CategorySortField>("id");
  const [draftSortDir, setDraftSortDir] = useState<SortDirection>("asc");

  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [detailTarget, setDetailTarget] = useState<Category | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    category: Category | null;
  }>({
    isOpen: false,
    mode: "create",
    category: null,
  });
  const [formError, setFormError] = useState<{
    message: string;
    requestId?: string;
    fieldErrors?: { name?: string; description?: string };
  } | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null);
  const [confirmError, setConfirmError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useCategories(params);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.limit ?? params.limit;
  const pageStart = total === 0 ? 0 : params.offset + 1;
  const pageEnd = Math.min(params.offset + pageSize, total);
  const hasActiveFilters =
    params.search.trim().length > 0 ||
    params.status !== "all" ||
    params.sort_by !== "id" ||
    params.sort_dir !== "asc";

  const listErrorInfo = isError
    ? mapCategoryApiError(error, "Data kategori barang belum dapat dimuat.")
    : null;

  function showNotification(nextNotice: PageNotice) {
    setNotice(nextNotice);
    if (nextNotice.type === "success") {
      toast.success(nextNotice.message);
    } else {
      toast.error(nextNotice.message);
    }
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams((current) => ({
      ...current,
      offset: 0,
      search: draftSearch,
      status: draftStatus,
      sort_by: draftSortBy,
      sort_dir: draftSortDir,
    }));
  }

  function handleResetFilters() {
    setDraftSearch("");
    setDraftStatus("all");
    setDraftSortBy("id");
    setDraftSortDir("asc");
    setParams(initialParams);
  }

  function openCreateDialog() {
    setFormError(null);
    setFormState({
      isOpen: true,
      mode: "create",
      category: null,
    });
  }

  function openEditDialog(category: Category) {
    setFormError(null);
    setFormState({
      isOpen: true,
      mode: "edit",
      category,
    });
  }

  function closeFormDialog() {
    setFormError(null);
    setFormState((current) => ({
      ...current,
      isOpen: false,
    }));
  }

  function openConfirmDialog(category: Category) {
    setConfirmError(null);
    setConfirmTarget(category);
  }

  function closeConfirmDialog() {
    setConfirmError(null);
    setConfirmTarget(null);
  }

  async function handleFormSubmit(
    payload: CategoryCreatePayload | CategoryUpdatePayload,
  ) {
    setFormError(null);
    if (formState.mode === "create") {
      try {
        const created = await createMutation.mutateAsync({
          name: payload.name ?? "",
          description: payload.description,
          is_active: payload.is_active ?? true,
        });
        closeFormDialog();
        showNotification({
          type: "success",
          message: `Kategori "${created.name}" berhasil ditambahkan.`,
        });
      } catch (err) {
        const mapped = mapCategoryApiError(
          err,
          "Kategori baru belum dapat disimpan.",
        );
        setFormError(mapped);
        showNotification({
          type: "error",
          message: mapped.message,
          requestId: mapped.requestId,
        });
      }
      return;
    }

    if (!formState.category) {
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({
        categoryId: formState.category.id,
        payload,
      });
      closeFormDialog();
      showNotification({
        type: "success",
        message: `Kategori "${updated.name}" berhasil diperbarui.`,
      });
    } catch (err) {
      const mapped = mapCategoryApiError(
        err,
        "Perubahan kategori belum dapat disimpan.",
      );
      setFormError(mapped);
      showNotification({
        type: "error",
        message: mapped.message,
        requestId: mapped.requestId,
      });
    }
  }

  async function handleConfirmStatusChange(category: Category) {
    setConfirmError(null);
    const nextActive = !category.is_active;
    try {
      const updated = await updateMutation.mutateAsync({
        categoryId: category.id,
        payload: { is_active: nextActive },
      });
      closeConfirmDialog();
      showNotification({
        type: "success",
        message: nextActive
          ? `Kategori "${updated.name}" berhasil diaktifkan kembali.`
          : `Kategori "${updated.name}" berhasil dinonaktifkan.`,
      });
    } catch (err) {
      const mapped = mapCategoryApiError(
        err,
        nextActive
          ? "Kategori belum dapat diaktifkan kembali."
          : "Kategori belum dapat dinonaktifkan.",
      );
      setConfirmError({
        message: mapped.message,
        requestId: mapped.requestId,
      });
      showNotification({
        type: "error",
        message: mapped.message,
        requestId: mapped.requestId,
      });
    }
  }

  async function handleDownloadCsv() {
    setIsDownloading(true);
    try {
      const exportPage = await fetchCategories({
        ...params,
        limit: 200,
        offset: 0,
      });
      const rows = exportPage.items;
      if (rows.length === 0) {
        showNotification({
          type: "error",
          message: "Belum ada data kategori barang yang dapat diunduh.",
        });
        return;
      }

      const csvContent = buildCategoriesCsv(rows);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `kategori-barang-${dateStamp}.csv`;

      if (typeof URL.createObjectURL === "function") {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        if (typeof URL.revokeObjectURL === "function") {
          URL.revokeObjectURL(url);
        }
      }

      showNotification({
        type: "success",
        message: `Data kategori barang (${rows.length} baris) berhasil diunduh.`,
      });
    } catch (err) {
      const mapped = mapCategoryApiError(
        err,
        "Gagal mengunduh data kategori barang.",
      );
      showNotification({
        type: "error",
        message: mapped.message,
        requestId: mapped.requestId,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <PageHeader
        action={
          <>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDownloading || isLoading}
              onClick={() => void handleDownloadCsv()}
              type="button"
            >
              <Download aria-hidden="true" size={17} />
              {isDownloading ? "Mengunduh..." : "Unduh CSV"}
            </button>
            {canManage ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                onClick={openCreateDialog}
                type="button"
              >
                <Plus aria-hidden="true" size={17} />
                Tambah kategori
              </button>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">
                Mode baca saja
              </span>
            )}
          </>
        }
        description="Kelola pengelompokan referensi barang (SKU) untuk pencatatan pembelian, penerimaan, dan stok gudang."
        title="Kategori barang"
      />

      {notice && (
        <div
          className={`mb-6 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-teal-600/30 bg-teal-100 text-teal-700"
              : "border-red-600/30 bg-red-100 text-red-700"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <div className="min-w-0">
            <p className="font-semibold">{notice.message}</p>
            {notice.requestId && (
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                ID Permintaan: {notice.requestId}
              </p>
            )}
          </div>
          <button
            aria-label="Tutup notifikasi"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] text-current transition hover:bg-ink-950/5"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      <section
        aria-label="Filter daftar kategori barang"
        className="mb-6 rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-5"
      >
        <form
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          onSubmit={handleApplyFilters}
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
                placeholder="Cari nama atau deskripsi..."
                type="search"
                value={draftSearch}
              />
            </div>
          </label>

          <label className="text-sm font-semibold text-ink-950">
            Status kategori
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftStatus(event.target.value as CategoryStatusFilter)
              }
              value={draftStatus}
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-ink-950">
            Urutkan berdasarkan
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftSortBy(event.target.value as CategorySortField)
              }
              value={draftSortBy}
            >
              <option value="id">ID kategori</option>
              <option value="name">Nama kategori</option>
              <option value="created_at">Waktu dibuat</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-ink-950">
            Arah urutan
            <select
              className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3 text-sm font-normal text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) =>
                setDraftSortDir(event.target.value as SortDirection)
              }
              value={draftSortDir}
            >
              <option value="asc">Naik (A ke Z / Terlama)</option>
              <option value="desc">Turun (Z ke A / Terbaru)</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-4">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              type="submit"
            >
              <Filter aria-hidden="true" size={16} />
              Terapkan filter
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={handleResetFilters}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Atur ulang filter
            </button>
          </div>
        </form>
      </section>

      {isLoading ? (
        <div
          className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-sm text-slate-700 shadow-[var(--shadow-1)]"
          role="status"
        >
          Memuat daftar kategori barang...
        </div>
      ) : isError ? (
        <div
          className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-100 p-6 text-sm text-red-700"
          role="alert"
        >
          <p className="font-semibold">Data kategori barang belum dapat dimuat</p>
          <p className="mt-1 text-slate-700">{listErrorInfo?.message}</p>
          {listErrorInfo?.requestId && (
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              ID Permintaan: {listErrorInfo.requestId}
            </p>
          )}
          <button
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-red-700"
            onClick={() => void refetch()}
            type="button"
          >
            Muat ulang data
          </button>
        </div>
      ) : total === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line-500 bg-surface-0 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-[var(--radius-md)] bg-teal-100 text-teal-700">
            <FolderOpen aria-hidden="true" size={22} />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink-950">
            {hasActiveFilters
              ? "Tidak ada kategori barang yang sesuai dengan filter"
              : "Belum ada data kategori barang"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-700">
            {hasActiveFilters
              ? "Ubah kata kunci pencarian atau atur ulang filter untuk menampilkan seluruh kategori."
              : "Tambahkan kategori barang pertama agar Anda dapat mengelompokkan SKU di dalam gudang."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {hasActiveFilters ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
                onClick={handleResetFilters}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
                Atur ulang filter
              </button>
            ) : (
              canManage && (
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                  onClick={openCreateDialog}
                  type="button"
                >
                  <Plus aria-hidden="true" size={17} />
                  Tambah kategori pertama
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-1)]">
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
                {items.map((category) => (
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
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          category.is_active
                            ? "bg-teal-100 text-teal-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <CheckCircle2 aria-hidden="true" size={13} />
                        {category.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 tabular-nums">
                      {formatDate(category.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <button
                          aria-label={`Lihat detail kategori ${category.name}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-xs font-semibold text-ink-950 transition hover:bg-canvas-50"
                          onClick={() => setDetailTarget(category)}
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
                              onClick={() => openEditDialog(category)}
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
                              onClick={() => openConfirmDialog(category)}
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 px-4 py-3 text-xs text-slate-600 tabular-nums">
            <span>
              {isFetching
                ? "Memperbarui..."
                : `Menampilkan ${pageStart} sampai ${pageEnd} dari ${total} kategori`}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span>Baris per halaman</span>
                <select
                  aria-label="Baris per halaman"
                  className="min-h-11 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-2.5 text-xs font-semibold text-ink-950"
                  onChange={(event) =>
                    setParams((current) => ({
                      ...current,
                      limit: Number(event.target.value),
                      offset: 0,
                    }))
                  }
                  value={params.limit}
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  aria-label="Halaman sebelumnya"
                  className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 text-ink-950 transition hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={params.offset === 0 || isFetching}
                  onClick={() =>
                    setParams((current) => ({
                      ...current,
                      offset: Math.max(0, current.offset - current.limit),
                    }))
                  }
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={17} />
                </button>
                <button
                  aria-label="Halaman berikutnya"
                  className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 text-ink-950 transition hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={params.offset + pageSize >= total || isFetching}
                  onClick={() =>
                    setParams((current) => ({
                      ...current,
                      offset: current.offset + current.limit,
                    }))
                  }
                  type="button"
                >
                  <ChevronRight aria-hidden="true" size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <CategoryDetailDialog
        canManage={canManage}
        category={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={openEditDialog}
        onToggleStatus={openConfirmDialog}
      />

      <CategoryFormDialog
        initialCategory={formState.category}
        isOpen={formState.isOpen}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        key={`${formState.mode}-${formState.category?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={closeFormDialog}
        onSubmit={handleFormSubmit}
        submitError={formError}
      />

      <CategoryDeleteDialog
        actionError={confirmError}
        category={confirmTarget}
        isSubmitting={updateMutation.isPending}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmStatusChange}
      />
    </>
  );
}

