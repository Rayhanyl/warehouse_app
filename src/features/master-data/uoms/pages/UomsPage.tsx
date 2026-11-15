import { FormEvent, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/usePermission";
import { MasterNoticeBanner } from "../../components/MasterNoticeBanner";
import { downloadMasterCsv, type MasterPageNotice } from "../../utils";
import {
  buildUomsCsv,
  fetchUoms,
  mapUomApiError,
  useCreateUom,
  useUoms,
  useUpdateUom,
} from "../api";
import { UomDeleteDialog } from "../components/UomDeleteDialog";
import { UomDetailDialog } from "../components/UomDetailDialog";
import { UomFormDialog } from "../components/UomFormDialog";
import { UomsDataView } from "../components/UomsDataView";
import { UomsFilterBar } from "../components/UomsFilterBar";
import { INITIAL_UOM_LIST_PARAMS } from "../schemas";
import type {
  SortDirection,
  Uom,
  UomCreatePayload,
  UomListParams,
  UomSortField,
  UomStatusFilter,
  UomUpdatePayload,
} from "../types";

export function UomsPage() {
  const { can } = usePermission();
  const canManage = can("master:manage");

  const [params, setParams] = useState<UomListParams>(INITIAL_UOM_LIST_PARAMS);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState<UomStatusFilter>("all");
  const [draftSortBy, setDraftSortBy] = useState<UomSortField>("id");
  const [draftSortDir, setDraftSortDir] = useState<SortDirection>("asc");

  const [notice, setNotice] = useState<MasterPageNotice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [detailTarget, setDetailTarget] = useState<Uom | null>(null);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    uom: Uom | null;
  }>({
    isOpen: false,
    mode: "create",
    uom: null,
  });
  const [formError, setFormError] = useState<{
    message: string;
    requestId?: string;
    fieldErrors?: { code?: string; name?: string };
  } | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<Uom | null>(null);
  const [confirmError, setConfirmError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useUoms(params);
  const createMutation = useCreateUom();
  const updateMutation = useUpdateUom();

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
    ? mapUomApiError(error, "Data satuan ukur belum dapat dimuat.")
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
    setParams(INITIAL_UOM_LIST_PARAMS);
  }

  function openCreateDialog() {
    setFormError(null);
    setFormState({ isOpen: true, mode: "create", uom: null });
  }

  function openEditDialog(uom: Uom) {
    setFormError(null);
    setFormState({ isOpen: true, mode: "edit", uom });
  }

  function closeFormDialog() {
    setFormError(null);
    setFormState((current) => ({ ...current, isOpen: false }));
  }

  function openConfirmDialog(uom: Uom) {
    setConfirmError(null);
    setConfirmTarget(uom);
  }

  function closeConfirmDialog() {
    setConfirmError(null);
    setConfirmTarget(null);
  }

  async function handleFormSubmit(
    payload: UomCreatePayload | UomUpdatePayload,
  ) {
    setFormError(null);
    if (formState.mode === "create") {
      try {
        const created = await createMutation.mutateAsync({
          code: payload.code ?? "",
          name: payload.name ?? "",
          allow_decimal: payload.allow_decimal ?? false,
          is_active: payload.is_active ?? true,
        });
        closeFormDialog();
        showNotification({
          type: "success",
          message: `Satuan ukur "${created.name} (${created.code})" berhasil ditambahkan.`,
        });
      } catch (err) {
        const mapped = mapUomApiError(err, "Satuan ukur baru belum dapat disimpan.");
        setFormError(mapped);
        showNotification({
          type: "error",
          message: mapped.message,
          requestId: mapped.requestId,
        });
      }
      return;
    }

    if (!formState.uom) {
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({
        uomId: formState.uom.id,
        payload,
      });
      closeFormDialog();
      showNotification({
        type: "success",
        message: `Satuan ukur "${updated.name} (${updated.code})" berhasil diperbarui.`,
      });
    } catch (err) {
      const mapped = mapUomApiError(err, "Perubahan satuan ukur belum dapat disimpan.");
      setFormError(mapped);
      showNotification({
        type: "error",
        message: mapped.message,
        requestId: mapped.requestId,
      });
    }
  }

  async function handleConfirmStatusChange(uom: Uom) {
    setConfirmError(null);
    const nextActive = !uom.is_active;
    try {
      const updated = await updateMutation.mutateAsync({
        uomId: uom.id,
        payload: { is_active: nextActive },
      });
      closeConfirmDialog();
      showNotification({
        type: "success",
        message: nextActive
          ? `Satuan ukur "${updated.name} (${updated.code})" berhasil diaktifkan kembali.`
          : `Satuan ukur "${updated.name} (${updated.code})" berhasil dinonaktifkan.`,
      });
    } catch (err) {
      const mapped = mapUomApiError(
        err,
        nextActive
          ? "Satuan ukur belum dapat diaktifkan kembali."
          : "Satuan ukur belum dapat dinonaktifkan.",
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
      const exportPage = await fetchUoms({ ...params, limit: 200, offset: 0 });
      const rows = exportPage.items;
      if (rows.length === 0) {
        showNotification({
          type: "error",
          message: "Belum ada data satuan ukur yang dapat diunduh.",
        });
        return;
      }

      downloadMasterCsv("satuan-ukur", buildUomsCsv(rows));
      showNotification({
        type: "success",
        message: `Data satuan ukur (${rows.length} baris) berhasil diunduh.`,
      });
    } catch (err) {
      const mapped = mapUomApiError(err, "Gagal mengunduh data satuan ukur.");
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
                Tambah satuan ukur
              </Button>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">
                Mode baca saja
              </span>
            )}
          </>
        }
        description="Kelola satuan ukur dasar (Unit of Measure) beserta aturan presisi kuantitas desimal untuk setiap barang (SKU)."
        title="Satuan ukur (UoM)"
      />

      <MasterNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <UomsFilterBar
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

      <UomsDataView
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

      <UomDetailDialog
        canManage={canManage}
        onClose={() => setDetailTarget(null)}
        onEdit={openEditDialog}
        onToggleStatus={openConfirmDialog}
        uom={detailTarget}
      />

      <UomFormDialog
        initialUom={formState.uom}
        isOpen={formState.isOpen}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        key={`${formState.mode}-${formState.uom?.id ?? "new"}-${formState.isOpen ? "open" : "closed"}`}
        mode={formState.mode}
        onClose={closeFormDialog}
        onSubmit={handleFormSubmit}
        submitError={formError}
      />

      <UomDeleteDialog
        actionError={confirmError}
        isSubmitting={updateMutation.isPending}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmStatusChange}
        uom={confirmTarget}
      />
    </>
  );
}
