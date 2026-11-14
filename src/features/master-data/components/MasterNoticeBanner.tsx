import { X } from "lucide-react";
import type { MasterPageNotice } from "../utils";

interface MasterNoticeBannerProps {
  notice: MasterPageNotice | null;
  onDismiss: () => void;
}

/** Banner umpan balik operasi CRUD pada halaman master data. */
export function MasterNoticeBanner({
  notice,
  onDismiss,
}: MasterNoticeBannerProps) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={`mb-6 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
        notice.type === "success"
          ? "border-teal-600/30 bg-teal-100 text-teal-700"
          : "border-red-600/30 bg-red-100 text-red-700"
      }`}
      role={notice.type === "error" ? "alert" : "status"}
    >
      <div className="min-w-0">
        <p className="font-semibold">{notice.message}</p>
        {notice.requestId && (
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            ID Permintaan: {notice.requestId}
          </p>
        )}
      </div>
      <button
        aria-label="Tutup notifikasi"
        className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] text-current transition hover:bg-ink-950/5"
        onClick={onDismiss}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
