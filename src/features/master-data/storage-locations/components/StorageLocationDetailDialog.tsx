import { useEffect } from "react";
import { X } from "lucide-react";
import type { StorageLocationRecord } from "../types";

interface StorageLocationDetailDialogProps {
  location: StorageLocationRecord | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (location: StorageLocationRecord) => void;
}

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function StorageLocationDetailDialog({
  location,
  canManage,
  onClose,
  onEdit,
}: StorageLocationDetailDialogProps) {
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
      aria-labelledby="storage-location-detail-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Detail lokasi penyimpanan
            </p>
            <h2
              id="storage-location-detail-title"
              className="mt-0.5 text-lg font-bold text-slate-900"
            >
              {location.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog detail lokasi penyimpanan"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <dl className="divide-y divide-slate-200 px-6 py-2 text-sm">
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Kode lokasi</dt>
            <dd className="font-mono font-semibold text-slate-900 sm:col-span-2">
              {location.code}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Nama lokasi</dt>
            <dd className="font-semibold text-slate-900 sm:col-span-2">{location.name}</dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Gudang induk</dt>
            <dd className="text-slate-900 sm:col-span-2">
              <span className="font-mono font-semibold">{location.warehouse_code}</span> ({location.warehouse_name})
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Status</dt>
            <dd className="sm:col-span-2">
              {location.is_active ? (
                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                  Aktif
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                  Nonaktif
                </span>
              )}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">ID sistem</dt>
            <dd className="break-all font-mono text-xs text-slate-700 sm:col-span-2">
              {location.id}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Dibuat pada</dt>
            <dd className="tabular-nums text-slate-800 sm:col-span-2">
              {formatDateTime(location.created_at)}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Diperbarui pada</dt>
            <dd className="tabular-nums text-slate-800 sm:col-span-2">
              {formatDateTime(location.updated_at)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            Tutup
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(location);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              Edit lokasi
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
