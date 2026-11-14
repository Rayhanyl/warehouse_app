import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  FileText,
  Layers,
  PowerOff,
  Printer,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BarcodePrintConfigurator } from "@/components/ui/BarcodePrintConfigurator";
import { BarcodeVisual, QrCodeVisual } from "@/components/ui/BarcodeVisual";
import {
  type BarcodePrintConfig,
  createConfigFromPreset,
} from "@/components/ui/barcode-print-presets";
import type { StockItem } from "../types";

interface StockDetailDialogProps {
  item: StockItem | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (item: StockItem) => void;
  onToggleStatus: (item: StockItem) => void;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StockDetailDialog({
  item,
  ...rest
}: StockDetailDialogProps) {
  if (!item) {
    return null;
  }
  return <StockDetailDialogContent key={item.id} item={item} {...rest} />;
}

function StockDetailDialogContent({
  item,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}: Omit<StockDetailDialogProps, "item"> & { item: StockItem }) {
  const [showStickerPreview, setShowStickerPreview] = useState(false);
  const [codeFormat, setCodeFormat] = useState<"barcode" | "qr">("barcode");
  const [printConfig, setPrintConfig] = useState<BarcodePrintConfig>(() =>
    createConfigFromPreset("50x30"),
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const scanCode = item.barcode || item.sku;

  function handlePrintSticker() {
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
        aria-labelledby="stock-detail-title"
        aria-modal="true"
        className="print-dialog-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="no-print flex items-start justify-between gap-3 border-b border-line-200 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                ID #{item.id}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 tabular-nums">
                {item.sku}
              </span>
              {item.barcode && (
                <span className="rounded-full bg-canvas-50 px-2.5 py-0.5 text-xs font-semibold text-ink-950 tabular-nums">
                  Barcode: {item.barcode}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.is_active
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <CheckCircle2 aria-hidden="true" size={13} />
                {item.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <h2
              className="mt-2 text-lg font-bold text-ink-950"
              id="stock-detail-title"
            >
              {item.name}
            </h2>
          </div>
          <button
            aria-label="Tutup detail barang"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <dl className="no-print mt-5 space-y-4 text-sm">
          <div className="flex flex-col items-start justify-between gap-3 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/70 p-3.5 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <dt className="text-xs font-semibold text-ink-950">
                  Visual Barcode Pemindaian
                </dt>
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                  {codeFormat === "qr" ? "QR Code 2D" : "1D Code-128 / EAN-13"}
                </span>
              </div>
              <dd className="mt-0.5 text-xs text-slate-600">
                {item.barcode
                  ? "Standar EAN-13 / Code-128 / QR siap pindai"
                  : "Menggunakan kode SKU sebagai identitas cetak"}
              </dd>
              <div className="mt-2 inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-line-300 bg-surface-0 p-0.5 text-xs">
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
              </div>
            </div>
            <div className="max-w-full overflow-x-auto">
              {codeFormat === "qr" ? (
                <QrCodeVisual
                  className="border border-line-200"
                  size={76}
                  value={scanCode}
                />
              ) : (
                <BarcodeVisual
                  className="border border-line-200"
                  height={40}
                  value={scanCode}
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-teal-700"
              size={18}
            />
            <div>
              <dt className="text-xs font-medium text-slate-600">Deskripsi barang</dt>
              <dd className="mt-1 leading-6 text-ink-950">
                {item.description || "Belum ada deskripsi barang."}
              </dd>
            </div>
          </div>

          <div className="grid gap-4 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/60 p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Layers
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Kategori</dt>
                <dd className="mt-0.5 font-semibold text-ink-950">
                  {item.category_name}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Ruler
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-teal-700"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">Satuan dasar</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {item.uom_code} ({item.uom_name})
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Calendar
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-slate-600"
                size={16}
              />
              <div>
                <dt className="text-xs font-medium text-slate-600">
                  Terakhir diperbarui
                </dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {formatDateTime(item.updated_at)}
                </dd>
              </div>
            </div>
          </div>
        </dl>

        <BarcodePrintConfigurator
          badgeText="LABEL BARANG WMS"
          code={scanCode}
          config={printConfig}
          defaultPresetId="50x30"
          format={codeFormat}
          metaLabel={`${item.uom_code} · ${item.category_name}`}
          onConfigChange={setPrintConfig}
          onFormatChange={setCodeFormat}
          onPrint={handlePrintSticker}
          secondaryCode={item.sku}
          title={item.name}
          visibleOnScreen={showStickerPreview}
        />

        <div className="no-print mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-300 bg-canvas-50 px-3.5 text-sm font-semibold text-ink-950 transition hover:bg-canvas-100"
            onClick={() => setShowStickerPreview((prev) => !prev)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={16} />
            {showStickerPreview ? "Tutup Pratinjau Ukuran" : "Atur Ukuran & Pratinjau"}
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
            onClick={handlePrintSticker}
            type="button"
          >
            <Printer aria-hidden="true" size={16} />
            Cetak Label Barcode
          </button>
          {canManage && (
            <>
              <button
                className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-semibold transition ${
                  item.is_active
                    ? "border-red-600/40 bg-surface-0 text-red-700 hover:bg-red-100"
                    : "border-teal-600/40 bg-surface-0 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={() => {
                  onClose();
                  onToggleStatus(item);
                }}
                type="button"
              >
                {item.is_active ? (
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
                  onEdit(item);
                }}
                type="button"
              >
                <Edit3 aria-hidden="true" size={16} />
                Ubah barang
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
