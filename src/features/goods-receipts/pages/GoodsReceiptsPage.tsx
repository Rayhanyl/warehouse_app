import { type FormEvent, useEffect, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import {
  mapGoodsReceiptError,
  useGoodsReceipt,
  useGoodsReceiptMutation,
  useGoodsReceiptReferences,
  useGoodsReceipts,
} from "../api";
import { GoodsReceiptDetailModal } from "../components/GoodsReceiptDetailModal";
import { GoodsReceiptForm } from "../components/GoodsReceiptFormDialog";
import { GoodsReceiptsDataView } from "../components/GoodsReceiptsDataView";
import { GR_INITIAL_PARAMS } from "../constants";
import type {
  GoodsReceipt,
  GoodsReceiptCreatePayload,
  GoodsReceiptUpdatePayload,
} from "../types";

export function GoodsReceiptsPage({
  initialOpenCreate = false,
}: {
  initialOpenCreate?: boolean;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const canCreate = can("gr:create");
  const canPost = can("gr:post");
  const {
    showWarehouseFilter,
    isTopbarWarehouseLocked,
    filterWarehouseChoices,
    resolveEffectiveWarehouseFilter,
  } = useWarehouseScope();
  const [params, setParams] = useState(GR_INITIAL_PARAMS);
  const [draftParams, setDraftParams] = useState(GR_INITIAL_PARAMS);
  const openGrIdFromState =
    typeof (location.state as { openGoodsReceiptId?: unknown } | null)
      ?.openGoodsReceiptId === "number"
      ? (location.state as { openGoodsReceiptId: number }).openGoodsReceiptId
      : null;
  const [detailId, setDetailId] = useState<number | null>(openGrIdFromState);

  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/goods-receipts"
    : "/goods-receipts";
  const isCreateRoute =
    location.pathname.endsWith("/new") || initialOpenCreate;
  const editMatch = /^\/(?:purchasing\/)?goods-receipts\/(\d+)\/edit$/.exec(
    location.pathname,
  );
  const editGrId = editMatch ? Number(editMatch[1]) : null;

  const effectiveDetailId = detailId ?? openGrIdFromState;
  const effectiveWarehouseId = resolveEffectiveWarehouseFilter(
    params.warehouse_id,
  );
  const effectiveParams = { ...params, warehouse_id: effectiveWarehouseId };
  const { data, isLoading, isError, refetch } = useGoodsReceipts(effectiveParams);
  const references = useGoodsReceiptReferences();
  const detail = useGoodsReceipt(effectiveDetailId);
  const postMutation = useGoodsReceiptMutation("post");
  const cancelMutation = useGoodsReceiptMutation("cancel");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (openGrIdFromState === null) return;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, navigate, openGrIdFromState]);

  if (isCreateRoute) {
    return <GoodsReceiptCreatePage />;
  }
  if (editGrId !== null) {
    return <GoodsReceiptEditPage grIdOverride={editGrId} />;
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const effectiveFilterWarehouse = showWarehouseFilter
    ? effectiveWarehouseId
    : null;
  const hasFilters = Boolean(
    params.search.trim() ||
      params.status !== "all" ||
      effectiveFilterWarehouse ||
      params.date_from ||
      params.date_to,
  );
  const activeFilterCount = [
    params.search.trim(),
    params.status !== "all",
    effectiveFilterWarehouse,
    params.date_from,
    params.date_to,
  ].filter(Boolean).length;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      draftParams.date_from &&
      draftParams.date_to &&
      draftParams.date_from > draftParams.date_to
    ) {
      toast.error("Tanggal mulai tidak boleh lebih akhir dari tanggal akhir.");
      return;
    }
    setParams({
      ...draftParams,
      search: draftParams.search.trim(),
      offset: 0,
    });
  }

  function resetFilters() {
    setDraftParams(GR_INITIAL_PARAMS);
    setParams(GR_INITIAL_PARAMS);
  }

  async function runAction(receipt: GoodsReceipt, action: "post" | "cancel") {
    try {
      const updated = await (
        action === "post" ? postMutation : cancelMutation
      ).mutateAsync({
        id: receipt.id,
      });
      setDetailId(updated.id);
      toast.success(
        `${updated.gr_number} berhasil ${action === "post" ? "diposting" : "dibatalkan"}.`,
      );
    } catch (error) {
      toast.error(
        mapGoodsReceiptError(error, "Aksi penerimaan belum berhasil."),
      );
    }
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          action={
            canCreate ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                onClick={() => navigate(`${basePath}/new`)}
                type="button"
              >
                <Plus aria-hidden="true" size={17} />
                Buat penerimaan
              </button>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">
                Mode baca saja
              </span>
            )
          }
          description="Catat barang yang diterima terhadap purchase order, lalu posting untuk menambah saldo stok pada lokasi."
          title="Penerimaan barang"
        />

        <GoodsReceiptsDataView
          activeFilterCount={activeFilterCount}
          canManage={canCreate}
          draftParams={draftParams}
          effectiveWarehouseId={effectiveWarehouseId}
          hasFilters={hasFilters}
          isError={isError}
          isLoading={isLoading}
          isMobile={isMobile}
          isTopbarWarehouseLocked={isTopbarWarehouseLocked}
          items={items}
          limit={params.limit}
          offset={params.offset}
          onApplyFilters={applyFilters}
          onDraftChange={setDraftParams}
          onEditDraft={(receipt) => navigate(`${basePath}/${receipt.id}/edit`)}
          onOpenCreate={() => navigate(`${basePath}/new`)}
          onPageChange={(nextOffset) =>
            setParams((current) => ({ ...current, offset: nextOffset }))
          }
          onResetFilters={resetFilters}
          onRetry={() => void refetch()}
          onSelectDetail={setDetailId}
          showWarehouseFilter={showWarehouseFilter}
          total={total}
          warehouses={filterWarehouseChoices(references.data?.warehouses ?? [])}
        />
      </div>

      {effectiveDetailId !== null && (
        <GoodsReceiptDetailModal
          canCreate={canCreate}
          canPost={canPost}
          isLoading={detail.isLoading}
          isMutating={postMutation.isPending || cancelMutation.isPending}
          onAction={runAction}
          onClose={() => setDetailId(null)}
          onEdit={(receipt) => {
            setDetailId(null);
            navigate(`${basePath}/${receipt.id}/edit`);
          }}
          receipt={detail.data}
        />
      )}
    </>
  );
}

