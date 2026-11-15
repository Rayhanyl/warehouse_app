import { useState } from "react";
import {
  Calendar,
  Edit3,
  FileText,
  Layers,
  PowerOff,
  Printer,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { StickerPrintDialog } from "@/components/shared/StickerPrintDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function StockDetailDialog({ item, ...rest }: StockDetailDialogProps) {
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

  const scanCode = item.barcode || item.sku;

  function handlePrintSticker() {
    toast.dismiss();
    setShowStickerPreview(true);
    window.print();
  }

  return (
    <StickerPrintDialog
      closeAriaLabel="Tutup detail barang"
      description="Detail katalog barang (SKU), visual kode pemindaian, dan pengaturan cetak stiker label."
      footer={
        <>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setShowStickerPreview((prev) => !prev)}
            variant="outline"
          >
            <SlidersHorizontal aria-hidden="true" size={16} />
            <span>
              {showStickerPreview ? "Tutup Pratinjau Ukuran" : "Atur Ukuran & Pratinjau"}
            </span>
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handlePrintSticker}
            variant="outline"
          >
            <Printer aria-hidden="true" size={16} />
            <span>Cetak Label Barcode</span>
          </Button>
          {canManage && (
            <>
              <Button
                className={`w-full sm:w-auto ${
                  item.is_active
                    ? "border-red-600/40 text-red-700 hover:bg-red-100"
                    : "border-teal-600/40 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={() => {
                  onClose();
                  onToggleStatus(item);
                }}
                variant="outline"
              >
                {item.is_active ? (
                  <>
                    <PowerOff aria-hidden="true" size={16} />
                    <span>Nonaktifkan</span>
                  </>
                ) : (
                  <>
                    <RotateCcw aria-hidden="true" size={16} />
                    <span>Aktifkan kembali</span>
                  </>
                )}
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
              >
                <Edit3 aria-hidden="true" size={16} />
                <span>Ubah barang</span>
              </Button>
            </>
          )}
          <Button
            className="w-full sm:w-auto"
            onClick={onClose}
            variant="outline"
          >
            Tutup
          </Button>
        </>
      }
      headerMeta={
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="tabular-nums" variant="outline">
            ID #{item.id}
          </Badge>
          <Badge className="font-bold tabular-nums" variant="info">
            {item.sku}
          </Badge>
          {item.barcode ? (
            <Badge className="tabular-nums" variant="outline">
              Barcode: {item.barcode}
            </Badge>
          ) : null}
          <StatusBadge status={item.is_active ? "ACTIVE" : "INACTIVE"} />
        </div>
      }
      metadataSection={
        <dl className="space-y-4 text-sm">
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-muted/45 p-3.5 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <dt className="text-xs font-semibold text-ink-950">
                  Visual Barcode Pemindaian
                </dt>
                <Badge className="rounded px-1.5 py-0.5 text-[10px] font-bold" variant="secondary">
                  {codeFormat === "qr" ? "QR Code 2D" : "1D Code-128 / EAN-13"}
                </Badge>
              </div>
              <dd className="mt-0.5 text-xs text-slate-600">
                {item.barcode
                  ? "Standar EAN-13 / Code-128 / QR siap pindai"
                  : "Menggunakan kode SKU sebagai identitas cetak"}
              </dd>
              <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-card p-0.5 text-xs">
                <button
                  className={`rounded px-2.5 py-0.5 font-semibold transition ${
                    codeFormat === "barcode"
                      ? "bg-teal-600 text-surface-0 shadow-xs"
                      : "text-slate-600 hover:text-ink-950"
                  }`}
                  onClick={() => setCodeFormat("barcode")}
                  type="button"
                >
                  Barcode (1D)
                </button>
                <button
                  className={`rounded px-2.5 py-0.5 font-semibold transition ${
                    codeFormat === "qr"
                      ? "bg-teal-600 text-surface-0 shadow-xs"
                      : "text-slate-600 hover:text-ink-950"
                  }`}
                  onClick={() => setCodeFormat("qr")}
                  type="button"
                >
                  QR Code (2D)
                </button>
              </div>
            </div>
            <div className="max-w-full overflow-x-auto">
              {codeFormat === "qr" ? (
                <QrCodeVisual
                  className="border border-border"
                  size={76}
                  value={scanCode}
                />
              ) : (
                <BarcodeVisual
                  className="border border-border"
                  height={40}
                  value={scanCode}
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div>
              <dt className="text-xs font-medium text-slate-600">Deskripsi barang</dt>
              <dd className="mt-1 leading-6 text-ink-950">
                {item.description || "Belum ada deskripsi barang."}
              </dd>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Layers aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={16} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Kategori</dt>
                <dd className="mt-0.5 font-semibold text-ink-950">{item.category_name}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Ruler aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={16} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Satuan dasar</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {item.uom_code} ({item.uom_name})
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Layers aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" size={16} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Batas stok kritis (Min. Stok)</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {Number(item.min_stock ?? 0).toLocaleString("id-ID")} {item.uom_code}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar aria-hidden="true" className="mt-0.5 shrink-0 text-slate-600" size={16} />
              <div>
                <dt className="text-xs font-medium text-slate-600">Terakhir diperbarui</dt>
                <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">
                  {formatDateTime(item.updated_at)}
                </dd>
              </div>
            </div>
          </div>
        </dl>
      }
      onClose={onClose}
      open={true}
      stickerSection={
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
          secondaryLabel="SKU"
          title={item.name}
          visibleOnScreen={showStickerPreview}
        />
      }
      title={item.name}
      titleId="stock-detail-title"
    />
  );
}
