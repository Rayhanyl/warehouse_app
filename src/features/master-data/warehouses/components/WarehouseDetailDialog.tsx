import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  MapPin,
  PowerOff,
  Printer,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BarcodeStickerSheet, BarcodeVisual, QrCodeVisual } from "@/components/ui/BarcodeVisual";
import type { WarehouseRecord } from "../types";

interface WarehouseDetailDialogProps {
  warehouse: WarehouseRecord | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (warehouse: WarehouseRecord) => void;
  onToggleStatus: (warehouse: WarehouseRecord) => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function WarehouseDetailDialog({
  warehouse,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}: WarehouseDetailDialogProps) {
  const [showStickerPreview, setShowStickerPreview] = useState(false);
  const [codeFormat, setCodeFormat] = useState<"qr" | "barcode">("qr");

  useEffect(() => {
    setShowStickerPreview(false);
    setCodeFormat("qr");
  }, [warehouse?.id]);

  useEffect(() => {
    if (!warehouse) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [warehouse, onClose]);

  if (!warehouse) {
    return null;
  }

  function handlePrintWarehouseSticker() {
    toast.dismiss();
    setShowStickerPreview(true);
    window.print();
  }

  return (
    <div
      className="print-dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="warehouse-detail-title"
        aria-modal="true"
        className="print-dialog-panel w-full max-w-lg rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="no-print flex items-start justify-between gap-3 border-b border-line-200 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                ID #{warehouse.id}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 tabular-nums">
                {warehouse.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  warehouse.is_active
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <CheckCircle2 aria-hidden="true" size={13} />
                {warehouse.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <h2
              className="mt-2 text-lg font-bold text-ink-950"
              id="warehouse-detail-title"
            >
              {warehouse.name}
            </h2>
          </div>
          <button
            aria-label="Tutup detail gudang"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <dl className="no-print mt-5 space-y-4 text-sm">
          <div className="flex flex-col items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/70 p-3.5 sm:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <dt className="text-xs font-semibold text-ink-950">
                  Barcode & QR Identitas Gudang
                </dt>
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                  {codeFormat === "qr" ? "QR Code 2D" : "1D Code-128"}
                </span>
              </div>
              <dd className="mt-0.5 text-xs text-slate-600">
                Pindai untuk menampilkan seluruh ringkasan stok di gudang ini
              </dd>
              <div className="mt-2 flex items-center gap-1 rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCodeFormat("qr")}
                  className={`rounded px-2.5 py-0.5 font-semibold transition ${
                    codeFormat === "qr"
                      ? "bg-teal-600 text-surface-0 shadow-sm"
                      : "text-slate-600 hover:text-ink-950"
                  }`}
                >
                  QR Code (2D)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("barcode")}
                  className={`rounded px-2.5 py-0.5 font-semibold transition ${
                    codeFormat === "barcode"
                      ? "bg-teal-600 text-surface-0 shadow-sm"
                      : "text-slate-600 hover:text-ink-950"
                  }`}
                >
                  Barcode (1D)
                </button>
              </div>
            </div>
            {codeFormat === "qr" ? (
              <QrCodeVisual
                className="border border-line-200"
                size={76}
                value={warehouse.code}
              />
            ) : (
              <BarcodeVisual
                className="border border-line-200"
                height={38}
                value={warehouse.code}
              />
            )}
          </div>

          <div className="flex items-start gap-3">
            <MapPin
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-teal-700"
              size={18}
            />
            <div>
              <dt className="text-xs font-medium text-slate-600">Alamat gudang</dt>
              <dd className="mt-1 leading-6 text-ink-950">
                {warehouse.address || "Belum ada alamat tercatat."}
              </dd>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/60 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">
                  Kebijakan saldo stok negatif
                </dt>
                <dd className="mt-0.5 font-semibold text-ink-950">
                  {warehouse.allow_negative_stock
                    ? "Stok negatif diizinkan pada gudang ini"
                    : "Ditolak ketat (transaksi keluar tidak boleh melebihi saldo fisik)"}
                </dd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
            <Calendar aria-hidden="true" size={14} />
            <span>Terakhir diperbarui: {formatDateTime(warehouse.updated_at)}</span>
          </div>
        </dl>

        <BarcodeStickerSheet
          badgeText="LABEL GUDANG WMS"
          code={warehouse.code}
          format={codeFormat}
          metaLabel={warehouse.allow_negative_stock ? "Stok Negatif: Aktif" : "Stok Negatif: Ketat"}
          secondaryCode={warehouse.code}
          title={warehouse.name}
          visibleOnScreen={showStickerPreview}
        />

        <div className="no-print mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
            onClick={handlePrintWarehouseSticker}
            type="button"
          >
            <Printer aria-hidden="true" size={16} />
            Cetak Label Gudang
          </button>
          {canManage && (
            <>
              <button
                className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-semibold transition ${
                  warehouse.is_active
                    ? "border-red-600/40 bg-surface-0 text-red-700 hover:bg-red-100"
                    : "border-teal-600/40 bg-surface-0 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={() => {
                  onClose();
                  onToggleStatus(warehouse);
                }}
                type="button"
              >
                {warehouse.is_active ? (
                  <>
                    <PowerOff aria-hidden="true" size={16} />
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <RotateCcw aria-hidden="true" size={16} />
                    Aktifkan kembali
                  </>
                )}
              </button>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
                onClick={() => {
                  onClose();
                  onEdit(warehouse);
                }}
                type="button"
              >
                <Edit3 aria-hidden="true" size={16} />
                Ubah gudang
              </button>
            </>
          )}
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
