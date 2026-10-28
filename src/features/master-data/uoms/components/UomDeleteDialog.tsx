import { useEffect } from "react";
import { AlertTriangle, PowerOff, RotateCcw, X } from "lucide-react";
import type { Uom } from "../types";

interface UomDeleteDialogProps {
  uom: Uom | null;
  isSubmitting: boolean;
  actionError: { message: string; requestId?: string } | null;
  onClose: () => void;
  onConfirm: (uom: Uom) => Promise<void>;
}

export function UomDeleteDialog({
  uom,
  isSubmitting,
  actionError,
  onClose,
  onConfirm,
}: UomDeleteDialogProps) {
  useEffect(() => {
    if (!uom) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uom, isSubmitting, onClose]);

  if (!uom) {
    return null;
  }

  const isDeactivating = uom.is_active;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        aria-describedby="uom-confirm-desc"
        aria-labelledby="uom-confirm-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
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
                id="uom-confirm-title"
              >
                {isDeactivating
                  ? "Nonaktifkan satuan ukur?"
                  : "Aktifkan kembali satuan ukur?"}
              </h2>
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                ID Satuan #{uom.id} · {uom.code}
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

        <p
          className="mt-4 text-sm leading-6 text-slate-700"
          id="uom-confirm-desc"
        >
          {isDeactivating ? (
            <>
              Satuan ukur{" "}
              <strong className="font-semibold text-ink-950">
                {uom.name} ({uom.code})
              </strong>{" "}
              akan dinonaktifkan dan tidak dapat dipilih saat mendaftarkan barang baru. Sesuai aturan jejak audit gudang, riwayat transaksi yang sudah tercatat tetap disimpan.
            </>
          ) : (
            <>
              Satuan ukur{" "}
              <strong className="font-semibold text-ink-950">
                {uom.name} ({uom.code})
              </strong>{" "}
              akan diaktifkan kembali sehingga dapat dipilih saat membuat atau memperbarui barang (SKU).
            </>
          )}
        </p>

        {actionError && (
          <div
            className="mt-4 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3.5 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">{actionError.message}</p>
            {actionError.requestId && (
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                ID Permintaan: {actionError.requestId}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-surface-0 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDeactivating
                ? "bg-red-600 hover:bg-red-700"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
            disabled={isSubmitting}
            onClick={() => void onConfirm(uom)}
            type="button"
          >
            {isDeactivating ? (
              <>
                <PowerOff aria-hidden="true" size={16} />
                {isSubmitting ? "Memproses..." : "Ya, nonaktifkan satuan"}
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

