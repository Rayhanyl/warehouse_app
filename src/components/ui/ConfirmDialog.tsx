import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Batal",
  danger = false,
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 p-4" onMouseDown={onClose}>
      <div
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <div className={`grid size-10 shrink-0 place-items-center rounded-full ${danger ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"}`}>
            <AlertTriangle aria-hidden="true" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-ink-950" id="confirm-dialog-title">{title}</h2>
              <button aria-label="Tutup dialog konfirmasi" className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 hover:bg-canvas-50" disabled={isPending} onClick={onClose} type="button"><X size={17} /></button>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] border border-line-500 px-4 text-sm font-semibold leading-5 text-ink-950 hover:bg-canvas-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending} onClick={onClose} type="button">{cancelLabel}</button>
          <button className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] px-4 text-sm font-semibold leading-5 text-surface-0 disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "bg-red-700 hover:bg-red-800" : "bg-teal-700 hover:bg-teal-800"}`} disabled={isPending} onClick={onConfirm} type="button">{isPending ? "Memproses..." : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
