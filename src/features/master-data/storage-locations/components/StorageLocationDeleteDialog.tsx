import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { StorageLocationRecord } from "../types";

interface StorageLocationDeleteDialogProps {
  location: StorageLocationRecord | null;
  onClose: () => void;
  onConfirm: (location: StorageLocationRecord) => void;
}

export function StorageLocationDeleteDialog({
  location,
  onClose,
  onConfirm,
}: StorageLocationDeleteDialogProps) {
  useEffect(() => {
    if (!location) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location, onClose]);

  if (!location) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-location-delete-title"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-800">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2
              id="storage-location-delete-title"
              className="text-lg font-bold text-slate-900"
            >
              Nonaktifkan lokasi penyimpanan?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog konfirmasi nonaktifkan lokasi penyimpanan"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5 text-sm text-slate-700">
          <p>
            Anda akan menonaktifkan lokasi{" "}
            <span className="font-semibold text-slate-900">{location.name}</span> (
            <span className="font-mono font-semibold text-slate-900">{location.code}</span>) pada{" "}
            <span className="font-semibold text-slate-900">{location.warehouse_name}</span>.
          </p>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
            Buku besar stok di lokasi ini tetap tersimpan untuk kebutuhan audit, namun lokasi tidak
            dapat dipilih untuk penempatan barang baru.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(location)}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
          >
            Ya, nonaktifkan
          </button>
        </div>
      </div>
    </div>
  );
}
