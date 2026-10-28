import { FormEvent, useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import { sampleCategoryOptions, sampleUomOptions } from "../api";
import type { StockFormPayload, StockItem } from "../types";

interface StockFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialItem: StockItem | null;
  onClose: () => void;
  onSubmit: (payload: StockFormPayload) => void;
}

export function StockFormDialog({
  isOpen,
  mode,
  initialItem,
  onClose,
  onSubmit,
}: StockFormDialogProps) {
  const [sku, setSku] = useState(() => initialItem?.sku ?? "");
  const [name, setName] = useState(() => initialItem?.name ?? "");
  const [description, setDescription] = useState(
    () => initialItem?.description ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    () => initialItem?.category_id ?? sampleCategoryOptions[0].id,
  );
  const [uomId, setUomId] = useState(
    () => initialItem?.uom_id ?? sampleUomOptions[0].id,
  );
  const [isActive, setIsActive] = useState(
    () => initialItem?.is_active ?? true,
  );
  const [errors, setErrors] = useState<{ sku?: string; name?: string }>({});
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
    const trimmedName = name.trim();
    const nextErrors: { sku?: string; name?: string } = {};

    if (!trimmedSku) {
      nextErrors.sku = "Kode SKU wajib diisi (1 sampai 64 karakter).";
    }
    if (!trimmedName) {
      nextErrors.name = "Nama barang wajib diisi (1 sampai 200 karakter).";
    }

    if (nextErrors.sku || nextErrors.name) {
      setErrors(nextErrors);
      return;
    }

    const selectedCategory =
      sampleCategoryOptions.find((cat) => cat.id === categoryId) ??
      sampleCategoryOptions[0];
    const selectedUom =
      sampleUomOptions.find((u) => u.id === uomId) ?? sampleUomOptions[0];

    setErrors({});
    onSubmit({
      sku: trimmedSku,
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
                {sampleCategoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
                {sampleUomOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} ({u.name})
                  </option>
                ))}
              </select>
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
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan spesifikasi teknis barang..."
              rows={2}
              value={description}
            />
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
      </div>
    </div>
  );
}
