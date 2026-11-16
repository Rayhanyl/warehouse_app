import { type FormEvent, useEffect, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  type PurchaseOrderActionType,
} from "../components/PurchaseOrderDetailModal";
import { PurchaseOrderFilterBar } from "../components/PurchaseOrderFilterBar";
import { PurchaseOrdersDataView } from "../components/PurchaseOrdersDataView";
import { PO_INITIAL_PARAMS } from "../constants";
import type {
  PurchaseOrder,
  PurchaseOrderCreatePayload,
  PurchaseOrderLine,
  PurchaseOrderListParams,
  PurchaseOrderSortField,
  PurchaseOrderStatus,
  PurchaseOrderUpdatePayload,
  SortDirection,
} from "../types";

function parsePoParamsFromSearch(searchParams: URLSearchParams): PurchaseOrderListParams {
  const offset = Number(searchParams.get("offset") ?? PO_INITIAL_PARAMS.offset);
  const supplierId = searchParams.get("supplier_id");
  const warehouseId = searchParams.get("warehouse_id");
  return {
    ...PO_INITIAL_PARAMS,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as PurchaseOrderStatus | "all") || "all",
    supplier_id: supplierId ? Number(supplierId) : null,
    warehouse_id: warehouseId ? Number(warehouseId) : null,
    date_from: searchParams.get("date_from") ?? "",
    date_to: searchParams.get("date_to") ?? "",
    overdue_only: searchParams.get("overdue_only") === "true",
    sort_by: (searchParams.get("sort_by") as PurchaseOrderSortField) || PO_INITIAL_PARAMS.sort_by,
    sort_dir: (searchParams.get("sort_dir") as SortDirection) || PO_INITIAL_PARAMS.sort_dir,
  };
}

