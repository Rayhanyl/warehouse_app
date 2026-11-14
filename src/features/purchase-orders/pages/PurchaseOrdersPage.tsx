import { type FormEvent, useEffect, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermission } from "@/hooks/usePermission";
import { useWarehouseScope } from "@/hooks/useWarehouseScope";
import {
  mapPurchaseOrderError,
  usePurchaseOrder,
  usePurchaseOrderMutation,
  usePurchaseOrderReferences,
  usePurchaseOrders,
} from "../api";
import { PurchaseOrderCreateForm } from "../components/PurchaseOrderCreateForm";
import {
  PurchaseOrderActionDialog,
  PurchaseOrderDetailModal,
} from "../components/PurchaseOrderDetailModal";
import { PurchaseOrderFilterBar } from "../components/PurchaseOrderFilterBar";
import { PurchaseOrdersDataView } from "../components/PurchaseOrdersDataView";
import { PO_INITIAL_PARAMS } from "../constants";
import type { PurchaseOrder, PurchaseOrderCreatePayload } from "../types";

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const { filterWarehouseChoices, resolveEffectiveWarehouseFilter } = useWarehouseScope();
  const canCreate = can("po:create");
  const canIssue = can("po:issue");
  const canCancel = can("po:cancel");
  const canClose = can("po:close");

  const [params, setParams] = useState(PO_INITIAL_PARAMS);
  const [draftParams, setDraftParams] = useState(PO_INITIAL_PARAMS);
  const openPoIdFromState =
    typeof (location.state as { openPurchaseOrderId?: unknown } | null)?.openPurchaseOrderId ===
    "number"
      ? (location.state as { openPurchaseOrderId: number }).openPurchaseOrderId
      : null;
  const [detailId, setDetailId] = useState<number | null>(openPoIdFromState);
  const [actionTarget, setActionTarget] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<"issue" | "cancel" | "close" | null>(null);
  const [closedReason, setClosedReason] = useState("");

  const effectiveWarehouseId = resolveEffectiveWarehouseFilter(params.warehouse_id);
  const { data, isLoading, isError, error, refetch } = usePurchaseOrders({
    ...params,
    warehouse_id: effectiveWarehouseId,
  });
  const references = usePurchaseOrderReferences();
  const detail = usePurchaseOrder(detailId);
  const actionMutation = usePurchaseOrderMutation(actionType ?? "issue");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (openPoIdFromState === null) return;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, navigate, openPoIdFromState]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(
    params.search ||
      params.status !== "all" ||
      params.supplier_id ||
      params.warehouse_id ||
      params.date_from ||
      params.date_to,
  );
  const activeFilterCount = [
    params.search,
    params.status !== "all",
    params.supplier_id,
    params.warehouse_id,
    params.date_from,
    params.date_to,
  ].filter(Boolean).length;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams({ ...draftParams, offset: 0 });
  }

  function resetFilters() {
    setDraftParams(PO_INITIAL_PARAMS);
    setParams(PO_INITIAL_PARAMS);
  }

  function openAction(po: PurchaseOrder, action: "issue" | "cancel" | "close") {
    setClosedReason("");
    setActionTarget(po);
    setActionType(action);
  }

  async function submitAction() {
    if (!actionTarget || !actionType) return;
    if (actionType === "close" && !closedReason.trim()) {
      toast.error("Alasan penutupan wajib diisi.");
      return;
    }
    try {
      const updated = await actionMutation.mutateAsync({
        id: actionTarget.id,
        closedReason,
      });
      setActionTarget(null);
      setActionType(null);
      toast.success(`Purchase order ${updated.po_number} berhasil diperbarui.`);
    } catch (actionError) {
      const mapped = mapPurchaseOrderError(actionError, "Aksi purchase order belum berhasil.");
      toast.error(mapped.message);
    }
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          action={
            canCreate ? (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                to="/purchase-orders/new"
              >
                <Plus aria-hidden="true" size={17} />
                Buat purchase order
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-line-200 bg-surface-0 px-3 text-xs font-semibold text-slate-600">
                Mode baca saja
              </span>
            )
          }
          description="Catat pesanan barang ke pemasok dan pantau status penerimaannya per gudang."
          title="Purchase order"
        />

        <PurchaseOrderFilterBar
          activeCount={activeFilterCount}
          draftParams={draftParams}
          onDraftChange={setDraftParams}
          onReset={resetFilters}
          onSubmit={applyFilters}
          suppliers={references.data?.suppliers ?? []}
          warehouses={filterWarehouseChoices(references.data?.warehouses ?? [])}
        />

        <PurchaseOrdersDataView
          canCreate={canCreate}
          error={error}
          hasFilters={hasFilters}
          isError={isError}
          isLoading={isLoading}
          isMobile={isMobile}
          items={items}
          limit={params.limit}
          offset={params.offset}
          onPageChange={(nextOffset) => setParams((current) => ({ ...current, offset: nextOffset }))}
          onResetFilters={resetFilters}
          onRetry={() => void refetch()}
          onSelectDetail={setDetailId}
          total={total}
        />
      </div>

      {detailId !== null && (
        <PurchaseOrderDetailModal
          canCancel={canCancel || canCreate}
          canClose={canClose}
          canIssue={canIssue}
          isLoading={detail.isLoading}
          onAction={openAction}
          onClose={() => setDetailId(null)}
          purchaseOrder={detail.data}
        />
      )}
      {actionTarget && actionType && (
        <PurchaseOrderActionDialog
          action={actionType}
          closedReason={closedReason}
          isSubmitting={actionMutation.isPending}
          onClose={() => {
            setActionTarget(null);
            setActionType(null);
          }}
          onReasonChange={setClosedReason}
          onSubmit={() => void submitAction()}
          purchaseOrder={actionTarget}
        />
      )}
    </>
  );
}

export function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const references = usePurchaseOrderReferences();
  const createMutation = usePurchaseOrderMutation("create");

  if (!can("po:create")) {
    return <Navigate replace to="/purchase-orders" />;
  }

  async function createDraft(payload: PurchaseOrderCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      toast.success(`Draft ${created.po_number} berhasil dibuat.`);
      navigate("/purchase-orders", { replace: true, state: { openPurchaseOrderId: created.id } });
    } catch (createError) {
      const mapped = mapPurchaseOrderError(createError, "Draft purchase order belum dapat dibuat.");
      toast.error(mapped.message);
      throw createError;
    }
  }

  return (
    <>
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            to="/purchase-orders"
          >
            <ChevronLeft aria-hidden="true" size={17} />
            Kembali ke daftar
          </Link>
        }
        description="Isi informasi pesanan dan barang yang akan dibeli. Dokumen disimpan sebagai draft untuk diperiksa sebelum diterbitkan."
        title="Buat purchase order"
      />
      <PurchaseOrderCreateForm
        isReferencesError={references.isError}
        isReferencesLoading={references.isLoading}
        isSubmitting={createMutation.isPending}
        onClose={() => navigate("/purchase-orders")}
        onRetryReferences={() => void references.refetch()}
        onSubmit={createDraft}
        references={references.data}
      />
    </>
  );
}
