import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermission";
import { evaluateSodGuard } from "@/lib/utils";
import {
  formatGrDate,
  formatGrDateTime,
  GR_STATUS_CLASSES,
  GR_STATUS_LABELS,
} from "../constants";
import type { GoodsReceipt } from "../types";
import { GoodsReceiptPrintSheet } from "./GoodsReceiptPrintSheet";

export function GoodsReceiptDetailModal({
  receipt,
  isLoading,
  canCreate,
  canPost,
  canManage,
  isMutating,
  onClose,
  onAction,
}: {
  receipt?: GoodsReceipt;
  isLoading: boolean;
  canCreate?: boolean;
  canPost?: boolean;
  canManage?: boolean;
  isMutating: boolean;
  onClose: () => void;
  onAction: (receipt: GoodsReceipt, action: "post" | "cancel") => Promise<void>;
}) {
  const { user } = usePermission();
  const [confirmation, setConfirmation] = useState<"cancel" | "post" | null>(null);
  const [previewReceiptId, setPreviewReceiptId] = useState<number | null>(null);
  const showPrintPreview = Boolean(receipt && previewReceiptId === receipt.id);
  const allowCreate = canCreate ?? canManage ?? false;
  const allowPost = canPost ?? canManage ?? false;
  const postSod = evaluateSodGuard(
    user,
    [receipt?.created_by],
    "Aturan Pemisahan Tugas (SoD): pembuat draft penerimaan barang tidak dapat memposting GR-nya sendiri.",
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isMutating) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMutating, onClose]);

  function handlePrint() {
    if (!receipt) return;
    toast.dismiss();
    setPreviewReceiptId(receipt.id);
    window.print();
  }

  if (!receipt && !isLoading) return null;

  return (
    <div
      className="print-dialog-backdrop fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="gr-detail-title"
        aria-modal="true"
        className="print-dialog-panel flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh] print:max-h-none print:overflow-visible print:border-0 print:shadow-none"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {isLoading || !receipt ? (
          <div className="p-8 text-sm text-slate-700" role="status">
            Memuat detail penerimaan...
          </div>
        ) : (
          <>
            <div className="no-print flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-ink-950" id="gr-detail-title">
                    {receipt.gr_number}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${GR_STATUS_CLASSES[receipt.status]}`}
                  >
                    {GR_STATUS_LABELS[receipt.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Dibuat pada {formatGrDateTime(receipt.created_at)}
                </p>
              </div>
              <button
                aria-label="Tutup detail penerimaan"
                className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50"
                onClick={onClose}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 print:overflow-visible print:p-0"
              data-slot="document-dialog-body"
            >
              <div className="no-print">
                <dl className="grid gap-4 pb-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-slate-600">Purchase order</dt>
                    <dd className="mt-1 font-semibold text-ink-950">{receipt.po_number}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Pemasok</dt>
                    <dd className="mt-1 font-semibold text-ink-950">
                      {receipt.supplier_code} · {receipt.supplier_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Gudang</dt>
                    <dd className="mt-1 font-semibold text-ink-950">
                      {receipt.warehouse_code} · {receipt.warehouse_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Tanggal terima</dt>
                    <dd className="mt-1 font-semibold text-ink-950">
                      {formatGrDate(receipt.received_date)}
                    </dd>
                  </div>
                </dl>

                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line-200">
                  <table className="min-w-[680px] w-full text-left text-sm">
                    <caption className="sr-only">Baris penerimaan {receipt.gr_number}</caption>
                    <thead className="bg-canvas-50 text-xs text-slate-700">
                      <tr>
                        <th className="px-3 py-3">Barang</th>
                        <th className="px-3 py-3">Lokasi</th>
                        <th className="px-3 py-3">Diterima</th>
                        <th className="px-3 py-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-200">
                      {(receipt.lines ?? []).length === 0 ? (
                        <tr>
                          <td className="px-3 py-5 text-slate-700" colSpan={4}>
                            Belum ada baris penerimaan.
                          </td>
                        </tr>
                      ) : (
                        (receipt.lines ?? []).map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-3">
                              <p className="font-semibold text-ink-950">
                                {line.item_sku} · {line.item_name}
                              </p>
                              <p className="text-xs text-slate-600">
                                {line.uom_code}
                                {line.item_barcode ? ` · Barcode: ${line.item_barcode}` : ""}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-ink-950">
                              {line.location_code} · {line.location_name}
                            </td>
                            <td className="px-3 py-3 tabular-nums">{line.qty_received}</td>
                            <td className="px-3 py-3 text-slate-700">{line.notes || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {receipt.notes && (
                  <p className="mt-4 rounded-[var(--radius-md)] bg-canvas-50 p-3 text-sm text-slate-700">
                    {receipt.notes}
                  </p>
                )}

                {receipt.status === "DRAFT" &&
                  allowPost &&
                  (postSod.isBlocked || postSod.isOverride) && (
                    <div
                      className={`mt-4 rounded-[var(--radius-md)] border p-3 text-sm ${
                        postSod.isBlocked
                          ? "border-amber-300 bg-amber-50 text-amber-950"
                          : "border-blue-300 bg-blue-50 text-blue-950"
                      }`}
                    >
                      <p className="font-semibold">
                        {postSod.isOverride
                          ? "Mode Override Super Admin"
                          : "Pemisahan Tugas (Segregation of Duties)"}
                      </p>
                      <p className="mt-0.5 text-xs leading-5">
                        {postSod.reason}
                        {postSod.isOverride
                          ? " Sebagai Super Admin Anda dapat memposting, dan override akan dicatat di Audit Log."
                          : ""}
                      </p>
                    </div>
                  )}
              </div>

              {receipt.status === "POSTED" && (
                <GoodsReceiptPrintSheet receipt={receipt} visibleOnScreen={showPrintPreview} />
              )}
            </div>

            <div className="no-print flex shrink-0 flex-wrap justify-end gap-2 border-t border-line-200 bg-canvas-50/50 px-4 py-3 sm:px-6">
              {receipt.status === "POSTED" && (
                <>
                  <button
                    className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold leading-5 text-ink-950 hover:bg-canvas-50"
                    onClick={() =>
                      setPreviewReceiptId((prev) => (prev === receipt.id ? null : receipt.id))
                    }
                    type="button"
                  >
                    {showPrintPreview
                      ? "Sembunyikan pratinjau cetak"
                      : "Pratinjau dokumen cetak"}
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold leading-5 text-surface-0 hover:bg-teal-700"
                    onClick={handlePrint}
                    type="button"
                  >
                    <Printer aria-hidden="true" size={16} />
                    Cetak Bukti Penerimaan
                  </button>
                </>
              )}
              {receipt.status === "DRAFT" && allowCreate && (
                <button
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-red-600/40 bg-surface-0 px-4 text-sm font-semibold leading-5 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={isMutating}
                  onClick={() => setConfirmation("cancel")}
                  type="button"
                >
                  Batalkan draft
                </button>
              )}
              {receipt.status === "DRAFT" && allowPost && !postSod.isBlocked && (
                <button
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold leading-5 text-surface-0 hover:bg-teal-700 disabled:opacity-50"
                  disabled={isMutating}
                  onClick={() => setConfirmation("post")}
                  type="button"
                >
                  {isMutating ? "Memproses..." : "Posting penerimaan"}
                </button>
              )}
              <button
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold leading-5 text-ink-950 hover:bg-canvas-50"
                onClick={onClose}
                type="button"
              >
                Tutup
              </button>
            </div>
          </>
        )}
      </div>

      {confirmation && receipt && (
        <ConfirmDialog
          confirmLabel={confirmation === "cancel" ? "Batalkan draft" : "Posting penerimaan"}
          danger={confirmation === "cancel"}
          isPending={isMutating}
          message={
            confirmation === "cancel"
              ? `Draft ${receipt.gr_number} akan dibatalkan.`
              : `Posting ${receipt.gr_number} akan menambah saldo stok.`
          }
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            setConfirmation(null);
            void onAction(receipt, confirmation);
          }}
          title={
            confirmation === "cancel" ? "Batalkan draft penerimaan?" : "Posting penerimaan?"
          }
        />
      )}
    </div>
  );
}
