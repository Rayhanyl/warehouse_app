import { Camera, Sparkles } from "lucide-react";
import { BarcodeVisual } from "@/components/ui/BarcodeVisual";

interface StockBarcodeFieldProps {
  barcode: string;
  sku: string;
  error?: string;
  disabled: boolean;
  onBarcodeChange: (value: string) => void;
  onOpenScanner: () => void;
  onGenerateBarcode: () => void;
}

/** Input barcode barang lengkap dengan tombol pindai kamera, generator otomatis, dan pratinjau visual. */
export function StockBarcodeField({
  barcode,
  sku,
  error,
  disabled,
  onBarcodeChange,
  onOpenScanner,
  onGenerateBarcode,
}: StockBarcodeFieldProps) {
  return (
    <div>
      <label
        className="text-sm font-semibold text-ink-950"
        htmlFor="stock-barcode-input"
      >
        Barcode (EAN / UPC / Code-128)
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          aria-invalid={Boolean(error)}
          className="h-12 min-w-[180px] flex-1 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
          disabled={disabled}
          id="stock-barcode-input"
          maxLength={64}
          onChange={(event) => onBarcodeChange(event.target.value)}
          placeholder="Opsional · Contoh: 8991001000011"
          type="text"
          value={barcode}
        />
        <button
          aria-label="Pindai barcode dengan kamera atau scanner"
          className="inline-flex min-h-12 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-50 disabled:opacity-50"
          disabled={disabled}
          onClick={onOpenScanner}
          type="button"
        >
          <Camera aria-hidden="true" size={16} />
          Pindai
        </button>
        <button
          aria-label="Generate barcode internal otomatis"
          className="inline-flex min-h-12 items-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/40 bg-teal-50/60 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 hover:text-teal-950 disabled:opacity-50"
          disabled={disabled}
          onClick={onGenerateBarcode}
          type="button"
        >
          <Sparkles aria-hidden="true" size={15} />
          Generate
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>
      )}
      {(barcode.trim() || sku.trim()) && (
        <div className="mt-2.5 flex flex-col items-start justify-between gap-3 rounded-[var(--radius-md)] border border-line-200 bg-canvas-50/70 px-3 py-2 sm:flex-row sm:items-center">
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-ink-950">Pratinjau Visual Barcode</p>
            <p className="mt-0.5">
              {barcode.trim()
                ? "Menggunakan kode Barcode barang"
                : "Fallback menggunakan kode SKU"}
            </p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <BarcodeVisual
              className="border border-line-200"
              height={34}
              value={barcode.trim() || sku.trim()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
