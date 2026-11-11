import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Save, X } from "lucide-react";
import { BarcodeScannerModal } from "@/components/ui/BarcodeScannerModal";
import type { StockFormPayload, StockItem } from "../types";
import { CODE_REGEX } from "../../validation";

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
  onSubmit: (payload: StockFormPayload) => void;
  categoryOptions?: CategoryOption[];
  uomOptions?: UomOption[];
  existingItems?: StockItem[];
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
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedSku = sku.trim();
    const trimmedBarcode = barcode.trim();
    const trimmedName = name.trim();
    const nextErrors: typeof errors = {};

    if (!trimmedSku) {
      nextErrors.sku = "Kode SKU wajib diisi (1 sampai 64 karakter).";
    } else if (!CODE_REGEX.test(trimmedSku)) {
      nextErrors.sku =
        "SKU hanya boleh berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung.";
    } else if (
      existingItems.some(
        (item) =>
          item.sku.toLowerCase() === trimmedSku.toLowerCase() &&
          (mode === "create" || item.id !== initialItem?.id),
      )
    ) {
      nextErrors.sku = "SKU sudah digunakan.";
    }
    if (trimmedBarcode) {
      if (trimmedBarcode.length > 64 || !CODE_REGEX.test(trimmedBarcode)) {
        nextErrors.barcode =
          "Barcode hanya boleh berisi huruf, angka, titik, garis bawah, garis miring, atau tanda hubung (maks. 64 karakter).";
      } else if (
        existingItems.some(
          (item) =>
            item.barcode &&
            item.barcode.toLowerCase() === trimmedBarcode.toLowerCase() &&
            (mode === "create" || item.id !== initialItem?.id),
        )
      ) {
        nextErrors.barcode = "Barcode sudah digunakan pada barang lain.";
      }
    }
    if (!trimmedName) {
      nextErrors.name = "Nama barang wajib diisi (1 sampai 200 karakter).";
    } else if (trimmedName.length > 200) {
      nextErrors.name = "Nama barang maksimal terdiri dari 200 karakter.";
    }
    if (description.trim().length > 1000) {
      nextErrors.description = "Deskripsi barang maksimal terdiri dari 1.000 karakter.";
    }
    if (!categoryId || !availableCategoryOptions.some((category) => category.id === categoryId)) {
      nextErrors.category = "Pilih kategori aktif.";
    }
    if (!uomId || !availableUomOptions.some((uom) => uom.id === uomId)) {
      nextErrors.uom = "Pilih satuan ukur aktif.";
    }

    if (
      nextErrors.sku ||
      nextErrors.barcode ||
      nextErrors.name ||
      nextErrors.description ||
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
    onSubmit({
      sku: trimmedSku,
      barcode: trimmedBarcode || null,
      name: trimmedName,
      description: description.trim() || null,
      category_id: selectedCategory.id,
      category_name: selectedCategory.name,
      uom_id: selectedUom.id,
      uom_code: selectedUom.code,
      uom_name: selectedUom.name,
      allow_decimal: selectedUom.allow_decimal,
      is_active: isActive,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        aria-labelledby="stock-form-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-lg)] border border-line-200 bg-surface-0 p-5 shadow-[var(--shadow-2)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line-200 pb-4">
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
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-700 transition hover:bg-canvas-50 hover:text-ink-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="stock-sku-input"
              >
                Kode SKU <span className="text-red-700">*</span>
              </label>
              <input
                aria-invalid={Boolean(errors.sku)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="stock-sku-input"
                maxLength={64}
                onChange={(event) => setSku(event.target.value)}
                placeholder="Contoh: ELK-MCU-001"
                ref={skuInputRef}
                type="text"
                value={sku}
              />
              {errors.sku && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {errors.sku}
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
                aria-invalid={Boolean(errors.name)}
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="stock-name-input"
                maxLength={200}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Microcontroller ESP32-S3"
                type="text"
                value={name}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-700">
                  {errors.name}
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
            <div className="mt-2 flex gap-2">
              <input
                aria-invalid={Boolean(errors.barcode)}
                className="h-12 flex-1 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-semibold text-ink-950 tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                id="stock-barcode-input"
                maxLength={64}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Opsional · Contoh: 8991001000011"
                type="text"
                value={barcode}
              />
              <button
                aria-label="Pindai barcode dengan kamera atau scanner"
                className="inline-flex min-h-12 items-center gap-1.5 rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-xs font-semibold text-ink-950 hover:bg-canvas-50"
                onClick={() => setScannerOpen(true)}
                type="button"
              >
                <Camera aria-hidden="true" size={16} />
                Pindai
              </button>
            </div>
            {errors.barcode && (
              <p className="mt-1.5 text-xs font-medium text-red-700">
                {errors.barcode}
              </p>
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
              {errors.category && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.category}</p>}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink-950"
                htmlFor="stock-uom-select"
              >
                Satuan ukur dasar (UoM)
              </label>
              <select
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
              {errors.uom && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.uom}</p>}
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
              className="mt-2 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 p-3.5 text-sm leading-6 text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              id="stock-desc-input"
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan spesifikasi teknis barang..."
              rows={2}
              value={description}
            />
            {errors.description && <p className="mt-1.5 text-xs font-medium text-red-700">{errors.description}</p>}
          </div>

          <div>
            <label
              className="text-sm font-semibold text-ink-950"
              htmlFor="stock-status-select"
            >
              Status barang
            </label>
            <select
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-3.5 text-sm font-medium text-ink-950 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-200 pt-4">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line-500 bg-surface-0 px-4 text-sm font-semibold text-ink-950 transition hover:bg-canvas-50"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-600 px-4 text-sm font-semibold text-surface-0 transition hover:bg-teal-700"
              type="submit"
            >
              <Save aria-hidden="true" size={16} />
              {mode === "create" ? "Simpan barang" : "Simpan perubahan"}
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
