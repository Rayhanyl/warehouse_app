import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Save, Sparkles, X } from "lucide-react";
import { BarcodeScannerModal } from "@/components/ui/BarcodeScannerModal";
import { BarcodeVisual } from "@/components/ui/BarcodeVisual";
import { MasterFormErrorBanner } from "../../components/MasterFormErrorBanner";
import type { MasterFormSubmitError } from "../../errors";
import type { StockFormPayload, StockItem } from "../types";
import { itemFormSchema, validateZodSchema } from "../../validation";
import { generateInternalBarcode } from "../utils/barcode";

interface CategoryOption {
  id: number;
  name: string;
}

interface UomOption {
  id: number;
  code: string;
  name: string;
  allow_decimal: boolean;
}

interface StockFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialItem: StockItem | null;
  onClose: () => void;
  onSubmit: (payload: StockFormPayload) => Promise<void> | void;
  categoryOptions?: CategoryOption[];
  uomOptions?: UomOption[];
  existingItems?: StockItem[];
  isSubmitting?: boolean;
  submitError?: MasterFormSubmitError | null;
}

export function StockFormDialog({
  isOpen,
  mode,
  initialItem,
  onClose,
  onSubmit,
  categoryOptions = [],
  uomOptions = [],
  existingItems = [],
  isSubmitting = false,
  submitError = null,
}: StockFormDialogProps) {
  const availableCategoryOptions = categoryOptions;
  const availableUomOptions = uomOptions;
  const [sku, setSku] = useState(() => initialItem?.sku ?? "");
  const [barcode, setBarcode] = useState(() => initialItem?.barcode ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [name, setName] = useState(() => initialItem?.name ?? "");
  const [description, setDescription] = useState(
    () => initialItem?.description ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    () => initialItem?.category_id ?? availableCategoryOptions[0]?.id ?? 0,
  );
  const [uomId, setUomId] = useState(
    () => initialItem?.uom_id ?? availableUomOptions[0]?.id ?? 0,
  );
  const [isActive, setIsActive] = useState(
    () => initialItem?.is_active ?? true,
  );
  const [errors, setErrors] = useState<{
    sku?: string;
    barcode?: string;
    name?: string;
    description?: string;
    category?: string;
    uom?: string;
  }>({});
  const skuInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timer = window.setTimeout(() => {
      skuInputRef.current?.focus();
    }, 20);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  const mergedErrors = {
    sku: errors.sku ?? submitError?.fieldErrors?.sku,
    barcode: errors.barcode ?? submitError?.fieldErrors?.barcode,
    name: errors.name ?? submitError?.fieldErrors?.name,
    description: errors.description ?? submitError?.fieldErrors?.description,
    category: errors.category ?? submitError?.fieldErrors?.category,
    uom: errors.uom ?? submitError?.fieldErrors?.uom,
  };

  if (!isOpen) {
    return null;
  }

  function handleGenerateBarcode() {
    const existingBarcodes = existingItems.map((item) => item.barcode);
    const newBarcode = generateInternalBarcode(existingBarcodes);
    setBarcode(newBarcode);
    setErrors((prev) => ({ ...prev, barcode: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateZodSchema(itemFormSchema, {
      sku,
      barcode,
      name,
      description,
      category_id: categoryId,
      uom_id: uomId,
      is_active: isActive,
    });
    const nextErrors: typeof errors = parsed.ok
      ? {}
      : {
          sku: parsed.fieldErrors.sku,
          barcode: parsed.fieldErrors.barcode,
          name: parsed.fieldErrors.name,
          description: parsed.fieldErrors.description,
          category: parsed.fieldErrors.category_id,
          uom: parsed.fieldErrors.uom_id,
        };

    const trimmedSku = sku.trim();
    const trimmedBarcode = barcode.trim();
    if (
      !nextErrors.sku &&
      existingItems.some(
        (item) =>
          item.sku.toLowerCase() === trimmedSku.toLowerCase() &&
          (mode === "create" || item.id !== initialItem?.id),
      )
    ) {
      nextErrors.sku = "SKU sudah digunakan.";
    }
    if (
      trimmedBarcode &&
      !nextErrors.barcode &&
      existingItems.some(
        (item) =>
          item.barcode &&
          item.barcode.toLowerCase() === trimmedBarcode.toLowerCase() &&
          (mode === "create" || item.id !== initialItem?.id),
      )
    ) {
      nextErrors.barcode = "Barcode sudah digunakan pada barang lain.";
    }
    if (!categoryId || !availableCategoryOptions.some((category) => category.id === categoryId)) {
      nextErrors.category = "Pilih kategori aktif.";
    }
    if (!uomId || !availableUomOptions.some((uom) => uom.id === uomId)) {
      nextErrors.uom = "Pilih satuan ukur aktif.";
    }

    if (
      !parsed.ok ||
      nextErrors.sku ||
      nextErrors.barcode ||
      nextErrors.category ||
      nextErrors.uom
    ) {
      setErrors(nextErrors);
      return;
    }

    const selectedCategory = availableCategoryOptions.find((cat) => cat.id === categoryId);
    const selectedUom = availableUomOptions.find((u) => u.id === uomId);
    if (!selectedCategory || !selectedUom) {
      return;
    }

    setErrors({});
    void onSubmit({
      sku: parsed.data.sku,
      barcode: parsed.data.barcode || null,
      name: parsed.data.name,
      description: parsed.data.description || null,
      category_id: selectedCategory.id,
      category_name: selectedCategory.name,
      uom_id: selectedUom.id,
      uom_code: selectedUom.code,
      uom_name: selectedUom.name,
      allow_decimal: selectedUom.allow_decimal,
      is_active: parsed.data.is_active,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-2 sm:p-4"
      onMouseDown={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        aria-labelledby="stock-form-title"
        aria-modal="true"
        className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 shadow-[var(--shadow-2)] sm:max-h-[92vh]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line-200 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-ink-950" id="stock-form-title">
              {mode === "create"
                ? "Tambah barang (SKU)"
                : "Ubah barang (SKU)"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-700">
              Daftarkan barang ke dalam satu kategori aktif dan satu satuan ukur dasar.
            </p>
          </div>
          <button
            aria-label="Tutup formulir barang"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col overflow-hidden" noValidate onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <MasterFormErrorBanner error={submitError} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="stock-sku-input"
              >
                Kode SKU <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.sku)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="stock-sku-input"
                maxLength={64}
                onChange={(event) => setSku(event.target.value)}
                placeholder="Contoh: ELK-MCU-001"
                ref={skuInputRef}
                type="text"
                value={sku}
              />
              {mergedErrors.sku && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {mergedErrors.sku}
                </p>
              )}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="stock-name-input"
              >
                Nama barang <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(mergedErrors.name)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="stock-name-input"
                maxLength={200}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Microcontroller ESP32-S3"
                type="text"
                value={name}
              />
              {mergedErrors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {mergedErrors.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="stock-barcode-input"
            >
              Barcode (EAN / UPC / Code-128)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                aria-invalid={Boolean(mergedErrors.barcode)}
                className="h-12 min-w-[180px] flex-1 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="stock-barcode-input"
                maxLength={64}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Opsional · Contoh: 8991001000011"
                type="text"
                value={barcode}
              />
              <button
                aria-label="Pindai barcode dengan kamera atau scanner"
                className="inline-flex min-h-12 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-50 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => setScannerOpen(true)}
                type="button"
              >
                <Camera aria-hidden="true" size={16} />
                Pindai
              </button>
              <button
                aria-label="Generate barcode internal otomatis"
                className="inline-flex min-h-12 items-center gap-1.5 rounded-[var(--radius-md)] border border-teal-600/40 bg-teal-50/60 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 hover:text-teal-950 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={handleGenerateBarcode}
                type="button"
              >
                <Sparkles aria-hidden="true" size={15} />
                Generate
              </button>
            </div>
            {mergedErrors.barcode && (
              <p className="mt-1.5 text-xs font-medium text-red-700">
                {mergedErrors.barcode}
              </p>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="stock-category-select"
              >
                Kategori barang
              </label>
              <select
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="stock-category-select"
                onChange={(event) => setCategoryId(Number(event.target.value))}
                value={categoryId}
              >
                {availableCategoryOptions.length === 0 ? (
                  <option value="">Tidak ada kategori aktif</option>
                ) : availableCategoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {mergedErrors.category && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.category}</p>}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="stock-uom-select"
              >
                Satuan ukur dasar (UoM)
              </label>
              <select
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
                disabled={isSubmitting}
                id="stock-uom-select"
                onChange={(event) => setUomId(Number(event.target.value))}
                value={uomId}
              >
                {availableUomOptions.length === 0 ? (
                  <option value="">Tidak ada satuan ukur aktif</option>
                ) : availableUomOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} ({u.name})
                  </option>
                ))}
              </select>
              {mergedErrors.uom && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.uom}</p>}
            </div>
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="stock-desc-input"
            >
              Deskripsi barang
            </label>
            <textarea
              className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
              disabled={isSubmitting}
              id="stock-desc-input"
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan spesifikasi teknis barang..."
              rows={2}
              value={description}
            />
            {mergedErrors.description && <p className="mt-1.5 text-xs font-medium text-red-700">{mergedErrors.description}</p>}
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="stock-status-select"
            >
              Status barang
            </label>
            <select
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:opacity-60"
              disabled={isSubmitting}
              id="stock-status-select"
              onChange={(event) =>
                setIsActive(event.target.value === "active")
              }
              value={isActive ? "active" : "inactive"}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line-200 bg-surface-0 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50 disabled:opacity-50 sm:w-auto"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting}
              type="submit"
            >
              <Save aria-hidden="true" size={16} />
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan barang"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={(code) => setBarcode(code)}
          title="Pindai Barcode Barang"
        />
      </div>
    </div>
  );
}
