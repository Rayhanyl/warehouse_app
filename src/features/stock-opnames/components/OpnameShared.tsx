import type { ReactNode } from "react";
import { X } from "lucide-react";

export function OpnameState({
  text,
  error = false,
  empty = false,
  onRetry,
  action,
  actionLabel,
}: {
  text: string;
  error?: boolean;
  empty?: boolean;
  onRetry?: () => void;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border ${
        error ? "border-red-200 bg-red-50" : "border-dashed border-line-500 bg-surface-0"
      } p-8 text-center`}
      role={error ? "alert" : "status"}
    >
      <p className="font-semibold text-ink-950">{text}</p>
      {error && onRetry && (
        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-red-700 px-4 font-semibold text-surface-0 hover:bg-red-800"
          onClick={onRetry}
          type="button"
        >
          Coba lagi
        </button>
      )}
      {empty && action && (
        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 px-4 font-semibold hover:bg-canvas-50"
          onClick={action}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function OpnameDialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="opname-dialog-title"
        aria-modal="true"
        className={`flex max-h-[94dvh] w-full flex-col overflow-hidden ${
          wide ? "max-w-[min(96vw,92rem)]" : "max-w-5xl"
        } rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-line-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-ink-950" id="opname-dialog-title">
            {title}
          </h2>
          <button
            aria-label="Tutup dialog"
            className="grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-md)] hover:bg-canvas-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
