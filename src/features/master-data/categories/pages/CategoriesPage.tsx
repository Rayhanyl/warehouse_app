import { FormEvent, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { MasterNoticeBanner } from "../../components/MasterNoticeBanner";
import { downloadMasterCsv, type MasterPageNotice } from "../../utils";
import {
  buildCategoriesCsv,
  fetchCategories,
  mapCategoryApiError,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from "../api";
import { CategoriesDataView } from "../components/CategoriesDataView";
import { CategoriesFilterBar } from "../components/CategoriesFilterBar";
import { CategoryDeleteDialog } from "../components/CategoryDeleteDialog";
import { CategoryDetailDialog } from "../components/CategoryDetailDialog";
import { CategoryFormDialog } from "../components/CategoryFormDialog";
import { INITIAL_CATEGORY_LIST_PARAMS } from "../schemas";
import type {
  Category,
  CategoryCreatePayload,
  CategoryListParams,
  CategorySortField,
  CategoryStatusFilter,
  CategoryUpdatePayload,
  SortDirection,
} from "../types";

export function CategoriesPage() {
  const { can } = usePermission();
  const canManage = can("master:manage");

  const [params, setParams] = useState<CategoryListParams>(
    INITIAL_CATEGORY_LIST_PARAMS,
  );
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<CategoryStatusFilter>("all");
  const [draftSortBy, setDraftSortBy] = useState<CategorySortField>("id");
  const [draftSortDir, setDraftSortDir] = useState<SortDirection>("asc");

  const [notice, setNotice] = useState<MasterPageNotice | null>(null);
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
  const hasActiveFilters =
    params.search.trim().length > 0 ||
    params.status !== "all" ||
    params.sort_by !== "id" ||
    params.sort_dir !== "asc";
  const activeFilterCount =
    (params.search.trim() ? 1 : 0) +
    (params.status !== "all" ? 1 : 0) +
    (params.sort_by !== "id" || params.sort_dir !== "asc" ? 1 : 0);

  const listErrorInfo = isError
    ? mapCategoryApiError(error, "Data kategori barang belum dapat dimuat.")
    : null;

  function showNotification(nextNotice: MasterPageNotice) {
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
    setParams(INITIAL_CATEGORY_LIST_PARAMS);
  }

  function openCreateDialog() {
    setFormError(null);
    setFormState({ isOpen: true, mode: "create", category: null });
  }

  function openEditDialog(category: Category) {
    setFormError(null);
    setFormState({ isOpen: true, mode: "edit", category });
  }

  function closeFormDialog() {
    setFormError(null);
    setFormState((current) => ({ ...current, isOpen: false }));
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
        const mapped = mapCategoryApiError(err, "Kategori baru belum dapat disimpan.");
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
      const mapped = mapCategoryApiError(err, "Perubahan kategori belum dapat disimpan.");
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
      setConfirmError({ message: mapped.message, requestId: mapped.requestId });
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
      const exportPage = await fetchCategories({ ...params, limit: 200, offset: 0 });
      const rows = exportPage.items;
      if (rows.length === 0) {
        showNotification({
          type: "error",
          message: "Belum ada data kategori barang yang dapat diunduh.",
        });
        return;
      }

      downloadMasterCsv("kategori-barang", buildCategoriesCsv(rows));
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
            <Button
              className="min-h-11 gap-2"
              disabled={isDownloading || isLoading}
              onClick={() => void handleDownloadCsv()}
              type="button"
              variant="outline"
            >
              <Download aria-hidden="true" size={17} />
              {isDownloading ? "Mengunduh..." : "Unduh CSV"}
            </Button>
            {canManage ? (
              <Button
                className="min-h-11 gap-2 bg-teal-600 hover:bg-teal-700"
                onClick={openCreateDialog}
                type="button"
              >
                <Plus aria-hidden="true" size={17} />
                Tambah kategori
              </Button>
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

      <MasterNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <CategoriesFilterBar
        activeCount={activeFilterCount}
        draftSearch={draftSearch}
        draftSortBy={draftSortBy}
        draftSortDir={draftSortDir}
        draftStatus={draftStatus}
        onReset={handleResetFilters}
        onSearchChange={setDraftSearch}
        onSortByChange={setDraftSortBy}
        onSortDirChange={setDraftSortDir}
        onStatusChange={setDraftStatus}
        onSubmit={handleApplyFilters}
      />

      <CategoriesDataView
        canManage={canManage}
        errorMessage={listErrorInfo?.message ?? null}
        hasActiveFilters={hasActiveFilters}
        isFetching={isFetching}
        isLoading={isLoading}
        items={items}
        limit={params.limit}
        offset={params.offset}
        onLimitChange={(nextLimit) =>
          setParams((current) => ({ ...current, limit: nextLimit, offset: 0 }))
        }
        onOffsetChange={(nextOffset) =>
          setParams((current) => ({ ...current, offset: nextOffset }))
        }
        onOpenCreate={openCreateDialog}
        onOpenDetail={setDetailTarget}
        onOpenEdit={openEditDialog}
        onOpenToggleStatus={openConfirmDialog}
        onResetFilters={handleResetFilters}
        onRetry={() => void refetch()}
        pageSize={pageSize}
        total={total}
      />

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
