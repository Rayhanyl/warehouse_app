import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import { BarcodeStickerSheet, BarcodeVisual, QrCodeVisual } from "@/components/ui/BarcodeVisual";
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
  const [showStickerPreview, setShowStickerPreview] = useState(false);
  const [codeFormat, setCodeFormat] = useState<"qr" | "barcode">("qr");

  useEffect(() => {
    setShowStickerPreview(false);
    setCodeFormat("qr");
  }, [location?.id]);

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

  function handlePrintRackSticker() {
    toast.dismiss();
    setShowStickerPreview(true);
    window.print();
  }

  return (
    <div
      className="print-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-location-detail-title"
    >
      <div className="print-dialog-panel w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="no-print flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
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

        <dl className="no-print divide-y divide-slate-200 px-6 py-2 text-sm">
          <div className="flex flex-col items-center justify-between gap-3 py-3 sm:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <dt className="font-semibold text-slate-900">Barcode Lokasi Rak</dt>
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                  {codeFormat === "qr" ? "QR Code 2D" : "1D Code-128"}
                </span>
              </div>
              <dd className="mt-0.5 text-xs text-slate-600">
                Pindai untuk menampilkan seluruh macam barang (SKU) di rak ini
              </dd>
              <div className="mt-2 flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCodeFormat("qr")}
                  className={`rounded px-2 py-0.5 font-semibold transition ${
                    codeFormat === "qr"
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  QR Code (2D)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("barcode")}
                  className={`rounded px-2 py-0.5 font-semibold transition ${
                    codeFormat === "barcode"
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Barcode (1D)
                </button>
              </div>
            </div>
            {codeFormat === "qr" ? (
              <QrCodeVisual
                className="border border-slate-200"
                size={76}
                value={location.code}
              />
            ) : (
              <BarcodeVisual
                className="border border-slate-200"
                height={38}
                value={location.code}
              />
            )}
          </div>
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

        <div className="px-6">
          <BarcodeStickerSheet
            badgeText="LABEL LOKASI RAK"
            code={location.code}
            format={codeFormat}
            metaLabel={`GUDANG: ${location.warehouse_code}`}
            secondaryCode={location.warehouse_name}
            title={`${location.code} · ${location.name}`}
            visibleOnScreen={showStickerPreview}
          />
        </div>

        <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handlePrintRackSticker}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Cetak Label Rak
          </button>
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
