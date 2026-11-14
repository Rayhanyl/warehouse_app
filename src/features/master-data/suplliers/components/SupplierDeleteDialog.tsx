import { useEffect } from "react";
import { AlertTriangle, PowerOff, RotateCcw, X } from "lucide-react";
import { MasterFormErrorBanner } from "../../components/MasterFormErrorBanner";
import type { MasterFormSubmitError } from "../../errors";
import type { Supplier } from "../types";

interface SupplierDeleteDialogProps {
  supplier: Supplier | null;
  onClose: () => void;
  onConfirm: (supplier: Supplier) => Promise<void> | void;
  isSubmitting?: boolean;
  submitError?: MasterFormSubmitError | null;
}

export function SupplierDeleteDialog({
  supplier,
  onClose,
  onConfirm,
  isSubmitting = false,
  submitError = null,
}: SupplierDeleteDialogProps) {
  useEffect(() => {
    if (!supplier) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [supplier, isSubmitting, onClose]);

  if (!supplier) {
    return null;
  }

  const isDeactivating = supplier.is_active;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-describedby="supplier-confirm-desc"
        aria-labelledby="supplier-confirm-title"
        aria-modal="true"
        className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-4 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] ${
                isDeactivating
                  ? "bg-red-100 text-red-700"
                  : "bg-teal-100 text-teal-700"
              }`}
            >
              {isDeactivating ? (
                <AlertTriangle aria-hidden="true" size={20} />
              ) : (
                <RotateCcw aria-hidden="true" size={20} />
              )}
            </div>
            <div>
              <h2
                className="text-lg font-bold text-ink-950"
                id="supplier-confirm-title"
              >
                {isDeactivating
                  ? "Nonaktifkan pemasok?"
                  : "Aktifkan kembali pemasok?"}
              </h2>
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                ID Pemasok #{supplier.id} · {supplier.code}
              </p>
            </div>
          </div>
          <button
            aria-label="Tutup dialog konfirmasi"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        {submitError && (
          <div className="mt-4">
            <MasterFormErrorBanner error={submitError} />
          </div>
        )}

        <p
          className="mt-4 text-sm leading-6 text-slate-700"
          id="supplier-confirm-desc"
        >
          {isDeactivating ? (
            <>
              Pemasok{" "}
              <strong className="font-semibold text-ink-950">
                {supplier.name} ({supplier.code})
              </strong>{" "}
              akan dinonaktifkan dan tidak dapat dipilih pada Purchase Order baru.
            </>
          ) : (
            <>
              Pemasok{" "}
              <strong className="font-semibold text-ink-950">
                {supplier.name} ({supplier.code})
              </strong>{" "}
              akan diaktifkan kembali untuk transaksi pembelian.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:opacity-50 sm:w-auto"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-surface-0 transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
              isDeactivating
                ? "bg-red-600 hover:bg-red-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
            disabled={isSubmitting}
            onClick={() => void onConfirm(supplier)}
            type="button"
          >
            {isDeactivating ? (
              <>
                <PowerOff aria-hidden="true" size={16} />
                {isSubmitting ? "Memproses..." : "Ya, nonaktifkan pemasok"}
              </>
            ) : (
              <>
                <RotateCcw aria-hidden="true" size={16} />
                {isSubmitting ? "Memproses..." : "Ya, aktifkan kembali"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
