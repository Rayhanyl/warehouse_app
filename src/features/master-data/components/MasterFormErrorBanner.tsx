import { AlertCircle } from "lucide-react";
import type { MasterFormSubmitError } from "../errors";

export function MasterFormErrorBanner({
  error,
}: {
  error?: MasterFormSubmitError | null;
}) {
  if (!error) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-red-600/30 bg-red-100 p-3.5 text-sm text-red-800"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{error.message}</p>
        {error.requestId && (
          <p className="mt-1 text-xs text-slate-700 tabular-nums">
            ID Permintaan: {error.requestId}
          </p>
        )}
      </div>
    </div>
  );
}
