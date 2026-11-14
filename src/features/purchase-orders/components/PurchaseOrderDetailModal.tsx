import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import {
  formatPoDate,
  formatPoDateTime,
  PO_STATUS_CLASSES,
  PO_STATUS_LABELS,
} from "../constants";
import type { PurchaseOrder } from "../types";
import { PurchaseOrderPrintSheet } from "./PurchaseOrderPrintSheet";

export function PurchaseOrderDetailModal({
  purchaseOrder,
  isLoading,
  canIssue,
  canCancel,
  canClose,
  onClose,
  onAction,
}: {
  purchaseOrder?: PurchaseOrder;
  isLoading: boolean;
  canIssue: boolean;
  canCancel: boolean;
  canClose: boolean;
  onClose: () => void;
  onAction: (po: PurchaseOrder, action: "issue" | "cancel" | "close") => void;
}) {
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

  const canPrint = Boolean(purchaseOrder && purchaseOrder.status !== "CANCELLED");

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

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 print:overflow-visible print:p-0">
              <div className="no-print">
                <dl className="grid gap-4 pb-5 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-slate-600">Pemasok</dt>
                    <dd className="mt-1 font-semibold text-ink-950">
                      {purchaseOrder.supplier_code} · {purchaseOrder.supplier_name}
                    </dd>
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
                </dl>

                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                  <table className="min-w-[620px] w-full text-left text-sm">
                    <caption className="sr-only">Baris barang {purchaseOrder.po_number}</caption>
                    <thead className="bg-canvas-50 text-xs text-slate-700">
                      <tr>
                        <th className="px-3 py-3">Barang</th>
                        <th className="px-3 py-3">Pesanan</th>
                        <th className="px-3 py-3">Diterima</th>
                        <th className="px-3 py-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-200">
                      {(purchaseOrder.lines ?? []).length === 0 ? (
                        <tr>
                          <td className="px-3 py-5 text-slate-700" colSpan={4}>
                            Belum ada baris barang.
                          </td>
                        </tr>
                      ) : (
                        (purchaseOrder.lines ?? []).map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-3">
                              <p className="font-semibold text-ink-950">
                                {line.item_sku} · {line.item_name}
                              </p>
                              <p className="text-xs text-slate-600">{line.uom_code}</p>
                            </td>
                            <td className="px-3 py-3 tabular-nums">{line.qty_ordered}</td>
                            <td className="px-3 py-3 tabular-nums">{line.qty_received}</td>
                            <td className="px-3 py-3 text-slate-700">{line.notes || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {purchaseOrder.notes && (
                  <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">
                    {purchaseOrder.notes}
                  </p>
                )}
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
              {purchaseOrder.status === "DRAFT" && canIssue && (
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 hover:bg-teal-700"
                  onClick={() => onAction(purchaseOrder, "issue")}
                  type="button"
                >
                  Terbitkan purchase order
                </button>
              )}
              {(purchaseOrder.status === "DRAFT" || purchaseOrder.status === "ISSUED") &&
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
                    Tutup purchase order
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
  closedReason,
  isSubmitting,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  purchaseOrder: PurchaseOrder;
  action: "issue" | "cancel" | "close";
  closedReason: string;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const actionLabels = {
    issue: "Terbitkan purchase order",
    cancel: "Batalkan purchase order",
    close: "Tutup purchase order",
  };

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
          Aksi ini akan mengubah status {purchaseOrder.po_number}. Pastikan isi dokumen sudah
          diperiksa.
        </p>
        {action === "close" && (
          <label className="mt-4 block text-sm font-semibold text-ink-950">
            Alasan penutupan
            <textarea
              className="mt-2 min-h-24 w-full rounded-[var(--radius-md)] border border-line-500 p-3 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              onChange={(event) => onReasonChange(event.target.value)}
              value={closedReason}
            />
          </label>
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
              action === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
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