function buildPoSearchParams(params: PurchaseOrderListParams): URLSearchParams {
  const next = new URLSearchParams();
  if (params.search.trim()) next.set("search", params.search.trim());
  if (params.status !== "all") next.set("status", params.status);
  if (params.supplier_id) next.set("supplier_id", String(params.supplier_id));
  if (params.warehouse_id) next.set("warehouse_id", String(params.warehouse_id));
  if (params.date_from) next.set("date_from", params.date_from);
  if (params.date_to) next.set("date_to", params.date_to);
  if (params.overdue_only) next.set("overdue_only", "true");
  if (params.sort_by !== PO_INITIAL_PARAMS.sort_by) next.set("sort_by", params.sort_by);
  if (params.sort_dir !== PO_INITIAL_PARAMS.sort_dir) next.set("sort_dir", params.sort_dir);
  if (params.offset > 0) next.set("offset", String(params.offset));
  return next;
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermission();
  const {
    showWarehouseFilter,
    isTopbarWarehouseLocked,
    filterWarehouseChoices,
    resolveEffectiveWarehouseFilter,
  } = useWarehouseScope();
  const canCreate = can("po:create");
  const canApproveL1 = can("po:approve_l1");
  const canApproveL2 = can("po:approve_l2");
  const canIssue = canApproveL1;
  const canCancel = can("po:cancel");
  const canClose = can("po:close");

  const [params, setParams] = useState<PurchaseOrderListParams>(() =>
    parsePoParamsFromSearch(searchParams),
  );
  const [draftParams, setDraftParams] = useState<PurchaseOrderListParams>(() =>
    parsePoParamsFromSearch(searchParams),
  );
  const openPoIdFromState =
    typeof (location.state as { openPurchaseOrderId?: unknown } | null)?.openPurchaseOrderId ===
    "number"
      ? (location.state as { openPurchaseOrderId: number }).openPurchaseOrderId
      : null;
  const [detailId, setDetailId] = useState<number | null>(openPoIdFromState);
  const [actionTarget, setActionTarget] = useState<PurchaseOrder | null>(null);
  const [actionLine, setActionLine] = useState<PurchaseOrderLine | null>(null);
  const [actionType, setActionType] = useState<PurchaseOrderActionType | null>(null);
  const [closedReason, setClosedReason] = useState("");
  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/purchase-orders"
    : "/purchase-orders";

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
  const effectiveFilterWarehouse = showWarehouseFilter ? effectiveWarehouseId : null;
  const hasFilters = Boolean(
    params.search.trim() ||
      params.status !== "all" ||
      params.supplier_id ||
      effectiveFilterWarehouse ||
      params.date_from ||
      params.date_to ||
      params.overdue_only,
  );
  const activeFilterCount = [
    params.search.trim(),
    params.status !== "all",
    params.supplier_id,
    effectiveFilterWarehouse,
    params.date_from,
    params.date_to,
    params.overdue_only,
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
    const nextParams = {
      ...draftParams,
      search: draftParams.search.trim(),
      offset: 0,
    };
    setParams(nextParams);
    setSearchParams(buildPoSearchParams(nextParams), { replace: true });
  }

  function resetFilters() {
    setDraftParams(PO_INITIAL_PARAMS);
    setParams(PO_INITIAL_PARAMS);
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function openAction(
    po: PurchaseOrder,
    action: PurchaseOrderActionType,
    poLine?: PurchaseOrderLine,
  ) {
    setClosedReason("");
    setActionTarget(po);
    setActionLine(poLine ?? null);
    setActionType(action);
  }

  async function submitAction() {
    if (!actionTarget || !actionType) return;
    if ((actionType === "close" || actionType === "close-line") && !closedReason.trim()) {
      toast.error("Alasan penutupan wajib diisi.");
      return;
    }
    if (actionType === "reject" && !closedReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    try {
      const updated = await actionMutation.mutateAsync({
        id: actionTarget.id,
        poLineId: actionLine?.id,
        closedReason,
      });
      const prevPoNumber = actionTarget.po_number;
      const completedAction = actionType;
      setActionTarget(null);
      setActionLine(null);
      setActionType(null);
      if (completedAction === "revise-draft") {
        setDetailId(null);
        toast.success(`PO ${prevPoNumber} dibatalkan dan disalin ke draft ${updated.po_number}.`);
        navigate(`${basePath}/${updated.id}/edit`);
        return;
      }
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
          effectiveWarehouseId={effectiveWarehouseId}
          isTopbarWarehouseLocked={isTopbarWarehouseLocked}
          onDraftChange={setDraftParams}
          onReset={resetFilters}
          onSubmit={applyFilters}
          showWarehouseFilter={showWarehouseFilter}
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
          onPageChange={(nextOffset) => {
            const nextParams = { ...params, offset: nextOffset };
            setParams(nextParams);
            setSearchParams(buildPoSearchParams(nextParams), { replace: true });
          }}
          onResetFilters={resetFilters}
          onRetry={() => void refetch()}
          onSelectDetail={setDetailId}
          total={total}
        />
      </div>

      {detailId !== null && (
        <PurchaseOrderDetailModal
          canApproveL1={canApproveL1}
          canApproveL2={canApproveL2}
          canCancel={canCancel || canCreate}
          canClose={canClose}
          canEdit={canCreate}
          canIssue={canIssue}
          isLoading={detail.isLoading}
          onAction={openAction}
          onClose={() => setDetailId(null)}
          onEdit={(po) => {
            setDetailId(null);
            navigate(`${basePath}/${po.id}/edit${location.search}`);
          }}
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
            setActionLine(null);
            setActionType(null);
          }}
          onReasonChange={setClosedReason}
          onSubmit={() => void submitAction()}
          purchaseOrder={actionTarget}
          targetLine={actionLine}
        />
      )}
    </>
  );
}

export function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const references = usePurchaseOrderReferences();
  const createMutation = usePurchaseOrderMutation("create");
  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/purchase-orders"
    : "/purchase-orders";

  if (!can("po:create")) {
    return <Navigate replace to={basePath} />;
  }

  async function createDraft(payload: PurchaseOrderCreatePayload) {
    try {
      const created = await createMutation.mutateAsync({ payload });
      toast.success(`Draft ${created.po_number} berhasil dibuat.`);
      navigate(basePath, { replace: true, state: { openPurchaseOrderId: created.id } });
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
            to={basePath}
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
        onClose={() => navigate(basePath)}
        onRetryReferences={() => void references.refetch()}
        onSubmit={createDraft}
        references={references.data}
      />
    </>
  );
}

export function PurchaseOrderEditPage() {
  const { poId } = useParams<{ poId: string }>();
  const parsedId = Number(poId);
  const validId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const references = usePurchaseOrderReferences();
  const detail = usePurchaseOrder(validId);
  const updateMutation = usePurchaseOrderMutation("update");
  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/purchase-orders"
    : "/purchase-orders";
  const returnListPath = `${basePath}${location.search}`;

  if (!can("po:create") || validId === null) {
    return <Navigate replace to={returnListPath} />;
  }

  async function updateDraft(payload: PurchaseOrderCreatePayload) {
    if (!validId) return;
    const updatePayload: PurchaseOrderUpdatePayload = {
      supplier_id: payload.supplier_id,
      warehouse_id: payload.warehouse_id,
      order_date: payload.order_date,
      expected_delivery_date: payload.expected_delivery_date ?? null,
      notes: payload.notes,
      lines: payload.lines,
    };
    try {
      const updated = await updateMutation.mutateAsync({
        id: validId,
        payload: updatePayload,
      });
      toast.success(`Draft ${updated.po_number} berhasil diperbarui.`);
      navigate(returnListPath, { replace: true, state: { openPurchaseOrderId: updated.id } });
    } catch (updateError) {
      const mapped = mapPurchaseOrderError(
        updateError,
        "Perubahan draft purchase order belum dapat disimpan.",
      );
      toast.error(mapped.message);
      throw updateError;
    }
  }

  return (
    <>
      <PageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            to={returnListPath}
          >
            <ChevronLeft aria-hidden="true" size={17} />
            Kembali ke daftar
          </Link>
        }
        description="Perbarui pemasok, gudang tujuan, estimasi kirim, atau baris barang selama purchase order masih berstatus Draft."
        title={detail.data ? `Ubah Draft ${detail.data.po_number}` : "Ubah Draft Purchase Order"}
      />
      {detail.isLoading ? (
        <div className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-6 text-sm text-slate-700">
          Memuat draft purchase order...
        </div>
      ) : detail.isError || !detail.data ? (
        <div className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-50 p-6 text-sm text-red-700">
          Draft purchase order tidak ditemukan atau gagal dimuat.
        </div>
      ) : detail.data.status !== "DRAFT" ? (
        <div className="rounded-[var(--radius-lg)] border border-amber-600/30 bg-amber-50 p-6 text-sm text-amber-900">
          PO {detail.data.po_number} berstatus {detail.data.status} sehingga tidak dapat diedit
          langsung. Gunakan aksi &quot;Batalkan &amp; Salin ke Draft Baru&quot; pada detail PO
          jika belum ada penerimaan barang.
        </div>
      ) : (
        <PurchaseOrderCreateForm
          initialPurchaseOrder={detail.data}
          isReferencesError={references.isError}
          isReferencesLoading={references.isLoading}
          isSubmitting={updateMutation.isPending}
          onClose={() => navigate(returnListPath)}
          onRetryReferences={() => void references.refetch()}
          onSubmit={updateDraft}
          references={references.data}
          submitLabel="Simpan perubahan PO"
        />
      )}
    </>
  );
}
