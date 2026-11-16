import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  Copy,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  Send,
  XCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApprovalTimeline } from "@/components/shared";
import { useGoodsReceipts } from "@/features/goods-receipts/api";
import {
  formatGrDate,
  GR_INITIAL_PARAMS,
  GR_STATUS_CLASSES,
  GR_STATUS_LABELS,
} from "@/features/goods-receipts/constants";
import { usePermission } from "@/hooks/usePermission";
import { evaluateSodGuard, formatCurrencyIdr } from "@/lib/utils";
import {
  mapPurchaseOrderError,
  usePurchaseOrder,
  usePurchaseOrderMutation,
} from "../api";
import {
  PurchaseOrderActionDialog,
  type PurchaseOrderActionType,
} from "../components/PurchaseOrderDetailModal";
import { PurchaseOrderPrintSheet } from "../components/PurchaseOrderPrintSheet";
import {
  formatPoDate,
  formatPoDateTime,
  PO_LINE_STATUS_LABELS,
  PO_STATUS_CLASSES,
  PO_STATUS_LABELS,
} from "../constants";
import type { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from "../types";

const PRINTABLE_PO_STATUSES = new Set<PurchaseOrderStatus>([
  "ISSUED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED",
]);

export function PurchaseOrderDetailPage({
  poIdOverride,
}: {
  poIdOverride?: number;
} = {}) {
  const { poId } = useParams<{ poId: string }>();
  const parsedId = poIdOverride ?? Number(poId);
  const validId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  const navigate = useNavigate();
  const location = useLocation();
  const { can, user } = usePermission();

  const canEdit = can("po:create");
  const canApproveL1 = can("po:approve_l1");
  const canApproveL2 = can("po:approve_l2");
  const canIssue = canApproveL1 || can("po:issue");
  const canCancel = can("po:cancel") || can("po:create");
  const canClose = can("po:close");
  const canReadGr = can("gr:read");
  const canCreateGr = can("gr:create");

  const basePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/purchase-orders"
    : "/purchase-orders";
  const grBasePath = location.pathname.startsWith("/purchasing")
    ? "/purchasing/goods-receipts"
    : "/goods-receipts";
  const returnListPath = `${basePath}${location.search}`;

  const detail = usePurchaseOrder(validId);
  const purchaseOrder = detail.data;

  const relatedGrQuery = useGoodsReceipts({
    ...GR_INITIAL_PARAMS,
    po_id: validId,
    limit: 50,
  });

  const [previewPoId, setPreviewPoId] = useState<number | null>(null);
  const [actionTarget, setActionTarget] = useState<PurchaseOrder | null>(null);
  const [actionLine, setActionLine] = useState<PurchaseOrderLine | null>(null);
  const [actionType, setActionType] = useState<PurchaseOrderActionType | null>(null);
  const [closedReason, setClosedReason] = useState("");
  const actionMutation = usePurchaseOrderMutation(actionType ?? "issue");

  const showPrintPreview = Boolean(purchaseOrder && previewPoId === purchaseOrder.id);
  const canPrint = Boolean(
    purchaseOrder && PRINTABLE_PO_STATUSES.has(purchaseOrder.status),
  );

  const issueSod = evaluateSodGuard(
    user,
    [purchaseOrder?.created_by, purchaseOrder?.submitted_by],
    "Aturan Pemisahan Tugas (SoD): pembuat/pengaju PO tidak dapat menerbitkan atau menyetujui PO-nya sendiri.",
  );
  const l1Sod = evaluateSodGuard(
    user,
    [purchaseOrder?.created_by, purchaseOrder?.submitted_by],
    "Aturan Pemisahan Tugas (SoD): pembuat atau pengaju PO tidak dapat melakukan Approval Level 1 sendiri.",
  );
  const l2Sod = evaluateSodGuard(
    user,
    [
      purchaseOrder?.created_by,
      purchaseOrder?.submitted_by,
      purchaseOrder?.l1_approved_by,
    ],
    "Aturan Pemisahan Tugas (SoD): pembuat, pengaju, atau penyetuju Level 1 tidak dapat melakukan Approval Level 2 sendiri.",
  );

  const activeSodBanner =
    purchaseOrder?.status === "WAITING_L1_APPROVAL" && canApproveL1
      ? l1Sod
      : purchaseOrder?.status === "WAITING_L2_APPROVAL" && canApproveL2
        ? l2Sod
        : purchaseOrder?.status === "DRAFT" && canIssue
          ? issueSod
          : null;

  function handlePrint() {
    if (!purchaseOrder) return;
    toast.dismiss();
    setPreviewPoId(purchaseOrder.id);
    window.print();
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
        toast.success(
          `PO ${prevPoNumber} dibatalkan dan disalin ke draft ${updated.po_number}.`,
        );
        navigate(`${basePath}/${updated.id}/edit${location.search}`);
        return;
      }
      toast.success(`Purchase order ${updated.po_number} berhasil diperbarui.`);
    } catch (actionError) {
      const mapped = mapPurchaseOrderError(
        actionError,
        "Aksi purchase order belum berhasil.",
      );
      toast.error(mapped.message);
    }
  }

  const relatedReceipts = canReadGr ? (relatedGrQuery.data?.items ?? []) : [];
  const canCreateReceiptForPo = Boolean(
    purchaseOrder &&
      canCreateGr &&
      (purchaseOrder.status === "ISSUED" ||
        purchaseOrder.status === "PARTIALLY_RECEIVED"),
  );

  return (
    <>
      <div className="no-print space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            to={returnListPath}
          >
            <ChevronLeft aria-hidden="true" size={17} />
            Kembali ke daftar
          </Link>
        </div>

        {detail.isLoading ? (
          <div
            className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-8 text-sm text-slate-700 shadow-[var(--shadow-1)]"
            role="status"
          >
            Memuat detail purchase order...
          </div>
        ) : detail.isError || !purchaseOrder ? (
          <div
            className="rounded-[var(--radius-lg)] border border-red-600/30 bg-red-50 p-6 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">
              Detail purchase order tidak ditemukan atau belum dapat dimuat
            </p>
            <p className="mt-1">
              {
                mapPurchaseOrderError(
                  detail.error,
                  "Periksa kembali tautan dokumen atau koneksi jaringan Anda.",
                ).message
              }
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-600 px-4 text-sm font-semibold text-surface-0 hover:bg-red-700"
              onClick={() => void detail.refetch()}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* 1. Header Dokumen & Bar Aksi Workflow */}
            <section
              aria-label="Header dan aksi purchase order"
              className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Detail purchase order
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2.5">
                    <h1
                      className="text-xl font-bold text-ink-950 sm:text-2xl"
                      id="po-detail-title"
                    >
                      {purchaseOrder.po_number}
                    </h1>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PO_STATUS_CLASSES[purchaseOrder.status]}`}
                    >
                      {PO_STATUS_LABELS[purchaseOrder.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700">
                    Dibuat pada {formatPoDateTime(purchaseOrder.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canPrint && (
                    <>
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                        onClick={() =>
                          setPreviewPoId((prev) =>
                            prev === purchaseOrder.id ? null : purchaseOrder.id,
                          )
                        }
                        type="button"
                      >
                        {showPrintPreview
                          ? "Sembunyikan pratinjau cetak"
                          : "Pratinjau PO cetak"}
                      </button>
                      <button
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-ink-950 px-4 text-sm font-semibold text-surface-0 hover:bg-ink-800"
                        onClick={handlePrint}
                        type="button"
                      >
                        <Printer aria-hidden="true" size={16} />
                        Cetak Purchase Order
                      </button>
                    </>
                  )}
                  {purchaseOrder.status === "DRAFT" && canEdit && (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                      onClick={() =>
                        navigate(`${basePath}/${purchaseOrder.id}/edit${location.search}`)
                      }
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={16} />
                      Ubah Draft PO
                    </button>
                  )}
                  {purchaseOrder.status === "DRAFT" &&
                    canEdit &&
                    (purchaseOrder.lines?.length ?? 0) > 0 && (
                      <button
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-indigo-600 px-4 text-sm font-semibold text-surface-0 hover:bg-indigo-700"
                        onClick={() => openAction(purchaseOrder, "submit")}
                        type="button"
                      >
                        <Send aria-hidden="true" size={16} />
                        Ajukan Persetujuan
                      </button>
                    )}
                  {purchaseOrder.status === "ISSUED" && canEdit && canCancel && (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-teal-700/40 bg-surface-0 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                      onClick={() => openAction(purchaseOrder, "revise-draft")}
                      type="button"
                    >
                      <Copy aria-hidden="true" size={16} />
                      Batalkan &amp; Salin ke Draft Baru
                    </button>
                  )}
                  {purchaseOrder.status === "DRAFT" &&
                    canIssue &&
                    !issueSod.isBlocked && (
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                        onClick={() => openAction(purchaseOrder, "issue")}
                        type="button"
                      >
                        Terbitkan purchase order
                      </button>
                    )}
                  {purchaseOrder.status === "WAITING_L1_APPROVAL" && canApproveL1 && (
                    <>
                      {!l1Sod.isBlocked && (
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                          onClick={() => openAction(purchaseOrder, "approve")}
                          type="button"
                        >
                          <CheckCircle2 aria-hidden="true" size={16} />
                          Setujui Level 1
                        </button>
                      )}
                      <button
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                        onClick={() => openAction(purchaseOrder, "reject")}
                        type="button"
                      >
                        <XCircle aria-hidden="true" size={16} />
                        Tolak
                      </button>
                    </>
                  )}
                  {purchaseOrder.status === "WAITING_L2_APPROVAL" && canApproveL2 && (
                    <>
                      {!l2Sod.isBlocked && (
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                          onClick={() => openAction(purchaseOrder, "approve")}
                          type="button"
                        >
                          <CheckCircle2 aria-hidden="true" size={16} />
                          Setujui Level 2 (Final)
                        </button>
                      )}
                      <button
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                        onClick={() => openAction(purchaseOrder, "reject")}
                        type="button"
                      >
                        <XCircle aria-hidden="true" size={16} />
                        Tolak
                      </button>
                    </>
                  )}
                  {(purchaseOrder.status === "ISSUED" ||
                    purchaseOrder.status === "PARTIALLY_RECEIVED") &&
                    canClose && (
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                        onClick={() => openAction(purchaseOrder, "close")}
                        type="button"
                      >
                        Tutup PO (Selesai Sebagian / Hentikan Sisa)
                      </button>
                    )}
                  {(purchaseOrder.status === "DRAFT" ||
                    purchaseOrder.status === "WAITING_L1_APPROVAL" ||
                    purchaseOrder.status === "WAITING_L2_APPROVAL" ||
                    purchaseOrder.status === "ISSUED") &&
                    canCancel && (
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-red-600/40 bg-surface-0 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
                        onClick={() => openAction(purchaseOrder, "cancel")}
                        type="button"
                      >
                        Batalkan purchase order
                      </button>
                    )}
                </div>
              </div>

              {purchaseOrder.rejection_reason && purchaseOrder.status === "DRAFT" && (
                <div className="mt-4 rounded-[var(--radius-md)] border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                  <p className="font-semibold">PO Dikembalikan / Ditolak</p>
                  <p className="mt-1">
                    Alasan penolakan: {purchaseOrder.rejection_reason}
                  </p>
                </div>
              )}

              {activeSodBanner &&
                (activeSodBanner.isBlocked || activeSodBanner.isOverride) && (
                  <div
                    className={`mt-4 rounded-[var(--radius-md)] border p-3 text-sm ${
                      activeSodBanner.isBlocked
                        ? "border-amber-300 bg-amber-50 text-amber-950"
                        : "border-blue-300 bg-blue-50 text-blue-950"
                    }`}
                  >
                    <p className="font-semibold">
                      {activeSodBanner.isOverride
                        ? "Mode Override Super Admin"
                        : "Pemisahan Tugas (Segregation of Duties)"}
                    </p>
                    <p className="mt-0.5 text-xs leading-5">
                      {activeSodBanner.reason}
                      {activeSodBanner.isOverride
                        ? " Sebagai Super Admin Anda dapat melanjutkan, dan override akan dicatat di Audit Log."
                        : ""}
                    </p>
                  </div>
                )}

              {purchaseOrder.status === "CLOSED" && (
                <div className="mt-4 rounded-[var(--radius-md)] border border-amber-600/30 bg-amber-50 p-3 text-sm text-amber-950">
                  <p className="font-semibold">
                    Purchase order ditutup (CLOSED / Short-Close)
                  </p>
                  <p className="mt-1">
                    Alasan:{" "}
                    {purchaseOrder.closed_reason ||
                      "Ditutup sesuai penyelesaian seluruh baris."}
                  </p>
                  {purchaseOrder.closed_at && (
                    <p className="mt-1 text-xs text-amber-800">
                      Ditutup pada {formatPoDateTime(purchaseOrder.closed_at)}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* 2. Ringkasan Metadata PO & Pemasok */}
            <section
              aria-label="Informasi pemasok dan metadata PO"
              className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-6"
            >
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
                Informasi Pemasok &amp; Pengiriman
              </h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-600">Pemasok</dt>
                  <dd className="mt-1 font-semibold text-ink-950">
                    {purchaseOrder.supplier_code} · {purchaseOrder.supplier_name}
                  </dd>
                  {(purchaseOrder.supplier_phone ||
                    purchaseOrder.supplier_fax ||
                    purchaseOrder.supplier_payment_terms ||
                    purchaseOrder.supplier_bank_account_number) && (
                    <dd className="mt-1 space-y-0.5 text-xs text-slate-600">
                      {(purchaseOrder.supplier_phone || purchaseOrder.supplier_fax) && (
                        <p>
                          {purchaseOrder.supplier_phone
                            ? `Telp: ${purchaseOrder.supplier_phone}`
                            : ""}
                          {purchaseOrder.supplier_phone && purchaseOrder.supplier_fax
                            ? " · "
                            : ""}
                          {purchaseOrder.supplier_fax
                            ? `Fax: ${purchaseOrder.supplier_fax}`
                            : ""}
                        </p>
                      )}
                      {(purchaseOrder.supplier_bank_name ||
                        purchaseOrder.supplier_bank_account_number) && (
                        <p>
                          Rek: {purchaseOrder.supplier_bank_name ?? "-"}{" "}
                          {purchaseOrder.supplier_bank_account_number ?? ""}
                          {purchaseOrder.supplier_bank_account_holder
                            ? ` a.n. ${purchaseOrder.supplier_bank_account_holder}`
                            : ""}
                        </p>
                      )}
                      {purchaseOrder.supplier_payment_terms && (
                        <p>Termin: {purchaseOrder.supplier_payment_terms}</p>
                      )}
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Gudang tujuan</dt>
                  <dd className="mt-1 font-semibold text-ink-950">
                    {purchaseOrder.warehouse_code} · {purchaseOrder.warehouse_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Tanggal pesanan</dt>
                  <dd className="mt-1 font-semibold text-ink-950">
                    {formatPoDate(purchaseOrder.order_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Estimasi kirim</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold text-ink-950">
                    <span>
                      {purchaseOrder.expected_delivery_date
                        ? formatPoDate(purchaseOrder.expected_delivery_date)
                        : "-"}
                    </span>
                    {purchaseOrder.is_overdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        <AlertTriangle aria-hidden="true" size={12} />
                        Terlambat {purchaseOrder.days_overdue} hari
                      </span>
                    )}
                  </dd>
                </div>
                {purchaseOrder.revised_from_po_number && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-600">
                      Direvisi dari PO sebelumnya
                    </dt>
                    <dd className="mt-1 font-semibold text-teal-700">
                      {purchaseOrder.revised_from_po_number}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-slate-600">Total Estimasi PO</dt>
                  <dd className="mt-1 font-bold text-ink-950 tabular-nums">
                    {formatCurrencyIdr(purchaseOrder.total_amount)}
                  </dd>
                </div>
              </dl>

              {purchaseOrder.notes && (
                <div className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold text-ink-950">Catatan PO: </span>
                  {purchaseOrder.notes}
                </div>
              )}
            </section>

            {/* 3. Tabel Baris Item Lengkap */}
            <section
              aria-label="Daftar baris barang purchase order"
              className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Rincian Barang Dipesan ({(purchaseOrder.lines ?? []).length} baris)
                </h2>
              </div>

              {(() => {
                const canManageLines =
                  canClose &&
                  (purchaseOrder.status === "ISSUED" ||
                    purchaseOrder.status === "PARTIALLY_RECEIVED");
                return (
                  <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                    <table className="min-w-[760px] w-full text-left text-sm">
                      <caption className="sr-only">
                        Baris barang {purchaseOrder.po_number}
                      </caption>
                      <thead className="bg-canvas-50 text-xs text-slate-700">
                        <tr>
                          <th className="px-3 py-3">Barang</th>
                          <th className="px-3 py-3">Pesanan</th>
                          <th className="px-3 py-3">Harga Satuan</th>
                          <th className="px-3 py-3">Subtotal</th>
                          <th className="px-3 py-3">Diterima</th>
                          <th className="px-3 py-3">Ditutup</th>
                          <th className="px-3 py-3">Sisa Belum Diterima</th>
                          <th className="px-3 py-3">Status Baris</th>
                          <th className="px-3 py-3">Catatan</th>
                          {canManageLines && (
                            <th className="px-3 py-3 text-right">Aksi</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-200">
                        {(purchaseOrder.lines ?? []).length === 0 ? (
                          <tr>
                            <td
                              className="px-3 py-5 text-slate-700"
                              colSpan={canManageLines ? 10 : 9}
                            >
                              Belum ada baris barang.
                            </td>
                          </tr>
                        ) : (
                          (purchaseOrder.lines ?? []).map((line) => {
                            const qtyClosed = Number(line.qty_closed ?? 0);
                            const qtyRemaining =
                              line.qty_remaining ??
                              Math.max(
                                0,
                                Number(line.qty_ordered) -
                                  Number(line.qty_received) -
                                  qtyClosed,
                              );
                            const lineStatus = line.line_status ?? "OPEN";
                            const qtyRemainingNum = Number(qtyRemaining);
                            const canCloseLine =
                              canManageLines &&
                              lineStatus !== "CLOSED" &&
                              qtyRemainingNum > 0;
                            const unitPriceNum = Number(line.unit_price ?? 0);
                            const subtotalValue =
                              line.line_subtotal ??
                              String(Number(line.qty_ordered) * unitPriceNum);
                            return (
                              <tr key={line.id}>
                                <td className="px-3 py-3">
                                  <p className="font-semibold text-ink-950">
                                    {line.item_sku} · {line.item_name}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {line.uom_code}
                                  </p>
                                </td>
                                <td className="px-3 py-3 tabular-nums">
                                  {line.qty_ordered}
                                </td>
                                <td className="px-3 py-3 tabular-nums text-slate-700">
                                  {unitPriceNum > 0
                                    ? formatCurrencyIdr(unitPriceNum)
                                    : "-"}
                                </td>
                                <td className="px-3 py-3 font-semibold tabular-nums text-ink-950">
                                  {Number(subtotalValue) > 0
                                    ? formatCurrencyIdr(subtotalValue)
                                    : "-"}
                                </td>
                                <td className="px-3 py-3 tabular-nums">
                                  {line.qty_received}
                                </td>
                                <td className="px-3 py-3 tabular-nums">{qtyClosed}</td>
                                <td className="px-3 py-3 font-semibold text-ink-950 tabular-nums">
                                  {qtyRemaining}
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      lineStatus === "CLOSED"
                                        ? "bg-amber-100 text-amber-800"
                                        : lineStatus === "RECEIVED"
                                          ? "bg-teal-100 text-teal-800"
                                          : lineStatus === "PARTIALLY_RECEIVED"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-canvas-100 text-slate-700"
                                    }`}
                                  >
                                    {PO_LINE_STATUS_LABELS[lineStatus]}
                                  </span>
                                  {line.line_closed_reason && (
                                    <p className="mt-1 text-xs text-slate-600">
                                      {line.line_closed_reason}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-slate-700">
                                  {line.notes || "-"}
                                </td>
                                {canManageLines && (
                                  <td className="px-3 py-3 text-right">
                                    {canCloseLine ? (
                                      <button
                                        className="inline-flex min-h-9 items-center gap-1 rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                                        onClick={() =>
                                          openAction(purchaseOrder, "close-line", line)
                                        }
                                        type="button"
                                      >
                                        <Ban aria-hidden="true" size={13} />
                                        Hentikan Sisa
                                      </button>
                                    ) : (
                                      <span className="text-xs text-slate-500">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </section>

            {/* 4. Section Riwayat Penerimaan Barang (GR Terkait PO) */}
            <section
              aria-label="Riwayat penerimaan barang terkait PO"
              className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck
                    aria-hidden="true"
                    className="text-teal-700"
                    size={18}
                  />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Riwayat Penerimaan Barang (GRN) ({relatedReceipts.length})
                  </h2>
                </div>
                {canCreateReceiptForPo && (
                  <Link
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-teal-600 px-3.5 text-xs font-semibold text-surface-0 transition hover:bg-teal-700"
                    to={`${grBasePath}/new?po_id=${purchaseOrder.id}`}
                  >
                    <Plus aria-hidden="true" size={15} />
                    Buat Penerimaan (GR)
                  </Link>
                )}
              </div>

              {!canReadGr ? (
                <p className="text-sm text-slate-600">
                  Anda tidak memiliki izin `gr:read` untuk melihat daftar penerimaan
                  barang.
                </p>
              ) : relatedGrQuery.isLoading ? (
                <p className="text-sm text-slate-600">
                  Memuat riwayat penerimaan barang...
                </p>
              ) : relatedReceipts.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-line-300 bg-canvas-50/60 p-4 text-sm text-slate-600">
                  Belum ada dokumen penerimaan barang (Goods Receipt) yang tercatat
                  untuk PO {purchaseOrder.po_number}.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                  <table className="min-w-[600px] w-full text-left text-sm">
                    <caption className="sr-only">
                      Daftar Goods Receipt terkait {purchaseOrder.po_number}
                    </caption>
                    <thead className="bg-canvas-50 text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="px-3 py-2.5">Nomor GR</th>
                        <th className="px-3 py-2.5">Tanggal terima</th>
                        <th className="px-3 py-2.5">Baris</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-200">
                      {relatedReceipts.map((gr) => (
                        <tr className="hover:bg-canvas-50/60" key={gr.id}>
                          <td className="px-3 py-2.5 font-semibold text-teal-700">
                            <Link
                              className="hover:underline"
                              to={`${grBasePath}?search=${encodeURIComponent(gr.gr_number)}`}
                            >
                              {gr.gr_number}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700">
                            {formatGrDate(gr.received_date)}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700">
                            {gr.line_count}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${GR_STATUS_CLASSES[gr.status]}`}
                            >
                              {GR_STATUS_LABELS[gr.status]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {gr.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 5. Timeline Persetujuan & Jejak Audit */}
            <section
              aria-label="Timeline persetujuan purchase order"
              className="rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-1)] sm:p-6"
            >
              <ApprovalTimeline logs={purchaseOrder.approval_logs} />
            </section>
          </>
        )}
      </div>

      {purchaseOrder && canPrint && (
        <PurchaseOrderPrintSheet
          purchaseOrder={purchaseOrder}
          visibleOnScreen={showPrintPreview}
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
