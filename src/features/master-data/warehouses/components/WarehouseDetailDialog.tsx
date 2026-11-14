import { useState } from "react";
import {
  Calendar,
  Edit3,
  MapPin,
  PowerOff,
  Printer,
  RotateCcw,
  ShieldAlert,
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
  ...rest
}: WarehouseDetailDialogProps) {
  if (!warehouse) {
    return null;
  }
  return (
    <WarehouseDetailDialogContent
      key={warehouse.id}
      warehouse={warehouse}
      {...rest}
    />
  );
}

function WarehouseDetailDialogContent({
  warehouse,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}: Omit<WarehouseDetailDialogProps, "warehouse"> & {
  warehouse: WarehouseRecord;
}) {
  const [showStickerPreview, setShowStickerPreview] = useState(false);
  const [codeFormat, setCodeFormat] = useState<"qr" | "barcode">("qr");
  const [printConfig, setPrintConfig] = useState<BarcodePrintConfig>(() =>
    createConfigFromPreset("100x50"),
  );

  function handlePrintWarehouseSticker() {
    toast.dismiss();
    setShowStickerPreview(true);
    window.print();
  }

  return (
    <StickerPrintDialog
      closeAriaLabel="Tutup detail gudang"
      description="Informasi identitas gudang, kebijakan saldo negatif, dan cetak label gudang."
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
            onClick={handlePrintWarehouseSticker}
            variant="outline"
          >
            <Printer aria-hidden="true" size={16} />
            <span>Cetak Label Gudang</span>
          </Button>
          {canManage && (
            <>
              <Button
                className={`w-full sm:w-auto ${
                  warehouse.is_active
                    ? "border-red-600/40 text-red-700 hover:bg-red-100"
                    : "border-teal-600/40 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={() => {
                  onClose();
                  onToggleStatus(warehouse);
                }}
                variant="outline"
              >
                {warehouse.is_active ? (
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
                  onEdit(warehouse);
                }}
              >
                <Edit3 aria-hidden="true" size={16} />
                <span>Ubah gudang</span>
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
            ID #{warehouse.id}
          </Badge>
          <Badge className="font-bold tabular-nums" variant="info">
            {warehouse.code}
          </Badge>
          <StatusBadge status={warehouse.is_active ? "ACTIVE" : "INACTIVE"} />
        </div>
      }
      metadataSection={
        <dl className="space-y-4 text-sm">
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-muted/45 p-3.5 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <dt className="text-xs font-semibold text-ink-950">
                  Barcode & QR Identitas Gudang
                </dt>
                <Badge className="rounded px-1.5 py-0.5 text-[10px] font-bold" variant="secondary">
                  {codeFormat === "qr" ? "QR Code 2D" : "1D Code-128"}
                </Badge>
              </div>
              <dd className="mt-0.5 text-xs text-slate-600">
                Pindai untuk menampilkan seluruh ringkasan stok di gudang ini
              </dd>
              <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-card p-0.5 text-xs">
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
              </div>
            </div>
            <div className="max-w-full overflow-x-auto">
              {codeFormat === "qr" ? (
                <QrCodeVisual
                  className="border border-border"
                  size={76}
                  value={warehouse.code}
                />
              ) : (
                <BarcodeVisual
                  className="border border-border"
                  height={38}
                  value={warehouse.code}
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={18} />
            <div>
              <dt className="text-xs font-medium text-slate-600">Alamat gudang</dt>
              <dd className="mt-1 leading-6 text-ink-950">
                {warehouse.address || "Belum ada alamat tercatat."}
              </dd>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0 text-teal-700" size={16} />
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
      }
      onClose={onClose}
      open={true}
      stickerSection={
        <BarcodePrintConfigurator
          badgeText="LABEL GUDANG WMS"
          code={warehouse.code}
          config={printConfig}
          defaultPresetId="100x50"
          format={codeFormat}
          metaLabel={warehouse.allow_negative_stock ? "Stok Negatif: Aktif" : "Stok Negatif: Ketat"}
          onConfigChange={setPrintConfig}
          onFormatChange={setCodeFormat}
          onPrint={handlePrintWarehouseSticker}
          secondaryCode={warehouse.code}
          title={warehouse.name}
          visibleOnScreen={showStickerPreview}
        />
      }
      title={warehouse.name}
      titleId="warehouse-detail-title"
    />
  );
}
