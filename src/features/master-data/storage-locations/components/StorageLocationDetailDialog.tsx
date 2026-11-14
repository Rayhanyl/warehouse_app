import { useState } from "react";
import { Edit3, Printer, SlidersHorizontal } from "lucide-react";
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
  ...rest
}: StorageLocationDetailDialogProps) {
  if (!location) {
    return null;
  }
  return (
    <StorageLocationDetailDialogContent
      key={location.id}
      location={location}
      {...rest}
    />
  );
}

function StorageLocationDetailDialogContent({
  location,
  canManage,
  onClose,
  onEdit,
}: Omit<StorageLocationDetailDialogProps, "location"> & {
  location: StorageLocationRecord;
}) {
  const [showStickerPreview, setShowStickerPreview] = useState(false);
  const [codeFormat, setCodeFormat] = useState<"qr" | "barcode">("qr");
  const [printConfig, setPrintConfig] = useState<BarcodePrintConfig>(() =>
    createConfigFromPreset("70x40"),
  );

  function handlePrintRackSticker() {
    toast.dismiss();
    setShowStickerPreview(true);
    window.print();
  }

  return (
    <StickerPrintDialog
      closeAriaLabel="Tutup dialog detail lokasi penyimpanan"
      description="Informasi kode rak penyimpanan, gudang induk, dan konfigurasi cetak label lokasi."
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
            onClick={handlePrintRackSticker}
            variant="outline"
          >
            <Printer aria-hidden="true" size={16} />
            <span>Cetak Label Rak</span>
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={onClose}
            variant="outline"
          >
            Tutup
          </Button>
          {canManage ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                onClose();
                onEdit(location);
              }}
            >
              <Edit3 aria-hidden="true" size={16} />
              <span>Edit lokasi</span>
            </Button>
          ) : null}
        </>
      }
      headerMeta={
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Detail lokasi penyimpanan
        </p>
      }
      metadataSection={
        <dl className="divide-y divide-border text-sm">
          <div className="flex flex-col items-start justify-between gap-3 pb-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <dt className="font-semibold text-ink-950">Barcode Lokasi Rak</dt>
                <Badge className="rounded px-1.5 py-0.5 text-[10px] font-bold" variant="secondary">
                  {codeFormat === "qr" ? "QR Code 2D" : "1D Code-128"}
                </Badge>
              </div>
              <dd className="mt-0.5 text-xs text-slate-600">
                Pindai untuk menampilkan seluruh macam barang (SKU) di rak ini
              </dd>
              <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5 text-xs">
                <button
                  className={`rounded px-2 py-0.5 font-semibold transition ${
                    codeFormat === "qr"
                      ? "bg-teal-700 text-surface-0 shadow-xs"
                      : "text-slate-600 hover:text-ink-950"
                  }`}
                  onClick={() => setCodeFormat("qr")}
                  type="button"
                >
                  QR Code (2D)
                </button>
                <button
                  className={`rounded px-2 py-0.5 font-semibold transition ${
                    codeFormat === "barcode"
                      ? "bg-teal-700 text-surface-0 shadow-xs"
                      : "text-slate-600 hover:text-ink-950"
                  }`}
                  onClick={() => setCodeFormat("barcode")}
                  type="button"
                >
                  Barcode (1D)
                </button>
              </div>
            </div>
            <div className="max-w-full overflow-x-auto">
              {codeFormat === "qr" ? (
                <QrCodeVisual
                  className="border border-border"
                  size={76}
                  value={location.code}
                />
              ) : (
                <BarcodeVisual
                  className="border border-border"
                  height={38}
                  value={location.code}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Kode lokasi</dt>
            <dd className="font-mono font-semibold text-ink-950 sm:col-span-2">
              {location.code}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Nama lokasi</dt>
            <dd className="font-semibold text-ink-950 sm:col-span-2">{location.name}</dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Gudang induk</dt>
            <dd className="text-ink-950 sm:col-span-2">
              <span className="font-mono font-semibold">{location.warehouse_code}</span> (
              {location.warehouse_name})
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-slate-600">Status</dt>
            <dd className="sm:col-span-2">
              <StatusBadge status={location.is_active ? "ACTIVE" : "INACTIVE"} />
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
      }
      onClose={onClose}
      open={true}
      stickerSection={
        <BarcodePrintConfigurator
          badgeText="LABEL LOKASI RAK"
          code={location.code}
          config={printConfig}
          defaultPresetId="70x40"
          format={codeFormat}
          metaLabel={`GUDANG: ${location.warehouse_code}`}
          onConfigChange={setPrintConfig}
          onFormatChange={setCodeFormat}
          onPrint={handlePrintRackSticker}
          secondaryCode={location.warehouse_name}
          title={`${location.code} · ${location.name}`}
          visibleOnScreen={showStickerPreview}
        />
      }
      title={location.name}
      titleId="storage-location-detail-title"
    />
  );
}
