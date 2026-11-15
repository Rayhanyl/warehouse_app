import { type FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
import { GoodsReceiptFormDialog } from "../components/GoodsReceiptFormDialog";
import { GoodsReceiptsDataView } from "../components/GoodsReceiptsDataView";
import { GR_INITIAL_PARAMS } from "../constants";
import type { GoodsReceipt, GoodsReceiptCreatePayload } from "../types";

export function GoodsReceiptsPage({
  initialOpenCreate = false,
}: {
  initialOpenCreate?: boolean;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateRoute = location.pathname.endsWith("/new") || initialOpenCreate;
  const { can } = usePermission();
  const canManage = can("gr:manage");
  const { resolveEffectiveWarehouseFilter } = useWarehouseScope();
  const [params, setParams] = useState(GR_INITIAL_PARAMS);
  const [draftParams, setDraftParams] = useState(GR_INITIAL_PARAMS);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(isCreateRoute && canManage);
  const [initialCreateDismissed, setInitialCreateDismissed] = useState(false);
  const showForm = formOpen || (isCreateRoute && canManage && !initialCreateDismissed);

  const effectiveWarehouseId = resolveEffectiveWarehouseFilter(params.warehouse_id);
  const effectiveParams = { ...params, warehouse_id: effectiveWarehouseId };
  const { data, isLoading, isError, refetch } = useGoodsReceipts(effectiveParams);
  const references = useGoodsReceiptReferences();
  const detail = useGoodsReceipt(detailId);
  const createMutation = useGoodsReceiptMutation("create");
  const postMutation = useGoodsReceiptMutation("post");
  const cancelMutation = useGoodsReceiptMutation("cancel");
  const isMobile = useIsMobile();

  if (isCreateRoute && !canManage) {
    const fallbackPath = location.pathname.startsWith("/purchasing")
      ? "/purchasing/goods-receipts"
      : "/goods-receipts";
    return <Navigate replace to={fallbackPath} />;
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(
    params.search || params.status !== "all" || params.date_from || params.date_to,
  );
  const activeFilterCount = [
    params.search,
    params.status !== "all",
    params.date_from,
    params.date_to,
  ].filter(Boolean).length;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draftParams, offset: 0 });
  }

  function resetFilters() {
    setDraftParams(GR_INITIAL_PARAMS);
    setParams(GR_INITIAL_PARAMS);
  }

  function handleCloseForm() {
    setFormOpen(false);
    setInitialCreateDismissed(true);
    if (location.pathname.endsWith("/new")) {
      const parentPath = location.pathname.startsWith("/purchasing")
        ? "/purchasing/goods-receipts"
        : "/goods-receipts";
      navigate(parentPath, { replace: true });
    }
  }

  async function createReceipt(payload: GoodsReceiptCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      setParams((prev) => ({ ...prev, offset: 0 }));
      setFormOpen(false);
      setInitialCreateDismissed(true);
      setDetailId(created.id);
      toast.success(`Draft ${created.gr_number} berhasil dibuat.`);
      if (location.pathname.endsWith("/new")) {
        const parentPath = location.pathname.startsWith("/purchasing")
          ? "/purchasing/goods-receipts"
          : "/goods-receipts";
        navigate(parentPath, { replace: true });
      }
    } catch (error) {
      toast.error(mapGoodsReceiptError(error, "Draft penerimaan belum dapat dibuat."));
      throw error;
    }
  }

  async function runAction(receipt: GoodsReceipt, action: "post" | "cancel") {
    try {
      const updated = await (action === "post" ? postMutation : cancelMutation).mutateAsync({
        id: receipt.id,
      });
      setDetailId(updated.id);
      toast.success(
        `${updated.gr_number} berhasil ${action === "post" ? "diposting" : "dibatalkan"}.`,
      );
    } catch (error) {
      toast.error(mapGoodsReceiptError(error, "Aksi penerimaan belum berhasil."));
    }
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          action={
            canManage ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                onClick={() => setFormOpen(true)}
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
          canManage={canManage}
          draftParams={draftParams}
          hasFilters={hasFilters}
          isError={isError}
          isLoading={isLoading}
          isMobile={isMobile}
          items={items}
          limit={params.limit}
          offset={params.offset}
          onApplyFilters={applyFilters}
          onDraftChange={setDraftParams}
          onOpenCreate={() => setFormOpen(true)}
          onPageChange={(nextOffset) => setParams((current) => ({ ...current, offset: nextOffset }))}
          onResetFilters={resetFilters}
          onRetry={() => void refetch()}
          onSelectDetail={setDetailId}
          total={total}
        />
      </div>

      {showForm && (
        <GoodsReceiptFormDialog
          isSubmitting={createMutation.isPending}
          onClose={handleCloseForm}
          onSubmit={createReceipt}
          references={references.data}
        />
      )}

      {detailId !== null && (
        <GoodsReceiptDetailModal
          canManage={canManage}
          isLoading={detail.isLoading}
          isMutating={postMutation.isPending || cancelMutation.isPending}
          onAction={runAction}
          onClose={() => setDetailId(null)}
          receipt={detail.data}
        />
      )}
    </>
  );
}

export function GoodsReceiptCreatePage() {
  return <GoodsReceiptsPage initialOpenCreate={true} />;
}
