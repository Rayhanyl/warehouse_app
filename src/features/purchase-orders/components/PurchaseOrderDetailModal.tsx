import { useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Copy, Pencil, Printer, Send, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ApprovalTimeline } from "@/components/shared";
import { usePermission } from "@/hooks/usePermission";
import { evaluateSodGuard, formatCurrencyIdr } from "@/lib/utils";
import {
  formatPoDate,
  formatPoDateTime,
  PO_CLOSE_REASON_PRESETS,
  PO_LINE_STATUS_LABELS,
  PO_STATUS_CLASSES,
  PO_STATUS_LABELS,
} from "../constants";
import type { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from "../types";
import { PurchaseOrderPrintSheet } from "./PurchaseOrderPrintSheet";

export type PurchaseOrderActionType =
  | "submit"
  | "approve"
  | "reject"
  | "issue"
  | "cancel"
  | "close"
  | "revise-draft"
  | "close-line";

const PRINTABLE_PO_STATUSES = new Set<PurchaseOrderStatus>([
  "ISSUED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED",
]);

export function PurchaseOrderDetailModal({
  purchaseOrder,
  isLoading,
  canEdit = false,
  canApproveL1 = false,
  canApproveL2 = false,
  canIssue,
  canCancel,
  canClose,
  onClose,
  onEdit,
  onAction,
}: {
  purchaseOrder?: PurchaseOrder;
  isLoading: boolean;
  canEdit?: boolean;
  canApproveL1?: boolean;
  canApproveL2?: boolean;
  canIssue: boolean;
  canCancel: boolean;
  canClose: boolean;
  onClose: () => void;
  onEdit?: (po: PurchaseOrder) => void;
  onAction: (
    po: PurchaseOrder,
    action: PurchaseOrderActionType,
    poLine?: PurchaseOrderLine,
  ) => void;
}) {
  const { user } = usePermission();
  const [previewPoId, setPreviewPoId] = useState<number | null>(null);
  const showPrintPreview = Boolean(purchaseOrder && previewPoId === purchaseOrder.id);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handlePrint() {
    if (!purchaseOrder) return;
    toast.dismiss();
    setPreviewPoId(purchaseOrder.id);
    window.print();
  }

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
    [purchaseOrder?.created_by, purchaseOrder?.submitted_by, purchaseOrder?.l1_approved_by],
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

  return (
    <div
      className="print-dialog-backdrop fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="po-detail-title"
        aria-modal="true"
        className="print-dialog-panel flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh] print:max-h-none print:overflow-visible print:border-0 print:shadow-none"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {isLoading || !purchaseOrder ? (
          <div className="p-8 text-sm text-slate-700" role="status">
            Memuat detail purchase order...
          </div>
        ) : (
          <>
            <div className="no-print flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-ink-950" id="po-detail-title">
                    {purchaseOrder.po_number}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PO_STATUS_CLASSES[purchaseOrder.status]}`}
                  >
                    {PO_STATUS_LABELS[purchaseOrder.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Dibuat pada {formatPoDateTime(purchaseOrder.created_at)}
                </p>
              </div>
              <button
                aria-label="Tutup detail purchase order"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 transition-colors hover:bg-canvas-50 hover:text-ink-950"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 print:overflow-visible print:p-0"
              data-slot="document-dialog-body"
            >
              <div className="no-print">
                <dl className="grid gap-4 pb-5 text-sm sm:grid-cols-4">
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
                            {purchaseOrder.supplier_fax ? `Fax: ${purchaseOrder.supplier_fax}` : ""}
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
                      <dt className="text-xs text-slate-600">Direvisi dari PO sebelumnya</dt>
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

                {purchaseOrder.rejection_reason && purchaseOrder.status === "DRAFT" && (
                  <div className="mb-4 rounded-[var(--radius-md)] border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                    <p className="font-semibold">PO Dikembalikan / Ditolak</p>
                    <p className="mt-1">Alasan penolakan: {purchaseOrder.rejection_reason}</p>
                  </div>
                )}

                {activeSodBanner && (activeSodBanner.isBlocked || activeSodBanner.isOverride) && (
                  <div
                    className={`mb-4 rounded-[var(--radius-md)] border p-3 text-sm ${
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
                  <div className="mb-4 rounded-[var(--radius-md)] border border-amber-600/30 bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-semibold">Purchase order ditutup (CLOSED / Short-Close)</p>
                    <p className="mt-1">
                      Alasan: {purchaseOrder.closed_reason || "Ditutup sesuai penyelesaian seluruh baris."}
                    </p>
                    {purchaseOrder.closed_at && (
                      <p className="mt-1 text-xs text-amber-800">
                        Ditutup pada {formatPoDateTime(purchaseOrder.closed_at)}
                      </p>
                    )}
                  </div>
                )}

                {(() => {
                  const canManageLines =
                    canClose &&
                    (purchaseOrder.status === "ISSUED" ||
                      purchaseOrder.status === "PARTIALLY_RECEIVED");
                  return (
                    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                      <table className="min-w-[760px] w-full text-left text-sm">
                        <caption className="sr-only">Baris barang {purchaseOrder.po_number}</caption>
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
                            {canManageLines && <th className="px-3 py-3 text-right">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-200">
                          {(purchaseOrder.lines ?? []).length === 0 ? (
                            <tr>
                              <td className="px-3 py-5 text-slate-700" colSpan={canManageLines ? 10 : 9}>
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
                                canManageLines && lineStatus !== "CLOSED" && qtyRemainingNum > 0;
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
                                    <p className="text-xs text-slate-600">{line.uom_code}</p>
                                  </td>
                                  <td className="px-3 py-3 tabular-nums">{line.qty_ordered}</td>
                                  <td className="px-3 py-3 tabular-nums text-slate-700">
                                    {unitPriceNum > 0 ? formatCurrencyIdr(unitPriceNum) : "-"}
                                  </td>
                                  <td className="px-3 py-3 font-semibold tabular-nums text-ink-950">
                                    {Number(subtotalValue) > 0 ? formatCurrencyIdr(subtotalValue) : "-"}
                                  </td>
                                  <td className="px-3 py-3 tabular-nums">{line.qty_received}</td>
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
                                  <td className="px-3 py-3 text-slate-700">{line.notes || "-"}</td>
                                  {canManageLines && (
                                    <td className="px-3 py-3 text-right">
                                      {canCloseLine ? (
                                        <button
                                          className="inline-flex min-h-9 items-center gap-1 rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                                          onClick={() =>
                                            onAction(purchaseOrder, "close-line", line)
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

                {purchaseOrder.notes && (
                  <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">
                    {purchaseOrder.notes}
                  </p>
                )}

                <ApprovalTimeline logs={purchaseOrder.approval_logs} />
              </div>

              {canPrint && (
                <PurchaseOrderPrintSheet
                  purchaseOrder={purchaseOrder}
                  visibleOnScreen={showPrintPreview}
                />
              )}
            </div>

            <div className="no-print flex shrink-0 flex-wrap justify-end gap-2 border-t border-line-200 bg-canvas-50/50 px-4 py-3 sm:px-6">
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
                    {showPrintPreview ? "Sembunyikan pratinjau cetak" : "Pratinjau PO cetak"}
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
              {purchaseOrder.status === "DRAFT" && canEdit && onEdit && (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
                  onClick={() => onEdit(purchaseOrder)}
                  type="button"
                >
                  <Pencil aria-hidden="true" size={16} />
                  Ubah Draft PO
                </button>
              )}
              {purchaseOrder.status === "DRAFT" && canEdit && (purchaseOrder.lines?.length ?? 0) > 0 && (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-indigo-600 px-4 text-sm font-semibold text-surface-0 hover:bg-indigo-700"
                  onClick={() => onAction(purchaseOrder, "submit")}
                  type="button"
                >
                  <Send aria-hidden="true" size={16} />
                  Ajukan Persetujuan
                </button>
              )}
              {purchaseOrder.status === "ISSUED" && canEdit && canCancel && (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-teal-700/40 bg-surface-0 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                  onClick={() => onAction(purchaseOrder, "revise-draft")}
                  type="button"
                >
                  <Copy aria-hidden="true" size={16} />
                  Batalkan &amp; Salin ke Draft Baru
                </button>
              )}
              {purchaseOrder.status === "DRAFT" && canIssue && !issueSod.isBlocked && (
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                  onClick={() => onAction(purchaseOrder, "issue")}
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
                      onClick={() => onAction(purchaseOrder, "approve")}
                      type="button"
                    >
                      <CheckCircle2 aria-hidden="true" size={16} />
                      Setujui Level 1
                    </button>
                  )}
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                    onClick={() => onAction(purchaseOrder, "reject")}
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
                      onClick={() => onAction(purchaseOrder, "approve")}
                      type="button"
                    >
                      <CheckCircle2 aria-hidden="true" size={16} />
                      Setujui Level 2 (Final)
                    </button>
                  )}
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                    onClick={() => onAction(purchaseOrder, "reject")}
                    type="button"
                  >
                    <XCircle aria-hidden="true" size={16} />
                    Tolak
                  </button>
                </>
              )}
              {(purchaseOrder.status === "DRAFT" ||
                purchaseOrder.status === "WAITING_L1_APPROVAL" ||
                purchaseOrder.status === "WAITING_L2_APPROVAL" ||
                purchaseOrder.status === "ISSUED") &&
                canCancel && (
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-red-600/40 bg-surface-0 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
                    onClick={() => onAction(purchaseOrder, "cancel")}
                    type="button"
                  >
                    Batalkan purchase order
                  </button>
                )}
              {(purchaseOrder.status === "ISSUED" ||
                purchaseOrder.status === "PARTIALLY_RECEIVED") &&
                canClose && (
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-amber-700/40 bg-surface-0 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                    onClick={() => onAction(purchaseOrder, "close")}
                    type="button"
                  >
                    Tutup PO (Selesai Sebagian / Hentikan Sisa)
                  </button>
                )}
              <button
                className="inline-flex min-h-11 min-w-20 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-canvas-50 px-4 text-sm font-semibold text-ink-950 transition-colors hover:border-ink-800 hover:bg-surface-0"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={16} />
                Tutup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PurchaseOrderActionDialog({
  purchaseOrder,
  action,
  targetLine,
  closedReason,
  isSubmitting,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  purchaseOrder: PurchaseOrder;
  action: PurchaseOrderActionType;
  targetLine?: PurchaseOrderLine | null;
  closedReason: string;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const actionLabels: Record<PurchaseOrderActionType, string> = {
    submit: "Ajukan Persetujuan PO",
    approve:
      purchaseOrder.status === "WAITING_L2_APPROVAL"
        ? "Setujui Level 2 (Final)"
        : "Setujui Level 1",
    reject: "Tolak & Kembalikan ke Draft",
    issue: "Terbitkan purchase order",
    cancel: "Batalkan purchase order",
    close: "Tutup PO (Short-Close)",
    "revise-draft": "Batalkan & Salin ke Draft Baru",
    "close-line": "Hentikan Sisa Pengiriman Baris",
  };

  const showCloseReasonField = action === "close" || action === "close-line";
  const showRejectReasonField = action === "reject";

  return (
    <div
      className="no-print fixed inset-0 z-[60] grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="po-action-title"
        aria-modal="true"
        className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className="text-lg font-bold text-ink-950" id="po-action-title">
          {actionLabels[action]}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {action === "submit" ? (
            <>
              PO <span className="font-semibold text-ink-950">{purchaseOrder.po_number}</span> akan
              diajukan ke antrean persetujuan berjenjang.
            </>
          ) : action === "approve" ? (
            <>
              Persetujuan Anda untuk PO{" "}
              <span className="font-semibold text-ink-950">{purchaseOrder.po_number}</span> akan
              dicatat ke riwayat approval.
            </>
          ) : action === "reject" ? (
            <>
              PO <span className="font-semibold text-ink-950">{purchaseOrder.po_number}</span> akan
              dikembalikan ke status DRAFT agar pembuat dapat memperbaiki dokumen.
            </>
          ) : action === "revise-draft" ? (
            <>
              PO <span className="font-semibold text-ink-950">{purchaseOrder.po_number}</span> akan
              dibatalkan (CANCELLED) dan sistem membuat salinan baru berstatus DRAFT agar Anda
              dapat mengubah pemasok, gudang, atau daftar barang. Hanya berlaku jika belum ada GRN.
            </>
          ) : action === "close-line" && targetLine ? (
            <>
              Hentikan sisa pengiriman untuk{" "}
              <span className="font-semibold text-ink-950">
                {targetLine.item_sku} · {targetLine.item_name}
              </span>{" "}
              (Diterima {targetLine.qty_received} dari pesanan {targetLine.qty_ordered}{" "}
              {targetLine.uom_code}). Baris lain yang masih terbuka tetap bisa diterima via GRN.
            </>
          ) : (
            <>
              Aksi ini akan mengubah status {purchaseOrder.po_number}. Pastikan isi dokumen sudah
              diperiksa.
            </>
          )}
        </p>
        {showRejectReasonField && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-ink-950">
              Alasan penolakan (wajib)
              <textarea
                className="mt-2 min-h-24 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                maxLength={500}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Contoh: Harga satuan perlu dikonfirmasi ulang ke supplier"
                value={closedReason}
              />
            </label>
          </div>
        )}
        {showCloseReasonField && (
          <div className="mt-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-600">Pilih alasan cepat (opsional):</p>
            <div className="flex flex-wrap gap-1.5">
              {PO_CLOSE_REASON_PRESETS.map((preset) => (
                <button
                  className="rounded-full border border-line-300 bg-canvas-50 px-2.5 py-1 text-left text-xs font-medium text-ink-950 hover:border-teal-600 hover:bg-teal-50"
                  key={preset}
                  onClick={() => onReasonChange(preset)}
                  type="button"
                >
                  {preset}
                </button>
              ))}
            </div>
            <label className="block text-sm font-semibold text-ink-950">
              Alasan penutupan {action === "close-line" ? "baris" : "PO"}
              <textarea
                className="mt-2 min-h-24 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Contoh: Stok pemasok habis / pengiriman melewati tenggat"
                value={closedReason}
              />
            </label>
          </div>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold text-ink-950 hover:bg-canvas-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Kembali periksa
          </button>
          <button
            className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold text-surface-0 ${
              action === "cancel" || action === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "Memproses..." : actionLabels[action]}
          </button>
        </div>
      </div>
    </div>
  );
}