export function GoodsReceiptCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const references = useGoodsReceiptReferences();
  const createMutation = useGoodsReceiptMutation("create");
  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/goods-receipts"
    : "/goods-receipts";

  if (!can("gr:create")) {
    return <Navigate replace to={basePath} />;
  }

  async function createReceipt(payload: GoodsReceiptCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      toast.success(`Draft ${created.gr_number} berhasil dibuat.`);
      navigate(basePath, {
        replace: true,
        state: { openGoodsReceiptId: created.id },
      });
    } catch (error) {
      toast.error(
        mapGoodsReceiptError(error, "Draft penerimaan belum dapat dibuat."),
      );
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            to={basePath}
          >
            <ChevronLeft aria-hidden="true" size={17} />
            Kembali ke daftar
          </Link>
        }
        description="Pilih purchase order acuan, isi kuantitas fisik yang diterima, serta tentukan lokasi penyimpanan."
        title="Buat penerimaan barang"
      />

      <GoodsReceiptForm
        isSubmitting={createMutation.isPending}
        onClose={() => navigate(basePath)}
        onSubmit={createReceipt}
        references={references.data}
        submitLabel="Simpan draft"
      />
    </div>
  );
}

export function GoodsReceiptEditPage({
  grIdOverride,
}: {
  grIdOverride?: number;
} = {}) {
  const { grId } = useParams<{ grId: string }>();
  const parsedId = grIdOverride ?? Number(grId);
  const validId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const references = useGoodsReceiptReferences();
  const detail = useGoodsReceipt(validId);
  const updateMutation = useGoodsReceiptMutation("update");
  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/goods-receipts"
    : "/goods-receipts";

  if (!can("gr:create") || validId === null) {
    return <Navigate replace to={basePath} />;
  }

  async function updateDraft(payload: GoodsReceiptCreatePayload) {
    if (!validId) return;
    const updatePayload: GoodsReceiptUpdatePayload = {
      received_date: payload.received_date,
      notes: payload.notes,
      lines: payload.lines,
    };
    try {
      const updated = await updateMutation.mutateAsync({
        id: validId,
        payload: updatePayload,
      });
      toast.success(`Draft ${updated.gr_number} berhasil diperbarui.`);
      navigate(basePath, {
        replace: true,
        state: { openGoodsReceiptId: updated.id },
      });
    } catch (error) {
      toast.error(
        mapGoodsReceiptError(
          error,
          "Perubahan draft penerimaan belum dapat disimpan.",
        ),
      );
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            to={basePath}
          >
            <ChevronLeft aria-hidden="true" size={17} />
            Kembali ke daftar
          </Link>
        }
        description="Perbarui tanggal terima, catatan, atau alokasi lokasi serta kuantitas selama penerimaan masih berstatus Draft."
        title={
          detail.data
            ? `Ubah Draft ${detail.data.gr_number}`
            : "Ubah Draft Penerimaan Barang"
        }
      />

      {detail.isLoading ? (
        <div
          className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 text-sm text-slate-700"
          role="status"
        >
          Memuat draft penerimaan barang...
        </div>
      ) : detail.isError || !detail.data ? (
        <div
          className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-50 p-6 text-sm text-red-700"
          role="alert"
        >
          Draft penerimaan barang tidak ditemukan atau gagal dimuat.
        </div>
      ) : detail.data.status !== "DRAFT" ? (
        <div
          className="rounded-[var(--radius-lg)] border border-amber-600/30 bg-amber-50 p-6 text-sm text-amber-900"
          role="alert"
        >
          Penerimaan barang {detail.data.gr_number} sudah berstatus{" "}
          {detail.data.status} sehingga tidak dapat diubah lagi.
        </div>
      ) : (
        <GoodsReceiptForm
          initialReceipt={detail.data}
          isSubmitting={updateMutation.isPending}
          onClose={() => navigate(basePath)}
          onSubmit={updateDraft}
          references={references.data}
          submitLabel="Simpan perubahan GR"
        />
      )}
    </div>
  );
}
